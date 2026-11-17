// Compagnia di ventura, diplomazia (V3): alleanze tra regni, proposte ai re come conto con i fattori in chiaro, preavviso e durata minima,
// soccorso agli alleati, salvataggi senza alleanze, regni che non si combattono mai tra alleati. (La prova lunga a 20 semi è test_ven_diplomazia_bot.js.)
const assert = require('assert');
const carica = require('./carica.js');
const F = carica.VEN_FILES;
const V = carica.multi(F, 'VEN'), D = carica.multi(F, 'VDAT');
const ok = x => { assert(!x.err, x.err); return x; };
const capitale = (s, f) => s.l.find(l => l.tipo === 'citta' && l.faz === f);
const chiave = (a, b) => a < b ? a + '|' + b : b + '|' + a;
// un mondo in cui si serve `f` come `tipo` e si è nella sua capitale
const sala = (seme, f, tipo) => { const s = V.nuovo(seme); s.servizio = { faz: f, tipo }; s.dentro = capitale(s, f).id; s.fama = 120; s.rel[f] = 40; return s; };
const pulito = s => { s.guerra = {}; s.alleanza = {}; return s; };

// i numeri e i tratti ci sono
assert(D.DIPL.MIN === 20 && D.DIPL.PREAVVISO === 3 && D.DIPL.ATTESA === 3);
for (const t of D.TRATTI_ID) for (const k of ['pace', 'alleanza', 'guerra']) assert(typeof D.TRATTI[t].dipl[k] === 'number', 'tratto senza peso: ' + t + ' ' + k);

// chi parla e a chi: capitano libero niente, mercenario solo pace, vassallo tutto ma solo col proprio re
{
  const s = pulito(V.nuovo(11)); s.dentro = capitale(s, 'val').id;
  assert(V.proposta(s, 'alleanza', 'val', 'sel').err, 'un capitano libero non tratta');
  assert(V.fai(s, { a: 'proponi', tipo: 'alleanza', f: 'sel' }).err);
  s.servizio = { faz: 'val', tipo: 'mer', fino: 99 };
  s.guerra[chiave('val', 'sel')] = true;
  assert(/solo la pace/.test(V.proposta(s, 'alleanza', 'val', 'fer').err), 'il mercenario chiede solo pace');
  assert(!V.proposta(s, 'pace', 'val', 'sel').err, 'il mercenario può chiedere pace');
  s.servizio.tipo = 'vas';
  assert(V.proposta(s, 'pace', 'sel', 'val').err, 'si parla solo col proprio re');
  assert(V.proposta(s, 'pace', 'val', 'fer').err, 'non c\'è guerra da chiudere');
  assert(V.proposta(s, 'alleanza', 'val', 'sel').err, 'prima la pace');
  assert(V.proposta(s, 'guerra', 'val', 'sel').err, 'già in guerra');
  s.dentro = capitale(s, 'sel').id; assert(V.fai(s, { a: 'proponi', tipo: 'pace', f: 'val' }).err, 'solo nella capitale del proprio re');
}

