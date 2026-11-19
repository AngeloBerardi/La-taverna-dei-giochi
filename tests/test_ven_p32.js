// Passo 32: la strategia prima della battaglia (esplorazione, campo, alba, notte, imboscata, pali, retroguardia, marcia).
const assert = require('assert'), carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN, VDAT, VCAM } = carica.multi(F, '({ VEN, VDAT, VCAM })');
const J = x => JSON.stringify(x), K = x => JSON.parse(J(x)), S = VDAT.STRAT;
VDAT.ACCESO.consiglio = true;
const base = VEN.nuovo(3); base.tregua = 1e9; base.dentro = -1; base.davanti = -1;
const M = VEN.mappaDi(base), T = VEN._.cella;
// una casella del terreno voluto con almeno un terreno diverso nei dintorni
const dove = t => { for (let y = 8; y < M.G - 8; y++) for (let x = 8; x < M.G - 8; x++) if (M.T[T(M, x + .5, y + .5)] === t) { const vic = new Set(); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) vic.add(M.T[T(M, x + .5 + dx, y + .5 + dy)]); if ([1, 2, 3].filter(q => q !== t && vic.has(q)).length) return [x + .5, y + .5]; } return null };
const TR = (f, t, c) => [{ t: 'val_f2', n: f }, { t: 'val_t2', n: t }, { t: 'val_c3', n: c }].filter(e => e.n);
// un incontro: il signore (rango 2) ci viene addosso (da:'loro') su un terreno voluto
function mk(terr, o) {
  o = o || {}; const s = K(base), tu = VEN.TU(s), pos = dove(terr); assert(pos, 'terreno ' + terr);
  tu.x = pos[0]; tu.y = pos[1]; tu.ord = null; tu.via = []; tu.merci = { grano: 40 };
  const sig = s.p.find(p => p.k === 'sig' && !s.sig[p.sig].re); sig.x = tu.x + .3; sig.y = tu.y; sig.tr = TR(o.f == null ? 23 : o.f, o.t == null ? 14 : o.t, o.c == null ? 7 : o.c); sig.dentro = -1; sig.via = []; sig.sc = 0;
  VEN.capi(s)[0].ab.esplora = o.E || 0; if (o.rango != null) s.sig[sig.sig].esp = (o.rango - 2) * 6;
  s.incontro = { tipo: 'nemico', pid: [sig.id], all: [], da: o.da || 'loro' }; if (o.nonotte) s.t = 12 * 60; if (o.notte) s.t = 23 * 60;
  return { s, sig, tu };
}
const scelta = (a, k) => a.scelte.find(x => x.k === k);
const tot = e => e.f + e.t + e.c;

// ---- l'esplorazione nasconde e mostra i numeri (N = 2)
{
  const real = { f: 23, t: 14, c: 7 };
  const vago = VEN.anteprima(mk(1, { E: 0 }).s).loro;
  assert.strictEqual(vago.vista, 'vaga'); assert.strictEqual(vago.stima, 'circa 40 uomini'); assert.strictEqual(tot(vago), 0, 'niente numeri per tipo');
  const spanne = VEN.anteprima(mk(1, { E: 2 }).s).loro;
  assert.strictEqual(spanne.vista, 'a spanne'); assert.deepStrictEqual([spanne.f, spanne.t, spanne.c], [20, 10, 10]); assert.strictEqual(spanne.stima, undefined); assert(spanne.dott);
  const esatta = VEN.anteprima(mk(1, { E: 3 }).s).loro;
  assert.strictEqual(esatta.vista, 'esatta'); assert.deepStrictEqual([esatta.f, esatta.t, esatta.c], [23, 14, 7]); assert(esatta.dott && VEN.dottrina(esatta.dott)); assert.strictEqual(esatta.ondate, 0);
  // un rango alto prevede due ondate; con rango 3 e E=4 si vedono
  const alto = VEN.anteprima(mk(1, { E: 4, rango: 3 }).s).loro; assert.strictEqual(alto.ondate, 2);
  // «Risolvi» dice le perdite attese a parole
  const a = VEN.anteprima(mk(1, { E: 3 }).s), auto = scelta(a, 'auto'); assert(/perde|perdite/.test(auto.info), auto.info);
  // spento: l'anteprima è quella di sempre
  VDAT.ACCESO.consiglio = false; const sp = VEN.anteprima(mk(1, { E: 0 }).s); assert.strictEqual(sp.loro.stima, undefined); assert(!sp.scelte.some(x => /^strat:/.test(x.k))); assert.strictEqual(scelta(sp, 'auto').info, 'Lasci decidere ai dadi: più rapido, meno controllo.');
  VDAT.ACCESO.consiglio = true;
}

