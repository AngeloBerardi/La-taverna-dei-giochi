// Racconto (A7): condizioni, effetti, prove con probabilità esatta, scene del capitolo di prova, determinismo, riassunto e validatore.
const assert = require('assert');
const { eroe, copia } = require('./avv_aiuti.js');
const E = require('../src/js/motori/27-eroi.js');
const R = require('../src/js/motori/27q-avv-racconto.js');
const CM = require('../src/js/motori/27p-avv-compagni.js');
const cap = require('../src/avventura/prova.json');

const gruppo = (...cl) => cl.map((c, i) => Object.assign(eroe(c, 3, ['umano', 'elfo', 'nano', 'piccolo'][i]), { slot: 'e' + (i + 1) }));
const ctxDi = (eroi, o) => Object.assign({ eroi, oro: 50, perdizione: 0, giorno: 1, posti: undefined }, o || {});
const A = (s, a, ctx) => { const r = R.act(s, a, cap, ctx); assert(!r.err, JSON.stringify(a) + ' → ' + r.err); return r; };

// ---- il capitolo di prova è valido ----
assert.deepStrictEqual(R.valida(cap), [], 'il capitolo di prova è valido');

// ---- il validatore trova gli errori che deve trovare ----
const guasto = (f) => { const c = copia(cap); f(c); return R.valida(c).join(' | '); };
const trova = (f, re, msg) => assert(re.test(guasto(f)), msg + ' → ' + guasto(f));
trova(c => { c.scene.pozzo.nodi.b.scelte[2].vai = 'nonce'; }, /«nonce», che non esiste/, 'nodo mancante');
trova(c => { c.scene.pozzo.nodi.zzz = { chi: '_', testo: 'Isolato.', fine: true }; }, /nodo zzz: non si raggiunge mai/, 'nodo irraggiungibile');
trova(c => { const N = c.scene.pozzo.nodi; N.x = { chi: '_', testo: 'Un giro.', scelte: [{ t: 'Di là', vai: 'y' }] }; N.y = { chi: '_', testo: 'Un altro giro.', scelte: [{ t: 'Di qua', vai: 'x' }] }; N.b.scelte[2].vai = 'x'; }, /nodo x: vicolo cieco/, 'vicolo cieco (due nodi che si rimandano a vicenda)');
trova(c => { c.scene.pozzo.nodi.b.scelte.forEach(x => { x.se = { bandiera: 'pozzo-indizio' }; delete x.una; }); }, /nessuna scelta sempre disponibile/, 'scelte tutte condizionate');
trova(c => { c.scene.pozzo.nodi.a.vai = 'b'; c.scene.pozzo.nodi.a.fine = true; }, /più di una uscita|esattamente una uscita/, 'due uscite');
trova(c => { delete c.scene.pozzo.nodi.a.vai; }, /esattamente una uscita/, 'nessuna uscita');
trova(c => { c.scene.pozzo.nodi.a.testo = 'x'.repeat(R.MAX_TESTO + 1); }, /testo troppo lungo/, 'testo troppo lungo');
trova(c => { c.scene.pozzo.nodi.a.chi = 'sconosciuto'; }, /personaggio sconosciuto/, 'personaggio');
trova(c => { c.scene.pozzo.nodi.b.scelte[0].prova.cd = 40; }, /la difficoltà va da/, 'difficoltà');
trova(c => { c.scene.pozzo.nodi.b.scelte[0].prova.ab = 'canto'; }, /abilità sconosciuta/, 'abilità');
trova(c => { delete c.scene.pozzo.nodi.b.scelte[0].prova.ko; }, /manca «ko»/, 'prova senza esito negativo');
trova(c => { c.scene.pozzo.nodi.corda.effetti.push({ t: 'oggetto', id: 'spada-del-nulla' }); }, /«oggetto» riferisce «spada-del-nulla»/, 'oggetto inesistente');
trova(c => { c.scene.pozzo.nodi.corda.effetti.push({ t: 'battaglia', fam: 'draghi' }); }, /famiglia sconosciuta/, 'famiglia');
trova(c => { c.scene.pozzo.nodi.corda.effetti.push({ t: 'battaglia', capo: 'lupo-grigio' }); }, /capo sconosciuto/, 'capo (il lupo non lo è)');
trova(c => { c.scene.pozzo.nodi.corda.effetti.push({ t: 'sposta', id: 'luna' }); }, /«sposta» riferisce «luna»/, 'luogo');
trova(c => { c.scene.pozzo.nodi.corda.effetti.push({ t: 'approv', id: 'tizio', n: 1 }); }, /«approv» riferisce «tizio»/, 'compagno');
trova(c => { c.scene.pozzo.nodi.corda.effetti.push({ t: 'incanta' }); }, /effetto sconosciuto/, 'tipo di effetto');
trova(c => { c.scene.pozzo.nodi.b.scelte[1].se = { bandiera: 'mai-impostata' }; }, /«mai-impostata» viene letta ma non è mai impostata/, 'bandiera letta e mai impostata');
trova(c => { c.scene.pozzo.nodi.b.scelte[1].se = { classe: 'pirata' }; }, /classe sconosciuta/, 'classe');
trova(c => { c.scene.pozzo.nodi.b.scelte[1].se = { colore: 'rosso' }; }, /condizione sconosciuta/, 'condizione');
trova(c => { c.scene.isolata = { inizio: 'a', nodi: { a: { chi: '_', testo: 'Nessuno ci arriva.', fine: true } } }; }, /scena isolata: non è raggiungibile/, 'scena irraggiungibile');
trova(c => { c.compagni.ilda.addio = 'non-esiste'; }, /la scena «non-esiste» non esiste/, 'scena di congedo');
trova(c => { c.compagni.ilda.base = { for: 15, des: 15, cos: 15, int: 15, sag: 15, car: 15 }; }, /servono \d+ punti/, 'scheda del compagno oltre il budget');
trova(c => { c.compagni.ilda.valori.pieta = 9; }, /da -3 a 3/, 'valore di tono');
trova(c => { c.missioni.voce.ricompensa.push({ t: 'oro', n: 1.5 }); }, /vuole n intero/, 'numero intero');
trova(c => { delete c.scene.pozzo.titolo; }, /vuole il «titolo»/, 'scena di un luogo senza titolo');
// ---- il mondo del capitolo (mappa scritta a mano) ----
const conMondo = (f) => (c) => { c.mondo = { regioni: [{ nome: 'A', terreno: 'pianura', fam: 'banditi' }, { nome: 'B', terreno: 'palude', fam: 'nonmorti' }, { nome: 'C', terreno: 'bosco', fam: 'bestie' }], partenza: { id: 'valcorvo', tipo: 'citta', nome: 'Valcorvo' },
  luoghi: [{ id: 'casale', tipo: 'villaggio', nome: 'Il Casale', reg: 0, dmin: 2, dmax: 4 }, { id: 'rocca', tipo: 'citta', nome: 'La Rocca', reg: 1, dmin: 4, dmax: 8 }] }; f(c.mondo, c); };
