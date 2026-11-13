// Kit cifrati (motori/36b-kit-cifrati.js, buste in src/kit-cifrati/): un kit segreto sta nel repo pubblico solo cifrato.
// Con KIT_FRASE=<frase> apre anche le buste vere del repo e ne valida il contenuto:
//   KIT_FRASE=xxxx-xxxx-xxxx-xxxx-xxxx npm test -- kit_cifrati
const fs = require('fs'),
  path = require('path');
const KITC = require('../src/js/motori/36b-kit-cifrati.js'),
  SERATA = require('../src/js/motori/36a-serata.js'),
  FASCICOLO = require('../src/js/motori/36c-fascicolo.js');
let fails = 0;
const ck = (c, m) => {
  if (!c) {
    fails++;
    console.log('FAIL', m);
  } else console.log('ok  ', m);
};
const clone = o => JSON.parse(JSON.stringify(o));
const kit = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/kit/nebbia-scoglio.json'), 'utf8'));
const apre = async (b, f) => {
  try {
    return { k: await KITC.apri(b, f) };
  } catch (e) {
    return { e };
  }
};

(async () => {
  // ---- frasi ----
  const f1 = KITC.frase(),
    f2 = KITC.frase();
  ck(
    /^([a-hj-km-np-z2-9]{4}-){4}[a-hj-km-np-z2-9]{4}$/.test(f1),
    'la frase generata ha 5 gruppi da 4 lettere e cifre: ' + f1
  );
  ck(f1 !== f2, 'due frasi generate sono diverse');
  ck(KITC.normalizza('  ABCD-efgh  IJKL ') === 'abcdefghijkl', 'maiuscole, spazi e trattini non contano');

  // ---- giro completo: cifra → apri ----
  const frase = 'prova-frase-8k2m';
  const b = await KITC.cifra(kit, frase, { giri: 100000 });
  ck(KITC.valida(b).length === 0, 'la busta è valida ' + JSON.stringify(KITC.valida(b)));
  ck(
    b.id === kit.id && b.titolo === kit.titolo && b.giocatori.join() === kit.giocatori.join(),
    'in chiaro restano id, titolo e giocatori'
  );
  const testoBusta = JSON.stringify(b);
  const segreti = [
    ...kit.personaggi.map(p => p.segreto),
    ...kit.soluzione.ricostruzione,
    ...kit.prove.map(p => p.testo),
  ].filter(Boolean);
  ck(
    segreti.length > 5 && !segreti.some(t => testoBusta.includes(String(t).slice(0, 25))),
    'nella busta non compare nessun segreto, prova o soluzione'
  );
  ck(testoBusta.length < JSON.stringify(kit).length, 'la busta è più piccola del kit (compresso)');
  const r = await apre(b, frase);
  ck(r.k && JSON.stringify(r.k) === JSON.stringify(kit), 'con la frase giusta il kit torna identico');
  ck(SERATA.valida(r.k || {}).length === 0, 'il kit riaperto è valido per il motore');
  const r2 = await apre(b, ' PROVA-frase 8K2M ');
  ck(r2.k && r2.k.id === kit.id, 'la frase si può scrivere in maiuscolo, con spazi o trattini diversi');
  const b2 = await KITC.cifra(kit, frase, { giri: 100000 });
  ck(b2.sale !== b.sale && b2.iv !== b.iv && b2.dati !== b.dati, 'ogni cifratura ha sale, iv e dati nuovi');

  // ---- frase sbagliata e buste alterate ----
  for (const [nome, f] of [
    ['frase sbagliata', 'prova-frase-8k2n'],
    ['frase vuota', ''],
    ['frase quasi giusta', frase + 'x'],
  ]) {
    const x = await apre(b, f);
    ck(x.e && x.e.sbagliata === true && /sbagliata/.test(x.e.message), nome + ': «Frase sbagliata», nessun kit');
  }
  const flip = t => (t[0] === 'A' ? 'B' : 'A') + t.slice(1);
  const alterate = {
    dati: Object.assign(clone(b), { dati: flip(b.dati) }),
    iv: Object.assign(clone(b), { iv: flip(b.iv) }),
    sale: Object.assign(clone(b), { sale: flip(b.sale) }),
    giri: Object.assign(clone(b), { giri: b.giri + 1 }),
    'id (dato autenticato)': Object.assign(clone(b), { id: 'altro-kit' }),
  };
  for (const [n, x] of Object.entries(alterate)) {
    const y = await apre(x, frase);
    ck(!!y.e && !y.k, 'busta alterata (' + n + '): non si apre');
  }

  // ---- buste malformate ----
  const guasti = {
    formato: { formato: 'chiaro' },
    versione: { v: 99 },
    id: { id: 'Id Con Spazi' },
    titolo: { titolo: '' },
    giocatori: { giocatori: [30, 18] },
    'giri troppo pochi': { giri: 1000 },
    base64: { dati: 'non è base64!' },
    'manca iv': { iv: undefined },
  };
  for (const [n, d] of Object.entries(guasti))
    ck(KITC.valida(Object.assign(clone(b), d)).length > 0, 'busta non valida: ' + n);
  ck(KITC.valida(null).length > 0 && KITC.valida('x').length > 0, 'busta non valida: non è un oggetto');
  ck(
    (await apre({ formato: 'cifrato' }, frase)).e instanceof Error,
    'aprire una busta malformata dà un errore, non un crash'
  );

  // ---- le buste vere nel repo ----
  const DIR = path.join(__dirname, '../src/kit-cifrati'),
    nomi = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(n => n.endsWith('.json')) : [];
  const chiari = new Set(fs.readdirSync(path.join(__dirname, '../src/kit')).map(n => n.replace(/\.json$/, '')));
  for (const n of nomi) {
    const bv = JSON.parse(fs.readFileSync(path.join(DIR, n), 'utf8'));
    ck(KITC.valida(bv).length === 0, n + ': busta valida ' + JSON.stringify(KITC.valida(bv)));
    ck(bv.id + '.json' === n, n + ': il nome del file è l’id');
    ck(!chiari.has(bv.id), n + ': l’id non esiste anche tra i kit in chiaro');
    ck(
      !/soluzione|colpevole|segreto|"prove"/.test(JSON.stringify(bv)),
      n + ': nessuna parola del kit in chiaro nella busta'
    );
    if (process.env.KIT_FRASE) {
      const x = await apre(bv, process.env.KIT_FRASE);
      ck(!!x.k, n + ': si apre con KIT_FRASE ' + (x.e ? x.e.message : ''));
      if (x.k) {
        // dentro una busta c'è una serata o un fascicolo (la busta lo dice in chiaro in «tipo», le vecchie sono serate)
        const M = x.k.formato === 'fascicolo' ? FASCICOLO : SERATA,
          err = M.valida(x.k);
        ck(
          err.length === 0 && x.k.formato === (bv.tipo || 'serata'),
          n + ': il kit aperto è valido e del tipo dichiarato ' + JSON.stringify(err.slice(0, 3))
        );
        ck(
          x.k.titolo === bv.titolo && x.k.giocatori.join() === bv.giocatori.join(),
          n + ': titolo e giocatori in chiaro coincidono con il kit'
        );
        console.log('     avvisi del kit:', M.avvisi(x.k).length);
      }
    }
  }
  if (!process.env.KIT_FRASE) console.log('     (le buste vere non sono state aperte: manca KIT_FRASE)');

  console.log(fails ? fails + ' FALLITI' : 'tutto ok');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.log('ERRORE', e);
  process.exit(1);
});
