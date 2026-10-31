// Eventi di strada e missioni generate (A7): 30 eventi validi, scelta ripetibile per terreno/notte/perdizione, missioni giocate fino in fondo con il racconto.
const assert = require('assert');
const { eroe } = require('./avv_aiuti.js');
const R = require('../src/js/motori/27q-avv-racconto.js');
const A = require('../src/js/motori/27r-avv-eventi.js');
const M = require('../src/js/motori/27m-avv-mondo.js');
const BEST = require('../src/js/motori/27f-avv-bestiario.js');

const eroi = ['guerriero', 'mago', 'chierico', 'ladro'].map((c, i) => Object.assign(eroe(c, 3), { slot: 'e' + (i + 1) }));
const ctx = { eroi, oro: 80, perdizione: 0, giorno: 2 };

// ---- i 30 eventi ----
assert.strictEqual(A.EVENTI.length, 30); assert.strictEqual(new Set(A.EVENTI.map(e => e.id)).size, 30, 'id tutti diversi');
const TIPI_EFF = new Set(['oro', 'xp', 'pf', 'perdizione', 'razioni', 'oggetto', 'battaglia']);
for (const e of A.EVENTI) {
  const err = R.valida(A.capitolo(e)); assert.deepStrictEqual(err, [], e.id + ': ' + err.join('; '));
  assert(e.scelte.length >= 2 && e.scelte.length <= 3, e.id + ': due o tre scelte');
  assert(e.scelte.some(c => !c.prova), e.id + ': una scelta senza prova (si può sempre andare avanti)');
  assert(e.testo.length > 40 && e.testo.length < 400, e.id + ': testo di lunghezza giusta');
  const esiti = e.scelte.flatMap(c => c.prova ? [c.prova.ok, c.prova.ko] : [c.fine]);
  for (const [testo, eff] of esiti) {
    assert(testo.length > 15 && testo.length < 300, e.id + ': esito troppo corto o lungo');
    for (const x of eff) {
      assert(TIPI_EFF.has(x.t), e.id + ': effetto ' + x.t);
      if (x.t === 'oro') assert(Math.abs(x.n) <= 30, e.id + ': oro entro 30');
      if (x.t === 'xp') assert(x.n > 0 && x.n <= 20, e.id + ': esperienza entro 20');
      if (x.t === 'pf') assert(x.pct >= -.2 && x.pct <= .25, e.id + ': PF entro i limiti');
      if (x.t === 'perdizione') assert(Math.abs(x.n) <= 3, e.id + ': perdizione entro 3');
      if (x.t === 'battaglia') assert(BEST.FAMIGLIE[x.fam] && ['facile', 'medio'].includes(x.diff), e.id + ': battaglia di strada facile o media');
    }
  }
  for (const c of e.scelte) if (c.prova) assert(c.prova.cd >= 11 && c.prova.cd <= 14, e.id + ': difficoltà 11–14');
  const marchi = [/\bCatan\b/i, /\bUNO\b/, /Dungeons|Pathfinder|Baldur/i];
  for (const m of marchi) assert(!m.test(JSON.stringify(e)), e.id + ': niente nomi di marchi');
}

