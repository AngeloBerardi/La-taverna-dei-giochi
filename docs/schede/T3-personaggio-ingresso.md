# T3 — Al primo ingresso: nome e personaggio 3D, lo stesso ovunque

**Scopo.** Chi entra per la prima volta sceglie il nome e crea il suo personaggio 3D. È lo stesso che arriva al crocevia della home e che cammina nella Taverna.

**Leggi prima.** `tools/taverna3d/fig.js`, `main1.js` (`person`), `eng.js` (`myLook`, `E.saveLook`, `normFig`), il banco `renderCust` (generato in `12c`: si legge il sorgente in `tools/taverna3d/`), `app/24ia-crocevia.js` (`omino`), `app/07d-viste-comuni.js` (`nameH`), `scripts/build.js` (`NOMI`), `app/01a-vendor.js`.

**Oggi.** L'aspetto 3D esiste già: `mine.av3` + `rg-av3`, modificabile solo dentro la Taverna (bagno e armadio). Il crocevia disegna un pupazzo fisso (`omino()`), diverso da tutti. Il primo ingresso chiede solo il nome.

**Decisioni già prese.**
1. Un solo costruttore: `fig.js` + `person` + `OPT`/`normFig` escono in un pezzo a parte `figura` (`dist/vendor/figura.<hash>.js`, `VENDOR.load('figura')`), usato da Taverna, crocevia e creazione. Niente copia del codice.
2. Schermata `Creo` (`app/24ib-creo.js`, nuova) in tre passi, una mano sola, a 390 px: **Nome** → **Aspetto** (corpo, viso, capelli) → **Abiti** (veste, cappello, extra). In alto il personaggio su un piedistallo che gira col dito; sotto, le stesse righe di scelta del banco della Taverna. Pulsanti: «A caso», «Avanti», «Entra». Niente emoji, legno e ottone.
3. Quando: se manca `rg-av3` (o manca il nome) → `Creo` prima della stanza. Chi ha già un aspetto non la vede mai; resta raggiungibile da Profilo → «Il mio personaggio» e dagli specchi della Taverna.
4. Salvataggio con la funzione che c'è (`E.saveLook`, spostata in `figura` come `FIGURA.salva(o)`): scrive `rg-av3`, `rg-av`, `mine.av3`, `mine.av`; col profilo online anche `p.av3` (campo nuovo, facoltativo, in `firestore.rules`: mappa con al massimo 16 chiavi).
5. Crocevia: `omino()` sostituito da `FIGURA.crea(FIGURA.mio())`; ripiego sul pupazzo attuale se `figura` non arriva.
6. Caricamento: `Creo` usa il velo di T1 (`Soglia`) mentre arrivano `three` e `figura`; senza WebGL la creazione mostra l'anteprima pixel (`rg-av`) con le stesse scelte.
7. Nome: 2–14 caratteri, come oggi; errore «Scrivi un nome di almeno due lettere».

**Stato e contratti.** `FIGURA.crea(look)→THREE.Group`, `FIGURA.mio()→look`, `FIGURA.caso()→look`, `FIGURA.salva(look)`, `FIGURA.OPT`. `ui.creo` = passo (0 = chiusa). Nessuna migrazione: `rg-av3` resta com'è.

**Passi.** 1) `tools/taverna3d/`: separare `figura`, `mk.py` produce i due pezzi; `scripts/build.js` + `01a-vendor.js`. 2) `24ib-creo.js` + `css/40b-creo.css` + manifest. 3) aggancio all'avvio (`07a-rete-stanza.js`) e voce nel Profilo. 4) `24ia-crocevia.js`. 5) `firestore.rules` (`npm run regole`).

**Prove.** Scenario browser `primo_ingresso`: memoria vuota → compare `Creo`; nome + «A caso» + «Entra» → `rg-av3` scritto, stanza aperta, `L3D.dbg()` riporta lo stesso aspetto, il crocevia usa la stessa veste. Secondo avvio → niente `Creo`. Screenshot a 390 px del passo Aspetto, una volta.

**Fuori scopo.** Gli eroi dell'Avventura (`24g-eroi.js`) restano un'altra cosa: sono personaggi di gioco, non l'avatar. Oggetti nuovi di bottega per l'avatar.

**Fatto quando.** Lo scenario passa e lo stesso personaggio si vede in creazione, crocevia e Taverna.
