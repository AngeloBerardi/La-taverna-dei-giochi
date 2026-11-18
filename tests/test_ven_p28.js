// Passo 28: le doti dei compagni in campo (motore). Ogni dote ha una scheda minima che ne mostra l'effetto.
const assert = require('assert');
const carica = require('./carica.js');
const X = carica.multi(carica.VEN_FILES, '({ VCAM, VDAT })'), C = X.VCAM, D = X.VDAT;
const d2 = (a, b) => Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
const Q = D.CAMPO28({ D, d2, chiave: u => u.c });
const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15 };
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const scheda = o => Object.assign({ seme: 5, a: T(0, { val_f2: 6 }), b: T(5, { fer_f2: 6 }), cap, faza: 'tu', fazb: 'fer', reparti: true, max: 40 }, o || {});
const nuovo = o => C.nuovo(scheda(o), { autoA: true });
const prima = s => { C.passo(s, 1); return s };
const di = (s, t) => s.u.find(u => u.t === t);

// ogni compagno ha la sua dote in COMPAGNI
assert.strictEqual(D.COMPAGNI.map(c => c.campo.k).sort().join(), 'alfiere,benedizione,cerusico,furia,guado,macchine,notte,occhio,seicolpi,steppa');

// senza reparti nessuna dote: niente aura, niente grida, niente campi nuovi
{
  const s = C.nuovo(scheda({ reparti: false, a: T(0, { val_f2: 6, co_berta: 1, co_lapo: 1 }) }), { autoA: true });
  for (let i = 0; i < 300 && !s.fine; i++) C.passo(s, 1);
  assert(s._aura === undefined && s.ultGrida === undefined && s.u.every(u => u.gr === undefined));
}

// furia: +15% ai fanti entro il raggio di Berta, non ai lontani né ai tiratori
{
  const s = prima(nuovo({ a: T(0, { val_f2: 6, val_t2: 3, co_berta: 1 }) }));
  const b = di(s, 'co_berta'), f = s.u.find(u => u.l === 'a' && u.t === 'val_f2'), t = s.u.find(u => u.l === 'a' && u.t === 'val_t2');
  f.x = b.x + 3; f.y = b.y; t.x = b.x + 3; t.y = b.y; s._aura.m = {};
  assert.strictEqual(Q.att(s, f), 1.15); assert.strictEqual(Q.att(s, t), 1);
  f.x = b.x + 30; s._aura.m = {}; assert.strictEqual(Q.att(s, f), 1);
}

// occhio (+10% danno ai tiratori) e steppa (+10% velocità ai cavalieri), solo del suo lato
{
  const s = prima(nuovo({ a: T(0, { val_f2: 4, val_t2: 3, val_c3: 3, co_isa: 1, co_temu: 1 }), b: T(5, { fer_t2: 3 }) }));
  const isa = di(s, 'co_isa'), t = s.u.find(u => u.l === 'a' && u.t === 'val_t2'), c = s.u.find(u => u.l === 'a' && u.t === 'val_c3'), tb = s.u.find(u => u.l === 'b');
  const temu = di(s, 'co_temu');
  t.x = isa.x + 2; t.y = isa.y; c.x = temu.x + 2; c.y = temu.y; tb.x = isa.x + 2; tb.y = isa.y; s._aura.m = {};
  assert.strictEqual(Q.dan(s, t), 1.1); assert.strictEqual(Q.dan(s, tb), 1);
  assert.strictEqual(Q.vel(s, c), 1.1);
}

// cerusico: +1 pf ogni 30 istanti entro il raggio, mai oltre il massimo
{
  const s = nuovo({ a: T(0, { val_f2: 4, co_lapo: 1 }) }); s.autoA = false; prima(s);
  const l = di(s, 'co_lapo'), f = s.u.find(u => u.l === 'a' && u.t === 'val_f2');
  f.x = l.x + 2; f.y = l.y; f.pf = f.pfm - 5; const lont = s.u.filter(u => u.l === 'a' && u.t === 'val_f2')[1]; lont.x = l.x + 40; lont.pf = lont.pfm - 5;
  for (const u of s.u) if (u.l === 'b') { u.vel = 0; u.git = 0 }   // il nemico sta fermo lontano: nessuno si fa male
  const pf0 = f.pf, pl0 = lont.pf;
  while (s.t < 60) C.passo(s, 1);
  assert.strictEqual(f.pf, pf0 + 2, 'due cure in 60 istanti'); assert.strictEqual(lont.pf, pl0);
  f.pf = f.pfm; while (s.t < 120) C.passo(s, 1); assert.strictEqual(f.pf, f.pfm);
}

