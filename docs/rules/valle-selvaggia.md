# Valle Selvaggia
**Giocatori** 1-4 · **Durata** ~30 min · **Tipo** tavolo, costruzione di tessere · **Licenza/marchio**: meccaniche ispirate a Cascadia (Randy Flynn, 2021); nome, testi, punteggi delle carte e grafica originali. Il nome "Cascadia" non si usa.
## Preparazione
105 tessere esagonali: 25 "chiave di volta" (1 habitat, 1 animale) e 80 doppie (2 habitat, 2-3 animali). 100 animali (20 per specie: orso, alce, salmone, falco, volpe). Ognuno parte con 3 tessere a triangolo. Pila: 20 tessere per giocatore + 3 (43 in solitario). Sentiero: 4 coppie tessera + animale.
## Turno
1. (Facoltativo) 3 animali uguali sul sentiero: si possono rimescolare una volta per turno. 4 uguali: si rimescolano da soli.
2. (Facoltativo) Pigna: cambia gli animali scelti del sentiero, oppure prendi tessera e animale da coppie diverse.
3. Prendi una coppia, posa la tessera accanto alla tua valle (rotazione libera, 6 orientamenti).
4. Metti l'animale su una tua tessera libera che lo mostra, oppure lo rimetti nel sacchetto. Su una chiave di volta guadagni una pigna.
## Fine partita e punteggio
Dopo 20 turni a testa. Orsi: coppie isolate 4/11/19/27. Alci: file dritte, ogni alce in una sola fila, 2/5/9/13 per lunghezza 1-4. Salmoni: corsi in cui nessun salmone ha più di 2 vicini salmoni, 2/4/7/11/15/20/26. Falchi: falchi senza falchi vicini, 2/5/8/11/14/18/22/26. Volpi: 1 per ogni specie diversa adiacente. Corridoi: per ogni habitat il gruppo più grande collegato da lati dello stesso habitat, 1 punto a tessera; bonus 2 giocatori +2 (pari +1), 3-4 giocatori +3 al primo e +1 al secondo (pari al primo: +2 a testa), solitario +2 se ≥ 7. Pigne: 1 punto. Pareggio: più pigne.
## Varianti
Nessuna per ora (possibili: altre carte punteggio per specie, modalità famiglia).
## Casi limite
Nessun posto per l'animale preso: torna nel sacchetto e il turno finisce. Due tessere confinano in un corridoio solo se i due lati che si toccano hanno lo stesso habitat.
## Test del motore (3)
`tests/test_valle.js`: punteggi su casi costruiti a mano (coppie di orsi, file di alci, salmoni con bivio, falchi isolati, volpi, corridoi, rotazione); conservazione di tessere e 100 animali; partite da 1 a 4 giocatori concluse con 23 tessere a testa; bot goloso batte il casuale.
## Fonti
Regolamento di Cascadia (Flatout Games / AEG), solo per le meccaniche: https://www.alderac.com/cascadia/
