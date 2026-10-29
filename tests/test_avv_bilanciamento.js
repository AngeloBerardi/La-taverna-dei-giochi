// Incontri e bilanciamento (Cantari di Ventura, A4.6): il generatore di incontri a budget di PE e i criteri di A0 misurati con battaglie vere
// (bot bravo contro mostri «normale», bot casuale per confronto). La tabella completa si rifà con `node tools/avventura/bilancia.js`.
const assert = require('assert');
const { AR, C, squadra, battaglia } = require('./avv_aiuti.js');
const BE = require('../src/js/motori/27f-avv-bestiario.js');
const B = require('../tools/avventura/bilancia.js');
const FAM = Object.keys(BE.FAMIGLIE), DIFF = Object.keys(C.DIFFICOLTA);
const dietro = (id) => !['bruto', 'sciame'].includes(BE.M[id].ruolo);

// ---- 1. il generatore: forma, budget, ordine, ripetibilità ----
{ let n = 0;
  for (const fam of FAM) for (let liv = 1; liv <= 10; liv++) for (let eroi = 1; eroi <= 4; eroi++) for (const diff of DIFF) for (let seme = 1; seme <= 3; seme++) {
    const x = C.incontro(fam, liv, eroi, diff, seme * 31 + liv); n++;
    assert(x.nemici.length >= 1 && x.nemici.length <= 8 && x.nemici.length <= eroi + 3 + (diff === 'capo' ? 1 : 0), `${fam} ${liv} ${eroi} ${diff}: ${x.nemici.length} mostri`);
    assert(x.nemici.every((id) => BE.M[id] && BE.M[id].fam === fam), 'solo mostri della famiglia');
    assert.strictEqual(x.nemici.reduce((a, id) => a + BE.M[id].xp, 0), x.xp, 'PE somma dei mostri'); assert.deepStrictEqual([x.fam, x.liv, x.nEroi, x.difficolta], [fam, liv, eroi, diff]);
    const capi = x.nemici.filter((id) => BE.M[id].capo); assert.strictEqual(capi.length, diff === 'capo' && BE.ID.some((i) => BE.M[i].fam === fam && BE.M[i].capo) ? 1 : 0, 'il capo c\'è solo negli incontri col capo');
    const senza = x.nemici.filter((id) => !BE.M[id].capo); if (diff !== 'capo') assert(x.xp <= x.budget || x.nemici.length === 1, `${fam} ${liv} ${eroi} ${diff}: ${x.xp} PE oltre il budget ${x.budget}`);
    assert(!dietro(x.nemici[0]) || senza.every(dietro), 'in testa un bruto (se la famiglia ne ha)'); assert.deepStrictEqual(x.nemici.map(dietro), x.nemici.map(dietro).slice().sort((a, b) => a - b), 'bruti davanti, tiratori e supporti dietro');
    // ogni incontro entra nell'arena e parte
    if (seme === 1 && liv % 3 === 1) { const s = battaglia(squadra(eroi, Math.min(liv, 10)), x.nemici, { seme }); assert(s.cb.filter((c) => c.lato === 'nemici').length === x.nemici.length && !s.over); } }
  assert(n > 1400, 'incontri provati: ' + n);
  // stesso seme, stesso incontro; seme come numero o come generatore; semi diversi, incontri diversi
  assert.deepStrictEqual(C.incontro('banditi', 3, 4, 'medio', 5), C.incontro('banditi', 3, 4, 'medio', 5));
  const varie = new Set(Array.from({ length: 30 }, (_, i) => C.incontro('banditi', 3, 4, 'medio', i + 1).nemici.join())); assert(varie.size >= 6, 'varietà: ' + varie.size);
  let k = 0; const gen = () => (k = (k * 7 + 3) % 10) / 10; assert(C.incontro('nonmorti', 4, 3, 'difficile', gen).nemici.length >= 1);
  // il budget cresce con la difficoltà e con il numero di eroi
  for (const fam of FAM) for (let liv = 1; liv <= 8; liv++) { const b = (d, e) => C.incontro(fam, liv, e || 4, d, 1).budget; assert(b('facile') < b('medio') && b('medio') < b('difficile'), 'budget crescente'); assert(b('medio', 1) < b('medio', 2) && b('medio', 2) < b('medio', 4)); }
  assert.throws(() => C.incontro('banditi', 1, 2, 'impossibile', 1), /difficoltà/); assert.throws(() => C.incontro('draghi', 1, 2, 'medio', 1), /famiglia/); }

