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

// bot: furbo (segue il percorso, sceglie l'abilità migliore, cura in città) contro casuale
function bot(seed, furbo) {
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
let vinte = 0, giorni = 0; const N = 40;
for (let i = 1; i <= N; i++) { const s = bot(i, true); assert(s.over, 'il bot furbo finisce, seme ' + i); if (s.over.win) { vinte++; giorni += s.over.giorni; } }
let casVinte = 0; for (let i = 1; i <= N; i++) if ((bot(i, false).over || {}).win) casVinte++;
const mot={};for(let i=1;i<=N;i++){const o=bot(i,true).over;if(!o.win)mot[o.reason]=(mot[o.reason]||0)+1}console.log(mot);
console.log('campagna: bot furbo ' + vinte + '/' + N + ' vittorie (media ' + (giorni / Math.max(1, vinte)).toFixed(1) + ' giorni), bot casuale ' + casVinte + '/' + N);
assert(vinte >= N * 0.7, 'il bot furbo deve vincere quasi sempre'); assert(casVinte <= N * 0.15, 'il bot casuale deve perdere quasi sempre');
console.log('campagna ok');
