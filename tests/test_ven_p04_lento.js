// Passo 04, prove lente (il resto sta in test_ven_p04.js; `tutti.js` salta questo file in `test:rapido`): moltiplicatori `molt`, salvataggi vecchi, controllo della ripetibilità.
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const carica = require('./carica.js');
const R = path.join(__dirname, '..');
const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
const nuovoCtx = () => carica.multi(F, '({ VEN, VDAT, VCAM, VVOC })');
const ok = r => { assert(!r.err, r.err); return r; };
const J = x => JSON.stringify(x), eq = (a, b, m) => assert.strictEqual(J(a), J(b), m);
const quieto = s => { s.tregua = 1e9; s.dentro = -1; s.davanti = -1; return s; };

// (d) `VEN.molt`: sostituito per `viveri` con 2 raddoppia il consumo di un giorno; con `marcia` uguale a 0 la compagnia non si muove
{
  const consumo = molt => {
    const { VEN: V } = nuovoCtx(), s = quieto(V.nuovo(3)), tu = V.TU(s);
    tu.tr = [{ t: tu.tr[0].t, n: 60, f: 0, xp: 0 }]; tu.merci = { grano: 500 }; tu.oro = 1e6;
    if (molt) { const prima = V.molt; V.molt = (st, k, c) => prima(st, k, c) * molt(k, c); }
    V.giornoNuovo(s); return 500 - tu.merci.grano;
  };
  const base = consumo(null);
  assert.strictEqual(base, 10, '60 uomini mangiano dieci razioni al giorno');
  assert.strictEqual(consumo((k, c) => k === 'viveri' ? 2 : 1), 20, 'con 2 il consumo è doppio');
  const cammino = molt => {
    const { VEN: V } = nuovoCtx(), s = V.nuovo(3), tu = V.TU(s); s.p.length = 1; s.tregua = 1e9;
    if (molt) { const prima = V.molt; V.molt = (st, k, c) => prima(st, k, c) * molt(k, c); }
    const x0 = tu.x, y0 = tu.y; ok(V.ordina(s, { t: 'vai', x: x0 + 6, y: y0 })); V.passo(s, 40);
    return Math.sqrt((tu.x - x0) * (tu.x - x0) + (tu.y - y0) * (tu.y - y0));
  };
  assert(cammino(null) > 1, 'di solito la compagnia cammina');
  assert.strictEqual(cammino((k, c) => k === 'marcia' ? 0 : 1), 0, 'con la marcia a 0 non si muove');
  // la marcia riceve il gruppo e la cella
  { const { VEN: V } = nuovoCtx(), s = V.nuovo(3), visti = []; const prima = V.molt; V.molt = (st, k, c) => { if (k === 'marcia') visti.push(c); return prima(st, k, c); };
    V.velocita(s, V.TU(s)); assert(visti.length === 1 && visti[0].p === V.TU(s) && Number.isInteger(visti[0].i), 'ctx {p,i}'); }
  // prezzo, paga, rendita, vista: valgono 1 finché nessuno li cambia, e si moltiplicano quando qualcuno li cambia
  { const { VEN: V } = nuovoCtx(), s = V.nuovo(3), l = s.l.find(x => x.tipo === 'citta');
    const p1 = V.prezzo(s, l, 'grano', 1), pg1 = V.paga(s), v1 = V.vista(s);
    const prima = V.molt; V.molt = (st, k, c) => prima(st, k, c) * (k === 'prezzo' || k === 'paga' || k === 'vista' ? 2 : 1);
    assert(V.prezzo(s, l, 'grano', 1) >= p1 * 2 - 1 && V.prezzo(s, l, 'grano', 1) <= p1 * 2 + 1); assert.strictEqual(V.paga(s), pg1 * 2); assert.strictEqual(V.vista(s), v1 * 2); }
}

// (g) i salvataggi di tests/fixture/ven/ si aprono e VEN.opz(s) dà i valori di base
{
  const { VEN: V, VDAT: D } = nuovoCtx(), cart = path.join(__dirname, 'fixture/ven'), file = fs.readdirSync(cart).filter(f => /\.json$/.test(f));
  assert(file.length >= 6);
  for (const f of file) { const s = V.apri(fs.readFileSync(path.join(cart, f), 'utf8')); assert(s, f + ' si apre'); eq(V.opz(s), D.OPZ0, f + ': opzioni di base'); assert.strictEqual(s.geo, undefined); assert.strictEqual(s.opz, undefined);
    eq(V.regni(s), D.REGNI); V.passo(s, 30); }
  // un mondo nuovo senza opzioni non porta né `opz` né `geo` (il salvataggio resta quello di prima)
  const n = V.nuovo(3); assert(!('opz' in n) && !('geo' in n));
  // con le opzioni le porta; con `geo:2` o con l'interruttore `mondo2` mette `s.geo=2` prima di generare la mappa
  const o = V.nuovo(3, { opz: { taglia: 'grande' } }); eq(V.opz(o), Object.assign({}, D.OPZ0, { taglia: 'grande' })); assert.strictEqual(o.geo, undefined);
  let visto = null; const prima = V.mappaDi; V.mappaDi = st => { visto = st.geo; return prima(st); };
  V.nuovo(3, { opz: { geo: 2 } }); assert.strictEqual(visto, 2, 's.geo c\'è già quando si genera la mappa');
  visto = null; D.ACCESO.mondo2 = true; assert.strictEqual(V.nuovo(3).geo, 2); assert.strictEqual(visto, 2);
}

// (i) scripts/struttura.js fallisce su un file con una funzione non ripetibile (scritto in una cartella temporanea e poi cancellato)
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p04-')), struttura = path.join(R, 'scripts/struttura.js');
  const lancia = () => { try { execFileSync(process.execPath, [struttura, '--ripetibili', dir], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
  try {
    fs.writeFileSync(path.join(dir, '28kz-ven-prova.js'), '/* Math.pow in un commento non conta */\nconst a = Math.sqrt(4) + Math.floor(2.5) + Math.min(1, 2) + Math.abs(-1) + Math.round(1.5) + Math.max(1, 2);\n');
    assert.strictEqual(lancia(), 0, 'sqrt, floor, round, min, max e abs vanno bene');
    for (const codice of ['const x = Math.pow(2, 3);', 'const x = Math.exp(1);', 'const x = Math.log(2);', 'const x = Math.sin(1);', 'const x = Math.cos(1);', 'const x = Math.hypot(3, 4);', 'const x = Math.cbrt(8);', 'const x = 2 ** 3;', 'const x = Math.atan2(1, 1);']) {
      fs.writeFileSync(path.join(dir, '28kz-ven-prova.js'), codice + '\n');
      assert.strictEqual(lancia(), 1, codice + ' fa fallire il controllo');
    }
    fs.writeFileSync(path.join(dir, '28kz-ven-prova.js'), 'const x = Math.pow(2, 3);\n'); fs.renameSync(path.join(dir, '28kz-ven-prova.js'), path.join(dir, 'altro.js'));
    assert.strictEqual(lancia(), 0, 'i file fuori dalla famiglia 28[j-n]*-ven-* non si controllano');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  assert(!fs.existsSync(dir), 'la cartella temporanea è stata cancellata');
  // il codice di oggi è pulito
  execFileSync(process.execPath, [struttura, '--ripetibili', path.join(R, 'src/js/motori')], { stdio: 'pipe' });
}


console.log('test_ven_p04_lento: ok');
