# I Coloni: il Duello
**2 giocatori** · **20–40 min** · **Tipo**: carte, costruzione di un principato · **Licenza/marchio**: marchio protetto (il gioco di riferimento è il duello a carte ambientato nell'isola dei coloni): nel gioco usiamo solo il nome nostro «I Coloni: il Duello»; carte, nomi, testi e grafica sono nostri, le meccaniche (non protette) sono ricostruite dal regolamento pubblico. Motore: `src/js/motori/18d-coloni-duello.js`, test `tests/test_coloni_duello.js`.

## Preparazione
- Ognuno ha un **principato**: 2 colonie unite da 1 strada e 6 **regioni** (legno, argilla, grano, lana, roccia, oro), una sopra e una sotto ogni lato delle colonie (3 sopra, 3 sotto), con numeri diversi da 1 a 6. Ogni regione tiene da 0 a 3 risorse (si ruota la carta); all'inizio 1 risorsa per regione, 0 per l'oro.
- 4 **mazzi di pesca** da 9 carte (27 espansioni e 9 azioni), un mazzo **eventi** da 9 carte (3 coperte in fondo, il Solstizio sopra, le altre sopra ancora), un mazzo di regioni, e i segni del **comando** (forza) e del **commercio**.
- Chi tira il dado più alto comincia. Ognuno pesca 3 carte dalla cima di mazzi diversi.

## Turno
1. **Tiro**: dado di produzione (1–6) e dado evento. Facce dell'evento: banditi (prima della produzione), commercio, festa, raccolto abbondante, evento ×2. Ogni regione col numero uscito guadagna 1 risorsa (la fabbrica adiacente ne dà 1 in più). Poi si risolve l'evento.
2. **Azioni** (in qualsiasi ordine, anche più volte): giocare carte dalla mano (espansioni da pagare, azioni gratis), costruire strade (legno + 2 argilla), colonie (legno, argilla, grano, lana; vanno in fondo a una strada libera e portano 2 regioni nuove), città (3 roccia + 2 grano, sopra una colonia), scambiare 3 risorse uguali con 1 a scelta (2 con una nave del tipo giusto).
3. **Mano**: si pesca (un mazzo a scelta, dalla cima) fino al limite di **3 carte + 1 per ogni punto progresso**; se si ha di più si scartano le eccedenti sotto un mazzo.
4. **Scambio** (facoltativo): una carta in mano sotto un mazzo, poi si pesca la prima di un mazzo a scelta, oppure si pagano 2 risorse qualsiasi per guardare un mazzo e prenderne la carta voluta.

## Banditi, eventi, segni
- **Banditi**: chi ha più di 7 risorse (non contano quelle accanto ai magazzini) perde tutte quelle sulle regioni di lana e oro.
- **Commercio**: chi ha il segno del commercio ruba 1 risorsa all'avversario. **Festa**: chi ha più punti abilità prende 1 risorsa (a pari, 1 a testa). **Raccolto**: 1 risorsa a scelta a testa.
- **Eventi** (9): Solstizio rimescola il mazzo; Faida e Discordia premiano chi ha più forza; Ingegno e Regata premiano progresso e commercio; Mercante errante e Annata d'oro. Dopo l'uso la carta va in fondo al mazzo.
- **Segno del comando** (+1 PV): 3 o più punti forza e più dell'avversario; si perde sotto 3 o se l'avversario sorpassa. **Segno del commercio** (+1 PV): uguale con i punti commercio.

## Fine partita e punteggio
Colonia 1 PV, città 2 PV, ogni segno 1 PV. Vince chi, durante il proprio turno, raggiunge **7 PV** (partita breve) o **12 PV** (partita normale).

## Varianti
Partita breve (7 PV) e normale (12 PV): scelta all'avvio.

## Casi limite
- Una regione non supera mai 3 risorse: il resto si perde.
- Le carte espansione hanno un numero di posti limitato: colonia 2 (1 sopra, 1 sotto), città 4 (2 sopra, 2 sotto).
- Le carte appena pescate non si possono giocare fino al turno successivo (la pesca avviene dopo le azioni).
- Un pareggio di forza o commercio non sposta il segno.

## Test del motore (3)
1. Preparazione e conservazione delle carte (mazzi + mani + scarti = 36 sempre). 2. Produzione, banditi, eventi, costruzioni, scambi, segni e azioni non valide che restituiscono `{err}`. 3. Partite complete: il bot che costruisce con criterio batte quello casuale, fine partita al traguardo.

## Fonti
Regolamento pubblico del gioco di carte per due giocatori ambientato nell'isola dei coloni (base e partite a tema), solo per le meccaniche. **Assunzioni dichiarate**: i 27 pezzi di espansione e i 9 eventi hanno nomi, costi ed effetti nostri; il Municipio è sostituito da una carta con punto abilità; il mazzo regioni è nostro (36 carte, 6 tipi × 6 numeri).

## Riferimento visivo
Componenti: carte verticali per regioni (rettangoli con numero 1–6 in un cerchio e risorse indicate dall'orientamento), carte colonia/strada/città al centro della fila, file di spazi sopra e sotto per le espansioni, due principati affrontati. Colori: legno verde scuro, argilla rosso mattone, grano giallo, lana verde chiaro, roccia grigio-viola, oro ambra. Stile: illustrazioni piatte a colori pieni su carte con bordo chiaro. Foto di riferimento: nessuna copia, solo osservazione del gioco di carte originale pubblicato dal suo editore.
