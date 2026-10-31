# A10 — Musica, suoni, regole in-game, tutorial, missioni generate

Piano e contratti di `AAUD` (`motori/28c-avv-audio.js`), `ATUT` (`motori/28d-avv-tutorial.js`), `AvvAudio` (`app/24hk-audio-avv.js`), `AvvTut` (`app/24hl-tutorial.js`) e delle missioni generate in `AVV`. Stato: **in lavorazione** (ramo `feat/avventura-a10`, sopra A9).

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
Non un testo lungo: **al massimo un suggerimento alla volta**, una scheda piccola in alto con titolo, due righe e «Capito». I suggerimenti sono dati puri (`ATUT.SUGGERIMENTI`: id, schermata, condizione sullo stato, testo); `ATUT.prossimo(contesto, visti)` dà il primo non ancora visto. Quelli già visti si ricordano sul telefono (`avv-tut`), la pagina Avventura ha «Suggerimenti: sì/no» e «Rivedi i suggerimenti». Compaiono solo nella prima sessione del primo capitolo (`racc.sessioni === 0`), a meno che il giocatore li richiami.

| id | Schermata | Quando |
|---|---|---|
| `mappa-tira` | mappa | giro appena iniziato, nessun eroe ha tirato il movimento |
| `mappa-muovi` | mappa | movimento tirato, nessuna destinazione |
| `mappa-perdizione` | mappa | prima alba (giorno ≥ 2) o perdizione > 0 |
| `mappa-luogo` | mappa | gruppo in un luogo con servizi |
| `mappa-notte` | mappa | prima notte |
| `bat-turno` | battaglia | prima battaglia, turno di un eroe |
| `bat-tocco` | battaglia | prima battaglia, dopo il primo turno |
| `dia-prova` | dialogo | scelta con prova `[Abilità %]` |
| `dia-compagno` | dialogo | un compagno ha reagito |
| `sveglia-vite` | sveglia | prima vita persa |

## 4. Missioni generate (la bacheca)
`AEVE.missione(seme, mondo)` (A7) scrive già una missione intera: un'offerta del cliente, la scena sul posto e il ritorno, con ricompensa e scadenza. Qui la collega alla campagna:
- **Chiedere un incarico**: nelle città e nei villaggi, foglio del luogo → «Bacheca degli incarichi» → `{t:'bacheca'}`. Il seme viene dal dado di `camp` (`ADADI.gen`), il livello dalla media del gruppo; al massimo **2 incarichi aperti** e uno nuovo al giorno per luogo.
- **Stato**: `s.gen = [{ id, seme, liv, giorno, origine, stato:'offerta'|'attiva'|'fatta'|'scaduta' }]` — poche decine di byte: il capitolo-frammento si **riscrive dal seme** ogni volta (`AEVE.missione` è deterministica), quindi il salvataggio non cresce.
- **Scene**: le scene del frammento si chiamano `<id>:offerta`, `<id>:arrivo`, `<id>:ritorno` (prefisso per non scontrarsi con altre missioni o con la storia); mentre una di esse è in corso `capDi` unisce al capitolo il frammento di quella missione (personaggi, luoghi, missione, ricompensa). `AVV.vista` elenca anche le scene generate disponibili nel luogo.
- **Scadenza**: una missione `scadenza` con `giorno > entro` diventa `scaduta`: si legge nel diario e non si può più concludere.
- **Sotterranei**: dove c'è un incarico `arrivo` la storia decide il passo, come per le scene del capitolo (`entra` rifiutata, si apre la scena).
- **Vista**: il foglio del luogo mostra la bacheca (richiedi / incarichi aperti), il diario elenca gli incarichi con luogo e scadenza.

## 5. Fuori da A10
TV e telefoni (A11), 3D (A12), numero di vite, prezzi e difficoltà (A13). Le tracce sono sintetizzate (nessun file audio): la qualità della musica si giudica a orecchio e si ritocca nelle tabelle di `AAUD`, mai in `Snd`.

## 6. Test
- `tests/test_avv_audio.js`: forma delle tracce (battute, passi, note, strumenti, tempi) e che siano tutte diverse; scelta della traccia per ogni contesto; ogni passo di `ACRO` che suona; partiture valide (durata, volume, frequenze); ogni tipo di danno ha il suo suono; i nomi riusati esistono in `03-audio.js`; `azione()` su stati veri di `AVV`; nessun `Math.random`; nessun marchio.
- `tests/test_avv_tutorial.js`: ordine e condizioni dei suggerimenti, nessuno ripetuto, «salta tutto», solo nella prima sessione.
- `tests/test_avv_orchestratore.js`: bacheca, scene generate, scadenza, salvataggio piccolo.
- Scenario `avv_sessione` (browser): le tracce giuste in mappa, città, battaglia, vittoria, sconfitta; tutti i suoni si possono suonare senza errori; un suggerimento compare, si chiude e non torna; bacheca → incarico → diario.
