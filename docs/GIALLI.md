# Cene con delitto (gialli della Taverna)

Una serata giallo nella stessa stanza: la **TV conduce e racconta**, ogni **telefono è il personaggio** di chi gioca. Ispirazione: i kit stampabili venduti online (schede personaggio, indizi a turni, accusa finale). Meccaniche comuni del genere, testi e trame tutti originali.

## Ruoli
| Chi | Cosa fa |
|---|---|
| TV regista (`?tv=CODICE`, poi «Fai da regista») | Unica a scaricare il kit e la soluzione. Assegna i personaggi, consegna schede e indizi (`REGIA.consegna`), legge le richieste dei telefoni, guida atti e timer, raccoglie i voti, mostra il finale. Salva lo stato in `regia/CODICE` per riprendere se si spegne. |
| Telefono (giocatore) | Vede solo ciò che ha in mano (`REGIA.ascoltaMiei`): scheda, segreto, cose da dire per atto, indizi. Chiede alla regia (`REGIA.chiedi`): mostra un indizio a qualcuno, accusa, voto al miglior attore. |
| Documento della stanza (`d`) | Solo la parte pubblica: atto, scadenza del timer, indizi pubblici rivelati, chi ha già votato. |

Rete e regole: `docs/ARCHITECTURE.md` → «Regia». Un telefono per giocatore (niente ospiti sullo stesso telefono): i segreti sono legati al profilo.

## La serata
1. **Stanza**: dal telefono si propone il kit dallo scaffale (voto ✓/✗ come gli altri giochi). Si parte solo se c'è una TV regista collegata e il numero di telefoni è nel range del kit.
2. **Assegnazione**: la TV assegna i personaggi (casuale o scelto in lobby per costumi già decisi) e consegna le schede.
3. **Prologo**: la TV racconta la scena (voce sintetica, musica, testo grande), mostra la vittima e la mappa del luogo.
4. **Atti (di solito 3)**: per ogni atto la TV consegna nuovi indizi privati e ne rivela di pubblici, ognuno ha 1-2 obiettivi da fare in personaggio, timer visibile. Eventi a sorpresa (telegramma, blackout, un personaggio confessa una cosa).
5. **Accusa**: ognuno vota chi, come e perché sul telefono, in segreto. La TV mostra quanti hanno votato.
6. **Finale**: la TV ricostruisce il delitto passo per passo, poi i voti, chi ci ha preso, il miglior attore.
7. **Premi**: monete per accusa giusta, obiettivi riusciti, miglior attore. Niente ELO.

## Mostrare un indizio
Un indizio privato resta di chi lo ha. «Mostra a…» manda una richiesta alla regia, che consegna al destinatario una copia marcata «mostrato da X» (solo lettura). Così si può far vedere senza cedere, come al tavolo vero.

## Formato di un kit (JSON, uno per file)
I kit non entrano in `dist/index.html`: il build li scrive a parte e solo la TV li scarica.
```json
{
  "id": "villa-ombrosa",
  "titolo": "Villa Ombrosa, 1926",
  "giocatori": [6, 10],
  "durata": 120,
  "tono": "classico",
  "prologo": ["testo letto dalla TV", "..."],
  "vittima": { "nome": "...", "ritratto": "..." },
  "luoghi": [{ "id": "biblioteca", "nome": "Biblioteca" }],
  "personaggi": [
    {
      "id": "contessa",
      "nome": "...",
      "essenziale": true,
      "costume": "...",
      "storia": "...",
      "segreto": "...",
      "sa": { "maggiordomo": "cosa sa di lui" },
      "alibi": "dov'era all'ora del delitto",
      "obiettivi": [["atto 1: cosa fare"], ["atto 2"], ["atto 3"]]
    }
  ],
  "atti": [
    {
      "titolo": "...",
      "minuti": 25,
      "narrazione": ["..."],
      "indizi": [{ "id": "i1", "a": "contessa", "testo": "...", "img": null }],
      "pubblici": ["i7"],
      "eventi": [{ "dopo": 10, "testo": "Salta la luce..." }]
    }
  ],
  "soluzione": { "chi": "maggiordomo", "come": "...", "perche": "...", "ricostruzione": ["..."] },
  "domande": [
    { "id": "chi", "testo": "Chi è l'assassino?", "tipo": "personaggio" },
    { "id": "come", "testo": "Con cosa?", "scelte": ["..."] }
  ]
}
```
Personaggi `essenziale: false` si tolgono con meno giocatori: i loro indizi passano a chi indica `riserva`.

## Lavoro, in tre richieste di unione
1. **Rete e regole** (questo ramo): `REGIA`, nodi `regia`/`segreti`/`azioni`, ruolo `r`, test con interprete ed emulatore.
2. **Motore e kit 1**: `motori/NN-giallo.js` (stato della regia puro: assegna, consegna per atto, richieste, voti, punteggio) + test con kit finto e partite simulate; validatore dei kit (ogni indizio ha un destinatario, la soluzione è deducibile dagli indizi); build che copia i kit a parte.
3. **Viste**: TV regista (narrazione, timer, mappa, voti, finale) e telefono (scheda a schede, indizi, mostra a, accusa); voce in scaffale, regole in-game, musica.

## I primi cinque kit
| Kit | Ambientazione | Giocatori | Nota |
|---|---|---|---|
| L'ultima cena alla Taverna | fantasy, la locanda della lobby | 6-10 | leggero, fa da tutorial |
| Villa Ombrosa, 1926 | giallo classico sul lago, eredità e cassaforte | 8-12 | il più «da manuale» |
| Dolce Vita, Roma 1962 | set cinematografico, divi e paparazzi | 6-12 | molti ruoli secondari |
| Il pranzo di Natale | famiglia italiana, testamento della nonna | 6-10 | variante per famiglie: un furto, non un omicidio |
| Delitto in diretta | reality show di oggi | 6-10 | la TV fa la «regia» del programma, confessionali e televoto |
