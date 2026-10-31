/* ---- Mondo (A6.1): la mappa a esagoni della campagna, generata dal seme (motore puro, nessun DOM). ----
   Raggio 9 (271 esagoni), tre regioni con nome, terreno dominante e famiglia di mostri; luoghi di tipo diverso (città, villaggi, santuari,
   antri, rovine, torre, accampamenti, forzieri) e mercanti vaganti sulle strade. Tutti i luoghi sono sempre collegati da terreno calpestabile.
   Il capitolo (A8) può dare nomi e terreni delle regioni (`opz.regioni`) e luoghi scritti a mano (`opz.luoghi`: tipo, nome, regione, e
   facoltativamente q,r): il generatore li rispetta e riempie il resto. Qui ci sono anche percorsi e raggio di visione.
   Contratto: genera(seme, opz) -> { raggio, celle, regioni, luoghi, partenza, mercanti }; JSON puro, stesso seme = stessa mappa. */
const AMON=(()=>{
 const TERRENI={pianura:{c:1,n:'Pianura'},strada:{c:.5,n:'Strada'},bosco:{c:2,n:'Bosco'},collina:{c:2,n:'Colle'},palude:{c:3,n:'Palude'},montagna:{c:null,n:'Montagna'},acqua:{c:null,n:'Acqua'}};
 const DIREZIONI=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
 const K=(q,r)=>q+','+r,dist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.q+a.r-b.q-b.r)+Math.abs(a.r-b.r))/2;
 const vicini=(q,r)=>DIREZIONI.map(([dq,dr])=>({q:q+dq,r:r+dr}));
 const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const hash=(x,y,s)=>{let h=Math.imul(x*374761393+y*668265263+s*2147483647|0,1274126177);h=Math.imul(h^h>>>13,1103515245);return((h^h>>>16)>>>0)/4294967296};
 const rumore=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
 function celleRaggio(R){const out=[];for(let q=-R;q<=R;q++)for(let r=Math.max(-R,-q-R);r<=Math.min(R,-q+R);r++)out.push({q,r});return out}
 const passabile=t=>TERRENI[t].c!=null;
 // tipi di luogo: nome visibile, sicuro (i mostri non entrano e non attaccano chi vi sta), sotterraneo (si entra a stanze)
 const TIPI={citta:{n:'Città',sicuro:true},villaggio:{n:'Villaggio',sicuro:true},santuario:{n:'Santuario',sicuro:true},campo:{n:'Accampamento',sicuro:true},
  antro:{n:'Antro',sotterraneo:true},rovina:{n:'Rovine',sotterraneo:true},torre:{n:'Torre dei Corvi',sotterraneo:true},tesoro:{n:'Tesoro'}};
 // regioni di base: il capitolo può cambiare nomi e terreni; fam = famiglia di mostri che vi si aggira
 const REGIONI=[{nome:'Marca dei Corvi',terreno:'pianura',fam:'banditi'},{nome:'Boschi Velati',terreno:'bosco',fam:'bestie'},{nome:'Brughiere Cenerine',terreno:'palude',fam:'nonmorti'}];
 const NOMI={
  citta:['Valcorvo','Rocca Pallida','Borgoalto'],villaggio:['Casale dei Salici','Poggio Basso','Fonte Cupa','Molino Rosso','Le Quattro Querce','Pieve del Tasso'],
  santuario:['Cappella del Pellegrino','Edicola dell\'Alba','Altare delle Piogge','Pozzo dei Voti'],antro:['Tana dei Sussurri','Grotta del Gelo','Cunicolo del Lupo'],
  rovina:['Rovine di Castelgrigio','Abbazia Sommersa','Fortino Crollato','Cripta dei Mercanti'],torre:['Torre dei Corvi'],
  campo:['Bivacco dei Boscaioli','Fuoco del Cacciatore','Radura dei Carrettieri','Riparo del Pastore','Capanna sul Colle'],tesoro:['Forziere abbandonato','Cassa sepolta','Scrigno nel fosso','Sacca dimenticata','Baule sotto le radici']};
 // quanti luoghi per tipo (oltre ai fissi del capitolo); citta, antro e torre sono «unici»: se il capitolo ne dà uno, il generatore non ne aggiunge
 const CONTA={citta:1,villaggio:2,santuario:3,antro:1,rovina:2,torre:1,campo:4,tesoro:4};
 const UNICI=['citta','antro','torre'];
 // percorso di costo minimo (Dijkstra); i terreni bloccati costano `blocco` (serve a scavare un passaggio) o sono vietati se blocco è nullo
 function percorso(celle,da,a,blocco,opz){opz=opz||{};const vieta=opz.vieta,D={[K(da.q,da.r)]:0},P={},aperti=[da];
  while(aperti.length){let m=0;for(let i=1;i<aperti.length;i++)if(D[K(aperti[i].q,aperti[i].r)]<D[K(aperti[m].q,aperti[m].r)])m=i;const c=aperti.splice(m,1)[0];if(c.q===a.q&&c.r===a.r)break;
   for(const n of vicini(c.q,c.r)){const cella=celle[K(n.q,n.r)];if(!cella)continue;if(vieta&&vieta.has(K(n.q,n.r))&&!(n.q===a.q&&n.r===a.r))continue;
    const base=TERRENI[cella.t].c;if(base==null&&!blocco)continue;const cost=(opz.costo?opz.costo(cella):base)??(blocco||99),nd=D[K(c.q,c.r)]+(base==null?blocco:cost);
    if(D[K(n.q,n.r)]==null||nd<D[K(n.q,n.r)]){D[K(n.q,n.r)]=nd;P[K(n.q,n.r)]=c;aperti.push(n)}}}
  if(D[K(a.q,a.r)]==null)return null;const out=[];let c=a;while(c&&!(c.q===da.q&&c.r===da.r)){out.unshift({q:c.q,r:c.r});c=P[K(c.q,c.r)]}out.costo=D[K(a.q,a.r)];return out}
 // tutte le celle raggiungibili con `pm` punti: { 'q,r': costo }; `vieta` = celle che non si possono attraversare (per esempio dove stanno i mostri)
 function raggiungibili(celle,da,pm,opz){opz=opz||{};const D={[K(da.q,da.r)]:0},aperti=[{q:da.q,r:da.r}];
  while(aperti.length){let m=0;for(let i=1;i<aperti.length;i++)if(D[K(aperti[i].q,aperti[i].r)]<D[K(aperti[m].q,aperti[m].r)])m=i;const c=aperti.splice(m,1)[0];
   for(const n of vicini(c.q,c.r)){const x=celle[K(n.q,n.r)];if(!x)continue;const base=opz.costo?opz.costo(x):TERRENI[x.t].c;if(base==null)continue;if(opz.vieta&&opz.vieta.has(K(n.q,n.r)))continue;
    const nd=D[K(c.q,c.r)]+base;if(nd>pm)continue;if(D[K(n.q,n.r)]==null||nd<D[K(n.q,n.r)]){D[K(n.q,n.r)]=nd;aperti.push(n)}}}
  return D}
 const rivela=(celle,q,r,raggio)=>{for(const c of celleRaggio(raggio==null?2:raggio)){const x=celle[K(q+c.q,r+c.r)];if(x)x.visto=true}};
 function genera(seed,opz){
  opz=opz||{};const R=opz.raggio||9,O={q:0,r:0},rnd=mulberry(seed>>>0),lista=celleRaggio(R),off=rnd()*1000,celle={};
  const regioni=REGIONI.map((g,i)=>Object.assign({},g,(opz.regioni||[])[i]||{}));
  // regioni: il disco attorno alla partenza e un terzo del resto appartengono alla prima; gli altri due terzi sono settori ruotati dal seme
  // e piegati dal rumore, così i confini non sono rette. `centro` è la cella più vicina al baricentro (serve alla vista per l'etichetta)
  const a0=rnd()*Math.PI*2,sett=Math.PI*2/regioni.length;regioni.forEach((g,i)=>{g.id=i});
  const regDi=c=>{if(dist(c,O)<=2)return 0;const x=c.q+c.r/2,y=c.r*.866,w=(rumore(x*.3+off,y*.3,seed+3)-.5)*1.2,t=Math.atan2(y,x)+w-a0;return Math.floor((((t%(2*Math.PI))+2*Math.PI)%(2*Math.PI))/sett)%regioni.length};
  for(const{q,r}of lista){const d=dist({q,r},O),x=q+r/2,y=r*.866,reg=regDi({q,r}),tono=regioni[reg].terreno;
   const h=rumore(x*.45+off,y*.45,seed),w=rumore(x*.6,y*.6+off,seed+7);let t='pianura';
   const bosco=tono==='bosco'?.5:.66,palude=tono==='palude'?.38:.2,colle=tono==='collina'?.52:.62;
   if(d>=R)t=rnd()<.8?'acqua':'montagna';else if(h>.76)t='montagna';else if(h>colle)t='collina';else if(w>bosco)t='bosco';else if(w<palude)t='palude';else if(h<.2&&d>R-3)t='acqua';
   celle[K(q,r)]={q,r,t,poi:null,luogo:null,reg,visto:false}}
  celle[K(0,0)].t='pianura';
  regioni.forEach(g=>{const cs=lista.filter(c=>celle[K(c.q,c.r)].reg===g.id),m={q:cs.reduce((a,c)=>a+c.q,0)/cs.length,r:cs.reduce((a,c)=>a+c.r,0)/cs.length};g.centro=cs.reduce((b,c)=>dist(c,m)<dist(b,m)?c:b,cs[0])});
  const interne=lista.filter(c=>dist(c,O)<R-1),luoghi={},ordine=[],usati={};
  const nome=(tipo,reg)=>{const L=NOMI[tipo]||[tipo],u=usati[tipo]||(usati[tipo]=[]),libere=L.filter(n=>!u.includes(n));const n=(libere.length?libere:L)[Math.floor(rnd()*(libere.length||L.length))];u.push(n);return n};
  const metti=(tipo,c,extra)=>{const x=celle[K(c.q,c.r)];if(!passabile(x.t))x.t=tipo==='torre'||tipo==='antro'?'collina':'pianura';
   const n=(usati['#'+tipo]=(usati['#'+tipo]||0)+1),id=(extra&&extra.id)||tipo+n,l=Object.assign({id,tipo,nome:nome(tipo,x.reg),q:c.q,r:c.r,reg:x.reg},extra||{});l.id=id;
   luoghi[id]=l;ordine.push(id);x.poi=tipo;x.luogo=id;return l};
  // cella adatta: libera, nella regione e a distanza dalla partenza richieste, staccata dagli altri luoghi; se non c'è si allentano i vincoli
  const scegli=v=>{for(let giro=0;giro<4;giro++){const sep=Math.max(1,(v.sep||2)-giro),reg=giro>=2?null:v.reg,dmin=giro>=3?0:v.dmin,dmax=giro>=3?R:v.dmax;
   const c=interne.filter(p=>{const x=celle[K(p.q,p.r)];if(x.poi)return false;if(reg!=null&&x.reg!==reg)return false;const d=dist(p,O);if(dmin!=null&&d<dmin)return false;if(dmax!=null&&d>dmax)return false;
    return !ordine.some(i=>dist(luoghi[i],p)<sep)});if(c.length)return c[Math.floor(rnd()*c.length)]}return null};
  const piazza=(tipo,v,extra)=>{const c=scegli(v);return c?metti(tipo,c,extra):null};
  // la partenza è un villaggio al centro
  metti('villaggio',O,{nome:'Casale di partenza',partenza:true});
  // luoghi scritti a mano dal capitolo, prima di tutto
  for(const f of opz.luoghi||[]){if(!TIPI[f.tipo])throw new Error('tipo di luogo sconosciuto: '+f.tipo);
   let c=f.q!=null&&f.r!=null?{q:f.q,r:f.r}:scegli({reg:f.reg,dmin:f.dmin,dmax:f.dmax,sep:3});if(!c||!celle[K(c.q,c.r)])throw new Error('luogo fuori dalla mappa: '+(f.nome||f.tipo));
   const ex=celle[K(c.q,c.r)];if(ex.poi&&!(c.q===0&&c.r===0))throw new Error('due luoghi nella stessa cella: '+(f.nome||f.tipo));
   const extra=Object.assign({},f);delete extra.q;delete extra.r;delete extra.tipo;if(!extra.nome)delete extra.nome;metti(f.tipo,c,extra)}
  const ha=t=>ordine.some(i=>luoghi[i].tipo===t&&!luoghi[i].partenza);
  // luoghi generati: la città vicino alla partenza, antro e torre lontani in regioni diverse, i villaggi nelle altre regioni
  if(!ha('citta'))piazza('citta',{reg:0,dmin:2,dmax:3,sep:2});
  if(!ha('antro'))piazza('antro',{reg:1,dmin:R-4,dmax:R-1,sep:3});
  if(!ha('torre'))piazza('torre',{reg:2,dmin:R-3,dmax:R-1,sep:3});
  const nVil=(opz.conta&&opz.conta.villaggio!=null?opz.conta.villaggio:CONTA.villaggio);
  for(let i=0;i<nVil;i++)piazza('villaggio',{reg:1+i%2,dmin:3,sep:3});
  for(const t of['santuario','rovina','campo','tesoro']){const n=(opz.conta&&opz.conta[t]!=null)?opz.conta[t]:CONTA[t];for(let i=0;i<n;i++)piazza(t,{reg:t==='santuario'||t==='rovina'?i%3:null,dmin:t==='tesoro'||t==='campo'?2:3,sep:t==='tesoro'?2:3})}
  // collegamenti: strade tra città, villaggi e luoghi grandi; poi ogni luogo si lega alla rete aprendo un passo dove serve
  const di=t=>ordine.filter(i=>luoghi[i].tipo===t).map(i=>luoghi[i]),citta=di('citta')[0]||luoghi[ordine[0]],par=luoghi[ordine[0]];
  const strada=(a,b)=>{for(const c of percorso(celle,a,b,6)||[]){const x=celle[K(c.q,c.r)];if(!passabile(x.t))x.t='pianura';if(!x.poi&&x.t!=='strada')x.t='strada'}};
  strada(par,citta);const vill=di('villaggio').filter(v=>!v.partenza);
  for(const v of vill)strada(citta,v);
  for(const t of['antro','torre']){const l=di(t)[0];if(l){const v=vill.concat([citta]).reduce((m,x)=>dist(x,l)<dist(m,l)?x:m);strada(v,l)}}
  for(const i of ordine){const l=luoghi[i];const p=percorso(celle,par,l,6)||[];for(const c of p){const x=celle[K(c.q,c.r)];if(!passabile(x.t))x.t='pianura'}}
  // mercanti vaganti: sulle strade, lontano dai luoghi
  const vie=interne.filter(c=>celle[K(c.q,c.r)].t==='strada'&&!celle[K(c.q,c.r)].poi),mercanti=[];
  for(let i=0;i<(opz.mercanti==null?2:opz.mercanti)&&vie.length;i++){const c=vie.splice(Math.floor(rnd()*vie.length),1)[0];mercanti.push({id:'mer'+(i+1),q:c.q,r:c.r})}
  rivela(celle,0,0,2);
  return{raggio:R,celle,regioni,luoghi,partenza:{q:0,r:0},mercanti}}
 // vero se la cella è visibile adesso: entro `raggio` esagoni da uno dei punti
 const vicino=(punti,c,raggio)=>punti.some(p=>dist(p,c)<=raggio);
 // verifica interna usata dai test: ogni luogo è raggiungibile dalla partenza solo con terreno calpestabile
 function connessa(m){const D=raggiungibili(m.celle,m.partenza,1e6);return Object.values(m.luoghi).every(l=>D[K(l.q,l.r)]!=null)}
 return{TERRENI,TIPI,REGIONI,NOMI,CONTA,UNICI,DIREZIONI,K,dist,vicini,mulberry,celleRaggio,passabile,percorso,raggiungibili,rivela,genera,vicino,connessa}})();
if(typeof module!=='undefined')module.exports=AMON;
