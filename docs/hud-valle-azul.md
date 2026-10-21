# HUD di Valle Selvaggia e Azul: proposta (telefono e schermo comune)

Letto dal codice del repo il 21 ott 2026 (nessuna prova in browser: dove lo scrivo, è deduzione dal codice). Non ho toccato nulla: questo è solo il piano.

## 1. Cosa rende buoni Catan e Regicide (da replicare)

| Principio | Dove sta nel codice | Valle / Azul oggi |
|---|---|---|
| **Layout fisso**: la pagina è alta quanto lo schermo, niente scroll. Titolo e chip in alto, striscia giocatori, tavolo al centro, messaggio + comandi + mano in basso, barra con pannelli (Giocatori / Registro / Regole) | `22g-fisso.js` (`fixH`, `stripH`, set `FIXED`) | Né Valle né Azul sono in `FIXED`: scorrono, e `adaptScreen` li rimpicciolisce con `zoom` fino a 0,58. Azul in orizzontale sfora di 138 px (dal tuo `STYLE.md`) |
| **Vista TV dedicata**: funzione a parte (`catanTVH`, `regicideTVH`), tutto in vh/vw, solo info pubbliche, frase di stato grande, giocatori con numeri grandi, cronaca, carta dello scambio, schermata finale | `22f5-catan-tv.js`, `24j-regicide-tv.js`, `42-catan-tv.css`, `41-regicide-tv.css` | **Nessuna.** Sullo schermo comune appare la vista del telefono con `pointer-events:none` e un pannello QR a sinistra |
| **Tavolo che prende lo spazio che resta**, scalato con `--k` | `adaptScreen`, `30-adatta.css` | Plancia Valle: SVG con `width=354` fisso (`vBoardH`), quindi su una TV da 1920 px resta una piccola tessera al centro (da verificare a schermo). Azul: scala solo con `--tz` a 22 px |
| **Anteprima di ciò che succede** prima di toccare: costi sui bottoni, bersagli evidenziati, frase "cosa puoi fare" | `cTargets`, `ckbar` con costi | Valle ed Azul evidenziano solo le caselle legali; nessun punteggio previsto |
| **Telefono come controller** quando la plancia sta sul grande schermo | chip "Controller / Plancia" (`cscr`) in Catan | Non c'è |
| **Icone SVG, niente emoji** (tua decisione) | `01b-icone.js` (`ic()`), `resI()` | Valle: 12 righe con emoji (habitat, animali, pigna, clessidra). Azul: 3 (🏆, 🤝). Anche `fixH` usa 👥📜❓💥: da sistemare una volta sola per tutti |

## 2. Diagnosi specifica

**Valle Selvaggia** (`22b-valle-selvaggia.js`, `21-valle-selvaggia.css`)
- Gli habitat si distinguono **solo dal colore** (`VHC`): montagna grigia, foresta verde, prateria gialla, **palude acquamarina vs fiume blu** si confondono, soprattutto da lontano. Azul invece ha un glifo per ogni colore: è la regola "forma + colore" che hai già scritto in `hud-ux-ricerca.md`.
- I punti di ogni animale sono un blocco di testo che si apre con "Obiettivi" (`VGOAL`): sai che non ti piacciono le spiegazioni lunghe a schermo, e qui servirebbe invece un tracciato per animale con il punteggio in corso.
- Posare una tessera richiede coppia → casella → ruota → Posa (4 passaggi). Non c'è alcun "+N punti qui".
- Gli avversari si vedono solo toccando il nome: una valle alla volta.
- Sentiero (le 4 coppie tessera+animale) e comandi sono due righe separate, piccole.

