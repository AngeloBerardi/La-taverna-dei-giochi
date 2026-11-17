// Passo 11: reparti, settori e ondate nel motore della battaglia (schieramento prima del «Via», ondate, primo a schierarsi, pali, colonna).
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const X = carica.multi(F, '({ VCAM, VST })'), C = X.VCAM, S = X.VST;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const scheda = o => Object.assign({ seme: 7, a: T(0, { val_f2: 20, val_t2: 8, val_c3: 6 }), b: T(5, { fer_f2: 20, fer_t2: 8, fer_c3: 6 }), cap, faza: 'tu', fazb: 'fer', reparti: true, ondate: true, max: 80, W: 100, H: 140 }, o || {});
const nuovo = o => C.nuovo(scheda(o), { autoA: true });
const di = (s, l, r) => s.u.filter(u => u.l === l && !u.cap && u.r === r).length;
const ids = (s, id) => C.settori(s, 'a').map(z => z.id).includes(id);

// reparti: senza i campi nuovi tre reparti 0/1/2 = f/t/c, e le mosse nuove sono rifiutate
{
  const s = C.nuovo(scheda({ reparti: false, ondate: false }), { autoA: true });
  assert.deepStrictEqual(C.reparti(s, 'a').map(x => x.r + x.c).join(), '0f,1t,2c');
  assert.strictEqual(C.dividi(s, { l: 'a', r: 0 }).err, 'I reparti non sono permessi');
  assert.strictEqual(C.preparaOndata(s, { l: 'a', id: 1, tr: T(0, { val_f2: 2 }), ing: 'fsx' }).err, 'Le ondate non sono permesse');
  assert.strictEqual(JSON.stringify(Object.keys(s.ord.a)), JSON.stringify(['f', 't', 'c']));
}

// dividere 20 fanti dà 10 + 10; il nuovo reparto è accanto e dello stesso tipo
{
  const s = nuovo(), x0 = s.ord.a.f.x;
  assert.strictEqual(di(s, 'a', 0), 20);
  const r = C.dividi(s, { l: 'a', r: 0 }); assert(!r.err, r.err);
  assert.strictEqual(di(s, 'a', 0), 10); assert.strictEqual(di(s, 'a', 3), 10);
  assert.strictEqual(s.ord.a[3].c, 'f'); assert(s.ord.a[3].x > s.ord.a.f.x && s.ord.a.f.x < x0, 'uno a destra e uno a sinistra');
  assert.strictEqual(C.reparti(s, 'a').length, 4);
  // un ordine per tipo vale per tutti i reparti di quel tipo, uno per numero solo per quel reparto
  C.ordina(s, { l: 'a', g: 'f', t: 'carica' }); assert.strictEqual(s.ord.a.f.t, 'carica'); assert.strictEqual(s.ord.a[3].t, 'carica');
  C.ordina(s, { l: 'a', r: 3, t: 'tieni', x: 40, y: 100 }); assert.strictEqual(s.ord.a[3].t, 'tieni'); assert.strictEqual(s.ord.a.f.t, 'carica'); assert.strictEqual(s.ord.a[3].x, 40);
  assert.strictEqual(C.ordina(s, { l: 'a', r: 6, t: 'tieni' }).err, 'Reparto sconosciuto');
  // la formazione di un reparto solo, subito prima del «Via»
  assert(!C.ordina(s, { l: 'a', r: 3, t: 'forma', f: 'cuneo' }).err); assert.strictEqual(s.ord.a[3].fm, 'cuneo'); assert.strictEqual(s.ord.a.f.fm, 'serrata'); assert.strictEqual(s.ord.a[3].fmT, 0);
  // unisci: di nuovo uno solo
  assert.strictEqual(C.unisci(s, { l: 'a', r: 0, r2: 2 }).err, 'Reparti di tipo diverso');
  assert(!C.unisci(s, { l: 'a', r: 0, r2: 3 }).err); assert.strictEqual(di(s, 'a', 0), 20); assert(!s.ord.a[3]);
  // troppo piccolo: 6 cavalieri non si dividono
  assert.strictEqual(C.dividi(s, { l: 'a', r: 2 }).err, 'Reparto troppo piccolo');
}

// 7 reparti: errore (al massimo 6 in campo)
{
  const s = nuovo();
  for (const r of [0, 3, 1]) assert(!C.dividi(s, { l: 'a', r }).err);
  assert.strictEqual(C.reparti(s, 'a').length, 6);
  assert.strictEqual(C.dividi(s, { l: 'a', r: 0 }).err, 'Troppi reparti');
}

