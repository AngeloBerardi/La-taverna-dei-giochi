// Taratura della Compagnia di ventura: fa giocare il bot per N giorni su più semi e stampa una tabella.
// Uso: node tools/avventura/ventura.js [--giorni 60] [--semi 3,11,29] [--caso] [--consiglio]  (--consiglio: interruttore acceso, stampa i ranghi dei signori)
const path = require('path'), carica = require(path.join(__dirname, '../../tests/carica.js'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const F = carica.VEN_SENZA_VOCI;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT'), gioca = require(path.join(__dirname, '../../tests/bot_ven.js'))(V, D);
if (process.argv.includes('--consiglio')) D.ACCESO.consiglio = true;
const ranghi = [0, 0, 0, 0, 0, 0];
const giorni = +arg('giorni', 60), semi = String(arg('semi', '3,11,29')).split(',').map(Number), bravo = !process.argv.includes('--caso');
console.log('seme  uomini forza  monete fama liv vinte/perse luoghi(val/sel/fer/mar/alt/tu)');
for (const seme of semi) {
  const s = gioca(V.nuovo(seme), giorni, bravo, carica.rng(seme + 1)), tu = V.TU(s);
  console.log(String(seme).padEnd(5), String(V.uomini(tu)).padEnd(6), V.forza(tu).toFixed(0).padEnd(6), String(tu.oro).padEnd(6), String(s.fama).padEnd(4), String(s.cap.liv).padEnd(3),
    (s.stat.vinte + '/' + s.stat.perse).padEnd(11), ['val', 'sel', 'fer', 'mar', 'alt', 'tu'].map(f => s.l.filter(l => l.faz === f).length).join('/'));
  if (D.ACCESO.consiglio) for (const p of s.p) if (p.k === 'sig') ranghi[V.rango(s, p).r]++;
}
if (D.ACCESO.consiglio) console.log('ranghi dei signori (0..5):', ranghi.join(' '));
