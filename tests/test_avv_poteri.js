// Poteri, talenti e razze dell'avventura: ogni potere ha bersagli validi e un effetto misurabile, nessuna combinazione rompe lo stato,
// le scelte a ogni livello sono guidate e ripetibili, i danni restano nella tabella di docs/rules/avventura.md.
const assert = require('assert');
const fs = require('fs'), path = require('path');
const E = require('../src/js/motori/27-eroi.js');
const D = require('../src/js/motori/27a-avv-dadi.js');
const S = require('../src/js/motori/27d-avv-stati.js');
const A = require('../src/js/motori/27e-avv-poteri.js');
const B = require('../src/js/motori/27f-avv-bestiario.js');   // registra anche i poteri dei mostri
const copia = x => JSON.parse(JSON.stringify(x));
const gen = seme => D.gen({ rng: D.semina(seme) });
const BASI = {
  guerriero: { for: 15, des: 12, cos: 14, int: 8, sag: 10, car: 8 }, ladro: { for: 8, des: 15, cos: 13, int: 12, sag: 10, car: 10 }, mago: { for: 8, des: 14, cos: 12, int: 15, sag: 10, car: 8 },
  chierico: { for: 12, des: 10, cos: 13, int: 8, sag: 15, car: 10 }, esploratore: { for: 10, des: 15, cos: 13, int: 8, sag: 14, car: 8 }, bardo: { for: 8, des: 14, cos: 12, int: 10, sag: 8, car: 15 } };
const ASP = { pelle: 0, capelli: 0, mantello: 0, viso: 0 };
let contaCreati = 1000 + (Number(process.env.SEME_PROVA) || 0) * 37;   // SEME_PROVA cambia le proposte di talenti: serve a controllare che i test non dipendano da una scheda fortunata
// eroe del livello indicato con le scelte già fatte (le prime opzioni proposte)
function eroe(cl, liv, razza, creato) {
  const h = E.nuovo({ nome: 'Eroe', razza: razza || 'umano', classe: cl, base: BASI[cl], aspetto: ASP }, creato || ++contaCreati);
  h.liv = liv; h.xp = E.SOGLIE_XP[liv - 1]; h.hpMax = E.derivati(h).hpMax; h.hp = h.hpMax; const c = A.completa(h); c.scelte = c.scelte || {}; return c;
}
const CLASSI = Object.keys(E.CLASSI);

// ---- 1. i dati: forma di ogni potere ----
{
  const COSTI = ['azione', 'bonus', 'reazione'], RIC = ['turno', 'scontro', 'breve', 'lungo'], AREE = ['singolo', 'se', 'aura', 'cerchio', 'cono', 'linea'];
  const SING = ['nemico', 'alleato', 'amico', 'terra', 'se'], PLUR = ['nemici', 'alleati', 'amici'], KIND = ['danno', 'cura', 'temp', 'stato', 'rimuovi', 'conc', 'riduci', 'ritira', 'tenace', 'spingi', 'disimpegna'];
  const ids = Object.keys(A.P); assert.ok(ids.length >= 6 * 10 + 5 + 1 + 20, 'poteri registrati: ' + ids.length);
  for (const id of ids) {
    const p = A.P[id];
    assert.strictEqual(p.id, id); assert.ok(p.nome && p.desc, id + ': nome e descrizione');
    assert.ok(COSTI.includes(p.costo), id + ' costo'); assert.ok(RIC.includes(p.ric), id + ' ricarica'); assert.ok(AREE.includes(p.area), id + ' area');
    assert.ok(p.ric === 'turno' ? p.usi === null : Number.isInteger(p.usi) && p.usi >= 1 && p.usi <= 3, id + ' cariche');
    assert.ok(p.att === null || p.att === 'arma' || p.att === 'magia'); assert.ok(!(p.att && p.salv), id + ': o tiro per colpire o salvezza');
    assert.ok(!p.salv || E.STAT.includes(p.salv)); assert.ok(!p.meta || p.salv, id + ': «metà danno» solo con la salvezza');
    assert.ok(Number.isInteger(p.multi) && p.multi >= 1 && p.multi <= 4); assert.ok(!p.multi || p.multi === 1 || p.att, id + ': più attacchi solo con il tiro per colpire');
    assert.ok(p.gitt === 'arma' || (Number.isInteger(p.gitt) && p.gitt >= 0), id + ' gittata');
    if (p.area === 'se') { assert.strictEqual(p.bers, 'se', id); assert.strictEqual(p.gitt, 0) }
    else if (p.area === 'singolo') { assert.ok(SING.includes(p.bers) && p.bers !== 'se', id + ' bersaglio singolo'); assert.ok(p.gitt === 'arma' || p.gitt >= 1, id + ': un singolo bersaglio sta a distanza') }
    else { assert.ok(PLUR.includes(p.bers), id + ': area e bersagli plurali'); assert.ok(p.raggio >= 1, id + ' raggio') }
    if (p.area === 'linea' || p.area === 'cono') assert.strictEqual(p.gitt, 0, id + ': linee e coni partono da chi li usa');
    assert.ok(p.eff.length >= 1, id + ': almeno un effetto');
    for (const e of p.eff) {
      assert.ok(KIND.includes(e.k), id + ' effetto ' + e.k);
      if (e.k === 'danno') { assert.ok(e.arma || (e.expr && ST_TIPO(e.tipo)), id + ' danno'); if (e.expr) D.leggi(e.expr); assert.ok(!e.arma || p.att, id + ': il danno dell\'arma serve un tiro per colpire'); }
      if (e.k === 'cura') { D.leggi(e.expr); assert.ok(['alleato', 'alleati', 'amico', 'amici', 'terra', 'se'].includes(p.bers), id + ': si cura chi è dalla propria parte') }
      if (e.k === 'stato') { const st = S.STATI[e.id]; assert.ok(st, id + ' stato ' + e.id); if (!st.perm) assert.ok(Number.isInteger(e.t) && e.t >= 1 && e.t <= 4, id + ' durata'); if (e.salv) assert.ok(E.STAT.includes(e.salv)) }
      if (e.k === 'rimuovi') assert.ok(e.stati.every(s => S.STATI[s] && s !== 'terra'));
      if (e.k === 'riduci' || e.k === 'tenace') assert.ok(p.costo === 'reazione' && p.area === 'se', id + ': solo reazione su di sé');
      if (e.k === 'danno' && !e.su) assert.ok(p.bers === 'nemico' || p.bers === 'nemici', id + ': si danneggia chi è dall\'altra parte');
    }
    assert.ok(A.riga(p).length > 10, id + ' riga di sintesi');
  }
  function ST_TIPO(t) { return S.TIPI.includes(t) }
  // classi: 2 poteri al primo livello, 2 opzioni a 3, 5, 7, 9; passivo; razze; talenti
  for (const cl of CLASSI) {
    assert.strictEqual(A.opzioni(cl, 1).length, 2, cl + ' livello 1');
    for (const L of A.LIV_POTERE) { const o = A.opzioni(cl, L); assert.strictEqual(o.length, 2, cl + ' livello ' + L); assert.ok(o.every(i => A.P[i].cl === cl && A.P[i].liv === L)) }
    const pa = A.PASS[cl]; assert.ok(pa && pa.nome && pa.desc && Object.keys(pa.hook).length, cl + ' passivo');
    assert.strictEqual(Object.values(A.P).filter(p => p.cl === cl).length, 10, cl + ': 10 poteri');
  }
  for (const r of Object.keys(E.RAZZE)) { const p = A.P[A.RAZZA_POT[r]]; assert.ok(p, r); assert.strictEqual(p.nome, E.RAZZE[r].tratto, 'il potere di razza si chiama come il tratto'); assert.strictEqual(p.ric, 'scontro') }
  assert.strictEqual(A.TAL_ID.length, 20); for (const t of Object.values(A.TAL)) assert.ok(t.nome && t.desc && Object.keys(t.hook).length, t.id);
  const nomi = Object.values(A.P).map(p => p.nome); assert.strictEqual(new Set(nomi).size, nomi.length, 'nomi dei poteri tutti diversi');
  assert.ok(!/\bUNO\b|Catan|Azul|Baldur|For the King|Dungeons|Pathfinder/.test(JSON.stringify(A.P) + JSON.stringify(A.TAL) + JSON.stringify(A.PASS)), 'nessun marchio');
}

