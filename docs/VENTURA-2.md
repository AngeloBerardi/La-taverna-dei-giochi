# Cronache del Crocevia 2 — «Il Condottiero»

Progetto della prossima major release della pagina Avventura, soprattutto della **Compagnia di ventura**.
Scritto dall'architetto il 16 novembre 2026 dopo le PR 123–138 (regno, tattica, assedio, personaggi, dialoghi, TV e musica)
e una partita a 390×844 (mondo, città, mercato, incontro, battaglia, esito). Le schede eseguibili stanno in `docs/schede/`; questo file dice **perché** e **in che ordine**.

## Dove siamo (cosa si è visto giocando)
Il mondo è vivo e la pixel-art della mappa funziona. I problemi sono tre.

**1. La battaglia non si legge.** Dopo «Carica» la telecamera segue il capitano e le schiere escono dallo schermo: si vedono due grumi e un uomo solo.
Nessuno sa chi sta vincendo un gruppo per volta, non c'è un momento prima dello scontro (lo schieramento), il nemico gioca sempre allo stesso modo
(`VCAM.comanda`: avvicinamento, poi tutti alla carica) qualunque sia il regno o il signore. Il capitano pesa troppo: a truppe pari, chi ha il capitano vince 38 volte su 40.

**2. L'interfaccia parla troppo e si vede poco.**
- Barra alta: cinque numeri senza nome (320, 7/20, 4, 60, 0). Barra bassa: sei tasti scritti piccoli, la velocità in mezzo.
- I pannelli coprono due terzi dello schermo: la mappa, che è il pezzo più bello, sparisce.
- Città e mercato: ogni riga ha un bottone d'ottone (otto ottoni per schermata, la regola di `STYLE.md` ne vuole uno).
- Incontro: riquadri vuoti con i bottoni appesi a destra; non si capisce contro chi si combatte né dove.
- Battaglia: due barre senza etichetta in alto, due file da nove bottoni in basso (un quarto dello schermo).
- Etichette dei luoghi tagliate dal bordo («CETO»).

**3. Il mondo è largo ma poco profondo per un gioco di condottieri.** I signori vanno da soli (niente eserciti), i feudi rendono e basta,
non c'è niente di tuo che lavori per te (botteghe, carovane), e la strada tra due luoghi è vuota di storie.

Debito tecnico: `motori/28k-ven-mondo.js` pesa 110 KB e `app/24hw-ventura.js` 69 KB. Ogni scheda che li tocca rilegge pezzi enormi:
è la prima voce di costo in token. Va spezzato prima di tutto il resto.

## La visione
Restare noi stessi (Italia di ventura, condotte, cronache, telefoni e TV insieme) e prendere dai giochi di condottieri le tre cose che li rendono grandi:
**la battaglia come momento di comando**, **un mondo politico che si muove per eserciti**, **qualcosa di tuo da far crescere**.

Quattro pilastri, ognuno con la sua ondata:
| Ondata | Pilastro | Il giocatore sente che… |
|---|---|---|
| 0 | Fondamenta | (niente: è per noi) le schede costano la metà |
| 1 | Si vede e si capisce | ogni schermata si legge in tre secondi, la mappa resta sempre in vista |
| 2 | La battaglia è un racconto | ogni regno combatte a modo suo, ogni signore ha un carattere, si schiera, si sfida il capo, i gruppi cedono e si radunano, i compagni gridano |
| 3 | Il mondo si muove per eserciti | i signori si adunano, i feudi si costruiscono, le botteghe rendono, il crocevia racconta |

