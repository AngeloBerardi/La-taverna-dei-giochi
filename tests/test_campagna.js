// Campagna v3 (A6): mondo grande, eroi separati con movimento a dado, giri e alba, riposi, perdizione a soglie, mostri visibili e battaglie,
// sotterranei a stanze, servizi dei luoghi, migrazione da v1/v2, inventario e botteghe, forzieri, poteri; bot furbo vince, bot casuale perde.
const assert = require('assert');
global.EROI = require('../src/js/motori/27-eroi.js');
const C = require('../src/js/motori/28-campagna.js');
const SC = require('../src/js/motori/27i-avv-scontro.js'), IA = require('../src/js/motori/27j-avv-ia.js'), LU = require('../src/js/motori/27n-avv-luoghi.js');
const O = require('../src/js/motori/27b-avv-oggetti.js'), AP = require('../src/js/motori/27e-avv-poteri.js');
const carica = require('./carica.js');
const { eroe: eroeLiv } = require('./avv_aiuti.js');
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base) => EROI.nuovo({ nome, classe, razza, aspetto: A, base: { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8, ...base } });
const squadra = () => [mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }), mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }), mk('Tobia', 'mago', 'piccolo', { int: 15, sag: 13, des: 12 })];
const forti = (liv = 6) => ['guerriero', 'mago', 'chierico', 'ladro'].map((cl, i) => eroeLiv(cl, liv, ['umano', 'elfo', 'nano', 'piccolo'][i]));
const K = C.K, act = (s, a, r) => C.act(s, a, r), ok = (r) => { assert(r.s, r.err); return r.s; };
const copia = (s) => JSON.parse(JSON.stringify(s));
// dadi finti: sempre lo stesso numero, oppure una sequenza
const fisso = (v) => () => v, seq = (...v) => { let i = 0; return () => v[Math.min(i++, v.length - 1)]; };
// terreno libero attorno alla partenza, senza mostri, mercanti né luoghi (la partenza resta un villaggio)
function pulisci(s, R = 6) {
  for (const c of C.celleRaggio(R)) { const x = s.celle[K(c.q, c.r)]; if (!x) continue; x.t = 'pianura'; if (!(c.q === 0 && c.r === 0)) { if (x.luogo) delete s.luoghi[x.luogo]; x.poi = null; x.luogo = null; } }
  s.mostri = []; s.mercanti = []; return s;
}
const calmo = (s) => { s.mostri = []; s.mercanti = []; return s; };
const luogo = (s, tipo) => Object.values(s.luoghi).find((l) => l.tipo === tipo && !l.partenza);
const alla = (s, l) => { for (const e of s.eroi) { e.q = l.q; e.r = l.r; } s.party = { q: l.q, r: l.r }; return s; };
const gruppo = (s, q, r, o = {}) => { const g = { id: 'mx' + (s.mostri.length + 1), fam: 'banditi', liv: 1, diff: 'facile', seme: 7, ids: ['brigante'], q, r, stato: 'vaga', pausa: 0, ...o }; s.mostri.push(g); return g; };
// la battaglia vera, giocata dall'IA, e il suo risultato nella campagna
const combatti = (s, rnd) => { const b = C.battaglia(s); const fin = IA.partita(b, { eroi: 'eroica', nemici: 'normale' }); return act(s, { t: 'esito', riep: SC.riepilogo(fin) }, rnd); };
// una battaglia vinta "a tavolino" (per provare il flusso senza giocarla)
const vinta = (s, esito = 'vittoria', hp) => { const b = C.battaglia(s); b.over = { esito, giri: 1 }; const riep = SC.riepilogo(b); if (hp != null) riep.eroi.forEach((e) => { e.hp = hp; }); return riep; };

// ---- nuova: stato iniziale ----
assert.throws(() => C.nuova([], 1)); assert.throws(() => C.nuova([1, 2, 3, 4, 5].map(() => squadra()[0]), 1), /da 1 a 4/);
assert.strictEqual(C.nuova([1, 2, 3, 4].map(() => squadra()[0]), 1).eroi.length, 4, 'la compagnia arriva a 4 eroi');
const s0 = C.nuova(squadra(), 5);
assert.strictEqual(s0.v, 3); assert.strictEqual(s0.eroi.length, 3); assert.strictEqual(s0.giorno, 1); assert.strictEqual(s0.round, 1); assert.strictEqual(s0.fase, 'giorno'); assert.strictEqual(s0.raggio, 9);
assert(s0.eroi.every((e) => e.q === 0 && e.r === 0 && e.pm === null && e.brevi === 0), 'tutti alla partenza, movimento da tirare'); assert.deepStrictEqual(s0.party, { q: 0, r: 0 });
assert.strictEqual(s0.mostri.length, 5); assert(Object.keys(s0.luoghi).length >= 15); assert.strictEqual(s0.regioni.length, 3);
assert.deepStrictEqual(s0.missione.passi.map((id) => s0.luoghi[id].tipo), ['citta', 'antro', 'torre']);
assert(C.celleVisibili(s0).length > 5 && C.celleVisibili(s0).length < 30, 'solo il vicinato è rivelato'); assert.deepStrictEqual(JSON.parse(JSON.stringify(s0)), s0, 'stato JSON puro');
assert(act(s0, { t: 'boh' }).err); assert(act(s0, { t: 'entra' }).err, 'nulla da fare alla partenza'); assert(act(s0, { t: 'risolvi', eroe: 0, abilita: 'atletica' }).err, 'nessun incontro');
const prima = JSON.stringify(s0); act(s0, { t: 'fineTurno' }); assert.strictEqual(JSON.stringify(s0), prima, 'l\'input non viene modificato');
assert.deepStrictEqual(C.nuova(squadra(), 5), s0, 'stesso seme, stessa campagna'); assert.notDeepStrictEqual(C.nuova(squadra(), 6).celle, s0.celle);
// il capitolo può dare luoghi propri e passi di missione
{ const c = C.nuova(squadra(), 5, { luoghi: [{ tipo: 'citta', nome: 'Alta Rocca', q: 2, r: -1, id: 'alta' }], titolo: 'Prova', passi: ['alta'] }); assert.strictEqual(c.luoghi.alta.nome, 'Alta Rocca'); assert.strictEqual(c.missione.titolo, 'Prova'); assert.deepStrictEqual(c.missione.passi, ['alta']); }

