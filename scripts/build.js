#!/usr/bin/env node
// Assembla src/ in dist/index.html seguendo src/manifest.json (ordine = ordine di caricamento).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
const html = manifest.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
// asset statici (immagini, audio) copiati così come sono
const assets = path.join(root, 'assets');
if (fs.existsSync(assets)) fs.cpSync(assets, path.join(root, 'dist/assets'), { recursive: true });
console.log(`dist/index.html: ${(html.length / 1024).toFixed(0)} KB da ${manifest.length} file`);
