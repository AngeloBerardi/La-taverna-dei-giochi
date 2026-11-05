// IA del tempo reale (Cantari di Ventura, piano B, step B4): atteggiamenti degli eroi, uso automatico, ordini del giocatore, comportamento dei nemici
// (mira, branco, fuga, resa), aree annunciate dei capi, ordini sempre validi, riproducibilità, velocità e forza (bot bravo vince, casuale perde).
const assert = require('assert');
const fs = require('fs'), path = require('path');
const { A, AR, eroe, squadra, aperta, mostro } = require('./avv_aiuti.js');
const T = require('../src/js/motori/27s-avv-tempo.js');
const S = require('../src/js/motori/27d-avv-stati.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const AIAT = require('../src/js/motori/27t-avv-ia-tempo.js');
const BOT = require('./bot_avv_tempo.js');

const ok = (r, msg) => { assert(!r.err, (msg || '') + ' → ' + r.err); return r; };
const cella = (col, rg) => G.daOffset(col, rg);
const hash = (s) => { const t = JSON.stringify(Object.assign({}, s, { ev: null, evn: null })); let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
// scena su un'arena aperta 9×11: eroi delle classi date (livello `liv`), nemici, posizioni { id: [colonna, riga] }; tutti già partiti
function scena(classi, nem, posiz, o) {
  o = o || {}; const sq = classi.map((cl, i) => ({ eroe: eroe(cl, o.liv || 3, ['umano', 'elfo', 'nano', 'piccolo'][i]), dist: 0 }));
  const s = T.nuovo(sq, nem, o.arena || aperta(), { seme: o.seme || 3 });
  for (const c of s.cb) { c.via = 0; c.pronto = 0; }
  for (const [id, [col, rg]] of Object.entries(posiz)) { const c = mostro(s, id), q = cella(col, rg); c.q = q.q; c.r = q.r; }
  return s;
}
const ordiniDi = (s, lato) => ok(AIAT.pensa(s, { lato })).ordini;
const di = (ord, chi) => ord.filter((o) => o.chi === chi);
const bersDi = (s, o) => o.bers || (o.cella ? (s.cb.find((c) => T.inCampo(c) && c.q === o.cella.q && c.r === o.cella.r) || {}).id : undefined);
const INCONTRI = [
  [1, 2, ['lupo-grigio', 'lupo-grigio']],
  [2, 3, ['brigante', 'brigante', 'arciere-bandito']],
  [2, 4, ['brigante', 'brigante', 'arciere-bandito', 'tagliagole']],
  [3, 4, ['brigante', 'tagliagole', 'cerusico-di-strada', 'stregone-rinnegato']],
  [3, 4, ['scheletro-armato', 'scheletro-armato', 'arciere-scheletro', 'ghoul-di-tomba']],
  [4, 4, ['anima-in-pena', 'officiante-spolpato', 'scheletro-armato', 'statua-vivente']]];
const nuova = (i, seme) => { const [liv, n, nem] = INCONTRI[i]; return T.nuovo(squadra(n, liv), nem, AR.genera(seme, AR.AMBIENTI[(i + seme) % AR.AMBIENTI.length]), { seme }); };
const SCELTI = { guerriero: 'difesa', mago: 'posizione', chierico: 'supporto', ladro: 'assalto' };   // come li sceglierebbe chi gioca bene
const limitati = (c) => c.poteri.filter((id) => { const p = A.P[id]; return id !== 'attacco' && p.ric !== 'turno' && p.costo !== 'reazione'; });
function prepara(s, att, auto) { for (const c of s.cb) if (c.lato === 'eroi') { if (att) AIAT.imposta(s, c.id, att[c.classe] || att, { qui: true }); if (auto) for (const id of limitati(c)) AIAT.automatico(s, c.id, id, true, { qui: true }); } return s; }

// ---- 0. niente caso né orologi né trigonometria nel cervello ----
{ const t = fs.readFileSync(path.join(__dirname, '../src/js/motori/27t-avv-ia-tempo.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/Math\.random|Date\.now|performance\.now|Math\.(sin|cos|tan|atan2?)\b/.test(t), '27t: niente Math.random, orologi o trigonometria'); }

// ---- 1. atteggiamenti, uso automatico, errori ----
{ assert.deepStrictEqual(AIAT.ATT_ID, ['assalto', 'difesa', 'supporto', 'posizione']);
  assert.deepStrictEqual(AIAT.ATT_ID.map((i) => AIAT.ATT[i].nome), ['Assalto', 'Difesa', 'Supporto', 'Tieni la posizione']);
  for (const i of AIAT.ATT_ID) assert(AIAT.ATT[i].desc.length > 10 && !/[^\u0000-ɏ‘-‟…]/.test(AIAT.ATT[i].desc), i + ': descrizione in italiano, senza emoji');
  const s = scena(['guerriero', 'chierico'], ['brigante'], { e1: [4, 8], e2: [3, 9], brigante: [4, 1] });
  assert.strictEqual(AIAT.atteggiamento(s, mostro(s, 'e1')), 'assalto'); assert.strictEqual(AIAT.atteggiamento(s, mostro(s, 'e2')), 'supporto'); assert.strictEqual(AIAT.atteggiamento(s, mostro(s, 'brigante')), null);
  const r = ok(AIAT.imposta(s, 'e1', 'difesa')); assert.strictEqual(r.s.ia.att.e1, 'difesa'); assert.strictEqual(AIAT.atteggiamento(s, mostro(s, 'e1')), 'assalto', 'senza `qui` lo stato di partenza non cambia');
  assert.match(AIAT.imposta(s, 'e1', 'furia').err, /sconosciuto/); assert.match(AIAT.imposta(s, 'brigante', 'assalto').err, /eroi/); assert(AIAT.imposta(s, 'zz', 'assalto').err);
  assert.match(AIAT.automatico(s, 'e2', 'fiamma-sacra', true).err, /automatico/, 'un potere a volontà non ha bisogno dell\'uso automatico');
  assert(AIAT.automatico(s, 'e2', 'attacco', true).err && AIAT.automatico(s, 'e2', 'r-nano', true).err && AIAT.automatico(s, 'brigante', 'm-sabbia', true).err);
  const a = ok(AIAT.automatico(s, 'e2', 'tocco-guaritore', true)); assert.deepStrictEqual(a.s.ia.auto, { e2: { 'tocco-guaritore': true } });
  const b = ok(AIAT.automatico(a.s, 'e2', 'conc', true)), c2 = ok(AIAT.automatico(b.s, 'e2', 'tocco-guaritore', false)); assert.deepStrictEqual(c2.s.ia.auto, { e2: { conc: true } });
  assert(AIAT.pensa(null).err && AIAT.pensa({}).err); const f = JSON.parse(JSON.stringify(s)); f.over = { esito: 'vittoria', t: 1 }; assert.match(AIAT.pensa(f).err, /finita/);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(s.ia || null)), null, 'pensare e impostare sulle copie non sporca lo stato di partenza'); }

// ---- 2. gli ordini dell'IA sono sempre validi: nessuno scartato, con ogni atteggiamento, su più arene ----
{ let n = 0;
  for (const att of AIAT.ATT_ID) for (const i of [1, 3, 4]) for (const seme of [1, 2]) { const s = prepara(nuova(i, seme), att, seme === 2), g = AIAT.gioca(s, { qui: true }); n++;
    assert.strictEqual(g.scartati, 0, att + ' incontro ' + i + ' seme ' + seme + ': un ordine rifiutato'); assert(['vittoria', 'sconfitta', 'stallo'].includes(s.over.esito)); }
  console.log(`  ordini: ${n} battaglie, nessun ordine scartato`); }

// ---- 3. un ordine dato a mano dal giocatore vale finché non finisce; poi l'IA riprende ----
{ const s = scena(['guerriero'], ['brigante'], { e1: [1, 8], brigante: [8, 1] }); AIAT.tick(s);
  assert(s.ordini.e1 && s.ordini.e1.ia === true && s.ordini.e1.t === 'attacca', 'l\'IA muove da sola: ordine marcato `ia`');
  ok(T.ordina(s, { chi: 'e1', t: 'vai', a: cella(1, 5) }, { qui: true })); assert(!s.ordini.e1.ia, 'l\'ordine a mano non è dell\'IA');
  AIAT.avanza(s, 10, { qui: true }); assert(s.ordini.e1 && s.ordini.e1.t === 'vai' && !s.ordini.e1.ia, 'dopo 1 s l\'IA non l\'ha toccato');
  AIAT.avanza(s, 10, { qui: true }); const e1 = mostro(s, 'e1'); assert.deepStrictEqual({ q: e1.q, r: e1.r }, cella(1, 5), 'arrivato dove diceva il giocatore');
  AIAT.avanza(s, 10, { qui: true }); assert(s.ordini.e1 && s.ordini.e1.ia && s.ordini.e1.t === 'attacca', 'finito l\'ordine, l\'IA riprende'); }

// ---- 4. Assalto: punta il più debole fra quelli vicini ----
{ const s = scena(['guerriero'], ['brigante', 'brigante'], { e1: [4, 8], 'brigante#1': [3, 5], 'brigante#2': [5, 5] }); mostro(s, 'brigante#2').hp = 10;       // ferito, ma non abbastanza da arrendersi
  AIAT.imposta(s, 'e1', 'assalto', { qui: true }); assert.deepStrictEqual(ordiniDi(s, 'eroi'), [{ chi: 'e1', t: 'attacca', bers: 'brigante#2' }]);
  mostro(s, 'brigante#2').hp = mostro(s, 'brigante#2').hpMax; mostro(s, 'brigante#1').hp = 10; assert.deepStrictEqual(ordiniDi(s, 'eroi'), [{ chi: 'e1', t: 'attacca', bers: 'brigante#1' }], 'cambia il più debole, cambia il bersaglio'); }

// ---- 5. Difesa: resta vicino all'alleato più fragile e ferma chi lo minaccia ----
{ const s = scena(['guerriero', 'mago'], ['brigante'], { e1: [1, 3], e2: [4, 9], brigante: [4, 0] }); AIAT.imposta(s, 'e1', 'difesa', { qui: true });
  const d0 = G.dist(mostro(s, 'e1'), mostro(s, 'e2')); AIAT.avanza(s, 20, { qui: true }); assert(G.dist(mostro(s, 'e1'), mostro(s, 'e2')) < d0 && G.dist(mostro(s, 'e1'), mostro(s, 'e2')) <= 3, 'si avvicina al mago invece di correre dal nemico');
  const t = scena(['guerriero', 'mago'], ['brigante'], { e1: [4, 8], e2: [4, 9], brigante: [4, 6] }); AIAT.imposta(t, 'e1', 'difesa', { qui: true });
  { const o = di(ordiniDi(t, 'eroi'), 'e1'); assert(o.length === 1 && o[0].bers === 'brigante' && ['attacca', 'potere'].includes(o[0].t), 'chi si avvicina al mago viene fermato: ' + JSON.stringify(o)); }
  const u = scena(['guerriero', 'mago'], ['brigante'], { e1: [4, 8], e2: [4, 9], brigante: [4, 0] }); AIAT.imposta(u, 'e1', 'difesa', { qui: true });
  assert.deepStrictEqual(di(ordiniDi(u, 'eroi'), 'e1'), [], 'se nessuno minaccia il mago, non esce a cercare i nemici'); }

// ---- 6. Supporto: cure (con «Uso automatico»), rialzo, poi colpisce da lontano ----
{ const mk = () => { const s = scena(['guerriero', 'chierico'], ['brigante'], { e1: [4, 8], e2: [3, 9], brigante: [4, 0] }); mostro(s, 'e1').hp = 8; return s; };
  const s = mk(); assert(!di(ordiniDi(s, 'eroi'), 'e2').some((o) => o.id === 'tocco-guaritore'), 'senza «Uso automatico» la cura (a cariche) non scatta');
  AIAT.automatico(s, 'e2', 'tocco-guaritore', true, { qui: true }); assert.deepStrictEqual(di(ordiniDi(s, 'eroi'), 'e2'), [{ chi: 'e2', t: 'potere', id: 'tocco-guaritore', bers: 'e1' }], 'con «Uso automatico» cura il più ferito');
  const t = mk(); mostro(t, 'e1').hp = 0; S.aggiungi(mostro(t, 'e1'), 'terra'); assert.deepStrictEqual(di(ordiniDi(t, 'eroi'), 'e2'), [{ chi: 'e2', t: 'rialza', bers: 'e1' }], 'il Supporto rialza chi è a terra');
  AIAT.imposta(t, 'e2', 'assalto', { qui: true }); assert(!di(ordiniDi(t, 'eroi'), 'e2').some((o) => o.t === 'rialza'), 'chi non ha Supporto non lo fa da solo');
  AIAT.imposta(t, 'e2', 'supporto', { qui: true }); const r = AIAT.avanza(t, 60, { qui: true }); assert(r.ev.some((e) => e.t === 'rialza' && e.chi === 'e2' && e.bers === 'e1'), 'e lo rialza davvero');
  const m = scena(['guerriero'], ['brigante', 'cerusico-di-strada'], { e1: [4, 9], brigante: [4, 2], 'cerusico-di-strada': [5, 1] }); mostro(m, 'brigante').hp = 7;
  assert(ordiniDi(m, 'nemici').some((o) => o.chi === 'cerusico-di-strada' && o.t === 'potere' && o.id === 'm-impacco' && o.bers === 'brigante'), 'il cerusico cura il brigante ferito'); }

// ---- 7. Tieni la posizione ----
{ const s = scena(['guerriero'], ['brigante'], { e1: [4, 8], brigante: [4, 0] }); AIAT.imposta(s, 'e1', 'posizione', { qui: true }); const p0 = { q: mostro(s, 'e1').q, r: mostro(s, 'e1').r };
  AIAT.avanza(s, 60, { qui: true }); assert.deepStrictEqual({ q: mostro(s, 'e1').q, r: mostro(s, 'e1').r }, p0, 'non si muove mentre i nemici sono lontani');
  const t = scena(['guerriero'], ['brigante'], { e1: [4, 8], brigante: [4, 7] }); AIAT.imposta(t, 'e1', 'posizione', { qui: true });
  { const o = ordiniDi(t, 'eroi'); assert(o.length === 1 && o[0].chi === 'e1' && o[0].bers === 'brigante' && ['attacca', 'potere'].includes(o[0].t), 'colpisce chi arriva a portata (arma o potere a volontà): ' + JSON.stringify(o)); } mostro(t, 'brigante').hp = 1e6;
  const r = AIAT.avanza(t, 60, { qui: true }); assert(r.ev.some((e) => e.t === 'attacca' && e.chi === 'e1')); assert.deepStrictEqual({ q: mostro(t, 'e1').q, r: mostro(t, 'e1').r }, p0);
  const u = scena(['guerriero'], ['brigante'], { e1: [4, 8], brigante: [4, 0] }); AIAT.imposta(u, 'e1', 'posizione', { qui: true }); AIAT.tick(u);        // fissa il punto
  const v = cella(4, 6); mostro(u, 'e1').q = v.q; mostro(u, 'e1').r = v.r; AIAT.avanza(u, 40, { qui: true }); assert.deepStrictEqual({ q: mostro(u, 'e1').q, r: mostro(u, 'e1').r }, p0, 'se lo spostano, torna al suo posto');
  const w = scena(['guerriero'], ['brigante'], { e1: [4, 8], brigante: [4, 0] }); AIAT.imposta(w, 'e1', 'posizione', { qui: true }); AIAT.tick(w);
  ok(T.ordina(w, { chi: 'e1', t: 'vai', a: cella(2, 8) }, { qui: true })); AIAT.avanza(w, 60, { qui: true });
  assert.deepStrictEqual({ q: mostro(w, 'e1').q, r: mostro(w, 'e1').r }, cella(2, 8), 'un ordine del giocatore sposta il punto da tenere'); }

// ---- 8. «Uso automatico»: i poteri a cariche solo se attivato; quelli a volontà sempre; la Concentrazione ----
{ const mk = () => scena(['mago'], ['brigante', 'brigante', 'brigante'], { e1: [4, 9], 'brigante#1': [4, 4], 'brigante#2': [3, 4], 'brigante#3': [5, 4] });
  const s = mk(); const o1 = di(ordiniDi(s, 'eroi'), 'e1'); assert.strictEqual(o1.length, 1); assert.strictEqual(o1[0].id, 'scintilla-arcana', 'a volontà: la usa da solo');
  AIAT.automatico(s, 'e1', 'sfera-di-fiamme', true, { qui: true }); const o2 = di(ordiniDi(s, 'eroi'), 'e1')[0]; assert.strictEqual(o2.id, 'sfera-di-fiamme'); assert(o2.cella, 'l\'area ha una cella fissa (l\'area rossa)');
  const t = mk(); const r = AIAT.avanza(t, 120, { qui: true }); assert(!r.ev.some((e) => e.t === 'potere' && e.chi === 'e1' && e.id === 'sfera-di-fiamme'), 'senza «Uso automatico» la sfera non parte mai');
  const c = scena(['guerriero'], ['brigante'], { e1: [4, 6], brigante: [4, 5] }); assert(!ordiniDi(c, 'eroi').some((o) => o.t === 'conc'));
  AIAT.automatico(c, 'e1', 'conc', true, { qui: true }); assert(ordiniDi(c, 'eroi').some((o) => o.chi === 'e1' && o.t === 'conc'), 'con la Concentrazione attiva la spende contro chi è vicino'); }

// ---- 9. nemici: bersaglio secondo `ia.mira`, branco ----
{ const w = scena(['guerriero', 'mago'], ['lupo-grigio'], { e1: [3, 5], e2: [5, 5], 'lupo-grigio': [4, 2] }); mostro(w, 'e2').hp = 5;
  assert.strictEqual(ordiniDi(w, 'nemici')[0].bers, 'e2', 'mira «debole»: il più ferito');
  const c = scena(['guerriero', 'chierico'], ['stregone-rinnegato'], { e1: [3, 6], e2: [5, 6], 'stregone-rinnegato': [4, 1] }); assert.strictEqual(bersDi(c, ordiniDi(c, 'nemici')[0]), 'e2', 'mira «curatore»: chi cura');
  const i = scena(['guerriero', 'mago'], ['arciere-bandito'], { e1: [3, 6], e2: [5, 6], 'arciere-bandito': [4, 2] }); assert.strictEqual(ordiniDi(i, 'nemici')[0].bers, 'e2', 'mira «incantatore»: il mago');
  const v = scena(['guerriero', 'mago'], ['brigante'], { e1: [4, 5], e2: [4, 8], brigante: [4, 2] }); assert.strictEqual(ordiniDi(v, 'nemici')[0].bers, 'e1', 'mira «vicino»: il più vicino');
  const br = (alleato) => { const s = scena(['guerriero', 'guerriero'], ['lupo-grigio', 'lupo-grigio'], { e1: [3, 5], e2: [5, 5], 'lupo-grigio#1': [4, 2], 'lupo-grigio#2': alleato }); return di(ordiniDi(s, 'nemici'), 'lupo-grigio#1')[0].bers; };
  assert.strictEqual(br([6, 5]), 'e2', 'branco: attacca chi ha già un lupo accanto'); assert.strictEqual(br([2, 5]), 'e1', 'branco: e se il lupo è dall\'altra parte, cambia'); }

// ---- 10. fuga e resa ----
{ const f = scena(['guerriero'], ['lupo-grigio'], { e1: [4, 10], 'lupo-grigio': [4, 4] }); const l = mostro(f, 'lupo-grigio'); l.hp = Math.floor(l.hpMax * 0.2);
  assert.deepStrictEqual(di(ordiniDi(f, 'nemici'), 'lupo-grigio'), [{ chi: 'lupo-grigio', t: 'fuggi' }]); const r = AIAT.avanza(f, 400, { qui: true });
  assert(r.ev.some((e) => e.t === 'fuggito' && e.chi === 'lupo-grigio') && l.fuggito, 'il lupo scappa dall\'uscita');
  const a = scena(['guerriero'], ['brigante'], { e1: [4, 9], brigante: [4, 3] }); const b = mostro(a, 'brigante'); b.hp = Math.floor(b.hpMax * 0.2);
  assert.deepStrictEqual(di(ordiniDi(a, 'nemici'), 'brigante'), [{ chi: 'brigante', t: 'arrendi' }]); const t = AIAT.tick(a); assert(t.ev.some((e) => e.t === 'arreso' && e.chi === 'brigante') && b.arreso && t.scartati === 0);
  AIAT.avanza(a, 5, { qui: true }); assert.strictEqual(a.over.esito, 'vittoria', 'chi si arrende non conta più: vittoria');
  // un mostro che si arrende nello stesso istante in cui altri lo sceglierebbero (cura, bersaglio): nessun ordine rifiutato
  const m = scena(['guerriero'], ['brigante', 'cerusico-di-strada'], { e1: [4, 3], brigante: [4, 2], 'cerusico-di-strada': [5, 1] }); mostro(m, 'brigante').hp = 3;
  const g = AIAT.tick(m); assert.strictEqual(g.scartati, 0); assert(g.ev.some((e) => e.t === 'arreso')); assert.strictEqual(m.ordini.e1 && m.ordini.e1.bers, 'cerusico-di-strada', 'gli eroi non puntano chi si sta arrendendo');
  assert(!T.ordina(scena(['guerriero'], ['brigante'], { e1: [4, 9], brigante: [4, 3] }), { chi: 'brigante', t: 'arrendi' }).s || true);
  const n = scena(['guerriero'], ['brigante'], { e1: [4, 9], brigante: [4, 3] }); assert.match(T.ordina(n, { chi: 'brigante', t: 'arrendi' }).err, /non si arrende/i, 'con tutti i PF non si arrende'); assert.match(T.ordina(n, { chi: 'e1', t: 'arrendi' }).err, /non si arrende/i, 'gli eroi non si arrendono'); }

// ---- 11. capi: l'area è annunciata (cella o direzione fissa, area rossa nell'evento) e chi è dentro può uscirne ----
{ const s = scena(['guerriero'], ['re-senza-corona'], { e1: [4, 6], 're-senza-corona': [4, 3] }, { liv: 8 }); const e1 = mostro(s, 'e1'), q0 = { q: e1.q, r: e1.r }, re = mostro(s, 're-senza-corona');
  assert.strictEqual(re.ia.apre, 'm-corona-spezzata'); AIAT.tick(s); const o = s.ordini['re-senza-corona'];
  assert(o && o.t === 'potere' && o.id === 'm-corona-spezzata' && Number.isInteger(o.dir), 'il capo apre con il suo potere ad area e la direzione è fissata: ' + JSON.stringify(o));
  const r = AIAT.avanza(s, 40, { qui: true }); const lancia = r.ev.find((e) => e.t === 'lancia' && e.id === 'm-corona-spezzata');
  assert(lancia && Array.isArray(lancia.zona) && lancia.zona.length >= 3, 'l\'evento «lancia» porta l\'area rossa'); assert(lancia.zona.some((x) => x.q === q0.q && x.r === q0.r), 'e l\'eroe c\'era dentro');
  const colpo = r.ev.find((e) => e.t === 'potere' && e.id === 'm-corona-spezzata');
  assert(!colpo || !colpo.colpiti.includes('e1'), 'l\'eroe guidato dall\'IA è uscito dall\'area prima del colpo');
  assert(r.ev.some((e) => e.t === 'attacca' || e.t === 'potere'), 'e dopo lo scarto riprende a combattere');
  // chi è comandato a mano non si scansa da solo
  const m = scena(['guerriero'], ['re-senza-corona'], { e1: [4, 6], 're-senza-corona': [4, 3] }, { liv: 8 }); ok(T.ordina(m, { chi: 'e1', t: 'ferma' }, { qui: true })); m.ordini.e1 = { t: 'attacca', bers: 're-senza-corona' };   // un ordine a mano
  const rm = AIAT.avanza(m, 40, { qui: true }), col = rm.ev.find((e) => e.t === 'potere' && e.id === 'm-corona-spezzata'); assert(col && col.colpiti.includes('e1'), 'senza IA l\'eroe resta nell\'area e la prende');
  // zonaDi: l'area del lancio in corso, null se nessuno sta lanciando
  const z = scena(['guerriero'], ['re-senza-corona'], { e1: [4, 6], 're-senza-corona': [4, 3] }, { liv: 8 }); assert.strictEqual(T.zonaDi(z, mostro(z, 're-senza-corona')), null);
  AIAT.tick(z); T.passo(z, 2, { qui: true }); const zz = T.zonaDi(z, mostro(z, 're-senza-corona')); assert(Array.isArray(zz) && zz.length >= 3); }

// ---- 12. ordine marcato `ia` anche dopo il lancio (ATEM lo trasforma in «attacca») ----
{ const s = scena(['mago'], ['brigante'], { e1: [4, 8], brigante: [4, 4] }); ok(T.ordina(s, { chi: 'e1', t: 'potere', id: 'scintilla-arcana', bers: 'brigante', ia: true }, { qui: true })); assert.strictEqual(s.ordini.e1.ia, true);
  const r = T.passo(s, 30, { qui: true }); assert(r.ev.some((e) => e.t === 'potere' && e.chi === 'e1')); assert.deepStrictEqual(s.ordini.e1, { t: 'attacca', bers: 'brigante', ia: true });
  const n = scena(['mago'], ['brigante'], { e1: [4, 8], brigante: [4, 4] }); ok(T.ordina(n, { chi: 'e1', t: 'potere', id: 'scintilla-arcana', bers: 'brigante' }, { qui: true })); T.passo(n, 30, { qui: true });
  assert.deepStrictEqual(n.ordini.e1, { t: 'attacca', bers: 'brigante' }, 'un ordine a mano resta a mano'); }

// ---- 13. riproducibilità: stessa battaglia, stesso stato; spezzare il tempo non la cambia ----
{ const base = prepara(nuova(3, 2), SCELTI, true), uno = AIAT.gioca(base).s, due = AIAT.gioca(base).s; assert.strictEqual(hash(uno), hash(due)); assert(uno.t > 100);
  const pezzi = JSON.parse(JSON.stringify(base)); while (!pezzi.over) ok(AIAT.avanza(pezzi, 7, { qui: true })); assert.strictEqual(hash(pezzi), hash(uno), 'a pezzi da 7 istanti dà la stessa battaglia');
  assert.strictEqual(hash(JSON.parse(JSON.stringify(uno))), hash(uno)); assert(JSON.stringify(uno.ia).length < 4000, 'lo stato dell\'IA resta piccolo'); }

// ---- 14. velocità: una battaglia intera con l'IA da entrambe le parti in meno di 200 ms ----
{ const tempi = []; for (const i of [1, 2, 3, 4, 5]) for (const seme of [1, 2, 3]) { const s = prepara(nuova(i, seme), SCELTI, true), t0 = process.hrtime.bigint(); AIAT.gioca(s, { qui: true }); tempi.push(Number(process.hrtime.bigint() - t0) / 1e6); }
  tempi.sort((a, b) => a - b); const med = tempi[tempi.length >> 1]; assert(med < 200, 'mediana ' + med.toFixed(1) + ' ms'); console.log(`  velocità: mediana ${med.toFixed(1)} ms, la più lenta ${tempi[tempi.length - 1].toFixed(1)} ms`); }

// ---- 15. forza (gruppi medi, stessi mostri): giocata solo con gli atteggiamenti il bot bravo vince; il casuale perde ----
{ const SEMI = 30, medi = [1, 2, 3], conta = (f) => { let v = 0, n = 0, stallo = 0; for (const i of medi) for (let seme = 1; seme <= SEMI; seme++) { const s = f(nuova(i, seme), seme); n++; if (s.over.esito === 'vittoria') v++; else if (s.over.esito === 'stallo') stallo++; } return { p: v / n, n, stallo }; };
  const bravo = conta((s) => { prepara(s, SCELTI, false); return AIAT.gioca(s, { qui: true }).s; });         // atteggiamenti scelti, NESSUN «Uso automatico»
  const predef = conta((s) => AIAT.gioca(s, { qui: true }).s);                                               // atteggiamenti di partenza, nessun «Uso automatico»
  const auto = conta((s) => { prepara(s, SCELTI, true); return AIAT.gioca(s, { qui: true }).s; });
  const caso = conta((s, seme) => { const rnd = require('./carica.js').rng(seme); while (!s.over) { AIAT.tick(s, { lato: 'nemici' }); for (const a of BOT.casuale(s, 'eroi', rnd)) T.ordina(s, a, { qui: true }); T.passo(s, 5, { qui: true }); } return s; });
  console.log(`  forza su ${bravo.n} battaglie «medie»: atteggiamenti scelti ${(bravo.p * 100).toFixed(0)}%, di partenza ${(predef.p * 100).toFixed(0)}%, con uso automatico ${(auto.p * 100).toFixed(0)}%, eroi a caso ${(caso.p * 100).toFixed(0)}% (stalli: ${bravo.stallo + predef.stallo + auto.stallo + caso.stallo})`);
  assert(bravo.p >= 0.85, 'solo con gli atteggiamenti il bot bravo vince almeno l\'85%: ' + bravo.p); assert(predef.p >= 0.8, 'anche con gli atteggiamenti di partenza: ' + predef.p); assert(auto.p >= bravo.p - 0.03, 'l\'uso automatico non peggiora');
  assert(caso.p <= 0.4, 'il bot casuale perde: ' + caso.p); assert(bravo.p - caso.p >= 0.4); assert(bravo.stallo + auto.stallo <= 1, 'quasi nessuno stallo'); }

console.log('test_avv_ia_tempo: ok');
