// Passo 17: le stagioni (motore). Senza `s.anno` il gioco è identico; con `s.anno` (mondi nuovi) l'anno gira e cambia viveri, marcia, prezzi, reclute, guerre,
// passi, laghi, svernare e la scheda della battaglia. La prova lunga (due anni di bot) è in test_ven_p17_lento.js.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const nuovoCtx = (files = F) => carica.multi(files, '({ VEN, VDAT })');
const { VEN: V, VDAT: D } = nuovoCtx();
const GG = 28, ANNO = 112;
const al = (s, g) => { s.t = (g - 1) * 1440 + 600; return s; };               // il giorno g (1 = primo giorno), alle dieci
const inSt = (s, k, g = 1) => al(s, s.anno + ['prim', 'est', 'aut', 'inv'].indexOf(k) * GG + g);
const mondo = (seme, opz) => V.nuovo(seme, { opz: Object.assign({ geo: 2 }, opz) });
const eq = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);   // gli oggetti nascono in un altro contesto: si confrontano come JSON
const piede = Object.keys(D.TR).find(t => D.TR[t].c === 'f'), cavallo = Object.keys(D.TR).find(t => D.TR[t].c === 'c');

// senza `s.anno` non cambia nulla: un mondo vecchio non ha calendario e i moltiplicatori valgono 1 (l'impronta identica a `main` la prova la parte lenta, con `tools/avventura/impronta.js`)
{
  const a = V.nuovo(3);
  assert.strictEqual(a.anno, undefined, 'un mondo vecchio non ha calendario'); assert.strictEqual(V.stagione(a), null);
  for (const k of ['viveri', 'marcia', 'prezzo', 'reclute', 'guerra']) assert.strictEqual(V.molt(a, k, { p: V.TU(a), i: 5, m: 'grano' }), 1, k);
  const c = mondo(3); delete c.anno; assert.strictEqual(V.stagione(c), null); for (const k of ['viveri', 'prezzo', 'reclute', 'guerra']) assert.strictEqual(V.molt(c, k, { p: V.TU(c), i: 5, m: 'grano' }), 1, 'geo=2 senza `anno`: ' + k);
  const tu = V.TU(c); tu.tr = [{ t: piede, n: 20, f: 0, xp: 0 }, { t: cavallo, n: 10, f: 0, xp: 0 }]; tu.merci = { grano: 50 }; c.dentro = -1; c.tregua = 1e9; V.giornoNuovo(c); assert.strictEqual(tu.merci.grano, 45, 'senza calendario il nucleo da solo: 30 uomini, 5 razioni');
}

// calendario: quattro stagioni da 28 giorni, si parte a inizio primavera; i mondi nuovi hanno `anno`, i vecchi no
{
  const s = mondo(3); assert.strictEqual(s.geo, 2); assert.strictEqual(s.anno, 0);
  eq(V.stagione(s), { k: 'prim', g: 1, anno: 1 });
  const k = g => { const x = V.stagione(al(s, g)); return x.k + x.g + '/' + x.anno; };
  assert.strictEqual(k(28), 'prim28/1'); assert.strictEqual(k(29), 'est1/1'); assert.strictEqual(k(57), 'aut1/1'); assert.strictEqual(k(85), 'inv1/1'); assert.strictEqual(k(112), 'inv28/1'); assert.strictEqual(k(113), 'prim1/2'); assert.strictEqual(k(225), 'prim1/3');
  // `anno` = il giorno d'inizio del calendario
  const t = mondo(3); t.anno = 10; assert.strictEqual(V.stagione(al(t, 11)).k, 'prim'); assert.strictEqual(V.stagione(al(t, 11 + 28)).k, 'est'); assert.strictEqual(V.stagione(al(t, 5)).k, 'prim');
  // salvataggio: `anno` resta
  assert.strictEqual(V.apri(V.salva(s)).anno, 0); assert.strictEqual(V.mappaDi(s).G, 192);
}

