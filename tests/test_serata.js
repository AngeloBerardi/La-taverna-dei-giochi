// Serata (cena con delitto per famiglie): motore motori/36a-serata.js, kit src/kit/*.json con formato «serata».
// Un kit privato (fuori dal repo) si prova con: KIT_PRIVATO=/percorso/kit.json npm test -- serata
// Bot: in ogni pomeriggio i giocatori si mostrano le prove tra famiglie e le appoggiano in bacheca; ogni sera le famiglie
// collegano ciò che vedono e rispondono giusto; al voto il bot «bravo» accusa chi provano le deduzioni, il «casuale» tira a sorte.
const fs = require('fs'),
  path = require('path');
const carica = require('./carica.js'),
  S = carica('36a-serata.js', 'SERATA');
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
const clone = o => JSON.parse(JSON.stringify(o));
const DIR = path.join(__dirname, '../src/kit');
const KIT = fs
  .readdirSync(DIR)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
  .filter(k => k.formato === 'serata');
const gioc = n => Array.from({ length: n }, (_, i) => ({ uid: 'u' + i, nome: 'G' + i }));
const NARR = 'narr';
let ORA = 1e6;
function fai(s, a, k) {
  const r = S.act(s, a, k, ORA);
  if (r.err) throw new Error(a.t + (a.c ? ':' + a.c : '') + ': ' + r.err);
  return r.s;
}
const cmd = (s, k, c, x) => fai(s, { t: 'cmd', uid: NARR, c, ...(x || {}) }, k);
const famDi = (k, pid) => k.personaggi.find(p => p.id === pid).famiglia;
const vede = (s, f, x) =>
  x[0] === '@' ? s.fam[f].ded.includes(x.slice(1)) : s.pub.includes(x) || s.fam[f].bacheca.includes(x);
