# La Taverna dei Giochi

Hub di giochi multiplayer per telefono, in italiano: una locanda 3D (con il falò pixel-art come modalità semplice) dove ci si siede al tavolo con gli amici e si sceglie un gioco dallo scaffale.

**Giochi (29 voci nello scaffale):** Regicidio, Regicidio X (mostri per seme, classi, tratti e campagna della torre), Regicidio: la Campagna (12 missioni + spedizioni libere), Briscola, Scopa, Burraco, Machiavelli, La Banda, Sabotatori, Azulejos, L'isola dei predatori, La Mente (+ Estrema), Valle del Raccolto, Il Furfante, Terre di Cascata, Armonie (pile di dischi e animali, con i Custodi e le espansioni Battito e Fortissimo), Dungeon in una Carta, Dudo, Gattini al Botto (2-10, con edizione Implosione), I Coloni (2-8, con ampliamenti 5-6 e 7-8), Bestie Assetate di Potere, Ultima Carta, Dietro il Trono, Parole in Codice, Trivia a Spicchi, Teste Matte, Il Ricercato di Londra, Cena con delitto.

## Come si usa
- Tutti entrano nella **stanza generale** ("PIAZZA"); le stanze private si creano dal pannello della stanza e si invitano con un link o un codice.
- Se chi ospita la stanza generale esce, un altro giocatore ne prende il posto con lo stato già in mano.

## Per sviluppare
- `dist/index.html`: il gioco (pagina unica generata da `npm run build`). Firebase Hosting pubblica `dist/` a ogni unione in `main`.
- `src/`: sorgenti separati; `src/manifest.json` fissa l'ordine di concatenazione. `src/js/app/12c-lobby-3d.js` è **generato** da `tools/taverna3d/` (`python3 tools/taverna3d/mk.py`): non modificarlo a mano.
- `npm run check` = build + sintassi, prima di ogni push. `npm test` = simulazioni dei motori (`tests/`). `npm run mappa` aggiorna la mappa dei moduli in `docs/ARCHITECTURE.md`.
- `tools/test-rete/`: test manuali della rete a due client (broker locale, invito, subentro dell'host, validazione); istruzioni nel README della cartella.
- Multiplayer: Firebase Realtime Database (`js/app/24m-rete-rtdb.js`), nessun telefono fa da host. Le mosse sono transazioni sul documento della stanza (`js/motori/35-sync.js`). PeerJS/MQTT restano solo per prove con `?net=p2p`.
- Documentazione: `docs/ARCHITECTURE.md` (moduli e contratti), `docs/STYLE.md`, `docs/GAMES-BACKLOG.md`, `docs/rules/` (schede regole).