// consumo: 10 uomini a piedi in inverno mangiano 1,5 volte più che in estate; la leva `stag` attenua o accresce lo scarto
{
  const s = mondo(3), p = { tr: [{ t: piede, n: 10 }] };
  assert.strictEqual(V.molt(inSt(s, 'est'), 'viveri', { p }), 1); assert.strictEqual(V.molt(inSt(s, 'inv'), 'viveri', { p }), 1.5);
  assert.strictEqual(V.molt(inSt(s, 'aut'), 'viveri', { p }), .9); assert.strictEqual(V.molt(inSt(s, 'prim'), 'viveri', { p }), 1);
  const miti = mondo(3, { stag: 'miti' }), rig = mondo(3, { stag: 'rigide' });
  assert.strictEqual(V.molt(inSt(miti, 'inv'), 'viveri', { p }), 1.25); assert.strictEqual(V.molt(inSt(rig, 'inv'), 'viveri', { p }), 1.75);
  // i cavalieri: gli uomini mangiano la loro razione (viveri), il cavallo il suo foraggio, a parte. 10 su 10 a cavallo: gli uomini valgono metà razione
  const pc = { tr: [{ t: cavallo, n: 10 }] };
  assert.strictEqual(V.molt(inSt(s, 'inv'), 'viveri', { p: pc }), .75); assert.strictEqual(V.molt(inSt(s, 'prim'), 'viveri', { p: pc }), .5);
  assert.strictEqual(V.molt(inSt(s, 'inv'), 'viveri', { p: { tr: [{ t: piede, n: 5 }, { t: cavallo, n: 5 }] } }), 1.5 * .75, 'metà a cavallo');
  // il consumo vero di un giorno: 60 uomini, 10 razioni in estate, 15 in inverno
  const razioni = k => { const t = mondo(3); inSt(t, k, 3); const tu = V.TU(t); tu.tr = [{ t: piede, n: 60, f: 0, xp: 0 }]; tu.merci = { grano: 100 }; t.dentro = -1; V.giornoNuovo(t); return 100 - tu.merci.grano; };
  assert.strictEqual(razioni('est'), 10); assert.strictEqual(razioni('inv'), 15); assert.strictEqual(razioni('aut'), 9);
  // 60 cavalieri: uomini (metà razione, molt dei viveri) più foraggio a parte (suo moltiplicatore)
  const razioniC = (k, opz, grano = 100) => { const t = mondo(3, opz); inSt(t, k, 3); const tu = V.TU(t); tu.tr = [{ t: cavallo, n: 60, f: 0, xp: 0 }]; tu.merci = { grano }; t.dentro = -1; tu.mor = 100; t.tregua = 1e9; V.giornoNuovo(t); return { usate: grano - (tu.merci.grano || 0), log: t.log.map(x => x.tx), mor: tu.mor }; };
  assert.strictEqual(razioniC('est').usate, 9); assert.strictEqual(razioniC('inv').usate, 16); assert.strictEqual(razioniC('aut').usate, 10);
  assert(razioniC('inv', { stag: 'miti' }).usate < 16 && razioniC('inv', { stag: 'rigide' }).usate > 16, 'la leva `stag` pesa anche sul foraggio');
  // senza scorta per i cavalli lo dice, e il morale scende
  const scarso = razioniC('inv', null, 8); assert.strictEqual(scarso.usate, 8); assert(scarso.log.some(x => /cavalli non hanno foraggio/.test(x)), 'lo dice: ' + scarso.log.join('|'));
  assert(!razioniC('inv').log.some(x => /foraggio/.test(x)), 'con la scorta non si lamenta nessuno');
}