assert.deepStrictEqual(R.valida(Object.assign(copia(cap), { mondo: undefined })), [], 'senza mondo resta valido');
assert.strictEqual(guasto(conMondo(() => { })), '', 'un mondo ben fatto è valido');
trova(conMondo(m => { m.luoghi[0].tipo = 'zzz'; }), /tipo sconosciuto «zzz»/, 'tipo di luogo');
trova(conMondo(m => { m.luoghi[1].id = 'casale'; }), /ripetuto/, 'id ripetuto');
trova(conMondo(m => { delete m.luoghi[1].id; }), /id mancante/, 'id mancante');
trova(conMondo(m => { m.regioni[1].terreno = 'acqua'; }), /non calpestabile/, 'terreno che non si cammina');
trova(conMondo(m => { m.regioni[0].fam = 'draghi'; }), /famiglia sconosciuta/, 'famiglia di mostri');
trova(conMondo(m => { m.partenza.tipo = 'torre'; }), /luogo sicuro/, 'partenza non sicura');
trova(conMondo(m => { m.luoghi[1].reg = 7; }), /indice da 0 a 2/, 'regione fuori scala');
trova(conMondo(m => { m.luoghi[1].dmin = 1; m.luoghi[1].dmax = 1; }), /non cade nella regione/, 'luogo che non sta nella sua regione');
trova(conMondo((m, c) => { c.scene.pozzo.dove = 'rocca'; }), /^$/, 'un luogo del mondo vale per «dove»');
trova(conMondo((m, c) => { c.scene.pozzo.dove = 'nonce'; }), /«dove» riferisce il luogo «nonce»/, '«dove» con luogo sconosciuto');
trova(conMondo((m, c) => { c.scene.pozzo.nodi.a.effetti = [{ t: 'sposta', id: 'rocca' }]; }), /^$/, 'sposta verso un luogo del mondo');
assert.strictEqual(R.valida(null)[0], 'capitolo mancante');

