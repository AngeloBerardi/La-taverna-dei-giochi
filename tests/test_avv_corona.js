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
const LUOGHI = ['valcorvo', 'casale-salici', 'cappella-pellegrino', 'accampamento-corvi', 'rocca-pallida', 'fonte-cupa', 'cripta-dei-re', 'poggio-basso', 'altare-piogge', 'torre-corvi'];
for (const f of cap.mondo.luoghi) assert(LUOGHI.includes(f.id), 'il test conosce il luogo ' + f.id);
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
  const veri = ['indizio-sigillo', 'indizio-gherardo', 'indizio-lettera', 'indizio-mirta', 'indizio-quaderno'].filter(b => s.bandiere[b]).length;
  assert.strictEqual(s.bandiere.indizi | 0, veri, 'il contatore degli indizi segue le bandiere degli indizi (seme ' + seme + ')');
  return JSON.stringify(s);
}
const N = 200; let prima, vistiA7;
for (let seme = 1; seme <= N; seme++) { if (seme === 7) vistiA7 = new Set(visti); const f = gioca(seme); if (seme === 7) prima = f; }
assert.strictEqual(gioca(7, vistiA7), prima, 'a parità di seme la partita è identica');
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

// ---- il riassunto è breve: in fondo al capitolo ricorda solo le ultime righe del sommario ----
{
  const t = { eroi: [], oro: 0, perdizione: 0, giorno: 1 }, f = R.nuovo(cap.id, 3);
  for (const x of cap.sommario) { const c = JSON.stringify(x.se).match(/"bandiera":"([^"]+)"/g) || []; for (const m of c) f.bandiere[m.slice(12, -1)] = true; }
  const q = R.cantare(cap, f, t); assert(q.apertura.length <= R.MAX_RIASSUNTO && q.apertura.length > 0, 'il riassunto non supera ' + R.MAX_RIASSUNTO + ' righe: ' + q.apertura.length);
}

