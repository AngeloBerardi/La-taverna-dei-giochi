// Passo 23: molti regni alla nascita. Nei mondi nuovi (s.geo===2) un regno per città (9–10 nel mondo ampio, 11–12 nel vasto), ognuno di una
// delle cinque culture; territori per costo minimo dai capoluoghi, signori divisi tra i regni della loro cultura, due guerre tra confinanti.
// Nei mondi vecchi nulla cambia (l'impronta la controlla tools/avventura/impronta.js --controlla). I 30 giorni di gioco sono in test_ven_p23_lento.js.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const nuovoCtx = (files = F) => carica.multi(files, '({ VEN, VDAT })');
const { VEN: V, VDAT: D } = nuovoCtx();
const SEMI = [['ampio', [3, 5, 11, 29, 58, 77]], ['vasto', [2, 7, 13, 40]]];
const NUM = { ampio: [9, 10], vasto: [11, 12] };
const MURA = { citta: 1, castello: 1 };
const eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);   // oggetti di un altro contesto: si confrontano come JSON
const cellaDi = (M, l) => Math.floor(l.y) * M.G + Math.floor(l.x);

for (const [mondo, semi] of SEMI) for (const seme of semi) {
  const s = V.nuovo(seme, { opz: { geo: 2, mondo } }), M = V.mappaDi(s), dove = 'seme ' + seme + ' (' + mondo + ')';
  const ids = V.regni(s), citta = s.l.filter(l => l.tipo === 'citta');
  // quanti regni, e ogni città capoluogo di un solo regno; ogni regno ha esattamente una città
  assert(ids.length >= NUM[mondo][0] && ids.length <= NUM[mondo][1], ids.length + ' regni, ' + dove);
  assert.strictEqual(ids.length, citta.length, 'un regno per città, ' + dove);
  eq(ids, citta.map((c, k) => 'r' + k), 'id dei regni in ordine di città, ' + dove);
  const capi = ids.map(id => s.rg[id].capo);
  assert.strictEqual(new Set(capi).size, ids.length, 'capoluoghi diversi, ' + dove);
  for (const c of citta) assert.strictEqual(capi.filter(x => x === c.id).length, 1, c.nome + ' capoluogo di un solo regno, ' + dove);
  for (const id of ids) {
    const r = V.rg(s, id), mie = citta.filter(c => c.faz === id);
    assert.strictEqual(mie.length, 1, id + ' ha ' + mie.length + ' città, ' + dove);
    assert.strictEqual(r.breve, mie[0].nome); assert(r.nome.endsWith(' ' + mie[0].nome), r.nome);
    assert(/^(Signoria|Marca|Comune|Principato|Libera città) di /.test(r.nome), r.nome);
    assert.strictEqual(V.cult(s, id), s.rg[id].cult); assert(D.REGNI.includes(r.cult), 'cultura ' + r.cult);
    assert(/^#[0-9a-f]{6}$/.test(r.col) && /^#[0-9a-f]{6}$/.test(r.col2), r.col + ' ' + r.col2);
    assert(!r.ignota && s.rg[id].vivo === true && s.rg[id].nato === 0);
  }
  // ogni cultura ha almeno un regno; ogni regno un solo re; i signori sono 25
  for (const f of D.REGNI) assert(ids.some(id => V.cult(s, id) === f), 'cultura ' + f + ' senza regni, ' + dove);
  assert.strictEqual(s.sig.length, 25, 'signori: ' + s.sig.length);
  for (const id of ids) {
    const re = s.sig.filter(g => g.faz === id && g.re), tutti = s.sig.filter(g => g.faz === id);
    assert.strictEqual(re.length, 1, id + ' ha ' + re.length + ' re, ' + dove); assert.strictEqual(s.rg[id].re, re[0].nome);
    assert(tutti.length >= 1 && tutti.length <= 5, id + ': ' + tutti.length + ' signori');
    assert.strictEqual(s.l[re[0].casa].id, s.rg[id].capo, 'il re sta nel capoluogo');
  }
  for (const g of s.sig) {
    const p = s.p.find(x => x.id === g.pid), casa = s.l[g.casa];
    assert(ids.includes(g.faz) && g.cult === V.cult(s, g.faz), 'cultura del signore');
    assert(MURA[casa.tipo] && casa.faz === g.faz, 'la casa è un luogo murato del regno');
    assert(p && p.faz === g.faz && p.dentro === casa.id && p.x === casa.x && p.y === casa.y, 'la schiera del signore');
    assert(p.tr.every(e => e.t.startsWith(g.cult + '_')), 'truppe della cultura');
  }
  for (const p of s.p) if (p.k === 'car') assert.strictEqual(p.faz, s.l[p.casa].faz, 'carovana del regno della sua casa');
  // territori: ogni luogo di un regno sta nel suo territorio ed è raggiungibile dal capoluogo senza uscirne
  const T = V.mappaRegni(s), G = M.G;
  eq(T.ids, ids);
  for (let k = 0; k < ids.length; k++) {
    const capo = cellaDi(M, s.l[s.rg[ids[k]].capo]), vis = new Uint8Array(G * G), q = [capo]; vis[capo] = 1;
    for (let j = 0; j < q.length; j++) { const c = q[j], x = c % G, y = (c - x) / G;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const nx = x + ox, ny = y + oy; if (nx < 0 || ny < 0 || nx >= G || ny >= G) continue; const i = ny * G + nx; if (!vis[i] && T.chi[i] === k) { vis[i] = 1; q.push(i); } } }
    for (const l of s.l.filter(l => l.faz === ids[k])) { assert.strictEqual(T.chi[cellaDi(M, l)], k, l.nome + ' fuori dal territorio, ' + dove); assert(vis[cellaDi(M, l)], l.nome + ' non raggiungibile nel suo regno, ' + dove); }
  }
  // nessun luogo di cultura resta: ogni luogo di un regno porta l'id del regno, covi e rovine non cambiano
  for (const l of s.l) assert(!D.REGNI.includes(l.faz), l.nome + ' è ancora di ' + l.faz);
  for (const l of s.l) if (l.tipo === 'covo') assert.strictEqual(l.faz, 'pre'); else if (l.tipo === 'rovine' || l.tipo === 'monastero' || l.tipo === 'locanda') assert.strictEqual(l.faz, 'neu');
  for (const l of s.l) if (l.capo >= 0 && ids.includes(l.faz)) assert.strictEqual(s.l[l.capo].faz, l.faz, 'il capo di ' + l.nome + ' è del suo regno');
  // due regni confinanti hanno colori diversi; le due guerre sono tra confinanti; s.rel sugli id nuovi
  const conf = T.confini.map(([a, b]) => a < b ? a + '|' + b : b + '|' + a);
  assert(conf.length >= ids.length - 1, 'confini: ' + conf.length);
  for (const [a, b] of T.confini) assert.notStrictEqual(V.rg(s, a).col, V.rg(s, b).col, a + ' e ' + b + ' confinano con lo stesso colore, ' + dove);
  const guerre = Object.keys(s.guerra);
  assert.strictEqual(guerre.length, 2, 'due guerre'); for (const g of guerre) { const [a, b] = g.split('|'); assert(conf.includes(a < b ? a + '|' + b : b + '|' + a), 'guerra tra non confinanti: ' + g); }
  eq(Object.keys(s.rel).sort(), ids.slice().sort()); assert(ids.every(id => s.rel[id] === 0));
}