// ---- movimento a dado, per eroe ----
{
  const s = pulisci(C.nuova(squadra(), 9)), e0 = s.eroi[0];
  const t = ok(act(s, { t: 'tira', eroe: 0 }, fisso(0))); assert.strictEqual(t.eroi[0].pm, Math.max(3, e0.mov - 1), 'dado 1: mov − 2 + 1'); assert.strictEqual(t.eroi[1].pm, null, 'gli altri non hanno tirato');
  assert.strictEqual(ok(act(s, { t: 'tira', eroe: 0 }, fisso(.99))).eroi[0].pm, e0.mov + 2, 'dado 4: mov + 2');
  assert.strictEqual(act(t, { t: 'tira', eroe: 0 }).err, 'Aldo ha già tirato il movimento'); assert(act(s, { t: 'tira', eroe: 9 }).err);
  // Concentrazione = vantaggio: due dadi, si tiene il migliore, costa un punto
  const c = ok(act(s, { t: 'tira', eroe: 0, conc: true }, seq(0, .99))); assert.strictEqual(c.eroi[0].pm, e0.mov + 2); assert.strictEqual(c.eroi[0].conc, e0.conc - 1); assert.deepStrictEqual(c.ultimoTiro.tiri, [1, 4]);
  const nc = copia(s); nc.eroi[0].conc = 0; assert.strictEqual(act(nc, { t: 'tira', eroe: 0, conc: true }).err, 'Non hai Concentrazione');
  // tutti insieme
  const tt = ok(act(s, { t: 'tira', tutti: true }, fisso(.5))); assert(tt.eroi.every((e) => e.pm >= 3));
  // ogni eroe ha il suo movimento e il suo turno
  s.eroi[0].pm = 6; s.eroi[1].pm = 4;
  const m = ok(act(s, { t: 'muovi', eroe: 0, q: 3, r: 0 })); assert.deepStrictEqual([m.eroi[0].q, m.eroi[0].r, m.eroi[0].pm], [3, 0, 3]); assert.deepStrictEqual([m.eroi[1].q, m.eroi[1].r, m.eroi[1].pm], [0, 0, 4], 'Mira non si è mossa');
  assert.strictEqual(act(m, { t: 'muovi', q: 1, r: 0 }).err, 'Gli eroi sono separati: scegli chi muovere');
  assert.strictEqual(act(s, { t: 'muovi', eroe: 1, q: 5, r: 0 }).err, 'Movimento insufficiente');
  // muovi tutti: quelli nella stessa cella, ognuno paga il suo costo
  const tg = copia(s); tg.eroi[2].pm = 2; assert.strictEqual(act(tg, { t: 'muovi', eroe: 0, tutti: true, q: 3, r: 0 }).err, 'Movimento insufficiente', 'se uno non ce la fa, nessuno parte');
  tg.eroi[2].pm = 5; const gg = ok(act(tg, { t: 'muovi', eroe: 0, tutti: true, q: 3, r: 0 })); assert(gg.eroi.every((e) => e.q === 3), 'tutti e tre sono arrivati'); assert.deepStrictEqual(gg.eroi.map((e) => e.pm), [3, 1, 2]);
  // senza eroe: l'intera compagnia, se sta unita
  const un = copia(s); un.eroi.forEach((e) => { e.pm = 8; }); const u = ok(act(un, { t: 'muovi', q: 2, r: -1 })); assert(u.eroi.every((e) => e.q === 2 && e.r === -1 && e.pm === 6));
  // se non ha tirato, il dado si tira da solo
  const auto = copia(s); auto.eroi[2].pm = null; const a = ok(act(auto, { t: 'muovi', eroe: 2, q: 1, r: 0 }, fisso(.99))); assert.strictEqual(a.eroi[2].pm, auto.eroi[2].mov + 2 - 1);
  // costi di terreno: strada 0,5; bosco 2; acqua e montagna non si passano; fuori mappa; stessa cella
  const k = (q, r) => s.celle[K(q, r)];
  k(1, 0).t = 'bosco'; k(2, 0).t = 'strada'; s.eroi[0].pm = 2.5; const b = ok(act(s, { t: 'muovi', eroe: 0, q: 2, r: 0 })); assert.strictEqual(b.eroi[0].pm, 0, 'bosco 2 + strada 0,5'); // il percorso più economico può girare attorno: costa meno o uguale
  s.eroi[0].pm = 6; k(1, 0).t = 'acqua'; assert(/non si passa/.test(act(s, { t: 'muovi', eroe: 0, q: 1, r: 0 }).err)); assert.strictEqual(act(s, { t: 'muovi', eroe: 0, q: 40, r: 40 }).err, 'Fuori dalla mappa'); assert.strictEqual(act(s, { t: 'muovi', eroe: 0, q: 0, r: 0 }).err, 'Sei già lì');
  k(1, 0).t = 'pianura'; k(2, 0).t = 'pianura'; assert.strictEqual(act(s, { t: 'muovi', eroe: 7, q: 1, r: 0 }).err, 'Scegli un eroe in piedi');
  // un nemico occupa la sua cella e si gira intorno
  const mm = copia(s); gruppo(mm, 2, 0, { pausa: 5 }); mm.eroi[0].pm = 8; assert.strictEqual(act(mm, { t: 'muovi', eroe: 0, q: 2, r: 0 }).err, 'Lì c\'è un nemico');
  // la mappa si scopre camminando
  const v0 = C.celleVisibili(s).length; assert(C.celleVisibili(ok(act(s, { t: 'muovi', eroe: 0, q: 5, r: 0 }, fisso(.99)))).length > v0 + 5);
  // strade sbarrate (perdizione 75) costano il doppio
  k(1, 0).t = 'strada'; assert.strictEqual(C.costoCella(s)(k(1, 0)), .5); s.sbarrate = true; assert.strictEqual(C.costoCella(s)(k(1, 0)), 2); assert.strictEqual(C.costoCella(s)(k(2, 0)), 1);
}

// ---- giri, notte, alba ----
{
  let s = pulisci(C.nuova(squadra(), 3)); s.eroi[0].hp = 1; s.eroi[0].pm = 4;
  s = ok(act(s, { t: 'fineTurno' })); assert.strictEqual(s.round, 2); assert(s.eroi.every((e) => e.pm === null), 'a ogni giro si ritira il dado'); assert.strictEqual(s.fase, 'giorno');
  for (let i = 0; i < 3; i++) s = ok(act(s, { t: 'fineTurno' })); assert.strictEqual(s.round, 5); assert.strictEqual(s.fase, 'giorno'); s = ok(act(s, { t: 'fineTurno' })); assert.strictEqual(s.fase, 'notte'); assert(s.log.includes('Scende la notte.'));
  s.eroi[1].brevi = 2; s = ok(act(s, { t: 'fineTurno' })); s = ok(act(s, { t: 'fineTurno' })); s = ok(act(s, { t: 'fineTurno' }));
  assert.strictEqual(s.giorno, 2); assert.strictEqual(s.round, 1); assert.strictEqual(s.fase, 'giorno'); assert.strictEqual(s.perdizione, 3, 'all\'alba +3'); assert(s.eroi[0].hp > 1 && s.eroi[0].hp < s.eroi[0].hpMax, 'solo la piccola cura naturale'); assert.strictEqual(s.eroi[1].brevi, 0);
  assert(/Giorno 2/.test(s.log[s.log.length - 1]));
  s.perdizione = 98; for (let i = 0; i < 8; i++) s = ok(act(s, { t: 'fineTurno' })); assert(s.over && !s.over.win && /perdizione/.test(s.over.reason)); assert.strictEqual(act(s, { t: 'fineTurno' }).err, 'Campagna finita');
  // le cariche tornano: breve all'alba naturale, lungo con il riposo lungo
  const p = pulisci(C.nuova([mk('Veterano', 'guerriero', 'orco', { for: 15, cos: 14 })], 3)); const e = p.eroi[0], cb = AP.combattente(e), id = cb.poteri.find((k) => AP.P[k] && AP.P[k].ric === 'lungo');
  if (id) { e.usi = { [id]: AP.usiMax(cb, AP.P[id]) }; let q = p; for (let i = 0; i < 8; i++) q = ok(act(q, { t: 'fineTurno' })); assert.strictEqual(q.eroi[0].usi[id], e.usi[id], 'l\'alba naturale non ridà i poteri a riposo lungo'); }
}

// ---- riposo breve ----
{
  let s = pulisci(C.nuova(squadra(), 4)); s.eroi[0].hp = 3; s.eroi[0].pm = 5;
  s = ok(act(s, { t: 'breve', eroe: 0 })); assert(s.eroi[0].hp > 3 && s.eroi[0].hp <= 3 + Math.ceil(s.eroi[0].hpMax * .2)); assert.strictEqual(s.eroi[0].pm, 0, 'finisce il suo turno'); assert.strictEqual(s.eroi[0].brevi, 1);
  s = ok(act(s, { t: 'breve', eroe: 0 })); assert.strictEqual(act(s, { t: 'breve', eroe: 0 }).err, 'Aldo ha già riposato abbastanza oggi'); assert(act(s, { t: 'breve', eroe: 9 }).err);
  const n = pulisci(C.nuova(squadra(), 4)); gruppo(n, 2, 0, { pausa: 9 }); assert.strictEqual(act(n, { t: 'breve', eroe: 0 }).err, 'Troppo vicino ai nemici per riposare');
}

// ---- riposo lungo: locanda, accampamento, imboscata ----
{
  const s = pulisci(C.nuova(squadra(), 4)); s.eroi.forEach((e) => { e.hp = 2; }); s.oro = 100; s.perdizione = 0;
  const l = ok(act(s, { t: 'lungo' }, fisso(.99))); assert.strictEqual(l.oro, 100 - 8 * 3, 'locanda: 8 monete a eroe'); assert(l.eroi.every((e) => e.hp === e.hpMax)); assert.strictEqual(l.giorno, 2); assert.strictEqual(l.round, 1); assert.strictEqual(l.perdizione, 3);
  const povero = copia(s); povero.oro = 10; assert(/monete per la locanda/.test(act(povero, { t: 'lungo' }).err));
  const sep = copia(s); sep.eroi[1].q = 1; assert.strictEqual(act(sep, { t: 'lungo' }).err, 'Riunite la compagnia nello stesso luogo');
  const fuori = copia(s); fuori.celle['0,0'].poi = null; fuori.celle['0,0'].luogo = null; assert(/al sicuro/.test(act(fuori, { t: 'lungo' }).err));
  // il giro che manca al giorno passa: i mostri si muovono nel frattempo
  const g = copia(s); g.round = 3; gruppo(g, 6, 0); const q0 = g.mostri[0].q; const gl = ok(act(g, { t: 'lungo' }, fisso(.99))); assert(gl.mostri.length >= 1);
  // accampamento: costa razioni, cura metà
  const c = pulisci(C.nuova(squadra(), 4)); c.celle['1,0'].poi = 'campo'; c.celle['1,0'].luogo = 'campo9'; c.luoghi.campo9 = { id: 'campo9', tipo: 'campo', nome: 'Bivacco', q: 1, r: 0, reg: 0 }; alla(c, c.luoghi.campo9); c.eroi.forEach((e) => { e.hp = 2; e.zaino = []; });
  assert(/razioni/.test(act(c, { t: 'lungo' }, fisso(.99)).err)); c.eroi[0].zaino = ['razione', 'razione']; c.eroi[2].zaino = ['razione'];
  const cl = ok(act(c, { t: 'lungo' }, fisso(.99))); assert.strictEqual(cl.eroi.reduce((t, e) => t + e.zaino.length, 0), 0, 'tre razioni consumate'); assert(cl.eroi.every((e) => e.hp > 2 && e.hp < e.hpMax || e.hpMax <= 4), 'cura la metà'); assert.strictEqual(cl.giorno, 2);
  // imboscata: dado basso, i nemici sorprendono la compagnia e il riposo non avviene
  const im = ok(act(c, { t: 'lungo' }, fisso(0))); assert(im.sfida && im.sfida.sorpresa === 'eroi' && im.giorno === 1, 'imboscata'); assert.strictEqual(im.eroi.reduce((t, e) => t + e.zaino.length, 0), 3, 'le razioni non si consumano');
  assert(im.mostri.some((m) => m.stato === 'caccia')); assert(C.battaglia(im).cb.filter((x) => x.lato === 'nemici').every((x) => !x.sorpreso) && C.battaglia(im).cb.filter((x) => x.lato === 'eroi').every((x) => x.sorpreso), 'sono gli eroi i sorpresi');
  // assediato: locanda chiusa
  const as = copia(s); as.luoghi[as.celle['0,0'].luogo].assedio = true; assert(/assedio/.test(act(as, { t: 'lungo' }).err));
}

