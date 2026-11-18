// Passo 25: le manovre dei ranghi 3 e 4 (casi rapidi). La scala e le prove di ogni manovra sono in test_ven_p25_lento.js.
const assert = require('assert');
const carica = require('./carica.js');
const prova = require('../tools/avventura/giocatore-prova.js');
const X = carica.multi(carica.VEN_FILES, '({ VCAM, VCONS, VDAT })'), C = X.VCAM, K = X.VCONS;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const J = x => JSON.stringify(x);
const grande = (rango, o) => C.nuovo(Object.assign({ seme: 5, a: T(0, { val_f2: 40, val_t2: 16, val_c3: 12 }), b: T(5, { fer_f2: 40, fer_t2: 16, fer_c3: 12 }), faza: 'tu', fazb: 'fer', reparti: true, ondate: true, max: 80, W: 100, H: 140, rango }, o || {}), { autoA: true });

// le manovre dei ranghi 3 e 4 sono quelle del passo
assert.strictEqual(K.MANOVRE.filter(m => m.rango === 3).map(m => m.id).join(), 'prendi,aggira,rotazione,serra,riserva');
assert.strictEqual(K.MANOVRE.filter(m => m.rango === 4).map(m => m.id).join(), 'esca,incudine,caccia,fianco,ritirata');
assert.strictEqual(K.MANOVRE.filter(m => m.rango <= 2).length, 10);

// senza `rango` nulla cambia: niente stato nuovo, niente eventi nuovi, e il riepilogo non porta `ordinata`
{
  const s = C.nuovo({ seme: 9, a: T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), b: T(5, { fer_f2: 12, fer_t2: 6, fer_c3: 4 }), faza: 'tu', fazb: 'fer' }, { autoA: true });
  while (!s.fine) C.passo(s, 50);
  assert(s.rango === undefined && s.cons === undefined && s.ordinata === undefined);
  const r = C.riepilogo(s); assert(!('ordinata' in r));
  assert.strictEqual(J(r), J(C.risolvi({ seme: 9, a: T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), b: T(5, { fer_f2: 12, fer_t2: 6, fer_c3: 4 }), faza: 'tu', fazb: 'fer' })));
}

// ripetibile e salvabile: due partite uguali danno lo stesso stato; una ripresa da un salvataggio a metà continua uguale (stato JSON, anche i piani)
{
  const sc = () => grande({ a: 3, b: 4 });
  const a = sc(), b = sc(); C.passo(a, 500); C.passo(b, 500); assert.strictEqual(J(a), J(b));
  const c = JSON.parse(J(a)); C.passo(a, 400); C.passo(c, 400); assert.strictEqual(J(a), J(c));
  assert(a.cons && a.cons.b && a.cons.a);
}

// ranghi alti: ondate (due, la seconda a comando), reparti dei fanti in due, i tiratori sull'altura nella propria metà
{
  const s = grande({ a: 3, b: 4 }, { zone: [{ k: 'altura', x: 30, y: 30, rx: 12, ry: 9, h: 1 }, { k: 'altura', x: 70, y: 110, rx: 12, ry: 9, h: 1 }] });
  for (const l of ['a', 'b']) {
    assert.strictEqual(s.ond[l].length, 2); assert.strictEqual(s.ond[l][1].id, 'riserva'); assert.strictEqual(s.ond[l][1].quando.k, 'comando');
    assert(s.ord[l][3] && s.ord[l][3].c === 'f', 'fanti in due reparti');
  }
  assert.strictEqual(J(s.ond.a[0].quando), J({ k: 'linea', v: 60 })); assert.strictEqual(J(s.ond.b[0].quando), J({ k: 'tempo', v: 300 })); assert(['fsx', 'fdx'].includes(s.ond.b[0].ing));
  assert.strictEqual(s.ord.b.t.x, 30); assert.strictEqual(s.ord.b.t.y, 30);   // b sale sull'altura della sua metà (in alto)
  assert.strictEqual(s.ord.a.t.x, 70); assert.strictEqual(s.ord.a.t.y, 110);
  // il rango 2 non cambia: una sola ondata dal retro a linea calata
  const s2 = grande({ a: 2, b: 2 }, { max: 50 }); assert.strictEqual(s2.ond.b.length, 1); assert.strictEqual(s2.ond.b[0].ing, 'retro'); assert(!s2.ord.b[3]);
}

