// Bestiario dell'avventura: 4 famiglie × 5 mostri + 3 capi, ruoli, poteri validi, numeri coerenti con i livelli, duelli di controllo.
const assert = require('assert');
const E = require('../src/js/motori/27-eroi.js');
const D = require('../src/js/motori/27a-avv-dadi.js');
const S = require('../src/js/motori/27d-avv-stati.js');
const A = require('../src/js/motori/27e-avv-poteri.js');
const B = require('../src/js/motori/27f-avv-bestiario.js');
const gen = seme => D.gen({ rng: D.semina(seme) });
const copia = x => JSON.parse(JSON.stringify(x));

// ---- elenco: famiglie, capi, ruoli ----
{
  const fam = Object.keys(B.FAMIGLIE); assert.deepStrictEqual(fam, ['bestie', 'banditi', 'nonmorti', 'torre']);
  assert.strictEqual(B.ID.length, 23, '4 × 5 + 3');
  for (const f of fam) assert.strictEqual(B.per(f).length, 5, f + ': cinque mostri');
  const capi = B.ID.filter(i => B.M[i].capo); assert.strictEqual(capi.length, 3, 'tre capi');
  assert.deepStrictEqual(capi.map(i => B.M[i].fam).sort(), ['banditi', 'nonmorti', 'torre']);
  for (const f of ['banditi', 'nonmorti', 'torre']) assert.strictEqual(B.per(f, true).length, 1);
  assert.strictEqual(B.per('bestie', true).length, 0);
  assert.strictEqual(new Set(B.ID).size, B.ID.length); assert.strictEqual(new Set(B.ID.map(i => B.M[i].nome)).size, B.ID.length, 'nomi diversi');
  const ruoli = Object.keys(B.RUOLI); assert.deepStrictEqual(ruoli, ['bruto', 'tiratore', 'incantatore', 'supporto', 'sciame']);
  for (const r of ruoli) assert.ok(B.ID.filter(i => B.M[i].ruolo === r).length >= 2, 'almeno due mostri con ruolo ' + r);
  for (const f of fam) { const lv = B.per(f).map(i => B.M[i].liv); assert.ok(new Set(lv).size >= 4, f + ': livelli diversi ' + lv); assert.ok(new Set(B.per(f).map(i => B.M[i].ruolo)).size >= 3, f + ': ruoli vari') }
  assert.ok(Math.min(...B.ID.map(i => B.M[i].liv)) === 1 && Math.max(...B.ID.map(i => B.M[i].liv)) <= 10);
  assert.ok(B.ID.some(i => !B.M[i].capo && B.M[i].liv === 1), 'si comincia da livello 1');
}

