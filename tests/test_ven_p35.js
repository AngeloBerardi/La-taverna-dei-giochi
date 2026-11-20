// Passo 35: la sfida al capo (accetta?, duello, resa dei predoni, morale e capo ferito, capitano del telefono che tocca, simulazione).
const assert = require('assert'), carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN, VDAT, VCAM, VST } = carica.multi(F, '({ VEN, VDAT, VCAM, VST })');
const J = x => JSON.stringify(x), K = x => JSON.parse(J(x)), S = VDAT.SFIDA;
VDAT.ACCESO.consiglio = true;
const base = VEN.nuovo(3); base.tregua = 1e9; base.dentro = -1; base.davanti = -1;
const BEN = { arma: 'spadone', armatura: 'maglia', scudo: null, elmo: 'bacinetto' };
// un incontro con un signore (tratto voluto) o con una banda di predoni; il capitano può avere livello e armi
function mk(o) {
  o = o || {}; const s = o.w || K(base), tu = VEN.TU(s), cap = VEN.capi(s)[0];
  if (o.liv != null) cap.liv = o.liv; if (o.pr != null) cap.ab.prodezza = o.pr; if (o.eq) Object.assign(cap.eq, o.eq);
  const p = s.p.find(q => q.k === 'sig'); p.dentro = -1; p.x = tu.x + .3; p.y = tu.y; p.via = []; p.sc = 0;
  if (o.tratto) s.sig[p.sig].tratto = o.tratto;
  if (o.pre) { p.k = 'pre'; p.faz = 'pre'; p.oro = 80 }
  s.incontro = { tipo: 'nemico', pid: [p.id], all: [], da: 'loro' }; s.rng = (o.seme || 1) * 7919 + 13; s.t += (o.seme || 1) * 37;
  return { s, p, tu, cap, sg: s.sig[p.sig] };
}
const eq = (a, b) => assert.strictEqual(J(a), J(b));
const scelta = (a, k) => a.scelte.find(x => x.k === k);
const sfide = a => a.scelte.filter(x => /^sfida/.test(x.k));

// ---- sfidaOk: il conto in chiaro, senza dadi
{
  const pru = mk({ tratto: 'prudente' }).s, r = VEN.sfidaOk(pru); assert.strictEqual(r.ok, false); assert(/testa/.test(r.tx)); assert(r.f.length);
  const avi = mk({ tratto: 'avido' }).s, a0 = VEN.sfidaOk(avi), a1 = VEN.sfidaOk(avi, { posta: true });
  assert.strictEqual(a0.ok, false); assert(/cento monete/.test(a0.tx)); assert.strictEqual(a0.posta, S.POSTA); assert.strictEqual(a1.ok, true);
  assert.strictEqual(VEN.sfidaOk(mk({ tratto: 'prode', liv: 30 }).s).ok, true, 'il prode non rifiuta mai');
  assert.strictEqual(VEN.sfidaOk(mk({ tratto: 'crudele', liv: 5 }).s).ok, true); assert.strictEqual(VEN.sfidaOk(mk({ tratto: 'crudele', liv: 6 }).s).ok, false);
  const cr = VEN.sfidaOk(mk({ tratto: 'crudele', liv: 3 }).s); eq(cr.f.map(x => x.v), [5, -3]);
  assert.strictEqual(VEN.sfidaOk(mk({ pre: 1 }).s).ok, true, 'un capobanda accetta');
  assert.strictEqual(VEN.sfidaOk(K(base)).err, 'Qui non c\'è nessun capo da sfidare');
}

