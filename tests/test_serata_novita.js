// Serata in famiglie, le quattro novità (docs/SERATA.md): domande del caso a cui risponde il rappresentante, prove spezzate
// tra famiglie, interrogatorio convocato dal rappresentante e approvato dal narratore, poteri a uso singolo.
const carica = require('./carica.js'),
  S = carica('36a-serata.js', 'SERATA');
const k = require('../src/kit/nebbia-scoglio.json');
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
let ORA = 1e6;
const NARR = 'narr';
const fai = (s, a) => {
  const r = S.act(s, a, k, ORA);
  if (r.err) throw new Error(a.t + ': ' + r.err);
  return r.s;
};
const prova = (s, a) => S.act(s, a, k, ORA);
const cmd = (s, c, x) => fai(s, { t: 'cmd', uid: NARR, c, ...(x || {}) });
// quattro ospiti: Nora e Bastiano alla Locanda, Ilario e Clotilde tra i Forestieri
const scelte = { u0: 'nora', u1: 'bastiano', u2: 'ilario', u3: 'clotilde' };
let s = S.nuova(
  k,
  Object.keys(scelte).map(u => ({ uid: u, nome: u })),
  { narratore: NARR, scelte }
).s;
const uid = pid => Object.keys(scelte).find(u => scelte[u] === pid);
const finoA = cond => {
  for (let i = 0; i < 80 && !cond(s); i++) s = cmd(s, 'avanti');
  return cond(s);
};

// ---- poteri: uno a testa ----
ck(
  Object.values(s.poteri).length === 4 && new Set(Object.values(s.poteri).map(p => p.id)).size === 4,
  'quattro poteri diversi, uno a testa'
);
ck(S.mani(s, k).u0.stato.potere && S.mani(s, k).u0.stato.potere.nome, 'il telefono vede il proprio potere');

// ---- domande del caso ----
ck(
  finoA(x => x.fase === 'gioco'),
  'si apre il primo atto'
);
const pvL = s.fam.locanda.pv,
  altroL = pvL === 'u0' ? 'u1' : 'u0';
ck(prova(s, { t: 'risposta', uid: altroL, sig: 'ORA', val: 1 }).err, 'risponde solo il rappresentante');
s = fai(s, { t: 'parere', uid: altroL, sig: 'ORA', val: 1 });
const casi = S.mani(s, k)[pvL].fam.casi.find(c => c.id === 'ORA');
ck(casi && casi.pareri['Alle 23:40'] === 1, 'il rappresentante vede i pareri della famiglia');
s = fai(s, { t: 'risposta', uid: pvL, sig: 'ORA', val: 1 });
const pvF = s.fam.forestieri.pv;
s = fai(s, { t: 'risposta', uid: pvF, sig: 'ORA', val: 0 });
let pub = S.pubblico(s, k),
  ora = pub.sigilli.find(x => x.id === 'ORA');
ck(ora.risposte.length === 2 && !ora.esiti && !ora.vera, 'la TV sa chi ha risposto, non che cosa');
ck(!JSON.stringify(pub).includes('"giusta"'), 'nel pubblico niente risposte giuste');
const prima = { L: s.fam.locanda.punti, F: s.fam.forestieri.punti };
s = cmd(s, 'sigillo', { id: 'ORA' });
ora = S.pubblico(s, k).sigilli.find(x => x.id === 'ORA');
ck(
  ora.esiti && ora.esiti.locanda === true && ora.esiti.forestieri === false && ora.vera === 'Alle 23:40',
  'spento il sigillo: esiti e risposta vera'
);
ck(
  s.fam.locanda.punti === prima.L + 2 && s.fam.forestieri.punti === prima.F,
  'punti solo alla famiglia che ci ha preso'
);
ck(prova(s, { t: 'risposta', uid: pvL, sig: 'ORA', val: 1 }).err, 'a domanda chiusa non si risponde più');

// ---- interrogatorio: di pomeriggio, convoca il rappresentante, approva il narratore ----
ck(prova(s, { t: 'convoca', uid: pvL, pid: 'ilario' }).err, 'di mattina non si convoca');
ck(
  finoA(x => x.mom === 'pomeriggio'),
  'pomeriggio del primo atto'
);
ck(
  prova(s, { t: 'convoca', uid: pvL, pid: s.gioc[pvL].pid === 'nora' ? 'bastiano' : 'nora' }).err,
  'non si convoca la propria famiglia'
);
s = fai(s, { t: 'convoca', uid: pvL, pid: 'ilario' });
ck(prova(s, { t: 'convoca', uid: pvL, pid: 'clotilde' }).err, 'una convocazione per famiglia e atto');
const n = s.prop.find(p => p.tipo === 'convoca').n;
ck(
  S.mani(s, k)[NARR].console.proposte.some(p => /interrogare/.test(p.testo)),
  'il narratore vede la richiesta nella console'
);
s = cmd(s, 'proposta', { n, ok: true });
pub = S.pubblico(s, k);
ck(
  pub.interr && pub.interr.pid === 'ilario' && S.mani(s, k)[uid('ilario')].stato.interrogato,
  'la TV mostra l’interrogatorio, il convocato lo sa'
);
ck(prova(s, { t: 'giudica', uid: pvF, esito: 'evasivo' }).err, 'giudica solo chi ha convocato');
s = fai(s, { t: 'giudica', uid: pvL, esito: 'evasivo' });
ck(
  !s.interr && S.pubblico(s, k).giudizi[0].esito === 'evasivo',
  'giudizio dato: l’interrogatorio si chiude e va sulla TV'
);

