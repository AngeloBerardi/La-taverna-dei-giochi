// Passo 21: il consiglio di guerra (ranghi 0-2, manovre, dottrine, indole). La scala dei ranghi sta in test_ven_p21_lento.js.
const assert = require('assert');
const carica = require('./carica.js');
const X = carica.multi(carica.VEN_FILES, '({ VCAM, VCONS, VDAT })'), C = X.VCAM, K = X.VCONS, D = X.VDAT;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const J = x => JSON.stringify(x);
const mk = (a, b, o) => C.nuovo(Object.assign({ seme: 5, a: T(0, a), b: T(5, b), faza: 'tu', fazb: 'fer' }, o), { autoA: true });
const gioca = (s, n) => { const ev = []; for (let i = 0; i < n && !s.fine; i++) for (const e of C.passo(s, 1)) ev.push(Object.assign({ t0: s.t }, e)); return ev };
const centro = (s, l, c) => { const L = s.u.filter(u => u.l === l && u.c === c && !u.cap); return { x: L.reduce((a, u) => a + u.x, 0) / L.length, y: L.reduce((a, u) => a + u.y, 0) / L.length } };
// mette il gruppo `c` del lato `l` con il centro in (x,y), con la stessa forma di prima
const sposta = (s, l, c, x, y) => { const g = centro(s, l, c); for (const u of s.u) if (u.l === l && u.c === c && !u.cap) { u.x += x - g.x; u.y += y - g.y; u.px = u.x; u.py = u.y } };

// senza `rango` nulla cambia: niente stato nuovo, niente eventi nuovi, stesso esito di sempre
{
  const sc = { seme: 9, a: T(0, { val_f2: 12, val_t2: 6, val_c3: 4 }), b: T(5, { fer_f2: 12, fer_t2: 6, fer_c3: 4 }), faza: 'tu', fazb: 'fer' };
  const s = C.nuovo(sc, { autoA: true }); const ev = gioca(s, 400);
  assert(s.rango === undefined && s.cons === undefined && s.dott === undefined && s.indole === undefined);
  assert(!ev.some(e => e.t === 'piano'));
  assert.strictEqual(J(C.risolvi(sc)), J(C.risolvi(Object.assign({}, sc, { rango: undefined }))));
}

// il quadro è puro (lo stato non cambia) e dà reparti, forza, minaccia
{
  const s = mk({ val_f2: 12, val_t2: 6, val_c3: 4 }, { fer_f2: 12, fer_t2: 6, fer_c3: 4 }, { rango: { a: 2, b: 2 } });
  gioca(s, 50); const prima = J(s); const Q = K.quadro(s, 'a'); assert.strictEqual(J(s), prima);
  assert.strictEqual(Q.rep.map(m => m.c).join(), 'f,t,c'); assert.strictEqual(Q.nem.length, 3);
  assert(Q.rep.every(m => m.n > 0 && m.fo > 0 && m.nm && m.nm.d > 0));
  assert(Q.R > 0.5 && Q.R < 2);
}

// `contro`: al rango 2 i fanti passano in serrata entro 30 istanti da quando i cavalli sono a 15; al rango 0 mai
{
  const prova = ra => {
    const s = mk({ val_f2: 20 }, { val_c3: 10 }, { rango: { a: ra, b: 0 } }); s.ord.a.f.fm = 'larga';
    const f = centro(s, 'a', 'f'); sposta(s, 'b', 'c', f.x, f.y - 14.5);
    let quando = -1; for (let i = 0; i < 90 && !s.fine; i++) { C.passo(s, 1); if (quando < 0 && s.ord.a.f.fm === 'serrata') quando = s.t }
    return { quando, ev: s.ev };
  };
  const r2 = prova(2); assert(r2.quando > 0 && r2.quando <= 30, 'serrata entro 30 istanti: ' + r2.quando);
  const s2 = mk({ val_f2: 20 }, { val_c3: 10 }, { rango: { a: 2, b: 0 } }); s2.ord.a.f.fm = 'larga'; sposta(s2, 'b', 'c', centro(s2, 'a', 'f').x, centro(s2, 'a', 'f').y - 14.5);
  assert(gioca(s2, 5).some(e => e.t === 'piano' && e.l === 'a' && e.m === 'contro'));
  assert.strictEqual(prova(0).quando, -1, 'al rango 0 mai');
}

