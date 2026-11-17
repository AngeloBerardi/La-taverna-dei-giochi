// Compagnia di ventura, regno (V4): fondazione, reazione dei confinanti, signori che passano a te, feudi, malcontento, esuli,
// caduta della corona, vittoria, salvataggi vecchi. (La prova lunga con il bot è test_ven_regno_bot.js.)
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const ok = x => { assert(!x.err, x.err); return x; };
const err = (x, tx) => { assert(x.err, 'doveva fallire: ' + tx); if (tx) assert(x.err.includes(tx), 'errore «' + x.err + '» senza «' + tx + '»'); };
const same = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
const chiave = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const capitale = (s, f) => s.l.find(l => l.tipo === 'citta' && l.faz === f);
// una fortezza tua, fama e monete a sufficienza, dentro le mura: il punto di partenza per fondare (sceglie il castello con più confinanti)
const fortezza = seme => {
  const s = V.nuovo(seme), tu = V.TU(s); let best = null, bn = -1;
  for (const c of s.l.filter(l => l.tipo === 'castello')) { const f = c.faz; c.faz = 'tu'; const n = V.confinanti(s).length; c.faz = f; if (n > bn) { bn = n; best = c; } }
  best.faz = 'tu'; best.sig = -2; for (const v of s.l) if (v.capo === best.id && !V.MURA[v.tipo]) { v.faz = 'tu'; v.sig = -2; }
  s.dentro = best.id; s.fama = 200; tu.oro = 6000; s.guerra = {}; s.alleanza = {};
  return { s, tu, c: best };
};
const fonda = (s, nome, st) => V.fai(s, { a: 'fonda', nome: nome == null ? 'Regno di Prova' : nome, stend: st == null ? 3 : st });
const regnato = seme => { const x = fortezza(seme); ok(fonda(x.s)); x.s.dentro = -1; x.s.davanti = -1; return x; };
// fa scorrere il mondo `giorni` giorni (fuori da ogni luogo), risolvendo gli incontri
const scorri = (s, giorni) => { const fine = s.t + giorni * 1440; let g = 0; while (s.t < fine && g++ < 100000) { if (s.incontro) { const i = s.incontro; if (i.tipo === 'parla') V.scegli(s, 'lascia'); else if (i.tipo === 'mischia') V.scegli(s, 'lascia'); else V.auto(s); continue; } if (s.dentro >= 0 || s.davanti >= 0) { s.dentro = -1; s.davanti = -1; } V.passo(s, 60); } };

