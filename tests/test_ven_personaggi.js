// Compagnia di ventura, personaggi (V6a): gradimento dei compagni (ama/odia, addii), memoria e confidenza dei signori (favori, prestiti, sostegno), tre talenti.
// Niente dadi: il gradimento è un conto. (La prova lunga col bot accorto è test_ven_personaggi_bot.js.)
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_SENZA_VOCI;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const ok = x => { assert(!x.err, x.err); return x; };
const G = D.GRAD, S = D.SIG;
const capitale = (s, f) => s.l.find(l => l.tipo === 'citta' && l.faz === f);
// un compagno in compagnia, come dopo `fai compagno`
const assolda = (s, id) => { const tu = V.TU(s); tu.tr.push({ t: id, n: 1, f: 0, xp: 0 }); s.compagni[id] = -1; s.grad[id] = { g: G.INIZIO, avv: 0, visto: [] }; };
const ricco = s => { const tu = V.TU(s); tu.oro = 99999; tu.merci.grano = 400; s.tregua = 1e9; return s; };
const aspetta = (s, giorni) => { const fine = s.t + giorni * D.GRAD.GIORNI * 0 + giorni * V.P.GIORNO; let g = 0; while (s.t < fine && g++ < 5000) { if (s.incontro) { V.scegli(s, 'lascia'); if (s.incontro) V.auto(s); } if (!V.TU(s).ord) V.ordina(s, { t: 'aspetta', ore: 24 }); V.passo(s, 60); } };
const incontroCon = (s, sg) => { s.dentro = -1; s.davanti = -1; s.incontro = { tipo: 'parla', pid: [sg.pid], all: [] }; return s; };

// i numeri e i campi dei dati ci sono
assert.strictEqual(JSON.stringify(Object.keys(G).sort()),JSON.stringify( ['AMA', 'ANTIPATIA', 'FIDO', 'GIORNI', 'INIZIO', 'INTESA', 'LUTTO', 'ODIA', 'NONSERVE', 'PAGA', 'PARLA', 'QUOTA', 'SEGUONO', 'SERVE', 'VIA', 'VINTA'].sort()));
assert.strictEqual(JSON.stringify(Object.keys(S).sort()), JSON.stringify(['ATTESA', 'LETTERA', 'MAX_SOST', 'PRESTITO', 'RESA', 'SCAD', 'SOGLIE', 'SOSTEGNO'].sort()));
for (const c of D.COMPAGNI) { assert(c.ama.length === 2 && c.odia.length === 2, c.id); assert(D.COMPAGNI.some(x => x.id === c.lega.id) && Math.abs(c.lega.n) === 1, 'legame di ' + c.id); }
for (const k of ['carisma', 'diplomazia', 'cavaliere']) assert(D.ABIL[k] && V.nuovo(1).cap.ab[k] === 0, 'talento ' + k);
assert.strictEqual(V.umore(80), 'fedele'); assert.strictEqual(V.umore(60), 'contento'); assert.strictEqual(V.umore(40), 'tranquillo'); assert.strictEqual(V.umore(30), 'scontento'); assert.strictEqual(V.umore(10), 'in bilico');

// ama e odia: un conto, con Carisma più su e meno giù; una riga di cronaca; l'infobox sa solo ciò che è già successo
{
  const s = V.nuovo(3); assolda(s, 'co_lapo'); assolda(s, 'co_berta');
  V.reagisci(s, 'libera'); // lapo ama, berta no
  assert.strictEqual(s.grad.co_lapo.g, G.INIZIO + G.AMA); assert.strictEqual(s.grad.co_berta.g, G.INIZIO);
  assert.strictEqual(s.grad.co_lapo.visto.join(), 'libera'); assert.strictEqual(s.grad.co_berta.visto.length, 0);
  assert(s.log.some(r => /Lapo Cerusico approva/.test(r.tx) && r.tipo === 'bene'));
  V.reagisci(s, 'razzia'); assert.strictEqual(s.grad.co_lapo.g, G.INIZIO + G.AMA + G.ODIA);
  assert(s.log.some(r => /Lapo Cerusico non gradisce/.test(r.tx) && r.tipo === 'male'));
  s.cap.ab.carisma = 10; V.reagisci(s, 'libera'); assert.strictEqual(s.grad.co_lapo.g, G.INIZIO + G.AMA + G.ODIA + G.AMA * 2, 'positivo ×2 con Carisma 10');
  const t = V.nuovo(3); assolda(t, 'co_lapo'); t.cap.ab.carisma = 10; V.reagisci(t, 'razzia'); assert.strictEqual(t.grad.co_lapo.g, G.INIZIO + G.ODIA / 2, 'negativo ×0,5 con Carisma 10');
  V.reagisci(t, 'servi_mar'); assert.strictEqual(t.grad.co_lapo.g, G.INIZIO + G.ODIA / 2, 'lapo non ha opinioni su servi_mar');
  const u = V.nuovo(3); assolda(u, 'co_ghino'); V.reagisci(u, 'servi_mar'); assert.strictEqual(u.grad.co_ghino.g, G.INIZIO + G.NONSERVE, 'servire un regno detestato pesa NONSERVE');
  const w = V.nuovo(3); assolda(w, 'co_isa'); V.reagisci(w, 'servi_mar'); assert.strictEqual(w.grad.co_isa.g, G.INIZIO + G.SERVE, 'servire un regno amato pesa SERVE');
  for (let i = 0; i < 30; i++) V.reagisci(w, 'riscatta'); assert.strictEqual(w.grad.co_isa.g, 100, 'limite 100');
}

