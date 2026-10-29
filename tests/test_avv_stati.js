// Stati alterati e danni dell'avventura: durate, vantaggio/svantaggio, resistenze, caduta a terra, cure.
const assert = require('assert');
const S = require('../src/js/motori/27d-avv-stati.js');
const D = require('../src/js/motori/27a-avv-dadi.js');
const cb = o => Object.assign({ id: 'x', nome: 'X', lato: 'eroi', liv: 1, hp: 20, hpMax: 20, temp: 0, ca: 12, att: 3, magia: 3, dan: { n: 1, dado: 6, bonus: 2, tipo: 'taglio' },
  salv: { for: 0, des: 0, cos: 0, int: 0, sag: 0, car: 0 }, cd: 11, iniz: 0, mov: 6, gitt: 1, crit: 20, res: [], vuln: [], imm: [], immStati: [], stati: [], conc: 2, concMax: 2, usi: {}, poteri: ['attacco'], hook: {} }, o || {});
const fisso = v => () => v;       // d20 = 1 + floor(v*20): .99 -> 20, 0 -> 1, .5 -> 11
const nem = o => cb(Object.assign({ id: 'n', nome: 'Nemico', lato: 'nemici' }, o || {}));

// ---- i dieci stati richiesti dal piano più quelli di servizio, tutti descritti ----
for (const id of ['terra', 'stordito', 'accecato', 'avvelenato', 'in-fiamme', 'congelato', 'benedetto', 'maledetto', 'nascosto', 'provocato'])
  assert.ok(S.STATI[id], 'stato ' + id);
for (const id of S.ID) assert.ok(S.STATI[id].nome && S.STATI[id].desc, 'nome e descrizione di ' + id);
assert.deepStrictEqual(S.TIPI, ['taglio', 'perforante', 'contundente', 'fuoco', 'gelo', 'fulmine', 'necrotico', 'radioso', 'veleno']);

// ---- aggiungere, rinnovare, immunità ----
{
  const c = cb();
  assert.ok(S.aggiungi(c, 'accecato', 2));
  assert.deepStrictEqual(c.stati.map(x => [x.id, x.t, x.fino]), [['accecato', 2, 'fine']]);
  S.aggiungi(c, 'accecato', 1); assert.strictEqual(c.stati.length, 1); assert.strictEqual(c.stati[0].t, 2, 'una durata più corta non accorcia');
  S.aggiungi(c, 'accecato', 4); assert.strictEqual(c.stati[0].t, 4, 'la più lunga rinnova');
  assert.throws(() => S.aggiungi(c, 'inesistente', 1));
  const im = cb({ immStati: ['stordito'] }); assert.strictEqual(S.aggiungi(im, 'stordito', 1), false); assert.strictEqual(im.stati.length, 0);
  const morto = nem({ morto: true, hp: 0 }); assert.strictEqual(S.aggiungi(morto, 'accecato', 1), false);
  const p = cb(); S.aggiungi(p, 'nascosto'); assert.strictEqual(p.stati[0].t, null, 'senza durata');
  assert.deepStrictEqual(S.rimuovi(c, ['accecato', 'terra', 'stordito']), ['accecato']);
}

// ---- durate: fine turno e «fino all'inizio»; Spirito indomito ----
{
  const c = cb(); S.aggiungi(c, 'maledetto', 2); S.aggiungi(c, 'protetto', 1, { ca: 4, fino: 'inizio' });
  assert.strictEqual(S.caEff(c), 16, 'protetto +4');
  S.fineTurno(c); assert.strictEqual(S.trova(c, 'maledetto').t, 1); assert.ok(S.ha(c, 'protetto'), 'quello «fino all\'inizio» non scala a fine turno');
  S.inizioTurno(c, fisso(.5)); assert.ok(!S.ha(c, 'protetto'), 'finisce all\'inizio del turno successivo'); assert.strictEqual(S.caEff(c), 12);
  const ev = S.fineTurno(c); assert.ok(!S.ha(c, 'maledetto')); assert.deepStrictEqual(ev.map(e => e.stato), ['maledetto']);
  const t = cb({ hook: { breve: 1 } }); S.aggiungi(t, 'accecato', 2); S.aggiungi(t, 'benedetto', 2); S.fineTurno(t);
  assert.ok(!S.ha(t, 'accecato'), 'negativo: un turno in meno'); assert.strictEqual(S.trova(t, 'benedetto').t, 1, 'positivo: normale');
}