// ---- spento: la scelta non esiste e la scheda non cambia
{
  VDAT.ACCESO.consiglio = false; const { s } = mk(1, { E: 3 }); const r = VEN.scegli(s, 'strat:alba'); assert.strictEqual(r.err, 'Scelta non valida');
  const sc = VEN.campo(s); assert(!sc.mod && !sc.fatica0 && !sc.morIni && !sc.imboscata); VDAT.ACCESO.consiglio = true;
}

// ---- le scelte compaiono, grigie col perché
{
  const a = VEN.anteprima(mk(1, { E: 3, nonotte: 1 }).s), st = a.scelte.filter(x => /^strat:/.test(x.k));
  assert(st.length >= 5, 'le scelte strategiche ci sono');
  const imb = scelta(a, 'strat:imboscata'); assert.strictEqual(imb.ok, false); assert.strictEqual(imb.perche, 'Serve un bosco o una collina');
  const notte = scelta(a, 'strat:notte'); assert.strictEqual(notte.ok, false); assert.strictEqual(notte.perche, 'Non è notte');
  assert(st.some(x => /^strat:retro:/.test(x.k) && x.ok), 'la retroguardia ha un reparto da lasciare');
  const r = VEN.scegli(mk(1, { E: 3 }).s, 'strat:imboscata'); assert.strictEqual(r.err, 'Serve un bosco o una collina.');
}

// ---- imboscata: in bosco serve E >= N + 1, e il nemico deve venire verso di noi
{
  const { s } = mk(2, { E: 2 }); assert.strictEqual(scelta(VEN.anteprima(s), 'strat:imboscata').ok, false);
  assert.strictEqual(scelta(VEN.anteprima(s), 'strat:imboscata').perche, 'Non conoscete abbastanza i loro movimenti');
  const b = mk(2, { E: 3, da: 'tu' }).s; assert.strictEqual(scelta(VEN.anteprima(b), 'strat:imboscata').perche, 'Il nemico non viene verso di voi');
  const c = mk(2, { E: 3 }).s, r = VEN.scegli(c, 'strat:imboscata'); assert(r.s); assert.strictEqual(c.incontro.strat.imb, 1);
  const sc = VEN.campo(c); assert.strictEqual(sc.imboscata, 'a'); assert.strictEqual(sc.colonna, 'b'); assert.strictEqual(sc.morIni.b, S.IMB_MOR); assert.strictEqual(sc.mod.b.f.att, S.IMB_MOD); assert.strictEqual(sc.mod.b.c.dif, S.IMB_MOD); assert(!sc.mod.a.f);
  // si può rinunciare
  VEN.scegli(c, 'strat:imboscata'); assert.strictEqual(c.incontro.strat.imb, undefined); assert.strictEqual(VEN.campo(c).imboscata, undefined);
}

// ---- fortifica: la scheda ha i pali, costa un'ora e dieci razioni
{
  const { s, tu } = mk(1, { E: 0 }); const t0 = s.t, r0 = VEN.razioni(tu), sc0 = VEN.campo(s); assert(!sc0.zone || !sc0.zone.length || !sc0.zone.some(z => z.k === 'pali'));
  const r = VEN.scegli(s, 'strat:fortifica'); assert(r.s, J(r)); assert(s.incontro, 'l\'incontro resta'); assert.strictEqual(s.incontro.strat.fort, 1);
  assert.strictEqual(s.t, t0 + 60); assert.strictEqual(VEN.razioni(tu), r0 - S.FORT_VIVERI);
  const sc = VEN.campo(s), pali = sc.zone.filter(z => z.k === 'pali'); assert.strictEqual(pali.length, 1); assert(pali[0].rx > 0 && pali[0].ry > 0);
  assert.strictEqual(VEN.scegli(s, 'strat:fortifica').err, 'I pali sono già piantati.');
  // senza viveri non si fortifica
  const d = mk(1, {}); d.tu.merci = {}; assert.strictEqual(VEN.scegli(d.s, 'strat:fortifica').err, 'Servono ' + S.FORT_VIVERI + ' razioni di viveri.');
  // mentre ci si fortifica non si può essere attaccati da un altro nemico che entra in contatto: la tregua è la stessa di prima
  assert.strictEqual(s.tregua, 1e9);
}

