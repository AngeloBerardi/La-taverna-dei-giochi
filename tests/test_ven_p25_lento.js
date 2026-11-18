// Passo 25, prove lunghe: la scala dei ranghi 3 e 4, le singole manovre (prendi, riserva, rotazione, esca, caccia, ritirata), le grandi battaglie, il costo.
// Il «giocatore di prova» (tools/avventura/giocatore-prova.js) fa la parte del lato a dove serve un avversario con abitudini fisse.
const assert = require('assert');
const carica = require('./carica.js');
const prova = require('../tools/avventura/giocatore-prova.js');
const X = carica.multi(carica.VEN_FILES, '({ VCAM, VCONS, VDAT })'), C = X.VCAM, K = X.VCONS, D = X.VDAT;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const mix = (pre, p, k) => T(p, { [pre + '_f2']: Math.round(24 * (k || 1)), [pre + '_t2']: Math.round(10 * (k || 1)), [pre + '_c3']: Math.round(8 * (k || 1)) });
const J = x => JSON.stringify(x);
const pc = x => Math.round(x * 100) + '%';

// ---------- la scala: truppe pari, senza capitani, a metà dei semi il rango alto sta dal lato a, a metà dal b ----------
const scala = (alto, basso, extra, n, kAlto) => {
  let v = 0; n = n || 40;
  for (let seme = 1; seme <= n; seme++) {
    const hiA = seme % 2 === 0, rango = hiA ? { a: alto, b: basso } : { a: basso, b: alto };
    const s = Object.assign({ seme, a: mix('val', 0, hiA ? kAlto : 1), b: mix('val', 5, hiA ? 1 : kAlto), faza: 'tu', fazb: 'fer', rango }, extra || {});
    const r = C.risolvi(s); if ((r.vince === 'a') === hiA) v++;
  }
  return v / n;
};
const dentro = (p, nome, min) => { assert(p >= (min || 0.58) && p <= 0.75, nome + ': ' + pc(p)); console.log(nome, pc(p)) };
{
console.log('--- la scala (percentuale di vittorie del rango più alto) ---');
// con le alture (e i reparti) i ranghi 3 e 4 hanno il loro terreno: leggono la zona, si schierano guardando il nemico
dentro(scala(3, 2, { terreno: 3, reparti: true }), 'con alture, rango 3 contro 2');
dentro(scala(4, 3, { terreno: 3, reparti: true }), 'con alture, rango 4 contro 3');
// in campo aperto i vantaggi sono piccoli (restano la rapidità e la sicurezza del giudizio): non si perde, ma non si dominano
for (const [a, b] of [[3, 2], [4, 3]]) { const p = scala(a, b, { zone: [], reparti: true }); assert(p >= 0.5 && p <= 0.75, 'campo aperto, rango ' + a + ' contro ' + b + ': ' + pc(p)); console.log('campo aperto, rango', a, 'contro', b, pc(p)) }
{ const p = scala(4, 1, { zone: [], reparti: true }, 40, 0.75); assert(p >= 0.55, 'rango 4 contro 1 con il 25% di truppe in meno: ' + pc(p)); console.log('campo aperto, rango 4 (-25% truppe) contro 1', pc(p)) }
assert(scala(4, 2, { zone: [], reparti: true }) >= 0.58, 'il rango 4 batte il rango 2');
}

// ---------- prendi: con un'altura nella metà b, i tiratori ci salgono entro l'istante 300 ----------
{
  let su = 0; const N = 30;
  for (let seme = 1; seme <= N; seme++) {
    const s = C.nuovo({ seme, a: T(0, { val_f2: 14, val_t2: 4 }), b: T(5, { fer_f2: 16, fer_t2: 8 }), faza: 'tu', fazb: 'fer', rango: { a: 1, b: 3 }, zone: [{ k: 'altura', x: 30, y: 24, rx: 11, ry: 8, h: 1 }] }, { autoA: true });
    // lo schieramento li ha già messi sull'altura: li rimetto dietro i fanti, come se non l'avesse vista
    s.ord.b.t.x = 30; s.ord.b.t.y = 13; C.int.rimetti(s, 'b', 't');
    const z = s.zone[0], sopra = () => { const L = s.u.filter(u => u.l === 'b' && u.c === 't' && u.st === 'vivo'); return L.filter(u => { const a = (u.x - z.x) / z.rx, b = (u.y - z.y) / z.ry; return a * a + b * b < 1 }).length / Math.max(1, L.length) };
    assert(sopra() < 0.2, 'partono fuori dall\'altura');
    let ok = false; while (s.t < 300 && !s.fine) { C.passo(s, 1); if (sopra() >= 0.5) { ok = true; break } }
    if (ok) su++;
  }
  assert(su / N >= 0.8, 'tiratori sull\'altura entro 300: ' + pc(su / N)); console.log('prendi: sull\'altura entro 300 istanti in', pc(su / N));
}