// prova 1: chi detesta la razzia se ne va, con pochi uomini, e non torna
{
  const s = ricco(V.nuovo(5)), tu = V.TU(s); s.dentro = -1; assolda(s, 'co_lapo');
  tu.tr.find(e => e.t.endsWith('_f1')).n += 12; // 19 uomini oltre a lui, entro il limite della compagnia: la quota (12%) ne porta via 2
  const uomini0 = V.uomini(tu) - 1;
  for (let i = 0; i < 5; i++) V.reagisci(s, 'razzia');
  assert.strictEqual(s.grad.co_lapo.g, G.INIZIO + 5 * G.ODIA);
  aspetta(s, 30);
  assert.strictEqual(s.compagni.co_lapo, -3, 'se n\'è andato per sempre');
  assert(!tu.tr.some(e => e.t === 'co_lapo'), 'non è più in compagnia'); assert(!s.grad.co_lapo);
  const persi = uomini0 - V.uomini(tu); assert(persi >= 1 && persi <= G.SEGUONO, 'porta via qualcuno, al più ' + G.SEGUONO + ' uomini: ' + persi);
  assert(s.log.some(r => /Lapo Cerusico lascia la compagnia/.test(r.tx)));
}
// chi scende sotto PARLA lo dice, poi se ne va dopo GIORNI giorni; se risale resta
{
  const s = ricco(V.nuovo(6)); s.dentro = -1; assolda(s, 'co_nera'); s.grad.co_nera.g = G.PARLA - 5;
  aspetta(s, 2); assert(s.grad.co_nera.avv > 0 && s.compagni.co_nera === -1, 'avvisa subito, non se ne va');
  assert(s.log.some(r => /Suor Nera vuole parlarti: così non resta/.test(r.tx)));
  s.grad.co_nera.g = G.PARLA + 3; aspetta(s, 1); assert.strictEqual(s.grad.co_nera.avv, 0, 'risalito: nessun avviso');
  s.grad.co_nera.g = G.PARLA - 5; aspetta(s, 3); assert.strictEqual(s.compagni.co_nera, -1, 'prima di GIORNI giorni resta');
  aspetta(s, G.GIORNI + 1); assert.strictEqual(s.compagni.co_nera, -3, 'dopo GIORNI giorni sotto PARLA se ne va');
}
// chi aveva intesa con chi parte ne soffre
{
  const s = ricco(V.nuovo(7)); s.dentro = -1; assolda(s, 'co_lapo'); assolda(s, 'co_nera'); assolda(s, 'co_berta');
  s.grad.co_lapo.g = G.VIA; aspetta(s, 1);
  assert.strictEqual(s.compagni.co_lapo, -3);
  assert(s.grad.co_nera.g <= G.INIZIO + G.LUTTO + G.PAGA * 2, 'Nera (intesa con Lapo) risente della partenza: ' + s.grad.co_nera.g);
  assert(s.grad.co_berta.g >= G.INIZIO, 'Berta no');
}
// paga: pagati salgono, in ritardo è un evento; legami ogni paga se l'altro è in compagnia
{
  const s = V.nuovo(8); s.dentro = -1; s.tregua = 1e9; V.TU(s).merci.grano = 400; assolda(s, 'co_isa'); assolda(s, 'co_brando'); // isa e brando: antipatia
  V.TU(s).oro = 0; aspetta(s, 7);
  assert(s.grad.co_isa.visto.includes('pagatardi'), 'isa detesta la paga in ritardo');
  assert(s.grad.co_isa.g < G.INIZIO, 'isa scende: ' + s.grad.co_isa.g);
  assert(s.grad.co_brando.visto.length === 0 || !s.grad.co_brando.visto.includes('pagatardi'));
  const t = V.nuovo(8); t.dentro = -1; t.tregua = 1e9; ricco(t); assolda(t, 'co_lapo'); assolda(t, 'co_nera');
  aspetta(t, 8); assert(t.grad.co_lapo.g > G.INIZIO && t.grad.co_lapo.g === t.grad.co_nera.g, 'paga puntuale e intesa: salgono: ' + t.grad.co_lapo.g);
}
// stesso seme e stesse mosse → stesso salvataggio; un v2 vecchio senza grad, mem, talenti si apre e abil non dà mai NaN
{
  const a = ricco(V.nuovo(9)), b = ricco(V.nuovo(9)); for (const s of [a, b]) { s.dentro = -1; assolda(s, 'co_ulf'); for (let i = 0; i < 3; i++) V.reagisci(s, 'fuga'); aspetta(s, 12); }
  assert.strictEqual(V.salva(a), V.salva(b), 'stesse mosse, stesso stato');
  assert.strictEqual(V.salva(V.apri(V.salva(a))), V.salva(a), 'salvare e riaprire non cambia nulla');
  const v = V.nuovo(4, { soci: [{ nome: 'Ada' }] }); V.TU(v).tr.push({ t: 'co_dia', n: 1, f: 0, xp: 0 }); s0(v);
  function s0(x) { delete x.grad; delete x.lettere; delete x.debiti; for (const sg of x.sig) delete sg.mem; for (const c of [x.cap].concat(x.soci)) for (const k of ['carisma', 'diplomazia', 'cavaliere']) delete c.ab[k]; }
  const t = V.apri(JSON.stringify(v)); assert(t, 'si apre');
  for (const k of Object.keys(D.ABIL)) { assert(Number.isFinite(V.abil(t, k)), 'abil ' + k); for (const c of [t.cap].concat(t.soci)) assert.strictEqual(typeof c.ab[k], 'number'); }
  assert(t.sig.every(sg => sg.mem && sg.mem.lib === 0), 'ogni signore ha la memoria'); assert(t.grad.co_dia && t.grad.co_dia.g === G.INIZIO, 'chi è già in compagnia parte a INIZIO');
  assert(t.debiti.length === 0 && typeof t.lettere === 'object');
  const x = ricco(t); x.dentro = -1; aspetta(x, 8); assert(V.salva(x));
}

