// Compagnia di ventura, dialoghi (V6b), prova lunga: il capitano accorto (tests/bot_ven.js) gioca 90 giorni su tre semi rispondendo alle scene.
// La rivale ti raggiunge alle tre tappe, ognuna si chiude, e il suo dono è uno solo (zaino + equipaggiamento). (Test lento: `npm test -- ven_voci_bot`.)
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js', '27a-avv-dadi.js', '27p-avv-compagni.js', '27q-avv-racconto.js', '28j-ven-dati.js', '28ja-ven-voci.js', '28k-ven-mondo.js', '28l-ven-campo.js'];
const X = carica.multi(F, '({ VEN, VDAT })'), V = X.VEN, D = X.VDAT;
const gioca = require('./bot_ven.js')(V, D);
const riassunto = [];
for (const seme of [3, 17, 41]) {
  const s = V.nuovo(seme), tu = V.TU(s);
  // con la scelta del patto alla prima tappa e del dono all'ultima (se c'è)
  const voce = v => { if (v.scena === 'volpe-3') { const d = v.scelte.find(c => c.i === 1); if (d) return d.i; } return v.scelte.find(c => c.ok).i; };
  gioca(s, 90, true, carica.rng(seme + 1), { voce });
  const cimeli = tu.zaino.filter(x => x === D.RIVALE.premio).length + V.capi(s).reduce((a, c) => a + Object.values(c.eq).filter(x => x === D.RIVALE.premio).length, 0);
  riassunto.push('seme ' + seme + ': tappa ' + s.volpe.tappa + ', cimeli ' + cimeli);
  assert.strictEqual(s.volpe.tappa, 3, 'la rivale ti raggiunge tre volte: ' + riassunto[riassunto.length - 1]);
  assert.strictEqual(cimeli, 1, 'un solo cimelio della rivale: ' + riassunto[riassunto.length - 1]);
  assert(!s.rac.scena, 'nessuna scena rimasta aperta');
}
console.log('ven_voci_bot ok (' + riassunto.join(' | ') + ')');
