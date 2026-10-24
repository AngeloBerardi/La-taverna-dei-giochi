# Cena con delitto
**6–10 giocatori** (dipende dal kit) · **90–120 minuti** · **Gioco di ruolo da tavola, nella stessa stanza** · **Licenza/marchio**: genere libero (murder mystery party); trame, personaggi e testi originali.

## Preparazione
- Serve lo schermo comune (TV o PC) che fa da regia: Impostazioni → Schermo comune, poi «Fai da regista» sulla TV.
- Un telefono con profilo per ogni giocatore (niente ospiti sullo stesso telefono: i segreti sono personali).
- Si propone dallo scaffale scegliendo il kit; con n giocatori entrano i personaggi essenziali e poi i facoltativi del kit.
- La regia assegna i personaggi (a caso) e consegna a ognuno la scheda: storia, segreto, alibi, cosa sa degli altri.

## Turno
Non ci sono turni: la serata è divisa in fasi guidate dalla TV.
1. Prologo letto dalla TV.
2. Atti (di solito tre) con timer: a ogni atto obiettivi e indizi privati nuovi, indizi pubblici sulla TV, eventi a sorpresa.
3. Durante gli atti si parla in personaggio, si interroga, si può mostrare un proprio indizio a un altro giocatore (riceve una copia).
4. Accusa: ognuno vota in segreto chi, come, perché e il miglior attore.
5. Finale: la TV ricostruisce il delitto e mostra voti e punti.

## Fine partita e punteggio
- Colpevole giusto 3, ogni altra risposta giusta 1, obiettivo raggiunto (dichiarato dal giocatore) 1, miglior attore 2 (pari merito: a tutti).
- L'assassino la fa franca se meno della metà degli altri lo indovina: +3.
- Vince chi ha più punti (classifica ELO del gioco come per gli altri).

## Varianti
- Durata: la regia può aggiungere 5 minuti a un atto o passare avanti prima del tempo.

## Casi limite
- Un indizio di un personaggio facoltativo assente va alla sua riserva (essenziale).
- Non si mostra un indizio a se stessi, né una copia ricevuta, né due volte alla stessa persona.
- Si vota solo all'accusa; il voto si può cambiare finché la regia non rivela la verità.
- Se la TV regista si spegne, chi è nella stanza libera la regia e un altro schermo riprende la serata dallo stato salvato.

## Test del motore (3)
`tests/test_giallo.js`: kit validi e kit rotti; da min a max giocatori nessun indizio perso e nessun segreto nel pubblico; investigatori che condividono gli indizi battono quelli che votano a caso, l'assassino la fa franca se nessuno lo scopre.

## Fonti
Formato ispirato ai kit stampabili del genere (schede personaggio, round di indizi, accusa finale): vedi `docs/GIALLI.md`.
