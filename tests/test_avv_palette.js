// Palette e misure della resa pixel (B1): 8 rampe da 5 toni ordinate, tabella 32³ che porta ogni colore in palette,
// scala intera dello schermo dentro le misure del piano, aggancio della telecamera ai pixel, controlli su blocchi, colori e scorrimento.
const assert = require('assert');
const APAL = require('../src/js/motori/28h-avv-palette.js');
const hex = /^#[0-9a-f]{6}$/;

// ---- la palette: 8 rampe × 5 toni, tutti diversi, dal più scuro al più chiaro, mai nero puro ----
assert.strictEqual(APAL.NOMI.length, 8);
assert.strictEqual(APAL.COLORI.length, 40);
assert.strictEqual(new Set(APAL.COLORI).size, 40, 'colori ripetuti');
for (const n of APAL.NOMI) {
  const r = APAL.RAMPE[n];
  assert.strictEqual(r.length, APAL.TONI, n);
  for (const c of r) assert(hex.test(c), n + ': ' + c);
  for (let i = 1; i < r.length; i++) assert(APAL.oklab(r[i])[0] > APAL.oklab(r[i - 1])[0] + .05, n + ': la rampa non sale abbastanza al tono ' + i);
  assert(APAL.oklab(r[0])[0] > .1, n + ': il tono più scuro non deve essere nero');
}
// colori abbastanza distanti fra loro: così il cubetto della tabella che contiene un colore della palette torna a quel colore
let minimo = Infinity;
for (let i = 0; i < 40; i++) for (let j = i + 1; j < 40; j++) {
  const a = APAL.oklab(APAL.COLORI[i]), b = APAL.oklab(APAL.COLORI[j]);
  minimo = Math.min(minimo, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
}
assert(minimo > .03, 'due colori della palette troppo vicini: ' + minimo.toFixed(3));
for (let i = 0; i < 40; i++) {
  assert.strictEqual(APAL.vicino(...APAL.RGB[i]), i, 'un colore della palette resta sé stesso: ' + APAL.COLORI[i]);
  assert.strictEqual(APAL.scuro(i), APAL.rampa(i) * 5);
}
assert.strictEqual(APAL.COLORI[APAL.vicino(0, 0, 0)], APAL.RAMPE.notte[0], 'il nero va al tono più scuro della notte');
assert.strictEqual(APAL.rampa(APAL.vicino(255, 120, 0)), APAL.NOMI.indexOf('fuoco'), 'l\'arancio vivo va nel fuoco');
assert.strictEqual(APAL.rampa(APAL.vicino(60, 150, 50)), APAL.NOMI.indexOf('erba'), 'il verde va nell\'erba');

// ---- la tabella 32³ per lo shader ----
const t0 = Date.now(), T = APAL.tabella(32), ms = Date.now() - t0;
assert.strictEqual(T.w, 1024); assert.strictEqual(T.h, 32); assert.strictEqual(T.dati.length, 1024 * 32 * 4);
assert(ms < 1500, 'tabella troppo lenta: ' + ms + ' ms');
assert.strictEqual(APAL.fuori(T.dati), 0, 'nella tabella solo colori della palette');
for (let o = 3; o < T.dati.length; o += 4) assert.deepStrictEqual([...T.dati.slice(o - 3, o)], APAL.RGB[T.dati[o]], 'alfa = numero del colore');
const cella = (r, g, b) => { const q = v => Math.floor(v / 8), o = (q(g) * 1024 + q(b) * 32 + q(r)) * 4; return [T.dati[o], T.dati[o + 1], T.dati[o + 2], T.dati[o + 3]]; };
for (let i = 0; i < 40; i++) {
  const [r, g, b] = APAL.RGB[i], c = cella(r, g, b);
  assert.deepStrictEqual(c.slice(0, 3), [r, g, b], 'il cubetto di ' + APAL.COLORI[i] + ' torna a sé');
  assert.strictEqual(c[3], i);
}
assert.deepStrictEqual(APAL.tabella(32).dati, T.dati, 'la tabella è sempre la stessa');
const S = APAL.scuri();
assert.strictEqual(S.length, 32);
APAL.NOMI.forEach((n, i) => assert.deepStrictEqual([...S.slice(i * 4, i * 4 + 3)], APAL.RGB[i * 5], 'scuro di ' + n));
const PL = APAL.paletta();
assert.strictEqual(PL.length, 160);
for (let i = 0; i < 40; i++) assert.deepStrictEqual([...PL.slice(i * 4, i * 4 + 3)], APAL.RGB[i]);
// nomi dei colori, tono più chiaro (filo di luce)
assert.strictEqual(APAL.indice('notte:2'), 37); assert.strictEqual(APAL.indice('pietra:0'), 0);
assert.strictEqual(APAL.indice(APAL.COLORI[12]), 12); assert.strictEqual(APAL.indice('cielo:1'), -1); assert.strictEqual(APAL.indice('#123456'), -1);
assert.strictEqual(APAL.colore('fuoco:4'), APAL.RAMPE.fuoco[4]); assert.strictEqual(APAL.colore('nulla'), null);
for (let i = 0; i < 40; i++) {
  const c = APAL.chiaro(i);
  assert.strictEqual(APAL.rampa(c), APAL.rampa(i), 'il filo di luce resta nella rampa');
  assert(i % 5 === 4 ? c === i : c === i + 1);
  assert(APAL.oklab(APAL.COLORI[c])[0] >= APAL.oklab(APAL.COLORI[i])[0]);
}
// ---- retino di Bayer 4×4: 16 soglie diverse, k/16, periodico di 4 anche con coordinate negative ----
const soglie = new Set();
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
  const v = APAL.bayer(x, y);
  assert(v >= 0 && v < 1 && Math.abs(v * 16 - Math.round(v * 16)) < 1e-9, 'soglia in sedicesimi');
  soglie.add(Math.round(v * 16));
  for (const [dx, dy] of [[4, 0], [0, 4], [-8, 12], [400, -404]]) assert.strictEqual(APAL.bayer(x + dx, y + dy), v, 'periodo 4');
}
assert.strictEqual(soglie.size, 16, 'le 16 soglie del retino');
// mezzo retino = metà dei pixel accesi, sparsi (mai due vicini in orizzontale)
let accesi = 0;
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (APAL.bayer(x, y) < .5) { accesi++; assert(!(APAL.bayer(x + 1, y) < .5), 'retino a scacchiera'); }
assert.strictEqual(accesi, 8);