// ---- poteri in azione ----
const chi = id => Object.keys(s.poteri).find(p => s.poteri[p].id === id);
const sb = chi('sbircio');
const bersaglio = ['nora', 'ilario'].find(x => x !== sb);
s = fai(s, { t: 'potere', uid: uid(sb), a: bersaglio });
ck(
  /ha:/.test(s.msg[uid(sb)].slice(-1)[0].testo) && S.pubblico(s, k).cue.tipo === 'potere',
  'sbircio: titoli in privato, annuncio sulla TV'
);
ck(prova(s, { t: 'potere', uid: uid(sb), a: bersaglio }).err, 'un potere si usa una volta sola');
const nr = chi('nonrifiuto'),
  dal = nr === 'nora' ? 'ilario' : 'nora',
  eid = Object.keys(s.mie[dal]).find(e => s.mie[dal][e].meta === undefined && !s.mie[nr][e]);
if (eid) {
  s = fai(s, { t: 'potere', uid: uid(nr), a: dal, eid });
  ck(!!s.mie[nr][eid], 'non rifiuto: la copia arriva anche senza il permesso');
} else ck(true, 'non rifiuto: niente da prendere in questo giro');

// ---- prove spezzate: nel secondo atto, una metà a famiglia ----
ck(
  finoA(x => x.atto === 1 && x.mom === 'pomeriggio'),
  'pomeriggio del secondo atto'
);
const meta = i => Object.keys(scelte).filter(u => s.mie[scelte[u]].registro && s.mie[scelte[u]].registro.meta === i);
const [a] = meta(0),
  [b] = meta(1);
ck(a && b && famigliaDi(a) !== famigliaDi(b), 'il registro è spezzato tra due famiglie');
function famigliaDi(u) {
  return k.personaggi.find(p => p.id === scelte[u]).famiglia;
}
const ma = JSON.stringify(S.mani(s, k)[a].prove);
ck(ma.includes('Firmato dal perito') && !ma.includes('pagato da Genova'), 'ognuno legge solo la sua metà');
ck(prova(s, { t: 'appoggia', uid: a, eid: 'registro' }).err, 'una metà non va in bacheca');
ck(prova(s, { t: 'mostra', uid: a, eid: 'registro', a: scelte[b] }).err, 'una metà non si mostra');
s = fai(s, { t: 'unisci', uid: a, eid: 'registro' });
ORA += 61000;
s = S.tick(s, k, ORA).s;
ck(!s.unisci.registro, 'una metà in attesa scade dopo un minuto');
s = fai(s, { t: 'unisci', uid: a, eid: 'registro' });
s = fai(s, { t: 'unisci', uid: b, eid: 'registro' });
ck(
  s.mie[scelte[a]].registro.meta === undefined && s.mie[scelte[b]].registro.meta === undefined,
  'unite: tutti e due hanno la prova intera'
);
ck(S.pubblico(s, k).cue.tipo === 'unito', 'la TV annuncia la prova ricomposta');
ck(!prova(s, { t: 'appoggia', uid: a, eid: 'registro' }).err, 'intera, va in bacheca');

// ---- validatore ----
const clone = o => JSON.parse(JSON.stringify(o));
const rotto = (m, f) => {
  const x = clone(k);
  f(x);
  ck(
    S.valida(x).some(e => e.includes(m)),
    'kit rotto: ' + m
  );
};
rotto(
  'famiglie diverse',
  x => (x.prove.find(p => p.id === 'registro').spezzata.a = [{ fam: 'locanda' }, { p: 'nora' }])
);
rotto('scelte e giusta', x => (x.sigilli[0].giusta = 9));
rotto('deve essere un personaggio', x => (x.sigilli.find(z => z.id === 'NOME').giusta = 'nessuno'));
rotto('potere sconosciuto', x => (x.poteri = ['volo']));
console.log(fails ? fails + ' FALLITI' : 'tutto ok');
process.exit(fails ? 1 : 0);