// ---- 2. ogni potere ha bersagli validi e un effetto misurabile ----
{
  const scenario = id => {
    const p = A.P[id], cl = CLASSI.includes(p.cl) ? p.cl : 'guerriero';
    const c = A.combattente(eroe(cl, 10)); if (!c.poteri.includes(id)) c.poteri.push(id); c.conc = 0;
    const n = [1, 2, 3].map(i => { const m = B.combattente('orso-bruno', { id: 'n' + i }); m.hp = m.hpMax = 500; m.ca = 5; for (const k of E.STAT) m.salv[k] = -3; return m });
    const al = A.combattente(eroe('mago', 10), { id: 'al' }); al.hpMax = 100; al.hp = 3; S.aggiungi(al, 'avvelenato', 3); S.aggiungi(al, 'accecato', 3); S.aggiungi(al, 'maledetto', 3);
    const giu = A.combattente(eroe('bardo', 10), { id: 'giu' }); giu.hp = 0; S.aggiungi(giu, 'terra'); c.hp = Math.max(1, Math.floor(c.hpMax / 2));   // chi usa il potere è ferito: così le cure su di sé si vedono
    return { c, n, al, giu };
  };
  const scelta = (p, sc) => ({ se: () => [], nemico: () => [sc.n[0]], nemici: () => sc.n, alleato: () => [sc.al], alleati: () => [sc.c, sc.al], amico: () => [sc.al], amici: () => [sc.c, sc.al, sc.giu], terra: () => [sc.giu] })[p.bers]();
  const foto = sc => JSON.stringify([sc.c, ...sc.n, sc.al, sc.giu].map(x => [x.hp, x.temp, x.stati, x.conc, !!x.morto]));
  let misurati = 0;
  for (const id of Object.keys(A.P)) {
    const p = A.P[id]; if (p.eff.some(e => e.k === 'tenace')) continue;   // provato più sotto con `subisci`
    let visto = false;
    for (let seme = 1; seme <= 80 && !visto; seme++) {
      const sc = scenario(id), prima = foto(sc), r = A.applica(sc.c, id, scelta(p, sc), gen(seme), { danno: 20 });
      assert.ok(!r.err, id + ': ' + r.err); assert.strictEqual(r.ok, true);
      if (foto(sc) !== prima || r.ritira || r.ridotto > 0 || r.ev.some(e => e.t === 'spingi' || e.t === 'disimpegna')) visto = true;
    }
    assert.ok(visto, id + ': nessun effetto misurabile in 80 prove'); misurati++;
  }
  assert.ok(misurati >= 90, 'poteri misurati: ' + misurati);
  // i tre poteri «tenaci» (Furia tenace, Ultimo baluardo, Ultima carta): scattano da soli quando servirebbe cadere
  for (const id of Object.keys(A.P).filter(i => A.P[i].eff.some(e => e.k === 'tenace'))) {
    const sc = scenario(id), c = sc.c, max = A.usiMax(c, A.P[id]);   // (un talento può dare una carica in più)
    for (let i = 1; i <= max; i++) { c.hp = 5; c.temp = 0; const r = A.subisci(c, 999, 'taglio'); assert.strictEqual(r.tenace, true, id); assert.strictEqual(r.potere, id); assert.strictEqual(c.hp, 1); assert.ok(!S.ha(c, 'terra')); assert.strictEqual(c.usi[id], i, 'carica spesa') }
    c.hp = 5; c.temp = 0; const r2 = A.subisci(c, 999, 'taglio'); assert.ok(!r2.tenace, 'finite le cariche si cade'); assert.strictEqual(c.hp, 0); assert.ok(S.ha(c, 'terra'));
    const sc2 = scenario(id), via = A.applica(sc2.c, id, [], gen(1)); assert.ok(via.ok && via.tenace, 'usato a mano: ' + id);
  }
  // gli altri poteri non scattano da soli e un colpo che non uccide non li consuma
  { const sc = scenario('r-orco'); sc.c.hp = 30; A.subisci(sc.c, 10, 'taglio'); assert.strictEqual(sc.c.hp, 20); assert.deepStrictEqual(sc.c.usi, {}) }
  { const sc = scenario('attacco'); sc.c.hp = 5; sc.c.poteri = sc.c.poteri.filter(i => !A.P[i].eff.some(e => e.k === 'tenace')); const r = A.subisci(sc.c, 99, 'taglio'); assert.ok(r.a0 && !r.tenace) }
}

