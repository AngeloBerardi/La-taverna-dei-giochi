// Passo 43: affari della compagnia, botteghe e carovane tue (28kp, solo mondi `s.geo===2`). Prove rapide; la partita lunga è in test_ven_p43_lento.js.
//  (a) gli errori di `bottega` e `carovana` nell'ordine; quarta bottega e terza carovana rifiutate;
//  (b) seme 3, la bottega con la stima più alta: la somma delle rese copre il costo tra il giorno 30 e il 50;
//  (c) una città che passa a un regno nemico: la bottega sparisce entro un giorno;
//  (d) 20 semi, carovana con un solo uomo e 3 bande di predoni sulla strada: perduta entro 10 giorni in almeno 10 semi; il compagno torna nella città A;
//  (e) `richiama` restituisce oro e uomini; mondo vecchio: «Qui non si fanno affari»; i salvataggi di tests/fixture/ven/ si aprono.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })');
const eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
const NO = 'Qui non si fanno affari', AF = D.AFFARI, TU = V.TU;
const mondo = (seme, opz) => V.nuovo(seme, { opz: Object.assign({ geo: 2 }, opz) });
const giorno = (s, g) => { s.t = (g - 1) * 1440 + 600; return s; };
// il capitano entra in una città amica (la n-esima) con monete a volontà
function entra(s, n, oro) {
  const l = s.l.filter(x => x.tipo === 'citta')[n || 0]; assert(l, 'città ' + n);
  if (l.faz !== 'tu') s.rel[l.faz] = 0; const tu = TU(s); tu.x = l.x; tu.y = l.y; s.dentro = l.id; tu.oro = oro == null ? 50000 : oro; return l;
}
const bottega = (s, k) => V.fai(s, { a: 'bottega', k });
const aggiungi = V._.aggiungi, uom = tu => tu.tr.reduce((a, e) => a + (V._.D.TR[e.t].compagno ? 0 : e.n), 0);
const soldati = (tu, n) => { const e = tu.tr.find(x => !D.TR[x.t].compagno); e.n = n; e.f = 0; tu.tr = tu.tr.filter(x => x === e || D.TR[x.t].compagno); };
const COMP = D.COMPAGNI[0].id;
const compagnoQui = s => { aggiungi(TU(s).tr, COMP, 1); s.compagni[COMP] = -1; };

// ---- i dati ----
{
  eq([AF.BOTTEGHE, AF.CAROVANE, AF.SCORTA, AF.CAPITALE, AF.MERCENARIO, AF.CARICO, AF.SOSTA], [3, 2, 10, 300, 100, 20, 300]);
  eq(Object.keys(AF.TIPI), ['tintoria', 'armeria', 'birrificio']);
  for (const T of Object.values(AF.TIPI)) { assert(D.MERCI[T.compra.m] && D.MERCI[T.vende.m]); assert(T.costo > 0 && T.affitto > 0); }
  assert.strictEqual(AF.TIPI.tintoria.compra.m, 'lana'); assert.strictEqual(AF.TIPI.armeria.vende.n, 6); assert.strictEqual(AF.TIPI.birrificio.affitto, 30);
  const s = mondo(3); eq(V.affari(s), { botteghe: [], carovane: [], sett: 0 });
}

