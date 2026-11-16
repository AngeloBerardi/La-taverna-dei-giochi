// Compagnia di ventura, battaglia campale (V5): terreno (altura, bosco, case, acqua bassa) e formazioni dei gruppi
// (serrata, larga, cuneo). Stesse regole per il motore e per la vista: quota/copre/acqua sono funzioni del motore.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27a-avv-dadi.js', '28j-ven-dati.js', '28l-ven-campo.js'];
const C = carica.multi(F, 'VCAM'), D = carica.multi(F, 'VDAT');
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const pari = () => [T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), T(5, { val_f2: 12, val_t2: 6, val_c3: 4 })];
const scheda = (seme, a, b, o) => Object.assign({ seme, a, b, faza: 'tu', fazb: 'fer' }, o || {});
// il comandante avversario ha già scelto le formazioni: non le tocca più (le prove sulle formazioni le fissano a mano)
const fermo = s => { s.ia.b = { f: 1, m: 1, t0: 1 }; };
// gli oggetti del motore vengono da un altro contesto: si confrontano come JSON
const J = x => JSON.stringify(x), uguali = (a, b, m) => assert.strictEqual(J(a), J(b), m);
const grande = k => [{ k, x: 30, y: 50, rx: 90, ry: 90 }];

// ---- 1. senza zone la battaglia dura come prima (stessa taratura di oggi) ----
{
  let d = 0, dc = 0;
  for (let k = 1; k <= 50; k++) {
    const [a, b] = pari();
    d += C.risolvi(scheda(k, a, b, { zone: [] })).durata;
    dc += C.risolvi(scheda(k, a, b, { zone: [], cap })).durata;
  }
  assert(d / 50 > 395 && d / 50 < 590, 'durata media senza capitano: ' + (d / 50));
  assert(dc / 50 > 360 && dc / 50 < 540, 'durata media con il capitano: ' + (dc / 50));
}

// ---- 2. le zone: funzioni pure del motore ----
{
  const s = C.nuovo(scheda(1, T(0, { val_f2: 2 }), T(5, { val_f2: 2 }), { zone: [
    { k: 'altura', x: 30, y: 30, rx: 10, ry: 8, h: .8 }, { k: 'bosco', x: 10, y: 70, rx: 6, ry: 6 },
    { k: 'case', x: 50, y: 70, rx: 5, ry: 4 }, { k: 'acqua', x: 30, y: 50, rx: 45, ry: 3 }] }));
  assert(Math.abs(C.quota(s, 30, 30) - .8) < 1e-9, 'sul centro dell\'altura la quota è h');
  assert(C.quota(s, 30, 40) === 0 && C.quota(s, 5, 5) === 0, 'fuori dall\'altura la quota è zero');
  assert(C.quota(s, 36, 30) < C.quota(s, 33, 30) && C.quota(s, 33, 30) < C.quota(s, 30, 30), 'la quota scende verso il bordo');
  assert(C.quota(s, 30, 50) < 0, 'in acqua la quota è un poco sotto lo zero');
  assert.strictEqual(C.copre(s, 10, 70), 'bosco'); assert.strictEqual(C.copre(s, 50, 70), 'case'); assert.strictEqual(C.copre(s, 30, 30), null);
  assert(C.acqua(s, 30, 52) && !C.acqua(s, 30, 56) && !C.acqua(s, 10, 70));
  // gli stessi numeri anche senza `zone` (stato salvato prima di V5)
  const v = JSON.parse(JSON.stringify(s)); delete v.zone;
  assert.strictEqual(C.quota(v, 30, 30), 0); assert.strictEqual(C.copre(v, 10, 70), null); assert(!C.acqua(v, 30, 50));
}

