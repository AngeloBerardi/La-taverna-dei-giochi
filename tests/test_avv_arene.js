// Arene della battaglia: generate dal seme per ogni ambiente (valide, collegate, con copertura per tutti) e scritte a mano per i capi.
const assert = require('assert');
global.EROI = require('../src/js/motori/27-eroi.js');
const G = require('../src/js/motori/27g-avv-griglia.js');
const AR = require('../src/js/motori/27h-avv-arene.js');
const BEST = require('../src/js/motori/27f-avv-bestiario.js');
const K = G.K;
const conta = (A, ch) => A.righe.join('').split(ch).length - 1, contaSup = (A, ch) => (A.sup || []).join('').split(ch).length - 1;
const blocchi = (A) => G.celle(A).filter(c => !G.passabile(A, c)).length;

// gli ambienti sono quelli della mappa del mondo e dei luoghi speciali
assert.deepStrictEqual(AR.AMBIENTI.slice().sort(), ['antro', 'bosco', 'citta', 'collina', 'palude', 'pianura', 'strada', 'torre']);
assert(AR.AMBIENTI.every(a => AR.NOMI[a] && AR.RICETTE[a]));
assert.deepStrictEqual([['pianura'], ['bosco'], ['collina'], ['palude'], ['strada'], ['strada', 'citta'], ['bosco', 'antro'], ['collina', 'torre'], ['bosco', 'campo'], ['palude', 'tesoro'], ['montagna']].map(([t, p]) => AR.ambienteDa(t, p)),
  ['pianura', 'bosco', 'collina', 'palude', 'strada', 'citta', 'antro', 'torre', 'pianura', 'palude', 'strada'], 'ambiente dalla casella');

// partenze e uscite uguali per tutte, calcolate ogni volta (nessun dato condiviso)
{ const a = AR.ingressi(), b = AR.ingressi(); assert.deepStrictEqual(a, b); a.eroi.pop(); assert.notStrictEqual(a.eroi.length, b.eroi.length, 'copie indipendenti');
  assert.strictEqual(b.eroi.length, 10); assert.strictEqual(b.nemici.length, 14); assert.strictEqual(b.uscite.length, 9);
  assert.deepStrictEqual(b.eroi[0], G.daOffset(4, 8), 'il primo eroe è al centro della riga avanzata'); assert.deepStrictEqual(b.nemici[0], G.daOffset(4, 2)); }

// ogni arena generata: valida, collegata, con partenze libere e copertura da tutte e due le parti
const PER = 200, riga = {};
for (const amb of AR.AMBIENTI) { const viste = new Set(); let b = { T: 0, o: 0, '#': 0, ',': 0, '^': 0, w: 0, v: 0, f: 0 };
  for (let seme = 1; seme <= PER; seme++) {
    const A = AR.genera(seme, amb); viste.add(JSON.stringify(A.righe) + JSON.stringify(A.sup));
    assert.strictEqual(AR.valida(A), null, `${amb} ${seme}: ${AR.valida(A)}`); assert.strictEqual(A.ambiente, amb); assert.strictEqual(A.nome, AR.NOMI[amb]); assert.strictEqual(A.id, amb + '-' + seme);
    assert.deepStrictEqual(AR.genera(seme, amb), A, 'stesso seme, stessa arena'); assert.deepStrictEqual(JSON.parse(JSON.stringify(A)), A, 'JSON puro'); assert(!/-base$/.test(A.id), 'mai il ripiego: ' + amb + ' ' + seme);
    assert.strictEqual(A.w, 9); assert.strictEqual(A.h, 11); assert(blocchi(A) <= 24, 'al massimo un quarto di ostacoli');
    const liberi = G.celle(A).filter(c => G.passabile(A, c)); const partenze = [...A.ingressi.eroi, ...A.ingressi.nemici, ...A.uscite];
    for (const da of [A.ingressi.eroi[0], A.ingressi.eroi[9], A.ingressi.nemici[0], A.ingressi.nemici[13], A.uscite[0]]) { const r = G.raggiungibili(A, da, 99); assert(liberi.every(c => r[K(c.q, c.r)]), 'da ogni partenza si arriva ovunque'); }
    for (const c of partenze) { assert(G.passabile(A, c) && !G.sup(A, c), 'partenze e uscite libere e senza superfici pericolose'); }
    assert(A.uscite.every(c => c.r === 10) && A.uscite.length >= 3, 'uscite sul bordo basso');
    let min = 99; for (const e of A.ingressi.eroi) for (const n of A.ingressi.nemici) min = Math.min(min, G.dist(e, n)); assert(min >= 6, 'schieramenti lontani: ' + min);
    const cop = (r0, r1) => G.celle(A).filter(c => c.r >= r0 && c.r <= r1 && ['alto', 'basso', 'muro'].includes(G.tipo(A, c).id)).length; assert(cop(2, 5) >= 2 && cop(5, 8) >= 2, 'ripari in tutte e due le metà');
    for (const k of Object.keys(b)) b[k] += conta(A, k) + (k in { w: 1, v: 1, f: 1 } ? contaSup(A, k) - conta(A, k) : 0);
  }
  riga[amb] = { varianti: viste.size, ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, +(v / PER).toFixed(1)])) };
  assert(viste.size >= PER * .9, `${amb}: arene troppo simili (${viste.size} diverse su ${PER})`); }
