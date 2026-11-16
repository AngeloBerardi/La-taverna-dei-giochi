---
description: Avvia una fase del piano: un agente per passo in parallelo, poi i controlli; restituisce le PR da unire
---
Fase `$ARGUMENTS`. Tu orchestri: non leggi codice né diff, tieni solo le risposte brevi degli agenti.

1. Leggi solo `docs/passi/LEGGIMI.md`.
2. `git fetch origin main`, poi `node tools/passi/controlla.js --fase $ARGUMENTS --json`, che dà l'elenco dei passi con agente, modello, effort, controllo, `controlloModello` e `controlloEffort`. Per ogni passo lancia `node tools/passi/controlla.js --pronto NN`: se uno non è pronto, fermati e di' quali PR mancano.
3. Per **ogni** passo della fase avvia, nella stessa risposta, un agente con lo strumento Agent:
   - `subagent_type` = agente del passo;
   - `model` = modello;
   - `effort` = effort;
   - `isolation: "worktree"`, in background;
   - descrizione «Passo NN»;
   - prompt: «Esegui il passo NN seguendo `.claude/commands/passo.md` con argomento NN. Rispondi solo con: numero della PR, esito delle prove in una riga, dubbi.»
4. Quando un passo torna con la sua PR, avvia il controllo:
   - `subagent_type: "revisore"`;
   - `model` = `controlloModello`;
   - `effort` = `controlloEffort`;
   - `isolation: "worktree"`;
   - prompt: «Esegui il controllo del passo NN seguendo `.claude/commands/controllo.md` con argomento NN. Rispondi solo con il verdetto e il numero dei rilievi.»
5. Se il controllo dice DA CORREGGERE, rilancia l'agente del passo (stesso modello) con il prompt «Correggi i rilievi del controllo nella PR #N (passo NN) sullo stesso ramo, poi rispondi come prima», e poi un nuovo controllo. Al secondo DA CORREGGERE applica una volta la scala di LEGGIMI («Se qualcosa va storto»); se ancora non va, fermati su quel passo e segnalalo.
6. Non unire nulla. Alla fine rispondi con:
   - una tabella `Passo | PR | Controllo | Cosa fare` («unisci», oppure il dubbio da guardare);
   - la riga «Quando le hai unite tutte: `/fase <successiva>`».
