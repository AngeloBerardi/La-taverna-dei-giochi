# Schede di lavoro

Una scheda = una sessione nuova = un ramo = una PR. Si eseguono con `/scheda <id>` (flusso e modelli: `docs/LAVORO.md`).

| Id | Cosa | Stato | Modello per eseguire |
|---|---|---|---|
| `V1-salvataggio-coop` | Salvare e riprendere la partita in compagnia; portare in compagnia la partita in solitario | fatta (PR 118; copia «precedente» nella revisione) | — |
| `V2-tornei` | Tornei nelle città: duelli del capitano, premi unici | fatta (PR 119; ritarata nella revisione) | — |
| `V3-diplomazia` | Alleanze, tregue e guerre decise dal giocatore | fatta (PR 120; contratti scritti nella scheda) | — |
| `V4-regno` | Fondare un regno, vassalli, feudi, vittoria | fatta (PR 123) | — |
| `V5-tattica` | Altura, bosco, case, acqua bassa, formazioni dei gruppi | fatta (PR 126) | Sonnet |
| `V5b-assedio` | Assedio a fasi: scale, breccia, porta con l'ariete | fatta (PR da unire) | Sonnet + Opus (contratto corretto) |
| `V6a-gradimento` | Gradimento dei compagni e addii, memoria e confidenza dei signori, tre talenti | fatta (PR da unire) | Sonnet |
| `V6b-dialoghi` | Motore dei dialoghi (riuso del racconto), incarichi personali in tre passi, la rivale a tappe | fatta (PR da unire) | Sonnet |
| `V6c-testi` | Testi di compagni, signori e rivale, in tre blocchi | pronta (dopo V6b) | forte |
| `V7-tv-musica` | Vista TV della stanza, telefoni come comandi, musica e suoni propri | fatta (PR da unire) | Sonnet |
| `T1-render-stabile` | Niente sfarfallio nei menù, un solo caricamento all'ingresso | fatta (render accodato: il primo ridisegno subito, i successivi nello stesso fotogramma fusi) | Sonnet + revisione forte |
| `T2-stanza-avventura-pulita` | Voto di un altro gioco durante l'Avventura senza viste sovrapposte; zoom che non si blocca | pronta | Sonnet |
| `T3-personaggio-ingresso` | Al primo ingresso nome e personaggio 3D, lo stesso al crocevia e in Taverna | pronta (dopo T1) | Sonnet (separazione di `figura`: forte) |
| `T4-menu-avventura` | Nuovo menù dell'Avventura: Riprendi, due insegne, schede | pronta (dopo T1 e T5) | Sonnet + `artist` |
| `T5-dorso-e-nome` | Dorso classico in bottega; nome nuovo della campagna a capitoli | fatta (nome «Cronache del Crocevia») | Sonnet |

«Pronta» = eseguibile così. «Traccia» = le decisioni di gioco ci sono, ma firme e prove vanno fissate dall'`architetto` leggendo il codice
(una sessione breve col modello forte: «completa la scheda V3»), poi si esegue con Sonnet. Ordine consigliato: V5, V5b, V6a, V6b, V6c, V7. Dopo ogni scheda: le prove lente (`npm test -- ven_`), che `npm run verifica` non lancia.

Il piano della release «Il Condottiero» (Compagnia di ventura) non usa più queste schede: è in `docs/passi/` (46 passi in 12 fasi, regole in `docs/passi/LEGGIMI.md`). La scheda T4 è sostituita dal passo 18.
