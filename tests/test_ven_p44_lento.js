// Passo 44, parte lenta: 60 giorni di bot (tests/bot_ven.js, risponde da sé alle scene) in mondi nuovi (geo=2), semi 3, 11, 29.
// Si prova che: da 14 a 30 scene del crocevia per seme (il bot accorto passa poche ore su incroci e luoghi selvaggi: soglia decisa dall'orchestratore, vedi il file del passo), nessuna ripetuta entro 30 giorni, nessuna a meno di 2 giorni dalla precedente, stato sano (monete, uomini, merci non negativi).
// `P44_SEMI` e `P44_GIORNI` cambiano semi e durata.
const assert = require('assert');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const SEMI = process.env.P44_SEMI ? process.env.P44_SEMI.split(',').map(Number) : [3, 11, 29], GIORNI = +process.env.P44_GIORNI || 60;
for (const seme of SEMI) {
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })'), gioca = require('./bot_ven.js')(VEN, VDAT);
  const s = VEN.nuovo(seme, { opz: { geo: 2 } }), viste = [];
  const accoda0 = VEN.accoda; VEN.accoda = (st, id, sig) => { const ok = accoda0(st, id, sig); if (ok && st === s && /^cro-/.test(id)) viste.push({ id, t: st.t, g: VEN.giorno(st) }); return ok; };
  let x = seme * 7919 + 1; const r = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  gioca(s, GIORNI, true, r);
  const ult = {}; let prec = null;
  for (const v of viste) {
    assert(!(ult[v.id] != null && v.g - ult[v.id] < VDAT.CROCEVIA.MEMORIA), seme + ': ' + v.id + ' ripetuta');
    assert(!prec || v.t - prec >= VDAT.CROCEVIA.OGNI * 1440, seme + ': due scene a meno di 2 giorni'); ult[v.id] = v.g; prec = v.t;
  }
  const tu = VEN.TU(s); assert(tu.oro >= 0 && VEN.uomini(tu) >= 0 && Object.values(tu.merci || {}).every(n => n >= 0), seme + ': stato sano');
  console.log('seme ' + seme + ': ' + viste.length + ' scene in ' + GIORNI + ' giorni');
  assert(viste.length >= 14 && viste.length <= 30, seme + ': scene viste ' + viste.length);
}
console.log('test_ven_p44_lento: ok');
