// Fascicolo (indagine d'archivio, TV + telefoni): motore motori/36c-fascicolo.js, kit src/kit/*.json con formato «fascicolo».
// Un kit privato (fuori dal repo) si prova con: KIT_PRIVATO=/percorso/kit.json npm test -- fascicolo
// Squadra «brava»: segue solo le strade che portano alle prove, unisce le metà, proietta e collega, il caposquadra risponde giusto.
// Squadra «a caso»: azioni a sorte finché ci sono ore, risposte a sorte.
const fs = require('fs'),
  path = require('path');
const carica = require('./carica.js'),
  F = carica('36c-fascicolo.js', 'FASCICOLO');
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
  .filter(k => k.formato === 'fascicolo');
if (process.env.KIT_PRIVATO) KIT.push(JSON.parse(fs.readFileSync(process.env.KIT_PRIVATO, 'utf8')));
const gioc = n => Array.from({ length: n }, (_, i) => ({ uid: 'u' + i, nome: 'G' + i }));
let ORA = 1e6;
function fai(s, a, k) {
  const r = F.act(s, a, k, ORA);
  if (r.err) throw new Error(a.t + ': ' + r.err);
  return r.s;
}
const prova = (s, a, k) => F.act(s, a, k, ORA);
const avanti = (s, k) => fai(s, { t: 'avanti', uid: 'tv', regia: true }, k);
const rep = (k, id) => k.reperti.find(r => r.id === id);
const col = (k, id) => (k.collegamenti || []).find(c => c.id === id);
const daT = r => (!r.da || r.da === 'inizio' ? 'inizio' : Object.keys(r.da)[0]);
const daV = r => (r.da && typeof r.da === 'object' ? r.da[daT(r)] : null);
const temi = k => k.persone.flatMap(p => (p.temi || []).map(t => ({ ...t, persona: p.id })));
const zone = k => (k.luoghi || []).flatMap(l => (l.zone || []).map(z => ({ ...z, cap: l.capitolo })));
const capOk = (k, s, c) => (c === undefined ? 0 : k.capitoli.findIndex(x => x.id === c)) <= s.cap;
const intero = (s, u, id) => s.mani[u] && s.mani[u][id] === 'i';
const vede = (s, id) =>
  s.pub.includes(id) || s.muro.includes(id) || s.ded.includes(id) || s.ordine.some(u => intero(s, u, id));
const porta = (s, u, id) => intero(s, u, id) || s.pub.includes(id) || s.muro.includes(id) || s.ded.includes(id);
const chiHa = (s, x) => s.ordine.find(u => intero(s, u, x));
const conSpec = (s, x) => s.ordine.find(u => s.gioc[u].spec.includes(x));

