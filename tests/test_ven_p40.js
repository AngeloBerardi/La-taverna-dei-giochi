// Passo 40: eserciti dei regni e adunate (28kn). Prove rapide; la partita lunga con il bot è in test_ven_p40_lento.js.
//  (a) nascita: in guerra, entro 5 giorni, un esercito di 3-6 membri con un maresciallo che non è il re; (b) adunata e marcia, il signore lontano resta fuori;
//  (c) scioglimento a DURATA giorni; (d) scontro, incontro e scheda tirano dentro i compagni, il maresciallo per primo; (e) vassallo presente, assente, tre assenze;
//  (f) sovrano: `aduna`; (g) spento non nasce nulla e i salvataggi vecchi girano acceso; più la velocità di marcia e i movimenti di `decidi`.
const assert = require('assert'), fs = require('fs'), path = require('path');
const carica = require('./carica.js');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const { VEN: V, VDAT: D } = carica.multi(F, '({ VEN, VDAT })');
const X = D.ESERCITI, GIORNO = 1440;
const chiave = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const ok = x => { assert(!x.err, x.err); return x; };
const dist = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
// il giorno che scatta: solo i ganci (nessuna paga, nessun passaggio di pace a caso), così la prova controlla da sé la guerra
const gg = (s, n) => { for (let i = 0; i < (n || 1); i++) { s.t = V.giorno(s) * GIORNO; V.ganci('giorno', s); } };
const sigDi = (s, p) => s.sig[p.sig];
const parti = (s, f) => s.p.filter(p => p.k === 'sig' && p.faz === f);
// i signori non re di un regno si radunano in un punto fuori dalle mura; `lontano` ne manda uno a più di RAGGIO caselle
function raduna(s, f, lontano) {
  const M = V.mappaDi(s), re = parti(s, f).find(p => sigDi(s, p).re), P = V._.vicinoOk(M, re.x + 8, re.y), L = V._.vicinoOk(M, P[0] + 20, P[1]);
  const altri = parti(s, f).filter(p => !sigDi(s, p).re);
  altri.forEach((p, i) => { const q = lontano && i === altri.length - 1 ? L : P; p.dentro = -1; p.x = q[0]; p.y = q[1]; p.via = []; p.ia = { st: 'giro', t: 0 }; });
  return { P: { x: P[0], y: P[1] }, lontano: lontano ? altri[altri.length - 1] : null, vicini: lontano ? altri.slice(0, -1) : altri };
}
// un mondo con una sola guerra, sel contro fer, con i signori radunati; restituisce l'esercito di sel appena nato
function mondo(opz) {
  opz = opz || {}; const s = V.nuovo(3); s.tregua = 1e9; s.guerra = {}; s.alleanza = {}; s.guerra[chiave('sel', 'fer')] = true;
  const R = { sel: raduna(s, 'sel', opz.lontano), fer: raduna(s, 'fer') };
  if (opz.servizio) { s.servizio = { faz: 'sel', tipo: 'vas' }; s.rel.sel = 0; }
  if (opz.tu) { const t = V.TU(s); t.x = R.sel.P.x; t.y = R.sel.P.y; }
  let n = 0; while (!(s.eserciti || []).some(e => e.faz === 'sel') && n++ < 40) gg(s);
  const e = (s.eserciti || []).find(x => x.faz === 'sel'); assert(e, 'nasce un esercito di sel entro 40 giorni');
  return { s, e, R, giorni: n, cp: V.part(s, e.capo), mem: e.membri.map(id => V.part(s, id)) };
}

// ---- i numeri ----
assert.strictEqual(JSON.stringify(X), JSON.stringify({ NASCE: .35, MIN: 3, MAX: 6, RAGGIO: 12, ADUNA: 2, DURATA: 15, META: .5, LONTANO: 40, STRETTI: 1.4, AIUTO: 3, PRESENTE: 2, ENTRO: 4, FIDUCIA: 5, PAGA: 3, IGNORA: -10, FEUDO: 3 }));
assert.strictEqual(D.ACCESO.eserciti, false, 'nasce spento');

