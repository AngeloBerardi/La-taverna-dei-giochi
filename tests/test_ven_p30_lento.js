// Passo 30, prove lunghe: il maestro di guerra. Contromossa alle cariche di chi gioca (con e senza memoria), la scala rango 5 contro 4,
// la finta rotta, tutte le contromosse insieme in una grande battaglia. La memoria nel mondo e i salvataggi vecchi: test_ven_p30.js.
// Il «giocatore di prova» (tools/avventura/giocatore-prova.js) carica con la cavalleria per prima: è la sua abitudine `cavPrima`.
const assert = require('assert');
const carica = require('./carica.js');
const prova = require('../tools/avventura/giocatore-prova.js');
const X = carica.multi(carica.VEN_FILES, '({ VCAM, VCONS, VDAT })'), C = X.VCAM, D = X.VDAT;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const pc = x => Math.round(x * 100) + '%';

// ---------- cavPrima: senza memoria la carica pesante sfonda; con la memoria le picche aspettano dietro l'esca ----------
{
  const N = 40, memo = { n: 4, cavPrima: 4 };
  const gioca = conMemo => {
    let v = 0, abit = 0, annunci = 0;
    for (let seme = 1; seme <= N; seme++) {
      const sc = { seme, a: T(0, { val_f2: 22, val_t2: 8, val_c4: 5 }), b: T(5, { fer_f1: 18, fer_f2: 14, fer_t2: 8, fer_c3: 6 }), faza: 'tu', fazb: 'fer', reparti: true, zone: [], rango: { a: 0, b: 5 } };
      if (conMemo) sc.memo = memo;
      const s = C.nuovo(sc); C.pronto(s, 'a'); prova.gioca(C, s);
      const r = C.riepilogo(s); if (r.vince === 'a') v++; if (r.tat.cavPrima) abit++; if ((r.contro || []).includes('cavPrima')) annunci++;
    }
    return { V: v / N, abit, annunci };
  };
  const senza = gioca(false), con = gioca(true);
  console.log('cavPrima: il giocatore di prova vince', pc(senza.V), 'senza memoria,', pc(con.V), 'con la memoria (' + N + ' semi)');
  assert(senza.abit >= N * 0.9, 'il giocatore di prova ha davvero l\'abitudine: ' + senza.abit + '/' + N);
  assert.strictEqual(senza.annunci, 0); assert.strictEqual(con.annunci, N, 'la contromossa si annuncia in ogni battaglia');
  assert(senza.V - con.V >= 0.15, 'con la memoria almeno 15 punti in meno: ' + pc(senza.V) + ' → ' + pc(con.V));
}

// ---------- la scala: rango 5 contro 4 a truppe pari (a metà dei semi il rango alto sta dal lato a, a metà dal b) ----------
{
  const mix = (pre, p) => T(p, { [pre + '_f2']: 24, [pre + '_t2']: 10, [pre + '_c3']: 8 });
  const scala = (extra, n) => {
    let v = 0;
    for (let seme = 1; seme <= n; seme++) {
      const hiA = seme % 2 === 0, rango = hiA ? { a: 5, b: 4 } : { a: 4, b: 5 };
      const r = C.risolvi(Object.assign({ seme, a: mix('val', 0), b: mix('val', 5), faza: 'tu', fazb: 'fer', rango }, extra)); if ((r.vince === 'a') === hiA) v++;
    }
    return v / n;
  };
  const p1 = scala({ reparti: true, ondate: true, max: 60, W: 80, H: 120 }, 80), p2 = scala({ reparti: true, zone: [] }, 80);
  console.log('scala: rango 5 contro 4 con reparti e ondate', pc(p1) + ', in campo aperto', pc(p2), '(80 semi)');
  for (const [p, nome] of [[p1, 'reparti e ondate'], [p2, 'campo aperto']]) assert(p >= 0.58 && p <= 0.75, nome + ': ' + pc(p));
}