**Azul** (`16-azul.js`, `14-azul.css`)
- Le fabbriche sono una griglia che va a capo: con 4 giocatori (9 fabbriche) occupano molto verticale; la tua plancia e quelle avversarie finiscono sotto la piega.
- Quando selezioni un colore non si illuminano le altre piastrelle dello stesso colore, né si oscurano le righe non valide (`AZUL.canLine` c'è già, ma si usa solo per evidenziare quelle valide).
- Nessuna anteprima di penalità del pavimento (−1/−1/−2/−2/−2/−3/−3) né dei punti che farà la piastrella sul muro.
- Il punteggio è un numeretto nell'intestazione; manca il tracciato 0-100 che dà il senso di corsa.

## 3. Proposte per il telefono

### Azul: layout fisso in tre fasce
1. **Alto**: chip Round / Sacchetto / "Muro libero", striscia giocatori (avatar, punti, mini-muro riassuntivo; tocco = pannello con la plancia di quel giocatore).
2. **Centro**: fabbriche come un'unica corona (cerchi piccoli intorno al centro, 5/7/9 secondo i giocatori) e il centro con il segnalino "1°".
3. **Basso**: la **tua plancia a tutta larghezza** (righe + muro + pavimento) e il messaggio. Niente scroll: le plance avversarie vanno nel pannello, non sotto.
- **Selezione intelligente**: toccata una piastrella, tutte quelle dello stesso colore (in fabbriche e centro) si alzano; le righe non valide si oscurano; sul bottone/pavimento compare l'esito ("prendi 3, 1 cade: −1").
- **Anteprima punti** sulle caselle del muro (`+3`) calcolata simulando `AZUL.act` su una copia dello stato: nessuna modifica al motore.
- Tracciato punteggio a bordo schermo (0-100, un segnalino per colore giocatore), con l'animazione `AZFX` già esistente che muove il segnalino.

### Valle Selvaggia: layout fisso e carte-animale
1. **Alto**: chip turni rimasti / tessere nel sacchetto / pigne; striscia giocatori con ★ in corso.
2. **Centro**: la valle **sempre intera** (viewBox già calcolata, va solo adattata allo spazio) con **habitat marcati da una trama** oltre al colore (montagna a triangoli, foresta a punte, prateria a righe, palude a onde corte, fiume a onde lunghe), disegnata in SVG originale.
3. **Sentiero + comandi** in una sola barra bassa: 4 coppie grandi, e a fianco rotazione/Posa solo quando servono.
- **Cinque carte-animale** (orso, cervo, pesce, falco, volpe) come mini-schede in una riga: ognuna mostra il tuo conteggio e i punti che stai facendo ora con quel criterio. Sostituisce il blocco di testo "Obiettivi"; la regola completa si apre solo al tocco (infobox), come hai chiesto.
- **Anteprima "+N"** sulla casella ＋ scelta (differenza di `VALLE.score` su una copia dello stato) e sul ghost mentre lo ruoti; rotazione anche con un tocco sul ghost.
- **Strisce avversarie**: una mini-valle per giocatore nel pannello Giocatori, per confrontare senza cambiare vista.

### Per entrambi
- Una sola barra in fondo come Catan: Giocatori · Registro · Regole (con icone SVG).
- Tutte le emoji sostituite da SVG originali (5 habitat, 5 animali, pigna, trofeo, stretta di mano): in stile con `01b-icone.js` e le piastrelle di Azul.
- `prefers-reduced-motion` rispettato come ora.

## 4. Proposte per lo schermo comune (TV)

Regola di Catan/Regicide: **la TV mostra il tavolo, il telefono mostra i comandi.** Vista nuova `valleTVH()` e `azulTVH()` che si agganciano come `catanH → catanTVH` (`if(ui.tv) return …`).

### Azul TV (informazioni tutte pubbliche, quindi la TV può mostrare tutto)
- Al centro **le fabbriche grandi in cerchio con il centro** e il segnalino del primo giocatore; la piastrella appena presa vola verso la riga (animazione già prevista in `AZFX`, va solo ancorata alle coordinate TV).
- Intorno, **le plance di tutti i giocatori in vista contemporanea** (2×2 con 4 giocatori, a fianco con 2-3), quella di chi gioca evidenziata, con righe/muro/pavimento leggibili da 3 metri.
- Bordo con il **tracciato punteggio 0-100**; in alto la frase di stato grande ("Tocca a Marco: scegli una fabbrica"), il round e il sacchetto.
- Fine round: una breve schermata con i punti guadagnati da ciascuno (righe/colonne/colori all'ultimo round) prima del finale.

### Valle Selvaggia TV
- **Tutte le valli visibili insieme**, ognuna in una griglia, quella di turno più grande; lo scorrimento tra giocatori non serve più.
- **Il sentiero** a lato, grande, con la coppia presa evidenziata; frase di stato grande ("Marco posa la tessera").
- **Le cinque carte-animale** con i punti attuali di ciascun giocatore in tabella (colonna per giocatore): è il pannello che oggi non esiste e che rende la partita leggibile a tutto il tavolo.
- Schermata finale con la tabella `vscore` già esistente, ingrandita e animata riga per riga.

### Ambizione 3D (opzionale, dopo)
Riusare l'infrastruttura di `CTV`/`RTV3` (three.js caricato su richiesta, fallback 2D se manca WebGL):
- Valle: tessere esagonali **in rilievo** (montagne alte, foresta con alberelli, acqua incassata) e animali come piccoli segnalini. Ha senso solo sulla TV.
- Azul: fabbriche come piatti con piastrelle a spessore, riflessi sulla ceramica.
Costo alto in token e in tempo per il valore rispetto al resto: lo metterei per ultimo.

## 5. Ordine di lavoro proposto (con la tua attenzione ai token)

| Fase | Cosa | Perché in questo ordine |
|---|---|---|
| 0 | Icone SVG: 5 habitat + trame, 5 animali, pigna, trofeo; tolte le emoji da `fixH` | Serve a tutte le fasi successive e chiude una tua decisione già presa |
| 1 | **Azul** layout fisso + selezione intelligente + anteprime (telefono) | È il gioco con più problemi di spazio, il lavoro è quasi tutto CSS e vista, il motore non cambia |
| 2 | **Valle Selvaggia** layout fisso + carte-animale + anteprima +N (telefono) | Stessa tecnica; l'anteprima usa il motore esistente |
| 3 | **Vista TV di Azul** | Ha la struttura più semplice (nessuna informazione nascosta) |
| 4 | **Vista TV di Valle** | Richiede il pannello punteggi per animale già fatto in fase 2 |
| 5 | Controller su telefono (come `cscr` di Catan): in TV la plancia grande, sul telefono solo i comandi | Dopo che le TV esistono |
| 6 | (Opzionale) 3D sulla TV | Solo se resta voglia e budget |

**Verifiche per fase** (come da `CLAUDE.md`): `npm run verifica`; `npm test -- azul valle`; screenshot una sola volta a fine fase a 390×844 e 1920×1080. Nessun mockup separato: scrivo direttamente il codice sul ramo `design/…` e ti mostro lo screenshot finale, così non spendi il tuo budget in bozze.

## 6. Cosa non so (da controllare prima di partire)
- Come appaiono oggi Valle e Azul su una TV vera: lo deduco dal CSS, non l'ho visto.
- Se `AZUL.act` in fase `tile` si può simulare su copia senza effetti (credo di sì: `act` clona lo stato); va confermato con un test.
- Quanto vincola il Chromecast (Presentation API) l'uso di WebGL per la fase 6.
