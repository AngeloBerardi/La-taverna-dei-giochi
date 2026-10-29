#!/usr/bin/env node
// Bilanciamento della battaglia (Cantari di Ventura): simula incontri generati da `ASCO.incontro` con il bot bravo (eroi: eroica, mostri: normale) e,
// se serve, con il bot casuale, e stampa la tabella. Il test `tests/test_avv_bilanciamento.js` usa le stesse funzioni con pochi incontri.
//   node tools/avventura/bilancia.js [--fam bestie,banditi,nonmorti,torre] [--diff facile,medio,difficile,capo] [--k 8] [--casuale] [--liv 1-8] [--n 1,2,3,4] [--json]
const path = require('path');
const R = (f) => require(path.join(__dirname, '../../src/js/motori', f));
const E = R('27-eroi.js'); global.EROI = E;
const A = R('27e-avv-poteri.js'), BE = R('27f-avv-bestiario.js'), AR = R('27h-avv-arene.js'), C = R('27i-avv-scontro.js'), IA = R('27j-avv-ia.js');
const BASI = { guerriero: { for: 15, des: 12, cos: 14, int: 8, sag: 10, car: 8 }, ladro: { for: 8, des: 15, cos: 13, int: 12, sag: 10, car: 10 }, mago: { for: 8, des: 14, cos: 12, int: 15, sag: 10, car: 8 },
  chierico: { for: 12, des: 10, cos: 13, int: 8, sag: 15, car: 10 } };
const ASP = { pelle: 0, capelli: 0, mantello: 0, viso: 0 }, RAZZE = ['umano', 'elfo', 'nano', 'piccolo'];
// la compagnia di prova: guerriero, mago, chierico, ladro (come nei test), con le scelte di livello già fatte
// `sb` = seme di partenza dei personaggi (ogni eroe ne usa uno diverso): stessa compagnia, a ogni chiamata
function squadra(n, liv, sb) {
  return ['guerriero', 'mago', 'chierico', 'ladro'].slice(0, n).map((cl, i) => {
    const h = E.nuovo({ nome: cl, razza: RAZZE[i], classe: cl, base: BASI[cl], aspetto: ASP }, (sb || 90000) + i);
    h.liv = liv; h.xp = E.SOGLIE_XP[liv - 1]; h.hpMax = E.derivati(h).hpMax; h.hp = h.hpMax; const c = A.completa(h); c.scelte = c.scelte || {}; return { eroe: c, dist: 0 }; });
}
// livelli in cui una famiglia ha mostri (senza il capo) e il suo capo
const CAMPO = (fam) => { const p = BE.ID.map((i) => BE.M[i]).filter((m) => m.fam === fam && !m.capo), l = p.map((m) => m.liv); return { da: Math.min(...l), a: Math.max(...l), capo: BE.ID.map((i) => BE.M[i]).find((m) => m.fam === fam && m.capo) || null }; };
// una cella della tabella: K battaglie con incontri diversi (seme dell'incontro e dell'arena); modo = 'bravo' | 'casuale'
function cella(fam, liv, n, diff, K, modo) {
  let v = 0, perso = 0, giri = 0, max = 0, nm = 0, xp = 0, stalli = 0;
  for (let i = 0; i < K; i++) {
    const inc = C.incontro(fam, liv, n, diff, 1000 * liv + 10 * n + i + 7 * diff.length); nm += inc.nemici.length; xp += inc.xp;
    const s = C.nuovo(squadra(n, liv, 90000 + 10 * liv + 100 * i), inc.nemici, AR.genera(50 + i, AR.AMBIENTI[(i + liv) % AR.AMBIENTI.length]), { seme: 50 + i, reazioni: { eroi: 'auto', nemici: 'auto' } });
    const x = IA.partita(s, modo === 'casuale' ? { eroi: 'casuale', nemici: 'normale' } : { eroi: 'eroica', nemici: 'normale' });
    if (x.over.esito === 'vittoria') v++; if (x.over.esito === 'stallo') stalli++;
    const e = x.cb.filter((c) => c.lato === 'eroi'); perso += 1 - e.reduce((a, c) => a + Math.max(0, c.hp), 0) / e.reduce((a, c) => a + c.hpMax, 0);
    giri += x.giro; max = Math.max(max, x.giro);
  }
  return { fam, liv, n, diff, K, nm: +(nm / K).toFixed(1), xp: Math.round(xp / K), vit: Math.round(100 * v / K), perso: Math.round(100 * perso / K), giri: +(giri / K).toFixed(1), max, stalli };
}
// le celle di una difficoltà: tutti i livelli del campo della famiglia × 1..4 eroi (i capi: la squadra al livello del capo, 3 e 4 eroi)
function celle(fam, diff, o) {
  o = o || {}; const c = CAMPO(fam), ns = o.n || [1, 2, 3, 4], out = [];
  if (diff === 'capo') { if (c.capo) for (const n of ns.filter((x) => x >= 3)) out.push([c.capo.liv, n]); return out; }
  for (let l = Math.max(c.da, o.da || 1); l <= Math.min(c.a, o.a || 10); l++) for (const n of ns) out.push([l, n]);
  return out;
}
function tabella(o) {
  o = o || {}; const K = o.k || 8, righe = [];
  for (const diff of o.diff || ['facile', 'medio', 'difficile', 'capo']) for (const fam of o.fam || Object.keys(BE.FAMIGLIE)) for (const [l, n] of celle(fam, diff, o)) {
    const r = cella(fam, l, n, diff, K, 'bravo'); if (o.casuale && diff === 'medio') r.cas = cella(fam, l, n, diff, K, 'casuale').vit; righe.push(r); if (o.avanza) o.avanza(r); }
  return righe;
}
// media delle celle di una difficoltà
const media = (righe, campo) => righe.length ? Math.round(righe.reduce((a, r) => a + r[campo], 0) / righe.length) : null;
module.exports = { squadra, CAMPO, cella, celle, tabella, media };

