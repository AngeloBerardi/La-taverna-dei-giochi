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
| Nuovo gioco | comando `/nuovo-gioco` |
| Eseguire una scheda di lavoro | comando `/scheda <id>` (schede in `docs/schede/`, flusso e modelli in `docs/LAVORO.md`) |

### Schede per area (**leggi solo quella che ti serve**, mai tutte)
| Area | Scheda |
|---|---|
| Rete e stanze, lobby 3D e falò, PWA, Firebase, bottega, account ed ELO, Locandiere, partite a distanza, schermo comune e TV, eroi, stile legno e ottone, crocevia, isola, HUD comune | `docs/moduli/taverna.md` |
| Cene con delitto: regia, segreti, serata in famiglie, kit cifrati | `docs/moduli/gialli.md` |
| Avventura a capitoli: campagna, mondo, battaglia a turni, racconto, sessione, audio, co-op, 3D, difficoltà (A0–A13) | `docs/moduli/avventura.md` |
| Avventura in tempo reale e resa pixel (B1–B6.5) | `docs/moduli/avventura-tempo.md` |
| Compagnia di ventura: mondo libero, battaglie campali, zaino, co-op (piano C) | `docs/moduli/ventura.md` |

Mappa completa dei moduli e contratti: `docs/ARCHITECTURE.md`. Stile e HUD: `docs/STYLE.md`. Cartelle con regole proprie: vedi il `CLAUDE.md` dentro `src/css/`, `src/js/app/`, `src/js/motori/`, `tests/`, `tools/taverna3d/`.

## Build
- `src/manifest.json` è l'elenco **ordinato** dei file: `scripts/build.js` li concatena in `dist/index.html`. L'ordine è il cascade del CSS e l'ordine di definizione del JS. Un file nuovo va nel manifest nella posizione giusta, altrimenti non esiste in `dist` (`npm run struttura` lo segnala).
- Il numero nel nome del file segue l'ordine di caricamento (prefisso `07a`, `22b`… per i derivati). Se sposti un file nel manifest, rinominalo di conseguenza.
- Le librerie in `src/js/vendor/` (three.js, PeerJS) non entrano in `dist/index.html`: il build le scrive in `dist/vendor/<nome>.<hash>.js` e `VENDOR.load('three'|'peerjs')` (`app/01a-vendor.js`) le carica solo quando servono; il service worker le tiene in una cache a parte. Una nuova libreria: nome in `scripts/build.js` (`NOMI`) e controllo in `PRONTO` di `01a-vendor.js`.
- Mai aprire `dist/` né `src/js/vendor/` (bloccati in `.claude/settings.json`).

## Ruoli (agenti in `.claude/agents/`)
`architetto` (progetta e scrive la scheda, non codice), `programmer` (codice e test dalla scheda), `artist` (asset e animazioni), `game-hud-designer` (stile e HUD, scrive solo docs/mockup), `rules-scout` (ricerca giochi e regole), `revisore` (legge solo il diff). Il modello di ognuno è fissato nella sua scheda. Si passano file, mai testo lungo: leggi la scheda che ti serve, scrivi il risultato in un file, rispondi con meno di 150 parole e i percorsi toccati.

## Git
- Mai lavorare su `main`. Rami: `design/…`, `art/…`, `rules/…`, `feat/…`, `fix/…`. Commit piccoli, messaggio in italiano all'imperativo breve.
- Push del proprio ramo; l'unione in `main` la fa l'orchestratore dopo l'verifica approvata dall'utente.
- Un solo push alla volta (il proxy git limita le operazioni concorrenti). Prima di pushare: `git fetch origin main` e rebase.

## Risparmio di token (regole)
- Questo file resta corto: i dettagli di un'area vanno nella sua scheda in `docs/moduli/`, non qui (`npm run struttura` avvisa oltre 9000 caratteri).
- Un lavoro = una scheda in `docs/schede/` = una sessione nuova = una PR. Chi progetta e chi esegue: `docs/LAVORO.md`.
- Mai leggere un file intero se serve un pezzo: `grep -n` e poi lettura con offset/limit. Prima il modulo giusto (tabella sopra), non l'intero progetto.
- Test mirati (`npm test -- nome`), non la suite intera, finché lavori su un solo gioco.
- Screenshot solo a fine lavoro, a 390 px, una volta. Per il resto test automatici (motori: simulazioni in node).
- Ricerca web: query mirate, si registrano solo i fatti utili nella scheda, con link alla fonte.
- Non duplicare CSS o testi tra file: una regola vive in un solo posto (`npm run struttura` blocca i blocchi copiati).

## Decisioni dell'utente (vincolanti)
- Niente effetto olografico/foil sulle carte.
- **Il più fedele possibile all'originale:** ogni gioco deve somigliare al gioco vero per tavolo e plancia, disposizione dei componenti, forma e proporzioni delle carte, palette, iconografia di valori e semi, stile di illustrazione (piatto, acquerello, pixel art…). Le illustrazioni sono disegnate da noi nello stesso stile: niente figure, loghi o testi copiati. Prima di disegnare o ridisegnare un gioco: cerca foto del gioco vero e scrivi nella sua scheda `docs/rules/<gioco>.md` la sezione «Riferimento visivo» (componenti, colori, layout, stile; link alle foto, non copie). Esempio: `docs/rules/regicide-legacy.md`.
- Grafica originale: ispirarsi a titoli famosi per HUD e atmosfera, ma niente illustrazioni, nomi, loghi o testi di regole copiati. Le regole (meccaniche) non sono protette, il testo e l'arte sì.
- **Mai nomi di marchi** (repo e sito sono pubblici): nessun titolo di gioco commerciale (Catan, Uno, Azul…), di sue espansioni o di sue parole chiave (es. il grido «UNO») nei testi visibili. Ogni gioco ha un nome nostro che faccia capire subito di che gioco si tratta (parole comuni, titolo tradotto in modo libero, nome tradizionale del genere) senza essere il marchio, in `GAMES` (`07-nucleo.js`); le viste lo leggono con `GN(id)`, mai scritto a mano. Gli `id` interni e i nomi dei file possono restare. Giochi tradizionali (Briscola, Scopa, Burraco, Machiavelli) vanno bene.
- Stile: la lobby di base è la Taverna 3D (ingresso, locanda, boschetto; sorgenti in `tools/taverna3d/`), con il falò pixel-art come modalità semplice per i telefoni senza 3D; carte figura dipinte per Regicide, 3D dove sensato. Dettagli in `docs/STYLE.md`.
- Ogni gioco ha: schede regole in-game, musica propria, suoni, vista dedicata, test del motore (bot intelligente vince, bot casuale perde).
