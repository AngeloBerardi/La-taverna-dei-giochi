// Suggerimenti al tocco (A10): l'ordine, le condizioni, «mai due volte», «Basta suggerimenti», solo nella prima sessione, la memoria sul telefono;
// i testi non mentono sui pulsanti e si leggono in due righe. La scheda sullo schermo (AvvTut) si prova in tools/test-browser/ (scenario avv_sessione).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const E = require('../src/js/motori/27-eroi.js');
global.EROI = E;
const ATUT = require('../src/js/motori/28d-avv-tutorial.js');
const AVV = require('../src/js/motori/28a-avv-orchestratore.js');
const C = require('../src/js/motori/27i-avv-scontro.js');
const { squadra, battaglia, finoA } = require('./avv_aiuti.js');
const cap = require('../src/avventura/corona.json');
const copia = (x) => JSON.parse(JSON.stringify(x));
const SRC = (f) => fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8');

// ---- 1. i dati ----
{ const S = ATUT.SUGGERIMENTI, ids = S.map((s) => s.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'id unici'); assert.deepStrictEqual(ids, ATUT.ID);
  for (const s of S) { assert(/^(mappa|bat|dia)-[a-z]+$/.test(s.id), s.id); assert(ATUT.SCHERMATE.includes(s.sch), s.id + ': schermata'); assert.strictEqual(typeof ATUT.COND[s.cond], 'function', s.id + ': condizione ' + s.cond);
    assert(s.titolo.length >= 5 && s.titolo.length <= 34, s.id + ': titolo di ' + s.titolo.length + ' caratteri'); assert(s.testo.length >= 60 && s.testo.length <= 190, s.id + ': testo di ' + s.testo.length + ' caratteri (due righe)');
    assert(!/[<>{}]|undefined|NaN/.test(s.titolo + s.testo), s.id + ': testo pulito'); assert(!/\p{Extended_Pictographic}/u.test(s.titolo + s.testo), s.id + ': niente emoji');
    assert(!/\b(catan|azul|warhammer|pok[eé]mon|zelda|skyrim|d&d|pathfinder)\b/i.test(s.titolo + s.testo), s.id + ': niente marchi'); }
  assert.deepStrictEqual(Object.keys(ATUT.COND).sort(), [...new Set(S.map((s) => s.cond))].sort(), 'ogni condizione serve a qualcuno');
  assert(S.some((s) => s.sch === 'mappa') && S.some((s) => s.sch === 'battaglia') && S.some((s) => s.sch === 'dialogo'));
  // i testi nominano pulsanti che esistono davvero nella vista
  const map = SRC('app/24hh-mondo-pannelli.js'), bat = SRC('app/24he-battaglia.js');
  const dice = (id) => S.find((s) => s.id === id).testo, citato = (id) => [...dice(id).matchAll(/«([^»]+)»/g)].map((m) => m[1]);
  for (const b of citato('mappa-tira')) assert(map.includes(b), 'pulsante «' + b + '» non trovato nella mappa'); for (const b of citato('mappa-muovi')) assert(map.includes(b), 'pulsante «' + b + '»');
  for (const b of citato('mappa-luogo')) assert(map.includes(b), 'pulsante «' + b + '»');
  for (const b of [...citato('bat-turno'), ...citato('bat-tocco')]) assert(bat.includes(b), 'pulsante «' + b + '» non trovato nella battaglia'); }

// ---- 2. la memoria ----
{ const m0 = ATUT.vuota(); assert.deepStrictEqual(m0, { spento: false, sempre: false, visti: [] });
  const m1 = ATUT.visto(m0, 'mappa-tira'); assert.deepStrictEqual(m1.visti, ['mappa-tira']); assert.deepStrictEqual(m0.visti, [], 'non modifica l\'originale');
  assert.deepStrictEqual(ATUT.visto(m1, 'mappa-tira').visti, ['mappa-tira'], 'mai due volte'); assert.deepStrictEqual(ATUT.visto(m1, 'inesistente').visti, ['mappa-tira'], 'id sconosciuti ignorati');
  assert.strictEqual(ATUT.restano(m0), ATUT.ID.length); assert.strictEqual(ATUT.restano(m1), ATUT.ID.length - 1);
  const sp = ATUT.spegni(m1); assert.strictEqual(sp.spento, true); assert.deepStrictEqual(sp.visti, ['mappa-tira']);
  const r = ATUT.rivedi(); assert.deepStrictEqual(r, { spento: false, sempre: true, visti: [] });
  // salvataggio sul telefono
  assert.deepStrictEqual(ATUT.leggi(ATUT.scrivi(sp)), sp); assert.deepStrictEqual(ATUT.leggi(ATUT.scrivi(r)), r);
  for (const brutto of [null, '', 'non json', '[1,2]', '"x"', '{"visti":"x"}', '{"visti":["zzz","mappa-tira"],"spento":1}']) { const x = ATUT.leggi(brutto); assert(Array.isArray(x.visti) && typeof x.spento === 'boolean' && typeof x.sempre === 'boolean', String(brutto));
    assert(x.visti.every((i) => ATUT.ID.includes(i))); }
  assert.deepStrictEqual(ATUT.leggi('{"visti":["zzz","mappa-tira"],"spento":1}'), { spento: false, sempre: false, visti: ['mappa-tira'] }, 'solo valori veri'); }

