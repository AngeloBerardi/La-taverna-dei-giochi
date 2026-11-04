// Scena 3D dell'Avventura (A12): la telecamera obliqua cade al pixel dove l'SVG disegna, arena e mondo si descrivono in modo deterministico,
// gli oggetti hanno forme valide e stanno dentro la cella, la luce cambia con fase, ambiente e perdizione.
const assert = require('assert');
const ASCE = require('../src/js/motori/28f-avv-scena.js');
const AGRI = require('../src/js/motori/27g-avv-griglia.js');
const AARE = require('../src/js/motori/27h-avv-arene.js');
const CAMP = require('../src/js/motori/28-campagna.js');
global.EROI = require('../src/js/motori/27-eroi.js');
const E = global.EROI;
const near = (a, b, eps, msg) => assert(Math.abs(a - b) <= (eps || 1e-6), (msg || '') + ' ' + a + ' ≠ ' + b);

// ---- 1. geometria uguale a quella delle viste (copiata dalle formule di BatMappa e MoMappa) ----
{
  const Z = 26, SQ = .84, W = Z * Math.sqrt(3);
  const bat = (q, r) => [W * (q + r / 2), Z * 1.5 * SQ * r];       // BatMappa.xy
  const mon = (q, r) => [26 * Math.sqrt(3) * (q + r / 2), 26 * 1.5 * r]; // MoMappa.xy
  for (const [q, r] of [[0, 0], [3, 2], [-2, 5], [7, 7], [-4, 9]]) {
    const p = ASCE.pos('bat', q, r), b = bat(q, r);
    near(p.x, b[0], 1e-9, 'x bat'); near(p.z * ASCE.GEO.bat.SQ, b[1], 1e-9, 'y bat');
    const m = ASCE.pos('mon', q, r), w = mon(q, r);
    near(m.x, w[0], 1e-9, 'x mon'); near(m.z * ASCE.GEO.mon.SQ, w[1], 1e-9, 'y mon');
  }
}

// ---- 2. proiezione: un punto a terra cade sul punto SVG, l'altezza lo alza di h pixel, la profondità cresce verso l'alto ----
{
  for (const SQ of [.84, 1]) {
    const vb = [-30, -52, 480, 360], px = [390, 540];
    const P = ASCE.proiez({ vb, px, SQ });
    // rettangolo visibile: «meet» → il lato più stretto è quello pieno
    const k = Math.min(px[0] / vb[2], px[1] / vb[3]);
    near(P.vis.k, k); near(P.vis.w, px[0] / k); near(P.vis.h, px[1] / k);
    near(P.vis.cx, vb[0] + vb[2] / 2); near(P.vis.cy, vb[1] + vb[3] / 2);
    // pixel del dispositivo di un punto 3D = (ndc*0.5+0.5)·px, con y capovolta; lo si confronta con la trasformazione «meet» dell'SVG
    const pixel = (X, Y, Z) => { const n = P.ndc(X, Y, Z); return [(n[0] + 1) / 2 * px[0], (1 - n[1]) / 2 * px[1]]; };
    const svgPx = (x, y) => [(x - P.vis.cx) * k + px[0] / 2, (y - P.vis.cy) * k + px[1] / 2];
    for (const [X, Z] of [[0, 0], [100, 80], [-20, 150], [200, 20]]) {
      const a = pixel(X, 0, Z), b = svgPx(X, Z * SQ);
      near(a[0], b[0], 1e-6, 'x a terra'); near(a[1], b[1], 1e-6, 'y a terra');
      for (const h of [6, 18, 30]) {
        const c = pixel(X, h, Z), d = svgPx(X, Z * SQ - h);
        near(c[0], d[0], 1e-6, 'x quota'); near(c[1], d[1], 1e-6, 'y quota ' + h);
        near(a[1] - c[1], h * k, 1e-6, 'sollevamento in pixel');
      }
    }
    // profondità: più in alto = più vicino (z_ndc più piccolo) e sempre dentro [-1, 1] nelle quote usate
    const z0 = P.ndc(10, 0, 10)[2], z1 = P.ndc(10, 18, 10)[2], z2 = P.ndc(10, -10, 10)[2];
    assert(z1 < z0 && z0 < z2, 'profondità ordinata');
    for (const y of [-20, 0, 60, 200]) { const z = P.ndc(0, y, 0)[2]; assert(z >= -1 && z <= 1, 'profondità nel cubo'); }
    // schermo() è la proiezione sul piano SVG
    const s = P.schermo(50, 10, 40); near(s[0], 50); near(s[1], 40 * SQ - 10);
  }
  // senza dimensioni sensate non si rompe: viewBox quadrato su canvas largo → centrato
  const P = ASCE.proiez({ vb: [0, 0, 100, 100], px: [800, 400], SQ: 1 });
  near(P.vis.w, 200); near(P.vis.h, 100); near(P.vis.cx, 50);
}

