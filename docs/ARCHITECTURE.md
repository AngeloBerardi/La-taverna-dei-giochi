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
`src/pwa/` finisce nella radice di `dist/` (`scripts/build.js`): `manifest.webmanifest`, icone, `sw.js` (il service worker deve stare in `/`). `__BUILD__` in `sw.js` diventa l'hash della pagina: a ogni deploy cambia la cache e la vecchia viene cancellata. Strategia: pagina **prima la rete** (ripiego sulla copia dopo 4 s o offline), asset e font **dalla cache e aggiornati in sottofondo**, WebSocket mai toccati. `app/24-pwa.js` registra il worker, controlla gli aggiornamenti quando l'app torna in primo piano, ricarica solo fuori partita e gestisce il pulsante «Installa l'app» (impostazioni). `sw.js` ha già `push` e `notificationclick` per le notifiche (dati `{title, body, url}`), da collegare a Firebase Cloud Messaging. Icone: `python3 tools/pwa/mk-icone.py`.

## Firebase (profilo online)
`app/24a-firebase.js` (`FB`): l'SDK si importa da gstatic **solo dopo l'ingresso** (`enterHub` → `FB.start()` dopo 1,5 s), mai in blocco. Accesso anonimo → `players/{uid}`. Il premio di fine partita parte da `pushState` (`FB.matchEnd`, una volta per partita e per telefono; `iWon` in `07f` decide la vittoria) e passa da una coda in `localStorage` (`rg-fbq`) svuotata in ordine: se è offline o le regole rifiutano (un premio ogni ~50 s) resta in coda. Qualsiasi errore Firebase è solo un avviso nelle impostazioni: il gioco non dipende da lui. Regole: `firestore.rules`; piano e limiti: `docs/FIREBASE-PIANO.md`.

