// Passo 47: il «Pronto» per posto in compagnia (lato a pronto solo quando lo sono tutti i capitani).
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const X = carica.multi(F, '({ VCAM, VST, VDAT })'), C = X.VCAM, S = X.VST, D = X.VDAT;
const J = JSON.stringify;
const T = (p, o) => Object.keys(o).map(t => ({ p, t, n: o[t] }));
const cap = n => ({ nome: 'Capitano ' + n, pf: 80, att: 16, dif: 12, dan: 12, vel: 15, cavallo: true });
const scheda = k => ({ seme: 7, a: T(0, { val_f2: 20, val_t2: 8, val_c3: 6 }), b: T(5, { fer_f2: 20, fer_t2: 8, fer_c3: 6 }), capi: Array.from({ length: k }, (_, i) => cap(i)), faza: 'tu', fazb: 'fer', reparti: true, ondate: true, max: 80, W: 100, H: 140 });
const stanza = k => { const G = S.nuova(k, ['A', 'B', 'C'].slice(0, k)); G.b = { c: C.nuovo(scheda(k), { autoA: true }), via: false, pausa: false }; return G };
const mossa = (G, t, seat, o) => S.act(G, { t, seat, o });


D.ACCESO.grandi = true;
{
  let G = stanza(3); const via = [];
  for (const [seat, n, ok] of [[1, 1, false], [0, 2, false], [2, 3, true]]) {
    const r = mossa(G, 'b-pronto', seat); assert(!r.err, r.err); G = r.s;
    assert.strictEqual(J(C.pronti(G.b.c)), J({ n, m: 3, tutti: ok }));
    assert.strictEqual(G.b.c.pronto.a, ok); via.push(G.b.via);
    if (!ok) assert.strictEqual(mossa(G, 'b-via', 0).err, 'Aspettate gli altri: Pronto ' + n + '/3');
  }
  assert.strictEqual(J(via), J([false, false, true]));
  assert.strictEqual(G.b.c.pronti.length, 3);
}
{
  let G = stanza(3);
  G = mossa(G, 'b-pronto', 1).s; G = mossa(G, 'b-pronto', 0).s;
  assert.strictEqual(mossa(G, 'b-pronto', 1).err, 'Hai già premuto Pronto');
  assert.strictEqual(S.act(G, { t: 'b-pronto', seat: 3 }).err, 'Non sei seduto a questo tavolo');
  assert.strictEqual(C.pronto(G.b.c, 'a', 3).err, 'Non hai un capitano in campo');
  assert.strictEqual(mossa(G, 'b-pronto', 1, { forza: true }).err, 'Solo il capo della compagnia può partire senza gli altri');
  const r = mossa(G, 'b-pronto', 0, { forza: true }); assert(!r.err, r.err);
  assert.strictEqual(J(C.pronti(r.s.b.c)), J({ n: 3, m: 3, tutti: true })); assert.strictEqual(r.s.b.via, true);
  assert(!mossa(G, 'b-dividi', 1, { r: 0 }).err, 'chi ha premuto può ancora schierare');
}
{ // due telefoni, stesse mosse
  const G = stanza(3); let t1 = G, t2 = JSON.parse(J(G));
  for (const m of [{ t: 'b-dividi', seat: 2, o: { r: 0 } }, { t: 'b-pronto', seat: 2 }, { t: 'b-pronto', seat: 1 }, { t: 'b-pronto', seat: 0 }, { t: 'tempo', seat: 0, fino: 5 }]) {
    const a = S.act(t1, m), b = S.act(t2, m); assert(!a.err, a.err); assert.strictEqual(J(a.s), J(b.s)); t1 = a.s; t2 = b.s }
  assert(t1.b.c.t > 0, 'la battaglia è partita da sola');
  // un solo capitano: flag unico, nessun `pronti`, il «Via» lo dà la vista
  let U = stanza(1); U = mossa(U, 'b-pronto', 0).s; assert.strictEqual(U.b.c.pronto.a, true); assert.strictEqual(U.b.c.pronti, undefined); assert.strictEqual(U.b.via, false);
}
{ // vecchio salvataggio: pronto.a vero senza pronti
  const s = C.nuovo(scheda(3), { autoA: true }); s.pronto = { a: true, b: false };
  assert.strictEqual(J(C.pronti(s)), J({ n: 3, m: 3, tutti: true })); assert.strictEqual(C.attesa(s), null);
}
D.ACCESO.grandi = false;
{ // interruttore spento: com'è oggi
  let G = stanza(3); G = mossa(G, 'b-pronto', 1).s;
  assert.strictEqual(G.b.c.pronto.a, true); assert.strictEqual(G.b.c.pronti, undefined); assert.strictEqual(G.b.via, false);
  assert(!mossa(G, 'b-via', 1).err);
}
console.log('p47 ok');
