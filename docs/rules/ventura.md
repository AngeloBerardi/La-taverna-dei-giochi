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
- Regni: contratto (fama 25), giuramento con feudo (fama 100), assedi a fasi (vedi «L'assedio»), fortezze proprie con guarnigione. I signori hanno un tratto.
- Diplomazia (V3): tra due regni c'è guerra, pace o alleanza (un solo alleato per regno; dura almeno 20 giorni, si rompe con 3 giorni di preavviso; gli alleati non si attaccano, si soccorrono negli assedi e combattono insieme). Da vassallo parli col tuo re nella sua capitale e proponi pace, alleanza o guerra; da mercenario a contratto puoi chiedere solo la pace; da capitano libero non hai voce. L'esito è un conto con i fattori in chiaro (amicizia, fama, indole del re, forza relativa, guerre in corso), senza dadi. Dopo una proposta accolta lo stesso re ti riceve di nuovo dopo 3 giorni. Gli alleati soccorrono un assedio solo se sono in guerra con chi assedia. I regni si alleano anche da soli, di rado, contro chi vince troppo.
- Compagni e signori (V6a): gradimento 0..100 per compagno (parte da 50), mosso da eventi che ama (+6) o detesta (−8) — razzia, libera, riscatta, pagatardi, fame, perdite (≥25% degli uomini), vittoria (nemici ≥ noi), fuga, tributo, sito, torneo, cura, `servi_<regno>` (+3/−4) — con Carisma ×(1+0,1·Carisma) in su e ×(1−0,05·Carisma) in giù;
  paga puntuale +2, vittoria dura +1, intesa/antipatia ±1 a ogni paga se l'altro è in compagnia. Sotto 25 chiede di parlare (cronaca); a 10 o meno, o 7 giorni sotto 25, se ne va per sempre (`s.compagni[id] = -3`) con al più 6 uomini (12%) dei ranghi bassi; chi aveva intesa con lui perde 8.
- Dialoghi (V6b): scene a scelte del motore di racconto `ARAC` (27q), con i testi in `VVOC` (`motori/28ja-ven-voci.js`, formato di capitolo, senza `dove`). Una scena aperta (`s.rac.scena`) ferma il tempo e blocca `ordina`/`fai`/`scegli` («Prima rispondi»); in compagnia risponde chiunque (`{t:'parla'}`).
- Testi dei dialoghi (V6c, a blocchi): lamento con tre uscite (promessa `grad +8` e bandiera `<c>-promessa`, 80 monete `grad +12`, alzata di spalle `grad -4`); l'addio è più duro se la promessa c'era; incarico in tre passi col bivio al terzo (due finali, stesso premio, bandiere diverse); premi: talento più forte (`{abil:1}`) per Berta, Lapo, Ulfredo, Diamante e Suor Nera; un oggetto unico per Ghino (Carta dei Guadi), Isabetta (Bilancia di Maralta), Temu (il Grigio), Brando (Balestra dei Sei Colpi), Fosca (Lanterna delle Cripte). Signori: tre scene per indole, una per livello di fiducia (notizie, favori, sostegno), due risposte; la prima di solito alza la fiducia (`conf`), l'altra rende monete o gradimento. La Volpe: `volpe-1` patto, sfida (`volpe-sfida`) o disprezzo (`volpe-odio`); `volpe-2` colpo in società, sgarbo (-100 monete) o un favore che lei ti deve (`volpe-debito`); `volpe-3` dono solo con patto o debito, e con la sfida l'acciaio annunciato (Berta e Ulfredo ne godono di più).
  Le scene in coda (`s.voci`) partono dal passo successivo, con la compagnia all'aperto; una scena non ancora scritta si scarta e resta la cronaca di V6a. Chi le mette in coda: il lamento (`<c>-lamento`, all'avviso) e l'addio (`<c>-addio`) dei compagni, l'incarico (`<c>-inc-1` a gradimento ≥ 75, una sola volta),
  la confidenza di un signore che sale di livello (`sig-<tratto>-<livello>`), la rivale ai giorni `VDAT.VOLPE.GIORNI` (12, 40, 80: `volpe-1..3`, la sua compagnia compare accanto alla tua). Le scene leggono i fatti `grad-<c>`, `inc-<c>`, `con-<c>`, `serve-<regno>`, `fama`, `tappa`, `giorno`; scrivono con `oro` e con `ven` (`VEN.EFF_VOCI`: grad, via, passo, premio, scontro, conf, tappa).
  Incarichi personali (`COMPAGNI[i].inc`: tre passi di tipo luogo, vinci, sito o porta; `premio`: oggetto o `{abil:1}` = il compagno dà 3 punti di talento invece di 2): `porta` si consegna entrando in un luogo del tipo richiesto (`tipoL`), oppure all'inizio di una scena se non ne ha uno; il passo compiuto fa salire `s.grad[id].inc` e mette in coda la scena del passo dopo; dopo il terzo si dà il premio (una volta). La rivale lascia il cimelio una volta sola, per dono o per vittoria (`s.volpe.dono`).
  Cosa ama/odia compare nella ⓘ solo dopo la prima volta. Signori: memoria `lib/sconf/trad/fav`; fiducia 0..3 (soglie 3, 7, 12 su `lib·3 + fav·2 + amicizia/15 − sconf·2 − trad·6`); notizie da 1, lettera e prestito da 2 (un favore ogni 10 giorni), sostegno alle proposte da 3 (+1,5 per signore, al più due). Talenti: Carisma, Diplomazia (+0,4 per punto alle proposte), Fama di cavaliere (+2 att, +4 pf per punto nei tornei).
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
Ogni gruppo (fanti, tiratori, cavalieri) ha una formazione; un tocco sul gruppo già scelto passa alla successiva (larga → serrata → cuneo → larga; i tiratori saltano il cuneo). Dopo un cambio gli uomini si riordinano per tre secondi (30 istanti, `C.FM.ATTESA`).

