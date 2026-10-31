// Orchestratore dell'Avventura (A9): fasi, effetti `fuori` del racconto sul mondo, battaglie del racconto e del mondo, vite e risveglio, compagni, eventi di strada, chiusura di sessione,
// salvataggio e migrazione, determinismo. Il capitolo vero (corona.json) fa da banco di prova; un capitolo piccolo di prova ha una scena per ogni effetto.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { eroe: eroeLiv } = require('./avv_aiuti.js');
const E = require('../src/js/motori/27-eroi.js');
const C = require('../src/js/motori/28-campagna.js');
const SC = require('../src/js/motori/27i-avv-scontro.js');
const IA = require('../src/js/motori/27j-avv-ia.js');
const CM = require('../src/js/motori/27p-avv-compagni.js');
const R = require('../src/js/motori/27q-avv-racconto.js');
const AVV = require('../src/js/motori/28a-avv-orchestratore.js');
const cap = require('../src/avventura/corona.json');
const copia = (x) => JSON.parse(JSON.stringify(x));
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base, slot) => Object.assign(E.nuovo({ nome, classe, razza, aspetto: A, base: { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8, ...base } }), { slot });
const due = () => [mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }, 'e1'), mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }, 'e2')];
const quattro = () => due().concat([mk('Tobia', 'mago', 'piccolo', { int: 15, sag: 13, des: 12 }, 'e3'), mk('Ilda', 'chierico', 'nano', { sag: 15, cos: 13 }, 'e4')]);
const ok = (r, msg) => { assert(r.s, (msg || '') + ' → ' + r.err); return r; };

// ---- un capitolo piccolo: una scena per ogni effetto, a Valcorvo e a Rocca Pallida ----
const nodo = (testo, extra) => Object.assign({ chi: '_', testo }, extra);
const scena = (titolo, nodi, inizio) => ({ titolo, dove: ['valcorvo', 'rocca-pallida'], inizio: inizio || 'a', nodi });
const prova = {
  id: 'prova-avv', titolo: 'Prova', mondo: cap.mondo, personaggi: {}, compagni: { gherardo: cap.compagni.gherardo, mirta: cap.compagni.mirta }, missioni: {}, bandiere: [], ingressi: [], sommario: [], prossimo: [], eventi: [], finali: {},
  scene: {
    guadagni: scena('Guadagni', { a: nodo('Un dono.', { effetti: [{ t: 'oro', n: 30 }, { t: 'oggetto', id: 'pozione-cura', n: 2 }, { t: 'razioni', n: 2 }, { t: 'perdizione', n: 3 }], fine: true }) }),
    esperienza: scena('Esperienza', { a: nodo('Impari molto.', { effetti: [{ t: 'xp', n: 350 }], fine: true }) }),
    perdite: scena('Perdite', { a: nodo('Un furto.', { effetti: [{ t: 'oro', n: -9999 }, { t: 'oggetto', id: 'pozione-cura', n: -1 }, { t: 'razioni', n: -9 }, { t: 'pf', pct: -1 }], fine: true }) }),
    cure: scena('Cure', { a: nodo('Un riposo.', { effetti: [{ t: 'pf', pct: 1 }], fine: true }) }),
    viaggio: scena('Viaggio', { a: nodo('In cammino.', { effetti: [{ t: 'sposta', id: 'rocca-pallida' }], fine: true }) }),
    scontro: scena('Scontro', { a: nodo('Le lame escono.', { effetti: [{ t: 'battaglia', fam: 'banditi', diff: 'facile' }], vai: 'b' }), b: nodo('Dopo la battaglia.', { effetti: [{ t: 'oro', n: 5 }, { t: 'bandiera', id: 'scontro-vinto' }], fine: true }) }),
    capo: scena('Il capo', { a: nodo('Corvino ride.', { effetti: [{ t: 'battaglia', capo: 'capobanda-corvino', diff: 'capo', arena: 'antro', sorpresa: 'nemici' }], fine: true }) }),
    gherardo: scena('Gherardo', { a: nodo('Gherardo si unisce.', { effetti: [{ t: 'recluta', id: 'gherardo' }], fine: true }) }),
    mirta: scena('Mirta', { a: nodo('Mirta si unisce.', { effetti: [{ t: 'recluta', id: 'mirta' }], fine: true }) }),
    congedo: scena('Congedo', { a: nodo('Gherardo se ne va.', { effetti: [{ t: 'congeda', id: 'gherardo' }], fine: true }) }),
    scelta: scena('Scelta', { a: nodo('Che fai?', { scelte: [{ t: 'Prendo', effetti: [{ t: 'oro', n: 1 }], vai: 'b' }, { t: 'Lascio', fine: true }] }), b: nodo('Preso.', { fine: true }) }),
    'gherardo-parla': { titolo: 'Due parole', inizio: 'a', nodi: { a: nodo('Due parole con Gherardo.', { fine: true }) } },
    finale: scena('Finale', { a: nodo('Fine del cantare.', { fine: 'finale-a-luminoso' }) })
  }
};
prova.finali = { 'finale-a-luminoso': { titolo: 'Una fine luminosa', testo: 'Tutto è bene.' } };

