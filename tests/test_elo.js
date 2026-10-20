// ELO: vincitori per ogni forma di fine partita, somma quasi zero, limiti, squadre, convergenza.
const assert = require('assert');
const ELO = require('../src/js/motori/23-elo.js');
const V = (g, n, over) => ELO.vincitori({ g, n, over });

// cooperativi, pareggi e partite non finite: nessuna classifica
assert.strictEqual(V('regicide', 3, { win: true }), null);
assert.strictEqual(V('scoundrel', 1, { win: false }), null);
assert.strictEqual(V('island', 2, { win: true, winners: [0] }), null, 'booleano = cooperativo anche con winners');
assert.strictEqual(V('azul', 2, { win: null, winners: [] }), null, 'pareggio senza vincitori');
assert.strictEqual(ELO.vincitori({ g: 'uno', n: 3 }), null, 'partita in corso');
assert.strictEqual(ELO.vincitori(null), null);
// forme dei motori veri
assert.deepStrictEqual(V('uno', 4, { win: 2 }), [2]);
assert.deepStrictEqual(V('uno', 4, { win: 0 }), [0], 'a 4 giocatori un posto non diventa una squadra');
assert.deepStrictEqual(V('azul', 3, { win: null, winners: [0, 2] }), [0, 2], 'vittoria a pari merito');
assert.deepStrictEqual(V('trono', 3, { win: 1, wins: [1] }), [1]);
assert.deepStrictEqual(V('pets', 3, { win: 0, wins: [0, 1] }), [0, 1]);
assert.deepStrictEqual(V('briscola', 4, { win: 1 }), [1, 3], 'briscola a 4: squadra 1 = posti 1 e 3');
assert.deepStrictEqual(V('briscola', 3, { win: 2 }), [2], 'briscola a 3: individuale');
assert.deepStrictEqual(V('burraco', 4, { win: 0 }), [0, 2]);
assert.deepStrictEqual(V('burraco', 2, { win: 1 }), [1]);
assert.strictEqual(V('harvest', 3, { win: null, tie: [0, 1] }), null, 'pareggio harvest');

// atteso e simmetria
assert(Math.abs(ELO.atteso(1000, 1000) - 0.5) < 1e-9);
assert(Math.abs(ELO.atteso(1200, 1000) + ELO.atteso(1000, 1200) - 1) < 1e-9);
assert(ELO.atteso(1400, 1000) > 0.9);

// a due, pari livello: +16 / -16; il più forte che vince guadagna poco, che perde molto
assert.strictEqual(ELO.nuovo(1000, [1000], true), 1016);
assert.strictEqual(ELO.nuovo(1000, [1000], false), 984);
assert(ELO.nuovo(1400, [1000], true) - 1400 <= 3);
assert(1400 - ELO.nuovo(1400, [1000], false) >= 28);
assert(ELO.nuovo(1000, [1400], true) - 1000 >= 28, 'il più debole che vince guadagna molto');
// tavolo da 4 pari livello: chi vince +24, gli altri -8 (somma zero)
assert.strictEqual(ELO.nuovo(1000, [1000, 1000, 1000], true), 1024);
assert.strictEqual(ELO.nuovo(1000, [1000, 1000, 1000], false), 992);
// somma quasi zero con valutazioni diverse (arrotondamento: al massimo 1 punto per giocatore)
const R = [1100, 950, 1300, 800];
for (let w = 0; w < 4; w++) {
  let tot = 0; for (let i = 0; i < 4; i++) tot += ELO.nuovo(R[i], R.filter((_, j) => j !== i), i === w) - R[i];
  assert(Math.abs(tot) <= 4, 'somma non nulla per vincitore ' + w + ': ' + tot);
}
// squadra vincente di 2: ognuno prende metà
assert.strictEqual(ELO.nuovo(1000, [1000, 1000, 1000], true, 2), 1000 + Math.round(32 * (0.5 - 0.25)));
// limiti
for (let i = 0; i < 400; i++) { const a = ELO.nuovo(2990, [100], true); assert(a <= ELO.MAX && a >= ELO.MIN); }
assert.strictEqual(ELO.nuovo(ELO.MIN, [3000], false), ELO.MIN);
assert.strictEqual(ELO.nuovo(1234, [], true), 1234, 'da solo non cambia nulla');
for (const r of [100, 500, 1000, 2000, 3000]) for (const a of [100, 1000, 3000]) for (const w of [true, false]) {
  const d = ELO.nuovo(r, [a, a], w) - r; assert(Math.abs(d) <= ELO.K, 'salto oltre K');
}
// convergenza: un giocatore che vince il 75% contro un avversario fisso sale sopra, ma si stabilizza
let r = 1000, rnd = require('./carica.js').rng(7);
for (let i = 0; i < 600; i++) r = ELO.nuovo(r, [1000], rnd() < 0.75);
assert(r > 1150 && r < 1450, 'convergenza fuori scala: ' + r);
console.log('elo ok');

// firestore.rules: stesso limite per partita, una riga per ogni gioco, nessuna riga in più
const fs = require('fs'), path = require('path');
const rules = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
const nucleo = fs.readFileSync(path.join(__dirname, '../src/js/app/07-nucleo.js'), 'utf8');
const ids = [...nucleo.matchAll(/(?:^ \{|GAMES\.push\(\{)id:'([a-z0-9]+)'/gm)].map(m => m[1]);
assert(ids.length >= 20, 'elenco giochi non letto');
const inRegole = [...rules.matchAll(/elo\('([a-z0-9]+)'\)/g)].map(m => m[1]);
assert.deepStrictEqual(inRegole.sort(), ids.slice().sort(), 'giochi con ELO nelle regole diversi da GAMES (npm run regole)');
assert(rules.includes(`<= ${ELO.K}`), 'limite K nelle regole');
assert(rules.includes(`>= ${ELO.MIN} `) && rules.includes(`<= ${ELO.MAX}`), 'limiti MIN/MAX nelle regole');
assert(rules.includes(`a.get(g, ${ELO.BASE})`), 'valutazione di partenza nelle regole');
for (const c of ELO.COOPERATIVI) assert(ids.includes(c), 'cooperativo sconosciuto: ' + c);
console.log('elo regole ok:', ids.length, 'giochi');
