# I passi del piano «Il Condottiero»

Il piano della prossima major release delle Cronache del Crocevia (perché e visione: `docs/VENTURA-2.md`) è diviso in **46 passi numerati in sequenza**, raggruppati in **12 fasi**.
- Un passo è un file (`docs/passi/NN-nome.md`), una chat, un ramo e una PR.
- I passi di una fase lavorano **in parallelo** e non toccano mai lo stesso file: lo garantisce `npm run passi`.
- Una fase parte quando la precedente è tutta unita in `main`.

## Come si parte
Una fase si avvia con **un solo prompt**, scritto in una chat nuova (Sonnet 5.5, impegno basso): `/fase N`. L'orchestratore:
1. apre un agente per ogni passo, ognuno col suo modello e in un suo spazio di lavoro;
2. fa fare i controlli;
3. ti restituisce le PR da unire.

Tutti i prompt, anche quelli per lavorare a mano un passo per volta, sono in `PROMPT.md`.

`npm run passi -- --fase N` mostra i passi di una fase. `npm run passi` controlla il piano intero. Il grafico del piano è `docs/passi/piano.png` (si rigenera con `python3 tools/passi/grafico.py`).

## Regole d'oro per chi esegue un passo
1. **Solo i file permessi**: quelli nel campo `file:` del passo, più i tuoi, cioè:
   - `tests/test_ven_pNN.js` (e `tests/test_ven_pNN_lento.js` per i test lunghi);
   - `tools/test-browser/scenari/pNN.py`;
   - la sezione «Regole per il giocatore» del tuo file.

   Lo verifica `npm run passi -- --diff NN`. Se ti serve altro, fermati e chiedilo nella PR.
2. **File che nessun passo tocca**: `run.py`, `tests/carica.js`, `tests/tutti.js`. Il manifest lo toccano solo i passi 01, 02 e 04; il passo 04 crea vuoti tutti i file nuovi. Le regole (`docs/rules/ventura.md`, `07d-regole.js`) e `docs/moduli/ventura.md` li toccano solo il passo 04 e i rilasci.
3. **Tutto nasce spento.** Ogni novità che cambia il gioco agisce solo con il suo interruttore (`VDAT.ACCESO.grandi|consiglio|mondo2|eserciti`), con un campo nuovo nella scheda della battaglia o nei mondi nuovi (`s.geo===2`). Prima di ogni commit: `node tools/avventura/impronta.js --controlla`, perché a interruttori spenti il gioco deve restare identico a `main`. `main` va online a ogni unione: è questo che lo protegge.
4. **Le partite vecchie si aprono sempre**: stato nuovo solo come campi facoltativi; si prova con i salvataggi di `tests/fixture/ven/`.
5. **Ripetibile su ogni telefono.** In compagnia ogni telefono simula da sé, quindi nei motori sono vietati `Math.random`, `Date.now`, `Math.pow/exp/log`, le trigonometriche e `**`. Il controllo lo fa `npm run struttura`.
6. **Ganci, non modifiche al nucleo.** Le novità del mondo vivono nel loro file (`28kf`–`28kr`) e si attaccano ai ganci del passo 04 (`VEN.aggancia`), oppure sostituiscono un punto d'estensione **componendo** la versione precedente.
7. **Regole per il giocatore**: le scrivi nel tuo file (3–6 righe, parole nostre). Le copia nelle regole il passo del rilascio.
8. Se una decisione non regge (una funzione che non esiste, un contratto impossibile), **fermati** e scrivilo: non improvvisare.

## Controlli
Ogni PR ha un controllo, fatto da un'altra chat che legge solo il passo e il diff. Il verdetto, «APPROVATO» o «DA CORREGGERE», arriva come commento sulla PR.

