// Passo 36: l'economia del mondo (28kb, solo mondi `s.geo===2`). Prove rapide; la partita lunga è in test_ven_p36_lento.js.
//  - i mondi vecchi tengono la formula di prima e non hanno `l.prod`;
//  - la curva dei prezzi (28 valori ≈ q^0,6) è crescente e il prezzo resta tra 0,4× e 3× la base;
//  - scorte intere e limitate, stesso risultato su due copie (ripetibile), salvataggio che si riapre;
//  - una razzia fa salire il grano della città vicina di almeno il 20% entro 7 giorni, e dopo 30 giorni di pace il prezzo è tornato entro il 10%;
//  - in autunno le scorte di grano dei villaggi sono più alte (la curva dei prezzi più bassa) che in inverno, in 6 semi su 6, senza il moltiplicatore di stagione dei prezzi;
//  - un esercito da 150 costa al giorno più di 3 volte uno da 50; `costoGiorno` coincide con i consumi veri di un giorno (cavalieri e fanti, in tutte le stagioni); la quota di bottino delle truppe scelte;
//  - assedio: la città non consuma più al ritmo normale (solo la guarnigione mangia) e senza cibo la guarnigione muore di fame; il mercato regionale scambia solo tra luoghi collegati da strada;
//  - la freccia della tendenza e il segnale «Incarico» (solo se paga almeno 1,3 volte la media di quelli che conosci).
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })');
const E = D.ECO, MERCI = Object.keys(D.MERCI);
const mondo = (seme, opz) => V.nuovo(seme, { opz: Object.assign({ geo: 2 }, opz) });
const copia = s => V.apri(V.salva(s));
const giorno = (s, g) => { s.t = (g - 1) * 1440 + 600; return s; };
const avanza = (s, da, a) => { for (let g = da; g <= a; g++) { giorno(s, g); s.tregua = 1e9; V.giornoNuovo(s); } };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ---- la curva ----
{
  assert.strictEqual(E.CURVA.length, 28); assert.strictEqual(E.CURVA[7], 1, 'q = 1: prezzo base');
  for (let i = 1; i < 28; i++) assert(E.CURVA[i] > E.CURVA[i - 1], 'crescente');
  for (let i = 0; i < 28; i++) assert(Math.abs(E.CURVA[i] - Math.pow((i + 3) / 10, .6)) < .001, 'vale q^0,6 a ' + (i + 3) / 10);
  const s = mondo(3), l = s.l.find(x => x.tipo === 'citta');
  for (const m of MERCI) for (const sc of [0, 1, 5, 20, 40, 80, 120]) { l.scorte[m] = sc; const k = V.curvaEco(s, l, m); assert(k >= E.MIN && k <= E.MAX, m + ' a ' + sc + ': ' + k); }
  l.scorte.grano = 40; assert.strictEqual(V.curvaEco(s, l, 'grano'), 1, 'con la scorta di riferimento il prezzo è quello base');
  l.scorte.grano = 0; assert(V.curvaEco(s, l, 'grano') > 1.9, 'senza scorta il pane è caro'); l.scorte.grano = 120; assert(V.curvaEco(s, l, 'grano') < .6, 'con tanta scorta costa poco');
}

// ---- mondi vecchi: la formula di prima, niente stato nuovo ----
{
  const s = V.nuovo(3), l = s.l.find(x => x.tipo === 'citta');
  assert.strictEqual(s.geo, undefined);
  for (const m of ['grano', 'ferro', 'spezie']) { const sc = l.scorte[m] || 0, k = Math.max(.45, Math.min(2.1, 1.9 - 1.2 * sc / 60)), c = V.abil(s, 'commercio');
    assert.strictEqual(V.prezzo(s, l, m, 1), Math.max(1, Math.round(D.MERCI[m].base * k * (1.12 - c * .02) * V.molt(s, 'prezzo', { lid: l.id, m, compra: true }))), 'prezzo di un mondo vecchio: ' + m); }
  avanza(s, 2, 10); assert(s.l.every(x => x.prod === undefined), 'nessun `l.prod` nei mondi vecchi');
  assert.strictEqual(V.tendenza(s, l.id, 'grano'), 0, 'senza memoria dei prezzi la freccia è piatta');
  const p = V.TU(s); p.tr = [{ t: Object.keys(D.TR).find(t => D.TR[t].c === 'f' && D.TR[t].t === 2), n: 150, f: 0, xp: 0 }];
  assert.strictEqual(V.paga(s), 150 * 3 * 2 + s.l.reduce((a, x) => a + (x.faz === 'tu' ? Math.ceil(V.forzaTr(x.g) * .12) : 0), 0), 'la paga dei mondi vecchi è lineare');
}

