// Passo 06: il motore delle battaglie grandi (prove lunghe: ondate fino in fondo, conservazione degli uomini, ripetibilità).
const assert = require('assert');
const carica = require('./carica.js');
const C = carica.multi(carica.VEN_FILES, 'VCAM');
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const grande = o => Object.assign({ seme: 5, a: T(0, { val_f2: 90, val_t2: 40, val_c3: 20 }), b: T(5, { fer_f2: 90, fer_t2: 40, fer_c3: 20 }), cap, faza: 'tu', fazb: 'fer', max: 110, W: 100, H: 140 }, o || {});
const vivi = (s, l) => C.vivi(s, l).length;

// rinforzi: sempre a 28 per volta, mai oltre il tetto
{
  const s = C.nuovo(grande(), { autoA: true }), rinf = [];
  for (let i = 0; i < 3000 && !s.fine; i++) { for (const e of C.passo(s, 1)) if (e.t === 'rinforzi') rinf.push(e.n); assert(vivi(s, 'a') <= 110 && vivi(s, 'b') <= 110); }
  assert(rinf.length > 0 && rinf.every(n => n <= 28));
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

console.log('test_ven_p06_lento: ok');
