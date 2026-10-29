// Bottino e botteghe dell'avventura: bottino sempre valido, scorta ripetibile, compravendita senza creare monete.
const assert = require('assert');
const O = require('../src/js/motori/27b-avv-oggetti.js');
const B = require('../src/js/motori/27c-avv-bottino.js');
const D = require('../src/js/motori/27a-avv-dadi.js');
const gen = seme => D.gen({ rng: D.semina(seme) });
const copia = x => JSON.parse(JSON.stringify(x));
const stato = (oro = 500, n = 2) => ({ seed: 12345, giorno: 1, oro, eroi: Array.from({ length: n }, (_, i) => ({ nome: 'E' + (i + 1), hp: 10, zaino: [] })), negozi: {} });

// ---- bottino ----
{
  for (let p = 1; p <= 5; p++) for (const fonte of ['scrigno', 'nemico', 'ricompensa']) for (const ambiente of ['strada', 'bosco', 'antro', 'torre', 'citta', undefined]) {
    const g = gen(p * 100 + fonte.length); for (let i = 0; i < 150; i++) {
      const b = B.bottino(g, { pericolo: p, fonte, ambiente });
      assert(Number.isInteger(b.oro) && b.oro >= 6 * p && b.oro <= 15 * p * 3, `oro ${b.oro} (p${p} ${fonte})`);
      assert(Array.isArray(b.oggetti) && b.oggetti.length <= 2); if (fonte === 'scrigno' || fonte === 'ricompensa') assert(b.oggetti.length >= 1);
      for (const id of b.oggetti) { const o = O.OGG[id]; assert(o && o.slot !== 'miss' && o.liv <= 2 * p, `${id} non adatto al pericolo ${p}`); }
    }
  }
  // pericolo fuori scala: si riporta nei limiti; parametri mancanti: scrigno di pericolo 1
  assert(B.bottino(gen(1), { pericolo: 99, fonte: 'scrigno' }).oggetti.every(id => O.OGG[id].liv <= 10)); assert(B.bottino(gen(1), {}).oro >= 6); assert(B.bottino(gen(1)).oggetti.length >= 1);
  // ripetibile: stesso seme, stesso bottino
  assert.deepStrictEqual(B.bottino(gen(7), { pericolo: 3, fonte: 'scrigno', ambiente: 'antro' }), B.bottino(gen(7), { pericolo: 3, fonte: 'scrigno', ambiente: 'antro' }));
  // più pericolo = più oro e oggetti più rari; nessun leggendario nei primi tre livelli
  const stat = (p, fonte, amb) => { const g = gen(900 + p), r = { oro: 0, ra: { comune: 0, rara: 0, epica: 0, leggendaria: 0 }, cat: {}, n: 0 }; for (let i = 0; i < 4000; i++) { const b = B.bottino(g, { pericolo: p, fonte, ambiente: amb }); r.oro += b.oro; for (const id of b.oggetti) { r.ra[O.OGG[id].ra]++; r.cat[O.OGG[id].slot] = (r.cat[O.OGG[id].slot] || 0) + 1; r.n++; } } return r; };
  const s1 = stat(1, 'scrigno'), s3 = stat(3, 'scrigno'), s5 = stat(5, 'scrigno');
  assert(s1.oro < s3.oro && s3.oro < s5.oro, 'più oro con più pericolo');
  const quota = (s, ra) => s.ra[ra] / s.n; assert(quota(s1, 'rara') < quota(s3, 'rara') && quota(s3, 'epica') < quota(s5, 'epica'), 'più rarità con più pericolo');
  assert(s1.ra.epica === 0 && s1.ra.leggendaria === 0 && s3.ra.leggendaria === 0 && s5.ra.leggendaria > 0, 'i leggendari si trovano solo in alto');
  assert(quota(s1, 'comune') > .75 && quota(s5, 'comune') < .3);
  // l'ambiente sposta le categorie, il nemico lascia soprattutto consumabili
  assert(stat(3, 'scrigno', 'torre').cat.acc > stat(3, 'scrigno', 'strada').cat.acc * 1.4, 'la torre dà più accessori');
  assert(stat(3, 'scrigno', 'antro').cat.arma > stat(3, 'scrigno', 'strada').cat.arma * 1.4, 'l\'antro dà più armi');
  const nem = stat(2, 'nemico'); assert(nem.n < 4000 * .5 && nem.cat.cons / nem.n > .45, 'i nemici lasciano poco e soprattutto consumabili');
  // ogni oggetto non di missione può uscire in qualche scrigno (nessun oggetto irraggiungibile, salvo quelli del negozio)
  const visti = new Set(); for (let p = 1; p <= 5; p++) { const g = gen(77 + p); for (const f of ['scrigno', 'ricompensa']) for (let i = 0; i < 6000; i++) B.bottino(g, { pericolo: p, fonte: f }).oggetti.forEach(id => visti.add(id)); }
  const mai = O.ID.filter(id => O.OGG[id].slot !== 'miss' && !visti.has(id)); assert.strictEqual(mai.length, 0, 'mai usciti: ' + mai.join(', '));
}

