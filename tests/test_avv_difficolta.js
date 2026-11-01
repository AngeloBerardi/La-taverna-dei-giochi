// Difficoltà dell'Avventura (A13): la tabella (Racconto, Normale, Eroica), la migrazione dei salvataggi vecchi a «normale» e le quattro leve
// (budget dei gruppi, vite e costo della sconfitta, perdizione per alba, esperienza) dal motore puro fino all'orchestratore. Le percentuali di campagne finite
// (il motivo dei numeri) le misura `tools/avventura/campagne.js` e le raccoglie `docs/AVVENTURA-A13.md`.
const assert = require('assert');
const E = require('../src/js/motori/27-eroi.js');
global.EROI = E;
const DIF = require('../src/js/motori/27ha-avv-difficolta.js');
const SC = require('../src/js/motori/27i-avv-scontro.js');
const C = require('../src/js/motori/28-campagna.js');
const AVV = require('../src/js/motori/28a-avv-orchestratore.js');
const cap = require('../src/avventura/corona.json');

const copia = (x) => JSON.parse(JSON.stringify(x));
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base, slot) => Object.assign(E.nuovo({ nome, classe, razza, aspetto: A, base: Object.assign({ for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8 }, base) }, 7), { slot });
const due = () => [mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }, 'e1'), mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }, 'e2')];

// ---- la tabella ----
assert.deepStrictEqual(DIF.ID, ['racconto', 'normale', 'eroica']);
for (const id of DIF.ID) {
  const d = DIF.D[id];
  assert.strictEqual(d.id, id);
  assert(d.nome && d.breve && d.desc, id + ': nome, motto e descrizione');
  assert(d.gruppi > 0 && d.gruppi <= 2, id + ': gruppi');
  assert(Number.isInteger(d.vite) && d.vite >= 1 && d.vite <= 9, id + ': vite (le regole di Firestore ammettono 1–9)');
  assert(d.perdizione >= 1 && d.perdizione <= 10, id + ': perdizione per alba');
  assert(d.xp >= 1 && d.xp <= 2, id + ': esperienza');
  assert(d.pfRisveglio > 0 && d.pfRisveglio <= 1 && d.oroPersa >= 0 && d.oroPersa <= 1 && d.perdizioneSconfitta >= 0, id + ': costo della sconfitta');
}
// la scala è monotona: più è dura, più nemici, meno vite, più fretta
const [r, n, e] = DIF.ID.map((i) => DIF.D[i]);
assert(r.gruppi < n.gruppi && n.gruppi < e.gruppi, 'budget dei gruppi crescente');
assert(r.vite > n.vite && n.vite > e.vite, 'vite decrescenti');
assert(r.perdizione < n.perdizione && n.perdizione < e.perdizione, 'perdizione crescente');
assert(r.xp >= n.xp && n.xp >= e.xp, 'esperienza non crescente');
assert(r.oroPersa <= n.oroPersa && r.perdizioneSconfitta <= n.perdizioneSconfitta && r.pfRisveglio >= n.pfRisveglio, 'la sconfitta costa meno a Racconto');

// ---- valida: l'ignoto è «normale» ----
for (const x of [undefined, null, '', 'facile', 3, {}]) assert.strictEqual(DIF.valida(x), 'normale', 'valida(' + JSON.stringify(x) + ')');
for (const id of DIF.ID) assert.strictEqual(DIF.valida(id), id);
assert.strictEqual(DIF.di('eroica').vite, DIF.D.eroica.vite, 'di() legge la tabella');
assert.strictEqual(DIF.di('boh').id, 'normale');
assert.strictEqual(DIF.gruppi({ diff: 'racconto' }), DIF.D.racconto.gruppi);
assert.strictEqual(DIF.gruppi({}), DIF.D.normale.gruppi, 'senza difficoltà (stato vecchio) si gioca a Normale');
assert.strictEqual(DIF.gruppi(null), DIF.D.normale.gruppi);

// ---- scalaXp: ogni eroe e la quota; l'originale non cambia ----
{
  const riep = { esito: 'vittoria', xpPerEroe: 80, eroi: [{ slot: 'e1', xp: 80 }, { slot: 'e2', xp: 80 }] };
  const prima = copia(riep);
  assert.strictEqual(DIF.scalaXp(riep, { diff: 'normale' }), riep, 'a ×1 è lo stesso riepilogo');
  const x = DIF.scalaXp(riep, { diff: 'racconto' });
  assert.deepStrictEqual(riep, prima, 'il riepilogo di partenza non si tocca');
  assert.strictEqual(x.xpPerEroe, Math.round(80 * DIF.D.racconto.xp));
  assert(x.eroi.every((q) => q.xp === x.xpPerEroe), 'ogni eroe prende la quota scalata');
  assert.strictEqual(DIF.scalaXp(null, { diff: 'racconto' }), null);
}

