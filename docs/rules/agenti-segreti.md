# Parole in Codice
**Giocatori** 4–10 · **Durata** ~15 min · **Tipo** parole a squadre · **Licenza/marchio**: meccanica libera (genere "indizio + parole"); il gioco di terzi a cui si ispira ha un nome protetto, qui rinominato
## Preparazione
25 parole a caso da un elenco nostro di ~300 parole italiane. Chiave segreta: 9 parole della squadra che comincia, 8 dell'altra, 7 neutre, 1 trappola. Posti pari = Rossi, dispari = Blu; il posto 0 è la spia dei Rossi, il posto 1 la spia dei Blu.
## Turno
La spia scrive un indizio (una parola) e un numero 0–9. Gli agenti della squadra, uno per volta a rotazione, toccano parole: giusta = si continua, fino a numero+1 tentativi (0 = illimitati); neutra o dell'altra squadra = turno chiuso; trappola = sconfitta immediata. Si può fermarsi dopo almeno un tentativo.
## Fine partita e punteggio
Vince chi scopre tutte le proprie parole o chi vede l'altra squadra toccare la trappola (anche per le parole dell'altra squadra scoperte dagli avversari).
## Varianti
Nessuna per ora (possibile: tempo limitato all'indizio).
## Casi limite
Indizio uguale o contenuto (>3 lettere) in una parola ancora sul tavolo: rifiutato. Una sola spia vede la chiave: sul telefono condiviso si usa la copertura «passa il telefono».
## Test del motore (3)
`tests/test_spie.js`: composizione 9/8/7/1 con parole uniche; indizi non validi, trappola, fine turno; bot con la chiave (vince ~100%) contro bot casuale (~50% a parità).
## Fonti
Meccanica generale del genere; parole, grafica e testi originali.
