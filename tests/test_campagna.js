// Campagna: mappa dal seme (raggiungibile, ripetibile), movimento, giorno/notte, perdizione, incontri; bot furbo vince, bot casuale perde.
const assert = require('assert');
global.EROI = require('../src/js/motori/27-eroi.js');
const C = require('../src/js/motori/28-campagna.js');
const carica = require('./carica.js');
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base) => EROI.nuovo({ nome, classe, razza, aspetto: A, base: { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8, ...base } });
const squadra = () => [mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }), mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }), mk('Tobia', 'mago', 'piccolo', { int: 15, sag: 13, des: 12 })];
const K = C.K;

// mappa: ripetibile, luoghi presenti e collegati da terreno passabile, per molti semi
for (let seed = 1; seed <= 60; seed++) {
  const a = C.genera(seed, 6), b = C.genera(seed, 6);
  assert.deepStrictEqual(a, b, 'stesso seme, stessa mappa');
  const poi = Object.values(a).filter(c => c.poi);
  for (const id of ['citta', 'antro', 'torre']) assert.strictEqual(poi.filter(c => c.poi === id).length, 1, id + ' manca o doppio, seme ' + seed);
  const catena = ['citta', 'antro', 'torre'].map(id => poi.find(c => c.poi === id));
  let da = { q: 0, r: 0 };
  for (const p of catena) { const pc = C.percorso(a, da, p, 99); assert(pc && pc.every(c => C.passabile(a[K(c.q, c.r)].t)), 'percorso passabile verso ' + p.poi + ' seme ' + seed); da = p; }
  assert(C.passabile(a['0,0'].t), 'la partenza è calpestabile');
}
assert.notDeepStrictEqual(C.genera(1, 6), C.genera(2, 6), 'semi diversi, mappe diverse');

// nuova: stato iniziale
assert.throws(() => C.nuova([], 1)); assert.throws(() => C.nuova([1, 2, 3, 4, 5].map(() => squadra()[0]), 1), /da 1 a 4/);
assert.strictEqual(C.nuova([1, 2, 3, 4].map(() => squadra()[0]), 1).eroi.length, 4, 'la compagnia arriva a 4 eroi');
const s0 = C.nuova(squadra(), 5);
assert.strictEqual(s0.eroi.length, 3); assert.strictEqual(s0.giorno, 1); assert.strictEqual(s0.fase, 'giorno'); assert(s0.pm > 0);
assert(C.celleVisibili(s0).length > 5 && C.celleVisibili(s0).length < 30, 'solo il vicinato è rivelato');
JSON.parse(JSON.stringify(s0)); // stato JSON puro
assert.strictEqual(C.act(s0, { t: 'muovi', q: 5, r: 5 }).err, 'Puoi muoverti solo su un esagono adiacente');
assert(C.act(s0, { t: 'boh' }).err); assert(C.act(s0, { t: 'entra' }).err, 'nulla da fare alla partenza');
assert(C.act(s0, { t: 'risolvi', eroe: 0, abilita: 'atletica' }).err, 'nessun incontro');
// l'input non viene modificato
const copia = JSON.stringify(s0); C.act(s0, { t: 'riposa' }); assert.strictEqual(JSON.stringify(s0), copia);

