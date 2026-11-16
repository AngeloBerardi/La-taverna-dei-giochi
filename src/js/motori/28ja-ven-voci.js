/* ---- Compagnia di ventura, dialoghi (V6b): i testi delle scene, come dati. Nessuna logica: la legge VEN (28k) e le fa girare ARAC (27q). ----
   `VVOC` è un capitolo del motore di racconto: {id, titolo, personaggi, bandiere, ingressi, scene}. Le scene non hanno `dove`: le avvia il mondo (VEN.accoda).
   Nomi delle scene (solo a-z0-9-): `<c>-lamento`, `<c>-addio`, `<c>-inc-1..3` (<c> = id del compagno senza `co_`), `volpe-1..3`, `sig-<tratto>-<livello>` (livelli 1..3).
   Le scene leggono solo i fatti che il mondo copia in `bandiere` prima di ogni mossa: grad-<c> (gradimento), inc-<c> (passi compiuti), con-<c> (in compagnia), serve-<regno>, fama, tappa, giorno,
   più le bandiere che impostano da sé (volpe-patto, volpe-odio, volpe-sfida, volpe-debito, <c>-promessa e i finali degli incarichi).
   Effetti del mondo: {t:'ven',k:'grad',id,n} · {k:'via',id} · {k:'passo',id} · {k:'premio',id} · {k:'scontro'} · {k:'conf',n} · {k:'tappa'}; {t:'oro',n}. Elenco in VEN.EFF_VOCI.
   Testi di V6c: la Volpe, i dieci compagni (lamento, addio, incarico) e i signori (cinque indoli × tre livelli di fiducia). Misure: nodo ≤ 280 lettere, 3–6 nodi per scena (l'addio è breve). */