// ---- (g) spento: nulla ----
{
  const s = V.nuovo(3); s.tregua = 1e9; raduna(s, 'sel'); raduna(s, 'fer'); s.guerra[chiave('sel', 'fer')] = true; gg(s, 60);
  assert.strictEqual(s.eserciti, undefined, 'spento, `s.eserciti` non nasce'); assert(s.p.every(p => p.es === undefined) && s.convoca === undefined && s.disobb === undefined);
  assert.strictEqual(JSON.stringify(V.eserciti(s)), '[]'); assert.strictEqual(V.esercitoDi(s, 5), null);
  const t = V.TU(s), v0 = V.velocita(s, t); D.ACCESO.eserciti = true; assert.strictEqual(V.velocita(s, t), v0, 'la velocità di chi non è in un esercito non cambia'); D.ACCESO.eserciti = false;
}

D.ACCESO.eserciti = true;

// ---- (a) nascita ----
{
  const s = V.nuovo(3); s.tregua = 1e9; s.guerra = {}; s.alleanza = {}; s.guerra[chiave('sel', 'fer')] = true; raduna(s, 'sel'); raduna(s, 'fer');
  // ogni giorno ogni regno in guerra ha NASCE di probabilità: con i dadi del seme 3 il primo nasce entro 5 giorni, il secondo entro 12 (la probabilità di 5 giorni è l'88% per regno)
  let g = 0, primo = 0; while (!['sel', 'fer'].every(f => (s.eserciti || []).some(e => e.faz === f)) && g++ < 12) { gg(s); if (!primo && (s.eserciti || []).length) primo = g; }
  assert(primo >= 1 && primo <= 5, 'il primo esercito nasce entro 5 giorni: ' + primo);
  for (const f of ['sel', 'fer']) {
    const e = s.eserciti.find(x => x.faz === f); assert(e, 'entro 12 giorni un esercito di ' + f);
    assert(e.membri.length >= X.MIN && e.membri.length <= X.MAX, f + ': membri ' + e.membri.length);
    const cp = V.part(s, e.capo); assert(!sigDi(s, cp).re, 'il maresciallo non è il re'); assert.strictEqual(e.membri[0], e.capo);
    assert(e.membri.every(id => V.part(s, id).es === e.id && V.part(s, id).faz === f)); assert(sigDi(s, cp).mar, 'il maresciallo ha il grado');
    assert(['soccorso', 'assedio', 'razzia'].includes(e.obiettivo.tipo) && s.l[e.obiettivo.lid], 'obiettivo');
    assert(['aduna', 'marcia', 'assedia'].includes(e.stato)); assert(e.f0 > 0 && e.da >= 1);
    assert.strictEqual(V.esercitoDi(s, e.capo), e); assert.strictEqual(V.esercitoDi(s, e.membri[1]), e);
  }
  const v = V.eserciti(s); assert.strictEqual(v.length, 2); for (const x of v) { assert(x.n > 0 && Number.isFinite(x.x) && Number.isFinite(x.y)); assert.strictEqual(Object.keys(x).sort().join(), 'capo,faz,id,n,stato,x,y'); }
  // ripetibile: due copie dello stesso mondo fanno lo stesso
  const a = V.apri(V.salva(s)), b = V.apri(V.salva(s)); gg(a, 3); gg(b, 3); assert.strictEqual(V.salva(a), V.salva(b));
  // senza guerra nessuno si raduna
  const p = V.nuovo(3); p.tregua = 1e9; p.guerra = {}; raduna(p, 'sel'); gg(p, 20); assert(!(p.eserciti || []).length, 'in pace nessun esercito');
}

