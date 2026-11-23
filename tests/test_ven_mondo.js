// Compagnia di ventura, mondo libero (VEN): mappa ripetibile e tutta raggiungibile, ordini e tempo, mercato, reclute,
// promozioni, paga e viveri, incontri e battaglie, incarichi, servizio e feudi, assedio, prigionia, salvataggio,
// capitano accorto che cresce e capitano sconsiderato che si rovina, mondo che vive da solo.
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_SENZA_VOCI;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const gioca = require('./bot_ven.js')(V, D);
const ok = x => { assert(!x.err, x.err); return x; };
const va = (s, lid) => { ok(V.ordina(s, { t: 'entra', lid })); let g = 0; while (s.dentro !== lid && s.davanti !== lid && g++ < 4000) { if (s.incontro) { const x = V.scegli(s, 'fuggi'); if (x.err) V.scegli(s, 'lascia'); if (s.incontro) V.auto(s); V.ordina(s, { t: 'entra', lid }); } if (s.rotta > s.t || s.prigioniero) { V.ordina(s, { t: 'aspetta', ore: 4 }); V.passo(s, 240); V.ordina(s, { t: 'entra', lid }); } V.passo(s, 20); } assert(s.dentro === lid || s.davanti === lid, 'non arrivo a ' + s.l[lid].nome); };