// ---- alba: il tempo avanza fino alle 6
{
  const { s } = mk(1, { E: 0, notte: 1, rango: 2 }); assert(VEN.notte(s));
  const r = VEN.scegli(s, 'strat:alba'); assert(r.s, J(r)); assert.strictEqual(VEN.ora(s), 6); assert.strictEqual(s.t % 60, 0); assert(s.incontro, 'rango 2: resta'); assert.strictEqual(s.incontro.strat.alba, 1);
  assert.strictEqual(VEN.scegli(s, 'strat:alba').err, 'Avete già aspettato fino all\'alba.');
  // di giorno si aspetta il mattino dopo
  const g = mk(1, { nonotte: 1 }); g.s.t = 3 * 1440 + 10 * 60; VEN.scegli(g.s, 'strat:alba'); assert.strictEqual(VEN.ora(g.s), 6); assert.strictEqual(VEN._.giorno(g.s), 5);
  // una scena del racconto che ferma il tempo a mezzanotte: l'alba non conta come fatta
  const h = mk(1, { nonotte: 1 }); h.s.t = 12 * 1440 + 10 * 60; VEN.scegli(h.s, 'strat:alba'); if (VEN.ora(h.s) !== 6) { assert(h.s.rac && h.s.rac.scena); assert(!h.s.incontro.strat.alba) }
  // un nemico di rango 0 se ne va una volta su due; l'altra volta resta (e l'alba toglie il «buio» dalla scheda)
  let via = 0, resta = 0;
  for (let k = 0; k < 24; k++) { const m = mk(1, { rango: 0, notte: 1 }); m.s.rng = (m.s.rng + k * 7919) | 0; VEN.scegli(m.s, 'strat:alba'); if (m.s.incontro) { resta++; assert.strictEqual(VEN.campo(m.s).notte, false) } else via++; }
  assert(via >= 4 && resta >= 4, 'se ne va ' + via + ', resta ' + resta);
  // rinforzi vicini: un'altra compagnia ostile entro pochi passi si unisce
  const m = mk(1, { notte: 1 }), alt = m.s.p.find(p => p.k === 'pre' && p.id !== m.sig.id); alt.x = m.sig.x + 1; alt.y = m.sig.y; alt.dentro = -1; alt.sc = 0; alt.fermo = 1e9;
  VEN.scegli(m.s, 'strat:alba'); assert(m.s.incontro && m.s.incontro.pid.includes(alt.id), 'rinforzi');
}

// ---- notte: tiratori meno precisi per tutti; un nemico di rango <= 2 parte in disordine
{
  const { s } = mk(1, { E: 0, notte: 1 }), sc0 = VEN.campo(s); assert(sc0.rango.b === 2 && !sc0.mod);
  assert(VEN.scegli(s, 'strat:notte').s); const sc = VEN.campo(s);
  for (const l of ['a', 'b']) for (const g of ['f', 't', 'c']) assert.strictEqual(sc.mod[l][g].git, S.GIT_NOTTE);
  assert.strictEqual(sc.fatica0.b, S.FATICA_NOTTE); assert.strictEqual(sc.rango.b, 0); assert.strictEqual(sc.morIni.b, S.NOTTE_MOR);
  // un nemico di rango 3 non è colto in disordine, ma la gittata cala lo stesso
  const m = mk(1, { notte: 1, rango: 3 }); VEN.scegli(m.s, 'strat:notte'); const sm = VEN.campo(m.s); assert.strictEqual(sm.mod.a.t.git, S.GIT_NOTTE); assert(!sm.fatica0 || !sm.fatica0.b); assert.strictEqual(sm.rango.b, 3);
}

// ---- marcia: oltre 14 ore su 24 si arriva stanchi
{
  const { s, tu } = mk(1, { E: 3 }); assert(!VEN.campo(s).fatica0, 'riposati: nessuna fatica');
  tu.marcia = { o: new Array(15).fill(1).concat(new Array(5).fill(0)), x: tu.x, y: tu.y }; assert.strictEqual(VEN.oreMarcia(s), 15);
  assert.strictEqual(VEN.campo(s).fatica0.a, S.FATICA_MARCIA); assert(VEN.anteprima(s).avvisi.some(x => /marciato/.test(x)));
  tu.marcia.o = new Array(14).fill(1); assert(!VEN.campo(s).fatica0, '14 ore non bastano');
  // l'ascoltatore di `ora` conta le ore in cui ci si è mossi e tiene le ultime 24
  const t = K(base), p = VEN.TU(t); for (let h = 0; h < 30; h++) { if (h % 2) p.x += 1; VEN.ganci('ora', t); }
  assert.strictEqual(t.p[0].marcia.o.length, 24); assert.strictEqual(VEN.oreMarcia(t), 12);
}