// `ripiega`: al rango 2 l'ancora dei tiratori arretra di 10 quando un nemico arriva a 9; al rango 0 resta
{
  const prova = ra => {
    const s = mk({ val_t2: 8 }, { fer_f1: 6 }, { rango: { a: ra, b: 0 }, W: 100, H: 140 }); sposta(s, 'a', 't', 50, 80); const t = centro(s, 'a', 't'), y0 = s.ord.a.t.y;
    sposta(s, 'b', 'f', t.x, t.y - 8.5); const ev = gioca(s, 1); return { dy: s.ord.a.t.y - t.y, y0, ev, s };
  };
  const r2 = prova(2); assert(Math.abs(r2.dy - 10) < 0.01, 'arretra di 10: ' + r2.dy); assert(r2.ev.some(e => e.t === 'piano' && e.m === 'ripiega' && e.l === 'a'));
  const r0 = prova(0); assert.strictEqual(r0.s.ord.a.t.y, r0.y0);
}

// dottrine: Ferropietra e Altavento (rango 2 entrambi) combattono in modo diverso
{
  const corsa = dott => {
    let mis = 0, tir = 0, serrata = 0, camp = 0, difensive = 0, piani = 0;
    for (let seme = 1; seme <= 6; seme++) {
      const s = C.nuovo({ seme, a: T(0, { fer_f2: 22, fer_t2: 8, fer_c3: 6 }), b: T(5, { alt_f2: 14, alt_t2: 10, alt_a3: 10 }), faza: 'tu', fazb: 'fer', rango: { a: 2, b: 2 }, dott }, { autoA: true });
      const cu = {}; for (const u of s.u) cu[u.id] = u; let contatto = false;
      while (!s.fine && s.t < 600) {
        for (const e of C.passo(s, 1)) {
          const u = cu[e.da];
          if (e.t === 'colpo' && !e.freccia && u) { if (u.l === 'b' && u.c === 'c') mis++; if (u.l === 'a') contatto = true }
          if (e.t === 'tiro' && u && u.l === 'b' && u.c === 'c') tir++;
          if (e.t === 'piano' && e.l === 'a') { piani++; if (e.m === 'tieni' || e.m === 'contro') difensive++ }
        }
        if (!contatto) { camp++; if (s.ord.a.f.fm === 'serrata') serrata++ }
      }
    }
    return { quota: mis / Math.max(1, mis + tir), tir, serrata, camp, dif: difensive / Math.max(1, piani) };
  };
  const d = corsa({ a: 'fer', b: 'alt' }), n = corsa({ a: 'tu', b: 'tu' });
  assert(d.quota < 0.15, 'Altavento: pochi colpi di cavalieri in mischia ' + d.quota); assert(d.tir > 0);
  assert(d.quota < n.quota || n.quota === 0, 'senza dottrina i cavalieri vanno più in mischia');
  assert.strictEqual(d.serrata, d.camp, 'Ferropietra: i fanti restano in serrata fino al contatto'); assert(d.camp > 100);
  assert(d.dif >= n.dif, 'Ferropietra sceglie più spesso tieni e contro');
}

// pesi: predoni, mercenari, indole
{
  assert.strictEqual(K.peso(D.DOTTRINE.pre, 'carica'), 2); assert.strictEqual(K.peso(D.DOTTRINE.pre, 'tiro'), 0.5);
  assert.strictEqual(K.peso(D.DOTTRINE.mer, 'tiro'), 1); assert.strictEqual(K.peso(D.DOTTRINE.tu, 'carica'), 1); assert.strictEqual(K.peso(undefined, 'carica'), 1);
  assert.strictEqual(K.peso(D.DOTTRINE.fer, 'aggira'), 0.6); assert.strictEqual(K.peso(D.DOTTRINE.alt, 'esca'), 1.6);
  assert.strictEqual(K.peso(D.INDOLE.prode.p, 'carica'), 1.4); assert.strictEqual(K.peso(D.INDOLE.crudele.p, 'debole'), 1.5);
  const s = { indole: { b: 'prudente' } }; assert.strictEqual(K.soglia(s, 'b'), 0.05); assert.strictEqual(K.soglia(s, 'a'), 0); assert.strictEqual(K.soglia({ indole: { b: 'avido' } }, 'b'), 0.04);
  assert.strictEqual(K.soglia({}, 'b'), 0);
}

// la soglia di rotta dell'indole prudente: a parità di tutto il signore prudente cede prima di quello prode
{
  const rotta = ind => { const s = mk({ val_f2: 30, val_c3: 6 }, { fer_f2: 22 }, { rango: { a: 2, b: 2 }, indole: { b: ind } }); let t = -1; while (!s.fine && t < 0) { for (const e of C.passo(s, 10)) if (e.t === 'rotta' && e.l === 'b') t = s.t } return t };
  const pr = rotta('prudente'), po = rotta('prode'); assert(pr > 0 && po > 0 && pr <= po, 'prudente ' + pr + ' prode ' + po);
}