// ---- ogni scheda è completa e usa solo cose che esistono ----
{
  const IA_DIST = ['contatto', 'media', 'lontana'], IA_MIRA = ['vicino', 'debole', 'curatore', 'alleato-ferito', 'incantatore', 'casuale'];
  for (const id of B.ID) {
    const m = B.M[id];
    assert.ok(m.nome && m.desc && m.desc.length > 20, id + ': nome e descrizione'); assert.ok(B.FAMIGLIE[m.fam] && B.RUOLI[m.ruolo]);
    assert.ok(Number.isInteger(m.liv) && m.liv >= 1 && m.liv <= 10); assert.ok(Number.isInteger(m.pf) && m.pf >= 5 && Number.isInteger(m.ca) && m.ca >= 8 && m.ca <= 22);
    assert.ok(m.dan.n >= 1 && [4, 6, 8].includes(m.dan.dado) && m.dan.bonus >= 0 && S.TIPI.includes(m.dan.tipo), id + ' danno');
    assert.ok(m.xp > 0 && m.cd >= 10); assert.deepStrictEqual(Object.keys(m.salv).sort(), E.STAT.slice().sort());
    for (const p of m.poteri) { assert.ok(A.P[p], id + ': potere ' + p); assert.strictEqual(A.P[p].cl, 'mostri', p + ' è un potere di mostri') }
    for (const t of m.res.concat(m.vuln, m.imm)) assert.ok(S.TIPI.includes(t), id + ' tipo ' + t);
    for (const t of m.immStati) assert.ok(S.STATI[t], id + ' stato ' + t);
    assert.ok(IA_DIST.includes(m.ia.dist) && IA_MIRA.includes(m.ia.mira), id + ' comportamento'); assert.ok(m.ia.fuga >= 0 && m.ia.fuga < 1); assert.strictEqual(typeof m.ia.arrende, 'boolean');
    assert.ok(m.ia.apre === null || m.poteri.includes(m.ia.apre), id + ': il potere d\'apertura è suo');
    if (m.ruolo === 'tiratore') assert.ok(m.gitt >= 4, id + ': un tiratore sta lontano'); if (m.ruolo === 'bruto') assert.strictEqual(m.gitt, 1);
    if (m.ia.arrende) assert.strictEqual(m.fam, 'banditi', 'si arrendono solo i banditi'); if (m.fam === 'banditi' && !m.capo) assert.ok(m.ia.arrende);
    if (m.fam === 'nonmorti') assert.ok(m.imm.includes('veleno'), id + ': i non morti non temono il veleno');
    assert.ok(!/\bUNO\b|Catan|Azul|Baldur|For the King|Dungeons|Goblin|Orco delle|Beholder|Mind Flayer/.test(m.nome + m.desc), id + ': nessun marchio');
    // scheda in battaglia: stessa forma dei combattenti degli eroi, JSON puro
    const c = B.combattente(id, { id: id + '#2' });
    assert.strictEqual(c.id, id + '#2'); assert.strictEqual(c.def, id); assert.strictEqual(c.lato, 'nemici'); assert.strictEqual(c.hp, m.pf); assert.strictEqual(c.hpMax, m.pf);
    assert.deepStrictEqual(c.poteri, ['attacco'].concat(m.poteri)); assert.deepStrictEqual(copia(c), c);
    for (const k of ['ca', 'att', 'magia', 'dan', 'salv', 'cd', 'iniz', 'mov', 'gitt', 'crit', 'res', 'vuln', 'imm', 'immStati', 'stati', 'usi', 'hook', 'temp', 'conc', 'concMax', 'liv']) assert.notStrictEqual(c[k], undefined, id + ' campo ' + k);
    c.stati.push({ id: 'accecato', t: 1, fino: 'fine' }); c.usi.x = 1; assert.strictEqual(B.combattente(id).stati.length, 0, 'ogni combattente ha le sue liste'); assert.strictEqual(B.M[id].poteri.length, m.poteri.length);
  }
  assert.throws(() => B.combattente('non-esiste'));
}

// ---- i numeri seguono la formula e crescono con il livello ----
{
  for (const ruolo of Object.keys(B.RUOLI)) {
    let prec = null;
    for (let liv = 1; liv <= 10; liv++) { const s = B.stat(liv, ruolo); if (prec) { assert.ok(s.pf >= prec.pf && s.ca >= prec.ca && s.att >= prec.att && s.cd >= prec.cd, `${ruolo} L${liv}: i numeri non scendono`); assert.ok(s.dan.n * (s.dan.dado + 1) / 2 + s.dan.bonus >= prec.medio, `${ruolo} L${liv}: il danno non scende`) } prec = Object.assign({}, s, { medio: s.dan.n * (s.dan.dado + 1) / 2 + s.dan.bonus }) }
  }
  // PF di un mostro di livello pari a quello degli eroi: tra metà e due volte e mezzo i PF di un eroe (9 + 6 per livello oltre il primo)
  for (const id of B.ID.filter(i => !B.M[i].capo)) { const m = B.M[id], eroePf = 9 + 6 * (m.liv - 1); assert.ok(m.pf >= .5 * eroePf && m.pf <= 2.6 * eroePf, `${id}: ${m.pf} PF contro un eroe da ${eroePf}`); assert.ok(m.att >= 2 && m.att <= 8) }
  // i capi: molto più duri, più pericolosi, immuni allo stordimento (non si blocca un capo)
  for (const id of B.ID.filter(i => B.M[i].capo)) { const m = B.M[id], norm = B.stat(m.liv, m.ruolo); assert.ok(m.pf >= 2.8 * norm.pf, id + ' PF da capo'); assert.ok(m.ca >= norm.ca + 2); assert.ok(m.immStati.includes('stordito')); assert.ok(m.xp >= 5 * (15 + 10 * m.liv)); assert.ok(m.poteri.length >= 3, id + ': tre poteri almeno') }
  assert.strictEqual(B.xpTotale(['lupo-grigio', 'lupo-grigio']), 2 * B.M['lupo-grigio'].xp);
}

