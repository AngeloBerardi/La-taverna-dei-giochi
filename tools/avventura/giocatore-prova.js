// Il «giocatore di prova»: un comandante scritto a mano, con abitudini fisse, per misurare le manovre dei comandanti nemici (passi 25 e 30).
// Abitudini: carica la cavalleria per prima; i tiratori restano fermi dove sono; i fanti si muovono solo dopo FANTI_T istanti; fa entrare le ondate appena può.
// Non pensa: non guarda il terreno, non tiene riserve, non si ritira. È puro come i motori (nessun Math.random, Date.now): stessa battaglia, stesse mosse.
// Uso: const P = require('.../giocatore-prova.js'); a ogni istante `P.turno(VCAM, s, 'a')` (agisce ogni OGNI istanti); `P.prepara(VCAM, s, 'a')` una volta all'inizio.
const OGNI = 10, FANTI_T = 120;

// fermi i tiratori, in attesa tutti gli altri
function prepara(C, s, l) {
  l = l || 'a';
  for (const g of ['f', 't', 'c']) C.ordina(s, { l, g, t: 'tieni' });
}

// da chiamare a ogni istante, dopo C.passo: agisce ogni OGNI istanti
function turno(C, s, l) {
  l = l || 'a';
  if (s.fine || s.t % OGNI !== 1) return;
  C.ordina(s, { l, g: 'c', t: 'carica' });
  if (s.t >= FANTI_T) C.ordina(s, { l, g: 'f', t: 'carica' });
  for (const w of (s.ond && s.ond[l]) || []) if (!w.fatta) C.ondata(s, { l, id: w.id });
}

// una battaglia intera con il giocatore di prova al posto del lato `a`; `ogni` è chiamata a ogni istante (può fermare con `false`). Restituisce lo stato.
function gioca(C, s, ogni, max) {
  prepara(C, s, 'a');
  while (!s.fine && s.t < (max || 7000)) {
    C.passo(s, 1);
    turno(C, s, 'a');
    if (ogni && ogni(s) === false) break;
  }
  return s;
}

module.exports = { OGNI, FANTI_T, prepara, turno, gioca };
