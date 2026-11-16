// Compagnia di ventura, dialoghi (V6b), prova lunga: il capitano accorto (tests/bot_ven.js) gioca 90 giorni su tre semi rispondendo alle scene.
// La rivale ti raggiunge alle tre tappe, ognuna si chiude, e il suo dono è uno solo (zaino + equipaggiamento).
// V6c: ogni incarico personale si compie entro 40 giorni dall'apertura. (Test lento: `npm test -- ven_voci_bot`.)
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js', '27a-avv-dadi.js', '27p-avv-compagni.js', '27q-avv-racconto.js', '28j-ven-dati.js', '28ja-ven-voci.js', '28k-ven-mondo.js', '28l-ven-campo.js'];
const X = carica.multi(F, '({ VEN, VDAT })'), V = X.VEN, D = X.VDAT;
const gioca = require('./bot_ven.js')(V, D);
const riassunto = [];
for (const seme of [3, 17, 41]) {
  const s = V.nuovo(seme), tu = V.TU(s);
  // con la scelta del patto alla prima tappa e del dono all'ultima (se c'è)
  const voce = v => { if (v.scena === 'volpe-3') { const d = v.scelte.find(c => c.ok && (c.i === 1 || c.i === 2)); if (d) return d.i; } return v.scelte.find(c => c.ok).i; };
  gioca(s, 90, true, carica.rng(seme + 1), { voce });
  const cimeli = tu.zaino.filter(x => x === D.RIVALE.premio).length + V.capi(s).reduce((a, c) => a + Object.values(c.eq).filter(x => x === D.RIVALE.premio).length, 0);
  riassunto.push('seme ' + seme + ': tappa ' + s.volpe.tappa + ', cimeli ' + cimeli);
  assert.strictEqual(s.volpe.tappa, 3, 'la rivale ti raggiunge tre volte: ' + riassunto[riassunto.length - 1]);
  assert.strictEqual(cimeli, 1, 'un solo cimelio della rivale: ' + riassunto[riassunto.length - 1]);
  assert(!s.rac.scena, 'nessuna scena rimasta aperta');
}
// V6c: ogni incarico personale scritto si compie col bot accorto entro 40 giorni da quando si apre (il compagno entra fedele, a 80; con `inc` il bot non riscatta prigionieri se un compagno lo detesta)
const incarichi = [];
for (const c of D.COMPAGNI.filter(c => c.inc && c.premio)) for (const seme of [3, 17, 41]) {
  const s = V.nuovo(seme), gr = () => s.grad[c.id];
  V.TU(s).tr.push({ t: c.id, n: 1, f: 0, xp: 0 }); s.compagni[c.id] = -1; s.grad[c.id] = { g: 80, avv: 0, visto: [] };
  const r = carica.rng(seme + 7), opt = { inc: true }; let aperto = -1, g = 0;
  while (g++ < 60 && !(gr() && gr().prem)) { gioca(s, 1, true, r, opt); if (aperto < 0 && gr() && gr().incA) aperto = V.giorno(s); }
  const giorni = V.giorno(s) - aperto; incarichi.push(c.id.slice(3) + '@' + seme + ': ' + giorni + 'g');
  assert(aperto >= 0 && gr().prem && giorni <= 40, c.nome + ', seme ' + seme + ': incarico ' + ((gr() || {}).inc | 0) + '/3 in ' + giorni + ' giorni');
}
console.log('ven_voci_bot ok (' + riassunto.join(' | ') + ' · incarichi ' + incarichi.join(', ') + ')');