// ---- 3. le zone di una battaglia: date a mano o estratte dal seme, sempre uguali per tutti i telefoni ----
{
  const zo = (seme, o) => C.nuovo(scheda(seme, T(0, { val_f2: 2 }), T(5, { val_f2: 2 }), o)).zone;
  const date = [{ k: 'bosco', x: 20, y: 40, rx: 6, ry: 6 }]; uguali(zo(3, { zone: date }), date); assert.notStrictEqual(zo(3, { zone: date })[0], date[0], 'copia, non lo stesso oggetto');
  uguali(zo(7), zo(7), 'stesso seme, stesse zone'); assert.strictEqual(JSON.stringify(zo(7)), JSON.stringify(JSON.parse(JSON.stringify(zo(7)))));
  uguali(zo(7, { tipo: 'arena' }), []); uguali(zo(7, { tipo: 'assedio' }), []);
  let alt = 0, bos = 0, gua = 0, n = 0; const N = 400;
  for (let k = 1; k <= N; k++) {
    const Z = zo(k, { terreno: 1 }); n++;
    for (const z of Z) {
      assert(z.x >= 6 && z.x <= 54 && z.y >= 6 && z.y <= 94, 'centro a sei passi dai bordi: ' + JSON.stringify(z));
      if (z.k === 'altura') { assert(z.y >= 36 && z.y <= 64 && z.h >= .6 && z.h <= 1 && z.rx >= 9 && z.rx <= 14 && z.ry >= 7 && z.ry <= 10, 'altura fuori dai limiti'); }
      if (z.k === 'bosco') assert(z.rx >= 5 && z.rx <= 7, 'boschetto della pianura');
    }
    for (let i = 0; i < Z.length; i++) for (let j = i + 1; j < Z.length; j++) assert(Math.hypot(Z[i].x - Z[j].x, Z[i].y - Z[j].y) >= 10, 'due zone troppo vicine');
    if (Z.some(z => z.k === 'altura')) alt++; if (Z.some(z => z.k === 'bosco')) bos++;
    if (Z.some(z => z.k === 'acqua')) { gua++; assert(!Z.some(z => z.k === 'altura'), 'il guado solo senza alture'); }
  }
  assert(alt / n > .5 && alt / n < .7, 'in pianura un\'altura 6 volte su 10: ' + alt / n); assert(bos / n > .3 && bos / n < .5, 'un boschetto 4 volte su 10: ' + bos / n);
  assert(gua / n > .03 && gua / n < .11, 'un guado una volta su sei senza alture: ' + gua / n);
  assert.strictEqual(zo(5, { terreno: 1, bioma: 1 }).filter(z => z.k === 'acqua').length, 0, 'sulla neve nessun guado');
  // colline: due alture; bosco: più boschi; luoghi vicini e costa
  for (let k = 1; k <= 60; k++) { const h = zo(k, { terreno: 3 }); assert(h.length >= 1 && h.length <= 2 && h.every(z => z.k === 'altura')); }
  let boschi = 0; for (let k = 1; k <= 100; k++) { const w = zo(k, { terreno: 2 }); assert(w.filter(z => z.k === 'bosco').length >= 1); boschi += w.filter(z => z.k === 'bosco').length; }
  assert(boschi / 100 > 1.8, 'nel bosco due o tre boschi: ' + boschi / 100);
  assert.strictEqual(zo(2, { terreno: 3, scena: { pend: 1 } }).length > 0, true);
  for (const tipo of ['villaggio', 'porto', 'locanda', 'monastero']) { const c = zo(4, { scena: { vicino: { tipo, faz: 'val' } } }).filter(z => z.k === 'case'); assert.strictEqual(c.length, 1, tipo); assert(c[0].y >= 16 && c[0].y <= 22 && (c[0].x === 12 || c[0].x === 48) && c[0].rx === 7 && c[0].ry === 5); }
  assert.strictEqual(zo(4, { scena: { vicino: { tipo: 'citta', faz: 'val' } } }).filter(z => z.k === 'case').length, 0);
  const e = zo(4, { scena: { costa: 'e' } }).find(z => z.k === 'acqua' && z.rx === 7), o = zo(4, { scena: { costa: 'o' } }).find(z => z.k === 'acqua' && z.rx === 7);
  assert(e && e.x === C.C.W && o && o.x === 0, 'l\'acqua sta sul bordo della costa');
}

