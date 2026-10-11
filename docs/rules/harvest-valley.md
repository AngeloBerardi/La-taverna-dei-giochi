# Harvest Valley
**Giocatori** 2–5 · **Durata** ~25 min · **Tipo** tavolo (piazzamento carte) · **Licenza/marchio**: meccanica libera; nome di terzi
## Preparazione
Griglia condivisa 5×5 (2 e 4 giocatori) o 6×5 (3 e 5). Mazzo terreno, mercato di 3 carte. Una fattoria a testa (2 a testa con 2–3 giocatori).
## Turno
Gioca una fattoria o una carta del mercato in una cella libera ortogonalmente adiacente a una carta già giocata, nei limiti della griglia (la prima al centro). Erbacce: sopra una carta terreno, che torna nel mercato. Trattore: sopra una carta terreno, che viene spinta in una cella libera adiacente.
## Fine partita e punteggio
A griglia piena: corvi mangiano i frutteti adiacenti (anche diagonale), cinghiali gli ortaggi adiacenti. Per ogni fattoria: ortaggi ortogonali (valore), frutteti anche diagonali (valore), +1 per stagno adiacente a ortaggio/frutteto, campo di grano collegato e adiacente = n². Con 2–3 giocatori si sommano le due fattorie; parità: più punti da frutteti.
## Varianti
Carte speciali opzionali (es. Pozzo): non implementate.
## Casi limite
Fine anticipata se mercato e fattorie sono finiti. Il trattore resta sulla griglia come carta inerte.
**Da verificare sulla scatola**: composizione del mazzo e valori (ortaggi 1–3, frutteti 2–4, 5 grani, 3 stagni, 2 corvi, 2 cinghiali, 1 erbacce, 1 trattore) sono ricostruiti.
## Test del motore (3)
`tests/test_harvest.js`: 800 partite casuali 2–5 giocatori terminano senza mosse illegali né stalli.
## Fonti
Recensione Opinionated Gamers (nov 2025) e schede pubbliche; regolamento ufficiale non reperito.
