// Musica e suoni dell'Avventura (A10): le otto tracce sono ben formate e diverse, ogni contesto ha la sua musica, ogni passo di battaglia e ogni azione che deve suonare suona,
// le partiture dei suoni sono valide e ogni tipo di danno ha il suo suono. Il browser (Snd, AudioContext) si prova in tools/test-browser/ (scenario avv_sessione).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const E = require('../src/js/motori/27-eroi.js');
global.EROI = E;
const AAUD = require('../src/js/motori/28c-avv-audio.js');
const AVV = require('../src/js/motori/28a-avv-orchestratore.js');
const ACRO = require('../src/js/motori/27k-avv-cronaca.js');
const ASTA = require('../src/js/motori/27d-avv-stati.js');
const IA = require('../src/js/motori/27j-avv-ia.js');
const C = require('../src/js/motori/27i-avv-scontro.js');
const { squadra, battaglia } = require('./avv_aiuti.js');
const cap = require('../src/avventura/corona.json');
const copia = (x) => JSON.parse(JSON.stringify(x));
const SRC = (f) => fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8');
const audioApp = SRC('app/03-audio.js');
const esistenti = new Set([...audioApp.matchAll(/case'([a-z0-9]+)'/g)].map((m) => m[1]));
const TUTTI = new Set([...Object.keys(AAUD.SUONI), ...AAUD.ESISTENTI]);

// ---- 1. le tracce: stesso formato di quelle di Snd, otto, tutte diverse ----
{ const T = AAUD.TRACCE, nomi = Object.keys(T);
  assert.deepStrictEqual(nomi.sort(), ['avv-battaglia', 'avv-capo', 'avv-citta', 'avv-giorno', 'avv-notte', 'avv-sconfitta', 'avv-sotterraneo', 'avv-vittoria']);
  const LEAD = ['bell', 'pluck', 'flute', 'brass'], DRUM = ['tav', 'march', 'anvil', 'epic'];
  for (const n of nomi) { const t = T[n];
    assert(t.sd >= .1 && t.sd <= .3, n + ': tempo di un passo');
    assert([4, 6, 8].includes(t.bar), n + ': passi per battuta');
    const battuta = t.sd * t.bar; assert(battuta >= .8 && battuta <= 1.6, n + ': battuta di ' + battuta.toFixed(2) + ' s');
    assert.strictEqual(t.prog.length, 8, n + ': otto accordi');
    for (const [r, m] of t.prog) { assert(Number.isInteger(r) && r >= 28 && r <= 62, n + ': radice ' + r); assert(m === 0 || m === 1, n + ': modo'); }
    assert.strictEqual(t.arp.length, t.bar, n + ': arpeggio lungo una battuta'); assert(t.arp.every((k) => Number.isInteger(k) && k >= 0 && k <= 4), n + ': indici dell\'arpeggio');
    assert(LEAD.includes(t.lead), n + ': strumento solista'); assert(DRUM.includes(t.drum), n + ': percussioni');
    assert.strictEqual(t.mel.length, 8, n + ': otto battute di melodia');
    t.mel.forEach((riga, b) => { assert.strictEqual(riga.length, t.bar, n + ' b' + b + ': ' + t.bar + ' note'); assert(riga.some((m) => m > 0), n + ' b' + b + ': almeno una nota');
      for (const m of riga) { if (!m) continue; const suona = t.lead === 'flute' || t.lead === 'pluck' ? m + 12 : m; assert(Number.isInteger(m) && suona >= 50 && suona <= 100, n + ' b' + b + ': nota ' + m + ' fuori registro'); } });
    // la melodia comincia e finisce sulla toccata di casa, come le altre tracce: l'ultima battuta ha una sola nota o pochissime
    assert(t.mel[7].filter((m) => m > 0).length <= 2, n + ': chiude con una nota lunga'); }
  const firme = nomi.map((n) => JSON.stringify([T[n].prog, T[n].mel])); assert.strictEqual(new Set(firme).size, nomi.length, 'tracce tutte diverse');
  assert.strictEqual(new Set(nomi.map((n) => JSON.stringify(T[n].mel))).size, nomi.length, 'melodie tutte diverse');
  // nessuna ruba il nome di una traccia che Snd ha già
  for (const n of nomi) assert(!new RegExp('(^|[\\s,{])' + n.replace('-', '\\-') + ':').test(audioApp), n + ' esiste già in 03-audio.js');
  // carattere: la notte è più lenta del giorno, la battaglia è più veloce della mappa, il capo è più pesante (percussioni a incudine), la sconfitta la più lenta e breve
  assert(T['avv-notte'].sd > T['avv-giorno'].sd); assert(T['avv-battaglia'].sd < T['avv-giorno'].sd); assert.strictEqual(T['avv-capo'].drum, 'anvil'); assert(T['avv-sconfitta'].sd >= Math.max(...nomi.map((n) => T[n].sd)) - 1e-9);
  assert(T['avv-sconfitta'].prog.slice(0, 4).filter(([, m]) => m === 0).length >= 2, 'la sconfitta è in minore'); }

