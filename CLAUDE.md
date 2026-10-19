# La Taverna dei Giochi

Hub di giochi multiplayer per telefono (mobile-first, 390 px), UI in italiano. Hosting: Netlify, pubblica da `main` (`netlify.toml`: `node scripts/check.js`, cartella `dist/`). Una sola pagina, nessuna dipendenza.

## Comandi (da lanciare, non da reinventare)
| Comando | Cosa fa |
|---|---|
| `npm run verifica` | build + sintassi + struttura + test rapidi (~25 s): **prima di ogni commit** |
| `npm test -- catan uno` | solo i test il cui nome contiene quelle parole (in parallelo) |
| `npm run test:rapido` / `npm test` | senza i test lenti / tutti (~1,5 min) |
| `npm run test:browser` | prove in Chromium headless con Firebase simulato (PWA, profilo, premi…): `tools/test-browser/` |
| `npm run regole` | riscrive in `firestore.rules` i prezzi della bottega dal catalogo (`-- --controlla` per verificare) |
| `npm run check` | build + sintassi (è ciò che esegue Netlify) |
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
| Rete, stanze, p2p | `src/js/app/07a-rete-stanza.js`, `09-rete-p2p.js`, `08-relay-mqtt.js` |
| Lobby 3D | **`tools/taverna3d/`** poi `python3 tools/taverna3d/mk.py` (non toccare `app/12c-lobby-3d.js`, è generato) |
| Lobby falò / sala | `src/js/app/07e-lobby-falo.js`, `12-sala-hall.js`, `12b-lobby-diorama.js` |
| App installabile, offline, notifiche push | `src/pwa/` (`sw.js`, manifest, icone: `python3 tools/pwa/mk-icone.py`), `src/js/app/24-pwa.js` |
| Profilo online, monete (Firebase) | `src/js/app/24a-firebase.js`, regole in `firestore.rules`, piano in `docs/FIREBASE-PIANO.md` |
| Bottega, cosmetici, prezzi | catalogo `src/js/motori/22-bottega.js` (unica fonte), `app/24b-bottega.js`, `css/33-dorsi.css`; dopo aver cambiato i prezzi: `npm run regole` e ripubblica `firestore.rules` |
| Nuovo gioco | comando `/nuovo-gioco` |

Mappa completa dei moduli e contratti: `docs/ARCHITECTURE.md`. Stile e HUD: `docs/STYLE.md`. Cartelle con regole proprie: vedi il `CLAUDE.md` dentro `src/css/`, `src/js/app/`, `src/js/motori/`, `tests/`, `tools/taverna3d/`.

## Build
- `src/manifest.json` è l'elenco **ordinato** dei file: `scripts/build.js` li concatena in `dist/index.html`. L'ordine è il cascade del CSS e l'ordine di definizione del JS. Un file nuovo va nel manifest nella posizione giusta, altrimenti non esiste in `dist` (`npm run struttura` lo segnala).
- Il numero nel nome del file segue l'ordine di caricamento (prefisso `07a`, `22b`… per i derivati). Se sposti un file nel manifest, rinominalo di conseguenza.
- Mai aprire `dist/` né `src/js/vendor/` (bloccati in `.claude/settings.json`).

## Ruoli (agenti in `.claude/agents/`)
`game-hud-designer` (stile e HUD, scrive solo docs/mockup), `programmer` (codice e test), `artist` (asset e animazioni), `rules-scout` (ricerca giochi e regole). Si passano file, mai testo lungo: leggi la scheda che ti serve, scrivi il risultato in un file, rispondi con meno di 150 parole e i percorsi toccati.

## Git
- Mai lavorare su `main`. Rami: `design/…`, `art/…`, `rules/…`, `feat/…`, `fix/…`. Commit piccoli, messaggio in italiano all'imperativo breve.
- Push del proprio ramo; l'unione in `main` la fa l'orchestratore dopo l'anteprima Netlify approvata dall'utente.
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
- Stile: la lobby di base è la Taverna 3D (ingresso, locanda, boschetto; sorgenti in `tools/taverna3d/`), con il falò pixel-art come modalità semplice per i telefoni senza 3D; carte figura dipinte per Regicide, 3D dove sensato. Dettagli in `docs/STYLE.md`.
- Ogni gioco ha: schede regole in-game, musica propria, suoni, vista dedicata, test del motore (bot intelligente vince, bot casuale perde).