| Formazione | Parte così | Effetto |
|---|---|---|
| Serrata | fanti | file strette, passo all'80%, difesa +20%; i tiri contro di lei a metà se ha lo scudo, +15% se non lo ha; la carica contro di lei vale metà; contro fanti con la picca la carica è annullata e chi carica si ferisce |
| Larga | tiratori, cavalieri | uomini distanziati; i tiri contro di lei fanno metà danno; la carica contro di lei vale una volta e mezza |
| Cuneo | (a scelta; non i tiratori) | punta verso il nemico; attacco +15%, carica +25%; colpita sul fianco o alle spalle la difesa scende del 25% |

## Riferimento visivo
Stile nostro: diorama a facce piatte reso a pixel d'arte (telecamera ortografica a tre quarti, contorni, luce a bande, retino),
palette calda di giorno e blu di luna la notte; fasce e pannelli nello stile unico legno e ottone. Niente figure o icone copiate.

## Numeri
Truppe, merci, equipaggiamento e compagni: `VDAT` (`motori/28j-ven-dati.js`; gradimento in `VDAT.GRAD`, memoria dei signori in `VDAT.SIG`). Mondo: `VEN.P` (`28k`). Campo: `VCAM.C` (`28l`).

## L'assedio (V5b)
Tre modi di entrare in una città o in un castello nemico:
- **Scale**: pronte dopo le ore di preparativi (10, meno col comando). Quattro scale; ognuna regge un uomo alla volta, che sale in 4 secondi senza potersi difendere (i tiri contro di lui sono più facili) e arrivato in cima resta senza fiato 10 secondi. I cavalieri non salgono; il capitano a cavallo sale a piedi.
- **Breccia**: «Aspetta» rimanda l'assalto finché le mura cedono, 72 ore dopo l'inizio dell'assedio. Intanto paghe e viveri corrono e i signori del regno possono venire in soccorso.
- **Porta**: «Costruisci l'ariete» (150 monete, pronto 6 ore dopo). In battaglia fino a 6 fanti spingono il portone (60 colpi in tutto); senza ariete la porta non cede mai.
- Chi difende sta sul camminamento (più in alto: tira più lontano e colpisce meglio), presidia le scale dove si preme di più e non va in rotta. Attraverso il muro non si combatte corpo a corpo.

## I comandanti e il loro rango (passo 12)
- Ogni comandante ha un rango, da sprovveduto a leggendario, che si legge prima dello scontro.
- Un signore che vince si fa un nome e sale di rango; in prigionia lo perde poco a poco.
- Più il rango del nemico è alto, più è duro da battere e più valgono fama, esperienza e bottino della vittoria.
- Un comandante di rango alto, se lo abbatti, ha molte più probabilità di restare tuo prigioniero.
- Il rango del tuo capitano dipende dalla sua abilità di comando.

## Il consiglio di guerra (passo 21)
#### Come pensa il nemico

- Ogni comandante nemico ha un **rango**, da sprovveduto a leggendario. Chi ha poca esperienza lancia tutti all'attacco; col rango impara ad avanzare in linea, a tenere il terreno, ad aspettare che sia il nemico a venire sotto le frecce, a far tirare gli arcieri da fermi e a scegliere la manovra giusta per ogni reparto.
- Più alto è il rango, più spesso il nemico ci ripensa e meno sbaglia: un comandante leggendario cambia piano appena il campo cambia, uno sprovveduto resta fermo sul suo errore.
- Sotto le frecce un comandante accorto apre le file e aspetta solo se i suoi tiratori reggono lo scambio (più arcieri dei tuoi e il nemico a tiro); altrimenti manda i fanti addosso ai tuoi tiratori.
- Ogni regno ha la sua **dottrina**: gli arcieri di Altavento restano a distanza e non si fanno prendere in mischia, la Marca di Ferropietra si chiude in blocchi di picche, i predoni si buttano avanti senza pensarci.
- Il **carattere** del signore pesa sulle scelte: il prode carica, il prudente aspetta e si ritira prima, il crudele si accanisce sui più deboli, l'avido insegue chi fugge.
- Il tuo capitano conta anche quando la battaglia si risolve da sola: la sua abilità di comando decide il rango dei tuoi.

