/* ---- Eventi e missioni generati (A7): 30 incontri di strada e missioni secondarie fatte di tabelle, ripetibili dal seme (dati e regole pure). ----
   Tutto esce nel formato del racconto (`ARAC`): un evento è un capitolo-frammento con una scena, una missione generata ne ha qualcuna in più. Così la vista dei dialoghi,
   le prove e il validatore sono gli stessi del capitolo scritto a mano. Dadi: solo `AMON.mulberry(seme)` per scegliere, mai Math.random; le prove le tira `ARAC` col dado dello stato.
   Evento: { id, tag:[terreni] (vuoto = ovunque), notte:true|false|undefined, p (perdizione minima), testo, scelte:[ {t, tono, fine:[testo, effetti]} | {t, tono, prova:{ab,cd,ok:[testo, effetti],ko:[…]}} ] }. */
const AEVE=(()=>{
 const MON=typeof AMON!=='undefined'?AMON:require('./27m-avv-mondo.js'),ER=typeof EROI!=='undefined'?EROI:require('./27-eroi.js');
 const S=(t,testo,eff,tono)=>({t,tono,fine:[testo,eff||[]]}),P=(t,ab,cd,ok,ko,tono)=>({t,tono,prova:{ab,cd,ok,ko}});
 const oro=n=>({t:'oro',n}),xp=n=>({t:'xp',n}),pf=pct=>({t:'pf',pct}),perd=n=>({t:'perdizione',n}),raz=n=>({t:'razioni',n}),ogg=id=>({t:'oggetto',id,n:1}),bat=(fam,diff)=>({t:'battaglia',fam,diff});
 const EVENTI=[];const ev=(id,tag,testo,scelte,o)=>EVENTI.push(Object.assign({id,tag,testo,scelte},o||{}));
 ev('viandante-ferito',['strada','pianura','bosco','palude','collina'],'Un viandante è disteso a bordo strada, con una gamba sporca di sangue. Vi guarda senza la forza di chiedere.',[
  P('Medicarlo con quello che avete','medicina',11,['Gli fasciate la gamba con cura. Prima di ripartire vi mette in mano le poche monete che ha.',[oro(12),xp(10),perd(-1)]],['La ferita è più brutta del previsto. Fate quel che potete, ma non basta.',[perd(1)]],['pieta']),
  S('Frugargli nelle tasche','Quello che trovate non vale la sua occhiata, quando si accorge di voi.',[oro(15),perd(2)],['durezza']),
  S('Proseguire','Non è affar vostro. Il suo respiro vi resta nelle orecchie per un pezzo.',[perd(1)])]);
 ev('ponte-marcio',['strada','collina','palude','bosco','montagna'],'Il ponte sul torrente ha le assi nere di umidità e una trave spezzata a metà. Dall\'altra parte la strada riprende.',[
  P('Passare uno per volta, in punta di piedi','acrobazia',12,['Il ponte geme ma regge. Siete dall\'altra parte con l\'orgoglio intatto.',[xp(8)]],['Un\'asse cede sotto il peso: cadete nel fango e vi sbucciate tutti.',[pf(-.15)]]),
  S('Cercare un guado più a monte','Perdete un\'ora, ma passate asciutti e conoscete meglio il torrente.',[xp(5),raz(-1)])]);
 ev('carro-rotto',['strada','pianura','palude'],'Un carro di mercante è piantato nel fango con una ruota in pezzi. Il carrettiere impreca a mezza voce.',[
  P('Dare una mano a sollevarlo','atletica',11,['Con una spalla sotto l\'asse il carro torna in strada. Il mercante vi paga in monete e in ringraziamenti.',[oro(15),xp(8)]],['Il carro scivola e vi schiaccia una mano. Il mercante vi guarda a disagio.',[pf(-.1)]],['pieta']),
  S('Fare finta di non vedere','Tirate dritto. Il carrettiere smette di imprecare e vi guarda andare.',[perd(1)],['durezza'])]);
 ev('bivacco-abbandonato',['bosco','collina','pianura','palude','montagna'],'Tra gli alberi c\'è un bivacco spento da poco: ceneri tiepide, una coperta, una sacca lasciata a metà.',[
  P('Frugare tra le cose lasciate','percezione',12,['Sul fondo della sacca c\'è una pozione ancora sigillata.',[ogg('pozione-cura')]],['Non trovate nulla di utile, solo il sospetto che qualcuno vi stia guardando.',[perd(1)]]),
  S('Riposare accanto alle braci','Il fuoco è quasi spento ma il riparo è buono. Ripartite più freschi.',[pf(.15)]),
  S('Lasciare tutto com\'è','Il bivacco non è vostro. Proseguite.',[])],{notte:true});
 ev('lupo-in-trappola',['bosco','collina','montagna','palude'],'Un lupo grigio è preso in una tagliola, con la zampa sanguinante. Ringhia, ma non ha più la forza di mordere.',[
  P('Liberarlo con prudenza','sopravvivenza',12,['Allentate la molla senza farvi mordere. Il lupo vi fissa un attimo, poi si dilegua nel bosco.',[xp(15),perd(-1)]],['La tagliola scatta di nuovo e il lupo, nel panico, vi azzanna un braccio.',[pf(-.15)]],['pieta']),
  S('Finirlo','Un colpo netto, e tutto finisce. Resta solo il silenzio.',[xp(5)],['durezza']),
  S('Lasciarlo al suo destino','Non potete occuparvi di ogni bestia ferita del regno.',[])]);
 ev('fonte-dei-pellegrini',['collina','montagna','strada','bosco'],'Una fonte scorre da una roccia incisa con segni di pellegrini. Qualcuno ha lasciato monete e fiori sul bordo.',[
  S('Bere con calma','L\'acqua è gelida e dolce. Vi rimette in forze.',[pf(.2)]),
  S('Lasciare un\'offerta','Posate una moneta accanto alle altre. L\'aria intorno si fa meno pesante.',[oro(-5),perd(-2)],['pieta']),
  S('Prendere le monete','Sono poche, ma sono contanti. Non vi sentite bene.',[oro(10),perd(2)],['avidita'])]);
 ev('funghi-strani',['bosco','palude'],'In una radura crescono funghi dai cappelli screziati, belli e invitanti. Un vecchio cercatore ve ne offre un paniere.',[
  P('Riconoscere quelli buoni','sopravvivenza',11,['Scartate i velenosi e tenete gli altri: una bella scorta di cibo per la strada.',[raz(2),xp(5)]],['Ne mangiate uno che pareva buono. La nausea vi dura fino a sera.',[pf(-.1)]]),
  S('Comprare il paniere','Il cercatore vi pesa il paniere e vi vende un po\' di cibo sicuro.',[oro(-5),raz(1)]),
  S('Proseguire','I funghi belli sono quasi sempre quelli sbagliati.',[])]);
 ev('nebbia-fitta',['palude','pianura','bosco','collina','strada'],'La nebbia scende all\'improvviso. In pochi passi non si vede più il sentiero, né il compagno davanti.',[
  P('Orientarvi con il vento e il muschio','sopravvivenza',12,['Il muschio vi indica il nord, il vento il resto. Ritrovate la strada quasi subito.',[xp(10)]],['Girate in tondo per un\'ora. La nebbia pare farsi beffe di voi.',[perd(1),pf(-.05)]]),
  S('Aspettare che si alzi','Vi accampate sul posto e mangiate qualcosa. Quando la nebbia si dirada è quasi sera.',[raz(-1)])]);
 ev('croce-di-pietra',['strada','bosco','palude','montagna','collina'],'Una croce di pietra segna la tomba di un viaggiatore. Qualcuno ha ancora lasciato un nastro di stoffa rossa.',[
  S('Dire una preghiera','Vi fermate un minuto. La strada, dopo, sembra più leggera.',[perd(-1),xp(5)],['pieta']),
  S('Frugare tra le pietre','Qualche moneta e un anello di rame. Non è bello per niente.',[oro(10),perd(2)],['avidita']),
  S('Passare oltre','Salutate con un cenno e andate avanti.',[])]);
 ev('posto-di-blocco',['strada'],'Tre uomini in armi bloccano la strada con una corda tesa. «Il dazio è dovuto,» dice il più alto. Non hanno insegne.',[
  S('Pagare il dazio','Tirate fuori le monete. Il più alto le conta e vi lascia passare.',[oro(-15)]),
  P('Convincerli a lasciarvi passare','persuasione',13,['Parlate di un accordo vantaggioso per tutti. Tolgono la corda con un mezzo sorriso.',[xp(12)]],['Ridono del vostro discorso e il prezzo del dazio sale.',[oro(-25)]]),
  S('Spazzare via la corda','Mettete mano alle armi. I tre sembrano sorpresi quanto voi.',[bat('banditi','facile')],['durezza'])]);
 ev('pastore-smarrito',['collina','pianura'],'Un pastore chiama a gran voce un nome, ancora e ancora. Il suo cane è sparito nel crepuscolo e il gregge è inquieto.',[
  P('Aiutarlo a cercare il cane','percezione',11,['Lo trovate incastrato in un fosso, zoppo ma vivo. Il pastore vi riempie le mani di formaggio e monete.',[oro(10),raz(1),xp(10)]],['Cercate fino a sera senza trovare nulla. Il pastore vi ringrazia lo stesso.',[xp(3)]],['pieta']),
  S('Proseguire','Non avete tempo da perdere. Il suo grido vi accompagna per un tratto.',[])]);
 ev('vecchia-al-focolare',['bosco','collina','palude','montagna'],'Una vecchia vi invita a sedere accanto al suo focolare. «Un pasto caldo per un po\' di compagnia,» dice. Il suo sguardo vede più di quanto dovrebbe.',[
  S('Offrire una razione e sedersi','Mangiate in silenzio, poi lei vi canta una ninna nanna. Vi risvegliate più riposati.',[raz(-1),pf(.25),xp(5)]),
  P('Chiederle cosa vede nel vostro futuro','arcano',13,['Vi guarda a lungo, poi dice qualcosa che non capite subito ma che non dimenticherete.',[xp(15)]],['Il suo sguardo si incupisce. «Non voglio guardare oltre,» sussurra.',[perd(2)]]),
  S('Ringraziare e andare','«Come volete,» dice. Il fuoco si spegne appena siete usciti.',[])]);
 ev('frana-sul-sentiero',['montagna','collina'],'Una frana ha coperto il sentiero con massi grossi quanto cavalli. Per aggirarla servirebbe una mezza giornata.',[
  P('Aprirsi un varco a forza','atletica',13,['Faticate per un\'ora, ma il varco si apre. Qualcuno perde il fiato, ma tutti passano.',[xp(10)]],['Un masso rotola e vi coglie di striscio. Passate, ma ammaccati.',[pf(-.15)]]),
  S('Aggirare la frana','Girate largo e perdete mezza giornata, ma non vi fate male.',[raz(-1)])]);
 ev('pellegrini-in-marcia',['strada','montagna','collina'],'Una fila di pellegrini cammina in silenzio verso il prossimo santuario. Il più anziano vi fa un cenno.',[
  S('Dividere il cibo con loro','Mangiate insieme sul ciglio della strada. Il vecchio benedice la vostra tavola.',[raz(-1),perd(-2)],['pieta']),
  S('Chiedere notizie della strada','Vi parlano di un tratto allagato e di una taverna dove si mangia bene.',[xp(5)]),
  S('Salutare e proseguire','Vi guardano passare, senza rancore.',[])]);
 ev('scheletri-nel-campo',['pianura','collina','bosco','palude'],'Nel campo davanti a voi qualcosa si muove senza fare rumore: ossa che ricomponendosi scavano la terra con le mani.',[
  P('Aggirarli in silenzio','furtivita',12,['Passate a pochi passi dalle ossa che scavano. Nessuna si volta.',[xp(10)]],['Uno scricchiolio vi tradisce: i morti alzano il capo tutti insieme.',[bat('nonmorti','facile')]]),
  S('Affrontarli','Non volete lasciarli indietro. Sguainate le armi.',[bat('nonmorti','facile')],['durezza'])],{p:25});
 ev('voce-nel-bosco',['bosco'],'Nel buio una voce chiama il nome di uno di voi, dolce e conosciuta. Non c\'è nessuno tra gli alberi.',[
  P('Ascoltare da dove viene','percezione',13,['Era un uccello imitatore, appollaiato su un ramo. Vi guarda, vi riconosce e vola via.',[xp(10)]],['Seguite la voce per un tratto troppo lungo. Quando tornate indietro, il sentiero è un altro.',[perd(2)]]),
  S('Rispondere alla voce','«Chi sei?» chiedete. La voce ride piano e tace. Un brivido vi passa lungo la schiena.',[xp(10),perd(1)],['mistero']),
  S('Tapparsi le orecchie e proseguire','Camminate a testa bassa, con le mani sulle orecchie, finché la voce non si spegne.',[])],{notte:true});
 ev('ambulante-di-razioni',['strada','pianura'],'Un ambulante ha piantato un banchetto di cibo e corde ai bordi della strada. Vende a prezzi che non sono quelli del mercato.',[
  S('Comprare cibo per qualche moneta','Pagate quanto chiede e riempite la sacca.',[oro(-10),raz(2)]),
  P('Tirare sul prezzo','persuasione',12,['L\'ambulante sbuffa, poi alza le mani. Riempite la sacca a un prezzo onesto.',[oro(-4),raz(2)]],['Non cede di un soldo, e vi guarda male per averci provato.',[oro(-12),raz(2)]]),
  S('Non serve niente','Salutate con un cenno.',[])]);
 ev('cappella-in-rovina',['collina','pianura','bosco','montagna','palude'],'Una piccola cappella di pietra, senza tetto, sorge in mezzo ai rovi. Sull\'altare brilla qualcosa.',[
  P('Esplorare tra le macerie','percezione',12,['Sotto l\'altare c\'è un pacchetto di monete. Chi l\'ha nascosto non ne avrà più bisogno.',[oro(20),xp(5)]],['Un architrave cede e vi sfiora la testa. Meglio non insistere.',[pf(-.1)]]),
  S('Dire una preghiera sulla soglia','Nessuno risponde, ma pregare vi tranquillizza.',[perd(-1)],['pieta']),
  S('Lasciar perdere','Le rovine sono quasi sempre una trappola.',[])]);
 ev('tempesta',['collina','montagna','pianura','bosco','palude'],'Il cielo si fa livido in un attimo, poi il vento vi sbatte addosso la pioggia di traverso. Un tuono vi fa sobbalzare tutti.',[
  P('Cercare un riparo','sopravvivenza',12,['Trovate una grotta a pochi passi: restate all\'asciutto finché il peggio non è passato.',[xp(5)]],['Il riparo che trovate è peggio della pioggia. Passate la notte fradici.',[pf(-.15)]]),
  S('Proseguire sotto la pioggia','Stringete i denti e andate avanti. Arrivate infreddoliti ma puntuali.',[pf(-.1),xp(5)])]);
 ev('gazza-ladra',['strada','bosco'],'Una gazza vi sfila dalla cintura una moneta lucida e punta verso un vecchio frassino. Sta già infilandola in una cavità tra i rami.',[
  P('Inseguirla fino al nido','acrobazia',12,['Arrampicarsi è facile, il nido è pieno di cose luccicanti. Tornate giù con il bottino.',[oro(15)]],['Il ramo si spezza e cadete in malo modo.',[pf(-.1),oro(-5)]]),
  S('Lasciarle la moneta','Una gazza deve pur mangiare. Anzi, nutrirsi di cose lucide.',[oro(-1)])]);
 ev('villaggio-sbarrato',['pianura','strada'],'Le porte del villaggio sono sbarrate e dalle finestre spuntano forconi. «Tornate indietro!» grida una voce. «Abbiamo visto cose, di notte!»',[
  P('Convincerli ad aprire','persuasione',13,['Dopo un lungo scambio di parole, un\'anziana apre uno spiraglio e vi porge pane e formaggio.',[raz(2),xp(10)]],['Rispondono con insulti e un sasso. Il discorso non ha funzionato.',[perd(1)]],['pieta']),
  P('Farli tremare, a modo vostro','intimidire',12,['Mostrate l\'acciaio. La porta si apre e le provviste escono da sole.',[raz(3),perd(2)]],['Qualcuno ride dall\'alto. Non vi resta che andarvene con un po\' di vergogna.',[perd(1)]],['durezza']),
  S('Tirare dritto','Non siete i benvenuti. Andate.',[])],{p:25});
 ev('edicola-di-strada',['strada','collina','bosco','montagna','pianura'],'Un\'edicola di legno custodisce una piccola statua della Dama delle Strade, con una candela ancora tiepida davanti.',[
  S('Lasciare un fiore e una preghiera','Mettete un fiore sulla mensola. Il vento sembra ritirarsi per un istante.',[perd(-2)],['pieta']),
  S('Prendere le offerte','Qualche moneta di rame e un pezzo di pane. Il peso sul petto cresce.',[oro(10),perd(2)],['avidita']),
  S('Proseguire','Salutate la statua con un cenno e andate oltre.',[])]);
 ev('mulino-abbandonato',['pianura','strada'],'Un mulino senza pale si staglia contro il cielo. Dentro c\'è asciutto, e le stanze hanno ancora i letti.',[
  P('Riposare, ma con un occhio aperto','percezione',11,['Dormite a turno e nulla vi disturba. All\'alba siete in forma.',[pf(.2)]],['Un ruggito nella notte vi sveglia: i ratti del mulino non erano soli.',[bat('bestie','facile')]]),
  S('Restare all\'aperto','Meglio non fidarsi dei mulini vuoti.',[])],{notte:true});
 ev('luci-fatue',['palude'],'Sopra la palude danzano lucine azzurre. Si muovono come se aspettassero qualcuno, e il sentiero sembra seguirle.',[
  P('Capire cosa sono, con un po\' di studio','arcano',13,['Sono gas e polvere di luce, non spiriti. Ne raccogliete un po\' in una fiala.',[ogg('bomba-fuoco'),xp(8)]],['Le luci vi attirano in un pantano. Uscite sporchi e spaventati.',[pf(-.1),perd(2)]]),
  P('Evitarle con cura','sopravvivenza',11,['Girate al largo e ritrovate la strada senza problemi.',[xp(5)]],['Le luci vi seguono per un tratto e vi stancano.',[pf(-.05)]]),
  S('Aspettare che si spengano','Resta il dubbio che vi guardassero.',[raz(-1)])],{notte:true});
 ev('frutteto-selvatico',['pianura','bosco'],'Un frutteto cresciuto senza padrone offre mele rosse e pere dure. L\'aria sa di sidro.',[
  S('Raccogliere quanto portate','Una buona scorta di frutta per i prossimi giorni.',[raz(2)]),
  P('Cercare le pere migliori','percezione',11,['In fondo al filare trovate un albero di pere dolcissime, più buone di qualunque banchetto.',[raz(2),pf(.1)]],['Le uniche pere buone le hanno già mangiate i tordi.',[raz(1)]])],{notte:false});
 ev('orme-di-lupi',['bosco','collina','montagna'],'Nel fango fresco corrono orme di lupi, tante, tutte dirette verso lo stesso punto. Sono di poche ore fa.',[
  P('Cancellare le vostre tracce','sopravvivenza',12,['Coprite le orme con rami e fango. Il branco passa senza accorgersi di voi.',[xp(8)]],['Fate tanto rumore che il branco vi raggiunge.',[bat('bestie','facile')]]),
  S('Seguire le orme','Vi interessa sapere cosa mangiano i lupi di quella zona.',[bat('bestie','medio')],['durezza']),
  S('Deviare per un altro sentiero','Perdete un po\' di tempo ma evitate il peggio.',[raz(-1)])]);
 ev('cavaliere-errante',['strada'],'Un cavaliere sul ciglio della strada vi sbarra il passo, l\'elmo sotto il braccio. «Nessuno passa senza una prova di valore,» dice, quasi scusandosi.',[
  P('Accettare la sfida di forza','atletica',13,['Lo battete a braccio di ferro. Il cavaliere ride, vi stringe la mano e vi lascia una borsa.',[xp(15),oro(10)]],['Il cavaliere vi stende con garbo. «Siete forti, ma non ancora abbastanza,» dice.',[pf(-.2)]],['onore']),
  S('Rifiutare con rispetto','Il cavaliere vi saluta con un inchino e si fa da parte.',[xp(3)],['onore']),
  S('Passare senza fermarsi','Lo superate come se non esistesse. Il cavaliere resta con la bocca aperta.',[perd(1)],['durezza'])]);
 ev('viandante-con-enigma',['strada','pianura'],'Un viandante vi propone un enigma: «Chi lo scioglie ottiene la mia moneta d\'argento. Chi sbaglia mi offre un passaggio.»',[
  P('Provare a risolverlo','storia',12,['Ci pensate un momento, poi rispondete. Il viandante vi dà la moneta e un sorriso.',[oro(20),xp(10)]],['Sbagliate, e lui vi guarda con aria dolce. Gli pagate un boccale.',[oro(-5),xp(3)]]),
  S('Declinare','Non avete tempo per i giochi. Il viandante si stringe nelle spalle.',[])]);
 ev('ombra-sul-sentiero',[],'Un\'ombra vi segue da qualche ora, senza fretta. Quando vi voltate, non c\'è nulla. Quando guardate avanti, è di nuovo là.',[
  P('Affrontarla con le parole giuste','arcano',14,['Pronunciate un\'invocazione antica. L\'ombra si scioglie in un respiro e l\'aria si fa più leggera.',[perd(-3),xp(15)]],['L\'ombra si stringe intorno a voi come un mantello gelato e per un momento vi toglie il fiato.',[perd(3),pf(-.15)]]),
  S('Correre via','Correte finché le gambe non reggono. L\'ombra pare aver pazienza.',[perd(1),pf(-.05)])],{p:50});
 ev('grido-nella-notte',[],'Un grido di aiuto spezza il silenzio, poi un altro, più debole. Viene da un fosso lungo la strada.',[
  P('Capire se è un\'esca','percezione',13,['Il grido è sempre uguale, a intervalli regolari. Qualcuno vi aspetta con un\'imboscata ma voi non cadrete nel tranello.',[xp(10)]],['Cadete in pieno nell\'esca: quattro uomini balzano dal fosso.',[bat('banditi','medio')]]),
  S('Accorrere in fretta','Correte al fosso. Non c\'è nessuno da salvare, ma ci sono eccome i suoi compari.',[bat('banditi','medio')],['pieta']),
  S('Restare fermi e aspettare','Il grido si spegne. Vi restano il silenzio e un po\' di rimorso.',[perd(1)])],{notte:true});
 // ---- scelta dell'evento ----
 const prng=seme=>MON.mulberry(seme>>>0);
 // eventi adatti al luogo e al momento: terreno, notte (true/false), perdizione; `usati` = id già visti (si ripetono solo se non resta altro)
 function adatti(o){o=o||{};return EVENTI.filter(e=>(!e.tag.length||!o.terreno||e.tag.includes(o.terreno))&&(e.notte==null||e.notte===!!o.notte)&&(e.p==null||(o.perdizione|0)>=e.p))}
 function eventoStrada(seme,o){o=o||{};const A=adatti(o),nuovi=A.filter(e=>!(o.usati||[]).includes(e.id)),L=nuovi.length?nuovi:A;if(!L.length)return null;return L[Math.floor(prng(seme)()*L.length)]}
 // l'evento come scena del racconto: la scena `a` offre le scelte, ogni esito è un nodo con gli effetti e la fine
 function scena(e){const N={},nodo=(t,eff)=>{const id='r'+Object.keys(N).length;N[id]=Object.assign({chi:'_',testo:t,fine:true},eff&&eff.length?{effetti:eff}:{});return id};
  const sc=e.scelte.map(c=>{const o={t:c.t};if(c.tono)o.tono=c.tono.slice();
   if(c.prova){const p=c.prova;o.prova={ab:p.ab,cd:p.cd,ok:{vai:nodo(p.ok[0],p.ok[1])},ko:{vai:nodo(p.ko[0],p.ko[1])}}}else o.vai=nodo(c.fine[0],c.fine[1]);return o});
  N.a={chi:'_',testo:e.testo,scelte:sc};return{inizio:'a',nodi:N}}
 const capitolo=e=>({id:'evento-'+e.id,titolo:e.titolo||e.id,personaggi:{},scene:{[e.id]:scena(e)},ingressi:[e.id]});
 // ---- missioni secondarie generate ----
 const CLIENTI=[['Gerardo il fattore','umano','guerriero'],['Marta la levatrice','umano','chierico'],['Frate Anselmo','umano','chierico'],['Rosalba la mercante','piccolo','bardo'],['Tullio il cacciatore','elfo','esploratore'],
  ['Agnese la vedova','umano','chierico'],['Bruno il maniscalco','nano','guerriero'],['Iolanda la pellegrina','elfo','bardo'],['Osvaldo il mugnaio','piccolo','ladro'],['Berta la locandiera','nano','chierico']];
 const OGGETTI=['il sigillo di famiglia','la campana della cappella','il corno da caccia del nonno','un ciondolo d\'argento','il libro dei conti','la lanterna di famiglia'];
 const NEMICI={antro:[['banditi','una banda di briganti'],['bestie','un branco di lupi affamati']],rovina:[['nonmorti','scheletri che non riposano'],['banditi','una banda di predoni']],torre:[['torre','creature uscite dalla torre'],['banditi','un mago rinnegato e i suoi seguaci']]};
 const TIPI=['recupero','caccia','salvataggio','indagine','consegna'],COMPLICAZIONI=['nessuna','scadenza','imboscata','doppiogioco','rivale','maledizione'];
 const BERSAGLI=['antro','rovina','torre'];
 const ASP=ER.ASPETTO,aspettoDa=r=>Object.fromEntries(Object.keys(ASP).map(k=>[k,Math.floor(r()*ASP[k])]));
 // missione dal seme e dal mondo: { luoghi:[{id,tipo,nome}], giorno, liv, origine (id del luogo del cliente, se no uno sicuro) }.
 // Restituisce un capitolo-frammento (valido per ARAC.valida), con `missione` (id), `tipo`, `complicazione`, `entro` (giorno limite o null).
 function missione(seme,m){m=m||{};const r=prng(seme),pick=a=>a[Math.floor(r()*a.length)],liv=Math.max(1,m.liv|0||1),L=m.luoghi||[];
  const sicuri=L.filter(l=>l.tipo==='villaggio'||l.tipo==='citta'),bersagli=L.filter(l=>BERSAGLI.includes(l.tipo));if(!sicuri.length||!bersagli.length)return null;
  const origine=sicuri.find(l=>l.id===m.origine)||pick(sicuri),meta=pick(bersagli),tipo=pick(TIPI),comp=pick(COMPLICAZIONI);
  const cliente=pick(CLIENTI),[fam,nemicoTxt]=pick(NEMICI[meta.tipo]),cosa=pick(OGGETTI),id='gen-'+(seme>>>0).toString(36),mid='m-'+id;
  const diff=meta.tipo==='torre'?'difficile':'medio',per=aspettoDa(r);
  const base={recupero:{t:'Il bene perduto di '+cliente[0].split(' ')[0],o:`«Ho perso ${cosa} in ${meta.nome}. Se lo riportate, vi pagherò come posso.»`,a:`Raggiungete ${meta.nome}: ${nemicoTxt} custodiscono ciò che cercate.`,f:`Tornate da ${cliente[0]} con ${cosa}.`},
   caccia:{t:'La minaccia di '+meta.nome,o:`«${nemicoTxt[0].toUpperCase()+nemicoTxt.slice(1)} infestano ${meta.nome}: nessuno osa più andare ai campi. Fateli smettere.»`,a:`${nemicoTxt[0].toUpperCase()+nemicoTxt.slice(1)} vi aspettano a ${meta.nome}.`,f:`Tornate da ${cliente[0]} a dire che è finita.`},
   salvataggio:{t:'Il figlio di '+cliente[0].split(' ')[0],o:`«Mio figlio è sparito vicino a ${meta.nome}. Dicono che ${nemicoTxt} lo tengano prigioniero.»`,a:`Il ragazzo è prigioniero a ${meta.nome}, sorvegliato da ${nemicoTxt}.`,f:`Riportate il ragazzo a ${cliente[0]}.`},
   indagine:{t:'Le luci di '+meta.nome,o:`«Di notte si vedono luci a ${meta.nome}. Scoprite cos'è e fermatelo.»`,a:`A ${meta.nome} le luci sono quelle di ${nemicoTxt}.`,f:`Riferite a ${cliente[0]} che cosa avete visto.`},
   consegna:{t:'Un pacco per '+meta.nome,o:`«Portate questo pacco al custode di ${meta.nome}. Il sentiero è duro e ${nemicoTxt} si sono insediati là.»`,a:`Il pacco arriverà al custode di ${meta.nome} solo se vi aprite la strada: ${nemicoTxt} vi aspettano.`,f:`Tornate da ${cliente[0]} con la ricevuta.`}}[tipo];
  const mult=comp==='rivale'?1.5:1,premioOro=Math.round((20+12*liv)*mult),premioXp=25+10*liv,ric=[oro(premioOro),xp(premioXp)];if(r()<.4)ric.push({t:'oggetto',id:liv>=3?'pozione-cura-maggiore':'pozione-cura',n:1});
  const entro=comp==='scadenza'?(m.giorno|0)+4:null,at=`${id}-fatto`;
  const sceneArr={};
  // offerta: il cliente chiede, si accetta, si tratta, si rifiuta
  const nO={
   a:{chi:'cl',testo:base.o+(entro?` «E presto: mi serve entro il giorno ${entro}.»`:''),scelte:[
    {t:'Accetto',tono:['pieta'],effetti:[{t:'missione',id:mid},{t:'bandiera',id:id+'-accettata'}],vai:'ok'},
    {t:'Voglio di più',prova:{ab:'persuasione',cd:11+Math.floor(liv/2),ok:{vai:'ok',testo:'Ci pensa un attimo, poi annuisce.',effetti:[{t:'missione',id:mid},{t:'bandiera',id:id+'-accettata'},oro(Math.round(premioOro*.3))]},ko:{vai:'no',testo:'Si irrigidisce.'}},tono:['avidita']},
    {t:'No, mi dispiace',vai:'no'}]},
   ok:{chi:'cl',testo:'«Che il cielo vi accompagni.»',fine:'accettata'},
   no:{chi:'cl',testo:'«Capisco. Cercherò altrove.»',fine:'rifiutata'}};
  sceneArr.offerta={inizio:'a',nodi:nO};
  // arrivo: la battaglia, poi (per l'indagine) una prova; se c'è la complicazione si vede qui
  const nA={a:{chi:'_',testo:base.a,effetti:comp==='imboscata'?[bat('banditi','facile')]:[],vai:'b'},
   b:{chi:'_',testo:tipo==='indagine'?'Prima di entrare, vi fermate a guardare.':'Non c\'è altra via: bisogna entrare.',
    scelte:tipo==='indagine'?[{t:'Osservo prima di entrare',prova:{ab:'percezione',cd:11+Math.floor(liv/2),ok:{vai:'c',testo:'Notate un varco laterale: potete cogliere i vostri avversari di sorpresa.',effetti:[xp(10)]},ko:{vai:'c'}}},{t:'Entro',vai:'c'}]:undefined,
    vai:tipo==='indagine'?undefined:'c'},
   c:{chi:'_',testo:'Lo scontro è inevitabile.',effetti:[bat(fam,diff),{t:'bandiera',id:at}].concat(comp==='maledizione'?[perd(3)]:[]),vai:'d'},
   d:{chi:'_',testo:comp==='maledizione'?'Una cosa fredda e antica vi sfiora e passa. Vi resta addosso un brivido.':`Fatto: ${base.f}`,fine:'fatto'}};
  if(!nA.b.scelte)delete nA.b.scelte;if(nA.b.vai==null)delete nA.b.vai;
  sceneArr.arrivo={titolo:'Il luogo dell\'incarico',dove:meta.id,se:[{missione:mid},{non:{bandiera:at}}],inizio:'a',nodi:nA};
  // ritorno: il cliente paga; con il doppio gioco prova a pagare di meno
  const nR={a:{chi:'cl',testo:comp==='doppiogioco'?'«Ottimo lavoro. Ecco la parte che vi spetta…» Il cliente conta le monete con una lentezza sospetta.':'«Siete tornati! Ecco quanto vi avevo promesso.»',
   scelte:comp==='doppiogioco'?[{t:'Contare le monete',prova:{ab:'percezione',cd:12,ok:{vai:'giusto',testo:'Il conto non torna. Lo guardate in faccia finché non aggiunge il resto.',effetti:[oro(Math.round(premioOro*.5))]},ko:{vai:'meno',testo:'Vi accorgete troppo tardi che mancano delle monete.'}}},{t:'Fidarsi',vai:'meno'}]:undefined,
   vai:comp==='doppiogioco'?undefined:'giusto'},
   giusto:{chi:'cl',testo:'«Vi ringrazio ancora.»',effetti:[{t:'missione',id:mid,stato:'fatta'}],fine:'pagata'},
   meno:{chi:'cl',testo:'«Ora, se non vi dispiace, ho da fare.»',effetti:[{t:'missione',id:mid,stato:'fatta'},oro(-Math.round(premioOro*.4))],fine:'truffata'}};
  if(!nR.a.scelte)delete nR.a.scelte;if(nR.a.vai==null)delete nR.a.vai;if(comp!=='doppiogioco')delete nR.meno;
  sceneArr.ritorno={titolo:'Il ritorno dal cliente',dove:origine.id,se:[{missione:mid},{bandiera:at}],inizio:'a',nodi:nR};
  const cap={id,titolo:base.t,personaggi:{cl:{nome:cliente[0],razza:cliente[1],classe:cliente[2],aspetto:per}},missioni:{[mid]:{titolo:base.t,descr:base.o.replace(/[«»]/g,''),ricompensa:ric,scena:'offerta'}},
   luoghi:{[origine.id]:{nome:origine.nome},[meta.id]:{nome:meta.nome}},bandiere:[],ingressi:['offerta'],scene:sceneArr,sommario:[{se:{missione:mid,stato:'fatta'},testo:`Avete concluso il lavoro per ${cliente[0]}: ${base.t.toLowerCase()}.`},{se:{missione:mid,stato:'attiva'},testo:`Avete promesso a ${cliente[0]}: ${base.t.toLowerCase()}.`}]};
  return Object.assign(cap,{missione:mid,tipo,complicazione:comp,entro,origine:origine.id,meta:meta.id,ricompensa:ric,cliente:cliente[0]})}
 // una missione a scadenza è fallita se oggi è oltre il giorno limite
 const scaduta=(cap,giorno)=>cap.entro!=null&&giorno>cap.entro;
 return{EVENTI,TIPI,COMPLICAZIONI,adatti,eventoStrada,scena,capitolo,missione,scaduta}})();
if(typeof module!=='undefined')module.exports=AEVE;