// ---- scelta dell'evento ----
{
  const TERRENI = ['pianura', 'strada', 'bosco', 'collina', 'palude', 'montagna'], visti = new Set();
  for (const t of TERRENI) for (const notte of [false, true]) for (const p of [0, 30, 60]) {
    const A2 = A.adatti({ terreno: t, notte, perdizione: p });
    assert(A2.length >= 8, `abbastanza eventi per ${t}${notte ? ' di notte' : ''} p=${p}: ${A2.length}`);
    for (const e of A2) { visti.add(e.id); assert(!e.tag.length || e.tag.includes(t)); assert(e.notte == null || e.notte === notte); assert(e.p == null || p >= e.p); }
  }
  assert.strictEqual(visti.size, 30, 'ogni evento può capitare da qualche parte');
  assert(A.adatti({ terreno: 'bosco', notte: false, perdizione: 0 }).every(e => e.notte !== true && e.p == null), 'di giorno e con poca perdizione niente eventi di notte o d\'ombra');
  assert(A.adatti({ terreno: 'strada', notte: true, perdizione: 0 }).some(e => e.id === 'grido-nella-notte'));
  assert(A.adatti({ terreno: 'strada', notte: false, perdizione: 60 }).some(e => e.id === 'ombra-sul-sentiero'));
  const o = { terreno: 'bosco', notte: false, perdizione: 0 };
  for (let s = 1; s <= 50; s++) assert.strictEqual(A.eventoStrada(s, o).id, A.eventoStrada(s, o).id, 'stesso seme, stesso evento');
  const usciti = new Set(); for (let s = 1; s <= 400; s++) usciti.add(A.eventoStrada(s, o).id); assert(usciti.size >= A.adatti(o).length - 1, 'a lungo vengono fuori quasi tutti: ' + usciti.size + '/' + A.adatti(o).length);
  const tutti = A.adatti(o).map(e => e.id); const quasi = tutti.slice(1);
  for (let s = 1; s <= 60; s++) assert.strictEqual(A.eventoStrada(s, Object.assign({ usati: quasi }, o)).id, tutti[0], 'gli eventi già visti non tornano finché ce ne sono altri');
  assert(tutti.includes(A.eventoStrada(1, Object.assign({ usati: tutti }, o)).id), 'finiti tutti, si ripete');
  assert(A.eventoStrada(1) !== null && A.eventoStrada(1, {}) !== null, 'senza filtri va bene qualunque');
}

// ---- ogni evento si gioca da cima a fondo, in ogni scelta e in ogni esito ----
{
  let esiti = 0;
  for (const e of A.EVENTI) {
    const cap = A.capitolo(e);
    for (let i = 0; i < e.scelte.length; i++) for (let seme = 1; seme <= 24; seme++) {
      let s = R.nuovo(cap.id, seme * 17 + i); s = R.act(s, { t: 'avvia', id: e.id }, cap, ctx).s;
      assert.strictEqual(R.vista(s, cap, ctx).scelte.length, e.scelte.length, e.id + ': tutte le scelte si vedono');
      const r = R.act(s, { t: 'scegli', i }, cap, ctx); assert(!r.err, e.id + ' ' + i + ': ' + r.err);
      const v = R.vista(r.s, cap, ctx); assert.strictEqual(v.continua, 'Chiudi', e.id + ': l\'esito si chiude'); assert(v.testo.length > 10);
      const f = R.act(r.s, { t: 'continua' }, cap, ctx); assert.strictEqual(f.esito, 'fine'); assert.strictEqual(f.s.scena, null);
      esiti++;
    }
  }
  assert(esiti >= 30 * 2 * 24);
  // un esempio completo: gli effetti della prova arrivano a chi li applica
  const e = A.EVENTI.find(x => x.id === 'tempesta'), cap = A.capitolo(e); let ok = 0, ko = 0;
  for (let seme = 1; seme <= 120; seme++) {
    let s = R.act(R.nuovo(cap.id, seme), { t: 'avvia', id: e.id }, cap, ctx).s; const r = R.act(s, { t: 'scegli', i: 0 }, cap, ctx);
    if (r.s.ultima.ok) { ok++; assert.deepStrictEqual(r.fuori, [{ t: 'xp', n: 5 }]); } else { ko++; assert.deepStrictEqual(r.fuori, [{ t: 'pf', pct: -.15 }]); }
  }
  assert(ok > 20 && ko > 5, `la prova va in tutti e due i modi (${ok}/${ko})`);
}

