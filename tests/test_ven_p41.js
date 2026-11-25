// Passo 41: feudi vivi, costruire (28ko, solo mondi `s.geo===2`). Prove rapide; la partita lunga è in test_ven_p41_lento.js.
//  (a) il mulino ai tre livelli costa 500 e porta la rendita da 150 a 1,45 volte: ritorno tra 40 e 60 giorni;
//  (b) gli errori di `costruisci` nell'ordine; un secondo cantiere nello stesso luogo è rifiutato; (c) un cantiere di 4 giorni finisce al quarto giorno;
//  (d) razzia e conquista tolgono un livello all'edificio più alto e il cantiere; (e) mura 2: l'assalto dell'IA arriva 24 ore dopo; (f) cappella 3: +9 di morale;
//  (g) mondo vecchio: «Qui non si costruisce»; i salvataggi di tests/fixture/ven/ si aprono senza `edif`;
//  in più: palizzata, campo d'addestramento, caserma, mercato, torre, razzia dell'IA, compagnia (seat), salvataggio.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })');
const ED = D.EDIFICI, eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
const mondo = (seme, opz) => V.nuovo(seme, { opz: Object.assign({ geo: 2 }, opz) });
const giorno = (s, g) => { s.t = (g - 1) * 1440 + 600; return s; };
const avanza = (s, da, a) => { for (let g = da; g <= a; g++) { giorno(s, g); s.tregua = 1e9; V.giornoNuovo(s); } };
// un luogo del tipo dato, reso tuo, con il capitano dentro e monete a volontà
function mio(s, tipo, oro) {
  const l = s.l.find(x => x.tipo === tipo && x.faz !== 'tu' && x.sig < 0 && !x.edif) || s.l.find(x => x.tipo === tipo && x.faz !== 'tu' && !x.edif); assert(l, 'luogo ' + tipo);
  l.faz = 'tu'; l.sig = -1; l.prosp = 60; const tu = V.TU(s); tu.x = l.x; tu.y = l.y; s.dentro = l.id; tu.oro = oro == null ? 5000 : oro; return l;
}
const costruisci = (s, id, extra) => V.fai(s, Object.assign({ a: 'costruisci', id }, extra));
// costruisce un edificio fino al livello n saltando i giorni
function alza(s, l, id, n) { let g = V.giorno(s); for (let k = 0; k < n; k++) { const r = costruisci(s, id); assert(r.s, id + ': ' + r.err); g += ED[id].giorni[k]; avanza(s, g, g); assert(!l.cant); } return g; }

// ---- i dati ----
{
  eq(Object.keys(ED), ['mulino', 'palizzata', 'addestra', 'mura', 'caserma', 'mercato', 'torre', 'cappella']);
  for (const id of Object.keys(ED)) { assert.strictEqual(ED[id].costo.length, 3); assert.strictEqual(ED[id].giorni.length, 3); assert(ED[id].dove.length >= 1); }
  eq(ED.mulino.costo, [100, 160, 240]); eq(ED.mura.giorni, [8, 10, 12]);
  const s = mondo(3), l = s.l.find(x => x.tipo === 'villaggio');
  eq(V.edifici(s, l).map(e => e.id), ['mulino', 'palizzata', 'addestra', 'cappella'], 'un villaggio ne vede quattro');
  eq(V.edifici(s, s.l.find(x => x.tipo === 'castello')).map(e => e.id), ['mura', 'caserma', 'torre', 'cappella']);
  eq(V.edifici(s, s.l.find(x => x.tipo === 'porto')).map(e => e.id), ['mercato', 'torre']);
}

// ---- (a) il mulino rende ----
{
  const s = mondo(3), l = mio(s, 'villaggio', 600), tu = V.TU(s);
  const r0 = V.rendite(s); assert.strictEqual(r0, 150, 'villaggio a prosperità 60: 150 a settimana');
  let spesa = 0, g = 1; giorno(s, g);
  for (let k = 0; k < 3; k++) { const o = tu.oro, r = costruisci(s, 'mulino'); assert(r.s, r.err); spesa += o - tu.oro; g += ED.mulino.giorni[k]; avanza(s, g, g); assert.strictEqual(l.edif.mulino, k + 1); }
  assert.strictEqual(spesa, 500, 'i tre livelli costano 500');
  const r3 = V.rendite(s); assert(r3 === 217 || r3 === 218, 'rendita ' + r3);
  const ritorno = spesa / ((r3 - r0) / 7); assert(ritorno > 40 && ritorno < 60, 'ritorno in ' + ritorno + ' giorni');
  // il mulino porta grano nelle scorte (cima a TETTO) e non cambia la rendita degli altri luoghi
  l.scorte.grano = 10; const g0 = l.scorte.grano; avanza(s, g + 1, g + 1); assert(l.scorte.grano >= g0 + 3 - 6, 'il grano non cala di colpo');
  assert.strictEqual(V.molt(s, 'rendita', { lid: s.l.find(x => !x.edif).id }), 1);
}

