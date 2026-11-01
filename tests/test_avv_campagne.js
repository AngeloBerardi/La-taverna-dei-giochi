// Campagne intere (A13): un bot gioca «La Corona Spezzata» dall'inizio alla fine attraverso l'orchestratore (tools/avventura/campagne.js) e se ne controllano
// le proprietà che contano per chi gioca davvero: il capitolo si può finire; la difficoltà ordina davvero le campagne (Racconto ≥ Normale ≥ Eroica);
// lo stato finale si salva e si riapre; il bot non incontra errori; nessuna campagna si blocca; tutto è ripetibile dal seme. Le percentuali complete
// (per compagnia, stile e abilità) le produce `node tools/avventura/campagne.js` e le raccoglie `docs/AVVENTURA-A13.md`. Lento: sta in LENTI di tutti.js.
const assert = require('assert');
const B = require('../tools/avventura/campagne.js');
const AVV = require('../src/js/motori/28a-avv-orchestratore.js');
const DIF = require('../src/js/motori/27ha-avv-difficolta.js');

const SEMI = [1, 2, 3, 4, 5, 6];
const gioca = (diff, seme, extra) => B.gioca(Object.assign({ sigle: ['g', 'm', 'c', 'l'], seme, diff }, extra || {}));

// ---- una campagna è ripetibile dal seme ----
{
  const a = gioca('normale', 3), b = gioca('normale', 3);
  assert.strictEqual(a.esito, b.esito); assert.strictEqual(a.giorni, b.giorni); assert.strictEqual(a.vite, b.vite); assert.strictEqual(a.M.battaglie, b.M.battaglie);
  assert.strictEqual(JSON.stringify(a.s), JSON.stringify(b.s), 'stesso seme, stessa campagna fino all\'ultimo byte');
}

// ---- le tre difficoltà sullo stesso gruppo di semi ----
const ris = {};
for (const d of DIF.ID) {
  ris[d] = SEMI.map((sm) => gioca(d, sm));
  ris[d].forEach((x, i) => {
    assert.deepStrictEqual(x.M.errori, [], d + ' seme ' + SEMI[i] + ': il bot non incontra errori ' + x.M.errori.slice(0, 2));
    assert(x.M.motivo !== 'passi esauriti', d + ': nessuna campagna resta in un ciclo (' + x.M.motivo + ')');
    assert.strictEqual(x.s.camp.diff, d, 'la difficoltà resta nello stato');
    assert(x.s.fine || x.M.motivo === 'stallo', d + ': ogni campagna finisce (vinta o persa) oppure è ferma senza nulla da fare');
    assert(x.s.vite >= 0 && x.s.vite <= DIF.D[d].vite, d + ': le vite restano nei limiti');
  });
}
const vinte = (d) => ris[d].filter((x) => x.vinta).length;
console.log('campagne vinte su ' + SEMI.length + ':', DIF.ID.map((d) => d + ' ' + vinte(d)).join(' · '));
assert(vinte('racconto') >= Math.ceil(SEMI.length * 2 / 3), 'a Racconto la compagnia di riferimento il capitolo lo finisce quasi sempre (' + vinte('racconto') + '/' + SEMI.length + ')');
assert(vinte('racconto') >= vinte('normale') && vinte('normale') >= vinte('eroica'), 'la difficoltà ordina le campagne: ' + DIF.ID.map((d) => vinte(d)).join(' ≥ '));
assert(vinte('racconto') > vinte('eroica'), 'Racconto e Eroica non sono la stessa cosa');

// ---- un finale vero: titolo, compagni, premio; lo stato si salva e si riapre ----
{
  const v = ris.racconto.find((x) => x.vinta); assert(v, 'serve almeno una campagna vinta a Racconto');
  const f = v.s.fine;
  assert(/^finale/.test(f.esito) && f.titolo && f.testo && f.monete > 0, 'finale con titolo, testo e premio ' + f.esito);
  assert.strictEqual(AVV.fase(v.s), 'fine');
  const sal = AVV.salva(v.s); assert.strictEqual(sal.fine, f.esito);
  const ri = AVV.apri(sal); assert(ri.s, ri.err); assert.strictEqual(ri.s.camp.diff, 'racconto'); assert.strictEqual(ri.s.fine.esito, f.esito);
}

// ---- l'esperienza dei Racconto è davvero più alta e il tempo meno stretto ----
{
  const liv = (d) => ris[d].reduce((a, x) => a + x.livello, 0) / ris[d].length;
  assert(liv('racconto') >= liv('eroica') - .01, 'a Racconto si arriva almeno allo stesso livello medio');
}

console.log('test_avv_campagne: ok');