// guado: nell'acqua il suo reparto non rallenta (chi non ha Ghino sì)
{
  const corsa = t => {
    const s = C.nuovo(scheda({ zone: [{ k: 'acqua', x: 30, y: 60, rx: 60, ry: 60 }], a: T(0, { [t]: 1 }), b: T(5, { fer_f2: 4 }) }));
    const u = s.u.find(q => q.l === 'a' && q.t === t); u.x = 30; u.y = 90; u.vel = 20; s.ord.a.c.t = 'tieni'; s.ord.a.c.x = 30; s.ord.a.c.y = 20;
    s.u.forEach(q => { if (q.l === 'b') { q.y = 2; q.vel = 0 } });
    for (let i = 0; i < 20; i++) C.passo(s, 1);
    return 90 - u.y;
  };
  const con = corsa('co_ghino'), senza = corsa('val_c3');
  assert(senza > 0 && con > senza * 1.6, `con ${con} senza ${senza}`);
}

// macchine: lo si vede dai ganci (spinta ×2 e scale −25%) tramite l'aura
{
  const s = prima(nuovo({ a: T(0, { val_f2: 6, co_ulf: 1 }) }));
  const u = di(s, 'co_ulf'), f = s.u.find(q => q.l === 'a' && q.t === 'val_f2'); f.x = u.x + 3; f.y = u.y; s._aura.m = {};
  assert(Q.aura(s, f, 'macchine')); f.x = u.x + 40; s._aura.m = {}; assert(!Q.aura(s, f, 'macchine'));
}

// alfiere: le perdite di morale del reparto valgono il 70%
{
  const s = prima(nuovo({ a: T(0, { co_dia: 1, val_c3: 5 }), b: T(5, { fer_f2: 6 }) }));
  const d = di(s, 'co_dia'); s.mr.a[d.r] = 80; s._aura.m = {};
  Q.scudo(s, () => { s.mr.a[d.r] -= 10 }); assert.strictEqual(Math.round(s.mr.a[d.r] * 100) / 100, 73);
  Q.scudo(s, () => { s.mr.a[d.r] += 10 }); assert.strictEqual(Math.round(s.mr.a[d.r] * 100) / 100, 83);
  // un reparto senza alfiere perde tutto
  const m0 = s.mr.a[0]; Q.scudo(s, () => { s.mr.a[0] -= 10 }); assert.strictEqual(s.mr.a[0], m0 - 10);
}

// benedizione: +10 al morale del reparto all'inizio
{
  const con = prima(nuovo({ a: T(0, { val_f2: 4, co_nera: 1 }) })), senza = prima(nuovo({ a: T(0, { val_f2: 4, val_f3: 1 }) }));
  const r = di(con, 'co_nera').r, r0 = senza.u.find(u => u.l === 'a' && u.t === 'val_f3').r;
  assert.strictEqual(con.mr.a[r] - senza.mr.a[r0], 10);
}

// seicolpi: in 200 istanti i tiri di Brando sono circa il doppio di quelli di un balestriere uguale
{
  const conta = t => {
    const s = nuovo({ a: T(0, { [t]: 1 }), b: T(5, { fer_f2: 6 }) }); let n = 0; s.autoA = false; s.ord.a.t.t = 'carica';
    const b = s.u.find(u => u.l === 'a' && u.t === t), nem = s.u.filter(u => u.l === 'b');
    for (let i = 0; i < 200 && !s.fine; i++) { b.fr = b.frM = 99; b.x = 30; b.y = 80; b.pf = b.pfm = 999; nem.forEach((u, k) => { u.x = 30 + k; u.y = 66; u.pf = u.pfm = 999; u.st = 'vivo'; u.att = 0; u.dan = 1; u.vel = 0 });
      n += C.passo(s, 1).filter(e => e.t === 'tiro' && e.da === b.id).length }
    return n;
  };
  const brando = conta('co_brando'), norm = conta('val_t3');
  assert(D.TR.val_t3.c === 't' && D.TR.val_t3.git > 0 && D.TR.co_brando.arch === 't3', 'il termine di paragone è un balestriere dello stesso tipo');
  assert(norm > 3, 'il balestriere tira: ' + norm); assert(brando >= norm * 1.7 && brando <= norm * 2.3, `Brando ${brando} contro ${norm}`);
}