// ---- (b) adunata e marcia ----
{
  const { s, e, R } = mondo({ lontano: true });
  assert(R.sel.lontano && dist(R.sel.lontano, R.sel.vicini[0]) > X.RAGGIO, 'il signore lontano sta oltre RAGGIO caselle');
  assert(!e.membri.includes(R.sel.lontano.id) && R.sel.lontano.es === undefined, 'il signore lontano non ne fa parte');
  assert.strictEqual(e.membri.length, R.sel.vicini.length, 'gli altri sì');
  const d = e.da; while (V.giorno(s) < d + X.ADUNA - 1) gg(s); assert.strictEqual(e.stato, 'aduna', 'dopo un giorno si aduna ancora');
  gg(s); assert.strictEqual(V.giorno(s), d + X.ADUNA); assert.strictEqual(e.stato === 'marcia' || e.stato === 'assedia', true, 'dopo ADUNA giorni marcia: ' + e.stato);
  // chi non è arrivato lascia l'esercito
  const m = mondo(); const lento = V.part(m.s, m.e.membri[1]); lento.x += 5; lento.y += 5; while (V.giorno(m.s) < m.e.da + X.ADUNA) gg(m.s);
  assert(!m.e.membri.includes(lento.id) && lento.es === undefined, 'chi non è arrivato dopo l\'adunata lascia l\'esercito');
}

// ---- (c) scioglimento ----
{
  const { s, e } = mondo(); const id = e.id, membri = e.membri.slice();
  while (V.giorno(s) < e.da + X.DURATA - 1) gg(s); assert.notStrictEqual(e.stato, 'sciolto'); gg(s);
  assert.strictEqual(e.stato, 'sciolto'); assert(['durata', 'compiuto', 'pace', 'forza', 'perso', 'pochi'].includes(e.motivo), e.motivo);
  assert(membri.every(i => V.part(s, i).es === undefined), 'nessun p.es resta ai suoi membri'); assert(!sigDi(s, V.part(s, e.capo)).mar, 'il maresciallo perde il grado');
  assert.strictEqual(V.esercitoDi(s, e.capo), null); assert.strictEqual(V.eserciti(s).find(x => x.id === id).stato, 'sciolto', 'la vista lo vede ancora un giorno');
  gg(s); assert(!s.eserciti.some(x => x.id === id), 'poi l\'esercito è tolto'); assert(membri.every(i => V.part(s, i).es === undefined));
  // pace con tutti: si scioglie, e ne nasce uno solo se la guerra c'è ancora
  const m = mondo(); delete m.s.guerra[chiave('sel', 'fer')]; gg(m.s); assert.strictEqual(m.e.stato, 'sciolto'); assert.strictEqual(m.e.motivo, 'pace');
  // forza sotto la metà
  const f = mondo(); while (V.giorno(f.s) < f.e.da + X.ADUNA) gg(f.s); for (const p of f.mem) p.tr = []; gg(f.s); assert.strictEqual(f.e.stato, 'sciolto'); assert.strictEqual(f.e.motivo, 'pochi' === f.e.motivo ? 'pochi' : 'forza');
  // maresciallo preso
  const q = mondo(); sigDi(q.s, q.cp).prig = 'tu'; gg(q.s); assert.strictEqual(q.e.stato, 'sciolto'); assert.strictEqual(q.e.motivo, 'perso');
}