// schierare: solo dentro un settore valido, solo prima del «Via»
{
  const s = nuovo(), H = s.H;
  assert.strictEqual(C.schiera(s, { l: 'a', r: 0, x: 50, y: 10 }).err, 'Lì non puoi schierarti');
  assert.strictEqual(C.schiera(s, { l: 'a', r: 0, x: 2, y: H / 2 }).err, 'Lì non puoi schierarti', 'gli ingressi non sono settori');
  assert(!C.schiera(s, { l: 'a', r: 0, x: 20, y: H - 10 }).err);
  assert.strictEqual(s.ord.a.f.x, 20);
  const u = s.u.find(q => q.l === 'a' && q.r === 0); assert(Math.abs(u.x - 20) < 14 && u.y < H, 'il reparto è rimesso in fila attorno al nuovo posto');
  C.passo(s, 1);
  assert.strictEqual(C.schiera(s, { l: 'a', r: 0, x: 20, y: H - 10 }).err, 'La battaglia è già cominciata');
  assert.strictEqual(C.dividi(s, { l: 'a', r: 0 }).err, 'La battaglia è già cominciata');
}

// settori: `avan` solo con l'esplorazione migliore; con 3 o più la fascia è più profonda
{
  assert(!ids(nuovo(), 'avan'));
  const s = nuovo({ esplora: { a: 2, b: 0 } }); assert(ids(s, 'avan')); assert(!C.settori(s, 'b').some(z => z.id === 'avan'));
  assert(!ids(nuovo({ esplora: { a: 2, b: 2 } }), 'avan'));
  const t = nuovo({ esplora: { a: 3, b: 1 } }), cx = C.settori(t, 'a').find(z => z.id === 'cx'); assert.strictEqual(cx.y0, t.H - 36);
  assert.strictEqual(C.settori(nuovo(), 'a').find(z => z.id === 'cx').y0, 140 - 30);
  assert.strictEqual(JSON.stringify(['fsx', 'fdx', 'retro'].filter(i => ids(nuovo(), i))), JSON.stringify(['fsx', 'fdx', 'retro']));
  // altura nella propria metà, bosco nel terzo centrale solo con l'imboscata
  const z = [{ k: 'altura', x: 20, y: 100, rx: 10, ry: 8, h: 1 }, { k: 'altura', x: 20, y: 30, rx: 10, ry: 8, h: 1 }, { k: 'bosco', x: 50, y: 100, rx: 8, ry: 6 }];
  const q = nuovo({ zone: z }); assert(ids(q, 'alt')); assert(!ids(q, 'alt2')); assert(!ids(q, 'imb'));
  const m = nuovo({ zone: z, imboscata: 'a' }); assert(ids(m, 'imb')); assert(!C.settori(m, 'b').some(x => x.id === 'imb'));
  // assedio: il difensore ha mura e cortile, l'attaccante solo il centro e l'ingresso dal retro
  const as = C.nuovo(scheda({ tipo: 'assedio', W: undefined, H: undefined, max: undefined }), { autoA: true });
  assert.strictEqual(JSON.stringify(C.settori(as, 'b').map(x => x.id)), JSON.stringify(['mura', 'cortile', 'retro']));
  assert.strictEqual(JSON.stringify(C.settori(as, 'a').map(x => x.id)), JSON.stringify(['cx', 'retro']));
  assert.strictEqual(JSON.stringify(C.settori(C.nuovo(scheda({ tipo: 'arena' })), 'a')), JSON.stringify([]));
}

// chi si schiera per primo: l'esplorazione minore (a parità, il lato a)
{
  assert.strictEqual(nuovo({ esplora: { a: 1, b: 2 } }).primo, 'a'); assert.strictEqual(nuovo({ esplora: { a: 2, b: 1 } }).primo, 'b');
  assert.strictEqual(nuovo({ esplora: { a: 1, b: 1 } }).primo, 'a'); assert.strictEqual(nuovo().primo, undefined);
  const s = nuovo({ esplora: { a: 1, b: 2 } }); assert(!C.pronto(s, 'a').err); assert.strictEqual(s.pronto.a, true); assert.strictEqual(s.pronto.b, false);
  C.passo(s, 1); assert.strictEqual(C.pronto(s, 'b').err, 'La battaglia è già cominciata');
}

