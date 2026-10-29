/* ---- Poteri, talenti e tratti di razza dell'avventura (Cantari di Ventura). Regole pure; stati e danni in 27d-avv-stati.js (ASTA). ----
   Cosa fa questo modulo e cosa no: APOT sa **che cosa fa un potere a una creatura** (tiro, danno, cura, stato, cariche); la **geometria**
   (portata, linea di vista, chi sta nell'area) la decide la battaglia (A4), che sceglie i bersagli e poi chiama `applica`.
   Risorse (decisione di A3): niente riserva di energia. Ogni potere ha le sue cariche: `turno` = a volontà, `scontro` = tornano a ogni battaglia,
   `breve` = tornano dopo un riposo breve o lungo, `lungo` = solo dopo un riposo lungo. In più la **Concentrazione** (bonus di competenza, +1 col
   talento o col mago), che ritira un dado o dà vantaggio (la spende la battaglia).
   Un potere: { id, nome, cl, liv, costo:'azione'|'bonus'|'reazione', ric, usi, att:'arma'|'magia'|null, attMod, salv:abilità|null, meta (metà danno se
   la salvezza riesce), gitt:n|'arma', area:'singolo'|'se'|'aura'|'cerchio'|'cono'|'linea', raggio, bers:'nemico'|'nemici'|'alleato'|'alleati'|'amico'|
   'amici'|'terra'|'se', multi (attacchi), eff:[…], desc }. Effetti: danno, cura, temp, stato, rimuovi, conc, riduci, ritira, tenace, spingi, disimpegna.
   Niente fuoco amico: le aree colpiscono solo l'altra parte. Mai Math.random: i dadi arrivano da `rnd` (ADADI.gen). */
