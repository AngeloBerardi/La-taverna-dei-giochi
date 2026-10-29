// Griglia della battaglia: coordinate, linee, vista e coperture (simmetriche), aree, spinte e percorsi con costi.
const assert = require('assert');
global.EROI = require('../src/js/motori/27-eroi.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const CAMP = require('../src/js/motori/28-campagna.js');
const rng = require('./carica.js').rng(2024);
const D = G.DIREZIONI, K = G.K;
const ri = (n) => Math.floor(rng() * n);
const somma = (c, d, k = 1) => ({ q: c.q + D[d][0] * k, r: c.r + D[d][1] * k });
const igual = (a, b) => a.q === b.q && a.r === b.r;

// arena: dimensioni, conversioni colonna/riga ↔ assiali, bordo
{ const A = G.vuota(9, 11);
  assert.strictEqual(G.celle(A).length, 99); assert(G.celle(A).every(c => G.dentro(A, c)));
  for (const c of G.celle(A)) { const o = G.aOffset(c.q, c.r); assert.deepStrictEqual(G.daOffset(o.col, o.riga), c); }
  assert(!G.dentro(A, { q: -1, r: 0 }) && !G.dentro(A, { q: 9, r: 0 }) && !G.dentro(A, { q: 0, r: -1 }) && !G.dentro(A, { q: 0, r: 11 }));
  assert(G.dentro(A, G.daOffset(0, 10)) && G.dentro(A, G.daOffset(8, 10)) && !G.dentro(A, G.daOffset(9, 10)) && !G.dentro(A, G.daOffset(-1, 3)));
  assert.throws(() => G.arena([]), /vuota/); assert.throws(() => G.arena(['...', '..']), /lunghezza/); assert.throws(() => G.arena(['.x.']), /sconosciuta/);
  assert.throws(() => G.arena(['...'], ['..']), /colonne/); assert.throws(() => G.arena(['...'], ['.x.']), /superficie/);
  const B = G.arena(['.,^', '#To'], ['f.w', '.vg']);
  assert.deepStrictEqual([0, 1, 2].map(c => G.tipo(B, G.daOffset(c, 0)).id), ['pavimento', 'difficile', 'rialzo']);
  assert.deepStrictEqual([0, 1, 2].map(c => G.tipo(B, G.daOffset(c, 1)).id), ['muro', 'alto', 'basso']);
  assert.deepStrictEqual([0, 1, 2].map(c => G.sup(B, G.daOffset(c, 0))), ['fuoco', null, 'acqua']); assert.deepStrictEqual([0, 1, 2].map(c => G.sup(B, G.daOffset(c, 1))), [null, 'veleno', 'ghiaccio']);
  assert.strictEqual(G.alt(B, G.daOffset(2, 0)), 1); assert.strictEqual(G.alt(B, G.daOffset(0, 0)), 0); assert.strictEqual(G.tipo(B, { q: 50, r: 50 }), null);
  assert(G.passabile(B, G.daOffset(2, 0)) && !G.passabile(B, G.daOffset(0, 1)) && !G.passabile(B, G.daOffset(2, 1)) && !G.passabile(B, { q: 9, r: 9 }));
  JSON.parse(JSON.stringify(B)); }

// distanze: come la campagna, simmetriche; anelli e cerchi con i conteggi giusti
for (let i = 0; i < 1000; i++) { const a = { q: ri(41) - 20, r: ri(41) - 20 }, b = { q: ri(41) - 20, r: ri(41) - 20 };
  assert.strictEqual(G.dist(a, b), CAMP.dist(a, b)); assert.strictEqual(G.dist(a, b), G.dist(b, a)); }
for (let n = 1; n <= 6; n++) { const an = G.anello({ q: 3, r: -2 }, n); assert.strictEqual(an.length, 6 * n); assert(an.every(c => G.dist(c, { q: 3, r: -2 }) === n)); assert.strictEqual(new Set(an.map(c => K(c.q, c.r))).size, 6 * n);
  assert.strictEqual(G.entro({ q: 0, r: 0 }, n).length, 3 * n * (n + 1) + 1); }
assert.strictEqual(G.vicini({ q: 0, r: 0 }).length, 6);

// tracciato: parte e arriva dove deve, passo per passo (celle vicine), lungo quanto la distanza
for (let i = 0; i < 1000; i++) { const a = { q: ri(15), r: ri(15) }, b = { q: ri(15), r: ri(15) };
  for (const seg of [1, -1]) { const L = G.tracciato(a, b, seg); assert.strictEqual(L.length, G.dist(a, b) + 1); assert(igual(L[0], a) && igual(L[L.length - 1], b));
    for (let j = 1; j < L.length; j++) assert.strictEqual(G.dist(L[j - 1], L[j]), 1, 'celle consecutive vicine'); } }

// vista e coperture su una riga (r = 1: q = colonna, nessun dubbio di spigolo)
{ const riga = (m) => { const t = '.'.repeat(7).split(''); for (const [c, ch] of Object.entries(m)) t[c] = ch; return G.arena(['.......', t.join(''), '.......']); };
  const a = { q: 0, r: 1 }, b = { q: 6, r: 1 };
  assert.deepStrictEqual(G.vista(riga({}), a, b), { visibile: true, cop: 'nessuna', ca: 0, dislivello: 0 });
  assert.deepStrictEqual(G.vista(riga({ 3: 'o' }), a, b), { visibile: true, cop: 'mezza', ca: 2, dislivello: 0 }, 'un ostacolo basso: mezza copertura');
  assert.deepStrictEqual(G.vista(riga({ 3: 'o', 4: 'o' }), a, b), { visibile: true, cop: 'tre-quarti', ca: 5, dislivello: 0 }, 'due ostacoli bassi: tre quarti');
  assert.strictEqual(G.vista(riga({ 2: 'o', 3: 'o', 4: 'o' }), a, b).ca, 5, 'tre ostacoli bassi non danno di più dei tre quarti');
  for (const ch of ['#', 'T']) assert.deepStrictEqual(G.vista(riga({ 3: ch }), a, b), { visibile: false, cop: 'totale', ca: null, dislivello: 0 }, 'muro e ostacolo alto bloccano');
  assert.strictEqual(G.vista(riga({ 3: 'o', 4: 'T' }), a, b).visibile, false, 'un muro vince su un ostacolo basso');
  assert.deepStrictEqual(G.vista(riga({ 0: 'T', 6: 'T' }), a, b), { visibile: true, cop: 'nessuna', ca: 0, dislivello: 0 }, 'gli estremi non contano');
  assert.strictEqual(G.vista(riga({ 3: '#' }), { q: 1, r: 1 }, { q: 2, r: 1 }).visibile, true, 'a contatto si vede sempre');
  assert.strictEqual(G.vista(riga({}), a, a).visibile, false, 'non si guarda la propria cella');
  const alta = G.arena(['.......', '^......', '.......']);
  assert.strictEqual(G.vista(alta, { q: 0, r: 1 }, { q: 5, r: 1 }).dislivello, 1, 'dall\'alto verso il basso'); assert.strictEqual(G.vista(alta, { q: 5, r: 1 }, { q: 0, r: 1 }).dislivello, -1);
  const fuori = G.arena(['.......', '.......', '.......']); assert.strictEqual(G.vista(fuori, { q: 0, r: 1 }, { q: 8, r: 1 }).visibile, false, 'oltre il bordo la linea si perde'); }

// vista: simmetrica su arene casuali; con gli spigoli vince il tracciato più favorevole
{ let spigoli = 0, visti = 0, coperti = 0;
  for (let n = 0; n < 40; n++) { const righe = Array.from({ length: 11 }, () => Array.from({ length: 9 }, () => { const x = rng(); return x < .08 ? '#' : x < .14 ? 'T' : x < .27 ? 'o' : '.'; }).join('')), A = G.arena(righe), L = G.celle(A);
    for (let i = 0; i < 80; i++) { const a = L[ri(L.length)], b = L[ri(L.length)]; if (igual(a, b)) continue;
      const v = G.vista(A, a, b), w = G.vista(A, b, a); assert.strictEqual(v.visibile, w.visibile, 'visibile simmetrico'); assert.strictEqual(v.cop, w.cop, 'copertura simmetrica'); assert.strictEqual(v.ca, w.ca); assert.strictEqual(v.dislivello + w.dislivello, 0);
      const conta = (seg) => { let bassi = 0; for (const c of G.tracciato(a, b, seg).slice(1, -1)) { const t = G.tipo(A, c); if (!t || !t.vista) return null; if (t.cop) bassi++; } return bassi; };
      const p = conta(1), m = conta(-1), ok = [p, m].filter(x => x !== null);
      assert.strictEqual(v.visibile, ok.length > 0); if (ok.length) assert.strictEqual(v.ca, [0, 2, 5][Math.min(2, Math.min(...ok))], 'il tracciato migliore');
      if (p !== m) spigoli++; if (v.visibile) visti++; if (v.ca) coperti++; } }
  assert(spigoli > 50 && visti > 300 && coperti > 100, `prova sensata: ${spigoli} spigoli, ${visti} viste, ${coperti} coperture`); }

// aree su un'arena grande: conteggi, tagli dei muri, bordi
{ const A = G.vuota(21, 21), c = G.daOffset(10, 10);
  assert.deepStrictEqual([1, 2, 3].map(r => G.cerchio(A, c, r).length), [7, 19, 37], 'cerchio con il centro'); assert.deepStrictEqual([1, 2, 3].map(r => G.aura(A, c, r).length), [6, 18, 36], 'aura senza il centro');
  assert.deepStrictEqual([1, 2, 3, 4].map(r => G.cono(A, c, 0, r).length), [2, 5, 9, 14], 'cono: k+1 celle a distanza k');
  for (let d = 0; d < 6; d++) { assert.strictEqual(G.cono(A, c, d, 4).length, 14); assert(G.cono(A, c, d, 4).every(x => G.dist(x, c) >= 1 && G.dist(x, c) <= 4));
    const l = G.lineaDa(A, c, d, 5); assert.strictEqual(l.length, 5); l.forEach((x, k) => assert.deepStrictEqual(x, somma(c, d, k + 1))); }
  for (let k = 1; k <= 5; k++) { const tutte = new Set(); let tot = 0; for (let d = 0; d < 6; d++) for (const x of G.cono(A, c, d, k).filter(y => G.dist(y, c) === k)) { tutte.add(K(x.q, x.r)); tot++; }
    assert.strictEqual(tutte.size, 6 * k, 'i sei coni coprono tutto l\'anello'); assert.strictEqual(tot, 6 * k + 6, 'e gli assi stanno in due coni'); }
  // un muro davanti a chi origina l'area: niente dietro
  const con = (ch) => G.arena(G.vuota(21, 21).righe.map((x, r) => { if (r !== c.r) return x; const cc = G.aOffset(c.q + 1, c.r).col; return x.slice(0, cc) + ch + x.slice(cc + 1); }));
  const w = con('#');
  const e1 = somma(c, 0, 1), e2 = somma(c, 0, 2), n1 = somma(c, 1, 1);
  assert(!G.cerchio(w, c, 3).some(x => igual(x, e1)), 'il muro non è un bersaglio'); assert(!G.cerchio(w, c, 3).some(x => igual(x, e2)), 'dietro al muro non si vede'); assert(G.cerchio(w, c, 3).some(x => igual(x, n1)), 'di fianco sì');
  assert(!G.cono(w, c, 0, 3).some(x => igual(x, e2)), 'il cono non passa il muro'); assert.deepStrictEqual(G.lineaDa(w, c, 0, 5), [], 'la linea si ferma davanti al muro');
  const b = con('o');
  assert.strictEqual(G.lineaDa(b, c, 0, 5).length, 4, 'sopra l\'ostacolo basso la linea passa (la cella non è un bersaglio)'); assert(G.cerchio(b, c, 3).some(x => igual(x, e2)), 'dietro un ostacolo basso si vede');
  const angolo = G.vuota(9, 11); assert(G.cerchio(angolo, G.daOffset(0, 0), 2).length < 19 && G.cerchio(angolo, G.daOffset(0, 0), 2).every(x => G.dentro(angolo, x)), 'nell\'angolo l\'area si taglia'); }

// spicchi e assi: ogni cella sta in un solo spicchio, l'asse i nello spicchio i
{ const c = { q: 7, r: -3 };
  for (let i = 0; i < 6; i++) for (let k = 1; k <= 5; k++) { assert.strictEqual(G.direzioneVerso(c, somma(c, i, k)), i, 'asse ' + i); assert.strictEqual(G.asseVerso(c, somma(c, i, k)), i);
    for (let a = 1; a < k; a++) { const x = { q: c.q + a * D[i][0] + (k - a) * D[(i + 1) % 6][0], r: c.r + a * D[i][1] + (k - a) * D[(i + 1) % 6][1] }; assert.strictEqual(G.direzioneVerso(c, x), i, 'dentro lo spicchio ' + i);
      assert([i, (i + 1) % 6].includes(G.asseVerso(c, x)), 'l\'asse più vicino è uno dei due che lo chiudono'); } }
  assert.strictEqual(G.direzioneVerso(c, c), 0); }

// spinta: dritta lungo l'asse, e sempre un passo più lontano
for (let i = 0; i < 6; i++) { const c = { q: 4, r: 4 }, x = somma(c, i, 2); assert.deepStrictEqual(G.indietro(G.vuota(15, 15), c, x), somma(c, i, 3)); }
for (let i = 0; i < 500; i++) { const a = { q: ri(15), r: ri(15) }, x = { q: ri(15), r: ri(15) }; if (igual(a, x)) continue; const y = G.indietro(null, a, x);
  assert.strictEqual(G.dist(x, y), 1); assert.strictEqual(G.dist(a, y), G.dist(a, x) + 1, 'la spinta allontana di un passo'); }

// percorsi: costi, terreno difficile, rialzi, acqua, ostacoli, alleati, nemici
{ const costi = (A, da, pm, o) => { const r = G.raggiungibili(A, da, pm, o); return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.costo])); };
  const corr = G.arena(['.........']); const z = { q: 0, r: 0 };
  assert.deepStrictEqual(costi(corr, z, 4), { '0,0': 0, '1,0': 1, '2,0': 2, '3,0': 3, '4,0': 4 }, 'un passo, un punto');
  assert.strictEqual(G.raggiungibili(corr, z, 0)['0,0'].costo, 0); assert.strictEqual(Object.keys(G.raggiungibili(corr, z, 0)).length, 1);
  assert.deepStrictEqual(costi(G.arena(['..,......']), z, 6), { '0,0': 0, '1,0': 1, '2,0': 3, '3,0': 4, '4,0': 5, '5,0': 6 }, 'il terreno difficile costa 2');
  assert.strictEqual(costi(G.arena(['..,......']), z, 6, { ignoraDifficile: true })['2,0'], 2, 'chi lo ignora paga 1');
  assert.deepStrictEqual(costi(G.arena(['.^^.....']), z, 6), { '0,0': 0, '1,0': 2, '2,0': 3, '3,0': 4, '4,0': 5, '5,0': 6 }, 'salire costa +1, restare in alto e scendere no');
  assert.strictEqual(costi(G.arena(['.^^.....']), { q: 2, r: 0 }, 3)['0,0'], 2, 'giù dal rialzo: un passo ciascuno'); assert.strictEqual(costi(G.arena(['.^^.....'], ['...w....']), z, 8)['3,0'], 5);
  assert.strictEqual(costi(G.arena(['....'], ['.w..']), z, 3)['1,0'], 2, 'l\'acqua è terreno difficile'); assert.strictEqual(costi(G.arena(['....'], ['.w..']), z, 3, { ignoraDifficile: true })['1,0'], 1);
  assert.strictEqual(costi(G.arena(['..#..']), z, 9)['3,0'], undefined, 'un muro in un corridoio chiude'); assert.strictEqual(costi(G.arena(['..o..']), z, 9)['3,0'], undefined, 'anche un ostacolo basso');
  // aggirare un muro: il costo è la strada più corta
  const gir = G.arena(['.....', '..#..', '.....']), da = { q: 0, r: 1 }, ris = G.raggiungibili(gir, da, 9), dest = { q: 4, r: 1 }, pc = G.percorso(ris, dest);
  assert(pc && pc.length === ris[K(4, 1)].costo && igual(pc[pc.length - 1], dest) && pc.every((c, i) => G.dist(i ? pc[i - 1] : da, c) === 1 && G.passabile(gir, c)), 'percorso valido'); assert(ris[K(4, 1)].costo > 4, 'più lungo della linea retta');
  assert.strictEqual(G.percorso(ris, { q: 2, r: 1 }), null, 'il muro non è raggiungibile'); assert.deepStrictEqual(G.percorso(ris, da), []);
  // nemici e alleati
  const nem = costi(corr, z, 8, { blocca: [{ q: 3, r: 0 }] }); assert.strictEqual(nem['4,0'], undefined, 'i nemici sbarrano un corridoio'); assert.strictEqual(nem['2,0'], 2);
  const ml = G.vuota(9, 3), pas = [{ q: 3, r: 1 }], con = G.raggiungibili(ml, { q: 0, r: 1 }, 6, { passa: pas });
  assert(con[K(3, 1)] && con[K(4, 1)], 'si attraversa un alleato'); assert(!G.fermabili(con, pas).some(c => igual(c, pas[0])), 'ma non ci si ferma'); assert(!G.fermabili(con, []).some(c => igual(c, { q: 0, r: 1 })), 'la partenza non è una meta');
  const bl = G.raggiungibili(ml, { q: 0, r: 1 }, 6, { blocca: [{ q: 3, r: 1 }] }); assert(!bl[K(3, 1)] && bl[K(4, 1)], 'attorno a un nemico si gira');
  assert.deepStrictEqual(G.raggiungibili(gir, da, 9), G.raggiungibili(gir, da, 9), 'ripetibile'); }

