# B4 — I compagni in campo: una dote e la loro voce

**Binari** B (doti nel motore, dopo B3) e F (testi, in parallelo). La vista dei fumetti va nel binario D dopo B5. Tre PR separate: B4-motore, B4-testi, B4-vista. Le doti si vedono appena unite, ma solo con i reparti accesi.

**Scopo.** I dieci compagni non sono più soldati qualunque: in battaglia ognuno cambia qualcosa attorno a sé e parla nei momenti che contano (carica, rotta, ferita, vittoria). Le loro frasi passano anche sulla TV.

**Leggi prima.** `motori/28j-ven-dati.js` (`COMPAGNI`, voci `TR` dei compagni con `compagno:true`), `motori/28ja-ven-voci.js` (formato e tono delle voci di V6c), `motori/28l-ven-campo.js` (`mischia`, `tiro`, `muovi`, eventi), `app/24hv-ven-campo.js` (`eventi`, numeri fluttuanti). Dipende da B3. Nei passi, «gruppo» va letto come «reparto» (B1).

**Decisioni già prese.**
1. Ogni compagno ha `campo:{k,r}` in `COMPAGNI` (**numeri qui**), effetto entro `r` passi su unità dello stesso lato:
   Berta `furia` (+15% attacco ai fanti) · Lapo `cerusico` (+1 pf ogni 30 istanti, non oltre il massimo) · Ghino `guado` (niente rallentamento in acqua per il suo gruppo) · Isabetta `conti` (fuori dal campo: +10% bottino in `esito`) · Ulfredo `macchine` (spinta d'ariete ×2 e salita delle scale −25%) · Diamante `alfiere` (perdite di morale del gruppo ×0,7) · Temu `steppa` (+10% velocità ai cavalieri) · Suor Nera `benedizione` (+10 al morale del suo gruppo all'inizio) · Brando `seicolpi` (il suo tiro scocca due quadrelli) · Fosca `notte` (nessuna penalità di notte ai tiratori).
2. Un solo punto di calcolo: `aura(s,u,k)` → vero se un compagno vivo con quella dote è entro il raggio. Chiamata solo nei punti indicati (non dappertutto), con cache per istante (`s._aura`, non salvata).
3. **Voci di campo**: il motore emette `{t:'grida',chi,k}` con `k` ∈ `carica` (primo colpo di carica del suo gruppo), `rotta` (rotta del lato nemico), `cede` (il suo gruppo in `rotta-g`), `ferito` (cade), `vince`. Al più una voce ogni 40 istanti per tutta la battaglia (`s.ultGrida`). Il capitano del giocatore non grida (è chi gioca).
4. Testi in `VVOC.CAMPO` (nuovo blocco in `28ja`): per ogni compagno e ogni `k`, **due** frasi brevi (≤ 60 caratteri), nella voce già data dai dialoghi di V6c. Scelta deterministica (`s.t % 2`). Scritti dal modello forte in un commit a parte.
5. Vista: fumetto di legno sopra il compagno per 2 s (se fuori schermo, in basso a sinistra col nome); sulla TV la riga entra nella cronaca della battaglia.

**Stato e contratti.** Nessun campo salvato nel mondo. In `VCAM`: `aura`, evento `grida`, `s.ultGrida`. In `esito`: dote `conti` letta dai compagni in compagnia.

**Passi.** 1) Dati `campo` (Sonnet). 2) `aura` e i dieci effetti, un commit ciascuno con la sua prova. 3) evento `grida`. 4) Testi (modello forte). 5) Vista e TV.

**Prove.** `tests/test_ven_campo.js`: per ogni dote una scheda minima che mostra l'effetto (es. Brando: in 200 istanti il numero di `tiro` con `da` = Brando è circa il doppio di un balestriere uguale). `test_ven_voci.js`: ogni compagno ha due frasi per ogni `k`, ≤ 60 caratteri, niente marchi né emoji. Una battaglia di 600 istanti emette al più 15 `grida`. Scenario `ventura_voci`: in battaglia con Berta compare un `.vn-fumetto`.

**Fuori scopo.** Abilità attive dei compagni a comando (potrebbe venire dopo, se il giocatore lo chiede).

**Fatto quando.** Prove verdi, regole con una riga per compagno.
