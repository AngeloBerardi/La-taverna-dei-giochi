// Passo 42: i testi degli incontri del crocevia e le lettere dell'adunata (solo dati in VVOC).
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const X = carica.multi(F, '({ VEN, VDAT, ARAC, VVOC })'), V = X.VEN, D = X.VDAT, R = X.ARAC, VV = X.VVOC;

// marchi: elenco di tests/test_avv_corona.js (riga 23), più due titoli del genere
const marchi = [/\bCatan\b/i, /\bUNO\b/, /Dungeons|Pathfinder|Baldur|Tolkien|Hobbit|Gandalf|Skyrim|Witcher|Zelda|Warcraft|Hearthstone|Diablo/i, /Bannerlord/i, /\bMount\b/];
const GUSTI = ['libera', 'cura', 'razzia', 'perdite', 'tributo', 'fuga', 'riscatta', 'sito', 'fame', 'vittoria'];
const SE = ['bioma', 'regno', 'guerra', 'notte', 'fama', 'con'];
const CO = new Set(D.COMPAGNI.map(c => c.id));

// le trenta voci
const CR = VV.CROCEVIA;
assert(Array.isArray(CR) && CR.length === 30, '30 voci in CROCEVIA');
assert.strictEqual(new Set(CR.map(v => v.id)).size, 30, 'nessun doppione');
const A = CR.filter(v => v.blocco === 'A'), B = CR.filter(v => v.blocco === 'B');
assert.strictEqual(A.length, 15); assert.strictEqual(B.length, 15);
assert(CR.slice(0, 15).every(v => v.blocco === 'A') && CR.slice(15).every(v => v.blocco === 'B'), 'nell\'ordine dei blocchi');
const nomiA = ['pellegrino', 'ponte', 'disertore', 'mercante', 'fiamme', 'carro', 'gabella', 'messo', 'processione', 'forca', 'giocolieri', 'vedova', 'mendicanti', 'cavallo', 'fiera'];
const nomiB = ['lupi', 'eremita', 'bracconiere', 'carbonai', 'cassa', 'bivacco', 'frana', 'nebbia', 'sorgente', 'orso', 'legato', 'imboscata', 'cacciatori', 'santuario', 'fuggiaschi'];
assert.strictEqual(JSON.stringify(A.map(v => v.id).sort()), JSON.stringify(nomiA.map(n => "cro-" + n).sort()));
assert.strictEqual(JSON.stringify(B.map(v => v.id).sort()), JSON.stringify(nomiB.map(n => "cro-" + n).sort()));

let nG = 0, nN = 0, nC = 0, nR = 0, nBnotte = 0;
for (const v of CR) {
  assert(VV.scene[v.id], 'scena mancante ' + v.id); assert(VV.ingressi.includes(v.id));
  assert(Number.isInteger(v.peso) && v.peso >= 1 && v.peso <= 3, v.id + ': peso');
  const se = v.se || {};
  for (const k of Object.keys(se)) assert(SE.includes(k), v.id + ': condizione sconosciuta ' + k);
  if (se.bioma) assert(Array.isArray(se.bioma) && se.bioma.length && se.bioma.every(b => ['strada', 'bosco', 'monte'].includes(b)), v.id + ': bioma');
  if (se.regno != null) assert(['tuo', 'amico', 'nemico'].includes(se.regno), v.id + ': regno');
  for (const k of ['guerra', 'notte']) if (se[k] != null) assert(typeof se[k] === 'boolean', v.id + ': ' + k);
  if (se.fama) assert(Array.isArray(se.fama) && se.fama.length === 2 && se.fama[0] <= se.fama[1], v.id + ': fama');
  if (se.con) assert(Array.isArray(se.con) && se.con.length && se.con.every(c => CO.has(c)), v.id + ': con');
  if (v.blocco === 'A') assert(se.bioma.includes('strada'), v.id + ': strada');
  else { assert(se.bioma.length && se.bioma.every(b => b === 'bosco' || b === 'monte'), v.id + ': selvaggio'); if (se.notte !== false) nBnotte++; }
  if (se.guerra === true) nG++; if (se.notte === true) nN++; if (se.con) nC++; if (se.regno === 'nemico') nR++;
}
assert(nG >= 6 && nN >= 4 && nC >= 5 && nR >= 3, 'conteggi minimi: guerra ' + nG + ', notte ' + nN + ', con ' + nC + ', nemico ' + nR);
assert(nBnotte >= 7, 'metà del blocco B anche di notte: ' + nBnotte);

