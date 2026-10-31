/* ---- Racconto (A7): capitoli a scene e nodi di dialogo, condizioni, effetti, prove di abilità, riassunto e validatore (regole pure). ----
   Un capitolo (`src/avventura/<id>.json`) ha: id, titolo, personaggi{id:{nome,razza,classe,aspetto}}, compagni{} (vedi ACMP), missioni{id:{titolo,descr,ricompensa:[effetti],scena}},
   luoghi{id:{nome}}, bandiere[] (iniziali), ingressi[] (scene che l'orchestratore può avviare), sommario[{se,testo}], prossimo[{se,testo}], scene{id:{dove,se,una,inizio,nodi{}}}.
   Nodo: { chi, testo, effetti[], e UNA uscita: scelte[] | vai | scena | fine }. Scelta: { t, se, mostra, una, tono[], etichetta, effetti[], e UNA uscita: vai | scena | fine | prova{ab,cd,chi,vant,ok{},ko{}} }.
   Condizioni (`se`): {bandiera:id} {valore:id,min|max} {non:c} {e:[c]} {o:[c]} {classe} {razza} {oggetto} {livello:n} {compagno:id} {approv:id,min,max} {missione:id,stato}
   {oro:n} {perdizione,min|max} {giorno:n} {luogo:id}; una lista = tutte. Effetti: { t, id, n, … }: propri (bandiera conta togli approv recluta congeda missione diario) e per l'orchestratore
   (oro oggetto pf perdizione xp razioni battaglia sposta apri), che finiscono in `fuori`. Lo stato `s` è JSON; `act` lavora su una copia e il dado è `s.rng` (`ADADI`), mai Math.random. */