// ---- 3. bersagli sbagliati, cariche, riposi ----
{
  const c = A.combattente(eroe('chierico', 9)), nem = B.combattente('lupo-grigio'), amico = A.combattente(eroe('mago', 9), { id: 'm' }), giu = A.combattente(eroe('bardo', 9), { id: 'b' });
  giu.hp = 0; S.aggiungi(giu, 'terra'); const g = gen(3);
  const err = (id, bs, att) => { const r = A.applica(att || c, id, bs, g); assert.ok(r.err, id + ' doveva dare errore'); return r.err };
  assert.ok(/alleato/.test(err('tocco-guaritore', [nem])), 'curare un nemico');
  assert.ok(/nemico/.test(err('attacco', [amico])), 'attaccare un alleato');
  assert.ok(/terra/.test(err('rialzati', [amico])), 'rialzare chi è in piedi');
  assert.ok(/nemico/.test(err('attacco', [Object.assign(B.combattente('lupo-grigio'), { hp: 0, morto: true })])), 'attaccare un morto');
  err('attacco', []); err('attacco', [nem, nem]); err('colonna-di-luce', []);
  assert.ok(/Potere sconosciuto/.test(A.applica(c, 'non-esiste', [nem], g).err));
  assert.ok(/Non conosci/.test(err('sfera-di-fiamme', [nem])), 'un potere di un\'altra classe');
  const st = A.combattente(eroe('guerriero', 5)); S.aggiungi(st, 'stordito', 1); assert.ok(/non può agire/.test(err('attacco', [nem], st)));
  const cadu = A.combattente(eroe('guerriero', 5)); cadu.hp = 0; S.aggiungi(cadu, 'terra'); assert.ok(/non può agire/.test(err('attacco', [nem], cadu)));
  // rialzare chi è a terra funziona e dà il vantaggio del talento
  const r = A.applica(c, 'tocco-guaritore', [giu], gen(1)); assert.ok(r.ok); assert.ok(giu.hp > 0 && !S.ha(giu, 'terra')); assert.ok(r.ev.some(e => e.t === 'cura' && e.rialzato));
  // cariche: tocco-guaritore ne ha 3 per riposo breve
  const m = A.combattente(eroe('chierico', 5), { id: 'cc' }), ferito = A.combattente(eroe('mago', 5), { id: 'f' }); ferito.hp = 1;
  for (let i = 0; i < 3; i++) assert.ok(A.applica(m, 'tocco-guaritore', [ferito], g).ok);
  assert.strictEqual(A.usiRimasti(m, A.P['tocco-guaritore']), 0); assert.ok(/Cariche/.test(A.applica(m, 'tocco-guaritore', [ferito], g).err));
  A.iniziaScontro(m); assert.strictEqual(A.usiRimasti(m, A.P['tocco-guaritore']), 0, 'un nuovo scontro non ricarica il «per riposo»');
  A.riposo(m, 'breve'); assert.strictEqual(A.usiRimasti(m, A.P['tocco-guaritore']), 3);
  // «a scontro» torna con ogni scontro, «lungo» solo col riposo lungo
  const gu = A.combattente(eroe('guerriero', 9), { id: 'gu' }), bers = B.combattente('lupo-grigio'); bers.hp = bers.hpMax = 999;

  gu.poteri.push('raffica-d-acciaio', 'furia-del-campione'); gu.usi = { 'raffica-d-acciaio': 1, 'furia-del-campione': 1, 'riprendi-fiato': 1 };
  A.riposo(gu, 'breve'); assert.deepStrictEqual(gu.usi, { 'furia-del-campione': 1 }, 'il riposo breve ricarica scontro e breve, non lungo');
  A.riposo(gu, 'lungo'); assert.deepStrictEqual(gu.usi, {}); assert.strictEqual(gu.conc, gu.concMax);
  gu.usi = { 'raffica-d-acciaio': 1 }; A.iniziaScontro(gu); assert.deepStrictEqual(gu.usi, {});
  // più attacchi: se il bersaglio cade, gli attacchi che restano non lo colpiscono più
  const ladro = A.combattente(eroe('ladro', 9), { id: 'l' }); ladro.poteri.push('mille-tagli'); const debole = B.combattente('lupo-grigio'); debole.hp = 1; debole.ca = 1;
  const rm = A.applica(ladro, 'mille-tagli', [debole], () => .99); assert.ok(rm.ok); assert.strictEqual(rm.ev.filter(e => e.t === 'tiro').length, 1, 'un solo tiro: il lupo era già a terra');
}

