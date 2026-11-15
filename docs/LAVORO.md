# Come si lavora (pochi token, stessa qualità)

Il costo di una sessione non è il codice scritto: è il contesto riletto a ogni passo. Quindi: contesto fisso corto, sessioni brevi,
un compito preciso per volta, il modello forte solo dove decide qualcosa.

## Il giro di una funzione
1. **Progetto** (modello forte, sessione breve): l'`architetto` legge la scheda dell'area in `docs/moduli/` e i pezzi di codice che servono,
   decide, e scrive `docs/schede/<id>.md`. Non scrive codice. Le schede V1–V6 della Ventura sono già scritte.
2. **Esecuzione** (Sonnet, sessione nuova): `/scheda <id>`. Chi esegue legge la scheda e solo i file che la scheda nomina. Una scheda = un ramo = una PR.
3. **Cancelli** (automatici, non dipendono dal modello): `npm run verifica`, i test mirati della scheda, lo scenario browser della scheda.
4. **Revisione** (modello forte, solo sul diff): il `revisore` legge `git diff origin/main...` e la scheda, non il progetto.
5. **Sguardo** (solo se la scheda tocca la grafica): uno screenshot a 390 px, guardato una volta dal modello forte.

## Chi fa cosa
| Lavoro | Chi | Modello |
|---|---|---|
| Decidere contratti, stato, regole di un motore nuovo; rete e co-op; bug difficili; direzione artistica | `architetto` (o la sessione principale) | forte (Opus / Fable) |
| Codice e test da una scheda: motori, viste, pannelli, CSS, scenari browser, tabelle di dati | `programmer` | Sonnet |
| Modelli 3D e animazioni da una direzione scritta | `artist` | Sonnet (il primo modello di un tipo nuovo: forte) |
| Stile e HUD di una schermata nuova | `game-hud-designer` | Sonnet |
| Ricerca di regole, ricerche nel codice, `npm run mappa`/`regole`, documenti, commit, rebase, PR | `rules-scout`, `Explore`, comandi | Haiku |
| Revisione del diff | `revisore` | forte |

## Che modello impostare nella chat
- **Sonnet** come modello di tutti i giorni: per `/scheda <id>`, correzioni, ritocchi, documenti.
- **Modello forte** solo per: scrivere schede nuove, un bug che Sonnet non chiude al secondo tentativo, lo sguardo finale sulla grafica.
- Mai una chat lunga con dentro più funzioni: finita la PR, chat nuova.

## Come si scrive una scheda (`docs/schede/<id>.md`)
Deve bastare da sola. Sezioni fisse, al massimo 60 righe:
- **Scopo** (2 righe, cosa vede il giocatore) · **Leggi prima** (file e funzioni, non «il progetto»)
- **Decisioni già prese** (così chi esegue non ridiscute) · **Stato e contratti** (campi nuovi, firme delle funzioni nuove, errori in italiano)
- **Passi** (in ordine, ognuno con il file) · **Prove** (test del motore con numeri attesi, scenario browser, cosa guardare nello screenshot)
- **Fuori scopo** · **Fatto quando** (elenco verificabile)

## Regole che fanno risparmiare davvero
- Uscite dei comandi filtrate (`| grep -E "FAIL|RISULT"`, `| tail -5`); mai un file intero, mai `dist/`.
- Motori provati in node; il browser solo per lo scenario della scheda; screenshot una volta.
- Modifiche a pezzi (Edit), non file riscritti.
- Se una scheda si rivela sbagliata, ci si ferma e si corregge la scheda: non si improvvisa nel codice.