// il conto: stessi fattori, stessa somma, stesso esito; il re accetta se e solo se la somma è ≥ 0; niente dadi
{
  let accetti = 0, rifiuti = 0;
  for (const seme of [3, 8, 21, 40]) for (const tipo of ['pace', 'alleanza', 'guerra']) for (const rel of [-30, 0, 45]) for (const fama of [0, 150]) {
    const s = sala(seme, 'val', 'vas'); s.rel.val = rel; s.fama = fama;
    if (tipo === 'pace') s.guerra[chiave('val', 'sel')] = true; else pulito(s);
    const p1 = V.proposta(s, tipo, 'val', 'sel'), p2 = V.proposta(JSON.parse(JSON.stringify(s)), tipo, 'val', 'sel');
    assert(!p1.err, p1.err); assert.deepStrictEqual(p1, p2, 'stessa proposta, stesso conto');
    assert(Math.abs(p1.f.reduce((x, y) => x + y.v, 0) - p1.tot) < .051, 'la somma dei fattori è il totale'); assert((tipo === 'pace' || p1.f.length >= 1) && p1.f.every(x => x.n && typeof x.v === 'number' && x.v !== 0));
    const rngPrima = s.rng, r = V.fai(s, { a: 'proponi', tipo, f: 'sel' });
    assert.strictEqual(!r.err, p1.ok, 'fai accetta se e solo se il conto è ≥ 0 (' + tipo + ' ' + p1.tot + ')'); assert.strictEqual(s.rng, rngPrima, 'nessun dado tirato');
    if (p1.ok) { accetti++; assert.strictEqual(tipo === 'pace' ? !V.inGuerra(s, 'val', 'sel') : tipo === 'guerra' ? V.inGuerra(s, 'val', 'sel') : V.alleate(s, 'val', 'sel'), true, 'effetto di ' + tipo) } else { rifiuti++; assert(/rifiuta/.test(r.err) && r.err.includes(String(p1.tot))) }
  }
  assert(accetti > 10 && rifiuti > 10, 'il conto non è sempre sì né sempre no: ' + accetti + ' sì, ' + rifiuti + ' no');
  // più amicizia e più fama aiutano davvero; il tratto del re pesa
  const s = pulito(sala(3, 'val', 'vas')), a = V.proposta(s, 'alleanza', 'val', 'sel').tot; s.rel.val = 90; s.fama = 400; assert(V.proposta(s, 'alleanza', 'val', 'sel').tot > a);
  const re = s.sig.find(x => x.faz === 'val' && x.re); re.tratto = 'prudente'; const pr = V.proposta(s, 'guerra', 'val', 'sel').tot; re.tratto = 'prode'; assert(V.proposta(s, 'guerra', 'val', 'sel').tot > pr, 'un re prode fa guerra più volentieri di uno prudente');
}

