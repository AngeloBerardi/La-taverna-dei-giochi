# Campagne (fondamenta)

Obiettivo: campagne a più sessioni stile *For the King* (mappa a esagoni, gruppo di 1–3 eroi, giorno/notte, perdizione che avanza, prove con i dadi), con eroi legati all'account. Tutto originale: nomi, regole di dettaglio e grafica sono nostri.

## Cosa c'è
- **Eroi** (`motori/27-eroi.js`, `app/24g-eroi.js`, dati `players/{uid}/eroi/e1..e5`): 5 razze, 6 classi, 27 punti da distribuire (8–15), creazione guidata in 5 passi, ritratto SVG, livelli da XP. Regole di `firestore.rules` impediscono punteggi truccati, cambio razza/classe e salti di livello. Dal livello 2 la scheda offre scelte guidate (talenti ai livelli pari, poteri ai livelli 3, 5, 7, 9; `motori/27e-avv-poteri.js`); in campagna le scelte mancanti sono completate con la prima proposta.
- **Campagna** (`motori/28-campagna.js`, vista `app/24h-campagna.js`, `css/39-campagna.css`): motore puro, stato JSON.
  - Mappa generata dal seme (raggio 6): pianura, strada, bosco, colle, palude, montagna, acqua. Città, antro e torre sono sempre collegati da terreno calpestabile; tesori e accampamenti sparsi. Nebbia: si vedono solo i luoghi scoperti (raggio 2).
  - Movimento a costo di terreno (strada 0,5 · pianura 1 · bosco/colle 2 · palude 3); il gruppo usa il movimento dell'eroe più lento.
  - Giorno/notte: «Riposa» due volte = un giorno; ogni alba la **perdizione** sale di 3 (a 100 si perde); riposo curativo, più forte in città/accampamento. Di notte gli incontri sono più probabili e difficili.
  - Incontri casuali dopo il movimento: prova d20 + modificatore (+ competenza) contro una CD con l'abilità scelta (`EROI.prova`); fallire ferisce e fa crescere la perdizione.
  - Missione in tre passi: parla in città → ripulisci l'antro (3 prove, 2 riuscite) → abbatti la torre (4 prove, 3 riuscite). Anteprima giocabile da «Eroi → Campagna», salvata in locale.

