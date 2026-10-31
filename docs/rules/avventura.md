# Cantari di Ventura (id `avventura`)
**1–4 eroi (un telefono; poi TV + telefoni)** · **capitolo da 3–5 sessioni di circa un'ora, salvataggio tra una e l'altra** · **gioco di ruolo a campagne, cooperativo** · **Marchio**: libero. Nome, mondo, mostri, oggetti e testi sono nostri; le meccaniche (dadi, classi di armatura, vantaggio…) sono regole di genere, non protette.

Piani e contratti: `docs/AVVENTURA.md` (piano), `AVVENTURA-A4.md` (battaglia), `-A6.md` (mappa), `-A7.md`/`-A8.md` (racconto e Capitolo 1), `-A9.md` (sessione, vite, rientro), `-A10.md` (musica, suoni, regole, tutorial, incarichi). Il testo che si legge nell'app è `RULES.avventura` in `app/07d-regole.js`.

## Preparazione
- Si parte dalla pagina **Avventura** (barra in basso). Gli eroi stanno sull'account (nome, razza, classe, livello, oggetti); si portano in campagna fino a **4 posti**. I posti liberi li prendono i **compagni** della storia, reclutati con le scelte nei dialoghi.
- Tre posti di salvataggio per account. Una sessione si conclude dal pulsante «Concludi la sessione» (in mappa o in città): esperienza, oro e oggetti tornano agli eroi **a tappe** (al massimo 800 XP e 1000 monete per scrittura, una scrittura ogni minuto circa), mai due volte, mai per i compagni.
- La **campagna libera** è la sola mappa del mondo, senza storia: i premi restano nella campagna.

## Turno sulla mappa
- La mappa è a **esagoni** (raggio 9) con nebbia. Un **giorno** dura **8 giri**: 5 di luce e 3 di notte.
- A ogni giro ogni eroe **tira il movimento**: un d4 più la velocità, meno 2, almeno 3. Con 1 punto di **Concentrazione** tira due dadi e tiene il migliore. Poi si tocca la destinazione (anteprima del cammino e del costo) e un secondo tocco conferma. Strada e pianura costano poco, boschi, colli e paludi di più; se non basta si avanza fin dove si arriva.
- Gli eroi possono **separarsi**: ognuno ha il suo segnalino. Chi è nella stessa cella può muoversi «Insieme».
- A fine giro si muovono i **gruppi di nemici** (si vedono entro 3 esagoni, anche nella nebbia: vagano, danno la caccia, non entrano nei luoghi sicuri; di notte +1 livello) e i mercanti vaganti. Un gruppo che raggiunge un eroe apre la **battaglia** con gli eroi entro 3 esagoni (0–1 subito, gli altri dopo qualche giro).
- Sulle celle senza luogo si possono incontrare **eventi di strada** (un tiro, una scelta); sono più frequenti di notte e con la perdizione alta.

## Giorno, notte, perdizione, riposo
- La **perdizione** parte da 0 e sale di **3 a ogni alba**. A **25, 50 e 75** il mondo peggiora (+1 livello ai mostri e un gruppo in più, villaggi assediati, strade sbarrate). A **100** la campagna è persa.
- Si abbassa con i **santuari** (preghiera: −3, con 20 monete −8, poi tace 3 giorni), le **taglie** e i **covi** ripuliti.
- **Riposo breve**: 20% dei PF, 2 al giorno, mai entro 2 esagoni da un nemico. **Riposo lungo** (fa passare al giorno dopo): in locanda (8 monete a testa) oppure all'accampamento (una razione a testa, con possibile imboscata).

## Luoghi e sotterranei
- **Città**: locanda, guaritore, tempio, bottega, bacheca delle taglie e degli incarichi. **Villaggio**: locanda, guaritore, bottega con merce comune. **Santuario**, **accampamento**, **mercanti vaganti**. Un villaggio assediato chiude i servizi finché il gruppo di guardia non è sconfitto.
- **Sotterranei**: antro (4 stanze), rovine (3), torre (6). Ogni stanza costa un giro: battaglia, trappola con prova, evento a scelta, forziere, riposo; l'ultima è il capo. Il **capo vero** compare solo se il livello medio è almeno quello del capo più uno: sotto, arrivano i suoi in versione «difficile».
- L'**oro** e le **razioni** sono comuni a tutta la compagnia; si rivende a metà prezzo.

## Prove
- Una prova è un **d20** più il modificatore dell'abilità (più la competenza, se c'è) contro una **CD**. Il totale deve raggiungere la CD. Un **20 naturale** riesce sempre, un **1 naturale** fallisce sempre.
- **Vantaggio**: due dadi, vale il migliore. **Svantaggio**: vale il peggiore. La Concentrazione dà vantaggio a un tiro oppure ritira l'ultimo dado.
- Nei dialoghi le scelte con prova mostrano `[Abilità %]`: la probabilità di riuscire.

