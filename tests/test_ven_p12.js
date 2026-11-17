// Passo 12: il rango dei comandanti (esperienza sempre attiva, premi e scheda solo con ACCESO.consiglio).
const assert = require('assert'), carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
VDAT.ACCESO.consiglio = true; const s = VEN.nuovo(3); s.tregua = 1e9; s.dentro = -1; s.davanti = -1;
const J = x => JSON.stringify(x);
const pre = s.p.find(p => p.k === 'pre'), sig = s.p.find(p => p.k === 'sig' && !s.sig[p.sig].re), sg = s.sig[sig.sig];
// ranghi di base
assert.strictEqual(VEN.rango(s, pre).r, 0);
assert.strictEqual(VEN.rango(s, sig).r, 2); assert.strictEqual(VEN.rango(s, sig).nome, 'esperto');
// un signore che vince 6 battaglie (a fianco di chi gioca) sale di 1
s.incontro = { tipo: 'nemico', pid: [pre.id], all: [sig.id] };
for (let i = 0; i < 6; i++) VEN.ganci('battaglia', s, { vince: 'a' }, {});
assert.strictEqual(sg.esp, 6); assert.strictEqual(VEN.rango(s, sig).r, 3);
// battere chi gioca vale il doppio
const sg2 = s.sig.find(x => x !== sg && !x.re), p2 = s.p.find(p => p.sig === sg2.id);
s.incontro = { tipo: 'nemico', pid: [p2.id], all: [] }; VEN.ganci('battaglia', s, { vince: 'b' }, {}); assert.strictEqual(sg2.esp, 2);
// la Volpe: 2 + capitolo, al massimo 5
const riv = s.p.find(p => p.k === 'riv'); s.volpe = { tappa: 3 }; assert.strictEqual(VEN.rango(s, riv).r, 5); s.volpe = { tappa: 0 }; assert.strictEqual(VEN.rango(s, riv).r, 2);
// opzione nem
const sn = JSON.parse(J(s)); sn.opz = { nem: 1 }; assert.strictEqual(VEN.rango(sn, sig).r, 4); sn.opz = { nem: -1 }; assert.strictEqual(VEN.rango(sn, pre).r, 0);
// rango del capitano dall'abilità comando
assert.strictEqual(VEN.rangoCap(s), [1, 1, 2, 2, 3, 3, 4][Math.min(6, VEN._.abil(s, 'comando'))]);
// prigionia: -1 ogni 10 giorni dalla presa (non dal calendario)
sg.prig = 'tu'; sg.esp = 6; s.t = 9 * 1440; const g0 = VEN._.giorno(s); VEN.ganci('giorno', s); assert.strictEqual(sg.pgg, g0); assert.strictEqual(sg.esp, 6);
s.t = 10 * 1440; VEN.ganci('giorno', s); assert.strictEqual(sg.esp, 6); s.t = 19 * 1440; VEN.ganci('giorno', s); assert.strictEqual(sg.esp, 5);
sg.prig = null; VEN.ganci('giorno', s); assert.strictEqual(sg.pgg, undefined); sg.esp = 6;
// spento: nessuna esperienza accumulata; premi, scheda, anteprima e cattura come prima
VDAT.ACCESO.consiglio = false; { const t = JSON.parse(J(s)); t.incontro = { tipo: 'nemico', pid: [pre.id], all: [sig.id] }; const e = t.sig[sig.sig].esp; VEN.ganci('battaglia', t, { vince: 'a' }, {}); assert.strictEqual(t.sig[sig.sig].esp, e); }
const premio = (st, pid) => { st.incontro = { tipo: 'nemico', pid: [pid], all: [] }; const o = { fama: 10, xp: 100, oro: 100 }, f0 = st.fama; VEN.ganci('premio', st, { vince: 'a' }, o); return { o, df: st.fama - f0 } };
const sp = JSON.parse(J(s)); sp.incontro = { tipo: 'nemico', pid: [sig.id], all: [] };
const sc0 = { x: 1 }; VEN.ganci('scheda', sp, sc0); assert.strictEqual(J(sc0), J({ x: 1 }));
const a0 = { loro: {}, noi: {}, scelte: [] }; VEN.ganci('anteprima', sp, a0); assert.strictEqual(J(a0), J({ loro: {}, noi: {}, scelte: [] }));
assert.strictEqual(VEN.probCattura(s, { capoKo: true }), .5);
assert.strictEqual(J(premio(JSON.parse(J(s)), sig.id)), J({ o: { fama: 10, xp: 100, oro: 100 }, df: 0 }));
// acceso: ricompensa contro rango 3 = 1,6 volte quella contro rango 0
VDAT.ACCESO.consiglio = true;
const r0 = premio(JSON.parse(J(s)), pre.id), r3 = premio(JSON.parse(J(s)), sig.id);
assert.strictEqual(VEN.rango(s, sig).r, 3);
assert.deepStrictEqual(r0.o, { fama: 10, xp: 100, oro: 100 });
assert.deepStrictEqual(r3.o, { fama: 16, xp: 160, oro: 160 }); assert.strictEqual(r3.df, 6);
assert.strictEqual(VEN.probCattura(s, { capoKo: true }), .8); assert.strictEqual(VEN.probCattura(s, {}), .3);
// scheda e anteprima con i campi nuovi
const si = JSON.parse(J(s)); si.incontro = { tipo: 'nemico', pid: [sig.id], all: [] };
const sc = {}; VEN.ganci('scheda', si, sc);
assert.strictEqual(sc.rango.b, 3); assert.strictEqual(sc.rango.a, VEN.rangoCap(si)); assert.strictEqual(sc.dott.a, 'tu'); assert(sc.indole.b && sc.esplora.b === 3);
const an = VEN.anteprima(si); assert.strictEqual(an.loro.rango.r, 3); assert(an.loro.dott);
// forza dei signori nei conti tra IA: +5% per rango
const mf = VEN.molt(si, 'forza', { p: sig }); assert(Math.abs(mf - 1.15) < 1e-9);
assert.strictEqual(VEN.molt(si, 'forza', { p: pre }), 1);
// battaglia vera: il nemico e' tolto dalla mappa prima del premio, il moltiplicatore deve restare
const vera = (acceso, mk) => { VDAT.ACCESO.consiglio = acceso; const w = JSON.parse(J(s)); const n = mk(w); w.incontro = { tipo: 'nemico', pid: [n.id], all: [] };
  const r = VEN.esito(w, { vince: "a", cad: [] }); assert(!r.err, r.err); return r.out };
const mkCar = w => { const q = JSON.parse(J(pre)); q.id = 9001; q.k = 'car'; q.oro = 100; q.casa = 0; w.p.push(q); return q };
const mkSig = w => w.p.find(p => p.k === 'sig' && p.sig === sig.sig);
for (const [nome, mk, r] of [['carovana', mkCar, 1], ['signore', mkSig, 3]]) {
  const on = vera(true, mk), off = vera(false, mk), m = 1 + .2 * r;
  assert(on.oro > off.oro && on.xp > off.xp && on.fama >= off.fama, nome + ': premio senza moltiplicatore ' + J([on.oro, off.oro]));
  assert(Math.abs(on.xp / off.xp - m) < .05, nome + ' xp ' + on.xp + '/' + off.xp);
}
VDAT.ACCESO.consiglio = false;
console.log('p12 ok');
