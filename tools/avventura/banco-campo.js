// Banco del campo di battaglia: per le taglie 40/70/110 e per eserciti di 60/150/300 uomini per lato
// fa girare 1500 istanti e stampa i µs di CPU per istante (minimo di 5 ripetizioni, dopo un giro di riscaldamento)
// sull'intera durata e sulla finestra a campo pieno (primi 200 istanti), più la durata della battaglia.
// Su un motore che ignora `max` (main) il tetto, W e H si impostano da VCAM.C: così il confronto prima/dopo regge.
// Uso: node tools/avventura/banco-campo.js
const path = require('path');
const carica = require(path.join(__dirname, '../../tests/carica.js'));
const C = carica.multi(carica.VEN_FILES, 'VCAM'), D = carica.multi(carica.VEN_FILES, 'VDAT');
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const righe = (p, n, pre) => [{ p, t: pre + '_f2', n: Math.round(n * .6) }, { p, t: pre + '_t2', n: Math.round(n * .25) }, { p, t: pre + '_c3', n: n - Math.round(n * .6) - Math.round(n * .25) }];
const TAGLIE = D.TAGLIA || { piccola: { max: 40, W: 60, H: 100 }, media: { max: 70, W: 80, H: 120 }, grande: { max: 110, W: 100, H: 140 } };
const cpu = f => { const t0 = process.cpuUsage(); f(); const u = process.cpuUsage(t0); return u.user + u.system };
function corsa(T, n) {
  if (!C.taglia) Object.assign(C.C, { MAX: T.max, W: T.W, H: T.H });
  const s = C.nuovo({ seme: 7, a: righe(0, n, 'val'), b: righe(5, n, 'fer'), cap, faza: 'tu', fazb: 'fer', max: T.max, W: T.W, H: T.H }, { autoA: true });
  let i = 0; const pieno = cpu(() => { for (; i < 200 && !s.fine; i++) C.passo(s, 1) }) / Math.max(1, i);
  const j0 = i, tutto = cpu(() => { for (; i < 1500 && !s.fine; i++) C.passo(s, 1) }) / Math.max(1, i - j0);
  return { pieno, tutto, passi: i, vivi: C.vivi(s, 'a').length + C.vivi(s, 'b').length };
}
corsa(TAGLIE.piccola || Object.values(TAGLIE)[0], 60); // riscaldamento
const out = [];
for (const k of Object.keys(TAGLIE)) for (const n of [60, 150, 300]) {
  let best = null;
  for (let r = 0; r < 5; r++) { const x = corsa(TAGLIE[k], n); if (!best || x.pieno < best.pieno) best = x }
  out.push([k, 'max ' + TAGLIE[k].max, n + ' per lato', 'primi 200 istanti ' + best.pieno.toFixed(0) + ' us/passo', 'dopo ' + best.tutto.toFixed(0) + ' us/passo', 'durata ' + best.passi + ' istanti', 'vivi alla fine ' + best.vivi].join(' | '));
}
console.log(out.join('\n'));
