---
description: Esegue una scheda di lavoro (docs/schede/<id>.md) dall'inizio alla PR
---
Scheda: `docs/schede/$ARGUMENTS.md`.

1. Leggi la scheda e la scheda dell'area che nomina in `docs/moduli/`. Nient'altro finché la scheda non ti manda a un file.
2. Ramo `feat/<id>-…` da `origin/main` aggiornato.
3. Segui i «Passi» in ordine. Motori prima, con il loro test (`npm test -- <nome>`); poi viste; poi lo scenario browser della scheda.
4. Prima di ogni commit `npm run verifica`. Commit piccoli, in italiano.
5. Se la scheda tocca la grafica: uno screenshot a 390 px a fine lavoro, uno solo.
6. Aggiorna la riga dell'area in `docs/moduli/` e le regole in-game se la scheda lo chiede; `npm run mappa`.
7. Fai rileggere il diff all'agente `revisore`; correggi i rilievi gravi.
8. `git fetch origin main`, rebase, push, PR via `gh api repos/AngeloBerardi/La-taverna-dei-giochi/pulls`. Nella PR: «Fatto quando» con le spunte, prove fatte, limiti.

Se un passo della scheda non regge (una funzione citata non esiste, un contratto è impossibile), fermati e dillo: non improvvisare.
