// Bot di prova per la battaglia a istanti (ATEM, 27s): un bot «bravo» (cure, poteri pronti, bersaglio comune) e uno «casuale».
// Sono solo per i test di B3: gli atteggiamenti veri degli eroi e l'IA in tempo reale arrivano con B4 (AIA).
const T = require('../src/js/motori/27s-avv-tempo.js');
const A = require('../src/js/motori/27e-avv-poteri.js');
const S = require('../src/js/motori/27d-avv-stati.js');
const G = require('../src/js/motori/27g-avv-griglia.js');

const OGNI = 5; // i bot pensano ogni mezzo secondo
const pronto = (s, c, p) => p.id !== 'attacco' && p.costo !== 'reazione' && A.usiRimasti(c, p) > 0 && (c.ric[p.id] || 0) <= s.t;
const poteri = (s, c, f) => c.poteri.map((id) => A.P[id]).filter((p) => p && pronto(s, c, p) && f(p));
const cura = (p) => p.eff.some((e) => e.k === 'cura');
const offende = (p) => ['nemico', 'nemici'].includes(p.bers) && p.eff.some((e) => e.k === 'danno' || (e.k === 'stato' && S.STATI[e.id].mal));
const rinforza = (p) => (p.bers === 'se' || p.bers === 'alleati') && !cura(p) && p.eff.some((e) => e.k === 'temp' || (e.k === 'stato' && S.STATI[e.id].ben) || e.k === 'conc');

// il nemico da colpire: si tiene quello di prima se è ancora vicino, altrimenti il più vicino (da lontano il più ferito che si vede)
function bersaglio(s, c, nem) {
  const o = s.ordini[c.id], prima = o && o.t === 'attacca' ? nem.find((x) => x.id === o.bers) : null;
  if (prima && G.dist(c, prima) <= Math.max(2, c.gitt + 1)) return prima;
  if (c.gitt > 2) { const tiro = nem.filter((x) => G.dist(c, x) <= (c.gittaLunga || c.gitt) && G.vista(s.arena, c, x).visibile).sort((a, b) => a.hp - b.hp)[0]; if (tiro) return tiro; }
  return nem.slice().sort((a, b) => G.dist(c, a) - G.dist(c, b) || a.hp - b.hp)[0];
}
// quanti nemici prende un potere ad area puntato su `b` (stima: chi sta entro il raggio dal centro o da chi lancia)
const presi = (c, p, b, nem) => p.area === 'cerchio' ? nem.filter((x) => G.dist(x, b) <= p.raggio).length : p.area === 'aura' ? nem.filter((x) => G.dist(x, c) <= p.raggio).length : p.area === 'singolo' ? 1 : nem.filter((x) => G.dist(x, c) <= p.raggio && G.dist(x, b) <= p.raggio).length;

