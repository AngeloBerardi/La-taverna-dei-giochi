# Uno
**2–10 giocatori** · **10–30 min** · **Tipo**: carte, scarto · **Licenza/marchio**: marchio protetto; nel gioco nomi, grafica e testi sono nostri e le meccaniche sono quelle del celebre gioco di scarto a colori. Motore: `src/js/motori/20-uno.js`, test `tests/test_uno.js`.

## Preparazione
Mazzo da 108 carte (due mazzi, 216, oltre 6 giocatori). 7 carte a testa, si scopre una carta di partenza (mai un jolly né una carta speciale).

## Turno
Si gioca una carta dello **stesso colore o stesso numero/simbolo** di quella in cima, oppure un jolly (con scelta del colore). Se non si può o non si vuole, si pesca: se la carta pescata è giocabile si gioca subito, altrimenti si passa.
- **Salta**: il prossimo salta. **Inverti**: cambia il verso (in due vale Salta). **+2**: il prossimo pesca 2 e salta. **Cambia colore**. **+4**: si sceglie il colore, il prossimo pesca 4 e salta.
- **Sfida al +4** (partita classica): chi lo subisce può sfidare; se chi l'ha giocato aveva in mano una carta del colore precedente pesca lui 4, altrimenti chi sfida ne pesca 6.
- **UNO!**: giocando la penultima carta bisogna dire "UNO" prima; chi se lo dimentica pesca 2.

## Fine partita e punteggio
Si gioca una mano. Chi finisce le carte vince e prende i punti delle carte rimaste agli altri: numeri = valore, Salta, Inverti e +2 = 20, jolly = 50.

## Varianti
**Accumulo** (opzione): un +2 si rimanda con un altro +2 e un +4 con un +4; chi non può risponde pescando tutto. Con l'accumulo il +4 non si sfida.

## Casi limite
- In due giocatori Inverti vale Salta.
- Se il mazzo di pesca finisce, gli scarti (tranne la carta in cima) si rimescolano.
- Con più di 6 giocatori si usano due mazzi (216 carte).

## Test del motore
1. Mazzo (108 o 216 carte, 7 a testa, nessun id duplicato) e giocabilità. 2. Effetti: Salta, Inverti (anche in due), +2, jolly, +4 con sfida, accumulo, UNO dimenticato. 3. Partite complete anche con 10 giocatori e due mazzi.

## Fonti
Regolamento ufficiale del gioco (meccaniche); i punteggi delle carte seguono il testo in-gioco di `RULES.uno`.