// acqua e montagne: non si passa; il costo del terreno scala il movimento
{
  const s = C.nuova(squadra(), 9); const n = C.vicini(0, 0)[0], k = K(n.q, n.r);
  s.celle[k].t = 'acqua'; assert(/non si passa/.test(C.act(s, { t: 'muovi', ...n }).err));
  s.celle[k].t = 'palude'; s.pm = 2; assert.strictEqual(C.act(s, { t: 'muovi', ...n }).err, 'Movimento insufficiente');
  s.celle[k].t = 'bosco'; s.celle[k].poi = null; const r = C.act(s, { t: 'muovi', ...n }, () => .99).s; assert.strictEqual(r.pm, s.pm - 2); assert.deepStrictEqual(r.party, n);
  assert(!r.incontro, 'rnd alto: nessun incontro');
}
// incontri: bloccano ogni altra azione, si risolvono con un'abilità ammessa
{
  const s = C.nuova(squadra(), 9); const n = C.vicini(0, 0)[0]; s.celle[K(n.q, n.r)] = { q: n.q, r: n.r, t: 'bosco', poi: null, visto: true };
  const m = C.act(s, { t: 'muovi', ...n }, () => 0).s; assert(m.incontro, 'rnd 0: incontro');
  assert.strictEqual(C.act(m, { t: 'riposa' }).err, 'Prima affronta l\'incontro');
  const ab = m.incontro.ab, non = Object.keys(EROI.ABILITA).find(x => !ab.includes(x));
  assert(C.act(m, { t: 'risolvi', eroe: 0, abilita: non }).err); assert(C.act(m, { t: 'risolvi', eroe: 9, abilita: ab[0] }).err);
  const ok = C.act(m, { t: 'risolvi', eroe: 0, abilita: ab[0] }, () => .99).s; assert(!ok.incontro); assert(ok.eroi[0].xp > 0); assert(ok.ultima.ok);
  const ko = C.act(m, { t: 'risolvi', eroe: 0, abilita: ab[0] }, () => 0).s; assert(!ko.incontro); assert(ko.eroi[0].hp < m.eroi[0].hp); assert.strictEqual(ko.perdizione, 1);
  const fu = C.act(m, { t: 'fuggi' }).s; assert(!fu.incontro);
}
// giorno e notte: due riposi = un giorno, +perdizione, cure; a 100 la campagna è persa
{
  let s = C.nuova(squadra(), 3); s.eroi[0].hp = 1;
  s = C.act(s, { t: 'riposa' }).s; assert.strictEqual(s.fase, 'notte');
  s = C.act(s, { t: 'riposa' }).s; assert.strictEqual(s.fase, 'giorno'); assert.strictEqual(s.giorno, 2); assert.strictEqual(s.perdizione, 3); assert(s.eroi[0].hp > 1);
  s.perdizione = 98; s = C.act(C.act(s, { t: 'riposa' }).s, { t: 'riposa' }).s; assert(s.over && !s.over.win && /perdizione/.test(s.over.reason));
  assert.strictEqual(C.act(s, { t: 'riposa' }).err, 'Campagna finita');
}
// tutti caduti: sconfitta
{
  let s = C.nuova([squadra()[0]], 3); s.eroi[0].hp = 1; const n = C.vicini(0, 0)[0]; s.celle[K(n.q, n.r)] = { q: n.q, r: n.r, t: 'bosco', poi: null, visto: true };
  s = C.act(s, { t: 'muovi', ...n }, () => 0).s; s = C.act(s, { t: 'risolvi', eroe: 0, abilita: s.incontro.ab[0] }, () => 0).s;
  assert(s.over && !s.over.win && /caduti/.test(s.over.reason));
}
// ordine della missione: l'antro non si apre prima della città
{
  const s = C.nuova(squadra(), 4); const antro = Object.values(s.celle).find(c => c.poi === 'antro'); s.party = { q: antro.q, r: antro.r };
  assert(/sindaco/.test(C.act(s, { t: 'entra' }).err));
}

