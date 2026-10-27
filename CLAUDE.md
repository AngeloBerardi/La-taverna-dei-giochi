# La Taverna dei Giochi

Hub di giochi multiplayer per telefono (mobile-first, 390 px), UI in italiano. Hosting: Firebase Hosting (`firebase.json`, cartella `dist/`), pubblica da `main`; dettagli in `docs/HOSTING.md`. Una sola pagina, nessuna dipendenza.

## Comandi (da lanciare, non da reinventare)
| Comando | Cosa fa |
|---|---|
| `npm run verifica` | build + sintassi + struttura + test rapidi (~25 s): **prima di ogni commit** |
| `npm test -- catan uno` | solo i test il cui nome contiene quelle parole (in parallelo) |
| `npm run test:rapido` / `npm test` | senza i test lenti / tutti (~1,5 min) |
| `npm run test:browser` | prove in Chromium headless con Firebase simulato (PWA, profilo, premi…): `tools/test-browser/` |
| `npm run regole` | riscrive in `firestore.rules` i prezzi della bottega dal catalogo (`-- --controlla` per verificare) |
| `npm run check` | build + sintassi (è il controllo di `node scripts/check.js` prima del deploy) |
| `npm run struttura` | file fuori manifest, CSS copiato, righe troppo lunghe |
| `npm run mappa` | rigenera la mappa dei moduli in `docs/ARCHITECTURE.md` |

