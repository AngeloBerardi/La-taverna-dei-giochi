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
- Terreno e formazioni (V5): vedi le due tabelle sotto («Il terreno», «Le formazioni»); l'IA usa le stesse regole.
- Tornei (V2): ogni città ha il suo giorno, uno su sette (`(giorno + id) % 7 === 0`); la Carta e le voci di locanda dicono dove. Iscrizione 40 × livello di ogni capitano, tre duelli a piedi
  (sfidante, campione, gran campione), un avversario per capitano, ognuno con uno dei quattro corredi (spada e scudo, spadone, alabarda, mazza). Il capitano combatte con il suo equipaggiamento
  senza cavallo né arco (l'arco diventa una spada), niente ordini né Grido. Premi 2×, 4×, 8× l'iscrizione (si incassano ritirandosi o vincendo la finale), +5 e +15 fama e un oggetto di pregio 3
  mai già posseduto. Oltre il livello 5 (media dei capitani) i campioni crescono a ogni livello (`TORNEO.cresce`): il premio sale, il rischio resta. Sconfitta: fuori, premio perso, nessuna prigionia né perdita di uomini, vita al 50% fino a sera. Un solo torneo al giorno per città.
- Regni: contratto (fama 25), giuramento con feudo (fama 100), assedi con assalto dai varchi, fortezze proprie con guarnigione. I signori hanno un tratto.
- Diplomazia (V3): tra due regni c'è guerra, pace o alleanza (un solo alleato per regno; dura almeno 20 giorni, si rompe con 3 giorni di preavviso; gli alleati non si attaccano, si soccorrono negli assedi e combattono insieme). Da vassallo parli col tuo re nella sua capitale e proponi pace, alleanza o guerra; da mercenario a contratto puoi chiedere solo la pace; da capitano libero non hai voce. L'esito è un conto con i fattori in chiaro (amicizia, fama, indole del re, forza relativa, guerre in corso), senza dadi. Dopo una proposta accolta lo stesso re ti riceve di nuovo dopo 3 giorni. Gli alleati soccorrono un assedio solo se sono in guerra con chi assedia. I regni si alleano anche da soli, di rado, contro chi vince troppo.
- Il regno (V4): si fonda dalla sala di una propria città o castello con fama 150, 5000 monete e nessun legame; nome fino a 24 lettere e uno stendardo tra otto. Confinanti (regni vivi con un luogo a meno di 20 dal tuo): chi ha amicizia ≥ 20 propone pace (+5), chi è ≤ −25 dichiara guerra subito, gli altri dichiarano guerra entro 10 giorni salvo alleanza. Con la corona le guerre e le alleanze del regno sono quelle tra fazioni (non più l'opinione): aggredire gente di un regno è guerra, e da sovrano la guerra si dichiara e l'alleanza si rompe con preavviso; in una capitale si propone pace o alleanza con un conto (peso 1,2). Signori: nell'incontro un signore non re può passare a te per un feudo; il conto ha sempre fattori in chiaro (giuramento −4, esule +6, indole, amicizia personale, fama fino a 300, regno debole +2, in guerra con te −2, feudo da 0 a +3) e vale da 0 in su. Feudi: tenuto (rende a te) o dato (rende un settimo al giorno al signore, che porta le sue truppe); i compagni investiti diventano signori con truppe proprie. Malcontento: +4 per ogni luogo tenuto oltre i 3, −3 sotto; le rendite calano di malcontento/200, oltre 60 il morale scende. Un regno caduto lascia esuli (30 giorni); la corona cade con l'ultima fortezza. Vittoria: tutte le capitali tue (o del tuo re da vassallo), una volta sola; la partita continua.
- In compagnia (1–4): dalla stanza si sceglie «Compagnia di ventura». Una sola compagnia e una sola cassa, un capitano a testa.
- La partita in compagnia si salva da sola (a ogni alba, all'uscita da un luogo, a fine battaglia) sul telefono di ognuno: un altro giorno, aprendo di nuovo «Compagnia di ventura» dalla stanza, si sceglie «Riprendi la compagnia». Una partita nuova (o entrare nella compagnia di un altro) non cancella quella salvata: passa a «precedente», una sola copia, che la carta offre. Con più o meno giocatori la compagnia si adatta: i capitani senza giocatore restano nel libro ma non scendono in campo. Una partita in solitario si può portare in compagnia, e la compagnia si può continuare da soli.

## Il terreno
Zone ellittiche sul campo, estratte dal seme (quindi uguali su tutti i telefoni): altura, bosco, case, acqua bassa. Il motore dice dove sono (`quota`, `copre`, `acqua`); la vista le disegna con le stesse funzioni.

| Zona | Dove | Effetto |
|---|---|---|
| Altura | terra di nessuno (colline: due; pianura: sei volte su dieci; bosco: tre volte su dieci) | chi è più in alto tira un quarto più lontano e in mischia colpisce meglio; salire rallenta (passo al 40%) |
| Bosco | boschi e boschetti sul campo | i tiri contro chi sta dentro vanno a segno la metà delle volte; i cavalieri dentro vanno più piano; nessuno carica da dentro o contro chi sta dentro |
| Case | davanti a villaggio, porto, locanda, monastero | come il bosco |
| Acqua bassa | riva (costa) e guado | passo dimezzato, niente carica |

## Le formazioni
Ogni gruppo (fanti, tiratori, cavalieri) ha una formazione; un tocco sul gruppo già scelto passa alla successiva (larga → serrata → cuneo → larga; i tiratori saltano il cuneo). Dopo un cambio si aspetta tre secondi.

| Formazione | Parte così | Effetto |
|---|---|---|
| Serrata | fanti | file strette, passo all'80%, difesa +20%; i tiri contro di lei a metà se ha lo scudo, +15% se non lo ha; la carica contro di lei vale metà; contro fanti con la picca la carica è annullata e chi carica si ferisce |
| Larga | tiratori, cavalieri | uomini distanziati; i tiri contro di lei fanno metà danno; la carica contro di lei vale una volta e mezza |
| Cuneo | (a scelta; non i tiratori) | punta verso il nemico; attacco +15%, carica +25%; colpita sul fianco o alle spalle la difesa scende del 25% |

## Riferimento visivo
Stile nostro: diorama a facce piatte reso a pixel d'arte (telecamera ortografica a tre quarti, contorni, luce a bande, retino),
palette calda di giorno e blu di luna la notte; fasce e pannelli nello stile unico legno e ottone. Niente figure o icone copiate.

## Numeri
Truppe, merci, equipaggiamento e compagni: `VDAT` (`motori/28j-ven-dati.js`). Mondo: `VEN.P` (`28k`). Campo: `VCAM.C` (`28l`).