// stato v2: il generatore dei dadi è nello stato, la partita è ripetibile senza un rnd esterno
{
  const s0 = C.nuova(squadra(), 11); assert.strictEqual(s0.v, 2); assert(Number.isInteger(s0.rng));
  const giro = () => { let s = C.nuova(squadra(), 11), log = []; for (let i = 0; i < 60 && !s.over; i++) { const v = C.vicini(s.party.q, s.party.r); let r = s.incontro ? C.act(s, { t: 'risolvi', eroe: 0, abilita: s.incontro.ab[0] }) : C.act(s, { t: 'muovi', ...v[i % 6] }); if (r.err) r = C.act(s, { t: s.incontro ? 'fuggi' : 'riposa' }); if (r.err) r = { s }; s = r.s; log.push(s.rng); } return { s, log }; };
  const a = giro(), b = giro(); assert.deepStrictEqual(a, b, 'stesso seme e stesse azioni: stessa partita'); assert(new Set(a.log).size > 5, 'il generatore avanza');
  JSON.parse(JSON.stringify(a.s));
}
// migrazione da uno stato v1 salvato (senza rng, con la vecchia torre e la prova a 10 abilità)
{
  const v2 = C.nuova(squadra(), 21), v1 = JSON.parse(JSON.stringify(v2)); delete v1.rng; v1.v = 1; v1.missione.titolo = 'La Torre oscura'; v1.turno = 4; v1.evn = 9;
  v1.incontro = { kind: 'antro', cd: 12, testo: 'Nell\'antro l\'aria è gelida.', ab: Object.keys(EROI.ABILITA), multi: { prove: 3, serve: 2, fatte: 1, riuscite: 1 } };
  const m = C.migra(v1); assert.strictEqual(m.v, 2); assert(Number.isInteger(m.rng)); assert.strictEqual(m.missione.titolo, 'La Torre dei Corvi');
  assert.deepStrictEqual(m.incontro.ab, C.FASI.antro[1].ab, 'la prova ricomincia dalla fase giusta'); assert.strictEqual(m.incontro.multi.fatte, 1);
  assert.deepStrictEqual(C.migra(m), m, 'uno stato v2 non cambia'); assert.strictEqual(v1.v, 1, 'l\'originale non viene toccato');
  const r = C.act(v1, { t: 'risolvi', eroe: 0, abilita: C.FASI.antro[1].ab[0] }); assert(r.s && r.s.v === 2, 'act accetta uno stato v1');
  assert(C.act(v1, { t: 'risolvi', eroe: 0, abilita: 'storia' }).err, 'l\'abilità della fase precedente non vale più');
}
// fuggire: sceglie l'eroe che copre la ritirata (di default il più in salute) e rifiuta un eroe a terra
{
  const base = C.nuova(squadra(), 8); base.incontro = { kind: 'bestie', cd: 11, testo: 'x', ab: ['atletica'] }; base.eroi[0].hp = 5; base.eroi[1].hp = base.eroi[1].hpMax; base.eroi[2].hp = 3;
  const sceglie = C.act(base, { t: 'fuggi', eroe: 2 }).s; assert.strictEqual(sceglie.eroi[2].hp, 2, 'ha ferito l\'eroe scelto'); assert.strictEqual(sceglie.eroi[0].hp, 5); assert(/Tobia copre la ritirata/.test(sceglie.log.slice(-2).join(' ')));
  const dflt = C.act(base, { t: 'fuggi' }).s; assert.strictEqual(dflt.eroi[1].hp, base.eroi[1].hpMax - 1, 'di default il più in salute');
  const giu = JSON.parse(JSON.stringify(base)); giu.eroi[2].hp = 0; assert.strictEqual(C.act(giu, { t: 'fuggi', eroe: 2 }).err, 'Scegli un eroe in piedi');
}
// prove di antro e torre: una fase alla volta, 3 abilità per fase, testi diversi
{
  assert.strictEqual(C.FASI.antro.length, 3); assert.strictEqual(C.FASI.torre.length, 4);
  for (const k of ['antro', 'torre']) for (const f of C.FASI[k]) { assert.strictEqual(f.ab.length, 3); assert.strictEqual(new Set(f.ab).size, 3); assert(f.ab.every(x => EROI.ABILITA[x]) && f.testo.length > 10); }
  for (const k of ['antro', 'torre']) assert.strictEqual(new Set(C.FASI[k].map(f => f.testo)).size, C.FASI[k].length, 'testi diversi');
  let s = C.nuova(squadra(), 4); s.missione.passo = 1; const antro = Object.values(s.celle).find(c => c.poi === 'antro'); s.party = { q: antro.q, r: antro.r };
  s = C.act(s, { t: 'entra' }).s; assert.deepStrictEqual(s.incontro.ab, C.FASI.antro[0].ab); assert.strictEqual(s.incontro.testo, C.FASI.antro[0].testo);
  const non = Object.keys(EROI.ABILITA).find(x => !s.incontro.ab.includes(x)); assert(C.act(s, { t: 'risolvi', eroe: 0, abilita: non }).err, 'solo le 3 abilità della fase');
  s = C.act(s, { t: 'risolvi', eroe: 0, abilita: s.incontro.ab[0] }, () => .99).s; assert.deepStrictEqual(s.incontro.ab, C.FASI.antro[1].ab, 'passa alla fase 2'); assert.strictEqual(s.incontro.multi.fatte, 1);
  assert(/Furtività|furtività|percezione|sopravvivenza|atletica|arcano|acrobazia/i.test(s.log.slice(-3).join(' ')));
  s = C.act(s, { t: 'risolvi', eroe: 0, abilita: s.incontro.ab[0] }, () => .99).s; s = C.act(s, { t: 'risolvi', eroe: 0, abilita: s.incontro.ab[0] }, () => .99).s;
  assert(!s.incontro && s.missione.passo === 2, 'antro ripulito');
  assert(/furtività|percezione|atletica|arcano/.test(s.log.join(' ')) && !/furtivita/.test(s.log.join(' ')), 'abilità con gli accenti nel registro');
}

