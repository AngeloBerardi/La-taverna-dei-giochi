# Accordi della Natura
**Giocatori** 1-4 · **Durata** ~30-45 min · **Tipo** tavolo, pile di dischi e schemi · **Licenza/marchio**: meccaniche ispirate a un gioco di Johan Benvenuto (Libellud, 2024) e alle sue due espansioni (2025-2026). Nomi, animali, schemi, punteggi delle carte, Custodi, Rifugi, Folletti e grafica sono nostri; i titoli originali non si usano.

## Preparazione
120 dischi nel sacchetto: 23 roccia (grigi), 23 acqua (blu), 21 tronco (marroni), 19 chioma (verdi), 19 campo (gialli), 15 tetto (rossi).
Centro: 5 spazi da 3 dischi (3 spazi in solitario). Fila di 5 carte animale scoperte (3 in solitario).
Plancia personale di 23 caselle (righe 5/4/5/4/5). Tutti usano lo stesso lato:
- **A Fiume**: l'acqua vale per il fiume più lungo.
- **B Isole**: l'acqua divide la plancia in isole.
- **C Cratere** (Fortissimo): manca la casella centrale (22 caselle), le case sono più esigenti.
- **D Terre aride** (Fortissimo): 7 caselle aride (angoli, bordi della riga centrale e centro) diventano normali se toccano l'acqua.

## Turno
1. **Obbligatorio**: prendi i 3 dischi di uno spazio del centro e mettili tutti sulla tua plancia.
2. Facoltativo, una volta: prendi una carta della fila (al massimo 4 carte da completare davanti a te, contando Rifugi in costruzione e Custode senza cubetto).
3. Facoltativo, quante volte vuoi: quando lo schema di una carta è sulla plancia (girato o specchiato come vuoi, altezze esatte), metti un cubetto sulla casella indicata. Una casella tiene un solo cubetto animale; sopra un cubetto non si impila più. Carta finita: va da parte e libera il posto.
4. Fine turno: si riempiono lo spazio vuoto del centro e la fila di carte.

**Impilamento**: tutto va su una casella vuota. Roccia su roccia fino a 3. Tronco su tronco fino a 2. Chioma su 0-2 tronchi (albero alto 1-3). Tetto su un solo disco di roccia, tronco o tetto (casa alta 2). Acqua e campo non si impilano e non reggono niente.

## Fine partita e punteggio
La fine scatta quando il sacchetto non basta a riempire il centro, o quando a fine turno un giocatore ha 2 caselle vuote o meno: si finisce il giro, così tutti hanno gli stessi turni.
- **Alberi**: alto 1, 2, 3 → 1, 3, 7 (lato D: solo su caselle normali).
- **Monti**: alto 1, 2, 3 → 1, 3, 7, solo se toccano un altro monte.
- **Campi**: 5 per ogni gruppo di almeno 2 campi vicini (lato D: 6, con almeno un campo su casella normale).
- **Case**: 5 se tra le caselle vicine i dischi in cima hanno almeno 3 colori diversi (lato C: 8 con almeno 4 colori).
- **Acqua, lati A/C/D**: fiume più lungo (percorso più breve tra i suoi estremi) 1→0, 2→2, 3→5, 4→8, 5→11, 6→15, poi +4 a disco.
- **Acqua, lato B**: 5 per ogni isola (gruppo di caselle con dischi, separate dall'acqua).
- **Animali**: il valore dell'ultimo cubetto messo sulla traccia della carta, anche se non finita.
Pareggio: vince chi ha messo più cubetti.

## Varianti (opzione «Preparazione»)
- **Custodi** (incluso nel base): al primo turno scegli 1 tra 2 Custodi. Il suo schema ospita un cubetto; se lo metti, a fine partita vale il suo obiettivo (10 Custodi nostri).
- **Tre Toni** (espansione piccola): 10 animali con schemi a tre paesaggi, asimmetrici: lo specchio diventa decisivo.
- **Fortissimo** (espansione grande), tre moduli combinabili:
  - **Rifugi**: 3 tessere scoperte; una volta per turno ne prendi una (conta nel limite di 4). Permette una pila di 4 dischi altrimenti vietata (es. due acque sopra un monte alto 2), una sola per tessera. Completo: vale 3 punti per ogni casella vicina con in cima uno dei suoi due colori, e può accogliere l'ultimo cubetto di una carta animale del suo colore. Incompleto: nessuna penalità.
  - **Folletti**: 10 carte nel mazzo animali, 2 cubetti ciascuna, schemi piccoli. Il cubetto folletto può stare con un cubetto animale o del Custode: 5 punti; da solo: 2.
  - **Lati C e D** (sopra).
Preparazioni proposte (come quelle consigliate dall'espansione): Rifugi + lato A; Folletti + lato D; Rifugi e Folletti + lato C; tutto + Custodi + lato B.

## Solitario
3 spazi e 3 carte. A fine turno i 6 dischi rimasti vanno nella scatola e si riempiono di nuovo i 3 spazi. Se non hai preso una carta puoi scartarne una della fila. Valutazione in soli: 40, 60, 80, 100, 120, 140 punti → da 1 a 6 soli.

## Casi limite
- Un disco preso che non entra da nessuna parte torna nella scatola a fine turno.
- I Rifugi non sono fiume, monte né campo; per case e altri Rifugi conta il loro disco in cima. Ospitano solo cubetti animali.
- Su una casella con un cubetto (animale o folletto) non si impila.

## Test del motore (3)
`tests/test_accordi.js`: impilamento, 12 orientamenti degli schemi, punteggi su casi a mano per i lati A-D, Rifugi, Folletti, Custodi; 120 dischi conservati; partite in tutte le preparazioni da 1 a 4; errori; bot goloso batte il casuale.

## Fonti
Regolamenti ufficiali del gioco base e delle due espansioni, sul sito dell'editore (www.libellud.com), solo per le meccaniche. L'elenco esatto dei Rifugi originali non è nel testo: i nostri 10 sono inventati sullo stesso principio.
