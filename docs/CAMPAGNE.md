# Campagne (fondamenta)

Obiettivo: campagne a più sessioni stile *For the King* (mappa a esagoni, gruppo di 1–3 eroi, giorno/notte, perdizione che avanza, prove con i dadi), con eroi legati all'account. Tutto originale: nomi, regole di dettaglio e grafica sono nostri.

## Cosa c'è
- **Eroi** (`motori/27-eroi.js`, `app/24g-eroi.js`, dati `players/{uid}/eroi/e1..e5`): 5 razze, 6 classi, 27 punti da distribuire (8–15), creazione guidata in 5 passi, ritratto SVG, livelli da XP. Regole di `firestore.rules` impediscono punteggi truccati, cambio razza/classe e salti di livello.
- **Campagna** (`motori/28-campagna.js`, vista `app/24h-campagna.js`, `css/39-campagna.css`): motore puro, stato JSON.
  - Mappa generata dal seme (raggio 6): pianura, strada, bosco, colle, palude, montagna, acqua. Città, antro e torre sono sempre collegati da terreno calpestabile; tesori e accampamenti sparsi. Nebbia: si vedono solo i luoghi scoperti (raggio 2).
  - Movimento a costo di terreno (strada 0,5 · pianura 1 · bosco/colle 2 · palude 3); il gruppo usa il movimento dell'eroe più lento.
  - Giorno/notte: «Riposa» due volte = un giorno; ogni alba la **perdizione** sale di 3 (a 100 si perde); riposo curativo, più forte in città/accampamento. Di notte gli incontri sono più probabili e difficili.
  - Incontri casuali dopo il movimento: prova d20 + modificatore (+ competenza) contro una CD con l'abilità scelta (`EROI.prova`); fallire ferisce e fa crescere la perdizione.
  - Missione in tre passi: parla in città → ripulisci l'antro (3 prove, 2 riuscite) → abbatti la torre (4 prove, 3 riuscite). Anteprima giocabile da «Eroi → Campagna», salvata in locale.

## Da fare (prossimi passi)
1. Combattimento a turni sulla mappa (iniziativa, attacco/danno già in `EROI.derivati`).
2. Campagna condivisa: gruppo da più telefoni sopra `R.db` (come le partite a distanza), un eroe per giocatore.
3. Salvataggio dell'avanzamento negli eroi dell'account (XP, oro, oggetti) con regole che ne limitino la crescita per sessione.
4. Locandiere come Game Master: descrive gli incontri (`motori/24-locandiere.js` + funzione Netlify).
5. Oggetti, negozi di città, più missioni e mappe fatte a mano; musica e suoni propri.
