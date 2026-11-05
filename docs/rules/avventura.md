# Cantari di Ventura (id `avventura`)
**1–4 eroi (un telefono; poi TV + telefoni)** · **capitolo da 3–5 sessioni di circa un'ora, salvataggio tra una e l'altra** · **gioco di ruolo a campagne, cooperativo** · **Marchio**: libero. Nome, mondo, mostri, oggetti e testi sono nostri; le meccaniche (dadi, classi di armatura, vantaggio…) sono regole di genere, non protette.

Piani e contratti: `docs/AVVENTURA.md` (piano), `AVVENTURA-A4.md` (battaglia), `-A6.md` (mappa), `-A7.md`/`-A8.md` (racconto e Capitolo 1), `-A9.md` (sessione, vite, rientro), `-A10.md` (musica, suoni, regole, tutorial, incarichi), `AVVENTURA-B.md` (piano B: tempo reale, mondo libero, resa pixel; regole nella sezione «Tempo reale»). Il testo che si legge nell'app è `RULES.avventura` in `app/07d-regole.js`.

## Preparazione
- Si parte dalla pagina **Avventura** (barra in basso). Gli eroi stanno sull'account (nome, razza, classe, livello, oggetti); si portano in campagna fino a **4 posti**. I posti liberi li prendono i **compagni** della storia, reclutati con le scelte nei dialoghi.
- Tre posti di salvataggio per account. Una sessione si conclude dal pulsante «Concludi la sessione» (in mappa o in città): esperienza, oro e oggetti tornano agli eroi **a tappe** (al massimo 800 XP e 1000 monete per scrittura, una scrittura ogni minuto circa), mai due volte, mai per i compagni.
- La **campagna libera** è la sola mappa del mondo, senza storia: i premi restano nella campagna.

