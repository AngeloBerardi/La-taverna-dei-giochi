// Passo 44: gli incontri del crocevia (28kq, solo mondi `s.geo===2`). Prove rapide; la partita lunga è in test_ven_p44_lento.js.
//  (a) le condizioni di casella: un incrocio vero, una strada senza incrocio, un bosco lontano, un bosco vicino a un villaggio;
//  (b) condizioni di scena: notte, compagni, regno; (c) effetti: uomini, viveri, merce, gusto; (d) due scene non a meno di 2 giorni;
//  (e) mondo vecchio (30 giorni di bot): nessuno stato `croc`; i salvataggi di tests/fixture/ven/ si aprono.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D, VVOC } = carica.multi(F, '({ VEN, VDAT, VVOC })');
const C = D.CROCEVIA, mondo = seme => V.nuovo(seme, { opz: { geo: 2 } });
const cella = (M, i) => { const G = M.G || 128; return [i % G + .5, Math.floor(i / G) + .5]; };
const vicini = (M, i) => { const G = M.G || 128, cx = i % G, cy = (i - cx) / G; let n = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if ((a || b) && cx + a >= 0 && cy + b >= 0 && cx + a < G && cy + b < G && M.S[(cy + b) * G + cx + a]) n++; return n; };
const metti = (s, x, y) => { const tu = V.TU(s); tu.x = x; tu.y = y; tu.via = [1]; tu.ord = null; s.dentro = -1; s.incontro = null; };
const dalluogo = (s, x, y) => Math.min(...s.l.map(l => V.dist(l, { x, y })));
// cerca nel mondo le quattro caselle di prova
function caselle(s) {
  const M = V.mappaDi(s), N = M.T.length, r = {};
  for (let i = 0; i < N; i++) {
    const [x, y] = cella(M, i), d = dalluogo(s, x, y);
    if (M.S[i]) { const n = vicini(M, i); if (n >= C.VICINI && !r.incrocio) r.incrocio = [x, y]; if (n < C.VICINI && n > 0 && !r.strada) r.strada = [x, y]; }
    else if ((M.T[i] === 2 || M.T[i] === 4) && M.ok[i] === 1) {
      if (d >= C.LONTANO + 1 && !r.lontano) r.lontano = [x, y];
      if (d < 3 && d > 1 && !r.vicino && M.T[i] === 2) r.vicino = [x, y];
    }
  }
  return r;
}
{
  const s = mondo(3), c = caselle(s);
  for (const k of ['incrocio', 'strada', 'lontano', 'vicino']) assert(c[k], 'casella ' + k);
  const t = k => { metti(s, c[k][0], c[k][1]); return V.croceviaQui(s); };
  assert.strictEqual(t('incrocio'), 'incrocio'); assert.strictEqual(t('strada'), null, 'una strada senza incrocio');
  assert.strictEqual(t('lontano'), 'selvaggio'); assert.strictEqual(t('vicino'), null, 'un bosco vicino a un villaggio');
  assert.strictEqual(V.croceviaQui(V.nuovo(3)), null, 'mondo vecchio');
}
// prova una casella: per tante ore (con la memoria azzerata) raccoglie le scene accodate
function scene(s, pos, ore, prima) {
  metti(s, pos[0], pos[1]); const viste = new Set();
  for (let k = 0; k < ore; k++) { s.croc = null; s.voci = []; s.rac.scena = null; if (prima) prima(s); V.ganci('vedi', s); for (const q of s.voci) viste.add(q.id); }
  return viste;
}
const giornoPieno = s => { s.t = 2 * 1440 + 720; return s; };
// ---- (b) condizioni di scena ----
{
  const s = giornoPieno(mondo(3)), c = caselle(s), tu = V.TU(s), CRO = Object.fromEntries(VVOC.CROCEVIA.map(v => [v.id, v]));
  const sel = scene(s, c.lontano, 800); assert(sel.size >= 4, 'scene nel selvaggio: ' + sel.size);
  for (const id of sel) { assert(CRO[id].blocco === 'B', id + ' nel selvaggio è del blocco B'); assert(CRO[id].se.notte !== true, id + ' è di notte'); }
  const inc = scene(s, c.incrocio, 800); assert(inc.size >= 4); for (const id of inc) { assert(CRO[id].blocco === 'A', id); assert(CRO[id].se.notte !== true, id); }
  const notte = scene(giornoPieno(mondo(3)), c.lontano, 800, t => { t.t = 2 * 1440 + 60; }); assert([...notte].some(id => CRO[id].se.notte === true), 'di notte arrivano le scene notturne');
  // compagni: con Lapo in compagnia arrivano le scene che lo chiedono, senza no
  const conLapo = id => (CRO[id].se.con || []).includes('co_lapo');
  assert(![...inc].some(id => (CRO[id].se.con || []).length), 'senza compagni nessuna scena che li chiede');
  tu.tr.push({ t: 'co_lapo', n: 1, f: 0, xp: 0 });
  for (const f of V.regni(s)) for (const g of V.regni(s)) if (f < g) s.guerra[V._.chiave(f, g)] = 1; // tutti in guerra: arrivano anche le scene di guerra
  const l2 = scene(s, c.incrocio, 1500); assert([...l2].some(conLapo), 'con Lapo: mendicanti'); assert([...l2].every(id => !(CRO[id].se.con || []).length || (CRO[id].se.con || []).some(x => x === 'co_lapo')), 'solo quelle di Lapo');
  // regno: `nemico` solo in terra nemica
  const qui = id => VVOC.CROCEVIA.find(v => v.id === id);
  const reg = scene(s, c.incrocio, 1500);
  const nem = [...reg].filter(id => qui(id).se.regno === 'nemico');
  let faz = null, bd = 1e9; for (const l of s.l) if (V.MURA[l.tipo]) { const d = V.dist(l, V.TU(s)); if (d < bd) { bd = d; faz = l.faz; } }
  const ostile = faz !== 'tu' && faz !== V._.lato(s) && V.nemiche(s, V._.lato(s), faz);
  assert.strictEqual(nem.length > 0, !!ostile, 'scene di terra nemica solo se il regno è nemico (' + faz + ')');
}
// ---- (c) effetti ----
{
  const s = mondo(5), tu = V.TU(s), eff = e => V.ganci('effetto', s, Object.assign({ t: 'ven' }, e)), tot = () => tu.tr.filter(e => /_f1$/.test(e.t)).reduce((a, e) => a + e.n, 0);
  const c = caselle(s); metti(s, c.incrocio[0], c.incrocio[1]);
  let n0 = tot(); eff({ k: 'uomini', n: 3 }); assert.strictEqual(tot() - n0, 3, 'tre reclute');
  const da = V.limite(s) - V.uomini(tu); aggiungiPieno(da - 1);
  n0 = tot(); eff({ k: 'uomini', n: 3 }); assert.strictEqual(tot() - n0, 1, 'oltre il limite meno'); assert.strictEqual(V.uomini(tu), V.limite(s));
  function aggiungiPieno(k) { if (k > 0) V._.aggiungi(tu.tr, tu.tr.find(e => /_f1$/.test(e.t)).t, k); }
  { // mai compagni: con un compagno e meno reclute del tolto, il compagno resta
    const r = tu.tr.filter(e => /_f1$/.test(e.t)); for (const e of r) e.n = 0; tu.tr = tu.tr.filter(e => e.n > 0 || !/_f1$/.test(e.t));
    tu.tr.push({ t: 'co_lapo', n: 1, f: 0, xp: 0 }); V._.aggiungi(tu.tr, r[0].t, 2);
    eff({ k: 'uomini', n: -5 }); assert(tu.tr.some(e => e.t === 'co_lapo' && e.n === 1), 'il compagno resta');
    assert.strictEqual(tu.tr.filter(e => /_f1$/.test(e.t)).reduce((a, e) => a + e.n, 0), 0, 'tolte solo le reclute');
    tu.tr = tu.tr.filter(e => e.t !== 'co_lapo'); V._.aggiungi(tu.tr, r[0].t, 10);
  }
  const prima = V.uomini(tu); eff({ k: 'uomini', n: -2 }); assert.strictEqual(V.uomini(tu), prima - 2);
  tu.merci = { grano: 5 }; eff({ k: 'viveri', n: -8 }); assert.strictEqual(tu.merci.grano || 0, 0, 'mai sotto zero');
  eff({ k: 'viveri', n: 4 }); assert.strictEqual(tu.merci.grano, 4);
  tu.merci = {}; eff({ k: 'merce', m: 'velluto', n: 9999 }); assert.strictEqual(V.carico(tu), V.caricoMax(s), 'merce oltre il carico si ferma');
  eff({ k: 'merce', m: 'velluto', n: -9999 }); assert.strictEqual(V.carico(tu), 0);
  eff({ k: 'merce', m: 'grano', n: 3 }); assert.strictEqual(V.carico(tu), 0, 'il grano non è merce');
  assert(s.log.some(x => /reclut/.test(x.tx)) && s.log.some(x => /grano/.test(x.tx)), 'righe nel diario');
  tu.tr.push({ t: 'co_lapo', n: 1, f: 0, xp: 0 }); V.gradDi(s, 'co_lapo'); const g0 = V.gradDi(s, 'co_lapo').g; eff({ k: 'gusto', ev: 'cura' });
  assert.strictEqual(V.gradDi(s, 'co_lapo').g - g0, 6, 'Lapo approva la cura'); assert(s.log.some(x => /approva/.test(x.tx)));
}
// ---- (d) distanza tra due scene, nessuna ripetuta entro 30 giorni ----
{
  const s = mondo(11), c = caselle(s); metti(s, c.incrocio[0], c.incrocio[1]); s.rac.scena = null;
  let ult = null; const quando = [], visto = {};
  for (let k = 0; k < 40 * 24; k++) {
    s.t += 60; s.voci = []; metti(s, c.incrocio[0], c.incrocio[1]); V.ganci('vedi', s);
    if (s.voci.length) { assert(!ult || s.t - ult >= C.OGNI * 1440, 'a meno di 2 giorni'); ult = s.t; const g = V.giorno(s), id = s.voci[0].id; assert(!(visto[id] != null && g - visto[id] < C.MEMORIA), id + ' ripetuta'); visto[id] = g; quando.push(s.t); }
  }
  assert(quando.length >= 5, 'scene in 40 giorni: ' + quando.length);
}
// ---- (e) mondo vecchio e salvataggi ----
{
  const s = V.nuovo(3), tu = V.TU(s);
  const gioca = require('./bot_ven.js')(V, D); let x0 = 7; const r = () => { x0 = (x0 * 1103515245 + 12345) % 2147483648; return x0 / 2147483648; };
  gioca(s, 30, true, r);
  assert(!s.croc && !s.voci.length, 'nessuna scena nei mondi vecchi');
  const dir = path.join(__dirname, 'fixture/ven'); let n = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) { const t = V.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(t, f); V.passo(t, 600); assert(!t.croc, f); n++; }
  assert(n >= 6, 'salvataggi aperti: ' + n);
}
console.log('test_ven_p44: ok');
