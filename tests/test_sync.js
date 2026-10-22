// Mosse in contemporanea sul Realtime Database (finto ma con la semantica vera delle transazioni).
// Prima: due telefoni che scrivono la stessa versione (rev) si sovrascrivevano in silenzio, e una mossa spariva.
// Ora: la mossa vale solo sullo stato da cui è partita (controllo su rev); nei giochi simultanei si rigioca sullo stato nuovo.
const carica = require('./carica.js'),
  { creaDb, clone, DIST } = require('./rtdb_finto.js');
const MIND = require('../src/js/motori/11-the-mind.js'),
  IT = carica('02-briscola-scopa.js', 'IT');
let SYNC = null;
try {
  SYNC = carica('35-sync.js', 'SYNC');
} catch (e) {
  console.log('SYNC non caricabile:', e.message);
}
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
const CODE = 'TEST',
  ENG = { mind: MIND, briscola: IT.BRIS };
const doc0 = (g, s, rev) => ({
  host: 'x',
  t: 0,
  phase: 'play',
  game: g,
  opts: {},
  seats: [],
  s: Object.assign(s, { g, gid: 'gid1' }),
  rev,
});
const attendi = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // 1) La scrittura semplice della stanza non deve mai cancellare una versione uguale o più recente.
  {
    const db = creaDb(1),
      A = db.cliente('A'),
      B = db.cliente('B');
    IT.setRnd(carica.rng(5));
    const s = IT.BRIS.newGame(2, ['a', 'b'], {});
    db.stanza(CODE, doc0('briscola', s, 3));
    const d = db.leggi(CODE);
    const mA = IT.BRIS.act(d.s, { t: 'play', c: d.s.hands[0][0] }).s,
      mB = IT.BRIS.act(d.s, { t: 'play', c: d.s.hands[0][1] }).s;
    const ris = await Promise.allSettled([
      A.RT.setRoom(CODE, { ...d, s: mA, rev: 4 }),
      B.RT.setRoom(CODE, { ...d, s: mB, rev: 4 }),
    ]);
    const rifiutate = ris.filter(r => r.status === 'rejected' && r.reason.code === 'conflitto').length;
    ck(rifiutate === 1, 'setRoom: di due scritture con la stessa rev ne passa una sola (rifiutate: ' + rifiutate + ')');
    ck(db.leggi(CODE).rev === 4, 'setRoom: la rev resta 4');
  }

  if (!SYNC) {
    ck(false, 'modulo motori/35-sync.js assente');
    return fine();
  }

  // 2) Gioco a turni: due telefoni calcolano una mossa dallo stesso stato (doppio tocco, telefono rimasto indietro).
  {
    const db = creaDb(2),
      A = db.cliente('A'),
      B = db.cliente('B');
    IT.setRnd(carica.rng(7));
    const s = IT.BRIS.newGame(2, ['a', 'b'], {});
    db.stanza(CODE, doc0('briscola', s, 3));
    const base = db.leggi(CODE),
      cur = base.s.cur;
    const mossa = c => ({ base: 3, gid: 'gid1', a: { t: 'play', c }, s: IT.BRIS.act(base.s, { t: 'play', c }).s });
    const m1 = mossa(base.s.hands[cur][0]),
      m2 = mossa(base.s.hands[cur][1]);
    const ris = await Promise.all(
      [A, B].map((c, i) => SYNC.esegui(c.RT.doc('rooms/' + CODE), x => SYNC.mossa(x, i ? m2 : m1, ENG)))
    );
    const buone = ris.filter(r => r.doc).length,
      confl = ris.filter(r => r.code === 'conflitto').length;
    ck(
      buone === 1 && confl === 1,
      'turni: una mossa passa, l’altra è un conflitto (buone ' + buone + ', conflitti ' + confl + ')'
    );
    const fin = db.leggi(CODE);
    ck(fin.rev === 4, 'turni: rev = 4, nessun salto');
    const vincente = ris[0].doc ? m1 : m2;
    ck(
      JSON.stringify(fin.s) === JSON.stringify(vincente.s),
      'turni: lo stato salvato è quello della mossa vincente, senza miscugli'
    );
  }

  // 3) Gioco simultaneo (The Mind): tutti toccano «Pronto» nello stesso istante. Nessun «Pronto» deve andare perso.
  for (const seme of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const db = creaDb(10 + seme),
      N = 4,
      cl = Array.from({ length: N }, (_, i) => db.cliente('P' + i));
    MIND.setRnd(carica.rng(seme));
    const s = MIND.newGame(N, ['a', 'b', 'c', 'd'], {});
    db.stanza(CODE, doc0('mind', s, 1));
    const base = db.leggi(CODE);
    const ris = await Promise.all(
      cl.map((c, i) => {
        const a = { t: 'ready', seat: i },
          m = { base: 1, gid: 'gid1', a, s: MIND.act(base.s, a).s };
        return SYNC.esegui(c.RT.doc('rooms/' + CODE), x => SYNC.mossa(x, m, ENG));
      })
    );
    const fin = db.leggi(CODE);
    if (seme === 1 || !(ris.every(r => r.doc) && fin.rev === 1 + N && fin.s.phase === 'play'))
      ck(
        ris.every(r => r.doc) && fin.rev === 1 + N && fin.s.phase === 'play',
        'Mind seme ' +
          seme +
          ': 4 «Pronto» simultanei -> tutti accettati, rev ' +
          fin.rev +
          ', fase ' +
          fin.s.phase +
          ', riprove ' +
          db.riprove
      );
  }

  // 4) Partita intera: 4 telefoni giocano in parallelo con copie locali in ritardo. Nessuna mossa persa, nessun salto di versione.
  for (const seme of [1, 2, 3, 4, 5, 6]) {
    const db = creaDb(100 + seme, { ms: 4 }),
      N = 3,
      cl = Array.from({ length: N }, (_, i) => db.cliente('P' + i));
    MIND.setRnd(carica.rng(seme * 31));
    const s = MIND.newGame(N, ['a', 'b', 'c'], {});
    db.stanza(CODE, doc0('mind', s, 1));
    const ok = Array(N).fill(0),
      conf = Array(N).fill(0);
    let giri = 0,
      errore = null;
    await Promise.all(
      cl.map(async (c, i) => {
        while (giri++ < 4000 && !errore) {
          const d = c.doc(CODE);
          if (!d || !d.s) {
            await attendi(2);
            continue;
          }
          const st = d.s;
          if (st.over) return;
          let a = null;
          if (st.phase === 'ready' && !st.ready[i]) a = { t: 'ready', seat: i };
          else if (st.phase === 'summary' && i === 0) a = { t: 'next', seat: 0 };
          else if (st.phase === 'play') {
            const k = MIND.lowest(st, i, 'n');
            if (k != null) a = { t: 'play', seat: i, col: 'n' };
          }
          if (!a) {
            await attendi(2);
            continue;
          }
          const r0 = MIND.act(st, a);
          if (r0.err) {
            await attendi(2);
            continue;
          }
          try {
            const e = await SYNC.esegui(c.RT.doc('rooms/' + CODE), x =>
              SYNC.mossa(x, { base: d.rev, gid: 'gid1', a, s: r0.s }, ENG)
            );
            if (e.doc) ok[i]++;
            else if (e.code === 'conflitto') {
              conf[i]++;
              await attendi(3);
            } else await attendi(2);
          } catch (e) {
            errore = e;
          }
        }
      })
    );
    const fin = db.leggi(CODE),
      tot = ok.reduce((x, y) => x + y, 0);
    ck(!errore && fin.s.over, 'partita ' + seme + ': conclusa' + (errore ? ' (errore ' + errore.message + ')' : ''));
    ck(
      fin.rev === 1 + tot,
      'partita ' + seme + ': ogni mossa accettata ha alzato rev di 1 (rev ' + fin.rev + ' = 1 + ' + tot + ')'
    );
    ck(
      conf.every(x => x === 0),
      'partita ' + seme + ': nei giochi simultanei nessun conflitto (' + conf.join(',') + ')'
    );
  }

  // 5) Controlli di sicurezza del modulo
  {
    const cur = doc0('briscola', IT.BRIS.newGame(2, ['a', 'b'], {}), 5),
      m = { base: 5, gid: 'gid1', a: { t: 'play', c: 'x' }, s: { z: 1 } };
    ck(SYNC.mossa(null, m, ENG).code === 'assente', 'stanza sparita');
    ck(SYNC.mossa({ ...cur, phase: 'lobby' }, m, ENG).code === 'fase', 'partita non più in corso');
    ck(SYNC.mossa(cur, { ...m, gid: 'altra' }, ENG).code === 'gid', 'un’altra partita è iniziata');
    ck(SYNC.mossa({ ...cur, rev: 6 }, m, ENG).code === 'conflitto', 'stato avanzato in un gioco a turni: conflitto');
    const ok = SYNC.mossa(cur, m, ENG);
    ck(ok.doc && ok.doc.rev === 6 && ok.doc.s.z === 1, 'stato giusto: accettata, rev +1');
    ck(
      SYNC.partita({ ...cur, phase: 'lobby', s: null }, { patch: { phase: 'play', game: 'uno' } }).doc.rev === 6,
      'avvio dalla lobby'
    );
    ck(
      SYNC.partita(cur, { patch: { phase: 'play' } }).code === 'conflitto',
      'avvio con una partita in corso: rifiutato'
    );
    ck(
      SYNC.partita(cur, { dopo: 'gid1', patch: { phase: 'play', game: 'briscola' } }).doc.rev === 6,
      'rivincita della partita appena giocata'
    );
    ck(
      SYNC.partita(cur, { dopo: 'vecchia', patch: { phase: 'play' } }).code === 'conflitto',
      'rivincita di una partita già sostituita: rifiutata'
    );
    ck(
      SYNC.lobby({ ...cur, phase: 'lobby', s: null }, {}).nulla === true,
      'ritorno alla lobby quando già in lobby: niente da fare'
    );
    ck(SYNC.lobby(cur, { gid: 'gid1' }).doc.phase === 'lobby', 'ritorno alla lobby');
    ck(SYNC.lobby(cur, { gid: 'altra' }).code === 'conflitto', 'ritorno alla lobby di un’altra partita: rifiutato');
  }
  fine();
})().catch(e => {
  console.log('ECCEZIONE', e);
  process.exit(2);
});

function fine() {
  console.log(fails ? fails + ' CONTROLLI FALLITI' : 'ALL OK');
  process.exit(fails ? 1 : 0);
}
