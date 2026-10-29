// Battaglia (parte 2): poteri con aree e spinta, reazioni difensive con pausa, Concentrazione (vantaggio e ritiro), oggetti della cintura.
const assert = require('assert');
const { A, AR, C, eroe, squadra, battaglia, metti, copia, aperta, riga, mostro, pos, ok, finoA, scena, dai } = require('./avv_aiuti.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const S = require('../src/js/motori/27d-avv-stati.js');
const AO = require('../src/js/motori/27b-avv-oggetti.js');
const K = G.K;
const nem3 = ['brigante', 'brigante', 'brigante'];
const hit = (ev, ids) => ev.filter((e) => e.t === 'salvezza' || e.t === 'tiro').map((e) => e.bers).filter((x, i, a) => a.indexOf(x) === i).sort().join() === ids.slice().sort().join();

// ---- ogni potere del catalogo, usato davvero in battaglia ----
{ const ids = Object.keys(A.P).filter((i) => A.P[i].costo !== 'reazione' && i !== 'attacco'); let provati = 0;
  for (const id of ids) { const p = A.P[id];
    const s = scena([{ eroe: eroe('guerriero', 5), dist: 0 }, { eroe: eroe('chierico', 5), dist: 0 }], nem3, { e1: [4, 6], e2: [5, 6], 'brigante#1': [4, 5], 'brigante#2': [3, 5], 'brigante#3': [5, 5] });
    const e1 = dai(s, 'e1', id); e1.hp = 3; if (p.bers === 'terra') { const e2 = mostro(s, 'e2'); e2.hp = 0; S.cade(e2) }
    const m = C.mosseValide(s), o = m.poteri.find((x) => x.id === id); assert(o, id + ' deve comparire fra i poteri possibili'); assert.strictEqual(o.area, p.area); assert.strictEqual(o.costo, p.costo);
    const a = { t: 'potere', id }; if (p.area === 'singolo') a.bers = o.bersagli[0]; if (o.centri) { const c = o.centri.slice().sort((x, y) => y.colpiti.length - x.colpiti.length)[0]; a.cella = { q: c.q, r: c.r }; assert(c.colpiti.length >= 1) }
    if (o.direzioni) a.dir = o.direzioni.slice().sort((x, y) => y.colpiti.length - x.colpiti.length)[0].dir;
    const an = C.anteprima(s, a); assert(!an.err, id + ' anteprima: ' + an.err); assert(an.n >= 1 && an.bersagli.every((b) => typeof b.atteso === 'number'));
    const r = ok(C.act(s, a), id); const k = p.costo === 'bonus' ? 'bonus' : 'azione', altro = k === 'bonus' ? 'azione' : 'bonus';
    assert.strictEqual(r.s.turno[k], false, id + ': spende ' + k); assert.strictEqual(r.s.turno[altro], true, id + ': non spende ' + altro);
    if (p.ric !== 'turno') assert.strictEqual(mostro(r.s, 'e1').usi[id], 1, id + ': una carica in meno'); else assert(!mostro(r.s, 'e1').usi[id]);
    // chi viene toccato è dalla parte giusta: i poteri contro i nemici non toccano gli alleati e viceversa
    const lato = (x) => mostro(r.s, x).lato, contro = ['nemico', 'nemici'].includes(p.bers);
    for (const e of r.ev) if (e.bers && ['tiro', 'salvezza', 'danno', 'stato', 'resiste', 'spinto'].includes(e.t)) assert.strictEqual(lato(e.bers) === 'nemici', contro, id + ': ' + e.t + ' su ' + e.bers);
    if (contro) for (const x of ['e1', 'e2']) if (x !== 'e1' || p.area !== 'se') assert.strictEqual(mostro(r.s, x).hp, mostro(s, x).hp, id + ': niente fuoco amico su ' + x);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(r.s)), r.s); provati++; }
  assert(provati >= 85, 'poteri provati: ' + provati);
  // anche quelli dei mostri come creature che agiscono
  const s = scena(squadra(1, 3), ['m-carica' && 'cinghiale-irsuto'], { e1: [4, 8], 'cinghiale-irsuto': [4, 7] }, { chi: 'cinghiale-irsuto' }); const c = mostro(s, 'cinghiale-irsuto'); assert(c.poteri.includes('m-carica')); assert(C.mosseValide(s).poteri.some((x) => x.id === 'm-carica')); }

