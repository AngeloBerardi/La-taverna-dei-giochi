# Architettura

Una sola pagina, nessuna dipendenza. `scripts/build.js` concatena i file di `src/manifest.json` **in ordine**: un modulo può usare solo ciò che è definito sopra di lui (le funzioni chiamate a runtime, come le viste, possono stare sotto).

## Stato globale (in `app/07-stato.js`)
- `ui`: stato di interfaccia (schermata, selezioni, opzioni). `render()` ridisegna `#app` e ripristina il focus per id.
- `G`: stato della partita corrente (JSON-clonabile). `ME`: il giocatore di questo telefono. `R`: stanza/rete (`R.on`, `R.mine.votes`, membri, ospiti).
- `GAMES`: elenco giochi `{id,name,desc,range,ok(n),mode(n),opts?}`; `RULES[id]`: guida; `VIEW[id]`, `FX[id]`, `gameClick` in `app/25-registri.js`.
- Eventi: un solo `document.addEventListener('click')` con `data-a`/`data-v` e uno `switch(a)` in `app/11-comandi.js`.

## Contratto di un motore (`motori/`)
Costante globale pura, `module.exports` se esiste. API: `newGame(n,names,opts)`, `act(state,action)` → `{s}` oppure `{err}` (testo italiano). Lo stato contiene `n, names, hands, cur, log, ev, evn, over` (null o `{scores,win}`), opzionali `phase:'summary'`+`res`, `teams`. I giochi simultanei sono adattati a turni. Info nascoste: la vista mostra solo la mano di `viewer()`; per gli ospiti sullo stesso telefono `needCover()` mostra il passaggio del telefono.

## Giochi in tempo reale
Stato con `sim:true` (The Mind): nessun turno, ogni posto locale può agire, le azioni portano `seat` (riempito da `dispatch`); ultima scrittura vince. I giochi senza info nascoste (Harvest Valley) non usano il passaggio del telefono.

## Aggiungere un gioco
1. `motori/NN-nome.js` + test in node. 2. Riga in `GAMES`, testo in `RULES`, vista `nomeH()` in un file `app/`, `VIEW`/`FX`/click in `app/25-registri.js`, traccia in `Snd`. 3. File nuovi nel manifest. 4. `docs/rules/nome.md` come fonte.

## Lobby 3D (opzionale)
`app/12c0-taverna-kit.js` (asset procedurali, solo `window.TavernaKit`) e `app/12c-lobby-3d.js` (`L3D`): terza lobby scelta in Impostazioni → Lobby → "Locanda 3D" (`ui.lobby='3d'`, salvata in `rg-lobby`). Legge `lobbySeats()`, `members()`, `R.chat` e le emote; scrive solo `R.mine.av3` (pupazzo 3D, campo in più nel documento del membro, ignorato dalle altre lobby). Toccare una scatola apre lo scaffale dell'app (`ui.tab='games'`, `ui.pick`): l'avvio delle partite resta `startGame`. three.js r128 si scarica da cdnjs solo quando serve; senza WebGL o senza rete si torna al falò. Gira solo con `ui.screen==='room'`.

## Rete
Due modalità: stanze su database di Claude (`R.mode='db'`, solo dentro Claude) e p2p (`R.mode='p2p'`) con due trasporti: PeerJS/WebRTC (`pj`) e relay MQTT su WebSocket (`mq`, `08-relay-mqtt.js`, broker pubblici non cifrati: niente dati sensibili). Invito: `?room=CODICE&b=indice_broker`. Su Netlify la strada prevista è un server a parte (vedi il backlog tecnico in `docs/GAMES-BACKLOG.md`).

