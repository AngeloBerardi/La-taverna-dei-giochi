// Eroi: costi dei punteggi, razze e classi, derivati, validazione, livelli, prove.
const assert = require('assert');
const E = require('../src/js/motori/27-eroi.js');
const rng = require('./carica.js').rng(11);
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const base = (o) => ({ ...E.baseIniziale(), ...o });

// punti: tutti a 8 costano 0; tutti a 15 sono troppi; la distribuzione classica (15,15,15,8,8,8) costa 27
assert.strictEqual(E.costoBase(E.baseIniziale()), 0);
assert.strictEqual(E.costoBase(base({ for: 15, des: 15, cos: 15 })), 27);
assert.strictEqual(E.costoBase(base({ for: 15, des: 15, cos: 15, int: 9 })), 28);
assert(Number.isNaN(E.costoBase({ for: 16, des: 8, cos: 8, int: 8, sag: 8, car: 8 })), '16 non ha costo');
// modificatori e competenza
assert.deepStrictEqual([8, 9, 10, 11, 12, 15, 16, 20].map(E.mod), [-1, -1, 0, 0, 1, 2, 3, 5]);
assert.deepStrictEqual([1, 4, 5, 8, 9, 10].map(E.comp), [2, 2, 3, 3, 4, 4]);
// dati coerenti: ogni classe ha equipaggiamento esistente e abilità conosciute, ogni razza bonus su punteggi veri
for (const [id, c] of Object.entries(E.CLASSI)) {
  assert(c.dado >= 6 && c.dado <= 12 && E.STAT.includes(c.primaria) && c.salvezze.every(s => E.STAT.includes(s)), id);
  assert(c.abilita.every(a => E.ABILITA[a]), 'abilità sconosciuta in ' + id);
  for (const [slot, o] of Object.entries(c.equip)) assert(o === null || (E.OGGETTI[o] && E.OGGETTI[o].slot === slot), `${id}: oggetto ${o}`);
  assert(/^[a-z]+$/.test(id) && c.nome && c.desc);
}
for (const [id, r] of Object.entries(E.RAZZE)) { assert(Object.keys(r.bonus).every(k => E.STAT.includes(k)) && r.mov >= 4 && r.mov <= 7 && r.nome && r.tratto && r.desc && /^[a-z]+$/.test(id)); assert(Object.values(r.bonus).reduce((a, b) => a + b, 0) <= 6); }
for (const [id, o] of Object.entries(E.OGGETTI)) assert(/^[a-z-]+$/.test(id) && o.nome && ['arma', 'armatura', 'scudo'].includes(o.slot), id);

// creazione: guerriero nano
const g = E.nuovo({ nome: ' Brunilde ', razza: 'nano', classe: 'guerriero', base: base({ for: 15, cos: 14, des: 10, sag: 10 }), aspetto: A }, 1000);
assert.strictEqual(g.nome, 'Brunilde'); assert.strictEqual(g.liv, 1); assert.strictEqual(g.xp, 0); assert.strictEqual(g.creato, 1000);
const d = E.derivati(g);
assert.deepStrictEqual(d.stat, { for: 16, des: 10, cos: 16, int: 8, sag: 10, car: 8 }, 'bonus razza nano +1 FOR +2 COS');
assert.strictEqual(d.hpMax, 10 + 3, 'd10 + mod COS 16 (+3)');
assert.strictEqual(g.hp, d.hpMax);
assert.strictEqual(d.ca, 16 + 2 + 1, 'cotta di maglia 16 + scudo 2 + pelle di pietra 1');
assert.strictEqual(d.comp, 2); assert.strictEqual(d.attacco, 3 + 2); assert.deepStrictEqual(d.danno, { dado: 8, bonus: 3 });
assert.strictEqual(d.mov, 5); assert(E.coerente(g));
// mago elfo: pochi PF, CA da vesti + DES
const m = E.nuovo({ nome: 'Isil', razza: 'elfo', classe: 'mago', base: base({ int: 15, des: 14, cos: 13 }), aspetto: A });
const dm = E.derivati(m); assert.strictEqual(dm.hpMax, 6 + 1, 'd6 + mod COS 13 (+1)'); assert.strictEqual(dm.ca, 13, 'vesti 10 + mod DES 16 (+3)');
// i derivati dipendono solo dal contenuto, non da ciò che c'è salvato
assert(!E.coerente({ ...g, hpMax: 99 })); assert(!E.coerente({ ...g, hp: 99 })); assert(!E.coerente({ ...g, liv: 3 })); assert(!E.coerente({ ...g, base: { ...g.base, for: 16 } }));
assert(!E.coerente({ ...g, nome: '' })); assert(!E.coerente({ ...g, razza: 'drago' }));

