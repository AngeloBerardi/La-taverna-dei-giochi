# Architettura

Una sola pagina, nessuna dipendenza. `scripts/build.js` concatena i file di `src/manifest.json` **in ordine**: un modulo può usare solo ciò che è definito sopra di lui (le funzioni chiamate a runtime, come le viste, possono stare sotto).

## Stato globale (in `app/07-nucleo.js`)
- `ui`: stato di interfaccia (schermata, selezioni, opzioni). `render()` ridisegna `#app` e ripristina il focus per id.
- `G`: stato della partita corrente (JSON-clonabile). `ME`: il giocatore di questo telefono. `R`: stanza/rete (`R.on`, `R.mine.votes`, membri, ospiti).
- `GAMES`: elenco giochi `{id,name,desc,range,ok(n),mode(n),opts?}`; `RULES[id]`: guide (in `app/07d-regole.js`); `VIEW[id]`, `FX[id]`, `gameClick` nei registri di `app/23-registri-briscola-scopa-burraco.js`.
- Eventi: un solo `document.addEventListener('click')` con `data-a`/`data-v` e uno `switch(a)` in `app/07c-comandi.js`.

## Contratto di un motore (`motori/`)
Costante globale pura, `module.exports` se esiste. API: `newGame(n,names,opts)`, `act(state,action)` → `{s}` oppure `{err}` (testo italiano). Lo stato contiene `n, names, hands, cur, log, ev, evn, over` (null o `{scores,win}`), opzionali `phase:'summary'`+`res`, `teams`. I giochi simultanei sono adattati a turni. Info nascoste: la vista mostra solo la mano di `viewer()`; per gli ospiti sullo stesso telefono `needCover()` mostra il passaggio del telefono.

## Giochi in tempo reale
Stato con `sim:true` (The Mind): nessun turno, ogni posto locale può agire, le azioni portano `seat` (riempito da `dispatch`); ultima scrittura vince. I giochi senza info nascoste (Harvest Valley) non usano il passaggio del telefono.

## Aggiungere un gioco
1. `motori/NN-nome.js` + test in node. 2. Riga in `GAMES`, testo in `RULES`, vista `nomeH()` in un file `app/`, `VIEW`/`FX`/click nei registri (`app/23-registri-briscola-scopa-burraco.js`), traccia in `Snd`. 3. File nuovi nel manifest. 4. `docs/rules/nome.md` come fonte.

## Il nucleo dell'app (`app/07*.js`)
Un tempo un solo file di 93 KB, ora sette file concatenati in ordine (stesso ambito globale, quindi nessuna importazione):
| File | Contenuto |
|---|---|
| `07-nucleo.js` | stato (`ui`, `ME`, `R`), `ENG`, `GAMES`, posti e turni, stanza generale `GENROOM`, `INV`, codici |
| `07a-rete-stanza.js` | `netInit`, `enterHub`, ingresso p2p (invito, stanza generale), `joinRoom`, `subscribe`, `saveMine`, `savePos` |
| `07b-partita.js` | `startGame`, rivincita, ritorno alla stanza, coda degli stati (`pushState`, `applyState`), `dispatch` |
| `07c-comandi.js` | listener di click, change, keydown: lo `switch` delle azioni `data-a` |
| `07d-regole.js` | `RULES`: i testi delle regole in-game, una scheda per riga |
| `07d-viste-comuni.js` | HUD, regole (modale), impostazioni, storia, schermata del nome |
| `07e-lobby-falo.js` | lobby falò e sala: scaffale, scatole, avatar, chat, editor dell'avatar |
| `07f-viste-gioco.js` | viste comuni di partita (copertura, fine, mani), `render`, `afterRender`, chat |
Per aggiungere codice cerca la funzione con `grep -n` e apri solo quel file.

