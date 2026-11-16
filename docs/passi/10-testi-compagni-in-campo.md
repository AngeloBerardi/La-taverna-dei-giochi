---
passo: 10
titolo: Le voci dei compagni in battaglia (testi)
fase: 3
area: testi
dopo: [04]
agente: programmer
modello: opus
impegno: medio
controllo: leggero
file:
  - src/js/motori/28ja-ven-voci.js
---

# Passo 10 — Le voci dei compagni in battaglia (testi)

**In breve.** Le frasi che i dieci compagni gridano in battaglia: due per ogni momento. Solo testi, nessuna regola.

## Scopo

Dare voce ai compagni nei momenti che contano: carica, rotta del nemico, il loro reparto che cede, ferita, vittoria. Le userà il passo 39 quando il motore (passo 28) emette `grida`.

## Leggi prima

`motori/28ja-ven-voci.js`: del blocco dei dialoghi (V6c) leggi solo due compagni, per prendere il tono. `VDAT.COMPAGNI` (nomi e carattere) in `28j-ven-dati.js`.

## Decisioni

1. `VVOC.CAMPO={co_berta:{carica:[a,b],rotta:[…],cede:[…],ferito:[…],vince:[…]},…}` per i dieci compagni (gli id di `COMPAGNI`).
2. Frasi di al massimo 60 caratteri, in italiano, ognuna nella voce che quel compagno ha già nei dialoghi. Niente marchi, niente emoji, niente bestemmie.
3. Nessun codice di gioco.

## Prove

`tests/test_ven_p10.js`: ogni compagno ha due frasi per ogni momento, ognuna di al massimo 60 caratteri, senza emoji (controllo con un'espressione regolare).

## Fatto quando

Il test è verde e la PR riporta sei frasi d'esempio.
