# U3 — L'incontro: due stendardi uno di fronte all'altro

**Scopo.** Prima di combattere si capisce contro chi, dove, con che forze e che carattere ha il comandante nemico; la scelta è a un tocco.

**Leggi prima.** `app/24hwd-ven-scontro.js` (`incontroH`), `motori/28kc-ven-scontro.js` (`schieramenti`, `campo`), `VEN.forza`, `VDAT.FAZ`, `VDAT.TRATTI`, stendardi in `app/24ht-ven-arte.js` (`Stendardi`) per i colori. Dipende da U1.

**Oggi.** Titolo col nome del nemico, una riga «26 uomini · 18 fanti, 8 tiratori, 0 cavalieri», la barra delle forze, e due riquadri quasi vuoti con i bottoni a destra (Combatti, Risolvi, Ritirata, Paga il pedaggio).

**Decisioni già prese.**
1. **Faccia a faccia**: due colonne. Ognuna: stendardo disegnato in CSS (due colori del regno da `colFaz`, al centro l'iniziale), nome della schiera, comandante con l'indole come parola («prudente», «prode»…; da `VDAT.TRATTI`, solo se è un signore), e tre numeri con icona: fanti, tiratori, cavalieri. Sotto, centrata, la barra delle forze con la parola dell'esito probabile (già c'è: «In vantaggio»).
2. **Il campo**: una riga con icone: terreno (pianura/bosco/colline), strada, costa, meteo, ora («pomeriggio»), letti da `VEN.campo(s).scena` e `ora`. Se c'è un'altura o un bosco nelle zone che il motore estrarrà, non si dice (sorpresa del campo).
3. **Scelte in una sola fascia in basso**: Combatti (ottone), Risolvi, Ritirata, e la quarta solo se esiste (Paga il pedaggio / Sfida il capo dopo B7 / Arrenditi). Tutti alla stessa altezza, 56 px.
4. Con la TV accesa la stessa carta va sulla TV in grande (riusa `tvH`: aggiungere il faccia a faccia), i telefoni mostrano solo la fascia delle scelte.

**Stato e contratti.** In `28kc`: `VEN.anteprima(s)` → `{noi:{nome,col,f,t,c,capo}, loro:{nome,col,f,t,c,capo,indole}, scena, ora}` (pura, nessun campo salvato; `capo` = nome del comandante). Usa gli stessi `schieramenti` del campo.

**Passi.** 1) `anteprima` + test (contro predoni: `indole` assente; contro un signore: `indole` = il suo tratto; f+t+c = uomini sani). 2) `incontroH`. 3) TV.

**Prove.** Scenario `ventura`: i selettori `scegli:attacca` e `scegli:paga` restano; nuovo controllo che nell'incontro ci siano due `.vn-stend` e un solo ottone. Screenshot dell'incontro a 390 px.

**Fuori scopo.** La sfida (B7) aggiunge il suo bottone da sé.

**Fatto quando.** Scenario verde, screenshot senza riquadri vuoti.
