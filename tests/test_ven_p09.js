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
assert.strictEqual(a.loro.f + a.loro.t + a.loro.c, VEN.sani(pre));
assert.strictEqual(a.noi.f + a.noi.t + a.noi.c, VEN.sani(VEN.TU(s)));
assert.strictEqual(J(a.scelte.map(x => x.k)), J(['attacca', 'auto', 'fuggi', 'paga']));
assert(a.scelte.every(x => x.ok && x.tx && x.info) && Array.isArray(a.avvisi) && typeof a.ora === 'number' && a.scena);
assert.strictEqual(J(s), before, 'pura: non cambia lo stato');
// contro un signore: indole = il suo tratto
const sg = s.p.find(p => p.k === 'sig'); s.incontro = { tipo: 'nemico', pid: [sg.id], all: [], da: 'loro' };
a = VEN.anteprima(s);
assert.strictEqual(a.loro.indole, VEN._.D.TRATTI[s.sig[sg.sig].tratto].nome);
assert.strictEqual(a.loro.f + a.loro.t + a.loro.c, VEN.sani(sg));
assert(!a.scelte.some(x => x.k === 'paga'));
// un gancio aggiunge dati senza toccare il resto
VEN.aggancia('anteprima', (st, x) => { x.loro.rango = { n: 3, nome: 'capitano' }; x.scelte.push({ k: 'sfida', tx: 'Sfida', ok: false, perche: 'no' }); });
a = VEN.anteprima(s); assert.strictEqual(a.loro.rango.n, 3); assert.strictEqual(a.scelte.length, 4);
console.log('p09 ok');