// ---- 4. altura: chi la tiene vince di più, in tutti e due i versi ----
{
  const alt = y => [{ k: 'altura', x: 30, y, rx: 14, ry: 9, h: 1 }];
  let a0 = 0, b0 = 0, bAlt = 0, aAlt = 0;
  for (let k = 1; k <= 50; k++) {
    const [a, b] = pari(), base = scheda(k, a, b);
    if (C.risolvi(Object.assign({}, base, { zone: [] })).vince === 'a') a0++; else b0++;
    if (C.risolvi(Object.assign({}, base, { zone: alt(26) })).vince === 'b') bAlt++;
    if (C.risolvi(Object.assign({}, base, { zone: alt(74) })).vince === 'a') aAlt++;
  }
  assert(bAlt + aAlt > 60, 'chi ha l\'altura vince più di 60 su 100: ' + (bAlt + aAlt));
  assert(bAlt > b0, 'l\'altura dalla parte di b aiuta b: ' + bAlt + ' contro ' + b0); assert(aAlt > a0, 'l\'altura dalla parte di a aiuta a: ' + aAlt + ' contro ' + a0);
  // salire rallenta, scendere no
  const tempo = (da, a, zone) => {
    const s = C.nuovo(scheda(3, T(0, { val_f2: 1 }), T(5, { pre_f1: 1 }), { fazb: 'pre', zone })), u = s.u.find(x => x.l === 'a');
    u.x = da; u.y = 50; Object.assign(s.ord.a.f, { t: 'tieni', x: a, y: 50, fm: 'larga' }); let t = 0; while (Math.abs(u.x - a) > .5 && t < 3000) { C.passo(s, 1); t++; } return t;
  };
  const H = alt(50), su = tempo(14, 30, H), giu = tempo(30, 46, H), piano = tempo(14, 30, []);
  assert(su > giu * 1.5, 'un fante sale più lento di quanto scende: ' + su + ' contro ' + giu); assert(Math.abs(giu - piano) <= 2, 'scendere costa come il piano');
}

// ---- 5. copertura: nel bosco si colpisce la metà ----
function tiri(zone, N, tid, fm) {
  const s = C.nuovo(scheda(5, T(0, { val_t2: 8 }), T(5, { [tid || 'val_f2']: 1 }), { zone })); fermo(s);
  const b = s.u.find(u => u.l === 'b'); b.pf = b.pfm = 1e9; s.ord.b.f.fm = fm || 'larga'; for (const g of ['f', 't', 'c']) s.ord.a[g].t = 'carica';
  const arc = s.u.filter(u => u.l === 'a'); let n = 0, hit = 0, dan = 0;
  while (n < N && !s.fine) { arc.forEach((u, i) => { u.x = 30 + (i - 3.5) * .4; u.y = 52; }); b.x = 30; b.y = 40; for (const e of C.passo(s, 1)) { if (e.t === 'tiro') { n++; if (e.colpito) hit++; } if (e.t === 'colpo' && e.freccia) dan += e.dan; } }
  return { n, hit, dan };
}
{
  const aperto = tiri([], 300), bosco = tiri([{ k: 'bosco', x: 30, y: 40, rx: 8, ry: 8 }], 300), case_ = tiri([{ k: 'case', x: 30, y: 40, rx: 8, ry: 8 }], 300);
  assert(aperto.n >= 300 && bosco.n >= 300 && case_.n >= 300, 'tiri contati: ' + [aperto.n, bosco.n, case_.n]);
  assert(bosco.hit / aperto.hit > .4 && bosco.hit / aperto.hit < .6, 'nel bosco colpi a segno tra il 40% e il 60%: ' + bosco.hit + ' su ' + aperto.hit);
  assert(case_.hit / aperto.hit > .4 && case_.hit / aperto.hit < .6, 'tra le case lo stesso: ' + case_.hit + ' su ' + aperto.hit);
}

