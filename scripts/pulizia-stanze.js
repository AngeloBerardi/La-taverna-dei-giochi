#!/usr/bin/env node
// Pulizia del Realtime Database: le stanze non si cancellano da sole (database.rules.json, app/24m-rete-rtdb.js).
//   node scripts/pulizia-stanze.js              prova: elenca cosa cancellerebbe, non tocca niente
//   node scripts/pulizia-stanze.js --cancella   cancella davvero
//   opzioni: --giorni=7 (stanze ferme da almeno N giorni), --errori=30 (righe di errori/ più vecchie di N giorni)
// Credenziali: account di servizio del progetto, come JSON nella variabile FIREBASE_SERVICE_ACCOUNT oppure come file
// indicato da GOOGLE_APPLICATION_CREDENTIALS. Serve il pacchetto firebase-admin (`npm i --no-save firebase-admin@12`)
// e, sull'account di servizio, il ruolo «Firebase Realtime Database Admin». In automatico: .github/workflows/pulizia.yml.
//
// Cosa cancella:
//  - stanze/CODICE (tutto il ramo) se l'ultimo salvataggio della stanza (d/t) è più vecchio di --giorni e nessun telefono
//    è presente da meno di --giorni (p/DEV/t). Senza d (stanza mai partita) conta solo la presenza.
//  - regia/, segreti/, azioni/ di codici che non hanno più la stanza (cene con delitto finite o abbandonate).
//  - errori/ più vecchi di --errori giorni (la chiave inizia con il momento in millisecondi).
// La stanza generale (PIAZZA) non si cancella mai.
'use strict';

const URL_DB = process.env.RTDB_URL || 'https://la-taverna-dei-giochi-default-rtdb.europe-west1.firebasedatabase.app';
const GENERALE = 'PIAZZA';
const GIORNO = 86400000;

// Decisione pura (provata da tests/test_pulizia.js). dati = { stanze: {CODICE: {t, p: {DEV: {t}}}}, regia: [codici],
// segreti: [codici], azioni: [codici], errori: [chiavi] }. Restituisce i percorsi da cancellare e il motivo di ognuno.
function piano(dati, ora, opt) {
  const o = Object.assign({ giorni: 7, errori: 30 }, opt || {}),
    limite = ora - o.giorni * GIORNO,
    limErr = ora - o.errori * GIORNO,
    via = [],
    restano = new Set();
  for (const [code, s] of Object.entries(dati.stanze || {})) {
    const pres = Object.values((s && s.p) || {}).map(x => (x && typeof x.t === 'number' ? x.t : 0)),
      vivo = pres.some(t => t > limite),
      t = s && typeof s.t === 'number' ? s.t : null;
    if (code === GENERALE || vivo || (t !== null && t > limite)) {
      restano.add(code);
      continue;
    }
    via.push({
      p: 'stanze/' + code,
      perche: t === null ? 'mai partita, nessuno presente' : 'ferma da ' + giorni(ora - t),
    });
  }
  for (const ramo of ['regia', 'segreti', 'azioni'])
    for (const code of dati[ramo] || [])
      if (!restano.has(code)) via.push({ p: ramo + '/' + code, perche: 'stanza non più esistente' });
  for (const k of dati.errori || []) {
    const t = parseInt(k, 10);
    if (Number.isFinite(t) && t < limErr)
      via.push({ p: 'errori/' + k, perche: 'errore di ' + giorni(ora - t) + ' fa' });
  }
  return via;
}
const giorni = ms => Math.floor(ms / GIORNO) + ' giorni';

// ---------- accesso al database (REST con il token dell'account di servizio) ----------
async function token() {
  if (process.env.RTDB_TOKEN) return process.env.RTDB_TOKEN; // es. `gcloud auth print-access-token`, o per le prove
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    throw new Error('manca firebase-admin: npm i --no-save firebase-admin@12');
  }
  const env = process.env.FIREBASE_SERVICE_ACCOUNT;
  const cred = env ? admin.credential.cert(JSON.parse(env)) : admin.credential.applicationDefault();
  return (await cred.getAccessToken()).access_token;
}
function client(tk) {
  async function chiama(metodo, percorso, query, corpo) {
    const u = URL_DB + '/' + percorso + '.json' + (query ? '?' + query : '');
    const r = await fetch(u, {
      method: metodo,
      headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    if (!r.ok) throw new Error(metodo + ' ' + percorso + ': ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.json();
  }
  return {
    chiavi: async p => Object.keys((await chiama('GET', p, 'shallow=true')) || {}),
    leggi: p => chiama('GET', p),
    togli: mappa => chiama('PATCH', '', '', mappa),
  };
}

async function main() {
  const arg = process.argv.slice(2),
    num = (k, d) => {
      const a = arg.find(x => x.startsWith('--' + k + '='));
      return a ? Number(a.split('=')[1]) : d;
    },
    opt = { giorni: num('giorni', 7), errori: num('errori', 30) },
    davvero = arg.includes('--cancella');
  if (!(opt.giorni >= 1) || !(opt.errori >= 1)) throw new Error('--giorni e --errori devono essere almeno 1');
  const db = client(await token()),
    dati = { stanze: {} };
  // solo i pezzi piccoli: il momento dell'ultimo salvataggio e la presenza, mai lo stato delle partite
  for (const code of await db.chiavi('stanze')) {
    const [t, p] = await Promise.all([db.leggi('stanze/' + code + '/d/t'), db.leggi('stanze/' + code + '/p')]);
    dati.stanze[code] = { t, p };
  }
  for (const ramo of ['regia', 'segreti', 'azioni', 'errori']) dati[ramo] = await db.chiavi(ramo);
  const via = piano(dati, Date.now(), opt),
    nStanze = via.filter(x => x.p.startsWith('stanze/')).length;
  console.log(`Stanze nel database: ${Object.keys(dati.stanze).length}, da cancellare: ${nStanze}`);
  for (const x of via) console.log((davvero ? 'cancello ' : 'cancellerei ') + x.p + '  (' + x.perche + ')');
  if (!via.length) return console.log('Niente da pulire.');
  if (!davvero) return console.log('Prova: non ho cancellato niente. Aggiungi --cancella per farlo davvero.');
  for (let i = 0; i < via.length; i += 200) {
    const mappa = {};
    for (const x of via.slice(i, i + 200)) mappa[x.p] = null;
    await db.togli(mappa);
  }
  console.log('Fatto: ' + via.length + ' percorsi cancellati.');
}

if (require.main === module)
  main().catch(e => {
    console.error('Pulizia non riuscita: ' + e.message);
    process.exit(1);
  });
module.exports = { piano, GENERALE };
