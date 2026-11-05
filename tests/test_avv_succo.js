// Il succo della battaglia (Cantari di Ventura, B6): dagli eventi di un istante di ATEM ai riscontri da mostrare (numeri, critico con fermo-immagine, mancato, cure,
// stati, sbriciolamento, bottino, aree rosse, «Livello su!»). La tabella è la sezione 9 del piano; qui si controlla che i numeri siano quelli, che ogni evento vero dia
// i riscontri giusti, che il bottino e i critici tornino con lo stato, che non ci siano più di 8 numeri in volo e che il modulo sia deterministico.
const assert = require('assert');
const fs = require('fs'), path = require('path');
const { squadra, AR } = require('./avv_aiuti.js');
const E = require('../src/js/motori/27-eroi.js');
global.EROI = E;
const T = require('../src/js/motori/27s-avv-tempo.js');
const AIAT = require('../src/js/motori/27t-avv-ia-tempo.js');
const BE = require('../src/js/motori/27f-avv-bestiario.js');
const ASUC = require('../src/js/motori/28i-avv-succo.js');

const tipi = (l) => l.map((x) => x.t);
const uno = (l, t) => { const r = l.filter((x) => x.t === t); assert.strictEqual(r.length, 1, 'atteso un solo «' + t + '» in ' + JSON.stringify(tipi(l))); return r[0]; };
// uno stato finto: due eroi e due nemici (uno con esperienza, uno senza)
const finto = () => ({ t: 50, cb: [{ id: 'e1', lato: 'eroi', nome: 'Mara', hp: 9, hpMax: 12 }, { id: 'e2', lato: 'eroi', nome: 'Bran', hp: 9, hpMax: 12 },
  { id: 'lupo#1', lato: 'nemici', def: 'lupo-grigio', xp: 25, hp: 0 }, { id: 'fumo', lato: 'nemici', def: 'sciame-di-scintille', xp: 0, hp: 0 }] });

// ---- 1. la tabella della sezione 9 ----
{ const t = ASUC.TAB;
  assert.strictEqual(t.colpo.ms, 600); assert.strictEqual(t.colpo.px, 1);
  assert.strictEqual(t.critico.ms, 800); assert.strictEqual(t.critico.px, 2); assert.strictEqual(t.critico.fermo, 60);
  assert.strictEqual(t.mancato.ms, 500); assert.strictEqual(t.cura.ms, 600); assert.strictEqual(t.sbriciola.ms, 700);
  assert.strictEqual(t.bottino.ms, 1000); assert.strictEqual(t.livello.ms, 1500); assert.strictEqual(t.MAX_NUMERI, 8);
  assert(t.critico.ms > t.colpo.ms && t.critico.px > t.colpo.px, 'il critico è più forte del colpo'); }

