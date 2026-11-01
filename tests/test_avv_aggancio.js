// Aggancio della battaglia alla campagna (A4.7): la battaglia parte dagli eroi della campagna e riporta PF, cariche, Concentrazione, cintura e PE.
const assert = require('assert');
const { A, AR, C, eroe } = require('./avv_aiuti.js');
const CAMP = require('../src/js/motori/28-campagna.js');
const IA = require('../src/js/motori/27j-avv-ia.js');
const puro = (s) => JSON.parse(JSON.stringify(s));
const campagna = (liv, seme) => { const c = CAMP.nuova(['guerriero', 'mago', 'chierico'].map((cl, i) => eroe(cl, liv, ['umano', 'elfo', 'nano'][i])), seme || 4242); return c; };
const gioca = (s) => IA.partita(s, { eroi: 'eroica', nemici: 'normale' });

// ---- partenza: gli eroi della campagna, così come sono ----
{ const camp = campagna(3); camp.eroi[0].hp = 7; camp.eroi[2].usi = { 'tocco-guaritore': 1 }; camp.eroi[1].conc = 1; camp.eroi[2].cintura = ['pozione-di-cura']; camp.eroi[2].zaino = ['bomba-di-fuoco'];
  const prima = JSON.stringify(camp), inc = { nemici: ['brigante', 'brigante', 'arciere-bandito'], seme: 11 };
  const s = C.daCampagna(camp, inc); assert.strictEqual(JSON.stringify(camp), prima, 'la campagna non cambia'); assert.deepStrictEqual(puro(s), s);
  const eroi = s.cb.filter((c) => c.lato === 'eroi'); assert.deepStrictEqual(eroi.map((c) => [c.id, c.indice, c.nome]), camp.eroi.map((e, i) => ['e' + (i + 1), i, e.nome]));
  assert.strictEqual(eroi[0].hp, 7); assert.strictEqual(eroi[2].usi['tocco-guaritore'], 1, 'le cariche a riposo restano consumate'); assert.strictEqual(eroi[1].conc, 1); assert.deepStrictEqual(eroi[2].cintura, ['pozione-di-cura']);
  assert.strictEqual(s.cb.filter((c) => c.lato === 'nemici').length, 3); assert.deepStrictEqual(C.daCampagna(camp, inc), s, 'stessa campagna e stesso incontro, stessa battaglia');
  assert.notDeepStrictEqual(C.daCampagna(camp, Object.assign({}, inc, { seme: 12 })).rng, s.rng, 'un altro seme, un\'altra battaglia');
  // l'arena viene dal terreno dove si trova la compagnia (o da `ambiente`); il capo ha la sua
  const k = camp.party.q + ',' + camp.party.r; camp.celle[k].t = 'bosco'; camp.celle[k].poi = null; assert.strictEqual(C.daCampagna(camp, inc).arena.ambiente, 'bosco');
  assert.strictEqual(C.daCampagna(camp, Object.assign({ ambiente: 'palude' }, inc)).arena.ambiente, 'palude'); assert(AR.CAPI['capobanda-corvino'], 'arena del capo'); assert.strictEqual(C.daCampagna(camp, { nemici: ['capobanda-corvino'], seme: 1 }).arena.id, AR.CAPI['capobanda-corvino'].id);
  // chi arriva dopo, a terra, in un posto preciso
  const t = C.daCampagna(camp, { nemici: ['brigante'], dist: { [camp.eroi[2].slot]: 3 }, sorpresa: 'nemici' }); assert(t.cb.find((c) => c.id === 'e3').fuori && t.riserva.length === 1); assert(t.cb.filter((c) => c.lato === 'nemici').every((c) => c.sorpreso));
  const giu = campagna(2); giu.eroi[0].hp = 0; const g = C.daCampagna(giu, { nemici: ['brigante'], seme: 3 }); assert(g.cb.find((c) => c.id === 'e1').hp === 0 && !C.inPiedi(g.cb.find((c) => c.id === 'e1')), 'chi è a terra parte a terra');
  giu.eroi.forEach((e) => { e.hp = 0; }); assert.throws(() => C.daCampagna(giu, { nemici: ['brigante'] }), /nessun eroe in piedi/); assert.throws(() => C.daCampagna({ eroi: [] }, {}), /eroi/); }

