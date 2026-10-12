# Burraco
**Giocatori** 2 o 4 · **Durata** ~30-60 min · **Tipo** carte (2 mazzi francesi + 4 jolly) · **Licenza/marchio**: gioco tradizionale, libero.
## Preparazione
108 carte. 11 a testa, due pozzetti da 11, una carta scoperta negli scarti. In 4 a coppie. Si gioca a una mano, 1005 o 2005.
## Turno
Pesca dal mazzo o raccogli tutti gli scarti; cala o attacca combinazioni; scarta una carta. Combinazioni: scala (3+ consecutive dello stesso seme, Asso basso o alto) o tris (3+ dello stesso valore), con al massimo un jolly o una pinella (2). Chi finisce le carte prende il pozzetto (al volo se finisce calando), una volta per coppia.
## Fine partita e punteggio
Chiusura (+100) scartando l'ultima carta, con pozzetto preso e almeno un burraco (7+ carte), e la carta scartata non è jolly né pinella. Burraco pulito +200, sporco +100. Carte calate: Jolly 30, pinella 20, Asso 15, 8-K 10, 3-7 5; carte in mano in negativo; pozzetto non preso −100.
## Varianti
Traguardo: una mano, 1005, 2005.
## Casi limite
Non si può restare con una sola carta che non si potrebbe scartare per chiudere. Semplificazione: quando il mazzo finisce, la mano termina subito (nel regolamento classico si va avanti fino a 2 carte con regole locali).
## Test del motore (3)
`tests/test_burraco.js`: 108 carte sempre presenti; mani a 2 e 4 concluse; la coppia di bot che cala e attacca vince contro la coppia casuale.
## Fonti
Regole tradizionali, voce «Burraco» di Wikipedia italiana.
