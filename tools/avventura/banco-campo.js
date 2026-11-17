// Banco del campo di battaglia: per le taglie 40/70/110 e per eserciti di 60/150/300 uomini per lato
// fa girare fino a 1500 istanti e stampa i µs per istante (orologio `process.hrtime.bigint`, minimo di RIP ripetizioni
// dopo un giro di riscaldamento) sulla finestra a campo pieno (primi 200 istanti) e sul resto, più durata e vivi alla fine.
// Su un motore che ignora `max` (main) tetto, W, H e ONDATA si impostano in VCAM.C: così le due battaglie sono le stesse.
// Uso: node tools/avventura/banco-campo.js [--campo altro-28l.js] [--rip 9]
//   per il «prima»: git show origin/main:src/js/motori/28l-ven-campo.js > campo-main.js, poi --campo campo-main.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const carica = require(path.join(__dirname, '../../tests/carica.js'));
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null };
const ALTRO = arg('--campo'), RIP = +(arg('--rip') || 9);
const ctx = { console, Math, JSON, module: undefined }; vm.createContext(ctx);
for (const f of carica.VEN_FILES) vm.runInContext(fs.readFileSync(ALTRO && f === '28l-ven-campo.js' ? path.resolve(ALTRO) : path.join(__dirname, '../../src/js/motori', f), 'utf8'), ctx);
const C = vm.runInContext('VCAM', ctx), D = vm.runInContext('VDAT', ctx);
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const righe = (p, n, pre) => [{ p, t: pre + '_f2', n: Math.round(n * .6) }, { p, t: pre + '_t2', n: Math.round(n * .25) }, { p, t: pre + '_c3', n: n - Math.round(n * .6) - Math.round(n * .25) }];
const TAGLIE = D.TAGLIA || { piccola: { max: 40, W: 60, H: 100 }, media: { max: 70, W: 80, H: 120 }, grande: { max: 110, W: 100, H: 140 } };
const us = f => { const t0 = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - t0) / 1000 };
function corsa(T, n) {
  if (!C.taglia) Object.assign(C.C, { MAX: T.max, W: T.W, H: T.H, ONDATA: Math.max(10, Math.round(T.max / 4)) });
  const s = C.nuovo({ seme: 7, a: righe(0, n, 'val'), b: righe(5, n, 'fer'), cap, faza: 'tu', fazb: 'fer', max: T.max, W: T.W, H: T.H }, { autoA: true });
  let i = 0; const pieno = us(() => { for (; i < 200 && !s.fine; i++) C.passo(s, 1) }) / Math.max(1, i);
  const j0 = i, dopo = us(() => { for (; i < 1500 && !s.fine; i++) C.passo(s, 1) }) / Math.max(1, i - j0);
  return { pieno, dopo, passi: i, vivi: C.vivi(s, 'a').length + C.vivi(s, 'b').length };
}
for (const k of Object.keys(TAGLIE)) corsa(TAGLIE[k], 300); // riscaldamento
console.log((ALTRO ? 'motore ' + path.basename(ALTRO) : 'motore del ramo') + ', minimo di ' + RIP + ' ripetizioni');
console.log('taglia | per lato | campo pieno (istanti 0-200) | dopo (200-1500) | durata | vivi alla fine');
for (const k of Object.keys(TAGLIE)) for (const n of [60, 150, 300]) {
  let p = 1e9, d = 1e9, x = null;
  for (let r = 0; r < RIP; r++) { x = corsa(TAGLIE[k], n); p = Math.min(p, x.pieno); d = Math.min(d, x.dopo) }
  console.log([k + ' (max ' + TAGLIE[k].max + ')', n, p.toFixed(0) + ' us/passo', d.toFixed(0) + ' us/passo', x.passi + ' istanti', x.vivi].join(' | '));
}
