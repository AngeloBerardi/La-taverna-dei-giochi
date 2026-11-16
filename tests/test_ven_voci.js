// Compagnia di ventura, dialoghi (V6b): scene a scelte che cambiano gradimento, oro e incarichi; incarichi personali; la rivale a tappe.
// Niente dadi: le scene sono un conto sui fatti del mondo. (La prova lunga con il bot accorto è test_ven_voci_bot.js.)
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js', '27a-avv-dadi.js', '27p-avv-compagni.js', '27q-avv-racconto.js', '28j-ven-dati.js', '28ja-ven-voci.js', '28k-ven-mondo.js', '28l-ven-campo.js', '28m-ven-stanza.js'];
// un solo contesto: le prove che aggiungono o tolgono scene a VVOC le vedono anche il mondo e la stanza
const X = carica.multi(F, '({ VEN, VDAT, ARAC, VVOC, VST })'), V = X.VEN, D = X.VDAT, R = X.ARAC, VV = X.VVOC, S = X.VST;
const J = x => JSON.stringify(x), copia = x => JSON.parse(J(x));
const ok = r => { assert(!r.err, r.err); return r; };
const assolda = (s, id, g) => { const tu = V.TU(s); tu.tr.push({ t: id, n: 1, f: 0, xp: 0 }); s.compagni[id] = -1; s.grad[id] = { g: g == null ? D.GRAD.INIZIO : g, avv: 0, visto: [] }; };
const quieto = s => { s.tregua = 1e9; s.dentro = -1; s.davanti = -1; return s; };
// porta il mondo al giorno `g` (il giorno nuovo scatta al passo successivo) e fa un passo
const aGiorno = (s, g) => { s.t = g * V.P.GIORNO - 1; V.passo(s, 1); };
// risponde alla scena aperta con la scelta `i` (o continua)
const rispondi = (s, i) => { const v = V.voce(s); assert(v, 'nessuna scena aperta'); return ok(V.parla(s, v.continua ? { t: 'continua' } : { t: 'scegli', i })); };
const apriCoda = s => { V.passo(s, 1); return V.voce(s); };
// risponde con `i` alla prima domanda e poi continua fino alla fine della scena
const chiudi = (s, i) => { let n = 0; while (V.voce(s) && n++ < 10) rispondi(s, n === 1 ? (i || 0) : 0); assert(!V.voce(s), 'la scena si chiude'); };