| Livello | Modello · impegno | Cosa guarda |
|---|---|---|
| **leggero** | Haiku 5.5 · basso | file permessi (`--diff`); «Fatto quando» spuntato e credibile; prove presenti e non vuote; testi italiani, niente marchi né emoji |
| **forte** | Opus 5.5 · alto | il leggero, più: rilancia i test del passo e l'impronta; motori puri e ripetibili; interruttori spenti → nulla cambia; salvataggi vecchi; compagnia (mosse con `seat`, due telefoni uguali); i numeri delle prove sono quelli chiesti |
| **visivo** | Opus 5.5 · basso | `npm run build`, lancia lo scenario del passo con `SCHERMATE_DIR`, guarda al massimo 3 screenshot: un ottone, bersagli ≥ 44 px, niente testo tagliato o sovrapposto, coerenza con `docs/STYLE.md` e col passo. Il codice lo apre solo per un dubbio preciso |
| **forte+visivo** | Opus 5.5 · alto | i due insieme (rilasci, geografia) |

## Se qualcosa va storto (scala dei modelli)
1. Se le prove non passano dopo due tentativi, si riprova con lo stesso modello a impegno **alto**.
2. Se ancora non passano, o se il controllo dice «DA CORREGGERE» due volte, la correzione la fa **Opus 5.5 · alto**.
3. Se c'è un dubbio d'architettura (il passo è sbagliato, non il codice), **Fable 5.2 · alto** fa solo da giudice: legge il passo, la PR e i rilievi, e decide se correggere il passo o il codice. Non esegue mai.

## Modelli: chi fa cosa e perché
| Lavoro | Modello · impegno | Perché |
|---|---|---|
| Orchestrare una fase (`/fase N`) | Sonnet 5.5 · basso | apre agenti e raccoglie risposte brevi: non legge codice |
| Quasi tutti i passi | Sonnet 5.5 · medio | contratti già fissati: serve precisione, non invenzione |
| Spezzare, ganci, reparti, morale, IA, geografia, regni, stagioni, economia, strategia | Sonnet 5.5 · alto | logica fine con prove numeriche |
| Completare le tracce (03), maestro di guerra (30), testi (10, 15, 42) | Opus 5.5 · alto per i primi due, medio per i testi | giudizio di design e scrittura |
| Controlli leggeri | Haiku 5.5 · basso | lista di controllo su un diff piccolo |
| Controlli forti e visivi | Opus 5.5 · alto / basso | dove un errore costa caro, o serve occhio |
| Fable 5.2 | solo giudice, solo in caso di stallo | il più costoso: non si usa di base |

## Unione e rilasci
- **Quando unire**: appena il controllo di una PR dice «APPROVATO». L'ordine dentro una fase non conta, perché i file non si sovrappongono. Quando una fase è tutta unita, si passa alla successiva.
- **I rilasci sono passi come gli altri** (20, 29, 34, 38, 46). Ognuno:
  - gira un interruttore;
  - copia nelle regole le «Regole per il giocatore» dei passi che accende;
  - fa una prova d'insieme;
  - salva l'impronta «accesa» (`docs/passi/impronte/<interruttore>.txt`), che da lì in poi `--controlla` verifica.
- Se un rilascio non regge, si spegne l'interruttore nella stessa PR e si apre una issue per il passo da correggere.

| Rilascio | Passo | Cosa arriva a chi gioca |
|---|---|---|
| 1 Interfaccia | 20 | HUD del mondo, città e mercato, incontro, menu con la Compagnia in primo piano |
| 2 Grandi battaglie | 29 | fino a 110 per lato, reparti, settori, ondate, morale, fatica, frecce, stendardo, doti dei compagni |
| 3 Comandanti | 34 | consiglio di guerra, ranghi 0–5, strategia prima della battaglia |
| 4 Nuova campagna | 38 | geografia, molti regni che si accorpano, partenza a caso, stagioni, economia (solo partite nuove) |
| 5 Eserciti e mondo vivo | 46 | eserciti e adunate; feudi, affari e incontri del crocevia nelle regole |
