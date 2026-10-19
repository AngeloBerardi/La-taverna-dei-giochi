# Catan
**2–8 giocatori** (base 2–4, ampliamenti 5–6 e 7–8) · **60–120 min** · **Tipo**: tavolo, commercio e costruzione · **Licenza/marchio**: marchio protetto: nel gioco il nome è "Catan" solo come riferimento alle meccaniche del celebre gioco di colonizzazione; grafica e testi sono nostri (valutare un nome nostro per la pubblicazione). Motore: `src/js/motori/18-catan.js`, test `tests/test_catan.js` e `tests/test_catan_grande.js`.

## Preparazione
Plancia esagonale (19 esagoni e 9 porti per 2–4; 30 per 5–6; 37 per 7–8, con più porti, banca da 19/24/29 carte per risorsa e mazzo sviluppo più grosso). I numeri 6 e 8 non sono mai adiacenti. A serpentina ognuno posa due colonie con una strada accanto a ciascuna; la seconda colonia dà una risorsa per ogni terreno adiacente. Le colonie stanno ad almeno due strade di distanza.

## Turno
1. **Tiro dei dadi**: ogni terreno col numero uscito dà 1 risorsa per colonia e 2 per città adiacente (se la banca non ha abbastanza carte di una risorsa non la riceve nessuno, salvo che il diritto sia di un solo giocatore: allora prende quelle rimaste).
2. **Commercio**: con la banca 4:1, 3:1 o 2:1 con un porto; con gli altri giocatori scambi liberi (mai la stessa risorsa dai due lati).
3. **Costruzione**: strada (legno+argilla), colonia (legno+argilla+lana+grano, 1★, collegata a una strada), città (2 grano+3 roccia, 2★), carta sviluppo (lana+grano+roccia). Massimo 15 strade, 5 colonie, 4 città.
- **Il 7 e il ladro**: chi ha più di 7 carte ne scarta metà (per difetto); chi ha tirato sposta il ladro (l'esagono smette di produrre) e ruba una carta a caso.
- **Carte sviluppo**: una per turno e non nel turno d'acquisto (il cavaliere anche prima del tiro). Cavaliere, Costruzione strade, Invenzione, Monopolio, Punto vittoria (nascosto).
- **Premi (+2★)**: strada più lunga (almeno 5, spezzata dalle colonie avversarie), esercito più grande (almeno 3 cavalieri).

## Fine partita e punteggio
Si vince appena, nel proprio turno, si raggiungono i punti richiesti (10 di solito), contando i punti vittoria nascosti.

## Varianti
5–6 e 7–8 giocatori con **costruzione speciale**: dopo il turno di ciascuno gli altri, uno alla volta, possono costruire o comprare una carta, ma non scambiare, giocare sviluppi né vincere.

## Casi limite
- Il ladro e gli scarti vanno risolti prima di ogni altra azione dopo un 7.
- Le carte risorsa si conservano sempre tra banca e giocatori (verificato dai test).
- Strada più lunga e esercito si perdono solo se qualcuno li supera.

## Test del motore
1. Geometria della plancia (esagoni, vertici, spigoli, porti, formula di Eulero), numeri 6/8 non adiacenti, preparazione a serpentina. 2. Produzione con limite della banca, ladro e scarti, costruzioni, porti, carte sviluppo, strada più lunga ed esercito, scambi. 3. Partite complete: i giocatori che costruiscono con criterio battono quelli casuali; 5–6 e 7–8 con costruzione speciale.

## Fonti
Regolamento ufficiale del gioco di base e degli ampliamenti 5–6 (meccaniche). **Assunzione dichiarata**: numeri e porti dell'ampliamento 7–8 sono una nostra approssimazione.
