// Oggetti dell'avventura: catalogo coerente, derivati con ogni combinazione, equipaggiare/togliere, cintura, cure, schede manomesse.
const assert = require('assert');
const E = require('../src/js/motori/27-eroi.js');
const O = require('../src/js/motori/27b-avv-oggetti.js');
const D = require('../src/js/motori/27a-avv-dadi.js');
const A = { pelle: 0, capelli: 0, mantello: 0, viso: 0 };
const base = o => ({ ...E.baseIniziale(), ...o });
const eroe = (classe = 'guerriero', razza = 'umano', b = {}) => E.nuovo({ nome: 'Prova', razza, classe, base: base(b), aspetto: A }, 1);
const copia = x => JSON.parse(JSON.stringify(x));

// ---- catalogo ----
{
  assert(O.ID.length >= 60, 'catalogo ricco: ' + O.ID.length);
  const bande = { comune: [1, 3], rara: [1, 5], epica: [5, 8], leggendaria: [7, 10] };
  for (const id of O.ID) {
    const o = O.OGG[id];
    assert(/^[a-z-]+$/.test(id) && o.id === id && o.nome && ['arma', 'armatura', 'scudo', 'acc', 'cons', 'miss'].includes(o.slot), id);
    assert(O.RARITA[o.ra], id + ': rarità'); assert(Number.isInteger(o.liv) && o.liv >= 1 && o.liv <= E.LIV_MAX, id + ': livello');
    assert(o.liv >= bande[o.ra][0] && o.liv <= bande[o.ra][1], `${id}: livello ${o.liv} fuori dalla fascia ${o.ra}`);
    if (o.slot === 'miss') { assert(o.pr === 0 && o.vend === false, id); continue; }
    const [lo, hi] = O.RARITA[o.ra].pr; assert(Number.isInteger(o.pr) && o.pr >= 1 && (o.pr >= lo || o.ra === 'comune') && o.pr <= hi, `${id}: prezzo ${o.pr} fuori dalla fascia ${o.ra}`);
    if (o.slot === 'arma') {
      assert([4, 6, 8, 10, 12].includes(o.dado) && o.n >= 1 && o.n <= 2 && ['for', 'des'].includes(o.stat) && o.tipo, id);
      assert(!o.acc || o.stat === 'des', id + ': accurata solo con Destrezza'); if (o.lan) assert(o.lan[0] < o.lan[1], id); if (o.gt) assert(o.gt[0] < o.gt[1], id);
    }
    if (o.slot === 'armatura') assert(['leg', 'med', 'pes'].includes(o.tipo) && o.ca >= 10 && o.ca <= 18 && (o.desMax === null || o.desMax === 0 || o.desMax === 2), id);
    if (o.slot === 'scudo') assert(o.ca >= 1 && o.ca <= 3, id);
    if (o.slot === 'cons') assert(o.eff && Object.keys(o.eff).length >= 1, id);
    for (const k of Object.keys(o.fx || {})) assert(['ca', 'att', 'dan', 'iniz', 'mov', 'hp', 'salv', 'ab', 'res'].includes(k), id + ': bonus ' + k);
    for (const a of Object.keys((o.fx || {}).ab || {})) assert(E.ABILITA[a], id + ': abilità ' + a);
  }
  // la rarità si paga: il prezzo medio sale con la rarità, a parità di categoria
  const medio = (ra, slot) => { const l = O.ID.map(i => O.OGG[i]).filter(o => o.ra === ra && o.slot === slot); return l.reduce((a, o) => a + o.pr, 0) / l.length; };
  for (const s of ['arma', 'armatura', 'acc', 'cons']) assert(medio('comune', s) < medio('rara', s) && medio('rara', s) < medio('epica', s), s);
  for (const s of ['arma', 'armatura', 'scudo', 'acc']) assert(medio('epica', s) < medio('leggendaria', s), s);
  // ogni classe parte con oggetti che esistono e stanno nel posto giusto
  for (const c of Object.values(E.CLASSI)) for (const [s, id] of Object.entries(c.equip)) if (id) assert(O.slotOk(O.OGG[id], s) && O.OGG[id].liv === 1, id);
  // descrizioni: ogni oggetto ne ha almeno una
  for (const id of O.ID) assert(O.descrivi(id).length >= 1 && O.descrivi(id).every(r => typeof r === 'string' && r.length), id);
  assert.deepStrictEqual(O.descrivi('spada-lunga'), ['d8 taglio']); assert.deepStrictEqual(O.descrivi('spadone'), ['2d6 taglio', 'due mani']);
  assert.deepStrictEqual(O.descrivi('camicia-maglia'), ['CA 13 + Des (max 2)', 'media']); assert.deepStrictEqual(O.descrivi('scudo-del-custode'), ['+2 CA', '+1 CA']);
}