// ---- 4. effetti nel dettaglio ----
{
  // eroe senza talenti (quelli dipendono dalla scheda e cambiano i numeri: li provo a parte)
  const attore = (cl, liv) => { const h = eroe(cl, liv); for (const L of A.LIV_TALENTO) delete h.scelte[L]; return A.combattente(h, { id: 'a' }) };
  const dummy = (o) => Object.assign(B.combattente('orso-bruno', { id: 'd' }), { hp: 400, hpMax: 400, ca: 10 }, o || {});
  // attacco con dado fisso 20 (critico) e 11 (colpo normale)
  const gu = attore('guerriero', 1), d1 = dummy();
  const rc = A.applica(gu, 'attacco', [d1], () => .99); const tiro = rc.ev.find(e => e.t === 'tiro'); assert.ok(tiro.ok && tiro.crit);
  const dn = rc.ev.find(e => e.t === 'danno'); assert.ok(dn.n >= 2 * 1 + gu.dan.bonus && dn.n <= 2 * gu.dan.dado + gu.dan.bonus, 'critico: dadi doppi'); assert.strictEqual(d1.hp, 400 - dn.n);
  const rn = A.applica(gu, 'attacco', [dummy({ ca: 99 })], () => .5); assert.ok(!rn.ev.find(e => e.t === 'tiro').ok); assert.ok(!rn.ev.some(e => e.t === 'danno'), 'mancato: nessun danno');
  const r1 = A.applica(gu, 'attacco', [dummy({ ca: 1 })], () => 0); assert.ok(!r1.ev.find(e => e.t === 'tiro').ok, '1 naturale manca sempre');
  // il guerriero critica con 19
  assert.strictEqual(gu.crit, 19); const r19 = A.applica(gu, 'attacco', [dummy()], () => .9); assert.ok(r19.ev.find(e => e.t === 'tiro').crit, '19 è critico per il guerriero');
  assert.strictEqual(attore('mago', 1).crit, 20);
  // salvezza: fallita = danno pieno e stato, riuscita = metà (o niente) e nessuno stato
  const mg = attore('mago', 9), bers = dummy({ salv: { for: 0, des: -50, cos: 0, int: 0, sag: 0, car: 0 } }), forte = dummy({ salv: { for: 0, des: 50, cos: 0, int: 0, sag: 0, car: 0 } });
  mg.poteri.push('sfera-di-fiamme'); const rf = A.applica(mg, 'sfera-di-fiamme', [bers], () => .5); const pieno = rf.ev.find(e => e.t === 'danno').n; assert.ok(S.ha(bers, 'in-fiamme'));
  mg.usi = {}; const rs = A.applica(mg, 'sfera-di-fiamme', [forte], () => .5); const meta = rs.ev.find(e => e.t === 'danno').n; assert.ok(!S.ha(forte, 'in-fiamme'), 'salvezza riuscita: niente fiamme'); assert.ok(meta <= pieno, 'metà danno');
  const bd = attore('bardo', 1), sv = dummy({ salv: { for: 0, des: 0, cos: 99, int: 0, sag: 0, car: 0 } }); const nb = A.applica(bd, 'nota-potente', [sv], () => .5); assert.ok(!nb.ev.some(e => e.t === 'danno'), 'nota potente: se resiste, nessun danno');
  // stato con salvezza propria (Urto di scudo): spinge sempre, stordisce solo se fallisce
  const g5 = attore('guerriero', 9); g5.poteri.push('urto-di-scudo'); const fragile = dummy({ ca: 1, salv: { for: 0, des: 0, cos: -50, int: 0, sag: 0, car: 0 } });
  const ru = A.applica(g5, 'urto-di-scudo', [fragile], () => .5); assert.ok(S.ha(fragile, 'stordito')); assert.ok(ru.ev.some(e => e.t === 'spingi' && e.n === 2));
  g5.usi = {}; const solido = dummy({ ca: 1, salv: { for: 0, des: 0, cos: 99, int: 0, sag: 0, car: 0 } }); const ru2 = A.applica(g5, 'urto-di-scudo', [solido], () => .5);
  assert.ok(!S.ha(solido, 'stordito') && ru2.ev.some(e => e.t === 'resiste') && ru2.ev.some(e => e.t === 'spingi'));
  // resistenza e vulnerabilità sul danno di un potere
  const m2 = attore('mago', 1); const fuoco = dummy({ vuln: ['fulmine'] }); const rv = A.applica(m2, 'scintilla-arcana', [fuoco], () => .9); assert.strictEqual(rv.ev.find(e => e.t === 'danno').esito, 'vuln');
  // provocare: lo stato conosce chi provoca
  const g6 = attore('guerriero', 9); g6.poteri.push('grido-di-guerra'); const t1 = dummy({ id: 't1' }), t2 = dummy({ id: 't2' }); A.applica(g6, 'grido-di-guerra', [t1, t2], () => .5);
  assert.strictEqual(S.trova(t1, 'provocato').da, g6.id); assert.ok(g6.temp >= 5 + 9, 'PF temporanei dal grido');
  // cure con Mani benevole e Mani guaritrici
  const ch = attore('chierico', 1), ferito = attore('mago', 1); ferito.hp = 1; const base = A.applica(ch, 'tocco-guaritore', [ferito], () => .99).ev.find(e => e.t === 'cura').n;
  assert.strictEqual(base, Math.min(ferito.hpMax - 1, 8 + ch.modPrim + E.comp(1)), 'dado 8 + modificatore + competenza');
  // furtivo: solo con vantaggio o alleato vicino, una volta per turno
  const la = attore('ladro', 1); const bf = dummy({ ca: 1 });
  const senza = A.applica(la, 'attacco', [bf], () => .5); assert.ok(!senza.ev.some(e => e.t === 'furtivo'), 'senza vantaggio niente furtivo');
  const con = A.applica(la, 'attacco', [bf], () => .5, { alleatoVicino: true }); assert.ok(con.ev.some(e => e.t === 'furtivo'));
  const due = A.applica(la, 'attacco', [bf], () => .5, { alleatoVicino: true }); assert.ok(!due.ev.some(e => e.t === 'furtivo'), 'una volta per turno');
  A.inizioTurno(la, () => .5); assert.ok(A.applica(la, 'attacco', [bf], () => .5, { alleatoVicino: true }).ev.some(e => e.t === 'furtivo'), 'torna al turno dopo');
  assert.strictEqual(attore('ladro', 1).hook.furtivo, 1); assert.strictEqual(attore('ladro', 4).hook.furtivo, 2); assert.strictEqual(attore('ladro', 10).hook.furtivo, 4);
  const sp = attore('ladro', 1); S.aggiungi(sp, 'nascosto'); const rsp = A.applica(sp, 'attacco', [dummy({ ca: 1 })], () => .5); assert.ok(rsp.ev.find(e => e.t === 'tiro').vant && rsp.ev.some(e => e.t === 'furtivo'), 'da nascosto: vantaggio e furtivo'); assert.ok(!S.ha(sp, 'nascosto'), 'attaccando ci si rivela');
  // scala dei trucchetti: un dado in più ai livelli 5 e 9
  const exp = l => A.espressione(attore('mago', l), A.P['scintilla-arcana'].eff[0]); assert.ok(/^1d8/.test(exp(4)) && /^2d8/.test(exp(5)) && /^3d8/.test(exp(9)));
  // Concentrazione: ricarica e razza umana
  const um = attore('guerriero', 5); um.conc = 0; um.poteri.push('r-umano'); A.applica(um, 'r-umano', [], gen(1)); assert.strictEqual(um.conc, 1);
  for (const [cl, liv] of [['guerriero', 1], ['guerriero', 5], ['guerriero', 9], ['mago', 1], ['bardo', 7]]) { const q = attore(cl, liv); assert.strictEqual(q.concMax, E.comp(liv) + q.hook.conc, 'Concentrazione = competenza + bonus (talento o classe)') }
  assert.ok(attore('mago', 1).hook.conc >= 1, 'Mente aperta');
  // Mano lesta & co. sono segnali per la battaglia
  const fisso = eroe('esploratore', 4); delete fisso.scelte[2]; fisso.scelte[4] = 'tiro-teso'; assert.strictEqual(A.combattente(fisso).hook.gitt, 1);
}