// tutto ciò che serve davvero per rispondere a tutte le domande
function servono(k) {
  const v = new Set();
  const giro = id => {
    if (v.has(id)) return;
    v.add(id);
    const c = col(k, id);
    if (c) return c.servono.forEach(giro);
    const r = rep(k, id),
      t = daT(r),
      x = daV(r);
    if (t === 'tema') (temi(k).find(z => z.id === x).richiede || []).forEach(giro);
    if (t === 'analisi') giro(k.analisi.find(a => a.id === x).su);
    if (t === 'serratura') (k.serrature.find(z => z.id === x).richiede || []).forEach(giro);
  };
  k.domande.forEach(d => d.prove.forEach(giro));
  return v;
}
// porta un reperto sulla TV se chi agisce non ce l'ha
function sullaTV(s, k, u, id) {
  if (porta(s, u, id)) return s;
  const h = chiHa(s, id);
  if (!h) return s;
  return fai(s, { t: 'proietta', uid: h, rep: id }, k);
}
// un giro di indagine della squadra brava; restituisce lo stato e se ha fatto qualcosa
function giroBravo(s, k, utili) {
  let mosso = false;
  const fa = a => {
    s = fai(s, a, k);
    mosso = true;
  };
  // metà da unire
  for (const r of k.reperti)
    if (r.a && r.a.meta) {
      const a = s.ordine.find(u => s.mani[u][r.id] === 0),
        b = s.ordine.find(u => s.mani[u][r.id] === 1);
      if (a && b && !s.ordine.some(u => intero(s, u, r.id))) {
        fa({ t: 'unisci', uid: a, rep: r.id });
        fa({ t: 'unisci', uid: b, rep: r.id });
      }
    }
  for (const r of k.reperti) {
    if (s.rel[r.id] || !utili.has(r.id) || !capOk(k, s, r.capitolo)) continue;
    const t = daT(r),
      v = daV(r);
    if (t === 'zona') {
      const z = zone(k).find(z => z.id === v);
      if (capOk(k, s, z.cap) && !s.visti[v]) fa({ t: 'esplora', uid: conSpec(s, 'luoghi'), zona: v });
    } else if (t === 'tema') {
      const tm = temi(k).find(z => z.id === v),
        u = conSpec(s, 'testimoni');
      if (!capOk(k, s, tm.capitolo) || !(tm.richiede || []).every(x => vede(s, x))) continue;
      for (const x of tm.richiede || []) s = sullaTV(s, k, u, x);
      fa({ t: 'chiedi', uid: u, tema: v });
    } else if (t === 'analisi') {
      const a = k.analisi.find(z => z.id === v),
        u = conSpec(s, 'scientifica');
      if (s.analizzati[v] || !vede(s, a.su)) continue;
      s = sullaTV(s, k, u, a.su);
      fa({ t: 'analizza', uid: u, id: v });
    } else if (t === 'cerca') fa({ t: 'cerca', uid: conSpec(s, 'archivio'), parola: v[0] });
    else if (t === 'serratura') {
      const x = k.serrature.find(z => z.id === v);
      if (capOk(k, s, x.capitolo) && (x.richiede || []).every(y => vede(s, y)))
        fa({ t: 'apri', uid: s.ordine[0], id: v, val: x.soluzione });
    }
  }
  for (const c of k.collegamenti || []) {
    if (!utili.has(c.id) || s.ded.includes(c.id) || !c.servono.every(x => vede(s, x))) continue;
    const u =
      chiHa(
        s,
        c.servono.find(x => chiHa(s, x))
      ) || s.ordine[0];
    for (const x of c.servono) s = sullaTV(s, k, u, x);
    if (!c.servono.every(x => porta(s, u, x))) continue;
    fa({ t: 'collega', uid: u, ids: c.servono });
    fa({ t: 'risolvi', uid: u, scelta: c.giusta });
  }
  return { s, mosso };
}
function rispondi(s, k, giusto, rnd) {
  const doms = s.fase === 'accusa' ? k.accusa.domande : k.capitoli[s.cap].domande;
  for (const id of doms) {
    const d = k.domande.find(x => x.id === id);
    let v = d.giusta;
    if (!giusto) {
      const l =
        d.tipo === 'scelta'
          ? d.scelte.map((_, i) => i)
          : d.tipo === 'personaggio'
            ? k.persone.map(p => p.id)
            : d.tipo === 'luogo'
              ? k.luoghi.map(l => l.id)
              : ['21:00', '22:40', '23:59'];
      v = l[Math.floor(rnd() * l.length)];
    }
    s = fai(s, { t: 'proponi', uid: s.ordine[s.ordine.length - 1], dom: id, val: v }, k);
    for (const u of s.ordine) s = fai(s, { t: 'parere', uid: u, dom: id, si: true }, k);
    s = fai(s, { t: 'consegna', uid: s.capo, dom: id }, k);
  }
  if (s.fase === 'accusa') {
    const ok = new Set(k.accusa.domande.flatMap(id => k.domande.find(d => d.id === id).prove));
    const l = [...ok].filter(x => vede(s, x));
    if (l.length) {
      s = fai(
        s,
        { t: 'proponi', uid: s.capo, dom: 'sostegno', val: giusto ? l : [l[Math.floor(rnd() * l.length)]] },
        k
      );
      s = fai(s, { t: 'consegna', uid: s.capo, dom: 'sostegno' }, k);
    }
  }
  return s;
}
function controllaSegreti(s, k, dove) {
  const pub = JSON.stringify(F.pubblico(s, k));
  let ok = true;
  if (s.fase !== 'finale' && s.fase !== 'fine' && pub.includes(k.soluzione.ricostruzione[0].slice(0, 40))) ok = false;
  for (const d of k.domande)
    if (d.rivelazione && !s.rivelate.includes(d.id) && pub.includes(d.rivelazione.slice(0, 30))) ok = false;
  if (pub.includes('"colpevole"')) ok = false;
  const M = F.mani(s, k);
  for (const u of s.ordine) {
    const m = JSON.stringify(M[u]);
    for (const r of k.reperti) {
      if (porta(s, u, r.id)) continue;
      // per un reperto spezzato si cerca un pezzo del testo intero che non sta in nessuna delle due metà
      const tt = JSON.stringify(r.testo || '').slice(1, -1);
      let pezzo = tt.slice(0, 40);
      if (r.a && r.a.meta)
        for (let i = 0; i + 30 <= tt.length; i += 5)
          if (!r.a.parti.some(p => JSON.stringify(p).includes(tt.slice(i, i + 30)))) {
            pezzo = tt.slice(i, i + 30);
            break;
          }
      if (r.testo && m.includes(pezzo)) ok = false;
      if (r.a && r.a.meta)
        r.a.parti.forEach((p, i) => {
          if (s.mani[u][r.id] !== i && m.includes(JSON.stringify(p).slice(1, 41))) ok = false;
        });
    }
    if (m.includes('soluzione') || m.includes('"giusta"')) ok = false;
  }
  if (!ok) throw new Error('segreto scoperto: ' + dove + ' ' + (ok.why || ''));
}
function partita(k, n, bravo, seme) {
  const rnd = carica.rng(seme || 7);
  let s = F.nuova(k, gioc(n), {}).s;
  const utili = servono(k);
  ORA = 1e6;
  let passi = 0;
  while (s.fase !== 'fine' && passi++ < 2000) {
    controllaSegreti(s, k, s.fase + ' ' + s.cap);
    if (s.fase === 'indagine') {
      if (bravo) {
        let r;
        do {
          r = giroBravo(s, k, utili);
          s = r.s;
          ORA += 30000;
          const t = F.tick(s, k, ORA);
          if (t) s = t.s;
        } while ((r.mosso || s.lab.length) && s.fase === 'indagine');
      } else {
        for (let i = 0; i < 25 && s.fase === 'indagine'; i++) {
          const u = s.ordine[Math.floor(rnd() * n)],
            pesca = l => l[Math.floor(rnd() * l.length)];
          const a = pesca([
            { t: 'esplora', uid: u, zona: (pesca(zone(k)) || {}).id },
            { t: 'chiedi', uid: u, tema: pesca(temi(k)).id },
            { t: 'cerca', uid: u, parola: pesca(['ladro', 'cassaforte', 'lettera', 'notte']) },
            { t: 'apri', uid: u, id: (pesca(k.serrature || []) || {}).id, val: String(Math.floor(rnd() * 9999)) },
          ]);
          const r = prova(s, a, k);
          if (!r.err) s = r.s;
          ORA += 20000;
          const t = F.tick(s, k, ORA);
          if (t) s = t.s;
        }
      }
      if (s.fase === 'indagine') s = rispondi(s, k, bravo, rnd);
      if (s.fase === 'indagine') s = avanti(s, k);
    } else if (s.fase === 'consegna') {
      s = avanti(s, k);
    } else if (s.fase === 'accusa') {
      s = rispondi(s, k, bravo, rnd);
      s = avanti(s, k);
    } else s = avanti(s, k);
  }
  controllaSegreti(s, k, 'fine');
  return s;
}

