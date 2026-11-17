// Passo 07, parte lenta: gli altri 14 semi delle prove sulla geografia e il tempo di generazione per G = 240.
const assert = require('assert');
const { verifica, nuovoCtx } = require('./test_ven_p07.js');
const SEMI = Array.from({ length: 20 }, (_, i) => 100 + i * 37);
verifica(SEMI.slice(6));
// tempo: a caldo (la prima generazione compila il codice), mediana di cinque semi diversi
{
  const { VGEO } = nuovoCtx(); VGEO.genera(900, { mondo: 'vasto' });
  const ms = [11, 12, 13, 14, 15].map(seme => { const t = Date.now(); const M = VGEO.genera(seme, { mondo: 'vasto' }); assert.strictEqual(M.G, 240); return Date.now() - t; }).sort((a, b) => a - b);
  console.log('generazione G=240, mediana di cinque: ' + ms[2] + ' ms (' + ms.join(', ') + ')');
  assert(ms[2] <= 500, 'generazione troppo lenta: mediana ' + ms[2] + ' ms');
}
console.log('test_ven_p07_lento ok');