const ARAC=(()=>{
 const ER=typeof EROI!=='undefined'?EROI:require('./27-eroi.js'),DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js'),CM=typeof ACMP!=='undefined'?ACMP:require('./27p-avv-compagni.js');
 const AO=()=>typeof AOGG!=='undefined'?AOGG:require('./27b-avv-oggetti.js'),BE=()=>typeof BEST!=='undefined'?BEST:require('./27f-avv-bestiario.js'),AR=()=>typeof AARE!=='undefined'?AARE:require('./27h-avv-arene.js');
 const NARRATORE='_',MAX_TESTO=700,PROPRI=['bandiera','conta','togli','approv','recluta','congeda','missione','diario'],FUORI=['oro','oggetto','pf','perdizione','xp','razioni','battaglia','sposta','apri'];
 const DIFF=['facile','medio','difficile','capo'],SERVIZI=['bottega','locanda','guaritore','tempio'],STATI_MISSIONE=['attiva','fatta','fallita'],CD_MIN=5,CD_MAX=25;
 const PRIM=['bandiera','valore','non','e','o','classe','razza','oggetto','livello','compagno','approv','missione','oro','perdizione','giorno','luogo'];
 const CANTARI=['Primo','Secondo','Terzo','Quarto','Quinto','Sesto','Settimo','Ottavo'];
 const nuovo=(cap,seme)=>({v:1,cap:cap,rng:DAD.semina(seme|0),bandiere:{},approv:{},compagni:{},missioni:{},scena:null,coda:[],ultima:null,reazioni:[],diario:[],fatte:{},sessioni:0,evn:0});
 const copia=x=>JSON.parse(JSON.stringify(x));
 const eroi=ctx=>(ctx&&ctx.eroi)||[],vivi=ctx=>eroi(ctx).filter(h=>h.hp==null||h.hp>0);
 const haOggetto=(h,id)=>(h.zaino||[]).includes(id)||(h.cintura||[]).includes(id)||Object.values(h.equip||{}).includes(id);
 const liv=ctx=>{const L=eroi(ctx);return L.length?Math.floor(L.reduce((a,h)=>a+(h.liv||1),0)/L.length):1};
 const inFasce=(x,c)=>(c.min==null||x>=c.min)&&(c.max==null||x<=c.max);
 // ---- condizioni ----
 function cond(c,s,ctx){
  if(c==null||c===true)return true;if(c===false)return false;if(typeof c==='string')return!!s.bandiere[c];if(Array.isArray(c))return c.every(x=>cond(x,s,ctx));
  const k=Object.keys(c).find(x=>PRIM.includes(x)),v=c[k];
  switch(k){
   case'bandiera':return!!s.bandiere[v];
   case'valore':return inFasce(+s.bandiere[v]||0,c);
   case'non':return!cond(v,s,ctx);case'e':return v.every(x=>cond(x,s,ctx));case'o':return v.some(x=>cond(x,s,ctx));
   case'classe':return eroi(ctx).some(h=>h.classe===v);case'razza':return eroi(ctx).some(h=>h.razza===v);
   case'oggetto':return eroi(ctx).some(h=>haOggetto(h,v))||((ctx&&ctx.comune)||[]).includes(v);
   case'livello':return liv(ctx)>=v;
   case'compagno':return CM.stato(s,v)==='gruppo';
   case'approv':return inFasce(s.approv[v]|0,c);
   case'missione':return((s.missioni[v]||{}).stato||'nessuna')===(c.stato||'attiva');
   case'oro':return((ctx&&ctx.oro)|0)>=v;
   case'perdizione':return inFasce((ctx&&ctx.perdizione)|0,Object.assign({min:v},c.max!=null?{max:c.max}:{}));
   case'giorno':return((ctx&&ctx.giorno)|0)>=v;
   case'luogo':return!!ctx&&ctx.luogo===v;
   default:throw new Error('condizione sconosciuta: '+JSON.stringify(c))}}
 // ---- prove ----
 const nomeAb=ab=>ER.NOME_AB[ab]||ab;
 const probDi=(h,p)=>DAD.prob(ER.bonus(h,p.ab),p.cd,{vant:!!p.vant});
 // chi tira: il compagno o l'eroe indicato in `chi`, altrimenti il migliore in piedi (a parità il primo)
 function chiTira(ctx,p){const V=vivi(ctx);if(!V.length)return null;
  if(p.chi){const h=V.find(x=>x.slot===p.chi||x.compagno===p.chi);if(h)return{h,p:probDi(h,p)}}
  let best=null;for(const h of V){const q=probDi(h,p);if(!best||q>best.p)best={h,p:q}}return best}
 // ---- etichette delle scelte: [Persuasione 65%] [Solo Mago] [Con la chiave] [20 monete] ----
 function requisito(c){if(c==null||typeof c==='string'||c===true)return'';if(Array.isArray(c)){for(const x of c){const r=requisito(x);if(r)return r}return''}
  const k=Object.keys(c).find(x=>PRIM.includes(x)),v=c[k];
  if(k==='e'||k==='o'){for(const x of v){const r=requisito(x);if(r)return r}return''}
  if(k==='classe')return'Solo '+((ER.CLASSI[v]||{}).nome||v);if(k==='razza')return'Solo '+(((ER.RAZZE[v]||{}).nome||v).split(' ')[0]);
  if(k==='oggetto')return'Con '+(((AO().OGG||{})[v]||{}).nome||v);if(k==='livello')return'Livello '+v;if(k==='oro')return v+' monete';return''}
 function etichetta(sc,s,ctx){if(sc.etichetta!=null)return sc.etichetta;
  if(sc.prova){const b=chiTira(ctx,sc.prova);return nomeAb(sc.prova.ab)+(b?' '+Math.round(b.p*100)+'%':'')}
  const r=requisito(sc.se);if(r)return r;const o=(sc.effetti||[]).find(e=>e.t==='oro'&&e.n<0);return o?(-o.n)+' monete':''}
 // ---- effetti ----
 function nota(s,cap,r,fuori){if(!r||r.err)return;
  if(r.fiducia)s.bandiere[r.id+'-fiducia']=true;
  if(r.lascia){s.bandiere[r.id+'-lascia']=true;fuori.push({t:'compagno',id:r.id,azione:'esce',motivo:'lascia'});const d=CM.def(cap,r.id);if(d&&d.addio)s.coda.push(d.addio)}}
 // la reazione dei compagni a una scelta: chi scende troppo se ne va, chi sale si fida
 const reagisci=(s,cap,toni,fuori)=>{const L=CM.reagisci(s,cap,toni);for(const r of L)nota(s,cap,r,fuori);return L};
 function applica(s,cap,e,ctx,fuori){
  switch(e.t){
   case'bandiera':s.bandiere[e.id]=e.v==null?true:e.v;return{};
   case'conta':s.bandiere[e.id]=(+s.bandiere[e.id]||0)+(e.n==null?1:e.n);return{};
   case'togli':delete s.bandiere[e.id];return{};
   case'approv':{const r=CM.approva(s,cap,e.id,e.n);if(r.err)return r;nota(s,cap,r,fuori);return{}}
   case'recluta':{const r=CM.recluta(s,cap,e.id,ctx);if(r.err)return r;if(!r.gia)fuori.push({t:'compagno',id:e.id,azione:r.stato==='gruppo'?'entra':'attende'});return{}}
   case'congeda':{const r=CM.congeda(s,e.id,'congedato');if(r.err)return r;fuori.push({t:'compagno',id:e.id,azione:'esce',motivo:'congedato'});return{}}
   case'missione':{const prima=(s.missioni[e.id]||{}).stato,m=s.missioni[e.id]=Object.assign({stato:'attiva',passo:0},s.missioni[e.id]);m.stato=e.stato||'attiva';if(e.passo!=null)m.passo=e.passo;
    if(m.stato==='fatta'&&prima!=='fatta'){const d=(cap.missioni||{})[e.id];for(const x of(d&&d.ricompensa)||[]){const r=applica(s,cap,x,ctx,fuori);if(r.err)return r}}return{}}
   case'diario':s.diario.push(e.testo);return{};
   default:if(!FUORI.includes(e.t))return{err:'effetto sconosciuto: '+e.t};fuori.push(Object.assign({},e));return{}}}
 const tutti=(s,cap,L,ctx,fuori)=>{for(const e of L||[]){const r=applica(s,cap,e,ctx,fuori);if(r.err)return r}return{}};
 // ---- scene e nodi ----
 const scena=(cap,id)=>(cap.scene||{})[id]||null;
 const nodoDi=(cap,s)=>s.scena?scena(cap,s.scena.id).nodi[s.scena.nodo]:null;
 function entraNodo(s,cap,id,ctx,fuori){const sc=scena(cap,s.scena.id),n=sc.nodi[id];if(!n)return{err:'Nodo mancante: '+id};s.scena.nodo=id;return tutti(s,cap,n.effetti,ctx,fuori)}
 function avviaScena(s,cap,id,ctx,fuori){const sc=scena(cap,id);if(!sc)return{err:'Scena sconosciuta: '+id};s.scena={id,nodo:sc.inizio,nota:null,usate:[]};return entraNodo(s,cap,sc.inizio,ctx,fuori)}
 // fine della scena: se ce n'è una in coda (un congedo, per esempio) parte subito
 function chiudi(s,cap,esito,ctx,fuori){const id=s.scena.id;s.fatte[id]=(s.fatte[id]|0)+1;s.scena=null;const r={esito:esito===true?'fine':esito};
  while(s.coda.length&&!s.scena){const p=s.coda.shift();if(scena(cap,p)){const e=avviaScena(s,cap,p,ctx,fuori);if(e.err)return e}}return r}
 // dove si va dopo un nodo, una scelta o un esito di prova
 function uscita(s,cap,x,ctx,fuori){
  if(x.vai){const r=entraNodo(s,cap,x.vai,ctx,fuori);return r.err?r:{}}
  if(x.scena){const vecchia=s.scena.id;s.fatte[vecchia]=(s.fatte[vecchia]|0)+1;const r=avviaScena(s,cap,x.scena,ctx,fuori);return r.err?r:{}}
  if(x.fine!=null&&x.fine!==false)return chiudi(s,cap,x.fine,ctx,fuori);
  return{err:'Nessuna uscita'}}
 const usata=(s,i)=>!!s.scena&&s.scena.usate.includes(s.scena.nodo+'#'+i);
 // ---- azioni: avvia {id} · scegli {i} · continua ----
 function act(st,a,cap,ctx){const s=copia(st),fuori=[];s.evn++;s.reazioni=[];ctx=ctx||{};let out={};
  if(a.t==='avvia'){if(s.scena)return{err:'C\'è già una scena in corso'};const r=avviaScena(s,cap,a.id,ctx,fuori);if(r.err)return r;return{s,fuori}}
  if(!s.scena)return{err:'Nessuna scena in corso'};const n=nodoDi(cap,s);s.scena.nota=null;
  if(a.t==='continua'){if(n.scelte&&n.scelte.length)return{err:'Scegli una risposta'};const r=uscita(s,cap,n,ctx,fuori);if(r.err)return r;out=r}
  else if(a.t==='scegli'){const c=(n.scelte||[])[a.i];if(!c)return{err:'Scelta non valida'};
   if(!cond(c.se,s,ctx)||(c.una&&usata(s,a.i)))return{err:'Questa scelta non è disponibile'};
   if(c.una)s.scena.usate.push(s.scena.nodo+'#'+a.i);
   let r=tutti(s,cap,c.effetti,ctx,fuori);if(r.err)return r;
   s.reazioni=reagisci(s,cap,c.tono,fuori);
   if(c.prova){const p=c.prova,ch=chiTira(ctx,p);if(!ch)return{err:'Nessuno può provarci'};const t=ER.prova(ch.h,p.ab,p.cd,DAD.gen(s),!!p.vant);
    s.ultima={eroe:ch.h.nome,ab:p.ab,cd:p.cd,tiro:t.tiro,mod:t.mod+t.comp,tot:t.tot,ok:t.ok,critico:t.critico,fallimento:t.fallimento,p:ch.p};
    const b=t.ok?p.ok:p.ko;r=tutti(s,cap,b.effetti,ctx,fuori);if(r.err)return r;
    s.reazioni=s.reazioni.concat(reagisci(s,cap,b.tono,fuori));
    r=uscita(s,cap,b,ctx,fuori);if(r.err)return r;out=r;if(s.scena)s.scena.nota={prova:s.ultima,testo:b.testo||''}}
   else{r=uscita(s,cap,c,ctx,fuori);if(r.err)return r;out=r}}
  else return{err:'Azione sconosciuta: '+a.t};
  return Object.assign({s,fuori},out.esito!=null?{esito:out.esito}:{})}
 // ---- ciò che la vista deve mostrare ----
 const sost=(t,ctx)=>String(t).replace(/\{eroe\}/g,(vivi(ctx)[0]||{nome:'viandante'}).nome).replace(/\{eroi\}/g,vivi(ctx).map(h=>h.nome).join(', '));
 function personaggio(cap,id){if(id===NARRATORE||id==null)return{id:NARRATORE,nome:''};const p=(cap.personaggi||{})[id]||(cap.compagni||{})[id];return p?Object.assign({id},p):{id,nome:id}}
 function vista(s,cap,ctx){if(!s.scena)return null;const n=nodoDi(cap,s);if(!n)return null;ctx=ctx||{};
  const scelte=(n.scelte||[]).map((c,i)=>{const ok=cond(c.se,s,ctx)&&!(c.una&&usata(s,i))&&(!c.prova||vivi(ctx).length>0);
   return{i,t:sost(c.t,ctx),etichetta:etichetta(c,s,ctx),ok,perche:ok?'':(requisito(c.se)||'Non disponibile'),mostra:ok||!!c.mostra,prova:!!c.prova,
    chi:c.prova?(chiTira(ctx,c.prova)||{h:{}}).h.nome||'':''}}).filter(x=>x.mostra);
  return{scena:s.scena.id,nodo:s.scena.nodo,chi:personaggio(cap,n.chi),testo:sost(n.testo,ctx),nota:s.scena.nota,scelte,
   continua:n.scelte&&n.scelte.length?null:(n.fine!=null&&n.fine!==false?'Chiudi':'Continua'),reazioni:s.reazioni}}
 // scene che si possono avviare in un luogo: la scena ha `dove` (id o lista) e la sua condizione vale; con `una` solo se non è già stata vista
 function disponibili(cap,s,ctx,dove){return Object.keys(cap.scene||{}).filter(id=>{const sc=cap.scene[id];if(!sc.dove)return false;
  const D=[].concat(sc.dove);if(dove!=null&&!D.includes(dove))return false;return cond(sc.se,s,ctx)&&!(sc.una&&(s.fatte[id]|0)>0)})}
 // ---- il cantare: riassunto per il Locandiere, letto dalle bandiere ----
 function cantare(cap,s,ctx){const n=Math.min(s.sessioni|0,CANTARI.length-1),ok=L=>(L||[]).filter(x=>cond(x.se,s,ctx)).map(x=>sost(x.testo,ctx));
  return{titolo:CANTARI[n]+' cantare',capitolo:cap.titolo||'',sessioni:s.sessioni|0,apertura:ok(cap.sommario),chiusura:ok(cap.prossimo)[0]||''}}
 const finisciSessione=s=>Object.assign({},s,{sessioni:(s.sessioni|0)+1});
 // ---- validatore ----
 const archi=n=>{const o=[],ex=x=>{if(!x)return;if(x.vai)o.push({nodo:x.vai});if(x.scena)o.push({scena:x.scena});if(x.fine!=null&&x.fine!==false)o.push({fine:1})};
  ex(n);for(const c of n.scelte||[]){ex(c);if(c.prova){ex(c.prova.ok);ex(c.prova.ko)}}return o};
 const uscite=x=>['vai','scena','fine'].filter(k=>x[k]!=null&&x[k]!==false).length;
 function valida(cap){
  const e=[],P=(cap&&cap.personaggi)||{},C=(cap&&cap.compagni)||{},M=(cap&&cap.missioni)||{},L=(cap&&cap.luoghi)||{},S=(cap&&cap.scene)||{};
  if(!cap||typeof cap!=='object')return['capitolo mancante'];
  if(!/^[a-z0-9-]+$/.test(cap.id||''))e.push('id del capitolo non valido');if(!cap.titolo)e.push('manca il titolo');if(!Object.keys(S).length)e.push('nessuna scena');
  const impostate=new Set(cap.bandiere||[]),lette=new Set();
  for(const id of Object.keys(C)){impostate.add(id+'-fiducia');impostate.add(id+'-lascia')}
  const valCond=(c,p)=>{if(c==null||typeof c==='boolean')return;if(typeof c==='string'){lette.add(c);return}if(Array.isArray(c)){c.forEach(x=>valCond(x,p));return}
   const k=Object.keys(c).find(x=>PRIM.includes(x));if(!k){e.push(p+': condizione sconosciuta '+JSON.stringify(c));return}const v=c[k];
   if(k==='bandiera')lette.add(v);else if(k==='valore')lette.add(v);else if(k==='non')valCond(v,p);else if(k==='e'||k==='o'){if(!Array.isArray(v)||!v.length)e.push(p+': «'+k+'» vuoto');else v.forEach(x=>valCond(x,p))}
   else if(k==='classe'){if(!ER.CLASSI[v])e.push(p+': classe sconosciuta '+v)}else if(k==='razza'){if(!ER.RAZZE[v])e.push(p+': razza sconosciuta '+v)}
   else if(k==='oggetto'){if(!AO().OGG[v])e.push(p+': oggetto sconosciuto '+v)}else if(k==='compagno'||k==='approv'){if(!C[v])e.push(p+': compagno sconosciuto '+v)}
   else if(k==='missione'){if(!M[v])e.push(p+': missione sconosciuta '+v);if(c.stato&&![...STATI_MISSIONE,'nessuna'].includes(c.stato))e.push(p+': stato di missione sconosciuto '+c.stato)}
   else if(k==='luogo'){if(!L[v])e.push(p+': luogo sconosciuto '+v)}else if(!Number.isFinite(v))e.push(p+': «'+k+'» vuole un numero')};
  const valEff=(x,p)=>{if(!x||typeof x!=='object'){e.push(p+': effetto non valido');return}
   if(![...PROPRI,...FUORI].includes(x.t)){e.push(p+': effetto sconosciuto «'+x.t+'»');return}
   const num=k=>{if(!Number.isInteger(x[k]))e.push(p+': «'+x.t+'» vuole '+k+' intero')},id=ok=>{if(!ok)e.push(p+': «'+x.t+'» riferisce «'+x.id+'», che non esiste')};
   switch(x.t){
    case'bandiera':case'conta':case'togli':if(typeof x.id!=='string'||!x.id)e.push(p+': bandiera senza id');else if(x.t!=='togli')impostate.add(x.id);if(x.t==='conta'&&x.n!=null)num('n');break;
    case'approv':id(C[x.id]);num('n');break;case'recluta':case'congeda':id(C[x.id]);break;
    case'missione':id(M[x.id]);if(x.stato&&!STATI_MISSIONE.includes(x.stato))e.push(p+': stato di missione sconosciuto '+x.stato);break;
    case'diario':if(!x.testo)e.push(p+': diario senza testo');break;
    case'oro':case'perdizione':case'razioni':num('n');break;case'xp':num('n');if(x.n<=0)e.push(p+': l\'esperienza è positiva');break;
    case'oggetto':id(AO().OGG[x.id]);if(x.n!=null&&!Number.isInteger(x.n))e.push(p+': «oggetto» vuole n intero');break;
    case'pf':if(!(typeof x.pct==='number'&&Math.abs(x.pct)<=1))e.push(p+': «pf» vuole pct da -1 a 1');break;
    case'battaglia':if(!x.fam&&!x.capo)e.push(p+': «battaglia» vuole fam o capo');if(x.fam&&!BE().FAMIGLIE[x.fam])e.push(p+': famiglia sconosciuta '+x.fam);
     if(x.capo&&!(BE().M[x.capo]&&BE().M[x.capo].capo))e.push(p+': capo sconosciuto '+x.capo);if(x.diff&&!DIFF.includes(x.diff))e.push(p+': difficoltà sconosciuta '+x.diff);
     if(x.arena&&!AR().AMBIENTI.includes(x.arena))e.push(p+': ambiente sconosciuto '+x.arena);break;
    case'sposta':id(L[x.id]);break;case'apri':if(!SERVIZI.includes(x.id))e.push(p+': servizio sconosciuto '+x.id);break}};
  const valEffs=(L2,p)=>{if(L2==null)return;if(!Array.isArray(L2)){e.push(p+': gli effetti sono una lista');return}L2.forEach((x,i)=>valEff(x,p+' effetto '+(i+1)))};
  for(const[id,m]of Object.entries(M)){if(!m.titolo)e.push('missione '+id+': manca il titolo');valEffs(m.ricompensa,'missione '+id);if(m.scena&&!S[m.scena])e.push('missione '+id+': la scena «'+m.scena+'» non esiste')}
  for(const m of CM.valida(cap))e.push(m);
  const entrate=new Set([].concat(cap.ingressi||[]));
  for(const id of entrate)if(!S[id])e.push('ingresso sconosciuto: '+id);
  for(const[id,d]of Object.entries(C))for(const k of['scena','addio','sceneP'])if(d[k])entrate.add(d[k]);
  for(const m of Object.values(M))if(m.scena)entrate.add(m.scena);
  const edgeScena={};
  for(const[sid,sc]of Object.entries(S)){const pre='scena '+sid;
   if(!/^[a-z0-9-]+$/.test(sid))e.push(pre+': id non valido');
   if(sc.dove)entrate.add(sid);valCond(sc.se,pre);
   const N=sc.nodi||{};if(!N[sc.inizio]){e.push(pre+': il nodo iniziale «'+sc.inizio+'» non esiste');continue}
   const arrivo=new Set([sc.inizio]),coda=[sc.inizio],verso=new Set();edgeScena[sid]=verso;
   const rev={},fini=[];
   for(const[nid,n]of Object.entries(N)){const p=pre+', nodo '+nid;
    if(n.chi!=null&&n.chi!==NARRATORE&&!P[n.chi]&&!C[n.chi])e.push(p+': personaggio sconosciuto «'+n.chi+'»');
    if(typeof n.testo!=='string'||!n.testo.trim())e.push(p+': manca il testo');else if(n.testo.length>MAX_TESTO)e.push(p+': testo troppo lungo ('+n.testo.length+' lettere, al massimo '+MAX_TESTO+')');
    valEffs(n.effetti,p);
    const hasScelte=Array.isArray(n.scelte)&&n.scelte.length>0;
    if(hasScelte+(uscite(n)>0)!==1)e.push(p+': serve esattamente una uscita (scelte, vai, scena o fine)');
    if(uscite(n)>1)e.push(p+': più di una uscita');
    if(hasScelte){if(!n.scelte.some(c=>c.se==null&&!c.una))e.push(p+': nessuna scelta sempre disponibile (si resterebbe bloccati)');
     n.scelte.forEach((c,i)=>{const q=p+', scelta '+(i+1);
      if(typeof c.t!=='string'||!c.t.trim())e.push(q+': manca il testo');
      valCond(c.se,q);valEffs(c.effetti,q);
      for(const t of c.tono||[])if(typeof t!=='string')e.push(q+': tono non valido');
      if(c.prova){const pr=c.prova;
       if(uscite(c)>0)e.push(q+': una prova non ha uscita propria');
       if(!ER.ABILITA[pr.ab])e.push(q+': abilità sconosciuta «'+pr.ab+'»');
       if(!(Number.isInteger(pr.cd)&&pr.cd>=CD_MIN&&pr.cd<=CD_MAX))e.push(q+': la difficoltà va da '+CD_MIN+' a '+CD_MAX);
       if(pr.chi&&!C[pr.chi]&&!/^e[1-5]$/.test(pr.chi))e.push(q+': «chi» riferisce «'+pr.chi+'»');
       for(const k of['ok','ko']){const b=pr[k];if(!b){e.push(q+': manca «'+k+'»');continue}if(uscite(b)!==1)e.push(q+' '+k+': serve esattamente una uscita');valEffs(b.effetti,q+' '+k)}}
      else if(uscite(c)!==1)e.push(q+': serve esattamente una uscita')})}
    const A=archi(n);if(A.some(x=>x.fine)||!A.length)fini.push(nid);
    for(const x of A){if(x.nodo){if(!N[x.nodo])e.push(p+': porta a «'+x.nodo+'», che non esiste');else{(rev[x.nodo]=rev[x.nodo]||[]).push(nid);if(!arrivo.has(x.nodo)){arrivo.add(x.nodo);coda.push(x.nodo)}}}
     if(x.scena){verso.add(x.scena);if(!S[x.scena])e.push(p+': porta alla scena «'+x.scena+'», che non esiste')}}
    }
   // raggiungibilità dall'inizio (seguendo tutti gli archi, senza guardare le condizioni)
   for(let i=0;i<coda.length;i++){for(const x of archi(N[coda[i]]||{}))if(x.nodo&&N[x.nodo]&&!arrivo.has(x.nodo)){arrivo.add(x.nodo);coda.push(x.nodo)}}
   for(const nid of Object.keys(N))if(!arrivo.has(nid))e.push(pre+', nodo '+nid+': non si raggiunge mai');
   // vicoli ciechi: ogni nodo raggiungibile deve poter arrivare a una fine (o a un'altra scena)
   const uscenti=new Set();for(const[nid,n]of Object.entries(N))if(archi(n).some(x=>x.fine||x.scena))uscenti.add(nid);
   const buoni=new Set(uscenti),pila=[...uscenti];while(pila.length){const x=pila.pop();for(const y of rev[x]||[])if(!buoni.has(y)){buoni.add(y);pila.push(y)}}
   for(const nid of arrivo)if(!buoni.has(nid))e.push(pre+', nodo '+nid+': vicolo cieco, non porta mai alla fine');}
  // scene raggiungibili da un ingresso, da un luogo o da un'altra scena
  const vive=new Set(),pila=[...entrate].filter(x=>S[x]);pila.forEach(x=>vive.add(x));
  while(pila.length){const x=pila.pop();for(const y of edgeScena[x]||[])if(S[y]&&!vive.has(y)){vive.add(y);pila.push(y)}}
  for(const sid of Object.keys(S))if(!vive.has(sid))e.push('scena '+sid+': non è raggiungibile (manca in «ingressi», in «dove» o in una uscita)');
  for(const k of['sommario','prossimo'])for(const[i,x]of(cap[k]||[]).entries()){valCond(x.se,k+' '+(i+1));if(typeof x.testo!=='string'||!x.testo)e.push(k+' '+(i+1)+': manca il testo')}
  for(const b of lette)if(!impostate.has(b))e.push('la bandiera «'+b+'» viene letta ma non è mai impostata (errore di battitura?)');
  return e}
 return{NARRATORE,MAX_TESTO,PROPRI,FUORI,DIFF,SERVIZI,CANTARI,nuovo,cond,chiTira,probDi,etichetta,requisito,applica,act,vista,disponibili,cantare,finisciSessione,valida,personaggio,scena}})();
if(typeof module!=='undefined')module.exports=ARAC;
