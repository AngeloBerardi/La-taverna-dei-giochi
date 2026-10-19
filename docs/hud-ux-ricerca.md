# HUD e UX: cosa abbiamo studiato e cosa abbiamo cambiato

## Che cosa è verificato e che cosa no
- **Verificato** (pagine pubbliche di colonist.io, regole ufficiali, guide delle espansioni): regole delle plance 5-6 e 7-8, costruzione speciale, dotazioni di carte e banca di Colonist (tessere, mazzo sviluppo, banca), elenco delle espansioni di Exploding Kittens.
- **Non verificato**: come Colonist disegna la plancia (canvas o DOM) e come sono fatte le app mobile di Exploding Kittens. Non ho potuto ispezionare né il client né il codice; una offerta di lavoro indica solo React/TypeScript/Node. Non traiamo quindi conclusioni tecniche su di loro.
- **Approssimazioni nostre**: numeri e porti del 7-8 (37 esagoni, 12 porti, 35 numeri) e quelli del 5-6 oltre a quanto confermato; il Gattino Implodente a faccia in su resta nel mazzo senza regole speciali per il mescolamento.

## Pattern di HUD dei giochi da tavolo online (convenzioni del genere)
1. Plancia al centro, sempre intera; pezzi che si capiscono da forma + colore, mai solo dal colore.
2. Pannello giocatori compatto con 3-4 numeri al massimo (punti, carte in mano, premi). Il resto a richiesta.
3. Mano in basso, vicino al pollice; azioni di costruzione in una barra con costo visibile.
4. Una frase di stato dice sempre di chi è il turno e che cosa si può fare.
5. Gli avversari fuori turno non bloccano il tuo schermo: le offerte arrivano come card, non come pop-up.

## Cosa è stato applicato
- **Catan 5-8 giocatori**: pannello giocatori a due colonne (solo ★, carte, carte sviluppo e premi; cavalieri e strada più lunga restano visibili quando contano), 8 colori, plancia con viewBox calcolata per ogni mappa, chip "Costruzione speciale", pulsante "Passa" al posto di "Fine turno" e nessuno scambio nella fase speciale.
- **Exploding Kittens 6-10 giocatori**: griglia di avatar a 4 colonne con conteggio carte; chip con verso di gioco e stato del Gattino Implodente; ogni carta nuova ha icona, colore e testo di aiuto.
- Controlli contestuali: la barra mostra solo ciò che la carta selezionata permette (bersagli per Attacco mirato, riordino per Altera il futuro, jolly per il Randagio).

## Proposte non ancora fatte
- Timer del turno con barra visiva (Catan e Kittens).
- Registro delle mosse espandibile con filtri (dadi, costruzioni, scambi).
- Evidenziare sulla plancia i terreni che producono col numero uscito (già c'è il token pulsante) e le risorse guadagnate a fianco di ogni giocatore.
- Modalità "mano grande" per telefono con lo scambio a trascinamento.
- Varianti di Exploding Kittens non fatte: Streaking e Barking (non ho verificato i testi esatti delle carte), Party Pack con Slap e minigiochi in tempo reale, Zombie e Bene contro Male (squadre), Recipes for Disaster, edizioni NSFW/UK (cambiano solo grafica e testi).

## Layout fisso (ottobre 2026)
Perudo, Exploding Kittens, Catan, Power Hungry Pets, Uno e Behind the Throne usano `fixH` (`app/22g-fisso.js`, `css/26-fisso.css`): la pagina è alta quanto lo schermo e non scorre. In alto titolo e chip, poi una striscia compatta di giocatori (avatar, iniziale, badge con carte o punti); al centro il tavolo, che prende lo spazio che resta; in basso messaggio, comandi e mano. Giocatori (elenco completo), registro e regole si aprono dalla barra in fondo come pannelli. La mano di carte è un ventaglio su una o due file che si sovrappone quanto serve (`fanH`). Verificato a 390×844 e 360×640 senza scorrimento verticale né orizzontale. Regicide e Azul hanno un layout a due colonne in orizzontale (`css/32-orizzontale.css`) e non scorrono nemmeno sul telefono girato (844×390); Isola e Discesa tascabile in orizzontale su telefono scorrono ancora (zoom al minimo).

Power Hungry Pets: regole prese dal regolamento pubblicato (21 carte 0-10, 7 gettoni); nomi e grafica sono nostri. Dettaglio non specificato nel regolamento e deciso da noi: nello spareggio a fine mazzo vince la carta scoperta più alta, poi la somma delle carte scoperte, poi pari; il Re dei Gatti costretto dal Serpente Mago elimina senza rivelare altre carte; il 5 può bersagliare anche sé stessi.

## Adattabilità allo schermo
- `adaptScreen` (`app/22g-fisso.js`) a ogni disegno e a ogni resize calcola `--k` (0,7–1,5) da altezza e larghezza e scala carte e pezzi dei giochi a layout fisso (`css/30-adatta.css`).
- Schermi larghi (≥820 px) e telefoni in orizzontale: griglia a due colonne, tavolo a sinistra, messaggio, comandi e mano a destra.
- I giochi non ancora migrati al layout fisso vengono rimpiccioliti con `zoom` quanto basta per non scorrere, fino a un minimo di 0,58 per restare leggibili. Misurato a 390×844, 360×640, 844×390 e 1280×800: tutti senza scorrimento tranne Regicide (71 px) e Azul (138 px) in orizzontale sul telefono.
