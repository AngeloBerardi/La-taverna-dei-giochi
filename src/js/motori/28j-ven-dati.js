/* ---- Compagnia di ventura (Cantari di Ventura, piano C): i dati del mondo libero. Regole pure, senza DOM né rete. ----
   Fazioni, truppe con le loro linee di promozione, merci, equipaggiamento del capitano, compagni, nomi.
   Unica fonte: i numeri di truppe e merci si ritoccano qui, mai nei motori (28k mondo, 28l campo) né nelle viste.
   Piano: docs/VENTURA.md. */
const VDAT=(()=>{
 // fazioni: tre regni, i predoni, i mercenari e la compagnia di chi gioca (`tu`)
 const FAZ={
  val:{nome:'Regno di Valdoro',breve:'Valdoro',col:'#b3262b',col2:'#e8b23a',re:'re Aldemaro',forte:'c',motto:'Cavalieri pesanti e balestre'},
  sel:{nome:'Lega di Selvamara',breve:'Selvamara',col:'#2f7d46',col2:'#e9e2c4',re:'la reggente Isotta',forte:'t',motto:'Archi lunghi e battistrada'},
  fer:{nome:'Marca di Ferropietra',breve:'Ferropietra',col:'#2f5f9e',col2:'#c9d3dc',re:'il margravio Oddone',forte:'f',motto:'Picche, alabarde e mura'},
  pre:{nome:'Predoni',breve:'Predoni',col:'#3a3230',col2:'#a8a093'},
  mer:{nome:'Gente di ventura',breve:'Ventura',col:'#6b4a8a',col2:'#e0d6ea'},
  tu:{nome:'La tua compagnia',breve:'Compagnia',col:'#d98a1f',col2:'#fff4d6'}};
 const REGNI=['val','sel','fer'];
 // archetipi: classe f = fanti, t = tiratori, c = cavalieri. git = gittata in passi del campo (0 = corpo a corpo)
 const ARCH={
  f1:{t:1,c:'f',pf:22,att:8,dif:6,dan:5,git:0,vel:10,paga:1},
  f2:{t:2,c:'f',pf:30,att:11,dif:10,dan:7,git:0,vel:10,paga:3},
  t2:{t:2,c:'t',pf:24,att:10,dif:6,dan:6,git:24,vel:10,paga:3},
  f3:{t:3,c:'f',pf:38,att:14,dif:14,dan:9,git:0,vel:10,paga:6},
  t3:{t:3,c:'t',pf:28,att:13,dif:8,dan:8,git:28,vel:10,paga:6},
  c3:{t:3,c:'c',pf:40,att:13,dif:11,dan:9,git:0,vel:19,paga:9},
  f4:{t:4,c:'f',pf:48,att:18,dif:18,dan:12,git:0,vel:10,paga:11},
  t4:{t:4,c:'t',pf:32,att:17,dif:10,dan:10,git:32,vel:10,paga:11},
  c4:{t:4,c:'c',pf:56,att:18,dif:17,dan:13,git:0,vel:18,paga:16}};
 const SU={f1:['f2','t2'],f2:['f3','c3'],t2:['t3'],f3:['f4'],t3:['t4'],c3:['c4']};
 const NOMI_T={
  val:{f1:'Villano',f2:'Fante di Valdoro',t2:'Balestriere',f3:'Sergente',t3:'Balestriere scelto',c3:'Scudiero',f4:'Guardia dorata',t4:'Balestriere del re',c4:'Cavaliere di Valdoro'},
  sel:{f1:'Boscaiolo',f2:'Lanciere dei boschi',t2:'Arciere',f3:'Custode',t3:'Arciere lungo',c3:'Battistrada',f4:'Guardiano antico',t4:'Maestro d\'arco',c4:'Cavaliere del cervo'},
  fer:{f1:'Minatore',f2:'Picchiere',t2:'Fromboliere',f3:'Alabardiere',t3:'Balestriere di rocca',c3:'Scorridore',f4:'Guardia di ferro',t4:'Maestro di balestra',c4:'Corazziere'}};
 const TR={};
 const arr=(x)=>Math.round(x);
 for(const f of REGNI)for(const a of Object.keys(ARCH)){const b=ARCH[a],k=FAZ[f].forte===b.c?1.15:1;
  TR[f+'_'+a]={id:f+'_'+a,nome:NOMI_T[f][a],faz:f,arch:a,t:b.t,c:b.c,pf:arr(b.pf*(k>1&&b.c!=='t'?1.1:1)),att:arr(b.att*k),dif:arr(b.dif*(k>1&&b.c==='f'?1.15:1)),dan:arr(b.dan*(k>1&&b.c==='c'?1.15:1)),
   git:arr(b.git*(k>1&&b.c==='t'?1.15:1)),vel:b.vel,paga:b.paga,su:(SU[a]||[]).map(x=>f+'_'+x)}}
 const extra=(id,nome,faz,a,m)=>{const b=ARCH[a];TR[id]=Object.assign({id,nome,faz,arch:a,t:b.t,c:b.c,pf:b.pf,att:b.att,dif:b.dif,dan:b.dan,git:b.git,vel:b.vel,paga:b.paga,su:[]},m||{})};
 extra('pre_f1','Tagliaborse','pre','f1',{su:['pre_f2','pre_t2']});extra('pre_f2','Brigante','pre','f2',{su:['pre_f3']});extra('pre_t2','Bracconiere','pre','t2');
 extra('pre_c3','Razziatore','pre','c3',{dif:8});extra('pre_f3','Capobanda','pre','f3');
 extra('mer_f3','Spadaccino di ventura','mer','f3',{paga:9,su:['mer_f4']});extra('mer_t3','Balestriere di ventura','mer','t3',{paga:9});
 extra('mer_c4','Lancia spezzata','mer','c4',{paga:22});extra('mer_f4','Doppiosoldo','mer','f4',{paga:15});
 // prezzi d'ingaggio e di promozione, esperienza per salire di rango
 const INGAGGIO={1:10,2:40,3:110,4:260},PROMO={1:15,2:45,3:120},XP_SU={1:8,2:22,3:50};
 const valore=t=>{const x=typeof t==='string'?TR[t]:t;return x.pf/10*(x.att+x.dif+x.dan*1.5+(x.git?4:0)+(x.c==='c'?5:0))/10};
 // merci: base = prezzo di riferimento, cibo = razioni che vale una unità
 const MERCI={
  grano:{nome:'Grano',base:12,cibo:1},carne:{nome:'Carne salata',base:20,cibo:1},pesce:{nome:'Pesce secco',base:16,cibo:1},
  vino:{nome:'Vino',base:34},lana:{nome:'Lana',base:44},sale:{nome:'Sale',base:52},ferro:{nome:'Ferro',base:66},
  attrezzi:{nome:'Attrezzi',base:96},velluto:{nome:'Velluto',base:170},spezie:{nome:'Spezie',base:210}};
 // equipaggiamento del capitano: tre gradi per pezzo (0 = quello di partenza)
 const EQUIP={
  arma:[{nome:'Spada da fante',dan:0,prezzo:0},{nome:'Spada bastarda',dan:3,prezzo:260},{nome:'Spadone temprato',dan:6,prezzo:820},{nome:'Lama dei condottieri',dan:10,prezzo:2400}],
  armatura:[{nome:'Giaco imbottito',dif:0,pf:0,prezzo:0},{nome:'Cotta di maglia',dif:3,pf:10,prezzo:320},{nome:'Corazza a piastre',dif:6,pf:22,prezzo:980},{nome:'Armatura del capitano',dif:9,pf:36,prezzo:2800}],
  cavallo:[{nome:'A piedi',vel:10,prezzo:0},{nome:'Ronzino',vel:15,prezzo:180},{nome:'Corsiero',vel:19,prezzo:700},{nome:'Destriero bardato',vel:20,pf:20,prezzo:1900}]};
 // abilità del capitano (0..10), un punto per livello
 const ABIL={
  prodezza:{nome:'Prodezza',d:'Più danno e più punti ferita in battaglia.'},
  comando:{nome:'Comando',d:'Cinque uomini in più nella compagnia per punto.'},
  addestra:{nome:'Addestramento',d:'Le truppe guadagnano esperienza ogni giorno.'},
  medicina:{nome:'Medicina',d:'Più caduti restano feriti invece di morire, e guariscono prima.'},
  commercio:{nome:'Commercio',d:'Compri a meno e vendi a più.'},
  esplora:{nome:'Esplorazione',d:'Viaggi più svelto e vedi più lontano.'}};
 // compagni che si assoldano nelle taverne: un guerriero forte e un punto a un'abilità della compagnia
 const COMPAGNI=[
  {id:'co_berta',nome:'Berta la Rossa',arch:'f4',abil:'prodezza',costo:420,d:'Già sergente a Valdoro, mena come tre.'},
  {id:'co_lapo',nome:'Lapo Cerusico',arch:'f2',abil:'medicina',costo:360,d:'Ricuce quel che gli altri tagliano.'},
  {id:'co_ghino',nome:'Ghino del Passo',arch:'c3',abil:'esplora',costo:400,d:'Conosce ogni sentiero e ogni guado.'},
  {id:'co_isa',nome:'Isabetta Contabile',arch:'t2',abil:'commercio',costo:380,d:'Tira d\'arco e tira sul prezzo.'},
  {id:'co_ulf',nome:'Mastro Ulfredo',arch:'f3',abil:'addestra',costo:440,d:'Trent\'anni di piazza d\'armi.'},
  {id:'co_dia',nome:'Diamante Alfiere',arch:'c4',abil:'comando',costo:520,d:'Dove va lo stendardo, vanno gli uomini.'}];
 for(const c of COMPAGNI)extra(c.id,c.nome,'tu',c.arch,{pf:ARCH[c.arch].pf+30,att:ARCH[c.arch].att+4,dif:ARCH[c.arch].dif+3,paga:ARCH[c.arch].paga+8,compagno:c.abil});
 const NOMI={
  citta:{val:['Roccadoro'],sel:['Fontesalice'],fer:['Castelferro']},
  castello:{val:['Torre Aquilaia','Rocca Bruna','Poggio Lancia'],sel:['Rocca dei Tassi','Castel Verdello','Torre Muschiata'],fer:['Rocca Gelida','Forte Incudine','Torre Corvina']},
  villaggio:{val:['Granaio','Vigna Alta','Pontelupo','Mulino Vecchio','Campofiore'],sel:['Felceto','Radura','Querceta','Fonte Bassa','Castagneto'],fer:['Pietramala','Cavabianca','Nevaio','Borgo Fucina','Passo Stretto']},
  signori:{val:['re Aldemaro','conte Gualtiero','dama Fiammetta','messer Rinieri'],sel:['reggente Isotta','ser Baldovino','dama Ermellina','messer Tebaldo'],fer:['margravio Oddone','barone Arrigo','dama Gismonda','messer Corrado']},
  bande:['Banda del Guercio','Lupi del bosco','Tagliagole','Figli della forca','Compagnia del sacco','Corvi di strada','Masnada nera','Scannapolli']};
 // cosa produce e cosa cerca ogni tipo di luogo (per regno): le scorte tendono a salire dove si produce
 const PRODUCE={val:['grano','vino','velluto'],sel:['carne','lana','spezie'],fer:['ferro','sale','attrezzi','pesce']};
 return{FAZ,REGNI,ARCH,TR,SU,INGAGGIO,PROMO,XP_SU,valore,MERCI,EQUIP,ABIL,COMPAGNI,NOMI,PRODUCE}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VDAT;
