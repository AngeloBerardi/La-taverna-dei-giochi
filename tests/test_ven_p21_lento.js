// Passo 21, prove lunghe: la scala dei ranghi (un rango più alto vince tra il 58 e il 75% a truppe pari), le grandi battaglie, il costo.
const assert = require('assert');
const carica = require('./carica.js');
const X = carica.multi(carica.VEN_FILES, '({ VCAM, VCONS, VDAT })'), C = X.VCAM, K = X.VCONS;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const mix = (pre, p) => T(p, { [pre + '_f2']: 24, [pre + '_t2']: 10, [pre + '_c3']: 8 });

// scala: truppe pari, senza capitani, 40 semi (a metà il rango alto sta dal lato a, a metà dal b)
const scala = (alto, basso, extra) => {
  let v = 0;
  for (let seme = 1; seme <= 40; seme++) {
    const hiA = seme % 2 === 0, s = Object.assign({ seme, a: mix('val', 0), b: mix('val', 5), faza: 'tu', fazb: 'fer', rango: hiA ? { a: alto, b: basso } : { a: basso, b: alto } }, extra || {});
    const r = C.risolvi(s); if ((r.vince === 'a') === hiA) v++;
  }
  return v / 40;
};
const dentro = (p, nome) => { assert(p >= 0.58 && p <= 0.75, nome + ': ' + Math.round(p * 100) + '%'); console.log(nome, Math.round(p * 100) + '%') };
dentro(scala(1, 0), 'rango 1 contro 0');
dentro(scala(2, 1), 'rango 2 contro 1');
assert(scala(2, 0) > 0.7, 'il rango 2 batte il rango 0 con ampio margine');

// grandi battaglie (reparti, ondate, fino a 110 per lato): finiscono, nessun uomo si perde, il rango vince ancora più spesso che perdere
{
  let v = 0, ok = 0;
  for (let seme = 1; seme <= 8; seme++) {
    const hiA = seme % 2 === 0, rango = hiA ? { a: 2, b: 0 } : { a: 0, b: 2 };
    const s = C.nuovo({ seme, a: T(0, { val_f2: 70, val_t2: 30, val_c3: 20 }), b: T(5, { fer_f2: 70, fer_t2: 30, fer_c3: 20 }), faza: 'tu', fazb: 'fer', reparti: true, ondate: true, max: 80, W: 100, H: 140, rango }, { autoA: true });
    const n0 = s.u.length + s.ris.a.concat(s.ris.b).reduce((a, x) => a + x.n, 0) + s.ond.a.concat(s.ond.b).reduce((a, w) => a + w.tr.reduce((c, x) => c + x.n, 0), 0);
    assert.strictEqual(n0, 240);
    while (!s.fine) C.passo(s, 50); assert(s.t < 7000, 'la battaglia finisce'); ok++;
    if ((s.fine.vince === 'a') === hiA) v++;
  }
  assert.strictEqual(ok, 8); assert(v >= 5, 'il rango 2 vince almeno 5 su 8: ' + v);
}

// costo: il consiglio pesa meno del 15% del costo del passo (battaglia a campo pieno: 110 per lato, 300 uomini)
{
  const riga = (p, n, pre) => [{ p, t: pre + '_f2', n: Math.round(n * .6) }, { p, t: pre + '_t2', n: Math.round(n * .25) }, { p, t: pre + '_c3', n: n - Math.round(n * .6) - Math.round(n * .25) }];
  let migliore = 1e9, conta = 0;
  for (let rip = 0; rip < 5; rip++) {
    const orig = K.decidi; let tc = 0; K.decidi = (s, l) => { const t0 = process.hrtime.bigint(); orig(s, l); tc += Number(process.hrtime.bigint() - t0) };
    const s = C.nuovo({ seme: 7, a: riga(0, 300, 'val'), b: riga(5, 300, 'fer'), faza: 'tu', fazb: 'fer', max: 110, W: 100, H: 140, reparti: true, rango: { a: 2, b: 2 } }, { autoA: true });
    const t0 = process.hrtime.bigint(); for (let i = 0; i < 600 && !s.fine; i++) C.passo(s, 1); const tot = Number(process.hrtime.bigint() - t0);
    K.decidi = orig; migliore = Math.min(migliore, tc / tot); conta = s.t;
  }
  console.log('costo del consiglio: ' + (migliore * 100).toFixed(1) + '% del passo su ' + conta + ' istanti');
  assert(migliore < 0.15, 'il consiglio costa troppo: ' + migliore);
}
console.log('test_ven_p21_lento ok');