// ---- carattere delle famiglie (resistenze e vulnerabilità che contano in battaglia) ----
{
  const dummy = id => B.combattente(id), colpisci = (id, n, tipo) => S.effettivo(dummy(id), n, tipo).n;
  assert.strictEqual(colpisci('scheletro-armato', 10, 'contundente'), 20, 'gli scheletri temono i colpi pesanti'); assert.strictEqual(colpisci('scheletro-armato', 10, 'veleno'), 0);
  assert.strictEqual(colpisci('anima-in-pena', 10, 'taglio'), 5, 'i fantasmi attraversano le lame'); assert.strictEqual(colpisci('anima-in-pena', 10, 'radioso'), 20);
  assert.strictEqual(colpisci('sciame-di-corvi', 10, 'perforante'), 5); assert.strictEqual(colpisci('sciame-di-corvi', 10, 'fuoco'), 10, 'ma il fuoco passa');
  assert.strictEqual(colpisci('custode-fiammeggiante', 10, 'fuoco'), 0); assert.strictEqual(colpisci('custode-fiammeggiante', 10, 'gelo'), 20);
  assert.strictEqual(colpisci('statua-vivente', 10, 'taglio'), 5); assert.strictEqual(colpisci('statua-vivente', 10, 'contundente'), 10);
  const re = dummy('re-senza-corona'); assert.strictEqual(S.aggiungi(re, 'stordito', 1), false); assert.strictEqual(S.aggiungi(re, 'maledetto', 1), true);
  assert.strictEqual(S.aggiungi(dummy('ragno-tessitore'), 'impigliato', 2), false, 'il ragno non resta nella sua tela');
}

// ---- ogni potere di ogni mostro si può usare contro degli eroi ----
{
  const eroi = (n) => Array.from({ length: n }, (_, i) => { const h = E.nuovo({ nome: 'E' + i, razza: 'umano', classe: ['guerriero', 'mago', 'chierico', 'ladro'][i % 4], base: { for: 14, des: 12, cos: 13, int: 10, sag: 10, car: 8 }, aspetto: { pelle: 0, capelli: 0, mantello: 0, viso: 0 } }, 500 + i); return A.combattente(A.completa(h), { id: 'e' + i }) });
  const scelta = (p, c, gruppo, mostri) => ({ nemico: () => [gruppo[0]], nemici: () => gruppo, alleato: () => [mostri[1]], alleati: () => mostri, amico: () => [mostri[1]], amici: () => mostri, terra: () => [mostri[1]], se: () => [] })[p.bers]();
  let provati = 0;
  for (const id of B.ID) for (const pid of B.M[id].poteri) {
    const p = A.P[pid]; let ok = false;
    for (let seme = 1; seme <= 40 && !ok; seme++) {
      const gruppo = eroi(3), mostri = [B.combattente(id, { id: 'm0' }), B.combattente('lupo-grigio', { id: 'm1' })]; mostri[1].hp = 3; if (p.bers === 'terra') { mostri[1].hp = 0; S.aggiungi(mostri[1], 'terra') }
      const r = A.applica(mostri[0], pid, scelta(p, mostri[0], gruppo, mostri), gen(seme), { danno: 20 });
      assert.ok(!r.err, `${id} ${pid}: ${r.err}`); if (r.tenace || r.ev.some(e => !['tiro', 'salvezza', 'resiste'].includes(e.t))) ok = true;   // un danno, uno stato, una cura, una spinta…
    }
    assert.ok(ok, `${id} ${pid}: nessun effetto in 40 prove`); provati++;
  }
  assert.ok(provati >= 30, 'poteri di mostri provati: ' + provati);
}

