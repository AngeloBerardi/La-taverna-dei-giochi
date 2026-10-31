// Avventura in compagnia (A11): posti e eroi, chi guida chi, permessi, voto sulle scelte, battaglia condivisa (film = stesso stato finale), presenza e rientro, rientro sull'account per eroe, peso dello stato.
// Il capitolo vero (corona.json) dà il mondo; un capitolo piccolo di prova ha una scena per ogni cosa da provare.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
global.EROI = require('../src/js/motori/27-eroi.js');
const E = global.EROI;
const SC = require('../src/js/motori/27i-avv-scontro.js');
const IA = require('../src/js/motori/27j-avv-ia.js');
const AVV = require('../src/js/motori/28a-avv-orchestratore.js');
const AST = require('../src/js/motori/28e-avv-stanza.js');
const cap = require('../src/avventura/corona.json');
const copia = (x) => JSON.parse(JSON.stringify(x));
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base) => E.nuovo({ nome, classe, razza, aspetto: A, base: { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8, ...base } });
const aldo = () => Object.assign(mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }), { slot: 'e1' });
const mira = () => Object.assign(mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }), { slot: 'e2' });
const tobia = () => Object.assign(mk('Tobia', 'mago', 'piccolo', { int: 15, sag: 13, des: 12 }), { slot: 'e1' });   // stesso slot di Aldo, ma su un altro account
const ok = (r, msg) => { assert(r.s, (msg || '') + ' → ' + r.err); return r; };
const no = (r, re, msg) => { assert(r.err, (msg || '') + ' → doveva essere rifiutata'); if (re) assert(re.test(r.err), (msg || '') + ' → ' + r.err); return r; };

// ---- un capitolo piccolo ----
const nodo = (testo, extra) => Object.assign({ chi: '_', testo }, extra);
const scena = (titolo, nodi, inizio) => ({ titolo, dove: ['valcorvo', 'rocca-pallida'], inizio: inizio || 'a', nodi });
const prova = {
  id: 'prova-stanza', titolo: 'Prova', mondo: cap.mondo, personaggi: {}, compagni: { gherardo: cap.compagni.gherardo }, missioni: {}, bandiere: [], ingressi: [], sommario: [],
  scene: {
    scontro: scena('Scontro', { a: nodo('Le lame escono.', { effetti: [{ t: 'battaglia', fam: 'banditi', diff: 'facile' }], vai: 'b' }), b: nodo('Dopo la battaglia.', { effetti: [{ t: 'oro', n: 5 }, { t: 'xp', n: 60 }], fine: true }) }),
    voto: scena('Un bivio', { a: nodo('Che strada?', { scelte: [{ t: 'Il ponte', effetti: [{ t: 'oro', n: 1 }], vai: 'b' }, { t: 'Il guado', effetti: [{ t: 'oro', n: 2 }], vai: 'b' }, { t: 'Il bosco', effetti: [{ t: 'oro', n: 3 }], vai: 'b' }] }), b: nodo('Si va.', { fine: true }) }),
    gherardo: scena('Gherardo', { a: nodo('Gherardo si unisce.', { effetti: [{ t: 'recluta', id: 'gherardo' }], fine: true }) }),
    lunga: scena('Due battute', { a: nodo('Prima.', { vai: 'b' }), b: nodo('Seconda.', { fine: true }) }),
  }
};
prova.finali = {};

const posti2 = () => [{ nome: 'Anna', uid: 'u1', slot: 'e1', eroe: aldo() }, { nome: 'Bruno', uid: 'u2', slot: 'e1', eroe: tobia() }];
const posti3 = () => posti2().concat([{ nome: 'Carla', uid: 'u3', slot: 'e2', eroe: mira() }]);
const nuova = (p, seme) => AST.nuova(prova, p || posti2(), seme || 4242, { avvio: false });
const mossa = (s, seat, a) => ok(AST.act(s, Object.assign({ seat }, a), prova), JSON.stringify(a)).s;
const av = (s, seat, az, extra) => ok(AST.act(s, Object.assign({ seat, t: 'av', az }, extra || {}), prova), JSON.stringify(az)).s;
const scenaDa = (s, id) => av(s, AST.host(s), { t: 'scena', id });
const continua = (s, seat) => av(s, seat == null ? 0 : seat, { t: 'racconto', a: { t: 'continua' } });