// ondate: a linea, entrano dal bordo sinistro nel primo istante in cui la linea scende sotto il 50% e non prima
{
  const sc = { a: T(0, { val_f2: 24, val_t2: 6 }), b: T(5, { fer_f2: 60, fer_t2: 20, fer_c3: 12 }), max: 60, W: 100, H: 140 };
  const s = nuovo(sc), orig = C.vivi(s, 'a').filter(u => !u.cap).length;
  assert.strictEqual(C.preparaOndata(s, { l: 'a', id: 'o1', tr: [{ t: 'val_f2', n: 8 }], ing: 'fsx', quando: { k: 'linea', v: 50 }, ord: 'carica' }).s, s);
  const dopo = C.vivi(s, 'a').filter(u => !u.cap).length; assert.strictEqual(dopo, orig - 8, 'le truppe dell\'ondata escono dal campo');
  assert.strictEqual(C.reparti(s, 'a').reduce((a, x) => a + x.n, 0), dopo);
  const id0 = s.uid, w = s.ond.a[0]; let t0 = 0, rapp = 0;
  for (let i = 0; i < 6000 && !s.fine && !t0; i++) {
    C.passo(s, 1);
    if (w.fatta) { t0 = s.t; rapp = s.u.filter(u => u.l === 'a' && !u.cap && u.id < id0 && u.st === 'vivo').length * 100 / dopo }
    else assert(s.u.filter(u => u.l === 'a' && !u.cap && u.id < id0 && u.st === 'vivo').length * 100 >= 50 * dopo, 'non prima del tempo');
  }
  assert(t0 > 0, 'l\'ondata è partita'); assert(rapp < 50, 'e la linea era sotto il 50%: ' + rapp);
  const entrati = s.u.filter(u => u.l === 'a' && u.r > 2 && u.id >= id0);
  assert(entrati.length > 0 && entrati.length <= 10, 'entrano a gruppi'); entrati.forEach(u => assert(u.x < 12, 'dal bordo sinistro'));
  assert(C.passo(s, 1) && s.ond.a[0].tr.reduce((a, x) => a + x.n, 0) < 8);
}
// …e un'ondata al comando non entra mai da sola; le sue truppe non finiscono tra i rinforzi automatici
{
  const sc = { a: T(0, { val_f2: 40, val_t2: 10, val_c3: 10 }), b: T(5, { fer_f1: 20 }), max: 30, W: 100, H: 140 };
  const s = nuovo(sc), n0 = s.n0.a; assert(C.riserva(s, 'a') > 0);
  assert(!C.preparaOndata(s, { l: 'a', id: 'c1', tr: [{ t: 'val_f2', n: 6 }], ing: 'retro', quando: { k: 'comando' }, ord: 'tieni' }).err);
  let rinf = 0; while (!s.fine && s.t < 3000) for (const e of C.passo(s, 20)) if (e.t === 'rinforzi' && e.l === 'a') rinf += e.n;
  assert.strictEqual(s.ond.a[0].fatta, false); assert.strictEqual(s.ond.a[0].tr[0].n, 6);
  assert(s.u.filter(u => u.l === 'a' && !u.cap).length <= n0 - 6, 'mai più degli uomini senza l\'ondata');
  assert.strictEqual(s.u.filter(u => u.l === 'a' && u.r > 2).length, 0);
  // al comando parte; due volte no
  const s2 = nuovo(Object.assign({}, sc, { max: 70 })); C.preparaOndata(s2, { l: 'a', id: 'c1', tr: [{ t: 'val_f2', n: 6 }], ing: 'retro', quando: { k: 'comando' }, ord: 'tieni' });
  assert(!C.ondata(s2, { l: 'a', id: 'c1' }).err); const ev = C.passo(s2, 3);
  assert(s2.u.some(u => u.l === 'a' && u.r > 2 && u.y > s2.H - 6), 'dal retro'); assert.strictEqual(s2.ord.a[3].t, 'tieni');
  assert.strictEqual(C.ondata(s2, { l: 'a', id: 'c1' }).err, 'Ondata già partita'); assert.strictEqual(C.ondata(s2, { l: 'a', id: 'zz' }).err, 'Ondata sconosciuta');
  assert.strictEqual(C.preparaOndata(s2, { l: 'a', id: 'c1', tr: [{ t: 'val_f2', n: 1 }], ing: 'retro' }).err, 'La battaglia è già cominciata');
}
// ondate: tempo, limiti ed errori
{
  const s = nuovo();
  assert.strictEqual(C.preparaOndata(s, { l: 'a', id: 1, tr: [{ t: 'val_f2', n: 99 }], ing: 'fdx' }).err, 'Non ci sono più truppe da assegnare');
  assert.strictEqual(C.preparaOndata(s, { l: 'a', id: 1, tr: [{ t: 'val_f2', n: 2 }], ing: 'sopra' }).err, 'Da lì non si entra');
  assert(!C.preparaOndata(s, { l: 'a', id: 1, tr: [{ t: 'val_f2', n: 2 }], ing: 'fdx', quando: { k: 'tempo', v: 30 } }).err);
  assert(!C.preparaOndata(s, { l: 'a', id: 2, tr: [{ t: 'val_t2', n: 2 }], ing: 'fsx', quando: { k: 'tempo', v: 40 } }).err);
  assert.strictEqual(C.preparaOndata(s, { l: 'a', id: 3, tr: [{ t: 'val_t2', n: 1 }], ing: 'fsx' }).err, 'Troppe ondate');
  // rifare la stessa ondata restituisce le truppe
  assert(!C.preparaOndata(s, { l: 'a', id: 1, tr: [{ t: 'val_f2', n: 3 }], ing: 'fdx', quando: { k: 'tempo', v: 30 } }).err);
  let primo = 0; for (let i = 0; i < 40; i++) for (const e of C.passo(s, 1)) if (e.t === 'ondata' && e.id === 1 && !primo) primo = s.t;
  assert.strictEqual(primo, 30, 'all\'istante 30');
  assert(s.u.some(u => u.l === 'a' && u.r > 2 && u.x > 80), 'dal bordo destro');
  // il campo non si riempie oltre il tetto
  assert(C.vivi(s, 'a').length <= s.max);
}