// mappa: ripetibile, 27 luoghi su terra percorribile, tutti collegati, strade tracciate
for (const seme of [1, 7, 2026]) {
  const M = V.mappa(seme); assert.strictEqual(M.G, 128); assert(M.luoghi.length >= 90, 'pochi luoghi: ' + M.luoghi.length); assert(M.covi.length >= 4);
  for (const l of M.luoghi) assert(V.passa(M, l.x, l.y), l.nome + ' è su terra non percorribile');
  const a = M.luoghi[0]; for (const l of M.luoghi) if (l !== a) assert(V.via(M, a.x, a.y, l.x, l.y).length > 0, 'nessuna via per ' + l.nome);
  for (let i = 0; i < M.luoghi.length; i++) for (let j = i + 1; j < M.luoghi.length; j++) assert(V.dist(M.luoghi[i], M.luoghi[j]) >= 2.5, 'luoghi sovrapposti');
  assert(M.S.reduce((x, y) => x + y, 0) > 300, 'poche strade'); assert(V.alt(seme, 10.5, 20.5) === V.alt(seme, 10.5, 20.5));
  for (const f of D.REGNI) { const n = M.luoghi.filter(l => l.faz === f); assert(n.filter(l => l.tipo === 'citta').length === 1 && n.filter(l => l.tipo === 'castello').length === 4 && n.filter(l => l.tipo === 'villaggio').length === 8, f + ': regno incompleto'); }
  for (const t of ['porto', 'monastero', 'locanda', 'rovine', 'covo']) assert(M.luoghi.filter(l => l.tipo === t).length >= 4, 'pochi luoghi di tipo ' + t);
  assert(new Set(M.luoghi.map(l => l.nome)).size === M.luoghi.length, 'nomi doppi');
}
// stato: JSON puro; salvare e riaprire dà la stessa partita
{
  const s = V.nuovo(5, { nome: 'Lapo' }), r = carica.rng(3); gioca(s, 4, true, r);
  const t = V.apri(V.salva(s)); assert(t, 'il salvataggio si riapre'); assert.strictEqual(V.salva(t), V.salva(s));
  const r1 = carica.rng(9), r2 = carica.rng(9); gioca(s, 3, true, r1); gioca(t, 3, true, r2); assert.strictEqual(V.salva(t), V.salva(s), 'stesse mosse, stesso mondo');
  assert.strictEqual(V.apri('{"v":9}'), null); assert.strictEqual(V.apri('rotto'), null);
  assert.notStrictEqual(V.salva(V.nuovo(5)), V.salva(V.nuovo(6)));
}
// ordini, viaggio, errori
{
  const s = V.nuovo(7), tu = V.TU(s);
  assert(V.ordina(s, { t: 'vai', x: -3, y: 2 }).err); assert(V.ordina(s, { t: 'entra', lid: 99 }).err); assert(V.ordina(s, { t: 'segui', pid: 9999 }).err); assert(V.ordina(s, { t: 'vola' }).err);
  const x0 = tu.x, y0 = tu.y, t0 = s.t; V.passo(s, 30); assert(s.t === t0 + 30 && tu.x === x0 && tu.y === y0, 'senza ordini il tempo scorre e la compagnia sta ferma');
  const vil = s.l.filter(l => l.tipo === 'villaggio' && !V.nemiche(s, 'tu', l.faz)).sort((a, b) => V.dist(a, tu) - V.dist(b, tu))[0]; va(s, vil.id);
  assert(s.dentro === vil.id); const t1 = s.t; V.passo(s, 50); assert(s.t === t1, 'dentro un luogo il tempo sta fermo');
  // reclute: limite, monete, errori
  const rec = vil.rec, oro = tu.oro, n0 = V.uomini(tu); assert(rec > 0); ok(V.fai(s, { a: 'recluta', n: 1 })); assert(V.uomini(tu) === n0 + 1 && tu.oro === oro - D.INGAGGIO[1] && vil.rec === rec - 1);
  assert(V.fai(s, { a: 'recluta', n: 50 }).err); assert(V.fai(s, { a: 'assolda', t: 'mer_f3' }).err, 'niente taverna al villaggio'); assert(V.fai(s, { a: 'boh' }).err);
  // mercato: comprando il prezzo sale, vendendo scende; mai monete sotto zero
  const p0 = V.prezzo(s, vil, 'grano', 1); ok(V.fai(s, { a: 'compra', m: 'grano', n: 5 })); assert(V.prezzo(s, vil, 'grano', 1) >= p0); assert(V.prezzo(s, vil, 'grano', -1) < V.prezzo(s, vil, 'grano', 1));
  assert(V.fai(s, { a: 'vendi', m: 'spezie', n: 1 }).err); assert(V.fai(s, { a: 'compra', m: 'aria', n: 1 }).err); tu.oro = 3; assert(V.fai(s, { a: 'compra', m: 'velluto', n: 1 }).err || vil.scorte.velluto === 0); assert(tu.oro === 3);
  // promozione: servono esperienza e monete
  const e = tu.tr.find(e => D.TR[e.t].su.length), su = D.TR[e.t].su[0]; e.xp = 0; tu.oro = 500; assert(V.fai(s, { a: 'promuovi', t: e.t, su, n: 1 }).err);
  e.xp = D.XP_SU[D.TR[e.t].t]; const n1 = V.uomini(tu); ok(V.fai(s, { a: 'promuovi', t: e.t, su, n: 1 })); assert(V.uomini(tu) === n1 && tu.tr.some(x => x.t === su)); assert(V.fai(s, { a: 'promuovi', t: e.t, su: 'val_c4', n: 1 }).err);
  // abilità
  s.cap.punti = 1; const lim0 = V.limite(s); ok(V.fai(s, { a: 'abilita', k: 'comando' })); assert(V.limite(s) === lim0 + 5); assert(V.fai(s, { a: 'abilita', k: 'comando' }).err);
  ok(V.fai(s, { a: 'esci' })); assert(s.dentro < 0);
}
// viveri e paga: senza cibo il morale crolla, senza monete pure; con cibo e monete la paga esce
{
  const s = V.nuovo(8), tu = V.TU(s); tu.merci = {}; tu.oro = 0; const m0 = tu.mor; V.ordina(s, { t: 'aspetta', ore: 24 * 9 });
  let g = 0; while (V.giorno(s) < 9 && g++ < 2000) { V.passo(s, 60); if (s.incontro) { V.scegli(s, 'fuggi'); if (s.incontro) V.auto(s); } if (!tu.ord) V.ordina(s, { t: 'aspetta', ore: 24 }); }
  assert(tu.mor < m0, 'fame e paga mancata abbassano il morale'); assert(s.log.some(x => /mangiare/.test(x.tx)));
  const t = V.nuovo(8), tt = V.TU(t); tt.merci = { grano: 60 }; tt.oro = 5000; V.ordina(t, { t: 'aspetta', ore: 24 * 9 });
  g = 0; while (V.giorno(t) < 9 && g++ < 2000) { V.passo(t, 60); if (t.incontro) { V.scegli(t, 'fuggi'); if (t.incontro) V.auto(t); } if (!tt.ord) V.ordina(t, { t: 'aspetta', ore: 24 }); }
  assert(tt.oro < 5000 && t.log.some(x => /paga/.test(x.tx)), 'il giorno di paga arriva'); assert(tt.merci.grano < 60, 'si mangia ogni giorno');
}
// incontro con i predoni: battaglia risolta, bottino, fama, esperienza; incarico dei predoni che si chiude
{
  const s = V.nuovo(12), tu = V.TU(s); tu.tr = [{ t: 'val_f3', n: 16, f: 0, xp: 0 }, { t: 'val_t3', n: 8, f: 0, xp: 0 }];
  const vil = s.l.filter(l => l.tipo === 'villaggio').sort((a, b) => V.dist(a, tu) - V.dist(b, tu))[0]; va(s, vil.id); vil.inc = { tipo: 'predoni', premio: 150, giorni: 6 };
  ok(V.fai(s, { a: 'incarico' })); assert(V.fai(s, { a: 'incarico' }).err, 'un incarico si prende una volta'); const q = s.incarichi[0], banda = V.part(s, q.pid); assert(banda && banda.k === 'pre');
  banda.tr = [{ t: 'pre_f1', n: 6, f: 0, xp: 0 }]; assert(banda.cov, 'la banda dell\'incarico resta in zona'); banda.fermo = s.t + 99999; ok(V.fai(s, { a: 'esci' })); let g = 0;
  while (!q.fatto && g++ < 3000) { if (s.incontro) { const c = V.campo(s); assert(c.a.length && c.b.length && c.cap); ok(V.auto(s)); } else { if (!tu.ord && V.part(s, q.pid)) ok(V.ordina(s, { t: 'segui', pid: q.pid })); V.passo(s, 5); } }
  assert(q.fatto, 'incarico dei predoni compiuto'); assert(s.fama > 0 && s.stat.vinte >= 1 && s.cap.xp + s.cap.liv > 1); assert(!V.part(s, q.pid), 'la banda battuta sparisce'); assert(s.ult && s.ult.vince === 'a' && s.ult.oro > 0);
}
// sconfitta: perdi monete e uomini; se il capitano cade resti prigioniero e poi torni libero
{
  const s = V.nuovo(13), tu = V.TU(s); tu.oro = 1000; const lupo = s.p.find(p => p.k === 'pre'); lupo.tr = [{ t: 'pre_f3', n: 40, f: 0, xp: 0 }];
  s.incontro = { tipo: 'nemico', pid: [lupo.id], all: [], da: 'loro' }; const n0 = V.uomini(tu);
  const x = ok(V.esito(s, { vince: 'b', cad: [{ p: 0, t: tu.tr[0].t, n: 2 }], capKo: true })); assert(x.out.vince === 'b' && tu.oro === 600 && V.uomini(tu) < n0 && s.prigioniero);
  assert(V.ordina(s, { t: 'vai', x: 30, y: 30 }).err, 'in catene non si danno ordini'); let g = 0; while (s.prigioniero && g++ < 200) V.passo(s, 60); assert(!s.prigioniero, 'prima o poi si fugge');
  assert(V.part(s, lupo.id), 'chi vince resta in campo');
}
// servizio: contratto, giuramento con feudo, rendite; chi serve un regno eredita i suoi nemici
{
  const s = V.nuovo(14), tu = V.TU(s), f = 'val', cit = s.l.find(l => l.tipo === 'citta' && l.faz === f); for (const k of D.REGNI) s.rel[k] = 0; tu.x = cit.x + .3; tu.y = cit.y; tu.merci = { grano: 40 }; va(s, cit.id);
  assert(V.fai(s, { a: 'contratto' }).err, 'senza fama niente contratto'); s.fama = 30; ok(V.fai(s, { a: 'contratto' })); assert(s.servizio.tipo === 'mer' && V.lato(s) === f);
  s.guerra = { 'sel|val': true }; assert(V.nemiche(s, 'tu', 'sel') && !V.nemiche(s, 'tu', 'fer') && !V.nemiche(s, 'tu', 'val') && !V.nemiche(s, 'tu', 'neu'));
  assert(V.rendite(s) > 0, 'il soldo del contratto'); assert(V.fai(s, { a: 'giura' }).err); s.fama = 120; s.rel.val = 20; ok(V.fai(s, { a: 'giura' })); assert(s.servizio.tipo === 'vas');
  const feudo = s.l.find(l => l.sig === -2); assert(feudo && feudo.tipo === 'villaggio' && feudo.faz === f, 'il vassallo riceve un villaggio');
  ok(V.fai(s, { a: 'lascia' })); assert(!s.servizio && !s.l.some(l => l.sig === -2) && s.rel.val < 0);
  // taverna e armaiolo
  tu.oro = 5000; const m = cit.merc[0]; if (m) { const n = V.uomini(tu); s.cap.ab.comando = 5; ok(V.fai(s, { a: 'assolda', t: m.t, n: 1 })); assert(V.uomini(tu) === n + 1); }
  // armaiolo: oggetti veri, scelte vere
  assert(cit.bott.length >= 5 && cit.unica === D.UNICA.val, 'la capitale ha la sua offerta unica');
  cit.bott = ['mandorla', 'spadone', 'corno', 'bacinetto']; const st0 = V.statCap(s.cap);
  assert(V.fai(s, { a: 'compraogg', id: 'piastre' }).err, 'non in vendita'); ok(V.fai(s, { a: 'compraogg', id: 'mandorla' })); assert(tu.zaino.includes('mandorla') && !cit.bott.includes('mandorla'));
  ok(V.fai(s, { a: 'equipa', i: tu.zaino.indexOf('mandorla') })); assert(s.cap.eq.scudo === 'mandorla' && V.statCap(s.cap).dif === st0.dif + 4, 'lo scudo alza la difesa');
  ok(V.fai(s, { a: 'compraogg', id: 'spadone' })); ok(V.fai(s, { a: 'equipa', i: tu.zaino.indexOf('spadone') }));
  assert(s.cap.eq.arma === 'spadone' && s.cap.eq.scudo === null && tu.zaino.includes('mandorla') && tu.zaino.includes('spada'), 'l\'arma a due mani fa posare lo scudo, la vecchia arma torna nello zaino');
  assert(V.fai(s, { a: 'equipa', i: tu.zaino.indexOf('mandorla') }).err, 'niente scudo con lo spadone'); assert(V.statCap(s.cap).dan > st0.dan + 5 && V.statCap(s.cap).rit === 16);
  ok(V.fai(s, { a: 'compraogg', id: 'corno' })); ok(V.fai(s, { a: 'equipa', i: tu.zaino.indexOf('corno') })); assert(s.cap.eq.cimeli[0] === 'corno' && V.statCap(s.cap).grido === .5);
  ok(V.fai(s, { a: 'compraogg', id: D.UNICA.val })); assert(cit.unica === null && tu.zaino.includes(D.UNICA.val)); ok(V.fai(s, { a: 'equipa', i: tu.zaino.indexOf(D.UNICA.val) })); assert(V.abil(s, 'comando') >= s.cap.ab.comando + 1, 'l\'oggetto unico porta la sua dote');
  assert(V.fai(s, { a: 'togli', slot: 'arma' }).err); ok(V.fai(s, { a: 'togli', slot: 'cimelio', k: 0 })); assert(s.cap.eq.cimeli[0] === null);
  const oro0 = tu.oro, nz = tu.zaino.length; ok(V.fai(s, { a: 'vendiogg', i: 0 })); assert(tu.oro > oro0 && tu.zaino.length === nz - 1); assert(V.fai(s, { a: 'vendiogg', i: 99 }).err);
  const co = D.COMPAGNI.find(c => s.compagni[c.id] === cit.id); if (co) { ok(V.fai(s, { a: 'compagno', id: co.id })); assert(V.abil(s, co.abil) === s.cap.ab[co.abil] + 2, 'il compagno porta la sua abilità'); assert(V.fai(s, { a: 'compagno', id: co.id }).err); }
}
// assedio: davanti a mura nemiche si assedia, si aspetta, si assalta; la fortezza presa è tua e dà rendita
{
  const s = V.nuovo(15), tu = V.TU(s); s.rel.fer = -60; s.cap.ab.comando = 10; tu.tr = [{ t: 'val_f4', n: 50, f: 0, xp: 0 }, { t: 'val_t4', n: 30, f: 0, xp: 0 }]; tu.merci = { grano: 80 };
  const cas = s.l.filter(l => l.tipo === 'castello' && l.faz === 'fer').sort((a, b) => V.dist(a, tu) - V.dist(b, tu))[0]; s.guerra = {}; cas.g = [{ t: 'fer_f2', n: 12, f: 0, xp: 0 }, { t: 'fer_t2', n: 8, f: 0, xp: 0 }];
  for (const p of s.p) if (p.dentro === cas.id) p.dentro = s.l.find(l => l.tipo === 'citta' && l.faz === 'fer').id;
  tu.x = cas.x + .4; tu.y = cas.y; va(s, cas.id); assert(s.davanti === cas.id, 'le porte nemiche restano chiuse'); assert(V.fai(s, { a: 'recluta' }).err && V.fai(s, { a: 'riposa' }).err);
  ok(V.fai(s, { a: 'assedia' })); assert(s.assedio && s.assedio.lid === cas.id); let g = 0;
  while (!(s.incontro && s.incontro.tipo === 'assalto') && g++ < 400) { if (s.incontro) V.auto(s); else V.passo(s, 30); if (!s.assedio && !s.incontro) { va(s, cas.id); V.fai(s, { a: 'assedia' }); } }
  assert(s.incontro && s.incontro.tipo === 'assalto', 'dopo qualche ora si può assaltare'); const c = V.campo(s); assert(c.tipo === 'assedio' && c.b.some(x => x.p < 0), 'la guarnigione difende');
  ok(V.auto(s)); assert(cas.faz === 'tu' && s.dentro === cas.id && s.ult.presa === cas.id, 'la fortezza è tua'); assert(V.rendite(s) > 0);
  for (const v of s.l) if (v.capo === cas.id && v.tipo === 'villaggio') assert(v.faz === 'tu', 'i villaggi seguono la fortezza');
  assert(c.scena && c.scena.vicino.tipo === 'castello' && c.scena.meteo, 'la scheda della battaglia dice dove si combatte');
  ok(V.fai(s, { a: 'guarnigione', t: 'val_f4', n: 10, verso: 1 })); assert(cas.g.some(e => e.t === 'val_f4' && e.n === 10)); s.fama = 600; ok(V.fai(s, { a: 'guarnigione', t: 'val_f4', n: 4, verso: -1 }));
  assert(V.traguardi(s).filter(x => x[1]).length >= 3);
}
// luoghi nuovi: rovine e covi nascosti da scoprire e ripulire, porto, monastero, locanda, la rivale, i tratti dei signori
{
  const s = V.nuovo(21, { regno: 'mar' }), tu = V.TU(s); tu.oro = 5000; tu.tr = [{ t: 'mar_f4', n: 40, f: 0, xp: 0 }, { t: 'mar_t4', n: 20, f: 0, xp: 0 }]; s.cap.ab.comando = 10; tu.merci = { grano: 90 };
  const rov = s.l.filter(l => l.tipo === 'rovine'); assert(rov.every(l => l.noto === false && l.g.length && l.tesoro) && s.l.filter(l => l.tipo === 'covo').every(l => l.noto === false && l.boss && D.TR[l.boss]));
  assert(s.sig.every(g => D.TRATTI[g.tratto]) && s.p.some(p => p.k === 'riv' && p.tr.some(e => e.t === D.RIVALE.id)), 'signori con un tratto, la rivale in giro');
  // locanda: le voci svelano un sito; l'incarico della taglia
  const loc = s.l.filter(l => l.tipo === 'locanda').sort((a, b) => V.dist(a, tu) - V.dist(b, tu))[0]; tu.x = loc.x + .3; tu.y = loc.y; va(s, loc.id);
  const noti0 = s.l.filter(l => l.noto === false).length; const v = ok(V.fai(s, { a: 'voci' })); assert(s.l[v.lid].noto === true && s.l.filter(l => l.noto === false).length === noti0 - 1, 'le voci dell\'oste segnano un luogo');
  assert(loc.inc && loc.inc.tipo === 'taglia'); ok(V.fai(s, { a: 'incarico' })); const taglia = s.incarichi.find(q => q.tipo === 'taglia'), covo = s.l[taglia.a]; assert(covo.tipo === 'covo' && covo.noto === true);
  ok(V.fai(s, { a: 'riposa' })); V.ordina(s, { t: 'ferma' });
  // il covo: nemico, niente porte; assalto senza attesa; capobanda, tesoro, taglia
  tu.x = covo.x + .4; tu.y = covo.y; va(s, covo.id); assert(s.davanti === covo.id); assert(V.fai(s, { a: 'assedia' }).err, 'un covo non si assedia');
  covo.g = [{ t: 'pre_f1', n: 6, f: 0, xp: 0 }, { t: covo.boss, n: 1, f: 0, xp: 0 }]; const tes = covo.tesoro, oro0 = tu.oro; ok(V.fai(s, { a: 'assalta' })); assert(s.incontro.tipo === 'assalto');
  const c = V.campo(s); assert(c.tipo === 'campo' && c.scena.vicino.tipo === 'covo' && c.b.some(x => x.t === covo.boss), 'il capobanda è in campo, e non ci sono mura');
  const x = ok(V.auto(s)); assert(x.out.vince === 'a' && x.out.oggetti.includes(tes) && tu.zaino.includes(tes) && !covo.g.length && s.stat.covi === 1 && taglia.fatto && tu.oro > oro0 + taglia.premio - 1, 'covo stanato: tesoro e taglia');
  assert(V.fai(s, { a: 'assalta' }).err); assert(V.traguardi(s).find(t => /covo/.test(t[0]))[1]);
  // rovine: si entra, si esplora combattendo
  const r0 = rov[0]; r0.noto = true; r0.g = [{ t: 'pre_f2', n: 5, f: 0, xp: 0 }]; tu.x = r0.x + .4; tu.y = r0.y; for (const e of tu.tr) e.f = 0; va(s, r0.id); assert(s.dentro === r0.id); const t2 = r0.tesoro;
  ok(V.fai(s, { a: 'assalta' })); ok(V.auto(s)); assert(tu.zaino.includes(t2) && s.stat.rovine === 1); ok(V.fai(s, { a: 'esci' }));
  // monastero: cura e benedizione
  const mon = s.l.filter(l => l.tipo === 'monastero')[0]; tu.x = mon.x + .3; tu.y = mon.y; va(s, mon.id); tu.tr[0].f = 5; ok(V.fai(s, { a: 'cura' })); assert(tu.tr[0].f === 0); assert(V.fai(s, { a: 'cura' }).err);
  ok(V.fai(s, { a: 'benedizione' })); assert(V.fai(s, { a: 'benedizione' }).err, 'una benedizione alla settimana'); assert(V.fai(s, { a: 'compra', m: 'grano', n: 1 }).err, 'niente mercato al monastero'); ok(V.fai(s, { a: 'esci' }));
  // porto: mercato e passaggio per mare
  const porti = s.l.filter(l => l.tipo === 'porto' && l.faz === 'mar'); assert(porti.length === 2); tu.x = porti[0].x + .3; tu.y = porti[0].y; va(s, porti[0].id);
  ok(V.fai(s, { a: 'compra', m: 'pesce', n: 2 })); const t0 = s.t; ok(V.fai(s, { a: 'imbarca', lid: porti[1].id })); assert(s.dentro === porti[1].id && V.dist(tu, porti[1]) < .1); assert(V.fai(s, { a: 'imbarca', lid: porti[1].id }).err);
  let g = 0; while (tu.ord && g++ < 100) V.passo(s, 60); assert(s.t > t0 + 100, 'la traversata prende tempo');
  // la rivale: si incontra, si può sfidare; battuta, lascia il suo premio e riparte altrove
  const rv = s.p.find(p => p.k === 'riv'); rv.tr = [{ t: 'mer_f3', n: 4, f: 0, xp: 0 }, { t: D.RIVALE.id, n: 1, f: 0, xp: 0 }]; s.incontro = { tipo: 'parla', pid: [rv.id], all: [] };
  ok(V.scegli(s, 'notizie')); assert(s.incontro.voce && V.scegli(s, 'notizie').err); ok(V.scegli(s, 'aggredisci')); for (const e of tu.tr) e.f = 0; const y = ok(V.auto(s));
  assert(y.out.vince === 'a' && tu.zaino.includes(D.RIVALE.premio) && V.part(s, rv.id) && V.part(s, rv.id).tr.some(e => e.t === D.RIVALE.id), 'la Volpe perde la cavalla ma non la pelle');
}
// chi arriva dal mondo piccolo (salvataggio v1) porta con sé compagnia e capitano
{
  const v1 = { v: 1, seme: 5, nome: 'Compagnia di Lapo', fama: 44, rel: { val: 12, sel: -30, fer: 0 }, stat: { vinte: 9, perse: 1 }, l: [{ faz: 'tu' }, { faz: 'val', sig: 0 }], cap: { nome: 'Lapo', liv: 4, xp: 30, punti: 1, ab: { prodezza: 2, comando: 3, addestra: 0, medicina: 1, commercio: 0, esplora: 0 }, eq: { arma: 2, armatura: 1, cavallo: 2 } },
    p: [{ id: 0, k: 'tu', tr: [{ t: 'val_f3', n: 12, f: 1, xp: 5 }, { t: 'co_berta', n: 1, f: 0, xp: 0 }, { t: 'vecchio_tipo', n: 3 }], oro: 900, merci: { grano: 8 }, mor: 61 }] };
  const s = V.apri(JSON.stringify(v1)); assert(s && s.v === 2 && s.cap.liv === 4 && s.cap.eq.arma === 'spadone' && s.cap.eq.armatura === 'maglia' && s.cap.eq.cavallo === 'corsiero' && s.fama === 44 && s.rel.sel === -30);
  const tu = V.TU(s); assert(tu.oro === 1300 && V.uomini(tu) === 13 && s.compagni.co_berta === -1 && s.stat.vinte === 9 && V.mappa(s.seme).G === 128, 'compagnia, monete (più il riscatto dei feudi) e capitano nel mondo grande');
  assert(V.apri(V.salva(s)).v === 2);
}
// il capitano accorto cresce, quello sconsiderato si rovina; il mondo intanto fa la sua guerra
{
  let bravi = 0, guerre = 0, cambi = 0; const semi = [7, 29]; // (V5: il seme 3 apre con una battaglia sfortunata e finisce senza monete; su 16 semi prospera come prima 15 volte contro 16)
  for (const seme of semi) {
    const a = gioca(V.nuovo(seme), 22, true, carica.rng(seme + 1)), b = gioca(V.nuovo(seme), 22, false, carica.rng(seme + 1));
    const va2 = V.forza(V.TU(a)) + V.TU(a).oro / 20 + a.fama, vb = V.forza(V.TU(b)) + V.TU(b).oro / 20 + b.fama;
    if (a.stat.vinte >= 4 && a.fama >= 15 && (V.uomini(V.TU(a)) >= 16 || V.TU(a).oro >= 1000) && a.stat.vinte > a.stat.perse) bravi++;   // (consiglio acceso: i nemici graduati costano uomini, ma il capitano accorto ha le monete per rimpiazzarli)
    assert(va2 > vb * 2, 'seme ' + seme + ': accorto ' + va2.toFixed(0) + ', sconsiderato ' + vb.toFixed(0)); assert(b.stat.perse > b.stat.vinte, 'chi attacca tutti perde più di quanto vince');
    for (const s of [a, b]) { for (const p of s.p) { assert(V.passa(V.mappa(s.seme), p.x, p.y) || p.dentro >= 0, p.nome + ' fuori dalla terra'); for (const e of p.tr) assert(e.n > 0 && (e.f || 0) <= e.n && D.TR[e.t]); } assert(V.TU(s).oro >= 0); }
    if (a.log.some(x => x.tipo === 'guerra')) guerre++; if (a.l.some((l, i) => l.faz !== V.mappa(seme).luoghi[i].faz) || a.l.some(l => l.sacc > 0)) cambi++;
  }
  assert(bravi === semi.length, 'il capitano accorto prospera su ogni seme: ' + bravi); assert(guerre === semi.length && cambi >= 1, 'i regni si fanno guerra da soli');
}