// ---- derivati: i numeri dei vecchi eroi non cambiano ----
{
  const g = eroe('guerriero', 'nano', { for: 15, cos: 14 }), d = E.derivati(g);
  assert.strictEqual(d.ca, 16 + 2 + 1); assert.deepStrictEqual(d.danno, { n: 1, dado: 8, bonus: 3, tipo: 'taglio' }); assert.strictEqual(d.attacco, 3 + 2);
  const l = eroe('ladro', 'umano', { des: 15 }); assert.strictEqual(E.derivati(l).ca, 11 + E.mod(E.derivati(l).stat.des), 'cuoio + Des'); assert.strictEqual(E.derivati(l).danno.dado, 4);
  assert.deepStrictEqual(E.derivati(g).abBonus, {}); assert.deepStrictEqual(E.derivati(g).res, []);
  // senza zaino né equipaggiamento (vecchie schede) tutto funziona
  const v = { ...g }; delete v.zaino; delete v.cintura; assert.strictEqual(E.derivati(v).ca, d.ca); assert(E.coerente(v));
  const nudo = { ...eroe('guerriero', 'umano'), equip: {} }; assert.strictEqual(E.derivati(nudo).ca, 10 + E.mod(E.derivati(nudo).stat.des)); assert.strictEqual(E.derivati(nudo).danno, null);
}
// ogni arma, armatura, scudo e accessorio, da solo e in combinazione: i numeri sono quelli attesi e la scheda resta coerente
{
  const h0 = eroe('guerriero', 'umano', { for: 15, des: 14, cos: 14 }); h0.liv = 10; h0.xp = 8600;
  const st = E.derivati(h0).stat, mf = E.mod(st.for), md = E.mod(st.des);
  for (const id of O.ID.filter(i => O.OGG[i].slot === 'arma')) {
    const o = O.OGG[id], h = { ...h0, equip: { arma: id }, zaino: [], cintura: [] }, d = E.derivati(h), f = o.fx || {};
    const m = o.acc ? Math.max(mf, md) : E.mod(st[o.stat]);
    assert.strictEqual(d.attacco, m + 4 + (f.att || 0), id); assert.deepStrictEqual(d.danno, { n: o.n, dado: o.dado, bonus: m + (f.dan || 0), tipo: o.tipo }, id);
  }
  for (const id of O.ID.filter(i => O.OGG[i].slot === 'armatura')) {
    const o = O.OGG[id], d = E.derivati({ ...h0, equip: { armatura: id } }), f = o.fx || {};
    const dex = o.desMax === 0 ? 0 : o.desMax == null ? md : Math.min(md, o.desMax); assert.strictEqual(d.ca, o.ca + dex + (f.ca || 0), id);
  }
  for (const id of O.ID.filter(i => O.OGG[i].slot === 'scudo')) { const o = O.OGG[id]; assert.strictEqual(E.derivati({ ...h0, equip: { scudo: id } }).ca, 10 + md + o.ca + ((o.fx || {}).ca || 0), id); }
  // accessori uno per uno: bonus ai valori giusti
  const nu = { ...h0, equip: {} }, d0 = E.derivati(nu);
  for (const id of O.ID.filter(i => O.OGG[i].slot === 'acc')) {
    const f = O.OGG[id].fx, d = E.derivati({ ...nu, equip: { acc1: id } });
    assert.strictEqual(d.ca, d0.ca + (f.ca || 0), id); assert.strictEqual(d.iniziativa, d0.iniziativa + (f.iniz || 0), id); assert.strictEqual(d.mov, d0.mov + (f.mov || 0), id);
    assert.strictEqual(d.hpMax, d0.hpMax + (f.hp || 0), id);
  }
  // somma di tutto: un equipaggiamento pieno di oggetti magici
  const pieno = { ...h0, equip: { arma: 'lama-della-brace', armatura: 'maglia-argentea', scudo: 'scudo-del-custode', acc1: 'anello-protettivo', acc2: 'anello-del-custode' } }, dp = E.derivati(pieno);
  assert.strictEqual(dp.ca, 16 + 1 + (2 + 1) + 1 + 2); assert.strictEqual(dp.attacco, mf + 4 + 2); assert.strictEqual(dp.danno.bonus, mf + 2);
  // due accessori con gli stessi bonus si sommano, le resistenze non si ripetono
  const doppio = E.derivati({ ...nu, equip: { acc1: 'anello-di-rame', acc2: 'anello-di-rame' } }); assert.strictEqual(doppio.iniziativa, d0.iniziativa + 2);
  assert.deepStrictEqual(E.derivati({ ...nu, equip: { armatura: 'corazza-del-guardiano', scudo: 'scudo-specchio', acc1: 'mantello-fiammeo' } }).res.sort(), ['contundente', 'fuoco', 'gelo']);
  assert.strictEqual(E.derivati({ ...nu, equip: { acc1: 'stivali-leggeri', scudo: 'scudo-torre' } }).mov, d0.mov, '+1 e -1 si annullano');
  // le abilità leggono il bonus: guanti del ladro + furtività
  const b0 = E.bonus(nu, 'furtivita'); assert.strictEqual(E.bonus({ ...nu, equip: { acc1: 'guanti-del-ladro' } }, 'furtivita'), b0 + 2);
  assert(E.probabilita({ ...nu, equip: { acc1: 'guanti-del-ladro' } }, 'furtivita', 15) > E.probabilita(nu, 'furtivita', 15));
}