## Battaglia
- Griglia a esagoni di 9 × 11. Ostacoli bassi danno **copertura** (mezza +2 CA, tre quarti +5), muri e ostacoli alti bloccano passaggio e vista; chi sta più in alto ha **vantaggio**. **Tirare con un nemico adiacente** dà svantaggio.
- **Iniziativa**: d20 più il bonus, ordine fisso per tutta la battaglia. A inizio turno si tira il **movimento** (spezzabile prima e dopo l'azione); poi **1 azione** e **1 azione bonus**; la **reazione** si ricarica all'inizio del proprio turno.
- **Attacco**: d20 più il bonus contro la **CA**; colpito, si tira il danno; un 20 naturale è un **colpo perfetto** (i dadi del danno raddoppiano). Ci sono nove **tipi di danno** (taglio, perforante, contundente, fuoco, gelo, fulmine, necrotico, radioso, veleno) e mostri con **resistenze**, **vulnerabilità** e **immunità**.
- **Poteri** di classe e di razza, **talenti**, **oggetti** e **stati** (in fiamme, avvelenato, stordito…). Le **reazioni** difensive (scudo, parata, ritiro) si chiedono quando servono; l'attacco di opportunità parte da solo.
- Chi è **a terra** non si attacca e conta come fuori. **Fuga**: dall'uscita sul bordo, oppure di gruppo (prova: basta che riesca metà). Un mostro ferito a ≤ 25% può **arrendersi**. Oltre 40 giri la battaglia finisce in stallo.

## Vite di gruppo, fine
- La compagnia ha **3 vite** in comune. **Sconfitta** (tutti gli eroi a terra o fuggiti): −1 vita, risveglio nell'**ultima città** visitata, tutti a metà PF, **metà dell'oro perso**, **perdizione +10**. **Fuga**: nessuna vita persa, perdizione +1.
- A **zero vite** la campagna è persa: gli eroi dell'account restano come sono e l'esperienza maturata torna comunque; niente monete in premio né compagni sbloccati.
- Il capitolo si vince portando a termine la sua storia («La Corona Spezzata»: il re è scomparso e i pezzi della corona sono sparsi in tre regioni); il diario dice sempre dove andare. La campagna libera ha una missione sola: ascoltare chi comanda in città, ripulire l'antro, abbattere la Torre dei Corvi.

## Compagni, incarichi, tutorial
- I **compagni** hanno carattere e **approvazione**: reagiscono alle scelte, a volte chiedono di parlare, e si possono lasciare ad aspettare in un luogo.
- La **bacheca** delle città e dei villaggi offre **incarichi generati** (consegne, recuperi, ripuliture) con ricompensa e scadenza; al massimo 2 aperti per volta e uno nuovo al giorno per luogo.
- Nella prima sessione appaiono **suggerimenti al tocco**, uno alla volta: si chiudono con «Capito» e non tornano. Si spengono o si rivedono dalla pagina Avventura.

## Riferimento visivo (com'è il genere, da riprodurre nello stile; nessuna immagine copiata)
- **Mappa del mondo**: esagoni piatti con terreni dai colori pieni e contorno scuro (prateria verde, bosco verde cupo, colli ocra, palude verde-grigio, montagna grigio-blu), nebbia che copre il non esplorato, strade chiare; segnalini degli eroi con ritratto tondo e anello d'ottone. Riferimenti per la lettura: i tavoli di viaggio a esagoni dei giochi di esplorazione cooperativi (percorsi, nebbia, pericolo che avanza) e le mappe di campagna dei giochi di ruolo da tavolo.
- **Battaglia**: griglia a esagoni vista dall'alto, altezza con rialzi più chiari, ostacoli come sagome a rilievo; sagome dei mostri disegnate da noi, nello stile piatto della mappa. Ordine di iniziativa in alto, azioni in una barra in basso (Attacca, Poteri, Oggetti, Altro), numeri di danno che salgono dal segnalino e colorati per tipo.
- **Dialoghi**: sipario a tutta pagina, ritratto di chi parla, testo in riquadro scuro con bordo d'ottone, scelte a pulsanti con la probabilità tra parentesi quadre.
- **Palette e materiali**: legno scuro e ottone (vedi `docs/STYLE.md`), tinte calde di candela per la locanda, blu freddo per la notte; icone SVG, mai emoji. Font e rifiniture come il resto della Taverna.
- **Da noi** (`app/24h*.js`, `css/39*.css`): tutto disegnato da zero; l'unico rimando alle fonti è il genere, non un titolo.

## Casi limite
- Salvataggio più nuovo della versione dell'app: rifiutato con messaggio, non si perde nulla. Perdizione 100 chiude la campagna (non è una sconfitta recuperabile).
- Una scena interrotta da una sconfitta si può rifare dal luogo (le bandiere già messe restano).
- Con «riduci animazioni» o «Salta» restano il registro e i suoni essenziali.

## Test del motore
`tests/test_avv_*.js` (dadi, oggetti, bottino, stati, poteri, bestiario, griglia, arene, scontro, IA, cronaca, comandi, mondo, luoghi, mostri, racconto, eventi, compagni, Corona), `test_campagna.js` (bot: vince la compagnia ben guidata, perde quella casuale), `test_avv_orchestratore.js`, `test_avv_rientro.js`, `test_avv_audio.js`, `test_avv_tutorial.js`; scenari browser `avv_*` in `tools/test-browser/`.

## Fonti
Regole nostre, di genere. Nessun testo, nome o illustrazione copiati; i riferimenti del «Riferimento visivo» sono categorie di giochi, non opere.