// ---------- riserva: il rango 3 non manda la sua ondata a comando prima dell'ultima ondata di chi gioca ----------
{
  let ok = 0, parte = 0; const N = 30;
  for (let seme = 1; seme <= N; seme++) {
    // chi gioca (lato a) tiene fermi fanti e tiratori e fa entrare la sua unica ondata all'istante 300: il morale dei suoi reparti non crolla prima
    const s = C.nuovo({ seme, a: T(0, { val_f2: 50, val_t2: 20 }), b: T(5, { fer_f2: 50, fer_t2: 20, fer_c3: 10 }), faza: 'tu', fazb: 'fer', reparti: true, ondate: true, max: 60, W: 100, H: 140, rango: { a: 0, b: 3 } });
    const r = C.preparaOndata(s, { l: 'a', id: 'u', tr: [{ t: 'val_f2', n: 6 }, { t: 'val_t2', n: 4 }], ing: 'retro', quando: { k: 'tempo', v: 300 }, ord: 'carica' }); assert(!r.err, r.err);
    assert.strictEqual(C.pronto(s, 'a').s, s);   // chi gioca è pronto: l'IA di b si schiera guardando lui
    assert.strictEqual(s.ond.b.length, 2); assert.strictEqual(s.ond.b[1].id, 'riserva'); assert.strictEqual(s.ond.b[1].quando.k, 'comando');
    let tu = -1, tia = -1;
    while (!s.fine && s.t < 1500) { for (const e of C.passo(s, 1)) if (e.t === 'ondata') { if (e.l === 'a') tu = s.t; else if (e.id === 'riserva' && tia < 0) tia = s.t } }
    if (tia >= 0) { parte++; if (tia >= tu) ok++ } else ok++;
  }
  assert(parte >= N * 0.5, 'la riserva entra davvero: ' + parte + '/' + N);
  assert(ok / N >= 0.7, 'riserva non prima delle tue: ' + pc(ok / N)); console.log('riserva: non prima delle ondate di chi gioca in', pc(ok / N), '(entra in', parte, 'semi su', N + ')');
}

// ---------- rotazione: due reparti di fanti, quello stanco arretra e quello fresco prende il suo posto ----------
{
  let arretra = 0, subentra = 0; const N = 12;
  for (let seme = 1; seme <= N; seme++) {
    const s = C.nuovo({ seme, a: T(0, { val_f2: 20 }), b: T(5, { fer_f2: 34, fer_t2: 6 }), faza: 'tu', fazb: 'fer', reparti: true, max: 60, rango: { a: 0, b: 3 }, zone: [] }, { autoA: true });
    assert(s.ord.b[3] && s.ord.b[3].c === 'f', 'i fanti sono in due reparti');
    // il reparto 0 (davanti) è stanco, il 3 riposato e dietro
    s.ord.b.f.y = 24; s.ord.b[3].y = 12; C.int.rimetti(s, 'b', 'f'); C.int.rimetti(s, 'b', 3);
    for (const u of s.u) if (u.l === 'b' && u.c === 'f') u.fa = u.r === 0 ? 90 : 5;
    const y0 = s.ord.b.f.y, yd = s.ord.b[3].y; let piano = false, minY = y0;
    for (let i = 0; i < 80 && !s.fine; i++) { for (const e of C.passo(s, 1)) if (e.t === 'piano' && e.l === 'b' && e.m === 'rotazione') piano = true; minY = Math.min(minY, s.ord.b.f.y) }
    if (piano && y0 - minY >= 9) arretra++;
    if (s.ord.b[3].y > yd + 5) subentra++;   // il fresco avanza fino al posto del primo
  }
  assert(arretra >= N * 0.9, 'lo stanco arretra: ' + arretra + '/' + N); assert(subentra >= N * 0.9, 'il fresco prende il posto: ' + subentra + '/' + N);
  console.log('rotazione: lo stanco arretra in', arretra + '/' + N + ', il fresco prende il posto in', subentra + '/' + N);
}