// ---- 3. la mappa su uno stato vero ----
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base, slot) => Object.assign(E.nuovo({ nome, classe, razza, aspetto: A, base: { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8, ...base } }), { slot });
const gruppo = () => [mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }, 'e1'), mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }, 'e2')];
const nuova = (seme) => AVV.nuova(cap, gruppo(), seme || 3, { avvio: false });
{ let s = nuova(); const P = ATUT.prossimo, ctx = (st) => ATUT.contesto('mappa', st);
  let c = ctx(s); assert.strictEqual(c.sch, 'mappa'); assert.strictEqual(c.prima, true); assert.strictEqual(c.tirato, false); assert.strictEqual(c.dentro, false); assert.strictEqual(c.fermo, false);
  assert.strictEqual(P(c, null), 'mappa-tira', 'all\'inizio si tira il movimento');
  // dopo il tiro: dove andare
  const r = AVV.act(s, { t: 'camp', a: { t: 'tira', tutti: true } }, cap); assert(r.s, r.err); s = r.s; c = ctx(s); assert.strictEqual(c.tirato, true); assert.strictEqual(c.pmResto, true);
  assert.strictEqual(P(c, null), 'mappa-muovi'); assert.strictEqual(P(c, ATUT.visto(null, 'mappa-tira')), 'mappa-muovi');
  // si scorre la lista: ognuno compare una volta sola, in ordine di priorità, finché non resta nulla
  let mem = ATUT.vuota(); const visti = [];
  for (let n = 0; n < 12; n++) { const id = P(c, mem); if (!id) break; assert(!visti.includes(id), 'ripetuto ' + id); visti.push(id); mem = ATUT.visto(mem, id); }
  assert(visti.length >= 1 && visti[0] === 'mappa-muovi', 'visti: ' + visti); assert.strictEqual(P(c, mem), null, 'finiti');
  assert.deepStrictEqual(visti, ATUT.ID.filter((i) => visti.includes(i)), 'nell\'ordine dell\'elenco');
  // la notte e la perdizione
  const n = copia(s); n.camp.fase = 'notte'; const cn = ctx(n); assert.strictEqual(cn.notte, true); assert.strictEqual(P(cn, ATUT.visto(ATUT.visto(ATUT.visto(null, 'mappa-tira'), 'mappa-muovi'), 'mappa-luogo')), 'mappa-notte', 'notte');
  const g = copia(s); g.camp.giorno = 2; g.camp.perdizione = 3; const cg = ctx(g); assert.strictEqual(P(cg, ATUT.visto(ATUT.visto(null, 'mappa-tira'), 'mappa-muovi')), 'mappa-perdizione', 'perdizione');
  // in battaglia, in un dialogo o in un sotterraneo i suggerimenti della mappa tacciono (o sono altri)
  const b = copia(s); b.camp.sfida = { quali: [] }; assert.strictEqual(ctx(b).fermo, true); assert.strictEqual(P(ctx(b), null), null, 'sfida in corso');
  const d = copia(s); d.camp.dentro = 'x'; assert.strictEqual(ctx(d).dentro, true); assert(!['mappa-tira', 'mappa-muovi'].includes(P(ctx(d), null)), 'dentro un sotterraneo non si tira sulla mappa');
  const sc = copia(s); sc.racc.scena = { id: 'x', nodo: 'y' }; assert.strictEqual(P(ctx(sc), null), null, 'durante una scena');
  // solo nella prima sessione, salvo «Rivedi»
  const dopo = copia(nuova()); dopo.racc.sessioni = 1; const cd = ctx(dopo); assert.strictEqual(cd.prima, false); assert.strictEqual(P(cd, null), null, 'seconda sessione: niente');
  assert.strictEqual(P(cd, ATUT.rivedi()), 'mappa-tira', '«Rivedi»'); assert.strictEqual(P(c, ATUT.spegni(null)), null, '«Basta suggerimenti»'); assert.strictEqual(P(c, ATUT.spegni(ATUT.rivedi())), null, 'spento vince');
  // campagna libera (senza AVV): vale la campagna e basta
  const libera = ATUT.contesto('mappa', null, { camp: nuova().camp }); assert.strictEqual(libera.prima, true); assert.strictEqual(P(libera, null), 'mappa-tira');
  assert.strictEqual(P(ATUT.contesto('mappa', null, {}), null), null, 'senza campagna niente'); }

