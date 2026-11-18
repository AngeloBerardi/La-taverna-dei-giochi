// Passo 16: morale per reparto, fatica, frecce e comandante nemico nel motore della battaglia.
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const X = carica.multi(F, '({ VCAM, VDAT })'), C = X.VCAM, D = X.VDAT;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const scheda = o => Object.assign({ seme: 7, a: T(0, { val_f2: 20, val_t2: 8, val_c3: 6 }), b: T(5, { fer_f2: 20, fer_t2: 8, fer_c3: 6 }), cap, faza: 'tu', fazb: 'fer', reparti: true, max: 80, W: 100, H: 140 }, o || {});
const nuovo = o => C.nuovo(scheda(o), { autoA: true });
const gioca = (s, n) => { const ev = []; for (let i = 0; i < n && !s.fine; i++) for (const e of C.passo(s, 1)) ev.push(Object.assign({ t0: s.t }, e)); return ev };
const nfine = s => { while (!s.fine) C.passo(s, 50); return C.riepilogo(s) };

// senza reparti nulla cambia: niente campi nuovi nelle unità e nello stato
{
  const s = C.nuovo(scheda({ reparti: false, capoB: true, fatica0: { a: 50 }, morIni: { a: 9 } }), { autoA: true });
  gioca(s, 300);
  assert(s.u.every(u => u.fa === undefined && u.fr === undefined && !u.capo));
  assert(s.mr === undefined && s.rf === undefined && s.capoB === undefined);
  assert.strictEqual(C.riepilogo(s).capoKo, undefined);
  assert(!s.ev.concat(gioca(s, 100)).some(e => ['rotta-r', 'raduno', 'stendardo', 'carro'].includes(e.t)));
}

// le frecce: archi 20, balestre 14; i fanti e i capitani non le contano
{
  const s = nuovo();
  assert(s.u.filter(u => u.c === 't').every(u => u.fr === 20 || u.fr === 14));
  assert(s.u.filter(u => u.c !== 't').every(u => u.fr === undefined));
  assert(s.u.filter(u => u.cap).every(u => u.fr === undefined && u.fa === undefined));
  assert(s.u.filter(u => !u.cap).every(u => u.fa === 0));
}

// morale: parte da quello del lato (con lo scarto morIni), cala coi caduti, cresce con chi si abbatte
{
  const s = nuovo({ morIni: { a: -5, b: 5 } });
  gioca(s, 1);
  assert.strictEqual(s.mr.a[0], 50); assert.strictEqual(s.mr.b[0], 60);
  const m = C.morali(s, 'a'); assert.strictEqual(m.map(x => x.r).join(), '0,1,2'); assert.strictEqual(m[0].mor, 50);
  // un caduto toglie 60 / max(6, uomini) al suo reparto
  const f = s.u.find(u => u.l === 'a' && u.r === 0 && !u.cap), n = s.u.filter(u => u.l === 'a' && u.r === 0 && !u.cap).length;
  const prima = s.mr.a[0];
  const nem = s.u.find(u => u.l === 'b' && u.r === 0), m0 = s.mr.b[0];
  // ferire a morte passa da un colpo del motore: lo si fa con una mischia ravvicinata
  f.x = 50; f.y = 70; nem.x = 50; nem.y = 70.5; f.pf = 1; nem.att = 99; nem.cd = 0; nem.b = f.id;
  for (let i = 0; i < 60 && f.st === 'vivo'; i++) C.passo(s, 1);
  assert.strictEqual(f.st, 'ko'); { assert(s.mr.a[0] <= prima - 60 / Math.max(6, n) + 0.001, 'perde 60/uomini'); assert(s.mr.b[0] >= m0, 'chi abbatte guadagna'); }
}