// ---- (b) gli errori nell'ordine ----
{
  const s = mondo(3), v = mio(s, 'villaggio', 50), tu = V.TU(s);
  assert.strictEqual(costruisci(s, 'mura').err, 'Qui non si costruisce', 'le mura non stanno in un villaggio');
  assert.strictEqual(costruisci(s, 'inesistente').err, 'Edificio sconosciuto');
  const altro = s.l.find(x => x.tipo === 'villaggio' && x.faz !== 'tu' && x.id !== v.id); s.dentro = altro.id; tu.oro = 0;
  assert.strictEqual(costruisci(s, 'mulino').err, 'Non è un tuo luogo', 'prima il luogo, poi le monete');
  s.dentro = v.id; assert.strictEqual(costruisci(s, 'mulino').err, 'Servono 100 monete');
  tu.oro = 1000; v.cant = { id: 'palizzata', fino: 99 }; assert.strictEqual(costruisci(s, 'mulino').err, 'C\'è già un cantiere'); v.cant = null; delete v.cant;
  v.edif = { mulino: 3 }; assert.strictEqual(costruisci(s, 'mulino').err, 'Già al massimo');
  assert.strictEqual(tu.oro, 1000, 'gli errori non costano nulla');
  // il feudo da vassallo (sig -2) conta come tuo; fuori dal luogo non si costruisce
  const f = s.l.find(x => x.tipo === 'villaggio' && x.faz !== 'tu' && x.id !== v.id && x.id !== altro.id); f.sig = -2; s.dentro = f.id; assert(costruisci(s, 'palizzata').s, 'feudo da vassallo');
  s.dentro = -1; assert.strictEqual(costruisci(s, 'cappella').err, 'Qui non si costruisce');
  // un secondo cantiere nello stesso luogo
  s.dentro = v.id; v.edif = {}; assert(costruisci(s, 'mulino').s); assert.strictEqual(costruisci(s, 'palizzata').err, 'C\'è già un cantiere'); assert.strictEqual(V.cantiere(s, v).id, 'mulino');
  // capitano sconosciuto (compagnia): la mossa con un seat che non c'è non spende
  const o = tu.oro; assert.strictEqual(V.fai(s, { a: 'costruisci', id: 'cappella', seat: 9 }).err, 'Capitano sconosciuto'); assert.strictEqual(tu.oro, o);
  assert.strictEqual(V.fai(s, { a: 'arruola', n: 1 }).err, 'Qui non c\'è una caserma');
}

// ---- (c) il cantiere finisce al quarto giorno ----
{
  const s = mondo(3), l = mio(s, 'villaggio', 500); giorno(s, 10);
  assert(costruisci(s, 'mulino').s); eq(l.cant, { id: 'mulino', fino: 14 }); assert.strictEqual(V.cantiere(s, l).resta, 4);
  for (const g of [11, 12, 13]) { avanza(s, g, g); assert(l.cant && !l.edif, 'giorno ' + g + ': ancora in cantiere'); }
  s.log.length = 0; avanza(s, 14, 14); assert(!l.cant && l.edif.mulino === 1, 'finito al quarto giorno');
  assert(s.log.some(x => /Il mulino di .* è finito \(livello 1\)/.test(x.tx)), 'diario');
}

