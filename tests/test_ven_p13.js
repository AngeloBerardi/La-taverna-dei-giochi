// Passo 13: VEN.segnali e VEN.prezzoMedio sono pure, ordinate e senza stato salvato.
const assert = require('assert'), carica = require('./carica');
const VEN = carica.multi(carica.VEN_FILES, 'VEN'), D = VEN.D || carica.multi(carica.VEN_FILES, 'VDAT');
const s = VEN.nuovo(13, { nome: 'Tester', compagnia: 'Compagnia di prova', regno: 'val' });
const citta = s.l.find(l => l.tipo === 'citta');
for (let i = 0; !VEN.torneoOggi(s, citta); i++) { s.t += VEN.P.GIORNO; assert(i < 10, 'torneo entro una settimana'); }
citta.inc = { tipo: 'predoni', premio: 100, giorni: 5 }; citta.unica = 'mazza'; citta.ass = 1;
const sg = VEN.segnali(s, citta.id);
assert.strictEqual(sg[0].k, 'torneo', 'il torneo è il primo');
assert.strictEqual(sg.map(x => x.k).join(), 'torneo,incarico,unico', 'al più tre, in ordine');
assert(sg.every(x => typeof x.tx === 'string' && x.tx), 'ogni segnale ha il testo');
citta.inc = null; citta.unica = null; citta.ass = null;
assert.strictEqual(VEN.segnali(s, citta.id).map(x => x.k).join(), 'torneo');
assert.strictEqual(VEN.segnali(s, -5).length, 0, 'luogo inesistente');
// prezzo medio: un solo luogo noto col mercato = il suo prezzo
for (const l of s.l) l.noto = false;
citta.noto = true;
const merci = Object.keys(carica.multi(carica.VEN_FILES, 'VDAT').MERCI);
for (const m of merci) assert.strictEqual(VEN.prezzoMedio(s, m), VEN.prezzo(s, citta, m, 1), 'un solo luogo: ' + m);
// due luoghi: la media arrotondata
const b = s.l.find(l => l.id !== citta.id && VEN.MERCATO[l.tipo]); b.noto = true;
const m = 'vino';
assert.strictEqual(VEN.prezzoMedio(s, m), Math.round((VEN.prezzo(s, citta, m, 1) + VEN.prezzo(s, b, m, 1)) / 2), 'media di due luoghi');
const prima = JSON.stringify(s);
VEN.prezzoMedio(s, m); VEN.segnali(s, citta.id);
assert.strictEqual(JSON.stringify(s), prima, 'nessun campo salvato');
console.log('test_ven_p13 ok');
