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
`src/kit/<id>.json` (nome del file = `id`). Il build li valida con `GIALLO.valida`, li scrive a parte in `dist/kit/<id>.<hash>.json` e nella pagina mette solo l'indice (`REGIA.KIT`: titolo, giocatori, durata, url). Solo la TV regista scarica il file (`REGIA.kit(id)`). Esempio completo: `src/kit/ultima-cena.json`.
```json
{
  "id": "ultima-cena", "titolo": "...", "sottotitolo": "...", "giocatori": [6, 10], "minuti": 90, "tono": "leggero",
  "prologo": ["paragrafi letti dalla TV"],
  "vittima": { "nome": "...", "chi": "..." },
  "luoghi": [{ "id": "cantina", "nome": "Cantina" }],
  "personaggi": [{
    "id": "tobia", "nome": "...", "ruolo": "...", "essenziale": true, "costume": "...",
    "storia": "...", "segreto": "...", "alibi": "...",
    "sa": { "bettina": "cosa sa di lei" },
    "obiettivi": [["atto 1"], ["atto 2"], ["atto 3"]]
  }, { "id": "lia", "essenziale": false, "riserva": "orlando", "...": "..." }],
  "atti": [{
    "titolo": "...", "minuti": 20, "narrazione": ["..."],
    "indizi": [
      { "id": "corpo", "a": "tutti", "titolo": "...", "testo": "...", "prova": ["come"] },
      { "id": "fiala", "a": "mirella", "titolo": "...", "testo": "...", "prova": ["chi", "come"] }
    ],
    "eventi": [{ "dopo": 8, "testo": "minuto dell'atto in cui la TV lo annuncia" }]
  }],
  "domande": [
    { "id": "chi", "testo": "Chi ha ucciso...?", "tipo": "personaggio" },
    { "id": "come", "testo": "...", "tipo": "scelta", "scelte": ["...", "..."] }
  ],
  "soluzione": { "risposte": { "chi": "tobia", "come": "..." }, "ricostruzione": ["passi del finale"] }
}
```
Regole che il validatore controlla:
- con `giocatori: [min, max]`: `min` ≥ personaggi essenziali, `max` ≤ personaggi totali. Con n giocatori entrano gli essenziali e poi i facoltativi nell'ordine del file;
- un facoltativo ha una `riserva` essenziale: se non è in gioco, i suoi indizi vanno a lei;
- `a: "tutti"` = indizio pubblico (lo mostra la TV); gli altri vanno al personaggio indicato;
- `prova`: le domande a cui l'indizio contribuisce. Ogni domanda deve avere almeno **due** indizi che la provano (il giallo è risolvibile);
- la risposta a «chi» è un personaggio essenziale; le altre risposte sono tra le `scelte`; gli obiettivi sono uno per atto.

## Motore (`motori/36-giallo.js`, `GIALLO`)
Stato privato della regia (va in `regia/CODICE`): personaggi assegnati, `mano[uid]` (ciò che ognuno ha: scheda, obiettivi `obN`, indizi `i-ID`, copie mostrate `m-ID`), indizi pubblici, voti, punti. La TV consegna `mano[uid]` con `REGIA.consegna` (solo le chiavi nuove o cambiate) e scrive nella stanza `GIALLO.pubblico(s, kit)`, che non contiene segreti né soluzione prima del finale.
- `nuova(kit, [{uid,nome}], {rnd, scelte})`, `act(s, azione, kit, ora)`: `{t:'avanti'}` dalla regia; dai telefoni `mostra {indizio, a}`, `obiettivo {atto, i, fatto}`, `voto {risposte}`, `attore {per}`, sempre con `uid`.
- Punti: chi giusto 3, ogni altra risposta giusta 1, obiettivo fatto 1 (dichiarato dal giocatore), miglior attore 2, l'assassino che la maggioranza non scopre 3.
- Test: `tests/test_giallo.js` (ogni kit, da min a max giocatori: nessun indizio perso, nessun segreto nel pubblico, chi condivide gli indizi ha le prove per tutte le domande, investigatori bravi battono quelli casuali).

## Limite: kit pubblici
Il repo è pubblico e i file dei kit sono statici sul sito: chi va a cercarli di proposito legge la soluzione (come chi sfoglia il libretto del padrone di casa di un kit stampato). La regia protegge dalla sbirciata durante la serata: nessun telefono riceve i segreti degli altri. Per vendere i kit andranno spostati in un repo privato o in uno spazio letto solo dalla regista.

## Lavoro, in tre richieste di unione
1. **Rete e regole** (`feat/gialli-rete`): `REGIA`, nodi `regia`/`segreti`/`azioni`, ruolo `r`, test con interprete ed emulatore.
2. **Motore e kit 1** (`feat/gialli-motore`): `motori/36-giallo.js`, validatore, `src/kit/ultima-cena.json`, build dei kit a parte.
3. **Viste**: TV regista (narrazione, timer, mappa, voti, finale) e telefono (scheda a schede, indizi, mostra a, accusa); voce in scaffale, regole in-game, musica.

## I primi cinque kit
| Kit | Ambientazione | Giocatori | Nota |
|---|---|---|---|
| L'ultima cena alla Taverna | fantasy, la locanda della lobby | 6-10 | leggero, fa da tutorial |
| Villa Ombrosa, 1926 | giallo classico sul lago, eredità e cassaforte | 8-12 | il più «da manuale» |
| Dolce Vita, Roma 1962 | set cinematografico, divi e paparazzi | 6-12 | molti ruoli secondari |
| Il pranzo di Natale | famiglia italiana, testamento della nonna | 6-10 | variante per famiglie: un furto, non un omicidio |
| Delitto in diretta | reality show di oggi | 6-10 | la TV fa la «regia» del programma, confessionali e televoto |