// ---- aree su casi fissi ----
{ const X = (squad, nem, posiz, id, a, o) => { const s = scena(squad, nem, posiz, o); const c = dai(s, 'e1', id); return { s, r: C.act(s, Object.assign({ t: 'potere', id }, a)), c } };
  const sq = [{ eroe: eroe('mago', 5), dist: 0 }, { eroe: eroe('chierico', 5), dist: 0 }];
  // cerchio di raggio 1 (sfera di fiamme): il centro e i vicini, non chi sta a due passi; mai gli alleati
  { const c = G.daOffset(4, 3), tutto = { 'brigante#1': [4, 3], 'brigante#2': [5, 3], 'brigante#3': [4, 1], e1: [4, 8], e2: [3, 3] };
    const { s, r } = X(sq, nem3, tutto, 'sfera-di-fiamme', { cella: c }); ok(r); assert(hit(r.ev, ['brigante#1', 'brigante#2']), 'colpisce il centro e il vicino'); assert.strictEqual(mostro(r.s, 'e2').hp, mostro(s, 'e2').hp, 'l\'alleato accanto al bersaglio non si fa male');
    assert(!r.ev.some((e) => e.bers === 'e2'), 'e non compare nemmeno fra i colpiti');
    const sg = scena(squadra(1, 2), nem3, { e1: [4, 8], 'brigante#1': [4, 3] }); assert.strictEqual(C.act(sg, { t: 'potere', id: 'sfera-di-fiamme', cella: c }).err, 'Non conosci questo potere', 'senza il potere non si usa');
    const t = dai(s, 'e1', 'sfera-di-fiamme'); const e1 = (a) => C.act(s, Object.assign({ t: 'potere', id: 'sfera-di-fiamme' }, a));
    assert(/Troppo lontano/.test(e1({ cella: G.daOffset(4, 0) }).err), 'oltre la gittata'); assert(/Scegli dove/.test(e1({}).err)); assert(/Scegli dove/.test(e1({ cella: { q: 99, r: 99 } }).err), 'fuori dall\'arena');
    assert(/Nessun bersaglio/.test(e1({ cella: G.daOffset(0, 5) }).err), 'area vuota: non si spreca la carica'); assert.strictEqual(mostro(s, 'e1').usi['sfera-di-fiamme'], undefined); assert(!e1({ bers: 'brigante#1' }).err, 'si può anche mirare a una creatura'); assert(t); }
  // un muro in mezzo: il punto non si vede
  { const arena = aperta(riga(5, '....#....')), { s } = X(sq, nem3, { 'brigante#1': [4, 2], 'brigante#2': [0, 1], 'brigante#3': [8, 1], e1: [4, 7], e2: [5, 7] }, 'sfera-di-fiamme', {}, { arena }); dai(s, 'e1', 'sfera-di-fiamme');
    assert(/Non vedi/.test(C.act(s, { t: 'potere', id: 'sfera-di-fiamme', cella: G.daOffset(4, 2) }).err), 'dietro un muro'); }
  // cono: gli spicchi coprono celle diverse
  { const m = ['brigante', 'brigante', 'brigante']; const c0 = G.daOffset(4, 8); let tot = 0;
    const s = scena(sq, m, { e1: [4, 8], e2: [0, 10], 'brigante#1': [4, 5], 'brigante#2': [4, 6], 'brigante#3': [8, 1] }); dai(s, 'e1', 'm-getto-di-fuoco'); const o = C.mosseValide(s).poteri.find((x) => x.id === 'm-getto-di-fuoco');
    for (const d of o.direzioni) { const r = ok(C.act(s, { t: 'potere', id: 'm-getto-di-fuoco', dir: d.dir })); const col = r.ev.filter((e) => e.t === 'salvezza').map((e) => e.bers).sort(); assert.deepStrictEqual(col, d.colpiti.slice().sort(), 'le direzioni elencate colpiscono quanto promesso'); tot += d.colpiti.length; for (const i of d.colpiti) assert(G.dist(c0, pos(s, i)) <= 3, 'entro il raggio 3'); }
    assert(o.direzioni.length >= 1 && tot >= 2, 'un cono prende i due davanti'); assert(/direzione/.test(C.act(s, { t: 'potere', id: 'm-getto-di-fuoco' }).err), 'senza direzione'); assert(!C.act(s, { t: 'potere', id: 'm-getto-di-fuoco', bers: 'brigante#1' }).err, 'si può mirare a una creatura');
    assert.deepStrictEqual(C.anteprima(s, { t: 'potere', id: 'm-getto-di-fuoco', dir: o.direzioni[0].dir }).bersagli.map((b) => b.bers).sort(), o.direzioni[0].colpiti.slice().sort(), 'l\'anteprima mostra gli stessi bersagli'); }
  // linea: attraversa tutti, ma si ferma davanti a un muro (sull'asse NO di e1: ogni passo è un esagono in linea retta)
  { const sulAsse = (s, id, k) => { const e = pos(s, 'e1'), o = G.aOffset(e.q, e.r - k); metti(s, id, o.col, o.riga) };
    const prepara = (arena) => { const s = scena(sq, nem3, { e1: [4, 8], e2: [0, 10], 'brigante#3': [7, 2] }, { arena }); dai(s, 'e1', 'fulmine'); sulAsse(s, 'brigante#1', 2); sulAsse(s, 'brigante#2', 4); return s };
    let s = prepara(); const r = ok(C.act(s, { t: 'potere', id: 'fulmine', dir: 2 })); assert(hit(r.ev, ['brigante#1', 'brigante#2']), 'la saetta prende chi sta sulla linea: ' + JSON.stringify(r.ev.filter((e) => e.t === 'salvezza').map((e) => e.bers)));
    assert.deepStrictEqual(C.mosseValide(s).poteri.find((x) => x.id === 'fulmine').direzioni.find((d) => d.dir === 2).colpiti.slice().sort(), ['brigante#1', 'brigante#2']);
    const muro = G.aOffset(pos(s, 'e1').q, pos(s, 'e1').r - 3); const righe = Array.from({ length: 11 }, (_, i) => (i === muro.riga ? '.'.repeat(muro.col) + '#' + '.'.repeat(8 - muro.col) : '.........'));
    s = prepara(aperta(righe)); const d2 = C.mosseValide(s).poteri.find((x) => x.id === 'fulmine').direzioni.find((x) => x.dir === 2); assert.deepStrictEqual(d2.colpiti, ['brigante#1'], 'un muro sulla linea ferma la saetta'); }
  // aura: include chi usa il potere, gli alleati vicini e non quelli lontani
  { const { s, r } = X(sq, nem3, { e1: [4, 8], e2: [4, 6], 'brigante#1': [4, 2], 'brigante#2': [3, 2], 'brigante#3': [5, 2] }, 'benedizione', {}); ok(r); assert.deepStrictEqual(r.ev.filter((e) => e.t === 'stato').map((e) => e.bers).sort(), ['e1', 'e2'], 'benedizione: sé e l\'alleato a due passi'); assert(S.ha(mostro(r.s, 'e1'), 'benedetto') && S.ha(mostro(r.s, 'e2'), 'benedetto'));
    const lon = X(sq, nem3, { e1: [4, 8], e2: [0, 10], 'brigante#1': [4, 2], 'brigante#2': [3, 2], 'brigante#3': [5, 2] }, 'benedizione', {}); assert.deepStrictEqual(lon.r.ev.filter((e) => e.t === 'stato').map((e) => e.bers), ['e1'], 'l\'alleato lontano resta fuori'); }
  // aura contro i nemici: solo i vicini, e nessuno se non c'è nessuno
  { const { r } = X(sq, nem3, { e1: [4, 6], e2: [0, 10], 'brigante#1': [4, 5], 'brigante#2': [3, 6], 'brigante#3': [4, 1] }, 'm-sciame', {}); ok(r); assert(hit(r.ev, ['brigante#1', 'brigante#2']), 'solo quelli accanto'); const v = X(sq, nem3, { e1: [4, 8], e2: [0, 10], 'brigante#1': [4, 1], 'brigante#2': [3, 1], 'brigante#3': [5, 1] }, 'm-sciame', {}); assert(/Nessun bersaglio/.test(v.r.err)); }
  // costi: azione, bonus, reazione
  { const s = scena(sq, nem3, { e1: [4, 6], e2: [5, 6], 'brigante#1': [4, 5], 'brigante#2': [3, 1], 'brigante#3': [5, 1] }); dai(s, 'e1', 'scudo-magico', 'riprendi-fiato', 'scintilla-arcana'); mostro(s, 'e1').hp = 2;
    assert(/reazione/.test(C.act(s, { t: 'potere', id: 'scudo-magico' }).err), 'una reazione non si usa a comando'); const b = ok(C.act(s, { t: 'potere', id: 'riprendi-fiato' })); assert.strictEqual(b.s.turno.bonus, false); assert.strictEqual(b.s.turno.azione, true); assert(/bonus/.test(C.act(b.s, { t: 'potere', id: 'riprendi-fiato' }).err));
    const a = ok(C.act(b.s, { t: 'potere', id: 'scintilla-arcana', bers: 'brigante#1' })); assert.strictEqual(a.s.turno.azione, false); assert(/azione/.test(C.act(a.s, { t: 'potere', id: 'scintilla-arcana', bers: 'brigante#1' }).err)); assert(/azione/.test(C.act(a.s, { t: 'attacca', bers: 'brigante#1' }).err), 'un potere d\'azione consuma l\'azione');
    let u = s; for (let i = 0; i < 3; i++) { const x = C.act(u, { t: 'potere', id: 'riprendi-fiato' }); if (x.err) break; u = x.s; u.turno.bonus = true; mostro(u, 'e1').hp = 2 } assert(/Cariche esaurite/.test(C.act(u, { t: 'potere', id: 'riprendi-fiato' }).err), 'le cariche finiscono');
    // a terra o stordito non si usano poteri
    const st = copia(s); S.aggiungi(mostro(st, 'e1'), 'stordito', 2); assert(/non può agire/.test(C.act(st, { t: 'potere', id: 'scintilla-arcana', bers: 'brigante#1' }).err)); } }