// ---- 2. quale traccia ----
{ const t = AAUD.traccia;
  assert.strictEqual(t({ fase: 'mappa', notte: false }), 'avv-giorno'); assert.strictEqual(t({ fase: 'mappa', notte: true }), 'avv-notte'); assert.strictEqual(t(), 'avv-giorno', 'senza contesto');
  assert.strictEqual(t({ fase: 'citta', notte: true }), 'avv-citta', 'in città di notte è sempre la città'); assert.strictEqual(t({ fase: 'dialogo', luogo: 'villaggio' }), 'avv-citta', 'anche nei dialoghi');
  assert.strictEqual(t({ fase: 'dialogo', luogo: null, notte: true }), 'avv-notte');
  assert.strictEqual(t({ fase: 'sotterraneo', dentro: true, notte: true }), 'avv-sotterraneo'); assert.strictEqual(t({ fase: 'dialogo', dentro: true }), 'avv-sotterraneo');
  assert.strictEqual(t({ fase: 'battaglia' }), 'avv-battaglia'); assert.strictEqual(t({ fase: 'battaglia', capo: true, dentro: true }), 'avv-capo', 'la battaglia vince sul sotterraneo');
  assert.strictEqual(t({ fase: 'battaglia', esito: 'vittoria', capo: true }), 'avv-vittoria'); assert.strictEqual(t({ fase: 'mappa', esito: 'sconfitta' }), 'avv-sconfitta');
  for (const c of [{}, { fase: 'mappa', notte: true }, { fase: 'battaglia', capo: true }, { fase: 'citta' }, { dentro: true }, { esito: 'vittoria' }, { esito: 'sconfitta' }]) assert(AAUD.TRACCE[t(c)], 'traccia che esiste: ' + JSON.stringify(c)); }

// ---- 3. il contesto letto da uno stato vero ----
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base, slot) => Object.assign(E.nuovo({ nome, classe, razza, aspetto: A, base: { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8, ...base } }), { slot });
const gruppo = () => [mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }, 'e1'), mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }, 'e2')];
const nuova = (seme) => AVV.nuova(cap, gruppo(), seme || 3, { avvio: false });
{ const s = nuova(); const c0 = AAUD.contesto(s);
  assert.strictEqual(c0.fase, AVV.fase(s)); assert.strictEqual(c0.dentro, false); assert.strictEqual(c0.notte, false); assert.strictEqual(c0.capo, false); assert.strictEqual(c0.esito, null);
  assert(['avv-giorno', 'avv-citta'].includes(AAUD.traccia(c0)), 'si parte di giorno: ' + AAUD.traccia(c0));
  const n = copia(s); n.camp.fase = 'notte'; assert.strictEqual(AAUD.contesto(n).notte, true);
  const d = copia(s); d.camp.dentro = 'luogo-x'; assert.strictEqual(AAUD.contesto(d).dentro, true); assert.strictEqual(AAUD.traccia(AAUD.contesto(d)), 'avv-sotterraneo');
  const bat = (esito, def) => ({ cb: [{ lato: 'eroi', def: 'x' }, { lato: 'nemici', def: def || 'tagliagole' }], over: esito ? { esito } : null });
  assert.strictEqual(AAUD.traccia(AAUD.contesto(s, bat())), 'avv-battaglia'); assert.strictEqual(AAUD.contesto(s, bat()).fase, 'battaglia');
  assert.strictEqual(AAUD.traccia(AAUD.contesto(s, bat(null, 're-senza-corona'))), 'avv-capo'); assert.strictEqual(AAUD.contesto(s, bat(null, 're-senza-corona')).capo, true);
  assert.strictEqual(AAUD.traccia(AAUD.contesto(s, bat('vittoria'))), 'avv-vittoria'); assert.strictEqual(AAUD.traccia(AAUD.contesto(s, bat('sconfitta', 're-senza-corona'))), 'avv-sconfitta');
  assert.strictEqual(AAUD.traccia(AAUD.contesto(s, bat('fuga'))), 'avv-battaglia', 'la fuga non ha un suo stacco');
  assert.strictEqual(AAUD.traccia(AAUD.contesto(null, bat())), 'avv-battaglia', 'battaglia di prova, senza campagna'); assert.strictEqual(AAUD.traccia(AAUD.contesto(null, null)), 'avv-giorno');
  const v = copia(s); v.fine = { esito: 'ok', vinta: true }; assert.strictEqual(AAUD.traccia(AAUD.contesto(v)), 'avv-vittoria');
  const p = copia(s); p.fine = { esito: 'persa', vinta: false }; assert.strictEqual(AAUD.traccia(AAUD.contesto(p)), 'avv-sconfitta');
  assert.deepStrictEqual(AAUD.contesto(s), AAUD.contesto(copia(s)), 'il contesto è una funzione dello stato'); }