const VVOC=(()=>{
 const D=typeof VDAT!=='undefined'?VDAT:require('./28j-ven-dati.js');
 const personaggi={_:{nome:''},rv_volpe:{nome:D.RIVALE.nome.replace(/^la /,'La ')},signore:{nome:'Il signore'}};
 for(const c of D.COMPAGNI)personaggi[c.id]={nome:c.nome};
 // scorciatoie per scrivere le scene: fine di scena, effetti
 const gr=(id,n)=>({t:'ven',k:'grad',id,n}),ven=(k,x)=>Object.assign({t:'ven',k},x||{}),oro=n=>({t:'oro',n});
 const ba=id=>({t:'bandiera',id});
 // lamento e addio di un compagno: tre uscite fisse (promessa, denaro, alzata di spalle) e un saluto più duro se la promessa è stata tradita
 const lamento=(k,dice,risp,ris)=>({inizio:'a',nodi:{
  a:{chi:'co_'+k,testo:dice,scelte:[
   {t:risp[0],effetti:[gr('co_'+k,8),ba(k+'-promessa')],vai:'b'},
   {t:risp[1],se:{oro:80},effetti:[oro(-80),gr('co_'+k,12)],vai:'c'},
   {t:risp[2],effetti:[gr('co_'+k,-4)],vai:'d'}]},
  b:{chi:'co_'+k,testo:ris[0],fine:true},c:{chi:'co_'+k,testo:ris[1],fine:true},d:{chi:'co_'+k,testo:ris[2],fine:true}}});
 const addio=(k,dice,saluto,promessa,duro)=>({inizio:'a',nodi:{
  a:{chi:'co_'+k,testo:dice,scelte:[{t:promessa,se:k+'-promessa',vai:'b'},{t:saluto,se:{non:k+'-promessa'},fine:true}]},
  b:{chi:'co_'+k,testo:duro,fine:true}}});
 const passo=id=>ven('passo',{id});
 // un signore: una battuta e due risposte {t, e (effetti), r (sua replica), se?}; ogni risposta tocca la fiducia (conf) o le monete
 const conf=n=>ven('conf',{n});
 const sig=(dice,A,B)=>({inizio:'a',nodi:{
  a:{chi:'signore',testo:dice,scelte:[A,B].map((x,i)=>Object.assign({t:x.t,effetti:x.e,vai:'bc'[i]},x.se?{se:x.se}:{}))},
  b:{chi:'signore',testo:A.r,fine:true},c:{chi:'signore',testo:B.r,fine:true}}});
 const scene={
  // ---- Berta la Rossa: sbrigativa, frasi corte, non chiede due volte ----
  'berta-lamento':lamento('berta',
   "«Due cose, capitano, e le dico una volta. Al nemico non si volta la schiena. E ai briganti non si paga il passo: l'oro ai ladri lo dà chi ha paura. Io paura non ne ho. Tu?»",
   ['Hai ragione. Da oggi si tiene il campo.','Prendi queste, e restiamo amici.','Si fa quel che conviene. Abituati.'],
   ["«Detto. Davanti a me. Basta così.»",
    "«Monete. Le prendo, non sono scema. Ma la prossima volta che scappiamo non mettermele in conto.»",
    "«Quel che conviene. Parli come Ulfredo coi suoi regolamenti. Va bene: so con chi ho a che fare.»"]),
  'berta-addio':addio('berta',"«Basta. Prendo l'ascia e chi mi vuole seguire. Non ti auguro male, capitano: ti auguro di imparare a tenere il campo.»",
   'Buona strada, Berta.','Berta…',"«Avevi promesso. Davanti a tutti. Chi scappa almeno non mente: tu sì. Non cercarmi.»"),
  'berta-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:"«Sai perché mi hanno cacciata da Valdoro? Un conte ha messo le mani su una sguattera. L'ho steso con un pugno, davanti alla sua gente. Da allora a Roccadoro mi aspettano con la corda.»",vai:'b'},
   b:{chi:'co_berta',testo:"«Voglio rientrarci. Dalla porta grande, di giorno, con una compagnia alle spalle. Mi ci porti?»",scelte:[
    {t:'Dalla porta grande. Tutti insieme.',effetti:[gr('co_berta',4),passo('co_berta')],fine:true},
    {t:'Ci andiamo. Ma se tocchi il conte, paghi tu.',effetti:[gr('co_berta',-2),gr('co_ulf',2),passo('co_berta')],fine:true},
    {t:'Prima dimmi che fine ha fatto la ragazza.',vai:'c'}]},
   c:{chi:'co_berta',testo:"«Sposata a un mugnaio, tre figli, mi manda i saluti coi mercanti. Non è lei che devo vendicare. Sono io che devo tornare.»",scelte:[
    {t:'Allora si torna.',effetti:[gr('co_berta',3),passo('co_berta')],fine:true}]}}},
  'berta-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:"«Hai visto le facce? Il conte s'è chiuso in casa. Ma in piazza dicevano che sono una sbandata con l'ascia. Voglio che parlino d'altro: un signore di Valdoro battuto in campo aperto.»",scelte:[
    {t:'Un signore di Valdoro. Scegli tu quale.',effetti:[gr('co_berta',3),passo('co_berta')],vai:'b'},
    {t:'Non attacco un regno per il tuo orgoglio.',vai:'c'}]},
   b:{chi:'co_berta',testo:"«Quello col cavallo grigio e la barba tinta. In piazza rideva più forte di tutti.»",fine:true},
   c:{chi:'co_berta',testo:"«Non chiedo una guerra. Chiedo un campo e un mattino. Se lo incrociamo, non scansarlo.»",scelte:[
    {t:'Se lo incrociamo, non lo scanso.',effetti:[gr('co_berta',1),passo('co_berta')],fine:true},
    {t:'Lo cerchiamo. Ma i morti li conti tu.',effetti:[gr('co_berta',-3),gr('co_lapo',2),passo('co_berta')],fine:true}]}}},
  'berta-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:"«Al mercato ho riconosciuto uno dei bravi del conte. Ora fanno i predoni, in un covo lontano dalla strada. C'è anche il figlio del conte, con loro. Li stano io.»",vai:'b'},
   b:{chi:'co_berta',testo:"«Una cosa sola la decidi tu. Il ragazzo, quando lo prendo: lo riporto a suo padre o lo lasci a me?»",scelte:[
    {t:'A suo padre. Che sia lui a vergognarsi.',effetti:[gr('co_berta',2),gr('co_lapo',2),ba('berta-giustizia'),passo('co_berta')],vai:'c'},
    {t:'È tuo. Fanne quel che serve.',effetti:[gr('co_berta',6),gr('co_lapo',-4),gr('co_dia',-2),ba('berta-vendetta'),passo('co_berta')],vai:'d'}]},
   c:{chi:'co_berta',testo:"«A suo padre. Per il bavero, fino alla porta grande. Va bene anche così.»",fine:true},
   d:{chi:'co_berta',testo:"«Non lo ammazzo, se è questo che temi. Ma ogni volta che vedrà un'ascia gli tremeranno le ginocchia.»",fine:true}}},
  // ---- Lapo Cerusico: mite, ironico, parla da medico ----
  'lapo-lamento':lamento('lapo',
   "«Capitano, posso? Ultimamente ho cucito più fosse che ferite. E quei villaggi bruciati: i loro malati li curavo io, una volta. Non ti chiedo di non combattere. Ti chiedo di non farmi ricucire anche i poveri.»",
   ['Meno razzie e meno morti inutili. Hai la mia parola.','Compra bende e unguenti, e non pensarci.','La guerra è questa, Lapo.'],
   ["«La parola di un capitano. La metto tra i rimedi, accanto alla corteccia di salice. Vediamo se guarisce qualcosa.»",
    "«Bende buone, almeno. Coprono quasi tutto. Quasi.»",
    "«Lo so. Anche al convento dicevano che il mondo è questo. Suor Nera, almeno, ci prega sopra. Io cucio.»"]),
  'lapo-addio':addio('lapo',"«Me ne vado, capitano. Ti lascio l'ago grosso e le pinze: a chi resta serviranno più che a me. Il vino si versa sulle ferite. Non prima, in gola.»",
   'Grazie di tutto, Lapo.','Lapo, avevo detto…',"«Avevi detto. Le promesse sono come le bende, capitano: se nessuno le cambia, marciscono.»"),
  'lapo-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_lapo',testo:"«Una cosa da poco. Al convento mi chiusero fuori perché portavo dentro i lebbrosi della strada. Da allora non ho più messo piede in un chiostro. Vorrei vedere se trema la porta, o se tremo io.»",scelte:[
    {t:'Andiamo al primo monastero sulla strada.',effetti:[gr('co_lapo',3),passo('co_lapo')],vai:'b'},
    {t:'Ci andiamo. Ma niente prediche ai frati.',effetti:[gr('co_lapo',1),gr('co_berta',2),passo('co_lapo')],vai:'c'}]},
   b:{chi:'co_lapo',testo:"«Bene. Se il priore mi riconosce, tu fai la faccia da capitano severo. Ti riesce benissimo, sai.»",fine:true},
   c:{chi:'co_lapo',testo:"«Prediche, io? Taglio, cucio e taccio. Le prediche le lascio a chi ha fiato da sprecare.»",fine:true}}},
  'lapo-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_lapo',testo:"«Il portinaio non mi ha riconosciuto: la porta non ha tremato. Però in infermeria c'erano undici malati e un mortaio solo. Centoventi monete, capitano. Le lascio io, al prossimo monastero.»",scelte:[
    {t:'Le avrai. Sono monete della compagnia: ricordatelo.',effetti:[gr('co_lapo',2),passo('co_lapo')],vai:'b'},
    {t:'Le avrai quando la cassa respira.',effetti:[gr('co_lapo',-1),gr('co_isa',2),passo('co_lapo')],vai:'c'}]},
   b:{chi:'co_lapo',testo:"«Grazie. Isabetta vorrà la ricevuta: dille che la firma il priore. Le piacerà poco.»",fine:true},
   c:{chi:'co_lapo',testo:"«Quando respira, sì. Intanto i malati aspettano. Sono bravissimi ad aspettare: ne hanno l'abitudine.»",fine:true}}},
  'lapo-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_lapo',testo:"«Il frate dell'infermeria mi ha detto una cosa. In certe rovine qui attorno c'era un lazzaretto. Ora ci sta gente che spoglia i febbricitanti di passaggio. E sotto, in una cripta, i libri d'erbe del vecchio priore.»",vai:'b'},
   b:{chi:'co_lapo',testo:"«Ripuliamo le rovine. Poi i libri: li riporto al convento, che ne ha diritto, o li teniamo noi, che ne abbiamo bisogno?»",scelte:[
    {t:'Al convento. Così la porta non trema più.',effetti:[gr('co_lapo',3),gr('co_nera',3),ba('lapo-convento'),passo('co_lapo')],vai:'c'},
    {t:'Restano a noi. I feriti sono qui, non là.',effetti:[gr('co_lapo',5),gr('co_nera',-3),ba('lapo-libri'),passo('co_lapo')],vai:'d'}]},
   c:{chi:'co_lapo',testo:"«Al convento. Il priore storcerà il naso e io sorriderò. Non sono un santo, capitano. Ma sono puntuale.»",fine:true},
   d:{chi:'co_lapo',testo:"«A noi. Lo confesserò a Suor Nera, che mi darà la penitenza peggiore: ricopiarli in bella.»",fine:true}}},
  // ---- Ghino del Passo: furbo, fa i conti, parla di sentieri ----
  'ghino-lamento':lamento('ghino',
   "«Ti parlo da socio, capitano. Ogni uomo lasciato nel fango è un uomo che non porta più sacchi. E Maralta? I suoi doganieri mi hanno dato la caccia per sei anni. Ora gli faccio la scorta. Ridi, ridi.»",
   ['D\'ora in poi contiamo gli uomini prima dei sacchi.','Ecco la tua parte, socio. In anticipo.','Un contratto è un contratto, chiunque paghi.'],
   ["«Contare gli uomini. Me lo segno. Io i conti non li perdo, nemmeno quando li perde chi li fa.»",
    "«In anticipo. Vedi che a parlarne ci si capisce? Per oggi non ho più niente da lamentare.»",
    "«Chiunque paghi, certo. Lo dicevo anch'io, poi mi hanno messo una taglia. Fosca dice che invecchio male.»"]),
  'ghino-addio':addio('ghino',"«Conosco un sentiero che sulle carte non c'è. Lo prendo stanotte, e non vi conviene seguirmi. Senza rancore, capitano: a me i conti devono tornare.»",
   'Che il sentiero ti porti lontano.','Ghino, i conti li avevamo fatti.',"«Li avevamo fatti, sì. Poi li hai sbagliati tu. Il debito te lo condono: tanto non lo pagheresti.»"),
  'ghino-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_ghino',testo:"«Un tempo il Passo era mio. Sale, panni, qualche barile di cose che non ti dico. Poi io mi sono ritirato, i miei uomini no. Ora rapinano chi passa, e dicono che li mando io.»",vai:'b'},
   b:{chi:'co_ghino',testo:"«Non li voglio morti tutti. Voglio che si sappia che Ghino non c'entra. Una banda di predoni battuta da noi, in campo: basta e avanza.»",scelte:[
    {t:'Li cerchiamo. Chi si arrende, vive.',effetti:[gr('co_ghino',2),gr('co_lapo',2),passo('co_ghino')],fine:true},
    {t:'Li cerchiamo. Chi resiste, paga.',effetti:[gr('co_ghino',3),gr('co_berta',2),passo('co_ghino')],fine:true},
    {t:'Una caccia costa. Metti qualcosa anche tu.',effetti:[oro(60),gr('co_ghino',-3),passo('co_ghino')],vai:'c'}]},
   c:{chi:'co_ghino',testo:"«Sessanta monete. Ecco: vedi come si fa il socio? Io le cose le pago sempre. A volte anche in tempo.»",fine:true}}},
  'ghino-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_ghino',testo:"«Ora sanno che Ghino sta con la gente onesta. Quasi onesta. Resta un debito: per dieci anni ho venduto ai villaggi sale tagliato con la sabbia. Minestre salate di sabbia, capitano.»",vai:'b'},
   b:{chi:'co_ghino',testo:"«Quattro sacchi di sale buono, portati da noi al primo villaggio che troviamo. Non per la coscienza. Per il nome.»",scelte:[
    {t:'Quattro sacchi. Li compriamo strada facendo.',effetti:[gr('co_ghino',3),passo('co_ghino')],vai:'c'},
    {t:'Il sale lo paga la tua quota.',effetti:[oro(200),gr('co_ghino',-3),gr('co_isa',2),passo('co_ghino')],vai:'d'}]},
   c:{chi:'co_ghino',testo:"«Conosco un salinaro che non bagna i sacchi. Non te lo presento: è timido coi capitani.»",fine:true},
   d:{chi:'co_ghino',testo:"«Con la mia quota. E va bene: il nome me lo pago da solo, come tutto il resto.»",fine:true}}},
  'ghino-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_ghino',testo:"«Resta Maralta. Alla dogana c'è un registro col mio nome: sei pagine di multe. Finché c'è quel registro, Ghino del Passo è un ricercato. Voglio entrare in un porto di Maralta a viso aperto.»",vai:'b'},
   b:{chi:'co_ghino',testo:"«Due strade. Pago le multe, cento monete, e il nome è pulito per sempre. Oppure una notte, un lume, e un registro che prende fuoco per sbaglio. Le conosco tutte e due.»",scelte:[
    {t:'Paghiamo. Si entra dalla porta.',se:{oro:100},effetti:[oro(-100),gr('co_ghino',2),gr('co_isa',3),ba('ghino-pulito'),passo('co_ghino')],vai:'c'},
    {t:'Il registro brucia.',effetti:[gr('co_ghino',6),gr('co_dia',-3),ba('ghino-registro'),passo('co_ghino')],vai:'d'}]},
   c:{chi:'co_ghino',testo:"«Pulito. Mi sentirò nudo per un mese. Isabetta dice che è il miglior affare della mia vita.»",fine:true},
   d:{chi:'co_ghino',testo:"«Brucia, sì. Fosca mi terrà il lume. E se qualcuno chiede, quella notte eravamo tutti a messa.»",fine:true}}},
  // ---- Isabetta Contabile: fa i conti, precisa, secca ----
  'isa-lamento':lamento('isa',
   "«Capitano, i conti. La paga è arrivata tardi e gli uomini hanno mangiato pane e promesse. Le promesse non le metto a bilancio. Una compagnia che non paga e non sfama, sui miei libri, si chiama fallimento.»",
   ["Paga puntuale e dispense piene. Scrivilo.","Ecco un acconto. Mettilo a bilancio.","I libri li tieni tu. La compagnia la guido io."],
   ["«Scritto, con la data. Tra un mese ricontrollo la voce.»",
    "«Acconto registrato. Il debito resta, ma respira.»",
    "«Certo. E io tengo i libri di chi la guida. Brando almeno scappa senza far finta di niente.»"]),
  'isa-addio':addio('isa',"«Ho chiuso il libro della compagnia. Ti lascio l'ultima pagina: entrate, uscite e la differenza. Leggila quando avrai il coraggio.»",
   "Grazie dei conti, Isabetta.","Isabetta, la promessa…","«Era scritta, con la data. L'hai mancata. Sui miei libri un debitore così non ha più credito.»"),
  'isa-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_isa',testo:"«Tenevo i libri di una compagnia di navigazione. Poi una nave è sparita col carico, e i padroni hanno detto che i conti li avevo sbagliati io. Non li avevo sbagliati.»",vai:'b'},
   b:{chi:'co_isa',testo:"«Voglio rivedere un porto. So leggere un molo come un registro: chi carica, chi paga, chi mente. Lì comincio a cercare quella nave.»",scelte:[
    {t:"Andiamo al porto più vicino.",effetti:[gr('co_isa',3),passo('co_isa')],vai:'c'},
    {t:"Un porto costa giorni. E i giorni sono monete.",effetti:[gr('co_isa',-2),passo('co_isa')],vai:'d'}]},
   c:{chi:'co_isa',testo:"«Il più vicino. Ottimo: le spese di viaggio più basse.»",fine:true},
   d:{chi:'co_isa',testo:"«Lo sono. Ma una reputazione vale più dei giorni. Ghino te lo può confermare: la sua costa sei pagine di multe.»",fine:true}}},
  'isa-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_isa',testo:"«Al molo me l'hanno detto: la nave non è affondata. L'hanno presa dei predoni, e il libro di bordo è finito nel loro covo. Con quel libro dimostro chi ha venduto il carico.»",scelte:[
    {t:"Staniamo il covo. Il libro è tuo.",effetti:[gr('co_isa',3),passo('co_isa')],vai:'b'},
    {t:"Un covo costa uomini. Il libro vale tanto?",effetti:[gr('co_isa',-1),gr('co_brando',2),passo('co_isa')],vai:'c'}]},
   b:{chi:'co_isa',testo:"«Il libro, e nient'altro. Il resto del bottino lo registro a nome della compagnia.»",fine:true},
   c:{chi:'co_isa',testo:"«Vale sette anni di stipendi non pagati. Fai tu il conto: io l'ho già fatto.»",fine:true}}},
  'isa-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_isa',testo:"«Ecco il libro. Ogni riga porta il nome di chi ha venduto il carico: uno dei padroni, che oggi siede nel consiglio di Maralta.»",vai:'b'},
   b:{chi:'co_isa',testo:"«Due strade. Lo porto al tribunale dei mercanti, a Maralta, e mi riprendo il nome. Oppure glielo mostro in privato, e lui paga quanto vale il suo silenzio.»",scelte:[
    {t:"Al tribunale. Il nome prima di tutto.",effetti:[gr('co_isa',4),gr('co_dia',2),ba('isa-tribunale'),passo('co_isa')],vai:'c'},
    {t:"In privato. Che paghi.",effetti:[oro(120),gr('co_isa',2),gr('co_dia',-3),ba('isa-silenzio'),passo('co_isa')],vai:'d'}]},
   c:{chi:'co_isa',testo:"«Al tribunale. Mi costerà tre mesi di udienze. Ne vale la pena: lo metto in conto.»",fine:true},
   d:{chi:'co_isa',testo:"«In privato, allora. Gli ho scritto stanotte: ha mandato centoventi monete, e ci aspetta a Maralta per stringerci la mano. Gliela stringerò coi guanti.»",fine:true}}},
  // ---- Mastro Ulfredo: piazza d'armi, rapporti, non sorride ----
  'ulf-lamento':lamento('ulf',
   "«Capitano. Rapporto. Due infrazioni gravi. Primo: si è ripiegato senza ordine, cioè si è fuggiti. Secondo: la paga è arrivata in ritardo. In trent'anni a Castelferro non è successo mai. Fine del rapporto.»",
   ["Rapporto ricevuto. Non succederà più.","Una gratifica, mastro. Per la pazienza.","A Castelferro non ci siamo più, mastro."],
   ["«Annotato nel registro di servizio. Alla prossima infrazione lo leggo ad alta voce, davanti agli uomini.»",
    "«Gratifica accettata. La pazienza resta esaurita lo stesso.»",
    "«Ce ne accorgiamo, capitano. Ogni giorno. Diamante se ne accorge anche lei, e non si lamenta mai.»"]),
  'ulf-addio':addio('ulf',"«Capitano. Chiedo congedo. Concesso o no, me lo prendo. Gli uomini sanno marciare: almeno quello resta.»",
   "Congedo concesso, mastro.","Mastro, avevo dato la mia parola…","«La parola data a un sottoposto vale il doppio, capitano. La sua, con me, non valeva niente. Riposo.»"),
  'ulf-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_ulf',testo:"«Capitano. Castelferro mi ha messo a riposo dopo trent'anni: troppo vecchio, hanno detto. Il nuovo maestro d'armi insegna a dare di picca come si dà di scopa.»",vai:'b'},
   b:{chi:'co_ulf',testo:"«Chiedo di vedere la piazza d'armi. Coi miei occhi. Poi decido se ridere o piangere. Non farò né l'uno né l'altro.»",scelte:[
    {t:"Si va a Castelferro. Marcia doppia.",effetti:[gr('co_ulf',3),gr('co_berta',-2),passo('co_ulf')],vai:'c'},
    {t:"Ci passiamo. Ma niente ispezioni agli uomini altrui.",effetti:[gr('co_ulf',1),gr('co_brando',2),passo('co_ulf')],vai:'d'}]},
   c:{chi:'co_ulf',testo:"«Marcia doppia. Finalmente un ordine sensato. Berta si lamenterà: è il suo modo di marciare.»",fine:true},
   d:{chi:'co_ulf',testo:"«Niente ispezioni. Guarderò soltanto. Guardare non lo vieta nessun regolamento.»",fine:true}}},
  'ulf-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_ulf',testo:"«La piazza è un pascolo. Picche storte, ragazzi che chiacchierano in fila. Ho visto abbastanza. La mia scuola vale ancora: lo dimostro in campo, contro una banda vera.»",scelte:[
    {t:"Prendi i novellini. In battaglia li porti tu.",effetti:[gr('co_ulf',4),passo('co_ulf')],vai:'b'},
    {t:"In campo andiamo tutti. Come sempre.",effetti:[gr('co_ulf',1),gr('co_dia',2),passo('co_ulf')],vai:'c'}]},
   b:{chi:'co_ulf',testo:"«I novellini. Bene. Tra un mese non li riconoscerà nemmeno la madre.»",fine:true},
   c:{chi:'co_ulf',testo:"«Tutti. Va bene. Il primo che rompe la fila lo rimando a Castelferro, a dare di scopa.»",fine:true}}},
  'ulf-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_ulf',testo:"«Rapporto. Banda battuta, nessuna fila rotta. È arrivata una lettera dalla rocca: mi rivogliono. Servono ferro per le armi nuove e un maestro che sappia usarle.»",vai:'b'},
   b:{chi:'co_ulf',testo:"«Porto quattro carichi di ferro a un castello, per la scuola. Poi decida lei, capitano: torno a insegnare a loro, a guerra finita, o resto qui fino in fondo.»",scelte:[
    {t:"Insegna a loro. Te lo sei guadagnato.",effetti:[gr('co_ulf',2),gr('co_berta',2),ba('ulf-scuola'),passo('co_ulf')],vai:'c'},
    {t:"Resti con noi. Mi servi qui.",effetti:[gr('co_ulf',5),gr('co_berta',-3),ba('ulf-resta'),passo('co_ulf')],vai:'d'}]},
   c:{chi:'co_ulf',testo:"«A guerra finita. Fino ad allora la scuola è qui, e nessuno ha privilegi.»",fine:true},
   d:{chi:'co_ulf',testo:"«Restare.» Per un istante sembra quasi che sorrida. «Non è nel regolamento. Lo aggiungerò io.»",fine:true}}},
  // ---- Diamante Alfiere: solenne, parla di onore e di stendardi ----
  'dia-lamento':lamento('dia',
   "«Capitano, ho portato lo stendardo di un re davanti a mille lance. Non lo porterò davanti a un villaggio in fiamme. E non piegherò l'asta per pagare il passo a dei briganti.»",
   ["Niente più razzie né pedaggi. Sullo stendardo.","Prendi, per l'armatura. Te la sei meritata.","Lo stendardo segue la compagnia, non il contrario."],
   ["«Sullo stendardo. Ti prendo in parola: è l'unico giuramento che conosco.»",
    "«Per l'armatura. Lo accetto. L'onore però non si lucida con l'oro.»",
    "«Lo so. Il mio re lo diceva spesso. È morto con lo stendardo in mano. Ulfredo ha i suoi regolamenti; io avevo solo quello.»"]),
  'dia-addio':addio('dia',"«Ripiego lo stendardo. Non è una resa, capitano: è un congedo. Chi vuole seguirmi mi segua; chi resta, resti con onore.»",
   "Va', Diamante. Con onore.","Diamante, sullo stendardo…","«Hai giurato sullo stendardo. Ora lo porto via, perché tu non lo sporchi più. Non c'è altro da dire.»"),
  'dia-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_dia',testo:"«Il mio re è caduto sotto le mura del suo castello. Ora sono rovine, e ci vivono dei briganti. Sotto quelle pietre c'è ancora la sua spada.»",vai:'b'},
   b:{chi:'co_dia',testo:"«Voglio ripulirle. Non per l'oro: perché chi passerà dopo sappia che lì è caduto un re, e non c'è un covo di ladri.»",scelte:[
    {t:"Le ripuliremo. È una questione d'onore.",effetti:[gr('co_dia',3),gr('co_ulf',2),passo('co_dia')],vai:'c'},
    {t:"Le ripuliamo. Ma l'oro che c'è si divide.",effetti:[oro(50),gr('co_dia',-1),gr('co_fosca',2),gr('co_ghino',2),passo('co_dia')],vai:'d'}]},
   c:{chi:'co_dia',testo:"«D'onore. Grazie, capitano. Ulfredo preparerà la marcia: lui sa come si fa.»",fine:true},
   d:{chi:'co_dia',testo:"«L'oro dividetelo pure: eccone un acconto, dalla cassa del mio re. La spada no.»",fine:true}}},
  'dia-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_dia',testo:"«Sull'elsa c'è il motto del mio re: \"Chi tradisce, cade\". Lo tradì un vassallo che cambiò stendardo, e ce ne sono a decine. Battine uno in campo, e sapranno che lo stendardo è tornato.»",scelte:[
    {t:"Uno solo, e davanti a tutti.",effetti:[gr('co_dia',2),gr('co_berta',2),passo('co_dia')],vai:'b'},
    {t:"Lo stendardo lo porti tu, in testa alla compagnia.",effetti:[gr('co_dia',4),gr('co_ulf',-1),passo('co_dia')],vai:'c'}]},
   b:{chi:'co_dia',testo:"«Davanti a tutti. Berta sarà contenta: anche lei ha un conto aperto coi signori.»",fine:true},
   c:{chi:'co_dia',testo:"«In testa. Dove stavo quando cadde il re. Questa volta non cadrà.»",fine:true}}},
  'dia-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_dia',testo:"«Lo stendardo è tornato, e se ne parla. Resta il re. Non ha mai avuto una tomba: l'ho portato per otto anni in una cassa di cedro. Un monastero lo accoglierebbe.»",vai:'b'},
   b:{chi:'co_dia',testo:"«Sulla sua tomba posso deporre lo stendardo per sempre. Oppure portarlo ancora, sotto i tuoi colori. Non so cosa vorrebbe il mio re. Decidi tu.»",scelte:[
    {t:"Deponilo. Il tuo re ha atteso abbastanza.",effetti:[gr('co_dia',2),gr('co_nera',2),ba('dia-depone'),passo('co_dia')],vai:'c'},
    {t:"Portalo ancora, sotto i nostri colori.",effetti:[gr('co_dia',5),gr('co_ulf',2),gr('co_lapo',-2),ba('dia-porta'),passo('co_dia')],vai:'d'}]},
   c:{chi:'co_dia',testo:"«Deposto. Mi sentirò leggera, e un poco perduta. Mi abituerò.»",fine:true},
   d:{chi:'co_dia',testo:"«Sotto i tuoi colori. Allora d'ora in poi è anche il tuo re. Trattalo bene.»",fine:true}}},
  // ---- Temu Senzaclan: poche parole, la steppa, il cavallo ----
  'temu-lamento':lamento('temu',
   "«Capitano. Fame, e non va. Cavallo affamato non corre, uomo affamato non tira. E servi Altavento: quelli che mi hanno cacciato. Io tiro per loro? No.»",
   ["Né fame né Altavento. Te lo prometto.","Prendi. Compra carne per te e per il cavallo.","Si serve chi paga, Temu."],
   ["«Promessa. Nella steppa si fa sul fuoco. Qui non c'è fuoco. Va bene lo stesso.»",
    "«Carne. Il cavallo ringrazia. Io anche, meno.»",
    "«Chi paga. Ghino dice uguale. Ghino però ride, quando lo dice.»"]),
  'temu-addio':addio('temu',"«Vado. La steppa è grande, qualcuno mi prende. Il cavallo non ti saluta: è offeso. Io no. Solo stanco.»",
   "Buon vento, Temu.","Temu, la promessa…","«Promessa sul fuoco, ti dicevo. Tu l'hai fatta sull'acqua. L'acqua scorre via. Io anche.»"),
  'temu-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_temu',testo:"«Quando mi hanno cacciato, mi hanno preso il cavallo. Grigio, occhio bianco. Un mercante lo ha portato a ovest, dicono. Le locande sanno tutto.»",vai:'b'},
   b:{chi:'co_temu',testo:"«Andiamo in una locanda. Io ascolto, tu paghi il vino. Va bene così.»",scelte:[
    {t:"Il vino lo pago io. Andiamo.",se:{oro:20},effetti:[oro(-20),gr('co_temu',3),passo('co_temu')],vai:'c'},
    {t:"Il vino lo paghi tu, e ascoltiamo in due.",effetti:[gr('co_temu',1),gr('co_ghino',2),passo('co_temu')],vai:'d'}]},
   c:{chi:'co_temu',testo:"«Bene. Tu bevi poco: chi beve molto non sente.»",fine:true},
   d:{chi:'co_temu',testo:"«In due. Viene anche Ghino: lui sente le cose che non dicono.»",fine:true}}},
  'temu-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_temu',testo:"«L'oste ha visto il grigio. Lo hanno i predoni del bosco: rubano cavalli, vendono a tutti. Li troviamo. Li battiamo. Il grigio torna.»",scelte:[
    {t:"Li battiamo. Il grigio torna.",effetti:[gr('co_temu',3),passo('co_temu')],vai:'b'},
    {t:"E i loro cavalli li prendiamo tutti.",effetti:[gr('co_temu',5),gr('co_lapo',-2),gr('co_dia',-2),passo('co_temu')],vai:'c'}]},
   b:{chi:'co_temu',testo:"«Solo il grigio. Gli altri cavalli non mi conoscono.»",fine:true},
   c:{chi:'co_temu',testo:"«Tutti. Così nella steppa sapranno: Temu ruba meglio dei ladri.»",fine:true}}},
  'temu-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_temu',testo:"«Il grigio è vecchio, ora. Corre ancora. Lo porto a Tendalarga, che la capoclan lo veda: era di suo padre. Poi lo lascio a te. Io ho il mio.»",vai:'b'},
   b:{chi:'co_temu',testo:"«A Tendalarga posso chiedere perdono. O entrare a cavallo e non chiedere niente. Uno dei due fa male. Scegli tu quale.»",scelte:[
    {t:"Chiedi perdono. Torni a casa.",effetti:[gr('co_temu',2),gr('co_ghino',-2),ba('temu-perdono'),passo('co_temu')],vai:'c'},
    {t:"Entra a cavallo. Non devi niente a nessuno.",effetti:[gr('co_temu',5),gr('co_dia',-2),ba('temu-fiero'),passo('co_temu')],vai:'d'}]},
   c:{chi:'co_temu',testo:"«Perdono. Forse lo danno. Io resto con te lo stesso: casa è dove mangia il cavallo.»",fine:true},
   d:{chi:'co_temu',testo:"«A cavallo. Testa alta. La capoclan guarda, e capisce. Oppure no. Non importa.»",fine:true}}},
  // ---- Suor Nera: prega e picchia, ironia nera ----
  'nera-lamento':lamento('nera',
   "«Capitano, una confessione. La tua, non la mia. Hai bruciato case di gente che pregava e venduto prigionieri a peso d'oro. Io prego per te ogni sera. Le preghiere hanno un limite. La mia pazienza anche.»",
   ["Niente più fuochi né riscatti. Lo giuro.","Un'offerta per i tuoi poveri.","Le prediche tienile per la messa."],
   ["«Giurato davanti a Dio e davanti alla mia mazza. La seconda ha meno pazienza.»",
    "«Per i poveri. Bene. Non pensare di aver comprato il perdono: costa di più.»",
    "«Alla messa ci vieni tu, allora. In prima fila, accanto a Lapo. Lui almeno ascolta.»"]),
  'nera-addio':addio('nera',"«Vado a pregare altrove. Ti lascio la benedizione: non è molto, ma è gratis. La mazza invece la porto con me.»",
   "Pregate per noi, sorella.","Sorella, il giuramento…","«L'hai fatto davanti a Dio. Io ti perdono, perché devo. Lui non so. Non resto a scoprirlo con te.»"),
  'nera-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_nera',testo:"«Avevo un ospizio sulla strada del sale. Pane per i viandanti, letti per i malati. I predoni l'hanno svuotato e bruciato. I villaggi intorno ora fanno la fame.»",vai:'b'},
   b:{chi:'co_nera',testo:"«Prima il pane, poi le botte. Otto sacchi di grano al primo villaggio. Il Signore apprezzerà, e lo stomaco dei villani anche di più.»",scelte:[
    {t:"Otto sacchi. Benedetti e pagati.",effetti:[gr('co_nera',3),gr('co_lapo',2),passo('co_nera')],vai:'c'},
    {t:"Otto sacchi? Ne bastano quattro.",effetti:[gr('co_nera',-2),gr('co_isa',2),passo('co_nera')],vai:'d'}]},
   c:{chi:'co_nera',testo:"«Benedetti e pagati: il miracolo più raro. Lapo li conterà con me.»",fine:true},
   d:{chi:'co_nera',testo:"«Quattro? Otto, capitano. Il Signore conta meglio di Isabetta, e la fame ancora meglio.»",fine:true}}},
  'nera-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_nera',testo:"«I villani hanno mangiato, e hanno parlato. Quelli che hanno bruciato l'ospizio stanno in un covo a mezza giornata da qui. È il tempo delle botte.»",scelte:[
    {t:"Adesso. Tu davanti, noi dietro.",effetti:[gr('co_nera',4),passo('co_nera')],vai:'b'},
    {t:"Prima ci prepariamo. Poi le botte.",effetti:[gr('co_nera',1),gr('co_ulf',2),passo('co_nera')],vai:'c'}]},
   b:{chi:'co_nera',testo:"«Davanti, sì. Pregherò dopo. Per loro, s'intende.»",fine:true},
   c:{chi:'co_nera',testo:"«Preparatevi pure. Io intanto prego. Poi picchio.»",fine:true}}},
  'nera-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_nera',testo:"«Nel covo c'era la campana dell'ospizio. E c'era il capobanda, vivo. Mi ha chiesto perdono in ginocchio. Gli ho rotto il naso. Poi ho dovuto pensarci.»",vai:'b'},
   b:{chi:'co_nera',testo:"«La campana la porto a un monastero, per un ospizio nuovo. E lui? Lo porto con me a suonarla per penitenza, o lo lascio alla giustizia di un signore?»",scelte:[
    {t:"Che faccia penitenza. Suonerà la campana.",effetti:[gr('co_nera',4),gr('co_lapo',2),gr('co_berta',-2),ba('nera-penitenza'),passo('co_nera')],vai:'c'},
    {t:"Alla giustizia. Il perdono non è affar nostro.",effetti:[gr('co_nera',1),gr('co_berta',2),gr('co_ulf',1),ba('nera-giustizia'),passo('co_nera')],vai:'d'}]},
   c:{chi:'co_nera',testo:"«Suonerà. Ogni mattina all'alba, per vent'anni. È la penitenza peggiore: dorme tanto.»",fine:true},
   d:{chi:'co_nera',testo:"«Alla giustizia, allora. Dirò una preghiera per lui sotto il patibolo. Corta.»",fine:true}}},
  // ---- Brando Seicolpi: spaccone sincero, conta fino a sei ----
  'brando-lamento':lamento('brando',
   "«Capitano, ti dico la verità, che è merce rara. Scappare mi piace: si campa di più. Ma qui si muore troppo, e senza un soldo di riscatto. E poi i tornei: gente che si fa ammazzare per una sciarpa. Io no.»",
   ["Meno morti, e i prigionieri si riscattano. Promesso.","Tieni. Per i quadrelli, e per il buonumore.","Qui si combatte, Brando. Non si contratta."],
   ["«Promesso. Lo incido sul calcio della balestra: lì non si cancella.»",
    "«Ecco, così si ragiona. Sei uomini a terra, garantiti. Poi vediamo.»",
    "«Si combatte. Va bene. Ma quando scappo non chiamarmi: tanto non sento. Isabetta mi segnerà assente, lo fa volentieri.»"]),
  'brando-addio':addio('brando',"«Lo sapevi che sarebbe finita così: scappo. Stavolta però saluto, e non è da me. Sei quadrelli te li lascio. Li ho contati.»",
   "Corri, Brando. Lo sai fare.","Brando, la promessa…","«L'avevo incisa sul calcio della balestra. Stamattina l'ho grattata via. È bastato un attimo: era incisa male, come la tua.»"),
  'brando-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_brando',testo:"«Una cosa sola non mi perdono. Sei anni fa, in un porto, ho lasciato indietro un compagno: Tano. L'hanno preso. Io sono scappato. Come sempre.»",vai:'b'},
   b:{chi:'co_brando',testo:"«Voglio tornare in un porto e chiedere di lui. Nei porti si sa chi è stato venduto, e a chi.»",scelte:[
    {t:"Andiamo. Chiederemo di Tano.",effetti:[gr('co_brando',3),passo('co_brando')],vai:'c'},
    {t:"Sei anni? Tano ti avrà dimenticato.",effetti:[gr('co_brando',-2),gr('co_isa',2),passo('co_brando')],vai:'d'}]},
   c:{chi:'co_brando',testo:"«Io faccio le domande, tu fai la faccia. Siamo una bella coppia.»",fine:true},
   d:{chi:'co_brando',testo:"«Forse. Io no. E Isabetta, che ride, non ha mai lasciato indietro nessuno: lei lascia indietro i conti degli altri.»",fine:true}}},
  'brando-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_brando',testo:"«Tano è vivo. Lo tengono dei briganti in certe rovine, e lo usano come mulo. Stavolta non scappo: sei quadrelli, poi ne ricarico altri sei.»",scelte:[
    {t:"Sei e sei. Le ripuliamo.",effetti:[gr('co_brando',3),passo('co_brando')],vai:'b'},
    {t:"Se scappi, ti lascio con Tano.",effetti:[gr('co_brando',1),gr('co_ulf',2),passo('co_brando')],vai:'c'}]},
   b:{chi:'co_brando',testo:"«Dodici. In battaglia non ho mai contato fino a dodici. Sarà una giornata storica.»",fine:true},
   c:{chi:'co_brando',testo:"«Giusto. Così almeno saremmo in due a lamentarci.»",fine:true}}},
  'brando-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_brando',testo:"«Tano è libero. Mi ha guardato e non ha detto niente. Vuole tornare a casa, e la casa ha un debito: duecento monete con un usuraio del porto.»",vai:'b'},
   b:{chi:'co_brando',testo:"«Le consegni tu, al primo porto: con i soldi in tasca io scappo, lo sai. Ma prima dimmi: a Tano dico la verità, che quel giorno sono scappato, o che ero corso a cercare aiuto?»",scelte:[
    {t:"La verità. Costa, ma libera.",effetti:[gr('co_brando',2),gr('co_lapo',2),ba('brando-verita'),passo('co_brando')],vai:'c'},
    {t:"La storia dell'aiuto. Gli farà meno male.",effetti:[gr('co_brando',4),gr('co_dia',-2),ba('brando-bugia'),passo('co_brando')],vai:'d'}]},
   c:{chi:'co_brando',testo:"«La verità. Tano mi ha preso a pugni. Sei, li ho contati. Poi mi ha abbracciato.»",fine:true},
   d:{chi:'co_brando',testo:"«L'aiuto, sì. Tano ci ha creduto. O ha fatto finta, che tra amici è lo stesso.»",fine:true}}},
  // ---- Fosca delle Rovine: parla di ciò che sta sotto terra ----
  'fosca-lamento':lamento('fosca',
   "«Capitano, le rovine non scappano, gli uomini sì: li perdiamo per strada. E la fame. Chi scava a stomaco vuoto vede tesori dappertutto, e muore sotto il primo muro.»",
   ["Meno morti, e pane per tutti. Promesso.","Prendi. Pane, candele e una pala nuova.","Si scava con quel che c'è."],
   ["«Promesso. Lo ricorderò come ricordo le iscrizioni: per sempre, e con qualche lettera mancante.»",
    "«Una pala nuova. Questo sì che è un discorso. Temu dice che le pale sono per chi non ha un cavallo.»",
    "«Con quel che c'è. Allora non lamentarti se troviamo solo ossa.»"]),
  'fosca-addio':addio('fosca',"«Ho trovato una mappa che porta lontano. Vado. Non serve che tu venga: dove vado io non servono capitani, solo candele.»",
   "Che la mappa sia giusta, Fosca.","Fosca, avevamo detto…","«Promesse e iscrizioni: alle tue mancano tutte le lettere. Ne ho viste, di rovine. Tu sei crollato più in fretta di tutte.»"),
  'fosca-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_fosca',testo:"«Da quindici anni cerco una cosa: una lanterna di bronzo che non si spegne, dicono, nemmeno sott'acqua. L'ultimo a vederla fu il mio maestro, in certe rovine qui intorno.»",vai:'b'},
   b:{chi:'co_fosca',testo:"«Dentro ci stanno dei briganti, ovviamente. Le rovine buone hanno sempre inquilini. Le ripuliamo, e io scavo.»",scelte:[
    {t:"Le ripuliamo. Scava quanto vuoi.",effetti:[gr('co_fosca',3),passo('co_fosca')],vai:'c'},
    {t:"Le ripuliamo. Quel che trovi, metà alla compagnia.",effetti:[oro(40),gr('co_fosca',-1),gr('co_isa',2),passo('co_fosca')],vai:'d'}]},
   c:{chi:'co_fosca',testo:"«Quanto voglio. Non dirlo mai più a una come me.»",fine:true},
   d:{chi:'co_fosca',testo:"«Metà. Ecco un anticipo dalla mia borsa: Isabetta sarà felice. Io farò finta di esserlo.»",fine:true}}},
  'fosca-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_fosca',testo:"«Della lanterna, solo il gancio. E un nome graffiato sulla pietra: un oste. Gli osti comprano tutto da chi scava, e non dimenticano niente.»",scelte:[
    {t:"Andiamo a trovare il tuo oste.",effetti:[gr('co_fosca',3),passo('co_fosca')],vai:'b'},
    {t:"Ci vai con Temu. Due facce sono meglio di una.",effetti:[gr('co_fosca',1),gr('co_temu',2),passo('co_fosca')],vai:'c'}]},
   b:{chi:'co_fosca',testo:"«Speriamo sia ancora vivo. E che non abbia venduto la lanterna a un vescovo.»",fine:true},
   c:{chi:'co_fosca',testo:"«Temu. Bene. Lui non parla, io sì: insieme sembriamo onesti.»",fine:true}}},
  'fosca-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_fosca',testo:"«L'oste l'ha venduta a un capobanda, che la usa per contare i soldi di notte. Sta in un covo. La lanterna è lì.»",vai:'b'},
   b:{chi:'co_fosca',testo:"«Il mio maestro aveva una figlia. Crede che il padre sia morto per niente. Le scrivo che l'abbiamo trovata, o la lascio in pace? Le lettere, a volte, fanno più danni dei crolli.»",scelte:[
    {t:"Scrivile. Deve sapere.",effetti:[gr('co_fosca',2),gr('co_nera',2),ba('fosca-lettera'),passo('co_fosca')],vai:'c'},
    {t:"Lasciala in pace. Certe cose restano sepolte.",effetti:[gr('co_fosca',4),gr('co_temu',2),gr('co_lapo',-2),ba('fosca-silenzio'),passo('co_fosca')],vai:'d'}]},
   c:{chi:'co_fosca',testo:"«Le scrivo. La lanterna, quando l'avrò in mano, la darò a te. Io l'ho cercata: non ho mai detto di volerla.»",fine:true},
   d:{chi:'co_fosca',testo:"«Sepolte, sì. Ne so qualcosa. La lanterna però la tieni tu: io ho finito di cercare.»",fine:true}}},
  // ---- i signori, per indole e per fiducia (1 notizie, 2 favori, 3 sostegno). Parla il signore incontrato: {signore}, {capitano} ----
  'sig-prode-1':sig("«{capitano}! Ho sentito della tua ultima battaglia. Una notizia, da soldato a soldato: le bande si fanno più audaci, quest'anno. Gloria a buon mercato, per chi ha fegato.»",
   {t:"Allora andiamo a prendercela.",e:[conf(2),gr('co_brando',-2)],r:"«Così mi piace! Chi parte subito arriva prima della paura.»"},
   {t:"La gloria a buon mercato costa cara.",e:[conf(1),gr('co_ulf',2)],r:"«Hai ragione. Chi parla così vive abbastanza da diventare famoso.»"}),
  'sig-prode-2':sig("«Le mie strade sono piene di briganti, e i miei cavalieri hanno fame di battaglie e di biada. Dai una mano, e ti devo un favore. Se no, ti devo una risata.»",
   {t:"Cento monete per la biada dei tuoi cavalli.",se:{oro:100},e:[oro(-100),conf(2)],r:"«Monete per la biada! Non è da soldato, ma i miei cavalli mangiano lo stesso.»"},
   {t:"I briganti li togliamo noi, a modo nostro.",e:[conf(1),gr('co_berta',2)],r:"«A modo vostro! Va bene: purché le strade siano pulite.»"}),
  'sig-prode-3':sig("«{capitano}, quando il re chiederà chi merita fiducia, farò il tuo nome. Non perché sei prudente: perché non lo sei. Brindiamo?»",
   {t:"Brindiamo. Alla prossima carica.",e:[conf(2),gr('co_berta',2)],r:"«Alla prossima! E che ci trovi tutti e due davanti.»"},
   {t:"Brindo. Ma all'ultima: ne ho viste abbastanza.",e:[conf(1),gr('co_lapo',2)],r:"«L'ultima? Non ci credo. Brindo lo stesso: il vino non fa domande.»"}),
  'sig-avido-1':sig("«Una notizia, capitano, e gratis, per una volta: chi compra quando tutti vendono si arricchisce. Io l'ho fatto. Le altre mie notizie, però, si pagano.»",
   {t:"Grazie. Mi basta questa.",e:[conf(1)],r:"«Non ringraziarmi. Ricordatene quando venderò io.»"},
   {t:"Quanto costano le altre?",se:{oro:30},e:[oro(-30),conf(2),gr('co_isa',2)],r:"«Trenta. Per te, un prezzo d'amico. Gli amici, del resto, pagano sempre.»"}),
  'sig-avido-2':sig("«Ho un carico da portare oltre il fiume, e i briganti mi costano più delle tasse. Non ti pago, sia chiaro. Ti presto il mio favore: vale di più.»",
   {t:"Il tuo favore vale. Lo scortiamo.",e:[conf(2),gr('co_isa',-2)],r:"«Saggio. Il mio favore, a differenza delle monete, cresce col tempo. Forse.»"},
   {t:"Il favore non si mangia. Cinquanta monete.",e:[oro(50)],r:"«Cinquanta. Mi fai piangere. Prendile, e non tornare troppo presto.»"}),
  'sig-avido-3':sig("«Capitano, sei diventato un buon affare. Al consiglio del re parlerò per te. Tra soci si usa un pegno: cento monete, diciamo. Per le spese di voce.»",
   {t:"Ecco il pegno.",se:{oro:100},e:[oro(-100),conf(2)],r:"«Le tue cento monete parleranno più forte di me. E io parlerò forte, te lo assicuro.»"},
   {t:"Tra soci ci si fida. Senza pegno.",e:[conf(1),gr('co_isa',2)],r:"«Fiducia senza pegno. Che idea moderna. Parlerò, ma piano.»"}),
  'sig-crudele-1':sig("«Sei ancora vivo, mercenario. Mi stupisce. Una cosa te la dico: chi passa nelle mie terre senza pagare finisce appeso. Non tu, per ora. Guardati.»",
   {t:"Grazie dell'avviso.",e:[conf(1)],r:"«Grazie? Non ci sono abituato. Non farci l'abitudine nemmeno tu.»"},
   {t:"Chi impicca, prima o poi pende.",e:[conf(-1),gr('co_dia',2)],r:"«Mi piace la tua lingua. Mi piacerebbe di più su un piatto.» Ride soltanto lui."}),
  'sig-crudele-2':sig("«Ho un villaggio che non paga. Mi servono uomini che sappiano convincere, e non mi interessa come. Tu sai convincere, mercenario?»",
   {t:"So convincere. A parole.",e:[conf(1),gr('co_lapo',2)],r:"«A parole. A volte bastano. Quando non bastano, ti richiamo.»"},
   {t:"Cercati un altro boia.",e:[conf(-1),gr('co_dia',2),gr('co_nera',2)],r:"«Un boia lo trovo sempre. Uno che mi dice di no, invece, è raro. Non lo dimentico.»"}),
  'sig-crudele-3':sig("«Ti ho visto combattere: non hai pietà quando serve. Al re dirò che sei utile, ed è il complimento più alto che faccio. Non deludermi. Chi mi delude, lo ricordo.»",
   {t:"Non ti deluderò.",e:[conf(2),gr('co_lapo',-2)],r:"«Bene. Ora vattene, prima che cambi idea.»"},
   {t:"Non lavoro per farti piacere.",e:[conf(1),gr('co_dia',2)],r:"«Nessuno lavora per farmi piacere: lavorano per paura. Tu no. Interessante.»"}),
  'sig-onorevole-1':sig("«Che la tua parola valga quanto la tua spada, ti dissi. Finora vale. Ti avverto, allora: alla corte qualcuno parla male di te. Non so chi. So che mente.»",
   {t:"Grazie. Lo terrò a mente.",e:[conf(2)],r:"«Tienilo a mente, e tieni dritta la schiena. Il resto lo farà il tempo.»"},
   {t:"Lasciali parlare. I fatti rispondono.",e:[conf(1),gr('co_dia',2)],r:"«I fatti rispondono, sì. Ma tardi. Le parole arrivano prima, e a cavallo.»"}),
  'sig-onorevole-2':sig("«Ho un prigioniero, il figlio di un nemico. Non voglio venderlo: voglio restituirlo a sua madre. Mi serve una scorta onesta. Lo faresti senza riscatto?»",
   {t:"Senza riscatto. Lo riporteremo.",e:[conf(2),gr('co_nera',2),gr('co_isa',-2)],r:"«Lo sapevo. Ti devo più di quel che credi.»"},
   {t:"Una scorta costa. Il viaggio lo paghi tu.",e:[oro(40),gr('co_isa',2)],r:"«Giusto, giusto. Quaranta monete, e la mia stima un poco più piccola.»"}),
  'sig-onorevole-3':sig("«{capitano}, ho visto abbastanza. Se il re lo chiederà, risponderò per te con la mia parola. Te lo dico perché tu sappia cosa pesa, d'ora in poi, sulle tue spalle.»",
   {t:"Peserà. La porterò bene.",e:[conf(2),gr('co_dia',2)],r:"«Non ne dubito. Va', e torna sempre dalla porta principale.»"},
   {t:"È un peso grande. Lo porterò come potrò.",e:[conf(1),gr('co_brando',2)],r:"«Come potrai. È onesto. Più onesto di molti giuramenti.»"}),
  'sig-prudente-1':sig("«Le strade non sono sicure, te l'ho detto. Aggiungo questo: chi viaggia di notte arriva prima, ma non sempre arriva. Fa' il giro lungo. Costa un giorno, risparmia un funerale.»",
   {t:"Faremo il giro lungo. Grazie.",e:[conf(2),gr('co_brando',2)],r:"«Bene. Io il giro lungo lo faccio sempre: per questo ho i capelli bianchi, e la testa sul collo.»"},
   {t:"Il giro corto, con le spade in mano.",e:[conf(1),gr('co_berta',2)],r:"«Le spade in mano! Allora non dire che te l'ho detto io. E scrivimi, se arrivi.»"}),
  'sig-prudente-2':sig("«Una lettera deve arrivare al re, e i miei corrieri non arrivano mai. Tu viaggi armato. La porteresti? Senza aprirla, s'intende.»",
   {t:"La porto. Sigillata.",e:[conf(2)],r:"«Mi fido di te più che dei miei corrieri. Il che, lo ammetto, non è moltissimo.»"},
   {t:"Prima la leggo. Non porto sorprese.",e:[conf(1),gr('co_isa',2)],r:"«Dentro c'è solo un elenco di grano e di debiti. Per questo la mando con te.»"}),
  'sig-prudente-3':sig("«Ho deciso, capitano. Quando il re chiederà, starò con te. Non è coraggio: ho fatto i conti, e sei la scommessa meno rischiosa. Non farmi pentire.»",
   {t:"Non te ne pentirai.",e:[conf(2)],r:"«Me lo dicono tutti. Tu però, finora, hai mantenuto.»"},
   {t:"I conti si sbagliano, a volte.",e:[conf(1),gr('co_isa',2)],r:"«Lo so. Per questo li rifaccio ogni sera.»"}),
  // ---- la Volpe Rossa: sorride sempre, non si spiega mai ----
  'volpe-1':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:"«Tu sei il capitano di cui parlano le osterie. Io sono quella di cui parlano quando hanno finito con te.» Sorride. «La strada è larga. Per ora.»",scelte:[
    {t:'Larga abbastanza per due. Spartiamola.',vai:'b'},
    {t:'Larga finché non mi intralci.',vai:'c'},
    {t:'Non tratto con chi cambia padrone ogni settimana.',vai:'d'}]},
   b:{chi:'rv_volpe',testo:"«Spartire. Che parola gentile.» Ti stringe la mano, e la stretta è vera. «A presto, socio.»",effetti:[ba('volpe-patto'),gr('co_isa',2),gr('co_ghino',2),ven('tappa')],fine:true},
   c:{chi:'rv_volpe',testo:"«Allora ci intralceremo. Sarà divertente.» Si tocca il cappello e se ne va senza voltarsi.",effetti:[ba('volpe-sfida'),gr('co_berta',3),gr('co_ulf',2),ven('tappa')],fine:true},
   d:{chi:'rv_volpe',testo:"«Ogni settimana? Esageri. Ogni mese.» Ride piano, e ti guarda come si guarda un cavallo da comprare.",effetti:[ba('volpe-odio'),gr('co_dia',3),ven('tappa')],fine:true}}},
  'volpe-2':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:"«Le strade s'incrociano, capitano. Lo dicono i preti, i mercanti e i ladri. Io sono un po' tutti e tre.»",scelte:[
    {t:'Il nostro patto vale ancora?',se:'volpe-patto',vai:'b'},
    {t:'Che vuoi, Volpe?',se:'volpe-odio',vai:'c'},
    {t:'Hai la faccia di chi ha bisogno di qualcosa.',se:{non:'volpe-odio'},vai:'d'}]},
   b:{chi:'rv_volpe',testo:"«Vale. Domani passa un carro di gabelle al guado. Io prendo il carro, tu guardi dall'altra parte. Oppure ti sporchi le mani e prendi di più.»",scelte:[
    {t:'Guardo dall\'altra parte.',effetti:[oro(80),ven('tappa')],fine:true},
    {t:'Mi sporco le mani.',effetti:[oro(180),gr('co_lapo',-4),gr('co_dia',-3),gr('co_ghino',2),ven('tappa')],fine:true}]},
   c:{chi:'rv_volpe',testo:"«Niente. Ho già preso.» Ti mostra una borsa: è quella della tua cassa. «Contale, se vuoi. Ne mancano cento.»",effetti:[oro(-100)],scelte:[
    {t:'Me la pagherai.',effetti:[gr('co_berta',2),ven('tappa')],fine:true},
    {t:'Bel colpo. Tienila.',effetti:[gr('co_berta',-3),gr('co_ghino',2),ba('volpe-rispetto'),ven('tappa')],fine:true}]},
   d:{chi:'rv_volpe',testo:"«Bisogno, io?» Sorride. «Mi servono trenta uomini per un'ora, al ponte di là. Non chiedere contro chi.»",scelte:[
    {t:'Te li presto.',effetti:[ba('volpe-debito'),gr('co_ulf',-3),gr('co_brando',2),ven('tappa')],fine:true},
    {t:'I miei uomini non si prestano.',effetti:[gr('co_ulf',2),ven('tappa')],fine:true}]}}},
  'volpe-3':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:"«L'ultima volta, capitano.» Accarezza la cavalla bianca. «Come chiudiamo?»",scelte:[
    {t:'Con l\'acciaio.',se:{non:'volpe-sfida'},vai:'b'},
    {t:'Mi devi qualcosa, Volpe.',se:'volpe-debito',vai:'c'},
    {t:'Soci fino in fondo?',se:['volpe-patto',{non:'volpe-debito'}],vai:'c'},
    {t:'Con una stretta di mano.',vai:'d'},
    {t:'Come avevamo detto: con l\'acciaio.',se:'volpe-sfida',vai:'e'}]},
   b:{chi:'rv_volpe',testo:"«Speravo che lo dicessi.» E sorride ancora, mentre sguaina.",effetti:[gr('co_berta',4),ven('scontro'),ven('tappa')],fine:true},
   c:{chi:'rv_volpe',testo:"«Fino in fondo.» Smonta e ti porge le redini. «Si chiama Tramontana. Non frustarla: non serve.»",effetti:[ven('premio',{id:'rv_volpe'}),ven('tappa')],fine:true},
   d:{chi:'rv_volpe',testo:"«Una stretta di mano.» La tiene a lungo. Poi sorride, e se ne va.",effetti:[gr('co_lapo',3),ven('tappa')],fine:true},
   e:{chi:'rv_volpe',testo:"«Te lo ricordavi.» Sorride, si toglie il guanto e lo getta ai tuoi piedi.",effetti:[gr('co_berta',6),gr('co_ulf',2),ven('scontro'),ven('tappa')],fine:true}}}
 };
 // bandiere (i fatti copiati dal mondo) e ingressi (ogni scena può essere avviata dal mondo): calcolati dai nomi
 const bandiere=['fama','tappa','giorno'].concat(D.REGNI.map(f=>'serve-'+f));
 for(const c of D.COMPAGNI){const k=c.id.slice(3);bandiere.push('grad-'+k,'inc-'+k,'con-'+k)}
 return{id:'ventura',titolo:'Voci della compagnia',personaggi,bandiere,ingressi:Object.keys(scene),scene}})();
if(typeof module!=='undefined')module.exports=VVOC;
