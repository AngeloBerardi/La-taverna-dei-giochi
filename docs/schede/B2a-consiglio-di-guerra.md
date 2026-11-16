# B2a — Il consiglio di guerra: telaio, ranghi 0–2, dottrine

**Binario** B. **Dopo** B3. **Spento finché** la scheda non ha `rango` (X2). Senza `rango`, `comanda` resta quella di oggi.

**Scopo.** Il nemico non segue più un copione unico: guarda il campo, valuta un elenco di **manovre** e le assegna ai suoi reparti. Il **rango** del comandante (0–5) decide quante manovre conosce, ogni quanto ci ripensa e quanto sbaglia. La **dottrina** del regno e l'**indole** del signore pesano le manovre: così i regni si riconoscono da come combattono.

**Leggi prima.** `motori/28l-ven-campo.js`: `comanda` (tutta), il punto in `istante` che la chiama, la scelta del bersaglio; le funzioni di B1 (`reparti`, `settori`, `ondata`) e B3 (`morali`). `motori/28j-ven-dati.js`: `FAZ`, `TRATTI`.

**Decisioni già prese.**
1. **File nuovo** `motori/28la-ven-consiglio.js` (dopo `28l` nel manifest e in `VEN_FILES`): `const VCONS=(()=>{…})()`. Contiene `quadro`, `MANOVRE`, `decidi`, `schiera`. `VCAM` lo chiama solo se `s.rango` è definito.
2. **Il quadro** `VCONS.quadro(s,l)` è puro e si calcola una volta per decisione.
   - Per reparto: centro, uomini, forza (somma di `att×pf/30`), morale, fatica, frecce, minaccia (forza nemica entro 15 pesata dai contrari: picche contro cavalli ×1,5, cavalli contro tiratori ×1,5, tiratori contro fanti in campo aperto ×1,2), terreno sotto i piedi.
   - Per lato: rapporto di forze con le riserve, altura tenuta, ondate rimaste, capitano nemico esposto (nessun suo reparto entro 8).
3. **Manovra** = `{id,rango,tipo:[tipi di reparto],vale(q,rep,X)→numero,ordina(s,l,rep,q)}`. In questa scheda ce ne sono dieci, dei ranghi 0–2:
   | Rango | Manovre |
   |---|---|
   | 0 | `carica` (tutti verso il nemico più vicino) |
   | 1 | `avanza` (in linea, al passo del più lento), `tieni` (fermi in serrata), `tiro` (i tiratori a gittata ×0,9, fermi) |
   | 2 | `contro` (serrata se arrivano cavalli entro 15, larga sotto le frecce), `ripiega` (tiratori indietro di 10 se un nemico è a 9), `debole` (tutti i reparti su quello nemico con il morale più basso), `copri` (cavalieri tra i tiratori e la minaccia), `insegui` (cavalieri sui fuggitivi), `attendi` (cavalieri di lato, fermi) |
4. **Decidere** (`VCONS.decidi(s,l)`):
   - ogni `RIFL[rango]` istanti (60/40/30/20/15/10, dal rango 0 al 5), calcola il quadro;
   - per ogni coppia (manovra conosciuta, reparto adatto) calcola `vale × peso dottrina × peso indole + rumore`, con rumore = `s.r()` × `ERR[rango]` (0,6/0,45/0,3/0,18/0,1/0,04);
   - assegna in modo goloso (il valore più alto, poi il successivo tra i reparti liberi). Un reparto cambia manovra solo se la nuova vale almeno `ISTERESI` (0,15) in più: niente ripensamenti nervosi;
   - evento `{t:'piano',l,r,m}` quando un reparto cambia manovra.
5. **Dottrine** = pesi in `VDAT.DOTTRINE`. Esempi:
   - Valdoro: `attendi` 1,4 poi `aggira` 1,5 (da B2b);
   - Selvamara: `tiro` 1,5, `prendi` 1,5;
   - Ferropietra: `tieni`/`contro` 1,5, `aggira` 0,6;
   - Maralta: `tiro` e `ripiega` 1,4, `rotazione` 1,4;
   - Altavento: `tiro` (anche a cavallo) 1,6, `esca` 1,6;
   - predoni: `carica` 2, tutto il resto 0,5;
   - mercenari e la tua compagnia: tutto a 1.
   Indole in `VDAT.INDOLE`:
   - prode: `carica`/`caccia` ×1,4, `ritirata` ×0,3;
   - prudente: `tieni`/`riserva` ×1,4, `ritirata` ×1,5, soglia di rotta +0,05;
   - crudele: `debole`/`insegui` ×1,5;
   - avido: `insegui` ×1,3, soglia di rotta +0,04.
6. **Schieramento dell'IA** (`VCONS.schiera`): rango 0–1 mettono tutto in `cx`; rango 2 mette i tiratori dietro i fanti e i cavalieri ai lati. Da B2b i ranghi alti leggono il terreno e il tuo schieramento.
7. **Ondate dell'IA**: rango 0–2 le fa entrare tutte con `quando:{k:'linea',v:60}` dal `retro`.
8. **Risoluzione automatica**: se c'è `rango`, anche il lato `a` usa il consiglio, con il rango del capitano (`comando` del capitano: 0–1 → 1, 2–3 → 2, 4–5 → 3, oltre → 4). La tua abilità di comando conta anche quando non giochi la battaglia.
9. **Costo**: il consiglio non deve pesare più del 15% del costo del passo (misura con `banco-campo.js`).

**Stato e contratti.** Scheda: `rango:{a,b}`, `dott:{a,b}`, `indole:{a,b}`. Stato: `s.rango`, `s.dott`, `s.indole`, `s.cons[l]={t,man:{r:id}}`. Funzioni: `VCONS.quadro`, `VCONS.decidi`, `VCONS.schiera`, `VCONS.MANOVRE`. Evento `piano`.

**Prove** (nuovo `tests/test_ven_tattica.js`; i casi lunghi sono marcati lenti):
- **Scala**: a truppe pari e senza capitani, rango 1 contro 0 e rango 2 contro 1 vincono tra il 58 e il 75% su 40 semi.
- `contro`: al rango 2, i fanti passano in serrata entro 30 istanti da quando i cavalli nemici sono a 15; al rango 0 mai.
- `ripiega`: al rango 2 l'ancora dei tiratori arretra quando un nemico arriva a 9.
- Dottrine: Ferropietra contro Altavento, con le loro truppe tipiche e rango 2 entrambi, si distinguono (Altavento: meno del 15% dei colpi dei cavalieri in mischia prima dell'istante 600; Ferropietra: i fanti restano in serrata fino al contatto).
- Impronta identica senza `rango`. Costo dentro il 15%.

**Fuori scopo.** Manovre di rango 3–5 (B2b, B2c), rango nel mondo (B9).

**Fatto quando.** Prove verdi; in `docs/rules/ventura.md` una sezione «Come pensa il nemico» (ranghi e dottrine, parole nostre).