// pali: i cavalli rallentano, e nessuna carica parte da dentro
{
  const corsa = zone => { const s = C.nuovo(scheda({ zone, b: T(5, { fer_f1: 4 }) }), { autoA: true }); C.ordina(s, { l: 'a', g: 'c', t: 'carica' });
    const u = s.u.find(q => q.l === 'a' && q.c === 'c' && !q.cap), y0 = u.y; C.passo(s, 40); return { d: Math.abs(u.y - y0), u, s } };
  const lib = corsa([]), pal = corsa([{ k: 'pali', x: 50, y: 110, rx: 80, ry: 60 }]);
  assert(lib.d > 5 && pal.d < lib.d * .5, 'cavalli a ×0,4: ' + lib.d + ' contro ' + pal.d);
}

// colonna presa di sorpresa: il lato in colonna sta fermo per 120 istanti (poi si muove), l'altro no
{
  const s = nuovo({ imboscata: 'a', colonna: true, zone: [{ k: 'bosco', x: 50, y: 100, rx: 8, ry: 6 }] });
  assert.strictEqual(s.ord.b.f.fm, 'larga'); assert(s.fermo.b === 120 && !s.fermo.a);
  const pos = l => s.u.filter(u => u.l === l).map(u => u.x.toFixed(2) + ',' + u.y.toFixed(2)).join(';'), b0 = pos('b'), a0 = pos('a');
  C.passo(s, 100); assert.strictEqual(pos('b'), b0, 'fermi'); assert.notStrictEqual(pos('a'), a0, 'l\'altro lato si muove');
  C.passo(s, 500); assert.notStrictEqual(pos('b'), b0, 'poi si muovono');
}

// stesso seme, stesso esito con schieramento e ondate
{
  const gioca = () => { const s = nuovo({ esplora: { a: 2, b: 1 } });
    C.dividi(s, { l: 'a', r: 0 }); C.schiera(s, { l: 'a', r: 3, x: 70, y: 120 }); C.ordina(s, { l: 'a', r: 3, t: 'forma', f: 'cuneo' });
    C.preparaOndata(s, { l: 'a', id: 'x', tr: [{ t: 'val_t2', n: 3 }], ing: 'fsx', quando: { k: 'linea', v: 90 }, ord: 'carica' }); C.preparaOndata(s, { l: 'a', id: 'y', tr: [{ t: 'val_f2', n: 3 }], ing: 'retro', quando: { k: 'tempo', v: 50 }, ord: 'carica' });
    C.pronto(s, 'a'); while (!s.fine && s.t < 2500) C.passo(s, 25); return JSON.stringify(s) };
  assert.strictEqual(gioca(), gioca());
}