// ---- 2. gli eventi, uno per uno ----
{ const s = finto();
  // colpo a segno: numero, lampo e spinta di 1 px dalla parte di chi colpisce, niente fermo
  let r = ASUC.da([{ t: 'tiro', chi: 'e1', bers: 'lupo#1', tiro: 14, tot: 18, cont: 12, ok: true, crit: false }, { t: 'danno', chi: 'e1', bers: 'lupo#1', n: 7, perso: 7, tipo: 'taglio', esito: null }], s, {});
  assert.deepStrictEqual(tipi(r), ['numero', 'colpito']);
  assert.deepStrictEqual([r[0].chi, r[0].v, r[0].crit, r[0].ms], ['lupo#1', -7, false, 600]);
  assert.deepStrictEqual([r[1].chi, r[1].da, r[1].px, r[1].scossa, r[1].lampo], ['lupo#1', 'e1', 1, false, true]);
  // critico: numero grande, scossa di 2 px, fermo-immagine di 60 ms
  r = ASUC.da([{ t: 'tiro', chi: 'e1', bers: 'lupo#1', tiro: 20, tot: 24, cont: 12, ok: true, crit: true }, { t: 'danno', chi: 'e1', bers: 'lupo#1', n: 15, perso: 15, tipo: 'taglio', esito: null }], s, {});
  assert.deepStrictEqual(tipi(r), ['numero', 'colpito', 'fermo']);
  assert.deepStrictEqual([r[0].v, r[0].crit, r[0].ms], [-15, true, 800]); assert.deepStrictEqual([r[1].px, r[1].scossa], [2, true]); assert.strictEqual(r[2].ms, 60);
  // il critico vale solo per il danno di quel colpo: il danno dopo (un altro attacco) non lo eredita
  const mem = {};
  ASUC.da([{ t: 'tiro', chi: 'e1', bers: 'lupo#1', ok: true, crit: true }, { t: 'danno', chi: 'e1', bers: 'lupo#1', n: 9, tipo: 'taglio' }], s, mem);
  r = ASUC.da([{ t: 'danno', chi: 'e1', bers: 'lupo#1', n: 4, tipo: 'taglio' }], s, mem); assert.strictEqual(uno(r, 'numero').crit, false);
  // il critico e il danno possono stare in istanti diversi dello stesso colpo (tiro in un istante, danno nel seguente)? No: escono insieme; ma `mem` regge anche il caso.
  ASUC.da([{ t: 'tiro', chi: 'e2', bers: 'lupo#1', ok: true, crit: true }], s, mem); r = ASUC.da([{ t: 'danno', chi: 'e2', bers: 'lupo#1', n: 8, tipo: 'taglio' }], s, mem); assert.strictEqual(uno(r, 'numero').crit, true);
  // mancato: scritta piccola e grigia sul bersaglio, nessun numero
  r = ASUC.da([{ t: 'tiro', chi: 'e1', bers: 'lupo#1', ok: false, crit: false }], s, {}); assert.deepStrictEqual(tipi(r), ['mancato']); assert.deepStrictEqual([r[0].chi, r[0].ms], ['lupo#1', 500]);
  // immune, o danno zero: niente numero
  assert.deepStrictEqual(ASUC.da([{ t: 'danno', chi: 'e1', bers: 'lupo#1', n: 0, esito: 'imm' }], s, {}), []);
  // danni nel tempo e superfici: numero (senza spinta); danno da superficie senza danno: niente
  r = ASUC.da([{ t: 'dot', chi: 'e1', stato: 'in-fiamme', n: 3, perso: 3, tipo: 'fuoco' }], s, {}); assert.deepStrictEqual(tipi(r), ['numero', 'colpito']); assert.strictEqual(r[1].px, 0);
  assert.deepStrictEqual(tipi(ASUC.da([{ t: 'superficie', chi: 'e1', sup: 'fuoco', n: 4 }], s, {})), ['numero']); assert.deepStrictEqual(ASUC.da([{ t: 'superficie', chi: 'e1', sup: 'acqua', spenta: true }], s, {}), []);
  // cura: numero verde che sale e scintille; PF temporanei: solo il numero
  r = ASUC.da([{ t: 'cura', chi: 'e2', bers: 'e1', n: 6 }], s, {}); assert.deepStrictEqual(tipi(r), ['numero', 'scintille']); assert.deepStrictEqual([r[0].chi, r[0].v, r[0].tipo, r[0].ms], ['e1', 6, 'cura', 600]);
  assert.deepStrictEqual(tipi(ASUC.da([{ t: 'temp', bers: 'e1', n: 5 }], s, {})), ['numero']);
  // stato: appare l'icona, con la tinta di fiamme, veleno e gelo; uno stato non riuscito non appare
  for (const [st, tinta] of [['in-fiamme', 'fuoco'], ['avvelenato', 'veleno'], ['congelato', 'gelo'], ['accecato', null]]) {
    r = ASUC.da([{ t: 'stato', bers: 'e1', stato: st, ok: true, dur: 2 }], s, {}); assert.strictEqual(uno(r, 'stato').tinta, tinta, st); }
  assert.deepStrictEqual(ASUC.da([{ t: 'stato', bers: 'e1', stato: 'accecato', ok: false }], s, {}), []);
  // un nemico che muore: si sbriciola e lascia il bottino (con l'esperienza vera); senza esperienza niente bottino; un eroe che cade no
  r = ASUC.da([{ t: 'muore', chi: 'lupo#1' }], s, {}); assert.deepStrictEqual(tipi(r), ['sbriciola', 'bottino']);
  assert.deepStrictEqual([r[0].ms, r[1].xp, r[1].ms], [700, 25, 1000]); assert(r[1].monete >= 1 && r[1].sfere >= 1);
  assert.deepStrictEqual(tipi(ASUC.da([{ t: 'muore', chi: 'fumo' }], s, {})), ['sbriciola']);
  assert.deepStrictEqual(ASUC.da([{ t: 'cade', chi: 'e1' }, { t: 'muore', chi: 'e1' }], s, {}), []);
  // l'area rossa di un nemico: annunciata al lancio, scoppia quando il potere parte, sparisce se il lancio è interrotto; quella degli eroi non conta
  const zona = [{ q: 2, r: 2 }, { q: 3, r: 2 }], m2 = {};
  r = ASUC.da([{ t: 'lancia', chi: 'lupo#1', id: 'onda', fine: 30, i: 20, zona }], s, m2); assert.deepStrictEqual(tipi(r), ['area']); assert.deepStrictEqual([r[0].durata, r[0].ms, r[0].zona], [10, 1000, zona]);
  r = ASUC.da([{ t: 'potere', chi: 'lupo#1', id: 'onda', colpiti: [] }], s, m2); assert.deepStrictEqual(tipi(r), ['esplode']); assert.deepStrictEqual(r[0].zona, zona);
  assert.deepStrictEqual(ASUC.da([{ t: 'potere', chi: 'lupo#1', id: 'onda', colpiti: [] }], s, m2), [], 'scoppia una volta sola');
  ASUC.da([{ t: 'lancia', chi: 'lupo#1', id: 'onda', fine: 30, i: 20, zona }], s, m2); ASUC.da([{ t: 'interrotto', chi: 'lupo#1', id: 'onda' }], s, m2); assert.deepStrictEqual(ASUC.da([{ t: 'potere', chi: 'lupo#1', id: 'onda' }], s, m2), []);
  assert.deepStrictEqual(ASUC.da([{ t: 'lancia', chi: 'e1', id: 'palla', fine: 30, i: 20, zona }], s, {}), [], 'le aree degli eroi non sono un pericolo');
  assert.deepStrictEqual(ASUC.da([{ t: 'lancia', chi: 'lupo#1', id: 'raggio', fine: 30, i: 20 }], s, {}), [], 'senza zona niente area');
  // tipi mai fuori elenco, ms sempre positivo
  for (const x of [...ASUC.da([{ t: 'muore', chi: 'lupo#1' }, { t: 'cura', chi: 'e2', bers: 'e1', n: 2 }], s, {})]) { assert(ASUC.TIPI.includes(x.t)); assert(x.ms > 0); } }