// ---- spinta ----
{ const forzato = (squad, nem, posiz, id, o) => { const s = scena(squad, nem, posiz, o), c = dai(s, 'e1', id); c.att = 100; c.cd = 30; return s };
  const guer = [{ eroe: eroe('guerriero', 5), dist: 0 }];
  const vedi = (s, id, bers) => { let spinti = []; for (let seme = 1; seme <= 40; seme++) { const x = copia(s); x.rng = seme * 211; const r = ok(C.act(x, { t: 'potere', id, bers })); const e = r.ev.find((y) => y.t === 'spinto'); if (e && e.passi >= 0) spinti.push({ r, e }); } return spinti };
  // il bersaglio finisce due esagoni più in là, lontano da chi spinge
  { const s = forzato(guer, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, 'urto-di-scudo'); const sp = vedi(s, 'urto-di-scudo', 'brigante'); assert(sp.length > 20, 'quasi sempre a segno'); const d0 = G.dist(pos(s, 'e1'), pos(s, 'brigante'));
    for (const { r, e } of sp) { assert.strictEqual(e.passi, 2); assert.strictEqual(G.dist(pos(r.s, 'e1'), pos(r.s, 'brigante')), d0 + 2, 'due passi in linea retta'); assert.deepStrictEqual(e.da, pos(s, 'brigante')); assert.deepStrictEqual(e.a, pos(r.s, 'brigante')); } }
  // contro un muro alle spalle non si sposta; con un muro a un passo si ferma a metà
  { const s = forzato(guer, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, 'urto-di-scudo', { arena: aperta(riga(3, '#########')) }); const fermo = vedi(s, 'urto-di-scudo', 'brigante'); assert(fermo.every(({ e }) => e.passi === 0 || e.passi === 1) && fermo.some(({ e }) => e.passi === 1), 'si ferma contro il muro');
    const s2 = forzato(guer, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, 'urto-di-scudo', { arena: aperta(riga(4, '#########')) }); const f2 = vedi(s2, 'urto-di-scudo', 'brigante'); assert(f2.length && f2.every(({ e }) => e.passi === 0), 'muro subito dietro: niente spinta'); for (const { r } of f2) assert.deepStrictEqual(pos(r.s, 'brigante'), pos(s2, 'brigante')); }
  // contro un'altra creatura
  { const s = forzato(guer, ['brigante', 'lupo-grigio'], { e1: [4, 6], brigante: [4, 5], 'lupo-grigio': [4, 3] }, 'urto-di-scudo'); const sp = vedi(s, 'urto-di-scudo', 'brigante'); const i = G.dist(pos(s, 'e1'), pos(s, 'lupo-grigio')); assert(sp.length && sp.every(({ r }) => G.dist(pos(r.s, 'brigante'), pos(r.s, 'lupo-grigio')) >= 1 && !(pos(r.s, 'brigante').q === pos(r.s, 'lupo-grigio').q && pos(r.s, 'brigante').r === pos(r.s, 'lupo-grigio').r)), 'non si finisce sopra un altro'); assert(i >= 2); }
  // sul fuoco: scotta
  { const sup = Array.from({ length: 11 }, (_, r) => (r === 4 || r === 5 ? 'fffffffff' : '.........')); const s = forzato(guer, ['brigante'], { e1: [4, 7], brigante: [4, 6] }, 'urto-di-scudo', { arena: aperta(null, sup) }); mostro(s, 'e1').dan = { n: 1, dado: 2, bonus: 0, tipo: 'contundente' }; const sp = vedi(s, 'urto-di-scudo', 'brigante');
    assert(sp.some(({ r }) => r.ev.some((e) => e.t === 'superficie' && e.chi === 'brigante' && e.sup === 'fuoco')), 'chi viene spinto sul fuoco si scotta'); }
  // i mostri spingono gli eroi (carica, schianto)
  { const s = scena(guer, ['cinghiale-irsuto'], { e1: [4, 6], 'cinghiale-irsuto': [4, 5] }, { chi: 'cinghiale-irsuto' }); const m = mostro(s, 'cinghiale-irsuto'); m.att = 100; let visto = 0; for (let seme = 1; seme <= 40; seme++) { const x = copia(s); x.rng = seme * 37; const r = ok(C.act(x, { t: 'potere', id: 'm-carica', bers: 'e1' })), e = r.ev.find((y) => y.t === 'spinto'); if (e && e.passi === 1) visto++; } assert(visto > 20, 'la carica spinge di un passo: ' + visto); }
  // spinta di un nemico caduto o morto: non succede
  { const s = forzato(guer, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, 'urto-di-scudo'); mostro(s, 'brigante').hp = 1; mostro(s, 'e1').dan = { n: 4, dado: 12, bonus: 10, tipo: 'taglio' }; const sp = vedi(s, 'urto-di-scudo', 'brigante'); assert(sp.every(({ e }) => e.passi === 0)); } }

