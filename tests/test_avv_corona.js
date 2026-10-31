// Capitolo 1 «La Corona Spezzata» (A8): valido, senza nomi di marchi, mondo sempre collegato, ogni scena e ogni nodo raggiungibile giocando a caso, compagni a ogni livello.
const assert = require('assert');
const { eroe, copia } = require('./avv_aiuti.js');
const E = require('../src/js/motori/27-eroi.js');
const M = require('../src/js/motori/27m-avv-mondo.js');
const R = require('../src/js/motori/27q-avv-racconto.js');
const CM = require('../src/js/motori/27p-avv-compagni.js');
const cap = require('../src/avventura/corona.json');

// ---- il capitolo è valido ----
assert.strictEqual(cap.id, 'corona', 'il file si chiama come il capitolo');
assert.deepStrictEqual(R.valida(cap), [], 'il capitolo è valido');

// ---- niente nomi di marchi (repo e sito sono pubblici) ----
const marchi = [/\bCatan\b/i, /\bUNO\b/, /Dungeons|Pathfinder|Baldur|Tolkien|Hobbit|Gandalf|Skyrim|Witcher|Zelda|Warcraft|Hearthstone|Diablo/i];
const testi = JSON.stringify(cap);
for (const m of marchi) assert(!m.test(testi), 'niente nomi di marchi: ' + m);

// ---- il mondo del capitolo: sempre collegato, luoghi al loro posto, dentro la regione giusta, dalla città di Valcorvo ----
for (let seme = 1; seme <= 120; seme++) {
  const m = M.genera(seme, cap.mondo);
  assert(M.connessa(m), 'mondo collegato, seme ' + seme);
  assert.strictEqual(m.luoghi.valcorvo.tipo, 'citta'); assert(m.luoghi.valcorvo.partenza, 'Valcorvo è la partenza');
  for (const f of cap.mondo.luoghi) assert(m.luoghi[f.id] && m.celle[M.K(m.luoghi[f.id].q, m.luoghi[f.id].r)].reg === f.reg, f.id + ' nella sua regione, seme ' + seme);
  assert.strictEqual(Object.values(m.luoghi).filter(l => l.tipo === 'citta').length, 2, 'due città');
  assert.strictEqual(Object.values(m.luoghi).filter(l => l.tipo === 'antro').length, 1, 'un solo antro (la cripta)');
  assert.strictEqual(Object.values(m.luoghi).filter(l => l.tipo === 'torre').length, 1, 'una sola torre');
}

// ---- i compagni sono eroi veri a ogni livello ----
for (const id of Object.keys(cap.compagni)) for (let liv = 1; liv <= E.LIV_MAX; liv++) {
  const h = CM.scheda(cap.compagni[id], liv, id); assert(E.valida(h) !== false, id + ' liv ' + liv);
  assert(h.hp > 0 && h.hpMax >= h.hp && h.compagno === id && h.slot === 'c-' + id, id + ' scheda');
}

