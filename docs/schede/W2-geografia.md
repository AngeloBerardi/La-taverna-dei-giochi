# W2 — Un mondo più vasto, con una geografia che ha senso

**Binario** H. **Dopo** R1. Il nuovo generatore vale **solo per i mondi nuovi** (`s.geo===2`, acceso da X4); i salvataggi vecchi restano sulla mappa di oggi. **Modello**: Sonnet, con **revisione forte** (è il cuore del mondo).

**Scopo.** Una terra più grande, che si capisce guardandola.
- Le catene montuose hanno dei passi.
- I fiumi scendono dai monti al mare o ai laghi.
- Le città nascono sulle foci, alle confluenze e sulle rive dei laghi.
- I **porti stanno solo dove c'è acqua navigabile**: mare o lago grande, mai un porto in un laghetto o nell'entroterra.
- I castelli guardano i passi e i ponti.
- Le strade seguono le valli; i confini seguono fiumi e crinali.

**Leggi prima.** `motori/28k-ven-mondo.js`: `mappa` (righe 31–80: altezze, terreni, macchia principale, luoghi, strade), `CENTRI`, `vicinoOk`, `velocita`, `cella`; `app/24hu-ven-mappa.js` (come legge `M.T`, `M.B`, `M.S`, `M.G`).

**Decisioni già prese.**
1. **File nuovo** `motori/28kg-ven-geografia.js`: `VGEO.genera(seme,opz)` → stesso formato di `mappa` (`{seme,G,T,B,S,R,A,ok,luoghi,covi,…}`) più `F` (fiumi: portata per cella), `LG` (id del lago per cella) e `P` (ponti e guadi). `mappa(seme)` di oggi resta per `s.geo` assente; `mappaDi(s)` sceglie quella giusta (tutte le chiamate di `mappa(s.seme)` diventano `mappaDi(s)`: è un cambio meccanico).
2. **Dimensioni**: `G` = 192 (ampio) o 240 (vasto) da `opz.mondo`; oggi è 128. Le distanze di gioco (viaggio in ore) restano simili scalando la velocità: un giorno attraversa la stessa frazione di mondo × 0,6 (il mondo si sente più grande, ma non è noioso).
3. **Ordine della generazione** (ognuno è un passo con la sua prova):
   1. **Continente**: rumore con caduta verso i bordi (mai terra sul bordo: ci sono 8 celle di mare tutt'intorno) e 1–3 isole.
   2. **Catene**: 3–5 dorsali come curve di rumore che alzano le quote; ogni dorsale ha almeno 2 passi (celle collinari che la attraversano).
   3. **Laghi**: le conche si riempiono fino al punto di sfioro (priority-flood); un lago di almeno 40 celle è «grande» (navigabile).
   4. **Fiumi**: accumulo di flusso sulle quote riempite. Dove la portata supera una soglia nasce un fiume (si attraversa lentamente, o a un guado), e ogni fiume finisce in mare o in un lago. 6–10 fiumi principali.
   5. **Climi**: latitudine e quota danno i biomi (nord: abeti e neve sui monti; sud: macchia e terra secca); il bosco segue l'umidità vicino ai fiumi.
   6. **Luoghi** per punteggio di idoneità:
      - città: foce, confluenza, riva di lago grande, baia;
      - porti: cella costiera su mare o lago grande, a ≥ 6 celle da un altro porto;
      - castelli: passi, ponti, confini;
      - villaggi: pianure fertili vicino all'acqua, a ≥ 4 celle tra loro;
      - monasteri e locande: lungo le strade;
      - rovine e covi: boschi e monti lontani.
   7. **Strade**: percorso di costo minimo tra le città vicine (grafo di Delaunay semplificato: le 2–3 più vicine). Dove una strada attraversa un fiume nasce un **ponte**, e il castello più vicino lo controlla.
   8. **Regni**: li assegna W3 (qui solo `R` provvisorio da W3a).
4. **Velocità**: fiume senza ponte ×0,35, ponte e guado ×0,9, strada ×1,4, passo ×0,7, monte non percorribile. Il nord in inverno lo regola W5.
5. **Tempo di generazione** ≤ 500 ms in node per G = 240, con il risultato in cache come oggi.

**Stato e contratti.** `s.geo` (2 = generatore nuovo), `VGEO.genera`, `mappaDi(s)`. Gli id dei luoghi restano indici in `s.l`.

**Prove** (nuovo `tests/test_ven_geografia.js`, 20 semi):
- nessun luogo in acqua o su un monte; tutte le città sono raggiungibili tra loro;
- ogni porto confina con mare o con un lago ≥ 40 celle;
- ogni fiume scende (quota non crescente) e finisce in mare o in un lago;
- ogni dorsale ha ≥ 2 passi; nessuna terra sulle 8 celle del bordo;
- ogni strada che attraversa un fiume ha un ponte;
- stesso seme → stessa mappa; tempo ≤ 500 ms.
- Salvataggi vecchi: `mappaDi` dà la mappa di oggi (impronta di R1 identica).
- Strumento `tools/avventura/mappa-png.js` che scrive un PNG della mappa (terreni, fiumi, luoghi, strade) per 6 semi: le immagini vanno nella PR e le guarda il modello forte.

**Fuori scopo.** Disegno 3D (W2v), regni (W3).

**Fatto quando.** Prove verdi e PNG approvati.