const APOT=(()=>{
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const ST=typeof ASTA!=='undefined'?ASTA:require('./27d-avv-stati.js');
 const ER_=()=>typeof EROI!=='undefined'?EROI:require('./27-eroi.js');
 const AO=()=>typeof AOGG!=='undefined'?AOGG:require('./27b-avv-oggetti.js');
 const ERR=err=>({err});
 const P={},TAL={},PASS={};
 const pot=(id,nome,cl,liv,costo,ric,o)=>{P[id]=Object.assign({id,nome,cl,liv,costo,ric,usi:ric==='turno'?null:1,att:null,attMod:0,salv:null,meta:false,gitt:1,area:'singolo',raggio:0,bers:'nemico',multi:1,eff:[]},o);return P[id]};
 // effetti: W = danno dell'arma (mult = moltiplica i dadi, bonus = in più), D = dadi fissi, C = cura, S = stato
 const W=o=>Object.assign({k:'danno',arma:true},o),D=(expr,tipo,o)=>Object.assign({k:'danno',expr,tipo},o),C=(expr,o)=>Object.assign({k:'cura',expr},o),S=(id,t,o)=>Object.assign({k:'stato',id,t},o);
 // forme: su di sé, intorno a sé, area a distanza, linea e cono che partono da chi usa il potere
 const SE={gitt:0,area:'se',bers:'se'},AU=(r,b)=>({gitt:0,area:'aura',raggio:r,bers:b}),CE=(g,r,b)=>({gitt:g,area:'cerchio',raggio:r,bers:b||'nemici'}),LI=(r)=>({gitt:0,area:'linea',raggio:r,bers:'nemici'});
 const FISICI=ST.FISICI,CURABILI=['avvelenato','accecato','stordito','maledetto','in-fiamme','congelato','rallentato','impigliato'];
 // ---- base: l'attacco con l'arma in mano ----
 pot('attacco','Attacco','base',0,'azione','turno',{att:'arma',gitt:'arma',eff:[W()],desc:"Colpisci con l'arma in mano."});
 // ---- tratti di razza (uno solo, una volta per scontro) ----
 pot('r-umano','Versatile','razza',1,'bonus','scontro',Object.assign({eff:[{k:'conc',n:1}],desc:"Un lampo d'ingegno: ti torna un punto di Concentrazione."},SE));
 pot('r-elfo','Vista acuta','razza',1,'bonus','scontro',Object.assign({eff:[S('mirato',2)],desc:'Il tuo prossimo attacco è guidato da occhi che non sbagliano.'},SE));
 pot('r-nano','Pelle di pietra','razza',1,'reazione','scontro',Object.assign({eff:[{k:'riduci',expr:'1d10',piu:['liv']}],desc:'Il colpo rimbalza su una pelle dura come la roccia.'},SE));
 pot('r-piccolo','Fortunato','razza',1,'reazione','scontro',{gitt:6,area:'singolo',bers:'alleato',eff:[{k:'ritira'}],desc:'Un tiro appena fatto (tuo o di un compagno) si ritira e conta il nuovo.'});
 pot('r-orco','Furia tenace','razza',1,'reazione','scontro',Object.assign({eff:[{k:'tenace'}],desc:'Scendi a zero PF? Resti in piedi con uno.'},SE));
 const RAZZA_POT={umano:'r-umano',elfo:'r-elfo',nano:'r-nano',piccolo:'r-piccolo',orco:'r-orco'};
 // ---- Guerriero ----
 pot('colpo-possente','Colpo possente','guerriero',1,'azione','turno',{att:'arma',gitt:'arma',attMod:-2,eff:[W({bonus:3})],desc:'Tutto il peso del corpo dietro il colpo: meno preciso, più forte.'});
 pot('riprendi-fiato','Riprendere fiato','guerriero',1,'bonus','breve',Object.assign({eff:[C('1d10',{piu:['liv']})],desc:'Un respiro profondo e la fatica passa.'},SE));
 pot('parata','Parata','guerriero',3,'reazione','scontro',Object.assign({usi:2,eff:[{k:'riduci',expr:'1d10',piu:['mod']}],desc:'Alzi la guardia al momento giusto.'},SE));
 pot('fendente-rapido','Fendente rapido','guerriero',3,'bonus','scontro',{usi:2,att:'arma',gitt:'arma',eff:[W()],desc:'Un secondo colpo prima che il nemico si riprenda.'});
 pot('urto-di-scudo','Urto di scudo','guerriero',5,'azione','scontro',{usi:2,att:'arma',gitt:1,eff:[W(),{k:'spingi',n:2},S('stordito',1,{salv:'cos'})],desc:'Colpisci e spingi indietro: chi non regge resta stordito.'});
 pot('grido-di-guerra','Grido di guerra','guerriero',5,'bonus','scontro',Object.assign({eff:[S('provocato',2),{k:'temp',n:5,piu:['liv'],su:'attore'}],desc:'Un urlo che attira su di te ogni lama.'},AU(3,'nemici')));
 pot('raffica-d-acciaio','Raffica d\'acciaio','guerriero',7,'azione','scontro',{multi:2,att:'arma',gitt:'arma',eff:[W()],desc:'Due colpi in un respiro.'});
 pot('baluardo','Baluardo','guerriero',7,'bonus','scontro',Object.assign({eff:[S('protetto',2,{ca:3,res:FISICI,fino:'inizio'})],desc:'Ti pianti a terra: i colpi fanno meno male.'},SE));
 pot('furia-del-campione','Furia del campione','guerriero',9,'azione','lungo',{att:'arma',gitt:1,eff:[W({mult:3}),S('stordito',1,{salv:'cos'})],desc:'Il colpo di una vita.'});
 pot('ultimo-baluardo','Ultimo baluardo','guerriero',9,'reazione','lungo',Object.assign({eff:[{k:'tenace'},{k:'temp',n:10,piu:['liv']}],desc:'Non cadi, non ora.'},SE));
 PASS.guerriero={nome:'Occhio del veterano',desc:'Colpisci in modo critico con 19 o 20.',hook:{crit:19}};
 // ---- Ladro ----
 pot('agguato','Agguato','ladro',1,'bonus','turno',Object.assign({eff:[S('nascosto')],desc:"Ti getti nell'ombra più vicina."},SE));
 pot('lama-avvelenata','Lama avvelenata','ladro',1,'azione','scontro',{usi:2,att:'arma',gitt:1,eff:[W(),D('1d6','veleno'),S('avvelenato',3,{salv:'cos'})],desc:'Una lama unta di qualcosa di peggio del sudore.'});
 pot('colpo-ai-garretti','Colpo ai garretti','ladro',3,'azione','scontro',{usi:2,att:'arma',gitt:1,eff:[W(),S('rallentato',3)],desc:'Chi non cammina bene non scappa.'});
 pot('finta-e-sparisci','Finta e sparisci','ladro',3,'bonus','scontro',Object.assign({usi:2,eff:[S('nascosto'),{k:'disimpegna'}],desc:'Una finta, un passo indietro, e non ci sei più.'},SE));
 pot('danza-di-lame','Danza di lame','ladro',5,'azione','scontro',Object.assign({att:'arma',eff:[W()],desc:'Giri su te stesso: tutti quelli vicini assaggiano il filo.'},AU(1,'nemici')));
 pot('schivata-mirabile','Schivata mirabile','ladro',5,'reazione','scontro',Object.assign({usi:2,eff:[{k:'riduci',meta:true}],desc:'Ti sposti appena: il danno si dimezza.'},SE));
 pot('colpo-mortale','Colpo mortale','ladro',7,'azione','breve',{att:'arma',gitt:1,eff:[W({mult:2,bonus:3})],desc:'Il punto esatto, la forza esatta.'});
 pot('veleno-paralizzante','Veleno paralizzante','ladro',7,'azione','scontro',{att:'arma',gitt:1,eff:[W(),S('stordito',1,{salv:'cos'})],desc:'Un graffio e le gambe non rispondono più.'});
 pot('mille-tagli','Mille tagli','ladro',9,'azione','lungo',{multi:3,att:'arma',gitt:1,eff:[W()],desc:'Tre lampi di acciaio, uno dopo l\'altro.'});
 pot('ombra-vivente','Ombra vivente','ladro',9,'bonus','lungo',Object.assign({eff:[S('nascosto'),S('mirato',2),{k:'temp',n:8,piu:['liv']}],desc:'Diventi parte del buio.'},SE));
 PASS.ladro={nome:'Colpo furtivo',desc:'Una volta per turno, se hai vantaggio o un alleato vicino al bersaglio, aggiungi dadi di danno (1d6, +1d6 ogni tre livelli).',hook:{furtivo:1}};
 // ---- Mago ----
 pot('scintilla-arcana','Scintilla arcana','mago',1,'azione','turno',{att:'magia',gitt:6,eff:[D('1d8','fulmine',{piu:['mod'],scala:[5,9]})],desc:'Un dardo di pura energia.'});
 pot('scudo-magico','Scudo magico','mago',1,'reazione','scontro',Object.assign({usi:2,eff:[S('protetto',1,{ca:4,fino:'inizio'})],desc:"Un'aura invisibile devia il colpo."},SE));
 pot('sfera-di-fiamme','Sfera di fiamme','mago',3,'azione','scontro',Object.assign({usi:2,salv:'des',meta:true,eff:[D('3d6','fuoco'),S('in-fiamme',2)],desc:"Una palla di fuoco che esplode all'impatto."},CE(6,1)));
 pot('raggio-di-gelo','Raggio di gelo','mago',3,'azione','breve',{usi:3,att:'magia',gitt:6,eff:[D('3d6','gelo'),S('congelato',2)],desc:'Un raggio che trasforma il sudore in ghiaccio.'});
 pot('nube-accecante','Nube accecante','mago',5,'azione','scontro',Object.assign({salv:'cos',eff:[S('accecato',2)],desc:'Una nube di polvere lucente.'},CE(6,2)));
 pot('fulmine','Fulmine','mago',5,'azione','scontro',Object.assign({usi:2,salv:'des',meta:true,eff:[D('5d6','fulmine')],desc:'Una saetta che attraversa tutti.'},LI(6)));
 pot('tempesta-di-fuoco','Tempesta di fuoco','mago',7,'azione','breve',Object.assign({salv:'des',meta:true,eff:[D('7d6','fuoco'),S('in-fiamme',2)],desc:'Il cielo si apre e piove fuoco.'},CE(6,2)));
 pot('parola-di-stasi','Parola di stasi','mago',7,'azione','breve',{salv:'sag',gitt:6,eff:[S('stordito',1)],desc:'Una sillaba che ferma il tempo di un nemico.'});
 pot('pioggia-di-meteore','Pioggia di meteore','mago',9,'azione','lungo',Object.assign({salv:'des',meta:true,eff:[D('10d6','fuoco')],desc:'Pietre infuocate dal cielo.'},CE(8,3)));
 pot('veste-di-brina','Veste di brina','mago',9,'bonus','lungo',Object.assign({eff:[S('protetto',3,{ca:3,res:['fuoco','gelo','fulmine'],fino:'inizio'}),{k:'temp',n:10,piu:['liv']}],desc:'Un mantello di ghiaccio che respinge le magie.'},SE));
 PASS.mago={nome:'Mente aperta',desc:'Un punto di Concentrazione in più.',hook:{conc:1}};
 // ---- Chierico ----
 pot('fiamma-sacra','Fiamma sacra','chierico',1,'azione','turno',{att:'magia',gitt:6,eff:[D('1d8','radioso',{piu:['mod'],scala:[5,9]})],desc:'Una fiamma bianca che non brucia gli innocenti.'});
 pot('tocco-guaritore','Tocco guaritore','chierico',1,'azione','breve',{usi:3,gitt:1,bers:'amico',eff:[C('1d8',{piu:['mod']})],desc:'Le tue mani chiudono le ferite, anche a chi è a terra.'});
 pot('benedizione','Benedizione','chierico',3,'azione','breve',Object.assign({usi:2,eff:[S('benedetto',3)],desc:'Una preghiera sussurrata a tutta la compagnia.'},AU(3,'alleati')));
 pot('colpo-radioso','Colpo radioso','chierico',3,'azione','scontro',{usi:2,att:'arma',gitt:1,eff:[W(),D('2d8','radioso')],desc:"L'arma si accende di luce."});
 pot('preghiera-di-gruppo','Preghiera di gruppo','chierico',5,'azione','breve',Object.assign({eff:[C('2d8',{piu:['mod']})],desc:'Una luce calda su tutti i compagni.'},AU(3,'amici')));
 pot('colonna-di-luce','Colonna di luce','chierico',5,'azione','scontro',Object.assign({salv:'des',meta:true,eff:[D('4d8','radioso')],desc:'Una colonna di luce scende dal cielo.'},CE(6,1)));
 pot('purificazione','Purificazione','chierico',7,'azione','breve',{gitt:1,bers:'amico',eff:[{k:'rimuovi',stati:CURABILI},C('2d8',{piu:['mod']})],desc:'Veleni, maledizioni e fiamme svaniscono.'});
 pot('martello-sacro','Martello sacro','chierico',7,'azione','scontro',{att:'arma',gitt:1,eff:[W(),D('3d8','radioso')],desc:'Un colpo che pesa come una sentenza.'});
 pot('rialzati','Rialzati!','chierico',9,'azione','lungo',{gitt:1,bers:'terra',eff:[C('4d8',{piu:['mod','liv']}),S('benedetto',3)],desc:'Chi è a terra si rialza, più forte di prima.'});
 pot('ira-divina','Ira divina','chierico',9,'azione','lungo',Object.assign({salv:'sag',meta:true,eff:[D('7d8','radioso'),S('maledetto',3)],desc:'Il giudizio cade su chi ti ostacola.'},CE(5,3)));
 PASS.chierico={nome:'Mani benevole',desc:'Le tue cure curano di più (il bonus di competenza).',hook:{cura:'comp'}};
 // ---- Esploratore ----
 pot('occhio-del-cacciatore','Occhio del cacciatore','esploratore',1,'bonus','turno',Object.assign({eff:[S('mirato',2)],desc:'Respiri, scegli il punto, e il prossimo colpo è tuo.'},SE));
 pot('tiro-incalzante','Tiro incalzante','esploratore',1,'azione','scontro',{usi:2,att:'arma',gitt:'arma',eff:[W({bonus:3}),S('rallentato',2)],desc:'Un colpo alle gambe: il nemico rallenta.'});
 pot('pioggia-di-frecce','Pioggia di frecce','esploratore',3,'azione','scontro',Object.assign({att:'arma',eff:[W()],desc:'Una nuvola di frecce sulla zona.'},CE('arma',1)));
 pot('passo-nel-bosco','Passo nel bosco','esploratore',3,'bonus','scontro',Object.assign({usi:2,eff:[S('nascosto'),{k:'disimpegna'}],desc:'Ti dilegui tra le foglie.'},SE));
 pot('doppio-tiro','Doppio tiro','esploratore',5,'azione','scontro',{usi:2,multi:2,att:'arma',gitt:'arma',eff:[W()],desc:'Due frecce, un solo respiro.'});
 pot('trappola-a-molla','Trappola a molla','esploratore',5,'azione','scontro',Object.assign({usi:2,salv:'des',eff:[D('2d6','perforante'),S('impigliato',2)],desc:'Una tagliola nascosta nell\'erba.'},CE(4,1)));
 pot('freccia-perforante','Freccia perforante','esploratore',7,'azione','scontro',Object.assign({att:'arma',eff:[W({mult:2})],desc:'Una freccia che attraversa chiunque trovi.'},LI(6)));
 pot('balsamo-del-bosco','Balsamo del bosco','esploratore',7,'azione','breve',{usi:2,gitt:1,bers:'amico',eff:[C('3d6',{piu:['mod']}),{k:'rimuovi',stati:['avvelenato']}],desc:'Erbe masticate e applicate sulla ferita.'});
 pot('raffica-del-cacciatore','Raffica del cacciatore','esploratore',9,'azione','lungo',{multi:3,att:'arma',gitt:'arma',eff:[W()],desc:'Tre frecce una dopo l\'altra.'});
 pot('freccia-uccisore','Freccia uccisore','esploratore',9,'azione','lungo',{att:'arma',gitt:'arma',eff:[W({mult:4})],desc:'La freccia che la tua mano ha imparato a tirare in una vita.'});
 PASS.esploratore={nome:'Passo leggero',desc:'+1 al movimento e il terreno difficile non ti rallenta.',hook:{mov:1,ignoraDifficile:true}};
 // ---- Bardo ----
 pot('nota-potente','Nota potente','bardo',1,'azione','turno',{salv:'cos',gitt:6,eff:[D('1d8','contundente',{piu:['mod'],scala:[5,9]})],desc:'Una nota così forte da far tremare le ossa.'});
 pot('canto-di-coraggio','Canto di coraggio','bardo',1,'bonus','breve',Object.assign({usi:2,eff:[S('benedetto',3)],desc:'Una canzone che scalda il cuore.'},AU(3,'alleati')));
 pot('canzone-che-guarisce','Canzone che guarisce','bardo',3,'azione','breve',Object.assign({usi:2,eff:[C('1d8',{piu:['mod']})],desc:'Una ninna nanna sulle ferite.'},AU(3,'alleati')));
 pot('colpo-di-scena','Colpo di scena','bardo',3,'reazione','scontro',{usi:2,gitt:6,bers:'alleato',eff:[{k:'ritira'}],desc:'Il destino cambia copione.'});
 pot('marcia-di-guerra','Marcia di guerra','bardo',5,'bonus','scontro',Object.assign({eff:[S('mirato',2),{k:'temp',n:4,piu:['liv']}],desc:'Un ritmo di tamburo che spinge in avanti.'},AU(3,'alleati')));
 pot('risata-folle','Risata folle','bardo',5,'azione','scontro',Object.assign({salv:'sag',eff:[S('maledetto',3),S('rallentato',2)],desc:'Una risata che toglie la voglia di combattere.'},CE(5,2)));
 pot('inno-del-trionfo','Inno del trionfo','bardo',7,'azione','breve',Object.assign({eff:[C('3d8',{piu:['mod']})],desc:'Un inno che rialza anche chi è caduto.'},AU(4,'amici')));
 pot('tempesta-di-note','Tempesta di note','bardo',7,'azione','scontro',Object.assign({salv:'cos',meta:true,eff:[D('6d6','contundente')],desc:'Un finale in crescendo.'},CE(6,2)));
 pot('canzone-della-rinascita','Canzone della rinascita','bardo',9,'azione','lungo',Object.assign({eff:[C('3d8',{piu:['mod']}),S('benedetto',3)],desc:'La canzone che nessuno vuole che finisca.'},AU(4,'amici')));
 pot('finale-magistrale','Finale magistrale','bardo',9,'azione','lungo',Object.assign({eff:[S('benedetto',3),S('mirato',2),{k:'conc',n:1}],desc:'Il pubblico è in piedi, la compagnia è invincibile.'},AU(4,'alleati')));
 PASS.bardo={nome:'Orecchio fino',desc:'+3 alla iniziativa: sei il primo a cantare.',hook:{iniz:3}};
 // ---- talenti (livelli pari): effetto in numeri letti da `ganci` ----
 const tal=(id,nome,desc,hook)=>{TAL[id]={id,nome,desc,hook}};
 tal('occhio-vigile','Occhio vigile','+3 alla iniziativa.',{iniz:3});
 tal('piede-svelto','Piede svelto','+1 al movimento.',{mov:1});
 tal('guardia-alta','Guardia alta','+1 alla CA.',{ca:1});
 tal('mano-ferma','Mano ferma','+1 ai tiri per colpire.',{att:1});
 tal('colpo-pesante','Colpo pesante','+1 al danno.',{dan:1});
 tal('pelle-dura','Pelle dura','A inizio scontro ottieni PF temporanei (4 + livello).',{temp:4});
 tal('mente-lucida','Mente lucida','Un punto di Concentrazione in più.',{conc:1});
 tal('fibra-forte','Fibra forte','+1 a tutti i tiri salvezza.',{salv:1});
 tal('mani-guaritrici','Mani guaritrici','+2 a tutte le cure che dai.',{cura:2});
 tal('sangue-freddo','Sangue freddo','Resistenza al veleno.',{res:['veleno']});
 tal('pelle-di-brace','Pelle di brace','Resistenza al fuoco.',{res:['fuoco']});
 tal('fede-salda','Fede salda','Resistenza al necrotico.',{res:['necrotico']});
 tal('colpo-basso','Colpo basso','Un dado di furtivo in più (anche se non sei un ladro).',{furtivo:1});
 tal('tiro-teso','Tiro teso','+1 esagono di portata a distanza.',{gitt:1});
 tal('riserva-di-forze','Riserva di forze','Un uso in più dei poteri «a scontro».',{usiScontro:1});
 tal('rialzo-rapido','Rialzo rapido','Chi ti rialza ti rimette in piedi con 4 PF in più.',{rialzo:4});
 tal('spirito-indomito','Spirito indomito','Gli stati negativi su di te durano un turno in meno.',{breve:1});
 tal('passo-d-ombra','Passo d\'ombra','Nasconditi con un\'azione bonus.',{nascondiBonus:true});
 tal('mano-lesta','Mano lesta','Usi gli oggetti con un\'azione bonus.',{oggBonus:true});
 tal('sguardo-gelido','Sguardo gelido','Tiri l\'iniziativa con vantaggio.',{inizVant:true});
 const TAL_ID=Object.keys(TAL);
 const LIV_POTERE=[3,5,7,9],LIV_TALENTO=[2,4,6,8,10];
 const hashTesto=t=>[...String(t)].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,7);
 // ---- scelte guidate: poteri ai livelli 3,5,7,9 (uno di due), talenti ai livelli pari (uno di due estratti dai 20) ----
 const opzioni=(classe,L)=>Object.keys(P).filter(i=>P[i].cl===classe&&P[i].liv===L);
 // i due talenti proposti: dipendono dalla scheda (`creato`), dal livello e da quelli già presi ai livelli precedenti, non dall'ora né da un ricaricamento
 function offertaTalenti(h,L){const presi=new Set(Object.entries(h.scelte||{}).filter(([k,v])=>+k<L&&TAL[v]).map(([,v])=>v));
  const pool=TAL_ID.filter(i=>!presi.has(i)),g=DAD.gen({rng:DAD.semina((h.creato|0)+Math.imul(L,7919)+hashTesto(h.classe))});
  const a=pool.splice(Math.floor(g()*pool.length),1)[0],b=pool.splice(Math.floor(g()*pool.length),1)[0];return[a,b]}
 const offerta=(h,L)=>LIV_TALENTO.includes(L)?offertaTalenti(h,L):LIV_POTERE.includes(L)?opzioni(h.classe,L):[];
 const tipoLivello=L=>LIV_TALENTO.includes(L)?'talento':LIV_POTERE.includes(L)?'potere':null;
 // scelte ancora da fare ai livelli già raggiunti: [{liv, tipo, opzioni:[id,id]}]
 function daScegliere(h){const r=[];for(let L=2;L<=(h.liv||1);L++)if(tipoLivello(L)&&!(h.scelte||{})[L])r.push({liv:L,tipo:tipoLivello(L),opzioni:offerta(h,L)});return r}
 // motivo per cui `scelte` non va bene, oppure null
 function scelteErr(h){const s=h.scelte;if(s===undefined)return null;if(!s||typeof s!=='object'||Array.isArray(s))return'scelte non valide';
  for(const [k,v] of Object.entries(s)){const L=+k;if(!Number.isInteger(L)||String(L)!==k||L<2||L>(h.liv||1)||!tipoLivello(L))return'livello non valido';
   if(!offerta(h,L).includes(v))return'scelta non proposta al livello '+L}return null}
 // nuova scheda con la scelta fatta, oppure {err}
 function scegli(h,L,id){const t=tipoLivello(L);if(!t||L>(h.liv||1))return ERR('Livello non valido');if((h.scelte||{})[L])return ERR('Già scelto');
  if(!offerta(h,L).includes(id))return ERR('Non è tra le scelte');return{...h,scelte:{...(h.scelte||{}),[L]:id}}}
 // chi non ha scelto (campagna avviata senza passare dalla scheda): la prima opzione, così si può giocare
 // (le proposte dei talenti dipendono da quelli già presi: si riprendono a ogni livello)
 function completa(h){let x=h;for(let L=2;L<=(h.liv||1);L++)if(tipoLivello(L)&&!(x.scelte||{})[L]){const r=scegli(x,L,offerta(x,L)[0]);if(!r.err)x=r}return x}
 const poteriEroe=h=>{const ids=['attacco'],liv=h.liv||1;if(RAZZA_POT[h.razza])ids.push(RAZZA_POT[h.razza]);
  ids.push(...opzioni(h.classe,1));for(const L of LIV_POTERE){const s=(h.scelte||{})[L];if(L<=liv&&s&&opzioni(h.classe,L).includes(s))ids.push(s)}return ids};
 const talentiEroe=h=>{const liv=h.liv||1;return LIV_TALENTO.filter(L=>L<=liv&&TAL[(h.scelte||{})[L]]).map(L=>h.scelte[L])};
 // numeri che passivo di classe e talenti aggiungono al combattente
 function ganci(h){const E=ER_(),liv=h.liv||1,g={ca:0,att:0,dan:0,iniz:0,mov:0,salv:0,conc:0,temp:0,cura:0,rialzo:0,furtivo:0,gitt:0,usiScontro:0,crit:20,breve:0,
   nascondiBonus:false,oggBonus:false,inizVant:false,ignoraDifficile:false,res:[]};
  const somma=hk=>{for(const [k,v] of Object.entries(hk)){if(k==='crit')g.crit=Math.min(g.crit,v);else if(k==='res')g.res.push(...v);else if(typeof v==='boolean')g[k]=g[k]||v;else if(k==='cura'&&v==='comp')g.cura+=E.comp(liv);else g[k]+=v}};
  if(PASS[h.classe])somma(PASS[h.classe].hook);if(h.classe==='ladro')g.furtivo+=Math.floor((liv-1)/3);
  for(const id of talentiEroe(h))somma(TAL[id].hook);return g}
 // ---- il combattente di un eroe (stessa forma dei mostri di 27f-avv-bestiario.js) ----
 function combattente(h,o){o=o||{};const E=ER_(),d=E.derivati(h),cl=E.CLASSI[h.classe],liv=h.liv||1,g=ganci(h),mp=E.mod(d.stat[cl.primaria]),cp=E.comp(liv),arma=AO().OGG[(h.equip||{}).arma];
  const salv={};for(const k of E.STAT)salv[k]=E.mod(d.stat[k])+(d.salvezze.includes(k)?cp:0)+d.salvBonus+g.salv;
  const concMax=cp+g.conc,c={id:o.id||h.slot||'e0',nome:h.nome,lato:'eroi',tipo:'eroe',classe:h.classe,razza:h.razza,liv,hp:h.hp==null?d.hpMax:Math.max(0,Math.min(h.hp,d.hpMax)),hpMax:d.hpMax,temp:0,
   ca:d.ca+g.ca,att:d.attacco+g.att,magia:cp+mp+AO().bonus(h).att+g.att,dan:d.danno?{n:d.danno.n,dado:d.danno.dado,bonus:d.danno.bonus+g.dan,tipo:d.danno.tipo}:{n:1,dado:2,bonus:0,tipo:'contundente'},
   salv,cd:8+cp+mp,iniz:d.iniziativa+g.iniz,mov:d.mov+g.mov,gitt:(arma&&(arma.gt?arma.gt[0]:(arma.por||1))||1)+(arma&&arma.gt?g.gitt:0),gittaLunga:arma&&arma.gt?arma.gt[1]+g.gitt:null,
   crit:g.crit,res:[...new Set(d.res.concat(g.res))],vuln:[],imm:[],immStati:[],stati:[],modPrim:mp,conc:h.conc==null?concMax:Math.max(0,Math.min(h.conc,concMax)),concMax,
   usi:{...(h.usi||{})},poteri:poteriEroe(h),hook:g,cintura:(h.cintura||[]).slice(),abil:{perc:10+E.bonus(h,'percezione'),fur:E.bonus(h,'furtivita'),med:E.bonus(h,'medicina')}};
  if(c.hp<=0){c.hp=0;ST.aggiungi(c,'terra')}return c}
 // ---- uso dei poteri ----
 const usiMax=(c,p)=>p.ric==='turno'?Infinity:(p.usi||1)+(p.ric==='scontro'?((c.hook||{}).usiScontro||0):0);
 const usiRimasti=(c,p)=>usiMax(c,p)-((c.usi||{})[p.id]||0);
 function puoUsare(c,p){if(!c.poteri.includes(p.id))return'Non conosci questo potere';if(c.morto||c.hp<=0||!ST.puoAgire(c))return c.nome+' non può agire';
  if(usiRimasti(c,p)<=0)return'Cariche esaurite';return null}
 // controllo dei bersagli rispetto a `bers` e `area` (non guarda distanze: lo fa la battaglia)
 function validaBers(c,p,bs){if(p.area==='se')return bs.length===0||(bs.length===1&&bs[0]===c)?null:'Il potere agisce su chi lo usa';
  if(!bs.length)return'Scegli almeno un bersaglio';if(p.area==='singolo'&&bs.length!==1)return'Serve un solo bersaglio';
  for(const b of bs){const vivo=b.hp>0&&!b.morto,amico=b.lato===c.lato;
   if((p.bers==='nemico'||p.bers==='nemici')&&(amico||!vivo))return'Serve un nemico in piedi';
   if((p.bers==='alleato'||p.bers==='alleati')&&(!amico||!vivo))return'Serve un alleato in piedi';
   if((p.bers==='amico'||p.bers==='amici')&&(!amico||b.morto))return'Serve un alleato';
   if(p.bers==='terra'&&(!amico||b.hp>0||b.morto))return'Serve un alleato a terra'}
  return null}
 const fmt=b=>b?(b>0?'+':'')+b:'';
 // espressione di dadi di un effetto: `scala` aggiunge un dado ai livelli indicati, `piu` somma modificatore, livello o competenza
 function espressione(c,e){const l=DAD.leggi(e.expr);let n=l.n,b=l.b+(e.bonus||0);for(const L of(e.scala||[]))if(c.liv>=L)n++;
  for(const q of(e.piu||[]))b+=q==='mod'?(c.modPrim||0):q==='liv'?c.liv:q==='comp'?ER_().comp(c.liv):0;return n+'d'+l.f+fmt(b)}
 const quanto=(c,e)=>e.arma?(c.dan.n*(e.mult||1))+'d'+c.dan.dado+fmt(c.dan.bonus+(e.bonus||0)):espressione(c,e);
 function dannoDi(c,e,rnd,crit,vant,ctx,R){let tot=DAD.danno(rnd,quanto(c,e),crit).tot;
  if(e.arma&&(c.hook||{}).furtivo&&!c.furtivoUsato&&(vant||ctx.alleatoVicino)){c.furtivoUsato=true;const f=DAD.danno(rnd,c.hook.furtivo+'d6',crit).tot;tot+=f;R.ev.push({t:'furtivo',chi:c.id,n:f})}
  return tot}
 function uno(c,p,b,rnd,ctx,R){let crit=false,vant=false,salvOk=null;
  if(p.att){const pb=(ctx.per&&ctx.per[b.id])||{},dif=ST.attacco(c,b,{vant:ctx.vant||pb.vant,svant:ctx.svant||pb.svant}),bonus=(p.att==='magia'?c.magia:c.att)+p.attMod+dif.bonus,cA=()=>ST.caEff(b)+(pb.ca||0);
   const colpisce=r=>r.tiro===20||(r.tiro!==1&&r.tiro+bonus>=cA());let r=DAD.d20(rnd,dif),tiro0=null,pre=[];
   if(ctx.ritira&&!R.ritirato){R.ritirato=true;tiro0=r.tiro;r=DAD.d20(rnd,dif)}                       // Concentrazione: il dado nuovo vale sempre
   let ok=colpisce(r);
   if(ok&&ctx.rea&&ctx.rea.colpo)for(let g=0;g<3&&ok;g++){                                             // reazioni di chi viene colpito: scudo, ritiro
    const x=ctx.rea.colpo(c,p,b,{tiro:r.tiro,tot:r.tiro+bonus,ca:cA(),bonus,crit:r.tiro>=(c.crit||20),giro:g});if(!x)break;
    pre.push(...(x.ev||[]));if(x.ritira){tiro0=r.tiro;r=DAD.d20(rnd,dif)}ok=colpisce(r)}
   crit=ok&&r.tiro>=(c.crit||20);vant=dif.vant;
   const te={t:'tiro',chi:c.id,bers:b.id,tiro:r.tiro,tiri:r.tiri,tot:r.tiro+bonus,cont:cA(),ok,crit,vant:dif.vant,svant:dif.svant};if(tiro0!=null)te.tiro0=tiro0;
   R.ev.push(...pre,te);ST.dopoAttacco(c);if(!ok)return}
  else if(p.salv){const cd=p.cd||c.cd,s=ST.salvezza(b,p.salv,cd,rnd);salvOk=s.ok;R.ev.push({t:'salvezza',bers:b.id,ab:p.salv,tiro:s.tiro,tot:s.tot,cont:cd,ok:s.ok})}
  for(const e of p.eff){const dest=e.su==='attore'?c:b;
   if(e.k==='danno'){if(salvOk&&!p.meta)continue;let n=dannoDi(c,e,rnd,crit,vant,ctx,R);if(salvOk)n=Math.floor(n/2);
    const tipo=e.tipo||c.dan.tipo;let pre=[];
    if(ctx.rea&&ctx.rea.danno&&dest!==c){const x=ctx.rea.danno(c,e,dest,n,tipo,{crit});if(x){n=Math.max(0,n-(x.riduci||0));pre=x.ev||[]}}   // riduzione del danno (parata, schivata, pelle di pietra)
    const r=subisci(dest,n,tipo),de={t:'danno',chi:c.id,bers:dest.id,n:r.n,perso:r.perso,tipo,esito:r.esito,a0:r.a0};if(r.tenace){de.tenace=true;de.potere=r.potere}
    R.ev.push(...pre,de)}
   else if(e.k==='cura'){const n=DAD.danno(rnd,espressione(c,e)).tot+((c.hook||{}).cura||0),r=ST.cura(dest,n);R.ev.push({t:'cura',chi:c.id,bers:dest.id,n:r.n,rialzato:r.rialzato})}
   else if(e.k==='stato'){if(salvOk&&!e.sempre)continue;
    if(e.salv){const s=ST.salvezza(dest,e.salv,c.cd,rnd);if(s.ok){R.ev.push({t:'resiste',bers:dest.id,stato:e.id});continue}}
    const x={};if(e.id==='provocato')x.da=c.id;for(const k of['ca','res','fino'])if(e[k]!=null)x[k]=e[k];
    const se={t:'stato',bers:dest.id,stato:e.id,ok:ST.aggiungi(dest,e.id,e.t,x)};if(e.t!=null)se.dur=e.t;R.ev.push(se)}
   else if(e.k==='temp')R.ev.push({t:'temp',bers:dest.id,n:ST.temp(dest,e.n+(e.piu&&e.piu.includes('liv')?c.liv:0))});
   else if(e.k==='conc'){const n=Math.min(e.n,dest.concMax-dest.conc);dest.conc+=n;R.ev.push({t:'conc',bers:dest.id,n})}
   else if(e.k==='rimuovi')R.ev.push({t:'rimuovi',bers:dest.id,stati:ST.rimuovi(dest,e.stati)});
   else if(e.k==='riduci'){const q=ctx.danno||0;R.ridotto=e.meta?Math.floor(q/2):Math.min(q,DAD.danno(rnd,espressione(c,e)).tot);R.ev.push({t:'riduci',bers:dest.id,n:R.ridotto})}
   else if(e.k==='ritira'){R.ritira=true;R.ev.push({t:'ritira',bers:dest.id})}
   else if(e.k==='tenace'){if(dest.hp<=0&&!dest.morto){dest.hp=1;ST.togli(dest,'terra')}R.tenace=true;R.ev.push({t:'tenace',bers:dest.id})}
   else if(e.k==='spingi')R.ev.push({t:'spingi',bers:b.id,n:e.n});
   else if(e.k==='disimpegna')R.ev.push({t:'disimpegna',chi:c.id})}}
 // usa un potere: `bs` = bersagli scelti dalla battaglia (lista di combattenti). `ctx`: { vant, svant, alleatoVicino, danno (per le riduzioni),
 // per: { idBersaglio: { vant, svant, ca } } = altezza, distanza lunga e copertura di ogni bersaglio, calcolate dalla battaglia,
 // ritira: il primo d20 d'attacco si tira due volte e vale il secondo (Concentrazione),
 // rea: { colpo(att, potere, bers, info) -> { ev, ritira } | null (dopo un tiro a segno: scudo, ritiro dell'attacco),
 //        danno(att, effetto, bers, n, tipo, info) -> { riduci, ev } | null (prima di togliere i PF) } = le reazioni di chi viene colpito, decise dalla battaglia }.
 // Restituisce { ok, ev, ridotto, ritira, tenace } oppure { err }. Spende la carica, cambia i combattenti sul posto.
 function applica(c,id,bs,rnd,ctx){ctx=ctx||{};const p=P[id];if(!p)return ERR('Potere sconosciuto');const e=puoUsare(c,p);if(e)return ERR(e);
  return esegui(c,p,bs,rnd,ctx)}
 function esegui(c,p,bs,rnd,ctx){
  if(p.area==='se')bs=[c];const v=validaBers(c,p,bs||[]);if(v)return ERR(v);
  if(p.ric&&p.ric!=='turno')c.usi[p.id]=(c.usi[p.id]||0)+1;
  const R={ok:true,ev:[],ridotto:0,ritira:false,tenace:false};
  for(let k=0;k<p.multi;k++)for(const b of bs){if(p.att&&(b.hp<=0||b.morto))continue;uno(c,p,b,rnd,ctx,R)}
  return R}
 // ---- consumabili della cintura: ognuno è un potere sintetico (stesse regole, nessuna carica: si consuma l'oggetto) ----
 // cure, antidoto, elisir: azione bonus su sé o su chi è vicino (anche a terra); tonico: su di sé; benedizione: azione, intorno a sé; bombe e pergamene: azione,
 // area di raggio 1 dove cade (entro `gt` esagoni), salvezza di Destrezza CD 12 per metà danno, il fuoco accende e il gelo rallenta.
 const OGGP={};
 function oggetto(id){if(OGGP[id])return OGGP[id];const it=AO().OGG[id];if(!it||it.slot!=='cons')return null;const e=it.eff,tocco={costo:'bonus',area:'singolo',gitt:1,bers:'amico'};let x=null;
  if(e.danno)x={costo:'azione',area:'cerchio',raggio:1,gitt:e.gt||5,bers:'nemici',salv:'des',cd:12,meta:true,eff:[D(e.danno,e.tipo)].concat(e.tipo==='fuoco'?[S('in-fiamme',2)]:e.tipo==='gelo'?[S('rallentato',2)]:[])};
  else if(e.stato)x={costo:'azione',area:'aura',raggio:3,gitt:0,bers:'alleati',eff:[S(e.stato,3)]};
  else if(e.conc)x={costo:'bonus',area:'se',gitt:0,bers:'se',eff:[{k:'conc',n:e.conc}]};
  else if(e.cura)x=Object.assign({eff:[C(e.cura)]},tocco);else if(e.rimuovi)x=Object.assign({eff:[{k:'rimuovi',stati:e.rimuovi}]},tocco);else if(e.temp!=null)x=Object.assign({eff:[{k:'temp',n:e.temp}]},tocco);
  if(!x)return null;return OGGP[id]=Object.assign({id:'o:'+id,nome:it.nome,att:null,attMod:0,salv:null,meta:false,multi:1,raggio:0,ric:null,oggetto:id},x)}
 // usa un consumabile: stessi bersagli e stessi effetti di un potere; chi lo chiama toglie l'oggetto dalla cintura
 function applicaOggetto(c,id,bs,rnd,ctx){const p=oggetto(id);if(!p)return ERR('Non si può usare in battaglia');if(c.morto||c.hp<=0||!ST.puoAgire(c))return ERR(c.nome+' non può agire');return esegui(c,p,bs,rnd,ctx||{})}
 // quanto toglie in media una riduzione (per chi sceglie se usarla)
 function stimaRiduzione(c,id,n){const p=P[id],e=p&&p.eff.find(x=>x.k==='riduci');if(!e)return 0;return e.meta?Math.floor(n/2):Math.min(n,DAD.medio(espressione(c,e)))}
 // danno subito con la reazione «tenace» (Furia tenace, Ultimo baluardo) che scatta da sola se serve a restare in piedi
 function subisci(c,n,tipo){let usa=null;const e=ST.effettivo(c,n,tipo);
  if(c.hp>0&&ST.puoAgire(c)&&e.n-(c.temp||0)>=c.hp)usa=c.poteri.map(i=>P[i]).find(p=>p&&p.eff.some(x=>x.k==='tenace')&&usiRimasti(c,p)>0)||null;
  const r=ST.danno(c,n,tipo,{salva1:!!usa});
  if(r.tenace){c.usi[usa.id]=(c.usi[usa.id]||0)+1;for(const x of usa.eff)if(x.k==='temp')ST.temp(c,x.n+(x.piu&&x.piu.includes('liv')?c.liv:0))}
  return Object.assign(r,{potere:r.tenace?usa.id:null})}
 // ---- stima per anteprima e IA: probabilità e danno atteso di un potere contro un bersaglio ----
 function stima(c,id,b,o){const p=typeof id==='string'?P[id]:id;if(!p)return null;o=o||{};let pc=1,ps=null,pk=0;
  if(p.att){const dif=ST.attacco(c,b,o);pc=DAD.prob((p.att==='magia'?c.magia:c.att)+p.attMod+dif.bonus,ST.caEff(b)+(o.ca||0),dif);
   const q=(21-(c.crit||20))/20;pk=dif.vant?1-(1-q)*(1-q):dif.svant?q*q:q}
  if(p.salv)ps=DAD.prob((b.salv||{})[p.salv]||0,p.cd||c.cd);
  let dc=0,dk=0;for(const e of p.eff)if(e.k==='danno'){const x=quanto(c,e),l=DAD.leggi(x),t=e.tipo||c.dan.tipo;dc+=ST.effettivo(b,DAD.medio(x),t).n;dk+=ST.effettivo(b,l.n*(l.f+1)/2,t).n}
  const peso=p.salv?(1-ps)+(p.meta?ps*.5:0):pc;let cura=0;for(const e of p.eff)if(e.k==='cura')cura+=DAD.medio(espressione(c,e))+((c.hook||{}).cura||0);
  return{pc,ps,pcrit:pk,dannoColpo:dc,atteso:(dc*peso+pk*dk)*p.multi,cura}}
 // ---- scontri e riposi ----
 function iniziaScontro(c){for(const id of Object.keys(c.usi||{}))if(P[id]&&P[id].ric==='scontro')delete c.usi[id];
  c.furtivoUsato=false;const t=(c.hook||{}).temp;if(t)ST.temp(c,t+c.liv);return c}
 function inizioTurno(c,rnd){c.furtivoUsato=false;return ST.inizioTurno(c,rnd)}
 // riposo di un eroe (anche lo stato di campagna: basta `usi` e `conc`). tipo: 'breve' | 'lungo'
 function riposo(x,tipo){const ric=tipo==='lungo'?['scontro','breve','lungo']:['scontro','breve'];
  for(const id of Object.keys(x.usi||{}))if(!P[id]||ric.includes(P[id].ric))delete x.usi[id];
  if(tipo==='lungo')x.conc=x.concMax!=null?x.concMax:ER_().comp(x.liv||1)+ganci(x).conc;return x}
 const NOME_COSTO={azione:'Azione',bonus:'Azione bonus',reazione:'Reazione'};
 const NOME_RIC={scontro:'a scontro',breve:'per riposo breve',lungo:'per riposo lungo'};
 // riga di sintesi di un potere, generata dai dati (i numeri non si scrivono mai a mano nei testi)
 function riga(p){const t=[NOME_COSTO[p.costo]];t.push(p.ric==='turno'?'a volontà':p.usi+' '+NOME_RIC[p.ric]);
  t.push(p.area==='se'?'su di te':p.area==='aura'?'intorno a te ('+p.raggio+')':p.area==='cerchio'?'area '+p.raggio:p.area==='linea'?'linea '+p.raggio:p.gitt==='arma'?"portata dell'arma":p.gitt<=1?'a contatto':'portata '+p.gitt);
  if(p.att)t.push(p.att==='magia'?'tiro per colpire (magia)':'tiro per colpire');if(p.salv)t.push('salvezza '+(ER_().NOME_STAT[p.salv]||p.salv));
  if(p.multi>1)t.push(p.multi+' attacchi');
  for(const e of p.eff){if(e.k==='danno')t.push((e.arma?'arma'+(e.mult>1?' ×'+e.mult:'')+fmt(e.bonus||0):e.expr+(e.scala?'+':'')+(e.piu&&e.piu.includes('mod')?' + mod':''))+(e.tipo?' '+e.tipo:''));
   else if(e.k==='cura')t.push('cura '+e.expr+(e.piu&&e.piu.includes('mod')?' + mod':''));
   else if(e.k==='stato')t.push(ST.STATI[e.id].nome.toLowerCase()+(ST.STATI[e.id].perm?'':' '+e.t+' t'));}
  return t.join(' · ')}
 const registra=pot;
 return{P,TAL,TAL_ID,PASS,RAZZA_POT,LIV_POTERE,LIV_TALENTO,CURABILI,eff:{W,D,C,S,SE,AU,CE,LI},registra,opzioni,offerta,offertaTalenti,tipoLivello,daScegliere,scelteErr,scegli,completa,poteriEroe,talentiEroe,ganci,combattente,
  usiMax,usiRimasti,puoUsare,validaBers,applica,oggetto,applicaOggetto,stimaRiduzione,subisci,stima,quanto,espressione,iniziaScontro,inizioTurno,riposo,riga}})();
if(typeof module!=='undefined')module.exports=APOT;