// i dati e il capitolo
{
  assert.strictEqual(J(R.valida(VV)), '[]', 'il capitolo delle voci è valido (ogni nodo si raggiunge, nessun vicolo cieco)');
  assert.strictEqual(J(D.VOLPE.GIORNI), '[12,40,80]');
  // V6c blocco 1: la Volpe, Berta, Lapo, Ghino hanno tutte le loro scene; misure dei testi (nodo ≤ 280 lettere, 3–6 nodi; l'addio è breve)
  const B1 = ['berta', 'lapo', 'ghino'];
  for (const k of B1.flatMap(c => [c + '-lamento', c + '-addio', c + '-inc-1', c + '-inc-2', c + '-inc-3']).concat(['volpe-1', 'volpe-2', 'volpe-3'])) {
    const sc = VV.scene[k]; assert(sc, 'manca la scena ' + k); const n = Object.keys(sc.nodi).length;
    assert(/-addio$/.test(k) ? n <= 3 : n >= 3 && n <= 6, k + ': ' + n + ' nodi');
    for (const nd of Object.values(sc.nodi)) { assert(nd.testo.length <= 280, k + ': nodo di ' + nd.testo.length + ' lettere'); for (const c of nd.scelte || []) assert(c.t.length <= 80, k + ': scelta lunga'); }
  }
  for (const id of Object.keys(VV.scene)) for (const nd of Object.values(VV.scene[id].nodi)) assert(nd.testo.length <= 280, id + ': nodo oltre 280 lettere');
  for (const c of B1) { const x = D.COMPAGNI.find(y => y.id === 'co_' + c); assert(x.inc && x.inc.length === 3 && x.premio, c + ': incarico e premio'); if (x.premio.ogg) assert(D.OGG[x.premio.ogg] && D.OGG[x.premio.ogg].q === 4, c + ': premio unico'); }
  const premi = D.COMPAGNI.filter(c => c.premio).map(c => J(c.premio)).filter(p => p !== '{"abil":1}'); assert.strictEqual(new Set(premi).size, premi.length, 'oggetti in premio tutti diversi');
  for (const id of Object.keys(VV.scene)) assert(/^[a-z0-9-]+$/.test(id), id);
  assert(!VV.dove && Object.values(VV.scene).every(sc => !sc.dove), 'le scene non hanno «dove»: le avvia il mondo');
  assert(D.COMPAGNI.find(c => c.id === 'co_berta').inc.length === 3 && D.COMPAGNI.find(c => c.id === 'co_berta').premio.abil === 1 && D.COMPAGNI.find(c => c.id === 'co_lapo').premio.abil === 1);
  // ogni effetto `ven` ha un k noto; nessun testo nei motori (tutti i testi vengono da VVOC)
  const eff = [];
  for (const sc of Object.values(VV.scene)) for (const n of Object.values(sc.nodi)) { for (const e of n.effetti || []) eff.push(e); for (const c of n.scelte || []) for (const e of c.effetti || []) eff.push(e); }
  for (const e of eff.filter(e => e.t === 'ven')) assert(V.EFF_VOCI.includes(e.k), 'effetto ven sconosciuto: ' + e.k);
  assert(R.valida(Object.assign({}, VV, { scene: { x: { inizio: 'a', nodi: { a: { testo: 'x', effetti: [{ t: 'ven' }], fine: true } } } }, ingressi: ['x'] })).some(m => /"ven" vuole k/.test(m)), '«ven» senza k è un errore di validazione');
  assert.strictEqual(V.parla(V.nuovo(1), { t: 'continua' }).err, 'Nessuno ti sta parlando');
}

// il percorso di tutte le scelte di ogni scena, in profondità: nessun errore, ogni scena si chiude
{
  let percorsi = 0;
  const visita = (s, prof) => {
    assert(prof < 12, 'scena troppo lunga');
    const v = V.voce(s); if (!v) { percorsi++; return; }
    if (v.continua) { const t = copia(s); ok(V.parla(t, { t: 'continua' })); visita(t, prof + 1); return; }
    const aperte = v.scelte.filter(c => c.ok); assert(aperte.length, 'scena senza scelte disponibili: ' + v.scena + '/' + v.nodo);
    for (const c of aperte) { const t = copia(s); ok(V.parla(t, { t: 'scegli', i: c.i })); visita(t, prof + 1); }
  };
  // ogni combinazione di bandiere che apre un ramo (patto, odio, sfida, debito, promesse), con i tre compagni del blocco 1 in compagnia
  const combo = [{}, { 'volpe-patto': 1 }, { 'volpe-odio': 1 }, { 'volpe-sfida': 1 }, { 'volpe-debito': 1 }, { 'volpe-patto': 1, 'volpe-debito': 1 }, { 'berta-promessa': 1, 'lapo-promessa': 1, 'ghino-promessa': 1 }];
  for (const fl of combo) for (const id of Object.keys(VV.scene)) {
    const s = quieto(V.nuovo(5)); for (const c of ['co_berta', 'co_lapo', 'co_ghino']) assolda(s, c); Object.assign(s.rac.bandiere, fl); V.TU(s).oro = 500; s.volpe.tappa = 0;
    assert(V.accoda(s, id), 'accoda ' + id); const v = apriCoda(s); assert(v && v.scena === id, 'si apre ' + id);
    visita(s, 0);
  }
  assert(percorsi > 20, 'tanti percorsi: ' + percorsi);
}

