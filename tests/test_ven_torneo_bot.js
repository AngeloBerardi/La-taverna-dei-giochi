// Compagnia di ventura, tornei (V2), prova lunga con i bot: il capitano accorto vince almeno un torneo in 60 giorni su più di metà dei semi,
// quello a caso quasi mai. (Test lento: ~3 minuti, escluso da `npm run verifica`; si lancia con `npm test -- ven_torneo_bot`.)
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const gioca = require('./bot_ven.js')(V, D);
{
  let bravi = 0, caso = 0, iscritti = 0;
  for (let i = 1; i <= 20; i++) { const a = gioca(V.nuovo(i * 7 + 1), 60, true, carica.rng(i + 1)); if (a.stat.tornei) bravi++; }
  for (let i = 1; i <= 8; i++) { const b = gioca(V.nuovo(i * 7 + 1), 60, false, carica.rng(i + 1)); if (b.stat.tornei) caso++; if (b.torneoUsato) iscritti++; }
  assert(bravi > 10, 'il capitano accorto vince tornei: ' + bravi + '/20'); assert(iscritti >= 1, 'il capitano a caso si iscrive davvero (' + iscritti + '/8): senza iscrizioni la prova sarebbe vuota'); assert(caso <= 1, 'il capitano a caso quasi mai: ' + caso + '/8');
}
console.log('ven_torneo_bot ok');