// ---- scorte: intere, limitate, ripetibili, salvabili ----
{
  const a = mondo(7), b = copia(a);
  for (const l of a.l) if (l.tipo === 'citta' || l.tipo === 'villaggio' || l.tipo === 'porto') assert(MERCI.every(m => Number.isInteger(l.scorte[m]) && l.scorte[m] >= 0 && l.scorte[m] <= E.TETTO), 'scorte iniziali di ' + l.nome);
  avanza(a, 2, 61); avanza(b, 2, 61);
  assert.strictEqual(JSON.stringify(a.l), JSON.stringify(b.l), 'due copie, stesso risultato');
  for (const l of a.l) if (l.prod) for (const m of MERCI) assert(Number.isInteger(l.scorte[m]) && l.scorte[m] >= 0 && l.scorte[m] <= E.TETTO, l.nome + ' ' + m + ' ' + l.scorte[m]);
  const c = copia(a); assert.strictEqual(JSON.stringify(c.l), JSON.stringify(a.l), 'il salvataggio riapre `l.prod`');
  assert(a.l.some(l => l.tipo === 'villaggio' && l.prod && l.prod.t && l.prod.t.length === 1), 'ogni villaggio ricorda cosa dà la terra');
  // il villaggio produce, la città consuma: il grano di un villaggio di pianura sta sopra quello di una città
  const med = tipo => { const v = a.l.filter(l => l.tipo === tipo); return v.reduce((x, l) => x + l.scorte.grano, 0) / v.length; };
  assert(med('villaggio') > med('citta'), 'villaggi ' + med('villaggio') + ' città ' + med('citta'));
}

// ---- razzia: il pane sale in tutta la regione, poi torna ----
{
  const s0 = mondo(3), tutte = s0.l.filter(l => l.tipo === 'citta');
  let v = null, c = null, dm = 1e9; for (const x of s0.l.filter(l => l.tipo === 'villaggio')) for (const y of tutte) if (dist(x, y) < dm) { dm = dist(x, y); v = x; c = y; }
  assert(dm <= E.RAGGIO_GUERRA, 'una città entro ' + E.RAGGIO_GUERRA + ' celle da un villaggio: ' + dm.toFixed(1));
  avanza(s0, 2, 10);
  const a = copia(s0), b = copia(s0); const P = s => s.l[v.id];
  P(a).faz = 'pre'; P(b).faz = 'pre';                       // il villaggio è di nessuno: si può razziare
  for (const s of [a, b]) { s.dentro = -1; s.davanti = v.id; s.incontro = null; const tu = V.TU(s); tu.x = v.x; tu.y = v.y; }
  const r = V.fai(a, { a: 'razzia' }); assert(!r.err, 'razzia: ' + r.err); a.davanti = -1; b.davanti = -1; b.t += 180;   // il tempo passato dalla razzia anche per l'altra copia
  assert.strictEqual(P(a).prod.fermo, V.giorno(a) + E.FERMO, 'il villaggio razziato smette di produrre per 14 giorni');
  const g0 = V.giorno(a), prezzo = (s, d) => V.prezzo(s, s.l[c.id], 'grano', 1);
  let su = 0, tabella = [];
  for (let d = 1; d <= 30; d++) { for (const s of [a, b]) { giorno(s, g0 + d); s.tregua = 1e9; V.giornoNuovo(s); }
    const pa = prezzo(a), pb = prezzo(b); if (d <= 7) su = Math.max(su, pa / pb); if (d === 1 || d === 7 || d === 14 || d === 21 || d === 30) tabella.push(d + 'g: ' + pa + ' contro ' + pb); }
  assert(su >= 1.2, 'dopo la razzia il grano della città vicina sale di almeno il 20% entro 7 giorni (massimo ' + su.toFixed(2) + ')');
  const fine = prezzo(a) / prezzo(b); assert(Math.abs(fine - 1) <= .1, 'dopo 30 giorni di pace il prezzo è tornato entro il 10% (' + fine.toFixed(3) + ')');
  console.log('razzia: grano a ' + c.nome + ' (' + dm.toFixed(1) + ' celle dal villaggio), ' + tabella.join(' · ') + ' · massimo ×' + su.toFixed(2));
  // la freccia: appena dopo la razzia il prezzo sta salendo
  const t = copia(s0); t.l[v.id].faz = 'pre'; t.dentro = -1; t.davanti = v.id; t.incontro = null; V.TU(t).x = v.x; V.TU(t).y = v.y; avanza(t, 11, 14);
  V.fai(t, { a: 'razzia' }); t.davanti = -1; avanza(t, 15, 21); assert.strictEqual(V.tendenza(t, c.id, 'grano'), 1, 'una settimana dopo la razzia il prezzo del grano è in salita');
  avanza(t, 22, 40); assert(V.tendenza(t, c.id, 'grano') <= 0, 'finito il rialzo di guerra il prezzo non sale più');
}

