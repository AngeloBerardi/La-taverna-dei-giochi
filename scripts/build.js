#!/usr/bin/env node
// Assembla src/ in dist/index.html seguendo src/manifest.json (ordine = ordine di caricamento).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
// librerie esterne (src/js/vendor/): non nella pagina ma in dist/vendor/<nome>.<hash>.js, caricate da VENDOR.load
const NOMI = { '09-peerjs.js': 'peerjs', '09c-three.min.js': 'three' };
const vendor = {};
fs.mkdirSync(path.join(root, 'dist/vendor'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'dist/vendor'))) fs.rmSync(path.join(root, 'dist/vendor', f));
let html = manifest.map(f => {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  if (!f.startsWith('src/js/vendor/')) return src;
  const nome = NOMI[path.basename(f)];
  if (!nome) throw new Error('vendor senza nome in scripts/build.js: ' + f);
  const h = require('crypto').createHash('sha1').update(src).digest('hex').slice(0, 10);
  const file = `${nome}.${h}.js`;
  fs.writeFileSync(path.join(root, 'dist/vendor', file), src);
  vendor[nome] = '/vendor/' + file;
  return '';
}).join('');
html = html.replace('/*VENDOR*/{}', JSON.stringify(vendor));
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
console.log(`dist/index.html: ${(html.length / 1024).toFixed(0)} KB da ${manifest.length} file; vendor: ${Object.values(vendor).join(' ')}`);
