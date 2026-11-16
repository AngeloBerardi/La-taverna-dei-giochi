# W1 — Il menu dell'Avventura e la nuova campagna

**Binario** E (interfaccia). **Sostituisce T4** (ne riprende la struttura). **Dopo** R2. I campi della difficoltà si salvano subito, ma il mondo li legge solo con le schede W5/W6 e con X4: fino ad allora cambia solo l'aspetto.

**Scopo.** La Compagnia di ventura è **il** gioco dell'Avventura: occupa la scena, e la campagna a capitoli diventa la seconda insegna. «Nuova campagna» porta a un foglio in cui si sceglie la difficoltà (preset o su misura) e il nome del capitano. Il regno non si sceglie: la sorte ti getta in un punto del mondo (W4).

**Leggi prima.** `docs/schede/T4-menu-avventura.md` (struttura che resta valida), `app/24ha-avventura.js`, `app/24hw-ventura.js` (`entra`, `regno:sel`, `nuova`), `app/24hx-ven-stanza.js` (`ripH`), `docs/STYLE.md`.

**Decisioni già prese.**
1. **La pagina, dall'alto**:
   - **Riprendi**: la carta della partita in corso; se è della Compagnia mostra giorno, stagione, regni rimasti, fama.
   - **Insegna grande della Compagnia di ventura** (altezza 220 px, illustrazione dipinta di un accampamento di ventura al tramonto, titolo, una riga «Un mondo libero: truppe, regni, battaglie») con due bottoni: **Nuova campagna** (ottone) e Carica.
   - **Insegna piccola** «La Corona Spezzata — campagna a capitoli» (88 px).
   - Schede `Partite` · `Eroi` · `Guida`, come in T4.
2. **Foglio «Nuova campagna»** (al massimo 58%, con scorrimento):
   - **Difficoltà**: quattro carte. **Recluta**, **Condottiero** (predefinita), **Leggenda**, **Su misura** (apre le leve).
   - **Leve** (`VDAT.DIFF`, numeri qui):
     | Leva | Valori |
     |---|---|
     | Economia | generosa / giusta / avara: prezzi, paghe, rendite |
     | Consumi | leggeri / normali / duri: viveri e foraggio per uomo e stagione |
     | Nemici | rango medio dei signori −1/0/+1; frequenza e forza dei predoni |
     | Unificazione dei regni | lenta / normale / rapida |
     | Stagioni | miti / normali / rigide |
     | Ferite del capitano | indulgenti (mai morte) / normali / ferro: alla terza sconfitta grave la campagna finisce, con un solo salvataggio |
     | Grandezza del mondo | ampio / vasto (W2) |
     | Grandezza delle battaglie | come da B0 |
   - **Capitano**: nome (precompilato dal profilo), stemma (due colori e una figura da un elenco di 12, nessun marchio).
   - **Seme** in un `<details>` per chi vuole ripetere un mondo.
   - Ottone: **Getta i dadi** → nuova partita con `s.opz`.
3. La scelta del regno (`regno:sel`) sparisce. Nei mondi vecchi resta tutto com'è (la scelta era all'inizio, ed è già fatta).
4. Compagnia (stanza): la difficoltà la sceglie l'oste; gli altri vedono il riepilogo.

**Stato e contratti.** `s.opz={diff,eco,cons,nem,unif,stag,fer,mondo,taglia,stemma}` (facoltativo: assente = «Condottiero»). `VEN.nuovo(seme,{opz})` accetta e salva `opz`; nessun'altra regola la legge in questa scheda. `VDAT.DIFF={recluta:{…},condottiero:{…},leggenda:{…}}` con i valori delle leve.

**Passi.** 1) `VDAT.DIFF` e `opz` in `nuovo` (tocco nel binario C: 15 righe). 2) Pagina Avventura. 3) Foglio Nuova campagna. 4) Illustrazione dell'insegna (`artist`). 5) Rimuovere `regno:sel` dal flusso nuovo.

**Prove.** Scenario `menu_avventura`:
- senza salvataggi l'insegna della Compagnia è il primo elemento sotto la testata;
- «Leggenda» → `s.opz.diff==='leggenda'`; «Su misura» apre le leve;
- «Getta i dadi» entra nel mondo senza chiedere il regno;
- la stanza a 2 mostra il riepilogo all'ospite.

`test_ven_mondo.js`: `opz` salvato e riaperto. Screenshot a 390 px (pagina e foglio).

**Fatto quando.** Prove verdi e screenshot guardati. T4 è segnata «sostituita da W1» nell'indice.