// prezzo del grano, reclute e guerre per stagione
{
  const s = mondo(3), v = (k, c) => ['prim', 'est', 'aut', 'inv'].map(st => +V.molt(inSt(s, st), k, c).toFixed(3));
  eq(v('prezzo', { lid: 0, m: 'grano', compra: true }), [1.1, 1, .7, 1.4]); eq(v('prezzo', { lid: 0, m: 'spezie', compra: true }), [1, 1, 1, 1], 'solo il grano');
  eq(v('reclute', { lid: 0 }), [1.4, 1, 1, .6]); eq(v('guerra', { a: 'val', b: 'sel' }), [1.5, 1.2, .8, .3]);
  eq(v('marcia', { i: 0 }).length, 4);
  const r = mondo(3, { stag: 'rigide' }); assert.strictEqual(+V.molt(inSt(r, 'inv'), 'guerra', {}).toFixed(3), 0, 'il valore non scende sotto zero');
  // la stagione cambia davvero il prezzo di un mercato...
  const t = mondo(3), l = t.l.find(x => x.tipo === 'citta'); const pr = st => { inSt(t, st); return V.prezzo(t, l, 'grano', 1); };
  assert(pr('inv') > pr('prim') && pr('prim') > pr('est') && pr('est') > pr('aut'), 'grano: inverno > primavera > estate > autunno');
  // ...e le reclute vere che offre un villaggio: quante se ne possono ingaggiare dopo un giorno di quella stagione
  const reclute = (st, opz) => { const u = mondo(3, opz), v = u.l.find(x => x.tipo === 'villaggio'), tu = V.TU(u); inSt(u, st, 5); Object.assign(v, { rec: 50, rel: 0, sacc: 0 }); tu.oro = 1e6; tu.tr = [{ t: piede, n: 1, f: 0, xp: 0 }]; u.dentro = v.id; tu.x = v.x; tu.y = v.y; u.tregua = 1e9;
    V.giornoNuovo(u); let n = 0; for (let k = 0; k < 60 && !V.fai(u, { a: 'recluta', n: 1 }).err; k++) n++; return n; };
  const rp = reclute('prim'), re = reclute('est'), ri = reclute('inv'); assert(rp > re && re > ri, 'reclute: primavera ' + rp + ' > estate ' + re + ' > inverno ' + ri);
  assert.strictEqual(rp, 11); assert.strictEqual(re, 8); assert.strictEqual(ri, 4); assert(reclute('inv', { stag: 'miti' }) > ri && reclute('inv', { stag: 'rigide' }) < ri, 'la leva `stag` pesa sulle reclute');
}

// le guerre nuove dell'IA: più in primavera ed estate che in inverno (giorni fermi, solo il giro dei regni)
{
  const conta = { prim: 0, est: 0, aut: 0, inv: 0 };
  for (const seme of [3, 11, 29, 41]) {
    const s = mondo(seme); V.TU(s).tr = [{ t: piede, n: 1 }]; s.tregua = 1e9;
    const guerre = () => Object.keys(s.guerra).filter(k => s.guerra[k]);
    for (let g = 2; g <= 4 * ANNO; g++) {
      const prima = new Set(guerre()); al(s, g); V.giornoNuovo(s);
      const st = V.stagione(s).k; for (const k of guerre()) if (!prima.has(k)) conta[st]++;
    }
  }
  assert(conta.prim > conta.inv && conta.est > conta.inv, 'guerre per stagione: ' + JSON.stringify(conta));
  assert(conta.prim + conta.est > 2 * conta.inv, 'primavera ed estate pesano più del doppio: ' + JSON.stringify(conta));
}

