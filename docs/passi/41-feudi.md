---
passo: 41
titolo: Feudi vivi: costruire (motore)
fase: 10
area: mondo
dopo: [03]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28ko-ven-feudi.js
---

# Passo 41 — Feudi vivi: costruire (motore)

**In breve.** Nei tuoi luoghi costruisci (mulino, mura, caserma, mercato, torre, cappella) e le scelte cambiano rendite e difese.

> **Traccia**: la completa il passo 03 (architetto). Fino ad allora qui ci sono le decisioni di gioco, non le firme.

## Scopo

Un feudo non è solo una rendita: ci costruisci, e lo vedi crescere sulla mappa. Le scelte cambiano cosa rende e come si difende.

## Decisioni

1. Dati in `VDAT.EDIFICI` (**numeri qui**), tre livelli ciascuno, costo in monete e giorni: villaggio → mulino (+viveri e rendita), palizzata (guarnigione minima, ritarda le razzie), campo d'addestramento (reclute di rango 2); città/castello → mura (assedio: breccia più lenta), caserma (reclute migliori della cultura del luogo), mercato coperto (+rendita, scorte), torre di vedetta (vista più larga attorno), cappella (+morale a chi riposa).
2. Stato: `l.edif={id:livello}` e `l.cant={id,fino}` (un cantiere alla volta per luogo); assente = nessun edificio.
3. Gli edifici si vedono nel modello 3D del luogo (`VenMappa`: pezzi aggiunti, uno per edificio, `artist`).
4. Una razzia o una conquista abbassa di un livello l'edificio più alto.
5. Pannello del luogo (passo 13): tessera «Cantiere» solo nei luoghi tuoi o in feudo.

## Prove

Da fissare nel passo 03. Un mulino al livello 3 ripaga il costo in 40–60 giorni; il bot accorto costruisce e non va in rovina; salvataggio senza `edif` si apre.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.