// ---------- esca: il giocatore di prova carica con la cavalleria il primo reparto che vede; il reparto nascosto lo prende di fianco ----------
{
  let colpiti = 0, scatta = 0; const N = 30;
  for (let seme = 1; seme <= N; seme++) {
    const s = C.nuovo({ seme, a: T(0, { val_f2: 30, val_t2: 6, val_c3: 8 }), b: T(5, { fer_f2: 34, fer_t2: 6, fer_c3: 8 }), faza: 'tu', fazb: 'fer', reparti: true, rango: { a: 0, b: 4 }, zone: [], max: 60, W: 80, H: 120 });
    C.pronto(s, 'a');
    const idc = new Set(s.u.filter(u => u.l === 'a' && u.c === 'c').map(u => u.id)), idb = new Set(s.u.filter(u => u.l === 'b' && u.c === 'c').map(u => u.id));
    let t1 = -1, colpo = false, segno = false;
    prova.gioca(C, s, st => {
      const p = st.cons && st.cons.b && st.cons.b.pl;
      if (t1 < 0 && p && p.m === 'esca' && p.fase === 1) { t1 = p.t1; scatta++ }
      for (const e of st.ev) { if (e.t === 'piano' && e.m === 'esca') segno = true; if (t1 >= 0 && st.t <= t1 + 150 && e.t === 'colpo' && e.dan > 0 && idb.has(e.da) && idc.has(e.a)) colpo = true }
      return st.t < 1200;
    });
    assert(!segno, 'il segno dell\'esca non si emette');
    if (colpo) colpiti++;
  }
  assert(colpiti / N >= 0.6, 'esca: il nascosto colpisce la cavalleria entro 150 istanti: ' + pc(colpiti / N) + ' (scatta in ' + scatta + ')');
  console.log('esca: scatta in', scatta + '/' + N, 'semi; il nascosto colpisce la cavalleria in', pc(colpiti / N));
}

// ---------- caccia: capitano isolato a 15 dai suoi, i cavalieri lo raggiungono entro 90 istanti (e non più di 120 di fila) ----------
{
  let presi = 0; const N = 20, cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
  for (let seme = 1; seme <= N; seme++) {
    const s = C.nuovo({ seme, a: T(0, { val_f2: 16, val_t2: 6 }), b: T(5, { fer_f2: 16, fer_t2: 6, fer_c3: 8 }), cap, faza: 'tu', fazb: 'fer', rango: { a: 0, b: 4 }, zone: [] });
    const capU = C.capU(s); capU.x = capU.px = capU.vx = 30; capU.y = capU.py = capU.vy = 65;   // 15 passi davanti ai fanti (a y=80)
    for (const u of s.u) if (u.l === 'b' && u.c === 'c') { u.y = u.py = 38 + (u.x - 30) * 0; u.x = u.px = 30 + (u.id % 5 - 2) }
    s.ord.b.c.x = 30; s.ord.b.c.y = 38;
    let min = 1e9, consec = 0, maxConsec = 0;
    while (s.t < 90 && !s.fine) { C.passo(s, 1); for (const u of s.u) if (u.l === 'b' && u.c === 'c' && u.st === 'vivo') min = Math.min(min, Math.hypot(u.x - capU.x, u.y - capU.y)); const cc = s.cons.b.cc; if (cc) maxConsec = Math.max(maxConsec, s.t - cc.t0) }
    if (min <= 3.5) presi++;
    assert(maxConsec <= 140, 'la caccia non supera il tetto: ' + maxConsec);
  }
  assert(presi / N >= 0.9, 'caccia: cavalieri sul capitano entro 90 istanti: ' + presi + '/' + N); console.log('caccia: capitano raggiunto entro 90 istanti in', presi + '/' + N);
}

// ---------- ritirata: chi ripiega in ordine perde meno uomini di chi aspetta la rotta, a parità di scenario ----------
{
  const gioca = (seme, attiva) => {
    const R0 = D.CONS.RIT_R; D.CONS.RIT_R = attiva ? R0 : 0;
    try {
      const s = C.nuovo({ seme, a: T(0, { val_f2: 36, val_t2: 14, val_c3: 10 }), b: T(5, { fer_f2: 18, fer_t2: 7, fer_c3: 5 }), faza: 'tu', fazb: 'fer', rango: { a: 2, b: 4 }, zone: [] }, { autoA: true });
      while (!s.fine) C.passo(s, 50);
      return { s, r: C.riepilogo(s), ko: s.u.filter(u => u.l === 'b' && u.st === 'ko' && !u.cap).length };
    } finally { D.CONS.RIT_R = R0 }
  };
  let ord = 0, meno = 0, tot = 0, kOrd = 0, kRot = 0; const N = 24;
  for (let seme = 1; seme <= N; seme++) {
    const x = gioca(seme, true); if (!x.s.ordinata) continue;
    const y = gioca(seme, false); ord++; kOrd += x.ko; kRot += y.ko;
    assert.strictEqual(x.s.ordinata, 'b'); assert.strictEqual(x.r.ordinata, true); assert.strictEqual(x.r.vince, 'a'); assert(!y.r.ordinata);
    tot++; if (x.ko <= y.ko) meno++;
  }
  assert(ord >= 8, 'la ritirata scatta in almeno 8 semi su ' + N + ': ' + ord);
  assert(kOrd < kRot && meno / tot >= 0.75, 'perdite in ritirata ' + kOrd + ' contro ' + kRot + ' in rotta (non peggiori in ' + meno + '/' + tot + ')');
  console.log('ritirata: scatta in', ord + '/' + N, 'semi; morti in ritirata', kOrd, 'contro', kRot, 'in rotta normale');
  // il prode non ripiega quasi mai (×0,3), il prudente prima
  const conta = ind => { let n = 0; for (let seme = 1; seme <= 12; seme++) { const s = C.nuovo({ seme, a: T(0, { val_f2: 36, val_t2: 14, val_c3: 10 }), b: T(5, { fer_f2: 18, fer_t2: 7, fer_c3: 5 }), faza: 'tu', fazb: 'fer', rango: { a: 2, b: 4 }, indole: { b: ind }, zone: [] }, { autoA: true }); while (!s.fine) C.passo(s, 50); if (s.ordinata) n++ } return n };
  const prode = conta('prode'), prudente = conta('prudente'); assert(prode <= prudente, 'prode ' + prode + ' prudente ' + prudente); console.log('ritirata: prode', prode, 'prudente', prudente, 'su 12');
}