// effetti: pace toglie gli assedi, alleanza si scrive, guerra pesa sull'amicizia col nemico, rottura con preavviso e durata minima
{
  const s = pulito(sala(5, 'val', 'vas')); s.rel.val = 90; s.fama = 400; s.sig.find(x => x.faz === 'val' && x.re).tratto = 'onorevole';
  s.guerra[chiave('val', 'sel')] = true; const cit = s.l.find(l => l.faz === 'sel' && l.tipo === 'castello'); cit.ass = { faz: 'val', da: s.t, pid: [] };
  ok(V.fai(s, { a: 'proponi', tipo: 'pace', f: 'sel' })); assert(!V.inGuerra(s, 'val', 'sel') && cit.ass === null, 'la pace chiude la guerra e gli assedi');
  // il re ascolta di nuovo solo dopo qualche giorno (niente pace e guerra a raffica)
  assert(/di nuovo il giorno/.test(V.fai(s, { a: 'proponi', tipo: 'alleanza', f: 'sel' }).err) && /di nuovo/.test(V.proposta(s, 'alleanza', 'val', 'sel').err), 'stesso re, stesso giorno: aspetta');
  s.t += 1440 * D.DIPL.ATTESA;
  const g0 = V.giorno(s); ok(V.fai(s, { a: 'proponi', tipo: 'alleanza', f: 'sel' })); assert(V.alleate(s, 'val', 'sel') && V.alleate(s, 'sel', 'val') && s.alleanza['sel|val'].da === g0);
  assert(V.proposta(s, 'guerra', 'val', 'sel').err, 'alleati non si dichiara guerra'); assert(V.proposta(s, 'alleanza', 'val', 'fer').err, 'un solo alleato');
  assert(!V.nemiche(s, 'val', 'sel') && !V.nemiche(s, 'sel', 'val'));
  // preavviso dopo qualche giorno: l'alleanza regge fino al giorno 20, anche oltre l'annuncio + 3
  s.t += 1440 * D.DIPL.ATTESA; ok(V.fai(s, { a: 'proponi', tipo: 'rompi', f: 'sel' })); const fine = s.alleanza['sel|val'].rompe; assert.strictEqual(fine, g0 + D.DIPL.MIN, 'rompe non prima di 20 giorni'); assert(V.fai(s, { a: 'proponi', tipo: 'rompi', f: 'sel' }).err, 'annuncio già dato');
  s.dentro = -1; s.davanti = -1; s.servizio = null; // fuori dalle mura il mondo gira da solo
  while (V.giorno(s) < fine) { V.passo(s, 720); if (s.incontro) V.auto(s); assert(V.alleate(s, 'val', 'sel') || V.giorno(s) >= fine, 'alleanza sciolta troppo presto al giorno ' + V.giorno(s)); }
  while (s.incontro) V.auto(s); V.passo(s, 60); assert(!V.alleate(s, 'val', 'sel'), 'finita dopo il preavviso'); assert(s.log.some(x => /non sono più alleati/.test(x.tx)), 'è in cronaca');
  // rottura tardi: vale il preavviso di tre giorni
  const t = pulito(sala(5, 'val', 'vas')); t.alleanza['sel|val'] = { da: 1, rompe: 0 }; t.t = 30 * 1440 + 8 * 60; ok(V.fai(t, { a: 'proponi', tipo: 'rompi', f: 'sel' })); assert.strictEqual(t.alleanza['sel|val'].rompe, V.giorno(t) + D.DIPL.PREAVVISO);
  // la guerra a un nemico peggiora l'amicizia con lui
  const w = pulito(sala(9, 'val', 'vas')); w.rel.val = 90; w.fama = 400; w.sig.find(x => x.faz === 'val' && x.re).tratto = 'prode'; w.rel.fer = 0;
  const pg = V.proposta(w, 'guerra', 'val', 'fer'); if (pg.ok) { ok(V.fai(w, { a: 'proponi', tipo: 'guerra', f: 'fer' })); assert(w.rel.fer < 0 && V.nemiche(w, 'tu', 'fer'), 'chi dichiara la guerra si fa nemico il bersaglio') } else assert(V.fai(w, { a: 'proponi', tipo: 'guerra', f: 'fer' }).err);
}

// salvataggi: un v2 senza alleanze si apre e gira; uno con alleanze si salva e si riapre uguale
{
  const s = V.nuovo(14), vecchio = JSON.parse(V.salva ? V.salva(s) : JSON.stringify(s)); delete vecchio.alleanza;
  const a = V.apri(JSON.stringify(vecchio)); assert(a && a.alleanza && Object.keys(a.alleanza).length === 0, 'campo assente = nessuna alleanza'); assert(!V.alleate(a, 'val', 'sel')); V.passo(a, 1440 * 5);
  const b = V.nuovo(14); b.alleanza['alt|val'] = { da: 3, rompe: 0 }; const c = V.apri(JSON.stringify(b)); assert.strictEqual(JSON.stringify(c.alleanza), JSON.stringify(b.alleanza));
}

// soccorso: un signore alleato che passa vicino a una città assediata accorre, ma solo se è in guerra con chi assedia
// (in pace con l'assediante resterebbe lì a guardare senza poter combattere)
for (const inGuerra of [true, false]) {
  const s = pulito(V.nuovo(23)), A = 'val', B = 'sel', C = 'fer'; s.alleanza[chiave(A, B)] = { da: 1, rompe: 0 }; s.guerra[chiave(A, C)] = true; if (inGuerra) s.guerra[chiave(B, C)] = true;
  const cit = capitale(s, A); cit.ass = { faz: C, da: s.t, pid: [] };
  const sig = s.p.find(p => p.k === 'sig' && p.faz === B); sig.dentro = -1; sig.sc = 0; sig.fermo = 0; sig.via = []; sig.x = cit.x + 3; sig.y = cit.y + 2; sig.ia = { st: 'giro', t: 0 };
  let corso = false; for (let h = 0; h < 40 && !corso; h++) { sig.via = []; if (!cit.ass) cit.ass = { faz: C, da: s.t, pid: [] }; V.passo(s, 20); if (sig.ia.st === 'soccorso' && sig.ia.a === cit.id) corso = true; if (s.incontro) V.auto(s); }
  assert.strictEqual(corso, inGuerra, inGuerra ? 'l\'alleato in guerra con l\'assediante accorre' : 'l\'alleato in pace con l\'assediante non accorre');
}