// ---- il riassunto del Locandiere segue le scelte ----
const s0 = R.nuovo(cap.id, 5); const ctx0 = { eroi: [], oro: 0, perdizione: 0, giorno: 1 };
assert.deepStrictEqual(R.cantare(cap, s0, ctx0).apertura, [], 'all\'inizio non c\'è niente da riassumere');
assert.strictEqual(R.cantare(cap, s0, ctx0).chiusura, 'La Reggente vi aspetta a Valcorvo, e la pioggia non smette.');
const s1 = copia(s0); s1.bandiere['gherardo-libero'] = 1; s1.bandiere['cerchio-preso'] = 1; s1.bandiere['corvino-sconfitto'] = 1; s1.bandiere.atto2 = 1;
const ap = R.cantare(cap, s1, ctx0).apertura.join(' ');
assert(/Gherardo/.test(ap) && /Cerchio/.test(ap), 'il riassunto racconta quel che è successo: ' + ap);
assert(/Brughiere Cenerine/.test(R.cantare(cap, s1, ctx0).chiusura), 'la chiusura indica la prossima tappa');
// ---- Atto III: percorsi guidati con i dadi truccati (ogni ramo, ogni stanza e ogni finale si raggiunge senza dipendere dalla fortuna) ----
const ADADI = require('../src/js/motori/27a-avv-dadi.js');
// un seme dei dadi per cui i prossimi tre d20 sono tutti 20 (la prova riesce) o tutti 1 (fallisce, anche col vantaggio e col ritiro del piccolo)
const semiDadi = {};
const semeDadi = (ok) => { if (semiDadi[ok]) return semiDadi[ok]; const v = ok ? 20 : 1; for (let c = 1; c < 5e6; c++) { const g = ADADI.gen({ rng: c }); if (ADADI.d(g, 20) === v && ADADI.d(g, 20) === v && ADADI.d(g, 20) === v) return (semiDadi[ok] = c); } throw new Error('nessun seme dei dadi'); };
// una partita all'inizio dell'Atto III: i due pezzi in tasca, i compagni voluti, gli indizi dati (nomi delle bandiere)
function nuova3(o = {}) {
  const classi = o.classi || ['guerriero', 'mago']; // due giocatori: la compagnia ha 4 posti, quindi ci stanno entrambi i compagni
  const eroi = classi.map((c, i) => Object.assign(eroe(c, 7, ['umano', 'elfo', 'nano'][i]), { slot: 'e' + (i + 1) }));
  const ctx = { eroi, oro: 100, perdizione: o.perdizione | 0, giorno: 1, luogo: 'valcorvo', comune: ['frammento-di-corona', 'frammento-di-corona'].concat(o.oggetti || []) };
  const s = R.nuovo(cap.id, 123);
  Object.assign(s.bandiere, { 'udienza-fatta': 1, 'cerchio-preso': 1, atto2: 1, 'gemma-presa': 1, atto3: 1, 'casale-liberato': 1 }, o.flags || {});
  for (const b of o.indizi || []) s.bandiere[b] = 1;
  s.bandiere.indizi = (o.indizi || []).length;
  for (const cid of o.compagni || []) { assert(!CM.recluta(s, cap, cid, ctx).err, 'si recluta ' + cid); s.approv[cid] = o.approv != null ? o.approv : 60; ctx.eroi.push(CM.scheda(cap.compagni[cid], 7, cid)); }
  return { s, ctx, fuori: [], esito: null };
}
const IND4 = ['indizio-sigillo', 'indizio-lettera', 'indizio-gherardo', 'indizio-mirta'];
const pezzi = (g) => g.ctx.comune.filter(x => x === 'frammento-di-corona').length;
// una scena dall'inizio alla fine. `voci`: pezzi del testo delle scelte da premere, nell'ordine; [testo, false] fa fallire la prova. `hook(vista, nodo)` guarda ogni nodo.
function giro(g, id, luogo, voci, hook) {
  g.ctx.luogo = luogo; let x = R.act(g.s, { t: 'avvia', id }, cap, g.ctx); assert(!x.err, id + ': ' + x.err); g.s = x.s; visti.add(id + '/' + g.s.scena.nodo);
  const mie = voci.slice();
  for (let k = 0; k < 90; k++) {
    const v = R.vista(g.s, cap, g.ctx); if (!v) break;
    if (hook) hook(v, g.s.scena.nodo);
    let a = { t: 'continua' };
    if (v.scelte && v.scelte.length) {
      assert(mie.length, id + '/' + g.s.scena.nodo + ': mancano le scelte da fare tra ' + v.scelte.map(c => c.t).join(' | '));
      const [t, ok = true] = [].concat(mie.shift());
      const c = v.scelte.find(c => c.ok && c.t.includes(t));
      assert(c, id + '/' + g.s.scena.nodo + ': manca la scelta «' + t + '» tra ' + v.scelte.map(c => (c.ok ? '' : '(chiusa) ') + c.t).join(' | '));
      g.s.rng = semeDadi(ok); a = { t: 'scegli', i: c.i };
    }
    x = R.act(g.s, a, cap, g.ctx); assert(!x.err, id + ': ' + x.err); g.s = x.s;
    for (const f of x.fuori || []) {
      g.fuori.push(f);
      if (f.t === 'battaglia') battaglie[f.capo || f.fam] = (battaglie[f.capo || f.fam] || 0) + 1;
      if (f.t === 'perdizione') g.ctx.perdizione = Math.max(0, g.ctx.perdizione + f.n);
      if (f.t === 'oggetto') { oggetti[f.id] = (oggetti[f.id] || 0) + 1; for (let j = 0; j < Math.abs(f.n || 1); j++) { if ((f.n || 1) > 0) g.ctx.comune.push(f.id); else { const q = g.ctx.comune.indexOf(f.id); if (q >= 0) g.ctx.comune.splice(q, 1); } } }
    }
    if (x.esito) g.esito = x.esito;
    if (g.s.scena) visti.add(g.s.scena.id + '/' + g.s.scena.nodo);
  }
  assert.deepStrictEqual(mie, [], id + ': scelte non usate'); assert.strictEqual(g.s.scena, null, id + ': la scena finisce');
  for (const [b, v] of Object.entries(g.s.bandiere)) if (v) bandiere[b] = (bandiere[b] || 0) + 1;
  return g;
}
const ha = (g, ...bb) => bb.forEach(b => assert(g.s.bandiere[b], 'bandiera ' + b));
const haNo = (g, ...bb) => bb.forEach(b => assert(!g.s.bandiere[b], 'niente bandiera ' + b));

// le stanze della torre si salgono una alla volta, e a ogni luogo la sua scena
{
  const g = nuova3(), dispo = (L) => R.disponibili(cap, g.s, Object.assign({}, g.ctx, { luogo: L }), L);
  assert.deepStrictEqual(dispo('poggio-basso'), ['poggio-arrivo']); assert.deepStrictEqual(dispo('altare-piogge'), ['altare-notte']); assert.deepStrictEqual(dispo('casale-salici'), ['voce-pozzo']);
  for (const [id, flag] of [['torre-soglia', 'torre-soglia-ok'], ['torre-biblioteca', 'torre-biblio-ok'], ['torre-gabbia', 'torre-gabbia-ok'], ['torre-osservatorio', 'torre-osserv-ok'], ['torre-ombre', 'torre-ombre-ok'], ['torre-maestro', 'maestro-sconfitto']]) {
    assert.deepStrictEqual(dispo('torre-corvi'), [id], 'la torre si sale una stanza alla volta: ' + id); g.s.bandiere[flag] = 1;
  }
  assert.deepStrictEqual(dispo('torre-corvi'), ['torre-re']); g.s.bandiere['finale-fatto'] = 1; assert.deepStrictEqual(dispo('torre-corvi'), []);
  const prima = nuova3({ flags: { atto3: 0 } }); assert.deepStrictEqual(R.disponibili(cap, prima.s, Object.assign({}, prima.ctx, { luogo: 'torre-corvi' }), 'torre-corvi'), [], 'senza l\'atto III la torre non ha scene');
}