// ---- l'anteprima: il bottone c'è solo quando la sfida è possibile
{
  const { s } = mk({ tratto: 'prode' }), a = VEN.anteprima(s), b = sfide(a); assert.strictEqual(b.length, 1); assert.strictEqual(b[0].k, 'sfida'); assert.strictEqual(b[0].ok, true); assert(/prode/i.test(b[0].info));
  const av = sfide(VEN.anteprima(mk({ tratto: 'avido' }).s))[0]; assert.strictEqual(av.k, 'sfida:p'); assert.strictEqual(av.oro, S.POSTA); assert(/monete/.test(av.info));
  const po = mk({ tratto: 'avido' }); VEN.TU(po.s).oro = 50; const sp = sfide(VEN.anteprima(po.s))[0]; assert.strictEqual(sp.ok, false); assert.strictEqual(sp.perche, 'Servono 100 monete');
  assert.strictEqual(VEN.scegli(po.s, 'sfida:p').err, 'Servono 100 monete');
  assert.strictEqual(VEN.scegli(mk({ tratto: 'avido' }).s, 'sfida').err.slice(0, 8), '«Per l\'o', 'senza posta l\'avido non si muove, e non conta come rifiuto');
  // già sfidato: il bottone sparisce e la scelta dà errore
  const x = mk({ tratto: 'prode' }); assert(VEN.scegli(x.s, 'sfida').s); assert.strictEqual(sfide(VEN.anteprima(x.s)).length, 0); assert.strictEqual(VEN.scegli(x.s, 'sfida').err, 'Hai già sfidato');
  assert(VEN.anteprima(x.s).avvisi.some(t => /sfida/.test(t)), 'l\'anteprima dice che il duello è lanciato');
  assert.strictEqual(scelta(VEN.anteprima(x.s), 'attacca').tx, 'Combatti il duello');
  // niente capo: nessun bottone; non un carovana; non in assedio
  const car = mk({ tratto: 'prode' }); car.p.k = 'car'; assert.strictEqual(sfide(VEN.anteprima(car.s)).length, 0); assert.strictEqual(VEN.scegli(car.s, 'sfida').err, 'Qui non c\'è nessun capo da sfidare');
  const ass = mk(); const cast = ass.s.l.find(l => l.tipo === 'castello'); ass.s.incontro = { tipo: 'assalto', lid: cast.id };
  assert.strictEqual(VEN.scegli(ass.s, 'sfida').err, 'Non durante un assedio'); assert.strictEqual(sfide(VEN.anteprima(ass.s)).length, 0);
  // interruttore spento: nulla di nuovo
  VDAT.ACCESO.consiglio = false; const sp2 = mk({ tratto: 'prode' }).s; assert.strictEqual(sfide(VEN.anteprima(sp2)).length, 0); assert.strictEqual(VEN.scegli(sp2, 'sfida').err, 'Scelta non valida');
  VDAT.ACCESO.consiglio = true;
}

// ---- il duello: la scheda è l'arena, uno contro uno, e il ritorno all'incontro
{
  const { s, cap } = mk({ tratto: 'prode', liv: 4 }); assert(VEN.scegli(s, 'sfida').s); assert.strictEqual(s.incontro.sfida, 'duello');
  const sc = VEN.campo(s); assert.strictEqual(sc.tipo, 'arena'); assert.strictEqual(sc.b.length, 1); assert.strictEqual(sc.b[0].n, 1); assert.strictEqual(sc.capi.length, 1); assert.strictEqual(sc.cap.nome, cap.nome);
  assert.strictEqual(sc.nomb, VEN.capoSfida(s).nome); assert.strictEqual(sc.b[0].st.pf, VDAT.SIG_CAMPO.pf);
  assert.strictEqual(VEN.scegli(s, 'attacca').campo.tipo, 'arena', '«Combatti» apre il duello');
  const r = VEN.esito(s, { vince: 'b', cad: [] }); assert(r.s && r.out); assert.strictEqual(r.out.sfida, 'persa'); assert(s.incontro, 'si torna all\'incontro'); assert.strictEqual(s.incontro.sfida, 'persa');
  assert.strictEqual(s.ferito, VEN.giorno(s)); assert.strictEqual(s.ult, r.out); assert.strictEqual(r.out.morti, 0, 'nessun uomo cade in duello');
  assert.strictEqual(VEN.campo(s).tipo, 'campo', 'dopo il duello la battaglia è quella vera'); assert.strictEqual(sfide(VEN.anteprima(s)).length, 0);
  // il capitano ferito combatte a metà
  const m = VEN.campo(s); assert.strictEqual(m.cap.pf, Math.max(1, Math.round(VEN.statCap(cap).pf * .5)));
  // puoi ancora ritirarti
  assert(VEN.scegli(s, 'fuggi').s); assert.strictEqual(s.incontro, null);
}

