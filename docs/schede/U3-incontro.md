# U3 — L'incontro: due stendardi uno di fronte all'altro

**Binario** D (vista di battaglia: `incontroH` sta in `24hwd`). **Dopo** R2. Visibile appena unita (rilascio 1).

**Scopo.** Prima di combattere si capisce contro chi, dove, con che forze e che carattere ha il comandante nemico; la scelta è a un tocco.

**Leggi prima.** `app/24hwd-ven-scontro.js` (`incontroH`), `motori/28kc-ven-scontro.js` (`schieramenti`, `campo`), `VEN.forza`, `VDAT.FAZ`, `VDAT.TRATTI`, stendardi in `app/24ht-ven-arte.js` (`Stendardi`) per i colori. Dipende da U1.

**Oggi.** Titolo col nome del nemico, una riga «26 uomini · 18 fanti, 8 tiratori, 0 cavalieri», la barra delle forze, e due riquadri quasi vuoti con i bottoni a destra (Combatti, Risolvi, Ritirata, Paga il pedaggio).

**Decisioni già prese.**
1. **Faccia a faccia**: due colonne. Ognuna: stendardo disegnato in CSS (due colori del regno da `colFaz`, al centro l'iniziale), nome della schiera, comandante con l'indole come parola («prudente», «prode»…; da `VDAT.TRATTI`, solo se è un signore), e tre numeri con icona: fanti, tiratori, cavalieri. Sotto, centrata, la barra delle forze con la parola dell'esito probabile (già c'è: «In vantaggio»).
2. **Il campo**: una riga con icone: terreno (pianura/bosco/colline), strada, costa, meteo, ora («pomeriggio»), letti da `VEN.campo(s).scena` e `ora`. Se c'è un'altura o un bosco nelle zone che il motore estrarrà, non si dice (sorpresa del campo).
3. **Scelte**: Combatti (ottone) e le altre di legno in una griglia a due colonne da 56 px, nell'ordine di `scelte`. Le scelte strategiche di B8 (`k` che comincia con `strat:`) stanno in una riga a parte, «Consiglio», sopra la griglia.
4. Con la TV accesa la stessa carta va sulla TV in grande (riusa `tvH`: aggiungere il faccia a faccia), i telefoni mostrano solo la fascia delle scelte.

**Stato e contratti.** Nel file nuovo `motori/28kf-ven-anteprima.js` (binario C, ma un file nuovo non crea conflitti): `VEN.anteprima(s)` → `{noi:{nome,col,f,t,c,capo}, loro:{nome,col,f,t,c,capo,indole,rango?,dott?,stima?}, scena, ora, avvisi:[tx], scelte:[{k,tx,info,ok,perche,oro?}]}`. È pura e non salva nessun campo. Oggi `scelte` contiene `attacca`, `risolvi`, `ritirata`, `paga`, con gli stessi `data-v` (`scegli:K`).

**La vista è generica, così le schede del binario C non la toccano più**:
- ogni voce di `scelte` diventa un bottone, con `info` nell'infobox; quelle con `ok:false` si vedono grigie con il `perche`;
- `rango` diventa pallini da 0 a 5 con il nome; `stima` (es. «circa 120») sostituisce i numeri esatti quando c'è;
- `avvisi` diventa una riga d'allarme.

B7 (sfida), B8 (strategia) e B9 (rango) aggiungono solo dati all'anteprima.

**Passi.** 1) `anteprima` + test (contro predoni: `indole` assente; contro un signore: `indole` = il suo tratto; f+t+c = uomini sani). 2) `incontroH`. 3) TV.

**Prove.** Scenario `ventura`: i selettori `scegli:attacca` e `scegli:paga` restano; nuovo controllo che nell'incontro ci siano due `.vn-stend` e un solo ottone. Screenshot dell'incontro a 390 px.

**Fuori scopo.** La sfida (B7) aggiunge il suo bottone da sé.

**Fatto quando.** Scenario verde, screenshot senza riquadri vuoti.
