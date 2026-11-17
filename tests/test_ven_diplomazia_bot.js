// Compagnia di ventura, diplomazia (V3), prova lunga: 20 semi × 60 giorni di mondo che gira da solo (chi gioca aspetta e fa risolvere gli incontri).
// Gli alleati non si fanno mai guerra né si schierano uno contro l'altro; un'alleanza non dura meno di 20 giorni (salvo la caduta di un regno);
// i regni si alleano davvero; nessun regno supera il 60% dei luoghi dei regni più spesso di oggi (0 semi su 20, misurato prima di V3).
// Nota: il mondo lasciato a sé oggi conquista poco, quindi questa soglia da sola non prova il freno: la prova vera è in test_ven_diplomazia.js.
// (Test lento: ~2 minuti, escluso da `npm run verifica`; si lancia con `npm test -- ven_diplomazia_bot`.)
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_SENZA_VOCI;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const SOPRA_60_OGGI = 0;
let formate = 0, sciolte = 0, sopra = 0, semiConAlleanze = 0;
for (let i = 1; i <= 20; i++) {
  const s = V.nuovo(i * 7 + 1), nate = {}; let m = 0, ebbe = false;
  for (let h = 0; h < 60 * 24; h++) {
    if (s.incontro) { V.auto(s); continue; }
    V.passo(s, 60);
    for (const k of Object.keys(s.alleanza)) { const [x, y] = k.split('|'); if (!(k in nate)) { nate[k] = V.giorno(s); formate++; ebbe = true }
      assert(!V.inGuerra(s, x, y), 'seme ' + i + ': alleati in guerra ' + k);
      for (const sc of s.scontri) { const fa = sc.a.map(id => V.TU(s) && s.p.find(p => p.id === id)).filter(Boolean).map(p => p.faz), fb = sc.b.map(id => s.p.find(p => p.id === id)).filter(Boolean).map(p => p.faz); assert(!((fa.includes(x) && fb.includes(y)) || (fa.includes(y) && fb.includes(x))), 'seme ' + i + ': alleati schierati uno contro l\'altro ' + k) } }
    for (const k of Object.keys(nate)) if (!(k in s.alleanza)) { const [x, y] = k.split('|'); if (!s.cadute[x] && !s.cadute[y]) { assert(V.giorno(s) - nate[k] >= D.DIPL.MIN, 'seme ' + i + ': alleanza ' + k + ' durata ' + (V.giorno(s) - nate[k]) + ' giorni'); sciolte++ } delete nate[k]; }
    if (h % 24 === 0) { const c = {}; let t = 0; for (const l of s.l) if (D.REGNI.includes(l.faz)) { c[l.faz] = (c[l.faz] || 0) + 1; t++ } for (const k in c) m = Math.max(m, c[k] / t) } // quota sui luoghi dei regni (rovine, covi, locande non si conquistano)
  }
  if (m > .6) sopra++; if (ebbe) semiConAlleanze++;
}
assert(formate >= 10, 'i regni si alleano: ' + formate + ' alleanze in 20 semi'); assert(semiConAlleanze >= 8, 'alleanze in più semi: ' + semiConAlleanze + '/20');
assert(sopra <= SOPRA_60_OGGI, 'regni oltre il 60% dei luoghi: ' + sopra + '/20 semi (oggi ' + SOPRA_60_OGGI + ')');
console.log('ven_diplomazia_bot ok: ' + formate + ' alleanze in ' + semiConAlleanze + ' semi, ' + sciolte + ' sciolte, oltre il 60%: ' + sopra + '/20');