// ---- condizioni ----
{
  const eroi = gruppo('mago', 'guerriero'); eroi[1].zaino.push('pozione-cura'); eroi[0].liv = 3; eroi[1].liv = 4;
  const s = R.nuovo('prova', 1), ctx = ctxDi(eroi, { luogo: 'pozzo', perdizione: 30, giorno: 4 });
  s.bandiere.visto = true; s.bandiere.indizi = 3; s.approv.ilda = 25; s.missioni.voce = { stato: 'attiva' }; s.compagni.ilda = { stato: 'gruppo' };
  const sì = c => assert(R.cond(c, s, ctx), JSON.stringify(c) + ' dovrebbe valere'), no = c => assert(!R.cond(c, s, ctx), JSON.stringify(c) + ' non dovrebbe valere');
  sì(null); sì(true); no(false); sì('visto'); no('assente'); sì({ bandiera: 'visto' }); no({ bandiera: 'altro' });
  sì({ valore: 'indizi', min: 3 }); no({ valore: 'indizi', min: 4 }); sì({ valore: 'indizi', max: 3 }); sì({ valore: 'zero', max: 0 });
  sì({ non: { bandiera: 'altro' } }); sì({ e: [{ bandiera: 'visto' }, { classe: 'mago' }] }); no({ e: [{ bandiera: 'visto' }, { classe: 'bardo' }] });
  sì({ o: [{ classe: 'bardo' }, { razza: 'elfo' }] }); no({ o: [{ classe: 'bardo' }, { razza: 'orco' }] });
  sì([{ bandiera: 'visto' }, { razza: 'nano' }].slice(0, 1)); no([{ bandiera: 'visto' }, { classe: 'bardo' }]);
  sì({ classe: 'guerriero' }); sì({ razza: 'umano' }); no({ razza: 'piccolo' });
  sì({ oggetto: 'pozione-cura' }); no({ oggetto: 'chiave' }); sì({ oggetto: 'spada-lunga' });   // anche l'equipaggiamento conta
  sì({ livello: 3 }); no({ livello: 4 });                      // media 3,5 → 3
  sì({ compagno: 'ilda' }); no({ compagno: 'altro' }); sì({ approv: 'ilda', min: 20 }); no({ approv: 'ilda', min: 26 }); sì({ approv: 'ilda', max: 25 });
  sì({ missione: 'voce' }); no({ missione: 'voce', stato: 'fatta' }); sì({ missione: 'sconosciuta', stato: 'nessuna' });
  sì({ oro: 50 }); no({ oro: 51 }); sì({ perdizione: 25 }); no({ perdizione: 25, max: 29 }); sì({ giorno: 4 }); no({ giorno: 5 }); sì({ luogo: 'pozzo' }); no({ luogo: 'altrove' });
  assert.throws(() => R.cond({ colore: 1 }, s, ctx), /sconosciuta/);
}

