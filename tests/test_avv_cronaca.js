// Cronaca della battaglia (A5.1): ogni evento del motore ha una frase italiana e i suoi passi di animazione.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { AR, C, squadra } = require('./avv_aiuti.js');
const ACRO = require('../src/js/motori/27k-avv-cronaca.js');
const IA = require('../src/js/motori/27j-avv-ia.js');
const BE = require('../src/js/motori/27f-avv-bestiario.js');
const brutto = /undefined|NaN|\[object|null|\{|\}/;

// ---- 1. i tipi di evento: quelli scritti nel codice del motore sono tutti noti alla cronaca (e viceversa) ----
{ const trovati = new Set();
  for (const f of ['27d-avv-stati.js', '27e-avv-poteri.js', '27i-avv-scontro.js']) {
    const src = fs.readFileSync(path.join(__dirname, '../src/js/motori', f), 'utf8');
    for (const m of src.matchAll(/[({,]\s*t:'([a-z-]+)'/g)) trovati.add(m[1]); }
  // `t:` compare anche nelle azioni (muovi, attacca…) e nei passi interni: si tengono solo i tipi che il motore mette in `ev`
  const azioni = new Set(['attacca', 'potere', 'fuggi', 'ritira', 'pausa']);
  const mancanti = [...trovati].filter((t) => !ACRO.TIPI.includes(t) && !azioni.has(t));
  assert.deepStrictEqual(mancanti, [], 'tipi di evento senza frase: ' + mancanti.join(', '));
  // cade, muore, fuggito e arreso nascono da un'espressione (`t: lato === 'eroi' ? 'cade' : 'muore'`): si controlla che il nome compaia nel codice
  const indiretti = ['arreso', 'cade', 'fuggito', 'muore'], codice = fs.readFileSync(path.join(__dirname, '../src/js/motori/27i-avv-scontro.js'), 'utf8');
  for (const t of indiretti) assert(codice.includes(`'${t}'`), 'evento indiretto non più nel codice: ' + t);
  const inutili = ACRO.TIPI.filter((t) => !trovati.has(t) && !indiretti.includes(t)); assert.deepStrictEqual(inutili, [], 'tipi della cronaca che il motore non emette più: ' + inutili.join(', ')); }

// ---- 2. un campione scritto a mano per ogni tipo (compresi quelli rari che le simulazioni non producono) ----
const base = squadra(2, 3), nem = ['tagliagole', 'tagliagole', 'lupo-grigio'];
const s0 = C.nuovo(base, nem, AR.genera(5, 'strada'), { seme: 5 });
const [e1, e2] = s0.cb.filter((c) => c.lato === 'eroi'), [t1, t2, lupo] = s0.cb.filter((c) => c.lato === 'nemici');
const CAMPIONI = {
  aiuta: { t: 'aiuta', chi: e1.id, bers: e2.id }, arreso: { t: 'arreso', chi: t1.id }, arriva: { t: 'arriva', chi: t2.id, q: 3, r: 1 }, cade: { t: 'cade', chi: e2.id },
  conc: { t: 'conc', bers: e1.id, n: 1 }, 'conc-spesa': { t: 'conc-spesa', chi: e1.id, uso: 'ritira' }, cura: { t: 'cura', chi: e2.id, bers: e1.id, n: 5, rialzato: false },
  danno: { t: 'danno', chi: e1.id, bers: lupo.id, n: 9, perso: 9, tipo: 'taglio', esito: null, a0: false }, disimpegna: { t: 'disimpegna', chi: e1.id }, disimpegno: { t: 'disimpegno', chi: e1.id },
  dot: { t: 'dot', chi: t1.id, stato: 'in-fiamme', n: 3, perso: 3, tipo: 'fuoco', a0: false }, fine: { t: 'fine', esito: 'vittoria' },
  'fuga-gruppo': { t: 'fuga-gruppo', chi: e1.id, cd: 12, prove: [{ chi: e1.id, tiro: 14, tot: 15, ok: true }], ok: true }, fuggito: { t: 'fuggito', chi: lupo.id },
  furtivo: { t: 'furtivo', chi: e2.id, n: 6 }, giro: { t: 'giro', n: 2 }, movimento: { t: 'movimento', chi: e1.id, pm: 5, dado: 3 }, muore: { t: 'muore', chi: lupo.id },
  muovi: { t: 'muovi', chi: e1.id, passi: [{ q: 1, r: 8 }, { q: 1, r: 7 }], costo: 3 }, nasconditi: { t: 'nasconditi', chi: e2.id, ok: false, tiro: 4, cd: 12, tot: 9 },
  oggetto: { t: 'oggetto', chi: e1.id, id: 'pozione-di-cura', nome: 'Pozione di cura' }, opportunita: { t: 'opportunita', chi: t1.id, bers: e1.id },
  reazione: { t: 'reazione', chi: e2.id, potere: 'r-piccolo', bers: e2.id }, resiste: { t: 'resiste', bers: t1.id, stato: 'avvelenato' },
  rialza: { t: 'rialza', chi: e1.id, bers: e2.id, ok: true, tiro: 11, tot: 11, cd: 10, hp: 5 }, riduci: { t: 'riduci', bers: e1.id, n: 3 }, rimuovi: { t: 'rimuovi', bers: e1.id, stati: ['avvelenato'] },
  ritira: { t: 'ritira', bers: e1.id }, 'ritira-mov': { t: 'ritira-mov', chi: e1.id, pm: 4, dado: 2 }, salvezza: { t: 'salvezza', bers: e1.id, ab: 'des', tiro: 3, tot: 4, cont: 11, ok: false },
  scatto: { t: 'scatto', chi: e1.id, pm: 9 }, scivola: { t: 'scivola', chi: t1.id }, spingi: { t: 'spingi', chi: e1.id, bers: t1.id, ok: false, tiro: 5, tot: 8, cd: 12 },
  spinto: { t: 'spinto', chi: e1.id, bers: t1.id, passi: 2, da: { q: 1, r: 1 }, a: { q: 1, r: 3 } }, stato: { t: 'stato', bers: lupo.id, stato: 'stordito', ok: true, dur: 2 },
  superficie: { t: 'superficie', chi: e1.id, sup: 'fuoco', n: 3, a0: false, bers: e1.id }, temp: { t: 'temp', bers: e1.id, n: 8 }, tenace: { t: 'tenace', bers: e1.id },
  tiro: { t: 'tiro', chi: e1.id, bers: lupo.id, tiro: 14, tiri: [14, 6], tot: 19, cont: 13, ok: true, crit: false, vant: true, svant: false }, turno: { t: 'turno', chi: e1.id, giro: 1 } };
{ assert.deepStrictEqual(Object.keys(CAMPIONI).sort(), ACRO.TIPI.slice().sort(), 'un campione per ogni tipo');
  for (const [t, ev] of Object.entries(CAMPIONI)) {
    const r = ACRO.riga(ev, s0); assert(r.testo.length > 3 && !brutto.test(r.testo), `${t}: «${r.testo}»`); assert(/^[A-ZÈÀ0-9]/.test(r.testo), `${t}: maiuscola iniziale «${r.testo}»`);
    assert(['minore', 'normale', 'grave'].includes(r.peso)); const ef = ACRO.effetti(ev, s0); assert(Array.isArray(ef));
    for (const x of ef) { assert(x.t && x.ms >= 0, `${t}: passo ${JSON.stringify(x)}`); assert(x.chi == null || s0.cb.some((c) => c.id === x.chi), `${t}: chi sconosciuto ${x.chi}`); } }
  // frasi precise, perché qui si decide che cosa legge il giocatore
  assert.strictEqual(ACRO.frase(CAMPIONI.tiro, s0), 'Guerriero attacca Lupo grigio: 14 + 5 = 19 contro CA 13 (due dadi: 14 e 6, vantaggio). Colpito.');
  assert.strictEqual(ACRO.frase(CAMPIONI.danno, s0), 'Guerriero infligge 9 danni da taglio a Lupo grigio.');
  assert.strictEqual(ACRO.frase(CAMPIONI.muovi, s0), 'Guerriero si muove di 2 esagoni (costo 3).');
  assert.strictEqual(ACRO.frase({ t: 'fine', esito: 'fuga' }, s0), 'La compagnia è fuggita');
  assert.strictEqual(ACRO.frase({ t: 'spingi', bers: t1.id, n: 1 }, s0), '', 'il segnaposto della spinta del potere non scrive nulla');
  assert.strictEqual(ACRO.riga(CAMPIONI.fine, s0).lato, null); assert.strictEqual(ACRO.riga(CAMPIONI.danno, s0).lato, 'eroi'); assert.strictEqual(ACRO.riga(CAMPIONI.opportunita, s0).lato, 'nemici');
  assert.strictEqual(ACRO.peso(CAMPIONI.cade), 'grave'); assert.strictEqual(ACRO.peso(CAMPIONI.movimento), 'minore'); assert.strictEqual(ACRO.peso(CAMPIONI.tiro), 'normale'); }

// ---- 3. nomi: i mostri uguali si numerano, gli altri no ----
{ assert.strictEqual(ACRO.nome(s0, t1.id), 'Tagliagole 1'); assert.strictEqual(ACRO.nome(s0, t2.id), 'Tagliagole 2'); assert.strictEqual(ACRO.nome(s0, lupo.id), 'Lupo grigio');
  assert.strictEqual(ACRO.nome(s0, e1.id), e1.nome); assert.strictEqual(ACRO.nome(s0, 'sconosciuto#3'), 'sconosciuto'); assert.strictEqual(ACRO.nome(null, null), '?'); }

// ---- 4. battaglie vere: ogni evento ha frase, i passi sono coerenti con i PF e il totale resta breve ----
{ const visti = new Set(), famiglie = Object.keys(BE.FAMIGLIE), PF = (s) => Object.fromEntries(s.cb.map((c) => [c.id, c.hp])); let n = 0, eventi = 0, maxDurata = 0, scarti = 0, controlli = 0;
  for (let i = 0; i < 60; i++) {
    const fam = famiglie[i % famiglie.length], eroi = 1 + (i % 4), liv = 1 + (i % 6), inc = C.incontro(fam, liv, eroi, ['facile', 'medio', 'difficile', 'capo'][i % 4], 300 + i);
    let s = C.nuovo(squadra(eroi, liv), inc.nemici, AR.genera(400 + i, AR.AMBIENTI[i % AR.AMBIENTI.length]), { seme: 400 + i, reazioni: { eroi: 'auto', nemici: 'auto' } }); n++;
    for (let g = 0; g < 700 && !s.over; g++) {
      const a = IA.prossima(s, { livello: i % 5 === 0 ? 'casuale' : ['racconto', 'normale', 'eroica'][i % 3] }), prima = PF(s), r = C.act(s, a); if (r.err || r.pausa) break;
      const d = {}; let ms = 0;
      for (const ev of r.ev) { visti.add(ev.t); eventi++;
        const rg = ACRO.riga(ev, r.s); assert(ACRO.TIPI.includes(ev.t), 'tipo sconosciuto ' + ev.t);
        if (rg.testo === '') assert(ev.t === 'spingi' && ev.chi == null, 'frase vuota per ' + JSON.stringify(ev)); else assert(rg.testo.length > 3 && !brutto.test(rg.testo), `«${rg.testo}» da ${JSON.stringify(ev)}`);
        for (const x of ACRO.effetti(ev, r.s)) { ms += x.ms; assert(x.ms >= 0 && x.t); if (x.chi != null) assert(r.s.cb.some((c) => c.id === x.chi), 'chi sconosciuto: ' + JSON.stringify(x));
          if (x.t === 'hp') d[x.chi] = (d[x.chi] || 0) + x.d;
          if (x.t === 'sposta') for (const p of x.passi) assert(Number.isInteger(p.q) && Number.isInteger(p.r)); } }
      maxDurata = Math.max(maxDurata, ms);
      // le barre dei PF seguono i PF veri (salvo i PF temporanei e i casi in cui il motore cambia i PF senza evento: la vista, a fine azione, riallinea comunque)
      for (const c of r.s.cb) { const atteso = prima[c.id] + (d[c.id] || 0); controlli++; if (atteso !== c.hp) scarti++; }
      s = r.s; } }
  assert(n === 60 && eventi > 3500, 'battaglie ed eventi: ' + n + ' ' + eventi);
  assert(scarti / controlli < 0.002, `le barre dei PF si discostano in ${scarti} casi su ${controlli}`);
  assert(maxDurata <= 7000, 'un\'azione dura al massimo 7 s a velocità 1×: ' + maxDurata);
  for (const t of ['tiro', 'danno', 'muovi', 'stato', 'cura', 'cade', 'muore', 'salvezza', 'opportunita', 'fine']) assert(visti.has(t), 'le simulazioni non hanno prodotto ' + t);
  console.log(`  ${eventi} eventi in ${n} battaglie, ${visti.size} tipi diversi, azione più lunga ${maxDurata} ms, PF fuori sincronia ${scarti}/${controlli}`); }

console.log('ok');
