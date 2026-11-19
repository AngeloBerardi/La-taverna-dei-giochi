// Passo 29: rilascio delle grandi battaglie. Con l'interruttore acceso la scheda del giocatore nasce con taglia, reparti, ondate (e capoB contro un signore);
// con l'interruttore spento il gancio non fa nulla. Prova lunga (bot 60 giorni, nessun seme in rovina): `P29_ACCESA=1 node tests/test_ven_p29.js`.
// Stato del rilascio: i semi 3 e 5 vanno in rovina a interruttore acceso (vedi la PR), quindi `ACCESO.grandi` resta spento finché non si correggono.
const assert = require('assert');
const carica = require('./carica.js');
const gioca = require('./bot_ven.js');

function prova(seme, acceso, giorni, bravo) {
  const X = carica.multi(carica.VEN_SENZA_VOCI, '({ VEN, VDAT })'), V = X.VEN, D = X.VDAT;
  for (const k of Object.keys(D.ACCESO)) D.ACCESO[k] = false;
  D.ACCESO.grandi = acceso;
  const r = { grandi: 0, capo: 0, piccole: 0, battaglie: 0 };
  V.aggancia('scheda', (s, sc) => { if (!sc || sc.tipo === 'arena') return; if (sc.reparti && sc.ondate && sc.max === 70 && sc.W === 80 && sc.H === 120) r.grandi++; else r.piccole++; if (sc.capoB) r.capo++ });
  V.aggancia('battaglia', () => { r.battaglie++ });
  const s = gioca(V, D)(V.nuovo(seme), giorni, bravo, carica.rng(seme + (bravo ? 1 : 2)));
  r.s = s; r.uomini = V.uomini(V.TU(s)); r.stat = s.stat.vinte + '/' + s.stat.perse;
  return r;
}

// gancio inerte a interruttore spento, attivo da acceso (taglia della partita: media = 70 uomini, 80×120)
{
  const spento = prova(3, false, 8, true), acceso = prova(3, true, 8, true);
  assert(spento.battaglie > 0 && spento.grandi === 0 && spento.capo === 0, 'spento: nessuna scheda cambia');
  assert(acceso.grandi > 0 && acceso.piccole === 0, 'acceso: ogni battaglia del giocatore è grande');
  const caso = prova(11, true, 8, false);
  assert(caso.s.t > 0 && caso.grandi > 0 && caso.piccole === 0, 'il bot casuale gioca solo battaglie grandi, senza errori');
}
if (process.env.P29_ACCESA) {
  const GIORNI = +(process.env.GIORNI_P29 || 60);
  for (const seme of [3, 5, 11, 29]) {
    const prima = prova(seme, false, GIORNI, true), dopo = prova(seme, true, GIORNI, true);
    console.log('seme', seme, GIORNI + 'gg', 'spento', prima.uomini, 'uomini', prima.stat, '| acceso', dopo.uomini, 'uomini', dopo.stat);
    assert(dopo.uomini > 0, 'seme ' + seme + ': il bot accorto non va in rovina');
  }
}
console.log('test_ven_p29 ok');