// ---- si gioca a caso (con un po' di curiosità): ogni scena e ogni nodo si raggiunge, ogni uscita si vede, gli esiti sono quelli attesi ----
const LUOGHI = ['valcorvo', 'casale-salici', 'cappella-pellegrino', 'accampamento-corvi', 'rocca-pallida', 'fonte-cupa', 'cripta-dei-re'];
for (const f of cap.mondo.luoghi) assert(LUOGHI.includes(f.id) || ['poggio-basso', 'altare-piogge', 'torre-corvi'].includes(f.id), 'il test conosce il luogo ' + f.id);
const rnd = (seme) => M.mulberry(seme);
const visti = new Set(), esiti = {}, bandiere = {}, compagniVisti = new Set(), battaglie = {}, oggetti = {};
const tutti = new Set(); for (const [sid, sc] of Object.entries(cap.scene)) for (const nid of Object.keys(sc.nodi)) tutti.add(sid + '/' + nid);
// dove porta una scelta (per preferire i nodi mai visti)
const destini = (sid, nodo, i) => { const c = cap.scene[sid].nodi[nodo].scelte[i], r = []; for (const d of [c.vai, c.prova && c.prova.ok.vai, c.prova && c.prova.ko.vai]) if (d) r.push(sid + '/' + d); return r; };
function gioca(seme, iniziali = visti) {
  const locali = new Set(iniziali); // la curiosità dipende dai nodi già visti all'inizio della partita: così, a parità di seme, la partita è identica
  const r = rnd(seme), pick = (a) => a[Math.floor(r() * a.length)];
  const base = ['guerriero', 'ladro', 'mago'].map((c, i) => Object.assign(eroe(c, 1 + Math.floor(r() * 6), ['umano', 'elfo', 'nano'][i]), { slot: 'e' + (i + 1) }));
  const ctx = { eroi: base.slice(), oro: pick([0, 20, 60, 200]), perdizione: 0, giorno: 1, luogo: 'valcorvo', comune: [] };
  let s = R.nuovo(cap.id, seme);
  const nota = () => { if (s.scena) { visti.add(s.scena.id + '/' + s.scena.nodo); locali.add(s.scena.id + '/' + s.scena.nodo); } };
  const applica = (fuori) => {
    for (const f of fuori || []) {
      if (f.t === 'oro') ctx.oro = Math.max(0, ctx.oro + f.n);
      if (f.t === 'perdizione') ctx.perdizione = Math.max(0, ctx.perdizione + f.n);
      if (f.t === 'battaglia') battaglie[f.capo || f.fam] = (battaglie[f.capo || f.fam] || 0) + 1;
      if (f.t === 'oggetto') { oggetti[f.id] = (oggetti[f.id] || 0) + 1; for (let k = 0; k < Math.abs(f.n || 1); k++) { if ((f.n || 1) > 0) ctx.comune.push(f.id); else { const j = ctx.comune.indexOf(f.id); if (j >= 0) ctx.comune.splice(j, 1); } } }
    }
  };
  const esegui = (id) => {
    let x = R.act(s, { t: 'avvia', id }, cap, ctx); assert(!x.err, id + ': ' + x.err); s = x.s; nota();
    for (let k = 0; k < 80; k++) {
      const v = R.vista(s, cap, ctx); if (!v) return;
      assert(typeof v.testo === 'string' && v.testo.length > 0, 'testo del nodo ' + s.scena.id + '/' + s.scena.nodo);
      let a;
      if (v.scelte && v.scelte.length) {
        const buone = v.scelte.filter(c => c.ok); assert(buone.length, 'una scelta sempre disponibile in ' + s.scena.id + '/' + s.scena.nodo);
        const nuove = buone.filter(c => destini(s.scena.id, s.scena.nodo, c.i).some(d => !locali.has(d)));
        a = { t: 'scegli', i: (nuove.length && r() < 0.75 ? pick(nuove) : pick(buone)).i };
      } else a = { t: 'continua' };
      x = R.act(s, a, cap, ctx); assert(!x.err, id + ': ' + x.err); s = x.s; applica(x.fuori);
      if (x.esito) esiti[x.esito] = (esiti[x.esito] || 0) + 1;
      nota();
    }
    assert.fail('scena che non finisce: ' + id);
  };
  esegui('notte-dei-corvi');
  for (let passo = 0; passo < 130; passo++) {
    // chi è nel gruppo ha la sua scheda e un'approvazione a caso (anche vicina alle soglie di abbandono e di fiducia)
    ctx.eroi = base.slice();
    const opzioni = [];
    for (const [cid, c] of Object.entries(s.compagni)) if (c.stato === 'gruppo') {
      s.approv[cid] = pick([-48, -38, -10, 0, 10, 25, 45, 60]); compagniVisti.add(cid);
      ctx.eroi.push(CM.scheda(cap.compagni[cid], 4, cid));
      const sc = CM.parla(s, cap, cid); if (sc) opzioni.push({ id: sc });
    }
    for (const L of LUOGHI) for (const id of R.disponibili(cap, s, Object.assign({}, ctx, { luogo: L }), L)) opzioni.push({ id, luogo: L });
    if (!opzioni.length) continue;
    const o = pick(opzioni); if (o.luogo) ctx.luogo = o.luogo;
    esegui(o.id);
  }
  for (const [b, v] of Object.entries(s.bandiere)) if (v) bandiere[b] = (bandiere[b] || 0) + 1;
  const veri = ['indizio-sigillo', 'indizio-gherardo', 'indizio-lettera'].filter(b => s.bandiere[b]).length;
  assert.strictEqual(s.bandiere.indizi | 0, veri, 'il contatore degli indizi segue le bandiere degli indizi (seme ' + seme + ')');
  return JSON.stringify(s);
}
const N = 200; let prima, vistiA7;
for (let seme = 1; seme <= N; seme++) { if (seme === 7) vistiA7 = new Set(visti); const f = gioca(seme); if (seme === 7) prima = f; }
assert.strictEqual(gioca(7, vistiA7), prima, 'a parità di seme la partita è identica');
const mancano = [...tutti].filter(x => !visti.has(x));
assert.deepStrictEqual(mancano, [], 'nodi mai raggiunti in ' + N + ' partite: ' + mancano.join(', '));
const attese = ['atto2', 'cerchio-preso', 'corvino-sconfitto', 'corvino-parlato', 'casale-liberato', 'mirta-risparmiata', 'mirta-consegnata', 'mirta-lasciata', 'gherardo-libero', 'gherardo-evaso', 'gherardo-graziato', 'indizio-sigillo', 'indizio-gherardo', 'rapporto-fatto', 'reggente-rispetta', 'reggente-offesa',
  'rocca-arrivata', 'fonte-visitata', 'rito-appreso', 'sale-onesto', 'sale-truffato', 'sale-ignaro', 'sale-consegnato', 'nomi-letti', 'cripta-soglia-ok', 'cripta-nomi-ok', 'cripta-trono-ok', 'cripta-cappella-ok', 'ruggero-sepolto', 'ruggero-elmo', 'ruggero-calmo', 'ruggero-vinto',
  'gualtiero-pace', 'gualtiero-vinto', 'gemma-presa', 'indizio-lettera', 'atto3', 'rocca-ritorno-fatto', 'orsolino-promessa', 'campane-fatte', 'reggente-bruciata', 'reggente-lettera', 'reggente-sospetta', 'reggente-incredula', 'reggente-gemma-fatta', 'gherardo-fiducia'];
