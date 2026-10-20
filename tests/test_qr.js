// Codice QR: struttura (finder, timing, formato) e, se c'è OpenCV, lettura vera di molti testi.
const assert = require('assert'), cp = require('child_process'), path = require('path');
const QR = require('../src/js/motori/26-qr.js');
const q = QR.matrice('https://latavernadeigiochi.netlify.app/?room=ABCD');
assert.strictEqual(q.versione, 4); assert.strictEqual(q.size, 33);
// tre quadrati di orientamento 7x7 e timing
const finder = (x0, y0) => { for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) { const d = Math.max(Math.abs(x - 3), Math.abs(y - 3)); assert.strictEqual(q.mod[y0 + y][x0 + x], d !== 2, `finder ${x0},${y0}`); } };
finder(0, 0); finder(q.size - 7, 0); finder(0, q.size - 7);
for (let i = 8; i < q.size - 8; i++) { assert.strictEqual(q.mod[6][i], i % 2 === 0, 'timing riga'); assert.strictEqual(q.mod[i][6], i % 2 === 0, 'timing colonna'); }
assert.strictEqual(q.mod[q.size - 8][8], true, 'modulo scuro fisso');
// determinismo e limiti
assert.deepStrictEqual(QR.matrice('ciao').mod, QR.matrice('ciao').mod);
assert.throws(() => QR.matrice('x'.repeat(400)), /troppo lungo/);
assert(QR.matrice('x'.repeat(331)).versione <= QR.MAXV);
const svg = QR.svg('ciao', { px: 200 }); assert(/^<svg /.test(svg) && svg.includes('width="200"') && !/[<>]\s*script/.test(svg));
// lettura con un lettore vero
const testi = []; for (let n = 1; n <= 60; n++) testi.push('a1B'.repeat(20).slice(0, n));
for (const n of [80, 100, 130, 160, 200, 250, 300, 331]) testi.push(Array.from({ length: n }, (_, i) => String.fromCharCode(33 + (i * 7) % 90)).join(''));
testi.push('è ✓ città', 'https://latavernadeigiochi.netlify.app/?tv=ABCD', 'https://latavernadeigiochi.netlify.app/?dist=2CFMBZEX');
const casi = testi.map(t => { const m = QR.matrice(t); return { testo: t, size: m.size, versione: m.versione, mod: m.mod.map(r => r.map(v => v ? 1 : 0)) }; });
const r = cp.spawnSync('python3', ['-I', path.join(__dirname, '../tools/test-qr/decodifica.py')], { input: JSON.stringify(casi), encoding: 'utf8' });
if (r.status === 77) console.log('qr: OpenCV non disponibile, lettura saltata');
else { process.stdout.write(r.stdout); assert.strictEqual(r.status, 0, 'il lettore non riesce a leggere alcuni codici:\n' + r.stdout + r.stderr); }
console.log('qr ok');