// ---- (d) razzia e conquista ----
{
  const s = mondo(3), l = mio(s, 'villaggio', 500); l.edif = { mulino: 2, palizzata: 1 }; l.cant = { id: 'cappella', fino: 99 };
  V.ganci('luogo', s, l, 'razzia'); eq(l.edif, { mulino: 1, palizzata: 1 }); assert(!l.cant, 'il cantiere si perde');
  V.ganci('luogo', s, l, 'razzia'); eq(l.edif, { palizzata: 1 }, 'a pari livello il primo dell\'elenco: il mulino sparisce');
  V.ganci('luogo', s, l, 'razzia'); V.ganci('luogo', s, l, 'razzia'); eq(l.edif, {}); V.ganci('luogo', s, l, 'razzia');
  const c = s.l.find(x => x.tipo === 'castello' && x.faz !== 'tu'); c.faz = 'tu'; c.sig = -1; c.edif = { mura: 2, torre: 1 }; c.cant = { id: 'caserma', fino: 99 };
  V.conquista(s, c, V.regni(s)[0], -1); eq(c.edif, { mura: 1, torre: 1 }, 'il luogo conquistato tiene gli edifici rimasti'); assert(!c.cant, 'e perde il cantiere');
  // la razzia dell'IA, davvero: un signore che mette a sacco un villaggio tuo
  const t = mondo(11), v = mio(t, 'villaggio'); v.edif = { mulino: 1, cappella: 1 }; v.cant = { id: 'palizzata', fino: 99 };
  const s0 = V.salva(t); V.ganci('luogo', t, v, 'razzia'); assert.strictEqual(v.edif.cappella, 1); assert(!v.edif.mulino && !v.cant); assert.notStrictEqual(V.salva(t), s0);
}

// ---- (e) le mura ritardano l'assalto dell'IA ----
{
  const ore = n => {
    const s = mondo(3), l = mio(s, 'castello'), tu = V.TU(s); void tu; s.tregua = 1e9;
    if (n) l.edif = { mura: n };
    const p = V._.nuovaP(s, 'pre', 'pre', 'Banda', l.x, l.y, [{ t: 'pre_f1', n: 5, f: 0, xp: 0 }], {}); p.ia = { st: 'giro', t: 0 }; s.p.forEach(q => { if (q !== p && q.id !== 0) q.dentro = q.dentro; });
    l.ass = { faz: 'pre', da: s.t, pid: [p.id] }; let h = 0, visto = null; const a0 = V.assalto;
    V.assalto = (st, x) => { if (visto == null && x === l) visto = h; x.ass = null; };
    try { while (visto == null && h < 200) { h++; s.t += 60; if (!l.ass) break; p.x = l.x; p.y = l.y; p.sc = 0; p.dentro = -1; V.oraNuova(s); } } finally { V.assalto = a0; }
    return visto;
  };
  const base = ore(0), due = ore(2), uno = ore(1);
  assert(base > 0 && base < 100, 'senza mura l\'assalto arriva (' + base + ' ore)');
  assert.strictEqual(due - base, 24, 'mura 2: 24 ore più tardi'); assert.strictEqual(uno - base, 12, 'mura 1: 12 ore più tardi');
  // il tuo assedio a un luogo che ha mura: la breccia arriva 24·n ore dopo, una volta sola
  const s = mondo(3), l = s.l.find(x => x.tipo === 'castello' && x.faz !== 'tu'); l.edif = { mura: 2 }; const t0 = s.t;
  s.assedio = { lid: l.id, pronto: s.t + 600, da: s.t, ariete: false }; V.TU(s).ord = { t: 'aspetta', fino: s.t + 99999 };
  for (let k = 0; k < 3; k++) V.ganci('ora', s); assert.strictEqual(s.assedio.da, t0 + 2 * 1440, 'una sola volta'); assert.strictEqual(s.assedio.mu, 1);
}

// ---- (f) la cappella ----
{
  const prova = n => { const s = mondo(3), l = mio(s, 'villaggio'), tu = V.TU(s); if (n) l.edif = { cappella: n }; tu.mor = 40; tu.tr.forEach((e, i) => { e.f = i === 0 ? 6 : 0; });
    const f0 = tu.tr.reduce((a, e) => a + (e.f || 0), 0), r = V.fai(s, { a: 'riposa' }); assert(r.s, r.err); return { mor: tu.mor, f: tu.tr.reduce((a, e) => a + (e.f || 0), 0), f0 }; };
  const a = prova(0), b = prova(3);
  assert.strictEqual(b.mor - a.mor, 9, 'cappella 3: 9 di morale in più'); assert.strictEqual(a.f - b.f, 3, 'e 3 feriti in più guariti');
  assert.strictEqual(prova(1).mor - a.mor, 3);
  const s = mondo(3), l = mio(s, 'villaggio'); l.edif = { cappella: 3 }; V.TU(s).mor = 95; V.fai(s, { a: 'riposa' }); assert.strictEqual(V.TU(s).mor, 100, 'al più 100');
}