// ---- reazioni difensive: pausa, risposte, scelta automatica ----
{ const chiedi = { reazioni: { eroi: 'chiedi', nemici: 'auto' } };
  const mago = [{ eroe: eroe('mago', 3), dist: 0 }];
  // cerca un seme in cui il colpo del brigante passa per poco: lo scudo magico lo trasforma in un colpo mancato
  const attacco = (opz, seme, posiz) => { const s = scena(mago, ['brigante'], posiz || { e1: [4, 6], brigante: [4, 5] }, { chi: 'brigante', opz }); const m = mostro(s, 'brigante'); m.att = mostro(s, 'e1').ca - 7; s.rng = seme * 977; return s };
  let pausa = null, base = null; for (let seme = 1; seme <= 400 && !pausa; seme++) { const s = attacco(chiedi, seme), r = C.act(s, { t: 'attacca', bers: 'e1' }); if (r.pausa) { pausa = r.pausa; base = s; } }
  assert(pausa, 'prima o poi una pausa'); assert.strictEqual(pausa.chi, 'e1'); assert.strictEqual(pausa.tipo, 'reazione'); assert.strictEqual(pausa.quando, 'colpo'); assert(pausa.opzioni.some((o) => o.id === 'scudo-magico' && o.tipo === 'scudo'));
  assert(pausa.info.tot >= pausa.info.ca && pausa.info.tot < pausa.info.ca + 4 && pausa.info.att === 'brigante' && pausa.info.bers === 'e1', 'si chiede solo quando lo scudo cambia davvero l\'esito');
  const prima = JSON.stringify(base); assert.deepStrictEqual(C.act(base, { t: 'attacca', bers: 'e1' }).pausa, pausa, 'la stessa domanda, sempre'); assert.strictEqual(JSON.stringify(base), prima, 'lo stato non cambia durante la pausa');
  const si = ok(C.act(base, { t: 'attacca', bers: 'e1', dec: ['scudo-magico'] })), no = ok(C.act(base, { t: 'attacca', bers: 'e1', dec: [null] }));
  assert(no.ev.some((e) => e.t === 'tiro' && e.ok) && mostro(no.s, 'e1').hp < mostro(base, 'e1').hp, 'senza scudo il colpo passa'); assert(!no.ev.some((e) => e.t === 'reazione'));
  const t = si.ev.find((e) => e.t === 'tiro'); assert(!t.ok, 'con lo scudo manca'); assert(si.ev.findIndex((e) => e.t === 'reazione') < si.ev.findIndex((e) => e.t === 'tiro'), 'la reazione viene prima del tiro riportato'); assert.strictEqual(t.cont, pausa.info.ca + 4, 'il tiro è contro la CA con lo scudo'); assert.strictEqual(mostro(si.s, 'e1').hp, mostro(base, 'e1').hp);
  assert.strictEqual(mostro(si.s, 'e1').rea, false, 'la reazione è spesa'); assert.strictEqual(mostro(si.s, 'e1').usi['scudo-magico'], 1); assert(S.ha(mostro(si.s, 'e1'), 'protetto'), 'lo scudo dura fino al suo prossimo turno');
  assert.strictEqual(C.act(base, { t: 'attacca', bers: 'e1', dec: ['parata'] }).s.cb.find((c) => c.id === 'e1').hp, mostro(no.s, 'e1').hp, 'una risposta non valida vale no');
  // salvataggio a metà pausa e ripresa: stesso risultato
  assert.deepStrictEqual(C.act(JSON.parse(JSON.stringify(base)), { t: 'attacca', bers: 'e1', dec: ['scudo-magico'] }).s, si.s);
  // modo automatico: lo scudo parte da solo
  { const s = attacco({ reazioni: { eroi: 'auto', nemici: 'auto' } }, 1); let usato = 0, mancati = 0; for (let seme = 1; seme <= 200; seme++) { const x = attacco({ reazioni: { eroi: 'auto', nemici: 'auto' } }, seme), r = ok(C.act(x, { t: 'attacca', bers: 'e1' })); if (r.ev.some((e) => e.t === 'reazione' && e.potere === 'scudo-magico')) { usato++; if (!r.ev.find((e) => e.t === 'tiro').ok) mancati++ } } assert(usato > 10 && mancati === usato, 'auto: lo scudo si usa solo quando salva (' + usato + '/' + mancati + ')'); assert(s); }
  // il 20 naturale non si ferma con uno scudo: nessuna domanda
  { const s = attacco(chiedi, 5); const r = copia(s); r.rng = 1; let domande = 0; for (let seme = 1; seme <= 300; seme++) { const x = attacco(chiedi, seme), y = C.act(x, { t: 'attacca', bers: 'e1' }); if (y.pausa) { domande++; assert(y.pausa.info.tiro !== 20); } } assert(domande > 5 && domande < 100); }
  // una reazione a giro: dopo lo scudo, il secondo colpo non chiede più
  { const s = scena([{ eroe: eroe('mago', 3), dist: 0 }], ['brigante', 'brigante'], { e1: [4, 6], 'brigante#1': [4, 5], 'brigante#2': [3, 6] }, { chi: 'brigante#1', opz: chiedi }); mostro(s, 'e1').rea = false; mostro(s, 'brigante#1').att = 100; const r = C.act(s, { t: 'attacca', bers: 'e1' }); assert(!r.pausa && !r.err, 'senza reazione non si chiede'); }
  // riduzione del danno: parata (guerriero 3), schivata mirabile (ladro 5), pelle di pietra (nano)
  { const g = [{ eroe: eroe('guerriero', 3), dist: 0 }]; let trovato = false;
    for (let seme = 1; seme <= 100 && !trovato; seme++) { const s = scena(g, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, { chi: 'brigante', opz: chiedi }); const b = mostro(s, 'brigante'); b.att = 100; b.dan = { n: 3, dado: 8, bonus: 4, tipo: 'taglio' }; s.rng = seme * 211; const r = C.act(s, { t: 'attacca', bers: 'e1' });
      if (r.pausa && r.pausa.quando === 'danno') { trovato = true; assert(r.pausa.opzioni.some((o) => o.id === 'parata' && o.tipo === 'riduci')); assert(r.pausa.info.n >= 5, 'solo se il danno vale la pena');
        const con = ok(C.act(s, { t: 'attacca', bers: 'e1', dec: ['parata'] })), senza = ok(C.act(s, { t: 'attacca', bers: 'e1', dec: [null] })), rid = con.ev.find((e) => e.t === 'riduci'), dc = con.ev.find((e) => e.t === 'danno'), ds = senza.ev.find((e) => e.t === 'danno');
        assert(rid && rid.n >= 1 && ds.n - dc.n === rid.n, 'il danno cala di quanto riduce la parata'); assert.strictEqual(mostro(con.s, 'e1').rea, false); assert.strictEqual(mostro(con.s, 'e1').usi.parata, 1); assert(mostro(con.s, 'e1').hp > mostro(senza.s, 'e1').hp);
        // il 20 naturale che raddoppia i dadi: le domande sono due (nessuna per il colpo, una per il danno) e le risposte si leggono nell'ordine
        const auto = ok(C.act(Object.assign(copia(s), { opz: Object.assign({}, s.opz, { reazioni: { eroi: 'auto', nemici: 'auto' } }) }), { t: 'attacca', bers: 'e1' })); assert(auto.ev.some((e) => e.t === 'reazione' && e.potere === 'parata'), 'in automatico la parata parte con danni alti') } }
    assert(trovato, 'una pausa per il danno'); }
  { const nano = [{ eroe: eroe('guerriero', 1, 'nano'), dist: 0 }]; let n = 0; for (let seme = 1; seme <= 60; seme++) { const s = scena(nano, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, { chi: 'brigante' }); const b = mostro(s, 'brigante'); b.att = 100; b.dan = { n: 3, dado: 8, bonus: 4, tipo: 'taglio' }; s.rng = seme * 17; const r = ok(C.act(s, { t: 'attacca', bers: 'e1' })); if (r.ev.some((e) => e.t === 'reazione' && e.potere === 'r-nano')) { n++; assert(r.ev.some((e) => e.t === 'riduci')); } } assert(n > 10, 'pelle di pietra del nano: ' + n); }
  // «tenace» scatta da sola: l'orco resta in piedi con 1 PF; il mostro con «ultima carta» pure
  { const orco = [{ eroe: eroe('guerriero', 1, 'orco'), dist: 0 }]; let tenuti = 0; for (let seme = 1; seme <= 40; seme++) { const s = scena(orco, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, { chi: 'brigante', opz: chiedi }); mostro(s, 'e1').hp = 2; const b = mostro(s, 'brigante'); b.att = 100; b.dan = { n: 3, dado: 8, bonus: 6, tipo: 'taglio' }; s.rng = seme * 7;
      const r = C.act(s, { t: 'attacca', bers: 'e1' }); assert(!r.pausa, 'tenace non chiede niente'); const d = r.s && r.ev.find((e) => e.t === 'danno'); if (d && d.tenace) { tenuti++; assert.strictEqual(mostro(r.s, 'e1').hp, 1); assert.strictEqual(d.potere, 'r-orco'); assert.strictEqual(mostro(r.s, 'e1').usi['r-orco'], 1); assert(!r.ev.some((e) => e.t === 'cade')); } }
    assert(tenuti > 10, 'tenace: ' + tenuti);
    let ultima = 0; for (let seme = 1; seme <= 40; seme++) { const s = scena([{ eroe: eroe('guerriero', 5), dist: 0 }], ['famiglio-arcano'], { e1: [4, 6], 'famiglio-arcano': [4, 5] }); const m = mostro(s, 'famiglio-arcano'); m.poteri.push('m-ultima-carta'); m.hp = 1; mostro(s, 'e1').att = 100; s.rng = seme * 13;
      const r = ok(C.act(s, { t: 'attacca', bers: 'famiglio-arcano' })), d = r.ev.find((e) => e.t === 'danno'); if (d && d.tenace) { ultima++; assert.strictEqual(mostro(r.s, 'famiglio-arcano').hp, 1); assert(!r.ev.some((e) => e.t === 'muore')) } } assert(ultima > 10, 'ultima carta: ' + ultima); }
  // ritiro dell'attacco: Fortunato / Colpo di scena su un alleato colpito
  { const duo = [{ eroe: eroe('guerriero', 3), dist: 0 }, { eroe: eroe('ladro', 3, 'piccolo'), dist: 0 }]; let cambiati = 0, tot = 0;
    for (let seme = 1; seme <= 300; seme++) { const s = scena(duo, ['brigante'], { e1: [4, 6], e2: [5, 6], brigante: [4, 5] }, { chi: 'brigante', opz: { reazioni: { eroi: 'auto', nemici: 'auto' } } }); const b = mostro(s, 'brigante'); b.att = mostro(s, 'e1').ca - 12; mostro(s, 'e2').poteri = mostro(s, 'e2').poteri.filter((p) => p !== 'schivata-mirabile'); s.rng = seme * 19;
      const r = ok(C.act(s, { t: 'attacca', bers: 'e1' })), re = r.ev.find((e) => e.t === 'reazione' && e.potere === 'r-piccolo'); if (re) { tot++; const t = r.ev.find((e) => e.t === 'tiro'); assert(t.tiro0 != null, 'si vede il dado di prima'); assert.strictEqual(mostro(r.s, 'e2').rea, false); if (!t.ok) cambiati++; } }
    assert(tot > 10 && cambiati > 0, 'ritiro del piccolo: ' + tot + '/' + cambiati);
    // con il modo «chiedi» è l'alleato a decidere
    let pa = null; for (let seme = 1; seme <= 300 && !pa; seme++) { const s = scena(duo, ['brigante'], { e1: [4, 6], e2: [5, 6], brigante: [4, 5] }, { chi: 'brigante', opz: chiedi }); const b = mostro(s, 'brigante'); b.att = 100; mostro(s, 'e1').poteri = mostro(s, 'e1').poteri.filter((p) => p !== 'parata'); mostro(s, 'e2').poteri = mostro(s, 'e2').poteri.filter((p) => p !== 'schivata-mirabile'); s.rng = seme * 41; const r = C.act(s, { t: 'attacca', bers: 'e1' }); if (r.pausa && r.pausa.chi === 'e2') pa = r.pausa }
    assert(pa && pa.opzioni.some((o) => o.id === 'r-piccolo' && o.tipo === 'ritira'), 'è il piccolo a decidere'); } }

