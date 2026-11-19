// Passo 27, parte lenta: 300 giorni col capitano accorto di tests/bot_ven.js su 8 semi (6 mondi ampi, 2 vasti), ognuno in un processo suo.
// Regni vivi: 9-12 al giorno 0, 4-7 al giorno 120, 2-4 al giorno 300 con unificazione normale; con «lenta» e «rapida» la media ai giorni 120 e 180 si sposta nella direzione giusta (al 300 tutti toccano il fondo).
// Sempre: nessun regno vivo senza fortezze, nessun signore esule da più di 30 giorni, nulla attaccato a un regno morto, un giorno di gioco costa al massimo il 20% in più.
const assert = require('assert');
const { execFile } = require('child_process');

if (process.argv[2] === '--lavoro') {
  const [seme, mondo, unif] = [+process.argv[3], process.argv[4], process.argv[5]];
  const carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })');
  const gioca = require('./bot_ven.js')(V, D), MURA = { citta: 1, castello: 1 };
  const s = V.nuovo(seme, { opz: { geo: 2, mondo, unif } }), r = carica.rng(seme + 1);
  const vivi = () => V.regni(s).filter(id => !s.cadute[id]), n0 = s.l.filter(l => l.tipo === 'citta').length;
  const R = { seme, mondo, unif, vivi: { 0: vivi().length }, senzaCitta: 0, fusioni: {}, esuleMax: 0, costo: 0 };
  // ogni giorno: esuli da quanto tempo, regni vivi senza fortezze, bandiere di regni morti
  const esule = {}; let guasti = [];
  V.aggancia('giorno', s => {
    for (const g of s.sig) { const p = s.p.find(x => x.id === g.pid), e = p && g.faz === 'neu' && g.esule && !g.comp;
      if (e) { esule[g.id] = (esule[g.id] || 0) + 1; R.esuleMax = Math.max(R.esuleMax, esule[g.id]); } else delete esule[g.id]; }
    const morti = V.regni(s).filter(id => s.cadute[id]);
    for (const id of vivi()) { if (!s.l.some(l => MURA[l.tipo] && l.faz === id)) guasti.push('regno senza fortezze ' + id + ' al giorno ' + V.giorno(s)); if (!s.l.some(l => l.tipo === 'citta' && l.faz === id)) R.senzaCitta++; }
    for (const l of s.l) if (morti.includes(l.faz)) guasti.push(l.nome + ' di un regno morto al giorno ' + V.giorno(s));
    for (const p of s.p) if (morti.includes(p.faz)) guasti.push('compagnia ' + p.nome + ' di un regno morto al giorno ' + V.giorno(s));
    for (const k of Object.keys(s.guerra)) for (const f of k.split('|')) if (morti.includes(f)) guasti.push('guerra con ' + f + ' al giorno ' + V.giorno(s));
  });
  let tGioco = 0, giorni = 0;
  for (const g of [30, 60, 90, 120, 150, 180, 210, 240, 270, 300]) {
    const t0 = process.hrtime.bigint(); gioca(s, g - V.giorno(s) + 1, true, r); tGioco += Number(process.hrtime.bigint() - t0) / 1e6; giorni = V.giorno(s);
    if (g % 60 === 0 || g === 120 || g === 300) R.vivi[g] = vivi().length;
    // costo di una settimana di unificazione, su una copia che deve rifare il giro
    const c = JSON.parse(JSON.stringify(s)); c.unif = c.unif || { ult: 0, v: {}, mat: null }; c.unif.ult = -99;
    const t1 = process.hrtime.bigint(); for (let i = 0; i < 3; i++) { c.unif.ult = -99; V.unifica(c); } R.costo = Math.max(R.costo, Number(process.hrtime.bigint() - t1) / 1e6 / 3);
  }
  R.msGiorno = tGioco / Math.max(1, giorni); R.giorni = giorni; R.fusioni = Object.values(s.rg).filter(x => x.fuso).map(x => x.fuso.come).join(',');
  R.citta = s.l.filter(l => l.tipo === 'citta').length === n0; R.guasti = guasti.slice(0, 5); R.citteRegni = vivi().map(f => s.l.filter(l => l.tipo === 'citta' && l.faz === f).length);
  R.salvataggio = JSON.parse(V.salva(s)) ? true : false;
  // lo stato finale, per capire un regno che non si accorpa: città, cultura, forza, guerre e alleanze tra i vivi
  const vv = vivi(); R.stato = vv.map(f => f + ' c' + s.l.filter(l => l.tipo === 'citta' && l.faz === f).length + ' ' + V.cult(s, f) + ' F' + Math.round(V.forzaRegno(s, f))).join(' | ')
    + ' || guerre ' + Object.keys(s.guerra).filter(k => k.split('|').every(f => vv.includes(f))).join(' ') + ' || alleanze ' + Object.keys(s.alleanza).join(' ') + ' || ' + JSON.stringify(s.unif && s.unif.v);
  console.log(JSON.stringify(R));
} else {
  const lavoro = a => new Promise((ok, no) => execFile(process.execPath, [__filename, '--lavoro'].concat(a.map(String)), { maxBuffer: 1 << 22 }, (e, out, err) => e ? no(new Error(err || e.message)) : ok(JSON.parse(out.trim().split('\n').pop()))));
  const NORMALE = [[3, 'ampio'], [5, 'ampio'], [11, 'ampio'], [29, 'ampio'], [58, 'ampio'], [77, 'ampio'], [2, 'vasto'], [7, 'vasto']], VARIANTI = [[3, 'ampio'], [5, 'ampio'], [29, 'ampio'], [58, 'ampio']];
  const media = (L, g) => L.reduce((a, r) => a + r.vivi[g], 0) / L.length;
  (async () => {
    const tutti = await Promise.all(NORMALE.map(([s, m]) => lavoro([s, m, 'normale'])).concat(['lenta', 'rapida'].flatMap(u => VARIANTI.map(([s, m]) => lavoro([s, m, u])))));
    const normale = tutti.slice(0, NORMALE.length), lenta = tutti.slice(NORMALE.length, NORMALE.length + VARIANTI.length), rapida = tutti.slice(NORMALE.length + VARIANTI.length);
    console.log('seme mondo unif: regni vivi al giorno 0 / 60 / 120 / 180 / 240 / 300 (fusioni)');
    for (const r of tutti) {
      const dove = 'seme ' + r.seme + ' (' + r.mondo + ', ' + r.unif + ')';
      console.log(dove + ': ' + [0, 60, 120, 180, 240, 300].map(g => r.vivi[g]).join(' / ') + '  [' + r.fusioni + ']  città per regno ' + r.citteRegni.join(',') + '  costo settimana ' + r.costo.toFixed(1) + ' ms, giorno ' + r.msGiorno.toFixed(0) + ' ms');
      assert.deepStrictEqual(r.guasti, [], dove + ': ' + r.guasti.join('; '));
      assert(r.citta && r.salvataggio, dove + ': città perse o salvataggio illeggibile');
      assert.strictEqual(r.senzaCitta, 0, dove + ': ' + r.senzaCitta + ' giorni con un regno vivo senza città');
      assert(r.esuleMax <= 30, dove + ': un signore è rimasto esule ' + r.esuleMax + ' giorni');
      assert(r.costo / 7 <= 0.2 * r.msGiorno, dove + ': la settimana costa ' + r.costo.toFixed(1) + ' ms contro ' + r.msGiorno.toFixed(0) + ' ms di un giorno');
    }
    for (const r of normale) {
      const dove = 'seme ' + r.seme + ' (' + r.mondo + ')', n0 = r.mondo === 'vasto' ? [11, 12] : [9, 10];
      assert(r.vivi[0] >= n0[0] && r.vivi[0] <= n0[1], dove + ': ' + r.vivi[0] + ' regni al giorno 0');
      assert(r.vivi[120] >= 4 && r.vivi[120] <= 7, dove + ': ' + r.vivi[120] + ' regni al giorno 120 (attesi 4-7)');
      assert(r.vivi[300] >= 2 && r.vivi[300] <= 4, dove + ': ' + r.vivi[300] + ' regni al giorno 300 (attesi 2-4)');
    }
    const confronto = NORMALE.filter(([s]) => VARIANTI.some(([v]) => v === s)).map(([s]) => normale.find(r => r.seme === s));
    for (const g of [120, 180]) {
      const l = media(lenta, g), n = media(confronto, g), q = media(rapida, g);
      console.log('giorno ' + g + ': media regni vivi lenta ' + l + ', normale ' + n + ', rapida ' + q);
      assert(l > n && n > q, 'giorno ' + g + ': lenta ' + l + ', normale ' + n + ', rapida ' + q + ' (devono scendere)');
    }
    console.log('test_ven_p27_lento ok (8 semi normali, 4+4 con lenta e rapida, 300 giorni)');
  })().catch(e => { console.error(e.message); process.exit(1); });
}