// ogni ambiente ha la sua firma
assert(riga.bosco.T >= 6 && riga.bosco[','] >= 7, 'bosco: alberi e radici'); assert(riga.palude.w >= 9 && riga.palude[','] >= 5 && riga.palude.v >= 1.5, 'palude: acqua, fango, veleno');
assert(riga.citta.o >= 8 && riga.citta['#'] >= 3.5, 'città: casse e muri'); assert(riga.antro['#'] >= 4 && riga.antro.T >= 5, 'antro: roccia e colonne');
assert(riga.collina['^'] >= 8, 'collina: rialzi'); assert(riga.torre.f >= 1 && riga.torre.o >= 3, 'torre: statue e bracieri'); assert(riga.pianura.T <= 2.1 && riga.strada.T <= 1.1, 'pianura e strada: quasi senza alberi');
assert(riga.bosco.T > riga.pianura.T + 4, 'gli ambienti non si assomigliano');

// ambiente sconosciuto: strada; il ripiego è sempre valido
assert.strictEqual(AR.genera(3, 'luna').ambiente, 'strada'); for (const amb of AR.AMBIENTI) { const R = AR.ripiego(amb); assert.strictEqual(AR.valida(R), null); assert.strictEqual(R.ambiente, amb); }

// controlli di `valida`: ogni difetto viene riconosciuto
{ const A = AR.genera(1, 'pianura'), sporca = (f) => { const B = JSON.parse(JSON.stringify(A)); f(B); return AR.valida(B); };
  assert.strictEqual(AR.valida(null), 'dimensioni'); assert.strictEqual(AR.valida(G.vuota(5, 5)), 'dimensioni'); assert.strictEqual(sporca(B => delete B.ingressi), 'ingressi mancanti');
  assert.strictEqual(sporca(B => B.ingressi.eroi.length = 3), 'ingressi pochi'); assert.strictEqual(sporca(B => B.ingressi.nemici[0] = B.ingressi.eroi[0]), 'ingressi sovrapposti');
  const riempi = (B, c, ch) => { const o = G.aOffset(c.q, c.r); B.righe[o.riga] = B.righe[o.riga].slice(0, o.col) + ch + B.righe[o.riga].slice(o.col + 1); };
  assert.strictEqual(sporca(B => riempi(B, B.ingressi.eroi[0], '#')), 'ingresso su una cella bloccata'); assert.strictEqual(sporca(B => B.uscite.push(G.daOffset(3, 5))), 'uscita non sul bordo');
  assert.strictEqual(sporca(B => { B.ingressi.nemici[1] = G.daOffset(4, 6); }), 'schieramenti troppo vicini');
  assert.strictEqual(sporca(B => { for (let c = 0; c < 9; c++) riempi(B, G.daOffset(c, 5), '#'); }), 'celle isolate', 'un muro da parte a parte divide il campo');
  assert.strictEqual(sporca(B => { for (const r of [3, 4, 5, 6, 7]) for (let c = 0; c < 9; c += 2) riempi(B, G.daOffset(c, r), 'o'); }), 'troppi ostacoli');
  assert.strictEqual(sporca(B => { for (let r = 2; r <= 8; r++) B.righe[r] = B.righe[r].replace(/[ToO#]/g, '.'); }), 'copertura'); }

// capi: arena scritta a mano, valida, con la sua firma; vale per i capi del bestiario e non per gli altri
assert.deepStrictEqual(Object.keys(AR.CAPI).sort(), BEST.ID.filter(i => BEST.M[i].capo).sort(), 'un\'arena per ogni capo del bestiario');
for (const [def, c] of Object.entries(AR.CAPI)) { const A = AR.capo(def); assert.strictEqual(AR.valida(A), null, def + ': ' + AR.valida(A)); assert.strictEqual(A.id, c.id); assert.strictEqual(A.nome, c.nome); assert(c.desc.length > 20);
  assert.deepStrictEqual(A, AR.capo(def)); assert(A.uscite.length >= 3); assert(AR.AMBIENTI.includes(A.ambiente)); assert(!/Catan|Azul|Baldur/.test(c.nome + c.desc)); }
assert(contaSup(AR.capo('capobanda-corvino'), 'f') === 1 && conta(AR.capo('capobanda-corvino'), '^') === 1, 'accampamento: un fuoco e un carro'); assert(contaSup(AR.capo('re-senza-corona'), 'v') >= 2 && conta(AR.capo('re-senza-corona'), '^') === 1, 'cripta: miasma e trono');
assert(conta(AR.capo('maestro-della-torre'), '^') >= 5 && contaSup(AR.capo('maestro-della-torre'), 'f') === 2, 'sala del Maestro: piedistallo e bracieri');
assert.strictEqual(AR.capo('lupo-grigio'), null);
assert.strictEqual(AR.perIncontro(4, 'bosco', ['lupo-grigio', 're-senza-corona']).id, 'cripta', 'se c\'è un capo vale la sua arena'); assert.strictEqual(AR.perIncontro(4, 'bosco', ['lupo-grigio']).id, 'bosco-4'); assert.strictEqual(AR.perIncontro(4, 'bosco').id, 'bosco-4');
console.log('arene ok', JSON.stringify(riga));