// ---- vittoria contro un signore: fama +5, la battaglia continua, morale nemico −20
{
  const { s } = mk({ tratto: 'prode' }), fama0 = s.fama, vinte0 = s.stat.vinte; VEN.scegli(s, 'sfida');
  const r = VEN.esito(s, { vince: 'a', cad: [] }); assert.strictEqual(r.out.sfida, 'vinta'); assert.strictEqual(s.fama, fama0 + S.FAMA); assert.strictEqual(s.stat.vinte, vinte0, 'non è ancora la battaglia');
  assert(s.incontro && s.incontro.sfida === 'vinta'); const sc = VEN.campo(s); eq(sc.morIni, { a: 0, b: -20 });
  assert.strictEqual(sc.capoB, undefined, 'senza le grandi battaglie il capo non è in campo');
  // con le grandi battaglie il capo parte ferito al 50%, anche se 28kr gli riassegna `capoB`
  VDAT.ACCESO.grandi = true; const g = VEN.campo(s); assert.strictEqual(g.capoB.pf, Math.round(VDAT.SIG_CAMPO.pf * S.CAPO_FERITO)); eq(g.morIni, { a: 0, b: -20 });
  const k = K(g); assert.strictEqual(k.capoB.pf, g.capoB.pf, 'la scheda resta JSON-clonabile');
  const n = VCAM.nuovo(g); assert.strictEqual(n.u.find(u => u.id === n.capoB).pf, g.capoB.pf); VDAT.ACCESO.grandi = false;
}

// ---- sconfitta: morale proprio −15 · rifiuto: morale nemico −10
{
  const { s } = mk({ tratto: 'prode' }); VEN.scegli(s, 'sfida'); VEN.esito(s, { vince: 'b', cad: [] }); eq(VEN.campo(s).morIni, { a: -15, b: 0 });
  const r = mk({ tratto: 'prudente' }); assert(VEN.scegli(r.s, 'sfida').s); assert.strictEqual(r.s.incontro.sfida, 'rifiutata'); eq(VEN.campo(r.s).morIni, { a: 0, b: -10 });
  assert(r.s.log.some(l => /rifiuta/.test(l.tx))); assert.strictEqual(VEN.scegli(r.s, 'sfida').err, 'Hai già sfidato');
  assert.strictEqual(VEN.campo(mk({ tratto: 'prode' }).s).morIni, undefined, 'senza sfida la scheda è quella di sempre');
  // chi perde paga la posta all'avido
  const a = mk({ tratto: 'avido' }), oro = VEN.TU(a.s).oro; VEN.scegli(a.s, 'sfida:p'); assert.strictEqual(a.s.incontro.posta, S.POSTA);
  VEN.esito(a.s, { vince: 'a', cad: [] }); assert.strictEqual(VEN.TU(a.s).oro, oro, 'vinto: nessuno paga');
  const b = mk({ tratto: 'avido' }), o2 = VEN.TU(b.s).oro, p2 = b.p.oro; VEN.scegli(b.s, 'sfida:p'); VEN.esito(b.s, { vince: 'b', cad: [] });
  assert.strictEqual(VEN.TU(b.s).oro, o2 - S.POSTA); assert.strictEqual(b.p.oro, p2 + S.POSTA);
}