// ---- perdizione a soglie ----
{
  const dormi = (s) => ok(act(copia(s), { t: 'lungo' }, fisso(.99)));
  let s = pulisci(C.nuova(squadra(), 11)); s.oro = 999;
  s.perdizione = 21; s = dormi(s); assert.strictEqual(s.perdizione, 24); assert.strictEqual(s.mostri.length, 5, 'sotto 25 nulla cambia: i cinque gruppi di base');
  s = dormi(s); assert.strictEqual(s.perdizione, 27); assert.strictEqual(LU.livelloPerdizione(s.perdizione), 1); assert(s.log.includes(LU.NOTE_SOGLIA[1])); assert.strictEqual(s.mostri.filter((m) => !m.assedio).length, 6, 'un gruppo in più alla soglia 25');
  assert(!Object.values(s.luoghi).some((l) => l.assedio) && !s.sbarrate);
  s.perdizione = 48; s = dormi(s); assert.strictEqual(s.perdizione, 51); const ass = Object.values(s.luoghi).filter((l) => l.assedio); assert.strictEqual(ass.length, 1, 'un villaggio assediato alla soglia 50'); assert(s.log.some((t) => t.includes('sotto assedio')));
  const guardia = s.mostri.find((m) => m.assedio === ass[0].id); assert(guardia && guardia.stato === 'guardia' && C.dist(guardia, ass[0]) === 1); assert(!s.sbarrate);
  s.perdizione = 72; s = dormi(s); assert.strictEqual(s.perdizione, 75); assert(s.sbarrate, 'strade sbarrate alla soglia 75'); assert(s.log.includes(LU.NOTE_SOGLIA[3])); assert.strictEqual(s.mostri.filter((m) => !m.assedio).length, 7);
  // il bonus ai mostri cresce con la soglia
  const comp = (p) => { const x = copia(s); x.perdizione = p; x.fase = 'giorno'; return require('../src/js/motori/27o-avv-mostri.js').bonusLivello(x); }; assert.deepStrictEqual([0, 30, 60, 80].map(comp), [0, 1, 2, 3]);
  // scende col santuario: -3, o -8 con l'offerta; le soglie si ritirano
  const sa = pulisci(C.nuova(squadra(), 11)); const sant = { id: 'sant1', tipo: 'santuario', nome: 'Altare', q: 1, r: 0, reg: 0 }; sa.luoghi.sant1 = sant; sa.celle['1,0'].poi = 'santuario'; sa.celle['1,0'].luogo = 'sant1'; alla(sa, sant); sa.oro = 50;
  sa.perdizione = 52; sa.sbarrate = false; assedia(sa);
  const p1 = ok(act(sa, { t: 'prega', eroe: 0, offerta: true })); assert.strictEqual(p1.perdizione, 44); assert.strictEqual(p1.oro, 30); assert(!Object.values(p1.luoghi).some((l) => l.assedio), 'sotto 50 l\'assedio si allenta'); assert.strictEqual(p1.luoghi.sant1.pronto, 4);
  assert(/silenzioso/.test(act(p1, { t: 'prega', eroe: 0 }).err), 'il santuario tace per tre giorni');
  const p2 = ok(act(sa, { t: 'prega', eroe: 0 })); assert.strictEqual(p2.perdizione, 49); sa.oro = 5; assert(/monete/.test(act(sa, { t: 'prega', eroe: 0, offerta: true }).err));
  const sb = copia(sa); sb.oro = 50; sb.perdizione = 77; sb.sbarrate = true; const p3 = ok(act(sb, { t: 'prega', eroe: 0, offerta: true })); assert.strictEqual(p3.perdizione, 69); assert(!p3.sbarrate, 'sotto 75 le strade si riaprono');
  function assedia(x) { require('../src/js/motori/27o-avv-mostri.js').assedia(x, fisso(.3)); }
}

// ---- mostri sulla mappa, contatto e battaglia ----
{
  const s = pulisci(C.nuova(forti(5), 21)); s.eroi.forEach((e) => { e.pm = 8; });
  // un eroe si ferma accanto al nemico: parte la sfida con chi è abbastanza vicino
  s.eroi[1].q = 1; s.eroi[1].r = 0; s.eroi[2].q = -1; s.eroi[2].r = 0; gruppo(s, 4, 0);
  const m = ok(act(s, { t: 'muovi', eroe: 0, q: 6, r: 0 })); assert(m.sfida, 'si ferma al contatto'); assert.deepStrictEqual([m.eroi[0].q, m.eroi[0].r], [3, 0], 'a un esagono dal nemico, non alla meta'); assert.strictEqual(m.eroi[0].pm, 8 - 3, 'paga solo i passi fatti');
  assert.deepStrictEqual(m.sfida.quali, [0, 1], 'entrano Aldo (a 1) e Mira (a 3); Tobia è a 5 e non c\'è'); assert.deepStrictEqual(m.sfida.dist, { e1: 1, e2: 3 });
}
{
  const s = pulisci(C.nuova(forti(5), 21)); s.eroi.forEach((e, i) => { e.q = [0, 0, 0, 0][i]; e.r = 0; e.pm = 8; });
  const g = gruppo(s, 5, 0, { stato: 'caccia' }); s.eroi[0].q = 3; s.eroi[1].q = 2; s.eroi[2].q = 1; s.eroi[3].q = -2;  // dist dal gruppo: 2, 3, 4, 7
  s.fase = 'giorno'; s.round = 1;
  // la fase dei mostri lo porta addosso a chi è a 3 esagoni
  const f = ok(act(s, { t: 'fineTurno' }, fisso(.4))); assert(f.sfida, 'il gruppo raggiunge gli eroi'); assert.deepStrictEqual(f.sfida.mostro, g.id);
  const dd = f.sfida.dist, slot = (i) => f.eroi[i].slot; assert(f.sfida.quali.every((i) => dd[slot(i)] <= 3)); assert(!f.sfida.quali.includes(3), 'chi è lontano non entra'); assert.strictEqual(f.sfida.quali[0], 0);
  assert.strictEqual(act(f, { t: 'fineTurno' }).err, 'Prima va combattuta la battaglia'); assert.strictEqual(act(f, { t: 'muovi', eroe: 0, q: 0, r: 0 }).err, 'Prima va combattuta la battaglia');
  // la battaglia: chi è a 0–1 parte subito, gli altri arrivano dopo; chi non c'è resta com'è
  const b = C.battaglia(f), inCampo = b.cb.filter((c) => c.lato === 'eroi' && !c.fuori).map((c) => c.nome), dopo = b.riserva.length; assert(inCampo.length >= 1 && inCampo.length + dopo === f.sfida.quali.length);
  const lontano = JSON.stringify(f.eroi[3]);
  const v = ok(combatti(f)); assert(!v.sfida && v.log.some((t) => t.startsWith('Vittoria')), 'vittoria con eroi forti'); assert(!v.mostri.some((x) => x.id === g.id), 'il gruppo è sconfitto'); assert(v.sconfitti.includes(g.id));
  assert.strictEqual(JSON.stringify(v.eroi[3]), lontano, 'chi non ha combattuto non cambia'); assert(v.eroi[0].xp > f.eroi[0].xp, 'esperienza a chi ha combattuto'); assert(v.oro >= f.oro);
  // sconfitta: gli eroi che combattevano cadono, gli altri restano; il gruppo si ferma per tre giri
  const sc = copia(f); const rS = vinta(sc, 'sconfitta', 0); const d = ok(act(sc, { t: 'esito', riep: rS })); assert(d.eroi[0].hp === 0 && d.eroi[3].hp > 0 && !d.over); assert.strictEqual(d.perdizione, 2); assert.strictEqual(d.mostri.find((x) => x.id === g.id).pausa, 3);
  assert.deepStrictEqual([d.eroi[0].q, d.eroi[0].r], [d.eroi[3].q, d.eroi[3].r], 'chi è a terra segue chi è in piedi'); d.eroi[0].hp = 0;
  // tutti a terra: campagna persa
  const tutti = copia(f); tutti.eroi.forEach((e) => { e.q = f.eroi[0].q; e.r = f.eroi[0].r; }); const nuovo = ok(act(tutti, { t: 'esito', riep: Object.assign(vinta(tutti, 'sconfitta', 0)) })); assert(nuovo.over && /caduti/.test(nuovo.over.reason) || nuovo.eroi.some((e) => e.hp > 0));
  // fuga: la compagnia arretra, perdizione +1, il gruppo resta
  const fu = copia(f); const rF = vinta(fu, 'fuga'); const fg = ok(act(fu, { t: 'esito', riep: rF })); assert.strictEqual(fg.perdizione, 1); assert(fg.mostri.some((x) => x.id === g.id)); assert(fu.sfida.quali.every((i) => C.dist(fg.eroi[i], fg.mostri.find((x) => x.id === g.id)) >= 2), 'ripiega a due esagoni o più');
  assert(!fg.sfida); const ripetuta = ok(act(fg, { t: 'fineTurno' }, fisso(.4))); assert(!ripetuta.sfida, 'durante la pausa non attacca');
  // errori
  assert(act(f, { t: 'esito', riep: null }).err); assert.strictEqual(act(s0, { t: 'esito', riep: {} }).err, 'Nessuna battaglia in corso'); const male = vinta(f, 'vittoria'); male.eroi[0].nome = 'Altro'; assert(/non corrisponde/.test(act(f, { t: 'esito', riep: male }).err));
}
// luoghi sicuri: chi sta in un villaggio non viene attaccato, e il villaggio non si può raggiungere con un'assedio che non c'è
{
  const s = pulisci(C.nuova(squadra(), 8)); gruppo(s, 2, 0, { stato: 'caccia' }); for (let i = 0; i < 10; i++) { const r = act(s.sfida ? s : s, { t: 'fineTurno' }, fisso(.4)); assert(r.s, r.err); Object.assign(s, r.s); }
  assert(!s.sfida, 'alla partenza (un villaggio) nessun contatto');
}