// ---- 6. acqua bassa, bosco e case: si va piano e non si carica ----
{
  const tempo = zone => {
    const s = C.nuovo(scheda(3, T(0, { val_f2: 1 }), T(5, { pre_f1: 1 }), { fazb: 'pre', zone })), u = s.u.find(x => x.l === 'a');
    u.x = 10; u.y = 50; Object.assign(s.ord.a.f, { t: 'tieni', x: 30, y: 50, fm: 'larga' }); let t = 0; while (u.x < 29.5 && t < 3000) { C.passo(s, 1); t++; } return t;
  };
  const asciutto = tempo([]), inAcqua = tempo([{ k: 'acqua', x: 20, y: 50, rx: 25, ry: 10 }]);
  assert(inAcqua >= asciutto * 1.8, '20 passi in acqua: ' + inAcqua + ' istanti contro ' + asciutto);
  const cariche = (zone, k0) => { let c = 0; for (let k = 1; k <= 10; k++) {
    const s = C.nuovo(scheda(k, T(0, { val_c3: 12 }), T(5, { fer_f2: 21 }), { zone }), { autoA: true }); C.passo(s, 2); s.ord.b.f.fm = 'larga';
    while (!s.fine) for (const e of C.passo(s, 10)) if (e.t === 'colpo' && e.carica) c++; } return c; };
  assert(cariche([]) > 20, 'in campo aperto i cavalieri caricano: ' + cariche([]));
  for (const k of ['bosco', 'case', 'acqua']) assert.strictEqual(cariche(grande(k)), 0, 'nessuna carica da o contro ' + k);
  // i cavalieri nel bosco o tra le case vanno più piano degli altri
  const trotto = zone => { const s = C.nuovo(scheda(3, T(0, { val_c3: 1 }), T(5, { pre_f1: 1 }), { fazb: 'pre', zone })), u = s.u.find(x => x.l === 'a'); u.x = 10; u.y = 50;
    Object.assign(s.ord.a.c, { t: 'tieni', x: 30, y: 50, fm: 'larga' }); let t = 0; while (u.x < 29.5 && t < 3000) { C.passo(s, 1); t++; } return t; };
  assert(trotto(grande('bosco')) > trotto([]) * 1.15, 'il cavallo nel bosco rallenta');
}

