---
passo: 26
titolo: Grandi schiere nella vista
fase: 7
area: viste
dopo: [06, 22]
agente: programmer
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24ht-ven-arte.js
  - src/js/app/24hv-ven-campo.js
---

# Passo 26 — Grandi schiere nella vista

**In breve.** Duecento uomini restano fluidi su un telefono di fascia media; da lontano la battaglia si legge come su una mappa da comandante.

**Acceso da.** le battaglie grandi si vedono con `?ven=grandi` (per tutti al passo 29); i livelli di dettaglio valgono anche nelle battaglie piccole.

## Scopo

Duecento uomini in campo restano fluidi su un telefono di fascia media, e da lontano la battaglia si legge come su una mappa da comandante (blocchi, stendardi, frecce di marcia).

## Leggi prima

`app/24ht-ven-arte.js` (`Schiera` a istanze, qualità `ven-q`, budget), `app/24hv-ven-campo.js` (`K.alt`, rendering per fotogramma, `numeri`), `docs/moduli/ventura.md` (regole di r128 e del contesto perso).

## Decisioni

1. **Campo variabile**: terreno, alberi e bordi leggono `s.W`, `s.H` (oggi 60×100 fissi).
2. **Tre livelli di dettaglio** secondo l'altezza della camera:
   - **vicino** (< 45): figure intere come oggi;
   - **medio** (45–80): figure a istanze senza le parti piccole (armi, scudi), animazione a metà frequenza;
   - **lontano** (> 80, la «vista del comandante»): ogni reparto diventa un **blocco** (rettangolo del colore del lato, largo come il reparto, con lo stendardo, il numero e la barra del morale) più una freccia della sua manovra o del suo ordine. Toccare un blocco sceglie il reparto. Le figure si nascondono.
3. **Budget per qualità** (misurato, scritto nella PR): bassa ≤ 70 figure intere per lato (le altre al livello medio); media ≤ 110; alta e TV senza limite. Draw call costanti con il numero di uomini (tutto a istanze).
4. Il pizzico porta alla vista del comandante; un bottone nella barra alta (passo 22) ci va diretto.

## Stato e contratti

Solo vista. `K.lod`, `VenArte.Schiera` con `livello(n)`. Funzione pura `blocchi(s)` → `[{l,r,x,y,w,h,n,mor}]` (provata dentro lo scenario).

## Prove

- Scenario `scenari/p26.py` con `?ven=grandi`, taglia grande, 150 contro 150:
  - con qualità media, fps medi ≥ 0,9 × quelli di una battaglia piccola sullo stesso browser;
  - `renderer.info.render.calls` uguale tra 40 e 220 uomini;
  - alla vista del comandante ci sono 6 blocchi o meno per lato e nessuna figura visibile.
- Contesto perso e ripreso con 220 uomini: nessun errore.
- Due screenshot a 390 px (mischia vicina, vista del comandante).

## Fuori scopo

Regia (passo 31), effetti (passo 37).

## Fatto quando

Lo scenario passa e gli screenshot sono guardati.