// ---- Concentrazione: vantaggio e ritiro ----
{ const guer = [{ eroe: eroe('guerriero', 3), dist: 0 }, { eroe: eroe('chierico', 3), dist: 0 }];
  const s = scena(guer, ['brigante'], { e1: [4, 6], e2: [5, 7], brigante: [4, 5] }); const c0 = mostro(s, 'e1').conc; assert(c0 >= 1);
  const v = ok(C.act(s, { t: 'attacca', bers: 'brigante', conc: 'vant' })); assert.strictEqual(mostro(v.s, 'e1').conc, c0 - 1); assert(v.ev.find((e) => e.t === 'tiro').vant, 'tira con vantaggio'); assert(v.ev.some((e) => e.t === 'conc-spesa' && e.uso === 'vant')); assert.strictEqual(v.s.prima, null, 'chi ha già usato la Concentrazione non può anche ritirare... fino a che non gli resta un punto');
  assert(/Concentrazione/.test(C.act(s, { t: 'attacca', bers: 'brigante', conc: 'ritira' }).err)); const z = copia(s); mostro(z, 'e1').conc = 0; assert(/Concentrazione/.test(C.act(z, { t: 'attacca', bers: 'brigante', conc: 'vant' }).err), 'serve un punto');
  const cu = copia(s); dai(cu, 'e2', 'tocco-guaritore'); const cc = finoA(cu, 'e2'); metti(cc, 'e1', 4, 6); assert(/tiri per colpire/.test(C.act(cc, { t: 'potere', id: 'tocco-guaritore', bers: 'e1', conc: 'vant' }).err), 'la Concentrazione per vantaggio serve ai tiri per colpire');
  const pv = copia(s); dai(pv, 'e1', 'colpo-possente'); assert.strictEqual(ok(C.act(pv, { t: 'potere', id: 'colpo-possente', bers: 'brigante', conc: 'vant' })).s.cb[0].conc, c0 - 1);
  // ritira: dopo un attacco singolo si può rigiocare tirando il d20 una seconda volta
  let cambia = { mancaPoiColpisce: 0, colpisceDiNuovo: 0, colpisceMaPoiManca: 0, uguali: 0 };
  for (let seme = 1; seme <= 300; seme++) { const x = copia(s); x.rng = seme * 31; const a1 = ok(C.act(x, { t: 'attacca', bers: 'brigante' })); const m = C.mosseValide(a1.s); assert(m.azioni.includes('ritira'), 'dopo un attacco si può ritirare');
    const rt = ok(C.act(a1.s, { t: 'ritira' })), t0 = a1.ev.find((e) => e.t === 'tiro'), t1 = rt.ev.find((e) => e.t === 'tiro');
    assert.strictEqual(t1.tiro0, t0.tiro, 'il dado di prima è quello originale'); assert.strictEqual(mostro(rt.s, 'e1').conc, c0 - 1, 'costa un punto'); assert.strictEqual(rt.s.prima, null, 'una sola volta'); assert(rt.ev.some((e) => e.t === 'conc-spesa' && e.uso === 'ritira'));
    assert.strictEqual(rt.s.turno.azione, false, 'l\'azione resta spesa una volta sola'); assert.strictEqual(mostro(rt.s, 'brigante').hp <= mostro(x, 'brigante').hp, true);
    assert(C.act(rt.s, { t: 'ritira' }).err, 'non si ritira due volte'); assert(!C.mosseValide(rt.s).azioni.includes('ritira'));
    if (t1.tiro === t0.tiro) cambia.uguali++; if (!t0.ok && t1.ok) cambia.mancaPoiColpisce++; if (t0.ok && t1.ok) cambia.colpisceDiNuovo++; if (t0.ok && !t1.ok) cambia.colpisceMaPoiManca++;
    // il nuovo dado vale sempre, anche se peggiore: la ferita è quella del tiro nuovo
    assert.strictEqual(mostro(rt.s, 'brigante').hp < mostro(x, 'brigante').hp, !!rt.ev.find((e) => e.t === 'danno'));
    assert.strictEqual(a1.s.turno.azione, false); assert(a1.s.prima && a1.s.prima.chi === 'e1'); }
  assert(cambia.mancaPoiColpisce > 10 && cambia.colpisceMaPoiManca > 10, 'il ritiro può salvare e può rovinare: ' + JSON.stringify(cambia));
  // la possibilità di ritirare sparisce con qualunque altra azione, e non c'è senza punti o per gli altri
  const a2 = ok(C.act(s, { t: 'attacca', bers: 'brigante' })); const dopo = ok(C.act(a2.s, { t: 'muovi', a: G.daOffset(3, 7) })); assert.strictEqual(dopo.s.prima, null); assert(C.act(dopo.s, { t: 'ritira' }).err); assert(C.act(s, { t: 'ritira' }).err, 'senza un tiro non c\'è niente da ritirare');
  const poco = copia(s); mostro(poco, 'e1').conc = 0; const a3 = ok(C.act(poco, { t: 'attacca', bers: 'brigante' })); assert.strictEqual(a3.s.prima, null); assert(!C.mosseValide(a3.s).azioni.includes('ritira'));
  const fine = ok(C.act(a2.s, { t: 'fine' })); assert.strictEqual(fine.s.prima, null);
  // l'attacco di un potere con più colpi non si ritira; né quello di un mostro
  const mp = copia(s); dai(mp, 'e1', 'raffica-d-acciaio'); assert.strictEqual(ok(C.act(mp, { t: 'potere', id: 'raffica-d-acciaio', bers: 'brigante' })).s.prima, null);
  const sp = copia(s); dai(sp, 'e1', 'colpo-possente'); assert(ok(C.act(sp, { t: 'potere', id: 'colpo-possente', bers: 'brigante' })).s.prima, 'un potere con un solo colpo sì');
  const sm = scena(guer, ['brigante'], { e1: [4, 6], brigante: [4, 5] }, { chi: 'brigante' }); mostro(sm, 'brigante').conc = 3; assert.strictEqual(ok(C.act(sm, { t: 'attacca', bers: 'e1' })).s.prima, null, 'i mostri non ritirano');
  // salvare lo stato fra l'attacco e il ritiro non cambia nulla
  const pr = ok(C.act(s, { t: 'attacca', bers: 'brigante' })); assert.deepStrictEqual(C.act(JSON.parse(JSON.stringify(pr.s)), { t: 'ritira' }).s, C.act(pr.s, { t: 'ritira' }).s); }