// ---- 5. talenti: ognuno cambia davvero il combattente ----
{
  const base = eroe('chierico', 2); delete base.scelte[2]; const c0 = A.combattente(base);
  const cond = { 'occhio-vigile': c => c.iniz - c0.iniz === 3, 'piede-svelto': c => c.mov - c0.mov === 1, 'guardia-alta': c => c.ca - c0.ca === 1, 'mano-ferma': c => c.att - c0.att === 1,
    'colpo-pesante': c => c.dan.bonus - c0.dan.bonus === 1, 'pelle-dura': c => { A.iniziaScontro(c); return c.temp === 4 + c.liv }, 'mente-lucida': c => c.concMax - c0.concMax === 1,
    'fibra-forte': c => Object.keys(c.salv).every(k => c.salv[k] - c0.salv[k] === 1), 'mani-guaritrici': c => c.hook.cura - c0.hook.cura === 2, 'sangue-freddo': c => c.res.includes('veleno'),
    'pelle-di-brace': c => c.res.includes('fuoco'), 'fede-salda': c => c.res.includes('necrotico'), 'colpo-basso': c => c.hook.furtivo === 1, 'tiro-teso': c => c.hook.gitt === 1,
    'riserva-di-forze': c => A.usiMax(c, A.P['r-nano']) - A.usiMax(c0, A.P['r-nano']) === 1, 'rialzo-rapido': c => c.hook.rialzo === 4, 'spirito-indomito': c => c.hook.breve === 1,
    'passo-d-ombra': c => c.hook.nascondiBonus === true, 'mano-lesta': c => c.hook.oggBonus === true, 'sguardo-gelido': c => c.hook.inizVant === true };
  assert.deepStrictEqual(Object.keys(cond).sort(), A.TAL_ID.slice().sort(), 'un controllo per ogni talento');
  for (const id of A.TAL_ID) { const h = copia(base); h.scelte[2] = id; const c = A.combattente(h); c.poteri.push('r-nano'); c0.poteri.push('r-nano'); assert.ok(cond[id](c), 'talento ' + id); }
  // il passivo di classe: ogni classe ha il suo numero
  assert.strictEqual(A.combattente(eroe('guerriero', 1)).crit, 19); assert.strictEqual(A.combattente(eroe('esploratore', 1)).hook.ignoraDifficile, true);

  const bardo = A.combattente(eroe('bardo', 1)), ref = E.derivati(eroe('bardo', 1)).iniziativa; assert.strictEqual(bardo.iniz, ref + 3);
  for (const liv of [1, 5]) { const h = eroe('chierico', liv); for (const L of A.LIV_TALENTO) delete h.scelte[L]; assert.strictEqual(A.combattente(h).hook.cura, E.comp(liv), 'Mani benevole = competenza') }
}

