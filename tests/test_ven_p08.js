// Passo 08: VEN.giorniViveri è una funzione pura, in giorni interi, coerente con razioni e uomini.
const assert = require('assert'), carica = require('./carica');
const VEN = carica.multi(carica.VEN_FILES, 'VEN');
const s = VEN.nuovo(8, { nome: 'Tester', compagnia: 'Compagnia di prova', regno: 'val' });
const g = VEN.giorniViveri(s);
assert(Number.isInteger(g) && g >= 0, 'giorni interi e non negativi: ' + g);
const t = VEN.TU(s), n = VEN.uomini(t);
assert.strictEqual(g, Math.floor(VEN.razioni(t) / Math.max(1, Math.ceil(n / 6))), 'stesso conto di prima');
const prima = JSON.stringify(s);
VEN.giorniViveri(s);
assert.strictEqual(JSON.stringify(s), prima, 'non modifica lo stato');
for (const m of Object.keys(t.merci || {})) if (t.merci[m]) t.merci[m] += 60;
assert(VEN.giorniViveri(s) >= g, 'più viveri, non meno giorni');
t.merci = {};
assert.strictEqual(VEN.giorniViveri(s), 0, 'senza merci, zero giorni');
console.log('test_ven_p08 ok: viveri', g, 'giorni');