// ---- i giocatori sono eroi veri con uno slot; nuova campagna e prologo ----
let s = AVV.nuova(cap, due(), 4242);
assert.strictEqual(s.g, 'avventura'); assert.strictEqual(s.cap, 'corona'); assert.strictEqual(s.vite, 3); assert.strictEqual(s.viteMax, 3);
assert.strictEqual(s.camp.luoghi[s.ultimaCitta].nome, 'Valcorvo', 'si parte da Valcorvo');
assert.strictEqual(AVV.fase(s), 'dialogo', 'il prologo parte da solo'); assert.strictEqual(s.racc.scena.id, 'notte-dei-corvi');
assert.deepStrictEqual(JSON.parse(JSON.stringify(s)), s, 'lo stato è JSON puro');
assert.strictEqual(AVV.nuova(cap, due(), 4242, { avvio: false }).racc.scena, null, 'senza avvio nessuna scena');
// tutto il prologo, scegliendo sempre la prima risposta possibile
function chiudiScena(x, c, max) {
  let n = 0; c = c || cap;
  while (x.racc.scena && !x.bat && !x.camp.sfida && n++ < (max || 60)) {
    const v = AVV.vista(x, c).racconto, a = v.scelte.length ? { t: 'scegli', i: v.scelte.find((q) => q.ok).i } : { t: 'continua' };
    const r = AVV.act(x, { t: 'racconto', a }, c); assert(r.s, r.err); x = r.s;
  }
  return x;
}
s = chiudiScena(s);
assert.strictEqual(AVV.fase(s), 'citta', 'finito il prologo si è in città'); assert.strictEqual(s.fase, 'citta');
assert(s.log.length === 0 || Array.isArray(s.log));
const vis = AVV.vista(s, cap); assert.strictEqual(vis.luogo.id, 'valcorvo'); assert(vis.scene.some((x) => x.id === 'udienza'), 'le scene del luogo si vedono');
assert.strictEqual(vis.vite, 3);
// il salvataggio non è enorme (Firestore: un documento, un campo)
assert(AVV.salva(s).dati.length < 200000, 'salvataggio piccolo: ' + AVV.salva(s).dati.length);

// ---- errori ----
assert(AVV.act(null, { t: 'chiudi' }, cap).err && AVV.act(s, null, cap).err && AVV.act(s, { t: 'boh' }, cap).err, 'azioni non valide');
assert(AVV.act(s, { t: 'racconto', a: { t: 'continua' } }, cap).err, 'nessuna scena in corso');
assert(AVV.act(s, { t: 'scena', id: 'torre-re' }, cap).err, 'una scena che qui non c\'è');
assert(AVV.act(s, { t: 'esito', riep: { esito: 'vittoria' } }, cap).err, 'nessuna battaglia in corso');
assert(AVV.act(s, { t: 'camp', a: { t: 'esito' } }, cap).err, 'l\'esito passa da «esito»');
assert(AVV.act(s, { t: 'parla', id: 'gherardo' }, cap).err, 'chi non è nel gruppo non parla');

