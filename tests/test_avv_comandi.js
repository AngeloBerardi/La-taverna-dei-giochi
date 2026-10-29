// Comandi della battaglia (A5.2): dai tocchi alle azioni. Il controllo non conosce regole: ogni azione che produce deve essere quella dell'IA e
// accettata da `act`. Un bot gioca battaglie intere «a tocchi» e il risultato è identico a quello delle azioni dirette.
const assert = require('assert');
const { AR, C, squadra } = require('./avv_aiuti.js');
const O = require('../src/js/motori/27l-avv-comandi.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const AP = require('../src/js/motori/27e-avv-poteri.js');
const IA = require('../src/js/motori/27j-avv-ia.js');
const BE = require('../src/js/motori/27f-avv-bestiario.js');
const FAM = Object.keys(BE.FAMIGLIE), puro = (x) => JSON.parse(JSON.stringify(x)), uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// una battaglia di prova: eroi con qualcosa alla cintura (così si provano anche gli oggetti)
function inizio(i, opz) {
  const fam = FAM[i % FAM.length], n = 1 + (i % 4), liv = 1 + (i % 5), inc = C.incontro(fam, liv, n, ['facile', 'medio', 'difficile'][i % 3], 700 + i);
  const s = C.nuovo(squadra(n, liv), inc.nemici, AR.genera(800 + i, AR.AMBIENTI[i % AR.AMBIENTI.length]), Object.assign({ seme: 800 + i, reazioni: { eroi: 'auto', nemici: 'auto' } }, opz));
  s.cb.filter((c) => c.lato === 'eroi').forEach((c, k) => { c.cintura = k % 2 ? ['bomba-fuoco', 'pozione-cura'] : ['pozione-cura']; });
  return s;
}
const turnoEroe = (s) => { const c = C.attore(s); return c && c.lato === 'eroi' ? c : null; };
const cellaDi = (s, id) => { const b = C.trova(s, id); return { q: b.q, r: b.r }; };

// ---- il traduttore: da un'azione di `act` alla sequenza di tocchi che la produce ----
let alterna = 0;
function daTocchi(s, a) {
  const eroe = C.attore(s), E = { q: eroe.q, r: eroe.r }; let c = O.nuovo(s), r;
  const tocca = (q) => { r = O.tocca(c, s, q); c = r.c; return r; }, scegli = (u) => { r = O.scegli(c, s, u); c = r.c; return r; }, conf = () => { r = O.conferma(c, s); c = r.c; return r; };
  // conferma: una volta con lo stesso tocco, una con il pulsante
  const chiudi = (stesso) => { if (r && r.azione) return; if (++alterna % 2 && stesso) tocca(stesso); else conf(); };
  switch (a.t) {
    case 'muovi': tocca(a.a); assert(!r.azione, 'il primo tocco non muove'); assert.strictEqual(c.modo, 'percorso'); chiudi(a.a); break;
    case 'attacca': tocca(cellaDi(s, a.bers)); assert(!r.azione, 'il primo tocco su un nemico non attacca'); assert.strictEqual(c.modo, 'pronto'); chiudi(cellaDi(s, a.bers)); break;
    case 'potere': case 'oggetto': {
      const p = a.t === 'potere' ? AP.P[a.id] : AP.oggetto(a.id); scegli({ k: a.t, id: a.id }); assert(!r.azione, 'scegliere non esegue');
      if (c.modo !== 'pronto') {
        if (p.area === 'singolo') tocca(cellaDi(s, a.bers));
        else if (p.area === 'cerchio') tocca(a.cella || cellaDi(s, a.bers));
        else if (p.area === 'cono' || p.area === 'linea') tocca(a.cella || G.vicini(E)[a.dir]);
        assert.strictEqual(c.modo, 'pronto', `${a.id}: dopo la scelta deve essere pronto`); }
      chiudi(p.area === 'singolo' ? cellaDi(s, a.bers) : p.area === 'cerchio' ? (a.cella || cellaDi(s, a.bers)) : p.area === 'cono' || p.area === 'linea' ? (a.cella || G.vicini(E)[a.dir]) : E); break; }
    default: { const uso = { k: 'speciale', t: a.t }; scegli(uso); if (!r.azione && c.modo !== 'pronto' && a.bers) tocca(cellaDi(s, a.bers)); chiudi(a.bers ? cellaDi(s, a.bers) : null); }
  }
  assert(r && r.azione, 'nessuna azione da ' + JSON.stringify(a)); return r.azione;
}

// ---- 1. un bot gioca battaglie intere a tocchi: stesso esito delle azioni dirette ----
{ const conta = {}; let battaglie = 0, azioni = 0;
  for (let i = 0; i < 28; i++) {
    let s = inizio(i); battaglie++;
    for (let g = 0; g < 600 && !s.over; g++) {
      const livello = ['normale', 'eroica', 'racconto'][i % 3], a = IA.prossima(s, { livello }); let azione = a;
      if (turnoEroe(s)) { azione = daTocchi(s, a); const x = C.act(s, a), y = C.act(s, azione);
        assert(!y.err && !y.pausa, 'azione dei tocchi non valida: ' + JSON.stringify(azione) + ' ' + JSON.stringify(y.err || y.pausa));
        assert(uguali(x.s, y.s), `stato diverso dopo ${JSON.stringify(a)} contro ${JSON.stringify(azione)}`); azioni++;
        const area = a.t === 'potere' ? AP.P[a.id].area : a.t === 'oggetto' ? 'og-' + AP.oggetto(a.id).area : '';
        conta[a.t + (area ? ':' + area : '')] = (conta[a.t + (area ? ':' + area : '')] || 0) + 1; }
      const r = C.act(s, azione); assert(!r.err && !r.pausa, JSON.stringify(r)); s = r.s; } }
  for (const k of ['muovi', 'attacca', 'potere', 'fine']) assert(Object.keys(conta).some((x) => x.split(':')[0] === k), 'il bot non ha mai fatto: ' + k);
  console.log(`  ${battaglie} battaglie, ${azioni} azioni degli eroi a tocchi: ${Object.entries(conta).sort().map(([k, v]) => k + ' ' + v).join(', ')}`); }

// ---- 2. tutto ciò che il motore ammette si raggiunge con i tocchi e viene accettato ----
{ let stati = 0, prove = 0; const tipi = {};
  for (let i = 0; i < 14; i++) { let s = inizio(40 + i), k = 0;
    for (let g = 0; g < 500 && !s.over; g++, k++) {
      if (turnoEroe(s) && k % 3 === 0) { stati++; const m = C.mosseValide(s), E = cellaDi(s, C.attore(s).id);
        const prova = (c, r, nome) => { assert(r.azione, nome + ': nessuna azione'); const y = C.act(s, r.azione); assert(!y.err, `${nome}: act rifiuta ${JSON.stringify(r.azione)} ${y.err}`); prove++; tipi[nome.split(' ')[0]] = 1; };
        const conTocchi = (cella, nome) => { let c = O.nuovo(s), r = O.tocca(c, s, cella); r = O.tocca(r.c, s, cella); prova(r.c, r, nome); };
        for (const x of m.muovi.filter((_, j) => j % 3 === 0)) conTocchi(x, 'muovi');
        for (const x of m.attacchi) conTocchi(cellaDi(s, x.bers), 'attacca');
        for (const [lista, k2] of [[m.poteri, 'potere'], [m.oggetti, 'oggetto']]) for (const e of lista) {
          const base = O.scegli(O.nuovo(s), s, { k: k2, id: e.id });
          const via = (cella, nome) => { let r = base.azione ? base : O.tocca(base.c, s, cella); if (!r.azione) r = O.conferma(r.c, s); prova(r.c, r, `${k2} ${e.id} ${nome}`); };
          if (e.bersagli && e.area === 'singolo') for (const id of e.bersagli) { const b = O.scegli(O.nuovo(s), s, { k: k2, id: e.id }); let r = O.tocca(b.c, s, cellaDi(s, id)); if (!r.azione) r = O.conferma(r.c, s); prova(r.c, r, `${k2} singolo`); }
          else if (e.centri) for (const ce of e.centri) { const b = O.scegli(O.nuovo(s), s, { k: k2, id: e.id }); let r = O.tocca(b.c, s, ce); if (!r.azione) r = O.conferma(r.c, s); prova(r.c, r, `${k2} cerchio`); }
          else if (e.direzioni) for (const d of e.direzioni) { const b = O.scegli(O.nuovo(s), s, { k: k2, id: e.id }); let r = O.tocca(b.c, s, G.vicini(E)[d.dir]); if (!r.azione) r = O.conferma(r.c, s); prova(r.c, r, `${k2} ${e.area}`); }
          else { let r = base; if (!r.azione) r = O.conferma(r.c, s); prova(r.c, r, `${k2} ${e.area}`); } }
        for (const t of m.azioni) { if (['aiuta', 'rialza', 'spingi'].includes(t)) { for (const id of m.bersagli[t]) { const b = O.scegli(O.nuovo(s), s, { k: 'speciale', t }); let r = O.tocca(b.c, s, cellaDi(s, id)); if (!r.azione) r = O.conferma(r.c, s); prova(r.c, r, 'speciale ' + t); } }
          else { const b = O.scegli(O.nuovo(s), s, { k: 'speciale', t }); assert(!b.azione, 'scegliere non esegue'); const r = O.conferma(b.c, s); prova(r.c, r, 'speciale ' + t); } } }
      const r = C.act(s, IA.prossima(s, { livello: 'normale' })); if (r.err || r.pausa) break; s = r.s; } }
  assert(stati > 150 && prove > 3000, `stati ${stati}, prove ${prove}`);
  for (const k of ['muovi', 'attacca', 'potere', 'oggetto', 'speciale']) assert(tipi[k], 'mai provato: ' + k);
  console.log(`  ${stati} stati, ${prove} azioni ammesse provate con i tocchi (tutte accettate da act)`); }

// ---- 3. tocchi a caso: non si rompe niente e ogni azione prodotta è valida ----
{ let n = 0, azioni = 0; const lancia = (() => { let x = 12345; return () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();
  const garbage = [null, undefined, {}, { q: 1.5, r: 2 }, { q: 'a', r: 'b' }, { q: -4, r: 99 }, { q: NaN, r: 1 }, 7, 'x', { q: 1e9, r: -1e9 }];
  for (let i = 0; i < 12; i++) { let s = inizio(80 + i), c = O.nuovo(s);
    for (let g = 0; g < 400 && !s.over; g++) {
      for (let k = 0; k < 40; k++) { n++; const x = lancia(); let r;
        if (x < .5) { const cell = lancia() < .1 ? garbage[Math.floor(lancia() * garbage.length)] : { q: Math.floor(lancia() * 14) - 4, r: Math.floor(lancia() * 13) - 1 }; r = O.tocca(c, s, cell); }
        else if (x < .75) { const usi = [{ k: 'attacca' }, { k: 'potere', id: 'attacco' }, { k: 'potere', id: 'colpo-possente' }, { k: 'oggetto', id: 'pozione-cura' }, { k: 'oggetto', id: 'inesistente' }, { k: 'speciale', t: 'scatto' }, { k: 'speciale', t: 'aiuta' }, { k: 'speciale', t: 'x' }, { k: 'speciale', t: 'fine' }, null, {}, { k: 'potere', id: 7 }];
          r = O.scegli(c, s, usi[Math.floor(lancia() * usi.length)]); }
        else if (x < .88) r = O.conferma(c, s); else if (x < .94) r = { c: O.annulla(c, s) }; else r = { c: O.concentrazione(c, s) };
        c = r.c; assert(uguali(c, puro(c)), 'il controllore non è JSON puro');
        const ev = O.evidenzia(c, s), pa = O.pannello(c, s); assert(Array.isArray(ev.celle) && typeof ev.testo === 'string' && !/undefined|NaN/.test(ev.testo + JSON.stringify(pa.attacca)), ev.testo);
        if (r.azione) { azioni++; const y = C.act(s, r.azione); assert(!y.err, `azione non valida ${JSON.stringify(r.azione)}: ${y.err}`); if (!y.pausa) { s = y.s; c = O.nuovo(s); } } }
      const r = C.act(s, IA.prossima(s, { livello: 'normale' })); if (r.err || r.pausa) break; s = r.s; c = O.fresco(c, s); } }
  assert(n > 30000 && azioni > 150, `tocchi a caso ${n}, azioni ${azioni}`); console.log(`  ${n} comandi a caso, ${azioni} azioni prodotte e tutte valide`); }

// ---- 4. il flusso dei due tocchi, a passi ----
{ let s = inizio(3); while (!turnoEroe(s) || !C.mosseValide(s).muovi.length) s = C.act(s, IA.prossima(s, { livello: 'normale' })).s;
  const m = C.mosseValide(s), [X, Y] = m.muovi.filter((x) => x.costo >= 1), eroe = C.attore(s);
  let c = O.nuovo(s); assert.strictEqual(c.modo, 'riposo');
  let r = O.tocca(c, s, X); assert(!r.azione && r.c.modo === 'percorso' && uguali(r.c.sel.cella, { q: X.q, r: X.r }), 'il primo tocco sceglie il percorso');
  let ev = O.evidenzia(r.c, s); assert(ev.percorso && ev.percorso.costo === X.costo && ev.percorso.passi.length >= 1, 'percorso con costo'); assert(/Tocca ancora per muoverti: costo \d+ di \d+/.test(ev.testo), ev.testo);
  assert(ev.celle.some((x) => x.tipo === 'meta' && x.q === X.q && x.r === X.r), 'la meta è evidenziata');
  r = O.tocca(r.c, s, Y); assert(!r.azione && uguali(r.c.sel.cella, { q: Y.q, r: Y.r }), 'un altro esagono cambia la scelta');
  r = O.tocca(r.c, s, Y); assert.deepStrictEqual(r.azione, { t: 'muovi', a: { q: Y.q, r: Y.r } }); assert.strictEqual(r.c.modo, 'riposo', 'dopo la conferma si riparte da zero');
  // un tocco su un esagono non raggiungibile annulla la scelta
  r = O.tocca(O.nuovo(s), s, X); r = O.tocca(r.c, s, { q: -9, r: -9 }); assert(!r.azione && r.c.modo === 'riposo', 'tocco fuori mappa');
  r = O.tocca(O.nuovo(s), s, X); assert.strictEqual(O.annulla(r.c, s).modo, 'riposo'); assert(!O.conferma(O.nuovo(s), s).azione, 'senza nulla di pronto non si conferma');
  // un controllore vecchio (lo stato è andato avanti) si azzera da solo
  const vecchio = O.tocca(O.nuovo(s), s, X).c, dopo = C.act(s, { t: 'fine' }).s; assert.strictEqual(O.fresco(vecchio, dopo).modo, 'riposo');
  // quando non tocca a un eroe non si dà nessun comando, ma si può guardare chi è chi
  let sn = s; while (turnoEroe(sn)) sn = C.act(sn, IA.prossima(sn, { livello: 'normale' })).s; const nem = C.attore(sn), eroe2 = sn.cb.find((x) => x.lato === 'eroi' && C.inCampo(x));
  r = O.tocca(O.nuovo(sn), sn, cellaDi(sn, eroe2.id)); assert(!r.azione && r.c.info === eroe2.id, 'si può guardare la scheda'); assert(/Tocca a /.test(O.evidenzia(r.c, sn).testo));
  assert(!O.scegli(O.nuovo(sn), sn, { k: 'speciale', t: 'fine' }).azione && !O.conferma(r.c, sn).azione, 'niente comandi nel turno dei nemici'); assert(!O.pannello(r.c, sn).eroe); }

// ---- 5. attacco, anteprima, Concentrazione, pannello ----
{ let s = null, k = 0;
  for (let i = 0; i < 40 && !s; i++) { let x = inizio(100 + i); for (let g = 0; g < 300 && !x.over && !s; g++) { if (turnoEroe(x) && C.mosseValide(x).attacchi.length && C.attore(x).conc >= 1) s = x; else { const r = C.act(x, IA.prossima(x, { livello: 'normale' })); if (r.err || r.pausa) break; x = r.s; } } }
  assert(s, 'serve uno stato con un attacco possibile'); const m = C.mosseValide(s), A = m.attacchi[0], pos = cellaDi(s, A.bers);
  let r = O.tocca(O.nuovo(s), s, pos); assert(!r.azione && r.c.modo === 'pronto' && r.c.pronto.t === 'attacca' && r.c.pronto.bers === A.bers);
  let ev = O.evidenzia(r.c, s); assert(ev.anteprima && Math.abs(ev.anteprima.pc - A.pc) < 1e-9, 'anteprima come in mosseValide'); assert(ev.creature.some((x) => x.id === A.bers && x.tipo === 'scelto'));
  assert(ev.linea && ev.linea.a.q === pos.q && ['nessuna', 'mezza', 'tre-quarti'].includes(ev.linea.cop), 'linea di vista verso il bersaglio');
  const testo = O.testoAnteprima(ev.anteprima); assert(/^Colpisci \d+%/.test(testo) && !/undefined|NaN/.test(testo), testo);
  // Concentrazione: vantaggio sul tiro, anteprima più alta e azione con `conc`
  const c2 = O.concentrazione(r.c, s); assert.strictEqual(c2.conc, true); const ev2 = O.evidenzia(c2, s); assert(ev2.anteprima.pc >= ev.anteprima.pc - 1e-9 && ev2.anteprima.vant, 'vantaggio in anteprima');
  const fatto = O.tocca(c2, s, pos); assert.deepStrictEqual(fatto.azione, { t: 'attacca', bers: A.bers, conc: 'vant' }); assert(!C.act(s, fatto.azione).err && C.act(s, fatto.azione).s.cb.find((x) => x.id === C.attore(s).id).conc === C.attore(s).conc - 1, 'la Concentrazione si spende');
  assert.strictEqual(O.concentrazione(c2, s).conc, false, 'si disattiva con un secondo tocco'); assert.strictEqual(O.concentrazione(Object.assign(O.nuovo(s), {}), Object.assign(puro(s), { cb: s.cb.map((x) => x.id === C.attore(s).id ? Object.assign({}, x, { conc: 0 }) : x) })).conc, false, 'senza Concentrazione non si attiva');
  // il pulsante «Attacca»: con più nemici a tiro chiede quale, con uno solo lo sceglie da sé
  const b = O.scegli(O.nuovo(s), s, { k: 'attacca' }); assert.strictEqual(b.c.modo, m.attacchi.length === 1 ? 'pronto' : 'scelta');
  // pannello: ogni voce non utilizzabile spiega perché
  const pa = O.pannello(O.nuovo(s), s); assert(pa.eroe && pa.attacca.ok && pa.chi === C.attore(s).id);
  for (const v of [...pa.poteri, ...pa.oggetti, ...pa.speciali]) { assert(typeof v.ok === 'boolean'); if (!v.ok) assert(v.perche && v.perche.length > 3, 'manca il motivo: ' + JSON.stringify(v)); }
  const dopoAzione = C.act(s, { t: 'scatto' }); if (!dopoAzione.err) { const p2 = O.pannello(O.nuovo(dopoAzione.s), dopoAzione.s); assert(!p2.attacca.ok && /azione/.test(p2.attacca.perche) && p2.speciali.filter((x) => !x.ok && ['scatto', 'disimpegno', 'nasconditi'].includes(x.t)).every((x) => /azione/.test(x.perche)), 'azione già usata'); } }

// ---- 6. pause delle reazioni ----
{ let trovate = 0;
  for (let i = 0; i < 40 && trovate < 6; i++) { let s = inizio(150 + i, { reazioni: { eroi: 'chiedi', nemici: 'auto' } });
    for (let g = 0; g < 300 && !s.over && trovate < 6; g++) { const a = IA.prossima(s, { livello: 'normale' }); let r = C.act(s, a), dec = [], giri = 0;
      while (r.pausa && giri++ < 6) { trovate++; const p = O.pausa(r.pausa, s); assert(p.titolo.startsWith('Reazione di ') && p.testo.length > 8 && !/undefined|NaN|null/.test(p.testo + p.titolo), p.testo);
        assert(p.opzioni.length >= 1 && p.opzioni.every((o) => o.id && o.nome) && p.rifiuta === 'Nessuna reazione');
        const scelta = trovate % 2 ? p.opzioni[0].id : null, ag = O.rispondi(Object.assign({}, a, { dec }), scelta); dec = ag.dec; assert.strictEqual(dec[dec.length - 1], scelta);
        r = C.act(s, Object.assign({}, a, { dec })); }
      if (r.err || r.pausa) break; s = r.s; } }
  assert(trovate >= 4, 'pause incontrate: ' + trovate); }

// ---- 7. l'anteprima del movimento coincide con il movimento vero ----
{ let prove = 0, conOpp = 0;
  for (let i = 0; i < 16; i++) { let s = inizio(200 + i);
    for (let g = 0; g < 300 && !s.over; g++) {
      if (turnoEroe(s) && g % 2 === 0) for (const x of C.mosseValide(s).muovi.filter((_, j) => j % 4 === 0)) {
        const ap = C.anteprimaMuovi(s, x); assert(!ap.err && ap.costo === x.costo && ap.passi.length >= 1 && uguali(ap.passi[ap.passi.length - 1], { q: x.q, r: x.r }));
        const r = C.act(s, { t: 'muovi', a: { q: x.q, r: x.r } }); assert(!r.err); prove++;
        const mv = r.ev.find((e) => e.t === 'muovi'), opp = r.ev.filter((e) => e.t === 'opportunita').map((e) => e.chi), sciv = r.ev.some((e) => e.t === 'scivola'), cade = r.ev.some((e) => e.t === 'cade');
        if (!sciv && !cade) { assert.deepStrictEqual(mv.passi, ap.passi); assert.strictEqual(mv.costo, ap.costo); assert.deepStrictEqual(opp.slice().sort(), ap.opportunita.slice().sort(), 'attacchi di opportunità previsti'); if (opp.length) conOpp++; } }
      const r = C.act(s, IA.prossima(s, { livello: 'normale' })); if (r.err || r.pausa) break; s = r.s; } }
  assert(prove > 400 && conOpp > 10, `movimenti ${prove}, con attacchi di opportunità ${conOpp}`);
  let s = inizio(1); assert(C.anteprimaMuovi(s, { q: -9, r: -9 }).err && C.anteprimaMuovi(s, null).err, 'destinazioni non valide');
  console.log(`  ${prove} movimenti confrontati con l'anteprima (${conOpp} con attacchi di opportunità)`); }

console.log('ok');
