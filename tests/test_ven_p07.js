// Passo 07: la geografia dei mondi nuovi (s.geo===2): terra più vasta, catene con passi, fiumi che scendono, laghi, porti sull'acqua giusta, ponti.
const assert = require('assert'), crypto = require('crypto');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const nuovoCtx = () => carica.multi(F, '({ VEN, VGEO, VDAT })');
const { VEN, VGEO, VDAT } = nuovoCtx();
// 20 semi: 6 qui, gli altri 14 e il tempo di generazione in test_ven_p07_lento.js
const SEMI = Array.from({ length: 20 }, (_, i) => 100 + i * 37);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dim = M => M.G;
const impronta = M => crypto.createHash('sha1').update(Buffer.from(M.T.buffer)).update(Buffer.from(M.F.buffer)).update(Buffer.from(M.S.buffer)).update(JSON.stringify(M.luoghi)).update(JSON.stringify(M.P)).digest('hex');

const LATO = { ampio: 192, vasto: 240 };
function verifica(semi, mondo = 'ampio') {
for (const n of semi) {
  const M = VGEO.genera(n, { mondo }), G = dim(M), N = G * G, cell = l => Math.floor(l.y) * G + Math.floor(l.x);
  const seme = n + ' (' + mondo + ')', raggio = VGEO.GEO.GUARDIA * G / 128; // il seme nei messaggi; la distanza massima castello-ponte
  assert.strictEqual(G, LATO[mondo]);
  // nessuna terra sulle 8 celle del bordo
  for (let i = 0; i < N; i++) { const x = i % G, y = (i - x) / G; if (Math.min(x, y, G - 1 - x, G - 1 - y) < 8) assert.strictEqual(M.T[i], 0, 'terra sul bordo, seme ' + seme); }
  // nessun luogo in acqua o su un monte
  for (const l of M.luoghi) { const t = M.T[cell(l)]; assert(t !== 0 && t !== 4, l.tipo + ' in acqua o su un monte, seme ' + seme); assert(M.ok[cell(l)], 'luogo fuori dalla terra principale'); }
  const tipi = {}; M.luoghi.forEach(l => tipi[l.tipo] = (tipi[l.tipo] || 0) + 1);
  // passo 23: le cinque città di zona più 4–5 (ampio) o 6–7 (vasto); ogni zona di cultura ha almeno una città
  const CITTA = { ampio: [9, 10], vasto: [11, 12] }[mondo];
  assert(tipi.citta >= CITTA[0] && tipi.citta <= CITTA[1], 'città: ' + tipi.citta + ', seme ' + seme);
  for (const f of VDAT.REGNI) assert(M.luoghi.some(l => l.tipo === 'citta' && l.faz === f), 'zona ' + f + ' senza città, seme ' + seme);
  assert(tipi.castello >= 16 && tipi.villaggio >= 32 && tipi.porto >= 5, JSON.stringify(tipi));
  // tutte le città sono raggiungibili tra loro (sulla terra percorribile) e legate da strade
  {
    const vis = new Uint8Array(N), c0 = M.luoghi.find(l => l.tipo === 'citta'), q = [cell(c0)]; vis[q[0]] = 1;
    for (let k = 0; k < q.length; k++) { const c = q[k], x = c % G, y = (c - x) / G; for (const [ox, oy] of N4) { const nx = x + ox, ny = y + oy; if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue; const j = ny * G + nx; if (!vis[j] && M.T[j] !== 0 && M.T[j] !== 4) { vis[j] = 1; q.push(j); } } }
    for (const l of M.luoghi) assert(vis[cell(l)], l.nome + ' non raggiungibile, seme ' + seme);
    const vs = new Uint8Array(N), st = [cell(c0)]; vs[st[0]] = 1;
    for (let k = 0; k < st.length; k++) { const c = st[k], x = c % G, y = (c - x) / G; for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const nx = x + ox, ny = y + oy; if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue; const j = ny * G + nx; if (!vs[j] && M.S[j]) { vs[j] = 1; st.push(j); } } }
    for (const l of M.luoghi.filter(l => l.tipo === 'citta')) assert(vs[cell(l)], 'città senza strada verso le altre, seme ' + seme);
  }
  // ogni porto confina con mare o con un lago di almeno 40 celle
  for (const l of M.luoghi.filter(l => l.tipo === 'porto')) {
    const x = Math.floor(l.x), y = Math.floor(l.y); let acqua = false;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const j = (y + oy) * G + x + ox; if (M.T[j] === 0 && (M.LG[j] === 0 || M.laghi[M.LG[j]].n >= 40)) acqua = true; }
    assert(acqua, 'porto senza acqua navigabile: ' + l.nome + ', seme ' + seme);
  }
  for (let a = 0; a < M.luoghi.length; a++) for (let b = a + 1; b < M.luoghi.length; b++) { const p = M.luoghi[a], r = M.luoghi[b]; if (p.tipo === 'porto' && r.tipo === 'porto') assert(Math.hypot(p.x - r.x, p.y - r.y) >= 6, 'porti troppo vicini'); }
  // fiumi: scendono (quota non crescente) e finiscono in mare o in un lago
  assert(M.fiumi.length >= 6 && M.fiumi.length <= 10, 'fiumi principali: ' + M.fiumi.length);
  let celleFiume = 0;
  for (let i = 0; i < N; i++) if (M.F[i] > 0) {
    celleFiume++; assert(M.T[i] !== 0, 'fiume in acqua');
    let c = i, passi = 0; while (M.T[c] !== 0) { const d = M.D[c]; assert(d >= 0, 'fiume senza sbocco'); assert(M.Q[d] <= M.Q[c] + 1e-6, 'fiume che sale'); if (M.T[d] !== 0) assert(M.F[d] > 0, 'il fiume si interrompe'); c = d; assert(++passi < N); }
  }
  assert(celleFiume > 100, 'troppo pochi fiumi: ' + celleFiume);
  for (const f of M.fiumi) { assert(M.F[f.foce] > 0); assert.strictEqual(M.T[M.D[f.foce]], 0); }
  // ogni dorsale ha almeno 2 passi, percorribili
  assert(M.catene.length >= 3 && M.catene.length <= 5, 'catene: ' + M.catene.length);
  // le dorsali corrono dritte, senza riccioli: tra il primo e l'ultimo punto almeno 0,6 volte la lunghezza
  for (const c of M.catene) { const a = c.pt[0], b = c.pt[c.pt.length - 1]; let lun = 0; for (let k = 1; k < c.pt.length; k++) lun += Math.hypot(c.pt[k][0] - c.pt[k - 1][0], c.pt[k][1] - c.pt[k - 1][1]);
    assert(Math.hypot(b[0] - a[0], b[1] - a[1]) >= .6 * lun, 'dorsale arricciata: ' + Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(0) + ' su ' + lun.toFixed(0) + ', seme ' + seme); }
  for (const c of M.catene) { assert(c.passi.length >= 2, 'dorsale con meno di 2 passi, seme ' + seme); for (const p of c.passi) { const i = p[1] * G + p[0]; assert(M.ok[i] && M.T[i] !== 0 && M.T[i] !== 4, 'passo non percorribile'); } }
  const monti = M.T.reduce((n, t) => n + (t === 4), 0); assert(monti > 200, 'poche montagne: ' + monti);
  // ogni strada che attraversa un fiume ha un ponte o un guado; i ponti hanno il loro castello
  for (let i = 0; i < N; i++) if (M.S[i] && M.F[i] > 0) assert(M.PN[i] > 0, 'strada su un fiume senza ponte, seme ' + seme);
  for (const p of M.P) { assert(p.castello >= 0 && M.luoghi[p.castello].tipo === 'castello'); assert(M.F[p.i] > 0 && M.PN[p.i] > 0); }
  // porti solo su acque navigabili: nessun luogo di mercato su un laghetto non c'è; i laghi grandi hanno almeno 40 celle
  for (const lg of M.laghi.slice(1)) assert.strictEqual(lg.grande, lg.n >= 40);
  // colline e monti: né un altopiano di colline né monti ridotti a salsicciotti
  const c = [0, 0, 0, 0, 0]; M.T.forEach(v => c[v]++); const terra = c[1] + c[2] + c[3] + c[4];
  assert(c[3] / terra >= .08 && c[3] / terra <= .26, 'colline: ' + (100 * c[3] / terra).toFixed(1) + '%');
  assert(c[4] / terra >= .04 && c[4] / terra <= .2, 'monti: ' + (100 * c[4] / terra).toFixed(1) + '%');
  assert(c[4] >= c[3] * .2, 'pochi monti rispetto alle colline, seme ' + seme);
  // la neve sta sui rilievi, non in pianura; la terra non è un quadrato (angoli del riquadro in mare)
  for (let i = 0; i < N; i++) if (M.B[i] === 1) assert(M.T[i] >= 3, 'neve in pianura');
  for (const [x, y] of [[20, 20], [G - 21, 20], [20, G - 21], [G - 21, G - 21]]) assert.strictEqual(M.T[y * G + x], 0, 'terra negli angoli, seme ' + seme);
  // i castelli guardano ponti e passi (almeno un passo per dorsale)
  const guardia = (x, y) => Math.min(...M.luoghi.filter(l => l.tipo === 'castello').map(l => Math.hypot(l.x - x, l.y - y)));
  for (const p of M.P) assert(guardia(p.x, p.y) <= raggio, 'ponte senza castello vicino: ' + guardia(p.x, p.y).toFixed(1) + ', seme ' + seme);
  for (const ch of M.catene) assert(Math.min(...ch.passi.map(p => guardia(p[0] + .5, p[1] + .5))) <= raggio, 'dorsale senza un passo guardato, seme ' + seme);
}
}
module.exports = { verifica, impronta, nuovoCtx };
if (require.main === module) {
verifica(SEMI.slice(0, 6));

// stesso seme, stessa mappa (anche in un altro contesto, come su un altro telefono)
{
  const b = nuovoCtx().VGEO; for (const seme of [100, 4242]) assert.strictEqual(impronta(b.genera(seme, { mondo: 'ampio' })), impronta(VGEO.genera(seme, { mondo: 'ampio' })), 'mappa diversa a parità di seme');
  assert.notStrictEqual(impronta(VGEO.genera(100, { mondo: 'ampio' })), impronta(VGEO.genera(101, { mondo: 'ampio' })));
  assert.strictEqual(VGEO.genera(7, { mondo: 'ampio' }), VGEO.genera(7, { mondo: 'ampio' }), 'cache per seme e grandezza');
  assert.notStrictEqual(VGEO.genera(7, { mondo: 'ampio' }), VGEO.genera(7, { mondo: 'vasto' }));
}
// il vasto ha 240 celle (il tempo di generazione si misura in test_ven_p07_lento.js)
assert.strictEqual(VGEO.genera(1, { mondo: 'vasto' }).G, 240);
// salvataggi vecchi e mondi senza geo: mappaDi dà la mappa di oggi
{
  const s0 = { seme: 29 }; assert.strictEqual(VEN.mappaDi(s0), VEN.mappa(29)); assert.strictEqual(VEN.mappaDi(s0).G, 128);
  const v = VEN.nuovo(29); assert(!v.geo); assert.strictEqual(VEN.mappaDi(v).G, 128);
}
// un mondo nuovo si gioca: si crea, si muove, passano i giorni
{
  const { VEN: V } = nuovoCtx(), s = V.nuovo(5, { opz: { geo: 2, mondo: 'ampio' } });
  assert.strictEqual(s.geo, 2); const M = V.mappaDi(s); assert.strictEqual(M.G, 192); assert(V.passa(M, V.TU(s).x, V.TU(s).y));
  s.tregua = 1e9; const r = V.ordina(s, { t: 'vai', x: M.luoghi.find(l => l.tipo === 'citta').x, y: M.luoghi.find(l => l.tipo === 'citta').y }); assert(!r.err, r.err);
  const x0 = V.TU(s).x, y0 = V.TU(s).y; for (let k = 0; k < 600 && V.TU(s).via.length; k++) V.passo(s, 1);
  assert(Math.hypot(V.TU(s).x - x0, V.TU(s).y - y0) > 3, 'la compagnia non si è mossa');
  for (let g = 0; g < 4; g++) V.passo(s, 1440); assert(V.passa(M, V.TU(s).x, V.TU(s).y));
  JSON.stringify(V.salva(s));
}
// viaggio: fiume lento, ponte più svelto, passo lento
{
  const s = { seme: 100, geo: 2 }, M = VEN.mappaDi(s); assert.strictEqual(M.G, 192);
  const m = i => VEN.molt(s, 'marcia', { p: null, i });
  const liscia = M.T.findIndex((t, i) => t === 1 && !M.F[i] && !M.S[i] && !M.PS[i]); const sc = .6 * 192 / 128;
  assert(Math.abs(m(liscia) - sc) < 1e-9);
  const fiume = M.F.findIndex((f, i) => f > 0 && !M.PN[i]); assert(Math.abs(m(fiume) - sc * .35) < 1e-9);
  const ponte = M.PN.indexOf(1), guado = M.PN.indexOf(2);
  assert(ponte >= 0, 'nel seme 100 c\'è almeno un ponte'); assert(guado >= 0, 'nel seme 100 c\'è almeno un guado');
  assert(M.P.some(p => p.t === 'ponte') && M.P.some(p => p.t === 'guado'));
  assert(Math.abs(m(ponte) - sc * .9 * .72) < 1e-9, 'ponte'); assert(Math.abs(m(guado) - sc * .9 * .72) < 1e-9, 'guado');
  assert(m(ponte) > m(fiume) * 1.5, 'il ponte è più svelto del fiume');
  const passo = M.PS.findIndex(v => v); assert(Math.abs(m(passo) - sc * .7) < 1e-9);
  assert.strictEqual(VEN.molt({ seme: 100 }, 'marcia', { p: null, i: fiume }), 1, 'nei mondi vecchi nulla cambia');
}
console.log('test_ven_p07 ok (6 semi)');
}
