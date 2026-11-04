// Miniature dell'Avventura (A12): eroi per razza/classe/aspetto e un modello per ognuno dei mostri del bestiario.
const assert = require('assert');
const AMIN = require('../src/js/motori/28g-avv-mini.js');
const BEST = require('../src/js/motori/27f-avv-bestiario.js');
const E = require('../src/js/motori/27-eroi.js');
const ASCE = require('../src/js/motori/28f-avv-scena.js');
const FORME = new Set(['c', 'k', 's', 'b']);
const hex = /^#[0-9a-f]{6}$/i;
function controlla(nome, m, { maxPezzi = 40, altMin = 18, altMax = 66, ragMax = 24 } = {}) {
  assert(m.parti.length >= 6 && m.parti.length <= maxPezzi, nome + ': pezzi ' + m.parti.length);
  for (const p of m.parti) {
    assert(Array.isArray(p) && p.length === 11, nome + ': formato');
    assert(FORME.has(p[0]), nome + ': forma ' + p[0]); assert(hex.test(p[1]), nome + ': colore ' + p[1]);
    for (let i = 2; i <= 9; i++) assert(Number.isFinite(p[i]), nome + ': numero ' + i + ' → ' + p[i]);
    assert(p[10] === '' || p[10] === 'e', nome + ': flag');
    for (const i of [5, 7]) assert(p[i] >= 0, nome + ': misura negativa');
  }
  assert(m.alt >= altMin && m.alt <= altMax, nome + ': altezza ' + m.alt);
  assert(m.rag <= ragMax, nome + ': ingombro ' + m.rag);
  assert(m.base && m.base.r >= 8 && m.base.r <= 20 && hex.test(m.base.col), nome + ': base');
  // gli occhi o la luce non sono sotto il suolo e niente va molto sotto terra
  for (const p of m.parti) assert(p[3] > -2, nome + ': sotto terra');
}

// ---- eroi: ogni razza × classe × stile di capelli ----
{
  const cols = { pelle: '#e0ac82', capelli: '#5a3a1e', mantello: '#2f6fb5' };
  const vistiAlt = {};
  for (const razza of Object.keys(E.RAZZE)) for (const classe of Object.keys(E.CLASSI)) for (let stile = 0; stile < E.ASPETTO.capelli; stile++) {
    const m = AMIN.eroe(razza, classe, cols, stile);
    controlla(razza + '/' + classe + '/' + stile, m, { altMin: 18, altMax: 48, ragMax: 22 });
    assert.deepStrictEqual(m, AMIN.eroe(razza, classe, cols, stile), 'deterministico');
    vistiAlt[razza] = Math.max(vistiAlt[razza] || 0, m.alt);
  }
  assert(vistiAlt.piccolo < vistiAlt.umano && vistiAlt.umano < vistiAlt.orco, 'le razze hanno altezze diverse');
  assert(AMIN.eroe('nano', 'guerriero', cols, 0).alt < AMIN.eroe('elfo', 'guerriero', cols, 0).alt);
  // l'aspetto cambia i colori: pelle, capelli e mantello compaiono nei pezzi
  const m = AMIN.eroe('umano', 'chierico', { pelle: '#aa0011', capelli: '#00bb22', mantello: '#3300cc' }, 0);
  const col = new Set(m.parti.map(p => p[1]));
  assert(col.has('#aa0011') && col.has('#00bb22') && col.has('#3300cc'), 'i colori scelti si vedono');
  // la classe cambia la sagoma
  const forme = c => JSON.stringify(AMIN.eroe('umano', c, cols, 0).parti);
  const tutte = new Set(Object.keys(E.CLASSI).map(forme)); assert.strictEqual(tutte.size, Object.keys(E.CLASSI).length, 'una sagoma per classe');
  // razze con tratti propri: orecchie dell'elfo, barba del nano, zanne dell'orco
  assert(AMIN.eroe('elfo', 'ladro', cols, 0).parti.length > AMIN.eroe('umano', 'ladro', cols, 0).parti.length);
  assert(AMIN.eroe('orco', 'ladro', cols, 0).parti.some(p => p[1] === '#f4efe0'));
}

// ---- mostri: uno per ogni voce del bestiario, famiglie colorate, capi più grandi ----
{
  const M = BEST.M;
  for (const [id, d] of Object.entries(M)) {
    assert(AMIN.MOSTRI[id], 'manca la miniatura di ' + id);
    const m = AMIN.mostro(id, !!d.capo);
    controlla(id, m, { altMin: 10, altMax: 70, ragMax: 30 });
    assert.strictEqual(m.base.fam, d.fam, id + ': famiglia della base = famiglia del bestiario');
    assert.strictEqual(m.base.col, AMIN.COL_FAM[d.fam]);
    assert.strictEqual(m.base.capo, !!d.capo);
    assert.deepStrictEqual(m, AMIN.mostro(id, !!d.capo), 'deterministico');
  }
  for (const id of Object.keys(AMIN.MOSTRI)) assert(M[id], 'miniatura senza mostro: ' + id);
  const capi = Object.entries(M).filter(([, d]) => d.capo).map(([id]) => AMIN.mostro(id, true));
  const medi = Object.entries(M).filter(([, d]) => !d.capo).map(([id]) => AMIN.mostro(id, false));
  assert.strictEqual(capi.length, 3);
  const mediaAlt = L => L.reduce((a, m) => a + m.alt, 0) / L.length, mediaR = L => L.reduce((a, m) => a + m.base.r, 0) / L.length;
  assert(mediaAlt(capi) > mediaAlt(medi) * 1.15, 'i capi sono più alti');
  assert(mediaR(capi) > mediaR(medi), 'i capi hanno una base più larga');
  const unici = new Set(Object.keys(M).map(id => JSON.stringify(AMIN.mostro(id).parti)));
  assert.strictEqual(unici.size, Object.keys(M).length, 'ogni mostro ha la sua sagoma');
  // sconosciuto → ombra generica, mai un errore
  controlla('ignoto', AMIN.mostro('non-esiste'), { altMin: 10, altMax: 70, ragMax: 30 });
  // luminosi: spettri e scintille
  assert(AMIN.mostro('anima-in-pena').lum === 1 && AMIN.mostro('lupo-grigio').lum === 0);
  // i pezzi luminosi sono pochi (costano una seconda mesh)
  for (const id of Object.keys(M)) assert(AMIN.mostro(id).parti.filter(p => p[10] === 'e').length <= 12, id + ': troppi pezzi luminosi');
}

