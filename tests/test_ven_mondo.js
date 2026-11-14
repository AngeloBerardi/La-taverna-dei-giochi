// Compagnia di ventura, mondo libero (VEN): mappa ripetibile e tutta raggiungibile, ordini e tempo, mercato, reclute,
// promozioni, paga e viveri, incontri e battaglie, incarichi, servizio e feudi, assedio, prigionia, salvataggio,
// capitano accorto che cresce e capitano sconsiderato che si rovina, mondo che vive da solo.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27a-avv-dadi.js', '28j-ven-dati.js', '28k-ven-mondo.js', '28l-ven-campo.js'];
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const gioca = require('./bot_ven.js')(V, D);
const ok = x => { assert(!x.err, x.err); return x; };
const va = (s, lid) => { ok(V.ordina(s, { t: 'entra', lid })); let g = 0; while (s.dentro !== lid && s.davanti !== lid && g++ < 4000) { if (s.incontro) { const x = V.scegli(s, 'fuggi'); if (x.err) V.scegli(s, 'lascia'); if (s.incontro) V.auto(s); V.ordina(s, { t: 'entra', lid }); } if (s.rotta > s.t || s.prigioniero) { V.ordina(s, { t: 'aspetta', ore: 4 }); V.passo(s, 240); V.ordina(s, { t: 'entra', lid }); } V.passo(s, 20); } assert(s.dentro === lid || s.davanti === lid, 'non arrivo a ' + s.l[lid].nome); };