// ---- kit validi ----
ck(KIT.length > 0, "c'è almeno un fascicolo nei kit");
for (const k of KIT) {
  const e = F.valida(k);
  ck(!e.length, k.id + ': kit valido' + (e.length ? ' (' + e.join('; ') + ')' : ''));
  const max = k.gradi.slice().sort((a, b) => b.da - a.da)[0].nome;
  for (let n = k.giocatori[0]; n <= k.giocatori[1]; n++) {
    let s;
    try {
      s = partita(k, n, true);
    } catch (x) {
      ck(false, k.id + ' ' + n + ' giocatori, squadra brava: ' + x.message);
      continue;
    }
    ck(s.fase === 'fine' && s.ris.finale === 'pieno', k.id + ' ' + n + ' giocatori: la squadra brava risolve tutto');
    ck(s.ris.grado === max, k.id + ' ' + n + ' giocatori: grado ' + s.ris.grado + ' (' + s.ris.stelle + ' stelle)');
    const spec = new Set(Object.values(s.gioc).flatMap(g => g.spec));
    ck(
      k.specialita.every(x => spec.has(x.id)),
      k.id + ' ' + n + ' giocatori: ogni specialità ha un telefono'
    );
    ck(
      [...servono(k)].every(id => !rep(k, id) || s.rel[id]),
      k.id + ' ' + n + ' giocatori: tutte le prove sono uscite'
    );
    let peggio = 0;
    for (let seme = 1; seme <= 5; seme++) {
      const c = partita(k, n, false, seme * 31);
      if (c.ris.stelle >= s.ris.stelle || c.ris.grado === max) peggio++;
    }
    ck(peggio === 0, k.id + ' ' + n + ' giocatori: la squadra a caso fa peggio in 5 partite su 5');
  }
}

