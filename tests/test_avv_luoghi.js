// Luoghi (A6.2): soglie della perdizione, servizi, preghiera, sotterranei a stanze, eventi, taglie.
const assert = require('assert');
const L = require('../src/js/motori/27n-avv-luoghi.js');
const EROI = global.EROI = require('../src/js/motori/27-eroi.js');

// soglie: 24 | 25 | 49 | 50 | 74 | 75 | 100
for (const [p, l] of [[0, 0], [24, 0], [25, 1], [49, 1], [50, 2], [74, 2], [75, 3], [100, 3]]) assert.strictEqual(L.livelloPerdizione(p), l, 'livello a ' + p);
const e = [0, 1, 2, 3].map(l => L.EFFETTI[l]);
for (let i = 1; i < 4; i++) assert(e[i].mostri > e[i - 1].mostri && e[i].gruppi >= e[i - 1].gruppi, 'gli effetti crescono col livello');
assert(!e[1].assedio && e[2].assedio && e[3].assedio && !e[2].strade && e[3].strade, 'assedio dal livello 2, strade dal 3');
assert.deepStrictEqual(L.effetti(60), { livello: 2, ...L.EFFETTI[2] });
assert(L.NOTE_SOGLIA.slice(1).every(t => t.length > 20), 'ogni soglia ha il suo avviso');

// servizi: città completa, villaggio ridotto, assedio e santuario chiuso
assert.deepStrictEqual(L.servizi({ tipo: 'citta' }, 1), ['locanda', 'guaritore', 'tempio', 'bottega', 'bacheca']);
assert.deepStrictEqual(L.servizi({ tipo: 'villaggio' }, 1), ['locanda', 'guaritore', 'bottega']);
assert.deepStrictEqual(L.servizi({ tipo: 'villaggio', assedio: true }, 1), [], 'assediato: tutto chiuso');
assert.deepStrictEqual(L.servizi({ tipo: 'santuario', pronto: 5 }, 4), []); assert.deepStrictEqual(L.servizi({ tipo: 'santuario', pronto: 5 }, 5), ['preghiera']);
assert.deepStrictEqual(L.servizi(null, 1), []);
for (const s of Object.values(L.SERVIZI).flat()) assert(L.NOME_SERVIZIO[s], 'nome del servizio ' + s);
assert(L.PREZZI.tempio(5) > L.PREZZI.tempio(1) && L.PREZZI.tempio(1) === 30, 'il tempio costa di più agli eroi forti');
assert.strictEqual(L.PREZZI.guaritore(3, 10), 4); assert.strictEqual(L.PREZZI.guaritore(10, 10), 0);

// preghiera
assert.deepStrictEqual(L.preghiera({ tipo: 'santuario' }, 2, false, 0), { perdizione: -3, costo: 0, pronto: 5 });
assert.deepStrictEqual(L.preghiera({ tipo: 'santuario' }, 2, true, 50), { perdizione: -8, costo: 20, pronto: 5 });
assert(L.preghiera({ tipo: 'santuario' }, 2, true, 10).err, 'senza monete niente offerta');
assert(L.preghiera({ tipo: 'santuario', pronto: 6 }, 4, false, 0).err, 'ancora chiuso');
assert(L.preghiera({ tipo: 'citta' }, 1, false, 0).err);

// sotterranei: 3–6 stanze, boss per ultimo, ripetibili, completi
const n = { antro: 4, rovina: 3, torre: 6 };
for (const tipo of Object.keys(n)) for (let seed = 1; seed <= 50; seed++) {
  const a = L.stanze(seed, tipo), b = L.stanze(seed, tipo);
  assert.deepStrictEqual(a, b, 'stesso seme, stesso sotterraneo'); assert.strictEqual(a.length, n[tipo]); assert(a.length >= 3 && a.length <= 6);
  assert.strictEqual(a[a.length - 1].k, 'boss'); assert.strictEqual(a.filter(x => x.k === 'boss').length, 1, 'un solo boss');
  a.forEach((x, i) => { assert.strictEqual(x.n, i + 1); assert(['battaglia', 'trappola', 'evento', 'forziere', 'riposo', 'boss'].includes(x.k)); assert(L.testoStanza(x, tipo).length > 5, 'testo della stanza ' + x.k);
    if (x.k === 'trappola') { assert.strictEqual(x.ab.length, 3); assert(x.cd >= 12 && x.cd <= 18); assert(x.ab.every(k => EROI.ABILITA[k]), 'abilità vere: ' + x.ab); }
    if (x.k === 'evento') assert(L.evento(x.id)); });
}
assert.notDeepStrictEqual(Array.from({ length: 30 }, (_, i) => JSON.stringify(L.stanze(i + 1, 'antro'))).filter((x, i, v) => v.indexOf(x) === i).length, 1, 'i sotterranei variano col seme');
assert(L.stanze(3, 'torre').some(x => x.k === 'riposo'), 'la torre ha una stanza di riposo');
assert(L.stanze(1, 'torre', 5)[1].cd > L.stanze(1, 'torre', 1)[1].cd, 'il pericolo alza le difficoltà delle trappole');
assert.throws(() => L.stanze(1, 'citta'), /sotterraneo/);
assert.deepStrictEqual(Object.keys(L.FAMIGLIA_SOTT), ['antro', 'rovina', 'torre']);

// eventi: ogni scelta ha testo, effetti noti e un epilogo
const chiavi = ['oro', 'pfPct', 'perdizione', 'xp', 'razioni'];
for (const ev of L.EVENTI) { assert(ev.testo.length > 10 && ev.scelte.length >= 2); for (const s of ev.scelte) { assert(s.t && s.fine); assert(Object.keys(s.eff).every(k => chiavi.includes(k)), 'chiavi di effetto note'); } }
assert(L.EVENTI.some(ev => ev.scelte.some(s => s.eff.perdizione > 0)) && L.EVENTI.some(ev => ev.scelte.some(s => s.eff.perdizione < 0)), 'scelte buone e cattive');

// taglie
const mostri = [{ id: 'm1', liv: 2, stato: 'vaga' }, { id: 'm2', liv: 4, stato: 'caccia' }, { id: 'm3', liv: 3, stato: 'guardia' }];
const t = L.taglie(9, 1, mostri), t2 = L.taglie(9, 1, mostri);
assert.deepStrictEqual(t, t2); assert.strictEqual(t.length, 2); assert(t.every(x => x.mostro !== 'm3' && x.ricompensa >= 23 && !x.riscossa), 'niente taglie sui guardiani');
assert.strictEqual(L.taglie(9, 1, []).length, 0);
console.log('ok test_avv_luoghi');
