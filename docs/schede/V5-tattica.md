# V5 — Battaglie più tattiche

> **Traccia.** Le decisioni di gioco sono prese; firme, campi e numeri li fissa l'`architetto` leggendo il codice, poi la scheda si esegue.

**Scopo.** Il campo cambia già aspetto con il luogo; ora deve cambiare anche il combattimento, e i gruppi devono poter cambiare formazione.

**Area:** `docs/moduli/ventura.md`.

## Decisioni già prese
- Altura: chi sta più in alto tira più lontano (+15%) e in mischia colpisce meglio (+10%); salire rallenta.
- Bosco e case: metà dei tiri a segno contro chi sta dentro; i cavalieri dentro non caricano.
- Guado e acqua bassa sulla costa: movimento dimezzato, niente carica.
- Tre formazioni per gruppo, un tocco sul gruppo già scelto le fa girare: **serrata** (difesa su, lenta, ottima contro i tiri con gli scudi), **larga** (metà danni dai tiri, debole alla carica), **cuneo** (solo cavalieri e fanti: sfonda, fianchi scoperti).
- Assedio a fasi: scale (lente, si sale sotto tiro), breccia (dopo i giorni di preparativi), porta (ariete, se costruito). Il difensore tira dall'alto.
- L'IA nemica usa le stesse regole: arcieri in altura, fanti serrati davanti, cavalli sul fianco.
- Il terreno del motore deve essere lo stesso che si vede: una sola funzione di quota e di copertura, nel motore, letta anche dalla vista.

## Da fissare prima di eseguire (architetto)
- Oggi l'altezza del campo è calcolata nella vista (`K.alto` in `24hv`): va portata nel motore (`28l`) senza trigonometria e la vista deve leggerla da lì.
- Come `comanda` e `istante` muovono i gruppi, per inserire le formazioni; come sono fatti `muro` e `varchi`.
- Ordini nuovi nella stanza in compagnia (`b-ord`).
- Ritarare `risolvi`: le battaglie automatiche devono restare coerenti con quelle giocate.

## Prove da chiedere
- A parità di forze, chi tiene l'altura con i tiratori vince più del 60% su 50 semi; la carica contro la serrata con aste perde.
- Stessi ordini, stesso seme → stesso esito su due telefoni (test della stanza).
- Il bot accorto continua a vincere, quello a caso a perdere; durata media della battaglia entro il 20% di oggi.

**Fuori scopo:** macchine d'assedio manovrabili, morale per formazione, battaglie navali.