// ---- vittoria contro i predoni: la banda si arrende, niente battaglia
{
  const { s, tu, p } = mk({ pre: 1 }); tu.merci.grano = 0; p.porta = { m: 'grano', q: 9 }; const v0 = s.stat.vinte, o0 = tu.oro, f0 = s.fama, pid = p.id, nPrig = s.prig.length; VEN.scegli(s, 'sfida');
  // il bottino intero, per confronto: stessa partita con una vittoria normale
  const w = mk({ pre: 1 }); w.s.incontro.sfida = 'vinta'; const wi = VEN.esito(w.s, { vince: 'a', cad: [] }).out, intero = wi.oro, famaIntera = wi.fama;
  const r = VEN.esito(s, { vince: 'a', cad: [] }); assert(r.s); assert.strictEqual(r.out.sfida, 'resa'); assert.strictEqual(s.incontro, null, 'nessuna battaglia');
  assert.strictEqual(s.stat.vinte, v0 + 1); assert.strictEqual(r.out.oro, intero - Math.floor(intero * .5)); assert.strictEqual(tu.oro, o0 + r.out.oro);
  assert.strictEqual(s.fama, f0 + famaIntera + S.FAMA, 'fama: vittoria normale più quella del duello, una volta sola'); assert.strictEqual(r.out.fama, famaIntera + S.FAMA, 'il riepilogo dice quanto è entrato');
  assert.strictEqual(r.out.bottino.length, 1); assert.strictEqual(r.out.bottino[0][1], 9 - Math.floor(9 * .5), 'metà anche delle merci'); assert.strictEqual(tu.merci.grano, r.out.bottino[0][1]); assert(s.prig.length > nPrig, 'il capobanda è prigioniero'); assert(!s.p.some(q => q.id === pid && q.tr.length), 'i predoni sono dispersi');
  assert(s.prig.some(e => /^cb_/.test(e.t)));
}
// il covo: il capobanda è dentro e la sfida lo butta fuori senza assalto
{
  const s = K(base), covo = s.l.find(l => l.tipo === 'covo'); s.incontro = { tipo: 'assalto', lid: covo.id };
  const a = VEN.anteprima(s); assert(sfide(a).length === 1 && sfide(a)[0].ok); assert(VEN.scegli(s, 'sfida').s); assert.strictEqual(VEN.campo(s).tipo, 'arena');
  assert.strictEqual(VEN.campo(s).nomb[0], VEN.campo(s).nomb[0].toUpperCase());
  const r = VEN.esito(s, { vince: 'a', cad: [] }); assert.strictEqual(r.out.sfida, 'resa'); assert.strictEqual(s.incontro, null); assert.strictEqual(covo.g.length, 0); assert(s.stat.covi >= 1);
}

// ---- la Volpe accetta sempre
{
  const { s, p } = mk(); p.k = 'riv'; p.faz = 'mer'; const o = VEN.sfidaOk(s); assert(o.ok); assert(VEN.scegli(s, 'sfida').s);
  const sc = VEN.campo(s); assert.strictEqual(sc.b[0].st.pf, VDAT.VOLPE_CAMPO.pf); assert.strictEqual(sc.nomb, 'La Volpe Rossa');
}

// ---- compagnia: un solo bottone (capitano 0) finché la scelta non porta il posto; `sfida:K` resta nel motore; i due telefoni vedono lo stesso stato
{
  const { s } = mk({ tratto: 'prode' }); s.soci = [VEN.nuovoCap('Bruno')]; s.soci[0].liv = 3;
  eq(sfide(VEN.anteprima(s)).map(x => x.k), ['sfida'], 'nessun bottone per il capitano di un altro telefono');
  assert(VEN.scegli(s, 'sfida:1').s); assert.strictEqual(s.incontro.sfk, 1); const sc = VEN.campo(s); assert.strictEqual(sc.cap.nome, 'Bruno'); assert.strictEqual(sc.capi.length, 1);
  const t = mk({ tratto: 'crudele', liv: 5 }); t.s.soci = [VEN.nuovoCap('Bruno')]; t.s.soci[0].liv = 9;   // il crudele accetta il primo capitano e rifiuta il secondo
  assert(VEN.scegli(t.s, 'sfida:1').s); assert.strictEqual(t.s.incontro.sfida, 'rifiutata');
  const u = mk({ tratto: 'crudele', liv: 5 }); u.s.soci = [VEN.nuovoCap('Bruno')]; u.s.soci[0].liv = 9; assert(VEN.scegli(u.s, 'sfida').s); assert.strictEqual(u.s.incontro.sfida, 'duello');
  // dalla stanza: la stessa mossa su due copie dello stato dà lo stesso stato, dal posto 0 come dal posto 1
  const G = VST.nuova(2, ['Alba', 'Bruno'], { seme: 3 }); G.w.tregua = 1e9; G.w.dentro = -1; G.w.davanti = -1; mk({ w: G.w, tratto: 'prode' });
  const m = (g, seat, a) => VST.act(g, Object.assign({ seat, fino: G.w.t }, a));
  for (const seat of [0, 1]) {
    const x = m(K(G), seat, { t: 'scegli', v: 'sfida' }), y = m(K(G), seat, { t: 'scegli', v: 'sfida' }); assert(!x.err, x.err); eq(x.s, y.s); assert.strictEqual(x.s.w.incontro.sfida, 'duello');
    const z = m(x.s, seat, { t: 'scegli', v: 'attacca' }), z2 = m(K(x.s), seat, { t: 'scegli', v: 'attacca' }); assert(!z.err, z.err); eq(z.s, z2.s); assert.strictEqual(z.s.b.c.tipo, 'arena');
    const c = m(z.s, 0, { t: 'b-cap', o: { x: 50, y: 20 } }); assert(!c.err, c.err); eq(c.s, m(K(z.s), 0, { t: 'b-cap', o: { x: 50, y: 20 } }).s);
  }
}