// schieramento dell'IA: rango 0-1 tutto al centro, rango 2 tiratori dietro i fanti e cavalieri ai lati
{
  const sc = rg => mk({ val_f2: 12, val_t2: 6, val_c3: 6 }, { fer_f2: 12, fer_t2: 6, fer_c3: 6 }, { rango: { a: 2, b: rg } }).ord.b;
  for (const rg of [0, 1]) { const o = sc(rg); assert.strictEqual(o.c.x, 30); assert.strictEqual(o.t.x, 30); assert.strictEqual(o.f.x, 30) }
  const o = sc(2); assert(Math.abs(o.c.x - 30) >= 10); assert(o.t.y < o.f.y); assert.strictEqual(o.t.x, 30);
  const sx = mk({ val_f2: 12 }, { fer_f2: 12, fer_c3: 8 }, { rango: { a: 2, b: 2 } }); const cx = centro(sx, 'b', 'c').x; assert(Math.abs(cx - 30) >= 10);
}

// ondate dell'IA: ai ranghi 0-2 tutta la riserva entra dal retro quando la linea cala al 60%
{
  const sc = rg => C.nuovo({ seme: 3, a: T(0, { val_f2: 40, val_t2: 20 }), b: T(5, { fer_f2: 60, fer_t2: 30 }), faza: 'tu', fazb: 'fer', reparti: true, ondate: true, max: 40, rango: { a: 2, b: rg } }, { autoA: true });
  for (const rg of [0, 1, 2]) { const s = sc(rg); assert.strictEqual(s.ond.b.length, 1); const w = s.ond.b[0]; assert.strictEqual(w.ing, 'retro'); assert.strictEqual(J(w.quando), J({ k: 'linea', v: 60 })); assert(w.tr.reduce((a, x) => a + x.n, 0) > 0); assert.strictEqual(s.ris.b.length, 0) }
  assert.strictEqual(sc(3).ond.b.length, 0);
}

// ripetibile e salvabile: due partite uguali danno lo stesso stato; un salvataggio a metà e ripreso continua uguale
{
  const sc = { seme: 21, a: T(0, { val_f2: 20, val_t2: 8, val_c3: 6 }), b: T(5, { alt_f2: 14, alt_t2: 10, alt_a3: 8 }), faza: 'tu', fazb: 'fer', rango: { a: 2, b: 1 }, dott: { a: 'tu', b: 'alt' }, indole: { b: 'prode' } };
  const a = C.nuovo(sc, { autoA: true }), b = C.nuovo(sc, { autoA: true }); gioca(a, 300); gioca(b, 300); assert.strictEqual(J(a), J(b));
  const c = JSON.parse(J(a)); gioca(a, 400); gioca(c, 400); assert.strictEqual(J(a), J(c));
  assert(a.cons && a.cons.a && a.cons.b && typeof a.cons.a.t === 'number' && a.cons.a.man);
}

// il consiglio sceglie davvero: nel corso della battaglia ogni reparto cambia manovra e ogni manovra conosciuta al suo rango è tra le dieci
{
  assert.strictEqual(K.MANOVRE.length, 10);
  assert.strictEqual(K.MANOVRE.filter(m => m.rango === 0).map(m => m.id).join(), 'carica');
  assert.strictEqual(K.MANOVRE.filter(m => m.rango === 1).map(m => m.id).join(), 'avanza,tieni,tiro');
  assert.strictEqual(K.MANOVRE.filter(m => m.rango === 2).map(m => m.id).join(), 'contro,ripiega,debole,copri,insegui,attendi');
  const vis = rg => { const s = mk({ val_f2: 20, val_t2: 8, val_c3: 6 }, { fer_f2: 20, fer_t2: 8, fer_c3: 6 }, { rango: { a: rg, b: rg } }); const m = new Set(); for (const e of gioca(s, 1500)) if (e.t === 'piano') m.add(e.m); return m };
  const v0 = vis(0), v1 = vis(1), v2 = vis(2);
  assert.strictEqual([...v0].join(), 'carica');
  for (const id of v1) assert(K.MANOVRE.find(m => m.id === id).rango <= 1);
  assert(v1.size >= 2 && v2.size >= 4, 'più rango, più manovre: ' + [...v1] + ' / ' + [...v2]);
}
console.log('test_ven_p21 ok');
