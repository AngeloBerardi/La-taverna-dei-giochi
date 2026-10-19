---
description: Aggiunge un gioco all'hub seguendo il contratto (motore, test, vista, regole, suoni, manifest)
argument-hint: nome del gioco
---
Aggiungi il gioco "$ARGUMENTS" alla Taverna. Lavora su un ramo `feat/gioco-<nome>` e leggi solo ciò che serve.

1. Scheda regole: `docs/rules/<nome>.md` da `docs/rules/TEMPLATE.md` (meccaniche in parole nostre, niente testi copiati).
2. Motore: `src/js/motori/NN-<nome>.js` (puro, `newGame`/`act`, vedi `src/js/motori/CLAUDE.md`) e `tests/test_<nome>.js` con bot intelligente che vince e bot casuale che perde. `npm test -- <nome>`.
3. Registrazione: `GAMES.push` in `src/js/app/07-nucleo.js`; testo in `src/js/app/07d-regole.js`.
4. Vista: `src/js/app/22x-<nome>.js` con `<nome>H()`, `<nome>Click()`, `<NOME>FX`; registra `VIEW`/`FX`/`gameClick` in `app/23-registri-briscola-scopa-burraco.js`; traccia in `Snd` (`app/03-audio.js`).
5. Stile: `src/css/NN-<nome>.css` (posizione e numero giusti nel cascade, prima di `30-adatta`).
6. Manifest: aggiungi i file nuovi in `src/manifest.json` nella posizione giusta.
7. `npm run verifica`; un solo screenshot a 390 px della vista; commit piccoli; riga nel README e `npm run mappa`.
Rispondi con meno di 150 parole: file toccati, test, rischi.
