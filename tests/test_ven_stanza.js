// Compagnia di ventura in compagnia (VST): più capitani in una compagnia, mosse con «fin dove ero arrivato»,
// telefoni che fanno scorrere il tempo da soli e restano uguali, battaglia condivisa con un capitano a testa.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27a-avv-dadi.js', '28j-ven-dati.js', '28k-ven-mondo.js', '28l-ven-campo.js', '28m-ven-stanza.js'];
const S = carica.multi(F, 'VST'), V = carica.multi(F, 'VEN'), C = carica.multi(F, 'VCAM');
const ok = r => { assert(!r.err, r.err); return r.s; };
const J = x => JSON.stringify(x);
{
  const src = fs.readFileSync(path.join(__dirname, '../src/js/motori/28m-ven-stanza.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/Math\.(random|sin|cos|atan2?)\b|Date\.now|new Date/.test(src), 'funzione non ripetibile nel motore della stanza');
}
// tre capitani: contratto della stanza, compagnia più grossa, un capitano a testa
let g = S.nuova(3, ['Angelo', 'Bea', 'Ciro'], { seme: 7, regno: 'val' });
{
  for (const k of ['n', 'names', 'hands', 'cur', 'log', 'ev', 'evn', 'over']) assert(k in g, 'manca ' + k);
  assert(g.sim === true && g.n === 3 && V.capi(g.w).length === 3 && V.capi(g.w)[2].nome === 'Ciro');
  assert(V.uomini(V.TU(g.w)) > V.uomini(V.TU(V.nuovo(7, { regno: 'val' }))), 'più capitani, più uomini alla partenza');
  assert(S.nuova(9, ['a', 'b', 'c', 'd', 'e', 'f'], { seme: 1 }).n === S.MAX, 'al massimo quattro capitani');
  assert(S.act(g, { t: 'ordina', seat: 5, o: { t: 'ferma' } }).err && S.act(g, { t: 'balla', seat: 0 }).err && S.act(null, {}).err);
  const prima = J(g); S.act(g, { t: 'ordina', seat: 1, o: { t: 'aspetta', ore: 3 } }); assert.strictEqual(J(g), prima, 'act non tocca lo stato che riceve');
}
// il tempo: fermo senza meta, scorre con una meta; due telefoni che avanzano da soli restano uguali; `fino` porta lo stato fin lì
{
  assert(!S.scorre(g)); const t0 = g.w.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 0, fino: t0 + 500 })).w.t, t0, 'senza meta il tempo non passa');
  const vil = g.w.l.filter(l => l.tipo === 'villaggio' && l.faz === 'val').sort((a, b) => V.dist(a, V.TU(g.w)) - V.dist(b, V.TU(g.w)))[0];
  g = ok(S.act(g, { t: 'ordina', seat: 2, o: { t: 'entra', lid: vil.id } })); assert(S.scorre(g), 'chiunque può dare la meta');
  const a = S.copia(g), b = S.copia(g); S.avanza(a, g.w.t + 40); for (let k = 0; k < 40; k++) S.avanza(b, b.w.t + 1);
  assert.strictEqual(J(a.w), J(b.w), 'a passi diversi, stesso mondo');
  const c = ok(S.act(g, { t: 'tempo', seat: 1, fino: g.w.t + 40 })); assert.strictEqual(J(c.w), J(a.w), 'la mossa «tempo» porta la stanza dove sono i telefoni');
  assert.strictEqual(ok(S.act(c, { t: 'tempo', seat: 0, fino: g.w.t + 10 })).w.t, c.w.t, 'il tempo non torna indietro');
  // si arriva: il tempo si ferma da solo sulla porta del villaggio
  let n = 0; while (g.w.dentro < 0 && n++ < 300) { g = ok(S.act(g, { t: 'tempo', seat: 0, fino: g.w.t + 60 })); if (g.w.incontro) g = ok(S.act(g, { t: 'scegli', seat: 0, v: g.w.incontro.tipo === 'parla' ? 'lascia' : 'fuggi' })); if (!V.TU(g.w).ord && g.w.dentro < 0) g = ok(S.act(g, { t: 'ordina', seat: 0, o: { t: 'entra', lid: vil.id } })); }
  assert.strictEqual(g.w.dentro, vil.id); const tf = g.w.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 0, fino: tf + 300 })).w.t, tf);
  // ognuno spende i suoi punti e compra per sé, dalla cassa comune
  const u0 = V.uomini(V.TU(g.w)); g = ok(S.act(g, { t: 'fai', seat: 1, z: { a: 'recluta', n: 1 } })); assert.strictEqual(V.uomini(V.TU(g.w)), u0 + 1);
  g = ok(S.act(g, { t: 'fai', seat: 2, z: { a: 'abilita', k: 'medicina' } })); assert(V.capi(g.w)[2].ab.medicina === 1 && V.capi(g.w)[0].ab.medicina === 0 && V.capi(g.w)[2].punti === 0);
  assert(S.act(g, { t: 'fai', seat: 2, z: { a: 'abilita', k: 'medicina' } }).err, 'i punti sono di chi li ha');
  assert.strictEqual(V.abil(g.w, 'medicina'), 1, 'la compagnia usa il migliore dei capitani');
  g = ok(S.act(g, { t: 'vel', seat: 0, v: 4 })); assert(g.vel === 4); g = ok(S.act(g, { t: 'fai', seat: 0, z: { a: 'esci' } }));
}
// battaglia condivisa: un capitano a testa, ordini di tutti, telefoni uguali, esito nel mondo
{
  const w = g.w, tu = V.TU(w); tu.tr = [{ t: 'val_f3', n: 14, f: 0, xp: 0 }, { t: 'val_t3', n: 8, f: 0, xp: 0 }];
  const p = w.p.find(p => p.k === 'pre'); p.tr = [{ t: 'pre_f1', n: 9, f: 0, xp: 0 }, { t: 'pre_t2', n: 3, f: 0, xp: 0 }]; w.incontro = { tipo: 'nemico', pid: [p.id], all: [], da: 'tu' };
  assert(!S.scorre(g), 'con un incontro aperto il mondo aspetta');
  g = ok(S.act(g, { t: 'scegli', seat: 1, v: 'attacca' })); assert(g.b && !g.b.via && g.b.c.capi.length === 3, 'tre capitani in campo');
  assert(S.act(g, { t: 'ordina', seat: 0, o: { t: 'ferma' } }).err, 'in battaglia niente ordini sulla mappa');
  const t0 = g.b.c.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 0, fino: 50 })).b.c.t, t0, 'prima del via la battaglia è ferma');
  g = ok(S.act(g, { t: 'b-via', seat: 2 }));
  g = ok(S.act(g, { t: 'b-cap', seat: 1, o: { x: 12, y: 60 }, fino: 5 })); assert.strictEqual(g.b.c.t, 5, 'la mossa porta la battaglia all\'istante di chi la fa');
  const c1 = C.capU(g.b.c, 1), c0 = C.capU(g.b.c, 0); assert(c1.vx === 12 && c0.vx !== 12, 'ognuno muove solo il suo capitano');
  const a = S.copia(g), b = S.copia(g); S.avanzaB(a, 60); for (let k = 6; k <= 60; k++) S.avanzaB(b, k); assert.strictEqual(J(a.b.c.u), J(b.b.c.u), 'due telefoni, stessa battaglia');
  g = ok(S.act(g, { t: 'b-ord', seat: 2, o: { g: 'tutti', t: 'segui' }, fino: 20 })); assert(g.b.c.ord.a.f.t === 'segui' && g.b.c.ord.a.f.seg === 2, '«Seguimi» segue chi lo dice');
  g = ok(S.act(g, { t: 'b-pausa', seat: 0, v: true, fino: 30 })); const tp = g.b.c.t; assert.strictEqual(ok(S.act(g, { t: 'tempo', seat: 1, fino: 400 })).b.c.t, tp, 'chiunque mette in pausa');
  g = ok(S.act(g, { t: 'b-pausa', seat: 1, v: false })); g = ok(S.act(g, { t: 'b-ord', seat: 0, o: { g: 'tutti', t: 'carica' } }));
  assert(S.act(g, { t: 'b-fine', seat: 0 }).err, 'non si chiude una battaglia in corso');
  let n = 0; while (!g.b.c.fine && n++ < 80) g = ok(S.act(g, { t: 'tempo', seat: n % 3, fino: g.b.c.t + 100 }));
  assert(g.b.c.fine && g.b.c.fine.vince === 'a', 'i veterani con tre capitani battono dodici predoni');
  const vinte = g.w.stat.vinte, x0 = V.capi(g.w).map(c => c.xp + c.liv * 1000); g = ok(S.act(g, { t: 'b-fine', seat: 1 }));
  assert(!g.b && g.w.stat.vinte === vinte + 1 && !g.w.incontro && g.w.ult.vince === 'a' && g.nb === 1);
  V.capi(g.w).forEach((c, i) => assert(c.xp + c.liv * 1000 > x0[i], 'tutti i capitani fanno esperienza'));
  assert(S.act(g, { t: 'b-fine', seat: 0 }).err, 'chiusa una volta sola');
}
// se cadono tutti i capitani e la giornata è persa, la compagnia è in catene e il tempo corre da solo
{
  const w = g.w, p = w.p.find(p => p.k === 'pre'); p.tr = [{ t: 'pre_f3', n: 60, f: 0, xp: 0 }]; w.incontro = { tipo: 'nemico', pid: [p.id], all: [], da: 'loro' };
  V.esito(w, { vince: 'b', cad: [], capKo: true }); assert(w.prigioniero && S.scorre(g) && S.ritmo(g) >= 6);
  let n = 0; while (g.w.prigioniero && n++ < 200) g = ok(S.act(g, { t: 'tempo', seat: 0, fino: g.w.t + 120 })); assert(!g.w.prigioniero, 'prima o poi si fugge');
}
// salvare e riprendere (V1): il mondo si salva, mai una battaglia; con più o meno giocatori la compagnia si adatta
{
  let h = S.nuova(2, ['Ada', 'Bruno'], { seme: 11, regno: 'val' });
  h = ok(S.act(h, { t: 'vel', seat: 0, v: 2 }));
  const sv = S.salvabile(h); assert(sv && sv.v === 1 && sv.n === 2 && sv.giorno === V.giorno(h.w) && J(sv.nomi) === J(['Ada', 'Bruno']));
  const r = ok(S.apri(JSON.parse(J(sv)), 2, ['X', 'Y']));
  const senzaEv = w => J(Object.assign({}, w, { ev: [] }));
  assert.strictEqual(senzaEv(r.w), senzaEv(h.w), 'riaprendo si ha lo stesso mondo');
  assert(r.sim && r.n === 2 && !r.b && V.capi(r.w)[1].nome === 'Bruno', 'i nomi dei capitani salvati restano');
  assert.strictEqual(J(S.nuova(2, ['X', 'Y'], { rip: sv }).w), J(r.w), 'nuova con rip chiama apri');
  // 2 -> 3: un socio nuovo in coda, nessun attivi
  const tre = ok(S.apri(sv, 3, ['A', 'B', 'Carla']));
  assert(tre.w.soci.length === 2 && V.capi(tre.w)[2].nome === 'Carla' && V.capi(tre.w).length === 3 && tre.w.attivi === undefined && tre.n === 3);
  assert.strictEqual(ok(S.apri(sv, 9, [])).n, S.MAX, 'al massimo quattro');
  // 3 -> 1: i capitani restano in soci ma ne scende in campo uno solo
  const uno = ok(S.apri(S.salvabile(tre), 1, ['Solo']));
  assert(uno.w.attivi === 1 && uno.w.soci.length === 2 && V.capi(uno.w).length === 1);
  const w1 = uno.w, p = w1.p.find(p => p.k === 'pre'); p.tr = [{ t: 'pre_f1', n: 3, f: 0, xp: 0 }]; w1.incontro = { tipo: 'nemico', pid: [p.id], all: [], da: 'tu' };
  assert.strictEqual(V.campo(w1).capi.length, 1, 'in campo un solo capitano');
  // e si può rialzare il numero: tornano tutti in campo
  assert(V.capi(ok(S.apri(S.salvabile(uno), 3, ['a', 'b', 'c'])).w).length === 3);
  // un salvataggio del solitario (mondo v2 senza forma {v:1,w}) si apre; uno rotto no
  const solo = V.nuovo(5, { nome: 'Solo', regno: 'val' }); assert(ok(S.apri(JSON.parse(V.salva(solo)), 2, ['a', 'b'])).w.soci.length === 1);
  assert(ok(S.apri(V.salva(solo), 1, ['a'])).w.attivi === undefined, 'senza soci, tutti attivi');
  assert(S.apri({ w: { v: 9 } }, 1, []).err === 'Salvataggio non leggibile' && S.apri(null, 1, []).err && S.apri('{', 1, []).err);
  // con una battaglia in corso non si salva
  const w2 = h.w, p2 = w2.p.find(p => p.k === 'pre'); p2.tr = [{ t: 'pre_f1', n: 3, f: 0, xp: 0 }]; w2.incontro = { tipo: 'nemico', pid: [p2.id], all: [], da: 'tu' };
  const bh = ok(S.act(h, { t: 'scegli', seat: 0, v: 'attacca' })); assert(bh.b && S.salvabile(bh) === null && S.salvabile(null) === null);
}