// ---------- finta rotta: con i tuoi tiratori sull'altura, un tuo reparto la lascia per inseguire; il reparto finto poi combatte ----------
{
  const N = 30, Z = { k: 'altura', x: 30, y: 66, rx: 13, ry: 9, h: 1 };
  const dentro = (x, y) => { const a = (x - Z.x) / Z.rx, b = (y - Z.y) / Z.ry; return a * a + b * b < 1 };
  const prova = inganno => {
    const MO = D.CONS5.FINTA_MO; if (!inganno) D.CONS5.FINTA_MO = 100;   // controllo: il reparto corre via lo stesso, ma nessuno lo vede «in rotta»
    try {
      let scatta = 0, lascia = 0, combatte = 0;
      for (let seme = 1; seme <= N; seme++) {
        // chi gioca (lato a, consiglio di rango 3) tiene tiratori e fanti sull'altura della sua metà
        const s = C.nuovo({ seme, a: T(0, { val_f2: 16, val_t2: 10, val_c3: 6 }), b: T(5, { fer_f2: 18, fer_t2: 6, fer_c3: 6 }), faza: 'tu', fazb: 'fer', reparti: true, zone: [Z], rango: { a: 3, b: 5 } }, { autoA: true });
        s.ord.a.t.x = 30; s.ord.a.t.y = 66; s.ord.a.f.x = 30; s.ord.a.f.y = 60; C.int.rimetti(s, 'a', 't'); C.int.rimetti(s, 'a', 'f');
        const rep = (l, k) => s.u.filter(u => u.l === l && u.st === 'vivo' && !u.cap && String(u.r > 2 ? u.r : u.c) === String(k));
        const cen = L => ({ x: L.reduce((a, u) => a + u.x, 0) / L.length, y: L.reduce((a, u) => a + u.y, 0) / L.length });
        let f = null, su = null, ids = null, giu = false, comb = false;
        while (!s.fine && s.t < 1500) {
          const ev = C.passo(s, 1);
          if (!f && s.cons.b && s.cons.b.fr) {
            f = s.cons.b.fr; ids = new Set(rep('b', f.k).map(u => u.id));
            su = Object.keys(s.ord.a).filter(k => { const L = rep('a', k); if (!L.length) return false; const c = cen(L); return dentro(c.x, c.y) });
            assert(s.u.filter(u => ids.has(u.id)).every(u => u.st === 'vivo'), 'chi finge non è in fuga');
          }
          if (f && s.t <= f.t0 + 150 && !giu) for (const k of su) { const L = rep('a', k); if (!L.length) continue; const c = cen(L); if (!dentro(c.x, c.y) && c.y < Z.y) giu = true }
          if (f && s.t > f.t0 + D.CONS5.FINTA_T) for (const e of ev) if (e.t === 'colpo' && !e.freccia && (ids.has(e.da) || ids.has(e.a))) comb = true;
          for (const e of ev) assert(!(e.t === 'piano' && e.m === 'finta'), 'la finta non si annuncia');
        }
        if (f) scatta++; if (giu) lascia++; if (comb) combatte++;
      }
      return { scatta, lascia, combatte };
    } finally { D.CONS5.FINTA_MO = MO }
  };
  const si = prova(true), no = prova(false);
  console.log('finta rotta: scatta in', si.scatta + '/' + N, 'semi; un tuo reparto lascia l\'altura in', si.lascia + '/' + N, '(senza l\'inganno', no.lascia + '/' + N + '); il reparto finto poi combatte in', si.combatte + '/' + N);
  assert(si.lascia >= N * 0.5, 'lasciano l\'altura in almeno metà dei semi: ' + si.lascia);
  assert(si.lascia > no.lascia, 'è l\'inganno a tirarli giù');
  assert(si.combatte >= si.scatta * 0.8, 'il reparto finto poi combatte: ' + si.combatte + '/' + si.scatta);
}

// ---------- tutte le contromosse insieme, in una grande battaglia: finiscono, nessun uomo si perde, ognuna si usa ----------
{
  const memo = { n: 4, cavPrima: 4, alt: 4, fianco: 4, fsx: 4, capAvanti: 4, ondataPresto: 4 }, usate = {};
  const cap = { nome: 'Capitano', pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true };
  for (let seme = 1; seme <= 10; seme++) {
    const s = C.nuovo({ seme, a: T(0, { val_f2: 50, val_t2: 20, val_c3: 14 }), b: T(5, { fer_f1: 30, fer_f2: 30, fer_t2: 16, fer_c3: 12 }), cap, faza: 'tu', fazb: 'fer', zone: [{ k: 'altura', x: 50, y: 104, rx: 13, ry: 9, h: 1 }, { k: 'altura', x: 40, y: 36, rx: 12, ry: 8, h: .8 }], reparti: true, ondate: true, max: 80, W: 100, H: 140, rango: { a: 3, b: 5 }, memo }, { autoA: true });
    const tutti = () => s.u.length + s.ris.a.concat(s.ris.b).reduce((a, x) => a + x.n, 0) + s.ond.a.concat(s.ond.b).reduce((a, w) => a + w.tr.reduce((c, x) => c + x.n, 0), 0);
    const n0 = tutti(); assert.strictEqual(n0, 173, 'nessuno si perde allo schieramento (172 uomini e il capitano)');
    // fino alla rotta (che manda via anche chi aspettava nelle ondate) nessun uomo si perde
    let rotta = false; while (!s.fine) { const ev = C.passo(s, 10); if (ev.some(e => e.t === 'rotta')) rotta = true; if (!rotta) assert.strictEqual(tutti(), n0, 'nessun uomo si perde (istante ' + s.t + ')') }
    assert(s.t <= 7000, 'la battaglia finisce');
    for (const id of C.riepilogo(s).contro || []) usate[id] = (usate[id] || 0) + 1;
    JSON.parse(JSON.stringify(s));
  }
  console.log('tutte insieme (10 grandi battaglie): contromosse usate', JSON.stringify(usate));
  for (const k of ['cavPrima', 'alt', 'fianco', 'capAvanti', 'ondataPresto']) assert(usate[k] > 0, 'si usa ' + k);
}
console.log('test_ven_p30_lento ok');