// ---- danni nel tempo ----
{
  const c = cb({ hp: 30, hpMax: 30 }); S.aggiungi(c, 'in-fiamme', 3);
  const ev = S.inizioTurno(c, fisso(.99)); assert.strictEqual(ev[0].t, 'dot'); assert.strictEqual(ev[0].n, 6); assert.strictEqual(c.hp, 24);
  const r = cb({ hp: 30, hpMax: 30, res: ['fuoco'] }); S.aggiungi(r, 'in-fiamme', 1); S.inizioTurno(r, fisso(.99)); assert.strictEqual(r.hp, 27, 'la resistenza vale anche per le fiamme');
}

// ---- tipi di danno ----
{
  assert.deepStrictEqual(S.effettivo(cb({ res: ['fuoco'] }), 9, 'fuoco'), { n: 4, esito: 'res' });
  assert.strictEqual(S.effettivo(cb({ res: ['fuoco'] }), 1, 'fuoco').n, 1, 'la resistenza non azzera mai un colpo');
  assert.strictEqual(S.effettivo(cb({ res: ['fuoco'] }), 0, 'fuoco').n, 0);
  assert.deepStrictEqual(S.effettivo(cb({ vuln: ['gelo'] }), 7, 'gelo'), { n: 14, esito: 'vuln' });
  assert.deepStrictEqual(S.effettivo(cb({ imm: ['veleno'] }), 7, 'veleno'), { n: 0, esito: 'imm' });
  assert.deepStrictEqual(S.effettivo(cb({ res: ['fuoco'], vuln: ['fuoco'] }), 8, 'fuoco'), { n: 8, esito: null }, 'resistenza e vulnerabilità si annullano');
  assert.strictEqual(S.effettivo(cb({ res: ['taglio'] }), 8, 'fulmine').n, 8, 'un altro tipo non cambia');
  const c = cb(); S.aggiungi(c, 'protetto', 2, { ca: 3, res: S.FISICI }); assert.strictEqual(S.effettivo(c, 10, 'taglio').n, 5, 'la resistenza può venire da uno stato');
}

// ---- PF temporanei, caduta a terra, morte dei mostri, cura ----
{
  const c = cb({ hp: 10, hpMax: 20, temp: 4 }); const r = S.danno(c, 7, 'taglio'); assert.strictEqual(r.assorbito, 4); assert.strictEqual(c.hp, 7); assert.strictEqual(c.temp, 0);
  const e = cb({ hp: 5, hpMax: 20 }); S.aggiungi(e, 'benedetto', 3); S.aggiungi(e, 'nascosto');
  const k = S.danno(e, 99, 'taglio'); assert.ok(k.a0); assert.strictEqual(e.hp, 0); assert.ok(S.ha(e, 'terra')); assert.ok(!S.ha(e, 'benedetto'), 'a terra si perdono gli stati'); assert.ok(!S.ha(e, 'nascosto'));
  assert.ok(!S.puoAgire(e)); assert.strictEqual(S.movEff(e), 0);
  const e2 = S.danno(e, 5, 'taglio'); assert.ok(!e2.a0, 'a terra non si "ricade"');
  const rx = S.cura(e, 6); assert.ok(rx.rialzato); assert.strictEqual(e.hp, 6); assert.ok(!S.ha(e, 'terra')); assert.ok(S.puoAgire(e));
  const rs = cb({ hp: 0, hpMax: 20, hook: { rialzo: 4 } }); S.aggiungi(rs, 'terra'); assert.strictEqual(S.cura(rs, 3).n, 7, 'Rialzo rapido');
  const m = nem({ hp: 5, hpMax: 5 }); S.aggiungi(m, 'accecato', 2); const km = S.danno(m, 5, 'taglio');
  assert.ok(km.a0); assert.ok(m.morto); assert.deepStrictEqual(m.stati, []); assert.strictEqual(S.cura(m, 10).n, 0, 'un mostro morto non si cura');
  const sano = cb({ hp: 18, hpMax: 20 }); assert.strictEqual(S.cura(sano, 99).n, 2, 'non oltre il massimo');
  const t = cb({ temp: 3 }); assert.strictEqual(S.temp(t, 2), 0, 'non si sommano'); assert.strictEqual(S.temp(t, 8), 5); assert.strictEqual(t.temp, 8);
  const tn = cb({ hp: 5 }); const rt = S.danno(tn, 50, 'taglio', { salva1: true }); assert.ok(rt.tenace); assert.strictEqual(tn.hp, 1); assert.ok(!S.ha(tn, 'terra'));
  const tn2 = cb({ hp: 5, temp: 20 }); assert.ok(!S.danno(tn2, 12, 'taglio', { salva1: true }).tenace, 'se i PF temporanei bastano non serve');
}