// La voce nel pozzo (Casale dei Salici): tirarlo fuori, consegnarlo, lasciarlo
{
  let g = nuova3({ compagni: ['mirta'] });
  giro(g, 'voce-pozzo', 'casale-salici', ['Scendiamo', 'Che cosa sai della Torre', 'Mirta, lo conosci', 'Lo tiriamo fuori']);
  ha(g, 'pico-salvo', 'pico-porta', 'pozzo-fatto'); assert.strictEqual(g.s.missioni.voce.stato, 'fatta'); assert(g.fuori.some(f => f.t === 'xp' && f.n === 60), 'premio della missione');
  assert.deepStrictEqual(R.disponibili(cap, g.s, Object.assign({}, g.ctx, { luogo: 'casale-salici' }), 'casale-salici'), [], 'a pozzo risolto la scena non torna');
  g = nuova3(); giro(g, 'voce-pozzo', 'casale-salici', ['Ci pensiamo dopo']);
  haNo(g, 'pozzo-fatto'); assert.strictEqual(g.s.missioni.voce.stato, 'attiva');
  giro(g, 'voce-pozzo', 'casale-salici', ['Scendiamo', ['Lo tiriamo fuori', false], 'Lo consegniamo']); ha(g, 'pico-consegnato', 'pozzo-fatto'); haNo(g, 'pico-porta');
  g = nuova3(); giro(g, 'voce-pozzo', 'casale-salici', ['Scendiamo', 'Gli caliamo pane']); ha(g, 'pico-lasciato', 'pozzo-fatto');
}

// Poggio Basso e la reliquia di Mirta
{
  let g = nuova3({ compagni: ['mirta'] });
  assert.strictEqual(CM.parla(g.s, cap, 'mirta'), 'mirta-reliquia', 'con la fiducia piena Mirta apre la sua scena personale');
  giro(g, 'poggio-arrivo', 'poggio-basso', ['Che cosa sapete', 'Dove possiamo', 'Mirta, tu conosci', 'Vi aiutiamo', 'Proseguiamo']);
  ha(g, 'poggio-visitato'); assert(g.fuori.some(f => f.t === 'razioni' && f.n === 3), 'il pane dei boscaioli');
  giro(g, 'mirta-reliquia', 'poggio-basso', ['Ti accompagno']); assert.strictEqual(g.s.missioni.reliquia.stato, 'attiva');
  assert.notStrictEqual(CM.parla(g.s, cap, 'mirta'), 'mirta-reliquia', 'a missione presa la scena non si ripete');
  const prima = g.s.approv.mirta; giro(g, 'assunta', 'poggio-basso', ['Lascio che sia Mirta']);
  ha(g, 'reliquia-resa', 'assunta-perdona'); haNo(g, 'assunta-fredda'); assert.strictEqual(g.s.missioni.reliquia.stato, 'fatta'); assert(g.s.approv.mirta >= prima + 15, 'Mirta ne esce più legata');
  const con = (voci) => { const h = nuova3({ compagni: ['mirta'] }); h.s.missioni.reliquia = { stato: 'attiva' }; return giro(h, 'assunta', 'poggio-basso', voci); };
  ha(con(['Parlo io per lei']), 'assunta-perdona'); ha(con([['Parlo io per lei', false]]), 'assunta-perdona');
  const f = con(['Rendiamo il ditale']); ha(f, 'assunta-fredda', 'reliquia-resa'); haNo(f, 'assunta-perdona'); assert.strictEqual(f.s.missioni.reliquia.stato, 'fatta');
  g = nuova3({ compagni: ['mirta'] }); giro(g, 'mirta-reliquia', 'poggio-basso', ['Lo farai quando sarai pronta']); assert.strictEqual(g.s.missioni.reliquia.stato, 'attiva');
  g = nuova3({ compagni: ['mirta'] }); giro(g, 'mirta-reliquia', 'poggio-basso', ['Non è il momento']); assert.strictEqual(CM.parla(g.s, cap, 'mirta'), 'mirta-reliquia', 'se rifiuti la scena torna');
  g = nuova3(); giro(g, 'poggio-arrivo', 'poggio-basso', [['Vi aiutiamo', false], 'Proseguiamo']); assert(!g.fuori.some(f => f.t === 'razioni'));
}