// nessun segreto nella parte pubblica prima del finale, nessun dossier altrui nelle mani
function controllaSegreti(s, k, dove) {
  const pub = JSON.stringify(S.pubblico(s, k));
  let ok = true;
  if (s.fase !== 'finale' && s.fase !== 'fine') {
    for (const p of k.personaggi) if (p.segreto && pub.includes(p.segreto.slice(0, 40))) ok = false;
    if (pub.includes('"colpevole"')) ok = false;
  }
  const mani = S.mani(s, k);
  for (const [uid, m] of Object.entries(mani)) {
    if (!m.dossier) continue;
    if (m.dossier.id !== s.gioc[uid].pid) ok = false;
    for (const [eid, p] of Object.entries(m.prove.l))
      if (
        p.st !== 'annunciata' &&
        !(s.mie[m.dossier.id][eid] || s.pub.includes(eid) || s.fam[m.dossier.famiglia].bacheca.includes(eid))
      )
        ok = false;
  }
  if (!ok) ck(false, 'segreti al sicuro: ' + dove);
  return ok;
}
// una serata intera giocata dai bot; opz: { bravi, assenti:[pid], esce:{pid, atto}, rnd }
function serata(k, n, opz) {
  opz = opz || {};
  const rnd = opz.rnd || carica.rng(7);
  let r = S.nuova(k, gioc(n), { rnd, narratore: NARR });
  if (r.err) throw new Error(r.err);
  let s = r.s,
    giri = 0,
    sicuro = true;
  // il tempo scorre: poco tra un comando e l'altro, molto alla fine della sera (così le riserve a tempo scattano)
  const tickFino = min => {
    for (let i = 0; i < min * 2; i++) {
      ORA += 30000;
      const t = S.tick(s, k, ORA);
      if (t) s = t.s;
    }
  };
  while (s.fase !== 'fine' && giri++ < 2000) {
    sicuro = controllaSegreti(s, k, s.fase + ' ' + s.atto + ' ' + s.mom) && sicuro;
    if (
      opz.esce &&
      s.fase === 'gioco' &&
      k.atti[s.atto].id === opz.esce.atto &&
      s.di[opz.esce.pid] &&
      !s.usc[opz.esce.pid]
    )
      s = cmd(s, k, 'esce', { pid: opz.esce.pid });
    if (opz.osserva) opz.osserva(s);
    if (
      opz.confessa &&
      s.fase === 'gioco' &&
      k.atti[s.atto].id === opz.confessa &&
      s.mom === 'mattina' &&
      s.riga === 0
    ) {
      // il colpevole confessa troppo presto: la serata deve proseguire lo stesso
      const colp = k.soluzione.colpevole,
        f = famDi(k, colp);
      s = cmd(s, k, 'portavoce', { fam: f, pid: colp });
      s = fai(s, { t: 'dichiara', uid: s.di[colp], testo: 'Sono stato io.', tipo: 'accusa' }, k);
    }
    if (s.fase === 'gioco' && s.mom === 'mattina' && s.riga === 0) {
      // il rappresentante dichiara una scoperta
      for (const f of k.famiglie) {
        const pv = s.fam[f.id].pv;
        if (pv && !s.usc[s.gioc[pv].pid])
          s = fai(s, { t: 'dichiara', uid: pv, testo: 'Abbiamo novità sull’atto ' + (s.atto + 1) }, k);
      }
    }
    if (s.fase === 'gioco' && s.mom === 'pomeriggio') {
      // tempo libero: ognuno mostra le sue prove a tutti e le appoggia in bacheca
      for (const [uid, g] of Object.entries(s.gioc)) {
        if (s.usc[g.pid] || (opz.muti || []).includes(famDi(k, g.pid))) continue;
        for (const eid of Object.keys(s.mie[g.pid])) {
          s = fai(s, { t: 'appoggia', uid, eid }, k);
          for (const [u2, g2] of Object.entries(s.gioc))
            if (u2 !== uid && !s.usc[g2.pid] && !s.mie[g2.pid][eid])
              s = fai(s, { t: 'mostra', uid, eid, a: g2.pid }, k);
        }
      }
      ORA += 1000;
    }
    if (s.fase === 'gioco' && s.mom === 'sera') {
      for (const [uid, g] of Object.entries(s.gioc)) {
        if (s.usc[g.pid]) continue;
        for (const eid of Object.keys(s.mie[g.pid])) s = fai(s, { t: 'appoggia', uid, eid }, k);
      }
      for (const f of k.famiglie) {
        const pv = s.fam[f.id].pv;
        if (!pv) continue;
        let nuovo = true;
        while (nuovo) {
          nuovo = false;
          for (const c of k.collegamenti || []) {
            if (s.fam[f.id].ded.includes(c.id) || !c.servono.every(x => vede(s, f.id, x))) continue;
            s = fai(s, { t: 'collega', uid: pv, ids: c.servono }, k);
            s = fai(s, { t: 'risolvi', uid: pv, scelta: c.giusta }, k);
            nuovo = true;
          }
        }
        if (k.atti[s.atto].sera.modulo) s = fai(s, { t: 'modulo', uid: pv, risposte: { prova: 1 } }, k);
      }
      // la regia accetta le proposte di spegnere i sigilli
      for (const p of s.prop.slice()) s = cmd(s, k, 'proposta', { n: p.n, ok: true });
    }
    if (s.fase === 'voto') {
      tickFino(30);
      const colp = k.soluzione.colpevole,
        rules = k.punteggio || [];
      for (const [uid, g] of Object.entries(s.gioc)) {
        if (s.usc[g.pid]) continue;
        const f = famDi(k, g.pid),
          prove = Object.keys(s.mie[g.pid]).concat(s.pub, s.fam[f].bacheca);
        let v;
        if (opz.bravi) {
          v = {};
          for (const q of k.accusa.domande) {
            const r = rules.find(x => x.domanda === q.id);
            if (!r) continue;
            if (r.gruppi) {
              const scelte = [],
                visti = new Set();
              for (const id of prove)
                if (r.gruppi[id] && !visti.has(r.gruppi[id])) (visti.add(r.gruppi[id]), scelte.push(id));
              v[q.id] = scelte.slice(0, q.quante || 2);
            } else v[q.id] = r.giusta;
          }
          // il bravo accusa solo se le prove del «chi» le vede davvero
          const viste = (k.soluzione.prove.chi || []).filter(x => prove.includes(x)).length;
          if (viste < 2) v.chi = k.personaggi[Math.floor(rnd() * k.personaggi.length)].id;
        } else {
          v = {};
          for (const q of k.accusa.domande)
            v[q.id] =
              q.tipo === 'personaggio'
                ? k.personaggi[Math.floor(rnd() * k.personaggi.length)].id
                : q.tipo === 'scelta'
                  ? Math.floor(rnd() * q.scelte.length)
                  : [];
        }
        s = fai(s, { t: 'voto', uid, risposte: v }, k);
        if (s.fam[f].pv === uid) s = fai(s, { t: 'votoFam', uid, risposte: v }, k);
      }
      s = cmd(s, k, 'chiudiVoto');
      continue;
    }
    if (s.fase === 'gioco' && s.mom === 'sera') tickFino(15);
    else {
      ORA += 5000;
      const t = S.tick(s, k, ORA);
      if (t) s = t.s;
    }
    s = cmd(s, k, 'avanti');
  }
  return { s, sicuro };
}