## Turno sulla mappa
*Piano B: il movimento diventa continuo e a velocità fissa, con segnalini e compagnie; vedi «Tempo reale» e «Compagnie e rinforzi».*
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
*Piano B: la battaglia passa dai turni agli istanti, con pausa e atteggiamenti; vedi «Tempo reale», «Atteggiamenti» e «Dai turni ai secondi».*
- Griglia a esagoni di 9 × 11. Ostacoli bassi danno **copertura** (mezza +2 CA, tre quarti +5), muri e ostacoli alti bloccano passaggio e vista; chi sta più in alto ha **vantaggio**. **Tirare con un nemico adiacente** dà svantaggio.
- **Iniziativa**: d20 più il bonus, ordine fisso per tutta la battaglia. A inizio turno si tira il **movimento** (spezzabile prima e dopo l'azione); poi **1 azione** e **1 azione bonus**; la **reazione** si ricarica all'inizio del proprio turno.
- **Attacco**: d20 più il bonus contro la **CA**; colpito, si tira il danno; un 20 naturale è un **colpo perfetto** (i dadi del danno raddoppiano). Ci sono nove **tipi di danno** (taglio, perforante, contundente, fuoco, gelo, fulmine, necrotico, radioso, veleno) e mostri con **resistenze**, **vulnerabilità** e **immunità**.
- **Poteri** di classe e di razza, **talenti**, **oggetti** e **stati** (in fiamme, avvelenato, stordito…). Le **reazioni** difensive (scudo, parata, ritiro) si chiedono quando servono; l'attacco di opportunità parte da solo.
- Chi è **a terra** non si attacca e conta come fuori. **Fuga**: dall'uscita sul bordo, oppure di gruppo (prova: basta che riesca metà). Un mostro ferito a ≤ 25% può **arrendersi**. Oltre 40 giri la battaglia finisce in stallo.

## Difficoltà (A13)
Si sceglie alla partenza e vive nello stato (`camp.diff`); i salvataggi vecchi giocano a Normale. Quattro leve (tabella `ADIF`, `motori/27ha-avv-difficolta.js`):
| | Racconto | Normale | Eroica |
|---|---|---|---|
| Budget dei gruppi nemici (sul mondo, nei sotterranei e negli scontri del racconto) | ×0,6 | ×0,75 | ×0,85 |
| Vite | 6 | 4 | 3 |
| Perdizione per alba | 2 | 3 | 4 |
| Esperienza degli scontri | ×1,25 | ×1 | ×1 |
| Sconfitta: PF al risveglio · oro perso · perdizione | 75% · ¼ · +5 | 50% · ½ · +10 | 50% · ½ · +10 |
Misure con il bot (compagnia guerriero+mago+chierico+ladro): Racconto ~90% delle campagne finite, Normale ~55–70%, Eroica ~25%. Dettagli e per composizione: `docs/AVVENTURA-A13.md`.

## Vite di gruppo, fine
- La compagnia ha **4 vite** in comune a Normale (Racconto 6, Eroica 3; vedi «Difficoltà»). **Sconfitta** (tutti gli eroi a terra o fuggiti): −1 vita, risveglio nell'**ultima città** visitata, tutti a metà PF, **metà dell'oro perso**, **perdizione +10**. **Fuga**: nessuna vita persa, perdizione +1.
- A **zero vite** la campagna è persa: gli eroi dell'account restano come sono e l'esperienza maturata torna comunque; niente monete in premio né compagni sbloccati.
- Il capitolo si vince portando a termine la sua storia («La Corona Spezzata»: il re è scomparso e i pezzi della corona sono sparsi in tre regioni); il diario dice sempre dove andare. La campagna libera ha una missione sola: ascoltare chi comanda in città, ripulire l'antro, abbattere la Torre dei Corvi.

## Compagni, incarichi, tutorial
- I **compagni** hanno carattere e **approvazione**: reagiscono alle scelte, a volte chiedono di parlare, e si possono lasciare ad aspettare in un luogo.
- La **bacheca** delle città e dei villaggi offre **incarichi generati** (consegne, recuperi, ripuliture) con ricompensa e scadenza; al massimo 2 aperti per volta e uno nuovo al giorno per luogo.
- Nella prima sessione appaiono **suggerimenti al tocco**, uno alla volta: si chiudono con «Capito» e non tornano. Si spengono o si rivedono dalla pagina Avventura.

## In compagnia (A11)
*Piano B: la TV simula e i telefoni mandano ordini; vedi «TV e telefoni nel tempo reale».*
- Da «Avventura → In compagnia» il cantare si apre nella stanza (1–4 giocatori, `R.mode='rt'`); sulla TV (`?tv=CODICE`, sola visione) si vedono mappa, scontri e dialoghi in grande.
- Un posto = un eroe: prima della prima mossa ognuno porta uno dei suoi eroi dal profilo (senza profilo, un eroe di prova). Chi ospita (il primo posto presente) guida i **compagni** e le azioni di gruppo; ognuno comanda il proprio eroe.
- Le scelte dei dialoghi si **votano** (maggioranza; a parità vale chi ospita, che può chiudere il voto); «continua» lo preme chiunque.
- Scontri: muove chi guida l'eroe di turno, il resto lo gioca l'IA; reazioni automatiche. Chi esce lascia il posto (lo guida chi ospita), chi rientra riprende il suo eroe.
- Rientro: ciascuno riscuote **solo il proprio eroe** sul proprio profilo (stesse tappe e limiti di prima); la campagna condivisa si salva sul profilo di chi ospita e si può riprendere in compagnia.

## Tempo reale (piano B)
*Stato: regole fissate in B0 (`docs/AVVENTURA-B.md`). Da B5 le **battaglie della campagna in solitario** (del racconto e del mondo) si giocano così; la battaglia di prova e la co-op con la TV restano a turni fino a B10, la mappa del mondo fino a B8. Quando uno step entra, la sua parte sostituisce la sezione a turni.*
- La battaglia **scorre da sola**. Il tempo si conta in **istanti** di un decimo di secondo; la grafica li mostra fluidi. Si può **mettere in pausa** quando si vuole.
- **Il movimento non si tira più**, né in battaglia né sulla mappa: ci si muove a velocità fissa, **mov ÷ 3 caselle al secondo** (mov 6 = 2 caselle al secondo).
- Il **d20** resta dentro ogni colpo e ogni prova: parte il colpo, si tira d20 più il bonus contro la CA, con vantaggio e svantaggio come oggi. A schermo si vede il colpo o la scritta «Mancato», non il dado; il registro della battaglia conserva i tiri.
- In battaglia ogni creatura occupa sempre un **esagono** e passa al successivo alla propria velocità; linea di vista, copertura, altezza, attacchi di opportunità e percorsi valgono come prima. La griglia si mostra solo in pausa o quando si dà un ordine di movimento.
- **Pausa**: si possono dare tutti gli ordini, che partono alla ripresa. Velocità ×1 o ×2.
- **Ordini sul telefono** (B5): tocca un eroe per sceglierlo (anello sotto i piedi), un nemico per attaccarlo, un esagono per andarci, un eroe a terra per rialzarlo. I tasti rotondi in basso usano le abilità dell'eroe scelto: quelle su di sé partono subito, quelle a bersaglio chiedono il bersaglio, quelle ad area mostrano l'area al primo tocco e partono al secondo. «Tutte» elenca ogni abilità con «Uso automatico». L'atteggiamento si cambia dal tasto con il suo nome. Le **aree rosse** a terra sono poteri nemici in arrivo: chi ne esce prima della fine del lancio non viene colpito.
- **Pausa automatica**, ognuna attivabile dalle impostazioni: inizio battaglia, eroe sotto un quarto dei PF, eroe senza bersaglio, nemico nuovo in campo, potere pronto di un capo.
- **Mondo**: l'orologio avanza solo mentre qualcuno cammina o riposa; un giorno di gioco dura circa 3 minuti di cammino. Perdizione all'alba, notte e luoghi restano come prima.

### Dai turni ai secondi
| Prima (a turni) | Dopo (in tempo reale) | Regola |
| --- | --- | --- |
| 1 giro | 6 secondi | Durate degli stati e Concentrazione: t giri → 6 t secondi |
| Attacco nel turno | Ritmo dell'arma | Leggera 1,2 s, media 1,6 s, pesante 2,2 s tra un colpo e l'altro |
| Potere «azione» | Lancio + ricarica | Lancio 0,6–1,5 s (interrompibile), poi ricarica dalla carica |
| Potere «bonus» | Istantaneo | Ricarica breve, non interrompe l'attacco |
| Potere «reazione» | Automatico | Scatta da solo alla sua condizione, poi ricarica |
| Cariche «turno» | Ricarica 6 s | Le cariche scontro, breve e lungo restano identiche |
| Movimento tirato | Velocità fissa | mov ÷ 3 caselle al secondo (mov 6 → 2 caselle/s) |
| Iniziativa | Ritardo d'ingresso | All'inizio ognuno parte dopo 0–1 s secondo l'iniziativa |

## Atteggiamenti
- Ogni eroe ha un **atteggiamento** scelto dal giocatore: **Assalto**, **Difesa**, **Supporto**, **Tieni la posizione**. Con l'atteggiamento l'eroe decide da solo bersaglio, distanza e uso dei poteri a volontà.
- Gli altri poteri (a cariche) li usa da solo solo se il giocatore attiva **«Uso automatico»** su quel tasto; altrimenti aspetta il tocco.
- Un ordine diretto vince sempre sull'atteggiamento: tocca un eroe per sceglierlo, tocca un nemico per attaccarlo, tocca una casella per andarci, tieni premuto un eroe e trascina per la formazione. In basso, la barra con 4–6 abilità dell'eroe scelto, ognuna con anello di ricarica.
- I **nemici** seguono il comportamento del bestiario e decidono ogni mezzo secondo. I **capi** annunciano i poteri: un'area rossa a terra si riempie prima del colpo.

## Compagnie e rinforzi
- Sulla mappa si muovono **segnalini**: un eroe da solo oppure una **compagnia** di 2–4 eroi. La compagnia va alla velocità del più lento e si comanda come un segnalino solo; in solitario si comanda un segnalino alla volta, gli altri stanno fermi o seguono l'ultimo ordine.
- **Unirsi**: due segnalini vicini (entro 1 casella) premono «Unisciti». **Staccarsi**: in qualsiasi momento, dalla scheda della compagnia, un eroe prende la sua strada e diventa subito un segnalino a sé.
- I **gruppi nemici** inseguono chi è più debole e scappano da chi è più forte.
- **Contatto**: chi tocca un gruppo nemico entra in battaglia. Gli altri segnalini entro 4 caselle arrivano come **rinforzi**, dal bordo del campo, dopo un ritardo proporzionale alla distanza.

## TV e telefoni nel tempo reale
- In solitario il telefono simula e disegna tutto. Con la TV è **la TV a simulare e a disegnare**; ogni telefono diventa un controller con la scheda del proprio eroe, la barra delle abilità, la minimappa e la Pausa.
- **Pausa condivisa**: la può chiedere chiunque; riprende chi l'ha chiesta oppure la TV dopo 20 secondi.
- Chi entra a metà vede subito lo stato. Chi esce lascia il suo eroe all'IA, con l'ultimo atteggiamento. Sulla mappa ognuno muove il suo segnalino e le compagnie si formano tra telefoni.

## Glossario del tempo reale
Le parole di sempre (PF, CA, Concentrazione, Perdizione, vite, vantaggio…) restano come sono; queste sono le nuove.
- **Istante**: un decimo di secondo, l'unità di tempo della logica di gioco.
- **Tempo reale**: la battaglia (e il mondo, quando qualcuno si muove) avanza da sola in istanti, senza turni.
- **Pausa**: il tempo si ferma e si possono dare ordini; **pausa automatica** quando succede qualcosa di importante (inizio battaglia, eroe in pericolo, nemico nuovo, potere di un capo).
- **Ritmo**: il tempo tra un colpo e l'altro, deciso dall'arma (leggera 1,2 s, media 1,6 s, pesante 2,2 s).
- **Ricarica**: il tempo che un potere o una carica impiega a tornare disponibile; si legge sull'anello attorno al tasto dell'abilità.
- **Lancio**: la preparazione di un potere (0,6–1,5 s); si può interrompere, poi parte la ricarica.
- **Atteggiamento**: il comportamento dell'eroe quando il giocatore non gli dà ordini (Assalto, Difesa, Supporto, Tieni la posizione).
- **Uso automatico**: permette all'eroe di usare da solo un potere a cariche.
- **Segnalino**: la figura che rappresenta sulla mappa un eroe o una compagnia.
- **Compagnia**: da 2 a 4 eroi che viaggiano come un segnalino solo; si forma con «Unisciti», si divide con «Staccati».
- **Contatto**: il momento in cui un segnalino tocca un gruppo nemico e inizia la battaglia.
- **Rinforzo**: un segnalino amico, entro 4 caselle dal contatto, che arriva in battaglia dal bordo del campo dopo un ritardo.

## Grafica 3D (A12)
- Mappa e battaglie hanno una vista 3D low-poly (rilievi, boschi, edifici, miniature, fuoco/veleno/ghiaccio/acqua vivi, giorno/notte, perdizione) sotto l'SVG di sempre: stessi tocchi, stesse etichette. Impostazione «Grafica 3D» nella pagina Avventura: Automatica (prova i fps e torna alla grafica piatta se il telefono è lento), Sempre, No. Con «riduci animazioni» la scena resta ferma. Dettagli tecnici in `docs/AVVENTURA-A12.md`.

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
