// Passo 27: l'unificazione dei regni (28ki), il re che vale quanto il suo regno (28kj) e le leve di difficoltà (28kh, 28ka).
// Qui le regole una per una su stati costruiti a mano; i 300 giorni col bot sono in test_ven_p27_lento.js.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const nuovoCtx = () => carica.multi(F, '({ VEN, VDAT })');
const { VEN: V, VDAT: D } = nuovoCtx();
const MURA = { citta: 1, castello: 1 };
const mondo = (seme, opz) => V.nuovo(seme, { opz: Object.assign({ geo: 2, mondo: 'ampio' }, opz) });
const chiave = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const GG = 1440, giornoA = (s, g) => { s.t = (g - 1) * GG; };
const vivi = s => V.regni(s).filter(id => !s.cadute[id]);

// invarianti dopo qualunque accorpamento: nulla resta attaccato a un regno morto, e le città non spariscono
function invarianti(s, dove, n0) {
  const morti = V.regni(s).filter(id => s.cadute[id]);
  for (const id of V.regni(s)) assert.strictEqual(s.rg[id].vivo, !s.cadute[id], 'vivo e cadute non coincidono per ' + id + ', ' + dove);
  for (const l of s.l) assert(!morti.includes(l.faz), l.nome + ' è ancora di un regno morto, ' + dove);
  for (const g of s.sig) { const p = s.p.find(x => x.id === g.pid); if (p) { assert(!morti.includes(g.faz), g.nome + ' serve un regno morto, ' + dove); assert.strictEqual(p.faz, g.faz, 'schiera e signore di bandiere diverse, ' + dove); } }
  for (const p of s.p) assert(!morti.includes(p.faz), 'compagnia di un regno morto, ' + dove);
  for (const k of Object.keys(s.guerra).concat(Object.keys(s.alleanza || {}))) for (const f of k.split('|')) assert(!morti.includes(f), 'guerra o alleanza con ' + f + ', ' + dove);
  for (const id of vivi(s)) assert(s.l.some(l => MURA[l.tipo] && l.faz === id), id + ' vivo senza fortezze, ' + dove);
  assert.strictEqual(s.l.filter(l => l.tipo === 'citta').length, n0, 'le città cambiano di numero, ' + dove);
  assert(s.l.filter(l => l.tipo === 'citta').every(l => l.faz === 'tu' || vivi(s).includes(l.faz)), 'una città senza regno vivo, ' + dove);
}
const svuota = (s, f) => { for (const l of s.l) if (l.faz === f) l.g = []; for (const p of s.p) if (p.faz === f) p.tr = []; };

// ---------- vassallaggio ----------
for (const seme of [3, 11, 58]) {
  const { V: v, D: d } = (() => { const c = nuovoCtx(); return { V: c.VEN, D: c.VDAT }; })();
  const s = v.nuovo(seme, { opz: { geo: 2, mondo: 'ampio' } }), n0 = s.l.filter(l => l.tipo === 'citta').length, dove = 'vassallaggio, seme ' + seme;
  const T = v.mappaRegni(s); let forte = null, debole = null;
  for (const [a, b] of T.confini) { const fa = v.forzaRegno(s, a), fb = v.forzaRegno(s, b); forte = fa >= fb ? a : b; debole = forte === a ? b : a;
    const vic = T.confini.filter(c => c.includes(debole)).map(c => c.find(x => x !== debole)); if (vic.every(x => v.forzaRegno(s, x) <= v.forzaRegno(s, forte))) break; }
  d.UNIF.VASSALLO.PROB = 100;
  // senza guerra lunga non succede nulla, anche con la forza giusta
  svuota(s, debole); delete s.guerra[chiave(debole, forte)];
  giornoA(s, 30); v.unifica(s);
  assert.strictEqual(Object.keys(s.cadute).length, 0, 'senza guerra nessun vassallaggio, ' + dove);
  // con la guerra da 20 giorni: il debole giura
  s.guerra[chiave(debole, forte)] = true; s.unif.v[chiave(debole, forte)] = { t: 'g', da: 8 };
  const sigDebole = s.sig.filter(g => g.faz === debole).map(g => g.id), lDebole = s.l.filter(l => l.faz === debole).map(l => l.id), citteForte = s.l.filter(l => l.tipo === 'citta' && l.faz === forte).length;
  const dopo = () => { giornoA(s, 40); v.unifica(s); };
  dopo();
  assert(s.cadute[debole] && s.rg[debole].vivo === false && s.rg[debole].fuso.come === 'vassallo' && s.rg[debole].fuso.a === forte, 'il debole non giura, ' + dove);
  assert(lDebole.every(id => s.l[id].faz === forte), 'luoghi non passati, ' + dove);
  assert(sigDebole.every(id => s.sig[id].faz === forte && !s.sig[id].re), 'signori non passati o ancora re, ' + dove);
  assert.strictEqual(s.sig.filter(g => g.faz === forte && g.re).length, 1, 'più di un re, ' + dove);
  assert(s.log.some(x => x.tx.includes('giura fedeltà')) && s.ev.some(e => e.t === 'unione' && e.da === debole), 'diario e eventi, ' + dove);
  assert.strictEqual(s.l.filter(l => l.tipo === 'citta' && l.faz === forte).length, citteForte + 1);
  invarianti(s, dove, n0);
  JSON.parse(v.salva(s));
}