// una scena aperta ferma il tempo e blocca gli ordini; le scelte con prezzo mostrano «40 monete»; sceglie con l'oro che c'è
{
  const s = quieto(V.nuovo(6)); assolda(s, 'co_berta', 30); const tu = V.TU(s); tu.oro = 100; V.accoda(s, 'berta-lamento');
  const t0 = s.t; const v = apriCoda(s); assert(v && v.scena === 'berta-lamento' && s.t === t0, 'la scena parte e il tempo non passa');
  assert.strictEqual(v.chi.nome, 'Berta la Rossa'); assert.strictEqual(v.scelte.length, 3); assert.strictEqual(v.scelte[1].etichetta, '80 monete');
  V.passo(s, 50); assert.strictEqual(s.t, t0, 'con la scena aperta il tempo non scorre');
  for (const x of [V.ordina(s, { t: 'aspetta', ore: 1 }), V.fai(s, { a: 'riposa', seat: 0 }), V.scegli(s, 'lascia')]) assert.strictEqual(x.err, 'Prima rispondi');
  assert(V.parla(s, { t: 'scegli', i: 9 }).err, 'scelta non valida'); assert(V.parla(s, { t: 'balla' }).err);
  rispondi(s, 1); assert.strictEqual(tu.oro, 20); assert.strictEqual(s.grad.co_berta.g, 42); assert(V.voce(s).continua, 'la risposta di Berta'); rispondi(s, 0); assert(!V.voce(s) && !s.rac.scena, 'la scena si chiude');
  // la promessa resta nelle bandiere: se poi se ne va, il suo addio è più duro
  const p = quieto(V.nuovo(6)); assolda(p, 'co_berta'); V.accoda(p, 'berta-lamento'); apriCoda(p); chiudi(p, 0); assert(p.rac.bandiere['berta-promessa']); assert.strictEqual(p.grad.co_berta.g, D.GRAD.INIZIO + 8);
  V.accoda(p, 'berta-addio'); const ad = apriCoda(p); assert.strictEqual(ad.scelte.length, 1); rispondi(p, ad.scelte[0].i); assert(/promesso/.test(V.voce(p).testo)); rispondi(p, 0);
  V.passo(s, 5); assert(s.t > t0, 'il tempo riparte');
  // con poco oro la scelta a pagamento non c'è
  const u = quieto(V.nuovo(6)); assolda(u, 'co_berta'); V.TU(u).oro = 10; V.accoda(u, 'berta-lamento'); assert.strictEqual(apriCoda(u).scelte.filter(c => c.ok).length, 2);
  assert(V.parla(u, { t: 'scegli', i: 1 }).err, 'senza monete: non disponibile');
  // «la porta è là»: -8 di gradimento
  chiudi(u, 2); assert.strictEqual(u.grad.co_berta.g, D.GRAD.INIZIO - 4);
  // gli effetti `via` e `premio` su un compagno: se ne va con la sua scena d'addio; il premio si dà una volta (scena di prova aggiunta al capitolo)
  VV.scene['berta-prova'] = { inizio: 'a', nodi: { a: { chi: 'co_berta', testo: 'x', scelte: [
    { t: 'premio', effetti: [{ t: 'ven', k: 'premio', id: 'co_berta' }], fine: true }, { t: 'via', effetti: [{ t: 'ven', k: 'via', id: 'co_berta' }], fine: true }] } } };
  const w = quieto(V.nuovo(6)); assolda(w, 'co_berta'); const base = V.abil(w, 'prodezza'); V.accoda(w, 'berta-prova'); apriCoda(w); rispondi(w, 0);
  assert.strictEqual(w.grad.co_berta.prem, 1); assert.strictEqual(V.abil(w, 'prodezza'), base + 1);
  V.accoda(w, 'berta-prova'); apriCoda(w); rispondi(w, 0); assert.strictEqual(V.abil(w, 'prodezza'), base + 1, 'il premio una volta sola');
  V.accoda(w, 'berta-prova'); apriCoda(w); rispondi(w, 1); assert(!V.TU(w).tr.some(e => e.t === 'co_berta' && e.n > 0), 'via: se ne va'); assert(w.voci.some(x => x.id === 'berta-addio'), 'con la sua scena d\'addio');
  delete VV.scene['berta-prova'];
  // coda piena: accoda risponde no e non si perde il fatto (l'invito resta da fare)
  const q = quieto(V.nuovo(6)); assolda(q, 'co_berta', 80); for (let i = 0; i < 12; i++) q.voci.push({ id: 'volpe-1' }); assert.strictEqual(V.accoda(q, 'berta-lamento'), false);
  aGiorno(q, 3); assert(!q.grad.co_berta.invito, 'invito non segnato se la coda è piena'); q.voci.length = 0; q.rac.scena = null; aGiorno(q, 4); assert(q.grad.co_berta.invito && q.voci[0].id === 'berta-inc-1');
}