// ---- sotterranei ----
{
  let s = calmo(C.nuova(forti(6), 31)); const citta = luogo(s, 'citta'), antro = luogo(s, 'antro'), torre = luogo(s, 'torre');
  alla(s, antro); assert(/sindaco/.test(act(s, { t: 'entra' }).err), 'l\'antro non si apre prima della città'); alla(s, torre); assert(/antro/.test(act(s, { t: 'entra' }).err), 'la torre non prima dell\'antro');
  alla(s, citta); assert.strictEqual(act(s, { t: 'entra' }).s.missione.passo, 1); s = ok(act(s, { t: 'entra' })); assert(/sindaco/.test(s.log[s.log.length - 1])); assert(act(s, { t: 'entra' }).err, 'il sindaco ha già parlato');
  // l'antro: 4 stanze, il boss per ultimo; si entra, si esce, si rientra senza perdere i progressi
  alla(s, antro); s.eroi[1].q = 0; assert(/Riunite/.test(act(s, { t: 'entra' }).err)); s.eroi[1].q = antro.q; s.eroi[1].r = antro.r;
  s = ok(act(s, { t: 'entra' })); assert.strictEqual(s.dentro, antro.id); assert.strictEqual(s.sotterranei[antro.id].stanze.length, 4); assert(/Sei dentro/.test(act(s, { t: 'muovi', q: 1, r: 0 }).err)); assert(act(s, { t: 'fineTurno' }).err); assert(act(s, { t: 'lungo' }).err); assert(act(s, { t: 'tira', eroe: 0 }).err);
  const stanze = s.sotterranei[antro.id].stanze, giri0 = s.round;
  const risolviStanza = (x) => {
    for (let n = 0; n < 12 && x.dentro; n++) {
      if (x.sfida) { x = ok(act(x, { t: 'esito', riep: vinta(x) })); continue; }
      if (x.incontro) { x = ok(act(x, { t: 'risolvi', eroe: 0, abilita: x.incontro.ab[0] }, fisso(.99))); continue; }
      if (x.evento) { x = ok(act(x, { t: 'scegli', i: 0 })); continue; }
      x = ok(act(x, { t: 'avanza' }, fisso(.99)));
    }
    return x;
  };
  // prima stanza: si avanza, ci si pensa un po' e si esce
  let t = ok(act(s, { t: 'avanza' }, fisso(.99))); assert.strictEqual(t.round, giri0 + 1, 'ogni stanza costa un giro'); let progresso = t.sotterranei[antro.id].stanza;
  while (t.sfida || t.incontro || t.evento) { if (t.sfida) t = ok(act(t, { t: 'esito', riep: vinta(t) })); else if (t.incontro) t = ok(act(t, { t: 'risolvi', eroe: 0, abilita: t.incontro.ab[0] }, fisso(.99))); else t = ok(act(t, { t: 'scegli', i: 0 })); }
  progresso = t.sotterranei[antro.id].stanza; assert(progresso >= 1, 'la prima stanza è fatta');
  const fuori = ok(act(t, { t: 'esci' })); assert.strictEqual(fuori.dentro, null); assert.strictEqual(act(fuori, { t: 'esci' }).err, 'Non sei in un sotterraneo'); const di_nuovo = ok(act(fuori, { t: 'entra' })); assert.strictEqual(di_nuovo.sotterranei[antro.id].stanza, progresso, 'le stanze fatte restano fatte'); assert.deepStrictEqual(di_nuovo.sotterranei[antro.id].stanze, stanze);
  // fino in fondo
  const xp0 = di_nuovo.eroi[0].xp; const fin = risolviStanza(di_nuovo); assert.strictEqual(fin.dentro, null, 'il boss è l\'ultima stanza'); assert(fin.sotterranei[antro.id].finito && fin.luoghi[antro.id].ripulito); assert.strictEqual(fin.missione.passo, 2); assert(fin.eroi[0].xp >= xp0 + 60); assert(fin.log.some((l) => /ripulito/.test(l)));
  assert.strictEqual(act(fin, { t: 'entra' }).err, 'Qui non c\'è più nulla da fare');
  // la torre: sei stanze, il boss chiude la missione e la campagna
  alla(fin, torre); const tt = ok(act(fin, { t: 'entra' })); assert.strictEqual(tt.sotterranei[torre.id].stanze.length, 6); const vv = risolviStanza(tt); assert(vv.over && vv.over.win && /Torre/.test(vv.over.reason), 'la torre chiude la campagna'); assert.strictEqual(vv.missione.passo, 3);
  // una rovina è facoltativa: tre stanze, non tocca la missione
  const ru = luogo(s, 'rovina'); const sr = calmo(C.nuova(forti(6), 31)); const rv = luogo(sr, 'rovina'); void ru; if (rv) { alla(sr, rv); const e = ok(act(sr, { t: 'entra' })); assert.strictEqual(e.sotterranei[rv.id].stanze.length, 3); const f = risolviStanza(e); assert(f.sotterranei[rv.id].finito && f.missione.passo === 0 && !f.over); }
}
// trappole ed eventi: una prova, una scelta; l'evento "cattivo" fa salire la perdizione
{
  let s = calmo(C.nuova(forti(3), 7)); const antro = luogo(s, 'antro'); s.missione.passo = 1; alla(s, antro); s = ok(act(s, { t: 'entra' }));
  const tr = copia(s); tr.sotterranei[antro.id].stanze = [{ n: 1, k: 'trappola', testo: 'Una trappola.', ab: ['percezione', 'acrobazia', 'furtivita'], cd: 14, dan: 6 }, { n: 2, k: 'evento', id: 'altare' }, { n: 3, k: 'boss', diff: 'capo' }]; tr.sotterranei[antro.id].stanza = 0;
  let x = ok(act(tr, { t: 'avanza' })); assert(x.incontro && x.incontro.stanza && x.incontro.cd >= 14); assert.strictEqual(act(x, { t: 'fuggi' }).err, 'Non si fugge da qui'); assert.strictEqual(act(x, { t: 'avanza' }).err, 'Prima affronta l\'incontro');
  const lontano = copia(x); lontano.eroi[1].q = 3; assert(/lontano/.test(act(lontano, { t: 'risolvi', eroe: 1, abilita: 'percezione' }).err));
  const ko = ok(act(x, { t: 'risolvi', eroe: 0, abilita: 'percezione' }, fisso(0))); assert(ko.eroi[0].hp < x.eroi[0].hp && ko.perdizione === 1 && ko.sotterranei[antro.id].stanza === 1 && !ko.incontro, 'fallire ferisce e si va avanti');
  const bene = ok(act(x, { t: 'risolvi', eroe: 0, abilita: 'percezione' }, fisso(.99))); assert(bene.eroi[0].xp > x.eroi[0].xp && bene.ultima.ok);
  const ev = ok(act(bene, { t: 'avanza' })); assert(ev.evento && ev.evento.scelte.length === 3); assert.strictEqual(act(ev, { t: 'avanza' }).err, 'Prima scegli cosa fare'); assert.strictEqual(act(ev, { t: 'scegli', i: 7 }).err, 'Scelta non valida');
  const prendi = ok(act(ev, { t: 'scegli', i: 0 })); assert.strictEqual(prendi.oro, ev.oro + 25); assert.strictEqual(prendi.perdizione, ev.perdizione + 3, 'prendere le monete dall\'altare costa perdizione'); assert(!prendi.evento && prendi.sotterranei[antro.id].stanza === 2);
  const offri = copia(ev); offri.oro = 5; assert(/monete/.test(act(offri, { t: 'scegli', i: 1 }).err), 'l\'offerta costa 10 monete');
  const offri2 = ok(act(Object.assign(copia(ev), { oro: 50, perdizione: 10 }), { t: 'scegli', i: 1 })); assert.strictEqual(offri2.perdizione, 8); assert.strictEqual(offri2.oro, 40);
}

