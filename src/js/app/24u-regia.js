/* ---- Regia: lo schermo comune (TV) che conduce una partita con segreti (cene con delitto) ----
   Negli altri giochi lo stato sta tutto in stanze/CODICE/d e ogni telefono lo legge, mani comprese. Qui i segreti non
   devono arrivare a nessun telefono: li tiene la TV «regista», che è l'unica a conoscere il kit e la soluzione.
   Percorsi (regole in database.rules.json):
   - stanze/CODICE/r = uid della TV regista. La prende chi è già dentro la stanza (k) se è libera; la lascia lei, oppure
     la toglie chi è dentro (pulsante «cambia schermo», per una TV morta).
   - regia/CODICE = stato privato della regia {j} (kit in corso, atto, consegne, voti): legge e scrive solo la regista.
   - segreti/CODICE/UID/CHIAVE = ciò che ha in mano UID {j} (scheda, indizi): scrive solo la regista, legge solo UID.
   - azioni/CODICE/UID/ID = richieste di UID alla regista {j} (mostra un indizio, voto d'accusa): le scrive UID se è
     dentro la stanza, le legge e le consuma solo la regista.
   Sono fuori da stanze/ perché in quel ramo chiunque abbia fatto l'accesso legge tutto (le letture si ereditano).
   Limite noto: chi è dentro la stanza può togliere la regista e prendersi il ruolo con gli strumenti da sviluppatore;
   la TV lo segnala (REGIA.uid cambia) e il gioco la mostra a tutti. Tra amici basta, un server lo eviterebbe del tutto.
   Solo con le stanze sul database (R.mode==='rt'). Dati: DIST.ser/de, come gli altri nodi. */