// ---- misure: scala intera, larghezza in pixel d'arte come nel piano ----
const m = (w, h, dpr, o) => APAL.misure(Object.assign({ w, h, dpr }, o || {}));
assert.deepStrictEqual(m(390, 844, 3), { W: 1170, H: 2532, s: 6, tipo: 'verticale', art: [195, 422] });
assert.deepStrictEqual(m(1920, 1080, 1, { tv: true }).art, [480, 270]);
assert.strictEqual(m(1920, 1080, 1, { tv: true }).s, 4);
assert.deepStrictEqual(m(3840, 2160, 1, { tv: true }), { W: 3840, H: 2160, s: 8, tipo: 'tv', art: [480, 270] });
const o = m(844, 390, 3);
assert(o.tipo === 'orizzontale' && o.art[0] >= 400 && o.art[0] <= 480, 'telefono in orizzontale: ' + o.art);
for (const dpr of [2, 2.625, 2.75, 3, 3.5]) for (const w of [360, 375, 390, 412, 430]) {
  const a = m(w, 800, dpr), v = m(w, 800, dpr, { zoom: 'vicino' });
  assert(Number.isInteger(a.s) && a.s >= 1 && a.art[0] * a.s >= a.W && (a.art[0] - 1) * a.s < a.W, 'copre lo schermo');
  assert(a.art[0] >= 192 && a.art[0] <= 256, `verticale ${w}@${dpr}: ${a.art[0]} pixel d'arte`);
  assert(Number.isInteger(v.s) && v.s > a.s && v.art[0] < a.art[0], `zoom vicino ${w}@${dpr}: scala ${v.s}`);
}
assert.strictEqual(m(320, 568, 1).s, 1, 'mai sotto la scala 1');

// ---- pixel d'arte per unità del mondo e aggancio ----
const k = APAL.k(43);
assert.strictEqual(APAL.k(), APAL.k(APAL.ALT_RIF), 'senza altezza vale l\'eroe di riferimento');
assert(Math.abs(43 * APAL.CAMERA.cos * k - APAL.ALTO_EROE) < 1e-9, 'l\'eroe di riferimento è alto 24 pixel d\'arte');
assert(Math.abs(APAL.CAMERA.cos ** 2 + APAL.CAMERA.sin ** 2 - 1) < 1e-5, '55° coerenti');
assert.deepStrictEqual(APAL.piano(3, 0, 0), [3, 0]);
assert(APAL.piano(0, 10, 0)[1] > 0 && APAL.piano(0, 0, 10)[1] < 0, 'in alto le cose alte e lontane');
for (const v of [0, 10.3, -7.77, 123.456, 1e4 / 3]) for (const kk of [.5, k, 1, 2.3]) {
  const a = APAL.aggancia(v, kk);
  assert(Math.abs(a.v * kk - Math.round(a.v * kk)) < 1e-9, 'agganciato a un pixel intero');
  assert(Math.abs(a.resto) <= .5 + 1e-9, 'resto entro mezzo pixel');
  assert(Math.abs((a.v * kk + a.resto) - v * kk) < 1e-9, 'pixel + resto = posizione vera');
}

// ---- controlli per le schermate ----
function img(W, H, s, ox, oy) { const d = new Uint8Array(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = Math.floor((x - ox) / s) * 7 + Math.floor((y - oy) / s) * 13, c = APAL.RGB[((i % 40) + 40) % 40], o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; } return d; }
const A = img(60, 45, 4, 2, 3);
assert.deepStrictEqual(APAL.blocchi(A, 60, 45, 4, 2, 3), { ok: true, blocchi: 14 * 10, diversi: 0 });
assert(!APAL.blocchi(A, 60, 45, 4, 0, 0).ok, 'un aggancio sbagliato si vede');
assert(!APAL.blocchi(A, 60, 45, 5, 2, 3).ok, 'una scala sbagliata si vede');
const B = A.slice(); B[(20 * 60 + 30) * 4] ^= 1;
assert.strictEqual(APAL.blocchi(B, 60, 45, 4, 2, 3).diversi, 1, 'un pixel stonato rompe il suo blocco');
assert.strictEqual(APAL.fuori(A), 0);
assert.strictEqual(APAL.fuori(B), 1, 'un colore fuori palette si conta');
// scorrimento: la stessa immagine spostata di un numero intero di pixel
const C = img(60, 45, 1, 0, 0), D = img(60, 45, 1, 3, -2);
assert.deepStrictEqual(APAL.confronta(C, D, 60, 45, -3, 2, 0).diversi, 0, 'spostamento intero riconosciuto');
assert(APAL.confronta(C, D, 60, 45, 0, 0, 0).diversi > 0);

console.log('palette: ok (tabella in ' + ms + ' ms, distanza minima ' + minimo.toFixed(3) + ')');
