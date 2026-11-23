// Passo 37: il tappeto sonoro della mischia (tre livelli, sotto il limite dei suoni del campo).
const assert = require('assert'), VAUD = require('../src/js/motori/28n-ven-audio.js');

// i tre livelli seguono i colpi dell'ultimo secondo
assert.deepStrictEqual([0, 1, 2, 5, 6, 13, 14, 80].map(VAUD.livelloMischia), [0, 0, 1, 1, 2, 2, 3, 3]);

// ogni livello ha un suono a partitura, più forte del precedente e più breve di un secondo
const vol = L => L.reduce((a, n) => a + (n.v || 0), 0);
const nomi = [1, 2, 3].map(l => 'ven-mischia-' + l);
for (const n of nomi) {
  const P = VAUD.TAPPETO[n]; assert(Array.isArray(P) && P.length >= 2, n);
  for (const x of P) assert(x.t + x.d <= 1 + 1e-9, n + ' dura meno di un secondo');
  assert(!(n in VAUD.SUONI), n + ' sta in TAPPETO, non in SUONI');
}
assert(vol(VAUD.TAPPETO[nomi[0]]) < vol(VAUD.TAPPETO[nomi[1]]) && vol(VAUD.TAPPETO[nomi[1]]) < vol(VAUD.TAPPETO[nomi[2]]), 'il volume cresce coi livelli');

// l'evento «mischia» suona il livello giusto, nessuno a livello 0
for (const l of [1, 2, 3]) assert.deepStrictEqual(VAUD.campo([{ t: 'mischia', liv: l }], null).map(x => x.n), [nomi[l - 1]]);
assert.deepStrictEqual(VAUD.campo([{ t: 'mischia', liv: 0 }], null), []);

// sotto il limite: con altri suoni importanti il tappeto cede il posto, mai più di MAX_CAMPO
const ev = [{ t: 'rotta' }, { t: 'grido' }, { t: 'fine', vince: 'a' }, { t: 'colpo', dan: 3, crit: true }, { t: 'mischia', liv: 3 }];
const l = VAUD.campo(ev, null);
assert(l.length <= VAUD.MAX_CAMPO && !l.some(x => /mischia/.test(x.n)), JSON.stringify(l));
assert.deepStrictEqual(VAUD.campo([{ t: 'colpo', dan: 3, crit: true }, { t: 'mischia', liv: 2 }], null).map(x => x.n), ['ven-cozzo', 'ven-mischia-2']);
console.log('test_ven_p37: ok');
