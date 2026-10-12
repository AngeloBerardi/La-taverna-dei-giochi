# The Gang
**Giocatori** 3-6 · **Durata** ~20 min · **Tipo** coop di carte (poker) · **Licenza/marchio**: gioco di John Cooper e Kory Heath (KOSMOS); nome protetto, da cambiare prima di una pubblicazione pubblica. Testi e arte originali.
## Preparazione
Mazzo francese da 52. 2 carte coperte a testa. 4 file di gettoni (bianchi, gialli, arancio, rossi) da 1 a N stelle.
## Turno
Per ogni round (Pre-Flop, Flop 3 carte, Turn 1, River 1) a turno: prendi un gettone libero, rubalo a un altro, oppure passa (solo se hai un gettone). Il round finisce quando tutti hanno un gettone e tutti passano di fila. Vietato parlare delle carte.
## Fine partita e punteggio
Showdown: le mani si rivelano in ordine di gettone rosso; se ognuna è almeno pari alla precedente il caveau si apre. 3 caveau vittoria, 3 allarmi sconfitta (2 in modalità Maestro).
## Varianti
Base; Avanzata (Sfida dopo un successo, Specialista dopo un fallimento); Professionista (una Sfida fissa); Maestro (due Sfide, niente Specialisti). 10 Sfide e 10 Specialisti, testi originali.
## Casi limite
Nel gioco da tavolo i gettoni si prendono in contemporanea: qui si va a turno, per poter giocare passandosi il telefono. Il Fante dello Specialista "Jack" vale J senza seme. Con "Muscoli" il possessore batte chi ha la sua stessa combinazione.
## Test del motore (3)
`tests/test_the_gang.js`: fuzz in tutte e 4 le modalità con 3-6 giocatori; nessuna carta duplicata; squadra che sceglie i gettoni stimando la propria mano apre più caveau di quella casuale.
## Fonti
https://www.kosmos.de (scheda del gioco, regolamento)
