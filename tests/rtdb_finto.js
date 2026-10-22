// Realtime Database finto per i test di rete: stessa semantica delle transazioni dell'SDK di Firebase.
//  - la prima esecuzione della funzione usa la copia locale del client, che può essere VECCHIA (le notifiche arrivano in ritardo);
//  - la scrittura parte solo se il server contiene ancora ciò che la funzione ha visto, altrimenti si riesegue con il valore del server;
//  - le latenze sono casuali (ma ripetibili con lo stesso seme), così le scritture dei client si mescolano davvero.
// Ogni client carica il VERO modulo app/24m-rete-rtdb.js (oggetto RT) e gli mette sotto questo finto SDK.
const fs = require('fs'), vm = require('vm'), path = require('path');
const carica = require('./carica.js');
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const DIST = carica('25-distanza.js', 'DIST');
const SORGENTE = fs.readFileSync(path.join(__dirname, '../src/js/app/24m-rete-rtdb.js'), 'utf8');

function creaDb(seme, opz) {
  opz = opz || {};
  const rnd = carica.rng(seme || 1), store = new Map(), clienti = [];
  const quanto = opz.ms || 5;
  const db = {
    store, clienti, commit: 0, riprove: 0,
    ritardo: () => new Promise(r => setTimeout(r, Math.floor(rnd() * quanto))),
    // il server notifica i client con ritardi diversi: le copie locali restano indietro per qualche ms
    // le notifiche arrivano in ritardo ma SEMPRE nell'ordine in cui il server le ha prodotte (come in Firebase):
    // una versione vecchia non può sorpassarne una nuova
    spingi(p, v) {
      // coda per client: ogni timer applica il messaggio PIÙ VECCHIO ancora in coda, qualunque timer scatti per primo
      for (const c of clienti) {
        c.coda.push([p, clone(v)]);
        setTimeout(() => { const [pp, vv] = c.coda.shift(); c.cache.set(pp, vv); }, Math.floor(rnd() * quanto * 1.6));
      }
    },
    metti(p, v) { store.set(p, clone(v)); for (const c of clienti) c.cache.set(p, clone(v)); },
    stanza(code, doc) { db.metti('stanze/' + code + '/d', { j: DIST.ser(doc), rev: doc.rev || 0, t: 1 }); },
    leggi(code) { const v = store.get('stanze/' + code + '/d'); return v ? DIST.de(v) : null; },
    cliente(nome) {
      const cache = new Map(), c = { nome, cache, coda: [] };
      const m = {
        ref: (d, p) => ({ path: p }),
        serverTimestamp: () => ({ '.sv': 'timestamp' }),
        async get(r) { await db.ritardo(); const v = store.has(r.path) ? clone(store.get(r.path)) : null; return { val: () => v, exists: () => v !== null }; },
        async runTransaction(r, fn) {
          let locale = clone(cache.has(r.path) ? cache.get(r.path) : null);
          for (let i = 0; i < 25; i++) {
            const out = fn(clone(locale));
            if (out === undefined) return { committed: false };
            await db.ritardo();
            const srv = store.has(r.path) ? store.get(r.path) : null;
            if (JSON.stringify(srv) === JSON.stringify(locale)) {
              const v = clone(out); if (v.t && v.t['.sv']) v.t = Date.now();
              store.set(r.path, v); db.commit++; db.spingi(r.path, v);
              return { committed: true };
            }
            db.riprove++; locale = clone(srv);
          }
          throw Object.assign(new Error('maxretry'), { code: 'maxretry' });
        },
      };
      const ctx = { console, Math, JSON, Date, DIST, ME: { dev: nome }, R: {}, ui: {}, FB: {}, document: { addEventListener() {} }, setTimeout, clearTimeout, setInterval, clearInterval, URLSearchParams, location: { search: '' } };
      vm.createContext(ctx); vm.runInContext(SORGENTE + '\n;this.__X=RT;', ctx);
      c.RT = ctx.__X; c.RT.m = m; c.RT.db = {}; c.RT.on = true;
      // la copia locale del client, già decodificata, come la vede l'app
      c.doc = code => { const v = cache.get('stanze/' + code + '/d'); return v ? DIST.de(v) : null; };
      clienti.push(c); return c;
    },
  };
  return db;
}
module.exports = { creaDb, clone, DIST };