// con la forza troppo vicina (soglia quasi nulla) il vassallaggio non scatta, nemmeno dopo una guerra lunga
{
  const c = nuovoCtx(), v = c.VEN, d = c.VDAT, s = v.nuovo(3, { opz: { geo: 2, mondo: 'ampio' } });
  d.UNIF.VASSALLO.PROB = 100; d.UNIF.VASSALLO.FORZA = .0001;
  const [a, b] = v.mappaRegni(s).confini[0];
  s.guerra[chiave(a, b)] = true; giornoA(s, 30); v.unifica(s); s.unif.v[chiave(a, b)].da = 0; giornoA(s, 40); v.unifica(s);
  assert.strictEqual(Object.keys(s.cadute).length, 0, 'forza vicina: nessun vassallaggio');
}

// ---------- il forte attacca il debole in pace, ma solo dopo i primi mesi ----------
{
  const c = nuovoCtx(), v = c.VEN, d = c.VDAT, s = v.nuovo(3, { opz: { geo: 2, mondo: 'ampio' } });
  d.UNIF.ATTACCO.PROB = 100; d.UNIF.VASSALLO.PROB = 0;
  const [a, b] = v.mappaRegni(s).confini[0]; svuota(s, a); s.guerra = {}; s.alleanza = {};
  giornoA(s, 50); v.unifica(s);
  assert.strictEqual(Object.keys(s.guerra).length, 0, 'prima del giorno 100 nessuno muove guerra');
  giornoA(s, 120); v.unifica(s);
  assert.strictEqual(Object.keys(s.guerra).length, 1, 'una sola guerra a settimana');
  assert(s.log.some(x => x.tx.includes('muove guerra')) && Object.keys(s.guerra)[0].split('|').includes(a), 'muove guerra al debole');
}

// ---------- matrimonio dinastico ----------
{
  const c = nuovoCtx(), v = c.VEN, d = c.VDAT, s = v.nuovo(5, { opz: { geo: 2, mondo: 'ampio' } }), n0 = s.l.filter(l => l.tipo === 'citta').length;
  d.UNIF.MATRIMONIO.PROB = 100; d.UNIF.VASSALLO.PROB = 0;   // qui conta solo il matrimonio
  const T = v.mappaRegni(s), [a, b] = T.confini[0];
  s.rg[b].cult = s.rg[a].cult; delete s.guerra[chiave(a, b)]; s.alleanza = s.alleanza || {}; s.alleanza[chiave(a, b)] = { da: 0, rompe: 0 };
  giornoA(s, 10); v.unifica(s);
  assert.strictEqual(Object.keys(s.cadute).length, 0, 'pace da meno di 60 giorni: niente matrimonio');
  s.unif.v[chiave(a, b)] = { t: 'p', da: 0 }; giornoA(s, 80); v.unifica(s);
  const caduti = Object.keys(s.cadute); assert.strictEqual(caduti.length, 1, 'un solo regno cade col matrimonio');
  assert.strictEqual(s.rg[caduti[0]].fuso.come, 'matrimonio'); assert(s.log.some(x => x.tx.includes('matrimonio dinastico')));
  invarianti(s, 'matrimonio', n0);
  // al massimo uno ogni 60 giorni: un secondo candidato subito dopo aspetta
  const T2 = v.mappaRegni(s); const liberi = T2.confini.filter(([x, y]) => !s.cadute[x] && !s.cadute[y]);
  if (liberi.length) { const [x, y] = liberi[0]; s.rg[y].cult = s.rg[x].cult; delete s.guerra[chiave(x, y)]; s.alleanza[chiave(x, y)] = { da: 0, rompe: 0 }; s.unif.v[chiave(x, y)] = { t: 'p', da: 0 };
    giornoA(s, 87); v.unifica(s); assert.strictEqual(Object.keys(s.cadute).length, 1, 'un solo matrimonio ogni 60 giorni');
    giornoA(s, 147); v.unifica(s); assert.strictEqual(Object.keys(s.cadute).length >= 1, true); }
}