// L'ultima notte all'Altare delle Piogge: Gherardo a seconda di Ruggero, Mirta a seconda della fiducia
{
  const notte = (o, voci) => giro(nuova3(Object.assign({ compagni: ['gherardo', 'mirta'] }, o)), 'altare-notte', 'altare-piogge', voci);
  const tutte = ['Raccolgo', 'Esamino le nicchie', 'Siedo accanto a Gherardo', 'Siedo accanto a Mirta', 'Parliamo di domani', 'Ripartiamo'];
  let g = notte({ flags: { 'ruggero-elmo': 1, 'ruggero-sepolto': 1 } }, tutte);
  ha(g, 'acqua-piogge', 'indizio-mirta', 'altare-notte-fatta'); assert.strictEqual(g.s.bandiere.indizi, 1); assert(g.fuori.some(f => f.t === 'pf' && f.pct === 1), 'si riposa');
  notte({ flags: { 'ruggero-sepolto': 1 } }, [['Esamino le nicchie', false], 'Siedo accanto a Gherardo', 'Siedo accanto a Mirta', 'Ripartiamo']);
  notte({ flags: { 'ruggero-vinto': 1 } }, ['Siedo accanto a Gherardo', 'Ripartiamo']);
  g = notte({ approv: 10 }, ['Siedo accanto a Gherardo', 'Siedo accanto a Mirta', 'Ripartiamo']); haNo(g, 'indizio-mirta');
  g = notte({ approv: 10, flags: { 'reliquia-resa': 1 } }, ['Siedo accanto a Mirta', 'Ripartiamo']); ha(g, 'indizio-mirta');
  g = giro(nuova3(), 'altare-notte', 'altare-piogge', ['Ripartiamo']); haNo(g, 'acqua-piogge', 'indizio-mirta');
}

