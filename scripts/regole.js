#!/usr/bin/env node
// Riscrive in firestore.rules le righe degli acquisti a partire dal catalogo (src/js/motori/22-bottega.js).
//   npm run regole          aggiorna il file
//   npm run regole -- --controlla   esce con errore se il file non è allineato (usato dai test)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const B = require(path.join(root, 'src/js/motori/22-bottega.js'));
const file = path.join(root, 'firestore.rules');
const t = fs.readFileSync(file, 'utf8');
const IN = '// bottega:inizio', FI = '// bottega:fine';
const i = t.indexOf(IN), j = t.indexOf(FI);
if (i < 0 || j < i) { console.error('segnaposto bottega mancanti in firestore.rules'); process.exit(1); }
const rientro = t.slice(t.lastIndexOf('\n', i) + 1, i);
const righe = B.oggetti.filter(o => o.prezzo > 0).map(o => `${rientro}${o === B.oggetti.filter(x => x.prezzo > 0)[0] ? '' : '|| '}acquisto('${o.id}', ${o.prezzo})`);
const nuovo = t.slice(0, i + IN.length) + '\n' + righe.join('\n') + '\n' + rientro + t.slice(j);
if (process.argv.includes('--controlla')) { if (nuovo !== t) { console.error('firestore.rules non allineato al catalogo: lancia npm run regole'); process.exit(1); } console.log('regole allineate al catalogo'); process.exit(0); }
fs.writeFileSync(file, nuovo); console.log(`firestore.rules: ${righe.length} acquisti`);
