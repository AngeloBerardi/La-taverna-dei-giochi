# A5 — Battaglia tattica (vista telefono): piano dettagliato

Piano breve in `docs/AVVENTURA.md` (A5, 7 punti). Qui lo porto a sotto-step eseguibili, con le scelte che prendo io (e che puoi cambiare), i file, i test e i criteri di fine. Il motore (`ASCO`, `AIA`) è fermo: **A5 non cambia nessuna regola**, disegna lo stato, raccoglie i tocchi e li traduce in `ASCO.act`.

> **Stato (29 ottobre 2026): fatta.** Differenze rispetto al piano: l'arena sta tutta a 1× e si ingrandisce fino a 3× (non 0,8–2,4×); il registro e la scheda della creatura sono sovrapposti alle fasce libere sopra e sotto la mappa (la mappa a 390 px è quasi quadrata), non fogli che la coprono; la barra in basso della Plancia sparisce durante la battaglia; i mostri sono 23 compresi i 3 capi; le animazioni stanno in `24hf-bat-anima.js` (`BatAnima`). Il resto è come scritto qui sotto.

## 0. Cosa c'è già e cosa manca
- Dal motore (A4): stato JSON, `ASCO.mosseValide(s)` (esagoni raggiungibili con costo, attacchi con percentuali, azioni speciali, poteri con bersagli/centri/direzioni, oggetti), `ASCO.anteprima(s, azione)` (probabilità di colpire, di critico, danno per colpo, atteso, copertura, vantaggio/svantaggio), `act` che torna `{s, ev}`, `{err}` o `{pausa}` (reazione da scegliere, ripresa con `dec`), `riepilogo`, `AIA.prossima` per i turni dei nemici.
- Dall'app: l'ossatura delle finestre dell'Avventura (`ui.avv`, `ui.camp`, `Plancia.chiudi`, `cfgH` in `07d-viste-comuni.js`, un solo `switch` in `07c-comandi.js`), i ritratti degli eroi (`Eroi.ritratto`), le icone (`ic`, `glifo`), la mappa a esagoni della campagna (`Camp.hex`, stesse punte in alto) e il test nel browser con Firebase simulato.
- Manca tutto ciò che si vede: disegno dell'arena, segnalini, tocchi, pannelli, animazioni, ingresso in battaglia. Nella storia (A7–A8) gli incontri partiranno dalla campagna; in A5 l'ingresso è **«Battaglia di prova»** dalla pagina Avventura.

