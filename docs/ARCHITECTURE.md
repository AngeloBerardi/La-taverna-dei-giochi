# Architettura

Una sola pagina, nessuna dipendenza. `scripts/build.js` concatena i file di `src/manifest.json` **in ordine**: un modulo può usare solo ciò che è definito sopra di lui (le funzioni chiamate a runtime, come le viste, possono stare sotto).

## Stato globale (in `app/07-stato.js`)
- `ui`: stato di interfaccia (schermata, selezioni, opzioni). `render()` ridisegna `#app` e ripristina il focus per id.
- `G`: stato della partita corrente (JSON-clonabile). `ME`: il giocatore di questo telefono. `R`: stanza/rete (`R.on`, `R.mine.votes`, membri, ospiti).
- `GAMES`: elenco giochi `{id,name,desc,range,ok(n),mode(n),opts?}`; `RULES[id]`: guida; `VIEW[id]`, `FX[id]`, `gameClick` in `app/25-registri.js`.
- Eventi: un solo `document.addEventListener('click')` con `data-a`/`data-v` e uno `switch(a)` in `app/11-comandi.js`.

## Contratto di un motore (`motori/`)
Costante globale pura, `module.exports` se esiste. API: `newGame(n,names,opts)`, `act(state,action)` → `{s}` oppure `{err}` (testo italiano). Lo stato contiene `n, names, hands, cur, log, ev, evn, over` (null o `{scores,win}`), opzionali `phase:'summary'`+`res`, `teams`. I giochi simultanei sono adattati a turni. Info nascoste: la vista mostra solo la mano di `viewer()`; per gli ospiti sullo stesso telefono `needCover()` mostra il passaggio del telefono.

## Aggiungere un gioco
1. `motori/NN-nome.js` + test in node. 2. Riga in `GAMES`, testo in `RULES`, vista `nomeH()` in un file `app/`, `VIEW`/`FX`/click in `app/25-registri.js`, traccia in `Snd`. 3. File nuovi nel manifest. 4. `docs/rules/nome.md` come fonte.

## Rete
Due modalità: stanze su database di Claude (`R.mode='db'`, solo dentro Claude) e p2p con PeerJS (`R.mode='p2p'`). Su Netlify la strada prevista è un server a parte (vedi il backlog tecnico in `docs/GAMES-BACKLOG.md`).

## Mappa dei moduli (generata)
| File | KB | Simboli principali |
|---|---|---|
| `css/01-base.css` | 5 |  |
| `css/02-carte.css` | 3 |  |
| `css/03-arena-e-boss.css` | 6 |  |
| `css/04-mano.css` | 1 |  |
| `css/05-menu.css` | 1 |  |
| `css/06-effetti.css` | 7 |  |
| `css/07-stanza-e-lobby.css` | 1 |  |
| `css/08-tavoli.css` | 1 |  |
| `css/09-carte-napoletane.css` | 1 |  |
| `css/10-burraco.css` | 1 |  |
| `css/11-tabelle-punti.css` | 1 |  |
| `css/12-the-gang.css` | 4 |  |
| `css/13-saboteur-la-miniera.css` | 3 |  |
| `css/14-azul.css` | 2 |  |
| `css/15-piacentine.css` | 1 |  |
| `css/16-isola.css` | 2 |  |
| `css/17-machiavelli.css` | 1 |  |
| `css/18-lobby-falo.css` | 7 |  |
| `js/motori/01-regicide.js` | 7 | RG, SU, HAND, RND, P, cv, clone |
| `js/motori/02-briscola-scopa.js` | 7 | IT, RND, shuffle, P, deck, clone, SN |
| `js/motori/03-burraco.js` | 8 | BURR, RND, shuffle, clone, P, PTS, SYM |
| `js/motori/04-the-gang.js` | 13 | GANG, RND, clone, P, SYM, COL, CAT |
| `js/motori/05-saboteur.js` | 13 | SAB, RND, clone, N, rot, C, TOOLS |
| `js/motori/06-azul.js` | 6 | AZUL, RND, clone, FLOOR, L, colOf, rowHas |
| `js/motori/07-isola.js` | 9 | ISLE, RND, clone, NAMES, POW, LO, top |
| `js/motori/08-machiavelli.js` | 8 | MACH, RND, clone, SU, parse, isJ, base |
| `js/vendor/09-peerjs.js` | 90 |  |
| `js/motori/10-coda.js` | 1 |  |
| `js/app/01-base.js` | 1 | $, SYM, ST, RM, SP |
| `js/app/02-narrazione.js` | 1 | TITLES, QUOTES, TAUNT, IMMTXT, ACTS, STORY, pick |
| `js/app/03-audio.js` | 10 | Snd |
| `js/app/04-carte-render.js` | 1 | PIPS, ART |
| `js/app/05-carte-figura-dipinte.js` | 19 | FACE, PAL, GOLD, o, p, c, ln |
| `js/app/06-effetti.js` | 8 | PF, pinit, burst, ptick, ctr, add, say |
| `js/app/07-stato.js` | 4 | G, ui, ME, R, ENG, GAMES, GN |
| `js/app/08-rete.js` | 4 | netInit, unsubAll, enterHub, p2pCreate, p2pEnter, netErr, createRoom |
| `js/app/09-avvio.js` | 1 | defOpts, startGame, rematch, toLobby |
| `js/app/10-coda-stati.js` | 1 | Q, pushState, coverCheck, applyState, turnNote, intro, dispatch |
| `js/app/11-comandi.js` | 4 |  |
| `js/app/12-viste-comuni.js` | 12 | seen, hudH, RULES, rulesH, cfgH, storyH, nameH |
| `js/app/13-lobby-falo.js` | 18 | TVC, TVG, tvInfo, TVP, tvExt, tvSprite, TVEMO |
| `js/app/14-rete-p2p.js` | 7 | P2P, p2pPeerOpts, p2pParent, p2pClone, p2pSnap, p2pNotify, p2pApply |
| `js/app/15-carte-piacentine.js` | 10 | pstyle, PSU, PSC, psv, pfig, pileH, regicideH |
| `js/app/16-the-gang.js` | 11 | GCOL, gcardH, chipH, gangH, specPanel, gcardModal, handGuide |
| `js/app/17-saboteur.js` | 11 | SEP, tileSVG, SAI, SAN, sabCardH, sabTargets, sabotH |
| `js/app/18-azul.js` | 8 | AZC, azT, azFirst, azBoard, azulH, azSummary, azClick |
| `js/app/19-isola.js` | 16 | itop, KK, iEye, IBG, IBGW, azArt, IVAL |
| `js/app/20-machiavelli.js` | 5 | mWork, mOrig, mRemove, mCompact, mCardH, machH, machSummary |
| `js/app/21-carte-napoletane-francesi.js` | 2 | ISU, IFIG, icardH, bcardH, deckH |
| `js/app/22-briscola.js` | 2 | briscolaH, brisClick, BRFX |
| `js/app/23-scopa.js` | 4 | scopaH, summaryScopa, scopaClick, SCFX |
| `js/app/24-burraco.js` | 6 | burracoH, summaryBurraco, burClick, BUFX, endFx |
| `js/app/25-registri.js` | 1 | VIEW, FX, gameClick |