// scena assente (un lamento non ancora scritto, o tolto per la prova): nessun blocco, resta la riga di cronaca di V6a; il lamento di Berta invece parte
{
  const senza = D.COMPAGNI.find(c => !VV.scene[c.id.slice(3) + '-lamento']) || D.COMPAGNI.find(c => c.id === 'co_isa'), tolta = VV.scene[senza.id.slice(3) + '-lamento'];
  delete VV.scene[senza.id.slice(3) + '-lamento'];
  const s = quieto(V.nuovo(7)); assolda(s, senza.id, 20); aGiorno(s, 3);
  assert(s.log.some(r => r.tx.includes(senza.nome + ' vuole parlarti')), 'riga di cronaca'); assert.strictEqual(s.voci.length, 0); assert(!s.rac.scena);
  const t0 = s.t; V.ordina(s, { t: 'aspetta', ore: 2 }); V.passo(s, 30); assert(s.t > t0, 'nessun blocco');
  if (tolta) VV.scene[senza.id.slice(3) + '-lamento'] = tolta;
  const b = quieto(V.nuovo(7)); assolda(b, 'co_berta', 20); aGiorno(b, 3); assert.strictEqual(b.voci[0].id, 'berta-lamento');
  // se se ne va (gradimento troppo basso) la scena d'addio si accoda prima di togliere il compagno
  const c = quieto(V.nuovo(7)); assolda(c, 'co_berta', 5); aGiorno(c, 3); assert(!V.TU(c).tr.some(e => e.t === 'co_berta' && e.n > 0), 'Berta è partita');
  assert(c.voci.some(x => x.id === 'berta-addio'), 'addio in coda'); assert.strictEqual(apriCoda(c).chi.nome, 'Berta la Rossa');
}

// incarichi: Berta a gradimento 75 apre berta-inc-1; compiuti i tre passi il talento sale di uno
{
  const s = quieto(V.nuovo(8)); assolda(s, 'co_berta', 74); const base = V.abil(s, 'prodezza'), tu = V.TU(s); tu.oro = 5000; tu.merci.grano = 200;
  aGiorno(s, 3); assert.strictEqual(s.voci.length, 0, 'sotto la soglia nessun invito'); s.grad.co_berta.g = 75; aGiorno(s, 4);
  assert.strictEqual(s.voci[0].id, 'berta-inc-1'); assert.strictEqual(apriCoda(s).scena, 'berta-inc-1'); chiudi(s, 0);
  assert.strictEqual(s.grad.co_berta.incA, 1, 'passo aperto'); aGiorno(s, 5); assert.strictEqual(s.voci.length, 0, 'un solo invito');
  // passo 1: entrare in una città di Valdoro
  const roccadoro = s.l.find(l => l.tipo === 'citta' && l.faz === 'val'); s.davanti = -1; s.dentro = -1;
  tu.x = roccadoro.x - 2; tu.y = roccadoro.y; ok(V.ordina(s, { t: 'entra', lid: roccadoro.id })); let g = 0; while (s.dentro < 0 && g++ < 400) V.passo(s, 1);
  assert.strictEqual(s.dentro, roccadoro.id); assert.strictEqual(s.grad.co_berta.inc, 1); assert.strictEqual(s.grad.co_berta.incA, 0); assert(s.voci.some(x => x.id === 'berta-inc-2'));
  ok(V.fai(s, { a: 'esci', seat: 0 })); assert.strictEqual(apriCoda(s).scena, 'berta-inc-2'); chiudi(s, 0); assert.strictEqual(s.grad.co_berta.incA, 2);
  // passo 2: battere in campo un signore di Valdoro (il suo seguito è ridotto a un uomo)
  const sg = s.p.find(p => p.k === 'sig' && p.faz === 'val'); sg.tr.length = 0; sg.tr.push({ t: 'val_f1', n: 1, f: 0, xp: 0 }); sg.x = tu.x + 1; sg.y = tu.y; sg.dentro = -1;
  s.incontro = { tipo: 'nemico', pid: [sg.id], all: [], da: 'tu' }; const e = V.auto(s); assert(!e.err, e.err); assert.strictEqual(e.out.vince, 'a');
  assert.strictEqual(s.grad.co_berta.inc, 2); assert(s.voci.some(x => x.id === 'berta-inc-3'), 'invito al terzo passo'); assert.strictEqual(V.abil(s, 'prodezza'), base, 'ancora nessun premio');
  assert.strictEqual(apriCoda(s).scena, 'berta-inc-3'); chiudi(s, 0); assert(s.rac.bandiere['berta-giustizia'], 'il finale scelto resta nelle bandiere'); assert.strictEqual(s.grad.co_berta.incA, 3);
  // passo 3: ripulire un covo
  const covo = s.l.find(l => l.tipo === 'covo'); covo.g = [{ t: 'pre_f1', n: 1, f: 0, xp: 0 }]; tu.x = covo.x; tu.y = covo.y;
  s.davanti = covo.id; s.incontro = { tipo: 'assalto', lid: covo.id }; const f = V.auto(s); assert(!f.err, f.err); assert.strictEqual(f.out.vince, 'a');
  assert.strictEqual(s.grad.co_berta.inc, 3); assert.strictEqual(V.abil(s, 'prodezza'), base + 1, 'il talento sale di uno'); assert(s.grad.co_berta.prem);
  assert(!s.voci.some(x => /berta-inc-4/.test(x.id)), 'dopo il terzo non c\'è un altro invito'); assert(s.log.some(r => /ti ripaga/.test(r.tx)));
  // il premio si dà una volta sola e un salvataggio lo ricorda
  const s2 = V.apri(V.salva(s)); assert.strictEqual(V.abil(s2, 'prodezza'), base + 1);
}

