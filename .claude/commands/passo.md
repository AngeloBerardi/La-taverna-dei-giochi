---
description: Esegue un passo del piano (docs/passi/NN-*.md) dall'inizio alla PR
---
Passo `$ARGUMENTS`: due cifre, per esempio `07`.

1. Leggi `docs/passi/LEGGIMI.md` (regole comuni) e il file `docs/passi/$ARGUMENTS-*.md`. Nient'altro finché il passo non ti manda a un file; del codice leggi solo i pezzi che servono (`grep -n`, poi offset/limit).
2. `git fetch origin main`, poi `node tools/passi/controlla.js --pronto $ARGUMENTS`: se dice NON pronto, fermati e riferisci quali passi mancano.
3. Crea il ramo `passo/$ARGUMENTS-<nome del file>` da `origin/main`.
4. Segui l'«Ordine di lavoro»; se manca, segui le «Decisioni» nell'ordine. Tocca solo i file del campo `file:` più i tuoi: `tests/test_ven_p$ARGUMENTS*.js`, `tools/test-browser/scenari/p$ARGUMENTS.py` e la sezione «Regole per il giocatore» del file del passo.
5. Prima di ogni commit: `npm run verifica`; se tocchi un motore della Ventura e `tools/avventura/impronta.js` esiste, anche `node tools/avventura/impronta.js --controlla`. Durante il lavoro bastano i test mirati: `npm test -- p$ARGUMENTS`.
6. Screenshot solo se il passo li chiede, solo a fine lavoro: `npm run build && SCHERMATE_DIR=/tmp/p$ARGUMENTS python3 tools/test-browser/run.py p$ARGUMENTS`. Guardali una volta.
7. Se il passo ha la sezione «Regole per il giocatore», scrivila nel file del passo (3–6 righe, parole nostre).
8. `node tools/passi/controlla.js --diff $ARGUMENTS` deve dire che tutti i file toccati sono permessi.
9. Commit piccoli in italiano, «Passo $ARGUMENTS: …». `git fetch origin main`, rebase, push; se il proxy risponde 429 aspetta 20 s e riprova, al massimo 5 volte. Apri la PR via `gh api repos/AngeloBerardi/La-taverna-dei-giochi/pulls`:
   - titolo «Passo $ARGUMENTS — <titolo del passo>»;
   - nel corpo: «Fatto quando» con le spunte, i numeri delle prove, i limiti onesti;
   - in fondo la riga «Controllo: `/controllo $ARGUMENTS` (modello e impegno dalla tabella dei controlli di LEGGIMI)».
10. Rispondi in meno di 120 parole: numero della PR, esito delle prove, dubbi.

Se una decisione del passo non regge (una funzione citata non esiste, un contratto è impossibile, serve un file non permesso), fermati e scrivilo nella PR come domanda: non improvvisare.
