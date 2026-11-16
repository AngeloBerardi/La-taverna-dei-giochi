/* ---- Compagnia di ventura, dialoghi (V6b): i testi delle scene, come dati. Nessuna logica: la legge VEN (28k) e le fa girare ARAC (27q). ----
   `VVOC` è un capitolo del motore di racconto: {id, titolo, personaggi, bandiere, ingressi, scene}. Le scene non hanno `dove`: le avvia il mondo (VEN.accoda).
   Nomi delle scene (solo a-z0-9-): `<c>-lamento`, `<c>-addio`, `<c>-inc-1..3` (<c> = id del compagno senza `co_`), `volpe-1..3`, `sig-<tratto>-<livello>` (livelli 1..3).
   Le scene leggono solo i fatti che il mondo copia in `bandiere` prima di ogni mossa: grad-<c> (gradimento), inc-<c> (passi compiuti), con-<c> (in compagnia), serve-<regno>, fama, tappa, giorno,
   più le bandiere che impostano da sé (volpe-patto, volpe-odio, volpe-debito).
   Effetti del mondo: {t:'ven',k:'grad',id,n} · {k:'via',id} · {k:'passo',id} · {k:'premio',id} · {k:'scontro'} · {k:'conf',n} · {k:'tappa'}; {t:'oro',n}. Elenco in VEN.EFF_VOCI.
   Testi di V6c, a blocchi: 1) la Volpe, Berta, Lapo, Ghino. I compagni senza scene restano alla riga di cronaca di V6a. Misure: nodo ≤ 280 lettere, 3–6 nodi per scena. */
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
 const scene={
  // ---- Berta la Rossa: sbrigativa, frasi corte, non chiede due volte ----
  'berta-lamento':lamento('berta',
   "«Due cose, capitano, e le dico una volta. Al nemico non si volta la schiena. E ai briganti non si paga il passo: l'oro ai ladri lo dà chi ha paura. Io paura non ne ho. Tu?»",
   ['Hai ragione. Da oggi si tiene il campo.','Prendi queste, e restiamo amici.','Si fa quel che conviene. Abituati.'],
   ["«Detto davanti a me. Me lo ricorderò, anche se te lo scordi tu.»",
    "«Monete. Le prendo, non sono scema. Ma la prossima volta che scappiamo non mettermele in conto.»",
    "«Quel che conviene. Parli come Ulfredo coi suoi regolamenti. Va bene: so con chi ho a che fare.»"]),
  'berta-addio':addio('berta',"«Basta. Prendo l'ascia e chi mi vuole seguire. Non ti auguro male, capitano: ti auguro di imparare a tenere il campo.»",
   'Buona strada, Berta.','Berta, aspetta.',"«Avevi promesso. Davanti a tutti. Chi scappa almeno non mente: tu sì. Non cercarmi.»"),
  'berta-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:"«Sai perché mi hanno cacciata da Valdoro? Un conte ha messo le mani su una sguattera. L'ho steso con un pugno, davanti alla sua gente. Da allora a Roccadoro mi aspettano con la corda.»",vai:'b'},
   b:{chi:'co_berta',testo:"«Voglio rientrarci. Dalla porta grande, di giorno, con una compagnia alle spalle. Mi ci porti?»",scelte:[
    {t:'Dalla porta grande. Tutti insieme.',effetti:[gr('co_berta',4),passo('co_berta')],fine:true},
    {t:'Ci andiamo. Ma se tocchi il conte, paghi tu.',effetti:[gr('co_berta',-2),passo('co_berta')],fine:true},
    {t:'Prima dimmi che fine ha fatto la ragazza.',vai:'c'}]},
   c:{chi:'co_berta',testo:"«Sposata a un mugnaio, tre figli, mi manda i saluti coi mercanti. Non è lei che devo vendicare. Sono io che devo tornare.»",scelte:[
    {t:'Allora si torna.',effetti:[gr('co_berta',6),passo('co_berta')],fine:true}]}}},
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
   ["«La parola di un capitano. Me la segno qui, sotto la dose di corteccia di salice. Non farmela cancellare.»",
    "«Bende buone, almeno. Coprono quasi tutto. Quasi.»",
    "«Lo so. Anche al convento dicevano che il mondo è questo. Suor Nera, almeno, ci prega sopra. Io cucio.»"]),
  'lapo-addio':addio('lapo',"«Me ne vado, capitano. Ti lascio l'ago grosso e le pinze: a chi resta serviranno più che a me. Il vino si versa sulle ferite. Non prima, in gola.»",
   'Grazie di tutto, Lapo.','Lapo, avevo detto…',"«Avevi detto. Io invece avevo scritto. È la differenza tra un cerusico e un capitano: io quel che scrivo lo rileggo.»"),
  'lapo-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_lapo',testo:"«Una cosa da poco. Al convento mi chiusero fuori perché portavo dentro i lebbrosi della strada. Da allora non ho più messo piede in un chiostro. Vorrei vedere se trema la porta, o se tremo io.»",scelte:[
    {t:'Andiamo al primo monastero sulla strada.',effetti:[gr('co_lapo',3),passo('co_lapo')],vai:'b'},
    {t:'Ci andiamo. Ma niente prediche ai frati.',effetti:[gr('co_lapo',1),passo('co_lapo')],vai:'c'}]},
   b:{chi:'co_lapo',testo:"«Bene. Se il priore mi riconosce, tu fai la faccia da capitano severo. Ti riesce benissimo, sai.»",fine:true},
   c:{chi:'co_lapo',testo:"«Prediche, io? Taglio, cucio e taccio. Le prediche le lascio a chi ha fiato da sprecare.»",fine:true}}},
  'lapo-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_lapo',testo:"«Il portinaio non mi ha riconosciuto: la porta non ha tremato. Però in infermeria c'erano undici malati e un mortaio solo. Centoventi monete, capitano. Le lascio io, al prossimo monastero.»",scelte:[
    {t:'Le avrai. Sono monete della compagnia: ricordatelo.',effetti:[gr('co_lapo',2),passo('co_lapo')],vai:'b'},
    {t:'Prima ce le guadagniamo, poi vediamo.',effetti:[gr('co_lapo',-1),passo('co_lapo')],vai:'c'}]},
   b:{chi:'co_lapo',testo:"«Me lo ricorderò. E il conto lo tengo io, non Isabetta: lei ci metterebbe gli interessi.»",fine:true},
   c:{chi:'co_lapo',testo:"«Vediamo, sì. Intanto i malati aspettano. Sono bravissimi ad aspettare: ne hanno l'abitudine.»",fine:true}}},
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
   b:{chi:'co_ghino',testo:"«Sei sacchi di sale buono, portati da noi al primo villaggio che troviamo. Non per la coscienza. Per il nome.»",scelte:[
    {t:'Sei sacchi. Li compriamo strada facendo.',effetti:[gr('co_ghino',3),passo('co_ghino')],vai:'c'},
    {t:'Il sale lo paghi con la tua quota.',effetti:[gr('co_ghino',-2),gr('co_isa',2),passo('co_ghino')],vai:'d'}]},
   c:{chi:'co_ghino',testo:"«Conosco un salinaro che non bagna i sacchi. Non te lo presento: è timido coi capitani.»",fine:true},
   d:{chi:'co_ghino',testo:"«Con la mia quota. E va bene: il nome me lo pago da solo, come tutto il resto.»",fine:true}}},
  'ghino-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_ghino',testo:"«Resta Maralta. Alla dogana c'è un registro col mio nome: sei pagine di multe. Finché c'è quel registro, Ghino del Passo è un ricercato. Voglio entrare in un porto di Maralta a viso aperto.»",vai:'b'},
   b:{chi:'co_ghino',testo:"«Due strade. Pago le multe, cento monete, e il nome è pulito per sempre. Oppure una notte, un lume, e un registro che prende fuoco per sbaglio. Le conosco tutte e due.»",scelte:[
    {t:'Paghiamo. Si entra dalla porta.',se:{oro:100},effetti:[oro(-100),gr('co_ghino',2),gr('co_isa',3),ba('ghino-pulito'),passo('co_ghino')],vai:'c'},
    {t:'Il registro brucia.',effetti:[gr('co_ghino',6),gr('co_dia',-3),ba('ghino-registro'),passo('co_ghino')],vai:'d'}]},
   c:{chi:'co_ghino',testo:"«Pulito. Mi sentirò nudo per un mese. Isabetta dice che è il miglior affare della mia vita.»",fine:true},
   d:{chi:'co_ghino',testo:"«Brucia, sì. Fosca mi terrà il lume. E se qualcuno chiede, quella notte eravamo tutti a messa.»",fine:true}}},
  // ---- la Volpe Rossa: sorride sempre, non si spiega mai ----
  'volpe-1':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:"«Tu sei il capitano di cui parlano le osterie. Io sono quella di cui parlano quando hanno finito con te.» Sorride. «La strada è larga. Per ora.»",scelte:[
    {t:'Larga abbastanza per due. Spartiamola.',vai:'b'},
    {t:'Larga finché non mi intralci.',vai:'c'},
    {t:'Non tratto con chi cambia padrone ogni settimana.',vai:'d'}]},
   b:{chi:'rv_volpe',testo:"«Spartire. Che parola gentile.» Ti stringe la mano, e la stretta è vera. «A presto, socio.»",effetti:[ba('volpe-patto'),gr('co_isa',2),gr('co_ghino',2),ven('tappa')],fine:true},
   c:{chi:'rv_volpe',testo:"«Allora ci intralceremo. Sarà divertente.» Si tocca il cappello e se ne va senza voltarsi.",effetti:[ba('volpe-sfida'),gr('co_berta',3),gr('co_ulf',2),ven('tappa')],fine:true},
   d:{chi:'rv_volpe',testo:"«Ogni settimana? Esageri. Ogni mese.» Ride piano. «Me lo ricorderò, capitano. Io ricordo tutto.»",effetti:[ba('volpe-odio'),gr('co_dia',3),ven('tappa')],fine:true}}},
  'volpe-2':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:"«Le strade s'incrociano, capitano. Lo dicono i preti, i mercanti e i ladri. Io sono un po' tutti e tre.»",scelte:[
    {t:'Il nostro patto vale ancora?',se:'volpe-patto',vai:'b'},
    {t:'Che vuoi, Volpe?',se:'volpe-odio',vai:'c'},
    {t:'Hai la faccia di chi ha bisogno di qualcosa.',vai:'d'}]},
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
   a:{chi:'rv_volpe',testo:"«L'ultima volta, capitano. Un contratto mi porta lontano, e le cose lasciate a metà mi danno il prurito.» Accarezza la cavalla bianca. «Come chiudiamo?»",scelte:[
    {t:'Con l\'acciaio.',vai:'b'},
    {t:'Mi devi qualcosa, Volpe.',se:{o:['volpe-patto','volpe-debito']},vai:'c'},
    {t:'Con una stretta di mano.',vai:'d'}]},
   b:{chi:'rv_volpe',testo:"«Speravo che lo dicessi.» E sorride ancora, mentre sguaina.",effetti:[gr('co_berta',4),ven('scontro'),ven('tappa')],fine:true},
   c:{chi:'rv_volpe',testo:"«Ti devo qualcosa.» Smonta e ti porge le redini. «Si chiama Tramontana. Non frustarla: non serve.»",effetti:[ven('premio',{id:'rv_volpe'}),ven('tappa')],fine:true},
   d:{chi:'rv_volpe',testo:"«Una stretta di mano.» La tiene a lungo. «Nessuno dei due saprà mai chi avrebbe vinto. È il regalo più bello che ti lascio.»",effetti:[gr('co_lapo',3),ven('tappa')],fine:true}}}
 };
 // bandiere (i fatti copiati dal mondo) e ingressi (ogni scena può essere avviata dal mondo): calcolati dai nomi
 const bandiere=['fama','tappa','giorno'].concat(D.REGNI.map(f=>'serve-'+f));
 for(const c of D.COMPAGNI){const k=c.id.slice(3);bandiere.push('grad-'+k,'inc-'+k,'con-'+k)}
 return{id:'ventura',titolo:'Voci della compagnia',personaggi,bandiere,ingressi:Object.keys(scene),scene}})();
if(typeof module!=='undefined')module.exports=VVOC;
