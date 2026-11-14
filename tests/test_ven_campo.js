// Compagnia di ventura, battaglia campale (VCAM): ripetibilità, conservazione degli uomini, forte batte debole,
// muro degli assedi, rinforzi, ordini e capitano, comandante accorto contro ordini a caso, velocità.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27a-avv-dadi.js', '28j-ven-dati.js', '28l-ven-campo.js'];
const C = carica.multi(F, 'VCAM');
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const scheda = (seme, a, b, o) => Object.assign({ seme, a, b, cap, faza: 'tu', fazb: 'fer' }, o || {});
const pari = () => [T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), T(5, { val_f2: 12, val_t2: 6, val_c3: 4 })];

// niente funzioni vietate nei motori
for (const f of ['28j-ven-dati.js', '28k-ven-mondo.js', '28l-ven-campo.js']) {
  const src = fs.readFileSync(path.join(__dirname, '../src/js/motori', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/Math\.(random|sin|cos|tan|atan2?|hypot|pow|exp|log)\b|Date\.now|new Date/.test(src), f + ': funzione non ripetibile nel motore');
}
// ripetibilità
{
  const [a, b] = pari(), r1 = C.risolvi(scheda(9, a, b)), r2 = C.risolvi(scheda(9, a, b)), r3 = C.risolvi(scheda(10, a, b));
  assert.deepStrictEqual(r1, r2, 'stesso seme, stessa battaglia'); assert.notDeepStrictEqual(r1, r3, 'semi diversi, battaglie diverse');
  const s = C.nuovo(scheda(9, a, b)); C.passo(s, 40); const t = JSON.parse(JSON.stringify(s)); C.passo(s, 200); C.passo(t, 200);
  assert.strictEqual(JSON.stringify(s.u), JSON.stringify(t.u), 'lo stato si salva e riprende uguale');
}
// forte batte debole, debole perde; nessuno cade più di quanti erano
{
  let forte = 0, debole = 0;
  for (let k = 0; k < 20; k++) {
    const a = T(0, { val_f3: 14, val_t3: 6 }), b = T(5, { pre_f1: 14, pre_t2: 4 });
    const r = C.risolvi(scheda(k + 1, a, b, { fazb: 'pre' })); if (r.vince === 'a') forte++;
    for (const c of r.cad) { const riga = (c.p === 0 ? a : b).find(x => x.t === c.t); assert(riga && c.n <= riga.n, 'caduti oltre gli uomini'); }
    const r2 = C.risolvi(scheda(k + 1, T(0, { val_f1: 6 }), T(5, { fer_f3: 14, fer_t3: 6 }))); if (r2.vince === 'a') debole++;
  }
  assert(forte >= 19, 'i veterani battono i predoni: ' + forte); assert(debole === 0, 'sei reclute non battono venti veterani: ' + debole);
}
// conservazione: vivi + caduti + fuggiti + riserva = uomini di partenza; in campo mai più di MAX (+ capitano)
{
  const a = T(0, { val_f2: 40, val_t2: 25, val_c3: 12 }), b = T(5, { fer_f2: 40, fer_t2: 25, fer_c3: 12 });
  const s = C.nuovo(scheda(4, a, b), { autoA: true }); let rinforzi = 0;
  while (!s.fine) {
    for (const e of C.passo(s, 10)) if (e.t === 'rinforzi') rinforzi++;
    for (const l of ['a', 'b']) {
      const U = s.u.filter(u => u.l === l && !u.cap), n = U.length + C.riserva(s, l);
      assert(n === s.n0[l] || s.u.some(u => u.l === l && u.st === 'fuga') || s.fug[l] > 0 || C.riserva(s, l) === 0, 'uomini spariti');
      assert(C.vivi(s, l).length <= C.C.MAX + 1, 'troppi in campo');
    }
  }
  assert(rinforzi >= 2, 'le riserve entrano a ondate'); assert(s.t < C.C.TMAX, 'la battaglia finisce da sola');
}
// assedio: nessuno attraversa il muro fuori dai varchi; le mura aiutano chi difende
{
  const a = T(0, { val_f2: 24, val_t2: 10 }), b = T(-3, { fer_f2: 10, fer_t2: 8 });
  const s = C.nuovo(scheda(6, a, b, { tipo: 'assedio' }), { autoA: true }); assert(s.muro > 0 && s.varchi.length === 2);
  while (!s.fine) { C.passo(s, 1); for (const u of s.u) if (u.st === 'vivo' && Math.abs(u.y - s.muro) < .45) assert(s.varchi.some(g => u.x > g[0] && u.x < g[1]), 'unità dentro il muro a x=' + u.x.toFixed(1)); }
  let campo = 0, mura = 0;
  for (let k = 0; k < 16; k++) {
    const x = T(0, { val_f2: 16, val_t2: 7 }), y = T(5, { val_f2: 15, val_t2: 7 });
    if (C.risolvi(scheda(k + 3, x, y)).vince === 'a') campo++; if (C.risolvi(scheda(k + 3, x, y, { tipo: 'assedio' })).vince === 'a') mura++;
  }
  assert(mura < campo, 'dietro le mura si resiste meglio: campo ' + campo + ', mura ' + mura);
}
// ordini e capitano
{
  const [a, b] = pari(), s = C.nuovo(scheda(2, a, b));
  assert(C.ordina(s, { g: 'x', t: 'carica' }).err); assert(C.ordina(s, { g: 'f', t: 'balla' }).err);
  assert(!C.ordina(s, { g: 'tutti', t: 'tieni' }).err); assert(!C.ordina(s, { g: 'c', t: 'segui' }).err);
  const y0 = s.ord.a.f.y; C.ordina(s, { g: 'f', t: 'avanza' }); assert(s.ord.a.f.y < y0, 'avanzare porta verso il nemico');
  const c = C.capU(s); assert(c && c.cap); assert(!C.capitano(s, { x: 10, y: 70 }).err); C.passo(s, 120);
  assert(Math.abs(c.x - 10) < 1.5 && Math.abs(c.y - 70) < 1.5, 'il capitano va dove gli si dice');
  assert(!C.capitano(s, { grido: true }).err); assert(C.capitano(s, { grido: true }).err, 'il grido ha una ricarica');
  assert(C.capitano(s, { b: 99999 }).err);
  // tenendo la posizione i fanti non rincorrono un nemico lontano
  const fy = s.u.filter(u => u.l === 'a' && u.c === 'f').map(u => u.y); C.passo(s, 30);
  s.u.filter(u => u.l === 'a' && u.c === 'f' && u.st === 'vivo').forEach((u, k) => assert(u.y > 40, 'un fante che tiene la posizione è partito'));
  while (!s.fine) C.passo(s, 50); assert(C.ordina(s, { g: 'f', t: 'carica' }).err, 'a battaglia finita niente ordini');
  const r = C.riepilogo(s); assert(['a', 'b'].includes(r.vince)); assert(r.durata === s.t);
}
// il comandante accorto vince più di chi dà ordini a caso (stesse truppe contro lo stesso nemico)
{
  let bravo = 0, caso = 0; const N = 24;
  for (let k = 0; k < N; k++) {
    const a = T(0, { val_f2: 12, val_t2: 8, val_c3: 4 }), b = T(5, { val_f2: 12, val_t2: 7, val_c3: 3 });
    if (C.risolvi(scheda(k + 40, a, b)).vince === 'a') bravo++;
    const s = C.nuovo(scheda(k + 40, a, b)), r = carica.rng(k + 7), O = ['arretra', 'tieni', 'arretra', 'segui', 'avanza'], Gs = ['f', 't', 'c'];
    while (!s.fine) { C.passo(s, 25); C.ordina(s, { g: Gs[Math.floor(r() * 3)], t: O[Math.floor(r() * O.length)] }); if (r() < .3) C.capitano(s, { x: r() * 60, y: r() * 100 }); }
    if (s.fine.vince === 'a') caso++;
  }
  assert(bravo >= N * .6, 'il comandante accorto vince spesso: ' + bravo + '/' + N); assert(caso < bravo, 'gli ordini a caso rendono meno: ' + caso + ' contro ' + bravo);
}
// velocità: una battaglia grande si risolve in fretta
{
  const t = Date.now(); C.risolvi(scheda(1, T(0, { val_f2: 60, val_t2: 40, val_c3: 20 }), T(5, { fer_f2: 60, fer_t2: 40, fer_c3: 20 })));
  assert(Date.now() - t < 1500, 'risoluzione automatica lenta: ' + (Date.now() - t) + ' ms');
}
console.log('ven_campo ok');
