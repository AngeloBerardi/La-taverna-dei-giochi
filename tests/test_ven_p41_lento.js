// Passo 41, parte lenta: 120 giorni di bot in mondi nuovi (opz.geo=2), semi 5, 11, 29, ogni partita in un processo suo, con e senza costruzione.
// Il capitano accorto di tests/bot_ven.js, al giorno 1, giura a un regno e riceve un villaggio in feudo (l.sig=-2); `costruisce` lo fa costruire: con oro > costo + 400 prima il mulino,
// poi la palizzata, poi di nuovo il mulino, ecc. Il bot gira per il mondo e raramente è nel villaggio: per questo la prova apre il cantiere «da dentro» (porta `s.dentro` sul villaggio
// il tempo della mossa e la rimette com'era). Si prova che:
//  - con la costruzione si finiscono almeno 2 livelli (razzie e conquiste ne tolgono poi qualcuno: per questo si contano i cantieri finiti), e lo stato resta sano (monete e uomini finiti, edifici entro 3 livelli, un cantiere al più per luogo);
//  - i giorni di paga mancata non sono più di quelli del bot che non costruisce, +1;
//  - l'impronta a interruttori spenti è identica a `main` (`tools/avventura/impronta.js --controlla`).
// `P41_SEMI` e `P41_GIORNI` cambiano semi e durata.
const assert = require('assert'), path = require('path'), os = require('os');
const { execFile } = require('child_process');
const PROVA = path.join(__dirname, '..');
const SEMI = process.env.P41_SEMI ? process.env.P41_SEMI.split(',').map(Number) : [5, 11, 29], GIORNI = +process.env.P41_GIORNI || 120;

if (process.argv[2] === '--lavora') {
  const carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
  const gioca = require('./bot_ven.js')(VEN, VDAT);
  const seme = +process.argv[3], costruisce = process.argv[4] === 'costruisce';
  const s = VEN.nuovo(seme, { opz: Object.assign({ geo: 2 }, VDAT.PRESET.condottiero) }), tu = VEN.TU(s), P = VEN.P;
  // giorno 1: la compagnia entra nella città del primo regno, giura e riceve un villaggio
  const re = VEN.regni(s)[0], citta = s.l.find(l => l.faz === re && l.tipo === 'citta');
  tu.x = citta.x; tu.y = citta.y; s.dentro = citta.id; s.fama = P.FAMA_VASSALLO; s.rel[re] = 20;
  const g = VEN.fai(s, { a: 'giura' }); if (g.err) throw new Error('giuramento: ' + g.err);
  const feudo = s.l.find(l => l.sig === -2); if (!feudo) throw new Error('nessun feudo');
  VEN.fai(s, { a: 'esci' });
  let mancate = 0, livelli = 0, guasti = 0, finiti = 0; const ORDINE = ['mulino', 'palizzata'];
  VEN.aggancia('giorno', st => {
    if (st !== s) return;
    if (s.ev.some(e => e.t === 'log' && /Non hai di che pagare/.test(e.tx))) mancate++;
    finiti += s.ev.filter(e => e.t === 'log' && /finit[oae] \(livello \d\)/.test(e.tx)).length;
    if (costruisce && !feudo.cant && VEN.mioLuogo(s, feudo)) {
      const id = [ORDINE[livelli % 2], ORDINE[(livelli + 1) % 2]].find(x => (feudo.edif && feudo.edif[x] || 0) < 3);
      const n = (feudo.edif && feudo.edif[id]) || 0;
      if (id && tu.oro > VDAT.EDIFICI[id].costo[n] + 400) { const d = s.dentro; s.dentro = feudo.id; const r = VEN.fai(s, { a: 'costruisci', id }); s.dentro = d; if (r.s) livelli++; }
    }
    for (const l of s.l) { if (l.edif) for (const k of Object.keys(l.edif)) if (!(l.edif[k] >= 1 && l.edif[k] <= 3)) guasti++; }
  });
  if (process.env.P41_TRACCIA) {
    VEN.aggancia('luogo', (st, l, ev) => { if (st === s && l === feudo) console.error('g' + VEN.giorno(s), 'luogo', ev, JSON.stringify(l.edif), JSON.stringify(l.cant)); });
    VEN.aggancia('giorno', st => { if (st === s && VEN.giorno(s) % 7 === 2) console.error('g' + VEN.giorno(s), 'oro', tu.oro, 'uomini', VEN.uomini(tu), 'paga', VEN.paga(s), 'rend', VEN.rendite(s), 'feudo', feudo.faz, feudo.sig, JSON.stringify(feudo.edif), JSON.stringify(feudo.cant), 'serv', JSON.stringify(s.servizio)); });
  }
  gioca(s, GIORNI, true, carica.rng(seme + 1));
  const fatti = s.l.reduce((a, l) => a + (l.edif ? Object.keys(l.edif).reduce((b, k) => b + l.edif[k], 0) : 0), 0);
  console.log(JSON.stringify({ seme, costruisce, mancate, avviati: livelli, finiti, fatti, guasti, ok: Number.isFinite(tu.oro) && tu.oro >= 0, uomini: VEN.uomini(tu), vassallo: !!(s.servizio && s.servizio.tipo === 'vas') }));
  process.exit(0);
}