// ---- etichette delle scelte ----
{
  const eroi = gruppo('mago', 'esploratore'), ctx = ctxDi(eroi), s = R.nuovo('prova', 7);
  const b = cap.scene.pozzo.nodi.b.scelte;
  const pm = Math.max(...eroi.map(h => E.probabilita(h, 'percezione', 12)));
  assert.strictEqual(R.etichetta(b[0], s, ctx), 'Percezione ' + Math.round(pm * 100) + '%', 'la prova mostra la probabilità del migliore');
  assert.strictEqual(R.etichetta(b[1], s, ctx), 'Solo Mago');
  assert.strictEqual(R.etichetta(b[2], s, ctx), '');
  assert.strictEqual(R.etichetta({ t: 'x', effetti: [{ t: 'oro', n: -20 }] }, s, ctx), '20 monete');
  assert.strictEqual(R.etichetta({ t: 'x', se: { razza: 'nano' } }, s, ctx), 'Solo Nano');
  assert.strictEqual(R.etichetta({ t: 'x', se: { e: [{ oggetto: 'pozione-cura' }] } }, s, ctx), 'Con Pozione di cura');
  assert.strictEqual(R.etichetta({ t: 'x', etichetta: 'A modo mio' }, s, ctx), 'A modo mio');
  const chi = R.chiTira(ctx, { ab: 'percezione', cd: 12 }); assert.strictEqual(chi.h.classe, 'esploratore', 'tira chi ha più probabilità'); assert(Math.abs(chi.p - pm) < 1e-9);
  assert.strictEqual(R.chiTira(ctx, { ab: 'percezione', cd: 12, chi: 'e1' }).h.classe, 'mago', '«chi» sceglie chi tira');
  assert.strictEqual(R.chiTira(ctxDi([]), { ab: 'percezione', cd: 12 }), null, 'nessuno in piedi, nessuna prova');
  eroi[1].hp = 0; assert.strictEqual(R.chiTira(ctx, { ab: 'percezione', cd: 12 }).h.classe, 'mago', 'chi è a terra non tira');
  assert(R.probDi(eroi[0], { ab: 'arcano', cd: 15, vant: true }) > R.probDi(eroi[0], { ab: 'arcano', cd: 15 }), 'il vantaggio conta');
}

