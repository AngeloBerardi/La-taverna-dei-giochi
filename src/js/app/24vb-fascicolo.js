/* ---- Fascicolo: indagine d'archivio per una squadra (motore motori/36c-fascicolo.js, progetto docs/FASCICOLI.md) ----
   La TV regista (il PC collegato alla TV) tiene kit e soluzione, fa girare il motore e consegna a ogni telefono solo la
   sua mano (REGIA.consegna). La TV è il muro delle indagini: domande del caso, reperti proiettati, linea del tempo,
   interrogatori con la voce. Ogni telefono è un investigatore con una specialità. Un solo comando:
   data-a="fas" data-v="verbo:arg". CSS: css/45b-fascicolo.css (prefisso fs-). */
const FAS = {
  // ---- registrazione (GAMES in 07-nucleo.js) ----
  elenco: () => Object.entries(REGIA.KIT).filter(([, k]) => k.formato === 'fascicolo'),
  // ogni fascicolo si gioca in squadra (id) o in sfida tra due squadre (id@sfida, motori/36d-fascicolo-sfida.js)
  kits: () =>
    FAS.elenco().flatMap(([id, k]) => [
      [id, k.titolo + ' · ' + k.giocatori.join('–') + ' · ' + k.minuti + ' min'],
      [id + '@sfida', k.titolo + ' · sfida tra due squadre · 4–16'],
    ]),
  idKit: id => String(id || '').split('@')[0],
  sfida: () => !!(G && /@sfida$/.test(G.kit || '')),
  M: () => (FAS.sfida() ? FSFIDA : FASCICOLO),
  range: () => '2–16',
  ok: n => n >= 2 && n <= 16,
  check(S, o) {
    if (!o || !o.kit) return 'Scegli il fascicolo';
    if (!R.on || R.mode !== 'rt') return 'Il fascicolo si gioca solo in una stanza online';
    if (S.some(x => x.k !== 'm')) return 'Serve un telefono a testa: togli gli ospiti';
    if (S.some(x => !x.uid)) return 'Qualcuno non ha ancora il profilo online: aspettate qualche secondo';
    if (!REGIA.uid) return 'Prima collega lo schermo comune e premi «Fai da regista» sulla TV';
    const k = REGIA.KIT[FAS.idKit(o.kit)];
    if (/@sfida$/.test(o.kit))
      return S.length < 4 || S.length > 16 ? 'La sfida si gioca da 4 a 16 telefoni, divisi in due squadre' : '';
    if (k && (S.length < k.giocatori[0] || S.length > k.giocatori[1]))
      return 'Questo fascicolo si gioca da ' + k.giocatori.join(' a ') + ' telefoni';
    return '';
  },
  testo: t => esc(t || '').replace(/\n/g, '<br>'),
  ore: n => n + (n === 1 ? ' ora' : ' ore'),
  mmss(t) {
    const r = Math.max(0, Math.round((t - Date.now()) / 1000));
    return Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0');
  },
  timerH: (fino, cls) => (fino ? `<span class="${cls}" data-fsfino="${fino}">${FAS.mmss(fino)}</span>` : ''),
  FASI: {
    pronta: 'Pronti',
    apertura: 'Apertura',
    indagine: 'Indagine',
    consegna: 'Ultimi minuti',
    rivelazione: 'Le risposte',
    pausa: 'Pausa',
    accusa: 'L’accusa',
    finale: 'La verità',
    fine: 'Caso chiuso',
  },

  // ---- telefono: ciò che ho in mano ----
  mano: {},
  _code: '',
  _un: null,
  _av: 0,
  _msg: 0,
  ascolta() {
    if (FAS._un && FAS._code === R.code) return;
    FAS.smetti();
    if (!REGIA.pronto() || !R.code) return;
    FAS._code = R.code;
    FAS._un = REGIA.ascoltaMiei(R.code, m => {
      const av = m.avviso;
      if (av && av.t !== FAS._av) {
        FAS._av = av.t;
        if (Date.now() - av.t < 60000) say(av.testo, 3500);
      }
      const l = (m.msg && m.msg.l) || [],
        ult = l[l.length - 1];
      if (ult && ult.n > FAS._msg) {
        if (FAS._msg && navigator.vibrate) navigator.vibrate(ult.tipo === 'reperto' ? [120, 60, 120] : 120);
        FAS._msg = ult.n;
      }
      FAS.mano = m;
      if (ui.screen === 'game') render();
    });
  },
  smetti() {
    if (FAS._un)
      try {
        FAS._un();
      } catch (e) {
        ERR.n(e);
      }
    FAS._un = null;
    FAS._code = '';
    FAS.mano = {};
  },
  _seq: 0,
  async chiedi(a, ok) {
    FAS._seq = Math.max(Date.now(), FAS._seq + 1);
    try {
      await REGIA.chiedi(R.code, { ...a, seq: FAS._seq });
      if (ok) say(ok, 1500);
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
    erroDi: '',
    frase: '',
    carica: false,
    cueN: 0,
    detto: '',
    mom: null,
  },
  async avvia() {
    const g = G,
      D = FAS.D;
    if (!g || g.g !== 'fascicolo' || !REGIA.sono() || D.gid === g.gid || D.carica || D.erroDi === g.gid) return;
    D.carica = true;
    D.err = '';
    try {
      if (D.un) D.un();
      D.un = null;
      D.s = null;
      D.k = await SER.sblocca(await REGIA.kit(FAS.idKit(g.kit)));
      FAS.conMedia(D.k, D.k.media || (REGIA.KIT[FAS.idKit(g.kit)] || {}).media);
      const e = FASCICOLO.valida(D.k);
      if (e.length) throw new Error('Kit non valido: ' + e[0]);
      const salvato = await REGIA.carica(R.code);
      if (salvato && salvato.gid === g.gid && salvato.s) {
        D.s = salvato.s;
        D.cueN = D.s.cue ? D.s.cue.n : 0; // dopo un riavvio non risuona nulla da solo
      } else {
        await REGIA.pulisci(R.code);
        const S = seatsNow().filter(x => x.uid);
        const r = FAS.M().nuova(
          D.k,
          S.map(x => ({ uid: x.uid, nome: x.name })),
          {}
        );
        if (r.err) throw new Error(r.err);
        D.s = r.s;
        D.cueN = 0;
      }
      D.gid = g.gid;
      D.inv = {};
      D.vist = {};
      await FAS.salva();
      D.un = REGIA.ascoltaAzioni(R.code, l => FAS.richieste(l));
    } catch (e) {
      D.err = String((e && e.message) || e);
      D.frase = (e && e.frase) || '';
      D.erroDi = g.gid; // dopo un errore si riparte solo da un tocco
      D.gid = '';
    } finally {
      D.carica = false;
      render();
    }
  },
  // le immagini della cartella assets/kit/<id>/ entrano nei campi img del kit, così il motore le passa anche ai telefoni
  conMedia(k, m) {
    if (!m) return;
    k.copertina = k.copertina || m.copertina || '';
    for (const p of k.persone || []) p.img = p.img || (m.ritratti || {})[p.id] || '';
    for (const l of k.luoghi || []) l.img = l.img || (m.luoghi || {})[l.id] || '';
    for (const r of k.reperti || []) r.img = r.img || (m.oggetti || {})[r.id] || '';
  },
  riprova() {
    Object.assign(FAS.D, { err: '', frase: '', erroDi: '', gid: '' });
    return FAS.avvia();
  },
  salva() {
    const D = FAS.D;
    return (D.q = D.q
      .then(async () => {
        const code = R.code,
          s = D.s,
          giri = [];
        await REGIA.salva(code, { gid: D.gid, s });
        if (s) {
          const m = FAS.M().mani(s, D.k);
          for (const u of Object.keys(m))
            for (const [key, o] of Object.entries(m[u])) {
              const j = JSON.stringify(o),
                id = u + '/' + key;
              if (D.inv[id] !== j) giri.push(REGIA.consegna(code, u, key, o).then(() => (D.inv[id] = j)));
            }
        }
        await Promise.all(giri);
        await FAS.pubblica();
      })
      .catch(e => {
        D.err = String((e && e.message) || e);
        render();
      }));
  },
  async pubblica() {
    const D = FAS.D,
      s = D.s;
    if (!s) return;
    const pub = FAS.M().pubblico(s, D.k);
    pub.titolo = D.k.titolo;
    pub.sottotitolo = D.k.sottotitolo || '';
    pub.tema = (D.k.scena && D.k.scena.palette) || null;
    const S = seatsNow();
    // in sfida vince la squadra con più stelle; ogni posto prende le stelle della sua squadra
    const sq = u => (s.sq && s.sq.A.ordine.includes(u) ? 'A' : 'B');
    const over =
      s.modo === 'sfida'
        ? s.sq.A.fase === 'fine' && s.ris
          ? {
              scores: S.map(x => s.ris[sq(x.uid)].stelle),
              winners: S.map((x, i) => (s.ris.vince.includes(sq(x.uid)) ? i : -1)).filter(i => i >= 0),
            }
          : null
        : s.fase === 'fine' && s.ris
          ? { scores: S.map(() => s.ris.stelle), winners: s.ris.finale === 'fallito' ? [] : S.map((_, i) => i) }
          : null;
    await RT.transactRoom(R.code, cur => {
      if (!cur || cur.phase !== 'play' || !cur.s || cur.s.gid !== D.gid) return;
      const o = cur.s;
      return {
        ...cur,
        rev: (cur.rev || 0) + 1,
        s: {
          ...pub,
          g: 'fascicolo',
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
  // richieste dei telefoni: l'uid è quello del percorso; regia:true non arriva mai dalla rete
  richieste(l) {
    const D = FAS.D;
    let nuove = 0;
    for (const x of l) {
      if (D.vist[x.id]) continue;
      D.vist[x.id] = 1;
      nuove++;
      D.q = D.q
        .then(async () => {
          let err = '';
          if (!D.s) err = 'L’indagine non è ancora pronta';
          else {
            const r = FAS.M().act(D.s, { ...x.a, uid: x.uid, regia: false }, D.k, Date.now());
            if (r.err) err = r.err;
            else D.s = r.s;
          }
          if (err) await REGIA.consegna(R.code, x.uid, 'avviso', { t: Date.now(), testo: err });
          await REGIA.consuma(R.code, x.uid, x.id);
        })
        .catch(e => ERR.n(e));
    }
    if (nuove) FAS.salva().then(() => render());
  },
  // comandi dal PC della TV (tastiera o bottoni): avanti, pausa, +5 minuti
  comanda(t, x) {
    const D = FAS.D;
    if (!D.s) return;
    const r = FAS.M().act(D.s, { t, uid: '__tv', regia: true, ...(x || {}) }, D.k, Date.now());
    if (r.err) return say(r.err, 2500);
    D.s = r.s;
    FAS.salva();
    render();
  },
  tick() {
    for (const el of document.querySelectorAll('[data-fsfino]')) {
      el.textContent = FAS.mmss(+el.dataset.fsfino);
      el.classList.toggle('fs-ultimo', +el.dataset.fsfino - Date.now() <= 60000);
    }
    const D = FAS.D;
    if (D.mom && Date.now() > D.mom.fino) {
      D.mom = null;
      if (ui.screen === 'game') render();
    }
    if (!ui.tv || !G || G.g !== 'fascicolo' || !D.s || !REGIA.sono() || D.gid !== G.gid) return;
    const r = FAS.M().tick(D.s, D.k, Date.now());
    if (r) {
      D.s = r.s;
      FAS.salva();
      render();
    }
  },
  // dopo ogni ridisegno: la TV suona, parla e mostra i momenti nuovi; i telefoni ascoltano la propria mano
  dopo() {
    if (!ui.tv) {
      FAS.ascolta();
      return;
    }
    const D = FAS.D,
      s = D.s,
      k = D.k;
    if (!s || !REGIA.sono()) return;
    if (s.modo === 'sfida') return FAS.dopoSfida();
    // la voce legge la riga nuova del copione e i passi della ricostruzione
    const g = G;
    const chiave = s.fase + s.cap + ':' + s.riga + ':' + s.fin;
    if (chiave !== D.detto) {
      D.detto = chiave;
      if (g.riga && g.riga.testo) SCENA.dici(g.riga.testo);
      if (g.riga && g.riga.riv) {
        const d = (g.domande || []).find(x => x.id === g.riga.riv);
        if (d)
          SCENA.dici(
            (d.giusta ? 'Giusto. ' : 'Sbagliato. ') + 'La risposta era: ' + d.vera + '. ' + (d.rivelazione || '')
          );
      }
      if (s.fase === 'finale' && s.fin > 0) SCENA.dici(k.soluzione.ricostruzione[s.fin - 1]);
      if (s.fase === 'fine' && g.epilogo) SCENA.dici(g.epilogo);
    }
    const c = s.cue;
    if (!c || c.n <= D.cueN) return;
    D.cueN = c.n;
    const mom = (cue, ms) => (D.mom = { cue, da: Date.now(), fino: Date.now() + (ms || 12000) });
    const rep = id => k.reperti.find(r => r.id === id) || {};
    switch (c.tipo) {
      case 'capitolo':
        Snd.play('gstacco');
        SCENA.dici('Capitolo ' + k.capitoli[c.i].id + '. ' + k.capitoli[c.i].titolo);
        break;
      case 'indagine':
        Snd.play('gbattito');
        SCENA.dici('L’indagine è aperta. Avete ' + k.capitoli[s.cap].minuti + ' minuti.');
        break;
      case 'reperto':
      case 'proietta':
        Snd.play('gcarta');
        mom(c, 9000);
        break;
      case 'unisci':
        Snd.play('gbusta');
        SCENA.dici(c.da + ' cerca l’altra metà di ' + rep(c.rep).titolo);
        mom(c, 8000);
        break;
      case 'unito':
        Snd.play('gbattito');
        mom(c);
        break;
      case 'deduzione': {
        Snd.play('gbattito');
        const x = (k.collegamenti || []).find(z => z.id === c.id);
        if (x) SCENA.dici('Deduzione. ' + x.deduzione);
        mom(c);
        break;
      }
      case 'interrogatorio': {
        const p = k.persone.find(z => z.id === c.persona),
          t = (p.temi || []).find(z => z.id === c.tema);
        Snd.play('gcarta');
        SCENA.dici(p.nome + '. ' + t.risposta);
        mom(c, 20000);
        break;
      }
      case 'zona': {
        const z = k.luoghi.flatMap(l => l.zone || []).find(x => x.id === c.zona);
        if (z) SCENA.dici(z.nome + '. ' + z.testo);
        mom(c, 15000);
        break;
      }
      case 'lab-parte':
        Snd.play('gorologio');
        break;
      case 'lab':
        Snd.play('gcampana');
        mom(c);
        break;
      case 'archivio':
        Snd.play('gcarta');
        break;
      case 'serratura':
        Snd.play('vault');
        mom(c);
        break;
      case 'serratura-no':
        Snd.play('err');
        break;
      case 'consegna':
        Snd.play('gbusta');
        mom(c, 6000);
        break;
      case 'consegna-apre':
        Snd.play('gbattito');
        SCENA.dici('Il tempo è finito. Il caposquadra consegni le risposte.');
        break;
      case 'accusa':
        Snd.play('gstacco');
        SCENA.dici('È il momento dell’accusa. Chi, come, perché. E le prove che lo dimostrano.');
        break;
      case 'finale':
        Snd.play('grullo');
        break;
      case 'fine':
        Snd.play(c.finale === 'fallito' ? 'gbuio' : 'gapplauso');
        break;
      case 'rivela':
        Snd.play(c.giusta ? 'gcampana' : 'gbuio');
        break;
    }
    setTimeout(render, 30);
  },

  // la TV della sfida: legge la narrazione comune, annuncia chi fa cosa senza dire che cosa ha trovato
  dopoSfida() {
    const D = FAS.D,
      s = D.s,
      k = D.k,
      g = G,
      a = s.sq.A;
    const chiave = a.fase + a.cap + ':' + a.riga + ':' + a.fin;
    if (chiave !== D.detto) {
      D.detto = chiave;
      if (g.riga && g.riga.testo) SCENA.dici(g.riga.testo);
      if (g.riga && g.riga.riv) {
        const d = (g.domande || []).find(x => x.id === g.riga.riv);
        if (d) SCENA.dici('La risposta era: ' + d.vera + '. ' + (d.rivelazione || ''));
      }
      if (a.fase === 'finale' && a.fin > 0) SCENA.dici(k.soluzione.ricostruzione[a.fin - 1]);
    }
    const c = g.cue,
      b = g.cueBase;
    if (c && c.n > (D.cueS || 0)) {
      D.cueS = c.n;
      const nome = FSFIDA.NOMI[c.squadra];
      if (c.tipo === 'annuncio') {
        Snd.play('gcarta');
        D.mom = {
          cue: { tipo: 'annuncio', squadra: c.squadra, testo: nome + ' ' + c.testo },
          da: Date.now(),
          fino: Date.now() + 6000,
        };
      }
      if (c.tipo === 'pronta') {
        Snd.play('gbusta');
        SCENA.dici(nome + ' ha finito e aspetta gli avversari.');
      }
    }
    if (b && b.n > (D.cueN || 0)) {
      D.cueN = b.n;
      if (b.tipo === 'capitolo') {
        Snd.play('gstacco');
        SCENA.dici('Capitolo ' + k.capitoli[b.i].id + '. ' + k.capitoli[b.i].titolo);
      }
      if (b.tipo === 'indagine') SCENA.dici('Si indaga. Che vinca la squadra migliore.');
      if (b.tipo === 'consegna-apre') SCENA.dici('Il tempo è finito. I capisquadra consegnino le risposte.');
      if (b.tipo === 'rivela') Snd.play('grullo');
      if (b.tipo === 'fine') Snd.play('gapplauso');
    }
    setTimeout(render, 30);
  },
  sfidaTV(g, stile) {
    const cap = g.cap ? 'Capitolo ' + (g.cap.i + 1) + ' di ' + g.cap.di + ' · ' + esc(g.cap.titolo) : '';
    const col = q => {
      const dom = q.domande
        .map(d => {
          const es = d.stato === 'rivelata' ? (d.giusta ? 'fs-giusta' : 'fs-errata') : '';
          return `<li class="fs-d ${d.stato} ${es}"><h3>${esc(d.testo)}</h3><p class="fs-stato">${d.stato === 'rivelata' ? (d.giusta ? 'Giusto' : 'Sbagliato') : FAS.STATI[d.stato]}</p></li>`;
        })
        .join('');
      const ris = q.ris ? `<p class="fs-grado"><b>${esc(q.ris.grado)}</b><span>${q.ris.stelle} stelle</span></p>` : '';
      return `<section class="fs-sq fs-sq-${q.id} ${(g.vince || []).includes(q.id) ? 'fs-vince' : ''}"><h2>${esc(q.nome)}</h2><p class="fs-sq-m">${q.membri.map(esc).join(', ')}</p><p class="fs-sq-n"><b>${FAS.ore(q.ore)}</b> · ${q.ded} deduzioni · ${q.aperte} serrature${q.pronta ? ' · <em>pronta</em>' : ''}</p>${ris}<ol>${dom}</ol></section>`;
    };
    const m = FAS.D.mom && FAS.D.mom.cue;
    const E = FAS.D.mom && Date.now() - FAS.D.mom.da < 700 ? ' fs-entra' : '';
    let centro = '';
    if (m && m.tipo === 'annuncio') centro = `<div class="fs-c fs-ann-${m.squadra}${E}"><h2>${esc(m.testo)}</h2></div>`;
    else if (g.riga && g.riga.testo) centro = `<div class="fs-c fs-racconto"><p>${esc(g.riga.testo)}</p></div>`;
    else if (g.riga && g.riga.riv) {
      const d = (g.domande || []).find(x => x.id === g.riga.riv);
      centro = d
        ? `<div class="fs-c"><small>${esc(d.testo)}</small><p class="fs-grande">${esc(d.vera || '')}</p><p>${esc(d.rivelazione || '')}</p></div>`
        : '';
    } else if (g.fase === 'finale' || g.fase === 'fine') {
      const vince = (g.vince || []).map(x => g.squadre.find(q => q.id === x).nome).join(' e ');
      centro = `<div class="fs-c fs-finale">${vince ? `<small>${g.vince.length > 1 ? 'Pareggio' : 'Vince'}</small><h2>${esc(vince)}</h2>` : ''}<ol class="fs-ricos">${(g.ricostruzione || []).map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>`;
    } else if (g.fase === 'pronta')
      centro =
        '<div class="fs-c"><small>Sfida</small><h2>Due squadre, un solo caso</h2><p>I capisquadra toccano «Apri il caso» quando sono pronti.</p></div>';
    else
      centro = `<div class="fs-c"><h2>${g.fase === 'accusa' ? 'L’accusa' : 'Indagate'}</h2>${FAS.timerH(g.fino, 'fs-timer fs-big')}<p>La TV non mostra cosa trovate: parlate sottovoce.</p></div>`;
    return `<div class="fs-tv fs-tv-sfida" style="${stile}">
<header class="fs-top"><div><small>${esc(g.sottotitolo || '')}</small><h1>${esc(g.titolo || '')}</h1></div>
<div class="fs-fase"><b>${esc(FAS.FASI[g.fase] || '')}</b>${cap}</div><div class="fs-orolo">${FAS.timerH(g.fino, 'fs-timer')}</div></header>
<aside class="fs-dom">${col(g.squadre[0])}</aside><main class="fs-scena">${centro}</main><aside class="fs-muro">${col(g.squadre[1])}</aside>
<footer class="fs-foot">${g.pausa ? '<b class="fs-pausa">PAUSA</b>' : ''}<span>Capisquadra: <b>${esc(g.capo || '')}</b></span></footer></div>`;
  },

  // ---- TV ----
  tvH() {
    const g = G,
      D = FAS.D,
      io = REGIA.sono();
    if (io) FAS.avvia();
    const pal = g.tema || {};
    const stile = Object.entries({
      fondo: '--fs-fondo',
      carta: '--fs-carta',
      inchiostro: '--fs-ink',
      accento: '--fs-acc',
      sangue: '--fs-rosso',
    })
      .filter(([c]) => pal[c])
      .map(([c, v]) => v + ':' + pal[c])
      .join(';');
    if (g.sfida && !(D.err && io)) return FAS.sfidaTV(g, stile);
    if (D.err && io)
      return `<div class="fs-tv" style="${stile}"><div class="fs-c"><p class="err">${esc(D.err)}</p>${D.frase ? FAS.fraseH() : '<button class="b gold" data-a="fas" data-v="riprova">Riprova</button>'}</div></div>`;
    if (!g.fase || g.fase === 'attesa' || (!g.cap && g.fase !== 'pronta'))
      return `<div class="fs-tv" style="${stile}"><div class="fs-c"><h2>${esc(g.titolo || 'Fascicolo')}</h2><p>${io ? 'Apro il fascicolo…' : 'Aspetto lo schermo regista.'}</p></div></div>`;
    const cap = g.cap ? 'Capitolo ' + (g.cap.i + 1) + ' di ' + g.cap.di + ' · ' + esc(g.cap.titolo) : '';
    const tasti = io ? '<span class="fs-tasti">Spazio: avanti · P: pausa · +: cinque minuti</span>' : '';
    return `<div class="fs-tv" style="${stile}">
<header class="fs-top"><div><small>${esc(g.sottotitolo || '')}</small><h1>${esc(g.titolo || '')}</h1></div>
<div class="fs-fase"><b>${esc(FAS.FASI[g.fase] || '')}</b>${cap}</div>
<div class="fs-orolo">${FAS.timerH(g.fino, 'fs-timer')}<span class="fs-ore">${FAS.ore(g.ore)} d’indagine</span></div></header>
<aside class="fs-dom">${FAS.domandeTV(g)}</aside>
<main class="fs-scena">${FAS.scenaTV(g, io ? D : null)}</main>
<aside class="fs-muro">${FAS.muroTV(g)}</aside>
<footer class="fs-foot">${g.pausa ? '<b class="fs-pausa">PAUSA</b>' : ''}<span>Caposquadra: <b>${esc(g.capo || '')}</b></span>${(
      g.log || []
    )
      .slice(-3)
      .map(l => `<span>${esc(l.t)}</span>`)
      .join('')}${tasti}</footer></div>`;
  },
  fraseH() {
    return `<form class="fs-frase" onsubmit="return false"><input id="fs-frase" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Frase del fascicolo"><button class="b gold" data-a="fas" data-v="frase:${esc(FAS.D.frase)}">Apri il fascicolo</button></form>`;
  },
  STATI: { aperta: 'Aperta', proposta: 'Se ne discute', consegnata: 'Risposta consegnata', rivelata: '' },
  domandeTV(g) {
    const l = (g.domande || [])
      .map(d => {
        const esito = d.stato === 'rivelata' ? (d.giusta ? 'fs-giusta' : 'fs-errata') : '';
        const sotto =
          d.stato === 'rivelata'
            ? `<p class="fs-vera">${esc(d.vera)}</p>${d.giusta ? '' : `<p class="fs-vostra">Voi: ${esc(d.risposta || 'nessuna risposta')}</p>`}`
            : `<p class="fs-stato">${FAS.STATI[d.stato]}</p>`;
        return `<li class="fs-d ${d.stato} ${esito}"><h3>${esc(d.testo)}</h3>${sotto}</li>`;
      })
      .join('');
    return `<h2>Le domande del caso</h2><ol>${l}</ol>`;
  },
  muroTV(g) {
    const m = (g.muro || [])
      .slice(-4)
      .map(
        r =>
          `<article class="fs-rep fs-${esc(r.tipo)}"><small>${esc(r.tipo)}</small><h3>${esc(r.titolo)}</h3><p>${FAS.testo(r.testo)}</p></article>`
      )
      .join('');
    const ded = (g.ded || [])
      .slice()
      .sort((a, b) => (a.quando || '99').localeCompare(b.quando || '99'))
      .map(d => `<li><b>${esc(d.quando || '·')}</b>${esc(d.testo)}</li>`)
      .join('');
    const lab = (g.lab || [])
      .map(l => `<li>Laboratorio: ${esc(l.su)} ${FAS.timerH(l.pronta, 'fs-mini')}</li>`)
      .join('');
    return `<h2>Sulla TV</h2>${m || '<p class="fs-vuoto">Proiettate qui i reperti dal telefono.</p>'}<h2>Linea del tempo</h2><ol class="fs-linea">${ded || '<li class="fs-vuoto">Ancora nessuna deduzione.</li>'}</ol>${lab ? `<ul class="fs-lab">${lab}</ul>` : ''}`;
  },
  // il centro della TV: il momento in corso, altrimenti la fase
  scenaTV(g, D) {
    const k = D && D.k;
    const m = FAS.D.mom && FAS.D.mom.cue;
    // l'entrata animata solo appena arriva il momento: i ridisegni successivi non la ripetono
    const E = FAS.D.mom && Date.now() - FAS.D.mom.da < 700 ? ' fs-entra' : '';
    if (m && k) {
      const rep = id => k.reperti.find(r => r.id === id) || {};
      if (m.tipo === 'reperto' || m.tipo === 'proietta') {
        const r = rep(m.id || m.rep);
        return `<article class="fs-doc${E}"><small>${m.da ? 'Proiettato da ' + esc(m.da) : 'Nuovo reperto'}</small><h2>${esc(r.titolo)}</h2>${r.img ? `<img class="fs-img" src="${esc(r.img)}" alt="">` : ''}<p>${FAS.testo(r.testo)}</p></article>`;
      }
      if (m.tipo === 'unisci')
        return `<div class="fs-c${E}"><small>Reperto spezzato</small><h2>${esc(m.da)} cerca l’altra metà</h2><p class="fs-grande">«${esc(rep(m.rep).titolo)}»</p><p>Chi ha l’altra metà tocchi «Unisci» entro un minuto.</p></div>`;
      if (m.tipo === 'unito') {
        const r = rep(m.rep);
        return `<article class="fs-doc fs-unito${E}"><small>Ricomposto da ${esc(m.chi.join(' e '))}</small><h2>${esc(r.titolo)}</h2><p>${FAS.testo(r.testo)}</p></article>`;
      }
      if (m.tipo === 'deduzione') {
        const c = k.collegamenti.find(x => x.id === m.id);
        return `<div class="fs-c${E}"><small>Deduzione di ${esc(m.da)}</small><h2 class="fs-ded">${esc(c.deduzione)}</h2>${c.quando ? `<p class="fs-grande">${esc(c.quando)}</p>` : ''}</div>`;
      }
      if (m.tipo === 'interrogatorio') {
        const p = k.persone.find(x => x.id === m.persona),
          t = p.temi.find(x => x.id === m.tema);
        const volto = p.img ? `<img src="${esc(p.img)}" alt="">` : `<span>${esc(p.nome.slice(0, 1))}</span>`;
        return `<div class="fs-interr${E}"><div class="fs-volto">${volto}</div><div><small>Interrogatorio · ${esc(p.ruolo)}</small><h2>${esc(p.nome)}</h2><p class="fs-dom-t">${esc(t.domanda)}</p><blockquote>${esc(t.risposta)}</blockquote></div></div>`;
      }
      if (m.tipo === 'zona') return FAS.luogoTV(g, k, m.luogo, m.zona);
      if (m.tipo === 'lab') {
        const a = k.analisi.find(x => x.id === m.id),
          r = k.reperti.find(x => x.da && x.da.analisi === m.id) || {};
        return `<article class="fs-doc${E}"><small>Esito del laboratorio · ${esc(rep(a.su).titolo)}</small><h2>${esc(r.titolo || '')}</h2><p>${FAS.testo(r.testo || '')}</p></article>`;
      }
      if (m.tipo === 'serratura') {
        const x = k.serrature.find(z => z.id === m.id);
        return `<div class="fs-c${E}"><small>Aperta da ${esc(m.da)}</small><h2>${esc(x.titolo)}</h2><p>Dentro c’è qualcosa: guardate il telefono.</p></div>`;
      }
      if (m.tipo === 'consegna') {
        const d = (g.domande || []).find(x => x.id === m.dom);
        return `<div class="fs-c${E}"><small>La squadra ha risposto</small><h2>${esc(d ? d.testo : 'Le prove dell’accusa')}</h2><p class="fs-busta"></p></div>`;
      }
    }
    if (g.fase === 'pronta') {
      const sq = (g.squadra || [])
        .map(
          x =>
            `<li><b>${esc(x.nome)}</b><small>${x.spec.map(esc).join(' · ')}</small>${x.capo ? '<em>caposquadra</em>' : ''}</li>`
        )
        .join('');
      const cop = k && k.copertina ? `<img class="fs-cop" src="${esc(k.copertina)}" alt="">` : '';
      return `${cop}<div class="fs-c"><small>La squadra</small><h2>Ognuno ha una parte del fascicolo</h2><ul class="fs-squadra">${sq}</ul><p>Il caposquadra tocca «Avanti» sul telefono per aprire il caso.</p></div>`;
    }
    if (g.fase === 'apertura' || (g.fase === 'rivelazione' && g.riga && g.riga.testo))
      return `<div class="fs-c fs-racconto"><p>${g.riga ? esc(g.riga.testo) : ''}</p></div>`;
    if (g.fase === 'rivelazione' && g.riga && g.riga.riv) {
      const d = (g.domande || []).find(x => x.id === g.riga.riv);
      if (d)
        return `<div class="fs-c fs-entra"><small>${esc(d.testo)}</small><h2 class="${d.giusta ? 'fs-ok' : 'fs-no'}">${d.giusta ? 'Giusto' : 'Sbagliato'}</h2><p class="fs-grande">${esc(d.vera)}</p><p>${esc(d.rivelazione || '')}</p></div>`;
    }
    if (g.fase === 'indagine' || g.fase === 'consegna') {
      if (g.luogo && k) return FAS.luogoTV(g, k, g.luogo, '');
      return `<div class="fs-c"><h2>${g.fase === 'consegna' ? 'Consegnate le risposte' : 'Indagate'}</h2>${FAS.timerH(g.fino, 'fs-timer fs-big')}<p>Parlate, unite le metà, proiettate i reperti, collegate.</p></div>`;
    }
    if (g.fase === 'pausa')
      return '<div class="fs-c"><h2>Pausa</h2><p>Il caposquadra riprende quando siete pronti.</p></div>';
    if (g.fase === 'accusa') {
      const n = (g.domande || []).filter(d => d.stato === 'consegnata').length;
      return `<div class="fs-c"><small>L’accusa</small><h2>Chi, come, perché</h2><p class="fs-grande">${n} di ${(g.domande || []).length} risposte consegnate</p><p>Il caposquadra consegna anche i reperti che reggono l’accusa.</p></div>`;
    }
    if (g.fase === 'finale' || g.fase === 'fine') {
      const passi = (g.ricostruzione || []).map(p => `<li>${esc(p)}</li>`).join('');
      const ris = g.ris
        ? `<p class="fs-grado"><small>Grado della squadra</small><b>${esc(g.ris.grado)}</b><span>${g.ris.stelle} stelle</span></p>`
        : '';
      return `<div class="fs-c fs-finale">${ris}<ol class="fs-ricos">${passi}</ol>${g.epilogo ? `<p class="fs-epilogo">${esc(g.epilogo)}</p>` : ''}</div>`;
    }
    return '';
  },
  luogoTV(g, k, idL, idZ) {
    const l = k.luoghi.find(x => x.id === idL);
    if (!l) return '';
    const viste = (g.zone || []).filter(z => z.luogo === idL);
    const box = viste
      .map(
        z =>
          `<i class="${z.id === idZ ? 'on' : ''}" style="left:${z.x * 100}%;top:${z.y * 100}%;width:${z.w * 100}%;height:${z.h * 100}%"><b>${esc(z.nome)}</b></i>`
      )
      .join('');
    const z = viste.find(x => x.id === idZ);
    const fondo = l.img ? `style="background-image:url('${esc(l.img)}')"` : '';
    return `<div class="fs-luogo"><div class="fs-pianta" ${fondo}>${box}<span>${esc(l.nome)}</span></div>${z ? `<p class="fs-zt"><b>${esc(z.nome)}</b> ${esc(z.testo)}</p>` : ''}</div>`;
  },

  // ---- telefono ----
  telH() {
    const g = G,
      m = FAS.mano,
      st = m.stato;
    if (!st)
      return `<div class="fs-tel fs-c"><h2>${esc(g.titolo || 'Fascicolo')}</h2><p>La regia apre il fascicolo. Guarda la TV.</p></div>`;
    const spec = (st.squadra ? esc(st.squadra.nome) + ' · ' : '') + st.spec.map(x => esc(x.nome)).join(' · ');
    const top = `<header class="fs-ttop"><div><b>${spec}</b><small>${esc(FAS.FASI[st.fase] || '')}${g.cap ? ' · Cap. ' + (g.cap.i + 1) : ''}${st.capo ? ' · <em>caposquadra</em>' : ''}</small></div><div class="fs-tdx">${FAS.timerH(st.fino, 'fs-timer')}<span class="fs-ore">${FAS.ore(st.ore)}</span></div></header>`;
    const capo =
      (st.capo ? FAS.capoH(st) : '') +
      (st.squadra && st.fase === 'pronta'
        ? `<div class="fs-capo"><span class="fs-attesa">Sei nella ${esc(st.squadra.nome)}</span><button class="b sm" data-a="fas" data-v="squadra">Passa nella ${esc(st.squadra.avversari)}</button></div>`
        : '');
    if (st.pausa) return `<div class="fs-tel">${top}${capo}<div class="fs-c"><h2>Pausa</h2></div></div>`;
    if (st.fase === 'finale' || st.fase === 'fine') return `<div class="fs-tel">${top}${FAS.fineTel(g)}</div>`;
    const q = m.squadra && m.squadra.quesito;
    if (q)
      return `<div class="fs-tel">${top}<div class="fs-quesito"><small>Collegamento</small><h2>${esc(q.domanda)}</h2>${q.scelte
        .map((x, i) => `<button class="b" data-a="fas" data-v="risolvi:${i}">${esc(x)}</button>`)
        .join('')}</div></div>`;
    const tab = ui.fstab || 'fascicolo';
    const nav = [
      ['fascicolo', 'Fascicolo'],
      ['azione', st.spec.map(x => x.nome).join(' e ')],
      ['squadra', 'Squadra'],
    ]
      .map(([id, n]) => `<button class="${tab === id ? 'sel' : ''}" data-a="fas" data-v="tab:${id}">${esc(n)}</button>`)
      .join('');
    const ult = ((m.msg && m.msg.l) || []).slice(-1)[0];
    const busta =
      ult && ['reperto', 'deduzione', 'aiuto', 'capo'].includes(ult.tipo)
        ? `<p class="fs-busta-t ${ult.tipo}">${esc(ult.t)}</p>`
        : '';
    const corpo = { fascicolo: FAS.fascicoloH, azione: FAS.azioneH, squadra: FAS.squadraH }[tab](m, g);
    return `<div class="fs-tel">${top}${capo}${busta}<div class="fs-corpo">${corpo}</div><nav class="fs-nav">${nav}</nav></div>`;
  },
  capoH(st) {
    const b = (v, t, c) => `<button class="b sm ${c || ''}" data-a="fas" data-v="${v}">${t}</button>`;
    let x = '';
    if (st.fase === 'pronta') x = b('avanti', 'Apri il caso', 'gold');
    else if (st.fase === 'apertura' || st.fase === 'rivelazione' || st.fase === 'pausa')
      x = b('avanti', 'Avanti', 'gold');
    else if (st.fase === 'indagine') x = b('avanti', 'Abbiamo finito: alle risposte');
    else if (st.fase === 'consegna') x = b('avanti', 'Chiudi e rivela', 'gold');
    else if (st.fase === 'accusa') x = b('avanti', 'Accusa consegnata: la verità', 'gold');
    if (st.squadra && st.squadra.pronta && ['indagine', 'consegna', 'accusa'].includes(st.fase))
      x =
        '<span class="fs-attesa">Pronti: si aspetta ' +
        esc(st.squadra.avversari) +
        '</span>' +
        b('avanti', 'Non ancora');
    return `<div class="fs-capo">${x}${b('pausa', st.pausa ? 'Riprendi' : 'Pausa')}</div>`;
  },
  // i miei reperti e quelli sulla TV; si scelgono per collegarli
  fascicoloH(m) {
    const sel = ui.fssel || [];
    const card = (r, tv) => {
      const s = sel.includes(r.id);
      const az = tv
        ? ''
        : r.meta !== undefined
          ? `<button class="b sm gold" data-a="fas" data-v="unisci:${esc(r.id)}">${r.attesa ? 'In attesa…' : 'Unisci'}</button>`
          : r.proiettato
            ? '<span class="fs-sulla">Sulla TV</span>'
            : `<button class="b sm" data-a="fas" data-v="proietta:${esc(r.id)}">Proietta sulla TV</button>`;
      const scegli =
        r.meta !== undefined
          ? ''
          : `<button class="b sm ${s ? 'sel' : ''}" data-a="fas" data-v="scegli:${esc(r.id)}">${s ? 'Scelto' : 'Scegli'}</button>`;
      return `<article class="fs-rep fs-${esc(r.tipo)} ${s ? 'fs-scelto' : ''} ${r.meta !== undefined ? 'fs-meta' : ''}"><small>${esc(r.tipo)}${r.meta !== undefined ? ' · metà ' + (r.meta + 1) + ' di 2' : ''}</small><h3>${esc(r.titolo)}</h3>${r.img ? `<img class="fs-img" src="${esc(r.img)}" alt="">` : ''}<p>${FAS.testo(r.testo)}</p><div class="fs-az">${az}${scegli}</div></article>`;
    };
    const mie = ((m.reperti && m.reperti.l) || []).slice().reverse();
    const tv = ((m.reperti && m.reperti.tv) || []).filter(r => !mie.some(x => x.id === r.id));
    const coll =
      sel.length >= 2
        ? `<button class="b gold fs-coll" data-a="fas" data-v="collega">Collega i ${sel.length} scelti</button>`
        : '<p class="fs-aiuto-t">Scegli due o tre reperti (tuoi o sulla TV) per collegarli.</p>';
    return `${coll}<h3 class="fs-tit">I miei reperti (${mie.length})</h3>${mie.map(r => card(r, false)).join('') || '<p class="fs-vuoto">Ancora niente.</p>'}${tv.length ? `<h3 class="fs-tit">Sulla TV</h3>${tv.map(r => card(r, true)).join('')}` : ''}`;
  },
  azioneH(m) {
    const a = m.azione || {},
      out = [];
    if (a.archivio)
      out.push(
        `<section class="fs-sez"><h3>Archivio</h3><p>Cerca nei fascicoli una parola: un nome, un oggetto, un documento.</p><div class="fs-riga"><input id="fs-parola" placeholder="Parola da cercare"><button class="b gold" data-a="fas" data-v="cerca">Cerca${a.archivio.costo ? ' (' + FAS.ore(a.archivio.costo) + ')' : ''}</button></div></section>`
      );
    if (a.scientifica)
      out.push(
        `<section class="fs-sez"><h3>Scientifica</h3>${
          a.scientifica
            .map(x =>
              x.fatta
                ? `<p class="fs-lab-t">${esc(x.su)}: ${x.pronta ? 'in laboratorio ' + FAS.timerH(x.pronta, 'fs-mini') : 'esito arrivato'}</p>`
                : `<button class="b" data-a="fas" data-v="analizza:${esc(x.id)}">Analizza ${esc(x.su)} (${FAS.ore(x.ore)}, ${x.minuti} min)</button>`
            )
            .join('') || '<p class="fs-vuoto">Nessun reperto da analizzare: cercalo tra i tuoi o sulla TV.</p>'
        }</section>`
      );
    if (a.testimoni)
      out.push(
        `<section class="fs-sez"><h3>Testimoni</h3><p>La risposta la sente tutta la stanza dalla TV.</p>${a.testimoni
          .map(
            p =>
              `<div class="fs-persona"><b>${esc(p.nome)}</b><small>${esc(p.ruolo)}</small>${p.temi
                .map(t =>
                  t.fatto
                    ? `<p class="fs-fatto">${esc(t.domanda)}</p>`
                    : t.chiuso
                      ? '<p class="fs-chiuso">Una domanda si apre se gli mostrate qualcosa</p>'
                      : `<button class="b" data-a="fas" data-v="chiedi:${esc(t.id)}">${esc(t.domanda)} (${FAS.ore(t.ore)})</button>`
                )
                .join('')}</div>`
          )
          .join('')}</section>`
      );
    if (a.luoghi)
      out.push(
        `<section class="fs-sez"><h3>Luoghi</h3><p>Tocca una zona per esaminarla: la TV la mostra a tutti.</p>${a.luoghi
          .filter(l => l.zone.length)
          .map(
            l =>
              `<div class="fs-luogo-t"><b>${esc(l.nome)}</b><div class="fs-pianta" ${l.img ? `style="background-image:url('${esc(l.img)}')"` : ''}>${l.zone
                .map(
                  z =>
                    `<button class="${z.visto ? 'visto' : ''}" style="left:${z.x * 100}%;top:${z.y * 100}%;width:${z.w * 100}%;height:${z.h * 100}%" data-a="fas" data-v="esplora:${esc(z.id)}">${esc(z.nome)}${z.visto ? '' : '<small>' + FAS.ore(z.ore) + '</small>'}</button>`
                )
                .join('')}</div>${l.zone
                .filter(z => z.visto)
                .map(z => `<p class="fs-zt"><b>${esc(z.nome)}</b> ${esc(z.testo)}</p>`)
                .join('')}</div>`
          )
          .join('')}</section>`
      );
    return out.join('');
  },
  squadraH(m, g) {
    const sq = m.squadra || {},
      st = m.stato,
      out = [];
    for (const d of sq.domande || []) {
      let campo = '';
      if (d.tipo === 'orario') campo = `<input id="fs-v-${esc(d.id)}" inputmode="numeric" placeholder="hh:mm">`;
      else
        campo = `<select id="fs-v-${esc(d.id)}"><option value="">Scegli…</option>${(d.scelte || [])
          .map((x, i) =>
            typeof x === 'string'
              ? `<option value="${i}">${esc(x)}</option>`
              : `<option value="${esc(x.id)}">${esc(x.nome)}</option>`
          )
          .join('')}</select>`;
      const p = d.proposta;
      const prop = p
        ? `<p class="fs-prop">Proposta di ${esc(p.da)}: <b>${esc(p.testo)}</b> · sì ${p.si} · no ${p.no}</p><div class="fs-riga"><button class="b sm ${p.mio === 'si' ? 'sel' : ''}" data-a="fas" data-v="parere:${esc(d.id)}:1">D’accordo</button><button class="b sm ${p.mio === 'no' ? 'sel' : ''}" data-a="fas" data-v="parere:${esc(d.id)}:0">Non mi convince</button>${st.capo ? `<button class="b sm gold" data-a="fas" data-v="consegna:${esc(d.id)}">Consegna</button>` : ''}</div>`
        : '';
      out.push(
        `<section class="fs-sez fs-domanda"><h3>${esc(d.testo)}</h3>${d.consegnata ? `<p class="fs-cons">Consegnata: <b>${esc(d.consegnata)}</b></p>` : ''}${prop}<div class="fs-riga">${campo}<button class="b sm" data-a="fas" data-v="proponi:${esc(d.id)}">Proponi</button></div>${d.aiuti ? `<button class="b sm fs-aiuto" data-a="fas" data-v="aiuto:domanda:${esc(d.id)}">Chiedi un aiuto (costa ore)</button>` : ''}</section>`
      );
    }
    if (sq.sostegno) {
      const mie = ((m.reperti && m.reperti.l) || [])
        .filter(r => r.meta === undefined)
        .concat((m.reperti && m.reperti.tv) || []);
      const ids = new Set();
      const voci = [...mie.map(r => [r.id, r.titolo]), ...(sq.ded || []).map(d => [d.id, d.testo])].filter(
        ([id]) => !ids.has(id) && ids.add(id)
      );
      const scelti = ui.fssost || [];
      const p = sq.sostegno.proposta;
      out.push(
        `<section class="fs-sez"><h3>Le prove dell’accusa (fino a ${sq.sostegno.quanti})</h3>${voci
          .map(
            ([id, t]) =>
              `<button class="b sm ${scelti.includes(id) ? 'sel' : ''}" data-a="fas" data-v="sost:${esc(id)}">${esc(t)}</button>`
          )
          .join(
            ''
          )}<div class="fs-riga"><button class="b sm" data-a="fas" data-v="proponi:sostegno">Proponi queste</button>${st.capo && p ? '<button class="b sm gold" data-a="fas" data-v="consegna:sostegno">Consegna le prove</button>' : ''}</div>${p ? `<p class="fs-prop">Proposte: ${p.length}</p>` : ''}${sq.sostegno.consegnata ? '<p class="fs-cons">Prove consegnate</p>' : ''}</section>`
      );
    }
    for (const x of sq.serrature || [])
      out.push(
        `<section class="fs-sez fs-serr ${x.aperta ? 'aperta' : ''}"><h3>${esc(x.titolo)}</h3><p>${esc(x.testo)}</p>${
          x.aperta
            ? '<p class="fs-cons">Aperta</p>'
            : `<div class="fs-riga"><input id="fs-s-${esc(x.id)}" placeholder="${x.tipo === 'codice' ? 'Codice' : 'Risposta'}" ${x.tipo === 'codice' ? 'inputmode="numeric"' : ''}><button class="b sm gold" data-a="fas" data-v="apri:${esc(x.id)}">Apri</button></div>${x.aiuti ? `<button class="b sm fs-aiuto" data-a="fas" data-v="aiuto:serratura:${esc(x.id)}">Chiedi un aiuto (costa ore)</button>` : ''}`
        }</section>`
      );
    if ((sq.ded || []).length)
      out.push(
        `<section class="fs-sez"><h3>Deduzioni</h3><ul class="fs-dedl">${sq.ded.map(d => `<li>${esc(d.testo)}</li>`).join('')}</ul></section>`
      );
    const msg = ((m.msg && m.msg.l) || []).slice(-6).reverse();
    if (msg.length)
      out.push(
        `<section class="fs-sez"><h3>Ultime notizie</h3><ul class="fs-msg">${msg.map(x => `<li class="${esc(x.tipo)}">${esc(x.t)}</li>`).join('')}</ul></section>`
      );
    return out.join('') || '<p class="fs-vuoto">Le domande arrivano con il capitolo.</p>';
  },
  fineTel(g) {
    const r = g.ris || (FAS.mano.stato && FAS.mano.stato.ris);
    if (!r) return '<div class="fs-c"><h2>La verità</h2><p>Guardate la TV.</p></div>';
    return `<div class="fs-c"><small>Grado della squadra</small><h2>${esc(r.grado)}</h2><p>${r.stelle} stelle</p>${g.epilogo ? `<p>${esc(g.epilogo)}</p>` : '<p>Guardate la TV.</p>'}</div>`;
  },

  click(v) {
    const [verbo, a1, a2] = String(v || '').split(':'),
      val = id => ((document.getElementById(id) || {}).value || '').trim();
    switch (verbo) {
      case 'riprova':
        return FAS.riprova();
      case 'frase': {
        const f = val('fs-frase');
        if (!f) return say('Scrivi la frase del fascicolo', 2500);
        try {
          localStorage.setItem(SER.KEY_FRASE + a1, f);
        } catch (e) {}
        return FAS.riprova();
      }
      case 'tab':
        ui.fstab = a1;
        return render();
      case 'squadra':
        return FAS.chiedi({ t: 'squadra' }, 'Cambio squadra');
      case 'avanti':
      case 'pausa':
        if (ui.tv) return FAS.comanda(verbo);
        return FAS.chiedi({ t: verbo });
      case 'proietta':
        return FAS.chiedi({ t: 'proietta', rep: a1 }, 'Sulla TV');
      case 'unisci':
        return FAS.chiedi({ t: 'unisci', rep: a1 }, 'Chi ha l’altra metà tocchi «Unisci»');
      case 'scegli': {
        const s = ui.fssel || [];
        ui.fssel = s.includes(a1) ? s.filter(x => x !== a1) : s.concat(a1).slice(-3);
        return render();
      }
      case 'collega': {
        const ids = ui.fssel || [];
        ui.fssel = [];
        return FAS.chiedi({ t: 'collega', ids });
      }
      case 'risolvi':
        return FAS.chiedi({ t: 'risolvi', scelta: +a1 });
      case 'cerca': {
        const p = val('fs-parola');
        if (p.length < 3) return say('Scrivi almeno tre lettere', 2000);
        return FAS.chiedi({ t: 'cerca', parola: p }, 'Cerco in archivio…');
      }
      case 'analizza':
        return FAS.chiedi({ t: 'analizza', id: a1 }, 'In laboratorio');
      case 'chiedi':
        return FAS.chiedi({ t: 'chiedi', tema: a1 }, 'Ascoltate la TV');
      case 'esplora':
        return FAS.chiedi({ t: 'esplora', zona: a1 }, 'Guardate la TV');
      case 'apri': {
        const x = val('fs-s-' + a1);
        if (!x) return say('Scrivi il codice', 2000);
        return FAS.chiedi({ t: 'apri', id: a1, val: x });
      }
      case 'aiuto':
        return FAS.chiedi({ t: 'aiuto', su: a1, id: a2 });
      case 'sost': {
        const s = ui.fssost || [];
        ui.fssost = s.includes(a1) ? s.filter(x => x !== a1) : s.concat(a1);
        return render();
      }
      case 'proponi': {
        if (a1 === 'sostegno')
          return FAS.chiedi({ t: 'proponi', dom: 'sostegno', val: ui.fssost || [] }, 'Proposta inviata');
        const x = val('fs-v-' + a1);
        if (x === '') return say('Scegli una risposta', 2000);
        return FAS.chiedi({ t: 'proponi', dom: a1, val: x }, 'Proposta inviata');
      }
      case 'parere':
        return FAS.chiedi({ t: 'parere', dom: a1, si: a2 === '1' });
      case 'consegna':
        return FAS.chiedi({ t: 'consegna', dom: a1 }, 'Consegnata');
    }
  },
};
ENG.fascicolo = {
  newGame: (n, names, o) => ({
    g: 'fascicolo',
    fase: 'attesa',
    kit: o.kit,
    titolo: (REGIA.KIT[FAS.idKit(o.kit)] || {}).titolo || '',
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
setInterval(() => FAS.tick(), 1000);
document.addEventListener('keydown', e => {
  if (
    !ui.tv ||
    !G ||
    G.g !== 'fascicolo' ||
    !REGIA.sono() ||
    !FAS.D.s ||
    /input|textarea|select/i.test((e.target || {}).tagName || '')
  )
    return;
  if (e.key === ' ') {
    e.preventDefault();
    FAS.comanda('avanti');
  }
  if (e.key === 'p' || e.key === 'P') FAS.comanda('pausa');
  if (e.key === '+') FAS.comanda('tempo', { minuti: 5 });
});
function fascicoloH() {
  return ui.tv ? FAS.tvH() : FAS.telH();
}
function fascicoloClick(a, v) {
  if (a === 'fas') FAS.click(v);
}
