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

// ---- si gioca a caso: ogni scena e ogni nodo si raggiunge, ogni uscita si vede, gli esiti sono quelli attesi ----
const rnd = (seme) => M.mulberry(seme);
const visti = new Set(), esiti = {}, bandiere = {}, compagniVisti = new Set();
const tutti = new Set(); for (const [sid, sc] of Object.entries(cap.scene)) for (const nid of Object.keys(sc.nodi)) tutti.add(sid + '/' + nid);
function gioca(seme) {
  const r = rnd(seme), pick = (a) => a[Math.floor(r() * a.length)];
  const eroi = ['guerriero', 'ladro', 'mago'].map((c, i) => Object.assign(eroe(c, 1 + Math.floor(r() * 4), ['umano', 'elfo', 'nano'][i]), { slot: 'e' + (i + 1) }));
  const ctx = { eroi, oro: pick([0, 20, 60, 200]), perdizione: 0, giorno: 1, luogo: 'valcorvo' };
  let s = R.nuovo(cap.id, seme);
  const nota = () => { if (s.scena) visti.add(s.scena.id + '/' + s.scena.nodo); };
  const esegui = (id) => {
    let x = R.act(s, { t: 'avvia', id }, cap, ctx); assert(!x.err, id + ': ' + x.err); s = x.s; nota();
    for (let k = 0; k < 80; k++) {
      const v = R.vista(s, cap, ctx); if (!v) return;
      assert(typeof v.testo === 'string' && v.testo.length > 0, 'testo del nodo ' + s.scena.id + '/' + s.scena.nodo);
      let a;
      if (v.scelte && v.scelte.length) { const buone = v.scelte.filter(c => c.ok); assert(buone.length, 'una scelta sempre disponibile in ' + s.scena.id + '/' + s.scena.nodo); a = { t: 'scegli', i: pick(buone).i }; }
      else a = { t: 'continua' };
      x = R.act(s, a, cap, ctx); assert(!x.err, id + ': ' + x.err); s = x.s;
      for (const f of x.fuori || []) { if (f.t === 'oro') ctx.oro = Math.max(0, ctx.oro + f.n); if (f.t === 'perdizione') ctx.perdizione += f.n; }
      if (x.esito) esiti[x.esito] = (esiti[x.esito] || 0) + 1;
      nota();
    }
    assert.fail('scena che non finisce: ' + id);
  };
  esegui('notte-dei-corvi');
  for (let passo = 0; passo < 90; passo++) {
    ctx.luogo = pick(['valcorvo', 'valcorvo', 'casale-salici', 'accampamento-corvi', 'cappella-pellegrino']);
    const opzioni = R.disponibili(cap, s, ctx, ctx.luogo).map(id => ({ id }));
    for (const [cid, c] of Object.entries(s.compagni)) if (c.stato === 'gruppo') {
      s.approv[cid] = pick([-48, -38, -10, 0, 10, 25]); const d = cap.compagni[cid]; compagniVisti.add(cid);
      if (d.scena) opzioni.push({ id: d.scena });
    }
    if (!opzioni.length) continue;
    esegui(pick(opzioni).id);
  }
  for (const [b, v] of Object.entries(s.bandiere)) if (v) bandiere[b] = (bandiere[b] || 0) + 1;
  return JSON.stringify(s);
}
const N = 600; let prima;
for (let seme = 1; seme <= N; seme++) { const f = gioca(seme); if (seme === 7) prima = f; }
assert.strictEqual(gioca(7), prima, 'a parità di seme la partita è identica');
const mancano = [...tutti].filter(x => !visti.has(x));
assert.deepStrictEqual(mancano, [], 'nodi mai raggiunti in ' + N + ' partite: ' + mancano.join(', '));
for (const b of ['atto2', 'cerchio-preso', 'corvino-sconfitto', 'corvino-parlato', 'casale-liberato', 'mirta-risparmiata', 'mirta-consegnata', 'mirta-lasciata', 'gherardo-libero', 'gherardo-evaso', 'gherardo-graziato', 'indizio-sigillo', 'indizio-gherardo', 'rapporto-fatto', 'reggente-rispetta', 'reggente-offesa'])
  assert(bandiere[b] > 0, 'la bandiera «' + b + '» si imposta in almeno una partita');
assert(compagniVisti.has('gherardo') && compagniVisti.has('mirta'), 'entrambi i compagni si reclutano');

// ---- il riassunto del Locandiere segue le scelte ----
const s0 = R.nuovo(cap.id, 5); const ctx0 = { eroi: [], oro: 0, perdizione: 0, giorno: 1 };
assert.deepStrictEqual(R.cantare(cap, s0, ctx0).apertura, [], 'all\'inizio non c\'è niente da riassumere');
assert.strictEqual(R.cantare(cap, s0, ctx0).chiusura, 'La Reggente vi aspetta a Valcorvo, e la pioggia non smette.');
const s1 = copia(s0); s1.bandiere['gherardo-libero'] = 1; s1.bandiere['cerchio-preso'] = 1; s1.bandiere['corvino-sconfitto'] = 1; s1.bandiere.atto2 = 1;
const ap = R.cantare(cap, s1, ctx0).apertura.join(' ');
assert(/Gherardo/.test(ap) && /Cerchio/.test(ap), 'il riassunto racconta quel che è successo: ' + ap);
assert(/Brughiere Cenerine/.test(R.cantare(cap, s1, ctx0).chiusura), 'la chiusura indica la prossima tappa');
console.log('OK corona', { partite: N, nodi: tutti.size, esiti });