## Lobby 3D (predefinita)
`app/12c-lobby-3d.js` (`L3D`, generato da `tools/taverna3d/`) è la lobby di base: ingresso, locanda e boschetto in un overlay `#l3d` sopra `#app`. Con `ui.lobby==='3d'` `nameH`/`roomH` disegnano solo le modali (regole, impostazioni) e `afterRender` chiama `L3D.show(screen)`; in partita l'overlay si nasconde. Usa le azioni esistenti (`setname`, `addguest`, `rmguest`, `join`, `newroom`, `genroom`, `copy`, `chatsend`, `emo`, `rules`, `resume`) e `startGame` per avviare. Nel documento del membro aggiunge `av3`, `pos3`, `prop`/`pv` (proposta di gioco con voto ✓/✗ in 30 s, la avvia chi propone), `juke`. three.js r128 è in `vendor/09c-three.min.js`. Senza WebGL, o se gira sotto ~12 fps, si passa al falò (`ui.lobby='iso'`, salvato in `rg-lb`); da Impostazioni → Lobby si sceglie Taverna 3D, Falò (modalità semplice) o Sala.

## PWA (app installabile)
`src/pwa/` finisce nella radice di `dist/` (`scripts/build.js`): `manifest.webmanifest`, icone, `sw.js` (il service worker deve stare in `/`). `__BUILD__` in `sw.js` diventa l'hash della pagina: a ogni deploy cambia la cache e la vecchia viene cancellata. Strategia: pagina **prima la rete** (ripiego sulla copia dopo 4 s o offline), asset e font **dalla cache e aggiornati in sottofondo**, WebSocket e `/.netlify/` mai toccati. `app/24-pwa.js` registra il worker, controlla gli aggiornamenti quando l'app torna in primo piano, ricarica solo fuori partita e gestisce il pulsante «Installa l'app» (impostazioni). `sw.js` ha già `push` e `notificationclick` per le notifiche (dati `{title, body, url}`), da collegare a Firebase Cloud Messaging. Icone: `python3 tools/pwa/mk-icone.py`.

## Firebase (profilo online)
`app/24a-firebase.js` (`FB`): l'SDK si importa da gstatic **solo dopo l'ingresso** (`enterHub` → `FB.start()` dopo 1,5 s), mai in blocco. Accesso anonimo → `players/{uid}`. Il premio di fine partita parte da `pushState` (`FB.matchEnd`, una volta per partita e per telefono; `iWon` in `07f` decide la vittoria) e passa da una coda in `localStorage` (`rg-fbq`) svuotata in ordine: se è offline o le regole rifiutano (un premio ogni ~50 s) resta in coda. Qualsiasi errore Firebase è solo un avviso nelle impostazioni: il gioco non dipende da lui. Regole: `firestore.rules`; piano e limiti: `docs/FIREBASE-PIANO.md`.

## Rete
Due modalità: stanze su database di Claude (`R.mode='db'`, solo dentro Claude) e p2p (`R.mode='p2p'`) con due trasporti: PeerJS/WebRTC (`pj`) e relay MQTT su WebSocket (`mq`, `08-relay-mqtt.js`, broker pubblici non cifrati: niente dati sensibili). Su Netlify la strada prevista è un server a parte (vedi il backlog tecnico in `docs/GAMES-BACKLOG.md`).
- **Stanza generale** (`GENROOM`, "PIAZZA"): tutti entrano qui; se nessuno la ospita la ospita il primo arrivato. Se chi la ospita se ne va, il primo ospite che ci riesce subentra con lo stato già in mano (`p2pRecoverGeneral`, `p2pTakeover`). Le stanze private si creano con `newroom`.
- **Invito**: `?room=CODICE&b=indice_broker` per le private. L'ospite riprova con pazienza fino a ~75 s (l'host può essere in background) senza creare stanze di ripiego; poi ripiega sulla stanza generale.
- **Rientro in primo piano**: `p2pWake` (visibilitychange, pageshow, online) controlla il broker con un ping (`revive`), riallinea i timer dei collegamenti e accelera il recupero. Un socket morto in silenzio è il caso tipico dopo il foglio di condivisione.
- **Scritture**: gli ospiti inviano `set` all'host, che le valida con `p2pValid` (solo la stanza ospitata, il proprio documento tra i membri, oggetti fino a 256 KB) e le trasmette a tutti con `put`.
- **Posizioni 3D**: `savePos` scrive la posizione nel documento del membro; la lobby 3D la manda circa ogni 0,45 s mentre ci si muove.
- **Test**: `tools/test-rete/` (broker locale e due browser headless), fuori da `npm test` perché servono dipendenze extra.

