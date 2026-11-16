---
passo: 42
titolo: Gli incontri del crocevia (testi)
fase: 10
area: testi
dopo: [03]
agente: programmer
modello: opus
impegno: medio
controllo: leggero
file:
  - src/js/motori/28ja-ven-voci.js
---

# Passo 42 — Gli incontri del crocevia (testi)

**In breve.** Trenta scene brevi a scelte per la strada: pellegrini, ponti crollati, disertori, mercanti, villaggi in fiamme.

> **Traccia**: la completa il passo 03 (architetto). Fino ad allora qui ci sono le decisioni di gioco, non le firme.

## Scopo

Scrivere le scene che il passo 44 farà capitare ai crocevia.

## Decisioni

Formato, condizioni ed effetti li fissa il passo 03 sul modello delle scene V6b. Ci sono 30 scene in due blocchi da 15, ognuna con 2–3 scelte e 1–2 nodi; ogni scelta tocca i gusti di almeno un compagno.

## Prove

`tests/test_ven_p42.js`: forma dei testi come in `test_ven_voci.js` (lunghezza, niente marchi, niente emoji), condizioni ed effetti validi.