// mappa: ripetibile, 27 luoghi su terra percorribile, tutti collegati, strade tracciate
for (const seme of [1, 7, 2026]) {
  const M = V.mappa(seme); assert.strictEqual(M.luoghi.length, 27); assert(M.covi.length >= 4);
  for (const l of M.luoghi) assert(V.passa(M, l.x, l.y), l.nome + ' è su terra non percorribile');
  const a = M.luoghi[0]; for (const l of M.luoghi) if (l !== a) assert(V.via(M, a.x, a.y, l.x, l.y).length > 0, 'nessuna via per ' + l.nome);
  for (let i = 0; i < M.luoghi.length; i++) for (let j = i + 1; j < M.luoghi.length; j++) assert(V.dist(M.luoghi[i], M.luoghi[j]) >= 2.5, 'luoghi sovrapposti');
  assert(M.S.reduce((x, y) => x + y, 0) > 60, 'poche strade'); assert(V.alt(seme, 10.5, 20.5) === V.alt(seme, 10.5, 20.5));
  for (const f of D.REGNI) { const n = M.luoghi.filter(l => l.faz === f); assert(n.length === 9 && n.filter(l => l.tipo === 'citta').length === 1 && n.filter(l => l.tipo === 'castello').length === 3); }
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
  s.cap.punti = 1; ok(V.fai(s, { a: 'abilita', k: 'comando' })); assert(V.limite(s) === V.P.CAPIENZA + 5); assert(V.fai(s, { a: 'abilita', k: 'comando' }).err);
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
  const s = V.nuovo(14), tu = V.TU(s), f = 'val', cit = s.l.find(l => l.tipo === 'citta' && l.faz === f); s.rel = { val: 0, sel: 0, fer: 0 }; tu.x = cit.x + .3; tu.y = cit.y; tu.merci = { grano: 40 }; va(s, cit.id);
  assert(V.fai(s, { a: 'contratto' }).err, 'senza fama niente contratto'); s.fama = 30; ok(V.fai(s, { a: 'contratto' })); assert(s.servizio.tipo === 'mer' && V.lato(s) === f);
  s.guerra = { 'sel|val': true }; assert(V.nemiche(s, 'tu', 'sel') && !V.nemiche(s, 'tu', 'fer') && !V.nemiche(s, 'tu', 'val'));
  assert(V.rendite(s) > 0, 'il soldo del contratto'); assert(V.fai(s, { a: 'giura' }).err); s.fama = 120; s.rel.val = 20; ok(V.fai(s, { a: 'giura' })); assert(s.servizio.tipo === 'vas');
  const feudo = s.l.find(l => l.sig === -2); assert(feudo && feudo.tipo === 'villaggio' && feudo.faz === f, 'il vassallo riceve un villaggio');
  ok(V.fai(s, { a: 'lascia' })); assert(!s.servizio && !s.l.some(l => l.sig === -2) && s.rel.val < 0);
  // taverna e armaiolo
  tu.oro = 5000; const m = cit.merc[0]; if (m) { const n = V.uomini(tu); s.cap.ab.comando = 5; ok(V.fai(s, { a: 'assolda', t: m.t, n: 1 })); assert(V.uomini(tu) === n + 1); }
  ok(V.fai(s, { a: 'equip', k: 'arma' })); assert(s.cap.eq.arma === 1); assert(V.fai(s, { a: 'equip', k: 'elmo' }).err);
  const co = D.COMPAGNI.find(c => s.compagni[c.id] === cit.id); if (co) { ok(V.fai(s, { a: 'compagno', id: co.id })); assert(V.abil(s, co.abil) === s.cap.ab[co.abil] + 2, 'il compagno porta la sua abilità'); assert(V.fai(s, { a: 'compagno', id: co.id }).err); }
}
// assedio: davanti a mura nemiche si assedia, si aspetta, si assalta; la fortezza presa è tua e dà rendita
{
  const s = V.nuovo(15), tu = V.TU(s); s.rel.fer = -60; s.cap.ab.comando = 10; tu.tr = [{ t: 'val_f4', n: 50, f: 0, xp: 0 }, { t: 'val_t4', n: 30, f: 0, xp: 0 }]; tu.merci = { grano: 80 };
  const cas = s.l.filter(l => l.tipo === 'castello' && l.faz === 'fer').sort((a, b) => V.dist(a, tu) - V.dist(b, tu))[0]; cas.g = [{ t: 'fer_f2', n: 12, f: 0, xp: 0 }, { t: 'fer_t2', n: 8, f: 0, xp: 0 }];
  for (const p of s.p) if (p.dentro === cas.id) p.dentro = s.l.find(l => l.tipo === 'citta' && l.faz === 'fer').id;
  tu.x = cas.x + .4; tu.y = cas.y; va(s, cas.id); assert(s.davanti === cas.id, 'le porte nemiche restano chiuse'); assert(V.fai(s, { a: 'recluta' }).err && V.fai(s, { a: 'riposa' }).err);
  ok(V.fai(s, { a: 'assedia' })); assert(s.assedio && s.assedio.lid === cas.id); let g = 0;
  while (!(s.incontro && s.incontro.tipo === 'assalto') && g++ < 400) { if (s.incontro) V.auto(s); else V.passo(s, 30); if (!s.assedio && !s.incontro) { va(s, cas.id); V.fai(s, { a: 'assedia' }); } }
  assert(s.incontro && s.incontro.tipo === 'assalto', 'dopo qualche ora si può assaltare'); const c = V.campo(s); assert(c.tipo === 'assedio' && c.b.some(x => x.p < 0), 'la guarnigione difende');
  ok(V.auto(s)); assert(cas.faz === 'tu' && s.dentro === cas.id && s.ult.presa === cas.id, 'la fortezza è tua'); assert(V.rendite(s) > 0);
  for (const v of s.l) if (v.capo === cas.id && v.tipo === 'villaggio') assert(v.faz === 'tu', 'i villaggi seguono la fortezza');
  ok(V.fai(s, { a: 'guarnigione', t: 'val_f4', n: 10, verso: 1 })); assert(cas.g.some(e => e.t === 'val_f4' && e.n === 10)); s.fama = 600; ok(V.fai(s, { a: 'guarnigione', t: 'val_f4', n: 4, verso: -1 }));
  assert(V.traguardi(s).filter(x => x[1]).length >= 3);
}
// il capitano accorto cresce, quello sconsiderato si rovina; il mondo intanto fa la sua guerra
{
  let bravi = 0, guerre = 0, cambi = 0; const semi = [3, 29];
  for (const seme of semi) {
    const a = gioca(V.nuovo(seme), 30, true, carica.rng(seme + 1)), b = gioca(V.nuovo(seme), 30, false, carica.rng(seme + 1));
    const va2 = V.forza(V.TU(a)) + V.TU(a).oro / 20 + a.fama, vb = V.forza(V.TU(b)) + V.TU(b).oro / 20 + b.fama;
    if (a.stat.vinte >= 5 && a.fama >= 20 && V.uomini(V.TU(a)) >= 18 && a.stat.vinte > a.stat.perse) bravi++;
    assert(va2 > vb * 2, 'seme ' + seme + ': accorto ' + va2.toFixed(0) + ', sconsiderato ' + vb.toFixed(0)); assert(b.stat.perse > b.stat.vinte, 'chi attacca tutti perde più di quanto vince');
    for (const s of [a, b]) { for (const p of s.p) { assert(V.passa(V.mappa(s.seme), p.x, p.y) || p.dentro >= 0, p.nome + ' fuori dalla terra'); for (const e of p.tr) assert(e.n > 0 && (e.f || 0) <= e.n && D.TR[e.t]); } assert(V.TU(s).oro >= 0); }
    if (a.log.some(x => x.tipo === 'guerra')) guerre++; if (a.l.some((l, i) => l.faz !== V.mappa(seme).luoghi[i].faz) || a.l.some(l => l.sacc > 0)) cambi++;
  }
  assert(bravi === semi.length, 'il capitano accorto prospera su ogni seme: ' + bravi); assert(guerre === semi.length && cambi >= 1, 'i regni si fanno guerra da soli');
}
console.log('ven_mondo ok');
