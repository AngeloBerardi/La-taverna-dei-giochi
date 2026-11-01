#!/usr/bin/env node
// Campagne intere (Cantari di Ventura, A13): un bot gioca il Capitolo 1 «La Corona Spezzata» dall'inizio alla fine attraverso l'orchestratore (AVV), come farebbe una
// compagnia vera: va dove c'è una scena da giocare, sceglie nei dialoghi, combatte con l'IA, si cura, riposa, rialza i caduti, entra nei sotterranei. Misura esito,
// durata, vite perse, esperienza, oro, livello finale. Gli stessi calcoli li usa `tests/test_avv_campagne.js` (pochi semi); da riga di comando si fanno le tabelle.
//   node tools/avventura/campagne.js [--squadra g,m,c,l] [--stile furbo|caso] [--abilita bravo|medio] [--diff racconto|normale|eroica] [--n 12] [--seme 1] [--json] [--dbg]
// Niente `Math.random`: tutto dal seme (il bot ha un suo generatore, la campagna il suo).
const path = require('path');
const R = (f) => require(path.join(__dirname, '../../src/js/motori', f));
const E = R('27-eroi.js'); global.EROI = E;
const A = R('27e-avv-poteri.js'), C = R('28-campagna.js'), SC = R('27i-avv-scontro.js'), IA = R('27j-avv-ia.js'), RA = R('27q-avv-racconto.js'), AVV = R('28a-avv-orchestratore.js'), CM = R('27p-avv-compagni.js');
const ADIF = R('27ha-avv-difficolta.js'), LU = R('27n-avv-luoghi.js'), AO = R('27b-avv-oggetti.js'), BO = R('27c-avv-bottino.js');
const CAP = require(path.join(__dirname, '../../src/avventura/corona.json'));

// livelli che una compagnia prudente vuole prima di andare in certi luoghi (la storia: atto I 1→4, II 4→6, III 6→8)
const RICH = { 'accampamento-corvi': 4, 'cripta-dei-re': 5, 'torre-corvi': 7 };
const BASI = {
  guerriero: { for: 15, des: 12, cos: 14, int: 8, sag: 10, car: 8 }, ladro: { for: 8, des: 15, cos: 13, int: 12, sag: 10, car: 10 }, mago: { for: 8, des: 14, cos: 12, int: 15, sag: 10, car: 8 },
  chierico: { for: 12, des: 10, cos: 13, int: 8, sag: 15, car: 10 }, esploratore: { for: 10, des: 15, cos: 13, int: 8, sag: 14, car: 8 }, bardo: { for: 8, des: 14, cos: 12, int: 10, sag: 8, car: 15 } };
const SIGLE = { g: 'guerriero', l: 'ladro', m: 'mago', c: 'chierico', e: 'esploratore', b: 'bardo' };
const RAZZE = ['umano', 'elfo', 'nano', 'piccolo'], ASP = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const rng = (seme) => { let x = (seme >>> 0) % 2147483646 + 1; return () => ((x = x * 16807 % 2147483647) - 1) / 2147483646; };

// la compagnia di partenza: eroi di primo livello, uno per sigla (g, l, m, c, e, b), con i dati che l'account darebbe (slot compreso)
function squadra(sigle, sb) {
  return sigle.map((s, i) => { const cl = SIGLE[s]; return Object.assign(E.nuovo({ nome: cl[0].toUpperCase() + cl.slice(1), razza: RAZZE[i % 4], classe: cl, base: BASI[cl], aspetto: ASP }, (sb || 70000) + i), { slot: 'e' + (i + 1) }); });
}
const percento = (et) => { const m = /(\d+)\s*%/.exec(et || ''); return m ? +m[1] : null; };