// ---- kit pubblici ----
ck(KIT.length >= 1, 'almeno un kit «serata» in src/kit');
for (const k of KIT) {
  ck(S.valida(k).length === 0, 'kit ' + k.id + ' valido ' + JSON.stringify(S.valida(k)));
  console.log('     avvisi:', JSON.stringify(S.avvisi(k)));
}
const k0 = KIT.find(k => k.id === 'nebbia-scoglio');
if (k0) {
  // il validatore ferma gli errori tipici
  const rompi = (f, atteso) => {
    const x = clone(k0);
    f(x);
    const e = S.valida(x);
    ck(
      e.some(m => m.includes(atteso)),
      'validatore: «' + atteso + '» ' + (e.some(m => m.includes(atteso)) ? '' : JSON.stringify(e))
    );
  };
  rompi(x => (x.prove[0].testo = 'Alle 23:41 succede qualcosa'), 'fuori cronologia');
  rompi(x => (x.personaggi[0].colpevole = true), 'esattamente un colpevole');
  rompi(x => (x.soluzione.prove.chi = ['lastra']), 'almeno due prove');
  rompi(x => (x.soluzione.prove.chi = ['lastra', 'impronte']), 'tutte in una famiglia');
  rompi(x => (x.atti[0].mattina.scene[0].righe[4].cue.prova = 'ricevuta'), 'è dell’atto II');
  rompi(x => (x.collegamenti[0].servono = ['corpo', 'nulla']), 'sconosciuto');
  rompi(x => (x.prove[5].dopo = ['biglietto']), 'esce dopo');
  rompi(x => (x.atti[1].pomeriggio.minuti = 0), 'senza minuti');

  // da 1 a 4 giocatori: con i bravi il colpevole è preso, ogni prova arriva a qualcuno, nessun segreto trapela
  for (let n = k0.giocatori[0]; n <= k0.giocatori[1]; n++) {
    const { s, sicuro } = serata(k0, n, { bravi: true });
    ck(s.fase === 'fine', k0.id + ' ' + n + ' giocatori: la serata arriva alla fine');
    ck(sicuro, k0.id + ' ' + n + ' giocatori: nessun segreto trapela');
    const date = new Set(
      Object.values(s.mie)
        .flatMap(m => Object.keys(m))
        .concat(s.pub)
    );
    ck(
      k0.prove.every(p => date.has(p.id)),
      k0.id + ' ' + n + ' giocatori: ogni prova arriva a qualcuno'
    );
    ck(
      s.ris.presi === s.ris.votanti && s.ris.votanti === n,
      k0.id + ' ' + n + ': i bravi prendono il colpevole (' + s.ris.presi + '/' + s.ris.votanti + ')'
    );
    ck(
      Object.values(s.sig).every(v => v === 0),
      k0.id + ' ' + n + ': a fine serata i sigilli sono tutti spenti'
    );
  }
  // i casuali sbagliano più dei bravi
  {
    let bravi = 0,
      casuali = 0;
    for (let i = 1; i <= 12; i++) {
      const a = serata(k0, 4, { bravi: true, rnd: carica.rng(i) }).s,
        b = serata(k0, 4, { bravi: false, rnd: carica.rng(i) }).s;
      bravi += Object.values(a.ris.ind).reduce((t, x) => t + x.tot, 0);
      casuali += Object.values(b.ris.ind).reduce((t, x) => t + x.tot, 0);
    }
    ck(bravi > casuali * 2, 'i bravi fanno più punti dei casuali (' + bravi + ' contro ' + casuali + ')');
  }
  // regole delle fasi
  {
    let s = S.nuova(k0, gioc(4), { narratore: NARR, rnd: carica.rng(3) }).s;
    const uidDi = pid => Object.keys(s.gioc).find(u => s.gioc[u].pid === pid);
    s = cmd(s, k0, 'avanti');
    ck(s.fase === 'gioco' && s.mom === 'mattina', 'si parte dalla mattina del primo atto');
    const nora = uidDi('nora'),
      ilario = uidDi('ilario'),
      bast = uidDi('bastiano');
    ck(!!s.mie.nora.stoppino, 'la prova personale arriva a Nora');
    let r = S.act(s, { t: 'mostra', uid: nora, eid: 'stoppino', a: 'ilario' }, k0, ORA);
    ck(r.err && r.err.includes('rappresentante'), 'di mattina non si mostra alle altre famiglie');
    r = S.act(s, { t: 'mostra', uid: nora, eid: 'stoppino', a: 'bastiano' }, k0, ORA);
    ck(!r.err, 'di mattina si mostra dentro la famiglia');
    const pvLoc = s.fam.locanda.pv,
      altro = pvLoc === nora ? bast : nora;
    r = S.act(s, { t: 'dichiara', uid: altro, testo: 'Accuso il perito' }, k0, ORA);
    ck(r.err && r.err.includes('rappresentante'), 'dichiara solo il rappresentante');
    r = S.act(s, { t: 'dichiara', uid: pvLoc, testo: 'Abbiamo un sospetto', tipo: 'accusa' }, k0, ORA);
    ck(!r.err && S.pubblico(r.s, k0).dich.length === 1, 'il rappresentante dichiara e la TV lo mostra');
    while (s.mom === 'mattina') s = cmd(s, k0, 'avanti');
    ck(s.mom === 'pomeriggio' && s.fino === ORA + 4 * 60000, 'il pomeriggio ha il suo tempo massimo');
    r = S.act(s, { t: 'mostra', uid: nora, eid: 'stoppino', a: 'ilario' }, k0, ORA);
    ck(!r.err && r.s.mie.ilario.stoppino.da === 'nora', 'di pomeriggio si mostra a chiunque');
    s = cmd(s, k0, 'pausa', { on: true });
    ck(S.tick(s, k0, ORA + 10 * 60000) === null, 'in pausa il tempo si ferma');
    ck(!!S.act(s, { t: 'appoggia', uid: nora, eid: 'stoppino' }, k0, ORA).err, 'in pausa non si gioca');
    s = cmd(s, k0, 'pausa', { on: false });
    const t = S.tick(s, k0, ORA + 5 * 60000);
    ck(t && t.s.mom === 'sera', 'allo scadere del pomeriggio arriva la sera');
    s = t.s;
    r = S.act(s, { t: 'chiedi', uid: nora, a: 'clotilde' }, k0, ORA);
    ck(r.err && r.err.includes('sera'), 'di sera si parla solo in famiglia');
    ck(!!s.mie.bastiano.tonfo, 'la prova della sera arriva a Bastiano');
    // collegamento: serve la bacheca, sbagliare porta al suggerimento
    s = fai(s, { t: 'appoggia', uid: bast, eid: 'tonfo' }, k0);
    s = fai(s, { t: 'collega', uid: nora, ids: ['corpo', 'tonfo'] }, k0);
    ck(!!s.fam.locanda.quesito, 'il collegamento apre la domanda');
    s = fai(s, { t: 'risolvi', uid: nora, scelta: 1 }, k0);
    s = fai(s, { t: 'collega', uid: nora, ids: ['corpo', 'tonfo'] }, k0);
    s = fai(s, { t: 'risolvi', uid: nora, scelta: 2 }, k0);
    ck(
      s.msg[nora].some(m => m.testo.includes('Suggerimento')),
      'dopo due errori arriva il suggerimento'
    );
    s = fai(s, { t: 'collega', uid: nora, ids: ['corpo', 'tonfo'] }, k0);
    s = fai(s, { t: 'risolvi', uid: nora, scelta: 0 }, k0);
    ck(
      s.fam.locanda.ded.includes('ora-vera') && s.prop.some(p => p.id === 'ORA'),
      'passo avanti e proposta di spegnere ORA'
    );
    s = cmd(s, k0, 'proposta', { n: s.prop[0].n, ok: true });
    ck(
      s.sig.ORA === 0 && S.pubblico(s, k0).sigilli.find(x => x.id === 'ORA').on === false,
      'la regia spegne il sigillo'
    );
    // comandi numerati: un doppio tocco non fa avanzare due volte
    const prima = s.mom;
    s = fai(s, { t: 'cmd', uid: NARR, c: 'avanti', seq: 5 }, k0);
    const dopo1 = s.atto + s.mom;
    s = S.act(s, { t: 'cmd', uid: NARR, c: 'avanti', seq: 5 }, k0, ORA).s;
    ck(prima === 'sera' && s.atto + s.mom === dopo1, 'un comando ripetuto si applica una volta sola');
    ck(!!S.act(s, { t: 'cmd', uid: nora, c: 'avanti' }, k0, ORA).err, 'solo il narratore comanda');
    // due tocchi partiti dallo stesso punto (rete lenta): il secondo non fa saltare un altro passo
    const pos = S.mani(s, k0)[NARR].console.pos;
    const s1 = fai(s, { t: 'cmd', uid: NARR, c: 'avanti', at: pos, seq: 6 }, k0),
      s2 = fai(s1, { t: 'cmd', uid: NARR, c: 'avanti', at: pos, seq: 7 }, k0);
    ck(
      s1.riga + s1.mom + s1.atto !== s.riga + s.mom + s.atto &&
        s2.riga + s2.mom + s2.atto === s1.riga + s1.mom + s1.atto,
      'un avanti partito da una console rimasta indietro si ignora'
    );
    // la console sa cosa succede al prossimo avanti
    const con = S.mani(s, k0)[NARR].console;
    ck(
      con && typeof con.prossimo === 'string' && con.prossimo.length > 0,
      'la console mostra il prossimo passo: ' + con.prossimo
    );
  }
  // un giocatore se ne va: le sue prove passano alla riserva
  {
    const { s } = serata(k0, 4, { bravi: true, esce: { pid: 'clotilde', atto: 'II' } });
    ck(!!s.mie.nora.lastra && !!s.mie.nora.impronte, 'chi esce lascia le prove alla riserva');
  }
}

// ---- kit privato (es. «23:17 – L'ultima luce»): collaudo completo ----
if (process.env.KIT_PRIVATO) {
  const kp = JSON.parse(fs.readFileSync(process.env.KIT_PRIVATO, 'utf8'));
  require('./serata_collaudo.js')(S, kp, { serata, ck, clone, cmd, fai, gioc, NARR, carica });
}

console.log(fails ? fails + ' FALLITI' : 'tutto ok');
process.exit(fails ? 1 : 0);