// ---- missioni generate ----
const mondo = seme => { const w = M.genera(seme); return { luoghi: Object.values(w.luoghi), giorno: 3, liv: 2 }; };
{
  assert.strictEqual(A.missione(1, { luoghi: [] }), null, 'senza luoghi nessuna missione'); assert.strictEqual(A.missione(1, { luoghi: [{ id: 'v', tipo: 'villaggio', nome: 'V' }] }), null, 'serve un luogo da raggiungere');
  const visti = { tipo: new Set(), comp: new Set() };
  for (let k = 1; k <= 30; k++) {
    const w = mondo(k);
    for (let s = 1; s <= 12; s++) {
      const c = A.missione(s * 31 + k, w), err = R.valida(c); assert.deepStrictEqual(err, [], `missione ${s}/${k}: ${err.join('; ')}`);
      assert.deepStrictEqual(JSON.parse(JSON.stringify(c)), JSON.parse(JSON.stringify(A.missione(s * 31 + k, w))), 'stesso seme, stessa missione');
      visti.tipo.add(c.tipo); visti.comp.add(c.complicazione);
      const luoghi = Object.fromEntries(w.luoghi.map(l => [l.id, l]));
      assert(['villaggio', 'citta'].includes(luoghi[c.origine].tipo), 'il cliente sta in un luogo sicuro'); assert(['antro', 'rovina', 'torre'].includes(luoghi[c.meta].tipo), 'la meta è un luogo da sotterraneo');
      const oro = c.ricompensa.find(x => x.t === 'oro').n; assert.strictEqual(oro, Math.round((20 + 12 * 2) * (c.complicazione === 'rivale' ? 1.5 : 1)));
      assert.strictEqual(c.entro, c.complicazione === 'scadenza' ? 7 : null, 'la scadenza è quattro giorni dopo oggi');
      assert.strictEqual(A.scaduta(c, 7), false); assert.strictEqual(A.scaduta(c, 8), c.entro != null);
      assert.strictEqual(c.scene.arrivo.dove, c.meta); assert.strictEqual(c.scene.ritorno.dove, c.origine);
      assert.deepStrictEqual(c.ingressi, ['offerta']);
    }
  }
  assert.strictEqual(visti.tipo.size, 5, 'tutti i tipi'); assert.strictEqual(visti.comp.size, 6, 'tutte le complicazioni');
  // premi più ricchi salendo di livello, e oggetti migliori dal terzo
  const w = mondo(2), a = A.missione(5, Object.assign({}, w, { liv: 1 })), b = A.missione(5, Object.assign({}, w, { liv: 6 }));
  assert(b.ricompensa.find(x => x.t === 'oro').n > a.ricompensa.find(x => x.t === 'oro').n); assert(b.ricompensa.find(x => x.t === 'xp').n > a.ricompensa.find(x => x.t === 'xp').n);
}

