# Behind the Throne (2–4 giocatori)

Meccaniche del gioco di carte omonimo; nomi, grafica e testi sono nostri. Motore: `src/js/motori/21-trono.js`, test `tests/test_trono.js`.

- Mazzo: 9 personaggi × (5 copie in 2 giocatori, 7 in 3, 9 in 4) + carta "Fine del regno", che parte negli scarti.
- Turno: si rivelano fino a 5 carte in fila, ciascuna con valore più basso della precedente (dopo i poteri), altrimenti la fila salta. Poi si **raccoglie** (mazzetti per personaggio, max 5 mazzetti da 5 carte, altrimenti si scarta) oppure si **scambia** (la fila va a un avversario, si prende una sua carta).
- Pari con la precedente: si può distruggere una carta dai mazzetti (un bersaglio per giocatore per turno).
- Poteri solo per chi ha il mazzetto più grosso (a pari tutti), una volta a turno: Generale −3, Assassino −2, Giullare ±1, Profeta guarda il mazzo, Giudice ripete un potere già usato.
- Limiti: Re (niente scambio con meno carte in fila di quanti Re), Regina (niente distruzione con meno di Regine+1 carte), Menestrello (si scambia solo lui), Alchimista (si distrugge solo lui).
- Fine: appena esce "Fine del regno"; ogni mazzetto di almeno 2 carte vale il valore del personaggio.

## Assunzioni (non verificate sul regolamento originale)
- Valori: Re 9, Regina 8, Giullare 6, Giudice 5 confermati; Generale 7, Assassino 4, Profeta 3, Menestrello 2, Alchimista 1 sono una nostra assegnazione.
- Primo giocatore a caso; "Rinuncia" fa saltare la fila di propria scelta; il Profeta si può usare anche a fila vuota.