// la Torre dei Corvi, stanza per stanza
{
  const torre = (id, voci, o, hook) => giro(nuova3(o), id, 'torre-corvi', voci, hook);
  // la soglia: sei modi di entrare
  ha(torre('torre-soglia', ['Mostro il sigillo'], { oggetti: ['sigillo-dei-corvi'] }), 'torre-soglia-ok');
  let g = torre('torre-soglia', ['Entriamo dalla porta delle carbonaie', 'Passo accanto'], { flags: { 'pico-porta': 1 } }); assert(!g.fuori.some(f => f.t === 'battaglia'), 'dalle carbonaie, in silenzio, non si combatte');
  g = torre('torre-soglia', ['Entriamo dalla porta delle carbonaie', ['Passo accanto', false]], { flags: { 'pico-porta': 1 } }); assert(g.fuori.some(f => f.t === 'battaglia' && f.fam === 'torre' && f.diff === 'facile'));
  g = torre('torre-soglia', ['Entriamo dalla porta delle carbonaie', 'La mettiamo fuori'], { flags: { 'pico-porta': 1 } }); assert(g.fuori.some(f => f.t === 'battaglia'));
  g = torre('torre-soglia', ['Fischio il richiamo'], { compagni: ['mirta'], flags: { 'indizio-mirta': 1 } }); assert(!g.fuori.some(f => f.t === 'battaglia'));
  g = torre('torre-soglia', [['Fischio il richiamo', false]], { compagni: ['mirta'], flags: { 'indizio-mirta': 1 } }); assert(g.fuori.some(f => f.t === 'battaglia' && f.diff === 'medio'));
  g = torre('torre-soglia', ['Forziamo il portone']); assert(!g.fuori.some(f => f.t === 'battaglia'));
  g = torre('torre-soglia', [['Forziamo il portone', false]]); assert(g.fuori.some(f => f.t === 'battaglia' && f.arena === 'torre'));
  g = torre('torre-soglia', ['Attacchiamo i custodi']); ha(g, 'torre-soglia-ok'); assert(g.fuori.some(f => f.t === 'battaglia'));
  // la biblioteca: il quaderno si legge in cinque modi (arcano da mago, con i segni di Mirta, arcano senza aiuti, storia, tempo) e dà un indizio
  const senzaMago = ['guerriero', 'ladro'];
  const quaderno = (o, voci) => { g = torre('torre-biblioteca', ['Leggo il quaderno'].concat(voci, ['Salgo la scala']), Object.assign({ flags: { 'torre-soglia-ok': 1 } }, o)); ha(g, 'quaderno-letto', 'indizio-quaderno', 'torre-biblio-ok'); assert.strictEqual(g.s.bandiere.indizi, 1); return g; };
  quaderno({}, ['Provo a decifrarla con']);
  quaderno({ classi: senzaMago, flags: { 'torre-soglia-ok': 1, 'indizio-mirta': 1 } }, ['i segni di Mirta']);
  quaderno({ classi: senzaMago }, ['Provo a decifrarla con']);
  quaderno({}, [['Provo a decifrarla con', false], 'La confronto con le cronache']);
  quaderno({}, [['La confronto con le cronache', false], 'Passo ore a studiarla']);
  assert(g.fuori.some(f => f.t === 'razioni' && f.n === -2) && g.fuori.some(f => f.t === 'perdizione' && f.n === 2), 'studiare costa razioni e un po\' di buio');
  g = torre('torre-biblioteca', ['Leggo il quaderno', 'Lascio il quaderno', 'Cerco fra gli scaffali', 'Leggo il quaderno', 'Passo ore a studiarla', 'Salgo la scala'], { flags: { 'torre-soglia-ok': 1 } }); assert(g.fuori.some(f => f.t === 'oggetto' && f.id === 'pozione-cura-maggiore'));
  g = torre('torre-biblioteca', [['Cerco fra gli scaffali', false], 'Salgo la scala'], { flags: { 'torre-soglia-ok': 1 } }); haNo(g, 'quaderno-letto');
  // la gabbia: il fischio, i corvi liberi, la furtività, la rissa
  const gabbia = (o, voci) => torre('torre-gabbia', voci, Object.assign({ flags: { 'torre-biblio-ok': 1 } }, o));
  g = gabbia({ compagni: ['mirta'], flags: { 'torre-biblio-ok': 1, 'indizio-mirta': 1 } }, ['Fischio il richiamo']); ha(g, 'corvi-calmi', 'torre-gabbia-ok');
  g = gabbia({}, ['Spezzo']); ha(g, 'corvi-liberi'); assert(!g.fuori.some(f => f.t === 'battaglia'));
  g = gabbia({}, [['Spezzo', false]]); haNo(g, 'corvi-liberi'); assert(g.fuori.some(f => f.t === 'battaglia'));
  g = gabbia({}, ['Passo piano']); assert(!g.fuori.some(f => f.t === 'battaglia'));
  g = gabbia({}, [['Passo piano', false]]); assert(g.fuori.some(f => f.t === 'battaglia'));
  // l'osservatorio: coppa, forziere
  g = torre('torre-osservatorio', ['Guardo nella coppa', 'Spezzo la coppa', 'Apro il forziere', 'Salgo ancora'], { flags: { 'torre-gabbia-ok': 1 } }); ha(g, 'maestro-cieco', 'torre-osserv-ok'); assert(g.fuori.some(f => f.t === 'oggetto' && f.id === 'scudo-specchio'));
  g = torre('torre-osservatorio', [['Guardo nella coppa', false], ['Apro il forziere', false], 'Salgo ancora'], { flags: { 'torre-gabbia-ok': 1 } });
  assert(g.fuori.some(f => f.t === 'perdizione' && f.n === 2) && g.fuori.some(f => f.t === 'pf' && f.pct < 0) && !g.fuori.some(f => f.t === 'oggetto'), 'la coppa e la trappola si pagano');
  // la sala delle ombre: l'acqua dell'Altare spegne la fiamma, altrimenti si striscia o si combatte
  const ombre = (o, voci) => torre('torre-ombre', voci, Object.assign({ flags: { 'torre-osserv-ok': 1 } }, o));
  g = ombre({ flags: { 'torre-osserv-ok': 1, 'acqua-piogge': 1 } }, ['Verso sul braciere']); ha(g, 'ombre-spente', 'torre-ombre-ok'); assert(!g.fuori.some(f => f.t === 'battaglia'));
  g = ombre({}, ['Studio il braciere', 'Sguscio fra le ombre']); haNo(g, 'ombre-spente'); assert(!g.fuori.some(f => f.t === 'battaglia'));
  g = ombre({}, [['Studio il braciere', false], ['Sguscio fra le ombre', false]]); assert(g.fuori.some(f => f.t === 'battaglia' && f.diff === 'difficile'));
  g = ombre({}, ['Combattiamo']); ha(g, 'torre-ombre-ok');
}