// ---- vantaggio e svantaggio ----
{
  const a = cb(), b = nem(), plain = S.attacco(a, b); assert.deepStrictEqual([plain.vant, plain.svant, plain.bonus], [false, false, 0]);
  const q = (fa, fb, o) => { const x = cb(), y = nem(); for (const s of fa || []) S.aggiungi(x, s, 2, s === 'provocato' ? { da: 'altro' } : {}); for (const s of fb || []) S.aggiungi(y, s, 2); return S.attacco(x, y, o) };
  assert.ok(q(['accecato'], []).svant, 'accecato attacca con svantaggio');
  assert.ok(q(['avvelenato'], []).svant);
  assert.ok(q([], ['accecato']).vant, 'chi attacca un accecato ha vantaggio');
  assert.ok(q([], ['stordito']).vant); assert.ok(q([], ['terra']).vant);
  assert.ok(q([], ['nascosto']).svant, 'bersaglio nascosto: svantaggio');
  assert.ok(q(['nascosto'], []).vant, 'attaccare da nascosto: vantaggio'); assert.ok(q(['mirato'], []).vant);
  const pari = q(['accecato'], ['accecato']); assert.ok(!pari.vant && !pari.svant, 'vantaggio e svantaggio si annullano');
  assert.ok(q(['provocato'], []).svant, 'provocato da un altro: svantaggio'); assert.ok(!q([], []).svant);
  const x = cb(), y = nem({ id: 'p' }); S.aggiungi(x, 'provocato', 2, { da: 'p' }); assert.ok(!S.attacco(x, y).svant, 'contro chi ti ha provocato nessuna penalità');
  assert.ok(q([], [], { vant: true }).vant && q([], [], { svant: true }).svant, 'il campo di battaglia aggiunge i suoi');
  assert.strictEqual(q(['benedetto'], []).bonus, 2); assert.strictEqual(q(['maledetto'], []).bonus, -2);
  const h = cb(); S.aggiungi(h, 'nascosto'); S.aggiungi(h, 'mirato', 2); S.aggiungi(h, 'accecato', 2);
  assert.deepStrictEqual(S.dopoAttacco(h).sort(), ['mirato', 'nascosto']); assert.deepStrictEqual(h.stati.map(s => s.id), ['accecato'], 'restano gli altri');
}

