# Fascicoli: i gialli classici come indagine di una serata (TV + telefoni)

Documento di progetto e piano di lavoro. Ogni passo in fondo ha un prompt pronto da dare a una sessione nuova.
Stato: **F1–F4 fatti** (motore, kit di prova, regia, telefono, TV, regole in-game, scenario nel browser; fascicolo 1 «La camera gialla» cifrato in `src/kit-cifrati/camera-gialla.json`, 2-8 telefoni, 170 minuti; F7–F10 fatti: «Le voci di via dell'Obitorio», «La pietra di luna», «Il cane della brughiera», «L'impronta scarlatta», cifrati, 2-8 telefoni, circa due ore ciascuno; prompt delle immagini in `docs/kit/<id>.md`). Nessuna soluzione di nessun caso sta in questo file (il repo è pubblico).

## 1. L'idea in una riga
Un caso d'archivio da riaprire in squadra, come le scatole d'indagine da tavolo e le stanze di fuga, ma dentro la Taverna:
la **TV è il muro delle indagini** (domande del caso, luoghi, interrogatori, timer, colpi di scena con voce e musica), ogni
**telefono è un investigatore** con una parte diversa del fascicolo. Nessuno ha tutto: si risolve solo parlando.
Durata: tutta la serata (circa 170 minuti, tre capitoli e un finale, con pausa cena prevista dal kit).

Differenza dalla «serata» in famiglie (`docs/SERATA.md`): qui non si recita un personaggio e non serve un narratore.
Si gioca in 2-8 con una squadra sola; la TV conduce da sé. I due formati condividono rete, regia, messa in scena e kit cifrati.

