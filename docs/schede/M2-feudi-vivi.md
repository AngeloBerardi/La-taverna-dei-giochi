# M2 — Feudi vivi: costruire nei propri luoghi (traccia)

> **Traccia**: firme e prove le fissa l'`architetto` leggendo `28kb-ven-economia.js` e `28kd-ven-corte.js` dopo R1.

**Scopo.** Un feudo non è solo una rendita: ci costruisci, e lo vedi crescere sulla mappa. Le scelte cambiano cosa rende e come si difende.

**Decisioni di gioco.**
1. Dati in `VDAT.EDIFICI` (**numeri qui**), tre livelli ciascuno, costo in monete e giorni: villaggio → mulino (+viveri e rendita), palizzata (guarnigione minima, ritarda le razzie), campo d'addestramento (reclute di rango 2); città/castello → mura (assedio: breccia più lenta), caserma (reclute migliori della cultura del luogo), mercato coperto (+rendita, scorte), torre di vedetta (vista più larga attorno), cappella (+morale a chi riposa).
2. Stato: `l.edif={id:livello}` e `l.cant={id,fino}` (un cantiere alla volta per luogo); assente = nessun edificio.
3. Gli edifici si vedono nel modello 3D del luogo (`VenMappa`: pezzi aggiunti, uno per edificio, `artist`).
4. Una razzia o una conquista abbassa di un livello l'edificio più alto.
5. Pannello del luogo (U2): tessera «Cantiere» solo nei luoghi tuoi o in feudo.

**Prove da fissare.** Un mulino al livello 3 ripaga il costo in 40–60 giorni; il bot accorto costruisce e non va in rovina; salvataggio senza `edif` si apre.

**Modello.** Architetto forte (scheda), Sonnet (motore e pannello), `artist` (modelli).
