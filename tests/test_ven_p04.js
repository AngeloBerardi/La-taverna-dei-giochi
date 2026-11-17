// Passo 04: ganci, punti d'estensione, interruttori e file vuoti della Compagnia di ventura. Il gioco non cambia
// (lo prova `node tools/avventura/impronta.js --controlla`): qui si prova che i ganci e i punti d'estensione fanno ciò che promettono.
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const carica = require('./carica.js');
const R = path.join(__dirname, '..');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
// ogni prova ha il suo mondo di codice: i ganci si registrano sull'oggetto VEN e non devono passare da una prova all'altra
const nuovoCtx = () => carica.multi(F, '({ VEN, VDAT, VCAM, VVOC })');
const ok = r => { assert(!r.err, r.err); return r; };
const J = x => JSON.stringify(x), eq = (a, b, m) => assert.strictEqual(J(a), J(b), m);
const quieto = s => { s.tregua = 1e9; s.dentro = -1; s.davanti = -1; return s; };

// i file nuovi stanno nel manifest, ognuno al suo posto
{
  const m = require('../src/manifest.json'), n = f => m.indexOf('src/js/motori/' + f);
  const dopo = (a, b) => assert(n(a) >= 0 && n(b) >= 0 && n(a) < n(b), a + ' va prima di ' + b);
  dopo('28ja-ven-voci.js', '28jb-ven-dati-campo.js'); dopo('28jb-ven-dati-campo.js', '28jc-ven-dati-mondo.js'); dopo('28jc-ven-dati-mondo.js', '28k-ven-mondo.js');
  const dopoKe = ['28kf-ven-anteprima.js', '28kg-ven-geografia.js', '28kh-ven-stagioni.js', '28ki-ven-regni.js', '28kj-ven-rango.js', '28kk-ven-strategia.js', '28kl-ven-sfida.js', '28km-ven-sorte.js',
    '28kn-ven-eserciti.js', '28ko-ven-feudi.js', '28kp-ven-affari.js', '28kq-ven-crocevia.js', '28kr-ven-accensioni.js'];
  dopo('28ke-ven-gente.js', dopoKe[0]); for (let i = 1; i < dopoKe.length; i++) dopo(dopoKe[i - 1], dopoKe[i]); dopo(dopoKe[dopoKe.length - 1], '28l-ven-campo.js');
  dopo('28l-ven-campo.js', '28la-ven-consiglio.js'); dopo('28la-ven-consiglio.js', '28m-ven-stanza.js');
}

// (a) due ascoltatori di `giorno` sono chiamati nell'ordine di registrazione
{
  const { VEN: V } = nuovoCtx(), s = V.nuovo(3), ordine = [];
  V.aggancia('giorno', x => { assert.strictEqual(x, s); ordine.push('primo'); });
  V.aggancia('giorno', () => { ordine.push('secondo'); });
  V.giornoNuovo(s);
  eq(ordine, ['primo', 'secondo']);
  // un ascoltatore che restituisce qualcosa non ferma quelli dopo: `ganci` li chiama tutti e ignora i valori; `chiedi` invece si ferma al primo risultato
  const W = nuovoCtx().VEN, t = W.nuovo(3), chiamati = [];
  W.aggancia('giorno', st => { chiamati.push(1); return 42; });
  W.aggancia('giorno', st => { chiamati.push(2); return st.t = st.t; });
  W.aggancia('giorno', st => { chiamati.push(3); });
  assert.strictEqual(W.ganci('giorno', t), undefined, 'ganci non restituisce nulla'); eq(chiamati, [1, 2, 3]);
  chiamati.length = 0; W.giornoNuovo(t); eq(chiamati, [1, 2, 3], 'anche dal giorno vero');
  const C = nuovoCtx().VEN, c2 = []; C.aggancia('x', () => { c2.push(1); }); C.aggancia('x', () => { c2.push(2); return 7; }); C.aggancia('x', () => { c2.push(3); return 8; });
  assert.strictEqual(C.chiedi('x'), 7, 'chiedi ritorna il primo risultato'); eq(c2, [1, 2], 'e non chiama gli altri'); assert.strictEqual(C.chiedi('nessuno'), undefined);
  // gli altri ganci di tempo: `ora` e `vedi` a ogni ora, `nuovo` in fondo a VEN.nuovo
  const viste = [], X = nuovoCtx().VEN;
  X.aggancia('nuovo', (st, o) => { viste.push('nuovo:' + st.seme + ':' + (o && o.nome)); });
  X.aggancia('ora', () => { viste.push('ora'); }); X.aggancia('vedi', () => { viste.push('vedi'); });
  const s2 = X.nuovo(5, { nome: 'Gaia' }); quieto(s2); s2.tregua = 0; s2.p.length = 1; X.passo(s2, 120);
  eq(viste, ['nuovo:5:Gaia', 'ora', 'vedi'].concat(viste.slice(3)), 'nuovo prima, poi ora e vedi');
  assert(viste.filter(x => x === 'ora').length >= 1 && viste.filter(x => x === 'vedi').length === viste.filter(x => x === 'ora').length);
}

