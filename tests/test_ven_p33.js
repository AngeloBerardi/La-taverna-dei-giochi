// Passo 33: la sorte ti getta nel mondo (28km). 50 semi: il luogo d'inizio rispetta i vincoli, nessun regno parte troppo spesso, lo spunto è raggiungibile.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mondo = (seme, opz, o) => V.nuovo(seme, Object.assign({ opz: Object.assign({ geo: 2, mondo: 'ampio' }, opz) }, o));

// interruttore spento (nessun geo): niente sorte, il mondo di prima
{ const s = V.nuovo(5, {}); assert.strictEqual(s.inizio, undefined); assert(!s.log.some(x => /La sorte/.test(x.tx)), 'a mondo vecchio nessuna apertura'); }

const partenze = {}, tipi = {}, SEMI = 50;
for (let seme = 1; seme <= SEMI; seme++) {
  const s = mondo(seme), I = s.inizio, tu = V.TU(s), M = V.mappaDi(s);
  assert(I, 'seme ' + seme + ': manca s.inizio');
  const l = s.l[I.lid];
  assert(l.tipo === 'villaggio' || l.tipo === 'locanda', seme + ': luogo ' + l.tipo);
  for (const c of s.l.filter(x => x.tipo === 'covo')) assert(dist(c, l) >= 8, seme + ': covo a ' + dist(c, l).toFixed(1) + ' celle');
  assert(s.l.some(x => x.tipo === 'citta' && dist(x, l) <= 20), seme + ': nessuna città entro 20 celle');
  assert(!Object.keys(s.guerra).some(k => k.split('|').includes(l.faz)), seme + ': il regno ' + l.faz + ' è in guerra al giorno 0');
  assert(dist(tu, l) < 6, seme + ': la compagnia non è presso il luogo');
  assert.strictEqual(I.cult, V.cult(s, l.faz));
  assert(tu.tr.every(e => D.TR[e.t].faz === I.cult), seme + ': truppe di un\'altra cultura');
  assert.strictEqual(tu.oro, 250); assert.strictEqual(V.uomini(tu), 7);
  // lo spunto: dentro 10 celle e raggiungibile; l'incarico esiste (tranne il torneo)
  const a = I.aggancio, meta = s.l[a.meta];
  assert(dist(meta, l) <= 10, seme + ': la meta è a ' + dist(meta, l).toFixed(1) + ' celle');
  assert(V.via(M, tu.x, tu.y, meta.x, meta.y).length > 0, seme + ': meta irraggiungibile');
  if (a.k === 'torneo') { assert.strictEqual(a.inc, null); assert.strictEqual(meta.tipo, 'citta'); assert.strictEqual((V.giorno(s) + 3 + meta.id) % 7, 0); }
  else {
    const q = s.incarichi.find(x => x.id === a.inc); assert(q && !q.fatto, seme + ': incarico mancante'); assert(q.scad > V.giorno(s)); assert.strictEqual(s.incarichi.length, 1);
    if (q.tipo === 'consegna') assert((tu.merci[q.bene] || 0) >= q.n, seme + ': merce non consegnata alla compagnia');
    if (q.tipo === 'predoni') assert(s.p.find(x => x.id === q.pid), seme + ': banda mancante');
  }
  // il testo: niente segnaposto, una volta sola nel diario, con luogo, regno e meta
  assert(!/[{}]/.test(I.testo) && I.testo.includes(l.nome) && I.testo.includes(meta.nome) && I.testo.includes(V.rg(s, l.faz).breve), seme + ': testo ' + I.testo);
  assert.strictEqual(s.log.filter(x => x.tx === I.testo).length, 1, seme + ': apertura non unica');
  assert(!s.log.some(x => /leva le tende/.test(x.tx) && !x.tx.includes(l.nome)), seme + ': il diario dice un altro luogo');
  assert.strictEqual(JSON.stringify(mondo(seme).inizio), JSON.stringify(I), seme + ': non ripetibile');
  partenze[l.faz] = (partenze[l.faz] || 0) + 1; tipi[a.k] = (tipi[a.k] || 0) + 1;
}
const max = Math.max(...Object.values(partenze));
console.log('regni di partenza: ' + Object.keys(partenze).length + ', al massimo ' + max + ' semi su ' + SEMI + '; spunti ' + JSON.stringify(tipi));
assert(max <= 15, 'un regno parte in ' + max + ' semi su ' + SEMI);
assert(Object.keys(tipi).length >= 4, 'pochi tipi di spunto: ' + Object.keys(tipi));

// dotazione per difficoltà
{
  const r = mondo(7, { diff: 'recluta' }), c = mondo(7), g = mondo(7, { diff: 'leggenda' });
  assert(V.TU(r).oro > V.TU(c).oro && V.TU(c).oro > V.TU(g).oro); assert(V.uomini(V.TU(r)) > V.uomini(V.TU(c)));
}

// truppe della cultura d'origine: ingaggio scontato del 10%
{
  const s = mondo(11), c = s.inizio.cult, tu = V.TU(s), mer = 'mer_f3', loc = s.l.find(l => V.MERCATO && V.OSTERIA && V.OSTERIA[l.tipo]);
  assert(loc, 'nessuna taverna'); tu.dentro = loc.id; s.dentro = loc.id; tu.x = loc.x; tu.y = loc.y;
  loc.merc = [{ t: mer, n: 3 }, { t: c + '_f3', n: 3 }]; const o0 = tu.oro = 1000;
  assert(V.fai(s, { a: 'assolda', t: mer, n: 1 }).s); assert.strictEqual(tu.oro, o0 - D.INGAGGIO[D.TR[mer].t]);
  const o1 = tu.oro; assert(V.fai(s, { a: 'assolda', t: c + '_f3', n: 2 }).s);
  assert.strictEqual(tu.oro, o1 - D.INGAGGIO[3] * 2 + Math.floor(D.INGAGGIO[3] * 2 * .1));
}
console.log('p33 ok');
