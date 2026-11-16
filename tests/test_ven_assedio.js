// Compagnia di ventura, assedio a fasi (V5b): scale (lente, sotto tiro), breccia (dopo i giorni di preparativi),
// porta (con l'ariete). Campo (VCAM) e mondo (VEN): stesse fasi per la battaglia giocata e per la risoluzione automatica.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27a-avv-dadi.js', '28j-ven-dati.js', '28l-ven-campo.js'];
const C = carica.multi(F, 'VCAM');
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const scheda = (seme, as, a, b) => ({ seme, a: a || T(0, { val_f2: 24, val_t2: 10 }), b: b || T(-3, { fer_f2: 10, fer_t2: 8 }), cap, faza: 'tu', fazb: 'fer', tipo: 'assedio', assedio: as });
const SCALE = { breccia: false, ariete: false }, ARIETE = { breccia: false, ariete: true }, TUTTO = { breccia: true, ariete: true };
const fine = s => { while (!s.fine) C.passo(s, 50); return s; };

// ---- 1. stato iniziale delle fasi ----
{
  const s = C.nuovo(scheda(1, SCALE)); assert.strictEqual(s.varchi.length, 0, 'senza breccia le mura sono intere');
  assert.strictEqual(JSON.stringify(s.scale), '[9,21,39,51]'); assert(s.porta && s.porta.pf === C.C.AS.PORTA && !s.porta.ariete);
  const t = C.nuovo(scheda(1, TUTTO)); assert.strictEqual(JSON.stringify(t.varchi), '[[41,46]]'); assert(t.porta.ariete);
  const v = C.nuovo(Object.assign(scheda(1), { assedio: undefined })); assert.strictEqual(v.varchi.length, 1, 'scheda vecchia: breccia aperta');
  assert.strictEqual(C.quota(s, 20, s.muro - 2), C.C.AS.MURO_Q, 'il camminamento sta in alto'); assert.strictEqual(C.quota(s, 20, s.muro + 2), 0);
}
// ---- 2. regole del muro: nessuno nella fascia fuori dai varchi se non sale; niente cavalieri sulle scale; una scala, uno alla volta ----
for (const as of [SCALE, ARIETE, TUTTO]) for (const seme of [2, 3]) {
  const a = T(0, { val_f2: 20, val_t2: 8, val_c3: 4 }), s = C.nuovo(scheda(seme, as, a), { autoA: true });
  let salite = 0;
  while (!s.fine) {
    C.passo(s, 1); salite += s.ev.filter(e => e.t === 'scala').length;
    const su = [0, 0, 0, 0];
    for (const u of s.u) {
      if (u.st !== 'vivo') continue;
      if (u.sal > s.t) { assert(u.c !== 'c' && !(u.cav && !u.cap), 'un cavaliere non sale'); su[u.scI]++; continue; }
      if (Math.abs(u.y - s.muro) < .45) assert(s.varchi.some(g => u.x > g[0] && u.x < g[1]), 'unità dentro il muro a x=' + u.x.toFixed(1));
    }
    assert(su.every(n => n <= 1), 'su una scala al più uno alla volta');
  }
  if (as === SCALE) assert(salite > 0, 'senza varchi si sale con le scale');
}
// ---- 3. le fasi pesano: scale < scale e ariete <= tutto; dietro le mura meglio che in campo aperto ----
{
  const v = { scale: 0, ariete: 0, tutto: 0 };
  for (let i = 1; i <= 30; i++) {
    if (fine(C.nuovo(scheda(i, SCALE), { autoA: true })).fine.vince === 'a') v.scale++;
    if (fine(C.nuovo(scheda(i, ARIETE), { autoA: true })).fine.vince === 'a') v.ariete++;
    if (fine(C.nuovo(scheda(i, TUTTO), { autoA: true })).fine.vince === 'a') v.tutto++;
  }
  assert(v.scale >= 3 && v.scale <= 18, 'con le sole scale: ' + v.scale + ' su 30');
  assert(v.scale < v.ariete && v.ariete <= v.tutto, 'le fasi aiutano chi assale: ' + JSON.stringify(v));
}
// ---- 4. il portone: senza ariete non cede; con l'ariete e nessun difensore che lo impedisca cade in 100-400 istanti ----
{
  const s = C.nuovo(scheda(4, SCALE, T(0, { val_f2: 12 }), T(-3, { fer_f2: 1 })), { autoA: true });
  for (let k = 0; k < 600 && !s.fine; k++) { C.passo(s, 1); assert.strictEqual(s.porta.pf, C.C.AS.PORTA, 'senza ariete la porta non cala'); }
  const t = C.nuovo(scheda(4, ARIETE, T(0, { val_f2: 12 }), T(-3, { fer_f2: 1 })), { autoA: true });
  let caduta = 0; while (!caduta && t.t < 1000 && !t.fine) { C.passo(t, 1); if (t.ev.some(e => e.t === 'porta')) caduta = t.t; }
  assert(caduta >= 100 && caduta <= 400, 'la porta cade in ' + caduta + ' istanti'); assert(t.varchi.some(g => g[0] === 28 && g[1] === 32) && t.porta.pf === 0);
}
// ---- 5. ripetibilità e stato salvabile a metà salita ----
{
  const s = C.nuovo(scheda(5, SCALE), { autoA: true }); C.passo(s, 260); const j = JSON.parse(JSON.stringify(s));
  C.passo(s, 300); C.passo(j, 300); assert.strictEqual(JSON.stringify(s.u), JSON.stringify(j.u), 'lo stato si salva e riprende uguale');
}
console.log('ven_assedio ok');