// ---------- conquista: i signori passano o fuggono, poi qualcuno li recluta ----------
for (const passa of [1, 0]) {
  const c = nuovoCtx(), v = c.VEN, d = c.VDAT, s = v.nuovo(11, { opz: { geo: 2, mondo: 'ampio' } }), n0 = s.l.filter(l => l.tipo === 'citta').length, dove = 'conquista (passa ' + passa + ')';
  d.UNIF.PASSA = passa;
  const T = v.mappaRegni(s), [vinc, perde] = T.confini[0], suoi = s.sig.filter(g => g.faz === perde && !g.re).map(g => g.id);
  assert(suoi.length >= 1);
  for (const l of s.l.filter(l => l.faz === perde && MURA[l.tipo])) v.conquista(s, l, vinc, -1);
  assert(s.cadute[perde] && s.rg[perde].vivo === false && s.rg[perde].fuso.come === 'conquista', dove);
  for (const id of suoi) { const g = s.sig[id]; assert.strictEqual(g.faz, passa ? vinc : 'neu', dove + ': ' + g.nome); if (passa) assert(MURA[s.l[g.casa].tipo] && s.l[g.casa].faz === vinc, 'casa nel regno del vincitore'); }
  invarianti(s, dove, n0);
  if (!passa) {
    // gli esuli sono reclutati entro due settimane: nessuno resta senza regno oltre
    giornoA(s, v.giorno(s) + 1); const g0 = v.giorno(s);
    for (let g = g0; g <= g0 + 20; g += 7) { giornoA(s, g); v.unifica(s); }
    for (const id of suoi) { const g = s.sig[id]; assert(vivi(s).includes(g.faz), 'esule non reclutato: ' + g.nome + ' ' + g.faz); assert(MURA[s.l[g.casa].tipo] && s.l[g.casa].faz === g.faz); assert(!g.esule); }
    invarianti(s, dove + ' dopo il reclutamento', n0);
  }
}

// ---------- coalizione contro chi ha troppe città ----------
{
  const c = nuovoCtx(), v = c.VEN, d = c.VDAT, s = v.nuovo(7, { opz: { geo: 2, mondo: 'vasto' } });
  const prima = Object.keys(s.guerra).length;
  giornoA(s, 10); v.unifica(s);
  assert.strictEqual(Object.keys(s.guerra).length, prima, 'nessuno ha il 40%: nessuna coalizione');
  d.UNIF.DOMINIO = .05; d.UNIF.COALIZIONE = 1; giornoA(s, 20); v.unifica(s);
  const nuove = Object.keys(s.guerra).length - prima;
  assert(nuove > 0 && nuove <= 2 * v.regni(s).length, 'coalizione: ' + nuove + ' guerre nuove');
  assert(s.log.some(x => x.tx.includes('si schiera contro')));
}

// ---------- il re vale quanto il suo regno ----------
{
  const c = nuovoCtx(), v = c.VEN, s = v.nuovo(3, { opz: { geo: 2, mondo: 'ampio' } });
  const re = f => { const g = s.sig.find(x => x.faz === f && x.re); return v.rango(s, s.p.find(p => p.id === g.pid)).r; };
  const T = v.mappaRegni(s), a = T.confini[0][0], vicini = [];
  for (const [x, y] of T.confini) { if (x === a && !vicini.includes(y)) vicini.push(y); if (y === a && !vicini.includes(x)) vicini.push(x); }
  const catena = [a].concat(vicini).slice(0, 4); assert.strictEqual(catena.length, 4, 'servono tre vicini');
  assert.strictEqual(re(a), 2, 'una città: re di rango 2');
  const prendi = f => { for (const l of s.l.filter(l => l.faz === f && MURA[l.tipo])) v.conquista(s, l, a, -1); };
  prendi(catena[1]); assert.strictEqual(re(a), 3, 'due città: rango 3');
  prendi(catena[2]); assert.strictEqual(re(a), 3, 'tre città: rango 3');
  prendi(catena[3]); assert.strictEqual(re(a), 4, 'quattro città: rango 4');
  assert.strictEqual(s.l.filter(l => l.tipo === 'citta' && l.faz === a).length, 4);
  // un mondo vecchio: il re resta 4
  const w = v.nuovo(3), g = w.sig.find(x => x.re), r = v.rango(w, w.p.find(p => p.id === g.pid)).r;
  assert.strictEqual(r, 4, 'mondo vecchio: re di rango 4');
}

