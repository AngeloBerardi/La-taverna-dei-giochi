# Exploding Kittens (nel gioco: "Gattini Esplosivi")
**2–10 giocatori** · **10–20 min** · **Tipo**: carte, eliminazione · **Licenza/marchio**: marchio protetto: nel gioco nomi, carte e illustrazioni sono nostri; le meccaniche sono ispirate al gioco di carte omonimo. Motore: `src/js/motori/17-gattini.js`, test `tests/test_gattini.js` e `tests/test_gattini_varianti.js`.

## Preparazione
Ognuno riceve 7 carte e 1 Disinnesco (8 in mano). Nel mazzo ci sono tante bombe quanti i giocatori meno uno, più i Disinnesco avanzati (2 fino a 3 giocatori, poi 6 meno il numero di giocatori: nessuno da 6 in su). Oltre 5 giocatori si mescolano due mazzi base: gatti, Niet e carte azione raddoppiano.

## Turno
Si giocano quante carte azione si vuole (anche nessuna), poi si **pesca** e il turno finisce.
- **Bomba**: con un Disinnesco lo si usa e si reinserisce la bomba nel mazzo dove si vuole (in segreto); senza si è eliminati e le carte in mano vanno via.
- **Attacco**: si finisce il turno senza pescare e il prossimo fa due turni (si sommano a catena). **Salta**: si chiude il turno senza pescare.
- **Favore**: il giocatore scelto decide quale carta darci. **Mescola**: si mescola il mazzo. **Preveggenza**: si guardano in segreto le prime tre carte.
- **Niet**: ferma una carta o combinazione appena giocata; si può rispondere con un altro Niet (dispari annulla, pari lascia valere). Non ferma né la bomba né il Disinnesco.
- **Gatti**: da soli non servono. Una coppia uguale ruba una carta a caso; un tris permette di chiederne una per nome.

## Fine partita e punteggio
Vince l'ultimo giocatore non eliminato. Nessun punteggio.

## Varianti
Edizione "Implosione" (opzione nella stanza): Gattino Implodente (la prima volta si rimette nel mazzo scoperto, la seconda si esplode anche con un Disinnesco), Inverti, Pesca dal fondo, Altera il futuro, Attacco mirato, Gatto Randagio (jolly per coppie e tris). Nel gioco base queste carte non esistono e non si possono giocare.

## Casi limite
- Un Attacco su un Attacco somma i turni. Il reinserimento oltre la fine del mazzo viene rifiutato.
- Con Inverti il verso cambia e il turno si chiude senza pescare.
- Tutte le carte sono conservate: nessuna si perde nelle partite complete.

## Test del motore
1. Dotazioni: 8 carte con un Disinnesco, bombe = giocatori − 1, id unici. 2. Pescata: carta normale chiude il turno, bomba con Disinnesco → reinserimento, senza → eliminato; attacco e Niet a catena, favore, coppie e tris. 3. Partite complete a caso (terminano) e un giocatore prudente batte quelli casuali; varianti fino a 10 giocatori e carte dell'Implosione.

## Fonti
Regolamento ufficiale del gioco omonimo (meccaniche, non testi); l'edizione Implosione è una nostra reinterpretazione delle carte, non una riproduzione.