// ---- 7. formazioni: il giro, gli errori, la forma che si tiene ----
{
  const mk = () => C.nuovo(scheda(1, T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), T(5, { val_f2: 12 }), { zone: [] }));
  const s = mk(); uguali(C.forme(s, 'a'), { f: 'serrata', t: 'larga', c: 'larga' }, 'fanti serrati, il resto largo');
  const giro = (g, n) => { const q = mk(), v = []; for (let i = 0; i < n; i++) { const r = C.ordina(q, { g, t: 'forma' }); assert(!r.err, r.err); v.push(C.forme(q, 'a')[g]); C.passo(q, 30); } return v; };
  uguali(giro('f', 4), ['cuneo', 'larga', 'serrata', 'cuneo']); uguali(giro('c', 4), ['serrata', 'cuneo', 'larga', 'serrata']);
  uguali(giro('t', 4), ['serrata', 'larga', 'serrata', 'larga'], 'i tiratori saltano il cuneo');
  assert.strictEqual(C.ordina(mk(), { g: 't', t: 'forma', f: 'cuneo' }).err, 'I tiratori non fanno il cuneo');
  assert.strictEqual(C.ordina(mk(), { g: 'f', t: 'forma', f: 'testuggine' }).err, 'Formazione sconosciuta');
  { const q = mk(); assert(!C.ordina(q, { g: 'f', t: 'forma' }).err); assert.strictEqual(C.ordina(q, { g: 'f', t: 'forma' }).err, 'Il gruppo si sta ancora schierando');
    C.passo(q, C.C.FM.ATTESA - 1); assert(C.ordina(q, { g: 'f', t: 'forma' }).err, 'l\'attesa non è finita'); C.passo(q, 1); assert(!C.ordina(q, { g: 'f', t: 'forma' }).err, 'passata l\'attesa si può cambiare'); }
  { const q = mk(), r = C.ordina(q, { g: 'tutti', t: 'forma', f: 'cuneo' }); assert(!r.err); uguali(C.forme(q, 'a'), { f: 'cuneo', t: 'larga', c: 'cuneo' }, 'con tutti il cuneo salta i tiratori');
    assert(!C.ordina(q, { g: 'tutti', t: 'forma' }).err, 'con tutti si cambiano solo i gruppi che hanno finito di schierarsi'); uguali(C.forme(q, 'a'), { f: 'cuneo', t: 'serrata', c: 'cuneo' });
    assert.strictEqual(C.ordina(q, { g: 'tutti', t: 'forma' }).err, 'Il gruppo si sta ancora schierando', 'se nessuno ha finito è un errore'); assert.strictEqual(C.ordina(q, { g: 'x', t: 'forma' }).err, 'Gruppo sconosciuto'); }
  { const q = mk(); C.ordina(q, { g: 'c', t: 'forma' }); const e = q.ev.find(x => x.t === 'ordine' && x.o === 'forma'); assert(e && e.l === 'a' && e.g === 'c' && e.f === 'serrata', 'evento dell\'ordine di forma'); }
  { const q = C.nuovo({ seme: 5, tipo: 'arena', a: [], faza: 'tu', fazb: 'val', capi: [{ nome: 'C', pf: 100, att: 18, dif: 12, dan: 12, vel: 10, rit: 12 }], b: [{ p: -100, t: 'pre_f2', n: 1, st: { nome: 'A', pf: 70, att: 14, dif: 10, dan: 10, rit: 12, git: 0, vel: 10 } }] });
    assert(C.ordina(q, { g: 'f', t: 'forma' }).err, 'in lizza resta l\'errore di oggi'); }
  // distanza media dal vicino più prossimo dopo 150 istanti di «tieni»: serrata < cuneo < larga
  const vicino = fm => { const q = C.nuovo(scheda(2, T(0, { val_f2: 12 }), T(5, { pre_f1: 2 }), { zone: [] })); C.ordina(q, { g: 'f', t: 'forma', f: fm }); C.ordina(q, { g: 'f', t: 'tieni' }); C.passo(q, 150);
    const U = q.u.filter(u => u.l === 'a' && u.c === 'f' && u.st === 'vivo'); let tot = 0; for (const u of U) { let m = 1e9; for (const v of U) if (v !== u) m = Math.min(m, Math.hypot(u.x - v.x, u.y - v.y)); tot += m; } return tot / U.length; };
  const ds = vicino('serrata'), dc = vicino('cuneo'), dl = vicino('larga'); assert(ds < dc && dc < dl, 'serrata ' + ds.toFixed(2) + ' < cuneo ' + dc.toFixed(2) + ' < larga ' + dl.toFixed(2));
  // il cuneo punta al nemico: la riga davanti è un uomo solo e le altre si allargano dietro
  { const q = C.nuovo(scheda(2, T(0, { val_f2: 9 }), T(5, { pre_f1: 1 }), { zone: [] })); C.ordina(q, { g: 'f', t: 'forma', f: 'cuneo' }); C.ordina(q, { g: 'f', t: 'tieni' }); C.passo(q, 150);
    const ys = q.u.filter(u => u.l === "a" && u.c === "f").map(u => u.y); const punta = Math.min(...ys); assert(ys.filter(y => y <= punta + 1).length <= 3, 'in punta pochi uomini'); }
  // i capitani non hanno formazione e in arena non conta
  // (il capitano cammina alla stessa velocità qualunque formazione abbia il suo gruppo)
  { const passi = fm => { const q = C.nuovo(scheda(1, T(0, { val_f2: 4 }), T(5, { val_f2: 4 }), { cap, zone: [] })); fermo(q); const u = C.capU(q), x0 = u.x, y0 = u.y;
      q.ord.a.f.fm = fm; assert(C.capitano(q, { x: 30, y: 60 }).s); C.passo(q, 15); return Math.hypot(u.x - x0, u.y - y0); };
    const ps = passi('serrata'), pl = passi('larga'), pc = passi('cuneo'); assert(ps > 1.5, 'il capitano si muove: ' + ps);
    assert(ps > pl * .95 && pc > pl * .95, 'la formazione non rallenta il capitano (la serrata lo porterebbe all\'80%): ' + ps + ' ' + pl + ' ' + pc); }
}