## Bottega (cosmetici)
Catalogo puro in `motori/22-bottega.js` (id `slot-nome`, prezzo, descrizione). Il profilo ha `owned {id:true}` ed `equipped {slot:id}`; `FB.buy` (una transazione: scala le monete, aggiunge l'oggetto e lo mette in uso) e `FB.equip` (solo oggetti gratuiti o posseduti). Il dorso scelto è l'attributo `data-dorso` di `<html>` (`dorsoSel`, `applyTheme`), copiato in `localStorage` (`rg-dorso`) per applicarlo subito e offline; `Shop.sync()` lo riallinea al profilo e scarta scelte non possedute. CSS in `css/33-dorsi.css` (selettore doppio: anteprima `.d-xxx` e uso reale `[data-dorso=xxx]`). I prezzi sono anche in `firestore.rules`: lì l'acquisto è valido solo se compare **una** chiave nuova in `owned` e le monete scendono esattamente del prezzo; `npm run regole` genera quelle righe e `tests/test_bottega.js` fallisce se non coincidono.

## Account, classifica, ELO
`motori/23-elo.js` (dati puri): `ELO.vincitori(s)` dice chi ha vinto (singoli, pari merito, squadre di briscola/burraco; `null` per cooperativi e pareggi), `ELO.nuovo` calcola la valutazione (K 32, base 1000, zero-sum al tavolo). `FB.eloInfo` decide se una partita vale: tutti i posti sono giocatori con profilo (`uid` nel documento membro, nessun ospite, nessun uid ripetuto). Il punteggio si salva in `award` insieme al premio (`players/{uid}.elo {gioco: valore}`); le regole lo limitano a ±32 per partita su un solo gioco. `app/24c-account.js` (`Acc`): email (collega / accedi / password dimenticata / esci) e classifica (vittorie, partite, monete, ELO per gioco). `iWon` usa `ELO.vincitori`. Limite noto: il punteggio lo calcola il telefono di chi gioca (protezione leggera tra amici, come le monete).

## Locandiere
`motori/24-locandiere.js` (`LOC`): cervello a copioni (saluto per ora del giorno e profilo, consigli adatti a `n` giocatori che ruotano col giorno, regole di un gioco, monete, classifica, account, ospiti), ripetibile e senza rete. `app/24d-locandiere.js` (`Oste`): finestra dalle impostazioni; risponde sempre con i copioni, senza server. In futuro farà da master delle campagne.

## Partite a distanza
`app/24e-distanza.js`: `FsDb` implementa l'interfaccia di `R.db` (doc/collection: get, set, delete, onSnapshot) sopra Firestore (`partite/{codice}`, sottoraccolte `membri` e `chat`), quindi stanza, lobby e partite funzionano senza modifiche. In modalità `R.mode==='fs'` l'identità è `ME.dev='u:<uid>'` (stesso tavolo da qualsiasi telefono) e `savePos` non scrive (quota). Lo stato viaggia come testo JSON nel campo `j` (Firestore vieta array dentro array); accanto ci sono i campi leggibili `uids`, `turno` (a chi tocca), `nomi`, `phase`, `game`, `finita`, `rev` (`DIST.meta` in `motori/25-distanza.js`). La scrittura della stanza è una transazione: gli uid non si perdono e una scrittura con `rev` più vecchio viene rifiutata (`conflitto`). Si entra con codice di 8 caratteri o link `?dist=CODICE`; chi entra aggiunge solo il proprio uid (regole). `Dist` (impostazioni → Partite a distanza): nuova, entra, «Le mie partite» con «Tocca a te», elimina (solo chi l'ha creata, con membri e chat), esci. L'elenco si aggiorna ogni 90 s e al ritorno in primo piano; quando tocca a te compare un avviso (notifica del sistema se concessa e l'app è in secondo piano). **Limite noto:** con l'app chiusa non arrivano notifiche, serve un server che le invii (vedi docs/FIREBASE-PIANO.md). Anche qui tutti i dati della partita (mani comprese) sono leggibili da chi ha il codice.

## Schermo comune e QR
`?tv=CODICE` (`app/24f-schermo.js`, `TV`): la pagina entra nella stanza **in sola visione** (`joinRoom(code,true)`: nessun membro, nessuna chat, nessuna scrittura), con `ui.tv`, senza schermata del nome e senza profilo online (tranne per le partite a distanza, codice di 8 caratteri). `subscribe` mostra la partita anche a chi non ha un posto (`local()` è vuoto, quindi le viste mostrano il tavolo senza mani); fuori partita c'è `TV.lobbyH`. `#tvpanel` (a sinistra): QR per sedersi (`?room=` o `?dist=`), codice, gioco, giocatori con ▶ sul turno. `adaptScreen` ingrandisce fino a 2,6×. Dal telefono: impostazioni → «Schermo comune 📺» (QR e link). `motori/26-qr.js` genera il QR (byte, correzione M, versioni 1–15) senza librerie; `tests/test_qr.js` lo fa leggere a OpenCV. Se la connessione cade o il tavolo sparisce la TV riprova da sola ogni 6 s.

## Eroi e campagne
Eroi: `motori/27-eroi.js` (`EROI`: punteggi a 27 punti, razze, classi, derivati ricalcolati, `prova` d20) salvati in `players/{uid}/eroi/e1..e5` via `FB.eroi/salvaEroe/eliminaEroe`; vista `app/24g-eroi.js` (`Eroi`). Le regole `eroi` di `firestore.rules` sono generate da `scripts/regole.js`. Campagna: `motori/28-campagna.js` (`CAMP`, stato JSON puro, `act(stato, azione, rnd)` → `{s}`|`{err}`), anteprima `app/24h-campagna.js` (`Camp`). Piano: `docs/CAMPAGNE.md`.

## Rete
**Stanze sul database (`R.mode='rt'`, `app/24m-rete-rtdb.js`).** Terzo trasporto, con la stessa interfaccia `doc/collection/onSnapshot` di `R.db`: le stanze vivono su Firebase Realtime Database (`stanze/CODICE/d` stanza, `/m/DEV` membri, `/c/ID` chat, `/p/DEV` presenza con `onDisconnect`) e nessun telefono fa da host. Ogni documento è un testo JSON (`j`); la stanza si scrive in transazione con controllo di `rev` (stato più vecchio ⇒ `conflitto`). Chi non ha presenza da più di `RT.TOLLERANZA` ms viene tolto dalla stanza **in attesa** (mai durante la partita) e rientra da solo alla riconnessione. **Predefinito** (`RT.PREDEFINITO=true`; `?net=p2p` lo esclude, `?net=rt` lo forza): se il database non risponde in 10 s si ripiega sul p2p. Regole: `database.rules.json` (da pubblicare nella console, come `firestore.rules`).

**Trasporti p2p (ripiego).**
Due modalità: stanze su database di Claude (`R.mode='db'`, solo dentro Claude) e p2p (`R.mode='p2p'`) con due trasporti: PeerJS/WebRTC (`pj`) e relay MQTT su WebSocket (`mq`, `08-relay-mqtt.js`, broker pubblici non cifrati: niente dati sensibili). Su Firebase Hosting la strada prevista è un server a parte (vedi il backlog tecnico in `docs/GAMES-BACKLOG.md`).
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
| `css/25-catan.css` | 9 |  |
| `css/26-fisso.css` | 4 |  |
| `css/27-pets.css` | 2 |  |
| `css/28-uno.css` | 2 |  |
| `css/29-trono.css` | 6 |  |
| `css/29b-spie.css` | 1 |  |
| `css/29c-quiz.css` | 1 |  |
| `css/29d-zucca.css` | 1 |  |
| `css/29e-fantasma.css` | 1 |  |
| `css/30-adatta.css` | 2 |  |
| `css/31-orizzontale.css` | 1 |  |
| `css/32-perudo.css` | 3 |  |
| `css/33-dorsi.css` | 2 |  |
| `css/34-account.css` | 2 |  |
| `css/35-locandiere.css` | 1 |  |
| `css/36-distanza.css` | 1 |  |
| `css/37-schermo.css` | 2 |  |
| `css/38-eroi.css` | 5 |  |
| `css/39-campagna.css` | 3 |  |
| `css/40-legno-ottone.css` | 13 |  |
| `css/41-regicide-tv.css` | 6 |  |
| `css/42-catan-tv.css` | 5 |  |
| `css/43-tv-lowpoly.css` | 7 |  |
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
| `js/motori/18-catan.js` | 32 | CATAN, RND, clone, EXT, X, XS, RES |
| `js/motori/18b-catan-marinai.js` | 8 | DIRS, key, dist, split, SC, landOf, tryGen |
| `js/motori/18c-catan-cek.js` | 21 | K, TR, LV, KN, PC, HAND, F |
| `js/motori/19-pets.js` | 8 | PETS, RND, clone, COUNTS, NAMES, TARGET, L |
| `js/motori/20-uno.js` | 6 | UNO, RND, clone, COLORS, col, pts, L |
| `js/motori/21-trono.js` | 10 | THRONE, RND, clone, TYPES, VAL, NAMES, MANIP |
| `js/motori/22-bottega.js` | 1 | BOTTEGA |
| `js/motori/23-elo.js` | 2 | ELO |
| `js/motori/24-locandiere.js` | 6 | LOC |
| `js/motori/25-distanza.js` | 3 | DIST |
| `js/motori/26-qr.js` | 6 | QR |
| `js/motori/27-eroi.js` | 9 | EROI |
| `js/motori/28-campagna.js` | 12 | CAMP |
| `js/motori/29-spie.js` | 7 | SPIE, RND, clone, TN, WORDS, L, nm |
| `js/motori/30-domande.js` | 12 | DOMANDE, CATS, Q |
| `js/motori/31-quiz.js` | 5 | QUIZ, RND, clone, SQ, sq, L, nm |
| `js/motori/32-zucca.js` | 9 | ZUCCA, RND, clone, CATS, NC, MIMO, DISEGNO |
| `js/motori/33-fantasma.js` | 7 | FANTASMA, RND, clone, W, idx, G, nbr |
| `js/app/01-base.js` | 1 | $, SYM, ST, RM, SP |
| `js/app/01a-vendor.js` | 1 |  |
| `js/app/01b-icone.js` | 4 | ICONE, ic, glifo |
| `js/app/02-narrazione.js` | 2 | TITLES, QUOTES, TAUNT, IMMTXT, ACTS, STORY, pick |
| `js/app/03-audio.js` | 15 | Snd |
| `js/app/04-carte-render.js` | 1 | PIPS, ART |
| `js/app/05-carte-figura-dipinte.js` | 23 | FACE, PAL, GOLD, o, INKC, hatchOf, p |
| `js/app/06-effetti.js` | 9 | PF, pinit, burst, ptick, ctr, add, say |
| `js/app/07-nucleo.js` | 11 | G, ui, ME, R, ENG, GAMES, GN |
| `js/app/07a-rete-stanza.js` | 8 | netInit, netInit0, unsubAll, enterHub, enterHub0, p2pCreate, p2pEnter |
| `js/app/07b-partita.js` | 3 | defOpts, startGame, rematch, toLobby, Q, pushState, coverCheck |
| `js/app/07c-comandi.js` | 7 |  |
| `js/app/07d-regole.js` | 35 | RULES |
| `js/app/07d-viste-comuni.js` | 4 | lob3, seen, hudH, rulesH, cfgH, storyH, nameH |
| `js/app/07e-lobby-falo.js` | 26 | TVC, TVG, tvInfo, TVB, TVPX, TVP, tvExt |
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
| `js/app/22f-catan.js` | 8 | CPC, CTC, CKC, CRN, CRG, resI, CDV |
| `js/app/22f2-catan-mano.js` | 19 | CXUI, cxs, cScr, CKEYS, cName, costH, CMODE |
| `js/app/22f3-catan-cek.js` | 12 | CTK, cekE, cekKn, cekAct, cekTrack, cekDie, cekCanKnNew |
| `js/app/22f4-catan-tavolo.js` | 25 | CTV, SEA_Y, T, TEX, mul, hex2, shade |
| `js/app/22f5-catan-tv.js` | 4 | CTVP, catanTVstato, catanTVH |
| `js/app/22g-fisso.js` | 4 | FIXED, fxOn, stripH, fxSheetH, fixH, fanH, fanFit |
| `js/app/22h-pets.js` | 8 | PPI, PTX, pcardH, petsH, petsClick, PTFX |
| `js/app/22i-uno.js` | 6 | UCOL, USYM, UORD, ucardH, uSort, unoH, unoClick |
| `js/app/22j-trono.js` | 9 | TCI, TTX, tcH, tcBack, thH, thClick, THFX |
| `js/app/22k-spie.js` | 4 | SPCOL, SPT, spieH, spieClick, SPFX |
| `js/app/22l-quiz.js` | 5 | QPC, qcol, quizBoardH, quizH, quizClick, QZFX |
| `js/app/22m-zucca.js` | 5 | ZPC, zcat, zuccaBoardH, zuccaH, zuccaClick, ZUFX |
| `js/app/22n-fantasma.js` | 6 | FAC, FTK, fpos, fantasmaMapH, fantasmaH, fantasmaClick, FAFX |
| `js/app/23-registri-briscola-scopa-burraco.js` | 18 | ISU, IFIG, icardH, bcardH, deckH, briscolaH, brisClick |
| `js/app/24-pwa.js` | 2 | PWA |
| `js/app/24a-firebase.js` | 8 | FB |
| `js/app/24b-bottega.js` | 2 | Shop |
| `js/app/24c-account.js` | 6 | Acc |
| `js/app/24d-locandiere.js` | 3 | Oste |
| `js/app/24e-distanza.js` | 9 | FsDb, Dist |
| `js/app/24f-schermo.js` | 7 | TV |
| `js/app/24g-eroi.js` | 13 | Eroi |
| `js/app/24h-campagna.js` | 8 | Camp |
| `js/app/24i-plancia.js` | 12 | Plancia |
| `js/app/24j-regicide-tv.js` | 5 | RTV, regicideTVH |
| `js/app/24k-regicide-tavolo.js` | 17 | RTV3, T, TEX, CW, lin, M, hsh |
| `js/app/24l-regicide-attori.js` | 30 | RACT, T, SUC, lin, sat, mulb, hsh |
| `js/app/24m-rete-rtdb.js` | 7 | RT |
| `js/app/24n-tv-lowpoly.js` | 14 | LP, T, TOP, cir, GLY, AIDX, gsvg |
| `js/app/24o-azul-tv.js` | 9 | AZ3, R_, P, boardPos, lineAt, facPos, sq |
| `js/app/24p-valle-tv.js` | 9 | VL3, R_, ZR, HC, pix, cells, maj |
| `js/app/25-avvio.js` | 1 |  |
| `html/tail.html` | 1 |  |
<!-- mappa:fine -->
