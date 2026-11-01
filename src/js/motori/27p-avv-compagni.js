/* ---- Compagni (A7): personaggi della storia che si uniscono alla compagnia, con scheda da eroe, approvazione e missione personale (regole pure). ----
   Nessuno stato proprio: lavorano sullo stato del racconto `s` (`s.compagni[id]` = {stato}, `s.approv[id]` = -100..100), con la definizione
   presa dal capitolo (`cap.compagni[id]`). Dadi: nessuno. La scheda è un eroe vero (`EROI.nuovo`), quindi vale in battaglia e nella campagna.
   Definizione: { nome, razza, classe, base:{for,des,cos,int,sag,car}, aspetto:{…}, liv ('gruppo' o un numero), desc, valori:{tono:-3..3}, approv (iniziale),
   lascia (soglia sotto cui se ne va), fiducia (soglia della missione personale), personale (id missione), scena (chiacchierata), addio (scena di congedo), equip, zaino } */
const ACMP=(()=>{
 const ER=typeof EROI!=='undefined'?EROI:require('./27-eroi.js');
 const POSTI=4,MIN=-100,MAX=100,LASCIA=-60,FIDUCIA=40,PESO_TONO=4;
 // come lo vede la compagnia: soglie dell'approvazione
 const LIVELLI=[{da:-100,id:'ostile',nome:'Ostile'},{da:-49,id:'freddo',nome:'Freddo'},{da:-9,id:'neutro',nome:'Neutrale'},{da:20,id:'amico',nome:'Amico'},{da:60,id:'fedele',nome:'Fedele'}];
 const livello=a=>LIVELLI.filter(l=>a>=l.da).pop();
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const def=(cap,id)=>(cap&&cap.compagni&&cap.compagni[id])||null;
 const approv=(s,cap,id)=>s.approv[id]!=null?s.approv[id]:((def(cap,id)||{}).approv|0);
 const stato=(s,id)=>(s.compagni[id]||{}).stato||'sconosciuto';
 const nelGruppo=s=>Object.keys(s.compagni).filter(id=>s.compagni[id].stato==='gruppo');
 // quanti posti restano: `ctx.posti` se lo conosce la vista, altrimenti 4 meno gli eroi e i compagni già presenti
 const posti=(s,ctx)=>ctx&&ctx.posti!=null?ctx.posti:POSTI-((ctx&&ctx.eroi||[]).filter(h=>!h.compagno).length)-nelGruppo(s).length;
 // la scheda da eroe: livello del gruppo (o fisso), equipaggiamento di classe più quello scritto nel capitolo
 function scheda(d,liv,id){const h=ER.nuovo({nome:d.nome,razza:d.razza,classe:d.classe,base:d.base,aspetto:d.aspetto},0);
  const L=clamp(Math.round(d.liv==null||d.liv==='gruppo'?(liv||1):d.liv),1,ER.LIV_MAX);
  let x=ER.guadagna(h,ER.SOGLIE_XP[L-1]);x.oro=0;x.equip=Object.assign({},x.equip,d.equip||{});x.zaino=(d.zaino||x.zaino).slice();x.cintura=(d.cintura||[]).slice();
  const y=ER.guadagna(x,0);y.hp=y.hpMax;return Object.assign(y,{compagno:id||null,slot:id?'c-'+id:null})}
 // un compagno entra: nel gruppo se c'è posto, altrimenti aspetta in taverna
 function recluta(s,cap,id,ctx){const d=def(cap,id);if(!d)return{err:'compagno sconosciuto: '+id};
  if(stato(s,id)==='gruppo')return{gia:true};if(stato(s,id)==='andato'&&!d.torna)return{err:d.nome+' se n\'è andato per sempre'};
  const ok=posti(s,ctx)>0;s.compagni[id]={stato:ok?'gruppo':'attende'};if(s.approv[id]==null)s.approv[id]=d.approv|0;return{stato:s.compagni[id].stato}}
 function congeda(s,id,motivo){if(!s.compagni[id])return{err:'compagno non incontrato'};s.compagni[id]={stato:'andato',motivo:motivo||'congedato'};return{}}
 // cambia l'approvazione; se un compagno nel gruppo scende sotto la sua soglia se ne va, se sale oltre la fiducia si sblocca la missione personale
 function approva(s,cap,id,n){const d=def(cap,id);if(!d)return{err:'compagno sconosciuto: '+id};const prima=approv(s,cap,id),dopo=clamp(prima+(n|0),MIN,MAX);s.approv[id]=dopo;
  const r={id,da:prima,a:dopo,lascia:false,fiducia:false};
  if(stato(s,id)==='gruppo'&&dopo<=(d.lascia==null?LASCIA:d.lascia)){congeda(s,id,'lascia');r.lascia=true}
  if(prima<(d.fiducia==null?FIDUCIA:d.fiducia)&&dopo>=(d.fiducia==null?FIDUCIA:d.fiducia)){r.fiducia=true}
  return r}
 // reazione di chi è nel gruppo a una scelta con certi toni (pietà, onore, avidità…): ogni valore pesa PESO_TONO punti
 const delta=(d,toni)=>(toni||[]).reduce((a,t)=>a+((d.valori||{})[t]|0)*PESO_TONO,0);
 function reagisci(s,cap,toni){const out=[];for(const id of nelGruppo(s)){const d=def(cap,id),n=d?delta(d,toni):0;if(!n)continue;const r=approva(s,cap,id,n);out.push(Object.assign({nome:d.nome,n},r))}return out}
 // la missione personale: bloccata finché non ci si fida, poi disponibile; attiva e fatta le tiene il racconto in `s.missioni`
 function personale(s,cap,id){const d=def(cap,id);if(!d||!d.personale)return'nessuna';const m=s.missioni[d.personale];
  if(m&&(m.stato==='attiva'||m.stato==='fatta'||m.stato==='fallita'))return m.stato;return approv(s,cap,id)>=(d.fiducia==null?FIDUCIA:d.fiducia)&&stato(s,id)==='gruppo'?'disponibile':'bloccata'}
 // quale scena si apre parlando con lui: la sua missione personale se è disponibile, altrimenti la chiacchierata
 const parla=(s,cap,id)=>{const d=def(cap,id);if(!d||stato(s,id)!=='gruppo')return null;return personale(s,cap,id)==='disponibile'&&d.sceneP?d.sceneP:(d.scena||null)};
 // controllo del capitolo: schede valide, soglie sensate, riferimenti a scene e missioni esistenti
 function valida(cap){const e=[];for(const[id,d]of Object.entries(cap.compagni||{})){const p='compagno '+id+': ';
  if(!/^[a-z0-9-]+$/.test(id))e.push(p+'id non valido');
  const m=ER.valida({nome:d.nome,razza:d.razza,classe:d.classe,base:d.base,aspetto:d.aspetto});if(m)e.push(p+m);
  if(d.liv!=null&&d.liv!=='gruppo'&&!(d.liv>=1&&d.liv<=ER.LIV_MAX))e.push(p+'livello non valido');
  if(d.lascia!=null&&!(d.lascia>MIN&&d.lascia<0))e.push(p+'la soglia di abbandono va da -99 a -1');
  if(d.fiducia!=null&&!(d.fiducia>0&&d.fiducia<=MAX))e.push(p+'la soglia di fiducia va da 1 a 100');
  for(const t of Object.keys(d.valori||{}))if(!Number.isInteger(d.valori[t])||Math.abs(d.valori[t])>3)e.push(p+'il valore di «'+t+'» va da -3 a 3');
  for(const k of ['scena','addio','sceneP'])if(d[k]&&!(cap.scene||{})[d[k]])e.push(p+k+': la scena «'+d[k]+'» non esiste');
  if(d.personale&&!(cap.missioni||{})[d.personale])e.push(p+'la missione personale «'+d.personale+'» non esiste');
  for(const q of Object.values(d.equip||{}))if(q&&typeof AOGG!=='undefined'&&!AOGG.OGG[q])e.push(p+'oggetto sconosciuto: '+q)}
  return e}
 return{POSTI,MIN,MAX,LASCIA,FIDUCIA,PESO_TONO,LIVELLI,livello,def,approv,stato,nelGruppo,posti,scheda,recluta,congeda,approva,delta,reagisci,personale,parla,valida}})();
if(typeof module!=='undefined')module.exports=ACMP;