// ---- 4. tipi di danno: ognuno ha il suo suono, tutti diversi ----
{ assert.deepStrictEqual(Object.keys(AAUD.TIPO_SUONO).sort(), ASTA.TIPI.slice().sort(), 'un suono per ogni tipo di danno di ASTA.TIPI');
  const nomi = ASTA.TIPI.map((t) => AAUD.TIPO_SUONO[t]); assert.strictEqual(new Set(nomi).size, nomi.length, 'suoni diversi per tipi diversi');
  for (const n of nomi) assert(AAUD.SUONI[n], 'partitura mancante: ' + n);
  for (const t of ASTA.FISICI) assert(/colpo/.test(AAUD.TIPO_SUONO[t]), t + ' è un colpo'); for (const t of ASTA.TIPI.filter((x) => !ASTA.FISICI.includes(x))) assert(/incanto/.test(AAUD.TIPO_SUONO[t]), t + ' è un incanto'); }

// ---- 5. le partiture: note primitive con numeri sensati ----
{ const OSC = ['sine', 'square', 'sawtooth', 'triangle'], FILTRI = ['lowpass', 'highpass', 'bandpass'], CODA = { bell: 1.4, pluck: .8, timp: 1.1 };
  const fra = (x, a, b, msg) => assert(typeof x === 'number' && x >= a && x <= b, msg + ' = ' + x);
  for (const [nome, P] of Object.entries(AAUD.SUONI)) { assert(/^avv-[a-z0-9-]+$/.test(nome), nome); assert(!esistenti.has(nome), nome + ' ha lo stesso nome di un suono di Snd'); assert(Array.isArray(P) && P.length >= 2 && P.length <= 24, nome + ': numero di note');
    let fine = 0, forte = 0;
    for (const n of P) { const w = nome + ' ' + JSON.stringify(n); fra(n.t, 0, 1.5, w + ' ritardo'); fra(n.v, .005, .9, w + ' volume'); let d = 0;
      switch (n.k) {
        case 'osc': assert(OSC.includes(n.w), w); fra(n.f, 20, 9000, w + ' Hz'); fra(n.d, .03, 3, w + ' durata'); d = n.d; if (n.sl != null) fra(n.sl, 20, 9000, w + ' sl'); if (n.lp != null) fra(n.lp, 100, 12000, w + ' lp'); break;
        case 'noise': assert(FILTRI.includes(n.ty), w); fra(n.f, 100, 12000, w + ' Hz'); fra(n.d, .02, 2, w + ' durata'); d = n.d; if (n.sw != null) fra(n.sw, 20, 12000, w + ' sw'); break;
        case 'bell': case 'pluck': fra(n.m, 20, 110, w + ' nota'); d = CODA[n.k]; break;
        case 'flute': case 'brass': fra(n.m, 20, 110, w + ' nota'); fra(n.d, .1, 2, w + ' durata'); d = n.d; break;
        case 'timp': fra(n.f, 25, 200, w + ' Hz'); d = CODA.timp; break;
        case 'pad': assert(Array.isArray(n.m) && n.m.length >= 2 && n.m.length <= 4 && n.m.every((m) => m >= 20 && m <= 110), w); fra(n.d, .3, 3, w + ' durata'); d = n.d; break;
        default: assert.fail('nota sconosciuta ' + w); }
      fine = Math.max(fine, n.t + d); forte = Math.max(forte, n.v); }
    assert(fine <= 3.3, nome + ' dura ' + fine.toFixed(2) + ' s');
    // un passo non deve coprire la musica: i suoni brevi (passo, dado, colpi) restano entro 1,6 s, porta e scrigno (con la coda delle campane) entro 2,3 s
    if (/passo|d20|colpo|mancato|parata|stato|cade/.test(nome)) assert(fine <= 1.6, nome + ' troppo lungo per un effetto di gioco: ' + fine.toFixed(2));
    if (/porta|scrigno/.test(nome)) assert(fine <= 2.3, nome + ' troppo lungo: ' + fine.toFixed(2)); }
  // ogni effetto di Snd riusato esiste (altrimenti `Snd.play` non suona nulla)
  for (const n of AAUD.ESISTENTI) assert(esistenti.has(n), n + ' non esiste in 03-audio.js'); }