// stesso seme, stesso mondo (anche in un altro contesto, come su un altro telefono)
{
  const B = nuovoCtx().VEN, a = V.salva(V.nuovo(17, { opz: { geo: 2, mondo: 'ampio' } })), b = B.salva(B.nuovo(17, { opz: { geo: 2, mondo: 'ampio' } }));
  assert.strictEqual(a, b, 'mondi diversi a parità di seme');
}
// mondi vecchi: nessun s.rg, i cinque regni di sempre, la cultura è l'id
{
  const s = V.nuovo(3); assert(!('rg' in s)); eq(V.regni(s), D.REGNI);
  for (const f of D.REGNI.concat(['tu', 'neu', 'r0'])) assert.strictEqual(V.cult(s, f), f);
  assert.strictEqual(V.rg(s, 'val').nome, D.FAZ.val.nome); assert.strictEqual(V.mappaRegni(s), null);
  // in un mondo nuovo le culture restano leggibili per le truppe
  const n = V.nuovo(3, { opz: { geo: 2 } }); assert.strictEqual(V.rg(n, 'val').nome, D.FAZ.val.nome); assert.strictEqual(V.cult(n, 'val'), 'val');
}
// tempo: il gancio `nuovo` costa al più il 30% di VEN.nuovo a mappa già in cache (mediana di 5 semi; senza 28ki per confronto)
{
  const B = nuovoCtx(F.filter(f => f !== '28ki-ven-regni.js')).VEN, semi = [11, 12, 13, 14, 15], o = { opz: { geo: 2, mondo: 'ampio' } };
  for (const sm of semi) { V.nuovo(sm, o); B.nuovo(sm, o); }
  const tm = (X, sm) => { let b = 1e9; for (let k = 0; k < 15; k++) { const t = process.hrtime.bigint(); X.nuovo(sm, o); b = Math.min(b, Number(process.hrtime.bigint() - t) / 1e6); } return b; };
  const quote = semi.map(sm => { const a = tm(V, sm), b = tm(B, sm); return Math.max(0, a - b) / a; }).sort((x, y) => x - y);
  console.log('gancio nuovo / VEN.nuovo, mediana di cinque: ' + (quote[2] * 100).toFixed(0) + '% (' + quote.map(v => (v * 100).toFixed(0)).join(', ') + ')');
  assert(quote[2] <= .3, 'gancio troppo lento: ' + (quote[2] * 100).toFixed(0) + '%');
}
console.log('test_ven_p23 ok (6 semi ampi, 4 vasti)');
