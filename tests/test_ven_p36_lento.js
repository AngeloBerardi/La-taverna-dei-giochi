// Passo 36, parte lenta: un anno (112 giorni) di bot su mondi nuovi (opz.geo=2), 6 semi, ogni partita in un processo suo. Si prova che:
//  - il capitano accorto di tests/bot_ven.js, con Condottiero, non va in rovina (uomini sotto 6 o partita finita);
//  - con «avara + duri» il capitano accorto guadagna almeno il 30% in meno che con Condottiero (somma sui 6 semi, patrimonio = monete + merci al prezzo base);
//  - il bot mercante (compra dove costa poco, vende dove costa molto, non combatte) non guadagna più del 50% del capitano accorto: niente rendita infinita;
//  - l'impronta a interruttori spenti è identica a `main` (`tools/avventura/impronta.js --controlla`).
// I semi sono i primi sei numeri (1-6), fissati prima di guardare i risultati e mai cambiati dopo: niente semi scelti perché «vanno bene».
// Aiuto al bot: il capitano accorto di bot_ven.js compra viveri solo per caso e patisce la fame anche senza economia nuova (lo nota anche test_ven_p17_lento.js); qui, come lì,
// in ogni mercato fa scorta per 14 giorni (`rifornisci`). È un difetto noto del bot, non del mondo: con `P36_SENZA_AIUTO=1` l'aiuto si spegne e si vede cosa succede.
// Il bot mercante sta qui: congeda gli uomini e viaggia da solo; ogni volta che è in un mercato vende tutto, tiene i viveri per dieci giorni, compra la merce che più rende nel mercato noto più conveniente
// (entro 60 celle) fino a che il margine dura, e ci va. Negli incontri paga o fugge. `P36_SEMI` e `P36_GIORNI` cambiano semi e durata.
const assert = require('assert'), path = require('path'), os = require('os');
const { execFile } = require('child_process');
const PROVA = path.join(__dirname, '..');
const SEMI = process.env.P36_SEMI ? process.env.P36_SEMI.split(',').map(Number) : [1, 2, 3, 4, 5, 6], GIORNI = +process.env.P36_GIORNI || 112;