// ---- ogni effetto del racconto sul mondo ----
const vai = (x, id, c) => ok(AVV.act(x, { t: 'scena', id }, c || prova), 'scena ' + id).s;
let p = AVV.nuova(prova, due(), 11);
assert.strictEqual(AVV.fase(p), 'citta');
const oro0 = p.camp.oro, razioni = (x) => x.camp.eroi.reduce((a, h) => a + h.zaino.filter((i) => i === 'razione').length, 0), pozioni = (x) => x.camp.eroi.reduce((a, h) => a + h.zaino.filter((i) => i === 'pozione-cura').length, 0);
const poz0 = pozioni(p), raz0 = razioni(p);
let q = vai(p, 'guadagni'); q = chiudiScena(q, prova);
assert.strictEqual(q.camp.oro, oro0 + 30, 'oro'); assert.strictEqual(pozioni(q), poz0 + 2, 'oggetti'); assert.strictEqual(razioni(q), raz0 + 2, 'razioni'); assert.strictEqual(q.camp.perdizione, 3, 'perdizione');
assert(q.log.some((r) => /30 monete/.test(r)) && q.log.some((r) => /Pozione/.test(r)), 'il registro lo dice: ' + q.log.join(' | '));
// esperienza: a testa, e i livelli salgono davvero
const liv0 = q.camp.eroi.map((e) => e.liv), hpMax0 = q.camp.eroi.map((e) => e.hpMax);
let x = chiudiScena(vai(q, 'esperienza'), prova);
assert(x.camp.eroi.every((e, i) => e.xp === q.camp.eroi[i].xp + 350), 'esperienza a testa');
assert(x.camp.eroi.every((e, i) => e.liv > liv0[i] && e.hpMax > hpMax0[i]), 'salgono di livello e di PF massimi');
assert(x.log.some((r) => /sale al livello/.test(r)), 'lo dice');
assert(x.camp.eroi.every((e) => e.scelte && Object.keys(e.scelte).length > 0), 'poteri e talenti scelti con la prima proposta');
// perdite: non si va sotto zero, mai a morte per colpa del racconto, solo oggetti che si hanno
const y = chiudiScena(vai(x, 'perdite'), prova);
assert.strictEqual(y.camp.oro, 0, 'si paga quel che c\'è'); assert.strictEqual(pozioni(y), pozioni(x) - 1); assert.strictEqual(razioni(y), 0, 'razioni finite, non sotto zero');
assert(y.camp.eroi.every((e) => e.hp >= 1), 'il racconto non uccide'); assert(y.camp.eroi.every((e) => e.hp === 1 || e.hp > 0));
// cure
const z = chiudiScena(vai(y, 'cure'), prova); assert(z.camp.eroi.every((e) => e.hp === e.hpMax), 'tutti in forze');
// spostamento
const w = chiudiScena(vai(z, 'viaggio'), prova); const rocca = w.camp.luoghi['rocca-pallida'];
assert(w.camp.eroi.every((e) => e.q === rocca.q && e.r === rocca.r), 'la compagnia arriva a Rocca Pallida'); assert.strictEqual(AVV.fase(w), 'citta');
assert.strictEqual(w.ultimaCitta, 'rocca-pallida', 'l\'ultima città cambia');
// scelte e bandiere del racconto
let sc = vai(p, 'scelta'); let v = AVV.vista(sc, prova).racconto; assert.strictEqual(v.scelte.length, 2);
assert(AVV.act(sc, { t: 'camp', a: { t: 'tira', tutti: true } }, prova).err, 'durante un racconto la mappa aspetta');
assert(AVV.act(sc, { t: 'racconto', a: { t: 'continua' } }, prova).err, 'prima si sceglie');
sc = ok(AVV.act(sc, { t: 'racconto', a: { t: 'scegli', i: 0 } }, prova)).s; assert.strictEqual(sc.camp.oro, oro0 + 1); sc = chiudiScena(sc, prova); assert.strictEqual(AVV.fase(sc), 'citta');

