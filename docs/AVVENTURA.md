# Cantari di Ventura (modalità Avventura) — piano di lavoro

Obiettivo: dentro la Taverna, un gioco di ruolo a campagne che unisce il **viaggio a esagoni con perdizione** dei roguelite cooperativi da divano e la **battaglia tattica a turni su griglia** dei grandi giochi di ruolo d20. Tutto originale: nomi, testi, mostri, grafica. Nessun titolo commerciale nei testi visibili né nei documenti: qui si parla di «modelli di riferimento».

Questo documento sostituisce la sezione «Da fare» di `docs/CAMPAGNE.md`. Ogni task (A0…A13) è pensata per una **sessione dedicata**: chi la prende legge solo la sua sezione, le «Decisioni» e i file indicati.

## Decisioni prese dall'utente (ottobre 2026)
| Tema | Scelta |
|---|---|
| Battaglia | Griglia tattica: posizione, copertura, altezza, linea di vista, raggi d'azione |
| Giocatori | Prima un'avventura completa **in solitario** (1–4 eroi guidati da un telefono); poi **TV + telefoni** (la TV mostra mappa e battaglia, ogni telefono guida il suo eroe) |
| Storia | Mista: trama principale scritta a mano + missioni ed eventi secondari generati |
| Morte | **Vite di gruppo**: la compagnia ha poche vite in comune; finite quelle la campagna è persa, gli eroi dell'account restano |
| Mappa del mondo | **Eroi separati**: ogni eroe ha il suo segnalino e il suo turno; si può dividere il gruppo; chi è vicino entra nello scontro |
| Squadra | Fino a **4 posti**: eroi dell'account o **compagni** della storia reclutati, con approvazione e dialoghi |
| Tono | **Fantasy classico**: regno in pericolo, torri, antri, draghi; serio ma luminoso |
| Durata | **Capitolo da 3–5 sessioni di circa un'ora**, salvataggio tra una e l'altra |
| Forma della battaglia | **Esagoni**, come la mappa del mondo |
| Dadi | **Tutto si decide con i dadi**: anche il movimento sulla mappa e in battaglia ha una parte tirata |
| Vita persa | Si perdono **oro e si alza la perdizione** |
| Nome | Modalità **«Cantari di Ventura»**: ogni sessione è un «cantare» (Primo cantare, Secondo cantare…), il Locandiere fa da cantastorie e riassume la puntata precedente. Capitolo 1: **«La Corona Spezzata»** (il re è scomparso, i pezzi della corona sono sparsi in tre regioni, una per atto) |

Vincoli sempre validi: costo zero (Firebase Spark, niente Cloud Functions), niente emoji, stile legno e ottone, mobile 390 px, motori puri con test (bot bravo vince, bot casuale perde), musica e suoni propri, schede regole in-game.

## Stato di partenza (analisi del codice, 28 ottobre 2026)
- `motori/27-eroi.js`: 5 razze, 6 classi, 27 punti, derivati (PF, CA, attacco, danno, iniziativa, movimento), `prova` d20. Le classi **non hanno poteri**: cambiano solo i numeri. 10 oggetti di partenza, nessun inventario.
- `motori/28-campagna.js`: mappa a esagoni dal seme (raggio 6), nebbia, costi di terreno, giorno/notte, perdizione +3 all'alba, 5 tipi di incontro risolti con **un solo tiro**, missione fissa città → antro → torre. Gruppo con un solo segnalino, 1–3 eroi.
- `app/24g-eroi.js`, `app/24h-campagna.js`: finestre modali; la tab «Avventura» apre l'elenco eroi.
- Salvataggio della campagna solo in `localStorage`; l'esperienza guadagnata **non torna** all'eroe dell'account.
- `firestore.rules`: un eroe può aumentare `xp` (fino a 100000) e `oro` (fino a 1000000) senza limite per scrittura: oggi un client modificato può "regalarsi" livelli.
- Difetti noti: `fuggi` ignora l'eroe scelto e ferisce sempre il primo in piedi; il log scrive le abilità senza accenti («furtivita»); `act` usa `Math.random` se non riceve `rnd`, quindi non è riproducibile (serve per la TV); in antro e torre sono ammesse tutte e 10 le abilità, quindi si sceglie sempre la migliore.
- Infrastrutture riusabili: stanze live (`24m-rete-rtdb.js`, `motori/35-sync.js`), schermo comune (`24f-schermo.js`, Chromecast), voto (`motori/34-voto.js`), kit JSON e regia (gialli), Locandiere a copioni, three.js caricato su richiesta, skill `asset-3d-taverna` e `verifica-render-3d`.