if (require.main === module) {
  const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
  const [da, a] = String(arg('liv', '1-10')).split('-').map(Number), o = { k: +arg('k', 8), fam: String(arg('fam', Object.keys(BE.FAMIGLIE).join(','))).split(','), diff: String(arg('diff', 'facile,medio,difficile,capo')).split(','),
    n: String(arg('n', '1,2,3,4')).split(',').map(Number), da, a, casuale: !!arg('casuale', false) };
  const json = !!arg('json', false), righe = tabella(Object.assign(o, { avanza: (r) => { if (json) console.log(JSON.stringify(r)); } }));
  if (!json) {
    for (const diff of o.diff) { const rs = righe.filter((r) => r.diff === diff); if (!rs.length) continue;
      console.log(`\n## ${diff}\n\n| famiglia | liv | eroi | mostri | PE | vittorie % | PF persi % | giri | max |${o.casuale && diff === 'medio' ? ' casuale % |' : ''}\n|---|---|---|---|---|---|---|---|---|${o.casuale && diff === 'medio' ? '---|' : ''}`);
      for (const r of rs) console.log(`| ${r.fam} | ${r.liv} | ${r.n} | ${r.nm} | ${r.xp} | ${r.vit} | ${r.perso} | ${r.giri} | ${r.max} |${r.cas != null ? ' ' + r.cas + ' |' : ''}`);
      console.log(`\nMedia: vittorie ${media(rs, 'vit')}%, PF persi ${media(rs, 'perso')}%, giri ${(rs.reduce((a, r) => a + r.giri, 0) / rs.length).toFixed(1)}, più lunga ${Math.max(...rs.map((r) => r.max))} giri${rs[0].cas != null ? ', casuale ' + media(rs, 'cas') + '%' : ''}.`); } }
}
