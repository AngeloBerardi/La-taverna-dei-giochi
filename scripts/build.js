#!/usr/bin/env node
// Assembla src/ in dist/index.html seguendo src/manifest.json (ordine = ordine di caricamento).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
let html = manifest.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('');
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
  for (const n of fs.readdirSync(pwa)) {
    const dst = path.join(root, 'dist', n);
    if (n === 'sw.js') fs.writeFileSync(dst, fs.readFileSync(path.join(pwa, n), 'utf8').split('__BUILD__').join(id));
    else fs.copyFileSync(path.join(pwa, n), dst);
  }
}
console.log(`dist/index.html: ${(html.length / 1024).toFixed(0)} KB da ${manifest.length} file`);