// validazione: ogni motivo di rifiuto
const ok = { nome: 'A', razza: 'umano', classe: 'bardo', base: E.baseIniziale(), aspetto: A };
assert.strictEqual(E.valida(ok), null);
const no = (o, re) => { const e = E.valida({ ...ok, ...o }); assert(e && re.test(e), JSON.stringify(o) + ' -> ' + e); };
no({ nome: '' }, /nome/); no({ nome: '   ' }, /nome/); no({ nome: 'x'.repeat(17) }, /nome/); no({ nome: '<b>x' }, /nome/); no({ nome: 5 }, /nome/);
no({ razza: 'drago' }, /razza/); no({ classe: 'pirata' }, /classe/);
no({ base: base({ for: 16 }) }, /punteggi/); no({ base: base({ for: 7 }) }, /punteggi/); no({ base: base({ for: 12.5 }) }, /punteggi/);
no({ base: base({ for: 15, des: 15, cos: 15, int: 10 }) }, /servono 29/); no({ base: { ...E.baseIniziale(), extra: 8 } }, /sconosciuto/); no({ base: null }, /punteggi/);
no({ aspetto: { ...A, pelle: 6 } }, /aspetto/); no({ aspetto: { ...A, capelli: -1 } }, /aspetto/); no({ aspetto: { pelle: 0 } }, /aspetto/); no({ aspetto: { ...A, extra: 0 } }, /aspetto/);
assert.throws(() => E.nuovo({ ...ok, nome: '' }), e => e.code === 'eroe');
assert(E.valida(null) && E.valida('x'));

// livelli: soglie, salita, PF e cura
assert.deepStrictEqual([0, 99, 100, 299, 300, 8599, 8600, 99999].map(E.livelloPerXp), [1, 1, 2, 2, 3, 9, 10, 10]);
const g2 = E.guadagna(g, 150); assert.strictEqual(g2.liv, 2); assert.strictEqual(g2.hpMax, 13 + (6 + 3)); assert.strictEqual(g2.hp, g2.hpMax, 'sale: PF in più subito guariti');
assert(E.coerente(g2)); assert.strictEqual(E.guadagna(g, -50).xp, 0);
const ferito = { ...g, hp: 2 }; assert.strictEqual(E.guadagna(ferito, 150).hp, 2 + 9, 'chi sale non guarisce del tutto');
const mx = E.guadagna(g, 100000); assert.strictEqual(mx.liv, E.LIV_MAX); assert(E.coerente(mx));

// prove di abilità
const tira = (h, ab, cd, n, v) => { let s = 0; for (let i = 0; i < n; i++) s += E.prova(h, ab, cd, rng, v).ok ? 1 : 0; return s / n; };
const pr = E.prova(g, 'atletica', 12, () => 0.5); assert.strictEqual(pr.tiro, 11); assert.strictEqual(pr.mod, 3); assert.strictEqual(pr.comp, 2); assert.strictEqual(pr.tot, 16); assert(pr.ok);
assert.strictEqual(E.prova(g, 'arcano', 12, () => 0.5).comp, 0, 'senza competenza');
assert(E.prova(g, 'atletica', 99, () => 0.99).critico && E.prova(g, 'atletica', 99, () => 0.99).ok, '20 naturale riesce sempre');
const f = E.prova({ ...g, razza: 'umano' }, 'atletica', 1, () => 0); assert(f.fallimento && !f.ok, '1 naturale fallisce sempre');
assert(tira(g, 'atletica', 15, 4000) > tira(g, 'arcano', 15, 4000), 'competenza e modificatore contano');
assert(tira(g, 'atletica', 15, 4000, true) > tira(g, 'atletica', 15, 4000, false), 'il vantaggio aiuta');
const pic = { ...ok, razza: 'piccolo' }; const hp = E.nuovo({ ...pic, nome: 'P' });
let seq = [0, 0.5]; assert.strictEqual(E.prova(hp, 'persuasione', 10, () => seq.shift()).tiro, 11, 'il piccolo rilancia un 1 naturale');
assert.strictEqual(E.prova(E.nuovo({ ...ok, razza: 'elfo', nome: 'E' }), 'percezione', 10, () => 0.5).tot - E.prova(E.nuovo({ ...ok, razza: 'umano', nome: 'U' }), 'percezione', 10, () => 0.5).tot, 1, 'elfo: +1 in percezione (stessa SAG dell\'umano)');
assert.throws(() => E.prova(g, 'volo', 10, rng), /sconosciuta/);
// ogni combinazione razza x classe con la distribuzione "principale 15" è creabile e coerente
for (const r of Object.keys(E.RAZZE)) for (const c of Object.keys(E.CLASSI)) {
  const e = E.nuovo({ nome: 'T', razza: r, classe: c, base: base({ [E.CLASSI[c].primaria]: 15, cos: 14 }), aspetto: A }); assert(E.coerente(e), r + c); assert(e.hpMax >= 4);
}
console.log('eroi ok');