## Mappa dei moduli (generata)
| File | KB | Simboli principali |
|---|---|---|
| `css/01-base.css` | 5 |  |
| `css/02-carte.css` | 3 |  |
| `css/03-arena-e-boss.css` | 6 |  |
| `css/04-mano.css` | 1 |  |
| `css/05-menu.css` | 1 |  |
| `css/06-effetti.css` | 8 |  |
| `css/07-stanza-e-lobby.css` | 2 |  |
| `css/08-tavoli.css` | 2 |  |
| `css/09-carte-napoletane.css` | 1 |  |
| `css/10-burraco.css` | 1 |  |
| `css/11-tabelle-punti.css` | 1 |  |
| `css/12-the-gang.css` | 5 |  |
| `css/13-saboteur-la-miniera.css` | 4 |  |
| `css/14-azul.css` | 3 |  |
| `css/15-piacentine.css` | 1 |  |
| `css/16-isola.css` | 2 |  |
| `css/17-machiavelli.css` | 1 |  |
| `css/18-lobby-falo.css` | 8 |  |
| `css/19-lobby-iso.css` | 1 |  |
| `css/20-sala-hall-e-nuovi-giochi.css` | 46 |  |
| `js/motori/01-regicide.js` | 7 | RG, SU, HAND, RND, P, cv, clone |
| `js/motori/02-briscola-scopa.js` | 7 | IT, RND, shuffle, P, deck, clone, SN |
| `js/motori/03-burraco.js` | 8 | BURR, RND, shuffle, clone, P, PTS, SYM |
| `js/motori/04-the-gang.js` | 14 | GANG, RND, clone, P, SYM, COL, CAT |
| `js/motori/05-saboteur.js` | 14 | SAB, RND, clone, N, rot, C, TOOLS |
| `js/motori/06-azul.js` | 7 | AZUL, RND, clone, FLOOR, L, colOf, rowHas |
| `js/motori/07-isola.js` | 9 | ISLE, RND, clone, NAMES, POW, LO, top |
| `js/motori/08-machiavelli.js` | 8 | MACH, RND, clone, SU, parse, isJ, base |
| `js/vendor/09-peerjs.js` | 91 |  |
| `js/motori/10-coda.js` | 1 |  |
| `js/motori/11-the-mind.js` | 7 | MIND, RND, MAXL, REW, BLIND, cap, col |
| `js/motori/12-harvest-valley.js` | 6 | HARV, RND, DIMS, deckList, key, newGame, cells |
| `js/motori/13-scoundrel.js` | 3 | SCOUN, RND, val, NAMES, deck, L, deal |
| `js/app/01-base.js` | 1 | $, SYM, ST, RM, SP |
| `js/app/02-narrazione.js` | 2 | TITLES, QUOTES, TAUNT, IMMTXT, ACTS, STORY, pick |
| `js/app/03-audio.js` | 11 | Snd |
| `js/app/04-carte-render.js` | 1 | PIPS, ART |
| `js/app/05-carte-figura-dipinte.js` | 23 | FACE, PAL, GOLD, o, INKC, hatchOf, p |
| `js/app/06-effetti.js` | 9 | PF, pinit, burst, ptick, ctr, add, say |
| `js/app/07-nucleo.js` | 66 | G, ui, ME, R, ENG, GAMES, GN |
| `js/app/08-relay-mqtt.js` | 6 | MQ, mqConnect, mqRid, MQConn, MQPeer |
| `js/app/09-rete-p2p.js` | 8 | P2P, p2pPeerOpts, p2pParent, p2pClone, p2pSnap, p2pNotify, p2pApply |
| `js/app/10-carte-piacentine.js` | 4 | pstyle, PSU, PSC, psv, pfig |
| `js/app/11-carte-napoletane.js` | 12 | NAP |
| `js/app/12-sala-hall.js` | 17 | HALL, hallScene |
| `js/app/13-regicide.js` | 7 | pileH, regicideH, regClick, regPre |
| `js/app/14-the-gang.js` | 11 | GCOL, gcardH, chipH, gangH, specPanel, gcardModal, handGuide |
| `js/app/15-saboteur.js` | 12 | SEP, tileSVG, SAI, SAN, sabCardH, sabTargets, sabotH |
| `js/app/16-azul.js` | 8 | AZC, azT, azFirst, azBoard, azulH, azSummary, azClick |
| `js/app/17-isola-arte.js` | 10 | ISD, OLN, SH, EL, PA, LN, EY |
| `js/app/18-isola.js` | 9 | itop, KK, iEye, IBG, IBGW, IVAL, isleCard |
| `js/app/19-machiavelli.js` | 6 | mWork, mOrig, mRemove, mCompact, mCardH, machH, machSummary |
| `js/app/20-the-mind.js` | 6 | MCOL, mcardH, mindH, mindClick, MIFX |
| `js/app/21-harvest-valley.js` | 5 | HPC, hcardH, harvH, harvEnd, harvClick, HVFX |
| `js/app/22-scoundrel.js` | 3 | SSY, scardH, scoundH, sclClick, SCFXX |
| `js/app/23-registri-briscola-scopa-burraco.js` | 17 | ISU, IFIG, icardH, bcardH, deckH, briscolaH, brisClick |
| `js/app/24-avvio.js` | 1 |  |