## Dove si mette mano (cerca con `grep -n`, poi leggi solo il pezzo con offset/limit)
| Compito | File |
|---|---|
| Regole di un gioco (logica) | `src/js/motori/NN-nome.js` + `tests/test_nome.js` |
| Aspetto di un gioco | `src/js/app/…-nome.js` (vista) + `src/css/NN-nome.css` |
| Testo delle regole in-game | `src/js/app/07d-regole.js` (fonte: `docs/rules/nome.md`) |
| Elenco giochi, stato globale | `src/js/app/07-nucleo.js` (`GAMES`, `ui`, `G`, `R`) |
| Azioni dei bottoni (`data-a`) | `src/js/app/07c-comandi.js` (un solo `switch`) |
| Rete, stanze | `src/js/app/07a-rete-stanza.js` (avvio e riprova), `24m-rete-rtdb.js` (unico trasporto). Mosse atomiche: `motori/35-sync.js` + `tests/test_sync.js`. p2p solo per prove: `09-rete-p2p.js`, `08-relay-mqtt.js` |
| Stanze live sul database (`R.mode='rt'`, presenza, nessun host) | `app/24m-rete-rtdb.js` (`RT`), regole `database.rules.json`, scenario `stanze_database` in `tools/test-browser/` |
| Lobby 3D | **`tools/taverna3d/`** poi `python3 tools/taverna3d/mk.py` (non toccare `app/12c-lobby-3d.js`, è generato) |
| Lobby falò / sala | `src/js/app/07e-lobby-falo.js`, `12b-lobby-diorama.js` (falò, unica lobby di ripiego) |
| App installabile, offline, notifiche push | `src/pwa/` (`sw.js`, manifest, icone: `python3 tools/pwa/mk-icone.py`), `src/js/app/24-pwa.js` |
| Profilo online, monete (Firebase) | `src/js/app/24a-firebase.js`, regole in `firestore.rules`, piano in `docs/FIREBASE-PIANO.md` |
| Bottega, cosmetici, prezzi | catalogo `src/js/motori/22-bottega.js` (unica fonte), `app/24b-bottega.js`, `css/33-dorsi.css`; dopo aver cambiato i prezzi: `npm run regole` e ripubblica `firestore.rules` |
| Account (email), classifica, ELO | `app/24c-account.js` (modale), `app/24a-firebase.js` (FB.collega/entra/top, ELO in `award`), regole del punteggio `motori/23-elo.js` (+ `tests/test_elo.js`); nuovo gioco ⇒ `npm run regole` |
| Locandiere (NPC) | copioni `motori/24-locandiere.js` (+ `tests/test_locandiere.js`), finestra `app/24d-locandiere.js` |
| Partite a distanza (a turni, anche a giorni) | `app/24e-distanza.js` (`FsDb` = `R.db` su Firestore, `Dist` = elenco/inviti), dati puri `motori/25-distanza.js` (+ `tests/test_distanza.js`), regole `partite` in `firestore.rules` |
| Schermo comune (TV/PC, `?tv=CODICE`), codice QR | `app/24f-schermo.js` (`TV`), `css/37-schermo.css`, generatore `motori/26-qr.js` (+ `tests/test_qr.js`, lettura vera con OpenCV) |
| Regia della TV, segreti per giocatore (cene con delitto) | motore `motori/36-giallo.js` (+ `tests/test_giallo.js`), kit `src/kit/*.json`, viste e regista `app/24v-giallo.js` (`GIA`) + `css/45-giallo.css`, messa in scena comune `app/24w-scena.js` (`SCENA`, guida `docs/GIALLI-SCENA.md`, direzione artistica `docs/kit/<id>.md`, immagini `assets/kit/<id>/` con `tools/kit/prepara-immagini.py`), `app/24u-regia.js` (`REGIA`), regole `regia`/`segreti`/`azioni` in `database.rules.json`, `tests/test_regia.js`, piano in `docs/GIALLI.md` |
| Eroi (creazione del personaggio, legati all'account) | motore `motori/27-eroi.js` (+ `tests/test_eroi.js`), vista `app/24g-eroi.js`, `css/38-eroi.css`, regole `eroi` in `firestore.rules` (generate: `npm run regole`) |
| Campagne (mappa a esagoni, perdizione, prove) | motore `motori/28-campagna.js` (+ `tests/test_campagna.js`), anteprima `app/24h-campagna.js`, `css/39-campagna.css`, piano in `docs/CAMPAGNE.md` |
| Stile unico (legno e ottone), barra in basso a 5 destinazioni, icone | `css/40-legno-ottone.css`, `app/24i-plancia.js` (`Plancia`), icone SVG `app/01b-icone.js` (`ic('nome')`; niente emoji nell'interfaccia) |
| Nuovo gioco | comando `/nuovo-gioco` |

Mappa completa dei moduli e contratti: `docs/ARCHITECTURE.md`. Stile e HUD: `docs/STYLE.md`. Cartelle con regole proprie: vedi il `CLAUDE.md` dentro `src/css/`, `src/js/app/`, `src/js/motori/`, `tests/`, `tools/taverna3d/`.

## Build
- `src/manifest.json` è l'elenco **ordinato** dei file: `scripts/build.js` li concatena in `dist/index.html`. L'ordine è il cascade del CSS e l'ordine di definizione del JS. Un file nuovo va nel manifest nella posizione giusta, altrimenti non esiste in `dist` (`npm run struttura` lo segnala).
- Il numero nel nome del file segue l'ordine di caricamento (prefisso `07a`, `22b`… per i derivati). Se sposti un file nel manifest, rinominalo di conseguenza.
- Le librerie in `src/js/vendor/` (three.js, PeerJS) non entrano in `dist/index.html`: il build le scrive in `dist/vendor/<nome>.<hash>.js` e `VENDOR.load('three'|'peerjs')` (`app/01a-vendor.js`) le carica solo quando servono; il service worker le tiene in una cache a parte. Una nuova libreria: nome in `scripts/build.js` (`NOMI`) e controllo in `PRONTO` di `01a-vendor.js`.
- Mai aprire `dist/` né `src/js/vendor/` (bloccati in `.claude/settings.json`).

## Ruoli (agenti in `.claude/agents/`)
`game-hud-designer` (stile e HUD, scrive solo docs/mockup), `programmer` (codice e test), `artist` (asset e animazioni), `rules-scout` (ricerca giochi e regole). Si passano file, mai testo lungo: leggi la scheda che ti serve, scrivi il risultato in un file, rispondi con meno di 150 parole e i percorsi toccati.

## Git
- Mai lavorare su `main`. Rami: `design/…`, `art/…`, `rules/…`, `feat/…`, `fix/…`. Commit piccoli, messaggio in italiano all'imperativo breve.
- Push del proprio ramo; l'unione in `main` la fa l'orchestratore dopo l'verifica approvata dall'utente.
- Un solo push alla volta (il proxy git limita le operazioni concorrenti). Prima di pushare: `git fetch origin main` e rebase.

## Risparmio di token (regole)
- Mai leggere un file intero se serve un pezzo: `grep -n` e poi lettura con offset/limit. Prima il modulo giusto (tabella sopra), non l'intero progetto.
- Test mirati (`npm test -- nome`), non la suite intera, finché lavori su un solo gioco.
- Screenshot solo a fine lavoro, a 390 px, una volta. Per il resto test automatici (motori: simulazioni in node).
- Ricerca web: query mirate, si registrano solo i fatti utili nella scheda, con link alla fonte.
- Non duplicare CSS o testi tra file: una regola vive in un solo posto (`npm run struttura` blocca i blocchi copiati).

## Decisioni dell'utente (vincolanti)
- Niente effetto olografico/foil sulle carte.
- Grafica originale: ispirarsi a titoli famosi per HUD e atmosfera, ma niente illustrazioni, nomi, loghi o testi di regole copiati. Le regole (meccaniche) non sono protette, il testo e l'arte sì.
- **Mai nomi di marchi** (repo e sito sono pubblici): nessun titolo di gioco commerciale (Catan, Uno, Azul…), di sue espansioni o di sue parole chiave (es. il grido «UNO») nei testi visibili. Ogni gioco ha un nome nostro, generico o inventato, in `GAMES` (`07-nucleo.js`); le viste lo leggono con `GN(id)`, mai scritto a mano. Gli `id` interni e i nomi dei file possono restare. Giochi tradizionali (Briscola, Scopa, Burraco, Machiavelli) vanno bene.
- Stile: la lobby di base è la Taverna 3D (ingresso, locanda, boschetto; sorgenti in `tools/taverna3d/`), con il falò pixel-art come modalità semplice per i telefoni senza 3D; carte figura dipinte per Regicide, 3D dove sensato. Dettagli in `docs/STYLE.md`.
- Ogni gioco ha: schede regole in-game, musica propria, suoni, vista dedicata, test del motore (bot intelligente vince, bot casuale perde).
