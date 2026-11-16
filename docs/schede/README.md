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
| `R1-spacca-mondo` | Spezzare `28k-ven-mondo.js` in sei file, impronta identica | pronta (prima di tutto) | Sonnet + revisione forte |
| `R2-spacca-vista` | Spezzare `24hw-ventura.js` e il suo CSS, HTML identico | pronta | Sonnet + revisione forte |
| `U1-hud-mondo` | Numeri con un nome, fogli al 58%, mappa sempre in vista | pronta (dopo R2) | Sonnet + sguardo forte |
| `U2-luogo-e-mercato` | Servizi a griglia, mercato a banco, un solo ottone | pronta (dopo U1) | Sonnet + sguardo forte |
| `U3-incontro` | Faccia a faccia con stendardi, campo e indole | pronta (dopo U1) | Sonnet |
| `U4-hud-battaglia` | Carte dei gruppi con morale, ordini in una fascia, mini-mappa | pronta (dopo B1, meglio dopo B3) | Sonnet + sguardo forte |
| `B1-schieramento` | Schierare i gruppi prima del «Via» | pronta (dopo R1, R2) | Sonnet |
| `B2-dottrine` | Come combattono i cinque regni, indole del comandante | pronta (dopo B1) | Sonnet + **revisione forte** |
| `B3-morale-gruppi` | Morale e rotta per gruppo, raduno, stendardo nemico | pronta (dopo B2) | Sonnet + revisione forte |
| `B4-compagni-in-campo` | Dieci doti di campo e voci in battaglia | pronta (dopo B3) | Sonnet; testi: forte |
| `B5-regia` | Telecamera che racconta, stacchi, rallentatore | pronta (dopo B3, U4) | Sonnet |
| `B6-succo-mischia` | Caduti, polvere, stendardi, frecce, rumore della mischia | pronta (dopo B5) | `artist` Sonnet + sguardo forte |
| `B7-sfida` | Sfida a duello del capo nemico prima della battaglia | pronta (dopo B3, U3) | Sonnet |
| `M1-eserciti` | Eserciti dei regni e adunate | traccia | forte per completarla |
| `M2-feudi-vivi` | Edifici nei feudi | traccia | forte per completarla |
| `M3-affari` | Botteghe e carovane proprie | traccia | forte per completarla |
| `M4-crocevia` | Incontri a scelte sulla strada | traccia | forte (ganci e testi) |

«Pronta» = eseguibile così. «Traccia» = le decisioni di gioco ci sono, ma firme e prove vanno fissate dall'`architetto` leggendo il codice
(una sessione breve col modello forte: «completa la scheda V3»), poi si esegue con Sonnet. Ordine consigliato: V5, V5b, V6a, V6b, V6c, V7. Dopo ogni scheda: le prove lente (`npm test -- ven_`), che `npm run verifica` non lancia.

Release «Il Condottiero» (R, U, B, M): piano, ordine e motivi in `docs/VENTURA-2.md`.