## Architettura di arrivo
Motori puri (stato JSON, `act(stato, azione)` → `{s}` | `{err}`, **dado nello stato**: `s.rng` è il seme corrente di un generatore deterministico, così telefono, TV e test ottengono lo stesso risultato):

| File | Costante | Ruolo |
|---|---|---|
| `motori/27-eroi.js` | `EROI` | scheda, derivati, livelli, talenti (esteso) |
| `motori/39-avv-dadi.js` | `ADADI` | generatore nello stato, d20 con vantaggio/svantaggio, dadi di danno, probabilità esatte |
| `motori/40-avv-oggetti.js` | `AOGG` | catalogo oggetti, rarità, bottino, negozi |
| `motori/41-avv-poteri.js` | `APOT` | poteri di classe, talenti, stati alterati, bestiario |
| `motori/42-avv-scontro.js` | `ASCO` | battaglia su griglia |
| `motori/43-avv-ia.js` | `AIA` | intelligenza dei nemici e bot di prova |
| `motori/28-campagna.js` | `CAMP` | mappa del mondo (evoluta) |
| `motori/44-avv-racconto.js` | `ARAC` | dialoghi, eventi, condizioni, effetti, missioni generate |
| `motori/45-avventura.js` | `AVV` | orchestratore: compagnia, fasi, vite, salvataggio, rientro sull'account |

Dati: capitoli scritti in `src/avventura/<capitolo>.json` (come `src/kit/`), tabelle generate in `motori/44-avv-racconto.js`. Viste: `app/24h-…` (una per schermata, prefisso CSS `av-`), `css/39-campagna.css` diviso per schermata. Numeri dei file da riallineare al manifest al momento della creazione.

## Ordine e dipendenze
```
A0 progetto ─► A1 fondamenta ─► A2 oggetti ─┐
                               A3 poteri  ──┼─► A4 battaglia (motore) ─► A5 battaglia (vista)
                                            │
                     A6 mappa del mondo ◄───┘        A7 racconto ─► A8 Capitolo 1
                                 └──────────► A9 orchestratore, vite, salvataggi ◄─┘
A10 audio e regole ─► ★ RILASCIO «Capitolo 1 in solitario»
A11 TV + telefoni ─► A12 grafica 3D ─► A13 bilanciamento finale
```
Stima indicativa: 1 task = 1–3 sessioni. A4 e A8 sono le più grandi.

---

## A0 — Progetto di gioco e riferimenti
Scopo: fissare numeri, nomi e schermate prima del codice, così le task successive non si contraddicono.
1. Scheda `docs/rules/avventura.md`: regole complete in parole nostre (turno sulla mappa, battaglia, riposi, perdizione, vite) con la sezione **«Riferimento visivo»** (layout, palette, iconografia dei modelli di riferimento: solo descrizioni e link, niente copie).
2. Glossario italiano unico (PF, CA, Concentrazione, Perdizione, Vite, azione/azione bonus/reazione, vantaggio…), usato identico in motori, viste e regole.
3. Nome della modalità e del Capitolo 1 (vedi Domande aperte) e voce nella Plancia.
4. Quattro mockup statici a 390 px in un solo file HTML (`docs/design/avventura.html`): mappa del mondo, battaglia, dialogo, scheda/inventario. Un solo passaggio di revisione con l'utente (i mockup gli costano quota: niente varianti multiple).
5. Tabella dei numeri base: PF per livello, CA tipiche, danni medi per livello, CD per pericolo, curva XP (riuso `SOGLIE_XP`), oro per sessione.
- Fatto quando: l'utente approva mockup e nome; scheda regole e numeri in repo.
- **Stato (29 ottobre 2026)**: scheda `docs/rules/avventura.md` (regole, glossario, numeri, riferimento visivo con fonti) e mockup `docs/design/avventura.html` scritti; nome approvato. In attesa dell'approvazione dei mockup.

