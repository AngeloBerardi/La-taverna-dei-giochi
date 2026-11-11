# Cena con delitto: direzione artistica («il tascabile giallo»)

La serata ha un'identità sua, diversa dal legno e ottone del resto dell'hub. In Italia un giallo è prima di tutto un libro con la copertina gialla: la serata **è** quel libro. Codice: `src/css/45a-serata.css` (prefisso `sr-`), pezzi di disegno in `src/js/app/24vb-serata-arte.js` (`SRA`), viste in `24va-serata.js`.

## L'idea
- **La TV è la copertina**: giallo pieno, titolo nero in caratteri grassi, e nell'angolo un **tondo rosso** con la vignetta viva della serata.
- **Il telefono è la copia dell'ospite**: testata gialla col suo nome, pagine di carta, segnalibri in basso.
- **La console è il manoscritto del regista**: stessa pagina, testata nera per non confonderla con la copia di un ospite.
- Niente notte, niente macchina da scrivere, niente lente d'ingrandimento: il tono è «giallo brillante», la copertina deve vedersi dal fondo della sala.

## Colori e caratteri
| Nome | Valore di riserva | Uso |
|---|---|---|
| Giallo copertina `--sr-giallo` | `#f6c90e` | fondo della TV, testata del telefono, ciò che è «acceso» |
| Inchiostro `--sr-ink` | `#17130d` | testo, filetti, bordi, blocchi pieni |
| Rosso del tondo `--sr-rosso` | `#d2261c` | il tondo, i bolli delle domande, riservato, accusa, timbro |
| Carta `--sr-carta` | `#f6eeda` | pagine e ritagli |
| Notte `--sr-notte` | `#1c2548` | solo dentro il tondo |

Il kit può cambiarli con `tema.palette` (`accento` → giallo, `inchiostro`, `sangue` → rosso, `carta`, `fondo` → notte).
- **Abril Fatface** (`--sr-tit`) per titoli, nomi e numeri: è la voce della copertina. **Alegreya** (`--sr-libro`) per tutto il testo, corsivo per le note. Niente maiuscole spaziate, niente monospazio.
- I colori delle famiglie (`SRA.COL`) sono pieni e scuri: devono leggersi sul giallo e sulla carta. Il rosso non è mai di una famiglia.

## Regole
1. **Il tondo è l'unica illustrazione** (`SRA.tondo`): uno scoglio col faro. Il cielo dice il momento (mattina chiara, pomeriggio ambra, sera viola, notte prima e dopo), di notte il faro gira, la nebbia scorre. L'anello rosso attorno è il tempo che resta: pieno se non c'è un conto alla rovescia.
2. **Le domande del caso stanno sempre in vista sulla TV** (`SRA.sigillo`): bollo rosso = da scoprire, bollo nero con la spunta e domanda barrata = risolta.
3. **Un solo blocco nero per pagina sul telefono**: «Adesso», cioè che cosa devi fare ora. Sulla console l'unico giallo è la riga in corso e il bottone «avanti».
4. **Carta bianca col bordo = un ritaglio** (prova, dichiarazione, segnaposto): bordo d'inchiostro e ombra piena spostata, come carta stampata. **Tratteggio rosso = riservato**.
5. Le sezioni del telefono sono capoversi: un filetto e un titolo, niente riquadri.
6. Niente emoji. Animazioni solo per ciò che accade (un foglio che arriva, un timbro, una busta) più il faro e la nebbia nel tondo: rispettano «riduci animazioni».
7. Sulla TV le misure sono in `vw` (pensate per 16:9, 1,56vw = 20 px a 1280).

## Schermate
| Dove | Cosa si vede |
|---|---|
| TV, casting | la copertina: titolo, tondo di notte col faro acceso, segnaposto degli ospiti (il narratore in nero) |
| TV, cast | l'elenco dei personaggi, una scheda per famiglia (senza tondo: serve la larghezza) |
| TV, gioco | tondo col cielo del momento e il tempo; al centro chi parla, le dichiarazioni o che cosa fare; a destra «L'indagine» con i passi di ogni famiglia |
| TV, prova mostrata | una pagina strappata, a tutta larghezza |
| TV, voto e finale | buste e conto nel tondo; nome del colpevole col timbro, ricostruzione numerata, premi in nero |
| Telefono | invito = copertina; testata gialla con volto, nome e tondo piccolo col tempo; «Adesso» in nero; segreto col bordo da strappare; prove come ritagli; tavolo delle prove nero con gli spilli; taccuino a righe |
| Console | copione con la riga in corso evidenziata in giallo, «avanti» giallo a tutta larghezza |

## Non fatto (idee)
Una scena del tondo per kit (`tema.scena`: villa, treno, teatro…), ritratti dei personaggi, suoni dedicati (timbro, foglio), prove spezzate che si ricompongono, la modalità classica dei gialli (`24v-giallo.js`) che ha ancora il suo stile.