## Mappa dei moduli (generata)
Rigenerala con `npm run mappa` (`scripts/mappa-moduli.js`).
<!-- mappa:inizio -->
| File | KB | Simboli principali |
|---|---|---|
| `html/head.html` | 1 |  |
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
| `css/20-lobby-campeggio-e-sala.css` | 16 |  |
| `css/21-valle-selvaggia.css` | 2 |  |
| `css/22-discesa-tascabile.css` | 3 |  |
| `css/23-scaffale-scatole.css` | 4 |  |
| `css/24-gattini.css` | 3 |  |
| `css/25-catan.css` | 5 |  |
| `css/26-fisso.css` | 4 |  |
| `css/27-pets.css` | 2 |  |
| `css/28-uno.css` | 2 |  |
| `css/29-trono.css` | 6 |  |
| `css/30-adatta.css` | 2 |  |
| `css/31-orizzontale.css` | 1 |  |
| `css/32-perudo.css` | 3 |  |
| `css/90-lobby-3d.css` | 19 |  |
| `html/mid.html` | 1 |  |
| `js/motori/01-regicide.js` | 8 | RG, SU, HAND, RND, P, cv, clone |
| `js/motori/02-briscola-scopa.js` | 7 | IT, RND, shuffle, P, deck, clone, SN |
| `js/motori/03-burraco.js` | 8 | BURR, RND, shuffle, clone, P, PTS, SYM |
| `js/motori/04-the-gang.js` | 14 | GANG, RND, clone, P, SYM, COL, CAT |
| `js/motori/05-saboteur.js` | 14 | SAB, RND, clone, N, rot, C, TOOLS |
| `js/motori/06-azul.js` | 7 | AZUL, RND, clone, FLOOR, L, colOf, rowHas |
| `js/motori/07-isola.js` | 9 | ISLE, RND, clone, NAMES, POW, LO, top |
| `js/motori/08-machiavelli.js` | 8 | MACH, RND, clone, SU, parse, isJ, base |
| `js/vendor/09-peerjs.js` | 91 |  |
| `js/vendor/09c-three.min.js` | 589 |  |
| `js/motori/10-coda.js` | 1 |  |
| `js/motori/11-the-mind.js` | 7 | MIND, RND, MAXL, REW, BLIND, cap, col |
| `js/motori/12-harvest-valley.js` | 6 | HARV, RND, DIMS, deckList, key, newGame, cells |
| `js/motori/13-scoundrel.js` | 3 | SCOUN, RND, val, NAMES, deck, L, deal |
| `js/motori/14-valle-selvaggia.js` | 10 | VALLE, RND, clone, HAB, HN, K, L |
| `js/motori/15-discesa-tascabile.js` | 20 | DISC, RND, W, L, MAPS, BOSSMAP, MON |
| `js/motori/16-perudo.js` | 5 | PERU, RND, FN, clone, L, alive, total |
| `js/motori/17-gattini.js` | 11 | KITT, RND, clone, T, NAMES, CATS, IMPC |
| `js/motori/18-catan.js` | 19 | CATAN, RND, clone, RES, RN, COST, LIM |
| `js/motori/19-pets.js` | 8 | PETS, RND, clone, COUNTS, NAMES, TARGET, L |
| `js/motori/20-uno.js` | 6 | UNO, RND, clone, COLORS, col, pts, L |
| `js/motori/21-trono.js` | 10 | THRONE, RND, clone, TYPES, VAL, NAMES, MANIP |
| `js/app/01-base.js` | 1 | $, SYM, ST, RM, SP |
| `js/app/02-narrazione.js` | 2 | TITLES, QUOTES, TAUNT, IMMTXT, ACTS, STORY, pick |
| `js/app/03-audio.js` | 14 | Snd |
| `js/app/04-carte-render.js` | 1 | PIPS, ART |
| `js/app/05-carte-figura-dipinte.js` | 23 | FACE, PAL, GOLD, o, INKC, hatchOf, p |
| `js/app/06-effetti.js` | 9 | PF, pinit, burst, ptick, ctr, add, say |
| `js/app/07-nucleo.js` | 10 | G, ui, ME, R, ENG, GAMES, GN |
| `js/app/07a-rete-stanza.js` | 7 | netInit, unsubAll, enterHub, p2pCreate, p2pEnter, p2pGeneral, netErr |
| `js/app/07b-partita.js` | 3 | defOpts, startGame, rematch, toLobby, Q, pushState, coverCheck |
| `js/app/07c-comandi.js` | 6 |  |
| `js/app/07d-regole.js` | 30 | RULES |
| `js/app/07d-viste-comuni.js` | 4 | seen, hudH, rulesH, cfgH, storyH, nameH |
| `js/app/07e-lobby-falo.js` | 25 | TVC, TVG, tvInfo, TVB, TVPX, TVP, tvExt |
| `js/app/07f-viste-gioco.js` | 7 | coverH, iWon, endH, playersH, fanH, bubbleH, gameH |
| `js/app/08-relay-mqtt.js` | 7 | MQ, mqConnect, mqRid |
| `js/app/09-rete-p2p.js` | 11 | P2P, p2pPeerOpts, p2pParent, p2pClone, p2pSnap, p2pNotify, p2pApply |
| `js/app/10-carte-piacentine.js` | 4 | pstyle, PSU, PSC, psv, pfig |
| `js/app/11-carte-napoletane.js` | 12 | NAP |
| `js/app/12-sala-hall.js` | 17 | HALL, hallScene |
| `js/app/12b-lobby-diorama.js` | 17 | ISO, N, PAL, SPR, FIX, EMO, STUMPS |
| `js/app/12c-lobby-3d.js` | 169 |  |
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
| `js/app/22b-valle-selvaggia.js` | 11 | VHC, VHI, VAI, VGOAL, vPix, vCorner, vEdgeTri |
| `js/app/22c-discesa-tascabile.js` | 14 | DMEA, DSN, DPIP, ddieH, dMonIcon, dGridH, dStatsH |
| `js/app/22d-perudo.js` | 6 | PDP, dieH, peruDefault, peruH, peruClick, PEFX |
| `js/app/22e-gattini.js` | 12 | KST, KORD, kcardH, kSort, kEffTxt, kittH, kittClick |
| `js/app/22f-catan.js` | 17 | CPC, CTC, CRI, CDV, CS, cbx, cGeo |
| `js/app/22g-fisso.js` | 4 | FIXED, fxOn, stripH, fxSheetH, fixH, fanH, fanFit |
| `js/app/22h-pets.js` | 8 | PPI, PTX, pcardH, petsH, petsClick, PTFX |
| `js/app/22i-uno.js` | 6 | UCOL, USYM, UORD, ucardH, uSort, unoH, unoClick |
| `js/app/22j-trono.js` | 9 | TCI, TTX, tcH, tcBack, thH, thClick, THFX |
| `js/app/23-registri-briscola-scopa-burraco.js` | 18 | ISU, IFIG, icardH, bcardH, deckH, briscolaH, brisClick |
| `js/app/24-pwa.js` | 2 | PWA |
| `js/app/24a-firebase.js` | 4 | FB |
| `js/app/25-avvio.js` | 1 |  |
| `html/tail.html` | 1 |  |
<!-- mappa:fine -->
