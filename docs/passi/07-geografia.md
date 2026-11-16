---
passo: 07
titolo: Un mondo più vasto con una geografia sensata
fase: 3
area: mondo
dopo: [04]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte+visivo
file:
  - src/js/motori/28kg-ven-geografia.js
  - tools/avventura/mappa-png.js
---

# Passo 07 — Un mondo più vasto con una geografia sensata

**In breve.** Terra più grande (192 o 240 celle di lato) con catene e passi, fiumi che scendono al mare o ai laghi, città sulle foci e sulle rive, porti solo su acque navigabili, ponti presidiati. Vale solo per i mondi nuovi.

**Acceso da.** mondi nuovi (`s.geo===2`): con `?ven=mondo2` per provare, per tutti al rilascio 4 (passo 38).

## Scopo

Una terra più grande, che si capisce guardandola.
- Le catene montuose hanno dei passi.
- I fiumi scendono dai monti al mare o ai laghi.
- Le città nascono sulle foci, alle confluenze e sulle rive dei laghi.
- I **porti stanno solo dove c'è acqua navigabile**: mare o lago grande, mai un porto in un laghetto o nell'entroterra.
- I castelli guardano i passi e i ponti.
- Le strade seguono le valli; i confini seguono fiumi e crinali.

## Leggi prima

`docs/passi/04-ganci.md` (`VEN.mappaDi`); `motori/28k-ven-mondo.js`: `mappa` (righe 31–80: altezze, terreni, macchia principale, luoghi, strade), `CENTRI`, `vicinoOk`, `velocita`, `cella`; `app/24hu-ven-mappa.js` (come legge `M.T`, `M.B`, `M.S`, `M.G`).

## Decisioni

1. **File nuovo** `motori/28kg-ven-geografia.js`: `VGEO.genera(seme,opz)` → stesso formato di `mappa` (`{seme,G,T,B,S,R,A,ok,luoghi,covi,…}`) più `F` (fiumi: portata per cella), `LG` (id del lago per cella) e `P` (ponti e guadi). `mappa(seme)` di oggi resta per i mondi senza `s.geo`; il passo 04 ha già portato tutte le chiamate su `VEN.mappaDi`, che qui si estende (punto 6).
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
   8. **Regni**: li assegna il passo 23. Qui `R` è provvisorio: la regione della città più vicina.
4. **Velocità**: fiume senza ponte ×0,35, ponte e guado ×0,9, strada ×1,4, passo ×0,7, monte non percorribile. Il nord in inverno lo regola passo 17.
5. **Tempo di generazione** ≤ 500 ms in node per G = 240, con il risultato in cache come oggi.
6. **Dove vive**: tutto in `28kg-ven-geografia.js`, già creato vuoto dal passo 04. I numeri stanno in `VDAT.GEO`, in testa al file. Il generatore si attacca sostituendo il punto d'estensione: `const prima=VEN.mappaDi;VEN.mappaDi=s=>s.geo===2?VGEO.genera(s.seme,VEN.opz(s)):prima(s)`, con una cache per seme e grandezza. 
7. **Ripetibile**: gli spareggi vanno sempre per indice di cella (code di priorità stabili). Niente funzioni vietate dal passo 04 (per le curve: tabelle o polinomi).

## Stato e contratti

`s.geo` (2 = generatore nuovo), `VGEO.genera`; `VEN.mappaDi` esteso. Gli id dei luoghi restano indici in `s.l`. Nessun file fuori da `28kg` cambia.

## Ordine di lavoro

1. Continente e catene, con il PNG.
2. Laghi e fiumi.
3. Climi.
4. Luoghi.
5. Strade e ponti.
6. Aggancio a `VEN.mappaDi`; prove.

## Prove

`tests/test_ven_p07.js` (20 semi):
- nessun luogo in acqua o su un monte; tutte le città sono raggiungibili tra loro;
- ogni porto confina con mare o con un lago ≥ 40 celle;
- ogni fiume scende (quota non crescente) e finisce in mare o in un lago;
- ogni dorsale ha ≥ 2 passi; nessuna terra sulle 8 celle del bordo;
- ogni strada che attraversa un fiume ha un ponte;
- stesso seme → stessa mappa; tempo ≤ 500 ms.
- Salvataggi vecchi: `mappaDi` dà la mappa di oggi (impronta del passo 01 identica).
- Strumento `tools/avventura/mappa-png.js` che scrive un PNG della mappa (terreni, fiumi, luoghi, strade) per 6 semi: le immagini vanno nella PR e le guarda il modello forte.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

Disegno 3D (passo 14), regni (passi 23 e 27).

## Fatto quando

Prove verdi e PNG approvati.