// ---- duelli di controllo: un eroe di pari livello contro un mostro normale non è né una passeggiata sicura né una condanna ----
{
  const T = [7, 8, 9, 10, 12, 13, 15, 16, 18, 19];
  const eroe = liv => { const h = E.nuovo({ nome: 'G', razza: 'umano', classe: 'guerriero', base: { for: 15, des: 12, cos: 14, int: 8, sag: 10, car: 8 }, aspetto: { pelle: 0, capelli: 0, mantello: 0, viso: 0 } }, 77); h.liv = liv; h.xp = E.SOGLIE_XP[liv - 1]; h.hpMax = E.derivati(h).hpMax; h.hp = h.hpMax; return A.completa(h) };
  const duello = (liv, def, seme) => {
    const g = gen(seme), c = A.combattente(eroe(liv), { id: 'h' }), m = B.combattente(def, { id: 'm' }); const avg = c.dan.n * (c.dan.dado + 1) / 2 + c.dan.bonus; c.dan.bonus += Math.round(T[liv - 1] - avg); A.iniziaScontro(c); A.iniziaScontro(m);
    const migliore = (x, y, tutti) => x.poteri.map(i => A.P[i]).filter(p => p.costo === 'azione' && p.eff.some(e => e.k === 'danno') && (p.bers === 'nemico' || p.bers === 'nemici') && A.usiRimasti(x, p) > 0 && !A.puoUsare(x, p)).sort((a, b) => A.stima(x, b.id, y).atteso - A.stima(x, a.id, y).atteso)[0];
    for (let giro = 0; giro < 40; giro++) {
      A.inizioTurno(c, g); const pc = migliore(c, m); if (pc && S.puoAgire(c)) A.applica(c, pc.id, [m], g); S.fineTurno(c); if (m.hp <= 0) return 1;
      A.inizioTurno(m, g); const pm = migliore(m, c); if (pm && S.puoAgire(m)) A.applica(m, pm.id, [c], g); S.fineTurno(m); if (c.hp <= 0) return 0;
    }
    return .5;
  };
  const prova = (liv, def, n) => { let v = 0; for (let i = 1; i <= n; i++) v += duello(liv, def, i * 31); return v / n };
  for (const id of B.ID.filter(i => !B.M[i].capo)) { const m = B.M[id], v = prova(m.liv, id, 120); assert.ok(v >= .25, `${id}: l'eroe pari livello vince solo il ${Math.round(v * 100)}%`); if (m.ruolo === 'bruto') assert.ok(v <= .97, `${id} (bruto): troppo facile ${Math.round(v * 100)}%`) }
  for (const id of B.ID.filter(i => B.M[i].capo)) { const m = B.M[id], v = prova(m.liv, id, 60); assert.ok(v <= .2, `${id}: un capo non si batte da soli (${Math.round(v * 100)}%)`) }
  // chi ha un livello in più vince più spesso, chi ne ha uno in meno meno spesso
  assert.ok(prova(4, 'tagliagole', 150) >= prova(3, 'tagliagole', 150) - .05, 'più livello, più vittorie');
}
console.log('test_avv_bestiario: ok');
