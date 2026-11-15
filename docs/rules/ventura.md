# Compagnia di ventura (regole in-game)

Fonte del testo di `RULES.ventura` in `src/js/app/07d-regole.js`. Regole nostre: il genere è quello dei giochi di comando di
truppe in un mondo libero (mappa strategica + battaglie campali in tempo reale); nessun nome, testo o grafica di giochi commerciali.

## In breve
- Capitano di una compagnia in un mondo libero: cinque regni (Valdoro, Selvamara, Ferropietra, Maralta, Altaterra), 97 luoghi, predoni, carovane. Nessuna trama.
- Luoghi: città, castelli, villaggi, porti (traversate per mare), monasteri (cure e benedizione), locande (voci e compagni), rovine e covi (nascosti finché non li scopri; si assaltano per il tesoro).
- Mappa: tocco per muoversi; il tempo scorre solo camminando o accampandosi (un giorno ≈ 3 minuti a ×1). «Carta» mostra il mondo intero.
- Compagnia: reclute nei villaggi, mercenari e compagni in taverna e locanda; esperienza → promozioni (fanti, tiratori, cavalieri; arcieri a cavallo solo ad Altaterra);
  viveri ogni giorno, paga ogni sette giorni, morale.
- Zaino: arma, scudo, armatura, elmo, cavallo, cimelio. Botteghe d'armi con scorte che cambiano, un'offerta unica per capitale, bottino dopo le battaglie, tesori di rovine e covi, premi degli incarichi.
- Monete: commercio a prezzi mobili, incarichi, bottino, riscatti, soldo da mercenario, rendite dei feudi.
- Battaglia: tempo reale con pausa; capitano guidato a tocchi, ordini ai tre gruppi (Carica, Tieni, Seguimi, Avanti, Indietro), Grido;
  il campo è quello dove ti trovi (bioma, costa, strada, luogo vicino, ora, meteo: nebbia accorcia il tiro, pioggia lo rende impreciso);
  rinforzi a ondate oltre 34 uomini per lato; rotta; risoluzione automatica con lo stesso motore.
- Tornei (V2): ogni città ha il suo giorno, uno su sette (`(giorno + id) % 7 === 0`); la Carta e le voci di locanda dicono dove. Iscrizione 40 × livello di ogni capitano, tre duelli a piedi
  (sfidante, campione, gran campione), un avversario per capitano, ognuno con uno dei quattro corredi (spada e scudo, spadone, alabarda, mazza). Il capitano combatte con il suo equipaggiamento
  senza cavallo né arco (l'arco diventa una spada), niente ordini né Grido. Premi 2×, 4×, 8× l'iscrizione (si incassano ritirandosi o vincendo la finale), +5 e +15 fama e un oggetto di pregio 3
  mai già posseduto. Sconfitta: fuori, premio perso, nessuna prigionia né perdita di uomini, vita al 50% fino a sera. Un solo torneo al giorno per città.
- Regni: contratto (fama 25), giuramento con feudo (fama 100), assedi con assalto dai varchi, fortezze proprie con guarnigione. I signori hanno un tratto.
- Diplomazia (V3): tra due regni c'è guerra, pace o alleanza (un solo alleato per regno; dura almeno 20 giorni, si rompe con 3 giorni di preavviso; gli alleati non si attaccano, si soccorrono negli assedi e combattono insieme). Da vassallo parli col tuo re nella sua capitale e proponi pace, alleanza o guerra; da mercenario a contratto puoi chiedere solo la pace; da capitano libero non hai voce. L'esito è un conto con i fattori in chiaro (amicizia, fama, indole del re, forza relativa, guerre in corso), senza dadi. I regni si alleano anche da soli, di rado, contro chi vince troppo.
- In compagnia (1–4): dalla stanza si sceglie «Compagnia di ventura». Una sola compagnia e una sola cassa, un capitano a testa.
- La partita in compagnia si salva da sola (a ogni alba, all'uscita da un luogo, a fine battaglia) sul telefono di ognuno: un altro giorno, aprendo di nuovo «Compagnia di ventura» dalla stanza, si sceglie «Riprendi la compagnia». Con più o meno giocatori la compagnia si adatta: i capitani senza giocatore restano nel libro ma non scendono in campo. Una partita in solitario si può portare in compagnia, e la compagnia si può continuare da soli.

## Riferimento visivo
Stile nostro: diorama a facce piatte reso a pixel d'arte (telecamera ortografica a tre quarti, contorni, luce a bande, retino),
palette calda di giorno e blu di luna la notte; fasce e pannelli nello stile unico legno e ottone. Niente figure o icone copiate.

## Numeri
Truppe, merci, equipaggiamento e compagni: `VDAT` (`motori/28j-ven-dati.js`). Mondo: `VEN.P` (`28k`). Campo: `VCAM.C` (`28l`).