// ---- 6. i passi della battaglia ----
const nomi = (l) => l.map((x) => x.n);
{ const p = AAUD.passo;
  assert.deepStrictEqual(p(), []); assert.deepStrictEqual(p({ t: 'hp', d: -3 }), [], 'i passi che non suonano'); assert.deepStrictEqual(p({ t: 'scossa' }), []); assert.deepStrictEqual(p({ t: 'giro', n: 2 }), []);
  assert.deepStrictEqual(p({ t: 'sposta', passi: [1, 2, 3] }), [{ n: 'avv-passo', r: 0 }, { n: 'avv-passo2', r: 150 }, { n: 'avv-passo', r: 300 }], 'passi alternati');
  assert.strictEqual(p({ t: 'sposta', passi: new Array(12).fill(0) }).length, 4, 'al massimo quattro passi'); assert.strictEqual(p({ t: 'sposta' }).length, 1);
  assert.deepStrictEqual(nomi(p({ t: 'dado', ok: true })), ['avv-d20']); assert.deepStrictEqual(nomi(p({ t: 'dado', ok: true, crit: true })), ['avv-d20', 'avv-critico']); assert.deepStrictEqual(nomi(p({ t: 'dado', ok: false })), ['avv-d20', 'avv-mancato']);
  assert.deepStrictEqual(nomi(p({ t: 'dado', ok: true, salvezza: true })), ['avv-d20', 'avv-parata']); assert.deepStrictEqual(nomi(p({ t: 'dado', ok: false, salvezza: true })), ['avv-d20']);
  assert.deepStrictEqual(nomi(p({ t: 'dado', ok: false, crit: true })), ['avv-d20', 'avv-mancato'], 'un critico che non colpisce non esiste');
  for (const tipo of ASTA.TIPI) assert.deepStrictEqual(nomi(p({ t: 'numero', v: -5, tipo })), [AAUD.TIPO_SUONO[tipo]], 'danno ' + tipo);
  assert.deepStrictEqual(nomi(p({ t: 'numero', v: 6, tipo: 'cura' })), ['heal']); assert.deepStrictEqual(nomi(p({ t: 'numero', v: 5, tipo: 'temp' })), ['avv-parata']); assert.deepStrictEqual(p({ t: 'numero', v: -3, tipo: 'sconosciuto' }), []); assert.deepStrictEqual(p({ t: 'numero', v: 0, tipo: 'taglio' }), []);
  assert.deepStrictEqual(nomi(p({ t: 'stato', ok: true })), ['avv-stato']); assert.deepStrictEqual(p({ t: 'stato', ok: false }), []);
  assert.deepStrictEqual(nomi(p({ t: 'cade' })), ['avv-cade']); assert.deepStrictEqual(nomi(p({ t: 'esce', come: 'muore' })), ['avv-cade']); assert.deepStrictEqual(p({ t: 'esce', come: 'fugge' }), []); assert.deepStrictEqual(p({ t: 'esce', come: 'arreso' }), []);
  assert.deepStrictEqual(nomi(p({ t: 'fine', esito: 'vittoria' })), ['avv-fanfara']); assert.deepStrictEqual(nomi(p({ t: 'fine', esito: 'sconfitta' })), ['avv-lamento']); assert.deepStrictEqual(p({ t: 'fine', esito: 'fuga' }), []); assert.deepStrictEqual(p({ t: 'fine', esito: 'stallo' }), []); }

