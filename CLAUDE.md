# La Taverna dei Giochi

Hub di giochi multiplayer per telefono (mobile-first, 390 px), UI in italiano. Hosting: Netlify, pubblica da `main` (`netlify.toml`: `node scripts/check.js`, cartella `dist/`).

## Struttura
- `src/manifest.json`: elenco ordinato dei file; `scripts/build.js` li concatena in `dist/index.html` (una sola pagina, nessuna dipendenza). Un file nuovo va aggiunto al manifest nella posizione giusta.
- `src/css/`, `src/js/motori/` (regole dei giochi, pure e testabili), `src/js/app/` (viste, rete, audio, effetti), `src/js/vendor/` (PeerJS, non toccare).
- `src/js/app/07*.js` è il nucleo dell'app diviso per compiti (stato, rete, partita, comandi, viste, lobby): vedi ARCHITECTURE.md. `src/js/app/12c-lobby-3d.js` è generato da `tools/taverna3d/` con `python3 tools/taverna3d/mk.py`: non si modifica a mano.
- `docs/ARCHITECTURE.md` mappa dei moduli e contratti; `docs/STYLE.md` guida di stile e HUD; `docs/GAMES-BACKLOG.md` giochi candidati; `docs/rules/` schede regole.
- `npm run check` = build + sintassi. Va lanciato prima di ogni push.

## Ruoli (agenti in `.claude/agents/`)
`game-hud-designer` (stile e HUD, scrive solo docs/mockup), `programmer` (codice e test), `artist` (asset e animazioni), `rules-scout` (ricerca giochi e regole). Si passano file, mai testo lungo: leggi la scheda che ti serve, scrivi il risultato in un file, rispondi con meno di 150 parole e i percorsi toccati.

## Git
- Mai lavorare su `main`. Rami: `design/…`, `art/…`, `rules/…`, `feat/…`, `fix/…`. Commit piccoli, messaggio in italiano all'imperativo breve.
- Push del proprio ramo; l'unione in `main` la fa l'orchestratore dopo l'anteprima Netlify approvata dall'utente.
- Un solo push alla volta (il proxy git limita le operazioni concorrenti). Prima di pushare: `git fetch origin main` e rebase.

## Risparmio di token (regole)
- Mai leggere un file intero se serve un pezzo: `grep -n` e poi lettura con offset/limit. Mai aprire `dist/` né `src/js/vendor/`.
- Prima il modulo giusto (vedi ARCHITECTURE.md), non l'intero progetto.
- Screenshot solo a fine lavoro, a 390 px, una volta. Per il resto test automatici (motori: simulazioni in node).
- Ricerca web: query mirate, si registrano solo i fatti utili nella scheda, con link alla fonte.

## Decisioni dell'utente (vincolanti)
- Niente effetto olografico/foil sulle carte.
- Grafica originale: ispirarsi a titoli famosi per HUD e atmosfera, ma niente illustrazioni, nomi, loghi o testi di regole copiati. Le regole (meccaniche) non sono protette, il testo e l'arte sì.
- Stile: la lobby di base è la Taverna 3D (ingresso, locanda, boschetto; sorgenti in `tools/taverna3d/`), con il falò pixel-art come modalità semplice per i telefoni senza 3D; carte figura dipinte per Regicide, 3D dove sensato. Dettagli in `docs/STYLE.md`.
- Ogni gioco ha: schede regole in-game, musica propria, suoni, vista dedicata, test del motore (bot intelligente vince, bot casuale perde).