// ---- 8. tiri e mischia contro le formazioni ----
{
  const r = {}; for (const tid of ['val_f2', 'fer_f2']) { r[tid] = {}; for (const fm of ['serrata', 'larga', 'cuneo']) r[tid][fm] = tiri([], 600, tid, fm); }
  const sc = r.val_f2, nu = r.fer_f2; assert(D.aspetto('val_f2').scudo && !D.aspetto('fer_f2').scudo);
  assert(sc.serrata.hit / sc.larga.hit > .4 && sc.serrata.hit / sc.larga.hit < .7, 'con lo scudo la serrata dimezza i tiri a segno: ' + sc.serrata.hit + ' su ' + sc.larga.hit);
  assert(nu.serrata.hit / nu.larga.hit > 1.02 && nu.serrata.hit / nu.larga.hit < 1.35, 'senza scudo la serrata è più esposta: ' + nu.serrata.hit + ' su ' + nu.larga.hit);
  for (const R of [sc, nu]) { const dl = R.larga.dan / R.larga.hit, dcu = R.cuneo.dan / R.cuneo.hit; assert(dl < dcu * .65, 'la formazione larga dimezza il danno dei tiri: ' + dl.toFixed(2) + ' contro ' + dcu.toFixed(2)); }
  // colpito sul fianco il cuneo si difende peggio
  const fianco = davanti => { const s = C.nuovo(scheda(3, T(0, { val_f3: 1 }), T(5, { val_f3: 1 }), { zone: [] })); fermo(s); s.ord.b.f.fm = 'cuneo';
    const a = s.u.find(u => u.l === 'a'), b = s.u.find(u => u.l === 'b'); b.pf = b.pfm = a.pf = a.pfm = 1e9; let n = 0, dan = 0;
    while (n < 450 && !s.fine) { b.x = 30; b.y = 40; b.fx = 0; b.fy = 1; b.cd = 999; a.x = 30; a.y = davanti ? 41.2 : 38.8; for (const e of C.passo(s, 1)) if (e.t === 'colpo' && e.da === a.id) { n++; dan += e.dan; } } return dan; };
  const df = fianco(true), dd = fianco(false); assert(dd > df * 1.1, 'sul fianco il cuneo prende più danno: ' + dd + ' contro ' + df);
  // la carica: 12 cavalieri contro fanti con la picca di pari valore
  const nf = Math.round(D.valore('val_c3') * 12 / D.valore('fer_f2')), pv = nf * D.valore('fer_f2') / (D.valore('val_c3') * 12); assert(pv > .9 && pv < 1.1, 'forze pari: ' + pv.toFixed(2));
  const vinti = fm => { let w = 0; for (let k = 1; k <= 20; k++) { const s = C.nuovo(scheda(k, T(0, { val_c3: 12 }), T(5, { fer_f2: nf }), { zone: [] }), { autoA: true }); C.passo(s, 2); s.ord.b.f.fm = fm; while (!s.fine) C.passo(s, 50); if (s.fine.vince === 'a') w++; } return w; };
  const wS = vinti('serrata'), wL = vinti('larga'); assert(wS <= 4, 'contro la serrata con la picca i cavalieri vincono al più 4 volte su 20: ' + wS); assert(wL >= wS + 5, 'contro gli stessi fanti larghi vincono 5 volte in più: ' + wL + ' contro ' + wS);
  // la picca spezza la carica e ferisce chi carica
  { const s = C.nuovo(scheda(1, T(0, { val_c3: 12 }), T(5, { fer_f2: nf }), { zone: [] }), { autoA: true }); C.passo(s, 2); s.ord.b.f.fm = 'serrata'; let rimbalzi = 0;
    while (!s.fine) for (const e of C.passo(s, 10)) if (e.t === 'colpo' && e.dan > 0) { const da = s.u.find(u => u.id === e.da); if (da && da.l === 'b' && da.c === 'f' && s.u.find(u => u.id === e.a).c === 'c') rimbalzi++; }
    assert(rimbalzi > 0, 'chi carica la picca serrata si fa male'); }
}