## 1. Scelte che fisso io
| # | Scelta | Perché |
|---|---|---|
| V1 | **SVG, non canvas né 3D.** Esagoni a punta in alto come in campagna, schiacciati in verticale (×0,84) per dare una vista «leggermente inclinata»; rialzi, muri e ostacoli hanno uno spessore disegnato (2,5D). | Il tocco resta preciso (si calcola l'esagono dalle coordinate, non dall'elemento), nessuna libreria, pochi nodi (≈100 celle). |
| V2 | **Tocca per selezionare, tocca ancora (o «Conferma») per eseguire.** Mai una mossa per un solo tocco. | Regola del piano A0 e unico modo sicuro con le dita. |
| V3 | **Il controllo dei tocchi è un modulo puro** (`ACOM` in `motori/27l`), senza DOM: tiene la selezione e traduce i tocchi in azioni di `ASCO.act`. | Si prova in node: un bot guida intere battaglie «a tocchi». La vista disegna e basta. |
| V4 | **Le frasi del registro e i passi di animazione sono un modulo puro** (`ACRO` in `motori/27k`): ogni evento del motore → una frase italiana e una lista di effetti. | Un test controlla che *ogni* tipo di evento abbia frase (niente «undefined» nel registro). |
| V5 | **Zoom e scorrimento con eventi puntatore** (un dito trascina, due dita pizzicano; niente doppio tocco, che confliggerebbe con la conferma: c'è il pulsante «Centra» e i pulsanti + e −). All'inizio l'arena sta tutta in 390 px (esagono ≈ 40 px); da ingrandita la vista segue chi agisce. | Nessun tocco per sbaglio: sotto 8 px di movimento è un tocco, sopra è un trascinamento. |
| V6 | **Un solo telefono, tutti gli eroi**: agisce l'eroe di turno, qualunque sia. Le pause delle reazioni sono un foglio in basso con le opzioni e «Nessuna reazione». | Come deciso in A0 (solo con 1–4 eroi da un telefono). TV e più telefoni sono A11. |
| V7 | **Turno dei nemici animato** a velocità 1× / 2× / «salta»; «salta» applica tutto di colpo e lascia il registro. Il turno dei nemici non si può annullare. | È la parte più lunga della partita; deve restare brevissima. |
| V8 | **Sagome dei mostri originali**: cornice per ruolo (bruto, tiratore, incantatore, sciame, capo), colore per famiglia, simbolo per mostro (23 + 3 capi). I nomi nelle etichette vengono dal bestiario. | Come per le carte: disegnate da noi, nessuna figura copiata. |
| V9 | **Animazioni sobrie e disattivabili**: `prefers-reduced-motion` le toglie tutte (restano i numeri, senza movimento). | Vincolo di STYLE.md. |
| V10 | **Salvataggio a ogni azione** in `localStorage` (`bat`): lo stato è JSON, anche a metà di una pausa si riprende. | Il telefono si chiude spesso. |
| V11 | **Compagnia di prova sempre disponibile** (4 eroi pronti, livello 1–8 a scelta) accanto agli eroi dell'account. | Chi non ha un profilo può provare; anche il test nel browser non dipende da Firebase. |
| V12 | **Nessun suono nuovo in A5**: gli agganci (`BatFx.suono(nome)`) restano vuoti e li riempie A10. | Audio e schede regole sono un task a parte. |

## 2. Architettura e file
| File | Costante | Ruolo | Test |
|---|---|---|---|
| `motori/27k-avv-cronaca.js` | `ACRO` | frase di ogni evento, effetti da animare (dado, numero, passo, stato), nome del bersaglio | `test_avv_cronaca.js` |
| `motori/27l-avv-comandi.js` | `ACOM` | selezione, modi (muovi, bersaglio, area, conferma), tocco → azione, annulla | `test_avv_comandi.js` |
| `app/24hc-bat-mappa.js` | `BatMappa` | SVG dell'arena, segnalini, evidenziazioni, tocco → esagono, zoom e scorrimento | scenario browser |
| `app/24hd-bat-sagome.js` | `Sagome` | simboli dei mostri e dei capi, segnalino degli stati | scenario browser |
| `app/24he-battaglia.js` | `Bat` | stato, flusso di gioco, pannelli (iniziativa, scheda, azioni, registro, pause, fine), ingresso, salvataggio | scenario browser |
| `css/39c-battaglia.css` | prefisso `bt-` | tutto l'aspetto; usa i colori legno e ottone di `40-legno-ottone.css` | `npm run struttura` |

Ordine nel manifest: i due motori dopo `27j` e prima di `28-campagna.js`; i tre file app dopo `24hb-inventario.js` e prima di `24i-plancia.js`; il CSS dopo `39b`. La finestra si apre con `ui.bat` (come `ui.camp`), `Plancia.attivo` la conta nella destinazione «Avventura».

### Contratto di `ACOM`
```
ACOM.nuovo(s) → c                      // c = { sel, modo, mosse, anteprima, msg } JSON puro; ricalcola da `s`
ACOM.tocca(c, s, cella) → { c, azione? }   // tocco su un esagono: seleziona / mostra percorso / conferma
ACOM.scegli(c, s, scelta) → { c, azione? } // dai pannelli: attacca, potere {id}, oggetto {id}, speciale {t}, fine
ACOM.annulla(c) → c
ACOM.evidenzia(c, s) → { celle:[{q,r,tipo:'passo'|'costo'|'bersaglio'|'area'|'centro'|'direzione'|'percorso'}], etichette }
```
`azione` è già nella forma di `ASCO.act` (`{t:'muovi', a:{q,r}}`, `{t:'attacca', bers}`…). I modi: **riposo** (nessuna selezione) → **percorso** (esagono raggiungibile toccato, mostra costo) → conferma = muove; **bersaglio** (nemico toccato, mostra anteprima) → conferma = attacca con l'arma; **potere** (scelto dal cassetto: evidenzia bersagli, centri o direzioni validi) → **area** (centro o direzione toccati: evidenzia le creature colpite e mostra l'anteprima) → conferma. Ogni passaggio è annullabile con un tocco fuori o con «Annulla».

## 3. Sotto-step (ognuno chiude con un commit e `npm run verifica`)