function bravo(s, lato) {
  const ord = [], amici = s.cb.filter((x) => x.lato === lato && T.inPiedi(x)), nem = s.cb.filter((x) => x.lato !== lato && T.inPiedi(x));
  if (!nem.length) return ord;
  for (const c of amici) {
    const o = s.ordini[c.id]; if (c.lancio || s.rapidi[c.id] || (o && ['potere', 'oggetto', 'rialza'].includes(o.t))) continue;
    const terra = s.cb.find((x) => x.lato === lato && T.inCampo(x) && x.hp <= 0);
    if (terra) {
      const p = poteri(s, c, (p) => p.bers === 'terra' || (cura(p) && ['amico', 'amici'].includes(p.bers)))[0];
      if (p) { ord.push({ chi: c.id, t: 'potere', id: p.id, bers: p.area === 'singolo' ? terra.id : undefined }); continue; }
      const piuVicino = amici.slice().sort((a, b) => G.dist(a, terra) - G.dist(b, terra))[0];
      if (lato === 'eroi' && piuVicino === c) { ord.push({ chi: c.id, t: 'rialza', bers: terra.id }); continue; }
    }
    const ferito = amici.filter((x) => x.hp < x.hpMax / 2).sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0];
    if (ferito) { const p = poteri(s, c, (p) => cura(p) && p.bers !== 'se')[0] || (ferito === c ? poteri(s, c, (p) => cura(p) && p.bers === 'se')[0] : null);
      if (p) { ord.push({ chi: c.id, t: 'potere', id: p.id, bers: p.area === 'singolo' ? ferito.id : undefined }); continue; } }
    const b = bersaglio(s, c, nem);
    if (nem.some((x) => G.dist(x, c) <= 3)) { const p = poteri(s, c, rinforza)[0]; if (p) { ord.push({ chi: c.id, t: 'potere', id: p.id }); continue; } }
    const base = A.stima(c, 'attacco', b).atteso; let meglio = null, bv = 0;
    for (const p of poteri(s, c, offende)) { const n = presi(c, p, b, nem); if (!n) continue; const st = A.stima(c, p, b), v = (st.atteso + (p.eff.some((e) => e.k === 'stato') ? 2 : 0)) * n;
      if (v > bv && (v > base * (p.ric === 'turno' ? 1 : 1.5) || n >= 2)) { bv = v; meglio = p; } }
    if (meglio) { ord.push({ chi: c.id, t: 'potere', id: meglio.id, bers: b.id }); continue; }
    if (!o || o.t !== 'attacca' || o.bers !== b.id) ord.push({ chi: c.id, t: 'attacca', bers: b.id });
  }
  return ord;
}
// casuale: ogni tanto un ordine a caso (andare, attaccare, fermarsi, un potere a caso); gli ordini non validi si scartano
function casuale(s, lato, rnd) {
  const ord = [], celle = G.celle(s.arena).filter((x) => G.passabile(s.arena, x)), nem = s.cb.filter((x) => x.lato !== lato && T.inPiedi(x));
  for (const c of s.cb.filter((x) => x.lato === lato && T.inPiedi(x))) {
    if (rnd() > 0.25 || !nem.length) continue; const k = rnd(), b = nem[Math.floor(rnd() * nem.length)];
    if (k < 0.45) ord.push({ chi: c.id, t: 'vai', a: celle[Math.floor(rnd() * celle.length)] });
    else if (k < 0.65) ord.push({ chi: c.id, t: 'attacca', bers: b.id });
    else if (k < 0.9) ord.push({ chi: c.id, t: 'ferma' });
    else { const p = poteri(s, c, () => true); if (p.length) ord.push({ chi: c.id, t: 'potere', id: p[Math.floor(rnd() * p.length)].id, bers: b.id }); }
  }
  return ord;
}
// una battaglia intera: i bot danno ordini ogni mezzo secondo (sullo stato stesso, per fare presto). bots: { eroi, nemici } = 'bravo' | 'casuale'
// → { s, ordini, scartati, registro: [[istante, ordini]] } (il registro serve a rigiocare la stessa battaglia)
function gioca(s, bots, o) {
  o = o || {}; const rnd = require('./carica.js').rng(o.seme || 7), registro = []; let ordini = 0, scartati = 0;
  while (!s.over) {
    for (const lato of ['eroi', 'nemici']) {
      const b = bots[lato]; if (!b) continue; const ord = b === 'bravo' ? bravo(s, lato) : casuale(s, lato, rnd); const presi = [];
      for (const a of ord) { const r = T.ordina(s, a, { qui: true }); if (r.err) { if (b === 'bravo') throw new Error('ordine del bot bravo rifiutato: ' + r.err + ' ' + JSON.stringify(a)); scartati++; } else { presi.push(a); ordini++; } }
      if (presi.length) registro.push([s.t, presi]);
    }
    const r = T.passo(s, OGNI, { qui: true }); if (r.err) throw new Error(r.err);
  }
  return { s, ordini, scartati, registro };
}
module.exports = { OGNI, bravo, casuale, gioca };