// ---- servizi dei luoghi ----
{
  const s = calmo(C.nuova(squadra(), 13)); const citta = luogo(s, 'citta'); alla(s, citta); s.oro = 300;
  // guaritore
  s.eroi[0].hp = 3; s.eroi[1].hp = 5; const costo = LU.PREZZI.guaritore(3, s.eroi[0].hpMax) + LU.PREZZI.guaritore(5, s.eroi[1].hpMax); const cu = ok(act(s, { t: 'cura', eroe: 0 })); assert(cu.eroi.every((e) => e.hp === e.hpMax)); assert.strictEqual(cu.oro, 300 - costo);
  assert.strictEqual(act(cu, { t: 'cura', eroe: 0 }).err, 'Nessuno ha bisogno di cure'); assert(/monete/.test(act(Object.assign(copia(s), { oro: 0 }), { t: 'cura', eroe: 0 }).err));
  const fuori = pulisci(C.nuova(squadra(), 13)); fuori.eroi[0].hp = 2; fuori.oro = 50; assert(act(fuori, { t: 'cura', eroe: 0 }).s, 'anche il villaggio di partenza ha un guaritore'); fuori.celle['0,0'].poi = null; fuori.celle['0,0'].luogo = null; assert.strictEqual(act(fuori, { t: 'cura', eroe: 0 }).err, 'Qui non c\'è un guaritore');
  // tempio: rialza un caduto, costa
  const caduto = copia(s); caduto.eroi[2].hp = 0; const ri = ok(act(caduto, { t: 'rialza', eroe: 2 })); assert.strictEqual(ri.eroi[2].hp, Math.ceil(ri.eroi[2].hpMax / 2)); assert.strictEqual(ri.oro, 300 - LU.PREZZI.tempio(ri.eroi[2].liv)); assert.strictEqual(act(ri, { t: 'rialza', eroe: 2 }).err, 'Non è a terra');
  const povero = copia(caduto); povero.oro = 3; assert(/tempio/.test(act(povero, { t: 'rialza', eroe: 2 }).err)); const vil = pulisci(C.nuova(squadra(), 13)); vil.eroi[2].hp = 0; vil.oro = 999; assert(/tempio/.test(act(vil, { t: 'rialza', eroe: 2 }).err), 'il villaggio non ha un tempio');
  // bacheca: taglia riscossa solo se il gruppo è stato sconfitto
  const tg = copia(s); tg.luoghi[citta.id].taglie = [{ id: 't-mz', mostro: 'mz', ricompensa: 40, riscossa: false }]; assert.strictEqual(act(tg, { t: 'taglia', eroe: 0, id: 't-mz' }).err, 'Quel gruppo è ancora in giro'); tg.sconfitti.push('mz'); tg.perdizione = 10;
  const rt = ok(act(tg, { t: 'taglia', eroe: 0, id: 't-mz' })); assert.strictEqual(rt.oro, 340); assert.strictEqual(rt.perdizione, 7); assert.strictEqual(act(rt, { t: 'taglia', eroe: 0, id: 't-mz' }).err, 'Già riscossa'); assert.strictEqual(act(rt, { t: 'taglia', eroe: 0, id: 'x' }).err, 'Taglia sconosciuta');
  // le taglie della città nascono con i gruppi in giro
  const n = C.nuova(squadra(), 13); assert(luogo(n, 'citta').taglie.length === 2 && luogo(n, 'citta').taglie.every((t) => n.mostri.some((m) => m.id === t.mostro) && t.ricompensa > 0));
  // merce del villaggio: solo comune
  const bottega = pulisci(C.nuova(squadra(), 13)); bottega.oro = 500; const rara = O.ID.find((i) => O.OGG[i].ra === 'rara' && O.OGG[i].slot !== 'miss');
  assert(/comune/.test(act(bottega, { t: 'compra', eroe: 0, tipo: 'fabbro', id: rara }).err), 'al villaggio la merce rara non c\'è'); assert(act(bottega, { t: 'compra', eroe: 0, tipo: 'fabbro', id: 'cuoio' }).s, 'la merce comune sì');
  // un mercante vagante apre la bottega dove sta
  const mer = pulisci(C.nuova(squadra(), 13)); mer.celle['0,0'].poi = null; mer.celle['0,0'].luogo = null; mer.oro = 100; assert(act(mer, { t: 'compra', eroe: 0, tipo: 'fabbro', id: 'cuoio' }).err.includes('bottega')); mer.mercanti = [{ id: 'mer1', q: 0, r: 0 }]; assert(act(mer, { t: 'compra', eroe: 0, tipo: 'fabbro', id: 'cuoio' }).s);
}

// ---- caduti che seguono, incontri casuali con prova d20 ----
{
  const s = pulisci(C.nuova(squadra(), 9)); s.eroi[1].hp = 0; s.eroi.forEach((e) => { e.pm = 8; }); const m = ok(act(s, { t: 'muovi', q: 3, r: 0 }, fisso(.99))); assert.deepStrictEqual([m.eroi[1].q, m.eroi[1].r], [3, 0], 'il caduto segue la compagnia in piedi'); assert.deepStrictEqual(m.party, { q: 3, r: 0 });
  assert(!m.incontro, 'dado alto: nessun incontro');
  const n = pulisci(C.nuova(squadra(), 9)); n.eroi[0].pm = 8; n.celle['1,0'] = { q: 1, r: 0, t: 'bosco', poi: null, luogo: null, reg: 0, visto: true }; const mi = ok(act(n, { t: 'muovi', eroe: 0, q: 1, r: 0 }, fisso(0))); assert(mi.incontro && mi.incontro.q === 1, 'dado basso: incontro');
  assert.strictEqual(act(mi, { t: 'fineTurno' }).err, 'Prima affronta l\'incontro'); const ab = mi.incontro.ab, non = Object.keys(EROI.ABILITA).find((x) => !ab.includes(x)); assert(act(mi, { t: 'risolvi', eroe: 0, abilita: non }).err); assert(act(mi, { t: 'risolvi', eroe: 9, abilita: ab[0] }).err);
  const bene = ok(act(mi, { t: 'risolvi', eroe: 0, abilita: ab[0] }, fisso(.99))); assert(!bene.incontro && bene.eroi[0].xp > 0 && bene.ultima.ok);
  const male = ok(act(mi, { t: 'risolvi', eroe: 0, abilita: ab[0] }, fisso(0))); assert(!male.incontro && male.eroi[0].hp < mi.eroi[0].hp && male.perdizione === 1);
  assert(!ok(act(mi, { t: 'fuggi' })).incontro); const fu = copia(mi); fu.eroi[0].hp = 5; assert.strictEqual(ok(act(fu, { t: 'fuggi', eroe: 0 })).eroi[0].hp, 4, 'copre la ritirata e si ferisce');
  // chi cade per ultimo: sconfitta
  const solo = pulisci(C.nuova([squadra()[0]], 9)); solo.eroi[0].hp = 1; solo.eroi[0].pm = 8; solo.celle['1,0'] = { q: 1, r: 0, t: 'bosco', poi: null, luogo: null, reg: 0, visto: true };
  let q = ok(act(solo, { t: 'muovi', eroe: 0, q: 1, r: 0 }, fisso(0))); q = ok(act(q, { t: 'risolvi', eroe: 0, abilita: q.incontro.ab[0] }, fisso(0))); assert(q.over && !q.over.win && /caduti/.test(q.over.reason));
}

