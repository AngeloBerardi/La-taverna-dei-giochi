// Mondo (A6.1): mappa grande dal seme, tre regioni, luoghi di ogni tipo sempre collegati, luoghi fissi del capitolo, percorsi e raggio di movimento.
const assert = require('assert');
const M = require('../src/js/motori/27m-avv-mondo.js');
const K = M.K;

// ripetibile e diversa da seme a seme
assert.deepStrictEqual(M.genera(7), M.genera(7), 'stesso seme, stessa mappa');
assert.notDeepStrictEqual(M.genera(7).celle, M.genera(8).celle, 'semi diversi, mappe diverse');
assert.strictEqual(Object.keys(M.genera(1).celle).length, 271, 'raggio 9 = 271 esagoni');

// 300 semi: luoghi presenti, distanze, regioni, terreno calpestabile, tutto collegato
const conteggi = {};
for (let seed = 1; seed <= 300; seed++) {
  const m = M.genera(seed), L = Object.values(m.luoghi), tipi = t => L.filter(l => l.tipo === t);
  assert(M.connessa(m), 'luoghi collegati, seme ' + seed);
  assert.strictEqual(tipi('citta').length, 1, 'una città, seme ' + seed);
  assert.strictEqual(tipi('antro').length, 1, 'un antro, seme ' + seed);
  assert.strictEqual(tipi('torre').length, 1, 'una torre, seme ' + seed);
  assert.strictEqual(tipi('villaggio').length, 3, 'tre villaggi (con la partenza), seme ' + seed);
  assert(tipi('santuario').length >= 2 && tipi('rovina').length >= 1 && tipi('campo').length >= 3 && tipi('tesoro').length >= 3, 'luoghi minori, seme ' + seed);
  const cel = new Set();
  for (const l of L) {
    const c = m.celle[K(l.q, l.r)];
    assert(M.passabile(c.t), l.tipo + ' su terreno calpestabile, seme ' + seed);
    assert.strictEqual(c.poi, l.tipo); assert.strictEqual(c.luogo, l.id); assert(!cel.has(K(l.q, l.r)), 'due luoghi nella stessa cella'); cel.add(K(l.q, l.r));
    assert(l.nome && typeof l.nome === 'string' && l.id, 'ogni luogo ha nome e id');
    conteggi[l.tipo] = (conteggi[l.tipo] || 0) + 1;
  }
  const par = tipi('villaggio').find(l => l.partenza); assert(par && par.q === 0 && par.r === 0, 'si parte dal villaggio al centro');
  const citta = tipi('citta')[0], d = M.dist(citta, par); assert(d >= 2 && d <= 3, 'città a 2–3 esagoni dalla partenza, seme ' + seed + ': ' + d);
  assert.strictEqual(citta.reg, 0, 'la città sta nella regione di partenza');
  assert.strictEqual(tipi('antro')[0].reg, 1); assert.strictEqual(tipi('torre')[0].reg, 2);
  assert(M.dist(tipi('torre')[0], par) >= 5 && M.dist(tipi('antro')[0], par) >= 4, 'antro e torre lontani dalla partenza, seme ' + seed);
  // tutte le tre regioni esistono e hanno celle
  for (let r = 0; r < 3; r++) assert(Object.values(m.celle).filter(c => c.reg === r && M.passabile(c.t)).length >= 15, 'regione ' + r + ' abitabile, seme ' + seed);
  // i mercanti stanno sulle strade
  assert(m.mercanti.length <= 2 && m.mercanti.every(x => m.celle[K(x.q, x.r)].t === 'strada' && !m.celle[K(x.q, x.r)].poi), 'mercanti sulle strade');
  // la partenza è visibile, il resto no
  assert(m.celle['0,0'].visto && !m.celle[K(8, 0)].visto);
}
assert(conteggi.tesoro >= 900 && conteggi.santuario >= 600, 'abbastanza luoghi minori in 300 mappe');