// incarico con consegna (Lapo): le monete si lasciano entrando in un monastero, non altrove; i fatti non restano nelle bandiere salvate
{
  const s = quieto(V.nuovo(8)); assolda(s, 'co_lapo', 80); const tu = V.TU(s); tu.oro = 500; const gr = s.grad.co_lapo; gr.inc = 1; gr.incA = 2;
  const altro = s.l.find(l => l.tipo === 'villaggio' && l.faz === 'val'); tu.x = altro.x - 2; tu.y = altro.y; ok(V.ordina(s, { t: 'entra', lid: altro.id })); let g = 0; while (s.dentro < 0 && g++ < 600) V.passo(s, 1);
  assert.strictEqual(s.dentro, altro.id); assert.strictEqual(tu.oro, 500, 'in un villaggio non si consegna nulla'); assert.strictEqual(gr.inc, 1); ok(V.fai(s, { a: 'esci', seat: 0 }));
  const mon = s.l.find(l => l.tipo === 'monastero'); tu.x = mon.x - 2; tu.y = mon.y; ok(V.ordina(s, { t: 'entra', lid: mon.id })); g = 0; while (s.dentro < 0 && g++ < 600) V.passo(s, 1);
  assert.strictEqual(s.dentro, mon.id); assert.strictEqual(tu.oro, 380, '120 monete lasciate al monastero'); assert.strictEqual(gr.inc, 2); assert(s.voci.some(x => x.id === 'lapo-inc-3'), 'invito al terzo passo');
  const raw = JSON.parse(V.salva(s)); assert(!('grad-berta' in raw.rac.bandiere) && !('fama' in raw.rac.bandiere), 'i fatti non si salvano nelle bandiere');
}

