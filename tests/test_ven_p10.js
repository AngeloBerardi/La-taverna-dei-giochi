// Passo 10: le voci dei compagni in battaglia (VVOC.CAMPO). Solo testi: due frasi per momento, al massimo 60 lettere, niente emoji.
const assert = require('assert');
const VDAT = require('../src/js/motori/28j-ven-dati.js');
const VVOC = require('../src/js/motori/28ja-ven-voci.js');

const MOMENTI = ['carica', 'rotta', 'cede', 'ferito', 'vince'];
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/u;
const C = VVOC.CAMPO;
assert(C && typeof C === 'object', 'manca VVOC.CAMPO');
const ids = VDAT.COMPAGNI.map(c => c.id);
assert.strictEqual(ids.length, 10, 'i compagni sono dieci');
assert.deepStrictEqual(Object.keys(C).sort(), ids.slice().sort(), 'CAMPO ha esattamente i compagni di COMPAGNI');
let n = 0;
const viste = new Set();
for (const id of ids) {
  assert.deepStrictEqual(Object.keys(C[id]).sort(), MOMENTI.slice().sort(), id + ': momenti');
  for (const m of MOMENTI) {
    const f = C[id][m];
    assert(Array.isArray(f) && f.length === 2, id + '.' + m + ': servono due frasi');
    for (const t of f) {
      assert(typeof t === 'string' && t.trim().length > 0, id + '.' + m + ': frase vuota');
      assert(t.length <= 60, id + '.' + m + ': più di 60 lettere: ' + t);
      assert(!EMOJI.test(t), id + '.' + m + ': emoji in ' + t);
      assert(!viste.has(t), 'frase ripetuta: ' + t);
      viste.add(t);
      n++;
    }
  }
}
assert.strictEqual(n, 100);
// il capitolo di racconto resta com'era: CAMPO non è una scena
assert(!VVOC.ingressi.includes('CAMPO') && !('CAMPO' in VVOC.scene));
console.log('test_ven_p10: ok (' + n + ' frasi)');