// ---- 3. hash deterministico e ben distribuito ----
{
  assert.strictEqual(ASCE.hash(3, 4, 5), ASCE.hash(3, 4, 5));
  assert.notStrictEqual(ASCE.hash(3, 4, 5), ASCE.hash(4, 3, 5));
  let min = 1, max = 0, sum = 0, n = 0;
  for (let q = -20; q <= 20; q++) for (let r = -20; r <= 20; r++) { const h = ASCE.hash(q, r, 7); assert(h >= 0 && h < 1); min = Math.min(min, h); max = Math.max(max, h); sum += h; n++; }
  assert(min < .02 && max > .98, 'copre l\'intervallo'); near(sum / n, .5, .03, 'media');
}

// ---- 4. arene: tutte quelle del gioco si descrivono, quote e oggetti coerenti con la griglia ----
{
  let tot = 0, decori = 0;
  const lista = Object.keys(AARE.AMBIENTI || AARE.ARENE || {});
  const amb = ['pianura', 'strada', 'bosco', 'collina', 'palude', 'citta', 'antro', 'torre'];
  for (const a of amb) {
    const A = AARE.genera(11, a);
    assert.strictEqual(A.ambiente, a, 'ambiente dell\'arena');
    const D = ASCE.arena(A);
    assert.strictEqual(D.tiles.length, A.w * A.h, 'una cella per ogni cella dell\'arena (' + a + ')');
    for (const t of D.tiles) {
      const c = { q: t.q, r: t.r };
      assert(AGRI.dentro(A, c), 'dentro l\'arena');
      const tipo = AGRI.tipo(A, c);
      assert.strictEqual(t.tipo === 'muro', tipo.id === 'muro', 'muro');
      assert.strictEqual(t.h, tipo.id === 'rialzo' ? ASCE.QUOTA.rialzo : tipo.id === 'muro' ? ASCE.QUOTA.muro : 0, 'quota ' + tipo.id);
      assert.strictEqual(!!t.oggetto, tipo.id === 'alto' || tipo.id === 'basso', 'oggetto solo su ostacoli');
      if (t.deco) { assert(!t.oggetto && !t.sup && (tipo.id === 'pavimento' || tipo.id === 'difficile'), 'decorazione solo sul pavimento libero'); assert(ASCE.parti(t.deco.k, t.deco.s, {}).length > 0); decori++; }
      assert.strictEqual(t.sup, AGRI.sup(A, c), 'superficie');
      for (const p of ASCE.parti(t.oggetto ? t.oggetto.k : 'cassa', t.s, {})) assert(Array.isArray(p) && p.length === 11);
      tot++;
    }
  }
  assert(tot > 0, 'almeno un\'arena provata'); assert(decori > 10, 'le arene hanno dettagli sul pavimento: ' + decori);
}
// un'arena scritta a mano copre ogni carattere e ogni superficie
{
  const A = Object.assign(AGRI.arena(['.,^#', 'To..', '....'], ['f.vg', '.w..', '....']), { ambiente: 'bosco', uscite: [{ q: 0, r: 2 }] });
  const D = ASCE.arena(A);
  const per = {}; D.tiles.forEach(t => per[t.col + ',' + t.r] = t);
  assert.strictEqual(per['0,0'].sup, 'fuoco'); assert.strictEqual(per['2,0'].sup, 'veleno'); assert.strictEqual(per['3,0'].sup, 'ghiaccio'); assert.strictEqual(per['1,1'].sup, 'acqua');
  assert.strictEqual(per['1,0'].tipo, 'difficile'); assert.strictEqual(per['2,0'].tipo, 'rialzo'); assert.strictEqual(per['3,0'].tipo, 'muro');
  assert.strictEqual(per['0,1'].oggetto.k, 'albero', 'ostacolo alto nel bosco'); assert.strictEqual(per['1,1'].oggetto.k, 'masso', 'ostacolo basso nel bosco');
  assert.strictEqual(D.uscite.length, 1);
  const B = ASCE.arena(Object.assign({}, A, { ambiente: 'citta' }));
  assert.strictEqual(B.tiles.find(t => t.col === 0 && t.r === 1).oggetto.k, 'colonna'); assert.strictEqual(B.tiles.find(t => t.col === 1 && t.r === 1).oggetto.k, 'cassa');
  assert.strictEqual(ASCE.arena(Object.assign({}, A, { ambiente: 'collina' })).tiles.find(t => t.col === 0 && t.r === 1).oggetto.k, 'roccia');
  assert.strictEqual(ASCE.arena(Object.assign({}, A, { ambiente: 'palude' })).tiles.find(t => t.col === 0 && t.r === 1).oggetto.k, 'albero-secco');
  // deterministica
  assert.deepStrictEqual(ASCE.arena(A), ASCE.arena(A));
}