// ---- migrazione da v1 e v2 ----
{
  const v3 = calmo(C.nuova(squadra(), 21)); const luoghiMondo = Object.values(v3.luoghi);
  // un salvataggio v2: una sola compagnia con movimento comune, luoghi come semplici `poi`, incontro a fasi
  const v2 = copia(v3); v2.v = 2; v2.pm = 6; v2.party = { q: 2, r: 1 }; v2.fase = 'notte';
  for (const k of ['luoghi', 'regioni', 'mercanti', 'sotterranei', 'dentro', 'sfida', 'evento', 'mostri', 'proxMostro', 'sconfitti', 'sbarrate', 'round', 'ultimoTiro']) delete v2[k];
  for (const e of v2.eroi) { delete e.q; delete e.r; delete e.pm; delete e.brevi; } for (const c of Object.values(v2.celle)) { delete c.luogo; delete c.reg; } v2.celle['0,0'].poi = null;
  v2.missione.passi = ['citta', 'antro', 'torre']; v2.incontro = { kind: 'antro', cd: 12, testo: 'x', ab: ['percezione'], multi: { prove: 3, serve: 2, fatte: 1, riuscite: 1 } };
  const poiV2 = Object.values(v2.celle).filter((c) => c.poi).length; const copiaV2 = JSON.stringify(v2);
  const m = C.migra(v2); assert.strictEqual(m.v, 3); assert.strictEqual(JSON.stringify(v2), copiaV2, 'l\'originale non viene toccato');
  assert(m.eroi.every((e) => e.q === 2 && e.r === 1 && e.pm === null && e.brevi === 0), 'tutti gli eroi dove stava il segnalino'); assert.strictEqual(m.round, 6, 'notte = sesto giro'); assert.strictEqual(m.fase, 'notte'); assert.strictEqual(m.pm, undefined);
  assert.strictEqual(Object.keys(m.luoghi).length, poiV2); assert(Object.values(m.celle).filter((c) => c.poi).every((c) => m.luoghi[c.luogo] && m.luoghi[c.luogo].tipo === c.poi && m.luoghi[c.luogo].q === c.q));
  assert.deepStrictEqual(m.missione.passi.map((id) => m.luoghi[id].tipo), ['citta', 'antro', 'torre'], 'i passi diventano id di luoghi'); assert.strictEqual(m.incontro, null, 'la prova a fasi si chiude'); assert(m.mostri.length >= 5, 'i mostri compaiono'); assert.deepStrictEqual(m.sconfitti, []);
  assert.deepStrictEqual(C.migra(m), m, 'uno stato v3 non cambia'); assert.deepStrictEqual(C.migra(copia(m)), m, 'migrare due volte non cambia nulla');
  const r = act(v2, { t: 'fineTurno' }); assert(r.s && r.s.v === 3 && r.s.round === 7, 'act accetta uno stato v2');
  // v1: senza dadi nello stato e con la vecchia torre
  const v1 = copia(v2); delete v1.rng; v1.v = 1; v1.missione.titolo = 'La Torre oscura'; v1.turno = 4; v1.evn = 9; const m1 = C.migra(v1); assert.strictEqual(m1.v, 3); assert(Number.isInteger(m1.rng)); assert.strictEqual(m1.missione.titolo, 'La Torre dei Corvi'); assert.strictEqual(v1.v, 1);
  void luoghiMondo;
}