// ---- la scena del pozzo, a mano ----
{
  const eroi = gruppo('mago', 'guerriero'), ctx = ctxDi(eroi);
  let s = R.nuovo('prova', 11);
  assert.strictEqual(R.vista(s, cap, ctx), null, 'nessuna scena, nessuna vista');
  assert.deepStrictEqual(R.disponibili(cap, s, ctx, 'pozzo'), ['pozzo'], 'al pozzo si può avviare la scena');
  assert.deepStrictEqual(R.disponibili(cap, s, ctx, 'villaggio'), [], 'altrove no');
  assert(R.act(s, { t: 'continua' }, cap, ctx).err, 'senza scena non si continua');
  assert(R.act(s, { t: 'avvia', id: 'nonce' }, cap, ctx).err, 'scena sconosciuta');
  const r0 = A(s, { t: 'avvia', id: 'pozzo' }, ctx); s = r0.s;
  assert.strictEqual(s.missioni.voce.stato, 'attiva', 'l\'effetto del primo nodo scatta all\'avvio');
  assert(R.act(s, { t: 'avvia', id: 'pozzo' }, cap, ctx).err, 'una scena alla volta');
  let v = R.vista(s, cap, ctx);
  assert.strictEqual(v.chi.id, '_'); assert.strictEqual(v.continua, 'Continua'); assert.strictEqual(v.scelte.length, 0);
  assert(R.act(s, { t: 'scegli', i: 0 }, cap, ctx).err, 'dove non ci sono scelte non si sceglie');
  s = A(s, { t: 'continua' }, ctx).s; v = R.vista(s, cap, ctx);
  assert.strictEqual(v.nodo, 'b'); assert.strictEqual(v.scelte.length, 4, 'con un mago le scelte sono quattro');
  assert.deepStrictEqual(v.scelte.map(x => x.etichetta), [v.scelte[0].etichetta, 'Solo Mago', '', ''], 'etichette');
  assert(/^Percezione \d+%$/.test(v.scelte[0].etichetta));
  assert(R.act(s, { t: 'continua' }, cap, ctx).err, 'dove ci sono scelte non si continua');
  assert(R.act(s, { t: 'scegli', i: 9 }, cap, ctx).err, 'scelta fuori elenco');
  // senza mago la scelta del mago sparisce
  const senza = gruppo('guerriero', 'ladro'), vs = R.vista(s, cap, ctxDi(senza));
  assert.strictEqual(vs.scelte.length, 3, 'senza mago le scelte sono tre'); assert(R.act(s, { t: 'scegli', i: 1 }, cap, ctxDi(senza)).err, 'e non si può sceglierla comunque');
  // la scelta del mago: luce → corda → Ilda
  s = A(s, { t: 'scegli', i: 1 }, ctx).s; assert.strictEqual(s.bandiere['luce-nel-pozzo'], true); assert.strictEqual(R.vista(s, cap, ctx).nodo, 'luce');
  const rc = A(s, { t: 'continua' }, ctx); s = rc.s; assert.strictEqual(R.vista(s, cap, ctx).nodo, 'corda');   // gli effetti del nodo scattano quando ci si entra
  assert.strictEqual(s.missioni.voce.stato, 'fatta');
  assert(rc.fuori.some(f => f.t === 'oro' && f.n === 30) && rc.fuori.some(f => f.t === 'xp' && f.n === 25), 'la ricompensa della missione va all\'orchestratore: ' + JSON.stringify(rc.fuori));
  s = A(s, { t: 'continua' }, ctx).s;
  v = R.vista(s, cap, ctx); assert.strictEqual(v.chi.id, 'ilda'); assert.strictEqual(v.chi.nome, 'Ilda'); assert(/vi devo la vita, \w+\./i.test(v.testo) && !/\{eroe\}/.test(v.testo), 'il segnaposto {eroe}: ' + v.testo);
  assert.strictEqual(v.scelte.length, 3);
  const rr = A(s, { t: 'scegli', i: 0 }, ctx); s = rr.s;
  assert.deepStrictEqual(rr.fuori, [{ t: 'compagno', id: 'ilda', azione: 'entra' }]);
  assert.strictEqual(CM.stato(s, 'ilda'), 'gruppo'); assert.strictEqual(s.approv.ilda, 10 + 8, 'approvazione: +10 dell\'effetto, +8 per «pietà» (2×4)');
  assert.strictEqual(rr.s.reazioni.length, 1); assert.strictEqual(rr.s.reazioni[0].nome, 'Ilda'); assert.strictEqual(rr.s.reazioni[0].n, 8);
  assert.strictEqual(R.vista(rr.s, cap, ctx).nodo, 'ok');
  const fine = A(s, { t: 'continua' }, ctx);
  assert.strictEqual(fine.esito, 'compagna'); assert.strictEqual(fine.s.scena, null); assert.strictEqual(fine.s.fatte.pozzo, 1);
  assert.deepStrictEqual(R.disponibili(cap, fine.s, ctx, 'pozzo'), [], 'la scena «una» non si ripete');
  assert.strictEqual(s.evn < fine.s.evn, true);
}