## A1 — Fondamenta e pulizia
Scopo: rendere il codice esistente pronto a crescere senza rompere le campagne salvate.
1. `ADADI`: generatore deterministico salvato nello stato (`s.rng`), funzioni `d(n)`, `d20({vant, svant})`, `danno('2d6+3')`, `prob(bonus, cd, vant)`. Test di distribuzione e riproducibilità.
2. `CAMP.act` usa sempre `s.rng`; rimuovere il ripiego `Math.random`.
3. Rinominare la missione di prova «La Torre oscura» (è un titolo di libri famoso). Correggere `fuggi` (eroe scelto), nomi delle abilità con accenti in `EROI.NOME_AB` (un'unica fonte, la vista la rilegge), antro e torre con 2–3 abilità diverse per ogni prova.
4. Stato `v:2` con migrazione da `v:1` (`CAMP.migra`), test con uno stato v1 salvato.
5. Eroi fino a 4 nella compagnia (oggi 3): `nuova` accetta 1–4, test aggiornati.
6. Tab «Avventura» come **pagina vera** (non modale): Continua la campagna, Nuova campagna, I tuoi eroi, Compagni sbloccati, Regole. Riuso `Plancia`.
7. Regole Firestore: incremento massimo di `xp` e `oro` per scrittura e intervallo minimo tra scritture (vedi A9), generate da `npm run regole`.
- Test: `test_avv_dadi`, `test_campagna` (migrazione, fuga, determinismo), `test_eroi`.
- Fatto quando: `npm run verifica` verde, una campagna v1 salvata si riapre.

## A2 — Oggetti, inventario, economia
Scopo: dare senso a oro, tesori e città.
1. Catalogo `AOGG` (unica fonte): armi per famiglia con proprietà (accurata, pesante, a due mani, da lancio, gittata corta/lunga, portata), armature leggere/medie/pesanti, scudi, accessori (2 posti), consumabili (pozioni, pergamene, bombe, razioni, kit da guaritore), materiali di missione. Rarità comune/rara/epica/leggendaria, prezzo, livello minimo.
2. Posti dell'equipaggiamento: mano principale, seconda mano, armatura, 2 accessori, cintura da 3 consumabili; zaino per eroe con peso o numero massimo; **oro comune** della compagnia.
3. `EROI.derivati` legge l'equipaggiamento esteso (bonus a CA, attacco, danno, tiri salvezza, resistenze).
4. Bottino: tabelle per livello di pericolo e ambiente; scrigni, nemici, ricompense di missione.
5. Negozi: scorta generata dal seme della città e rinnovata ogni N giorni; compra, vendi (metà prezzo), identifica gli oggetti magici.
6. Vista: scheda eroe con inventario a griglia, confronto oggetto equipaggiato/nuovo, trascina o tocca per equipaggiare, negozio.
7. Regole Firestore dell'eroe: aggiungere `zaino` ed `equip` estesi con ID validi generati dal catalogo.
- Test: conservazione dell'oro (comprare/vendere non crea monete), prezzi coerenti con la rarità, derivati con ogni combinazione, bottino sempre valido.

## A3 — Poteri di classe, talenti, stati, bestiario
Scopo: rendere ogni classe diversa da giocare.
1. Per ogni classe 6 poteri sbloccati ai livelli 1, 1, 3, 5, 7, 9 (uno a scelta tra due ai livelli 3, 5, 7, 9) più un passivo di classe. Ogni potere: costo (azione, azione bonus, reazione), ricarica (a turno, a scontro, a riposo), area (singolo, linea, cono, cerchio), tiro (attacco o salvezza), effetti.
2. Risorse: **Concentrazione** del singolo eroe (ritira un dado o lo rende vantaggioso; si ricarica col riposo) e cariche dei poteri per riposo breve/lungo.
3. Talenti ai livelli pari (scelta tra 2 estratti da un elenco di 20), tratto di razza attivo (es. Fortunato, Furia tenace).
4. Stati alterati con durata in turni: a terra, avvelenato, stordito, accecato, in fiamme, congelato, benedetto, maledetto, nascosto, provocato. Tipi di danno (taglio, perforante, contundente, fuoco, gelo, fulmine, necrotico, radioso, veleno) con resistenze e vulnerabilità.
5. Bestiario originale: 4 famiglie (bestie, banditi, non morti, creature della torre) × 5 mostri + 3 capi, con livello, ruolo (bruto, tiratore, incantatore, supporto, sciame), poteri e comportamento per A5.
6. Salita di livello guidata (scegli potere/talento) nella vista eroi.
- Test: ogni potere ha bersagli validi e un effetto misurabile; nessuna combinazione rompe lo stato; danni medi per livello entro la tabella di A0.

## A4 — Battaglia tattica (motore)
Scopo: il cuore del gioco. Motore puro `ASCO`, stato JSON, deterministico.
1. **Griglia a esagoni** (coordinate assiali, riuso di `CAMP.dist/vicini`), circa 9×11 esagoni. Celle: pavimento, muro, ostacolo basso (mezza copertura +2 CA), ostacolo alto (copertura totale), terreno difficile (costo doppio), rialzo (altezza +1), superfici (fuoco, ghiaccio, veleno, acqua). Arene generate dall'ambiente della casella (bosco: alberi e radici; palude: fango; città: casse e muretti; antro: colonne) più arene scritte a mano per i capi.
2. **Schieramento**: eroi presenti nell'esagono e in quelli vicini entrano (chi è più lontano arriva dopo N turni); sorpresa e imboscata da prova di Percezione/Furtività.
3. **Iniziativa**: d20 + DES, ordine visibile; turno di un singolo combattente.
4. **Economia del turno**: movimento in esagoni tirato a inizio turno (movimento della razza − 2 + 1d4, ritirabile con Concentrazione), un'azione, un'azione bonus, una reazione per giro. Azioni base: attacca, scatto, disimpegno, nasconditi, aiuta, usa oggetto, spingi, alza un compagno, prepara (azione pronta).
5. **Tiro per colpire**: d20 + bonus contro CA; vantaggio da altezza, da bersaglio a terra o nascosto, da aiuto; svantaggio da distanza lunga, da bersaglio in copertura per i tiri (o +CA), da accecato. Critico al 20 (dadi doppi), fallimento all'1. Probabilità esatta esposta alla vista prima di confermare.
6. **Linea di vista e raggi**: algoritmo a linea tra centri delle celle, muri e ostacoli alti bloccano; gittate delle armi; aree dei poteri.
7. **Reazioni**: attacco di opportunità all'uscita dalla portata, poteri di reazione (parata, contrattacco, scudo magico).
8. **Danno e caduta**: a 0 PF l'eroe cade a terra; un compagno lo rialza (azione + Medicina o pozione). Se tutti gli eroi cadono la battaglia è persa → la compagnia perde **una vita** (A9). I nemici a 0 PF muoiono o si arrendono (i banditi).
9. **Fine**: vittoria, fuga riuscita (uscita dal bordo o prova di gruppo), sconfitta. Ricompense: XP divisi, oro, bottino da A2.
10. API: `ASCO.nuovo(compagnia, nemici, arena, rng)`, `act(s, {t:'muovi'|'attacca'|'potere'|'oggetto'|'aspetta'|'fine', …})`, `mosseValide(s, chi)`, `anteprima(s, azione)` (percentuale e danno atteso, per la vista e per l'IA).
11. **IA nemici** (`AIA`): punteggio delle azioni possibili (danno atteso, rischio, copertura, focus sul più debole, distanza preferita per ruolo), tre livelli di difficoltà. Lo stesso modulo fornisce il **bot bravo** e il **bot casuale** per i test.
- Test (`test_avv_scontro`): conservazione (PF entro i limiti, un'azione per turno), linea di vista su casi fissi, coperture, opportunità, determinismo col seme, 1000 battaglie simulate: bot bravo vince ≥85% gli scontri «medi» del suo livello, bot casuale ≤30%; nessuna battaglia infinita (limite di giri).

## A5 — Battaglia tattica (vista telefono)
1. Griglia in SVG a 390 px con vista leggermente inclinata, scorrimento e zoom a due dita; segnalini degli eroi con il loro ritratto, nemici con sagome originali.
2. Tocca un eroe → caselle raggiungibili evidenziate, percorso in anteprima con costo; tocca un nemico → percentuale e danno previsto; conferma con secondo tocco (nessuna mossa per sbaglio).
3. Barra delle azioni in basso: azione, azione bonus, poteri con cariche, oggetti della cintura, Concentrazione, fine turno. Sopra: ordine di iniziativa con ritratti.
4. Dado d20 animato e numeri del tiro sempre leggibili (bonus, CD/CA, esito); numeri di danno fluttuanti; registro richiudibile.
5. Turno nemico animato con velocità regolabile e «salta animazioni».
6. Indicatori: copertura (scudo mezzo/pieno), altezza, linea di vista bloccata, aree d'effetto, stati alterati con icona e durata.
7. Scenario `avv_battaglia` in `tools/test-browser/` e una schermata finale a 390 px.

## A6 — Mappa del mondo (evoluta)
1. **Eroi separati**: ogni eroe ha posizione e punti movimento propri; turno per eroe (o "muovi tutti insieme" con un tocco quando sono nella stessa casella). Movimento tirato a ogni turno: movimento della razza − 2 + 1d4, con Concentrazione per ritirarlo.
2. Chi è entro 1 esagono da una battaglia entra subito, entro 2 arriva dopo alcuni turni.
3. Mappa per capitolo: dimensione maggiore, regioni con nome, luoghi scritti a mano (A8) più luoghi generati: città, villaggi, santuari (abbassano la perdizione), antri e rovine (sotterranei), accampamenti, mercanti erranti.
4. **Nemici visibili** che si spostano a ogni fase e incontri casuali residui; di notte più forti.
5. **Sotterranei**: sequenza di 3–6 stanze (battaglia, trappola, evento, scrigno, riposo) con capo finale; si può uscire e rientrare.
6. **Città**: locanda (riposo lungo, voci di missioni), guaritore, tempio (riporta un eroe caduto, costa oro), negozio, bacheca missioni secondarie, fabbro (migliora un oggetto).
7. **Perdizione 2.0**: sale all'alba e per scelte cattive, scende con santuari e missioni; soglie a 25/50/75 cambiano la mappa (nemici più forti, una città assediata, strade chiuse); a 100 la campagna è persa.
8. Giorno/notte e riposo: riposo breve (in qualsiasi luogo, poco) e lungo (in città o accampamento, costa razioni).
9. Vista: mappa scorrevole, segnalini degli eroi, scheda luogo al tocco, diario delle missioni.
- Test: generazione sempre collegata, turni per eroe, unione alle battaglie, soglie di perdizione.

## A7 — Motore del racconto
1. Formato del capitolo (`src/avventura/<id>.json`): scene, nodi di dialogo, scelte con condizioni (bandiere, classe, razza, oggetto, livello, approvazione), prove di abilità con esiti, effetti (bandiere, oro, oggetti, PF, perdizione, avvia battaglia, aggiungi compagno, sposta su luogo, sblocca missione).
2. `ARAC`: valutatore puro di condizioni ed effetti; scelta con prova mostra la probabilità come in battaglia.
3. **Compagni**: scheda come un eroe (classe, poteri, dialoghi propri), approvazione da −100 a +100 modificata dalle scelte, missione personale, possono lasciare il gruppo.
4. **Missioni ed eventi generati**: tabelle tipo × luogo × nemico × ricompensa × complicazione; 30 eventi di strada brevi.
5. Il **Locandiere** apre e chiude ogni sessione con un riassunto («Nella sessione precedente…») letto dalle bandiere.
6. Validatore per i test: ogni nodo raggiungibile, nessun vicolo cieco, riferimenti a oggetti/mostri/luoghi esistenti, nessuna scelta senza uscita.
7. Vista dialogo: ritratto di chi parla, testo a comparsa, scelte con etichette ([Persuasione 65%], [Solo Mago]).

## A8 — Capitolo 1 (contenuto)
1. Trama in tre atti per 3–5 sessioni da un'ora, fantasy classico, ambientata nel regno della Taverna; scaletta approvata dall'utente prima di scrivere i dialoghi.
2. Contenuto minimo: 3 regioni, 2 città, 6 scene principali, 2 sotterranei scritti a mano, 1 capo per atto, 2 compagni reclutabili, 10 eventi scritti, missioni secondarie generate.
3. Arene a mano per le battaglie importanti.
4. Finale con almeno due esiti a seconda delle scelte.
5. Prova completa con il bot (A13 in piccolo): il capitolo si finisce, durata stimata in turni.

## A9 — Orchestratore, vite, salvataggi, rientro sull'account
1. `AVV`: stato unico con fasi `mappa` | `battaglia` | `dialogo` | `città` | `sotterraneo` | `fine`, che passa il controllo ai motori.
2. **Vite di gruppo** (3, da confermare in A13): una battaglia persa toglie una vita, la compagnia si risveglia nell'ultima città con metà PF e una penalità: metà dell'oro comune perso e perdizione +10; a zero vite la campagna è persa.
3. Salvataggio: automatico a ogni cambio di fase, in locale e su Firestore (`players/{uid}/avventure/a1..a3`), con versione e migrazione.
4. **Rientro sull'account**: a fine sessione XP, oro e oggetti tornano agli eroi; regole Firestore con aumento massimo per scrittura e intervallo minimo (senza Cloud Functions è una protezione leggera, sufficiente per giocare tra amici).
5. Fine campagna: riepilogo, compagni sbloccati per il futuro, monete della Taverna come premio.

## A10 — Musica, suoni, regole in-game
1. Tracce: esplorazione giorno, esplorazione notte, città, sotterraneo, battaglia, capo, vittoria, sconfitta (stesso formato di `app/03-audio.js`).
2. Suoni: passi, d20, colpo/parata/critico, incantesimi per tipo di danno, porta, scrigno, salita di livello.
3. Schede regole in `07d-regole.js` da `docs/rules/avventura.md`; tutorial nella prima missione (box informativi al tocco, non testi lunghi).
- ★ Rilascio «Capitolo 1 in solitario».

## A11 — TV + telefoni
1. Avventura come partita in una stanza live (`R.mode='rt'`): ogni giocatore porta un suo eroe (copia validata con `EROI.coerente`), posti vuoti con eroi o compagni guidati da chi ospita.
2. Mosse con `SYNC.mossa` (a turni); stato deterministico grazie a `s.rng`.
3. TV: mappa e battaglia grandi, ordine di iniziativa, dialoghi a tutto schermo. Telefono: solo il proprio eroe (azioni, inventario, poteri); scelte di dialogo a chi parla o a voto (`motori/34-voto.js`).
4. Uscita di un giocatore: il suo eroe passa al bot o a chi ospita; rientro senza perdere il posto.
5. Salvataggio della campagna condivisa sull'account di chi ospita; ciascuno riceve XP e oggetti sul proprio eroe.
6. Scenario `avv_tv` in `tools/test-browser/` con 1 TV e 2 telefoni simulati.

## A12 — Grafica 3D
1. Mappa a esagoni e arene in three.js low-poly nello stile della Taverna 3D (skill `asset-3d-taverna`), caricato su richiesta, con la vista SVG come ripiego per i telefoni lenti.
2. Miniature degli eroi generate da razza, classe e aspetto; mostri originali per famiglia.
3. Effetti: luce giorno/notte, nebbia, superfici in fiamme, incantesimi.
4. Verifica con la skill `verifica-render-3d` a 390 px e su TV.

## A13 — Bilanciamento e rifinitura
1. Simulazione di intere campagne con il bot: tassi di vittoria per composizione della squadra, durata, oro e XP per sessione.
2. Ritocchi alle tabelle di A0; difficoltà selezionabile (Racconto, Normale, Eroica).
3. Accessibilità (dimensioni dei bersagli, contrasto), prestazioni su telefoni economici.

---

## Domande aperte (da chiudere all'inizio della task indicata)
- A1: la tab Avventura sostituisce il pulsante «Eroi» nel profilo o restano entrambi?
- A3: gli incantatori usano cariche per riposo o un'unica riserva di energia?
- A11: chi decide le scelte di dialogo in co-op: chi parla o voto?
