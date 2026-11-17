// Scrive un PNG della geografia nuova (terreni, fiumi, laghi, strade, ponti, luoghi) per alcuni semi.
// Uso: node tools/avventura/mappa-png.js [cartella] [semi separati da virgola] [ampio|vasto]
// (senza argomenti: 6 semi, mondo ampio, in ./mappe-geografia). Non usa librerie: il PNG si scrive con zlib.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const carica = require(path.join(__dirname, '../../tests/carica.js'));
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = b => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const pezzo = (tipo, dati) => { const l = Buffer.alloc(4); l.writeUInt32BE(dati.length); const tb = Buffer.concat([Buffer.from(tipo), dati]), c = Buffer.alloc(4); c.writeUInt32BE(crc(tb)); return Buffer.concat([l, tb, c]); };
function png(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pezzo('IHDR', ih), pezzo('IDAT', zlib.deflateSync(raw)), pezzo('IEND', Buffer.alloc(0))]);
}
const COL = [[42, 104, 138], [150, 186, 96], [72, 124, 62], [170, 158, 104], [118, 114, 110]];
const LUOGO = { citta: [230, 40, 40], castello: [60, 40, 120], villaggio: [250, 240, 200], porto: [20, 30, 200], monastero: [230, 120, 220], locanda: [250, 150, 40], rovine: [120, 120, 120], covo: [0, 0, 0] };
function disegna(M, k) {
  const G = M.G, W = G * k, img = Buffer.alloc(W * W * 3), px = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= W) return; const o = (y * W + x) * 3; img[o] = c[0]; img[o + 1] = c[1]; img[o + 2] = c[2]; };
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const i = y * G + x; let c = COL[M.T[i]];
    if (M.T[i] === 0 && M.LG[i] > 0) c = M.laghi[M.LG[i]].grande ? [70, 140, 190] : [110, 170, 200];
    if (M.T[i] === 1 && M.B[i] === 1) c = [226, 232, 236]; else if (M.T[i] === 1 && M.B[i] === 3) c = [196, 182, 108]; else if (M.T[i] === 1 && M.B[i] === 2) c = [180, 190, 100];
    if (M.F[i] > 0 && M.T[i] !== 0) c = [30, 100, 220];
    if (M.S[i] && M.T[i] !== 0) c = M.PN[i] ? [255, 255, 255] : [150, 100, 50];
    if (M.PS[i]) c = [255, 210, 0];
    for (let oy = 0; oy < k; oy++) for (let ox = 0; ox < k; ox++) px(x * k + ox, y * k + oy, c);
  }
  for (const l of M.luoghi) { const c = LUOGO[l.tipo], r = l.tipo === 'citta' ? 3 : 2; for (let oy = -r; oy <= r; oy++) for (let ox = -r; ox <= r; ox++) px(Math.floor(l.x * k) + ox, Math.floor(l.y * k) + oy, c); }
  return png(W, W, img);
}
module.exports = { disegna, png };
if (require.main === module) {
  const dir = path.resolve(process.argv[2] || 'mappe-geografia'), semi = (process.argv[3] || '1,2,3,4,5,6').split(',').map(Number), mondo = process.argv[4] || 'ampio';
  const { VGEO } = carica.multi(F, '({ VGEO })'); fs.mkdirSync(dir, { recursive: true });
  for (const s of semi) { const M = VGEO.genera(s, { mondo }); fs.writeFileSync(path.join(dir, 'geo_' + mondo + '_' + s + '.png'), disegna(M, 3)); console.log('scritto geo_' + mondo + '_' + s + '.png'); }
}