// ---- 1. nuova partita: un posto = un eroe, slot diversi, JSON puro, peso, determinismo ----
{ const s = nuova(); assert.strictEqual(s.g, 'avventura'); assert.strictEqual(s.n, 2); assert.deepStrictEqual(s.names, ['Anna', 'Bruno']); assert.strictEqual(s.sim, true);
  assert.deepStrictEqual(s.av.camp.eroi.map((e) => e.nome), ['Aldo', 'Tobia'], 'un eroe per posto, nell\'ordine dei posti');
  assert.deepStrictEqual(s.av.camp.eroi.map((e) => e.slot), ['p0', 'p1'], 'dentro la sessione gli slot non si scontrano (Aldo e Tobia erano entrambi e1)');
  assert.deepStrictEqual(s.posti.map((p) => p.slot), ['e1', 'e1'], 'ma il posto sull\'account di ciascuno si ricorda');
  assert.deepStrictEqual(s.posti.map((p) => p.eroe), [0, 1]); assert(s.posti.every((p) => p.qui));
  assert.deepStrictEqual(JSON.parse(JSON.stringify(s)), s, 'lo stato è JSON puro'); assert(JSON.stringify(s).length < 60000, 'peso ' + JSON.stringify(s).length);
  assert.deepStrictEqual(nuova(posti2(), 99), nuova(posti2(), 99), 'stessa partita, stesso stato'); assert.notDeepStrictEqual(nuova(posti2(), 99).av.camp.celle, nuova(posti2(), 100).av.camp.celle, 'un altro seme, un altro mondo');
  // ospiti sullo stesso telefono: eroe di prova per classe
  const o = AST.nuova(prova, [{ nome: 'Anna', uid: 'u1', eroe: aldo(), slot: 'e1' }, { nome: 'Ospite', ospite: true }, { nome: 'Ospite 2', ospite: true }], 7, { avvio: false });
  assert.deepStrictEqual(o.av.camp.eroi.map((e) => e.classe), ['guerriero', 'ladro', 'chierico'], 'gli ospiti hanno un eroe di prova di classe diversa'); assert.strictEqual(o.posti[1].slot, null, 'gli ospiti non hanno un posto sull\'account');
  assert.throws(() => AST.nuova(prova, [], 1), /posti/); assert.throws(() => AST.nuova(prova, [1, 2, 3, 4, 5].map((i) => ({ nome: 'x' + i })), 1), /posti/);
  // una scheda non valida non entra: si usa l'eroe di prova
  const rotto = AST.nuova(prova, [{ nome: 'Z', eroe: { nome: 'Rotto' } }], 3, { avvio: false }); assert.notStrictEqual(rotto.av.camp.eroi[0].nome, 'Rotto', 'una scheda che non torna non viene usata');
  // con l'avvio il prologo parte da solo, come in A9
  assert.strictEqual(AVV.fase(AST.nuova(cap, posti2(), 5).av), 'dialogo'); }

// ---- 2. chi guida chi ----
{ let s = nuova(posti3()); assert.strictEqual(AST.host(s), 0); assert.deepStrictEqual(AST.presenti(s), [0, 1, 2]);
  assert.deepStrictEqual([0, 1, 2].map((i) => AST.guida(s, i)), [0, 1, 2], 'ciascuno guida il proprio eroe');
  s = scenaDa(s, 'gherardo'); s = continua(s, 1); assert.strictEqual(s.av.camp.eroi.length, 4, 'Gherardo si unisce');
  assert.strictEqual(AST.guida(s, 3), 0, 'il compagno lo guida chi ospita');
  s = mossa(s, 0, { t: 'presenza', posto: 1, qui: false }); assert.strictEqual(AST.guida(s, 1), 0, 'l\'eroe di chi è uscito lo guida chi ospita'); assert.deepStrictEqual(AST.miei(s, 0), [0, 1, 3]); assert.deepStrictEqual(AST.miei(s, 2), [2]);
  s = mossa(s, 0, { t: 'presenza', posto: 0, qui: false }); assert.strictEqual(AST.host(s), 2, 'se esce chi ospita, ospita il primo presente'); assert.strictEqual(AST.guida(s, 3), 2);
  s = mossa(s, 2, { t: 'presenza', posto: 2, qui: false }); assert.strictEqual(AST.host(s), -1); assert.strictEqual(AST.guida(s, 0), -1, 'nessuno presente: nessuno guida');
  s = mossa(s, 1, { t: 'siede', posto: 1 }); assert.deepStrictEqual(AST.presenti(s), [1], 'chi rientra si siede al suo posto'); assert.strictEqual(AST.guida(s, 1), 1); }