// ---------- grandi battaglie con i ranghi alti: finiscono, nessun uomo si perde ----------
{
  let v = 0;
  for (let seme = 1; seme <= 8; seme++) {
    const hiA = seme % 2 === 0, rango = hiA ? { a: 4, b: 3 } : { a: 3, b: 4 };
    const s = C.nuovo({ seme, a: T(0, { val_f2: 70, val_t2: 30, val_c3: 20 }), b: T(5, { fer_f2: 70, fer_t2: 30, fer_c3: 20 }), faza: 'tu', fazb: 'fer', reparti: true, ondate: true, max: 80, W: 100, H: 140, rango }, { autoA: true });
    const tutti = () => s.u.length + s.ris.a.concat(s.ris.b).reduce((a, x) => a + x.n, 0) + s.ond.a.concat(s.ond.b).reduce((a, w) => a + w.tr.reduce((c, x) => c + x.n, 0), 0);
    assert.strictEqual(tutti(), 240); assert.strictEqual(s.ond.a.length, 2); assert.strictEqual(s.ond.b.length, 2);
    for (const l of ['a', 'b']) { const r = rango[l]; assert.strictEqual(s.ond[l][0].ing, r >= 4 ? s.ond[l][0].ing : 'retro'); assert.strictEqual(J(s.ond[l][0].quando), J(r >= 4 ? { k: 'tempo', v: 300 } : { k: 'linea', v: 60 })); assert.strictEqual(s.ond[l][1].quando.k, 'comando') }
    while (!s.fine) C.passo(s, 50); assert(s.t < 7000, 'la battaglia finisce');
    assert.strictEqual(tutti(), 240, 'nessun uomo si perde');   // chi cade resta in `s.u` (ko), chi fugge pure
    if ((s.fine.vince === 'a') === hiA) v++;
  }
  console.log('grandi battaglie (4 contro 3, 8 semi): il rango 4 vince', v);
  assert(v >= 3, 'il rango 4 non perde sempre: ' + v);
}

// ---------- costo: il consiglio dei ranghi alti pesa meno del 15% del costo del passo ----------
{
  const riga = (p, n, pre) => [{ p, t: pre + '_f2', n: Math.round(n * .6) }, { p, t: pre + '_t2', n: Math.round(n * .25) }, { p, t: pre + '_c3', n: n - Math.round(n * .6) - Math.round(n * .25) }];
  let migliore = 1e9, conta = 0;
  for (let rip = 0; rip < 5; rip++) {
    const orig = K.decidi; let tc = 0; K.decidi = (s, l) => { const t0 = process.hrtime.bigint(); orig(s, l); tc += Number(process.hrtime.bigint() - t0) };
    const s = C.nuovo({ seme: 7, a: riga(0, 300, 'val'), b: riga(5, 300, 'fer'), faza: 'tu', fazb: 'fer', max: 110, W: 100, H: 140, reparti: true, ondate: true, rango: { a: 4, b: 4 } }, { autoA: true });
    const t0 = process.hrtime.bigint(); for (let i = 0; i < 600 && !s.fine; i++) C.passo(s, 1); const tot = Number(process.hrtime.bigint() - t0) || 1;
    K.decidi = orig; migliore = Math.min(migliore, tc / tot); conta = s.t;
  }
  console.log('costo del consiglio (rango 4): ' + (migliore * 100).toFixed(1) + '% del passo su ' + conta + ' istanti');
  assert(migliore < 0.15, 'il consiglio costa troppo: ' + migliore);
}
console.log('test_ven_p25_lento ok');