// ---- (d) in battaglia ----
{
  const { s, e, cp, mem } = mondo(); const [a, b, c] = mem.filter(p => p !== cp);
  cp.x = 50; cp.y = 50; a.x = 50 + 2; a.y = 50; b.x = 52; b.y = 52; c.x = 50 + 6; c.y = 50;
  const nemico = s.p.find(p => p.k === 'sig' && p.faz === 'fer');
  // scontro tra IA: a è nello scontro, entrano chi è entro AIUTO da lui; il maresciallo va per primo
  const sc = { id: s.uid++, x: 51, y: 50, a: [a.id], b: [nemico.id], fa: 0, fb: 0 }; a.sc = nemico.sc = sc.id; V.ganci('scontro', s, sc);
  assert.strictEqual(sc.a.slice().sort((x, y) => x - y).join(), [cp.id, a.id, b.id].sort((x, y) => x - y).join(), 'entrano gli altri entro 3 caselle da chi combatte');
  assert.strictEqual(sc.a[0], cp.id, 'il maresciallo per primo'); assert(c.sc !== sc.id && !c.sc, 'chi è lontano resta fuori'); assert(cp.sc === sc.id && b.sc === sc.id);
  assert(sc.fa > 0 && sc.fb > 0, 'le forze si ricalcolano');
  // incontro con chi gioca
  for (const p of mem) p.sc = 0; nemico.sc = 0;
  const inc = { tipo: 'nemico', pid: [b.id], all: [], da: 'loro' }; V.ganci('incontro', s, inc);
  assert.strictEqual(inc.pid[0], cp.id, 'un incontro ha il maresciallo per primo'); assert(inc.pid.includes(a.id) && inc.pid.includes(b.id) && !inc.pid.includes(c.id));
  // scheda: il maresciallo è il comandante in campo e le sue righe vengono per prime
  const t = V.TU(s); t.x = 50; t.y = 52; s.incontro = inc; s.dentro = -1; s.davanti = -1; const camp = V.campo(s);
  assert.strictEqual(camp.capoB, true, 'capoB'); assert.strictEqual(camp.b[0].p, cp.id, 'la prima riga nemica è del maresciallo');
  // spento nessun gancio fa nulla
  D.ACCESO.eserciti = false; const inc2 = { tipo: 'nemico', pid: [b.id], all: [] }; V.ganci('incontro', s, inc2); assert.strictEqual(inc2.pid.join(), String(b.id)); D.ACCESO.eserciti = true;
  // un incontro 'parla' o la nostra squadra intera non rompono nulla
  s.incontro = null;
}

// ---- movimento: `decidi` e velocità ----
{
  const { s, e, cp, mem } = mondo(), M = V.mappaDi(s), altri = mem.filter(p => p !== cp), a = altri[0];
  // adunata: il maresciallo sta fermo, chi è lontano si avvicina
  cp.via = [{}]; V.decidi(s, cp, M); assert.strictEqual(cp.via.length, 0, 'il maresciallo resta fermo');
  const q = V._.vicinoOk(M, cp.x + 4, cp.y); a.x = q[0]; a.y = q[1]; a.via = []; a.dentro = -1; V.decidi(s, a, M); assert(a.via.length > 0, 'chi è lontano va dal maresciallo');
  // marcia: il maresciallo riceve l'obiettivo, chi gli è vicino lo copia
  e.stato = 'marcia'; for (const p of mem) { p.x = cp.x; p.y = cp.y; p.via = []; }
  V.decidi(s, cp, M); assert(!cp.dentro || cp.dentro < 0); const o = e.obiettivo;
  assert(cp.ia.st === o.tipo || cp.ia.st === 'giro' || cp.ia.st === 'fuga' || cp.ia.st === 'caccia' || cp.ia.st === 'casa', 'il maresciallo decide: ' + cp.ia.st);
  cp.ia.st = o.tipo; cp.ia.a = o.lid; V.decidi(s, a, M); assert.strictEqual(a.ia.a, o.lid, 'il compagno vicino prende lo stesso obiettivo'); assert.strictEqual(a.ia.st, o.tipo);
  // velocità: il maresciallo non è più veloce del suo membro più lento
  const lento = altri[1]; cp.tr = [{ t: 'sel_c3', n: 2, f: 0, xp: 0 }]; lento.tr = [{ t: 'sel_f1', n: 90, f: 0, xp: 0 }]; for (const p of mem) { p.x = cp.x; p.y = cp.y; p.dentro = -1; p.sc = 0; }
  assert(D.TR.sel_c3 && D.TR.sel_f1, 'truppe di prova');
  D.ACCESO.eserciti = false; const libero = V.velocita(s, cp); D.ACCESO.eserciti = true;
  const marcia = V.velocita(s, cp), vl = V.velocita(s, lento); assert(libero > vl, 'senza esercito il cavaliere è più veloce');
  assert(Math.abs(marcia - vl) < 1e-9, 'in marcia il maresciallo va quanto il più lento: ' + marcia + ' contro ' + vl); assert(V.velocita(s, lento) === vl, 'i membri non cambiano');
  e.stato = 'sciolto'; assert(Math.abs(V.velocita(s, cp) - libero) < 1e-9, 'sciolto, torna veloce');
}

