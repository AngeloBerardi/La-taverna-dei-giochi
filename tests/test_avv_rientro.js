// Rientro sull'account (A9): quanto è maturato in campagna (XP, oro, oggetti) torna alla scheda a tappe che le regole di Firestore accettano; mai due volte, mai per i compagni.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const E = require('../src/js/motori/27-eroi.js');
global.EROI = E;
const C = require('../src/js/motori/28-campagna.js');
const AVV = require('../src/js/motori/28a-avv-orchestratore.js');
const ARIE = require('../src/js/motori/28b-avv-rientro.js');
const CM = require('../src/js/motori/27p-avv-compagni.js');
const cap = require('../src/avventura/corona.json');
const copia = (x) => JSON.parse(JSON.stringify(x));
const A = { pelle: 0, capelli: 1, mantello: 2, viso: 0 };
const mk = (nome, classe, razza, base, slot) => Object.assign(E.nuovo({ nome, classe, razza, aspetto: A, base: { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8, ...base } }), { slot });
const squadra = (n) => [mk('Aldo', 'guerriero', 'umano', { for: 15, cos: 14, des: 12 }, 'e1'), mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }, 'e2'), mk('Tobia', 'mago', 'piccolo', { int: 15, sag: 13, des: 12 }, 'e3')].slice(0, n);
const nuova = (n, seme) => AVV.nuova(cap, squadra(n), seme || 3, { avvio: false });

// ---- all'inizio non c'è niente da riscuotere ----
let s = nuova(3);
assert.deepStrictEqual(ARIE.pendente(s).map((p) => [p.slot, p.xp, p.oro]), [['e1', 0, 0], ['e2', 0, 0], ['e3', 0, 0]]);
assert(ARIE.piano(s).finito && ARIE.piano(s).scritture === 0);

// ---- esperienza e oro ----
s.camp.eroi.forEach((e, i) => { e.xp += 120 + i * 10; }); s.camp.oro += 31;      // 31 monete in tre: 10 a testa, il resto (1) al primo
let p = ARIE.pendente(s);
assert.deepStrictEqual(p.map((x) => x.xp), [120, 130, 140], 'ognuno la sua esperienza'); assert.deepStrictEqual(p.map((x) => x.oro), [11, 10, 10], 'l\'oro in parti uguali, il resto al primo');
assert.strictEqual(p.reduce((a, x) => a + x.oro, 0), 31, 'non si perde né si inventa una moneta');
s.camp.oro -= 61; p = ARIE.pendente(s); assert.deepStrictEqual(p.map((x) => x.oro), [-10, -10, -10], 'chi ha speso ritrova un conto più basso (30 spesi in tutto)');
s.camp.oro += 61;
// compagni: non fanno parte del conto
const comp = CM.scheda(cap.compagni.gherardo, 3, 'gherardo'); const sc = copia(s); sc.camp.eroi.push(C.eroeNuovo(comp, 3)); sc.camp.eroi[3].xp += 500;
assert.strictEqual(ARIE.pendente(sc).length, 3, 'tre eroi dell\'account, non il compagno');

// ---- una tappa non supera i tetti delle regole ----
assert.deepStrictEqual(ARIE.LIM, E.LIMITI); const grande = { slot: 'e1', xp: 5000, oro: 4500 }, t = ARIE.tappa(grande);
assert.deepStrictEqual([t.xp, t.oro], [E.LIMITI.xp, E.LIMITI.oro]); assert.deepStrictEqual(ARIE.tappa({ slot: 'e1', xp: 50, oro: -300 }), { slot: 'e1', xp: 50, oro: -300 }, 'l\'oro speso passa sempre');
const r800 = fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8'); assert(new RegExp('n\\.xp - v\\.xp <= ' + E.LIMITI.xp + ' && n\\.oro - v\\.oro <= ' + E.LIMITI.oro).test(r800), 'stessi numeri delle regole');
assert(r800.includes('duration.value(' + E.LIMITI.attesaS + ", 's')"), 'e stessa attesa');

