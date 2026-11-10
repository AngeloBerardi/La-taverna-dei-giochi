/* ================= SERATA: cena con delitto per famiglie (TV regista, console del narratore, dossier) =================
   Motore puro in motori/36a-serata.js (SERATA), guida in docs/SERATA.md. Stessi canali sicuri della regia (REGIA in
   24u-regia.js): la TV regista tiene kit e soluzione e consegna a ogni telefono solo la sua mano; il narratore è un
   telefono della stanza che riceve la console come mano e manda comandi numerati. Il PC della TV si può comandare anche
   da tastiera (spazio = avanti, P = pausa). Un kit privato si apre dal computer della TV e resta solo lì.
   Viste: SER.tvH (sala), SER.conH (console), SER.telH (ospite). Un solo comando: data-a="ser" data-v="verbo:arg". */
const SER = {
  // ---- registrazione (GAMES in 07-nucleo.js) ----
  elenco: () => Object.entries(REGIA.KIT).filter(([, k]) => k.formato === 'serata'),
  kits: () =>
    SER.elenco()
      .map(([id, k]) => [id, k.titolo + ' · ' + k.giocatori.join('–')])
      .concat([['privato', 'Kit privato dal computer della TV']]),
  range: () => '1–40',
  ok: n => n >= 2 && n <= 42,
  check(S, o) {
    if (!o || !o.kit) return 'Scegli la serata';
    if (!R.on || R.mode !== 'rt') return 'La serata si gioca solo in una stanza online';
    if (S.some(x => x.k !== 'm')) return 'Serve un telefono a testa: togli gli ospiti';
    if (S.some(x => !x.uid)) return 'Qualcuno non ha ancora il profilo online: aspettate qualche secondo';
    if (!REGIA.uid) return 'Prima collega lo schermo comune e premi «Fai da regista» sulla TV';
    return '';
  },
  KEY_PRIV: 'serata-kit-privato',
  privato() {
    try {
      const t = localStorage.getItem(SER.KEY_PRIV);
      return t ? JSON.parse(t) : null;
    } catch (e) {
      return null;
    }
  },
  testo: t => esc(t).replace(/\n/g, '<br>'),
  mmss(t) {
    const r = Math.max(0, Math.ceil((t - Date.now()) / 1000));
    return Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0');
  },
  // ---- linguaggio comune di TV e telefono: icone a tratto, momenti, regole di parola, orologio ----
  ICO: {
    mattina: '<path d="M7 9a5 5 0 1 1 9 3c-1.5 1.5-2 2-2 4a3 3 0 0 1-6 0"/><path d="M12 9a1.5 1.5 0 0 1 3 0"/>',
    pomeriggio: '<circle cx="13" cy="4.5" r="1.8"/><path d="M9 21l2-6-2-3 3-3 3 3 3 1M9 12l-3 2"/>',
    sera: '<path d="M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C10 9 11 9.5 11 10c1-2 .5-5 1-7z"/><path d="M9 21h6"/>',
    portavoce: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    tutti: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 14c3 0 6 1.5 6 4"/>',
    famiglia: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    ora: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    prove: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    bacheca: '<rect x="3" y="4" width="7" height="6" rx="1"/><rect x="14" y="14" width="7" height="6" rx="1"/><path d="M10 7c5 0 3 10 4 10"/>',
    io: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    cerca: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    avanti: '<path d="M9 5l7 7-7 7"/>',
    pausa: '<path d="M8 5v14M16 5v14"/>',
    spunta: '<path d="M5 12l5 5 9-10"/>',
  },
  ico(n, sz) {
    const p = n === 'persone' ? SER.ICO.tutti : SER.ICO[n] || '';
    return `<svg class="sr-ico" width="${sz || 24}" height="${sz || 24}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  },
  // i tre momenti: chi può parlare agli altri e che cosa si fa
  MOM: {
    mattina: {
      verbo: 'Ascolta',
      regola: 'portavoce',
      testo: 'Ascoltate la regia. Agli altri parla <b>solo il portavoce</b> di ogni famiglia.',
      tel: 'La regia sta parlando. Agli altri parla solo il portavoce.',
    },
    pomeriggio: {
      verbo: 'Muoviti',
      regola: 'tutti',
      testo: 'Tempo libero: <b>potete parlare con chiunque</b> e mostrare le vostre prove.',
      tel: 'Tempo libero: parla con chiunque, mostra e chiedi prove.',
    },
    sera: {
      verbo: 'In famiglia',
      regola: 'famiglia',
      testo: 'Si parla <b>solo dentro la propria famiglia</b>. Niente scambi fino al mattino.',
      tel: 'Si parla solo dentro la famiglia. Lavorate sulla bacheca.',
    },
  },
  REGOLE: [
    ['portavoce', 'Portavoce'],
    ['tutti', 'Tutti'],
    ['famiglia', 'Famiglia'],
  ],
  // le tre regole di parola, sempre uguali; quella in vigore è accesa
  regoleH: att =>
    `<div class="sr-chips" aria-label="Chi può parlare adesso">${SER.REGOLE.map(([id, n]) => `<span class="${id === att ? 'on' : ''}">${SER.ico(id, 26)}${n}</span>`).join('')}</div>`,
  // il tempo che scorre, sempre in alto a destra: alla rovescia se il momento ha un tempo massimo, altrimenti da quanto dura
  su(da) {
    const r = Math.max(0, Math.floor((Date.now() - da) / 1000));
    return Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0');
  },
  orologio(g) {
    if (g.pausa) return '<span class="sr-clock sr-pz">Pausa</span>';
    if (g.fino) return `<span class="sr-clock" data-fino="${g.fino}">${SER.mmss(g.fino)}</span>`;
    if (g.da) return `<span class="sr-clock sr-su" data-da="${g.da}" title="da quanto dura">${SER.su(g.da)}</span>`;
    return '';
  },
  // anello del pomeriggio: si svuota col tempo (aggiornato da tick)
  anelloH(g) {
    const R0 = 148,
      C = +(2 * Math.PI * R0).toFixed(1);
    return `<div class="sr-anello"><svg viewBox="0 0 330 330" aria-hidden="true"><circle cx="165" cy="165" r="${R0}" class="sr-bg"/><circle cx="165" cy="165" r="${R0}" class="sr-arco" data-fino="${g.fino || 0}" data-tot="${g.tot || 0}" data-c="${C}" stroke-dasharray="${C}" stroke-dashoffset="0" transform="rotate(-90 165 165)"/></svg>
<div class="sr-anello-t">${g.pausa ? '<span>Pausa</span>' : g.fino ? `<span data-fino="${g.fino}">${SER.mmss(g.fino)}</span>` : ''}<small>poi si cena</small></div></div>`;
  },
  timerH: (fino, cls) => (fino ? `<span class="${cls}" data-fino="${fino}">${SER.mmss(fino)}</span>` : ''),
  nomeP: (pid, s) => ((s || G).cast || []).find(c => c.id === pid)?.nome || pid,
  nomeF: (f, s) => ((s || G).famiglie || []).find(x => x.id === f)?.nome || f,

  // ---- telefono: ciò che ho in mano ----
  mano: {},
  _code: '',
  _un: null,
  _av: 0,
  _msg: 0,
  ascolta() {
    if (SER._un && SER._code === R.code) return;
    SER.smetti();
    if (!REGIA.pronto() || !R.code) return;
    SER._code = R.code;
    SER._un = REGIA.ascoltaMiei(R.code, m => {
      const av = m.avviso;
      if (av && av.t !== SER._av) {
        SER._av = av.t;
        if (Date.now() - av.t < 60000) say(av.testo, 3500);
      }
      // una busta nuova: vibrazione e avviso in alto
      const l = (m.msg && m.msg.l) || [],
        ult = l[l.length - 1];
      if (ult && ult.n > SER._msg) {
        if (SER._msg && navigator.vibrate) navigator.vibrate(ult.tipo === 'turno' ? [200, 80, 200] : 120);
        SER._msg = ult.n;
      }
      SER.mano = m;
      if (ui.screen === 'game') render();
    });
  },
  smetti() {
    if (SER._un)
      try {
        SER._un();
      } catch (e) {
        ERR.n(e);
      }
    SER._un = null;
    SER._code = '';
    SER.mano = {};
  },
  async chiedi(a, ok) {
    try {
      await REGIA.chiedi(R.code, a);
      if (ok) say(ok, 1600);
    } catch (e) {
      say('Non inviato: ' + (e && e.message ? e.message : e), 3000);
    }
  },
  // i comandi del narratore sono numerati: un doppio tocco o un reinvio si applica una volta sola
  _seq: 0,
  cmd(c, x) {
    SER._seq = Math.max(Date.now(), SER._seq + 1);
    return SER.chiedi({ t: 'cmd', c, seq: SER._seq, ...(x || {}) });
  },

  // ---- regia (solo sulla TV che ha preso il ruolo) ----
  D: {
    k: null,
    s: null,
    gid: '',
    narr: '',
    inv: {},
    vist: {},
    un: null,
    q: Promise.resolve(),
    err: '',
    erroDi: '',
    frase: '',
    carica: false,
    cueN: 0,
    mostra: null,
  },
  async avvia() {
    const g = G,
      D = SER.D;
    if (!g || g.g !== 'serata' || !REGIA.sono() || D.gid === g.gid || D.carica || D.erroDi === g.gid) return; // dopo un errore si riparte solo da un tocco
    D.carica = true;
    D.err = '';
    try {
      if (D.un) D.un();
      D.un = null;
      D.s = null;
      D.narr = '';
      if (g.kit === 'privato') {
        D.k = SER.privato();
        if (!D.k) throw new Error('Apri il kit privato dal computer della TV');
      } else D.k = await SER.sblocca(await REGIA.kit(g.kit));
      const e = SERATA.valida(D.k);
      if (e.length) throw new Error('Kit non valido: ' + e[0]);
      const salvato = await REGIA.carica(R.code);
      if (salvato && salvato.gid === g.gid) {
        D.s = salvato.s;
        D.narr = salvato.narr || '';
        D.cueN = D.s && D.s.cue ? D.s.cue.n : 0; // dopo un riavvio non risuona nulla da solo
      } else await REGIA.pulisci(R.code);
      D.gid = g.gid;
      D.inv = {};
      D.vist = {};
      await SER.salva();
      D.un = REGIA.ascoltaAzioni(R.code, l => SER.richieste(l));
    } catch (e) {
      D.err = String((e && e.message) || e);
      D.frase = (e && e.frase) || ''; // kit cifrato: la TV chiede la frase
      D.erroDi = g.gid; // niente nuovi tentativi da soli: ogni disegno della TV riproverebbe e il kit non si leggerebbe mai
      D.gid = '';
    } finally {
      D.carica = false;
      render();
    }
  },
  // un kit cifrato (src/kit-cifrati, vedi motori/36b-kit-cifrati.js) si apre con la frase, che il PC della TV ricorda
  KEY_FRASE: 'serata-frase-',
  async sblocca(k) {
    if (!k || k.formato !== 'cifrato') return k;
    let f = '';
    try {
      f = localStorage.getItem(SER.KEY_FRASE + k.id) || '';
    } catch (e) {}
    if (!f) throw Object.assign(new Error('Questo kit è segreto: scrivi la frase per aprirlo'), { frase: k.id });
    try {
      return await KITC.apri(k, f);
    } catch (e) {
      if (!e.sbagliata) throw e;
      try {
        localStorage.removeItem(SER.KEY_FRASE + k.id);
      } catch (x) {}
      throw Object.assign(new Error('La frase non apre questo kit: riprova'), { frase: k.id });
    }
  },
  riprova() {
    Object.assign(SER.D, { err: '', frase: '', erroDi: '', gid: '' });
    return SER.avvia();
  },
  fraseH() {
    const D = SER.D;
    return `<form class="sr-frase" onsubmit="return false"><input id="sr-frase" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Frase del kit"><button class="b gold" data-a="ser" data-v="frase:${esc(D.frase)}">Apri il kit</button></form>`;
  },
  // dal casting alla serata: chi non è il narratore riceve un personaggio
  async inizia() {
    const D = SER.D;
    if (!D.k || D.s) return;
    const S = seatsNow().filter(x => x.uid && x.uid !== D.narr);
    const r = SERATA.nuova(
      D.k,
      S.map(x => ({ uid: x.uid, nome: x.name })),
      { rnd: Math.random, narratore: D.narr }
    );
    if (r.err) return say(r.err, 4000);
    D.s = r.s;
    D.cueN = 0;
    await SER.salva();
    render();
  },
  salva() {
    const D = SER.D;
    return (D.q = D.q
      .then(async () => {
        const code = R.code,
          s = D.s,
          giri = [];
        await REGIA.salva(code, { gid: D.gid, s, narr: D.narr });
        if (s) {
          const m = SERATA.mani(s, D.k);
          for (const u of Object.keys(m))
            for (const [key, o] of Object.entries(m[u])) {
              const j = JSON.stringify(o),
                id = u + '/' + key;
              if (D.inv[id] !== j) giri.push(REGIA.consegna(code, u, key, o).then(() => (D.inv[id] = j)));
            }
        }
        await Promise.all(giri);
        await SER.pubblica();
      })
      .catch(e => {
        D.err = String((e && e.message) || e);
        render();
      }));
  },
  async pubblica() {
    const D = SER.D,
      s = D.s,
      S = seatsNow();
    const pub = s
      ? SERATA.pubblico(s, D.k)
      : { formato: 'serata', fase: 'casting', titolo: D.k.titolo, narr: D.narr, attesi: D.k.giocatori };
    pub.tema = D.k.tema || null;
    let over = null;
    if (s && s.fase === 'fine' && s.ris) {
      const scores = S.map(x => (s.ris.ind[x.uid] ? s.ris.ind[x.uid].tot : 0)),
        top = Math.max(...scores);
      over = { scores, winners: scores.map((v, i) => (v === top && top > 0 ? i : -1)).filter(i => i >= 0) };
    }
    await RT.transactRoom(R.code, cur => {
      if (!cur || cur.phase !== 'play' || !cur.s || cur.s.gid !== D.gid) return;
      const o = cur.s;
      return {
        ...cur,
        rev: (cur.rev || 0) + 1,
        s: {
          ...pub,
          g: 'serata',
          gid: D.gid,
          kit: o.kit,
          n: o.n,
          names: o.names,
          cur: 0,
          log: [],
          ev: [],
          evn: (o.evn || 0) + 1,
          over,
        },
      };
    });
  },
  // richieste dei telefoni: l'uid è quello del percorso, mai quello scritto dentro
  richieste(l) {
    const D = SER.D;
    let nuove = 0;
    for (const x of l) {
      if (D.vist[x.id]) continue;
      D.vist[x.id] = 1;
      nuove++;
      D.q = D.q
        .then(async () => {
          let err = '';
          if (!D.s) {
            if (x.a.t === 'narratore') D.narr = D.narr && D.narr !== x.uid ? D.narr : x.uid;
            else if (x.a.t === 'nonarratore' && D.narr === x.uid) D.narr = '';
            else err = 'La serata non è ancora cominciata';
          } else {
            const r = SERATA.act(D.s, { ...x.a, uid: x.uid }, D.k, Date.now());
            if (r.err) err = r.err;
            else D.s = r.s;
          }
          if (err) await REGIA.consegna(R.code, x.uid, 'avviso', { t: Date.now(), testo: err });
          await REGIA.consuma(R.code, x.uid, x.id);
        })
        .catch(e => ERR.n(e));
    }
    if (nuove) SER.salva().then(() => render());
  },
  // comandi dati dal PC della TV (tastiera o mouse): valgono come quelli del narratore
  comanda(c, x) {
    const D = SER.D;
    if (!D.s) return;
    const r = SERATA.act(D.s, { t: 'cmd', uid: '__tv', c, ...(x || {}) }, D.k, Date.now());
    if (r.err) return say(r.err, 2500);
    D.s = r.s;
    SER.salva();
    render();
  },
  // ogni secondo: orologi, riserve a tempo, fine del pomeriggio
  tick() {
    for (const el of document.querySelectorAll('[data-fino]')) {
      el.textContent = SER.mmss(+el.dataset.fino);
      el.classList.toggle('sr-ultimo', +el.dataset.fino - Date.now() <= 60000);
    }
    for (const el of document.querySelectorAll('[data-da]')) el.textContent = SER.su(+el.dataset.da);
    for (const el of document.querySelectorAll('.sr-arco[data-fino]')) {
      const tot = +el.dataset.tot,
        fino = +el.dataset.fino;
      if (tot > 0 && fino) {
        const f = Math.max(0, Math.min(1, (fino - Date.now()) / tot));
        el.style.strokeDashoffset = (+el.dataset.c * (1 - f)).toFixed(1);
      }
    }
    const D = SER.D;
    if (!ui.tv || !G || G.g !== 'serata' || !D.s || !REGIA.sono() || D.gid !== G.gid) return;
    const r = SERATA.tick(D.s, D.k, Date.now());
    if (r) {
      D.s = r.s;
      SER.salva();
      render();
    }
    // la prova a tutto schermo resta 15 secondi, o finché non cambia il momento della giornata
    if (D.mostra && (Date.now() > D.mostra.fino || D.mostra.mom !== D.s.atto + D.s.mom)) {
      D.mostra = null;
      render();
    }
  },
  // dopo ogni ridisegno: la TV suona e mostra i comandi nuovi del copione, i telefoni ascoltano la propria mano
  dopo() {
    const D = SER.D;
    if (!ui.tv) {
      SER.ascolta();
      Snd.duck(true);
      return;
    }
    const c = D.s && D.s.cue;
    if (!c || c.n <= D.cueN) return;
    D.cueN = c.n;
    if (c.tipo === 'audio') SER.suona(c.id);
    if (c.tipo === 'mostra') D.mostra = { id: c.id, fino: Date.now() + 15000, mom: D.s.atto + D.s.mom };
    if (c.tipo === 'sigillo') Snd.play('gbattito');
    if (c.tipo === 'passo') Snd.play('gbattito');
    setTimeout(render, 30);
  },
  // l'audio del kit: il file registrato, sempre dallo stesso buffer (la seconda volta è identico); senza file, la voce
  _buf: {},
  async suona(id) {
    const a = ((SER.D.k && SER.D.k.audio) || []).find(x => x.id === id);
    if (!a) return;
    if (a.file) {
      try {
        const ctx = (SER._ctx = SER._ctx || new (window.AudioContext || window.webkitAudioContext)());
        if (!SER._buf[id]) SER._buf[id] = await ctx.decodeAudioData(await (await fetch(a.file)).arrayBuffer());
        const src = ctx.createBufferSource();
        src.buffer = SER._buf[id];
        src.connect(ctx.destination);
        src.start();
        return;
      } catch (e) {
        ERR.n(e);
      }
    }
    if (window.speechSynthesis && a.testo) {
      const u = new SpeechSynthesisUtterance(a.testo);
      u.lang = 'it-IT';
      u.rate = 0.9;
      u.pitch = 0.8;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }
  },
  // un kit privato dal computer della TV: resta nel browser di quel PC, mai sul sito né nel database
  apriFile() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      try {
        const t = await f.text(),
          k = JSON.parse(t),
          e = SERATA.valida(k);
        if (e.length) return say('Kit non valido: ' + e[0], 6000);
        localStorage.setItem(SER.KEY_PRIV, t);
        say('Kit «' + k.titolo + '» pronto su questo computer', 3000);
        SER.riprova();
      } catch (err) {
        say('File non leggibile: ' + (err.message || err), 4000);
      }
    };
    inp.click();
  },

  // ======================= TV =======================
  tvH() {
    const g = G,
      D = SER.D,
      io = REGIA.sono();
    if (io) SER.avvia();
    const s = io && D.gid === g.gid ? D.s : null,
      k = io ? D.k : null;
    const pal = (g.tema && g.tema.palette) || {};
    const stile = Object.entries({
      fondo: '--sr-fondo',
      carta: '--sr-carta',
      inchiostro: '--sr-ink',
      accento: '--sr-acc',
      sangue: '--sr-rosso',
    })
      .filter(([c]) => pal[c])
      .map(([c, v]) => v + ':' + pal[c])
      .join(';');
    let main = '';
    if (D.err && io) {
      main = `<div class="sr-c"><p class="err">${esc(D.err)}</p>${g.kit === 'privato' ? '<button class="b gold" data-a="ser" data-v="file">Apri il kit dal computer</button>' : ''}${D.frase ? SER.fraseH() : g.kit === 'privato' ? '' : '<button class="b gold" data-a="ser" data-v="riprova">Riprova</button>'}</div>`;
    } else if (g.fase === 'casting' || !g.fase) main = SER.tvCasting(g, io);
    else if (D.mostra && k && io) {
      const p = k.prove.find(x => x.id === D.mostra.id);
      main = p
        ? `<article class="sr-doc sr-grande"><small>${esc(p.id)}</small><h2>${esc(p.titolo)}</h2><p>${SER.testo(p.testo)}</p></article>`
        : '';
    } else if (g.fase === 'pronta') main = SER.tvCast(g);
    else if (g.fase === 'gioco') main = SER.tvGioco(g);
    else if (g.fase === 'voto')
      main = `<div class="sr-c"><h2>Si vota</h2><p class="sr-buste">${'<i></i>'.repeat(g.votati)}</p><p>${g.votati} voti su ${g.votanti}</p></div>`;
    else if (g.finale) main = SER.tvFinale(g);
    const mid = g.fase === 'gioco' && g.mom ? g.mom.id : '',
      M = SER.MOM[mid];
    const luci = (g.sigilli || [])
      .map(x => `<li class="${x.on ? 'on' : 'off'}" title="${esc(x.nome)}"><i></i>${esc(x.id)}</li>`)
      .join('');
    const sx = g.atto
      ? `Atto ${esc(g.atto.id)}${g.atto.titolo ? ' · ' + esc(g.atto.titolo) : ''}`
      : esc(g.mondo || 'Cena con delitto in famiglie');
    const pill = g.pausa
      ? `<div class="sr-pill sr-in-pausa">${SER.ico('pausa', 28)}Pausa tecnica</div>`
      : M
        ? `<div class="sr-pill">${SER.ico(mid, 28)}${esc(g.mom.nome)} · ${M.verbo}</div>`
        : '<div></div>';
    const dx = g.fase === 'casting' || !g.fase ? `<span class="sr-stanza">Stanza ${esc(R.code || '')}</span>` : SER.orologio(g);
    const tasti = io && D.s && !D.s.narr ? '<span class="sr-tasti">Spazio: avanti · P: pausa</span>' : '';
    const regole = M
      ? `<footer class="sr-regole"><p>${M.testo}</p>${SER.regoleH(M.regola)}${tasti}</footer>`
      : `<footer class="sr-regole sr-vuoto">${tasti}</footer>`;
    return `<div class="sr-tv" data-mom="${mid}" style="${stile}">
<header class="sr-top"><div class="sr-atto">${sx}</div>${pill}<div class="sr-dx">${luci ? `<ol class="sr-sigilli">${luci}</ol>` : ''}${dx}</div></header>
<main class="sr-main">${main}</main>${regole}</div>`;
  },
  tvCasting(g, io) {
    const D = SER.D,
      S = seatsNow(),
      k = io ? D.k : null,
      narr = S.find(x => x.uid === D.narr);
    const n = S.filter(x => x.uid !== D.narr).length,
      a = g.attesi || (k && k.giocatori) || [0, 0];
    const posti = S.map(
      x =>
        `<li class="${x.uid === D.narr ? 'nar' : ''}"><span class="sr-vol">${esc((x.name || '?')[0].toUpperCase())}</span><b>${esc(x.name)}</b>${x.uid === D.narr ? '<small>narratore</small>' : io ? `<button class="b sm" data-a="ser" data-v="narr:${esc(x.uid)}">Narratore</button>` : ''}</li>`
    ).join('');
    const passi = [
      'Ognuno riceve un personaggio, segreto compreso.',
      'Ogni giorno ha tre momenti: si ascolta, si gira, si discute.',
      'Chi sa qualcosa lo scambia con gli altri: da soli non si risolve.',
    ]
      .map((t, i) => `<li><span>${i + 1}</span>${t}</li>`)
      .join('');
    return `<div class="sr-acc">
<section class="sr-tit"><h1>${esc(g.titolo || '')}</h1><p class="sr-sot">${esc((k && (k.sottotitolo || k.mondo)) || g.mondo || '')}</p><ol class="sr-passi3">${passi}</ol></section>
<aside class="sr-ben"><b>${n}</b><small>${a[1] ? 'ospiti, ne servono da ' + a[0] + ' a ' + a[1] : 'ospiti'}</small>
<p>${narr ? 'Narratore: <b>' + esc(narr.name) + '</b>' : 'Il narratore tocca «Faccio il narratore» sul suo telefono.'}</p>
${io ? `<button class="b gold" data-a="ser" data-v="inizia" ${n < a[0] || n > a[1] ? 'disabled' : ''}>Assegna i personaggi e comincia</button>` : ''}</aside>
<ul class="sr-posti">${posti}</ul></div>`;
  },
  tvCast(g) {
    const fam = (g.famiglie || [])
      .map(
        f =>
          `<section class="sr-fam"><h3>${esc(f.nome)}</h3><ul>${(g.cast || [])
            .filter(c => c.fam === f.id)
            .map(c => `<li class="${c.on ? '' : 'via'}"><b>${esc(c.nome)}</b><small>${esc(c.ruolo)}</small></li>`)
            .join('')}</ul></section>`
      )
      .join('');
    return `<div class="sr-cast">${fam}</div>`;
  },
  tvGioco(g) {
    const t = g.turno,
      ult = (g.pubbliche || []).slice(-1)[0],
      mid = g.mom && g.mom.id;
    // famiglie: nome, passi avanti già fatti e, la sera, se hanno consegnato
    const fams = (g.famiglie || [])
      .map(
        f =>
          `<li class="${f.inviato ? 'ok' : ''}"><b>${esc(f.nome)}</b><span>${f.passi.length}<small> passi</small></span></li>`
      )
      .join('');
    if (mid === 'mattina') {
      const d = (g.dich || []).slice(-3).reverse();
      return t
        ? `<div class="sr-fuoco sr-turno"><small>Ora parla</small><h2>${esc(t.nome)}</h2><p>${esc((g.cast.find(c => c.id === t.pid) || {}).ruolo || '')}</p></div>`
        : d.length
          ? `<ul class="sr-dich">${d.map(x => `<li class="${x.tipo}"><b>${esc(x.nomeFam)}</b> ${x.tipo === 'accusa' ? 'accusa' : 'dichiara'}: ${esc(x.testo)}</li>`).join('')}</ul>`
          : ult
            ? `<div class="sr-fuoco sr-prova"><article class="sr-doc"><span class="sr-bollo">Prova ${esc(ult.id)}</span><small>${esc(ult.tipo || 'documento')}</small><h2>${esc(ult.titolo)}</h2><p>${SER.testo(ult.testo)}</p></article></div>`
            : '<div class="sr-fuoco"><p class="sr-muto">Ascoltate il narratore</p></div>';
    }
    if (mid === 'pomeriggio') {
      const fra = Object.values(g.fra || {}).reduce((a, n) => a + n, 0);
      return `<div class="sr-fuoco sr-giro">${SER.anelloH(g)}<div class="sr-testa"><h2>Girate, parlate,<br>confrontatevi.</h2>
<div class="sr-cifre"><div><b>${fra}</b><small>prove mostrate tra famiglie</small></div><div><b>${Object.keys(g.fra || {}).length}</b><small>coppie di famiglie in contatto</small></div></div>
<ul class="sr-famiglie">${fams}</ul></div></div>`;
    }
    return `<div class="sr-fuoco sr-consiglio"><h2>Consiglio di famiglia</h2>
<ul class="sr-tavoli">${(g.famiglie || [])
      .map(
        f =>
          `<li class="${f.inviato ? 'ok' : ''}"><div><b>${esc(f.nome)}</b><span>${f.inviato ? SER.ico('spunta', 20) + 'Ipotesi scritta' : 'Discutono'}</span></div><ul>${(g.cast || [])
            .filter(c => c.fam === f.id)
            .map(c => `<li class="${c.on ? '' : 'via'}">${esc(c.nome)}</li>`)
            .join('')}</ul><small>${f.passi.length} passi avanti</small></li>`
      )
      .join('')}</ul></div>`;
  },
  tvFinale(g) {
    const f = g.finale,
      r = f.ris || {};
    const ric = f.ricostruzione.map(t => `<p>${esc(t)}</p>`).join('');
    const famTop = (r.famiglia || []).map(x => esc(SER.nomeF(x, g))).join(', ');
    const det = (r.detective || []).map(u => esc(SER.nomeP((r.ind[u] || {}).pid, g))).join(', ');
    const gen = (r.generoso || []).map(p => esc(SER.nomeP(p, g))).join(', ');
    return `<div class="sr-c sr-fin"><h2>${f.passo ? esc(f.nome) : 'La verità'}</h2>${ric}
${f.epilogo.length ? f.epilogo.map(t => `<p class="sr-epi">${esc(t)}</p>`).join('') : ''}
<ul class="sr-premi"><li>Hanno preso il colpevole: <b>${r.presi}/${r.votanti}</b>${r.franca ? ' · l’ha fatta franca' : ''}</li>
${famTop ? `<li>Famiglia migliore: <b>${famTop}</b></li>` : ''}${det ? `<li>Miglior detective: <b>${det}</b></li>` : ''}${gen ? `<li>Più generoso: <b>${gen}</b></li>` : ''}</ul></div>`;
  },

  // ======================= CONSOLE DEL NARRATORE =======================
  conH(c) {
    const M = SER.MOM[c.mom],
      fase = c.fase === 'gioco' ? 'Regia · Atto ' + c.atto.id + ' · ' + ({ mattina: 'Mattina', pomeriggio: 'Pomeriggio', sera: 'Sera' }[c.mom] || c.mom) : 'Regia · ' + c.fase;
    const tot = c.righe.length,
      qui = c.righe.find(r => r.i === c.riga),
      poi = c.righe.find(r => r.i === c.riga + 1);
    const tipo = r =>
      r.cue
        ? ['Comando', 'cue']
        : r.chi
          ? ['Leggi ad alta voce · ' + r.chi, 'voce']
          : ['Regia: fai o di’', 'regia'];
    const segm = c.righe
      .map(r => `<span class="${r.i < c.riga ? 'f' : r.i === c.riga ? 'q' : ''}"></span>`)
      .join('');
    const righe = c.righe
      .map(r => {
        const cls = r.i === c.riga ? 'qui' : r.i < c.riga ? 'fatta' : '';
        const cue = r.cue ? '<em>' + esc(r.cue) + '</em>' : '';
        return `<li class="${cls}">${r.chi ? '<b>' + esc(r.chi) + '</b> ' : ''}${esc(r.regia || r.testo || '')}${cue}</li>`;
      })
      .join('');
    const dom = c.domande
      .map(
        d =>
          `<li><b>${esc(d.fam)}</b> ${esc(d.testo)}<input id="sr-r${d.n}" placeholder="Risposta (solo su materiale già uscito)"><button class="b sm" data-a="ser" data-v="rispondi:${d.n}">Rispondi</button></li>`
      )
      .join('');
    const prop = c.proposte
      .map(
        p =>
          `<li>${esc(p.testo)} <button class="b sm gold" data-a="ser" data-v="prop:${p.n}:1">Sì</button><button class="b sm" data-a="ser" data-v="prop:${p.n}:0">No</button></li>`
      )
      .join('');
    const nr = c.proposte.length + c.domande.length;
    const tab = ui.srcon || 'copione';
    const tabs = [
      ['copione', 'Copione'],
      ['richieste', 'Richieste' + (nr ? ' (' + nr + ')' : '')],
      ['famiglie', 'Famiglie'],
      ['prove', 'Prove'],
      ['persone', 'Persone'],
      ['altro', 'Altro'],
    ]
      .map(([id, n]) => `<button class="${tab === id ? 'sel' : ''}" data-a="ser" data-v="ctab:${id}">${n}</button>`)
      .join('');
    let corpo = '';
    if (tab === 'copione') {
      if (c.mom === 'mattina' && qui) {
        const [lab, cls] = tipo(qui);
        corpo = `<section class="sr-cue ${cls}"><small>${esc(lab)}</small><p>${esc(qui.regia || qui.testo || '')}</p>${qui.cue ? `<em>${esc(qui.cue)}</em>` : ''}</section>
${poi ? `<section class="sr-poi"><small>Poi</small><p>${poi.chi ? '<b>' + esc(poi.chi) + '</b> ' : ''}${esc(poi.regia || poi.testo || '')}${poi.cue ? ' <em>' + esc(poi.cue) + '</em>' : ''}</p></section>` : ''}
<details class="sr-tutto"><summary>Tutto il copione (${tot} passi)</summary><ol class="sr-copione">${righe}</ol></details>`;
      } else
        corpo = `<section class="sr-cue regia"><small>${c.fase === 'gioco' ? 'Che cosa fare adesso' : 'Regia'}</small><p>${esc((c.momento && c.momento.istruzioni) || c.atto?.obiettivo || 'Aspetta che gli ospiti lavorino, poi premi avanti.')}</p></section>${(c.atto?.sblocchi || []).map(x => `<p class="muted">Per sbloccare: ${esc(x)}</p>`).join('')}`;
    }
    if (tab === 'richieste')
      corpo =
        prop || dom
          ? `${prop ? `<ul class="sr-prop">${prop}</ul>` : ''}${dom ? `<ul class="sr-prop">${dom}</ul>` : ''}`
          : '<p class="muted">Nessuna richiesta dalle famiglie.</p>';
    if (tab === 'famiglie')
      corpo = `<ul class="sr-clist">${c.famiglie
        .map(
          f =>
            `<li><b>${esc(f.nome)}</b> · rappr. ${esc(f.pv)} · ${f.passi} passi${f.mod ? ' · modulo consegnato' : ''}<button class="b sm" data-a="ser" data-v="sblocca:${f.id}">Suggerimento</button></li>`
        )
        .join('')}</ul><input id="sr-sbl" placeholder="Testo del suggerimento alla famiglia">`;
    if (tab === 'prove')
      corpo = `<ul class="sr-clist">${c.prove
        .map(
          p =>
            `<li class="${p.st}"><b>${esc(p.id)}</b> ${esc(p.titolo)} <small>${esc(p.st)} · atto ${esc(p.atto)}</small>${p.st === 'sigillata' || p.st === 'annunciata' ? `<button class="b sm" data-a="ser" data-v="rilascia:${p.id}">Rilascia</button>` : ''}${p.st !== 'pubblica' ? `<button class="b sm" data-a="ser" data-v="pubblica:${p.id}">A tutti</button>` : `<button class="b sm" data-a="ser" data-v="pubblica:${p.id}">Sulla TV</button>`}</li>`
        )
        .join('')}</ul>`;
    if (tab === 'persone')
      corpo = `<ul class="sr-clist">${c.persone
        .map(
          p =>
            `<li class="${p.on ? '' : 'via'}"><b>${esc(p.nome)}</b> <small>${esc(p.fam)}${p.usc ? ' · uscito' : ''}${p.fuori ? ' · fuori scena' : ''}</small>${p.on ? `<button class="b sm" data-a="ser" data-v="allontana:${p.id}">Fuori scena</button><button class="b sm" data-a="ser" data-v="esce:${p.id}">Lascia la serata</button>` : ''}</li>`
        )
        .join('')}</ul>`;
    if (tab === 'altro')
      corpo = `<div class="sr-alt"><h4>Sigilli</h4>${c.sigilli.map(x => `<button class="b sm ${x.on ? '' : 'off'}" data-a="ser" data-v="sigillo:${x.id}:${x.on ? 0 : 1}">${esc(x.id)}</button>`).join('')}
<h4>Audio</h4>${c.audio.map(a => `<button class="b sm" data-a="ser" data-v="audio:${a.id}">${esc(a.titolo)}</button>`).join('')}
<h4>Tempo</h4><button class="b sm" data-a="ser" data-v="timer:5">+5 minuti</button>
<h4>Avvisi</h4><ul class="sr-clist">${c.avvisi
        .slice()
        .reverse()
        .map(a => `<li>${esc(a.testo)}</li>`)
        .join('')}</ul></div>`;
    return `<div class="sr-con" data-mom="${c.mom || ''}">
<header><div class="sr-sx"><small>${esc(fase)}</small>${c.mom === 'mattina' && tot ? `<b>Passo ${Math.min(c.riga + 1, tot)} di ${tot}</b>` : `<b>${esc(c.fase === 'voto' ? 'Voti: ' + c.votati + '/' + c.votanti : (M && M.verbo) || '')}</b>`}</div>
${nr && tab !== 'richieste' ? `<button class="sr-rich" data-a="ser" data-v="ctab:richieste"><i>${nr}</i>Richieste</button>` : ''}${SER.orologio(c)}</header>
${c.mom === 'mattina' && tot ? `<div class="sr-segm" aria-hidden="true">${segm}</div>` : ''}
<nav class="sr-tabs">${tabs}</nav><div class="sr-corpo">${corpo}</div>
<footer><button class="sr-pausa-b ${c.pausa ? 'on' : ''}" data-a="ser" data-v="pausa:${c.pausa ? 0 : 1}" aria-label="${c.pausa ? 'Riprendi' : 'Pausa tecnica'}">${SER.ico('pausa', 28)}<span>${c.pausa ? 'Riprendi' : 'Pausa'}</span></button><button class="sr-avanti" data-a="ser" data-v="avanti"><span>${esc(c.prossimo || 'Avanti')}</span>${SER.ico('avanti', 30)}</button></footer></div>`;
  },

  // ======================= TELEFONO DELL'OSPITE =======================
  note() {
    try {
      return JSON.parse(localStorage.getItem('sr-note-' + R.code) || '{}');
    } catch (e) {
      return {};
    }
  },
  salvaNote(n) {
    try {
      localStorage.setItem('sr-note-' + R.code, JSON.stringify(n));
    } catch (e) {
      say('Appunti non salvati', 2000);
    }
  },
  telH() {
    const g = G,
      m = SER.mano;
    if (m.console) return SER.conH(m.console);
    if (g.fase === 'casting' || !m.dossier)
      return `<div class="sr-tel sr-c"><h2>${esc(g.titolo || 'Serata')}</h2><p>La regia prepara i personaggi. Guarda la TV.</p>
${g.fase === 'casting' ? (g.narr === RT.uid() ? '<p><b>Sei il narratore.</b></p><button class="b" data-a="ser" data-v="nonarr">Non faccio più il narratore</button>' : g.narr ? '' : '<button class="b gold" data-a="ser" data-v="narratore">Faccio il narratore</button>') : ''}</div>`;
    const st = m.stato || {},
      d = m.dossier;
    if (g.pausa)
      return '<div class="sr-tel sr-c sr-pausa"><h2>Pausa tecnica</h2><p>Siamo fuori dalla finzione. Si riprende tra poco.</p></div>';
    if (st.turno)
      return `<div class="sr-tel sr-c sr-turno-tel"><small>Tocca a te</small><h2>${esc(d.nome)}</h2><p>${esc(st.guida || '')}</p><ul>${d.battute.map(b => `<li>«${esc(b)}»</li>`).join('')}</ul><p class="muted">Sono battute-guida: dille con parole tue.</p></div>`;
    if (g.fase === 'voto' && !st.votato) return SER.votoH(st.accusa, m);
    if (g.fase === 'finale' || g.fase === 'fine') return SER.finaleTel(g, st, d);
    const tab = ui.srtab || 'ora';
    const nav = [
      ['ora', 'Ora'],
      ['prove', 'Prove'],
      ['fam', 'Bacheca'],
      ['persone', 'Persone'],
      ['io', 'Io'],
    ]
      .map(
        ([id, n]) =>
          `<button class="${tab === id ? 'sel' : ''}" data-a="ser" data-v="tab:${id}">${SER.ico(id === 'fam' ? 'bacheca' : id, 26)}${n}</button>`
      )
      .join('');
    const ult = ((m.msg && m.msg.l) || []).slice(-1)[0];
    const busta =
      ult && tab !== 'ora' && ['busta', 'passo', 'regia', 'fuori', 'richiesta'].includes(ult.tipo)
        ? `<p class="sr-busta ${ult.tipo}">${esc(ult.testo)}</p>`
        : '';
    const q = ui.srq || '';
    const cerca = ui.srcerca || q;
    const corpo = q
      ? SER.cercaH(q, m)
      : { ora: SER.oraH, io: SER.ioH, fam: SER.famH, prove: SER.proveH, persone: SER.personeH }[tab](m, g);
    const mid = g.mom ? g.mom.id : '',
      M = SER.MOM[mid];
    return `<div class="sr-tel" data-mom="${mid}"><header class="sr-ttop"><span class="sr-vol">${esc((d.nome || '?')[0])}</span><div><b>${esc(d.nome)}</b><small>${g.atto ? 'Atto ' + esc(g.atto.id) : ''}${M ? ' · ' + M.verbo : ''}</small></div>
<button class="sr-lente" data-a="ser" data-v="lente" aria-label="Cerca">${SER.ico('cerca', 24)}</button>${SER.orologio(g)}</header>
${cerca ? `<div class="sr-cerca"><input id="sr-q" placeholder="Cerca in prove, persone, appunti" value="${esc(q)}"><button class="b sm" data-a="ser" data-v="cerca">Cerca</button><button class="b sm" data-a="ser" data-v="cerca:">×</button></div>` : ''}
${busta}<div class="sr-corpo">${corpo}</div><nav class="sr-nav">${nav}</nav></div>`;
  },
  // «Ora»: una sola cosa da fare, la regola di parola del momento, le novità
  oraH(m, g) {
    const st = m.stato,
      d = m.dossier,
      mid = g.mom && g.mom.id,
      M = SER.MOM[mid],
      tocca = st.pv && mid === 'mattina';
    const cta = tocca
      ? ''
      : mid === 'mattina'
        ? '<button class="sr-cta" data-a="ser" data-v="tab:fam">Vai alla bacheca</button>'
        : mid === 'pomeriggio'
          ? '<button class="sr-cta" data-a="ser" data-v="tab:persone">Parla con qualcuno</button>'
          : '<button class="sr-cta" data-a="ser" data-v="tab:fam">Lavora alla bacheca</button>';
    const nov = ((m.msg && m.msg.l) || [])
      .slice(-4)
      .reverse()
      .map(x => `<li class="${esc(x.tipo)}">${esc(x.testo)}</li>`)
      .join('');
    const mosse = (st.mosse || []).length
      ? `<section><h3>Prova a chiedere</h3><ul class="sr-mosse">${st.mosse
          .slice(-3)
          .reverse()
          .map(x => `<li><button class="link" data-a="ser" data-v="p:${x.a}">${esc(x.nome)}</button>: ${esc(x.chiedi)}</li>`)
          .join('')}</ul></section>`
      : '';
    return `<section class="sr-ora"><div class="sr-ora-m">${mid ? SER.ico(mid, 26) : ''}<b>${M ? M.verbo : 'Adesso'}</b></div>
<p class="sr-ora-g">${esc(st.guida || (M && M.tel) || 'Ascolta il narratore.')}</p>${M ? `<p class="sr-ora-r">${M.tel}</p>` : ''}
${st.rivela.map(r => `<p class="sr-sblocco">${esc(r)}</p>`).join('')}
${st.fuori ? '<p class="sr-busta fuori">Sei fuori scena per qualche minuto: resta seduto.</p>' : ''}
${tocca ? `<div class="sr-dichiara"><b>Sei il portavoce: parla tu per la famiglia</b><textarea id="sr-dich" maxlength="400" placeholder="La vostra scoperta o accusa"></textarea><button class="sr-cta" data-a="ser" data-v="dichiara:scoperta">Dichiara</button><button class="b sm sr-rossa" data-a="ser" data-v="dichiara:accusa">Accusa</button></div>` : cta}</section>
${nov ? `<section class="sr-nov"><h3>Novità</h3><ul>${nov}</ul></section>` : ''}${mosse}`;
  },
  ioH(m, g) {
    const st = m.stato,
      d = m.dossier,
      tocca = st.pv && g.mom && g.mom.id === 'mattina';
    const ob = d.obiettivi
      .map(
        (o, i) =>
          `<li><button class="b sm ${st.ob[i] ? 'gold' : ''}" data-a="ser" data-v="ob:${i}:${st.ob[i] ? 0 : 1}">${st.ob[i] ? 'Fatto' : 'Da fare'}</button> ${esc(o)}</li>`
      )
      .join('');
    const sez = [
      [
        'Chi sei',
        [
          d.eta,
          d.ruolo,
          d.pubblico,
          d.look ? 'Aspetto: ' + d.look : '',
          d.fisicita ? 'Come ti muovi: ' + d.fisicita : '',
        ],
      ],
      ['Il passato', [d.passato]],
      ['Ciò che racconti', [d.comodo]],
      ['Come recitarlo', [d.motore, d.tono]],
      ['Cosa non puoi fare', [d.vincolo]],
    ]
      .map(
        ([t, l]) =>
          `<details><summary>${t}</summary>${l
            .filter(Boolean)
            .map(x => `<p>${esc(x)}</p>`)
            .join('')}</details>`
      )
      .join('');
    return `<section class="sr-segreto"><details><summary>Il tuo segreto (non mostrarlo)</summary><p>${esc(d.segreto)}</p>${d.confessione ? `<p class="muted">Se ti scoprono, nel finale: «${esc(d.confessione)}»</p>` : ''}</details></section>
<section><h3>Obiettivi</h3><ul class="sr-ob">${ob}</ul></section>
<section><h3>Battute-guida</h3><ul>${d.battute.map(b => `<li>«${esc(b)}»</li>`).join('')}</ul></section>
<section><h3>Atto per atto</h3><ul>${Object.entries(d.atti)
      .map(([a, t]) => `<li class="${g.atto && g.atto.id === a ? 'qui' : ''}"><b>${esc(a)}</b> ${esc(t)}</li>`)
      .join('')}</ul></section>
${sez}<section><h3>Taccuino</h3>${SER.noteH(m)}</section><p><button class="link" data-a="ser" data-v="esco">Esco dal ruolo…</button></p>`;
  },
  famH(m, g) {
    const f = m.fam,
      prove = (m.prove && m.prove.l) || {},
      sel = ui.srsel || [];
    const carta = (id, titolo, extra) =>
      `<button class="sr-carta ${sel.includes(id) ? 'sel' : ''}" data-a="ser" data-v="sel:${id}"><b>${esc(titolo)}</b>${extra || ''}</button>`;
    const bacheca = f.bacheca.map(id => carta(id, (prove[id] || {}).titolo || id)).join('');
    const pub = Object.entries(prove)
      .filter(([id, p]) => p.st === 'pubblica' && !f.bacheca.includes(id))
      .map(([id, p]) => carta(id, p.titolo, '<small>pubblica</small>'))
      .join('');
    const ded = f.ded.map(x => carta('@' + x.id, x.passo, '<small>deduzione</small>')).join('');
    const q = f.quesito;
    const quesito = q
      ? `<section class="sr-quesito"><h3>${esc(q.domanda)}</h3>${q.scelte.map((t, i) => `<button class="b" data-a="ser" data-v="risolvi:${i}">${esc(t)}</button>`).join('')}</section>`
      : '';
    const manc = f.mancanti
      .map(x => `<li>Un pezzo si collega a «${esc(x.con.join(' + '))}»: chiedete a ${esc(x.dove.join(', '))}</li>`)
      .join('');
    const sera = g.mom && g.mom.id === 'sera',
      pv = m.stato.pv;
    const modulo =
      sera && f.modulo && !f.inviato
        ? `<section><h3>Il modulo della sera</h3>${f.modulo.map(x => `<label>${esc(x.testo)}${x.tipo === 'personaggio' ? `<select id="sr-m-${x.id}"><option value="">—</option>${(g.cast || []).map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select>` : `<textarea id="sr-m-${x.id}"></textarea>`}</label>`).join('')}${pv ? '<button class="b gold" data-a="ser" data-v="modulo">Invia (sei il rappresentante)</button>' : '<p class="muted">Lo invia il rappresentante.</p>'}</section>`
        : f.inviato && sera
          ? '<p class="muted">Modulo della sera consegnato.</p>'
          : '';
    const membri = f.membri
      .map(
        x =>
          `<li class="${x.on ? '' : 'via'}">${esc(x.nome)}${x.pv ? ' <b>· rappresentante</b>' : `<button class="b sm" data-a="ser" data-v="pv:${x.pid}">Voto lui</button>`}</li>`
      )
      .join('');
    const dom = f.domanda
      ? `<p class="muted">Domanda alla regia: ${esc(f.domanda.testo)}${f.domanda.risp ? ' — <b>' + esc(f.domanda.risp) + '</b>' : ' (in attesa)'}</p>`
      : `<details><summary>Una domanda alla regia (una per atto)</summary><textarea id="sr-dom" maxlength="300"></textarea><button class="b sm" data-a="ser" data-v="domanda">Invia</button></details>`;
    return `${quesito}<section><h3>${esc(f.nome)}</h3><ul class="sr-membri">${membri}</ul></section>
<section><h3>La bacheca</h3><p class="muted">Scegli due o più carte e collegale.</p><div class="sr-carte">${bacheca || '<p class="muted">Vuota: appoggia le tue prove dalla scheda Prove.</p>'}${ded}${pub}</div>
${sel.length >= 2 ? '<button class="b gold" data-a="ser" data-v="collega">Collega le carte scelte</button>' : ''}${sel.length ? '<button class="b sm" data-a="ser" data-v="sel:">Deseleziona</button>' : ''}</section>
${manc ? `<section><h3>Pezzi mancanti</h3><ul>${manc}</ul></section>` : ''}${modulo}<section>${dom}</section>`;
  },
  proveH(m, g) {
    const l = (m.prove && m.prove.l) || {},
      ric = (m.ric && m.ric.l) || [],
      mio = Object.entries(l).filter(([, p]) => p.st === 'mia' || p.st === 'copia');
    const r = ric
      .map(
        x =>
          `<li>${esc(x.da)} ti chiede una copia${x.eid ? ' di «' + esc((l[x.eid] || {}).titolo || x.eid) + '»' : ''}: ${x.eid ? `<button class="b sm" data-a="ser" data-v="concedi:${x.n}:${x.eid}">Concedi</button>` : mio.map(([id, p]) => `<button class="b sm" data-a="ser" data-v="concedi:${x.n}:${id}">${esc(p.titolo)}</button>`).join('')}<button class="b sm" data-a="ser" data-v="rifiuta:${x.n}">No</button></li>`
      )
      .join('');
    const apri = ui.srprova;
    const voce = ([id, p]) => {
      const aperta = apri === id;
      const az =
        aperta && (p.st === 'mia' || p.st === 'copia')
          ? `<div class="sr-az"><button class="b sm" data-a="ser" data-v="appoggia:${id}">In bacheca</button><button class="b sm" data-a="ser" data-v="mostra:${id}">Mostra a…</button>${p.st === 'mia' ? `<button class="b sm" data-a="ser" data-v="consegna:${id}">Alla regia, per tutti</button>` : ''}</div>`
          : '';
      const chi =
        ui.srmostra === id
          ? `<div class="sr-chi">${(g.cast || [])
              .filter(c => c.on && c.id !== m.dossier.id)
              .map(c => `<button class="b sm" data-a="ser" data-v="mostraa:${id}:${c.id}">${esc(c.nome)}</button>`)
              .join('')}</div>`
          : '';
      return `<li class="sr-pr ${p.st}"><button class="link" data-a="ser" data-v="prova:${aperta ? '' : id}"><b>${esc(p.titolo)}</b> <small>${{ mia: 'tua', copia: 'da ' + esc(p.da), famiglia: 'in bacheca', pubblica: 'pubblica', annunciata: 'busta chiusa, si apre all’atto ' + esc(p.apre || '') }[p.st]}</small></button>${aperta && p.testo ? `<p class="sr-doc-tel">${SER.testo(p.testo)}</p>` : ''}${az}${chi}</li>`;
    };
    return `${r ? `<section><h3>Richieste</h3><ul>${r}</ul></section>` : ''}<ul class="sr-prove">${Object.entries(l).map(voce).join('') || '<li class="muted">Nessuna prova per ora.</li>'}</ul>`;
  },
  personeH(m, g) {
    const n = SER.note(),
      p = ui.srp;
    if (p) {
      const c = (g.cast || []).find(x => x.id === p) || {},
        leg = m.dossier.legami.find(x => x.con === p),
        mos = m.stato.mosse.filter(x => x.a === p);
      return `<button class="link" data-a="ser" data-v="p:">← Tutti</button><h3>${esc(c.nome)}</h3><p>${esc(c.ruolo)} · ${esc(SER.nomeF(c.fam, g))}</p><p>${esc(c.pubblico)}</p>${c.look ? `<p class="muted">${esc(c.look)}</p>` : ''}
${leg ? `<p class="sr-sblocco">Lo cerchi perché: ${esc(leg.perche)}</p>` : ''}${mos.map(x => `<p>Chiedigli: ${esc(x.chiedi)}</p>`).join('')}
<label>I tuoi appunti<textarea id="sr-np">${esc((n.p || {})[p] || '')}</textarea></label><button class="b sm" data-a="ser" data-v="nota:${p}">Salva</button>
${c.on && p !== m.dossier.id ? `<button class="b sm" data-a="ser" data-v="chiedi:${p}">Chiedi una copia</button>` : ''}`;
    }
    return (g.famiglie || [])
      .map(
        f =>
          `<section><h3>${esc(f.nome)}</h3><ul class="sr-persone">${(g.cast || [])
            .filter(c => c.fam === f.id)
            .map(
              c =>
                `<li class="${c.on ? '' : 'via'}"><button class="link" data-a="ser" data-v="p:${c.id}"><b>${esc(c.nome)}</b> <small>${esc(c.ruolo)}${(n.p || {})[c.id] ? ' · appunti' : ''}</small></button></li>`
            )
            .join('')}</ul></section>`
      )
      .join('');
  },
  noteH(m) {
    const n = SER.note(),
      l = (m.prove && m.prove.l) || {};
    // cronologia: tutti gli orari citati nelle prove che vedo e nei miei appunti, in ordine
    const ore = [];
    const raccogli = (t, da) => {
      for (const x of String(t || '').matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)) {
        const frase = String(t)
          .slice(Math.max(0, x.index - 50), x.index + 60)
          .replace(/\s+/g, ' ');
        ore.push({ o: x[1].padStart(2, '0') + ':' + x[2], da, frase });
      }
    };
    Object.values(l).forEach(p => raccogli(p.testo, p.titolo));
    raccogli(n.libero, 'Appunti');
    Object.values(n.p || {}).forEach(t => raccogli(t, 'Appunti'));
    ore.sort((a, b) => (a.o < b.o ? -1 : a.o > b.o ? 1 : 0));
    return `<section><h3>Appunti</h3><textarea id="sr-nl" class="sr-lungo">${esc(n.libero || '')}</textarea><button class="b sm" data-a="ser" data-v="nota:">Salva</button></section>
<section><h3>Cronologia</h3><ul class="sr-crono">${ore.map(x => `<li><b>${x.o}</b> ${esc(x.frase)} <small>${esc(x.da)}</small></li>`).join('') || '<li class="muted">Nessun orario ancora.</li>'}</ul></section>
<section><h3>La mia ipotesi</h3><textarea id="sr-ip">${esc(n.ipotesi || '')}</textarea><button class="b sm" data-a="ser" data-v="ipotesi">Salva</button></section>`;
  },
  cercaH(q, m) {
    const t = q.toLowerCase(),
      g = G,
      n = SER.note(),
      out = [];
    const hit = (s, cosa, dove) => {
      if (
        String(s || '')
          .toLowerCase()
          .includes(t)
      )
        out.push({ cosa, dove, s: String(s) });
    };
    for (const [id, p] of Object.entries((m.prove && m.prove.l) || {}))
      hit(p.titolo + ' — ' + p.testo, 'Prova', 'prova:' + id);
    for (const c of g.cast || []) hit(c.nome + ' — ' + c.ruolo + ' — ' + c.pubblico, 'Persona', 'p:' + c.id);
    for (const x of m.fam.ded) hit(x.passo, 'Deduzione', 'tab:fam');
    const d = m.dossier;
    for (const v of [d.pubblico, d.passato, d.segreto, d.comodo, ...d.battute, ...Object.values(d.atti)])
      hit(v, 'Il tuo dossier', 'tab:io');
    hit(n.libero, 'Appunti', 'tab:note');
    for (const [pid, v] of Object.entries(n.p || {})) hit(v, 'Appunti su ' + SER.nomeP(pid, g), 'p:' + pid);
    const evid = s => {
      const i = s.toLowerCase().indexOf(t),
        a = Math.max(0, i - 40);
      return (
        esc(s.slice(a, i)) +
        '<mark>' +
        esc(s.slice(i, i + t.length)) +
        '</mark>' +
        esc(s.slice(i + t.length, i + t.length + 60))
      );
    };
    return `<ul class="sr-risultati">${out.map(x => `<li><button class="link" data-a="ser" data-v="${x.dove}"><small>${x.cosa}</small> ${evid(x.s)}</button></li>`).join('') || '<li class="muted">Nessun risultato.</li>'}</ul>`;
  },
  votoH(acc, m) {
    if (!acc) return '<div class="sr-tel sr-c"><p>Il voto sta per aprirsi.</p></div>';
    const l = (m.prove && m.prove.l) || {},
      cast = G.cast || [];
    const campi = acc.domande
      .map(q => {
        let c = '';
        if (q.tipo === 'personaggio')
          c = `<select id="sr-v-${q.id}"><option value="">—</option>${cast.map(x => `<option value="${x.id}">${esc(x.nome)}</option>`).join('')}</select>`;
        else if (q.tipo === 'scelta')
          c = `<select id="sr-v-${q.id}"><option value="">—</option>${q.scelte.map((x, i) => `<option value="${i}">${esc(x)}</option>`).join('')}</select>`;
        else if (q.tipo === 'prove')
          c = Object.entries(l)
            .filter(([, p]) => p.st !== 'annunciata')
            .map(
              ([id, p]) =>
                `<label class="sr-ck"><input type="checkbox" name="sr-v-${q.id}" value="${id}"> ${esc(p.titolo)}</label>`
            )
            .join('');
        else c = `<textarea id="sr-v-${q.id}"></textarea>`;
        return `<fieldset><legend>${esc(q.testo)}</legend>${c}</fieldset>`;
      })
      .join('');
    const gen = `<fieldset><legend>Il personaggio più generoso (facoltativo)</legend><select id="sr-v-gen"><option value="">—</option>${cast
      .filter(x => x.id !== m.dossier.id)
      .map(x => `<option value="${x.id}">${esc(x.nome)}</option>`)
      .join('')}</select></fieldset>`;
    return `<div class="sr-tel sr-voto"><h2>L’accusa</h2><p class="muted">Vota secondo gli indizi che hai davvero raccolto.</p>${campi}${gen}<button class="b gold" data-a="ser" data-v="vota">Consegna il voto</button>${m.stato.pv && !m.fam.votato ? '<button class="b" data-a="ser" data-v="vota:fam">Consegna anche come voto della famiglia</button>' : ''}</div>`;
  },
  finaleTel(g, st, d) {
    const r = st.ris;
    return `<div class="sr-tel sr-c"><h2>La verità</h2>${g.finale ? g.finale.ricostruzione.map(t => `<p>${esc(t)}</p>`).join('') : ''}${r ? `<p>I tuoi punti: <b>${r.tot}</b> (accusa ${r.voto}, interpretazione ${r.interp})</p><p>La tua famiglia: <b>${r.fam ? r.fam.tot : 0}</b></p>` : '<p>Guarda la TV.</p>'}<details><summary>Il tuo dossier</summary><p>${esc(d.segreto)}</p></details></div>`;
  },

  // ======================= un solo comando: data-a="ser" =======================
  click(v) {
    const [verbo, ...arg] = String(v || '').split(':'),
      a1 = arg[0],
      a2 = arg[1],
      val = id => (document.getElementById(id) || {}).value || '';
    const D = SER.D,
      tv = ui.tv && REGIA.sono();
    switch (verbo) {
      // TV
      case 'file':
        return SER.apriFile();
      case 'frase': {
        const f = val('sr-frase');
        if (!f.trim()) return say('Scrivi la frase del kit', 2500);
        try {
          localStorage.setItem(SER.KEY_FRASE + a1, f);
        } catch (e) {}
        return SER.riprova();
      }
      case 'riprova':
        return SER.riprova();
      case 'narr':
        D.narr = a1;
        return SER.salva().then(render);
      case 'inizia':
        return SER.inizia();
      // narratore e casting
      case 'narratore':
        return SER.chiedi({ t: 'narratore' }, 'Richiesta inviata');
      case 'nonarr':
        return SER.chiedi({ t: 'nonarratore' });
      case 'ctab':
        ui.srcon = a1;
        return render();
      case 'avanti':
        return tv ? SER.comanda('avanti') : SER.cmd('avanti', { at: (SER.mano.console || {}).pos });
      case 'pausa':
        return tv ? SER.comanda('pausa', { on: a1 === '1' }) : SER.cmd('pausa', { on: a1 === '1' });
      case 'timer':
        return SER.cmd('timer', { min: +a1 || 5 });
      case 'sigillo':
        return SER.cmd('sigillo', { id: a1, on: a2 === '1' });
      case 'audio':
        return SER.cmd('audio', { id: a1 });
      case 'rilascia':
        return SER.cmd('rilascia', { eid: a1 });
      case 'pubblica':
        return SER.cmd('pubblica', { eid: a1 });
      case 'prop':
        return SER.cmd('proposta', { n: +a1, ok: a2 === '1' });
      case 'rispondi':
        return SER.cmd('rispondi', { n: +a1, testo: val('sr-r' + a1) });
      case 'sblocca':
        if (!val('sr-sbl')) return say('Scrivi prima il suggerimento', 2000);
        return SER.cmd('sblocca', { fam: a1, testo: val('sr-sbl') });
      case 'allontana':
        return SER.cmd('allontana', { pid: a1, min: 10 });
      case 'esce':
        return (
          confirm('Il personaggio lascia la serata? Le sue prove passano alla riserva.') && SER.cmd('esce', { pid: a1 })
        );
      // ospite
      case 'tab':
        ui.srtab = a1;
        ui.srq = '';
        ui.srp = '';
        return render();
      case 'lente':
        ui.srcerca = !ui.srcerca;
        if (!ui.srcerca) ui.srq = '';
        return render();
      case 'cerca':
        ui.srq = a1 === undefined ? val('sr-q') : '';
        if (a1 !== undefined) ui.srcerca = false;
        return render();
      case 'p':
        ui.srp = a1 || '';
        ui.srtab = 'persone';
        ui.srq = '';
        return render();
      case 'prova':
        ui.srprova = a1 || '';
        ui.srmostra = '';
        ui.srtab = 'prove';
        ui.srq = '';
        return render();
      case 'sel': {
        const s = ui.srsel || [];
        ui.srsel = !a1 ? [] : s.includes(a1) ? s.filter(x => x !== a1) : s.concat(a1);
        return render();
      }
      case 'collega': {
        const ids = (ui.srsel || []).slice();
        ui.srsel = [];
        return SER.chiedi({ t: 'collega', ids });
      }
      case 'risolvi':
        return SER.chiedi({ t: 'risolvi', scelta: +a1 });
      case 'appoggia':
        return SER.chiedi({ t: 'appoggia', eid: a1 }, 'In bacheca');
      case 'mostra':
        ui.srmostra = ui.srmostra === a1 ? '' : a1;
        return render();
      case 'mostraa':
        ui.srmostra = '';
        return SER.chiedi({ t: 'mostra', eid: a1, a: a2 }, 'Mostrata');
      case 'consegna':
        return SER.chiedi({ t: 'consegna', eid: a1 }, 'Consegnata alla regia');
      case 'chiedi':
        return SER.chiedi({ t: 'chiedi', a: a1 }, 'Richiesta inviata');
      case 'concedi':
        return SER.chiedi({ t: 'concedi', n: +a1, eid: a2 }, 'Copia concessa');
      case 'rifiuta':
        return SER.chiedi({ t: 'rifiuta', n: +a1 });
      case 'pv':
        return SER.chiedi({ t: 'portavoce', pid: a1 }, 'Voto inviato');
      case 'ob':
        return SER.chiedi({ t: 'obiettivo', i: +a1, fatto: a2 === '1' });
      case 'dichiara': {
        const t = val('sr-dich');
        if (!t) return say('Scrivi la dichiarazione', 2000);
        return SER.chiedi({ t: 'dichiara', testo: t, tipo: a1 }, 'Dichiarazione inviata');
      }
      case 'domanda':
        return SER.chiedi({ t: 'domanda', testo: val('sr-dom') }, 'Domanda inviata');
      case 'modulo': {
        const ris = {};
        for (const x of SER.mano.fam.modulo || []) ris[x.id] = val('sr-m-' + x.id);
        return SER.chiedi({ t: 'modulo', risposte: ris }, 'Modulo inviato');
      }
      case 'vota': {
        const acc = SER.mano.stato.accusa,
          ris = {};
        for (const q of acc.domande) {
          if (q.tipo === 'prove')
            ris[q.id] = [...document.querySelectorAll(`input[name="sr-v-${q.id}"]:checked`)].map(x => x.value);
          else if (q.tipo === 'scelta') ris[q.id] = val('sr-v-' + q.id) === '' ? undefined : +val('sr-v-' + q.id);
          else ris[q.id] = val('sr-v-' + q.id);
        }
        const gen = val('sr-v-gen');
        return SER.chiedi(
          { t: a1 === 'fam' ? 'votoFam' : 'voto', risposte: ris, generoso: gen || undefined },
          'Voto consegnato'
        );
      }
      case 'nota': {
        const n = SER.note();
        if (a1) (n.p = n.p || {})[a1] = val('sr-np');
        else n.libero = val('sr-nl');
        SER.salvaNote(n);
        return say('Appunti salvati', 1200);
      }
      case 'ipotesi': {
        const n = SER.note();
        n.ipotesi = val('sr-ip');
        SER.salvaNote(n);
        return say('Ipotesi salvata', 1200);
      }
      case 'esco': {
        const modo = prompt(
          'Esci dal ruolo: scrivi 1 per una pausa di 5 minuti, 2 per non essere interrogato ora, 3 per lasciare la serata'
        );
        const m = { 1: 'pausa', 2: 'muto', 3: 'via' }[String(modo || '').trim()];
        return m && SER.chiedi({ t: 'esco', modo: m }, 'La regia è avvisata');
      }
    }
  },
};
// motore «di stanza»: la partita nasce vuota, la riempie la regia (le mosse non passano mai di qui)
ENG.serata = {
  newGame: (n, names, o) => ({
    g: 'serata',
    fase: 'casting',
    kit: o.kit,
    titolo: o.kit === 'privato' ? 'Serata privata' : (REGIA.KIT[o.kit] || {}).titolo || '',
    n,
    names,
    cur: 0,
    log: [],
    ev: [],
    evn: 0,
    over: null,
  }),
  act: () => ({ err: 'Le mosse passano dalla regia' }),
};
setInterval(() => SER.tick(), 1000);
document.addEventListener('keydown', e => {
  if (
    !ui.tv ||
    !G ||
    G.g !== 'serata' ||
    !REGIA.sono() ||
    !SER.D.s ||
    /input|textarea|select/i.test((e.target || {}).tagName || '')
  )
    return;
  if (e.key === ' ') {
    e.preventDefault();
    SER.comanda('avanti');
  }
  if (e.key === 'p' || e.key === 'P') SER.comanda('pausa', { on: !SER.D.s.pausa });
});
function serataH() {
  return ui.tv ? SER.tvH() : SER.telH();
}
function serataClick(a, v) {
  if (a === 'ser') SER.click(v);
}