// (b) `scheda`: un ascoltatore che aggiunge un campo lo ritrova in VEN.campo; uno che restituisce un oggetto sostituisce la scheda
{
  const { VEN: V } = nuovoCtx(), s = quieto(V.nuovo(3)), pre = s.p.find(p => p.k === 'pre');
  s.incontro = { tipo: 'nemico', pid: [pre.id], all: [], da: 'loro' };
  const base = V.campo(s);
  assert(base && base.a.length && base.b.length && base.prova === undefined);
  V.aggancia('scheda', (st, sc) => sc.uno = 1);
  V.aggancia('scheda', (st, sc) => { sc.prova = 7; });
  assert.strictEqual(V.campo(s).prova, 7, 'il campo aggiunto è nella scheda');
  assert.strictEqual(V.campo(s).uno, 1, 'un valore che non è un oggetto non ferma gli ascoltatori dopo');
  assert.strictEqual(V.campo(s).b.length, base.b.length, 'il resto della scheda non cambia');
  V.aggancia('scheda', () => ({ duello: true }));
  eq(V.campo(s), { duello: true }, 'un oggetto restituito sostituisce la scheda');
  eq(V.scegli(s, 'attacca').campo, { duello: true }, 'anche chi chiede il campo da `scegli`');
}

// (c) `esito`: se un ascoltatore restituisce un risultato, l'esito normale è saltato
{
  const { VEN: V } = nuovoCtx(), s = quieto(V.nuovo(3)), pre = s.p.find(p => p.k === 'pre');
  s.incontro = { tipo: 'nemico', pid: [pre.id], all: [], da: 'loro' };
  const morti = V.uomini(V.TU(s)), vinte = s.stat.vinte;
  let visto = null;
  V.aggancia('esito', (st, riep) => { visto = riep; return { s: st, out: { duello: 1 } }; });
  const r = V.esito(s, { vince: 'a', cad: [], uccisi: 0 });
  eq(r.out, { duello: 1 });
  eq(visto, { vince: 'a', cad: [], uccisi: 0 });
  assert(s.incontro, 'l\'incontro è ancora aperto: l\'esito normale non è stato fatto');
  assert.strictEqual(s.stat.vinte, vinte); assert.strictEqual(V.uomini(V.TU(s)), morti);
  // senza ascoltatori l'esito normale c'è
  const Y = nuovoCtx().VEN, t = quieto(Y.nuovo(3)); t.incontro = { tipo: 'nemico', pid: [t.p.find(p => p.k === 'pre').id], all: [], da: 'loro' };
  assert.strictEqual(ok(Y.esito(t, { vince: 'a', cad: [], uccisi: 0 })).out.vince, 'a'); assert.strictEqual(t.incontro, null);
  // `premio` e `battaglia`: il primo prima di applicare l'oro, il secondo in fondo
  const Z = nuovoCtx().VEN, u = quieto(Z.nuovo(3)), oro0 = Z.TU(u).oro, ev = [];
  u.incontro = { tipo: 'nemico', pid: [u.p.find(p => p.k === 'pre').id], all: [], da: 'loro' };
  Z.aggancia('premio', (st, riep, out) => { ev.push('premio'); out.oro += 1000; });
  Z.aggancia('battaglia', (st, riep, out) => { ev.push('battaglia'); assert(st.incontro, 'l\'incontro c\'è ancora'); });
  const o = ok(Z.esito(u, { vince: 'a', cad: [], uccisi: 0 })).out;
  eq(ev, ['premio', 'battaglia']); assert(o.oro >= 1000 && Z.TU(u).oro >= oro0 + 1000);
}