// ---- kit rotti: ogni regola del validatore ----
const k0 = KIT.find(k => k.id === 'il-gatto-del-notaio');
if (k0) {
  const rotto = (m, cosa, f) => {
    const k = clone(k0);
    f(k);
    const e = F.valida(k);
    ck(
      e.some(x => x.includes(cosa)),
      'kit rotto (' + m + '): ' + (e[0] || 'nessun errore')
    );
  };
  rotto('reperto irraggiungibile', 'non si può mai trovare', k => (k.serrature[0].richiede = ['biglietto']));
  rotto(
    'una sola strada di prova',
    'una sola strada',
    k =>
      (k.domande[0].prove = ['fango', 'pioggia']
        .slice(0, 1)
        .concat(['cassaforte'])
        .map(() => 'cassaforte'))
  );
  rotto(
    'collegamento in una specialità',
    'stessa specialità',
    k => (k.collegamenti[2].servono = ['cassaforte', 'foglio'])
  );
  rotto('troppe ore', 'la strada più corta', k => ((k.ore.inizio = 4), (k.ore.capitolo = 1)));
  rotto('falsa pista senza smentita', 'falsa pista', k => delete rep(k, 'fango').smentita);
  rotto('orario fuori cronologia', 'orario 21:05', k => (rep(k, 'agenda').testo += ' Telefonata alle 21:05.'));
  rotto('due colpevoli', 'esattamente un colpevole', k => (k.persone[1].colpevole = true));
  rotto('colpevole sbagliato', 'non è il colpevole', k => (k.domande.find(d => d.id === 'chi').giusta = 'ilde'));
  rotto('zona fuori immagine', 'x fuori da 0-1', k => (k.luoghi[0].zone[0].x = 1.4));
  rotto(
    'metà alla stessa specialità',
    'due specialità diverse',
    k => (rep(k, 'pendolo').a.meta = ['testimoni', 'testimoni'])
  );
  rotto('riferimento rotto', 'sconosciut', k => (k.collegamenti[0].servono = ['pendolo', 'nessuno']));
  rotto('capitolo senza domande', 'da 1 a 4 domande', k => (k.capitoli[1].domande = []));
  rotto('serratura senza indizi', 'richiede', k => (k.serrature[0].richiede = []));
  rotto('specialità sconosciuta', 'specialità sconosciuta', k => k.specialita.push({ id: 'cuoco' }));

  // ---- regole di gioco ----
  const k = k0;
  ORA = 1e6;
  let s = F.nuova(k, gioc(3), {}).s;
  ck(prova(s, { t: 'cerca', uid: 'u0', parola: 'lascito' }, k).err, "prima dell'apertura non si indaga");
  s = avanti(s, k);
  ck(s.fase === 'apertura' && s.cap === 0, 'avanti apre il capitolo I');
  ck(
    prova(s, { t: 'avanti', uid: 'u1' }, k).err && !prova(s, { t: 'avanti', uid: 'u0' }, k).err,
    'va avanti solo il caposquadra (o la TV)'
  );
  while (s.fase === 'apertura') s = avanti(s, k);
  ck(s.fase === 'indagine' && s.fino === ORA + 12 * 60000, 'indagine a tempo');
  const tes = conSpec(s, 'testimoni'),
    luo = conSpec(s, 'luoghi'),
    sci = conSpec(s, 'scientifica');
  const altro = s.ordine.find(u => !s.gioc[u].spec.includes('testimoni'));
  ck(prova(s, { t: 'chiedi', uid: altro, tema: 't-cena' }, k).err, 'interroga solo chi ha i Testimoni');
  ck(prova(s, { t: 'chiedi', uid: tes, tema: 't-gatto' }, k).err, 'un tema con prerequisito resta chiuso');
  ck(prova(s, { t: 'chiedi', uid: tes, tema: 't-combinazione' }, k).err, "un tema del capitolo II non c'è ancora");
  // metà del pendolo: scientifica e testimoni (con 3 telefoni: u1 e u2)
  const m0 = s.ordine.find(u => s.mani[u].pendolo === 0),
    m1 = s.ordine.find(u => s.mani[u].pendolo === 1);
  ck(m0 && m1 && m0 !== m1, 'il pendolo è spezzato tra due telefoni');
  const mio = JSON.stringify(F.mani(s, k)[m0]);
  ck(mio.includes('Le lancette segnano') && !mio.includes('Ilde ricorda'), 'ognuno legge solo la sua metà');
  s = fai(s, { t: 'unisci', uid: m0, rep: 'pendolo' }, k);
  ck(F.pubblico(s, k).cue.tipo === 'unisci', "la TV annuncia chi cerca l'altra metà");
  ORA += 61000;
  s = F.tick(s, k, ORA).s;
  ck(!s.unisci.pendolo, 'la metà in attesa scade dopo un minuto');
  s = fai(s, { t: 'unisci', uid: m0, rep: 'pendolo' }, k);
  s = fai(s, { t: 'unisci', uid: m1, rep: 'pendolo' }, k);
  ck(
    intero(s, m0, 'pendolo') && intero(s, m1, 'pendolo'),
    'unite entro un minuto: tutti e due hanno il reperto intero'
  );
  const ore0 = s.ore;
  s = fai(s, { t: 'esplora', uid: luo, zona: 'finestra' }, k);
  ck(s.ore === ore0 - 1 && intero(s, luo, 'fango'), "il sopralluogo costa un'ora e dà il reperto a chi lo fa");
  ck(prova(s, { t: 'esplora', uid: luo, zona: 'finestra' }, k).err, 'una zona si esamina una volta');
  ck(
    prova(s, { t: 'analizza', uid: sci, id: 'a-fango' }, k).err || intero(s, sci, 'fango'),
    'per analizzare serve il reperto a portata'
  );
  s = fai(s, { t: 'proietta', uid: luo, rep: 'fango' }, k);
  s = fai(s, { t: 'analizza', uid: sci, id: 'a-fango' }, k);
  ck(!s.rel.pioggia && s.lab.length === 1, "l'analisi parte e non è subito pronta");
  s = fai(s, { t: 'pausa', uid: 'tv', regia: true }, k);
  ORA += 10 * 60000;
  ck(F.tick(s, k, ORA) === null, 'in pausa il tempo si ferma');
  s = fai(s, { t: 'pausa', uid: 'tv', regia: true }, k);
  ck(s.fino > ORA && s.lab[0].pronta > ORA, 'dopo la pausa timer e laboratorio ripartono da dove erano');
  ORA += 2 * 60000;
  s = F.tick(s, k, ORA).s;
  ck(intero(s, sci, 'pioggia'), "il laboratorio consegna l'esito a chi l'ha chiesto");
  s = fai(s, { t: 'proietta', uid: sci, rep: 'pioggia' }, k);
  s = fai(s, { t: 'collega', uid: tes, ids: ['fango', 'pioggia'] }, k);
  s = fai(s, { t: 'risolvi', uid: tes, scelta: 1 }, k);
  ck(!s.ded.includes('finestra-falsa'), 'risposta sbagliata al collegamento: niente deduzione');
  s = fai(s, { t: 'collega', uid: tes, ids: ['fango', 'pioggia'] }, k);
  s = fai(s, { t: 'risolvi', uid: tes, scelta: 0 }, k);
  ck(
    s.ded.includes('finestra-falsa') && F.pubblico(s, k).ded.length === 1,
    'deduzione giusta: va sulla linea del tempo della TV'
  );
  ck(
    prova(s, { t: 'collega', uid: tes, ids: ['agenda', 'pianta'] }, k).err,
    'si collegano solo reperti propri o sulla TV'
  );
  for (const x of ['denuncia', 'pianta', 'agenda']) {
    const h = chiHa(s, x);
    if (h) s = fai(s, { t: 'proietta', uid: h, rep: x }, k);
  }
  ck(s.muro.length <= 3, 'sul muro della TV al massimo tre reperti');
  ck(prova(s, { t: 'proponi', uid: 'u1', dom: 'quando', val: 'domani' }, k).err, 'un orario non valido si rifiuta');
  s = fai(s, { t: 'proponi', uid: 'u1', dom: 'quando', val: '22.40' }, k);
  s = fai(s, { t: 'parere', uid: 'u2', dom: 'quando', si: false }, k);
  ck(prova(s, { t: 'consegna', uid: 'u1', dom: 'quando' }, k).err, 'consegna solo il caposquadra');
  s = fai(s, { t: 'consegna', uid: s.capo, dom: 'quando' }, k);
  const pq = F.pubblico(s, k).domande.find(d => d.id === 'quando');
  ck(pq.stato === 'consegnata' && pq.risposta === undefined, 'la TV mostra che la squadra ha risposto, non che cosa');
}
// doppio tocco dell'avanti: il secondo, partito dallo stesso punto, non salta l'indagine
{
  let s = F.nuova(k0, gioc(2), {}).s;
  s = avanti(s, k0);
  while (s.riga < k0.capitoli[0].apertura.length) s = avanti(s, k0);
  const at = F.mani(s, k0)[s.capo].stato.punto;
  s = fai(s, { t: 'avanti', uid: s.capo, at }, k0);
  ck(s.fase === 'indagine', 'l’ultimo tocco dell’apertura apre l’indagine');
  s = fai(s, { t: 'avanti', uid: s.capo, at }, k0);
  ck(s.fase === 'indagine', 'il secondo tocco dallo stesso schermo viene ignorato');
}
// doppio tocco
{
  const k = k0;
  let s = F.nuova(k, gioc(2), {}).s;
  s = avanti(s, k);
  while (s.fase === 'apertura') s = avanti(s, k);
  const u = conSpec(s, 'luoghi');
  s = fai(s, { t: 'esplora', uid: u, zona: 'cesta', seq: 1 }, k);
  const r = F.act(s, { t: 'esplora', uid: u, zona: 'cesta', seq: 1 }, k, ORA);
  ck(!r.err && r.s === s, 'doppio tocco con lo stesso seq: ignorato senza errore');
  const t = F.tick(s, k, s.fino + 1).s;
  ck(t.fase === 'consegna', 'scaduto il capitolo restano pochi minuti per consegnare');
  ck(
    F.act(t, { t: 'esplora', uid: u, zona: 'finestra' }, k, s.fino + 2).err,
    'nei minuti della consegna non si spendono ore'
  );
  const r2 = F.tick(t, k, t.fino + 1).s;
  ck(r2.fase === 'rivelazione' && r2.ore < s.ore, 'senza risposta la domanda è sbagliata e costa ore');
}
console.log(fails ? fails + ' FALLITI' : 'tutto ok');
process.exit(fails ? 1 : 0);
