// Partite a distanza: codici, identità, serializzazione di stati con array annidati, meta (a chi tocca), elenco.
const assert = require('assert');
const DIST = require('../src/js/motori/25-distanza.js');
const rng = require('./carica.js').rng(3);

// codici
const cs = new Set(); for (let i = 0; i < 500; i++) { const c = DIST.codice(rng); assert(DIST.codiceOk(c), c); cs.add(c); }
assert(cs.size > 490, 'codici troppo ripetuti');
assert(!DIST.codiceOk('ABC') && !DIST.codiceOk('abcdefgh') && !DIST.codiceOk('ABCDEFG0') && !DIST.codiceOk(null) && !DIST.codiceOk('ABCDEFGHI'));
assert(![...cs].join('').match(/[ILO01]/), 'caratteri ambigui nei codici');
// identità
assert.strictEqual(DIST.devDa('abc'), 'u:abc'); assert.strictEqual(DIST.uidDa('u:abc'), 'abc');
assert.strictEqual(DIST.uidDa('d1234'), null); assert.strictEqual(DIST.uidDa('u:'), null); assert.strictEqual(DIST.uidDa(null), null);
// serializzazione: array annidati (mani, plance) e tutto il resto sopravvivono
const stato = { phase: 'play', s: { hands: [[1, 2], [3]], board: [[0, 1], [1, 0]], txt: 'è così ✓', n: null }, seats: [{ dev: 'u:a', k: 'm', name: 'Ada' }] };
assert.deepStrictEqual(DIST.de({ j: DIST.ser(stato) }), stato);
assert.strictEqual(DIST.de(null), undefined); assert.strictEqual(DIST.de({}), undefined);
assert.throws(() => DIST.ser({ x: 'a'.repeat(DIST.MAX_JSON) }), e => e.code === 'troppo-grande');

// meta: a chi tocca
const seats = [{ dev: 'u:a', k: 'm', name: 'Ada' }, { dev: 'u:b', k: 'm', name: 'Bruno' }, { dev: 'u:c', k: 'm', name: 'Carla' }];
const play = (s) => ({ host: 'u:a', phase: 'play', game: 'uno', seats, s });
assert.deepStrictEqual(DIST.meta(play({ cur: 1 })).turno, ['b']);
assert.deepStrictEqual(DIST.meta(play({ cur: 2, sim: false })).turno, ['c']);
assert.deepStrictEqual(DIST.meta(play({ sim: true, cur: 0 })).turno, ['a', 'b', 'c'], 'giochi simultanei: tocca a tutti');
const fin = DIST.meta(play({ cur: 1, over: { win: 1 } })); assert.deepStrictEqual(fin.turno, []); assert(fin.finita);
assert.deepStrictEqual(DIST.meta({ host: 'u:a', phase: 'lobby', seats: [], s: null }).turno, []);
assert.deepStrictEqual(DIST.meta(play({ cur: 7 })).turno, [], 'posto inesistente');
const ospite = DIST.meta({ host: 'u:a', phase: 'play', game: 'uno', seats: [{ dev: 'u:a', k: 'm', name: 'Ada' }, { dev: 'u:a', k: 'g1', name: 'Ospite' }], s: { cur: 1 } });
assert.deepStrictEqual(ospite.nomi, { a: 'Ada' }, 'gli ospiti non sono giocatori');
// uids: unione con quelli già salvati, sempre ordinati, mai persi, tetto
const m1 = DIST.meta(play({ cur: 0 }), { uids: ['z', 'a'], host: 'u:a' }, 'q');
assert.deepStrictEqual(m1.uids, ['a', 'b', 'c', 'q', 'z']);
assert.strictEqual(DIST.meta(play({ cur: 0 }), { uids: ['x'], host: 'zzz' }).host, 'zzz', 'chi ha creato resta lo stesso');
assert.strictEqual(DIST.meta({ host: 'u:a', phase: 'lobby' }, null, 'a').host, 'a');
assert(DIST.meta(play({ cur: 0 }), { uids: Array.from({ length: 20 }, (_, i) => 'k' + String(i).padStart(2, '0')) }).uids.length <= DIST.MAX_GIOCATORI);
assert.strictEqual(DIST.meta({ phase: 'lobby' }, null, 'a').nomi && Object.keys(DIST.meta({ phase: 'lobby' }, null, 'a').nomi).length, 0);

// riepilogo e ordine
const nome = id => ({ uno: 'Uno', perudo: 'Perudo' }[id] || id);
const r1 = DIST.riassunto('AAAAAAAA', DIST.meta(play({ cur: 1 })), 'b', nome);
assert(r1.tocca && r1.fase === 'in corso' && r1.gioco === 'Uno' && r1.n === 3 && !r1.mia && r1.giocatori.length === 3);
const r2 = DIST.riassunto('BBBBBBBB', DIST.meta({ host: 'u:b', phase: 'lobby' }), 'b', nome);
assert(!r2.tocca && r2.fase === 'in attesa' && r2.gioco === null && r2.mia);
const r3 = DIST.riassunto('CCCCCCCC', DIST.meta(play({ cur: 0, over: { win: 0 } })), 'b', nome);
assert.strictEqual(r3.fase, 'finita');
const r4 = DIST.riassunto('DDDDDDDD', DIST.meta(play({ cur: 0 })), 'b', nome);
assert.deepStrictEqual(DIST.ordina([r3, r2, r4, r1]).map(r => r.code), ['AAAAAAAA', 'DDDDDDDD', 'BBBBBBBB', 'CCCCCCCC']);
console.log('distanza ok');

// firestore.rules: i campi ammessi nel documento sono esattamente quelli che scriviamo
const fs = require('fs'), path = require('path');
const rules = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
const dichiarati = (rules.match(/function campi\(d\) \{ return d\.keys\(\)\.hasOnly\(\[([^\]]*)\]\)/) || [])[1];
assert(dichiarati, 'regola `campi` non trovata');
const inRegole = dichiarati.split(',').map(s => s.trim().replace(/'/g, '')).sort();
const scritti = [...Object.keys(DIST.meta({ phase: 'lobby' })), 'j', 'rev', 'upd'].sort();
assert.deepStrictEqual(inRegole, scritti, 'campi delle partite diversi tra regole e codice');
assert(rules.includes('size() <= ' + DIST.MAX_GIOCATORI) && rules.includes('size() < ' + DIST.MAX_JSON), 'limiti nelle regole');
console.log('distanza regole ok');
