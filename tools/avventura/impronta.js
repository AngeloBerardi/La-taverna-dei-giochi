// Impronta della Compagnia di ventura: prova che il gioco non cambia di un bit quando si riorganizza il codice
// o quando un interruttore resta spento.
// Per i semi 3, 11 e 29 il bot gioca 60 giorni (capitano accorto con regno e incarichi, poi sconsiderato) e si stampa lo sha1
// di VEN.salva(s) (un capitano sconsiderato solo per il seme 29); in più l'esito di VCAM.risolvi su 5 schede di battaglia fisse.
// Ogni voce di VDAT.ACCESO (se esiste) è messa a false; `--acceso nome` ne accende una.
// Uso: node tools/avventura/impronta.js              stampa l'impronta
//      node tools/avventura/impronta.js --scrivi     la scrive in docs/passi/impronte/base.txt
//      node tools/avventura/impronta.js --acceso nome  stampa l'impronta con quell'interruttore acceso
//      node tools/avventura/impronta.js --controlla  confronta con docs/passi/impronte/* (base.txt, e nome.txt con `nome` acceso)
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const carica = require(path.join(__dirname, '../../tests/carica.js'));
const bot = require(path.join(__dirname, '../../tests/bot_ven.js'));
const CARTELLA = path.join(__dirname, '../../docs/passi/impronte');
const sha = x => crypto.createHash('sha1').update(x).digest('hex');
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const SCHEDE = [
  { seme: 1, a: T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), b: T(5, { val_f2: 12, val_t2: 6, val_c3: 4 }), cap, faza: 'tu', fazb: 'fer' },
  { seme: 2, a: T(0, { val_f2: 30, val_t2: 10 }), b: T(5, { fer_f1: 40 }), cap, faza: 'tu', fazb: 'pre' },
  { seme: 3, a: T(0, { val_f2: 20, val_t2: 8, val_c3: 6 }), b: T(5, { fer_f2: 20, fer_t3: 6 }), cap, faza: 'tu', fazb: 'fer', tipo: 'assedio' },
  { seme: 4, a: T(0, { val_f3: 25, val_c3: 10 }), b: T(5, { fer_f2: 30, fer_t2: 15, fer_c3: 8 }), cap, faza: 'tu', fazb: 'fer' },
  { seme: 5, a: T(0, { val_f1: 50, val_f2: 20 }), b: T(5, { fer_f1: 50, fer_f2: 20 }), cap, faza: 'tu', fazb: 'fer', tipo: 'assedio', assedio: { breccia: false, ariete: true } },
];
// Lavori indipendenti (ognuno in un processo suo, in parallelo): 3 capitani accorti, 1 sconsiderato, 5 battaglie.
const LAVORI = [3, 11, 29].map(seme => ({ seme, bravo: true })).concat([{ seme: 29, bravo: false }], SCHEDE.map((c, i) => ({ scheda: i })));
function lavoro(n, acceso) {
  const V = carica.multi(carica.VEN_FILES, 'VEN'), D = carica.multi(carica.VEN_FILES, 'VDAT'), C = carica.multi(carica.VEN_FILES, 'VCAM'), j = LAVORI[n];
  if (D.ACCESO) for (const k of Object.keys(D.ACCESO)) D.ACCESO[k] = k === acceso;
  else if (acceso) throw new Error('Nessun interruttore: VDAT.ACCESO non esiste ancora');
  if (j.scheda != null) return 'battaglia ' + (j.scheda + 1) + ' ' + sha(JSON.stringify(C.risolvi(SCHEDE[j.scheda])));
  const s = bot(V, D)(V.nuovo(j.seme), 60, j.bravo, carica.rng(j.seme + (j.bravo ? 1 : 2)), j.bravo ? { regno: true, inc: true } : undefined);
  return 'mondo ' + j.seme + (j.bravo ? ' accorto ' : ' sconsiderato ') + sha(V.salva(s));
}
function impronta(acceso) {
  const { execFile } = require('child_process');
  return Promise.all(LAVORI.map((_, n) => new Promise((ok, no) => execFile(process.execPath, [__filename, '--lavoro', String(n)].concat(acceso ? ['--acceso', acceso] : []), { maxBuffer: 1 << 20 },
    (e, out, err) => e ? no(new Error(err || e.message)) : ok(out.trim()))))).then(r => r.join('\n') + '\n');
}
const arg = k => { const i = process.argv.indexOf('--' + k); return i < 0 ? null : (process.argv[i + 1] || true); };
if (require.main === module) (async () => {
  if (arg('lavoro') != null) return console.log(lavoro(+arg('lavoro'), arg('acceso') && arg('acceso') !== true ? arg('acceso') : null));
  if (process.argv.includes('--controlla')) {
    let male = 0;
    for (const f of fs.existsSync(CARTELLA) ? fs.readdirSync(CARTELLA).filter(x => x.endsWith('.txt')).sort() : []) {
      const nome = f.slice(0, -4), atteso = fs.readFileSync(path.join(CARTELLA, f), 'utf8'), ora = await impronta(nome === 'base' ? null : nome);
      if (ora === atteso) console.log('OK    ' + f);
      else { male++; console.log('DIVERSA ' + f); const A = atteso.split('\n'), O = ora.split('\n'); for (let i = 0; i < Math.max(A.length, O.length); i++) if (A[i] !== O[i]) console.log('  atteso ' + A[i] + '\n  ora    ' + O[i]); }
    }
    if (male) { console.log('L\'impronta è cambiata.'); process.exit(1); }
    console.log('Impronta identica.');
  } else if (process.argv.includes('--scrivi')) {
    fs.mkdirSync(CARTELLA, { recursive: true });
    const nome = arg('acceso') && arg('acceso') !== true ? arg('acceso') : 'base';
    fs.writeFileSync(path.join(CARTELLA, nome + '.txt'), await impronta(nome === 'base' ? null : nome));
    console.log('Scritta docs/passi/impronte/' + nome + '.txt');
  } else process.stdout.write(await impronta(arg('acceso') && arg('acceso') !== true ? arg('acceso') : null));
})().catch(e => { console.error(e.message); process.exit(1); });
module.exports = impronta;
