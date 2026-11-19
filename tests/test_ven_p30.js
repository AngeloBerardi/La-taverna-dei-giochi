// Passo 30, prove rapide: la memoria delle tue tattiche (riepilogo.tat, sg.mem.tat, s.volpe.tat, sc.memo), le abitudini, la cronaca delle contromosse,
// i salvataggi vecchi, l'interruttore spento. Le prove numeriche (contromosse, scala, finta rotta) stanno in test_ven_p30_lento.js.
const assert = require('assert'), fs = require('fs'), path = require('path'), carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN, VDAT, VCAM, VCONS, VVOC } = carica.multi(F, '({ VEN, VDAT, VCAM, VCONS, VVOC })');
const J = x => JSON.stringify(x), eq = (a, b, m) => assert.strictEqual(J(a), J(b), m), T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const TAT = (o) => Object.assign({ cavPrima: 0, alt: 0, fianco: 0, capAvanti: 0, serrata: 0, ondataPresto: 0 }, o);

// ---------- le abitudini: almeno metà delle battaglie con lui, e almeno 2 volte ----------
assert.strictEqual(J(VCONS.abitudini(null)), '{}');
assert.strictEqual(J(VCONS.abitudini({ n: 1, cavPrima: 1 })), '{}', 'una volta sola non basta');
assert.strictEqual(J(VCONS.abitudini({ n: 5, cavPrima: 2 })), '{}', 'meno di metà delle battaglie');
eq(VCONS.abitudini({ n: 4, cavPrima: 2, alt: 3, fianco: 2, fsx: 0, fdx: 2, serrata: 1 }), { cavPrima: 1, alt: 1, fianco: 1, fl: 'fdx' });
eq(VCONS.abitudini({ n: 2, capAvanti: 2, ondataPresto: 2 }), { capAvanti: 1, ondataPresto: 1 });

// ---------- il riepilogo: tat solo con il consiglio (rango nella scheda) ----------
{
  const base = { seme: 4, a: T(0, { val_f2: 12, val_t2: 6, val_c3: 6 }), b: T(5, { fer_f2: 12, fer_t2: 6, fer_c3: 4 }), faza: 'tu', fazb: 'fer' };
  const r0 = VCAM.risolvi(base); assert.strictEqual(r0.tat, undefined); assert.strictEqual(r0.contro, undefined);
  const r1 = VCAM.risolvi(Object.assign({ rango: { a: 2, b: 3 } }, base));
  eq(Object.keys(r1.tat).slice(0, 6), VCONS.ABIT); for (const k of VCONS.ABIT) assert(r1.tat[k] === 0 || r1.tat[k] === 1, k);
  // la cavalleria che carica da sola colpisce per prima; un'ondata dal fianco sinistro all'istante 100 è presto e di fianco
  const s = VCAM.nuovo(Object.assign({}, base, { rango: { a: 0, b: 3 }, reparti: true, ondate: true, zone: [] }));
  assert(!VCAM.preparaOndata(s, { l: 'a', id: 'u', tr: [{ t: 'val_f2', n: 4 }], ing: 'fsx', quando: { k: 'tempo', v: 100 }, ord: 'carica' }).err);
  VCAM.pronto(s, 'a'); VCAM.ordina(s, { l: 'a', g: 'c', t: 'carica' });
  while (!s.fine && s.t < 3000) VCAM.passo(s, 10);
  const t = VCAM.riepilogo(s).tat;
  assert.strictEqual(t.cavPrima, 1); assert.strictEqual(t.ondataPresto, 1); assert.strictEqual(t.fianco, 1); assert.strictEqual(t.fsx, 1); assert.strictEqual(t.fdx, undefined);
  assert.strictEqual(t.serrata, 1, 'i fanti non hanno mai cambiato formazione');
  // lo stato resta clonabile e ripetibile con la memoria dentro
  const a = VCAM.nuovo(Object.assign({}, base, { rango: { a: 3, b: 5 }, memo: { n: 2, cavPrima: 2 } }), { autoA: true }); VCAM.passo(a, 150);
  const b = JSON.parse(J(a)); while (!a.fine) VCAM.passo(a, 50); while (!b.fine) VCAM.passo(b, 50);
  assert.strictEqual(J(VCAM.riepilogo(a)), J(VCAM.riepilogo(b)));
  // le abitudini le legge solo il rango 5 del lato b
  eq(VCAM.nuovo(Object.assign({}, base, { rango: { a: 1, b: 5 }, memo: { n: 2, alt: 2 } })).ab, { alt: 1 });
  assert.strictEqual(VCAM.nuovo(Object.assign({}, base, { rango: { a: 1, b: 4 }, memo: { n: 2, alt: 2 } })).ab, undefined);
  assert.strictEqual(VCAM.nuovo(Object.assign({}, base, { rango: { a: 1, b: 5 }, memo: { n: 3, alt: 1 } })).ab, undefined);
}

