// IA della battaglia (Cantari di Ventura): ogni mossa è valida, i turni si chiudono, tutto è deterministico e riprendibile, i comportamenti
// attesi (contatto, distanza, cure, aree, resa, fuga, bersaglio) e la forza dei bot (bravo ≫ casuale).
const assert = require('assert');
const { AR, C, eroe, squadra, battaglia, copia, mostro, pos, scena, aperta, riga } = require('./avv_aiuti.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const IA = require('../src/js/motori/27j-avv-ia.js');
const puro = (s) => JSON.parse(JSON.stringify(s));
const dist = (s, a, b) => G.dist(mostro(s, a), mostro(s, b));
const due = (cl1, cl2, liv) => [{ eroe: eroe(cl1, liv || 3), dist: 0 }, { eroe: eroe(cl2, liv || 3), dist: 0 }];
const azioni = (r) => r.azioni.map((a) => a.t + (a.id ? ':' + a.id : ''));

// incontri di prova: [livello, eroi, mostri]
const INCONTRI = [
  [1, 2, ['lupo-grigio', 'lupo-grigio']],
  [2, 3, ['brigante', 'brigante', 'arciere-bandito']],
  [2, 4, ['brigante', 'brigante', 'arciere-bandito', 'tagliagole']],
  [3, 4, ['brigante', 'tagliagole', 'cerusico-di-strada', 'stregone-rinnegato']],
  [3, 4, ['scheletro-armato', 'scheletro-armato', 'arciere-scheletro', 'ghoul-di-tomba']],
  [4, 4, ['anima-in-pena', 'officiante-spolpato', 'scheletro-armato', 'statua-vivente']]];
const nuovaBattaglia = (i, seme) => { const [liv, n, nem] = INCONTRI[i]; return battaglia(squadra(n, liv), nem, { seme, ambiente: AR.AMBIENTI[(i + seme) % AR.AMBIENTI.length] }); };

// ---- 1. validità: ogni azione dell'IA è accettata da `act`, ogni turno si chiude, ogni battaglia finisce, lo stato resta JSON puro ----
{ const COPPIE = [['eroica', 'normale'], ['racconto', 'racconto'], ['eroica', 'eroica'], ['normale', 'racconto'], ['casuale', 'casuale'], ['eroica', 'casuale']]; let battaglie = 0, mosse = 0, maxTurno = 0, maxGiri = 0, stalli = 0;
  for (const [le, ln] of COPPIE) for (let i = 0; i < INCONTRI.length; i++) for (let seme = 1; seme <= 3; seme++) {
    let x = nuovaBattaglia(i, seme), nTurno = 0, chi = null;
    for (let n = 0; n < 3000 && !x.over; n++) {
      const a0 = C.attore(x); if (a0.id !== chi) { chi = a0.id; nTurno = 0; }
      const a = IA.prossima(x, { livello: a0.lato === 'eroi' ? le : ln }); assert(a && a.t, 'un\'azione');
      const prima = JSON.stringify(x), r = C.act(x, a);
      assert.strictEqual(JSON.stringify(x), prima, 'prossima e act non toccano lo stato passato');
      assert(!r.err && !r.pausa, `${le}/${ln} incontro ${i} seme ${seme}: ${JSON.stringify(a)} → ${r.err || JSON.stringify(r.pausa)}`);
      x = r.s; mosse++; nTurno++; maxTurno = Math.max(maxTurno, nTurno); assert(nTurno <= 24, 'un turno non finisce mai: ' + a0.id); }
    assert(x.over, `${le}/${ln} incontro ${i} seme ${seme}: la battaglia deve finire`); if (x.over.esito === 'stallo') { assert(x.giro === 41 && (le === 'casuale' || ln === 'casuale'), `${le}/${ln} incontro ${i} seme ${seme}: stallo a ${x.giro} giri`); stalli++; } else assert(x.giro <= 40, 'oltre 40 giri: ' + x.giro);
    maxGiri = Math.max(maxGiri, x.giro);
    assert.deepStrictEqual(puro(x), x, 'stato JSON puro'); battaglie++; }
  assert.strictEqual(battaglie, COPPIE.length * INCONTRI.length * 3); assert(mosse > 3000, 'azioni giocate: ' + mosse);
  console.log(`  validità: ${battaglie} battaglie, ${mosse} azioni, turno più lungo ${maxTurno} azioni, battaglia più lunga ${maxGiri} giri, stalli ${stalli} (solo con il bot casuale)`); }

// ---- 2. `turno` e `partita` coincidono con il gioco azione per azione; nessun rumore casuale: stessa situazione, stessa scelta ----
{ const base = nuovaBattaglia(2, 7), opz = { eroi: 'eroica', nemici: 'normale' };
  const a = IA.partita(base, opz), b = IA.partita(copia(base), opz); assert.deepStrictEqual(a, b, 'due partite uguali'); assert(a.over);
  // a mano: prossima + act
  let x = copia(base); while (!x.over) { const c = C.attore(x); x = C.act(x, IA.prossima(x, { livello: opz[c.lato === 'eroi' ? 'eroi' : 'nemici'] })).s; }
  assert.deepStrictEqual(x.cb.map((c) => [c.id, c.hp]), a.cb.map((c) => [c.id, c.hp]), 'partita = azione per azione'); assert.strictEqual(x.giro, a.giro);
  // interrotta a metà, salvata come JSON e ripresa: stesso finale
  let m = copia(base); for (let n = 0; n < 9 && !m.over; n++) m = IA.turno(m, opz).s; assert(!m.over, 'a metà');
  const ripreso = IA.partita(JSON.parse(JSON.stringify(m)), opz); assert.deepStrictEqual(ripreso, a, 'ripresa dopo il salvataggio');
  // turno: azioni elencate, turno chiuso (tocca a un altro o finito)
  const t = IA.turno(base, opz); assert(t.azioni.length >= 1, 'almeno un\'azione'); assert(t.s.over || C.attore(t.s).id !== C.attore(base).id, 'il turno è chiuso');
  assert.strictEqual(IA.turno(a, opz).azioni.length, 0, 'a battaglia finita non c\'è niente da fare'); assert.strictEqual(IA.prossima(a, { livello: 'normale' }), null);
  // il bot casuale è casuale ma ripetibile
  const c1 = IA.partita(copia(base), { eroi: 'casuale', nemici: 'casuale' }), c2 = IA.partita(copia(base), { eroi: 'casuale', nemici: 'casuale' }); assert.deepStrictEqual(c1, c2);
  assert.notDeepStrictEqual(c1.cb.map((c) => c.hp), a.cb.map((c) => c.hp)); }

// ---- 3. pause delle reazioni: il bot dei mostri risponde da solo, il turno degli eroi può fermarsi e riprendere con la risposta ----
{ let visto = 0;
  for (let seme = 1; seme <= 40 && !visto; seme++) { let x = battaglia(squadra(2, 3), ['brigante', 'brigante', 'tagliagole'], { seme, opz: { reazioni: { eroi: 'chiedi', nemici: 'auto' } } });
    for (let n = 0; n < 200 && !x.over && !visto; n++) { const r = IA.turno(x, { eroi: 'eroica', nemici: 'normale', pause: 'ritorna' });
      if (r.pausa) { visto++; assert(r.pausa.opzioni.length >= 1 && r.pausa.tipo === 'reazione' && r.azione && r.azione.t, 'domanda e azione da ripetere');
        const dec = r.azione.dec || []; const ok = C.act(r.s, Object.assign({}, r.azione, { dec: dec.concat([r.pausa.opzioni[r.pausa.opzioni.length - 1].id]) })); assert(!ok.err, 'la risposta riprende l\'azione'); }
      x = r.s; if (r.pausa) break; }
    // senza `pause` risponde da solo e la battaglia finisce
    const fin = IA.partita(battaglia(squadra(2, 3), ['brigante', 'brigante', 'tagliagole'], { seme, opz: { reazioni: { eroi: 'chiedi', nemici: 'auto' } } }), { eroi: 'eroica', nemici: 'normale' }); assert(fin.over); }
  assert(visto, 'almeno una pausa vista'); }

// ---- 4. comportamenti: ognuno dei mostri e degli eroi fa quello che la sua scheda dice ----
// 4a. chi combatte da vicino e ha il nemico addosso non scappa: attacca (o apre con il suo potere) e non si sposta
{ for (const liv of ['racconto', 'normale', 'eroica']) { const s = scena(due('guerriero', 'chierico'), ['brigante'], { e1: [4, 5], e2: [6, 8], brigante: [4, 4] }, { chi: 'brigante' });
    const a = IA.prossima(s, { livello: liv }); assert(['attacca', 'potere'].includes(a.t) && a.bers === 'e1', liv + ': ' + JSON.stringify(a)); } }
// 4b. un arciere a contatto si stacca e tira da lontano; uno già lontano tira senza avvicinarsi
{ const s = scena(due('guerriero', 'chierico'), ['arciere-bandito'], { e1: [4, 6], e2: [7, 2], 'arciere-bandito': [4, 7] }, { chi: 'arciere-bandito' }), r = IA.turno(s, { eroi: 'eroica', nemici: 'eroica' });
  assert(dist(s, 'e1', 'arciere-bandito') === 1 && dist(r.s, 'e1', 'arciere-bandito') >= 3, 'prende le distanze'); assert(azioni(r).includes('muovi') && azioni(r).some((x) => x.startsWith('potere') || x === 'attacca'), 'e poi tira: ' + azioni(r));
  const l = scena(due('guerriero', 'chierico'), ['arciere-bandito'], { e1: [4, 4], e2: [6, 3], 'arciere-bandito': [4, 8] }, { chi: 'arciere-bandito' }), rl = IA.turno(l, { eroi: 'eroica', nemici: 'eroica' });
  assert(dist(rl.s, 'e1', 'arciere-bandito') >= 4, 'resta lontano'); assert(rl.ev.some((e) => e.t === 'tiro' && e.chi === 'arciere-bandito'), 'ha tirato'); }
// 4c. il guaritore cura l'alleato sotto la metà dei PF (e non spreca la cura su chi sta bene)
{ const s = scena(due('guerriero', 'chierico'), ['brigante', 'brigante', 'cerusico-di-strada'], { e1: [4, 3], e2: [5, 3], 'brigante#1': [4, 2], 'brigante#2': [6, 2], 'cerusico-di-strada': [5, 1] }, { chi: 'cerusico-di-strada' });
  const b = mostro(s, 'brigante#1'); b.hp = Math.ceil(b.hpMax * .3); const r = IA.turno(s, { eroi: 'eroica', nemici: 'eroica' });
  assert(r.azioni.some((a) => a.t === 'potere' && a.id === 'm-impacco' && a.bers === 'brigante#1'), 'impacco sul ferito: ' + JSON.stringify(r.azioni)); assert(mostro(r.s, 'brigante#1').hp > b.hp, 'e il ferito sta meglio');
  const sano = scena(due('guerriero', 'chierico'), ['brigante', 'brigante', 'cerusico-di-strada'], { e1: [4, 3], e2: [5, 3], 'brigante#1': [4, 2], 'brigante#2': [6, 2], 'cerusico-di-strada': [5, 1] }, { chi: 'cerusico-di-strada' });
  assert(!IA.turno(sano, { eroi: 'eroica', nemici: 'eroica' }).azioni.some((a) => a.id === 'm-impacco'), 'con tutti in salute non cura'); }
// 4d. l'eroe incantatore sceglie la cella che prende più nemici; il guerriero contro un gruppo non spreca i poteri a bersaglio singolo
{ const s = scena(due('mago', 'guerriero', 5), ['brigante', 'brigante', 'brigante'], { e1: [4, 8], e2: [2, 8], 'brigante#1': [4, 3], 'brigante#2': [5, 3], 'brigante#3': [4, 2] }, { chi: 'e1' });
  const r = IA.turno(s, { eroi: 'eroica', nemici: 'eroica' }), p = r.azioni.find((a) => a.t === 'potere' && a.cella); assert(p, 'usa un potere ad area: ' + JSON.stringify(r.azioni));
  const m = C.mosseValide(s).poteri.find((o) => o.id === p.id), mio = m.centri.find((c) => c.q === p.cella.q && c.r === p.cella.r);
  assert.strictEqual(mio.colpiti.length, Math.max(...m.centri.map((c) => c.colpiti.length)), 'la cella che ne prende di più'); assert(mio.colpiti.length >= 2); }
// 4e. resa: sotto il 25% dei PF un mostro che può arrendersi lo fa a livello racconto, mai a livello eroica
{ const s = scena(due('guerriero', 'chierico'), ['brigante', 'brigante'], { e1: [4, 5], e2: [6, 8], 'brigante#1': [4, 4], 'brigante#2': [7, 2] }, { chi: 'brigante#1' });
  mostro(s, 'brigante#1').hp = 2; assert.deepStrictEqual(IA.prossima(s, { livello: 'racconto' }), { t: 'arrendi' }); assert.notStrictEqual(IA.prossima(s, { livello: 'eroica' }).t, 'arrendi');
  const r = C.act(s, { t: 'arrendi' }); assert(!r.err && mostro(r.s, 'brigante#1').arreso, 'la resa è valida');
  const sano = scena(due('guerriero', 'chierico'), ['brigante', 'brigante'], { e1: [4, 5], e2: [6, 8], 'brigante#1': [4, 4], 'brigante#2': [7, 2] }, { chi: 'brigante#1' }); assert.notStrictEqual(IA.prossima(sano, { livello: 'racconto' }).t, 'arrendi', 'in salute combatte'); }
// 4f. fuga: la creatura che scappa corre verso l'uscita e poi `fuggi` (e non torna a combattere)
{ let s = scena(due('guerriero', 'chierico'), ['lupo-grigio', 'lupo-grigio'], { e1: [4, 8], e2: [6, 8], 'lupo-grigio#1': [4, 5], 'lupo-grigio#2': [2, 3] }, { chi: 'lupo-grigio#1' });
  mostro(s, 'lupo-grigio#1').hp = 1; const us = C.uscite(s, 'nemici'), dU = (c) => Math.min(...us.map((u) => G.dist(c, u))), d0 = dU(mostro(s, 'lupo-grigio#1'));
  let giri = 0; while (!s.over && !mostro(s, 'lupo-grigio#1').fuggito && giri++ < 12) { const a = C.attore(s), r = IA.turno(s, { eroi: 'casuale', nemici: 'normale' }); if (a.id === 'lupo-grigio#1') { assert(r.azioni.some((x) => x.t === 'muovi' || x.t === 'fuggi'), 'scappa: ' + JSON.stringify(r.azioni)); assert(dU(mostro(r.s, 'lupo-grigio#1')) <= d0 || mostro(r.s, 'lupo-grigio#1').fuggito); } s = r.s; }
  assert(mostro(s, 'lupo-grigio#1').fuggito, 'il lupo ferito è scappato'); }
// 4g. bersaglio: chi può abbattere uno quasi a terra lo fa; a livello racconto si risparmia chi è sotto il 25%
{ const abb = { racconto: 0, normale: 0, eroica: 0 };
  for (let seme = 1; seme <= 30; seme++) { const s = scena(due('guerriero', 'mago'), ['brigante'], { e1: [4, 5], e2: [3, 4], brigante: [4, 4] }, { chi: 'brigante', seme }), e2 = mostro(s, 'e2'); e2.hp = Math.max(1, Math.floor(e2.hpMax * .2));
    assert.strictEqual(dist(s, 'e1', 'brigante') + dist(s, 'e2', 'brigante'), 2, 'entrambi a contatto');
    for (const liv of Object.keys(abb)) if (IA.prossima(s, { livello: liv }).bers === 'e2') abb[liv]++; }
  assert.strictEqual(abb.eroica, 30, 'eroica: finisce il debole ' + JSON.stringify(abb)); assert(abb.normale >= 27, 'normale: quasi sempre ' + JSON.stringify(abb)); assert(abb.racconto <= 15, 'racconto: lo risparmia ' + JSON.stringify(abb)); }
// 4h. i lupi del branco fanno gruppo: vantaggio se un compagno è vicino al bersaglio
{ const s = scena(due('guerriero', 'chierico'), ['lupo-grigio', 'lupo-grigio'], { e1: [4, 5], e2: [6, 9], 'lupo-grigio#1': [4, 4], 'lupo-grigio#2': [5, 5] }, { chi: 'lupo-grigio#1' });
  const m = C.mosseValide(s), a = m.attacchi.find((x) => x.bers === 'e1'); assert(a && a.vant, 'vantaggio col compagno accanto'); }

// 4i. un muro in mezzo: chi non ha niente da fare si avvicina lungo il percorso (non in linea d'aria), non si pianta davanti al muro; le battaglie non si fermano
{ const arena = aperta(riga(5, '#######.#')), scenaMuro = (chi) => scena(due('guerriero', 'chierico'), ['brigante'], { e1: [4, 6], e2: [3, 7], brigante: [4, 4] }, { chi, arena });
  for (const chi of ['e1', 'brigante']) { const s = scenaMuro(chi), fin = IA.partita(s, { eroi: 'eroica', nemici: 'normale' }); assert(fin.over && fin.over.esito !== 'stallo', 'oltre il muro: ' + JSON.stringify(fin.over)); assert(fin.giro <= 25, 'si raggiungono in tempo: ' + fin.giro); }
  // lontano dal nemico, senza muri: il turno comincia e finisce avvicinandosi (con lo scatto se serve)
  const lontano = scena(due('guerriero', 'chierico'), ['brigante'], { e1: [4, 10], e2: [3, 10], brigante: [4, 0] }, { chi: 'e1' }), r = IA.turno(lontano, { eroi: 'eroica', nemici: 'normale' });
  assert(dist(r.s, 'e1', 'brigante') < dist(lontano, 'e1', 'brigante') - 2, 'avanza'); }

// ---- 5. forza: il bot bravo vince, il casuale perde; la tattica non cambia le regole (stesse squadre, stessi mostri) ----
{ const prova = (cfg, quali, n) => { let v = 0, t = 0; for (const i of quali) for (let seme = 1; seme <= n; seme++) { const x = IA.partita(nuovaBattaglia(i, 100 + seme), cfg); t++; if (x.over.esito === 'vittoria') v++; } return Math.round(100 * v / t); };
  const quali = [2, 4], bravo = prova({ eroi: 'eroica', nemici: 'normale' }, quali, 15), caso = prova({ eroi: 'casuale', nemici: 'normale' }, quali, 15);
  console.log(`  forza: bravo ${bravo}%, casuale ${caso}%`); assert(bravo >= 90, 'il bot bravo vince: ' + bravo); assert(caso <= 25, 'il bot casuale perde: ' + caso); assert(bravo - caso >= 65); }

console.log('ok');
