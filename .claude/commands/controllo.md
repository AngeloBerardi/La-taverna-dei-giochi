---
description: Controlla la PR di un passo al livello scritto nel passo e lascia il verdetto come commento sulla PR
---
Passo `$ARGUMENTS`: due cifre.

1. Leggi il file `docs/passi/$ARGUMENTS-*.md` (campo `controllo:`, «Prove» e «Fatto quando») e, in `docs/passi/LEGGIMI.md`, le sezioni «Regole d'oro» e «Controlli». Nient'altro del progetto.
2. Trova la PR aperta del ramo `passo/$ARGUMENTS-…`: `gh api "repos/AngeloBerardi/La-taverna-dei-giochi/pulls?state=open&per_page=100" --jq '.[] | select(.head.ref|startswith("passo/$ARGUMENTS-")) | "\(.number) \(.head.ref)"'`. Poi `git fetch origin <ramo>`, `git checkout FETCH_HEAD`, `git diff --stat origin/main...HEAD` e leggi i file del diff uno per volta.
3. Controlla al livello del passo, come dice la tabella «Controlli»:
   - **leggero**: lista di controllo sul diff;
   - **forte**: rilancia `npm test -- p$ARGUMENTS`, `node tools/avventura/impronta.js --controlla` e `node tools/passi/controlla.js --diff $ARGUMENTS`;
   - **visivo**: `npm run build && SCHERMATE_DIR=/tmp/c$ARGUMENTS python3 tools/test-browser/run.py p$ARGUMENTS` e guarda al massimo 3 screenshot.
4. Scrivi il verdetto come commento sulla PR (`gh api repos/AngeloBerardi/La-taverna-dei-giochi/issues/<N>/comments -f body=…`):
   - prima riga: «Controllo passo $ARGUMENTS (<livello>, <modello>): **APPROVATO**», oppure «… **DA CORREGGERE**»;
   - poi al massimo 8 rilievi nella forma `file:riga — perché — come rimediare`, dai gravi ai lievi.

   Non correggere il codice e non scrivere file.
5. Rispondi in meno di 60 parole: verdetto e numero di rilievi.
