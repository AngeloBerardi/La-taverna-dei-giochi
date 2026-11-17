// Passo 17, parte lenta: due anni (8 stagioni) di gioco col capitano accorto di tests/bot_ven.js su mondi nuovi (opz.geo=2), 6 semi.
// Ogni partita gira in un processo suo, tutte insieme (alcuni minuti). Si prova che:
//  - l'impronta a interruttori spenti è identica a `main` (`tools/avventura/impronta.js --controlla`);
//  - con Condottiero nessun seme va in rovina (uomini sotto 6 o partita finita) con le stagioni accese;
//  - la leva morde: con Leggenda e stagioni rigide i giorni di fame sono più che nella stessa partita senza calendario;
//  - a fine partita nessuna compagnia sta su una cella non percorribile (passi chiusi, ghiaccio sciolto), nessun numero è fuori posto.
// Il bot di bot_ven.js compra viveri solo quando è in un mercato, per sei giorni, e solo se la scorta locale basta: in viaggio o in una città senza scorte patisce la fame
// anche senza stagioni. Qui lo si aiuta (in tutte le partite, con e senza calendario): in ogni mercato fa scorta per `P17_SCORTA` giorni (14), con i cibi più
// economici. Non si tocca il bot condiviso. `P17_GIORNI` cambia la durata (224 = due anni).
const assert = require('assert'), path = require('path'), os = require('os');
const { execFile } = require('child_process');
const PROVA = path.join(__dirname, '..');
const SEMI = process.env.P17_SEMI ? process.env.P17_SEMI.split(',').map(Number) : [3, 5, 11, 29, 58, 77], GIORNI = +process.env.P17_GIORNI || 224, SCORTA = +process.env.P17_SCORTA || 14;   // un anno = 4 stagioni da 28 giorni

if (process.argv[2] === '--lavora') {
  const carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
  const gioca = require('./bot_ven.js')(VEN, VDAT);
  const seme = +process.argv[3], leggenda = process.argv[4] === 'leggenda', senza = process.argv[5] === 'senza';
  const opz = Object.assign({ geo: 2 }, leggenda ? VDAT.PRESET.leggenda : VDAT.PRESET.condottiero, leggenda ? { stag: 'rigide' } : {});
  const s = VEN.nuovo(seme, { opz }); if (senza) delete s.anno;   // il confronto: la stessa partita senza calendario
  let fame = 0, fameInv = 0, minimo = 1e9, scorta = false;
  // la scorta del bot: in un mercato compra cibo per SCORTA giorni (solo se resta oro per il resto)
  const rifornisci = st => {
    if (st !== s || scorta || st.prigioniero || st.dentro < 0) return; const l = st.l[st.dentro]; if (!l || !VEN.MERCATO[l.tipo]) return;
    scorta = true; try { const tu = VEN.TU(st), serve = Math.ceil(VEN.uomini(tu) / 6) * SCORTA; let g = 0;
      while (g++ < 300 && VEN.razioni(tu) < serve && tu.oro > 400) { const m = ['grano', 'pesce', 'carne'].sort((a, b) => VEN.prezzo(st, l, a, 1) - VEN.prezzo(st, l, b, 1)).find(m => (l.scorte[m] || 0) > 0); if (!m || VEN.fai(st, { a: 'compra', m, n: 1 }).err) break; } } finally { scorta = false; }
  };
  VEN.aggancia('fatto', (st, z) => { if (z.a === 'compra' || z.a === 'vendi') rifornisci(st); }); VEN.aggancia('giorno', rifornisci);
  const reagisci = VEN.reagisci; VEN.reagisci = (st, k, ...a) => { if (k === 'fame' && st === s) { fame++; if (Math.floor(((VEN.giorno(s) - 1) % (4 * VDAT.STAG.GIORNI)) / VDAT.STAG.GIORNI) === 3) fameInv++; } return reagisci(st, k, ...a); };   // l'inverno si conta dal calendario (112 giorni, 4 stagioni) anche nella partita senza
  VEN.aggancia('giorno', st => { if (st === s) minimo = Math.min(minimo, VEN.uomini(VEN.TU(s))); });
  gioca(s, GIORNI, true, carica.rng(seme + 1));
  const tu = VEN.TU(s), M = VEN.mappaDi(s);
  const fuori = s.p.filter(p => p.dentro < 0 && !VEN.passa(M, p.x, p.y) && !(p.id === 0 && s.dentro >= 0)).length, guasti = s.p.filter(p => p.tr.some(e => !(e.n > 0) || (e.f || 0) > e.n || e.f < 0)).length;
  console.log(JSON.stringify({ fuori, guasti, ok: Number.isFinite(tu.oro) && Number.isFinite(tu.mor) && tu.oro >= 0, seme, uomini: VEN.uomini(tu), oro: tu.oro, over: s.over ? (s.over.tipo || s.over.t || JSON.stringify(s.over)) : null, fame, fameInv, minimo, giorno: VEN.giorno(s), stat: s.stat, stag: VEN.stagione(s) }));
  process.exit(0);
}

