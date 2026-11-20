#!/usr/bin/env node
// Torneo dei comandanti (passo 34): i ranghi 0-5 giocano tra loro a truppe pari su 6 terreni, a metà dei semi dal lato a e a metà dal b.
// Stampa la tabella (percentuale di vittorie della riga contro la colonna) e controlla: diagonale 40-60%, ogni rango batte il precedente 58-75%.
//   node tools/avventura/torneo-comandanti.js [--semi 12]   (semi per terreno e per lato)
const path = require('path'), carica = require(path.join(__dirname, '../../tests/carica.js'));
const X = carica.multi(carica.VEN_FILES, '({ VCAM, VDAT })'), C = X.VCAM, D = X.VDAT;
const i = process.argv.indexOf('--semi'), SEMI = i > 0 ? +process.argv[i + 1] : 12;
const T = (p, pre, k) => [{ p, t: pre + '_f2', n: 24 * k }, { p, t: pre + '_t2', n: 10 * k }, { p, t: pre + '_c3', n: 8 * k }];
const Z = (k, x, y) => ({ k, x, y, rx: 11, ry: 8, h: 1 });
const TERRENI = [[], [Z('altura', 30, 24)], [Z('bosco', 30, 24)], [Z('case', 30, 24)], [Z('acqua', 30, 24)], [Z('altura', 24, 20), Z('bosco', 38, 30)]];
function sfida(x, y) { // vittorie del rango x contro il rango y
  let v = 0, n = 0;
  TERRENI.forEach((zone, t) => { for (let k = 0; k < SEMI * 2; k++) {
    const seme = 100 * (t + 1) + k + 1, xa = k % 2 === 0, rango = xa ? { a: x, b: y } : { a: y, b: x };
    const r = C.risolvi({ seme, a: T(0, 'val', 1), b: T(5, 'fer', 1), faza: 'tu', fazb: 'fer', rango, zone: JSON.parse(JSON.stringify(zone)) });
    n++; if ((r.vince === 'a') === xa) v++;
  } });
  return v / n;
}
const M = []; for (let a = 0; a <= 5; a++) { M.push([]); for (let b = 0; b <= 5; b++) M[a].push(a === b ? sfida(a, a) : b < a ? sfida(a, b) : null) }
for (let a = 0; a <= 5; a++) for (let b = a + 1; b <= 5; b++) M[a][b] = 1 - M[b][a];
const pc = x => Math.round(x * 100);
console.log('| rango | ' + [0, 1, 2, 3, 4, 5].join(' | ') + ' |\n|---|' + '---|'.repeat(6));
M.forEach((r, a) => console.log('| ' + a + ' | ' + r.map(pc).join(' | ') + ' |'));
let male = 0;
for (let a = 0; a <= 5; a++) if (M[a][a] < .4 || M[a][a] > .6) { male++; console.log('diagonale fuori 40-60%: rango ' + a + ' = ' + pc(M[a][a])) }
for (let a = 1; a <= 5; a++) if (M[a][a - 1] < .58 || M[a][a - 1] > .75) { male++; console.log('scala fuori 58-75%: ' + a + ' contro ' + (a - 1) + ' = ' + pc(M[a][a - 1])) }
console.log(male ? 'FUORI DAI LIMITI: ' + male : 'torneo nei limiti (interruttore consiglio ' + (D.ACCESO.consiglio ? 'acceso' : 'spento') + ')');
process.exit(male ? 1 : 0);
