/* SERATA: cena con delitto per famiglie (fino a 40 persone), regole pure senza rete né DOM.
   Lo stato è quello privato del motore (la TV regista, regia/CODICE): contiene il kit in corso, la soluzione e ciò che
   ognuno ha in mano. Ai telefoni arriva solo mani(s,k)[uid] (dossier, prove, famiglia, messaggi; al narratore la
   console) e alla stanza pubblico(s,k). Formato del kit e regole: docs/SERATA.md. Contratto:
   - valida(k) -> [errori]              kit ben fatto e risolvibile (orari canonici, catene di prova, riferimenti)
   - avvisi(k) -> [avvisi]              cose lecite ma sospette (un collegamento tutto dentro una famiglia…)
   - scegli(k, n) -> [id personaggi]    chi entra con n giocatori (essenziali, poi facoltativi in ordine)
   - nuova(k, giocatori, opz) -> {s}|{err}   giocatori [{uid,nome}], opz {rnd, scelte:{uid:pid}, narratore:uid}
   - act(s, a, k, ora) -> {s}|{err}     a = {t, uid, ...}: comandi della console (t:'cmd') o richieste dei telefoni
   - tick(s, k, ora) -> {s}|null        timer, riserve in attesa, fine del pomeriggio
   - pubblico(s, k), mani(s, k)         cosa vede la sala, cosa vede ogni telefono
   Tempo: atti, ognuno con mattina (annunci e copione), pomeriggio (libero, a tempo) e sera (solo in famiglia).
   Le prove passano da sigillate ad annunciate, consegnate, mostrate, pubbliche. Mai Date né Math.random: l'ora e il caso
   arrivano da fuori (opz.rnd), così le partite simulate si ripetono uguali. */