// ---- 6. scelte guidate a ogni livello ----
{
  const h1 = eroe('mago', 1); assert.deepStrictEqual(A.daScegliere({ ...h1, scelte: undefined }), []); assert.deepStrictEqual(A.poteriEroe(h1).slice(0, 2), ['attacco', 'r-umano']);
  const nuovo = (cl, liv) => { const h = eroe(cl, liv); delete h.scelte; return h };
  assert.deepStrictEqual(A.daScegliere(nuovo('mago', 2)).map(x => [x.liv, x.tipo]), [[2, 'talento']]);
  assert.deepStrictEqual(A.daScegliere(nuovo('mago', 5)).map(x => [x.liv, x.tipo]), [[2, 'talento'], [3, 'potere'], [4, 'talento'], [5, 'potere']]);
  assert.strictEqual(A.daScegliere(nuovo('mago', 10)).length, 9);
  // proposte: due, diverse, ripetibili, uguali a ogni chiamata
  const h = nuovo('guerriero', 10); const o2 = A.offerta(h, 2); assert.strictEqual(o2.length, 2); assert.notStrictEqual(o2[0], o2[1]); assert.ok(o2.every(i => A.TAL[i]));
  assert.deepStrictEqual(A.offerta(h, 2), o2); assert.deepStrictEqual(A.offerta(copia(h), 2), o2); assert.deepStrictEqual(A.offerta(h, 3), A.opzioni('guerriero', 3));
  assert.deepStrictEqual(A.offerta(h, 1), []); assert.deepStrictEqual(A.offerta(h, 11), []);
  const coppie = new Set(); for (let i = 1; i <= 60; i++) coppie.add(A.offerta({ ...h, creato: i * 977 }, 2).join('+')); assert.ok(coppie.size >= 15, 'le proposte variano da eroe a eroe: ' + coppie.size);
  // si sceglie, la scelta è definitiva, gli errori sono chiari
  let x = h; const preso = []; for (const L of [2, 3, 4, 5, 6, 7, 8, 9, 10]) { const of = A.offerta(x, L); assert.strictEqual(of.length, 2); for (const t of preso) assert.ok(!of.includes(t), 'un talento già preso non si ripropone'); const r = A.scegli(x, L, of[1]); assert.ok(!r.err, r.err); x = r; if (A.TAL[of[1]]) preso.push(of[1]) }
  assert.deepStrictEqual(A.daScegliere(x), []); assert.strictEqual(A.scelteErr(x), null); assert.ok(E.coerente(x), 'una scheda completa è coerente');
  assert.ok(A.scegli(x, 3, 'parata').err, 'già scelto'); assert.ok(A.scegli(h, 3, 'palla-di-fuoco').err, 'non è tra le scelte'); assert.ok(A.scegli(nuovo('guerriero', 2), 3, 'parata').err, 'livello non raggiunto');
  assert.ok(A.scegli(h, 1, 'parata').err && A.scegli(h, 11, 'parata').err, 'livelli senza scelta'); assert.ok(A.scegli(h, 2, 'colpo-possente').err, 'un potere al posto di un talento');
  assert.ok(!A.scegli(h, 3, 'parata').err && !A.scegli(h, 3, 'fendente-rapido').err);
  assert.strictEqual(h.scelte, undefined, 'scegliere non cambia la scheda originale');
  // poteri conosciuti: quelli base, quello di razza e le scelte fino al livello raggiunto
  const g5 = nuovo('guerriero', 5), k = A.scegli(A.scegli(g5, 2, A.offerta(g5, 2)[0]), 3, 'parata'); assert.ok(!k.err, k.err);
  assert.deepStrictEqual(A.poteriEroe(k), ['attacco', 'r-umano', 'colpo-possente', 'riprendi-fiato', 'parata']);
  assert.deepStrictEqual(A.poteriEroe({ ...k, liv: 2 }), ['attacco', 'r-umano', 'colpo-possente', 'riprendi-fiato'], 'a livello 2 il potere del 3 non c\'è ancora');
  assert.strictEqual(A.talentiEroe(k).length, 1);
  // completamento automatico (campagna avviata senza passare dalla scheda)
  for (const cl of CLASSI) { const c = A.completa(nuovo(cl, 10)); assert.deepStrictEqual(A.daScegliere(c), []); assert.ok(E.coerente(c), cl); assert.strictEqual(A.poteriEroe(c).length, 2 + 2 + 4, cl + ': attacco, razza, 2 base, 4 scelti') }
  // schede manomesse
  const ok = A.completa(nuovo('guerriero', 5)), tocca = (f) => { const t = copia(ok); f(t); return E.coerente(t) };
  assert.ok(E.coerente(ok)); assert.ok(!tocca(t => { t.scelte[3] = 'palla-di-fuoco' }), 'potere di un\'altra classe'); assert.ok(!tocca(t => { t.scelte[6] = 'guardia-alta' }), 'livello non raggiunto');
  assert.ok(!tocca(t => { t.scelte[2] = 'colpo-possente' }), 'un potere come talento'); assert.ok(!tocca(t => { t.scelte[2] = A.TAL_ID.find(i => !A.offerta(ok, 2).includes(i)) }), 'un talento che non era stato proposto');
  assert.ok(!tocca(t => { t.scelte = [] }) && !tocca(t => { t.scelte = 'x' }) && !tocca(t => { t.scelte['03'] = 'parata' }), 'forme strane');
  assert.ok(!tocca(t => { t.scelte[1] = 'parata' }), 'livello 1 non si sceglie'); assert.ok(E.coerente({ ...ok, scelte: undefined }) , 'senza scelte è valida: restano da fare');
}