// ---- tiri salvezza ----
{
  const c = cb({ salv: { for: 5, des: 5, cos: 5, int: 5, sag: 5, car: 5 } });
  assert.ok(S.salvezza(c, 'cos', 14, fisso(.5)).ok, '11+5 >= 14'); assert.ok(!S.salvezza(c, 'cos', 17, fisso(.5)).ok);
  assert.ok(S.salvezza(c, 'cos', 30, fisso(.99)).ok, '20 naturale riesce sempre'); assert.ok(!S.salvezza(c, 'cos', 1, fisso(0)).ok, '1 naturale fallisce sempre');
  S.aggiungi(c, 'stordito', 1);
  assert.ok(!S.salvezza(c, 'des', 5, fisso(.99)).ok, 'stordito: fallisce Destrezza'); assert.ok(!S.salvezza(c, 'for', 5, fisso(.99)).ok); assert.ok(S.salvezza(c, 'sag', 5, fisso(.99)).ok, 'ma non Saggezza');
  const b = cb({ salv: { for: 0, des: 0, cos: 0, int: 0, sag: 0, car: 0 } }); S.aggiungi(b, 'benedetto', 2); assert.ok(S.salvezza(b, 'sag', 13, fisso(.5)).ok, '11+0+2 >= 13');
  S.aggiungi(b, 'maledetto', 2); S.togli(b, 'benedetto'); assert.ok(!S.salvezza(b, 'sag', 10, fisso(.5)).ok, '11-2 < 10');
}

// ---- movimento ----
{
  const c = cb({ mov: 7 }); assert.strictEqual(S.movEff(c), 7); S.aggiungi(c, 'rallentato', 1); assert.strictEqual(S.movEff(c), 3);
  S.aggiungi(c, 'impigliato', 1); assert.strictEqual(S.movEff(c), 0); assert.strictEqual(S.caEff(c), 11);
  const g = cb(); S.aggiungi(g, 'congelato', 1); assert.strictEqual(S.caEff(g), 10); assert.strictEqual(S.movEff(g), 3);
}

// ---- proprietà: 3000 operazioni a caso non rompono mai un combattente ----
{
  const g = D.gen({ rng: D.semina(99) }), tipi = S.TIPI, DA_DARE = S.ID.filter(i => i !== 'terra');
  const lista = [cb({ id: 'a' }), nem({ id: 'b', hp: 40, hpMax: 40 }), cb({ id: 'c', hook: { rialzo: 3, breve: 1 } })];
  for (let i = 0; i < 3000; i++) {
    const c = lista[Math.floor(g() * lista.length)], k = Math.floor(g() * 7);
    if (k === 0) S.danno(c, Math.floor(g() * 30), tipi[Math.floor(g() * tipi.length)], { salva1: g() < .3 });
    else if (k === 1) S.cura(c, Math.floor(g() * 15));
    else if (k === 2) S.aggiungi(c, DA_DARE[Math.floor(g() * DA_DARE.length)], 1 + Math.floor(g() * 3), g() < .3 ? { fino: 'inizio' } : {});   // «a terra» lo dà solo la caduta a 0 PF
    else if (k === 3) S.inizioTurno(c, g);
    else if (k === 4) S.fineTurno(c);
    else if (k === 5) S.rimuovi(c, [S.ID[Math.floor(g() * S.ID.length)]]);
    else S.temp(c, Math.floor(g() * 9));
    for (const x of lista) {
      assert.ok(Number.isInteger(x.hp) && x.hp >= 0 && x.hp <= x.hpMax, 'PF in range');
      assert.ok(Number.isInteger(x.temp) && x.temp >= 0);
      assert.strictEqual(new Set(x.stati.map(s => s.id)).size, x.stati.length, 'uno stato per tipo');
      for (const s of x.stati) { assert.ok(S.STATI[s.id]); assert.ok(S.STATI[s.id].perm ? s.t == null : Number.isInteger(s.t) && s.t >= 1, 'durata valida ' + JSON.stringify(s)); }
      if (x.lato === 'eroi') assert.strictEqual(x.hp === 0, S.ha(x, 'terra'), 'a terra se e solo se a 0 PF');
      else if (x.hp === 0) { assert.ok(x.morto); assert.strictEqual(x.stati.length, 0) }
      assert.deepStrictEqual(JSON.parse(JSON.stringify(x)), x);
    }
    for (const x of lista) if (x.lato === 'nemici' && x.morto) { x.morto = false; x.hp = x.hpMax }   // il test fa rivivere il mostro per continuare
  }
}
console.log('test_avv_stati: ok');
