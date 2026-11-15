// Bot della Compagnia di ventura: un capitano accorto (recluta, commercia, promuove, caccia solo chi può battere)
// e uno sconsiderato (ordini a caso, attacca chiunque). Usati da test_ven_mondo.js e da tools/avventura/ventura.js.
module.exports = function (VEN, VDAT) {
  const TU = s => VEN.TU(s);
  const forzaNemici = s => { const { nem, luogo } = VEN.schieramenti(s); return nem.reduce((a, p) => a + VEN.forza(p), 0) + (luogo ? VEN.forzaTr(luogo.g) * (VEN.MURA[luogo.tipo] ? VEN.P.MURA : 1) : 0); };
  function incontro(s, bravo, r) {
    const inc = s.incontro;
    if (inc.tipo === 'parla') return VEN.scegli(s, bravo ? 'lascia' : (r() < .5 ? 'aggredisci' : 'lascia'));
    if (inc.tipo === 'mischia') { if (bravo) return VEN.scegli(s, 'lascia'); VEN.scegli(s, r() < .5 ? 'a' : 'b'); return VEN.auto(s); }
    if (inc.tipo === 'assalto') return VEN.auto(s);
    if (!bravo) return VEN.auto(s);
    const mia = VEN.forza(TU(s)), loro = forzaNemici(s);
    if (mia >= loro * 1.15) return VEN.auto(s);
    const x = VEN.scegli(s, 'paga'); if (!x.err) return x;
    const y = VEN.scegli(s, 'fuggi'); if (!y.err) return y;
    return VEN.auto(s);
  }
  function luogo(s, bravo, r) {
    const l = s.l[s.dentro], tu = TU(s), fai = z => VEN.fai(s, z);
    if (!bravo) { // a caso
      const az = [{ a: 'recluta', n: 1 }, { a: 'compra', m: 'spezie', n: 1 }, { a: 'vendi', m: 'grano', n: 2 }, { a: 'incarico' }, { a: 'riposa' }, { a: 'compra', m: 'velluto', n: 1 }];
      for (let k = 0; k < 3; k++) fai(az[Math.floor(r() * az.length)]);
      return fai({ a: 'esci' });
    }
    fai({ a: 'consegna' }); fai({ a: 'riscatta' });
    while (s.cap.punti > 0) { const ab = s.cap.ab, k = ab.comando < 3 ? 'comando' : ab.addestra < 2 ? 'addestra' : ab.medicina < 2 ? 'medicina' : ab.prodezza < 3 ? 'prodezza' : 'comando'; if (fai({ a: 'abilita', k }).err) break; }
    for (const e of tu.tr.slice()) { const T = VDAT.TR[e.t]; if (!T.su.length) continue; const su = T.su[(e.n + s.t) % T.su.length]; let g = 0; while (g++ < 30 && !fai({ a: 'promuovi', t: e.t, su, n: 1 }).err); }
    if (VEN.MERCATO[l.tipo]) {
      // vende ciò che qui vale più del prezzo di riferimento, tiene i viveri
      for (const m of Object.keys(tu.merci)) { if (VDAT.MERCI[m].cibo) continue; let g = 0; while (g++ < 40 && (tu.merci[m] || 0) > 0 && VEN.prezzo(s, l, m, -1) >= VDAT.MERCI[m].base * .95) fai({ a: 'vendi', m, n: 1 }); }
      const serve = Math.ceil(VEN.uomini(tu) / 6) * 6; let g = 0;
      while (g++ < 60 && VEN.razioni(tu) < serve) { const m = ['grano', 'pesce', 'carne'].sort((a, b) => VEN.prezzo(s, l, a, 1) - VEN.prezzo(s, l, b, 1)).find(m => (l.scorte[m] || 0) > 0); if (!m || fai({ a: 'compra', m, n: 1 }).err) break; }
    }
    if (l.tipo === 'villaggio') { let g = 0; while (g++ < 12 && tu.oro > 120 && !fai({ a: 'recluta', n: 1 }).err); }
    if (l.tipo === 'citta') {
      // armaiolo: compra e indossa ciò che migliora davvero (difesa per armatura, scudo ed elmo; danno per l'arma)
      for (const id of (l.bott || []).slice()) { const o = VDAT.OGG[id], ora = VDAT.OGG[s.cap.eq[o.slot]] || {}, arma = VDAT.OGG[s.cap.eq.arma] || {}; const meglio = o.slot === 'arma' ? !o.git && !o.due && (o.dan || 0) > (ora.dan || 0) : o.slot === 'cimelio' ? false : o.slot === 'cavallo' ? (o.vel || 0) > (ora.vel || 10) : (o.dif || 0) > (ora.dif || 0) && !(o.slot === 'scudo' && arma.due);
        if (meglio && tu.oro > VEN.prezzoOgg(s, o, 1) + 350 && !fai({ a: 'compraogg', id }).err) fai({ a: 'equipa', i: tu.zaino.length - 1 }); }
      for (let i = tu.zaino.length - 1; i >= 0; i--) { const o = VDAT.OGG[tu.zaino[i]]; if (o && o.q < 4) fai({ a: 'vendiogg', i }); }
      for (const e of l.merc.slice()) { let g = 0; while (g++ < 6 && tu.oro > 500 && !fai({ a: 'assolda', t: e.t, n: 1 }).err); }
      // commercio: compra a buon mercato ciò che qui si produce
      for (const m of Object.keys(VDAT.MERCI)) { if (VDAT.MERCI[m].cibo) continue; let g = 0; while (g++ < 8 && tu.oro > 260 && VEN.carico(tu) < VEN.caricoMax(s) - 2 && VEN.prezzo(s, l, m, 1) <= VDAT.MERCI[m].base * .75 && !fai({ a: 'compra', m, n: 1 }).err); }
      if (!s.servizio && s.fama >= VEN.P.FAMA_CONTRATTO) fai({ a: 'contratto' });
      // torneo: se oggi c'è, il capitano è già forte e le monete avanzano, si iscrive; con poco livello si ritira dopo la prima vittoria
      if (VEN.torneoOggi(s, l) && !s.torneo && s.cap.liv >= 3 && tu.oro >= VDAT.TORNEO.posta * s.cap.liv + 250 && !fai({ a: 'torneo' }).err) {
        while (s.torneo) {
          if (s.torneo.turno >= 1 && s.cap.liv < 4) { fai({ a: 'ritira' }); break; }
          if (fai({ a: 'lizza' }).err) { fai({ a: 'ritira' }); break; }
          VEN.auto(s);
        }
      }
    }
    if (l.inc && !l.inc.preso && l.inc.tipo !== 'reliquia' && l.inc.tipo !== 'taglia' && (l.inc.tipo !== 'predoni' || VEN.forza(tu) > 70)) fai({ a: 'incarico' });
    if (l.tipo === 'monastero') fai({ a: 'cura' });
    if (tu.tr.reduce((a, e) => a + (e.f || 0), 0) > VEN.uomini(tu) * .4) { if (!fai({ a: 'riposa' }).err) return; }
    return fai({ a: 'esci' });
  }
  function viaggia(s, bravo, r, mem) {
    const tu = TU(s), mia = VEN.forza(tu);
    if (!bravo) {
      const vis = VEN.visibili(s);
      if (vis.length && r() < .6) return VEN.ordina(s, { t: 'segui', pid: vis[Math.floor(r() * vis.length)].id });
      return VEN.ordina(s, { t: 'entra', lid: Math.floor(r() * s.l.length) });
    }
    const prede = VEN.visibili(s).filter(p => VEN.ostile(s, p, tu) && VEN.forza(p) * 1.25 < mia).sort((a, b) => VEN.dist(a, tu) - VEN.dist(b, tu));
    if (prede.length && VEN.sani(tu) >= VEN.uomini(tu) * .6) return VEN.ordina(s, { t: 'segui', pid: prede[0].id });
    const cons = s.incarichi.find(q => !q.fatto && !q.fallito && q.tipo === 'consegna' && (tu.merci[q.bene] || 0) >= q.n);
    if (cons) return VEN.ordina(s, { t: 'entra', lid: cons.a });
    if (!s.torneo && s.cap.liv >= 3 && tu.oro >= VDAT.TORNEO.posta * s.cap.liv + 250) {
      const t = VEN.tornei(s).find(t => t.giorni <= 1 && !VEN.nemiche(s, 'tu', s.l[t.lid].faz) && VEN.dist(s.l[t.lid], tu) <= 30 + 30 * t.giorni);
      if (t) return VEN.ordina(s, { t: 'entra', lid: t.lid });
    }
    const amici = s.l.filter(l => l.noto !== false && !VEN.SITO[l.tipo] && (l.faz === 'tu' || !VEN.nemiche(s, 'tu', l.faz)));
    amici.sort((a, b) => (VEN.dist(a, tu) + (mem[a.id] || 0) * 14) - (VEN.dist(b, tu) + (mem[b.id] || 0) * 14));
    const m = amici[0]; if (!m) return VEN.ordina(s, { t: 'aspetta', ore: 6 });
    for (const k of Object.keys(mem)) mem[k] = Math.max(0, mem[k] - .34); mem[m.id] = 3;
    return VEN.ordina(s, { t: 'entra', lid: m.id });
  }
  // gioca `giorni` giorni e restituisce lo stato
  return function gioca(s, giorni, bravo, r) {
    const fine = s.t + giorni * 1440, mem = {}; let guardia = 0;
    while (s.t < fine && guardia++ < 400000) {
      if (s.incontro) { const x = incontro(s, bravo, r); if (x && x.err) throw new Error('incontro: ' + x.err + ' ' + JSON.stringify(s.incontro)); continue; }
      const tu = TU(s);
      if (s.prigioniero) { VEN.passo(s, 60); continue; }
      if (tu.ord && tu.ord.t === 'aspetta') { VEN.passo(s, 60); continue; }
      if (s.dentro >= 0) { luogo(s, bravo, r); continue; }
      if (s.davanti >= 0) { VEN.fai(s, { a: 'esci' }); continue; }
      if (!tu.ord) { const x = viaggia(s, bravo, r, mem); if (x && x.err) VEN.ordina(s, { t: 'aspetta', ore: 3 }); }
      VEN.passo(s, 30);
    }
    return s;
  };
};
