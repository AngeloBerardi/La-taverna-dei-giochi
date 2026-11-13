/* FSFIDA: lo stesso fascicolo giocato da due squadre rivali sulla stessa TV (motore base: motori/36c-fascicolo.js).
   Ogni squadra ha la sua partita FASCICOLO completa (reperti, ore, deduzioni, risposte, caposquadra); le due partite
   vanno avanti insieme (stessa fase, stesso capitolo, stesso timer). La TV mostra solo i progressi: chi ha risposto,
   quante deduzioni, quante ore, mai il contenuto di reperti, interrogatori, sopralluoghi o risposte prima della
   rivelazione. Stesso contratto del motore base: nuova / act / tick / pubblico / mani. Progetto: docs/FASCICOLI.md.
   Mai Date né Math.random. */
const FSFIDA = (() => {
  const F = typeof FASCICOLO !== 'undefined' ? FASCICOLO : require('./36c-fascicolo.js');
  const clone = o => JSON.parse(JSON.stringify(o));
  const NOMI = { A: 'Squadra Rossa', B: 'Squadra Blu' };
  const IDS = ['A', 'B'];
  // le sotto-partite accettano squadre da 1 a 8 telefoni: il kit vale per la squadra, non per la sala
  const kitSq = k => (k.__sq ? k : { ...k, giocatori: [1, Math.max(8, k.giocatori[1])], __sq: true });
  const quale = (s, uid) => IDS.find(t => s.sq[t].ordine.includes(uid));

  function nuova(k, giocatori, opz) {
    opz = opz || {};
    if (giocatori.length < 2) return { err: 'Per la sfida servono almeno due telefoni' };
    const g = { A: [], B: [] };
    giocatori.forEach((x, i) => g[(opz.squadre && opz.squadre[x.uid]) || IDS[i % 2]].push(x));
    if (!g.A.length || !g.B.length) return { err: 'Ogni squadra ha bisogno di almeno un telefono' };
    if (g.A.length > 8 || g.B.length > 8) return { err: 'Al massimo otto telefoni per squadra' };
    const kk = kitSq(k),
      sq = {};
    for (const t of IDS) {
      const r = F.nuova(kk, g[t], opz);
      if (r.err) return r;
      sq[t] = r.s;
    }
    return { s: { v: 1, modo: 'sfida', kit: k.id, sq, pronte: {}, cue: null, n: 0, ris: null } };
  }
  // applica la stessa azione di regia alle due partite, così restano allineate
  function entrambe(s, a, k, ora) {
    for (const t of IDS) {
      const r = F.act(s.sq[t], { ...a, regia: true }, kitSq(k), ora);
      if (r.err) return r;
      s.sq[t] = r.s;
    }
    s.pronte = {};
    return null;
  }
  function chiudi(s, k) {
    if (s.sq.A.fase === 'finale' && !s.ris) {
      const a = s.sq.A.ris.stelle,
        b = s.sq.B.ris.stelle;
      s.ris = { A: s.sq.A.ris, B: s.sq.B.ris, vince: a === b ? ['A', 'B'] : [a > b ? 'A' : 'B'] };
    }
  }
  // in sfida la TV non mostra reperti né risposte: un annuncio generico al posto dell'evento della squadra
  const ANNUNCI = {
    unito: 'ha ricomposto un reperto',
    deduzione: 'ha fatto una deduzione',
    interrogatorio: 'interroga un testimone',
    zona: 'esamina un luogo',
    'lab-parte': 'manda un reperto in laboratorio',
    lab: 'ha l’esito del laboratorio',
    serratura: 'ha aperto una serratura',
    archivio: 'ha trovato qualcosa in archivio',
    consegna: 'ha consegnato una risposta',
  };
  function act(s0, a, k, ora) {
    if (!a || typeof a !== 'object') return { err: 'Azione vuota' };
    const s = clone(s0),
      kk = kitSq(k);
    if (a.regia === true) {
      if (!['avanti', 'pausa', 'tempo'].includes(a.t)) return { err: 'Comando della regia sconosciuto' };
      const e = entrambe(s, a, k, ora);
      if (e) return e;
      chiudi(s, k);
      return { s };
    }
    const t = quale(s, a.uid);
    if (!t) return { err: 'Non sei in questa sfida' };
    const sub = s.sq[t];
    // prima di aprire il caso ci si può spostare nell'altra squadra: le due partite si rifanno da capo
    if (a.t === 'squadra') {
      if (sub.fase !== 'pronta') return { err: 'Le squadre si cambiano solo prima di aprire il caso' };
      const tutti = [...s.sq.A.ordine, ...s.sq.B.ordine].map(u => ({
        uid: u,
        nome: (s.sq.A.gioc[u] || s.sq.B.gioc[u]).nome,
      }));
      const dove = {};
      for (const x of tutti) dove[x.uid] = quale(s, x.uid);
      dove[a.uid] = t === 'A' ? 'B' : 'A';
      const r = nuova(k, tutti, { squadre: dove });
      if (r.err) return r;
      r.s.n = s.n;
      r.s.cue = { tipo: 'cambio', squadra: dove[a.uid], n: ++r.s.n };
      return { s: r.s };
    }
    if (a.t === 'proietta')
      return { err: 'Nella sfida la TV la vedono anche gli avversari: mostrate i reperti a voce, tra voi' };
    if (a.t === 'pausa') {
      if (a.uid !== sub.capo) return { err: 'La pausa la mette il caposquadra' };
      const e = entrambe(s, { t: 'pausa' }, k, ora);
      return e || { s };
    }
    if (a.t === 'avanti') {
      if (a.uid !== sub.capo) return { err: 'Va avanti il caposquadra' };
      if (sub.pausa) return { err: 'Siete in pausa' };
      // indagine, consegna e accusa: si passa avanti quando sono pronte tutte e due le squadre (o scade il tempo)
      if (['indagine', 'consegna', 'accusa'].includes(sub.fase)) {
        // un secondo tocco ritira la squadra (un «pronti» dato per sbaglio non resta appeso)
        if (s.pronte[t]) {
          delete s.pronte[t];
          return { s };
        }
        s.pronte[t] = 1;
        s.cue = { tipo: 'pronta', squadra: t, n: ++s.n };
        if (!IDS.every(x => s.pronte[x])) return { s };
      }
      const e = entrambe(s, { t: 'avanti' }, k, ora);
      if (e) return e;
      chiudi(s, k);
      return { s };
    }
    if (a.t === 'tempo') return { err: 'Il tempo lo aggiunge la regia' };
    const r = F.act(sub, a, kk, ora);
    if (r.err) return r;
    s.sq[t] = r.s;
    const c = r.s.cue;
    if (c && c.n !== (sub.cue || {}).n && ANNUNCI[c.tipo])
      s.cue = { tipo: 'annuncio', squadra: t, testo: ANNUNCI[c.tipo], n: ++s.n };
    return { s };
  }
  function tick(s0, k, ora) {
    let s = null;
    for (const t of IDS) {
      const r = F.tick((s || s0).sq[t], kitSq(k), ora);
      if (r) {
        s = s || clone(s0);
        s.sq[t] = r.s;
      }
    }
    if (s) {
      if (s.sq.A.fase !== s0.sq.A.fase) s.pronte = {};
      chiudi(s, k);
    }
    return s ? { s } : null;
  }
  function pubblico(s, k) {
    const kk = kitSq(k),
      pa = F.pubblico(s.sq.A, kk);
    const squadre = IDS.map(t => {
      const sub = s.sq[t],
        p = t === 'A' ? pa : F.pubblico(sub, kk);
      return {
        id: t,
        nome: NOMI[t],
        ore: sub.ore,
        capo: p.capo,
        membri: p.squadra.map(x => x.nome),
        pronta: !!s.pronte[t],
        // stati delle domande: chi ha risposto sì, che cosa solo dopo la rivelazione (uguale per tutte e due)
        domande: p.domande,
        ded: sub.ded.length,
        aperte: sub.aperte.length,
        ris: sub.ris ? { grado: sub.ris.grado, stelle: sub.ris.stelle, finale: sub.ris.finale } : null,
      };
    });
    const o = {
      t: 'fascicolo',
      sfida: true,
      kit: k.id,
      fase: pa.fase,
      cap: pa.cap,
      riga: pa.riga,
      fino: pa.fino,
      resto: pa.resto,
      pausa: pa.pausa,
      squadre,
      // le domande della fase per i telefoni che leggono G.domande: quelle della squadra rossa (gli stati sono uguali)
      domande: pa.domande,
      // due canali: gli annunci della sfida (cue) e i momenti comuni della partita base (cueBase), numerati a parte
      cue: s.cue,
      cueBase:
        pa.cue &&
        ['capitolo', 'indagine', 'consegna-apre', 'rivela', 'accusa', 'finale', 'fine', 'pausa'].includes(pa.cue.tipo)
          ? pa.cue
          : null,
      log: [],
      ore: squadre[0].ore,
      capo: squadre.map(x => x.capo).join(' · '),
    };
    if (pa.ricostruzione) o.ricostruzione = pa.ricostruzione;
    if (s.ris) {
      o.vince = s.ris.vince;
      o.epiloghi = IDS.map(t => (k.soluzione.epilogo || {})[s.sq[t].ris.finale] || '');
    }
    return o;
  }
  function mani(s, k) {
    const kk = kitSq(k),
      o = {};
    for (const t of IDS) {
      const m = F.mani(s.sq[t], kk);
      for (const [u, x] of Object.entries(m)) {
        x.stato.squadra = { id: t, nome: NOMI[t], avversari: NOMI[t === 'A' ? 'B' : 'A'], pronta: !!s.pronte[t] };
        o[u] = x;
      }
    }
    return o;
  }
  return { nuova, act, tick, pubblico, mani, valida: F.valida, NOMI, kitSq };
})();
if (typeof module !== 'undefined') module.exports = FSFIDA;
