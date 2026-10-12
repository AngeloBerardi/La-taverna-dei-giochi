# Azul
**Giocatori** 2-4 · **Durata** ~30-45 min · **Tipo** tavolo, piastrelle · **Licenza/marchio**: gioco di Michael Kiesling (Next Move / Plan B); nome protetto, da cambiare prima di una pubblicazione pubblica. Grafica originale.
## Preparazione
100 piastrelle (20 per colore) nel sacchetto, 5/7/9 fabbriche da 4 con 2/3/4 giocatori. Segnalino del primo giocatore al centro.
## Turno
Prendi tutte le piastrelle di un colore da una fabbrica (il resto va al centro) o dal centro (il primo prende anche il segnalino, −1 sul pavimento). Mettile in una riga modello: un solo colore per riga e non un colore già posato in quella riga del muro. L'eccesso cade sul pavimento (−1,−1,−2,−2,−2,−3,−3).
## Fine partita e punteggio
A fine round le righe piene posano una piastrella sul muro: 1 punto se isolata, altrimenti piastrelle collegate in orizzontale + in verticale. Finisce quando un muro ha una riga completa. Bonus: riga +2, colonna +7, colore completo +10. Pari: più righe complete.
## Varianti
Muro libero (variante ufficiale): si sceglie la colonna, senza ripetere un colore in riga o colonna; se non c'è posto la riga va sul pavimento.
## Casi limite
Il punteggio non scende sotto 0. Oltre 7 piastrelle sul pavimento le altre vanno nel coperchio. Sacchetto vuoto: si riempie dal coperchio.
## Test del motore (3)
`tests/test_azul.js`: 100 piastrelle sempre presenti, muro classico e libero, 2-4 giocatori; bot goloso vince quasi sempre.
## Fonti
Regolamento di Azul (Next Move Games): https://www.nextmovegames.com
