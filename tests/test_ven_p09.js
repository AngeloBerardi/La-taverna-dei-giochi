// Passo 09: VEN.anteprima, i dati dell'incontro faccia a faccia.
const assert = require('assert'), carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN } = carica.multi(F, '({ VEN })');
const s = VEN.nuovo(3); s.tregua = 1e9; s.dentro = -1; s.davanti = -1;
const J = x => JSON.stringify(x);
// contro predoni: nessuna indole, f+t+c = uomini sani, scelte con le chiavi di sempre
const pre = s.p.find(p => p.k === 'pre');
s.incontro = { tipo: 'nemico', pid: [pre.id], all: [], da: 'loro' };
let a = VEN.anteprima(s), before = J(s);
assert.strictEqual(a.loro.indole, undefined);
// col consiglio acceso (passo 32) i numeri del nemico dipendono da quanto lo si vede: esatti solo con la vista «esatta»
if (!a.loro.vista || a.loro.vista === 'esatta') assert.strictEqual(a.loro.f + a.loro.t + a.loro.c, VEN.sani(pre));
assert.strictEqual(a.noi.f + a.noi.t + a.noi.c, VEN.sani(VEN.TU(s)));
// le prime quattro sono quelle di sempre; col consiglio acceso seguono le scelte di strategia (passo 32) e la sfida (passo 35)
assert.strictEqual(J(a.scelte.map(x => x.k).slice(0, 4)), J(['attacca', 'auto', 'fuggi', 'paga']));
assert(a.scelte.slice(0, 4).every(x => x.ok && x.tx && x.info) && Array.isArray(a.avvisi) && typeof a.ora === 'number' && a.scena);
assert.strictEqual(J(s), before, 'pura: non cambia lo stato');
// contro un signore: indole = il suo tratto
const sg = s.p.find(p => p.k === 'sig'); s.incontro = { tipo: 'nemico', pid: [sg.id], all: [], da: 'loro' };
a = VEN.anteprima(s);
assert.strictEqual(a.loro.indole, VEN._.D.TRATTI[s.sig[sg.sig].tratto].nome);
if (!a.loro.vista || a.loro.vista === 'esatta') assert.strictEqual(a.loro.f + a.loro.t + a.loro.c, VEN.sani(sg));
assert(!a.scelte.some(x => x.k === 'paga'));
// un gancio aggiunge dati senza toccare il resto
const n0 = VEN.anteprima(s).scelte.length;
VEN.aggancia('anteprima', (st, x) => { x.loro.rango = { n: 3, nome: 'capitano' }; x.scelte.push({ k: 'sfida', tx: 'Sfida', ok: false, perche: 'no' }); });
a = VEN.anteprima(s); assert.strictEqual(a.loro.rango.n, 3); assert.strictEqual(a.scelte.length, n0 + 1);
console.log('p09 ok');
