# A7 — Motore del racconto: formato dei capitoli e come si usa

Piano breve in `docs/AVVENTURA.md` (A7). Questo documento è il **manuale di chi scrive un capitolo** (A8) e di chi lo collega al resto (A9). Nessun nome di marchio: i modelli di riferimento si descrivono, non si citano.

## 1. File e responsabilità
| File | Costante | Ruolo |
|---|---|---|
| `motori/27p-avv-compagni.js` (+ `tests/test_avv_compagni.js`) | `ACMP` | scheda da eroe, posti, approvazione −100…+100, abbandono, missione personale |
| `motori/27q-avv-racconto.js` (+ `tests/test_avv_racconto.js`) | `ARAC` | condizioni, effetti, prove, scene e nodi, vista, scene disponibili, cantare, **validatore** |
| `motori/27r-avv-eventi.js` (+ `tests/test_avv_eventi.js`) | `AEVE` | 30 eventi di strada, missioni secondarie generate dal seme |
| `app/24hi-dialogo.js`, `css/39d-dialogo.css` | `Dia` | vista a tutto schermo del dialogo, «Racconto di prova» nella pagina Avventura |
| `src/avventura/<id>.json` | | i capitoli; il build li valida con `ARAC.valida` e li scrive in `dist/avventura/<id>.<hash>.json` (scaricati al bisogno, indice in `Dia.INDICE`) |
| `motori/24-locandiere.js` | `LOC` | `LOC.apertura(c)` e `LOC.chiusura(c)`, domanda «a che punto siamo?» (`c.cantare` = `ARAC.cantare(…)`) |

Il piano parlava di `44-avv-racconto.js`: i numeri sono quelli della serie 27 (ordine di caricamento), come per le altre task. Lo stato del racconto (`s`) è JSON, il dado è `s.rng` (`ADADI`): niente `Math.random`, il test lo controlla.

