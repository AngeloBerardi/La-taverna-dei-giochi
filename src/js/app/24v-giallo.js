/* ================= CENA CON DELITTO: telefono, TV e regia =================
   Il gioco è registrato in 07-nucleo.js (GAMES, le regole ELO leggono gli id da lì); qui stanno opzioni, controllo all'avvio,
   le viste e il regista. Nella stanza (G) c'è solo la parte pubblica (GIALLO.pubblico): i segreti di ognuno arrivano al suo
   telefono da REGIA.ascoltaMiei, la soluzione la conosce solo la TV regista. Piano e flusso: docs/GIALLI.md.
   - Telefono: gialloH() a schede (personaggio, indizi, obiettivi, accusa, finale); le azioni sono richieste alla regia.
   - TV regista: GIA.D tiene lo stato privato (regia/CODICE), consegna le mani, legge le richieste, guida atti e timer,
     narra con la voce del browser, pubblica lo stato della stanza. Se la TV si riavvia riprende da regia/CODICE. */
const GIA = {
  // ---- registrazione (usata da GAMES in 07-nucleo.js) ----
  kits() {
    const v = Object.entries(REGIA.KIT).map(([id, k]) => [id, k.titolo + ' · ' + k.giocatori.join('–')]);
    return v.length ? v : [['', 'Nessun giallo disponibile']];
  },
  range() {
    const v = Object.values(REGIA.KIT);
    if (!v.length) return '—';
    return Math.min(...v.map(k => k.giocatori[0])) + '–' + Math.max(...v.map(k => k.giocatori[1]));
  },
  ok: n => Object.values(REGIA.KIT).some(k => n >= k.giocatori[0] && n <= k.giocatori[1]),
  // prima dell'avvio: kit e numero, un telefono con profilo a testa, uno schermo regista collegato
  check(S, o) {
    const k = REGIA.KIT[o && o.kit];
    if (!k) return 'Scegli un giallo';
    if (!R.on || R.mode !== 'rt') return 'La cena con delitto si gioca solo in una stanza online';
    if (S.length < k.giocatori[0] || S.length > k.giocatori[1])
      return '«' + k.titolo + '» si gioca con ' + k.giocatori.join('–') + ' giocatori';
    if (S.some(x => x.k !== 'm')) return 'Alla cena con delitto serve un telefono a testa: togli gli ospiti';
    if (S.some(x => !x.uid)) return 'Qualcuno non ha ancora il profilo online: aspettate qualche secondo';
    if (!REGIA.uid) return 'Prima collega lo schermo comune e premi «Fai da regista» sulla TV';
    return '';
  },
  fase(s) {
    return s.fase === 'atto'
      ? 'Atto ' + (s.atto + 1) + (s.titoloAtto ? ' · ' + s.titoloAtto : '')
      : { attesa: 'La regia prepara la cena', prologo: 'Prologo', accusa: 'L’accusa', finale: 'La verità' }[s.fase] ||
          '';
  },
  mmss(t) {
    const r = Math.max(0, Math.ceil((t - Date.now()) / 1000));
    return Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0');
  },
  timerH: (s, cls) =>
    s.fase === 'atto' && s.scade ? `<span class="${cls}" data-scade="${s.scade}">${GIA.mmss(s.scade)}</span>` : '',
  nomeDi: (s, uid) => {
    const g = (s.giocatori || []).find(x => x.uid === uid);
    return g ? g.nome : '?';
  },

  // ---- telefono: ciò che ho in mano ----
  mano: {},
  _code: '',
  _un: null,
  _av: 0,
  ascolta() {
    if (GIA._un && GIA._code === R.code) return;
    GIA.smetti();
    if (!REGIA.pronto() || !R.code) return;
    GIA._code = R.code;
    GIA._un = REGIA.ascoltaMiei(R.code, m => {
      const av = m.avviso;
      if (av && av.t !== GIA._av) {
        GIA._av = av.t;
        if (Date.now() - av.t < 60000) say(av.testo, 3500);
      }
      GIA.mano = m;
      if (ui.screen === 'game') render();
    });
  },
  smetti() {
    if (GIA._un)
      try {
        GIA._un();
      } catch (e) {
        ERR.n(e);
      }
    GIA._un = null;
    GIA._code = '';
    GIA.mano = {};
  },
  async chiedi(a, ok) {
    try {
      await REGIA.chiedi(R.code, a);
      if (ok) say(ok, 1800);
    } catch (e) {
      say('Non inviato: ' + (e && e.message ? e.message : e), 3000);
    }
  },

  // ---- regia (solo sulla TV che ha preso il ruolo) ----
  D: {
    k: null,
    s: null,
    gid: '',
    inv: {},
    vist: {},
    un: null,
    q: Promise.resolve(),
    err: '',
    voce: true,
    carica: false,
    t0: 0,
    ev: {},
    evento: '',
    auto: '',
  },
  async prendiRegia() {
    try {
      await REGIA.prendi(R.code);
      GIA.D.voce = true;
      say('Questo schermo fa da regia', 2500);
    } catch (e) {
      say(e && e.message ? e.message : String(e), 3500);
    }
    render();
  },
  // avvio o ripresa della serata (idempotente: si chiama da ogni ridisegno della TV)
  async avvia() {
    const g = G,
      D = GIA.D;
    if (!g || g.g !== 'giallo' || !REGIA.sono() || D.gid === g.gid || D.carica) return;
    D.carica = true;
    D.err = '';
    try {
      if (D.un) D.un();
      D.un = null;
      D.k = await REGIA.kit(g.kit);
      const salvato = await REGIA.carica(R.code);
      if (salvato && salvato.gid === g.gid) D.s = salvato.s;
      else {
        const S = seatsNow(),
          r = GIALLO.nuova(
            D.k,
            S.map(x => ({ uid: x.uid, nome: x.name })),
            {}
          );
        if (r.err) throw new Error(r.err);
        await REGIA.pulisci(R.code); // niente segreti di serate precedenti
        D.s = r.s;
      }
      D.gid = g.gid;
      D.inv = {};
      D.vist = {};
      D.ev = {};
      D.evento = '';
      D.t0 = D.s.fase === 'atto' ? D.s.scade - D.k.atti[D.s.atto].minuti * 60000 : 0;
      await GIA.salva();
      D.un = REGIA.ascoltaAzioni(R.code, l => GIA.richieste(l));
      if (D.s.fase === 'prologo') GIA.annuncia();
    } catch (e) {
      D.err = String((e && e.message) || e);
    } finally {
      D.carica = false;
      render();
    }
  },
  // salva lo stato, consegna ciò che è cambiato nelle mani, pubblica la parte pubblica (in coda, una cosa alla volta)
  salva() {
    const D = GIA.D;
    return (D.q = D.q
      .then(async () => {
        const code = R.code,
          s = D.s,
          giri = [];
        await REGIA.salva(code, { gid: D.gid, s });
        for (const u of Object.keys(s.mano))
          for (const [k, o] of Object.entries(s.mano[u])) {
            const j = JSON.stringify(o),
              key = u + '/' + k;
            if (D.inv[key] !== j)
              giri.push(
                REGIA.consegna(code, u, k, o).then(() => {
                  D.inv[key] = j;
                })
              );
          }
        await Promise.all(giri);
        await GIA.pubblica();
      })
      .catch(e => {
        D.err = String((e && e.message) || e);
        render();
      }));
  },
  async pubblica() {
    const D = GIA.D,
      s = D.s,
      pub = GIALLO.pubblico(s, D.k),
      S = seatsNow();
    let over = null;
    if (s.fase === 'finale') {
      const scores = S.map(x => s.punti.p[x.uid] || 0),
        top = Math.max(...scores);
      over = { scores, winners: scores.map((v, i) => (v === top ? i : -1)).filter(i => i >= 0) };
    }
    await RT.transactRoom(R.code, cur => {
      if (!cur || cur.phase !== 'play' || !cur.s || cur.s.gid !== D.gid) return;
      const o = cur.s;
      return {
        ...cur,
        rev: (cur.rev || 0) + 1,
        s: {
          ...pub,
          g: 'giallo',
          gid: D.gid,
          n: o.n,
          names: o.names,
          cur: 0,
          log: s.log.slice(-8),
          ev: [],
          evn: (o.evn || 0) + 1,
          over,
        },
      };
    });
  },
  // richieste dei telefoni: solo le azioni da giocatore, l'uid è quello del percorso (non quello scritto dentro)
  richieste(l) {
    const D = GIA.D;
    let nuove = 0;
    for (const x of l) {
      if (D.vist[x.id]) continue;
      D.vist[x.id] = 1;
      nuove++;
      D.q = D.q
        .then(async () => {
          const r = ['mostra', 'obiettivo', 'voto', 'attore'].includes(x.a.t)
            ? GIALLO.act(D.s, { ...x.a, uid: x.uid }, D.k, Date.now())
            : { err: 'Azione non permessa' };
          if (r.err) await REGIA.consegna(R.code, x.uid, 'avviso', { t: Date.now(), testo: r.err });
          else D.s = r.s;
          await REGIA.consuma(R.code, x.uid, x.id);
        })
        .catch(e => ERR.n(e));
    }
    if (nuove) GIA.salva().then(() => render());
  },
  comanda(a) {
    const D = GIA.D;
    if (!D.s) return;
    const prima = D.s.fase + D.s.atto,
      r = GIALLO.act(D.s, a, D.k, Date.now());
    if (r.err) return say(r.err, 2500);
    D.s = r.s;
    if (D.s.fase + D.s.atto !== prima) {
      D.t0 = D.s.fase === 'atto' ? Date.now() : 0;
      D.evento = '';
      D.auto = '';
      Snd.play('turn');
      GIA.annuncia();
    }
    GIA.salva();
    render();
  },
  parla(t) {
    try {
      if (!GIA.D.voce || !window.speechSynthesis || !t) return;
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'it-IT';
      u.rate = 0.95;
      speechSynthesis.speak(u);
    } catch (e) {
      ERR.n(e);
    }
  },
  annuncia() {
    const D = GIA.D,
      s = D.s,
      k = D.k;
    try {
      speechSynthesis.cancel();
    } catch (e) {
      /* senza voce */
    }
    if (s.fase === 'prologo') GIA.parla(k.prologo.join(' '));
    else if (s.fase === 'atto')
      GIA.parla('Atto ' + (s.atto + 1) + '. ' + k.atti[s.atto].titolo + '. ' + k.atti[s.atto].narrazione.join(' '));
    else if (s.fase === 'accusa') GIA.parla('È il momento di accusare. Votate in segreto dal vostro telefono.');
    else if (s.fase === 'finale') GIA.parla('Ecco come è andata. ' + k.soluzione.ricostruzione.join(' '));
  },
  // ogni secondo: orologi, eventi a sorpresa e fine dell'atto (solo la regia avanza)
  tick() {
    for (const el of document.querySelectorAll('[data-scade]')) el.textContent = GIA.mmss(+el.dataset.scade);
    const D = GIA.D,
      s = D.s;
    if (!ui.tv || !G || G.g !== 'giallo' || !s || !REGIA.sono() || s.fase !== 'atto') return;
    const min = (Date.now() - D.t0) / 60000;
    (D.k.atti[s.atto].eventi || []).forEach((e, i) => {
      const id = s.atto + '-' + i;
      if (!D.ev[id] && min >= e.dopo) {
        D.ev[id] = 1;
        D.evento = e.testo;
        Snd.play('whoosh');
        GIA.parla(e.testo);
        render();
      }
    });
    const chiave = s.atto + '-' + s.scade;
    if (Date.now() >= s.scade && D.auto !== chiave) {
      D.auto = chiave;
      banner('TEMPO SCADUTO', s.atto < D.k.atti.length - 1 ? 'Si passa all’atto successivo' : 'Si passa all’accusa');
      GIA.comanda({ t: 'avanti' });
    }
  },

  // ---- viste della TV ----
  tvLobbyH() {
    if (!R.code || R.mode !== 'rt') return '';
    if (REGIA.sono())
      return `<p class="giatv-ok">${ic('tv', 22)} Questo schermo fa da <b>regia</b> per le cene con delitto.</p>`;
    if (REGIA.uid) return '<p class="muted">Un altro schermo fa da regia per le cene con delitto.</p>';
    return '<button class="b gold" data-a="giaregia">Fai da regista (cena con delitto)</button>';
  },
  tvH() {
    const s = G,
      D = GIA.D,
      io = REGIA.sono();
    if (io) GIA.avvia();
    const p = io && D.s && D.gid === s.gid ? D.s : null,
      k = p ? D.k : null;
    const n = (s.giocatori || []).length,
      votati = new Set(s.votati || []);
    let main = '',
      ctl = '',
      lato = '';
    if (!REGIA.uid)
      main = `<div class="giatv-c"><p>Nessuno schermo fa da regia.</p><button class="b gold" data-a="giaregia">Fai da regista</button></div>`;
    else if (D.err && io) main = `<div class="giatv-c"><p class="err">${esc(D.err)}</p></div>`;
    else if (s.fase === 'attesa' || (io && !p)) main = '<div class="giatv-c"><p>La regia prepara la cena…</p></div>';
    else if (s.fase === 'prologo') {
      main = k
        ? `<section class="giatv-narra"><h2>${esc(k.vittima.nome)}</h2><p class="muted">${esc(k.vittima.chi)}</p>${k.prologo.map(t => `<p>${esc(t)}</p>`).join('')}</section>`
        : '<div class="giatv-c"><p>Prologo: ascoltate la regia.</p></div>';
      if (io) ctl = '<button class="b play" data-a="giaavanti">Inizia il primo atto</button>';
    } else if (s.fase === 'atto') {
      const nar = k ? k.atti[s.atto].narrazione.map(t => `<p>${esc(t)}</p>`).join('') : '';
      const ev = io && D.evento ? `<div class="giatv-ev">${esc(D.evento)}</div>` : '';
      const pub = (s.pubblici || [])
        .map(
          o =>
            `<article class="giatv-ind"><h4>${esc(o.titolo)}<small>atto ${o.atto + 1}</small></h4><p>${esc(o.testo)}</p></article>`
        )
        .join('');
      main = `${ev}<section class="giatv-narra">${nar}</section>${pub ? `<h3 class="giatv-h">Indizi pubblici</h3><div class="giatv-inds">${pub}</div>` : ''}`;
      if (io)
        ctl = `<button class="b sm" data-a="giatempo" data-v="300000">+5 minuti</button><button class="b play" data-a="giaavanti">${s.atto < (k ? k.atti.length : 3) - 1 ? 'Atto successivo' : 'Passa all’accusa'}</button>`;
    } else if (s.fase === 'accusa') {
      main = `<section class="giatv-narra"><h2>L’accusa</h2><p>Dal telefono, ognuno vota in segreto:</p><ol>${(
        s.domande || []
      )
        .map(q => `<li><b>${esc(q.testo)}</b>${q.scelte ? `<small>${q.scelte.map(esc).join(' · ')}</small>` : ''}</li>`)
        .join(
          ''
        )}<li><b>Il miglior attore della serata</b></li></ol><p class="giatv-big">${votati.size} / ${n} hanno votato</p></section>`;
      if (io) ctl = '<button class="b play" data-a="giaavanti">Rivela la verità</button>';
    } else if (s.fase === 'finale' && s.finale) {
      const f = s.finale,
        pt = f.punti,
        cl = (s.giocatori || []).slice().sort((a, b) => (pt.p[b.uid] || 0) - (pt.p[a.uid] || 0));
      main = `<section class="giatv-narra giatv-fin"><p class="muted">L’assassino era</p><h2 class="giatv-chi">${esc(f.chi)}</h2>
<p>${(s.domande || [])
        .filter(q => q.id !== 'chi')
        .map(q => `<b>${esc(q.testo)}</b> ${esc(f.risposte[q.id])}`)
        .join('<br>')}</p>
<ol class="giatv-ric">${f.ricostruzione.map((t, i) => `<li style="--i:${i}">${esc(t)}</li>`).join('')}</ol>
${pt.franca ? '<p class="giatv-ev">L’assassino l’ha fatta franca!</p>' : ''}</section>`;
      // a fine serata la colonna di destra diventa la classifica (sulla TV nessuno scorre la pagina)
      lato = `<h3>Classifica</h3><ol class="giatv-cl">${cl
        .map(
          g =>
            `<li><b>${esc(g.nome)}</b><em>${pt.p[g.uid] || 0}</em><span>${esc(g.pg)}${pt.attori.includes(g.uid) ? ' · miglior attore' : ''}${g.uid === pt.assassino ? ' · assassino' : ''}</span></li>`
        )
        .join('')}</ol>`;
    }
    const tav = (s.giocatori || [])
      .map(
        g =>
          `<li><b>${esc(g.nome)}</b><span>${esc(g.pg)}</span>${s.fase === 'accusa' && votati.has(g.uid) ? `<i>${ic('stretta', 16)}</i>` : ''}</li>`
      )
      .join('');
    const voce = io
      ? `<button class="b sm" data-a="giavoce">${D.voce ? 'Voce sì' : 'Voce no'}</button><button class="b sm" data-a="tvfull">Schermo intero</button>`
      : '';
    return `<div class="giatv"><header class="giatv-top"><div><small>Cena con delitto</small><h1>${esc(s.titolo || '')}</h1></div>
<div class="giatv-fase">${esc(GIA.fase(s))}</div>${GIA.timerH(s, 'giatv-t')}</header>
<main class="giatv-main">${main}</main><aside class="giatv-side">${lato || `<h3>Al tavolo</h3><ul>${tav}</ul>`}</aside>
<footer class="giatv-ctl">${ctl}${voce}</footer></div>`;
  },
};
// motore «di stanza»: la partita nasce vuota, la riempie la regia (le mosse non passano mai di qui)
ENG.giallo = {
  newGame: (n, names, o) => ({
    g: 'giallo',
    fase: 'attesa',
    kit: o.kit,
    titolo: (REGIA.KIT[o.kit] || {}).titolo || '',
    n,
    names,
    cur: 0,
    log: ['La regia prepara la cena'],
    ev: [],
    evn: 0,
    over: null,
    giocatori: [],
    pubblici: [],
    personaggi: [],
    domande: [],
    votati: [],
  }),
  act: () => ({ err: 'Le mosse passano dalla regia' }),
};
setInterval(() => GIA.tick(), 1000);