// ---- (a) gli errori nell'ordine ----
{
  const s = mondo(3), tu = TU(s);
  // fuori da una città, in un villaggio
  s.dentro = -1; assert.strictEqual(bottega(s, 'tintoria').err, NO);
  const v = s.l.find(x => x.tipo === 'villaggio'); s.dentro = v.id; assert.strictEqual(bottega(s, 'tintoria').err, NO);
  assert.strictEqual(V.fai(s, { a: 'carovana', verso: 0, capo: 'mer' }).err, NO);
  const c0 = entra(s, 0); assert.strictEqual(bottega(s, 'cantina').err, 'Bottega sconosciuta');
  s.rel[c0.faz] = -60; assert.strictEqual(bottega(s, 'tintoria').err, 'Non in una città nemica');
  assert.strictEqual(V.fai(s, { a: 'carovana', verso: 1, capo: 'mer' }).err, NO, 'nemica: niente carovane');
  s.rel[c0.faz] = 0;
  assert.strictEqual(V.fai(s, { a: 'bottega', k: 'tintoria', seat: 9 }).err, 'Capitano sconosciuto');
  tu.oro = 100; assert.strictEqual(bottega(s, 'tintoria').err, 'Servono 1200 monete'); assert.strictEqual(tu.oro, 100, 'gli errori non costano nulla');
  assert.strictEqual(V.tipiBottega(s, c0).find(t => t.k === 'tintoria').err, 'Servono 1200 monete');
  tu.oro = 50000; assert(bottega(s, 'armeria').s); assert.strictEqual(tu.oro, 50000 - AF.TIPI.armeria.costo);
  assert.strictEqual(bottega(s, 'birrificio').err, 'Qui ne hai già una');
  const c1 = entra(s, 1), c2 = entra(s, 2), c3 = entra(s, 3);
  entra(s, 1); assert(bottega(s, 'birrificio').s); entra(s, 2); assert(bottega(s, 'tintoria').s);
  entra(s, 3); assert.strictEqual(bottega(s, 'birrificio').err, 'Hai già 3 botteghe', 'la quarta');
  entra(s, 2, 0); assert.strictEqual(bottega(s, 'birrificio').err, 'Hai già 3 botteghe', 'prima di «qui ne hai già una» e dei soldi');
  assert.strictEqual(s.botteghe.length, 3); assert.strictEqual(V.affari(s).botteghe.length, 3);
  // vendi: metà del costo
  entra(s, 2, 0); const r = V.fai(s, { a: 'vendibottega' }); assert(r.s); assert.strictEqual(tu.oro, AF.TIPI.tintoria.costo / 2); assert.strictEqual(s.botteghe.length, 2);
  assert.strictEqual(V.fai(s, { a: 'vendibottega' }).err, 'Qui non hai una bottega');

  // carovane
  const s2 = mondo(3), t2 = TU(s2); const A = entra(s2, 0), B = s2.l.filter(x => x.tipo === 'citta')[1], Vl = s2.l.find(x => x.tipo === 'villaggio');
  const car = (verso, capo) => V.fai(s2, { a: 'carovana', verso, capo });
  assert.strictEqual(car(A.id, 'mer').err, 'Meta non valida', 'stessa città'); assert.strictEqual(car(Vl.id, 'mer').err, 'Meta non valida', 'villaggio');
  assert.strictEqual(car(999, 'mer').err, 'Meta non valida'); s2.rel[B.faz] = -60; assert.strictEqual(car(B.id, 'mer').err, 'Meta non valida', 'nemica'); s2.rel[B.faz] = 0;
  soldati(t2, 9); assert.strictEqual(car(B.id, 'mer').err, 'Servono 10 uomini di scorta'); soldati(t2, 60);
  assert.strictEqual(car(B.id, COMP).err, 'Il compagno non è con te'); assert.strictEqual(car(B.id, 'xx').err, 'Il compagno non è con te');
  compagnoQui(s2); t2.oro = 299; assert.strictEqual(car(B.id, COMP).err, 'Servono 300 monete');
  t2.oro = 399; assert.strictEqual(car(B.id, 'mer').err, 'Servono 400 monete'); assert.strictEqual(t2.oro, 399);
  t2.oro = 5000; const prima = uom(t2); const r1 = car(B.id, COMP); assert(r1.s, r1.err);
  assert.strictEqual(t2.oro, 4700); assert.strictEqual(uom(t2), prima - 10); assert(!t2.tr.some(e => e.t === COMP), 'il compagno è partito');
  assert.strictEqual(s2.compagni[COMP], -3); assert.strictEqual(s2.carovane.length, 1);
  const p = V.part(s2, s2.carovane[0].pid); assert(p && p.k === 'car' && p.faz === 'tu' && p.mia && p.casa === -1 && p.oro === 300 && p.dentro === A.id && uom(p) === 10);
  eq(p.rotta, [A.id, B.id]); assert.strictEqual(s2.carovane[0].capo, COMP);
  assert(car(B.id, 'mer').s); assert.strictEqual(t2.oro, 4300 - 0 + 0 - 100 + 100 - 100 + 100 - 0, 'il mercenario costa 400'); assert.strictEqual(s2.carovane.length, 2);
  assert.strictEqual(car(B.id, 'mer').err, 'Hai già 2 carovane', 'la terza');
  const af = V.affari(s2); assert.strictEqual(af.carovane.length, 2); assert.strictEqual(af.carovane[0].da, A.nome); assert.strictEqual(af.carovane[0].a, B.nome); assert.strictEqual(af.carovane[0].oro, 300);
}

