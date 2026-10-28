// Pulizia del Realtime Database (scripts/pulizia-stanze.js): solo la decisione, senza rete.
const assert = require('assert');
const { piano } = require('../scripts/pulizia-stanze.js');

const G = 86400000,
  ora = 100 * G;
const dati = {
  stanze: {
    VECCHIA: { t: ora - 10 * G, p: null }, // ferma da 10 giorni, nessuno: via
    FRESCA: { t: ora - 2 * G, p: null }, // giocata 2 giorni fa: resta
    PRESENTE: { t: ora - 30 * G, p: { d1: { t: ora - 3600000 } } }, // vecchia ma con qualcuno dentro: resta
    FANTASMA: { t: ora - 30 * G, p: { d1: { t: ora - 20 * G } } }, // presenza rimasta appesa da 20 giorni: via
    VUOTA: { t: null, p: null }, // mai partita, nessuno: via
    PIAZZA: { t: ora - 90 * G, p: null }, // la generale non si tocca
  },
  regia: ['VECCHIA', 'FRESCA', 'SPARITA'],
  segreti: ['SPARITA'],
  azioni: ['PRESENTE'],
  errori: [String(ora - 40 * G) + '-abc', String(ora - 5 * G) + '-def', 'strano'],
};

const via = piano(dati, ora, { giorni: 7, errori: 30 })
  .map(x => x.p)
  .sort();
assert.deepStrictEqual(via, [
  'errori/' + (ora - 40 * G) + '-abc',
  'regia/SPARITA',
  'regia/VECCHIA',
  'segreti/SPARITA',
  'stanze/FANTASMA',
  'stanze/VECCHIA',
  'stanze/VUOTA',
]);

// con una soglia più lunga la stanza di 10 giorni resta, e restano anche i suoi rami della regia
const lungo = piano(dati, ora, { giorni: 14, errori: 30 }).map(x => x.p);
assert(!lungo.includes('stanze/VECCHIA') && !lungo.includes('regia/VECCHIA'));
assert(lungo.includes('stanze/FANTASMA'));

// database vuoto: niente da fare; ogni voce ha un motivo leggibile
assert.deepStrictEqual(piano({}, ora), []);
assert(piano(dati, ora).every(x => typeof x.perche === 'string' && x.perche.length > 5));
console.log('pulizia: ok');