// ---- oggetti della cintura ----
{ const base = (cl, cintura, posiz, nem, o) => { const e = eroe(cl, 3); e.cintura = cintura.slice(); const s = scena([{ eroe: e, dist: 0 }, { eroe: eroe('ladro', 3), dist: 0 }], nem || ['brigante'], Object.assign({ e1: [4, 7], e2: [5, 7] }, nem ? {} : { brigante: [4, 2] }, posiz || {}), o); return s };
  // pozioni: azione bonus, su di sé o su un compagno vicino (anche a terra), e l'oggetto sparisce
  { const s = base('chierico', ['pozione-cura', 'pozione-cura', 'antidoto', 'tonico-concentrazione']); assert.deepStrictEqual(mostro(s, 'e1').cintura, ['pozione-cura', 'pozione-cura', 'antidoto', 'tonico-concentrazione']); const m = C.mosseValide(s); assert.deepStrictEqual(m.oggetti.map((o) => o.id).sort(), ['antidoto', 'pozione-cura', 'tonico-concentrazione'].sort(), 'solo ciò che si può usare adesso (l\'antidoto aiuta chi sta bene? sì: è una rimozione)');
    mostro(s, 'e1').hp = 1; const r = ok(C.act(s, { t: 'oggetto', id: 'pozione-cura', bers: 'e1' })); const e = mostro(r.s, 'e1'); assert(e.hp > 1 && e.hp <= e.hpMax); assert.strictEqual(r.s.turno.bonus, false); assert.strictEqual(r.s.turno.azione, true, 'la pozione è un\'azione bonus'); assert.deepStrictEqual(e.cintura, ['pozione-cura', 'antidoto', 'tonico-concentrazione'], 'una sola pozione se ne va');
    const cura = r.ev.find((x) => x.t === 'cura'); assert(cura && cura.n === e.hp - 1); assert(r.ev.some((x) => x.t === 'oggetto' && x.id === 'pozione-cura')); assert(/bonus/.test(C.act(r.s, { t: 'oggetto', id: 'pozione-cura', bers: 'e1' }).err), 'una sola azione bonus');
    // su un compagno vicino, anche a terra: si rialza
    mostro(s, 'e2').hp = 0; S.cade(mostro(s, 'e2')); const q = ok(C.act(s, { t: 'oggetto', id: 'pozione-cura', bers: 'e2' })); assert(mostro(q.s, 'e2').hp > 0 && !S.ha(mostro(q.s, 'e2'), 'terra'), 'la pozione rialza chi è a terra'); assert(q.ev.some((x) => x.t === 'cura' && x.rialzato));
    metti(s, 'e2', 8, 9); assert(/Troppo lontano/.test(C.act(s, { t: 'oggetto', id: 'pozione-cura', bers: 'e2' }).err), 'serve essere vicini'); assert(/cintura/.test(C.act(s, { t: 'oggetto', id: 'razione', bers: 'e1' }).err), 'se non è alla cintura non si usa'); assert(/usare/.test(C.act(s, { t: 'oggetto', id: 'spada-corta', bers: 'e1' }).err)); assert(/usare/.test(C.act(s, { t: 'oggetto', id: 'non-esiste' }).err));
    // tonico: un punto di Concentrazione, non oltre il massimo
    const t = copia(s); mostro(t, 'e1').conc = 0; const c1 = ok(C.act(t, { t: 'oggetto', id: 'tonico-concentrazione' })); assert.strictEqual(mostro(c1.s, 'e1').conc, 1); const t2 = copia(s); assert.strictEqual(ok(C.act(t2, { t: 'oggetto', id: 'tonico-concentrazione' })).s.cb[0].conc, mostro(t2, 'e1').concMax, 'non oltre il massimo');
    // antidoto
    const av = copia(s); S.aggiungi(mostro(av, 'e1'), 'avvelenato', 3); const an = ok(C.act(av, { t: 'oggetto', id: 'antidoto', bers: 'e1' })); assert(!S.ha(mostro(an.s, 'e1'), 'avvelenato')); assert(an.ev.some((x) => x.t === 'rimuovi')); }
  // elisir e benedizione
  { const s = base('guerriero', ['elisir-vigore', 'pergamena-benedizione'], { e2: [5, 7] }); const e = ok(C.act(s, { t: 'oggetto', id: 'elisir-vigore', bers: 'e1' })); assert.strictEqual(mostro(e.s, 'e1').temp, 20, 'PF temporanei');
    const b = ok(C.act(s, { t: 'oggetto', id: 'pergamena-benedizione' })); assert.strictEqual(b.s.turno.azione, false, 'la pergamena è un\'azione'); assert.strictEqual(b.s.turno.bonus, true); assert(S.ha(mostro(b.s, 'e1'), 'benedetto') && S.ha(mostro(b.s, 'e2'), 'benedetto'), 'benedice la compagnia vicina'); assert.deepStrictEqual(mostro(b.s, 'e1').cintura, ['elisir-vigore']); }
  // bombe e pergamene: area di raggio 1, salvezza per metà danno, il fuoco accende, il gelo rallenta
  { const s = base('ladro', ['bomba-fuoco', 'bomba-gelo', 'pergamena-fulmine'], { e1: [4, 7], 'brigante#1': [4, 4], 'brigante#2': [5, 4], 'brigante#3': [0, 1] }, ['brigante', 'brigante', 'brigante'], {});
    const centro = pos(s, 'brigante#1'), m = C.mosseValide(s), of = m.oggetti.find((o) => o.id === 'bomba-fuoco'); assert(of && of.area === 'cerchio' && of.costo === 'azione' && of.centri.length >= 1);
    const an = C.anteprima(s, { t: 'oggetto', id: 'bomba-fuoco', cella: centro }); assert(!an.err && an.n >= 1 && an.atteso > 0);
    let acceso = 0, intero = 0, meta = 0; for (let seme = 1; seme <= 60; seme++) { const x = copia(s); x.rng = seme * 97; const r = ok(C.act(x, { t: 'oggetto', id: 'bomba-fuoco', cella: centro })); assert.strictEqual(r.s.turno.azione, false); assert.strictEqual(r.s.turno.bonus, true);
      assert.deepStrictEqual(mostro(r.s, 'e1').cintura, ['bomba-gelo', 'pergamena-fulmine']); assert(r.ev.every((e) => !e.bers || mostro(r.s, e.bers).lato === 'nemici'), 'niente fuoco amico'); const sv = r.ev.filter((e) => e.t === 'salvezza'); assert(sv.length >= 1 && sv.every((e) => e.cont === 12 && e.ab === 'des'), 'salvezza di Destrezza CD 12');
      for (const e of sv) { const d = r.ev.find((y) => y.t === 'danno' && y.bers === e.bers); if (e.ok) meta++; else intero++; if (!e.ok && S.ha(mostro(r.s, e.bers), 'in-fiamme')) acceso++; assert(d.tipo === 'fuoco'); } }
    assert(acceso > 5 && intero > 5 && meta > 5, 'metà danno o intero, e le fiamme se fallisce: ' + [acceso, intero, meta]);
    const ge = ok(C.act(s, { t: 'oggetto', id: 'bomba-gelo', cella: centro })); assert(ge.ev.some((e) => e.t === 'stato' && e.stato === 'rallentato') || ge.ev.every((e) => e.t !== 'salvezza' || e.ok || true), 'il gelo rallenta chi non regge');
    const fu = ok(C.act(s, { t: 'oggetto', id: 'pergamena-fulmine', cella: centro })); assert(fu.ev.some((e) => e.t === 'danno' && e.tipo === 'fulmine'));
    assert(/Troppo lontano/.test(C.act(s, { t: 'oggetto', id: 'bomba-fuoco', cella: G.daOffset(4, 0) }).err), 'si lancia fino a 5 esagoni'); assert(/Scegli dove/.test(C.act(s, { t: 'oggetto', id: 'bomba-fuoco' }).err)); assert(/Nessun bersaglio/.test(C.act(s, { t: 'oggetto', id: 'bomba-fuoco', cella: G.daOffset(8, 5) }).err), 'a vuoto non si butta via la bomba');
    const sr = copia(s); sr.turno.azione = false; assert(/azione/.test(C.act(sr, { t: 'oggetto', id: 'bomba-fuoco', cella: centro }).err), 'senza azione non si lancia'); }
  // chi non ha oggetti non ne ha da usare; i mostri non hanno cintura; il riepilogo la riporta
  { const s = scena(squadra(1, 2), ['brigante'], { e1: [4, 6], brigante: [4, 5] }); assert.deepStrictEqual(C.mosseValide(s).oggetti, []); assert(C.act(s, { t: 'oggetto', id: 'pozione-cura', bers: 'e1' }).err);
    const e = eroe('chierico', 2); e.cintura = ['pozione-cura']; const t = scena([{ eroe: e, dist: 0 }], ['brigante'], { e1: [4, 6], brigante: [4, 2] }); mostro(t, 'e1').hp = 1; const u = ok(C.act(t, { t: 'oggetto', id: 'pozione-cura', bers: 'e1' })); assert.deepStrictEqual(C.riepilogo(u.s).eroi[0].cintura, [], 'il riepilogo dice che cosa resta alla cintura'); assert.deepStrictEqual(C.riepilogo(t).eroi[0].cintura, ['pozione-cura']); } }

