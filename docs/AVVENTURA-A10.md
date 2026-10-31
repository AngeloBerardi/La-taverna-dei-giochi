# A10 — Musica, suoni, regole in-game, tutorial, missioni generate

Piano e contratti di `AAUD` (`motori/28c-avv-audio.js`), `ATUT` (`motori/28d-avv-tutorial.js`), `AvvAudio` (`app/24hk-audio-avv.js`), `AvvTut` (`app/24hl-tutorial.js`) e delle missioni generate in `AVV` (`bacheca`, `s.gen`). Stato: **fatta** (1 novembre 2026, ramo `feat/avventura-a10`, sopra A9).

Regola di fondo, come per gli altri motori: tutto ciò che si può decidere senza browser è **puro e provato in node** (quale traccia, quale suono, quale suggerimento, quale missione); le viste fanno solo da tramite. Niente `Math.random` nei motori (il rumore dei suoni nasce nel browser, dentro `Snd`, come per tutti i giochi).

## 1. Musica

### Come funziona `Snd` (non cambia)
Le tracce sono tabelle di dati: `{ sd (secondi per passo), bar (passi per battuta), swing?, prog:[[radice MIDI, 1=maggiore|0=minore]…], arp:[indice 0–4 per passo], lead:'bell'|'pluck'|'flute'|'brass', drum:'tav'|'march'|'anvil'|altro (= epico), mel:[8 battute × bar note MIDI, 0 = pausa] }`. Si registrano con `Snd.def(nome, tabella)` e si scelgono con `Snd.track(nome)`: il cambio avviene a fine battuta, quindi mai a metà frase. Il flauto e il liuto suonano la melodia un'ottava sopra (`m+12`), campana e ottoni come scritta.

### Le otto tracce (`AAUD.TRACCE`, nomi `avv-…`)
| Traccia | Quando | Carattere |
|---|---|---|
| `avv-giorno` | mappa di giorno, fuori dalle città | sol maggiore, flauto, 6 passi, tamburo leggero |
| `avv-notte` | mappa di notte | la minore, campane rade, più lenta |
| `avv-citta` | in città e nei villaggi (mappa e dialoghi) | re maggiore, liuto, vivace |
| `avv-sotterraneo` | dentro antri, rovine, torre | mi minore, campane lontane, marcia sorda |
| `avv-battaglia` | battaglia | la minore, ottoni, 8 passi veloci, tamburi |
| `avv-capo` | battaglia con un capo (`BEST.M[id].capo`) | re frigio, incudine, più pesante |
| `avv-vittoria` | fine battaglia vinta, fine del capitolo vinto | re maggiore, campane e marcia |
| `avv-sconfitta` | fine battaglia persa, campagna persa | lenta, flauto basso, 4 passi |

### Quale traccia (`AAUD.traccia(c)`)
`c = { fase, notte, luogo, dentro, capo, esito }` (tutti letti dallo stato, `AvvAudio.contesto()`): prima l'esito (vittoria/sconfitta), poi la battaglia (capo o no), poi il sotterraneo, poi la città/villaggio (anche nei dialoghi), poi notte/giorno. `AvvAudio.attiva()` dice quando la musica è quella dell'Avventura (mappa, dialogo, battaglia, inventario, fogli della sessione); la pagina Avventura e il resto dell'app restano sul tema del menu. `traccia()` in `07f` chiede prima a `AvvAudio`.

## 2. Suoni

### Suoni a partitura (`AAUD.SUONI`)
Ogni suono è una lista di note primitive — `{k:'osc'|'noise'|'bell'|'timp'|'brass'|'flute'|'pluck'|'pad', t (ritardo in s), …}` — così si possono controllare in node (durata, volume, intonazione) senza un `AudioContext`. `Snd.fx(nome, partitura)` li registra e `Snd.play(nome)` li suona, come gli altri effetti, rispettando l'interruttore «Effetti».

| Suono | Evento |
|---|---|
| `avv-passo`, `avv-passo2` | un passo sulla mappa o in battaglia (due varianti che si alternano) |
| `avv-d20` | tiro del dado (movimento, prova, attacco, salvezza) |
| `avv-colpo-taglio`, `avv-colpo-perforante`, `avv-colpo-contundente` | danno fisico, uno per tipo |
| `avv-parata`, `avv-mancato`, `avv-critico` | difesa riuscita o PF temporanei, colpo a vuoto, colpo perfetto |
| `avv-incanto-fuoco`, `-gelo`, `-fulmine`, `-necrotico`, `-radioso`, `-veleno` | danno non fisico: un suono per tipo di danno (`ASTA.TIPI`) |
| `avv-stato`, `avv-cade` | stato applicato, eroe o mostro che cade |
| `avv-porta`, `avv-scrigno` | entrare e uscire dai sotterranei; bottino trovato |
| `avv-livello`, `avv-alba` | salita di livello; nuovo giorno |
| `avv-compagno`, `avv-missione`, `avv-vita` | compagno che si unisce, missione presa o conclusa, vita persa |
| `avv-fanfara`, `avv-lamento` | stacchi di vittoria e di sconfitta (sopra la traccia) |