// ---- (e) da vassallo ----
{
  // presente: arrivi entro PRESENTE caselle, e al termine la fiducia sale e arriva la paga
  const { s, e, cp } = mondo({ servizio: true, tu: true }); const tu = V.TU(s);
  assert(s.convoca && s.convoca.eid === e.id && s.convoca.fino === e.da + X.ENTRO && s.convoca.presente === false, 'convocato');
  gg(s); assert.strictEqual(s.convoca.presente, true, 'sei presente'); const oro0 = tu.oro, rel0 = s.rel.sel, n = V.uomini(tu);
  delete s.guerra[chiave('sel', 'fer')]; gg(s); assert.strictEqual(e.stato, 'sciolto'); assert.strictEqual(s.convoca, undefined);
  assert.strictEqual(s.rel.sel - rel0, X.FIDUCIA, 'relazione +5'); assert.strictEqual(tu.oro - oro0, X.PAGA * n, 'oro +3 per ogni uomo'); assert.strictEqual(s.disobb, undefined);
  // assente: scade ENTRO, a fine esercito pesa; prima di ENTRO nessuna colpa
  const a = mondo({ servizio: true }); const ta = V.TU(a.s); assert(dist(ta, a.cp) > X.PRESENTE, 'chi gioca è lontano'); a.s.rel.sel = 0;
  while (V.giorno(a.s) <= a.e.da + X.ENTRO) gg(a.s); delete a.s.guerra[chiave('sel', 'fer')]; gg(a.s);
  assert.strictEqual(a.e.stato, 'sciolto'); assert.strictEqual(a.s.rel.sel, X.IGNORA, 'assente: relazione -10'); assert.strictEqual(a.s.disobb, 1);
  const p = mondo({ servizio: true }); p.s.rel.sel = 0; delete p.s.guerra[chiave('sel', 'fer')]; gg(p.s);
  assert.strictEqual(p.e.stato, 'sciolto'); assert.strictEqual(p.s.rel.sel, 0, 'sciolto prima del termine: nessuna colpa'); assert.strictEqual(p.s.disobb, undefined); assert.strictEqual(p.s.convoca, undefined);
  // «Non vengo» conta subito; tre volte e il feudo torna al re
  const r = mondo({ servizio: true }); const v = r.s.l.find(l => l.faz === 'sel' && l.tipo === 'villaggio'); v.sig = -2; r.s.rel.sel = 0;
  r.s.convoca.fino = 99; V.ganci('effetto', r.s, { t: 'ven', k: 'adunata', v: 1 }); assert.strictEqual(r.s.convoca.si, 1); assert.strictEqual(r.s.rel.sel, 0, '«Verrò» non costa nulla');
  for (let i = 1; i <= 3; i++) {
    r.s.convoca = { eid: r.e.id, fino: 99, presente: false }; V.ganci('effetto', r.s, { t: 'ven', k: 'adunata', v: 0 });
    assert.strictEqual(r.s.convoca, undefined); assert.strictEqual(r.s.rel.sel, i * X.IGNORA);
    if (i < 3) { assert.strictEqual(r.s.disobb, i); assert.strictEqual(v.sig, -2, 'il feudo resta'); }
  }
  assert(!r.s.l.some(l => l.sig === -2), 'alla terza il feudo è perso'); assert.strictEqual(r.s.disobb, 0);
  // il re non è il tuo: nessuna convocazione
  const m = mondo({ servizio: false }); assert.strictEqual(m.s.convoca, undefined);
}