// ---- 7. danni nella tabella di docs/rules/avventura.md ----
{
  const T = [7, 8, 9, 10, 12, 13, 15, 16, 18, 19], CAH = [14, 14, 15, 15, 16, 16, 17, 17, 18, 18];
  // modello dell'equipaggiamento: l'arma porta il colpo base alla tabella (la tabella conta oggetti e poteri insieme)
  const pari = c => { const avg = c.dan.n * (c.dan.dado + 1) / 2 + c.dan.bonus; c.dan.bonus += Math.round(T[c.liv - 1] - avg); return c };
  const bersaglio = liv => ({ id: 't', lato: 'nemici', hp: 999, hpMax: 999, temp: 0, ca: CAH[liv - 1], stati: [], res: [], vuln: [], imm: [], salv: { for: 2, des: 2, cos: 2, int: 2, sag: 2, car: 2 } });
  const dannosi = c => c.poteri.map(i => A.P[i]).filter(p => p.eff.some(e => e.k === 'danno' && !e.su));
  for (const cl of CLASSI) for (let liv = 1; liv <= 10; liv++) {
    const c = pari(A.combattente(eroe(cl, liv))), b = bersaglio(liv), t = T[liv - 1];
    for (const p of dannosi(c)) {
      const s = A.stima(c, p.id, b), perColpo = s.dannoColpo;
      if (p.ric === 'turno') assert.ok(perColpo <= 1.6 * t, `${cl} L${liv} ${p.id}: ${perColpo.toFixed(1)} a colpo supera 1.6×${t}`);
      else if (p.area === 'singolo') assert.ok(s.atteso <= 3.2 * t, `${cl} L${liv} ${p.id}: atteso ${s.atteso.toFixed(1)} supera 3.2×${t}`);
      else assert.ok(perColpo <= 2.2 * t, `${cl} L${liv} ${p.id}: ${perColpo.toFixed(1)} per bersaglio supera 2.2×${t}`);
      assert.ok(s.atteso > 0 && Number.isFinite(s.atteso));
    }
    // chi lancia magie come trucchetto non resta indietro rispetto all'arma
    if (['mago', 'chierico', 'bardo'].includes(cl)) { const cp = A.P[{ mago: 'scintilla-arcana', chierico: 'fiamma-sacra', bardo: 'nota-potente' }[cl]], s = A.stima(c, cp.id, b);
      assert.ok(s.dannoColpo >= .6 * t && s.dannoColpo <= 1.3 * t, `${cl} L${liv}: trucchetto ${s.dannoColpo.toFixed(1)} fuori da 0.6-1.3×${t}`) }
  }
  // la stima coincide con la media di molte prove (colpi critici compresi, tolleranza 12%)
  const media = (id, cl, liv, n) => { const c = pari(A.combattente(eroe(cl, liv))); if (!c.poteri.includes(id)) c.poteri.push(id); let tot = 0; const g = gen(77);
    for (let i = 0; i < n; i++) { const b = bersaglio(liv); c.usi = {}; c.furtivoUsato = false; A.applica(c, id, [b], g); tot += 999 - b.hp } const st = A.stima(c, id, bersaglio(liv)); return [tot / n, st.atteso] };
  for (const [id, cl, liv] of [['attacco', 'guerriero', 3], ['colpo-possente', 'guerriero', 6], ['scintilla-arcana', 'mago', 7], ['sfera-di-fiamme', 'mago', 5], ['doppio-tiro', 'esploratore', 8], ['nota-potente', 'bardo', 2]]) {
    const [m, e] = media(id, cl, liv, 6000); assert.ok(Math.abs(m - e) <= .12 * e, `${id}: media ${m.toFixed(2)} contro stima ${e.toFixed(2)}`);
  }
}

// ---- 8. tratti di razza ----
{
  const um = A.combattente(eroe('guerriero', 3, 'nano')), nem = B.combattente('lupo-grigio'); assert.ok(um.poteri.includes('r-nano'));
  const r = A.applica(um, 'r-nano', [], gen(1), { danno: 30 }); assert.ok(r.ridotto >= 1 && r.ridotto <= 10 + 3, 'Pelle di pietra: 1d10 + livello'); assert.ok(/Cariche/.test(A.applica(um, 'r-nano', [], gen(1), { danno: 30 }).err), 'una volta per scontro');
  const pi = A.combattente(eroe('ladro', 3, 'piccolo')); const rp = A.applica(pi, 'r-piccolo', [pi], gen(1)); assert.strictEqual(rp.ritira, true);
  const el = A.combattente(eroe('esploratore', 3, 'elfo')); A.applica(el, 'r-elfo', [], gen(1)); assert.ok(S.ha(el, 'mirato'));
  const orco = A.combattente(eroe('guerriero', 3, 'orco')); orco.hp = 4; assert.ok(A.subisci(orco, 50, 'taglio').tenace); assert.strictEqual(orco.hp, 1);
  assert.ok(nem.poteri.every(i => !A.P[i].cl.startsWith('razza')), 'i mostri non hanno tratti di razza');
}