const lavora = (seme, preset, senza) => new Promise((ok, ko) => execFile(process.execPath, [__filename, '--lavora', String(seme), preset, senza ? 'senza' : 'con'], { encoding: 'utf8', maxBuffer: 1 << 26 }, (e, out, err) => e ? ko(new Error(preset + ' ' + seme + ': ' + e.message + String(err))) : ok(JSON.parse(out.trim().split('\n').pop()))));
const impronta = () => new Promise((ok, ko) => execFile(process.execPath, [path.join(PROVA, 'tools', 'avventura', 'impronta.js'), '--controlla'], { encoding: 'utf8', maxBuffer: 1 << 26 }, (e, out, err) => e ? ko(new Error('impronta: ' + out + err)) : ok(out.trim().split(/\r?\n/).pop())));
(async () => {
  const lavori = [];
  for (const [preset, senza] of [['condottiero', false], ['condottiero', true], ['leggenda', false], ['leggenda', true]]) for (const seme of SEMI) lavori.push([seme, preset, senza]);
  const esiti = [], n = Math.max(1, Math.min(lavori.length, os.cpus().length - 1)), imp = impronta();
  await Promise.all(Array.from({ length: n }, async () => { while (lavori.length) { const [seme, preset, senza] = lavori.shift(); esiti.push(Object.assign({ preset, senza }, await lavora(seme, preset, senza))); } }));
  esiti.sort((a, b) => (a.senza - b.senza) || (a.preset < b.preset ? -1 : a.preset > b.preset ? 1 : a.seme - b.seme));
  for (const e of esiti) console.log(e.senza ? 'senza stagioni' : 'con stagioni  ', e.preset.padEnd(12), 'seme', String(e.seme).padStart(2), 'uomini', String(e.uomini).padStart(3), '(minimo', String(e.minimo).padStart(3) + ')', 'oro', String(e.oro).padStart(6), 'giorni di fame', String(e.fame).padStart(3), '(inverno ' + e.fameInv + ')', e.over ? 'FINE ' + e.over : '');
  for (const e of esiti) assert(e.ok && e.fuori === 0 && e.guasti === 0, 'stato guasto: ' + JSON.stringify(e));
  const rovina = (preset, senza) => esiti.filter(e => e.preset === preset && e.senza === senza && (e.uomini < 6 || e.over)).length;
  assert.strictEqual(rovina('condottiero', false), 0, 'Condottiero con le stagioni: nessun seme in rovina, ma ' + rovina('condottiero', false) + ' sì (senza calendario ' + rovina('condottiero', true) + ')');
  // la fame d'inverno (la stessa finestra di calendario, anche nella partita senza): con le stagioni rigide deve pesare più che senza
  const fame = senza => esiti.filter(e => e.preset === 'leggenda' && e.senza === senza).reduce((a, e) => a + e.fameInv, 0);
  assert(fame(false) > fame(true), 'La leva morde: Leggenda con stagioni rigide ' + fame(false) + ' giorni di fame d\'inverno, senza calendario ' + fame(true));
  console.log(await imp);
  console.log('Condottiero in rovina: ' + rovina('condottiero', false) + ' con le stagioni, ' + rovina('condottiero', true) + ' senza. Leggenda: giorni di fame d\'inverno ' + fame(false) + ' con le stagioni rigide, ' + fame(true) + ' senza. Prove del passo 17 (lente) verdi.');
})().catch(e => { console.error(e); process.exit(1); });