// ---- zaino, equipaggiamento e botteghe (A2): per eroe, in città ----
{
  const s = C.nuova(squadra(), 21), [kc] = Object.entries(s.celle).find(([, c]) => c.poi === 'citta'); const citta = s.luoghi[s.celle[kc].luogo]; alla(s, citta); s.mostri = [];
  assert(s.eroi.every((e) => e.equip && Array.isArray(e.zaino) && Array.isArray(e.cintura)) && s.eroi[0].zaino.includes('pozione-cura') && s.eroi[0].equip.arma === 'spada-lunga' && s.negozi && !Object.keys(s.negozi).length);
  // un salvataggio già v3 ma senza zaino si completa da solo, con l'equipaggiamento della classe
  const vecchio = copia(s); for (const e of vecchio.eroi) { delete e.equip; delete e.zaino; delete e.cintura; } delete vecchio.negozi;
  const m = C.migra(vecchio); assert.strictEqual(m.eroi[1].equip.arma, 'pugnali'); assert.deepStrictEqual(m.eroi[1].zaino, []); assert.deepStrictEqual(m.negozi, {}); assert.deepStrictEqual(C.migra(m), m);
  assert(act(vecchio, { t: 'compra', eroe: 0, tipo: 'fabbro', id: 'cuoio' }).s, 'si può giocare anche con il vecchio salvataggio');
  // in città: compra, l'oro comune scende, l'oggetto va nello zaino dell'eroe scelto
  s.oro = 200; let r = act(s, { t: 'compra', eroe: 1, tipo: 'fabbro', id: 'spada-corta' }); assert(r.s, r.err); assert.strictEqual(r.s.oro, 185); assert(r.s.eroi[1].zaino.includes('spada-corta') && !r.s.eroi[0].zaino.includes('spada-corta'));
  assert.strictEqual(s.oro, 200, 'lo stato di partenza non cambia'); assert(r.s.log[r.s.log.length - 1].includes('compra Spada corta per 15'));
  let q = ok(act(r.s, { t: 'equipa', eroe: 1, id: 'spada-corta' })); assert.strictEqual(q.eroi[1].equip.arma, 'spada-corta'); assert(q.eroi[1].zaino.includes('pugnali'));
  q = ok(act(q, { t: 'compra', eroe: 0, tipo: 'emporio', id: 'anello-di-rame' })); q = ok(act(q, { t: 'equipa', eroe: 0, id: 'anello-di-rame' })); assert.strictEqual(q.eroi[0].equip.acc1, 'anello-di-rame');
  q = ok(act(q, { t: 'compra', eroe: 0, tipo: 'emporio', id: 'amuleto-di-quercia' })); const mx = q.eroi[0].hpMax; q = ok(act(q, { t: 'equipa', eroe: 0, id: 'amuleto-di-quercia' })); assert.strictEqual(q.eroi[0].hpMax, mx + 3, 'l\'amuleto alza i PF massimi');
  assert.strictEqual(O.invValido(q.eroi[0]), null);
  const tv = ok(act(q, { t: 'compra', eroe: 2, tipo: 'fabbro', id: 'scudo-torre' })), ts = act(tv, { t: 'equipa', eroe: 2, id: 'scudo-torre' }); assert(ts.err && ts.err.includes('livello 2'), 'il livello conta (Tobia è di livello 1)');
  q = ok(act(q, { t: 'togli', eroe: 1, slot: 'arma' })); assert.strictEqual(q.eroi[1].equip.arma, null); assert(act(q, { t: 'togli', eroe: 1, slot: 'arma' }).err);
  q = ok(act(q, { t: 'cintura', eroe: 0, id: 'pozione-cura' })); assert.deepStrictEqual(q.eroi[0].cintura, ['pozione-cura']); q = ok(act(q, { t: 'zaino', eroe: 0, id: 'pozione-cura' })); assert.deepStrictEqual(q.eroi[0].cintura, []);
  q = ok(act(q, { t: 'passa', eroe: 0, a: 2, id: 'pozione-cura' })); assert(q.eroi[2].zaino.includes('pozione-cura') && !q.eroi[0].zaino.includes('pozione-cura')); assert(act(q, { t: 'passa', eroe: 0, a: 0, id: 'razione' }).err); assert(act(q, { t: 'passa', eroe: 0, a: 1, id: 'pozione-cura' }).err);
  const lon = copia(q); lon.eroi[2].q = 4; assert(/lontano/.test(act(lon, { t: 'passa', eroe: 2, a: 0, id: 'pozione-cura' }).err), 'non si passa un oggetto a chi è lontano');
  q.eroi[2].hp = 1; const u = ok(act(q, { t: 'usa', eroe: 2, id: 'pozione-cura' }, fisso(.5))); const nPoz = (e) => e.zaino.filter((x) => x === 'pozione-cura').length; assert(u.eroi[2].hp > 1 && nPoz(u.eroi[2]) === nPoz(q.eroi[2]) - 1, 'cura e consuma una pozione');
  const v = ok(act(q, { t: 'vendi', eroe: 1, id: 'pugnali' })); assert.strictEqual(v.oro, q.oro + 5);
  const lontano = copia(q); lontano.eroi.forEach((e) => { e.q = 3; e.r = 0; }); lontano.celle['3,0'] = lontano.celle['3,0'] || { q: 3, r: 0, t: 'pianura', visto: true }; lontano.celle['3,0'].poi = null; lontano.celle['3,0'].luogo = null;
  assert(act(lontano, { t: 'compra', eroe: 0, tipo: 'fabbro', id: 'cuoio' }).err.includes('bottega')); assert(act(lontano, { t: 'vendi', eroe: 1, id: 'pugnali' }).err.includes('bottega')); assert(act(lontano, { t: 'equipa', eroe: 1, id: 'pugnali' }).s, 'ci si equipaggia ovunque');
  for (const a of [{ t: 'compra', tipo: 'fabbro', id: 'cuoio' }, { t: 'compra', eroe: 9, tipo: 'fabbro', id: 'cuoio' }, { t: 'equipa', eroe: -1, id: 'cuoio' }, { t: 'usa', eroe: 0, id: 'spada-lunga' }]) assert(act(q, a).err, JSON.stringify(a));
  const inc = copia(q); inc.incontro = { kind: 'bestie', cd: 10, testo: 'x', ab: ['atletica'], q: 0, r: 0 }; assert(act(inc, { t: 'usa', eroe: 2, id: 'pozione-cura' }).err.includes('incontro'));
  // il bonus dell'equipaggiamento arriva alle prove
  const g = pulisci(C.nuova(squadra(), 3)); g.eroi[1].zaino.push('fascia-da-cacciatore'); const g2 = ok(act(g, { t: 'equipa', eroe: 1, id: 'fascia-da-cacciatore' })); g2.incontro = { kind: 'bestie', cd: 15, testo: 'x', ab: ['percezione'], q: 0, r: 0 };
  assert.strictEqual(EROI.bonus(g2.eroi[1], 'percezione'), EROI.bonus(g.eroi[1], 'percezione') + 1);
  const rs = ok(act(g2, { t: 'risolvi', eroe: 1, abilita: 'percezione' }, fisso(.5))); assert.strictEqual(rs.ultima.tot, rs.ultima.tiro + EROI.bonus(g2.eroi[1], 'percezione'));
}
// forzieri: ogni forziere dà monete (e spesso oggetti) validi, ripetibile con lo stesso stato
{
  let conOggetti = 0, N = 0;
  for (let seed = 1; seed <= 150; seed++) {
    const s = pulisci(C.nuova(squadra(), seed)); s.celle['1,0'].poi = 'tesoro'; s.celle['1,0'].luogo = 'tes1'; s.luoghi.tes1 = { id: 'tes1', tipo: 'tesoro', nome: 'Forziere', q: 1, r: 0, reg: 0 }; s.eroi[0].pm = 8; s.rng = seed * 7 + 1; N++;
    const r = act(s, { t: 'muovi', eroe: 0, q: 1, r: 0 }, () => 0.9); assert(r.s, r.err);
    assert(r.s.oro > s.oro, 'monete dal forziere'); assert(r.s.log.some((l) => l.startsWith('In un forziere: ')), 'registro: ' + r.s.log.slice(-2));
    const nuovi = r.s.eroi.flatMap((e, i) => e.zaino.filter((id) => !s.eroi[i].zaino.includes(id) || e.zaino.filter((x) => x === id).length > s.eroi[i].zaino.filter((x) => x === id).length)); if (nuovi.length) conOggetti++;
    assert(r.s.eroi.every((e) => e.zaino.every((id) => O.OGG[id] && O.OGG[id].slot !== 'miss') && e.zaino.length <= O.MAX_ZAINO)); assert.strictEqual(r.s.celle['1,0'].poi, null, 'il forziere si apre una volta'); assert(!r.s.luoghi.tes1);
  }
  assert(N > 100 && conOggetti >= N * .9, 'quasi ogni forziere dà un oggetto: ' + conOggetti + '/' + N);
}
// poteri nella campagna: scelte completate, cariche e Concentrazione per eroe, ricarica con i riposi (alba naturale = breve, riposo lungo = tutto)
{
  const alto = EROI.guadagna(EROI.guadagna(mk('Veterano', 'guerriero', 'orco', { for: 15, cos: 14, des: 12 }), 700), 0); assert.strictEqual(alto.liv, 4); assert.strictEqual(AP.daScegliere(alto).length, 3, 'tre scelte in sospeso');
  const s0 = C.nuova([alto, mk('Mira', 'ladro', 'elfo', { des: 15 })], 3), v = s0.eroi[0];
  assert.strictEqual(AP.daScegliere(v).length, 0, 'la campagna completa le scelte mancanti'); assert(EROI.coerente({ ...alto, scelte: v.scelte }), 'e sono scelte valide');
  assert.strictEqual(s0.eroi[1].scelte && Object.keys(s0.eroi[1].scelte).length, 0, 'al livello 1 nessuna scelta'); assert.strictEqual(v.conc, AP.combattente(v).concMax, 'la Concentrazione parte piena'); assert.deepStrictEqual(v.usi, {}, 'nessun potere usato');
  const mia = { ...alto, scelte: { 2: AP.offerta(alto, 2)[1] } }, s1 = C.nuova([mia], 3); assert.strictEqual(s1.eroi[0].scelte[2], mia.scelte[2], 'la scelta fatta dal giocatore resta');
  const e = s0.eroi[0], cb = AP.combattente(e), id = cb.poteri.find((k) => AP.P[k] && AP.P[k].ric !== 'turno'); assert(id, 'almeno un potere a cariche');
  e.usi = { [id]: AP.usiMax(cb, AP.P[id]) }; e.conc = 0; e.oro = 0; s0.oro = 100;
  const lungo = ok(act(s0, { t: 'lungo' }, fisso(.99))); assert.deepStrictEqual(lungo.eroi[0].usi, {}, 'il riposo lungo ridà tutte le cariche'); assert.strictEqual(lungo.eroi[0].conc, AP.combattente(lungo.eroi[0]).concMax, 'e la Concentrazione piena');
  const breve = ok(act(pulisci(s0), { t: 'breve', eroe: 0 })); assert(breve.eroi[0].conc <= AP.combattente(breve.eroi[0]).concMax);
}

// ---- invarianti: azioni a caso non rompono mai lo stato ----
{
  const AZ = (s, rng) => { const i = Math.floor(rng() * s.eroi.length), v = C.vicini(s.eroi[i].q, s.eroi[i].r), n = v[Math.floor(rng() * 6)], t = ['tira', 'muovi', 'muovi', 'muovi', 'fineTurno', 'breve', 'lungo', 'entra', 'esci', 'avanza', 'scegli', 'risolvi', 'fuggi', 'cura', 'rialza', 'prega', 'taglia', 'compra', 'usa'][Math.floor(rng() * 19)];
    return { t, eroe: i, tutti: rng() < .3, conc: rng() < .3, q: n.q, r: n.r, i: Math.floor(rng() * 3), abilita: ['atletica', 'percezione', 'arcano'][Math.floor(rng() * 3)], id: 'pozione-cura', tipo: 'emporio', offerta: rng() < .5 }; };
  let azioni = 0, finite = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const rng = carica.rng(seed * 13 + 5); let s = C.nuova(squadra(), seed);
    for (let n = 0; n < 250 && !s.over; n++) {
      let a = AZ(s, rng), r = act(s, a, rng);
      if (s.sfida && r.err) r = act(s, { t: 'esito', riep: vinta(s, rng() < .7 ? 'vittoria' : rng() < .5 ? 'fuga' : 'sconfitta') }, rng);
      if (r.err) continue; s = r.s; azioni++; JSON.stringify(s);
      for (const e of s.eroi) { assert(e.hp >= 0 && e.hp <= e.hpMax && (e.pm == null || e.pm >= 0) && e.conc >= 0 && s.celle[K(e.q, e.r)] && C.passabile(s.celle[K(e.q, e.r)].t), 'eroe valido ' + JSON.stringify([seed, n, a.t, e.q, e.r])); if (e.hp <= 0 && C.vivi(s).length) assert(C.vivi(s).some((x) => x.q === e.q && x.r === e.r), 'il caduto sta con qualcuno'); }
      assert(s.perdizione >= 0 && s.perdizione <= 100 && s.round >= 1 && s.round <= 8 && s.oro >= 0, 'numeri nei limiti ' + JSON.stringify([seed, n, a.t, s.perdizione, s.round, s.oro]));
      const occ = new Set(); for (const m of s.mostri) { assert(!occ.has(K(m.q, m.r)), 'due gruppi nella stessa cella'); occ.add(K(m.q, m.r)); assert(C.passabile(s.celle[K(m.q, m.r)].t) && !s.celle[K(m.q, m.r)].poi || m.assedio, 'mostro su terreno libero'); }
      if (s.dentro) assert(s.sotterranei[s.dentro] && C.vivi(s).every((e) => s.luoghi[s.dentro].q === e.q && s.luoghi[s.dentro].r === e.r), 'dentro = tutti nella cella'); }
    if (s.over) finite++;
  }
  assert(azioni > 1000, 'abbastanza azioni valide provate: ' + azioni);
}

