// Fascicolo in sfida (motori/36d-fascicolo-sfida.js): due squadre rivali sullo stesso kit, stessa TV.
// Controlla che le partite restino allineate, che nessuna squadra veda ciò che ha l'altra (né sulla TV né sul telefono),
// che si passi avanti solo quando sono pronte tutte e due, e che vinca chi risolve meglio.
const fs = require('fs'),
  path = require('path');
const carica = require('./carica.js'),
  X = carica.multi(['36c-fascicolo.js', '36d-fascicolo-sfida.js'], 'FSFIDA');
const k = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/kit/il-gatto-del-notaio.json'), 'utf8'));
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
let ORA = 1e6;
const fai = (s, a) => {
  const r = X.act(s, a, k, ORA);
  if (r.err) throw new Error(a.t + ': ' + r.err);
  return r.s;
};
const prova = (s, a) => X.act(s, a, k, ORA);
const gioc = n => Array.from({ length: n }, (_, i) => ({ uid: 'u' + i, nome: 'G' + i }));
const regia = (s, t) => fai(s, { t, uid: 'tv', regia: true });

let s = X.nuova(k, gioc(5), {}).s;
ck(s.sq.A.ordine.length === 3 && s.sq.B.ordine.length === 2, 'cinque telefoni: tre rossi e due blu, a giro');
ck(
  ['archivio', 'scientifica', 'testimoni', 'luoghi'].every(x =>
    Object.values(s.sq.B.gioc).some(g => g.spec.includes(x))
  ),
  'anche la squadra piccola copre le quattro specialità'
);
ck(X.nuova(k, gioc(1), {}).err, 'con un solo telefono la sfida non parte');
{
  let t = fai(s, { t: 'squadra', uid: 'u0' });
  ck(
    t.sq.B.ordine.includes('u0') && t.sq.A.ordine.length === 2 && t.sq.B.ordine.length === 3,
    'prima di aprire il caso si cambia squadra'
  );
  t = fai(t, { t: 'squadra', uid: 'u2' });
  ck(t.sq.A.ordine.join() === 'u4', 'la rossa resta con un telefono solo');
  ck(prova(t, { t: 'squadra', uid: 'u4' }).err, 'una squadra non resta vuota');
}
while (s.sq.A.fase !== 'indagine') s = regia(s, 'avanti');
ck(s.sq.B.fase === 'indagine' && s.sq.A.fino === s.sq.B.fino, 'le due partite vanno avanti insieme, stesso timer');
ck(prova(s, { t: 'squadra', uid: 'u0' }).err, 'a caso aperto le squadre non si cambiano più');
// la squadra rossa esamina una zona e interroga: la blu non vede niente, la TV solo un annuncio
const luoA = s.sq.A.ordine.find(u => s.sq.A.gioc[u].spec.includes('luoghi')),
  tesA = s.sq.A.ordine.find(u => s.sq.A.gioc[u].spec.includes('testimoni'));
s = fai(s, { t: 'esplora', uid: luoA, zona: 'cesta' });
s = fai(s, { t: 'chiedi', uid: tesA, tema: 't-cena' });
const pub = JSON.stringify(X.pubblico(s, k)),
  manB = JSON.stringify(X.mani(s, k)[s.sq.B.ordine[0]]);
ck(
  !pub.includes('angolo di carta bollata') && !pub.includes('22:50'),
  'la TV non mostra il sopralluogo né la risposta del testimone'
);
ck(
  X.pubblico(s, k).cue.tipo === 'annuncio' && X.pubblico(s, k).cue.squadra === 'A',
  'la TV annuncia solo che la squadra rossa interroga'
);
ck(
  !manB.includes('angolo di carta bollata') && !manB.includes('22:50'),
  'il telefono blu non vede ciò che ha trovato la rossa'
);
ck(!s.sq.B.visti.cesta && s.sq.B.ore === s.sq.A.ore + 2, 'le ore sono di ogni squadra');
ck(prova(s, { t: 'proietta', uid: luoA, rep: 'foglio' }).err, 'nella sfida non si proietta sulla TV');
// risposte: consegna ciascuna il suo caposquadra, la TV dice chi ha risposto
const capoA = s.sq.A.capo,
  capoB = s.sq.B.capo;
s = fai(s, { t: 'proponi', uid: capoA, dom: 'quando', val: '22:40' });
s = fai(s, { t: 'consegna', uid: capoA, dom: 'quando' });
s = fai(s, { t: 'proponi', uid: capoB, dom: 'quando', val: '23:30' });
s = fai(s, { t: 'consegna', uid: capoB, dom: 'quando' });
const p2 = X.pubblico(s, k);
ck(
  p2.squadre.every(q => q.domande.find(d => d.id === 'quando').stato === 'consegnata') &&
    !JSON.stringify(p2).includes('23:30'),
  'la TV sa che hanno risposto tutte e due, non cosa'
);
// avanti: serve che siano pronte entrambe
s = fai(s, { t: 'avanti', uid: capoA });
ck(s.sq.A.fase === 'indagine' && X.pubblico(s, k).squadre[0].pronta, 'la rossa è pronta, ma si aspetta la blu');
ck(prova(s, { t: 'avanti', uid: s.sq.B.ordine.find(u => u !== capoB) }).err, 'va avanti solo il caposquadra');
s = fai(s, { t: 'avanti', uid: capoA });
ck(!s.pronte.A, 'un secondo tocco ritira la squadra');
s = fai(s, { t: 'avanti', uid: capoA });
s = fai(s, { t: 'avanti', uid: capoB });
ck(s.sq.A.fase === 'consegna' && s.sq.B.fase === 'consegna', 'pronte tutte e due: si passa ai minuti della consegna');
s = X.tick(s, k, s.sq.A.fino + 1).s;
ck(s.sq.A.fase === 'rivelazione' && s.sq.B.fase === 'rivelazione', 'scaduto il tempo, rivelazione per entrambe');
ck(s.sq.A.esiti.quando === true && s.sq.B.esiti.quando === false, 'ognuna ha il suo esito');
// fino alla fine: la rossa risponde giusto all'accusa, la blu sbaglia
for (let i = 0; i < 80 && s.sq.A.fase !== 'accusa'; i++) {
  if (['indagine', 'consegna'].includes(s.sq.A.fase)) s = X.tick(s, k, s.sq.A.fino + 1).s;
  else s = regia(s, 'avanti');
}
ck(s.sq.A.fase === 'accusa' && s.sq.B.fase === 'accusa', 'arrivano insieme all’accusa');
const vota = (t, chi) => {
  const c = s.sq[t].capo;
  s = fai(s, { t: 'proponi', uid: c, dom: 'chi', val: chi });
  s = fai(s, { t: 'consegna', uid: c, dom: 'chi' });
  s = fai(s, { t: 'avanti', uid: c });
};
vota('A', 'pietro');
vota('B', 'corrado');
ck(s.sq.A.fase === 'finale' && s.ris && s.ris.vince.join() === 'A', 'vince la squadra che ha indovinato il colpevole');
ck(X.pubblico(s, k).epiloghi.length === 2, 'sulla TV l’epilogo di ognuna');
console.log(fails ? fails + ' FALLITI' : 'tutto ok');
process.exit(fails ? 1 : 0);