// 6 tiratori presi alle spalle da 10 cavalieri vanno in rotta prima dei fanti dello stesso lato (10 semi su 10)
{
  let prima = 0;
  for (let seme = 1; seme <= 10; seme++) {
    const s = C.nuovo({ seme, a: T(0, { sel_f2: 20, sel_t2: 6 }), b: T(5, { fer_c3: 10 }), faza: 'tu', fazb: 'fer', reparti: true, max: 80, W: 100, H: 140, morale: 55 }, { autoA: true });
    for (const u of s.u) { if (u.l === 'a') { u.y = u.c === 't' ? 100 : 80; u.x = 40 + (u.id % 12) * 1.6 } else { u.y = 108; u.x = 40 + (u.id % 12) * 1.6 } }
    for (const l of ['a', 'b']) for (const g of ['f', 't', 'c']) { s.ord[l][g].x = 50; s.ord[l][g].y = l === 'a' ? (g === 't' ? 100 : 80) : 108 }
    s.ord.b.c.t = 'carica';
    const ev = gioca(s, 900), rt = ev.find(e => e.t === 'rotta-r' && e.l === 'a' && e.r === 1), rf = ev.find(e => e.t === 'rotta-r' && e.l === 'a' && e.r === 0);
    assert(rt, 'seme ' + seme + ': i tiratori vanno in rotta');
    if (!rf || rt.t0 < rf.t0) prima++;
  }
  assert.strictEqual(prima, 10, 'tiratori prima dei fanti: ' + prima + '/10');
}

// il Grido riporta un reparto in fuga a 30 se torna almeno metà dei suoi fuggitivi
{
  const s = nuovo();
  gioca(s, 1);
  s.mr.a[1] = 10; gioca(s, 1);
  const L = s.u.filter(u => u.l === 'a' && u.r === 1 && !u.cap);
  assert(L.length > 0 && L.every(u => u.st === 'fuga'), 'il reparto è in fuga');
  const c = C.capU(s, 0); c.x = L[0].x; c.y = L[0].y;
  const r = C.capitano(s, { seat: 0, grido: true }); assert(!r.err, r.err);
  assert(s.ev.some(e => e.t === 'raduno' && e.r === 1), 'evento raduno');
  assert.strictEqual(s.mr.a[1], 30); assert(L.filter(u => u.st === 'vivo').length * 2 >= L.length);
  gioca(s, 50); assert(L.some(u => u.st === 'vivo'), 'non fugge di nuovo');
}

// la fatica: un'ondata fresca travolge chi è già stanco (fatica 80 contro 0, in almeno 32 semi su 40)
{
  let vinte = 0;
  for (let seme = 1; seme <= 40; seme++) {
    const s = C.nuovo({ seme, a: T(0, { val_f2: 30 }), b: T(5, { val_f2: 30 }), faza: 'tu', fazb: 'fer', reparti: true, max: 80, W: 100, H: 140, fatica0: { a: 80 } }, { autoA: true });
    if (nfine(s).vince === 'b') vinte++;
  }
  assert(vinte >= 32, 'stanchi battuti: ' + vinte + '/40');
}
{
  // la fatica iniziale, e il moltiplicatore dei modificatori (caldo)
  assert(D.FA.M2 < D.FA.M1 && D.FA.M1 < 1);
  const s2 = nuovo({ fatica0: { a: 30 } }); assert(s2.u.filter(q => q.l === 'a' && !q.cap).every(q => q.fa === 30) && s2.u.filter(q => q.l === 'b' && !q.cap).every(q => q.fa === 0));
  const s3 = nuovo({ mod: { a: { f: { fa: 2 } } } }); assert.strictEqual(s3.u.find(q => q.l === 'a' && q.c === 'f' && !q.cap).mfa, 2);
  // chi corre si stanca, chi sta fermo recupera
  const s = nuovo(); gioca(s, 1);
  const f = s.u.find(q => q.l === 'a' && q.c === 'f' && !q.cap); gioca(s, 100);
  assert(s.u.some(q => q.l === 'a' && !q.cap && q.fa > 0), 'marciando ci si stanca');
  const g = s.u.find(q => q.l === 'a' && !q.cap && q.st === 'vivo'); g.fa = 50; g.vel = 0; g.lt = -999; const prima = g.fa; gioca(s, 5);
  assert(g.fa < prima, 'da fermo recupera: ' + g.fa);
  assert(f.fa >= 0);
}