// torneo in compagnia (V2): due capitani si iscrivono insieme (si paga per ciascuno), entrano in lizza insieme contro due avversari, si vince o si perde come squadra
{
  let t = S.nuova(2, ['Angelo', 'Bea'], { seme: 12, regno: 'val' }); const w = t.w, l = w.l.find(l => l.tipo === 'citta'); w.t += ((7 - (V.giorno(w) + l.id) % 7) % 7) * 1440; w.dentro = l.id; V.TU(w).oro = 5000;
  for (const c of V.capi(w)) { c.liv = 6; c.ab.prodezza = 4; Object.assign(c.eq, { arma: 'bastarda', scudo: 'mandorla', armatura: 'brigantina', elmo: 'bacinetto' }); }
  const oro0 = V.TU(w).oro; t = ok(S.act(t, { t: 'fai', seat: 1, z: { a: 'torneo' } })); assert.strictEqual(oro0 - V.TU(t.w).oro, 40 * 12, 'iscrizione pagata per ciascun capitano');
  assert(S.act(t, { t: 'fai', seat: 0, z: { a: 'torneo' } }).err, 'già iscritti'); t = ok(S.act(t, { t: 'fai', seat: 0, z: { a: 'lizza' } })); assert.strictEqual(t.w.incontro.tipo, 'arena'); assert(!S.scorre(t), 'durante il duello il tempo del mondo sta fermo');
  const prima = J(t); assert(S.act(t, { t: 'fai', seat: 1, z: { a: 'esci' } }).err); assert.strictEqual(J(t), prima);
  t = ok(S.act(t, { t: 'scegli', seat: 0, v: 'attacca' })); assert(t.b && t.b.c.tipo === 'arena' && t.b.c.capi.length === 2 && t.b.c.u.filter(u => u.l === 'b').length === 2);
  assert(S.act(t, { t: 'b-ord', seat: 0, o: { t: 'carica' } }).err && S.act(t, { t: 'b-cap', seat: 1, o: { grido: true } }).err, 'nessun ordine, niente grido');
  t = ok(S.act(t, { t: 'b-via', seat: 0 })); let g = 0; while (!t.b.c.fine && g++ < 400) t = ok(S.act(t, { t: 'tempo', seat: 0, fino: t.b.c.t + 100 }));
  assert(t.b.c.fine, 'il duello finisce'); const vince = t.b.c.fine.vince; assert(S.act(t, { t: 'b-fine', seat: 1 }).s); t = ok(S.act(t, { t: 'b-fine', seat: 1 })); assert.strictEqual(t.b, null); assert.strictEqual(t.w.incontro, null);
  const o = t.w.ult; assert.strictEqual(o.vince, vince); assert.strictEqual(!!o.torneo.vinto, vince === 'a'); if (vince === 'a') assert.strictEqual(t.w.torneo.turno, 1); else assert.strictEqual(t.w.torneo, null);
  assert(vince === 'b' || S.salvabile(t).w.torneo.turno === 1, 'il torneo si salva con il mondo');
  if (vince === 'a') { t = ok(S.act(t, { t: 'fai', seat: 1, z: { a: 'ritira' } })); assert.strictEqual(t.w.torneo, null); assert(V.TU(t.w).oro >= oro0 - 40 * 12 + 40 * 12 * 2 - 50, 'il premio maturato arriva alla cassa comune'); }
}
console.log('ven_stanza ok');
