// Le stesse regole di database.rules.json provate sull'EMULATORE VERO di Firebase (non sull'interprete di tests/regole_rtdb.js).
// Si lancia con: npm run test:emulatore   (serve rete per scaricare l'emulatore; in CI: job «emulatore» di verifica.yml)
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
let fails = 0; const ck = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const prova = async (m, p) => { try { await assertSucceeds(p); return true; } catch (e) { return false; } };
const nega = async (p) => { try { await assertFails(p); return true; } catch (e) { return false; } };
(async () => {
  const [host, port] = (process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000').split(':');
  const env = await initializeTestEnvironment({ projectId: 'demo-taverna', database: { host, port: +port, rules: fs.readFileSync(path.join(__dirname, '../../database.rules.json'), 'utf8') } });
  const C = 'ABCD', doc = rev => ({ j: '{}', rev, t: 1 });
  const A = env.authenticatedContext('ua').database(), B = env.authenticatedContext('ub').database(), N = env.unauthenticatedContext().database();
  await env.withSecurityRulesDisabled(async c => { const d = c.database(); await d.ref(`stanze/${C}/d`).set(doc(0)); await d.ref(`stanze/${C}/dv/da`).set('ua'); await d.ref(`stanze/${C}/k/ua`).set(true); await d.ref(`stanze/${C}/m/da`).set({ j: '{}', t: 1 }); });
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
  await env.cleanup(); console.log(fails ? fails + ' CONTROLLI FALLITI' : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ECCEZIONE', e); process.exit(2); });