// (e) `VEN.regni(s)` di un mondo vecchio dà i cinque regni di oggi; `rg` e `cult` sono costruiti sopra
{
  const { VEN: V, VDAT: D } = nuovoCtx(), s = V.nuovo(3);
  eq(V.regni(s), ['val', 'sel', 'fer', 'mar', 'alt']); eq(V.regni(null), V.regni(s));
  eq(V.rg(s, 'val'), { id: 'val', nome: 'Regno di Valdoro', breve: 'Valdoro', col: D.FAZ.val.col, col2: D.FAZ.val.col2, re: 're Aldemaro', motto: D.FAZ.val.motto, cult: 'val' });
  for (const f of V.regni(s)) assert.strictEqual(V.cult(s, f), f);
  // un id sconosciuto ha la scheda di 'neu' con `ignota` (la vista ci mette il suo ripiego); uno noto non ha `ignota`
  assert.strictEqual(V.rg(s, 'xyz').ignota, true); assert.strictEqual(V.rg(s, 'xyz').col, D.FAZ.neu.col);
  for (const f of ['tu', 'neu', 'pre', 'fer']) assert.strictEqual(V.rg(s, f).ignota, undefined, f);
  { const pr = V.regni; V.regni = st => pr(st).concat(['nuo']); assert.strictEqual(V.rg(s, 'nuo').ignota, undefined, 'un regno nuovo di VEN.regni non è ignoto'); V.regni = pr; }
  assert.strictEqual(V.nomeF(s, 'sel'), 'Selvamara'); assert.strictEqual(V.nomeF(s, 'sel', true), 'Lega di Selvamara'); eq(V.colFaz(s, 'fer'), { col: D.FAZ.fer.col, col2: D.FAZ.fer.col2 });
  eq(V.fazioni(s), V.regni(s));
  // con la corona 'tu' è un regno tra gli altri
  s.corona = { nome: 'Regno di prova', stend: 0, da: 1, sede: 0, malc: 0, minacce: {} };
  eq(V.fazioni(s), V.regni(s).concat(['tu'])); assert.strictEqual(V.rg(s, 'tu').nome, 'Regno di prova'); assert.strictEqual(V.nomeF(s, 'tu'), 'Regno di prova');
  // un regno sostituito da un file successivo si vede in nomeF e colFaz
  const prima = V.rg; V.rg = (st, f) => f === 'val' ? Object.assign({}, prima(st, f), { breve: 'Rosso', col: '#111111' }) : prima(st, f);
  assert.strictEqual(V.nomeF(s, 'val'), 'Rosso'); assert.strictEqual(V.colFaz(s, 'val').col, '#111111');
}

// (f) gli interruttori sono tutti spenti
{
  const { VDAT: D } = nuovoCtx();
  eq(Object.keys(D.ACCESO).sort(), ['consiglio', 'eserciti', 'grandi', 'mondo2']);
  assert(Object.values(D.ACCESO).every(v => v === false), 'tutti spenti');
  eq(D.OPZ0, { diff: 'condottiero', eco: 'giusta', cons: 'normali', nem: 0, unif: 'normale', stag: 'normali', fer: 'normali', mondo: 'ampio', taglia: 'media', nebbia: false });
  eq(D.OPZ_PARTITA, ['taglia']);
  eq(Object.keys(D.PRESET), ['recluta', 'condottiero', 'leggenda']);
  eq(D.PRESET.condottiero, { eco: 'giusta', cons: 'normali', nem: 0, unif: 'normale', stag: 'normali', fer: 'normali' });
  for (const p of Object.values(D.PRESET)) assert(!('mondo' in p) && !('taglia' in p), 'i preset non toccano mondo e taglia');
  const T = D.DIFF; eq([T.mondo.ampio.lato, T.mondo.vasto.lato], [192, 240]); eq([T.taglia.piccola.uomini, T.taglia.media.uomini, T.taglia.grande.uomini], [40, 70, 110]);
  eq([T.eco.generosa.prezzo, T.eco.giusta.prezzo, T.eco.avara.prezzo], [.85, 1, 1.2]); eq([T.cons.leggeri.viveri, T.cons.duri.viveri], [.8, 1.25]);
  eq([T.nem['-1'].predoni, T.nem['1'].predoni], [.7, 1.4]); eq([T.unif.lenta.accorpa, T.unif.rapida.accorpa], [.6, 1.6]); eq([T.stag.miti.scarto, T.stag.rigide.scarto], [.5, 1.5]);
}

// (h) `VEN.opzione` cambia `taglia` e rifiuta le altre chiavi
{
  const { VEN: V } = nuovoCtx(), s = V.nuovo(3);
  assert.strictEqual(ok(V.opzione(s, { k: 'taglia', v: 'grande' })).s.opz.taglia, 'grande'); assert.strictEqual(V.opz(s).taglia, 'grande');
  for (const k of ['eco', 'cons', 'nem', 'unif', 'stag', 'fer', 'mondo', 'diff', 'nebbia', 'prova', '__proto__']) assert(V.opzione(s, { k, v: 'giusta' }).err, k + ' non si cambia in partita');
  assert(V.opzione(s, { k: 'taglia', v: 'enorme' }).err, 'valore sconosciuto'); assert(V.opzione(s, { k: 'taglia', v: 'constructor' }).err); assert(V.opzione(s, { k: 'taglia', v: {} }).err);
  assert.strictEqual(V.opz(s).taglia, 'grande', 'un rifiuto non cambia nulla');
}