### A5.1 — Cronaca e animazioni (`ACRO`)
1. Elenco di tutti i tipi di evento del motore (si ricava simulando 300 battaglie, non a memoria) e una frase per ciascuno: «Mara colpisce il lupo: 9 danni (taglio)», «Il tiro vale 17 contro CA 14», «Brann cade a terra», «La pozione cura 7 PF».
2. `ACRO.frase(ev, s)` e `ACRO.effetti(ev, s)` → passi `{t:'sposta'|'dado'|'numero'|'stato'|'scossa'|'fine', chi, …}` per l'animazione.
3. I nomi vengono dai combattenti dello stato (`nome` + lato), i mostri doppi sono numerati dal motore (`tagliagole#2` → «Tagliagole 2»).
- **Test**: ogni evento di 300 battaglie ha frase non vuota e senza «undefined» o «[object»; gli effetti restano coerenti con i PF di prima e dopo; nessun nome di marchio.

### A5.2 — Controllo dei tocchi (`ACOM`)
1. Macchina a stati della §2; tutta la validità delle mosse viene da `mosseValide`, il modulo non conosce regole.
2. Poteri a bersaglio singolo, a cerchio (tocchi il centro), a cono e linea (tocchi una direzione), a aura e «su di sé» (conferma diretta); oggetti della cintura; azioni speciali (scatto, disimpegno, nasconditi, aiuta, spingi, rialza, fuga di gruppo, ritira il movimento); Concentrazione (ritira) dopo un tiro.
3. Pause: `ACOM.pausa(c, p)` offre le opzioni; la risposta si accoda a `dec` e l'azione si ripete.
- **Test**: un bot «a tocchi» gioca 60 battaglie intere traducendo ogni mossa di `AIA.prossima` in tocchi e conferme, e l'esito è identico a `act` diretto; ogni azione ammessa da `mosseValide` è raggiungibile; un tocco fuori mappa, su un muro o su un amico non fa mai nulla di strano; annulla riporta a riposo.

### A5.3 — Mappa SVG
1. `BatMappa.svg(s, vista)`: celle per tipo (pavimento, difficile con sassi, rialzo con spessore, muro e ostacoli con volume), superfici (fuoco, veleno, ghiaccio, acqua) come campiture con motivo, ingressi e uscite; coordinate come in campagna, schiacciate ×0,84.
2. Segnalini ordinati dal fondo, barra dei PF sotto, anello del lato (eroi oro, nemici rosso), segnaposto «a terra», pedina del turno con alone.
3. Evidenziazioni di `ACOM.evidenzia` (esagoni raggiungibili con costo, percorso, bersagli, area, direzioni) e linea di vista tratteggiata verso il bersaglio scelto con l'icona di copertura.
4. Zoom (0,8–2,4×) e scorrimento con eventi puntatore, doppio tocco = centra, la vista segue chi agisce; `BatMappa.cellaDa(x, y)` converte un tocco in esagono.
- **Test** (node): il testo SVG ha un poligono per cella e un segnalino per creatura in campo, è ben formato e non cita nomi di marchio; `cellaDa` è l'inverso di `xy` su tutte le celle; le evidenziazioni non cadono mai su celle fuori mappa.

### A5.4 — Pannelli
1. **Iniziativa** in alto: ritratti (eroi) e sagome (nemici) in ordine, giro, chi è di turno ingrandito; un tocco su un ritratto seleziona e centra.
2. **Scheda** in basso a comparsa: nome, livello, PF con barra, CA, stati con icona e durata, resistenze; per un nemico anche i poteri noti. Con un bersaglio scelto: l'anteprima («Colpisci 68%, critico 5%, 9 danni; atteso 6,1»), copertura, vantaggio e svantaggio scritti in parole.
3. **Barra delle azioni**: Attacca (se un nemico è a tiro), Poteri (cassetto con cariche), Oggetti (cintura), Altro (scatto, disimpegno, nasconditi, aiuta, spingi, rialza), Ritira (Concentrazione), Fine turno. Pulsanti da 44 px, disattivati con il perché in una riga.
4. **Registro** richiudibile (ultime 3 righe, apri per tutto), con le frasi di `ACRO`.
- **Criterio**: nessun pannello copre la mappa oltre il 38% dell'altezza; a 390×844 si legge tutto senza scorrere la pagina.

### A5.5 — Flusso, ingresso e salvataggio
1. «Battaglia di prova» nella pagina Avventura: sceglie famiglia, difficoltà (facile, medio, difficile, capo), livello 1–8 e compagnia (eroi dell'account o di prova); costruisce con `ASCO.incontro`, `AARE.perIncontro` e `ASCO.nuovo`; opzione «Reazioni: chiedi / automatiche».
2. Ciclo: tocco dell'eroe → `act`; se `{pausa}` apre il foglio; se è il turno di un nemico parte l'IA a passi con velocità 1× / 2× / salta; dopo ogni azione si salva.
3. Fine: schermata con esito (vittoria, sconfitta, fuga, stallo), giri, PE per eroe, PF rimasti, «Rivinci»/«Esci»; nessuna ricompensa permanente (arriva con A9).
4. Esci a metà = la battaglia resta in `localStorage` e si riprende da «Continua battaglia».
- **Test** (node, sulle parti pure): avvio con tutte le combinazioni famiglia × difficoltà × 1–4 eroi; salva e riprendi a metà con una pausa aperta.

### A5.6 — Dado, numeri e movimento
1. Dado d20 sul bersaglio: rotola ≈500 ms, si ferma sul risultato, mostra «tiro + bonus = totale contro CA» (con due dadi se c'è vantaggio o svantaggio); critico e fallimento evidenziati.
2. Numeri di danno e cura che salgono e svaniscono sopra il segnalino; scossa breve di chi è colpito; «A terra», «Resiste», «Fallito» come etichette.
3. Movimento a scatti lungo il percorso; speciali (spinta, scivolata sul ghiaccio, arrivo dal bordo) con la stessa animazione.
4. `prefers-reduced-motion`: niente movimento, restano i numeri; «salta animazioni» sempre disponibile.

### A5.7 — Sagome e stati
1. 26 simboli originali (23 mostri + 3 capi) ricavati da forme semplici in 24×24, cornice per ruolo, colore per famiglia; i capi più grandi con corona o aura.
2. Segnalini degli eroi: ritratto in cerchio con bordo di classe; a terra = ritratto spento con croce.
3. Icone degli stati (veleno, fuoco, ghiaccio, stordito, nascosto, benedetto, ecc.) con durata, lette da `ASTA`.
- **Test**: ogni id del bestiario ha una sagoma; nessuna sagoma ripete lo stesso disegno di un'altra della stessa famiglia.

### A5.8 — Prova nel browser e schermata
1. Scenario `avv_battaglia` in `tools/test-browser/run.py`: apre la battaglia di prova con la compagnia di prova, tocca un esagono (percorso e conferma), attacca con anteprima, usa un potere ad area, sceglie una reazione, lascia giocare i nemici in «salta», chiude la partita; controlla che i bersagli siano da almeno 40 px (o ingranditi con lo zoom), che non ci siano scorrimenti orizzontali e che `prefers-reduced-motion` tolga le animazioni.
2. **Una** schermata finale a 390 px (battaglia in corso, mappa con percorso e anteprima).

### A5.9 — Documenti, verifica, PR
`docs/AVVENTURA.md` (stato di A5), `CLAUDE.md` (riga della tabella), `npm run mappa`, `npm run verifica`, `npm run test:browser` (scenari `avv_battaglia` e quelli già presenti), un commit per sotto-step, PR con base `feat/avventura-a4`.

## 4. Riferimento visivo (senza nomi di marchi)
Modelli di riferimento per l'impostazione, non per l'arte: i giochi tattici a esagoni su telefono. Da lì prendiamo le convenzioni che i giocatori già conoscono: striscia dell'iniziativa in alto, mappa al centro che segue chi agisce, azioni in basso sotto il pollice, esagoni raggiungibili in azzurro con il costo, bersagli con anello rosso e percentuale di colpo, numeri di danno che salgono, registro piccolo e richiudibile. Le illustrazioni, le sagome e i testi sono nostri; la palette è legno e ottone (`40-legno-ottone.css`) con oro per gli eroi e rosso mattone per i nemici. Contrasto: testi chiari su fondo scuro, mai solo il colore per distinguere (anelli e forme diverse per lato).

## 5. Rischi e come li tengo a bada
| Rischio | Risposta |
|---|---|
| Tocchi imprecisi su esagoni da 40 px. | Il tocco si risolve con la matematica dell'esagono (nessun bersaglio nascosto), conferma in due tempi, zoom automatico sul bersaglio quando serve, pulsanti di conferma da 44 px. |
| La vista duplica regole del motore. | Tutto ciò che è ammesso viene da `mosseValide`/`anteprima`; `ACOM` non contiene numeri di gioco (verificato dal test «a tocchi» contro `act`). |
| Il turno dei nemici è lento o blocca. | Passi con tetto di tempo, «salta» che applica tutto subito; l'IA è già senza stalli (A4). |
| SVG pesante su telefoni economici. | Circa 100 celle e 20 segnalini; la mappa si ridisegna per intero solo se cambia la forma, altrimenti si aggiornano gli attributi; niente filtri SVG. |
| Righe lunghe nei file (lo strumento Read le tronca). | Funzioni piccole, `npm run struttura` ad ogni sotto-step. |
| Pause di reazione a metà animazione. | Le animazioni sono una coda: la pausa si apre quando la coda è vuota; lo stato non cambia finché non si risponde. |

## 6. Cosa resta fuori da A5
Suoni, musica e schede delle regole in gioco (A10), ingresso dalla mappa della campagna e racconto (A6–A8), vite, bottino e ricompense sull'account (A9), TV e più telefoni (A11), animazioni rifinite dei poteri (A12), livelli di difficoltà dell'IA nelle impostazioni (A13).

## 7. Le scelte che potresti voler cambiare
V1 (vista inclinata invece che piatta dall'alto), V5 (zoom iniziale: tutta l'arena in 390 px), V7 (turno dei nemici automatico), V11 (compagnia di prova per chi non ha l'account). Sono isolate: V1 è un solo fattore in `BatMappa`, V7 un'opzione di `Bat`.