// la rivale a tappe: ai giorni 12, 40, 80 compare accanto alla compagnia; le scene si chiudono con `tappa`; il dono si dà una volta sola
{
  const s = quieto(V.nuovo(9)); const tu = V.TU(s), rv = s.p.find(p => p.k === 'riv');
  aGiorno(s, 5); assert.strictEqual(s.voci.length, 0); aGiorno(s, 12); assert.strictEqual(s.volpe.coda, 1); assert.strictEqual(s.voci[0].id, 'volpe-1');
  assert(V.dist(rv, tu) < 3, 'la Volpe è accanto a noi'); assert(rv.fermo > s.t, 'e non attacca subito');
  assert.strictEqual(apriCoda(s).chi.nome, 'La Volpe Rossa'); rispondi(s, 0); rispondi(s, 0);
  assert(!s.rac.scena && s.rac.bandiere['volpe-patto']); assert.strictEqual(s.volpe.tappa, 1); assert.strictEqual(s.volpe.coda, 0); aGiorno(s, 13); assert.strictEqual(s.voci.length, 0, 'la prossima tappa è al giorno 40');
  aGiorno(s, 40); assert.strictEqual(s.voci[0].id, 'volpe-2'); apriCoda(s); const v2 = V.voce(s); assert(v2.scelte[0].i === 0 && v2.scelte.every(c => c.i !== 1), 'col patto: c\'è la scelta del patto e non quella di chi non ce l\'ha'); const oro0 = tu.oro; rispondi(s, 0); rispondi(s, 0); assert.strictEqual(tu.oro, oro0 + 80); assert.strictEqual(s.volpe.tappa, 2);
  aGiorno(s, 80); assert.strictEqual(s.voci[0].id, 'volpe-3'); apriCoda(s); const z = () => tu.zaino.filter(x => x === D.RIVALE.premio).length + V.capi(s).reduce((a, c) => a + Object.values(c.eq).filter(x => x === D.RIVALE.premio).length, 0);
  assert.strictEqual(z(), 0); rispondi(s, 2); rispondi(s, 0); assert.strictEqual(s.volpe.tappa, 3); assert.strictEqual(z(), 1, 'dono');
  // se poi la batti davvero il dono non si ripete
  rv.tr.length = 0; rv.tr.push({ t: 'mer_f3', n: 1, f: 0, xp: 0 }); rv.x = tu.x + 1; rv.y = tu.y; s.incontro = { tipo: 'nemico', pid: [rv.id], all: [], da: 'tu' }; assert(!V.auto(s).err); assert.strictEqual(z(), 1, 'un solo cimelio');
  aGiorno(s, 90); assert.strictEqual(s.voci.length, 0, 'finite le tappe');
  // scontro: l'ultima scena può finire in battaglia
  const t = quieto(V.nuovo(9)); t.volpe.tappa = 2; aGiorno(t, 80); apriCoda(t); rispondi(t, 0); rispondi(t, 0);
  assert(t.incontro && t.incontro.tipo === 'nemico' && t.incontro.pid[0] === t.p.find(p => p.k === 'riv').id, 'lo scontro con la rivale'); assert.strictEqual(t.volpe.tappa, 3);
  // tregua: nessun dono né battaglia
  const u = quieto(V.nuovo(9)); u.volpe.tappa = 2; aGiorno(u, 80); apriCoda(u); rispondi(u, 3); rispondi(u, 0); assert(!u.incontro && !u.volpe.dono && u.volpe.tappa === 3);
  // senza la scena (stato che non la conosce) la rivale non compare
  const w = quieto(V.nuovo(9)); const rv2 = w.p.find(p => p.k === 'riv'), px = rv2.x, sc1 = VV.scene['volpe-1']; delete VV.scene['volpe-1']; aGiorno(w, 12); VV.scene['volpe-1'] = sc1; assert.strictEqual(rv2.x, px); assert.strictEqual(w.volpe.coda | 0, 0);
}

// i signori: la confidenza che sale di livello apre la scena del loro tratto (qui una scena di prova aggiunta al capitolo)
{
  const s = quieto(V.nuovo(10)); const sg = s.sig.find(x => x.faz === 'val'), p = V.part(s, sg.pid);
  VV.scene['sig-' + sg.tratto + '-1'] = { inizio: 'a', nodi: { a: { chi: 'signore', testo: '«{signore} si fida di te, {capitano}.»', scelte: [{ t: 'Grazie.', effetti: [{ t: 'ven', k: 'conf', n: 1 }], fine: true }] } } };
  sg.mem.lib = 1; s.incontro = { tipo: 'parla', pid: [sg.pid], all: [] }; ok(V.scegli(s, 'notizie')); s.incontro = null;
  assert.strictEqual(s.voci[0].id, 'sig-' + sg.tratto + '-1'); assert.strictEqual(s.voci[0].sig, sg.id); assert.strictEqual(sg.mem.vl, 1);
  const v = apriCoda(s); assert(v.testo.includes(sg.nome) && v.testo.includes(s.cap.nome), 'segnaposto sostituiti'); assert.strictEqual(v.chi.nome, sg.nome);
  const f0 = sg.mem.fav; rispondi(s, 0); assert.strictEqual(sg.mem.fav, f0 + 1, 'conf aggiunge alla memoria del signore');
  s.incontro = { tipo: 'parla', pid: [sg.pid], all: [] }; s.incontro.detto = 1; V.scegli(s, 'lettera'); assert.strictEqual(s.voci.filter(x => x.id === 'sig-' + sg.tratto + '-1').length, 0, 'una volta per livello');
  delete VV.scene['sig-' + sg.tratto + '-1'];
}