// ---- il campo: due terreni, scegli tu (se esplori abbastanza, o se il nemico ti attacca e sei fermo)
{
  const a = mk(1, { E: 0, da: 'tu' }); assert.strictEqual(scelta(VEN.anteprima(a.s), 'strat:campo').ok, false);
  const b = mk(1, { E: 0, da: 'loro' }); b.tu.marcia = { o: [1, 1, 0], x: b.tu.x, y: b.tu.y }; assert.strictEqual(scelta(VEN.anteprima(b.s), 'strat:campo').ok, true, 'fermo, attaccato');
  b.tu.marcia.o = [0, 1]; assert.strictEqual(scelta(VEN.anteprima(b.s), 'strat:campo').ok, false); assert.strictEqual(scelta(VEN.anteprima(b.s), 'strat:campo').perche, 'Eravate in marcia: niente scelta del campo');
  const c = mk(1, { E: 2 }), t0 = VEN.campo(c.s).terreno; assert.strictEqual(t0, 1);
  assert(VEN.scegli(c.s, 'strat:campo').s); const t1 = c.s.incontro.strat.camp; assert([2, 3].includes(t1));
  const sc = VEN.campo(c.s); assert.strictEqual(sc.terreno, t1); assert.strictEqual(sc.scena.pend, t1 === 3 ? 1 : 0); assert.strictEqual(VEN.anteprima(c.s).scena.terreno, t1);
  const alt = K(c.s); VEN.scegli(alt, 'strat:campo'); assert.strictEqual(alt.incontro.strat.camp, undefined, 'si torna al terreno di prima');
  // scelto un campo senza bosco né colline, l'imboscata cade
  const d = mk(2, { E: 3 }); VEN.scegli(d.s, 'strat:imboscata'); assert.strictEqual(d.s.incontro.strat.imb, 1); d.s.incontro.strat.camp = 1; VEN.scegli(d.s, 'strat:campo'); assert.strictEqual(d.s.incontro.strat.camp, undefined);
  assert.strictEqual(d.s.incontro.strat.imb, 1, 'tornati nel bosco l\'imboscata resta');
  const e = mk(2, { E: 3 }); VEN.scegli(e.s, 'strat:imboscata'); e.s.incontro.strat.camp = 0; e.s.incontro.strat.camp = undefined; delete e.s.incontro.strat.camp;
  e.s.incontro.strat.imb = 1; const sx = VEN.campo(e.s); assert.strictEqual(sx.imboscata, 'a');
}

// ---- retroguardia: si risolve una battaglia piccola e si scappa senza battaglia
{
  const uom = (s, t) => { const e = VEN.TU(s).tr.find(e => e.t === t); return e ? e.n : 0 };
  // reparto forte contro un terzo di pochi: torna (meno i caduti)
  const w = mk(1, { E: 0, f: 6, t: 0, c: 0 }); w.tu.tr = [{ t: 'val_f2', n: 20 }, { t: 'val_t2', n: 6 }];
  const k = scelta(VEN.anteprima(w.s), 'strat:retro:val_f2'); assert(k && k.ok);
  const nem0 = w.sig.tr.reduce((a, e) => a + e.n, 0), m0 = w.tu.mor, tot0 = VEN.uomini(w.tu);
  const r = VEN.scegli(w.s, 'strat:retro:val_f2'); assert(r.s, J(r)); assert.strictEqual(w.s.incontro, null, 'si scappa senza battaglia');
  assert(uom(w.s, 'val_f2') >= 15 && uom(w.s, 'val_t2') === 6, 'vince: il reparto resta con la compagnia'); assert.strictEqual(w.tu.mor, m0 + S.RETRO_MOR);
  assert(w.sig.tr.reduce((a, e) => a + e.n, 0) < nem0 || nem0 < 3, 'il nemico ha perso qualcuno'); assert(w.sig.fermo > w.s.t && w.s.tregua > w.s.t);
  // reparto debole contro un terzo di molti: perso, non torna
  const l = mk(1, { E: 0, f: 60, t: 30, c: 30 }); l.tu.tr = [{ t: 'val_f2', n: 2 }, { t: 'val_t2', n: 8 }];
  const r2 = VEN.scegli(l.s, 'strat:retro:val_f2'); assert(r2.s); assert.strictEqual(l.s.incontro, null); assert.strictEqual(uom(l.s, 'val_f2'), 0, 'il reparto lasciato non torna'); assert.strictEqual(uom(l.s, 'val_t2'), 8);
  assert(l.s.log.some(x => /travolta/.test(x.tx)));
  // si possono lasciare solo uomini che ci sono
  const z = mk(1, {}); assert.strictEqual(VEN.scegli(z.s, 'strat:retro:fer_f9').err, 'Nessuno di loro è in grado di restare.');
  // ripetibile: stesso stato → stesso esito
  const a1 = mk(1, { f: 40, t: 20, c: 10 }), a2 = K(a1.s); VEN.scegli(a1.s, 'strat:retro:' + VEN.TU(a1.s).tr[0].t); VEN.scegli(a2, 'strat:retro:' + VEN.TU(a2).tr[0].t); assert.strictEqual(J(a1.s), J(a2));
}