// ---- gli altri edifici ----
{
  // palizzata: guarnigione minima 3·n reclute della cultura di nascita, una al giorno; la razzia dell'IA dura 2·n ore in più
  const s = mondo(3), l = mio(s, 'villaggio'); l.edif = { palizzata: 2 }; l.g = [];
  const cult = V.cult(s, V.mappaDi(s).luoghi[l.id].faz);
  for (let g = 1; g <= 8; g++) avanza(s, g, g); assert.strictEqual(V.uomini({ tr: l.g }), 6, 'guarnigione a 6'); assert(l.g.every(e => e.t === cult + '_f1'), 'cultura di nascita ' + cult);
  const dec = pal => { const t = mondo(3), v = mio(t, 'villaggio'); if (pal) v.edif = { palizzata: pal }; const q = t.p.find(x => x.k === 'sig' && x.faz !== 'tu'); q.dentro = -1; q.x = v.x; q.y = v.y; q.via = []; q.ia = { st: 'razzia', a: v.id, t: 0 };
    t.rel[q.faz] = -50; t.dentro = -1; V.TU(t).x = 1; V.TU(t).y = 1; t.t = 2000; V.decidi(t, q, V.mappaDi(t)); const prima = q.ia.t; V.decidi(t, q, V.mappaDi(t)); return { prima, dopo: q.ia.t, st: q.ia.st, t: t.t }; };
  const d0 = dec(0), d1 = dec(1), d3 = dec(3);
  assert.strictEqual(d0.st, 'razzia'); assert.strictEqual(d1.prima - d0.prima, 120, 'palizzata 1: 2 ore in più'); assert.strictEqual(d3.prima - d0.prima, 360); assert.strictEqual(d1.dopo, d1.prima, 'una volta sola');
  // la tua razzia dura n ore in più: si vede sull'orologio
  const rz = pal => { const t = mondo(3), v = t.l.find(x => x.tipo === 'villaggio' && x.faz !== 'tu'); const f = v.faz; t.rel[f] = -50; if (pal) v.edif = { palizzata: pal }; t.dentro = -1; t.davanti = v.id; const t0 = t.t; const r = V.fai(t, { a: 'razzia' }); assert(r.s, r.err); return { dt: t.t - t0, edif: v.edif && v.edif.palizzata || 0 }; };
  const r0 = rz(0), r2 = rz(2); assert.strictEqual(r2.dt - r0.dt, 120, 'razzia di un villaggio con palizzata 2: 2 ore in più'); assert.strictEqual(r2.edif, 1, 'e il villaggio perde un livello');
}
{
  // campo d'addestramento: dopo `recluta`, floor(n·liv/3) passano da f1 a f2
  const s = mondo(3), l = mio(s, 'villaggio'), tu = V.TU(s); l.edif = { addestra: 3 }; l.rec = 10; l.rel = 0; const c = V.regni(s).includes(l.faz) ? V.cult(s, l.faz) : V._.M0(s, l);
  const n = e => (tu.tr.find(x => x.t === e) || { n: 0 }).n, f1 = n(c + '_f1'), f2 = n(c + '_f2');
  const r = V.fai(s, { a: 'recluta', n: 6 }); assert(r.s, r.err); assert.strictEqual(n(c + '_f1') - f1, 0, 'tutti e sei passati a f2'); assert.strictEqual(n(c + '_f2') - f2, 6);
  l.edif = { addestra: 1 }; l.rec = 10; V.fai(s, { a: 'recluta', n: 6 }); assert.strictEqual(n(c + '_f2') - f2, 8, '6·1/3 = 2 in più');
}
{
  // caserma: volontari a settimana (al più 4·n), arruola dà f(n+1) al prezzo d'ingaggio
  const s = mondo(3), l = mio(s, 'castello', 1000), tu = V.TU(s); l.edif = { caserma: 2 }; l.tr = null;
  for (let g = 1; g <= 21; g++) avanza(s, g, g); assert.strictEqual(l.cas, 6, 'tre settimane da 2: 6');
  for (let g = 22; g <= 60; g++) avanza(s, g, g); assert.strictEqual(l.cas, 8, 'al più 4·n');
  const c = V.regni(s).includes(l.faz) ? V.cult(s, l.faz) : V._.M0(s, l), t = V.cult(s, V.mappaDi(s).luoghi[l.id].faz) + '_f3';
  assert.strictEqual(V.fai(s, { a: 'arruola', n: 20 }).err, 'Non ci sono abbastanza volontari'); void c;
  const o = tu.oro, u = V.uomini(tu); const r = V.fai(s, { a: 'arruola', n: 3 }); assert(r.s, r.err);
  assert.strictEqual(o - tu.oro, D.INGAGGIO[3] * 3, 'ingaggio del terzo grado'); assert.strictEqual(V.uomini(tu), u + 3); assert.strictEqual(l.cas, 5); assert(tu.tr.some(e => e.t === t), t);
  tu.oro = 5; assert.strictEqual(V.fai(s, { a: 'arruola', n: 1 }).err, 'Servono ' + D.INGAGGIO[3] + ' monete');
  tu.oro = 5000; V._.aggiungi(tu.tr, 'pre_f1', V.limite(s) - V.uomini(tu)); assert.strictEqual(V.fai(s, { a: 'arruola', n: 1 }).err, 'La compagnia è al completo');
}
{
  // mercato: rendita ×(1+0,1·n) e +n al giorno alle merci che il luogo produce; torre: vista ×(1+0,15·n) entro 8 caselle
  const s = mondo(3), l = mio(s, 'citta'); const r0 = V.molt(s, 'rendita', { lid: l.id }); l.edif = { mercato: 3, mulino: 0 };
  assert(Math.abs(V.molt(s, 'rendita', { lid: l.id }) - r0 * 1.3) < 1e-9, 'mercato 3: ×1,3');
  const merci = Object.keys(D.MERCI); for (const m of merci) l.scorte[m] = 10; avanza(s, 1, 1);
  const salite = merci.filter(m => l.scorte[m] > 10); assert(salite.length >= 1 && salite.length < merci.length, 'salgono solo le merci prodotte (' + salite + ')');
  const t = mondo(3), c = mio(t, 'citta'), v0 = V.vista(t); c.edif = { torre: 2 }; assert(Math.abs(V.vista(t) - v0 * 1.3) < 1e-9, 'torre 2: ×1,3');
  V.TU(t).x += 20; assert.strictEqual(V.vista(t), v0, 'a più di 8 caselle non conta'); V.TU(t).x = c.x; c.faz = 'neu'; c.sig = 0; assert.strictEqual(V.vista(t), v0, 'un luogo non tuo non conta');
}