// ---- 9. l'IA usa le stesse regole ----
{
  // un'altura vicina e nella propria metà: i tiratori la prendono e i fanti stanno 5 passi davanti
  const s = C.nuovo(scheda(4, ...pari(), { zone: [{ k: 'altura', x: 30, y: 26, rx: 14, ry: 9, h: 1 }] })); C.passo(s, 25);
  assert(Math.abs(s.ord.b.t.x - 30) < .01 && Math.abs(s.ord.b.t.y - 26) < .01, 'i tiratori di b sul centro dell\'altura'); assert(Math.abs(s.ord.b.f.y - 31) < .01, 'i fanti 5 passi davanti');
  uguali(C.forme(s, 'b'), { f: 'serrata', t: 'larga', c: 'larga' });
  // a una battaglia in corso: al contatto i cavalieri vanno a cuneo
  const c = C.nuovo(scheda(5, ...pari(), { zone: [] }), { autoA: true }); while (!c.fine && C.forme(c, 'b').c !== 'cuneo') C.passo(c, 20); assert.strictEqual(C.forme(c, 'b').c, 'cuneo', 'al contatto i cavalieri a cuneo'); assert.strictEqual(C.forme(c, 'a').c, 'cuneo');
  // fanti in larga contro soli tiratori
  const t = C.nuovo(scheda(5, T(0, { val_t2: 10 }), T(5, { val_f2: 10 }), { zone: [] }), { autoA: true }); while (!t.fine && !t.ia.a.m) C.passo(t, 20);
  while (!t.fine && t.ia.b.m !== 1) C.passo(t, 20); assert(!t.fine && t.ia.b.m === 1, 'b arriva al contatto prima della fine'); // b ha solo fanti: a ha solo tiratori
  assert.strictEqual(C.forme(t, 'b').f, 'larga', 'i fanti si allargano contro soli tiratori');
  // un'ancora in acqua arretra: dopo il primo passo avanti i fanti di b sarebbero nell'acqua, il comandante li riporta indietro, all'asciutto
  const base = C.nuovo(scheda(6, ...pari(), { zone: [] })), yb = base.ord.b.f.y, xb = base.ord.b.f.x;
  const w = C.nuovo(scheda(6, ...pari(), { zone: [{ k: 'acqua', x: xb, y: yb + 3.2, rx: 20, ry: 2 }] })); assert.strictEqual(w.ord.b.f.y, yb, 'stessa partenza');
  C.passo(w, 1); assert(w.ord.b.f.y < yb, 'l\'ancora in acqua arretra: ' + w.ord.b.f.y + ' contro ' + yb); assert(!C.acqua(w, w.ord.b.f.x, w.ord.b.f.y), 'e si ferma all\'asciutto');
  // con due alture generate dal seme (colline) nessuno resta fermo ad aspettare: stesse durate dei campi aperti
  { let d = 0, max = 0; for (let k = 1; k <= 50; k++) { const [a, b] = pari(), r = C.risolvi(scheda(k, a, b, { terreno: 3 })); d += r.durata; max = Math.max(max, r.durata); }
    assert(d / 50 > 395 && d / 50 < 650 && max < 900, 'colline: durata media ' + (d / 50) + ', massima ' + max); }
  // la battaglia sul terreno finisce lo stesso, mai oltre il tempo massimo
  for (let k = 1; k <= 12; k++) { const [a, b] = pari(), q = C.nuovo(scheda(k, a, b, { terreno: k % 3 + 1 }), { autoA: true }); while (!q.fine) C.passo(q, 50); assert(q.t <= C.C.TMAX, 'finisce'); }
}

// ---- 10. uno stato salvato prima di V5 (senza zone né formazioni) va avanti senza errori ----
{
  const s = C.nuovo(scheda(8, ...pari(), { zone: [] })); C.passo(s, 40);
  const v = JSON.parse(JSON.stringify(s)); delete v.zone; for (const l of ['a', 'b']) for (const g of ['f', 't', 'c']) { delete v.ord[l][g].fm; delete v.ord[l][g].fmT; } delete v.ia.a.m; delete v.ia.b.m;
  v.r = null; uguali(C.forme(v, 'a'), { f: 'larga', t: 'larga', c: 'larga' }, 'senza `fm` vale larga');
  C.passo(v, 200); assert(v.t >= 240 || v.fine, 'avanza'); assert(!C.ordina(v, { g: 'f', t: 'forma' }).err, 'si può dare una formazione anche a uno stato vecchio'); assert.strictEqual(C.forme(v, 'a').f, 'serrata', 'da «larga» (senza `fm`) il primo tocco va a serrata');
}
console.log('ven_tattica ok');
