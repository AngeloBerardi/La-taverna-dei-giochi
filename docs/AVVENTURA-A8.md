# A8 — Capitolo 1 «La Corona Spezzata»: scaletta da approvare

Stato: **bozza per l'approvazione dell'utente** (31 ottobre 2026). Nessun dialogo è ancora scritto: dopo il via si scrivono atto per atto. Formato e API del racconto: `docs/AVVENTURA-A7.md`. Nessun nome di marchio: tutti i nomi qui sotto sono nostri.

## 1. In una riga
Il re è scomparso e la corona delle Tre Marche si è spezzata in tre pezzi. La compagnia li cerca in tre regioni, una per atto, e scopre che il re non è stato rapito: **ha spezzato lui la corona**, perché lo stava consumando. A fine capitolo la compagnia sceglie che cosa ne sarà del re e del regno.

Tono: fantasy classico, serio ma luminoso (tabella di `docs/AVVENTURA.md`). Il Locandiere racconta ogni «cantare» e riassume la puntata precedente.

## 2. Il mondo
**Regno delle Tre Marche**, capitale Valcorvo, dove sorge la Taverna: la compagnia parte dalla locanda. Tre regioni, già presenti in `AMON` (si cambiano solo i nomi dei luoghi; `opz.regioni`/`opz.luoghi` sono pronti):

| Atto | Regione (terreno, famiglia) | Luoghi scritti a mano | Capo |
|---|---|---|---|
| I | **Marca dei Corvi** (pianura, banditi) | Valcorvo (città, partenza), Casale dei Salici (villaggio assediato), Cappella del Pellegrino (santuario), Accampamento dei Corvi (campo) | **Corvino**, capobanda (liv 5) |
| II | **Brughiere Cenerine** (palude, non morti) | Rocca Pallida (città di confine), Fonte Cupa (villaggio), Cripta dei Re (antro, scritto a mano) | **Il Re senza corona** (liv 7) |
| III | **Boschi Velati** (bosco, bestie) | Poggio Basso (villaggio), Altare delle Piogge (santuario), Torre dei Corvi (torre, scritta a mano) | **Il Maestro della Torre** (liv 8) |

Capi, famiglie e arene (accampamento, cripta, sala del maestro) esistono già in `BEST`/`AARE`: non si inventano mostri nuovi, si dà loro una storia.

## 3. La verità (si scopre a pezzi)
- La **Corona delle Tre Marche** ha tre parti, ognuna con un potere: il **Cerchio** (comanda i vivi), la **Gemma** (dà pace ai morti), il **Sigillo** (tiene i corvi, gli «occhi del regno»). Chi la porta regge le tre terre, ma la corona si nutre degli anni di chi la porta.
- Re **Ottavio il Mite** si consumava. Una notte, con il suo vecchio amico **Maestro Alberico Malavista**, ruppe di sua volontà la corona e si fece portare nella Torre dei Corvi, dove può guarire.
- La rottura lanciò i pezzi dove ciascun potere era più forte: il **Cerchio** ai Corvi di strada (Corvino lo crede un dono della sorte), la **Gemma** nella tomba del vecchio re **Gualtiero**, che senza di essa si risveglia (il «Re senza corona»), il **Sigillo** resta al Maestro, che da allora manda corvi a sbarrare la strada a chiunque cerchi il re.
- La **Reggente**, **Dama Berengaria**, sorella del re, non sa nulla: vuole la corona intera e il re sul trono. È onesta, dura, convinta che il regno venga prima del re.

## 4. Atti e cantari (4–5 sessioni, circa un'ora l'una)
Livelli attesi: da 1–2 a 7–8. Un cantare = una sessione; il Locandiere chiude e riapre la puntata dalle bandiere.

### Atto I — «Il Cerchio nel fango» (Marca dei Corvi) · livelli 1→4
- **Primo cantare**: la notte dei corvi alla locanda · udienza dalla Reggente · il Casale dei Salici assediato · primi scontri e primi eventi di strada.
- **Secondo cantare**: l'Accampamento dei Corvi · Corvino (si parla, si bara o si combatte) · il **Cerchio** · prima traccia: le penne nere e il sigillo del Maestro sugli ordini di Corvino.
- Compagni: **Gherardo** (a Valcorvo, in cella) e **Mirta** (al Casale dei Salici).