// ---- 5. oggetti: forme valide, dentro la cella (raggio ~25), non troppo alti, nessun NaN ----
{
  const forme = new Set(['c', 'k', 's', 'b']);
  const tutti = ['albero', 'albero-secco', 'roccia', 'colonna', 'masso', 'cassa', 'bosco', 'albero-solo', 'ciuffi', 'picco', 'canne', 'citta', 'villaggio', 'santuario', 'campo', 'antro', 'rovina', 'torre', 'tesoro', 'sassi', 'stalagmite', 'fiori',
    'abete', 'ceppo', 'tronco', 'cespuglio', 'funghi', 'colonna-rotta', 'statua', 'sarcofago', 'barile', 'lapide', 'ossa', 'scaffale', 'libri', 'candele', 'braciere', 'stendardo'];
  for (const k of tutti) for (const notte of [false, true]) for (const s of [0, .13, .5, .99]) {
    const L = ASCE.parti(k, s, { notte });
    assert(L.length > 0, k + ' ha dei pezzi');
    assert(L.length <= 40, k + ' ha troppi pezzi: ' + L.length);
    let top = 0;
    for (const p of L) {
      assert(forme.has(p[0]), k + ': forma ' + p[0]); assert(/^#[0-9a-f]{6}$/i.test(p[1]), k + ': colore ' + p[1]);
      for (let i = 2; i <= 9; i++) assert(Number.isFinite(p[i]), k + ': numero ' + i + ' ' + p[i]);
      assert(p[10] === '' || p[10] === 'e');
      const alto = p[0] === 'k' ? p[3] + p[7] / 2 : p[0] === 's' ? p[3] + p[6] : p[3] + p[(p[0] === 'c') ? 7 : 6] / 2; top = Math.max(top, alto);
      assert(Math.hypot(p[2], p[4]) <= 27, k + ': fuori dalla cella ' + Math.hypot(p[2], p[4]).toFixed(1));
    }
    assert(top <= 60, k + ' troppo alto: ' + top.toFixed(1));
  }
  assert(!ASCE.parti('citta', .3, { notte: false }).some(p => p[10] === 'e'), 'di giorno le finestre non brillano');
  assert(ASCE.parti('citta', .3, { notte: true }).some(p => p[10] === 'e'), 'di notte le finestre brillano');
  assert.deepStrictEqual(ASCE.parti('bosco', .42, {}), ASCE.parti('bosco', .42, {}), 'oggetti deterministici');
  assert.notDeepStrictEqual(ASCE.parti('bosco', .42, {}), ASCE.parti('bosco', .77, {}), 'oggetti variati dal seme');
}

// ---- 6. mondo: una cella per cella dello stato, nebbia, oggetti per terreno, luoghi ----
{
  const mk = (nome, classe) => E.nuovo({ nome, classe, razza: 'umano', aspetto: { pelle: 0, capelli: 1, mantello: 2, viso: 0 }, base: E.baseIniziale() }, 1000);
  const r0 = CAMP.nuova([mk('Aldo', 'guerriero'), mk('Mira', 'ladro')], 7), s = r0.s || r0;
  const D = ASCE.mondo(s, { vista: 2 });
  assert.strictEqual(D.tiles.length, Object.keys(s.celle).length);
  assert.strictEqual(D.modo, 'mon'); assert.strictEqual(D.SQ, 1);
  let visti = 0, luoghi = 0, vicini = 0;
  for (const t of D.tiles) {
    const c = s.celle[t.q + ',' + t.r];
    assert.strictEqual(t.visto, !!c.visto); assert.strictEqual(t.t, c.t);
    if (!c.visto) { assert.strictEqual(t.h, 0); assert.strictEqual(t.oggetto, null); assert.strictEqual(ASCE.nebbia(t), 0); continue; }
    visti++; if (t.vicino) { vicini++; assert.strictEqual(ASCE.nebbia(t), 1); } else assert(ASCE.nebbia(t) < 1 && ASCE.nebbia(t) > 0);
    assert.strictEqual(t.h, ASCE.ALT_MON[c.t]);
    if (c.luogo) { luoghi++; assert(t.luogo && t.luogo.id === c.luogo); assert.strictEqual(t.oggetto.k, s.luoghi[c.luogo].tipo); assert(ASCE.parti(t.oggetto.k, t.s, {}).length > 0, 'luogo ' + t.oggetto.k); }
    else if (t.oggetto) assert(ASCE.parti(t.oggetto.k, t.s, { g: t.oggetto.g }).length > 0);
  }
  assert(visti > 5 && vicini >= 1 && luoghi >= 1, 'celle viste ' + visti + ', vicine ' + vicini + ', luoghi ' + luoghi);
  assert.deepStrictEqual(ASCE.mondo(s, { vista: 2 }), D, 'deterministico');
  const D2 = ASCE.mondo(Object.assign({}, s, { fase: 'notte', perdizione: 60 }));
  assert.strictEqual(D2.notte, true); assert.strictEqual(D2.liv, 2);
}

// ---- 7. luce: giorno/notte, interni, perdizione ----
{
  const g = ASCE.luce('mon', { fase: 'giorno' }), n = ASCE.luce('mon', { fase: 'notte' });
  assert(g.sole.int > n.sole.int, 'la luna è più debole del sole');
  assert.notStrictEqual(g.sole.col, n.sole.col);
  assert(n.finestre && !g.finestre, 'finestre accese solo di notte');
  for (const a of ['antro', 'torre']) { const l = ASCE.luce('bat', { ambiente: a, fase: 'giorno' }); assert(l.torce && l.finestre, a + ' è illuminato da torce'); }
  assert.strictEqual(ASCE.luce('bat', { ambiente: 'pianura' }).torce, false);
  for (const [p, liv] of [[0, 0], [24, 0], [25, 1], [49, 1], [50, 2], [74, 2], [75, 3], [100, 3]]) assert.strictEqual(ASCE.livello(p), liv, 'livello ' + p);
  assert.strictEqual(ASCE.luce('mon', { liv: 0 }).tinta, null);
  assert(ASCE.luce('mon', { liv: 3 }).tinta.mix > ASCE.luce('mon', { liv: 1 }).tinta.mix, 'la tinta cresce con la perdizione');
  for (const l of [g, n, ASCE.luce('bat', { ambiente: 'palude' }), ASCE.luce('bat', { ambiente: 'bosco' })]) {
    assert(/^#[0-9a-f]{6}$/i.test(l.sole.col) && /^#[0-9a-f]{6}$/i.test(l.fondo) && l.sole.pos.length === 3 && l.esp > .5 && l.esp < 2, 'luce valida');
  }
}
// ---- 7. resa pixel (B2): temi dei biomi, tessere 16×16 del pavimento, tabelle delle luci ----
{
  const APAL = require('../src/js/motori/28h-avv-palette.js');
  assert.deepStrictEqual(ASCE.RAMPE, APAL.NOMI, 'le tessere usano le rampe della palette nello stesso ordine');
  // sei temi, ognuno con 6–10 oggetti di scena che esistono, pavimento da materiali noti, ogni ambiente della battaglia ha il suo tema
  assert.deepStrictEqual(Object.keys(ASCE.TEMI).sort(), ['foresta', 'fortezza', 'palude', 'rovine', 'sotterraneo', 'torre']);
  for (const a of ['pianura', 'strada', 'bosco', 'collina', 'palude', 'citta', 'antro', 'torre']) assert(ASCE.TEMI[ASCE.tema(a)], 'tema per ' + a);
  assert.strictEqual(ASCE.tema('antro'), 'sotterraneo'); assert.strictEqual(ASCE.tema('bosco'), 'foresta'); assert.strictEqual(ASCE.tema('ignoto'), 'foresta');
  for (const [id, T] of Object.entries(ASCE.TEMI)) {
    const ogg = new Set([...T.alti, ...T.bassi, ...T.deco.map(d => d[1])]);
    assert(ogg.size >= 6 && ogg.size <= 10, id + ': ' + ogg.size + ' oggetti di scena');
    for (const k of ogg) assert(ASCE.parti(k, .37, {}).length > 0, id + ': oggetto sconosciuto ' + k);
    for (const tipo of ['piano', 'difficile', 'rialzo', 'muro']) { const [m, t] = T.pav[tipo]; assert(ASCE.MATERIALI.includes(m) && Math.abs(t) <= 1, id + ': pavimento ' + tipo); }
    let lim = 0; for (const [l] of T.deco) { assert(l > lim && l < .4, id + ': soglie crescenti'); lim = l; }
  }
  // arena col tema: stessa griglia, muri più alti, oggetti e pavimento dal tema, deterministica; senza tema resta com'era
  for (const a of ['bosco', 'antro', 'torre', 'citta', 'palude', 'collina']) {
    const A = AARE.genera(5, a), D = ASCE.arena(A, { temi: true }), D0 = ASCE.arena(A), T = ASCE.TEMI[ASCE.tema(a)];
    assert.strictEqual(D.tema, ASCE.tema(a)); assert.strictEqual(D0.tema, null);
    D.tiles.forEach((t, i) => {
      const t0 = D0.tiles[i];
      assert.strictEqual(t.tipo, t0.tipo); assert.strictEqual(!!t.oggetto, !!t0.oggetto); assert.strictEqual(t.sup, t0.sup);
      assert.strictEqual(t.h, t.tipo === 'muro' ? ASCE.QUOTA_PX.muro : t0.h, 'quota col tema');
      assert.deepStrictEqual(t.pav, T.pav[t.tipo]);
      if (t.oggetto) assert([...T.alti, ...T.bassi].includes(t.oggetto.k), a + ': oggetto fuori tema ' + t.oggetto.k);
      if (t.deco) assert(T.deco.some(d => d[1] === t.deco.k), a + ': decorazione fuori tema ' + t.deco.k);
    });
    assert.deepStrictEqual(ASCE.arena(A, { temi: true }), D, 'deterministica');
    assert(ASCE.QUOTA_PX.muro >= 2 * ASCE.QUOTA.muro && D.quota.muro === ASCE.QUOTA_PX.muro);
  }
  // sorgenti di luce: fuochi del pavimento, bracieri, torce dove c'è buio (sempre le stesse)
  {
    const A = Object.assign(AGRI.arena(['#########', '#..o....#', '#.......#', '#.......#'], ['.........', '.........', '.........', '...f.....']), { ambiente: 'torre' });
    const D = ASCE.arena(A, { temi: true }), F = ASCE.fonti(D, { torce: true, px: true });
    assert(F.some(f => f.k === 'fuoco'), 'il fuoco sul pavimento fa luce');
    assert(F.filter(f => f.k === 'torcia').length === ASCE.torce(D, true).length && ASCE.torce(D, true).length > 0, 'torce sui muri');
    assert.strictEqual(ASCE.fonti(D, {}).filter(f => f.k === 'torcia').length, 0, 'di giorno all\'aperto niente torce');
    for (const f of F) { assert(/^#[0-9a-f]{6}$/.test(f.col) && f.forza > 0 && f.forza <= 1 && Number.isFinite(f.x + f.y + f.z)); }
    for (const t of ASCE.torce(D, true)) { const m = D.tiles.find(c => Math.abs(c.x - t.x) < 1e-9 && c.tipo === 'muro' && t.z > c.z); assert(m && t.y > 0 && t.y < m.h, 'la torcia sta sulla faccia del muro'); }
    assert.deepStrictEqual(ASCE.torce(D, false).map(t => [t.x, t.z]), ASCE.torce(D, true).map(t => [t.x, t.z - ASCE.GEO.bat.Z - 3 + 13]), 'stesse torce nelle due rese');
  }
  // tessere: 16×16, sei varianti per materiale, solo colori della palette, quasi tutte nella rampa del materiale, sempre uguali
  const RAMPA = { pietra: 'pietra', erba: 'erba', terra: 'legno', assi: 'legno' };
  for (const m of ASCE.MATERIALI) {
    const viste = new Set();
    for (let v = 0; v < ASCE.VARIANTI; v++) {
      const t = ASCE.tessera16(m, v);
      assert.strictEqual(t.length, 256); assert.deepStrictEqual(t, ASCE.tessera16(m, v), 'deterministica');
      let propri = 0; const toni = new Set();
      for (const c of t) { assert(c < 40, 'colore della palette'); if (APAL.NOMI[APAL.rampa(c)] === RAMPA[m]) propri++; toni.add(c); }
      assert(propri >= 240, m + '/' + v + ': quasi tutta nella rampa ' + RAMPA[m] + ' (' + propri + ')');
      assert(toni.size >= 3 && toni.size <= 8, m + '/' + v + ': da 3 a 8 toni (' + toni.size + ')');
      viste.add(t.join(','));
    }
    assert.strictEqual(viste.size, ASCE.VARIANTI, m + ': varianti tutte diverse');
  }
  // le lastre e le assi combaciano: fuga scura su tutta l'ultima riga (e colonna, per le lastre)
  for (let v = 0; v < ASCE.VARIANTI; v++) {
    const t = ASCE.tessera16('pietra', v), a = ASCE.tessera16('assi', v), s0 = APAL.indice('pietra:1'), l0 = APAL.indice('legno:0');
    for (let i = 0; i < 16; i++) { assert.strictEqual(t[15 * 16 + i], s0); assert.strictEqual(t[i * 16 + 15], s0); assert.strictEqual(a[15 * 16 + i], l0); }
  }
  const AT = ASCE.atlante();
  assert.strictEqual(AT.w, 16 * ASCE.VARIANTI); assert.strictEqual(AT.h, 16 * ASCE.MATERIALI.length); assert.strictEqual(AT.dati.length, AT.w * AT.h);
  assert.strictEqual(AT.dati[(2 * 16 + 5) * AT.w + 3 * 16 + 7], ASCE.tessera16('terra', 3)[5 * 16 + 7], 'atlante: materiale in riga, variante in colonna');
  // luci: ogni momento ha colori validi e toni della palette per cielo e nebbia; interni sempre «sotterraneo»; la perdizione cresce
  const hexok = c => /^#[0-9a-f]{6}$/.test(c);
  for (const t of Object.keys(ASCE.TEMI)) for (const f of ['giorno', 'tramonto', 'notte']) for (let liv = 0; liv <= 3; liv++) {
    const L = ASCE.lucePx(t, f, liv);
    assert(hexok(L.sole.col) && L.sole.int > 0 && L.sole.int <= 1 && L.sole.pos.length === 3, 'sole');
    assert(hexok(L.amb[0]) && L.amb[1] > 0 && L.amb[1] < 1 && hexok(L.rifl[0]) && L.rifl[1] > 0, 'ambiente e riflesso');
    assert(hexok(L.rim.eroi) && hexok(L.rim.nemici) && L.rim.forza > 0, 'luce di contorno');
    assert(L.fiamme >= 0 && L.fiamme <= 1, 'peso delle fiamme');
    assert.strictEqual(L.cielo.length, 3); for (const c of L.cielo) assert(APAL.indice(c) >= 0, 'cielo in palette: ' + c);
    if (L.nebbia) assert(APAL.indice(L.nebbia[0]) >= 0 && L.nebbia[1] > 0 && L.nebbia[1] < 1, 'nebbia in palette');
    if (ASCE.TEMI[t].interno) assert.strictEqual(L.momento, 'sotterraneo', t + ' è al chiuso');
    else assert.strictEqual(L.momento, f);
  }
  const sot = ASCE.lucePx('sotterraneo', 'giorno', 0), gio = ASCE.lucePx('foresta', 'giorno', 0), nt = ASCE.lucePx('foresta', 'notte', 0);
  assert(sot.torce && nt.torce && !gio.torce, 'torce al chiuso e di notte');
  assert(gio.fiamme === 0 && sot.fiamme === 1 && nt.fiamme === 1, 'di giorno il sole copre le fiamme');
  assert(gio.sole.int > 2 * nt.sole.int && gio.sole.int > 2 * sot.sole.int, 'il sole pesa di giorno; di notte e al chiuso la luce piena viene dalle torce');
  assert.strictEqual(gio.nebbia, null, 'di giorno niente nebbia');
  const forza = l => ASCE.lucePx('foresta', 'notte', l).nebbia[1];
  assert(forza(1) < forza(2) && forza(2) < forza(3), 'la nebbia della perdizione cresce a 25/50/75');
  assert.strictEqual(APAL.rampa(APAL.indice(ASCE.lucePx('foresta', 'notte', 3).nebbia[0])), APAL.NOMI.indexOf('fuoco'), 'a perdizione alta la nebbia è rossa');
  assert.notStrictEqual(ASCE.lucePx('foresta', 'notte', 3).amb[0], nt.amb[0], 'la perdizione tinge la luce');
  assert.strictEqual(ASCE.lucePx('bosco', 'giorno', 0).momento, 'giorno', 'anche dall\'ambiente');
}
console.log('test_avv_scena: ok');