Si riusano quelli che già ci sono: `heal`, `coin`, `sel`, `ok`, `err` (il test controlla che esistano davvero in `03-audio.js`).

### Dove nascono i suoni (puro → vista)
- **Battaglia**: `AAUD.passo(x)` riceve un passo di `ACRO.effetti` (`sposta`, `dado`, `numero` con `tipo`, `stato`, `cade`, `esce`, `fine`) e restituisce `[{ n, r }]` (`r` = ritardo in ms a velocità 1×). `BatAnima.passo` lo chiama una sola volta per passo: salta le animazioni = salta i suoni.
- **Mappa e racconto**: `AAUD.azione(az, prima, dopo)` guarda l'azione di `AVV.act` e come è cambiato lo stato (giorno, livelli, oro, zaino, compagni, missioni, vite, ultima prova): movimento → passi, tiro → dado, ingresso → porta, bottino → scrigno, notte passata → alba, ecc. `Ses.fai` lo chiama dopo ogni azione.
- La **musica** cambia da sola a ogni `render()` (`Snd.track`).

## 3. Regole in-game e tutorial

### Schede regole
`docs/rules/avventura.md` è la fonte (con «Riferimento visivo» come per gli altri giochi); `RULES.avventura` in `07d-regole.js` ne è la versione per il telefono. Si leggono da: pagina Avventura → «Regole»; diario della mappa → «Come si gioca» (foglio `regole`). `Avv.COME` (i box «Come si gioca») resta come riassunto di una riga a testa.

### Tutorial: suggerimenti al tocco (`ATUT`)
Non un testo lungo: **al massimo un suggerimento alla volta**, una scheda piccola con titolo, due righe, «Capito» e «Basta suggerimenti» (in alto sulla mappa e nel dialogo, sotto il registro nella battaglia: lì non copre il testo di anteprima in basso). Sta **sotto i fogli** (z-index 3, i fogli 4) e **non si mostra mentre un foglio è aperto** (luogo, diario, poteri, pausa delle reazioni): `ATUT.contesto` porta `foglio` e `prossimo` risponde `null`. I suggerimenti sono dati puri (`ATUT.SUGGERIMENTI`: id, schermata, condizione sullo stato, testo); `ATUT.prossimo(contesto, visti)` dà il primo non ancora visto. Quelli già visti si ricordano sul telefono (`avv-tut`), la pagina Avventura ha «Suggerimenti: sì/no» e «Rivedi i suggerimenti». Compaiono solo nella prima sessione del primo capitolo (`racc.sessioni === 0`), a meno che il giocatore li richiami.

| id | Schermata | Quando |
|---|---|---|
| `mappa-tira` | mappa | giro appena iniziato, nessun eroe ha tirato il movimento |
| `mappa-muovi` | mappa | movimento tirato, nessuna destinazione |
| `mappa-perdizione` | mappa | prima alba (giorno ≥ 2) o perdizione > 0 |
| `mappa-luogo` | mappa | gruppo in un luogo con servizi |
| `mappa-notte` | mappa | prima notte |
| `bat-turno` | battaglia | prima battaglia, turno di un eroe |
| `bat-tocco` | battaglia | prima battaglia, un'azione in anteprima (da confermare) |
| `dia-prova` | dialogo | scelta con prova `[Abilità %]` |
| `dia-compagno` | dialogo | un compagno ha reagito |

Sono **nove** (non dieci): una vita persa non ha un suggerimento a parte, perché il foglio del risveglio la spiega già. Le condizioni (`ATUT.COND`) sono funzioni pure del contesto; l'ordine della tabella è la priorità.