// compagnia: schiera e ondata dal secondo telefono danno lo stesso stato su entrambi
{
  const G = S.nuova(2, ['Anna', 'Bruno']); G.b = { c: C.nuovo(scheda()), via: false, pausa: false };
  const mosse = [{ t: 'b-dividi', seat: 1, o: { r: 0 } }, { t: 'b-schiera', seat: 1, o: { r: 3, x: 70, y: 120 } },
    { t: 'b-prepara', seat: 1, o: { id: 'o', tr: [{ t: 'val_f2', n: 4 }], ing: 'fdx', quando: { k: 'comando' }, ord: 'carica' } }, { t: 'b-pronto', seat: 1 }, { t: 'b-via', seat: 1 }, { t: 'b-ondata', seat: 1, o: { id: 'o' } }, { t: 'tempo', seat: 0, fino: 5 }];
  let tel1 = G, tel2 = JSON.parse(JSON.stringify(G));
  for (const m of mosse) { const r1 = S.act(tel1, m), r2 = S.act(tel2, m); assert(!r1.err, m.t + ': ' + r1.err); assert.strictEqual(JSON.stringify(r1.s), JSON.stringify(r2.s)); tel1 = r1.s; tel2 = r2.s }
  assert.strictEqual(tel1.b.c.ond.a[0].fatta, true); assert(tel1.b.c.u.some(u => u.r === 3 && u.l === 'a' && u.x > 60));
  assert.strictEqual(S.act(tel1, { t: 'b-schiera', seat: 1, o: { r: 0, x: 20, y: 120 } }).err, 'La battaglia è già cominciata');
}

// simulazione: bot a caso e bot accorto su tutte le modalità (campo, assedio, arena): la battaglia finisce e gli uomini si conservano
{
  const modi = [{}, { tipo: 'assedio', W: undefined, H: undefined, max: 34 }, { tipo: 'arena', W: undefined, H: undefined, max: 34, reparti: false, ondate: false }];
  let battaglie = 0;
  for (const modo of modi) for (const bravo of [true, false]) for (let seme = 1; seme <= 4; seme++) {
    const rnd = carica.rng(seme * 7 + (bravo ? 1 : 2)), sc = scheda(Object.assign({ seme, esplora: { a: seme % 3, b: 1 } }, modo));
    const s = C.nuovo(sc, { autoA: true }), tipi = ['val_f2', 'val_t2', 'val_c3'];
    for (let k = 0; k < 6; k++) { // mosse di schieramento: l'accorto divide e schiera dove si può, il distratto tira a indovinare
      const r = Math.floor(rnd() * 3), q = rnd();
      if (q < .35) C.dividi(s, { l: 'a', r: bravo ? r : Math.floor(rnd() * 8) });
      else if (q < .6) C.schiera(s, { l: 'a', r, x: rnd() * s.W, y: bravo ? s.H - 5 - rnd() * 20 : rnd() * s.H });
      else if (q < .8) C.preparaOndata(s, { l: 'a', id: k, tr: [{ t: tipi[Math.floor(rnd() * 3)], n: 1 + Math.floor(rnd() * 4) }], ing: ['retro', 'fsx', 'fdx'][Math.floor(rnd() * 3)], quando: { k: ['comando', 'linea', 'tempo'][Math.floor(rnd() * 3)], v: bravo ? 60 : 10 + Math.floor(rnd() * 80) }, ord: 'carica' });
      else C.unisci(s, { l: 'a', r, r2: Math.floor(rnd() * 8) });
    }
    const rotta = { a: false, b: false }; let giri = 0;
    while (!s.fine && giri++ < 400) for (const e of C.passo(s, 50)) if (e.t === 'rotta') rotta[e.l] = true;
    assert(s.fine, 'la battaglia finisce (' + (modo.tipo || 'campo') + ' ' + seme + ')'); battaglie++;
    for (const l of ['a', 'b']) {
      const creati = s.u.filter(u => u.l === l && !u.cap).length, resto = C.riserva(s, l) + (s.ond ? s.ond[l].reduce((a, w) => a + w.tr.reduce((x, y) => x + y.n, 0), 0) : 0);
      if (rotta[l]) assert(creati <= s.n0[l], 'non ne nascono dal nulla'); else assert.strictEqual(creati + resto, s.n0[l], 'gli uomini si conservano (' + l + ')');
      assert(C.vivi(s, l).length <= (s.max || C.C.MAX) + s.capi.length, 'mai oltre il tetto');
    }
    for (const l of ['a', 'b']) assert(C.reparti(s, l).length <= 8);
  }
  assert.strictEqual(battaglie, 24);
}
console.log('p11 ok');