## 2. Il capitolo
```jsonc
{ "id":"corona", "titolo":"La Corona Spezzata", "sottotitolo":"…",
  "personaggi": { "oste": {"nome":"…","razza":"umano","classe":"guerriero","aspetto":{"pelle":1,"capelli":2,"mantello":3,"viso":1}} },  // ritratto = quello degli eroi
  "compagni":   { "ilda": { …vedi §5… } },
  "missioni":   { "voce": {"titolo":"…","descr":"…","ricompensa":[ effetti ],"scena":"id (facoltativa)"} },
  "luoghi":     { "pozzo": {"nome":"…"} },           // per «sposta», «luogo» e «dove»
  "bandiere":   [],                                   // bandiere impostate fuori dal racconto (dall'orchestratore)
  "ingressi":   ["scena", …],                         // scene che l'orchestratore può avviare «da fuori»
  "sommario":   [ {"se": cond, "testo":"…"} ],        // righe del «Nella sessione precedente…»
  "prossimo":   [ {"se": cond, "testo":"…"} ],        // chiusura: vale la prima che si verifica (l'ultima senza «se» è il ripiego)
  "scene": { "id": { "dove":"luogo|[luoghi]", "se": cond, "una": true, "inizio":"nodo", "nodi": { … } } } }
```
**Nodo**: `{ chi, testo (≤ 700 lettere), effetti:[…], …UNA uscita }` con `chi` = id di un personaggio o compagno, oppure `_` (narratore, senza ritratto). Le uscite sono `scelte:[…]`, `vai:"nodo"` (Continua), `scena:"altra"` (si passa a un'altra scena) o `fine:true|"esito"` (Chiudi: l'esito torna all'orchestratore). Gli effetti del nodo scattano quando **ci si entra**.
**Scelta**: `{ t, se, mostra, una, tono:[…], etichetta, effetti:[…], …UNA uscita (vai|scena|fine) oppure prova }`.
- `se`: se non vale, la scelta non si vede (con `mostra:true` si vede spenta, con il motivo).
- `una:true`: sparisce dopo averla usata in quella scena.
- `etichetta`: sovrascrive quella automatica. Automatiche: prova → `[Persuasione 65%]` (probabilità del migliore in piedi); `se` con classe/razza/oggetto/livello/oro → `[Solo Mago]`, `[Solo Nano]`, `[Con Pozione di cura]`, `[Livello 3]`, `[20 monete]`; effetto `oro` negativo → `[20 monete]`.
- `tono:["pieta","onore","avidita","durezza","mistero",…]`: ogni compagno nel gruppo reagisce in base ai suoi `valori` (§5).
- `prova`: `{ ab, cd (5–25), chi, vant, ok:{vai|scena|fine, testo, effetti, tono}, ko:{…} }`. Tira il migliore in piedi, oppure `chi` (id di compagno o `e1`…`e4`). Il tiro è `EROI.prova` col dado dello stato. `testo` appare come «nota» sopra il nodo seguente, insieme alla riga del tiro.

### Condizioni (`se`)
Una lista = tutte; una stringa = bandiera. Forme: `{bandiera:id}` · `{valore:id,min,max}` (bandiere numeriche, con `conta`) · `{non:c}` · `{e:[c]}` · `{o:[c]}` · `{classe}` · `{razza}` · `{oggetto}` (zaino, cintura o indossato di qualcuno, oppure `ctx.comune`) · `{livello:n}` (media del gruppo, per difetto) · `{compagno:id}` (è nel gruppo) · `{approv:id,min,max}` · `{missione:id,stato}` (`attiva`, `fatta`, `fallita`, `nessuna`) · `{oro:n}` · `{perdizione:n,max}` · `{giorno:n}` · `{luogo:id}`.

### Effetti (`{t, …}`)
- **Propri del racconto** (cambiano `s`): `bandiera{id,v}`, `conta{id,n}`, `togli{id}`, `approv{id,n}`, `recluta{id}`, `congeda{id}`, `missione{id,stato,passo}` (a `fatta` scatta la sua `ricompensa`), `diario{testo}`.
- **Per l'orchestratore** (finiscono in `fuori`, A9 li applica a `CAMP`/`Inv`/`ASCO`): `oro{n}`, `oggetto{id,n}` (negativo = toglie), `pf{pct}` (±, a ogni eroe in piedi), `perdizione{n}`, `xp{n}` (a testa), `razioni{n}`, `battaglia{fam|capo, diff, arena}`, `sposta{id}`, `apri{id: bottega|locanda|guaritore|tempio}`.
- `fuori` contiene anche `{t:'compagno', id, azione:'entra'|'attende'|'esce', motivo}`: per l'orchestratore, che costruisce la scheda con `ACMP.scheda(cap.compagni[id], livelloGruppo, id)`.

## 3. L'API di `ARAC`
```js
s = ARAC.nuovo(capitoloId, seme)                         // stato: bandiere, approv, compagni, missioni, scena, coda, fatte, sessioni, diario, rng…
r = ARAC.act(s, {t:'avvia', id}|{t:'scegli', i}|{t:'continua'}, cap, ctx)   // → {s, fuori, esito?} | {err}; lavora su una copia
ARAC.vista(s, cap, ctx)        // → {chi, testo, nota:{prova, testo}, scelte:[{i,t,etichetta,ok,perche,prova,chi}], continua, reazioni} | null
ARAC.disponibili(cap, s, ctx, luogoId)   // scene con «dove» in quel luogo, «se» valida e (se «una») non ancora viste
ARAC.cantare(cap, s, ctx)      // {titolo:'Secondo cantare', apertura:[righe], chiusura} per il Locandiere; ARAC.finisciSessione(s) → sessioni+1
ARAC.cond(c, s, ctx) · ARAC.etichetta(scelta, s, ctx) · ARAC.chiTira(ctx, prova) · ARAC.probDi(eroe, prova)
ARAC.valida(cap)               // → elenco di errori in italiano (vuoto = valido)
```
`ctx` lo prepara chi chiama: `{ eroi:[eroe completi, compagni compresi], oro, perdizione, giorno, luogo, comune:[id oggetti della compagnia], posti }`. Un congedo (compagno che se ne va per l'approvazione) si mette in `s.coda` e parte da solo quando la scena finisce.

### Il validatore (gira nel build e nei test)
Errori: nodo iniziale o di destinazione mancante · nodo irraggiungibile · **vicolo cieco** (un nodo da cui non si arriva mai a una fine o a un'altra scena) · nodo senza esattamente una uscita · scelte tutte condizionate (nessuna sempre disponibile) · prova senza `ok`/`ko` o con difficoltà fuori 5–25 · testo mancante o troppo lungo · personaggio, compagno, missione, luogo, scena, classe, razza, abilità, oggetto, famiglia, capo, ambiente, servizio sconosciuti · scena non raggiungibile (manca in `ingressi`, `dove`, compagni, missioni o in un'uscita) · **bandiera letta ma mai impostata** (di solito un refuso) · scheda di un compagno non valida (`EROI.valida`).

## 4. Eventi e missioni generate (`AEVE`)
- **30 eventi di strada**: 2–3 scelte, spesso una prova (difficoltà 11–14), esiti brevi con effetti piccoli (oro ≤ 30, PE ≤ 20, PF −20%…+25%, perdizione ≤ 3, battaglia facile o media). Etichette: terreni (vuoto = ovunque), `notte:true|false`, `p` = perdizione minima. `AEVE.eventoStrada(seme, {terreno, notte, perdizione, usati})` sceglie in modo ripetibile e non ripete finché ce ne sono altri; `AEVE.capitolo(ev)` lo trasforma in un capitolo-frammento di una scena, da far girare con `ARAC` come tutto il resto.
- **Missioni secondarie**: `AEVE.missione(seme, {luoghi:[{id,tipo,nome}], giorno, liv, origine})` → capitolo-frammento valido con `offerta` (ingresso: accetta, tratta con Persuasione, rifiuta), `arrivo` (`dove` = antro, rovina o torre, a missione attiva) e `ritorno` (`dove` = luogo del cliente). Tabelle: 5 tipi (recupero, caccia, salvataggio, indagine, consegna) × bersagli (antro, rovina, torre) × nemici × 6 complicazioni (nessuna, scadenza di 4 giorni, imboscata, doppio gioco, rivale +50% oro, maledizione +3 perdizione). L'orchestratore (A9) tiene i semi delle missioni generate, rigenera il frammento al caricamento e usa `AEVE.scaduta(cap, giorno)`.

## 5. Compagni (`ACMP`)
```jsonc
"ilda": { "nome":"Ilda","razza":"elfo","classe":"esploratore","base":{…27 punti…},"aspetto":{…},
  "liv":"gruppo",            // o un numero fisso
  "approv":0, "lascia":-40,  // parte da 0; se nel gruppo scende a −40 o meno se ne va (scena «addio» in coda)
  "fiducia":30, "personale":"fratello", "sceneP":"ilda-fratello",   // oltre 30 si apre la missione personale (bandiera «ilda-fiducia»)
  "scena":"ilda-parla", "addio":"ilda-addio",
  "valori":{"pieta":2,"onore":1,"avidita":-2,"durezza":-1},       // −3…+3: ogni punto pesa 4 di approvazione sui `tono` delle scelte
  "equip":{…}, "zaino":[…], "cintura":[…], "torna":false, "desc":"…" }
```
Livelli di approvazione: ostile (< −49), freddo (< −9), neutrale, amico (≥ 20), fedele (≥ 60). Con il gruppo pieno il compagno resta «in attesa» (`s.compagni[id].stato = 'attende'`). `ACMP.parla(s, cap, id)` dice quale scena aprire (personale se disponibile, altrimenti la chiacchierata). Bandiere automatiche: `<id>-fiducia`, `<id>-lascia`.

## 6. Il Locandiere
`ARAC.cantare` legge il `sommario` e il `prossimo` del capitolo dalle bandiere; `LOC.apertura({cantare})` dice «Secondo cantare, «Titolo». Nella sessione precedente… …», `LOC.chiusura` «Per oggi basta così… Il cantare è salvato». Alla domanda «a che punto siamo?» (anche «puntata», «sessione precedente», «dove eravamo») risponde con l'apertura. Nella pagina Avventura c'è già l'esempio col capitolo di prova («A che punto siamo?» / «Concludi la sessione»); in A9 `AVV` salverà `s.sessioni` con la campagna.

## 7. Vista (`Dia`)
Ritratto di chi parla (quello degli eroi, `Eroi.ritratto`; il narratore ha un libro), nome e classe, testo a comparsa (22 ms per tre lettere; un tocco lo mostra tutto; a movimento ridotto compare subito), nota con la riga del tiro («Fra Tomaso prova Percezione: 14 + 4 = 18 contro 12 — riesce.»), reazioni dei compagni («Ilda approva (+8)»), scelte in fondo con etichette `[…]` e «tira chi». Tutto schermo (`ui.dia`, barra delle destinazioni nascosta), bottoni ≥ 44 px. Un solo comando: `data-a="dl" data-v="avvia:id | scegli:i | continua | salta | chiudi | riprendi | parla:id | riassunto | sessione | nuovo"`. In A9 la vista passerà `ctx` veri (eroi della campagna, oro, perdizione, luogo) e applicherà `fuori`; ora, nella prova, registra solo l'oro e mostra il resto come elenco a fine scena.

## 8. Test
`test_avv_racconto` (capitolo di prova valido; 28 guasti che il validatore deve trovare; tutte le condizioni; etichette e probabilità; la scena del pozzo passo per passo; 600 semi per vedere che la frequenza delle prove segue la probabilità; compagni, abbandono, congedo in coda, fiducia, missione personale; cantare; niente `Math.random`), `test_avv_compagni` (scheda a ogni livello, posti, approvazione, soglie, reazioni, validazione), `test_avv_eventi` (30 eventi validi e giocati in ogni scelta ed esito, scelta ripetibile per terreno/notte/perdizione, 360 missioni valide e 60 giocate dall'offerta al pagamento in tutte le complicazioni), `test_locandiere` (cantare). Browser: scenario `avv_racconto` (34 controlli a 390 px).

## 9. Scarti dal piano
- Numeri dei file 27p–27r invece di 44; il capitolo si carica dal build (`/avventura/<id>.<hash>.json`) come i kit dei gialli.
- Le missioni generate sono capitoli-frammento (stesso formato e stesso validatore), non una struttura a parte.
- Gli effetti sul mondo (oro, oggetti, PF, perdizione, battaglie, spostamenti) escono come `fuori` e li applicherà `AVV` in A9: `ARAC` non conosce `CAMP`.
- Il capitolo vero (A8) non c'è ancora: `src/avventura/prova.json` è un campione di tre scene, due missioni, un compagno e il riassunto.
