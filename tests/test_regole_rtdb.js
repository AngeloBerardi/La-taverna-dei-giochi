// Regole del Realtime Database (database.rules.json): chi può leggere/scrivere cosa, e il vero client (RT) che ci gira sopra.
// Le regole sono valutate da tests/regole_rtdb.js (interprete); l'emulatore di Firebase non è scaricabile in questo ambiente.
const carica = require('./carica.js'), R = require('./regole_rtdb.js'), { creaDb, DIST } = require('./rtdb_finto.js');
const SYNC = carica('35-sync.js', 'SYNC');
let fails = 0; const ck = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const regole = R.carica(), CODE = 'ABCD';
const mem = (n) => ({ j: JSON.stringify({ name: n }), t: 1 });
const doc = rev => ({ j: JSON.stringify({ phase: 'lobby', rev }), rev, t: 1 });

// archivio piatto di partenza: stanza con Alice (uid ua, dev da) dentro
const base = () => new Map([
  ['stanze/' + CODE + '/d', doc(0)], ['stanze/' + CODE + '/dv/da', 'ua'], ['stanze/' + CODE + '/k/ua', true],
  ['stanze/' + CODE + '/m/da', mem('Alice')], ['stanze/' + CODE + '/p/da', { t: 1 }]]);
const prova = (piatto, p, v, uid) => R.puoScrivere(regole, R.albero(piatto), p, v, uid).ok;
const S = 'stanze/' + CODE + '/';