## Le manovre dei comandanti (passo 25)
#### I comandanti esperti

- Un comandante di buon rango legge il campo: porta i tiratori su un'altura o in un bosco della sua metà, si schiera guardando come ti sei schierato e mette le picche davanti alla tua cavalleria.
- Tiene dietro una parte dell'esercito e la fa entrare quando hai speso la tua ultima ondata o quando un tuo reparto cede, dall'ingresso più vicino. Dà il cambio ai reparti stanchi con quelli freschi e non si butta in acqua o nel bosco sotto le frecce.
- I maestri tendono trappole: un reparto debole avanza da solo per attirarti, la cavalleria nascosta ti prende di fianco appena lo insegui; i fanti ti inchiodano mentre i cavalieri girano alle tue spalle; se il tuo capitano resta scoperto, i cavalieri gli danno la caccia.
- Quando la battaglia è persa, un comandante prudente non aspetta la rotta: ripiega in ordine, coperto da un reparto in serrata, e salva più uomini.
- Impari a leggerli dai segni in campo («si spostano verso l'altura», «la loro cavalleria gira a sinistra»); le trappole non danno nessun segno.

## Il maestro di guerra (passo 30)
- I grandi comandanti (re, marescialli, la Volpe nelle ultime tappe) ricordano come li hai combattuti: cavalleria per prima, tiratori sull'altura, ondate dal fianco o mandate presto, capitano in prima fila.
- Se un'abitudine torna in almeno metà delle battaglie contro di loro, si preparano: picche nascoste dietro un'esca, linea fuori tiro dall'altura, un reparto di guardia sul fianco, la caccia al tuo capitano, la riserva tenuta per la tua ondata stanca.
- Dopo la battaglia la cronaca ti dice quale contromossa ti hanno giocato: cambiare abitudini è il modo di sorprenderli.
- Un maestro di guerra inganna anche: un suo reparto può fingere la rotta per tirarti giù da un'altura, quando si schiera per primo ti mostra solo una parte delle truppe (i cavalieri restano nascosti nelle ondate), e le sue ondate arrivano quando i tuoi sono stanchi.

## Prima della battaglia (passo 32)
**Prima della battaglia.** Quanto vedi del nemico dipende dagli esploratori: se la tua Esplorazione supera il suo grado di comando vedi tutto (uomini per tipo, modo di combattere, rinforzi); se lo eguaglia, i numeri sono a spanne; se è minore, sai solo «circa tanti uomini».
- **Il campo**: se esplori abbastanza, o se ti attaccano mentre sei fermo, puoi scegliere tra due terreni.
- **Alba**: aspetti il mattino; un nemico poco accorto può andarsene, altra gente può unirsi a lui.
- **Notte**: attacchi nel buio, i tiratori vedono meno per tutti; i nemici meno accorti sono in disordine.
- **Imboscata** (bosco o colline, nemico in arrivo, esplori più di lui): lo prendi in colonna e impreparato. **Pali**: un'ora e dieci razioni, i cavalli rallentano e la carica non riesce.
- **Retroguardia**: lasci un reparto a coprire la fuga; se perde, non torna. Dopo una lunga marcia si arriva stanchi, e i comandanti accorti scelgono loro il momento.

## Sul televisore (V7)
- La TV si unisce alla stanza come per gli altri giochi e **guarda soltanto**: mappa larga con la compagnia al centro, in alto nome della compagnia, giorno e ora, monete, uomini, viveri e codice della stanza; a destra la cronaca (ultime sei righe); in basso i capitani con il livello. In battaglia mostra il campo intero con la barra delle forze e il tempo.
- I telefoni non trovano la TV da soli: un capitano la accende dal menu con «Mappa sulla TV». Da quel momento sui telefoni la mappa si stringe in alto e sotto compaiono tasti grandi (gli stessi della barra, più «Luogo»); in battaglia gruppi e ordini sulla stessa griglia. Si spegne dallo stesso interruttore; non entra nel salvataggio.
- Musica e suoni sono della Ventura: quattro temi (viaggio, notte e accampamento, città, battaglia) e due motivi (vittoria, sconfitta). Con la TV accesa musica e suoni del mondo e della battaglia escono solo dalla TV; ogni telefono suona solo ciò che fa lui (ordini, acquisti, reclute…). Senza TV ogni telefono suona tutto.