// un passo: una sola azione scelta dal bot; restituisce l'azione {t,...} per AVV.act oppure {fine:true} se non c'è più nulla da fare
function gioca(opz) {
  opz = opz || {};
  const cap = opz.cap || CAP, caso = rng((opz.seme || 1) * 7919 + 3), furbo = opz.stile !== 'caso', forte = opz.abilita === 'medio' ? 'normale' : 'eroica';
  const d0 = Object.assign({}, ADIF.D[opz.diff || 'normale']); if (opz.mod) Object.assign(ADIF.D[opz.diff || 'normale'], opz.mod);   // prove di taratura: si cambiano i numeri senza toccare il motore
  let s = AVV.nuova(cap, opz.eroi || squadra(opz.sigle || ['g', 'm', 'c', 'l'], opz.seme), opz.seme || 1, Object.assign({ difficolta: opz.diff }, opz.opzioni));
  const M = { passi: 0, battSess: 0, battaglie: 0, vinte: 0, perse: 0, sconfitte: 0, sessioni: 0, scene: 0, riposi: 0, cure: 0, errori: [], giorniSessione: [], xpSessione: [], oroSessione: [], motivo: null };
  const fai = (a) => { const r = AVV.act(s, a, cap); if (r.err) return r; s = r.s; return r; };
  const dbg = (...x) => { if (opz.dbg) console.log(...x); };
  const cc = () => s.camp, viv = () => C.vivi(cc());
  // ---- dialoghi: scelta con la prova più probabile; chi parla di battaglia senza prova viene dopo; il compagno si accoglie sempre ----
  // una scena che si ripete con lo stesso stato (oro, livelli, bandiere) non porta a nulla: la prima volta si prova a uscire, la seconda si sceglie ciò che fa avanzare, la terza si lascia stare
  const giri = {}, stato = () => { const c = cc(); return Math.floor(c.oro / 10) + '|' + c.eroi.map((e) => e.liv).join('') + '|' + JSON.stringify(s.racc.bandiere).length; };
  const ripetuta = (id) => (giri[id] && giri[id].k === stato() ? giri[id].n : 0);
  const permessa = (id) => ripetuta(id) < 3;
  const segna = (id) => { const k = stato(); giri[id] = giri[id] && giri[id].k === k ? { k, n: giri[id].n + 1 } : { k, n: 1 }; };
  function dialogo() {
    const v = RA.vista(s.racc, AVV.capitolo(s, cap), AVV.ctx(s));
    if (!v) return fai({ t: 'racconto', a: { t: 'continua' } });
    if (v.continua) return fai({ t: 'racconto', a: { t: 'continua' } });
    const ok = v.scelte.filter((c) => c.ok); if (!ok.length) return { err: 'nessuna scelta possibile in ' + v.scena + '/' + v.nodo };
    let i;
    if (!furbo) i = ok[Math.floor(caso() * ok.length)].i;
    else {
      const def = ((cap.scene[v.scena] || {}).nodi || {})[v.nodo] || {}, pun = (c) => { const d = (def.scelte || [])[c.i] || {}, ef = JSON.stringify(d.effetti || []); const p = percento(c.etichetta);
        let x = p != null ? p : 50; if (ripetuta(v.scena) && d.fine && !(d.effetti || []).length) x -= 100; if (/"recluta"/.test(ef)) x += 200; if (/"battaglia"/.test(ef) && p == null) x -= 10; if (/"perdizione"/.test(ef)) x -= 20; if (/"oro","n":-/.test(ef)) x -= 15; return x; };
      i = ok.map((c) => ({ i: c.i, p: pun(c) + caso() * 3 })).sort((a, b) => b.p - a.p)[0].i;
    }
    return fai({ t: 'racconto', a: { t: 'scegli', i } });
  }
  // ---- battaglie: l'IA gioca per gli eroi (bravi o meno) e per i nemici ----
  function battaglia() {
    const b = AVV.battaglia(s); if (!b) return { err: 'nessuna battaglia' };
    const fin = IA.partita(b, { eroi: forte, nemici: 'normale' }); M.battaglie++; M.battSess++;
    dbg('  battaglia g' + cc().giorno, 'liv', Math.round(cc().eroi.reduce((a, e) => a + e.liv, 0) / cc().eroi.length * 10) / 10, 'eroi', cc().eroi.length, 'vs', b.cb.filter((x) => x.lato !== 'eroi').map((x) => x.def).join(','), '→', fin.over.esito, 'giri', fin.giro, 'PF', fin.cb.filter((x) => x.lato === 'eroi').map((x) => x.hp + '/' + x.hpMax).join(' '));
    const r = fai({ t: 'esito', riep: SC.riepilogo(fin) });
    if (!r.err) { if (fin.over.esito === 'vittoria') M.vinte++; else M.perse++; }
    return r;
  }
  // ---- sotterraneo: avanza se in forma, altrimenti esce a curarsi; prima del capo pretende di più ----
  const media = () => { const v = viv(); return v.length ? v.reduce((a, e) => a + e.hp / e.hpMax, 0) / v.length : 0; };
  function sotto() {
    const c = cc(), sott = c.sotterranei[c.dentro], prossima = sott && sott.stanze[sott.stanza], soglia = prossima && prossima.k === 'boss' ? .75 : .5;
    const caduti = c.eroi.filter((e) => e.hp <= 0), puoRialzare = caduti.length > 0 && c.oro >= LU.PREZZI.tempio(caduti[0].liv);
    if (media() < soglia || (puoRialzare && prossima && prossima.k === 'boss')) return fai({ t: 'camp', a: { t: 'esci' } });
    return fai({ t: 'camp', a: { t: 'avanza' } });
  }
  const sicuri = () => Object.values(cc().luoghi).filter((l) => ['citta', 'villaggio'].includes(l.tipo) && !l.assedio);
  const vai = (meta, bersaglio) => { // la compagnia unita cammina verso la meta, quanto può in un giro; un mostro bersaglio non è un ostacolo
    const c = cc(), v = viv(), da = { q: v[0].q, r: v[0].r }; if (da.q === meta.q && da.r === meta.r) return null;
    const r0 = fai({ t: 'camp', a: { t: 'tira', tutti: true } }); if (r0.err && !/già|tirato/.test(r0.err)) { /* ha già tirato: va bene */ }
    const pm = Math.min(...viv().map((e) => e.pm == null ? 0 : e.pm)); const occ = new Set(cc().mostri.filter((m) => !(bersaglio && m.q === meta.q && m.r === meta.r)).map((m) => C.K(m.q, m.r)));
    const p = C.percorso(cc().celle, da, meta, null, { vieta: occ, costo: C.costoCella(cc()) });
    if (!p) return fai({ t: 'camp', a: { t: 'fineTurno' } });
    if (bersaglio) p.pop();   // ci si ferma accanto al gruppo: il contatto avvia la battaglia
    let costo = 0, fin = null; for (const x of p) { costo += C.costoCella(cc())(cc().celle[C.K(x.q, x.r)]); if (costo > pm) break; fin = x; }
    if (!fin) return fai({ t: 'camp', a: { t: 'fineTurno' } });
    return fai({ t: 'camp', a: { t: 'muovi', eroe: cc().eroi.indexOf(viv()[0]), tutti: true, q: fin.q, r: fin.r } });
  };
  function riposoBreve() { const c = cc(); for (let i = 0; i < c.eroi.length; i++) { const e = c.eroi[i]; if (e.hp > 0 && e.hp < e.hpMax * .7 && (e.brevi | 0) < 2) { const x = fai({ t: 'camp', a: { t: 'breve', eroe: i } }); if (!x.err) { M.riposi++; return true; } } } return false; }
  // dove c'è una scena da giocare (la prossima tappa della storia, un incarico, un compagno che vuole parlare)
  function mete() {
    const c = cc(), cd = AVV.capitolo(s, cap), cx = AVV.ctx(s), out = [];
    for (const l of Object.values(c.luoghi)) { const sc = RA.disponibili(cd, s.racc, cx, l.id).filter((q) => permessa(q.id || q)); if (sc.length) out.push({ l, sc }); }
    return out;
  }
  // livello consigliato per andare in una regione (la storia: atto I 1–4, II 4–6, III 6–8) e nel sotterraneo / nella torre dell'atto
  // la storia decide il passo; dopo una sconfitta si aspetta di aver guadagnato un po' di esperienza prima di ritentare (si caccia, si ripuliscono rovine, si fanno incarichi)
  const richiesto = (l) => Math.max(M.soglia || 0, l ? RICH[l.id] || (l.reg === 1 ? 4 : l.reg === 2 ? 6 : 1) : 1) - (opz.sconto | 0);
  const livMedio = () => { const v = viv(); return v.length ? v.reduce((a, e) => a + e.liv, 0) / v.length : 1; };
  function caccia(v) { // a caccia dei gruppi visibili: i più vicini che si possono battere
    const c = cc(), lim = livMedio() + 1, n = viv().length, peso = n + 2;
    const g = c.mostri.filter((m) => m.stato !== 'guardia' && m.liv <= lim && m.ids.length <= peso && m.diff !== 'difficile').sort((a, b) => C.dist(a, v[0]) - C.dist(b, v[0]))[0];
    if (g) { dbg('  caccia', g.fam, 'liv', g.liv, 'a', C.dist(g, v[0]), 'passi'); M.caccia = (M.caccia | 0) + 1; return vai({ q: g.q, r: g.r }, true) || fai({ t: 'camp', a: { t: 'fineTurno' } }); }
    return fai({ t: 'camp', a: { t: 'fineTurno' } });
  }
  // ---- spesa: in una bottega la compagnia compra l'armatura, lo scudo e l'arma che migliorano di più per moneta (mai meno di una piccola riserva per locanda e cure) ----
  const dmg = (it) => it ? (it.n || 1) * ((it.dado || 4) + 1) / 2 + (it.fx && it.fx.dan || 0) + (it.acc ? .3 : 0) + (it.fx && it.fx.att || 0) * .5 : 0;
  const spesi = new Set();
  function spesa() {
    let c = cc(); const v = viv(), qui = C.luogoDi(c, v[0]); if (!qui || !LU.servizi(qui, c.giorno).includes('bottega')) return false;
    const chiave = qui.id + '@' + BO.periodoDi(c.giorno) + '@' + Math.floor(c.oro / 25); if (spesi.has(chiave)) return false; spesi.add(chiave);
    let fatto = false;
    for (let k = 0; k < 12; k++) {
      c = cc(); let best = null; const riserva = 12 * c.eroi.length;
      for (const tipo of ['fabbro']) { const n = BO.negozio(c.seed, c.giorno, tipo); if (!n) continue;
        for (const x of n.roba) { const it = AO.OGG[x.id]; if (!it || !['armatura', 'scudo', 'arma'].includes(it.slot)) continue; const pr = x.pr || it.pr; if (c.oro - pr < riserva) continue;
          c.eroi.forEach((h, i) => { if (h.hp <= 0) return; const t = AO.anteprima(h, x.id); if (!t) return;
            let val; if (it.slot === 'arma') val = (dmg(it) - dmg(AO.OGG[(h.equip || {}).arma])) * .5; else val = E.derivati(t).ca - E.derivati(h).ca;
            if (val > 0 && (!best || val / pr > best.val / best.pr)) best = { i, id: x.id, tipo, val, pr }; }); } }
      if (!best) break;
      const r = fai({ t: 'camp', a: { t: 'compra', eroe: best.i, tipo: best.tipo, id: best.id } }); if (r.err) break;
      const q = fai({ t: 'camp', a: { t: 'equipa', eroe: best.i, id: best.id } }); fatto = true; M.acquisti = (M.acquisti | 0) + 1;
      dbg('  compra', best.id, 'per', cc().eroi[best.i].nome, best.pr, 'monete', q.err || '');
    }
    return fatto;
  }
  function mappa() {
    const c = cc(), v = viv(), vista = AVV.vista(s, cap);
    if (c.incontro) { let best = null; for (let i = 0; i < c.eroi.length; i++) if (c.eroi[i].hp > 0 && c.eroi[i].q === c.incontro.q && c.eroi[i].r === c.incontro.r) for (const ab of c.incontro.ab) { const sc = EROI.mod(EROI.punteggi(c.eroi[i].base, c.eroi[i].razza)[EROI.ABILITA[ab]]) + (EROI.CLASSI[c.eroi[i].classe].abilita.includes(ab) ? 3 : 0); if (!best || sc > best.sc) best = { i, ab, sc }; } return fai({ t: 'camp', a: { t: 'risolvi', eroe: best.i, abilita: best.ab } }); }
    if (c.evento) { const def = LU.evento(c.evento.id); let bi = 0, bs = -1e9; def.scelte.forEach((x, i) => { const sc = -(x.eff.perdizione || 0) * 10 + (x.eff.oro || 0) / 5 + (x.eff.xp || 0) + ((x.eff.oro || 0) < -c.oro ? -999 : 0); if (sc > bs) { bs = sc; bi = i; } }); return fai({ t: 'camp', a: { t: 'scegli', i: bi } }); }
    if (riposoBreve()) return {};
    const caduti = c.eroi.filter((e) => e.hp <= 0), puoRialzare = caduti.length > 0 && c.oro >= LU.PREZZI.tempio(caduti[0].liv), pronto = media() >= .75 && !puoRialzare;
    const qui = C.luogoDi(c, v[0]), unita = v.every((e) => e.q === v[0].q && e.r === v[0].r), alSicuro = qui && ['citta', 'villaggio'].includes(qui.tipo) && !qui.assedio;
    if (alSicuro && spesa()) return {};
    if (alSicuro) { // servizi: tempio per i caduti, cure, notte alla locanda
      if (puoRialzare && qui.tipo === 'citta') { const x = fai({ t: 'camp', a: { t: 'rialza', eroe: c.eroi.indexOf(caduti[0]) } }); if (!x.err) return x; }
      if (media() < .85) { let x = fai({ t: 'camp', a: { t: 'cura', eroe: c.eroi.indexOf(v[0]) } }); if (x.err) x = fai({ t: 'camp', a: { t: 'lungo' } }); if (!x.err) { M.cure++; return x; } }
    }
    // una sessione vera dura un po': in una città, dopo un certo numero di battaglie o di giorni di viaggio, la compagnia si ferma e chiude il cantare (opz.sessBatt / opz.sessGiorni; 0 = mai)
    if (alSicuro && ((opz.sessBatt === undefined ? 8 : opz.sessBatt) > 0 && M.battSess >= (opz.sessBatt === undefined ? 8 : opz.sessBatt) || (opz.sessGiorni === undefined ? 5 : opz.sessGiorni) > 0 && c.giorno - ultimo.giorno >= (opz.sessGiorni === undefined ? 5 : opz.sessGiorni))) return { vuoto: true };
    // la scena di qui (se la storia decide il passo) viene prima di tutto, se la compagnia è all'altezza della regione
    const liv = livMedio();
    const scene = vista.scene.filter((q) => permessa(q.id));
    if (unita && scene.length && qui && liv >= richiesto(qui)) { const x = fai({ t: 'scena', id: scene[0].id }); if (!x.err) { segna(scene[0].id); M.scene++; dbg('  scena', scene[0].id, 'g' + c.giorno, 'a', qui && qui.nome, 'liv', liv.toFixed(1)); return x; } }
    if (unita && vista.compagni.some((k) => k.parla && permessa('parla:' + k.id))) { const k = vista.compagni.find((q) => q.parla && permessa('parla:' + q.id)); const x = fai({ t: 'parla', id: k.id }); if (!x.err) { segna('parla:' + k.id); return x; } }
    if (!pronto && !alSicuro) { const dest = sicuri().filter((l) => !puoRialzare || l.tipo === 'citta').reduce((a, l) => (!a || C.dist(l, v[0]) < C.dist(a, v[0])) ? l : a, null); return (dest && vai(dest)) || fai({ t: 'camp', a: { t: 'fineTurno' } }); }
    // prossima tappa: prima gli atti più bassi, a parità il luogo più vicino
    const M_ = mete().filter((m) => !(m.l.q === v[0].q && m.l.r === v[0].r && unita)).sort((a, b) => ((a.l.partenza ? -1 : a.l.reg | 0) - (b.l.partenza ? -1 : b.l.reg | 0)) * 1000 + C.dist(a.l, v[0]) - C.dist(b.l, v[0]));
    const qui_ = mete().find((m) => m.l.q === v[0].q && m.l.r === v[0].r);
    if (M_.length || qui_) {
      if (!unita) return vai({ q: v[0].q, r: v[0].r }) || fai({ t: 'camp', a: { t: 'fineTurno' } });
      const m = M_[0] || qui_;
      if (liv < richiesto(m.l)) { if ((c.giorno | 0) > (opz.giorniMax || 45)) return { vuoto: true }; return caccia(v); }
      if (qui_ && !M_.length) return { vuoto: true };
      return vai(m.l) || fai({ t: 'camp', a: { t: 'fineTurno' } });
    }
    return { vuoto: true };
  }
  const conto = () => { const c = cc(); return { giorno: c.giorno, xp: c.eroi.reduce((a, e) => a + (e.xp | 0), 0), oro: c.oro }; };
  let ultimo = conto(), vuoti = 0, fermi = 0, a0 = null;
  while (!s.fine && M.passi++ < (opz.max || 5000)) {
    const f = AVV.fase(s), vitePrima = s.vite; let r;
    if (f === 'battaglia') r = battaglia();
    else if (f === 'dialogo') r = dialogo();
    else if (f === 'sotterraneo') r = sotto();
    else r = mappa();
    if (r && r.err) { M.errori.push(f + ': ' + r.err); if (M.errori.length > 20) { M.motivo = 'errori: ' + M.errori.slice(-3).join(' | '); break; } r = {}; }
    if (s.vite < vitePrima) { M.sconfitte++; M.soglia = livMedio() + .5; dbg('  ## sconfitta: vite', s.vite, 'giorno', cc().giorno); }
    if (opz.dbg && f === 'dialogo' && !(r && r.err)) { const q = s.racc.scena; if (q && q.nodo === (opz.ultimoNodo || '')) { /* niente */ } }
    if (r && r.vuoto) { // niente da fare: si chiude la sessione (nuove scene possono aprirsi al prossimo cantare)
      a0 = conto(); const x = fai({ t: 'chiudi' });
      if (x.err) { if (++vuoti > 12) { M.motivo = 'bloccata: ' + x.err; break; } const y = fai({ t: 'camp', a: { t: 'fineTurno' } }); if (y.err) { M.motivo = 'bloccata: ' + y.err; break; } continue; }
      vuoti = 0; M.sessioni++; M.battSess = 0; if (a0 && a0.xp === conto().xp && a0.oro === conto().oro && a0.giorno === conto().giorno) { if (++fermi >= 6) { M.motivo = 'stallo'; break; } } else fermi = 0; const a = conto(); M.giorniSessione.push(a.giorno - ultimo.giorno); M.xpSessione.push(a.xp - ultimo.xp); M.oroSessione.push(a.oro - ultimo.oro); ultimo = a;
      dbg('— sessione chiusa, giorno', a.giorno, 'xp', a.xp, 'oro', a.oro);
    } else vuoti = 0;
  }
  if (!s.fine && !M.motivo) M.motivo = 'passi esauriti';
  if (opz.mod) Object.assign(ADIF.D[opz.diff || 'normale'], d0);
  const c = cc(), v = viv();
  return { s, M, esito: s.fine ? s.fine.esito : 'bloccata', vinta: !!(s.fine && s.fine.vinta), giorni: c.giorno, vite: s.vite, perdizione: c.perdizione, livello: Math.round(c.eroi.reduce((a, e) => a + e.liv, 0) / c.eroi.length * 10) / 10, eroi: c.eroi.length, vivi: v.length, oro: c.oro, passi: M.passi };
}

