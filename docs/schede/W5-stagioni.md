# W5 — Le stagioni

**Binario** H (motore delle stagioni e mappa). **Dopo** R1 e W1 (legge `opz.stag`). Nei mondi vecchi le stagioni sono spente (`s.anno` assente): si accendono con X4, solo per i mondi nuovi. Modello: Sonnet + revisione forte.

**Scopo.** L'anno gira e cambia il modo di giocare. In inverno si mangia di più, si marcia piano, i passi del nord si chiudono e si sverna nelle città. In primavera si recluta e partono le guerre. In estate si combatte. In autunno si raccoglie, i prezzi del grano scendono e si fa scorta.

**Leggi prima.** `motori/28k*`: il tempo (`giorno`, `ora`, `meteo`), i viveri (consumo per giorno), `velocita`, `giornoNuovo` (IA delle guerre), i prezzi; `app/24hu-ven-mappa.js` (colori del terreno, meteo); la scena di battaglia (`scena.meteo`).

**Decisioni già prese.**
1. **Calendario**: anno di 4 stagioni da 28 giorni (`VDAT.STAG`, numeri qui). Si parte all'inizio della primavera. `VEN.stagione(s)` → `{k:'prim'|'est'|'aut'|'inv',g,anno}`.
2. **Effetti** (moltiplicati da `opz.stag`: miti 0,5 / normali 1 / rigide 1,5 sullo scarto dal valore base):
   | | Primavera | Estate | Autunno | Inverno |
   |---|---|---|---|---|
   | consumo di viveri | ×1 | ×1 | ×0,9 | ×1,5 |
   | foraggio dei cavalli | ×0,8 | ×0,8 | ×1 | ×1,6 |
   | marcia | ×1 | ×1,05 | ×0,95 | ×0,75 (neve ×0,5) |
   | prezzo del grano | ×1,1 | ×1 | ×0,7 | ×1,4 |
   | reclute disponibili | ×1,4 | ×1 | ×1 | ×0,6 |
   | guerre nuove dell'IA | ×1,5 | ×1,2 | ×0,8 | ×0,3 |
   | meteo | piogge | sereno e caldo | nebbie | neve al nord e sui monti |
3. **Neve**: in inverno le celle sopra una quota, o oltre una certa latitudine (mondi `geo===2`), sono «innevate»; i passi oltre una quota si chiudono (non percorribili) fino a primavera. I laghi del nord gelano: si attraversano, ma i porti su quei laghi sono chiusi.
4. **Svernare**: riposare in una città in inverno costa le paghe, ma il morale non scende e i feriti guariscono il doppio; accampati all'aperto in inverno il morale scende di 2 al giorno.
5. **Battaglie**: la stagione dà la scena (neve: terreno bianco, cavalli −15% di velocità; estate: fatica +20% a mezzogiorno, con B3).
6. **Vista**: icona e nome della stagione nella barra alta (tocco su U1, 10 righe nel binario E); colori del terreno per stagione (tinta sul materiale, nessuna texture nuova); neve sulle celle innevate; avviso tre giorni prima dell'inverno («L'inverno è alle porte: fai scorta»).

**Stato e contratti.** `s.anno` (giorno d'inizio del calendario; assente = stagioni spente). `VEN.stagione`, `VEN.molt(s,k)` (moltiplicatore della stagione e della difficoltà per la voce `k`). Ogni consumo, prezzo e velocità di oggi si moltiplica per `molt` (che vale 1 se le stagioni sono spente).

**Prove** (`tests/test_ven_stagioni.js`):
- senza `s.anno` l'impronta è identica;
- con `s.anno`: il consumo di 10 uomini in inverno è 1,5× quello estivo; un passo alto non è percorribile in inverno e lo è in primavera;
- le guerre nuove del bot in un anno sono più in primavera ed estate che in inverno;
- bot di 2 anni con Condottiero: nessun seme in rovina; con Leggenda + stagioni rigide almeno un seme su 6 soffre la fame (prova che la leva morde);
- screenshot della mappa in inverno a 390 px.

**Fatto quando.** Prove verdi e una sezione «Le stagioni» nelle regole.