// il Maestro, il re e i tre finali (ciascuno con le due code: luminosa e amara)
{
  const SU = { 'torre-ombre-ok': 1 };
  const fine = (g, voci, hook) => giro(g, 'torre-maestro', 'torre-corvi', voci, hook);
  const bloccate = (v, ...i) => i.forEach(k => assert.strictEqual(v.scelte[k].ok, false, 'la scelta ' + (k + 1) + ' è chiusa: ' + v.scelte[k].t));
  const aperte = (v, ...i) => i.forEach(k => assert.strictEqual(v.scelte[k].ok, true, 'la scelta ' + (k + 1) + ' è aperta: ' + v.scelte[k].t));
  // 1. il patto: i due pezzi per il re. Il Maestro tradisce (eroi sorpresi), niente terza via, ma il re libero resta possibile
  let g = nuova3({ compagni: ['gherardo', 'mirta'], indizi: IND4, flags: Object.assign({ 'quaderno-letto': 1 }, SU) });
  fine(g, ['Lo ascoltiamo ancora', 'Cito il suo quaderno', 'Accetto il patto', 'Raccogliete i tre pezzi', 'Gherardo e Mirta si fanno avanti', 'Lasciamo il re libero', 'Il ritorno'], (v, n) => { if (n === 'e') { assert.strictEqual(v.scelte.length, 3); aperte(v, 0, 1); bloccate(v, 2); } });
  ha(g, 'patto', 'maestro-sconfitto', 'finale-b', 'finale-fatto'); assert.strictEqual(g.esito, 'finale-b-luminoso'); assert.strictEqual(pezzi(g), 3, 'dato, ripreso: i tre pezzi sono nello zaino');
  assert(g.fuori.some(f => f.t === 'battaglia' && f.capo === 'maestro-della-torre' && f.sorpresa === 'eroi')); assert(g.fuori.some(f => f.t === 'oggetto' && f.id === 'spada-dei-re') && g.fuori.some(f => f.t === 'oggetto' && f.id === 'amuleto-della-fenice'));
  assert.strictEqual(g.s.missioni.corona.stato, 'fatta'); assert(g.fuori.some(f => f.t === 'xp' && f.n === 800), 'il premio della missione della corona');
  // 2. l'inganno riesce: il Maestro è colto di sorpresa. Tre mani, tre sedili: la terza via, con la coda luminosa
  g = nuova3({ compagni: ['gherardo', 'mirta'], indizi: IND4, flags: Object.assign({ 'quaderno-letto': 1 }, SU) });
  fine(g, ['Fingo di accettare', 'Raccogliete il Sigillo', 'Raccontate al re', 'La terza via', 'Il primo consiglio'], (v, n) => { if (n === 'e') aperte(v, 0, 1, 2); });
  ha(g, 'maestro-ingannato', 'finale-c'); haNo(g, 'patto'); assert.strictEqual(g.esito, 'finale-c-luminoso'); assert.strictEqual(pezzi(g), 3);
  assert(g.fuori.some(f => f.t === 'battaglia' && f.capo === 'maestro-della-torre' && f.sorpresa === 'nemici')); assert(g.fuori.some(f => f.t === 'oggetto' && f.id === 'anello-del-custode'));
  // 3. l'inganno fallisce, senza compagni e senza indizi: la corona intera, con la coda amara. Il re libero e la terza via restano chiusi
  g = nuova3({ compagni: ['mirta'], flags: SU });
  fine(g, [['Fingo di accettare', false], 'Raccogliete il Sigillo', 'Mirta si fa avanti', 'Ricomponiamo', 'Il ritorno'], (v, n) => { if (n === 'e') { aperte(v, 0); bloccate(v, 1, 2); } });
  ha(g, 'finale-a'); haNo(g, 'maestro-ingannato'); assert.strictEqual(g.esito, 'finale-a-amaro'); assert(g.fuori.some(f => f.t === 'battaglia' && f.capo === 'maestro-della-torre' && !f.sorpresa)); assert(g.fuori.some(f => f.t === 'oggetto' && f.id === 'armatura-del-sovrano'));
  // 4. il rifiuto, con un solo compagno e due indizi: il re libero, coda amara
  g = nuova3({ compagni: ['gherardo'], indizi: ['indizio-sigillo', 'indizio-lettera'], flags: SU });
  fine(g, ['Rifiuto il patto', 'Raccogliete il Sigillo', 'Gherardo si fa avanti', 'Lasciamo il re libero', 'Il ritorno'], (v, n) => { if (n === 'e') { aperte(v, 0, 1); bloccate(v, 2); } });
  assert.strictEqual(g.esito, 'finale-b-amaro');
  // 5. la coppa rotta: si colpisce senza essere visti. Terza via, ma col buio addosso: coda amara
  g = nuova3({ compagni: ['gherardo', 'mirta'], indizi: IND4, perdizione: 50, flags: Object.assign({ 'quaderno-letto': 1, 'maestro-cieco': 1 }, SU) });
  fine(g, ['Colpiamo prima', 'Raccogliete il Sigillo', 'Gherardo e Mirta si fanno avanti', 'La terza via', 'Il primo consiglio']); assert.strictEqual(g.esito, 'finale-c-amaro');
  assert(g.fuori.some(f => f.t === 'battaglia' && f.sorpresa === 'nemici'));
  // con tre giocatori un compagno aspetta alla locanda: non c'è nella torre, ma i finali lo contano come alleato
  g = nuova3({ classi: ['guerriero', 'ladro', 'mago'], compagni: ['gherardo', 'mirta'], flags: Object.assign({ 'corvi-liberi': 1 }, SU) });
  assert.strictEqual(g.s.compagni.gherardo.stato, 'gruppo'); assert.strictEqual(g.s.compagni.mirta.stato, 'attende');
  fine(g, ['Colpiamo prima', 'Raccogliete il Sigillo', 'Gherardo si fa avanti', 'Ricomponiamo', 'Il ritorno'], (v, n) => { if (n === 'b') assert(!v.scelte.some(c => /Mirta/.test(c.t)), 'Mirta non c\'è, aspetta alla locanda'); });
  assert.strictEqual(g.esito, 'finale-a-luminoso', 'la coda luminosa non richiede i quattro posti');
  // 6. i corvi liberi: stessa strada, con i compagni e senza buio: la corona intera, coda luminosa
  g = nuova3({ compagni: ['gherardo', 'mirta'], flags: Object.assign({ 'corvi-liberi': 1 }, SU) });
  fine(g, ['Colpiamo prima', 'Raccogliete il Sigillo', 'Raccontate al re', 'Ricomponiamo', 'Il ritorno']); assert.strictEqual(g.esito, 'finale-a-luminoso');
  // la terza via vuole tutto: indizi, quaderno, nessun patto, i due compagni, la loro fiducia
  const terza = (o) => { const h = nuova3(Object.assign({ compagni: ['gherardo', 'mirta'], indizi: IND4, flags: Object.assign({ 'quaderno-letto': 1, 'maestro-sconfitto': 1 }) }, o)); return R.cond(cap.scene['torre-re'].nodi.e.scelte[2].se, h.s, h.ctx); };
  assert.strictEqual(terza({}), true);
  assert.strictEqual(terza({ indizi: IND4.slice(0, 3) }), false, 'servono quattro indizi'); assert.strictEqual(terza({ flags: { patto: 1, 'quaderno-letto': 1 } }), false, 'col patto no');
  assert.strictEqual(terza({ approv: 15 }), false, 'serve la fiducia dei due'); assert.strictEqual(terza({ compagni: ['gherardo'] }), false, 'servono tutti e due');
  assert.strictEqual(terza({ flags: { 'maestro-sconfitto': 1 } }), false, 'senza il diario non si conosce la via');
}