// ---- 3. bottino: quanti pezzi, dove cadono (senza dadi) ----
{ let u = 0; for (const xp of [1, 25, 59, 60, 120, 200, 475, 5000]) { const b = ASUC.bottinoDi(xp); assert(b.monete >= 1 && b.monete <= 6 && b.sfere >= 1 && b.sfere <= 8, xp + ' ' + JSON.stringify(b)); assert(b.monete >= u, 'più esperienza, almeno altrettante monete'); u = b.monete; }
  assert.deepStrictEqual(ASUC.bottinoDi(25), { monete: 1, sfere: 1 }); assert.deepStrictEqual(ASUC.bottinoDi(475), { monete: 6, sfere: 8 });
  const a = ASUC.sparpaglia('lupo#1', 8), b2 = ASUC.sparpaglia('lupo#1', 8); assert.deepStrictEqual(a, b2, 'stesso nome, stessa caduta'); assert.notDeepStrictEqual(a, ASUC.sparpaglia('brigante', 8), 'nemici diversi, cadute diverse');
  for (const p of a) { assert(p.dx >= -1 && p.dx <= 1 && p.dy >= 0 && p.dy <= 1 && Number.isInteger(p.rit) && p.rit >= 0 && p.rit < 128, JSON.stringify(p)); }
  assert(new Set(a.map((p) => p.dx)).size > 4, 'i pezzi non cadono tutti nello stesso punto'); assert.strictEqual(ASUC.sparpaglia('x', 0).length, 0); }

