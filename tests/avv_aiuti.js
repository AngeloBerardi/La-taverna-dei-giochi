// Aiuti dei test della battaglia: eroi di ogni classe e livello, squadre, mostri pronti, partenze veloci. Non è un test.
const assert = require('assert');
const E = require('../src/js/motori/27-eroi.js');
global.EROI = E;
const A = require('../src/js/motori/27e-avv-poteri.js');
const AR = require('../src/js/motori/27h-avv-arene.js');
const C = require('../src/js/motori/27i-avv-scontro.js');
const BASI = {
  guerriero: { for: 15, des: 12, cos: 14, int: 8, sag: 10, car: 8 }, ladro: { for: 8, des: 15, cos: 13, int: 12, sag: 10, car: 10 }, mago: { for: 8, des: 14, cos: 12, int: 15, sag: 10, car: 8 },
  chierico: { for: 12, des: 10, cos: 13, int: 8, sag: 15, car: 10 }, esploratore: { for: 10, des: 15, cos: 13, int: 8, sag: 14, car: 8 }, bardo: { for: 8, des: 14, cos: 12, int: 10, sag: 8, car: 15 } };
const ASP = { pelle: 0, capelli: 0, mantello: 0, viso: 0 }, CLASSI = Object.keys(BASI);
let creati = 5000;
// eroe del livello dato con le scelte già fatte (prime opzioni) e l'equipaggiamento di partenza
function eroe(cl, liv, razza, nome) {
  const h = E.nuovo({ nome: nome || cl[0].toUpperCase() + cl.slice(1), razza: razza || 'umano', classe: cl, base: BASI[cl], aspetto: ASP }, ++creati);
  h.liv = liv || 1; h.xp = E.SOGLIE_XP[h.liv - 1]; h.hpMax = E.derivati(h).hpMax; h.hp = h.hpMax; const c = A.completa(h); c.scelte = c.scelte || {}; return c;
}
// squadra di n eroi del livello dato: guerriero, mago, chierico, ladro (in quest'ordine)
const squadra = (n, liv) => ['guerriero', 'mago', 'chierico', 'ladro'].slice(0, n).map((cl, i) => ({ eroe: eroe(cl, liv, ['umano', 'elfo', 'nano', 'piccolo'][i]), dist: 0 }));
// battaglia pronta: squadra, nemici (id del bestiario), ambiente e seme; reazioni automatiche per tutti (i test non rispondono alle pause)
const battaglia = (squad, nemici, o) => { o = o || {}; return C.nuovo(squad, nemici, o.arena || AR.genera(o.seme || 1, o.ambiente || 'strada'), Object.assign({ seme: o.seme || 1, reazioni: { eroi: 'auto', nemici: 'auto' } }, o.opz || {})); };
// mette un combattente in una cella (colonna, riga dell'arena)
const metti = (s, id, col, riga) => { const G = require('../src/js/motori/27g-avv-griglia.js'), q = G.daOffset(col, riga), c = s.cb.find(x => x.id === id); c.q = q.q; c.r = q.r; return c; };
const copia = x => JSON.parse(JSON.stringify(x));
// ---- scene di prova: arena vuota 9x11, azione che si ripete fino al turno di `chi`, creature messe dove si vuole ----
const aperta = (righe, sup) => Object.assign(copia(AR.ripiego('strada')), { righe: righe || Array.from({ length: 11 }, () => '.........'), sup: sup || null });
const riga = (r, testo) => { const x = Array.from({ length: 11 }, () => '.........'); x[r] = testo; return x; };
const mostro = (s, id) => s.cb.find((c) => c.id === id), pos = (s, id) => { const c = mostro(s, id); return { q: c.q, r: c.r }; };
const ok = (r, msg) => { assert(!r.err && !r.pausa, (msg || '') + ' → ' + (r.err || JSON.stringify(r.pausa))); return r; };
function finoA(s, id) { let x = s; for (let n = 0; n < 300; n++) { const a = C.attore(x); if (a && a.id === id) return x; if (x.over) throw new Error('finita prima'); x = ok(C.act(x, { t: 'fine' })).s; } throw new Error('turno non raggiunto: ' + id); }
// scena: squadra, nemici, posizioni { id: [colonna, riga] }, arena; il turno è di `chi` con azione, bonus e reazioni intatti
function scena(squad, nem, posiz, o) { o = o || {}; let s = battaglia(squad, nem, { seme: o.seme || 3, arena: o.arena || aperta(), opz: o.opz }); s = finoA(s, o.chi || 'e1');
  for (const [id, [col, r]] of Object.entries(posiz)) metti(s, id, col, r); s.turno.pm = s.turno.pmTirato = 6; for (const c of s.cb) c.rea = true; return s; }
const dai = (s, id, ...poteri) => { const c = mostro(s, id); for (const p of poteri) if (!c.poteri.includes(p)) c.poteri.push(p); return c; };
module.exports = { E, A, AR, C, BASI, ASP, CLASSI, eroe, squadra, battaglia, metti, copia, aperta, riga, mostro, pos, ok, finoA, scena, dai };