// zaino, equipaggiamento e botteghe (A2): stato, migrazione, compra/vendi in città, equipaggia, cure, bottino
{
  const O = require('../src/js/motori/27b-avv-oggetti.js'), act = (s, a, r) => C.act(s, a, r);
  const s0 = C.nuova(squadra(), 21), s = JSON.parse(JSON.stringify(s0)), [kc] = Object.entries(s.celle).find(([, c]) => c.poi === 'citta');
  s.party = { q: +kc.split(',')[0], r: +kc.split(',')[1] }; // la compagnia è in città: le botteghe sono aperte
  assert(s.eroi.every(e => e.equip && Array.isArray(e.zaino) && Array.isArray(e.cintura)) && s.eroi[0].zaino.includes('pozione-cura') && s.eroi[0].equip.arma === 'spada-lunga' && s.negozi && !Object.keys(s.negozi).length);
  // un salvataggio già v2 ma senza zaino (prima di A2) si completa da solo, con l'equipaggiamento della classe
  const vecchio = JSON.parse(JSON.stringify(s)); for (const e of vecchio.eroi) { delete e.equip; delete e.zaino; delete e.cintura; } delete vecchio.negozi;
  const m = C.migra(vecchio); assert.strictEqual(m.eroi[1].equip.arma, 'pugnali'); assert.deepStrictEqual(m.eroi[1].zaino, []); assert.deepStrictEqual(m.negozi, {}); assert.deepStrictEqual(C.migra(m), m, 'migrare due volte non cambia nulla');
  assert(act(vecchio, { t: 'compra', eroe: 0, tipo: 'fabbro', id: 'cuoio' }).s, 'si può giocare anche con il vecchio salvataggio');
  // in città: compra, l'oro comune scende, l'oggetto va nello zaino dell'eroe scelto
  s.oro = 200; let r = act(s, { t: 'compra', eroe: 1, tipo: 'fabbro', id: 'spada-corta' }); assert(r.s, r.err); assert.strictEqual(r.s.oro, 185); assert(r.s.eroi[1].zaino.includes('spada-corta') && !r.s.eroi[0].zaino.includes('spada-corta'));
  assert.strictEqual(s.oro, 200, 'lo stato di partenza non cambia'); assert(r.s.log[r.s.log.length - 1].includes('compra Spada corta per 15'));
  // equipaggia: la spada corta (accurata) cambia i valori di Mira; il vecchio pugnale torna nello zaino
  let q = act(r.s, { t: 'equipa', eroe: 1, id: 'spada-corta' }).s; assert.strictEqual(q.eroi[1].equip.arma, 'spada-corta'); assert(q.eroi[1].zaino.includes('pugnali'));
  q = act(q, { t: 'compra', eroe: 0, tipo: 'emporio', id: 'anello-di-rame' }).s; q = act(q, { t: 'equipa', eroe: 0, id: 'anello-di-rame' }).s; assert.strictEqual(q.eroi[0].equip.acc1, 'anello-di-rame');
  q = act(q, { t: 'compra', eroe: 0, tipo: 'emporio', id: 'amuleto-di-quercia' }).s; const mx = q.eroi[0].hpMax; q = act(q, { t: 'equipa', eroe: 0, id: 'amuleto-di-quercia' }).s; assert.strictEqual(q.eroi[0].hpMax, mx + 3, 'l\'amuleto alza i PF massimi');
  assert.strictEqual(O.invValido(q.eroi[0]), null);
  const tv = act(q, { t: 'compra', eroe: 2, tipo: 'fabbro', id: 'scudo-torre' }).s, ts = act(tv, { t: 'equipa', eroe: 2, id: 'scudo-torre' });
  assert(ts.err && ts.err.includes('livello 2'), 'il livello conta (Tobia è di livello 1)');
  q = act(q, { t: 'togli', eroe: 1, slot: 'arma' }).s; assert.strictEqual(q.eroi[1].equip.arma, null); assert(act(q, { t: 'togli', eroe: 1, slot: 'arma' }).err);
  // cintura, passaggio tra eroi, cura fuori dalla battaglia
  q = act(q, { t: 'cintura', eroe: 0, id: 'pozione-cura' }).s; assert.deepStrictEqual(q.eroi[0].cintura, ['pozione-cura']); q = act(q, { t: 'zaino', eroe: 0, id: 'pozione-cura' }).s; assert.deepStrictEqual(q.eroi[0].cintura, []);
  q = act(q, { t: 'passa', eroe: 0, a: 2, id: 'pozione-cura' }).s; assert(q.eroi[2].zaino.includes('pozione-cura') && !q.eroi[0].zaino.includes('pozione-cura')); assert(act(q, { t: 'passa', eroe: 0, a: 0, id: 'razione' }).err); assert(act(q, { t: 'passa', eroe: 0, a: 1, id: 'pozione-cura' }).err);
  q.eroi[2].hp = 1; const u = act(q, { t: 'usa', eroe: 2, id: 'pozione-cura' }, () => 0.5).s; const nPoz = e => e.zaino.filter(x => x === 'pozione-cura').length; assert(u.eroi[2].hp > 1 && nPoz(u.eroi[2]) === nPoz(q.eroi[2]) - 1, 'cura e consuma una pozione'); const u2 = act(u, { t: 'usa', eroe: 2, id: 'pozione-cura' }, () => 0.5); assert(u2.s || u2.err, 'una seconda pozione si può bere finché servono PF');
  // vendi a metà prezzo; fuori città non si compra né si vende, ma ci si equipaggia
  const v = act(q, { t: 'vendi', eroe: 1, id: 'pugnali' }).s; assert.strictEqual(v.oro, q.oro + 5);
  const lontano = JSON.parse(JSON.stringify(q)); lontano.party = { q: 0, r: 0 }; // la partenza non è la città
  assert(act(lontano, { t: 'compra', eroe: 0, tipo: 'fabbro', id: 'cuoio' }).err.includes('bottega')); assert(act(lontano, { t: 'vendi', eroe: 1, id: 'pugnali' }).err.includes('bottega')); assert(act(lontano, { t: 'equipa', eroe: 1, id: 'pugnali' }).s);
  for (const a of [{ t: 'compra', tipo: 'fabbro', id: 'cuoio' }, { t: 'compra', eroe: 9, tipo: 'fabbro', id: 'cuoio' }, { t: 'equipa', eroe: -1, id: 'cuoio' }, { t: 'usa', eroe: 0, id: 'spada-lunga' }]) assert(act(q, a).err, JSON.stringify(a));
  // durante un incontro l'inventario è bloccato
  const inc = JSON.parse(JSON.stringify(q)); inc.incontro = { kind: 'bestie', cd: 10, testo: 'x', ab: ['atletica'] }; assert(act(inc, { t: 'usa', eroe: 2, id: 'pozione-cura' }).err.includes('incontro'));
  // il bonus dell'equipaggiamento arriva alle prove: fascia da cacciatore, +1 alla percezione
  const g = C.nuova(squadra(), 3); g.eroi[1].zaino.push('fascia-da-cacciatore'); const g2 = act(g, { t: 'equipa', eroe: 1, id: 'fascia-da-cacciatore' }).s; g2.incontro = { kind: 'bestie', cd: 15, testo: 'x', ab: ['percezione'] };
  assert.strictEqual(EROI.bonus(g2.eroi[1], 'percezione'), EROI.bonus(g.eroi[1], 'percezione') + 1);
  const rs = act(g2, { t: 'risolvi', eroe: 1, abilita: 'percezione' }, () => 0.5).s; assert.strictEqual(rs.ultima.tot, rs.ultima.tiro + EROI.bonus(g2.eroi[1], 'percezione'));
}
// forzieri: ogni forziere dà monete (e spesso oggetti) validi, ripetibile con lo stesso stato
{
  const O = require('../src/js/motori/27b-avv-oggetti.js'); let conOggetti = 0, N = 0;
  for (let seed = 1; seed <= 150; seed++) {
    const s = C.nuova(squadra(), seed), vic = C.vicini(0, 0).find(n => s.celle[K(n.q, n.r)] && C.passabile(s.celle[K(n.q, n.r)].t) && C.TERRENI[s.celle[K(n.q, n.r)].t].c <= s.pm);
    if (!vic) continue; const c = s.celle[K(vic.q, vic.r)]; c.poi = 'tesoro'; s.rng = seed * 7 + 1; N++;
    const r = C.act(s, { t: 'muovi', q: vic.q, r: vic.r }, () => 0.9); assert(r.s, r.err); // dadi alti: niente incontro, forziere con oggetti
    assert(r.s.oro > s.oro, 'monete dal forziere'); assert(r.s.log.some(l => l.startsWith('In un forziere: ')), 'registro: ' + r.s.log.slice(-2));
    const nuovi = r.s.eroi.flatMap((e, i) => e.zaino.filter(id => !s.eroi[i].zaino.includes(id) || e.zaino.filter(x => x === id).length > s.eroi[i].zaino.filter(x => x === id).length)); if (nuovi.length) conOggetti++;
    assert(r.s.eroi.every(e => e.zaino.every(id => O.OGG[id] && O.OGG[id].slot !== 'miss') && e.zaino.length <= O.MAX_ZAINO)); assert.strictEqual(r.s.celle[K(vic.q, vic.r)].poi, null, 'il forziere si apre una volta');
  }
  assert(N > 100 && conOggetti >= N * .9, 'quasi ogni forziere dà un oggetto: ' + conOggetti + '/' + N);
  // ricompensa dell'antro e della torre
  for (const [kind, frase] of [['antro', 'Nell\'antro trovate: '], ['torre', 'Tra le macerie della torre: ']]) {
    const s = C.nuova(squadra(), 9); s.missione.passo = kind === 'antro' ? 1 : 2; s.incontro = { kind, cd: 1, testo: '', ab: ['atletica', 'percezione', 'furtivita'], multi: { prove: 3, serve: 2, fatte: 2, riuscite: 2 } };
    const r = C.act(s, { t: 'risolvi', eroe: 0, abilita: 'atletica' }, () => 0.99); assert(r.s, r.err); assert(r.s.log.some(l => l.startsWith(frase)), kind); assert(r.s.oro > s.oro);
  }
}

