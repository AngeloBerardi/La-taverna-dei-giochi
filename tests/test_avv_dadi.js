// Dadi dell'avventura: generatore ripetibile, tiri entro i limiti, vantaggio/svantaggio, espressioni di danno, probabilità esatte.
const assert = require('assert');
const D = require('../src/js/motori/27a-avv-dadi.js');

// determinismo: stesso stato iniziale, stessa sequenza; il generatore scrive il suo avanzamento nello stato
{
  const a = { rng: D.semina(42) }, b = { rng: D.semina(42) }, c = { rng: D.semina(43) };
  const ga = D.gen(a), gb = D.gen(b), gc = D.gen(c);
  const sa = [], sb = [], sc = [];
  for (let i = 0; i < 50; i++) { sa.push(ga()); sb.push(gb()); sc.push(gc()); }
  assert.deepStrictEqual(sa, sb, 'stesso seme, stessa sequenza');
  assert.notDeepStrictEqual(sa, sc, 'semi diversi, sequenze diverse');
  assert.strictEqual(a.rng, b.rng); assert.notStrictEqual(a.rng, D.semina(42), 'lo stato avanza');
  assert(sa.every(x => x >= 0 && x < 1));
  // riprendere dallo stato salvato (JSON) dà la stessa continuazione
  const x = { rng: D.semina(7) }, gx = D.gen(x); for (let i = 0; i < 10; i++) gx();
  const salvato = JSON.parse(JSON.stringify(x)), y = D.gen(salvato);
  assert.deepStrictEqual([gx(), gx(), gx()], [y(), y(), y()], 'riprendibile da uno stato salvato');
}
// distribuzione: d20 uniforme (tolleranza larga), medie giuste
{
  const h = { rng: D.semina(1) }, g = D.gen(h), cont = Array(21).fill(0), N = 40000;
  for (let i = 0; i < N; i++) cont[D.d(g, 20)]++;
  assert.strictEqual(cont[0], 0);
  for (let f = 1; f <= 20; f++) assert(Math.abs(cont[f] / N - 0.05) < 0.008, 'faccia ' + f + ' sbilanciata: ' + cont[f] / N);
  const media = fn => { let t = 0; for (let i = 0; i < N; i++) t += fn(); return t / N; };
  assert(Math.abs(media(() => D.d20(g).tiro) - 10.5) < 0.15);
  assert(Math.abs(media(() => D.d20(g, { vant: true }).tiro) - 13.825) < 0.2, 'vantaggio ≈ 13,8');
  assert(Math.abs(media(() => D.d20(g, { svant: true }).tiro) - 7.175) < 0.2, 'svantaggio ≈ 7,2');
  assert(Math.abs(media(() => D.d20(g, { vant: true, svant: true }).tiro) - 10.5) < 0.15, 'vantaggio + svantaggio si annullano');
}
// d20: due dadi con vantaggio, uno senza
{
  const seq = [3, 17].map(n => (n - 0.5) / 20); let i = 0; const rnd = () => seq[i++ % 2];
  assert.deepStrictEqual(D.d20(rnd, { vant: true }), { tiro: 17, tiri: [3, 17] });
  i = 0; assert.deepStrictEqual(D.d20(rnd, { svant: true }), { tiro: 3, tiri: [3, 17] });
  i = 0; assert.deepStrictEqual(D.d20(rnd, {}), { tiro: 3, tiri: [3] });
  i = 0; assert.deepStrictEqual(D.d20(rnd, { vant: true, svant: true }), { tiro: 3, tiri: [3] });
}
// espressioni di danno
{
  assert.deepStrictEqual(D.leggi('2d6+3'), { n: 2, f: 6, b: 3 }); assert.deepStrictEqual(D.leggi('d8'), { n: 1, f: 8, b: 0 });
  assert.deepStrictEqual(D.leggi('1d10 - 1'), { n: 1, f: 10, b: -1 }); assert.deepStrictEqual(D.leggi('5'), { n: 0, f: 0, b: 5 });
  for (const male of ['', 'abc', '2d', 'd0x', '2d6+']) assert.throws(() => D.leggi(male), /non valida/, male);
  assert.strictEqual(D.medio('2d6+3'), 10); assert.strictEqual(D.medio('d8'), 4.5); assert.strictEqual(D.medio('5'), 5);
  const max = () => 0.999999, min = () => 0;
  assert.strictEqual(D.danno(max, '2d6+3').tot, 15); assert.strictEqual(D.danno(min, '2d6+3').tot, 5);
  assert.strictEqual(D.danno(max, '2d6+3', true).dadi.length, 4, 'critico: dadi doppi'); assert.strictEqual(D.danno(max, '2d6+3', true).tot, 27, 'il bonus non raddoppia');
  assert.strictEqual(D.danno(min, '1d4-5').tot, 0, 'mai sotto zero');
  const h = { rng: D.semina(9) }, g = D.gen(h);
  for (let i = 0; i < 2000; i++) { const r = D.danno(g, '3d4+1'); assert(r.tot >= 4 && r.tot <= 13 && r.dadi.length === 3); }
}
// probabilità esatte: 1 e 20 naturali contano; vantaggio e svantaggio
{
  assert.strictEqual(D.prob(0, 11), 0.5); assert.strictEqual(D.prob(0, 1), 0.95, 'l\'1 naturale fallisce');
  assert.strictEqual(D.prob(0, 30), 0.05, 'il 20 naturale riesce sempre'); assert.strictEqual(D.prob(10, 10), 0.95);
  assert(Math.abs(D.prob(0, 11, { vant: true }) - 0.75) < 1e-9); assert(Math.abs(D.prob(0, 11, { svant: true }) - 0.25) < 1e-9);
  assert.strictEqual(D.prob(0, 11, { vant: true, svant: true }), 0.5);
  // coerente con una simulazione
  const h = { rng: D.semina(5) }, g = D.gen(h); let ok = 0; const N = 30000;
  for (let i = 0; i < N; i++) { const t = D.d20(g, { vant: true }).tiro; if (t === 20 || (t !== 1 && t + 3 >= 14)) ok++; }
  assert(Math.abs(ok / N - D.prob(3, 14, { vant: true })) < 0.012);
}
console.log('avv_dadi ok');
