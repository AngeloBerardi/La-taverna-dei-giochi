// Passo 23, parte lenta: 30 giorni di gioco col capitano accorto di tests/bot_ven.js sui mondi nuovi a molti regni (gli stessi semi di test_ven_p23.js):
// nessun errore, nessuna truppa fuori da VDAT.TR (nessun id col regno, tipo `r3_f1`), botteghe piene, salvataggio leggibile.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })');
const gioca = require('./bot_ven.js')(V, D);
const SEMI = [['ampio', [3, 5, 11, 29, 58, 77]], ['vasto', [2, 7, 13, 40]]];
for (const [mondo, semi] of SEMI) for (const seme of semi) {
  const s = V.nuovo(seme, { opz: { geo: 2, mondo } }), dove = 'seme ' + seme + ' (' + mondo + ')', ids = V.regni(s);
  gioca(s, 30, true, carica.rng(seme + 1));
  assert(V.giorno(s) >= 30, 'il tempo non è passato, ' + dove);
  const truppe = s.p.flatMap(p => p.tr).concat(s.l.flatMap(l => l.g || []));
  for (const e of truppe) { assert(D.TR[e.t], 'truppa sconosciuta ' + e.t + ', ' + dove); assert(!/^r\d+_/.test(e.t), 'truppa col regno nel nome: ' + e.t + ', ' + dove); }
  for (const l of s.l) if (l.tipo === 'citta') assert(l.bott.length && l.bott.every(Boolean), 'bottega di ' + l.nome + ', ' + dove);
  for (const l of s.l) if (l.scorte) for (const m in l.scorte) assert(Number.isFinite(l.scorte[m]), 'scorte di ' + l.nome + ', ' + dove);
  for (const k of Object.keys(s.guerra)) for (const f of k.split('|')) assert(f === 'tu' || ids.includes(f), 'guerra con ' + f + ', ' + dove);
  JSON.parse(V.salva(s));
  console.log(dove + ': giorno ' + V.giorno(s) + ', guerre ' + Object.keys(s.guerra).length + ', uomini ' + V.uomini(V.TU(s)));
}
console.log('test_ven_p23_lento ok (6 semi ampi, 4 vasti, 30 giorni)');