## Aggiornamenti (A1, ottobre 2026)
- **Dadi nello stato**: `motori/27a-avv-dadi.js` (`ADADI`). `s.rng` avanza a ogni tiro: senza `rnd` esterno la partita è ripetibile; i test passano un `rnd` finto.
- **Stato v2** con `CAMP.migra` (le campagne salvate con la v1 si aggiornano da sole): compagnia fino a **4 eroi**, missione «La Torre dei Corvi», **prove a fasi** in antro (3) e torre (4), ognuna con il suo testo e 3 abilità (`CAMP.FASI`), «Fuggi» con l'eroe che copre la ritirata, nomi delle abilità con gli accenti in `EROI.NOME_AB`.
- **Pagina Avventura** (`app/24ha-avventura.js`): Continua, Nuova campagna, I tuoi eroi, Compagni, Come si gioca. Sostituisce il pulsante «Eroi» delle Impostazioni.
- **Regole degli eroi**: `EROI.LIMITI` (+800 xp e +1000 oro per scrittura, 60 s tra due guadagni, campo `agg` con l'ora del server); client `FB.avanzaEroe` (usato dalla task A9).

## Aggiornamenti (A2, ottobre 2026)
- **Oggetti**: `motori/27b-avv-oggetti.js` (`AOGG`). Armi per famiglia (accurata, a due mani, da lancio, gittata, portata), armature leggere/medie/pesanti, scudi, accessori, consumabili e oggetti di missione, in 4 rarità. L'eroe ha 5 posti (mano, seconda mano, armatura, 2 accessori), una cintura da 3 consumabili e uno zaino da 16. `EROI.derivati` somma i bonus (CA, attacco, danno, iniziativa, movimento, PF, abilità, resistenze); un eroe nuovo parte con una pozione.
- **Bottino e botteghe**: `motori/27c-avv-bottino.js` (`ABOT`). Forzieri, incontri (bestie, viandanti, rovine) e ricompense di antro e torre danno oro e oggetti secondo il pericolo (cresce con la distanza dalla città) e l'ambiente. In città il fabbro e l'emporio vendono la merce comune sempre e 4 pezzi rari o epici che cambiano ogni 3 giorni (dal seme della campagna). Si compra a listino e si rivende a metà prezzo: non nascono monete.
- **Campagna**: oro comune `s.oro`, oggetti nello zaino di ogni eroe; azioni `equipa`, `togli`, `cintura`, `zaino`, `usa`, `passa`, `compra`, `vendi` (bloccate negli incontri; compra e vendi solo in città). `CAMP.migra` completa anche i salvataggi senza zaino.
- **Vista**: pulsante Zaino sulla mappa → `app/24hb-inventario.js` (`Inv`): indossato, cintura, griglia dello zaino, confronto con ciò che si indossa, bottega.

## Aggiornamenti (A6, ottobre 2026)
La campagna è ora uno **stato v3** (`CAMP.migra` porta i salvataggi v1 e v2) e la vista è una mappa del mondo a tutto schermo. Il resto di questa scheda descrive la base di A0: dove cambia, vale questa sezione. Dettagli e scarti in `docs/AVVENTURA-A6.md`.
- **Mondo** (`motori/27m-avv-mondo.js`, `AMON`): mappa di raggio 9 (271 esagoni) generata dal seme, tre regioni nominate (Marca dei Corvi, Boschi Velati, Brughiere Cenerine) con la loro famiglia di mostri, luoghi (città, villaggi, santuari, accampamenti, un antro, rovine, la torre, tesori) sempre raggiungibili tra loro, mercanti sulle strade. Un capitolo può imporre luoghi scritti a mano (`opts.luoghi`).
- **Eroi separati**: ognuno ha `q, r, pm, brevi`. `tira` (d4 + velocità − 2, almeno 3; con Concentrazione due dadi e vale il migliore), `muovi` (un eroe, o tutti quelli nella sua cella con `tutti`), `fineTurno`. Un giorno ha 8 giri (5 di luce, 3 di notte); ai giri finiti si muovono mostri e mercanti.
- **Mostri visibili** (`27o-avv-mostri.js`, `AMOS`): gruppi `vaga | caccia | guardia`, visibili a 3 esagoni, mai dentro i luoghi sicuri; di notte +1 livello. Il contatto apre `s.sfida` (eroi entro 3 esagoni: a 0–1 subito, oltre arrivano dopo `dist` giri); `CAMP.battaglia(s)` prepara lo stato di `ASCO`, `act(s,{t:'esito',riep})` applica il risultato.
- **Luoghi** (`27n-avv-luoghi.js`, `ALUO`): servizi e prezzi (locanda 8 monete a testa, guaritore, tempio 20 + 10 × livello, bottega, bacheca delle taglie, preghiera), sotterranei a stanze (antro 4, rovine 3, torre 6; `avanza` costa un giro, `esci` e `entra` conservano i progressi), eventi a scelta, trappole con prova. **Capo scalato**: il capo vero compare solo se il livello medio è almeno quello del capo + 1.
- **Perdizione** a soglie 25/50/75 (mostri più forti e un gruppo in più, villaggio assediato, strade sbarrate); +3 a ogni alba, −3 con la preghiera (−8 con offerta), −3 con una taglia, −5 per un covo ripulito; a 100 la campagna è persa.
- **Vista** (`app/24h-campagna.js` + `24hg-mondo-mappa.js` + `24hh-mondo-pannelli.js`, `css/39-campagna.css`, prefisso `mo-`): mappa scorrevole con nebbia, segnalini degli eroi, mostri e mercanti visibili, cammino con secondo tocco di conferma, fogli per luogo, riposo, diario, nemici, prove, eventi, battaglia e fine. Un solo comando in `07c`: `data-a="mo" data-v="verbo:argomento"`. La battaglia della campagna riusa `Bat` (`Bat.daMondo`, «Continua» → `Camp.fineBattaglia`).
- **Zaino e botteghe**: `Inv` segue l'eroe scelto; la bottega è aperta in città e villaggi non assediati e accanto a un mercante (nei villaggi e dai mercanti solo merce comune).

## Da fare
Il piano completo, diviso in task da una sessione, è in `docs/AVVENTURA.md`.