// ---- 9. 60 battaglie a caso: nessuna combinazione rompe lo stato, stessa partita = stessi risultati ----
{
  function bersagli(x, p, tutti, g) {
    const vivo = b => b.hp > 0 && !b.morto, nem = tutti.filter(b => b.lato !== x.lato && vivo(b)), amici = tutti.filter(b => b.lato === x.lato && !b.morto), vivi = amici.filter(vivo), giu = amici.filter(b => b.hp <= 0);
    const uno = a => a.length ? [a[Math.floor(g() * a.length)]] : null, qualcuno = a => { if (!a.length) return null; const s = a.filter(() => g() < .7); return s.length ? s : [a[0]] };
    return ({ se: () => [], nemico: () => uno(nem), nemici: () => qualcuno(nem), alleato: () => uno(vivi), alleati: () => qualcuno(vivi), amico: () => uno(amici), amici: () => qualcuno(amici), terra: () => uno(giu) })[p.bers]();
  }
  function controlla(tutti) {
    for (const x of tutti) {
      assert.ok(Number.isInteger(x.hp) && x.hp >= 0 && x.hp <= x.hpMax, x.id + ' PF ' + x.hp); assert.ok(Number.isInteger(x.temp) && x.temp >= 0);
      assert.ok(Number.isInteger(x.conc) && x.conc >= 0 && x.conc <= x.concMax, 'Concentrazione');
      assert.strictEqual(new Set(x.stati.map(s => s.id)).size, x.stati.length);
      for (const s of x.stati) assert.ok(S.STATI[s.id].perm ? s.t == null : Number.isInteger(s.t) && s.t >= 1, JSON.stringify(s));
      if (x.lato === 'eroi') assert.strictEqual(x.hp === 0, S.ha(x, 'terra')); else if (x.hp === 0) assert.ok(x.morto && x.stati.length === 0);
      for (const [id, n] of Object.entries(x.usi)) assert.ok(A.P[id] && n >= 1 && n <= A.usiMax(x, A.P[id]), 'cariche di ' + id);
      assert.deepStrictEqual(JSON.parse(JSON.stringify(x)), x);
    }
  }
  function battaglia(seme) {
    const g = gen(seme), log = [];
    const tutti = [];
    for (let i = 0; i < 4; i++) tutti.push(A.combattente(eroe(CLASSI[Math.floor(g() * 6)], 1 + Math.floor(g() * 10), Object.keys(E.RAZZE)[Math.floor(g() * 5)], seme * 100 + i), { id: 'e' + i }));
    for (let i = 0; i < 4; i++) tutti.push(B.combattente(B.ID[Math.floor(g() * B.ID.length)], { id: 'm' + i }));
    tutti.forEach(x => A.iniziaScontro(x));
    for (let passo = 0; passo < 80; passo++) {
      const x = tutti[Math.floor(g() * tutti.length)], k = g();
      if (x.morto) { if (g() < .3) { x.morto = false; x.hp = x.hpMax } continue }
      if (k < .62) {
        A.inizioTurno(x, g);
        const usabili = x.poteri.map(i => A.P[i]).filter(p => !A.puoUsare(x, p));
        if (usabili.length) { const p = usabili[Math.floor(g() * usabili.length)], bs = bersagli(x, p, tutti, g);
          if (bs) { const r = A.applica(x, p.id, bs, g, { danno: Math.floor(g() * 30), alleatoVicino: g() < .5 }); assert.ok(!r.err, `${x.id} ${p.id}: ${r.err}`); log.push([x.id, p.id, bs.map(b => b.id), r.ev.length, x.hp]) } }
        S.fineTurno(x);
      } else if (k < .78) log.push([x.id, 'subisce', A.subisci(x, Math.floor(g() * 40), S.TIPI[Math.floor(g() * 9)]).n]);
      else if (k < .86) A.riposo(x, g() < .5 ? 'breve' : 'lungo');
      else if (k < .92) A.iniziaScontro(x);
      else if (k < .97 && x.hp <= 0) { if (x.lato === 'eroi') S.cura(x, 1 + Math.floor(g() * 20)) }
      else x.temp = Math.max(x.temp, Math.floor(g() * 10));
      controlla(tutti);
    }
    return log;
  }
  let azioni = 0;
  for (let seme = 1; seme <= 60; seme++) { const l = battaglia(seme); azioni += l.length; if (seme <= 5) assert.deepStrictEqual(battaglia(seme), l, 'stessa partita, stessi risultati') }
  assert.ok(azioni > 1500, 'azioni eseguite: ' + azioni);
}

// ---- 10. le regole del database elencano tutti gli id (generate da npm run regole) ----
{
  const regole = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8');
  const blocco = nome => { const i = regole.indexOf('// ' + nome + '\n'), j = regole.indexOf('// ' + nome + ':fine'); assert.ok(i > 0 && j > i, 'blocco ' + nome); return regole.slice(i, j) };
  const ids = t => [...t.matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]);
  assert.deepStrictEqual(ids(blocco('scelte:talenti')), A.TAL_ID, 'talenti allineati: lancia npm run regole');
  for (const L of A.LIV_POTERE) assert.deepStrictEqual(ids(blocco('scelte:poteri' + L)), CLASSI.flatMap(c => A.opzioni(c, L)), 'poteri del livello ' + L);
  assert.ok(/'scelte', 'creato'/.test(regole) && /scelteEroeOk\(d\) && d\.creato is int/.test(regole), 'eroeOk usa scelteEroeOk');
}
console.log('test_avv_poteri: ok');