// ---- battaglia del racconto: il racconto aspetta, poi riprende ----
const vincita = (b, hp) => { b.over = { esito: 'vittoria', giri: 1 }; const riep = SC.riepilogo(b); if (hp != null) riep.eroi.forEach((e) => { e.hp = hp; }); return riep; };
const perdita = (b, esito) => { b.over = { esito: esito || 'sconfitta', giri: 1 }; const riep = SC.riepilogo(b); riep.eroi.forEach((e) => { e.hp = 0; e.stato = 'a-terra'; }); riep.xpPerEroe = 0; return riep; };
const ap = AVV.act(p, { t: 'scena', id: 'scontro' }, prova); assert.strictEqual(ap.cambio.a, 'battaglia', 'cambio di fase: ' + JSON.stringify(ap.cambio));
let b1 = ap.s;      // lo scontro si apre appena si entra nel nodo: il testo del nodo è l'introduzione, poi si combatte, poi «Continua»
assert(b1.bat && b1.bat.nemici.length >= 1 && b1.racc.scena.nodo === 'a', 'lo scontro è aperto e il racconto sta sul nodo che lo introduce');
assert(AVV.vista(b1, prova).racconto.testo === 'Le lame escono.', 'e il testo si può ancora leggere');
assert(AVV.act(b1, { t: 'racconto', a: { t: 'continua' } }, prova).err, 'prima si combatte');
assert(AVV.act(b1, { t: 'camp', a: { t: 'tira', tutti: true } }, prova).err, 'e la mappa aspetta');
assert(AVV.act(b1, { t: 'chiudi' }, prova).err, 'non si chiude la sessione nel mezzo di una battaglia');
const bat = AVV.battaglia(b1); assert(bat && bat.cb.filter((c) => c.lato === 'nemici').length === b1.bat.nemici.length, 'la battaglia pronta ha quei nemici');
assert.strictEqual(bat.cb.filter((c) => c.lato === 'eroi').length, 2, 'combattono gli eroi in piedi');
assert.deepStrictEqual(AVV.quali(b1), b1.bat.quali);
assert.strictEqual(JSON.stringify(AVV.battaglia(b1)), JSON.stringify(AVV.battaglia(b1)), 'la stessa battaglia ogni volta (partenza ripetibile)');
const xp0 = b1.camp.eroi[0].xp;
const fin = IA.partita(AVV.battaglia(b1), { eroi: 'eroica', nemici: 'normale' });
let b2 = ok(AVV.act(b1, { t: 'esito', riep: SC.riepilogo(fin) }, prova), 'esito della battaglia'); assert.strictEqual(b2.cambio.a, 'dialogo', 'la scena riprende'); b2 = b2.s;
assert.strictEqual(b2.racc.scena.nodo, 'a', 'dal nodo che l\'ha introdotta, con «Continua»');
assert.strictEqual(fin.over.esito, 'vittoria'); assert.strictEqual(b2.bat, null); assert(b2.camp.eroi[0].xp > xp0, 'esperienza della battaglia');
assert.strictEqual(b2.vite, 3, 'una vittoria non costa niente'); b2 = chiudiScena(b2, prova); assert(b2.racc.bandiere['scontro-vinto'], 'dopo la battaglia il racconto va avanti'); assert.strictEqual(b2.camp.oro, oro0 + 5);
assert.strictEqual(b2.sessione.battaglie, 1);
// sconfitta: una vita in meno, ci si sveglia nell'ultima città, metà PF, metà oro, perdizione +10, la scena è interrotta ma si può rifare
{
  let k = vai(p, 'scontro'); k.camp.oro = 101;
  for (const e of k.camp.eroi) { e.q = k.camp.luoghi['casale-salici'].q; e.r = k.camp.luoghi['casale-salici'].r; }   // lontano: non conta dove si perde, conta l'ultima città
  const pd = k.camp.perdizione;
  const r = ok(AVV.act(k, { t: 'esito', riep: perdita(AVV.battaglia(k)) }, prova), 'sconfitta'); const d = r.s;
  assert.strictEqual(d.vite, 2, 'una vita in meno'); assert.strictEqual(d.bat, null); assert.strictEqual(d.racc.scena, null, 'la scena è interrotta');
  const l = d.camp.luoghi[d.ultimaCitta]; assert(d.camp.eroi.every((e) => e.q === l.q && e.r === l.r), 'tutti nell\'ultima città');
  assert(d.camp.eroi.every((e) => e.hp === Math.max(1, Math.ceil(e.hpMax / 2))), 'metà PF, anche i caduti');
  assert.strictEqual(d.camp.oro, 51, 'metà dell\'oro comune persa (101 → 51)'); assert.strictEqual(d.camp.perdizione, pd + 10, 'perdizione +10'); assert.strictEqual(d.camp.over, null);
  assert.strictEqual(r.cambio.a, 'citta'); assert(r.righe.some((t) => /Restano 2 vite/.test(t)), r.righe.join('|'));
  assert.strictEqual(d.sessione.sconfitte, 1);
  assert(AVV.vista(d, prova).scene.some((q2) => q2.id === 'scontro'), 'la scena si può rifare');
  // fuga: nessuna vita persa, la scena si interrompe, perdizione +1
  const f = vai(p, 'scontro');
  const rf = ok(AVV.act(f, { t: 'esito', riep: (() => { const bb = AVV.battaglia(f); bb.over = { esito: 'fuga', giri: 3 }; return SC.riepilogo(bb); })() }, prova), 'fuga'); assert.strictEqual(rf.s.vite, 3); assert.strictEqual(rf.s.racc.scena, null); assert.strictEqual(rf.s.camp.perdizione, 1);
  // tre sconfitte: la campagna è persa, niente più azioni
  let t = vai(p, 'scontro'), n = 0;
  while (t.vite > 0 && n++ < 5) {
    if (!t.bat) t = vai(t, 'scontro');
    t = ok(AVV.act(t, { t: 'esito', riep: perdita(AVV.battaglia(t)) }, prova)).s;
  }
  assert.strictEqual(t.vite, 0); assert(t.fine && !t.fine.vinta && t.fine.esito === 'persa', 'a zero vite la campagna è persa'); assert.strictEqual(AVV.fase(t), 'fine');
  assert(AVV.act(t, { t: 'chiudi' }, prova).err, 'finita è finita');
  assert(AVV.apri(AVV.salva(t)).s.fine, 'e finita resta anche riaprendola');
}

// ---- il capo della storia: la famiglia giusta, sorpresa e arena come scritto ----
{
  const k = vai(p, 'capo');
  assert(k.bat && k.bat.nemici.includes('capobanda-corvino'), 'Corvino c\'è: ' + k.bat.nemici);
  assert.strictEqual(k.bat.sorpresa, 'nemici'); assert.strictEqual(k.bat.ambiente, 'antro');
  const bb = AVV.battaglia(k); assert(bb.cb.some((c) => c.def === 'capobanda-corvino' || c.id.includes('capobanda')), 'e nella battaglia'); assert.strictEqual(AVV.fase(k), 'battaglia');
}

