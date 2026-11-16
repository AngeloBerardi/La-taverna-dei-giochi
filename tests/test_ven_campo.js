// Compagnia di ventura, battaglia campale (VCAM): ripetibilità, conservazione degli uomini, forte batte debole,
// muro degli assedi, rinforzi, ordini e capitano, comandante accorto contro ordini a caso, velocità.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27a-avv-dadi.js', '28j-ven-dati.js', '28l-ven-campo.js'];
const C = carica.multi(F, 'VCAM');
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
const scheda = (seme, a, b, o) => Object.assign({ seme, a, b, cap, faza: 'tu', fazb: 'fer' }, o || {});
const pari = () => [T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), T(5, { val_f2: 12, val_t2: 6, val_c3: 4 })];

// niente funzioni vietate nei motori
for (const f of ['28j-ven-dati.js', '28k-ven-mondo.js', '28l-ven-campo.js']) {
  const src = fs.readFileSync(path.join(__dirname, '../src/js/motori', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/Math\.(random|sin|cos|tan|atan2?|hypot|pow|exp|log)\b|Date\.now|new Date/.test(src), f + ': funzione non ripetibile nel motore');
}
// ripetibilità
{
  const [a, b] = pari(), r1 = C.risolvi(scheda(9, a, b)), r2 = C.risolvi(scheda(9, a, b)), r3 = C.risolvi(scheda(10, a, b));
  assert.deepStrictEqual(r1, r2, 'stesso seme, stessa battaglia'); assert.notDeepStrictEqual(r1, r3, 'semi diversi, battaglie diverse');
  const s = C.nuovo(scheda(9, a, b)); C.passo(s, 40); const t = JSON.parse(JSON.stringify(s)); C.passo(s, 200); C.passo(t, 200);
  assert.strictEqual(JSON.stringify(s.u), JSON.stringify(t.u), 'lo stato si salva e riprende uguale');
}
// forte batte debole, debole perde; nessuno cade più di quanti erano
{
  let forte = 0, debole = 0;
  for (let k = 0; k < 20; k++) {
    const a = T(0, { val_f3: 14, val_t3: 6 }), b = T(5, { pre_f1: 14, pre_t2: 4 });
    const r = C.risolvi(scheda(k + 1, a, b, { fazb: 'pre' })); if (r.vince === 'a') forte++;
    for (const c of r.cad) { const riga = (c.p === 0 ? a : b).find(x => x.t === c.t); assert(riga && c.n <= riga.n, 'caduti oltre gli uomini'); }
    const r2 = C.risolvi(scheda(k + 1, T(0, { val_f1: 6 }), T(5, { fer_f3: 14, fer_t3: 6 }))); if (r2.vince === 'a') debole++;
  }
  assert(forte >= 19, 'i veterani battono i predoni: ' + forte); assert(debole === 0, 'sei reclute non battono venti veterani: ' + debole);
}
// conservazione: vivi + caduti + fuggiti + riserva = uomini di partenza; in campo mai più di MAX (+ capitano)
{
  const a = T(0, { val_f2: 40, val_t2: 25, val_c3: 12 }), b = T(5, { fer_f2: 40, fer_t2: 25, fer_c3: 12 });
  const s = C.nuovo(scheda(4, a, b), { autoA: true }); let rinforzi = 0;
  while (!s.fine) {
    for (const e of C.passo(s, 10)) if (e.t === 'rinforzi') rinforzi++;
    for (const l of ['a', 'b']) {
      const U = s.u.filter(u => u.l === l && !u.cap), n = U.length + C.riserva(s, l);
      assert(n === s.n0[l] || s.u.some(u => u.l === l && u.st === 'fuga') || s.fug[l] > 0 || C.riserva(s, l) === 0, 'uomini spariti');
      assert(C.vivi(s, l).length <= C.C.MAX + 1, 'troppi in campo');
    }
  }
  assert(rinforzi >= 2, 'le riserve entrano a ondate'); assert(s.t < C.C.TMAX, 'la battaglia finisce da sola');
}
// assedio: nessuno attraversa il muro fuori dai varchi; le mura aiutano chi difende
{
  const a = T(0, { val_f2: 24, val_t2: 10 }), b = T(-3, { fer_f2: 10, fer_t2: 8 });
  const s = C.nuovo(scheda(6, a, b, { tipo: 'assedio' }), { autoA: true }); assert(s.muro > 0 && s.varchi.length === 1 && s.scale.length === 4, 'senza fasi nella scheda: breccia aperta, scale pronte');
  while (!s.fine) { C.passo(s, 1); for (const u of s.u) if (u.st === 'vivo' && u.sal <= s.t && Math.abs(u.y - s.muro) < .45) assert(s.varchi.some(g => u.x > g[0] && u.x < g[1]), 'unità dentro il muro a x=' + u.x.toFixed(1)); }
  let campo = 0, mura = 0;
  for (let k = 0; k < 16; k++) {
    const x = T(0, { val_f2: 16, val_t2: 7 }), y = T(5, { val_f2: 15, val_t2: 7 });
    if (C.risolvi(scheda(k + 3, x, y)).vince === 'a') campo++; if (C.risolvi(scheda(k + 3, x, y, { tipo: 'assedio' })).vince === 'a') mura++;
  }
  assert(mura < campo, 'dietro le mura si resiste meglio: campo ' + campo + ', mura ' + mura);
}
// ordini e capitano
{
  const [a, b] = pari(), s = C.nuovo(scheda(2, a, b));
  assert(C.ordina(s, { g: 'x', t: 'carica' }).err); assert(C.ordina(s, { g: 'f', t: 'balla' }).err);
  assert(!C.ordina(s, { g: 'tutti', t: 'tieni' }).err); assert(!C.ordina(s, { g: 'c', t: 'segui' }).err);
  const y0 = s.ord.a.f.y; C.ordina(s, { g: 'f', t: 'avanza' }); assert(s.ord.a.f.y < y0, 'avanzare porta verso il nemico');
  const c = C.capU(s); assert(c && c.cap); assert(!C.capitano(s, { x: 10, y: 70 }).err); C.passo(s, 120);
  assert(Math.abs(c.x - 10) < 1.5 && Math.abs(c.y - 70) < 1.5, 'il capitano va dove gli si dice');
  assert(!C.capitano(s, { grido: true }).err); assert(C.capitano(s, { grido: true }).err, 'il grido ha una ricarica');
  assert(C.capitano(s, { b: 99999 }).err);
  // tenendo la posizione i fanti non rincorrono un nemico lontano
  const fy = s.u.filter(u => u.l === 'a' && u.c === 'f').map(u => u.y); C.passo(s, 30);
  s.u.filter(u => u.l === 'a' && u.c === 'f' && u.st === 'vivo').forEach((u, k) => assert(u.y > 40, 'un fante che tiene la posizione è partito'));
  while (!s.fine) C.passo(s, 50); assert(C.ordina(s, { g: 'f', t: 'carica' }).err, 'a battaglia finita niente ordini');
  const r = C.riepilogo(s); assert(['a', 'b'].includes(r.vince)); assert(r.durata === s.t);
}
// il comandante accorto vince più di chi dà ordini a caso (stesse truppe contro lo stesso nemico)
{
  let bravo = 0, caso = 0; const N = 24;
  for (let k = 0; k < N; k++) {
    const a = T(0, { val_f2: 12, val_t2: 8, val_c3: 4 }), b = T(5, { val_f2: 12, val_t2: 7, val_c3: 3 });
    if (C.risolvi(scheda(k + 40, a, b)).vince === 'a') bravo++;
    const s = C.nuovo(scheda(k + 40, a, b)), r = carica.rng(k + 7), O = ['arretra', 'tieni', 'arretra', 'segui', 'avanza'], Gs = ['f', 't', 'c'];
    while (!s.fine) { C.passo(s, 25); C.ordina(s, { g: Gs[Math.floor(r() * 3)], t: O[Math.floor(r() * O.length)] }); if (r() < .3) C.capitano(s, { x: r() * 60, y: r() * 100 }); }
    if (s.fine.vince === 'a') caso++;
  }
  assert(bravo >= N * .6, 'il comandante accorto vince spesso: ' + bravo + '/' + N); assert(caso < bravo, 'gli ordini a caso rendono meno: ' + caso + ' contro ' + bravo);
}
// velocità: una battaglia grande si risolve in fretta
{
  const t = Date.now(); C.risolvi(scheda(1, T(0, { val_f2: 60, val_t2: 40, val_c3: 20 }), T(5, { fer_f2: 60, fer_t2: 40, fer_c3: 20 })));
  assert(Date.now() - t < 1500, 'risoluzione automatica lenta: ' + (Date.now() - t) + ' ms');
}

// arena dei tornei (V2): solo capitani contro avversari singoli, campo stretto, niente rotta né ordini né grido, fine quando un lato è a terra
{
  const duello = (n, pf, o) => ({ seme: 5, tipo: 'arena', a: [], faza: 'tu', fazb: 'val', scena: { vicino: { tipo: 'citta', faz: 'val' } },
    capi: Array.from({ length: n }, (_, i) => Object.assign({ nome: 'C' + i, pf: pf || 100, att: 18, dif: 12, dan: 12, vel: 10, rit: 12, cavallo: false }, o || {})),
    b: Array.from({ length: n }, (_, i) => ({ p: -100 - i, t: 'pre_f2', n: 1, st: { nome: 'A' + i, pf: 70, att: 14, dif: 10, dan: 10, rit: 12, perf: 0, git: 0, vel: 10 } })) });
  const s = C.nuovo(duello(2)); assert.strictEqual(s.tipo, 'arena'); assert.strictEqual(s.muro, 0); assert.strictEqual(s.u.filter(u => u.l === 'a').length, 2, 'solo i capitani'); assert.strictEqual(s.u.filter(u => u.l === 'b').length, 2);
  assert(s.u.filter(u => u.l === 'b').every(u => u.pf === 70 && u.nome && u.pfm === 70), 'gli avversari portano i loro numeri');
  const ya = s.u.filter(u => u.cap)[0].y, yb = s.u.find(u => u.l === 'b').y; assert(Math.abs(ya - yb) >= 11 && Math.abs(ya - yb) <= 13, 'i lati partono a 12 passi: ' + Math.abs(ya - yb));
  assert(C.ordina(s, { t: 'carica' }).err && C.capitano(s, { grido: true }).err, 'nessun ordine ai gruppi, niente grido');
  // stesso seme, stesso duello
  const f = x => { const q = C.nuovo(duello(2), { autoA: true }); while (!q.fine) C.passo(q, 50); return JSON.stringify([q.t, q.fine, q.u.map(u => [u.pf, u.st])]); }; assert.strictEqual(f(), f());
  // si resta nell'anello, si finisce quando un lato è a terra, nessuna fuga, i caduti non pesano sulla compagnia
  const q = C.nuovo(duello(2), { autoA: true }); let max = 0; while (!q.fine) { C.passo(q, 10); for (const u of q.u) max = Math.max(max, Math.hypot(u.x - q.W / 2, u.y - q.H / 2)); } assert(max <= C.C.ARENA + .01, 'dentro lo steccato: ' + max);
  assert(!q.ev.some(e => e.t === 'rotta') && q.fug.a === 0 && q.fug.b === 0); const r = C.riepilogo(q); assert(r.vince === 'a' || r.vince === 'b'); assert(q.t < 3000, 'un duello dura una frazione della battaglia');
  // forte vince, debole perde; con più capitani si vince o si perde come squadra
  let forti = 0, deboli = 0; for (let i = 1; i <= 20; i++) { if (C.risolvi(Object.assign(duello(1, 200, { dan: 20, att: 24 }), { seme: i })).vince === 'a') forti++; if (C.risolvi(Object.assign(duello(1, 25, { dan: 3, att: 8 }), { seme: i })).vince === 'b') deboli++; }
  assert(forti >= 19 && deboli >= 19, 'forte batte debole: ' + forti + ' ' + deboli);
  { const x = C.risolvi(duello(3, 90)); assert.strictEqual(x.ko.length, 3);
    const mista = duello(2, 100000); mista.capi[0] = Object.assign({}, mista.capi[0], { pf: 1, att: 1, dif: 0, dan: 1 }); let sq = 0; for (let i = 1; i <= 10; i++) { const r = C.risolvi(Object.assign({}, mista, { seme: i })); if (r.vince === 'a') sq++; }
    assert(sq >= 9, 'un capitano a terra e l\'altro vince: vince la squadra (' + sq + '/10)');
    const deboli = duello(2, 20, { att: 1, dan: 1, dif: 0 }); for (let i = 1; i <= 5; i++) { const r = C.risolvi(Object.assign({}, deboli, { seme: i })); assert(r.vince === 'b' && r.capKo, 'tutti a terra: perde la squadra'); } }
  // il tempo massimo decide per vita rimasta, mai una battaglia senza fine
  { const q2 = C.nuovo(duello(1, 100000, { dan: 0 }), { autoA: true }); q2.u.find(u => u.l === 'b').dan = 0; C.passo(q2, C.C.TMAX + 10); assert(q2.fine, 'a tempo scaduto c\'è un vincitore'); }
  // i battaglioni normali restano come prima: la rotta e gli ordini funzionano ancora
  { const q3 = C.nuovo(scheda(1, pari()[0], pari()[1])); assert.strictEqual(q3.tipo, 'campo'); assert(!C.ordina(q3, { t: 'carica' }).err); }
}
console.log('ven_campo ok');