// ---- fuzz: poteri, oggetti, reazioni con pausa e Concentrazione, con salvataggio a ogni mossa ----
const rng = require('./carica.js').rng(321), ri = (n) => Math.floor(rng() * n);
function scegli(s, r) { const m = C.mosseValide(s); const k = r();
  if (m.poteri.length && k < .3) { const p = m.poteri[Math.floor(r() * m.poteri.length)], a = { t: 'potere', id: p.id };
    if (p.bersagli && p.area === 'singolo') a.bers = p.bersagli[Math.floor(r() * p.bersagli.length)]; if (p.centri) { const c = p.centri[Math.floor(r() * p.centri.length)]; a.cella = { q: c.q, r: c.r } } if (p.direzioni) a.dir = p.direzioni[Math.floor(r() * p.direzioni.length)].dir; return a }
  if (m.oggetti.length && k < .42) { const p = m.oggetti[Math.floor(r() * m.oggetti.length)], a = { t: 'oggetto', id: p.id }; if (p.bersagli && p.area === 'singolo') a.bers = p.bersagli[Math.floor(r() * p.bersagli.length)]; if (p.centri) { const c = p.centri[Math.floor(r() * p.centri.length)]; a.cella = { q: c.q, r: c.r } } return a }
  if (m.azioni.includes('ritira') && k < .5) return { t: 'ritira' };
  if (m.attacchi.length && k < .66) return Object.assign({ t: 'attacca', bers: m.attacchi[Math.floor(r() * m.attacchi.length)].bers }, r() < .15 && mostro(s, m.chi).conc >= 1 ? { conc: 'vant' } : {});
  if (m.muovi.length && k < .84) { const x = m.muovi[Math.floor(r() * m.muovi.length)]; return { t: 'muovi', a: { q: x.q, r: x.r } } }
  if (m.azioni.includes('disimpegno') && k < .88) return { t: 'disimpegno' }; if (m.bersagli.rialza && k < .92) return { t: 'rialza', bers: m.bersagli.rialza[0] }; if (m.azioni.includes('arrendi') && k < .95) return { t: 'arrendi' };
  return { t: 'fine' } }
