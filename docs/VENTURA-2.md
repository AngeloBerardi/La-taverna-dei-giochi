# Cronache del Crocevia 2 — «Il Condottiero»

Progetto della prossima major release della pagina Avventura, soprattutto della **Compagnia di ventura**.
Architetto, 16 novembre 2026, dopo le PR 123–138 e una partita a 390×844. Le schede eseguibili stanno in `docs/schede/`: questo file dice **perché**, **in che ordine** e **come si lavora in parallelo senza rompere i rilasci**.

## Dove siamo
**1. Le battaglie sono piccole e senza testa.**
- In campo stanno al massimo 34 uomini per lato (`VCAM.C.MAX`), ma i signori del mondo girano con 95–190 uomini (`leva`). Il resto entra a gocce di 10 dal bordo basso: la «grande battaglia» è un rubinetto.
- Ci sono solo tre gruppi fissi (fanti, tiratori, cavalieri). Non si divide, non si sceglie dove mettersi, non si decide quando mandare le riserve.
- Il nemico ha un solo copione (`VCAM.comanda`: avvicinarsi, poi tutti alla carica). Un signore veterano combatte come un predone.
- A truppe pari, chi ha il capitano vince 38 volte su 40.
- La telecamera segue il capitano e le schiere escono dallo schermo.

**2. L'interfaccia parla troppo e mostra poco.** Ci sono numeri senza nome, pannelli che coprono due terzi della mappa, otto ottoni per schermata, riquadri vuoti nell'incontro e comandi che occupano un quarto del campo.

**3. Il mondo è largo ma poco profondo.** Non ci sono eserciti, non c'è niente di tuo che renda, la strada è vuota.

**Misure prese.** Il motore regge eserciti grandi: in node un passo costa 0,3–0,6 ms da 70 a 300 uomini, anche senza una griglia spaziale. Il limite vero è la resa sul telefono e la sincronia della compagnia: in co-op il tetto deve essere uguale per tutti.

**Debito.** `28k-ven-mondo.js` pesa 110 KB e `24hw-ventura.js` 69 KB: è la prima voce di costo in token di ogni scheda.

## La visione
Restare noi (Italia di ventura, condotte, cronache, telefoni e TV insieme) e prendere dai giochi di condottieri ciò che li rende grandi.

**La battaglia diventa una prova di strategia e di tattica.**
- **Prima**: esplori il nemico, scegli il campo, l'ora, l'imboscata o la retroguardia (B8). Dividi la compagnia in **reparti**, li **schieri nei settori** che il terreno e l'esplorazione ti concedono, e prepari fino a **due ondate** con il loro punto d'ingresso (anche di fianco) e il loro momento (B1).
- **Durante**: battaglie fino a **110 uomini in campo per lato** e centinaia in tutto (B0). Morale per reparto, fatica, frecce che finiscono (B3): le ondate fresche contano.
- **Il nemico pensa.** Un **consiglio di guerra** a manovre (B2) decide ogni pochi istanti. Più il comandante è di **rango** alto, più manovre conosce, più spesso ci ripensa e meno sbaglia. Un predone carica e basta; un maresciallo prende l'altura, tiene le riserve per il tuo fianco debole, usa un'esca, dà la caccia al tuo capitano. Un re ricorda come hai vinto le volte scorse e ti prepara la contromossa.
- **Ogni regno ha la sua dottrina** (pesi sulle manovre), ogni signore la sua indole. Il rango si guadagna vincendo e si legge nell'incontro (B9). Più è alto, più vale la vittoria.

**La campagna diventa un mondo che vive (W).**
- La Compagnia è **il** gioco dell'Avventura: insegna grande e «Nuova campagna» con la difficoltà (preset o leve: economia, consumi, nemici, unificazione, stagioni, ferite, grandezza del mondo).
- Un mondo più vasto (192 o 240 celle di lato, oggi 128), con una geografia che ha senso: catene con i passi, fiumi che scendono al mare o ai laghi, città sulle foci e sulle rive, porti solo su acque navigabili, ponti presidiati dai castelli. La mappa non si trascina più nel vuoto.
- Si parte con 9–12 signorie che si accorpano: verso il giorno 120 ne restano 4–7, nella tarda partita 2–4.
- La sorte ti getta in un punto a caso: niente scelta del regno.
- Stagioni che cambiano consumi, marce, prezzi e guerre; un'economia di produzione, scorte e carovane che risente delle razzie.

Insieme a questo:
- un'interfaccia che si legge in tre secondi (U);
- un mondo che si muove per eserciti, feudi, affari e incontri sulla strada (M);
- le cose solo nostre: la sfida al capo (B7), la regia pensata anche per la TV (B5), le voci dei compagni (B4).

## Come si lavora in parallelo senza rompere i rilasci