// (j) `azione`, `fatto`, `effetto`
{
  const { VEN: V, VVOC: VV } = nuovoCtx(), s = quieto(V.nuovo(3)), citta = s.l.find(l => l.tipo === 'citta');
  s.dentro = citta.id;
  assert.strictEqual(V.fai(s, { a: 'prova' }).err, 'Azione sconosciuta', 'senza ascoltatori: azione sconosciuta');
  const fatti = [];
  V.aggancia('azione', (st, z) => z.a === 'prova' ? { s: st } : undefined);
  V.aggancia('azione', (st, z) => z.a === 'rifiuta' ? { err: 'No, grazie' } : undefined);
  V.aggancia('fatto', (st, z, r) => { fatti.push(z.a); assert(r.s); });
  assert.strictEqual(V.fai(s, { a: 'prova' }).s, s, 'l\'ascoltatore risponde {s}'); assert.strictEqual(V.fai(s, { a: 'rifiuta' }).err, 'No, grazie');
  eq(fatti, [], 'fatto non scatta per le azioni dei ganci');
  assert.strictEqual(V.fai(s, { a: 'nulla' }).err, 'Azione sconosciuta'); eq(fatti, [], 'né per un\'azione fallita');
  ok(V.fai(s, { a: 'riposa' })); eq(fatti, ['riposa'], 'fatto riceve un\'azione del nucleo riuscita');
  assert(V.fai(s, { a: 'compra', m: 'grano', n: 9999 }).err); eq(fatti, ['riposa']);
  // la risposta «Prima rispondi» viene prima dei ganci
  s.rac = { scena: { id: 'x' } }; assert.strictEqual(V.fai(s, { a: 'prova' }).err, 'Prima rispondi'); s.rac = null;
}
{
  // un effetto `ven` nuovo arriva all'ascoltatore; senza ascoltatori la scena si chiude senza errori
  const scena = { inizio: 'a', nodi: { a: { chi: 'signore', testo: 'Prova.', scelte: [{ t: 'Va bene', effetti: [{ t: 'ven', k: 'merce', id: 'grano', n: 2 }, { t: 'ven', k: 'adunata' }], vai: 'b' }] }, b: { chi: 'signore', testo: 'Fine.', fine: true } } };
  const gioca = ascolta => {
    const { VEN: V, VVOC: VV } = nuovoCtx(), s = quieto(V.nuovo(3)); VV.scene['prova-effetto'] = scena;
    const visti = []; if (ascolta) V.aggancia('effetto', (st, e) => { visti.push(e); });
    assert(V.accoda(s, 'prova-effetto'), 'scena in coda'); V.passo(s, 1); assert(V.voce(s), 'la scena si apre');
    ok(V.parla(s, { t: 'scegli', i: 0 })); if (V.voce(s)) ok(V.parla(s, { t: 'continua' }));
    assert(!V.voce(s), 'la scena è chiusa'); return visti;
  };
  const v = gioca(true); eq(v.map(e => e.k), ['merce', 'adunata']); assert.strictEqual(v[0].n, 2); assert.strictEqual(v[0].id, 'grano');
  eq(gioca(false), []);
  const { VEN: V } = nuovoCtx(); for (const k of ['uomini', 'merce', 'viveri', 'gusto', 'adunata']) assert(V.EFF_VOCI.includes(k), k + ' tra gli effetti noti');
}