### Atto II — «La Gemma dei morti» (Brughiere Cenerine) · livelli 4→6
- **Terzo cantare**: Rocca Pallida (i morti salgono dal pantano; il capitano chiede aiuto) · Fonte Cupa · la **Cripta dei Re**, cinque stanze scritte a mano (soglia dei sarcofagi, sala dei nomi, trappola del trono, cappella di Sir Ruggero, camera del re Gualtiero) · il Re senza corona · la **Gemma** · nel sarcofago, una **lettera di re Ottavio**: la prima prova che ha spezzato lui la corona.
- La Reggente chiede i pezzi: si possono consegnare subito a Valcorvo (viaggio, tempo, perdizione che sale) o tenerli.

### Atto III — «Il Sigillo e il re» (Boschi Velati) · livelli 6→8
- **Quarto cantare**: Poggio Basso (i boscaioli vedono corvi che sbarrano i sentieri) · Altare delle Piogge (ultima notte prima della torre; Mirta e Gherardo parlano) · i corvi.
- **Quinto cantare**: la **Torre dei Corvi**, sei stanze scritte a mano (soglia, biblioteca, gabbia dei famigli, osservatorio, sala delle ombre, sala del Maestro) · il Maestro · il re · la scelta finale · epilogo.

## 5. Le sei scene principali (più le intermedie)
| # | Scena | Dove | Cosa succede | Prove / scelte chiave |
|---|---|---|---|---|
| 1 | **La notte dei corvi** | locanda di Valcorvo | Il Locandiere racconta; un araldo annuncia il re scomparso e la corona spezzata; i corvi sul tetto. Tutorial dei dialoghi. | Percezione (le penne nere), scelte di tono |
| 2 | **L'udienza della Reggente** | palazzo di Valcorvo | Berengaria assolda la compagnia: tre pezzi, ricompensa, anticipo. Parla di Gherardo, il capitano che ha perso il re, in cella. | Persuasione (anticipo maggiore), Percezione (nasconde qualcosa) |
| 3 | **Il Casale dei Salici** | villaggio assediato | I Corvi chiedono il tributo; si tratta, si inganna o si combatte; si incontra Mirta, vedetta pentita. | Intimidire / Furtività / Persuasione; battaglia (banditi) |
| 4 | **Corvino** | Accampamento dei Corvi | Il capobanda mostra il Cerchio e dice di averlo «ricevuto». Duello, patto o inganno. | Persuasione difficile per evitare lo scontro; battaglia con arena `accampamento` |
| 5 | **La Cripta dei Re** | antro, 5 stanze | Il Re senza corona è re Gualtiero senza la Gemma: lo si vince o gli si ridà pace; la lettera di Ottavio. | Arcano/Storia (leggere i nomi), Medicina (riti per i morti), battaglia con arena `cripta` |
| 6 | **Il Maestro e il re** | Torre dei Corvi | Il Maestro difende il re: ascolta chi ha le prove; altrimenti si combatte. Il re parla. Scelta finale. | Persuasione molto difficile, cinque prove di verità (§7), battaglia `sala-del-maestro` |

Intermedie (una o due per luogo): arrivo a Rocca Pallida, il capitano della Rocca, il guaritore di Fonte Cupa, il rito di Poggio Basso, la notte all'Altare delle Piogge, il viaggio di ritorno a Valcorvo.

## 6. I due compagni
| | **Gherardo Pietrasorda** | **Mirta «Gazza»** |
|---|---|---|
| Chi | nano guerriero, ex capitano della guardia reale, 52 anni, in cella a Valcorvo per aver perso il re | piccola ladra, 19 anni, ex vedetta dei Corvi, pentita |
| Si recluta | in prigione: si ottiene il rilascio con Persuasione davanti alla Reggente, con 40 monete o forzando la cella (Furtività) | al Casale dei Salici, se la si risparmia o la si difende |
| Valori | onore +3, pietà +1, durezza +1, avidità −2 | avidità +2, mistero +1, pietà +1, onore −1 |
| Missione personale | **Il cavaliere senza elmo** (Atto II): il suo fratello d'armi Sir Ruggero è tra i morti della Cripta; la fiducia apre la scena a Rocca Pallida | **La reliquia della vecchia** (Atto III): Mirta rubò un ricordo a una vecchia di Poggio Basso e vuole restituirlo; conosce i segnali dei corvi |
| Aiuta | in battaglia (tiene la linea), sa i turni di guardia del re | nelle prove di Furtività, nella torre (porte e trappole), fa capire il linguaggio dei corvi |
| Se se ne va | per disonore (scelte crudeli o avide) | per tradimento (tradirla o sacrificarla) |
Se il gruppo ha quattro posti pieni, i compagni aspettano a Valcorvo e si rientra a ogni città.