// ---- 7. battaglie vere: ogni passo che esce da ACRO.effetti suona nomi che esistono, e una battaglia ha dadi, colpi e uno stacco finale ----
{ const visti = new Set(), per = {}; let finali = 0, passi = 0;
  for (const seme of [3, 4, 5, 6, 7, 8]) { const squad = squadra(3, 3), nem = seme % 2 ? ['tagliagole', 'tagliagole', 'lupo-grigio'] : ['capobanda-corvino', 'tagliagole'];
    let x = battaglia(squad, nem, { seme }); let guardia = 0;
    while (!x.over && guardia++ < 400) { const a = C.attore(x), r = C.act(x, IA.prossima(x, { livello: a.lato === 'eroi' ? 'eroica' : 'normale' })); assert(r.s, 'azione del bot: ' + (r.err || JSON.stringify(r.pausa))); x = r.s;
      for (const ev of r.ev || []) for (const st of ACRO.effetti(ev, x)) { passi++; const l = AAUD.passo(st); per[st.t] = (per[st.t] || 0) + l.length;
        for (const s of l) { assert(TUTTI.has(s.n), 'suono inesistente: ' + s.n + ' per ' + JSON.stringify(st)); assert(Number.isInteger(s.r) && s.r >= 0 && s.r < 1500, 'ritardo ' + s.r); visti.add(s.n); } assert(l.length <= 5, 'troppi suoni in un passo'); } }
    const ultimo = AAUD.passo({ t: 'fine', esito: x.over && x.over.esito }); if (x.over && ['vittoria', 'sconfitta'].includes(x.over.esito)) { assert.strictEqual(ultimo.length, 1); finali++; } }
  assert(passi > 100, 'battaglie vere: ' + passi + ' passi'); assert(finali >= 4, 'lo stacco finale: ' + finali);
  for (const n of ['avv-d20', 'avv-passo']) assert(visti.has(n), 'mai suonato ' + n);
  assert([...visti].some((n) => /colpo|incanto/.test(n)), 'almeno un colpo o un incanto'); assert([...visti].some((n) => n === 'avv-cade'), 'qualcuno cade');
  assert(per.dado > 0 && per.sposta > 0 && per.numero > 0, JSON.stringify(per)); }