// ---- 2. battaglie vere: i criteri di A0 sul campo d'uso di ogni famiglia ----
// campione piccolo e con semi fissi (la tabella completa: tools/avventura/bilancia.js). I valori sono medie su più celle.
{ const scelte = { bestie: { liv: [2, 5], n: [2, 4] }, banditi: { liv: [2, 5], n: [2, 4] }, nonmorti: { liv: [3, 6], n: [2, 4] }, torre: { liv: [4, 7], n: [2, 4] } };
  const prova = (diff, K, casuale) => { const rs = []; for (const [fam, c] of Object.entries(scelte)) for (const l of c.liv) for (const n of c.n) { const r = B.cella(fam, l, n, diff, K, 'bravo'); if (casuale) r.cas = B.cella(fam, l, n, diff, K, 'casuale').vit; rs.push(r); } return rs; };
  const facile = prova('facile', 2), medio = prova('medio', 5, true), difficile = prova('difficile', 5);
  const riga = (nome, rs) => console.log(`  ${nome}: vittorie ${B.media(rs, 'vit')}%, PF persi ${B.media(rs, 'perso')}%, giri ${(rs.reduce((a, r) => a + r.giri, 0) / rs.length).toFixed(1)}, più lunga ${Math.max(...rs.map((r) => r.max))}${rs[0].cas != null ? ', casuale ' + B.media(rs, 'cas') + '%' : ''}`);
  riga('facile', facile); riga('medio', medio); riga('difficile', difficile);
  for (const rs of [facile, medio, difficile]) { assert(rs.every((r) => r.max <= 40 && r.stalli === 0), 'nessuna battaglia oltre 40 giri con il bot bravo'); }
  assert(B.media(facile, 'vit') >= 95, 'facili: ' + B.media(facile, 'vit')); assert(B.media(medio, 'vit') >= 85, 'medi: vittorie ' + B.media(medio, 'vit'));
  assert(B.media(difficile, 'vit') >= 50 && B.media(difficile, 'vit') <= 80, 'difficili: ' + B.media(difficile, 'vit'));
  assert(B.media(medio, 'perso') >= 25 && B.media(medio, 'perso') <= 60, 'PF persi nei medi: ' + B.media(medio, 'perso'));
  assert(B.media(facile, 'perso') < B.media(medio, 'perso') && B.media(medio, 'perso') < B.media(difficile, 'perso'), 'la fatica cresce con la difficoltà');
  assert(B.media(medio, 'cas') <= 30, 'il bot casuale nei medi: ' + B.media(medio, 'cas')); }

// ---- 3. i capi: la squadra giusta (4 eroi del livello del capo) vince fra il 35% e il 70% (in media; con meno di 4 eroi i capi sono molto più duri: ci pensano i compagni, A8/A13) ----
{ const rs = []; for (const fam of FAM) { const capo = B.CAMPO(fam).capo; if (capo) rs.push(B.cella(fam, capo.liv, 4, 'capo', 10, 'bravo')); }
  assert.strictEqual(rs.length, 3); console.log('  capi: ' + rs.map((r) => `${r.fam} liv ${r.liv}: ${r.vit}% (${r.giri} giri, PF persi ${r.perso}%)`).join('; '));
  assert(B.media(rs, 'vit') >= 35 && B.media(rs, 'vit') <= 70, 'capi: ' + B.media(rs, 'vit')); assert(rs.every((r) => r.max <= 40 && r.vit >= 10 && r.vit <= 95), 'ogni capo resta una sfida: ' + JSON.stringify(rs.map((r) => r.vit))); }

console.log('ok');
