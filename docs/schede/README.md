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
| `T4-menu-avventura` | Nuovo menù dell'Avventura: Riprendi, due insegne, schede | sostituita da W1 | Sonnet + `artist` |
| `T5-dorso-e-nome` | Dorso classico in bottega; nome nuovo della campagna a capitoli | fatta (nome «Cronache del Crocevia») | Sonnet |
| `R1-spacca-mondo` | A · Spezzare `28k` in sei file, impronta identica | pronta (prima di tutto) | Sonnet + revisione forte |
| `R2-spacca-vista` | A · Spezzare `24hw` e il CSS, HTML identico | pronta | Sonnet + revisione forte |
| `B0-battaglie-grandi` | B · Fino a 110 per lato, griglia, campi più grandi, taglia nel mondo | pronta (dopo R1) | Sonnet + revisione forte |
| `B1-schieramento` | B · Reparti, settori, ondate con ingresso e momento | pronta (dopo B0) | Sonnet + revisione forte |
| `B3-morale-gruppi` | B · Morale per reparto, fatica, frecce, stendardo nemico | pronta (dopo B1) | Sonnet + revisione forte |
| `B2a-consiglio-di-guerra` | B · IA a manovre, ranghi 0–2, dottrine e indole come pesi | pronta (dopo B3) | Sonnet + **revisione forte** |
| `B2b-manovre-da-comandante` | B · Ranghi 3–4: altura, riserve, aggiramento, esca, caccia al capitano | pronta (dopo B2a) | Sonnet + **revisione forte** |
| `B2c-maestro-di-guerra` | B · Rango 5: memoria delle tue tattiche, finta rotta | pronta (dopo B2b, B9) | **forte** |
| `B9-rango-comandanti` | C · Rango 0–5 nel mondo, esperienza, ricompense | pronta (dopo R1) | Sonnet |
| `B8-prima-della-battaglia` | C · Esplorazione, scelta del campo, alba/notte, imboscata, pali, retroguardia | pronta (dopo B9, B1) | Sonnet + revisione forte |
| `B7-sfida` | C · Sfida a duello del capo nemico | pronta (dopo B3, U3) | Sonnet |
| `U1-hud-mondo` | E · Numeri con un nome, fogli al 58% | pronta (dopo R2) | Sonnet + sguardo forte |
| `U2-luogo-e-mercato` | E · Servizi a griglia, mercato a banco | pronta (dopo U1) | Sonnet + sguardo forte |
| `U3-incontro` | D · Faccia a faccia, anteprima e scelte generiche | pronta (dopo R2) | Sonnet |
| `B1v-schieramento-vista` | D · Il tavolo dello schieramento e il foglio delle ondate | pronta (dopo B1) | Sonnet + sguardo forte |
| `U4-hud-battaglia` | D · Carte dei reparti, ondate, mini-mappa | pronta (dopo B1v) | Sonnet + sguardo forte |
| `B0v-grandi-schiere-vista` | D · Tre livelli di dettaglio, vista del comandante | pronta (dopo B0) | Sonnet + sguardo forte |
| `B5-regia` | D · Telecamera che racconta, stacchi, fronte più caldo | pronta (dopo U4, B0v) | Sonnet |
| `B6-succo-mischia` | D · Caduti, polvere, stendardi, frecce, rumore | pronta (dopo B5) | `artist` Sonnet |
| `B4-compagni-in-campo` | B/F/D · Doti di campo e voci (tre PR) | pronta (dopo B3) | Sonnet; testi: forte |
| `W0-mappa-bloccata` | H · La mappa del mondo non esce più dalla terra | pronta (subito) | Sonnet |
| `W1-menu-e-nuova-campagna` | E · La Compagnia in primo piano, Nuova campagna con difficoltà, niente scelta del regno | pronta (dopo R2) | Sonnet + sguardo forte |
| `W2-geografia` | H · Mondo 192/240, monti con passi, fiumi, laghi, porti su acque navigabili, ponti | pronta (dopo R1) | Sonnet + **revisione forte** |
| `W2v-mappa-grande-vista` | H · Terreno a tasselli, acque, ponti, vista lontana, nebbia | pronta (dopo W2, W0) | Sonnet + sguardo forte |
| `W3-regni-che-si-accorpano` | H · W3a regni nello stato, W3b 9–12 regni, W3c unificazione (tre PR) | pronta (dopo W2; W3a è un cantiere su C) | Sonnet + **revisione forte** |
| `W4-la-sorte` | H · Partenza in un punto a caso con un aggancio | pronta (dopo W1, W3b) | Sonnet; testi: forte |
| `W5-stagioni` | H · Quattro stagioni: consumi, marce, prezzi, guerre, neve | pronta (dopo R1, W1) | Sonnet + revisione forte |
| `W6-economia` | C · Produzione, scorte, razzie e prezzi, costo dell'esercito | pronta (dopo W5) | Sonnet + **revisione forte** |
| `X4-accendi-mondo-nuovo` | G · Rilascio «Nuova campagna» (solo partite nuove) | dopo W1–W5 | Sonnet + revisione forte |
| `X1-accendi-grandi-battaglie` | G · Rilascio 2 | dopo B0, B1, B3, B1v, U4, B0v | Sonnet |
| `X2-accendi-comandanti` | G · Rilascio 3 | dopo X1, B2a, B2b, B9, B8 | Sonnet + revisione forte |
| `X3-accendi-eserciti` | G · Rilascio 4 | dopo M1, X2 | Sonnet |
| `M1-eserciti` | C · Eserciti e adunate | traccia | forte per completarla |
| `M2-feudi-vivi` | C · Edifici nei feudi | traccia | forte per completarla |
| `M3-affari` | C · Botteghe e carovane proprie | traccia | forte per completarla |
| `M4-crocevia` | C/F · Incontri a scelte sulla strada | traccia | forte (ganci e testi) |

«Pronta» = eseguibile così. «Traccia» = le decisioni di gioco ci sono, ma firme e prove vanno fissate dall'`architetto` leggendo il codice
(una sessione breve col modello forte: «completa la scheda V3»), poi si esegue con Sonnet. Ordine consigliato: V5, V5b, V6a, V6b, V6c, V7. Dopo ogni scheda: le prove lente (`npm test -- ven_`), che `npm run verifica` non lancia.

Release «Il Condottiero»: piano, binari (A–G), interruttori e rilasci in `docs/VENTURA-2.md`. La lettera all'inizio della descrizione è il binario.
