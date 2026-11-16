// Bot della Compagnia di ventura: un capitano accorto (recluta, commercia, promuove, caccia solo chi può battere)
// e uno sconsiderato (ordini a caso, attacca chiunque). Usati da test_ven_mondo.js e da tools/avventura/ventura.js.
// Opzione `{regno:true}` del capitano accorto (V4): da fama 120 niente contratti; con fama 150 e monete sceglie il castello più debole, se non è ostile
// aggredisce un signore di quel regno, lo assedia, entra e fonda un regno.
// V6b: risponde alle scene dei dialoghi (se il motore le ha caricate).
// Opzione `{inc:true}` (V6c): insegue il passo aperto dell'incarico personale di un compagno (luogo, consegna, vittoria, sito da ripulire).
module.exports = function (VEN, VDAT) {
  const TU = s => VEN.TU(s);
  let O = null; // opzioni della partita in corso
  // il passo aperto di un incarico personale (opzione inc): {c, p}
  const mira = s => { if (!O || !O.inc || !s.grad) return null; for (const c of VDAT.COMPAGNI) { const g = s.grad[c.id]; if (c.inc && g && g.incA && s.compagni[c.id] != null && TU(s).tr.some(e => e.t === c.id && e.n > 0)) return { c, p: c.inc[g.incA - 1] }; } return null; };
  const serveMerce = s => { const m = mira(s); return m && m.p.tipo === 'porta' && m.p.m ? m.p : null; };
  function versoInc(s, m) {
    const tu = TU(s), p = m.p, mia = VEN.forza(tu), vicino = L => L.sort((a, b) => VEN.dist(a, tu) - VEN.dist(b, tu))[0], amico = l => l.faz === 'tu' || !VEN.nemiche(s, 'tu', l.faz);
    const adatto = l => (!p.tipoL || l.tipo === p.tipoL) && (!p.faz || l.faz === p.faz);
    if (p.tipo === 'porta' && p.m && (tu.merci[p.m] || 0) < p.n) { if (tu.oro < VDAT.MERCI[p.m].base * 2 * (p.n - (tu.merci[p.m] || 0)) + 300) return null; const l = vicino(s.l.filter(l => VEN.MERCATO[l.tipo] && amico(l) && (l.scorte[p.m] || 0) >= p.n)); return l ? VEN.ordina(s, { t: 'entra', lid: l.id }) : null; }
    if (p.tipo === 'porta' && p.oro && tu.oro < p.oro) return null;
    if (p.tipo === 'luogo' || p.tipo === 'porta') { const l = vicino(s.l.filter(l => adatto(l) && amico(l))); return l ? VEN.ordina(s, { t: 'entra', lid: l.id }) : null; }
    if (p.tipo === 'sito') { const l = vicino(s.l.filter(l => l.tipo === p.tipoL && l.g.length && VEN.forzaTr(l.g) * 1.3 < mia)); return l ? VEN.ordina(s, { t: 'entra', lid: l.id }) : null; }
    if (p.tipo === 'vinci') {
      const q = vicino(VEN.visibili(s).filter(x => x.k === p.k && (!p.faz || x.faz === p.faz) && VEN.forza(x) * 1.3 < mia)); if (q) return VEN.ordina(s, { t: 'segui', pid: q.id });
      if (p.faz) { const l = vicino(s.l.filter(l => l.faz === p.faz && (l.tipo === 'castello' || l.tipo === 'citta') && amico(l))); if (l && VEN.dist(l, tu) > 4) return VEN.ordina(s, { t: 'entra', lid: l.id }); }
    }
    return null;
  }
  const forzaNemici = s => { const { nem, luogo } = VEN.schieramenti(s); return nem.reduce((a, p) => a + VEN.forza(p), 0) + (luogo ? VEN.forzaTr(luogo.g) * (VEN.MURA[luogo.tipo] ? VEN.P.MURA : 1) : 0); };
  function incontro(s, bravo, r, reg) {
    const inc = s.incontro;
    if (reg && inc.tipo === 'parla' && reg.fase) { const p = VEN.part(s, inc.pid[0]), c = s.l[reg.t]; if (p && c && p.k === 'sig' && p.faz === c.faz && !VEN.nemiche(s, 'tu', p.faz)) return VEN.scegli(s, 'aggredisci'); }
    const m = mira(s); if (m && m.p.tipo === 'vinci' && m.p.k === 'sig' && inc.tipo === 'parla') { const p = VEN.part(s, inc.pid[0]); if (p && p.k === 'sig' && (!m.p.faz || p.faz === m.p.faz) && VEN.forza(p) * 1.3 < VEN.forza(TU(s))) return VEN.scegli(s, 'aggredisci'); }
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
  // il castello più debole che la compagnia può prendere (guarnigione con le mura e signori dentro), meglio se vicino
  function bersaglio(s) {
    const tu = TU(s); let m = null, mv = 1e9, md = 0;
    for (const l of s.l) {
      if (l.tipo !== 'castello' || !VDAT.REGNI.includes(l.faz) || l.ass) continue;
      const dif = VEN.forzaTr(l.g) * VEN.P.MURA + s.p.filter(p => p.k === 'sig' && p.dentro === l.id).reduce((a, p) => a + VEN.forza(p), 0), d = VEN.dist(l, tu), v = dif + (d > 40 ? 5000 : 0) + d * 2;
      if (v < mv) { mv = v; m = l; md = dif; }
    }
    return m && VEN.forza(tu) >= md * 1.5 ? m : null;
  }
  function luogo(s, bravo, r, reg) {
    const l = s.l[s.dentro], tu = TU(s), fai = z => VEN.fai(s, z);
    if (bravo) { const mi = mira(s); if (mi && mi.p.tipo === 'sito' && l.tipo === mi.p.tipoL && l.g.length && !fai({ a: 'assalta' }).err) return; }
    if (bravo && reg && !s.corona) {
      if (s.servizio && s.fama >= 120) fai({ a: 'lascia' });
      if (reg.fase === 'assedio' && l.faz === 'tu' && !s.servizio && !fai({ a: 'fonda', nome: 'Regno del Capitano', stend: 3 }).err) reg.fase = 'fatto';
    }
    if (!bravo) { // a caso
      const az = [{ a: 'recluta', n: 1 }, { a: 'compra', m: 'spezie', n: 1 }, { a: 'vendi', m: 'grano', n: 2 }, { a: 'incarico' }, { a: 'riposa' }, { a: 'compra', m: 'velluto', n: 1 }];
      for (let k = 0; k < 3; k++) fai(az[Math.floor(r() * az.length)]);
      // a caso si iscrive al torneo se c'è e le monete bastano, poi duella o si ritira come capita
      if (VEN.torneoOggi(s, l) && !s.torneo && r() < .7 && !fai({ a: 'torneo' }).err) { while (s.torneo) { if (r() < .3 || fai({ a: 'lizza' }).err) { fai({ a: 'ritira' }); break; } VEN.auto(s); } }
      return fai({ a: 'esci' });
    }
    fai({ a: 'consegna' }); fai({ a: 'riscatta' });
    while (s.cap.punti > 0) { const ab = s.cap.ab, k = ab.comando < 2 ? 'comando' : ab.prodezza < 2 ? 'prodezza' : ab.comando < 3 ? 'comando' : ab.addestra < 2 ? 'addestra' : ab.medicina < 2 ? 'medicina' : ab.prodezza < 4 ? 'prodezza' : 'comando'; if (fai({ a: 'abilita', k }).err) break; }
    for (const e of tu.tr.slice()) { const T = VDAT.TR[e.t]; if (!T.su.length) continue; const su = T.su[(e.n + s.t) % T.su.length]; let g = 0; while (g++ < 30 && !fai({ a: 'promuovi', t: e.t, su, n: 1 }).err); }
    if (VEN.MERCATO[l.tipo]) {
      // vende ciò che qui vale più del prezzo di riferimento, tiene i viveri
      const tieni = serveMerce(s); if (tieni) { let g = 0; while (g++ < 20 && (tu.merci[tieni.m] || 0) < tieni.n && tu.oro > 300 && !fai({ a: 'compra', m: tieni.m, n: 1 }).err); }
      for (const m of Object.keys(tu.merci)) { if (VDAT.MERCI[m].cibo || (tieni && m === tieni.m)) continue; let g = 0; while (g++ < 40 && (tu.merci[m] || 0) > 0 && VEN.prezzo(s, l, m, -1) >= VDAT.MERCI[m].base * .95) fai({ a: 'vendi', m, n: 1 }); }
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
      if (!s.servizio && s.fama >= VEN.P.FAMA_CONTRATTO && !s.corona && !(reg && s.fama >= 120)) fai({ a: 'contratto' });
      // torneo: se oggi c'è, il capitano è già forte e le monete avanzano, si iscrive; con poco livello si ritira dopo la prima vittoria
      if (VEN.torneoOggi(s, l) && !s.torneo && s.cap.liv >= 3 && tu.oro >= VDAT.TORNEO.posta * s.cap.liv + 250 && !fai({ a: 'torneo' }).err) {
        while (s.torneo) {
          if (s.torneo.turno >= 1 && s.cap.liv < 4) { fai({ a: 'ritira' }); break; }
          if (fai({ a: 'lizza' }).err) { fai({ a: 'ritira' }); break; }
          VEN.auto(s);
        }
      }
      // il torneo di qui è domani: si resta in città ad aspettarlo (otto ore di riposo alla volta)
      const qui = VEN.tornei(s).find(t => t.lid === l.id);
      if (qui && qui.giorni === 1 && s.cap.liv >= 3 && tu.oro >= VDAT.TORNEO.posta * s.cap.liv + 400 && !fai({ a: 'riposa' }).err) return;
    }
    if (l.inc && !l.inc.preso && l.inc.tipo !== 'reliquia' && l.inc.tipo !== 'taglia' && (l.inc.tipo !== 'predoni' || VEN.forza(tu) > 70)) fai({ a: 'incarico' });
    if (l.tipo === 'monastero') fai({ a: 'cura' });
    if (tu.tr.reduce((a, e) => a + (e.f || 0), 0) > VEN.uomini(tu) * .4) { if (!fai({ a: 'riposa' }).err) return; }
    return fai({ a: 'esci' });
  }
  function viaggia(s, bravo, r, mem, reg) {
    const tu = TU(s), mia = VEN.forza(tu);
    if (!bravo) {
      const tn = VEN.tornei(s)[0]; if (tn.giorni <= 1 && r() < .8 && !VEN.nemiche(s, 'tu', s.l[tn.lid].faz)) return VEN.ordina(s, { t: 'entra', lid: tn.lid });
      const vis = VEN.visibili(s);
      if (vis.length && r() < .6) return VEN.ordina(s, { t: 'segui', pid: vis[Math.floor(r() * vis.length)].id });
      return VEN.ordina(s, { t: 'entra', lid: Math.floor(r() * s.l.length) });
    }
    if (reg && !s.corona && !s.servizio) {
      if (!reg.fase && s.fama >= 150 && tu.oro >= 5200) { const c = bersaglio(s); if (c) { reg.fase = 'prep'; reg.t = c.id; } }
      if (reg.fase === 'prep' || reg.fase === 'ostile' || reg.fase === 'assedio') {
        const c = s.l[reg.t];
        if (c.faz === 'tu' || VEN.nemiche(s, 'tu', c.faz)) { if (c.faz !== 'tu') reg.fase = 'assedio'; return VEN.ordina(s, { t: 'entra', lid: c.id }); }
        reg.fase = 'ostile'; if (++reg.n > 60) { reg.fase = 'fatto'; } else {
          const lord = VEN.visibili(s).filter(p => p.k === 'sig' && p.faz === c.faz && VEN.forza(p) * 1.3 < mia).sort((a, b) => VEN.dist(a, tu) - VEN.dist(b, tu))[0];
          return VEN.ordina(s, lord ? { t: 'segui', pid: lord.id } : { t: 'entra', lid: c.id }); }
      }
    }
    const mi = mira(s); if (mi) { const x = versoInc(s, mi); if (x && !x.err) return x; }
    const prede = VEN.visibili(s).filter(p => VEN.ostile(s, p, tu) && VEN.forza(p) * 1.25 < mia).sort((a, b) => VEN.dist(a, tu) - VEN.dist(b, tu));
    if (prede.length && VEN.sani(tu) >= VEN.uomini(tu) * .6) return VEN.ordina(s, { t: 'segui', pid: prede[0].id });
    const cons = s.incarichi.find(q => !q.fatto && !q.fallito && q.tipo === 'consegna' && (tu.merci[q.bene] || 0) >= q.n);
    if (cons) return VEN.ordina(s, { t: 'entra', lid: cons.a });
    if (!s.torneo && s.cap.liv >= 3 && tu.oro >= VDAT.TORNEO.posta * s.cap.liv + 250) {
      const t = VEN.tornei(s).find(t => t.giorni <= 2 && !VEN.nemiche(s, 'tu', s.l[t.lid].faz) && VEN.dist(s.l[t.lid], tu) <= 30 + 30 * t.giorni);
      if (t) return VEN.ordina(s, { t: 'entra', lid: t.lid });
    }
    const amici = s.l.filter(l => l.noto !== false && !VEN.SITO[l.tipo] && (l.faz === 'tu' || !VEN.nemiche(s, 'tu', l.faz)));
    amici.sort((a, b) => (VEN.dist(a, tu) + (mem[a.id] || 0) * 14) - (VEN.dist(b, tu) + (mem[b.id] || 0) * 14));
    const m = amici[0]; if (!m) return VEN.ordina(s, { t: 'aspetta', ore: 6 });
    for (const k of Object.keys(mem)) mem[k] = Math.max(0, mem[k] - .34); mem[m.id] = 3;
    return VEN.ordina(s, { t: 'entra', lid: m.id });
  }
  // gioca `giorni` giorni e restituisce lo stato
  return function gioca(s, giorni, bravo, r, opt) {
    O = opt || null; const fine = s.t + giorni * 1440, mem = {}, reg = bravo && opt && opt.regno ? { fase: null, t: -1, n: 0, assedi: 0 } : null; let guardia = 0;
    while (s.t < fine && guardia++ < 400000) {
      // V6b: una scena aperta ferma il tempo; il bot risponde con la prima scelta disponibile (o `opt.voce(vista)` → indice)
      if (s.rac && s.rac.scena) { const v = VEN.voce(s), i = v.continua ? -1 : (opt && opt.voce ? opt.voce(v) : v.scelte.find(c => c.ok).i), x = VEN.parla(s, i < 0 ? { t: 'continua' } : { t: 'scegli', i }); if (x.err) throw new Error('voce: ' + x.err); continue; }
      if (s.incontro) { const x = incontro(s, bravo, r, reg); if (x && x.err) throw new Error('incontro: ' + x.err + ' ' + JSON.stringify(s.incontro)); continue; }
      const tu = TU(s);
      if (s.prigioniero) { VEN.passo(s, 60); continue; }
      if (tu.ord && tu.ord.t === 'aspetta') { VEN.passo(s, 60); continue; }
      if (s.dentro >= 0) { luogo(s, bravo, r, reg); continue; }
      if (s.davanti >= 0) {
        if (reg && reg.fase === 'assedio' && s.davanti === reg.t && !s.corona) { if (!s.assedio && (++reg.assedi > 3 || VEN.fai(s, { a: 'assedia' }).err)) { reg.fase = 'fatto'; VEN.fai(s, { a: 'esci' }); } else VEN.passo(s, 30); continue; }
        const mi = mira(s), l = s.l[s.davanti]; if (mi && mi.p.tipo === 'sito' && l.tipo === mi.p.tipoL && l.g.length && !VEN.fai(s, { a: 'assalta' }).err) continue;
        VEN.fai(s, { a: 'esci' }); continue;
      }
      if (!tu.ord) { const x = viaggia(s, bravo, r, mem, reg); if (x && x.err) VEN.ordina(s, { t: 'aspetta', ore: 3 }); }
      VEN.passo(s, 30);
    }
    return s;
  };
};
