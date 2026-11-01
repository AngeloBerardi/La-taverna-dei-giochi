// Mostri visibili (A6.4): nascita, fase di movimento, inseguimento, contatto, chi entra in battaglia, assedio.
const assert = require('assert');
global.EROI = require('../src/js/motori/27-eroi.js');
const M = require('../src/js/motori/27m-avv-mondo.js'), L = require('../src/js/motori/27n-avv-luoghi.js'), O = require('../src/js/motori/27o-avv-mostri.js');
const SC = require('../src/js/motori/27i-avv-scontro.js');
const carica = require('./carica.js');
const K = M.K;

// uno stato minimo: mondo vero, quattro eroi finti in partenza
function stato(seed, n = 3, liv = 2) {
  const m = M.genera(seed);
  return { celle: m.celle, luoghi: m.luoghi, regioni: m.regioni, mercanti: m.mercanti, eroi: Array.from({ length: n }, (_, i) => ({ slot: 'e' + (i + 1), nome: 'E' + i, liv, hp: 10, hpMax: 10, q: 0, r: 0 })), mostri: [], fase: 'giorno', perdizione: 0, dentro: null };
}

// nascita: quanti, dove, di che famiglia, composizione del bestiario
for (let seed = 1; seed <= 60; seed++) {
  const s = stato(seed), rnd = carica.rng(seed);
  const n = O.rinasci(s, rnd); assert.strictEqual(n, O.BASE, 'i gruppi di base, seme ' + seed); assert.strictEqual(s.mostri.length, O.BASE);
  assert.strictEqual(O.rinasci(s, rnd), 0, 'già al numero giusto');
  const occ = new Set();
  for (const g of s.mostri) {
    const c = s.celle[K(g.q, g.r)];
    assert(M.passabile(c.t) && !c.poi, 'su terreno libero'); assert(!occ.has(K(g.q, g.r)), 'due gruppi nella stessa cella'); occ.add(K(g.q, g.r));
    assert(M.dist(g, { q: 0, r: 0 }) >= 5, 'lontano dalla partenza: ' + M.dist(g, { q: 0, r: 0 }));
    assert(!Object.values(s.luoghi).some(l => M.TIPI[l.tipo].sicuro && M.dist(l, g) < 2), 'non accanto a un luogo sicuro');
    assert(g.ids.length >= 1 && g.ids.length <= 8 && g.liv >= 1 && g.liv <= 8 && ['bestie', 'banditi', 'nonmorti'].includes(g.fam) && g.stato === 'vaga' && g.id);
    assert.strictEqual(g.fam, s.regioni[c.reg].fam, 'la famiglia segue la regione');
  }
  assert.deepStrictEqual(new Set(s.mostri.map(g => g.id)).size, s.mostri.length, 'id diversi');
}
// più perdizione, più gruppi (soglie) e livello maggiore
{ const s = stato(4); s.perdizione = 30; O.rinasci(s, carica.rng(1)); assert.strictEqual(s.mostri.length, O.BASE + 1); s.perdizione = 80; O.rinasci(s, carica.rng(2)); assert.strictEqual(s.mostri.length, O.BASE + 2);
  assert.strictEqual(O.bonusLivello({ perdizione: 0, fase: 'giorno' }), 0); assert.strictEqual(O.bonusLivello({ perdizione: 30, fase: 'giorno' }), 1); assert.strictEqual(O.bonusLivello({ perdizione: 80, fase: 'notte' }), 4, 'soglia 3 (+3) e notte (+1)'); }

// composizione al contatto: dipende dal livello di oggi, dal numero di eroi, ed è ripetibile
{ const s = stato(2); const g = { fam: 'banditi', liv: 2, diff: 'medio', seme: 99 }; s.eroi.forEach(e => e.liv = 2);
  const a = O.composizione(s, g, 3), b = O.composizione(s, g, 3); assert.deepStrictEqual(a, b, 'ripetibile');
  s.fase = 'notte'; const n = O.composizione(s, g, 3); assert(n.liv === a.liv + 1 && n.xp >= a.xp, 'di notte sono più forti: ' + a.xp + ' → ' + n.xp);
  s.fase = 'giorno'; s.perdizione = 80; assert(O.composizione(s, g, 3).xp > a.xp, 'con la perdizione alta sono più forti');
  const piccolo = O.composizione(s, g, 1), grande = O.composizione(s, g, 4); assert(grande.xp > piccolo.xp, 'più eroi, più mostri'); }

