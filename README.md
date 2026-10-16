# La Taverna dei Giochi

Hub di giochi multiplayer per telefono (Regicide, Briscola, Scopa, Burraco, The Gang, Isola, Machiavelli, Azul, Saboteur, The Mind (+Extreme), Harvest Valley, Scoundrel, Perudo, Exploding Kittens (2-10, con edizione Implosione), Catan (2-8, con ampliamenti 5-6 e 7-8)).

- `dist/index.html`: il gioco (pagina unica generata da `npm run build`).
- `src/`: sorgenti separati (carte figura dipinte in `faces.js`).
- `netlify.toml`: Netlify pubblica la radice del repository a ogni push su `main`.
- `npm test`: simulazioni dei motori nuovi (`tests/`).
- Multiplayer: PeerJS (WebRTC) con ripiego su relay MQTT (`js/app/08-relay-mqtt.js`) per reti 4G/NAT.