// ---- gli eventi di strada scritti nel capitolo: validi, per ogni terreno del viaggio, di poco peso, e finiscono nel mazzo ----
const A = require('../src/js/motori/27r-avv-eventi.js');
assert.deepStrictEqual(A.valida(cap.eventi), [], 'gli eventi del capitolo sono validi');
assert.strictEqual(cap.eventi.length, 10, 'dieci eventi del capitolo');
for (const t of ['strada', 'pianura', 'palude', 'bosco', 'collina']) assert(cap.eventi.some(e => e.tag.includes(t)), 'un evento del capitolo per il terreno ' + t);
for (const e of cap.eventi) {
  assert(/^c1-/.test(e.id), e.id + ': gli eventi del capitolo cominciano per c1-');
  for (const c of e.scelte) for (const eff of c.prova ? [c.prova.ok[1], c.prova.ko[1]] : [c.fine[1]]) for (const f of eff) {
    if (f.t === 'oro') assert(Math.abs(f.n) <= 30, e.id + ': poco oro'); if (f.t === 'xp') assert(f.n <= 20, e.id + ': poca esperienza'); if (f.t === 'pf') assert(f.pct >= -0.2 && f.pct <= 0.25, e.id + ': pochi pf');
    if (f.t === 'perdizione') assert(Math.abs(f.n) <= 3, e.id + ': poca perdizione'); if (f.t === 'battaglia') assert(['facile', 'medio'].includes(f.diff), e.id + ': battaglia leggera');
  }
  for (const c of e.scelte) if (c.prova) assert(c.prova.cd >= 11 && c.prova.cd <= 14, e.id + ': difficoltà tra 11 e 14');
}
{
  const finiti = A.EVENTI.map(e => e.id);
  for (const terreno of ['strada', 'pianura', 'palude', 'bosco', 'collina']) for (const notte of [false, true]) {
    const usciti = new Set(); for (let seme = 1; seme <= 300; seme++) { const e = A.eventoStrada(seme, { terreno, notte, extra: cap.eventi, usati: finiti }); if (e) usciti.add(e.id); }
    assert([...usciti].some(id => /^c1-/.test(id)), 'con i trenta già visti escono quelli del capitolo (' + terreno + (notte ? ', di notte' : '') + ')');
  }
  // ogni evento si gioca come una scena, con ogni scelta e ogni esito
  for (const e of cap.eventi) for (let i = 0; i < e.scelte.length; i++) for (const ok of e.scelte[i].prova ? [true, false] : [true]) {
    const c1 = A.capitolo(e), ctx = { eroi: ['guerriero', 'ladro', 'mago'].map((c, k) => Object.assign(eroe(c, 5, 'umano'), { slot: 'e' + (k + 1) })), oro: 50, perdizione: 0, giorno: 1 };
    let s = R.nuovo(c1.id, 5); let x = R.act(s, { t: 'avvia', id: e.id }, c1, ctx); assert(!x.err, e.id + ': ' + x.err); s = x.s; s.rng = semeDadi(ok);
    x = R.act(s, { t: 'scegli', i: i }, c1, ctx); assert(!x.err, e.id + '#' + i + ': ' + x.err); s = x.s;
    x = R.act(s, { t: 'continua' }, c1, ctx); assert(!x.err && s.scena !== undefined, e.id + '#' + i + ': l\'esito chiude la scena');
  }
}

