// Passo 15: VVOC.APERTURE, le scene d'apertura di una campagna nuova (solo testi).
const assert = require('assert'), path = require('path');
const VVOC = require(path.join(__dirname, '../src/js/motori/28ja-ven-voci.js'));
const A = VVOC.APERTURE, TIPI = ['covo', 'scorta', 'recluta', 'torneo', 'villaggio', 'affare'];
const VALIDI = ['luogo', 'regno', 'uomini', 'monete', 'meta'];
assert(A && typeof A === 'object', 'APERTURE manca');
assert.deepStrictEqual(Object.keys(A).sort(), TIPI.slice().sort());
let n = 0;
for (const k of TIPI) {
  assert(Array.isArray(A[k]) && A[k].length === 2, k + ': servono 2 varianti');
  assert.notStrictEqual(A[k][0], A[k][1], k + ': varianti uguali');
  for (const t of A[k]) {
    n++;
    assert(typeof t === 'string' && t.length > 0 && t.length <= 240, k + ': lunghezza ' + t.length);
    const usati = (t.match(/\{[^}]*\}/g) || []).map(x => x.slice(1, -1));
    for (const u of usati) assert(VALIDI.includes(u), k + ': segnaposto non valido {' + u + '}');
    for (const v of VALIDI) assert(usati.includes(v), k + ': manca {' + v + '}');
    assert(!/[{}]/.test(t.replace(/\{[a-z]+\}/g, '')), k + ': graffa spaiata');
    assert(!/\p{Extended_Pictographic}/u.test(t), k + ': emoji');
    const frasi = t.split(/[.!?](?:\s|$)/).filter(x => x.trim()).length;
    assert(frasi <= 3, k + ': ' + frasi + ' frasi');
  }
}
assert.strictEqual(n, 12);
assert.strictEqual(JSON.stringify(JSON.parse(JSON.stringify(A))), JSON.stringify(A), 'JSON-clonabile');
console.log('p15 ok');