// ---- 3. permessi sulla mappa ----
{ let s = nuova(); const tira = (seat, eroe) => AST.act(s, { seat, t: 'av', az: { t: 'camp', a: { t: 'tira', eroe } } }, prova);
  no(tira(0, 1), /tuo eroe/, 'Anna non muove Tobia'); no(tira(1, 0), /tuo eroe/, 'Bruno non muove Aldo'); no(tira(1, 7), /sconosciuto/);
  const r = ok(tira(0, 0), 'Anna tira il suo movimento'); assert(r.s.av.camp.eroi[0].pm != null, 'il movimento è tirato'); assert.strictEqual(r.s.av.camp.eroi[1].pm, null, 'quello di Tobia no');
  s = r.s; s = ok(AST.act(s, { seat: 1, t: 'av', az: { t: 'camp', a: { t: 'tira', eroe: 1 } } }, prova)).s; assert(s.av.camp.eroi[1].pm != null, 'in contemporanea tira anche Bruno');
  // di gruppo: solo chi ospita
  no(AST.act(s, { seat: 1, t: 'av', az: { t: 'camp', a: { t: 'fineTurno' } } }, prova), /chi ospita/, 'il giro lo chiude chi ospita'); no(AST.act(s, { seat: 1, t: 'av', az: { t: 'camp', a: { t: 'tira', tutti: true } } }, prova), /chi ospita/);
  ok(AST.act(s, { seat: 0, t: 'av', az: { t: 'camp', a: { t: 'fineTurno' } } }, prova), 'chi ospita chiude il giro');
  no(AST.act(s, { seat: 1, t: 'av', az: { t: 'camp', a: { t: 'entra', eroe: 1 } } }, prova), /chi ospita/, 'entrare in un sotterraneo è del gruppo, anche se porta un eroe'); no(AST.act(s, { seat: 1, t: 'av', az: { t: 'camp', a: { t: 'muovi', eroe: 1, q: 0, r: 0, tutti: true } } }, prova), /chi ospita/, 'muovere tutti è di chi ospita');
  no(AST.act(s, { seat: 1, t: 'av', az: { t: 'scena', id: 'voto' } }, prova), /chi ospita/, 'le scene le apre chi ospita'); no(AST.act(s, { seat: 1, t: 'av', az: { t: 'chiudi' } }, prova), /chi ospita/);
  no(AST.act(s, { seat: 0, t: 'av', az: { t: 'esito', riep: {} } }, prova), /da sola/, 'il risultato di una battaglia non si dà a mano'); no(AST.act(s, { seat: 0, t: 'av', az: { t: 'boh' } }, prova), /sconosciuta/);
  no(AST.act(s, { seat: 5, t: 'av', az: { t: 'camp', a: { t: 'tira', eroe: 0 } } }, prova), /Posto/); no(AST.act(s, { t: 'av', az: {} }, prova), /Posto/); no(AST.act(s, { seat: 0 }, prova), /mancante/); no(AST.act(null, { seat: 0, t: 'av' }, prova), /non valido/);
  // l'originale non cambia
  const prima = JSON.stringify(s); AST.act(s, { seat: 0, t: 'av', az: { t: 'camp', a: { t: 'fineTurno' } } }, prova); assert.strictEqual(JSON.stringify(s), prima, 'act non tocca lo stato di partenza');
  // base: la mossa vale solo sullo stato da cui è partita
  no(AST.act(s, { seat: 0, t: 'av', az: { t: 'camp', a: { t: 'fineTurno' } }, base: s.av.evn - 1 }, prova), /un attimo prima/, 'una mossa su uno stato vecchio è rifiutata');
  ok(AST.act(s, { seat: 0, t: 'av', az: { t: 'camp', a: { t: 'fineTurno' } }, base: s.av.evn }, prova), 'su quello giusto passa'); }

