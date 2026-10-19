# Motori di gioco (`src/js/motori/`)

Regole pure, senza DOM né rete: una costante globale per gioco (`UNO`, `CATAN`…), `module.exports` solo se esiste.
- API: `newGame(n, names, opts)` e `act(state, action)` → `{s}` oppure `{err}` (testo italiano). Stato JSON-clonabile con `n, names, hands, cur, log, ev, evn, over`.
- Numero nel nome = ordine nel manifest (`10-coda`, `09-peerjs`… sono parti condivise: non rinominare a caso).
- Ogni motore ha `tests/test_<nome>.js` (si carica con `tests/carica.js`). Lancia solo quello: `npm test -- nome`.
- Nessun motore legge `ui`, `G`, `R` o altro dell'app. Se serve, passalo come parametro.
- Contratto completo: `docs/ARCHITECTURE.md` → "Contratto di un motore".