const mancano = [...tutti].filter(x => !visti.has(x));
assert.deepStrictEqual(mancano, [], 'nodi mai raggiunti in ' + N + ' partite: ' + mancano.join(', '));
const attese = ['atto2', 'cerchio-preso', 'corvino-sconfitto', 'corvino-parlato', 'casale-liberato', 'mirta-risparmiata', 'mirta-consegnata', 'mirta-lasciata', 'gherardo-libero', 'gherardo-evaso', 'gherardo-graziato', 'indizio-sigillo', 'indizio-gherardo', 'rapporto-fatto', 'reggente-rispetta', 'reggente-offesa',
  'rocca-arrivata', 'fonte-visitata', 'rito-appreso', 'sale-onesto', 'sale-truffato', 'sale-ignaro', 'sale-consegnato', 'nomi-letti', 'cripta-soglia-ok', 'cripta-nomi-ok', 'cripta-trono-ok', 'cripta-cappella-ok', 'ruggero-sepolto', 'ruggero-elmo', 'ruggero-calmo', 'ruggero-vinto',
  'gualtiero-pace', 'gualtiero-vinto', 'gemma-presa', 'indizio-lettera', 'atto3', 'rocca-ritorno-fatto', 'orsolino-promessa', 'campane-fatte', 'reggente-bruciata', 'reggente-lettera', 'reggente-sospetta', 'reggente-incredula', 'reggente-gemma-fatta', 'gherardo-fiducia',
  'poggio-visitato', 'assunta-perdona', 'assunta-fredda', 'reliquia-resa', 'pico-porta', 'pico-salvo', 'pico-consegnato', 'pico-lasciato', 'pozzo-fatto', 'acqua-piogge', 'indizio-mirta', 'altare-notte-fatta', 'torre-soglia-ok', 'torre-biblio-ok', 'quaderno-letto', 'indizio-quaderno',
  'corvi-calmi', 'corvi-liberi', 'torre-gabbia-ok', 'maestro-cieco', 'torre-osserv-ok', 'ombre-spente', 'torre-ombre-ok', 'patto', 'maestro-ingannato', 'maestro-sconfitto', 'finale-a', 'finale-b', 'finale-c', 'finale-fatto'];
for (const b of attese) assert(bandiere[b] > 0, 'la bandiera «' + b + '» si imposta in almeno una partita');
for (const o of ['sigillo-dei-corvi', 'chiave-dell-antro', 'frammento-di-corona', 'lama-della-brace', 'corazza-del-guardiano', 'spada-dei-re', 'armatura-del-sovrano', 'amuleto-della-fenice', 'anello-del-custode', 'scudo-specchio', 'pozione-cura-maggiore']) assert(oggetti[o] > 0, 'si ottiene «' + o + '» in almeno una partita');
assert(battaglie['re-senza-corona'] > 0 && battaglie['capobanda-corvino'] > 0 && battaglie.nonmorti > 0 && battaglie['maestro-della-torre'] > 0 && battaglie.torre > 0, 'le battaglie del capitolo escono come «fuori»');
assert(compagniVisti.has('gherardo') && compagniVisti.has('mirta'), 'entrambi i compagni si reclutano');


console.log('OK corona', { partite: N, nodi: tutti.size, esiti });
