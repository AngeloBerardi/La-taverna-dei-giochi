// Salvataggi della prima edizione della Compagnia di ventura: semi 3, 11 e 29, ai giorni 0 e 45, giocati da bot_ven.js.
// Si sono generati su `main` prima dello spezzamento del motore (passo 01) e non si rigenerano più: servono a provare
// che le partite vecchie si aprono ancora. Uso (solo per ricrearli a mano): node tools/avventura/fixture-ven.js
const path = require('path'), fs = require('fs'), carica = require(path.join(__dirname, '../../tests/carica.js'));
const V = carica.multi(carica.VEN_FILES, 'VEN'), D = carica.multi(carica.VEN_FILES, 'VDAT'), gioca = require(path.join(__dirname, '../../tests/bot_ven.js'))(V, D);
const dir = path.join(__dirname, '../../tests/fixture/ven');
fs.mkdirSync(dir, { recursive: true });
for (const seme of [3, 11, 29]) {
  fs.writeFileSync(path.join(dir, 'seme' + seme + '_g0.json'), V.salva(V.nuovo(seme)));
  fs.writeFileSync(path.join(dir, 'seme' + seme + '_g45.json'), V.salva(gioca(V.nuovo(seme), 45, true, carica.rng(seme + 1))));
}
