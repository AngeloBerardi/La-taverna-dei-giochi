# Taverna: rete, lobby, account, bottega, TV, stile

Scheda dei moduli: dove si mette mano. La carica chi lavora su quest'area (rimando da `CLAUDE.md`); chi tocca un file qui elencato aggiorna la riga.

| Compito | File |
|---|---|
| Rete, stanze | `src/js/app/07a-rete-stanza.js` (avvio e riprova), `24m-rete-rtdb.js` (unico trasporto). Mosse atomiche: `motori/35-sync.js` + `tests/test_sync.js`. p2p solo per prove: `09-rete-p2p.js`, `08-relay-mqtt.js` |
| Stanze live sul database (`R.mode='rt'`, presenza, nessun host) | `app/24m-rete-rtdb.js` (`RT`), regole `database.rules.json`, scenario `stanze_database` in `tools/test-browser/` |
| Lobby 3D | **`tools/taverna3d/`** poi `python3 tools/taverna3d/mk.py` (non toccare `app/12c-lobby-3d.js`, è generato) |
| Lobby falò / sala | `src/js/app/07e-lobby-falo.js`, `12b-lobby-diorama.js` (falò, unica lobby di ripiego) |
| App installabile, offline, notifiche push | `src/pwa/` (`sw.js`, manifest, icone: `python3 tools/pwa/mk-icone.py`), `src/js/app/24-pwa.js` |
| Profilo online, monete (Firebase) | `src/js/app/24a-firebase.js`, regole in `firestore.rules`, piano in `docs/FIREBASE-PIANO.md` |
| Bottega, cosmetici, prezzi | catalogo `src/js/motori/22-bottega.js` (unica fonte), `app/24b-bottega.js`, `css/33-dorsi.css`; dopo aver cambiato i prezzi: `npm run regole` e ripubblica `firestore.rules` |
| Account (email), classifica, ELO | `app/24c-account.js` (modale), `app/24a-firebase.js` (FB.collega/entra/top, ELO in `award`), regole del punteggio `motori/23-elo.js` (+ `tests/test_elo.js`); nuovo gioco ⇒ `npm run regole` |
| Locandiere (NPC) | copioni `motori/24-locandiere.js` (+ `tests/test_locandiere.js`), finestra `app/24d-locandiere.js` |
| Partite a distanza (a turni, anche a giorni) | `app/24e-distanza.js` (`FsDb` = `R.db` su Firestore, `Dist` = elenco/inviti), dati puri `motori/25-distanza.js` (+ `tests/test_distanza.js`), regole `partite` in `firestore.rules` |
| Schermo comune (TV/PC, `?tv=CODICE`), codice QR | `app/24f-schermo.js` (`TV`), `css/37-schermo.css`, generatore `motori/26-qr.js` (+ `tests/test_qr.js`, lettura vera con OpenCV) |
| Vista TV dei giochi di carte e tavolieri senza 3D (tavolo ovale, posti, parte comune) | `app/24y-tv-tavoli.js` (`TVT`, una funzione `…TVH` per gioco, registrate su `VIEW` quando `ui.tv`), `css/46-tv-tavoli.css` (prefisso `tvk-`), scenario `schermo_tavoli` in `tools/test-browser/` |
| Eroi (creazione del personaggio, legati all'account) | motore `motori/27-eroi.js` (+ `tests/test_eroi.js`), vista `app/24g-eroi.js`, `css/38-eroi.css`, regole `eroi` in `firestore.rules` (generate: `npm run regole`) |
| Stile unico (legno e ottone), barra in basso a 5 destinazioni, icone | `css/40-legno-ottone.css`, `app/24i-plancia.js` (`Plancia`), icone SVG `app/01b-icone.js` (`ic('nome')`; niente emoji nell'interfaccia) |
| Personaggio 3D (T3): `window.__FIGURA` (vendor `figura`, generato da `tools/taverna3d/fig.js`+`figopt.js`) costruisce il pupazzo per Taverna, crocevia e creazione; `app/24ib-creo.js` = `Figura` (mio/salva) e `Creo` (primo ingresso in tre passi, `ui.creo`); profilo online `p.av3` | 24ib-creo.js, tools/taverna3d |
| Home della Taverna: crocevia 3D (torcia sul palo, vie che si diramano, l'omino che arriva e imbocca la via dell'insegna toccata) | scena `app/24ia-crocevia.js` (`Crocevia`: `dopo()` da `afterRender`, `parte(t)` dal click sulle insegne con `data-cv` = gradi della via; solo con `ui.lobby==='3d'` e WebGL, sonda dei fps, `cv-3d` = si/no per le prove), markup e scena disegnata di ripiego in `Plancia.homeH` (`24i-plancia.js`), insegne `.hm-sg` e palo in `css/40-legno-ottone.css`, scenario `home_crocevia` in `tools/test-browser/` |
| L'isola dei predatori: isola di sfondo e scene degli animali | `app/17a-isola-scene.js` e `17b-isola-scene2.js` (`ISCENA` = una scena a figura intera 100×138 per carta, `isleArt`, `isleSfondo`, `isleNuota`; `isleSalto` in `18-isola.js` è il salto sulla preda), `css/16-isola.css`, riferimento in `docs/rules/isola-dei-predatori.md` |
| HUD comune delle partite (fasce fisse, tre livelli di pulsante; oggi Briscola e Isola) | `app/22ga-hud.js` (`HUD.html`, elenco `HUD2`), `css/47-hud.css` (prefisso `h2-`), regole in `docs/STYLE.md`, scenario `hud_comune` in `tools/test-browser/` |