// ---- equilibrio: un capitano di livello 8 ben armato batte un capobanda, uno di livello 1 no (30 semi)
{
  const vince = (liv, eq, pr) => { let v = 0; for (let i = 1; i <= 30; i++) { const { s } = mk({ pre: 1, liv, eq, pr, seme: i }); assert(VEN.scegli(s, 'sfida').s); if (VCAM.risolvi(VEN.campo(s)).vince === 'a') v++ } return v };
  const forte = vince(8, BEN, 3), debole = vince(1, {}, 0); console.log('duello contro un capobanda: livello 8 ' + forte + '/30, livello 1 ' + debole + '/30');
  assert(forte >= 18, 'livello 8: ' + forte + '/30'); assert(debole <= 12, 'livello 1: ' + debole + '/30');
}

// ---- simulazione: 60 incontri tra signori, predoni e Volpe, con duello giocato dal motore e battaglia vera dopo; stato sempre JSON-clonabile, nessun errore
{
  let duelli = 0, rese = 0, rif = 0, giochi = 0;
  for (let i = 1; i <= 60; i++) {
    const tr = ['prode', 'avido', 'crudele', 'prudente'][i % 4], { s, p } = mk({ tratto: tr, pre: i % 3 === 0, seme: i, liv: i % 3 === 0 ? 8 : 1 + i % 9, eq: i % 3 === 0 ? BEN : null, pr: i % 3 === 0 ? 3 : null });
    if (i % 7 === 0) { p.k = 'riv'; p.faz = 'mer' }
    const posta = tr === 'avido' && p.k === 'sig'; const r = VEN.scegli(s, posta ? 'sfida:p' : 'sfida'); assert(r.s, r.err);
    if (s.incontro.sfida === 'rifiutata') { rif++; assert.strictEqual(VEN.campo(s).tipo, 'campo'); continue }
    assert.strictEqual(s.incontro.sfida, 'duello'); duelli++;
    const riep = VCAM.risolvi(VEN.campo(s)), e = VEN.esito(s, riep); assert(e.s, e.err); assert(!riep.cad || riep.cad.every(x => x.p !== 0), 'in duello cade solo il capo o il capitano'); J(s);
    if (e.out.sfida === 'resa') { rese++; assert.strictEqual(s.incontro, null); continue }
    assert(s.incontro, 'dopo il duello l\'incontro resta'); const sc = VEN.campo(s); assert.notStrictEqual(sc.tipo, 'arena'); J(sc);
    const f = VEN.esito(s, VCAM.risolvi(sc)); assert(f.s, f.err); assert.strictEqual(s.incontro, null); giochi++; J(s);
  }
  console.log('sfide: duelli ' + duelli + ', rese ' + rese + ', rifiuti ' + rif + ', battaglie dopo il duello ' + giochi); assert(duelli > 30 && rif >= 10 && rese >= 3);
}
console.log('p35 ok');
