// Passo 33, parte lenta: il capitano accorto di tests/bot_ven.js, partito dalla sorte con la difficoltà Condottiero, regge 60 giorni in tutti i semi
// (mai fine partita, compagnia viva con almeno 5 uomini o 150 monete); il capitano sconsiderato, sugli stessi semi, fa peggio.
const assert = require('assert');
const { execFile } = require('child_process');

if (process.argv[2] === '--lavoro') {
  const seme = +process.argv[3], carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })'), gioca = require('./bot_ven.js')(V, D), out = { seme };
  for (const bravo of [true, false]) {
    const s = V.nuovo(seme, { opz: { geo: 2, mondo: 'ampio', diff: 'condottiero' } });
    gioca(s, 60, bravo, carica.rng(seme + 1));
    const tu = V.TU(s);
    out[bravo ? 'bravo' : 'cieco'] = { over: !!s.over, uomini: V.uomini(tu), oro: tu.oro, giorno: V.giorno(s), valore: V.uomini(tu) * 10 + tu.oro + s.fama * 5 };
  }
  console.log(JSON.stringify(out));
} else {
  const SEMI = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const lavoro = n => new Promise((ok, no) => execFile(process.execPath, [__filename, '--lavoro', String(n)], { maxBuffer: 1 << 22 }, (e, o, er) => e ? no(new Error(er || e.message)) : ok(JSON.parse(o.trim().split('\n').pop()))));
  (async () => {
    const R = await Promise.all(SEMI.map(lavoro));
    let meglio = 0;
    for (const r of R) {
      console.log('seme ' + r.seme + ': accorto ' + JSON.stringify(r.bravo) + ' | sconsiderato ' + JSON.stringify(r.cieco));
      assert(!r.bravo.over && r.bravo.giorno >= 60, 'seme ' + r.seme + ': partita finita prima dei 60 giorni');
      assert(r.bravo.uomini >= 5 || r.bravo.oro >= 150, 'seme ' + r.seme + ': la compagnia accorta non regge');
      if (r.bravo.valore >= r.cieco.valore) meglio++;
    }
    assert(meglio > SEMI.length / 2, 'il capitano accorto fa meglio dello sconsiderato solo in ' + meglio + ' semi su ' + SEMI.length);
    console.log('p33 lento ok (accorto meglio in ' + meglio + '/' + SEMI.length + ')');
  })().catch(e => { console.error(e.message); process.exit(1); });
}
