// Battaglia a istanti (Cantari di Ventura, piano B, step B3): riproducibilità, velocità, movimento, ritmo delle armi, lanci e ricariche,
// reazioni, stati e Concentrazione in secondi, attacchi di opportunità, rinforzi, fine, errori, ogni potere usato, due bot su tutte le arene.
const assert = require('assert');
const fs = require('fs'), path = require('path');
const { A, AR, eroe, squadra, aperta, riga, mostro } = require('./avv_aiuti.js');
const T = require('../src/js/motori/27s-avv-tempo.js');
const S = require('../src/js/motori/27d-avv-stati.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const BOT = require('./bot_avv_tempo.js');

const puro = (s) => JSON.parse(JSON.stringify(s));
// hash FNV-1a dello stato di gioco (senza `ev` ed `evn`, che dicono solo com'è stata spezzata l'ultima chiamata)
const hash = (s) => { const t = JSON.stringify(Object.assign({}, s, { ev: null, evn: null })); let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const ok = (r, msg) => { assert(!r.err, (msg || '') + ' → ' + r.err); return r; };
// scena su un'arena aperta: tutti già partiti (niente ritardo d'iniziativa), posizioni date come [colonna, riga]
function scena(squad, nem, posiz, o) {
  o = o || {}; const s = T.nuovo(squad, nem, o.arena || aperta(), { seme: o.seme || 3, tMax: o.tMax });
  for (const c of s.cb) { c.via = 0; c.pronto = 0; }
  for (const [id, [col, rg]] of Object.entries(posiz)) { const c = mostro(s, id), q = G.daOffset(col, rg); c.q = q.q; c.r = q.r; }
  return s;
}
// avanza finché `f(evento, s)` è vero per un evento (o fino a `max` istanti); restituisce { s, e, ev } con tutti gli eventi visti
function finche(s, f, max) { const ev = []; for (let n = 0; n < (max || 300) && !s.over; n++) { const r = ok(T.passo(s, 1)); s = r.s; ev.push(...r.ev); const e = r.ev.find((x) => f(x, s)); if (e) return { s, e, ev }; } return { s, e: null, ev }; }
const dai = (s, id, ...p) => { const c = mostro(s, id); for (const x of p) if (!c.poteri.includes(x)) c.poteri.push(x); return c; };
const nem3 = ['brigante', 'brigante', 'brigante'];
const INCONTRI = [
  [1, 2, ['lupo-grigio', 'lupo-grigio']],
  [2, 3, ['brigante', 'brigante', 'arciere-bandito']],
  [2, 4, ['brigante', 'brigante', 'arciere-bandito', 'tagliagole']],
  [3, 4, ['brigante', 'tagliagole', 'cerusico-di-strada', 'stregone-rinnegato']],
  [3, 4, ['scheletro-armato', 'scheletro-armato', 'arciere-scheletro', 'ghoul-di-tomba']],
  [4, 4, ['anima-in-pena', 'officiante-spolpato', 'scheletro-armato', 'statua-vivente']]];
const nuova = (i, seme) => { const [liv, n, nem] = INCONTRI[i]; return T.nuovo(squadra(n, liv), nem, AR.genera(seme, AR.AMBIENTI[(i + seme) % AR.AMBIENTI.length]), { seme }); };

// ---- 0. niente caso né orologi nei motori del tempo reale ----
{ for (const f of ['27s-avv-tempo.js', '27d-avv-stati.js', '27e-avv-poteri.js', '27g-avv-griglia.js', '27a-avv-dadi.js']) {
    const t = fs.readFileSync(path.join(__dirname, '../src/js/motori', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert(!/Math\.random|Date\.now|performance\.now|Math\.(sin|cos|tan|atan2?)\b/.test(t), f + ': niente Math.random, orologi o trigonometria'); } }

// ---- 1. tempi dei poteri e ritmo delle armi (APOT.tempi, APOT.ritmo) ----
{ const P = A.P; let azioni = 0;
  for (const p of Object.values(P)) { const t = A.tempi(p);
    if (p.id === 'attacco') assert.deepStrictEqual(t, { lancio: 0, ricarica: 0 });
    else if (p.costo === 'reazione') assert.deepStrictEqual(t, { lancio: 0, ricarica: 60 }, p.id);
    else if (p.costo === 'bonus') assert.deepStrictEqual(t, { lancio: 0, ricarica: 30 }, p.id);
    else { assert(t.lancio >= 6 && t.lancio <= 15 && t.ricarica === 60, p.id + ': lancio 0,6–1,5 s, ricarica 6 s'); azioni++; } }
  assert(azioni > 40);
  const h = (arma) => ({ equip: { arma } });
  assert.strictEqual(A.ritmo({ tipo: 'eroe' }, h('pugnali')), 12); assert.strictEqual(A.ritmo({ tipo: 'eroe' }, h('spada-lunga')), 16); assert.strictEqual(A.ritmo({ tipo: 'eroe' }, h('spadone')), 22);
  const s = T.nuovo(squadra(4, 2), nem3, AR.genera(1, 'strada'), { seme: 1 });
  for (const c of s.cb) assert([12, 16, 22].includes(c.ritmo), c.id + ' ha un ritmo'); }

// ---- 2. stati in secondi: t turni → 6 t s, danno nel tempo ogni 6 s, rinnovo con la durata più lunga ----
{ const s = scena(squadra(1, 3), ['brigante'], { e1: [4, 8], brigante: [4, 1] }), c = mostro(s, 'e1'), rnd = require('../src/js/motori/27a-avv-dadi.js').gen({ rng: 5 });
  c.hp = 200; c.hpMax = 200; S.aggiungi(c, 'in-fiamme', 2); S.aggiungi(c, 'benedetto', 1); let dot = 0;
  for (let i = 1; i <= 120; i++) { const ev = S.scorri(c, rnd); dot += ev.filter((e) => e.t === 'dot').length;
    if (i === 59) assert(S.ha(c, 'benedetto'), 'un turno = 6 s');
    if (i === 60) assert(!S.ha(c, 'benedetto') && S.ha(c, 'in-fiamme'), 'finito dopo 60 istanti');
    if (i === 90) { assert.strictEqual(S.trova(c, 'in-fiamme').t, 1, 't = turni che restano'); S.aggiungi(c, 'in-fiamme', 2); } }
  assert(S.ha(c, 'in-fiamme') && S.trova(c, 'in-fiamme').ist === 90, 'il rinnovo riporta a 2 turni pieni');
  assert.strictEqual(dot, 2, 'un danno nel tempo ogni 6 s'); }

// ---- 3. movimento: mov/3 caselle al secondo, terreno difficile doppio, percorso intorno agli ostacoli, una creatura per esagono ----
{ const s0 = scena(squadra(1, 3), ['brigante'], { e1: [1, 8], brigante: [8, 0] }), c0 = mostro(s0, 'e1'); assert.strictEqual(c0.mov, 6);
  let s = ok(T.ordina(s0, { chi: 'e1', t: 'vai', a: G.daOffset(5, 8) })).s; const pos = (s) => G.aOffset(mostro(s, 'e1').q, mostro(s, 'e1').r).col;
  s = ok(T.passo(s, 1)).s; assert.strictEqual(pos(s), 2, 'parte subito e occupa già la cella nuova'); assert.deepStrictEqual(mostro(s, 'e1').mv, { da: G.daOffset(1, 8), k: 0, n: 30 });
  s = ok(T.passo(s, 15)).s; assert.strictEqual(pos(s), 5, 'una casella ogni 5 istanti: 2 al secondo'); assert(mostro(s, 'e1').mv);
  s = ok(T.passo(s, 5)).s; assert(!s.ordini.e1 && mostro(s, 'e1').mv === null, 'arrivato: l\'ordine è fatto');
  // terreno difficile: 10 istanti a casella
  const dif = aperta(Array.from({ length: 11 }, () => ',,,,,,,,,')), d0 = scena(squadra(1, 3), ['brigante'], { e1: [0, 8], brigante: [8, 0] }, { arena: dif });
  let d = ok(T.ordina(d0, { chi: 'e1', t: 'vai', a: G.daOffset(4, 8) })).s; d = ok(T.passo(d, 20)).s; assert.strictEqual(G.aOffset(mostro(d, 'e1').q, mostro(d, 'e1').r).col, 2, 'difficile: metà velocità');
  // rallentato: metà velocità
  const r0 = scena(squadra(1, 3), ['brigante'], { e1: [0, 8], brigante: [8, 0] }); S.aggiungi(mostro(r0, 'e1'), 'rallentato', 3);
  let r = ok(T.ordina(r0, { chi: 'e1', t: 'vai', a: G.daOffset(6, 8) })).s; r = ok(T.passo(r, 20)).s; assert.strictEqual(G.aOffset(mostro(r, 'e1').q, mostro(r, 'e1').r).col, 2, 'rallentato: metà velocità');
  // un muro in mezzo: lo aggira; nessuno finisce mai nella cella di un altro
  const muro = aperta(riga(6, '###.#####')), m0 = scena(squadra(2, 3), ['brigante'], { e1: [1, 8], e2: [2, 8], brigante: [8, 0] }, { arena: muro });
  let m = ok(T.ordina(m0, [{ chi: 'e1', t: 'vai', a: G.daOffset(1, 3) }, { chi: 'e2', t: 'vai', a: G.daOffset(1, 3) }])).s;
  for (let i = 0; i < 80; i++) { m = ok(T.passo(m, 1)).s; const k = m.cb.filter(T.inCampo).map((x) => x.q + ',' + x.r); assert.strictEqual(new Set(k).size, k.length, 'una creatura per esagono'); }
  const meta = G.daOffset(1, 3), [primo, secondo] = ['e1', 'e2'].map((id) => mostro(m, id)).sort((x, y) => G.dist(x, meta) - G.dist(y, meta));
  assert.strictEqual(G.dist(primo, meta), 0, 'uno arriva passando dal varco'); assert(G.dist(secondo, meta) === 1 && !m.ordini.e1 && !m.ordini.e2, 'chi trova la meta occupata si ferma accanto'); }

// ---- 4. ritmo dell'arma, Concentrazione per 6 s, chi non ha ordini colpisce da solo ----
{ const s0 = scena(squadra(1, 3), ['brigante'], { e1: [4, 5], brigante: [4, 4] }), c = mostro(s0, 'e1'), b = mostro(s0, 'brigante'); b.hp = b.hpMax = 999; c.hp = c.hpMax = 999;
  assert.strictEqual(c.ritmo, 16, 'spada lunga: 1,6 s');
  const { ev } = finche(s0, () => false, 64); const colpi = ev.filter((e) => e.t === 'attacca' && e.chi === 'e1').map((e) => e.i);
  assert.deepStrictEqual(colpi, [1, 17, 33, 49], 'senza ordini colpisce il nemico a contatto, a ritmo fisso');
  assert(ev.some((e) => e.t === 'attacca' && e.chi === 'brigante'), 'anche il nemico');
  const conc0 = c.conc; assert(conc0 >= 1); let s = ok(T.ordina(s0, { chi: 'e1', t: 'conc' })).s; const f = finche(s, (e) => e.t === 'conc-spesa', 3);
  s = f.s; assert.strictEqual(mostro(s, 'e1').conc, conc0 - 1); assert.strictEqual(mostro(s, 'e1').concT, s.t + 60, 'Concentrazione accesa per 6 s');
  const tiri = finche(s, () => false, 59).ev.filter((e) => e.t === 'tiro' && e.chi === 'e1'); assert(tiri.length >= 3 && tiri.every((e) => e.vant), 'nei 6 s ogni attacco ha vantaggio'); }

// ---- 5. lancio, interruzione, ricarica e cariche ----
{ const mk = () => { const s = scena([{ eroe: eroe('mago', 5), dist: 0 }], nem3, { e1: [4, 8], 'brigante#1': [4, 4], 'brigante#2': [2, 1], 'brigante#3': [6, 1] }); dai(s, 'e1', 'sfera-di-fiamme', 'scintilla-arcana'); return s; };
  // un lancio va a buon fine dopo il suo tempo, spende la carica, poi 6 s di ricarica
  let s = ok(T.ordina(mk(), { chi: 'e1', t: 'potere', id: 'sfera-di-fiamme', bers: 'brigante#1' })).s;
  let f = finche(s, (e) => e.t === 'lancia'); assert.strictEqual(f.e.fine - f.e.i, 11, 'sfera: 1,1 s di lancio');
  f = finche(f.s, (e) => e.t === 'potere'); assert.strictEqual(f.e.i, 12); const c = mostro(f.s, 'e1');
  assert.strictEqual(c.usi['sfera-di-fiamme'], 1, 'carica spesa'); assert.strictEqual(c.ric['sfera-di-fiamme'], f.s.t + 60);
  assert.strictEqual(T.ricarica(f.s, c, 'sfera-di-fiamme').resta, 60); assert.deepStrictEqual(f.s.ordini.e1, { t: 'attacca', bers: 'brigante#1' }, 'poi continua sul bersaglio');
  // un ordine nuovo durante il lancio lo interrompe: niente carica spesa
  s = ok(T.ordina(mk(), { chi: 'e1', t: 'potere', id: 'sfera-di-fiamme', bers: 'brigante#1' })).s; s = ok(T.passo(s, 5)).s; assert(mostro(s, 'e1').lancio);
  const r = ok(T.ordina(s, { chi: 'e1', t: 'vai', a: G.daOffset(3, 9) })); assert(r.ev.some((e) => e.t === 'interrotto' && e.motivo === 'nuovo ordine'));
  assert(!mostro(r.s, 'e1').lancio && !mostro(r.s, 'e1').usi['sfera-di-fiamme'], 'interrotto: carica intatta');
  // stordito durante il lancio: interrotto
  s = ok(T.ordina(mk(), { chi: 'e1', t: 'potere', id: 'sfera-di-fiamme', bers: 'brigante#1' })).s; s = ok(T.passo(s, 4)).s; S.aggiungi(mostro(s, 'e1'), 'stordito', 1);
  f = finche(s, (e) => e.t === 'interrotto', 3); assert(f.e && f.e.motivo === 'non può agire');
  // fuori portata: prima si avvicina, poi lancia; carica esaurita = ordine rifiutato
  s = scena([{ eroe: eroe('mago', 5), dist: 0 }], nem3, { e1: [4, 10], 'brigante#1': [4, 0], 'brigante#2': [0, 0], 'brigante#3': [8, 0] }); dai(s, 'e1', 'sfera-di-fiamme');
  s = ok(T.ordina(s, { chi: 'e1', t: 'potere', id: 'sfera-di-fiamme', bers: 'brigante#1' })).s; const da = G.dist(mostro(s, 'e1'), mostro(s, 'brigante#1'));
  f = finche(s, (e) => e.t === 'lancia'); assert(G.dist(mostro(f.s, 'e1'), mostro(f.s, 'brigante#1')) < da, 'si è avvicinato');
  mostro(f.s, 'e1').usi['scintilla-arcana'] = 0; mostro(f.s, 'e1').lancio = null; mostro(f.s, 'e1').usi['sfera-di-fiamme'] = 9;
  assert.strictEqual(T.ordina(f.s, { chi: 'e1', t: 'potere', id: 'sfera-di-fiamme', bers: 'brigante#1' }).err, 'Cariche esaurite');
  // bonus: istantaneo, non tocca l'ordine principale (disimpegno: niente attacchi di opportunità per 6 s)
  s = scena([{ eroe: eroe('ladro', 3), dist: 0 }], ['brigante'], { e1: [4, 5], brigante: [4, 4] }); dai(s, 'e1', 'finta-e-sparisci');
  s = ok(T.ordina(s, [{ chi: 'e1', t: 'vai', a: G.daOffset(4, 9) }, { chi: 'e1', t: 'potere', id: 'finta-e-sparisci' }])).s; assert(s.ordini.e1 && s.rapidi.e1);
  f = finche(s, (e) => e.t === 'potere', 2); assert.strictEqual(f.e.i, 1, 'il bonus parte subito'); assert(f.s.ordini.e1, 'l\'ordine principale resta'); assert.strictEqual(mostro(f.s, 'e1').disT, 61);
  f = finche(f.s, (e) => e.t === 'opportunita', 30); assert(!f.e, 'disimpegnato: nessun attacco di opportunità'); }

// ---- 6. attacchi di opportunità e reazioni automatiche ----
{ const s0 = scena(squadra(1, 3), ['brigante'], { e1: [4, 5], brigante: [4, 4] }); mostro(s0, 'brigante').pronto = 999;
  let s = ok(T.ordina(s0, { chi: 'e1', t: 'vai', a: G.daOffset(4, 9) })).s, f = finche(s, (e) => e.t === 'opportunita', 3);
  assert(f.e && f.e.chi === 'brigante' && f.e.bers === 'e1' && f.e.i === 1, 'uscendo dalla portata il nemico colpisce'); assert(f.ev.some((e) => e.t === 'attacca' && e.chi === 'brigante'));
  assert.strictEqual(mostro(f.s, 'brigante').reaT, 61, 'la reazione torna dopo 6 s');
  // riduzione automatica (parata), poi ricarica
  const p0 = scena([{ eroe: eroe('guerriero', 5), dist: 0 }], ['tagliagole'], { e1: [4, 5], tagliagole: [4, 4] }, { seme: 5 }); dai(p0, 'e1', 'parata'); mostro(p0, 'e1').pronto = 9999;
  mostro(p0, 'e1').hp = mostro(p0, 'e1').hpMax = 999; mostro(p0, 'tagliagole').ritmo = 4;
  f = finche(p0, (e) => e.t === 'reazione' && e.chi === 'e1', 400); assert(f.e, 'la parata scatta da sola'); assert.strictEqual(f.e.potere, 'parata');
  const pr = mostro(f.s, 'e1'); assert.strictEqual(pr.reaT, f.e.i + 60); assert.strictEqual(pr.ric.parata, f.e.i + 60);
  const di = f.ev.findIndex((e) => e === f.e); assert(f.ev.slice(di).some((e) => e.t === 'riduci'));
  const g = finche(f.s, (e) => e.t === 'reazione' && e.chi === 'e1', 59); assert(!g.e, 'nessuna seconda reazione in 6 s'); }

// ---- 7. rinforzi dal bordo, sorpresa, stallo, fuga, vittoria e sconfitta ----
{ const sq = [{ eroe: eroe('guerriero', 3), dist: 0 }, { eroe: eroe('chierico', 3), dist: 2 }];
  let s = T.nuovo(sq, nem3, AR.genera(2, 'strada'), { seme: 2 }); const c2 = mostro(s, 'e2'); assert(c2.fuori && c2.q === null); assert.deepStrictEqual(s.riserva, [{ id: 'e2', t: 60 }]);
  const f = finche(s, (e) => e.t === 'arriva', 80); assert(f.e && f.e.i === 60 && f.e.chi === 'e2', 'arriva dopo 2 × 3 s'); assert(s.arena.uscite.some((u) => u.q === f.e.q && u.r === f.e.r), 'dal bordo');
  assert(mostro(f.s, 'e2').via >= 60 && mostro(f.s, 'e2').via <= 70, 'riparte con la sua iniziativa');
  const nm = T.nuovo(squadra(1, 3), ['brigante', { def: 'brigante', dist: 1 }], AR.genera(2, 'strada'), { seme: 2 }); assert.deepStrictEqual(nm.riserva, [{ id: 'brigante#2', t: 30 }], 'anche i nemici rinforzano');
  // sorpresa: la parte sorpresa parte 6 s dopo
  const sp = T.nuovo(squadra(2, 3), nem3, AR.genera(2, 'strada'), { seme: 2, sorpresa: 'nemici' }); assert(sp.cb.filter((c) => c.lato === 'nemici').every((c) => c.via >= 60) && sp.cb.filter((c) => c.lato === 'eroi').every((c) => c.via <= 10));
  // stallo: nessuno si cerca
  let st = scena(squadra(1, 3), ['brigante'], { e1: [4, 9], brigante: [4, 1] }, { tMax: 50 }); st = ok(T.passo(st, 999)).s; assert.deepStrictEqual(st.over, { esito: 'stallo', t: 50 });
  assert.strictEqual(T.passo(st, 1).err, 'Battaglia finita'); assert.strictEqual(T.ordina(st, { chi: 'e1', t: 'ferma' }).err, 'Battaglia finita');
  // fuga: tutti gli eroi escono dal bordo
  let fu = T.nuovo(squadra(2, 3), nem3, AR.genera(4, 'strada'), { seme: 4 }); fu = ok(T.ordina(fu, [{ chi: 'e1', t: 'fuggi' }, { chi: 'e2', t: 'fuggi' }])).s;
  const ff = finche(fu, (e) => e.t === 'fine', 400); assert.strictEqual(ff.s.over.esito, 'fuga'); assert(ff.ev.filter((e) => e.t === 'fuggito').length >= 1);
  // vittoria e sconfitta coi bot
  const v = BOT.gioca(nuova(2, 1), { eroi: 'bravo', nemici: 'bravo' }).s; assert.strictEqual(v.over.esito, 'vittoria');
  const sc = BOT.gioca(T.nuovo(squadra(1, 1), ['tagliagole', 'brigante', 'brigante'], AR.genera(1, 'strada'), { seme: 1 }), { eroi: 'bravo', nemici: 'bravo' }).s; assert.strictEqual(sc.over.esito, 'sconfitta'); }

// ---- 8. ordini non validi: { err } e lo stato passato non cambia ----
{ const s = scena([{ eroe: eroe('mago', 3), dist: 0 }, { eroe: eroe('chierico', 3), dist: 0 }], nem3, { e1: [4, 8], e2: [5, 8], 'brigante#1': [4, 4], 'brigante#2': [2, 1], 'brigante#3': [6, 1] }), prima = JSON.stringify(s);
  const e = (o) => T.ordina(s, o).err;
  assert.strictEqual(e(null), 'Ordine non valido'); assert.strictEqual(e({ chi: 'x9', t: 'ferma' }), 'Combattente sconosciuto');
  assert.strictEqual(e({ chi: 'e1', t: 'balla' }), 'Ordine sconosciuto'); assert.strictEqual(e({ chi: 'e1', t: 'vai', a: { q: 99, r: 99 } }), 'Lì non si può andare');
  assert.strictEqual(e({ chi: 'e1', t: 'attacca', bers: 'e2' }), 'Serve un nemico in piedi'); assert.strictEqual(e({ chi: 'e1', t: 'potere', id: 'nessuno' }), 'Potere sconosciuto');
  assert.strictEqual(e({ chi: 'e1', t: 'potere', id: 'colpo-possente', bers: 'brigante#1' }), 'Non conosci questo potere');
  assert.strictEqual(e({ chi: 'e1', t: 'oggetto', id: 'spada-lunga' }), 'Non si può usare in battaglia'); assert.strictEqual(e({ chi: 'e1', t: 'rialza', bers: 'e2' }), 'Serve un alleato a terra');
  dai(s, 'e1', 'parata', 'scintilla-arcana'); const prima2 = JSON.stringify(s);
  assert.strictEqual(e({ chi: 'e1', t: 'potere', id: 'parata' }), 'È una reazione: scatta da sola quando serve');
  assert.strictEqual(e({ chi: 'e1', t: 'potere', id: 'scintilla-arcana', bers: 'e2' }), 'Scegli un bersaglio adatto');
  assert.strictEqual(e([{ chi: 'e1', t: 'ferma' }, { chi: 'e2', t: 'attacca', bers: 'nessuno' }]), 'Serve un nemico in piedi', 'una lista si rifiuta intera');
  const cc = mostro(s, 'e1').conc; mostro(s, 'e1').conc = 0; assert.strictEqual(e({ chi: 'e1', t: 'conc' }), 'Non hai Concentrazione'); mostro(s, 'e1').conc = cc;
  assert.strictEqual(JSON.stringify(s), prima2, 'ordina non tocca lo stato passato'); assert.notStrictEqual(prima, prima2);
  assert.strictEqual(T.passo(s, 0).err, 'Quanti istanti?'); assert.strictEqual(T.passo({}, 1).err, 'Stato non valido');
  assert.throws(() => T.nuovo([], nem3, aperta()), /compagnia/); assert.throws(() => T.nuovo(squadra(1, 1), [], aperta()), /nemici/); }

// ---- 9. ogni potere del catalogo (tranne le reazioni, che scattano da sole) usato davvero senza errori ----
{ const ids = Object.keys(A.P).filter((i) => A.P[i].costo !== 'reazione' && i !== 'attacco'); let provati = 0;
  for (const id of ids) { const p = A.P[id];
    const s = scena([{ eroe: eroe('guerriero', 5), dist: 0 }, { eroe: eroe('chierico', 5), dist: 0 }], nem3, { e1: [4, 6], e2: [5, 6], 'brigante#1': [4, 4], 'brigante#2': [3, 4], 'brigante#3': [5, 4] });
    const e1 = dai(s, 'e1', id); e1.hp = e1.hpMax - 5; const e2 = mostro(s, 'e2'); if (p.bers === 'terra') { e2.hp = 0; S.cade(e2); }
    for (const c of s.cb) if (c.lato === 'nemici') c.pronto = 9999;
    const o = { chi: 'e1', t: 'potere', id }; if (['nemico', 'nemici'].includes(p.bers) && p.area !== 'aura') o.bers = 'brigante#1'; else if (['alleato', 'amico', 'terra'].includes(p.bers)) o.bers = 'e2';
    if (p.area === 'aura' && ['nemico', 'nemici'].includes(p.bers)) o.bers = 'brigante#1';
    const f = finche(ok(T.ordina(s, o), id).s, (e) => e.t === 'potere' && e.chi === 'e1', 80);
    assert(f.e && f.e.id === id, id + ': usato (eventi: ' + f.ev.filter((x) => x.chi === 'e1').map((x) => x.t + (x.motivo ? ':' + x.motivo : '')).join(',') + ')');
    assert(!f.ev.some((x) => x.chi === 'e1' && ['fallito', 'annullato'].includes(x.t)), id + ': senza errori');
    const c = mostro(f.s, 'e1'); if (p.ric !== 'turno') assert.strictEqual(c.usi[id], 1, id + ': una carica in meno');
    assert.strictEqual(c.ric[id], f.e.i + A.tempi(p).ricarica, id + ': ricarica');
    const contro = ['nemico', 'nemici'].includes(p.bers); for (const x of f.e.colpiti) assert.strictEqual(mostro(f.s, x).lato === 'nemici', contro, id + ': colpisce la parte giusta');
    assert.deepStrictEqual(puro(f.s), f.s); provati++; }
  assert(provati >= 85, 'poteri provati: ' + provati); }

// ---- 10. riproducibilità: stessi ordini negli stessi istanti ⇒ stesso hash; un passo lungo = tanti passi corti; si riprende da un salvataggio ----
{ for (const i of [2, 3, 4]) {
    const base = nuova(i, 5), g1 = BOT.gioca(puro(base), { eroi: 'bravo', nemici: 'bravo' }), g2 = BOT.gioca(puro(base), { eroi: 'bravo', nemici: 'bravo' });
    assert.strictEqual(hash(g1.s), hash(g2.s), 'stessa battaglia, stesso hash');
    // rigioca il registro degli ordini su uno stato nuovo, salvando e riprendendo a metà
    let s = puro(base), k = 0; const meta = Math.floor(g1.s.t / 2);
    while (!s.over) { while (k < g1.registro.length && g1.registro[k][0] === s.t) s = ok(T.ordina(s, g1.registro[k++][1])).s;
      const prossimo = k < g1.registro.length ? g1.registro[k][0] : s.t + 9999; let n = Math.max(1, prossimo - s.t); if (s.t < meta && s.t + n > meta) n = meta - s.t;
      s = ok(T.passo(s, n)).s; if (s.t === meta) s = JSON.parse(JSON.stringify(s)); }
    assert.strictEqual(hash(s), hash(g1.s), 'il registro rigiocato a passi diversi dà lo stesso finale');
    assert(!s.ev.some((e) => e.i == null), 'ogni evento sa il suo istante'); }
  // 3000 istanti col bot casuale da tutte e due le parti e PF moltiplicati per 20 (così non finisce prima): stesso hash
  const b0 = nuova(5, 2); b0.opz.tMax = 3000; for (const c of b0.cb) c.hp = c.hpMax = c.hpMax * 20; const lungo = () => BOT.gioca(puro(b0), { eroi: 'casuale', nemici: 'casuale' }, { seme: 11 }).s;
  const a = lungo(), b = lungo(); assert.strictEqual(hash(a), hash(b)); assert.strictEqual(a.t, 3000, 'arriva a 3000 istanti'); }

// ---- 11. due bot si combattono dall'inizio alla fine su tutte le arene; velocità (< 200 ms a battaglia) ----
{ const arene = AR.AMBIENTI.map((amb, k) => ({ nome: amb, a: AR.genera(k + 1, amb), nem: INCONTRI[3 + (k % 3)][2], liv: 3 }))
    .concat(Object.keys(AR.CAPI).map((d) => ({ nome: d, a: AR.capo(d), nem: [d], liv: 5 })));
  const tempi = []; let finite = 0;
  for (const x of arene) for (const seme of [1, 2]) { const s = T.nuovo(squadra(4, x.liv), x.nem, x.a, { seme });
    const t0 = process.hrtime.bigint(), g = BOT.gioca(s, { eroi: 'bravo', nemici: 'bravo' }, { seme }); tempi.push(Number(process.hrtime.bigint() - t0) / 1e6);
    assert(['vittoria', 'sconfitta'].includes(g.s.over.esito), x.nome + ': finisce davvero (' + g.s.over.esito + ')'); assert(g.ordini > 5); finite++;
    for (const c of g.s.cb) if (T.inCampo(c)) assert(G.passabile(x.a, c), x.nome + ': nessuno dentro un muro'); }
  tempi.sort((a, b) => a - b); const med = tempi[tempi.length >> 1];
  assert(med < 200, 'una battaglia intera simulata in meno di 200 ms (mediana ' + med.toFixed(1) + ' ms)');
  console.log(`  arene: ${finite} battaglie su ${arene.length} arene, mediana ${med.toFixed(1)} ms, la più lenta ${tempi[tempi.length - 1].toFixed(1)} ms`); }

// ---- 12. forza: il bot bravo vince, il casuale perde (gruppi medi, stessi mostri) ----
{ const prova = (eroi) => { let v = 0, n = 0; for (const i of [1, 2, 3]) for (let seme = 1; seme <= 6; seme++) { n++; if (BOT.gioca(nuova(i, seme), { eroi, nemici: 'bravo' }, { seme }).s.over.esito === 'vittoria') v++; } return v / n; };
  const bravo = prova('bravo'), caso = prova('casuale');
  assert(bravo >= 0.7, 'il bot bravo vince: ' + bravo); assert(caso <= 0.35, 'il bot casuale perde: ' + caso);
  console.log(`  forza: bravo vince ${(bravo * 100).toFixed(0)}%, casuale ${(caso * 100).toFixed(0)}%`); }

console.log('test_avv_tempo: ok');
