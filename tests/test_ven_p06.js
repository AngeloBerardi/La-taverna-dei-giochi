// Passo 06: il motore delle battaglie grandi (tetto dalla scheda, campo che cresce, ondate, modificatori, ripetibilità).
const assert = require('assert');
const carica = require('./carica.js');
const C = carica.multi(carica.VEN_FILES, 'VCAM'), D = carica.multi(carica.VEN_FILES, 'VDAT');
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const grande = o => Object.assign({ seme: 5, a: T(0, { val_f2: 90, val_t2: 40, val_c3: 20 }), b: T(5, { fer_f2: 90, fer_t2: 40, fer_c3: 20 }), cap, faza: 'tu', fazb: 'fer', max: 110, W: 100, H: 140 }, o || {});
const vivi = (s, l) => C.vivi(s, l).length;

// taglie
assert.strictEqual(JSON.stringify(C.taglia('grande')), JSON.stringify({ max: 110, W: 100, H: 140 }));
assert.strictEqual(JSON.stringify(D.TAGLIA.piccola), JSON.stringify({ max: 40, W: 60, H: 100 }));
assert.strictEqual(JSON.stringify(C.taglia('boh')), JSON.stringify({ max: 34, W: 60, H: 100 }), 'taglia ignota');

// senza `max` il campo resta quello di oggi
{
  const s = C.nuovo(grande({ max: undefined, W: undefined, H: undefined }), { autoA: true });
  assert.strictEqual(s.max, 34); assert.strictEqual(s.W, 60); assert.strictEqual(s.H, 100); assert.strictEqual(vivi(s, 'b'), 34);
}

// 150 uomini per lato, tetto 110: subito 110 in campo (il capitano di `a` conta), il resto in riserva, rinforzi a 28 per volta
{
  const s = C.nuovo(grande(), { autoA: true });
  assert.strictEqual(s.max, 110); assert.strictEqual(s.W, 100); assert.strictEqual(s.H, 140);
  C.passo(s, 1);
  assert.strictEqual(vivi(s, 'a'), 110, 'a: 110 in campo'); assert.strictEqual(vivi(s, 'b'), 110, 'b: 110 in campo');
  assert.strictEqual(C.riserva(s, 'b'), 40, 'b: 40 in riserva'); assert.strictEqual(C.riserva(s, 'a'), 41, 'a: 41 in riserva');
  const rinf = [];
  for (let i = 0; i < 3000 && !s.fine; i++) for (const e of C.passo(s, 1)) if (e.t === 'rinforzi') rinf.push(e.n);
  assert(rinf.length > 0, 'arrivano rinforzi'); assert.strictEqual(rinf[0], 28, 'la prima ondata è di 28');
  assert(rinf.every(n => n <= 28), 'mai più di 28 per volta');
  assert(vivi(s, 'a') <= 110 && vivi(s, 'b') <= 110, 'mai oltre il tetto');
}

// conservazione degli uomini e fine partita
{
  const s = C.nuovo(grande({ seme: 8 }), { autoA: true });
  const tot = l => vivi(s, l) + C.riserva(s, l) + s.u.filter(u => u.l === l && u.st !== 'vivo').length;
  const a0 = tot('a'), b0 = tot('b');
  while (!s.fine) C.passo(s, 50);
  assert.strictEqual(tot('a'), a0); assert.strictEqual(tot('b'), b0); assert(s.fine.t <= 7000);
}

// stesso seme, stesso esito; semi diversi, esiti diversi
{
  const r1 = C.risolvi(grande()), r2 = C.risolvi(grande()), r3 = C.risolvi(grande({ seme: 6 }));
  assert.strictEqual(JSON.stringify(r1), JSON.stringify(r2)); assert.notStrictEqual(JSON.stringify(r1), JSON.stringify(r3));
}

// i modificatori: dimezzare la velocità dei cavalieri di `a`
{
  const base = C.nuovo(grande(), { autoA: true }), m = C.nuovo(grande({ mod: { a: { c: { vel: .5 } } } }), { autoA: true });
  const cav = s => s.u.filter(u => u.l === 'a' && u.c === 'c' && !u.cap), cb = cav(base), cm = cav(m);
  assert(cm.length > 0 && cm.length === cb.length);
  cm.forEach((u, i) => assert.strictEqual(u.vel, cb[i].vel * .5, 'velocità dimezzata'));
  const altri = s => s.u.filter(u => !(u.l === 'a' && u.c === 'c') && !u.cap).map(u => u.vel + '/' + u.att + '/' + u.dif);
  assert.strictEqual(altri(m).join(), altri(base).join(), 'gli altri non cambiano');
}
{
  const m = C.nuovo(grande({ mod: { b: { f: { att: 2, dif: .5 }, t: { git: .5 } } } }), { autoA: true }), b0 = C.nuovo(grande(), { autoA: true });
  const g = (s, c) => s.u.find(u => u.l === 'b' && u.c === c);
  assert.strictEqual(g(m, 'f').att, g(b0, 'f').att * 2); assert.strictEqual(g(m, 'f').dif, g(b0, 'f').dif * .5);
  assert.strictEqual(g(m, 't').git, Math.round(g(b0, 't').git * .5));
}

// lo stato resta clonabile in JSON
{
  const s = C.nuovo(grande(), { autoA: true }); C.passo(s, 30);
  const c = JSON.parse(JSON.stringify(s)); delete c.r; delete s.r;
  assert.strictEqual(JSON.stringify(c), JSON.stringify(s));
}
console.log('test_ven_p06: ok');
