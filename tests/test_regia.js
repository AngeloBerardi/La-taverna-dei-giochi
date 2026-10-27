// Regia (cene con delitto): la TV regista tiene i segreti, ogni telefono legge solo i propri.
// A) le regole di database.rules.json una per una (interprete tests/regole_rtdb.js);
// B) il vero modulo app/24u-regia.js (REGIA) sopra il vero RT e il database finto con le regole attive.
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');
const R = require('./regole_rtdb.js'),
  { creaDb, DIST } = require('./rtdb_finto.js');
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
const regole = R.carica(),
  C = 'ABCD',
  S = 'stanze/' + C + '/';
const J = o => ({ j: JSON.stringify(o), t: 1 });
// stanza con Alice (ua) e Bob (ub) dentro, la TV (ut) dentro e regista; Eve (ue) fuori
const base = () =>
  new Map([
    [S + 'd', { j: '{"phase":"lobby","rev":0}', rev: 0, t: 1 }],
    [S + 'k/ua', true],
    [S + 'k/ub', true],
    [S + 'k/ut', true],
    [S + 'r', 'ut'],
    ['segreti/' + C + '/ua/scheda', J({ chi: 'Contessa' })],
    ['segreti/' + C + '/ub/scheda', J({ chi: 'Maggiordomo', assassino: true })],
    ['regia/' + C, J({ soluzione: 'ub' })],
    ['azioni/' + C + '/ua/1-x', J({ t: 'voto', chi: 'ub' })],
  ]);
const scrive = (b, p, v, u) => R.puoScrivere(regole, R.albero(b), p, v, u).ok;
const legge = (b, p, u) => R.puoLeggere(regole, R.albero(b), p, u).ok;