// scontro: gli alleati vicini combattono dalla stessa parte
{
  const s = pulito(V.nuovo(31)), A = 'val', B = 'sel', C = 'fer'; s.alleanza[chiave(A, B)] = { da: 1, rompe: 0 }; s.guerra[chiave(A, C)] = true; s.guerra[chiave(B, C)] = true;
  const pa = s.p.find(p => p.k === 'sig' && p.faz === A), pb = s.p.find(p => p.k === 'sig' && p.faz === B), pc = s.p.find(p => p.k === 'sig' && p.faz === C);
  for (const p of [pa, pb, pc]) { p.dentro = -1; p.sc = 0; p.via = []; p.fermo = s.t + 5000; }
  const M = V.mappa(s.seme), x = s.l.find(l => l.tipo === 'citta').x + 4, y = s.l.find(l => l.tipo === 'citta').y + 4;
  pa.x = x; pa.y = y; pc.x = x + .3; pc.y = y; pb.x = x + 1.1; pb.y = y + .4; s.t = s.t - (s.t % 60) + 59; V.passo(s, 2);
  const sc = s.scontri.find(q => q.a.includes(pa.id) || q.b.includes(pa.id)); assert(sc, 'si è accesa una mischia');
  const latoA = sc.a.includes(pa.id) ? sc.a : sc.b; assert(latoA.includes(pb.id), 'l\'alleato è dalla parte del suo alleato'); assert(!latoA.includes(pc.id));
}
// freno alla valanga: un regno che tiene troppo viene riconosciuto come dominante, gli altri si alleano contro di lui e gli fanno guerra più spesso.
// (Lasciato a sé il mondo di oggi conquista poco e il freno scatta di rado: qui lo si mette alla prova creando apposta un regno che vince troppo.)
{
  let contro = 0, guerre = 0;
  for (const seme of [12, 33]) {
    const s = pulito(V.nuovo(seme)), D0 = 'val', vs = s.sig.findIndex(x => x.faz === D0);
    for (const l of s.l) if (D.REGNI.includes(l.faz) && l.faz !== D0 && l.tipo !== 'citta' && s.l.filter(q => q.faz === D0).length < s.l.filter(q => D.REGNI.includes(q.faz)).length * .5) { l.faz = D0; l.sig = vs; }
    const dom = V.dominante(s); assert(dom && dom.f === D0 && dom.quota >= D.DIPL.QUOTA_DOM, 'il regno che tiene metà dei luoghi è dominante: ' + JSON.stringify(dom));
    let vista = false; // la cronaca tiene solo le ultime voci: si guarda lo stato, giorno per giorno
    for (let h = 0; h < 24 * 24; h++) { if (s.incontro) { V.auto(s); continue; } V.passo(s, 60); if (!vista && Object.keys(s.alleanza).some(k => !k.split('|').includes(D0))) vista = true; }
    if (vista) contro++;
    guerre += D.REGNI.filter(f => f !== D0 && V.inGuerra(s, D0, f)).length;
  }
  assert(contro === 2, 'in tutti e due i mondi gli altri regni si alleano contro il dominante: ' + contro + '/2');
  assert(guerre >= 4, 'il dominante si trova in guerra con più regni: ' + guerre + ' guerre in 2 mondi');
}
console.log('ven_diplomazia ok');