## 7. Le tre uscite e come si guadagnano
Le **prove di verità** sono cinque indizi: (1) le penne e il sigillo sugli ordini di Corvino, (2) la lettera nella cripta, (3) la testimonianza di Gherardo sui turni di guardia, (4) la reliquia/segnale dei corvi di Mirta, (5) il quaderno del Maestro nella biblioteca della torre. Ogni indizio è una bandiera e riduce la difficoltà del confronto finale.

| Esito | Condizioni | Che cosa accade |
|---|---|---|
| **A — La Corona ricomposta** | si sceglie di ricomporla (o si consegnano i pezzi alla Reggente) | Il Maestro viene sconfitto. Il Cerchio, la Gemma e il Sigillo tornano uniti; il regno è salvo e i morti dormono, ma il re, di nuovo incoronato, si consuma: muore al compiersi dell'anno. Berengaria governa «per lui». |
| **B — Il re libero** | si risparmia il Maestro e si lascia spezzata la corona | Il re vive da uomo libero in una casa del bosco. La corona resta in tre reliquie nelle tre marche; il regno è senza capo ma senza maledizioni; i morti e i corvi andranno placati caso per caso. Berengaria non perdona. |
| **C — La terza via** (difficile) | almeno 4 indizi su 5, entrambi i compagni con approvazione ≥ +20, prova di Arcano/Storia riuscita, Maestro non combattuto | Tre pezzi, tre sigilli, un **consiglio delle tre marche** invece di un solo portatore: la corona viene rifusa come simbolo e non come peso. Il re lascia volontariamente. Il Locandiere promette un secondo capitolo. |
Ogni esito ha due varianti d'epilogo secondo lo stato dei compagni (rimasti, andati via, caduti) e la perdizione finale.

## 8. Missioni e contenuti
- **Principali** (4): «Trovare il Cerchio», «Ridare pace al Re senza corona», «Il Sigillo e il re», più la «promessa alla Reggente» (consegnare i pezzi).
- **Personali** (2): le missioni di Gherardo e Mirta (§6).
- **Secondarie scritte** (3): «Il sale di Fonte Cupa» (consegna con complicazione), «La voce nel pozzo» (dal racconto di prova, ridimensionato e inserito a Casale dei Salici), «Le campane di Rocca Pallida».
- **Eventi di strada scritti** (10): tre per la Marca (carovana, pedaggio, vedetta), tre per le Brughiere (fuochi fatui, campana nella nebbia, pellegrino senza ombra), quattro per i Boschi (corvo che parla, ponte di rampicanti, cacciatore ferito, notte dei lupi). In più restano i 30 eventi e le missioni generati.
- **Bottino**: pezzi della corona come oggetti-chiave (non equipaggiabili), una spada e un'armatura a tema per atto (liv 3, 5, 7, dalla lista di `AOGG`; niente oggetti nuovi senza `npm run regole`).

## 9. Da fare, in ordine
1. **A8.1** — questa scaletta (approvata dall'utente prima del resto).
2. **A8.2** — scheletro `src/avventura/corona.json`: `mondo` (regioni e luoghi), personaggi, compagni, missioni, bandiere, sommario/prossimo; il validatore controlla anche il mondo (`AMON.genera` collegato) e le catene di scene dei sotterranei scritti a mano.
3. **A8.3** — Atto I: scene 1–4, compagni (reclutamento, chiacchiere), battaglie (arena `accampamento`), eventi della Marca.
4. **A8.4** — Atto II: Rocca Pallida, Fonte Cupa, la Cripta (cinque stanze), la lettera, la consegna alla Reggente, la missione di Gherardo.
5. **A8.5** — Atto III: Poggio Basso, Altare, Torre (sei stanze), il Maestro, il re, finale con tre esiti e sei epiloghi, la missione di Mirta.
6. **A8.6** — eventi e missioni secondarie scritte; testi di riassunto e chiusura dei cinque cantari.
7. **A8.7** — test: il capitolo è valido; **ogni scena raggiungibile e ogni esito raggiungibile** (camminate casuali dal seme su migliaia di partite); i capi equilibrati ai livelli attesi con il bot di battaglia; stima della durata in turni e in cantari. La partita completa con il bot sull'orchestratore arriva con A9.
8. **A8.8** — documento finale `docs/AVVENTURA-A8.md` (stato e numeri), mappa dei moduli, PR.

## 10. Scelte aperte
1. Trama: la verità (il re ha spezzato lui la corona) e il Maestro tragico vanno bene, o preferisci un cattivo vero?
2. Esiti: tre (A, B, C) o solo due (A, B)?
3. Compagni: Gherardo (nano guerriero) e Mirta (piccola ladra)?
4. Consegna: una PR per atto (tre PR più piccole, ognuna con i suoi cantari da leggere) o una sola PR?