## 2. Come si gioca
**Scopo, sempre visibile sulla TV**: le **Domande del caso** (3-4 per capitolo, più l'accusa finale). Ogni cosa che si fa
serve a rispondere a una domanda. A fine capitolo la TV rivela le risposte giuste, assegna le stelle e apre il capitolo dopo.

**Specialità** (una per telefono; con meno di 4 telefoni si fondono nell'ordine del kit, con più di 4 si raddoppiano):
| Specialità | Solo lei può | Riceve soprattutto |
|---|---|---|
| Archivio | cercare nell'archivio per parola chiave (nome, data, targa…) | documenti, verbali, lettere |
| Scientifica | chiedere un'analisi (torna dopo alcuni minuti veri) | foto, referti, impronte |
| Testimoni | interrogare: sceglie le domande, la TV fa parlare il testimone | deposizioni, audio |
| Luoghi | esplorare un luogo toccando le zone dell'immagine | piante, mappe, oggetti trovati |

**Caposquadra**: uno per capitolo, a rotazione. È l'unico che consegna le risposte alle Domande del caso e l'accusa.
Gli altri votano sì/no sulla proposta: il caposquadra vede il consenso prima di confermare.

**Ore d'indagine** (la risorsa): ogni interrogatorio, analisi, zona esplorata e aiuto costa ore; una risposta sbagliata ne
toglie. Non bastano per fare tutto: si sceglie cosa seguire. Le ore avanzate e le risposte giuste danno il grado finale.

**Azioni**
1. *Reperti*: ognuno legge i suoi. Un reperto non si inoltra: si legge ad alta voce o si **proietta sulla TV** (al massimo
   tre alla volta sul muro, chi proietta il quarto toglie il più vecchio).
2. *Reperti spezzati*: due metà su due specialità diverse; si ricompone quando i due toccano «Unisci» entro 60 secondi
   (la TV lo annuncia). Con un telefono solo per entrambe le specialità si ricompone da solo.
3. *Collegamenti*: due o tre reperti di specialità diverse messi insieme aprono un quesito; la risposta giusta dà una
   **deduzione**, che finisce sulla linea del tempo della TV e può servire per altre domande, serrature o interrogatori.
4. *Serrature*: lucchetti digitali (codice, parola, ordine, scelta) che aprono reperti nuovi. Gli indizi per aprirli
   stanno su telefoni diversi. Tre livelli di aiuto, a pagamento.
5. *Interrogatori*: ogni testimone ha temi; alcuni compaiono solo se si possiede un reperto o una deduzione («mostragli la
   ricevuta»). La TV mostra il ritratto e legge la risposta con la voce: la sentono tutti.
6. *Analisi*: la Scientifica manda un reperto in laboratorio; la TV mostra il conto alla rovescia; l'esito è un reperto nuovo.
7. *Esplorazione*: l'immagine del luogo sul telefono dei Luoghi e, in grande, sulla TV; le zone toccate danno reperti.

**Ritmo di un capitolo (40-45 minuti)**: apertura sulla TV (racconto, nuovi reperti) → indagine libera a tempo → il
caposquadra consegna le risposte → rivelazione (giusto/sbagliato, stelle, colpo di scena) → pausa facoltativa.
**Finale**: accusa (chi, come, perché, tre reperti a sostegno) → ricostruzione passo per passo → epilogo secondo il
risultato (pieno, parziale, fallito) → grado della squadra.

## 3. Le storie: «La biblioteca del delitto»
Ogni fascicolo parte da un classico in pubblico dominio in Italia (autore morto da oltre 70 anni). Regole d'autore:
- **premessa e atmosfera del libro, soluzione nostra**: colpevole e meccanismo cambiano, così chi ha letto il libro non
  parte in vantaggio. La soluzione del libro compare come falsa pista che i reperti smentiscono;
- testi, nomi e documenti scritti da noi; nessun passo copiato dalle traduzioni (quelle hanno diritti propri);
- opere ancora protette (per esempio i romanzi di Agatha Christie, fino al 2046) si usano solo come genere
  («isola, invitati, uno alla volta»), mai per trama, nomi o titoli.

| N | Fascicolo (titolo di lavoro) | Dal classico | Meccanica firma |
|---|---|---|---|
| 1 | La camera gialla | G. Leroux, 1907: delitto in una stanza chiusa dall'interno | pianta interattiva del padiglione e ricostruzione dei movimenti minuto per minuto |
| 2 | Le voci di via dell'Obitorio | E. A. Poe, 1841: testimoni che sentono lingue diverse | deposizioni audio su telefoni diversi, da confrontare a orecchio |
| 3 | La pietra di luna | W. Collins, 1868: un diamante sparisce in una casa di campagna | ogni telefono ha il diario di un narratore diverso, e non tutti dicono il vero (adatto alle famiglie: è un furto) |
| 4 | Il cane della brughiera | A. Conan Doyle, 1902: una leggenda e una morte nella nebbia | mappa della brughiera da esplorare e analisi di laboratorio contro la superstizione |
| 5 | L'impronta scarlatta | R. A. Freeman, 1907: un'impronta che accusa l'uomo sbagliato | confronto d'impronte sul telefono e catena di custodia delle prove |

Si comincia dal n. 1. Ogni fascicolo ha le sue pagine di direzione artistica in `docs/kit/<id>.md` (senza soluzione).

## 4. Segretezza
Come per `ultima-luce`: il kit sta nel repo **solo cifrato** in `src/kit-cifrati/<id>.json` (`tools/kit/cifrati.js`).
La bibbia e il JSON in chiaro non si committano mai. Chi lavora a un kit lo riapre con
`node tools/kit/cifrati.js apri <busta> <frase> <uscita.json>` in una cartella fuori dal repo; la frase la dà Angelo nel prompt.
Il kit di prova `il-gatto-del-notaio` è invece pubblico (`src/kit/`), piccolo e senza pretese: serve ai test.

## 5. Formato del kit (`"formato": "fascicolo"`)
```json
{
  "id": "camera-gialla", "formato": "fascicolo", "titolo": "…", "sottotitolo": "…", "giocatori": [2, 8], "minuti": 170,
  "fonte": { "opera": "…", "autore": "…", "anno": 1907 },
  "scena": { "…": "come docs/GIALLI-SCENA.md: palette, musica, voce, atmosfera" },
  "specialita": [{ "id": "archivio", "nome": "Archivio" }, { "id": "scientifica" }, { "id": "testimoni" }, { "id": "luoghi" }],
  "ore": { "inizio": 12, "capitolo": 6, "errore": 1, "aiuto": [1, 1, 2] },
  "reperti": [{
    "id": "verbale", "titolo": "…", "tipo": "documento|foto|audio|oggetto|mappa", "testo": "…", "img": "…", "audio": "…",
    "a": "archivio | tutti | { \"meta\": [\"archivio\", \"luoghi\"], \"parti\": [\"…\", \"…\"] }",
    "capitolo": "I", "da": "inizio | { \"zona\": \"…\" } | { \"tema\": \"…\" } | { \"analisi\": \"…\" } | { \"serratura\": \"…\" } | { \"cerca\": [\"parola\"] }",
    "falsa": false
  }],
  "luoghi": [{ "id": "padiglione", "nome": "…", "img": "…", "capitolo": "I",
    "zone": [{ "id": "finestra", "nome": "…", "x": 0.1, "y": 0.2, "w": 0.2, "h": 0.3, "ore": 1, "testo": "…" }] }],
  "persone": [{ "id": "custode", "nome": "…", "ruolo": "…", "colpevole": false,
    "temi": [{ "id": "notte", "domanda": "…", "risposta": "…", "ore": 1, "richiede": ["verbale"], "capitolo": "I" }] }],
  "analisi": [{ "id": "sangue", "su": "fazzoletto", "minuti": 4, "ore": 2 }],
  "serrature": [{ "id": "cassetta", "titolo": "…", "tipo": "codice|parola|ordine|scelta", "soluzione": "1907",
    "indizi": ["…"], "aiuti": ["…", "…", "…"] }],
  "collegamenti": [{ "id": "ora-vera", "servono": ["verbale", "orologio"], "domanda": "…", "scelte": ["…"], "giusta": 0,
    "deduzione": "…", "quando": "00:35", "aiuti": ["…"] }],
  "capitoli": [{ "id": "I", "titolo": "…", "minuti": 40, "apertura": [{ "testo": "…" }, { "cue": { "audio": "…" } }],
    "domande": ["quando"], "chiusura": [{ "testo": "…" }], "pausa": "…" }],
  "domande": [{ "id": "quando", "testo": "…", "tipo": "personaggio|scelta|orario|luogo", "scelte": ["…"], "giusta": 1,
    "prove": ["ora-vera", "verbale"], "stelle": 2, "rivelazione": "…" }],
  "accusa": { "domande": ["chi", "come", "perche"], "sostegno": 3 },
  "soluzione": { "cronologia": [], "ricostruzione": [], "epilogo": { "pieno": "…", "parziale": "…", "fallito": "…" } },
  "gradi": [{ "da": 0, "nome": "Piantone" }, { "da": 8, "nome": "Ispettore" }, { "da": 14, "nome": "Commissario" }]
}
```
**Il validatore (`FASCICOLO.valida`) deve rifiutare**: reperti irraggiungibili (grafo da `inizio` attraverso zone, temi,
analisi, serrature, ricerche); domande senza almeno due strade di prova indipendenti; collegamenti e reperti spezzati
tutti dentro una specialità (con almeno 2 telefoni); serrature senza indizi raggiungibili prima; cammino più economico
verso tutte le risposte giuste che costa più del 60% delle ore disponibili; false piste (`falsa`) senza un reperto che le
smentisce; orari nei testi fuori dalla cronologia (stessa regola di `SERATA`); più o meno di un colpevole; capitoli con
meno di 1 o più di 4 domande; coordinate delle zone fuori da 0-1; riferimenti a id inesistenti.

## 6. Motore (`src/js/motori/36c-fascicolo.js`, costante `FASCICOLO`)
Puro, senza rete né DOM, stato clonabile in JSON, mai `Date` né `Math.random` (ora e caso arrivano da fuori): stesso
contratto di `SERATA`.
- `valida(k)`, `avvisi(k)`, `nuova(k, [{uid,nome}], {rnd})`, `act(s, a, k, ora)` → `{s}` | `{err}` (italiano),
  `tick(s, k, ora)`, `pubblico(s, k)` (ciò che mostra la TV, mai soluzioni prima della rivelazione), `mani(s, k)` (per uid).
- Stato: `fase` (`pronta|apertura|indagine|consegna|rivelazione|accusa|finale|fine`), `cap`, `riga`, `fino`, `pausa`,
  `ore`, `gioc{uid:{nome,spec[]}}`, `capo` (uid), `ha{repertoId:{da,ora}}`, `ded[]`, `aperte[]` (serrature), `lab[]`
  (analisi in corso con `pronta`), `muro[]` (al più 3), `unisci{}`, `quesito`, `proposta{dom:{val,si[],no[]}}`,
  `risposte{dom}`, `stelle`, `aiuti{}`, `seq{}`, `log[]`, `cue`.
- Azioni dei telefoni (`a.t`, sempre con `uid`): `leggi`, `proietta`, `togli`, `unisci`, `collega`, `risolvi`, `apri`
  (serratura), `aiuto`, `cerca` (archivio), `chiedi` (tema), `analizza`, `esplora` (zona), `proponi`, `parere`, `consegna`,
  `accusa`, `avanti` (solo caposquadra, per le righe di apertura e chiusura), `pausa`.
- Ogni azione controlla specialità, fase, ore e prerequisiti; gli errori sono frasi brevi che il telefono mostra.
- Test (`tests/test_fascicolo.js`): kit valido e una decina di kit rotti, uno per regola; da 2 a 8 giocatori ogni
  specialità è coperta e nessun reperto è perso; nessun segreto in `pubblico` né nella mano sbagliata; squadra «brava»
  (segue le prove) chiude con grado alto, squadra «a caso» finisce le ore; ripresa da stato salvato; doppio tocco (`seq`).

## 7. Regia e rete
Nessun canale nuovo: `regia/CODICE` (stato privato della TV), `segreti/CODICE/UID/<chiave>` (mano: `reperti`, `stato`,
`squadra`, `msg`), `azioni/CODICE/UID/ID`, `stanze/CODICE/d` (pubblico). Si riusa `REGIA` (`app/24u-regia.js`) come fa
`app/24va-serata.js`. La TV regista apre il kit (anche cifrato, con `KITC`), fa `tick` ogni secondo, riprende da
`regia/CODICE` se si spegne. Senza telefoni liberi la TV si guida dalla tastiera (spazio = avanti, P = pausa).

## 8. Viste (`src/js/app/24vb-fascicolo.js`, `src/css/45b-fascicolo.css`, prefisso classi `fs-`)
**Telefono** (verticale, 390 px, niente emoji, stile del kit sopra legno e ottone): barra fissa con capitolo, timer, ore;
schede *Fascicolo* (i miei reperti, filtro e ricerca), *Azione* (quella della mia specialità), *Squadra* (domande del
capitolo, proposta e pareri, deduzioni), *Aiuto*. Vibrazione quando arriva un reperto. Spiegazioni solo in riquadri che si
aprono al tocco.
**TV** (1920×1080, leggibile da 3 metri): muro con le Domande del caso (chiusa, proposta, rivelata), linea del tempo con
le deduzioni, i tre reperti proiettati, ore e timer; scene a tutto schermo per apertura, luogo esplorato, interrogatorio
(ritratto e voce), laboratorio, serratura aperta, rivelazione del capitolo, ricostruzione finale. Riusa `app/24w-scena.js`
e il repertorio di `docs/GIALLI-SCENA.md` (atmosfera, effetti, musica sintetica, voce del browser).

## 9. Serata in famiglie: i quattro ritocchi già decisi (binario separato, `motori/36a-serata.js`)
1. **Domande del caso**: i `sigilli` diventano domande visibili sulla TV dall'inizio; `collega`, `risolvi` e la nuova
   `rispondi` solo dal rappresentante (oggi li fa qualunque membro: usare `ilPortavoce`); gli altri mandano `parere`
   sì/no; la TV mostra quale famiglia ha consegnato, non che cosa; verità e punti a fine atto.
2. **Prove spezzate**: `rilascio.a = {meta:[…], parti:[…]}` tra famiglie diverse, azione `unisci`, regole del validatore.
3. **Interrogatorio**: una convocazione per famiglia e atto, di pomeriggio, approvata dal narratore (coda `s.prop`).
4. **Poteri** a uso singolo annunciati sulla TV (non rifiuto, sbircio, cambio sedia, silenzio, indizio).

## 10. Piano di lavoro
Un passo = una sessione = un ramo = una richiesta di unione. Prima di ogni commit `npm run verifica`.
| Passo | Cosa | Modello | Fatto quando |
|---|---|---|---|
| F1 | Motore `FASCICOLO` + validatore + kit di prova `il-gatto-del-notaio` + test | Opus | `npm test -- fascicolo` verde |
| F2 | Regia e vista telefono | Sonnet | scenario `fascicolo` nel browser: 3 telefoni chiudono il capitolo I |
| F3 | Vista TV (muro e scene) + registrazione in `GAMES` + regole in-game | Sonnet | schermate TV di ogni fase salvate e guardate |
| F4 | Bibbia e kit del fascicolo 1, cifrato | Opus | collaudo del kit verde, busta nel repo, frase consegnata |
| F5 | Direzione artistica e immagini del fascicolo 1 | Sonnet | `docs/kit/camera-gialla.md`, immagini sotto i 5 MB |
| F6 | Prova completa con 2-3 telefoni e ritocchi | Sonnet | elenco dei difetti chiuso |
| F7-F10 | Fascicoli 2-5, uno per sessione (come F4+F5) | Opus | come F4 |
| S1-S4 | I ritocchi della sezione 9, uno per sessione | Sonnet (S2 Opus) | `npm test -- serata` verde, scenario `serata` aggiornato |

### Prompt pronti
**F1**
> Leggi `docs/FASCICOLI.md` (sezioni 2, 5, 6) e `src/js/motori/36a-serata.js` solo come esempio di stile. Scrivi
> `src/js/motori/36c-fascicolo.js` (`FASCICOLO`) con il contratto della sezione 6 e il validatore della sezione 5. Scrivi
> il kit pubblico `src/kit/il-gatto-del-notaio.json`: 2-4 giocatori, 25 minuti, due capitoli brevi, un caso leggero
> inventato che usa almeno una volta ogni meccanica (reperto spezzato, collegamento, serratura, tema con prerequisito,
> analisi, zona, ricerca in archivio, falsa pista). Scrivi `tests/test_fascicolo.js` come descritto. Aggiungi il file al
> manifest e il formato al build dei kit (`scripts/build.js`, dove oggi sceglie tra `GIALLO.valida` e `SERATA.valida`).
> Non toccare le viste. Ramo `feat/fascicolo-motore`, `npm run verifica`, richiesta di unione.

**F2**
> Leggi `docs/FASCICOLI.md` (sezioni 2, 7, 8) e come `src/js/app/24va-serata.js` usa `REGIA`. Scrivi la regista e la vista
> telefono in `src/js/app/24vb-fascicolo.js` e `src/css/45b-fascicolo.css` (classi `fs-`), un solo comando
> `data-a="fas" data-v="verbo:arg"`. Aggiungi lo scenario `fascicolo` a `tools/test-browser/` (TV e tre telefoni sul kit
> `il-gatto-del-notaio`, TV riavviata a metà) e guarda le schermate a 390 px. Ramo `feat/fascicolo-telefono`.

**F3**
> Leggi `docs/FASCICOLI.md` (sezione 8) e `docs/GIALLI-SCENA.md`. Aggiungi la vista TV del fascicolo (muro e scene a tutto
> schermo, voce e musica dal repertorio comune) nello stesso file della vista, registra il gioco in `GAMES`
> (`07-nucleo.js`, poi `npm run regole`), scrivi `docs/rules/fascicolo.md` e il testo in `07d-regole.js`. Salva una
> schermata 1920×1080 per ogni fase e controlla che si legga da lontano. Ramo `feat/fascicolo-tv`.

**F4** (Angelo aggiunge la frase del kit, o scrive «inventala e dimmela»)
> Leggi `docs/FASCICOLI.md` (sezioni 2-5). Scrivi il fascicolo 1 «La camera gialla»: prima la bibbia in una cartella
> fuori dal repo (cronologia canonica al minuto, colpevole e meccanismo diversi dal romanzo, la soluzione del romanzo come
> falsa pista smentita, 7-9 persone, 4 luoghi, circa 60 reperti, 3 capitoli da 40 minuti con 3-4 domande l'uno, 6-8
> serrature, 10-12 collegamenti, una pausa cena). Poi il JSON del kit; fallo passare da `FASCICOLO.valida` e dal collaudo
> con squadra brava e squadra a caso da 2 a 8 giocatori; rileggi ogni reperto cercando contraddizioni di orari e nomi.
> Cifra con `node tools/kit/cifrati.js cifra` e committa solo la busta in `src/kit-cifrati/`. Consegnami bibbia e JSON
> in chiaro come file, non nel repo. Ramo `feat/fascicolo-camera-gialla`.

**F5**
> Apri il kit `camera-gialla` con la frase che ti do. Scrivi `docs/kit/camera-gialla.md` (blocco di stile, un prompt per
> ogni ritratto, luogo, oggetto e copertina, senza svelare la soluzione) e la sezione `scena` del kit. Genera le immagini
> solo se te lo confermo (costano crediti), preparale con `tools/kit/prepara-immagini.py`, ricifra il kit.

**S1**
> Leggi `docs/FASCICOLI.md` (sezione 9, punto 1) e in `src/js/motori/36a-serata.js` le funzioni `collega`, `risolvi`,
> `spegni`, `pubblico`, `maniDi`. Realizza le Domande del caso come descritto, aggiorna `nebbia-scoglio`, i test, la
> vista TV e telefono in `24va-serata.js`, `docs/SERATA.md` e le regole in-game. Ramo `feat/serata-domande`.

## 10b. Sfida tra due squadre (fatto)
Ogni fascicolo si può proporre anche «in sfida» (nello scaffale: «… · sfida tra due squadre», id del kit con `@sfida`).
Musica propria dei fascicoli: traccia `fascicolo` in `app/03-audio.js`. Motore `motori/36d-fascicolo-sfida.js` (`FSFIDA`, + `tests/test_fascicolo_sfida.js`, scenario `fascicolo_sfida`): due partite
`FASCICOLO` complete, una per squadra (Rossa e Blu, 4-16 telefoni divisi a giro), che vanno avanti insieme.
- Ogni squadra ha reperti, ore, deduzioni, serrature e risposte proprie; il caposquadra di ognuna consegna per la sua.
- La TV mostra solo i progressi: ore, numero di deduzioni e serrature, quali domande hanno risposta, annunci come
  «Squadra Rossa esamina un luogo». Mai reperti, testimonianze, sopralluoghi o risposte prima della rivelazione.
- Nella sfida non si proietta sulla TV (la vedrebbero gli avversari).
- Prima di aprire il caso ognuno può passare nell'altra squadra dal telefono (nessuna squadra resta vuota).
- In indagine, consegna e accusa si va avanti quando sono pronte tutte e due (un secondo tocco ritira la squadra) o allo
  scadere del tempo. Alla rivelazione ognuna vede il proprio esito; vince chi ha più stelle (pari: tutte e due).

## 11. Decisioni ancora aperte
- Titoli definitivi dei fascicoli (quelli in tabella sono di lavoro).
- Voce registrata al posto della voce del browser per le deposizioni audio del fascicolo 2.