// co-op: una partita in stanza salvata prima della scheda (senza grad, mem, talenti) si riapre, anche con più giocatori di prima
{
  const F2 = F, S2 = carica.multi(F2, 'VST'), V2 = carica.multi(F2, 'VEN');
  const G0 = S2.nuova(2, ['Ada', 'Bruno'], { seme: 5 }), sv = S2.salvabile(G0); const w = sv.w;
  delete w.grad; delete w.lettere; delete w.debiti; for (const sg of w.sig) delete sg.mem; for (const c of [w.cap].concat(w.soci)) for (const k of ['carisma', 'diplomazia', 'cavaliere']) delete c.ab[k];
  const r = S2.apri(JSON.parse(JSON.stringify(sv)), 3, ['Ada', 'Bruno', 'Carla']); assert(!r.err, r.err); const m = r.s ? r.s.w : r.w;
  for (const c of [m.cap].concat(m.soci)) for (const k of Object.keys(D.ABIL)) assert(Number.isFinite(c.ab[k]), c.nome + ' ' + k);
  assert(m.sig.every(sg => sg.mem) && m.grad && m.debiti);
}
// gli agganci: ogni azione o evento di cronaca arriva ai compagni (tutti e dieci in compagnia: qualcuno lo ama o lo detesta, quindi lo «vede»)
{
  const dieci = s => { const tu = V.TU(s); for (const c of D.COMPAGNI) { tu.tr.push({ t: c.id, n: 1, f: 0, xp: 0 }); s.compagni[c.id] = -1; s.grad[c.id] = { g: G.INIZIO, avv: 0, visto: [] }; } return s; };
  const visti = s => new Set(Object.values(s.grad).flatMap(g => g.visto));
  const luogoDi = (s, tipo) => { const l = s.l.find(x => x.tipo === tipo); s.dentro = l.id; s.davanti = -1; return l; };
  { const s = dieci(V.nuovo(20)); V.TU(s).oro = 9999; s.prig.push({ t: 'pre_f1', n: 1 }); luogoDi(s, 'villaggio'); ok(V.fai(s, { a: 'libera', t: 'pre_f1' })); assert(visti(s).has('libera'), 'libera'); }
  { const s = dieci(V.nuovo(20)); luogoDi(s, 'citta'); s.prig.push({ t: 'pre_f1', n: 2 }); ok(V.fai(s, { a: 'riscatta' })); assert(visti(s).has('riscatta'), 'riscatta'); }
  { const s = dieci(V.nuovo(20)); luogoDi(s, 'monastero'); const tu = V.TU(s); tu.oro = 999; tu.tr.find(e => e.t.endsWith('_f1')).f = 2; ok(V.fai(s, { a: 'cura' })); assert(visti(s).has('cura'), 'cura'); }
  { const s = dieci(V.nuovo(20)), v = s.l.find(x => x.tipo === 'villaggio' && x.faz !== 'tu'); s.rel[v.faz] = -80; s.guerra = {}; for (const f of D.REGNI) if (f !== v.faz) s.guerra[f < v.faz ? f + '|' + v.faz : v.faz + '|' + f] = true; s.dentro = -1; s.davanti = v.id; v.sacc = 0;
    ok(V.fai(s, { a: 'razzia' })); assert(visti(s).has('razzia'), 'razzia'); }
  { const s = dieci(V.nuovo(20)), tu = V.TU(s); s.dentro = -1; const p = s.p.find(x => x.k === 'pre'); p.ia.st = 'giro'; tu.oro = 800;
    s.incontro = { tipo: 'nemico', pid: [p.id], da: 'x' }; const r = V.scegli(s, 'paga'); assert(!r.err, r.err); assert(visti(s).has('tributo'), 'tributo');
    const t = dieci(V.nuovo(20)); t.dentro = -1; const q = t.p.find(x => x.k === 'pre'); t.incontro = { tipo: 'nemico', pid: [q.id], da: 'x' }; ok(V.scegli(t, 'fuggi')); assert(visti(t).has('fuga'), 'fuga'); }
  { const s = dieci(V.nuovo(20)); s.dentro = -1; s.tregua = 1e9; V.TU(s).oro = 9999; V.TU(s).merci = {}; aspetta(s, 2); assert(visti(s).has('fame'), 'fame'); }
  { const s = dieci(V.nuovo(20)); s.dentro = -1; s.tregua = 1e9; s.servizio = { faz: 'mar', tipo: 'mer', fino: 999 }; ricco(s); aspetta(s, 8); assert(visti(s).has('servi_mar'), 'servi_mar alla paga'); }
}
// investi: il compagno fatto signore ha la sua memoria
{
  const s = V.nuovo(21), tu = V.TU(s); s.corona = { nome: 'Regno', stend: 0, da: 1, sede: -1, malc: 0, minacce: {} }; const l = s.l.find(x => x.tipo === 'castello'); l.faz = 'tu'; l.sig = -1; s.dentro = l.id;
  tu.tr.push({ t: 'co_dia', n: 1, f: 0, xp: 0 }); s.compagni.co_dia = -1; ok(V.fai(s, { a: 'investi', t: 'co_dia', lid: l.id }));
  assert(s.sig[s.sig.length - 1].mem && s.sig[s.sig.length - 1].mem.fav === 0, 'investi: memoria presente');
}
// memoria dei signori e confidenza
const signore = (s, f) => s.sig.find(x => x.faz === f && !x.re);
{
  const s = V.nuovo(10), sg = signore(s, 'val'); s.rel.val = 0;
  assert.strictEqual(V.confidenza(s, sg), 0);
  sg.mem.lib = 1; assert.strictEqual(V.confidenza(s, sg), 1);
  sg.mem.lib = 2; sg.mem.fav = 1; assert.strictEqual(V.confidenza(s, sg), 2);
  sg.mem.trad = 1; assert.strictEqual(V.confidenza(s, sg), 0, 'un tradimento la riporta a 0');
  sg.mem.trad = 0; sg.mem.lib = 4; assert.strictEqual(V.confidenza(s, sg), 3);
  sg.mem.sconf = 6; assert.strictEqual(V.confidenza(s, sg), 0, 'le sconfitte inflitte pesano'); sg.mem.sconf = 0;
  sg.mem.lib = 0; sg.mem.fav = 0; s.rel.val = 90; assert.strictEqual(V.confidenza(s, sg), 1, 'l\'amicizia col regno conta (6 punti: 1)'); s.rel.val = -40; assert.strictEqual(V.confidenza(s, sg), 0, 'l\'ostilità non dà punti in meno');
}
// liberare un signore prigioniero senza riscatto
{
  const s = V.nuovo(11), sg = signore(s, 'sel'); s.prig.push({ sig: sg.id, n: 1, t: 'sig' }); sg.prig = 'tu'; const r0 = s.rel.sel;
  assert(V.fai(s, { a: 'liberasig', sig: sg.id + 1 }).err === 'Non è tuo prigioniero');
  ok(V.fai(s, { a: 'liberasig', sig: sg.id })); assert.strictEqual(sg.mem.lib, 1); assert.strictEqual(s.rel.sel, r0 + 6); assert(!s.prig.length && !sg.prig);
  assert(V.fai(s, { a: 'liberasig', sig: sg.id }).err, 'una volta sola');
  // la sconfitta e l'alleanza nella vittoria lasciano il segno; consegnare in un luogo di un signore: favore
  const t = V.nuovo(11), cs = t.l.find(l => l.tipo === 'castello' && l.sig >= 0), sgc = t.sig[cs.sig], altro = t.l.find(l => l.tipo === 'citta');
  V.TU(t).merci.grano = 20; t.dentro = cs.id; t.incarichi.push({ id: 99, tipo: 'consegna', bene: 'grano', n: 3, a: cs.id, da: altro.id, premio: 40, giorni: 12 }); altro.inc = { tipo: 'consegna' };
  ok(V.fai(t, { a: 'consegna' })); assert.strictEqual(sgc.mem.fav, 1, 'consegna nel suo castello: favore');
}
// tradimenti: aggredire un signore nell'incontro; lasciare il re da vassallo (tutti i signori del regno)
{
  const s = V.nuovo(12), sg = signore(s, 'fer'); incontroCon(s, sg); ok(V.scegli(s, 'aggredisci')); assert.strictEqual(sg.mem.trad, 1);
  const t = V.nuovo(12); t.servizio = { faz: 'val', tipo: 'vas' }; t.dentro = capitale(t, 'val').id; ok(V.fai(t, { a: 'lascia' }));
  for (const x of t.sig) assert.strictEqual(x.mem.trad, x.faz === 'val' ? 1 : 0, x.nome);
  const u = V.nuovo(12); u.servizio = { faz: 'val', tipo: 'mer', fino: 99 }; u.dentro = capitale(u, 'val').id; ok(V.fai(u, { a: 'lascia' })); assert(u.sig.every(x => x.mem.trad === 0), 'un mercenario non tradisce');
}
// favori: notizie, lettera, prestito, rendi
{
  const s = V.nuovo(13), sg = signore(s, 'val'), tu = V.TU(s); s.rel.val = 0; s.t = 10 * V.P.GIORNO;
  incontroCon(s, sg); assert.strictEqual(V.scegli(s, 'notizie').err, 'Non ti conosce abbastanza', 'confidenza 0: niente notizie');
  sg.mem.lib = 1; ok(V.scegli(s, 'notizie')); assert.strictEqual(sg.mem.g, V.giorno(s));
  assert.strictEqual(V.scegli(s, 'lettera').err, 'Non ti conosce abbastanza', 'a confidenza 1 la lettera non c\'è');
  sg.mem.lib = 2; sg.mem.fav = 1; assert.strictEqual(V.scegli(s, 'lettera').err, 'Torna tra qualche giorno', 'un favore ogni ATTESA giorni');
  s.t += S.ATTESA * V.P.GIORNO; s.incontro = { tipo: 'parla', pid: [sg.pid], all: [] };
  ok(V.scegli(s, 'lettera')); assert.strictEqual(s.lettere.val, V.giorno(s) + S.LETTERA);
  s.t += S.ATTESA * V.P.GIORNO; const oro0 = tu.oro; ok(V.scegli(s, 'prestito')); assert.strictEqual(tu.oro, oro0 + S.PRESTITO);
  assert.strictEqual(JSON.stringify(s.debiti.map(d => [d.sig, d.oro, d.scad])), JSON.stringify([[sg.id, S.RESA, V.giorno(s) + S.SCAD]]));
  s.t += S.ATTESA * V.P.GIORNO; assert.strictEqual(V.scegli(s, 'prestito').err, 'Gli devi già del denaro');
  tu.oro = 5; assert(/Servono/.test(V.scegli(s, 'rendi').err)); tu.oro = 1000; ok(V.scegli(s, 'rendi')); assert.strictEqual(tu.oro, 1000 - S.RESA); assert(!s.debiti.length);
  assert.strictEqual(V.scegli(s, 'rendi').err, 'Non gli devi nulla');
  // con la lettera il contratto non chiede la fama
  const t = V.nuovo(13); t.dentro = capitale(t, 'val').id; t.fama = 0; assert(/Serve fama/.test(V.fai(t, { a: 'contratto' }).err));
  t.lettere = { val: V.giorno(t) + 3 }; ok(V.fai(t, { a: 'contratto' })); assert(t.servizio && t.servizio.tipo === 'mer');
  // chi non è un signore (una carovana) dà ancora le notizie come prima
  const u = V.nuovo(13), car = u.p.find(p => p.k === 'car'); u.incontro = { tipo: 'parla', pid: [car.id], all: [] }; ok(V.scegli(u, 'notizie'));
}
// prestito non reso: alla scadenza, senza oro, il signore se ne ricorda; con l'oro la compagnia paga da sé
{
  const s = V.nuovo(14), sg = signore(s, 'val'); s.tregua = 1e9; s.dentro = -1; sg.mem.lib = 2; sg.mem.fav = 1; s.t = 5 * V.P.GIORNO; incontroCon(s, sg); ok(V.scegli(s, 'prestito')); s.incontro = null;
  V.TU(s).oro = 0; aspetta(s, S.SCAD + 1); assert.strictEqual(sg.mem.trad, 1, 'prestito non reso: tradimento'); assert(!s.debiti.length);
  const t = V.nuovo(14), sh = signore(t, 'val'); t.tregua = 1e9; t.dentro = -1; sh.mem.lib = 2; sh.mem.fav = 1; t.t = 5 * V.P.GIORNO; incontroCon(t, sh); ok(V.scegli(t, 'prestito')); t.incontro = null;
  V.TU(t).oro = 5000; V.TU(t).merci.grano = 400; aspetta(t, S.SCAD + 1); assert.strictEqual(sh.mem.trad, 0, 'con l\'oro paga da sé'); assert(!t.debiti.length);
}
// proposta: Diplomazia del capitano e Sostegno dei signori
{
  const s = V.nuovo(15); s.servizio = { faz: 'val', tipo: 'vas' }; s.dentro = capitale(s, 'val').id; s.fama = 100; s.rel.val = 30; s.guerra = {}; s.alleanza = {};
  const p0 = V.proposta(s, 'alleanza', 'val', 'sel'); assert(!p0.err, p0.err);
  assert(!p0.f.some(x => x.n === 'Sostegno dei signori' || x.n === 'Diplomazia del capitano'));
  const sig = s.sig.filter(x => x.faz === 'val'); assert(sig.length >= 3);
  sig[0].mem.lib = 4; sig[1].mem.lib = 4; s.rel.val = 30;
  const p1 = V.proposta(s, 'alleanza', 'val', 'sel'); assert.strictEqual(Math.round((p1.tot - p0.tot) * 10) / 10, 3, 'due signori a confidenza 3: +3,0');
  assert(p1.f.some(x => x.n === 'Sostegno dei signori' && x.v === 3));
  sig[2].mem.lib = 4; assert.strictEqual(V.proposta(s, 'alleanza', 'val', 'sel').tot, p1.tot, 'al più MAX_SOST signori');
  s.cap.ab.diplomazia = 5; const p2 = V.proposta(s, 'alleanza', 'val', 'sel'); assert.strictEqual(Math.round((p2.tot - p1.tot) * 10) / 10, 2, 'Diplomazia 5 = +2,0');
  assert(p2.f.some(x => x.n === 'Diplomazia del capitano' && x.v === 2));
}
// Fama di cavaliere: nei tornei +2 att e +4 pf per punto
{
  const s = V.nuovo(16), c = s.cap, a = V.statArena(c); c.ab.cavaliere = 3; const b = V.statArena(c);
  assert.strictEqual(b.att - a.att, 6); assert.strictEqual(b.pf - a.pf, 12); assert.strictEqual(V.statCap(c).att, V.statCap(Object.assign({}, c, { ab: Object.assign({}, c.ab, { cavaliere: 0 }) })).att, 'in battaglia campale non cambia nulla');
  c.punti = 1; ok(V.fai(s, { a: 'abilita', k: 'carisma' })); assert.strictEqual(c.ab.carisma, 1);
}
console.log('ven_personaggi ok');
