# Machiavelli
**Giocatori** 2-5 · **Durata** ~20-40 min · **Tipo** carte (2 mazzi francesi + 4 jolly) · **Licenza/marchio**: gioco tradizionale italiano, libero.
## Preparazione
108 carte, 13 a testa, il resto è il mazzo.
## Turno
Cala carte dalla mano e riorganizza liberamente il tavolo (spezzare, unire, riprendere un jolly sostituendolo), purché alla fine ogni combinazione sia valida, tutte le carte del tavolo restino in gioco e almeno una carta sia tua. Combinazioni: tris o quartetti di semi diversi; scale di 3+ carte dello stesso seme (Asso basso o dopo il Re, K-A-2 no). Se non giochi, peschi una carta.
## Fine partita e punteggio
Vince chi finisce le carte. Se il mazzo è finito e tutti passano di fila, vince chi ha meno carte.
## Varianti
Nessuna (possibili: niente jolly, apertura minima).
## Casi limite
In un tris non si possono avere due carte dello stesso seme (con 2 mazzi capita). Il pulsante «Suggerisci» usa un solutore con limite di tempo: se non trova nulla, ripiega su calate dalla sola mano.
## Test del motore (3)
`tests/test_machiavelli.js`: 108 carte sempre presenti, tavolo sempre valido, partite a 2, 3, 5 concluse; bot col solutore vince contro chi cala solo dalla mano.
## Fonti
Regole tradizionali, voce «Machiavelli (gioco di carte)» di Wikipedia italiana.
