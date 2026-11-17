// Banco del campo di battaglia: per le taglie 40/70/110 e per eserciti di 60/150/300 uomini per lato
// fa girare 1500 istanti e stampa i µs per istante e la durata. Uso: node tools/avventura/banco-campo.js
const path = require('path');
const carica = require(path.join(__dirname, '../../tests/carica.js'));
const C = carica.multi(carica.VEN_FILES, 'VCAM'), D = carica.multi(carica.VEN_FILES, 'VDAT');
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const righe = (p, n, pre) => [{ p, t: pre + '_f2', n: Math.round(n * .6) }, { p, t: pre + '_t2', n: Math.round(n * .25) }, { p, t: pre + '_c3', n: n - Math.round(n * .6) - Math.round(n * .25) }];
const TAGLIE = D.TAGLIA || { piccola: { max: 40, W: 60, H: 100 }, media: { max: 70, W: 80, H: 120 }, grande: { max: 110, W: 100, H: 140 } };
const out = [];
for (const k of Object.keys(TAGLIE)) for (const n of [60, 150, 300]) {
  const T = TAGLIE[k], s = C.nuovo({ seme: 7, a: righe(0, n, 'val'), b: righe(5, n, 'fer'), cap, faza: 'tu', fazb: 'fer', max: T.max, W: T.W, H: T.H }, { autoA: true });
  const t0 = process.hrtime.bigint(); let i = 0;
  for (; i < 1500 && !s.fine; i++) C.passo(s, 1);
  const us = Number(process.hrtime.bigint() - t0) / 1000 / Math.max(1, i);
  const inCampo = C.vivi(s, 'a').length + C.vivi(s, 'b').length;
  out.push([k, 'max ' + T.max, n + ' per lato', us.toFixed(0) + ' us/passo', 'passi ' + i, 'vivi in campo alla fine ' + inCampo].join(' | '));
}
console.log(out.join('\n'));
