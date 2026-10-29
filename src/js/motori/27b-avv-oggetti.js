/* ---- Oggetti dell'avventura (Cantari di Ventura): catalogo (unica fonte), equipaggiamento, zaino e cintura. Regole pure. ----
   Un oggetto è un id di testo: lo zaino è una lista di id (anche ripetuti), l'equipaggiamento una mappa posto → id.
   Posti: arma (mano principale), scudo (seconda mano), armatura, acc1, acc2; cintura di 3 consumabili; zaino di 16 posti.
   I bonus stanno in `fx` (ca, att, dan, iniz, mov, hp, salv, ab:{abilità:n}, res:[tipi]) e li legge EROI.derivati tramite `bonus(h)`.
   Le funzioni che modificano un eroe lavorano sulla scheda che ricevono e restituiscono {ok:true,…} oppure {err:'motivo'}:
   chi le chiama lavora già su una copia (come fa CAMP.act). Nomi e testi sono originali della Taverna. */
const AOGG=(()=>{
 const E=typeof EROI!=='undefined'?EROI:require('./27-eroi.js');
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const SLOT_EQ=['arma','scudo','armatura','acc1','acc2'],MAX_ZAINO=16,MAX_CINTURA=3;
 // fasce di prezzo per rarità (monete) e nomi; il livello minimo di ogni oggetto è controllato da tests/test_avv_oggetti.js
 const RARITA={comune:{nome:'Comune',pr:[0,150]},rara:{nome:'Raro',pr:[100,600]},epica:{nome:'Epico',pr:[500,2500]},leggendaria:{nome:'Leggendario',pr:[2000,10000]}};
 const NOME_TIPO={leg:'leggera',med:'media',pes:'pesante'};
 const OGG={};
 const mk=(slot,id,nome,ra,liv,pr,o)=>{OGG[id]=Object.assign({id,slot,nome,ra,liv,pr},o||{})};
 // armi: n dadi da `dado` facce, caratteristica `stat` (acc = accurata: vale la migliore tra Forza e Destrezza), due = a due mani,
 // lan = [corta,lunga] gittata da lancio, gt = [corta,lunga] gittata (esagoni), por = portata in esagoni (default 1), tipo = tipo di danno
 const arma=(id,nome,ra,liv,pr,o)=>mk('arma',id,nome,ra,liv,pr,Object.assign({n:1},o));
 arma('pugnali','Pugnali','comune',1,10,{dado:4,stat:'des',acc:true,lan:[3,6],tipo:'perforante'});
 arma('bastone','Bastone ferrato','comune',1,5,{dado:6,stat:'for',tipo:'contundente'});
 arma('mazza','Mazza benedetta','comune',1,15,{dado:6,stat:'for',tipo:'contundente'});
 arma('spada-lunga','Spada lunga','comune',1,30,{dado:8,stat:'for',tipo:'taglio'});
 arma('stocco','Stocco','comune',1,30,{dado:8,stat:'des',acc:true,tipo:'perforante'});
 arma('arco','Arco corto','comune',1,25,{dado:6,stat:'des',due:true,gt:[5,10],tipo:'perforante'});
 arma('ascia','Accetta','comune',1,10,{dado:6,stat:'for',lan:[3,6],tipo:'taglio'});
 arma('lancia','Lancia','comune',1,8,{dado:6,stat:'for',lan:[3,6],tipo:'perforante'});
 arma('fionda','Fionda','comune',1,3,{dado:4,stat:'des',gt:[4,8],tipo:'contundente'});
 arma('spada-corta','Spada corta','comune',1,15,{dado:6,stat:'des',acc:true,tipo:'taglio'});
 arma('martello-guerra','Martello da guerra','comune',1,25,{dado:8,stat:'for',tipo:'contundente'});
 arma('balestra','Balestra leggera','comune',1,35,{dado:8,stat:'des',due:true,gt:[6,12],tipo:'perforante'});
 arma('spadone','Spadone','comune',2,60,{n:2,dado:6,stat:'for',due:true,tipo:'taglio'});
 arma('grande-ascia','Grande ascia','comune',2,55,{dado:12,stat:'for',due:true,tipo:'taglio'});
 arma('maglio','Maglio','comune',2,60,{n:2,dado:6,stat:'for',due:true,tipo:'contundente'});
 arma('picca','Picca','comune',2,50,{dado:10,stat:'for',due:true,por:2,tipo:'perforante'});
 arma('arco-lungo','Arco lungo','comune',2,55,{dado:8,stat:'des',due:true,gt:[7,14],tipo:'perforante'});
 arma('spada-argentata','Spada argentata','rara',3,240,{dado:8,stat:'for',tipo:'taglio',fx:{att:1,dan:1}});
 arma('stocco-lampo','Stocco lampo','rara',3,250,{dado:8,stat:'des',acc:true,tipo:'perforante',fx:{att:1,dan:1}});
 arma('pugnali-notturni','Pugnali notturni','rara',3,230,{dado:4,stat:'des',acc:true,lan:[3,6],tipo:'perforante',fx:{att:1,dan:1}});
 arma('mazza-sacra','Mazza sacra','rara',3,230,{dado:6,stat:'for',tipo:'radioso',fx:{att:1,dan:1}});
 arma('arco-del-cacciatore','Arco del cacciatore','rara',3,220,{dado:6,stat:'des',due:true,gt:[5,10],tipo:'perforante',fx:{att:1,dan:1}});
 arma('bastone-arcano','Bastone arcano','rara',3,200,{dado:6,stat:'for',tipo:'contundente',fx:{att:1}});
 arma('lama-della-brace','Lama della brace','epica',5,900,{dado:8,stat:'for',tipo:'fuoco',fx:{att:2,dan:2}});
 arma('arco-del-vento','Arco del vento','epica',5,950,{dado:8,stat:'des',due:true,gt:[7,14],tipo:'perforante',fx:{att:2,dan:1}});
 arma('bastone-del-gelo','Bastone del gelo','epica',5,900,{dado:6,stat:'for',tipo:'gelo',fx:{att:2,dan:2}});
 arma('maglio-del-crollo','Maglio del crollo','epica',6,1000,{n:2,dado:6,stat:'for',due:true,tipo:'contundente',fx:{att:1,dan:3}});
 arma('spada-dei-re','Spada dei re','leggendaria',7,4000,{n:2,dado:6,stat:'for',due:true,tipo:'radioso',fx:{att:3,dan:3}});
 arma('arco-stellato','Arco stellato','leggendaria',7,3600,{dado:8,stat:'des',due:true,gt:[8,16],tipo:'radioso',fx:{att:3,dan:2}});
 // armature: tipo leg/med/pes, ca = CA di base, desMax = massimo bonus di Destrezza (null = tutto, 0 = nessuno)
 const armat=(id,nome,ra,liv,pr,o)=>mk('armatura',id,nome,ra,liv,pr,o);
 armat('stracci','Vesti da viaggio','comune',1,2,{tipo:'leg',ca:10,desMax:null});
 armat('cuoio','Cuoio bollito','comune',1,10,{tipo:'leg',ca:11,desMax:null});
 armat('cuoio-borchiato','Cuoio borchiato','comune',2,45,{tipo:'leg',ca:12,desMax:null});
 armat('camicia-maglia','Camicia di maglia','comune',2,50,{tipo:'med',ca:13,desMax:2});
 armat('scaglie','Armatura a scaglie','comune',3,70,{tipo:'med',ca:14,desMax:2});
 armat('cotta-maglia','Cotta di maglia','comune',1,75,{tipo:'pes',ca:16,desMax:0});
 armat('corazza-piastre','Corazza a piastre','comune',3,150,{tipo:'pes',ca:17,desMax:0});
 armat('cuoio-della-notte','Cuoio della notte','rara',3,250,{tipo:'leg',ca:12,desMax:null,fx:{ab:{furtivita:2}}});
 armat('mezza-corazza','Mezza corazza','rara',3,280,{tipo:'med',ca:15,desMax:2});
 armat('maglia-argentea','Maglia argentea','rara',3,320,{tipo:'pes',ca:16,desMax:0,fx:{ca:1}});
 armat('armatura-completa','Armatura completa','rara',5,600,{tipo:'pes',ca:18,desMax:0});
 armat('corazza-del-guardiano','Corazza del guardiano','epica',6,1400,{tipo:'pes',ca:18,desMax:0,fx:{res:['contundente']}});
 armat('armatura-del-sovrano','Armatura del sovrano','leggendaria',8,4000,{tipo:'pes',ca:18,desMax:0,fx:{ca:1,res:['fuoco']}});
 // scudi: ca = bonus alla CA
 const scudo=(id,nome,ra,liv,pr,o)=>mk('scudo',id,nome,ra,liv,pr,o);
 scudo('scudo-piccolo','Scudo piccolo','comune',1,4,{ca:1});
 scudo('scudo-legno','Scudo di legno','comune',1,5,{ca:2});
 scudo('scudo-torre','Scudo a torre','comune',2,40,{ca:3,fx:{mov:-1}});
 scudo('scudo-del-custode','Scudo del custode','rara',3,280,{ca:2,fx:{ca:1}});
 scudo('scudo-specchio','Scudo specchio','epica',6,900,{ca:3,fx:{res:['fuoco','gelo']}});
 scudo('scudo-del-re','Scudo del re','leggendaria',8,3500,{ca:3,fx:{ca:1,salv:1}});
 // accessori (due posti)
 const acc=(id,nome,ra,liv,pr,fx)=>mk('acc',id,nome,ra,liv,pr,{fx});
 acc('amuleto-di-quercia','Amuleto di quercia','comune',1,40,{hp:3});
 acc('guanti-da-lavoro','Guanti da lavoro','comune',1,30,{ab:{atletica:1}});
 acc('fascia-da-cacciatore','Fascia da cacciatore','comune',1,30,{ab:{percezione:1}});
 acc('anello-di-rame','Anello di rame','comune',1,45,{iniz:1});
 acc('anello-protettivo','Anello protettivo','rara',3,350,{ca:1});
 acc('stivali-leggeri','Stivali leggeri','rara',3,300,{mov:1});
 acc('guanti-del-ladro','Guanti del ladro','rara',3,180,{ab:{furtivita:2,acrobazia:1}});
 acc('mantello-ombroso','Mantello ombroso','rara',3,220,{iniz:2});
 acc('amuleto-vitale','Amuleto vitale','rara',3,260,{hp:8});
 acc('anello-del-tiro','Anello del tiro','rara',3,300,{att:1});
 acc('anello-della-forza','Anello della forza','rara',3,300,{dan:1});
 acc('anello-del-custode','Anello del custode','epica',5,1200,{ca:2});
 acc('amuleto-della-fenice','Amuleto della fenice','epica',5,1000,{hp:15});
 acc('mantello-fiammeo','Mantello fiammeo','epica',5,900,{ca:1,res:['fuoco']});
 acc('cintura-del-gigante','Cintura del gigante','epica',6,1100,{dan:2});
 acc('cuore-di-drago','Cuore di drago','leggendaria',7,4500,{hp:25,att:1});
 acc('occhio-del-falco','Occhio del falco','leggendaria',7,4000,{att:2,iniz:2});
 // consumabili (eff: cura = dadi di cura; danno/tipo/gt = bomba o pergamena; rimuovi = stati tolti; conc = Concentrazione; temp = PF temporanei; stato)
 const cons=(id,nome,ra,liv,pr,eff)=>mk('cons',id,nome,ra,liv,pr,{eff});
 cons('razione','Razione da viaggio','comune',1,2,{cura:'1d4'});
 cons('kit-guaritore','Kit da guaritore','comune',1,15,{cura:'1d6+2'});
 cons('pozione-cura','Pozione di cura','comune',1,25,{cura:'2d4+2'});
 cons('antidoto','Antidoto','comune',1,20,{rimuovi:['avvelenato']});
 cons('bomba-fuoco','Bomba infuocata','comune',1,30,{danno:'2d6',tipo:'fuoco',gt:5});
 cons('pozione-cura-maggiore','Pozione di cura maggiore','rara',3,100,{cura:'4d4+4'});
 cons('bomba-gelo','Bomba gelida','rara',3,100,{danno:'3d6',tipo:'gelo',gt:5});
 cons('pergamena-fulmine','Pergamena del fulmine','rara',3,120,{danno:'3d8',tipo:'fulmine',gt:6});
 cons('pergamena-benedizione','Pergamena di benedizione','rara',2,110,{stato:'benedetto'});
 cons('tonico-concentrazione','Tonico di concentrazione','rara',3,150,{conc:1});
 cons('pozione-cura-suprema','Pozione di cura suprema','epica',6,600,{cura:'8d4+8'});
 cons('elisir-vigore','Elisir di vigore','epica',5,800,{temp:20});
 // oggetti di missione: non si comprano né si vendono né cadono come bottino
 for(const [id,nome] of [['sigillo-dei-corvi','Sigillo dei corvi'],['chiave-dell-antro','Chiave dell\'antro'],['frammento-di-corona','Frammento di corona']])mk('miss',id,nome,'rara',1,0,{vend:false});
 const ID=Object.keys(OGG);
 const slotOk=(it,s)=>it.slot==='acc'?(s==='acc1'||s==='acc2'):it.slot===s;
 // posto in cui va un oggetto: il primo accessorio libero, altrimenti il primo
 function slotPer(h,id){const it=OGG[id];if(!it)return null;
  if(it.slot==='acc'){const q=h.equip||{};return!q.acc1?'acc1':!q.acc2?'acc2':'acc1'}
  return['arma','scudo','armatura'].includes(it.slot)?it.slot:null}
 // somma dei bonus degli oggetti equipaggiati (la legge EROI.derivati)
 function bonus(h){const b={ca:0,att:0,dan:0,iniz:0,mov:0,hp:0,salv:0,ab:{},res:[]},q=h.equip||{};
  for(const s of SLOT_EQ){const it=OGG[q[s]];if(!it||!it.fx)continue;const f=it.fx;
   for(const k of['ca','att','dan','iniz','mov','hp','salv'])b[k]+=f[k]||0;
   for(const [a,n] of Object.entries(f.ab||{}))b.ab[a]=(b.ab[a]||0)+n;
   for(const r of f.res||[])if(!b.res.includes(r))b.res.push(r)}
  return b}
 // l'equipaggiamento e lo zaino di una scheda vanno bene? (difesa contro schede manomesse) motivo oppure null
 function invValido(h){const q=h.equip==null?{}:h.equip,z=h.zaino==null?[]:h.zaino,c=h.cintura==null?[]:h.cintura;
  if(typeof q!=='object'||Array.isArray(q))return'equipaggiamento non valido';
  for(const k of Object.keys(q))if(!SLOT_EQ.includes(k))return'posto sconosciuto';
  for(const s of SLOT_EQ){const id=q[s];if(id==null)continue;const it=OGG[id];if(!it)return'oggetto sconosciuto';
   if(!slotOk(it,s))return'oggetto nel posto sbagliato';if((h.liv||1)<it.liv)return'livello troppo basso per '+it.nome}
  if(q.arma&&q.scudo&&OGG[q.arma].due)return'arma a due mani e scudo insieme';
  if(!Array.isArray(z)||z.length>MAX_ZAINO||z.some(id=>!OGG[id]))return'zaino non valido';
  if(!Array.isArray(c)||c.length>MAX_CINTURA||c.some(id=>!OGG[id]||OGG[id].slot!=='cons'))return'cintura non valida';
  return null}
 const ER=err=>({err});
 // dopo un cambio di equipaggiamento: PF massimi (i PF attuali non salgono: niente cure infilando e sfilando un amuleto), CA e movimento
 function ricalcola(h){const d=E.derivati(h);h.hpMax=d.hpMax;if(h.hp>h.hpMax)h.hp=h.hpMax;if('ca' in h)h.ca=d.ca;if('mov' in h)h.mov=d.mov;return h}
 // dallo zaino al posto giusto; ciò che c'era finisce nello zaino
 function equipaggia(h,id,slot){const it=OGG[id];if(!it)return ER('Oggetto sconosciuto');slot=slot||slotPer(h,id);
  if(!slot||!slotOk(it,slot))return ER('Questo oggetto non si mette lì');
  const z=h.zaino||(h.zaino=[]),i=z.indexOf(id);if(i<0)return ER('L\'oggetto non è nello zaino');
  if((h.liv||1)<it.liv)return ER('Serve il livello '+it.liv);
  const q=h.equip||(h.equip={});
  if(slot==='arma'&&it.due&&q.scudo)return ER('Togli prima lo scudo: quest\'arma vuole due mani');
  if(slot==='scudo'&&q.arma&&OGG[q.arma]&&OGG[q.arma].due)return ER('Con un\'arma a due mani non puoi tenere lo scudo');
  z.splice(i,1);const vecchio=q[slot];if(vecchio)z.push(vecchio);q[slot]=id;ricalcola(h);return{ok:true}}
 function togli(h,slot){const q=h.equip||{};if(!SLOT_EQ.includes(slot)||!q[slot])return ER('Non c\'è nulla da togliere');
  const z=h.zaino||(h.zaino=[]);if(z.length>=MAX_ZAINO)return ER('Lo zaino è pieno');z.push(q[slot]);q[slot]=null;ricalcola(h);return{ok:true}}
 function allaCintura(h,id){const it=OGG[id],z=h.zaino||[],i=z.indexOf(id);if(!it||it.slot!=='cons')return ER('Alla cintura vanno solo i consumabili');
  if(i<0)return ER('L\'oggetto non è nello zaino');const c=h.cintura||(h.cintura=[]);if(c.length>=MAX_CINTURA)return ER('La cintura è piena');
  z.splice(i,1);c.push(id);return{ok:true}}
 function dallaCintura(h,id){const c=h.cintura||[],i=c.indexOf(id);if(i<0)return ER('Non è alla cintura');
  const z=h.zaino||(h.zaino=[]);if(z.length>=MAX_ZAINO)return ER('Lo zaino è pieno');c.splice(i,1);z.push(id);return{ok:true}}
 // uso fuori dalla battaglia: per ora solo le cure (le bombe e il resto si usano in battaglia). Prende prima dalla cintura.
 function usa(h,id,rnd){const it=OGG[id];if(!it||it.slot!=='cons')return ER('Non si può usare');
  const c=h.cintura||[],z=h.zaino||[],fonte=c.includes(id)?c:z.includes(id)?z:null;if(!fonte)return ER('Non ce l\'hai');
  if(!it.eff.cura)return ER('Si usa in battaglia');if(h.hp<=0)return ER('L\'eroe è a terra');if(h.hp>=h.hpMax)return ER('È già in forma');
  const r=DAD.danno(rnd,it.eff.cura),n=Math.min(h.hpMax,h.hp+r.tot)-h.hp;h.hp+=n;fonte.splice(fonte.indexOf(id),1);return{ok:true,cura:n,dadi:r.dadi}}
 // la scheda dopo aver provato a equipaggiare (per il confronto nella vista), oppure null
 const conId=(h,id)=>{const c=JSON.parse(JSON.stringify(h));if(!c.zaino||!c.zaino.includes(id))c.zaino=(c.zaino||[]).concat([id]);return c};
 function anteprima(h,id,slot){const c=conId(h,id);return equipaggia(c,id,slot).err?null:c}
 // perché non si può equipaggiare (testo) oppure null se si può
 function verifica(h,id,slot){return equipaggia(conId(h,id),id,slot).err||null}
 const sg=n=>(n>=0?'+':'')+n;
 // righe di testo che descrivono un oggetto (per la vista)
 function descrivi(id){const it=OGG[id];if(!it)return[];const r=[],f=it.fx||{};
  if(it.slot==='arma'){r.push((it.n>1?it.n:'')+'d'+it.dado+' '+it.tipo);if(it.acc)r.push('accurata');if(it.due)r.push('due mani');if(it.lan)r.push('da lancio '+it.lan.join('/'));if(it.gt)r.push('gittata '+it.gt.join('/'));if(it.por>1)r.push('portata '+it.por)}
  else if(it.slot==='armatura')r.push('CA '+it.ca+(it.desMax===0?'':it.desMax==null?' + Des':' + Des (max '+it.desMax+')'),NOME_TIPO[it.tipo]);
  else if(it.slot==='scudo')r.push(sg(it.ca)+' CA');
  for(const [k,n] of[['ca','CA'],['att','attacco'],['dan','danno'],['iniz','iniziativa'],['mov','movimento'],['hp','PF'],['salv','tiri salvezza']])if(f[k])r.push(sg(f[k])+' '+n);
  for(const [a,n] of Object.entries(f.ab||{}))r.push(sg(n)+' '+E.NOME_AB[a]);
  if(f.res&&f.res.length)r.push('resiste a '+f.res.join(', '));
  if(it.slot==='cons'){const e=it.eff;if(e.cura)r.push('cura '+e.cura);if(e.danno)r.push(e.danno+' '+e.tipo+', gittata '+e.gt);if(e.rimuovi)r.push('toglie: '+e.rimuovi.join(', '));
   if(e.conc)r.push('+'+e.conc+' Concentrazione');if(e.temp)r.push(e.temp+' PF temporanei');if(e.stato)r.push('stato: '+e.stato)}
  if(it.slot==='miss')r.push('oggetto di missione');return r}
 return{OGG,ID,RARITA,SLOT_EQ,MAX_ZAINO,MAX_CINTURA,slotOk,slotPer,bonus,invValido,ricalcola,equipaggia,togli,allaCintura,dallaCintura,usa,anteprima,verifica,descrivi}})();
if(typeof module!=='undefined')module.exports=AOGG;
