// Cena con delitto: motore della serata (motori/36-giallo.js) e kit veri (src/kit/*.json).
// Bot intelligenti = investigatori che si mostrano tutti gli indizi e votano solo ciò che è provato; bot casuali = votano a caso.
const fs = require('fs'),
  path = require('path');
const carica = require('./carica.js'),
  G = carica('36-giallo.js', 'GIALLO');
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
const DIR = path.join(__dirname, '../src/kit'),
  KIT = fs
    .readdirSync(DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
const clone = o => JSON.parse(JSON.stringify(o));
const gioc = n => Array.from({ length: n }, (_, i) => ({ uid: 'u' + i, nome: 'G' + i }));
const avanti = (s, k, ora) => {
  const r = G.act(s, { t: 'avanti' }, k, ora || 0);
  if (r.err) throw new Error(r.err);
  return r.s;
};
const indiziDi = (s, u) => Object.values(s.mano[u]).filter(o => o.t === 'indizio');

// ---- validatore ----
for (const k of KIT) ck(G.valida(k).length === 0, 'kit ' + k.id + ' valido ' + JSON.stringify(G.valida(k)));
ck(KIT.length >= 1, 'almeno un kit');
{
  const k = KIT[0];
  const rompi = (f, atteso) => {
    const x = clone(k);
    f(x);
    const e = G.valida(x);
    ck(
      e.some(m => m.includes(atteso)),
      'validatore: «' + atteso + '»'
    );
  };
  rompi(x => (x.personaggi.find(p => !p.essenziale).riserva = 'nessuno'), 'facoltativo senza riserva');
  rompi(x => (x.soluzione.risposte.come = 'Non è tra le scelte'), 'la soluzione deve essere tra le scelte');
  rompi(x => {
    for (const a of x.atti) for (const i of a.indizi) if ((i.prova || []).includes('perche')) i.prova = [];
  }, 'servono almeno due indizi');
  rompi(x => (x.atti[0].indizi[1].a = 'fantasma'), 'destinatario sconosciuto');
  rompi(x => x.atti[1].indizi.push({ ...x.atti[0].indizi[0] }), 'ripetuto');
  rompi(x => (x.personaggi[0].obiettivi = [['solo uno']]), 'obiettivi per ogni atto');
  rompi(x => (x.soluzione.risposte.chi = x.personaggi.find(p => !p.essenziale).id), 'personaggio essenziale');
  rompi(x => (x.giocatori = [2, 30]), 'giocatori');
  // scena (facoltativa, ma se c'è deve essere giusta)
  rompi(x => (x.scena = { palette: { fondo: 'rosso' } }), 'colore «fondo»');
  rompi(
    x =>
      (x.scena = { ...clone(k.scena || {}), palette: (k.scena || {}).palette, atmosfera: { strati: ['arcobaleno'] } }),
    'strato sconosciuto'
  );
  rompi(x => (x.scena = { ...clone(k.scena || {}), ambiente: ['discoteca'] }), 'ambiente sconosciuto');
  rompi(
    x => (x.scena = { ...clone(k.scena || {}), musica: { bpm: 90, prog: [[50, 0]], mel: [[1]] } }),
    'musica non valida'
  );
  rompi(x => (x.atti[0].luogo = 'luna'), 'luogo sconosciuto');
  rompi(x => (x.atti[0].eventi = [{ dopo: 5, testo: 'Bum', fx: 'esplosione' }]), 'effetto sconosciuto');
  rompi(x => (x.atti[0].eventi = [{ dopo: 999, testo: 'Tardi' }]), 'minuto dentro l’atto');
  rompi(x => (x.atti[0].eventi = [{ dopo: 1, testo: 'Psst', a: x.personaggi[0].id }]), 'messaggio privato');
  rompi(x => (x.personaggi[0].aspetto = { testa: 'parrucca' }), 'testa sconosciuta');
  rompi(x => (x.personaggi[0].aspetto = { colore: 'blu' }), 'colore «colore»');
}

for (const k of KIT) {
  const [min, max] = k.giocatori,
    domande = k.domande.map(q => q.id),
    sol = k.soluzione.risposte;
  // ---- avvio ----
  ck(!!G.nuova(k, gioc(min - 1)).err && !!G.nuova(k, gioc(max + 1)).err, k.id + ': fuori dal range, rifiutata');
  ck(
    !!G.nuova(k, [...gioc(min - 1), { uid: 'u0', nome: 'Doppio' }]).err,
    k.id + ': stesso profilo due volte, rifiutata'
  );
  ck(!!G.nuova(k, [...gioc(min - 1), { uid: '', nome: 'Ospite' }]).err, k.id + ': senza profilo, rifiutata');
  {
    const scelte = { u2: k.soluzione.risposte.chi, u3: k.soluzione.risposte.chi };
    const s = G.nuova(k, gioc(min), { scelte, rnd: carica.rng(3) }).s;
    ck(s.pg.u2 === sol.chi && s.pg.u3 !== sol.chi, k.id + ': scelta in lobby rispettata, una sola volta');
  }

  for (let n = min; n <= max; n++)
    for (let seme = 1; seme <= 4; seme++) {
      const tag = k.id + ' n=' + n + ' seme=' + seme + ': ',
        uids = gioc(n).map(g => g.uid);
      let s = G.nuova(k, gioc(n), { rnd: carica.rng(seme * 97 + n) }).s;
      const pgs = Object.values(s.pg);
      if (seme === 1) {
        ck(new Set(pgs).size === n && pgs.every(p => G.scegli(k, n).includes(p)), tag + 'un personaggio a testa');
        ck(G.scegli(k, n).length === n, tag + 'personaggi giusti per il numero');
        ck(
          uids.every(u => Object.keys(s.mano[u]).join() === 'scheda' && s.mano[u].scheda.nome),
          tag + 'all’inizio ognuno ha solo la propria scheda'
        );
        const sa = Object.values(s.mano).flatMap(m => Object.keys(m.scheda.sa));
        const nomiInGioco = s.inGioco.map(id => k.personaggi.find(p => p.id === id).nome);
        ck(
          sa.every(x => nomiInGioco.includes(x)),
          tag + 'nessuno «sa» di personaggi assenti'
        );
      }
      // pubblico senza segreti prima del finale
      const segreti = k.personaggi.map(p => p.segreto).concat(k.soluzione.ricostruzione);
      const fughe = st => segreti.some(x => JSON.stringify(G.pubblico(st, k)).includes(x.slice(0, 40)));
      ck(!fughe(s), tag + 'il pubblico non contiene segreti né soluzione');
      ck(!!G.act(s, { t: 'voto', uid: 'u0', risposte: sol }, k).err, tag + 'non si vota prima dell’accusa');
      // tre atti: indizi consegnati, nessuno perso
      s = avanti(s, k, 1000);
      ck(s.fase === 'atto' && s.scade === 1000 + k.atti[0].minuti * 60000, tag + 'primo atto con timer');
      ck(
        uids.every(u => s.mano[u].ob0 && s.mano[u].ob0.testi.length),
        tag + 'obiettivi del primo atto a tutti'
      );
      for (let i = 1; i < k.atti.length; i++) s = avanti(s, k, 0);
      const tutti = k.atti.flatMap(a => a.indizi.map(x => x.id)),
        privati = uids.flatMap(u => indiziDi(s, u).map(o => o.id)),
        pubblici = s.pubblici.map(o => o.id);
      ck(
        tutti.every(id => privati.filter(x => x === id).length + pubblici.filter(x => x === id).length === 1),
        tag + 'ogni indizio arriva a uno e uno solo (o a tutti)'
      );
      ck(!fughe(s), tag + 'anche a fine atti il pubblico non ha segreti');
      // tempo dell'atto: la regia ne aggiunge, mai sotto «adesso»
      {
        const r5 = G.act(s, { t: 'tempo', ms: 300000 }, k, 0);
        ck(!r5.err && r5.s.scade === s.scade + 300000, tag + 'la regia aggiunge 5 minuti');
        ck(
          G.act(s, { t: 'tempo', ms: -1e12 }, k, 777).s.scade === 777,
          tag + 'togliendo tempo non si va prima di adesso'
        );
      }
      // mostra: regole
      const chiHa = uids.find(u => indiziDi(s, u).length),
        altro = uids.find(u => u !== chiHa),
        ind = indiziDi(s, chiHa)[0];
      ck(
        !!G.act(s, { t: 'mostra', uid: chiHa, indizio: 'inventato', a: altro }, k).err,
        tag + 'non si mostra ciò che non si ha'
      );
      ck(!!G.act(s, { t: 'mostra', uid: chiHa, indizio: ind.id, a: chiHa }, k).err, tag + 'non si mostra a se stessi');
      const r = G.act(s, { t: 'mostra', uid: chiHa, indizio: ind.id, a: altro }, k);
      ck(
        !r.err && r.s.mano[altro]['m-' + ind.id].da === s.nomi[chiHa] && r.s.mano[chiHa]['i-' + ind.id],
        tag + 'mostrare dà una copia, l’originale resta'
      );
      ck(!!G.act(r.s, { t: 'mostra', uid: chiHa, indizio: ind.id, a: altro }, k).err, tag + 'non si mostra due volte');
      ck(
        !!G.act(r.s, { t: 'mostra', uid: altro, indizio: ind.id, a: chiHa }, k).err,
        tag + 'una copia mostrata non si rigira'
      );
      ck(
        !!G.act(s, { t: 'mostra', uid: 'estraneo', indizio: ind.id, a: altro }, k).err,
        tag + 'chi non è seduto non agisce'
      );
      // obiettivi dell'atto in corso
      const ult = k.atti.length - 1;
      {
        const ro = G.act(s, { t: 'obiettivo', uid: 'u0', atto: ult, i: 0, fatto: true }, k);
        ck(!ro.err && ro.s.mano.u0['ob' + ult].fatti[0] === true, tag + 'obiettivo segnato, e il telefono lo vede');
      }
      ck(
        !!G.act(s, { t: 'obiettivo', uid: 'u0', atto: 0, i: 0, fatto: true }, k).err || ult === 0,
        tag + 'non quelli passati'
      );
      ck(
        !!G.act(s, { t: 'obiettivo', uid: 'u0', atto: ult, i: 99, fatto: true }, k).err,
        tag + 'obiettivo inesistente'
      );

      // ---- bot intelligenti: si mostrano tutto, poi votano ciò che è provato ----
      let x = s;
      for (const u of uids)
        for (const o of indiziDi(x, u).filter(o => !o.da))
          for (const v of uids)
            if (v !== u) {
              const rr = G.act(x, { t: 'mostra', uid: u, indizio: o.id, a: v }, k);
              if (!rr.err) x = rr.s;
            }
      const prove = u => {
        const visti = new Set(
          indiziDi(x, u)
            .map(o => o.id)
            .concat(x.pubblici.map(o => o.id))
        );
        const p = new Set();
        for (const a of k.atti) for (const i of a.indizi) if (visti.has(i.id)) (i.prova || []).forEach(q => p.add(q));
        return p;
      };
      ck(
        uids.every(u => domande.every(q => prove(u).has(q))),
        tag + 'condividendo tutto, ognuno ha le prove per ogni domanda'
      );
      const intel = avanti(x, k, 0);
      ck(intel.fase === 'accusa' && intel.scade === 0, tag + 'si passa all’accusa');
      let y = intel;
      for (const u of uids) {
        const io = y.pg[u] === sol.chi;
        // l'assassino vota un innocente, gli altri votano la soluzione provata
        const ris = io ? { ...sol, chi: y.inGioco.find(p => p !== sol.chi) } : sol;
        y = G.act(y, { t: 'voto', uid: u, risposte: ris }, k).s;
        y = G.act(y, { t: 'attore', uid: u, per: uids[(uids.indexOf(u) + 1) % n] }, k).s;
      }
      ck(G.pubblico(y, k).votati.length === n, tag + 'il pubblico sa chi ha votato, non cosa');
      ck(y.mano.u0.voto.risposte && y.mano.u0.voto.attore, tag + 'ognuno rivede il proprio voto');
      ck(
        G.pubblico(intel, k).domande.length === k.domande.length && !G.pubblico(s, k).domande.length,
        tag + 'domande pubbliche solo all’accusa'
      );
      ck(!JSON.stringify(G.pubblico(y, k)).includes('"voti"'), tag + 'i voti restano segreti fino al finale');
      ck(!!G.act(y, { t: 'attore', uid: 'u0', per: 'u0' }, k).err, tag + 'non ci si vota da soli come attore');
      ck(!!G.act(y, { t: 'voto', uid: 'u0', risposte: { chi: sol.chi } }, k).err, tag + 'voto incompleto rifiutato');
      const fin = avanti(y, k, 0),
        pi = fin.punti;
      ck(fin.fase === 'finale' && G.pubblico(fin, k).finale.chi, tag + 'finale con la soluzione');
      ck(!pi.franca && pi.giusti === n - 1, tag + 'investigatori bravi: l’assassino non la fa franca');
      ck(
        !!G.act(fin, { t: 'avanti' }, k).err && !!G.act(fin, { t: 'voto', uid: 'u0', risposte: sol }, k).err,
        tag + 'a serata finita non si agisce più'
      );

      // ---- bot casuali: votano a caso ----
      const rnd = carica.rng(seme * 31 + n);
      let z = intel;
      for (const u of uids) {
        const ris = {};
        for (const q of k.domande)
          ris[q.id] =
            q.tipo === 'personaggio' ? z.inGioco[Math.floor(rnd() * n)] : q.scelte[Math.floor(rnd() * q.scelte.length)];
        z = G.act(z, { t: 'voto', uid: u, risposte: ris }, k).s;
      }
      const fz = avanti(z, k, 0).punti;
      const media = p => Object.values(p.p).reduce((a, b) => a + b, 0) / n;
      ck(
        media(fz) < media(pi),
        tag + 'i bravi fanno più punti dei casuali (' + media(pi).toFixed(1) + ' > ' + media(fz).toFixed(1) + ')'
      );
    }
}

// ---- eventi, messaggi privati, immagini (su ogni kit che ne ha) ----
for (const k0 of KIT) {
  const k = clone(k0),
    tag = k.id + ' scena: ';
  // il build aggiunge le immagini presenti: qui una finta per ogni cosa
  k.media = { ritratti: {}, oggetti: {}, luoghi: {}, font: '/assets/kit/x/titoli.woff2' };
  for (const p of k.personaggi) k.media.ritratti[p.id] = '/r/' + p.id + '.webp';
  for (const a of k.atti) for (const x of a.indizi) k.media.oggetti[x.id] = '/o/' + x.id + '.webp';
  for (const l of k.luoghi || []) k.media.luoghi[l.id] = '/l/' + l.id + '.webp';
  const n = k.giocatori[0];
  let s = G.nuova(k, gioc(n), { rnd: carica.rng(9) }).s;
  ck(
    Object.values(s.mano).every(m => m.scheda.img === '/r/' + m.scheda.id + '.webp'),
    tag + 'ogni scheda ha il proprio ritratto'
  );
  const pub0 = G.pubblico(s, k);
  ck(
    pub0.giocatori.every(g => g.img && g.id) && pub0.scena.font && (!k.scena || pub0.scena.palette),
    tag + 'il pubblico ha ritratti, font e colori'
  );
  ck(!k.luoghi || (pub0.luogo && pub0.luogo.id === k.luoghi[0].id), tag + 'nel prologo il luogo è il primo del kit');
  ck(!!G.act(s, { t: 'evento', i: 0 }, k).err, tag + 'nessun evento nel prologo');
  s = avanti(s, k, 0);
  const tutti = uid => Object.values(s.mano[uid]);
  ck(
    Object.keys(s.mano).every(u =>
      tutti(u)
        .filter(o => o.t === 'indizio')
        .every(o => o.img === '/o/' + o.id + '.webp')
    ),
    tag + 'gli indizi portano la loro immagine'
  );
  const privati = [];
  for (let i = 0; i < k.atti.length; i++) {
    if (i) s = avanti(s, k, 0);
    ck(!G.pubblico(s, k).ultimo, tag + 'atto ' + (i + 1) + ': nessun evento in sospeso');
    const lu = k.atti[i].luogo;
    ck(!lu || G.pubblico(s, k).luogo.id === lu, tag + 'atto ' + (i + 1) + ': luogo dell’atto');
    (k.atti[i].eventi || []).forEach((ev, j) => {
      const r = G.act(s, { t: 'evento', i: j }, k, 1234);
      ck(!r.err, tag + 'evento ' + i + '-' + j + ' accade');
      s = r.s;
      const u = G.pubblico(s, k).ultimo;
      ck(
        u.testo === ev.testo && u.fx === (ev.fx || '') && u.t === 1234,
        tag + 'evento ' + i + '-' + j + ' nel pubblico'
      );
      ck(!!G.act(s, { t: 'evento', i: j }, k).err, tag + 'evento ' + i + '-' + j + ' non si ripete');
      if (ev.a) {
        privati.push(ev.privato);
        const chi = Object.keys(s.mano).find(x => s.mano[x]['e-' + i + '-' + j]);
        const atteso = s.inGioco.includes(ev.a) ? ev.a : k.personaggi.find(p => p.id === ev.a).riserva;
        ck(
          !!chi && s.pg[chi] === atteso && s.mano[chi]['e-' + i + '-' + j].testo === ev.privato,
          tag + 'messaggio privato al personaggio giusto (o alla sua riserva)'
        );
        ck(u.per === s.nomi[chi], tag + 'la TV sa a chi dire «guarda il telefono»');
      }
    });
    ck(!!G.act(s, { t: 'evento', i: 99 }, k).err, tag + 'evento inesistente rifiutato');
  }
  ck(
    !privati.some(t => JSON.stringify(G.pubblico(s, k)).includes(t.slice(0, 30))),
    tag + 'i messaggi privati non finiscono nel pubblico'
  );
  s = avanti(s, k, 0);
  ck(!G.pubblico(s, k).ultimo, tag + 'all’accusa l’ultimo evento si azzera');
  s = avanti(s, k, 0);
  const f = G.pubblico(s, k).finale;
  ck(
    f.img === '/r/' + k.soluzione.risposte.chi + '.webp' && f.chiId === k.soluzione.risposte.chi,
    tag + 'il finale ha il ritratto dell’assassino'
  );
}

// ---- l'assassino la fa franca se la maggioranza sbaglia ----
{
  const k = KIT[0],
    n = k.giocatori[0],
    sol = k.soluzione.risposte;
  let s = G.nuova(k, gioc(n), { rnd: carica.rng(5) }).s;
  for (let i = 0; i <= k.atti.length; i++) s = avanti(s, k, 0);
  const ass = Object.keys(s.pg).find(u => s.pg[u] === sol.chi),
    innocente = s.inGioco.find(p => p !== sol.chi);
  for (const u of Object.keys(s.pg)) s = G.act(s, { t: 'voto', uid: u, risposte: { ...sol, chi: innocente } }, k).s;
  const f = avanti(s, k, 0).punti;
  ck(
    f.franca && f.assassino === ass && f.p[ass] >= G.PUNTI.franca,
    'nessuno lo scopre: l’assassino la fa franca e prende i punti'
  );
}

console.log(fails ? fails + ' CONTROLLI FALLITI' : 'ALL OK');
process.exit(fails ? 1 : 0);