// passi, neve e laghi gelati
{
  let passi = 0, porti = 0, ghiaccio = 0, neve = 0;
  for (const seme of [3, 29, 100]) {
    const s = mondo(seme), M0 = V.mappaDi(s), G = M0.G;
    inSt(s, 'prim'); const Mp = V.mappaDi(s); assert.strictEqual(Mp, M0, 'in primavera la mappa è quella del mondo');
    const ps = []; for (let i = 0; i < G * G; i++) if (M0.PS[i]) ps.push(i);
    assert(ps.length > 100);
    const chiusi = ps.filter(i => { inSt(s, 'inv'); return V.passoChiuso(s, i); });
    assert(chiusi.length > 20 && chiusi.length < ps.length, 'passi chiusi d\'inverno: alcuni, non tutti (' + chiusi.length + '/' + ps.length + ')');
    for (const i of chiusi) {
      const x = i % G + .5, y = Math.floor(i / G) + .5;
      inSt(s, 'inv'); const Mi = V.mappaDi(s); assert(!V.passa(Mi, x, y), 'passo chiuso: non si passa'); assert.strictEqual(V.molt(s, 'marcia', { i }), 0);
      assert(M0.ok[i] === 1 && V.passa(M0, x, y), 'la mappa base resta aperta');
      inSt(s, 'prim'); assert(V.passa(V.mappaDi(s), x, y) && V.molt(s, 'marcia', { i }) > 0 && !V.passoChiuso(s, i), 'in primavera il passo è aperto'); passi++;
      inSt(s, 'est'); assert(V.molt(s, 'marcia', { i }) > 0); inSt(s, 'aut'); assert(V.molt(s, 'marcia', { i }) > 0);
    }
    // ogni passo chiuso è nel nord o molto alto
    for (const i of chiusi) assert(M0.A[i] >= D.STAG.QUOTA_PASSI || Math.floor(i / G) / G < D.STAG.LAT_PASSI);
    // neve: la marcia sulla neve è ×0,5 invece di ×0,75; sulla terra senza neve ×0,75
    inSt(s, 'inv'); let nv = -1, no = -1;
    for (let i = 0; i < G * G && (nv < 0 || no < 0); i++) if (M0.T[i] !== 0 && !M0.PS[i]) { if (V.innevata(s, i)) { if (nv < 0) nv = i; } else if (no < 0) no = i; }
    // (il nucleo della geografia moltiplica già per la scala del mondo: si confronta con la primavera, dove la stagione vale 1)
    const rapporto = (i, st) => { inSt(s, st); const x = V.molt(s, 'marcia', { i }); inSt(s, 'prim'); return +(x / V.molt(s, 'marcia', { i })).toFixed(3); };
    assert(nv >= 0 && no >= 0); assert.strictEqual(rapporto(nv, 'inv'), .5); assert.strictEqual(rapporto(no, 'inv'), .75); neve++;
    inSt(s, 'est'); assert(!V.innevata(s, nv), "d'estate non c'è neve"); assert.strictEqual(rapporto(nv, 'est'), 1.05); assert.strictEqual(rapporto(nv, 'aut'), .95);
    // lago gelato: si cammina sul ghiaccio, a velocità di terra; il mare non gela; i porti su un lago gelato sono chiusi
    inSt(s, 'inv'); let gh = -1, mare = -1;
    for (let i = 0; i < G * G; i++) if (M0.T[i] === 0) { if (V.lagoGelato(s, i)) { if (gh < 0) gh = i; } else if (M0.LG[i] === 0 && mare < 0) mare = i; }
    if (gh >= 0) { assert(V.passa(V.mappaDi(s), gh % G + .5, Math.floor(gh / G) + .5), 'sul ghiaccio si passa'); 
      // la velocità vera sul ghiaccio è quella di una pianura vicina (senza strada, fiume, ponte, passo, neve): se cambia il costo dell'acqua nel nucleo, qui si vede
      const tu = V.TU(s), piana = i => M0.T[i] === 1 && !M0.S[i] && !M0.F[i] && !M0.PN[i] && !M0.PS[i] && !V.innevata(s, i); let q = -1;
      for (let r = 1; r < 60 && q < 0; r++) for (let dy = -r; dy <= r && q < 0; dy++) for (let dx = -r; dx <= r && q < 0; dx++) { const x = gh % G + dx, y = Math.floor(gh / G) + dy; if (x >= 0 && y >= 0 && x < G && y < G && piana(y * G + x)) q = y * G + x; }
      const vel = i => V.velocita(s, Object.assign({}, tu, { x: i % G + .5, y: Math.floor(i / G) + .5 })); assert(q >= 0); assert(Math.abs(vel(gh) / vel(q) - 1) < 1e-9, 'sul ghiaccio si va come sulla pianura vicina: ' + vel(gh) + ' contro ' + vel(q)); ghiaccio++; inSt(s, 'prim'); assert(!V.lagoGelato(s, gh) && !V.passa(V.mappaDi(s), gh % G + .5, Math.floor(gh / G) + .5)); }
    inSt(s, 'inv'); assert(!V.lagoGelato(s, mare) && !V.passa(V.mappaDi(s), mare % G + .5, Math.floor(mare / G) + .5), 'il mare non gela');
    const gelo = s.l.filter(l => V.portoChiuso(s, l)); porti += gelo.length;
    for (const l of gelo) { inSt(s, 'prim'); assert(!V.portoChiuso(s, l), 'in primavera il porto riapre'); inSt(s, 'inv'); }
    if (gelo.length) {
      const l = gelo[0], altro = s.l.find(x => x.tipo === 'porto' && x !== l && !V.nemiche(s, 'tu', x.faz)) || s.l.find(x => x.tipo === 'porto' && x !== l);
      s.dentro = l.id; V.TU(s).x = l.x; V.TU(s).y = l.y; V.TU(s).oro = 9999;
      const r = V.fai(s, { a: 'imbarca', lid: altro.id }); assert(r.err && /gelato/.test(r.err), 'le navi sono ferme: ' + JSON.stringify(r).slice(0, 80));
    }
  }
  assert(passi > 60 && neve === 3 && ghiaccio >= 1 && porti >= 1, 'passi ' + passi + ', neve ' + neve + ', ghiaccio ' + ghiaccio + ', porti chiusi ' + porti);
}

