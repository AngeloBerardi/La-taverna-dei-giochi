---
passo: 06
titolo: Il motore delle battaglie grandi
fase: 3
area: battaglia
dopo: [04]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte
file:
  - src/js/motori/28l-ven-campo.js
  - src/js/motori/28jb-ven-dati-campo.js
  - tools/avventura/banco-campo.js
---

# Passo 06 — Il motore delle battaglie grandi

**In breve.** Il campo regge fino a 110 uomini per lato senza perdere velocità né ripetibilità; il campo si allarga con l'esercito; la scheda può portare modificatori per notte, neve e strategia.

**Acceso da.** `VDAT.ACCESO.grandi` (rilascio 2, passo 29). Senza `max` nella scheda la battaglia resta identica a oggi.

## Scopo

Il campo regge fino a 110 uomini per lato senza perdere velocità né ripetibilità. Il campo cresce con l'esercito, e il tetto è uguale su tutti i telefoni della compagnia.

## Leggi prima

`motori/28l-ven-campo.js`: `C`, `nuovo` (riparto tra campo e riserva, righe 60–75), `istante` (scelta del bersaglio, rinforzi ogni 10 istanti), `vivi`, `riserva`. `tests/test_ven_campo.js`. Misure di partenza in `docs/VENTURA-2.md`.

## Decisioni

1. **Tetto dalla scheda**: `scheda.max` (assente → `C.MAX`=34, come oggi). In `28jb-ven-dati-campo.js`: `VDAT.TAGLIA={piccola:{max:40,W:60,H:100},media:{max:70,W:80,H:120},grande:{max:110,W:100,H:140}}`. Il campo usa `s.W` e `s.H` della taglia; il codice che oggi legge `C.W` e `C.H` passa a `s.W` e `s.H` (esistono già nello stato).
2. **Griglia spaziale**: celle da 5 passi, ricostruita a ogni istante in array piatti (nessun oggetto per cella). La usano la ricerca del bersaglio, la separazione tra unità e la mischia. Il risultato deve essere **identico** a oggi a parità di scheda: stesso ordine di visita (per indice di unità) e stessi spareggi.
3. **Rinforzi**: `ONDATA` diventa `max(10, round(max/4))`; entrano quando in campo resta meno del 62% del tetto, come oggi.
4. **Modificatori**: `scheda.mod={a:{f:{vel,att,dif,git},t:{…},c:{…}},b:{…}}`, dove ogni valore assente vale 1, moltiplica i valori delle unità alla nascita. Li useranno notte, neve e strategia (passi 17 e 32).
5. Il mondo passerà `max`, `W` e `H` solo al rilascio 2 (passo 29), con un gancio `scheda`: questo passo tocca solo il campo.
6. **Strumento** `tools/avventura/banco-campo.js`: per le taglie 40/70/110 e per eserciti di 60/150/300, fa girare 1500 passi e stampa µs per passo e durata. Il risultato va nella PR.

## Stato e contratti

Stato: `s.max` (tetto). `VCAM.taglia(k)` → `{max,W,H}`. Scheda: `max`, `W`, `H`, `mod`. Nessun nome pubblico cambia.

## Ordine di lavoro

1. `banco-campo.js` e misura su `main`.
2. Griglia (commit a sé, impronta identica).
3. `s.max`, `s.W`, `s.H` dalla scheda.
4. `mod`.

## Prove

- Impronta identica (schede senza i campi nuovi).
- `tests/test_ven_p06.js`:
  - con `max:110` e 150 uomini per lato, all'istante 1 ce ne sono 110 in campo e i rinforzi entrano a 28 per volta;
  - stesso seme → stesso esito;
  - `mod.a.c.vel=0.5` dimezza la velocità dei cavalieri del lato `a`.
- Banco: a 2×110 in campo, ≤ 0,6 ms per passo in node. Nella PR la tabella prima e dopo.

## Regole per il giocatore

- Le battaglie grandi possono portare in campo fino a centodieci uomini per lato: più grande è l'esercito, più largo è il campo.
- Gli uomini che non trovano posto restano in riserva e scendono a ondate dal bordo, quando il campo si svuota.
- Notte, neve e la strategia scelta prima dello scontro possono rendere più lenti, deboli o fragili interi gruppi di una schiera.
- A parità di seme la battaglia va sempre allo stesso modo, su ogni telefono della compagnia.

## Fuori scopo

Reparti e ondate (passo 11), resa grafica (passo 26).

## Fatto quando

Prove verdi, banco nella PR.