// forma delle scene ed effetti
const effetti = [];
for (const v of CR) {
  const sc = VV.scene[v.id], nodi = Object.values(sc.nodi);
  assert(nodi.length >= 1 && nodi.length <= 2, v.id + ': 1–2 nodi');
  for (const nd of nodi) {
    assert.strictEqual(nd.chi, '_', v.id + ': parla il narratore');
    assert(nd.testo.length <= 280, v.id + ': nodo di ' + nd.testo.length);
    const sc2 = nd.scelte || []; assert(sc2.length >= 2 && sc2.length <= 3, v.id + ': 2–3 scelte');
    assert(sc2.some(c => !c.se), v.id + ': una scelta sempre possibile');
    for (const c of sc2) {
      assert(c.t.length <= 80, v.id + ': scelta lunga «' + c.t + '»');
      assert(c.fine === true || (c.vai && sc.nodi[c.vai]), v.id + ': la scelta finisce o va al secondo nodo');
      const g = (c.effetti || []).filter(e => e.t === 'ven' && e.k === 'gusto');
      assert(g.length >= 1 && g.every(e => GUSTI.includes(e.ev)), v.id + ': ogni scelta con un gusto ammesso');
      const paga = (c.effetti || []).filter(e => e.t === 'oro' && e.n < 0).reduce((a, e) => a - e.n, 0);
      if (paga) assert(c.se && c.se.oro >= paga, v.id + ': chi paga chiede le monete');
      for (const e of c.effetti || []) effetti.push([v.id, e]);
    }
  }
}
const intero = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
for (const [id, e] of effetti) {
  if (e.t === 'oro') { assert(intero(e.n, -80, 120), id + ': oro ' + e.n); continue; }
  assert.strictEqual(e.t, 'ven', id + ': effetto ' + e.t); assert(V.EFF_VOCI.includes(e.k), id + ': ' + e.k);
  assert(['grad', 'conf', 'uomini', 'merce', 'viveri', 'gusto'].includes(e.k), id + ': effetto non ammesso ' + e.k);
  if (e.k === 'uomini') assert(intero(e.n, 1, 4) || e.n === -1 || e.n === -2, id + ': uomini ' + e.n);
  if (e.k === 'merce') { assert(D.MERCI[e.m] && !D.MERCI[e.m].cibo, id + ': merce ' + e.m); assert(intero(e.n, -6, 6) && e.n, id + ': merce ' + e.n); }
  if (e.k === 'viveri') assert(intero(e.n, -8, 8) && e.n, id + ': viveri ' + e.n);
}
// tutti i gesti ci sono almeno una volta
for (const g of GUSTI) assert(effetti.some(([, e]) => e.k === 'gusto' && e.ev === g), 'gusto mai usato: ' + g);

// lettere dell'adunata
const conv = VV.scene['adunata-convoca'], feu = VV.scene['adunata-feudo'];
assert(conv && feu, 'lettere dell\'adunata');
assert.strictEqual(Object.keys(conv.nodi).length, 1); assert.strictEqual(conv.nodi.a.chi, 'signore');
assert.strictEqual(JSON.stringify(conv.nodi.a.scelte.map(c => [c.t, c.effetti[0].k, c.effetti[0].v])), JSON.stringify([['Verrò.', 'adunata', 1], ['Non posso.', 'adunata', 0]]));
assert(/\{signore\}/.test(conv.nodi.a.testo) && conv.nodi.a.testo.length <= 280);
assert.strictEqual(Object.keys(feu.nodi).length, 1); assert(feu.nodi.a.chi === 'signore' && feu.nodi.a.fine === true && !feu.nodi.a.scelte);
assert(/feud|terre/.test(feu.nodi.a.testo) && feu.nodi.a.testo.length <= 280);

// testi: niente emoji né marchi
const testi = CR.concat([{ id: 'adunata-convoca' }, { id: 'adunata-feudo' }]).map(v => JSON.stringify(VV.scene[v.id])).join(' ');
for (const ch of testi) assert(ch.codePointAt(0) <= 0x2FFF, 'carattere vietato ' + ch);
for (const m of marchi) assert(!m.test(testi), 'marchio nei testi: ' + m);

// il capitolo resta valido
assert.strictEqual(JSON.stringify(R.valida(VV)), "[]");

// ogni scena si apre e ogni percorso si chiude (effetti nuovi passano al gancio, nessun errore)
{
  const J = x => JSON.parse(JSON.stringify(x));
  let percorsi = 0;
  const visita = (s, p) => { assert(p < 6); const v = V.voce(s); if (!v) { percorsi++; return; }
    if (v.continua) { const t = J(s); assert(!V.parla(t, { t: 'continua' }).err); visita(t, p + 1); return; }
    const aperte = v.scelte.filter(c => c.ok); assert(aperte.length, v.scena);
    for (const c of aperte) { const t = J(s); const r = V.parla(t, { t: 'scegli', i: c.i }); assert(!r.err, v.scena + ': ' + r.err); visita(t, p + 1); } };
  for (const id of CR.map(v => v.id).concat(['adunata-convoca', 'adunata-feudo'])) {
    for (const oro of [0, 500]) {
      const s = V.nuovo(7); s.tregua = 1e9; s.dentro = -1; s.davanti = -1; V.TU(s).oro = oro;
      assert(V.accoda(s, id), 'accoda ' + id); V.passo(s, 1); const v = V.voce(s); assert(v && v.scena === id, 'si apre ' + id);
      if (!oro && v.scelte && v.scelte.length) assert(v.scelte.some(c => c.ok), id + ': senza monete resta una scelta');
      visita(s, 0);
    }
  }
  assert(percorsi > 150, 'percorsi: ' + percorsi);
}
console.log('passo 42: 30 incontri del crocevia e 2 lettere dell\'adunata ok');