// ---- 3b. concludere la sessione: lo vedono tutti, finché non si fa altro ----
{ let s = nuova(posti3()); s.av.camp.eroi[0].xp += 10; no(AST.act(s, { seat: 1, t: 'av', az: { t: 'chiudi' } }, prova), /chi ospita/);
  const r = ok(AST.act(s, { seat: 0, t: 'av', az: { t: 'chiudi' } }, prova), 'chiude chi ospita'); assert(r.riepilogo, 'la risposta porta il riepilogo'); assert(r.s.riep && r.s.riep.n === r.s.evn && r.s.riep.cantare, 'e resta nello stato per gli altri telefoni');
  const dopo = ok(AST.act(r.s, { seat: 0, t: 'av', az: { t: 'camp', a: { t: 'tira', eroe: 0 } } }, prova)).s; assert.strictEqual(dopo.riep, null, 'alla mossa dopo non c\'è più'); }

// ---- 4. dialogo: «continua» a chiunque, scelte a voto ----
{ let s = nuova(posti3()); s = scenaDa(s, 'lunga'); assert.strictEqual(AVV.fase(s.av), 'dialogo');
  const b = s.av.evn; s = av(s, 1, { t: 'racconto', a: { t: 'continua' } }, { base: b }); assert.strictEqual(s.av.racc.scena.nodo, 'b', 'qualunque posto presente fa andare avanti');
  no(AST.act(s, { seat: 2, t: 'av', az: { t: 'racconto', a: { t: 'continua' } }, base: b }, prova), /un attimo prima/, 'due telefoni che toccano «Continua» insieme: il secondo non salta una battuta');
  s = nuova(posti3()); s = scenaDa(s, 'voto'); const v = AVV.vista(s.av, prova).racconto; assert.strictEqual(v.scelte.length, 3);
  no(AST.act(s, { seat: 0, t: 'av', az: { t: 'racconto', a: { t: 'scegli', i: 0 } } }, prova), /votano/, 'le scelte non si fanno a mano');
  no(AST.act(s, { seat: 0, t: 'voto', i: 9 }, prova), /non valida/); no(AST.act(nuova(posti3()), { seat: 0, t: 'voto', i: 0 }, prova), /niente da votare/);
  // maggioranza: 2 su 3 per il bosco (2)
  const oro0 = s.av.camp.oro; s = mossa(s, 0, { t: 'voto', i: 2 }); assert(s.voto && s.voto.v[0] === 2 && s.av.racc.scena.nodo === 'a', 'un voto non basta'); assert.deepStrictEqual(AST.vista(s, prova, 1).voto.mancano, [1, 2]); assert.strictEqual(AST.vista(s, prova, 0).voto.mio, 2);
  s = mossa(s, 1, { t: 'voto', i: 0 }); s = mossa(s, 1, { t: 'voto', i: 2 }); assert.strictEqual(s.voto.v[1], 2, 'si può cambiare idea prima della fine'); assert.strictEqual(s.av.racc.scena.nodo, 'a');
  s = mossa(s, 2, { t: 'voto', i: 1 }); assert.strictEqual(s.voto, null, 'votati tutti si decide'); assert.strictEqual(s.av.camp.oro, oro0 + 3, 'ha vinto il bosco (2 voti su 3)'); assert.strictEqual(s.av.racc.scena.nodo, 'b');
  // parità: vale il voto di chi ospita
  s = nuova(posti3()); s = scenaDa(s, 'voto'); s = mossa(s, 2, { t: 'voto', i: 0 }); s = mossa(s, 1, { t: 'voto', i: 1 }); s = mossa(s, 0, { t: 'voto', i: 2 }); assert.strictEqual(s.av.camp.oro, nuova(posti3()).av.camp.oro + 3, 'tre voti diversi: vince quello di chi ospita');
  s = nuova(posti2()); s = scenaDa(s, 'voto'); s = mossa(s, 1, { t: 'voto', i: 1 }); s = mossa(s, 0, { t: 'voto', i: 0 }); assert.strictEqual(s.av.camp.oro, nuova().av.camp.oro + 1, 'pari tra due: il voto di chi ospita');
  // un solo presente: vale subito; chi esce non fa aspettare
  s = nuova(posti3()); s = mossa(s, 0, { t: 'presenza', posto: 1, qui: false }); s = mossa(s, 0, { t: 'presenza', posto: 2, qui: false }); s = scenaDa(s, 'voto'); s = mossa(s, 0, { t: 'voto', i: 1 }); assert.strictEqual(s.voto, null, 'da solo la scelta vale subito'); assert.strictEqual(s.av.racc.scena.nodo, 'b');
  s = nuova(posti3()); s = scenaDa(s, 'voto'); s = mossa(s, 0, { t: 'voto', i: 1 }); s = mossa(s, 1, { t: 'voto', i: 1 }); assert(s.voto, 'manca Carla'); s = mossa(s, 0, { t: 'presenza', posto: 2, qui: false }); assert.strictEqual(s.voto, null, 'se l\'ultima che mancava esce, si decide'); assert.strictEqual(s.av.racc.scena.nodo, 'b');
  // chi ospita chiude il voto prima
  s = nuova(posti3()); s = scenaDa(s, 'voto'); s = mossa(s, 1, { t: 'voto', i: 1 }); no(AST.act(s, { seat: 1, t: 'voto', ora: true }, prova), /chi ospita/); s = mossa(s, 0, { t: 'voto', ora: true }); assert.strictEqual(s.av.racc.scena.nodo, 'b'); assert.strictEqual(s.av.camp.oro, nuova(posti3()).av.camp.oro + 2, 'conta chi ha votato');
  no(AST.act(nuova(posti3()), { seat: 0, t: 'voto', ora: true }, prova), /niente|Nessun/);
  // un voto vale solo per la scelta che si vede: andati avanti, il voto è azzerato
  s = nuova(posti3()); s = scenaDa(s, 'voto'); s = mossa(s, 1, { t: 'voto', i: 1 }); assert(s.voto); s = mossa(s, 0, { t: 'voto', ora: true }); assert.strictEqual(s.voto, null); }

