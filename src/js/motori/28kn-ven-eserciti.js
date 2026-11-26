/* ---- Compagnia di ventura, eserciti dei regni e adunate (passo 40). ----
   In guerra i signori di un regno si radunano dietro un maresciallo, marciano insieme su un obiettivo (soccorso, assedio, razzia) e si sciolgono.
   Si attacca ai ganci `giorno`, `ora`, `scontro`, `incontro`, `scheda`, `fatto`, `effetto` e compone `VEN.decidi` e `VEN.molt`; agisce solo con `VDAT.ACCESO.eserciti` (rilascio 5).
   Stato facoltativo (assente = nessun esercito): `s.eserciti=[{id,faz,capo,membri:[pid],obiettivo:{tipo,lid},stato,da,f0}]`, `stato` ∈ 'aduna'|'marcia'|'assedia'|'sciolto';
   sulla parte `p.es=id` (`e.sg` = indice del maresciallo, `s.presi` = giorno dell'ultimo passaggio di mano dei luoghi); da vassallo `s.convoca={eid,fino,presente}` e `s.disobb`. L'esercito del sovrano ha `faz:'tu'`, `capo:0` (sei tu) e nessun obiettivo.
   Il maresciallo porta `sg.mar` finché l'esercito vive (rango 3, passo 12). Motore puro e ripetibile: solo `rnd(s)`, niente Math.random né funzioni trascendenti.
   Dopo 28ke, prima di 28l. */