// bot: furbo (segue il percorso, sceglie l'abilità migliore, cura in città) contro casuale
function bot(seed, furbo, oggetti) {
  const rng = carica.rng(seed * 7 + 1); let s = C.nuova(squadra(), seed), n = 0;
  const meta = () => { const p = s.missione.passi[s.missione.passo]; return Object.values(s.celle).find(c => c.poi === (p === 'citta' ? 'citta' : p)); };
  while (!s.over && n++ < 3000) {
    let r;
    if (s.incontro) {
      let best = null;
      if (furbo) { for (let i = 0; i < s.eroi.length; i++) if (s.eroi[i].hp > 0) for (const ab of s.incontro.ab) { const sc = EROI.mod(EROI.punteggi(s.eroi[i].base, s.eroi[i].razza)[EROI.ABILITA[ab]]) + (EROI.CLASSI[s.eroi[i].classe].abilita.includes(ab) ? 3 : 0); if (!best || sc > best.sc) best = { i, ab, sc }; } }
      else { const v = C.vivi(s); const e = s.eroi.indexOf(v[Math.floor(rng() * v.length)]); best = { i: e, ab: s.incontro.ab[Math.floor(rng() * s.incontro.ab.length)] }; }
      r = C.act(s, { t: 'risolvi', eroe: best.i, abilita: best.ab }, rng);
    } else if (furbo) {
      const m = meta(), c = s.party;
      if (oggetti) { // il bot che sa usare lo zaino: in città compra pozioni, per strada beve quando un eroe sta male
        const pozioni = e => e.zaino.filter(x => x === 'pozione-cura').length;
        for (let i = 0; i < s.eroi.length; i++) if (s.eroi[i].hp > 0 && s.eroi[i].hp <= s.eroi[i].hpMax * .5 && pozioni(s.eroi[i])) s = C.act(s, { t: 'usa', eroe: i, id: 'pozione-cura' }, rng).s || s;
        while (s.celle[C.K(c.q, c.r)].poi === 'citta' && s.oro >= 25) { const i = s.eroi.findIndex(e => e.zaino.length < 16); const r2 = C.act(s, { t: 'compra', eroe: i, tipo: 'emporio', id: 'pozione-cura' }, rng); if (r2.err) break; s = r2.s; }
      }
      const fiacco = C.vivi(s).some(e => e.hp < e.hpMax * .8) && s.missione.passo > 0 && s.perdizione < 60;
      if (c.q === m.q && c.r === m.r && fiacco) r = C.act(s, { t: 'riposa' }, rng);
      else if (c.q === m.q && c.r === m.r) { r = C.act(s, { t: 'entra' }, rng); if (r.err) r = C.act(s, { t: 'riposa' }, rng); }
      else { const pc = C.percorso(s.celle, c, m, 99), p = pc[0]; r = C.act(s, { t: 'muovi', q: p.q, r: p.r }, rng); if (r.err) r = C.act(s, { t: 'riposa' }, rng); }
    } else {
      const v = C.vicini(s.party.q, s.party.r); if (rng() < .15) r = C.act(s, { t: 'riposa' }, rng);
      else r = C.act(s, { t: rng() < .2 ? 'entra' : 'muovi', ...v[Math.floor(rng() * v.length)] }, rng);
      if (r.err) r = { s }; // mossa non valida: il bot casuale ci riprova
    }
    if (r.err) throw new Error('il bot furbo ha fatto una mossa non valida: ' + r.err);
    s = r.s;
  }
  return s;
}
// poteri nella campagna: scelte completate, cariche e Concentrazione per eroe, ricarica con i riposi (breve di notte, lungo all'alba)
{ const AP = require('../src/js/motori/27e-avv-poteri.js');
  const alto = EROI.guadagna(EROI.guadagna(mk('Veterano', 'guerriero', 'orco', { for: 15, cos: 14, des: 12 }), 700), 0); assert.strictEqual(alto.liv, 4);
  assert.strictEqual(AP.daScegliere(alto).length, 3, 'tre scelte in sospeso');
  const s0 = C.nuova([alto, mk('Mira', 'ladro', 'elfo', { des: 15 })], 3), v = s0.eroi[0];
  assert.strictEqual(AP.daScegliere(v).length, 0, 'la campagna completa le scelte mancanti'); assert(EROI.coerente({ ...alto, scelte: v.scelte }), 'e sono scelte valide');
  assert.strictEqual(s0.eroi[1].scelte && Object.keys(s0.eroi[1].scelte).length, 0, 'al livello 1 nessuna scelta');
  assert.strictEqual(v.conc, AP.combattente(v).concMax, 'la Concentrazione parte piena'); assert.deepStrictEqual(v.usi, {}, 'nessun potere usato');
  const mia = { ...alto, scelte: { 2: AP.offerta(alto, 2)[1] } }, s1 = C.nuova([mia], 3); assert.strictEqual(s1.eroi[0].scelte[2], mia.scelte[2], 'la scelta fatta dal giocatore resta');
  // consumo, poi riposo: breve ridà le cariche di scontro/breve, lungo tutto
  const e = s0.eroi[0], cb = AP.combattente(e), id = cb.poteri.find(k => AP.P[k] && AP.P[k].ric !== 'turno'); assert(id, 'almeno un potere a cariche');
  e.usi = { [id]: AP.usiMax(cb, AP.P[id]) }; e.conc = 0; JSON.parse(JSON.stringify(s0));
  let s = C.act(s0, { t: 'riposa' }).s; assert.strictEqual(s.fase, 'notte');
  const dopoNotte = s.eroi[0]; assert(dopoNotte.conc <= AP.combattente(dopoNotte).concMax);
  s = C.act(s, { t: 'riposa' }).s; assert.strictEqual(s.fase, 'giorno'); assert.deepStrictEqual(s.eroi[0].usi, {}, "all'alba le cariche sono tutte tornate"); assert.strictEqual(s.eroi[0].conc, AP.combattente(s.eroi[0]).concMax, "all'alba la Concentrazione è piena"); }