// ---- 4. la battaglia ----
{ const P = ATUT.prossimo, squad = squadra(2, 3);
  const bs = finoA(battaglia(squad, ['tagliagole', 'lupo-grigio'], { seme: 5 }), 'e1'); assert.strictEqual(C.attore(bs).lato, 'eroi');
  const ctx = (x, a) => ATUT.contesto('battaglia', a || null, x);
  assert.strictEqual(P(ctx({ bat: bs }), null), 'bat-turno'); assert.strictEqual(P(ctx({ bat: bs, pronto: true }), null), 'bat-tocco', 'anteprima in attesa di conferma');
  assert.strictEqual(P(ctx({ bat: bs, pronto: true }), ATUT.visto(null, 'bat-tocco')), null); assert.strictEqual(P(ctx({ bat: bs }), ATUT.visto(null, 'bat-turno')), null, 'bat-tocco aspetta l\'anteprima');
  // il turno di un mostro non ha suggerimenti; nemmeno una battaglia finita
  let nem = bs; for (let n = 0; n < 20 && C.attore(nem).lato === 'eroi'; n++) nem = C.act(nem, { t: 'fine' }).s; assert.strictEqual(C.attore(nem).lato, 'nemici'); assert.strictEqual(P(ctx({ bat: nem }), null), null, 'turno dei mostri');
  const fin = copia(bs); fin.over = { esito: 'vittoria' }; assert.strictEqual(P(ctx({ bat: fin }), null), null, 'battaglia finita'); assert.strictEqual(P(ctx({ bat: null }), null), null);
  // dentro una sessione: solo nella prima battaglia della prima sessione
  const a = nuova(); assert.strictEqual(P(ctx({ bat: bs }, a), null), 'bat-turno');
  const a2 = copia(a); a2.sessione.battaglie = 1; assert.strictEqual(P(ctx({ bat: bs }, a2), null), null, 'non è la prima battaglia'); assert.strictEqual(P(ctx({ bat: bs }, a2), ATUT.rivedi()), 'bat-turno');
  const a3 = copia(a); a3.racc.sessioni = 2; assert.strictEqual(P(ctx({ bat: bs }, a3), null), null, 'non è la prima sessione'); }

// ---- 5. il dialogo ----
{ const P = ATUT.prossimo, ctx = (dia, a) => ATUT.contesto('dialogo', a || null, { dia });
  const con = { scelte: [{ i: 0, prova: true, ok: true }, { i: 1, prova: false, ok: true }], reazioni: [] };
  assert.strictEqual(P(ctx(con), null), 'dia-prova'); assert.strictEqual(P(ctx({ scelte: [{ prova: true, ok: false }], reazioni: [] }), null), null, 'una prova non disponibile non spiega nulla');
  assert.strictEqual(P(ctx({ scelte: [{ prova: false, ok: true }], reazioni: [] }), null), null); assert.strictEqual(P(ctx({ scelte: [], reazioni: [{ chi: 'x' }] }), null), 'dia-compagno'); assert.strictEqual(P(ctx(con), ATUT.visto(null, 'dia-prova')), null);
  assert.strictEqual(P(ctx({ scelte: con.scelte, reazioni: [{ chi: 'x' }] }), ATUT.visto(null, 'dia-prova')), 'dia-compagno'); assert.strictEqual(P(ctx(null), null), null, 'senza dialogo niente');
  assert.strictEqual(P(ctx(con, Object.assign(nuova(), { racc: Object.assign(nuova().racc, { sessioni: 3 }) })), null), null, 'solo nella prima sessione');
  // il capitolo ha davvero prove e compagni da spiegare
  const testo = JSON.stringify(cap); assert(/"prova"/.test(testo), 'il Capitolo 1 ha scelte con prova'); assert(/"compagni"/.test(testo)); }

// ---- 6. contesto sconosciuto o rotto: niente di male ----
{ const P = ATUT.prossimo; assert.strictEqual(P(null, null), null); assert.strictEqual(P({ sch: 'inventata', prima: true }, null), null); assert.strictEqual(P({ sch: 'mappa' }, null), null, 'senza «prima» non è la prima sessione');
  assert.doesNotThrow(() => ATUT.contesto('inventata', null, {})); assert.doesNotThrow(() => ATUT.contesto('battaglia', null, {})); assert.doesNotThrow(() => ATUT.contesto('dialogo', null, {}));
  assert(!/Math\.random/.test(SRC('motori/28d-avv-tutorial.js').replace(/\/\*[\s\S]*?\*\//g, '')), 'niente Math.random'); }

// ---- 7. mentre un foglio è aperto (luogo, diario, poteri, pausa delle reazioni) la schedina non si mostra: non copre i suoi pulsanti ----
{ const P = ATUT.prossimo; const aperto = ATUT.contesto('battaglia', null, { foglio: true, pronto: false }); assert.strictEqual(aperto.foglio, true);
  assert.strictEqual(P(Object.assign({}, aperto, { turnoEroe: true }), null), null, 'con un foglio aperto niente suggerimento');
  assert.strictEqual(P(Object.assign({}, aperto, { foglio: false, turnoEroe: true }), null), 'bat-turno', 'chiuso il foglio, torna');
  assert.strictEqual(ATUT.contesto('mappa', null, {}).foglio, false, 'di norma nessun foglio'); }

console.log('test_avv_tutorial: ok');