// ---- stagioni: i villaggi producono di più in autunno che in inverno ----
// Si confrontano le scorte e la curva dei prezzi (`curvaEco`), che non contiene il moltiplicatore di stagione dei prezzi (grano ×0,7 in autunno, ×1,4 in inverno, passo 17):
// prova quindi la produzione stagionale del passo 36 (`E.STAG`), non quel moltiplicatore.
{
  for (const seme of [3, 5, 11, 29, 58, 77]) {
    const s = mondo(seme), vil = s.l.filter(l => l.tipo === 'villaggio'), media = () => vil.reduce((a, l) => a + V.curvaEco(s, l, 'grano'), 0) / vil.length, scorta = () => vil.reduce((a, l) => a + l.scorte.grano, 0) / vil.length;
    avanza(s, 2, 84); const aut = media(), sa = scorta(); avanza(s, 85, 112); const inv = media(), si = scorta();
    assert(sa > si && aut < inv, 'seme ' + seme + ': a fine autunno scorte ' + sa.toFixed(1) + ' e curva ' + aut.toFixed(3) + ', a fine inverno scorte ' + si.toFixed(1) + ' e curva ' + inv.toFixed(3));
  }
}

// ---- costo dell'esercito ----
{
  const s = mondo(3), tu = V.TU(s), t2 = Object.keys(D.TR).find(t => D.TR[t].c === 'f' && D.TR[t].t === 2), cav = Object.keys(D.TR).find(t => D.TR[t].c === 'c' && !D.TR[t].compagno);
  s.dentro = -1; for (const l of s.l) if (l.faz === 'tu') l.faz = 'neu';
  const costo = n => { tu.tr = [{ t: t2, n, f: 0, xp: 0 }]; const c = V.costoGiorno(s); return { c, tot: c.paghe + (c.viveri + c.foraggio) * D.MERCI.grano.base }; };
  const c50 = costo(50), c150 = costo(150);
  assert(c150.tot > 3 * c50.tot, 'un esercito di 150 costa più di 3 volte uno da 50: ' + c150.tot + ' contro ' + c50.tot);
  assert(c150.c.paghe > 3 * c50.c.paghe, 'le paghe crescono più che in proporzione');
  assert.strictEqual(V.paga(s), Math.round(150 * D.TR[t2].paga * 2 * (1 + .02 * 110)), 'paga per truppa × (1 + 0,02 × uomini oltre i 40)');
  tu.tr = [{ t: t2, n: 40, f: 0, xp: 0 }]; assert.strictEqual(V.paga(s), 40 * D.TR[t2].paga * 2, 'fino a 40 uomini nessun aumento');
  // i cavalieri consumano il doppio di un fante: una razione l'uomo (viveri) e una il cavallo (foraggio, a parte)
  tu.tr = [{ t: cav, n: 60, f: 0, xp: 0 }]; const cc = V.costoGiorno(s); assert(cc.foraggio > 0 && cc.viveri > 0, 'cavalieri: viveri e foraggio ' + JSON.stringify(cc));
  tu.tr = [{ t: t2, n: 60, f: 0, xp: 0 }]; const cf = V.costoGiorno(s); assert.strictEqual(cf.foraggio, 0, 'a piedi niente foraggio');
  assert.strictEqual(cc.viveri, cf.viveri, 'l\'uomo a cavallo mangia come un fante'); assert.strictEqual(cc.foraggio, 2 * Math.round(60 * D.STAG.FORAGGIO_QUOTA / 6 * D.STAG.EFF.prim.foraggio), 'il foraggio è il doppio di quello di 28kh (primavera)');
  { const vecchio = V.nuovo(3), tv = V.TU(vecchio); vecchio.dentro = -1; tv.tr = [{ t: cav, n: 60, f: 0, xp: 0 }]; assert.strictEqual(V.costoGiorno(vecchio).viveri, Math.ceil(60 / 6 * V.molt(vecchio, 'viveri', { p: tv })), 'mondi vecchi: nessun raddoppio'); }
  // la scheda delle reclute: paga e viveri con n uomini in più, su una copia (la partita non si tocca); il rincaro oltre i 40 uomini e `molt('paga')` ci sono
  { tu.tr = [{ t: t2, n: 100, f: 0, xp: 0 }]; const vil = s.l.find(x => x.tipo === 'villaggio'), p0 = V.paga(s), g0 = V.giorniViveri(s), r = V.conReclute(s, vil.id, 6);
    assert.strictEqual(V.uomini(tu), 100, 'la compagnia resta com\'è'); assert(r.paga > p0 + 2 * 6 && r.giorni <= g0, 'paga ' + p0 + ' -> ' + r.paga + ', viveri ' + g0 + ' -> ' + r.giorni);
    const ava2 = mondo(3, { eco: 'avara' }); V.TU(ava2).tr = [{ t: t2, n: 100, f: 0, xp: 0 }]; for (const l of ava2.l) if (l.faz === 'tu') l.faz = 'neu';
    const m = D.DIFF.eco.avara.paga, tr = 100 * D.TR[t2].paga * 2;
    assert.strictEqual(V.paga(ava2), Math.round(tr * m) + Math.round(tr * .02 * 60 * m), 'il rincaro passa da `molt(\'paga\')`'); }
  // `costoGiorno` coincide con ciò che si consuma davvero in un giorno (viveri e foraggio tolti dalla scorta), in tutte le stagioni
  const mangia = (s0, t, n) => { const x = copia(s0), p = V.TU(x); x.dentro = -1; x.davanti = -1; x.prigioniero = null; p.tr = [{ t, n, f: 0, xp: 0 }]; p.merci = { grano: 500 }; p.mor = 100; x.tregua = 1e9;
    const c = V.costoGiorno(x); giorno(x, V.giorno(x) + 1); V.giornoNuovo(x); return { vero: 500 - (p.merci.grano || 0), conto: c.viveri + c.foraggio }; };
  for (const g of [10, 40, 70, 100]) { const x = mondo(3); giorno(x, g);
    for (const [t, n] of [[cav, 60], [t2, 60], [cav, 7]]) { const r = mangia(x, t, n); assert(Math.abs(r.vero - r.conto) <= 1, 'giorno ' + g + ', ' + t + ' x' + n + ': consumo vero ' + r.vero + ' contro costoGiorno ' + r.conto); } }

  // le leve: avara paga di più, generosa di meno
  const gen = mondo(3, { eco: 'generosa' }), ava = mondo(3, { eco: 'avara' });
  for (const x of [gen, ava]) { V.TU(x).tr = [{ t: t2, n: 60, f: 0, xp: 0 }]; for (const l of x.l) if (l.faz === 'tu') l.faz = 'neu'; }
  assert(V.paga(gen) < V.paga(ava), 'paghe: generosa ' + V.paga(gen) + ' avara ' + V.paga(ava));
  const l = s.l.find(x => x.tipo === 'citta'); l.scorte.grano = 30;
  assert(V.prezzo(gen, gen.l[l.id], 'grano', 1) <= V.prezzo(ava, ava.l[l.id], 'grano', 1), 'prezzi: generosa non più cari di avara');
  // quota di bottino delle truppe di grado alto
  const t4 = Object.keys(D.TR).find(t => D.TR[t].t === 4 && !D.TR[t].compagno);
  tu.tr = [{ t: t2, n: 40, f: 0, xp: 0 }]; const o1 = { oro: 1000 }; V.ganci('premio', s, {}, o1); assert.strictEqual(o1.oro, 1000, 'senza truppe di grado alto niente quota');
  tu.tr = [{ t: t2, n: 40, f: 0, xp: 0 }, { t: t4, n: 30, f: 0, xp: 0 }]; assert(Math.abs(V.quotaBottino(s) - 30 * E.BOTTINO[4]) < 1e-9);
  const o2 = { oro: 1000 }; V.ganci('premio', s, {}, o2); assert.strictEqual(o2.oro, 1000 - Math.floor(1000 * 30 * E.BOTTINO[4]), 'la quota si toglie dal bottino');
  tu.tr = [{ t: t4, n: 500, f: 0, xp: 0 }]; assert.strictEqual(V.quotaBottino(s), E.BOTTINO_MAX, 'la quota ha un tetto');
  const comp = Object.keys(D.TR).find(t => D.TR[t].compagno); tu.tr = [{ t: comp, n: 1, f: 0, xp: 0 }]; assert(V.quotaBottino(s) <= E.BOTTINO_COMP * (E.BOTTINO[D.TR[comp].t] || 0) + 1e-9, 'i compagni chiedono meno');
}

