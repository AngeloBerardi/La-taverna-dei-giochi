// Passo 38, parte rapida: interruttore acceso, partite nuove nel mondo nuovo e vecchie come prima, stemma con 12 figure diverse, due telefoni nello stesso mondo.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })'), gioca = require('./bot_ven.js')(V, D);
const ACCESO = D.ACCESO.mondo2;   // il passo 38 lo lascia spento finché le prove d'insieme (test_ven_p38_lento.js) non reggono

// partite nuove: mondo nuovo, regno non scelto, stagioni ed economia presenti
const n = V.nuovo(5, { opz: { geo: 2 } }); assert.strictEqual(n.geo, 2); assert(n.anno != null, 'stagioni'); assert(V.regni(n).length >= 4, 'molti regni: ' + V.regni(n).length);

// due telefoni: stesso seme, stesso mondo e stessa partenza (la sorte non usa dadi del telefono)
for (const seme of [1, 2, 3]) { const a = V.nuovo(seme, { nome: 'A', opz: { geo: 2 } }), b = V.nuovo(seme, { nome: 'A', opz: { geo: 2 } }); assert.strictEqual(V.salva(a), V.salva(b), 'seme ' + seme + ': due telefoni, stesso mondo'); }

// salvataggi vecchi: si aprono, restano nel loro mondo (niente geo), giocano 10 giorni e si risalvano
const dir = path.join(__dirname, 'fixture/ven');
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
  const s = V.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(s, f);
  const regni = JSON.stringify(V.regni(s)), M = V.mappaDi(s);
  assert.strictEqual(s.geo, undefined, f + ': mondo vecchio'); gioca(s, 10, true, carica.rng(3));
  assert.strictEqual(s.geo, undefined, f + ': resta vecchio'); assert.strictEqual(JSON.stringify(V.regni(s)), regni, f + ': regni uguali'); assert.strictEqual(V.mappaDi(s), M, f + ': stessa mappa');
  assert(V.apri(V.salva(s)), f + ': si risalva');
}

// stemma: 12 figure, 12 disegni diversi; senza figura resta lo scudo
const ctx = { console, Math, JSON, localStorage: { getItem() { return null } }, VENDOR: {}, document: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/js/app/24ht-ven-arte.js'), 'utf8') + ';this.VA=VenArte', ctx);
const FIG = ['Leone', 'Aquila', 'Lupo', 'Cervo', 'Torre', 'Spada', 'Corona', 'Rosa', 'Stella', 'Drago', 'Cinghiale', 'Ponte'];
const svg = FIG.map(fig => ctx.VA.stemma({ c1: '#b8322a', c2: '#2f6fa8', fig }, 34));
assert.strictEqual(new Set(svg).size, 12, '12 figure, 12 SVG diversi');
for (const x of svg) assert(/^<svg[^>]*>.*<\/svg>$/.test(x) && !/<text/.test(x), 'SVG senza lettere');
assert(!/transform/.test(ctx.VA.stemma({ c1: '#000', c2: '#fff' }, 34)), 'senza figura: solo lo scudo');
if (ACCESO) assert.strictEqual(V.nuovo(3).geo, 2, 'interruttore acceso: le partite nuove nascono nel mondo nuovo'); else assert.strictEqual(V.nuovo(3).geo, undefined);
console.log('ok ven p38');