// una compagnia sul passo che si chiude, o sul ghiaccio che si scioglie, è rimandata sulla terra
{
  const s = mondo(3), M0 = V.mappaDi(s), G = M0.G; let i = 0; inSt(s, 'inv');
  for (; i < G * G; i++) if (V.passoChiuso(s, i)) break;
  const tu = V.TU(s); inSt(s, 'aut', 28); tu.x = i % G + .5; tu.y = Math.floor(i / G) + .5; tu.via = []; s.dentro = -1;
  assert(V.passa(V.mappaDi(s), tu.x, tu.y)); al(s, s.anno + 3 * GG + 1); V.giornoNuovo(s);
  assert(V.passa(V.mappaDi(s), tu.x, tu.y), 'la compagnia è stata rimandata su una cella percorribile'); assert(Math.abs(tu.x - (i % G + .5)) + Math.abs(tu.y - (Math.floor(i / G) + .5)) > 0);
  assert(s.log.some(x => /passo/.test(x.tx)), 'lo dice');
  // ghiaccio che cede a primavera
  const t = mondo(3); inSt(t, 'inv', 5); let gh = -1; for (let k = 0; k < G * G; k++) if (V.lagoGelato(t, k)) { gh = k; break; }
  const tt = V.TU(t); tt.x = gh % G + .5; tt.y = Math.floor(gh / G) + .5; tt.via = []; t.dentro = -1; assert(V.passa(V.mappaDi(t), tt.x, tt.y)); al(t, t.anno + ANNO + 1); V.giornoNuovo(t);
  assert(V.passa(V.mappaDi(t), tt.x, tt.y), 'rimandata a riva');
  // le vie d'inverno evitano il passo chiuso (e passano sul ghiaccio): nessuna tappa cade su una cella chiusa
  const u = mondo(3), c0 = u.l.filter(l => l.tipo === 'citta'); inSt(u, 'inv'); const Mi = V.mappaDi(u);
  for (let a = 1; a < c0.length; a++) { const v = V.via(Mi, c0[0].x, c0[0].y, c0[a].x, c0[a].y); for (const [x, y] of v) assert(V.passa(Mi, x, y)); }
}