// ---- (f) da sovrano ----
{
  const ok2 = x => { assert(!x.err, x.err); return x; };
  const s = V.nuovo(3), tu = V.TU(s); let best = null, bn = -1;
  for (const c of s.l.filter(l => l.tipo === 'castello')) { const f = c.faz; c.faz = 'tu'; const n = V.confinanti(s).length; c.faz = f; if (n > bn) { bn = n; best = c; } }
  best.faz = 'tu'; best.sig = -2; for (const v of s.l) if (v.capo === best.id && !V.MURA[v.tipo]) { v.faz = 'tu'; v.sig = -2; }
  s.dentro = best.id; s.fama = 200; tu.oro = 6000; s.guerra = {}; s.alleanza = {}; ok2(V.fai(s, { a: 'fonda', nome: 'Regno di Prova', stend: 3 })); s.dentro = -1; s.davanti = -1;
  const sgs = s.sig.filter(x => x.faz === 'val').slice(1, 3); for (const sg of sgs) { sg.faz = 'tu'; sg.cult = 'val'; V.part(s, sg.pid).faz = 'tu'; }
  tu.x = best.x + 1; tu.y = best.y + 1; assert.strictEqual(s.eserciti, undefined);
  ok2(V.fai(s, { a: 'aduna' }));
  const e = s.eserciti[0]; assert.strictEqual(e.faz, 'tu'); assert.strictEqual(e.capo, 0); assert.strictEqual(e.obiettivo, null); assert.strictEqual(e.stato, 'marcia');
  assert.strictEqual(e.membri.slice().sort().join(), sgs.map(g => g.pid).sort().join());
  for (const g of sgs) { const p = V.part(s, g.pid); assert.strictEqual(p.ia.st, 'adunata'); assert.strictEqual(p.ia.fine, s.t + X.DURATA * GIORNO, 'ia.fine a 15 giorni'); assert.strictEqual(p.es, e.id); }
  const v = V.eserciti(s).find(x => x.id === e.id); assert(v && v.x === tu.x && v.y === tu.y && v.n >= V.uomini(tu), 'la vista lo mette dove sei tu');
  // chiamarla di nuovo la rinnova, non ne fa due
  ok2(V.fai(s, { a: 'aduna' })); assert.strictEqual(s.eserciti.filter(x => x.faz === 'tu' && x.stato !== 'sciolto').length, 1);
  // il nucleo li fa seguire: nessuna decisione dell'esercito su chi è con te
  const M = V.mappaDi(s), p0 = V.part(s, sgs[0].pid); p0.dentro = -1; p0.x += 6; p0.via = []; V.decidi(s, p0, M); assert(p0.via.length > 0, 'ti raggiunge');
  // dopo DURATA giorni è sciolto
  const ne = s.eserciti.find(x => x.stato !== 'sciolto'); const da = ne.da; while (V.giorno(s) <= da + X.DURATA) gg(s); assert.strictEqual(ne.stato, 'sciolto'); assert(s.p.every(p => p.es === undefined));
}

// ---- (g) salvataggi vecchi ----
{
  const dir = path.join(__dirname, 'fixture/ven');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const s = V.apri(fs.readFileSync(path.join(dir, f), 'utf8')); assert(s, f); s.tregua = 1e9;
    if (f.endsWith('_g0.json')) { s.incontro = null; V.passo(s, 1440); }
    gg(s, 10); assert(V.apri(V.salva(s)), f + ': si risalva');
    for (const e of s.eserciti || []) assert(e.membri.every(id => V.part(s, id)) || e.stato === 'sciolto', f + ': membri esistenti');
  }
}
D.ACCESO.eserciti = false;
console.log('Prove rapide del passo 40 verdi.');