// ---- le miniature rientrano nella stessa grammatica degli oggetti della scena ----
{
  const a = ASCE.parti('torre', .3, {})[0], b = AMIN.mostro('brigante').parti[0];
  assert.strictEqual(a.length, b.length, 'stesso formato dei pezzi');
}
// ---- proporzioni da bambola della resa pixel (B2): stessa grammatica, arma e scudo × 1,4, gambe sottili, testa almeno al 35% ----
{
  const cols = { pelle: '#e0ac82', capelli: '#5a3a1e', mantello: '#2f6fb5' }, B = AMIN.BAMBOLA;
  assert(B.arma === 1.4 && B.piedi < 1 && B.testa >= .35 && B.testa <= .4, 'tabella delle misure come nel piano');
  const misura = (m, ruolo) => m.parti.reduce((a, p, i) => a + (AMIN.ruolo(p) === ruolo ? p[5] + p[6] + p[7] : 0), 0);
  for (const razza of Object.keys(E.RAZZE)) for (const classe of Object.keys(E.CLASSI)) {
    const a = AMIN.eroe(razza, classe, cols, 0), b = AMIN.eroe(razza, classe, cols, 0, { bambola: true });
    controlla('bambola ' + razza + '/' + classe, b, { altMin: 18, altMax: 52, ragMax: 22 });
    assert.strictEqual(b.parti.length, a.parti.length, 'stessi pezzi');
    assert.deepStrictEqual(b, AMIN.eroe(razza, classe, cols, 0, { bambola: true }), 'deterministico');
    // i pezzi delle mani e delle armi crescono, le gambe si assottigliano
    const ia = a.parti.map(p => AMIN.ruolo(AMIN.scala([p], 1 / (AMIN.RAZZA[razza] || 1))[0]));
    a.parti.forEach((p, i) => {
      const q = b.parti[i];
      if (ia[i] === 'a') assert(q[5] + q[6] + q[7] > (p[5] + p[6] + p[7]) * 1.35, razza + '/' + classe + ': arma più grande');
      if (ia[i] === 'p') assert(q[5] < p[5] && q[7] === p[7], razza + '/' + classe + ': gambe più sottili, stessa altezza');
      if (ia[i] === 'c') assert.deepStrictEqual(q, p, 'il corpo non cambia');
    });
    assert(ia.includes('a'), classe + ': ha mani o armi');
    // la testa (sopra il collo) è almeno il 35% dell'altezza
    let y0 = 1e9, alt = 0;
    for (const p of b.parti) { const top = p[0] === 's' ? p[3] + p[6] : p[0] === 'b' ? p[3] + p[6] / 2 : p[3] + p[7] / 2, bot = p[0] === 's' ? p[3] - p[6] : p[0] === 'b' ? p[3] - p[6] / 2 : p[3] - p[7] / 2; alt = Math.max(alt, top); if (p[3] >= B.collo * (AMIN.RAZZA[razza] || 1)) y0 = Math.min(y0, bot); }
    assert((alt - y0) / alt >= .35, razza + '/' + classe + ': testa al ' + Math.round((alt - y0) / alt * 100) + '%');
  }
  // una testa piccola si ingrandisce fino alla quota (mai oltre maxTesta), una già grande resta com'è
  const piccola = [['c', '#000000', 0, 8, 0, 4, 4, 16, 0, 0, ''], ['s', '#ffffff', 0, 19, 0, 2, 2, 2, 0, 0, '']];
  const g = AMIN.bambola(piccola), h = g[1][6] / piccola[1][6];
  assert(h > 1 && h <= B.maxTesta + 1e-9, 'testa piccola ingrandita × ' + h.toFixed(2));
  assert.deepStrictEqual(AMIN.bambola([piccola[0], ['s', '#ffffff', 0, 22, 0, 6, 6, 6, 0, 0, '']])[1], ['s', '#ffffff', 0, 22, 0, 6, 6, 6, 0, 0, ''], 'testa grande intatta');
  // mostri a due gambe sì, bestie no
  const lupo = AMIN.mostro('lupo-grigio', false, { bambola: true }), sch = AMIN.mostro('scheletro-armato', false, { bambola: true });
  assert.deepStrictEqual(lupo, AMIN.mostro('lupo-grigio'), 'le bestie non cambiano');
  assert.notDeepStrictEqual(sch.parti, AMIN.mostro('scheletro-armato').parti, 'lo scheletro diventa da bambola');
  for (const id of Object.keys(BEST.M)) controlla('bambola ' + id, AMIN.mostro(id, !!BEST.M[id].capo, { bambola: true }), { altMin: 10, altMax: 72, ragMax: 32 });
}
console.log('test_avv_mini: ok');