// ---- 4. al massimo 8 numeri in volo: gli altri si sommano ----
{ const ora = 1000, att = [];
  for (let i = 0; i < 8; i++) { const n = { chi: 'c' + i, v: -3, fine: ora + 600 }; const r = ASUC.limita(att, n, ora, 8); assert.strictEqual(r.op, 'nuovo', 'il numero ' + (i + 1)); att.push(n); }
  let r = ASUC.limita(att, { chi: 'c3', v: -5 }, ora, 8); assert.strictEqual(r.op, 'somma'); assert.strictEqual(r.vivi[r.idx].chi, 'c3', 'si somma a quello dello stesso bersaglio');
  r = ASUC.limita(att, { chi: 'c3', v: +5 }, ora, 8); assert.strictEqual(r.op, 'somma'); assert.strictEqual(r.idx, 0, 'una cura non si somma a un danno: va al più vecchio');
  r = ASUC.limita(att, { chi: 'nuovo', v: -2 }, ora, 8); assert.strictEqual(r.idx, 0, 'bersaglio senza numeri in volo: va al più vecchio');
  assert.deepStrictEqual(ASUC.somma({ chi: 'c3', v: -3, crit: false }, { chi: 'c3', v: -5, crit: true }), { chi: 'c3', v: -8, crit: true });
  assert.strictEqual(ASUC.limita(att, { chi: 'x', v: -1 }, ora + 601, 8).op, 'nuovo', 'quando i vecchi sono spariti c\'è di nuovo posto'); assert.strictEqual(ASUC.limita(att, { chi: 'x', v: -1 }, ora, 9).op, 'nuovo');
  assert.strictEqual(ASUC.limita([], { chi: 'x', v: -1 }, ora).op, 'nuovo'); }

// ---- 5. stati e aree: icone, tinta, quanto è carica un'area ----
{ const c = { stati: [{ id: 'accecato' }, { id: 'avvelenato' }, { id: 'in-fiamme' }] };
  assert.deepStrictEqual(ASUC.statiVisibili(c).map((x) => x.id), ['accecato', 'avvelenato', 'in-fiamme']); assert.strictEqual(ASUC.tintaDi(c), 'fuoco', 'le fiamme vincono sul veleno');
  assert.strictEqual(ASUC.tintaDi({ stati: [{ id: 'avvelenato' }, { id: 'congelato' }] }), 'veleno'); assert.strictEqual(ASUC.tintaDi({ stati: [{ id: 'congelato' }] }), 'gelo');
  assert.strictEqual(ASUC.tintaDi({ stati: [{ id: 'accecato' }] }), null); assert.strictEqual(ASUC.tintaDi({}), null); assert.deepStrictEqual(ASUC.statiVisibili(null), []);
  const L = { lancio: { da: 100, fine: 140 } };
  for (const [t, v] of [[90, 0], [100, 0], [120, .5], [140, 1], [200, 1]]) assert.strictEqual(ASUC.riempimento({ t }, L), v, 't ' + t);
  assert.strictEqual(ASUC.riempimento({ t: 5 }, {}), 0); }

// ---- 6. «Livello su!»: alla vittoria, per chi supera la soglia con l'esperienza della battaglia ----
{ const sq = squadra(3, 3), s = T.nuovo(sq, ['lupo-grigio', 'brigante'], AR.perIncontro(5, 'strada', ['lupo-grigio', 'brigante']), { seme: 5 });
  s.over = { esito: 'vittoria', t: 10 }; for (const c of s.cb) if (c.lato === 'nemici') c.morto = true;
  const R = T.riepilogo(s), quota = R.xpPerEroe; assert(quota > 0, 'serve esperienza da dividere');
  const soglia = E.SOGLIE_XP[3];   // livello 4 a 700 PE
  const camp = { eroi: sq.map((x, i) => Object.assign({}, x.eroe, { xp: i === 1 ? soglia - quota : i === 2 ? soglia - quota - 1 : 0 })) };
  const L = ASUC.livelli(s, camp);
  assert.deepStrictEqual(L.map((x) => x.chi), [s.cb.find((c) => c.indice === 1).id], 'sale solo chi arriva alla soglia (uno resta un punto sotto, uno è lontano)');
  assert.deepStrictEqual([L[0].t, L[0].liv, L[0].ms, L[0].rit], ['livello', 4, 1500, 0]); assert(L[0].nome);
  // due eroi che salgono: partono scalati
  camp.eroi[2].xp = soglia - quota; const L2 = ASUC.livelli(s, camp); assert.deepStrictEqual(L2.map((x) => x.rit), [0, 350]);
  // niente vittoria, niente campagna, niente esperienza nota: niente livello
  assert.deepStrictEqual(ASUC.livelli(Object.assign({}, s, { over: { esito: 'sconfitta', t: 10 } }), camp), []); assert.deepStrictEqual(ASUC.livelli(s, null), []); assert.deepStrictEqual(ASUC.livelli(Object.assign({}, s, { over: null }), camp), []);
  assert.deepStrictEqual(ASUC.livelli(s, { eroi: sq.map((x) => Object.assign({}, x.eroe, { xp: undefined })) }), []);
  // chi è fuori dalla battaglia non guadagna: niente livello per lui
  const s2 = JSON.parse(JSON.stringify(s)); s2.cb.find((c) => c.indice === 1).fuori = true; assert(!ASUC.livelli(s2, camp).some((x) => x.chi === s2.cb.find((c) => c.indice === 1).id)); }