// notte: i tiratori vicini a Fosca non perdono la mira di notte (la penalità c'è per gli altri)
{
  const s = prima(nuovo({ notte: true, a: T(0, { val_t2: 4, co_fosca: 1 }) }));
  const fo = di(s, 'co_fosca'), t = s.u.find(u => u.l === 'a' && u.t === 'val_t2'), lont = s.u.filter(u => u.l === 'a' && u.t === 'val_t2')[1];
  t.x = fo.x + 3; t.y = fo.y; lont.x = fo.x + 40; s._aura.m = {};
  assert(Q.aura(s, t, 'notte')); assert(!Q.aura(s, lont, 'notte'));
}

// grida: al massimo 15 in 600 istanti, una ogni 40, solo tra i momenti noti, mai dal capitano
{
  let tot = 0;
  for (let seme = 1; seme <= 6; seme++) {
    const s = C.nuovo(scheda({ seme, max: 70, a: T(0, { val_f2: 14, val_t2: 6, val_c3: 4, co_berta: 1, co_lapo: 1, co_dia: 1, co_brando: 1 }), b: T(5, { fer_f2: 22, fer_t2: 8, fer_c3: 5 }) }), { autoA: true });
    const g = []; while (s.t < 600 && !s.fine) for (const e of C.passo(s, 1)) if (e.t === 'grida') g.push([s.t, e]);
    assert(g.length <= 15, 'troppe grida: ' + g.length);
    for (let i = 1; i < g.length; i++) assert(g[i][0] - g[i - 1][0] >= 40);
    for (const [, e] of g) { assert(['carica', 'rotta', 'cede', 'ferito', 'vince'].includes(e.k)); assert(/^co_/.test(e.chi)); }
    tot += g.length;
  }
  assert(tot > 0, 'almeno una grida nelle sei battaglie');
}

// la battaglia con tutti i compagni finisce e conserva i suoi uomini
{
  const s = C.nuovo(scheda({ max: 70, a: T(0, { val_f2: 12, co_berta: 1, co_lapo: 1, co_ghino: 1, co_isa: 1, co_ulf: 1, co_dia: 1, co_temu: 1, co_nera: 1, co_brando: 1, co_fosca: 1 }), b: T(5, { fer_f2: 20, fer_t2: 6, fer_c3: 4 }) }), { autoA: true });
  const n0 = s.u.length + s.ris.a.reduce((a, x) => a + x.n, 0) + s.ris.b.reduce((a, x) => a + x.n, 0);
  while (!s.fine && s.t < 7001) C.passo(s, 50);
  assert(s.fine); assert.strictEqual(s.u.length + s.ris.a.reduce((a, x) => a + x.n, 0) + s.ris.b.reduce((a, x) => a + x.n, 0), n0);
  assert(!JSON.stringify(s).includes('_aura'), 'la cache non si salva');
}

// ogni doppio tiro di Brando costa due quadrelli (uno per tiro)
{
  const s = nuovo({ a: T(0, { co_brando: 1 }), b: T(5, { fer_f2: 6 }) }); s.autoA = false; s.ord.a.t.t = 'carica';
  const b = di(s, 'co_brando'), nem = s.u.filter(u => u.l === 'b'); let n = 0; const f0 = b.fr;
  for (let i = 0; i < 120 && !s.fine; i++) { b.x = 30; b.y = 80; b.pf = b.pfm = 999; nem.forEach((u, k) => { u.x = 30 + k; u.y = 66; u.pf = u.pfm = 999; u.st = 'vivo'; u.att = 0; u.dan = 1; u.vel = 0 });
    n += C.passo(s, 1).filter(e => e.t === 'tiro' && e.da === b.id).length; }
  assert(n > 2 && n % 2 === 0 && f0 - b.fr === n, `tiri ${n}, frecce usate ${f0 - b.fr}`);
}

// senza reparti la battaglia resta quella di sempre: impronta identica a main
{
  const o = require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, '../tools/avventura/impronta.js'), '--controlla'], { encoding: 'utf8' });
  assert(/Impronta identica/.test(o), o);
}
console.log('test_ven_p28 ok');
