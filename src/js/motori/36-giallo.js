/* CENA CON DELITTO (regole pure, senza rete). Lo stato è quello privato della TV regista (regia/CODICE): contiene la
   soluzione e ciò che ognuno ha in mano. Ai telefoni arriva solo `mano[uid]` (REGIA.consegna) e alla stanza solo
   `pubblico(s)`. Formato del kit: docs/GIALLI.md. Contratto (diverso dai giochi a turni):
   - valida(kit) -> [errori]           kit ben fatto e risolvibile (ogni domanda ha almeno due indizi che la provano)
   - scegli(kit, n) -> [id personaggi]  quali personaggi entrano con n giocatori (essenziali + facoltativi in ordine)
   - nuova(kit, giocatori, opz) -> {s}|{err}   giocatori [{uid,nome}], opz {rnd, scelte:{uid:idPersonaggio}}
   - act(s, a, kit, ora) -> {s}|{err}   a = {t:'avanti'} dalla regia, oppure {t, uid, ...} dalle richieste dei telefoni
   - pubblico(s, kit) -> parte da mostrare a tutti (atto, timer, indizi pubblici, chi ha votato, finale)
   Fasi: prologo -> atto 0..k-1 -> accusa -> finale. L'avanzare lo decide la regia (pulsante o timer scaduto).
   Scena (facoltativa, docs/GIALLI-SCENA.md): k.scena (palette, atmosfera, ambiente, musica, voce), k.media (immagini e
   font, scritto dal build), atti[].luogo, eventi[].fx e messaggi privati, personaggi[].aspetto (ritratto disegnato). */
