# Trivia a Spicchi
**Giocatori** 2–6 · **Durata** ~30 min · **Tipo** domande su percorso · **Licenza/marchio**: meccanica libera; il quiz da tavolo a cui si ispira ha un nome protetto, qui rinominato
## Preparazione
Anello di 42 caselle: spicchio ogni 7 caselle (6 categorie), «Rilancia» alle caselle 3, 10, 17…, il resto caselle di categoria. 120 domande nostre (20 per categoria) a 4 risposte. Tutti partono da uno spicchio.
## Turno
Dado 1–6, si va avanti o indietro (due caselle possibili). Domanda della categoria della casella: giusta = si tira ancora (e su uno spicchio nuovo lo si guadagna), sbagliata = passa il turno.
## Fine partita e punteggio
Con 6 spicchi si va al centro: il giocatore dopo sceglie la categoria della domanda finale; giusta = vittoria, sbagliata = si riparte dallo spicchio 0 e passa il turno.
## Varianti
Nessuna per ora.
## Casi limite
Le domande non si ripetono finché ne restano nella categoria. Tutte le informazioni sono pubbliche (niente copertura).
## Test del motore (3)
`tests/test_quiz.js`: struttura del percorso e del banco; dado/direzione/risposte/rilancia/spicchio/finale; bot sicuro (vince ≥90%) contro bot casuale.
## Fonti
Domande scritte da noi, fatti controllabili.