La nostra unicità, da non perdere: la **sfida a duello prima della battaglia** (singolar tenzone, riusa l'arena dei tornei), le **dottrine dei cinque regni**,
la **regia** della battaglia pensata anche per la TV, le **voci dei compagni** in campo, gli **incontri del crocevia** scritti a mano.

## Decisioni d'architettura (valgono per tutte le schede)
1. **Motori puri come oggi**: niente `Math.random`, `Date.now`, trigonometria in `28*`. Ogni novità di battaglia vive in `VCAM`, ripetibile dal seme; la risoluzione automatica gioca le stesse regole.
2. **Un solo posto per i numeri**: dottrine, morale dei gruppi, edifici, botteghe → `VDAT` (28j) o `VCAM.C`. Mai numeri sparsi nella vista.
3. **Lo stato salvato cresce solo con campi facoltativi**: chi legge un salvataggio vecchio trova `undefined` e usa il valore di base (come `s.zone||[]`). Niente `v:3`.
4. **La scheda della battaglia** (`VEN.campo` → `VCAM.nuovo`) è il contratto tra mondo e campo. Si aggiungono solo campi: `dott` (dottrina per lato), `indole` (del comandante nemico), `capoB` (il comandante nemico in campo), `sfida` (esito del duello), `schiera:true`.
5. **La vista non rifà i conti**: legge funzioni pure del motore (come `VCAM.quota`). Per il morale dei gruppi: `VCAM.morali(s,l)`.
6. **Interfaccia**: tre livelli di pulsante di `STYLE.md` (un ottone per schermata), fogli dal basso alti al più il 58% dello schermo, bersagli ≥ 44 px, niente emoji.
7. **Spezzare prima di aggiungere**: le schede R1 e R2 non cambiano comportamento e si provano con l'impronta dei salvataggi (stesso bot, stesso seme → stesso JSON).

## Ordine e dipendenze
```
R1 spacca-mondo ─┬─> B1 schieramento ─> B2 dottrine ─> B3 morale-gruppi ─┬─> B4 compagni-in-campo
                 │                                                       ├─> B7 sfida
R2 spacca-vista ─┼─> U1 hud-mondo ─> U2 luogo-mercato ─> U3 incontro     └─> B5 regia ─> B6 succo
                 └─> U4 hud-battaglia (dopo B1)          T4 menù Avventura (già scritta)
Ondata 3 (tracce, da completare con l'architetto): M1 eserciti · M2 feudi vivi · M3 affari · M4 crocevia
```
U e B si possono alternare (due persone, due rami): U tocca le viste, B i motori. B5/B6/U4 toccano tutti `24hv`: in fila, mai insieme.

## Chi esegue (modello da impostare nella chat)
| Scheda | Modello | Perché |
|---|---|---|
| R1, R2 | Sonnet + revisione forte | lavoro meccanico; il cancello è l'impronta identica |
| U1, U2, U3, U4 | Sonnet (`game-hud-designer` per il mockup se serve) + sguardo forte allo screenshot | viste e CSS dentro regole chiare |
| B1, B3, B5, B7 | Sonnet + revisione forte | contratti già fissati qui |
| B2 dottrine | Sonnet, **revisione forte obbligatoria** | è il cuore: bilanciamento con numeri attesi |
| B4 (parte testi), M4 testi | forte | scrittura (come V6c) |
| B6 succo | `artist` Sonnet | resa |
| M1–M4 | prima l'architetto (forte, sessione breve: «completa la scheda M1»), poi Sonnet | sono tracce |

Ogni scheda: chat nuova, `/scheda <id>`, una PR. Dopo ogni scheda di battaglia: `npm test -- ven_` (anche i lenti) e `node tools/avventura/ventura.js`.

## Fatto quando (release)
- A truppe pari e capitani pari, il lato con la dottrina «giusta» per il terreno vince il 55–70%, non il 95%; senza capitano dalla mia parte le battaglie pari stanno tra 40 e 60%.
- In una battaglia giocata a ×1 si vedono sempre entrambe le schiere quando si scontrano (regia), e dal solo HUD si capisce quale gruppo sta cedendo.
- Ogni schermata del mondo ha un solo ottone; mappa visibile con qualunque pannello aperto (almeno il 40% dell'altezza).
- I cinque regni si riconoscono da come combattono senza leggere il nome.
- Bot accorto a 60 giorni: nessun seme in rovina; bot a caso perde più di quanto vince (come oggi).

Fuori dalla release: mondo persistente a distanza (C3), banda contro banda (C4), ripiego senza WebGL. Restano in `VENTURA.md`.
