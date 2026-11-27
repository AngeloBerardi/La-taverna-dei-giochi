/* ---- Compagnia di ventura, affari: botteghe e carovane tue (passo 43). ----
   Solo nei mondi nuovi (`s.geo===2`): in una città apri una bottega che ogni settimana compra una materia e vende un manufatto; da una città o un porto mandi una carovana tua
   che commercia tra due luoghi con 10 uomini di scorta e un capo (un compagno o un mercenario). La guerra le può rovinare: città nemica = bottega confiscata, predoni = carovana perduta.
   Tutto vive qui e si attacca ai ganci `azione` e `giorno` e a `VEN.decidi` (composto, solo per le parti `mia`). Nei mondi vecchi le azioni rispondono «Qui non si fanno affari».
   Stato facoltativo: `s.botteghe=[{lid,k,da,ultima}]`, `s.carovane=[{pid,capo,da}]` (`da` = id della città di partenza), `s.affari={sett}`; la carovana è una parte `k:'car', faz:'tu', mia:true, casa:-1,
   rotta:[lidA,lidB], porta:{m,q}`. Un compagno capocarovana ha `s.compagni[id]=-3`.
   Nuove: `VEN.affari(s)`, `VEN.tipiBottega(s,l)` (per la tessera «Affari» del passo 45). Ripetibile: niente Math.random né trigonometria. Dopo 28ke, prima di 28l. */
// tutti i numeri qui; compra/vende = {m: merce di VDAT.MERCI, n: quantità a settimana}; costo e affitto in monete
VDAT.AFFARI={BOTTEGHE:3,CAROVANE:2,SCORTA:10,CAPITALE:300,MERCENARIO:100,CARICO:20,SOSTA:300,
 TIPI:{
  tintoria:{nome:'Tintoria',compra:{m:'lana',n:6},vende:{m:'velluto',n:3},costo:1200,affitto:60},
  armeria:{nome:'Armeria',compra:{m:'ferro',n:6},vende:{m:'attrezzi',n:6},costo:800,affitto:50},
  birrificio:{nome:'Birrificio',compra:{m:'grano',n:10},vende:{m:'vino',n:6},costo:350,affitto:30}}};