// regioni: nomi, terreno dominante, famiglia; il capitolo può cambiarli
const m0 = M.genera(3);
assert.deepStrictEqual(m0.regioni.map(r => r.nome), M.REGIONI.map(r => r.nome));
assert.deepStrictEqual(m0.regioni.map(r => r.fam), ['banditi', 'bestie', 'nonmorti']);
const m1 = M.genera(3, { regioni: [{ nome: 'La Piana', fam: 'bestie' }, {}, { terreno: 'collina' }] });
assert.strictEqual(m1.regioni[0].nome, 'La Piana'); assert.strictEqual(m1.regioni[1].nome, M.REGIONI[1].nome); assert.strictEqual(m1.regioni[2].terreno, 'collina');
// la regione palude ha più palude della regione pianura (in media)
let pal0 = 0, pal2 = 0; for (let seed = 1; seed <= 40; seed++) { const m = M.genera(seed); for (const c of Object.values(m.celle)) { if (c.t === 'palude' && c.reg === 0) pal0++; if (c.t === 'palude' && c.reg === 2) pal2++; } }
assert(pal2 > pal0, 'la regione delle brughiere ha più paludi: ' + pal2 + ' contro ' + pal0);

// luoghi scritti a mano: posizione data o solo la regione; rispetto dei vincoli; i generati non li duplicano
const fissi = M.genera(5, { luoghi: [{ tipo: 'citta', nome: 'Alta Rocca', q: 2, r: -1, id: 'alta-rocca' }, { tipo: 'santuario', nome: 'Altare dei Tre Corvi', reg: 2 }, { tipo: 'rovina', nome: 'Il Fortino', q: -3, r: 2 }] });
const ar = fissi.luoghi['alta-rocca']; assert(ar && ar.nome === 'Alta Rocca' && ar.q === 2 && ar.r === -1, 'luogo fisso con posizione');
assert.strictEqual(Object.values(fissi.luoghi).filter(l => l.tipo === 'citta').length, 1, 'la città fissa sostituisce quella generata');
const sant = Object.values(fissi.luoghi).find(l => l.nome === 'Altare dei Tre Corvi'); assert(sant && sant.reg === 2, 'luogo fisso con la sola regione');
assert(Object.values(fissi.luoghi).some(l => l.tipo === 'rovina' && l.q === -3 && l.r === 2 && l.nome === 'Il Fortino'));
assert(M.connessa(fissi), 'anche con i luoghi fissi tutto è collegato');
assert.throws(() => M.genera(5, { luoghi: [{ tipo: 'castello', nome: 'X' }] }), /sconosciuto/);
assert.throws(() => M.genera(5, { luoghi: [{ tipo: 'campo', q: 40, r: 40 }] }), /fuori dalla mappa/);
assert.throws(() => M.genera(5, { luoghi: [{ tipo: 'campo', q: 2, r: 2 }, { tipo: 'tesoro', q: 2, r: 2 }] }), /stessa cella/);

// percorso e raggiungibili
const m = M.genera(11), cit = Object.values(m.luoghi).find(l => l.tipo === 'citta');
const p = M.percorso(m.celle, { q: 0, r: 0 }, cit, null);
assert(p && p.length >= 2 && p[p.length - 1].q === cit.q && p.every(c => M.passabile(m.celle[K(c.q, c.r)].t)), 'percorso calpestabile fino alla città');
assert(Math.abs(p.costo - p.reduce((a, c) => a + M.TERRENI[m.celle[K(c.q, c.r)].t].c, 0)) < 1e-9, 'il costo è la somma dei terreni');
const D = M.raggiungibili(m.celle, { q: 0, r: 0 }, 3);
assert.strictEqual(D['0,0'], 0); assert(Object.values(D).every(c => c <= 3)); assert(Object.keys(D).every(k => M.passabile(m.celle[k].t)));
for (const [k, c] of Object.entries(D)) { const [q, r] = k.split(',').map(Number); assert(c >= M.dist({ q, r }, { q: 0, r: 0 }) * .5 - 1e-9, 'non si va più veloci di una strada'); }
const D0 = M.raggiungibili(m.celle, { q: 0, r: 0 }, 0); assert.deepStrictEqual(Object.keys(D0), ['0,0'], 'con 0 punti si resta fermi');
// celle vietate (mostri) non si attraversano
const vieta = new Set(Object.keys(D).filter(k => k !== '0,0')); assert.deepStrictEqual(Object.keys(M.raggiungibili(m.celle, { q: 0, r: 0 }, 9, { vieta })).filter(k => vieta.has(k)), [], 'le celle vietate non si raggiungono');
// rivela: raggio 2 = 19 celle
const t = M.genera(2); for (const c of Object.values(t.celle)) c.visto = false; M.rivela(t.celle, 3, -1, 2); assert.strictEqual(Object.values(t.celle).filter(c => c.visto).length, 19);
assert(M.vicino([{ q: 0, r: 0 }], { q: 2, r: 0 }, 3) && !M.vicino([{ q: 0, r: 0 }], { q: 4, r: 0 }, 3));
console.log('ok test_avv_mondo');
