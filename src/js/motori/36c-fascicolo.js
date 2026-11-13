/* FASCICOLO: indagine d'archivio per una squadra (2-8 telefoni + TV), regole pure senza rete né DOM.
   La TV regista tiene lo stato (regia/CODICE) con il kit e la soluzione; ai telefoni arriva solo mani(s,k)[uid], alla
   stanza pubblico(s,k). Progetto, formato del kit e piano: docs/FASCICOLI.md. Contratto:
   - valida(k) -> [errori]              kit ben fatto, risolvibile e giocabile con le ore che dà
   - avvisi(k) -> [avvisi]              cose lecite ma sospette
   - nuova(k, giocatori, opz) -> {s}|{err}   giocatori [{uid,nome}]; le specialità si distribuiscono nell'ordine del kit
   - act(s, a, k, ora) -> {s}|{err}     a = {t, uid, ...}; a.regia = true solo per i comandi della TV (mai dalla rete)
   - tick(s, k, ora) -> {s}|null        timer dei capitoli, laboratorio, metà in attesa
   - pubblico(s, k), mani(s, k)         cosa vede la TV, cosa vede ogni telefono
   Mai Date né Math.random: l'ora arriva da fuori, così le partite simulate si ripetono uguali. */
const FASCICOLO = (() => {
  const clone = o => JSON.parse(JSON.stringify(o));
  const testo = v => typeof v === 'string' && v.trim().length > 0;
  const ID = /^[\w-]{1,32}$/;
  const SPEC = { archivio: 'Archivio', scientifica: 'Scientifica', testimoni: 'Testimoni', luoghi: 'Luoghi' };
  const AZ_SPEC = { zona: 'luoghi', tema: 'testimoni', analisi: 'scientifica', cerca: 'archivio' };
  const TIPI_REP = ['documento', 'foto', 'audio', 'oggetto', 'mappa', 'testimonianza'];
  const TIPI_DOM = ['personaggio', 'scelta', 'orario', 'luogo'];
  const TIPI_SERR = ['codice', 'parola', 'ordine', 'scelta'];
  const LIM = { muro: 3, unisci: 60000, msg: 30, log: 40, tentativi: 3, consegna: 3 };
  const ORA_RE = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g;
  const norm = v =>
    String(v === undefined || v === null ? '' : v)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '');
  const normOra = v => {
    const m = String(v || '').match(/^\s*(\d{1,2})\s*[:.,h ]?\s*(\d{2})\s*$/);
    return m && +m[1] < 24 && +m[2] < 60 ? m[1].padStart(2, '0') + ':' + m[2] : '';
  };

  // ---- lettura del kit ----
  const rep = (k, id) => k.reperti.find(r => r.id === id);
  const per = (k, id) => (k.persone || []).find(p => p.id === id);
  const dom = (k, id) => (k.domande || []).find(d => d.id === id);
  const col = (k, id) => (k.collegamenti || []).find(c => c.id === id);
  const serr = (k, id) => (k.serrature || []).find(x => x.id === id);
  const ana = (k, id) => (k.analisi || []).find(x => x.id === id);
  const capIdx = (k, id) => (id === undefined ? 0 : k.capitoli.findIndex(c => c.id === id));
  const temi = k => (k.persone || []).flatMap(p => (p.temi || []).map(t => ({ ...t, persona: p.id })));
  const tema = (k, id) => temi(k).find(t => t.id === id);
  const zone = k => (k.luoghi || []).flatMap(l => (l.zone || []).map(z => ({ ...z, luogo: l.id, cap: l.capitolo })));
  const zona = (k, id) => zone(k).find(z => z.id === id);
  const meta = r => !!(r && r.a && typeof r.a === 'object' && Array.isArray(r.a.meta));
  const daTipo = r => (!r.da || r.da === 'inizio' ? 'inizio' : Object.keys(r.da)[0]);
  const daVal = r => (r.da && typeof r.da === 'object' ? r.da[daTipo(r)] : null);
  const specKit = k => (k.specialita || []).map(x => x.id);
  const nomeSpec = (k, id) => ((k.specialita || []).find(x => x.id === id) || {}).nome || SPEC[id] || id;
  const accusa = k => (k.accusa && k.accusa.domande) || [];
  const totOre = k => (k.ore.inizio || 0) + (k.ore.capitolo || 0) * (k.capitoli.length - 1);
  const costoAiuto = (k, i) => {
    const a = k.ore.aiuto || [1];
    return a[Math.min(i, a.length - 1)];
  };
  const testoScelta = (k, d, v) => {
    if (v === undefined || v === null || v === '') return '';
    if (d.tipo === 'scelta') return (d.scelte || [])[+v] || '';
    if (d.tipo === 'personaggio') return (per(k, v) || {}).nome || '';
    if (d.tipo === 'luogo') return ((k.luoghi || []).find(l => l.id === v) || {}).nome || '';
    return normOra(v);
  };
  function giusto(d, v) {
    if (v === undefined || v === null || v === '') return false;
    if (d.tipo === 'scelta') return +v === d.giusta;
    if (d.tipo === 'orario') return normOra(v) === normOra(d.giusta);
    return v === d.giusta;
  }

  // ---- validatore ----
  // da dove viene un reperto o una deduzione (specialità): serve per «prove indipendenti» e «lavoro tra specialità»
  function origine(k, id, giro) {
    giro = giro || new Set();
    if (giro.has(id)) return new Set();
    giro.add(id);
    const c = col(k, id);
    if (c) {
      const o = new Set();
      for (const x of c.servono) for (const y of origine(k, x, giro)) o.add(y);
      return o;
    }
    const r = rep(k, id);
    if (!r) return new Set();
    if (r.a === 'tutti') return new Set(['tutti']);
    if (meta(r)) return new Set(r.a.meta);
    if (typeof r.a === 'string') return new Set([r.a]);
    const t = daTipo(r);
    if (AZ_SPEC[t]) return new Set([AZ_SPEC[t]]);
    if (t === 'serratura') {
      const o = new Set();
      for (const x of (serr(k, daVal(r)) || {}).richiede || []) for (const y of origine(k, x, giro)) o.add(y);
      return o.size ? o : new Set(['tutti']);
    }
    return new Set(['tutti']);
  }
  // che cosa serve per avere un reperto o una deduzione, e quanto costa in ore (ogni azione contata una volta)
  function prerequisiti(k, id, acc) {
    if (acc.visti.has(id)) return;
    acc.visti.add(id);
    const c = col(k, id);
    if (c) return c.servono.forEach(x => prerequisiti(k, x, acc));
    const r = rep(k, id);
    if (!r) return;
    const t = daTipo(r),
      v = daVal(r);
    if (t === 'zona') {
      if (!acc.az.has('z:' + v)) acc.ore += (zona(k, v) || {}).ore || 0;
      acc.az.add('z:' + v);
    } else if (t === 'tema') {
      const tm = tema(k, v) || {};
      if (!acc.az.has('t:' + v)) acc.ore += tm.ore || 0;
      acc.az.add('t:' + v);
      (tm.richiede || []).forEach(x => prerequisiti(k, x, acc));
    } else if (t === 'analisi') {
      const a = ana(k, v) || {};
      if (!acc.az.has('a:' + v)) acc.ore += a.ore || 0;
      acc.az.add('a:' + v);
      if (a.su) prerequisiti(k, a.su, acc);
    } else if (t === 'serratura') ((serr(k, v) || {}).richiede || []).forEach(x => prerequisiti(k, x, acc));
    else if (t === 'cerca') {
      if (!acc.az.has('c:' + v)) acc.ore += k.ore.cerca || 0;
      acc.az.add('c:' + v);
    }
  }
  function orariDi(v, out) {
    if (typeof v === 'string') for (const m of v.matchAll(ORA_RE)) out.add(m[1].padStart(2, '0') + ':' + m[2]);
    else if (Array.isArray(v)) v.forEach(x => orariDi(x, out));
    else if (v && typeof v === 'object') Object.values(v).forEach(x => orariDi(x, out));
    return out;
  }
  function valida(k) {
    const e = [],
      no = m => e.push(m);
    if (!k || typeof k !== 'object') return ['kit vuoto'];
    if (!/^[\w-]{1,40}$/.test(k.id || '')) no('id del kit non valido');
    if (k.formato !== 'fascicolo') no('formato deve essere «fascicolo»');
    if (!testo(k.titolo)) no('titolo mancante');
    const g = k.giocatori;
    if (!Array.isArray(g) || g.length !== 2 || !(g[0] >= 1 && g[1] >= g[0] && g[1] <= 12)) no('giocatori [min, max]');
    for (const c of ['specialita', 'reperti', 'persone', 'capitoli', 'domande'])
      if (!Array.isArray(k[c]) || !k[c].length) no('servono ' + c);
    if (!k.ore || !(k.ore.inizio > 0)) no('ore.inizio mancante');
    if (!k.accusa || !Array.isArray(k.accusa.domande) || !k.accusa.domande.length) no('accusa.domande mancante');
    if (!k.soluzione || !Array.isArray(k.soluzione.ricostruzione) || !k.soluzione.ricostruzione.length)
      no('soluzione.ricostruzione mancante');
    if (e.length) return e;
    const uniq = (l, cosa) => {
      const v = new Set();
      for (const x of l) {
        if (!x || !ID.test(x.id || '')) no(cosa + ': id non valido «' + (x && x.id) + '»');
        else if (v.has(x.id)) no(cosa + ': id ripetuto «' + x.id + '»');
        v.add(x && x.id);
      }
    };
    uniq(k.specialita, 'specialità');
    uniq(k.reperti, 'reperto');
    uniq(k.persone, 'persona');
    uniq(k.capitoli, 'capitolo');
    uniq(k.domande, 'domanda');
    uniq(k.luoghi || [], 'luogo');
    uniq(zone(k), 'zona');
    uniq(temi(k), 'tema');
    uniq(k.analisi || [], 'analisi');
    uniq(k.serrature || [], 'serratura');
    uniq(k.collegamenti || [], 'collegamento');
    const nomi = new Set();
    for (const x of [...k.reperti, ...(k.collegamenti || [])]) {
      if (nomi.has(x.id)) no('«' + x.id + '» è sia reperto sia collegamento');
      nomi.add(x.id);
    }
    const sp = specKit(k);
    for (const s of sp)
      if (!SPEC[s]) no('specialità sconosciuta «' + s + '» (archivio, scientifica, testimoni, luoghi)');
    if (sp.length < 2) no('servono almeno due specialità');
    const esiste = id => !!(rep(k, id) || col(k, id));
    const capOk = (c, dove) => {
      if (c !== undefined && capIdx(k, c) < 0) no(dove + ': capitolo «' + c + '» sconosciuto');
    };
    // reperti
    for (const r of k.reperti) {
      const d = 'reperto ' + r.id;
      if (!testo(r.titolo)) no(d + ': titolo');
      if (!TIPI_REP.includes(r.tipo)) no(d + ': tipo «' + r.tipo + '»');
      capOk(r.capitolo, d);
      if (meta(r)) {
        const [a, b] = r.a.meta;
        if (r.a.meta.length !== 2 || a === b) no(d + ': le due metà vanno a due specialità diverse');
        if (!sp.includes(a) || !sp.includes(b)) no(d + ': metà a una specialità che il kit non ha');
        if (!Array.isArray(r.a.parti) || r.a.parti.length !== 2 || !r.a.parti.every(testo))
          no(d + ': servono due parti');
        if (!testo(r.testo)) no(d + ': serve il testo intero (quello che si legge dopo averle unite)');
        if (daTipo(r) !== 'inizio') no(d + ": un reperto spezzato esce all'inizio del capitolo");
      } else if (r.a !== undefined && r.a !== 'tutti' && !sp.includes(r.a)) no(d + ': destinatario «' + r.a + '»');
      else if (!testo(r.testo)) no(d + ': testo');
      const t = daTipo(r),
        v = daVal(r);
      if (t === 'inizio') {
        if (r.a === undefined) no(d + ": un reperto d'inizio deve dire a chi va (a)");
      } else if (t === 'zona') {
        if (!zona(k, v)) no(d + ': zona «' + v + '» sconosciuta');
      } else if (t === 'tema') {
        if (!tema(k, v)) no(d + ': tema «' + v + '» sconosciuto');
      } else if (t === 'analisi') {
        if (!ana(k, v)) no(d + ': analisi «' + v + '» sconosciuta');
      } else if (t === 'serratura') {
        if (!serr(k, v)) no(d + ': serratura «' + v + '» sconosciuta');
      } else if (t === 'cerca') {
        if (!Array.isArray(v) || !v.length || !v.every(testo)) no(d + ': cerca vuole una lista di parole');
      } else no(d + ': da «' + t + '» sconosciuto');
      if (t !== 'inizio' && r.a !== undefined) no(d + ": un reperto trovato con un'azione va a chi la fa (togli «a»)");
      if (r.falsa && !esiste(r.smentita)) no(d + ': falsa pista senza «smentita» valida');
    }
    // luoghi, persone, analisi, serrature
    for (const l of k.luoghi || []) {
      if (!testo(l.nome)) no('luogo ' + l.id + ': nome');
      capOk(l.capitolo, 'luogo ' + l.id);
      for (const z of l.zone || []) {
        const d = 'zona ' + z.id;
        if (!testo(z.nome) || !testo(z.testo)) no(d + ': nome e testo');
        for (const c of ['x', 'y', 'w', 'h'])
          if (!(typeof z[c] === 'number' && z[c] >= 0 && z[c] <= 1)) no(d + ': ' + c + ' fuori da 0-1');
        if (z.x + z.w > 1.001 || z.y + z.h > 1.001) no(d + ": esce dall'immagine");
      }
    }
    for (const p of k.persone) {
      if (!testo(p.nome) || !testo(p.ruolo)) no('persona ' + p.id + ': nome e ruolo');
      for (const t of p.temi || []) {
        const d = 'tema ' + t.id;
        if (!testo(t.domanda) || !testo(t.risposta)) no(d + ': domanda e risposta');
        capOk(t.capitolo, d);
        for (const x of t.richiede || []) if (!esiste(x)) no(d + ': richiede «' + x + '» sconosciuto');
      }
    }
    for (const a of k.analisi || []) {
      if (!rep(k, a.su)) no('analisi ' + a.id + ': reperto «' + a.su + '» sconosciuto');
      if (!(a.minuti > 0)) no('analisi ' + a.id + ': minuti');
      if (!k.reperti.some(r => daTipo(r) === 'analisi' && daVal(r) === a.id))
        no('analisi ' + a.id + ': non dà nessun reperto');
    }
    for (const x of k.serrature || []) {
      const d = 'serratura ' + x.id;
      if (!TIPI_SERR.includes(x.tipo)) no(d + ': tipo');
      if (!testo(String(x.soluzione === undefined ? '' : x.soluzione))) no(d + ': soluzione');
      if (!Array.isArray(x.richiede) || !x.richiede.length) no(d + ': richiede (dove stanno gli indizi per aprirla)');
      for (const y of x.richiede || []) if (!esiste(y)) no(d + ': richiede «' + y + '» sconosciuto');
      capOk(x.capitolo, d);
      if (!k.reperti.some(r => daTipo(r) === 'serratura' && daVal(r) === x.id)) no(d + ': non apre nessun reperto');
    }
    // collegamenti
    for (const c of k.collegamenti || []) {
      const d = 'collegamento ' + c.id;
      if (!Array.isArray(c.servono) || c.servono.length < 2) no(d + ': servono almeno due reperti');
      for (const x of c.servono || []) if (!rep(k, x)) no(d + ': reperto «' + x + '» sconosciuto');
      if (!Array.isArray(c.scelte) || c.scelte.length < 2 || !(c.giusta >= 0 && c.giusta < c.scelte.length))
        no(d + ': scelte e giusta');
      if (!testo(c.deduzione)) no(d + ': deduzione');
      if (g[1] >= 2) {
        const o = new Set();
        (c.servono || []).forEach(x => origine(k, x).forEach(y => o.add(y)));
        if (o.size < 2) no(d + ': tutti i reperti vengono dalla stessa specialità');
      }
    }
    // capitoli e domande
    const inCap = new Set();
    k.capitoli.forEach(c => {
      const d = 'capitolo ' + c.id;
      if (!testo(c.titolo) || !(c.minuti > 0)) no(d + ': titolo e minuti');
      if (!Array.isArray(c.domande) || c.domande.length < 1 || c.domande.length > 4) no(d + ': da 1 a 4 domande');
      for (const x of c.domande || []) {
        if (!dom(k, x)) no(d + ': domanda «' + x + '» sconosciuta');
        inCap.add(x);
      }
      for (const r of [...(c.apertura || []), ...(c.chiusura || [])]) {
        if (r.cue && r.cue.reperto) {
          const x = rep(k, r.cue.reperto);
          if (!x || daTipo(x) !== 'inizio' || capIdx(k, x.capitolo) !== capIdx(k, c.id))
            no(d + ': il copione fa uscire «' + r.cue.reperto + "», che non è un reperto d'inizio di questo capitolo");
        }
      }
    });
    for (const x of accusa(k)) {
      if (!dom(k, x)) no('accusa: domanda «' + x + '» sconosciuta');
      if (inCap.has(x)) no('accusa: «' + x + '» è già una domanda di capitolo');
    }
    const luoghiId = new Set((k.luoghi || []).map(l => l.id));
    for (const d of k.domande) {
      const w = 'domanda ' + d.id;
      if (!testo(d.testo) || !TIPI_DOM.includes(d.tipo)) no(w + ': testo e tipo');
      if (d.tipo === 'scelta' && (!Array.isArray(d.scelte) || !(d.giusta >= 0 && d.giusta < d.scelte.length)))
        no(w + ': scelte e giusta');
      if (d.tipo === 'personaggio' && !per(k, d.giusta)) no(w + ': la risposta deve essere una persona');
      if (d.tipo === 'luogo' && !luoghiId.has(d.giusta)) no(w + ': la risposta deve essere un luogo');
      if (d.tipo === 'orario' && !normOra(d.giusta)) no(w + ': orario «' + d.giusta + '»');
      if (!Array.isArray(d.prove) || d.prove.length < 2) no(w + ': servono almeno due prove');
      for (const x of d.prove || []) if (!esiste(x)) no(w + ': prova «' + x + '» sconosciuta');
      const o = new Set();
      (d.prove || []).forEach(x => origine(k, x).forEach(y => o.add(y)));
      if (o.size < 2) no(w + ': le prove vengono da una sola strada (serve una seconda specialità)');
      if (!inCap.has(d.id) && !accusa(k).includes(d.id)) no(w + ": non è in nessun capitolo né nell'accusa");
    }
    const colp = k.persone.filter(p => p.colpevole);
    if (colp.length !== 1) no('serve esattamente un colpevole');
    const chi = accusa(k)
      .map(x => dom(k, x))
      .find(d => d && d.tipo === 'personaggio');
    if (!chi) no("l'accusa deve chiedere chi è il colpevole");
    else if (colp[0] && chi.giusta !== colp[0].id) no('la risposta a «' + chi.id + '» non è il colpevole');
    if (e.length) return e;
    // raggiungibilità: tutto ciò che esce deve poter uscire (punto fisso con conoscenza piena)
    const ha = new Set(),
      fatto = new Set();
    let cambio = true;
    const ok = l => (l || []).every(x => ha.has(x));
    while (cambio) {
      cambio = false;
      for (const r of k.reperti) {
        if (ha.has(r.id)) continue;
        const t = daTipo(r),
          v = daVal(r);
        let si = t === 'inizio' || t === 'zona' || t === 'cerca';
        if (t === 'tema') si = ok((tema(k, v) || {}).richiede);
        if (t === 'analisi') si = ha.has((ana(k, v) || {}).su);
        if (t === 'serratura') si = ok((serr(k, v) || {}).richiede);
        if (si) {
          ha.add(r.id);
          cambio = true;
        }
      }
      for (const c of k.collegamenti || [])
        if (!fatto.has(c.id) && ok(c.servono)) {
          fatto.add(c.id);
          ha.add(c.id);
          cambio = true;
        }
    }
    for (const r of k.reperti) if (!ha.has(r.id)) no('reperto ' + r.id + ': non si può mai trovare');
    for (const c of k.collegamenti || []) if (!ha.has(c.id)) no('collegamento ' + c.id + ': non si può mai fare');
    // ore: la strada più corta verso tutte le prove non deve mangiarsi più del 60% delle ore
    const acc = { visti: new Set(), az: new Set(), ore: 0 };
    for (const d of k.domande) (d.prove || []).forEach(x => prerequisiti(k, x, acc));
    const tot = totOre(k);
    if (acc.ore > tot * 0.6) no('ore: la strada più corta costa ' + acc.ore + ' ore su ' + tot + ' (massimo il 60%)');
    // orari: ogni ora scritta nei testi deve stare nella cronologia
    const canon = new Set(((k.soluzione || {}).cronologia || []).map(x => normOra(x.ora)).filter(Boolean));
    const visti = orariDi(
      { r: k.reperti, p: k.persone, l: k.luoghi, c: k.collegamenti, cap: k.capitoli, d: k.domande, x: k.serrature },
      new Set()
    );
    for (const o of visti) if (!canon.has(o)) no('orario ' + o + ' scritto nei testi ma non nella cronologia');
    return e;
  }
  function avvisi(k) {
    const a = [];
    const usati = new Set();
    for (const d of k.domande) (d.prove || []).forEach(x => usati.add(x));
    for (const c of k.collegamenti || []) c.servono.forEach(x => usati.add(x));
    for (const r of k.reperti)
      if (!usati.has(r.id) && !r.falsa && !r.colore)
        a.push('reperto ' + r.id + ': non serve a nessuna domanda né collegamento');
    if (!k.reperti.some(meta)) a.push('nessun reperto spezzato');
    if (!(k.serrature || []).length) a.push('nessuna serratura');
    return a;
  }

  // ---- nuova partita ----
  function nuova(k, giocatori, opz) {
    opz = opz || {};
    const err = valida(k);
    if (err.length) return { err: 'Kit non valido: ' + err[0] };
    const n = giocatori.length;
    if (n < k.giocatori[0] || n > k.giocatori[1])
      return { err: 'Servono da ' + k.giocatori.join(' a ') + ' giocatori' };
    const gioc = {},
      ordine = giocatori.map(g => g.uid);
    for (const g of giocatori) gioc[g.uid] = { nome: g.nome, spec: [] };
    // con meno telefoni che specialità se ne prende più di una; con di più, le specialità si raddoppiano
    const sp = specKit(k);
    for (let i = 0; i < Math.max(n, sp.length); i++) {
      const u = ordine[i % n],
        x = sp[i % sp.length];
      if (!gioc[u].spec.includes(x)) gioc[u].spec.push(x);
    }
    const s = {
      v: 1,
      kit: k.id,
      fase: 'pronta',
      cap: -1,
      riga: 0,
      fino: 0,
      resto: 0,
      pausa: false,
      n: 0,
      gioc,
      ordine,
      capo: ordine[0],
      ore: k.ore.inizio,
      mani: {},
      rel: {},
      pub: [],
      muro: [],
      ded: [],
      ques: {},
      tentC: {},
      chiusiC: {},
      aperte: [],
      tentS: {},
      aiuti: {},
      lab: [],
      analizzati: {},
      unisci: {},
      visti: {},
      chiesti: {},
      depos: [],
      luogo: '',
      proposte: {},
      risposte: {},
      esiti: {},
      rivelate: [],
      stelle: 0,
      msg: {},
      seq: {},
      cue: null,
      log: [],
      fin: 0,
      ris: null,
      stat: { azioni: 0, unite: 0, proiezioni: 0 },
    };
    for (const u of ordine) s.mani[u] = {};
    return { s };
  }

  // ---- piccoli aiuti sullo stato ----
  const nome = (s, uid) => (s.gioc[uid] || {}).nome || '?';
  const haSpec = (s, uid, x) => !!s.gioc[uid] && s.gioc[uid].spec.includes(x);
  function log(s, t) {
    s.log.push({ n: ++s.n, t });
    if (s.log.length > LIM.log) s.log.shift();
  }
  function scrivi(s, uid, t, tipo) {
    const l = (s.msg[uid] = s.msg[uid] || []);
    l.push({ n: ++s.n, t, tipo: tipo || 'info' });
    if (l.length > LIM.msg) l.shift();
  }
  const cue = (s, c) => (s.cue = { ...c, n: ++s.n });
  const intero = (s, uid, id) => s.mani[uid] && s.mani[uid][id] === 'i';
  // la squadra «vede» un reperto se è pubblico, sul muro o intero in mano a qualcuno; una deduzione se l'ha fatta
  const vedeSq = (s, id) =>
    s.pub.includes(id) || s.muro.includes(id) || s.ded.includes(id) || s.ordine.some(u => intero(s, u, id));
  // chi agisce può usare ciò che ha in mano, ciò che sta sulla TV e le deduzioni della squadra
  const aPortata = (s, uid, id) =>
    intero(s, uid, id) || s.pub.includes(id) || s.muro.includes(id) || s.ded.includes(id);
  const capCorr = (k, s) => k.capitoli[s.cap] || null;
  const disponibile = (k, s, capId) => capIdx(k, capId) <= s.cap;
  const domCorr = (k, s) => (s.fase === 'accusa' ? accusa(k) : (capCorr(k, s) || {}).domande || []);

  function rilascia(s, k, id, attore) {
    if (s.rel[id]) return;
    const r = rep(k, id);
    if (!r) return;
    s.rel[id] = 1;
    const avvisa = u => scrivi(s, u, 'Nuovo reperto: ' + r.titolo, 'reperto');
    if (r.a === 'tutti') {
      s.pub.push(id);
      log(s, 'Sulla TV: ' + r.titolo);
      cue(s, { tipo: 'reperto', id });
      return;
    }
    if (meta(r)) {
      const [a, b] = r.a.meta;
      for (const u of s.ordine) {
        const x = haSpec(s, u, a),
          y = haSpec(s, u, b);
        if (x && y) s.mani[u][id] = 'i';
        else if (x) s.mani[u][id] = 0;
        else if (y) s.mani[u][id] = 1;
        else continue;
        avvisa(u);
      }
      return;
    }
    if (typeof r.a === 'string') {
      for (const u of s.ordine)
        if (haSpec(s, u, r.a)) {
          s.mani[u][id] = 'i';
          avvisa(u);
        }
      return;
    }
    if (attore && s.mani[attore]) {
      s.mani[attore][id] = 'i';
      avvisa(attore);
    }
  }
  // i reperti d'inizio di un capitolo citati nel copione escono alla riga; gli altri quando si apre il capitolo
  const dalCopione = c =>
    new Set([...(c.apertura || []), ...(c.chiusura || [])].filter(r => r.cue && r.cue.reperto).map(r => r.cue.reperto));
  function apriCap(s, k, i, ora) {
    s.cap = i;
    s.fase = 'apertura';
    s.riga = 0;
    s.fino = 0;
    s.capo = s.ordine[i % s.ordine.length];
    s.proposte = {};
    s.chiusiC = {};
    if (i > 0) s.ore += k.ore.capitolo || 0;
    const c = k.capitoli[i],
      cop = dalCopione(c);
    for (const r of k.reperti)
      if (daTipo(r) === 'inizio' && capIdx(k, r.capitolo) === i && !cop.has(r.id)) rilascia(s, k, r.id);
    log(s, 'Capitolo ' + c.titolo);
    cue(s, { tipo: 'capitolo', i });
    scrivi(s, s.capo, 'In questo capitolo sei il caposquadra: consegni tu le risposte', 'capo');
  }
  function eseguiRiga(s, k, r) {
    if (!r || !r.cue) return;
    const c = r.cue;
    if (c.reperto) rilascia(s, k, c.reperto);
    if (c.luogo) s.luogo = c.luogo;
    if (c.audio || c.fx) cue(s, { tipo: 'fx', audio: c.audio || '', fx: c.fx || '' });
  }
  function apriIndagine(s, k, ora) {
    const c = capCorr(k, s);
    for (const r of k.reperti) if (daTipo(r) === 'inizio' && capIdx(k, r.capitolo) === s.cap) rilascia(s, k, r.id);
    s.fase = 'indagine';
    s.riga = 0;
    s.fino = ora + c.minuti * 60000;
    log(s, 'Indagine aperta: ' + c.minuti + ' minuti');
    cue(s, { tipo: 'indagine' });
  }
  function apriConsegna(s, k, ora) {
    s.fase = 'consegna';
    s.fino = ora + (k.consegna || LIM.consegna) * 60000;
    log(s, 'Ultimi minuti: il caposquadra consegna le risposte');
    cue(s, { tipo: 'consegna-apre' });
    scrivi(s, s.capo, 'Consegna le risposte prima che scada il tempo', 'capo');
  }
  function apriRivelazione(s, k) {
    s.fase = 'rivelazione';
    s.riga = 0;
    s.fino = 0;
    for (const id of domCorr(k, s)) {
      const d = dom(k, id),
        e = giusto(d, s.risposte[id]);
      s.esiti[id] = e;
      if (e) s.stelle += d.stelle || 1;
      else s.ore = Math.max(0, s.ore - (k.ore.errore || 0));
    }
    log(s, 'Le risposte del capitolo');
  }
  // il copione della rivelazione: una domanda alla volta, poi la chiusura del capitolo
  const copRiv = (k, s) => [
    ...(capCorr(k, s).domande || []).map(id => ({ riv: id })),
    ...(capCorr(k, s).chiusura || []),
  ];
  function risultati(s, k) {
    let stelle = s.stelle;
    const acc = {};
    for (const id of accusa(k)) {
      const d = dom(k, id),
        e = giusto(d, s.risposte[id]);
      acc[id] = e;
      s.esiti[id] = e;
      if (e) stelle += d.stelle || 1;
    }
    const valide = new Set(accusa(k).flatMap(id => dom(k, id).prove || []));
    const sost = (s.risposte.sostegno || []).filter((x, i, l) => l.indexOf(x) === i && valide.has(x) && vedeSq(s, x));
    const pSost = Math.min(sost.length, k.accusa.sostegno || 0);
    stelle += pSost;
    const pOre = Math.floor(s.ore / 2);
    stelle += pOre;
    const chi = accusa(k).find(id => dom(k, id).tipo === 'personaggio');
    const tutte = accusa(k).every(id => acc[id]);
    const finale = acc[chi] ? (tutte ? 'pieno' : 'parziale') : 'fallito';
    const gradi = (k.gradi || [{ da: 0, nome: 'Investigatori' }]).slice().sort((a, b) => a.da - b.da);
    const grado = gradi.filter(x => stelle >= x.da).pop() || gradi[0];
    return { stelle, capitoli: s.stelle, accusa: acc, sostegno: pSost, oreBonus: pOre, finale, grado: grado.nome };
  }

  // ---- avanzamento ----
  function avanti(s, k, ora) {
    if (s.fase === 'pronta') return apriCap(s, k, 0, ora);
    if (s.fase === 'apertura') {
      const l = capCorr(k, s).apertura || [];
      if (s.riga < l.length) return eseguiRiga(s, k, l[s.riga++]);
      return apriIndagine(s, k, ora);
    }
    if (s.fase === 'indagine') return apriConsegna(s, k, ora);
    if (s.fase === 'consegna') return apriRivelazione(s, k);
    if (s.fase === 'rivelazione') {
      const l = copRiv(k, s);
      if (s.riga < l.length) {
        const r = l[s.riga++];
        if (r.riv) {
          s.rivelate.push(r.riv);
          cue(s, { tipo: 'rivela', dom: r.riv, giusta: !!s.esiti[r.riv] });
        } else eseguiRiga(s, k, r);
        return;
      }
      if (capCorr(k, s).pausa) {
        s.fase = 'pausa';
        log(s, 'Pausa');
        return;
      }
    }
    if (s.fase === 'rivelazione' || s.fase === 'pausa') {
      if (s.cap + 1 < k.capitoli.length) return apriCap(s, k, s.cap + 1, ora);
      s.fase = 'accusa';
      s.proposte = {};
      s.capo = s.ordine[(s.cap + 1) % s.ordine.length];
      log(s, "L'accusa");
      cue(s, { tipo: 'accusa' });
      scrivi(s, s.capo, "Sei il caposquadra dell'accusa: consegni tu le risposte finali", 'capo');
      return;
    }
    if (s.fase === 'accusa') {
      s.fase = 'finale';
      s.fin = 0;
      s.ris = risultati(s, k);
      s.rivelate.push(...accusa(k));
      log(s, 'La verità');
      cue(s, { tipo: 'finale' });
      return;
    }
    if (s.fase === 'finale') {
      if (s.fin < k.soluzione.ricostruzione.length) s.fin++;
      else {
        s.fase = 'fine';
        cue(s, { tipo: 'fine', finale: s.ris.finale });
      }
    }
  }
  function tick(s0, k, ora) {
    if (s0.pausa || s0.fase === 'fine') return null;
    let s = null;
    const S = () => (s = s || clone(s0));
    for (let i = 0; i < s0.lab.length; i++)
      if (ora >= s0.lab[i].pronta) {
        S();
        const l = s.lab.find(x => x.id === s0.lab[i].id);
        s.lab = s.lab.filter(x => x !== l);
        for (const r of k.reperti) if (daTipo(r) === 'analisi' && daVal(r) === l.id) rilascia(s, k, r.id, l.uid);
        log(s, 'Il laboratorio ha finito: ' + rep(k, ana(k, l.id).su).titolo);
        cue(s, { tipo: 'lab', id: l.id });
      }
    for (const [id, u] of Object.entries(s0.unisci))
      if (ora - u.at > LIM.unisci) {
        S();
        delete s.unisci[id];
        scrivi(s, u.uid, "Nessuno ha unito l'altra metà in tempo: riprova insieme", 'avviso');
      }
    if (s0.fino && ora >= s0.fino) {
      S();
      if (s.fase === 'indagine') apriConsegna(s, k, ora);
      else if (s.fase === 'consegna') apriRivelazione(s, k);
    }
    return s ? { s } : null;
  }

  // ---- azioni ----
  function valore(k, d, v) {
    if (d.tipo === 'scelta') return Number.isInteger(+v) && +v >= 0 && +v < d.scelte.length ? +v : null;
    if (d.tipo === 'personaggio') return per(k, v) ? v : null;
    if (d.tipo === 'luogo') return (k.luoghi || []).some(l => l.id === v) ? v : null;
    return normOra(v) || null;
  }
  const INDAGA = [
    'proietta',
    'togli',
    'unisci',
    'collega',
    'risolvi',
    'apri',
    'aiuto',
    'cerca',
    'chiedi',
    'analizza',
    'esplora',
  ];
  const PAROLA = ['proponi', 'parere', 'consegna'];
  function act(s0, a, k, ora) {
    if (!a || typeof a !== 'object') return { err: 'Azione vuota' };
    const uid = a.uid,
      regia = a.regia === true;
    if (!regia && !s0.gioc[uid]) return { err: 'Non sei in questa indagine' };
    if (a.seq !== undefined && !regia) {
      if ((s0.seq[uid] || 0) >= a.seq) return { s: s0 };
    }
    const s = clone(s0),
      no = m => ({ err: m });
    if (a.seq !== undefined && !regia) s.seq[uid] = a.seq;
    if (a.t === 'avanti') {
      if (!regia && uid !== s.capo) return no('Va avanti il caposquadra');
      if (s.pausa) return no('Siete in pausa');
      if (s.fase === 'fine') return no("L'indagine è chiusa");
      avanti(s, k, ora);
      return { s };
    }
    if (a.t === 'pausa') {
      if (!regia && uid !== s.capo) return no('La pausa la mette il caposquadra');
      if (s.pausa) {
        s.pausa = false;
        if (s.resto) s.fino = ora + s.resto;
        s.resto = 0;
        for (const l of s.lab) {
          l.pronta += ora - (l.ferma || ora);
          delete l.ferma;
        }
        log(s, 'Si riprende');
      } else {
        s.pausa = true;
        s.resto = s.fino ? Math.max(0, s.fino - ora) : 0;
        for (const l of s.lab) l.ferma = ora;
        log(s, 'Pausa');
      }
      cue(s, { tipo: 'pausa', on: s.pausa });
      return { s };
    }
    if (a.t === 'tempo' && regia) {
      if (!s.fino) return no('Nessun timer');
      s.fino += (a.minuti || 5) * 60000;
      return { s };
    }
    if (regia) return no('Comando della regia sconosciuto');
    if (s.pausa) return no('Siete in pausa');
    if (INDAGA.includes(a.t) && !['indagine', 'consegna'].includes(s.fase)) return no('Ora non si indaga');
    if (PAROLA.includes(a.t) && !['indagine', 'consegna', 'accusa'].includes(s.fase)) return no('Ora non si risponde');
    const costa = (n, cosa) => {
      if (s.fase !== 'indagine') return "Il tempo dell'indagine è finito: restano solo le risposte";
      if (s.ore < n) return "Non bastano le ore d'indagine (" + cosa + ' ne costa ' + n + ')';
      s.ore -= n;
      s.stat.azioni++;
      return '';
    };
    switch (a.t) {
      case 'proietta': {
        if (!intero(s, uid, a.rep)) return no('Puoi proiettare solo un reperto intero che hai tu');
        if (s.muro.includes(a.rep) || s.pub.includes(a.rep)) return no('È già sulla TV');
        s.muro.push(a.rep);
        if (s.muro.length > LIM.muro) s.muro.shift();
        s.stat.proiezioni++;
        cue(s, { tipo: 'proietta', rep: a.rep, da: nome(s, uid) });
        return { s };
      }
      case 'togli': {
        if (!s.muro.includes(a.rep)) return no('Non è sulla TV');
        s.muro = s.muro.filter(x => x !== a.rep);
        return { s };
      }
      case 'unisci': {
        const p = s.mani[uid][a.rep];
        if (p !== 0 && p !== 1) return no('Non hai una metà di questo reperto');
        const u = s.unisci[a.rep];
        if (u && u.uid !== uid && u.parte !== p && ora - u.at <= LIM.unisci) {
          s.mani[uid][a.rep] = 'i';
          s.mani[u.uid][a.rep] = 'i';
          delete s.unisci[a.rep];
          s.stat.unite++;
          const t = rep(k, a.rep).titolo;
          log(s, nome(s, u.uid) + ' e ' + nome(s, uid) + ' hanno ricomposto «' + t + '»');
          cue(s, { tipo: 'unito', rep: a.rep, chi: [nome(s, u.uid), nome(s, uid)] });
          [uid, u.uid].forEach(x => scrivi(s, x, 'Reperto ricomposto: ' + t, 'reperto'));
          return { s };
        }
        s.unisci[a.rep] = { uid, parte: p, at: ora };
        cue(s, { tipo: 'unisci', rep: a.rep, da: nome(s, uid) });
        scrivi(s, uid, "Chi ha l'altra metà deve toccare «Unisci» entro un minuto", 'info');
        return { s };
      }
      case 'collega': {
        const ids = Array.isArray(a.ids) ? [...new Set(a.ids)] : [];
        if (ids.length < 2) return no('Scegli almeno due reperti');
        if (s.ques[uid]) return no('Rispondi prima al collegamento aperto');
        for (const x of ids)
          if (!aPortata(s, uid, x)) return no('Puoi collegare solo reperti tuoi o proiettati sulla TV');
        const chiave = l => l.slice().sort().join('|');
        const c = (k.collegamenti || []).find(c => chiave(c.servono) === chiave(ids));
        if (!c) {
          scrivi(s, uid, 'Questi reperti non si collegano tra loro', 'avviso');
          return { s };
        }
        if (s.ded.includes(c.id)) return no("Questo collegamento la squadra l'ha già fatto");
        if (s.chiusiC[c.id]) return no('Questo collegamento si riapre nel prossimo capitolo');
        s.ques[uid] = { id: c.id };
        return { s };
      }
      case 'risolvi': {
        const q = s.ques[uid];
        if (!q) return no('Nessun collegamento aperto');
        const c = col(k, q.id);
        delete s.ques[uid];
        if (+a.scelta === c.giusta) {
          s.ded.push(c.id);
          log(s, 'Deduzione: ' + c.deduzione);
          cue(s, { tipo: 'deduzione', id: c.id, da: nome(s, uid) });
          for (const u of s.ordine) scrivi(s, u, 'Deduzione della squadra: ' + c.deduzione, 'deduzione');
          return { s };
        }
        s.tentC[c.id] = (s.tentC[c.id] || 0) + 1;
        let m = 'La conclusione non regge';
        if (s.tentC[c.id] >= 2 && (c.aiuti || [])[0]) m += '. Suggerimento: ' + c.aiuti[0];
        if (s.tentC[c.id] >= LIM.tentativi) {
          s.chiusiC[c.id] = 1;
          s.tentC[c.id] = 0;
          m += '. Riprovate nel prossimo capitolo';
        }
        scrivi(s, uid, m, 'avviso');
        return { s };
      }
      case 'apri': {
        const x = serr(k, a.id);
        if (!x || !disponibile(k, s, x.capitolo)) return no('Serratura sconosciuta');
        if (s.aperte.includes(x.id)) return no('È già aperta');
        if (norm(a.val) !== norm(x.soluzione)) {
          s.tentS[x.id] = (s.tentS[x.id] || 0) + 1;
          scrivi(s, uid, 'Non si apre', 'avviso');
          cue(s, { tipo: 'serratura-no', id: x.id });
          return { s };
        }
        s.aperte.push(x.id);
        for (const r of k.reperti) if (daTipo(r) === 'serratura' && daVal(r) === x.id) rilascia(s, k, r.id, uid);
        log(s, nome(s, uid) + ' ha aperto ' + x.titolo);
        cue(s, { tipo: 'serratura', id: x.id, da: nome(s, uid) });
        return { s };
      }
      case 'aiuto': {
        const x = a.su === 'serratura' ? serr(k, a.id) : a.su === 'domanda' ? dom(k, a.id) : null;
        if (!x) return no('Aiuto per cosa?');
        if (a.su === 'serratura' && (!disponibile(k, s, x.capitolo) || s.aperte.includes(x.id))) return no('Non serve');
        if (a.su === 'domanda' && !domCorr(k, s).includes(x.id)) return no('Non è una domanda di adesso');
        const chiave = a.su + ':' + x.id,
          i = s.aiuti[chiave] || 0,
          l = x.aiuti || [];
        if (i >= l.length) return no('Non ci sono altri aiuti');
        const c = costoAiuto(k, i);
        if (s.ore < c) return no("Non bastano le ore (l'aiuto ne costa " + c + ')');
        s.ore -= c;
        s.aiuti[chiave] = i + 1;
        for (const u of s.ordine) scrivi(s, u, 'Aiuto (' + (x.titolo || x.testo) + '): ' + l[i], 'aiuto');
        log(s, nome(s, uid) + ' ha chiesto un aiuto');
        return { s };
      }
      case 'cerca': {
        if (!haSpec(s, uid, 'archivio')) return no("Cerca in archivio chi ha l'Archivio");
        const p = norm(a.parola);
        if (p.length < 3) return no('Scrivi almeno tre lettere');
        const trovati = k.reperti.filter(
          r =>
            daTipo(r) === 'cerca' && !s.rel[r.id] && disponibile(k, s, r.capitolo) && daVal(r).some(w => norm(w) === p)
        );
        const e = costa(k.ore.cerca || 0, 'la ricerca');
        if (e) return no(e);
        if (!trovati.length) {
          scrivi(s, uid, 'Nessun fascicolo nuovo per «' + String(a.parola).slice(0, 30) + '»', 'avviso');
          return { s };
        }
        trovati.forEach(r => rilascia(s, k, r.id, uid));
        cue(s, { tipo: 'archivio', da: nome(s, uid), n: trovati.length });
        return { s };
      }
      case 'chiedi': {
        if (!haSpec(s, uid, 'testimoni')) return no('Gli interrogatori li fa chi ha i Testimoni');
        const t = tema(k, a.tema);
        if (!t || !disponibile(k, s, t.capitolo)) return no('Domanda sconosciuta');
        if (s.chiesti[t.id]) return no("Gliel'avete già chiesto");
        for (const x of t.richiede || []) if (!aPortata(s, uid, x)) return no('Ti serve qualcosa da mostrargli');
        const e = costa(t.ore || 0, "l'interrogatorio");
        if (e) return no(e);
        s.chiesti[t.id] = 1;
        s.depos.push({ persona: t.persona, tema: t.id });
        for (const r of k.reperti) if (daTipo(r) === 'tema' && daVal(r) === t.id) rilascia(s, k, r.id, uid);
        log(s, 'Interrogatorio: ' + per(k, t.persona).nome);
        cue(s, { tipo: 'interrogatorio', persona: t.persona, tema: t.id, da: nome(s, uid) });
        return { s };
      }
      case 'analizza': {
        if (!haSpec(s, uid, 'scientifica')) return no('Le analisi le chiede la Scientifica');
        const x = ana(k, a.id);
        if (!x) return no('Analisi sconosciuta');
        if (s.analizzati[x.id]) return no('Analisi già chiesta');
        if (!aPortata(s, uid, x.su)) return no('Ti serve il reperto da analizzare');
        const e = costa(x.ore || 0, "l'analisi");
        if (e) return no(e);
        s.analizzati[x.id] = 1;
        s.lab.push({ id: x.id, uid, pronta: ora + x.minuti * 60000 });
        log(s, 'In laboratorio: ' + rep(k, x.su).titolo);
        cue(s, { tipo: 'lab-parte', id: x.id });
        return { s };
      }
      case 'esplora': {
        if (!haSpec(s, uid, 'luoghi')) return no('I sopralluoghi li fa chi ha i Luoghi');
        const z = zona(k, a.zona);
        if (!z || !disponibile(k, s, z.cap)) return no('Zona sconosciuta');
        if (s.visti[z.id]) return no("L'avete già esaminata");
        const e = costa(z.ore || 0, 'il sopralluogo');
        if (e) return no(e);
        s.visti[z.id] = 1;
        s.luogo = z.luogo;
        for (const r of k.reperti) if (daTipo(r) === 'zona' && daVal(r) === z.id) rilascia(s, k, r.id, uid);
        log(s, 'Sopralluogo: ' + z.nome);
        cue(s, { tipo: 'zona', zona: z.id, luogo: z.luogo, da: nome(s, uid) });
        return { s };
      }
      case 'proponi': {
        if (a.dom === 'sostegno' && s.fase === 'accusa') {
          const ids = Array.isArray(a.val) ? [...new Set(a.val)].filter(x => vedeSq(s, x)) : [];
          if (!ids.length) return no("Scegli i reperti o le deduzioni che reggono l'accusa");
          s.proposte.sostegno = { val: ids.slice(0, k.accusa.sostegno || 3), uid, si: [uid], no: [] };
          return { s };
        }
        if (!domCorr(k, s).includes(a.dom)) return no('Non è una domanda di adesso');
        const v = valore(k, dom(k, a.dom), a.val);
        if (v === null) return no('Risposta non valida');
        s.proposte[a.dom] = { val: v, uid, si: [uid], no: [] };
        return { s };
      }
      case 'parere': {
        const p = s.proposte[a.dom];
        if (!p) return no('Nessuna proposta');
        p.si = p.si.filter(x => x !== uid);
        p.no = p.no.filter(x => x !== uid);
        (a.si ? p.si : p.no).push(uid);
        return { s };
      }
      case 'consegna': {
        if (uid !== s.capo) return no('Consegna il caposquadra');
        const p = s.proposte[a.dom];
        if (!p) return no('Prima serve una proposta');
        if (a.dom !== 'sostegno' && !domCorr(k, s).includes(a.dom)) return no('Non è una domanda di adesso');
        s.risposte[a.dom] = clone(p.val);
        log(s, 'Risposta consegnata');
        cue(s, { tipo: 'consegna', dom: a.dom });
        return { s };
      }
    }
    return no('Azione sconosciuta');
  }

  // ---- viste ----
  function vistaRep(k, s, id, parte) {
    const r = rep(k, id);
    const o = { id, titolo: r.titolo, tipo: r.tipo, img: r.img || '', audio: r.audio || '' };
    if (parte === 0 || parte === 1) {
      o.testo = r.a.parti[parte];
      o.meta = parte;
    } else o.testo = r.testo;
    return o;
  }
  function vistaDom(k, s, id) {
    const d = dom(k, id),
      riv = s.rivelate.includes(id),
      p = s.proposte[id];
    const o = {
      id,
      testo: d.testo,
      tipo: d.tipo,
      stato: riv ? 'rivelata' : s.risposte[id] !== undefined ? 'consegnata' : p ? 'proposta' : 'aperta',
    };
    if (riv) {
      o.giusta = !!s.esiti[id];
      o.risposta = testoScelta(k, d, s.risposte[id]);
      o.vera = testoScelta(k, d, d.giusta);
      o.rivelazione = d.rivelazione || '';
    }
    return o;
  }
  function pubblico(s, k) {
    const c = capCorr(k, s);
    let riga = null;
    if (s.fase === 'apertura' && s.riga > 0) riga = (c.apertura || [])[s.riga - 1] || null;
    if (s.fase === 'rivelazione' && s.riga > 0) riga = copRiv(k, s)[s.riga - 1] || null;
    const domande =
      s.fase === 'pronta'
        ? []
        : s.fase === 'accusa' || s.fase === 'finale' || s.fase === 'fine'
          ? accusa(k)
          : c.domande;
    const o = {
      t: 'fascicolo',
      kit: k.id,
      fase: s.fase,
      cap: c ? { i: s.cap, id: c.id, titolo: c.titolo, di: k.capitoli.length } : null,
      riga: riga && (riga.testo || riga.riv) ? { testo: riga.testo || '', riv: riga.riv || '' } : null,
      fino: s.pausa ? 0 : s.fino,
      resto: s.resto,
      pausa: s.pausa,
      ore: s.ore,
      capo: nome(s, s.capo),
      squadra: s.ordine.map(u => ({
        nome: nome(s, u),
        spec: s.gioc[u].spec.map(x => nomeSpec(k, x)),
        capo: u === s.capo,
      })),
      domande: domande.map(id => vistaDom(k, s, id)),
      muro: [...s.pub, ...s.muro].map(id => vistaRep(k, s, id)),
      ded: s.ded.map(id => ({ id, testo: col(k, id).deduzione, quando: col(k, id).quando || '' })),
      depos: s.depos.map(x => {
        const t = tema(k, x.tema);
        return { persona: x.persona, nome: per(k, x.persona).nome, domanda: t.domanda, risposta: t.risposta };
      }),
      lab: s.lab.map(l => ({ id: l.id, su: rep(k, ana(k, l.id).su).titolo, pronta: l.pronta })),
      luogo: s.luogo,
      zone: Object.keys(s.visti).map(id => {
        const z = zona(k, id);
        return { id, luogo: z.luogo, nome: z.nome, testo: z.testo, x: z.x, y: z.y, w: z.w, h: z.h };
      }),
      aperte: s.aperte.map(id => ({ id, titolo: serr(k, id).titolo })),
      cue: s.cue,
      log: s.log.slice(-8),
    };
    if (s.fase === 'finale' || s.fase === 'fine') {
      o.ricostruzione = k.soluzione.ricostruzione.slice(0, s.fin);
      o.ris = s.ris;
      if (s.fase === 'fine') o.epilogo = (k.soluzione.epilogo || {})[s.ris.finale] || '';
    }
    return o;
  }
  // l'azione propria di ogni specialità, con ciò che si può fare adesso
  function azioni(k, s, uid) {
    const o = {};
    const sp = s.gioc[uid].spec;
    if (sp.includes('archivio')) o.archivio = { costo: k.ore.cerca || 0 };
    if (sp.includes('scientifica'))
      o.scientifica = (k.analisi || [])
        .filter(x => aPortata(s, uid, x.su) || s.analizzati[x.id])
        .map(x => ({
          id: x.id,
          su: rep(k, x.su).titolo,
          minuti: x.minuti,
          ore: x.ore || 0,
          fatta: !!s.analizzati[x.id],
          pronta: (s.lab.find(l => l.id === x.id) || {}).pronta || 0,
        }));
    if (sp.includes('testimoni'))
      o.testimoni = k.persone
        .map(p => ({
          id: p.id,
          nome: p.nome,
          ruolo: p.ruolo,
          img: p.img || '',
          temi: (p.temi || [])
            .filter(t => disponibile(k, s, t.capitolo))
            .map(t => {
              const libero = (t.richiede || []).every(x => aPortata(s, uid, x));
              return {
                id: t.id,
                domanda: libero || s.chiesti[t.id] ? t.domanda : '',
                chiuso: !libero,
                fatto: !!s.chiesti[t.id],
                ore: t.ore || 0,
              };
            }),
        }))
        .filter(p => p.temi.length);
    if (sp.includes('luoghi'))
      o.luoghi = (k.luoghi || [])
        .filter(l => disponibile(k, s, l.capitolo))
        .map(l => ({
          id: l.id,
          nome: l.nome,
          img: l.img || '',
          zone: (l.zone || []).map(z => ({
            id: z.id,
            nome: z.nome,
            x: z.x,
            y: z.y,
            w: z.w,
            h: z.h,
            ore: z.ore || 0,
            testo: s.visti[z.id] ? z.testo : '',
            visto: !!s.visti[z.id],
          })),
        }));
    return o;
  }
  function maniDi(s, k, uid) {
    const mie = Object.entries(s.mani[uid]).map(([id, p]) => ({
      ...vistaRep(k, s, id, p === 'i' ? null : p),
      proiettato: s.muro.includes(id),
      attesa: !!(s.unisci[id] && s.unisci[id].uid === uid),
    }));
    const q = s.ques[uid] ? col(k, s.ques[uid].id) : null;
    const sq = domCorr(k, s).filter(id => !s.rivelate.includes(id));
    return {
      stato: {
        t: 'stato',
        fase: s.fase,
        spec: s.gioc[uid].spec.map(x => ({ id: x, nome: nomeSpec(k, x) })),
        capo: s.capo === uid,
        nomeCapo: nome(s, s.capo),
        ore: s.ore,
        fino: s.pausa ? 0 : s.fino,
        pausa: s.pausa,
        cap: s.cap,
        ris: s.ris,
      },
      reperti: { t: 'reperti', l: mie, tv: [...s.pub, ...s.muro].map(id => vistaRep(k, s, id)) },
      azione: { t: 'azione', ...azioni(k, s, uid) },
      squadra: {
        t: 'squadra',
        domande: sq.map(id => {
          const d = dom(k, id),
            p = s.proposte[id];
          return {
            id,
            testo: d.testo,
            tipo: d.tipo,
            scelte:
              d.tipo === 'scelta'
                ? d.scelte
                : d.tipo === 'personaggio'
                  ? k.persone.map(p => ({ id: p.id, nome: p.nome }))
                  : d.tipo === 'luogo'
                    ? (k.luoghi || []).map(l => ({ id: l.id, nome: l.nome }))
                    : null,
            proposta: p
              ? {
                  testo: testoScelta(k, d, p.val),
                  da: nome(s, p.uid),
                  si: p.si.length,
                  no: p.no.length,
                  mio: p.si.includes(uid) ? 'si' : p.no.includes(uid) ? 'no' : '',
                }
              : null,
            consegnata: s.risposte[id] !== undefined ? testoScelta(k, d, s.risposte[id]) : '',
            aiuti: (d.aiuti || []).length - (s.aiuti['domanda:' + id] || 0),
          };
        }),
        sostegno:
          s.fase === 'accusa'
            ? {
                quanti: k.accusa.sostegno || 3,
                proposta: s.proposte.sostegno ? s.proposte.sostegno.val : null,
                consegnata: s.risposte.sostegno || null,
              }
            : null,
        ded: s.ded.map(id => ({ id, testo: col(k, id).deduzione })),
        serrature: (k.serrature || [])
          .filter(x => disponibile(k, s, x.capitolo))
          .map(x => ({
            id: x.id,
            titolo: x.titolo,
            tipo: x.tipo,
            testo: x.testo || '',
            scelte: x.scelte || null,
            aperta: s.aperte.includes(x.id),
            aiuti: (x.aiuti || []).length - (s.aiuti['serratura:' + x.id] || 0),
          })),
        quesito: q ? { id: q.id, domanda: q.domanda, scelte: q.scelte } : null,
      },
      msg: { t: 'msg', l: (s.msg[uid] || []).slice(-LIM.msg) },
    };
  }
  function mani(s, k) {
    const o = {};
    for (const u of s.ordine) o[u] = maniDi(s, k, u);
    return o;
  }

  return { valida, avvisi, nuova, act, tick, pubblico, mani, giusto, normOra, norm, origine, SPEC, LIM };
})();
if (typeof module !== 'undefined') module.exports = FASCICOLO;
