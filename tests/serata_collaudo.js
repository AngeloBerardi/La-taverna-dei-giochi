// Collaudo completo di un kit «serata» privato (lanciato da test_serata.js con KIT_PRIVATO=percorso).
// Sta nel repo perché è generico: non contiene trame. Riproduce in simulazione le prove generali di una bibbia di regia:
// serata intera al massimo e al minimo dei giocatori, assenze dei custodi delle prove, una famiglia che non parla con
// nessuno, il colpevole che confessa troppo presto, il giro degli orari, e alla fine una tabella dei passi avanti.
module.exports = function collaudo(S, k, h) {
  const { serata, ck, clone, carica } = h;
  const errori = S.valida(k);
  ck(errori.length === 0, k.id + ': kit valido ' + JSON.stringify(errori));
  if (errori.length) return;
  console.log('     avvisi del kit:', S.avvisi(k).length);
  const chi = (k.soluzione.prove || {}).chi || [];
  const vedeChi = (s, pid) => {
    const f = k.personaggi.find(p => p.id === pid).famiglia;
    return chi.filter(x => s.pub.includes(x) || s.mie[pid][x] || s.fam[f].bacheca.includes(x)).length;
  };

  // 1. serata intera al massimo e al minimo, con investigatori bravi
  for (const n of [k.giocatori[1], k.giocatori[0]]) {
    const t0 = Date.now(),
      passi = {};
    let atto = -1;
    const { s, sicuro } = serata(k, n, {
      bravi: true,
      osserva: x => {
        if (x.atto !== atto && x.fase === 'gioco') {
          atto = x.atto;
          passi[k.atti[atto].id] = Object.fromEntries(Object.entries(x.fam).map(([f, F]) => [f, F.ded.length]));
        }
      },
    });
    ck(s.fase === 'fine', k.id + ' ' + n + ' giocatori: si arriva all’epilogo (' + (Date.now() - t0) + ' ms)');
    ck(sicuro, k.id + ' ' + n + ' giocatori: nessun segreto trapela in nessuna fase');
    const date = new Set(
      Object.values(s.mie)
        .flatMap(m => Object.keys(m))
        .concat(s.pub)
    );
    const perse = k.prove.filter(p => !p.regia && !date.has(p.id)).map(p => p.id);
    ck(!perse.length, k.id + ' ' + n + ' giocatori: ogni prova arriva a qualcuno ' + (perse.length ? perse : ''));
    ck(
      s.ris.presi === s.ris.votanti,
      k.id + ' ' + n + ' giocatori: i bravi prendono il colpevole (' + s.ris.presi + '/' + s.ris.votanti + ')'
    );
    ck(
      Object.values(s.sig).every(v => !v),
      k.id + ' ' + n + ' giocatori: tutti i sigilli spenti all’epilogo'
    );
    const famSenza = k.famiglie.filter(f => !s.fam[f.id].ded.length).map(f => f.id);
    ck(!famSenza.length, k.id + ' ' + n + ' giocatori: ogni famiglia fa almeno un passo avanti ' + famSenza);
    const scambi = Object.keys(s.stat.fra).length;
    ck(
      scambi >= k.famiglie.length,
      k.id + ' ' + n + ' giocatori: le famiglie si scambiano prove (' + scambi + ' coppie di famiglie)'
    );
    if (n === k.giocatori[1]) {
      console.log('     passi avanti cumulati per famiglia all’inizio di ogni atto:');
      for (const [a, x] of Object.entries(passi)) console.log('       atto ' + a.padEnd(4) + JSON.stringify(x));
      console.log(
        '       fine     ' +
          JSON.stringify(Object.fromEntries(Object.entries(s.fam).map(([f, F]) => [f, F.ded.length])))
      );
    }
  }
  // 2. i casuali fanno meno punti dei bravi
  {
    const tot = s => Object.values(s.ris.ind).reduce((t, x) => t + x.tot, 0);
    let b = 0,
      c = 0;
    for (let i = 1; i <= 3; i++) {
      b += tot(serata(k, k.giocatori[1], { bravi: true, rnd: carica.rng(i) }).s);
      c += tot(serata(k, k.giocatori[1], { bravi: false, rnd: carica.rng(i) }).s);
    }
    ck(b > c * 2, k.id + ': i bravi battono i casuali (' + b + ' contro ' + c + ')');
  }
  // 3. assenze: ogni custode di una prova personale se ne va proprio quando la riceve; la prova arriva alla riserva
  const custodi = new Map();
  for (const p of k.prove)
    for (const d of [].concat(p.rilascio.a)) if (d && d.p && !custodi.has(d.p)) custodi.set(d.p, p.rilascio.atto);
  for (const [pid, atto] of custodi) {
    const { s } = serata(k, k.giocatori[1], { bravi: true, esce: { pid, atto } });
    const sue = k.prove.filter(p => [].concat(p.rilascio.a).some(d => d && d.p === pid)).map(p => p.id);
    const altrove = sue.filter(
      eid => s.pub.includes(eid) || Object.entries(s.mie).some(([q, m]) => q !== pid && m[eid])
    );
    ck(
      altrove.length === sue.length,
      k.id +
        ': se ' +
        pid +
        ' esce all’atto ' +
        atto +
        ' le sue prove passano ad altri (' +
        altrove.length +
        '/' +
        sue.length +
        ')'
    );
  }
  // 4. una famiglia non parla con nessuno nel tempo libero: le altre le portano comunque le prove
  for (const f of k.famiglie) {
    const { s } = serata(k, k.giocatori[1], { bravi: true, muti: [f.id] });
    const deboli = Object.values(s.gioc)
      .filter(g => vedeChi(s, g.pid) < 2)
      .map(g => g.pid);
    ck(
      !deboli.length && s.ris.presi === s.ris.votanti,
      k.id + ': con la famiglia ' + f.id + ' muta tutti hanno almeno due prove del colpevole ' + deboli
    );
  }
  // 5. il colpevole confessa troppo presto (prova D della bibbia): la serata va avanti fino al verdetto
  {
    const colp = k.personaggi.find(p => p.colpevole),
      atto = k.atti[Math.floor(k.atti.length / 2)].id;
    const { s } = serata(k, k.giocatori[1], { bravi: true, confessa: atto });
    ck(
      s.fase === 'fine' && s.ris.votanti > 0,
      k.id + ': ' + colp.nome + ' confessa all’atto ' + atto + ' e la serata arriva al verdetto'
    );
  }
  // 6. una famiglia sola senza scambi tra famiglie: non deve bastare (il kit costringe a parlarsi)
  {
    const tutte = k.famiglie.map(f => f.id);
    const { s } = serata(k, k.giocatori[1], { bravi: true, muti: tutte });
    const soli = Object.values(s.gioc).filter(g => vedeChi(s, g.pid) >= 2).length;
    console.log(
      '     senza scambi tra famiglie vedono due prove del colpevole ' +
        soli +
        ' giocatori su ' +
        Object.keys(s.gioc).length +
        ' (solo dalle prove pubbliche)'
    );
  }
  // 7. le prove dell'epilogo e quelle tenute dalla regia restano alla regia
  ck(
    k.prove.filter(p => p.regia).every(p => p.rilascio),
    k.id + ': prove tenute dalla regia segnate'
  );
  // prove specifiche del kit, private come il kit: KIT_PRIVATO_PROVE=/percorso/prove.js
  if (process.env.KIT_PRIVATO_PROVE) require(process.env.KIT_PRIVATO_PROVE)(S, k, h);
};