// ---- vista del telefono ----
function gialloH() {
  if (ui.tv) return GIA.tvH();
  GIA.ascolta();
  const s = G,
    m = GIA.mano,
    sc = m.scheda,
    io = RT.uid();
  const tabs = [
    ['scheda', 'Personaggio'],
    ['indizi', 'Indizi'],
    ['obiettivi', 'Obiettivi'],
  ];
  if (s.fase === 'accusa') tabs.push(['accusa', 'Accusa']);
  if (s.fase === 'finale') tabs.push(['finale', 'Verità']);
  if (!tabs.some(t => t[0] === ui.gtab) || (ui.gfase !== s.fase && (s.fase === 'accusa' || s.fase === 'finale')))
    ui.gtab = s.fase === 'accusa' ? 'accusa' : s.fase === 'finale' ? 'finale' : 'scheda';
  ui.gfase = s.fase;
  const top = `<header class="gia-top"><div><small>${esc(s.titolo || 'Cena con delitto')}</small><b>${esc(GIA.fase(s))}</b></div>${GIA.timerH(s, 'gia-t')}</header>`;
  const nav = `<nav class="gia-tabs">${tabs.map(t => `<button class="${ui.gtab === t[0] ? 'sel' : ''}" data-a="giatab" data-v="${t[0]}">${t[1]}</button>`).join('')}</nav>`;
  let body;
  if (!REGIA.uid)
    body = '<p class="gia-vuoto">Nessuno schermo fa da regia: aprite lo schermo comune e premete «Fai da regista».</p>';
  else if (!sc) body = '<p class="gia-vuoto">La regia ti sta consegnando il personaggio…</p>';
  else
    body = { scheda: giaSchedaH, indizi: giaIndiziH, obiettivi: giaObiettiviH, accusa: giaAccusaH, finale: giaFinaleH }[
      ui.gtab
    ](s, m, io);
  const fine = s.fase === 'finale' ? '<button class="b disc" data-a="tolobby">Torna alla stanza</button>' : '';
  const regole = '<button class="b sm" data-a="rules" data-v="giallo">Regole</button>';
  return `${hudH('Cena con delitto')}<div class="gia">${top}${nav}<main class="gia-body">${body}</main><div class="gia-piede">${fine}${regole}</div></div>${rulesH()}${cfgH()}`;
}
function giaSchedaH(s, m) {
  const sc = m.scheda,
    box = (t, c, cls) => `<div class="gia-box ${cls || ''}"><h3>${t}</h3>${c}</div>`;
  const sa = Object.entries(sc.sa || {})
    .map(([n, t]) => `<li><b>${esc(n)}</b>: ${esc(t)}</li>`)
    .join('');
  const tav = (s.giocatori || []).map(g => `<li>${esc(g.nome)} è <b>${esc(g.pg)}</b></li>`).join('');
  return `<h2 class="gia-nome">${esc(sc.nome)}</h2><p class="gia-ruolo">${esc(sc.ruolo)}</p>
${sc.costume ? box('Costume', `<p>${esc(sc.costume)}</p>`) : ''}${box('La tua storia', `<p>${esc(sc.storia)}</p>`)}
${box('Il tuo segreto', (ui.gseg ? `<p>${esc(sc.segreto)}</p>` : '<p class="muted">Coperto: guardalo quando nessuno sbircia.</p>') + `<button class="b sm" data-a="giaseg">${ui.gseg ? 'Copri' : 'Scopri'}</button>`, 'seg')}
${box('Il tuo alibi', `<p>${esc(sc.alibi)}</p>`)}${sa ? box('Cosa sai degli altri', `<ul>${sa}</ul>`) : ''}${tav ? box('Al tavolo', `<ul>${tav}</ul>`) : ''}`;
}
function giaIndiziH(s, m, io) {
  const miei = Object.values(m)
      .filter(o => o.t === 'indizio')
      .sort((a, b) => a.atto - b.atto),
    altri = (s.giocatori || []).filter(g => g.uid !== io);
  const card = o => {
    let az = '';
    if (!o.da && s.fase === 'atto')
      az =
        ui.gmostra === o.id
          ? `<div class="gia-a">${altri.map(g => `<button class="b sm" data-a="giamostraa" data-v="${esc(o.id)}|${esc(g.uid)}">${esc(g.nome)}</button>`).join('')}<button class="b sm disc" data-a="giamostra" data-v="${esc(o.id)}">Annulla</button></div>`
          : `<button class="b sm gold" data-a="giamostra" data-v="${esc(o.id)}">Mostra a…</button>`;
    return `<article class="gia-ind ${o.da ? 'mostrato' : ''}"><h4>${esc(o.titolo)}<small>atto ${o.atto + 1}${o.da ? ' · te l’ha mostrato ' + esc(o.da) : ''}</small></h4><p>${esc(o.testo)}</p>${az}</article>`;
  };
  const pub = (s.pubblici || []).map(o => card({ ...o, da: 'la TV' })).join('');
  return (
    (miei.length
      ? miei.map(card).join('')
      : '<p class="gia-vuoto">Ancora nessun indizio: arriveranno con gli atti.</p>') +
    (pub ? `<h3 class="gia-h">Sulla TV</h3>${pub}` : '')
  );
}
function giaObiettiviH(s, m) {
  const obs = Object.values(m)
    .filter(o => o.t === 'obiettivi')
    .sort((a, b) => b.atto - a.atto);
  if (!obs.length) return '<p class="gia-vuoto">Gli obiettivi arrivano all’inizio di ogni atto.</p>';
  return obs
    .map(o => {
      const ora = s.fase === 'atto' && o.atto === s.atto;
      return `<div class="gia-box ${ora ? '' : 'passato'}"><h3>Atto ${o.atto + 1}${ora ? ' (in corso)' : ''}</h3><ul class="gia-obs">${o.testi
        .map((t, i) => {
          const f = !!(o.fatti && o.fatti[i]);
          return `<li class="${f ? 'fatto' : ''}">${ora ? `<button class="gia-ck" data-a="giaob" data-v="${o.atto}|${i}" aria-pressed="${f}">${f ? ic('stretta', 16) : ''}</button>` : `<span class="gia-ck">${f ? ic('stretta', 16) : ''}</span>`}<span>${esc(t)}</span></li>`;
        })
        .join('')}</ul></div>`;
    })
    .join('');
}
function giaAccusaH(s, m, io) {
  const v = m.voto || {},
    r = v.risposte || {};
  const sel = (id, opz, cur) =>
    `<select class="sel" id="gq-${id}"><option value="">Scegli…</option>${opz.map(([val, t]) => `<option value="${esc(val)}" ${val === cur ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  const dom = (s.domande || [])
    .map(
      q =>
        `<label class="gia-q"><b>${esc(q.testo)}</b>${sel(q.id, q.tipo === 'personaggio' ? (s.personaggi || []).map(p => [p.id, p.nome]) : q.scelte.map(c => [c, c]), r[q.id])}</label>`
    )
    .join('');
  const att = sel(
    'attore',
    (s.giocatori || []).filter(g => g.uid !== io).map(g => [g.uid, g.nome + ' (' + g.pg + ')']),
    v.attore
  );
  return `<p class="muted">Il voto è segreto: lo vede solo la regia. Puoi cambiarlo finché non viene rivelata la verità.</p>${dom}
<label class="gia-q"><b>Il miglior attore della serata</b>${att}</label>
<button class="b play" data-a="giavota">${v.risposte ? 'Cambia il voto' : 'Accusa'}</button>${v.risposte ? '<p class="gia-ok">Voto ricevuto dalla regia.</p>' : ''}`;
}
function giaFinaleH(s, m, io) {
  const f = s.finale;
  if (!f) return '<p class="gia-vuoto">La regia sta per rivelare la verità…</p>';
  const pt = f.punti,
    mio = (f.voti || {})[io] || {},
    cl = (s.giocatori || []).slice().sort((a, b) => (pt.p[b.uid] || 0) - (pt.p[a.uid] || 0));
  return `<div class="gia-box"><h3>L’assassino era</h3><p class="gia-chi">${esc(f.chi)}</p>${(s.domande || [])
    .filter(q => q.id !== 'chi')
    .map(
      q =>
        `<p><b>${esc(q.testo)}</b> ${esc(f.risposte[q.id])}${mio[q.id] ? (mio[q.id] === f.risposte[q.id] ? ' · hai indovinato' : ' · hai sbagliato') : ''}</p>`
    )
    .join('')}</div>
<div class="gia-box"><h3>Com’è andata</h3><ol>${f.ricostruzione.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>
<div class="gia-box"><h3>Punti</h3><ol class="gia-cl">${cl
    .map(
      g =>
        `<li class="${g.uid === io ? 'io' : ''}"><span>${esc(g.nome)} · ${esc(g.pg)}${pt.attori.includes(g.uid) ? ' · miglior attore' : ''}${g.uid === pt.assassino ? ' · assassino' : ''}</span><b>${pt.p[g.uid] || 0}</b></li>`
    )
    .join('')}</ol>${pt.franca ? '<p>L’assassino l’ha fatta franca.</p>' : ''}</div>`;
}
function gialloClick(a, v) {
  const m = GIA.mano;
  if (a === 'giatab') {
    ui.gtab = v;
    return render();
  }
  if (a === 'giaseg') {
    ui.gseg = !ui.gseg;
    return render();
  }
  if (a === 'giamostra') {
    ui.gmostra = ui.gmostra === v ? null : v;
    return render();
  }
  if (a === 'giamostraa') {
    const [indizio, uid] = String(v).split('|');
    ui.gmostra = null;
    render();
    return GIA.chiedi({ t: 'mostra', indizio, a: uid }, 'Indizio mostrato a ' + GIA.nomeDi(G, uid));
  }
  if (a === 'giaob') {
    const [atto, i] = String(v).split('|').map(Number),
      ob = m['ob' + atto] || {};
    return GIA.chiedi({ t: 'obiettivo', atto, i, fatto: !(ob.fatti && ob.fatti[i]) });
  }
  if (a === 'giavota') {
    const val = id => (document.getElementById('gq-' + id) || {}).value || '',
      risposte = {};
    for (const q of G.domande || []) risposte[q.id] = val(q.id);
    if (Object.values(risposte).some(x => !x)) return say('Rispondi a tutte le domande', 2500);
    GIA.chiedi({ t: 'voto', risposte }, 'Accusa inviata');
    if (val('attore')) GIA.chiedi({ t: 'attore', per: val('attore') });
    return;
  }
  // comandi della regia (TV)
  if (!ui.tv || !REGIA.sono()) return;
  if (a === 'giaavanti') return GIA.comanda({ t: 'avanti' });
  if (a === 'giatempo') return GIA.comanda({ t: 'tempo', ms: +v });
  if (a === 'giavoce') {
    GIA.D.voce = !GIA.D.voce;
    if (!GIA.D.voce)
      try {
        speechSynthesis.cancel();
      } catch (e) {
        ERR.n(e);
      }
    return render();
  }
}