(async () => {
  // ---- A) regole ----
  {
    const b = base();
    // ruolo
    const libera = base();
    libera.delete(S + 'r');
    ck(scrive(libera, S + 'r', 'ut', 'ut'), 'ruolo: chi è dentro prende la regia libera');
    ck(!scrive(libera, S + 'r', 'ue', 'ue'), 'ruolo: chi è fuori dalla stanza non la prende');
    ck(!scrive(libera, S + 'r', 'ub', 'ua'), 'ruolo: nessuno mette un altro come regista');
    ck(!scrive(b, S + 'r', 'ua', 'ua'), 'ruolo: occupata, non si ruba scrivendoci sopra');
    ck(scrive(b, S + 'r', 'ut', 'ut'), 'ruolo: la regista può riscriversi uguale');
    ck(scrive(b, S + 'r', null, 'ut'), 'ruolo: la regista lascia');
    ck(scrive(b, S + 'r', null, 'ua'), 'ruolo: chi è dentro la libera (TV morta)');
    ck(!scrive(b, S + 'r', null, 'ue'), 'ruolo: chi è fuori non la libera');
    ck(legge(b, S + 'r', 'ua'), 'ruolo: tutti vedono chi è la regista');
    // segreti
    ck(legge(b, 'segreti/' + C + '/ua/scheda', 'ua'), 'segreti: Alice legge la propria scheda');
    ck(legge(b, 'segreti/' + C + '/ua', 'ua'), 'segreti: Alice legge tutto ciò che ha in mano');
    ck(!legge(b, 'segreti/' + C + '/ub/scheda', 'ua'), 'segreti: Alice NON legge la scheda di Bob');
    ck(!legge(b, 'segreti/' + C, 'ua'), 'segreti: Alice NON legge i segreti di tutti');
    ck(!legge(b, 'segreti/' + C + '/ua', 'ue'), 'segreti: un estraneo non legge nulla');
    ck(legge(b, 'segreti/' + C, 'ut'), 'segreti: la regista legge tutto');
    ck(!legge(b, 'segreti', 'ut'), 'segreti: nemmeno la regista legge le altre stanze');
    ck(scrive(b, 'segreti/' + C + '/ua/i3', J({ t: 'indizio' }), 'ut'), 'segreti: la regista consegna');
    ck(!scrive(b, 'segreti/' + C + '/ua/i3', J({ t: 'falso' }), 'ua'), 'segreti: Alice non si dà indizi da sola');
    ck(!scrive(b, 'segreti/' + C + '/ub/scheda', J({}), 'ua'), 'segreti: Alice non tocca la scheda di Bob');
    ck(!scrive(b, 'segreti/' + C + '/ua/scheda', null, 'ua'), 'segreti: Alice non butta via le proprie carte');
    ck(scrive(b, 'segreti/' + C, null, 'ut'), 'segreti: la regista pulisce a fine serata');
    ck(!scrive(b, 'segreti/' + C + '/ua/x', { j: 'x'.repeat(60001), t: 1 }, 'ut'), 'segreti: oltre 60000, negato');
    ck(!scrive(b, 'segreti/' + C + '/ua/x', { j: 5, t: 1 }, 'ut'), 'segreti: j deve essere testo');
    ck(!scrive(b, 'segreti/' + C + '/ua/a.b', J({}), 'ut'), 'segreti: chiave con caratteri strani, negata');
    // stato della regia
    ck(legge(b, 'regia/' + C, 'ut') && !legge(b, 'regia/' + C, 'ua'), 'regia: la soluzione la legge solo la TV');
    ck(scrive(b, 'regia/' + C, J({ atto: 2 }), 'ut'), 'regia: la TV salva lo stato');
    ck(!scrive(b, 'regia/' + C, J({ atto: 9 }), 'ua'), 'regia: un giocatore non lo scrive');
    ck(!scrive(b, 'regia/' + C, { x: 1 }, 'ut'), 'regia: senza j, negato');
    // azioni
    ck(scrive(b, 'azioni/' + C + '/ua/2-y', J({ t: 'mostra' }), 'ua'), 'azioni: Alice chiede alla regia');
    ck(!scrive(b, 'azioni/' + C + '/ub/2-y', J({ t: 'voto' }), 'ua'), 'azioni: Alice non chiede a nome di Bob');
    ck(!scrive(b, 'azioni/' + C + '/ue/2-y', J({ t: 'voto' }), 'ue'), 'azioni: chi è fuori non chiede');
    ck(!legge(b, 'azioni/' + C + '/ua', 'ub'), 'azioni: Bob non vede il voto di Alice');
    ck(!legge(b, 'azioni/' + C + '/ua', 'ua'), 'azioni: (nemmeno Alice rilegge, non serve)');
    ck(legge(b, 'azioni/' + C, 'ut'), 'azioni: la regista le legge');
    ck(scrive(b, 'azioni/' + C + '/ua/1-x', null, 'ut'), 'azioni: la regista le consuma');
    ck(!scrive(b, 'azioni/' + C + '/ua/3-z', { j: 'x'.repeat(4001), t: 1 }, 'ua'), 'azioni: oltre 4000, negato');
    // il resto della stanza resta com'era
    ck(legge(b, S + 'd', 'ue') && !legge(b, 'stanze', 'ua'), 'stanza: lettura invariata');
  }

  // ---- B) il vero modulo REGIA ----
  {
    const SRC = fs.readFileSync(path.join(__dirname, '../src/js/app/24u-regia.js'), 'utf8');
    const db = creaDb(11, { regole: true, ms: 3 });
    const conRegia = c => {
      const ctx = {
        RT: c.RT,
        R: { mode: 'rt' },
        DIST,
        ERR: { n() {} },
        rid: () => Math.random().toString(36).slice(2, 8),
        console,
        Date,
        JSON,
        Object,
        RegExp,
        String,
        Error,
      };
      vm.createContext(ctx);
      vm.runInContext(SRC + '\n;this.__G=REGIA;', ctx);
      c.REGIA = ctx.__G;
      return c;
    };
    const A = conRegia(db.cliente('da', 'ua')),
      B = conRegia(db.cliente('db', 'ub')),
      T = conRegia(db.cliente('tv', 'ut')),
      E = conRegia(db.cliente('de', 'ue'));
    const no = p =>
      p.then(
        () => null,
        e => e.code || e.message
      );
    await A.RT.setRoom(C, { phase: 'lobby', rev: 0, s: null });
    await A.RT.setMem(['stanze', C, 'm', 'da'], { name: 'Alice', uid: 'ua' });
    await B.RT.setMem(['stanze', C, 'm', 'db'], { name: 'Bob', uid: 'ub' });

    ck((await T.REGIA.prendi(C)) === 'ut' && db.store.get(S + 'r') === 'ut', 'client: la TV prende la regia');
    ck(T.REGIA.sono(), 'client: la TV sa di essere regista');
    ck(db.store.get(S + 'k/ut') === true && !db.store.has(S + 'm/tv'), 'client: la TV è dentro ma non è un giocatore');
    ck((await no(A.REGIA.prendi(C))) === 'occupato', 'client: Alice non ruba la regia occupata');
    ck(db.store.get(S + 'r') === 'ut', 'client: la regia resta alla TV');

    await T.REGIA.salva(C, { kit: 'villa', soluzione: { chi: 'ub' } });
    ck((await T.REGIA.carica(C)).soluzione.chi === 'ub', 'client: la TV salva e ricarica il suo stato');
    ck((await no(A.REGIA.carica(C))) === 'PERMISSION_DENIED', 'client: Alice non legge la soluzione');

    await T.REGIA.consegna(C, 'ua', 'scheda', { chi: 'Contessa' });
    await T.REGIA.consegna(C, 'ub', 'scheda', { chi: 'Maggiordomo', assassino: true });
    const mia = await A.RT.m.get(A.RT.ref(['segreti', C, 'ua']));
    ck(DIST.de(mia.val().scheda).chi === 'Contessa', 'client: Alice legge la propria scheda');
    ck(
      (await no(A.RT.m.get(A.RT.ref(['segreti', C, 'ub'])))) === 'PERMISSION_DENIED',
      'client: Alice non legge la scheda di Bob'
    );
    ck(
      (await no(E.RT.m.get(E.RT.ref(['segreti', C, 'ub', 'scheda'])))) === 'PERMISSION_DENIED',
      'client: Eve non legge nulla'
    );
    ck(
      (await no(A.REGIA.consegna(C, 'ua', 'i9', { falso: 1 }))) === 'PERMISSION_DENIED',
      'client: Alice non si consegna indizi'
    );

    // richieste dei giocatori: la TV le legge in ordine e le consuma
    const id1 = await A.REGIA.chiedi(C, { t: 'mostra', indizio: 'i1', a: 'ub' });
    await new Promise(r => setTimeout(r, 3));
    await B.REGIA.chiedi(C, { t: 'voto', chi: 'ua' });
    ck((await no(E.REGIA.chiedi(C, { t: 'voto', chi: 'ua' }))) === 'PERMISSION_DENIED', 'client: Eve non chiede');
    const az = await T.REGIA.leggiAzioni(C);
    ck(
      az.length === 2 && az[0].uid === 'ua' && az[0].a.t === 'mostra' && az[1].uid === 'ub',
      'client: richieste in ordine'
    );
    ck((await no(B.REGIA.leggiAzioni(C))) === 'PERMISSION_DENIED', 'client: Bob non legge le richieste altrui');
    await T.REGIA.consuma(C, 'ua', id1);
    ck((await T.REGIA.leggiAzioni(C)).length === 1, 'client: la TV consuma una richiesta');

    // chiavi sporche fermate prima di arrivare al database
    ck((await no(T.REGIA.consegna(C, 'ua', '../d', {}))) === 'chiave non valida', 'client: chiave non valida');

    // TV morta: Bob libera il ruolo, una seconda TV lo prende
    await B.REGIA.libera(C);
    const T2 = conRegia(db.cliente('tv2', 'ut2'));
    ck((await T2.REGIA.prendi(C)) === 'ut2', 'client: TV morta, Bob libera, una nuova TV prende la regia');
    ck((await no(T.REGIA.salva(C, { x: 1 }))) === 'PERMISSION_DENIED', 'client: la vecchia TV non scrive più');
    ck((await T2.REGIA.carica(C)).kit === 'villa', 'client: la nuova TV riprende lo stato della serata');

    await T2.REGIA.pulisci(C);
    ck(
      ![...db.store.keys()].some(k => /^(segreti|azioni|regia)\//.test(k)),
      'client: a fine serata non resta nessun segreto'
    );
    await T2.REGIA.lascia(C);
    ck(!db.store.has(S + 'r'), 'client: la TV lascia la regia');
  }

  console.log(fails ? fails + ' CONTROLLI FALLITI' : 'ALL OK');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.log('ECCEZIONE', e);
  process.exit(2);
});
