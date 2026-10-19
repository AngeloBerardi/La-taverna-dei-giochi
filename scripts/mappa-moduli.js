/* Rigenera la tabella "Mappa dei moduli" di docs/ARCHITECTURE.md dal manifest.
   Uso: node scripts/mappa-moduli.js   (o npm run mappa). Riscrive solo il testo tra i due marcatori. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
const doc = path.join(root, 'docs/ARCHITECTURE.md');
const A = '<!-- mappa:inizio -->', B = '<!-- mappa:fine -->';

const simboli = src => {
  const out = [], re = /^(?:async\s+)?(?:function\s*\*?\s*([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm;
  let m;
  while ((m = re.exec(src)) && out.length < 7) out.push(m[1] || m[2]);
  return out;
};

const righe = ['| File | KB | Simboli principali |', '|---|---|---|'];
for (const f of manifest) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  const kb = Math.max(1, Math.round(Buffer.byteLength(src) / 1024));
  const sim = /\.js$/.test(f) && !/vendor|12c-lobby-3d/.test(f) ? simboli(src).join(', ') : '';
  righe.push('| `' + f.replace(/^src\//, '') + '` | ' + kb + ' | ' + sim + ' |');
}

let md = fs.readFileSync(doc, 'utf8');
const blocco = A + '\n' + righe.join('\n') + '\n' + B;
if (md.includes(A) && md.includes(B)) md = md.slice(0, md.indexOf(A)) + blocco + md.slice(md.indexOf(B) + B.length);
else { console.error('Marcatori mancanti in ' + doc); process.exit(1); }
fs.writeFileSync(doc, md);
console.log('Mappa aggiornata: ' + (righe.length - 2) + ' file');