// ---- battaglie del mondo: le gestisce CAMP, l'orchestratore ne conta le vite ----
{
  const m = AVV.nuova(prova, due(), 77); const c = m.camp;
  for (const cell of C.celleRaggio(5)) { const xc = c.celle[C.K(cell.q, cell.r)]; if (xc && !(cell.q === 0 && cell.r === 0)) { xc.t = 'pianura'; if (xc.luogo) { delete c.luoghi[xc.luogo]; xc.luogo = null; } xc.poi = null; } }
  c.mostri = []; c.mercanti = [];
  const e0 = c.eroi[0]; const t = { q: e0.q + 5, r: e0.r };
  c.mostri.push({ id: 'mx1', fam: 'banditi', liv: 1, diff: 'facile', seme: 7, ids: ['brigante'], q: t.q, r: t.r, stato: 'vaga', pausa: 0 });
  let g = ok(AVV.act(m, { t: 'camp', a: { t: 'tira', tutti: true } }, prova)).s;
  const mossa = ok(AVV.act(g, { t: 'camp', a: { t: 'muovi', eroe: 0, q: t.q - 1, r: t.r, tutti: true } }, prova), 'contatto'); g = mossa.s;
  assert(g.camp.sfida && AVV.fase(g) === 'battaglia', 'contatto = battaglia'); assert.strictEqual(mossa.cambio.a, 'battaglia');
  assert.strictEqual(AVV.battaglia(g).cb.length, CtoSC(g).length, 'è la battaglia di CAMP');
  assert(AVV.act(g, { t: 'camp', a: { t: 'tira', tutti: true } }, prova).err, 'prima si combatte');
  const rs = ok(AVV.act(g, { t: 'esito', riep: perdita(AVV.battaglia(g)) }, prova), 'sconfitta nel mondo'); assert.strictEqual(rs.s.vite, 2); assert.strictEqual(rs.s.camp.sfida, null);
  assert(rs.s.camp.eroi.every((e) => e.hp > 0), 'risvegliati'); assert.strictEqual(rs.s.camp.over, null, 'non è la fine: il mondo continua'); assert.strictEqual(AVV.fase(rs.s), 'citta');
  const rv = ok(AVV.act(g, { t: 'esito', riep: vincita(AVV.battaglia(g), 5) }, prova), 'vittoria nel mondo'); assert.strictEqual(rv.s.vite, 3); assert.strictEqual(rv.s.camp.sfida, null);
  // fuga dal mondo: CAMP ritira la compagnia, nessuna vita persa
  const rfu = ok(AVV.act(g, { t: 'esito', riep: (() => { const bb = AVV.battaglia(g); bb.over = { esito: 'fuga', giri: 2 }; return SC.riepilogo(bb); })() }, prova)); assert.strictEqual(rfu.s.vite, 3);
}
function CtoSC(g) { return C.battaglia(g.camp).cb; }

// ---- perdizione a 100: la campagna è persa, senza risvegli ----
{
  const m = AVV.nuova(prova, due(), 5, { avvio: false }); m.camp.perdizione = 95;
  const r = ok(AVV.act(vai(m, 'guadagni'), { t: 'racconto', a: { t: 'continua' } }, prova));
  assert.strictEqual(r.s.fine, null, 'a 98 si vive ancora');
  const m2 = AVV.nuova(prova, due(), 5, { avvio: false }); m2.camp.perdizione = 99;
  const r2 = ok(AVV.act(m2, { t: 'scena', id: 'guadagni' }, prova)); assert(r2.s.fine && !r2.s.fine.vinta && /perdizione/i.test(r2.s.fine.titolo), 'perdizione 100');
  assert.strictEqual(r2.s.vite, 3, 'e non è colpa delle vite');
}

// ---- l'ultima città si ricorda; dopo la sconfitta ci si risveglia lì ----
{
  let m = AVV.nuova(prova, due(), 9); m = chiudiScena(vai(m, 'viaggio'), prova); assert.strictEqual(m.ultimaCitta, 'rocca-pallida');
  m = chiudiScena(vai(m, 'scontro'), prova, 1); const b = AVV.battaglia(m); assert(b);
  const r = ok(AVV.act(m, { t: 'esito', riep: perdita(b) }, prova)); const l = r.s.camp.luoghi['rocca-pallida'];
  assert(r.s.camp.eroi.every((e) => e.q === l.q && e.r === l.r), 'Rocca Pallida, non Valcorvo');
  // un villaggio non è una città: dentro un villaggio l'ultima città non cambia
  const v = Object.values(m.camp.luoghi).find((q2) => q2.tipo === 'villaggio'); const k = copia(m); for (const e of k.camp.eroi) { e.q = v.q; e.r = v.r; } k.bat = null; k.racc.scena = null;
  assert.strictEqual(AVV.fase(k), 'citta', 'in un villaggio ci sono i servizi');
  const k2 = ok(AVV.act(k, { t: 'camp', a: { t: 'tira', tutti: true } }, prova)).s; assert.strictEqual(k2.ultimaCitta, 'rocca-pallida');
}