// ---- la prova: l'esito dipende dal dado dello stato, riproducibile; le frequenze seguono la probabilità ----
{
  const eroi = gruppo('guerriero', 'ladro'), ctx = ctxDi(eroi), p = cap.scene.pozzo.nodi.b.scelte[0].prova;
  const prob = Math.max(...eroi.map(h => R.probDi(h, p)));
  const parti = seme => { let s = R.nuovo('prova', seme); s = A(s, { t: 'avvia', id: 'pozzo' }, ctx).s; return A(s, { t: 'continua' }, ctx).s; };
  const riuscite = []; let ok = 0; const N = 600;
  for (let seme = 1; seme <= N; seme++) {
    const s = parti(seme), r1 = A(s, { t: 'scegli', i: 0 }, ctx), r2 = A(s, { t: 'scegli', i: 0 }, ctx);
    assert.deepStrictEqual(r1.s, r2.s, 'stesso seme, stessa prova'); const u = r1.s.ultima; assert.strictEqual(u.ok, u.tiro === 20 || (u.tiro !== 1 && u.tot >= p.cd), 'esito coerente con il tiro');
    if (r1.s.ultima.ok) { ok++; assert.strictEqual(r1.s.scena.nodo, 'corda'); assert(r1.s.bandiere['pozzo-indizio']); assert(/cavità laterale/.test(r1.s.scena.nota.testo)); }
    else { assert.strictEqual(r1.s.scena.nodo, 'b'); assert(!r1.s.bandiere['pozzo-indizio']); riuscite.push(seme); }
    assert.strictEqual(r1.s.ultima.cd, 12); assert(r1.s.ultima.p > 0 && r1.s.ultima.p < 1);
  }
  assert(Math.abs(ok / N - prob) < .06, `frequenza ${ok / N} contro probabilità ${prob}`);
  // dopo un fallimento la scelta «una» non c'è più, il nodo è lo stesso
  const s = parti(riuscite[0]), r = A(s, { t: 'scegli', i: 0 }, ctx), v = R.vista(r.s, cap, ctx);
  assert.strictEqual(v.nodo, 'b'); assert(!v.scelte.some(x => x.prova), 'la prova già tentata sparisce'); assert(R.act(r.s, { t: 'scegli', i: 0 }, cap, ctx).err, 'e non si può rifare');
  assert.strictEqual(v.nota.prova.ok, false); assert(/Troppa eco/.test(v.nota.testo));
  // l'azione non tocca lo stato che riceve
  const prima = JSON.stringify(s); R.act(s, { t: 'scegli', i: 2 }, cap, ctx); assert.strictEqual(JSON.stringify(s), prima, 'lavora su una copia');
  // nessuno in piedi: la prova non si può tentare
  assert(R.act(s, { t: 'scegli', i: 0 }, cap, ctxDi([])).err, 'senza eroi in piedi niente prova');
}

// ---- rifiutare, pagare, chiedere ----
{
  const eroi = gruppo('guerriero', 'ladro'), ctx = ctxDi(eroi);
  const sceglie = (seme, nodo, i, c) => { let s = R.nuovo('prova', seme); s = A(s, { t: 'avvia', id: 'pozzo' }, c || ctx).s; for (const x of nodo) s = x === 'c' ? A(s, { t: 'continua' }, c || ctx).s : A(s, { t: 'scegli', i: x }, c || ctx).s; return s; };
  // ignorare la voce: fine «ignorata», missione fallita, e Ilda non c'è (la scena finisce)
  const senza = R.vista(sceglie(3, ['c']), cap, ctx).scelte; assert.deepStrictEqual(senza.map(x => x.i), [0, 2, 3]);
  const ig = A(sceglie(3, ['c']), { t: 'scegli', i: 3 }, ctx);
  assert.strictEqual(ig.esito, 'ignorata'); assert.strictEqual(ig.s.missioni.voce.stato, 'fallita'); assert(ig.s.bandiere['voce-ignorata']);
  // pagare 20 monete: serve l'oro
  const alla = sceglie(5, ['c', 2, 'c']);                     // corda → Ilda
  const povero = R.vista(alla, cap, ctxDi(eroi, { oro: 5 })); const pag = povero.scelte.find(x => /monete/.test(x.t));
  assert.strictEqual(pag, undefined, 'senza 20 monete la scelta non c\'è'); assert(R.act(alla, { t: 'scegli', i: 1 }, cap, ctxDi(eroi, { oro: 5 })).err);
  const pagato = A(alla, { t: 'scegli', i: 1 }, ctx); assert.deepStrictEqual(pagato.fuori, [{ t: 'oro', n: -20 }]); assert(pagato.s.bandiere['ilda-ripagata']);
  assert.strictEqual(R.vista(alla, cap, ctx).scelte.find(x => x.i === 1).etichetta, '20 monete');
  assert.strictEqual(A(pagato.s, { t: 'continua' }, ctx).esito, 'aiutata');
  // la ricompensa: prova di Intimidire, in tutti e due i casi si arriva a «borsa»
  const chiesta = A(alla, { t: 'scegli', i: 2 }, ctx); assert.strictEqual(chiesta.s.scena.nodo, 'borsa'); assert(chiesta.s.ultima.ab === 'intimidire');
  assert.strictEqual(chiesta.s.approv.ilda | 0, 0, 'Ilda non è nel gruppo: «avidità» non cambia nulla');
  const fin = A(chiesta.s, { t: 'continua' }, ctx); assert.strictEqual(fin.esito, 'ricompensa'); assert(fin.s.bandiere['ilda-rifiutata']);
}

