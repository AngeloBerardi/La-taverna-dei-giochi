// Musica e suoni della Compagnia di ventura (V7): quattro temi ben formati e diversi da quelli dell'Avventura, partiture valide e brevi, tabelle che coprono
// ogni evento del mondo e del campo, ogni azione e ogni ordine (letti dal sorgente), il contesto, il limite dei suoni in mischia, nessun suono `avv-` in prestito.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const VAUD = require('../src/js/motori/28n-ven-audio.js');
const AAUD = require('../src/js/motori/28c-avv-audio.js');
const C = carica.multi(['27a-avv-dadi.js', '28j-ven-dati.js', '28l-ven-campo.js'], 'VCAM');
const SRC = (f) => fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8');
const audioApp = SRC('app/03-audio.js');
const esistenti = new Set([...audioApp.matchAll(/case'([a-z0-9]+)'/g)].map((m) => m[1]));
const TUTTI = new Set([...Object.keys(VAUD.SUONI), ...VAUD.ESISTENTI]);

// ---- motore puro ----
{ const src = SRC('motori/28n-ven-audio.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert(!/Math\.random|Date\.now|new Date|require\(/.test(src), '28n: niente caso, orologio o altri motori'); }

// ---- 1. le tracce ----
{ const T = VAUD.TRACCE, nomi = Object.keys(T);
  assert.deepStrictEqual(nomi.slice().sort(), ['ven-battaglia', 'ven-citta', 'ven-notte', 'ven-viaggio']);
  const LEAD = ['bell', 'pluck', 'flute', 'brass'], DRUM = ['tav', 'march', 'anvil', 'epic'];
  for (const n of nomi) { const t = T[n];
    assert(t.sd >= .1 && t.sd <= .3, n + ': tempo'); assert([4, 6, 8].includes(t.bar), n + ': passi per battuta');
    const battuta = t.sd * t.bar; assert(battuta >= .8 && battuta <= 1.6, n + ': battuta di ' + battuta.toFixed(2) + ' s');
    assert.strictEqual(t.prog.length, 8, n + ': otto accordi');
    for (const [r, m] of t.prog) { assert(Number.isInteger(r) && r >= 28 && r <= 62, n + ': radice ' + r); assert(m === 0 || m === 1, n + ': modo'); }
    assert.strictEqual(t.arp.length, t.bar, n + ': arpeggio'); assert(t.arp.every((k) => Number.isInteger(k) && k >= 0 && k <= 4));
    assert(LEAD.includes(t.lead) && DRUM.includes(t.drum), n + ': strumenti');
    assert.strictEqual(t.mel.length, 8, n + ': otto battute');
    t.mel.forEach((riga, b) => { assert.strictEqual(riga.length, t.bar, n + ' b' + b + ': ' + t.bar + ' note'); assert(riga.some((m) => m > 0), n + ' b' + b + ': vuota');
      for (const m of riga) { if (!m) continue; const suona = t.lead === 'flute' || t.lead === 'pluck' ? m + 12 : m; assert(Number.isInteger(m) && suona >= 50 && suona <= 100, n + ' b' + b + ': nota ' + m); } });
    // chiude sulla radice: l'ultima battuta ha al più due note e la prima è la tonica del primo accordo (a ottave)
    const ult = t.mel[7].filter((m) => m > 0); assert(ult.length <= 2, n + ': chiude con una nota lunga'); assert.strictEqual((ult[0] - t.prog[0][0]) % 12, 0, n + ': chiude sulla radice'); }
  // carattere chiesto dalla scheda
  assert(T['ven-notte'].mel.every((r) => r.filter((m) => m > 0).length <= 2), 'notte: due note al più per battuta');
  assert(T['ven-citta'].mel.slice(0, 7).every((r) => r.filter((m) => m > 0).length >= 4), 'città: almeno quattro note per battuta');
  assert.strictEqual(T['ven-citta'].prog[0][1], 1, 'città in maggiore'); assert.strictEqual(T['ven-battaglia'].prog[0][1], 0, 'battaglia in minore');
  assert.deepStrictEqual([T['ven-notte'].lead, T['ven-citta'].lead, T['ven-battaglia'].lead], ['bell', 'pluck', 'brass']);
  assert.deepStrictEqual([T['ven-notte'].drum, T['ven-citta'].drum, T['ven-battaglia'].drum], ['tav', 'tav', 'epic']);
  // tutte diverse tra loro e dalle otto dell'Avventura (progressione e melodia)
  const tutte = [...nomi.map((n) => T[n]), ...Object.values(AAUD.TRACCE)];
  assert.strictEqual(Object.keys(AAUD.TRACCE).length, 8);
  assert.strictEqual(new Set(tutte.map((t) => JSON.stringify(t.prog))).size, 12, 'progressioni tutte diverse');
  assert.strictEqual(new Set(tutte.map((t) => JSON.stringify(t.mel))).size, 12, 'melodie tutte diverse');
  for (const n of nomi) assert(!new RegExp('(^|[\\s,{])' + n.replace('-', '\\-') + ':').test(audioApp), n + ' esiste già in 03-audio.js'); }

// ---- 2. le partiture: solo le primitive di 28c, brevi ----
{ const OSC = ['sine', 'square', 'sawtooth', 'triangle'], FILTRI = ['lowpass', 'highpass', 'bandpass'], CODA = { bell: 1.4, pluck: .8, timp: 1.1 };
  const fra = (x, a, b, msg) => assert(typeof x === 'number' && x >= a && x <= b, msg + ' = ' + x);
  const ATTESE = ['ven-passi', 'ven-zoccoli', 'ven-mercato', 'ven-moneta', 'ven-porta', 'ven-alba', 'ven-corno', 'ven-cozzo', 'ven-freccia', 'ven-grido', 'ven-rotta', 'ven-vittoria', 'ven-sconfitta'];
  assert.deepStrictEqual(Object.keys(VAUD.SUONI).sort(), ATTESE.slice().sort(), 'tredici suoni');
  const durata = {};
  for (const [nome, P] of Object.entries(VAUD.SUONI)) { assert(!esistenti.has(nome), nome + ' ha il nome di un suono di Snd'); assert(Array.isArray(P) && P.length >= 2, nome);
    let fine = 0;
    for (const n of P) { const w = nome + ' ' + JSON.stringify(n); fra(n.t, 0, 1.5, w + ' ritardo'); fra(n.v, .005, .9, w + ' volume'); assert(!('o' in n), w + ': opzioni sulla nota, non in `o`'); let d = 0;
      switch (n.k) {
        case 'osc': assert(OSC.includes(n.w), w); fra(n.f, 20, 9000, w); fra(n.d, .03, 3, w); d = n.d; if (n.sl != null) fra(n.sl, 20, 9000, w); if (n.lp != null) fra(n.lp, 100, 12000, w); break;
        case 'noise': assert(FILTRI.includes(n.ty), w); fra(n.f, 100, 12000, w); fra(n.d, .02, 2, w); d = n.d; if (n.sw != null) fra(n.sw, 20, 12000, w); break;
        case 'bell': case 'pluck': fra(n.m, 20, 110, w); d = CODA[n.k]; break;
        case 'flute': case 'brass': fra(n.m, 20, 110, w); fra(n.d, .1, 2, w); d = n.d; break;
        case 'timp': fra(n.f, 25, 200, w); d = CODA.timp; break;
        case 'pad': assert(Array.isArray(n.m) && n.m.length >= 2 && n.m.length <= 4, w); fra(n.d, .3, 3, w); d = n.d; break;
        default: assert.fail('primitiva sconosciuta ' + w); }
      fine = Math.max(fine, n.t + d); }
    durata[nome] = fine;
    if (nome === 'ven-vittoria') assert(fine < 1.5, 'vittoria: ' + fine);
    else if (nome === 'ven-sconfitta') assert(fine < 2, 'sconfitta: ' + fine);
    else { assert(fine <= .8, nome + ' dura ' + fine.toFixed(2) + ' s'); assert(P.length <= 6, nome + ': ' + P.length + ' primitive'); } }
  const V = VAUD.SUONI['ven-vittoria'], ott = V.filter((n) => n.k === 'brass').map((n) => n.m);
  assert.strictEqual(ott.length, 4, 'vittoria: quattro ottoni'); assert(ott.every((m, i) => !i || m > ott[i - 1]), 'vittoria: salgono'); assert(V.some((n) => n.k === 'timp'), 'vittoria: timpano');
  const S = VAUD.SUONI['ven-sconfitta'], fl = S.filter((n) => n.k === 'flute').map((n) => n.m);
  assert.strictEqual(fl.length, 3, 'sconfitta: tre flauti'); assert(fl.every((m, i) => !i || m < fl[i - 1]), 'sconfitta: scendono'); assert(S.some((n) => n.k === 'pad'), 'sconfitta: pad');
  for (const n of VAUD.ESISTENTI) assert(esistenti.has(n), n + ' non ha il suo case in 03-audio.js'); }

// ---- 3. tabelle: ogni nome esiste ----
{ const prova = (v, ...a) => { const x = typeof v === 'function' ? v(...a) : v; if (x != null) assert(TUTTI.has(x), 'suono inesistente: ' + x); };
  for (const v of Object.values(VAUD.LOG)) prova(v);
  const finti = [{ tipo: 'guerra' }, { tipo: '' }, { faz: 'tu' }, { faz: 'x' }, { out: { vince: 'a' } }, { out: { vince: 'b' } }, { via: 1 }, {}];
  for (const v of Object.values(VAUD.MONDO)) for (const e of finti) prova(v, e);
  const cf = [{ dan: 5, crit: true }, { dan: 5, freccia: true }, { dan: 0 }, { dan: 3, da: 7 }, { cap: true }, { l: 'a', o: 'carica' }, { vince: 'a' }, { vince: 'b' }];
  for (const v of Object.values(VAUD.CAMPO)) for (const e of cf) prova(v, e, 7);
  for (const v of Object.values(VAUD.FAI)) prova(v);
  for (const v of Object.values(VAUD.ORDINE)) { prova(v, {}, true); prova(v, {}, false); }
  for (const k of Object.keys(VAUD.PAUSA)) assert(VAUD.SUONI[k], 'pausa di un suono che non c\'è: ' + k);
  assert.deepStrictEqual(VAUD.PAUSA, { 'ven-cozzo': 120, 'ven-freccia': 180, 'ven-corno': 900, 'ven-passi': 400, 'ven-zoccoli': 400 }); }

// ---- 4. copertura letta dal sorgente ----
{ const MON = carica.VEN_FILES.filter(f => /^28k/.test(f)).map(f => SRC('motori/' + f)).join('\n'), CAM = SRC('motori/28l-ven-campo.js');
  const ev = (src) => new Set([...src.matchAll(/ev\.push\(\{t:'([a-z-]+)'/g)].map((m) => m[1]));
  const em = ev(MON), ec = ev(CAM), verbi = new Set([...MON.matchAll(/z\.a==='([a-z]+)'/g)].map((m) => m[1]));
  const corpo = MON.slice(MON.indexOf('function ordina('), MON.indexOf('\n', MON.indexOf('function ordina(') + 1500));
  const ordini = new Set([...corpo.matchAll(/o\.t==='([a-z]+)'/g)].map((m) => m[1]));
  for (const t of em) assert(t in VAUD.MONDO, 'evento del mondo senza voce: ' + t);
  for (const t of ec) assert(t in VAUD.CAMPO, 'evento del campo senza voce: ' + t);
  for (const v of verbi) assert(v in VAUD.FAI, 'azione senza voce: ' + v);
  for (const o of ordini) assert(o in VAUD.ORDINE, 'ordine senza voce: ' + o);
  assert(verbi.size >= 40, 'verbi letti: ' + verbi.size); assert.strictEqual(ordini.size, 5, 'ordini letti: ' + [...ordini]);
  assert(ec.has('colpo') && ec.has('tiro') && em.has('incontro'), 'lettura del sorgente'); }

// ---- 5. contesto e traccia ----
{ const s = { dentro: -1, p: [{ ord: null }] };
  assert.strictEqual(VAUD.contesto(s, false, false), 'viaggio');
  assert.strictEqual(VAUD.contesto(s, false, true), 'notte');
  assert.strictEqual(VAUD.contesto({ dentro: -1, p: [{ ord: { t: 'aspetta' } }] }, false, false), 'notte', 'chi aspetta si accampa');
  assert.strictEqual(VAUD.contesto({ dentro: 3, p: [{ ord: null }] }, false, true), 'citta', 'la città vince sulla notte');
  assert.strictEqual(VAUD.contesto({ dentro: 3, p: [{ ord: { t: 'aspetta' } }] }, true, true), 'battaglia', 'la battaglia vince su tutto');
  for (const c of ['viaggio', 'notte', 'citta', 'battaglia']) { assert.strictEqual(VAUD.traccia(c), 'ven-' + c); assert(VAUD.TRACCE[VAUD.traccia(c)]); } }

// ---- 6. le funzioni ----
{ const nomi = (l) => l.map((x) => x.n);
  assert.deepStrictEqual(nomi(VAUD.mondo([{ t: 'incontro' }, { t: 'incontro' }, { t: 'giorno' }, { t: 'log', tipo: 'bene' }, { t: 'log', tipo: 'guerra' }])), ['ven-corno', 'ven-alba'], 'niente doppioni');
  assert.deepStrictEqual(nomi(VAUD.mondo([{ t: 'esito', out: { vince: 'a' } }])), ['ven-vittoria']); assert.deepStrictEqual(nomi(VAUD.mondo([{ t: 'esito', out: { vince: 'b' } }])), ['ven-sconfitta']);
  assert.deepStrictEqual(nomi(VAUD.mondo([{ t: 'conquista', faz: 'fer' }, { t: 'libero' }, { t: 'sconosciuto' }])), []);
  assert.deepStrictEqual(nomi(VAUD.campo([{ t: 'colpo', dan: 4, da: 1, a: 2 }], 9)), [], 'colpo qualunque: silenzio');
  assert.deepStrictEqual(nomi(VAUD.campo([{ t: 'colpo', dan: 4, da: 9, a: 2 }], 9)), ['ven-cozzo'], 'colpo del capitano');
  assert.deepStrictEqual(nomi(VAUD.campo([{ t: 'colpo', dan: 4, crit: true, freccia: true }], 9)), [], 'la freccia suona al tiro');
  assert.deepStrictEqual(nomi(VAUD.campo([{ t: 'colpo', dan: 0, crit: true }], 9)), []);
  assert.deepStrictEqual(nomi(VAUD.campo([{ t: 'ordine', l: 'b', o: 'carica' }, { t: 'ordine', l: 'a', o: 'tieni' }])), []);
  assert.deepStrictEqual(nomi(VAUD.campo([{ t: 'ordine', l: 'a', o: 'carica' }])), ['ven-corno']);
  const tanti = VAUD.campo([{ t: 'tiro' }, { t: 'colpo', dan: 3, crit: true }, { t: 'grido' }, { t: 'ko', cap: true }, { t: 'fine', vince: 'a' }]);
  assert.strictEqual(tanti.length, 3); assert(nomi(tanti).includes('ven-vittoria'), 'la fine passa sempre');
  assert.deepStrictEqual(nomi(VAUD.fai('compra')), ['ven-mercato']); assert.deepStrictEqual(nomi(VAUD.fai('aduna')), []); assert.deepStrictEqual(nomi(VAUD.fai('???')), []);
  assert.deepStrictEqual(nomi(VAUD.ordine({ t: 'vai' }, true)), ['ven-zoccoli']); assert.deepStrictEqual(nomi(VAUD.ordine({ t: 'entra' }, false)), ['ven-passi']);
  assert.deepStrictEqual(nomi(VAUD.ordine({ t: 'aspetta' }, true)), []);
  for (const l of [VAUD.mondo([{ t: 'giorno' }]), VAUD.fai('vendi'), VAUD.ordine({ t: 'segui' })]) for (const x of l) assert(typeof x.r === 'number' && x.r >= 0); }

// ---- 7. una mischia di 300 istanti: mai più di tre suoni per istante, cozzi e frecce ci sono ----
{ const T = (p, o) => Object.keys(o).map((t) => ({ p, t, n: o[t] }));
  const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
  const s = C.nuovo({ seme: 5, a: T(0, { val_f2: 12, val_t2: 8, val_c3: 4 }), b: T(5, { val_f2: 12, val_t2: 8, val_c3: 4 }), cap, faza: 'tu', fazb: 'fer' }, { autoA: true });
  const capId = s.capi && s.capi.length ? s.capi[0] : -1; const conta = {};
  for (let i = 0; i < 300 && !s.fine; i++) { const ev = C.passo(s, 1); const l = VAUD.campo(ev, capId); assert(l.length <= VAUD.MAX_CAMPO, 'troppi suoni: ' + l.length);
    for (const x of l) conta[x.n] = (conta[x.n] || 0) + 1; }
  assert(conta['ven-cozzo'] >= 1, 'nessun cozzo: ' + JSON.stringify(conta)); assert(conta['ven-freccia'] >= 1, 'nessuna freccia: ' + JSON.stringify(conta)); }

// ---- 8. niente suoni dell'Avventura in prestito nei file della Ventura ----
for (const f of ['app/24hw-ventura.js', 'app/24hv-ven-campo.js', 'app/24hx-ven-stanza.js', 'app/24hy-ven-audio.js', 'motori/28n-ven-audio.js']) {
  const p = path.join(__dirname, '../src/js', f); assert(fs.existsSync(p), 'manca ' + f);
  assert(!/['"`]avv-/.test(fs.readFileSync(p, 'utf8')), f + ': usa ancora un suono avv-'); }

console.log('ok ven_audio');
