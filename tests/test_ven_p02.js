// Passo 02: la vista della Ventura è spezzata in sei file. Ogni pannello si disegna (senza errori) in molti stati, i file sono sotto i 25 KB,
// ogni modulo mette a disposizione i nomi promessi e nessuno ridefinisce un aiutante del nucleo.
const assert = require('assert'), fs = require('fs'), vm = require('vm'), path = require('path');
const R = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(R, 'src/manifest.json'), 'utf8'));
const lista = Array.isArray(manifest) ? manifest : manifest.files || Object.values(manifest).flat();
const vista = lista.filter((f) => /app\/24hw/.test(f));
assert.deepStrictEqual(vista.map((f) => path.basename(f)), ['24hw-ventura.js', '24hwa-ven-barre.js', '24hwb-ven-luoghi.js', '24hwc-ven-gente.js', '24hwd-ven-scontro.js', '24hwe-ven-tv.js'], 'ordine dei file della vista nel manifest');
const css = lista.filter((f) => /css\/39j/.test(f)).map((f) => path.basename(f));
assert.deepStrictEqual(css, ['39j-ventura.css', '39ja-ven-barre.css', '39jb-ven-pannelli.css', '39jc-ven-campo.css'], 'ordine del CSS della Ventura');
for (const f of [...vista, ...lista.filter((f) => /css\/39j/.test(f))]) assert(fs.statSync(path.join(R, f)).size < 25 * 1024, f + ': oltre 25 KB');

const ls = new Map();
const ctx = { console, Math, JSON, Date, performance: { now: () => 1000 },
  localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k) },
  document: { getElementById: () => null, querySelector: () => null, documentElement: { classList: { toggle() {}, remove() {} } } },
  requestAnimationFrame: () => 1, cancelAnimationFrame() {}, esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'),
  ic: (n, s) => `<i data-ic="${n}" data-s="${s}"></i>`, render() {}, ui: {}, R: { on: false }, infoH: () => '<i></i>', G: null, ME: { name: 'Tester' }, Plancia: { chiudi() {} },
  VenStanza: { on: () => false, X: { era: false }, seat: () => -1, sync() {}, manda: () => ({}) },
  VenArte: { A: { pronta: true, fallita: false, errore: '' }, persa: () => false, qual: () => 'alta', cv: { style: {} }, smonta() {} },
  VenMappa: { K: {}, centra() {}, passo() {} }, VenCampo: { K: {}, apri(sc) { this.K.s = ctx.VCAM.nuovo(sc); this.K.pausa = true; this.K.scheda = sc; }, tocco() {} },
  VenAudio: new Proxy({ traccia: () => '' }, { get: (t, k) => (k in t ? t[k] : () => {}) }) };
vm.createContext(ctx);
const run = (f, extra) => vm.runInContext(fs.readFileSync(path.join(R, f), 'utf8') + (extra || ''), ctx, { filename: f });
run('src/js/motori/27a-avv-dadi.js');
lista.filter((f) => /motori\/28/.test(f)).forEach((f) => run(f));
vm.runInContext('this.VEN=VEN;this.VCAM=VCAM;this.VDAT=VDAT', ctx);
vista.forEach((f) => run(f, /24hw-ventura/.test(f) ? '\n;this.Ven=Ven;' : ''));
vm.runInContext('this.VM={VenBarre,VenLuoghi,VenGente,VenScontro,VenTv}', ctx);

const NOMI = { VenBarre: ['altoH', 'tastiH', 'bassoH', 'ctlH', 'menuH', 'cartaH', 'cartaMondoH'],
  VenLuoghi: ['luogoH', 'contoH', 'torneoH', 'truppaH', 'diploH', 'fondaH', 'sovranoH', 'passaH', 'coronaH', 'vittoriaH', 'fasiH'],
  VenGente: ['compagniaH', 'capitanoH', 'diarioH', 'gradH', 'confH', 'incH', 'voceH', 'schieraH'],
  VenScontro: ['incontroH', 'esitoH', 'attesaH', 'campoH'], VenTv: ['tvH', 'campoTvH'] };
for (const m in NOMI) for (const n of NOMI[m]) assert.strictEqual(typeof ctx.VM[m][n], 'function', m + '.' + n);
for (const n of ['V', 'D', 'bt', 'riga', 'pannello', 'tu', 'mio', 'inS', 'oggH', 'faz', 'pips', 'n0', 'CLS', 'TIPO', 'PREGIO']) assert(n in ctx.Ven._, 'Ven._.' + n);

const { Ven, VEN } = ctx, V = Ven.V;
const s = VEN.nuovo(5, { nome: 'Tester', compagnia: 'Compagnia di prova', regno: 'val' });
Ven.entra(s);
let n = 0;
const vede = (nome, fn, lasco) => { let h; try { h = fn(); } catch (e) { assert.fail(nome + ': ' + e.message); } assert(typeof h === 'string' && h.length > 0, nome + ': vuoto'); if (!lasco) assert(!/undefined|NaN|\[object/.test(h), nome + ': testo rotto'); n++; return h; };
assert(vede('mondo', () => Ven.html()).includes('class="vn"'), 'radice .vn');
for (const p of ['menu', 'compagnia', 'capitano', 'diario', 'carta', 'incontro']) vede('pan:' + p, () => { V.pan = p; return Ven.html(); });
V.pan = null;
const tipi = {}; for (const l of s.l) (tipi[l.tipo] = tipi[l.tipo] || []).push(l);
for (const t in tipi) for (const sub of ['home', 'mercato', 'sala', 'taverna', 'torneo']) vede('luogo:' + t + ':' + sub, () => { s.dentro = tipi[t][0].id; s.davanti = -1; V.pan = 'luogo'; V.sub = sub; return Ven.html(); });
s.dentro = -1; V.pan = null; V.sub = 'home';
const pp = s.p.find((p) => p.k && p.k !== 'car');
for (const tipo of ['nemico', 'parla', 'prigioniero']) vede('incontro:' + tipo, () => { s.incontro = { tipo, pid: [pp.id], all: [], da: 'tu' }; V.pan = 'incontro'; return Ven.html(); });
vede('incontro in TV', () => { ctx.ui.tv = true; const h = Ven.html(); ctx.ui.tv = false; return h; });
vede('mondo in TV', () => { s.incontro = null; V.pan = null; ctx.ui.tv = true; const h = Ven.html(); ctx.ui.tv = false; return h; });
vede('esito', () => { s.ult = { vince: 'a', premio: 50, morti: 3, presa: null, oggetti: [] }; V.pan = 'esito'; return Ven.html(); }, true);
vede('corona', () => { s.corona = { nome: 'Regno X', stend: 2, da: 1, sede: s.l.find((l) => l.tipo === 'castello').id, malc: 30, minacce: {} }; V.pan = 'corona'; return Ven.html(); });
vede('vittoria', () => { s.vinta = { g: 20, come: 're' }; V.pan = 'vittoria'; return Ven.html(); });
s.vinta = null; s.corona = null; V.pan = null;
vede('battaglia', () => { s.incontro = { tipo: 'nemico', pid: [pp.id], all: [], da: 'tu' }; V.pan = 'incontro'; Ven.act('scegli:attacca'); assert.strictEqual(V.modo, 'campo'); return Ven.html(); }, true);
vede('battaglia in TV', () => { ctx.ui.tv = true; const h = Ven.html(); ctx.ui.tv = false; return h; }, true);
assert(n > 40, 'pochi stati disegnati: ' + n);
console.log('ok ven_p02 (' + n + ' stati)');
