#!/usr/bin/env node
// Assembla src/ in dist/index.html seguendo src/manifest.json (ordine = ordine di caricamento).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'));
// librerie esterne (src/js/vendor/): non nella pagina ma in dist/vendor/<nome>.<hash>.js, caricate da VENDOR.load
const NOMI = { '09-peerjs.js': 'peerjs', '09c-three.min.js': 'three', '12c-lobby-3d.js': 'lobby3d' }; // lobby3d: generato da tools/taverna3d, caricato a richiesta (guscio in app/12d-lobby-3d-guscio.js)
const vendor = {};
fs.mkdirSync(path.join(root, 'dist/vendor'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'dist/vendor'))) fs.rmSync(path.join(root, 'dist/vendor', f));
let html = manifest.map(f => {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  const nome = NOMI[path.basename(f)];
  if (!nome && !f.startsWith('src/js/vendor/')) return src;
  if (!nome) throw new Error('vendor senza nome in scripts/build.js: ' + f);
  const h = require('crypto').createHash('sha1').update(src).digest('hex').slice(0, 10);
  const file = `${nome}.${h}.js`;
  fs.writeFileSync(path.join(root, 'dist/vendor', file), src);
  vendor[nome] = '/vendor/' + file;
  return '';
}).join('');
html = html.replace('/*VENDOR*/{}', JSON.stringify(vendor));
// kit delle cene con delitto (src/kit/*.json): validati, scritti a parte in dist/kit/<id>.<hash>.json e scaricati solo dalla TV
// regista (REGIA.kit). Nella pagina va solo l'indice senza trame né soluzioni. Formato: docs/GIALLI.md
const GIALLO = require('../src/js/motori/36-giallo.js'), SERATA = require('../src/js/motori/36a-serata.js'), KITC = require('../src/js/motori/36b-kit-cifrati.js'), kitDir = path.join(root, 'src/kit'), kit = {};
// assets/kit/<id>/: ritratti/<personaggio|vittima>.webp, luoghi/<luogo>.webp, oggetti/<indizio>.webp, copertina.webp, titoli.woff2.
// Un nome che non corrisponde a niente nel kit ferma il build (di solito è un errore di battitura). Formati: docs/GIALLI-SCENA.md
function mediaKit(k) {
  const dir = path.join(root, 'assets/kit', k.id), url = (...p) => '/assets/kit/' + [k.id, ...p].join('/'), m = { ritratti: {}, luoghi: {}, oggetti: {} };
  if (!fs.existsSync(dir)) return m;
  const validi = {
    ritratti: new Set(k.personaggi.map(p => p.id).concat('vittima')),
    luoghi: new Set((k.luoghi || []).map(l => l.id)),
    // serata (formato grande): le immagini degli oggetti sono quelle delle prove
    oggetti: new Set(k.formato === 'serata' ? k.prove.map(x => x.id) : k.atti.flatMap(a => a.indizi.map(x => x.id))),
  };
  const PESO = { ritratti: 160, luoghi: 400, oggetti: 120 };
  for (const t of Object.keys(validi)) {
    const d = path.join(dir, t);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      const id = f.replace(/\.webp$/, '');
      if (!f.endsWith('.webp') || !validi[t].has(id)) throw new Error(`assets/kit/${k.id}/${t}/${f}: non corrisponde a niente nel kit (attesi: ${[...validi[t]].join(', ')}.webp)`);
      const kb = fs.statSync(path.join(d, f)).size / 1024;
      if (kb > PESO[t]) console.warn(`avviso: assets/kit/${k.id}/${t}/${f} pesa ${kb.toFixed(0)} KB (consigliati al massimo ${PESO[t]})`);
      m[t][id] = url(t, f);
    }
  }
  if (fs.existsSync(path.join(dir, 'copertina.webp'))) m.copertina = url('copertina.webp');
  if (fs.existsSync(path.join(dir, 'titoli.woff2'))) m.font = url('titoli.woff2');
  return m;
}
fs.rmSync(path.join(root, 'dist/kit'), { recursive: true, force: true });
fs.mkdirSync(path.join(root, 'dist/kit'), { recursive: true });
for (const n of fs.existsSync(kitDir) ? fs.readdirSync(kitDir).filter(n => n.endsWith('.json')).sort() : []) {
  const testo = fs.readFileSync(path.join(kitDir, n), 'utf8'), k = JSON.parse(testo), err = (k.formato === 'serata' ? SERATA : GIALLO).valida(k);
  if (err.length) throw new Error(`kit ${n} non valido: ${err.join('; ')}`);
  if (k.id + '.json' !== n) throw new Error(`kit ${n}: il nome del file deve essere uguale all'id (${k.id})`);
  // immagini e font del kit (assets/kit/<id>/, copiati in dist/assets da sotto): nel file del kit va l'elenco di ciò che c'è
  k.media = mediaKit(k);
  const src = JSON.stringify(k);
  const file = `${k.id}.${require('crypto').createHash('sha1').update(src).digest('hex').slice(0, 10)}.json`;
  fs.writeFileSync(path.join(root, 'dist/kit', file), src);
  kit[k.id] = { copertina: k.media.copertina || '', font: k.media.font || '', titolo: k.titolo, sottotitolo: k.sottotitolo || '', giocatori: k.giocatori, minuti: k.minuti, tono: k.tono || '', formato: k.formato || '', url: '/kit/' + file };
}
// kit segreti (src/kit-cifrati/<id>.json, cifrati con tools/kit/cifrati.js): il build non ha la frase, controlla solo la busta;
// il contenuto lo valida la TV quando lo apre (e tests/test_kit_cifrati.js con KIT_FRASE). Nell'indice compaiono come serate.
const cifDir = path.join(root, 'src/kit-cifrati');
for (const n of fs.existsSync(cifDir) ? fs.readdirSync(cifDir).filter(n => n.endsWith('.json')).sort() : []) {
  const src = fs.readFileSync(path.join(cifDir, n), 'utf8'), b = JSON.parse(src), err = KITC.valida(b);
  if (err.length) throw new Error(`kit cifrato ${n} non valido: ${err.join('; ')}`);
  if (b.id + '.json' !== n) throw new Error(`kit cifrato ${n}: il nome del file deve essere uguale all'id (${b.id})`);
  if (kit[b.id]) throw new Error(`kit cifrato ${n}: l'id ${b.id} esiste già tra i kit in chiaro`);
  const file = `${b.id}.${require('crypto').createHash('sha1').update(src).digest('hex').slice(0, 10)}.json`;
  fs.writeFileSync(path.join(root, 'dist/kit', file), src);
  kit[b.id] = { copertina: '', font: '', titolo: b.titolo, sottotitolo: b.sottotitolo || '', giocatori: b.giocatori, minuti: b.minuti || 0, tono: b.tono || '', formato: 'serata', cifrato: true, url: '/kit/' + file };
}
if (!/\/\*KIT\*\/\s*\{\}/.test(html)) throw new Error('segnaposto /*KIT*/{} non trovato (app/24u-regia.js)');
html = html.replace(/\/\*KIT\*\/\s*\{\}/, JSON.stringify(kit));
// capitoli dell'Avventura (src/avventura/*.json): validati dal racconto (scene raggiungibili, niente vicoli ciechi, riferimenti esistenti), scritti a parte in
// dist/avventura/<id>.<hash>.json e scaricati solo quando servono. Nella pagina va l'indice (titolo e indirizzo). Formato: docs/AVVENTURA-A7.md
const ARAC = require('../src/js/motori/27q-avv-racconto.js'), capDir = path.join(root, 'src/avventura'), capitoli = {};
fs.rmSync(path.join(root, 'dist/avventura'), { recursive: true, force: true });
fs.mkdirSync(path.join(root, 'dist/avventura'), { recursive: true });
for (const n of fs.existsSync(capDir) ? fs.readdirSync(capDir).filter(n => n.endsWith('.json')).sort() : []) {
  const c = JSON.parse(fs.readFileSync(path.join(capDir, n), 'utf8')), err = ARAC.valida(c);
  if (err.length) throw new Error(`capitolo ${n} non valido: ${err.join('; ')}`);
  if (c.id + '.json' !== n) throw new Error(`capitolo ${n}: il nome del file deve essere uguale all'id (${c.id})`);
  const src = JSON.stringify(c), file = `${c.id}.${require('crypto').createHash('sha1').update(src).digest('hex').slice(0, 10)}.json`;
  fs.writeFileSync(path.join(root, 'dist/avventura', file), src);
  capitoli[c.id] = { titolo: c.titolo, sottotitolo: c.sottotitolo || '', url: '/avventura/' + file };
}
if (!/\/\*CAPITOLI\*\/\s*\{\}/.test(html)) throw new Error('segnaposto /*CAPITOLI*/{} non trovato (app/24hi-dialogo.js)');
html = html.replace(/\/\*CAPITOLI\*\/\s*\{\}/, JSON.stringify(capitoli));
// carte con illustrazione in assets/cards/<ID>.webp (es. JH, QS, KC, X): usate al posto del disegno vettoriale
const cardsDir = path.join(root, 'assets/cards');
const imgs = fs.existsSync(cardsDir) ? fs.readdirSync(cardsDir).filter(n => /^[JQKX][HDCS]?\.webp$/.test(n)).map(n => n.replace('.webp', '')) : [];
html = html.replace('/*FZIMG*/[]', JSON.stringify(imgs));
// copertine dei giochi in assets/copertine/<id>.webp (480x640): scatole 3D della locanda e pagina Giochi; senza file resta il disegno a codice
const copDir = path.join(root, 'assets/copertine');
const cops = fs.existsSync(copDir) ? fs.readdirSync(copDir).filter(n => /^[a-z0-9]+\.webp$/.test(n)).map(n => n.replace('.webp', '')) : [];
if (!html.includes('/*COPIMG*/[]')) throw new Error('segnaposto /*COPIMG*/[] non trovato (app/07-nucleo.js)');
html = html.replace('/*COPIMG*/[]', JSON.stringify(cops));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
// asset statici (immagini, audio) copiati così come sono
const assets = path.join(root, 'assets');
if (fs.existsSync(assets)) fs.cpSync(assets, path.join(root, 'dist/assets'), { recursive: true });
// PWA: manifest, icone e service worker nella radice (il service worker deve stare in /). __BUILD__ = hash della pagina.
const pwa = path.join(root, 'src/pwa');
if (fs.existsSync(pwa)) {
  const id = require('crypto').createHash('sha1').update(html).digest('hex').slice(0, 10);
  const urlVendor = JSON.stringify(Object.values(vendor));
  for (const n of fs.readdirSync(pwa)) {
    // niente eseguibili in dist: il piano Spark di Hosting rifiuta l'intero deploy (l'APK sta nella release `android`, docs/ANDROID.md)
    if (/\.(apk|aab|exe|dll|ipa|msi|bat|com|jar)$/i.test(n)) { console.warn(`build: salto ${n} (eseguibile, vietato su Firebase Hosting)`); continue; }
    const dst = path.join(root, 'dist', n);
    if (n === 'sw.js') fs.writeFileSync(dst, fs.readFileSync(path.join(pwa, n), 'utf8').split('__BUILD__').join(id).split('/*VENDOR*/[]').join(urlVendor));
    else fs.copyFileSync(path.join(pwa, n), dst);
  }
  // l'app Android (docs/ANDROID.md) cerca il file qui: una riscrittura non basta, Hosting risponde [] da solo
  fs.mkdirSync(path.join(root, 'dist/.well-known'), { recursive: true });
  fs.copyFileSync(path.join(pwa, 'assetlinks.json'), path.join(root, 'dist/.well-known/assetlinks.json'));
}
console.log(`dist/index.html: ${(html.length / 1024).toFixed(0)} KB da ${manifest.length} file; vendor: ${Object.values(vendor).join(' ')}; kit: ${Object.keys(kit).join(' ') || 'nessuno'}`);
