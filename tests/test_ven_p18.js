// Passo 18: le opzioni della nuova campagna (s.opz) si salvano e si riaprono; i preset di VDAT sono coerenti con le leve del foglio.
const assert = require('assert'), path = require('path');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
assert(VEN && VDAT, 'VEN/VDAT non caricati');
const opz = Object.assign({}, VDAT.OPZ0, VDAT.PRESET.leggenda, { diff: 'leggenda', stemma: { c1: '#b8322a', c2: '#e0b04a', fig: 'Lupo' } });
const s = VEN.nuovo(7, { nome: 'Tester', regno: 'val', opz });
assert.strictEqual(s.opz.diff, 'leggenda');
const r = VEN.apri(VEN.salva(s));
assert(r && r.opz, 'opz perso al salvataggio');
assert.strictEqual(JSON.stringify(r.opz), JSON.stringify(s.opz));
assert.strictEqual(VEN.opz(r).fer, 'ferro');
assert.strictEqual(VEN.opz(r).stemma.fig, 'Lupo');
// nessuna opzione chiesta: la partita resta quella di sempre
assert.strictEqual(VEN.nuovo(7, { nome: 'Tester', regno: 'val' }).opz, undefined);
// ogni valore di preset esiste tra le leve (così il foglio non offre valori fuori elenco)
for (const [n, p] of Object.entries(VDAT.PRESET)) for (const [k, v] of Object.entries(p)) assert(Object.prototype.hasOwnProperty.call(VDAT.DIFF[k], String(v)), n + '.' + k);
console.log('p18 ok');
