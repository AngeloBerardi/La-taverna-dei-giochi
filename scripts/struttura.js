#!/usr/bin/env node
// Controlla che la struttura dei sorgenti resti facile da gestire (anche per Claude Code).
// ERRORI (fanno fallire): file in src/ non elencati nel manifest; blocchi CSS interi copiati tra file.
// AVVISI (solo informativi): numerazione diversa dall'ordine di caricamento, righe > 1500 caratteri
// (lo strumento Read tronca a 2000), file non generati > 45 KB.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
const errori = [], avvisi = [];
const GENERATI = ['src/js/app/12c-lobby-3d.js'];
const ESTERNI = /src\/js\/vendor\//;

// 1. file in src/ assenti dal manifest
const tutti = [];
(function giro(d) {
  for (const n of fs.readdirSync(path.join(root, d))) {
    const p = d + '/' + n;
    if (fs.statSync(path.join(root, p)).isDirectory()) giro(p); else if (/\.(js|css|html)$/.test(n)) tutti.push(p);
  }
})('src');
for (const f of tutti) if (!manifest.includes(f)) errori.push(`${f}: è in src/ ma non nel manifest (non finisce in dist)`);

// 2. numerazione vs ordine di caricamento, per cartella
const cartelle = {};
for (const f of manifest) (cartelle[path.dirname(f)] = cartelle[path.dirname(f)] || []).push(f);
for (const [dir, lista] of Object.entries(cartelle)) {
  const chiave = f => (path.basename(f).match(/^(\d+)([a-z]?)/) || [0, 1e9, ''])[1] * 100 + ((path.basename(f).match(/^\d+([a-z]?)/) || [])[1] || ' ').charCodeAt(0) / 1000;
  for (let i = 1; i < lista.length; i++)
    if (chiave(lista[i]) < chiave(lista[i - 1]) && !ESTERNI.test(lista[i]))
      avvisi.push(`${lista[i]}: il numero nel nome non segue l'ordine di caricamento (dopo ${path.basename(lista[i - 1])})`);
}

// 3. righe lunghe e file grandi
for (const f of manifest) {
  if (ESTERNI.test(f) || GENERATI.includes(f)) continue;
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  const lunghe = t.split('\n').reduce((n, r) => n + (r.length > 1500 ? 1 : 0), 0);
  if (lunghe) avvisi.push(`${f}: ${lunghe} righe > 1500 caratteri (Read le tronca)`);
  if (t.length > 45 * 1024) avvisi.push(`${f}: ${(t.length / 1024).toFixed(0)} KB, valuta di spezzarlo`);
}

// 4. blocchi CSS copiati: >= 8 regole identiche condivise tra due file
const norm = s => s.replace(/\s+/g, '');
const regole = {};
for (const f of manifest.filter(f => f.endsWith('.css'))) {
  const t = fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  regole[f] = new Set((t.match(/[^{}]+\{[^{}]*\}/g) || []).map(norm));
}
const css = Object.keys(regole);
for (let i = 0; i < css.length; i++) for (let j = i + 1; j < css.length; j++) {
  let c = 0; for (const r of regole[css[i]]) if (regole[css[j]].has(r)) c++;
  if (c >= 8) errori.push(`${css[i]} e ${css[j]} hanno ${c} regole CSS identiche: elimina la copia`);
}

avvisi.forEach(a => console.warn('avviso:', a));
errori.forEach(e => console.error('ERRORE:', e));
console.log(errori.length ? 'STRUTTURA: ERRORI' : `STRUTTURA OK (${avvisi.length} avvisi)`);
process.exit(errori.length ? 1 : 0);