// ---- compagni: reclutare, posti, aspettare, cambiare in città, congedare ----
{
  let m = AVV.nuova(prova, due(), 21); m = chiudiScena(vai(m, 'gherardo'), prova);
  const g = m.camp.eroi.find((e) => e.compagno === 'gherardo'); assert(g, 'Gherardo è in gruppo'); assert.strictEqual(g.slot, 'c-gherardo'); assert.strictEqual(g.liv, AVV.livelloGruppo(m)); assert.strictEqual(m.camp.eroi.length, 3);
  assert(m.camp.eroi.every((e) => e.q === m.camp.party.q && e.r === m.camp.party.r), 'insieme agli altri');
  assert.strictEqual(AVV.vista(m, prova).compagni[0].stato, 'gruppo');
  m = chiudiScena(vai(m, 'mirta'), prova); assert.strictEqual(m.camp.eroi.length, 4, 'quattro posti'); assert.strictEqual(m.racc.compagni.mirta.stato, 'gruppo');
  m = chiudiScena(vai(m, 'congedo'), prova); assert(!m.camp.eroi.some((e) => e.compagno === 'gherardo'), 'se ne va'); assert.strictEqual(m.racc.compagni.gherardo.stato, 'andato');
  // con quattro eroi dell'account non c'è posto: aspettano
  let n = AVV.nuova(prova, quattro(), 22); n = chiudiScena(vai(n, 'gherardo'), prova);
  assert.strictEqual(n.camp.eroi.length, 4); assert.strictEqual(n.racc.compagni.gherardo.stato, 'attende', 'nessun posto: aspetta');
  assert(AVV.act(n, { t: 'compagnia', id: 'gherardo', azione: 'entra' }, prova).err, 'al completo non entra');
  // con tre eroi e uno che aspetta: lo scambio in città
  let t = AVV.nuova(prova, quattro().slice(0, 3), 23); t = chiudiScena(vai(t, 'gherardo'), prova); t = chiudiScena(vai(t, 'mirta'), prova);
  assert.strictEqual(t.racc.compagni.gherardo.stato, 'gruppo'); assert.strictEqual(t.racc.compagni.mirta.stato, 'attende');
  assert(AVV.act(t, { t: 'compagnia', id: 'mirta', azione: 'entra' }, prova).err, 'prima va a riposo uno');
  t = ok(AVV.act(t, { t: 'compagnia', id: 'gherardo', azione: 'attende' }, prova)).s; assert.strictEqual(t.camp.eroi.length, 3); assert.strictEqual(t.racc.compagni.gherardo.stato, 'attende');
  t = ok(AVV.act(t, { t: 'compagnia', id: 'mirta', azione: 'entra' }, prova)).s; assert(t.camp.eroi.some((e) => e.compagno === 'mirta')); assert.strictEqual(t.racc.compagni.mirta.stato, 'gruppo');
  assert(AVV.act(t, { t: 'compagnia', id: 'tizio', azione: 'entra' }, prova).err, 'compagno sconosciuto');
  // gli oggetti di chi se ne va tornano alla compagnia
  let u = AVV.nuova(prova, due(), 24); u = chiudiScena(vai(u, 'gherardo'), prova); const gi = u.camp.eroi.findIndex((e) => e.compagno === 'gherardo'); u.camp.eroi[gi].zaino.push('pozione-cura');
  const px = pozioni(u); u = chiudiScena(vai(u, 'congedo'), prova); assert.strictEqual(pozioni(u), px, 'la pozione di Gherardo resta alla compagnia');
  // parlare con un compagno: la sua scena si apre, solo se è nel gruppo
  let pa = AVV.nuova(prova, due(), 31); assert(AVV.act(pa, { t: 'parla', id: 'gherardo' }, prova).err, 'non è ancora con voi'); pa = chiudiScena(vai(pa, 'gherardo'), prova);
  assert(AVV.vista(pa, prova).compagni.find((c2) => c2.id === 'gherardo').parla, 'la vista dice che ha qualcosa da dire');
  pa = ok(AVV.act(pa, { t: 'parla', id: 'gherardo' }, prova), 'parla').s; assert.strictEqual(pa.racc.scena.id, 'gherardo-parla'); assert.strictEqual(AVV.fase(pa), 'dialogo');
}

// ---- dove la storia comanda non si entra a stanze ----
{
  let m = AVV.nuova(cap, due(), 4242); m = chiudiScena(m); const cr = m.camp.luoghi['cripta-dei-re'];
  for (const e of m.camp.eroi) { e.q = cr.q; e.r = cr.r; } m.camp.party = { q: cr.q, r: cr.r };
  const r = AVV.act(m, { t: 'camp', a: { t: 'entra', eroe: 0 } }, cap); assert(r.err && /storia/.test(r.err), r.err);
  assert(AVV.storia(cap, 'cripta-dei-re') && AVV.storia(cap, 'torre-corvi') && !AVV.storia(cap, 'cappella-pellegrino'), 'cripta e torre sono della storia, la cappella no');
  // le scene di un luogo non partono da un altro, né a gruppo diviso
  assert(AVV.act(m, { t: 'scena', id: 'udienza' }, cap).err, 'l\'udienza è a Valcorvo');
  const d = copia(m); d.camp.eroi[1].q += 1; assert(AVV.act(d, { t: 'scena', id: 'cripta-soglia' }, cap).err, 'gruppo diviso: niente scena');
}