// ---- 5. la battaglia condivisa ----
// un posto che gioca: l'azione la sceglie l'IA (come farebbe una persona qualunque)
function giocaPosto(s, seat) { const a = IA.prossima(s.lotta, { livello: 'normale' }); return AST.act(s, { seat, t: 'lotta', a }, prova); }
{ let s = nuova(posti3()); s = scenaDa(s, 'scontro'); assert.strictEqual(AVV.fase(s.av), 'battaglia'); assert.strictEqual(s.lotta, null, 'la battaglia comincia quando qualcuno dice «all\'armi»');
  no(AST.act(s, { seat: 0, t: 'lotta', a: { t: 'fine' } }, prova), /Nessuna battaglia/); no(AST.act(s, { seat: 0, t: 'av', az: { t: 'camp', a: { t: 'tira', eroe: 0 } } }, prova), /battaglia/, 'prima la battaglia');
  s = mossa(s, 2, { t: 'combatti' }); assert(s.lotta && !s.lotta.over, 'una battaglia in corso'); assert.strictEqual(s.lotta.opz.reazioni.eroi, 'auto', 'le reazioni si risolvono da sole'); assert(s.film && Array.isArray(s.film.azioni));
  no(AST.act(s, { seat: 0, t: 'combatti' }, prova), /già cominciata/); assert.strictEqual(s.lotta.cb.filter((c) => c.lato === 'eroi').length, 3, 'tre eroi');
  // a ogni mossa: solo chi guida l'eroe di turno; il film rigiocato dà lo stesso stato finale
  let passi = 0, volte = {};
  for (let n = 0; n < 600 && !s.lotta.over; n++) {
    const att = SC.attore(s.lotta); assert(att && att.lato === 'eroi', 'dopo ogni mossa tocca a un eroe guidato da una persona');
    const chi = AST.guidaComb(s, att); assert(chi >= 0 && AST.presenti(s).includes(chi)); volte[chi] = (volte[chi] || 0) + 1;
    const altro = AST.presenti(s).find((k) => k !== chi); if (altro != null && n < 3) no(AST.act(s, { seat: altro, t: 'lotta', a: IA.prossima(s.lotta, { livello: 'normale' }) }, prova), /Non è il tuo turno/, 'gli altri non muovono l\'eroe altrui');
    const prima = copia(s.lotta), r = ok(giocaPosto(s, chi), 'mossa di ' + chi); const film = r.s.film;
    assert.strictEqual(film.da, prima.evn, 'il film parte dallo stato di prima'); const rp = AST.rigioca(prima, film.azioni); assert(!rp.err, rp.err);
    assert.deepStrictEqual(rp.s, r.s.lotta, 'rigiocare il film dà esattamente lo stato scritto'); assert.strictEqual(rp.passi.length, film.azioni.length); assert(rp.passi.every((p) => Array.isArray(p.ev)), 'ogni passo ha i suoi eventi per l\'animazione');
    s = r.s; passi++;
  }
  assert(s.lotta.over && s.lotta.over.esito === 'vittoria', 'la compagnia vince la prima battaglia facile (' + JSON.stringify(s.lotta.over) + ')'); assert(Object.keys(volte).length >= 2, 'hanno giocato più posti: ' + JSON.stringify(volte));
  no(AST.act(s, { seat: 0, t: 'lotta', a: { t: 'fine' } }, prova), /finita/); assert.strictEqual(AVV.fase(s.av), 'battaglia', 'finché non si chiude la fase resta la battaglia (c\'è il riepilogo da guardare)');
  const xp0 = s.av.camp.eroi.map((e) => e.xp); s = mossa(s, 1, { t: 'chiudiLotta' }); assert.strictEqual(s.lotta, null); assert.strictEqual(s.film, null); assert.notStrictEqual(AVV.fase(s.av), 'battaglia', 'chiusa, si prosegue');
  no(AST.act(s, { seat: 1, t: 'chiudiLotta' }, prova), /Nessuna battaglia/); }