// un arciere tira al massimo 20 volte, poi va al carro e torna con le frecce piene
{
  const s = C.nuovo({ seme: 3, a: T(0, { sel_t2: 3 }), b: T(5, { fer_f1: 6 }), faza: 'tu', fazb: 'fer', reparti: true, max: 80, W: 100, H: 140 }, { autoA: true });
  for (const u of s.u) if (u.l === 'b') { u.vel = 0; u.pf = u.pfm = 1e6; u.x = 50 + (u.id % 3); u.y = 40 + (u.id % 2) }
  const A = s.u.filter(u => u.l === 'a'), id = A[0].id;
  for (const u of A) { u.x = 50 + (u.id % 3); u.y = 60 }
  for (const g of ['f', 't', 'c']) { s.ord.a[g].x = 50; s.ord.a[g].y = 60; s.ord.a[g].t = 'tieni' }
  const ev = gioca(s, 2500), mio = e => e.da === id;
  const tiri = ev.filter(e => e.t === 'tiro' && mio(e)), c = ev.find(e => e.t === 'carro' && e.r === 1);
  assert(c, 'va al carro e torna');
  const prima = tiri.filter(e => e.t0 <= c.t0);
  assert.strictEqual(prima.length, 20, 'esattamente 20 tiri prima del carro: ' + prima.length);
  assert(tiri.length > 20, 'dopo il carro tira ancora: ' + tiri.length);
  assert(c.t0 - prima[prima.length - 1].t0 >= D.FA.CARRO, 'al carro almeno ' + D.FA.CARRO + ' istanti');
}

// caduta del comandante: -25 a tutti i reparti del suo lato nello stesso istante; il comandante nemico sta dietro i fanti
{
  const s = nuovo({ capoB: true });
  assert(s.capoB > 0); const k = s.u.find(u => u.id === s.capoB);
  assert(k.cap && k.capo && k.l === 'b' && k.pf === D.SIG_CAMPO.pf);
  gioca(s, 35);
  const fanti = s.u.filter(u => u.l === 'b' && u.c === 'f' && !u.cap);
  assert(k.y <= Math.max(...fanti.map(u => u.y)) + 1, 'dietro i fanti, non davanti');
  const prima = Object.assign({}, s.mr.b), mor = s.mor.b;
  k.x = 50; k.y = 70; k.pf = 1;
  const a = s.u.find(u => u.l === 'a' && !u.cap); a.x = 50; a.y = 70.5; a.att = 99; a.dan = 99; a.cd = 0; k.b = a.id; a.b = k.id;
  let ev = [];
  for (let i = 0; i < 80 && k.st !== 'ko'; i++) ev = ev.concat(C.passo(s, 1));
  assert.strictEqual(k.st, 'ko'); assert(ev.some(e => e.t === 'stendardo' && e.l === 'b'));
  assert(s.mor.b <= mor - 18 + 0.01, 'il morale del lato cala di 18');
  for (const r of Object.keys(prima)) assert(s.mr.b[r] <= Math.max(0, prima[r] - 25) + 0.001, 'reparto ' + r + ': ' + prima[r] + ' -> ' + s.mr.b[r]);
  assert.strictEqual(nfine(s).capoKo, true);
}

// determinismo: due telefoni che simulano lo stesso seme arrivano alla stessa battaglia
{
  const a = nuovo({ capoB: true, fatica0: { a: 40 }, morIni: { b: -5 } }), b = nuovo({ capoB: true, fatica0: { a: 40 }, morIni: { b: -5 } });
  nfine(a); nfine(b);
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
  const m = C.morali(a, 'a'); assert(m.every(x => Number.isInteger(x.mor) && Number.isInteger(x.fa)));
}
console.log('ok test_ven_p16');