const GIALLO = (() => {
  const clone = o => JSON.parse(JSON.stringify(o));
  const PUNTI = { chi: 3, altra: 1, obiettivo: 1, attore: 2, franca: 3 };
  const testo = v => typeof v === 'string' && v.trim().length > 0;
  // repertorio comune a tutti i kit: ogni kit sceglie cosa usare (le viste in app/24w-scena.js li sanno disegnare e suonare)
  const FX = ['lampo', 'buio', 'tremito', 'campana', 'telegramma', 'sparo', 'orologio'];
  const STRATI = [
    'pioggia',
    'neve',
    'nebbia',
    'fuoco',
    'braci',
    'polvere',
    'lampi',
    'neon',
    'riflettori',
    'vignetta',
    'grana',
  ];
  const AMBIENTI = ['pioggia', 'vento', 'fuoco', 'folla', 'orologio', 'mare'];
  const TESTE = [
    'corti',
    'lunghi',
    'raccolti',
    'calvo',
    'cappello',
    'cilindro',
    'cappuccio',
    'fazzoletto',
    'elmo',
    'velo',
    'piuma',
  ];
  const PALETTE = ['fondo', 'carta', 'inchiostro', 'accento', 'sangue'];
  const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
  const img = (k, tipo, id) => (k.media && k.media[tipo] && k.media[tipo][id]) || '';

  function validaScena(k, no) {
    const sc = k.scena;
    if (sc === undefined) return;
    if (!sc || typeof sc !== 'object') return no('scena non valida');
    const pal = sc.palette || {};
    for (const c of PALETTE) if (!hex(pal[c])) no('scena: colore «' + c + '» mancante o non valido (#rrggbb)');
    const at = sc.atmosfera || {};
    for (const x of at.strati || []) if (!STRATI.includes(x)) no('scena: strato sconosciuto «' + x + '»');
    for (const x of sc.ambiente || []) if (!AMBIENTI.includes(x)) no('scena: ambiente sconosciuto «' + x + '»');
    const m = sc.musica;
    if (m !== undefined) {
      const ok =
        m &&
        m.bpm >= 40 &&
        m.bpm <= 200 &&
        Array.isArray(m.prog) &&
        m.prog.length &&
        m.prog.every(c => Array.isArray(c) && c[0] >= 24 && c[0] <= 84) &&
        Array.isArray(m.mel) &&
        m.mel.length === 8 &&
        m.mel.every(b => Array.isArray(b) && b.length === 8);
      if (!ok) no('scena: musica non valida (bpm, prog, 8 battute di 8 note)');
    }
    const v = sc.voce || {};
    if (
      (v.velocita !== undefined && !(v.velocita >= 0.5 && v.velocita <= 1.5)) ||
      (v.tono !== undefined && !(v.tono >= 0 && v.tono <= 2))
    )
      no('scena: voce non valida (velocità 0,5–1,5, tono 0–2)');
  }

  function valida(k) {
    const e = [],
      no = m => e.push(m);
    if (!k || typeof k !== 'object') return ['kit mancante'];
    if (!/^[a-z0-9-]{2,40}$/.test(k.id || '')) no('id del kit non valido');
    if (!testo(k.titolo)) no('titolo mancante');
    const pg = Array.isArray(k.personaggi) ? k.personaggi : [];
    const ids = new Set(pg.map(p => p.id));
    if (ids.size !== pg.length) no('personaggi con id ripetuto');
    const ess = pg.filter(p => p.essenziale);
    const [min, max] = Array.isArray(k.giocatori) ? k.giocatori : [0, 0];
    if (!(min >= ess.length && min >= 3)) no('minimo giocatori sotto il numero di personaggi essenziali');
    if (!(max <= pg.length && max >= min)) no('massimo giocatori oltre i personaggi disponibili');
    const atti = Array.isArray(k.atti) ? k.atti : [];
    if (!atti.length) no('nessun atto');
    if (!Array.isArray(k.prologo) || !k.prologo.every(testo)) no('prologo mancante');
    for (const p of pg) {
      const d = 'personaggio ' + p.id + ': ';
      for (const c of ['nome', 'storia', 'segreto', 'alibi']) if (!testo(p[c])) no(d + c + ' mancante');
      if (!Array.isArray(p.obiettivi) || p.obiettivi.length !== atti.length) no(d + 'servono obiettivi per ogni atto');
      for (const x of Object.keys(p.sa || {})) if (!ids.has(x)) no(d + 'sa qualcosa di uno sconosciuto (' + x + ')');
      const as = p.aspetto;
      if (as !== undefined) {
        if (as.testa !== undefined && !TESTE.includes(as.testa))
          no(d + 'aspetto: testa sconosciuta «' + as.testa + '»');
        for (const c of ['colore', 'capelli', 'pelle'])
          if (as[c] !== undefined && !hex(as[c])) no(d + 'aspetto: colore «' + c + '» non valido');
      }
      if (!p.essenziale) {
        const r = pg.find(q => q.id === p.riserva);
        if (!r || !r.essenziale) no(d + 'facoltativo senza riserva essenziale');
      }
    }
    const dom = Array.isArray(k.domande) ? k.domande : [];
    const sol = (k.soluzione && k.soluzione.risposte) || {};
    if (!dom.some(q => q.id === 'chi' && q.tipo === 'personaggio')) no('manca la domanda «chi»');
    for (const q of dom) {
      if (!testo(q.testo)) no('domanda ' + q.id + ' senza testo');
      if (q.tipo === 'personaggio') {
        const p = pg.find(x => x.id === sol[q.id]);
        if (!p || !p.essenziale) no('soluzione di ' + q.id + ': deve essere un personaggio essenziale');
      } else if (!Array.isArray(q.scelte) || q.scelte.length < 2 || !q.scelte.includes(sol[q.id]))
        no('domanda ' + q.id + ': la soluzione deve essere tra le scelte');
    }
    if (!Array.isArray(k.soluzione && k.soluzione.ricostruzione) || !k.soluzione.ricostruzione.every(testo))
      no('ricostruzione mancante');
    const visti = new Set(),
      prove = {};
    const luoghi = new Set((k.luoghi || []).map(l => l.id));
    atti.forEach((a, i) => {
      if (!testo(a.titolo) || !(a.minuti > 0)) no('atto ' + i + ': titolo o minuti mancanti');
      if (a.luogo !== undefined && !luoghi.has(a.luogo)) no('atto ' + i + ': luogo sconosciuto «' + a.luogo + '»');
      for (const x of a.strati || []) if (!STRATI.includes(x)) no('atto ' + i + ': strato sconosciuto «' + x + '»');
      for (const x of a.ambiente || [])
        if (!AMBIENTI.includes(x)) no('atto ' + i + ': ambiente sconosciuto «' + x + '»');
      for (const x of a.indizi || []) {
        if (!/^[a-z0-9-]{1,24}$/.test(x.id || '') || visti.has(x.id))
          no('indizio con id non valido o ripetuto: ' + x.id);
        visti.add(x.id);
        if (x.a !== 'tutti' && !ids.has(x.a)) no('indizio ' + x.id + ': destinatario sconosciuto');
        if (!testo(x.testo)) no('indizio ' + x.id + ': testo mancante');
        for (const q of x.prova || []) prove[q] = (prove[q] || 0) + 1;
      }
      for (const v of a.eventi || []) {
        if (!testo(v.testo) || !(v.dopo >= 0) || v.dopo >= a.minuti)
          no('atto ' + i + ': evento non valido (testo, minuto dentro l’atto)');
        if (v.fx !== undefined && !FX.includes(v.fx)) no('atto ' + i + ': effetto sconosciuto «' + v.fx + '»');
        if (v.a !== undefined && (!ids.has(v.a) || !testo(v.privato)))
          no('atto ' + i + ': messaggio privato senza destinatario o testo');
      }
    });
    for (const q of dom)
      if ((prove[q.id] || 0) < 2) no('domanda ' + q.id + ': servono almeno due indizi che la provino');
    validaScena(k, no);
    return e;
  }

  // con n giocatori: tutti gli essenziali, poi i facoltativi nell'ordine del kit
  function scegli(k, n) {
    const ess = k.personaggi.filter(p => p.essenziale),
      fac = k.personaggi.filter(p => !p.essenziale);
    return ess.concat(fac.slice(0, Math.max(0, n - ess.length))).map(p => p.id);
  }
  // a chi va un indizio: il destinatario se è in gioco, altrimenti la sua riserva
  function dest(k, inGioco, a) {
    if (a === 'tutti' || inGioco.includes(a)) return a;
    const p = k.personaggi.find(x => x.id === a);
    return p && inGioco.includes(p.riserva) ? p.riserva : null;
  }
  const pgDi = (k, id) => k.personaggi.find(p => p.id === id);

  function scheda(k, p, inGioco) {
    const sa = {};
    for (const [x, v] of Object.entries(p.sa || {})) if (inGioco.includes(x)) sa[pgDi(k, x).nome] = v;
    return {
      t: 'scheda',
      id: p.id,
      img: img(k, 'ritratti', p.id),
      aspetto: p.aspetto || null,
      nome: p.nome,
      ruolo: p.ruolo || '',
      costume: p.costume || '',
      storia: p.storia,
      segreto: p.segreto,
      alibi: p.alibi,
      sa,
    };
  }

  function nuova(k, giocatori, opz) {
    opz = opz || {};
    const err = valida(k);
    if (err.length) return { err: 'Kit non valido: ' + err[0] };
    const n = giocatori.length;
    if (n < k.giocatori[0] || n > k.giocatori[1])
      return { err: 'Questo giallo è per ' + k.giocatori[0] + '-' + k.giocatori[1] + ' giocatori' };
    const uids = giocatori.map(g => g.uid);
    if (new Set(uids).size !== n || uids.some(u => !u))
      return { err: 'Serve un telefono con profilo per ogni giocatore' };
    const rnd = opz.rnd || Math.random,
      inGioco = scegli(k, n),
      liberi = inGioco.slice(),
      pg = {};
    // prima le scelte fatte in lobby (se valide e non doppie), poi a caso
    for (const g of giocatori) {
      const v = opz.scelte && opz.scelte[g.uid];
      if (v && liberi.includes(v)) {
        pg[g.uid] = v;
        liberi.splice(liberi.indexOf(v), 1);
      }
    }
    for (const g of giocatori) if (!pg[g.uid]) pg[g.uid] = liberi.splice(Math.floor(rnd() * liberi.length), 1)[0];
    const s = {
      g: 'giallo',
      kit: k.id,
      fase: 'prologo',
      atto: -1,
      scade: 0,
      nomi: Object.fromEntries(giocatori.map(g => [g.uid, g.nome])),
      pg,
      inGioco,
      mano: {},
      pubblici: [],
      voti: {},
      attore: {},
      fatti: {},
      punti: null,
      eventi: {},
      ultimo: null,
      log: ['Si apre il sipario'],
    };
    for (const u of uids) s.mano[u] = { scheda: scheda(k, pgDi(k, pg[u]), inGioco) };
    return { s };
  }

  // l'atto i: obiettivi a ciascuno, indizi privati ai destinatari, quelli «tutti» nel pubblico
  function apriAtto(s, k, i, ora) {
    const a = k.atti[i],
      chi = {};
    for (const [u, p] of Object.entries(s.pg)) chi[p] = u;
    s.fase = 'atto';
    s.atto = i;
    s.scade = ora + a.minuti * 60000;
    s.inizio = ora; // gli eventi dell'atto si contano da qui (il tempo aggiunto non li sposta)
    for (const u of Object.keys(s.pg))
      s.mano[u]['ob' + i] = { t: 'obiettivi', atto: i, testi: pgDi(k, s.pg[u]).obiettivi[i] };
    for (const x of a.indizi) {
      const d = dest(k, s.inGioco, x.a);
      const o = { t: 'indizio', id: x.id, atto: i, titolo: x.titolo || 'Indizio', testo: x.testo };
      if (img(k, 'oggetti', x.id)) o.img = img(k, 'oggetti', x.id);
      if (d === 'tutti') s.pubblici.push(o);
      else if (d) s.mano[chi[d]]['i-' + x.id] = o;
    }
    s.log.push('Atto ' + (i + 1) + ': ' + a.titolo);
  }

  function punteggio(s, k) {
    const sol = k.soluzione.risposte,
      p = {},
      uids = Object.keys(s.pg),
      assassino = uids.find(u => s.pg[u] === sol.chi);
    let giusti = 0;
    for (const u of uids) {
      const v = s.voti[u] || {};
      let t = 0;
      for (const q of k.domande) if (v[q.id] === sol[q.id]) t += q.id === 'chi' ? PUNTI.chi : PUNTI.altra;
      if (v.chi === sol.chi && u !== assassino) giusti++;
      t += Object.values(s.fatti[u] || {}).filter(Boolean).length * PUNTI.obiettivo;
      p[u] = t;
    }
    // miglior attore: chi ha più voti (pari merito: tutti)
    const conta = {};
    for (const x of Object.values(s.attore)) conta[x] = (conta[x] || 0) + 1;
    const top = Math.max(0, ...Object.values(conta)),
      attori = top ? Object.keys(conta).filter(u => conta[u] === top) : [];
    for (const u of attori) p[u] += PUNTI.attore;
    // l'assassino che resta nascosto alla maggioranza la fa franca
    const franca = !!assassino && giusti * 2 < uids.length - 1;
    if (franca) p[assassino] += PUNTI.franca;
    return { p, attori, assassino, franca, giusti };
  }

  function act(s0, a, k, ora) {
    if (!a || typeof a !== 'object') return { err: 'Azione non valida' };
    const s = clone(s0);
    ora = ora || 0;
    // la regia aggiunge (o toglie) tempo all'atto in corso
    if (a.t === 'tempo') {
      if (s.fase !== 'atto') return { err: 'Il tempo conta solo durante gli atti' };
      s.scade = Math.max(ora, s.scade + (Math.round(+a.ms) || 0));
      return { s };
    }
    // un evento dell'atto in corso accade (lo decide la regia al minuto giusto): una volta sola, con l'eventuale messaggio privato
    if (a.t === 'evento') {
      const ev = s.fase === 'atto' && (k.atti[s.atto].eventi || [])[a.i];
      if (!ev) return { err: 'Nessun evento da far accadere' };
      const id = s.atto + '-' + a.i;
      if (s.eventi[id]) return { err: 'È già successo' };
      s.eventi[id] = true;
      let per = '';
      if (ev.a) {
        const d = dest(k, s.inGioco, ev.a),
          u = d && Object.keys(s.pg).find(x => s.pg[x] === d);
        if (u) {
          per = s.nomi[u];
          s.mano[u]['e-' + id] = {
            t: 'messaggio',
            atto: s.atto,
            titolo: ev.titolo || 'Messaggio per te',
            testo: ev.privato,
          };
        }
      }
      s.ultimo = { id, testo: ev.testo, fx: ev.fx || '', per, t: ora };
      s.log.push(ev.testo);
      return { s };
    }
    if (a.t === 'avanti') {
      s.ultimo = null;
      if (s.fase === 'prologo') apriAtto(s, k, 0, ora);
      else if (s.fase === 'atto' && s.atto < k.atti.length - 1) apriAtto(s, k, s.atto + 1, ora);
      else if (s.fase === 'atto') {
        s.fase = 'accusa';
        s.scade = 0;
        s.log.push('È il momento di accusare');
      } else if (s.fase === 'accusa') {
        s.fase = 'finale';
        s.punti = punteggio(s, k);
        s.log.push('La verità viene a galla');
      } else return { err: 'La serata è finita' };
      return { s };
    }
    // da qui in poi: richieste di un giocatore
    if (!a.uid || !s.pg[a.uid]) return { err: 'Non sei seduto a questa cena' };
    if (s.fase === 'finale') return { err: 'La serata è finita' };
    if (a.t === 'mostra') {
      if (s.fase !== 'atto') return { err: 'Si mostrano gli indizi durante gli atti' };
      const o = s.mano[a.uid]['i-' + a.indizio];
      if (!o || o.t !== 'indizio' || o.da) return { err: 'Non hai questo indizio' };
      if (!s.pg[a.a] || a.a === a.uid) return { err: 'A chi vuoi mostrarlo?' };
      const k2 = 'm-' + a.indizio;
      if (s.mano[a.a][k2] || s.mano[a.a]['i-' + a.indizio]) return { err: 'Lo conosce già' };
      s.mano[a.a][k2] = { ...o, da: s.nomi[a.uid] };
      s.log.push(s.nomi[a.uid] + ' mostra un indizio a ' + s.nomi[a.a]);
      return { s };
    }
    if (a.t === 'obiettivo') {
      if (s.fase !== 'atto' || a.atto !== s.atto) return { err: 'Puoi segnare solo gli obiettivi dell’atto in corso' };
      const n = pgDi(k, s.pg[a.uid]).obiettivi[a.atto].length;
      if (!(a.i >= 0 && a.i < n)) return { err: 'Obiettivo inesistente' };
      (s.fatti[a.uid] = s.fatti[a.uid] || {})[a.atto + '-' + a.i] = !!a.fatto;
      const ob = s.mano[a.uid]['ob' + a.atto];
      ob.fatti = { ...(ob.fatti || {}), [a.i]: !!a.fatto };
      return { s };
    }
    if (a.t === 'voto') {
      if (s.fase !== 'accusa') return { err: 'Non è ancora il momento di accusare' };
      const v = {};
      for (const q of k.domande) {
        const r = a.risposte && a.risposte[q.id];
        if (q.tipo === 'personaggio' ? !s.inGioco.includes(r) : !q.scelte.includes(r))
          return { err: 'Rispondi a tutte le domande' };
        v[q.id] = r;
      }
      s.voti[a.uid] = v;
      s.mano[a.uid].voto = { t: 'voto', risposte: v, attore: (s.mano[a.uid].voto || {}).attore || null };
      return { s };
    }
    if (a.t === 'attore') {
      if (s.fase !== 'accusa') return { err: 'Il miglior attore si vota all’accusa' };
      if (!s.pg[a.per] || a.per === a.uid) return { err: 'Vota qualcun altro' };
      s.attore[a.uid] = a.per;
      s.mano[a.uid].voto = { t: 'voto', risposte: null, ...(s.mano[a.uid].voto || {}), attore: a.per };
      return { s };
    }
    return { err: 'Azione non valida' };
  }

  // ciò che vede la stanza (e la TV a schermo): nessun segreto, nessuna soluzione prima del finale
  function pubblico(s, k) {
    const out = {
      g: 'giallo',
      kit: k.id,
      titolo: k.titolo,
      fase: s.fase,
      atto: s.atto,
      titoloAtto: s.atto >= 0 ? k.atti[s.atto].titolo : '',
      scade: s.scade,
      giocatori: Object.keys(s.pg).map(u => {
        const p = pgDi(k, s.pg[u]);
        return {
          uid: u,
          nome: s.nomi[u],
          id: p.id,
          pg: p.nome,
          ruolo: p.ruolo || '',
          costume: p.costume || '',
          img: img(k, 'ritratti', p.id),
          aspetto: p.aspetto || null,
        };
      }),
      luogo: luogoDi(k, s),
      vittima: k.vittima
        ? {
            nome: k.vittima.nome,
            chi: k.vittima.chi || '',
            img: img(k, 'ritratti', 'vittima'),
            aspetto: k.vittima.aspetto || null,
          }
        : null,
      ultimo: s.ultimo,
      // aspetto comune a telefoni e TV (niente segreti): colori, font dei titoli, stile
      scena: {
        palette: (k.scena && k.scena.palette) || null,
        font: (k.media && k.media.font) || '',
        stile: (k.scena && k.scena.stile) || '',
      },
      pubblici: s.pubblici,
      // per il modulo d'accusa: i personaggi in gioco (id e nome) e, dall'accusa in poi, le domande
      personaggi: s.inGioco.map(id => ({ id, nome: pgDi(k, id).nome })),
      domande: s.fase === 'accusa' || s.fase === 'finale' ? k.domande : [],
      votati: Object.keys(s.voti),
      attoreVotati: Object.keys(s.attore),
    };
    if (s.fase === 'finale')
      out.finale = {
        risposte: k.soluzione.risposte,
        chi: pgDi(k, k.soluzione.risposte.chi).nome,
        chiId: k.soluzione.risposte.chi,
        img: img(k, 'ritratti', k.soluzione.risposte.chi),
        aspetto: pgDi(k, k.soluzione.risposte.chi).aspetto || null,
        ricostruzione: k.soluzione.ricostruzione,
        voti: s.voti,
        punti: s.punti,
      };
    return out;
  }

  // il luogo dell'atto in corso (o il primo luogo del kit nel prologo)
  function luogoDi(k, s) {
    const id = s.atto >= 0 ? k.atti[s.atto].luogo : (k.luoghi || [])[0] && k.luoghi[0].id;
    const l = (k.luoghi || []).find(x => x.id === id);
    return l ? { id: l.id, nome: l.nome, img: img(k, 'luoghi', l.id) } : null;
  }

  return { valida, scegli, nuova, act, pubblico, PUNTI, FX, STRATI, AMBIENTI, TESTE };
})();
if (typeof module !== 'undefined') module.exports = GIALLO;
