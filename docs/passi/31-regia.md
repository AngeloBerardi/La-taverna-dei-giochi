---
passo: 31
titolo: La regia della battaglia
fase: 8
area: viste
dopo: [22, 26]
agente: programmer
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24hv-ven-campo.js
  - src/js/app/24hwe-ven-tv.js
---

# Passo 31 — La regia della battaglia

**In breve.** La telecamera racconta lo scontro: inquadra sempre dove si combatte, con tutte e due le schiere in vista, e stacca sui momenti decisivi.

## Scopo

La telecamera racconta lo scontro: inquadra sempre dove si combatte con entrambe le schiere in vista, e nei momenti decisivi (una carica che sfonda, uno stendardo che cade, un gruppo in rotta) stacca sul punto per un attimo. Oggi segue il capitano e le schiere escono dallo schermo.

## Leggi prima

`app/24hv-ven-campo.js`: `K` (`fuoco`, `alt`, `segue`), `passo`, `eventi`, `tocco`, `trascina`, `pizzico`, `centra`; `app/24hwe-ven-tv.js` (TV: `campoTvH`). Dipende dal passo 16 (eventi `rotta-r`, `stendardo`) e il passo 22 (mini-mappa e barra alta).

## Decisioni

1. `K.cam` ∈ `regia` (predefinita) · `capitano` · `libera`. Tasto nella barra alta (icona occhio) che gira tra le tre; la TV (`24hwe-ven-tv.js`) è sempre `regia`.
2. **Regia**: bersaglio = media pesata delle unità che hanno colpito o sono state colpite negli ultimi 30 istanti (peso 3) e di tutte le vive (peso 1); altezza tale che il rettangolo delle unità vive dei due lati stia nell'80% della vista, tra `K.ALT_MIN` 30 e `K.ALT_MAX` 92. Avvicinamento morbido (0,08 per fotogramma, indipendente dai fotogrammi: usare `1-Math.pow(0.92,dt*60)`).
3. **Stacchi**: su `carica` con ≥ 3 colpi di carica nello stesso istante, `rotta-r`, `stendardo`, `cap-ko`, `porta`: la camera va sul punto ad altezza 26 per 1,6 s, poi torna alla regia. Un nuovo stacco non interrompe quello in corso; minimo 6 s tra due stacchi.
4. **Rallentatore** solo in solitario e solo per `stendardo` e `cap-ko`: velocità della vista ×0,35 per 0,7 s (si rallenta l'accumulo dei passi del motore, non il motore). In compagnia mai: il tempo è comune.
5. Il giocatore comanda sempre: tocco sul campo per muovere il capitano → camera `capitano` per 4 s, poi torna a `regia`; trascinare o pizzicare → `libera` finché non si preme l'occhio.
6. Lo schieramento (passo 19) usa la vista del campo intero; al «Via» parte la regia.
7. **Battaglie grandi**: se il rettangolo delle unità non entra sotto `ALT_MAX`, la regia inquadra il fronte più caldo, cioè la cella da 20 passi con più colpi negli ultimi 30 istanti. Ogni 12 s, o su una manovra nemica annunciata (`piano` dei passi 21, 25 e 30), passa per 2 s al livello lontano del passo 26 e poi torna. Gli stacchi valgono anche per `ondata` (sull'ingresso) e per le manovre `aggira`, `esca` scoperta, `caccia`.

## Stato e contratti

Solo vista: `K.cam`, `K.stacco={x,z,fino}`, `K.ultStacco`, `K.lento`. Funzione pura nella vista `inquadra(s)` → `{x,z,alt}` (provata dentro lo scenario).

## Prove

Scenario `scenari/p31.py`: battaglia con «Tutti alla carica», dopo 8 s e dopo 14 s la proiezione dei centri delle due schiere è dentro lo schermo; forzando un evento `stendardo` la camera si avvicina (alt < 30) entro 0,5 s e torna sopra 30 entro 3 s; un tocco sul campo passa a `capitano` e dopo 4,5 s di nuovo `regia`. In compagnia (`ventura_stanza`) nessun rallentatore. Screenshot a metà mischia a 390 px.

## Fuori scopo

Nuovi effetti (passo 37).

## Fatto quando

Scenario verde; nello screenshot si vedono entrambe le schiere a contatto.
