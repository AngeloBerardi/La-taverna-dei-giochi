# Caccia al Fantasma
**Giocatori** 3–6 · **Durata** ~40 min · **Tipo** inseguimento asimmetrico · **Licenza/marchio**: meccanica libera (fuggitivo nascosto + biglietti); il gioco a cui si ispira ha un nome protetto, qui rinominato; mappa nostra
## Preparazione
Mappa generata in modo deterministico: 72 incroci (8×9), taxi su quasi tutta la griglia, bus e metro su fermate. Posto 0 = Fantasma, gli altri detective; partenze casuali su incroci con almeno 3 strade. Biglietti: detective 10/8/4; Fantasma 4/3/3 + 1 nero per detective + 2 doppie mosse.
## Turno
Il Fantasma muove (di nascosto, si vede solo il biglietto usato; si mostra ai round 3, 8, 13, 18, 24), poi i detective a turno; i biglietti dei detective passano al Fantasma; chi non ha mosse salta.
## Fine partita e punteggio
Detective: arrivano sul Fantasma o lo bloccano. Fantasma: resiste 24 round o nessun detective ha mosse.
## Varianti
Nessuna per ora (possibile: traghetto, mappa più grande).
## Casi limite
Nessuno entra su un detective; solo i detective possono entrare nella casella del Fantasma; la doppia mossa non si usa all'ultimo round.
## Test del motore (3)
`tests/test_fantasma.js`: mappa connessa e simmetrica; biglietti, cattura, rivelazioni, doppia mossa, blocco; detective che vedono il Fantasma (≥90%) e Fantasma abile contro detective a caso (≥80%).
## Fonti
Meccanica generale del genere; mappa, grafica e testi originali.