for (const b of attese) assert(bandiere[b] > 0, 'la bandiera «' + b + '» si imposta in almeno una partita');
for (const o of ['sigillo-dei-corvi', 'chiave-dell-antro', 'frammento-di-corona', 'lama-della-brace', 'corazza-del-guardiano']) assert(oggetti[o] > 0, 'si ottiene «' + o + '» in almeno una partita');
assert(battaglie['re-senza-corona'] > 0 && battaglie['capobanda-corvino'] > 0 && battaglie.nonmorti > 0, 'le battaglie del capitolo escono come «fuori»');
assert(compagniVisti.has('gherardo') && compagniVisti.has('mirta'), 'entrambi i compagni si reclutano');

// ---- la via senza dadi e senza scontri (Gherardo, la chiave di Madre Anselma, il rito): ogni passaggio importante dell'Atto II ha una strada così ----
{
  const eroi = ['guerriero', 'ladro', 'mago'].map((c, i) => Object.assign(eroe(c, 5, ['umano', 'elfo', 'nano'][i]), { slot: 'e' + (i + 1) }));
  const ctx = { eroi, oro: 100, perdizione: 0, giorno: 1, luogo: 'valcorvo', comune: ['frammento-di-corona'] };
  let s = R.nuovo(cap.id, 99); Object.assign(s.bandiere, { 'udienza-fatta': 1, 'cerchio-preso': 1, atto2: 1 });
  assert(!CM.recluta(s, cap, 'gherardo', ctx).err); s.approv.gherardo = 60; ctx.eroi.push(CM.scheda(cap.compagni.gherardo, 5, 'gherardo'));
  const rng0 = s.rng, fuoriTutto = [];
  // `voci`: pezzi del testo delle scelte da premere, nell'ordine; i nodi con il solo «Continua» vanno avanti da soli
  const via = (id, luogo, voci) => {
    ctx.luogo = luogo; let x = R.act(s, { t: 'avvia', id }, cap, ctx); assert(!x.err, id + ': ' + x.err); s = x.s; const mie = voci.slice();
    for (let k = 0; k < 60; k++) {
      const v = R.vista(s, cap, ctx); if (!v) break;
      let a = { t: 'continua' };
      if (v.scelte && v.scelte.length) { const c = v.scelte.find(c => c.ok && c.t.includes(mie[0])); assert(c, id + '/' + s.scena.nodo + ': manca la scelta «' + mie[0] + '» tra ' + v.scelte.map(c => c.t).join(' | ')); mie.shift(); a = { t: 'scegli', i: c.i }; }
      x = R.act(s, a, cap, ctx); assert(!x.err, id + ': ' + x.err); s = x.s;
      for (const f of x.fuori || []) { fuoriTutto.push(f); if (f.t === 'oggetto') ctx.comune.push(f.id); if (f.t === 'oro') ctx.oro += f.n; }
    }
    assert.deepStrictEqual(mie, [], id + ': scelte non usate'); assert.strictEqual(s.scena, null, id + ': la scena finisce');
  };
  via('rocca-arrivo', 'rocca-pallida', ['cercatori della Reggente', 'Accettiamo']);
  via('fonte-cupa', 'fonte-cupa', ['Madre Anselma', 'Cerchio', 'Insegnatemelo']);
  assert.strictEqual(CM.parla(s, cap, 'gherardo'), 'gherardo-ruggero', 'con la fiducia piena Gherardo apre la sua scena personale');
  via('gherardo-ruggero', 'rocca-pallida', ['debito d\'onore']);
  assert.strictEqual(R.cond({ missione: 'ruggero', stato: 'attiva' }, s, ctx), true);
  via('cripta-soglia', 'cripta-dei-re', ['chiave', 'rito']);
  via('cripta-nomi', 'cripta-dei-re', ['Gherardo recita', 'Gualtiero, Ermanno, Aldobrando']);
  via('cripta-trono', 'cripta-dei-re', ['passaggio dei servi']);
  via('cripta-cappella', 'cripta-dei-re', ['porta l\'elmo']);
  via('cripta-re', 'cripta-dei-re', ['si inginocchia']);
  via('reggente-gemma', 'valcorvo', ['lettera del re', 'Riprendiamo']);
  via('rocca-ritorno', 'rocca-pallida', ['dal re', 'Lo giuro']);
  via('rocca-campane', 'rocca-pallida', ['Gemma alla campana']);
  assert.strictEqual(s.rng, rng0, 'nessun dado tirato');
  assert(!fuoriTutto.some(f => f.t === 'battaglia'), 'nessuna battaglia');
  for (const b of ['rocca-arrivata', 'fonte-visitata', 'rito-appreso', 'cripta-soglia-ok', 'cripta-nomi-ok', 'cripta-trono-ok', 'cripta-cappella-ok', 'ruggero-sepolto', 'ruggero-elmo', 'gualtiero-pace', 'gemma-presa', 'indizio-lettera', 'atto3', 'reggente-sospetta', 'reggente-gemma-fatta', 'orsolino-promessa', 'campane-fatte']) assert(s.bandiere[b], 'bandiera ' + b);
  assert.strictEqual(s.missioni.gemma.stato, 'fatta'); assert.strictEqual(s.missioni.ruggero.stato, 'fatta'); assert.strictEqual(s.missioni.campane.stato, 'fatta');
  const oggetti2 = fuoriTutto.filter(f => f.t === 'oggetto').map(f => f.id);
  for (const o of ['chiave-dell-antro', 'corazza-del-guardiano', 'frammento-di-corona', 'lama-della-brace', 'amuleto-vitale']) assert(oggetti2.includes(o), 'il percorso pacifico dà «' + o + '»');
  assert.strictEqual(s.bandiere.indizi, 1, 'un indizio in tutto: la lettera');
  assert(/Gemma/.test(R.cantare(cap, s, ctx).apertura.join(' ')) && /Boschi Velati/.test(R.cantare(cap, s, ctx).chiusura), 'il riassunto racconta la Gemma e la chiusura indica i Boschi Velati: ' + R.cantare(cap, s, ctx).chiusura);
}

// ---- il riassunto del Locandiere segue le scelte ----
const s0 = R.nuovo(cap.id, 5); const ctx0 = { eroi: [], oro: 0, perdizione: 0, giorno: 1 };
assert.deepStrictEqual(R.cantare(cap, s0, ctx0).apertura, [], 'all\'inizio non c\'è niente da riassumere');
assert.strictEqual(R.cantare(cap, s0, ctx0).chiusura, 'La Reggente vi aspetta a Valcorvo, e la pioggia non smette.');
const s1 = copia(s0); s1.bandiere['gherardo-libero'] = 1; s1.bandiere['cerchio-preso'] = 1; s1.bandiere['corvino-sconfitto'] = 1; s1.bandiere.atto2 = 1;
const ap = R.cantare(cap, s1, ctx0).apertura.join(' ');
assert(/Gherardo/.test(ap) && /Cerchio/.test(ap), 'il riassunto racconta quel che è successo: ' + ap);
assert(/Brughiere Cenerine/.test(R.cantare(cap, s1, ctx0).chiusura), 'la chiusura indica la prossima tappa');
console.log('OK corona', { partite: N, nodi: tutti.size, esiti });
