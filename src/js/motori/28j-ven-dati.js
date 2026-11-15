/* ---- Compagnia di ventura (Cantari di Ventura, piano C): i dati del mondo libero. Regole pure, senza DOM né rete. ----
   Fazioni, truppe con le loro linee di promozione e il loro aspetto, merci, oggetti (armi, scudi, armature, elmi, cavalli,
   cimeli), compagni, capibanda, tratti dei signori, nomi, tipi di luogo.
   Unica fonte: i numeri di truppe, merci e oggetti si ritoccano qui, mai nei motori (28k mondo, 28l campo) né nelle viste.
   Piano: docs/VENTURA.md. */
const VDAT=(()=>{
 // fazioni: cinque regni, i predoni, i mercenari, i luoghi di nessuno (`neu`) e la compagnia di chi gioca (`tu`)
 const FAZ={
  val:{nome:'Regno di Valdoro',breve:'Valdoro',col:'#b3262b',col2:'#e8b23a',re:'re Aldemaro',forte:'c',motto:'Cavalieri pesanti e balestre'},
  sel:{nome:'Lega di Selvamara',breve:'Selvamara',col:'#2f7d46',col2:'#e9e2c4',re:'la reggente Isotta',forte:'t',motto:'Archi lunghi e battistrada'},
  fer:{nome:'Marca di Ferropietra',breve:'Ferropietra',col:'#2f5f9e',col2:'#c9d3dc',re:'il margravio Oddone',forte:'f',motto:'Picche, alabarde e mura'},
  mar:{nome:'Repubblica di Maralta',breve:'Maralta',col:'#17878c',col2:'#f4f0e2',re:'il console Lazzaro',forte:'t',motto:'Balestre, navi e mercanti'},
  alt:{nome:'Clan di Altavento',breve:'Altavento',col:'#c57a1c',col2:'#2b2420',re:'la capoclan Temra',forte:'c',motto:'Arcieri a cavallo della steppa'},
  pre:{nome:'Predoni',breve:'Predoni',col:'#3a3230',col2:'#a8a093'},
  mer:{nome:'Gente di ventura',breve:'Ventura',col:'#6b4a8a',col2:'#e0d6ea'},
  neu:{nome:'Terra di nessuno',breve:'Liberi',col:'#8a8172',col2:'#e6dcc6'},
  tu:{nome:'La tua compagnia',breve:'Compagnia',col:'#d98a1f',col2:'#fff4d6'}};
 const REGNI=['val','sel','fer','mar','alt'];
 // archetipi: classe f = fanti, t = tiratori, c = cavalieri (a3/a4 = arcieri a cavallo: cavalieri che tirano). git = gittata in passi
 const ARCH={
  f1:{t:1,c:'f',pf:22,att:8,dif:6,dan:5,git:0,vel:10,paga:1},
  f2:{t:2,c:'f',pf:30,att:11,dif:10,dan:7,git:0,vel:10,paga:3},
  t2:{t:2,c:'t',pf:24,att:10,dif:6,dan:6,git:24,vel:10,paga:3},
  f3:{t:3,c:'f',pf:38,att:14,dif:14,dan:9,git:0,vel:10,paga:6},
  t3:{t:3,c:'t',pf:28,att:13,dif:8,dan:8,git:28,vel:10,paga:6},
  c3:{t:3,c:'c',pf:40,att:13,dif:11,dan:9,git:0,vel:19,paga:9},
  a3:{t:3,c:'c',pf:34,att:12,dif:9,dan:7,git:20,vel:20,paga:10},
  f4:{t:4,c:'f',pf:48,att:18,dif:18,dan:12,git:0,vel:10,paga:11},
  t4:{t:4,c:'t',pf:32,att:17,dif:10,dan:10,git:32,vel:10,paga:11},
  c4:{t:4,c:'c',pf:56,att:18,dif:17,dan:13,git:0,vel:18,paga:16},
  a4:{t:4,c:'c',pf:42,att:16,dif:12,dan:9,git:24,vel:21,paga:17}};
 const SU={f1:['f2','t2'],f2:['f3','c3'],t2:['t3'],f3:['f4'],t3:['t4'],c3:['c4']};
 const SU_ALT={t2:['t3','a3'],a3:['a4']};
 const NOMI_T={
  val:{f1:'Villano',f2:'Fante di Valdoro',t2:'Balestriere',f3:'Sergente',t3:'Balestriere scelto',c3:'Scudiero',f4:'Guardia dorata',t4:'Balestriere del re',c4:'Cavaliere di Valdoro'},
  sel:{f1:'Boscaiolo',f2:'Lanciere dei boschi',t2:'Arciere',f3:'Custode',t3:'Arciere lungo',c3:'Battistrada',f4:'Guardiano antico',t4:'Maestro d\'arco',c4:'Cavaliere del cervo'},
  fer:{f1:'Minatore',f2:'Picchiere',t2:'Fromboliere',f3:'Alabardiere',t3:'Balestriere di rocca',c3:'Scorridore',f4:'Guardia di ferro',t4:'Maestro di balestra',c4:'Corazziere'},
  mar:{f1:'Mozzo',f2:'Fante di marina',t2:'Balestriere di bordo',f3:'Nostromo',t3:'Balestriere di galea',c3:'Cavalleggero',f4:'Guardia del console',t4:'Maestro balestriere',c4:'Cavaliere di Maralta'},
  alt:{f1:'Pastore',f2:'Guerriero del clan',t2:'Arciere della steppa',f3:'Veterano del clan',t3:'Occhio di falco',c3:'Predatore',a3:'Arciere a cavallo',f4:'Giurato della capoclan',t4:'Voce del tuono',c4:'Lancia d\'Altavento',a4:'Cavaliere del vento'}};
 const TR={};
 const arr=(x)=>Math.round(x);
 for(const f of REGNI)for(const a of Object.keys(ARCH)){if((a==='a3'||a==='a4')&&f!=='alt')continue;const b=ARCH[a],k=FAZ[f].forte===b.c?1.15:1,su=(f==='alt'&&SU_ALT[a])||SU[a]||[];
  TR[f+'_'+a]={id:f+'_'+a,nome:NOMI_T[f][a],faz:f,arch:a,t:b.t,c:b.c,pf:arr(b.pf*(k>1&&b.c!=='t'?1.1:1)),att:arr(b.att*k),dif:arr(b.dif*(k>1&&b.c==='f'?1.15:1)),dan:arr(b.dan*(k>1&&b.c==='c'?1.15:1)),
   git:arr(b.git*(k>1&&b.c==='t'?1.15:1)),vel:b.vel,paga:b.paga,su:su.map(x=>f+'_'+x)}}
 const extra=(id,nome,faz,a,m)=>{const b=ARCH[a];TR[id]=Object.assign({id,nome,faz,arch:a,t:b.t,c:b.c,pf:b.pf,att:b.att,dif:b.dif,dan:b.dan,git:b.git,vel:b.vel,paga:b.paga,su:[]},m||{})};
 extra('pre_f1','Tagliaborse','pre','f1',{su:['pre_f2','pre_t2']});extra('pre_f2','Brigante','pre','f2',{su:['pre_f3']});extra('pre_t2','Bracconiere','pre','t2');
 extra('pre_c3','Razziatore','pre','c3',{dif:8});extra('pre_f3','Capobanda','pre','f3');extra('pre_f4','Spaccateste','pre','f4',{dif:13,paga:9});
 extra('mer_f3','Spadaccino di ventura','mer','f3',{paga:9,su:['mer_f4']});extra('mer_t3','Balestriere di ventura','mer','t3',{paga:9});
 extra('mer_c4','Lancia spezzata','mer','c4',{paga:22});extra('mer_f4','Doppiosoldo','mer','f4',{paga:15});
 // prezzi d'ingaggio e di promozione, esperienza per salire di rango
 const INGAGGIO={1:10,2:40,3:110,4:260},PROMO={1:15,2:45,3:120},XP_SU={1:8,2:22,3:50};
 const valore=t=>{const x=typeof t==='string'?TR[t]:t;return x.pf/10*(x.att+x.dif+x.dan*1.5+(x.git?4:0)+(x.c==='c'?5:0))/10};
 // ---- aspetto delle truppe: ogni regno ha il suo taglio (elmi, armi, scudi, mantelli), ogni rango la sua corazza ----
 // elmo: nuda paglia cappuccio berretto pelliccia cervelliera bacinetto crestato piuma corna · arma: spada sciabola ascia mazza lancia
 // picca alabarda spadone arco balestra · scudo: tondo mandorla pavese · cor: 0 panno, 1 cuoio, 2 maglia, 3 piastre · mant: mantello · barda: cavallo bardato
 const A=(elmo,arma,scudo,cor,m)=>Object.assign({elmo,arma,scudo:scudo||null,cor},m||{});
 const ASP={
  val:{f1:A('paglia','lancia',0,0),f2:A('cervelliera','lancia','mandorla',1),t2:A('cervelliera','balestra',0,1),f3:A('bacinetto','spada','mandorla',2),t3:A('bacinetto','balestra',0,2),c3:A('bacinetto','lancia','mandorla',2),
   f4:A('crestato','spada','mandorla',3,{mant:1}),t4:A('crestato','balestra','pavese',3),c4:A('crestato','lancia','mandorla',3,{mant:1,barda:1})},
  sel:{f1:A('cappuccio','ascia',0,0),f2:A('cappuccio','lancia','tondo',1,{mant:1}),t2:A('cappuccio','arco',0,0,{mant:1}),f3:A('cervelliera','spada','tondo',2,{mant:1}),t3:A('cappuccio','arco',0,1,{mant:1}),c3:A('cappuccio','lancia','tondo',1,{mant:1}),
   f4:A('corna','spadone',0,3,{mant:1}),t4:A('corna','arco',0,2,{mant:1}),c4:A('corna','lancia','tondo',3,{mant:1,barda:1})},
  fer:{f1:A('nuda','mazza',0,0),f2:A('cervelliera','picca',0,1),t2:A('cervelliera','arco',0,0),f3:A('bacinetto','alabarda',0,2),t3:A('bacinetto','balestra','pavese',2),c3:A('bacinetto','lancia','tondo',2),
   f4:A('bacinetto','alabarda',0,3),t4:A('crestato','balestra','pavese',3),c4:A('crestato','mazza','mandorla',3,{barda:1})},
  mar:{f1:A('berretto','spada',0,0),f2:A('cervelliera','spada','tondo',1),t2:A('berretto','balestra',0,1),f3:A('bacinetto','alabarda',0,2),t3:A('cervelliera','balestra','pavese',2),c3:A('piuma','lancia','tondo',2),
   f4:A('piuma','spada','mandorla',3,{mant:1}),t4:A('piuma','balestra','pavese',3),c4:A('piuma','lancia','mandorla',3,{mant:1,barda:1})},
  alt:{f1:A('pelliccia','lancia',0,0),f2:A('pelliccia','sciabola','tondo',1),t2:A('pelliccia','arco',0,0),f3:A('pelliccia','ascia','tondo',2),t3:A('pelliccia','arco',0,1),c3:A('pelliccia','sciabola','tondo',1),a3:A('pelliccia','arco',0,1),
   f4:A('crestato','sciabola','tondo',3,{mant:1}),t4:A('crestato','arco',0,2),c4:A('crestato','lancia','tondo',3,{barda:1}),a4:A('crestato','arco',0,2,{mant:1})},
  pre:{f1:A('nuda','mazza',0,0),f2:A('cappuccio','ascia',0,1),t2:A('cappuccio','arco',0,0),c3:A('cappuccio','sciabola',0,1),f3:A('pelliccia','ascia','tondo',1,{mant:1}),f4:A('corna','spadone',0,2,{mant:1})},
  mer:{f3:A('piuma','spadone',0,2),t3:A('piuma','balestra',0,2),c4:A('piuma','lancia','mandorla',3,{barda:1}),f4:A('piuma','alabarda',0,3,{mant:1})}};
 const aspetto=tid=>{const T=TR[tid];if(!T)return A('nuda','spada',0,0);if(T.asp)return T.asp;return(ASP[T.faz]&&ASP[T.faz][T.arch])||ASP.val[T.arch]||A('cervelliera','spada',0,1)};
 // merci: base = prezzo di riferimento, cibo = razioni che vale una unità
 const MERCI={
  grano:{nome:'Grano',base:12,cibo:1},carne:{nome:'Carne salata',base:20,cibo:1},pesce:{nome:'Pesce secco',base:16,cibo:1},
  vino:{nome:'Vino',base:34},lana:{nome:'Lana',base:44},sale:{nome:'Sale',base:52},ferro:{nome:'Ferro',base:66},
  attrezzi:{nome:'Attrezzi',base:96},velluto:{nome:'Velluto',base:170},spezie:{nome:'Spezie',base:210}};
 // ---- oggetti del capitano. q = pregio (1 comune, 2 buono, 3 pregiato, 4 unico: non si compra, si trova o si conquista) ----
 // arma: dan, att, rit (istanti tra due colpi: 12 è la spada), perf (quanta armatura ignora), git (tira da lontano), due (a due mani: niente scudo),
 // car (colpo in corsa). scudo/armatura/elmo: dif, pf, vel. cavallo: vel (10 = a piedi), pf, car. Tutti: ab = punti alle abilità della compagnia.
 const OGG={};const og=(id,nome,slot,q,prezzo,st,d)=>{OGG[id]=Object.assign({id,nome,slot,q,prezzo,d:d||''},st)};
 og('spada','Spada da fante','arma',1,0,{dan:2,asp:'spada'},'Onesta, senza sorprese.');
 og('daga','Daga','arma',1,40,{dan:1,att:2,rit:9,asp:'spada'},'Corta e svelta: tanti colpi leggeri.');
 og('ascia','Ascia da guerra','arma',1,150,{dan:6,rit:15,asp:'ascia'},'Picchia forte, ma è lenta a tornare su.');
 og('mazza','Mazza ferrata','arma',2,240,{dan:4,perf:.45,asp:'mazza'},'Le corazze non la fermano.');
 og('lancia','Lancia da cavaliere','arma',2,260,{dan:3,att:1,car:.7,asp:'lancia'},'A cavallo, in corsa, passa da parte a parte.');
 og('bastarda','Spada bastarda','arma',2,300,{dan:5,att:1,asp:'spada'},'Una mano e mezza: equilibrio tra forza e misura.');
 og('sciabola','Sciabola della steppa','arma',2,320,{dan:4,att:2,rit:10,asp:'sciabola'},'Curva e rapida, fatta per chi cavalca.');
 og('stocco','Stocco di Maralta','arma',2,340,{dan:3,att:4,perf:.3,asp:'spada'},'Cerca le giunture: precisa più che forte.');
 og('arco','Arco lungo','arma',2,280,{dan:5,git:26,rit:22,due:1,asp:'arco'},'Il capitano tira da lontano; da vicino è nei guai.');
 og('balestra','Balestra pesante','arma',2,360,{dan:9,git:30,rit:34,perf:.3,due:1,asp:'balestra'},'Un quadrello ogni tanto, ma che quadrello.');
 og('spadone','Spadone a due mani','arma',3,780,{dan:10,rit:16,due:1,asp:'spadone'},'Niente scudo: chi sta davanti si scansa.');
 og('alabarda','Alabarda','arma',3,720,{dan:8,perf:.25,rit:16,due:1,asp:'alabarda'},'Uncino, punta e scure in cima a un\'asta.');
 og('temprata','Spada temprata','arma',3,900,{dan:7,att:3,asp:'spada'},'Acciaio di Ferropietra, bilanciata alla perfezione.');
 og('u_condottieri','Lama dei Condottieri','arma',4,2600,{dan:10,att:4,rit:11,asp:'spada',ab:{comando:1}},'Passata di capitano in capitano. Chi la porta si fa seguire.');
 og('u_mezzaluna','Mezzaluna del Guercio','arma',4,1900,{dan:12,rit:15,perf:.2,asp:'ascia'},'L\'ascia del più temuto capobanda del bosco.');
 og('u_martello','Martello del Margravio','arma',4,2300,{dan:8,perf:.7,asp:'mazza'},'Le piastre si piegano come stagno.');
 og('u_arcoantico','Arco delle Madri','arma',4,2200,{dan:8,git:34,rit:18,due:1,asp:'arco'},'Legno di tasso millenario di Selvamara: tira lontano e presto.');
 og('u_vento','Lancia del Vento','arma',4,2400,{dan:6,att:2,car:1.2,asp:'lancia'},'Si dice non abbia mai mancato una carica.');
 og('tondo','Scudo tondo','scudo',1,60,{dif:2,asp:'tondo'},'Legno e cuoio.');
 og('mandorla','Scudo a mandorla','scudo',2,220,{dif:4,asp:'mandorla'},'Copre dalla spalla al ginocchio.');
 og('pavese','Pavese','scudo',2,260,{dif:6,vel:-1,asp:'pavese'},'Un muro da portarsi dietro: rallenta.');
 og('brocchiere','Brocchiere','scudo',2,200,{dif:1,att:2,asp:'tondo'},'Piccolo: più per ferire che per ripararsi.');
 og('u_stemma','Scudo dello Stemma Perduto','scudo',4,1800,{dif:7,pf:10,asp:'mandorla',morale:6},'Nessuno ricorda di chi fosse l\'insegna. Gli uomini ci credono.');
 og('giaco','Giaco imbottito','armatura',1,0,{dif:0,cor:0},'Stoffa trapunta.');
 og('cuoio','Corazza di cuoio','armatura',1,140,{dif:2,pf:6,cor:1},'Leggera, non intralcia.');
 og('maglia','Cotta di maglia','armatura',2,340,{dif:4,pf:12,cor:2},'Anelli d\'acciaio fino alle ginocchia.');
 og('brigantina','Brigantina','armatura',3,700,{dif:6,pf:16,cor:2},'Piastrine ribattute sotto il velluto.');
 og('piastre','Corazza a piastre','armatura',3,1100,{dif:8,pf:26,vel:-1,cor:3},'Quasi invulnerabile, ma pesa.');
 og('u_margravio','Corazza del Margravio','armatura',4,3000,{dif:10,pf:34,cor:3},'Forgiata per un principe delle montagne.');
 og('u_pelle','Pelle del Lupo Bianco','armatura',4,2100,{dif:5,pf:20,vel:1,cor:1,ab:{esplora:2}},'Calda, silenziosa, e chi la porta non perde mai la strada.');
 og('cervelliera','Cervelliera','elmo',1,70,{dif:1,asp:'cervelliera'},'Una scodella di ferro.');
 og('bacinetto','Bacinetto','elmo',2,230,{dif:2,pf:4,asp:'bacinetto'},'Con la visiera che cala.');
 og('crestato','Elmo crestato','elmo',3,640,{dif:3,pf:6,asp:'crestato',morale:3},'Si vede da lontano: gli uomini sanno dove sei.');
 og('piumato','Cappello piumato','elmo',2,180,{dif:0,asp:'piuma',ab:{commercio:1}},'Fa la sua figura al mercato.');
 og('u_corona','Corona Spezzata','elmo',4,2800,{dif:2,pf:8,asp:'crestato',ab:{comando:2}},'Mezza corona di un regno che non c\'è più.');
 og('ronzino','Ronzino','cavallo',1,0,{vel:15,manto:0},'Arriva. Con calma.');
 og('corsiero','Corsiero','cavallo',2,700,{vel:19,manto:2},'Svelto e nervoso.');
 og('steppa','Cavallo della steppa','cavallo',2,760,{vel:21,manto:5,ab:{esplora:1}},'Piccolo, instancabile.');
 og('destriero','Destriero bardato','cavallo',3,1900,{vel:19,pf:20,car:.3,manto:3,barda:1},'Mezzo quintale di ferro e muscoli.');
 og('u_tramontana','Tramontana','cavallo',4,2600,{vel:22,pf:15,car:.3,manto:4},'Bianca come la neve, nessuno l\'ha mai raggiunta.');
 og('corno','Corno di guerra','cimelio',2,420,{grido:.5},'Il grido del capitano torna in metà tempo.');
 og('stendardo','Stendardo benedetto','cimelio',2,460,{morale:8},'Il morale della compagnia resta alto.');
 og('borsa','Borsa del cambiavalute','cimelio',2,480,{ab:{commercio:2}},'Compri a meno, vendi a più.');
 og('cannocchiale','Cannocchiale','cimelio',2,520,{ab:{esplora:3}},'Vedi lontano e scegli la strada giusta.');
 og('bisaccia','Bisaccia del cerusico','cimelio',2,440,{ab:{medicina:2}},'Bende, unguenti e mano ferma.');
 og('trattato','Trattato d\'arme','cimelio',2,500,{ab:{addestra:2}},'Gli uomini imparano prima.');
 og('dadi','Dadi truccati','cimelio',3,650,{bottino:.25},'Un quarto di bottino in più: non chiedere come.');
 og('u_reliquia','Reliquia di San Bruno','cimelio',4,2000,{morale:5,ab:{medicina:3}},'Si dice che i feriti accanto a lei si rialzino.');
 og('u_sigillo','Sigillo dei Tre Regni','cimelio',4,2400,{ab:{comando:2,commercio:1}},'Apre le porte e scioglie le lingue.');
 og('u_occhio','Occhio del Falco','cimelio',4,2000,{ab:{esplora:3},grido:.3},'Una pietra che vede prima di te.');
 const SLOT={arma:'Arma',scudo:'Scudo',armatura:'Armatura',elmo:'Elmo',cavallo:'Cavallo',cimelio:'Cimelio'};
 const PREGIO=['','Comune','Buono','Pregiato','Unico'];
 // cosa vende l'armaiolo di ogni regno (oltre al comune) e l'offerta unica della sua capitale
 const BOTTEGA={val:['lancia','bastarda','mandorla','crestato','destriero','piastre'],sel:['arco','ascia','tondo','cuoio','corsiero','cannocchiale'],fer:['mazza','alabarda','pavese','temprata','piastre','bacinetto'],
  mar:['stocco','balestra','brocchiere','brigantina','piumato','borsa'],alt:['sciabola','arco','steppa','tondo','cuoio','corno']};
 const UNICA={val:'u_condottieri',sel:'u_arcoantico',fer:'u_margravio',mar:'u_sigillo',alt:'u_vento'};
 const COMUNI=['daga','ascia','tondo','cuoio','maglia','cervelliera','bacinetto','corsiero','bisaccia','stendardo','trattato','spadone','dadi'];
 const BOTTINO_ROVINE=['u_stemma','u_corona','u_reliquia','u_occhio','u_pelle','temprata','brigantina','dadi'];
 // tornei nelle città (V2): tre duelli a piedi, un uomo per capitano. Iscrizione = posta × livello; il premio del turno è l'iscrizione × mol
 // (si incassa ritirandosi o vincendo la finale); fama e oggetto a parte. Ogni avversario parte dalla `base` del suo turno e porta uno dei
 // corredi: è l'arma che decide come batterlo (mazza contro le piastre, spadone contro chi è lento, scudo contro chi picchia piano…)
 const TORNEO={posta:40,turni:['Sfidante','Campione','Gran campione'],mol:[2,4,8],fama:[0,5,15],xp:[14,28,50],
  base:[{pf:72,att:15,dif:10,dan:10},{pf:100,att:19,dif:15,dan:13},{pf:135,att:23,dif:20,dan:16}],LIV:5,cresce:{pf:15,att:2.4,dif:1.1,dan:1.2},
  colori:['#8a8172','#2f5f9e','#b3262b'],cor:[1,2,3],
  kit:[{id:'spada',nome:'spada e scudo',arma:'spada',scudo:'tondo',elmo:'cervelliera'},{id:'due',nome:'spadone a due mani',arma:'spadone',scudo:null,elmo:'cervelliera'},
   {id:'asta',nome:'alabarda',arma:'alabarda',scudo:null,elmo:'bacinetto'},{id:'mazza',nome:'mazza ferrata',arma:'mazza',scudo:'tondo',elmo:'cervelliera'}],
  nomi:[['Gerio il Fabbro','Bruno Cortamano','Tonio dei Fossi','Nanni Spallalarga','Rolando il Giovane','Cecco Pietrabianca'],
   ['Ser Ottone Ferrante','Madonna Griselda','Lupo di Roccaverde','Ansaldo il Rosso','Berta Bracciodiferro','Messer Dino Tagliavento'],
   ['Il Leone di Maralta','Orsolina la Temuta','Ser Valerio Senzapari','Gundro il Gigante','La Spada di Tendalarga','Il Campione dei Tre Regni']]};
 // abilità del capitano (0..10), un punto per livello
 const ABIL={
  prodezza:{nome:'Prodezza',d:'Più danno e più punti ferita in battaglia.'},
  comando:{nome:'Comando',d:'Cinque uomini in più nella compagnia per punto.'},
  addestra:{nome:'Addestramento',d:'Le truppe guadagnano esperienza ogni giorno.'},
  medicina:{nome:'Medicina',d:'Più caduti restano feriti invece di morire, e guariscono prima.'},
  commercio:{nome:'Commercio',d:'Compri a meno e vendi a più.'},
  esplora:{nome:'Esplorazione',d:'Viaggi più svelto e vedi più lontano.'}};
 // compagni: guerrieri con un nome, una storia, un aspetto e due punti a un'abilità della compagnia. dove = in che tipo di luogo si incontrano
 const COMPAGNI=[
  {id:'co_berta',nome:'Berta la Rossa',arch:'f4',abil:'prodezza',costo:420,dove:'citta',asp:A('nuda','ascia','tondo',2,{mant:1,col:'#b3262b'}),d:'Già sergente a Valdoro, cacciata per aver steso un conte. Mena come tre.'},
  {id:'co_lapo',nome:'Lapo Cerusico',arch:'f2',abil:'medicina',costo:360,dove:'monastero',asp:A('berretto','mazza',0,0,{mant:1,col:'#e9e2c4'}),d:'Ha lasciato il convento per ricucire chi il convento non accoglie.'},
  {id:'co_ghino',nome:'Ghino del Passo',arch:'c3',abil:'esplora',costo:400,dove:'locanda',asp:A('cappuccio','lancia',0,1,{mant:1,col:'#5a6a3a'}),d:'Contrabbandiere pentito, o quasi. Conosce ogni sentiero e ogni guado.'},
  {id:'co_isa',nome:'Isabetta Contabile',arch:'t2',abil:'commercio',costo:380,dove:'porto',asp:A('piuma','balestra',0,1,{col:'#17878c'}),d:'Teneva i libri di una compagnia di navigazione. Tira di balestra e tira sul prezzo.'},
  {id:'co_ulf',nome:'Mastro Ulfredo',arch:'f3',abil:'addestra',costo:440,dove:'citta',asp:A('bacinetto','alabarda',0,3,{col:'#2f5f9e'}),d:'Trent\'anni di piazza d\'armi a Castelferro. Non sorride dal primo.'},
  {id:'co_dia',nome:'Diamante Alfiere',arch:'c4',abil:'comando',costo:520,dove:'citta',asp:A('crestato','lancia','mandorla',3,{mant:1,barda:1,col:'#e8b23a'}),d:'Portava lo stendardo di un re morto. Dove va lei, vanno gli uomini.'},
  {id:'co_temu',nome:'Temu Senzaclan',arch:'a4',abil:'esplora',costo:540,dove:'locanda',asp:A('pelliccia','arco',0,1,{mant:1,col:'#2b2420'}),d:'Esiliato dalla steppa. Colpisce un falco in volo da cavallo.'},
  {id:'co_nera',nome:'Suor Nera',arch:'f3',abil:'medicina',costo:460,dove:'monastero',asp:A('cappuccio','mazza','tondo',2,{mant:1,col:'#20202a'}),d:'Prega prima, picchia dopo. A volte nell\'ordine inverso.'},
  {id:'co_brando',nome:'Brando Seicolpi',arch:'t3',abil:'prodezza',costo:480,dove:'porto',asp:A('berretto','balestra',0,2,{col:'#6b4a8a'}),d:'Sei quadrelli, sei uomini a terra: poi di solito scappa.'},
  {id:'co_fosca',nome:'Fosca delle Rovine',arch:'f2',abil:'addestra',costo:400,dove:'locanda',asp:A('cappuccio','spada',0,1,{mant:1,col:'#7a6a52'}),d:'Cercatrice di cimeli. Sa dove scavare e chi ci abita sopra.'}];
 for(const c of COMPAGNI)extra(c.id,c.nome,'tu',c.arch,{pf:ARCH[c.arch].pf+30,att:ARCH[c.arch].att+4,dif:ARCH[c.arch].dif+3,paga:ARCH[c.arch].paga+8,compagno:c.abil,asp:c.asp});
 // capibanda: uno per covo. Chi li stana trova il loro tesoro
 const CAPIBANDA=[
  {id:'cb_guercio',nome:'il Guercio',banda:'Lupi del Guercio',premio:'u_mezzaluna',asp:A('pelliccia','ascia',0,2,{mant:1,col:'#3a3230'}),d:'Un occhio solo, ma vede benissimo le borse piene.'},
  {id:'cb_sparviera',nome:'la Sparviera',banda:'Artigli della Sparviera',premio:'u_occhio',asp:A('cappuccio','arco',0,1,{mant:1,col:'#5c1f2a'}),d:'Tira dalle fronde: prima la freccia, poi la voce.'},
  {id:'cb_settedita',nome:'Settedita',banda:'Masnada di Settedita',premio:'dadi',asp:A('berretto','sciabola',0,1,{col:'#4a4a2a'}),d:'Baro, ladro e spergiuro. Tre dita le ha perse al gioco.'},
  {id:'cb_fra',nome:'fra Coltello',banda:'Confratelli del Coltello',premio:'u_reliquia',asp:A('cappuccio','mazza',0,1,{mant:1,col:'#6a4a2c'}),d:'Confessa i viandanti. Poi li alleggerisce dei peccati e del resto.'},
  {id:'cb_tignoso',nome:'il Tignoso',banda:'Scannapolli del Tignoso',premio:'u_pelle',asp:A('nuda','spadone',0,2,{col:'#5a5048'}),d:'Enorme, sporco, e più svelto di quanto dovrebbe.'},
  {id:'cb_madonna',nome:'Madonna Lupa',banda:'Figli della Lupa',premio:'u_stemma',asp:A('corna','alabarda',0,3,{mant:1,col:'#7a1f1f'}),d:'Era una dama. I suoi vassalli ora rubano per lei.'}];
 for(const c of CAPIBANDA)extra(c.id,c.nome,'pre','f4',{nome:c.nome.charAt(0).toUpperCase()+c.nome.slice(1),pf:120,att:22,dif:16,dan:15,asp:c.asp,capo:1});
 // la rivale: un'altra compagnia di ventura che gira il mondo e cresce
 const RIVALE={id:'rv_volpe',nome:'la Volpe Rossa',compagnia:'Compagnia della Volpe',premio:'u_tramontana',asp:A('piuma','sciabola','tondo',3,{mant:1,barda:1,col:'#c8421c'}),d:'Nessuno sa chi serva questa settimana. Sorride sempre.'};
 extra(RIVALE.id,'La Volpe Rossa','mer','c4',{pf:130,att:23,dif:18,dan:15,asp:RIVALE.asp,capo:1});
 // tratti dei signori: come parlano, e quanto osano
 const TRATTI={prode:{nome:'prode',osa:1.25,passa:0,dipl:{pace:-2,alleanza:0,guerra:3},saluto:'«Buona strada, capitano. Se cerchi gloria, qui ce n\'è per tutti.»'},avido:{nome:'avido',osa:.95,passa:2,dipl:{pace:1,alleanza:-1,guerra:1},saluto:'«Capitano. Spero tu non sia qui a chiedere denaro: ne ho appena per me.»'},
  crudele:{nome:'crudele',osa:1.1,passa:1,dipl:{pace:-2,alleanza:-1,guerra:2},saluto:'«Togliti dalla mia strada, mercenario, finché ti reggono le gambe.»'},onorevole:{nome:'d\'onore',osa:1,passa:-4,dipl:{pace:2,alleanza:2,guerra:-2},saluto:'«Che la tua parola valga quanto la tua spada, capitano.»'},prudente:{nome:'prudente',osa:.8,passa:-1,dipl:{pace:2,alleanza:1,guerra:-3},saluto:'«Le strade non sono sicure. Tu, da che parte stai?»'}};
 const TRATTI_ID=Object.keys(TRATTI);
 // diplomazia (V3): alleanze e proposte ai re. Tutto è un conto, mai un dado: ogni fattore ha un nome e un peso, e il re accetta se la somma è ≥ 0.
 // MIN: giorni minimi di un'alleanza; PREAVVISO: giorni tra l'annuncio della rottura e la fine; BASE: diffidenza di partenza di ogni proposta;
 // ATTESA: giorni prima che lo stesso re ascolti un'altra proposta accolta; PESO: quanto vale la parola di chi gioca (mercenario a contratto / vassallo); i numeri si ritoccano qui.
 const DIPL={MIN:20,PREAVVISO:3,ATTESA:3,BASE:{pace:0,alleanza:-3,guerra:-2},PESO:{mer:.5,vas:1,re:1.2},AMICIZIA:12,FAMA:50,FAMA_MAX:200,FORZA:3,GUERRE:{pace:1.5,alleanza:1,guerra:-2.5},COMUNE:2,DOMINANTE:3,QUOTA_DOM:.4,
  IA:{ALLEANZA:.35,FRONTE:.12,ROTTURA:.05,GUERRA_DOM:.3}};
 const TIPI={citta:'Città',castello:'Castello',villaggio:'Villaggio',porto:'Porto',monastero:'Monastero',locanda:'Locanda',rovine:'Rovine',covo:'Covo dei predoni'};
 const NOMI={
  citta:{val:['Roccadoro'],sel:['Fontesalice'],fer:['Castelferro'],mar:['Maralta'],alt:['Tendalarga']},
  castello:{val:['Torre Aquilaia','Rocca Bruna','Poggio Lancia','Castel Grifone'],sel:['Rocca dei Tassi','Castel Verdello','Torre Muschiata','Rocca Edera'],fer:['Rocca Gelida','Forte Incudine','Torre Corvina','Forte Brina'],
   mar:['Forte Scoglio','Torre Salina','Rocca Gabbiana','Bastione Vela'],alt:['Forte Zoccolo','Torre Sparviero','Rocca Polverosa','Palizzata Alta']},
  villaggio:{val:['Granaio','Vigna Alta','Pontelupo','Mulino Vecchio','Campofiore','Spigadoro','Colle Mosto','Borgo Lieto'],sel:['Felceto','Radura','Querceta','Fonte Bassa','Castagneto','Muschiara','Tre Faggi','Borgo Ghianda'],
   fer:['Pietramala','Cavabianca','Nevaio','Borgo Fucina','Passo Stretto','Ghiacciolo','Valfredda','Mantice'],mar:['Reti Stese','Salicornia','Calafata','Borgo Remo','Faro Vecchio','Ancoretta','Punta Sale','Conchiglia'],
   alt:['Erbalunga','Pozzo Secco','Tre Tende','Guado Largo','Fiera dei Cavalli','Vento Basso','Pietra Dritta','Abbeverata']},
  porto:{val:['Porto Dorato'],sel:['Approdo dei Salici'],fer:['Porto Brina'],mar:['Darsena Grande','Porto Levante'],alt:['Scalo del Vento']},
  monastero:['Abbazia di San Bruno','Eremo delle Tre Fonti','Badia del Silenzio','Convento della Brina','Certosa dei Venti'],
  abati:['l\'abate Gualberto','madre Ildegarda','il priore Anselmo','suor Cunegonda','fra Macario'],
  locanda:['Locanda del Cinghiale','Osteria dei Tre Ponti','Locanda della Luna Storta','Osteria del Carrettiere','Locanda del Gallo Nero','Osteria del Guado','Locanda dell\'Impiccato'],
  osti:['mastro Bruno','la vedova Pina','Gigio il Monco','comare Tessa','Nanni Barile','zia Ulda','Baccio Cantafavole'],
  rovine:['Torre Mozza','Tempio Sommerso','Rocca dei Sospiri','Colonne Rotte','Tomba del Re Senza Nome','Villa degli Echi','Fortezza Caduta','Altare Spaccato'],
  signori:{val:['re Aldemaro','conte Gualtiero','dama Fiammetta','messer Rinieri','contessa Bice'],sel:['reggente Isotta','ser Baldovino','dama Ermellina','messer Tebaldo','dama Selvaggia'],fer:['margravio Oddone','barone Arrigo','dama Gismonda','messer Corrado','baronessa Uta'],
   mar:['console Lazzaro','ammiraglio Marino','dama Violante','capitano Ugolotto','madonna Perla'],alt:['capoclan Temra','Batu Lunga Strada','Sarna Occhi di Vento','Ogul il Giovane','Yesui Tre Cavalli']},
  bande:['Banda del Fosso','Lupi del bosco','Tagliagole','Figli della forca','Compagnia del sacco','Corvi di strada','Masnada nera','Scannapolli']};
 // regno (V4): fondare un regno, signori che passano a te, feudi, vittoria. Tutto è un conto; i numeri si ritoccano qui.
 // FAMA/ORO: costo di fondazione; CONFINE: distanza dei regni che reagiscono; AMICO: opinione da cui un confinante propone pace; GUERRA_ENTRO: giorni entro cui gli altri dichiarano guerra;
 // TENUTI: luoghi tenuti senza malcontento; MALC_SU/MALC_GIU: malcontento al giorno; ESILIO: giorni da esule; ADUNATA: giorni in cui i signori ti raggiungono; TRUPPE_COMP: truppe di un compagno investito;
 // PASSA: fattori della lealtà di un signore che valuta di passare a te (tratto: TRATTI[x].passa).
 const REGNO={FAMA:150,ORO:5000,CONFINE:20,AMICO:20,GUERRA_ENTRO:10,TENUTI:3,MALC_SU:4,MALC_GIU:3,ESILIO:30,ADUNATA:3,TRUPPE_COMP:70,
  PASSA:{BASE:-4,ESULE:6,AMICIZIA:10,FAMA:100,FAMA_MAX:300,DEBOLE:2,GUERRA:-2,FEUDO:{villaggio:0,porto:1,castello:2,citta:3}},
  STENDARDI:[{nome:'Porpora e oro',col:'#6a2a7a',col2:'#e8b23a'},{nome:'Nero e avorio',col:'#1d1a1a',col2:'#efe6cf'},{nome:'Argento e rosso',col:'#b9c0c8',col2:'#a8262b'},{nome:'Oro e verde',col:'#d9a521',col2:'#2d6a3a'},
   {nome:'Oro e nero',col:'#d9a521',col2:'#1d1a1a'},{nome:'Notte e argento',col:'#1b2a55',col2:'#c9d3dc'},{nome:'Avorio e rosso',col:'#efe6cf',col2:'#a8262b'},{nome:'Rosso scuro e oro',col:'#6e1a1f',col2:'#e8b23a'}]};
 // cosa produce ogni regno: le scorte tendono a salire dove si produce
 const PRODUCE={val:['grano','vino','velluto'],sel:['carne','lana','attrezzi'],fer:['ferro','sale','attrezzi'],mar:['pesce','spezie','velluto'],alt:['carne','lana','sale']};
 return{FAZ,REGNI,ARCH,TR,SU,INGAGGIO,PROMO,XP_SU,valore,aspetto,MERCI,OGG,SLOT,PREGIO,BOTTEGA,UNICA,TORNEO,COMUNI,BOTTINO_ROVINE,ABIL,COMPAGNI,CAPIBANDA,RIVALE,TRATTI,TRATTI_ID,DIPL,REGNO,TIPI,NOMI,PRODUCE}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VDAT;