// ---- eventi di strada: dopo un movimento in terra aperta, ripetibili, usati una volta ----
{
  let visti = new Set(), trovati = 0;
  for (let seme = 1; seme <= 60 && trovati < 6; seme++) {
    const m = AVV.nuova(prova, due(), seme, { avvio: false }); const c = m.camp;
    for (const cell of C.celleRaggio(6)) { const xc = c.celle[C.K(cell.q, cell.r)]; if (xc && !(cell.q === 0 && cell.r === 0)) { xc.t = 'pianura'; if (xc.luogo) { delete c.luoghi[xc.luogo]; xc.luogo = null; } xc.poi = null; } }
    c.mostri = []; c.mercanti = []; c.perdizione = 80;      // perdizione alta: gli incontri sono più frequenti
    let g = ok(AVV.act(m, { t: 'camp', a: { t: 'tira', tutti: true } }, prova)).s;
    const r = AVV.act(g, { t: 'camp', a: { t: 'muovi', eroe: 0, q: 3, r: 0, tutti: true } }, prova); if (r.err) continue; g = r.s;
    if (g.racc.scena && /^ev-/.test(g.racc.scena.id)) {
      trovati++; visti.add(g.racc.scena.id); assert.strictEqual(AVV.fase(g), 'dialogo'); assert(g.strada.usati.includes(g.racc.scena.id.slice(3)), 'segnato come visto');
      const v = AVV.vista(g, prova).racconto; assert(v && v.testo && v.scelte.length >= 2, 'la scena dell\'evento si vede');
      let n = 0; while (g.racc.scena && !g.bat && n++ < 10) { const w3 = AVV.vista(g, prova).racconto; const rr = AVV.act(g, { t: 'racconto', a: w3.scelte.length ? { t: 'scegli', i: w3.scelte.find((q2) => q2.ok).i } : { t: 'continua' } }, prova); assert(rr.s, rr.err); g = rr.s; }
      assert(!g.racc.scena || g.bat, 'l\'evento finisce');
    }
  }
  assert(trovati >= 3, 'gli eventi di strada escono: ' + trovati); assert(visti.size >= 2, 'e sono vari');
}

// ---- chiusura della sessione: riepilogo, cantare successivo ----
{
  let m = AVV.nuova(cap, due(), 4242); m = chiudiScena(m);
  m = chiudiScena(vai(m, 'udienza', cap), cap, 80);
  m.camp.oro += 10; m.camp.eroi[0].xp += 40;
  if (AVV.fase(m) !== 'citta' && AVV.fase(m) !== 'mappa') m = chiudiScena(m, cap, 200);
  const r = ok(AVV.act(m, { t: 'chiudi' }, cap), 'chiudi'); assert.strictEqual(r.riepilogo.sessione, 1); assert(r.riepilogo.oro >= 10); assert.strictEqual(r.riepilogo.xp.e1, m.camp.eroi[0].xp - (m.sessione.da.xp.e1 | 0));
  assert.strictEqual(r.s.racc.sessioni, 1); assert.strictEqual(r.s.sessione.battaglie, 0); assert.strictEqual(r.s.sessione.da.oro, r.s.camp.oro);
  assert(r.riepilogo.cantare && /Secondo cantare/.test(r.riepilogo.cantare.titolo), 'il racconto passa al secondo cantare: ' + (r.riepilogo.cantare && r.riepilogo.cantare.titolo));
  const r2 = ok(AVV.act(r.s, { t: 'chiudi' }, cap)); assert.strictEqual(r2.riepilogo.sessione, 2); assert.strictEqual(r2.riepilogo.oro, 0, 'sessione vuota');
}

// ---- finale: un esito «finale-…» chiude il capitolo, con il suo titolo e i compagni che restano ----
{
  let m = AVV.nuova(prova, due(), 33); m = chiudiScena(vai(m, 'mirta'), prova);
  const r = ok(AVV.act(vai(m, 'finale'), { t: 'racconto', a: { t: 'continua' } }, prova), 'finale'); const f = r.s.fine;
  assert(f && f.vinta && f.esito === 'finale-a-luminoso' && f.titolo === 'Una fine luminosa' && f.testo === 'Tutto è bene.', JSON.stringify(f));
  assert.deepStrictEqual(f.sbloccati, ['mirta'], 'i compagni sbloccati'); assert.strictEqual(f.monete, 30); assert.strictEqual(AVV.fase(r.s), 'fine'); assert.strictEqual(r.cambio.a, 'fine');
  assert(AVV.act(r.s, { t: 'camp', a: { t: 'tira', tutti: true } }, prova).err);
  // un esito qualsiasi (non «finale-…») non chiude niente
}