// ---- equipaggiare, togliere, cintura ----
{
  const h = eroe('guerriero', 'umano', { for: 15, cos: 14 }); h.liv = 3; h.xp = 300; h.hpMax = E.derivati(h).hpMax; h.hp = h.hpMax; h.zaino = ['spada-argentata', 'scudo-torre', 'pozione-cura', 'pozione-cura', 'antidoto', 'amuleto-vitale', 'arco-lungo', 'razione', 'mazza'];
  const ca0 = E.derivati(h).ca;
  let r = O.equipaggia(h, 'spada-argentata'); assert(r.ok && h.equip.arma === 'spada-argentata' && h.zaino.includes('spada-lunga') && !h.zaino.includes('spada-argentata'), 'scambio con lo zaino');
  assert.strictEqual(E.derivati(h).attacco, E.mod(E.derivati(h).stat.for) + 2 + 1);
  r = O.equipaggia(h, 'scudo-torre'); assert(r.ok && h.equip.scudo === 'scudo-torre' && h.zaino.includes('scudo-legno')); assert.strictEqual(h.mov, undefined);
  assert.strictEqual(E.derivati(h).ca, ca0 + 1, 'scudo a torre +3 al posto di +2');
  assert(O.equipaggia(h, 'arco-lungo').err.includes('scudo'), 'due mani con lo scudo');
  assert(O.togli(h, 'scudo').ok && h.equip.scudo === null && O.equipaggia(h, 'arco-lungo').ok, 'tolto lo scudo si può');
  assert(O.equipaggia(h, 'scudo-legno').err.includes('due mani'), 'e viceversa');
  assert(O.equipaggia(h, 'amuleto-vitale', 'arma').err, 'posto sbagliato'); assert(O.equipaggia(h, 'inesistente').err); assert(O.equipaggia(h, 'bomba-fuoco').err);
  assert(O.equipaggia(h, 'maglia-argentea').err.includes('zaino'), 'deve stare nello zaino');
  const bassoLiv = { ...h, zaino: ['armatura-completa'] }; assert(O.equipaggia(bassoLiv, 'armatura-completa').err.includes('livello 5'));
  // accessori: due posti, il terzo sostituisce il primo
  h.zaino = ['amuleto-vitale', 'anello-protettivo', 'anello-del-tiro']; assert(O.equipaggia(h, 'amuleto-vitale').ok && h.equip.acc1 === 'amuleto-vitale');
  assert(O.equipaggia(h, 'anello-protettivo').ok && h.equip.acc2 === 'anello-protettivo'); assert(O.equipaggia(h, 'anello-del-tiro').ok && h.equip.acc1 === 'anello-del-tiro' && h.zaino.includes('amuleto-vitale'));
  // PF: l'amuleto alza il massimo ma non cura; toglierlo non lascia PF in eccesso
  const g = eroe('guerriero', 'umano', { cos: 14 }); g.liv = 3; g.xp = 300; g.hpMax = E.derivati(g).hpMax; g.hp = 5; g.zaino = ['amuleto-vitale'];
  const mx = g.hpMax; O.equipaggia(g, 'amuleto-vitale'); assert.strictEqual(g.hpMax, mx + 8); assert.strictEqual(g.hp, 5, 'nessuna cura gratis'); assert(E.coerente(g));
  g.hp = g.hpMax; O.togli(g, 'acc1'); assert.strictEqual(g.hpMax, mx); assert.strictEqual(g.hp, mx, 'PF riportati al massimo'); assert(E.coerente(g));
  // zaino pieno: togliere non è possibile; la cintura accetta solo consumabili, al massimo 3
  const p = eroe(); p.zaino = Array(O.MAX_ZAINO).fill('razione'); assert(O.togli(p, 'arma').err.includes('pieno')); assert.strictEqual(p.equip.arma, 'spada-lunga');
  const c = eroe(); c.zaino = ['pozione-cura', 'pozione-cura', 'antidoto', 'razione', 'spada-corta'];
  assert(O.allaCintura(c, 'spada-corta').err); assert(O.allaCintura(c, 'pozione-cura').ok && O.allaCintura(c, 'pozione-cura').ok && O.allaCintura(c, 'antidoto').ok);
  assert(O.allaCintura(c, 'razione').err.includes('piena')); assert.deepStrictEqual(c.cintura, ['pozione-cura', 'pozione-cura', 'antidoto']); assert.strictEqual(c.zaino.length, 2);
  assert(O.dallaCintura(c, 'antidoto').ok && c.zaino.includes('antidoto') && c.cintura.length === 2); assert(O.dallaCintura(c, 'razione').err);
  // anteprima: confronto senza toccare la scheda
  const cc = eroe(); cc.liv = 3; cc.xp = 300; cc.hpMax = E.derivati(cc).hpMax; cc.hp = cc.hpMax; cc.zaino = ['spada-argentata']; const prima = copia(cc), an = O.anteprima(cc, 'spada-argentata'); assert.deepStrictEqual(cc, prima, 'la scheda non cambia');
  assert.strictEqual(E.derivati(an).attacco, E.derivati(cc).attacco + 1); assert.strictEqual(O.anteprima(cc, 'armatura-completa'), null);
  assert.strictEqual(O.anteprima({ ...cc, zaino: [] }, 'spada-argentata').equip.arma, 'spada-argentata', 'anche per un oggetto che non hai ancora');
}

