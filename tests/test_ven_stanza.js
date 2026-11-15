// Compagnia di ventura in compagnia (VST): più capitani in una compagnia, mosse con «fin dove ero arrivato»,
// telefoni che fanno scorrere il tempo da soli e restano uguali, battaglia condivisa con un capitano a testa.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27a-avv-dadi.js', '28j-ven-dati.js', '28k-ven-mondo.js', '28l-ven-campo.js', '28m-ven-stanza.js'];
const S = carica.multi(F, 'VST'), V = carica.multi(F, 'VEN'), C = carica.multi(F, 'VCAM');
const ok = r => { assert(!r.err, r.err); return r.s; };
const J = x => JSON.stringify(x);
{
  const src = fs.readFileSync(path.join(__dirname, '../src/js/motori/28m-ven-stanza.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/Math\.(random|sin|cos|atan2?)\b|Date\.now|new Date/.test(src), 'funzione non ripetibile nel motore della stanza');
}
// tre capitani: contratto della stanza, compagnia più grossa, un capitano a testa
let g = S.nuova(3, ['Angelo', 'Bea', 'Ciro'], { seme: 7, regno: 'val' });
{
  for (const k of ['n', 'names', 'hands', 'cur', 'log', 'ev', 'evn', 'over']) assert(k in g, 'manca ' + k);
  assert(g.sim === true && g.n === 3 && V.capi(g.w).length === 3 && V.capi(g.w)[2].nome === 'Ciro');
  assert(V.uomini(V.TU(g.w)) > V.uomini(V.TU(V.nuovo(7, { regno: 'val' }))), 'più capitani, più uomini alla partenza');
  assert(S.nuova(9, ['a', 'b', 'c', 'd', 'e', 'f'], { seme: 1 }).n === S.MAX, 'al massimo quattro capitani');
  assert(S.act(g, { t: 'ordina', seat: 5, o: { t: 'ferma' } }).err && S.act(g, { t: 'balla', seat: 0 }).err && S.act(null, {}).err);
  const prima = J(g); S.act(g, { t: 'ordina', seat: 1, o: { t: 'aspetta', ore: 3 } }); assert.strictEqual(J(g), prima, 'act non tocca lo stato che riceve');
}
// il tempo: fermo senza meta, scorre con una meta; due telefoni che avanzano da soli restano uguali; `fino` porta lo stato fin lì
{
  assert(!S.scorre(g)); const t0 = g.w.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 0, fino: t0 + 500 })).w.t, t0, 'senza meta il tempo non passa');
  const vil = g.w.l.filter(l => l.tipo === 'villaggio' && l.faz === 'val').sort((a, b) => V.dist(a, V.TU(g.w)) - V.dist(b, V.TU(g.w)))[0];
  g = ok(S.act(g, { t: 'ordina', seat: 2, o: { t: 'entra', lid: vil.id } })); assert(S.scorre(g), 'chiunque può dare la meta');
  const a = S.copia(g), b = S.copia(g); S.avanza(a, g.w.t + 40); for (let k = 0; k < 40; k++) S.avanza(b, b.w.t + 1);
  assert.strictEqual(J(a.w), J(b.w), 'a passi diversi, stesso mondo');
  const c = ok(S.act(g, { t: 'tempo', seat: 1, fino: g.w.t + 40 })); assert.strictEqual(J(c.w), J(a.w), 'la mossa «tempo» porta la stanza dove sono i telefoni');
  assert.strictEqual(ok(S.act(c, { t: 'tempo', seat: 0, fino: g.w.t + 10 })).w.t, c.w.t, 'il tempo non torna indietro');
  // si arriva: il tempo si ferma da solo sulla porta del villaggio
  let n = 0; while (g.w.dentro < 0 && n++ < 300) { g = ok(S.act(g, { t: 'tempo', seat: 0, fino: g.w.t + 60 })); if (g.w.incontro) g = ok(S.act(g, { t: 'scegli', seat: 0, v: g.w.incontro.tipo === 'parla' ? 'lascia' : 'fuggi' })); if (!V.TU(g.w).ord && g.w.dentro < 0) g = ok(S.act(g, { t: 'ordina', seat: 0, o: { t: 'entra', lid: vil.id } })); }
  assert.strictEqual(g.w.dentro, vil.id); const tf = g.w.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 0, fino: tf + 300 })).w.t, tf);
  // ognuno spende i suoi punti e compra per sé, dalla cassa comune
  const u0 = V.uomini(V.TU(g.w)); g = ok(S.act(g, { t: 'fai', seat: 1, z: { a: 'recluta', n: 1 } })); assert.strictEqual(V.uomini(V.TU(g.w)), u0 + 1);
  g = ok(S.act(g, { t: 'fai', seat: 2, z: { a: 'abilita', k: 'medicina' } })); assert(V.capi(g.w)[2].ab.medicina === 1 && V.capi(g.w)[0].ab.medicina === 0 && V.capi(g.w)[2].punti === 0);
  assert(S.act(g, { t: 'fai', seat: 2, z: { a: 'abilita', k: 'medicina' } }).err, 'i punti sono di chi li ha');
  assert.strictEqual(V.abil(g.w, 'medicina'), 1, 'la compagnia usa il migliore dei capitani');
  g = ok(S.act(g, { t: 'vel', seat: 0, v: 4 })); assert(g.vel === 4); g = ok(S.act(g, { t: 'fai', seat: 0, z: { a: 'esci' } }));
}
// battaglia condivisa: un capitano a testa, ordini di tutti, telefoni uguali, esito nel mondo
{
  const w = g.w, tu = V.TU(w); tu.tr = [{ t: 'val_f3', n: 14, f: 0, xp: 0 }, { t: 'val_t3', n: 8, f: 0, xp: 0 }];
  const p = w.p.find(p => p.k === 'pre'); p.tr = [{ t: 'pre_f1', n: 9, f: 0, xp: 0 }, { t: 'pre_t2', n: 3, f: 0, xp: 0 }]; w.incontro = { tipo: 'nemico', pid: [p.id], all: [], da: 'tu' };
  assert(!S.scorre(g), 'con un incontro aperto il mondo aspetta');
  g = ok(S.act(g, { t: 'scegli', seat: 1, v: 'attacca' })); assert(g.b && !g.b.via && g.b.c.capi.length === 3, 'tre capitani in campo');
  assert(S.act(g, { t: 'ordina', seat: 0, o: { t: 'ferma' } }).err, 'in battaglia niente ordini sulla mappa');
  const t0 = g.b.c.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 0, fino: 50 })).b.c.t, t0, 'prima del via la battaglia è ferma');
  g = ok(S.act(g, { t: 'b-via', seat: 2 }));
  g = ok(S.act(g, { t: 'b-cap', seat: 1, o: { x: 12, y: 60 }, fino: 5 })); assert.strictEqual(g.b.c.t, 5, 'la mossa porta la battaglia all\'istante di chi la fa');
  const c1 = C.capU(g.b.c, 1), c0 = C.capU(g.b.c, 0); assert(c1.vx === 12 && c0.vx !== 12, 'ognuno muove solo il suo capitano');
  const a = S.copia(g), b = S.copia(g); S.avanzaB(a, 60); for (let k = 6; k <= 60; k++) S.avanzaB(b, k); assert.strictEqual(J(a.b.c.u), J(b.b.c.u), 'due telefoni, stessa battaglia');
  g = ok(S.act(g, { t: 'b-ord', seat: 2, o: { g: 'tutti', t: 'segui' }, fino: 20 })); assert(g.b.c.ord.a.f.t === 'segui' && g.b.c.ord.a.f.seg === 2, '«Seguimi» segue chi lo dice');
  g = ok(S.act(g, { t: 'b-pausa', seat: 0, v: true, fino: 30 })); const tp = g.b.c.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 1, fino: 400 })).b.c.t, tp, 'chiunque mette in pausa');
  g = ok(S.act(g, { t: 'b-pausa', seat: 1, v: false })); g = ok(S.act(g, { t: 'b-ord', seat: 0, o: { g: 'tutti', t: 'carica' } }));
  assert(S.act(g, { t: 'b-fine', seat: 0 }).err, 'non si chiude una battaglia in corso');
  let n = 0; while (!g.b.c.fine && n++ < 80) g = ok(S.act(g, { t: 'tempo', seat: n % 3, fino: g.b.c.t + 100 }));
  assert(g.b.c.fine && g.b.c.fine.vince === 'a', 'i veterani con tre capitani battono dodici predoni');
  const vinte = g.w.stat.vinte, x0 = V.capi(g.w).map(c => c.xp + c.liv * 1000); g = ok(S.act(g, { t: 'b-fine', seat: 1 }));
  assert(!g.b && g.w.stat.vinte === vinte + 1 && !g.w.incontro && g.w.ult.vince === 'a' && g.nb === 1);
  V.capi(g.w).forEach((c, i) => assert(c.xp + c.liv * 1000 > x0[i], 'tutti i capitani fanno esperienza'));
  assert(S.act(g, { t: 'b-fine', seat: 0 }).err, 'chiusa una volta sola');
}
// se cadono tutti i capitani e la giornata è persa, la compagnia è in catene e il tempo corre da solo
{
  const w = g.w, p = w.p.find(p => p.k === 'pre'); p.tr = [{ t: 'pre_f3', n: 60, f: 0, xp: 0 }]; w.incontro = { tipo: 'nemico', pid: [p.id], all: [], da: 'loro' };
  V.esito(w, { vince: 'b', cad: [], capKo: true }); assert(w.prigioniero && S.scorre(g) && S.ritmo(g) >= 6);
  let n = 0; while (g.w.prigioniero && n++ < 200) g = ok(S.act(g, { t: 'tempo', seat: 0, fino: g.w.t + 120 })); assert(!g.w.prigioniero, 'prima o poi si fugge');
}
console.log('ven_stanza ok');