// percorsi: stesso risultato di un calcolo lento e semplice (Bellman-Ford) su arene casuali
for (let n = 0; n < 60; n++) { const righe = Array.from({ length: 11 }, () => Array.from({ length: 9 }, () => { const x = rng(); return x < .1 ? '#' : x < .18 ? 'o' : x < .3 ? ',' : x < .38 ? '^' : '.'; }).join('')),
  sup = Array.from({ length: 11 }, () => Array.from({ length: 9 }, () => rng() < .08 ? 'w' : '.').join('')), A = G.arena(righe, sup), L = G.celle(A).filter(c => G.passabile(A, c)), da = L[ri(L.length)];
  const nem = L.filter(c => !igual(c, da) && rng() < .08), opz = { blocca: nem, ignoraDifficile: rng() < .3 }, ris = G.raggiungibili(A, da, 99, opz);
  const best = { [K(da.q, da.r)]: 0 }; let cambia = true; const bloc = new Set(nem.map(c => K(c.q, c.r)));
  while (cambia) { cambia = false; for (const c of L) { const kc = K(c.q, c.r); if (best[kc] === undefined) continue; for (const v of G.vicini(c)) { const kv = K(v.q, v.r); if (bloc.has(kv)) continue; const cs = G.costoEntrata(A, c, v, opz); if (cs === Infinity) continue; if (best[kv] === undefined || best[kc] + cs < best[kv]) { best[kv] = best[kc] + cs; cambia = true; } } } }
  assert.deepStrictEqual(Object.fromEntries(Object.entries(ris).map(([k, v]) => [k, v.costo])), best, 'costi uguali al calcolo lento, arena ' + n);
  for (const [k, v] of Object.entries(ris)) if (v.da !== null) { assert.strictEqual(ris[v.da].costo + G.costoEntrata(A, ris[v.da], v, opz), v.costo, 'catena dei predecessori'); } }
console.log('griglia ok');