if (process.argv[2] === '--lavora') {
  const carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
  const gioca = require('./bot_ven.js')(VEN, VDAT);
  const seme = +process.argv[3], tipo = process.argv[4];   // tipo: giusta | avara | mercante
  const opz = Object.assign({ geo: 2 }, VDAT.PRESET.condottiero, tipo === 'avara' ? { eco: 'avara', cons: 'duri' } : {});
  const s = VEN.nuovo(seme, { opz }), tu = VEN.TU(s);
  // patrimonio: monete, merci al prezzo base, truppe al costo d'ingaggio (il capitano accorto spende in uomini quel che guadagna)
  const patrimonio = () => tu.oro + Object.keys(tu.merci).reduce((a, m) => a + tu.merci[m] * VDAT.MERCI[m].base, 0) + tu.tr.reduce((a, e) => a + e.n * VDAT.INGAGGIO[VDAT.TR[e.t].t], 0);
  let oro0 = patrimonio();
  // il prezzo del grano nella prima città, ogni sette giorni (per la tabella della PR)
  const citta = s.l.find(l => l.tipo === 'citta'), grano = [];
  VEN.aggancia('giorno', st => { if (st === s && VEN.giorno(s) % 7 === 1) grano.push(VEN.prezzo(s, citta, 'grano', 1)); });
  if (process.env.P36_TRACCIA) VEN.aggancia('giorno', st => { if (st === s && VEN.giorno(s) % 7 === 0) console.error('g' + VEN.giorno(s), 'oro', tu.oro, 'uomini', VEN.uomini(tu), 'merci', JSON.stringify(tu.merci), 'dentro', s.dentro); });
  // Il bot di bot_ven.js compra viveri solo quando capita e patisce la fame anche senza economia nuova (lo nota anche test_ven_p17_lento.js): qui lo si aiuta come lì,
  // per tutti i tipi di partita. In ogni mercato fa scorta per 14 giorni con i cibi più economici, ma solo se resta più di 400 monete.
  let scorta = false;
  const rifornisci = st => {
    if (st !== s || scorta || st.prigioniero || st.dentro < 0) return; const l = st.l[st.dentro]; if (!l || !VEN.MERCATO[l.tipo]) return;
    scorta = true; try { const serve = Math.ceil(VEN.uomini(tu) / 6) * 14; let g = 0;
      while (g++ < 300 && VEN.razioni(tu) < serve && tu.oro > 400) { const m = ['grano', 'pesce', 'carne'].sort((a, b) => VEN.prezzo(st, l, a, 1) - VEN.prezzo(st, l, b, 1)).find(m => (l.scorte[m] || 0) > 0); if (!m || VEN.fai(st, { a: 'compra', m, n: 1 }).err) break; } } finally { scorta = false; }
  };
  if (!process.env.P36_SENZA_AIUTO) { VEN.aggancia('fatto', (st, z) => { if (z.a === 'compra' || z.a === 'vendi') rifornisci(st); }); VEN.aggancia('giorno', rifornisci); }
  let minimo = 1e9; VEN.aggancia('giorno', st => { if (st === s) minimo = Math.min(minimo, VEN.uomini(VEN.TU(s))); });

  function mercante(giorni) {
    // il mercante viaggia solo: congeda gli uomini (niente paghe e viveri da sfamare) e parte con le monete che ha
    for (const e of tu.tr.slice()) VEN.fai(s, { a: 'congeda', t: e.t, n: e.n }); oro0 = patrimonio();
    const fine = s.t + giorni * 1440, amico = l => l.noto !== false && !VEN.SITO[l.tipo] && VEN.MERCATO[l.tipo] && (l.faz === 'tu' || !VEN.nemiche(s, 'tu', l.faz));
    let guardia = 0, errori = 0;
    while (s.t < fine && guardia++ < 400000) {
      if (s.rac && s.rac.scena) { const v = VEN.voce(s), x = VEN.parla(s, v.continua ? { t: 'continua' } : { t: 'scegli', i: v.scelte.find(c => c.ok).i }); if (x.err) throw new Error('voce: ' + x.err); continue; }
      if (s.incontro) { const i = s.incontro; let x = (i.tipo === 'parla' || i.tipo === 'mischia') ? VEN.scegli(s, 'lascia') : VEN.scegli(s, 'paga'); if (x && x.err && i.tipo !== 'parla' && i.tipo !== 'mischia') x = VEN.scegli(s, 'fuggi'); if (x && x.err) x = VEN.auto(s); if (x && x.err && ++errori > 50) throw new Error('incontro: ' + x.err); continue; }
      if (s.prigioniero || (tu.ord && tu.ord.t === 'aspetta')) { VEN.passo(s, 60); continue; }
      if (s.davanti >= 0 && s.dentro < 0) { VEN.fai(s, { a: 'esci' }); continue; }
      if (s.dentro >= 0) {
        const l = s.l[s.dentro];
        if (VEN.MERCATO[l.tipo]) {
          const fai = z => VEN.fai(s, z);
          for (const m of Object.keys(tu.merci)) { if (VDAT.MERCI[m].cibo) continue; fai({ a: 'vendi', m, n: tu.merci[m] }); }
          const giorniCibo = 6, serve = Math.ceil(VEN.uomini(tu) / 6) * giorniCibo;
          for (let k = 0; k < 40 && VEN.razioni(tu) < serve && tu.oro > 60; k++) { const m = ['grano', 'pesce', 'carne'].sort((a, b) => VEN.prezzo(s, l, a, 1) - VEN.prezzo(s, l, b, 1)).find(m => (l.scorte[m] || 0) > 0); if (!m || fai({ a: 'compra', m, n: 1 }).err) break; }
          // la migliore coppia (merce, mercato di arrivo, quantità): il guadagno si conta pezzo per pezzo, con i prezzi che si muovono mentre si compra e si vende
          const mete = s.l.filter(x => x.id !== l.id && amico(x) && VEN.dist(x, l) <= 60 && x.noto);
          let mig = null;
          for (const d of mete) for (const m of Object.keys(VDAT.MERCI)) {
            const max = Math.min(l.scorte[m] || 0, VEN.caricoMax(s) - VEN.carico(tu), 30); if (max < 1) continue; let cp = 0, vd = 0;
            const cl = { ...l, scorte: { ...l.scorte } }, dl = { ...d, scorte: { ...d.scorte } };
            for (let n = 1; n <= max; n++) { cp += VEN.prezzo(s, cl, m, 1); cl.scorte[m]--; vd += VEN.prezzo(s, dl, m, -1); dl.scorte[m] = (dl.scorte[m] || 0) + 1; if (cp > tu.oro - 60) break; const gu = vd - cp; if (gu > (mig ? mig.gu : 0) && gu > cp * .12) mig = { d, m, n, gu }; }
          }
          if (mig) { let n = 0; for (; n < mig.n; n++) if (fai({ a: 'compra', m: mig.m, n: 1 }).err) break; fai({ a: 'esci' }); VEN.ordina(s, { t: 'entra', lid: mig.d.id }); continue; }
          // niente da guadagnare: si cerca un altro mercato
          const d = mete.sort((a, b) => VEN.dist(a, l) - VEN.dist(b, l))[Math.floor((VEN.giorno(s) * 7 + l.id) % Math.max(1, Math.min(4, mete.length)))];
          fai({ a: 'esci' }); if (d) VEN.ordina(s, { t: 'entra', lid: d.id }); else VEN.ordina(s, { t: 'aspetta', ore: 6 }); continue;
        }
        VEN.fai(s, { a: 'esci' }); continue;
      }
      if (!tu.ord) { const d = s.l.filter(amico).sort((a, b) => VEN.dist(a, tu) - VEN.dist(b, tu))[0]; const x = d ? VEN.ordina(s, { t: 'entra', lid: d.id }) : null; if (!x || x.err) VEN.ordina(s, { t: 'aspetta', ore: 3 }); }
      VEN.passo(s, 30);
    }
  }
  if (tipo === 'mercante') mercante(GIORNI); else gioca(s, GIORNI, true, carica.rng(seme + 1));
  const M = VEN.mappaDi(s), fuori = s.p.filter(p => p.dentro < 0 && !VEN.passa(M, p.x, p.y) && !(p.id === 0 && s.dentro >= 0)).length;
  const guasti = s.l.filter(l => l.scorte && Object.keys(l.scorte).some(m => !Number.isInteger(l.scorte[m]) || l.scorte[m] < 0 || l.scorte[m] > VDAT.ECO.TETTO)).length;
  console.log(JSON.stringify({ seme, tipo, fuori, guasti, ok: Number.isFinite(tu.oro) && tu.oro >= 0, oro0, oro: tu.oro, guadagno: Math.round(patrimonio() - oro0), uomini: VEN.uomini(tu), minimo, over: s.over ? (s.over.tipo || s.over.t || JSON.stringify(s.over)) : null, grano }));
  process.exit(0);
}

