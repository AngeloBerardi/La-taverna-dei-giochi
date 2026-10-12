# L'isola dei predatori
**Giocatori** 1 · **Durata** ~10 min · **Tipo** solitario · **Licenza/marchio**: ispirato a Food Chain Island di Scott Almes (Button Shy); nome, animali e testi originali.
## Preparazione
16 animali di terra di valore 0-15 in griglia 4×4 casuale, più squalo e balena da usare una volta. Area di gioco 6×6.
## Turno
Sposta un animale di 1 casella in orizzontale o verticale sopra un animale che vale da 1 a 3 in meno: si impila e la pila vale la carta in cima. Poi si applica il potere dell'animale che ha mangiato (spostamenti, eliminazioni, scambi, o vincoli per il turno dopo: diagonale, salto, due caselle, solo valore −1, niente Orso polare). Squalo: mangia un valore qualsiasi minore spostandosi di 1. Balena: sposta un animale in una casella vuota.
## Fine partita e punteggio
Quando non si può più mangiare: 1 animale rimasto grande vittoria, 2 bella, 3 di misura, 4+ sconfitta.
## Varianti
Senza squalo, senza balena o senza entrambi (più difficile).
## Casi limite
Un potere che non si può applicare si salta. Le caselle fuori dalla griglia iniziale, dentro l'area 6×6, sono utilizzabili. Il Coccodrillo resta nella sua casella e mette la preda sotto di sé.
## Test del motore (3)
`tests/test_isola.js`: partite con 0, 1 e 2 animali d'acqua sempre concluse; una ricerca in profondità vince la maggior parte delle partite, il casuale quasi mai.
## Fonti
Food Chain Island, Button Shy Games: https://buttonshygames.com