// ---- negozi ----
{
  assert.strictEqual(B.negozio(1, 1, 'inesistente'), null);
  for (const tipo of Object.keys(B.NEGOZI)) {
    const n = B.negozio(12345, 1, tipo), N = B.NEGOZI[tipo];
    assert(n.roba.length > 10 && n.tipo === tipo && n.nome && n.periodo === 0); const ids = n.roba.map(v => v.id); assert.strictEqual(new Set(ids).size, ids.length, 'nessun doppione');
    const fissi = n.roba.filter(v => v.qta === null), rot = n.roba.filter(v => v.qta === 1);
    assert.strictEqual(fissi.length + rot.length, n.roba.length); assert.strictEqual(rot.length, N.n);
    for (const v of n.roba) { const o = O.OGG[v.id]; assert(N.cat.includes(o.slot) && v.pr === o.pr && o.slot !== 'miss', v.id); }
    assert(fissi.every(v => O.OGG[v.id].ra === 'comune') && rot.every(v => ['rara', 'epica'].includes(O.OGG[v.id].ra)));
    // tutta la merce comune della categoria c'è sempre
    assert.strictEqual(fissi.length, O.ID.filter(i => O.OGG[i].ra === 'comune' && N.cat.includes(O.OGG[i].slot)).length);
    // ripetibile; stesso periodo (giorni 1-3) stessa merce, dopo cambia
    assert.deepStrictEqual(n, B.negozio(12345, 1, tipo)); assert.deepStrictEqual(n.roba, B.negozio(12345, 3, tipo).roba);
    const dopo = B.negozio(12345, 4, tipo); assert.strictEqual(dopo.periodo, 1); assert.notDeepStrictEqual(rot.map(v => v.id), dopo.roba.filter(v => v.qta === 1).map(v => v.id));
    assert.notDeepStrictEqual(n.roba, B.negozio(999, 1, tipo).roba, 'un\'altra campagna, un\'altra merce');
  }
  assert.deepStrictEqual([1, 3, 4, 6, 7, 0, -5].map(B.periodoDi), [0, 0, 1, 1, 2, 0, 0]);
  // merce speciale diversa nel tempo: in 30 periodi compaiono molti pezzi diversi
  const visti = new Set(); for (let g = 1; g < 90; g += 3) B.negozio(555, g, 'fabbro').roba.filter(v => v.qta === 1).forEach(v => visti.add(v.id)); assert(visti.size >= 12, 'rotazione: ' + visti.size);
}