// ---- 7. battaglie vere: i riscontri tornano con gli eventi e con lo stato ----
{ const SCENE = [[['lupo-grigio', 'lupo-grigio', 'brigante'], 'strada', 5], [['capobanda-corvino', 'brigante', 'arciere-bandito'], 'bosco', 5], [['maestro-della-torre', 'famiglio-arcano'], 'torre', 5],
    [['ragno-tessitore', 'cinghiale-irsuto'], 'bosco', 9], [['scheletro-armato', 'arciere-scheletro', 'ghoul-di-tomba'], 'antro', 7], [['stregone-rinnegato', 'cerusico-di-strada', 'tagliagole'], 'strada', 11]];
  const tot = {}; let battaglie = 0;
  for (const [nem, amb, seme] of SCENE) for (const n of [2, 3, 4]) {
    const s = T.nuovo(squadra(n, 3), nem, AR.perIncontro(seme, amb, nem), { seme }), mem = {}; const conta = { crit: 0, critNum: 0, muore: 0, sbri: 0, bott: 0, xpBott: 0, area: 0, esplode: 0, manca: 0, mancaNum: 0 };
    for (let i = 0; i < 6000 && !s.over; i++) { const r = AIAT.avanza(s, 1, { qui: true }); assert(!r.err, r.err);
      const ris = ASUC.da(r.ev || [], s, mem);
      for (const e of r.ev || []) { if (e.t === 'tiro' && e.ok && e.crit && (r.ev || []).some((d) => d.t === 'danno' && d.chi === e.chi && d.bers === e.bers && d.n > 0 && d.esito !== 'imm')) conta.crit++; if (e.t === 'tiro' && !e.ok) conta.manca++; if (e.t === 'muore' && s.cb.find((c) => c.id === e.chi).lato !== 'eroi') conta.muore++; }
      for (const x of ris) { assert(ASUC.TIPI.includes(x.t), x.t); assert(x.ms > 0, x.t); tot[x.t] = (tot[x.t] || 0) + 1;
        if (x.t === 'numero') { assert(Number.isInteger(x.v) && x.v !== 0, 'numero ' + x.v); assert(s.cb.some((c) => c.id === x.chi)); if (x.crit) conta.critNum++; }
        if (x.t === 'mancato') conta.mancaNum++; if (x.t === 'sbriciola') conta.sbri++; if (x.t === 'bottino') { conta.bott++; conta.xpBott += x.xp; }
        if (x.t === 'area') { conta.area++; assert(x.zona.length > 0); assert(s.cb.find((c) => c.id === x.chi).lato === 'nemici'); } if (x.t === 'esplode') conta.esplode++; }
      // le aree annunciate sono tutte di chi sta davvero lanciando; il riempimento resta in 0..1
      for (const c of s.cb) { const p = ASUC.riempimento(s, c); assert(p >= 0 && p <= 1); if (c.lancio) assert(p < 1 + 1e-9); } }
    assert(s.over, 'la battaglia finisce'); battaglie++;
    assert.strictEqual(conta.critNum, conta.crit, 'ogni critico che fa danno ha il suo numero oro (uno parato del tutto non ne ha)'); assert.strictEqual(conta.mancaNum, conta.manca, 'ogni colpo mancato ha la sua scritta');
    assert.strictEqual(conta.sbri, conta.muore, 'ogni nemico che muore si sbriciola');
    const morti = s.cb.filter((c) => c.lato !== 'eroi' && c.morto), xpMorti = morti.reduce((a, c) => a + (c.xp | 0), 0); assert.strictEqual(conta.xpBott, xpMorti, 'il bottino porta tutta l\'esperienza dei caduti (' + conta.xpBott + ' / ' + xpMorti + ')');
    assert(conta.esplode <= conta.area, 'non scoppia più di quel che è stato annunciato'); }
  assert(battaglie === SCENE.length * 3);
  for (const t of ['numero', 'colpito', 'mancato', 'sbriciola', 'bottino', 'area', 'esplode']) assert(tot[t] > 0, 'mai visto «' + t + '» in ' + battaglie + ' battaglie: ' + JSON.stringify(tot));
  assert(tot.fermo > 0, 'almeno un critico in tutte le battaglie'); }

