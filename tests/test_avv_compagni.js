// Compagni (A7): scheda da eroe, posti, approvazione, abbandono, reazioni ai toni, missione personale, validazione.
const assert = require('assert');
const { eroe, copia } = require('./avv_aiuti.js');
const E = require('../src/js/motori/27-eroi.js');
const CM = require('../src/js/motori/27p-avv-compagni.js');
const R = require('../src/js/motori/27q-avv-racconto.js');
const cap = require('../src/avventura/prova.json');
const d = cap.compagni.ilda;
const nuovo = () => R.nuovo('prova', 1);

// ---- la scheda è un eroe vero, del livello del gruppo ----
for (const liv of [1, 2, 4, 7, 10]) {
  const h = CM.scheda(d, liv, 'ilda');
  assert(E.coerente(h), 'scheda coerente, livello ' + liv); assert.strictEqual(h.liv, liv); assert.strictEqual(h.compagno, 'ilda'); assert.strictEqual(h.slot, 'c-ilda');
  assert.strictEqual(h.hp, h.hpMax, 'a pieni PF'); assert.strictEqual(h.hpMax, E.derivati(h).hpMax); assert.strictEqual(h.oro, 0);
  assert.strictEqual(h.xp, E.SOGLIE_XP[liv - 1]);
}
assert.strictEqual(CM.scheda(Object.assign({}, d, { liv: 3 }), 9, 'ilda').liv, 3, 'livello fisso');
assert.strictEqual(CM.scheda(d, 99, 'ilda').liv, E.LIV_MAX, 'mai oltre il massimo'); assert.strictEqual(CM.scheda(d, 0, 'ilda').liv, 1);
const ricca = CM.scheda(Object.assign({}, d, { equip: { arma: 'arco' }, zaino: ['pozione-cura', 'pozione-cura'], cintura: ['pozione-cura'] }), 2, 'ilda');
assert.strictEqual(ricca.equip.arma, 'arco'); assert.strictEqual(ricca.zaino.length, 2); assert.strictEqual(ricca.cintura.length, 1);
assert(E.prova(CM.scheda(d, 3, 'ilda'), 'percezione', 10, () => .5).ok !== undefined, 'si può usare nelle prove');

// ---- posti e stato ----
{
  const s = nuovo(); assert.strictEqual(CM.stato(s, 'ilda'), 'sconosciuto'); assert.strictEqual(CM.POSTI, 4);
  const tre = [eroe('guerriero', 1), eroe('mago', 1), eroe('ladro', 1)], quattro = tre.concat(eroe('chierico', 1));
  assert.strictEqual(CM.posti(s, { eroi: tre }), 1); assert.strictEqual(CM.posti(s, { eroi: quattro }), 0); assert.strictEqual(CM.posti(s, { posti: 2 }), 2, '«posti» della vista vince');
  assert.strictEqual(CM.recluta(s, cap, 'ilda', { eroi: quattro }).stato, 'attende', 'senza posto aspetta in taverna'); assert.strictEqual(CM.stato(s, 'ilda'), 'attende');
  assert.strictEqual(CM.nelGruppo(s).length, 0);
  assert.strictEqual(CM.recluta(s, cap, 'ilda', { eroi: tre }).stato, 'gruppo'); assert.deepStrictEqual(CM.nelGruppo(s), ['ilda']);
  assert.strictEqual(CM.posti(s, { eroi: tre }), 0, 'chi è nel gruppo occupa un posto'); assert.strictEqual(CM.recluta(s, cap, 'ilda', { eroi: tre }).gia, true);
  assert(CM.recluta(s, cap, 'nessuno', {}).err, 'compagno sconosciuto');
  assert.strictEqual(CM.congeda(s, 'ilda', 'prova').stato, undefined); assert.strictEqual(CM.stato(s, 'ilda'), 'andato'); assert.strictEqual(s.compagni.ilda.motivo, 'prova');
  assert(CM.recluta(s, cap, 'ilda', { eroi: tre }).err, 'chi se n\'è andato non torna');
  assert.strictEqual(CM.recluta(s, Object.assign(copia(cap), { compagni: { ilda: Object.assign({}, d, { torna: true }) } }), 'ilda', { eroi: tre }).stato, 'gruppo', 'se la storia lo permette, torna');
  assert(CM.congeda(nuovo(), 'ilda').err, 'non si congeda chi non si è incontrato');
}

