/* ---- Compagnia di ventura, feudi vivi: costruire (passo 41). ----
   Nei luoghi tuoi (mondi nuovi, `s.geo===2`) costruisci mulino, palizzata, campo d'addestramento, mura, caserma, mercato, torre e cappella; ogni edificio ha tre livelli
   e cambia rendite, difese e riposo. Tutto vive qui e si attacca ai ganci `azione`, `fatto`, `giorno`, `ora`, `luogo`, a `VEN.molt` (`rendita`, `vista`) e a `VEN.decidi`.
   Stato facoltativo del luogo: `l.edif={id:livello}`, `l.cant={id,fino}` (un cantiere alla volta), `l.cas` (volontari della caserma). Assenti = nessun edificio.
   Nuove: `VEN.mioLuogo(s,l)`, `VEN.edifici(s,l)` (per la tessera «Cantiere» del passo 45), `VEN.cantiere(s,l)`. Nei mondi vecchi non cambia nulla, tranne che `costruisci` risponde «Qui non si costruisce».
   Ripetibile: niente Math.random né trigonometria. Dopo 28ke, prima di 28l. */
// tutti i numeri qui: per ogni edificio dove si può costruire (tipi di luogo), il costo e i giorni di cantiere per livello (1, 2, 3); l'effetto è descritto nel passo 41
VDAT.EDIFICI={
 mulino:{nome:'Mulino',dove:['villaggio'],costo:[100,160,240],giorni:[4,6,8],fin:'Il mulino di {l} è finito'},
 palizzata:{nome:'Palizzata',dove:['villaggio'],costo:[80,140,220],giorni:[3,5,7],fin:'La palizzata di {l} è finita'},
 addestra:{nome:'Campo d\'addestramento',dove:['villaggio'],costo:[120,200,300],giorni:[5,7,9],fin:'Il campo d\'addestramento di {l} è finito'},
 mura:{nome:'Mura',dove:['citta','castello'],costo:[300,450,650],giorni:[8,10,12],fin:'Le mura di {l} sono finite'},
 caserma:{nome:'Caserma',dove:['citta','castello'],costo:[250,380,560],giorni:[6,8,10],fin:'La caserma di {l} è finita'},
 mercato:{nome:'Mercato coperto',dove:['citta','porto'],costo:[200,320,480],giorni:[6,8,10],fin:'Il mercato coperto di {l} è finito'},
 torre:{nome:'Torre',dove:['citta','castello','porto'],costo:[150,240,360],giorni:[5,7,9],fin:'La torre di {l} è finita'},
 cappella:{nome:'Cappella',dove:['citta','castello','villaggio'],costo:[90,150,230],giorni:[4,6,8],fin:'La cappella di {l} è finita'}};
