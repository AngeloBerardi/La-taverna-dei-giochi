// Esegue i test dei motori (tests/test_*.js) in parallelo, uno per processo.
//   npm test                    tutti i test
//   npm test -- catan uno       solo i file il cui nome contiene "catan" o "uno"
//   npm test -- --lenti         salta i test lenti (> 10 s di solito: valle, saboteur, scoundrel_greedy...)
// Con successo stampa una riga per test; con un fallimento stampa l'output completo di quel solo test.
// Esce con codice 1 se almeno un test fallisce (non si ferma al primo).
const fs = require('fs'), os = require('os'), path = require('path');
const { execFile } = require('child_process');

const LENTI = ['valle', 'accordi', 'saboteur', 'scoundrel_greedy', 'discesa', 'machiavelli', 'isola', 'the_gang', 'regicide'];
const args = process.argv.slice(2);
const salta = args.includes('--lenti');
const filtri = args.filter(a => !a.startsWith('--'));

let files = fs.readdirSync(__dirname).filter(f => /^test_.*\.js$/.test(f)).sort();
if (filtri.length) files = files.filter(f => filtri.some(x => f.includes(x)));
if (salta) files = files.filter(f => !LENTI.some(x => f.includes(x)));
if (!files.length) { console.log('Nessun test corrisponde a:', filtri.join(' ') || '(vuoto)'); process.exit(1); }

const parallelo = Math.max(1, Math.min(files.length, os.cpus().length));
let prossimo = 0, ko = 0, finiti = 0;
const t0 = Date.now();

function avvia() {
  if (prossimo >= files.length) return;
  const f = files[prossimo++], t = Date.now();
  execFile(process.execPath, [path.join(__dirname, f)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
    const s = ((Date.now() - t) / 1000).toFixed(1) + 's';
    if (err) { ko++; console.log('✘', f, s); console.log(String(stdout || '') + String(stderr || '')); }
    else console.log('✔', f, s);
    if (++finiti === files.length) {
      console.log(ko ? `${ko} test falliti su ${files.length}` : `Tutti i test passati (${files.length}) in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      process.exit(ko ? 1 : 0);
    }
    avvia();
  });
}
for (let i = 0; i < parallelo; i++) avvia();