// lo schieramento guarda il nemico: chi si schiera per secondo mette la serrata (e il reparto con le picche) davanti alla cavalleria avversaria
{
  const mk = () => C.nuovo({ seme: 5, a: T(0, { val_f2: 40, val_t2: 10, val_c3: 12 }), b: T(5, { fer_f2: 40, fer_t2: 10 }), faza: 'tu', fazb: 'fer', reparti: true, max: 80, W: 100, H: 140, zone: [], rango: { a: 0, b: 3 } });
  const s = mk(); assert(!s.ord.b[3] || s.ord.b[3].x === 50, 'prima del Pronto il lato b non si è schierato');
  C.pronto(s, 'a');
  const cav = s.u.filter(u => u.l === 'a' && u.c === 'c'); const cx = cav.reduce((a, u) => a + u.x, 0) / cav.length;
  const vicino = Object.keys(s.ord.b).filter(k => s.ord.b[k].c === 'f' || k === 'f').some(k => Math.abs(s.ord.b[k].x - cx) < 1 && s.ord.b[k].fm === 'serrata');
  assert(vicino, 'un reparto di fanti in serrata sta davanti alla cavalleria nemica (x=' + cx.toFixed(1) + ')');
}

// la ritirata ordinata: il riepilogo la dichiara, la rotta è del lato che ripiega
{
  const sc = { seme: 3, a: T(0, { val_f2: 36, val_t2: 14, val_c3: 10 }), b: T(5, { fer_f2: 18, fer_t2: 7, fer_c3: 5 }), faza: 'tu', fazb: 'fer', rango: { a: 2, b: 4 }, zone: [] };
  const r = C.risolvi(sc); assert.strictEqual(r.vince, 'a'); assert.strictEqual(r.ordinata, true);
  const s = C.nuovo(sc, { autoA: true }); const ev = []; while (!s.fine) for (const e of C.passo(s, 10)) ev.push(e);
  assert(ev.some(e => e.t === 'piano' && e.m === 'ritirata' && e.l === 'b')); assert(ev.some(e => e.t === 'rotta' && e.l === 'b' && e.ordinata));
  assert.strictEqual(s.ordinata, 'b');
  // senza il rango 4 non ripiega
  const r2 = C.risolvi(Object.assign({}, sc, { rango: { a: 2, b: 3 } })); assert(!r2.ordinata);
}

// il segno leggibile: ogni manovra nuova porta un evento `piano` con il suo nome; l'esca resta muta
{
  const s = grande({ a: 4, b: 4 }); const visti = new Set(); for (let i = 0; i < 60 && !s.fine; i++) for (const e of C.passo(s, 20)) if (e.t === 'piano') visti.add(e.m);
  assert(visti.size >= 5, 'varie manovre: ' + [...visti].join()); assert(!visti.has('esca'));
  for (const m of visti) assert(K.MANOVRE.some(x => x.id === m), 'manovra sconosciuta ' + m);
}

// il giocatore di prova è ripetibile e tiene le sue abitudini: la cavalleria carica per prima, i tiratori restano fermi
{
  const mk = () => C.nuovo({ seme: 4, a: T(0, { val_f2: 14, val_t2: 6, val_c3: 6 }), b: T(5, { fer_f2: 14, fer_t2: 6, fer_c3: 6 }), faza: 'tu', fazb: 'fer', rango: { a: 0, b: 3 }, zone: [] });
  const a = prova.gioca(C, mk(), s => s.t < 100), b = prova.gioca(C, mk(), s => s.t < 100); assert.strictEqual(J(a), J(b));
  assert.strictEqual(a.ord.a.c.t, 'carica'); assert.strictEqual(a.ord.a.t.t, 'tieni'); assert.strictEqual(a.ord.a.f.t, 'tieni');   // i fanti aspettano FANTI_T istanti
  const c = prova.gioca(C, mk(), s => s.t < prova.FANTI_T + 20); assert.strictEqual(c.ord.a.f.t, 'carica');
}
console.log('test_ven_p25 ok');
