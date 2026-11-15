# Schede di lavoro

Una scheda = una sessione nuova = un ramo = una PR. Si eseguono con `/scheda <id>` (flusso e modelli: `docs/LAVORO.md`).

| Id | Cosa | Stato | Modello per eseguire |
|---|---|---|---|
| `V1-salvataggio-coop` | Salvare e riprendere la partita in compagnia; portare in compagnia la partita in solitario | fatta (PR 118; copia «precedente» nella revisione) | — |
| `V2-tornei` | Tornei nelle città: duelli del capitano, premi unici | fatta (PR 119; ritarata nella revisione) | — |
| `V3-diplomazia` | Alleanze, tregue e guerre decise dal giocatore | fatta (PR 120; contratti scritti nella scheda) | — |
| `V4-regno` | Fondare un regno, vassalli, feudi, vittoria | pronta | Sonnet |
| `V5-tattica` | Altura, bosco, formazioni, assedio a fasi | traccia | forte, poi Sonnet |
| `V6a-gradimento` | Gradimento dei compagni e addii, memoria e confidenza dei signori, tre talenti | pronta | Sonnet |
| `V6b-dialoghi` | Motore dei dialoghi (riuso del racconto), incarichi personali in tre passi, la rivale a tappe | pronta (dopo V6a) | Sonnet |
| `V6c-testi` | Testi di compagni, signori e rivale, in tre blocchi | pronta (dopo V6b) | forte |
| `V7-tv-musica` | Vista TV della stanza, musica e suoni propri | traccia | Sonnet (musica: forte per il primo tema) |

«Pronta» = eseguibile così. «Traccia» = le decisioni di gioco ci sono, ma firme e prove vanno fissate dall'`architetto` leggendo il codice
(una sessione breve col modello forte: «completa la scheda V3»), poi si esegue con Sonnet. Ordine consigliato: V4, V5, V6a, V6b, V6c, V7. Dopo ogni scheda: le prove lente (`npm test -- ven_`), che `npm run verifica` non lancia.
