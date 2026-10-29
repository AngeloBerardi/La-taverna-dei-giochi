# Cantari di Ventura (id `avventura`)
**1–4 eroi (un telefono; poi TV + telefoni)** · **capitolo da 3–5 sessioni di circa un'ora, salvataggio tra una e l'altra** · **campagna cooperativa a esagoni con battaglie tattiche a turni** · **Marchio**: libero. Il nome «Cantari di Ventura» è nostro; trama, luoghi, personaggi, mostri, testi e grafica sono originali. Le meccaniche (d20, bonus, copertura) sono regole generiche da gioco di ruolo, non testo protetto.

Piano di lavoro: `docs/AVVENTURA.md`. Mockup: `docs/design/avventura.html`. Motori previsti: `ADADI`, `AOGG`, `APOT`, `ASCO`, `AIA`, `ARAC`, `AVV` (vedi piano).

## Idea in una frase
Una compagnia di eroi gira per un regno a esagoni, fa fronte alla **perdizione** che cresce a ogni alba, affronta scontri tattici su un campo a esagoni e porta a termine una storia a capitoli raccontata dal Locandiere come un cantastorie in piazza.

## Modelli di riferimento (solo ispirazione di struttura e di leggibilità; nessuna copia)
- **Viaggio a esagoni cooperativo con perdizione**: gruppo da 1 a 3 personaggi su una mappa esagonale; il movimento dipende dalla velocità; lo scontro nasce quando un personaggio entra nella casella del nemico e i compagni vicini possono unirsi; azioni ed attacchi si decidono con percentuali come ai dadi; le città curano, hanno negozi e missioni; il ciclo giorno/notte cambia nemici e botteghe; la morte è permanente e la campagna finisce se cade tutto il gruppo; esiste il cooperativo. Fonte: [Scheda enciclopedica del gioco cooperativo a esagoni](https://en.wikipedia.org/wiki/For_the_King).
- **La Perdizione** ricalca l'idea del «caos» che rende tutto più difficile, con eventi-flagello che modificano la mappa, rendono più cari i villaggi o nascondono luoghi già esplorati. Fonte: [Recensione del gioco cooperativo a esagoni — Game Critics](https://gamecritics.com/aj-small/for-the-king-review/).
- **Battaglia tattica a turni con regole da gioco di ruolo da tavolo**: iniziativa tirata a inizio scontro; azioni universali (scatto, salto, spinta, aiuto, lancio); azioni bonus; reazioni e attacchi di opportunità; la posizione alta dà un vantaggio. Fonte: [PCGamesN — turni di combattimento nel gioco di ruolo di riferimento](https://www.pcgamesn.com/baldurs-gate-3/combat-turn-based).
- **Copertura**: mezza copertura +2 alla CA, tre quarti +5, copertura totale = non si può mirare. Fonte: [Regole di copertura, SRD](https://5thsrd.org/combat/cover/).
- **Lezioni di interfaccia per il tocco** (analisi dell'adattamento a console di una barra azioni): meglio una sola barra visibile che menu annidati a 3–4 livelli; azioni comuni (scatto, spinta, salto) mai sepolte; suggerimenti con pressione lunga o pannello fisso invece del passaggio del mouse; colore per tipo di risorsa; ritratto piccolo; bersagli grandi. Fonte: [UX Collective — adattamento a console di una barra azioni](https://bootcamp.uxdesign.cc/bridging-the-gap-overhauling-console-experience-in-baldurs-gate-3-43ef3578791b).
- **Tono dei nomi**: i cantari medievali erano episodi brevi recitati da cantastorie nelle piazze, con nuovi episodi nei giorni successivi nello stesso luogo; le «compagnie di ventura» prendevano nome da santi, colori e capitani. Fonti: [Studenti.it — poema cavalleresco](https://www.studenti.it/poema-cavalleresco-pulci-boiardo-a-confronto.html), [Condottiero — Wikipedia](https://en.wikipedia.org/wiki/Condottiero).

## Riferimento visivo (da seguire nei mockup e nella grafica)
Non si copia nessuna illustrazione: si ricalcano layout e proporzioni, si disegna tutto a mano nello stile della Taverna.
- **Mappa del mondo**: esagoni grandi (≥ 44 px di larghezza utile) con terreno a colori piatti e un glifo per tipo; segnalini tondi con il ritratto dell'eroe; i luoghi sono medaglioni ottone; nebbia scura sugli esagoni non visti; costo di movimento scritto sugli esagoni raggiungibili; in alto una sola riga di stato (giorno/notte, perdizione, oro, vite); stile «semplice 3D con bordi ben marcati» come il modello di riferimento (spigoli dei poligoni in evidenza).
- **Battaglia**: stesso reticolo esagonale della mappa, vista dall'alto leggermente inclinata; segnalini con anello (verde eroi, rosso nemici, ottone = turno attivo); barra dell'ordine di iniziativa in alto, ritratti piccoli; barra azioni in basso con **una sola fila** di bottoni da 48 px (Muovi, Attacca, 3 poteri, Oggetto, Fine); percentuali e danno atteso mostrati sul bersaglio prima di confermare; copertura = piccolo scudo (mezzo/pieno) sull'esagono; altezza = rialzo con ombra; ogni dado tirato viene mostrato per intero (d20 + bonus = totale contro CA).
- **Dialogo**: ritratto grande di chi parla in alto, testo a comparsa in una targa di legno, scelte in fila con etichetta fra parentesi quadre (`[Persuasione 65%]`, `[Solo Mago]`).
- **Scheda e inventario**: ritratto con razza e classe; sei caratteristiche con modificatore; PF, CA, movimento; sei posti equipaggiamento + cintura da 3 consumabili; zaino a griglia; confronto con l'oggetto equipaggiato al tocco.
- **Stile**: legno e ottone (`css/40-legno-ottone.css`), angoli netti, niente emoji, carattere Alegreya, ottone `#cf8f2c`/`#f0c166`, legno `#5c3a1e`/`#7a4f2b`, fondo `#2a1b0f`, testo `#f0d9ae`. Eroi verdi `#6fe39a`, nemici rossi `#ff6a57`, perdizione viola `#7d55c7`.

## Preparazione
1. Si sceglie la campagna (nuova o salvata) e gli eroi dell'account (da 1 a 4 posti; chi non è occupato da un eroe dell'account può essere riempito da un compagno incontrato nella storia).
2. La compagnia parte dal villaggio con 20 monete a testa (oro comune), 3 vite di gruppo, perdizione 0, giorno 1.
3. Le prove, i movimenti e i colpi usano un generatore di dadi salvato nella partita: stesso risultato su telefono, TV e nei test.

## Turno sulla mappa
Ogni eroe ha il suo segnalino e il suo turno (con un tocco si può «muovere tutti» quando sono nello stesso esagono).
1. **Tira il movimento**: all'inizio del proprio turno ogni eroe tira il dado di movimento: movimento della razza − 2 + 1d4 (Umano ed Elfo 4 + 1d4, Nano, Piccolo 3 + 1d4); la Concentrazione permette di ritirare.
2. **Muovi** su esagoni adiacenti pagando il costo del terreno: strada 1 (½ se dalla città), pianura 1, bosco e colle 2, palude 3; montagna e acqua non si passano (salvo ponti e barche).
3. **Esplora** gli esagoni vicini (raggio 2 → nebbia scoperta). Entrando in un luogo si può **Entrare** (città, villaggio, santuario, sotterraneo, accampamento, mercante) o proseguire.
4. **Incontri**: dopo il movimento un tiro decide se nasce un incontro (più probabile di notte e con perdizione alta). I nemici visibili sulla mappa si muovono a fine giro; toccare uno scontro avvia la **battaglia**.
5. **Riposo**: *breve* ovunque (recuperi poco, ricarichi i poteri «a scontro»); *lungo* solo in città o accampamento, consuma una razione.
6. **Giorno e notte**: dopo due riposi lunghi o due turni completi di tutti gli eroi cala la notte (nemici più forti, botteghe chiuse); all'alba la **perdizione** sale di 3.

### Perdizione (0–100)
- Sale: all'alba (+3), con le fughe, con le prove di gruppo fallite, con le scelte cattive e con la perdita di una vita (+10).
- Scende: santuari (−10 una volta), missioni secondarie (−5), alcuni oggetti.
- Soglie **25 / 50 / 75**: i nemici guadagnano un livello di pericolo, una città viene assediata, una strada si chiude. A **100** la campagna è persa.

### Vite di gruppo
La compagnia ha **3 vite**. Quando tutti gli eroi cadono in battaglia, si perde una vita: la compagnia si risveglia nell'ultima città con metà dei PF, **metà dell'oro comune perso e perdizione +10**. A zero vite la campagna finisce; gli eroi dell'account restano.

## Battaglia (griglia a esagoni)
1. **Schieramento**: entrano gli eroi nell'esagono dello scontro e nei sei vicini; chi è a distanza 2 arriva dopo 2 giri. Prova di Percezione/Furtività per sorpresa o imboscata.
2. **Iniziativa**: d20 + modificatore di Destrezza per ogni combattente; l'ordine resta visibile.
3. **Il tuo turno**: movimento (si **tira**: movimento della razza − 2 + 1d4, ritirabile con Concentrazione), **un'azione**, **un'azione bonus**, **una reazione** per giro.
4. **Azioni**: Attacca, Potere, Scatto (movimento raddoppiato), Disimpegno (niente attacco di opportunità), Nasconditi, Aiuta (dà vantaggio a un alleato), Usa oggetto, Spingi, Rialza un compagno.
5. **Colpire**: d20 + bonus di attacco contro la **CA** del bersaglio. 1 naturale = manca; 20 naturale = colpisce e raddoppia i dadi di danno.
6. **Vantaggio / svantaggio**: due dadi, si tiene il migliore / il peggiore. Vantaggio da posizione alta, bersaglio a terra o accecato, aiuto di un alleato. Svantaggio da distanza lunga, aggressore accecato.
7. **Copertura** (ostacoli sull'esagono): mezza +2 CA, tre quarti +5 CA, totale = non si può mirare. **Linea di vista**: una linea fra i centri; i muri e gli ostacoli alti la bloccano.
8. **Altezza**: un rialzo costa +1 al movimento; chi sta sopra ha vantaggio su chi sta sotto.
9. **Reazioni**: attacco di opportunità quando un nemico esce dalla portata senza Disimpegno; poteri di reazione (parata, contrattacco, scudo).
10. **Cadere e morire**: a 0 PF si è **a terra**; un compagno può rialzarti (azione + prova di Medicina o pozione). Se tutti gli eroi sono a terra la battaglia è persa (si perde una vita). I nemici a 0 PF muoiono; i banditi possono arrendersi.
11. **Fine**: vittoria (esperienza, oro, bottino), fuga (uscita dal bordo o prova di gruppo → perdizione +1) o sconfitta.

## Concentrazione
Ogni eroe ha una riserva di punti **Concentrazione** (uguale al bonus di competenza). Un punto permette di: ritirare un dado appena tirato, o dare vantaggio a una prova. Si ricarica con il riposo lungo.

## Dialoghi e storia
- Le scene hanno nodi con **scelte condizionate** (classe, razza, oggetto, livello, approvazione, bandiere); alcune scelte sono **prove** con probabilità sempre visibile.
- **Compagni** reclutabili: scheda come un eroe, **approvazione** da −100 a +100 che cambia con le scelte, missione personale; possono lasciare il gruppo.
- Il **Locandiere** apre e chiude ogni sessione con «Nel cantare precedente…» letto dalle scelte salvate.
- Trama principale scritta a mano (capitolo); missioni ed eventi secondari generati da tabelle.

## Esperienza, livelli, oro
- Curva XP già in `EROI.SOGLIE_XP` (livelli 1–10). Gli eroi dell'account ricevono esperienza, oro e oggetti a fine sessione.
- **Oro comune** della compagnia; ogni eroe ha il suo zaino e i suoi posti di equipaggiamento.

## Tabella dei numeri base (punto di partenza, da bilanciare in A13)
| Livello | PF (dado 8, COS +1: come `EROI.derivati`) | CA tipica eroe | Bonus attacco | Danno medio per colpo (con poteri e oggetti; l'arma base fa 7) | CD «facile / media / dura» | XP per arrivarci |
|---|---|---|---|---|---|---|
| 1 | 9 | 14 | +5 | 7 | 10 / 13 / 16 | 0 |
| 2 | 15 | 14 | +5 | 8 | 11 / 14 / 17 | 100 |
| 3 | 21 | 15 | +5 | 9 | 11 / 14 / 17 | 300 |
| 4 | 27 | 15 | +5 | 10 | 12 / 15 / 18 | 700 |
| 5 | 33 | 16 | +6 | 12 | 12 / 15 / 18 | 1300 |
| 6 | 39 | 16 | +6 | 13 | 13 / 16 / 19 | 2100 |
| 7 | 45 | 17 | +6 | 15 | 13 / 16 / 19 | 3200 |
| 8 | 51 | 17 | +6 | 16 | 14 / 17 / 20 | 4600 |
| 9 | 57 | 18 | +7 | 18 | 14 / 17 / 20 | 6400 |
| 10 | 63 | 18 | +7 | 19 | 15 / 18 / 21 | 8600 |

Ritmi indicativi di un capitolo di 4 sessioni da un'ora: livelli 1 → 5; circa 8 battaglie per sessione (3–6 turni ciascuna); oro guadagnato per sessione ≈ 150 al livello 1, ≈ 600 al livello 4; pozione di cura 25 monete, arma comune 40–80, armatura media 150.

## Glossario italiano (usare sempre questi termini)
| Termine | Significato |
|---|---|
| **Compagnia** | il gruppo di eroi (fino a 4) |
| **Eroe / Compagno** | personaggio dell'account / personaggio della storia reclutato |
| **PF** | punti ferita |
| **CA** | classe armatura: valore da superare per colpire |
| **CD** | classe di difficoltà di una prova |
| **Prova** | d20 + bonus contro una CD |
| **Vantaggio / Svantaggio** | due dadi, si tiene il migliore / il peggiore |
| **Concentrazione** | riserva di punti per ritirare o ottenere vantaggio |
| **Perdizione** | contatore 0–100 del male che avanza |
| **Vita (di gruppo)** | le 3 occasioni di rialzarsi dopo una sconfitta |
| **Cantare** | una sessione della campagna (Primo cantare, Secondo cantare…) |
| **Capitolo** | un'intera storia di più cantari |
| **Azione / Azione bonus / Reazione** | le tre risorse del proprio turno |
| **Scatto / Disimpegno** | raddoppia il movimento / evita gli attacchi di opportunità |
| **A terra** | eroe a 0 PF, fuori dalla battaglia ma non morto |
| **Locandiere** | il narratore (cantastorie) |
| **Esagono** | casella della mappa e della battaglia |

## Casi limite
- Eroe isolato lontano dalla compagnia: se lo scontro è a distanza ≥ 3 combatte da solo; può fuggire con una prova.
- Oro insufficiente per la perdita di una vita: si perde quello che c'è.
- Salvataggio interrotto durante una battaglia: si riprende dal turno corrente (il generatore di dadi è nello stato).
- Eroe dell'account modificato di nascosto: `EROI.coerente` lo scarta all'avvio.
- Aggiunta di un eroe in corsa: solo in città.

## Test del motore (3)
1. **Conservazione**: PF mai sopra il massimo né sotto 0, oro non creato dal nulla (compra/vendi), un'azione per turno.
2. **Determinismo**: stessa partita, stesso seme, stesse azioni ⇒ stesso stato finale; riprendibile da qualsiasi mossa salvata.
3. **Bot**: il bot bravo vince ≥ 85% degli scontri «medi» del proprio livello, il bot casuale ≤ 30%; nessuna battaglia dura più di 40 giri.

## Fonti
- [Scheda enciclopedica del gioco cooperativo a esagoni](https://en.wikipedia.org/wiki/For_the_King)
- [Recensione del gioco cooperativo a esagoni — Game Critics](https://gamecritics.com/aj-small/for-the-king-review/)
- [PCGamesN — turni di combattimento in un gioco di ruolo di riferimento](https://www.pcgamesn.com/baldurs-gate-3/combat-turn-based)
- [UX Collective — adattamento a console di una barra azioni](https://bootcamp.uxdesign.cc/bridging-the-gap-overhauling-console-experience-in-baldurs-gate-3-43ef3578791b)
- [Regole di copertura — SRD 5](https://5thsrd.org/combat/cover/)
- [Studenti.it — poema cavalleresco](https://www.studenti.it/poema-cavalleresco-pulci-boiardo-a-confronto.html)
- [Condottiero — Wikipedia](https://en.wikipedia.org/wiki/Condottiero)
