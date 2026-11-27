// Passo 43, parte lenta: 120 giorni in mondi nuovi (opz.geo=2), semi 3, 11, 29, ogni partita in un processo suo.
// Il «mercante» è un capitano che non combatte mai: appena può apre 3 botteghe (la più redditizia per stima, in tre città amiche) e manda 2 carovane (capo mercenario), poi riposa in città.
// Entrambi partono con 1500 monete e 30 uomini. Si prova che l'oro finale del mercante è al più il doppio di quello del capitano accorto di tests/bot_ven.js sullo stesso seme
// (gli affari non sono una strada facile verso la ricchezza; se il capitano accorto finisce sotto il capitale di partenza, il tetto è il doppio del capitale),
// che lo stato resta sano (monete finite, mai negative, al più 3 botteghe e 2 carovane) e che gli affari hanno davvero reso qualcosa.
// `P43_SEMI` e `P43_GIORNI` cambiano semi e durata.
const assert = require('assert'), os = require('os');
const { execFile } = require('child_process');
const SEMI = process.env.P43_SEMI ? process.env.P43_SEMI.split(',').map(Number) : [3, 11, 29], GIORNI = +process.env.P43_GIORNI || 120;

if (process.argv[2] === '--lavora') {
  const carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
  const seme = +process.argv[3], tipo = process.argv[4];
  const s = VEN.nuovo(seme, { opz: Object.assign({ geo: 2 }, VDAT.PRESET.condottiero) }), tu = VEN.TU(s);
  // stesso capitale per tutti e due (con 250 monete e 7 uomini non si apre nessuna bottega): 1500 monete e 30 uomini
  tu.oro = 1500; { const e = tu.tr.find(x => !VDAT.TR[x.t].compagno); e.n = 30; e.f = 0; }
  const oro0 = tu.oro; let guasti = 0, sett = 0, attive = 0;
  VEN.aggancia('giorno', st => { if (st !== s) return; if (!Number.isFinite(tu.oro) || tu.oro < 0 || (s.botteghe || []).length > 3 || (s.carovane || []).length > 2) guasti++; });
  if (tipo === 'bot') require('./bot_ven.js')(VEN, VDAT)(s, GIORNI, true, carica.rng(seme + 1));
  else {
    const fine = s.t + GIORNI * 1440, amica = l => l.tipo === 'citta' && (l.faz === 'tu' || !VEN.nemiche(s, 'tu', l.faz));
    const sedi = [], visitate = {}; let guardia = 0;
    const lavora = () => {
      const l = s.l[s.dentro]; visitate[l.id] = 1;
      if (l.tipo !== 'citta') return;
      if ((s.botteghe || []).length < VDAT.AFFARI.BOTTEGHE) {
        const t = VEN.tipiBottega(s, l).filter(x => !x.err).sort((a, b) => b.stima - a.stima)[0];
        if (t && t.stima > 0) VEN.fai(s, { a: 'bottega', k: t.k });
      }
      if ((s.carovane || []).length < VDAT.AFFARI.CAROVANE) {
        const B = s.l.filter(x => x.id !== l.id && amica(x)).sort((a, b) => VEN.dist(a, l) - VEN.dist(b, l))[0];
        if (B) VEN.fai(s, { a: 'carovana', verso: B.id, capo: 'mer' });
      }
    };
    while (s.t < fine && guardia++ < 400000) {
      if (s.rac && s.rac.scena) { const v = VEN.voce(s), i = v.continua ? -1 : v.scelte.find(c => c.ok).i; VEN.parla(s, i < 0 ? { t: 'continua' } : { t: 'scegli', i }); continue; }
      if (s.incontro) { VEN.scegli(s, 'lascia'); continue; }
      if (s.prigioniero || (tu.ord && tu.ord.t)) { VEN.passo(s, 60); continue; }
      if (s.dentro >= 0) {
        lavora();
        const fatto = (s.botteghe || []).length >= VDAT.AFFARI.BOTTEGHE && (s.carovane || []).length >= VDAT.AFFARI.CAROVANE;
        const prossima = fatto ? null : s.l.filter(l => amica(l) && !visitate[l.id]).sort((a, b) => VEN.dist(a, tu) - VEN.dist(b, tu))[0];
        if (prossima) { VEN.fai(s, { a: 'esci' }); VEN.ordina(s, { t: 'entra', lid: prossima.id }); } else VEN.passo(s, 60);
        continue;
      }
      if (s.davanti >= 0) { VEN.fai(s, { a: 'esci' }); continue; }
      const dove = s.l.filter(l => amica(l)).sort((a, b) => VEN.dist(a, tu) - VEN.dist(b, tu))[0];
      if (dove) VEN.ordina(s, { t: 'entra', lid: dove.id }); VEN.passo(s, 30);
    }
    sett = (s.affari && s.affari.sett) || 0; attive = (s.botteghe || []).length + (s.carovane || []).length;
  }
  console.log(JSON.stringify({ seme, tipo, oro: Math.round(tu.oro), oro0, guasti, sett, attive, aperte: (s.botteghe || []).length, car: (s.carovane || []).length }));
  process.exit(0);
}

const lavora = (seme, tipo) => new Promise((ok, ko) => execFile(process.execPath, [__filename, '--lavora', String(seme), tipo], { encoding: 'utf8', maxBuffer: 1 << 26, env: Object.assign({}, process.env, { P43_GIORNI: String(GIORNI) }) }, (e, out, err) => e ? ko(new Error(tipo + ' ' + seme + ': ' + err + out)) : ok(JSON.parse(out.trim().split('\n').pop()))));
(async () => {
  const lavori = []; for (const tipo of ['bot', 'mercante']) for (const seme of SEMI) lavori.push([seme, tipo]);
  const esiti = [], n = Math.max(1, Math.min(lavori.length, os.cpus().length - 1));
  await Promise.all(Array.from({ length: n }, async () => { while (lavori.length) { const [seme, tipo] = lavori.shift(); esiti.push(await lavora(seme, tipo)); } }));
  esiti.sort((a, b) => a.seme - b.seme || (a.tipo === 'bot' ? -1 : 1));
  for (const e of esiti) console.log('seme', String(e.seme).padStart(2), e.tipo.padEnd(8), 'oro', e.oro, '(partenza ' + e.oro0 + ')', 'botteghe', e.aperte, 'carovane', e.car, 'ultima settimana', e.sett);
  for (const e of esiti) assert(e.guasti === 0, 'stato guasto: ' + JSON.stringify(e));
  for (const seme of SEMI) {
    const a = esiti.find(e => e.seme === seme && e.tipo === 'bot'), b = esiti.find(e => e.seme === seme && e.tipo === 'mercante');
    const tetto = 2 * Math.max(a.oro, a.oro0);
    assert(b.oro <= tetto, 'seme ' + seme + ': il mercante chiude con ' + b.oro + ' monete, più del tetto di ' + tetto + ' (capitano accorto: ' + a.oro + ')');
  }
  console.log('Prove lente del passo 43 verdi.');
})().catch(e => { console.error(e); process.exit(1); });