const lavora = (seme, tipo) => new Promise((ok, ko) => execFile(process.execPath, [__filename, '--lavora', String(seme), tipo], { encoding: 'utf8', maxBuffer: 1 << 26, env: Object.assign({}, process.env, { P36_GIORNI: String(GIORNI) }) }, (e, out, err) => e ? ko(new Error(tipo + ' ' + seme + ': ' + (err || e.message))) : ok(JSON.parse(out.trim().split('\n').pop()))));
const impronta = () => new Promise((ok, ko) => execFile(process.execPath, [path.join(PROVA, 'tools', 'avventura', 'impronta.js'), '--controlla'], { encoding: 'utf8', maxBuffer: 1 << 26 }, (e, out, err) => e ? ko(new Error('impronta: ' + out + err)) : ok(out.trim().split('\n').pop())));
(async () => {
  const lavori = []; for (const tipo of ['giusta', 'avara', 'mercante']) for (const seme of SEMI) lavori.push([seme, tipo]);
  const esiti = [], n = Math.max(1, Math.min(lavori.length, os.cpus().length - 1)), imp = impronta();
  await Promise.all(Array.from({ length: n }, async () => { while (lavori.length) { const [seme, tipo] = lavori.shift(); esiti.push(await lavora(seme, tipo)); } }));
  esiti.sort((a, b) => (a.tipo < b.tipo ? -1 : a.tipo > b.tipo ? 1 : a.seme - b.seme));
  for (const e of esiti) console.log(e.tipo.padEnd(9), 'seme', String(e.seme).padStart(2), 'uomini', String(e.uomini).padStart(3), '(minimo', String(e.minimo).padStart(3) + ')', 'oro', String(e.oro).padStart(6), 'guadagno', String(e.guadagno).padStart(6), e.over ? 'FINE ' + e.over : '');
  for (const e of esiti) assert(e.ok && e.fuori === 0 && e.guasti === 0, 'stato guasto: ' + JSON.stringify(Object.assign({}, e, { grano: undefined })));
  const di = tipo => esiti.filter(e => e.tipo === tipo), somma = tipo => di(tipo).reduce((a, e) => a + e.guadagno, 0);
  const rovina = di('giusta').filter(e => e.uomini < 6 || e.over).length;
  assert.strictEqual(rovina, 0, 'Condottiero: nessun seme in rovina, ma ' + rovina + ' sì');
  assert(somma('giusta') > 0, 'il capitano accorto guadagna: ' + somma('giusta'));
  assert(somma('avara') <= .7 * somma('giusta'), 'con «avara + duri» si guadagna almeno il 30% in meno: ' + somma('avara') + ' contro ' + somma('giusta'));
  assert(somma('mercante') <= .5 * somma('giusta'), 'il mercante non guadagna più del 50% del combattente: ' + somma('mercante') + ' contro ' + somma('giusta'));
  const g = di('giusta').find(e => e.seme === SEMI[0]).grano;
  console.log('Prezzo del grano nella prima città, seme ' + SEMI[0] + ', ogni sette giorni: ' + g.join(' '));
  console.log(await imp);
  console.log('Guadagno sui ' + SEMI.length + ' semi: accorto ' + somma('giusta') + ', avara+duri ' + somma('avara') + ', mercante ' + somma('mercante') + '. Prove del passo 36 verdi.');
})().catch(e => { console.error(e); process.exit(1); });
