// Compagnia di ventura, personaggi (V6a), prova lunga: il capitano accorto (tests/bot_ven.js) tiene tre compagni per 30 giorni su tre semi e nessuno se ne va.
// Se non regge si ritoccano PAGA e VINTA in VDAT.GRAD, non le soglie. (Test lento: escluso da `npm run verifica`; si lancia con `npm test -- ven_personaggi_bot`.)
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const gioca = require('./bot_ven.js')(V, D);
const TRE = ['co_berta', 'co_lapo', 'co_ghino'];
const riassunto = [];
for (const seme of [3, 17, 41]) {
  const s = V.nuovo(seme), tu = V.TU(s);
  for (const id of TRE) { tu.tr.push({ t: id, n: 1, f: 0, xp: 0 }); s.compagni[id] = -1; s.grad[id] = { g: D.GRAD.INIZIO, avv: 0, visto: [] }; }
  gioca(s, 30, true, carica.rng(seme + 1));
  const restano = TRE.filter(id => tu.tr.some(e => e.t === id && e.n > 0));
  riassunto.push('seme ' + seme + ': ' + TRE.map(id => id.slice(3) + ' ' + (s.grad[id] ? s.grad[id].g : 'via')).join(', '));
  assert.strictEqual(restano.length, 3, 'nessuno parte (seme ' + seme + '): ' + riassunto[riassunto.length - 1]);
}
console.log('ven_personaggi_bot ok (' + riassunto.join(' | ') + ')');