// fase: vagano, inseguono, di notte vanno più veloci, non entrano nei luoghi sicuri né nelle celle occupate
{ const s = stato(3, 1); s.mostri = []; const rnd = carica.rng(3);
  const cella = (q, r) => s.celle[K(q, r)];
  // pulizia: un'area libera attorno a (0,0)
  for (const c of M.celleRaggio(6)) { const x = cella(c.q, c.r); if (x) { x.t = 'pianura'; x.poi = null; x.luogo = null; } }
  for (const id of Object.keys(s.luoghi)) delete s.luoghi[id];
  s.eroi[0].q = 0; s.eroi[0].r = 0; s.eroi[0].hp = 10;
  const g = { id: 'm1', fam: 'banditi', liv: 1, diff: 'medio', seme: 1, ids: [], q: 3, r: 0, stato: 'vaga', pausa: 0 }; s.mostri = [g];
  let ev = O.fase(s, rnd); assert.strictEqual(g.stato, 'caccia', 'a 3 esagoni lo vede'); assert.strictEqual(M.dist(g, { q: 0, r: 0 }), 2, 'di giorno un passo'); assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].t, 'mostro');
  g.q = 3; g.r = 0; s.fase = 'notte'; O.fase(s, rnd); assert.strictEqual(M.dist(g, { q: 0, r: 0 }), 1, 'di notte due passi: arriva addosso');
  // lontano vaga: mai più di un passo, resta nella mappa
  g.q = 6; g.r = 0; g.stato = 'caccia'; s.fase = 'giorno'; let mossi = 0; for (let i = 0; i < 40; i++) { const da = { q: g.q, r: g.r }; O.fase(s, rnd); const d = M.dist(da, g); assert(d <= 1); if (d) mossi++; assert(s.celle[K(g.q, g.r)] && M.passabile(s.celle[K(g.q, g.r)].t)); }
  assert(mossi > 5 && mossi < 38, 'vaga a caso: si muove circa metà delle volte (' + mossi + ')');
  // la guardia non si muove; la pausa ferma un giro
  const gu = { ...g, id: 'm2', stato: 'guardia', q: 2, r: 0 }; s.mostri = [gu]; O.fase(s, rnd); assert.deepStrictEqual([gu.q, gu.r], [2, 0]);
  const pa = { ...g, id: 'm3', stato: 'vaga', q: 3, r: 0, pausa: 2 }; s.mostri = [pa]; O.fase(s, rnd); O.fase(s, rnd); assert.deepStrictEqual([pa.q, pa.r], [3, 0]); assert.strictEqual(pa.pausa, 0);
  // un luogo sicuro tiene lontani i mostri: l'eroe sta in un villaggio e nessuno lo cerca
  cella(0, 0).poi = 'villaggio'; const ins = { ...g, id: 'm4', q: 2, r: 0, stato: 'vaga' }; s.mostri = [ins]; O.fase(s, rnd); assert.strictEqual(ins.stato, 'vaga', 'chi sta al sicuro non è un bersaglio'); assert.strictEqual(O.contatto(s, 0, 0), null, 'nessun contatto in un luogo sicuro');
  cella(0, 0).poi = null; s.dentro = 'antro1'; assert.strictEqual(O.contatto(s, 2, 0), null, 'sottoterra nessuno ci trova'); s.dentro = null;
  // non si entra in una cella occupata e non si va sui luoghi
  const a = { ...g, id: 'm5', q: 2, r: 0, stato: 'caccia' }, b = { ...g, id: 'm6', q: 1, r: 0, stato: 'guardia' }; s.mostri = [a, b]; O.fase(s, rnd); assert.notDeepStrictEqual([a.q, a.r], [1, 0], 'la cella occupata resta libera'); }