// ---- il budget degli incontri scala con `gruppi` ----
{
  let somma = (scala) => { let t = 0; for (let seme = 1; seme <= 40; seme++) t += SC.incontro('banditi', 4, 4, 'medio', seme, scala).budget; return t; };
  const b1 = somma(1), bR = somma(DIF.D.racconto.gruppi), bN = somma(DIF.D.normale.gruppi), bE = somma(DIF.D.eroica.gruppi);
  assert(bR < bN && bN < bE && bE < b1, 'budget: Racconto < Normale < Eroica < tabella intera (' + [bR, bN, bE, b1] + ')');
  assert(Math.abs(bN / b1 - DIF.D.normale.gruppi) < .02, 'il budget segue la scala (' + (bN / b1).toFixed(3) + ')');
  assert.strictEqual(SC.incontro('banditi', 4, 4, 'medio', 3).budget, SC.incontro('banditi', 4, 4, 'medio', 3, 1).budget, 'senza scala è ×1');
  assert.strictEqual(SC.incontro('banditi', 4, 4, 'medio', 3, 0).budget, SC.incontro('banditi', 4, 4, 'medio', 3).budget, 'una scala nulla non azzera i nemici');
  // e i gruppi veri: a parità di seme, gli scelti a Racconto non valgono più di quelli di Eroica
  let pr = 0, pe = 0; for (let seme = 1; seme <= 40; seme++) { pr += SC.incontro('banditi', 4, 4, 'medio', seme, DIF.D.racconto.gruppi).xp; pe += SC.incontro('banditi', 4, 4, 'medio', seme, DIF.D.eroica.gruppi).xp; }
  assert(pr < pe, 'i PE dei nemici crescono con la difficoltà (' + pr + ' < ' + pe + ')');
}

// ---- campagna: la difficoltà vive nello stato, la perdizione per alba la segue, i salvataggi vecchi migrano a Normale ----
for (const id of DIF.ID) {
  const s = C.nuova(due(), 99, { difficolta: id });
  assert.strictEqual(s.diff, id);
  assert.strictEqual(C.nuova(due(), 99).diff, 'normale', 'senza scelta: Normale');
}
{
  const vecchio = C.nuova(due(), 5); delete vecchio.diff;
  assert.strictEqual(C.migra(copia(vecchio)).diff, 'normale', 'un salvataggio senza difficoltà gioca a Normale');
  const eroica = C.nuova(due(), 5, { difficolta: 'eroica' });
  assert.strictEqual(C.migra(copia(eroica)).diff, 'eroica', 'la migrazione non cambia ciò che c\'è');
  const guasto = copia(eroica); guasto.diff = 'impossibile';
  assert.strictEqual(C.migra(guasto).diff, 'normale', 'un valore sconosciuto torna a Normale');
}
{
  // un giorno in più: la perdizione sale del valore della difficoltà (le notti si ripetono uguali)
  const sale = (id) => { const s = C.nuova(due(), 12, { difficolta: id }); const p0 = s.perdizione | 0; const r = C.act(s, { t: 'lungo' }); assert(r.s, id + ': ' + r.err); return r.s.perdizione - p0; };
  for (const id of DIF.ID) assert.strictEqual(sale(id), DIF.D[id].perdizione, 'una notte a ' + id);
}

// ---- orchestratore: vite, sconfitta, salvataggio ----
for (const id of DIF.ID) {
  const s = AVV.nuova(cap, due(), 4242, { difficolta: id, avvio: false });
  assert.strictEqual(s.camp.diff, id, id + ': nello stato della campagna');
  assert.strictEqual(s.vite, DIF.D[id].vite, id + ': vite iniziali');
  assert.strictEqual(s.viteMax, DIF.D[id].vite, id + ': vite massime');
  const ri = AVV.apri(AVV.salva(s)); assert(ri.s, ri.err);
  assert.strictEqual(ri.s.camp.diff, id, id + ': sopravvive al salvataggio');
  assert.strictEqual(ri.s.viteMax, DIF.D[id].vite);
}
assert.strictEqual(AVV.nuova(cap, due(), 7, { avvio: false }).vite, DIF.D.normale.vite, 'senza scelta: vite di Normale');
{
  // un salvataggio di prima di A13 (senza `diff`, tre vite) si riapre a Normale e conserva le sue vite
  const s = AVV.nuova(cap, due(), 31, { avvio: false }); delete s.camp.diff; s.vite = 2; s.viteMax = 3;
  const ri = AVV.apri(AVV.salva(s)); assert(ri.s, ri.err);
  assert.strictEqual(ri.s.camp.diff, 'normale'); assert.strictEqual(ri.s.vite, 2, 'le vite rimaste restano'); assert.strictEqual(ri.s.viteMax, 3, 'e il massimo di allora');
}
{
  // il costo della sconfitta: a Racconto ci si risveglia con più PF e meno monete perse
  const costo = (id) => {
    const s = AVV.nuova(cap, due(), 5, { difficolta: id, avvio: false });
    s.camp.oro = 200; s.camp.perdizione = 0; const p0 = 0;
    for (const e of s.camp.eroi) e.hp = 0;
    const r = C.risveglio(s.camp, s.ultimaCitta, null, { pf: DIF.D[id].pfRisveglio, oro: DIF.D[id].oroPersa, perdizione: DIF.D[id].perdizioneSconfitta });
    assert(r.s, r.err);
    return { oro: r.s.oro, pf: r.s.eroi[0].hp / r.s.eroi[0].hpMax, perd: r.s.perdizione - p0 };
  };
  const cr = costo('racconto'), cn = costo('normale');
  assert(cr.oro > cn.oro, 'a Racconto si perde meno oro');
  assert(cr.pf > cn.pf, 'a Racconto ci si rialza con più PF');
  assert(cr.perd < cn.perd, 'a Racconto la perdizione sale meno');
}

console.log('test_avv_difficolta: ok');