const lavora = (seme, tipo) => new Promise((ok, ko) => execFile(process.execPath, [__filename, '--lavora', String(seme), tipo], { encoding: 'utf8', maxBuffer: 1 << 26, env: Object.assign({}, process.env, { P41_GIORNI: String(GIORNI) }) }, (e, out, err) => e ? ko(new Error(tipo + ' ' + seme + ': ' + err + out)) : ok(JSON.parse(out.trim().split('\n').pop()))));
const impronta = () => new Promise((ok, ko) => execFile(process.execPath, [path.join(PROVA, 'tools', 'avventura', 'impronta.js'), '--controlla'], { encoding: 'utf8', maxBuffer: 1 << 26 }, (e, out, err) => e ? ko(new Error('impronta: ' + out + err)) : ok(out.trim().split('\n').pop())));
(async () => {
  const lavori = []; for (const tipo of ['senza', 'costruisce']) for (const seme of SEMI) lavori.push([seme, tipo]);
  const esiti = [], n = Math.max(1, Math.min(lavori.length, os.cpus().length - 1)), imp = impronta();
  await Promise.all(Array.from({ length: n }, async () => { while (lavori.length) { const [seme, tipo] = lavori.shift(); esiti.push(await lavora(seme, tipo)); } }));
  esiti.sort((a, b) => a.seme - b.seme || (a.costruisce ? 1 : -1));
  for (const e of esiti) console.log('seme', String(e.seme).padStart(2), e.costruisce ? 'costruisce' : 'senza     ', 'paghe mancate', e.mancate, 'cantieri avviati', e.avviati, 'livelli finiti', e.finiti, 'in piedi', e.fatti, 'uomini', e.uomini, e.vassallo ? '' : '(non più vassallo)');
  for (const e of esiti) assert(e.ok && e.guasti === 0, 'stato guasto: ' + JSON.stringify(e));
  for (const seme of SEMI) {
    const a = esiti.find(e => e.seme === seme && !e.costruisce), b = esiti.find(e => e.seme === seme && e.costruisce);
    assert(b.finiti >= 2, 'seme ' + seme + ': almeno 2 livelli costruiti, ma ' + b.finiti);
    if (a.uomini < 6) { console.log('seme', seme, ': senza costruire la compagnia si scioglie (' + a.uomini + ' uomini), il confronto delle paghe non vale'); continue; }
    assert(b.mancate <= a.mancate + 1, 'seme ' + seme + ': paghe mancate ' + b.mancate + ' contro ' + a.mancate + ' senza costruire');
  }
  console.log(await imp);
  console.log('Prove lente del passo 41 verdi.');
})().catch(e => { console.error(e); process.exit(1); });