// ---- bot: furbo (compagnia di livello adeguato, segue la missione, riposa, si cura, combatte con l'IA) contro casuale ----
function bot(seed, furbo, liv) {
  const rng = carica.rng(seed * 7 + 1); let s = C.nuova(furbo ? forti(liv) : squadra(), seed), n = 0;
  const luogoMeta = () => s.luoghi[C.passoCorrente(s)];
  const sicuri = () => Object.values(s.luoghi).filter((l) => ['citta', 'villaggio'].includes(l.tipo) && !l.assedio);
  const vai = (meta) => { // la compagnia unita cammina verso la meta, quanto può
    const v = C.vivi(s), da = { q: v[0].q, r: v[0].r };
    if (da.q === meta.q && da.r === meta.r) return null;
    const r0 = act(s, { t: 'tira', tutti: true }, rng); s = r0.s; const pm = Math.min(...C.vivi(s).map((e) => e.pm));
    const occ = new Set(s.mostri.map((m) => C.K(m.q, m.r))), p = C.percorso(s.celle, da, meta, null, { vieta: occ, costo: C.costoCella(s) }); if (!p) return act(s, { t: 'fineTurno' }, rng);
    let costo = 0, fin = null; for (const c of p) { costo += C.costoCella(s)(s.celle[C.K(c.q, c.r)]); if (costo > pm) break; fin = c; }
    if (!fin) return act(s, { t: 'fineTurno' }, rng);
    return act(s, { t: 'muovi', eroe: s.eroi.indexOf(C.vivi(s)[0]), tutti: true, q: fin.q, r: fin.r }, rng); };
  const riposoBreve = () => { for (let i = 0; i < s.eroi.length; i++) { const e = s.eroi[i]; if (e.hp > 0 && e.hp < e.hpMax * .7 && e.brevi < 2) { const x = act(s, { t: 'breve', eroe: i }, rng); if (x.s) { s = x.s; return true; } } } return false; };
  while (!s.over && n++ < 1500) {
    let r;
    if (!furbo) { const a = AZ_CASUALE(s, rng); r = act(s, a, rng); if (r.err) r = { s }; s = r.s; if (s.sfida) s = act(s, { t: 'esito', riep: vinta(s, 'sconfitta', 0) }, rng).s || s; continue; }
    if (s.sfida) { r = combatti(s, rng); if (process.env.DBG && r.s) console.log('  battaglia', s.sfida.stanza != null ? 'stanza ' + s.sfida.stanza : 'mondo', s.sfida.nemici.join(','), '->', r.s.eroi.map((e) => e.hp + '/' + e.hpMax).join(' '), 'g' + r.s.giorno + 'r' + r.s.round, 'perd', r.s.perdizione); }
    else if (s.incontro) { let best = null; for (let i = 0; i < s.eroi.length; i++) if (s.eroi[i].hp > 0 && s.eroi[i].q === s.incontro.q && s.eroi[i].r === s.incontro.r) for (const ab of s.incontro.ab) { const sc = EROI.mod(EROI.punteggi(s.eroi[i].base, s.eroi[i].razza)[EROI.ABILITA[ab]]) + (EROI.CLASSI[s.eroi[i].classe].abilita.includes(ab) ? 3 : 0); if (!best || sc > best.sc) best = { i, ab, sc }; } r = act(s, { t: 'risolvi', eroe: best.i, abilita: best.ab }, rng); }
    else if (s.evento) { const def = LU.evento(s.evento.id); let bi = 0, bs = -1e9; def.scelte.forEach((c, i) => { const sc = -(c.eff.perdizione || 0) * 10 + (c.eff.oro || 0) / 5 + (c.eff.xp || 0) + ((c.eff.oro || 0) < -s.oro ? -999 : 0); if (sc > bs) { bs = sc; bi = i; } }); r = act(s, { t: 'scegli', i: bi }, rng); }
    else if (!s.dentro && !s.incontro && !s.evento && riposoBreve()) continue;
    else {
      const v = C.vivi(s), tutti = s.eroi, caduti = tutti.filter((e) => e.hp <= 0), media = v.reduce((a, e) => a + e.hp / e.hpMax, 0) / v.length;
      const puoRialzare = caduti.length > 0 && s.oro >= LU.PREZZI.tempio(caduti[0].liv), pronto = media >= .75 && !puoRialzare;
      if (s.dentro) { // sottoterra: avanza se è in forma, altrimenti esce a curarsi (prima del capo pretende di più)
        const sott = s.sotterranei[s.dentro], prossima = sott.stanze[sott.stanza], soglia = prossima && prossima.k === 'boss' ? .75 : .5;
        r = media < soglia || (puoRialzare && prossima && prossima.k === 'boss') ? act(s, { t: 'esci' }, rng) : act(s, { t: 'avanza' }, rng);
      } else {
        const qui = C.luogoDi(s, v[0]), unita = v.every((e) => e.q === v[0].q && e.r === v[0].r), meta = luogoMeta(), alSicuro = qui && ['citta', 'villaggio'].includes(qui.tipo) && !qui.assedio;
        if (alSicuro) { // servizi: tempio per i caduti, cure, notte alla locanda
          let fatto = false; if (puoRialzare && qui.tipo === 'citta') { const x = act(s, { t: 'rialza', eroe: s.eroi.indexOf(caduti[0]) }, rng); if (x.s) { s = x.s; fatto = true; } }
          if (!fatto && media < .85) { let x = act(s, { t: 'cura', eroe: s.eroi.indexOf(v[0]) }, rng); if (x.err) x = act(s, { t: 'lungo' }, rng); if (x.s) { s = x.s; fatto = true; } }
          if (fatto) continue;
        }
        if (!pronto && !alSicuro) { const dest = sicuri().filter((l) => !puoRialzare || l.tipo === 'citta').reduce((a, l) => (!a || C.dist(l, v[0]) < C.dist(a, v[0])) ? l : a, null); r = dest && vai(dest) || act(s, { t: 'fineTurno' }, rng); }
        else if (unita && v[0].q === meta.q && v[0].r === meta.r) { r = act(s, { t: 'entra' }, rng); if (r.err) r = act(s, { t: 'fineTurno' }, rng); }
        else r = vai(unita ? meta : { q: v[0].q, r: v[0].r }) || act(s, { t: 'fineTurno' }, rng);
      }
    }
    if (r.err) throw new Error('il bot furbo ha fatto una mossa non valida: ' + r.err + ' (seme ' + seed + ', round ' + s.round + ')');
    s = r.s;
  }
  return s;
}
function AZ_CASUALE(s, rng) { const i = Math.floor(rng() * s.eroi.length), v = C.vicini(s.eroi[i].q, s.eroi[i].r), n = v[Math.floor(rng() * 6)], t = ['muovi', 'muovi', 'muovi', 'fineTurno', 'entra', 'lungo', 'avanza'][Math.floor(rng() * 7)]; return { t, eroe: i, q: n.q, r: n.r }; }
if (process.env.DBG) { const s = bot(+process.env.DBG, true, 9); console.log(s.over, s.log.slice(-12).join('\n')); process.exit(0); }
const N = 12; let vinte = 0, giorni = 0; const motivi = {};
for (let i = 1; i <= N; i++) { const s = bot(i, true, 9); assert(s.over, 'il bot furbo finisce, seme ' + i); if (s.over.win) { vinte++; giorni += s.over.giorni; } else motivi[s.over.reason] = (motivi[s.over.reason] || 0) + 1; }
let casVinte = 0; for (let i = 1; i <= N; i++) if ((bot(i, false).over || {}).win) casVinte++;
console.log('campagna: bot furbo ' + vinte + '/' + N + ' vittorie (media ' + (giorni / Math.max(1, vinte)).toFixed(1) + ' giorni), sconfitte: ' + JSON.stringify(motivi) + ', bot casuale ' + casVinte + '/' + N);
assert(vinte >= N * 0.6, 'il bot furbo deve vincere nella maggior parte dei casi: ' + vinte); assert(casVinte <= 1, 'il bot casuale deve perdere quasi sempre');
console.log('campagna ok');
