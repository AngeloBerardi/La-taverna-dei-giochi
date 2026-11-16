---
passo: 24
titolo: Le stagioni sulla mappa
fase: 6
area: viste
dopo: [17]
agente: programmer
modello: sonnet
impegno: basso
controllo: visivo
file:
  - src/js/app/24hu-ven-mappa.js
  - src/js/app/24hwa-ven-barre.js
  - src/css/39ja-ven-barre.css
---

# Passo 24 — Le stagioni sulla mappa

**In breve.** La stagione si vede: un'icona nella barra alta, la tinta del terreno, la neve e i laghi gelati.

**Acceso da.** mondi nuovi (`?ven=mondo2`).

## Scopo

Far sentire l'anno che gira senza leggere numeri.

## Leggi prima

`VEN.stagione`, `VEN.innevata` (passo 17); in `24hu` il materiale del terreno; `altoH` in `24hwa`.

## Decisioni

1. Tutto si attiva solo se `s.anno!=null`.
2. Barra alta: icona e nome della stagione accanto al giorno; nell'infobox il giorno dell'anno e i giorni che mancano alla stagione dopo.
3. Tinta del terreno per stagione: un moltiplicatore di colore sul materiale (primavera verde vivo, estate giallo caldo, autunno ruggine, inverno grigio-azzurro), senza texture nuove.
4. Le celle innevate (`VEN.innevata`) sono schiarite, con poche particelle leggere; i laghi gelati sono bianco-azzurri.

## Prove

Scenario `scenari/p24.py` con `?ven=mondo2` e il giorno forzato in inverno e poi in estate: icona e tinta cambiano, nessun errore. Due screenshot a 390 px.

## Fatto quando

Lo scenario è verde e gli screenshot sono guardati.