// ---- 6. un posto assente: il suo eroe lo gioca chi ospita (o l'IA se non c'è nessuno); il rientro lo riporta ----
{ let s = nuova(posti3()); s = scenaDa(s, 'scontro'); s = mossa(s, 0, { t: 'presenza', posto: 1, qui: false }); s = mossa(s, 2, { t: 'combatti' });
  const chiHaGiocato = new Set();
  for (let n = 0; n < 600 && !s.lotta.over; n++) { const att = SC.attore(s.lotta); assert(att.lato === 'eroi'); const chi = AST.guidaComb(s, att); assert.notStrictEqual(chi, 1, 'Bruno non c\'è: il suo eroe lo guida un altro'); chiHaGiocato.add(chi); s = ok(giocaPosto(s, chi)).s; }
  assert(s.lotta.over, 'la battaglia finisce anche senza di lui'); assert(chiHaGiocato.has(0) && chiHaGiocato.has(2), 'hanno giocato Anna (anche per Bruno) e Carla');
  // se esce proprio chi è di turno, tocca a chi ospita; se non c'è nessuno, la battaglia aspetta ferma
  let t = nuova(posti2()); t = scenaDa(t, 'scontro'); t = mossa(t, 0, { t: 'combatti' });
  const att0 = SC.attore(t.lotta), di = AST.guidaComb(t, att0), altro = 1 - di; const evn0 = t.lotta.evn;
  t = mossa(t, di, { t: 'presenza', posto: di, qui: false }); assert.strictEqual(AST.guidaComb(t, att0), altro, 'esce chi era di turno: tocca all\'altro'); assert.strictEqual(t.lotta.evn, evn0, 'nessuno ha mosso al posto suo');
  t = mossa(t, altro, { t: 'presenza', posto: altro, qui: false }); assert.strictEqual(AST.host(t), -1); assert.strictEqual(t.lotta.evn, evn0, 'senza nessuno al tavolo la battaglia aspetta ferma'); assert.strictEqual(AST.guidaComb(t, att0), -1);
  no(AST.act(t, { seat: di, t: 'lotta', a: { t: 'fine' } }, prova), /seduto/, 'chi è fuori non muove');
  t = mossa(t, di, { t: 'siede', posto: di }); assert.strictEqual(AST.guidaComb(t, att0), di, 'chi rientra riprende il suo eroe, al suo turno'); assert(!t.lotta.over && SC.attore(t.lotta).id === att0.id); ok(giocaPosto(t, di), 'e può muovere');
  // rientrare con un turno automatico di mezzo: la battaglia va avanti da sola fino a una persona
  let u = nuova(posti2()); u = scenaDa(u, 'scontro'); u = mossa(u, 0, { t: 'combatti' }); u = mossa(u, 1, { t: 'presenza', posto: 1, qui: false }); assert(AST.presenti(u).length === 1); }

