# Catan: scomposizione di Colonist e mappa sui moduli della Taverna

**Fonti consultate**: pagina principale e pagina regole di colonist.io (https://colonist.io/, https://colonist.io/catan-rules). Il gioco vero e proprio è un'app JavaScript che non si legge da fuori, quindi la parte "interfaccia di partita" qui sotto è la descrizione dei blocchi tipici di quel tipo di gioco, non una copia: **niente grafica, nomi, testi o suoni di Colonist/Catan sono stati riprodotti** (regole sì, perché le meccaniche non sono protette; arte e testi sono nostri, come da `CLAUDE.md`).

## 1. Che cosa fa Colonist (blocchi funzionali)

| Blocco | Cosa contiene | Dalla pagina |
|---|---|---|
| Lobby / stanza | giocatori, amici, invito con link, modalità, mappa, regole, impostazioni avanzate, timer del turno, massimo giocatori, "Sono pronto", "Avvia", chat | pagina principale |
| Plancia | 19 esagoni di terreno con numeri, ladro, porti; colonie, città e strade colorate per giocatore | regole |
| Preparazione | due colonie e due strade a testa; la seconda colonia dà una risorsa per esagono adiacente | regole |
| Turno | tiro dei dadi → produzione → commercio e costruzione in qualsiasi ordine → fine turno | regole |
| Ladro (7) | chi ha 8+ carte scarta metà (per difetto); chi ha tirato sposta il ladro e ruba una carta | regole |
| Costruzioni | strada (legno+argilla), colonia (legno+argilla+lana+grano), città (2 grano+3 roccia), carta sviluppo (lana+grano+roccia); massimo 15 strade, 5 colonie, 4 città | regole |
| Commercio | banca 4:1, porto generico 3:1, porto di risorsa 2:1, scambi tra giocatori (mai la stessa risorsa dai due lati) | regole |
| Carte sviluppo | 25 carte: 14 cavalieri, 5 punti vittoria, 2 costruzione strade, 2 invenzione, 2 monopolio; una per turno, non nel turno d'acquisto, anche prima del tiro | regole |
| Premi | strada più lunga (almeno 5, +2), esercito più grande (almeno 3 cavalieri, +2) | regole |
| Vittoria | 10 punti: colonie 1, città 2, carte punto 1, premi 2 | regole |
| Interfaccia | mano di risorse, barra delle costruzioni, dadi, pannello giocatori con punti, registro di gioco, chat, timer | convenzione del genere |
| Fuori ambito | negozio, classifiche, app mobile, abbonamento per mappe ed espansioni, turn timer | pagina principale |

## 2. Dove vive ogni blocco nella Taverna

| Blocco | Modulo | Stato |
|---|---|---|
| Lobby, stanze, ospiti, invito, rete p2p | già esistenti (`07-nucleo.js`, `08-relay-mqtt.js`, `09-rete-p2p.js`) | riusato |
| Opzione "punti per vincere" (10 o 8 per partite rapide) | `GAMES.opts` di Catan, letta da `newGame(..., {vp})` | fatto |
| Geometria (19 esagoni, 54 incroci, 72 strade, coste, vicini) | `motori/18-catan.js`, sezione "geometria": costruita una volta sola da coordinate assiali | fatto |
| Mescolanza della mappa (terreni, numeri senza 6/8 adiacenti, 9 porti sulla costa) | `newGame` | fatto |
| Macchina a stati del turno: setup → roll → (discard → robber → steal) → main → end | `act` + `run` + `main` | fatto |
| Regole di costruzione (distanza, collegamento alle proprie strade, limiti dei pezzi) | `canSettle`, `canRoad`, `settleSpots`, `roadSpots`, `citySpots` | fatto |
| Produzione con il limite della banca (19 carte) | `produce` | fatto |
| Strada più lunga (percorso più lungo, spezzato dalle colonie avversarie) | `roadLen`, `updateLongest` | fatto |
| Esercito più grande | `updateArmy` | fatto |
| Porti e banca | `ratio`, azione `bank` | fatto |
| Scambi tra giocatori (offerta a tutti o a uno, accetta/rifiuta, il proponente conclude) | azioni `offer`, `accept`, `reject`, `cancel`, `deal` (tutti possono agire fuori turno: `s.sim = true`) | fatto |
| Carte sviluppo | `playDev`, azione `buydev` | fatto |
| Vittoria a 10 punti (con i punti nascosti) | `check`, `points(s,p,true)` | fatto |
| Disegno della plancia (SVG: esagoni, numeri con puntini, ladro, strade, colonie, città, porti) | `app/22f-catan.js`, `boardH` | fatto |
| Bersagli toccabili (incroci, strade, esagoni) secondo la fase | `app/22f-catan.js`, `cTargets` | fatto |
| Mano di risorse, carte sviluppo, barra delle costruzioni, dadi, giocatori, registro | `app/22f-catan.js`, `catanH` | fatto |
| Finestre: scambio (banca e giocatori), scarto del 7, invenzione, monopolio | `app/22f-catan.js` | fatto |
| Stile | `css/25-catan.css` | fatto |
| Regole in-game, musica, suoni | `RULES.catan`, traccia `cata`, suoni `build`, `dice`, `coin` | fatto |
| Test del motore (geometria, regole, partite complete, bot competente contro bot casuale) | `tests/test_catan.js` | fatto |

## 3. Non incluso (candidati per dopo)
- Timer del turno e tema "veloce" con 60 secondi per mossa.
- Città e Cavalieri, Marinai, Navigatori: espansioni, regole a parte.
- Mappe alternative (isole, bordo fisso per principianti): basta aggiungere un generatore a `newGame`.
- Bot per giocare da soli (esiste già il bot di test, `tests/test_catan.js`, da portare in `motori/`).
- Privacy sullo stesso telefono: con ospiti, ogni giocatore tocca il proprio nome per vedere la sua mano (nessun passaggio del telefono, come in The Mind).

## 4. Aggiornamento: 5-6 e 7-8 giocatori
Tre plance (19, 30 e 37 esagoni) in `motori/18-catan.js` (`PROF`, `KIT`), banca da 19/24/29 carte, mazzo sviluppo da 25/34/43, e **costruzione speciale** dopo ogni turno (fase `sbp`: solo costruire o comprare, niente scambi né sviluppi né vittoria). Test in `tests/test_catan_grande.js`. I numeri del 7-8 sono approssimati: vedi `docs/hud-ux-ricerca.md`.
