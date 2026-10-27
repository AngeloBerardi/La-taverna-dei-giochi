// Le stesse regole di database.rules.json provate sull'EMULATORE VERO di Firebase (non sull'interprete di tests/regole_rtdb.js).
// Si lancia con: npm run test:emulatore   (serve rete per scaricare l'emulatore; in CI: job «emulatore» di verifica.yml)
const fs = require('fs'),
  path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
const prova = async (m, p) => {
  try {
    await assertSucceeds(p);
    return true;
  } catch (e) {
    return false;
  }
};
const nega = async p => {
  try {
    await assertFails(p);
    return true;
  } catch (e) {
    return false;
  }
};
(async () => {
  const [host, port] = (process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000').split(':');
  const env = await initializeTestEnvironment({
    projectId: 'demo-taverna',
    database: { host, port: +port, rules: fs.readFileSync(path.join(__dirname, '../../database.rules.json'), 'utf8') },
  });
  const C = 'ABCD',
    doc = rev => ({ j: '{}', rev, t: 1 });
  const A = env.authenticatedContext('ua').database(),
    B = env.authenticatedContext('ub').database(),
    N = env.unauthenticatedContext().database();
  await env.withSecurityRulesDisabled(async c => {
    const d = c.database();
    await d.ref(`stanze/${C}/d`).set(doc(0));
    await d.ref(`stanze/${C}/dv/da`).set('ua');
    await d.ref(`stanze/${C}/k/ua`).set(true);
    await d.ref(`stanze/${C}/m/da`).set({ j: '{}', t: 1 });
  });
  ck(await prova(0, A.ref(`stanze/${C}/d`).get()), 'lettura da profilo autenticato');
  ck(await nega(N.ref(`stanze/${C}/d`).get()), 'lettura senza accesso negata');
  ck(await nega(A.ref('stanze').get()), 'elenco stanze non leggibile');
  ck(await nega(B.ref(`stanze/${C}/d`).set(doc(1))), 'chi non è dentro non scrive la stanza');
  ck(await prova(0, A.ref(`stanze/${C}/d`).set(doc(1))), 'chi è dentro scrive, rev +1');
  ck(await nega(A.ref(`stanze/${C}/d`).set(doc(1))), 'rev uguale negata');
  ck(await nega(A.ref(`stanze/${C}/d`).remove()), 'la stanza non si cancella');
  ck(await nega(B.ref(`stanze/${C}/dv/da`).set('ub')), 'un dispositivo già legato non si ruba');
  ck(await nega(B.ref(`stanze/${C}/dv/db`).set('ua')), 'non si lega un dispositivo al profilo di un altro');
  ck(await prova(0, B.ref(`stanze/${C}/dv/db`).set('ub')), 'ognuno lega il proprio dispositivo');
  ck(await nega(B.ref(`stanze/${C}/m/da`).set({ j: '{}', t: 1 })), 'non si scrive il membro di un altro');
  ck(await prova(0, B.ref(`stanze/${C}/m/db`).set({ j: '{}', t: 1 })), 'si scrive il proprio membro');
  ck(await nega(B.ref(`stanze/${C}/c/1`).set({ j: '{}' })), 'chat: solo chi è dentro');
  ck(await prova(0, B.ref(`stanze/${C}/k/ub`).set(true)), 'ingresso in stanza per sé');
  ck(await prova(0, B.ref(`stanze/${C}/c/1`).set({ j: '{}' })), 'chat dopo l’ingresso');
  ck(await nega(A.ref(`stanze/${C}/pos/db`).set({ j: '{}', t: 1 })), 'posizione di un altro negata');
  ck(await prova(0, B.ref(`stanze/${C}/pos/db`).set({ j: '{}', t: 1 })), 'posizione propria');
  ck(await prova(0, B.ref('errori/1-x').set({ t: 1, m: 'boom' })), 'errori: scrittura');
  ck(await nega(B.ref('errori').get()), 'errori: lettura negata');
  // regia (cene con delitto): la TV (ut) è regista, ognuno legge solo i propri segreti
  const T = env.authenticatedContext('ut').database(),
    E = env.authenticatedContext('ue').database();
  ck(await nega(E.ref(`stanze/${C}/r`).set('ue')), 'regia: chi è fuori non la prende');
  ck(await prova(0, T.ref(`stanze/${C}/k/ut`).set(true)), 'regia: la TV entra nella stanza');
  ck(await prova(0, T.ref(`stanze/${C}/r`).set('ut')), 'regia: la TV prende il ruolo');
  ck(await nega(A.ref(`stanze/${C}/r`).set('ua')), 'regia: occupata, non si ruba');
  ck(await prova(0, T.ref(`segreti/${C}/ua/scheda`).set({ j: '{}', t: 1 })), 'segreti: la TV consegna ad Alice');
  ck(await prova(0, T.ref(`segreti/${C}/ub/scheda`).set({ j: '{}', t: 1 })), 'segreti: la TV consegna a Bob');
  ck(await prova(0, A.ref(`segreti/${C}/ua`).get()), 'segreti: Alice legge i propri');
  ck(await nega(A.ref(`segreti/${C}/ub/scheda`).get()), 'segreti: Alice non legge quelli di Bob');
  ck(await nega(A.ref(`segreti/${C}`).get()), 'segreti: Alice non legge quelli di tutti');
  ck(await nega(A.ref(`segreti/${C}/ua/x`).set({ j: '{}', t: 1 })), 'segreti: Alice non si consegna nulla');
  ck(await prova(0, T.ref(`regia/${C}`).set({ j: '{}', t: 1 })), 'regia: la TV salva il suo stato');
  ck(await nega(A.ref(`regia/${C}`).get()), 'regia: Alice non legge la soluzione');
  ck(await prova(0, A.ref(`azioni/${C}/ua/1-x`).set({ j: '{}', t: 1 })), 'azioni: Alice chiede alla regia');
  ck(await nega(A.ref(`azioni/${C}/ub/1-x`).set({ j: '{}', t: 1 })), 'azioni: non a nome di Bob');
  ck(await nega(B.ref(`azioni/${C}/ua`).get()), 'azioni: Bob non legge le richieste di Alice');
  ck(await prova(0, T.ref(`azioni/${C}`).get()), 'azioni: la TV le legge');
  ck(await prova(0, A.ref(`stanze/${C}/r`).remove()), 'regia: chi è dentro libera la TV morta');
  await env.cleanup();
  console.log(fails ? fails + ' CONTROLLI FALLITI' : 'ALL OK');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.log('ECCEZIONE', e);
  process.exit(2);
});
