// Passo 16: morale per reparto, fatica, frecce e comandante nemico nel motore della battaglia.
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const X = carica.multi(F, '({ VCAM, VDAT })'), C = X.VCAM, D = X.VDAT;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const scheda = o => Object.assign({ seme: 7, a: T(0, { val_f2: 20, val_t2: 8, val_c3: 6 }), b: T(5, { fer_f2: 20, fer_t2: 8, fer_c3: 6 }), cap, faza: 'tu', fazb: 'fer', reparti: true, max: 80, W: 100, H: 140 }, o || {});
const nuovo = o => C.nuovo(scheda(o), { autoA: true });
const gioca = (s, n) => { const ev = []; for (let i = 0; i < n && !s.fine; i++) for (const e of C.passo(s, 1)) ev.push(Object.assign({ t0: s.t }, e)); return ev };
const nfine = s => { while (!s.fine) C.passo(s, 50); return C.riepilogo(s) };

// 40 semi, truppe pari, il capitano contro un signore con comandante: il lato a vince da 24 a 32 volte
{
  let v = 0;
  for (let seme = 1; seme <= 40; seme++) if (nfine(C.nuovo(scheda({ seme, capoB: true, a: T(0, { val_f2: 20, val_t2: 8, val_c3: 6 }), b: T(5, { val_f2: 20, val_t2: 8, val_c3: 6 }) }), { autoA: true })).vince === 'a') v++;
  assert(v >= 24 && v <= 32, 'vittorie del lato a: ' + v + '/40');
}

// conservazione delle truppe e fine partita: bot intelligente (autoA) su ogni genere di battaglia, con ogni novità accesa
{
  const tipi = [{}, { tipo: 'assedio' }, { tipo: 'assedio', assedio: { breccia: false, ariete: true } }, { max: 40, W: 60, H: 100 }];
  for (const [i, extra] of tipi.entries()) for (let seme = 1; seme <= 4; seme++) {
    const o = Object.assign({ seme: seme * 11 + i, capoB: seme % 2 === 0, fatica0: { a: 20 * seme, b: 10 }, morIni: { a: seme, b: -seme }, ondate: true }, extra);
    const s = C.nuovo(scheda(o), { autoA: true });
    const tot = l => s.u.filter(u => u.l === l && !u.cap).length + C.riserva(s, l) + C.int.inOnda(s, l);
    const n0 = { a: tot('a'), b: tot('b') };
    const r = nfine(s);
    assert(s.fine && r.durata <= C.C.TMAX, 'la battaglia finisce');
    assert.strictEqual(tot('a'), n0.a); assert.strictEqual(tot('b'), n0.b, 'conservazione');
    for (const u of s.u) assert(u.pf >= 0 && !(u.fa < 0) && !(u.fa > 100) && !(u.fr < 0), 'campi in limite');
    for (const l of ['a', 'b']) for (const k of Object.keys(s.mr[l])) assert(s.mr[l][k] >= 0 && s.mr[l][k] <= 100);
    JSON.parse(JSON.stringify(s));
  }
  // il bot casuale (ordini a caso, nessuno sensato) perde contro la solita schiera b
  let persi = 0;
  for (let seme = 1; seme <= 10; seme++) {
    const s = C.nuovo(scheda({ seme, capoB: true }), { autoA: false });
    let k = 0;
    while (!s.fine && k++ < 400) {
      if (k % 25 === 1) C.ordina(s, { l: 'a', g: ['f', 't', 'c'][seme % 3], t: ['carica', 'tieni', 'arretra'][(seme + k) % 3] });
      C.passo(s, 20);
    }
    if (!s.fine || s.fine.vince === 'b') persi++;
  }
  assert(persi >= 7, 'il casuale perde: ' + persi + '/10');
}

console.log('ok test_ven_p16_lento');