module.exports = { gioca, squadra, SIGLE, CAP };

if (require.main === module) {
  const a = process.argv.slice(2), get = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
  const sigle = get('squadra', 'g,m,c,l').split(','), n = +get('n', 6), s0 = +get('seme', 1), stile = get('stile', 'furbo'), abilita = get('abilita', 'bravo'), diff = get('diff', 'normale'), mod = get('mod', '').split(',').filter(Boolean).reduce((o, kv) => { const [k, v] = kv.split('='); o[k] = +v; return o; }, {});
  const righe = []; const t0 = Date.now();
  for (let i = 0; i < n; i++) { const x = gioca({ sigle, seme: s0 + i, stile, abilita, diff, mod: Object.keys(mod).length ? mod : null, dbg: a.includes('--dbg') }); righe.push(x);
    if (!a.includes('--json')) console.log(`seme ${s0 + i}: ${x.esito}${x.M.motivo ? ' (' + x.M.motivo + ')' : ''} · giorni ${x.giorni} · liv ${x.livello} · vite ${x.vite} · battaglie ${x.M.vinte}/${x.M.battaglie} · sessioni ${x.M.sessioni} · perdizione ${x.perdizione} · passi ${x.passi}`); }
  if (a.includes('--json')) console.log(JSON.stringify(righe.map((x) => ({ esito: x.esito, giorni: x.giorni, livello: x.livello, vite: x.vite, M: x.M }))));
  else { const f = righe.filter((x) => x.vinta).length; console.log(`RIEPILOGO ${diff}${Object.keys(mod).length ? ' ' + JSON.stringify(mod) : ''} squadra ${sigle.join('')}: ${f}/${n} finite (${Math.round(100 * f / n)}%) · giorni medi ${(righe.filter((x) => x.vinta).reduce((q, x) => q + x.giorni, 0) / Math.max(1, f)).toFixed(0)} · vite medie ${(righe.reduce((q, x) => q + x.vite, 0) / n).toFixed(1)} · ${((Date.now() - t0) / 1000).toFixed(0)} s`); }
}
