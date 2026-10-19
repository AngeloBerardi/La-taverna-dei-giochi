#!/usr/bin/env node
// Riscrive in firestore.rules le righe degli acquisti a partire dal catalogo (src/js/motori/22-bottega.js).
//   npm run regole          aggiorna il file
//   npm run regole -- --controlla   esce con errore se il file non è allineato (usato dai test)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const B = require(path.join(root, 'src/js/motori/22-bottega.js'));
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
const nuovo = blocco(t, 'elo', giochi.map(g => `elo('${g}')`));
const letto = fs.readFileSync(file, 'utf8');
if (process.argv.includes('--controlla')) { if (nuovo !== letto) { console.error('firestore.rules non allineato a catalogo e giochi: lancia npm run regole'); process.exit(1); } console.log('regole allineate a catalogo e giochi'); process.exit(0); }
fs.writeFileSync(file, nuovo); console.log(`firestore.rules: ${acq.length} acquisti, ${giochi.length} giochi con ELO`);
