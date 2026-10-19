# La Taverna dei Giochi

Hub di giochi multiplayer per telefono, in italiano: una locanda 3D (con il falò pixel-art come modalità semplice) dove ci si siede al tavolo con gli amici e si sceglie un gioco dallo scaffale.

**Giochi (21 voci nello scaffale):** Regicide, Briscola, Scopa, Burraco, The Gang, Saboteur, Azul, L'isola dei predatori, Machiavelli, The Mind (+ Extreme), Harvest Valley, Scoundrel, Valle Selvaggia, Discesa Tascabile, Perudo, Exploding Kittens (2-10, con edizione Implosione), Catan (2-8, con ampliamenti 5-6 e 7-8), Power Hungry Pets, Uno, Behind the Throne.

## Come si usa
- Tutti entrano nella **stanza generale** ("PIAZZA"); le stanze private si creano dal pannello della stanza e si invitano con un link o un codice.
- Se chi ospita la stanza generale esce, un altro giocatore ne prende il posto con lo stato già in mano.

## Per sviluppare
- `dist/index.html`: il gioco (pagina unica generata da `npm run build`). Netlify pubblica la radice a ogni push su `main`.
- `src/`: sorgenti separati; `src/manifest.json` fissa l'ordine di concatenazione. `src/js/app/12c-lobby-3d.js` è **generato** da `tools/taverna3d/` (`python3 tools/taverna3d/mk.py`): non modificarlo a mano.
- `npm run check` = build + sintassi, prima di ogni push. `npm test` = simulazioni dei motori (`tests/`). `npm run mappa` aggiorna la mappa dei moduli in `docs/ARCHITECTURE.md`.
- `tools/test-rete/`: test manuali della rete a due client (broker locale, invito, subentro dell'host, validazione); istruzioni nel README della cartella.
- Multiplayer: PeerJS (WebRTC) con ripiego su relay MQTT (`js/app/08-relay-mqtt.js`) per reti 4G/NAT.
- Documentazione: `docs/ARCHITECTURE.md` (moduli e contratti), `docs/STYLE.md`, `docs/GAMES-BACKLOG.md`, `docs/rules/` (schede regole).