// ---- salvataggio, ripresa e migrazione ----
{
  let m = AVV.nuova(cap, due(), 4242); m = chiudiScena(m); m = chiudiScena(vai(m, 'udienza', cap), cap, 80);
  const sal = AVV.salva(m); assert.strictEqual(sal.cap, 'corona'); assert.strictEqual(sal.vite, 3); assert(sal.eroi.length === 2 && sal.eroi[0].nome === 'Aldo'); assert.strictEqual(typeof sal.dati, 'string');
  const ap = AVV.apri(sal); assert.deepStrictEqual(ap.s, AVV.migra(m), 'si riapre identico'); assert.deepStrictEqual(AVV.apri(JSON.stringify(m)).s, AVV.migra(m), 'anche da testo');
  const r1 = AVV.act(ap.s, { t: 'chiudi' }, cap), r2 = AVV.act(m, { t: 'chiudi' }, cap); assert.strictEqual(JSON.stringify(r1), JSON.stringify(r2), 'si riprende da dove si era');
  assert(AVV.apri('{').err && AVV.apri({ dati: '{"g":"campagna"}' }).err, 'dati illeggibili o di un altro gioco');
  const nuovo = copia(m); nuovo.v = 99; assert(AVV.apri({ dati: JSON.stringify(nuovo) }).err, 'più nuovo di noi: non lo tocco');
  // uno stato antico, senza i campi arrivati dopo, si porta alla versione corrente
  const vecchio = copia(m); delete vecchio.strada; delete vecchio.sessione; delete vecchio.viteMax; const mig = AVV.apri({ dati: JSON.stringify(vecchio) }).s;
  assert(mig.strada && mig.sessione && mig.viteMax === 3 && mig.v === AVV.VERSIONE, 'migrata'); assert(AVV.act(mig, { t: 'chiudi' }, cap).s || AVV.fase(mig) !== 'citta', 'e si gioca');
}

// ---- stessa partita, stesse scelte, stesso risultato; due semi, due mondi ----
{
  const gioca = (seme) => { let m = AVV.nuova(prova, due(), seme); for (const id of ['guadagni', 'esperienza', 'perdite']) m = chiudiScena(vai(m, id), prova); m = chiudiScena(vai(m, 'scontro'), prova, 1); const f = IA.partita(AVV.battaglia(m), { eroi: 'eroica', nemici: 'normale' }); m = ok(AVV.act(m, { t: 'esito', riep: SC.riepilogo(f) }, prova)).s; return chiudiScena(m, prova); };
  assert.strictEqual(JSON.stringify(gioca(5)), JSON.stringify(gioca(5)), 'ripetibile'); assert.notStrictEqual(JSON.stringify(gioca(5)), JSON.stringify(gioca(6)), 'semi diversi');
}

// ---- l'orchestratore non lancia mai i dadi da solo ----
const sorgente = fs.readFileSync(path.join(__dirname, '../src/js/motori/28a-avv-orchestratore.js'), 'utf8');
assert(!/Math\.random|Date\.now/.test(sorgente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'niente Math.random né Date.now nel motore');
assert(!/\b(Catan|Dungeons|Pathfinder)\b/i.test(sorgente + JSON.stringify(prova)), 'niente marchi');

// ---- le regole di Firestore per i salvataggi accettano quello che AVV.salva scrive (stessi campi, stesse fasi, stessi posti) ----
{
  const regole = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
  const blocco = regole.slice(regole.indexOf('function avventuraOk'), regole.indexOf('match /players/{uid} {'));
  const campi = [...blocco.match(/hasOnly\(\[([^\]]*)\]/)[1].matchAll(/'(\w+)'/g)].map((x) => x[1]);
  const fasi = [...blocco.match(/d\.fase in \[([^\]]*)\]/)[1].matchAll(/'(\w+)'/g)].map((x) => x[1]);
  assert.deepStrictEqual(fasi, AVV.FASI, 'le fasi delle regole sono quelle di AVV.FASI');
  const m = AVV.nuova(cap, [{ ...eroeLiv('guerriero', 1), slot: 'e1' }], 3), sal = AVV.salva(m);
  assert.deepStrictEqual(Object.keys(sal).sort(), campi.filter((c) => c !== 'agg').sort(), 'i campi di AVV.salva sono quelli che le regole ammettono (agg lo aggiunge FB)');
  assert(sal.vite <= 9 && sal.viteMax <= 9 && sal.dati.length <= 900000 && sal.eroi.length <= 4 && sal.cap.length <= 40, 'dentro i limiti numerici delle regole');
  assert(/a in \['a1', 'a2', 'a3'\]/.test(blocco + regole.slice(regole.indexOf('match /players/{uid}/avventure'), regole.indexOf('match /players/{uid}/avventure') + 400)), 'tre posti: a1, a2, a3');
  const fin = copia(m); fin.fine = { esito: 'finale-a-luminoso', vinta: true, titolo: 'x', testo: 'y', sbloccati: [], monete: 30, vite: 3, giorni: 4 };
  assert(AVV.salva(fin).fine.length <= 60, 'l\'esito di fine sta nel limite delle regole');
  assert(cap.finali && Object.keys(cap.finali).every((k) => k.length <= 60), 'ogni esito di fine del capitolo sta in 60 caratteri');
}

console.log('OK test_avv_orchestratore');