// ---- compagnia: due copie fanno lo stesso; salvataggio ----
{
  const gioca = () => { const s = mondo(11), l = mio(s, 'villaggio'); giorno(s, 1); costruisci(s, 'mulino'); costruisci(s, 'palizzata'); V.fai(s, { a: 'costruisci', id: 'cappella', seat: 0 }); avanza(s, 1, 14); l.edif.cappella = 1; return s; };
  const a = gioca(), b = gioca(); assert.strictEqual(V.salva(a), V.salva(b), 'ripetibile');
  const c = V.apri(V.salva(a)); assert.strictEqual(V.salva(c), V.salva(a), 'il salvataggio si riapre'); assert(a.l.some(l => l.edif && l.edif.mulino === 1));
}

// ---- (g) mondi vecchi ----
{
  const s = V.nuovo(3), l = s.l.find(x => x.tipo === 'villaggio'); l.faz = 'tu'; l.sig = -1; s.dentro = l.id; V.TU(s).oro = 5000;
  assert.strictEqual(costruisci(s, 'mulino').err, 'Qui non si costruisce'); assert.strictEqual(V.TU(s).oro, 5000);
  assert.strictEqual(V.fai(s, { a: 'arruola', n: 1 }).err, 'Azione sconosciuta'); eq(V.edifici(s, l), []);
  l.edif = { mulino: 3 }; const r = V.rendite(s); delete l.edif; assert.strictEqual(r, V.rendite(s), 'nei mondi vecchi gli edifici non contano');
  const dir = path.join(__dirname, 'fixture/ven'); let n = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) { const t = V.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(t, f); assert(t.l.every(x => !x.edif && !x.cant && x.cas == null), f); V.passo(t, 60); n++; }
  assert(n >= 6, 'salvataggi aperti: ' + n);
}
console.log('test_ven_p41: ok');