// ---- una missione giocata col racconto, dall'offerta al pagamento ----
{
  const w = mondo(4);
  const gioca = (c, scelte, nome) => {   // scelte: array di indici o 'c' (continua); restituisce stato finale ed effetti
    let s = R.nuovo(c.id, 99); const out = []; const passo = a => { const r = R.act(s, a, c, ctx); assert(!r.err, nome + ' ' + JSON.stringify(a) + ': ' + r.err); s = r.s; out.push(...r.fuori); return r; };
    return { s: () => s, passo, out };
  };
  const visto = new Set(); let completate = 0, rifiutate = 0;
  for (let seme = 1; seme <= 300 && completate < 60; seme++) {
    const c = A.missione(seme, w), nome = c.id + '/' + c.tipo + '/' + c.complicazione, G = gioca(c, [], nome), mid = c.missione;
    // 1. offerta: il cliente chiede, si accetta
    G.passo({ t: 'avvia', id: 'offerta' }); assert.strictEqual(R.vista(G.s(), c, ctx).chi.nome, c.cliente);
    const v = R.vista(G.s(), c, ctx); assert.strictEqual(v.scelte.length, 3);
    assert(/^Persuasione \d+%$/.test(v.scelte[1].etichetta), 'trattare mostra la probabilità');
    if (seme % 7 === 0) { G.passo({ t: 'scegli', i: 2 }); assert.strictEqual(G.passo({ t: 'continua' }).esito, 'rifiutata'); assert.strictEqual(G.s().missioni[mid], undefined, 'rifiutare non apre nulla'); rifiutate++; continue; }
    G.passo({ t: 'scegli', i: 0 }); assert.strictEqual(G.passo({ t: 'continua' }).esito, 'accettata'); assert.strictEqual(G.s().missioni[mid].stato, 'attiva');
    // 2. in giro per il mondo: la scena d'arrivo compare solo nel luogo giusto e solo a missione aperta
    assert.deepStrictEqual(R.disponibili(c, G.s(), ctx, c.meta), ['arrivo'], nome); assert.deepStrictEqual(R.disponibili(c, G.s(), ctx, 'altrove'), []);
    assert.deepStrictEqual(R.disponibili(c, G.s(), ctx, c.origine), [], 'il ritorno non c\'è ancora');
    G.passo({ t: 'avvia', id: 'arrivo' }); const prima = G.out.length;
    if (c.complicazione === 'imboscata') assert(G.out.some(f => f.t === 'battaglia' && f.fam === 'banditi' && f.diff === 'facile'), 'imboscata');
    G.passo({ t: 'continua' });
    if (R.vista(G.s(), c, ctx).scelte.length) G.passo({ t: 'scegli', i: 1 }); else G.passo({ t: 'continua' });   // indagine: «Entro»
    G.passo({ t: 'continua' });               // dal nodo dello scontro (effetto battaglia) al finale
    const bat = G.out.filter(f => f.t === 'battaglia' && f.diff !== 'facile' || (f.t === 'battaglia' && f.fam !== 'banditi')); assert(bat.length >= 1, 'c\'è la battaglia principale: ' + JSON.stringify(G.out));
    assert(G.out.every(f => f.t !== 'battaglia' || BEST.FAMIGLIE[f.fam]));
    assert.strictEqual(G.passo({ t: 'continua' }).esito, 'fatto'); assert(G.s().bandiere[c.id + '-fatto']);
    if (c.complicazione === 'maledizione') assert(G.out.some(f => f.t === 'perdizione' && f.n === 3), 'maledizione');
    assert.deepStrictEqual(R.disponibili(c, G.s(), ctx, c.meta), [], 'l\'arrivo non si ripete'); assert.deepStrictEqual(R.disponibili(c, G.s(), ctx, c.origine), ['ritorno']);
    // 3. ritorno: il cliente paga (o prova a pagare meno)
    G.passo({ t: 'avvia', id: 'ritorno' }); let esito;
    if (c.complicazione === 'doppiogioco') { const ris = G.passo({ t: 'scegli', i: seme % 2 }); esito = G.passo({ t: 'continua' }).esito; assert.strictEqual(esito, ris.s.ultima ? (ris.s.ultima.ok ? 'pagata' : 'truffata') : 'truffata'); }
    else { G.passo({ t: 'continua' }); esito = G.passo({ t: 'continua' }).esito; }   // «Siete tornati» → il pagamento → fine
    assert(['pagata', 'truffata'].includes(esito)); assert.strictEqual(G.s().missioni[mid].stato, 'fatta');
    assert(G.out.filter(f => f.t === 'oro' && f.n > 0).length >= 1 && G.out.some(f => f.t === 'xp'), 'ricompensa: ' + nome);
    assert.deepStrictEqual(R.disponibili(c, G.s(), ctx, c.origine), [], 'ritorno una volta sola');
    assert(R.cantare(c, G.s(), ctx).apertura.length >= 1, 'il Locandiere se lo ricorda'); visto.add(c.complicazione); completate++;
  }
  assert(completate >= 60 && rifiutate >= 5, `missioni giocate ${completate}, rifiutate ${rifiutate}`); assert.strictEqual(visto.size, 6, 'giocate tutte le complicazioni');
}
console.log('OK eventi');
