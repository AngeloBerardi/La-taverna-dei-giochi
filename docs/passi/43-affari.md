---
passo: 43
titolo: Affari della compagnia: botteghe e carovane
fase: 11
area: mondo
dopo: [36, 41]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kp-ven-affari.js
---

# Passo 43 — Affari della compagnia: botteghe e carovane

**In breve.** Qualcosa di tuo lavora mentre combatti: una bottega che rende, una carovana tua che commercia. La guerra può rovinarle.

> **Traccia**: la completa il passo 03 (architetto). Fino ad allora qui ci sono le decisioni di gioco, non le firme.

## Scopo

Qualcosa di tuo lavora mentre combatti: una bottega in città rende ogni settimana, una carovana tua porta merci tra due città. La guerra può rovinare entrambe.

## Decisioni

1. **Botteghe** (al più 3): in una città non nemica compri una bottega di un mestiere legato alle merci (`VDAT.PRODUCE`: tintoria, birrificio, armeria…). Rendita settimanale = margine tra materia prima e prodotto ai prezzi del luogo (`VEN.prezzo`), meno un affitto. Se la città passa a un regno in guerra con te, la bottega è confiscata.
2. **Carovane** (al più 2): parti da una città con un capocarovana (un compagno o un mercenario) e 10 uomini di scorta; vanno e vengono tra due città scelte comprando dove costa poco; i predoni possono assalirle (l'IA dei predoni le vede come oggi le carovane dei regni). Si vedono sulla mappa col tuo colore.
3. Resoconto settimanale nel diario, e una riga nella barra delle monete (passo 08) quando arriva la rendita.
4. Stato facoltativo: `s.botteghe=[{lid,k,da}]`, carovane come parti `k:'car'` con `faz:'tu'` e `mia:true`.

## Prove

Da fissare nel passo 03. Una bottega ben scelta ripaga in 30–50 giorni; una carovana senza scorta su una strada infestata si perde in ≥ 50% dei semi; nessun guadagno infinito (il bot non diventa ricco senza combattere più di 2× il bot di oggi).

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.