VDAT.EDIFICI_N={LIVELLI:3,MULINO:.15,MERCATO:.1,TORRE:.15,TORRE_RAGGIO:8,GUARNIGIONE:3,RAZZIA_IA:120,RAZZIA_TUA:60,MURA_IA:720,MURA_TUA:1440,ADDESTRA:3,CASERMA_SETT:4,CAPPELLA_MORALE:3,SETT:0};
Object.assign(VEN,(()=>{
 const{D,L,M0,TU,aggiungi,capDi,dist,giorno,limite,P,togliUomini,uomini}=VEN._,ED=VDAT.EDIFICI,N=VDAT.EDIFICI_N,IDS=Object.keys(ED);
 const tetto=()=>VDAT.ECO?VDAT.ECO.TETTO:120;
 const livello=(l,id)=>(l&&l.edif&&l.edif[id])||0;
 // un luogo è tuo se lo tieni (feudo proprio) o te l'ha dato il sovrano da vassallo: gli stessi luoghi che ti danno la rendita
 const mioLuogo=(s,l)=>!!l&&((l.faz==='tu'&&l.sig<0)||l.sig===-2);
 // la cultura del luogo come la usa `recluta` (regno che lo tiene, altrimenti quello della cella) e quella del regno di nascita (palizzata e caserma)
 const cultL=(s,l)=>VEN.regni(s).includes(l.faz)?VEN.cult(s,l.faz):M0(s,l);
 function nascita(s,l){const M=VEN.mappaDi(s),b=M&&M.luoghi&&M.luoghi[l.id],c=b&&b.faz?VEN.cult(s,b.faz):null;return c&&D.TR[c+'_f1']?c:cultL(s,l)}
 const nuovoGeo=s=>s.geo===2;
 // gli edifici di un luogo dal più alto (a pari livello il primo dell'elenco)
 function piuAlto(l){let m=null,v=0;for(const id of IDS){const n=livello(l,id);if(n>v){v=n;m=id}}return m}
 // ---------- azioni ----------
 function costruisci(s,z,l){
  if(!nuovoGeo(s)||!l)return{err:'Qui non si costruisce'};const E=ED[z.id];if(!E)return{err:'Edificio sconosciuto'};if(!E.dove.includes(l.tipo))return{err:'Qui non si costruisce'};
  if(!mioLuogo(s,l))return{err:'Non è un tuo luogo'};if(l.cant)return{err:'C\'è già un cantiere'};const n=livello(l,z.id);if(n>=N.LIVELLI)return{err:'Già al massimo'};
  const tu=TU(s),oro=E.costo[n];if(tu.oro<oro)return{err:'Servono '+oro+' monete'};
  tu.oro-=oro;l.cant={id:z.id,fino:giorno(s)+E.giorni[n]};L(s,'Si apre il cantiere: '+E.nome.toLowerCase()+' a '+l.nome+' (livello '+(n+1)+').');return{s,oro:-oro}}
 function arruola(s,z,l){
  if(!nuovoGeo(s)||!l||!mioLuogo(s,l)||!livello(l,'caserma'))return{err:'Qui non c\'è una caserma'};const tu=TU(s),n=Math.max(1,z.n|0||1),lv=livello(l,'caserma');
  if((l.cas||0)<n)return{err:'Non ci sono abbastanza volontari'};if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};
  const t=nascita(s,l)+'_f'+(lv+1),T=D.TR[t];if(!T)return{err:'Qui non c\'è una caserma'};const oro=D.INGAGGIO[T.t]*n;if(tu.oro<oro)return{err:'Servono '+oro+' monete'};
  tu.oro-=oro;l.cas-=n;aggiungi(tu.tr,t,n);L(s,'La caserma di '+l.nome+' arma '+n+' '+(n===1?'soldato scelto':'soldati scelti')+'.');return{s,oro:-oro}}
 let pzRazzia=null;   // palizzata del villaggio razziato da te, letta prima dei danni della razzia (vive solo dentro una `fai`)
 VEN.aggancia('azione',(s,z)=>{
  if(z.a==='razzia'){const lid=s.dentro>=0?s.dentro:s.davanti,l=lid>=0?s.l[lid]:null;pzRazzia=nuovoGeo(s)&&l&&livello(l,'palizzata')?{s,lid:l.id,n:livello(l,'palizzata')}:null;return}
  // (i verbi nuovi si confrontano con `!==`: la prova di copertura dei suoni, test_ven_audio.js, legge solo i `z.a==='…'`)
  const noCostr=z.a!=='costruisci',noArr=z.a!=='arruola';if(noCostr&&noArr)return;
  if(!noArr&&!nuovoGeo(s))return;
  if(!capDi(s,z.seat))return{err:'Capitano sconosciuto'};
  if(s.incontro&&s.incontro.tipo==='arena')return{err:'Il duello ti aspetta'};
  const l=s.dentro>=0?s.l[s.dentro]:null;
  return noArr?costruisci(s,z,l):arruola(s,z,l)});
 // dopo un'azione del nucleo riuscita: il campo d'addestramento dopo `recluta`, la tua razzia più lunga, la cappella dopo `riposa`
 VEN.aggancia('fatto',(s,z)=>{if(!nuovoGeo(s))return;const tu=TU(s);
  if(z.a==='razzia'){const p=pzRazzia;pzRazzia=null;if(p&&p.s===s)s.t+=N.RAZZIA_TUA*p.n;return}
  const l=s.dentro>=0?s.l[s.dentro]:null;if(!l||!mioLuogo(s,l))return;
  if(z.a==='recluta'){const lv=livello(l,'addestra');if(!lv)return;const k0=Math.floor(Math.max(1,z.n||1)*lv/N.ADDESTRA),c=cultL(s,l),a=c+'_f1',b=c+'_f2',e=tu.tr.find(x=>x.t===a);
   const k=Math.min(k0,e?e.n:0);if(k>0&&D.TR[b]){togliUomini(tu.tr,a,k);aggiungi(tu.tr,b,k)}return}
  if(z.a==='riposa'){const lv=livello(l,'cappella');if(!lv)return;tu.mor=Math.min(100,tu.mor+N.CAPPELLA_MORALE*lv);
   let guarire=lv;for(const e of tu.tr){if(guarire<=0)break;const g=Math.min(guarire,e.f||0);if(g>0){e.f-=g;guarire-=g}}}});
 // ---------- il giorno ----------
 // cantieri che finiscono, grano del mulino, merci del mercato, guarnigione della palizzata, volontari della caserma
 function produce(s,l){const p=D.PRODUCE[cultL(s,l)]||[],t=(l.prod&&l.prod.t)||[];return p.concat(t,l.tipo==='porto'?['pesce']:[]).filter((m,i,a)=>a.indexOf(m)===i&&D.MERCI[m])}
 VEN.aggancia('giorno',s=>{if(!nuovoGeo(s))return;const g=giorno(s);
  for(const l of s.l){
   if(l.cant&&g>=l.cant.fino){const id=l.cant.id,E=ED[id];l.cant=null;delete l.cant;if(E){(l.edif||(l.edif={}))[id]=Math.min(N.LIVELLI,livello(l,id)+1);L(s,E.fin.replace('{l}',l.nome)+' (livello '+l.edif[id]+').','bene')}}
   if(!l.edif||!mioLuogo(s,l))continue;
   const mu=livello(l,'mulino');if(mu&&l.scorte)l.scorte.grano=Math.min(tetto(),(l.scorte.grano||0)+mu);
   const me=livello(l,'mercato');if(me&&l.scorte)for(const m of produce(s,l))l.scorte[m]=Math.min(tetto(),(l.scorte[m]||0)+me);
   const pa=livello(l,'palizzata');if(pa&&uomini({tr:l.g})<N.GUARNIGIONE*pa){const t=nascita(s,l)+'_f1';if(D.TR[t])aggiungi(l.g,t,1)}
   const ca=livello(l,'caserma');if(ca&&g%7===N.SETT)l.cas=Math.min(N.CASERMA_SETT*ca,(l.cas||0)+ca)}});
 // ---------- le mura ritardano gli assedi, una volta sola per assedio ----------
 VEN.aggancia('ora',s=>{if(!nuovoGeo(s))return;
  for(const l of s.l){const a=l.ass;if(a&&!a.mu&&l.edif){const n=livello(l,'mura');if(n){a.mu=1;a.da+=N.MURA_IA*n}}}
  const a=s.assedio,l=a&&s.l[a.lid];if(a&&!a.mu&&l&&l.edif){const n=livello(l,'mura');if(n){a.mu=1;if(a.da==null)a.da=a.pronto-P.ASSEDIO_ORE*60;a.da+=N.MURA_TUA*n}}});
 // ---------- la palizzata allunga la razzia dell'IA (alla prima ora di razzia su quel villaggio) ----------
 const decidi0=VEN.decidi;
 VEN.decidi=(s,p,M)=>{const r=decidi0(s,p,M);const ia=p&&p.ia;if(!ia||!nuovoGeo(s))return r;
  if(ia.st!=='razzia'){if(ia.pz)delete ia.pz;return r}
  if(ia.t>0&&!ia.pz){const l=s.l[ia.a],n=livello(l,'palizzata');if(n){ia.pz=1;ia.t+=N.RAZZIA_IA*n}}return r};
 // ---------- rendite e vista ----------
 const molt0=VEN.molt;
 VEN.molt=(s,k,c)=>{const m=molt0(s,k,c);if(!nuovoGeo(s))return m;
  if(k==='rendita'&&c&&c.lid!=null){const l=s.l[c.lid];if(!l||!l.edif)return m;const a=livello(l,'mulino'),b=livello(l,'mercato');return a||b?m*(1+N.MULINO*a)*(1+N.MERCATO*b):m}
  if(k==='vista'){const tu=TU(s);let n=0;for(const l of s.l){const v=livello(l,'torre');if(v>n&&mioLuogo(s,l)&&dist(l,tu)<=N.TORRE_RAGGIO)n=v}return n?m*(1+N.TORRE*n):m}
  return m};
 // ---------- danni: razzia e conquista tolgono un livello all'edificio più alto e perdono il cantiere ----------
 VEN.aggancia('luogo',(s,l,ev)=>{if(!nuovoGeo(s)||!l||(ev!=='razzia'&&ev!=='conquista'))return;
  if(l.cant){delete l.cant}
  if(!l.edif)return;const id=piuAlto(l);if(!id)return;const n=livello(l,id)-1;if(n>0)l.edif[id]=n;else delete l.edif[id];
  L(s,(n>0?'Un edificio di ':'Un edificio va perduto a ')+l.nome+(n>0?' perde un livello':'')+': '+ED[id].nome.toLowerCase()+'.','male')});
 // ---------- per la vista (passo 45) ----------
 // le costruzioni possibili in un luogo: `puoi` dice se si può cominciare ora, `err` perché no
 function edifici(s,l){if(!nuovoGeo(s)||!l)return[];const o=[];
  for(const id of IDS){const E=ED[id];if(!E.dove.includes(l.tipo))continue;const n=livello(l,id),max=n>=N.LIVELLI;let err='';
   if(!mioLuogo(s,l))err='Non è un tuo luogo';else if(l.cant)err='C\'è già un cantiere';else if(max)err='Già al massimo';else if(TU(s).oro<E.costo[n])err='Servono '+E.costo[n]+' monete';
   o.push({id,nome:E.nome,n,puoi:!err,costo:max?0:E.costo[n],giorni:max?0:E.giorni[n],err})}
  return o}
 function cantiere(s,l){if(!l||!l.cant||!ED[l.cant.id])return null;return{id:l.cant.id,nome:ED[l.cant.id].nome,resta:Math.max(0,l.cant.fino-giorno(s))}}
 return{mioLuogo,edifici,cantiere}})());
