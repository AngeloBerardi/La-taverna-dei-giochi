// Compagnia di ventura, regno (V4), prova lunga: il capitano accorto con l'opzione {regno:true} fonda un regno in almeno 2 semi su 6 in 90 giorni
// (prende il castello più debole, lo assedia, entra e fonda); il capitano a caso, che non fonda mai, non ha mai un regno. A ogni seme: nessuna eccezione,
// il regno è coerente (sede tua, guerre solo con regni vivi, malcontento tra 0 e 100) e il mondo è ripetibile.
// (Test lento: ~1-2 minuti, escluso da `npm run verifica`; si lancia con `npm test -- ven_regno_bot`.)
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_SENZA_VOCI;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const gioca = require('./bot_ven.js')(V, D);
const coerente = (s, seme) => {
  if (!s.corona) return;
  const c = s.corona; assert(c.nome && c.nome.length <= 24 && c.stend >= 0 && c.stend < 8 && c.malc >= 0 && c.malc <= 100, 'seme ' + seme + ': corona ' + JSON.stringify(c));
  assert(s.l[c.sede].faz === 'tu' || s.l.some(l => l.faz === 'tu' && V.MURA[l.tipo]), 'seme ' + seme + ': un regno senza fortezze');
  for (const k of Object.keys(s.guerra)) if (k.includes('tu')) { const f = k.split('|').find(x => x !== 'tu'); assert(D.REGNI.includes(f) && !s.cadute[f] || s.guerra[k], 'seme ' + seme + ': guerra con ' + f); }
  for (const k of Object.keys(s.alleanza)) assert(!(s.alleanza[k] && s.guerra[k]), 'seme ' + seme + ': guerra e alleanza insieme ' + k);
  for (const sg of s.sig) if (sg.faz === 'tu') { assert(sg.cult, 'seme ' + seme + ': signore tuo senza cultura'); const p = V.part(s, sg.pid); assert(!p || p.faz === 'tu', 'seme ' + seme + ': signore e compagnia su bandiere diverse'); }
};
let fondati = 0, durati = 0;
for (const seme of [3, 11, 29, 41, 57, 73]) {
  const s = V.nuovo(seme), s2 = V.nuovo(seme);
  gioca(s, 90, true, carica.rng(seme * 13 + 5), { regno: true }); gioca(s2, 90, true, carica.rng(seme * 13 + 5), { regno: true });
  assert.strictEqual(V.salva(s), V.salva(s2), 'seme ' + seme + ': non è ripetibile');
  coerente(s, seme);
  // `corona` è assente se non si è mai fondato, `null` se il regno è poi caduto (il log tiene solo gli ultimi eventi)
  if (s.corona) { fondati++; durati++; } else if (s.corona === null) fondati++;
}
assert(fondati >= 2, 'il bot accorto fonda in almeno 2 semi su 6: ' + fondati);
for (const seme of [3, 11, 29]) {
  const s = V.nuovo(seme); gioca(s, 90, false, carica.rng(seme * 7 + 1));
  assert(!s.corona, 'seme ' + seme + ': il capitano a caso non fonda mai');
  assert(!s.log.some(l => /^Fondi il regno/.test(l.tx)));
}
console.log('ven_regno_bot ok: fondato in ' + fondati + '/6 semi (' + durati + ' con la corona ancora in testa dopo 90 giorni)');
