# B0 — Il motore delle battaglie grandi

**Binario** B (motore). **Dopo** R1. **Spento finché** la scheda non ha `max` (X1 lo accende).

**Scopo.** Il campo regge fino a 110 uomini per lato senza perdere velocità né ripetibilità. Il campo cresce con l'esercito, e il tetto è uguale su tutti i telefoni della compagnia.

**Leggi prima.** `motori/28l-ven-campo.js`: `C`, `nuovo` (riparto tra campo e riserva, righe 60–75), `istante` (scelta del bersaglio, rinforzi ogni 10 istanti), `vivi`, `riserva`. `tests/test_ven_campo.js`. Misure di partenza in `docs/VENTURA-2.md`.

**Decisioni già prese.**
1. **Tetto dalla scheda**: `scheda.max` (assente → `C.MAX`=34, come oggi). `VDAT.TAGLIA={piccola:{max:40,W:60,H:100},media:{max:70,W:80,H:120},grande:{max:110,W:100,H:140}}`. Il campo usa `s.W`, `s.H` della taglia; il codice che oggi legge `C.W`/`C.H` passa a `s.W`/`s.H` (già esistono nello stato).
2. **Griglia spaziale** nel motore: celle da 5 passi, ricostruita a ogni istante in array piatti (nessun oggetto per cella). La usano la ricerca del bersaglio, la separazione tra unità e la mischia. Il risultato deve essere **identico** a oggi a parità di scheda: stesso ordine di visita (per indice di unità) e stessi spareggi.
3. **Rinforzi**: `ONDATA` diventa `max(10, round(max/4))`; entrano quando in campo ci sono meno del 62% del tetto (come oggi).
4. **Opzione del mondo** (nel binario C, tocco di 15 righe in `28k`): `s.opz.taglia` (assente → `media`). `VEN.campo` scrive `max`, `W`, `H` nella scheda **solo** se `VDAT.ACCESO.grandi`. Le battaglie IA contro IA non passano da `VCAM`, quindi non cambiano.
5. Interruttore di prova: `?ven=grandi` nell'indirizzo mette `VDAT.ACCESO.grandi=true` solo in memoria (tocco di 5 righe in `24hw`, funzione `entra`). È un **tocco del binario E**: farlo solo senza PR aperte su quel file.
6. Strumento `tools/avventura/banco-campo.js`: per le taglie 40/70/110 e eserciti di 60/150/300, fa girare 1500 passi e stampa µs per passo e durata. Il risultato va nella PR.

**Stato e contratti.** Stato: `s.max` (tetto). Funzione `VCAM.taglia(k)` → `{max,W,H}`. Nessun nome pubblico cambia.

**Passi.** 1) `banco-campo.js` e misura su `main`. 2) Griglia (commit a sé, impronta identica). 3) `s.max`, `s.W`, `s.H` dalla scheda. 4) Tocco nel mondo (`s.opz.taglia`, `VEN.campo`) dietro l'interruttore. 5) `?ven=`.

**Prove.**
- Impronta identica a `main` (schede senza `max`).
- `test_ven_campo.js`: con `max:110` e 150 uomini per lato, all'istante 1 ce ne sono 110 in campo; i rinforzi entrano a 28 per volta; stesso seme → stesso esito.
- Banco: a 2×110 in campo, ≤ 0,6 ms per passo in node. Nella PR la tabella prima/dopo.
- `test_ven_mondo.js`: senza interruttore la scheda di `VEN.campo` è identica a prima; con l'interruttore ha `max` della taglia scelta.

**Fuori scopo.** Reparti e ondate (B1), resa grafica (B0v).

**Fatto quando.** Prove verdi, banco nella PR, `docs/moduli/ventura.md` aggiornato con la riga di B0.
