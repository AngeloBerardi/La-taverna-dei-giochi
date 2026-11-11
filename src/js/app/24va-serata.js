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
    SRA.tick();
    for (const el of document.querySelectorAll('[data-fino]')) {
      el.textContent = SER.mmss(+el.dataset.fino);
      el.classList.toggle('sr-ultimo', +el.dataset.fino - Date.now() <= 60000);
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
    const stile = SRA.stile(g);
    let main = '';
    if (D.err && io) {
      main = `<div class="sr-c"><p class="err">${esc(D.err)}</p>${g.kit === 'privato' ? '<button class="b gold" data-a="ser" data-v="file">Apri il kit dal computer</button>' : ''}${D.frase ? SER.fraseH() : g.kit === 'privato' ? '' : '<button class="b gold" data-a="ser" data-v="riprova">Riprova</button>'}</div>`;
    } else if (g.fase === 'casting' || !g.fase) main = SER.tvCasting(g, io);
    else if (D.mostra && k && io) {
      const p = k.prove.find(x => x.id === D.mostra.id);
      main = p ? SER.docH(p, 'sr-grande' + SRA.nuovo('doc:' + p.id)) : '';
    } else if (g.fase === 'pronta') main = SER.tvCast(g);
    else if (g.fase === 'gioco') main = SER.tvGioco(g);
    else if (g.fase === 'voto')
      main = `<div class="sr-c sr-urna"><small class="sr-eti">Il verdetto</small><h2>Si vota</h2><p class="sr-buste${SRA.nuovo('voti:' + g.votati)}">${'<i></i>'.repeat(g.votati)}${'<u></u>'.repeat(Math.max(0, g.votanti - g.votati))}</p><p><b>${g.votati}</b> buste su ${g.votanti}</p></div>`;
    else if (g.finale) main = SER.tvFinale(g);
    const sig = (g.sigilli || []).map(SRA.sigillo).join('');
    const tasti = io && D.s && !D.s.narr ? '<span class="muted">Spazio: avanti · P: pausa</span>' : '';
    const log = (g.log || []).slice(-3);
    return `<div class="sr-tv${SRA.aria(g)}" style="${stile}"${g.atto && g.fase === 'gioco' ? ` data-atto="${esc(g.atto.id)}"` : ''}>${SRA.fumo}
<header class="sr-top"><div class="sr-fasc"><small>Fascicolo riservato</small><h1>${esc(g.titolo || '')}</h1>${g.mondo ? `<p class="sr-mondo">${esc(g.mondo)}</p>` : ''}</div>
<div class="sr-giorno">${g.atto ? `${SRA.arco(g)}<div class="sr-fase"><span>Atto <i>${esc(g.atto.id)}</i>${g.atto.n ? ' di ' + g.atto.n : ''}</span>${g.mom ? '<b>' + esc(g.mom.nome) + '</b>' : ''}<small>${esc(g.atto.titolo)}</small></div>` : ''}</div>
${g.mom && g.mom.id === 'mattina' ? SER.timerH(g.fino, 'sr-timer') : ''}</header>
${sig ? `<ol class="sr-sigilli">${sig}</ol>` : ''}
<main class="sr-main">${main}</main>
<footer class="sr-foot">${log.map((l, i) => `<span class="${i === log.length - 1 ? 'ult' : ''}">${esc(l.testo)}</span>`).join('')}${tasti}</footer>
${g.pausa ? '<div class="sr-pausa"><b>Pausa tecnica</b><small>Siamo fuori dalla finzione. Si riprende tra poco.</small></div>' : ''}</div>`;
  },
  // un documento di prova: foglio battuto a macchina, fermato col nastro
  docH(p, cls, sopra) {
    return `<article class="sr-doc ${cls || ''}"><small>${esc(sopra || 'Prova · ' + p.id)}${p.tipo ? ' · ' + esc(p.tipo) : ''}</small><h2>${esc(p.titolo)}</h2><p>${SER.testo(p.testo)}</p></article>`;
  },
  tvCasting(g, io) {
    const D = SER.D,
      S = seatsNow(),
      narr = S.find(x => x.uid === D.narr);
    const lista = S.map(
      x =>
        `<li class="${x.uid === D.narr ? 'narr' : ''}"><b>${esc(x.name)}</b>${x.uid === D.narr ? '<small>narratore</small>' : io ? `<button class="b sm" data-a="ser" data-v="narr:${esc(x.uid)}">Narratore</button>` : '<small>ospite</small>'}</li>`
    ).join('');
    const n = S.filter(x => x.uid !== D.narr).length,
      a = g.attesi || (D.k && D.k.giocatori) || [0, 0];
    return `<div class="sr-c sr-tavola"><small class="sr-eti">La tavola è apparecchiata</small><h2>Si preparano i personaggi</h2>
<p>${narr ? 'Narratore: <b>' + esc(narr.name) + '</b>' : 'Il narratore tocca «Faccio il narratore» sul suo telefono (oppure sceglilo qui).'}</p>
<ul class="sr-lista">${lista}</ul><p class="muted">${n} ${n === 1 ? 'ospite' : 'ospiti'} · la serata ne vuole da ${a[0]} a ${a[1]}</p>
${io ? `<button class="b gold" data-a="ser" data-v="inizia" ${n < a[0] || n > a[1] ? 'disabled' : ''}>Assegna i personaggi e comincia</button>` : ''}</div>`;
  },
  tvCast(g) {
    const fam = (g.famiglie || [])
      .map(
        f =>
          `<section class="sr-fam" style="--fc:${SRA.fam(g, f.id)}"><h3>${esc(f.nome)}</h3><ul>${(g.cast || [])
            .filter(c => c.fam === f.id)
            .map(c => `<li class="${c.on ? '' : 'via'}">${SRA.volto(c.nome, SRA.fam(g, f.id))}<span><b>${esc(c.nome)}</b><small>${esc(c.ruolo)}</small></span></li>`)
            .join('')}</ul></section>`
      )
      .join('');
    return `<div class="sr-cast${SRA.nuovo('cast')}">${fam}</div>`;
  },
  tvGioco(g) {
    const t = g.turno,
      ult = (g.pubbliche || []).slice(-1)[0];
    let cuore = '';
    if (g.mom && g.mom.id === 'mattina') {
      const d = (g.dich || []).slice(-3).reverse();
      const tc = t && (g.cast.find(c => c.id === t.pid) || {});
      cuore = t
        ? `<div class="sr-turno${SRA.nuovo('turno:' + t.pid + ':' + t.n)}" style="--fc:${SRA.fam(g, tc.fam)}"><small>Ora parla</small>${SRA.volto(t.nome, SRA.fam(g, tc.fam), 'grande')}<h2>${esc(t.nome)}</h2><p>${esc(tc.ruolo || '')}</p></div>`
        : d.length
          ? `<ul class="sr-dich${SRA.nuovo('dich:' + (g.dich || []).length)}">${d.map(x => `<li class="${x.tipo}"><small>${esc(x.nomeFam)} ${x.tipo === 'accusa' ? 'accusa' : 'dichiara'}</small>${esc(x.testo)}</li>`).join('')}</ul>`
          : ult
            ? SER.docH(ult, '', 'Ultima prova pubblica')
            : `<div class="sr-attesa"><small class="sr-eti">Atto ${esc(g.atto.id)}${g.atto.n ? ' di ' + g.atto.n : ''}</small><h2>${esc(g.atto.titolo || g.titolo)}</h2><p>Ascoltate il narratore<span class="dots"></span></p></div>`;
    } else if (g.mom && g.mom.id === 'pomeriggio') {
      const fra = Object.entries(g.fra || {})
        .map(([kk, n]) => {
          const [a, b] = kk.split('-');
          return `<li><span style="--fc:${SRA.fam(g, a)}">${esc(SER.nomeF(a, g))}</span><i><b>${n}</b></i><span style="--fc:${SRA.fam(g, b)}">${esc(SER.nomeF(b, g))}</span></li>`;
        })
        .join('');
      cuore = `<div class="sr-c sr-tempo">${SRA.anello(g.fino)}<div><small class="sr-eti">Tutti con tutti</small><h2>Tempo libero</h2><p>Girate tra le famiglie, mostrate le prove, chiedete copie.</p>${fra ? `<ul class="sr-fra">${fra}</ul>` : ''}</div></div>`;
    } else {
      cuore = `<div class="sr-c sr-tempo">${SRA.anello(g.fino)}<div><small class="sr-eti">A porte chiuse</small><h2>Consiglio di famiglia</h2><p>Si parla solo dentro la propria famiglia.</p></div></div>`;
    }
    const passi = (g.famiglie || [])
      .map(
        f =>
          `<li style="--fc:${SRA.fam(g, f.id)}"><b>${esc(f.nome)}</b><span>${f.passi.length}</span><em>${'<i></i>'.repeat(Math.min(12, f.passi.length))}</em><small>${esc(f.passi.slice(-1)[0] || 'ancora nessun passo')}</small></li>`
      )
      .join('');
    return `<div class="sr-gioco"><div class="sr-cuore">${cuore}</div><aside class="sr-passi"><h3>L’indagine</h3><ul>${passi}</ul></aside></div>`;
  },
  tvFinale(g) {
    const f = g.finale,
      r = f.ris || {};
    const ric = f.ricostruzione.map((t, i) => `<li class="${i === f.ricostruzione.length - 1 && !f.epilogo.length ? 'ult' : ''}">${esc(t)}</li>`).join('');
    const famTop = (r.famiglia || []).map(x => esc(SER.nomeF(x, g))).join(', ');
    const det = (r.detective || []).map(u => esc(SER.nomeP((r.ind[u] || {}).pid, g))).join(', ');
    const gen = (r.generoso || []).map(p => esc(SER.nomeP(p, g))).join(', ');
    const premi = f.epilogo.length
      ? `<ul class="sr-premi"><li><small>Hanno preso il colpevole</small><b>${r.presi}/${r.votanti}</b>${r.franca ? '<em>l’ha fatta franca</em>' : ''}</li>
${famTop ? `<li><small>Famiglia migliore</small><b>${famTop}</b></li>` : ''}${det ? `<li><small>Miglior detective</small><b>${det}</b></li>` : ''}${gen ? `<li><small>Più generoso</small><b>${gen}</b></li>` : ''}</ul>`
      : '';
    return `<div class="sr-c sr-fin${f.passo ? ' sr-svelato' : ''}${SRA.nuovo('fin:' + f.passo + ':' + f.epilogo.length)}${f.passo === 1 ? SRA.nuovo('colpevole').replace('sr-nuovo', 'sr-timbra') : ''}"><div class="sr-nome"><small class="sr-eti">${f.passo ? 'Il colpevole' : 'Il momento è arrivato'}</small><h2>${f.passo ? esc(f.nome) : 'La verità'}</h2>${f.passo ? '<b class="sr-timbro">Colpevole</b>' : ''}</div>
<ol class="sr-ric">${ric}</ol>${f.epilogo.map(t => `<p class="sr-epi">${esc(t)}</p>`).join('')}${premi}</div>`;
  },

  // ======================= CONSOLE DEL NARRATORE =======================
  conH(c) {
    const fase =
      c.fase === 'gioco'
        ? 'Atto ' +
          c.atto.id +
          ' · ' +
          ({ mattina: 'Annunci', pomeriggio: 'Tempo libero', sera: 'Famiglia' }[c.mom] || c.mom)
        : c.fase;
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
    const tab = ui.srcon || 'copione';
    const tabs = [
      ['copione', 'Copione'],
      ['famiglie', 'Famiglie'],
      ['prove', 'Prove'],
      ['persone', 'Persone'],
      ['altro', 'Altro'],
    ]
      .map(([id, n]) => `<button class="${tab === id ? 'sel' : ''}" data-a="ser" data-v="ctab:${id}">${n}</button>`)
      .join('');
    let corpo = '';
    if (tab === 'copione')
      corpo =
        c.mom === 'mattina' && righe
          ? `<ol class="sr-copione">${righe}</ol>`
          : `<p class="sr-ist">${esc((c.momento && c.momento.istruzioni) || c.atto?.obiettivo || '')}</p>${(c.atto?.sblocchi || []).map(x => `<p class="muted">Per sbloccare: ${esc(x)}</p>`).join('')}`;
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
    return `<div class="sr-con" style="${SRA.stile(G)}">
<header><div><small>Console del narratore</small><b>${esc(fase)}</b></div>${SER.timerH(c.fino, 'sr-timer')}<button class="b sm ${c.pausa ? 'gold' : 'sr-rossa'}" data-a="ser" data-v="pausa:${c.pausa ? 0 : 1}">${c.pausa ? 'Riprendi' : 'PAUSA TECNICA'}</button></header>
${prop ? `<ul class="sr-prop">${prop}</ul>` : ''}${dom ? `<ul class="sr-prop">${dom}</ul>` : ''}
<nav class="sr-tabs">${tabs}</nav><div class="sr-corpo">${corpo}</div>
<footer><small>${c.fase === 'voto' ? 'Voti: ' + c.votati + '/' + c.votanti : ''}</small><button class="b gold sr-avanti" data-a="ser" data-v="avanti">${esc(c.prossimo || 'Avanti')}</button></footer></div>`;
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
    const stile = SRA.stile(g);
    if (g.fase === 'casting' || !m.dossier)
      return `<div class="sr-tel sr-c sr-invito" style="${stile}"><small class="sr-eti">Sei invitato a</small><h2>${esc(g.titolo || 'Serata')}</h2><p>La regia prepara i personaggi. Guarda la TV.</p>
${g.fase === 'casting' ? (g.narr === RT.uid() ? '<p class="sr-busta regia">Sei il narratore: avrai la console, non un personaggio.</p><button class="b" data-a="ser" data-v="nonarr">Non faccio più il narratore</button>' : g.narr ? '' : '<button class="b gold" data-a="ser" data-v="narratore">Faccio il narratore</button>') : ''}</div>`;
    const st = m.stato || {},
      d = m.dossier,
      col = SRA.fam(g, (m.fam && m.fam.id) || ((g.cast || []).find(c => c.id === d.id) || {}).fam);
    if (g.pausa)
      return `<div class="sr-tel sr-c sr-pausa-tel" style="${stile}"><small class="sr-eti">Fuori dalla finzione</small><h2>Pausa tecnica</h2><p>Si riprende tra poco.</p></div>`;
    if (st.turno)
      return `<div class="sr-tel sr-c sr-turno-tel" style="${stile}"><small class="sr-eti">Tocca a te</small>${SRA.volto(d.nome, col, 'grande')}<h2>${esc(d.nome)}</h2><p>${esc(st.guida || '')}</p><ul>${d.battute.map(b => `<li>«${esc(b)}»</li>`).join('')}</ul><p class="muted">Sono battute-guida: dille con parole tue.</p></div>`;
    if (g.fase === 'voto' && !st.votato) return SER.votoH(st.accusa, m);
    if (g.fase === 'finale' || g.fase === 'fine') return SER.finaleTel(g, st, d);
    const tab = ui.srtab || 'io';
    const nav = [
      ['io', 'Io', 'utente'],
      ['fam', 'Famiglia', 'amici'],
      ['prove', 'Prove', 'diario'],
      ['persone', 'Persone', 'globo'],
      ['note', 'Taccuino', 'libro'],
    ]
      .map(([id, n, i]) => `<button class="${tab === id ? 'sel' : ''}" data-a="ser" data-v="tab:${id}">${ic(i, 20)}<span>${n}</span></button>`)
      .join('');
    const ult = ((m.msg && m.msg.l) || []).slice(-1)[0];
    const busta =
      ult && ['busta', 'passo', 'regia', 'fuori', 'richiesta'].includes(ult.tipo)
        ? `<p class="sr-busta ${ult.tipo}">${esc(ult.testo)}</p>`
        : '';
    const q = ui.srq || '';
    const corpo = q
      ? SER.cercaH(q, m)
      : { io: SER.ioH, fam: SER.famH, prove: SER.proveH, persone: SER.personeH, note: SER.noteH }[tab](m, g);
    return `<div class="sr-tel${SRA.aria(g)}" style="${stile}"><header class="sr-ttop">${SRA.volto(d.nome, col)}<div><b>${esc(d.nome)}</b><small>${g.atto ? 'Atto ' + esc(g.atto.id) : ''}${g.mom ? ' · ' + esc(g.mom.nome) : ''}</small></div>${SER.timerH(g.fino, 'sr-timer')}</header>
<div class="sr-cerca"><input id="sr-q" placeholder="Cerca in prove, persone, appunti" value="${esc(q)}"><button class="b sm" data-a="ser" data-v="cerca" aria-label="Cerca">${ic('mirino', 18)}</button>${q ? `<button class="b sm" data-a="ser" data-v="cerca:" aria-label="Chiudi la ricerca">${ic('x', 18)}</button>` : ''}</div>
${busta}<div class="sr-corpo sr-t-${q ? 'cerca' : tab}">${corpo}</div><nav class="sr-nav">${nav}</nav></div>`;
  },
  ioH(m, g) {
    const st = m.stato,
      d = m.dossier,
      tocca = st.pv && g.mom && g.mom.id === 'mattina';
    const ob = d.obiettivi
      .map(
        (o, i) =>
          `<li class="${st.ob[i] ? 'fatto' : ''}"><button class="sr-chk" data-a="ser" data-v="ob:${i}:${st.ob[i] ? 0 : 1}" aria-pressed="${!!st.ob[i]}" aria-label="${st.ob[i] ? 'Fatto' : 'Da fare'}">${st.ob[i] ? ic('spunta', 16) : ''}</button><span>${esc(o)}</span></li>`
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
    return `<section class="sr-adesso"><h3>Adesso</h3><p>${esc(st.guida || 'Ascolta il narratore.')}</p>${st.rivela.map(r => `<p class="sr-sblocco">${esc(r)}</p>`).join('')}
${st.fuori ? '<p class="sr-busta fuori">Sei fuori scena per qualche minuto: resta seduto.</p>' : ''}
${tocca ? `<details class="sr-dichiara"><summary>Dichiara a tutti (sei il rappresentante)</summary><textarea id="sr-dich" maxlength="400" placeholder="La vostra scoperta o accusa"></textarea><button class="b sm" data-a="ser" data-v="dichiara:scoperta">Scoperta</button><button class="b sm sr-rossa" data-a="ser" data-v="dichiara:accusa">Accusa</button></details>` : ''}</section>
${
  st.mosse.length
    ? `<section><h3>Prossime mosse</h3><ul class="sr-mosse">${st.mosse
        .slice(-3)
        .reverse()
        .map(
          x => `<li><button class="link" data-a="ser" data-v="p:${x.a}">${esc(x.nome)}</button>: ${esc(x.chiedi)}</li>`
        )
        .join('')}</ul></section>`
    : ''
}
<section class="sr-segreto"><details><summary><b>Riservato</b>Il tuo segreto (non mostrarlo)</summary><p>${esc(d.segreto)}</p>${d.confessione ? `<p class="muted">Se ti scoprono, nel finale: «${esc(d.confessione)}»</p>` : ''}</details></section>
<section><h3>Obiettivi</h3><ul class="sr-ob">${ob}</ul></section>
<section><h3>Battute-guida</h3><ul>${d.battute.map(b => `<li>«${esc(b)}»</li>`).join('')}</ul></section>
<section><h3>Atto per atto</h3><ul>${Object.entries(d.atti)
      .map(([a, t]) => `<li class="${g.atto && g.atto.id === a ? 'qui' : ''}"><b>${esc(a)}</b> ${esc(t)}</li>`)
      .join('')}</ul></section>
${sez}<p><button class="link" data-a="ser" data-v="esco">Esco dal ruolo…</button></p>`;
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
          `<li class="${x.on ? '' : 'via'}">${SRA.volto(x.nome, SRA.fam(g, f.id))}<span>${esc(x.nome)}</span>${x.pv ? '<b>rappresentante</b>' : `<button class="b sm" data-a="ser" data-v="pv:${x.pid}">Voto lui</button>`}</li>`
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
                `<li class="${c.on ? '' : 'via'}"><button class="link" data-a="ser" data-v="p:${c.id}">${SRA.volto(c.nome, SRA.fam(g, f.id))}<b>${esc(c.nome)}</b> <small>${esc(c.ruolo)}${(n.p || {})[c.id] ? ' · appunti' : ''}</small></button></li>`
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
    return `<div class="sr-tel sr-voto" style="${SRA.stile(G)}"><small class="sr-eti">Verbale</small><h2>L’accusa</h2><p class="muted">Vota secondo gli indizi che hai davvero raccolto.</p>${campi}${gen}<button class="b gold" data-a="ser" data-v="vota">Consegna il voto</button>${m.stato.pv && !m.fam.votato ? '<button class="b" data-a="ser" data-v="vota:fam">Consegna anche come voto della famiglia</button>' : ''}</div>`;
  },
  finaleTel(g, st, d) {
    const r = st.ris;
    return `<div class="sr-tel sr-c sr-fin-tel" style="${SRA.stile(g)}"><small class="sr-eti">Caso chiuso</small><h2>La verità</h2>${g.finale && g.finale.passo ? `<p class="sr-nome-tel">${esc(g.finale.nome)}<b class="sr-timbro">Colpevole</b></p>` : ''}${g.finale ? '<ol class="sr-ric">' + g.finale.ricostruzione.map(t => `<li>${esc(t)}</li>`).join('') + '</ol>' : ''}${r ? `<p>I tuoi punti: <b>${r.tot}</b> (accusa ${r.voto}, interpretazione ${r.interp})</p><p>La tua famiglia: <b>${r.fam ? r.fam.tot : 0}</b></p>` : '<p>Guarda la TV.</p>'}<details><summary>Il tuo dossier</summary><p>${esc(d.segreto)}</p></details></div>`;
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
      case 'cerca':
        ui.srq = a1 === undefined ? val('sr-q') : '';
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