let vinte = 0, giorni = 0, senza = 0; const N = 40;
for (let i = 1; i <= N; i++) if ((bot(i, true, false).over || {}).win) senza++;
for (let i = 1; i <= N; i++) { const s = bot(i, true, true); assert(s.over, 'il bot furbo finisce, seme ' + i); if (s.over.win) { vinte++; giorni += s.over.giorni; } }
let casVinte = 0; for (let i = 1; i <= N; i++) if ((bot(i, false).over || {}).win) casVinte++;
const mot={};for(let i=1;i<=N;i++){const o=bot(i,true,true).over;if(!o.win)mot[o.reason]=(mot[o.reason]||0)+1}console.log(mot);
console.log('campagna: bot furbo senza zaino ' + senza + '/' + N + ', con zaino e pozioni ' + vinte + '/' + N + ' vittorie (media ' + (giorni / Math.max(1, vinte)).toFixed(1) + ' giorni), bot casuale ' + casVinte + '/' + N);
assert(vinte >= N * 0.7, 'il bot furbo deve vincere quasi sempre'); assert(senza >= N * 0.6, 'anche senza zaino se la cava'); assert(vinte > senza, 'comprare e usare le pozioni aiuta: ' + vinte + ' contro ' + senza); assert(casVinte <= N * 0.15, 'il bot casuale deve perdere quasi sempre');
console.log('campagna ok');
