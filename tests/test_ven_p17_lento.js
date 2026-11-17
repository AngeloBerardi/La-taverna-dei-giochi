// Passo 17, parte lenta: un anno intero (4 stagioni) di gioco col capitano accorto di tests/bot_ven.js su mondi nuovi (opz.geo=2), 6 semi.
// Ogni partita gira in un processo suo, tutte insieme (alcuni minuti). Si prova che:
//  - con Condottiero le stagioni non mandano in rovina più semi di quanti ne perde la stessa partita senza calendario (più uno: il bot, anche senza stagioni,
//    nei mondi grandi patisce la fame e ogni tanto finisce male; un seme diverso cambia tutta la storia);
//  - con Leggenda e stagioni rigide almeno un seme su 6 soffre la fame;
//  - a fine partita nessuna compagnia sta su una cella non percorribile (passi chiusi, ghiaccio sciolto), nessun numero è fuori posto.
// `P17_GIORNI=224` gioca due anni (il doppio del tempo).
const assert = require('assert'), path = require('path'), os = require('os');
const { execFile } = require('child_process');
const SEMI = [3, 11, 29, 41, 58, 77], GIORNI = +process.env.P17_GIORNI || 112;   // un anno = 4 stagioni da 28 giorni

if (process.argv[2] === '--lavora') {
  const carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
  const gioca = require('./bot_ven.js')(VEN, VDAT);
  const seme = +process.argv[3], leggenda = process.argv[4] === 'leggenda', senza = process.argv[5] === 'senza';
  const opz = Object.assign({ geo: 2 }, leggenda ? VDAT.PRESET.leggenda : VDAT.PRESET.condottiero, leggenda ? { stag: 'rigide' } : {});
  const s = VEN.nuovo(seme, { opz }); if (senza) delete s.anno;   // il confronto: la stessa partita senza calendario
  let fame = 0, minimo = 1e9;
  const reagisci = VEN.reagisci; VEN.reagisci = (st, k, ...a) => { if (k === 'fame' && st === s) fame++; return reagisci(st, k, ...a); };
  VEN.aggancia('giorno', st => { if (st === s) minimo = Math.min(minimo, VEN.uomini(VEN.TU(s))); });
  gioca(s, GIORNI, true, carica.rng(seme + 1));
  const tu = VEN.TU(s), M = VEN.mappaDi(s);
  const fuori = s.p.filter(p => p.dentro < 0 && !VEN.passa(M, p.x, p.y) && !(p.id === 0 && s.dentro >= 0)).length, guasti = s.p.filter(p => p.tr.some(e => !(e.n > 0) || (e.f || 0) > e.n || e.f < 0)).length;
  console.log(JSON.stringify({ fuori, guasti, ok: Number.isFinite(tu.oro) && Number.isFinite(tu.mor) && tu.oro >= 0, seme, uomini: VEN.uomini(tu), oro: tu.oro, over: s.over ? (s.over.tipo || s.over.t || JSON.stringify(s.over)) : null, fame, minimo, giorno: VEN.giorno(s), stat: s.stat, stag: VEN.stagione(s) }));
  process.exit(0);
}

const lavora = (seme, preset, senza) => new Promise((ok, ko) => execFile(process.execPath, [__filename, '--lavora', String(seme), preset, senza ? 'senza' : 'con'], { encoding: 'utf8', maxBuffer: 1 << 26 }, (e, out, err) => e ? ko(new Error(preset + ' ' + seme + ': ' + e.message + String(err))) : ok(JSON.parse(out.trim().split('\n').pop()))));
(async () => {
  const lavori = [];
  for (const [preset, senza] of [['condottiero', false], ['condottiero', true], ['leggenda', false]]) for (const seme of SEMI) lavori.push([seme, preset, senza]);
  const esiti = [], n = Math.max(1, Math.min(lavori.length, os.cpus().length - 1));
  await Promise.all(Array.from({ length: n }, async () => { while (lavori.length) { const [seme, preset, senza] = lavori.shift(); esiti.push(Object.assign({ preset, senza }, await lavora(seme, preset, senza))); } }));
  esiti.sort((a, b) => (a.senza - b.senza) || (a.preset < b.preset ? -1 : a.preset > b.preset ? 1 : a.seme - b.seme));
  for (const e of esiti) console.log(e.senza ? 'senza stagioni' : 'con stagioni  ', e.preset.padEnd(12), 'seme', String(e.seme).padStart(2), 'uomini', String(e.uomini).padStart(3), '(minimo', String(e.minimo).padStart(3) + ')', 'oro', String(e.oro).padStart(6), 'giorni di fame', String(e.fame).padStart(3), e.over ? 'FINE ' + e.over : '');
  for (const e of esiti) assert(e.ok && e.fuori === 0 && e.guasti === 0, 'stato guasto: ' + JSON.stringify(e));
  const rovina = senza => esiti.filter(e => e.preset === 'condottiero' && e.senza === senza && (e.uomini < 6 || e.over)).length;
  assert(rovina(false) <= rovina(true) + 1, 'Condottiero: con le stagioni vanno in rovina ' + rovina(false) + ' semi, senza ' + rovina(true));
  const affamati = esiti.filter(e => e.preset === 'leggenda' && e.fame > 0).length;
  assert(affamati >= 1, 'Leggenda con stagioni rigide: nessun seme su ' + SEMI.length + ' soffre la fame');
  console.log('Condottiero in rovina: ' + rovina(false) + ' con le stagioni, ' + rovina(true) + ' senza. Leggenda con stagioni rigide: ' + affamati + ' semi su ' + SEMI.length + ' soffrono la fame. Prove del passo 17 (lente) verdi.');
})().catch(e => { console.error(e); process.exit(1); });