const SERATA = (() => {
  const clone = o => JSON.parse(JSON.stringify(o));
  const testo = v => typeof v === 'string' && v.trim().length > 0;
  const MOMENTI = ['mattina', 'pomeriggio', 'sera'];
  const NOMI = { mattina: 'Mattina', pomeriggio: 'Pomeriggio', sera: 'Sera' };
  const CUE = ['prova', 'sigillo', 'audio', 'mondo', 'mostra'];
  const TIPI_PROVA = ['documento', 'foto', 'audio', 'testimonianza', 'oggetto', 'carte'];
  const TIPI_DOMANDA = ['personaggio', 'scelta', 'prove', 'testo'];
  const LIM = { msg: 30, log: 40, dich: 12, falliti: 8, tentativi: 3, aiuto: 2 };
  const ORA_RE = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;

  // ---- lettura del kit ----
  const pers = (k, id) => k.personaggi.find(p => p.id === id);
  const prova = (k, id) => k.prove.find(p => p.id === id);
  const coll = (k, id) => (k.collegamenti || []).find(c => c.id === id);
  const attoIdx = (k, id) => k.atti.findIndex(a => a.id === id);
  const momentiDi = a => MOMENTI.filter(m => a && a[m]);
  const nomeMom = (k, m) => (k.momenti && k.momenti[m] && k.momenti[m].nome) || NOMI[m];
  const destin = r => (r === undefined || r === null ? [] : Array.isArray(r) ? r : [r]);
  const righe = a => (a.mattina && a.mattina.scene ? a.mattina.scene.flatMap(sc => sc.righe || []) : []);
  const membri = (k, f) => k.personaggi.filter(p => p.famiglia === f).map(p => p.id);
  // il nome del personaggio nella versione scelta al casting (f/m)
  const nomeP = (k, s, pid) => {
    const p = pers(k, pid);
    if (!p) return '?';
    const v = s && s.var && s.var[pid];
    return (v && p.varianti && p.varianti[v] && p.varianti[v].nome) || p.nome;
  };
  // gli atti del dossier possono essere scritti a intervalli: "I-II", "V-VI"
  function guidaAtti(k, p) {
    const out = {};
    for (const [key, v] of Object.entries(p.atti || {})) {
      const [a, b] = key.split('-');
      const i = attoIdx(k, a),
        j = b ? attoIdx(k, b) : i;
      if (i < 0 || j < 0) continue;
      for (let x = i; x <= j; x++) out[k.atti[x].id] = v;
    }
    return out;
  }
  // le prove richiamate dal copione (escono quando il narratore arriva alla riga, non all'inizio dell'atto)
  const daCopione = a =>
    new Set(
      righe(a)
        .filter(r => r.cue && r.cue.prova)
        .map(r => r.cue.prova)
    );

  // ---- validatore ----
  function orariDi(v, out) {
    if (typeof v === 'string') for (const m of v.matchAll(ORA_RE)) out.add(m[1].padStart(2, '0') + ':' + m[2]);
    else if (Array.isArray(v)) v.forEach(x => orariDi(x, out));
    else if (v && typeof v === 'object') Object.values(v).forEach(x => orariDi(x, out));
    return out;
  }
  function validaDest(k, d, no, dove) {
    for (const x of destin(d)) {
      if (x === 'tutti') continue;
      if (!x || typeof x !== 'object') no(dove + ': destinatario non valido');
      else if (x.fam !== undefined) {
        if (!k.famiglie.some(f => f.id === x.fam)) no(dove + ': famiglia «' + x.fam + '» sconosciuta');
      } else if (x.portavoce !== undefined) {
        if (!k.famiglie.some(f => f.id === x.portavoce)) no(dove + ': famiglia «' + x.portavoce + '» sconosciuta');
      } else if (x.p !== undefined) {
        if (!pers(k, x.p)) no(dove + ': personaggio «' + x.p + '» sconosciuto');
      } else no(dove + ': destinatario senza fam/p/portavoce');
    }
  }
  function valida(k) {
    const e = [],
      no = m => e.push(m);
    if (!k || typeof k !== 'object') return ['kit vuoto'];
    if (!/^[\w-]{1,40}$/.test(k.id || '')) no('id del kit non valido');
    if (k.formato !== 'serata') no('formato deve essere «serata»');
    if (!testo(k.titolo)) no('titolo mancante');
    const g = k.giocatori;
    if (!Array.isArray(g) || g.length !== 2 || !(g[0] >= 1 && g[1] >= g[0] && g[1] <= 60)) no('giocatori [min, max]');
    if (!Array.isArray(k.famiglie) || !k.famiglie.length) no('servono le famiglie');
    if (!Array.isArray(k.personaggi) || !k.personaggi.length) no('servono i personaggi');
    if (!Array.isArray(k.prove)) no('servono le prove');
    if (!Array.isArray(k.atti) || !k.atti.length) no('servono gli atti');
    if (e.length) return e;
    const uniq = (l, cosa) => {
      const v = new Set();
      for (const x of l) {
        if (!x || !/^[\w-]{1,32}$/.test(x.id || '')) no(cosa + ': id non valido «' + (x && x.id) + '»');
        else if (v.has(x.id)) no(cosa + ': id ripetuto «' + x.id + '»');
        v.add(x && x.id);
      }
    };
    uniq(k.famiglie, 'famiglia');
    uniq(k.personaggi, 'personaggio');
    uniq(k.prove, 'prova');
    uniq(k.atti, 'atto');
    uniq(k.sigilli || [], 'sigillo');
    uniq(k.collegamenti || [], 'collegamento');
    uniq(k.audio || [], 'audio');
    const ess = k.personaggi.filter(p => p.essenziale);
    if (g[0] < ess.length) no('min giocatori (' + g[0] + ') minore dei personaggi essenziali (' + ess.length + ')');
    if (g[1] > k.personaggi.length) no('max giocatori oltre i personaggi');
    const colp = k.personaggi.filter(p => p.colpevole);
    if (colp.length !== 1) no('serve esattamente un colpevole');
    for (const f of k.famiglie) if (!membri(k, f.id).length) no('famiglia «' + f.id + '» senza membri');
    for (const p of k.personaggi) {
      const d = 'personaggio ' + p.id;
      if (!testo(p.nome)) no(d + ': nome');
      if (!k.famiglie.some(f => f.id === p.famiglia)) no(d + ': famiglia sconosciuta');
      if (!testo(p.segreto)) no(d + ': segreto mancante');
      if (!p.essenziale && p.riserva && !(pers(k, p.riserva) || {}).essenziale)
        no(d + ': la riserva deve essere un personaggio essenziale');
      for (const l of p.legami || []) if (!pers(k, l.con)) no(d + ': legame con «' + l.con + '» sconosciuto');
      for (const key of Object.keys(p.atti || {}))
        for (const a of key.split('-')) if (attoIdx(k, a) < 0) no(d + ': atto «' + a + '» sconosciuto');
      for (const r of p.rivela || []) {
        if (r.quando && r.quando.pubblica && !prova(k, r.quando.pubblica))
          no(d + ': rivela dopo una prova sconosciuta');
        if (r.atto && attoIdx(k, r.atto) < 0) no(d + ': rivela in un atto sconosciuto');
      }
      for (const m of p.mosse || []) if (!pers(k, m.a)) no(d + ': mossa verso «' + m.a + '» sconosciuto');
      if (p.varianti)
        for (const v of Object.keys(p.varianti)) if (!['f', 'm'].includes(v)) no(d + ': variante «' + v + '»');
    }
    const ord = id => attoIdx(k, id);
    for (const p of k.prove) {
      const d = 'prova ' + p.id;
      if (!testo(p.titolo)) no(d + ': titolo');
      if (!testo(p.testo)) no(d + ': testo');
      if (p.tipo && !TIPI_PROVA.includes(p.tipo)) no(d + ': tipo «' + p.tipo + '»');
      const r = p.rilascio || {};
      if (ord(r.atto) < 0) no(d + ': atto di rilascio sconosciuto');
      if (r.momento && !MOMENTI.includes(r.momento)) no(d + ': momento «' + r.momento + '»');
      validaDest(k, r.a, no, d);
      if (p.annuncia && !(ord(p.annuncia.atto) >= 0 && ord(p.annuncia.atto) <= ord(r.atto)))
        no(d + ': annunciata dopo il rilascio');
      for (const x of p.poi || []) {
        if (ord(x.atto) < ord(r.atto)) no(d + ': passaggio prima del rilascio');
        validaDest(k, x.a, no, d + ' (poi)');
      }
      for (const x of p.dopo || []) {
        const q = prova(k, x);
        if (!q) no(d + ': dopo una prova sconosciuta «' + x + '»');
        else if (ord(q.rilascio.atto) > ord(r.atto)) no(d + ': dipende da «' + x + '» che esce dopo');
      }
      if (p.riserva) validaDest(k, p.riserva.a, no, d + ' (riserva)');
    }
    const sig = new Set((k.sigilli || []).map(x => x.id)),
      aud = new Set((k.audio || []).map(x => x.id));
    for (const a of k.atti) {
      const d = 'atto ' + a.id;
      if (!momentiDi(a).length) no(d + ': nessun momento (mattina, pomeriggio, sera)');
      for (const m of ['pomeriggio', 'sera']) if (a[m] && !(a[m].minuti > 0)) no(d + ': ' + m + ' senza minuti');
      for (const r of righe(a)) {
        if (r.chi !== undefined && !pers(k, r.chi)) no(d + ': battuta di «' + r.chi + '» sconosciuto');
        if (r.cue) {
          const t = Object.keys(r.cue)[0];
          if (!CUE.includes(t)) no(d + ': comando «' + t + '» sconosciuto');
          if (r.cue.prova) {
            const q = prova(k, r.cue.prova);
            if (!q) no(d + ': il copione rilascia «' + r.cue.prova + '» che non esiste');
            else if (q.rilascio.atto !== a.id)
              no(d + ': il copione rilascia «' + q.id + '» che è dell’atto ' + q.rilascio.atto);
          }
          if (r.cue.mostra && !prova(k, r.cue.mostra)) no(d + ': mostra «' + r.cue.mostra + '» che non esiste');
          if (r.cue.sigillo && !sig.has(r.cue.sigillo)) no(d + ': sigillo «' + r.cue.sigillo + '» sconosciuto');
          if (r.cue.audio && !aud.has(r.cue.audio)) no(d + ': audio «' + r.cue.audio + '» sconosciuto');
        }
      }
      if (a.sera && a.sera.modulo)
        for (const q of a.sera.modulo) if (!TIPI_DOMANDA.includes(q.tipo)) no(d + ': domanda di sera «' + q.tipo + '»');
    }
    const ids = new Set(k.prove.map(p => p.id));
    for (const c of k.collegamenti || []) {
      const d = 'collegamento ' + c.id;
      if (!Array.isArray(c.servono) || c.servono.length < 2) no(d + ': servono almeno due pezzi');
      for (const x of c.servono || [])
        if (x[0] === '@' ? !coll(k, x.slice(1)) : !ids.has(x)) no(d + ': pezzo «' + x + '» sconosciuto');
      if (!Array.isArray(c.scelte) || c.scelte.length < 2 || !(c.giusta >= 0 && c.giusta < c.scelte.length))
        no(d + ': scelte e risposta giusta');
      if (!testo(c.passo)) no(d + ': manca il titolo del passo avanti');
      if (c.spegne && !sig.has(c.spegne)) no(d + ': spegne un sigillo sconosciuto');
    }
    // accusa e soluzione
    const acc = k.accusa || {},
      sol = k.soluzione || {};
    if (!Array.isArray(acc.domande) || !acc.domande.length) no('accusa: servono le domande');
    else
      for (const q of acc.domande) {
        if (!TIPI_DOMANDA.includes(q.tipo)) no('accusa: tipo «' + q.tipo + '»');
        if (q.tipo === 'scelta' && !(Array.isArray(q.scelte) && q.scelte.length >= 2))
          no('accusa ' + q.id + ': scelte');
      }
    if (!colp.length || sol.colpevole !== colp[0].id)
      no('soluzione: il colpevole deve coincidere con il personaggio colpevole');
    // ogni risposta dell'accusa è provata da almeno due prove, che non stanno all'inizio in una sola famiglia
    for (const [q, l] of Object.entries(sol.prove || {})) {
      if (!Array.isArray(l) || l.length < 2) no('soluzione: «' + q + '» va provata da almeno due prove');
      const fam = new Set();
      for (const x of l || []) {
        const p = prova(k, x);
        if (!p) {
          no('soluzione: prova «' + x + '» sconosciuta');
          continue;
        }
        for (const d of destin(p.rilascio.a))
          fam.add(d === 'tutti' ? '*' : d.fam || d.portavoce || (pers(k, d.p) || {}).famiglia);
      }
      if (fam.size < 2 && !fam.has('*')) no('soluzione: le prove di «' + q + '» stanno tutte in una famiglia');
    }
    if (!sol.prove || !Object.keys(sol.prove).length) no('soluzione: manca la matrice delle prove');
    // orari: ogni orario scritto nei testi deve stare nella cronologia canonica
    if (Array.isArray(sol.orari)) {
      const ok = new Set(sol.orari),
        dove = [
          ...k.prove.map(p => ['prova ' + p.id, [p.testo, p.estratto, p.titolo]]),
          ...k.personaggi.map(p => [
            'personaggio ' + p.id,
            [p.passato, p.segreto, p.comodo, p.atti, p.battute, p.pubblico],
          ]),
          ...k.atti.map(a => ['atto ' + a.id, righe(a)]),
        ];
      for (const [d, v] of dove)
        for (const o of orariDi(v, new Set())) if (!ok.has(o)) no(d + ': orario ' + o + ' fuori cronologia');
    }
    for (const r of k.punteggio || []) {
      const q = (acc.domande || []).find(x => x.id === r.domanda);
      if (!q) no('punteggio: domanda «' + r.domanda + '» sconosciuta');
    }
    return e;
  }
  function avvisi(k) {
    const out = [];
    for (const c of k.collegamenti || []) {
      const fam = new Set();
      for (const x of c.servono)
        if (x[0] !== '@')
          for (const d of destin((prova(k, x) || { rilascio: {} }).rilascio.a))
            fam.add(d === 'tutti' ? '*' : d.fam || d.portavoce || (pers(k, d.p) || {}).famiglia);
      if (fam.size === 1 && !fam.has('*'))
        out.push('collegamento ' + c.id + ': tutti i pezzi nascono in una sola famiglia');
    }
    for (const f of k.famiglie) {
      const mie = k.prove.filter(p =>
        destin(p.rilascio.a).some(
          d => d.fam === f.id || d.portavoce === f.id || (d.p && pers(k, d.p).famiglia === f.id)
        )
      );
      if (!mie.length) out.push('famiglia ' + f.id + ': non riceve nessuna prova');
    }
    return out;
  }

  // ---- assegnazione ----
  function scegli(k, n) {
    const ess = k.personaggi.filter(p => p.essenziale).map(p => p.id),
      fac = k.personaggi.filter(p => !p.essenziale).map(p => p.id);
    return ess.concat(fac).slice(0, Math.max(n, 0));
  }
  function nuova(k, giocatori, opz) {
    opz = opz || {};
    const err = valida(k);
    if (err.length) return { err: 'Kit non valido: ' + err[0] };
    const n = giocatori.length;
    if (n < k.giocatori[0] || n > k.giocatori[1])
      return { err: 'Servono da ' + k.giocatori.join(' a ') + ' giocatori' };
    const rnd = opz.rnd || (() => 0.5),
      dentro = scegli(k, n),
      liberi = dentro.slice(),
      di = {},
      gioc = {};
    for (const p of k.personaggi) di[p.id] = null;
    const senza = [];
    for (const g of giocatori) {
      const voluto = opz.scelte && opz.scelte[g.uid];
      if (voluto && liberi.includes(voluto)) {
        liberi.splice(liberi.indexOf(voluto), 1);
        di[voluto] = g.uid;
        gioc[g.uid] = { pid: voluto, nome: g.nome };
      } else senza.push(g);
    }
    for (const g of senza) {
      const pid = liberi.splice(Math.floor(rnd() * liberi.length), 1)[0];
      di[pid] = g.uid;
      gioc[g.uid] = { pid, nome: g.nome };
    }
    const fam = {};
    for (const f of k.famiglie) {
      const m = membri(k, f.id).filter(pid => di[pid]);
      fam[f.id] = {
        pv: m.length ? di[m[0]] : '',
        voti: {},
        bacheca: [],
        ded: [],
        quesito: null,
        tent: {},
        falliti: {},
        chiusi: {},
        dom: {},
        mod: {},
        punti: 0,
      };
    }
    const s = {
      v: 1,
      kit: k.id,
      fase: 'pronta',
      atto: -1,
      mom: '',
      riga: 0,
      fino: 0,
      da: 0,
      resto: 0,
      pausa: false,
      n: 0,
      gioc,
      di,
      var: opz.varianti || {},
      narr: opz.narratore || '',
      usc: {},
      fuori: {},
      fam,
      mie: {},
      pub: [],
      ann: {},
      att: [],
      rel: {},
      sig: {},
      prop: [],
      msg: {},
      ric: [],
      dich: [],
      dom: [],
      rav: [],
      turno: null,
      cue: null,
      mondo: k.mondo || '',
      voti: {},
      votiFam: {},
      gen: {},
      interp: {},
      ob: {},
      seq: {},
      stat: { copie: {}, scambi: 0, fra: {} },
      log: [],
      ris: null,
      fin: 0,
    };
    for (const p of k.personaggi) s.mie[p.id] = {};
    for (const x of k.sigilli || []) s.sig[x.id] = 1;
    return { s };
  }

  // ---- piccoli aiuti sullo stato ----
  const attivo = (s, pid) => !!s.di[pid] && !s.usc[pid];
  const pidDi = (s, uid) => (s.gioc[uid] || {}).pid || '';
  const famDi = (k, pid) => (pers(k, pid) || {}).famiglia || '';
  const uidPv = (s, f) => s.fam[f].pv;
  function log(s, t) {
    s.log.push({ n: ++s.n, testo: t });
    if (s.log.length > LIM.log) s.log.splice(0, s.log.length - LIM.log);
  }
  function scrivi(s, uid, testo, tipo) {
    if (!uid) return;
    const l = (s.msg[uid] = s.msg[uid] || []);
    l.push({ n: ++s.n, testo, tipo: tipo || 'info' });
    if (l.length > LIM.msg) l.splice(0, l.length - LIM.msg);
  }
  const avvisaRegia = (s, testo) => {
    s.rav.push({ n: ++s.n, testo });
    if (s.rav.length > LIM.msg) s.rav.splice(0, s.rav.length - LIM.msg);
  };
  const ilPortavoce = (s, f) => {
    const uid = s.fam[f].pv;
    return uid && !s.usc[pidDi(s, uid)] ? uid : '';
  };
  // chi vede una prova: chi la tiene, la sua famiglia se è in bacheca, tutti se è pubblica
  function vede(s, k, pid, eid) {
    if (s.pub.includes(eid)) return true;
    if (s.mie[pid] && s.mie[pid][eid]) return true;
    return s.fam[famDi(k, pid)].bacheca.includes(eid);
  }
  const versione = (s, pid, eid) => {
    const m = s.mie[pid] && s.mie[pid][eid];
    return m && m.ver === 'e' ? 'e' : 'i';
  };
  const testoProva = (p, ver) => (ver === 'e' && p.estratto ? p.estratto : p.testo);

  // ---- rilasci ----
  function dai(s, k, pid, eid, da, ver, ora) {
    const p = prova(k, eid),
      m = s.mie[pid],
      gia = m[eid];
    if (gia && (gia.ver === 'i' || ver === 'e')) return false;
    m[eid] = { da: da || 'regia', ver: ver || (gia ? gia.ver : 'i'), ora };
    scrivi(s, s.di[pid], (gia ? 'Versione completa: ' : 'Nuova prova: ') + p.titolo, 'busta');
    return true;
  }
  // consegna una prova a un destinatario; un personaggio senza giocatore passa la mano alla riserva
  function consegna(s, k, eid, dest, ver, ora, da) {
    const p = prova(k, eid);
    s.rel[eid] = 1;
    for (const d of destin(dest)) {
      if (d === 'tutti') {
        if (!s.pub.includes(eid)) {
          s.pub.push(eid);
          log(s, 'Prova pubblica: ' + p.titolo);
          s.cue = { tipo: 'mostra', id: eid, n: ++s.n };
        }
      } else if (d.fam !== undefined) {
        for (const pid of membri(k, d.fam)) if (attivo(s, pid)) dai(s, k, pid, eid, da, ver, ora);
        if (!membri(k, d.fam).some(pid => attivo(s, pid)))
          avvisaRegia(s, p.id + ': nessuno gioca nella famiglia ' + d.fam);
      } else if (d.portavoce !== undefined) {
        const uid = ilPortavoce(s, d.portavoce);
        if (uid) dai(s, k, pidDi(s, uid), eid, da, ver, ora);
        else avvisaRegia(s, p.id + ': la famiglia ' + d.portavoce + ' non ha un portavoce');
      } else if (d.p !== undefined) {
        if (attivo(s, d.p)) dai(s, k, d.p, eid, da, ver, ora);
        else riserva(s, k, eid, d.p, ver, ora);
      }
    }
  }
  function riserva(s, k, eid, pid, ver, ora) {
    const p = prova(k, eid),
      ch = pers(k, pid),
      r = p.riserva || {},
      a = r.a || (ch.riserva && attivo(s, ch.riserva) ? { p: ch.riserva } : { portavoce: ch.famiglia });
    s.att.push({ eid, a, ver, quando: ora + (r.minuti || 0) * 60000 });
    avvisaRegia(
      s,
      p.titolo +
        ': ' +
        nomeP(k, s, pid) +
        ' non c’è, passa alla riserva' +
        (r.minuti ? ' tra ' + r.minuti + ' minuti' : '')
    );
  }
  function apriAtto(s, k, i, ora) {
    const a = k.atti[i];
    s.fase = 'gioco';
    s.atto = i;
    s.riga = 0;
    s.turno = null;
    log(s, 'Atto ' + a.id + ' · ' + (a.titolo || ''));
    for (const p of k.prove) if (p.annuncia && p.annuncia.atto === a.id && !s.rel[p.id]) annuncia(s, k, p);
    // passaggi successivi di prove già uscite (es. E09 integrale a Viola, E08 in copia alla stampa)
    for (const p of k.prove)
      for (const x of p.poi || [])
        if (x.atto === a.id && s.rel[p.id]) consegna(s, k, p.id, x.a, x.versione === 'estratto' ? 'e' : 'i', ora);
    apriMomento(s, k, momentiDi(a)[0], ora);
  }
  function annuncia(s, k, p) {
    s.ann[p.id] = 1;
    for (const d of destin(p.rilascio.a))
      if (d.p && attivo(s, d.p))
        scrivi(s, s.di[d.p], 'Hai una busta chiusa: ' + p.titolo + '. Si apre più avanti.', 'busta');
  }
  function apriMomento(s, k, m, ora) {
    const a = k.atti[s.atto],
      cop = daCopione(a);
    s.mom = m;
    s.turno = null;
    s.fino = a[m].minuti ? ora + a[m].minuti * 60000 : 0;
    s.da = ora; // da quando dura il momento: l'orologio in alto a destra conta in avanti se non c'è un tempo massimo
    s.resto = 0;
    log(s, nomeMom(k, m));
    for (const p of k.prove) {
      const r = p.rilascio;
      if (r.atto !== a.id || s.rel[p.id] || cop.has(p.id) || p.regia) continue;
      if ((r.momento || 'mattina') !== m) continue;
      rilascia(s, k, p.id, ora);
    }
  }
  // rilascio secondo il kit; se dipende da altre prove non ancora uscite aspetta in coda
  function rilascia(s, k, eid, ora, dest) {
    const p = prova(k, eid);
    if ((p.dopo || []).some(x => !s.rel[x])) {
      if (!s.att.some(x => x.eid === eid && x.dopo))
        s.att.push({ eid, a: dest || p.rilascio.a, dopo: true, quando: 0 });
      return;
    }
    consegna(s, k, eid, dest || p.rilascio.a, p.rilascio.versione === 'estratto' ? 'e' : 'i', ora);
  }

  // ---- collegamenti e passi avanti ----
  const chiave = l => l.slice().sort().join('+');
  function vedeFam(s, k, f, x) {
    if (x[0] === '@') return s.fam[f].ded.includes(x.slice(1));
    return s.pub.includes(x) || s.fam[f].bacheca.includes(x);
  }
  // pezzi mancanti: collegamenti in cui la famiglia vede qualcosa ma non tutto
  function mancanti(s, k, f) {
    const out = [],
      liv = k.mancanti || 'famiglia';
    if (liv === 'nulla') return out;
    for (const c of k.collegamenti || []) {
      if (s.fam[f].ded.includes(c.id)) continue;
      const visti = c.servono.filter(x => vedeFam(s, k, f, x));
      if (!visti.length || visti.length === c.servono.length) continue;
      for (const x of c.servono) {
        if (vedeFam(s, k, f, x) || x[0] === '@' || !s.rel[x]) continue;
        const dove = new Set();
        for (const pid of Object.keys(s.mie))
          if (s.mie[pid][x] && attivo(s, pid)) dove.add(liv === 'persona' ? nomeP(k, s, pid) : famDi(k, pid));
        if (!dove.size) continue;
        const nomi = [...dove].map(d => (liv === 'persona' ? d : (k.famiglie.find(z => z.id === d) || {}).nome || d));
        out.push({ con: visti.map(v => (v[0] === '@' ? 'una vostra deduzione' : prova(k, v).titolo)), dove: nomi });
      }
    }
    return out;
  }
  function collega(s, k, f, ids, ora) {
    const F = s.fam[f],
      at = s.atto;
    if (F.quesito) return { err: 'Rispondete prima al collegamento aperto' };
    if (!Array.isArray(ids) || ids.length < 2) return { err: 'Scegli almeno due carte' };
    for (const x of ids) if (!vedeFam(s, k, f, x)) return { err: 'Una carta non è sulla vostra bacheca' };
    const c = (k.collegamenti || []).find(c => chiave(c.servono) === chiave(ids));
    if (!c) {
      F.falliti[at] = (F.falliti[at] || 0) + 1;
      if (F.falliti[at] > LIM.falliti)
        return { err: 'Troppi tentativi a vuoto in questo atto: parlate con le altre famiglie' };
      return { s, msg: 'Queste carte non si collegano tra loro' };
    }
    if (F.ded.includes(c.id)) return { err: 'Questo collegamento lo avete già fatto' };
    if (F.chiusi[c.id] === at) return { err: 'Questo collegamento si riapre nel prossimo atto' };
    F.quesito = { id: c.id, domanda: c.domanda || 'Che cosa dimostrano insieme?', scelte: c.scelte };
    return { s };
  }
  function risolvi(s, k, f, scelta, ora) {
    const F = s.fam[f],
      q = F.quesito;
    if (!q) return { err: 'Nessun collegamento aperto' };
    const c = coll(k, q.id);
    F.quesito = null;
    if (+scelta === c.giusta) {
      F.ded.push(c.id);
      F.punti += c.punti || 1;
      const nf = (k.famiglie.find(x => x.id === f) || {}).nome || f;
      log(s, nf + ': ' + c.passo);
      s.cue = { tipo: 'passo', fam: f, id: c.id, n: ++s.n };
      for (const pid of membri(k, f)) if (attivo(s, pid)) scrivi(s, s.di[pid], 'Passo avanti: ' + c.passo, 'passo');
      if (c.spegne && s.sig[c.spegne]) {
        if (c.auto) spegni(s, k, c.spegne);
        else if (!s.prop.some(x => x.id === c.spegne)) {
          s.prop.push({ n: ++s.n, tipo: 'sigillo', id: c.spegne, fam: f, coll: c.id });
          avvisaRegia(s, nf + ' ha collegato «' + c.passo + '»: spegnere ' + c.spegne + '?');
        }
      }
      return { s };
    }
    F.tent[c.id] = (F.tent[c.id] || 0) + 1;
    let m = 'Non ancora: la conclusione non regge';
    if (F.tent[c.id] >= LIM.aiuto && c.aiuto) m += '. Suggerimento: ' + c.aiuto;
    if (F.tent[c.id] >= LIM.tentativi) {
      F.chiusi[c.id] = s.atto;
      F.tent[c.id] = 0;
      m += '. Riprovate nel prossimo atto';
    }
    for (const pid of membri(k, f)) if (attivo(s, pid)) scrivi(s, s.di[pid], m, 'avviso');
    return { s };
  }
  function spegni(s, k, id) {
    if (!s.sig[id]) return;
    s.sig[id] = 0;
    s.prop = s.prop.filter(x => x.id !== id);
    const x = (k.sigilli || []).find(z => z.id === id) || {};
    log(s, 'Si spegne ' + (x.nome || id));
    s.cue = { tipo: 'sigillo', id, n: ++s.n };
  }

  // ---- avanzamento ----
  function avanti(s, k, ora) {
    if (s.fase === 'pronta') return apriAtto(s, k, 0, ora);
    if (s.fase === 'gioco') {
      const a = k.atti[s.atto];
      if (s.mom === 'mattina') {
        const l = righe(a);
        if (s.riga < l.length) return riga(s, k, l[s.riga++], ora);
      }
      const ms = momentiDi(a),
        i = ms.indexOf(s.mom);
      if (i + 1 < ms.length) return apriMomento(s, k, ms[i + 1], ora);
      // prima di cambiare atto: escono comunque le prove dell'atto rimaste nel copione non letto
      for (const p of k.prove) if (p.rilascio.atto === a.id && !s.rel[p.id] && !p.regia) rilascia(s, k, p.id, ora);
      if (s.atto + 1 < k.atti.length) return apriAtto(s, k, s.atto + 1, ora);
      s.fase = 'voto';
      s.mom = '';
      s.turno = null;
      s.fino = 0;
      log(s, 'Si vota');
      return;
    }
    if (s.fase === 'voto') {
      s.fase = 'finale';
      s.fin = 0;
      s.ris = risultati(s, k);
      log(s, 'La verità');
      return;
    }
    if (s.fase === 'finale') {
      const n = ((k.soluzione || {}).ricostruzione || []).length;
      if (s.fin < n) s.fin++;
      else {
        // epilogo: si spengono anche gli ultimi sigilli (nella bibbia «NOME» solo dopo la ricostruzione)
        s.fase = 'fine';
        for (const id of Object.keys(s.sig)) if (s.sig[id]) spegni(s, k, id);
      }
    }
  }
  function riga(s, k, r, ora) {
    s.turno = r.chi ? { pid: r.chi, n: ++s.n } : null;
    if (r.chi && attivo(s, r.chi)) scrivi(s, s.di[r.chi], 'Tocca a te: parla adesso', 'turno');
    if (!r.cue) return;
    const c = r.cue;
    if (c.prova) rilascia(s, k, c.prova, ora);
    if (c.sigillo) spegni(s, k, c.sigillo);
    if (c.audio) s.cue = { tipo: 'audio', id: c.audio, n: ++s.n };
    if (c.mostra) {
      if (!s.rel[c.mostra]) rilascia(s, k, c.mostra, ora);
      if (!s.pub.includes(c.mostra)) consegna(s, k, c.mostra, 'tutti', 'i', ora);
      s.cue = { tipo: 'mostra', id: c.mostra, n: ++s.n };
    }
    if (c.mondo !== undefined) {
      s.mondo = c.mondo;
      log(s, c.mondo);
    }
  }
  function tick(s0, k, ora) {
    const s = clone(s0);
    let cambia = false;
    if (s.pausa) return null;
    for (const x of s.att.slice()) {
      const p = prova(k, x.eid);
      if (x.dopo ? (p.dopo || []).every(d => s.rel[d]) : ora >= x.quando) {
        s.att.splice(s.att.indexOf(x), 1);
        consegna(s, k, x.eid, x.a, x.ver || 'i', ora, 'riserva');
        cambia = true;
      }
    }
    for (const [pid, fino] of Object.entries(s.fuori))
      if (ora >= fino) {
        delete s.fuori[pid];
        scrivi(s, s.di[pid], 'Puoi tornare in scena', 'info');
        cambia = true;
      }
    // il pomeriggio ha un tempo massimo: allo scadere si passa alla sera
    if (s.fase === 'gioco' && s.mom === 'pomeriggio' && s.fino && ora >= s.fino) {
      avanti(s, k, ora);
      cambia = true;
    }
    return cambia ? { s } : null;
  }

  // ---- voto e punteggio ----
  function giusta(r, v) {
    if (Array.isArray(r.giusta)) return r.giusta.includes(v);
    return v === r.giusta;
  }
  function puntiVoto(k, v) {
    let p = 0;
    const det = {};
    for (const r of k.punteggio || []) {
      const x = v && v[r.domanda];
      let ok = false;
      if (r.gruppi) {
        const g = new Set((Array.isArray(x) ? x : []).map(id => r.gruppi[id]).filter(Boolean));
        ok = g.size >= (r.minimo || 2);
      } else ok = x !== undefined && giusta(r, x);
      if (ok) p += r.punti;
      det[r.domanda] = ok;
    }
    return { p, det };
  }
  function risultati(s, k) {
    const colp = k.soluzione.colpevole,
      ind = {},
      fam = {};
    let presi = 0,
      votanti = 0;
    for (const [uid, g] of Object.entries(s.gioc)) {
      const v = s.voti[uid],
        r = puntiVoto(k, v);
      const interp = s.interp[g.pid] || 0;
      ind[uid] = { pid: g.pid, voto: r.p, det: r.det, interp, tot: r.p + interp };
      if (v) {
        votanti++;
        if (v.chi === colp) presi++;
      }
    }
    for (const f of k.famiglie) {
      const F = s.fam[f.id],
        v = s.votiFam[f.id],
        r = puntiVoto(k, v);
      fam[f.id] = { ded: F.punti, voto: r.p, tot: F.punti + r.p, det: r.det };
    }
    const gen = {};
    for (const pid of Object.values(s.gen)) gen[pid] = (gen[pid] || 0) + 1;
    const top = o => {
      const l = Object.entries(o);
      if (!l.length) return [];
      const m = Math.max(...l.map(x => x[1]));
      return m > 0 ? l.filter(x => x[1] === m).map(x => x[0]) : [];
    };
    const genTop = top(gen).sort((a, b) => (s.stat.copie[b] || 0) - (s.stat.copie[a] || 0));
    return {
      ind,
      fam,
      famiglia: top(Object.fromEntries(Object.entries(fam).map(([f, x]) => [f, x.tot]))),
      detective: top(Object.fromEntries(Object.entries(ind).map(([u, x]) => [u, x.tot]))),
      generoso: genTop.slice(0, 1),
      franca: votanti > 0 && presi * 2 <= votanti,
      presi,
      votanti,
    };
  }

  // ---- permessi per momento ----
  function puoFuori(s) {
    return s.fase === 'gioco' && s.mom === 'pomeriggio';
  }
  const NO = {
    pausa: 'Pausa tecnica: si riprende tra poco',
    sera: 'È sera: si parla solo dentro la famiglia',
    mattina: 'Di mattina parla con le altre famiglie solo il rappresentante',
    fuori: 'Sei fuori scena per ora',
  };
  function motivoNo(s, k, pid, altro) {
    if (s.pausa) return NO.pausa;
    if (s.fuori[pid]) return NO.fuori;
    if (altro && famDi(k, altro) !== famDi(k, pid) && !puoFuori(s)) return s.mom === 'sera' ? NO.sera : NO.mattina;
    return '';
  }

  // ---- azioni ----
  const CMD = new Set([
    'avanti',
    'pausa',
    'timer',
    'sigillo',
    'rilascia',
    'pubblica',
    'mostraTV',
    'audio',
    'rispondi',
    'sblocca',
    'allontana',
    'portavoce',
    'proposta',
    'interpreta',
    'mondo',
    'assegna',
    'esce',
    'chiudiVoto',
  ]);
  function act(s0, a, k, ora) {
    if (!a || typeof a !== 'object') return { err: 'Azione vuota' };
    const s = clone(s0);
    // numerazione: un comando ripetuto (doppio tocco, rete lenta) si applica una volta sola
    if (a.seq !== undefined) {
      if (a.seq <= (s.seq[a.uid] || 0)) return { s: s0, dup: true };
      s.seq[a.uid] = a.seq;
    }
    if (a.t === 'cmd') {
      if (a.uid !== s.narr && a.uid !== '__tv') return { err: 'Solo il narratore può farlo' };
      if (!CMD.has(a.c)) return { err: 'Comando sconosciuto' };
      const r = comando(s, k, a, ora);
      return r && r.err ? r : { s };
    }
    const pid = pidDi(s, a.uid);
    if (!pid) return { err: 'Non hai un personaggio in questa serata' };
    const f = famDi(k, pid),
      F = s.fam[f];
    const no = m => ({ err: m });
    switch (a.t) {
      case 'obiettivo': {
        (s.ob[pid] = s.ob[pid] || {})[a.i] = !!a.fatto;
        return { s };
      }
      case 'esco': {
        const modi = { pausa: 'pausa di 5 minuti', muto: 'non vuole essere interrogato ora', via: 'lascia la serata' };
        if (!modi[a.modo]) return no('Scelta non valida');
        avvisaRegia(s, nomeP(k, s, pid) + ': ' + modi[a.modo]);
        if (a.modo === 'via') esce(s, k, pid, ora);
        return { s };
      }
      case 'portavoce': {
        // si vota un membro della propria famiglia per personaggio (il telefono non conosce gli uid degli altri)
        const per = s.di[a.pid];
        if (!per || famDi(k, a.pid) !== f || s.usc[a.pid]) return no('Si vota qualcuno della propria famiglia');
        F.voti[a.uid] = per;
        const c = {};
        for (const v of Object.values(F.voti)) c[v] = (c[v] || 0) + 1;
        const m = Math.max(...Object.values(c)),
          primo = Object.keys(c).find(u => c[u] === m);
        const quanti = membri(k, f).filter(x => attivo(s, x)).length;
        if (m * 2 > quanti && primo !== F.pv) {
          F.pv = primo;
          for (const x of membri(k, f))
            if (attivo(s, x)) scrivi(s, s.di[x], 'Nuovo rappresentante: ' + nomeP(k, s, pidDi(s, primo)));
        }
        return { s };
      }
      case 'appoggia':
      case 'togli': {
        if (s.pausa) return no(NO.pausa);
        if (a.t === 'appoggia') {
          if (!s.mie[pid][a.eid]) return no('Puoi appoggiare solo le prove che hai');
          if (!F.bacheca.includes(a.eid)) F.bacheca.push(a.eid);
        } else F.bacheca = F.bacheca.filter(x => x !== a.eid);
        return { s };
      }
      case 'mostra': {
        if (!s.mie[pid][a.eid]) return no('Non hai questa prova');
        if (!pers(k, a.a) || !attivo(s, a.a)) return no('Persona non in gioco');
        const m = motivoNo(s, k, pid, a.a);
        if (m) return no(m);
        if (dai(s, k, a.a, a.eid, pid, versione(s, pid, a.eid), ora)) conta(s, k, pid, a.a);
        return { s };
      }
      case 'chiedi': {
        if (!pers(k, a.a) || !attivo(s, a.a) || a.a === pid) return no('Persona non in gioco');
        const m = motivoNo(s, k, pid, a.a);
        if (m) return no(m);
        if (a.eid && !s.mie[a.a][a.eid]) return no('Non ha quella prova');
        if (s.ric.some(r => r.da === pid && r.a === a.a && r.eid === (a.eid || ''))) return no('Richiesta già inviata');
        s.ric.push({ n: ++s.n, da: pid, a: a.a, eid: a.eid || '' });
        scrivi(
          s,
          s.di[a.a],
          nomeP(k, s, pid) + ' ti chiede una copia' + (a.eid ? ' di «' + prova(k, a.eid).titolo + '»' : ''),
          'richiesta'
        );
        return { s };
      }
      case 'concedi':
      case 'rifiuta': {
        const r = s.ric.find(x => x.n === a.n && x.a === pid);
        if (!r) return no('Richiesta non trovata');
        if (a.t === 'concedi') {
          const eid = r.eid || a.eid;
          if (!eid || !s.mie[pid][eid]) return no('Scegli una prova che hai');
          const m = motivoNo(s, k, pid, r.da);
          if (m) return no(m);
          if (dai(s, k, r.da, eid, pid, versione(s, pid, eid), ora)) conta(s, k, pid, r.da);
        } else scrivi(s, s.di[r.da], nomeP(k, s, pid) + ' per ora non ti dà la copia', 'info');
        s.ric = s.ric.filter(x => x !== r);
        return { s };
      }
      case 'consegna': {
        // un custode consegna la sua prova alla regia perché la mostri a tutti (es. la lettera sigillata)
        if (!s.mie[pid][a.eid]) return no('Non hai questa prova');
        if (s.pub.includes(a.eid)) return no('È già pubblica');
        if (!s.prop.some(x => x.tipo === 'pubblica' && x.id === a.eid)) {
          s.prop.push({ n: ++s.n, tipo: 'pubblica', id: a.eid, da: pid });
          avvisaRegia(s, nomeP(k, s, pid) + ' consegna «' + prova(k, a.eid).titolo + '»: mostrarla a tutti?');
        }
        return { s };
      }
      case 'dichiara': {
        if (s.pausa) return no(NO.pausa);
        if (s.fase !== 'gioco' || s.mom !== 'mattina') return no('Le dichiarazioni si fanno di mattina');
        if (ilPortavoce(s, f) !== a.uid) return no('Dichiara solo il rappresentante della famiglia');
        if (!testo(a.testo) || a.testo.length > 400) return no('Scrivi la dichiarazione (al massimo 400 caratteri)');
        if (a.eid && !vede(s, k, pid, a.eid)) return no('Puoi allegare solo prove che vedi');
        s.dich.push({
          n: ++s.n,
          fam: f,
          testo: a.testo.trim(),
          tipo: a.tipo === 'accusa' ? 'accusa' : 'scoperta',
          eid: a.eid || '',
        });
        if (s.dich.length > LIM.dich) s.dich.splice(0, s.dich.length - LIM.dich);
        if (a.eid && !s.pub.includes(a.eid)) consegna(s, k, a.eid, 'tutti', versione(s, pid, a.eid), ora, pid);
        s.cue = { tipo: 'dich', n: s.n };
        return { s };
      }
      case 'collega': {
        if (s.pausa) return no(NO.pausa);
        if (s.fase !== 'gioco') return no('Ora non si collegano prove');
        const r = collega(s, k, f, a.ids, ora);
        if (r.err) return r;
        if (r.msg) scrivi(s, a.uid, r.msg, 'avviso');
        return { s };
      }
      case 'risolvi': {
        if (s.pausa) return no(NO.pausa);
        const r = risolvi(s, k, f, a.scelta, ora);
        return r.err ? r : { s };
      }
      case 'domanda': {
        if (!testo(a.testo) || a.testo.length > 300) return no('Scrivi la domanda (al massimo 300 caratteri)');
        if (s.fase !== 'gioco') return no('Ora non si fanno domande alla regia');
        if (F.dom[s.atto] !== undefined) return no('La vostra famiglia ha già fatto la domanda di questo atto');
        F.dom[s.atto] = s.dom.length;
        s.dom.push({ n: ++s.n, fam: f, uid: a.uid, testo: a.testo.trim(), atto: s.atto, risp: '' });
        avvisaRegia(s, 'Domanda da ' + ((k.famiglie.find(x => x.id === f) || {}).nome || f));
        return { s };
      }
      case 'modulo': {
        if (s.fase !== 'gioco' || s.mom !== 'sera') return no('Il modulo della sera si invia di sera');
        if (ilPortavoce(s, f) !== a.uid) return no('Lo invia il rappresentante');
        F.mod[s.atto] = a.risposte || {};
        avvisaRegia(s, ((k.famiglie.find(x => x.id === f) || {}).nome || f) + ' ha consegnato le risposte della sera');
        return { s };
      }
      case 'voto':
      case 'votoFam': {
        if (s.fase !== 'voto') return no('Il voto non è aperto');
        const v = a.risposte || {};
        if (a.t === 'votoFam') {
          if (ilPortavoce(s, f) !== a.uid) return no('Il voto di famiglia lo dà il rappresentante');
          s.votiFam[f] = v;
        } else s.voti[a.uid] = v;
        if (a.generoso && pers(k, a.generoso) && a.generoso !== pid) s.gen[a.uid] = a.generoso;
        return { s };
      }
    }
    return { err: 'Azione sconosciuta' };
  }
  function conta(s, k, da, a) {
    s.stat.copie[da] = (s.stat.copie[da] || 0) + 1;
    const fa = famDi(k, da),
      fb = famDi(k, a);
    if (fa !== fb) {
      s.stat.scambi++;
      const key = [fa, fb].sort().join('-');
      s.stat.fra[key] = (s.stat.fra[key] || 0) + 1;
    }
  }
  // un giocatore se ne va: ciò che aveva in mano passa alla riserva, il portavoce si riassegna
  function esce(s, k, pid, ora) {
    s.usc[pid] = 1;
    const f = famDi(k, pid),
      F = s.fam[f];
    if (F.pv === s.di[pid]) {
      const altro = membri(k, f).find(x => attivo(s, x));
      F.pv = altro ? s.di[altro] : '';
    }
    for (const eid of Object.keys(s.mie[pid])) riserva(s, k, eid, pid, s.mie[pid][eid].ver, ora);
  }
  function comando(s, k, a, ora) {
    switch (a.c) {
      case 'avanti':
        if (s.pausa) return { err: 'Prima togli la pausa' };
        // la console dice dov'era quando il narratore ha toccato: un tocco partito da una console indietro si ignora
        if (a.at !== undefined && a.at !== punto(s)) return;
        return avanti(s, k, ora);
      case 'pausa':
        if (a.on && !s.pausa) {
          s.pausa = true;
          s.resto = s.fino ? Math.max(0, s.fino - ora) : 0;
        } else if (!a.on && s.pausa) {
          s.pausa = false;
          if (s.resto) s.fino = ora + s.resto;
          s.resto = 0;
        }
        return;
      case 'timer':
        if (!s.fino) s.fino = ora;
        s.fino += (a.min || 5) * 60000;
        return;
      case 'sigillo':
        if (!(a.id in s.sig)) return { err: 'Sigillo sconosciuto' };
        if (a.on) s.sig[a.id] = 1;
        else spegni(s, k, a.id);
        return;
      case 'rilascia':
        if (!prova(k, a.eid)) return { err: 'Prova sconosciuta' };
        return rilascia(s, k, a.eid, ora, a.a);
      case 'pubblica':
      case 'mostraTV':
        if (!prova(k, a.eid)) return { err: 'Prova sconosciuta' };
        s.rel[a.eid] = 1;
        consegna(s, k, a.eid, 'tutti', 'i', ora);
        s.prop = s.prop.filter(x => !(x.tipo === 'pubblica' && x.id === a.eid));
        s.cue = { tipo: 'mostra', id: a.eid, n: ++s.n };
        return;
      case 'audio':
        if (!(k.audio || []).some(x => x.id === a.id)) return { err: 'Audio sconosciuto' };
        s.cue = { tipo: 'audio', id: a.id, n: ++s.n };
        return;
      case 'rispondi': {
        const d = s.dom.find(x => x.n === a.n);
        if (!d || !testo(a.testo)) return { err: 'Domanda o risposta mancante' };
        d.risp = a.testo.trim();
        for (const pid of membri(k, d.fam))
          if (attivo(s, pid)) scrivi(s, s.di[pid], 'La regia risponde: ' + d.risp, 'regia');
        return;
      }
      case 'sblocca':
        if (!s.fam[a.fam] || !testo(a.testo)) return { err: 'Famiglia o testo mancante' };
        for (const pid of membri(k, a.fam))
          if (attivo(s, pid)) scrivi(s, s.di[pid], 'Dalla regia: ' + a.testo, 'regia');
        return;
      case 'allontana':
        if (!attivo(s, a.pid)) return { err: 'Personaggio non in gioco' };
        s.fuori[a.pid] = ora + (a.min || 10) * 60000;
        scrivi(s, s.di[a.pid], a.testo || 'La storia ti porta fuori scena: resta seduto', 'fuori');
        log(s, nomeP(k, s, a.pid) + ' è chiamato altrove');
        return;
      case 'portavoce':
        if (!s.fam[a.fam] || !s.di[a.pid] || famDi(k, a.pid) !== a.fam)
          return { err: 'Scegli un membro della famiglia' };
        s.fam[a.fam].pv = s.di[a.pid];
        return;
      case 'proposta': {
        const p = s.prop.find(x => x.n === a.n);
        if (!p) return { err: 'Proposta non trovata' };
        s.prop = s.prop.filter(x => x !== p);
        if (a.ok && p.tipo === 'sigillo') spegni(s, k, p.id);
        if (a.ok && p.tipo === 'pubblica') {
          consegna(s, k, p.id, 'tutti', 'i', ora, p.da);
          s.cue = { tipo: 'mostra', id: p.id, n: ++s.n };
        }
        return;
      }
      case 'interpreta':
        if (!pers(k, a.pid)) return { err: 'Personaggio sconosciuto' };
        s.interp[a.pid] = Math.max(0, Math.min(3, a.punti | 0));
        if (s.ris) s.ris = risultati(s, k);
        return;
      case 'mondo':
        s.mondo = String(a.testo || '').slice(0, 120);
        return;
      case 'assegna': {
        // un personaggio passa a un altro telefono (o torna libero)
        const p = pers(k, a.pid);
        if (!p) return { err: 'Personaggio sconosciuto' };
        const vecchio = s.di[a.pid];
        if (vecchio) delete s.gioc[vecchio];
        if (a.per) {
          const prima = s.gioc[a.per];
          if (prima) s.di[prima.pid] = null;
          s.gioc[a.per] = { pid: a.pid, nome: a.nome || (prima && prima.nome) || '' };
        }
        s.di[a.pid] = a.per || null;
        delete s.usc[a.pid];
        const F = s.fam[p.famiglia];
        if (!F.pv || !s.gioc[F.pv]) F.pv = a.per || '';
        return;
      }
      case 'esce':
        if (!attivo(s, a.pid)) return { err: 'Personaggio non in gioco' };
        return esce(s, k, a.pid, ora);
      case 'chiudiVoto':
        if (s.fase !== 'voto') return { err: 'Il voto non è aperto' };
        return avanti(s, k, ora);
    }
  }

  // ---- cosa vede la sala ----
  function pubblico(s, k) {
    const a = s.atto >= 0 ? k.atti[s.atto] : null,
      cast = k.personaggi.map(p => ({
        id: p.id,
        nome: nomeP(k, s, p.id),
        ruolo: p.ruolo || '',
        fam: p.famiglia,
        eta: p.eta || '',
        look: p.look || '',
        pubblico: p.pubblico || '',
        on: attivo(s, p.id),
      }));
    const out = {
      formato: 'serata',
      kit: k.id,
      titolo: k.titolo,
      fase: s.fase,
      pausa: s.pausa,
      atto: a ? { i: s.atto, id: a.id, titolo: a.titolo || '', ora: a.ora || null, n: k.atti.length } : null,
      mom: s.mom ? { id: s.mom, nome: nomeMom(k, s.mom) } : null,
      fino: s.pausa ? 0 : s.fino,
      da: s.da || 0,
      tot: a && s.mom && a[s.mom] ? (a[s.mom].minuti || 0) * 60000 : 0,
      istr: a && s.mom && a[s.mom] ? a[s.mom].istruzioni || '' : '',
      resto: s.resto,
      mondo: s.mondo,
      sigilli: (k.sigilli || []).map(x => ({
        id: x.id,
        nome: x.nome || x.id,
        simbolo: x.simbolo || '',
        on: !!s.sig[x.id],
      })),
      famiglie: k.famiglie.map(f => ({
        id: f.id,
        nome: f.nome,
        pv: s.fam[f.id].pv ? pidDi(s, s.fam[f.id].pv) : '',
        passi: s.fam[f.id].ded.map(c => coll(k, c).passo),
        inviato: s.atto >= 0 && !!s.fam[f.id].mod[s.atto],
      })),
      cast,
      pubbliche: s.pub.map(eid => {
        const p = prova(k, eid);
        return { id: eid, titolo: p.titolo, tipo: p.tipo || 'documento', testo: p.testo, img: p.img || '' };
      }),
      dich: s.dich.map(d => ({ ...d, nomeFam: (k.famiglie.find(f => f.id === d.fam) || {}).nome || d.fam })),
      turno: s.turno ? { pid: s.turno.pid, nome: nomeP(k, s, s.turno.pid), n: s.turno.n } : null,
      cue: s.cue,
      log: s.log.slice(-8),
      fra: s.stat.fra,
      votati: Object.keys(s.voti).length,
      votanti: Object.keys(s.gioc).length,
    };
    if (s.fase === 'finale' || s.fase === 'fine') {
      const sol = k.soluzione;
      out.finale = {
        colpevole: sol.colpevole,
        nome: nomeP(k, s, sol.colpevole),
        ricostruzione: (sol.ricostruzione || []).slice(0, s.fin),
        passo: s.fin,
        epilogo: s.fase === 'fine' ? sol.epilogo || [] : [],
        ris: s.ris,
        cronologia: sol.cronologia || [],
      };
    }
    return out;
  }

  // ---- cosa vede ogni telefono ----
  function dossier(k, s, pid) {
    const p = pers(k, pid);
    return {
      t: 'dossier',
      id: pid,
      nome: nomeP(k, s, pid),
      eta: p.eta || '',
      ruolo: p.ruolo || '',
      famiglia: p.famiglia,
      look: p.look || '',
      fisicita: p.fisicita || '',
      pubblico: p.pubblico || '',
      passato: p.passato || '',
      segreto: p.segreto,
      comodo: p.comodo || '',
      obiettivi: p.obiettivi || [],
      legami: (p.legami || []).map(l => ({ con: l.con, nome: nomeP(k, s, l.con), perche: l.perche || '' })),
      atti: guidaAtti(k, p),
      battute: p.battute || [],
      motore: p.motore || '',
      vincolo: p.vincolo || '',
      tono: p.tono || '',
      colpevole: !!p.colpevole,
      confessione: p.colpevole ? p.confessione || '' : '',
    };
  }
  function maniDi(s, k, pid) {
    const p = pers(k, pid),
      f = p.famiglia,
      F = s.fam[f],
      uid = s.di[pid],
      a = s.atto >= 0 ? k.atti[s.atto] : null;
    const prove = {};
    const metti = (eid, st, da) => {
      const q = prova(k, eid);
      prove[eid] = {
        t: q.tipo || 'documento',
        titolo: q.titolo,
        testo: testoProva(q, versione(s, pid, eid)),
        st,
        da: da || '',
        img: q.img || '',
      };
    };
    for (const [eid, m] of Object.entries(s.mie[pid]))
      metti(
        eid,
        m.da === 'regia' || m.da === 'riserva' ? 'mia' : 'copia',
        m.da === 'regia' || m.da === 'riserva' ? '' : nomeP(k, s, m.da)
      );
    for (const eid of F.bacheca) if (!prove[eid]) metti(eid, 'famiglia');
    for (const eid of s.pub) if (!prove[eid]) metti(eid, 'pubblica');
    for (const q of k.prove)
      if (s.ann[q.id] && !s.rel[q.id] && destin(q.rilascio.a).some(d => d.p === pid))
        prove[q.id] = {
          t: q.tipo || 'documento',
          titolo: q.titolo,
          testo: '',
          st: 'annunciata',
          apre: q.rilascio.atto,
        };
    const sbloccate = (p.rivela || [])
      .filter(
        r =>
          (r.atto ? attoIdx(k, r.atto) <= s.atto : true) &&
          (!r.quando || !r.quando.pubblica || s.pub.includes(r.quando.pubblica))
      )
      .map(r => r.testo);
    const mosse = (p.mosse || [])
      .filter(m => !m.atto || attoIdx(k, m.atto) <= s.atto)
      .map(m => ({ a: m.a, nome: nomeP(k, s, m.a), chiedi: m.chiedi }));
    const fam = {
      id: f,
      nome: (k.famiglie.find(x => x.id === f) || {}).nome || f,
      membri: membri(k, f).map(x => ({ pid: x, nome: nomeP(k, s, x), on: attivo(s, x), pv: s.di[x] === F.pv })),
      bacheca: F.bacheca,
      ded: F.ded.map(c => ({ id: c, passo: coll(k, c).passo, testo: coll(k, c).testo || '' })),
      quesito: F.quesito,
      mancanti: mancanti(s, k, f),
      domanda: s.atto >= 0 && F.dom[s.atto] !== undefined ? s.dom[F.dom[s.atto]] : null,
      modulo: a && a.sera && a.sera.modulo ? a.sera.modulo : null,
      inviato: s.atto >= 0 && !!F.mod[s.atto],
      votato: !!s.votiFam[f],
    };
    return {
      dossier: dossier(k, s, pid),
      stato: {
        t: 'stato',
        guida: a ? guidaAtti(k, p)[a.id] || '' : '',
        rivela: sbloccate,
        mosse,
        turno: !!(s.turno && s.turno.pid === pid),
        fuori: s.fuori[pid] || 0,
        pv: F.pv === uid,
        votato: !!s.voti[uid],
        ob: s.ob[pid] || {},
        accusa: s.fase === 'voto' ? k.accusa : null,
        ris: s.ris ? { ...s.ris.ind[uid], fam: s.ris.fam[f] } : null,
      },
      prove: { t: 'prove', l: prove },
      fam: { t: 'fam', ...fam },
      msg: { t: 'msg', l: (s.msg[uid] || []).slice(-LIM.msg) },
      ric: { t: 'ric', l: s.ric.filter(r => r.a === pid).map(r => ({ n: r.n, da: nomeP(k, s, r.da), eid: r.eid })) },
    };
  }
  function console_(s, k) {
    const a = s.atto >= 0 ? k.atti[s.atto] : null,
      l = a ? righe(a) : [];
    const nomeFam = f => (k.famiglie.find(x => x.id === f) || {}).nome || f;
    return {
      t: 'console',
      fase: s.fase,
      atto: a
        ? {
            i: s.atto,
            id: a.id,
            titolo: a.titolo || '',
            ora: a.ora || null,
            obiettivo: a.obiettivo || '',
            sblocchi: a.sblocchi || [],
            salta: a.salta || '',
          }
        : null,
      mom: s.mom,
      riga: s.riga,
      righe:
        s.mom === 'mattina'
          ? l.map((r, i) => ({
              i,
              regia: r.regia || '',
              chi: r.chi ? nomeP(k, s, r.chi) : '',
              testo: r.testo || '',
              cue: r.cue ? etichetta(k, r.cue) : '',
            }))
          : [],
      momento: a && s.mom && a[s.mom] ? { istruzioni: a[s.mom].istruzioni || '', minuti: a[s.mom].minuti || 0 } : null,
      prossimo: prossimo(s, k),
      pos: punto(s),
      fino: s.fino,
      da: s.da || 0,
      tot: a && s.mom && a[s.mom] ? (a[s.mom].minuti || 0) * 60000 : 0,
      pausa: s.pausa,
      sigilli: (k.sigilli || []).map(x => ({ id: x.id, nome: x.nome || x.id, on: !!s.sig[x.id] })),
      prove: k.prove.map(p => ({
        id: p.id,
        titolo: p.titolo,
        atto: p.rilascio.atto,
        st: s.pub.includes(p.id) ? 'pubblica' : s.rel[p.id] ? 'uscita' : s.ann[p.id] ? 'annunciata' : 'sigillata',
        regia: !!p.regia,
      })),
      famiglie: k.famiglie.map(f => ({
        id: f.id,
        nome: f.nome,
        pv: s.fam[f.id].pv ? nomeP(k, s, pidDi(s, s.fam[f.id].pv)) : '—',
        passi: s.fam[f.id].ded.length,
        mod: s.atto >= 0 && !!s.fam[f.id].mod[s.atto],
      })),
      domande: s.dom.filter(d => !d.risp).map(d => ({ n: d.n, fam: nomeFam(d.fam), testo: d.testo })),
      proposte: s.prop.map(p => ({
        n: p.n,
        tipo: p.tipo,
        id: p.id,
        testo:
          p.tipo === 'sigillo'
            ? 'Spegni ' + p.id + ' (' + nomeFam(p.fam) + ')'
            : 'Mostra a tutti «' + prova(k, p.id).titolo + '»',
      })),
      avvisi: s.rav.slice(-12),
      persone: k.personaggi.map(p => ({
        id: p.id,
        nome: nomeP(k, s, p.id),
        fam: p.famiglia,
        on: attivo(s, p.id),
        usc: !!s.usc[p.id],
        fuori: !!s.fuori[p.id],
        uid: s.di[p.id] || '',
      })),
      votati: Object.keys(s.voti).length,
      votanti: Object.keys(s.gioc).length,
      audio: (k.audio || []).map(x => ({ id: x.id, titolo: x.titolo || x.id })),
    };
  }
  const punto = s => [s.fase, s.atto, s.mom, s.riga, s.fin].join('|');
  // un comando del copione detto in parole: «Rilascia «Il talloncino»», «Suona «Il saluto inciso»»
  function etichetta(k, c) {
    if (c.prova) return 'Rilascia «' + prova(k, c.prova).titolo + '»';
    if (c.sigillo) return 'Spegni il sigillo ' + c.sigillo;
    if (c.audio) return 'Suona «' + (((k.audio || []).find(x => x.id === c.audio) || {}).titolo || c.audio) + '»';
    if (c.mostra) return 'Mostra a tutti «' + prova(k, c.mostra).titolo + '»';
    if (c.mondo !== undefined) return 'Annuncia: ' + c.mondo;
    return '';
  }
  // cosa succede al prossimo «Avanti»: la console lo scrive sul pulsante
  function prossimo(s, k) {
    if (s.fase === 'pronta') return 'Inizia: atto ' + k.atti[0].id;
    if (s.fase === 'voto') return 'Chiudi il voto';
    if (s.fase === 'finale')
      return s.fin < ((k.soluzione || {}).ricostruzione || []).length ? 'Ricostruzione ' + (s.fin + 1) : 'Epilogo';
    if (s.fase !== 'gioco') return '';
    const a = k.atti[s.atto],
      l = righe(a);
    if (s.mom === 'mattina' && s.riga < l.length) {
      const r = l[s.riga];
      if (r.cue) return etichetta(k, r.cue);
      if (r.chi) return 'Tocca a ' + nomeP(k, s, r.chi);
      return 'Riga ' + (s.riga + 1) + ' di ' + l.length;
    }
    const ms = momentiDi(a),
      i = ms.indexOf(s.mom);
    if (i + 1 < ms.length) return nomeMom(k, ms[i + 1]);
    return s.atto + 1 < k.atti.length ? 'Atto ' + k.atti[s.atto + 1].id : 'Apri il voto';
  }
  function mani(s, k) {
    const out = {};
    for (const [uid, g] of Object.entries(s.gioc)) if (g.pid && s.di[g.pid] === uid) out[uid] = maniDi(s, k, g.pid);
    if (s.narr) out[s.narr] = { ...(out[s.narr] || {}), console: console_(s, k) };
    return out;
  }

  return {
    valida,
    avvisi,
    scegli,
    nuova,
    act,
    tick,
    pubblico,
    mani,
    puntiVoto,
    MOMENTI,
    LIM,
    _: { mancanti, guidaAtti, prossimo },
  };
})();
if (typeof module !== 'undefined') module.exports = SERATA;
