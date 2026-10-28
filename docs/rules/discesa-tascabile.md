# Dungeon in una Carta
**Giocatori** 1 · **Durata** ~20-40 min · **Tipo** solitario a dadi, dungeon crawler · **Licenza/marchio**: ispirato a One Card Dungeon (Barny Skinner, Little Rocket Games; in Francia Matagot). Nome, mappe, mostri e testi originali; "One Card Dungeon" non si usa.
## Preparazione
Griglia 5×6 con muri e terreni. Eroe: Velocità 1, Attacco 1, Difesa 1, Gittata 2, salute 6 (massimo 6 per tutto). 12 livelli; per ogni avventura 4 mappe, girate di 180° nei livelli 5-8 (come si gira la carta). Prima di scendere: classe e moduli.
## Turno
1. Energia: 3 dadi, uno a Velocità, uno ad Attacco, uno a Difesa (solo per il turno; la Gittata non prende dadi).
2. Avventuriero, in qualsiasi ordine: muoversi (2 punti in ortogonale, 3 in diagonale; non si attraversano muri né mostri) e attaccare (punti Attacco pari alla Difesa del mostro = 1 salute in meno). Serve gittata (misurata come il movimento: ortogonale adiacente 2, diagonale 3) e linea di vista (una linea da un angolo all'altro che non attraversa muri o altri mostri).
3. Mostri, dal più vicino: vanno alla casella libera più lontana da cui sono in gittata e ti vedono, a parità la più vicina da raggiungere; se non c'è, si avvicinano il più possibile. Passano tra loro ma non attraverso te o i muri.
4. Attacco dei mostri: somma dell'Attacco di chi ti vede ed è in gittata, diviso la tua Difesa, per difetto.
## Fine partita e punteggio
Livello ripulito: +1 a una caratteristica oppure cura completa. Vittoria sconfiggendo i mostri del livello 12; sconfitta a 0 salute.
## Varianti
- Classi base (dal regolamento): Paladino, Barbaro, Ranger, Mago.
- Porto delle Ombre (Harbour Clash, dal regolamento): acqua, i mostri in acqua aggiungono i bonus del loro tipo a Velocità/Attacco/Difesa/Gittata; Corsaro (una volta per livello, vai su una casella libera qualsiasi); Clessidra (un'altra fase dell'avventuriero, i mostri saltano la loro).
- Vetta Eterna (Eternal Peak, dal regolamento): bufera, sull'eroe −1 ad Attacco e Difesa base; Sherpa (una volta per livello, muoviti ignorando i muri senza fermarti su un muro); Erbe curative (danni dimezzati per eccesso).
- Oggetti (dal regolamento): se ne pescano 3 e si usano una volta; quelli con l'icona dell'avventura valgono solo lì.
- **Ricostruiti** (regole non pubbliche): classi Monaco, Chierico, Assassino e forzieri dello Scettro Risorge; boss Scettrarca con i comandanti; Soglia Infernale (lava, Esorcista, Guardiano della Soglia, Pietra della Perdizione); gli altri oggetti; tutte le mappe e le statistiche dei mostri.
## Casi limite
Una linea di vista che scorre lungo il bordo comune di due caselle bloccate è bloccata. Il boss ha 2 vite: alla prima sconfitta torna in piedi con +1 Attacco. La Pietra non porta la salute sotto 1.
## Test del motore (3)
`tests/test_discesa.js`: distanze e linea di vista; IA dei mostri (si fermano alla gittata massima) e formula del danno; fuzz con tutte le classi e i moduli nelle 4 avventure; un bot che pianifica arriva quasi sempre al livello 10-12 (vince circa 1 partita su 3 nella base), il casuale si ferma ai primi livelli. Porto e Vetta sono più dure senza la loro classe.
## Fonti
https://www.littlerocketgames.com/wp-content/uploads/2021/05/OCD_rules_ENG.pdf (base) · https://www.littlerocketgames.com/wp-content/uploads/2024/09/OCD_Rules_ADV_1_ENG.pdf (Harbour Clash) · https://www.littlerocketgames.com/wp-content/uploads/2024/09/OCD_Rules_ADV_2_ENG.pdf (Eternal Peak) · https://www.matagot.com/en/expert-games/31-one-card-dungeon-m-guf-yn-returns.html (M'Guf-yn Returns)
