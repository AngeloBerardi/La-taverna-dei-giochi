// Regole del Realtime Database per «viaggi/<chiave>»: proposte del sito di viaggio Big in Japan e i loro «pollici».
const R = require('./regole_rtdb.js');
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
const regole = R.carica(),
  K = 'abcdefghijklmnopqrstuvwx',
  P = 'viaggi/' + K + '/proposte/2026-12-28/p1';
const prop = (uid, extra = {}) => ({ autore: 'Angelo', titolo: 'Ramen a Shibuya', t: 1, uid, ...extra });
const vuoto = new Map();
const con = new Map([[P, prop('ua')]]);
const scrivi = (piatto, p, v, uid) => R.puoScrivere(regole, R.albero(piatto), p, v, uid).ok;
ck(scrivi(vuoto, P, prop('ua', { link: 'https://maps.google.com/?q=ramen', fascia: 'sera' }), 'ua'), 'proposta nuova con il proprio uid');
ck(!scrivi(vuoto, P, prop('ub'), 'ua'), 'proposta a nome di un altro uid: negata');
ck(!scrivi(vuoto, P, prop('ua'), null), 'senza accesso: negata');
ck(!scrivi(vuoto, 'viaggi/corta/proposte/2026-12-28/p1', prop('ua'), 'ua'), 'chiave del viaggio troppo corta: negata');
ck(!scrivi(vuoto, P, prop('ua', { link: 'javascript:alert(1)' }), 'ua'), 'link non https: negato');
ck(!scrivi(vuoto, P, prop('ua', { extra: 1 }), 'ua'), 'campo sconosciuto: negato');
ck(scrivi(con, P + '/voti/Luigi', true, 'ub'), 'un altro mette il pollice');
ck(!scrivi(con, P + '/voti/Luigi', 5, 'ub'), 'pollice con valore non booleano: negato');
ck(!scrivi(con, P, prop('ub', { titolo: 'cambiato' }), 'ub'), 'un altro non modifica la proposta');
ck(scrivi(con, P + '/ok', true, 'ub'), 'un altro approva la proposta (entra nel programma)');
ck(scrivi(con, P + '/ora', '13:30', 'ub'), 'un altro le dà un orario');
ck(!scrivi(con, P + '/ora', '25:99', 'ub'), 'orario non valido: negato');
ck(!scrivi(con, P + '/ok', 'si', 'ub'), 'approvazione non booleana: negata');
ck(scrivi(con, P, null, 'ua'), 'l’autore la cancella');
ck(!scrivi(con, P, null, 'ub'), 'un altro non la cancella');
ck(R.puoLeggere(regole, R.albero(con), 'viaggi/' + K, 'ub').ok, 'lettura con la chiave');
ck(!R.puoLeggere(regole, R.albero(con), 'viaggi', 'ub').ok, 'l’elenco dei viaggi non si legge');
if (fails) {
  console.log(fails + ' FAIL');
  process.exit(1);
} else console.log('regole viaggi: tutto ok');