// ---- cure fuori dalla battaglia ----
{
  const h = eroe(); h.liv = 3; h.xp = 300; h.hpMax = E.derivati(h).hpMax; h.hp = 3; h.zaino = ['pozione-cura', 'bomba-fuoco']; h.cintura = ['pozione-cura'];
  const g = D.gen({ rng: D.semina(4) }); let r = O.usa(h, 'pozione-cura', g); assert(r.ok && r.cura >= 4 && r.cura <= 10 && h.hp === 3 + r.cura, 'cura 2d4+2'); assert.strictEqual(h.cintura.length, 0, 'prima la cintura'); assert.strictEqual(h.zaino.length, 2);
  assert(O.usa(h, 'bomba-fuoco', g).err.includes('battaglia')); h.hp = h.hpMax; assert(O.usa(h, 'pozione-cura', g).err.includes('forma')); h.hp = 0; assert(O.usa(h, 'pozione-cura', g).err.includes('terra'));
  h.hp = 1; h.zaino = []; assert(O.usa(h, 'pozione-cura', g).err); assert(O.usa(h, 'spada-lunga', g).err);
  const mx = { ...h, hp: 1, hpMax: 100, zaino: ['pozione-cura-suprema'], cintura: [] }; r = O.usa(mx, 'pozione-cura-suprema', () => 0.999999); assert.strictEqual(r.cura, 8 * 4 + 8);
  const quasi = { ...h, hp: 9, hpMax: 10, zaino: ['pozione-cura-suprema'], cintura: [] }; r = O.usa(quasi, 'pozione-cura-suprema', () => 0.999999); assert.strictEqual(r.cura, 1, 'la cura non supera il massimo'); assert.strictEqual(quasi.hp, 10);
}

// ---- schede manomesse ----
{
  const ok = eroe(); assert(E.coerente(ok) && O.invValido(ok) === null);
  const cattive = [
    h => { h.equip.arma = 'spada-inventata'; }, h => { h.equip.arma = 'scudo-legno'; }, h => { h.equip.scudo = 'spada-lunga'; }, h => { h.equip.armatura = 'armatura-completa'; },
    h => { h.equip.acc3 = 'anello-di-rame'; }, h => { h.equip.arma = 'arco'; h.equip.scudo = 'scudo-legno'; }, h => { h.zaino = Array(O.MAX_ZAINO + 1).fill('razione'); },
    h => { h.zaino = ['non-esiste']; }, h => { h.cintura = ['spada-lunga']; }, h => { h.cintura = ['razione', 'razione', 'razione', 'razione']; }, h => { h.equip = []; }, h => { h.zaino = 'razione'; },
    h => { h.equip.acc1 = 'amuleto-vitale'; } /* PF massimi non aggiornati */];
  for (const [i, m] of cattive.entries()) { const h = copia(ok); m(h); assert(!E.coerente(h), 'scheda manomessa ' + i + ' accettata'); }
  const bella = copia(ok); bella.zaino = ['amuleto-vitale', 'pozione-cura']; O.equipaggia(bella, 'amuleto-vitale'); assert(E.coerente(bella));
}
// eroe nuovo: una pozione nello zaino
{ const h = eroe('mago'); assert.deepStrictEqual(h.zaino, ['pozione-cura']); assert.deepStrictEqual(h.cintura, []); assert(E.coerente(h)); }
console.log('avv_oggetti ok');