// ---- 8. le azioni della sessione: dal confronto fra lo stato di prima e quello di dopo ----
{ const az = AAUD.azione, camp = (a) => ({ t: 'camp', a });
  const s = nuova(), u = (f) => { const d = copia(s); f(d); return d; };
  assert.deepStrictEqual(az(), []); assert.deepStrictEqual(az(camp({ t: 'tira' }), null, s), []); assert.deepStrictEqual(az(camp({ t: 'inesistente' }), s, copia(s)), [], 'una cosa che non suona');
  assert.deepStrictEqual(nomi(az(camp({ t: 'tira' }), s, copia(s))), ['avv-d20']); assert.deepStrictEqual(nomi(az(camp({ t: 'muovi' }), s, copia(s))), ['avv-passo', 'avv-passo2', 'avv-passo']);
  assert.deepStrictEqual(nomi(az(camp({ t: 'entra' }), s, copia(s))), ['avv-porta']); assert.deepStrictEqual(nomi(az(camp({ t: 'esci' }), s, copia(s))), ['avv-porta']);
  assert.deepStrictEqual(nomi(az(camp({ t: 'cura' }), s, copia(s))), ['heal']); assert.deepStrictEqual(nomi(az(camp({ t: 'equipa' }), s, copia(s))), ['sel']);
  // il giorno nuovo: alba solo se il giorno cambia davvero
  assert.deepStrictEqual(az(camp({ t: 'lungo' }), s, copia(s)), []); assert.deepStrictEqual(nomi(az(camp({ t: 'lungo' }), s, u((d) => { d.camp.giorno++; }))), ['avv-alba']);
  // monete e bottino
  assert.deepStrictEqual(nomi(az(camp({ t: 'compra' }), s, copia(s))), ['coin'], 'comprare suona, anche se il saldo scende'); assert.deepStrictEqual(nomi(az(camp({ t: 'vendi' }), s, u((d) => { d.camp.oro += 10; }))), ['coin'], 'una moneta sola');
  assert.deepStrictEqual(nomi(az(camp({ t: 'risolvi' }), s, u((d) => { d.camp.oro += 25; }))), ['avv-d20', 'coin'], 'oro trovato');
  assert.deepStrictEqual(nomi(az(camp({ t: 'avanza' }), s, u((d) => { d.camp.eroi[0].zaino.push('razione'); }))), ['avv-porta', 'avv-scrigno'], 'oggetto trovato');
  assert.deepStrictEqual(nomi(az(camp({ t: 'equipa' }), s, u((d) => { d.camp.eroi[0].zaino.push('razione'); }))), ['sel'], 'passare un oggetto da una mano all\'altra non è un bottino');
  // vite, livelli, compagni
  assert.deepStrictEqual(nomi(az({ t: 'esito' }, s, u((d) => { d.vite--; }))), ['avv-vita']); assert(nomi(az(camp({ t: 'xp' }), s, u((d) => { d.camp.eroi[1].liv++; }))).includes('avv-livello'), 'livello');
  assert(nomi(az({ t: 'racconto', a: { t: 'scegli' } }, s, u((d) => { d.camp.eroi.push(copia(d.camp.eroi[1])); }))).includes('avv-compagno'));
  assert(nomi(az({ t: 'compagnia' }, s, u((d) => { d.camp.eroi.push(copia(d.camp.eroi[1])); }))).includes('avv-compagno'));
  // una prova del racconto: dado e poi esito (riuscita, fallita, perfetta)
  const prova = (o) => u((d) => { d.racc.ultima = Object.assign({ eroe: 'Aldo', ab: 'des', cd: 12, tiro: 10, tot: 12, ok: true, critico: false, fallimento: false }, o); });
  assert.deepStrictEqual(nomi(az({ t: 'racconto', a: { t: 'scegli' } }, s, prova({}))), ['avv-d20', 'ok']); assert.deepStrictEqual(nomi(az({ t: 'racconto', a: { t: 'scegli' } }, s, prova({ ok: false }))), ['avv-d20', 'err']);
  assert.deepStrictEqual(nomi(az({ t: 'racconto', a: { t: 'scegli' } }, s, prova({ critico: true }))), ['avv-d20', 'avv-critico']);
  const gia = prova({}); assert.deepStrictEqual(az({ t: 'racconto', a: { t: 'continua' } }, gia, copia(gia)), [], 'la stessa prova non suona due volte');
  // missioni
  assert(nomi(az({ t: 'scena' }, s, u((d) => { d.racc.missioni.m1 = { stato: 'attiva' }; }))).includes('avv-missione')); assert(!nomi(az(camp({ t: 'tira' }), s, u((d) => { d.racc.missioni.m1 = { stato: 'attiva' }; }))).includes('avv-missione'), 'la mappa non annuncia missioni');
  // tutto ciò che esce esiste, e i ritardi sono sensati
  for (const x of az(camp({ t: 'risolvi' }), s, u((d) => { d.camp.oro += 5; d.vite--; d.camp.eroi[0].liv++; d.camp.eroi[0].zaino.push('razione'); }))) { assert(TUTTI.has(x.n), x.n); assert(x.r >= 0 && x.r < 2000); }
  // stati veri: una sessione intera di azioni vere non produce mai nomi sconosciuti
  let g = copia(s), suonati = 0;
  for (const a of [camp({ t: 'tira', tutti: true }), camp({ t: 'lungo' }), camp({ t: 'tira', tutti: true }), camp({ t: 'breve' })]) { const r = AVV.act(g, a, cap); if (r.err) continue; for (const x of az(a, g, r.s)) { assert(TUTTI.has(x.n), x.n); suonati++; } g = r.s; }
  assert(suonati >= 1, 'una partita vera suona qualcosa'); }

// ---- 9. regole di casa: niente Math.random nel motore, niente marchi ----
{ const src = SRC('motori/28c-avv-audio.js'), app = SRC('app/24hk-audio-avv.js');
  assert(!/Math\.random/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'niente Math.random nei motori');
  for (const t of [src, app]) assert(!/\b(catan|azul|warhammer|pok[eé]mon|zelda|skyrim|dungeons? ?(&|and|e) ?dragons|d&d|pathfinder)\b/i.test(t), 'niente marchi');
  assert(/AvvAudio\.traccia\(\)/.test(SRC('app/07f-viste-gioco.js')), 'traccia() chiede prima all\'Avventura'); assert(/AvvAudio\.passo\(/.test(SRC('app/24hf-bat-anima.js'))); assert(/AvvAudio\.dopo\(/.test(SRC('app/24hj-sessione.js')));
  const man = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/manifest.json'), 'utf8')).filter((f) => typeof f === 'string'); const i = (f) => man.indexOf('src/js/' + f);
  assert(i('motori/28c-avv-audio.js') > i('motori/28b-avv-rientro.js') && i('app/24hk-audio-avv.js') > i('app/24hj-sessione.js') && i('motori/28c-avv-audio.js') >= 0 && i('app/24hk-audio-avv.js') >= 0, 'manifest'); }

console.log('test_avv_audio: ok');