// ---- (b) la bottega migliore rientra tra il giorno 30 e il 50 ----
{
  const s = mondo(3), tu = TU(s); let b = null;
  for (const l of s.l) if (l.tipo === 'citta') for (const t of V.tipiBottega(s, l)) if (!b || t.stima > b.st) b = { l, k: t.k, st: t.stima };
  assert(b.st > 100, 'stima: ' + b.st); entra(s, s.l.filter(x => x.tipo === 'citta').indexOf(b.l)); assert(bottega(s, b.k).s);
  const costo = AF.TIPI[b.k].costo; let cum = 0, quando = 0, resoconti = 0; s.tregua = 1e9;
  for (let g = 1; g <= 60; g++) {
    giorno(s, g); s.ev = []; V.giornoNuovo(s);
    const ev = s.ev.filter(e => e.t === 'affari'); if (ev.length) { resoconti++; assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].oro, s.affari.sett); assert.strictEqual(g % 7, 1); cum += s.botteghe[0].ultima; if (!quando && cum >= costo) quando = g; }
    assert(tu.oro >= 0);
  }
  assert(resoconti >= 8, 'un resoconto a settimana'); assert(quando >= 30 && quando <= 50, 'rientro al giorno ' + quando + ' (costo ' + costo + ', rese ' + cum + ')');
  assert(s.log.filter(x => /Affari della settimana/.test(x.tx)).length >= 1);
  // resa negativa: l'oro non scende sotto 0
  const q = mondo(3), qt = TU(q); entra(q, 0, 5000); assert(bottega(q, 'tintoria').s); qt.oro = 5; q.l[q.dentro].scorte.lana = 500;
  for (const m of Object.keys(D.MERCI)) q.l[q.dentro].scorte[m] = 0; q.l[q.dentro].scorte.lana = 500; q.tregua = 1e9; giorno(q, 8); V.giornoNuovo(q); assert(qt.oro >= 0);
}

// ---- (c) città che passa a un regno nemico ----
{
  const s = mondo(3), tu = TU(s); const c = entra(s, 0); assert(bottega(s, 'birrificio').s);
  const altro = V.regni(s).find(f => f !== c.faz); s.rel[altro] = -60; s.tregua = 1e9; giorno(s, 3); V.giornoNuovo(s); assert.strictEqual(s.botteghe.length, 1, 'ancora tua');
  c.faz = altro; giorno(s, 4); V.giornoNuovo(s); assert.strictEqual(s.botteghe.length, 0, 'confiscata'); assert(s.log.some(x => /confiscata/.test(x.tx)));
  // una città tua non si confisca mai
  const d = entra(s, 1); assert(bottega(s, 'birrificio').s); d.faz = 'tu'; giorno(s, 5); V.giornoNuovo(s); assert.strictEqual(s.botteghe.length, 1);
}

// ---- (d) carovana debole e predoni ----
{
  let perse = 0, tornati = 0; const SEMI = []; for (let i = 0; i < 20; i++) SEMI.push(3 + i * 7);
  for (const seme of SEMI) {
    const s = mondo(seme), tu = TU(s); const cit = s.l.filter(x => x.tipo === 'citta'); const A = entra(s, 0);
    // la città più vicina raggiungibile, non nemica
    const B = cit.filter(x => x.id !== A.id).sort((a, b) => V.dist(a, A) - V.dist(b, A))[0]; s.rel[B.faz] = 0;
    soldati(tu, 60); compagnoQui(s); const g0 = V._.gradDi(s, COMP).g;
    const r = V.fai(s, { a: 'carovana', verso: B.id, capo: COMP }); assert(r.s, r.err);
    const p = V.part(s, s.carovane[0].pid); p.tr = [{ t: p.tr[0].t, n: 1, f: 0, xp: 0 }];
    for (const k of [.25, .5, .75]) { const x = A.x + (B.x - A.x) * k, y = A.y + (B.y - A.y) * k, v = V._.vicinoOk(V.mappaDi(s), x, y); V._.nuovaP(s, 'pre', 'pre', 'Banda', v[0], v[1], V._.leva('pre', 120, () => .5), { oro: 30 }); }
    s.tregua = 1e9; tu.ord = { t: 'aspetta', fino: 1e9, n: 0 }; let g = 0;
    while (V.giorno(s) < 11 && g++ < 2000) { V.passo(s, 30); if (s.incontro) V.scegli(s, 'lascia'); if (s.rac && s.rac.scena) break; }
    const lost = !V.part(s, p.id); if (lost) { perse++; if (s.compagni[COMP] === A.id && V._.gradDi(s, COMP).g === Math.max(0, g0 - 8)) tornati++; }
  }
  assert(perse >= 10, 'carovane perdute: ' + perse + ' su 20'); assert.strictEqual(tornati, perse, 'il compagno torna nella città A con -8 di gradimento');
}

