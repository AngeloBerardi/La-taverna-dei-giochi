// Realtime Database finto per i test di rete: stessa semantica delle transazioni dell'SDK di Firebase.
//  - la prima esecuzione della funzione usa la copia locale del client, che può essere VECCHIA (le notifiche arrivano in ritardo);
//  - la scrittura parte solo se il server contiene ancora ciò che la funzione ha visto, altrimenti si riesegue con il valore del server;
//  - le latenze sono casuali (ma ripetibili con lo stesso seme), così le scritture dei client si mescolano davvero;
//  - con { regole: true } ogni lettura/scrittura passa da database.rules.json (interprete in regole_rtdb.js), come sul server.
// Ogni client carica il VERO modulo app/24m-rete-rtdb.js (oggetto RT) e gli mette sotto questo finto SDK.
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const carica = require('./carica.js'),
  R = require('./regole_rtdb.js');
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const DIST = carica('25-distanza.js', 'DIST');
const SORGENTE = fs.readFileSync(path.join(__dirname, '../src/js/app/24m-rete-rtdb.js'), 'utf8');
// i segnaposto «ora del server» diventano l'ora vera
const risolvi = v => {
  if (v && typeof v === 'object') {
    if (v['.sv']) return Date.now();
    for (const k of Object.keys(v)) v[k] = risolvi(v[k]);
  }
  return v;
};

function creaDb(seme, opz) {
  opz = opz || {};
  const rnd = carica.rng(seme || 1),
    store = new Map(),
    clienti = [],
    quanto = opz.ms || 5;
  const regole = opz.regole ? R.carica() : null;
  const db = {
    store,
    clienti,
    commit: 0,
    riprove: 0,
    negati: [],
    regole,
    ritardo: () => new Promise(r => setTimeout(r, Math.floor(rnd() * quanto))),
    // le notifiche arrivano in ritardo ma SEMPRE nell'ordine in cui il server le ha prodotte (come in Firebase):
    // coda per client: ogni timer applica il messaggio PIÙ VECCHIO ancora in coda, qualunque timer scatti per primo
    spingi(p, v) {
      for (const c of clienti) {
        c.coda.push([p, v === null ? null : clone(v)]);
        setTimeout(
          () => {
            const [pp, vv] = c.coda.shift();
            if (vv === null) c.cache.delete(pp);
            else c.cache.set(pp, vv);
          },
          Math.floor(rnd() * quanto * 1.6)
        );
      }
    },
    metti(p, v) {
      store.set(p, clone(v));
      for (const c of clienti) c.cache.set(p, clone(v));
    },
    stanza(code, doc) {
      db.metti('stanze/' + code + '/d', { j: DIST.ser(doc), rev: doc.rev || 0, t: 1 });
    },
    leggi(code) {
      const v = store.get('stanze/' + code + '/d');
      return v ? DIST.de(v) : null;
    },
    // controllo delle regole (se attive) su una scrittura; null = cancellare
    verifica(p, v, uid) {
      if (!regole) return;
      const r = R.puoScrivere(regole, R.albero(store), p, v, uid);
      if (!r.ok) {
        db.negati.push({ p, uid, motivo: r.motivo });
        throw Object.assign(new Error('Permission denied (' + r.motivo + ') ' + p), { code: 'PERMISSION_DENIED' });
      }
    },
    scrivi(p, v, uid) {
      db.verifica(p, v, uid);
      if (v === null) store.delete(p);
      else store.set(p, risolvi(clone(v)));
      db.commit++;
      db.spingi(p, v === null ? null : store.get(p));
    },
    // il telefono perde la linea: il server esegue gli onDisconnect registrati (le regole sono state controllate alla registrazione)
    scollega(c) {
      for (const p of c.disc.splice(0)) {
        if (store.has(p)) {
          store.delete(p);
          db.spingi(p, null);
        }
      }
    },
    cliente(nome, uid) {
      uid = uid || nome;
      const cache = new Map(),
        c = { nome, uid, cache, coda: [], disc: [] };
      const m = {
        ref: (d, p) => ({ path: p }),
        serverTimestamp: () => ({ '.sv': 'timestamp' }),
        async get(r) {
          await db.ritardo();
          if (regole && !R.puoLeggere(regole, R.albero(store), r.path, uid).ok)
            throw Object.assign(new Error('Permission denied'), { code: 'PERMISSION_DENIED' });
          const v = store.has(r.path) ? clone(store.get(r.path)) : null;
          return { val: () => v, exists: () => v !== null };
        },
        async set(r, v) {
          await db.ritardo();
          db.scrivi(r.path, clone(v), uid);
        },
        async remove(r) {
          await db.ritardo();
          db.scrivi(r.path, null, uid);
        },
        onDisconnect(r) {
          return {
            async remove() {
              db.verifica(r.path, null, uid);
              if (!c.disc.includes(r.path)) c.disc.push(r.path);
            },
            async cancel() {
              c.disc = c.disc.filter(x => x !== r.path);
            },
          };
        },
        async runTransaction(r, fn) {
          let locale = clone(cache.has(r.path) ? cache.get(r.path) : null);
          for (let i = 0; i < 25; i++) {
            const out = fn(clone(locale));
            if (out === undefined) return { committed: false };
            await db.ritardo();
            const srv = store.has(r.path) ? store.get(r.path) : null;
            if (JSON.stringify(srv) === JSON.stringify(locale)) {
              db.scrivi(r.path, clone(out), uid);
              return { committed: true };
            }
            db.riprove++;
            locale = clone(srv);
          }
          throw Object.assign(new Error('maxretry'), { code: 'maxretry' });
        },
      };
      const ctx = {
        console,
        Math,
        JSON,
        Date,
        DIST,
        ME: { dev: nome },
        R: {},
        ui: {},
        FB: { uid, auth: { currentUser: { uid } } },
        rid: () => Math.random().toString(36).slice(2, 10),
        ST: () => null,
        document: { addEventListener() {} },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        URLSearchParams,
        location: { search: '' },
      };
      vm.createContext(ctx);
      vm.runInContext(SORGENTE + '\n;this.__X=RT;this.__ME=ME;', ctx);
      c.RT = ctx.__X;
      c.ME = ctx.__ME;
      c.RT.m = m;
      c.RT.db = {};
      c.RT.on = true;
      c.doc = code => {
        const v = cache.get('stanze/' + code + '/d');
        return v ? DIST.de(v) : null;
      };
      clienti.push(c);
      return c;
    },
  };
  return db;
}
module.exports = { creaDb, clone, DIST };
