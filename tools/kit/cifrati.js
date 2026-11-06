#!/usr/bin/env node
// Kit cifrati (src/kit-cifrati/<id>.json): un kit segreto sta nel repo pubblico solo cifrato. Vedi motori/36b-kit-cifrati.js e docs/SERATA.md.
//   node tools/kit/cifrati.js cifra <kit.json> [frase]    scrive src/kit-cifrati/<id>.json (senza frase ne inventa una e la stampa)
//   node tools/kit/cifrati.js apri <busta.json> <frase> [uscita.json]   scrive il kit in chiaro (di solito fuori dal repo)
//   node tools/kit/cifrati.js frase                       stampa una frase nuova
// Il kit in chiaro NON va committato: tienilo fuori dal repo e rilancia «cifra» con la stessa frase quando lo modifichi.
const fs = require('fs'),
  path = require('path'),
  KITC = require('../../src/js/motori/36b-kit-cifrati.js'),
  SERATA = require('../../src/js/motori/36a-serata.js'),
  dir = path.join(__dirname, '../../src/kit-cifrati');

(async () => {
  const [cmd, a, b, c] = process.argv.slice(2);
  if (cmd === 'frase') return console.log(KITC.frase());
  if (cmd === 'cifra' && a) {
    const kit = JSON.parse(fs.readFileSync(a, 'utf8')),
      err = (kit.formato === 'serata' ? SERATA : require('../../src/js/motori/36-giallo.js')).valida(kit);
    if (err.length) throw new Error('Il kit non è valido: ' + err.join('; '));
    const frase = b || KITC.frase(),
      busta = await KITC.cifra(kit, frase);
    // prova di apertura prima di scrivere: se non torna uguale, niente file
    if (JSON.stringify(await KITC.apri(busta, frase)) !== JSON.stringify(kit))
      throw new Error('La busta non si riapre uguale');
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, kit.id + '.json');
    fs.writeFileSync(out, JSON.stringify(busta, null, 1) + '\n');
    console.log(`${path.relative(process.cwd(), out)}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
    if (!b) console.log('Frase (scrivila sulla TV la prima volta, non finisce da nessuna parte):\n  ' + frase);
    return;
  }
  if (cmd === 'apri' && a && b) {
    const kit = await KITC.apri(JSON.parse(fs.readFileSync(a, 'utf8')), b);
    if (c) fs.writeFileSync(c, JSON.stringify(kit));
    return console.log(c ? `kit «${kit.titolo}» scritto in ${c}` : JSON.stringify(kit));
  }
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 6).join('\n'));
  process.exit(1);
})().catch(e => {
  console.error('Errore: ' + e.message);
  process.exit(1);
});
