# Cena con delitto: direzione artistica («il fascicolo»)

La serata ha un'identità sua, diversa dal legno e ottone del resto dell'hub: chi entra deve capire subito di essere dentro un giallo. Codice: `src/css/45a-serata.css` (prefisso `sr-`), pezzi di disegno in `src/js/app/24vb-serata-arte.js` (`SRA`), viste in `24va-serata.js`.

## L'idea
Tutto è un **fascicolo d'indagine**: la TV è il tavolo dell'ispettore visto alla luce di una lampada, il telefono è la cartella personale dell'ospite, la console è il copione del regista.
- **Notte d'inchiostro** per lo sfondo, **carta battuta a macchina** per tutto ciò che è una prova o un segreto, **giallo da copertina** per ciò che conta adesso, **rosso da timbro** per ciò che è riservato, accusato o chiuso.
- Due voci tipografiche: il maiuscoletto dell'hub per nomi e titoli, la macchina da scrivere (`--sr-mono`) per documenti, etichette e orari.
- I colori vengono dal kit (`tema.palette`: fondo, carta, inchiostro, accento, sangue → `--sr-fondo`, `--sr-carta`, `--sr-ink`, `--sr-acc`, `--sr-rosso`); nel CSS ci sono i valori di riserva.

## Regole
1. **Il giallo si usa una volta per schermata**: sul telefono è la scheda «Adesso» (cosa devi fare ora), sulla console il bottone «avanti», sulla TV il momento in corso.
2. **Carta = contenuto della finzione** (prove, segreto, dichiarazioni, verbale del voto). **Scuro = strumenti** (schede, elenchi, navigazione).
3. **La luce dice l'ora**: mattina fredda da sinistra, pomeriggio ambrato dall'alto, sera viola da destra (`sr-m-…`, variabile `--sr-luce`). L'arco del giorno in testata (`SRA.arco`) mostra dove siamo.
4. **Ogni famiglia ha un colore** (`SRA.fam`, in ordine di kit): volti, passi dell'indagine, fili degli scambi.
5. **I sigilli sono ceralacca** (`SRA.sigillo`, simbolo dal kit: orologio, lanterna, chiave, lettera, coltello, moneta, cuore, occhio; altrimenti lucchetto): accesi pulsano, risolti si spezzano in due.
6. **Il tempo è un anello** che si svuota (`SRA.anello`); sotto il minuto diventa rosso.
7. Niente emoji. Animazioni solo per ciò che accade (un foglio che arriva, un timbro, una busta): rispettano «riduci animazioni».
8. Sulla TV le misure sono in `vw` (pensate per 16:9, 1,56vw = 20 px a 1280): niente `px`, così uno schermo 4K non rimpicciolisce il testo.

## Schermate
| Dove | Cosa si vede |
|---|---|
| TV, casting | segnaposto di carta per ogni ospite, il narratore in giallo |
| TV, cast | una colonna per famiglia con i volti |
| TV, mattina | chi parla sotto il riflettore; dichiarazioni come foglietti (accusa col bordo rosso); la prova come foglio fermato col nastro |
| TV, pomeriggio e sera | anello del tempo, scambi tra famiglie come fili rossi, «L'indagine» con i passi di ogni famiglia |
| TV, voto e finale | buste con la ceralacca; nome del colpevole col timbro, ricostruzione numerata, premi |
| Telefono | linguetta col volto, scheda gialla «Adesso», segreto in busta «Riservato», bacheca di sughero con le puntine, prove come foglietti (buste chiuse se solo annunciate), taccuino a righe, verbale d'accusa |
| Console | copione battuto a macchina con la riga in corso su carta, «avanti» giallo a tutta larghezza |

## Non fatto (idee)
Illustrazioni di scena per kit, ritratti dei personaggi, suoni dedicati (timbro, foglio), la modalità classica dei gialli (`24v-giallo.js`) che ha ancora il suo stile.
