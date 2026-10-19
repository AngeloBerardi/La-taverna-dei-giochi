// Bottega: catalogo coerente, ogni dorso ha il suo CSS, i prezzi in firestore.rules sono quelli del catalogo.
const fs = require('fs'), path = require('path'), assert = require('assert');
const B = require('../src/js/motori/22-bottega.js');
const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src/css/33-dorsi.css'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');

const ids = B.oggetti.map(o => o.id);
assert.strictEqual(new Set(ids).size, ids.length, 'id duplicati');
for (const o of B.oggetti) {
  assert(/^[a-z]+-[a-z]+$/.test(o.id), 'id non valido: ' + o.id);
  assert(Number.isInteger(o.prezzo) && o.prezzo > 0 && o.prezzo <= 1000, 'prezzo non valido: ' + o.id);
  assert(B.SLOT[o.slot], 'slot sconosciuto: ' + o.id);
  assert(o.nome && o.desc, 'nome e descrizione obbligatori: ' + o.id);
  assert(o.id.startsWith(o.slot + '-'), 'l\'id inizia con lo slot: ' + o.id);
  // CSS: anteprima (classe d-xxx) e uso reale (attributo data-dorso)
  const su = B.suffisso(o.id);
  assert(css.includes('.card.back.d-' + su + ',[data-dorso=' + su + '] .card.back{'), 'manca il CSS del dorso ' + su);
  // regole: una riga di acquisto con lo stesso prezzo
  assert(rules.includes(`acquisto('${o.id}', ${o.prezzo})`), 'firestore.rules non ha il prezzo di ' + o.id);
}
// nessun acquisto nelle regole che non sia nel catalogo
const inRegole = [...rules.matchAll(/acquisto\('([a-z-]+)', (\d+)\)/g)].map(m => m[1]);
assert.deepStrictEqual(inRegole.sort(), ids.slice().sort(), 'acquisti nelle regole diversi dal catalogo');
// nessuna regola CSS per dorsi che non esistono
for (const m of css.matchAll(/\.card\.back\.d-([a-z]+),/g)) assert(ids.includes('dorso-' + m[1]), 'CSS per un dorso fuori catalogo: ' + m[1]);

// usabile: la scelta di base è sempre usabile, gli altri solo se posseduti
assert(B.usabile('dorso-classico', {}), 'il dorso di base è gratis');
assert(!B.usabile('dorso-oro', {}), 'non posseduto');
assert(!B.usabile('dorso-oro', null), 'non posseduto (nessun profilo)');
assert(B.usabile('dorso-oro', { 'dorso-oro': true }), 'posseduto');
assert(!B.usabile('dorso-oro', { 'dorso-oro': false }), 'valore falso non conta');
assert.strictEqual(B.per('nessuno'), null);
assert.strictEqual(B.per('dorso-notte').prezzo, 40);
// un oggetto costa più di una vittoria piena (25) ma meno di ~20 partite: raggiungibile in poco tempo
assert(B.oggetti.every(o => o.prezzo >= 25 && o.prezzo <= 500), 'prezzi fuori scala rispetto ai premi (10 + 15)');
console.log('bottega ok:', ids.length, 'oggetti');