// ripetibilità e salvataggi
{
  const gioca = () => { const s = quieto(V.nuovo(11)); assolda(s, 'co_berta', 80); aGiorno(s, 12); for (let i = 0; i < 6 && V.voce(s) || (i < 6 && (V.passo(s, 1), V.voce(s))); i++) rispondi(s, 0); return s; };
  const a = gioca(), b = gioca(); assert.strictEqual(V.salva(a), V.salva(b), 'stesso seme e stesse scelte: stesso salvataggio'); assert(a.volpe.tappa >= 1 || a.voci.length);
  // un salvataggio V6a (senza i campi dei dialoghi) si apre
  const v6a = V.nuovo(12); delete v6a.rac; delete v6a.voci; delete v6a.volpe; delete v6a.vsig; v6a.t = 50 * V.P.GIORNO;
  const o = V.apri(J(v6a)); assert(o && o.rac && Array.isArray(o.voci) && o.volpe.tappa === 2, 'tappe già passate non si rivivono'); assert.strictEqual(V.apri(V.salva(o)).volpe.tappa, 2);
  const b6 = V.nuovo(12); delete b6.rac; delete b6.voci; delete b6.volpe; delete b6.vsig; b6.rivVinta = 5; assert.strictEqual(V.apri(J(b6)).volpe.dono, 1, 'rivale già battuta: il cimelio c\'è già');
  assert(!V.voce(o)); const p = V.apri(V.salva(a)); assert.strictEqual(V.salva(p), V.salva(a), 'aprire e salvare non cambia nulla');
}

// stanza a due telefoni: la scena compare a entrambi, la risposta di uno la chiude per l'altro; il tempo non scorre finché è aperta
{
  const g = S.nuova(2, ['Angelo', 'Bea'], { seme: 13 }); const w = g.w; assolda(w, 'co_berta'); w.tregua = 1e9; V.accoda(w, 'berta-lamento');
  assert(S.scorre(g), 'con una scena in coda il tempo può scorrere (per aprirla)');
  const g1 = ok(S.act(g, { t: 'tempo', seat: 0, fino: w.t + 5 })).s; assert(V.voce(g1.w) && V.voce(g1.w).scena === 'berta-lamento'); assert(!S.scorre(g1), 'scena aperta: il tempo si ferma');
  const a = copia(g1), b = copia(g1); assert.strictEqual(J(V.voce(a.w)), J(V.voce(b.w)), 'la vedono uguale');
  assert(S.act(g1, { t: 'ordina', seat: 1, o: { t: 'aspetta', ore: 1 } }).err === 'Prima rispondi');
  const g15 = ok(S.act(g1, { t: 'parla', seat: 1, a: { t: 'scegli', i: 0 } })).s; assert(V.voce(g15.w).continua); const g2 = ok(S.act(g15, { t: 'parla', seat: 0, a: { t: 'continua' } })).s;
  assert(!V.voce(g2.w), 'chiusa'); assert.strictEqual(g2.w.grad.co_berta.g, D.GRAD.INIZIO + 8);
  assert(S.act(g2, { t: 'parla', seat: 0, a: { t: 'scegli', i: 0 } }).err, 'nessuno parla più'); assert(S.act(g1, { t: 'parla', seat: 7, a: { t: 'continua' } }).err);
}
console.log('test_ven_voci: ok');
