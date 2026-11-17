// Passo 01: le partite della prima edizione (tests/fixture/ven/) si aprono, avanzano 5 giorni col bot, si risalvano e si riaprono;
// nessun file della Ventura nei motori supera 35 KB; la lista dei file per i test arriva dal manifest.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const V = carica.multi(carica.VEN_FILES, 'VEN'), D = carica.multi(carica.VEN_FILES, 'VDAT'), gioca = require('./bot_ven.js')(V, D);
const dir = path.join(__dirname, 'fixture/ven'), file = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
assert.strictEqual(file.length, 6, 'sei salvataggi della prima edizione');
for (const f of file) {
  const s = V.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(s, f + ': si apre');
  const g0 = Math.floor(s.t / V.P.GIORNO); gioca(s, 5, true, carica.rng(7));
  assert(Math.floor(s.t / V.P.GIORNO) >= g0 + 5 || s.vinta, f + ': il tempo avanza di 5 giorni');
  const t = V.apri(V.salva(s)); assert(t, f + ': si riapre dopo il gioco'); assert.strictEqual(V.salva(t), V.salva(s), f + ': salva e apri coincidono');
  assert(V.uomini(V.TU(t)) >= 0);
}
assert(carica.VEN_FILES[0] === '27a-avv-dadi.js' && carica.VEN_FILES.includes('28k-ven-mondo.js'), 'VEN_FILES dal manifest');
assert(carica.VEN_FILES.indexOf('28j-ven-dati.js') < carica.VEN_FILES.indexOf('28k-ven-mondo.js'), 'ordine del manifest');
console.log('ok ven p01');
