// Passo 07, parte lenta: gli altri 14 semi delle prove sulla geografia, i 20 semi sul mondo vasto e il tempo di generazione per G = 240.
const assert = require('assert');
const { verifica, nuovoCtx } = require('./test_ven_p07.js');
const SEMI = Array.from({ length: 20 }, (_, i) => 100 + i * 37);
verifica(SEMI.slice(6));
verifica(SEMI, 'vasto'); // fra questi il 692, dove un ponte restava senza castello vicino
// tempo: a caldo (le prime generazioni compilano il codice). Cinque semi in due giri: la cache tiene 4 mappe, quindi nel
// secondo giro ogni seme si rigenera davvero; per ogni seme vale il più svelto dei due giri, e si guarda la mediana dei cinque.
// Così un momento di carico (altre prove in parallelo, il garbage collector) non basta a far fallire la prova.
{
  const { VGEO } = nuovoCtx(); for (const s of [900, 901, 902]) VGEO.genera(s, { mondo: 'vasto' });
  const semi = [11, 12, 13, 14, 15], ms = semi.map(() => 1e9);
  for (let giro = 0; giro < 2; giro++) semi.forEach((seme, k) => {
    const t = process.hrtime.bigint(), M = VGEO.genera(seme, { mondo: 'vasto' }), dt = Number(process.hrtime.bigint() - t) / 1e6;
    assert.strictEqual(M.G, 240); ms[k] = Math.min(ms[k], dt);
  });
  const ord = ms.slice().sort((a, b) => a - b), med = ord[2];
  console.log('generazione G=240, mediana di cinque: ' + med.toFixed(0) + ' ms (' + ord.map(v => v.toFixed(0)).join(', ') + ')');
  assert(med <= 500, 'generazione troppo lenta: mediana ' + med.toFixed(0) + ' ms');
}
console.log('test_ven_p07_lento ok');