Object.assign(VDAT,{ESERCITI:{NASCE:.35,MIN:3,MAX:6,RAGGIO:12,ADUNA:2,DURATA:15,META:.5,LONTANO:40,STRETTI:1.4,AIUTO:3,PRESENTE:2,ENTRO:4,FIDUCIA:5,PAGA:3,IGNORA:-10,FEUDO:3,PAUSA:10}});
Object.assign(VEN,(()=>{const{L,MURA,P,TU,dist,forza,forzaTr,giorno,nemiche,fazioni,viva,relaz,rnd,part,uomini}=VEN._,X=VDAT.ESERCITI;
 const attivo=()=>!!VDAT.ACCESO.eserciti;
 const OBIETTIVI=['assedio','razzia','soccorso'];
 const liste=s=>s.eserciti||[];
 const trova=(s,id)=>liste(s).find(e=>e.id===id)||null;
 const inVita=e=>!!e&&e.stato!=='sciolto';
 const sigDi=(s,p)=>p&&p.k==='sig'?s.sig[p.sig]:null;
 const forzaE=(s,e)=>e.membri.reduce((a,id)=>{const p=part(s,id);return a+(p?forza(p):0)},0);
 const inGuerraCon=(s,f)=>fazioni(s).some(x=>x!==f&&viva(s,x)&&VEN.inGuerra(s,f,x));
 const vedi=(s,cp)=>cp&&(dist(TU(s),cp)<=VEN.vista(s)||(s.servizio&&s.servizio.faz===cp.faz));
 // signori di un regno che possono unirsi a un esercito: liberi, non prigionieri, non in mischia, non chiusi in una fortezza assediata
 const liberi=(s,f)=>s.p.filter(p=>{const sg=sigDi(s,p);return sg&&p.faz===f&&p.es==null&&!p.sc&&!sg.prig&&!(p.dentro>=0&&s.l[p.dentro]&&s.l[p.dentro].ass)});
 const forzaLuogo=(s,l)=>(forzaTr(l.g)+s.p.filter(p=>p.dentro===l.id&&p.k==='sig').reduce((a,p)=>a+forza(p),0))*P.MURA;
 const regnoVero=(s,f)=>f==='tu'||VEN.regni(s).includes(f);
 // ---------- obiettivo ----------
 // un luogo appena preso o perso non è subito un bersaglio: evita i castelli che passano di mano avanti e indietro
 const fermo=(s,l)=>!!s.presi&&s.presi[l.id]!=null&&giorno(s)-s.presi[l.id]<X.PAUSA;
 VEN.aggancia('luogo',(s,l,ev)=>{if(attivo()&&ev==='conquista'){if(!s.presi)s.presi={};s.presi[l.id]=giorno(s)}});
 // soccorso a un proprio luogo assediato, poi il luogo murato nemico più vicino che l'esercito può prendere, poi un villaggio nemico da saccheggiare
 function scegli(s,f,cp,fz){const g=giorno(s),vicino=(lista,max)=>{let m=null,md=1e9;for(const l of lista){const d=dist(l,cp);if(d<=max&&d<md){md=d;m=l}}return m};
  let l=vicino(s.l.filter(x=>x.faz===f&&x.ass&&nemiche(s,f,x.ass.faz)),X.LONTANO);if(l)return{tipo:'soccorso',lid:l.id};
  l=vicino(s.l.filter(x=>MURA[x.tipo]&&x.faz!==f&&!fermo(s,x)&&regnoVero(s,x.faz)&&nemiche(s,f,x.faz)&&(!x.ass||x.ass.faz===f)&&forzaLuogo(s,x)<1.2*fz),X.LONTANO);if(l)return{tipo:'assedio',lid:l.id};
  l=vicino(s.l.filter(x=>x.tipo==='villaggio'&&!fermo(s,x)&&regnoVero(s,x.faz)&&nemiche(s,f,x.faz)&&x.sacc<=g),1e9);if(l)return{tipo:'razzia',lid:l.id};
  return null}
 function compiuto(s,e){const o=e.obiettivo,l=s.l[o.lid],f=e.faz;if(!l)return true;
  if(o.tipo==='soccorso')return !l.ass||l.faz!==f;
  if(o.tipo==='razzia')return l.sacc>giorno(s)||l.faz===f||!nemiche(s,f,l.faz);
  return l.faz===f||!nemiche(s,f,l.faz)||(e.stato==='assedia'&&!l.ass)}
 // ---------- da vassallo ----------
 const vassalloDi=(s,f)=>!!s.servizio&&s.servizio.tipo==='vas'&&s.servizio.faz===f;
 function presenza(s){const c=s.convoca;if(!c||c.presente)return;const e=trova(s,c.eid),cp=e&&part(s,e.capo);if(!inVita(e)||!cp||giorno(s)>c.fino||s.prigioniero)return;
  if(dist(TU(s),cp)<=X.PRESENTE)c.presente=true}
 // la chiamata andata a vuoto: relazione giù, un'altra disobbedienza; alla terza il feudo torna al re
 function assente(s,f,sigId){relaz(s,f,X.IGNORA);s.disobb=(s.disobb|0)+1;L(s,'Non hai risposto alla chiamata di '+VEN.rg(s,f).breve+': non lo dimenticherà.','male');
  if(s.disobb<X.FEUDO)return;s.disobb=0;let n=0;
  for(const l of s.l)if(l.sig===-2&&l.faz===f){l.sig=l.capo>=0?s.l[l.capo].sig:-1;n++}
  if(n){L(s,VEN.rg(s,f).breve+' ti toglie il feudo: troppe chiamate ignorate.','male');VEN.accoda(s,'adunata-feudo',sigId)}}
 function fineConvoca(s,e){const c=s.convoca;if(!c||c.eid!==e.id)return;delete s.convoca;
  if(!vassalloDi(s,e.faz))return;
  if(c.presente){const tu=TU(s),n=uomini(tu);relaz(s,e.faz,X.FIDUCIA);tu.oro+=X.PAGA*n;L(s,VEN.rg(s,e.faz).breve+' ti ringrazia: '+X.PAGA*n+' monete per gli uomini che hai portato.','bene')}
  else if(giorno(s)>c.fino){const cp=part(s,e.capo);assente(s,e.faz,cp?cp.sig:undefined)}}
 // ---------- nascita e scioglimento ----------
 function scioglie(s,e,motivo,g){e.stato='sciolto';e.sciolto=g;e.motivo=motivo;
  for(const id of e.membri){const p=part(s,id);if(p&&p.es===e.id)delete p.es}
  if(e.mar&&s.sig[e.sg])delete s.sig[e.sg].mar
  fineConvoca(s,e)}
 function nascite(s,r,g){
  for(const f of VEN.regni(s)){
   if(!viva(s,f)||liste(s).some(e=>e.faz===f)||!inGuerraCon(s,f)||!(r()<X.NASCE))continue;
   // servono MIN signori (nei regni piccoli di meno: tutti tranne uno, almeno 2); il re può essere membro, maresciallo solo se il regno ha meno di 4 signori
   const tutti=s.p.filter(p=>p.k==='sig'&&p.faz===f).length,serve=Math.max(2,Math.min(X.MIN,tutti-1)),pool=liberi(s,f),capi=pool.filter(p=>!s.sig[p.sig].re||tutti<4);if(pool.length<serve)continue;
   // il maresciallo è il più forte che riesce a radunare almeno `serve` signori entro RAGGIO caselle; i membri sono i più vicini a lui
   const peso=p=>forza(p)+20*(s.sig[p.sig].esp|0),minimo=p=>forza(p)>=(s.sig[p.sig].re?80:55);   // più debole di così il maresciallo tornerebbe a casa
   let cp=null,vic=null;
   for(const c of capi.filter(minimo).sort((a,b)=>peso(b)-peso(a)||a.id-b.id)){
    const v=pool.filter(p=>p!==c&&dist(p,c)<=X.RAGGIO).sort((a,b)=>dist(a,c)-dist(b,c)||a.id-b.id).slice(0,X.MAX-1);if(v.length+1>=serve){cp=c;vic=v;break}}
   if(!cp)continue;
   const mem=[cp].concat(vic),fz=mem.reduce((a,p)=>a+forza(p),0),ob=scegli(s,f,cp,fz);if(!ob)continue;
   const e={id:s.uid++,faz:f,capo:cp.id,membri:mem.map(p=>p.id),obiettivo:ob,stato:'aduna',da:g,f0:fz,sg:cp.sig};
   if(!s.eserciti)s.eserciti=[];s.eserciti.push(e);for(const p of mem)p.es=e.id;
   const sg=s.sig[cp.sig];if(!sg.mar){sg.mar=1;e.mar=1}
   if(vedi(s,cp))L(s,cp.nome+' raduna i signori di '+VEN.rg(s,f).breve+'.','guerra');
   if(vassalloDi(s,f)&&!s.convoca){s.convoca={eid:e.id,fino:g+X.ENTRO,presente:false};VEN.accoda(s,'adunata-convoca',cp.sig);L(s,'Il tuo re ti convoca: raggiungi '+cp.nome+'.','guerra')}}}
 // l'esercito del sovrano: i signori radunati con `aduna` restano insieme per DURATA giorni
 function aggiornaTu(s,e,g){e.membri=e.membri.filter(id=>{const p=part(s,id),ok=!!p&&p.k==='sig'&&p.faz==='tu'&&!!p.ia&&p.ia.st==='adunata';if(!ok&&p&&p.es===e.id)delete p.es;return ok});
  if(!s.corona||!e.membri.length||g>e.da+X.DURATA)scioglie(s,e,'durata',g)}
 function aggiorna(s,e,g){if(e.faz==='tu')return aggiornaTu(s,e,g);
  const f=e.faz,cp=part(s,e.capo),sg=sigDi(s,cp);
  if(!sg||sg.prig||cp.faz!==f||(e.stato!=='aduna'&&cp.ia&&cp.ia.st==='casa'))return scioglie(s,e,'perso',g);
  e.membri=e.membri.filter(id=>{const p=part(s,id),sm=sigDi(s,p);
   if(p&&sm&&p.faz===f&&!sm.prig&&(id===e.capo||e.stato==='aduna'||!p.ia||p.ia.st!=='casa'))return true;if(p&&p.es===e.id)delete p.es;return false});
  if(!inGuerraCon(s,f))return scioglie(s,e,'pace',g);
  if(e.stato==='aduna'){if(g<e.da+X.ADUNA)return;
   // chi non è arrivato lascia l'esercito; gli altri escono dalle mura e partono
   e.membri=e.membri.filter(id=>{const p=part(s,id);if(id===e.capo||dist(p,cp)<=X.STRETTI)return true;delete p.es;return false});
   if(e.membri.length<2)return scioglie(s,e,'pochi',g);
   e.stato='marcia';for(const id of e.membri){const p=part(s,id);p.dentro=-1;p.via=[];p.ia={st:'giro',t:0}}}
  if(e.membri.length<2)return scioglie(s,e,'pochi',g);
  const fz=forzaE(s,e);
  if(fz<X.META*e.f0)return scioglie(s,e,'forza',g);
  if(g>=e.da+X.DURATA)return scioglie(s,e,'durata',g);
  if(compiuto(s,e)){const n=scegli(s,f,cp,fz);if(!n)return scioglie(s,e,'compiuto',g);e.obiettivo=n;e.stato='marcia'}
  else{const l=s.l[e.obiettivo.lid];if(e.obiettivo.tipo==='assedio'&&l.ass&&l.ass.faz===f)e.stato='assedia'}}
 VEN.aggancia('giorno',s=>{if(!attivo())return;const g=giorno(s);presenza(s);
  if(s.convoca){const c=s.convoca,e=trova(s,c.eid);if(!inVita(e)||!vassalloDi(s,e.faz))delete s.convoca}
  for(const e of liste(s).slice())if(inVita(e))aggiorna(s,e,g);
  nascite(s,rnd(s),g);
  if(s.eserciti)s.eserciti=s.eserciti.filter(e=>!(e.stato==='sciolto'&&e.sciolto<g))});
 VEN.aggancia('ora',s=>{if(attivo())presenza(s)});
 // ---------- movimento: `VEN.decidi` e velocità di marcia ----------
 const decidi0=VEN.decidi;
 VEN.decidi=(s,p,M)=>{const e=attivo()&&p.es!=null?trova(s,p.es):null,cp=e&&inVita(e)&&e.capo>0?part(s,e.capo):null;
  if(!cp||p.sc||p.fermo)return decidi0(s,p,M);
  const vai=VEN._.vai,riparti=!p.via.length||s.t%60<20;
  if(e.stato==='aduna'){if(p===cp){p.via=[];return}
   if(dist(p,cp)>X.STRETTI){p.dentro=-1;if(riparti)vai(s,p,cp.x,cp.y,M)}else p.via=[];return}
  if(p===cp){const o=e.obiettivo;p.dentro=-1;p.ia.st=o.tipo;p.ia.a=o.lid;return decidi0(s,p,M)}
  if(dist(p,cp)>X.STRETTI){p.dentro=-1;if(riparti)vai(s,p,cp.x,cp.y,M);return}
  p.dentro=-1;if(OBIETTIVI.includes(cp.ia.st)){p.ia.st=cp.ia.st;p.ia.a=cp.ia.a;return decidi0(s,p,M)}
  if(dist(p,cp)>.6){if(riparti)vai(s,p,cp.x,cp.y,M)}else p.via=[]};
 // il maresciallo va piano quanto il più lento dei suoi: la marcia dell'esercito è quella del suo membro più lento
 const molt0=VEN.molt;let dentroMolt=false;
 VEN.molt=(s,k,c)=>{const m=molt0(s,k,c);if(k!=='marcia'||dentroMolt||!c||!c.p||c.p.es==null||!attivo())return m;
  const e=trova(s,c.p.es);if(!inVita(e)||e.capo!==c.p.id||e.capo<1)return m;
  dentroMolt=true;let min=1;try{const vm=VEN.velocita(s,c.p);
   if(vm>0)for(const id of e.membri){const q=id!==e.capo?part(s,id):null;if(q&&q.dentro<0&&!q.sc)min=Math.min(min,VEN.velocita(s,q)/vm)}}finally{dentroMolt=false}
  return m*min};
 // ---------- in battaglia ----------
 // i compagni d'esercito vicini a chi combatte scendono nello stesso lato; il maresciallo va per primo
 function compagni(s,ids,filtra){for(const id of ids.slice()){const p=part(s,id),e=p&&p.es!=null?trova(s,p.es):null;if(!inVita(e))continue;
   for(const q of s.p)if(q.es===e.id&&q.k==='sig'&&!ids.includes(q.id)&&!q.sc&&q.dentro<0&&dist(q,p)<=X.AIUTO&&filtra(q))ids.push(q.id)}}
 function perPrimo(s,ids){for(const id of ids.slice()){const p=part(s,id),e=p&&p.es!=null?trova(s,p.es):null;
   if(inVita(e)&&e.capo>0&&id===e.capo&&ids[0]!==id){ids.splice(ids.indexOf(id),1);ids.unshift(id)}}}
 VEN.aggancia('scontro',(s,sc)=>{if(!attivo())return;
  for(const lato of['a','b']){const ids=sc[lato];compagni(s,ids,q=>{q.sc=sc.id;q.via=[];return true});perPrimo(s,ids)}
  const somma=ids=>ids.reduce((x,id)=>{const p=part(s,id);return x+(p?forza(p)*VEN.molt(s,'forza',{p}):0)},0);sc.fa=somma(sc.a);sc.fb=somma(sc.b)});
 VEN.aggancia('incontro',(s,inc)=>{if(!attivo()||!inc||inc.tipo!=='nemico')return;const pid=inc.pid||[],all=inc.all||[];
  compagni(s,pid,q=>!all.includes(q.id));compagni(s,all,q=>!pid.includes(q.id)&&!q.sc);perPrimo(s,pid)});
 // se il maresciallo è tra i nemici, il comandante in campo è lui (come il signore del passo 16) e le sue righe vengono per prime
 VEN.aggancia('scheda',(s,sc)=>{if(!attivo()||!sc||sc.tipo==='arena'||!s.incontro||!sc.b)return;
  const v=VEN.schieramenti(s),capo=v.nem.find(p=>liste(s).some(e=>inVita(e)&&e.capo===p.id&&e.capo>0));if(!capo)return;
  sc.b=sc.b.filter(r=>r.p===capo.id).concat(sc.b.filter(r=>r.p!==capo.id));if(!sc.capoB)sc.capoB=true});
 // ---------- da sovrano e da vassallo ----------
 VEN.aggancia('fatto',(s,z)=>{if(!attivo()||!z||z.a!=='aduna')return;const g=giorno(s);
  for(const e of liste(s).filter(x=>x.faz==='tu'&&inVita(x)))scioglie(s,e,'nuova',g);
  const mem=s.p.filter(p=>p.k==='sig'&&p.faz==='tu'&&p.ia&&p.ia.st==='adunata');if(!mem.length)return;
  const e={id:s.uid++,faz:'tu',capo:0,membri:mem.map(p=>p.id),obiettivo:null,stato:'marcia',da:g,f0:mem.reduce((a,p)=>a+forza(p),0)};
  for(const p of mem){p.ia.fine=s.t+X.DURATA*P.GIORNO;p.es=e.id}
  if(!s.eserciti)s.eserciti=[];s.eserciti.push(e)});
 // la risposta alla lettera: v:1 «verrò» (conta se poi arrivi), v:0 «non vengo» (conta subito come assente)
 VEN.aggancia('effetto',(s,e)=>{if(!attivo()||!e||e.k!=='adunata'||!s.convoca)return;const c=s.convoca,ar=trova(s,c.eid);
  if(e.v){c.si=1;return}
  delete s.convoca;if(ar&&vassalloDi(s,ar.faz)){const cp=part(s,ar.capo);assente(s,ar.faz,cp?cp.sig:undefined)}});
 // ---------- per le viste ----------
 const esercitoDi=(s,pid)=>liste(s).find(e=>inVita(e)&&(e.capo===pid||e.membri.includes(pid)))||null;
 const eserciti=s=>liste(s).map(e=>{const cp=part(s,e.capo);if(!cp)return null;
  const n=e.membri.reduce((a,id)=>{const p=id===e.capo?null:part(s,id);return a+(p?uomini(p):0)},uomini(cp));return{id:e.id,faz:e.faz,capo:e.capo,n,x:cp.x,y:cp.y,stato:e.stato}}).filter(Boolean);
 return{esercitoDi,eserciti}})());
