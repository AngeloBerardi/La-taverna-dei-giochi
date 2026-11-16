# W3 — Molti regni all'inizio, pochi alla fine

**Binario** H, con un **cantiere** sui file del binario C. W3a tocca molti file del mondo, quindi si fa quando il binario C non ha PR aperte, e lo si annuncia nel README delle schede. Tre PR: **W3a → W3b → W3c**. Modello: Sonnet con **revisione forte** per tutte e tre.

**Scopo.** Il mondo nasce frammentato: 9–12 signorie, comuni e marche, ciascuno di una delle cinque culture (Valdoro, Selvamara, Ferropietra, Maralta, Altavento). Con le guerre, i vassallaggi e i matrimoni dinastici si accorpano: verso il giorno 120 ne restano 5–6, e nella tarda partita 2–4. La mappa politica cambia sotto gli occhi del giocatore.

**Leggi prima.** `motori/28j-ven-dati.js` (`FAZ`, `REGNI`, `TRATTI`), `motori/28kd-ven-corte.js` (guerre, paci, alleanze, regno del giocatore V4), `motori/28ka-ven-ia.js` (`giornoNuovo`), tutte le occorrenze di `D.REGNI` e `D.FAZ[` (`grep -rn "REGNI\|FAZ\[" src/js`).

## W3a — Regni nello stato (nessun cambio di gioco)
1. `s.rg={id:{id,nome,breve,cult,col,col2,re,vivo:true,nato:0}}`. Nei mondi vecchi `s.rg` assente → `regni(s)` lo costruisce al volo dai cinque `FAZ` di oggi (stessi id `val`, `sel`…).
2. `FAZ` diventa il catalogo delle **culture** (`VDAT.CULT`): truppe, dottrina, aspetto, produzione. `cult(s,faz)` dà la cultura di un regno.
3. Tutte le letture di `D.FAZ[f]`/`D.REGNI` passano da `regni(s)`, `rg(s,f)`, `cult(s,f)` (vista compresa: `colFaz`, stemmi). È un cambio meccanico.
4. **Prova**: impronta di R1 identica; scenari della Ventura verdi.

## W3b — Molti regni alla nascita (solo mondi `geo===2`)
1. Alla nascita: un regno per ogni città, da `VDAT.DIFF[…].regni` (9–12), ognuno con una cultura data dalla zona (nord → Altavento/Ferropietra, coste → Maralta…, via `CULT.clima`). Nome generato: forma («Signoria di», «Marca di», «Comune di», «Principato di», «Libera città di») + nome del suo capoluogo. Colori presi dalla tavolozza della cultura, variati per tono senza ripetizioni vicine.
2. I territori (`R`) si assegnano per **costo di cammino** dai capoluoghi (fiumi e monti costano di più, così i confini seguono la natura), e i castelli e i villaggi vanno al regno del loro territorio.
3. Signori: 2–4 per regno (oggi sono molti per cinque regni: lo stesso numero totale, ridistribuito).

## W3c — L'unificazione
1. Ogni settimana, per ogni regno vivo:
   - **conquista**: chi perde l'ultimo capoluogo e l'ultimo castello si scioglie. I suoi signori passano al vincitore (prob. 0,6) o diventano senza terra (fuggono e possono essere reclutati da altri);
   - **vassallaggio**: un regno con forza < 0,35 del vicino più forte, in guerra con lui da 20 giorni, può giurargli fedeltà e diventa parte del vicino (nome nuovo: «Regno di …» se supera 3 città);
   - **matrimonio dinastico**: due regni della stessa cultura, in pace da 60 giorni, con relazione alta: unione (raro: al più uno ogni 60 giorni nel mondo).
   Probabilità e soglie in `VDAT.UNIF`, scalate da `opz.unif`.
2. **Freno alla valanga**: un regno con più del 40% delle città subisce una coalizione (gli altri si alleano contro di lui), come già nella diplomazia.
3. **Eventi** nel diario e sulla mappa: «La Marca di Fontesalice giura fedeltà al Regno di Valdoro». La mappa ricolora i confini in 1 s.
4. Il giocatore con il suo regno (V4) può ricevere vassallaggi allo stesso modo.
5. **Fine della partita**: invariata (V4), ma con una vittoria nuova: «Unificatore», con tutte le città sotto un solo regno, il tuo o quello che servi da maresciallo.

**Prove** (`tests/test_ven_regni.js`, bot a 300 giorni, 8 semi):
- regni vivi al giorno 0: 9–12; al 120: 4–7; al 300: 2–4 con `unif` normale (con `lenta` e `rapida` i valori si spostano nella direzione giusta);
- nessun regno senza città resta «vivo»; nessun signore resta senza regno per più di 30 giorni se ci sono regni che reclutano;
- mondi vecchi: sempre 5 regni, impronta identica;
- tempo di un giorno di gioco ≤ +20%.

**Fuori scopo.** Scelte del giocatore nei matrimoni (in futuro).

**Fatto quando.** Le tre PR sono unite e le prove sono verdi; in `docs/rules/ventura.md` c'è una sezione «I regni nascono e muoiono».