(async () => {
  // ---- A) regole una per una (interprete) ----
  {
    const b = base();
    ck(R.puoLeggere(regole, R.albero(b), S + 'd', 'ub').ok, 'lettura: un profilo autenticato legge la stanza (serve per entrare)');
    ck(!R.puoLeggere(regole, R.albero(b), S + 'd', null).ok, 'lettura: senza accesso, negata');
    ck(!R.puoLeggere(regole, R.albero(b), 'stanze', 'ub').ok, 'lettura: l’elenco di tutte le stanze non si legge');
    ck(!R.puoLeggere(regole, R.albero(b), '', 'ub').ok, 'lettura: la radice non si legge');
    ck(prova(new Map(), S + 'd', doc(0), 'ub'), 'stanza nuova: la crea chiunque abbia fatto l’accesso');
    ck(!prova(new Map(), S + 'd', doc(0), null), 'stanza nuova: senza accesso, negato');
    ck(!prova(b, S + 'd', doc(1), 'ub'), 'stanza esistente: chi non è dentro non la scrive');
    ck(prova(b, S + 'd', doc(1), 'ua'), 'stanza esistente: chi è dentro la scrive, rev +1');
    ck(!prova(b, S + 'd', doc(0), 'ua'), 'stanza esistente: la rev non può restare uguale');
    ck(!prova(b, S + 'd', null, 'ua'), 'stanza esistente: nessuno la cancella');
    ck(!prova(b, S + 'd', { j: 'x'.repeat(900001), rev: 5 }, 'ua'), 'stanza: oltre 900000 caratteri, negata');
    ck(!prova(b, S + 'd', { j: 5, rev: 5 }, 'ua'), 'stanza: j deve essere testo');
    ck(!prova(b, S + 'dv/db', 'ua', 'ub'), 'legame dispositivo: nessuno lega un dispositivo al profilo di un altro');
    ck(prova(b, S + 'dv/db', 'ub', 'ub'), 'legame dispositivo: ognuno lega il proprio');
    ck(!prova(b, S + 'dv/da', 'ub', 'ub'), 'legame dispositivo: un dispositivo già legato non si ruba');
    ck(prova(b, S + 'dv/da', 'ua', 'ua'), 'legame dispositivo: chi lo possiede può riscriverlo uguale');
    ck(!prova(b, S + 'dv/' + 'x'.repeat(65), 'ub', 'ub'), 'legame dispositivo: nome troppo lungo');
    ck(prova(b, S + 'k/ub', true, 'ub') && !prova(b, S + 'k/ub', true, 'uc'), 'ingresso in stanza: solo per sé');
    ck(prova(b, S + 'm/da', mem('A2'), 'ua'), 'membro: il proprietario del dispositivo scrive il proprio');
    ck(!prova(b, S + 'm/da', mem('Falso'), 'ub'), 'membro: nessuno scrive al posto di un altro');
    ck(!prova(b, S + 'm/db', mem('B'), 'ub'), 'membro: senza legame al dispositivo, negato');
    ck(!prova(b, S + 'm/da', { j: 'x'.repeat(20001), t: 1 }, 'ua'), 'membro: oltre 20000 caratteri, negato');
    ck(prova(b, S + 'm/da', null, 'ua'), 'membro: esce chi è lui');
    const b2 = base(); b2.set(S + 'dv/db', 'ub'); b2.set(S + 'k/ub', true); b2.set(S + 'm/db', mem('Bob'));
    ck(prova(b2, S + 'm/db', null, 'ua'), 'membro: chi è dentro può togliere un altro (pulsante «x» della lobby)');
    ck(!prova(b2, S + 'm/db', null, 'uc'), 'membro: chi è fuori non può togliere nessuno');
    ck(prova(b, S + 'p/da', { t: 5 }, 'ua') && !prova(b, S + 'p/da', { t: 5 }, 'ub'), 'presenza: solo del proprio dispositivo');
    ck(!prova(b, S + 'c/1', { j: '{}' }, 'ub') && prova(b, S + 'c/1', { j: '{}' }, 'ua'), 'chat: solo chi è dentro');
    ck(!prova(b, S + 'c/1', { j: 'x'.repeat(4001) }, 'ua'), 'chat: oltre 4000 caratteri, negato');
    ck(prova(b, S + 'pos/da', { j: '{"x":1}', t: 1 }, 'ua') && !prova(b, S + 'pos/da', { j: '{"x":1}', t: 1 }, 'ub'), 'posizione: solo del proprio dispositivo');
    ck(!prova(b, S + 'pos/da', { j: 'x'.repeat(401), t: 1 }, 'ua'), 'posizione: oltre 400 caratteri, negata');
    ck(prova(b, 'errori/1-x', { t: 1, m: 'boom' }, 'ub') && !prova(b, 'errori/1-x', { t: 1, m: 'boom' }, null), 'errori: li scrive chi è autenticato, nessun accesso senza');
    ck(!prova(b, 'errori/1-x', { t: 1, m: 'x'.repeat(201) }, 'ub') && !R.puoLeggere(regole, R.albero(b), 'errori', 'ub').ok, 'errori: messaggio troppo lungo negato, lettura negata');
    ck(!prova(b, S + 'altro', 1, 'ua') && !prova(b, 'fuori', 1, 'ua'), 'chiavi non previste: negate');
  }

  // ---- B) il vero client RT contro le regole ----
  {
    const db = creaDb(7, { regole: true, ms: 3 }), A = db.cliente('da', 'ua'), B = db.cliente('db', 'ub'), E = db.cliente('de', 'ue');
    const crea = (c) => c.RT.setRoom(CODE, { phase: 'lobby', host: c.ME.dev, rev: 0, s: null });
    await crea(A);
    ck(db.leggi(CODE).rev === 0, 'client: Alice crea la stanza');
    await A.RT.setMem(['stanze', CODE, 'm', 'da'], { name: 'Alice' });
    await new Promise(r => setTimeout(r, 60)); // la presenza si scrive in coda, senza aspettarla
    ck(db.store.get(S + 'dv/da') === 'ua' && db.store.get(S + 'k/ua') === true && db.store.has(S + 'p/da'), 'client: ingresso = legame dispositivo, ingresso in stanza, membro e presenza');
    await B.RT.setMem(['stanze', CODE, 'm', 'db'], { name: 'Bob' });
    // Eve non è entrata: non può toccare la stanza né scrivere nel nome di altri
    let err = await E.RT.setRoom(CODE, { phase: 'play', rev: 9 }).then(() => null, e => e.code);
    ck(err === 'PERMISSION_DENIED' || err === 'conflitto', 'client: chi non è dentro non scrive la stanza (' + err + ')');
    err = await E.RT.transactRoom(CODE, cur => ({ ...cur, rev: cur.rev + 1, phase: 'play' })).then(() => null, e => e.code);
    ck(err === 'PERMISSION_DENIED', 'client: nemmeno con una transazione (' + err + ')');
    err = await E.RT.m.set(E.RT.ref(['stanze', CODE, 'm', 'da']), mem('Eve')).then(() => null, e => e.code);
    ck(err === 'PERMISSION_DENIED', 'client: Eve non scrive il membro di Alice');
    ck(JSON.parse(db.store.get(S + 'm/da').j).name === 'Alice' || db.store.get(S + 'm/da').j.includes('Alice'), 'client: il membro di Alice è intatto');
    // Eve prova a rubare il dispositivo di Alice: il client prende un dispositivo nuovo e si siede da sola
    E.ME.dev = 'da';
    await E.RT.setMem(['stanze', CODE, 'm', 'da'], { name: 'Eve' });
    ck(E.ME.dev !== 'da' && db.store.get(S + 'dv/da') === 'ua', 'client: dispositivo già legato a un altro profilo -> ne prende uno nuovo (' + E.ME.dev + ')');
    ck(db.store.has(S + 'm/' + E.ME.dev) && JSON.parse(db.store.get(S + 'm/da').j).name === 'Alice', 'client: Eve compare col dispositivo nuovo, Alice resta com’era');
    // una mossa vera da parte di chi è dentro, e il tentativo di far tornare indietro la versione
    const ok = await SYNC.esegui(B.RT.doc('rooms/' + CODE), cur => ({ doc: { ...cur, phase: 'lobby', rev: cur.rev + 1 } }));
    ck(ok.doc && db.leggi(CODE).rev === 1, 'client: Bob (dentro) scrive la stanza');
    err = await B.RT.m.set(B.RT.ref(['stanze', CODE, 'd']), { j: '{"rev":0}', rev: 0, t: 1 }).then(() => null, e => e.code);
    ck(err === 'PERMISSION_DENIED' && db.leggi(CODE).rev === 1, 'client: far tornare indietro la rev è negato');
    err = await B.RT.m.remove(B.RT.ref(['stanze', CODE, 'd'])).then(() => null, e => e.code);
    ck(err === 'PERMISSION_DENIED' && db.leggi(CODE) !== null, 'client: cancellare la stanza è negato');
    // rimozione di un altro (pulsante x) e chat
    await B.RT.doc('rooms/' + CODE + '/chat/1_a').set({ dev: 'db', name: 'Bob', text: 'ciao', t: 1 });
    ck(db.store.has(S + 'c/1_a'), 'client: Bob scrive in chat');
    err = await E.RT.m.set(E.RT.ref(['stanze', CODE, 'c', '2_b']), { j: '{}' }).then(() => null, e => e.code);
    ck(err === undefined || err === null, 'client: Eve ora è dentro e può scrivere in chat');
    err = await new Promise(r => { const X = db.cliente('dx', 'ux'); X.RT.m.set(X.RT.ref(['stanze', CODE, 'c', '3_c']), { j: '{}' }).then(() => r(null), e => r(e.code)); });
    ck(err === 'PERMISSION_DENIED', 'client: un estraneo non scrive in chat');
    await A.RT.del(['stanze', CODE, 'm', 'db']);
    ck(!db.store.has(S + 'm/db'), 'client: Alice toglie Bob (pulsante x)');
    // le posizioni vanno nel nodo a parte e il membro non le contiene
    await A.RT.doc('rooms/' + CODE + '/pos/da').set({ a: 'loc', x: 1.5, z: 2, sit: false, t: 1 });
    ck(db.store.has(S + 'pos/da') && !db.store.get(S + 'm/da').j.includes('pos3'), 'client: la posizione sta in pos/, non nel membro');
    await A.RT.setMem(['stanze', CODE, 'm', 'da'], { name: 'Alice', pos3: { x: 9 } });
    ck(!db.store.get(S + 'm/da').j.includes('pos3'), 'client: scrivendo il membro la posizione viene tolta');
    err = await B.RT.m.set(B.RT.ref(['stanze', CODE, 'pos', 'da']), { j: '{}', t: 1 }).then(() => null, e => e.code);
    ck(err === 'PERMISSION_DENIED', 'client: nessuno sposta il pupazzo di un altro');
    // presenza: quando un telefono perde la linea il server toglie la sua presenza; gli altri possono togliere il suo membro
    ck(db.store.has(S + 'p/da'), 'presenza: Alice presente');
    db.scollega(A);
    ck(!db.store.has(S + 'p/da'), 'presenza: la linea cade, il server toglie la presenza (onDisconnect registrato con i permessi giusti)');
  }

  // ---- C) la stessa partita intera in parallelo di test_sync, ma sotto le regole ----
  {
    const MIND = require('../src/js/motori/11-the-mind.js'), ENG = { mind: MIND };
    const db = creaDb(33, { regole: true, ms: 4 }), N = 3, cl = Array.from({ length: N }, (_, i) => db.cliente('d' + i, 'u' + i));
    await cl[0].RT.setRoom(CODE, { host: 'd0', t: 0, phase: 'lobby', game: null, opts: {}, seats: [], s: null, rev: 0 });
    for (let i = 0; i < N; i++) await cl[i].RT.setMem(['stanze', CODE, 'm', 'd' + i], { name: 'P' + i });
    MIND.setRnd(carica.rng(3)); const s = MIND.newGame(N, ['a', 'b', 'c'], {});
    const av = await SYNC.esegui(cl[1].RT.doc('rooms/' + CODE), cur => SYNC.partita(cur, { patch: { phase: 'play', game: 'mind', opts: {}, seats: [], s: Object.assign(s, { g: 'mind', gid: 'g1' }) } }));
    ck(av.doc && db.leggi(CODE).phase === 'play', 'partita sotto regole: avviata da un membro');
    const sl = ms => new Promise(r => setTimeout(r, ms)); let giri = 0, errore = null; const ok = Array(N).fill(0);
    await Promise.all(cl.map(async (c, i) => {
      while (giri++ < 4000 && !errore) {
        const d = c.doc(CODE); if (!d || !d.s) { await sl(2); continue; } const st = d.s; if (st.over) return;
        let a = null;
        if (st.phase === 'ready' && !st.ready[i]) a = { t: 'ready', seat: i };
        else if (st.phase === 'summary' && i === 0) a = { t: 'next', seat: 0 };
        else if (st.phase === 'play') { const k = MIND.lowest(st, i, 'n'); if (k != null) a = { t: 'play', seat: i, col: 'n' }; }
        if (!a) { await sl(2); continue; }
        const r0 = MIND.act(st, a); if (r0.err) { await sl(2); continue; }
        try { const e = await SYNC.esegui(c.RT.doc('rooms/' + CODE), x => SYNC.mossa(x, { base: d.rev, gid: 'g1', a, s: r0.s }, ENG)); if (e.doc) ok[i]++; else await sl(2); }
        catch (e) { errore = e; }
      }
    }));
    const fin = db.leggi(CODE), tot = ok.reduce((x, y) => x + y, 0);
    ck(!errore && fin.s.over, 'partita sotto regole: conclusa' + (errore ? ' (' + errore.message + ')' : ''));
    ck(fin.rev === 1 + tot, 'partita sotto regole: rev coerente (' + fin.rev + ' = 1 + ' + tot + ')');
    ck(db.negati.length === 0, 'partita sotto regole: nessuna scrittura legittima negata ' + JSON.stringify(db.negati.slice(0, 2)));
  }
  console.log(fails ? fails + ' CONTROLLI FALLITI' : 'ALL OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ECCEZIONE', e); process.exit(2); });