// il mondo: l'avviso, il tempo, il morale all'aperto, svernare
{
  const s = mondo(3), tu = V.TU(s); s.tregua = 1e9; V.ordina(s, { t: 'ferma' });
  // avviso tre giorni prima dell'inverno
  const avvisi = g => { const t = mondo(3); inSt(t, 'aut', g); t.log = []; V.giornoNuovo(t); return t.log.some(x => /L'inverno è alle porte/.test(x.tx)); };
  assert(avvisi(25) && !avvisi(24) && !avvisi(26) && !avvisi(3));
  // il tempo: estate sempre sereno; inverno mai pioggia; primavera piogge
  const tempi = st => { const t = mondo(3), n = {}; for (let g = 1; g <= 20; g++) { inSt(t, st, g); V.giornoNuovo(t); n[t.meteo] = (n[t.meteo] || 0) + 1; } return n; };
  eq(Object.keys(tempi('est')), ['sereno']); assert(!tempi('inv').pioggia && tempi('prim').pioggia > 3 && tempi('aut').nebbia > 3);
  // morale: d'inverno all'aperto -2 al giorno in più; al chiuso no
  const mor = (st, dentro) => { const t = mondo(3), u = V.TU(t); inSt(t, st, 5); t.dentro = dentro ? t.l.find(l => l.tipo === 'citta' && l.faz === 'tu' || l.tipo === 'citta').id : -1; u.mor = 80; u.merci = { grano: 50 }; u.tr = [{ t: piede, n: 6 }]; V.giornoNuovo(t); return u.mor; };
  const aperto = mor('inv', false), chiuso = mor('inv', true); assert.strictEqual(chiuso - aperto, 2, 'dentro una città il morale non scende');
  // svernare: riposare in città d'inverno costa un giorno di paga, d'estate no
  const riposo = st => { const t = mondo(3), u = V.TU(t), l = t.l.find(l => l.tipo === 'citta'); inSt(t, st, 5); t.dentro = l.id; u.x = l.x; u.y = l.y; u.oro = 5000; u.tr = [{ t: piede, n: 20, f: 10 }, { t: 'val_f2', n: 10 }]; l.faz = 'tu'; const o0 = u.oro; const r = V.fai(t, { a: 'riposa' }); assert(!r.err, r.err); return { spesa: o0 - u.oro, paga: V.paga(t) }; };
  const ri = riposo('inv'), re = riposo('est'); assert.strictEqual(re.spesa, 0); assert(ri.spesa > 0 && ri.spesa === Math.min(5000, Math.ceil(ri.paga / 7)), 'una paga giornaliera: ' + JSON.stringify(ri));
  // svernare: i feriti guariscono il doppio. Il nucleo fa un tiro all'ora per ogni gruppo di feriti (6% senza medico); chi sverna ne fa un secondo, uguale.
  // Qui si lancia solo il gancio `ora` (il tiro del nucleo non c'è): si vede il tiro in più, e solo dentro una città d'inverno.
  const extra = (st, dentro) => { const t = mondo(3), u = V.TU(t); inSt(t, st, 5); t.dentro = dentro ? t.l.find(l => l.tipo === 'citta').id : -1; u.tr = Object.keys(D.TR).slice(0, 30).map(x => ({ t: x, n: 10, f: 10 })); const f0 = u.tr.reduce((a, e) => a + e.f, 0); for (let k = 0; k < 100; k++) { t.t += 60; V.ganci('ora', t); } return f0 - u.tr.reduce((a, e) => a + e.f, 0); };
  const inv = extra('inv', true), fuori = extra('inv', false), est = extra('est', true);
  assert(inv > 100 && inv < 260, 'in 100 ore 30 gruppi guariscono circa 180 volte: ' + inv); assert.strictEqual(fuori, 0, "all'aperto nessun tiro in più"); assert.strictEqual(est, 0, "d'estate nessun tiro in più");
}

// la scheda della battaglia: neve (cavalli più lenti) e caldo di mezzogiorno (più fatica); altrove non cambia
{
  const s = mondo(3), tu = V.TU(s), M0 = V.mappaDi(s), G = M0.G; inSt(s, 'inv'); let nv = -1, no = -1;
  for (let i = 0; i < G * G && (nv < 0 || no < 0); i++) if (M0.T[i] === 1 && !M0.PS[i]) { if (V.innevata(s, i)) { if (nv < 0) nv = i; } else if (no < 0) no = i; }
  const sch = () => { const sc = { tipo: 'campo', scena: { meteo: 'sereno', strada: false } }; V.chiedi('scheda', s, sc); return sc; };
  const metti = i => { tu.x = i % G + .5; tu.y = Math.floor(i / G) + .5; };
  metti(nv); let sc = sch(); assert.strictEqual(sc.scena.meteo, 'neve'); assert.strictEqual(sc.mod.a.c.vel, .85); assert.strictEqual(sc.mod.b.c.vel, .85); assert(!sc.mod.a.f && !sc.mod.a.t, 'solo i cavalli');
  metti(no); sc = sch(); assert.strictEqual(sc.scena.meteo, 'sereno'); assert(!sc.mod, 'senza neve la scheda non cambia');
  inSt(s, 'est'); s.t = (s.t - s.t % 1440) + 12 * 60; metti(nv); sc = sch(); assert.strictEqual(sc.scena.meteo, 'sereno');
  for (const l of ['a', 'b']) for (const c of ['f', 't', 'c', 'k']) assert.strictEqual(sc.mod[l][c].fa, 1.2, 'estate a mezzogiorno: fatica +20%');
  s.t = (s.t - s.t % 1440) + 7 * 60; sc = sch(); assert(!sc.mod, 'di mattina no'); inSt(s, 'prim'); assert(!sch().mod);
  // non si pesta ciò che altri hanno già messo
  inSt(s, 'est'); s.t = (s.t - s.t % 1440) + 13 * 60; const sc2 = { tipo: 'campo', scena: { meteo: 'sereno' }, mod: { a: { c: { vel: 1.1 } } } }; V.chiedi('scheda', s, sc2); assert.strictEqual(sc2.mod.a.c.vel, 1.1); assert.strictEqual(sc2.mod.a.c.fa, 1.2);
  // un mondo senza calendario non tocca la scheda
  const v = V.nuovo(3), sc3 = { tipo: 'campo', scena: { meteo: 'sereno' } }; v.t = 12 * 60; V.chiedi('scheda', v, sc3); assert(!sc3.mod);
}

// le partite vecchie si aprono: nessun calendario, nessun cambiamento
{
  const dir = path.join(__dirname, 'fixture/ven');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const s = V.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(s, f); assert.strictEqual(s.anno, undefined); assert.strictEqual(V.stagione(s), null);
    V.passo(s, 300); V.giornoNuovo(s); assert.strictEqual(s.anno, undefined, f); assert.strictEqual(V.stagione(s), null);
  }
}

// ripetibilità: due partite uguali dànno lo stesso mondo, anche a cavallo dell'inverno
{
  const gira = () => { const s = mondo(11); s.tregua = 1e9; inSt(s, 'aut', 20); const l = s.l.find(l => l.tipo === 'villaggio'); V.ordina(s, { t: 'entra', lid: l.id }); V.passo(s, 1440 * 12); return V.salva(s); };
  assert.strictEqual(gira(), gira());
}
console.log('Prove del passo 17 verdi.');