## 4. Missioni generate (la bacheca)
`AEVE.missione(seme, mondo)` (A7) scrive già una missione intera: un'offerta del cliente, la scena sul posto e il ritorno, con ricompensa e scadenza. `AEVE.generata(seme, mondo)` la rende utilizzabile **più volte insieme**: ogni scena e il personaggio prendono il prefisso dell'id (`gen-<base36>-offerta|arrivo|ritorno`, personaggio `gen-<id>-cl`; solo `a-z`, `0-9` e `-`, come chiede `ARAC.valida`), così più incarichi convivono nello stesso capitolo. Qui la collega alla campagna (`motori/28a-avv-orchestratore.js`):
- **Chiedere un incarico**: nelle città e nei villaggi con servizi (non assediati), foglio del luogo → «Bacheca degli incarichi» → `{t:'bacheca'}`. Il seme viene dal dado di `camp` (`seme32(DAD.gen(s))`), il livello dalla media del gruppo (`livelloGruppo`); il bersaglio è un antro, una rovina o una torre (più incarichi possono avere la stessa meta). Limiti (`PARAM`): al massimo **2 incarichi aperti** (`incarichiMax`: «Avete già 2 incarichi da concludere») e **uno nuovo al giorno** per luogo («Per oggi non c'è altro»); un'offerta lasciata a metà nello stesso luogo si **riprende** (`riusa`), non se ne crea una seconda; se non c'è nessun bersaglio libero «Per ora la bacheca è vuota».
- **Stato**: `s.gen = [{ id, seme, liv, giorno, origine, meta, rif? }]` — circa 95 byte l'uno, si tengono gli ultimi **10** (`incarichiTenuti`, sempre potando prima i conclusi): il capitolo-frammento si **riscrive dal seme** a ogni apertura (`AEVE.generata` è deterministica; con `origine` dato non consuma dadi), quindi il salvataggio non cresce. Lo stato dell'incarico è **derivato** (`statoGen`): `offerta` (scena avviata, non ancora accettata), `attiva` (`racc.missioni[m-<id>].stato === 'attiva'`), `fatta`, `rifiutata` (`rif`, non si vede più), `scaduta`.
- **Scene**: `capDi(s, cap)` unisce al capitolo le scene di strada (`ev-<id>`) e i frammenti degli incarichi in corso; `AVV.vista` elenca le scene generate disponibili nel luogo (arrivo dove c'è la meta, ritorno dal cliente dopo la bandiera `gen-<id>-fatto`). L'arrivo ha la battaglia, due se la complicazione è «imboscata».
- **Scadenza**: una missione `scadenza` con `giorno > entro` si segna `fallita` **una volta sola** (`scadenze`, a ogni azione: lo dice nella cronaca), le sue scene spariscono e si legge «scaduto» nel diario.
- **Sotterranei**: dove c'è un incarico `arrivo` la storia decide il passo, come per le scene del capitolo (`entra` rifiutata con «la storia…», si apre la scena); compiuto il lavoro il sotterraneo si può visitare e l'arrivo non si rigioca.
- **Vista**: il foglio del luogo mostra la riga «Bacheca degli incarichi» con «Leggi» (spento, con il perché, se oggi non c'è altro); il diario ha la sezione «Incarichi» con cliente, luogo, scadenza e premio; il riassunto del Locandiere conosce gli incarichi conclusi. `AVV.incarichi(s)` e `AVV.bacheca(s, cap)` sono la vista pura che le due pagine leggono.
- **Correzione A9 trovata qui**: `Dia.fonte()` in una sessione leggeva il capitolo semplice, quindi le scene degli eventi di strada (`ev-<id>`) non si potevano mostrare; ora passa da `AVV.capitolo(Ses.a, Ses.cap)`.

## 5. Fuori da A10
TV e telefoni (A11), 3D (A12), numero di vite, prezzi e difficoltà (A13). Le tracce sono sintetizzate (nessun file audio): la qualità della musica si giudica a orecchio e si ritocca nelle tabelle di `AAUD`, mai in `Snd`.

## 6. Test
- `tests/test_avv_audio.js`: forma delle tracce (battute, passi, note, strumenti, tempi) e che siano tutte diverse; scelta della traccia per ogni contesto; ogni passo di `ACRO` che suona; partiture valide (durata, volume, frequenze); ogni tipo di danno ha il suo suono; i nomi riusati esistono in `03-audio.js`; `azione()` su stati veri di `AVV`; nessun `Math.random`; nessun marchio.
- `tests/test_avv_tutorial.js`: ordine e condizioni dei suggerimenti, nessuno ripetuto, «Basta suggerimenti», solo nella prima sessione, nessun suggerimento con un foglio aperto, memoria rotta o sconosciuta.
- `tests/test_avv_orchestratore.js` (blocco «la bacheca»): visibilità, dimensione, capitolo unito valido (`ARAC.valida`), accettare, limiti al giorno e al massimo, rifiutare, offerta a metà ripresa, arrivo → battaglie → ritorno → pagati, scadenza, potatura a 10, salvataggio, vecchi salvataggi, stessa partita = stessi incarichi.
- Scenario `avv_rifinitura` (browser, 390 px, `tools/test-browser/run.py avv_rifinitura`): 26 suoni registrati e suonabili senza errori; fuori dall'Avventura vale il tema del menu; musica di città nel prologo e sulla mappa, di battaglia, di vittoria, di sconfitta; «Leggi le regole» e suggerimenti sì/no nella pagina; una sola schedina, dentro lo schermo, che non compare con un foglio aperto, si chiude, non torna (nemmeno dopo un ricarico); bacheca → offerta → accetto → incarico attivo → bacheca spenta lo stesso giorno → diario con «Incarichi» e «Come si gioca»; schedina della battaglia dentro lo schermo; «Basta suggerimenti» spegne anche sul telefono. `FOTO_RIFINITURA` e `FOTO_RIFINITURA_MAPPA` salvano le due schermate.
