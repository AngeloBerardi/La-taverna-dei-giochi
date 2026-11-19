// Passo 32 (lento): a truppe pari l'imboscata alza le vittorie di almeno 15 punti; i pali dimezzano le cariche subite; la retroguardia conserva le truppe.
const assert = require('assert'), carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN, VDAT, VCAM } = carica.multi(F, '({ VEN, VDAT, VCAM })');
const K = x => JSON.parse(JSON.stringify(x));
VDAT.ACCESO.consiglio = true;
const base = VEN.nuovo(3); base.tregua = 1e9; base.dentro = -1; base.davanti = -1;
const M = VEN.mappaDi(base), cella = VEN._.cella;
const dove = t => { for (let y = 8; y < M.G - 8; y++) for (let x = 8; x < M.G - 8; x++) if (M.T[cella(M, x + .5, y + .5)] === t) return [x + .5, y + .5]; };
const TR = n => [{ t: 'val_f2', n }, { t: 'val_t2', n: Math.round(n / 3) }, { t: 'val_c3', n: Math.round(n / 4) }];
// un incontro in cui il signore ci viene addosso, a truppe pari; il suo rango è 0 (con uno schieramento accorto l'effetto si perde nel resto)
function incontro(terr, scelte, o) {
  o = o || {}; const s = K(base), tu = VEN.TU(s), pos = dove(terr); tu.x = pos[0]; tu.y = pos[1]; tu.merci = { grano: 40 }; tu.tr = TR(14);
  const sig = s.p.find(p => p.k === 'sig' && !s.sig[p.sig].re); sig.x = tu.x + .3; sig.y = tu.y; sig.tr = o.nemici || TR(14); sig.dentro = -1; sig.sc = 0; s.sig[sig.sig].esp = -12;
  VEN.capi(s)[0].ab.esplora = 3; s.incontro = { tipo: 'nemico', pid: [sig.id], all: [], da: 'loro' };
  for (const k of scelte || []) assert(VEN.scegli(s, k).s, k);
  return s;
}
const scheda = (s, seme) => Object.assign(VEN.campo(s), { seme: seme * 977 + 13 });

// 40 semi, truppe pari, in un bosco: tendere l'imboscata alza le vittorie di almeno 15 punti
{
  let senza = 0, con = 0;
  for (let i = 1; i <= 40; i++) {
    if (VCAM.risolvi(scheda(incontro(2), i)).vince === 'a') senza++;
    if (VCAM.risolvi(scheda(incontro(2, ['strat:imboscata']), i)).vince === 'a') con++;
  }
  assert((con - senza) / 40 >= .15, 'vittorie senza ' + senza + '/40, con imboscata ' + con + '/40');
}

// i pali dimezzano le cariche ricevute (in pianura, contro cavalleria pesante)
{
  const cariche = scelte => {
    let c = 0;
    for (let i = 1; i <= 20; i++) {
      const sc = scheda(incontro(1, scelte, { nemici: [{ t: 'val_c3', n: 14 }] }), i), s = VCAM.nuovo(sc, { autoA: true }), lato = {};
      for (const u of s.u) lato[u.id] = u.l;
      while (!s.fine) for (const e of VCAM.passo(s, 1)) if (e.t === 'colpo' && e.carica && lato[e.a] === 'a') c++;
    }
    return c;
  };
  const senza = cariche([]), con = cariche(['strat:fortifica']);
  assert(senza > 40, 'senza pali ci sono cariche: ' + senza); assert(con <= senza * .55, 'con i pali ' + con + ' contro ' + senza);
}

// la battaglia della retroguardia conserva le truppe: nessuno si aggiunge, chi non resta è intatto, il nemico perde al più un terzo
{
  for (let seme = 1; seme <= 6; seme++) for (const [mio, loro] of [[20, 30], [3, 60], [10, 10]]) {
    const s = incontro(1, [], { nemici: [{ t: 'val_f2', n: loro }, { t: 'val_t2', n: Math.round(loro / 2) }] }); s.t += seme * 7; s.rng = (s.rng + seme * 101) | 0;
    const tu = VEN.TU(s); tu.tr = [{ t: 'val_f2', n: mio }, { t: 'val_t2', n: 5 }]; const nem = s.p.find(p => p.id === s.incontro.pid[0]);
    const prima = { mio: VEN.uomini(tu), loro: nem.tr.reduce((a, e) => a + e.n, 0) };
    const r = VEN.scegli(s, 'strat:retro:val_f2'); assert(r.s && s.incontro === null, 'si scappa');
    const dopo = { mio: VEN.uomini(tu), loro: nem.tr.reduce((a, e) => a + e.n, 0) };
    assert(dopo.mio <= prima.mio && dopo.mio >= prima.mio - mio, 'nessuno si aggiunge');
    assert(dopo.loro <= prima.loro && dopo.loro >= prima.loro - Math.round(prima.loro / 3) - 2, 'il nemico perde al più un terzo');
    assert.strictEqual(tu.tr.find(e => e.t === 'val_t2').n, 5, 'chi non è nella retroguardia è intatto');
  }
}
console.log('p32 lento ok');