// ---- ritorno: PF, cariche, Concentrazione, cintura e PE tornano agli eroi; il resto non si tocca ----
{ let provate = 0, conPotere = 0;
  for (let seme = 1; seme <= 6; seme++) {
    const camp = campagna(3, 100 + seme); camp.eroi[2].cintura = ['pozione-di-cura']; camp.eroi[0].zaino = ['bomba-di-fuoco', 'corda']; camp.eroi[1].oro = 12; const copiaCamp = puro(camp);
    const s0 = C.daCampagna(camp, { nemici: ['brigante', 'brigante', 'tagliagole', 'arciere-bandito'], seme }), fin = gioca(s0), riep = C.riepilogo(fin);
    assert(C.aggiorna(camp, C.riepilogo(s0)).err, 'a battaglia in corso non si aggiorna nulla');
    const r = C.aggiorna(camp, riep); assert(!r.err, r.err); assert.strictEqual(JSON.stringify(camp), JSON.stringify(copiaCamp), 'la campagna passata non cambia'); assert.deepStrictEqual(puro(r.s), r.s);
    const nuova = r.s, vincenti = riep.esito === 'vittoria'; assert.strictEqual(r.esito, riep.esito); assert.strictEqual(r.xp, riep.xpPerEroe);
    riep.eroi.forEach((e, i) => { const h = nuova.eroi[i], h0 = camp.eroi[i], f = fin.cb.find((c) => c.id === e.id);
      assert.strictEqual(h.hp, f.hp); assert.strictEqual(h.conc, f.conc); assert.deepStrictEqual(h.usi, f.usi); assert.deepStrictEqual(h.cintura, f.cintura); assert.strictEqual(h.xp, h0.xp + e.xp);
      for (const campo of ['equip', 'zaino', 'oro', 'nome', 'liv', 'hpMax', 'scelte', 'slot', 'base']) assert.deepStrictEqual(h[campo], h0[campo], campo + ' non cambia');
      if (Object.keys(f.usi).length) conPotere++; });
    const tot = riep.eroi.reduce((a, e) => a + e.xp, 0); assert(tot <= riep.xp && tot > riep.xp - riep.eroi.length, 'PE divisi fra gli eroi presenti');
    if (vincenti) { const battuti = riep.nemici.filter((n) => n.esito === 'sconfitto' || n.esito === 'arreso').length; assert(battuti === 0 ? riep.xp === 0 : riep.xp > 0, 'PE solo per chi è battuto o arreso (non per chi scappa)'); assert.strictEqual(riep.xpPerEroe, Math.floor(riep.xp / riep.eroi.length)); assert(CAMP.vivi(nuova).length === riep.eroi.filter((e) => e.hp > 0).length); }
    // il resto della campagna resta quello di prima, e continua a funzionare
    for (const k of ['celle', 'party', 'giorno', 'fase', 'perdizione', 'oro', 'missione', 'seed', 'rng', 'n', 'v', 'g']) assert.deepStrictEqual(nuova[k], camp[k], k + ' non cambia');
    const dormi = puro(nuova); dormi.oro = 100; const rip = CAMP.act(dormi, { t: 'lungo' }); assert(!rip.err && JSON.stringify(rip.s) === JSON.stringify(puro(rip.s)), 'la campagna riparte (riposo lungo alla locanda): ' + rip.err); assert.deepStrictEqual(rip.s.eroi.filter((e) => e.hp > 0).map((e) => e.usi['tocco-guaritore'] || 0), rip.s.eroi.filter((e) => e.hp > 0).map(() => 0), 'il riposo ridà le cariche'); provate++; }
  assert.strictEqual(provate, 6); assert(conPotere >= 6, 'poteri usati e riportati: ' + conPotere); }

// ---- chi non c'era non guadagna, chi è a terra resta a terra, errori chiari ----
{ const camp = campagna(3, 9); const s0 = C.daCampagna(camp, { nemici: ['brigante', 'brigante'], dist: { [camp.eroi[2].slot]: 40 }, seme: 5, giriMax: 3 }); const fin = gioca(s0), riep = C.riepilogo(fin);
  const fuori = riep.eroi[2]; assert(fuori.xp === 0 || fin.cb.find((c) => c.id === 'e3').fuori === false); const r = C.aggiorna(camp, riep); assert(!r.err);
  if (fin.cb.find((c) => c.id === 'e3').fuori) assert.strictEqual(r.s.eroi[2].xp, camp.eroi[2].xp, 'chi non è arrivato non guadagna');
  const sbagliata = campagna(3, 9); sbagliata.eroi[1].nome = 'Altro'; assert(/non corrisponde/.test(C.aggiorna(sbagliata, riep).err || ''), 'compagnia diversa'); assert(C.aggiorna(null, riep).err); assert(C.aggiorna(camp, null).err); }

console.log('ok');