// ---- compagni dentro il racconto: approvazione che scende, abbandono, congedo in coda ----
{
  const eroi = gruppo('guerriero', 'ladro'), ctx = ctxDi(eroi);
  let s = R.nuovo('prova', 21); s = R.act(s, { t: 'avvia', id: 'pozzo' }, cap, ctx).s;
  s = A(s, { t: 'continua' }, ctx).s; s = A(s, { t: 'scegli', i: 2 }, ctx).s; s = A(s, { t: 'continua' }, ctx).s; s = A(s, { t: 'scegli', i: 0 }, ctx).s; s = A(s, { t: 'continua' }, ctx).s;
  assert.strictEqual(CM.stato(s, 'ilda'), 'gruppo');
  // parlare con lei: scelte dure la raffreddano
  assert.strictEqual(CM.parla(s, cap, 'ilda'), 'ilda-parla');
  let t = A(s, { t: 'avvia', id: 'ilda-parla' }, ctx).s; const prima = t.approv.ilda;
  t = A(t, { t: 'scegli', i: 2 }, ctx).s; assert.strictEqual(t.approv.ilda, prima - 8, '«avidità» costa 8 punti a Ilda');
  assert.strictEqual(A(t, { t: 'continua' }, ctx).esito, 'fine');
  // sotto la soglia di abbandono se ne va: congedo in coda, flag, fuori
  let u = copia(s); u.approv.ilda = -35; u = A(u, { t: 'avvia', id: 'ilda-parla' }, ctx).s;
  const ru = A(u, { t: 'scegli', i: 1 }, ctx);              // «durezza» -4
  assert.strictEqual(ru.s.approv.ilda, -39);
  let w = copia(s); w.approv.ilda = -37; w = A(w, { t: 'avvia', id: 'ilda-parla' }, ctx).s;
  const rw = A(w, { t: 'scegli', i: 1 }, ctx);              // -41 ≤ -40: se ne va
  assert.strictEqual(rw.s.approv.ilda, -41); assert.strictEqual(CM.stato(rw.s, 'ilda'), 'andato'); assert(rw.s.bandiere['ilda-lascia']);
  assert(rw.fuori.some(f => f.t === 'compagno' && f.id === 'ilda' && f.azione === 'esce' && f.motivo === 'lascia'), JSON.stringify(rw.fuori));
  assert.deepStrictEqual(rw.s.coda, ['ilda-addio'], 'il congedo aspetta che la scena finisca');
  const fin = A(rw.s, { t: 'continua' }, ctx); assert.strictEqual(fin.esito, 'fine'); assert.strictEqual(fin.s.scena.id, 'ilda-addio', 'parte il congedo'); assert.strictEqual(fin.s.coda.length, 0);
  const addio = A(fin.s, { t: 'continua' }, ctx); assert.strictEqual(addio.esito, 'fine'); assert.strictEqual(addio.s.scena, null);
  assert.strictEqual(R.cond({ compagno: 'ilda' }, addio.s, ctx), false);
  // la fiducia sblocca la missione personale
  let f = copia(s); f.approv.ilda = 25; f = A(f, { t: 'avvia', id: 'ilda-parla' }, ctx).s; const rf = A(f, { t: 'scegli', i: 0 }, ctx);   // +8 → 33 ≥ 30
  assert(rf.s.bandiere['ilda-fiducia'], 'sale oltre la soglia di fiducia'); assert.strictEqual(CM.personale(rf.s, cap, 'ilda'), 'disponibile'); assert.strictEqual(CM.parla(rf.s, cap, 'ilda'), 'ilda-fratello');
  let p = A(rf.s, { t: 'continua' }, ctx).s; p = A(p, { t: 'avvia', id: 'ilda-fratello' }, ctx).s;
  assert.strictEqual(p.missioni.fratello.stato, 'attiva'); assert.strictEqual(CM.personale(p, cap, 'ilda'), 'attiva');
  const rp = A(p, { t: 'scegli', i: 0 }, ctx); p = rp.s; assert(p.bandiere['ilda-fratello-trovato']);   // la prova porta a «trovato», dove scatta la ricompensa
  p = A(p, { t: 'continua' }, ctx).s;
  assert.strictEqual(p.missioni.fratello.stato, 'fatta'); assert.strictEqual(CM.personale(p, cap, 'ilda'), 'fatta');
  assert(rp.fuori.some(x => x.t === 'xp' && x.n === 40) && rp.fuori.some(x => x.t === 'oggetto' && x.id === 'pozione-cura' && x.n === 2), 'ricompensa personale');
  assert(p.approv.ilda >= 33 + 10, 'la ricompensa include approvazione +10');
}