const REGIA = {
  // indice dei kit (riempito dal build: titolo, giocatori, durata, url del file). Le trame stanno nei file, non qui.
  KIT: /*KIT*/ {},
  uid: '',
  _un: null,
  _code: '',
  pronto() {
    return R.mode === 'rt' && !!RT.m && !!RT.uid();
  },
  sono() {
    return !!REGIA.uid && REGIA.uid === RT.uid();
  },
  // percorsi nel database (codice e chiavi controllati qui, oltre che dalle regole)
  P: {
    r: c => ['stanze', REGIA.ok(c), 'r'],
    stato: c => ['regia', REGIA.ok(c)],
    segreti: c => ['segreti', REGIA.ok(c)],
    mio: (c, u) => ['segreti', REGIA.ok(c), REGIA.ok(u, 128)],
    segreto: (c, u, k) => ['segreti', REGIA.ok(c), REGIA.ok(u, 128), REGIA.ok(k, 32)],
    azioni: c => ['azioni', REGIA.ok(c)],
    azione: (c, u, id) => ['azioni', REGIA.ok(c), REGIA.ok(u, 128), REGIA.ok(id, 40)],
  },
  ok(s, max) {
    s = String(s || '');
    if (!new RegExp('^[\\w-]{1,' + (max || 16) + '}$').test(s)) throw new Error('chiave non valida');
    return s;
  },
  pacco: o => ({ j: DIST.ser(o), t: Date.now() }),
  apri: v => (v && typeof v.j === 'string' ? DIST.de(v) : null),

  // ---- ruolo ----
  // la TV prende il ruolo: prima entra nella stanza (dispositivo e k), poi scrive il proprio uid in r se è libero
  async prendi(code) {
    const uid = RT.uid();
    if (!uid) throw Object.assign(new Error('Accesso non pronto'), { code: 'PERMISSION_DENIED' });
    await RT.claim(code);
    const r = await RT.m.runTransaction(RT.ref(REGIA.P.r(code)), cur => (cur && cur !== uid ? undefined : uid));
    if (!(r && r.committed)) {
      const e = new Error('C’è già uno schermo regista in questa stanza');
      e.code = 'occupato';
      throw e;
    }
    REGIA.uid = uid;
    return uid;
  },
  async lascia(code) {
    if (REGIA.sono()) await RT.m.remove(RT.ref(REGIA.P.r(code)));
    REGIA.uid = '';
  },
  // da un telefono dentro la stanza: libera il ruolo (la TV regista non risponde più)
  async libera(code) {
    await RT.m.remove(RT.ref(REGIA.P.r(code)));
  },
  // chi è la regista: aggiorna REGIA.uid e chiama cb(uid) a ogni cambio
  guarda(code, cb) {
    REGIA.smetti();
    REGIA._code = code;
    REGIA._un = RT.m.onValue(
      RT.ref(REGIA.P.r(code)),
      s => {
        REGIA.uid = s.val() || '';
        if (cb) cb(REGIA.uid);
      },
      () => {}
    );
  },
  smetti() {
    if (REGIA._un)
      try {
        REGIA._un();
      } catch (e) {
        ERR.n(e);
      }
    REGIA._un = null;
    REGIA._code = '';
  },

  // ---- lato regista (TV) ----
  // scarica un kit intero (trama e soluzione): lo fa solo la TV regista, mai un telefono
  async kit(id) {
    const k = REGIA.KIT[id];
    if (!k) throw new Error('Kit sconosciuto');
    const r = await fetch(k.url);
    if (!r.ok) throw new Error('Kit non scaricato (' + r.status + ')');
    return r.json();
  },
  async salva(code, stato) {
    await RT.m.set(RT.ref(REGIA.P.stato(code)), REGIA.pacco(stato));
  },
  async carica(code) {
    return REGIA.apri((await RT.m.get(RT.ref(REGIA.P.stato(code)))).val());
  },
  // consegna a un giocatore (uid) un oggetto con chiave k: scheda, indizio, messaggio privato
  async consegna(code, uid, k, o) {
    await RT.m.set(RT.ref(REGIA.P.segreto(code, uid, k)), REGIA.pacco(o));
  },
  async ritira(code, uid, k) {
    await RT.m.remove(RT.ref(REGIA.P.segreto(code, uid, k)));
  },
  // le richieste dei giocatori: cb([{uid,id,a}]) in ordine di arrivo
  ascoltaAzioni(code, cb) {
    return RT.m.onValue(
      RT.ref(REGIA.P.azioni(code)),
      s => cb(REGIA.elenco(s.val())),
      () => {}
    );
  },
  async leggiAzioni(code) {
    return REGIA.elenco((await RT.m.get(RT.ref(REGIA.P.azioni(code)))).val());
  },
  elenco(v) {
    const out = [];
    for (const uid of Object.keys(v || {}))
      for (const id of Object.keys(v[uid] || {})) {
        const a = REGIA.apri(v[uid][id]);
        if (a) out.push({ uid, id, a, t: v[uid][id].t || 0 });
      }
    return out.sort((x, y) => x.t - y.t || (x.id < y.id ? -1 : 1));
  },
  async consuma(code, uid, id) {
    await RT.m.remove(RT.ref(REGIA.P.azione(code, uid, id)));
  },
  // fine serata: niente segreti né richieste lasciati nel database
  async pulisci(code) {
    await RT.m.remove(RT.ref(REGIA.P.segreti(code)));
    await RT.m.remove(RT.ref(REGIA.P.azioni(code)));
    await RT.m.remove(RT.ref(REGIA.P.stato(code)));
  },

  // ---- lato giocatore (telefono) ----
  // ciò che ho in mano: cb({chiave: oggetto})
  ascoltaMiei(code, cb) {
    return RT.m.onValue(
      RT.ref(REGIA.P.mio(code, RT.uid())),
      s => {
        const v = s.val() || {},
          out = {};
        for (const k of Object.keys(v)) {
          const o = REGIA.apri(v[k]);
          if (o) out[k] = o;
        }
        cb(out);
      },
      () => {}
    );
  },
  // una richiesta alla regista; restituisce l'id
  async chiedi(code, a) {
    const id = Date.now().toString(36) + '-' + rid();
    await RT.m.set(RT.ref(REGIA.P.azione(code, RT.uid(), id)), REGIA.pacco(a));
    return id;
  },
};