// ---- compra e vendi ----
{
  let s = stato(500), r = B.compra(s, 0, 'emporio', 'pozione-cura'); assert(r.ok && r.pr === 25 && s.oro === 475 && s.eroi[0].zaino.length === 1 && s.eroi[1].zaino.length === 0);
  // pezzi speciali: uno solo per periodo, poi esauriti; col nuovo periodo tornano a registro vuoto
  const n = B.negozio(s.seed, 1, 'emporio'), sp = n.roba.find(v => v.qta === 1); s.oro = 5000;
  assert(B.compra(s, 1, 'emporio', sp.id).ok); assert.strictEqual(B.compra(s, 1, 'emporio', sp.id).err, 'Esaurito'); assert.strictEqual(B.restano(s, n, sp), 0); assert.strictEqual(B.restano(s, n, n.roba[0]), null);
  const oroPrima = s.oro; s.giorno = 4; const n4 = B.negozio(s.seed, 4, 'emporio'); assert.strictEqual(B.restano(s, n4, n4.roba.find(v => v.qta === 1)), 1); assert.strictEqual(s.oro, oroPrima);
  assert(B.compra(s, 0, 'emporio', n4.roba.find(v => v.qta === 1).id).ok); s.giorno = 1;
  // errori: monete, eroe, bottega, merce, zaino pieno; nulla cambia
  s = stato(10); const fotografia = copia(s);
  for (const [ie, t, id, parte] of [[0, 'fabbro', 'spada-lunga', 'Servono 30'], [5, 'fabbro', 'cuoio', 'eroe'], ['0', 'fabbro', 'cuoio', 'eroe'], [0, 'banco', 'cuoio', 'sconosciuta'], [0, 'fabbro', 'pozione-cura', 'in vendita'], [0, 'fabbro', 'sigillo-dei-corvi', 'in vendita']]) {
    const e = B.compra(s, ie, t, id); assert(e.err && e.err.includes(parte), e.err); assert.deepStrictEqual(s.eroi, fotografia.eroi); assert.strictEqual(s.oro, 10);
  }
  s.oro = 1000; s.eroi[0].zaino = Array(O.MAX_ZAINO).fill('razione'); assert(B.compra(s, 0, 'fabbro', 'cuoio').err.includes('pieno')); assert.strictEqual(s.oro, 1000);
  // vendita: metà prezzo, solo dallo zaino, mai gli oggetti di missione
  s = stato(0); s.eroi[0].zaino = ['spada-lunga', 'sigillo-dei-corvi', 'stracci', 'lama-della-brace']; s.eroi[0].equip = { arma: 'bastone' };
  assert.deepStrictEqual(B.vendi(s, 0, 'spada-lunga'), { ok: true, v: 15 }); assert.strictEqual(s.oro, 15); assert(B.vendi(s, 0, 'spada-lunga').err); assert(B.vendi(s, 0, 'bastone').err.includes('zaino'), 'quello equipaggiato non si vende');
  assert(B.vendi(s, 0, 'sigillo-dei-corvi').err.includes('Nessuno')); assert(s.eroi[0].zaino.includes('sigillo-dei-corvi')); assert.strictEqual(B.vendi(s, 0, 'stracci').v, 1);
  assert.strictEqual(B.vendi(s, 0, 'lama-della-brace').v, 450); assert(B.vendi(s, 1, 'cuoio').err); assert(B.vendi(s, 0, 'boh').err);
  assert.strictEqual(B.prezzoVendita('pozione-cura'), 12); assert.strictEqual(B.prezzoVendita('sigillo-dei-corvi'), 0); assert.strictEqual(B.prezzoVendita('x'), 0);
}
// conservazione dell'oro: comprare e rivendere non crea mai monete (2000 operazioni a caso)
{
  const s = stato(1000, 3), g = gen(31), inizio = s.oro; let speso = 0, ricavato = 0;
  const merce = ['fabbro', 'emporio'].flatMap(t => B.negozio(s.seed, 1, t).roba.map(v => [t, v.id]));
  for (let i = 0; i < 2000; i++) {
    const ie = Math.floor(g() * 3), prima = s.oro;
    if (g() < .55) { const [t, id] = merce[Math.floor(g() * merce.length)], r = B.compra(s, ie, t, id); if (r.ok) { speso += r.pr; assert.strictEqual(s.oro, prima - r.pr); } else assert.strictEqual(s.oro, prima); }
    else { const z = s.eroi[ie].zaino; if (!z.length) continue; const r = B.vendi(s, ie, z[Math.floor(g() * z.length)]); if (r.ok) { ricavato += r.v; assert.strictEqual(s.oro, prima + r.v); } }
    assert(s.oro >= 0 && s.oro <= inizio, 'monete create dal nulla: ' + s.oro); assert(s.eroi.every(h => h.zaino.length <= O.MAX_ZAINO));
  }
  assert.strictEqual(s.oro, inizio - speso + ricavato); assert(ricavato <= speso / 2 + 1, 'si rivende al massimo a metà prezzo');
  // un solo pezzo comprato e subito rivenduto costa almeno la metà del prezzo
  const t = stato(100); const c = B.compra(t, 0, 'fabbro', 'spada-lunga'), v = B.vendi(t, 0, 'spada-lunga'); assert.strictEqual(t.oro, 100 - c.pr + v.v); assert(t.oro < 100);
}

// ---- assegnare il bottino ----
{
  const s = stato(0, 3); s.eroi[1].zaino = ['razione', 'razione']; s.eroi[2].hp = 0;
  let r = B.assegna(s, { oro: 40, oggetti: ['pozione-cura', 'cuoio'] }); assert.strictEqual(s.oro, 40);
  assert.deepStrictEqual(r.presi, [{ id: 'pozione-cura', eroe: 0 }, { id: 'cuoio', eroe: 0 }], 'a chi ha più posto, non a chi è a terra'); assert.deepStrictEqual(s.eroi[2].zaino, []);
  // zaini pieni: l'oggetto diventa monete, non si perde nulla
  const p = stato(0, 2); for (const h of p.eroi) h.zaino = Array(O.MAX_ZAINO).fill('razione'); r = B.assegna(p, { oro: 10, oggetti: ['spada-lunga', 'sigillo-dei-corvi'] });
  assert.deepStrictEqual(r.convertiti, ['spada-lunga', 'sigillo-dei-corvi']); assert.strictEqual(p.oro, 10 + 15, 'solo ciò che ha un prezzo');
  assert.deepStrictEqual(B.assegna(stato(5), { oro: 0, oggetti: [] }), { oro: 0, presi: [], convertiti: [] });
  // bottino vero dentro uno stato: tutto coerente
  const q = stato(0, 2), g = gen(5); for (let i = 0; i < 300; i++) B.assegna(q, B.bottino(g, { pericolo: 1 + i % 5, fonte: 'scrigno' })); assert(q.oro > 0 && q.eroi.every(h => h.zaino.length <= O.MAX_ZAINO && h.zaino.every(id => O.OGG[id])));
}
console.log('avv_bottino ok');