// i numeri ci sono
{
  const R = D.REGNO;
  assert(R.FAMA === 150 && R.ORO === 5000 && R.CONFINE === 20 && R.AMICO === 20 && R.GUERRA_ENTRO === 10 && R.TENUTI === 3 && R.MALC_SU === 4 && R.MALC_GIU === 3 && R.ESILIO === 30 && R.ADUNATA === 3 && R.TRUPPE_COMP === 70);
  assert(R.STENDARDI.length === 8 && R.STENDARDI.every(x => x.nome && /^#/.test(x.col) && /^#/.test(x.col2)));
  const usate = new Set(D.REGNI.map(f => D.FAZ[f].col)); for (const x of R.STENDARDI) assert(!usate.has(x.col) || x.col2 !== D.FAZ.val.col2, 'stendardo uguale a un regno: ' + x.nome);
  same(Object.assign({}, ...D.TRATTI_ID.map(t => ({ [t]: D.TRATTI[t].passa }))), { prode: 0, avido: 2, crudele: 1, onorevole: -4, prudente: -1 });
  assert(D.DIPL.PESO.re === 1.2);
}

// fondare: le condizioni, uno per uno
{
  const { s, tu, c } = fortezza(3);
  s.fama = 149; err(fonda(s), 'Serve fama 150'); s.fama = 200;
  tu.oro = 4999; err(fonda(s), 'Servono 5000 monete'); tu.oro = 6000;
  err(fonda(s, ''), 'Dai un nome'); err(fonda(s, '   '), 'Dai un nome');
  err(fonda(s, 'X', 8), 'Stendardo'); err(fonda(s, 'X', -1), 'Stendardo');
  s.dentro = -1; s.davanti = c.id; err(fonda(s), 'dentro'); s.davanti = -1; s.dentro = c.id;
  c.faz = 'val'; c.sig = -1; err(fonda(s), 'una tua città o un tuo castello'); c.faz = 'tu'; c.sig = -2;
  const v = s.l.find(l => l.tipo === 'villaggio'); v.faz = 'tu'; v.sig = -2; s.dentro = v.id; err(fonda(s), 'città o un tuo castello'); s.dentro = c.id;
  s.servizio = { faz: 'val', tipo: 'mer', fino: 99 }; err(fonda(s), 'Prima sciogli il tuo legame'); s.servizio = null;
  assert(!s.corona && tu.oro === 6000 && s.fama === 200, 'gli errori non toccano lo stato');
  const nome = 'Il Grande Regno delle Nove Terre Unite';
  ok(fonda(s, '  ' + nome + '  ', 5));
  assert(s.corona.nome === nome.slice(0, 24) && s.corona.stend === 5 && s.corona.sede === c.id && s.corona.malc === 0 && s.corona.da === V.giorno(s), JSON.stringify(s.corona));
  assert(tu.oro === 1000, 'costa 5000 monete: ' + tu.oro);
  err(fonda(s), 'Hai già un regno');
  assert(s.ev.some(e => e.t === 'regno'));
  assert.strictEqual(V.nomeF(s, 'tu'), s.corona.nome); assert.strictEqual(V.nomeF(s, 'val'), 'Valdoro'); assert.strictEqual(V.nomeF(s, 'val', true), D.FAZ.val.nome);
  same(V.colFaz(s, 'tu'), { col: D.REGNO.STENDARDI[5].col, col2: D.REGNO.STENDARDI[5].col2 });
  same(V.colFaz(s, 'val'), { col: D.FAZ.val.col, col2: D.FAZ.val.col2 });
  same(V.fazioni(s), D.REGNI.concat(['tu']));
  const n = V.nuovo(3); same(V.fazioni(n), D.REGNI); assert.strictEqual(V.colFaz(n, 'tu').col, D.FAZ.tu.col);
  // la stessa partita due volte dà lo stesso regno
  const a = fortezza(3), b = fortezza(3); fonda(a.s); fonda(b.s); assert.strictEqual(JSON.stringify(a.s.corona), JSON.stringify(b.s.corona));
}

// i confinanti reagiscono: amici propongono pace, nemici guerra subito, gli altri entro 10 giorni (se non c'è un'alleanza)
{
  const { s } = fortezza(3), conf = V.confinanti(s); assert(conf.length >= 3, 'servono 3 confinanti: ' + conf);
  const [amico, nemico, ...altri] = conf; s.rel[amico] = 30; s.rel[nemico] = -30; for (const f of altri) s.rel[f] = 0;
  const lontano = D.REGNI.find(f => !conf.includes(f)); if (lontano) s.rel[lontano] = -40;
  ok(fonda(s)); const g = V.giorno(s);
  assert(!V.inGuerra(s, 'tu', amico) && s.rel[amico] === 35 && !(amico in s.corona.minacce), 'l\'amico propone pace');
  assert(s.log.some(l => l.tx.includes(V.nomeF(s, amico) + ' propone pace')));
  assert(V.inGuerra(s, 'tu', nemico) && !(nemico in s.corona.minacce), 'il nemico dichiara guerra subito');
  if (lontano) assert(V.inGuerra(s, 'tu', lontano), 'chi era già ostile non aspetta');
  for (const f of altri) { const m = s.corona.minacce[f]; assert(m >= g + 1 && m <= g + D.REGNO.GUERRA_ENTRO, 'minaccia di ' + f + ' al giorno ' + m); assert(!V.inGuerra(s, 'tu', f)); }
  // con la corona la guerra non dipende più dall'opinione
  s.rel[amico] = -80; assert(!V.nemiche(s, 'tu', amico) && !V.nemiche(s, amico, 'tu'));
  s.rel[amico] = 35; assert(V.nemiche(s, 'tu', nemico));
  // uno degli altri si allea con te prima della scadenza: niente guerra
  const alleato = altri[0]; if (alleato) { s.alleanza[chiave('tu', alleato)] = { da: g, rompe: 0 }; }
  scorri(s, D.REGNO.GUERRA_ENTRO + 1);
  for (const f of altri) { if (f === alleato) assert(!V.inGuerra(s, 'tu', f), 'alleato: niente guerra'); else assert(V.inGuerra(s, 'tu', f) || s.cadute[f], 'entro 10 giorni guerra con ' + f); }
  assert(Object.keys(s.corona.minacce).length === 0, 'le minacce scadono');
  assert(!V.inGuerra(s, 'tu', amico), 'con l\'amico resta la pace');
}

// il regno è un regno tra gli altri: aggredire gente di un regno è guerra, non si serve nessuno, i conti del re
{
  const { s } = regnato(11), f = V.confinanti(s)[0] || 'val';
  // aggredire un signore nell'incontro «parla»
  const sg = s.sig.find(x => x.faz === f && !x.re), p = s.p.find(x => x.id === sg.pid); s.guerra = {}; s.alleanza = { [chiave('tu', f)]: { da: 1, rompe: 0 } };
  s.incontro = { tipo: 'parla', pid: [p.id], all: [] }; ok(V.scegli(s, 'aggredisci'));
  assert(V.inGuerra(s, 'tu', f) && !s.alleanza[chiave('tu', f)], 'aggredire = guerra, e cade l\'alleanza');
  // giura e contratto
  s.dentro = capitale(s, 'sel').id; err(V.fai(s, { a: 'giura' }), 'Un sovrano non serve nessuno'); err(V.fai(s, { a: 'contratto' }), 'Un sovrano non serve nessuno');
  // dichiara e rompi
  s.guerra = {}; s.alleanza = {}; err(V.fai(s, { a: 'dichiara', f: 'xx' }), 'Regno sconosciuto');
  ok(V.fai(s, { a: 'dichiara', f: 'sel' })); assert(V.inGuerra(s, 'tu', 'sel')); err(V.fai(s, { a: 'dichiara', f: 'sel' }), 'già in guerra');
  s.alleanza[chiave('tu', 'mar')] = { da: V.giorno(s), rompe: 0 }; err(V.fai(s, { a: 'dichiara', f: 'mar' }), 'rompi prima');
  const g = V.giorno(s); ok(V.fai(s, { a: 'rompi', f: 'mar' })); assert.strictEqual(s.alleanza[chiave('tu', 'mar')].rompe, g + D.DIPL.MIN > g + D.DIPL.PREAVVISO ? g + D.DIPL.MIN : g + D.DIPL.PREAVVISO);
  err(V.fai(s, { a: 'rompi', f: 'mar' }), 'già annunciata'); err(V.fai(s, { a: 'rompi', f: 'alt' }), 'Non siete alleati');
  // senza regno non si può
  const n = V.nuovo(3); n.dentro = capitale(n, 'val').id; for (const a of ['dichiara', 'rompi', 'feudo', 'investi', 'aduna']) err(V.fai(n, { a, f: 'sel' }), 'Non hai un regno');
}

// il re con la corona: la proposta passa dal conto, con il peso del sovrano
{
  const { s } = regnato(3), X = capitale(s, 'val'); s.dentro = X.id; s.guerra = { [chiave('tu', 'val')]: true }; s.alleanza = {}; s.rel.val = 20; s.fama = 150;
  const p = V.proposta(s, 'pace', 'val', 'tu'); assert(!p.err, p.err); assert(p.f.length >= 4 && !p.f.some(x => x.n.startsWith('Opinione di')), JSON.stringify(p.f));
  const am = p.f.find(x => x.n === 'Amicizia col regno'); assert(am.v === Math.round(D.DIPL.PESO.re * 20 / D.DIPL.AMICIZIA * 10) / 10, 'peso del sovrano: ' + am.v);
  assert.strictEqual(p.ok, p.tot >= 0); err(V.proposta(s, 'guerra', 'val', 'tu')); err(V.proposta(s, 'rompi', 'val', 'tu'));
  s.rel.val = 90; s.fama = 300; const q = V.proposta(s, 'pace', 'val', 'tu'); assert(q.ok, 'con tanta amicizia il re accetta: ' + q.tot);
  ok(V.fai(s, { a: 'proponi', tipo: 'pace', f: 'xx' })); assert(!V.inGuerra(s, 'tu', 'val'), 'pace firmata (per il sovrano il regno è sempre il suo)');
  err(V.fai(s, { a: 'proponi', tipo: 'pace' }), 'ti riceverà di nuovo'); s.parola = {};
  err(V.fai(s, { a: 'proponi', tipo: 'pace' }), 'Non siete in guerra');
  s.fama = 400; s.rel.val = 90; const al = V.proposta(s, 'alleanza', 'val', 'tu'); if (al.ok) { ok(V.fai(s, { a: 'proponi', tipo: 'alleanza' })); assert(V.alleate(s, 'tu', 'val')); }
  // senza corona un capitano libero non ha voce
  const n = V.nuovo(3); n.dentro = capitale(n, 'val').id; err(V.proposta(n, 'pace', 'val', 'tu'), 'senza bandiera');
}

// tributo di pace con la corona: segue la guerra vera, non l'opinione
{
  const { s, tu } = regnato(3); const X = capitale(s, 'sel'); s.dentro = X.id; s.guerra = {}; err(V.fai(s, { a: 'pace' }), 'Non siete in guerra');
  s.guerra[chiave('tu', 'sel')] = true; s.rel.sel = 10; tu.oro = 5000; ok(V.fai(s, { a: 'pace' })); assert(!V.inGuerra(s, 'tu', 'sel') && tu.oro === 5000 - 400 && s.rel.sel === 10, 'tributo 400, opinione non peggiorata: ' + tu.oro + ' ' + s.rel.sel);
}

// signori che passano: il conto dei fattori, il passaggio, i luoghi lasciati, il feudo
{
  const { s, tu, c } = regnato(3); s.fama = 120; const f = V.confinanti(s)[0] || 'val';
  const sg = s.sig.find(x => x.faz === f && !x.re && x.tratto === 'avido') || s.sig.find(x => x.faz === f && !x.re), p = s.p.find(x => x.id === sg.pid), lid = c.id;
  // il feudo offerto è la sede: si può offrire solo un luogo tenuto, la sede non lo è? (lo è: sig<0) ma i signori vogliono altro
  const feudo = s.l.find(l => l.tipo === 'villaggio' && l.faz !== 'tu'); feudo.faz = 'tu'; feudo.sig = -2; feudo.capo = -1;
  err(V.lealta(s, sg.id, 999), 'tenuto'); err(V.lealta(s, s.sig.find(x => x.re).id, feudo.id), 'sovrano'); err(V.lealta(V.nuovo(3), sg.id, feudo.id), 'Non hai un regno');
  const L1 = V.lealta(s, sg.id, feudo.id); assert(!L1.err, L1.err); assert.strictEqual(L1.ok, L1.tot >= 0);
  const nom = L1.f.map(x => x.n); assert(nom.includes('Giuramento al suo signore') && nom.some(n => n.startsWith('Fama')) && nom.some(n => n.startsWith('Indole')), nom.join('|'));
  assert.strictEqual(L1.f.find(x => x.n === 'Giuramento al suo signore').v, D.REGNO.PASSA.BASE);
  assert.strictEqual(L1.tot, Math.round(L1.f.reduce((a, b) => a + b.v, 0) * 10) / 10);
  const dato = s.l.find(l => l.id === feudo.id), vecchi = s.l.filter(l => l.sig === sg.id).map(l => l.id);
  // più fedele è, meno passa: la lealtà cresce con l'amicizia personale, la fama, il feudo, l'esilio
  const base = V.lealta(s, sg.id, feudo.id).tot; sg.am = 20; assert(V.lealta(s, sg.id, feudo.id).tot > base, 'amicizia'); sg.am = 0;
  s.fama = 300; assert(V.lealta(s, sg.id, feudo.id).tot > base, 'fama'); s.fama = 120;
  err(V.lealta(s, sg.id, c.id), 'sede');
  // forza il conto a favore: esule avido con fama alta
  sg.tratto = 'avido'; s.fama = 300; sg.am = 12; const OK = V.lealta(s, sg.id, feudo.id); assert(OK.ok, 'conto: ' + OK.tot + ' ' + JSON.stringify(OK.f));
  s.incontro = { tipo: 'parla', pid: [p.id], all: [] };
  // un re non passa; un rifiuto dà il conto
  sg.am = -40; s.incontro = { tipo: 'parla', pid: [p.id], all: [] }; const no = V.scegli(s, 'passa:' + feudo.id); err(no, 'rifiuta'); assert(no.err.includes('serve 0'), no.err); assert(s.incontro, 'il rifiuto non chiude l\'incontro'); sg.am = 12;
  const relPrima = s.rel[f]; ok(V.scegli(s, 'passa:' + feudo.id));
  assert(sg.faz === 'tu' && p.faz === 'tu' && sg.cult === f && sg.casa === feudo.id && feudo.sig === sg.id && !s.incontro, 'passato: ' + sg.faz);
  assert(s.rel[f] === relPrima - 15, 'il suo regno ti prende male: ' + s.rel[f] + ' vs ' + relPrima);
  for (const id of vecchi) if (id !== feudo.id) assert(s.l[id].sig === -1, 'luogo lasciato senza signore: ' + s.l[id].nome);
  assert(!V.nemiche(s, p.faz, 'tu') && !V.nemiche(s, 'tu', p.faz), 'non è più tuo nemico');
  assert(V.rendite(s) >= 0);
  // in 30 giorni non finisce mai in uno scontro contro di te, e resta un tuo signore
  let ostile = 0; for (let g = 0; g < 30 * 24; g++) { if (s.incontro) { V.auto(s); continue; } V.passo(s, 60); for (const sc of s.scontri) { const a = sc.a.concat(sc.b); if (a.includes(p.id) && s.p.filter(x => a.includes(x.id) && x.faz === 'tu' && x.id !== p.id && x.id !== 0).length && V.ostile(s, p, V.part(s, a.find(i => i !== p.id)))) ostile++; } assert(!(s.incontro && s.incontro.pid && s.incontro.pid.includes(p.id) && s.incontro.tipo === 'nemico'), 'ti attacca'); if (s.dentro >= 0) s.dentro = -1; if (s.davanti >= 0) s.davanti = -1; }
  assert.strictEqual(ostile, 0); assert(sg.faz === 'tu', 'resta con te');
  // si schiera con te nell'assalto: signori tuoi a meno di 2 dal luogo
  const nem = s.l.find(l => l.tipo === 'castello' && l.faz !== 'tu'); p.x = nem.x + .5; p.y = nem.y + .5; p.dentro = -1; p.sc = 0; s.incontro = { tipo: 'assalto', lid: nem.id };
  assert(V.schieramenti(s).all.includes(p), 'il tuo signore partecipa all\'assalto'); p.x = nem.x + 5; assert(!V.schieramenti(s).all.includes(p), 'troppo lontano'); s.incontro = null;
}

// i feudi: tenuti rendono a te, dati rendono al signore; il malcontento sale oltre il tetto e scende sotto
{
  const { s, tu, c } = regnato(11); s.fama = 120; s.corona.sede = c.id;
  const val = s.sig.find(x => x.faz === 'val' && !x.re); // diventa tuo signore con un colpo di bacchetta
  const tre = s.l.filter(l => l.tipo === 'villaggio' && l.faz !== 'tu').slice(0, 5); for (const l of tre) { l.faz = 'tu'; l.sig = -2; l.capo = -1; l.prosp = 60; }
  const lord = s.sig.find(x => x.faz === 'val' && !x.re), pl = V.part(s, lord.pid); lord.faz = pl.faz = 'tu'; lord.cult = 'val';
  const r0 = V.rendite(s), v = tre[0]; assert(r0 > 0);
  ok(V.fai(s, { a: 'feudo', lid: v.id, sid: lord.id })); assert.strictEqual(v.sig, lord.id); assert.strictEqual(r0 - V.rendite(s), V.renditaL(v), 'cala esattamente di renditaL: ' + (r0 - V.rendite(s)) + ' vs ' + V.renditaL(v));
  const oro0 = pl.oro; s.dentro = -1; scorri(s, 1); assert(pl.oro >= oro0 + Math.round(V.renditaL(v) / 7) + 30 - 1, 'il signore incassa un settimo al giorno: ' + (pl.oro - oro0));
  err(V.fai(s, { a: 'feudo', lid: c.id, sid: lord.id }), 'sede'); err(V.fai(s, { a: 'feudo', lid: v.id, sid: lord.id }), 'già così'); err(V.fai(s, { a: 'feudo', lid: 0, sid: lord.id }), 'tuo');
  err(V.fai(s, { a: 'feudo', lid: tre[1].id, sid: 999 }), 'signore'); err(V.fai(s, { a: 'feudo', lid: tre[1].id, sid: s.sig.find(x => x.re).id }), 'tuo signore');
  // toglierlo: torna a te (sid -2) e il signore, senza altri feudi, va in esilio
  ok(V.fai(s, { a: 'feudo', lid: v.id, sid: -2 })); assert(v.sig === -2 && lord.faz === 'neu' && lord.esilio === V.giorno(s) + D.REGNO.ESILIO && lord.esule === 'val' && pl.faz === 'neu', 'esule: ' + lord.faz);
  // malcontento
  s.corona.malc = 0; const n = s.l.filter(l => l.faz === 'tu' && l.sig < 0).length; assert(n >= 5, 'tenuti: ' + n);
  s.dentro = -1; scorri(s, 1); const m1 = s.corona.malc; assert.strictEqual(m1, Math.min(100, (n - D.REGNO.TENUTI) * D.REGNO.MALC_SU), 'sale con ' + n + ' luoghi: ' + m1);
  { const pieno = s.l.filter(l => l.faz === 'tu' && l.sig < 0).reduce((a, l) => a + V.renditaL(l), 0); assert(m1 > 0 && V.rendite(s) < pieno && V.rendite(s) === Math.round(pieno * (1 - m1 / 200)), 'le rendite calano col malcontento: ' + V.rendite(s) + ' su ' + pieno); }
  for (const l of s.l) if (l.faz === 'tu' && l.id !== c.id) { l.faz = 'val'; l.sig = -1; } s.corona.malc = 10; // un solo luogo tenuto
  scorri(s, 1); assert.strictEqual(s.corona.malc, 10 - D.REGNO.MALC_GIU, 'scende di ' + D.REGNO.MALC_GIU); scorri(s, 4); assert.strictEqual(s.corona.malc, 0, 'non va sotto zero');
  // oltre 60 il morale ne risente
  s.corona.malc = 80; const mor0 = tu.mor = 80; scorri(s, 1); assert(tu.mor < mor0, 'morale: ' + tu.mor);
}

// compagni investiti: signori con truppe loro, tornano con te se cade la corona
{
  const { s, tu, c } = regnato(3); const co = D.COMPAGNI[0], lui = s.l.find(l => l.tipo === 'villaggio' && l.faz !== 'tu'); lui.faz = 'tu'; lui.sig = -2; lui.capo = -1;
  err(V.fai(s, { a: 'investi', t: co.id, lid: lui.id }), 'non è con te'); err(V.fai(s, { a: 'investi', t: 'val_f1', lid: lui.id }), 'Non è un compagno');
  tu.tr.push({ t: co.id, n: 1, f: 0, xp: 0 }); s.compagni[co.id] = -1;
  err(V.fai(s, { a: 'investi', t: co.id, lid: 0 }), 'tenuto'); err(V.fai(s, { a: 'investi', t: co.id, lid: c.id }), 'sede');
  const nSig = s.sig.length, nP = s.p.length; ok(V.fai(s, { a: 'investi', t: co.id, lid: lui.id }));
  assert(s.sig.length === nSig + 1 && s.p.length === nP + 1 && !tu.tr.some(e => e.t === co.id) && s.compagni[co.id] === -3);
  const sg = s.sig[nSig], p = V.part(s, sg.pid); assert(sg.faz === 'tu' && sg.comp === co.id && sg.casa === lui.id && lui.sig === sg.id && p.faz === 'tu' && p.dentro === lui.id && p.k === 'sig' && V.uomini(p) >= 3, 'investito: ' + V.uomini(p));
  assert(V.forza(p) >= D.REGNO.TRUPPE_COMP * .5, 'truppe a sufficienza: ' + V.forza(p)); assert(p.tr.every(e => e.t.startsWith(sg.cult)), 'truppe di cultura ' + sg.cult);
  assert(!V.nemiche(s, 'tu', p.faz)); err(V.fai(s, { a: 'investi', t: co.id, lid: lui.id }), 'non è con te');
  // un compagno investito che perde il feudo è esule, ma resta suo
  ok(V.fai(s, { a: 'feudo', lid: lui.id, sid: -2 })); assert(sg.faz === 'neu' && sg.comp === co.id);
  // esule da 30 giorni: se ne va, ma il compagno rientra nella compagnia
  s.dentro = -1; scorri(s, D.REGNO.ESILIO + 1); assert(!V.part(s, sg.pid) && tu.tr.some(e => e.t === co.id) && s.compagni[co.id] === -1 && sg.comp === null, 'il compagno rientra a fine esilio');
}

// adunata: i tuoi signori ti raggiungono per ADUNATA giorni
{
  const { s, tu, c } = regnato(3); const sgs = s.sig.filter(x => x.faz === 'val').slice(1, 3); for (const sg of sgs) { sg.faz = 'tu'; sg.cult = 'val'; V.part(s, sg.pid).faz = 'tu'; }
  tu.x = c.x + 1; tu.y = c.y + 1; const prima = sgs.map(sg => { const p = V.part(s, sg.pid); return Math.hypot(p.x - tu.x, p.y - tu.y); });
  ok(V.fai(s, { a: 'aduna' })); assert(sgs.every(sg => V.part(s, sg.pid).ia.st === 'adunata'));
  s.dentro = -1; scorri(s, 2); const dopo = sgs.map(sg => { const p = V.part(s, sg.pid); return Math.hypot(p.x - tu.x, p.y - tu.y); });
  assert(dopo.every((d, i) => d <= prima[i] + .1), 'si avvicinano: ' + prima.map(Math.round) + ' → ' + dopo.map(Math.round));
  scorri(s, D.REGNO.ADUNATA + 1); assert(sgs.every(sg => V.part(s, sg.pid).ia.st !== 'adunata'), 'l\'adunata finisce');
  const n = V.nuovo(3), n2 = regnato(11).s; for (const sg of n2.sig) { sg.faz = 'neu'; V.part(n2, sg.pid) && (V.part(n2, sg.pid).faz = 'neu'); } err(V.fai(n2, { a: 'aduna' }), 'Non hai signori'); assert(n);
}

// esuli: un regno che cade lascia i suoi signori (non il re) senza patria per 30 giorni; poi spariscono. Se cade il tuo, i tuoi signori fanno lo stesso
{
  const s = V.nuovo(3); s.guerra = {}; const sel = s.sig.filter(x => x.faz === 'sel'), re = sel.find(x => x.re), altri = sel.filter(x => !x.re), g0 = V.giorno(s);
  for (const l of s.l.filter(l => l.faz === 'sel' && V.MURA[l.tipo])) V.conquista(s, l, 'val', -1);
  assert(s.cadute.sel, 'caduto'); assert(re.pid === -1 && !V.part(s, re.pid), 'il re sparisce');
  for (const sg of altri) { const p = V.part(s, sg.pid); assert(p && sg.faz === 'neu' && p.faz === 'neu' && sg.cult === 'sel' && sg.esule === 'sel' && sg.esilio === g0 + D.REGNO.ESILIO && p.dentro === -1, 'esule ' + sg.nome + ' ' + sg.faz); }
  assert(!V.nemiche(s, 'neu', 'val') && !V.nemiche(s, 'neu', 'tu'), 'gli esuli non sono nemici di nessuno (salvo i predoni)');
  scorri(s, 10); for (const sg of altri) { const p = V.part(s, sg.pid); assert(!p || (p.faz === 'neu' && V.part(s, sg.pid)), 'ancora in giro dopo 10 giorni'); }
  scorri(s, 22); for (const sg of altri) assert(sg.pid === -1 && !V.part(s, sg.pid), 'spariti a 30 giorni: ' + sg.nome + ' ' + sg.pid);
  assert(s.p.filter(p => p.faz === 'neu').length === 0);
}

// la corona cade con l'ultima fortezza
{
  const { s, tu, c } = regnato(3); const co = D.COMPAGNI[1], lui = s.l.find(l => l.tipo === 'villaggio' && l.faz !== 'tu'); lui.faz = 'tu'; lui.sig = -2; lui.capo = -1;
  tu.tr.push({ t: co.id, n: 1, f: 0, xp: 0 }); s.compagni[co.id] = -1; ok(V.fai(s, { a: 'investi', t: co.id, lid: lui.id }));
  const lord = s.sig.find(x => x.faz === 'val' && !x.re), l2 = s.l.find(l => l.tipo === 'villaggio' && l.faz !== 'tu'); lord.faz = 'tu'; lord.cult = 'val'; V.part(s, lord.pid).faz = 'tu'; l2.faz = 'tu'; l2.sig = -2; l2.capo = -1; ok(V.fai(s, { a: 'feudo', lid: l2.id, sid: lord.id }));
  s.guerra[chiave('tu', 'sel')] = true; s.alleanza[chiave('tu', 'mar')] = { da: 1, rompe: 0 };
  V.conquista(s, c, 'val', -1);
  assert(s.corona === null || s.corona === undefined, 'la corona è caduta'); assert(!Object.keys(s.guerra).some(k => k.includes('tu')) && !Object.keys(s.alleanza).some(k => k.includes('tu')), 'guerre e alleanze con il tuo regno finiscono');
  assert(s.sig.filter(x => x.faz === 'tu').length === 0, 'nessun signore resta tuo');
  assert(s.sig.find(x => x.comp === null && x.nome === co.nome) && tu.tr.some(e => e.t === co.id) && s.compagni[co.id] === -1, 'il compagno investito torna nella compagnia');
  assert(lord.faz === 'neu' && lord.esule === 'val', 'il signore è esule'); assert(s.ev.some(e => e.t === 'corona-cade'));
  assert(V.nemiche(s, 'tu', 'val') === (s.rel.val <= -25), 'tornano i rapporti d\'opinione');
  // si può fondare di nuovo con un'altra fortezza
  const c2 = s.l.find(l => l.tipo === 'castello' && l.faz !== 'tu'); c2.faz = 'tu'; c2.sig = -2; s.dentro = c2.id; s.fama = 200; tu.oro = 6000; ok(fonda(s, 'Secondo Regno', 1)); assert.strictEqual(s.corona.nome, 'Secondo Regno');
}

// vittoria: tutte le capitali tue (con la corona), o del tuo re se sei vassallo; una volta sola, la partita continua
{
  const { s } = regnato(3); const cap = s.l.filter(l => l.tipo === 'citta'); assert.strictEqual(cap.length, 5);
  for (const l of cap.slice(0, 4)) { l.faz = 'tu'; l.sig = -2; } scorri(s, 3); assert(!s.vinta, 'quattro su cinque non bastano');
  cap[4].faz = 'tu'; cap[4].sig = -2; let ev = 0; const fine = s.t + 10 * 1440; while (s.t < fine) { if (s.incontro) { V.auto(s); continue; } for (const e of V.passo(s, 60)) if (e.t === 'vittoria') ev++; }
  assert.strictEqual(ev, 1, 'un solo evento di vittoria: ' + ev); assert(s.vinta && s.vinta.come === 're' && s.vinta.g >= 1); const g = s.vinta.g; scorri(s, 5); assert.strictEqual(s.vinta.g, g, 'scritta una volta sola');
  assert(s.t > 0 && !s.over, 'la partita continua: il tempo scorre ancora'); const t0 = s.t; V.passo(s, 120); assert(s.t > t0);
  assert(V.traguardi(s).find(x => x[0] === 'Un regno tuo')[1] && V.traguardi(s).find(x => x[0] === 'Tutte le capitali')[1]);
  const v = V.nuovo(3); assert(!V.traguardi(v).find(x => x[0] === 'Un regno tuo')[1] && !V.traguardi(v).find(x => x[0] === 'Tutte le capitali')[1]);
}
{
  const s = V.nuovo(11); s.servizio = { faz: 'mar', tipo: 'vas' }; const cap = s.l.filter(l => l.tipo === 'citta'); for (const l of cap) l.faz = 'mar'; let ev = 0;
  const fine = s.t + 10 * 1440; while (s.t < fine) { if (s.incontro) { V.auto(s); continue; } for (const e of V.passo(s, 60)) if (e.t === 'vittoria') ev++; }
  assert.strictEqual(ev, 1); assert(s.vinta && s.vinta.come === 'vassallo');
  const m = V.nuovo(11); m.servizio = { faz: 'mar', tipo: 'mer', fino: 99999 }; for (const l of m.l.filter(l => l.tipo === 'citta')) l.faz = 'mar'; scorri(m, 3); assert(!m.vinta, 'un mercenario non vince col suo re');
  const c = V.nuovo(11); for (const l of c.l.filter(l => l.tipo === 'citta')) l.faz = 'tu'; scorri(c, 3); assert(!c.vinta, 'senza la corona non si fonda un regno con le sole capitali');
}

// salvataggi vecchi (senza corona, cult, am): si aprono e si giocano 5 giorni; con il regno si salva e si riapre uguale
{
  const s = V.nuovo(29); delete s.corona; delete s.vinta; for (const sg of s.sig) { delete sg.cult; delete sg.am; delete sg.esule; delete sg.esilio; }
  const a = V.apri(JSON.stringify(s)); assert(a && !a.corona); scorri(a, 5); assert(a.t > 5 * 1440);
  const { s: r } = regnato(3); const b = V.apri(V.salva(r)); same(b.corona, r.corona); scorri(b, 3); assert(b.corona && b.corona.nome === 'Regno di Prova');
}

// il mondo con un regno è ripetibile: stesso seme, stesse mosse, stesso stato
{
  const gioca = () => { const { s } = regnato(3); scorri(s, 20); return V.salva(s); };
  assert.strictEqual(gioca(), gioca());
}
console.log('ven_regno ok');