// firestore.rules: stessi limiti del motore, razze e classi esattamente quelle del catalogo
const fs = require('fs'), path = require('path');
const rules = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
const lista = (nome) => { const m = rules.match(new RegExp('// eroi:' + nome + '\\n([\\s\\S]*?)// eroi:' + nome + ':fine')); assert(m, 'segnaposto ' + nome); return [...m[1].matchAll(/== '([a-z]+)'/g)].map(x => x[1]).sort(); };
assert.deepStrictEqual(lista('razze'), Object.keys(E.RAZZE).sort(), 'razze nelle regole');
assert.deepStrictEqual(lista('classi'), Object.keys(E.CLASSI).sort(), 'classi nelle regole');
assert(rules.includes('<= ' + E.BUDGET + ';'), 'budget dei punti nelle regole');
for (const [v, c] of Object.entries(E.COSTO)) { const regola = Number(v) <= 13 ? Number(v) - 8 : (Number(v) === 14 ? 7 : 9); assert.strictEqual(regola, c, 'costo del punteggio ' + v + ' nelle regole'); }
assert(rules.includes("['e1', 'e2', 'e3', 'e4', 'e5']") && E.SLOT_ID.join() === 'e1,e2,e3,e4,e5', 'posti degli eroi');
for (const [k, n] of Object.entries(E.ASPETTO)) assert(rules.includes(`a.${k} < ${n}`), 'limite aspetto ' + k);
assert(rules.includes('d.liv <= ' + E.LIV_MAX), 'livello massimo');
// bonus e probabilità coerenti con la prova vera
{ const h = E.nuovo({ nome: 'P', razza: 'elfo', classe: 'ladro', aspetto: A, base: base({ des: 15, sag: 13 }) });
  assert.strictEqual(E.bonus(h, 'furtivita'), E.mod(E.punteggi(h.base, h.razza).des) + E.comp(1));
  assert.strictEqual(E.bonus(h, 'percezione'), E.mod(E.punteggi(h.base, h.razza).sag) + 1, 'elfo: +1 in percezione');
  assert.strictEqual(E.probabilita(h, 'furtivita', 1), 0.95, 'solo l\'1 naturale fallisce');
  assert.strictEqual(E.probabilita(h, 'furtivita', 99), 0.05, 'solo il 20 naturale riesce');
  let ok = 0; const r = require('./carica.js').rng(3), N = 20000; for (let i = 0; i < N; i++) if (E.prova(h, 'furtivita', 14, r).ok) ok++;
  assert(Math.abs(ok / N - E.probabilita(h, 'furtivita', 14)) < 0.02, 'la probabilità coincide con la simulazione'); }
// nomi delle abilità: una voce per abilità, con gli accenti
assert.deepStrictEqual(Object.keys(E.NOME_AB).sort(), Object.keys(E.ABILITA).sort()); assert.strictEqual(E.NOME_AB.furtivita, 'Furtività');
// crescita limitata: i numeri nelle regole sono quelli del motore, e l'attesa e il campo agg sono richiesti
assert.deepStrictEqual(E.LIMITI, { xp: 800, oro: 1000, attesaS: 60 });
assert(rules.includes('n.xp - v.xp <= ' + E.LIMITI.xp + ' && n.oro - v.oro <= ' + E.LIMITI.oro), 'limiti di xp e oro nelle regole');
assert(rules.includes("duration.value(" + E.LIMITI.attesaS + ", 's')"), 'attesa tra i guadagni nelle regole');
assert(rules.includes("guadagnoOk(request.resource.data, resource.data)"), 'l\'aggiornamento usa guadagnoOk');
assert(rules.includes("'hp', 'agg']"), 'agg tra i campi ammessi'); assert(rules.includes("!('agg' in request.resource.data)"), 'alla creazione agg non c\'è');
console.log('eroi regole ok');
