# Power Hungry Pets
**2–6 giocatori** · **10–15 min** · **Tipo**: carte, eliminazione a round · **Licenza/marchio**: marchio protetto; nel gioco nomi, grafica e testi sono nostri (le meccaniche sono quelle del gioco omonimo). Motore: `src/js/motori/19-pets.js`, test `tests/test_pets.js`.

## Preparazione
Mazzo di 21 carte numerate da 0 a 10 (un Re dei Gatti 10, un solo 9, 8, 7, 6 e 0; due 5 e due 4; tre 3 e tre 2; cinque 1). Si dà una carta a testa e si mette da parte una carta coperta (in due giocatori anche due carte scoperte). Si vince raccogliendo gettoni: **3** in 2–3 giocatori, **2** in 4–6.

## Turno
Si pesca (si hanno due carte), si **gioca una carta a faccia in su** applicandone subito l'effetto e si **tiene l'altra** in segreto. Le carte giocate restano davanti al giocatore.
- **10 Re dei Gatti**: chi lo gioca è eliminato. **9**: chi ha il Re lo scambia con la tua carta (se lo hai tu, niente). **8**: scambi la tua carta con quella di un giocatore a scelta. **7**: tutti rimettono la carta nel mazzo e ne ricevono una nuova.
- **6**: guardi la carta messa da parte e puoi scambiarla. **5**: un giocatore gioca la sua carta senza effetto e ne pesca un'altra (se era il Re è eliminato). **4**: la tua carta è protetta fino al tuo prossimo turno (blocca 1, 3, 5, 7, 8, 9).
- **3**: confronti in segreto la tua carta con quella di un giocatore: il più basso è eliminato (pari: nessuno). **2**: guardi la prima carta del mazzo e la rimetti dove vuoi. **1**: nomina un numero (non 1): chi lo ha è eliminato. **0**: a fine round batte il Re dei Gatti.

## Fine partita e punteggio
Il round finisce quando resta un solo giocatore o quando il mazzo è finito: vince la carta più alta; a parità vince chi ha giocato la carta scoperta più alta. Il vincitore prende un gettone; la partita finisce al raggiungimento dei gettoni richiesti.

## Varianti
Nessuna.

## Casi limite
- Chi ha il Re non lo scambia con sé stesso (carta 9).
- Una carta 4 attiva protegge da 1, 3, 5, 7, 8 e 9; gli altri effetti valgono normalmente.
- Le carte restano 21 in totale (verificato dai test).

## Test del motore
1. Preparazione (21 carte, gettoni per numero di giocatori). 2. Un test per carta: Re, 9, 8, 7, 6, 5, 4 (scudo), 3, 2, 1, 0. 3. Fine mazzo, spareggi, gettoni e partite complete.

## Fonti
Regolamento ufficiale del gioco omonimo (meccaniche). Le **assunzioni** sui casi limite (pari alla carta 3, spareggio sulla carta scoperta più alta) seguono il testo in-gioco di `RULES.pets`.
