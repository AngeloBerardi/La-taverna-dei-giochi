#!/usr/bin/env node
// Riscrive in firestore.rules le righe degli acquisti a partire dal catalogo (src/js/motori/22-bottega.js).
//   npm run regole          aggiorna il file
//   npm run regole -- --controlla   esce con errore se il file non è allineato (usato dai test)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const B = require(path.join(root, 'src/js/motori/22-bottega.js'));
const EROI = require(path.join(root, 'src/js/motori/27-eroi.js'));
const file = path.join(root, 'firestore.rules');
let t = fs.readFileSync(file, 'utf8');
const giochi = [...fs.readFileSync(path.join(root, 'src/js/app/07-nucleo.js'), 'utf8').matchAll(/(?:^ \{|GAMES\.push\(\{)id:'([a-z0-9]+)'/gm)].map(m => m[1]);
if (giochi.length < 15) { console.error('elenco giochi non trovato in 07-nucleo.js'); process.exit(1); }
// sostituisce le righe tra due segnaposto, mantenendo il rientro
function blocco(testo, nome, righe) {
  const IN = `// ${nome}:inizio`, FI = `// ${nome}:fine`;
  const i = testo.indexOf(IN), j = testo.indexOf(FI);
  if (i < 0 || j < i) { console.error(`segnaposto ${nome} mancanti in firestore.rules`); process.exit(1); }
  const rientro = testo.slice(testo.lastIndexOf('\n', i) + 1, i);
  return testo.slice(0, i + IN.length) + '\n' + righe.map((r, k) => rientro + (k ? '|| ' : '') + r).join('\n') + '\n' + rientro + testo.slice(j);
}
const acq = B.oggetti.filter(o => o.prezzo > 0).map(o => `acquisto('${o.id}', ${o.prezzo})`);
t = blocco(t, 'bottega', acq);
t = blocco(t, 'elo', giochi.map(g => `elo('${g}')`));
// liste di confronti per razze e classi degli eroi (un confronto per riga, senza || iniziale)
function bloccoOr(testo, nome, campo, ids) {
  const IN = `// ${nome}`, FI = `// ${nome}:fine`;
  const i = testo.indexOf(IN + '\n'), j = testo.indexOf(FI);
  if (i < 0 || j < i) { console.error(`segnaposto ${nome} mancanti in firestore.rules`); process.exit(1); }
  const rientro = testo.slice(testo.lastIndexOf('\n', i) + 1, i);
  return testo.slice(0, i + IN.length) + '\n' + ids.map((x, k) => `${rientro}${k ? '|| ' : ''}${campo} == '${x}'`).join('\n') + '\n' + rientro + testo.slice(j);
}
t = bloccoOr(t, 'eroi:razze', 'r', Object.keys(EROI.RAZZE));
const nuovo = bloccoOr(t, 'eroi:classi', 'c', Object.keys(EROI.CLASSI));
const letto = fs.readFileSync(file, 'utf8');
if (process.argv.includes('--controlla')) { if (nuovo !== letto) { console.error('firestore.rules non allineato a catalogo e giochi: lancia npm run regole'); process.exit(1); } console.log('regole allineate a catalogo e giochi'); process.exit(0); }
fs.writeFileSync(file, nuovo); console.log(`firestore.rules: ${acq.length} acquisti, ${giochi.length} giochi con ELO, ${Object.keys(EROI.RAZZE).length} razze e ${Object.keys(EROI.CLASSI).length} classi`);