// ---------- il mondo: la memoria cresce solo per chi ha combattuto ----------
VDAT.ACCESO.consiglio = true;
const s0 = VEN.nuovo(3); s0.tregua = 1e9; s0.dentro = -1; s0.davanti = -1;
const sigP = s0.p.filter(p => p.k === 'sig' && !s0.sig[p.sig].re), p1 = sigP[0], p2 = sigP[1];
{
  const s = JSON.parse(J(s0)), sg1 = s.sig[p1.sig], sg2 = s.sig[p2.sig];
  // hai perso: chi ti stava davanti ricorda
  s.incontro = { tipo: 'nemico', pid: [p1.id], all: [] };
  VEN.ganci('battaglia', s, { vince: 'b', tat: TAT({ cavPrima: 1, fianco: 1, fsx: 1 }) }, {});
  eq(sg1.mem.tat, { n: 1, cavPrima: 1, fianco: 1, fsx: 1 }); assert.strictEqual(sg2.mem.tat, undefined, 'l\'altro signore non c\'era');
  // hai vinto (battaglia vera): VEN.sconfitta segna chi hai battuto, la memoria cresce per lui
  s.incontro = { tipo: 'nemico', pid: [p1.id], all: [] };
  const r = VEN.esito(s, { vince: 'a', cad: [], tat: TAT({ cavPrima: 1, alt: 1 }) }); assert(!r.err, r.err);
  eq(sg1.mem.tat, { n: 2, cavPrima: 2, fianco: 1, fsx: 1, alt: 1 }); assert.strictEqual(sg2.mem.tat, undefined);
  // la scheda porta la memoria del comandante più alto di rango tra i nemici
  s.incontro = { tipo: 'nemico', pid: [p1.id], all: [] }; const sc = {}; VEN.ganci('scheda', s, sc);
  eq(sc.memo, sg1.mem.tat); assert.notStrictEqual(sc.memo, sg1.mem.tat, 'una copia');
  s.incontro = { tipo: 'nemico', pid: [p2.id], all: [] }; const sc2 = {}; VEN.ganci('scheda', s, sc2); assert.strictEqual(sc2.memo, undefined);
  // un alleato al tuo fianco non impara niente
  s.incontro = { tipo: 'nemico', pid: [p1.id], all: [p2.id] }; VEN.ganci('battaglia', s, { vince: 'b', tat: TAT({ alt: 1 }) }, {}); assert.strictEqual(sg2.mem.tat, undefined);
  // la Volpe ricorda in s.volpe.tat (solo se le voci l'hanno già presentata)
  const riv = s.p.find(p => p.k === 'riv'); s.incontro = { tipo: 'nemico', pid: [riv.id], all: [] };
  const sv = JSON.parse(J(s)); delete sv.volpe; VEN.ganci('battaglia', sv, { vince: 'b', tat: TAT({ capAvanti: 1 }) }, {}); assert.strictEqual(sv.volpe, undefined);
  s.volpe = { tappa: 3 }; VEN.ganci('battaglia', s, { vince: 'b', tat: TAT({ capAvanti: 1 }) }, {}); eq(s.volpe.tat, { n: 1, capAvanti: 1 });
  const sc3 = {}; VEN.ganci('scheda', s, sc3); eq(sc3.memo, { n: 1, capAvanti: 1 }); assert.strictEqual(sc3.rango.b, 5);
  // le contromosse usate finiscono nella cronaca, a nome di chi le ha usate
  s.incontro = { tipo: 'nemico', pid: [p1.id], all: [] }; const n0 = s.log.length;
  VEN.ganci('battaglia', s, { vince: 'b', tat: TAT({}), contro: ['cavPrima', 'capAvanti'] }, {});
  const righe = s.log.slice(n0).map(x => x.tx), nome = sg1.nome[0].toUpperCase() + sg1.nome.slice(1);
  eq(righe, [VVOC.CONTRO.cavPrima.replace('{chi}', nome), VVOC.CONTRO.capAvanti.replace('{chi}', nome)]);
  for (const k of Object.keys(VVOC.CONTRO)) { assert(VCONS.ABIT.includes(k), k); assert(VVOC.CONTRO[k].includes('{chi}') && VVOC.CONTRO[k].length <= 120, k) }
}
// interruttore spento: niente memoria, niente scheda, niente cronaca
VDAT.ACCESO.consiglio = false;
{
  const s = JSON.parse(J(s0)); s.incontro = { tipo: 'nemico', pid: [p1.id], all: [] }; const prima = J(s);
  VEN.ganci('battaglia', s, { vince: 'b', tat: TAT({ cavPrima: 1 }), contro: ['cavPrima'] }, {}); assert.strictEqual(J(s), prima);
  const sc = {}; VEN.ganci('scheda', s, sc); assert.strictEqual(J(sc), '{}');
}
// i salvataggi senza tat si aprono e la memoria nasce alla prima battaglia
VDAT.ACCESO.consiglio = true;
{
  const dir = path.join(__dirname, 'fixture/ven');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const s = VEN.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(s, f);
    assert(s.sig.every(sg => !sg.mem || !sg.mem.tat), f + ': nessuna memoria nei salvataggi vecchi');
    const p = s.p.find(q => q.k === 'sig'); s.incontro = { tipo: 'nemico', pid: [p.id], all: [] };
    const sc = {}; VEN.ganci('scheda', s, sc); assert.strictEqual(sc.memo, undefined, f);
    VEN.ganci('battaglia', s, { vince: 'b', tat: TAT({ alt: 1 }) }, {}); eq(s.sig[p.sig].mem.tat, { n: 1, alt: 1 }, f);
    assert(VEN.apri(VEN.salva(s)), f + ': si risalva');
  }
}
VDAT.ACCESO.consiglio = false;
console.log('Prove rapide del passo 30 verdi.');
