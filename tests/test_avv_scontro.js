// Battaglia tattica (nucleo): messa in campo, iniziativa, turni, movimento, attacchi di opportunità, azioni, superfici, fine, ripresa, invarianti.
const assert = require('assert');
const { E, A, AR, C, eroe, squadra, battaglia, metti, copia } = require('./avv_aiuti.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const S = require('../src/js/motori/27d-avv-stati.js');
const B = require('../src/js/motori/27f-avv-bestiario.js');
const rng = require('./carica.js').rng(77);
const ri = (n) => Math.floor(rng() * n);
const K = G.K;
const aperta = (righe, sup) => Object.assign(copia(AR.ripiego('strada')), { righe: righe || Array.from({ length: 11 }, () => '.........'), sup: sup || null });
const riga = (r, testo) => { const x = Array.from({ length: 11 }, () => '.........'); x[r] = testo; return x; };
const mostro = (s, id) => s.cb.find((c) => c.id === id), cella = (c) => { const o = G.aOffset(c.q, c.r); return [o.col, o.riga]; };
// passa il turno a chi non interessa (nessuno agisce) fino a quando tocca a `id`
function finoA(s, id) { let x = s; for (let n = 0; n < 300; n++) { const a = C.attore(x); if (a && a.id === id) return x; if (x.over) throw new Error('finita prima'); x = C.act(x, { t: 'fine' }).s; } throw new Error('turno non raggiunto: ' + id); }
const ok = (r, msg) => { assert(!r.err, (msg || '') + ' → ' + r.err); return r; };
const pronto = (squad, nem, o) => { const s = battaglia(squad, nem, o), a = finoA(s, (o && o.chi) || 'e1'); return a; };
const un = (cl, liv) => [{ eroe: eroe(cl, liv || 3), dist: 0 }];

// ---- messa in campo ----
{ const s = battaglia(squadra(4, 2), ['brigante', 'brigante', 'arciere-bandito'], { seme: 5 });
  JSON.parse(JSON.stringify(s)); assert.strictEqual(s.v, 1); assert.strictEqual(s.giro, 1); assert.strictEqual(s.over, null);
  assert.deepStrictEqual(s.cb.map((c) => c.id), ['e1', 'e2', 'e3', 'e4', 'brigante#1', 'brigante#2', 'arciere-bandito'], 'id: e1…e4, i doppi numerati');
  const pos = s.cb.map((c) => K(c.q, c.r)); assert.strictEqual(new Set(pos).size, pos.length, 'nessuno sulla stessa cella');
  const ing = (l) => (l === 'eroi' ? s.arena.ingressi.eroi : s.arena.ingressi.nemici).map((c) => K(c.q, c.r));
  for (const c of s.cb) assert(ing(c.lato).includes(K(c.q, c.r)), c.id + ' parte da un ingresso del suo lato');
  assert.deepStrictEqual(s.cb.slice(0, 4).map((c) => cella(c)[1]), [8, 9, 8, 8], 'guerriero e chierico davanti, il mago dietro'); assert.deepStrictEqual(s.cb.slice(4).map((c) => cella(c)[1]), [2, 2, 1], 'bruti davanti, tiratore dietro');
  assert.strictEqual(s.ordine.length, 7); const tot = s.ordine.map((id) => mostro(s, id).inizTot); assert.deepStrictEqual(tot, tot.slice().sort((a, b) => b - a), 'ordine per iniziativa');
  assert.strictEqual(C.attore(s).id, s.ordine[0]); assert.strictEqual(s.turno.id, s.ordine[0]);
  const a = C.attore(s), base = S.movEff(a); assert(s.turno.pm >= Math.max(1, base - 1) && s.turno.pm <= base + 2, 'movimento tirato: mov − 2 + 1d4: ' + s.turno.pm + ' con ' + base);
  assert.strictEqual(s.turno.azione && s.turno.bonus && a.rea, true); assert(a.abil && a.abil.perc >= 10);
  const sq = squadra(4, 2), nm = ['brigante', 'brigante', 'arciere-bandito']; assert.deepStrictEqual(battaglia(copia(sq), nm, { seme: 5 }), battaglia(copia(sq), nm, { seme: 5 }), 'stesso seme, stessa battaglia');
  const ordini = new Set(); for (let seme = 1; seme <= 30; seme++) ordini.add(battaglia(copia(sq), nm, { seme }).ordine.join()); assert(ordini.size >= 10, 'semi diversi, iniziative diverse');
  assert.throws(() => C.nuovo([], ['brigante'], AR.ripiego('strada')), /da 1 a 4/); assert.throws(() => C.nuovo(squadra(4, 1).concat(squadra(1, 1)), ['brigante'], AR.ripiego('strada')), /da 1 a 4/); assert.throws(() => C.nuovo(squadra(1, 1), [], AR.ripiego('strada')), /nemici/);
  const e = C.nuovo(squadra(1, 1), [{ def: 'lupo-grigio', q: 1, r: 3 }, 'brigante'], AR.ripiego('strada'), { seme: 2 }); assert.deepStrictEqual([mostro(e, 'lupo-grigio').q, mostro(e, 'lupo-grigio').r], [1, 3], 'posizione scelta'); }
// il capo si schiera per primo, al centro
{ const s = battaglia(squadra(2, 5), ['brigante', 'capobanda-corvino', 'arciere-bandito'], { arena: AR.capo('capobanda-corvino') }); assert.deepStrictEqual(cella(mostro(s, 'capobanda-corvino')), [4, 2], 'il capo davanti al centro'); assert.strictEqual(s.arena.id, 'accampamento'); }

// ---- eroi in ritardo ----
{ let s = battaglia([{ eroe: eroe('guerriero', 2), dist: 0 }, { eroe: eroe('mago', 2), dist: 2 }], ['brigante'], { seme: 4 });
  const e2 = mostro(s, 'e2'); assert(e2.fuori && e2.q === null && !s.ordine.includes('e2') && s.riserva.length === 1 && s.riserva[0].giro === 3);
  let arrivato = null; for (let n = 0; n < 60 && !arrivato; n++) { const r = C.act(s, { t: 'fine' }); s = r.s; arrivato = r.ev.find((e) => e.t === 'arriva'); if (!arrivato) assert(s.giro < 3 || mostro(s, 'e2').q !== null); }
  assert(arrivato && arrivato.chi === 'e2' && s.giro === 3, 'arriva all\'inizio del terzo giro'); assert(!mostro(s, 'e2').fuori && s.ordine.includes('e2') && s.arena.uscite.some((u) => u.q === arrivato.q && u.r === arrivato.r), 'dall\'uscita, e entra nell\'ordine'); assert.strictEqual(s.riserva.length, 0); }

// ---- sorpresa: chi è sorpreso salta il primo turno ----
for (const lato of ['nemici', 'eroi']) { let s = battaglia(squadra(2, 2), ['brigante', 'brigante'], { seme: 9, opz: { sorpresa: lato } }), visti1 = new Set(), visti2 = new Set();
  for (let n = 0; n < 40 && s.giro < 3; n++) { const a = C.attore(s); (s.giro === 1 ? visti1 : visti2).add(a.lato); s = C.act(s, { t: 'fine' }).s; }
  assert(!visti1.has(lato), lato + ' sorpresi: nessun turno nel primo giro'); assert(visti2.has(lato), 'e dal secondo giro agiscono'); }

// ---- movimento ----
{ let s = pronto(un('guerriero'), ['brigante'], { seme: 6, arena: aperta() }); metti(s, 'e1', 4, 8); metti(s, 'brigante', 4, 1); s.turno.pm = 4; const q0 = copia(mostro(s, 'e1'));
  const m = C.mosseValide(s); assert(m.muovi.length > 20 && m.muovi.every((x) => x.costo >= 1 && x.costo <= 4 && !(x.q === m.muovi[0].q && x.r === m.muovi[0].r && false)));
  const dest = G.daOffset(4, 6); const r = ok(C.act(s, { t: 'muovi', a: dest }), 'due passi'); const h = mostro(r.s, 'e1');
  assert.deepStrictEqual([h.q, h.r], [dest.q, dest.r]); assert.strictEqual(r.s.turno.pm, 2, 'due punti spesi'); const mv = r.ev.find((e) => e.t === 'muovi'); assert(mv && mv.passi.length === 2 && mv.costo === 2 && G.dist(q0, mv.passi[0]) === 1);
  assert.strictEqual(s.turno.pm, 4, 'lo stato passato non cambia'); assert.strictEqual(JSON.stringify(s).includes('"muovi"'), false);
  const r2 = ok(C.act(r.s, { t: 'muovi', a: G.daOffset(4, 4) })); assert.strictEqual(r2.s.turno.pm, 0); assert.strictEqual(C.act(r2.s, { t: 'muovi', a: G.daOffset(4, 3) }).err, 'Non hai movimento');
  assert(C.act(s, { t: 'muovi', a: pos(s, 'e1') }).err, 'restare fermo non è un movimento'); assert(C.act(s, { t: 'muovi', a: G.daOffset(4, 1) }).err, 'non si arriva sopra un nemico'); assert(C.act(s, { t: 'muovi', a: G.daOffset(4, 2) }).err, 'oltre il movimento');
  assert(C.act(s, { t: 'muovi', a: { q: -5, r: 99 } }).err); assert(C.act(s, { t: 'muovi' }).err); assert(C.act(s, { t: 'volare' }).err, 'azione sconosciuta'); assert(C.act(s, { t: 'fine', chi: 'brigante' }).err, 'non è il turno di un altro'); }
function pos(s, id) { const c = mostro(s, id); return { q: c.q, r: c.r }; }
{ // ostacoli: un muro e un'altura cambiano il costo; i nemici sbarrano; gli alleati si attraversano ma non ci si ferma
  let s = pronto(un('guerriero'), ['brigante'], { seme: 6, arena: aperta(riga(7, '...,,,...')) }); metti(s, 'e1', 4, 8); metti(s, 'brigante', 4, 1); s.turno.pm = 4;
  const r = ok(C.act(s, { t: 'muovi', a: G.daOffset(4, 7) })); assert.strictEqual(r.s.turno.pm, 2, 'il terreno difficile costa 2');
  s = pronto(un('guerriero'), ['brigante'], { seme: 6, arena: aperta(riga(7, '...^^^...')) }); metti(s, 'e1', 4, 8); metti(s, 'brigante', 4, 1); s.turno.pm = 4; assert.strictEqual(ok(C.act(s, { t: 'muovi', a: G.daOffset(4, 7) })).s.turno.pm, 2, 'salire costa +1');
  s = pronto(un('guerriero'), ['brigante'], { seme: 6, arena: aperta(riga(7, '#########')) }); metti(s, 'e1', 4, 8); metti(s, 'brigante', 4, 1); s.turno.pm = 8; assert(C.act(s, { t: 'muovi', a: G.daOffset(4, 6) }).err, 'un muro da parte a parte chiude');
  s = pronto(un('guerriero'), ['brigante'], { seme: 6, arena: aperta(riga(7, '.#######.')) }); metti(s, 'e1', 4, 8); metti(s, 'brigante', 4, 1); s.turno.pm = 8; assert(!C.act(s, { t: 'muovi', a: G.daOffset(0, 6) }).err, 'si gira intorno'); assert(!C.act(s, { t: 'muovi', a: G.daOffset(0, 7) }).err);
  s = pronto(squadra(2, 3), ['brigante'], { seme: 6, arena: aperta() }); metti(s, 'e1', 4, 8); metti(s, 'e2', 4, 7); metti(s, 'brigante', 4, 1); s = finoA(s, 'e1'); s.turno.pm = 4;
  assert(!C.act(s, { t: 'muovi', a: G.daOffset(4, 6) }).err, 'si passa attraverso un alleato'); assert(C.act(s, { t: 'muovi', a: G.daOffset(4, 7) }).err, 'ma non ci si ferma');
  s = pronto(squadra(1, 3), ['brigante'], { seme: 6, arena: aperta(riga(6, '####.####')) }); metti(s, 'e1', 4, 8); metti(s, 'brigante', 4, 6); s.turno.pm = 8; assert(C.act(s, { t: 'muovi', a: G.daOffset(4, 5) }).err, 'un nemico in un varco sbarra la strada');
  const sa = copia(s); mostro(sa, 'brigante').hp = 0; S.aggiungi(mostro(sa, 'brigante'), 'terra'); mostro(sa, 'brigante').lato = 'nemici'; assert(!C.act(sa, { t: 'muovi', a: G.daOffset(4, 5) }).err, 'un nemico a terra non sbarra'); }

// ---- superfici ----
{ const sup = (r, t) => { const x = Array.from({ length: 11 }, () => '.........'); x[r] = t; return x; };
  const prova = (ch, seme, prima) => { const s = pronto(un('guerriero'), ['brigante'], { seme, arena: aperta(null, sup(6, '....' + ch + '....')) }); metti(s, 'e1', 4, 7); metti(s, 'brigante', 4, 1); s.turno.pm = 5; if (prima) prima(s); return C.act(s, { t: 'muovi', a: G.daOffset(4, 6) }); };
  const f = ok(prova('f', 3)); const h = mostro(f.s, 'e1'); assert(f.ev.some((e) => e.t === 'superficie' && e.sup === 'fuoco' && e.n >= 1), 'il fuoco brucia'); assert(h.hp < h.hpMax && S.ha(h, 'in-fiamme'), 'e lascia in fiamme');
  const esiti = { ok: 0, ko: 0 }; for (let seme = 1; seme <= 40; seme++) { const r = ok(prova('v', seme)), e = r.ev.find((x) => x.t === 'superficie'); assert(e && e.sup === 'veleno'); if (e.ok) { esiti.ok++; assert(!S.ha(mostro(r.s, 'e1'), 'avvelenato')); } else { esiti.ko++; assert(S.ha(mostro(r.s, 'e1'), 'avvelenato')); } } assert(esiti.ok > 3 && esiti.ko > 3, 'veleno: a volte si resiste, a volte no');
  const gh = { ok: 0, ko: 0 }; for (let seme = 1; seme <= 40; seme++) { const r = ok(prova('g', seme)), e = r.ev.find((x) => x.t === 'superficie'); if (e.ok) gh.ok++; else { gh.ko++; assert(r.ev.some((x) => x.t === 'scivola') && r.s.turno.pm === 0, 'sul ghiaccio si scivola e il movimento finisce'); } } assert(gh.ok > 3 && gh.ko > 3, 'ghiaccio: a volte si scivola');
  const w = ok(prova('w', 3, (s) => { S.aggiungi(mostro(s, 'e1'), 'in-fiamme', 3); })); assert(!S.ha(mostro(w.s, 'e1'), 'in-fiamme') && w.ev.some((e) => e.spenta), 'l\'acqua spegne il fuoco'); assert.strictEqual(w.s.turno.pm, 5 - 2, 'e costa come terreno difficile'); }

// ---- attacchi di opportunità ----
{ const prepara = (seme, mod) => { const s = pronto(un('guerriero', 3), ['brigante'], { seme, arena: aperta() }); metti(s, 'e1', 4, 5); metti(s, 'brigante', 5, 5); s.turno.pm = 5; const b = mostro(s, 'brigante'); b.att = 100; if (mod) mod(s, b); return s; };
  let s = prepara(3); const r = ok(C.act(s, { t: 'muovi', a: G.daOffset(1, 5) })); assert(r.ev.some((e) => e.t === 'opportunita' && e.chi === 'brigante' && e.bers === 'e1'), 'uscire dalla portata costa un attacco'); assert.strictEqual(mostro(r.s, 'brigante').rea, false); assert(r.ev.some((e) => e.t === 'tiro'), 'con il suo tiro');
  const r2 = ok(C.act(prepara(3, null), { t: 'disimpegno' })); const r3 = ok(C.act(r2.s, { t: 'muovi', a: G.daOffset(1, 5) })); assert(!r3.ev.some((e) => e.t === 'opportunita'), 'dopo Disimpegno niente attacco');
  s = prepara(3, (s, b) => { b.rea = false; }); assert(!ok(C.act(s, { t: 'muovi', a: G.daOffset(1, 5) })).ev.some((e) => e.t === 'opportunita'), 'senza reazione niente attacco');
  s = prepara(3, (s, b) => { S.aggiungi(b, 'stordito', 2); }); assert(!ok(C.act(s, { t: 'muovi', a: G.daOffset(1, 5) })).ev.some((e) => e.t === 'opportunita'), 'chi è stordito non reagisce');
  s = prepara(3); assert(!ok(C.act(s, { t: 'muovi', a: G.daOffset(5, 6) })).ev.some((e) => e.t === 'opportunita'), 'restare nella portata (girargli intorno) non fa scattare niente');
  s = pronto(un('guerriero', 3), ['arciere-bandito'], { seme: 3, arena: aperta() }); metti(s, 'e1', 4, 5); metti(s, 'arciere-bandito', 5, 5); s.turno.pm = 5; assert(!ok(C.act(s, { t: 'muovi', a: G.daOffset(1, 5) })).ev.some((e) => e.t === 'opportunita'), 'un tiratore non attacca in mischia');
  s = prepara(3); let e0 = ok(C.act(s, { t: 'muovi', a: G.daOffset(3, 5) })); assert(e0.ev.some((e) => e.t === 'opportunita'), 'un solo passo basta'); const e1 = ok(C.act(e0.s, { t: 'muovi', a: G.daOffset(1, 5) })); assert(!e1.ev.some((e) => e.t === 'opportunita'), 'la reazione si spende una volta per giro');
  // chi cade mentre scappa resta dov'era e il suo turno finisce
  let cadute = 0; for (let seme = 1; seme <= 60; seme++) { const t = prepara(seme, (x, b) => { mostro(x, 'e1').hp = 1; b.dan = { n: 4, dado: 8, bonus: 4, tipo: 'taglio' }; }), q0 = pos(t, 'e1'), q = ok(C.act(t, { t: 'muovi', a: G.daOffset(1, 5) })), h = mostro(q.s, 'e1');
    if (h.hp === 0) { cadute++; assert.deepStrictEqual(pos(q.s, 'e1'), q0, 'cade dove stava'); assert(S.ha(h, 'terra') && q.ev.some((e) => e.t === 'cade' && e.chi === 'e1')); assert(q.s.over || C.attore(q.s).id !== 'e1', 'il turno passa'); } else assert(h.hp === 1 && pos(q.s, 'e1').q !== q0.q); }
  assert(cadute > 20, 'abbastanza casi in cui cade: ' + cadute); }

// chi scivola su una cella dove giace un alleato torna all'ultima cella libera (corridoio d'un esagono con ghiaccio sotto l'alleato)
{ let visti = 0, passati = 0; const righe = Array.from({ length: 11 }, (_, r) => (r >= 5 && r <= 9 ? '####.####' : '.........')), sup = Array.from({ length: 11 }, (_, r) => (r === 7 ? '....g....' : '.........'));
  for (let seme = 1; seme <= 80; seme++) { const s = pronto(squadra(2, 3), ['brigante'], { seme, arena: aperta(righe, sup) }); metti(s, 'e1', 4, 9); metti(s, 'e2', 4, 7); metti(s, 'brigante', 4, 1); s.turno.pm = 6; const a = mostro(s, 'e2'); a.hp = 0; S.cade(a);
    const r = ok(C.act(s, { t: 'muovi', a: G.daOffset(4, 5) })); const celle = r.s.cb.filter(C.inCampo).map((c) => K(c.q, c.r)); assert.strictEqual(new Set(celle).size, celle.length, 'mai due sulla stessa cella');
    const mv = r.ev.find((e) => e.t === 'muovi'); if (mv.indietro) { visti++; assert(r.ev.some((e) => e.t === 'scivola') && mv.passi.every((p) => !(p.q === a.q && p.r === a.r)), 'i passi finiscono prima della cella occupata'); assert.deepStrictEqual(pos(r.s, 'e1'), G.daOffset(4, 8), 'torna sulla cella prima'); } else passati++; }
  assert(visti >= 5 && passati >= 5, 'a volte scivola e torna indietro, a volte passa: ' + visti + '/' + passati); }

// ---- attacco con l'arma: bersagli, vista, copertura, altezza, distanza ----
{ let s = pronto(un('guerriero', 3), ['brigante', 'lupo-grigio'], { seme: 8, arena: aperta() }); metti(s, 'e1', 4, 5); metti(s, 'brigante', 5, 5); metti(s, 'lupo-grigio', 4, 2); s.turno.pm = 5;
  const x = C.anteprima(s, { t: 'attacca', bers: 'brigante' }); assert(x.pc > 0 && x.pc < 1 && x.dannoColpo > 0 && x.atteso > 0 && x.cop === 'nessuna' && !x.vant && !x.svant && x.dist === 1);
  const r = ok(C.act(s, { t: 'attacca', bers: 'brigante' })); const t = r.ev.find((e) => e.t === 'tiro'); assert(t && t.cont === mostro(s, 'brigante').ca, 'il tiro è contro la CA'); assert.strictEqual(r.s.turno.azione, false); assert.strictEqual(C.act(r.s, { t: 'attacca', bers: 'brigante' }).err, 'Hai già usato l\'azione');
  assert(C.act(s, { t: 'attacca', bers: 'lupo-grigio' }).err, 'troppo lontano per la mischia'); assert(C.act(s, { t: 'attacca', bers: 'e1' }).err, 'non si attacca da soli'); assert(C.act(s, { t: 'attacca', bers: 'nessuno' }).err); assert(C.act(s, { t: 'attacca' }).err);
  const d = copia(s); const bd = mostro(d, 'brigante'); bd.hp = 0; S.aggiungi(bd, 'terra'); assert(C.act(d, { t: 'attacca', bers: 'brigante' }).err, 'chi è a terra non si attacca');
  // copertura: un ostacolo basso in mezzo dà +2 alla CA e il tiro lo riporta
  const co = pronto(un('esploratore', 3), ['brigante'], { seme: 8, arena: aperta(riga(4, '....o....')) }); metti(co, 'e1', 4, 6); metti(co, 'brigante', 4, 2); const xc = C.anteprima(co, { t: 'attacca', bers: 'brigante' }); assert(!xc.err, xc.err); assert.strictEqual(xc.cop, 'mezza'); assert.strictEqual(xc.ca, 2);
  const tc = ok(C.act(co, { t: 'attacca', bers: 'brigante' })).ev.find((e) => e.t === 'tiro'); assert.strictEqual(tc.cont, mostro(co, 'brigante').ca + 2, 'il bersaglio del tiro include la copertura');
  const mu = pronto(un('esploratore', 3), ['brigante'], { seme: 8, arena: aperta(riga(4, '....#....')) }); metti(mu, 'e1', 4, 6); metti(mu, 'brigante', 4, 2); assert(/vedi/.test(C.act(mu, { t: 'attacca', bers: 'brigante' }).err), 'un muro nasconde il bersaglio');
  // distanza lunga: svantaggio; oltre la lunga: niente; altezza: vantaggio
  const lu = pronto(un('esploratore', 3), ['brigante'], { seme: 8, arena: aperta() }); metti(lu, 'e1', 4, 9); metti(lu, 'brigante', 4, 2); const e1 = mostro(lu, 'e1'); assert.strictEqual(e1.gitt, 5);
  const xl = C.anteprima(lu, { t: 'attacca', bers: 'brigante' }); assert(!xl.err && xl.lunga && xl.svant && xl.dist === 7, 'oltre la portata normale: svantaggio'); metti(lu, 'e1', 0, 9); metti(lu, 'brigante', 8, 0); assert(G.dist(pos(lu, 'e1'), pos(lu, 'brigante')) > 10); assert(C.anteprima(lu, { t: 'attacca', bers: 'brigante' }).err, 'oltre la lunga: troppo lontano');
  const al = pronto(un('guerriero', 3), ['brigante'], { seme: 8, arena: aperta(riga(5, '....^....')) }); metti(al, 'e1', 4, 5); metti(al, 'brigante', 5, 5); const xa = C.anteprima(al, { t: 'attacca', bers: 'brigante' }); assert(xa.vant && !xa.svant, 'dall\'alto: vantaggio'); metti(al, 'e1', 5, 5); metti(al, 'brigante', 4, 5); assert(!C.anteprima(al, { t: 'attacca', bers: 'brigante' }).vant, 'dal basso niente');
  // tiro ravvicinato: con un nemico adiacente chi tira da lontano ha svantaggio
  const pb = pronto(un('esploratore', 3), ['brigante', 'lupo-grigio'], { seme: 8, arena: aperta() }); metti(pb, 'e1', 4, 6); metti(pb, 'brigante', 4, 3); metti(pb, 'lupo-grigio', 5, 6); assert(!C.anteprima(pb, { t: 'attacca', bers: 'brigante' }).svant || true);
  assert(C.anteprima(pb, { t: 'attacca', bers: 'brigante' }).svant, 'con un nemico addosso si tira male'); metti(pb, 'lupo-grigio', 4, 0); assert(!C.anteprima(pb, { t: 'attacca', bers: 'brigante' }).svant, 'senza nemici vicini no');
  // il ladro ha il furtivo con un alleato vicino al bersaglio
  const la = pronto([{ eroe: eroe('ladro', 3), dist: 0 }, { eroe: eroe('guerriero', 3), dist: 0 }], ['brigante'], { seme: 8, arena: aperta(), chi: 'e1' }); metti(la, 'e1', 4, 5); metti(la, 'e2', 5, 4); metti(la, 'brigante', 5, 5); let fur = 0; for (let seme = 1; seme <= 60; seme++) { const x = copia(la); x.rng = seme * 977; if (ok(C.act(x, { t: 'attacca', bers: 'brigante' })).ev.some((e) => e.t === 'furtivo')) fur++; } assert(fur > 10, 'il furtivo scatta con un alleato accanto al bersaglio: ' + fur); }

// ---- azioni di supporto: scatto, disimpegno, nasconditi, aiuta, rialza, spingi ----
{ let s = pronto(un('guerriero', 3), ['brigante'], { seme: 11, arena: aperta() }); metti(s, 'e1', 4, 9); metti(s, 'brigante', 4, 1); const pm = s.turno.pm;
  const sc = ok(C.act(s, { t: 'scatto' })); assert.strictEqual(sc.s.turno.pm, pm * 2, 'Scatto raddoppia il movimento'); assert.strictEqual(sc.s.turno.azione, false); assert(C.act(sc.s, { t: 'scatto' }).err); assert(C.act(sc.s, { t: 'disimpegno' }).err, 'una sola azione');
  const di = ok(C.act(s, { t: 'disimpegno' })); assert.strictEqual(di.s.turno.disimpegno, true);
  // nasconditi: in campo aperto ti vedono; dietro un riparo si tira; fuori vista riesce sempre
  assert(/riparo/.test(C.act(s, { t: 'nasconditi' }).err), 'senza riparo non si può'); const ri_ = pronto(un('ladro', 3), ['brigante'], { seme: 11, arena: aperta(riga(5, '....o....')) }); metti(ri_, 'e1', 4, 8); metti(ri_, 'brigante', 4, 3);
  const e = { ok: 0, ko: 0 }; for (let seme = 1; seme <= 60; seme++) { const x = copia(ri_); x.rng = seme * 131; const r = ok(C.act(x, { t: 'nasconditi' })), n = r.ev.find((y) => y.t === 'nasconditi'); assert(n.cd >= 10 && n.tiro >= 1); if (n.ok) { e.ok++; assert(S.ha(mostro(r.s, 'e1'), 'nascosto')); } else { e.ko++; assert(!S.ha(mostro(r.s, 'e1'), 'nascosto')); } assert.strictEqual(r.s.turno.azione, false); } assert(e.ok > 10 && e.ko > 5, 'a volte riesce, a volte no: ' + JSON.stringify(e));
  const nv = pronto(un('ladro', 3), ['brigante'], { seme: 11, arena: aperta(riga(5, '#########')) }); metti(nv, 'e1', 4, 8); metti(nv, 'brigante', 4, 3); for (let seme = 1; seme <= 10; seme++) { const x = copia(nv); x.rng = seme; assert(S.ha(mostro(ok(C.act(x, { t: 'nasconditi' })).s, 'e1'), 'nascosto'), 'fuori vista riesce sempre'); }
  // aiuta
  const ai = pronto(squadra(2, 3), ['brigante'], { seme: 11, arena: aperta() }); metti(ai, 'e1', 4, 8); metti(ai, 'e2', 5, 8); metti(ai, 'brigante', 4, 1); const a1 = ok(C.act(ai, { t: 'aiuta', bers: 'e2' })); assert(S.ha(mostro(a1.s, 'e2'), 'mirato'), 'l\'alleato ha vantaggio al prossimo attacco'); assert(C.act(ai, { t: 'aiuta', bers: 'e1' }).err && C.act(ai, { t: 'aiuta', bers: 'brigante' }).err);
  metti(ai, 'e2', 4, 3); assert(C.act(ai, { t: 'aiuta', bers: 'e2' }).err, 'un alleato lontano non si aiuta');
  // rialza
  const ra = pronto(squadra(2, 3), ['brigante'], { seme: 11, arena: aperta() }); metti(ra, 'e1', 4, 8); metti(ra, 'e2', 5, 8); metti(ra, 'brigante', 4, 1); const e2 = mostro(ra, 'e2'); e2.hp = 0; S.cade(e2); assert(S.ha(e2, 'terra'));
  const rr = { ok: 0, ko: 0 }; for (let seme = 1; seme <= 60; seme++) { const x = copia(ra); x.rng = seme * 71; const r = ok(C.act(x, { t: 'rialza', bers: 'e2' })), n = r.ev.find((y) => y.t === 'rialza'); const h = mostro(r.s, 'e2'); if (n.ok) { rr.ok++; assert(h.hp > 0 && !S.ha(h, 'terra') && n.hp === h.hp, 'si rialza con qualche PF'); } else { rr.ko++; assert(h.hp === 0 && S.ha(h, 'terra')); } assert.strictEqual(r.s.turno.azione, false); } assert(rr.ok > 20 && rr.ko > 0 || rr.ok > 40, 'a volte riesce: ' + JSON.stringify(rr));
  metti(ra, 'e2', 4, 3); assert(C.act(ra, { t: 'rialza', bers: 'e2' }).err, 'bisogna esserle vicini'); metti(ra, 'e2', 5, 8); mostro(ra, 'e2').hp = 5; S.togli(mostro(ra, 'e2'), 'terra'); assert(C.act(ra, { t: 'rialza', bers: 'e2' }).err, 'chi è in piedi non si rialza');
  // spingi
  const sp = pronto(un('guerriero', 3), ['brigante'], { seme: 11, arena: aperta() }); metti(sp, 'e1', 4, 5); metti(sp, 'brigante', 4, 4); const spe = { ok: 0, ko: 0 }; for (let seme = 1; seme <= 60; seme++) { const x = copia(sp); x.rng = seme * 53; const r = ok(C.act(x, { t: 'spingi', bers: 'brigante' })), n = r.ev.find((y) => y.t === 'spingi'), b = mostro(r.s, 'brigante'); if (n.ok) { spe.ok++; assert.strictEqual(G.dist(r.s.cb[0], b), 2, 'spinto di un passo'); } else { spe.ko++; assert.strictEqual(G.dist(r.s.cb[0], b), 1); } } assert(spe.ok > 5 && spe.ko > 5, 'a volte regge: ' + JSON.stringify(spe));
  const spm = pronto(un('guerriero', 3), ['brigante'], { seme: 11, arena: aperta(riga(3, '#########')) }); metti(spm, 'e1', 4, 5); metti(spm, 'brigante', 4, 4); for (let seme = 1; seme <= 30; seme++) { const x = copia(spm); x.rng = seme; const r = ok(C.act(x, { t: 'spingi', bers: 'brigante' })); assert(!r.ev.find((y) => y.t === 'spingi').ok || G.passabile(x.arena, pos(r.s, 'brigante')), 'contro un muro non si spinge'); } }

// ---- Concentrazione sul movimento, fuga, resa ----
{ let s = pronto(un('guerriero', 3), ['brigante'], { seme: 12, arena: aperta() }); const h = mostro(s, 'e1'); assert(h.conc >= 1); const c0 = h.conc, pm0 = s.turno.pm; const r = ok(C.act(s, { t: 'ritira-mov' })); assert.strictEqual(mostro(r.s, 'e1').conc, c0 - 1); assert(r.s.turno.pm >= 1 && r.s.turno.pm <= S.movEff(h) + 2); assert(C.act(r.s, { t: 'ritira-mov' }).err, 'una volta sola');
  const mv = ok(C.act(s, { t: 'muovi', a: G.daOffset(4, 7) })); assert(C.act(mv.s, { t: 'ritira-mov' }).err, 'dopo aver mosso non si ritira'); const v = copia(s); mostro(v, 'e1').conc = 0; assert(C.act(v, { t: 'ritira-mov' }).err, 'serve un punto');
  assert(C.mosseValide(s).azioni.includes('ritira-mov') && !C.mosseValide(mv.s).azioni.includes('ritira-mov'));
  // fuggi: solo da un'uscita, con movimento
  const f = pronto(squadra(2, 3), ['brigante'], { seme: 12, arena: aperta() }); metti(f, 'e1', 3, 10); metti(f, 'brigante', 4, 1); assert(C.mosseValide(f).azioni.includes('fuggi')); const fr = ok(C.act(f, { t: 'fuggi' })); const e1 = mostro(fr.s, 'e1'); assert(e1.fuggito && !fr.s.ordine.includes('e1') && fr.ev.some((e) => e.t === 'fuggito') && !fr.s.over && C.attore(fr.s).id !== 'e1');
  const nf = pronto(squadra(2, 3), ['brigante'], { seme: 12, arena: aperta() }); metti(nf, 'e1', 3, 9); assert(C.act(nf, { t: 'fuggi' }).err, 'non da una cella qualunque'); const z = copia(f); z.turno.pm = 0; assert(C.act(z, { t: 'fuggi' }).err, 'serve un punto di movimento');
  // fuggono tutti i vivi: la battaglia finisce in fuga
  let u = f; mostro(u, 'e2').hp = 0; S.cade(mostro(u, 'e2')); const fin = ok(C.act(u, { t: 'fuggi' })); assert(fin.s.over && fin.s.over.esito === 'fuga', 'l\'ultimo eroe in piedi che fugge chiude la battaglia'); assert.strictEqual(C.riepilogo(fin.s).eroi.find((x) => x.id === 'e1').stato, 'fuggito');
  // fuga di gruppo
  const g = { ok: 0, ko: 0 }; for (let seme = 1; seme <= 60; seme++) { const x = pronto(squadra(3, 3), ['brigante', 'lupo-grigio'], { seme: 12, arena: aperta() }); x.rng = seme * 313; const r = ok(C.act(x, { t: 'fuga-gruppo' })), n = r.ev.find((y) => y.t === 'fuga-gruppo'); assert(n.cd >= 11 && n.prove.length === 3); if (n.ok) { g.ok++; assert(r.s.over.esito === 'fuga' && r.s.cb.filter((c) => c.lato === 'eroi').every((c) => c.fuggito)); } else { g.ko++; assert(!r.s.over && r.s.turno.azione === false); } } assert(g.ok > 5 && g.ko > 5, JSON.stringify(g));
  assert(C.act(s, { t: 'fuga-gruppo' }).s.over || true); const nm = pronto(un('guerriero', 3), ['brigante'], { seme: 12, arena: aperta(), chi: 'brigante' }); assert(C.act(nm, { t: 'fuga-gruppo' }).err, 'i mostri non fuggono così');
  // resa: solo se il mostro la prevede e con pochi PF
  const rs = pronto(un('guerriero', 3), ['brigante'], { seme: 12, arena: aperta(), chi: 'brigante' }); assert(C.act(rs, { t: 'arrendi' }).err, 'non con tutti i PF'); mostro(rs, 'brigante').hp = 3; assert(C.mosseValide(rs).azioni.includes('arrendi')); const ar = ok(C.act(rs, { t: 'arrendi' })); assert(mostro(ar.s, 'brigante').arreso && ar.s.over && ar.s.over.esito === 'vittoria', 'resa dell\'ultimo nemico = vittoria'); assert.strictEqual(C.riepilogo(ar.s).nemici[0].esito, 'arreso'); assert.strictEqual(C.riepilogo(ar.s).xp, B.M.brigante.xp, 'conta per l\'esperienza');
  const nr = pronto(un('guerriero', 3), ['lupo-grigio'], { seme: 12, arena: aperta(), chi: 'lupo-grigio' }); mostro(nr, 'lupo-grigio').hp = 1; assert(C.act(nr, { t: 'arrendi' }).err, 'le bestie non si arrendono'); }

// ---- stati e turni: chi non può agire salta, le durate scorrono, chi è a terra resta in ordine ----
{ let s = pronto(un('guerriero', 3), ['brigante', 'lupo-grigio'], { seme: 14, arena: aperta() }); const b = mostro(s, 'brigante'); S.aggiungi(b, 'stordito', 1); let visto = false; let x = s;
  for (let n = 0; n < 12 && x.giro < 3; n++) { const a = C.attore(x); if (x.giro === 1 && a.id === 'brigante') visto = true; x = C.act(x, { t: 'fine' }).s; } assert(!visto, 'lo stordito salta il turno'); assert(!S.ha(mostro(x, 'brigante'), 'stordito'), 'e lo stordimento passa'); let agisce = false; for (let n = 0; n < 12 && x.giro < 5; n++) { if (C.attore(x).id === 'brigante') agisce = true; x = C.act(x, { t: 'fine' }).s; } assert(agisce, 'poi torna a muoversi');
  // fiamme: scotta all'inizio del turno e può far cadere
  const d = pronto(un('guerriero', 3), ['brigante'], { seme: 14, arena: aperta() }); const hd = mostro(d, 'e1'); S.aggiungi(hd, 'in-fiamme', 3); hd.hp = 1; let r = { s: d }; let cad = null; for (let n = 0; n < 8 && !cad; n++) { r = ok(C.act(r.s, { t: 'fine' })); cad = r.ev.find((e) => e.t === 'cade' && e.chi === 'e1'); } assert(cad, 'le fiamme possono abbattere'); assert(r.s.ordine.includes('e1') && S.ha(mostro(r.s, 'e1'), 'terra'), 'chi cade resta in ordine');
  // chi è a terra salta il turno
  let seen = false, y = r.s; for (let n = 0; n < 12 && !y.over && y.giro < 6; n++) { if (C.attore(y).id === 'e1') seen = true; y = C.act(y, { t: 'fine' }).s; } assert(!seen, 'a terra non si agisce');
  // la reazione si ricarica a inizio turno
  const q = prepara(); function prepara() { const t = pronto(un('guerriero', 3), ['brigante'], { seme: 14, arena: aperta() }); metti(t, 'e1', 4, 5); metti(t, 'brigante', 5, 5); mostro(t, 'brigante').rea = false; return t; } let z = q; z = finoA(C.act(z, { t: 'fine' }).s, 'brigante'); assert.strictEqual(mostro(z, 'brigante').rea, true, 'a inizio turno la reazione torna'); }

// ---- fine della battaglia ----
{ // vittoria con la ricompensa
  let v = null; for (let seme = 1; seme <= 80 && !v; seme++) { const s = pronto(squadra(2, 3), ['brigante'], { seme: 15, arena: aperta() }); metti(s, 'e1', 4, 5); metti(s, 'e2', 5, 6); metti(s, 'brigante', 5, 5); mostro(s, 'brigante').hp = 1; s.rng = seme * 17; const r = C.act(s, { t: 'attacca', bers: 'brigante' }); if (r.s && r.s.over) v = r; }
  assert(v && v.s.over.esito === 'vittoria' && v.ev.some((e) => e.t === 'muore' && e.chi === 'brigante') && v.ev.some((e) => e.t === 'fine'), 'l\'ultimo nemico a terra: vittoria'); assert(!v.s.ordine.includes('brigante'));
  const rp = C.riepilogo(v.s); assert.strictEqual(rp.esito, 'vittoria'); assert.strictEqual(rp.xp, B.M.brigante.xp); assert.strictEqual(rp.xpPerEroe, Math.floor(B.M.brigante.xp / 2)); assert(rp.eroi.length === 2 && rp.eroi.every((x) => x.stato === 'in-piedi' && x.xp === rp.xpPerEroe && x.conc >= 0 && typeof x.usi === 'object'));
  assert.deepStrictEqual(rp.nemici, [{ id: 'brigante', def: 'brigante', esito: 'sconfitto' }]); assert.strictEqual(C.act(v.s, { t: 'fine' }).err, 'Battaglia finita'); assert.strictEqual(C.mosseValide(v.s), null);
  // sconfitta: il mostro abbatte l'ultimo eroe in piedi
  let d = null; for (let seme = 1; seme <= 80 && !d; seme++) { const s = pronto(un('mago', 1), ['brigante'], { seme: 16, arena: aperta(), chi: 'brigante' }); metti(s, 'e1', 4, 5); metti(s, 'brigante', 5, 5); const b = mostro(s, 'brigante'); b.att = 100; b.dan = { n: 4, dado: 10, bonus: 5, tipo: 'taglio' }; s.rng = seme * 19; const r = C.act(s, { t: 'attacca', bers: 'e1' }); if (r.s && r.s.over) d = r; }
  assert(d && d.s.over.esito === 'sconfitta' && d.ev.some((e) => e.t === 'cade'), 'tutti gli eroi a terra: sconfitta'); assert.strictEqual(C.riepilogo(d.s).eroi[0].stato, 'a-terra'); assert.strictEqual(C.riepilogo(d.s).xp, 0);
  // stallo: nessuno fa niente
  let st = battaglia(squadra(1, 2), ['brigante'], { seme: 17, opz: { giriMax: 3 } }); let n = 0; while (!st.over && n++ < 100) st = C.act(st, { t: 'fine' }).s; assert(st.over && st.over.esito === 'stallo' && st.over.giri === 4, 'oltre il limite dei giri: stallo'); assert.strictEqual(C.riepilogo(st).xp, 0);
  assert.strictEqual(C.GIRI_MAX, 40); assert.strictEqual(battaglia(squadra(1, 1), ['brigante']).opz.giriMax, 40);
  // non finisce finché ci sono eroi in ritardo
  let ri2 = battaglia([{ eroe: eroe('guerriero', 2), dist: 0 }, { eroe: eroe('mago', 2), dist: 3 }], ['brigante'], { seme: 18 }); const e1 = mostro(ri2, 'e1'); e1.hp = 0; S.cade(e1); const r5 = C.act(ri2, { t: 'fine' }); assert(!r5.s || !r5.s.over, 'con un eroe in arrivo non è ancora finita'); }

// ---- ripresa e determinismo: stessa partita, con e senza salvataggi a ogni mossa ----
function scegli(s, r) { const m = C.mosseValide(s); const k = r(); if (k < .35 && m.attacchi.length) return { t: 'attacca', bers: m.attacchi[Math.floor(r() * m.attacchi.length)].bers };
  if (k < .6 && m.muovi.length) { const x = m.muovi[Math.floor(r() * m.muovi.length)]; return { t: 'muovi', a: { q: x.q, r: x.r } }; }
  if (k < .68 && m.azioni.includes('disimpegno')) return { t: 'disimpegno' }; if (k < .73 && m.azioni.includes('nasconditi')) return { t: 'nasconditi' }; if (k < .78 && m.bersagli.rialza) return { t: 'rialza', bers: m.bersagli.rialza[0] };
  if (k < .82 && m.bersagli.aiuta) return { t: 'aiuta', bers: m.bersagli.aiuta[0] }; if (k < .86 && m.bersagli.spingi) return { t: 'spingi', bers: m.bersagli.spingi[0] }; if (k < .88 && m.azioni.includes('scatto')) return { t: 'scatto' };
  if (k < .9 && m.azioni.includes('arrendi')) return { t: 'arrendi' }; if (k < .92 && m.azioni.includes('fuggi') && r() < .1) return { t: 'fuggi' }; if (k < .93 && m.azioni.includes('ritira-mov')) return { t: 'ritira-mov' }; if (k < .94 && m.azioni.includes('fuga-gruppo') && r() < .1) return { t: 'fuga-gruppo' };
  return { t: 'fine' }; }
function giocaTutta(s, seme, salva) { const r = require('./carica.js').rng(seme), log = []; let x = s, n = 0; while (!x.over && n++ < 4000) { const a = scegli(x, r); const y = C.act(x, a); assert(!y.err, 'mossa valida rifiutata: ' + JSON.stringify(a) + ' → ' + y.err); log.push(y.ev.length); x = salva ? JSON.parse(JSON.stringify(y.s)) : y.s; } return { s: x, log, n }; }
{ for (let seme = 1; seme <= 12; seme++) { const s0 = battaglia(squadra(1 + seme % 4, 2), ['brigante', 'lupo-grigio', 'arciere-bandito'].slice(0, 1 + seme % 3), { seme, ambiente: AR.AMBIENTI[seme % 8] }); const a = giocaTutta(copia(s0), seme, false), b = giocaTutta(copia(s0), seme, true);
    assert(a.s.over, 'la battaglia finisce'); assert.deepStrictEqual(b.s, a.s, 'salvare e riprendere a ogni mossa dà lo stesso finale (seme ' + seme + ')'); assert.deepStrictEqual(b.log, a.log); } }

// ---- invarianti su molte battaglie casuali ----
function invarianti(s) {
  const celle = new Set(); for (const c of s.cb) { assert(Number.isInteger(c.hp) && c.hp >= 0 && c.hp <= c.hpMax, c.id + ' PF ' + c.hp); assert(c.temp >= 0); assert(c.conc >= 0 && c.conc <= c.concMax, c.id + ' conc');
    if (c.lato === 'eroi' && !c.fuori && !c.fuggito) assert.strictEqual(c.hp === 0, S.ha(c, 'terra'), c.id + ': a terra se e solo se 0 PF'); if (c.morto) assert.strictEqual(c.hp, 0);
    if (c.fuori) assert(c.q === null && c.r === null); if (C.inCampo(c)) { assert(G.dentro(s.arena, c) && G.passabile(s.arena, c), c.id + ' fuori posto'); const k = K(c.q, c.r); assert(!celle.has(k), 'due sulla stessa cella ' + k); celle.add(k); }
    for (const [id, n] of Object.entries(c.usi || {})) assert(n >= 0 && n <= A.usiMax(c, A.P[id]), 'cariche di ' + id); }
  const dentro = s.cb.filter(C.inCampo).map((c) => c.id).sort(); assert.deepStrictEqual(s.ordine.slice().sort(), dentro, 'l\'ordine è chi sta in campo'); assert.strictEqual(new Set(s.ordine).size, s.ordine.length);
  if (!s.over) { assert(s.i >= 0 && s.i < s.ordine.length); assert.strictEqual(s.turno.id, s.ordine[s.i]); assert(Number.isInteger(s.turno.pm) && s.turno.pm >= 0); } else assert(['vittoria', 'sconfitta', 'fuga', 'stallo'].includes(s.over.esito));
  assert.strictEqual(s.cb.length, new Set(s.cb.map((c) => c.id)).size); JSON.parse(JSON.stringify(s)); }
{ const fam = [['lupo-grigio', 'cinghiale-irsuto', 'sciame-di-corvi', 'ragno-tessitore'], ['brigante', 'arciere-bandito', 'cerusico-di-strada', 'tagliagole'], ['scheletro-armato', 'arciere-scheletro', 'ghoul-di-tomba', 'anima-in-pena'], ['famiglio-arcano', 'statua-vivente', 'sciame-di-scintille', 'ombra-del-corvo']];
  const esiti = {}; let azioni = 0;
  for (let n = 0; n < 100; n++) { const liv = 1 + ri(4), eroi = Array.from({ length: 1 + ri(4) }, (_, i) => ({ eroe: eroe(['guerriero', 'mago', 'chierico', 'ladro', 'esploratore', 'bardo'][ri(6)], liv, ['umano', 'elfo', 'nano', 'piccolo', 'orco'][ri(5)]), dist: i && ri(5) === 0 ? 2 + ri(2) : 0 }));
    const f = fam[ri(4)], nem = Array.from({ length: 1 + ri(4) }, () => f[ri(f.length)]); let s = battaglia(eroi, nem, { seme: 1000 + n, ambiente: AR.AMBIENTI[ri(8)], opz: { sorpresa: ri(5) === 0 ? ['eroi', 'nemici'][ri(2)] : null } });
    const r = require('./carica.js').rng(9000 + n); invarianti(s); let k = 0; while (!s.over && k++ < 3000) { const a = scegli(s, r), before = JSON.stringify(s), y = C.act(s, a); assert(!y.err, JSON.stringify(a) + ' → ' + y.err); assert.strictEqual(JSON.stringify(s), before, 'act non cambia lo stato che riceve'); s = y.s; invarianti(s); azioni++;
      if (a.t === 'attacca') assert.strictEqual(s.turno.azione, s.over ? s.turno.azione : false); }
    assert(s.over, 'la battaglia ' + n + ' non finisce'); assert(s.giro <= 41); esiti[s.over.esito] = (esiti[s.over.esito] || 0) + 1; const rp = C.riepilogo(s); assert.strictEqual(rp.eroi.length, eroi.length); assert(rp.xp >= 0 && rp.xpPerEroe * rp.eroi.filter((x) => !s.cb.find((c) => c.id === x.id).fuori).length <= rp.xp); }
  assert(esiti.vittoria > 10 && esiti.sconfitta > 5, 'sono possibili vittorie e sconfitte: ' + JSON.stringify(esiti)); console.log('scontro: 100 battaglie casuali, ' + azioni + ' azioni, esiti ' + JSON.stringify(esiti)); }
console.log('scontro ok');