// ---- il nemico accorto (rango >= 3) sceglie lui: imboscata nel bosco se esplori poco, notte se sei stanco
{
  const att = (terr, o) => { const m = mk(terr, Object.assign({ rango: 3 }, o)); const s = m.s; s.incontro = null; const inc = { tipo: 'nemico', pid: [m.sig.id], all: [], da: 'loro' }; s.incontro = inc; VEN.ganci('incontro', s, inc); return { s, inc, m } };
  const a = att(2, { E: 1 }); assert.strictEqual(a.inc.strat.ia, 'imb'); assert(VEN.anteprima(a.s).avvisi.some(x => /colto di sorpresa/.test(x)));
  const sc = VEN.campo(a.s); assert.strictEqual(sc.imboscata, 'b'); assert.strictEqual(sc.colonna, 'a'); assert.strictEqual(sc.morIni.a, S.IMB_MOR);
  assert.strictEqual(scelta(VEN.anteprima(a.s), 'strat:campo').perche, 'Vi hanno colti di sorpresa');
  assert.strictEqual(att(2, { E: 3 }).inc.strat, undefined, 'esplori abbastanza: nessuna sorpresa');
  assert.strictEqual(att(1, { E: 0 }).inc.strat, undefined, 'in pianura non c\'è bosco');
  const n = (() => { const m = mk(1, { rango: 3, notte: 1 }); m.tu.marcia = { o: new Array(16).fill(1), x: m.tu.x, y: m.tu.y }; const inc = m.s.incontro; VEN.ganci('incontro', m.s, inc); return { m, inc } })();
  assert.strictEqual(n.inc.strat.ia, 'notte'); assert.strictEqual(VEN.campo(n.m.s).mod.a.t.git, S.GIT_NOTTE); assert(VEN.anteprima(n.m.s).avvisi.some(x => /di notte/.test(x)));
  // un nemico di rango basso non lo fa, e una compagnia che attacchiamo noi nemmeno
  assert.strictEqual(att(2, { E: 1, rango: 2 }).inc.strat, undefined);
  const noi = mk(2, { rango: 3, da: 'tu' }); VEN.ganci('incontro', noi.s, noi.s.incontro); assert.strictEqual(noi.s.incontro.strat, undefined);
}

// ---- salvataggio a metà incontro con `strat`: si riapre uguale
{
  const { s } = mk(2, { E: 3, nonotte: 1 }); VEN.scegli(s, 'strat:imboscata'); VEN.scegli(s, 'strat:fortifica');
  const sc0 = J(VEN.campo(s)), an0 = J(VEN.anteprima(s)), aperto = VEN.apri(VEN.salva(s));
  assert(aperto && aperto.incontro.strat.imb === 1 && aperto.incontro.strat.fort === 1);
  assert.strictEqual(J(VEN.campo(aperto)), sc0); assert.strictEqual(J(VEN.anteprima(aperto)), an0);
  // anche il vecchio salvataggio, senza `strat`, si apre
  const v = mk(1, {}); assert.strictEqual(v.s.incontro.strat, undefined); assert(VEN.apri(VEN.salva(v.s)).incontro);
}

// ---- i motori restano ripetibili: niente Math.random, Date.now, pow, exp, log, trigonometria
{
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/js/motori/28kk-ven-strategia.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/Math\.(random|pow|exp|log|sin|cos|tan|atan|hypot|cbrt)|Date\.now|\*\*/.test(src));
}
console.log('p32 ok');