### 1. Binari: ogni scheda appartiene a uno, e ogni binario possiede i suoi file
| Binario | Schede (in ordine) | File che solo lui modifica |
|---|---|---|
| **A Fondamenta** | R1 → R2 | spezzamento di `28k` e `24hw` (blocca tutti: va fatto per primo, è breve) |
| **B Motore di battaglia** | B0 → B1 → B3 → B2a → B2b → B2c (+ motore di B4) | `motori/28l*` (campo), `tests/test_ven_campo*.js`, `tests/test_ven_tattica*.js`, `tools/avventura/banco-campo.js` |
| **C Mondo e strategia** | B9 → B8 → B7 → M1 → M2 → M3 → M4 | `motori/28k*` (mondo dopo R1, compreso il nuovo `28kf-ven-anteprima.js`), `motori/28m-ven-stanza.js`, `tests/test_ven_mondo*.js`, `test_ven_diplomazia.js` |
| **D Vista di battaglia** | U3 → B1v → U4 → B0v → B5 → B6 (+ vista di B4) | `app/24hv-ven-campo.js`, `app/24hwd-ven-scontro.js`, `css/39jc-ven-campo.css`, `app/24ht-ven-arte.js` (sezione schiere) |
| **E Interfaccia del mondo** | U1 → U2 → W1 (sostituisce T4) | `app/24hwa*`, `app/24hwb*`, `app/24hwc*`, `css/39ja*`, `css/39jb*` |
| **H Mondo e campagna** | W0 → W2 → W2v → W5 → W3a → W3b → W3c → W4 (W6 nel binario C) | `motori/28kg-ven-geografia.js`, `app/24hu-ven-mappa.js`, `tests/test_ven_geografia.js`, `test_ven_stagioni.js`, `test_ven_regni.js`; W3a è un **cantiere** su C (vedi la scheda) |
| **F Voci e testi** | B4-testi, M4-testi | `motori/28ja-ven-voci.js` |
| **G Accensioni** | X1, X2, X3 | `VDAT.ACCESO` in `28j` e una riga di `VEN.campo` |

Una scheda che deve toccare un file di un altro binario lo dice nella sezione «Tocca anche». Il tocco è al massimo di **20 righe** (un gancio, mai logica) e si fa solo quando quel binario non ha una PR aperta sullo stesso file.

### 2. Tutto nasce spento
- Le novità del motore si attivano **solo** con campi nuovi nella scheda della battaglia (`max`, `reparti`, `ondate`, `rango`, `dott`…). Senza quei campi `VCAM` fa **esattamente** ciò che fa oggi. Il cancello di ogni scheda del binario B è l'**impronta**: `node tools/avventura/impronta.js` (da R1) dà lo stesso risultato di `main`.
- Il mondo passa i campi nuovi solo se l'interruttore è acceso: `VDAT.ACCESO={grandi:false,consiglio:false,eserciti:false,mondo2:false}`. Gli interruttori li gira solo il binario G, con una scheda piccola che fa anche la prova d'insieme.
- La vista mostra i pannelli nuovi solo quando lo stato li contiene (`s.reparti`, `s.ondate`…). Unire una scheda della vista prima del motore non rompe niente.
- I test di ogni scheda provano entrambe le strade: spento (uguale a prima) e acceso con i campi impostati a mano.
- Per provare dal vivo una cosa non ancora accesa: `?ven=grandi,consiglio,mondo2` nell'indirizzo accende gli interruttori solo per quella sessione (lo aggiunge B0, in `24hw` con un tocco di 5 righe).

### 3. Il salvataggio cresce solo con campi facoltativi
Chi apre un salvataggio vecchio trova `undefined` e usa il valore di base. Niente cambi di versione: `migra` si tocca solo nel binario C.

### 4. File condivisi da tutti, con regole fisse
| File | Regola |
|---|---|
| `src/manifest.json` | una riga per file nuovo, subito dopo il fratello (`28l`→`28la`…); mai riordinare |
| `docs/rules/ventura.md` e `RULES.ventura` | ogni scheda aggiunge la **sua** sezione in fondo; nessuno riscrive le sezioni altrui |
| `docs/moduli/ventura.md` | una riga per scheda in «Stato» |
| `docs/schede/README.md` | si cambia solo la colonna «stato» della propria riga |
| `VDAT` (`28j`) | ogni scheda aggiunge il **suo** blocco con nome proprio (`VDAT.RANGO`, `VDAT.MANOVRE`…); `VDAT.ACCESO` solo il binario G |