// (k) `luogo`: 'razzia' quando un signore dell'IA mette a sacco un villaggio (e quando lo fa chi gioca), 'conquista' da VEN.conquista
{
  const { VEN: V } = nuovoCtx(), s = quieto(V.nuovo(3)), M = V.mappaDi(s), vedute = [];
  V.aggancia('luogo', (st, l, ev) => { vedute.push([l.id, ev]); });
  const p = s.p.find(x => x.k === 'sig' && x.faz === 'val'), vil = s.l.find(l => l.tipo === 'villaggio' && l.faz === 'sel');
  s.p = s.p.filter(q => q.id === 0 || q === p); s.guerra[V._.chiave('val', 'sel')] = true;
  p.x = vil.x; p.y = vil.y; p.dentro = -1; p.sc = 0; p.fermo = 0; p.via = []; p.tr = [{ t: 'val_f2', n: 80, f: 0, xp: 0 }]; p.ia = { st: 'razzia', a: vil.id, t: s.t - 1 };
  V.decidi(s, p, M);
  eq(vedute, [[vil.id, 'razzia']], 'la razzia dell\'IA'); assert(vil.sacc > 0);
  // la razzia di chi gioca
  const t = quieto(V.nuovo(11)); const gv = t.l.find(l => l.tipo === 'villaggio'); const visteT = []; V.aggancia('luogo', (st, l, ev) => { if (st === t) visteT.push([l.id, ev]); });
  t.dentro = -1; t.davanti = gv.id; t.guerra[V._.chiave('val', 'sel')] = true; t.rel[gv.faz] = -50; ok(V.fai(t, { a: 'razzia' }));
  eq(visteT, [[gv.id, 'razzia']], 'la razzia di chi gioca');
  // la conquista
  const u = V.nuovo(3), c = u.l.find(l => l.tipo === 'castello' && l.faz === 'fer'); const visteU = []; V.aggancia('luogo', (st, l, ev) => { if (st === u) visteU.push([l.id, ev, l.faz]); });
  V.conquista(u, c, 'tu', -2); eq(visteU, [[c.id, 'conquista', 'tu']], 'la conquista dopo il cambio di bandiera');
}

// altri ganci: `scelta`, `scontro`, `incontro`, `anteprima`; `probCattura`, `decidi`, `mappaDi`
{
  const { VEN: V } = nuovoCtx(), s = quieto(V.nuovo(3));
  assert.strictEqual(V.scegli(s, 'x').err, 'Nessun incontro');
  const pre = s.p.find(p => p.k === 'pre'); s.incontro = { tipo: 'nemico', pid: [pre.id], all: [], da: 'loro' };
  assert.strictEqual(V.scegli(s, 'danza').err, 'Scelta non valida', 'senza ascoltatori resta l\'errore di sempre');
  V.aggancia('scelta', (st, v) => v === 'danza' ? { s: st } : undefined);
  assert.strictEqual(V.scegli(s, 'danza').s, s); assert.strictEqual(V.scegli(s, 'altro').err, 'Scelta non valida');
  eq(V.anteprima(s), {}); V.aggancia('anteprima', (st, a) => { a.rango = 3; }); eq(V.anteprima(s), { rango: 3 });
  assert.strictEqual(V.probCattura(s, {}), .5); assert.strictEqual(typeof V.decidi, 'function'); assert.strictEqual(V.mappaDi(s), V.mappa(s.seme));
  for (const k of ['leva', 'nuovaP', 'vicinoOk', 'vai', 'rimuovi', 'sconfitta', 'memSig', 'inCompagnia', 'gradDi', 'relaz']) assert.strictEqual(typeof V._[k], 'function', 'VEN._.' + k);
}
{
  // `incontro` e `scontro`
  const { VEN: V } = nuovoCtx(), s = V.nuovo(3), tu = V.TU(s), pre = s.p.find(p => p.k === 'pre'), viste = [];
  s.p = s.p.filter(q => q.id === 0 || q === pre); pre.x = tu.x + .3; pre.y = tu.y; pre.dentro = -1; pre.sc = 0; pre.ia = { st: 'caccia', b: 0, t: 0 }; s.tregua = 0; s.dentro = -1; s.davanti = -1;
  V.aggancia('incontro', (st, inc) => { viste.push(inc.tipo); inc.pid.push(-77); });
  V.passo(s, 1); eq(viste, ['nemico']); assert(s.incontro && s.incontro.pid.includes(-77));
  const { VEN: W } = nuovoCtx(), t = quieto(W.nuovo(3)); t.tregua = 0; const a = t.p.find(p => p.k === 'sig' && p.faz === 'val'), b = t.p.find(p => p.k === 'sig' && p.faz === 'sel'); let sc = null;
  t.p = t.p.filter(q => q.id === 0 || q === a || q === b); t.guerra[W._.chiave('val', 'sel')] = true; for (const q of [a, b]) { q.dentro = -1; q.sc = 0; q.fermo = 0; q.via = []; } b.x = a.x + .2; b.y = a.y;
  W.aggancia('scontro', (st, x) => { sc = x; assert(st.scontri.indexOf(x) < 0, 'prima che lo scontro sia registrato'); });
  W.oraNuova(t); assert(sc && sc.a.includes(a.id) && sc.b.includes(b.id) && t.scontri.includes(sc));
}

console.log('test_ven_p04: ok');