// ---- riscossione a tappe, fino in fondo, senza doppi accrediti ----
{
  let m = nuova(2, 8); m.camp.eroi[0].xp += 2100; m.camp.eroi[1].xp += 300; m.camp.oro += 2400;      // 3 tappe per l'esperienza di Aldo, 2 per l'oro (1200 a testa)
  m.camp.eroi[0].zaino.push('pozione-cura'); m.camp.eroi[0].cintura = ['pozione-cura'];
  let acc = { e1: E.nuovo({ nome: 'Aldo', razza: 'umano', classe: 'guerriero', aspetto: A, base: { for: 15, des: 12, cos: 14, int: 8, sag: 10, car: 8 } }), e2: mk('Mira', 'ladro', 'elfo', { des: 15, sag: 13, car: 12 }) };
  const piano = ARIE.piano(m); assert.strictEqual(piano.scritture, 3); assert(!piano.finito);
  const iniz = { e1: copia(acc.e1), e2: copia(acc.e2) }; let giri = 0, scritture = [];
  while (!ARIE.piano(m).finito && giri++ < 10) {
    for (const x of ARIE.piano(m).eroi) {
      if (x.finito) continue; const e = m.camp.eroi.find((q) => q.slot === x.slot), prima = acc[x.slot];
      const nuovaScheda = ARIE.applica(prima, x.tappa, e);
      assert(nuovaScheda.xp - prima.xp <= E.LIMITI.xp && nuovaScheda.oro - prima.oro <= E.LIMITI.oro, 'dentro i tetti delle regole');
      assert(nuovaScheda.liv >= prima.liv && nuovaScheda.hp === nuovaScheda.hpMax && nuovaScheda.xp >= prima.xp);
      acc[x.slot] = nuovaScheda; m = ARIE.accredita(m, x.tappa); scritture.push(x.slot);
    }
  }
  assert(ARIE.piano(m).finito && ARIE.pendente(m).every((q) => q.xp === 0 && q.oro === 0), 'tutto riscosso');
  assert.strictEqual(acc.e1.xp, iniz.e1.xp + 2100); assert.strictEqual(acc.e2.xp, iniz.e2.xp + 300); assert.strictEqual(acc.e1.oro, iniz.e1.oro + 1200); assert.strictEqual(acc.e2.oro, iniz.e2.oro + 1200);
  assert.strictEqual(acc.e1.liv, E.livelloPerXp(acc.e1.xp)); assert.strictEqual(acc.e1.hpMax, E.derivati(acc.e1).hpMax);
  assert.strictEqual(giri, 3, 'tre tappe in tutto'); assert(acc.e1.zaino.includes('pozione-cura') && acc.e1.cintura.length === 1, 'gli oggetti tornano a casa');
  // riscuotere ancora non dà niente
  assert(ARIE.pendente(m).every((q) => q.xp === 0 && q.oro === 0)); assert.deepStrictEqual(ARIE.piano(m).eroi.map((q) => q.tappa.xp + q.tappa.oro), [0, 0]);
  // lo stato accreditato resta JSON puro e sopravvive a un salvataggio
  const m2 = AVV.apri(AVV.salva(m)).s; assert.deepStrictEqual(ARIE.pendente(m2), ARIE.pendente(m));
}

// ---- l'account può essere cambiato altrove nel frattempo: si somma, non si sovrascrive ----
{
  let m = nuova(1, 9); m.camp.eroi[0].xp += 200; m.camp.oro += 40;
  const h = Object.assign(E.guadagna(squadra(1)[0], 500), { oro: 77 });       // intanto sull'account: +500 XP e 77 monete
  const x = ARIE.piano(m).eroi[0], n = ARIE.applica(h, x.tappa, m.camp.eroi[0]);
  assert.strictEqual(n.xp, h.xp + 200); assert.strictEqual(n.oro, 77 + 40);
  // oro speso più di quel che c'è: non scende sotto zero
  m.camp.oro = 0; const y = ARIE.piano(m).eroi[0], poveri = ARIE.applica(Object.assign({}, squadra(1)[0], { oro: 5 }), y.tappa, m.camp.eroi[0]);
  assert.strictEqual(poveri.oro, 0, 'mai sotto zero');
}

// ---- oggetti: se il livello di questa tappa non li regge, restano per la tappa dopo ----
{
  const m = nuova(1, 10); const e = m.camp.eroi[0]; e.equip.arma = 'ascia'; e.zaino.push('pozione-cura');
  const h = squadra(1)[0]; const n = ARIE.applica(h, { slot: 'e1', xp: 0, oro: 0 }, e); assert.strictEqual(n.equip.arma, 'ascia'); assert(n.zaino.includes('pozione-cura'));
  const rotto = copia(e); rotto.zaino = ['oggetto-che-non-esiste']; const n2 = ARIE.applica(h, { slot: 'e1', xp: 0, oro: 0 }, rotto); assert.deepStrictEqual(n2.zaino, h.zaino, 'oggetti non validi: resta la scheda com\'era');
}

// ---- attesa tra due guadagni ----
assert.strictEqual(ARIE.attesa(0, 1e6), 0, 'mai guadagnato'); assert.strictEqual(ARIE.attesa(1000000, 1010000), 50); assert.strictEqual(ARIE.attesa(1000000, 1100000), 0); assert.strictEqual(ARIE.attesa(1000000, 1000000), E.LIMITI.attesaS);
assert(ARIE.guadagna({ xp: 1, oro: 0 }) && ARIE.guadagna({ xp: 0, oro: 1 }) && !ARIE.guadagna({ xp: 0, oro: -50 }), 'solo chi guadagna aspetta');

// ---- il premio di fine campagna, una volta sola ----
{
  const f = { esito: 'finale-a-luminoso', vinta: true, sbloccati: ['mirta'], monete: 30 }; let m = nuova(1, 11); assert.deepStrictEqual(ARIE.premio(m), { monete: 0, sbloccati: [] }, 'campagna in corso: nessun premio');
  m.fine = f; assert.deepStrictEqual(ARIE.premio(m), { monete: 30, sbloccati: ['mirta'] }); m = ARIE.premiato(m); assert.deepStrictEqual(ARIE.premio(m), { monete: 0, sbloccati: [] }, 'già riscosso');
  m.fine = { esito: 'persa', vinta: false, monete: 0, sbloccati: [] }; assert.strictEqual(ARIE.premio(m).monete, 0, 'persa: nessun premio');
}

console.log('OK test_avv_rientro');