// tornei nelle città (V2): giorno giusto, iscrizione, tre duelli a piedi, premi, sconfitta senza danni alla compagnia, un solo tentativo al giorno
{
  const nuovoT = (seme, o) => { const s = V.nuovo(seme, o), l = s.l.find(l => l.tipo === 'citta'); const g = V.giorno(s), d = (7 - (g + l.id) % 7) % 7; s.t += d * 1440; s.dentro = l.id; V.TU(s).oro = 100000; return { s, l }; };
  const T = D.TORNEO, vinci = s => ok(V.esito(s, { vince: 'a', cad: [], capKo: false })), perdi = s => ok(V.esito(s, { vince: 'b', cad: [], capKo: true }));
  // il calendario: ogni città ha il suo giorno, uno ogni sette; la lista è ordinata
  { const s = V.nuovo(3), L = V.tornei(s); assert.strictEqual(L.length, 5); for (let i = 1; i < L.length; i++) assert(L[i - 1].giorni <= L[i].giorni); for (const t of L) { assert(t.giorni >= 0 && t.giorni < 7); const l = s.l[t.lid], c = JSON.parse(V.salva(s)); c.t += t.giorni * 1440; assert(V.torneoOggi(c, c.l[t.lid]), 'il giorno annunciato è quello giusto'); assert.strictEqual(V.torneoOggi(s, l), t.giorni === 0); } }
  // errori: fuori giorno, monete, iscritto due volte, un solo torneo al giorno, fuori dalle porte
  { const { s, l } = nuovoT(5); s.t += 1440; assert.strictEqual(V.fai(s, { a: 'torneo' }).err, 'Oggi non c\'è torneo'); s.t -= 1440; V.TU(s).oro = 10; assert.strictEqual(V.fai(s, { a: 'torneo' }).err, 'Non hai abbastanza monete'); V.TU(s).oro = 1000;
    assert(V.fai(s, { a: 'lizza' }).err && V.fai(s, { a: 'ritira' }).err, 'senza iscrizione niente lizza né ritiro');
    ok(V.fai(s, { a: 'torneo' })); assert.strictEqual(V.TU(s).oro, 1000 - T.posta * s.cap.liv); assert.strictEqual(JSON.stringify(s.torneo), JSON.stringify({ lid: l.id, turno: 0, posta: T.posta * s.cap.liv, giorno: V.giorno(s) }));
    assert.strictEqual(V.fai(s, { a: 'torneo' }).err, 'Sei già iscritto'); ok(V.fai(s, { a: 'ritira' })); assert.strictEqual(s.torneo, null); assert(V.fai(s, { a: 'torneo' }).err.includes('già partecipato'), 'niente seconda iscrizione nello stesso giorno'); }
  // gli avversari: stessi uomini per stesso mondo, città, giorno e turno; più forti turno dopo turno; un corredo vero
  { const { s, l } = nuovoT(7), g = V.giorno(s), a = V.avversariTorneo(s, l.id, g, 1, 3), b = V.avversariTorneo(s, l.id, g, 1, 3); assert.strictEqual(JSON.stringify(a), JSON.stringify(b)); assert.strictEqual(a.length, 3);
    assert.notDeepStrictEqual(V.avversariTorneo(s, l.id, g + 7, 1, 3).map(x => x.nome + x.kit), a.map(x => x.nome + x.kit), 'un altro giorno, altri uomini');
    for (let t = 0; t < 3; t++) for (const x of V.avversariTorneo(s, l.id, g, t, 4)) { assert(x.st.git === 0 && !x.st.cav, 'a piedi e corpo a corpo'); assert(x.st.asp.arma && D.TORNEO.kit.some(k => k.id === x.kit)); assert(x.st.pf >= T.base[t].pf && x.st.dan >= T.base[t].dan); }
    assert(V.avversariTorneo(s, l.id, g, 2, 1)[0].st.pf > V.avversariTorneo(s, l.id, g, 0, 1)[0].st.pf);
    // i campioni crescono con il livello dei capitani (oltre T.LIV): il premio sale, il rischio resta
    { const pf0 = V.avversariTorneo(s, l.id, g, 2, 1)[0].st.pf; s.cap.liv = T.LIV - 2; assert.strictEqual(V.avversariTorneo(s, l.id, g, 2, 1)[0].st.pf, pf0, 'sotto la soglia non cambia nulla');
      s.cap.liv = T.LIV + 4; const alto = V.avversariTorneo(s, l.id, g, 2, 1)[0]; assert.strictEqual(alto.st.pf, pf0 + Math.round(T.cresce.pf * 4)); assert(alto.st.att > T.base[2].att); s.cap.liv = 1; }
    const kits = new Set(); for (let i = 1; i < 40; i++) for (const x of V.avversariTorneo(s, l.id, g + i, i % 3, 4)) kits.add(x.kit); assert.strictEqual(kits.size, 4, 'escono tutti e quattro i corredi'); }
  // la scheda del duello: a piedi, senza arco, solo capitani contro altrettanti avversari
  { const { s } = nuovoT(9, { soci: [{ nome: 'Bea' }] }); const [c0, c1] = V.capi(s); c0.eq.arma = 'arco'; c0.eq.cavallo = 'corsiero'; c1.eq.arma = 'spadone'; c1.eq.scudo = null;
    const posta = T.posta * (c0.liv + c1.liv); ok(V.fai(s, { a: 'torneo', seat: 1 })); assert.strictEqual(s.torneo.posta, posta, 'si paga per ogni capitano'); assert.strictEqual(V.fai(s, { a: 'esci' }).err, undefined);
    s.dentro = s.torneo.lid; ok(V.fai(s, { a: 'lizza' })); assert.strictEqual(s.incontro.tipo, 'arena'); assert(V.fai(s, { a: 'riposa' }).err && V.fai(s, { a: 'esci' }).err, 'durante il duello non si fa altro');
    const sc = V.campo(s); assert.strictEqual(sc.tipo, 'arena'); assert.strictEqual(sc.a.length, 0); assert.strictEqual(sc.b.length, 2); assert.strictEqual(sc.capi.length, 2); assert(sc.capi.every(c => !c.cavallo && !c.git), 'senza cavallo e senza arco');
    assert.strictEqual(sc.capi[0].asp.arma, 'spada', 'l\'arco diventa una spada'); assert.strictEqual(sc.capi[1].asp.arma, 'spadone'); assert.strictEqual(sc.scena.vicino.tipo, 'citta'); assert.strictEqual(sc.b[0].st.pf, T.base[0].pf);
    assert.strictEqual(V.scegli(s, 'lascia').err, 'Scelta non valida'); ok(V.fai(s, { a: 'ritira' })); assert.strictEqual(s.incontro, null, 'ritirarsi chiude anche il duello'); }
  // tre vittorie: il premio del turno cresce, si incassa solo ritirandosi o vincendo la finale; fama e un oggetto di pregio 3 mai doppio
  { const { s } = nuovoT(11); const tu = V.TU(s); ok(V.fai(s, { a: 'torneo' })); const posta = s.torneo.posta, oro0 = tu.oro, fama0 = s.fama;
    ok(V.fai(s, { a: 'lizza' })); let o = vinci(s).out; assert(o.torneo.vinto && o.torneo.turno === 0 && o.torneo.premio === posta * 2 && !o.torneo.chiuso && o.fama === 0); assert.strictEqual(tu.oro, oro0, 'il premio matura ma non si incassa ancora'); assert.strictEqual(s.torneo.turno, 1);
    ok(V.fai(s, { a: 'lizza' })); o = vinci(s).out; assert(o.torneo.premio === posta * 4 && o.fama === 5 && s.fama === fama0 + 5); assert.strictEqual(tu.oro, oro0);
    const gia = new Set(tu.zaino); for (const c of V.capi(s)) for (const id of Object.values(c.eq).flat()) if (id) gia.add(id); const zaino0 = tu.zaino.length;
    ok(V.fai(s, { a: 'lizza' })); o = vinci(s).out; assert(o.torneo.chiuso && o.torneo.premio === posta * 8 && o.fama === 15 && s.torneo === null); assert.strictEqual(tu.oro, oro0 + posta * 8);
    assert.strictEqual(o.torneo.oggetto && D.OGG[o.torneo.oggetto].q, 3, 'oggetto di pregio 3'); assert(!gia.has(o.torneo.oggetto), 'mai uno già posseduto'); assert.strictEqual(tu.zaino.length, zaino0 + 1); assert.strictEqual(JSON.stringify(o.oggetti), JSON.stringify([o.torneo.oggetto]));
    assert.strictEqual(s.stat.tornei, 1); assert(V.fai(s, { a: 'lizza' }).err, 'chiuso: niente altri duelli'); }
  // ritirarsi tiene il premio maturato; il giorno che passa lo paga lo stesso; una sconfitta lo perde
  { const { s } = nuovoT(13); const tu = V.TU(s); ok(V.fai(s, { a: 'torneo' })); const posta = s.torneo.posta; ok(V.fai(s, { a: 'lizza' })); vinci(s); const oro1 = tu.oro; const r = ok(V.fai(s, { a: 'ritira' })); assert.strictEqual(r.oro, posta * 2); assert.strictEqual(tu.oro, oro1 + posta * 2); assert.strictEqual(s.torneo, null); }
  { const { s } = nuovoT(14); const tu = V.TU(s); ok(V.fai(s, { a: 'torneo' })); const posta = s.torneo.posta; ok(V.fai(s, { a: 'lizza' })); vinci(s); ok(V.fai(s, { a: 'lizza' })); vinci(s); const oro1 = tu.oro; ok(V.fai(s, { a: 'esci' }));
    ok(V.ordina(s, { t: 'aspetta', ore: 20 })); let g = 0; while (s.torneo && g++ < 2000) V.passo(s, 30); assert.strictEqual(s.torneo, null, 'a fine giornata il torneo si chiude'); assert(s.log.some(x => x.tx.includes('incassi ' + posta * 4 + ' monete')), 'pagando il premio maturato'); assert(tu.oro > oro1 + posta * 4 - 200, 'le monete sono arrivate'); }
  { const { s } = nuovoT(15); const tu = V.TU(s), uomini = V.uomini(tu), tr = JSON.stringify(tu.tr), oro = tu.oro; ok(V.fai(s, { a: 'torneo' })); const posta = s.torneo.posta; ok(V.fai(s, { a: 'lizza' })); vinci(s); ok(V.fai(s, { a: 'lizza' }));
    const o = perdi(s).out; assert(!o.torneo.vinto && o.torneo.chiuso && o.torneo.premio === 0 && s.torneo === null, 'si perde tutto il premio maturato'); assert.strictEqual(tu.oro, oro - posta);
    assert.strictEqual(V.uomini(tu), uomini); assert.strictEqual(JSON.stringify(tu.tr), tr, 'nessun uomo perso né ferito'); assert.strictEqual(s.prigioniero, null); assert.strictEqual(s.incontro, null); assert.strictEqual(o.morti + o.feriti + o.prig, 0);
    // vita al 50% per il resto del giorno, poi torna piena
    const piena = V.statCap(V.capi(s)[0]).pf; s.incontro = { tipo: 'nemico', pid: [], all: [] }; const p = V.part(s, s.p.find(p => p.k === 'pre').id); s.incontro = { tipo: 'nemico', pid: [p.id], all: [], da: 'tu' };
    assert.strictEqual(V.campo(s).capi[0].pf, Math.round(piena * .5), 'combatte a metà vita'); s.t += 1440; assert.strictEqual(V.campo(s).capi[0].pf, piena, 'il giorno dopo sta bene'); }
  // un salvataggio di prima dei tornei (senza torneo, torneoUsato, ferito, stat.tornei) si apre e si gioca
  { const { s } = nuovoT(21); const j = JSON.parse(V.salva(s)); for (const k of ['torneo', 'torneoUsato', 'ferito']) delete j[k]; delete j.stat.tornei; delete j.stat.duelli; const t = V.apri(JSON.stringify(j)); assert(t); assert.strictEqual(V.tornei(t).length, 5);
    ok(V.fai(t, { a: 'torneo' })); ok(V.fai(t, { a: 'lizza' })); assert.strictEqual(V.campo(t).tipo, 'arena'); ok(V.esito(t, { vince: 'a', cad: [] })); assert.strictEqual(t.stat.duelli, 1); }
  // mai un doppione, nemmeno di un oggetto portato da un socio fuori campo
  { const { s } = nuovoT(22, { soci: [{ nome: 'Bea' }] }); const pregio = Object.keys(D.OGG).filter(id => D.OGG[id].q === 3), indosso = 'temprata', lascia = 'alabarda'; assert(pregio.includes(indosso) && pregio.includes(lascia));
    s.soci[0].eq.arma = indosso; for (const id of pregio) if (id !== indosso && id !== lascia) V.TU(s).zaino.push(id);
    s.attivi = 1; ok(V.fai(s, { a: 'torneo' })); for (let t = 0; t < 3; t++) { ok(V.fai(s, { a: 'lizza' })); ok(V.esito(s, { vince: 'a', cad: [] })); }
    assert.strictEqual(s.ult.torneo.oggetto, lascia, 'esce solo l\'unico che non ha nessuno, nemmeno il socio fuori campo'); }
  // le voci della locanda dicono dove sarà il prossimo
  { const s = V.nuovo(17), loc = s.l.find(l => l.tipo === 'locanda'), x = s.l.find(l => l.noto === false && l.g.length); assert(loc && x); s.dentro = loc.id; V.TU(s).oro = 500; ok(V.fai(s, { a: 'voci' })); const ultimo = s.log[s.log.length - 1].tx; assert(/torneo/.test(ultimo) && ultimo.includes(s.l[V.tornei(s)[0].lid].nome), ultimo); }
  // quando non resta nessun posto nascosto il torneo si sa lo stesso (e il vino si paga)
  { const s = V.nuovo(17), loc = s.l.find(l => l.tipo === 'locanda'); for (const l of s.l) l.noto = true; s.dentro = loc.id; V.TU(s).oro = 500; const r = ok(V.fai(s, { a: 'voci' })), ultimo = s.log[s.log.length - 1].tx;
    assert(r.lid === undefined && V.TU(s).oro === 475 && /torneo/.test(ultimo) && ultimo.includes(s.l[V.tornei(s)[0].lid].nome), ultimo); }
  // salvare e riaprire a metà torneo dà la stessa partita
  { const { s } = nuovoT(19); ok(V.fai(s, { a: 'torneo' })); ok(V.fai(s, { a: 'lizza' })); const t = V.apri(V.salva(s)); assert.strictEqual(V.salva(t), V.salva(s)); assert.strictEqual(JSON.stringify(V.campo(t)), JSON.stringify(V.campo(s))); }
  // risoluzione automatica: capitano forte e ben equipaggiato vince circa una volta su due, un capitano nudo non vince, a caso quasi mai
  { const prova = (eq, liv, pr, N) => { let vinti = 0; for (let i = 1; i <= N; i++) { const { s } = nuovoT(i * 3); for (const c of V.capi(s)) { c.liv = liv; c.ab.prodezza = pr; Object.assign(c.eq, eq); } ok(V.fai(s, { a: 'torneo' })); while (s.torneo) { ok(V.fai(s, { a: 'lizza' })); const r = ok(V.auto(s)); if (!r.out.torneo.vinto) break; if (r.out.torneo.chiuso) vinti++; } } return vinti / N; };
    const eq = (a, sc, ar, el) => ({ arma: a, scudo: sc, armatura: ar, elmo: el, cavallo: 'ronzino', cimeli: [null, null] });
    const forte = prova(eq('bastarda', 'mandorla', 'maglia', 'bacinetto'), 5, 2, 40), nudo = prova(eq('spada', null, 'giaco', null), 1, 0, 25);
    assert(forte >= .3 && forte <= .75, 'livello 5 ben equipaggiato: circa un torneo su due (' + forte.toFixed(2) + ')'); assert(nudo <= .05, 'livello 1 senza corazza non vince (' + nudo + ')'); }
}
console.log('ven_mondo ok');
