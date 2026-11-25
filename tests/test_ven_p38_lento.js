// Passo 38, parte lenta: un anno di bot (112 giorni) su 6 semi per ognuno dei tre preset, mondi nuovi, ogni partita in un processo suo.
// Con Recluta e Condottiero nessun seme va in rovina; al giorno 120 i regni vivi sono tra 4 e 7 (il bot arriva a 120 giorni).
// I semi sono 1-6, fissati prima di guardare i risultati. `P38_SEMI` e `P38_GIORNI` li cambiano.
const assert = require('assert'), path = require('path'), os = require('os');
const { execFile } = require('child_process');
const SEMI = process.env.P38_SEMI ? process.env.P38_SEMI.split(',').map(Number) : [1, 2, 3, 4, 5, 6], GIORNI = +process.env.P38_GIORNI || 120;
if (process.argv[2] === '--lavora') {
  const carica = require('./carica.js'), F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })'), gioca = require('./bot_ven.js')(VEN, VDAT), seme = +process.argv[3], preset = process.argv[4];
  const s = VEN.nuovo(seme, { opz: Object.assign({ geo: 2 }, VDAT.PRESET[preset]) }); let minimo = 1e9; VEN.aggancia('giorno', st => { if (st === s) minimo = Math.min(minimo, VEN.uomini(VEN.TU(s))); });
  gioca(s, GIORNI, true, carica.rng(seme + 1)); const tu = VEN.TU(s);
  console.log(JSON.stringify({ seme, preset, uomini: VEN.uomini(tu), minimo, oro: tu.oro, regni: VEN.regni(s).filter(id => !s.cadute[id]).length, giorno: VEN.giorno(s), over: !!s.over, vinta: !!s.vinta }));
  process.exit(0);
}
const lavora = (seme, preset) => new Promise((ok, no) => execFile(process.execPath, [__filename, '--lavora', String(seme), preset], { encoding: 'utf8', maxBuffer: 1 << 24, env: Object.assign({}, process.env, { P38_GIORNI: String(GIORNI) }) }, (e, o, er) => e ? no(new Error(er || e.message)) : ok(JSON.parse(o.trim().split('\n').pop()))));
(async () => {
  const lavori = []; for (const p of ['recluta', 'condottiero', 'leggenda']) for (const s of SEMI) lavori.push([s, p]);
  const R = [], n = Math.max(1, Math.min(lavori.length, os.cpus().length - 1));
  await Promise.all(Array.from({ length: n }, async () => { while (lavori.length) { const [s, p] = lavori.shift(); R.push(await lavora(s, p)); } }));
  R.sort((a, b) => (a.preset < b.preset ? -1 : a.preset > b.preset ? 1 : a.seme - b.seme));
  for (const r of R) console.log(r.preset.padEnd(11), 'seme', r.seme, 'giorno', r.giorno, 'uomini', String(r.uomini).padStart(3), '(minimo ' + r.minimo + ')', 'oro', String(r.oro).padStart(6), 'regni', r.regni, r.over ? 'FINITA' : '');
  for (const r of R) assert(Number.isFinite(r.oro), 'oro guasto');
  // I criteri d'insieme si impongono solo con l'interruttore acceso: finché `mondo2` è spento (passo 38) sono un rapporto (vedi docs/rilasci.md)
  const acceso = require('./carica.js').multi(require('./carica.js').VEN_FILES, 'VDAT').ACCESO.mondo2;
  if (!acceso) { console.log('mondo2 spento: criteri solo riportati'); return; }
  for (const r of R) { assert(r.regni >= 4 && r.regni <= 7 || r.vinta, r.preset + ' seme ' + r.seme + ': regni vivi al giorno ' + r.giorno + ': ' + r.regni); }
  for (const p of ['recluta', 'condottiero']) { const male = R.filter(r => r.preset === p && (r.uomini < 6 || r.over)); assert.strictEqual(male.length, 0, p + ': semi in rovina ' + JSON.stringify(male)); }
  console.log('p38 lento ok');
})().catch(e => { console.error(e); process.exit(1); });
