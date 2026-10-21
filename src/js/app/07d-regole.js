/* ---- testi delle regole in-game: RULES[id] (una scheda per riga; la fonte è docs/rules/<gioco>.md) ---- */
const RULES={
 discesa:`<p>Solitario a dadi ispirato a <i>One Card Dungeon</i>: scendi <b>12 livelli</b> e sconfiggi tutti i mostri di ognuno. Parti con Velocità 1, Attacco 1, Difesa 1, Gittata 2 e 6 di salute.</p>
<ul><li><b>Energia</b>: tiri 3 dadi e ne assegni uno a Velocità, uno ad Attacco e uno a Difesa; valgono per questo turno (la Gittata non prende dadi).</li>
<li><b>Il tuo turno</b>: spendi Velocità per muoverti (2 in orizzontale o verticale, 3 in diagonale) e Attacco per colpire: ogni volta che spendi punti pari alla Difesa del mostro gli togli 1 salute. Per colpire serve che il mostro sia entro la tua Gittata (misurata come il movimento) e in linea di vista (una linea da un angolo all’altro che non attraversa muri o altri mostri).</li>
<li><b>Mostri</b>: si muovono uno alla volta, dal più vicino, cercando la casella più lontana da cui ti vedono restando in gittata; se non ce n’è, si avvicinano. Poi sommano l’Attacco di chi ti colpisce: perdi salute pari a quel totale diviso la tua Difesa, per difetto.</li>
<li><b>Fine livello</b>: scegli +1 a una caratteristica (massimo 6) oppure la cura completa. Si perde a 0 salute.</li>
<li><b>Classi</b>: ognuna ha un potere (di solito una volta per livello).</li>
<li><b>Espansioni</b>: <i>Porto delle Ombre</i> (acqua: i mostri in acqua guadagnano i bonus indicati; classe Corsaro), <i>Vetta Eterna</i> (bufera: se ci stai sopra hai −1 ad Attacco e Difesa base; classe Sherpa), <i>Soglia Infernale</i> (lava: se finisci il turno sopra perdi 1 salute; boss finale; classe Esorcista; Pietra della Perdizione), <i>Lo Scettro Risorge</i> (classi Monaco, Chierico e Assassino, forzieri, boss Scettrarca). Gli <b>oggetti</b> si pescano 3 a inizio partita e si usano una volta.</li></ul>`,

 valle:`<p>Ognuno costruisce la propria <b>valle</b> con tessere esagonali di habitat (🏔️ montagna, 🌲 foresta, 🌾 prateria, 🪷 palude, 🌊 fiume) e la popola di animali. Si giocano <b>20 turni a testa</b>, poi si contano i punti.</p>
<ul><li><b>Turno</b>: prendi una delle 4 coppie <b>tessera + animale</b> del sentiero. Posa la tessera accanto alla tua valle (puoi ruotarla), poi metti l’animale su una tua tessera libera che lo mostra, oppure lascialo andare.</li>
<li><b>Pigne 🌰</b>: le tessere col cerchio tratteggiato ospitano un solo animale; metterlo lì ti dà una pigna. Una pigna permette di prendere tessera e animale da coppie diverse, oppure di cambiare gli animali del sentiero che vuoi. Ogni pigna rimasta vale 1 punto.</li>
<li><b>Sovrappopolazione</b>: 4 animali uguali sul sentiero vengono rimescolati da soli; con 3 uguali puoi rimescolarli tu, una volta per turno.</li>
<li><b>Animali</b>: 🐻 coppie di orsi isolate (4/11/19/27); 🦌 alci in fila dritta (2/5/9/13 per lunghezza 1–4); 🐟 corsi di salmoni senza bivi (2/4/7/11/15/20/26); 🦅 falchi senza falchi vicini (2/5/8/11/14/18/22/26); 🦊 ogni volpe vale 1 per ogni specie diversa accanto.</li>
<li><b>Corridoi</b>: per ogni habitat conta il gruppo più grande di tessere collegate da lati dello stesso habitat (1 punto a tessera). Bonus al corridoio più lungo: in 2 giocatori +2 (pari: +1 a testa); in 3–4 +3 al primo e +1 al secondo; in solitario +2 se arriva a 7.</li>
<li><b>Fine</b>: vince chi ha più punti; in caso di pareggio chi ha più pigne.</li></ul>`,

 perudo:`<p>Gioco di bluff con i dadi (tradizione peruviana). Ognuno ha un <b>bicchiere con 5 dadi</b> che solo lui vede. Vince l’ultimo giocatore che ha ancora dei dadi.</p>
<ul><li><b>Dichiarare:</b> a turno si dichiara quanti dadi di un certo valore ci sono <b>in tutto il tavolo</b>, dadi di tutti compresi (es. “4 × Tre”). Chi apre sceglie liberamente.</li>
<li><b>Rilanciare:</b> si dichiara più dadi dello stesso valore, oppure lo stesso numero di dadi ma un valore più alto.</li>
<li><b>Assi jolly:</b> gli <b>assi valgono per qualsiasi valore</b>. Per dichiarare gli assi basta la <b>metà</b> dei dadi dell’ultima dichiarazione (per eccesso); per tornare dagli assi a un altro valore serve il <b>doppio più uno</b>.</li>
<li><b>Dudo!</b> Se non credi alla dichiarazione precedente, sfidala: tutti scoprono i dadi. Se i dadi trovati sono <b>almeno</b> quelli dichiarati, perde un dado lo sfidante; altrimenti lo perde chi aveva dichiarato.</li>
<li><b>Calza:</b> pensi che la dichiarazione sia <b>esatta</b>? Se hai ragione guadagni un dado (mai più di 5), se sbagli ne perdi uno. Si può dire solo finché in tavola c’è almeno la metà dei dadi iniziali.</li>
<li><b>Palifico:</b> quando un giocatore resta con <b>un solo dado</b> (la prima volta), nel round dopo apre lui: sceglie il valore, <b>gli assi non sono jolly</b>, non si può cambiare valore (si alza solo la quantità) e non si calza.</li>
<li>Chi perde un dado apre il round successivo; chi resta senza dadi è eliminato.</li></ul>`,
 kittens:`<p>Gioco di carte e di fortuna per 2–10: <b>sopravvive solo chi non pesca il Micio Bomba</b> (o riesce a disinnescarlo). L’ultimo rimasto vince. Si gioca con le regole del celebre gioco di carte; testi e grafica sono nostri.</p>
<ul><li><b>Preparazione:</b> ognuno parte con 7 carte e <b>1 Disinnesco</b>. Nel mazzo ci sono tante bombe quanti i giocatori meno uno.</li>
<li><b>Il turno:</b> puoi giocare quante carte azione vuoi (anche nessuna), poi <b>peschi una carta</b> e il turno finisce. Pescare una carta normale è sicuro.</li>
<li><b>Micio Bomba:</b> se lo peschi e hai un <b>Disinnesco</b>, lo usi e rimetti la bomba nel mazzo dove vuoi (solo tu sai dove!). Senza Disinnesco salti in aria e sei fuori.</li>
<li><b>Attacco ⚔️</b>: finisci il turno <b>senza pescare</b> e il giocatore dopo farà <b>due turni</b> di fila. Se anche lui attacca, i turni si sommano.</li>
<li><b>Salta ⏩</b>: finisci un turno senza pescare.</li>
<li><b>Favore 🎁</b>: scegli un giocatore: lui decide quale carta darti.</li>
<li><b>Mescola 🔀</b>: mescola il mazzo. <b>Preveggenza 🔮</b>: guardi in segreto le prime tre carte.</li>
<li><b>Niet 🚫</b>: quando qualcuno gioca una carta o una combinazione puoi fermarla con un Niet. Si può rispondere a un Niet con un altro Niet: se i Niet sono dispari l’effetto è annullato, se sono pari vale. Il Niet non ferma il Micio Bomba né il Disinnesco.</li>
<li><b>Gatti 🐱</b>: da soli non servono. Una <b>coppia</b> di gatti uguali ruba una carta a caso a un giocatore; un <b>tris</b> ti fa chiedere a un giocatore una carta per nome (se ce l’ha, te la dà).</li>
<li><b>Oltre 5 giocatori</b> si mescolano due mazzi base (i gatti, gli Niet e le carte azione raddoppiano).</li>
<li><b>Edizione Implosione</b> (opzione nella stanza): <b>Gattino Implodente 🕳️</b> — la prima volta che lo peschi lo rimetti nel mazzo a faccia in su, la seconda esplodi anche con un Disinnesco. <b>Inverti 🔄</b>: cambia il verso di gioco e chiude il turno senza pescare. <b>Pesca dal fondo ⤵️</b>: peschi l’ultima carta invece della prima. <b>Altera il futuro 🪄</b>: guardi le prime tre carte e le riordini. <b>Attacco mirato 🎯</b>: come Attacco, ma scegli tu chi farà i due turni. <b>Gatto Randagio ✨</b>: jolly, vale come qualsiasi gatto in coppie e tris. Carte, nomi e illustrazioni sono nostri; sono varianti ispirate all’espansione omonima, non riproduzioni.</li></ul>`,
 catan:`<p>Costruisci il tuo regno su un’isola esagonale: raccogli risorse con i dadi, scambia, costruisci e arriva per primo ai <b>punti vittoria</b> richiesti (10 di solito). Regole del celebre gioco di colonizzazione; grafica e testi sono nostri.</p>
<ul><li><b>Preparazione:</b> a serpentina, ognuno posa due <b>colonie</b> con una <b>strada</b> accanto a ciascuna. La seconda colonia ti dà subito una risorsa per ogni terreno adiacente. Le colonie stanno ad almeno <b>due strade</b> di distanza l’una dall’altra.</li>
<li><b>Il turno:</b> tira i dadi: ogni terreno col numero uscito dà <b>1 risorsa</b> per colonia e <b>2</b> per città adiacente. Poi scambia e costruisci come vuoi, e chiudi con “Fine turno”.</li>
<li><b>Costruire:</b> 🛣️ strada = legno + argilla · 🏠 colonia = legno + argilla + lana + grano (1★, va collegata a una tua strada) · 🏰 città = 2 grano + 3 roccia (sostituisce una colonia, 2★) · 🃏 carta sviluppo = lana + grano + roccia. Hai al massimo 15 strade, 5 colonie e 4 città.</li>
<li><b>Il 7 e il ladro:</b> chi ha <b>più di 7 carte</b> ne scarta metà (per difetto). Poi chi ha tirato sposta il ladro su un altro esagono (che smette di produrre) e ruba una carta a caso a chi ha edifici lì.</li>
<li><b>Commercio:</b> con la banca scambi <b>4 carte uguali</b> con 1 a scelta; con una colonia su un porto ⚓ 3:1, oppure 2:1 per la risorsa del porto. Con gli altri giocatori proponi uno scambio libero (mai la stessa risorsa dai due lati): chi accetta si segna, poi decidi tu con chi concludere.</li>
<li><b>Carte sviluppo:</b> una per turno e non nel turno in cui la compri (il cavaliere si può giocare anche prima del tiro). ⚔️ Cavaliere: sposti il ladro. 🛣️ Costruzione strade: due strade gratis. 🎁 Invenzione: prendi 2 risorse dalla banca. 💰 Monopolio: scegli una risorsa e tutti ti danno quelle che hanno. 🏆 Punto vittoria: 1★ nascosto.</li>
<li><b>Premi (+2★):</b> 🛣️ <b>strada più lunga</b> (almeno 5 strade di fila, spezzata dalle colonie avversarie) e ⚔️ <b>esercito più grande</b> (almeno 3 cavalieri giocati). Si perdono solo se qualcuno ti supera.</li>
<li><b>Vittoria:</b> vinci appena, nel tuo turno, arrivi ai punti richiesti (anche contando i punti vittoria nascosti).</li>
<li><b>5-6 e 7-8 giocatori:</b> la plancia cresce (30 o 37 esagoni, con più porti, una banca da 24 o 29 carte per risorsa e un mazzo sviluppo più grosso). Dopo il turno di ciascuno c’è la <b>costruzione speciale</b>: gli altri, uno alla volta, possono costruire strade, colonie e città o comprare una carta, ma <b>non</b> scambiare, giocare carte sviluppo né vincere. Numeri e porti dell’ampliamento 7-8 sono una nostra approssimazione.</li></ul>`,
 pets:`<p>Gioco di carte velocissimo per 2–6: ognuno tiene <b>una sola carta</b> in mano e cerca di avere la più alta a fine round, o di restare l’ultimo in gioco. Vince chi raccoglie i gettoni richiesti (<b>3</b> in 2–3 giocatori, <b>2</b> in 4–6). Regole del celebre gioco omonimo; nomi, grafica e testi sono nostri.</p>
<ul><li><b>Il turno:</b> peschi una carta (ne hai due), <b>ne giochi una a faccia in su</b> applicandone subito l’effetto e <b>tieni l’altra</b> in segreto. Le carte giocate restano davanti a te.</li>
<li><b>👑 10 Re dei Gatti:</b> se lo giochi sei eliminato. <b>🎭 9:</b> chi ha il Re lo scambia con la tua carta. <b>🔁 8:</b> scambi la tua carta con quella di un giocatore. <b>🤹 7:</b> tutti rimettono la carta nel mazzo e ne ricevono una nuova.</li>
<li><b>🐕 6:</b> guardi la carta messa da parte e puoi scambiarla con la tua. <b>🐍 5:</b> un giocatore gioca la sua carta (senza effetto) e ne pesca un’altra; se era il Re è eliminato. <b>🐢 4:</b> la tua carta è protetta fino al tuo prossimo turno (blocca 1, 3, 5, 7, 8, 9).</li>
<li><b>🐰 3:</b> confronti in segreto la tua carta con quella di un giocatore: il più basso è eliminato (pari: nessuno). <b>🐭 2:</b> guardi la prima carta del mazzo e la rimetti dove vuoi. <b>🔮 1:</b> nomina un numero (non 1): se il giocatore ce l’ha, è eliminato. <b>🧹 0:</b> a fine round batte il Re dei Gatti.</li>
<li><b>Fine del round:</b> quando resta un solo giocatore, o quando bisogna pescare e il mazzo è finito (vince la carta più alta; a parità vince chi ha giocato la carta scoperta più alta). Il vincitore prende un gettone.</li></ul>`,
 spie:`<p>Gioco di parole a squadre, <b>Rossi contro Blu</b>, per 4–10. Sul tavolo ci sono <b>25 parole</b>: ogni squadra deve trovare le proprie prima dell’altra. Ispirato al genere dei giochi “indizio e parole”; parole, grafica e testi sono nostri.</p>
<ul><li><b>Le spie:</b> il primo giocatore della lista è la Spia dei Rossi, il secondo quella dei Blu. Solo le spie vedono la <b>chiave</b>: 9 parole della squadra che comincia, 8 dell’altra, 7 neutre e <b>1 trappola</b>. Gli altri sono gli agenti (posti pari Rossi, dispari Blu).</li>
<li><b>L’indizio:</b> a turno la spia scrive <b>una sola parola</b> e un <b>numero</b>: quante parole della sua squadra c’entrano con l’indizio. Non può essere (né contenere) una parola ancora sul tavolo.</li>
<li><b>Gli agenti:</b> ne parlano insieme a voce, poi a turno uno di loro tocca una parola. Se è della propria squadra si continua, fino a <b>numero + 1</b> tentativi (con numero 0 non c’è limite). Si può fermarsi dopo almeno un tentativo.</li>
<li><b>Se sbagli:</b> una parola neutra chiude il turno; una parola dell’altra squadra la avvicina alla vittoria e chiude il turno; la <b>trappola</b> fa perdere subito la tua squadra.</li>
<li><b>Vittoria:</b> vince la squadra che trova tutte le sue parole, o quella a cui l’avversaria fa toccare la trappola.</li>
<li><b>Su un telefono solo:</b> passate il telefono alla spia quando tocca a lei e poi agli agenti: la chiave si vede solo quando il telefono è in mano a una spia.</li></ul>`,
 uno:`<p>Il classico gioco di scarto a colori per 2–10: <b>resta senza carte per primo</b>. Si gioca una mano. Regole del celebre gioco; grafica e testi sono nostri.</p>
<ul><li><b>Preparazione:</b> 7 carte a testa; si scopre una carta di partenza. Con più di 6 giocatori si usano due mazzi.</li>
<li><b>Il turno:</b> giochi una carta dello <b>stesso colore o stesso numero/simbolo</b> di quella in cima, oppure un jolly. Se non puoi (o non vuoi) peschi una carta: se si può giocare, la giochi subito o passi.</li>
<li><b>Speciali:</b> ⊘ <b>Salta</b> il prossimo giocatore · ⇄ <b>Inverti</b> il giro (in due vale Salta) · <b>+2</b>: il prossimo pesca 2 e salta · ★ <b>Cambia colore</b> · <b>+4</b>: scegli il colore, il prossimo pesca 4 e salta.</li>
<li><b>Sfida al +4 (partita classica):</b> chi lo subisce può sfidare. Se chi l’ha giocato aveva in mano una carta del colore che c’era prima, pesca lui 4; altrimenti chi sfida ne pesca 6.</li>
<li><b>Accumulo (opzione):</b> un +2 si può rimandare con un altro +2 (e un +4 con un +4): chi non può risponde pescando tutto. Il +4 non si sfida.</li>
<li><b>UNO!</b> Quando giochi la penultima carta tocca <b>“Di’ UNO”</b> prima di giocare; se te lo dimentichi peschi 2 carte.</li>
<li><b>Fine mano:</b> chi finisce le carte vince e prende i punti delle carte rimaste agli altri (numeri = valore, ⊘ ⇄ +2 = 20, jolly = 50).</li></ul>`,
 trono:`<p>Gioco di carte per 2–4 che si gioca <b>pescando in fila</b>: rischi di far saltare tutto, ma ogni mazzetto raccolto vale punti. Ispirato all’omonimo gioco; nomi, grafica e testi sono nostri.</p>
<ul><li><b>Il turno:</b> rivela una carta alla volta (fino a <b>5</b>) mettendole in fila. Ogni carta deve avere <b>valore più basso</b> della precedente: se è più alta (dopo i poteri) la fila <b>salta</b> e finisce nel mazzo degli scarti.</li>
<li><b>Quando ti fermi:</b> <b>Raccogli</b> la fila nei tuoi mazzetti (uno per personaggio, max <b>5 mazzetti</b> da <b>5 carte</b>; se non c’è posto scarti qualcosa) oppure <b>Scambia</b>: dai tutta la fila a un avversario e prendi una sua carta.</li>
<li><b>Pari:</b> se l’ultima carta ha lo <b>stesso valore</b> della precedente puoi <b>distruggere</b> una carta qualsiasi dai mazzetti sul tavolo (un solo bersaglio per giocatore per turno).</li>
<li><b>Poteri:</b> funzionano solo per chi ha il mazzetto <b>più grosso</b> di quel personaggio (a pari, tutti). Generale −3, Assassino −2, Giullare ±1 alla carta in fila, Profeta guarda la prima carta del mazzo; il Giudice ripete un altro potere già usato. Una volta a turno ciascuno.</li>
<li><b>Limiti:</b> il Re impedisce di scambiare con meno carte in fila di quante ne hai; la Regina impedisce di distruggere con meno di (Regine+1) carte; chi ha il Menestrello più grosso può essere scambiato solo lì, e chi ha l’Alchimista più grosso può essere colpito solo lì.</li>
<li><b>Fine:</b> quando esce la carta <b>Fine del regno</b> (mescolata dopo che il mazzo si esaurisce) la partita finisce subito: ogni mazzetto di <b>almeno 2 carte</b> vale il valore del personaggio (Re 9 … Alchimista 1). Vince chi ha più punti.</li></ul>`,
 scoundrel:`<p>Solitario di <i>Zach Gage e Kurt Bieg</i>: attraversate il dungeon senza morire. Mazzo da <b>44 carte</b>: niente jolly, niente figure e assi rossi. Partite con <b>20 punti vita</b>.</p>
<ul><li><b>♣ Fiori e ♠ Picche = mostri</b> (danno pari al valore; J=11, Q=12, K=13, A=14). <b>♦ Quadri = armi</b>. <b>♥ Cuori = pozioni</b> (curano il valore, mai oltre 20).</li>
<li>Ogni <b>stanza</b> mostra 4 carte: ne giocate <b>3</b>, una alla volta, nell’ordine che volete. La quarta resta e forma la stanza successiva con 3 nuove carte.</li>
<li><b>Scappare</b>: potete rimettere le 4 carte in fondo al mazzo, ma <b>non due stanze di fila</b> e solo prima di aver giocato carte di quella stanza.</li>
<li><b>Mostri</b>: a mani nude prendete tutto il danno. Con un’arma il danno è <i>mostro − arma</i> (minimo 0) e il mostro resta impilato sull’arma: da quel momento l’arma colpisce solo mostri di valore <b>uguale o inferiore all’ultimo abbattuto</b>.</li>
<li><b>Armi</b>: equipaggiarne una nuova scarta la vecchia con i mostri impilati.</li>
<li><b>Pozioni</b>: una sola per stanza; la seconda viene scartata senza effetto.</li>
<li><b>Fine</b>: se la vita arriva a 0 perdete (punteggio = vita meno i mostri rimasti nel dungeon). Se svuotate il dungeon vincete: punteggio = vita rimasta (+ il valore dell’ultima pozione se avete 20 vite e l’ultima carta era una pozione).</li></ul>`,
 harvest:`<p>Ogni giocatore costruisce una <b>fattoria</b> in una valle condivisa (griglia <b>5×5</b> in 2 e 4 giocatori, <b>6×5</b> in 3 e 5). Vince chi ha più punti quando la valle è piena.</p>
<ul><li><b>Turno</b>: o giochi una tua <b>fattoria</b> (1 a testa; <b>2 a testa in 2–3 giocatori</b>), oppure prendi una delle 3 carte del <b>mercato</b> e la giochi. Il mercato si riempie dal mazzo.</li>
<li>Ogni carta va in una <b>cella libera adiacente</b> (in orizzontale o verticale) a una carta già giocata, restando nei limiti della griglia.</li>
<li><b>Erbacce</b>: si giocano <i>sopra</i> una carta terreno, che torna nel mercato. <b>Trattore</b>: si gioca sopra una carta terreno, che viene spinta in una cella libera adiacente.</li>
<li><b>A griglia piena</b>: i <b>Corvi</b> mangiano tutti i frutteti vicini (anche in diagonale), i <b>Cinghiali</b> tutti gli ortaggi adiacenti. Poi si contano i punti.</li>
<li><b>Punti</b> (per ogni fattoria): ortaggi adiacenti (ortogonali) = il loro valore; frutteti adiacenti (anche in diagonale) = il loro valore; ogni <b>stagno</b> accanto a un ortaggio o frutteto gli dà <b>+1</b>; un <b>campo di grano</b> (carte di grano collegate) toccato dalla fattoria vale <b>il quadrato</b> del numero di carte.</li>
<li>In 2–3 giocatori si sommano i punti delle due fattorie. Parità: vince chi ha più punti dai frutteti.</li></ul><p class="muted">Attenzione: i valori e il numero esatto delle carte sono ricostruiti dalle regole pubbliche: se hai la scatola, confrontali e dimmi cosa correggere.</p>`,
 mind:`<p>Gioco cooperativo (2–4) <b>senza comunicare</b>: niente parole, gesti o indizi. Ogni livello si superano giocando tutte le carte di tutti <b>in ordine crescente</b>.</p>
<ul><li>Carte da 1 a 100. Al livello N ognuno riceve N carte (livello 1: una, livello 2: due…).</li>
<li>Quando tutti toccano <b>«Sono pronto»</b> si parte. Non c’è un turno: <b>chiunque può giocare la sua carta più bassa quando sente che è il momento</b>.</li>
<li><b>Errore</b>: se giochi una carta mentre qualcuno ne ha una più bassa, perdete <b>1 vita</b>; le carte più basse vengono scartate e il livello riparte dal «pronto».</li>
<li><b>Shuriken ★</b>: se tutti sono d’accordo, ognuno scarta la propria carta più bassa (senza perdere vite). Se uno non è d’accordo, si annulla. Si parte con 1 shuriken.</li>
<li><b>Stop ✋</b>: ferma il gioco per ricalibrarvi (ma non parlate!).</li>
<li>Premi: dopo i livelli 2, 5 e 8 ottenete uno shuriken; dopo i livelli 3, 6 e 9 una vita (massimo 5 vite e 3 shuriken).</li>
<li>Vite iniziali: 2 giocatori 2, 3 giocatori 3, 4 giocatori 4. Livelli totali: 12, 10 o 8. Vincete completando l’ultimo livello.</li></ul>`,
 mindx:`<p>Come <b>The Mind</b> (cooperativo, 2–4, <b>senza comunicare</b>) ma con 100 carte di due colori.</p>
<ul><li><b>Bianche 1–50</b>: si giocano in ordine <b>crescente</b>. <b>Rosse 1–50</b>: si giocano in ordine <b>decrescente</b> (dal 50 giù). Due pile separate.</li>
<li>Ognuno riceve N carte al livello N. Quando tutti sono pronti si parte; chiunque gioca quando sente che è il momento: tocca la tua carta <b>bianca più bassa</b> o la <b>rossa più alta</b>.</li>
<li><b>Errore</b>: carta giocata mentre qualcuno ne ha una che andava prima (nello stesso colore): <b>−1 vita</b> e carte saltate scartate.</li>
<li><b>Carte coperte</b> (livelli avanzati): le carte di quel colore si giocano a faccia in giù; gli errori si scoprono solo <b>a fine livello</b> e costano una vita per ogni carta giocata troppo presto.</li>
<li><b>Shuriken ★</b> (tutti d’accordo): ognuno scarta la propria carta più bassa bianca o la più alta rossa. <b>Stop ✋</b> per ricalibrarsi.</li>
<li>Premi e vite come in The Mind: shuriken dopo i livelli 2, 5 e 8; vita dopo 3, 6 e 9.</li></ul><p class="muted">Nota: la distribuzione esatta dei livelli a carte coperte è ricostruita dal regolamento: confrontala con la tua scatola.</p>`,
 machiavelli:`<p>Si gioca con 2 mazzi francesi + 4 jolly (108 carte). Ognuno riceve 13 carte; vince chi <b>finisce per primo le carte in mano</b>.</p>
<ul><li><b>Combinazioni</b>: <b>tris o quartetti</b> (stesso valore, semi tutti diversi) e <b>scale</b> (almeno 3 carte consecutive dello stesso seme; l’asso vale 1 o sta dopo il re, ma non si «gira»: K-A-2 non vale).</li>
<li>Il <b>jolly</b> sostituisce qualsiasi carta.</li>
<li><b>Turno</b>: puoi calare carte dalla mano e <b>riorganizzare liberamente il tavolo</b> (spezzare, unire, riprendere un jolly sostituendolo con la carta vera...), purché alla fine <b>ogni combinazione sia valida</b>, tutte le carte del tavolo restino in gioco e tu cali <b>almeno una carta</b> dalla tua mano.</li>
<li>Se non puoi o non vuoi giocare, <b>peschi una carta</b> e il turno passa.</li>
<li>Se il mazzo è finito e nessuno riesce a calare, vince chi ha meno carte.</li></ul><p><b>Come si fa qui</b>: tocca le carte (mano o tavolo) per selezionarle, poi «Nuova combinazione» o «+ qui» su una combinazione esistente. «Suggerisci» propone la miglior giocata, «Conferma» la gioca.</p>`,
 island:`<p>Siete su un’isola dimenticata: gli animali hanno fame e <b>dovete far mangiare tutti finché ne resta uno solo</b>. Gioco ispirato a <i>Food Chain Island</i> di Scott Almes.</p>
<ul><li>16 animali di terra (valore 0–15) in griglia 4×4, più <b>squalo</b> e <b>balena</b>.</li>
<li><b>Turno</b>: muovi un animale di 1 casella (su, giù, sinistra, destra) sopra un altro che vale <b>da 1 a 3 in meno</b>. Lo impila sopra: la pila vale il numero in cima e si muove insieme.</li>
<li>Quando mangi scatta <b>il potere</b> dell’animale che ha mangiato (obbligatorio, se puoi). Poi fai un altro turno, con lo stesso animale o con un altro.</li>
<li>Alcuni poteri valgono <b>al turno dopo</b> (volpe, lince, tigre, leone, procione, orso polare).</li>
<li>Una volta per partita puoi scartare lo <b>squalo</b> (mangia un animale di valore qualsiasi minore, spostandosi di 1) o la <b>balena</b> (sposta un animale in una casella vuota). Prevalgono sugli altri poteri.</li>
<li>Si finisce quando non puoi più mangiare (o premi «Concludi»): 1 animale rimasto = grande vittoria, 2 = bella vittoria, 3 = di misura, 4 o più = sconfitta.</li>
<li>Difficoltà: togli lo squalo, la balena o entrambi.</li></ul><p class="muted">Nota: le caselle vuote si possono usare anche fuori dalla griglia iniziale, in un’area 6×6.</p>`,
 azul:`<p>Siete maestri decoratori al Palazzo Reale di Evora: completate il muro di <b>azulejos</b>.</p>
<ul><li><b>Turno</b>: prendi <b>tutte</b> le piastrelle di un colore da una fabbrica (le altre vanno al centro) oppure dal centro. Il primo che pesca dal centro prende il segnalino «1» (pavimento, −1 e sarà primo del round dopo).</li>
<li>Mettile in una <b>riga modello</b> (1–5 posti): un solo colore per riga, e non un colore già presente nella stessa riga del muro. Quelle che non entrano cadono sul <b>pavimento</b> (−1,−1,−2,−2,−2,−3,−3).</li>
<li>Quando fabbriche e centro sono vuoti: ogni riga piena posa <b>una</b> piastrella sul muro (le altre vanno nel coperchio) e fa punti: 1 se isolata, altrimenti le piastrelle collegate in riga + colonna.</li>
<li>Fine: appena un muro ha una riga completa. Bonus: riga +2, colonna +7, 5 piastrelle dello stesso colore +10.</li>
<li><b>Muro libero</b> (variante ufficiale): niente colori stampati, scegli tu la colonna senza ripetere un colore in riga o colonna.</li></ul>`,
  regicide:`<p>Gioco cooperativo (1–4): sconfiggete i 12 nemici del castello (4 Fanti, 4 Regine, 4 Re). Se un giocatore non può subire il danno, perdete tutti.</p>
<ul><li><b>Turno</b>: gioca una carta (o un Asso + una carta, o carte uguali con somma ≤ 10, o il Jolly) oppure cedi; poi poteri dei semi, danno, e se il nemico sopravvive scarta carte per almeno il suo attacco.</li>
<li>♥ rimetti in fondo alla Taverna carte dagli scarti. ♦ pesca (senza superare la mano massima). ♣ danno doppio. ♠ l’attacco del nemico cala.</li>
<li><b>Solo i ♦ fanno pescare.</b></li>
<li><b>Immunità</b>: il nemico ignora il potere del proprio seme; il Jolly la annulla. Danno esatto: il nemico è redento e va in cima alla Taverna.</li>
<li>Asso = Animale (1). Fante 10, Regina 15, Re 20. Chi sconfigge un nemico gioca ancora.</li>
<li>Non si può cedere se tutti gli altri hanno ceduto. Il Jolly (3–4 giocatori): chi lo gioca sceglie chi va dopo.</li>
<li><b>Solitario</b>: mano da 8, due Jolly per rifare la mano. Oro = 0 usati, Argento = 1, Bronzo = 2.</li></ul>`,
 briscola:`<ul><li>40 carte napoletane, 3 carte a testa. L’ultima carta del mazzo, scoperta, indica la <b>briscola</b> (il seme che vince).</li>
<li>A turno ognuno gioca una carta. Prende chi gioca la briscola più alta; se non ci sono briscole, la carta più alta del seme giocato per primo.</li>
<li>Ordine: Asso, 3, Re, Cavallo, Fante, 7, 6, 5, 4, 2.</li>
<li>Punti: Asso 11, 3 10, Re 4, Cavallo 3, Fante 2. Totale 120: vince chi supera 60.</li>
<li>Chi prende pesca per primo. In 4 si gioca a coppie (compagni uno di fronte all’altro); in 3 si toglie il 2 di Coppe.</li></ul>`,
 scopa:`<ul><li>40 carte napoletane: 3 a testa e 4 scoperte in tavola.</li>
<li>Con una carta prendi una carta di pari valore, oppure più carte la cui somma è uguale. Se c’è una carta uguale devi prendere quella. <b>La presa è obbligatoria.</b></li>
<li>Valori: Asso 1 … 7, Fante 8, Cavallo 9, Re 10.</li>
<li>Se svuoti il tavolo fai <b>scopa</b> (1 punto), tranne all’ultima giocata.</li>
<li>A fine mano le carte rimaste vanno a chi ha preso per ultimo. Punti: carte (più carte), denari (più denari), settebello, primiera, scope.</li>
<li>Primiera: 7=21, 6=18, Asso=16, 5=15, 4=14, 3=13, 2=12, figure=10 (la carta migliore per seme).</li>
<li>In 4 si gioca a coppie. Si gioca a 11 o 21 punti.</li></ul>`,
 gang:`<p>Siete una banda di scassinatori: vincete aprendo <b>3 caveau</b>, perdete con <b>3 allarmi</b>.</p>
<ul><li>Ognuno riceve 2 carte coperte (poker Texas Hold’em). Sul tavolo escono 3 carte (Flop), poi 1 (Turn), poi 1 (River).</li>
<li>A ogni round ci sono gettoni da 1 a N stelle (bianchi, gialli, arancio, rossi). <b>Più stelle = pensi di avere la mano più forte.</b></li>
<li>A turno: prendi un gettone dal centro, <b>rubalo</b> a un altro giocatore, oppure passa. Il round finisce quando tutti hanno un gettone e tutti passano di fila. (Nel gioco da tavolo si fa tutti insieme: qui si va a turno per giocare anche passandosi il telefono.)</li>
<li><b>Vietato parlare delle proprie carte!</b> L’unico segnale sono i gettoni.</li>
<li>Showdown: si rivelano le mani in ordine di gettone rosso. Se ognuna è uguale o più forte della precedente, il caveau si apre.</li>
<li><b>Avanzata</b>: dopo un colpo riuscito arriva una carta Sfida, dopo un fallimento uno Specialista che aiuta. <b>Professionista</b>: una Sfida resta sempre attiva. <b>Maestro</b>: due Sfide sempre attive, nessuno Specialista e bastano 2 allarmi per perdere.</li></ul><p>Tocca «Guida alle mani» durante la partita per vedere tutte le combinazioni.</p>`,
 saboteur:`<p>Siete nani in miniera. Alcuni sono <b>sabotatori</b> segreti! I cercatori vogliono collegare l’ingresso alla carta d’oro, i sabotatori vogliono impedirlo.</p>
<ul><li>Ruoli segreti: 3–4 giocatori 1 sabotatore, 5–6 due, 7–9 tre, 10 quattro (un ruolo resta sempre fuori, quindi può anche non esserci nessun sabotatore).</li>
<li>Turno: gioca <b>una</b> carta (galleria, azione) oppure scartane una coperta; poi peschi.</li>
<li><b>Gallerie</b>: devono combaciare con tutte le carte vicine e collegarsi all’ingresso. Puoi ruotarle di 180°.</li>
<li><b>Attrezzi rotti</b> (piccone, lanterna, carrello): chi ne ha uno davanti non può scavare finché non viene riparato.</li>
<li><b>Frana</b>: togli una galleria. <b>Mappa</b>: guarda in segreto una delle 3 mete.</li>
<li>Le 3 mete in fondo: una è l’oro, due sono carbone. Quando una galleria le raggiunge si girano.</li>
<li>Oro trovato: chi l’ha raggiunto pesca tante pepite quanti sono i giocatori, ne sceglie una e passa le altre ai cercatori (in senso antiorario). Oro non trovato a fine mazzo: vincono i sabotatori (4 pepite se è uno solo, 3 se sono 2–3, 2 se sono 4).</li>
<li>Si giocano 3 round: vince chi ha più pepite.</li></ul><p><b>Saboteur 2</b>: squadre di cercatori blu e verdi (le porte del colore avversario bloccano), Capo, Profittatore, Geologi (contano i cristalli), scale collegate alla superficie, ponti, e nuove azioni: prigione, libertà, furto, giù le mani, cambio cappello, ispezione, scambio delle mani. Pepite: 1 vincitore 5, 2 vincitori 4, 3 vincitori 3, 4 vincitori 2, di più 1 (Capo −1, Profittatore −2). Le forme delle 30 nuove gallerie sono ricostruite.</p>`,
 burraco:`<ul><li>2 mazzi francesi + 4 jolly. 11 carte a testa e due pozzetti da 11. In 4 si gioca a coppie.</li>
<li>Turno: <b>pesca</b> una carta dal mazzo oppure <b>raccogli tutti gli scarti</b>; poi cala o attacca combinazioni; infine <b>scarta</b> una carta.</li>
<li>Combinazioni: scala (3+ carte consecutive dello stesso seme, Asso basso o alto) o tris (3+ carte dello stesso valore). Massimo un jolly o una pinella (il 2) per combinazione.</li>
<li><b>Burraco</b> = combinazione di 7+ carte: pulito (senza jolly) +200, sporco +100.</li>
<li>Quando finisci le carte prendi il <b>pozzetto</b> (al volo se finisci calando). Una sola volta per coppia.</li>
<li><b>Chiusura</b> (+100): serve aver preso il pozzetto e avere almeno un burraco; chiudi scartando l’ultima carta (non un jolly o una pinella).</li>
<li>Punti carte: Jolly 30, pinella 20, Asso 15, dall’8 al Re 10, dal 3 al 7 5. Le carte in mano si sottraggono; pozzetto non preso −100. Se il mazzo finisce, la mano termina.</li></ul>`};