### 5. Tre rilasci, ciascuno pubblicabile da solo
| Rilascio | Si accende con | Serve unito prima |
|---|---|---|
| **1 Interfaccia** | nessun interruttore (è subito visibile) | R1, R2, U1, U2, U3 (T4 se pronta) |
| **2 Grandi battaglie** | X1 → `ACCESO.grandi` | B0, B1, B3, B1v, U4, B0v (B5 consigliata) |
| **3 Comandanti** | X2 → `ACCESO.consiglio` | B2a, B2b, B9, B8 (B2c, B4, B7 possono arrivare dopo, ognuna si vede appena unita) |
| **5 Nuova campagna** | X4 → `ACCESO.mondo2` (solo per le partite **nuove**; le vecchie restano com'erano) | W1–W5 (W6 consigliata). W0 e W1 sono visibili appena unite |
| 6 Eserciti (dopo) | X3 → `ACCESO.eserciti` | M1 completata; M2–M4 si accendono da sole quando unite |

Tra un rilascio e l'altro `main` resta sempre giocabile: le cose spente sono invisibili.

### Calendario possibile con tre sessioni in parallelo
| Settimana | Sessione 1 (B motore) | Sessione 2 (D/E viste) | Sessione 3 (C mondo, F testi) |
|---|---|---|---|
| 1 | R1 | R2 · W0 | — |
| 2 | B0 | U1 → U2 | B9 · W2 |
| 3 | B1 | W1 · U3 | W2v · B4-testi |
| 4 | B3 | B1v → U4 | W5 |
| 5 | B2a | B0v | W3a (cantiere: il binario C si ferma) |
| 6 | **X1 (rilascio 2)** · B2b | B5 | W3b → W3c |
| 7 | B2c | B6 | W4 · W6 · B8 |
| 8 | **X2 (rilascio 3)** · B7 | vista di B4 | **X4 (rilascio 5)** |
Una sessione per binario evita i conflitti; se si lavora da soli, si segue la colonna 1 e si alternano le altre.

## Decisioni d'architettura (per tutte le schede)
1. **Motori puri**: niente `Math.random`, `Date.now` né trigonometria in `28*`. Tutto ripetibile dal seme; la risoluzione automatica gioca le stesse regole.
2. **Numeri in un solo posto**: `VDAT` o `VCAM.C`. Mai numeri sparsi nella vista.
3. **Il tetto della battaglia è nello stato del mondo, non nel telefono.** `s.opz.taglia` ∈ `piccola|media|grande` (40/70/110 uomini in campo per lato) si sceglie dal menu. Alla prima partita si propone in base alla qualità del telefono. In compagnia vale quella dell'oste. Così tutti i telefoni simulano la stessa battaglia. Le battaglie IA contro IA del mondo usano sempre `media`.
4. **Reparti al posto dei tre gruppi fissi**: ogni unità ha `u.r` (reparto) oltre a `u.c` (tipo). Gli ordini sono per reparto. Senza `reparti` nella scheda nascono tre reparti (0 = fanti, 1 = tiratori, 2 = cavalieri), equivalenti ai gruppi di oggi: i `data-v` `cgr:f|t|c` continuano a valere.
5. **La vista non rifà i conti**: legge funzioni pure (`VCAM.quota`, `VCAM.settori`, `VCAM.morali`, `VCAM.quadro`).
6. **Interfaccia**: tre livelli di pulsante (un ottone per schermata), fogli dal basso al massimo al 58%, bersagli ≥ 44 px, niente emoji.

## Chi esegue (modello da impostare)
| Schede | Modello | Note |
|---|---|---|
| R1, R2, B0 | Sonnet + revisione forte | il cancello è l'impronta |
| W2, W3a–c, W5, W6 | Sonnet + **revisione forte** | generatore, regni dinamici, bilanciamento |
| W0, W1, W2v, W4 | Sonnet (+ sguardo forte agli screenshot) | |
| B1, B3, B8, B9, B7 | Sonnet + revisione forte | contratti fissati nelle schede |
| B2a, B2b | Sonnet, **revisione forte obbligatoria** | il cuore: bilanciamento con numeri attesi |
| B2c | **forte** | IA con memoria e inganno: poco codice, molto giudizio |
| U1–U4, B1v, B0v, B5 | Sonnet + sguardo forte allo screenshot | |
| B6 | `artist` Sonnet | |
| B4-testi, M4-testi | forte | scrittura |
| X1, X2, X3 | Sonnet | piccole, ma con la prova d'insieme |
| M1–M4 | prima l'architetto forte («completa la scheda M1»), poi Sonnet | sono tracce |

Ogni scheda: chat nuova, `/scheda <id>`, una PR. Prima del push: `npm run verifica` e `node tools/avventura/impronta.js` (dopo R1).

## Fatto quando (release intera)
- Una battaglia contro un signore con 150 uomini schiera fino a 110 per lato a taglia `grande`, con due ondate decise da te. A taglia `media` regge 30 fps su un telefono di fascia media (misura nello scenario, con la qualità `media`).
- Scala dei ranghi: a truppe pari il rango *r* batte *r−1* tra il 58 e il 75%; il rango 5 batte il rango 1 anche con il 25% di truppe in meno.
- I cinque regni si riconoscono da come combattono; i comandanti di rango ≥ 3 prendono le alture, tengono le riserve e girano sui fianchi; quelli di rango ≥ 4 usano esche e cacciano il capitano esposto.
- Senza capitano, le battaglie pari stanno tra il 40 e il 60%; con il capitano contro un signore di pari rango, tra il 60 e l'80%.
- Ogni schermata del mondo ha un solo ottone e la mappa resta visibile per almeno il 40% dell'altezza.
- Con il bot accorto a 60 giorni nessun seme va in rovina.

Fuori dalla release: mondo persistente a distanza (C3), banda contro banda (C4), ripiego senza WebGL. Restano in `VENTURA.md`.