// ---- (e) richiama, mondi vecchi, salvataggi ----
{
  const s = mondo(11), tu = TU(s); const A = entra(s, 0), B = s.l.filter(x => x.tipo === 'citta')[1]; s.rel[B.faz] = 0; soldati(tu, 40); compagnoQui(s);
  const n0 = uom(tu); assert(V.fai(s, { a: 'carovana', verso: B.id, capo: COMP }).s); const pid = s.carovane[0].pid;
  const p = V.part(s, pid); p.oro = 340; p.porta = { m: 'lana', q: 4 }; const lana = tu.merci.lana || 0;
  const alt = entra(s, 2); assert.strictEqual(V.fai(s, { a: 'richiama', pid }).err, 'La carovana si richiama da una delle sue due città');
  assert.strictEqual(V.fai(s, { a: 'richiama', pid: 99999 }).err, 'Carovana sconosciuta');
  entra(s, 1, tu.oro); const oro1 = tu.oro; assert(V.fai(s, { a: 'richiama', pid }).s);
  assert.strictEqual(tu.oro, oro1 + 340); assert.strictEqual(uom(tu), n0); assert(tu.tr.some(e => e.t === COMP && e.n === 1)); assert.strictEqual(s.compagni[COMP], -1); assert.strictEqual(tu.merci.lana, lana + 4);
  assert(!V.part(s, pid)); assert.strictEqual(s.carovane.length, 0);
  // la carovana in cammino arriva e commercia: dopo una sosta ha ancora oro e una rotta
  const s2 = mondo(3), t2 = TU(s2); const A2 = entra(s2, 0), B2 = s2.l.filter(x => x.tipo === 'citta')[1]; s2.rel[B2.faz] = 0; soldati(t2, 40);
  assert(V.fai(s2, { a: 'carovana', verso: B2.id, capo: 'mer' }).s); s2.tregua = 1e9; TU(s2).ord = { t: 'aspetta', fino: 1e9, n: 0 }; const q = V.part(s2, s2.carovane[0].pid); let visti = 0, ultimo = q.dentro;
  for (let i = 0; i < 40 * 48; i++) { V.passo(s2, 30); if (s2.incontro) V.scegli(s2, 'lascia'); if (q.dentro !== ultimo) { visti++; ultimo = q.dentro; } if (!V.part(s2, q.id)) break; }
  assert(V.part(s2, q.id) ? visti >= 2 : true, 'ha fatto avanti e indietro: ' + visti);
  // mondi vecchi
  const v = V.nuovo(3), l = v.l.find(x => x.tipo === 'citta'); v.dentro = l.id; TU(v).oro = 5000;
  for (const z of [{ a: 'bottega', k: 'tintoria' }, { a: 'vendibottega' }, { a: 'carovana', verso: 1, capo: 'mer' }, { a: 'richiama', pid: 1 }]) assert.strictEqual(V.fai(v, z).err, NO, z.a);
  assert.strictEqual(TU(v).oro, 5000); eq(V.tipiBottega(v, l), []); assert(!v.botteghe && !v.carovane && !v.affari);
  const dir = path.join(__dirname, 'fixture/ven'); let n = 0;
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json'))) { const t = V.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(t, f); assert(!t.botteghe && !t.carovane, f); V.passo(t, 60); V.giornoNuovo(t); eq(V.affari(t), { botteghe: [], carovane: [], sett: 0 }); n++; }
  assert(n >= 6, 'salvataggi aperti: ' + n);
  // salvataggio in mezzo agli affari
  const u = mondo(3); entra(u, 0); bottega(u, 'birrificio'); const u2 = V.apri(JSON.stringify(u)); eq(V.affari(u2), V.affari(u));
}
console.log('test_ven_p43: ok');