// ---- assedio: la fame ----
{
  const s = mondo(3), c = s.l.find(l => l.tipo === 'citta' && V.uomini({ tr: l.g }) > 20);
  s.assedio = { lid: c.id, pronto: s.t + 99999, da: s.t, ariete: false }; for (const m of ['grano', 'carne', 'pesce']) c.scorte[m] = 0;
  const n0 = V.uomini({ tr: c.g }); avanza(s, 2, 6);
  assert(V.uomini({ tr: c.g }) < n0, 'la guarnigione perde uomini senza cibo: ' + n0 + ' → ' + V.uomini({ tr: c.g }));
  assert(s.log.some(x => /La fame stringe/.test(x.tx)), 'lo racconta');
  assert.strictEqual(c.scorte.grano, 0, 'sotto assedio non si produce');
  const d = mondo(3), e = d.l.find(l => l.tipo === 'citta' && V.uomini({ tr: l.g }) > 20); d.assedio = { lid: e.id, pronto: d.t + 99999, da: d.t, ariete: false }; for (const m of ['grano', 'carne', 'pesce']) e.scorte[m] = 30;
  const m0 = V.uomini({ tr: e.g }); avanza(d, 2, 6); assert.strictEqual(V.uomini({ tr: e.g }), m0, 'con le scorte nessuno muore'); assert(['grano', 'carne', 'pesce'].reduce((a, m) => a + e.scorte[m], 0) < 90, 'ma la guarnigione le mangia');
  // il consumo non conta due volte: sotto assedio le scorte calano solo di ciò che mangia la guarnigione (una razione ogni sei uomini al giorno), le altre merci non si muovono
  { const f = mondo(3), h = f.l.find(l => l.tipo === 'citta' && V.uomini({ tr: l.g }) > 20), CIBI = ['grano', 'carne', 'pesce'], altre = Object.keys(D.MERCI).filter(m => !D.MERCI[m].cibo);
    f.assedio = { lid: h.id, pronto: f.t + 99999, da: f.t, ariete: false }; for (const m of Object.keys(D.MERCI)) h.scorte[m] = 60;
    const razione = Math.ceil(V.uomini({ tr: h.g }) / 6), somma = () => CIBI.reduce((a, m) => a + h.scorte[m], 0), prima = somma(), a0 = altre.map(m => h.scorte[m]); avanza(f, 2, 6);
    assert.strictEqual(prima - somma(), 5 * razione, 'sotto assedio i cibi calano di 5 giorni di razioni della guarnigione (' + razione + ' al giorno), non di più: ' + (prima - somma()));
    assert.deepStrictEqual(altre.map(m => h.scorte[m]), a0, 'le altre merci sotto assedio non si muovono'); }
  // il mercato regionale scambia solo tra luoghi collegati da una strada: senza strade (M.S azzerata per la prova) le scorte restano più distanti
  { const M = V.mappaDi(mondo(3)), S0 = M.S;
    const corsa = () => { const w = mondo(3); for (const l of w.l) if (V.MERCATO[l.tipo]) l.scorte.grano = l.id % 2 ? 100 : 0; avanza(w, 2, 11); const q = w.l.filter(l => V.MERCATO[l.tipo]), m = q.reduce((a, l) => a + l.scorte.grano, 0) / q.length; return q.reduce((a, l) => a + (l.scorte.grano - m) * (l.scorte.grano - m), 0); };
    const conStrade = corsa(); M.S = new Uint8Array(S0.length); let senza; try { senza = corsa(); } finally { M.S = S0; }
    assert(conStrade < senza, 'con le strade le scorte si pareggiano di più (' + conStrade.toFixed(0) + ' contro ' + senza.toFixed(0) + ' senza)'); }
}

// ---- i segnali: «Incarico» solo se vale la pena ----
{
  const s = mondo(3), l = s.l.find(x => x.tipo === 'citta'); l.inc = { tipo: 'predoni', premio: 200, giorni: 5 }; s.incarichi = [];
  assert(V.segnali(s, l.id).some(x => x.k === 'incarico'), 'senza incarichi conosciuti si segnala');
  s.incarichi = [{ premio: 200 }, { premio: 100 }]; l.inc.premio = 150; assert(!V.segnali(s, l.id).some(x => x.k === 'incarico'), 'sotto 1,3 volte la media (195) non è una novità');
  l.inc.premio = 195; assert(V.segnali(s, l.id).some(x => x.k === 'incarico'), 'da 1,3 volte la media in su sì');
  l.inc.premio = 150; s.incarichi = [{ premio: 100 }]; assert(V.segnali(s, l.id).some(x => x.k === 'incarico'), '150 su una media di 100: sì');
}
console.log('test_ven_p36 ok');
