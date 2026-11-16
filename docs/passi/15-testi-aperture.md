---
passo: 15
titolo: Le aperture della sorte (testi)
fase: 4
area: testi
dopo: [04]
agente: programmer
modello: opus
impegno: medio
controllo: leggero
file:
  - src/js/motori/28ja-ven-voci.js
---

# Passo 15 — Le aperture della sorte (testi)

**In breve.** Le scene d'apertura che raccontano dove la sorte ha gettato la compagnia: 6 agganci × 2 varianti. Solo testi.

## Scopo

Dare a ogni nuova campagna un inizio raccontato in tre righe con uno spunto vicino. Le userà il passo 33.

## Leggi prima

`motori/28ja-ven-voci.js`: formato delle scene (V6b/V6c); leggine una sola.

## Decisioni

1. `VVOC.APERTURE={covo:[a,b],scorta:[…],recluta:[…],torneo:[…],villaggio:[…],affare:[…]}`. Ogni testo ha al massimo 3 frasi e 240 caratteri, con i segnaposto `{luogo}`, `{regno}`, `{uomini}`, `{monete}` e `{meta}` (il luogo dello spunto).
2. Tono: cantare di ventura, asciutto, un po' ironico; la sorte è un personaggio («La sorte ti getta a {luogo}…»).
3. Nessun codice di gioco.

## Prove

`tests/test_ven_p15.js`: 12 testi, ognuno con tutti i segnaposto validi, al massimo 240 caratteri, senza emoji.

## Fatto quando

Il test è verde e la PR riporta due testi d'esempio.