// contatto: a un esagono o meno; chi entra e da quanto lontano
{ const s = stato(3, 4); for (const c of M.celleRaggio(6)) { const x = s.celle[K(c.q, c.r)]; if (x) { x.t = 'pianura'; x.poi = null; } }
  const g = { id: 'm1', fam: 'banditi', liv: 1, diff: 'medio', seme: 1, ids: [], q: 4, r: 0, stato: 'caccia', pausa: 0 }; s.mostri = [g];
  assert.strictEqual(O.contatto(s, 3, 0), g, 'a un esagono'); assert.strictEqual(O.contatto(s, 4, 0), g, 'sulla stessa cella'); assert.strictEqual(O.contatto(s, 2, 0), null, 'a due non ancora');
  s.eroi[0].q = 3; s.eroi[0].r = 0;  // 1 esagono: subito
  s.eroi[1].q = 2; s.eroi[1].r = 0;  // 2 esagoni: dopo
  s.eroi[2].q = 1; s.eroi[2].r = 0;  // 3 esagoni: dopo
  s.eroi[3].q = 0; s.eroi[3].r = 0;  // 4 esagoni: non partecipa
  const q = O.quali(s, g); assert.deepStrictEqual(q.quali, [0, 1, 2]); assert.deepStrictEqual(q.dist, { e1: 1, e2: 2, e3: 3 });
  s.eroi[1].hp = 0; assert.deepStrictEqual(O.quali(s, g).quali, [0, 2], 'chi è a terra non entra');
  // la battaglia vera rispetta le distanze: ≤1 subito, 2–3 arrivano dopo
  const eroi = [0, 1, 2, 3].map(i => EROI.nuovo({ nome: 'H' + i, classe: 'guerriero', razza: 'umano', aspetto: { pelle: 0, capelli: 0, mantello: 0, viso: 0 }, base: { for: 15, des: 12, cos: 14, int: 8, sag: 8, car: 8 } }));
  const sq = [0, 1, 2].map((k, i) => ({ eroe: eroi[i], dist: [1, 2, 3][i] })), b = SC.nuovo(sq, O.composizione(s, g, 3).nemici, require('../src/js/motori/27h-avv-arene.js').genera(5, 'strada'), { seme: 5 });
  assert.strictEqual(b.cb.filter(c => c.lato === 'eroi' && !c.fuori).length, 1, 'uno solo parte in campo'); assert.strictEqual(b.riserva.length, 2, 'due arrivano dopo');
  assert.deepStrictEqual(b.riserva.map(r => r.giro).sort(), [3, 4]); }

// visibili: entro 3 esagoni da un eroe in piedi
{ const s = stato(3, 2); s.mostri = [{ id: 'a', q: 3, r: 0 }, { id: 'b', q: 0, r: 5 }]; assert.deepStrictEqual(O.visibili(s).map(m => m.id), ['a']); s.eroi[0].hp = 0; s.eroi[1].q = 0; s.eroi[1].r = 4; assert.deepStrictEqual(O.visibili(s).map(m => m.id), ['b']); }

// assedio: un villaggio non di partenza ha un gruppo di guardia, si toglie con togliAssedio
for (let seed = 1; seed <= 30; seed++) {
  const s = stato(seed), rnd = carica.rng(seed); const l = O.assedia(s, rnd); assert(l && l.tipo === 'villaggio' && !l.partenza && l.assedio, 'villaggio assediato, seme ' + seed);
  const g = s.mostri.find(m => m.assedio === l.id); assert(g && g.stato === 'guardia' && M.dist(g, l) === 1, 'guardia accanto al villaggio');
  assert.strictEqual(O.assedia(s, rnd).id === l.id, false, 'un altro villaggio, non lo stesso'); O.togliAssedio(s, l.id); assert(!l.assedio && !g.assedio && g.stato === 'vaga');
  O.rinasci(s, rnd); assert(s.mostri.filter(m => !m.assedio).length >= O.BASE, 'gli assedianti non contano per il numero base');
}
// mercanti: restano sulla strada
{ const s = stato(6); const rnd = carica.rng(1); for (let i = 0; i < 50; i++) O.mercanti(s, rnd); assert(s.mercanti.every(x => s.celle[K(x.q, x.r)].t === 'strada' && !s.celle[K(x.q, x.r)].poi)); }
console.log('ok test_avv_mostri');