// ---- 8. determinismo e velocità: stessi eventi, stessi riscontri; niente dadi né orologio nel modulo ----
{ const sq0 = squadra(3, 3);   // gli eroi di `squadra` hanno scelte di livello diverse a ogni chiamata: si costruiscono una volta sola e si clonano
  const gioca = () => { const out = []; const s = T.nuovo(JSON.parse(JSON.stringify(sq0)), ['capobanda-corvino', 'brigante', 'arciere-bandito'], AR.perIncontro(5, 'bosco', ['capobanda-corvino', 'brigante', 'arciere-bandito']), { seme: 5 }), mem = {};
    for (let i = 0; i < 6000 && !s.over; i++) { const r = AIAT.avanza(s, 1, { qui: true }); out.push(...ASUC.da(r.ev || [], s, mem)); } return out; };
  const t0 = Date.now(); const a = gioca(), dt = Date.now() - t0; assert.deepStrictEqual(a, gioca(), 'stessa battaglia, stessi riscontri'); assert(dt < 400, 'una battaglia con i riscontri in ' + dt + ' ms');
  const src = fs.readFileSync(path.join(__dirname, '../src/js/motori/28i-avv-succo.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const v of ['Math.random', 'Date.now', 'performance.now', 'Math.sin', 'Math.cos', 'Math.atan2', 'document.', 'window.']) assert(!src.includes(v), 'il motore non deve usare ' + v);
  // il manifest ha il modulo dopo ATEM ed EROI e prima delle viste
  const man = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/manifest.json'), 'utf8')), L = Array.isArray(man) ? man : (man.files || man.js || Object.values(man).flat());
  const idx = (n) => L.findIndex((f) => f.endsWith(n)); assert(idx('28i-avv-succo.js') > idx('27s-avv-tempo.js') && idx('28i-avv-succo.js') > idx('27-eroi.js') && idx('28i-avv-succo.js') < idx('24hq-bat-tempo.js')); }

// ---- 9. i suoni: ogni riscontro che deve suonare ha il suo suono, e i suoni nuovi esistono ----
{ const AAUD = require('../src/js/motori/28c-avv-audio.js'), s = finto(), nomi = (l) => l.map((x) => x.n);
  assert.strictEqual(AAUD.TAB_B.caduta, ASUC.TAB.bottino.caduta, 'le monete cadono quando le aspetta il suono');
  const suona = (ev, m) => ASUC.da(ev, s, m || {}).flatMap((x) => AAUD.passo(x));
  assert(nomi(suona([{ t: 'tiro', chi: 'e1', bers: 'lupo#1', ok: true, crit: true }, { t: 'danno', chi: 'e1', bers: 'lupo#1', n: 9, tipo: 'taglio' }])).includes('avv-critico'), 'il critico ha il suo stacco');
  assert(!nomi(suona([{ t: 'tiro', chi: 'e1', bers: 'lupo#1', ok: true, crit: false }, { t: 'danno', chi: 'e1', bers: 'lupo#1', n: 4, tipo: 'taglio' }])).includes('avv-critico'), 'un colpo normale no');
  assert.deepStrictEqual(nomi(suona([{ t: 'tiro', chi: 'e1', bers: 'lupo#1', ok: false, crit: false }])), ['avv-mancato']);
  assert.deepStrictEqual(nomi(suona([{ t: 'muore', chi: 'lupo#1' }])), ['avv-sbriciola', 'avv-bottino', 'avv-sfera']);
  assert.deepStrictEqual(nomi(suona([{ t: 'lancia', chi: 'lupo#1', id: 'x', fine: 30, i: 20, zona: [{ q: 1, r: 1 }] }])), ['avv-area']);
  assert.deepStrictEqual(nomi(suona([{ t: 'lancia', chi: 'lupo#1', id: 'x', fine: 30, i: 20, zona: [{ q: 1, r: 1 }] }, { t: 'potere', chi: 'lupo#1', id: 'x' }])), ['avv-area', 'avv-esplosione']);
  assert.deepStrictEqual(nomi(AAUD.passo({ t: 'livello', chi: 'e1', liv: 4 })), ['avv-livello']);
  assert.deepStrictEqual(nomi(suona([{ t: 'cura', chi: 'e2', bers: 'e1', n: 6 }])), ['heal']);
  for (const n of ['avv-sbriciola', 'avv-bottino', 'avv-sfera', 'avv-area', 'avv-esplosione']) assert(AAUD.SUONI[n], 'partitura mancante: ' + n);
  for (const x of AAUD.passo({ t: 'bottino', xp: 25 })) assert(x.r < 1500); }

// ---- 10. la vista: le durate del CSS sono quelle della tabella, i ganci ci sono ----
{ const css = fs.readFileSync(path.join(__dirname, '../src/css/39i-succo.css'), 'utf8'), SRC = (f) => fs.readFileSync(path.join(__dirname, '../src/js/app/' + f), 'utf8');
  const ms = (n) => { const m = new RegExp('--su-' + n + ':\\s*(\\d+)ms').exec(css); assert(m, 'manca --su-' + n); return +m[1]; };
  const T = ASUC.TAB; for (const [v, k] of [['colpo', 'colpo'], ['critico', 'critico'], ['mancato', 'mancato'], ['cura', 'cura'], ['sbriciola', 'sbriciola'], ['bottino', 'bottino'], ['livello', 'livello'], ['esplode', 'esplode']]) assert.strictEqual(ms(v), T[k].ms, 'durata di ' + v + ' nel CSS');
  const bt = SRC('24hq-bat-tempo.js'), su = SRC('24hr-bat-succo.js'), fx = SRC('24ho-scena-fx.js');
  assert(/ASUC\.da\(ev,s,BatT\.mem\)/.test(bt) && /Succo\.gioca\(ris,s\)/.test(bt), 'BatT passa gli eventi a ASUC e i riscontri a Succo');
  assert(/BatT\.fermoA/.test(bt) && /t>=BatT\.fermoA/.test(bt), 'il critico ferma l\'immagine');
  assert(/Succo\.tinte\(s\)/.test(bt) && /Succo\.stati\(s\)/.test(bt), 'tinta e icone di stato a ogni istante');
  assert(/su-cont/.test(bt) && /su-oro/.test(bt), 'il contatore dell\'esperienza e l\'oro sono le mete del bottino');
  assert(/ASUC\.riempimento/.test(bt) && /class="zr"/.test(bt), 'l\'area rossa si riempie');
  assert(!/BatAnima\.num\(/.test(bt), 'i numeri non passano più dal vecchio BatAnima.num nel tempo reale');
  assert(/case'colpito'/.test(fx), 'il 3D sa del colpito'); assert(/f\.gelo/.test(fx), 'il 3D sa del gelo');
  assert(/ASUC\.limita/.test(su) && /ASUC\.sparpaglia/.test(su), 'Succo usa i numeri limitati e la caduta senza dadi'); assert(!/Math\.random/.test(su), 'Succo non usa dadi');
  assert(/prefers-reduced-motion/.test(css), 'riduci animazioni');
  // le classi del CSS hanno il prefisso su- (o sono ritocchi di classi esistenti già dichiarati)
  for (const m of css.matchAll(/^\.([a-z][a-z0-9-]*)/gm)) assert(/^(su-|bt-tok|tr-ris|tr-zone)/.test(m[1]), 'classe senza prefisso: ' + m[1]); }

console.log('ok test_avv_succo');
