#!/usr/bin/env node
// Assembla src/ in dist/index.html seguendo src/manifest.json (ordine = ordine di caricamento).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
// librerie esterne (src/js/vendor/): non nella pagina ma in dist/vendor/<nome>.<hash>.js, caricate da VENDOR.load
const NOMI = { '09-peerjs.js': 'peerjs', '09c-three.min.js': 'three', '12c-lobby-3d.js': 'lobby3d' }; // lobby3d: generato da tools/taverna3d, caricato a richiesta (guscio in app/12d-lobby-3d-guscio.js)
const vendor = {};
fs.mkdirSync(path.join(root, 'dist/vendor'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'dist/vendor'))) fs.rmSync(path.join(root, 'dist/vendor', f));
let html = manifest.map(f => {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  const nome = NOMI[path.basename(f)];
  if (!nome && !f.startsWith('src/js/vendor/')) return src;
  if (!nome) throw new Error('vendor senza nome in scripts/build.js: ' + f);
  const h = require('crypto').createHash('sha1').update(src).digest('hex').slice(0, 10);
  const file = `${nome}.${h}.js`;
  fs.writeFileSync(path.join(root, 'dist/vendor', file), src);
  vendor[nome] = '/vendor/' + file;
  return '';
}).join('');
html = html.replace('/*VENDOR*/{}', JSON.stringify(vendor));
// kit delle cene con delitto (src/kit/*.json): validati, scritti a parte in dist/kit/<id>.<hash>.json e scaricati solo dalla TV
// regista (REGIA.kit). Nella pagina va solo l'indice senza trame né soluzioni. Formato: docs/GIALLI.md
const GIALLO = require('../src/js/motori/36-giallo.js'), kitDir = path.join(root, 'src/kit'), kit = {};
fs.rmSync(path.join(root, 'dist/kit'), { recursive: true, force: true });
fs.mkdirSync(path.join(root, 'dist/kit'), { recursive: true });
for (const n of fs.existsSync(kitDir) ? fs.readdirSync(kitDir).filter(n => n.endsWith('.json')).sort() : []) {
  const src = fs.readFileSync(path.join(kitDir, n), 'utf8'), k = JSON.parse(src), err = GIALLO.valida(k);
  if (err.length) throw new Error(`kit ${n} non valido: ${err.join('; ')}`);
  if (k.id + '.json' !== n) throw new Error(`kit ${n}: il nome del file deve essere uguale all'id (${k.id})`);
  const file = `${k.id}.${require('crypto').createHash('sha1').update(src).digest('hex').slice(0, 10)}.json`;
  fs.writeFileSync(path.join(root, 'dist/kit', file), JSON.stringify(k));
  kit[k.id] = { titolo: k.titolo, sottotitolo: k.sottotitolo || '', giocatori: k.giocatori, minuti: k.minuti, tono: k.tono || '', url: '/kit/' + file };
}
if (!/\/\*KIT\*\/\s*\{\}/.test(html)) throw new Error('segnaposto /*KIT*/{} non trovato (app/24u-regia.js)');
html = html.replace(/\/\*KIT\*\/\s*\{\}/, JSON.stringify(kit));
// carte con illustrazione in assets/cards/<ID>.webp (es. JH, QS, KC, X): usate al posto del disegno vettoriale
const cardsDir = path.join(root, 'assets/cards');
const imgs = fs.existsSync(cardsDir) ? fs.readdirSync(cardsDir).filter(n => /^[JQKX][HDCS]?\.webp$/.test(n)).map(n => n.replace('.webp', '')) : [];
html = html.replace('/*FZIMG*/[]', JSON.stringify(imgs));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
// asset statici (immagini, audio) copiati così come sono
const assets = path.join(root, 'assets');
if (fs.existsSync(assets)) fs.cpSync(assets, path.join(root, 'dist/assets'), { recursive: true });
// PWA: manifest, icone e service worker nella radice (il service worker deve stare in /). __BUILD__ = hash della pagina.
const pwa = path.join(root, 'src/pwa');
if (fs.existsSync(pwa)) {
  const id = require('crypto').createHash('sha1').update(html).digest('hex').slice(0, 10);
  const urlVendor = JSON.stringify(Object.values(vendor));
  for (const n of fs.readdirSync(pwa)) {
    const dst = path.join(root, 'dist', n);
    if (n === 'sw.js') fs.writeFileSync(dst, fs.readFileSync(path.join(pwa, n), 'utf8').split('__BUILD__').join(id).split('/*VENDOR*/[]').join(urlVendor));
    else fs.copyFileSync(path.join(pwa, n), dst);
  }
}
console.log(`dist/index.html: ${(html.length / 1024).toFixed(0)} KB da ${manifest.length} file; vendor: ${Object.values(vendor).join(' ')}; kit: ${Object.keys(kit).join(' ') || 'nessuno'}`);