// ---- cantare: il riassunto del Locandiere letto dalle bandiere ----
{
  const ctx = ctxDi(gruppo('guerriero')), s = R.nuovo('prova', 2);
  let c = R.cantare(cap, s, ctx);
  assert.strictEqual(c.titolo, 'Primo cantare'); assert.deepStrictEqual(c.apertura, []); assert(/nebbia del mattino/.test(c.chiusura), 'niente fatto, chiusura di ripiego');
  s.bandiere['ilda-salvata'] = true; s.compagni.ilda = { stato: 'gruppo' }; s.bandiere['voce-ignorata'] = true;
  c = R.cantare(cap, s, ctx); assert.strictEqual(c.apertura.length, 2); assert(/Ilda/.test(c.apertura[0]) && /senza risposta/.test(c.apertura[1])); assert(/molto da raccontare/.test(c.chiusura));
  s.missioni.fratello = { stato: 'attiva' }; assert(/promessa/.test(R.cantare(cap, s, ctx).chiusura), 'la prima chiusura che vale');
  const fine = R.finisciSessione(s); assert.strictEqual(fine.sessioni, 1); assert.strictEqual(s.sessioni, 0, 'senza modificare lo stato ricevuto');
  assert.strictEqual(R.cantare(cap, fine, ctx).titolo, 'Secondo cantare');
  assert.strictEqual(R.cantare(cap, Object.assign({}, s, { sessioni: 99 }), ctx).titolo, 'Ottavo cantare', 'dopo l\'ottavo si resta all\'ultimo nome');
}

// ---- stato JSON puro e dado nello stato ----
{
  const s = R.nuovo('prova', 5); assert.deepStrictEqual(JSON.parse(JSON.stringify(s)), s);
  assert.notStrictEqual(R.nuovo('prova', 5).rng, R.nuovo('prova', 6).rng);
  const sorgente = require('fs').readFileSync(require('path').join(__dirname, '../src/js/motori/27q-avv-racconto.js'), 'utf8');
  assert(!/Math\.random/.test(sorgente.replace(/\/\*[\s\S]*?\*\//, '')), 'mai Math.random nel racconto');
}
console.log('OK racconto');