// ---------- vittoria dell'Unificatore ----------
{
  const c = nuovoCtx(), v = c.VEN, s = v.nuovo(3, { opz: { geo: 2, mondo: 'ampio' } });
  s.servizio = { faz: 'r0', tipo: 'vas' };
  assert(!s.vinta); for (const l of s.l.filter(l => l.tipo === 'citta' && l.faz !== 'r0')) l.faz = 'r0';
  v.vittoria(s); assert(s.vinta && s.vinta.come === 'vassallo' && s.vinta.unif === true, 'vittoria da vassallo');
  const w = v.nuovo(3), t = w; t.servizio = { faz: 'val', tipo: 'vas' }; for (const l of t.l.filter(l => l.tipo === 'citta')) l.faz = 'val'; v.vittoria(t);
  assert(t.vinta && t.vinta.unif === undefined, 'nei mondi vecchi nessun campo nuovo');
}

// ---------- tempo: un accorpamento non pesa sul giorno ----------
{
  const s = mondo(3), t0 = process.hrtime.bigint(); for (let i = 0; i < 20; i++) { giornoA(s, 10 + 7 * i); V.unifica(s); }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 20;
  assert(ms < 25, 'la settimana costa ' + ms.toFixed(1) + ' ms');
}

// ---------- leve di difficoltà ----------
{
  const s = V.nuovo(3), tu = V.TU(s), M = k => V.molt(s, k, { p: tu, lid: 0, m: 'grano', compra: true });
  for (const k of ['viveri', 'prezzo', 'paga', 'rendita', 'predoni']) assert.strictEqual(M(k), 1, k + ' senza opz vale 1');
  s.opz = {}; for (const k of ['viveri', 'prezzo', 'paga', 'rendita', 'predoni']) assert.strictEqual(M(k), 1, k + ' con opz vuota vale 1');
  s.opz = Object.assign({}, D.PRESET.condottiero); for (const k of ['viveri', 'prezzo', 'paga', 'rendita', 'predoni']) assert.strictEqual(M(k), 1, k + ' di base vale 1');
  for (const [nome, p] of Object.entries(D.PRESET)) { s.opz = Object.assign({}, p);
    assert.strictEqual(M('viveri'), D.DIFF.cons[p.cons].viveri, nome); assert.strictEqual(M('prezzo'), D.DIFF.eco[p.eco].prezzo, nome);
    assert.strictEqual(M('paga'), D.DIFF.eco[p.eco].paga, nome); assert.strictEqual(M('rendita'), D.DIFF.eco[p.eco].rendita, nome);
    assert.strictEqual(M('predoni'), D.DIFF.nem[String(p.nem)].predoni, nome); }
  // anche nei mondi nuovi, con le stagioni sotto
  const g = mondo(3, D.PRESET.leggenda), tg = V.TU(g); g.t = 0;
  assert(V.molt(g, 'viveri', { p: tg }) > 0 && V.molt(g, 'predoni', {}) === D.DIFF.nem['1'].predoni);
}
// a parità di seme e di condotta (la compagnia sta ferma e ogni incontro si scioglie): Leggenda dà più giorni di fame e meno monete di Condottiero, Recluta il contrario
{
  const prova = (preset, seme) => {
    const c = nuovoCtx(), v = c.VEN, d = c.VDAT; let fame = 0;
    v.aggancia('giorno', s => { if (s.log.some(x => x.t === s.t && x.tx.startsWith('La compagnia non ha da mangiare'))) fame++; });
    const s = v.nuovo(seme, preset ? { opz: Object.assign({}, d.PRESET[preset]) } : {}), tu = v.TU(s); let oro = null;
    tu.tr[0].n = 40; tu.merci = { grano: 100 };   // una compagnia numerosa e un granaio: la fame arriva a metà prova, e le paghe pesano
    while (v.giorno(s) < 29) { v.passo(s, 720); if (s.incontro) { s.incontro = null; s.davanti = -1; } if (s.rac && s.rac.scena) s.rac.scena = null; if (oro === null && v.giorno(s) >= 16) oro = tu.oro; }
    return { fame, oro };
  };
  const seme = 3, rec = prova('recluta', seme), con = prova('condottiero', seme), leg = prova('leggenda', seme), base = prova(null, seme);
  console.log('p27 difficoltà (giorni di fame, monete):', 'recluta', rec.fame, rec.oro, '| condottiero', con.fame, con.oro, '| leggenda', leg.fame, leg.oro, '| senza opz', base.fame, base.oro);
  assert.deepStrictEqual([base.fame, base.oro], [con.fame, con.oro], 'con opz assente tutto è come oggi (Condottiero)');
  assert(leg.fame > con.fame, 'Leggenda: più giorni di fame (' + leg.fame + ' contro ' + con.fame + ')');
  assert(leg.oro < con.oro, 'Leggenda: meno monete (' + leg.oro + ' contro ' + con.oro + ')');
  assert(rec.fame < con.fame && rec.oro > con.oro, 'Recluta: meno fame e più monete (' + rec.fame + ' ' + rec.oro + ' contro ' + con.fame + ' ' + con.oro + ')');
}
console.log('test_ven_p27 ok');