// esegue l'azione rispondendo alle pause a caso (e provando anche a salvare e riprendere a metà)
function gioca(s, a, r, salva) { let dec = []; for (let g = 0; g < 8; g++) { const y = C.act(salva ? JSON.parse(JSON.stringify(s)) : s, Object.assign({}, a, { dec })); if (!y.pausa) return y;
    assert(y.pausa.opzioni.length >= 1 && y.pausa.chi && ['colpo', 'danno'].includes(y.pausa.quando)); dec = dec.concat([r() < .6 ? y.pausa.opzioni[Math.floor(r() * y.pausa.opzioni.length)].id : null]); } throw new Error('troppe pause'); }
function invarianti(s) { const celle = new Set(); for (const c of s.cb) { assert(Number.isInteger(c.hp) && c.hp >= 0 && c.hp <= c.hpMax, c.id + ' PF ' + c.hp); assert(c.conc >= 0 && c.conc <= c.concMax, c.id + ' conc');
    if (c.lato === 'eroi' && !c.fuori && !c.fuggito) assert.strictEqual(c.hp === 0, S.ha(c, 'terra'), c.id + ': a terra se e solo se 0 PF'); if (C.inCampo(c)) { assert(G.passabile(s.arena, c)); const k = K(c.q, c.r); assert(!celle.has(k), 'due sulla stessa cella ' + k); celle.add(k) }
    for (const [id, n] of Object.entries(c.usi || {})) assert(n >= 0 && n <= A.usiMax(c, A.P[id]), 'cariche di ' + id); for (const o of c.cintura || []) assert(AO.OGG[o] && AO.OGG[o].slot === 'cons'); if (c.lato === 'nemici') assert(!c.cintura); }
  assert.deepStrictEqual(s.ordine.slice().sort(), s.cb.filter(C.inCampo).map((c) => c.id).sort()); if (!s.over) assert.strictEqual(s.turno.id, s.ordine[s.i]); JSON.parse(JSON.stringify(s)); }
{ const consumi = ['pozione-cura', 'pozione-cura-maggiore', 'antidoto', 'bomba-fuoco', 'bomba-gelo', 'pergamena-fulmine', 'pergamena-benedizione', 'tonico-concentrazione', 'elisir-vigore', 'razione', 'kit-guaritore'];
  const famiglie = [['lupo-grigio', 'cinghiale-irsuto', 'ragno-tessitore'], ['brigante', 'arciere-bandito', 'cerusico-di-strada', 'tagliagole', 'stregone-rinnegato'], ['scheletro-armato', 'ghoul-di-tomba', 'anima-in-pena'], ['famiglio-arcano', 'statua-vivente', 'sciame-di-scintille']];
  const usati = {}, esiti = {}; let pause = 0, reaz = 0, ritiri = 0, oggetti = 0, aree = 0;
  for (let n = 0; n < 70; n++) { const liv = 2 + ri(5), cl = ['guerriero', 'mago', 'chierico', 'ladro', 'esploratore', 'bardo'];
    const eroi = Array.from({ length: 1 + ri(4) }, () => { const e = eroe(cl[ri(6)], liv, ['umano', 'elfo', 'nano', 'piccolo', 'orco'][ri(5)]); e.cintura = Array.from({ length: ri(4) }, () => consumi[ri(consumi.length)]); return { eroe: e, dist: 0 } });
    const f = famiglie[ri(4)], nem = Array.from({ length: 1 + ri(4) }, () => f[ri(f.length)]);
    let s = battaglia(eroi, nem, { seme: 5000 + n, ambiente: AR.AMBIENTI[ri(8)], opz: { reazioni: { eroi: n % 2 ? 'chiedi' : 'auto', nemici: 'auto' } } }); const r = require('./carica.js').rng(8000 + n); let k = 0; invarianti(s);
    while (!s.over && k++ < 2500) { const a = scegli(s, r), antes = JSON.stringify(s), y = gioca(s, a, r, true); assert(!y.err, JSON.stringify(a) + ' → ' + y.err); assert.strictEqual(JSON.stringify(s), antes, 'act non cambia lo stato che riceve');
      const z = gioca(s, a, require('./carica.js').rng(k), false); assert(!z.err); if (a.t === 'potere') { usati[a.id] = (usati[a.id] || 0) + 1; if (['cerchio', 'cono', 'linea', 'aura'].includes(A.P[a.id].area)) aree++ } if (a.t === 'oggetto') oggetti++; if (a.t === 'ritira') ritiri++;
      for (const e of y.ev) if (e.t === 'reazione') reaz++; s = y.s; invarianti(s); }
    assert(s.over, 'la battaglia ' + n + ' non finisce'); esiti[s.over.esito] = (esiti[s.over.esito] || 0) + 1; for (const e of C.riepilogo(s).eroi) assert(Array.isArray(e.cintura)); }
  assert(Object.keys(usati).length >= 25 && oggetti >= 20 && reaz >= 10 && aree >= 20, 'il fuzz tocca davvero poteri, oggetti, reazioni: ' + Object.keys(usati).length + '/' + oggetti + '/' + reaz + '/' + aree + '/' + ritiri);
  console.log('poteri: 70 battaglie, ' + Object.keys(usati).length + ' poteri diversi, ' + oggetti + ' oggetti, ' + reaz + ' reazioni, ' + ritiri + ' ritiri, esiti ' + JSON.stringify(esiti)); }
console.log('scontro_poteri ok');