// ---- approvazione ----
{
  const s = nuovo(); assert.strictEqual(CM.approv(s, cap, 'ilda'), 0, 'parte dal valore del capitolo');
  assert.strictEqual(CM.approva(s, cap, 'ilda', 150).a, CM.MAX, 'tetto a +100'); assert.strictEqual(CM.approva(s, cap, 'ilda', -500).a, CM.MIN, 'tetto a -100');
  assert(CM.approva(s, cap, 'nessuno', 1).err);
  const livelli = [[-100, 'ostile'], [-50, 'ostile'], [-49, 'freddo'], [-10, 'freddo'], [-9, 'neutro'], [19, 'neutro'], [20, 'amico'], [59, 'amico'], [60, 'fedele'], [100, 'fedele']];
  for (const [a, id] of livelli) assert.strictEqual(CM.livello(a).id, id, 'approvazione ' + a);
  // fuori dal gruppo l'approvazione cambia ma nessuno se ne va
  const t = nuovo(); t.compagni.ilda = { stato: 'attende' }; const r = CM.approva(t, cap, 'ilda', -90); assert.strictEqual(r.lascia, false); assert.strictEqual(CM.stato(t, 'ilda'), 'attende');
  // nel gruppo, scendere fino alla soglia (-40) la manda via; sopra no
  const u = nuovo(); CM.recluta(u, cap, 'ilda', { posti: 1 }); assert.strictEqual(CM.approva(u, cap, 'ilda', -39).lascia, false); assert.strictEqual(CM.stato(u, 'ilda'), 'gruppo');
  assert.strictEqual(CM.approva(u, cap, 'ilda', -1).lascia, true, 'a -40 se ne va'); assert.strictEqual(CM.stato(u, 'ilda'), 'andato'); assert.strictEqual(u.compagni.ilda.motivo, 'lascia');
  // fiducia: scatta una volta sola, quando si attraversa la soglia (30)
  const v = nuovo(); assert.strictEqual(CM.approva(v, cap, 'ilda', 29).fiducia, false); assert.strictEqual(CM.approva(v, cap, 'ilda', 1).fiducia, true); assert.strictEqual(CM.approva(v, cap, 'ilda', 5).fiducia, false);
}

// ---- toni e reazioni ----
{
  assert.strictEqual(CM.delta(d, ['pieta']), 8); assert.strictEqual(CM.delta(d, ['avidita']), -8); assert.strictEqual(CM.delta(d, ['pieta', 'avidita']), 0); assert.strictEqual(CM.delta(d, ['mistero']), 0); assert.strictEqual(CM.delta(d, null), 0);
  assert.strictEqual(CM.delta(d, ['pieta', 'onore', 'durezza']), 8 + 4 - 4);
  const s = nuovo(); assert.deepStrictEqual(CM.reagisci(s, cap, ['pieta']), [], 'nessuno nel gruppo, nessuna reazione');
  CM.recluta(s, cap, 'ilda', { posti: 1 }); const r = CM.reagisci(s, cap, ['pieta', 'durezza']); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].n, 4); assert.strictEqual(r[0].nome, 'Ilda'); assert.strictEqual(s.approv.ilda, 4);
  assert.deepStrictEqual(CM.reagisci(s, cap, ['mistero']), [], 'un tono che non le importa non fa niente');
}

// ---- missione personale e conversazioni ----
{
  const s = nuovo(); assert.strictEqual(CM.personale(s, cap, 'ilda'), 'bloccata'); assert.strictEqual(CM.parla(s, cap, 'ilda'), null, 'fuori dal gruppo non parla');
  CM.recluta(s, cap, 'ilda', { posti: 1 }); assert.strictEqual(CM.personale(s, cap, 'ilda'), 'bloccata'); assert.strictEqual(CM.parla(s, cap, 'ilda'), 'ilda-parla');
  s.approv.ilda = 30; assert.strictEqual(CM.personale(s, cap, 'ilda'), 'disponibile'); assert.strictEqual(CM.parla(s, cap, 'ilda'), 'ilda-fratello');
  s.missioni.fratello = { stato: 'attiva' }; assert.strictEqual(CM.personale(s, cap, 'ilda'), 'attiva'); s.missioni.fratello.stato = 'fatta'; assert.strictEqual(CM.personale(s, cap, 'ilda'), 'fatta');
  assert.strictEqual(CM.parla(s, cap, 'ilda'), 'ilda-parla', 'a missione finita torna la chiacchierata');
  assert.strictEqual(CM.personale(s, { compagni: { ilda: Object.assign({}, d, { personale: null }) } }, 'ilda'), 'nessuna');
}

// ---- validazione ----
{
  const guasto = f => { const c = copia(cap); f(c); return CM.valida(c).join(' | '); };
  assert.deepStrictEqual(CM.valida(cap), []);
  assert(/nome/.test(guasto(c => { c.compagni.ilda.nome = ''; })), 'nome');
  assert(/razza sconosciuta/.test(guasto(c => { c.compagni.ilda.razza = 'drago'; })));
  assert(/classe sconosciuta/.test(guasto(c => { c.compagni.ilda.classe = 'pirata'; })));
  assert(/aspetto/.test(guasto(c => { c.compagni.ilda.aspetto.viso = 99; })));
  assert(/livello non valido/.test(guasto(c => { c.compagni.ilda.liv = 40; })));
  assert(/soglia di abbandono/.test(guasto(c => { c.compagni.ilda.lascia = 10; })));
  assert(/soglia di fiducia/.test(guasto(c => { c.compagni.ilda.fiducia = 0; })));
  assert(/missione personale/.test(guasto(c => { c.compagni.ilda.personale = 'nulla'; })));
  assert(/id non valido/.test(guasto(c => { c.compagni.Ilda_X = c.compagni.ilda; })));
  assert(/la scena «x» non esiste/.test(guasto(c => { c.compagni.ilda.scena = 'x'; })));
}
console.log('OK compagni');