// ---- 7. il rientro sull'account: ciascuno riscuote solo il proprio eroe, una volta sola ----
{ let s = nuova(posti3()); s.av.camp.eroi[0].xp += 100; s.av.camp.eroi[2].xp += 30; s.av.camp.oro += 90;
  const r0 = AST.rientro(s, 0), r1 = AST.rientro(s, 1), r2 = AST.rientro(s, 2);
  assert.strictEqual(r0.slotAccount, 'e1'); assert.strictEqual(r2.slotAccount, 'e2'); assert.strictEqual(r0.slot, 'p0'); assert.strictEqual(r0.tappa.xp, 100); assert.strictEqual(r2.tappa.xp, 30); assert.strictEqual(r1.tappa.xp, 0, 'Bruno non ha guadagnato esperienza');
  assert.strictEqual(r0.tappa.oro + r1.tappa.oro + r2.tappa.oro, 90, 'l\'oro in comune si divide tra i giocatori'); assert.strictEqual(r1.tappa.oro, 30, 'in parti uguali');
  s = AST.accredita(s, r0.tappa); assert(AST.rientro(s, 0).finito, 'Anna ha riscosso tutto'); assert(!AST.rientro(s, 2).finito, 'Carla no'); assert.strictEqual(AST.rientro(s, 2).tappa.xp, 30);
  assert.strictEqual(AST.rientro(s, 9), null); assert.deepStrictEqual(JSON.parse(JSON.stringify(s)), s);
  // un compagno non tocca mai un account
  let c = nuova(posti2()); c = scenaDa(c, 'gherardo'); c = continua(c, 0); c.av.camp.eroi[2].xp += 500; assert.strictEqual(AST.rientro(c, 0).tappa.xp, 0); assert.strictEqual(AST.rientro(c, 1).tappa.xp, 0, 'gli XP del compagno non vanno a nessuno'); }

// ---- 8. vista di un posto, salvataggio, ordine di partita ----
{ let s = nuova(posti3()); s = scenaDa(s, 'scontro'); s = mossa(s, 0, { t: 'combatti' }); const att = SC.attore(s.lotta), chi = AST.guidaComb(s, att);
  const v = AST.vista(s, prova, chi); assert(v.lotta.mioTurno && v.lotta.tocca === chi && v.lotta.attore === att.id); assert.strictEqual(AST.vista(s, prova, (chi + 1) % 3).lotta.mioTurno, false); assert.strictEqual(AST.vista(s, prova, -1).lotta.mioTurno, false, 'la TV non gioca');
  assert.strictEqual(AST.vista(s, prova, -1).miei.length, 0); assert.strictEqual(AST.vista(s, prova, 0).sonoHost, true); assert.strictEqual(AST.vista(s, prova, 1).sonoHost, false); assert.strictEqual(AST.vista(s, prova, 1).mioEroe, 1);
  const sal = AST.salva(s); assert.strictEqual(sal.posti.length, 3); assert.strictEqual(typeof sal.av.dati, 'string', 'il salvataggio è quello di AVV');
  // il peso con la battaglia
  assert(JSON.stringify(s).length < 80000, 'peso con battaglia ' + JSON.stringify(s).length); }

// ---- 9. determinismo: le stesse mosse danno lo stesso stato ----
{ const gioca = () => { let s = nuova(posti3(), 31); s = scenaDa(s, 'scontro'); s = mossa(s, 0, { t: 'combatti' }); for (let n = 0; n < 600 && !s.lotta.over; n++) s = ok(giocaPosto(s, AST.guidaComb(s, SC.attore(s.lotta)))).s; return s; };
  assert.deepStrictEqual(gioca(), gioca(), 'stessa battaglia, stesso risultato'); }

// ---- 10. il motore non lancia dadi da solo e non cita marchi ----
{ const src = fs.readFileSync(path.join(__dirname, '../src/js/motori/28e-avv-stanza.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert(!/Math\.random/.test(src), 'niente Math.random'); assert(!/catan|azul|\bUNO\b/i.test(src.replace(/\buno\b/g, '')), 'niente marchi'); }

console.log('test_avv_stanza: ok');