Object.assign(VEN,(()=>{
 const{D,L,P,TU,aggiungi,capDi,dist,giorno,nemiche,nuovaP,part,togliUomini,uomini,vai}=VEN._,A=VDAT.AFFARI,IDS=Object.keys(A.TIPI);
 const nuovoGeo=s=>s.geo===2;
 const tetto=()=>VDAT.ECO?VDAT.ECO.TETTO:120;
 const NO='Qui non si fanno affari';
 const luogoOk=l=>!!l&&(l.tipo==='citta'||l.tipo==='porto');
 const nemica=(s,l)=>l.faz!=='tu'&&nemiche(s,VEN.lato(s),l.faz);
 const mie=s=>(s.carovane||[]).map(c=>({c,p:part(s,c.pid)}));
 const compagno=id=>D.COMPAGNI.find(x=>x.id===id);
 // ---------- bottega: la resa di una settimana ai prezzi di oggi ----------
 // q = quanta materia c'è rispetto al bisogno (al massimo 1); compra e vende in proporzione. Restituisce i numeri, non cambia niente.
 function conto(s,l,T){const sc=l.scorte||{},q=Math.min(1,(sc[T.compra.m]||0)/T.compra.n),a=Math.round(T.compra.n*q),v=Math.round(T.vende.n*q);
  const spesa=a*VEN.prezzo(s,l,T.compra.m,1),incasso=v*VEN.prezzo(s,l,T.vende.m,-1);return{a,v,spesa,incasso,resa:incasso-spesa-T.affitto}}
 function tipiBottega(s,l){if(!nuovoGeo(s)||!l)return[];const tu=TU(s);
  return IDS.map(k=>{const T=A.TIPI[k];let err='';
   if(l.tipo!=='citta')err=NO;else if(nemica(s,l))err='Non in una città nemica';else if((s.botteghe||[]).length>=A.BOTTEGHE)err='Hai già '+A.BOTTEGHE+' botteghe';
   else if((s.botteghe||[]).some(b=>b.lid===l.id))err='Qui ne hai già una';else if(tu.oro<T.costo)err='Servono '+T.costo+' monete';
   return{k,nome:T.nome,costo:T.costo,stima:l.scorte?conto(s,l,T).resa:0,err}})}
 // ---------- azioni ----------
 function apriBottega(s,z,l){
  if(!nuovoGeo(s)||!l||l.tipo!=='citta')return{err:NO};const T=A.TIPI[z.k];if(!T)return{err:'Bottega sconosciuta'};
  if(nemica(s,l))return{err:'Non in una città nemica'};const b=s.botteghe||(s.botteghe=[]);
  if(b.length>=A.BOTTEGHE)return{err:'Hai già '+A.BOTTEGHE+' botteghe'};if(b.some(x=>x.lid===l.id))return{err:'Qui ne hai già una'};
  const tu=TU(s);if(tu.oro<T.costo)return{err:'Servono '+T.costo+' monete'};
  tu.oro-=T.costo;b.push({lid:l.id,k:z.k,da:giorno(s),ultima:0});L(s,'Apri la '+T.nome.toLowerCase()+' a '+l.nome+'.','bene');return{s,oro:-T.costo}}
 function vendiBottega(s,z,l){
  if(!nuovoGeo(s)||!l)return{err:NO};const b=s.botteghe||[],i=b.findIndex(x=>x.lid===l.id);if(i<0)return{err:'Qui non hai una bottega'};
  const T=A.TIPI[b[i].k],oro=Math.floor(T.costo/2);b.splice(i,1);TU(s).oro+=oro;L(s,'Vendi la '+T.nome.toLowerCase()+' di '+l.nome+' per '+oro+' monete.');return{s,oro}}
 // i 10 uomini di grado più basso (mai compagni) che la compagnia può dare alla scorta
 const scortabili=tu=>tu.tr.filter(e=>!D.TR[e.t].compagno&&e.n>0).sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t);
 function apriCarovana(s,z,l){
  if(!nuovoGeo(s)||!luogoOk(l)||nemica(s,l))return{err:NO};const lista=s.carovane||[];
  if(lista.length>=A.CAROVANE)return{err:'Hai già '+A.CAROVANE+' carovane'};
  const B=Number.isInteger(z.verso)?s.l[z.verso]:null;if(!B||B.id===l.id||!luogoOk(B)||nemica(s,B))return{err:'Meta non valida'};
  const tu=TU(s);let n=0;for(const e of tu.tr)if(!D.TR[e.t].compagno)n+=e.n;if(n<A.SCORTA)return{err:'Servono '+A.SCORTA+' uomini di scorta'};
  const mer=z.capo==='mer',co=mer?null:compagno(z.capo);if(!mer&&(!co||!tu.tr.some(e=>e.t===co.id&&e.n>0)))return{err:'Il compagno non è con te'};
  const oro=A.CAPITALE+(mer?A.MERCENARIO:0);if(tu.oro<oro)return{err:'Servono '+oro+' monete'};
  // la scorta: gli uomini di grado più basso, e il compagno
  const tr=[];let k=A.SCORTA;for(const e of scortabili(tu)){if(k<=0)break;const t=togliUomini(tu.tr,e.t,k);aggiungi(tr,e.t,t);k-=t}
  if(co)togliUomini(tu.tr,co.id,1);tu.oro-=oro;
  const p=nuovaP(s,'car','tu','Carovana di '+l.nome+' e '+B.nome,l.x,l.y,tr,{oro:A.CAPITALE,casa:-1,mia:true,rotta:[l.id,B.id],porta:null,dentro:l.id});p.ia={st:'sosta',t:s.t,fatto:0};
  lista.push({pid:p.id,capo:mer?'mer':co.id,da:l.id});s.carovane=lista;if(co)s.compagni[co.id]=-3;
  L(s,'Parte la carovana tra '+l.nome+' e '+B.nome+'.','bene');return{s,oro:-oro}}
 function richiama(s,z,l){
  if(!nuovoGeo(s)||!l)return{err:NO};const i=(s.carovane||[]).findIndex(c=>c.pid===z.pid),c=s.carovane&&s.carovane[i],p=c&&part(s,c.pid);
  if(!p)return{err:'Carovana sconosciuta'};if(!p.rotta.includes(l.id))return{err:'La carovana si richiama da una delle sue due città'};if(p.sc)return{err:'La carovana è in uno scontro'};
  const tu=TU(s);tu.oro+=p.oro;for(const e of p.tr)aggiungi(tu.tr,e.t,e.n,e.xp);if(p.porta)tu.merci[p.porta.m]=(tu.merci[p.porta.m]||0)+p.porta.q;
  if(c.capo!=='mer'){aggiungi(tu.tr,c.capo,1);s.compagni[c.capo]=-1}
  VEN._.rimuovi(s,p);s.carovane.splice(i,1);L(s,'La carovana di '+l.nome+' è sciolta: monete e uomini tornano a te.');return{s,oro:p.oro}}
 VEN.aggancia('azione',(s,z)=>{
  if(z.a!=='bottega'&&z.a!=='vendibottega'&&z.a!=='carovana'&&z.a!=='richiama')return;
  if(!nuovoGeo(s))return{err:NO};
  if(!capDi(s,z.seat))return{err:'Capitano sconosciuto'};
  if(s.incontro&&s.incontro.tipo==='arena')return{err:'Il duello ti aspetta'};
  const l=s.dentro>=0?s.l[s.dentro]:null;
  return z.a==='bottega'?apriBottega(s,z,l):z.a==='vendibottega'?vendiBottega(s,z,l):z.a==='carovana'?apriCarovana(s,z,l):richiama(s,z,l)});
 // ---------- la carovana tua cammina da sola ----------
 const altra=(p,id)=>p.rotta[0]===id?p.rotta[1]:p.rotta[0];
 // in città: vende ciò che porta, poi compra la merce non da mangiare che nell'altra città rende di più, con il suo oro
 function commercia(s,p,l){const B=s.l[altra(p,l.id)];
  if(p.porta){const m=p.porta.m,q=p.porta.q;p.oro+=q*VEN.prezzo(s,l,m,-1);l.scorte[m]=Math.min(tetto(),(l.scorte[m]||0)+q);p.porta=null}
  if(!B||!B.scorte)return;let bene=null,gm=0,pa=0;
  for(const m of Object.keys(D.MERCI)){if(D.MERCI[m].cibo||!(l.scorte[m]>0))continue;const c=VEN.prezzo(s,l,m,1),g=VEN.prezzo(s,B,m,-1)-c;if(g>gm){gm=g;bene=m;pa=c}}
  if(!bene)return;const q=Math.min(A.CARICO,l.scorte[bene],Math.floor(p.oro/pa));if(q<=0)return;
  p.oro-=q*pa;l.scorte[bene]-=q;p.porta={m:bene,q}}
 const decidi0=VEN.decidi;
 VEN.decidi=(s,p,M)=>{if(!p||!p.mia||p.k!=='car')return decidi0(s,p,M);
  if(p.sc)return;if(p.fermo){if(s.t>=p.fermo)p.fermo=0;else return}const ia=p.ia;
  if(p.dentro>=0){const l=s.l[p.dentro];
   if(!ia.fatto){ia.fatto=1;ia.st='sosta';ia.t=s.t+A.SOSTA;if(l&&l.scorte)commercia(s,p,l);return}
   if(s.t<ia.t)return;
   const a=s.l[altra(p,p.dentro)];if(!luogoOk(a)||nemica(s,a)){ia.t=s.t+600;return}
   p.dentro=-1;ia.st='viaggio';ia.a=a.id;ia.fatto=0;vai(s,p,a.x,a.y,M);return}
  const a=s.l[ia.a];
  if(!a||nemica(s,a)){const b=a?s.l[altra(p,a.id)]:s.l[p.rotta[0]];if(luogoOk(b)&&!nemica(s,b)){ia.a=b.id;vai(s,p,b.x,b.y,M)}return}
  if(dist(p,a)<.7){p.dentro=a.id;p.x=a.x;p.y=a.y;p.via=[];ia.st='sosta';ia.fatto=0;ia.t=s.t;return}
  if(!p.via.length)vai(s,p,a.x,a.y,M)};
 // ---------- il giorno ----------
 function perduta(s,c){const l=s.l[c.da],nome=c.capo==='mer'?'':' ('+compagno(c.capo).nome+')';
  L(s,'La carovana di '+(l?l.nome:'una tua città')+' è perduta'+nome+'.','male');
  if(c.capo!=='mer'){s.compagni[c.capo]=c.da;const g=VEN._.gradDi(s,c.capo);g.g=Math.max(0,g.g-8);s.ev.push({t:'compagno',id:c.capo,perso:1})}}
 VEN.aggancia('giorno',s=>{if(!nuovoGeo(s))return;const g=giorno(s);
  // confisca: una bottega in una città diventata nemica è persa
  if(s.botteghe)s.botteghe=s.botteghe.filter(b=>{const l=s.l[b.lid];if(l&&!nemica(s,l))return true;
   L(s,'La '+A.TIPI[b.k].nome.toLowerCase()+' di '+(l?l.nome:'una città')+' è confiscata.','male');return false});
  // le carovane che non ci sono più
  if(s.carovane)s.carovane=s.carovane.filter(c=>{if(part(s,c.pid))return true;perduta(s,c);return false});
  if(g%P.PAGA_GIORNI!==1||g<=1)return;
  // giorno di paga: resa delle botteghe e utili delle carovane, un solo resoconto
  const tu=TU(s);let sett=0,attivo=false;
  for(const b of s.botteghe||[]){const l=s.l[b.lid],T=A.TIPI[b.k];attivo=true;if(!l||!l.scorte)continue;
   const c=conto(s,l,T),sc=l.scorte;sc[T.compra.m]=Math.max(0,(sc[T.compra.m]||0)-c.a);sc[T.vende.m]=Math.min(tetto(),(sc[T.vende.m]||0)+c.v);
   const prima=tu.oro;tu.oro=Math.max(0,tu.oro+c.resa);b.ultima=tu.oro-prima;sett+=b.ultima}
  for(const{p}of mie(s)){attivo=true;if(p&&p.oro>A.CAPITALE){const u=p.oro-A.CAPITALE;p.oro=A.CAPITALE;tu.oro+=u;sett+=u}}
  if(!attivo)return;
  s.affari={sett};L(s,'Affari della settimana: '+(sett>=0?'+':'-')+Math.abs(sett)+' monete.',sett>=0?'bene':'male');s.ev.push({t:'affari',oro:sett})});
 // ---------- per la vista (passo 45) ----------
 function affari(s){const nome=id=>{const l=s.l[id];return l?l.nome:''};
  return{botteghe:(s.botteghe||[]).map(b=>({lid:b.lid,k:b.k,nome:A.TIPI[b.k].nome,ultima:b.ultima||0})),
   carovane:mie(s).filter(x=>x.p).map(({c,p})=>({pid:p.id,nome:p.nome,da:nome(p.rotta[0]),a:nome(p.rotta[1]),oro:p.oro,capo:c.capo,rotta:p.rotta.slice()})),sett:(s.affari&&s.affari.sett)||0}}
 return{affari,tipiBottega}})());
