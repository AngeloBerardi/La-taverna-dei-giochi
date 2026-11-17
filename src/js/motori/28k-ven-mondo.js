/* ---- Compagnia di ventura (Cantari di Ventura, piano C): il mondo libero. Motore puro, senza DOM né rete. ----
   Una mappa continua (griglia nascosta G×G generata dal seme), tre regni con i loro signori che girano, si fanno guerra,
   razziano e assediano; predoni e carovane; villaggi dove reclutare, città con mercato e taverna, castelli da prendere.
   Chi gioca è il capitano di una compagnia: `ordina` dà la meta, `passo` fa scorrere i minuti, `fai` agisce nei luoghi,
   `scegli` risolve un incontro, `campo`/`esito` aprono e chiudono una battaglia (motore 28l, VCAM).
   Il tempo scorre solo dentro `passo`: un istante = un minuto di gioco. Lo stato è JSON; la mappa si rigenera dal seme.
   Mai `Math.random`, `Date.now` o trigonometria: solo + − × ÷ e radice, così telefoni diversi danno lo stesso mondo.
   Lo stato si modifica sul posto (come `ATEM` con `qui`). I numeri si ritoccano in `P` e in `VDAT` (28j).
   Piano: docs/VENTURA.md. */
const VEN=(()=>{
 const D=VDAT,G=128,MURA={citta:1,castello:1},MERCATO={citta:1,villaggio:1,porto:1},SITO={rovine:1,covo:1},OSTERIA={citta:1,locanda:1,porto:1};
 const P={VEL:2.6,VISTA:8,ORA:60,GIORNO:1440,CONTATTO:.55,CAPIENZA:20,PRED_MAX:16,ASSEDIO_ORE:10,ASSEDIO_IA_ORE:36,BRECCIA_ORE:72,ARIETE_ORE:6,ARIETE_ORO:150,MURA:1.6,PAGA_GIORNI:7,
  FAMA_CONTRATTO:25,FAMA_VASSALLO:100,ORO0:320};
 // ---------- rumore e mappa ----------
 const h2=(x,y,s)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s,1274126177);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 const liscio=t=>t*t*(3-2*t);
 function rumore(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=liscio(x-xi),fy=liscio(y-yi);
  const a=h2(xi,yi,s),b=h2(xi+1,yi,s),c=h2(xi,yi+1,s),d=h2(xi+1,yi+1,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy}
 const fbm=(x,y,s)=>rumore(x,y,s)*.5+rumore(x*2,y*2,s+1)*.25+rumore(x*4,y*4,s+2)*.15+rumore(x*8,y*8,s+3)*.1;
 // quota continua in [0,1] circa: sotto MARE è acqua, sopra MONTE non si passa. La usa anche la vista per il terreno.
 const MARE=.36,COLLE=.61,MONTE=.74;
 function alt(seme,x,y){const dx=(x-G/2)/(G/2),dy=(y-G/2)/(G/2),d2=dx*dx+dy*dy;
  let a=fbm(x/13,y/13,seme)*1.12-d2*.42+.12;
  const nord=Math.max(0,1-y/(G*.42));a+=nord*nord*.16*(.4+rumore(x/6,y/6,seme+9));
  const cresta=1-Math.abs(rumore(x/9,y/9,seme+21)*2-1);a+=cresta*cresta*cresta*.13*nord;
  return a}
 const dist=(a,b)=>Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
 const d2p=(x0,y0,x1,y1)=>Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
 const CACHE={};
 const CENTRI={val:[.72,.48],sel:[.3,.74],fer:[.45,.2],mar:[.7,.8],alt:[.2,.4]};
 function mappa(seme){if(CACHE[seme])return CACHE[seme];
  const T=new Uint8Array(G*G),B=new Uint8Array(G*G),S=new Uint8Array(G*G),R=new Uint8Array(G*G),A=new Float32Array(G*G);
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=y*G+x,a=alt(seme,x+.5,y+.5);A[i]=a;
   let reg=0,best=1e9;D.REGNI.forEach((f,k)=>{const c=CENTRI[f],d=d2p(x,y,c[0]*G,c[1]*G);if(d<best){best=d;reg=k}});R[i]=reg;
   const bos=rumore(x/5,y/5,seme+50)+(reg===1?.14:reg===0?-.1:reg===4?-.22:0);
   T[i]=a<MARE?0:a>MONTE?4:a>COLLE?3:bos>.6?2:1;
   B[i]=y<G*.24+rumore(x/9,y/9,seme+70)*14?1:reg===4&&rumore(x/11,y/11,seme+90)>.28?3:(reg===0&&rumore(x/8,y/8,seme+80)>.42?2:0)}
  // la terra principale: le celle raggiungibili dalla più grande macchia percorribile
  const comp=new Int16Array(G*G).fill(-1);let nc=0,grande=0,gmax=0;
  for(let i=0;i<G*G;i++){if(comp[i]>=0||T[i]===0||T[i]===4)continue;let n=0;const q=[i];comp[i]=nc;
   while(q.length){const c=q.pop();n++;const cx=c%G,cy=(c-cx)/G;
    for(const[ox,oy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;
     if(comp[j]<0&&T[j]!==0&&T[j]!==4){comp[j]=nc;q.push(j)}}}
   if(n>gmax){gmax=n;grande=nc}nc++}
  const M={seme,G,T,B,S,R,A,ok:new Uint8Array(G*G)};for(let i=0;i<G*G;i++)M.ok[i]=comp[i]===grande?1:0;
  // luoghi: per ogni regno una città, quattro castelli, otto villaggi e un porto (Maralta due); poi, di nessuno: monasteri, locande, rovine e covi
  const L=[];const lontano=(x,y,d)=>{for(const l of L){const dx=x-l.x,dy=y-l.y;if(dx*dx+dy*dy<d*d)return false}return true};
  const cerca=(reg,ok,punti)=>{let m=null,mv=-1e9;for(let y=4;y<G-4;y++)for(let x=4;x<G-4;x++){const i=y*G+x;if(!M.ok[i]||(reg>=0&&R[i]!==reg))continue;
    const v=punti(x,y,i)+h2(x,y,seme+300)*.6;if(v<=mv||!ok(x,y,i))continue;mv=v;m=[x,y]}return m};
  const metti=(tipo,f,k,pos,capo)=>{if(!pos)return null;const N=D.NOMI[tipo],nomi=tipo==='covo'?[D.CAPIBANDA[k%D.CAPIBANDA.length].banda]:f==='neu'?N:N[f];
   const l={id:L.length,tipo,faz:f,nome:(tipo==='covo'?'Covo: ':'')+nomi[k%nomi.length],x:pos[0]+.5,y:pos[1]+.5,capo:capo==null?-1:capo,k};L.push(l);
   const i=pos[1]*G+pos[0];if(MURA[tipo]){if(T[i]!==1)T[i]=3}else if(!SITO[tipo]&&tipo!=='monastero')T[i]=1;return l};
  const mare=(x,y)=>{for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(T[(y+oy)*G+x+ox]===0)return true;return false};
  D.REGNI.forEach((f,reg)=>{const c=CENTRI[f],cx=c[0]*G,cy=c[1]*G;metti('citta',f,0,cerca(reg,(x,y,i)=>T[i]===1,(x,y)=>-d2p(x,y,cx,cy))||cerca(-1,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,14),(x,y)=>-d2p(x,y,cx,cy)))});
  const cittaDi=f=>L.find(l=>l.faz===f&&l.tipo==='citta');
  D.REGNI.forEach((f,reg)=>{const cit=cittaDi(f);for(let k=0;k<4;k++)
   metti('castello',f,k,cerca(reg,(x,y)=>lontano(x+.5,y+.5,9),(x,y,i)=>(T[i]===3?2:0)-Math.abs(d2p(x,y,cit.x,cit.y)-15)*.3)||cerca(-1,(x,y)=>lontano(x+.5,y+.5,7),(x,y)=>-d2p(x,y,cit.x,cit.y)*.2),cit.id)});
  D.REGNI.forEach((f,reg)=>{const capi=L.filter(l=>l.faz===f&&MURA[l.tipo]);for(let k=0;k<8;k++){const capo=capi[k%capi.length];
   metti('villaggio',f,k,cerca(reg,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,4.5),(x,y)=>-Math.abs(d2p(x,y,capo.x,capo.y)-5.5)*.5)||cerca(-1,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,4),(x,y)=>-d2p(x,y,capo.x,capo.y)),capo.id)}});
  D.REGNI.forEach((f,reg)=>{const cit=cittaDi(f);for(let k=0;k<(f==='mar'?2:1);k++)metti('porto',f,k,cerca(reg,(x,y,i)=>T[i]!==4&&mare(x,y)&&lontano(x+.5,y+.5,5),(x,y)=>-d2p(x,y,cit.x,cit.y)*.25),cit.id)});
  for(let k=0;k<5;k++)metti('monastero','neu',k,cerca(-1,(x,y,i)=>T[i]!==1&&lontano(x+.5,y+.5,8),(x,y,i)=>T[i]===3?1.5:0));
  for(let k=0;k<7;k++)metti('locanda','neu',k,cerca(-1,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,7),()=>0));
  for(let k=0;k<8;k++)metti('rovine','neu',k,cerca(-1,(x,y,i)=>T[i]!==1&&lontano(x+.5,y+.5,7),()=>0));
  for(let k=0;k<6;k++)metti('covo','pre',k,cerca(-1,(x,y,i)=>T[i]!==1&&lontano(x+.5,y+.5,9),()=>0));
  M.luoghi=L;M.covi=L.filter(l=>l.tipo==='covo').map(l=>[l.x,l.y]);
  CACHE[seme]=M;
  // strade: ogni luogo si lega al suo capo, ogni città alle due più vicine, locande e monasteri alla città più vicina
  const lega=(a,b)=>{const v=aStar(M,a.x,a.y,b.x,b.y,true);if(v)for(const c of v)S[c]=1};
  for(const l of L){if(l.capo>=0)lega(l,L[l.capo])}
  const C=L.filter(l=>l.tipo==='citta'),piuVicine=l=>C.filter(b=>b!==l).sort((p,q)=>d2p(l.x,l.y,p.x,p.y)-d2p(l.x,l.y,q.x,q.y));
  for(const a of C){const v=piuVicine(a);if(v[0])lega(a,v[0]);if(v[1])lega(a,v[1])}
  for(const l of L)if(l.tipo==='locanda'||l.tipo==='monastero'){const v=piuVicine(l);if(v[0])lega(l,v[0])}
  return M}
 const cella=(M,x,y)=>{const cx=Math.max(0,Math.min(G-1,Math.floor(x))),cy=Math.max(0,Math.min(G-1,Math.floor(y)));return cy*G+cx};
 const passa=(M,x,y)=>x>=0&&y>=0&&x<G&&y<G&&M.ok[cella(M,x,y)]===1;
 const COSTO=[9,1,1.45,1.35,9];
 const costo=(M,i)=>M.S[i]?.72:COSTO[M.T[i]];
 function libero(M,x0,y0,x1,y1){const d=d2p(x0,y0,x1,y1),n=Math.ceil(d/.2);for(let k=1;k<=n;k++){const t=k/n;if(!passa(M,x0+(x1-x0)*t,y0+(y1-y0)*t))return false}return true}
 // A* a otto direzioni sulla griglia; restituisce l'elenco delle celle (dalla partenza all'arrivo) o null
 function aStar(M,x0,y0,x1,y1,strade){const a=cella(M,x0,y0),b=cella(M,x1,y1);if(a===b)return[a];
  const g=new Float32Array(G*G).fill(1e9),da=new Int32Array(G*G).fill(-1),chiuso=new Uint8Array(G*G),heap=[];const bx=b%G,by=(b-bx)/G;
  const spingi=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;const t=heap[p];heap[p]=heap[k];heap[k]=t;k=p}};
  const togli=()=>{const top=heap[0],ult=heap.pop();if(heap.length){heap[0]=ult;let k=0;for(;;){let m=k;const l=2*k+1,r=l+1;
     if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;const t=heap[m];heap[m]=heap[k];heap[k]=t;k=m}}return top};
  g[a]=0;spingi(a,0);
  while(heap.length){const c=togli()[1];if(chiuso[c])continue;chiuso[c]=1;if(c===b)break;const cx=c%G,cy=(c-cx)/G;
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;
    if(!M.ok[j]&&j!==b)continue;if(ox&&oy&&(!M.ok[cy*G+nx]||!M.ok[ny*G+cx]))continue;
    const w=(strade?(M.S[j]?.5:COSTO[M.T[j]]+(M.T[j]===3?1.2:0)):costo(M,j))*(ox&&oy?1.4142:1),ng=g[c]+w;
    if(ng<g[j]){g[j]=ng;da[j]=c;spingi(j,ng+d2p(nx,ny,bx,by)*.7)}}}
  if(da[b]<0)return null;const via=[];for(let c=b;c>=0;c=da[c]){via.push(c);if(c===a)break}return via.reverse()}
 // la via da un punto a un altro: tappe [x,y], già accorciate dove si va dritti
 function via(M,x0,y0,x1,y1){if(!passa(M,x1,y1)){const v=vicinoOk(M,x1,y1);x1=v[0];y1=v[1]}
  if(libero(M,x0,y0,x1,y1))return[[x1,y1]];const c=aStar(M,x0,y0,x1,y1);if(!c)return[];
  const pt=c.map(i=>[(i%G)+.5,Math.floor(i/G)+.5]);pt[pt.length-1]=[x1,y1];const out=[];let px=x0,py=y0,k=0;
  while(k<pt.length){let j=Math.min(pt.length-1,k+7);while(j>k&&!libero(M,px,py,pt[j][0],pt[j][1]))j--;out.push(pt[j]);px=pt[j][0];py=pt[j][1];k=j+1}return out}
 function vicinoOk(M,x,y){for(let r=0;r<12;r++)for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){const nx=Math.floor(x)+ox,ny=Math.floor(y)+oy;
   if(nx>=0&&ny>=0&&nx<G&&ny<G&&M.ok[ny*G+nx])return[nx+.5,ny+.5]}return[G/2,G/2]}
 // ---------- compagnie ----------
 const rnd=s=>ADADI.gen(s);
 const uomini=p=>p.tr.reduce((a,e)=>a+e.n,0);
 const sani=p=>p.tr.reduce((a,e)=>a+e.n-(e.f||0),0);
 const forza=p=>p.tr.reduce((a,e)=>a+(e.n-(e.f||0))*D.valore(e.t),0)+(p.k==='tu'?12:0);
 const forzaTr=tr=>tr.reduce((a,e)=>a+(e.n-(e.f||0))*D.valore(e.t),0);
 function aggiungi(tr,t,n,xp){if(n<=0)return;const e=tr.find(e=>e.t===t);if(e){e.n+=n;e.xp=(e.xp||0)+(xp||0)}else tr.push({t,n,f:0,xp:xp||0})}
 function togliUomini(tr,t,n){const e=tr.find(e=>e.t===t);if(!e)return 0;const k=Math.min(n,e.n);e.n-=k;e.f=Math.min(e.f||0,e.n);if(e.n<=0)tr.splice(tr.indexOf(e),1);return k}
 const MIX=[['f1',.2],['f2',.24],['t2',.2],['f3',.12],['t3',.08],['c3',.08],['f4',.03],['t4',.02],['c4',.03]];
 function leva(f,punti,r){const tr=[];let tot=0,guardia=0;while(tot<punti&&guardia++<400){let x=r(),a='f1';for(const[k,q]of MIX){if(x<q){a=k;break}x-=q}
   if(f==='pre')a=({f1:'f1',f2:'f2',t2:'t2',f3:'f2',t3:'t2',c3:'c3',f4:'f3',t4:'t2',c4:'c3'})[a];else if(f==='mer')a=({f1:'f3',f2:'f3',t2:'t3',f3:'f3',t3:'t3',c3:'c4',f4:'f4',t4:'t3',c4:'c4'})[a];
   else if(f==='alt'&&(a==='c3'||a==='c4')&&r()<.55)a='a'+a.charAt(1);const id=f+'_'+a;aggiungi(tr,id,1);tot+=D.valore(id)}return tr}
 function nuovaP(s,k,f,nome,x,y,tr,m){const p=Object.assign({id:s.uid++,k,faz:f,nome,x,y,tr,oro:0,mor:60,via:[],ord:null,dentro:-1,ia:{st:'giro',t:0}},m||{});s.p.push(p);return p}
 const part=(s,id)=>s.p.find(p=>p.id===id);
 const TU=s=>s.p[0];
 const giorno=s=>Math.floor(s.t/P.GIORNO)+1;
 const ora=s=>Math.floor(s.t%P.GIORNO/60);
 const notte=s=>{const o=ora(s);return o>=21||o<5};
 const L=(s,tx,tipo)=>{s.log.push({t:s.t,tx,tipo:tipo||''});if(s.log.length>60)s.log.shift();s.ev.push({t:'log',tx,tipo:tipo||''})};
 // ---------- guerra, pace, amicizie ----------
 const chiave=(a,b)=>a<b?a+'|'+b:b+'|'+a;
 const inGuerra=(s,a,b)=>!!s.guerra[chiave(a,b)];
 // alleanze (V3): s.alleanza[chiave] = {da: giorno di firma, rompe: giorno in cui finisce (0 = nessun preavviso)}; un regno ha al massimo un alleato.
 // Assente (salvataggi più vecchi) = nessuna. Guerra e alleanza non convivono mai.
 const alleate=(s,a,b)=>!!(s.alleanza&&s.alleanza[chiave(a,b)]);
 function alleatoDi(s,f){for(const k in s.alleanza||{}){const x=k.split('|');if(x[0]===f)return x[1];if(x[1]===f)return x[0]}return null}
 // la fazione vista da fuori: chi serve un regno ne porta i colori
 const lato=s=>s.servizio?s.servizio.faz:'tu';
 // regno (V4): con la corona la fazione 'tu' è un regno tra gli altri (nome e stendardo suoi); senza, tutto come prima
 const fazioni=s=>s.corona?D.REGNI.concat(['tu']):D.REGNI;
 const viva=(s,f)=>f==='tu'?!!s.corona:!s.cadute[f];
 const nomeF=(s,f,lungo)=>f==='tu'&&s.corona?s.corona.nome:lungo?D.FAZ[f].nome:D.FAZ[f].breve;
 const colFaz=(s,f)=>{if(f==='tu'&&s.corona){const t=D.REGNO.STENDARDI[s.corona.stend]||D.REGNO.STENDARDI[0];return{col:t.col,col2:t.col2}}const x=D.FAZ[f]||D.FAZ.neu;return{col:x.col,col2:x.col2}};
 // la cultura delle truppe di un signore: quella d'origine se è passato a un altro stendardo
 const cultura=(s,p)=>(s.sig[p.sig]||{}).cult||p.faz;
 function nemiche(s,fa,fb){if(fa===fb)return false;if(fa==='pre'||fb==='pre')return true;if(fa==='mer'||fb==='mer')return false;
  if(fa==='tu'||fb==='tu'){const f=fa==='tu'?fb:fa;if(s.corona)return inGuerra(s,'tu',f);if(s.servizio){if(s.servizio.faz===f)return false;if(inGuerra(s,s.servizio.faz,f))return true}return(s.rel[f]||0)<=-25}
  return inGuerra(s,fa,fb)}
 const ostile=(s,a,b)=>nemiche(s,a.faz,b.faz);
 function relaz(s,f,d){if(!(f in s.rel))return;s.rel[f]=Math.max(-100,Math.min(100,s.rel[f]+d))}
 // forza di un regno: guarnigioni (con le mura) e compagnie dei suoi signori; il dominante è chi tiene troppo (quota di luoghi dei regni o di forza)
 const forzaRegno=(s,f)=>s.l.filter(l=>l.faz===f).reduce((x,l)=>x+forzaTr(l.g)*(MURA[l.tipo]?P.MURA:1),0)+s.p.filter(p=>p.k==='sig'&&p.faz===f).reduce((x,p)=>x+forza(p),0)+(f==='tu'?forza(TU(s)):0);
 function dominante(s){const vivi=fazioni(s).filter(f=>viva(s,f));if(vivi.length<3)return null;const nl=vivi.map(f=>s.l.filter(l=>l.faz===f).length),fr=vivi.map(f=>forzaRegno(s,f)),tl=nl.reduce((a,b)=>a+b,0),tf=fr.reduce((a,b)=>a+b,0);let m=null,mq=0;
  vivi.forEach((f,i)=>{const q=Math.max(tl?nl[i]/tl:0,tf?fr[i]/tf:0);if(q>mq){mq=q;m=f}});return mq>=D.DIPL.QUOTA_DOM?{f:m,quota:mq}:null}
 const guerreDi=(s,f)=>fazioni(s).filter(x=>x!==f&&viva(s,x)&&inGuerra(s,f,x)).length;
 // la proposta di chi gioca al re `a` riguardo al regno `b` ('pace' | 'alleanza' | 'guerra' | 'rompi'): un conto con i fattori in chiaro, lo stesso che usa `fai`.
 // Ritorna {tipo,a,b,f:[{n,v}],tot,ok} oppure {err}. Non tira dadi e non tocca lo stato.
 function proposta(s,tipo,a,b){const X=D.DIPL,sov=b==='tu'&&!!s.corona&&!s.servizio,srv=sov?{faz:'tu',tipo:'re'}:s.servizio;
  if(!srv)return{err:'Un capitano senza bandiera non ha voce presso i re'};
  if(sov&&(tipo==='guerra'||tipo==='rompi'))return{err:'Per la guerra e per le rotture usa le tue azioni'};
  if(!X.BASE.hasOwnProperty(tipo)&&tipo!=='rompi')return{err:'Proposta sconosciuta'};
  if(!D.REGNI.includes(a)||!(D.REGNI.includes(b)||sov)||a===b)return{err:'Regno sconosciuto'};
  if(!sov&&srv.faz!==a)return{err:'Parli per chi servi: qui non hai voce'};
  if(!sov&&srv.tipo==='mer'&&tipo!=='pace')return{err:'Un mercenario a contratto può chiedere solo la pace'};
  if(s.cadute[a]||(!sov&&s.cadute[b]))return{err:'Quel regno è caduto'};
  if(s.parola&&s.parola[a]>giorno(s))return{err:D.FAZ[a].re+' ti riceverà di nuovo il giorno '+s.parola[a]};
  const guerra=inGuerra(s,a,b),al=alleate(s,a,b);
  if(tipo==='pace'&&!guerra)return{err:'Non siete in guerra con '+nomeF(s,b)};
  if(tipo==='alleanza'){if(guerra)return{err:'Prima la pace: con '+nomeF(s,b)+' siete in guerra'};if(al)return{err:'Siete già alleati'};if(alleatoDi(s,a)||alleatoDi(s,b))return{err:'Uno dei due ha già un alleato'}}
  if(tipo==='guerra'){if(guerra)return{err:'Siete già in guerra'};if(al)return{err:'Sono vostri alleati: rompete prima l\'alleanza'}}
  if(tipo==='rompi'){if(!al)return{err:'Non siete alleati'};if(s.alleanza[chiave(a,b)].rompe)return{err:'La rottura è già annunciata'};return{tipo,a,b,f:[],tot:0,ok:true}}
  const peso=X.PESO[srv.tipo],f=[],aggiungi=(n,v)=>{v=Math.round(v*10)/10;if(v)f.push({n,v})},re=s.sig.find(x=>x.faz===a&&x.re),tr=D.TRATTI[re&&re.tratto];
  aggiungi(tipo==='pace'?'Il re non ha nulla da perdere':'Diffidenza del re',X.BASE[tipo]);
  aggiungi('Amicizia col regno',peso*s.rel[a]/X.AMICIZIA);
  aggiungi('Fama della compagnia',peso*Math.min(s.fama,X.FAMA_MAX)/X.FAMA);
  if(!sov)aggiungi('Opinione di '+nomeF(s,b)+' su di te',(tipo==='guerra'?-1:1)*peso*s.rel[b]/(2*X.AMICIZIA));
  if(tr&&tr.dipl)aggiungi('Indole del re ('+tr.nome+')',tr.dipl[tipo]);
  const fa=forzaRegno(s,a),fb=forzaRegno(s,b),rel=fa+fb>0?(fb-fa)/(fa+fb):0;
  aggiungi(tipo==='guerra'?'Forza relativa: '+(rel<0?'sei più forte':'sei più debole'):'Forza relativa',(tipo==='guerra'?-1:1)*X.FORZA*rel);
  aggiungi(tipo==='pace'?'Stanchezza di guerra':tipo==='guerra'?'Guerre già in corso':'Nemici da fronteggiare',X.GUERRE[tipo]*guerreDi(s,a));
  aggiungi('Diplomazia del capitano',.4*abil(s,'diplomazia'));
  aggiungi('Sostegno dei signori',D.SIG.SOSTEGNO*Math.min(D.SIG.MAX_SOST,s.sig.filter(x=>x.faz===a&&confidenza(s,x)>=3).length));
  const dom=dominante(s);
  if(tipo==='alleanza'){const c=fazioni(s).filter(x=>x!==a&&x!==b&&viva(s,x)&&inGuerra(s,a,x)&&inGuerra(s,b,x)).length;aggiungi('Nemico in comune',X.COMUNE*c);if(dom&&dom.f!==a&&dom.f!==b)aggiungi(nomeF(s,dom.f)+' vince troppo',X.DOMINANTE)}
  if(tipo==='guerra'&&dom&&dom.f===b)aggiungi(nomeF(s,b)+' vince troppo',X.DOMINANTE);
  const tot=Math.round(f.reduce((x,y)=>x+y.v,0)*10)/10;return{tipo,a,b,f,tot,ok:tot>=0}}
 // ---------- nuovo mondo ----------
 const nuovoCap=nome=>({nome:String(nome).slice(0,20),liv:1,xp:0,punti:1,ab:{prodezza:0,comando:0,addestra:0,medicina:0,commercio:0,esplora:0,carisma:0,diplomazia:0,cavaliere:0},eq:{arma:'spada',scudo:null,armatura:'giaco',elmo:null,cavallo:'ronzino',cimeli:[null,null]}});
 // i capitani: il primo guida la compagnia, i soci (partite in compagnia) gli stanno a fianco. posto 0 = s.cap
 // `attivi` (ripresa con meno giocatori): i capitani oltre quel numero restano in `soci` ma non scendono in campo; assente = tutti
const capi=s=>{const c=[s.cap].concat(s.soci||[]);return s.attivi>0?c.slice(0,s.attivi):c};
 const capDi=(s,seat)=>capi(s)[seat||0]||null;
 const ogg=id=>D.OGG[id]||null;
 const indossa=c=>[c.eq.arma,c.eq.scudo,c.eq.armatura,c.eq.elmo,c.eq.cavallo].concat(c.eq.cimeli||[]).map(ogg).filter(Boolean);
 // somma di una dote degli oggetti indossati da tutti i capitani (morale, bottino…)
 const somma=(s,k)=>capi(s).reduce((a,c)=>a+indossa(c).reduce((x,o)=>x+(o[k]||0),0),0);
 // il capitano in battaglia: livello, Prodezza e quello che ha addosso
 function statCap(c){const I=indossa(c),S=k=>I.reduce((a,o)=>a+(o[k]||0),0),pr=c.ab.prodezza,arma=ogg(c.eq.arma)||{},cav=ogg(c.eq.cavallo),sc=ogg(c.eq.scudo),ar=ogg(c.eq.armatura)||{},el=ogg(c.eq.elmo);
  return{nome:c.nome,pf:60+c.liv*6+pr*8+S('pf'),att:14+c.liv+pr*2+S('att'),dif:10+Math.floor(c.liv/2)+S('dif'),dan:10+pr*1.5+(arma.dan||0),vel:Math.max(8,(cav?cav.vel:10)+S('vel')-(cav?cav.vel:0)),
   rit:arma.rit||12,perf:arma.perf||0,git:arma.git||0,car:S('car'),cavallo:!!cav,grido:1-Math.min(.6,S('grido')),
   asp:{elmo:el?el.asp:'nuda',arma:arma.asp||'spada',scudo:sc?sc.asp:null,cor:ar.cor||0,mant:1,barda:cav&&cav.barda?1:0,manto:cav?cav.manto||0:0}}}
 function prezzoOgg(s,o,verso){const c=abil(s,'commercio'),b=Math.max(20,o.prezzo);return Math.round(verso>0?b*(1.1-c*.02):b*.4*(1+c*.03))}
 function nuovo(seme,o){o=o||{};seme=ADADI.u32(seme||1);const M=mappa(seme);
  const s={v:2,seme,rng:ADADI.semina(seme),t:8*60,uid:0,nome:o.compagnia||'Compagnia della Ventura',p:[],l:[],sig:[],guerra:{},alleanza:{},rel:{},servizio:null,incontro:null,
   dentro:-1,davanti:-1,assedio:null,scontri:[],prig:[],incarichi:[],log:[],ev:[],fama:0,slancio:0,stat:{vinte:0,perse:0,uccisi:0,covi:0,rovine:0},prigioniero:null,rotta:0,tregua:0,cadute:{},over:null,meteo:'sereno',
   cap:nuovoCap(o.nome||'Capitano'),soci:(o.soci||[]).slice(0,3).map(x=>nuovoCap(x&&x.nome||'Capitano'))};
  for(const f of D.REGNI)s.rel[f]=0;
  const r=rnd(s);
  // la tua compagnia parte accanto a un villaggio del regno scelto (o a caso)
  const f0=D.REGNI.includes(o.regno)?o.regno:D.REGNI[Math.floor(r()*D.REGNI.length)],vil=M.luoghi.filter(l=>l.faz===f0&&l.tipo==='villaggio')[0]||M.luoghi[0];
  const v0=vicinoOk(M,vil.x+2.6,vil.y+2.2);
  const ns=s.soci.length,tu=nuovaP(s,'tu','tu',s.nome,v0[0],v0[1],[{t:f0+'_f1',n:5+ns*3,f:0,xp:0},{t:f0+'_f2',n:2+ns,f:0,xp:0}],{oro:P.ORO0+ns*140,merci:{grano:6+ns*3,carne:2+ns},zaino:[]});tu.ia=null;
  // luoghi
  const tesori=D.BOTTINO_ROVINE;
  for(const b of M.luoghi){const l={id:b.id,nome:b.nome,tipo:b.tipo,faz:b.faz,x:b.x,y:b.y,capo:b.capo,k:b.k,sig:-1,prosp:45+Math.floor(r()*30),rel:0,g:[],rec:0,sacc:0,ass:null,scorte:{},merc:[],inc:null,bott:[],noto:!SITO[b.tipo]};
   if(MURA[b.tipo])l.g=leva(b.faz,b.tipo==='citta'?300:170,r);
   if(b.tipo==='villaggio')l.rec=3+Math.floor(r()*4);
   if(MERCATO[b.tipo]){const prod=D.PRODUCE[b.faz];for(const m of Object.keys(D.MERCI)){const mio=prod.includes(m)||(b.tipo==='porto'&&m==='pesce'),cibo=D.MERCI[m].cibo;
     l.scorte[m]=Math.floor((mio?55:cibo?(b.tipo==='citta'?30:45):14)*(.7+r()*.6))}}
   if(b.tipo==='covo'){const cb=D.CAPIBANDA[b.k%D.CAPIBANDA.length];l.g=leva('pre',100+b.k*20+r()*30,r);aggiungi(l.g,cb.id,1);l.boss=cb.id;l.tesoro=cb.premio}
   if(b.tipo==='rovine'){l.g=leva('pre',55+b.k*15+r()*30,r);l.tesoro=tesori[b.k%tesori.length]}
   if(b.tipo==='monastero')l.oste=D.NOMI.abati[b.k%D.NOMI.abati.length];if(b.tipo==='locanda')l.oste=D.NOMI.osti[b.k%D.NOMI.osti.length];
   if(b.tipo==='citta')l.unica=D.UNICA[b.faz]||null;
   s.l.push(l)}
  // signori: il primo di ogni regno è il sovrano e tiene la città, gli altri un castello a testa. Ognuno ha il suo tratto
  D.REGNI.forEach((f,fi)=>{const mura=s.l.filter(l=>l.faz===f&&MURA[l.tipo]);D.NOMI.signori[f].forEach((nome,k)=>{const casa=mura[k%mura.length],sg={id:s.sig.length,nome,faz:f,casa:casa.id,pid:-1,prig:null,torna:0,re:k===0,tratto:D.TRATTI_ID[(k+fi*2)%D.TRATTI_ID.length],mem:{lib:0,sconf:0,trad:0,fav:0,g:-99}};
    s.sig.push(sg);if(casa.sig<0)casa.sig=sg.id;const p=nuovaP(s,'sig',f,nome,casa.x,casa.y,leva(f,(k===0?150:95)+r()*40,r),{oro:400,sig:sg.id,dentro:casa.id});sg.pid=p.id})});
  for(const l of s.l)if(!MURA[l.tipo]&&l.capo>=0)l.sig=s.l[l.capo].sig;
  // guerre di partenza: due, a caso
  {const cop=[];for(let i=0;i<D.REGNI.length;i++)for(let j=i+1;j<D.REGNI.length;j++)cop.push(chiave(D.REGNI[i],D.REGNI[j]));for(let k=0;k<2;k++)s.guerra[cop.splice(Math.floor(r()*cop.length),1)[0]]=true}
  // predoni, carovane, la rivale
  for(let k=0;k<9;k++)VEN.nascePredoni(s,r);for(const l of s.l)if(l.tipo==='citta'||l.tipo==='porto')VEN.nasceCarovana(s,l,r);
  {const c=s.l.filter(l=>l.tipo==='citta')[Math.floor(r()*D.REGNI.length)],v=vicinoOk(M,c.x+3,c.y+2),tr=leva('mer',120,r);aggiungi(tr,D.RIVALE.id,1);nuovaP(s,'riv','mer',D.RIVALE.compagnia,v[0],v[1],tr,{oro:500})}
  for(const l of s.l){rinnova(s,l,r)}
  s.compagni={};s.grad={};s.lettere={};s.debiti=[];{const conta={};for(const c of D.COMPAGNI){const posti=s.l.filter(l=>l.tipo===c.dove);conta[c.dove]=(conta[c.dove]||0)+1;s.compagni[c.id]=posti.length?posti[(conta[c.dove]*3+c.costo)%posti.length].id:-2}}
  voceInit(s);L(s,'La compagnia leva le tende presso '+vil.nome+'.');s.ev=[];return s}
 // chi arriva da un salvataggio del mondo piccolo (v1) porta capitano, uomini e monete nel mondo nuovo
 function migra(v){const a=v.p[0],f0=((a.tr[0]||{}).t||'val_f1').slice(0,3),s=nuovo(v.seme,{nome:v.cap.nome,compagnia:v.nome,regno:f0}),tu=TU(s),c=s.cap,o=v.cap,feudi=v.l.filter(l=>l.faz==='tu'||l.sig===-2).length;
  tu.tr=a.tr.filter(e=>D.TR[e.t]);tu.oro=a.oro+feudi*400;tu.merci=a.merci||{};tu.mor=a.mor;s.fama=v.fama;s.stat.vinte=v.stat.vinte;s.stat.perse=v.stat.perse;
  c.liv=o.liv;c.xp=o.xp;c.punti=o.punti;c.ab=Object.assign({},c.ab,o.ab);c.eq.arma=['spada','bastarda','spadone','u_condottieri'][o.eq.arma]||'spada';c.eq.armatura=['giaco','maglia','piastre','u_margravio'][o.eq.armatura]||'giaco';c.eq.cavallo=[null,'ronzino','corsiero','destriero'][o.eq.cavallo]||null;
  for(const f of D.REGNI)if(v.rel[f]!=null)s.rel[f]=v.rel[f];for(const e of tu.tr)if(D.TR[e.t].compagno)s.compagni[e.t]=-1;
  L(s,'La compagnia varca i vecchi confini: il mondo è più grande di come lo ricordava.','bene');s.ev=[];return s}
 // offerte del luogo: mercenari in taverna e incarichi
 function rinnova(s,l,r){const pesca=(a,n)=>{const c=a.slice(),o=[];while(o.length<n&&c.length)o.push(c.splice(Math.floor(r()*c.length),1)[0]);return o},g=giorno(s);
  if(OSTERIA[l.tipo]){l.merc=[];const tipi=['mer_f3','mer_t3','mer_c4'];for(let k=0;k<(l.tipo==='citta'?2:1);k++)aggiungi(l.merc,tipi[Math.floor(r()*3)],1+Math.floor(r()*(l.tipo==='citta'?5:3)))}
  if(l.tipo==='citta')l.bott=pesca(D.BOTTEGA[D.REGNI.includes(l.faz)?l.faz:M0(s,l)],4).concat(pesca(D.COMUNI,3));
  else if(l.tipo==='porto')l.bott=pesca(['cannocchiale','borsa','corno','stocco','sciabola','piumato','dadi','brocchiere'],3);
  else if(l.tipo==='monastero')l.bott=pesca(['bisaccia','stendardo','trattato','cuoio','mazza'],2);
  else if(l.tipo==='locanda')l.bott=pesca(D.COMUNI,2);
  if(l.inc&&l.inc.preso)return;const sito=t=>s.l.filter(x=>x.tipo===t&&x.g.length).sort((a,b)=>dist(a,l)-dist(b,l))[0];
  if(l.tipo==='villaggio')l.inc={tipo:'predoni',premio:120+Math.floor(r()*80)+g*2,giorni:6};
  else if(l.tipo==='citta'||l.tipo==='porto'){const altre=s.l.filter(x=>(x.tipo==='citta'||x.tipo==='porto')&&x.id!==l.id&&x.faz!==l.faz),a=altre[Math.floor(r()*altre.length)],beni=D.PRODUCE[D.REGNI.includes(l.faz)?l.faz:M0(s,l)].filter(m=>!D.MERCI[m].cibo),m=beni[Math.floor(r()*beni.length)],n=4+Math.floor(r()*5);
   l.inc=a?{tipo:'consegna',bene:m,n,a:a.id,premio:Math.round(n*D.MERCI[m].base*.9+60+dist(a,l)*4),giorni:12}:null}
  else if(l.tipo==='castello')l.inc={tipo:'reclute',n:4+Math.floor(r()*4),premio:260+Math.floor(r()*120),giorni:12};
  else if(l.tipo==='monastero'){const x=sito('rovine');l.inc=x?{tipo:'reliquia',a:x.id,premio:280+Math.floor(r()*160),giorni:24}:null}
  else if(l.tipo==='locanda'){const x=sito('covo');l.inc=x?{tipo:'taglia',a:x.id,premio:420+Math.floor(r()*200),giorni:30}:null}
  else l.inc=null}
 // ---------- numeri della compagnia ----------
 const abil=(s,k)=>capi(s).reduce((m,c)=>Math.max(m,c.ab[k]),0)+capi(s).reduce((a,c)=>a+indossa(c).reduce((x,o)=>x+(o.ab&&o.ab[k]||0),0),0)+TU(s).tr.reduce((a,e)=>a+(D.TR[e.t].compagno===k&&e.n-(e.f||0)>0?(s.grad&&s.grad[e.t]&&s.grad[e.t].piu?3:2):0),0);
 const limite=s=>P.CAPIENZA+abil(s,'comando')*5+Math.floor(s.fama/20)+(s.soci?s.soci.length*6:0);
 const limitePrig=s=>6+abil(s,'comando')*3;
 const razioni=p=>Object.keys(p.merci||{}).reduce((a,m)=>a+(D.MERCI[m].cibo?p.merci[m]:0),0);
 const carico=p=>Object.keys(p.merci||{}).reduce((a,m)=>a+p.merci[m],0);
 const caricoMax=s=>30+uomini(TU(s))*2+capi(s).reduce((a,c)=>a+(c.eq.cavallo?12:0),0);
 const paga=s=>TU(s).tr.reduce((a,e)=>a+e.n*D.TR[e.t].paga*2,0)+s.l.reduce((a,l)=>a+(l.faz==='tu'?Math.ceil(forzaTr(l.g)*.12):0),0);
 const xpLiv=l=>60*l*(l+1)/2;
 function velocita(s,p){const M=mappa(s.seme),i=cella(M,p.x,p.y),n=uomini(p);let cav=0;for(const e of p.tr)if(D.TR[e.t].c==='c')cav+=e.n;
  let v=P.VEL-Math.min(1.1,n/90)+(n?cav/n*.7:0);if(p.k==='tu')v+=abil(s,'esplora')*.08+(capi(s).reduce((m,c)=>Math.min(m,(ogg(c.eq.cavallo)||{}).vel||10),99)-10)*.024-Math.max(0,carico(p)-caricoMax(s))*.02;
  if(p.k==='car')v=1.9;if(p.k==='pre')v-=.15;v=Math.max(.8,v)/costo(M,i);if(notte(s))v*=.82;if(s.meteo==='pioggia')v*=.9;return v}
 const vista=s=>(P.VISTA+abil(s,'esplora')*.5)*(notte(s)?.65:1)*(s.meteo==='nebbia'?.6:1);
 function visibili(s){const tu=TU(s),v=vista(s);return s.p.filter(p=>p.id&&p.dentro<0&&dist(p,tu)<=v)}
 // prezzo di una merce in un luogo: sale quando la scorta è bassa. verso = 1 compri, -1 vendi
 function prezzo(s,l,m,verso){const sc=l.scorte[m]||0,k=Math.max(.45,Math.min(2.1,1.9-1.2*sc/60)),c=abil(s,'commercio');
  return Math.max(1,Math.round(D.MERCI[m].base*k*(verso>0?1.12-c*.02:.88+c*.02)))}
 // ---------- ordini ----------
 function ordina(s,o){if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};const tu=TU(s),M=mappa(s.seme);if(s.incontro)return{err:'Prima decidi cosa fare dell\'incontro'};if(s.prigioniero)return{err:'Sei prigioniero'};if(s.rotta>s.t&&o.t!=='aspetta')return{err:'La compagnia si sta riordinando'};
  if(s.assedio&&o.t!=='aspetta')s.assedio=null;
  s.dentro=-1;s.davanti=-1;
  if(o.t==='ferma'){tu.ord=null;tu.via=[];return{s}}
  if(o.t==='aspetta'){tu.ord={t:'aspetta',fino:s.t+Math.max(1,o.ore||1)*60};tu.via=[];return{s}}
  if(o.t==='vai'){if(!(o.x>=0&&o.y>=0&&o.x<G&&o.y<G))return{err:'Fuori dalla mappa'};const v=via(M,tu.x,tu.y,o.x,o.y);if(!v.length)return{err:'Non c\'è una via fin lì'};tu.ord={t:'vai'};tu.via=v;return{s}}
  if(o.t==='entra'){const l=s.l[o.lid];if(!l)return{err:'Luogo sconosciuto'};const v=via(M,tu.x,tu.y,l.x,l.y);if(!v.length&&dist(tu,l)>.6)return{err:'Non c\'è una via fin lì'};tu.ord={t:'entra',lid:l.id};tu.via=v;return{s}}
  if(o.t==='segui'){const p=part(s,o.pid);if(!p||p.dentro>=0)return{err:'Non si vede più'};tu.ord={t:'segui',pid:p.id,n:0};tu.via=via(M,tu.x,tu.y,p.x,p.y);return{s}}
  return{err:'Ordine sconosciuto'}}
 function muovi(s,p){if(!p.via.length)return false;const v=velocita(s,p)/60,ox=p.x,oy=p.y;let resto=v;
  while(resto>0&&p.via.length){const w=p.via[0],d=d2p(p.x,p.y,w[0],w[1]);if(d<=resto){p.x=w[0];p.y=w[1];p.via.shift();resto-=d}else{p.x+=(w[0]-p.x)/d*resto;p.y+=(w[1]-p.y)/d*resto;resto=0}}
  if(!passa(mappa(s.seme),p.x,p.y)){p.x=ox;p.y=oy;p.via=[]}return true}
 // ---------- il tempo ----------
 function passo(s,n){s.ev=[];const M=mappa(s.seme),tu=TU(s);n=n||1;
  for(let k=0;k<n;k++){if(s.incontro||s.over)break;if(s.rac&&s.rac.scena)break;
   if(s.voci&&s.voci.length&&s.dentro<0&&s.davanti<0&&avviaVoce(s))break;
   if(s.dentro>=0||s.davanti>=0){if(!(tu.ord&&tu.ord.t==='aspetta'))break}
   s.t++;
   // chi gioca
   if(s.prigioniero){if(s.t>=s.prigioniero.fino)libera(s)}
   else if(tu.ord){const o=tu.ord;
    if(o.t==='aspetta'){if(s.t>=o.fino){tu.ord=null;s.ev.push({t:'fine-attesa'})}}
    else{if(o.t==='segui'){const b=part(s,o.pid);if(!b||b.dentro>=0||dist(b,tu)>vista(s)+2){tu.ord=null;tu.via=[]}else if(++o.n%12===0||!tu.via.length)tu.via=via(M,tu.x,tu.y,b.x,b.y)}
     muovi(s,tu);
     if(tu.ord&&!tu.via.length){if(o.t==='entra'){const l=s.l[o.lid];tu.ord=null;if(dist(tu,l)<.8)arriva(s,l)}else if(o.t==='vai')tu.ord=null}}}
   // gli altri
   for(const p of s.p){if(p.id===0)continue;if(p.dentro<0&&!p.fermo)muovi(s,p);if((s.t+p.id*7)%20===0)VEN.pensa(s,p,M)}
   if(!s.prigioniero)contatti(s);
   if(s.t%P.ORA===0)VEN.oraNuova(s);
   if(s.t%P.GIORNO===0)VEN.giornoNuovo(s)}
  return s.ev}
 function arriva(s,l){const tu=TU(s);tu.via=[];if(l.faz!=='tu'&&nemiche(s,'tu',l.faz)){s.davanti=l.id;s.ev.push({t:'davanti',lid:l.id})}else{s.dentro=l.id;s.ev.push({t:'dentro',lid:l.id});avanzaInc(s,'arriva',l)}}
 // scontri a vista: predoni e nemici che ti raggiungono, o che raggiungi tu
 function contatti(s){const tu=TU(s);if(s.dentro>=0||s.rotta>s.t)return;
  for(const sc of s.scontri)if(d2p(tu.x,tu.y,sc.x,sc.y)<.8&&tu.ord&&!sc.visto){sc.visto=true;tu.ord=null;tu.via=[];s.incontro={tipo:'mischia',sc:sc.id};s.ev.push({t:'incontro'});return}
  for(const p of s.p){if(p.id===0||p.dentro>=0||p.sc)continue;const d=dist(p,tu);if(d>P.CONTATTO)continue;const cerco=tu.ord&&tu.ord.t==='segui'&&tu.ord.pid===p.id;
   if(ostile(s,p,tu)){if(cerco||(p.ia&&p.ia.st==='caccia'&&p.ia.b===0&&!(s.tregua>s.t))){const amici=s.p.filter(q=>q.id&&q.dentro<0&&!q.sc&&q.id!==p.id&&dist(q,tu)<2.2);
      tu.ord=null;tu.via=[];s.incontro={tipo:'nemico',pid:[p.id].concat(amici.filter(q=>ostile(s,q,tu)&&!ostile(s,q,p)).map(q=>q.id)),all:amici.filter(q=>!ostile(s,q,tu)&&ostile(s,q,p)&&q.k==='sig').map(q=>q.id),da:cerco?'tu':'loro'};
      s.ev.push({t:'incontro'});return}}
   else if(cerco){tu.ord=null;tu.via=[];s.incontro={tipo:'parla',pid:[p.id],all:[]};s.ev.push({t:'incontro'});return}}}
 // assalto alle mura da parte di signori
 function assalto(s,l,r){const A=l.ass.pid.map(id=>part(s,id)).filter(Boolean),dentro=s.p.filter(p=>p.dentro===l.id&&p.k==='sig');let fa=A.reduce((x,p)=>x+forza(p),0),fd=(forzaTr(l.g)+dentro.reduce((x,p)=>x+forza(p),0))*P.MURA;const fa0=fa,fd0=fd;
  for(let k=0;k<8&&fa>fa0*.4&&fd>fd0*.3;k++){const qa=.16*fd/(fa+fd)*(.6+r()*.8),qd=.16*fa/(fa+fd)*(.6+r()*.8);for(const p of A)VEN.perdite(p.tr,qa,r);VEN.perdite(l.g,qd,r);for(const p of dentro)VEN.perdite(p.tr,qd,r);
   fa=A.reduce((x,p)=>x+forza(p),0);fd=(forzaTr(l.g)+dentro.reduce((x,p)=>x+forza(p),0))*P.MURA}
  const presa=fd<=fd0*.3&&fa>0,faz=l.ass.faz;l.ass=null;
  if(presa){const capo=A.sort((a,b)=>forza(b)-forza(a))[0];for(const p of dentro)VEN.sconfitta(s,p,faz);conquista(s,l,faz,capo&&capo.k==='sig'?capo.sig:-1);
   if(capo){const meta=capo.tr.filter(e=>e.n>=2);l.g=[];for(const e of meta){const k=Math.floor(e.n*.35);togliUomini(capo.tr,e.t,k);aggiungi(l.g,e.t,k)}}}
  else{L(s,l.nome+' respinge l\'assalto.','guerra');for(const p of A){p.ia.st='casa';p.via=[]}}}
 function conquista(s,l,faz,sigId){const prima=l.faz,persi=prima==='tu'?[l,...s.l.filter(v=>v.capo===l.id&&!MURA[v.tipo])].map(v=>v.sig).filter(x=>x>=0):[];l.faz=faz;l.sig=sigId;l.ass=null;l.rel=0;for(const v of s.l)if(v.capo===l.id&&!MURA[v.tipo]){v.faz=faz;v.sig=sigId}
  L(s,l.nome+' cade: ora è '+(faz==='tu'?'tua':'di '+D.FAZ[faz].breve)+'.','guerra');s.ev.push({t:'conquista',lid:l.id,faz});
  if(prima!=='tu'&&D.REGNI.includes(prima)&&!s.l.some(x=>x.faz===prima&&MURA[x.tipo])){s.cadute[prima]=giorno(s);L(s,D.FAZ[prima].nome+' non ha più mura: il regno è caduto.','guerra');
   for(const sg of s.sig)if(sg.faz===prima){const p=part(s,sg.pid);if(sg.re||!p){if(p)VEN.rimuovi(s,p);sg.pid=-1}else daEsule(s,sg,p)}for(const v of s.l)if(v.faz===prima){v.faz=faz;v.sig=sigId}}
  if(prima==='tu'&&s.corona){if(s.l.some(x=>x.faz==='tu'&&MURA[x.tipo])){const sd=s.l[s.corona.sede];if(!sd||sd.faz!=='tu'){const n=s.l.find(x=>x.faz==='tu'&&MURA[x.tipo]);s.corona.sede=n.id}}else cadeCorona(s)}
  if(prima==='tu'&&s.corona)for(const id of new Set(persi))perdeFeudo(s,id);
  vittoria(s)}
 // un signore senza più regno (o senza feudo) diventa esule: gira da neutrale e dopo ESILIO giorni sparisce, a meno che tu non lo convinca
 function daEsule(s,sg,p){sg.cult=sg.cult||sg.faz;sg.esule=sg.cult;sg.esilio=giorno(s)+D.REGNO.ESILIO;sg.faz='neu';if(p){p.faz='neu';p.dentro=-1;p.via=[];p.ia={st:'esilio',t:0}}}
 // la corona cade con l'ultima fortezza: guerre e alleanze del regno finiscono, i signori diventano esuli, i compagni investiti tornano con te
 function cadeCorona(s){const g=giorno(s),tu=TU(s);L(s,'Cade l\'ultima fortezza: il regno '+s.corona.nome+' è finito.','guerra');s.corona=null;
  for(const k of Object.keys(s.guerra))if(k.split('|').includes('tu'))delete s.guerra[k];for(const k of Object.keys(s.alleanza||{}))if(k.split('|').includes('tu'))delete s.alleanza[k];
  for(const sg of s.sig)if(sg.faz==='tu'||sg.comp){const p=part(s,sg.pid);if(sg.comp){if(p)VEN.rimuovi(s,p);sg.pid=-1;aggiungi(tu.tr,sg.comp,1);s.compagni[sg.comp]=-1;sg.faz='neu';sg.comp=null;sg.esilio=0;sg.esule=null}else daEsule(s,sg,p)}
  for(const l of s.l)if(l.faz==='tu'&&l.sig>=0)l.sig=-1;s.ev.push({t:'corona-cade'})}
 function confinanti(s){return D.REGNI.filter(f=>!s.cadute[f]&&s.l.some(l=>l.faz===f&&s.l.some(m=>m.faz==='tu'&&dist(l,m)<=D.REGNO.CONFINE)))}
 // vittoria: tutte le capitali (le città) in mano tua con la corona, o del tuo re se sei vassallo; si scrive una volta sola e la partita continua
 function vittoria(s){if(s.vinta)return;const cap=s.l.filter(l=>l.tipo==='citta');if(!cap.length)return;let come=null;
  if(s.corona&&cap.every(l=>l.faz==='tu'))come='re';else if(s.servizio&&s.servizio.tipo==='vas'&&cap.every(l=>l.faz===s.servizio.faz))come='vassallo';
  if(!come)return;s.vinta={g:giorno(s),come};L(s,come==='re'?'Tutte le capitali sono tue: '+s.corona.nome+' unifica le terre.':'Il tuo sovrano tiene tutte le capitali: le terre sono unite.','bene');s.ev.push({t:'vittoria',come})}
 // ---------- gradimento dei compagni e memoria dei signori (V6a) ----------
 // I numeri stanno in VDAT.GRAD e VDAT.SIG. Niente dadi: tutto è un conto. s.grad[id]={g,avv,visto}: g 0..100, avv = giorno dell'avviso di partenza, visto = eventi già successi.
 const inCompagnia=s=>D.COMPAGNI.filter(c=>TU(s).tr.some(e=>e.t===c.id&&e.n>0));
 const gradDi=(s,id)=>{if(!s.grad)s.grad={};return s.grad[id]||(s.grad[id]={g:D.GRAD.INIZIO,avv:0,visto:[]})};
 const memSig=sg=>sg.mem||(sg.mem={lib:0,sconf:0,trad:0,fav:0,g:-99});
 const limita=v=>Math.max(0,Math.min(100,v));
 // un salvataggio v2 precedente alla scheda: talenti a 0, memoria dei signori, gradimento dei compagni già in compagnia
 function gradApri(s){if(!s.grad)s.grad={};if(!s.lettere)s.lettere={};if(!s.debiti)s.debiti=[];
  for(const c of [s.cap].concat(s.soci||[]))for(const k of ['carisma','diplomazia','cavaliere'])if(c.ab[k]==null)c.ab[k]=0;
  for(const sg of s.sig)memSig(sg);for(const c of inCompagnia(s))gradDi(s,c.id)}
 function umore(g){return g>=D.GRAD.FIDO?'fedele':g>=55?'contento':g>=35?'tranquillo':g>=D.GRAD.PARLA?'scontento':'in bilico'}
 // un evento di cronaca: chi lo ama sale, chi lo detesta scende (con Carisma più su e meno giù). Il servizio presso un regno pesa SERVE/NONSERVE.
 function reagisci(s,ev){const G=D.GRAD,car=abil(s,'carisma'),servi=ev.slice(0,6)==='servi_';
  for(const c of inCompagnia(s)){const ama=c.ama.includes(ev),odia=c.odia.includes(ev);if(!ama&&!odia)continue;const gr=gradDi(s,c.id);if(!gr.visto.includes(ev))gr.visto.push(ev);
   const d=ama?(servi?G.SERVE:G.AMA)*(1+.1*car):(servi?G.NONSERVE:G.ODIA)*Math.max(0,1-.05*car),n=limita(gr.g+Math.round(d));
   if(n!==gr.g){gr.g=n;L(s,c.nome+(ama?' approva.':' non gradisce.'),ama?'bene':'male')}}}
 // il compagno se ne va per sempre, con qualche uomo dei ranghi più bassi; chi aveva intesa con lui ne soffre
 function parte(s,id){const G=D.GRAD,tu=TU(s),c=D.COMPAGNI.find(x=>x.id===id);if(!c)return{err:'Non è un compagno'};if(!tu.tr.some(e=>e.t===id&&e.n>0))return{err:'Non è in compagnia'};
  accoda(s,id.slice(3)+'-addio');togliUomini(tu.tr,id,1);s.compagni[id]=-3;if(s.grad)delete s.grad[id];
  let k=Math.min(G.SEGUONO,Math.floor(uomini(tu)*G.QUOTA)),via=0;
  while(k>0){const e=tu.tr.filter(x=>!D.TR[x.t].compagno&&x.n>0).sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t)[0];if(!e)break;togliUomini(tu.tr,e.t,1);k--;via++}
  for(const x of inCompagnia(s))if(x.lega&&x.lega.id===id&&x.lega.n>0){const gr=gradDi(s,x.id);gr.g=limita(gr.g+G.LUTTO)}
  L(s,c.nome+' lascia la compagnia'+(via?' e porta con sé '+via+' uomini.':'.'),'male');s.ev.push({t:'compagno',id,via:1});return{s}}
 // ogni giorno: chi sta male lo dice, poi se ne va
 function addii(s){const G=D.GRAD,g=giorno(s);
  for(const c of inCompagnia(s)){const gr=gradDi(s,c.id);if(gr.g<=G.VIA){parte(s,c.id);continue}
   if(gr.g<G.PARLA){if(!gr.avv){gr.avv=g;L(s,c.nome+' vuole parlarti: così non resta.','male');accoda(s,c.id.slice(3)+'-lamento')}else if(g-gr.avv>=G.GIORNI)parte(s,c.id)}else gr.avv=0}}
 // giorno di paga: pagati +PAGA, in ritardo è un evento; servizio presso un regno; legami con chi è in compagnia
 function gradPaga(s,pagato){const G=D.GRAD,ci=inCompagnia(s);if(!ci.length)return;
  if(pagato)for(const c of ci){const gr=gradDi(s,c.id);gr.g=limita(gr.g+G.PAGA)}else reagisci(s,'pagatardi');
  if(s.servizio&&D.REGNI.includes(s.servizio.faz))reagisci(s,'servi_'+s.servizio.faz);
  for(const c of ci)if(c.lega&&ci.some(x=>x.id===c.lega.id)){const gr=gradDi(s,c.id);gr.g=limita(gr.g+(c.lega.n>0?G.INTESA:G.ANTIPATIA))}}
 // ---------- dialoghi (V6b) ----------
 // Le scene stanno in VVOC (28ja) e girano nel motore di racconto ARAC (27q): qui sta ciò che le lega al mondo. Se i due file non sono caricati non succede nulla.
 // s.rac = stato del racconto · s.voci = scene in coda [{id,sig?}] · s.vsig = signore della scena aperta (-1 nessuno) · s.volpe = {tappa, coda, dono}.
 // Il gradimento resta di s.grad: la scena legge i fatti copiati in bandiere (fattiVoci) e scrive solo con gli effetti `ven` (EFF_VOCI) e `oro`.
 const RAC=()=>typeof ARAC!=='undefined'?ARAC:(typeof require!=='undefined'?require('./27q-avv-racconto.js'):null);
 const VOC=()=>typeof VVOC!=='undefined'?VVOC:(typeof require!=='undefined'?require('./28ja-ven-voci.js'):null);
 const EFF_VOCI=['grad','via','passo','premio','scontro','conf','tappa'];
 function voceInit(s){const R=RAC();if(!s.rac&&R)s.rac=R.nuovo('ventura',s.seme);if(!s.voci)s.voci=[];if(!s.volpe)s.volpe={tappa:0};if(s.vsig==null)s.vsig=-1}
 // un salvataggio più vecchio non rivive le tappe già passate della rivale
 function vociApri(s){const nuova=!s.volpe;voceInit(s);if(nuova){s.volpe.tappa=D.VOLPE.GIORNI.filter(x=>x<giorno(s)).length;if(s.rivVinta)s.volpe.dono=1}}
 function accoda(s,id,sig){const V=VOC();if(!V||!s.voci||!V.scene[id]||s.voci.some(x=>x.id===id&&x.sig===sig)||(s.rac&&s.rac.scena&&s.rac.scena.id===id))return false;
  if(s.voci.length>=12)return false;s.voci.push(sig==null?{id}:{id,sig});return true}
 function fattiVoci(s){const b={},ci=inCompagnia(s);for(const c of D.COMPAGNI){const k=c.id.slice(3),gr=(s.grad||{})[c.id];b['grad-'+k]=gr?gr.g:0;b['inc-'+k]=gr?gr.inc|0:0;b['con-'+k]=ci.includes(c)?1:0}
  for(const f of D.REGNI)b['serve-'+f]=s.servizio&&s.servizio.faz===f?1:0;b.fama=s.fama|0;b.tappa=(s.volpe||{}).tappa|0;b.giorno=giorno(s);return b}
 const ctxVoci=s=>({oro:TU(s).oro,giorno:giorno(s),eroi:[]});
 const statoRac=s=>Object.assign({},s.rac,{bandiere:Object.assign({},s.rac.bandiere,fattiVoci(s))});
 // la scena aperta, come la mostra la vista (null se nessuno parla)
 function voce(s){const R=RAC(),V=VOC();if(!R||!V||!s.rac||!s.rac.scena)return null;const v=R.vista(statoRac(s),V,ctxVoci(s));if(!v)return null;
  const sg=s.vsig>=0?s.sig[s.vsig]:null,nome=sg?sg.nome:'il signore',sub=x=>String(x).replace(/\{signore\}/g,nome).replace(/\{capitano\}/g,s.cap.nome);
  v.testo=sub(v.testo);if(v.chi.id==='signore')v.chi=Object.assign({},v.chi,{nome:sg?sg.nome:'Il signore'});for(const c of v.scelte)c.t=sub(c.t);return v}
 // avvia la prima scena in coda che esiste (le altre si scartano); il tempo si ferma finché non è chiusa
 function avviaVoce(s){const R=RAC(),V=VOC();if(!R||!V||!s.rac)return false;
  while(s.voci.length){const q=s.voci.shift();if(!V.scene[q.id]){if(/^volpe-/.test(q.id))s.volpe.coda=0;continue}
   const r=R.act(statoRac(s),{t:'avvia',id:q.id},V,ctxVoci(s));if(r.err)continue;
   const x=chiudiAtto(s,r);if(x.err)continue;s.vsig=q.sig==null?-1:q.sig;s.ev.push({t:'voce'});avanzaInc(s,'scena');return true}
  return false}
 // risposta del giocatore: {t:'scegli',i} | {t:'continua'}
 function parla(s,a){const R=RAC(),V=VOC();if(!R||!V||!s.rac||!s.rac.scena)return{err:'Nessuno ti sta parlando'};
  if(!a||(a.t!=='scegli'&&a.t!=='continua'))return{err:'Risposta non valida'};
  const r=R.act(statoRac(s),a,V,ctxVoci(s));if(r.err)return{err:r.err};const x=chiudiAtto(s,r);return x.err?x:{s}}
 // applica un atto del racconto: prima si controllano tutti gli effetti (o non cambia nulla), poi lo stato e gli effetti sul mondo
 function chiudiAtto(s,r){for(const e of r.fuori||[])if(!(e.t==='oro'||(e.t==='ven'&&EFF_VOCI.includes(e.k))))return{err:'Effetto sconosciuto'};
  s.rac=r.s;for(const k of Object.keys(fattiVoci(s)))delete s.rac.bandiere[k];for(const e of r.fuori||[])applicaVoce(s,e);
  if(!s.rac.scena){s.vsig=-1;if(s.volpe.coda){s.volpe.tappa=Math.max(s.volpe.tappa,s.volpe.coda);s.volpe.coda=0}}return{s}}
 function applicaVoce(s,e){const tu=TU(s);
  if(e.t==='oro'){tu.oro=Math.max(0,tu.oro+(e.n|0));return}
  const c=D.COMPAGNI.find(x=>x.id===e.id);
  switch(e.k){
   case'grad':if(c&&inCompagnia(s).includes(c)){const gr=gradDi(s,c.id);gr.g=limita(gr.g+(e.n|0))}return;
   case'via':if(c)parte(s,c.id);return;
   case'passo':if(c&&c.inc&&inCompagnia(s).includes(c)){const gr=gradDi(s,c.id);if((gr.inc|0)<c.inc.length&&!gr.incA)gr.incA=(gr.inc|0)+1}return;
   case'premio':if(e.id==='rv_volpe'){if(!s.volpe.dono){s.volpe.dono=2;if(D.OGG[D.RIVALE.premio])tu.zaino.push(D.RIVALE.premio);L(s,'La Volpe Rossa ti lascia la sua cavalla.','bene')}}else if(c)premioComp(s,c);return;
   case'scontro':{const rv=s.p.find(p=>p.k==='riv');if(rv&&!s.incontro){rv.dentro=-1;rv.sc=0;tu.ord=null;tu.via=[];s.incontro={tipo:'nemico',pid:[rv.id],all:[],da:'tu'};s.ev.push({t:'incontro'})}return}
   case'conf':{const sg=s.vsig>=0?s.sig[s.vsig]:null;if(sg){memSig(sg).fav+=e.n|0;confSig(s,sg)}return}
   case'tappa':s.volpe.tappa++;s.volpe.coda=0;return}}
 function premioComp(s,c){if(!c.premio||!inCompagnia(s).includes(c))return;const gr=gradDi(s,c.id);if(gr.prem)return;gr.prem=1;
  if(c.premio.ogg&&D.OGG[c.premio.ogg])TU(s).zaino.push(c.premio.ogg);if(c.premio.abil)gr.piu=1;L(s,c.nome+(c.premio.ogg&&D.OGG[c.premio.ogg]?' ti dona '+D.OGG[c.premio.ogg].nome+'.':' ti ripaga: il suo aiuto conta di più.'),'bene')}
 // un signore che ti conosce di più ha qualcosa da dirti (una volta per livello)
 function confSig(s,sg){const l=confidenza(s,sg),m=memSig(sg);if(l>(m.vl|0)&&accoda(s,'sig-'+sg.tratto+'-'+l,sg.id))m.vl=l}
 // un passo dell'incarico personale è compiuto? ev: arriva (luogo) · vinci (compagnia nemica) · sito (luogo ripulito) · scena (inizio di una scena)
 function avanzaInc(s,ev,x){if(!s.grad)return;
  for(const c of inCompagnia(s)){const gr=s.grad[c.id];if(!c.inc||!gr||!gr.incA)continue;const p=c.inc[gr.incA-1],tu=TU(s);let ok=false;
   if(p.tipo==='luogo')ok=ev==='arriva'&&(!p.tipoL||x.tipo===p.tipoL)&&(!p.faz||x.faz===p.faz);
   else if(p.tipo==='vinci')ok=ev==='vinci'&&x.k===p.k&&(!p.faz||x.faz===p.faz);
   else if(p.tipo==='sito')ok=ev==='sito'&&x.tipo===p.tipoL;
   else if(p.tipo==='porta'&&((ev==='scena'&&!p.tipoL)||(ev==='arriva'&&(!p.tipoL||x.tipo===p.tipoL)))){ok=p.oro?tu.oro>=p.oro:(tu.merci[p.m]||0)>=p.n;if(ok){if(p.oro)tu.oro-=p.oro;else tu.merci[p.m]-=p.n}}
   if(!ok)continue;gr.inc=gr.incA;gr.incA=0;L(s,c.nome+' ha compiuto un passo: '+p.d,'bene');
   if(gr.inc>=c.inc.length)premioComp(s,c);else accoda(s,c.id.slice(3)+'-inc-'+(gr.inc+1))}}
 // ogni giorno: chi è fedele ti racconta il suo incarico; la rivale ti raggiunge ai giorni di VDAT.VOLPE
 function vociDelGiorno(s){if(!s.voci)return;const g=giorno(s),tu=TU(s);
  for(const c of inCompagnia(s)){const gr=gradDi(s,c.id);if(c.inc&&!gr.invito&&!gr.inc&&!gr.incA&&gr.g>=D.GRAD.FIDO&&accoda(s,c.id.slice(3)+'-inc-1'))gr.invito=1}
  const T=s.volpe.tappa,V=VOC();
  if(V&&!s.prigioniero&&!s.volpe.coda&&T<D.VOLPE.GIORNI.length&&g>=D.VOLPE.GIORNI[T]&&V.scene['volpe-'+(T+1)]){const rv=s.p.find(p=>p.k==='riv');
   if(rv&&!rv.sc){const v=vicinoOk(mappa(s.seme),tu.x+1.5,tu.y+1);rv.x=v[0];rv.y=v[1];rv.via=[];rv.dentro=-1;rv.fermo=s.t+360;rv.ia={st:'giro',t:0};s.volpe.coda=T+1;accoda(s,'volpe-'+(T+1))}}}
 // confidenza di un signore verso chi gioca: 0..3, dalla sua memoria e dall'amicizia col suo regno
 function confidenza(s,sg){const m=memSig(sg),S=D.SIG.SOGLIE,pt=m.lib*3+m.fav*2+Math.floor(Math.max(0,s.rel[sg.faz]||0)/15)-m.sconf*2-m.trad*6;return pt>=S[2]?3:pt>=S[1]?2:pt>=S[0]?1:0}
 // favori di un signore nell'incontro (notizie, lettera, prestito) e il debito da rendere
 function favoreSig(s,sg,v){const S=D.SIG,m=memSig(sg),tu=TU(s),g=giorno(s),vuole=n=>confidenza(s,sg)<n?{err:'Non ti conosce abbastanza'}:null;
  if(v==='rendi'){const i=s.debiti.findIndex(d=>d.sig===sg.id);if(i<0)return{err:'Non gli devi nulla'};const d=s.debiti[i];if(tu.oro<d.oro)return{err:'Servono '+d.oro+' monete'};tu.oro-=d.oro;s.debiti.splice(i,1);L(s,'Rendi a '+sg.nome+' le '+d.oro+' monete: il conto è chiuso.','bene');return{s}}
  const e=vuole(v==='notizie'?1:2);if(e)return e;if(g-m.g<S.ATTESA)return{err:'Torna tra qualche giorno'};
  if(v==='lettera'){if(!D.REGNI.includes(sg.faz))return{err:'Non scrive per nessun re'};s.lettere[sg.faz]=g+S.LETTERA;m.g=g;L(s,sg.nome+' scrive per te una lettera di raccomandazione ('+S.LETTERA+' giorni).','bene');return{s}}
  if(v==='prestito'){if(s.debiti.some(d=>d.sig===sg.id))return{err:'Gli devi già del denaro'};tu.oro+=S.PRESTITO;s.debiti.push({sig:sg.id,oro:S.RESA,scad:g+S.SCAD});m.g=g;L(s,sg.nome+' ti presta '+S.PRESTITO+' monete: ne vuole '+S.RESA+' entro '+S.SCAD+' giorni.');return{s}}
  return null}
 // debiti scaduti: se hai l'oro li paga la compagnia da sé, altrimenti il signore se ne ricorda
 function debiti(s){const tu=TU(s),g=giorno(s);for(const d of s.debiti.slice()){if(g<d.scad)continue;const sg=s.sig[d.sig];s.debiti.splice(s.debiti.indexOf(d),1);if(!sg)continue;
  if(tu.oro>=d.oro){tu.oro-=d.oro;L(s,'Il debito con '+sg.nome+' scade: gli sono rese '+d.oro+' monete.')}
  else{memSig(sg).trad++;relaz(s,sg.faz,-10);L(s,'Non rendi il denaro a '+sg.nome+': non lo dimenticherà.','male')}}}
 const renditaL=l=>l.tipo==='villaggio'?Math.round(l.prosp*2.5):l.tipo==='porto'?Math.round(l.prosp*3.5):l.tipo==='castello'?120:l.tipo==='citta'?Math.round(l.prosp*7):0;
 // rendite: solo i luoghi che tieni (quelli dati in feudo rendono al signore) e, da vassallo, i feudi del re; il malcontento del regno le riduce
 function rendite(s){let x=0;for(const l of s.l)if((l.faz==='tu'&&l.sig<0)||(s.servizio&&s.servizio.tipo==='vas'&&l.sig===-2))x+=renditaL(l);
  if(s.corona&&s.corona.malc)x=Math.round(x*(1-s.corona.malc/200));
  if(s.servizio&&s.servizio.tipo==='mer')x+=Math.round(forza(TU(s))*.8);return x}
 // ---------- prigionia ----------
 function libera(s){const tu=TU(s),M=mappa(s.seme);let m=null,md=1e9;for(const l of s.l){if(l.faz!=='tu'&&nemiche(s,'tu',l.faz))continue;const d=dist(l,tu);if(d<md){md=d;m=l}}
  if(m){const v=vicinoOk(M,m.x+1,m.y);tu.x=v[0];tu.y=v[1]}s.prigioniero=null;L(s,'Sei di nuovo libero'+(m?', nei pressi di '+m.nome:'')+'.','bene');s.ev.push({t:'libero'})}
 // ---------- incontri ----------
 const titoloInc=(s,q)=>q.tipo==='reliquia'?'Ripulire '+s.l[q.a].nome:q.tipo==='taglia'?'Taglia: '+s.l[q.a].nome:q.tipo==='predoni'?'Caccia ai predoni presso '+s.l[q.da].nome:q.tipo==='consegna'?q.n+' di '+D.MERCI[q.bene].nome+' a '+s.l[q.a].nome:q.n+' soldati per '+s.l[q.da].nome;
 function schieramenti(s){const inc=s.incontro,tu=TU(s);let nem=[],all=[],luogo=null;
  if(inc.tipo==='assalto'){luogo=s.l[inc.lid];nem=s.p.filter(p=>p.dentro===luogo.id&&p.k==='sig');all=s.p.filter(p=>p.k==='sig'&&p.faz==='tu'&&p.dentro<0&&!p.sc&&dist(p,luogo)<2)}
  else if(inc.tipo==='mischia'){const sc=s.scontri.find(x=>x.id===inc.sc);if(sc){const A=sc.a.map(id=>part(s,id)).filter(Boolean),B=sc.b.map(id=>part(s,id)).filter(Boolean);if(inc.lato==='a'){all=A;nem=B}else{all=B;nem=A}}}
  else{nem=inc.pid.map(id=>part(s,id)).filter(Boolean);all=(inc.all||[]).map(id=>part(s,id)).filter(Boolean)}
  return{nem,all,luogo}}
 // ---------- tornei nelle città (V2) ----------
 // Un torneo c'è in una città quando (giorno + id) % 7 === 0: nessuno stato in più, dura tutto il giorno. Il duello è a piedi, corpo a corpo,
 // con l'equipaggiamento di chi gioca (senza cavallo, e l'arco diventa una spada). `s.torneo = {lid, turno, posta, giorno}`: turno = prossimo duello (0..2).
 const torneoOggi=(s,l)=>!!l&&l.tipo==='citta'&&(giorno(s)+l.id)%7===0;
 // i tornei dei prossimi giorni, dal più vicino: [{lid, giorni}]
 function tornei(s){const g=giorno(s),tu=TU(s);return s.l.filter(l=>l.tipo==='citta').map(l=>({lid:l.id,giorni:(7-(g+l.id)%7)%7})).sort((a,b)=>a.giorni-b.giorni||dist(s.l[a.lid],tu)-dist(s.l[b.lid],tu))}
 const quando=n=>n===0?'oggi':n===1?'domani':'tra '+n+' giorni';
 const premioTorneo=t=>t&&t.turno>0?t.posta*D.TORNEO.mol[t.turno-1]:0;
 // chi esce da un torneo in cui è iscritto: incassa il premio maturato
 function chiudiTorneo(s,motivo){const t=s.torneo,premio=premioTorneo(t);TU(s).oro+=premio;s.torneo=null;L(s,motivo+(premio?': incassi '+premio+' monete.':'.'),premio?'bene':'');return premio}
 // i campioni crescono con chi si iscrive: oltre il livello medio `T.LIV` dei capitani ogni livello aggiunge `T.cresce` (così il premio, che sale
 // col livello, resta una scommessa e non una rendita). Arrotondato per difetto: stesso mondo → stessi numeri.
 function baseTorneo(s,turno){const T=D.TORNEO,b=T.base[turno],cs=capi(s),lv=Math.max(0,Math.floor(cs.reduce((a,c)=>a+c.liv,0)/Math.max(1,cs.length))-T.LIV),out={};
  for(const k in b)out[k]=Math.round(b[k]+(T.cresce[k]||0)*lv);return out}
 // gli avversari di un turno: stesso mondo, stessa città, stesso giorno, stesso turno → stessi uomini
 function avversariTorneo(s,lid,giornoT,turno,n){const T=D.TORNEO,b=baseTorneo(s,turno),r=ADADI.gen({rng:ADADI.semina((s.seme^Math.imul(lid+1,2654435761)^Math.imul(giornoT+1,40503)^Math.imul(turno+1,69069))>>>0)}),nomi=T.nomi[turno].slice(),out=[];
  for(let k=0;k<n;k++){const kit=T.kit[Math.floor(r()*T.kit.length)],arma=ogg(kit.arma),sc=kit.scudo?ogg(kit.scudo):null,nome=nomi.splice(Math.floor(r()*nomi.length),1)[0]||T.nomi[turno][0];
   out.push({nome,kit:kit.id,corredo:kit.nome,turno,st:{nome,pf:b.pf,att:b.att+(arma.att||0),dif:b.dif+(sc?sc.dif:0),dan:b.dan+(arma.dan||0),rit:arma.rit||12,perf:arma.perf||0,git:0,vel:10,
    asp:{elmo:kit.elmo,arma:arma.asp,scudo:sc?sc.asp:null,cor:T.cor[turno],mant:1,col:T.colori[turno]}}})}
  return out}
 // il capitano in lizza: a piedi, senza arco, con tutto il resto che porta addosso
 function statArena(c){const eq=Object.assign({},c.eq,{cavallo:null});if((ogg(eq.arma)||{}).git)eq.arma='spada';const st=statCap(Object.assign({},c,{eq})),cv=c.ab.cavaliere||0;st.att+=2*cv;st.pf+=4*cv;return st}
 // dopo una sconfitta in lizza si combatte a metà vita fino a sera
 const feritoOggi=(s,c)=>s.ferito===giorno(s)?Object.assign({},c,{pf:Math.max(1,Math.round(c.pf*.5))}):c;
 function campoArena(s){const t=s.torneo,l=s.l[t.lid],cs=capi(s).map(c=>feritoOggi(s,statArena(c))),av=avversariTorneo(s,t.lid,t.giorno,t.turno,cs.length);
  return{seme:(s.rng^s.t)|0,tipo:'arena',terreno:1,bioma:0,notte:notte(s),ora:(s.t%P.GIORNO)/60,scena:{meteo:'sereno',strada:false,pend:0,costa:null,vicino:{tipo:'citta',faz:l.faz}},a:[],
   b:av.map((x,k)=>({p:-100-k,t:'pre_f2',n:1,st:x.st})),faza:'tu',fazb:l.faz,noma:s.nome,nomb:D.TORNEO.turni[t.turno]+(av.length>1?'i':'')+' di '+l.nome,cap:cs[0],capi:cs,morale:55}}
 // chiude un duello del torneo: vittoria → turno dopo (o finale: premio, fama e un oggetto di pregio 3); sconfitta → fuori, senza prigionia né perdite
 function esitoArena(s,riep){const t=s.torneo,tu=TU(s),T=D.TORNEO,v=riep.vince==='a',out={vince:riep.vince,id:s.uid++,morti:0,feriti:0,oro:0,xp:0,prig:0,fama:0,bottino:[],oggetti:[],promo:false,presa:null,livello:false,torneo:null};
  if(!t){s.incontro=null;return{err:'Nessun torneo in corso'}}s.incontro=null;
  const l=s.l[t.lid],turno=t.turno;
  if(v){s.stat.duelli=(s.stat.duelli||0)+1;out.xp=T.xp[turno];out.fama=T.fama[turno];s.fama+=out.fama;t.turno++;
   if(t.turno>=3){const prem=t.posta*T.mol[2],r=rnd(s),has=id=>tu.zaino.includes(id)||[s.cap].concat(s.soci||[]).some(c=>Object.values(c.eq).flat().includes(id)),pool=Object.keys(D.OGG).filter(id=>D.OGG[id].q===3&&!has(id)),id=pool.length?pool[Math.floor(r()*pool.length)]:null;
    tu.oro+=prem;out.oro=prem;if(id){tu.zaino.push(id);out.oggetti.push(id)}s.torneo=null;s.stat.tornei=(s.stat.tornei||0)+1;out.torneo={vinto:true,turno,premio:prem,oggetto:id,chiuso:true};
    L(s,'Campione del torneo di '+l.nome+'! '+prem+' monete'+(id?' e '+D.OGG[id].nome+'.':'.'),'bene')}
   else{out.torneo={vinto:true,turno,premio:premioTorneo(t),oggetto:null,chiuso:false};L(s,'Vinci il duello contro '+T.turni[turno].toLowerCase()+(out.fama?' (+'+out.fama+' fama)':'')+': in palio ora '+premioTorneo(t)+' monete.','bene')}}
  else{s.torneo=null;s.ferito=giorno(s);out.torneo={vinto:false,turno,premio:0,oggetto:null,chiuso:true};L(s,'Cadi in lizza a '+l.nome+' e perdi il torneo: fino a sera combatterai a metà delle forze.','male')}
  cresci(s,out);s.ult=out;s.ev.push({t:'esito',out});return{s,out}}
 // il capitano cresce
 function cresci(s,out){for(const c of capi(s)){c.xp+=out.xp;while(c.xp>=xpLiv(c.liv)){c.xp-=xpLiv(c.liv);c.liv++;c.punti++;out.livello=true;L(s,c.nome+' sale al livello '+c.liv+'.','bene')}}}
 // la scheda della battaglia per VCAM: lato `a` = chi gioca e i suoi alleati
 function campo(s){const inc=s.incontro;if(!inc)return null;if(inc.tipo==='arena')return campoArena(s);const{nem,all,luogo}=schieramenti(s),tu=TU(s),M=mappa(s.seme),i=cella(M,tu.x,tu.y);
  const riga=(p,tr)=>tr.filter(e=>e.n-(e.f||0)>0).map(e=>({p,t:e.t,n:e.n-(e.f||0)}));
  let a=riga(0,tu.tr),b=[];for(const p of all)a=a.concat(riga(p.id,p.tr));for(const p of nem)b=b.concat(riga(p.id,p.tr));if(luogo)b=b.concat(riga(-1-luogo.id,luogo.g));
  const cs=capi(s).map(c=>feritoOggi(s,statCap(c)));
  const scena={meteo:s.meteo||'sereno',strada:!!M.S[i],pend:M.T[i]===3?1:0,costa:null,vicino:null};
  for(let d=1;d<=3&&!scena.costa;d++){if(M.T[cella(M,tu.x+d,tu.y)]===0)scena.costa='e';else if(M.T[cella(M,tu.x-d,tu.y)]===0)scena.costa='o'}
  {let m=luogo,md=3.4;if(!m)for(const l of s.l){const d=dist(l,tu);if(d<md&&l.noto!==false){md=d;m=l}}if(m)scena.vicino={tipo:m.tipo,faz:m.faz}}
  return{seme:(s.rng^s.t)|0,tipo:luogo&&MURA[luogo.tipo]?'assedio':'campo',terreno:M.T[i],bioma:M.B[i],notte:notte(s),ora:(s.t%P.GIORNO)/60,scena,a,b,
   faza:lato(s),fazb:luogo?luogo.faz:nem[0]?nem[0].faz:'pre',cola:colFaz(s,lato(s)),colb:colFaz(s,luogo?luogo.faz:nem[0]?nem[0].faz:'pre'),noma:s.nome,nomb:luogo?luogo.nome:nem.map(p=>p.nome).join(', '),
   cap:cs[0],capi:cs,morale:tu.mor,assedio:luogo&&MURA[luogo.tipo]&&s.assedio&&s.assedio.lid===luogo.id?fasi(s):undefined}}
 // assedio di chi gioca (V5b): le scale sono pronte subito, la breccia dopo BRECCIA_ORE dall'inizio, la porta con l'ariete
 // un salvataggio di prima delle fasi non ha `da`: l'assedio era iniziato ASSEDIO_ORE prima di `pronto`
 const inizio=a=>a.da!=null?a.da:a.pronto-P.ASSEDIO_ORE*60;
 const fasi=s=>({breccia:s.t-inizio(s.assedio)>=P.BRECCIA_ORE*60,ariete:!!s.assedio.ariete});
 function assedioStato(s){const a=s.assedio;if(!a)return null;const f=fasi(s),resta=inizio(a)+P.BRECCIA_ORE*60-s.t;return{scale:true,breccia:f.breccia,ariete:f.ariete,oreBreccia:Math.max(0,Math.ceil(resta/60))}}
 // aggredire gente di un regno: l'opinione crolla e, con la corona, è guerra (cade l'eventuale alleanza)
 function inimica(s,f){relaz(s,f,Math.min(-30-s.rel[f],-30));if(s.corona){delete s.alleanza[chiave('tu',f)];s.guerra[chiave('tu',f)]=true;delete s.corona.minacce[f]}}
 // lealtà di un signore che valuta di passare a te in cambio del feudo `lid`: un conto con i fattori in chiaro, senza dadi ({f,tot,ok} oppure {err})
 function lealta(s,sid,lid){const sg=s.sig[sid],l=s.l[lid],P2=D.REGNO.PASSA;
  if(!s.corona)return{err:'Non hai un regno'};if(!sg||sg.faz==='tu')return{err:'Non è un signore da convincere'};if(sg.re)return{err:'Un sovrano non si piega così'};
  if(!l||l.faz!=='tu'||l.sig>=0)return{err:'Serve un tuo luogo tenuto da offrire in feudo'};if(l.id===s.corona.sede)return{err:'La sede del regno resta tua'};
  const f=[],ag=(n,v)=>{v=Math.round(v*10)/10;if(v)f.push({n,v})},t=D.TRATTI[sg.tratto],reg=D.REGNI.includes(sg.faz);
  ag('Giuramento al suo signore',P2.BASE);if(sg.faz==='neu'&&sg.esule)ag('Senza più patria',P2.ESULE);if(t)ag('Indole ('+t.nome+')',t.passa||0);
  ag('Amicizia personale',(sg.am||0)/P2.AMICIZIA);ag('Fama della compagnia',Math.min(s.fama,P2.FAMA_MAX)/P2.FAMA);
  if(reg&&s.l.filter(x=>x.faz===sg.faz&&MURA[x.tipo]).length<=2)ag('Il suo regno è debole',P2.DEBOLE);if(reg&&inGuerra(s,sg.faz,'tu'))ag('In guerra col tuo regno',P2.GUERRA);
  ag('Il feudo offerto ('+l.tipo+')',P2.FEUDO[l.tipo]||0);
  const tot=Math.round(f.reduce((x,y)=>x+y.v,0)*10)/10;return{f,tot,ok:tot>=0}}
 function daiFeudo(s,l,sid){l.sig=sid;for(const v of s.l)if(v.capo===l.id&&!MURA[v.tipo])v.sig=sid}
 // un signore passa a te nell'incontro: i suoi luoghi restano senza signore, lui prende il feudo offerto e porta con sé le sue truppe
 function passaA(s,p,lid){const sg=p.k==='sig'?s.sig[p.sig]:null;if(!sg)return{err:'Non è un signore'};const R=lealta(s,sg.id,lid);if(R.err)return R;if(!R.ok)return{err:sg.nome+' rifiuta: il conto dà '+R.tot+' (serve 0)'};
  const l=s.l[lid],vecchia=sg.faz;sg.cult=sg.cult||(D.REGNI.includes(vecchia)?vecchia:sg.esule||vecchia);for(const x of s.l)if(x.sig===sg.id)x.sig=-1;
  sg.faz=p.faz='tu';sg.esule=null;sg.esilio=0;sg.casa=lid;daiFeudo(s,l,sg.id);p.via=[];p.fermo=0;p.ia={st:'giro',t:0};if(D.REGNI.includes(vecchia))relaz(s,vecchia,-15);
  L(s,sg.nome+' giura a '+s.corona.nome+' e riceve '+l.nome+'.','bene');s.ev.push({t:'passa',sid:sg.id});s.incontro=null;return{s}}
 function scegli(s,v){if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};const inc=s.incontro,tu=TU(s),r=rnd(s);if(!inc)return{err:'Nessun incontro'};
  if(inc.tipo==='mischia'){if(v==='a'||v==='b'){inc.lato=v;const{nem}=schieramenti(s);for(const p of nem)if(!ostile(s,p,tu)&&D.REGNI.includes(p.faz))inimica(s,p.faz);inc.pronto=true;return{s}}
   if(v==='lascia'){s.incontro=null;return{s}}if(!inc.pronto)return{err:'Scegli con chi stare'}}
  if(inc.tipo==='parla'){const p=part(s,inc.pid[0]);if(v==='lascia'||!p){s.incontro=null;return{s}}
   const sgp=p.k==='sig'?s.sig[p.sig]:null;if(sgp)confSig(s,sgp);
   if(sgp&&(v==='lettera'||v==='prestito'||v==='rendi')){const R=favoreSig(s,sgp,v);if(R)return R}
   if(v==='notizie'){if(inc.detto)return{err:'Non ha altro da dirti'};if(sgp){const R=favoreSig(s,sgp,'notizie');if(R)return R;memSig(sgp).g=giorno(s)}inc.detto=1;const x=s.l.filter(l=>l.noto===false&&l.g.length).sort((a,b)=>dist(a,tu)-dist(b,tu))[0];
    if(x){x.noto=true;inc.voce='«Si parla di '+x.nome+': '+(x.tipo==='covo'?'un nido di predoni':'pietre antiche, e chi ci va non sempre torna')+'. Te lo segno sulla mappa.»'}else inc.voce='«Niente che tu non sappia già, capitano.»';return{s}}
   if(v.slice(0,6)==='passa:')return passaA(s,p,+v.slice(6));
   if(v==='aggredisci'){if(sgp)memSig(sgp).trad++;if(D.REGNI.includes(p.faz)){inimica(s,p.faz);L(s,'Hai aggredito gente di '+D.FAZ[p.faz].breve+': ora ti sono nemici.','male')}inc.tipo='nemico';inc.da='tu';return{s}}return{err:'Scelta non valida'}}
  if(inc.tipo==='assalto'&&v==='togli'){s.assedio=null;s.incontro=null;if(s.dentro!==inc.lid)s.davanti=inc.lid;return{s}}
  if(inc.tipo==='assalto'&&(v==='attendi'||v==='ariete')){const a=s.assedio;if(!a||a.lid!==inc.lid||!MURA[s.l[inc.lid].tipo])return{err:'Qui non c\'è un assedio'};
   // si rimanda l'assalto: paghe, viveri e soccorsi dei signori continuano a correre
   if(v==='attendi'){if(fasi(s).breccia)return{err:'La breccia è già aperta'};a.pronto=inizio(a)+P.BRECCIA_ORE*60}
   else{if(a.ariete)return{err:'L\'ariete è già pronto'};if(tu.oro<P.ARIETE_ORO)return{err:'Servono '+P.ARIETE_ORO+' monete'};tu.oro-=P.ARIETE_ORO;a.ariete=true;a.pronto=s.t+P.ARIETE_ORE*60}
   a.da=inizio(a);s.incontro=null;tu.ord={t:'aspetta',fino:a.pronto+60};L(s,v==='attendi'?'Aspettate che le mura cedano.':'Si abbatte un tronco per l\'ariete: pronto tra '+P.ARIETE_ORE+' ore.','guerra');return{s}}
  if(v==='attacca'||v==='auto')return{s,campo:campo(s)};
  if(inc.tipo==='nemico'){const{nem}=schieramenti(s),capo=nem[0];
   if(v==='paga'){if(!capo||capo.k!=='pre')return{err:'Non trattano'};const q=Math.max(30,Math.floor(tu.oro*.25));if(tu.oro<q)return{err:'Non hai abbastanza monete'};tu.oro-=q;capo.oro+=q;for(const p of nem){p.fermo=s.t+240;p.ia.st='giro';p.via=[]}s.tregua=s.t+480;s.incontro=null;L(s,'Paghi '+q+' monete e i predoni vi lasciano passare.');reagisci(s,'tributo');return{s}}
   if(v==='fuggi'){const e=tu.tr.filter(e=>!D.TR[e.t].compagno&&e.n>0);const persi=inc.da==='tu'?0:Math.max(1,Math.floor(uomini(tu)*.12));let k=persi,via=0;while(k>0&&e.length){const x=e[Math.floor(r()*e.length)];if(togliUomini(tu.tr,x.t,1)){k--;via++}else e.splice(e.indexOf(x),1);if(!e.some(q=>q.n>0))break}
    for(const p of nem){p.fermo=s.t+150;p.ia.st='giro';p.via=[]}s.tregua=s.t+300;tu.mor=Math.max(0,tu.mor-6);s.incontro=null;L(s,via?'Vi sganciate lasciando indietro '+via+' uomini di retroguardia.':'Vi sganciate senza perdite.',via?'male':'');reagisci(s,'fuga');return{s}}}
  return{err:'Scelta non valida'}}
 // chiude una battaglia giocata o risolta: riep = { vince:'a'|'b', cad:[{p,t,n}], capKo, uccisi }
 function esito(s,riep){const inc=s.incontro;if(!inc)return{err:'Nessun incontro'};if(inc.tipo==='arena')return esitoArena(s,riep);const{nem,all,luogo}=schieramenti(s),tu=TU(s),r=rnd(s),med=abil(s,'medicina');
  const out={vince:riep.vince,morti:0,feriti:0,oro:0,xp:0,prig:0,fama:0,bottino:[],oggetti:[],promo:false,presa:null,livello:false};const dona=id=>{if(D.OGG[id]){tu.zaino.push(id);out.oggetti.push(id)}};
  const fn=nem.reduce((x,p)=>x+forza(p),0)+(luogo?forzaTr(luogo.g)*(MURA[luogo.tipo]?P.MURA:1):0),fa=forza(tu)+all.reduce((x,p)=>x+forza(p),0);
  let valUcc=0;const prima=uomini(tu);
  for(const c of riep.cad||[]){if(c.n<=0)continue;if(c.p===0){const e=tu.tr.find(e=>e.t===c.t);if(!e)continue;const comp=!!D.TR[c.t].compagno;let fer=0;for(let k=0;k<c.n;k++)if(comp||r()<.3+med*.06)fer++;
     const morti=Math.min(c.n-fer,e.n);togliUomini(tu.tr,c.t,morti);const e2=tu.tr.find(e=>e.t===c.t);if(e2)e2.f=Math.min(e2.n,(e2.f||0)+fer);out.morti+=morti;out.feriti+=fer}
   else if(c.p<0){const l=s.l[-1-c.p];togliUomini(l.g,c.t,c.n);valUcc+=c.n*D.valore(c.t)}
   else{const p=part(s,c.p);if(p){togliUomini(p.tr,c.t,c.n);if(nem.includes(p)){valUcc+=c.n*D.valore(c.t);if(riep.vince==='a'&&r()<.3&&s.prig.reduce((a,e)=>a+e.n,0)<limitePrig(s)){aggiungi(s.prig,c.t,1);out.prig++}}}}}
  s.stat.uccisi+=Math.round(valUcc);if(prima>0&&out.morti>=prima*.25)reagisci(s,'perdite');
  if(riep.vince==='a'){s.stat.vinte++;if(fn>=fa){reagisci(s,'vittoria');for(const c of inCompagnia(s)){const gr=gradDi(s,c.id);gr.g=limita(gr.g+D.GRAD.VINTA)}}const rapporto=fn/Math.max(1,fa);out.fama=Math.max(1,Math.round(Math.min(25,fn/14*Math.max(.4,rapporto))));s.fama+=out.fama;s.slancio=Math.min(30,s.slancio+8);
   out.xp=Math.round(valUcc*1.4+10);
   for(const p of nem){avanzaInc(s,'vinci',p);out.oro+=Math.floor(p.oro*.6)+Math.round(forza(p)*.2);const era=p.k,sgi=p.sig;
    for(const q of s.incarichi)if(q.tipo==='predoni'&&q.pid===p.id&&!q.fatto){q.fatto=true;const l=s.l[q.da];tu.oro+=q.premio;l.rel+=8;l.inc=null;relaz(s,l.faz,2);s.fama+=3;L(s,'Predoni dispersi: '+l.nome+' vi paga '+q.premio+' monete.','bene')}
    if(p.k==='sig'&&r()<.3){const B=D.BOTTEGA[p.faz];if(B)dona(B[Math.floor(r()*B.length)])}
    if(p.k==='riv'&&!s.rivVinta){s.rivVinta=giorno(s);const vv=s.volpe||(s.volpe={tappa:0});if(!vv.dono){vv.dono=1;dona(D.RIVALE.premio)}s.fama+=15;L(s,'La Volpe Rossa vi lascia il campo'+(vv.dono===1?', e la sua cavalla.':'.'),'bene')}
    if(p.k==='sig'){memSig(s.sig[sgi]).sconf++;const preso=r()<.5;VEN.sconfitta(s,p,'tu',preso?'tu':null);if(preso){s.sig[sgi].am=(s.sig[sgi].am||0)-10;s.prig.push({sig:sgi,n:1,t:'sig'});L(s,s.sig[sgi].nome+' è tuo prigioniero.','bene')}relaz(s,p.faz,-4)}
    else{if(p.porta){out.bottino.push([p.porta.m,p.porta.q]);tu.merci[p.porta.m]=(tu.merci[p.porta.m]||0)+p.porta.q}VEN.sconfitta(s,p,'tu')}
    if(era==='pre'){for(const l of s.l)if(l.tipo==='villaggio'&&dist(l,tu)<6)l.rel+=1}}
   out.oro+=Math.round(valUcc*.4);out.oro=Math.round(out.oro*(1+somma(s,'bottino')));tu.oro+=out.oro;
   // esperienza alle truppe rimaste, in proporzione
   const tot=uomini(tu)||1;for(const e of tu.tr)if(D.TR[e.t].su.length){e.xp=(e.xp||0)+valUcc*.9*e.n/tot;if(e.xp>=D.XP_SU[D.TR[e.t].t])out.promo=true}
   for(const p of all){p.sc=0;if(D.REGNI.includes(p.faz))relaz(s,p.faz,3);if(p.k==='sig'&&s.sig[p.sig]){s.sig[p.sig].am=(s.sig[p.sig].am||0)+4;memSig(s.sig[p.sig]).fav++}}
   if(luogo&&SITO[luogo.tipo]){const covo=luogo.tipo==='covo';reagisci(s,'sito');avanzaInc(s,'sito',luogo);luogo.g=[];luogo.vinto=giorno(s);if(luogo.tesoro){dona(luogo.tesoro);luogo.tesoro=null}s.stat[covo?'covi':'rovine']++;const pr=covo?260:120;tu.oro+=pr;out.oro+=pr;s.fama+=covo?12:6;out.fama+=covo?12:6;
    L(s,covo?luogo.nome+' è in cenere: le strade respirano.':'Le rovine tacciono. Quel che custodivano è vostro.','bene');if(covo)s.davanti=-1;
    for(const q of s.incarichi)if((q.tipo==='reliquia'||q.tipo==='taglia')&&q.a===luogo.id&&!q.fatto&&!q.fallito){q.fatto=true;tu.oro+=q.premio;out.oro+=q.premio;const da=s.l[q.da];da.inc=null;da.rel+=8;s.fama+=5;L(s,'Incarico compiuto: '+q.premio+' monete da '+da.nome+'.','bene')}}
   else if(luogo){for(const p of s.p.filter(p=>p.dentro===luogo.id&&p.k!=='sig'))p.dentro=-1;const srv=s.servizio;
    if(srv){conquista(s,luogo,srv.faz,srv.tipo==='vas'?-2:-1);if(srv.tipo==='vas')L(s,'Il sovrano ti affida '+luogo.nome+'.','bene');else{tu.oro+=700;out.oro+=700}relaz(s,srv.faz,10)}else conquista(s,luogo,'tu',-2);
    luogo.g=[];s.assedio=null;s.fama+=20;out.fama+=20;out.presa=luogo.id;s.dentro=luogo.id}
   if(inc.tipo==='mischia'){const sc=s.scontri.find(x=>x.id===inc.sc);if(sc){const i=s.scontri.indexOf(sc);s.scontri.splice(i,1)}}}
  else{s.stat.perse++;tu.mor=Math.max(0,tu.mor-15);s.slancio=0;out.xp=Math.round(valUcc*.7);
   for(const p of nem){p.sc=0;p.fermo=s.t+120;VEN.promuoviIA(p)}for(const p of all){p.sc=0;if(p.k!=='tu')VEN.sconfitta(s,p,nem[0]?nem[0].faz:null)}
   if(inc.tipo==='mischia'){const sc=s.scontri.find(x=>x.id===inc.sc);if(sc)s.scontri.splice(s.scontri.indexOf(sc),1)}
   // i superstiti si disperdono: ne resta una parte, ferita; oro e merci al vincitore; il capitano è preso se è caduto
   const persi=Math.floor(tu.oro*.4);tu.oro-=persi;out.oro=-persi;tu.merci={};
   for(const e of tu.tr.slice()){if(D.TR[e.t].compagno){e.f=e.n;continue}const resta=Math.floor(e.n*(riep.capKo?.3:.6));togliUomini(tu.tr,e.t,e.n-resta);const e2=tu.tr.find(x=>x.t===e.t);if(e2)e2.f=Math.min(e2.n,Math.ceil(e2.n*.6))}
   s.assedio=null;
   if(riep.capKo){s.prigioniero={fino:s.t+(18+Math.floor(r()*30))*60,da:nem[0]?nem[0].nome:(luogo?luogo.nome:'i nemici')};tu.ord=null;tu.via=[];L(s,'Sei caduto e ti hanno preso: ti porteranno in catene finché non riesci a fuggire.','male')}
   else{const M=mappa(s.seme),m=nem[0]||luogo;if(m){const v=vicinoOk(M,tu.x+(tu.x-m.x)*2+1.5,tu.y+(tu.y-m.y)*2+1.5);tu.x=v[0];tu.y=v[1]}L(s,'La compagnia è rotta e si ritira in disordine.','male')}
   s.rotta=s.t+180;tu.ord=null;tu.via=[]}
  cresci(s,out);
  s.incontro=null;s.ult=out;s.ev.push({t:'esito',out});return{s,out}}
 // risoluzione automatica: gioca la battaglia col motore del campo, senza grafica (VCAM è nel file dopo: esiste a runtime)
 function auto(s){const c=campo(s);if(!c)return{err:'Nessun incontro'};return esito(s,VCAM.risolvi(c))}
 // ---------- azioni nei luoghi ----------
 // regno (V4): fondare un regno nella propria fortezza (città o castello tuo, fama e monete) e le prime mosse dei confinanti
 function fondaRegno(s,z,l,dentro,mio){const R=D.REGNO,tu=TU(s),r=rnd(s),g=giorno(s);
  if(s.corona)return{err:'Hai già un regno'};if(s.servizio)return{err:'Prima sciogli il tuo legame'};
  if(!dentro||!mio||l.faz!=='tu'||(l.tipo!=='citta'&&l.tipo!=='castello'))return{err:'Serve una tua città o un tuo castello, e devi essere dentro'};
  if(s.fama<R.FAMA)return{err:'Serve fama '+R.FAMA};if(tu.oro<R.ORO)return{err:'Servono '+R.ORO+' monete'};
  const nome=String(z.nome==null?'':z.nome).trim().slice(0,24);if(!nome)return{err:'Dai un nome al regno'};const st=z.stend==null?0:z.stend|0;if(!(st>=0&&st<R.STENDARDI.length))return{err:'Stendardo sconosciuto'};
  tu.oro-=R.ORO;s.corona={nome,stend:st,da:g,sede:l.id,malc:0,minacce:{}};const conf=confinanti(s);
  for(const f of D.REGNI){if(s.cadute[f])continue;const vic=conf.includes(f);
   if(vic&&s.rel[f]>=R.AMICO){relaz(s,f,5);L(s,nomeF(s,f)+' propone pace a '+nome+'.','bene')}
   else if(s.rel[f]<=-25){s.guerra[chiave('tu',f)]=true;L(s,nomeF(s,f)+' ti dichiara guerra.','guerra')}
   else if(vic)s.corona.minacce[f]=g+1+Math.floor(r()*R.GUERRA_ENTRO)}
  L(s,'Fondi il regno «'+nome+'»: '+l.nome+' ne è la sede.','bene');s.ev.push({t:'regno'});return{s}}
 // le azioni del sovrano, valide ovunque: feudi (sid=-2: lo tieni tu), compagni investiti, adunata dei signori, guerra e rottura di un'alleanza
 function faiRegno(s,z){const tu=TU(s),g=giorno(s),R=D.REGNO,r=rnd(s);
  if(z.a==='feudo'){const l=s.l[z.lid];if(!l||l.faz!=='tu')return{err:'Non è un luogo tuo'};if(l.id===s.corona.sede)return{err:'La sede del regno resta tua'};
   if(l.capo>=0&&!MURA[l.tipo]&&s.l[l.capo].faz==='tu')return{err:'Va dato insieme alla sua fortezza'};
   const sid=z.sid==null?-2:z.sid|0;let sg=null;if(sid>=0){sg=s.sig[sid];if(!sg||sg.faz!=='tu')return{err:'Non è un tuo signore'}}else if(sid!==-2)return{err:'Signore sconosciuto'};
   const prima=l.sig>=0?l.sig:-1;if(prima===sid||(prima<0&&sid===-2))return{err:'È già così'};
   daiFeudo(s,l,sid);if(prima>=0)perdeFeudo(s,prima);L(s,sg?l.nome+' va in feudo a '+sg.nome+'.':l.nome+' resta in mano tua.','bene');return{s}}
  if(z.a==='investi'){const l=s.l[z.lid],T=D.TR[z.t],e=tu.tr.find(e=>e.t===z.t);if(!T||!T.compagno)return{err:'Non è un compagno'};if(!e||e.n<1)return{err:'Il compagno non è con te'};
   if(!l||l.faz!=='tu'||l.sig>=0)return{err:'Serve un tuo luogo tenuto'};if(l.id===s.corona.sede)return{err:'La sede del regno resta tua'};
   const co=D.COMPAGNI.find(x=>x.id===z.t),cult=M0(s,l);togliUomini(tu.tr,z.t,1);
   const sg={id:s.sig.length,nome:co.nome,faz:'tu',casa:l.id,pid:-1,prig:null,torna:0,re:false,tratto:D.TRATTI_ID[s.sig.length%D.TRATTI_ID.length],cult,comp:co.id,mem:{lib:0,sconf:0,trad:0,fav:0,g:-99}};s.sig.push(sg);
   const p=nuovaP(s,'sig','tu',co.nome,l.x,l.y,leva(cult,R.TRUPPE_COMP,r),{oro:150,sig:sg.id,dentro:l.id});sg.pid=p.id;daiFeudo(s,l,sg.id);s.compagni[co.id]=-3;
   L(s,co.nome+' è investito di '+l.nome+': ora è signore.','bene');return{s}}
  if(z.a==='aduna'){let n=0;for(const p of s.p)if(p.k==='sig'&&p.faz==='tu'){p.dentro=-1;p.via=[];p.ia={st:'adunata',t:0,fine:s.t+R.ADUNATA*P.GIORNO};n++}
   if(!n)return{err:'Non hai signori'};L(s,'Chiami a raccolta i tuoi signori: ti raggiungeranno ('+n+').');return{s}}
  if(z.a==='dichiara'){const f=z.f;if(!D.REGNI.includes(f)||s.cadute[f])return{err:'Regno sconosciuto'};if(inGuerra(s,'tu',f))return{err:'Siete già in guerra'};if(alleate(s,'tu',f))return{err:'Sono tuoi alleati: rompi prima l\'alleanza'};
   s.guerra[chiave('tu',f)]=true;delete s.corona.minacce[f];relaz(s,f,-10);L(s,'Dichiari guerra a '+nomeF(s,f)+'.','guerra');return{s}}
  if(z.a==='rompi'){const al=s.alleanza&&s.alleanza[chiave('tu',z.f)];if(!al)return{err:'Non siete alleati'};if(al.rompe)return{err:'La rottura è già annunciata'};
   al.rompe=Math.max(g+D.DIPL.PREAVVISO,al.da+D.DIPL.MIN);L(s,'Annunci la rottura dell\'alleanza con '+nomeF(s,z.f)+': finirà il giorno '+al.rompe+'.','guerra');return{s}}
  return{err:'Azione sconosciuta'}}
 // tolto l'ultimo feudo, il signore diventa esule
 function perdeFeudo(s,sid){if(s.l.some(l=>l.faz==='tu'&&l.sig===sid))return;const sg=s.sig[sid],p=sg&&part(s,sg.pid);if(!sg)return;daEsule(s,sg,p);L(s,sg.nome+' resta senza feudo e se ne va in esilio.','male')}
 function fai(s,z){if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};const tu=TU(s),r=rnd(s),lid=s.dentro>=0?s.dentro:s.davanti,l=lid>=0?s.l[lid]:null,c=capDi(s,z.seat);if(!c)return{err:'Capitano sconosciuto'};
  if(s.incontro&&s.incontro.tipo==='arena'&&!['ritira','equipa','togli','abilita'].includes(z.a))return{err:'Il duello ti aspetta'};
  // sempre possibili
  if(['feudo','investi','aduna','dichiara','rompi'].includes(z.a)){if(!s.corona)return{err:'Non hai un regno'};return faiRegno(s,z)}
  if(z.a==='abilita'){if(c.punti<1)return{err:'Nessun punto da spendere'};if(!(z.k in c.ab))return{err:'Abilità sconosciuta'};if(c.ab[z.k]>=10)return{err:'Già al massimo'};c.ab[z.k]++;c.punti--;return{s}}
  if(z.a==='promuovi'){const e=tu.tr.find(e=>e.t===z.t),T=e&&D.TR[e.t];if(!e||!T.su.includes(z.su))return{err:'Promozione non valida'};const n=Math.max(1,z.n||1),xp=D.XP_SU[T.t]*n,oro=D.PROMO[T.t]*n;
   if(e.n<n)return{err:'Non hai abbastanza uomini'};if((e.xp||0)<xp)return{err:'Non hanno ancora abbastanza esperienza'};if(tu.oro<oro)return{err:'Servono '+oro+' monete'};
   e.xp-=xp;tu.oro-=oro;const fer=Math.min(e.f||0,Math.max(0,n-(e.n-(e.f||0))));togliUomini(tu.tr,z.t,n);aggiungi(tu.tr,z.su,n);if(fer){const e2=tu.tr.find(x=>x.t===z.su);e2.f=(e2.f||0)+fer}return{s}}
  if(z.a==='congeda'){const n=togliUomini(tu.tr,z.t,Math.max(1,z.n||1));return n?{s}:{err:'Nessuno da congedare'}}
  if(z.a==='libera'){const i=s.prig.findIndex(e=>e.t===z.t&&!e.sig);if(i<0)return{err:'Nessun prigioniero'};s.prig.splice(i,1);reagisci(s,'libera');return{s}}
  if(z.a==='liberasig'){const i=s.prig.findIndex(e=>e.sig!=null&&e.sig===z.sig);if(i<0)return{err:'Non è tuo prigioniero'};const sg=s.sig[z.sig];s.prig.splice(i,1);sg.prig=null;const pg=part(s,sg.pid);if(pg)pg.ia.t=s.t+P.GIORNO;
   memSig(sg).lib++;relaz(s,sg.faz,6);L(s,'Liberi '+sg.nome+' senza riscatto: se ne ricorderà.','bene');return{s}}
  if(z.a==='esci'){s.dentro=-1;s.davanti=-1;return{s}}
  if(z.a==='equipa'){const i=z.i|0,id=tu.zaino[i],o=ogg(id),eq=c.eq;if(!o)return{err:'Oggetto sconosciuto'};
   if(o.slot==='cimelio'){const k=z.k===1?1:z.k===0?0:(eq.cimeli[0]&&!eq.cimeli[1]?1:0),old=eq.cimeli[k];eq.cimeli[k]=id;tu.zaino.splice(i,1);if(old)tu.zaino.push(old);return{s}}
   if(o.slot==='scudo'&&(ogg(eq.arma)||{}).due)return{err:'Con un\'arma a due mani non si porta lo scudo'};
   const old=eq[o.slot];eq[o.slot]=id;tu.zaino.splice(i,1);if(old)tu.zaino.push(old);if(o.slot==='arma'&&o.due&&eq.scudo){tu.zaino.push(eq.scudo);eq.scudo=null}return{s}}
  if(z.a==='togli'){const eq=c.eq;if(z.slot==='cimelio'){const k=z.k?1:0;if(!eq.cimeli[k])return{err:'Niente da togliere'};tu.zaino.push(eq.cimeli[k]);eq.cimeli[k]=null;return{s}}
   if(z.slot==='arma'||z.slot==='armatura')return{err:'Senza non si va in battaglia: scambiala con un\'altra'};if(!eq[z.slot])return{err:'Niente da togliere'};tu.zaino.push(eq[z.slot]);eq[z.slot]=null;return{s}}
  if(!l)return{err:'Devi essere in un luogo'};
  const dentro=s.dentro>=0,ost=l.faz!=='tu'&&nemiche(s,'tu',l.faz),mio=l.faz==='tu'||(l.sig===-2);
  if(z.a==='fonda')return fondaRegno(s,z,l,dentro,mio);
  if(z.a==='assalta'){if(!SITO[l.tipo])return{err:'Qui non c\'è nulla da assaltare'};if(!l.g.length)return{err:'Non c\'è più nessuno'};s.incontro={tipo:'assalto',lid:l.id};s.ev.push({t:'incontro'});return{s}}
  if(z.a==='assedia'){if(!ost||!MURA[l.tipo])return{err:'Non si può assediare'};s.assedio={lid:l.id,pronto:s.t+Math.max(4,P.ASSEDIO_ORE-abil(s,'comando'))*60,da:s.t,ariete:false};tu.ord={t:'aspetta',fino:s.assedio.pronto+60};L(s,'Cingete d\'assedio '+l.nome+': scale e arieti saranno pronti tra qualche ora.','guerra');return{s}}
  if(z.a==='razzia'){if(!ost||l.tipo!=='villaggio')return{err:'Non si può razziare'};if(l.sacc>giorno(s))return{err:'Non è rimasto nulla da prendere'};const oro=60+Math.round(l.prosp*2.2);tu.oro+=oro;tu.merci.grano=(tu.merci.grano||0)+6;
   l.sacc=giorno(s)+6;l.prosp=Math.max(5,l.prosp-20);l.rec=0;l.rel-=40;relaz(s,l.faz,-6);s.t+=180;L(s,'Mettete a sacco '+l.nome+': '+oro+' monete e sei sacchi di grano.','guerra');reagisci(s,'razzia');return{s}}
  if(!dentro)return{err:'Le porte sono chiuse'};
  if(z.a==='torneo'){if(!torneoOggi(s,l))return{err:'Oggi non c\'è torneo'};if(s.torneo)return{err:'Sei già iscritto'};if(s.torneoUsato&&s.torneoUsato[l.id]===giorno(s))return{err:'Hai già partecipato al torneo di oggi'};const posta=capi(s).reduce((a,x)=>a+D.TORNEO.posta*x.liv,0);if(tu.oro<posta)return{err:'Non hai abbastanza monete'};
   tu.oro-=posta;s.torneo={lid:l.id,turno:0,posta,giorno:giorno(s)};(s.torneoUsato=s.torneoUsato||{})[l.id]=giorno(s);L(s,'Ti iscrivi al torneo di '+l.nome+' per '+posta+' monete.');reagisci(s,'torneo');return{s,oro:-posta}}
  if(z.a==='lizza'){const t=s.torneo;if(!t||t.lid!==l.id)return{err:'Non sei iscritto a un torneo qui'};if(t.giorno!==giorno(s))return{err:'Il torneo è finito'};if(s.incontro)return{err:'Il duello ti aspetta'};s.incontro={tipo:'arena'};s.ev.push({t:'incontro'});return{s}}
  if(z.a==='ritira'){const t=s.torneo;if(!t||t.lid!==l.id)return{err:'Non sei iscritto a un torneo qui'};if(s.incontro&&s.incontro.tipo==='arena')s.incontro=null;const oro=chiudiTorneo(s,'Ti ritiri dal torneo di '+l.nome);return{s,oro}}
  if(z.a==='recluta'){if(l.tipo!=='villaggio')return{err:'Qui non si recluta'};const n=Math.max(1,z.n||1);if(l.rec<n)return{err:'Non ci sono abbastanza volontari'};if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};
   const f=D.REGNI.includes(l.faz)?l.faz:M0(s,l),t=f+'_'+(l.rel>=20&&r()<.4?'f2':'f1'),oro=D.INGAGGIO[1]*n;if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;l.rec-=n;aggiungi(tu.tr,t,n);return{s}}
  if(z.a==='compra'||z.a==='vendi'){if(!MERCATO[l.tipo])return{err:'Qui non c\'è mercato'};const m=z.m,n=Math.max(1,z.n||1);if(!D.MERCI[m])return{err:'Merce sconosciuta'};
   if(z.a==='compra'){if((l.scorte[m]||0)<n)return{err:'Non ne hanno abbastanza'};let tot=0;for(let k=0;k<n;k++){tot+=prezzo(s,l,m,1);l.scorte[m]--}if(tu.oro<tot){l.scorte[m]+=n;return{err:'Servono '+tot+' monete'}}tu.oro-=tot;tu.merci[m]=(tu.merci[m]||0)+n;return{s,oro:-tot}}
   if((tu.merci[m]||0)<n)return{err:'Non ne hai abbastanza'};let tot=0;for(let k=0;k<n;k++){tot+=prezzo(s,l,m,-1);l.scorte[m]=(l.scorte[m]||0)+1}tu.oro+=tot;tu.merci[m]-=n;if(!tu.merci[m])delete tu.merci[m];return{s,oro:tot}}
  if(z.a==='assolda'){if(!OSTERIA[l.tipo])return{err:'Qui non c\'è taverna'};const e=l.merc.find(e=>e.t===z.t),n=Math.max(1,z.n||1);if(!e||e.n<n)return{err:'Non ce ne sono abbastanza'};if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};
   const oro=D.INGAGGIO[D.TR[z.t].t]*n;if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;togliUomini(l.merc,z.t,n);aggiungi(tu.tr,z.t,n);return{s}}
  if(z.a==='compagno'){const co=D.COMPAGNI.find(x=>x.id===z.id);if(!co||s.compagni[co.id]!==l.id)return{err:'Non è qui'};if(tu.oro<co.costo)return{err:'Servono '+co.costo+' monete'};if(uomini(tu)+1>limite(s))return{err:'La compagnia è al completo'};
   tu.oro-=co.costo;s.compagni[co.id]=-1;aggiungi(tu.tr,co.id,1);if(s.grad)delete s.grad[co.id];gradDi(s,co.id);L(s,co.nome+' si unisce alla compagnia.','bene');return{s}}
  if(z.a==='compraogg'){const o=ogg(z.id),unica=l.unica===z.id;if(!o||(!l.bott.includes(z.id)&&!unica))return{err:'Qui non lo vendono'};const pz=prezzoOgg(s,o,1);if(tu.oro<pz)return{err:'Servono '+pz+' monete'};
   tu.oro-=pz;tu.zaino.push(z.id);if(unica)l.unica=null;else l.bott.splice(l.bott.indexOf(z.id),1);return{s,oro:-pz}}
  if(z.a==='vendiogg'){if(MURA[l.tipo]&&l.tipo!=='citta'||l.tipo==='villaggio'||SITO[l.tipo])return{err:'Qui nessuno compra roba simile'};const i=z.i|0,o=ogg(tu.zaino[i]);if(!o)return{err:'Oggetto sconosciuto'};const pz=prezzoOgg(s,o,-1);tu.oro+=pz;tu.zaino.splice(i,1);return{s,oro:pz}}
  if(z.a==='imbarca'){if(l.tipo!=='porto')return{err:'Qui non ci sono navi'};const a=s.l[z.lid];if(!a||a.tipo!=='porto'||a.id===l.id)return{err:'Rotta sconosciuta'};if(a.faz!=='tu'&&nemiche(s,'tu',a.faz))return{err:'Quel porto vi è nemico'};
   const oro=40+uomini(tu)*3;if(tu.oro<oro)return{err:'Servono '+oro+' monete per il passaggio'};tu.oro-=oro;tu.x=a.x;tu.y=a.y;tu.via=[];s.dentro=a.id;tu.ord={t:'aspetta',fino:s.t+Math.round(dist(l,a)*5)+120};L(s,'Vi imbarcate per '+a.nome+'.');return{s}}
  if(z.a==='cura'){if(l.tipo!=='monastero')return{err:'Qui non ci sono cerusici'};const fer=tu.tr.reduce((a,e)=>a+(e.f||0),0);if(!fer)return{err:'Nessun ferito'};const oro=fer*4;if(tu.oro<oro)return{err:'Servono '+oro+' monete di offerta'};tu.oro-=oro;for(const e of tu.tr)e.f=0;tu.mor=Math.min(100,tu.mor+4);reagisci(s,'cura');return{s}}
  if(z.a==='benedizione'){if(l.tipo!=='monastero')return{err:'Qui nessuno benedice'};if(l.bened>giorno(s))return{err:'La compagnia è già stata benedetta di recente'};if(tu.oro<80)return{err:'Servono 80 monete di offerta'};tu.oro-=80;l.bened=giorno(s)+7;s.slancio=Math.min(30,s.slancio+12);tu.mor=Math.min(100,tu.mor+8);return{s}}
  if(z.a==='voci'){if(l.tipo!=='locanda')return{err:'Qui nessuno chiacchiera'};if(tu.oro<25)return{err:'Servono 25 monete per un giro di vino'};const x=s.l.filter(q=>q.noto===false&&q.g.length).sort((a,b)=>dist(a,tu)-dist(b,tu))[0];
   // il torneo si sa sempre; un posto nascosto solo finché ce n'è qualcuno da raccontare
   tu.oro-=25;const tn=tornei(s)[0],dt='«A '+s.l[tn.lid].nome+' c\'è torneo '+quando(tn.giorni)+'.»';if(x)x.noto=true;
   L(s,l.oste+(x?' abbassa la voce: «'+x.nome+'. Io non ci andrei, ma tu hai l\'aria di chi ci va.» E aggiunge: '+dt:' non ha storie nuove, ma una la sa: '+dt),'bene');return x?{s,lid:x.id}:{s}}
  if(z.a==='riposa'){if((l.tipo==='villaggio'||SITO[l.tipo])&&!mio)return{err:'Qui non c\'è locanda'};const oro=mio?0:Math.ceil(uomini(tu)*(l.tipo==='locanda'||l.tipo==='monastero'?1:1.5));if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;for(const e of tu.tr)e.f=Math.max(0,(e.f||0)-Math.ceil(e.n*.5));tu.mor=Math.min(100,tu.mor+6);tu.ord={t:'aspetta',fino:s.t+8*60};return{s}}
  if(z.a==='riscatta'){if(!MURA[l.tipo])return{err:'Qui nessuno compra prigionieri'};let oro=0;for(const e of s.prig){if(e.sig!=null){const sg=s.sig[e.sig];oro+=350+(sg.re?450:0);sg.prig=null;const p=part(s,sg.pid);if(p)p.ia.t=s.t+P.GIORNO}else oro+=e.n*(12+D.TR[e.t].t*14)}
   if(!oro)return{err:'Non hai prigionieri'};s.prig=[];tu.oro+=oro;L(s,'Riscatti incassati: '+oro+' monete.','bene');reagisci(s,'riscatta');return{s,oro}}
  if(z.a==='incarico'){const q=l.inc;if(!q||q.preso)return{err:'Nessun incarico'};if(s.incarichi.filter(x=>!x.fatto&&!x.fallito).length>=4)return{err:'Hai già troppi incarichi'};
   const inc=Object.assign({id:s.uid++,da:l.id,scad:giorno(s)+q.giorni},q);if(q.tipo==='predoni'){const b=VEN.nascePredoni(s,r,[l.x,l.y]);b.cov=[l.x,l.y];inc.pid=b.id}if(q.tipo==='reliquia'||q.tipo==='taglia')s.l[q.a].noto=true;q.preso=true;s.incarichi.push(inc);return{s}}
  if(z.a==='consegna'){const q=s.incarichi.find(q=>!q.fatto&&!q.fallito&&(q.tipo==='consegna'&&q.a===l.id||q.tipo==='reclute'&&q.da===l.id));if(!q)return{err:'Niente da consegnare qui'};const da=s.l[q.da];
   if(q.tipo==='consegna'){if((tu.merci[q.bene]||0)<q.n)return{err:'Ti servono '+q.n+' di '+D.MERCI[q.bene].nome};tu.merci[q.bene]-=q.n;if(!tu.merci[q.bene])delete tu.merci[q.bene];l.scorte[q.bene]=(l.scorte[q.bene]||0)+q.n}
   else{let k=q.n;const buoni=tu.tr.filter(e=>D.TR[e.t].t>=2&&!D.TR[e.t].compagno&&!D.TR[e.t].faz.startsWith('mer'));if(buoni.reduce((a,e)=>a+e.n,0)<k)return{err:'Servono '+q.n+' soldati addestrati (non reclute)'};
    for(const e of buoni.sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t)){const x=Math.min(k,e.n);aggiungi(l.g,e.t,x);togliUomini(tu.tr,e.t,x);k-=x;if(!k)break}}
   q.fatto=true;tu.oro+=q.premio;da.inc=null;da.rel+=6;relaz(s,da.faz,4);s.fama+=4;if(l.sig>=0)memSig(s.sig[l.sig]).fav++;L(s,'Incarico compiuto: '+q.premio+' monete.','bene');return{s,oro:q.premio}}
  if(z.a==='contratto'){if(s.corona)return{err:'Un sovrano non serve nessuno'};if(!MURA[l.tipo]||!D.REGNI.includes(l.faz))return{err:'Qui non c\'è chi firma'};if(s.servizio)return{err:'Servi già un regno'};if(s.fama<P.FAMA_CONTRATTO&&!(s.lettere&&s.lettere[l.faz]>=giorno(s)))return{err:'Serve fama '+P.FAMA_CONTRATTO};if(s.rel[l.faz]<0)return{err:'Non si fidano di te'};
   s.servizio={faz:l.faz,tipo:'mer',fino:giorno(s)+28};L(s,'Firmi un contratto di ventura con '+D.FAZ[l.faz].nome+': quattro settimane di soldo.','bene');return{s}}
  if(z.a==='giura'){if(s.corona)return{err:'Un sovrano non serve nessuno'};if(!MURA[l.tipo]||!D.REGNI.includes(l.faz))return{err:'Qui non c\'è chi riceve giuramenti'};if(s.servizio&&s.servizio.tipo==='vas')return{err:'Hai già un sovrano'};if(s.fama<P.FAMA_VASSALLO)return{err:'Serve fama '+P.FAMA_VASSALLO};if(s.rel[l.faz]<10)return{err:'Serve più amicizia col regno'};
   if(s.l.some(x=>x.faz==='tu'))return{err:'Chi ha terre proprie non giura'};s.servizio={faz:l.faz,tipo:'vas'};const v=s.l.filter(x=>x.faz===l.faz&&x.tipo==='villaggio'&&x.sig!==-2).sort((a,b)=>a.prosp-b.prosp)[0];if(v){v.sig=-2;L(s,'Giuri fedeltà a '+D.FAZ[l.faz].re+': ti è dato in feudo '+v.nome+'.','bene')}return{s}}
  if(z.a==='lascia'){if(!s.servizio)return{err:'Non servi nessuno'};const f=s.servizio.faz;if(s.servizio.tipo==='vas')for(const sg of s.sig)if(sg.faz===f)memSig(sg).trad++;relaz(s,f,s.servizio.tipo==='vas'?-30:-8);for(const x of s.l)if(x.sig===-2&&x.faz===f)x.sig=x.capo>=0?s.l[x.capo].sig:-1;s.servizio=null;L(s,'Sciogli il tuo legame con '+D.FAZ[f].breve+'.');return{s}}
  if(z.a==='proponi'){const a=l.faz;if(!D.REGNI.includes(a)||l.tipo!=='citta')return{err:'Solo il re, nella sua capitale'};if(!dentro)return{err:'Devi essere dentro le mura'};
   const b=s.corona&&!s.servizio?'tu':z.f,p=proposta(s,z.tipo,a,b);if(p.err)return p;const k=chiave(a,b),g=giorno(s),A=D.FAZ[a].breve,B=nomeF(s,b);
   if(!p.ok)return{err:D.FAZ[a].re+' rifiuta: il conto dà '+p.tot+' (serve 0)'};
   if(z.tipo==='pace'){VEN.faiPace(s,a,b);relaz(s,a,3);L(s,'Per le tue parole '+A+' e '+B+' firmano la pace.','bene')}
   else if(z.tipo==='alleanza'){s.alleanza=s.alleanza||{};s.alleanza[k]={da:g,rompe:0};VEN.scioglieScontri(s,a,b);relaz(s,a,2);L(s,A+' e '+B+' stringono un\'alleanza, per le tue parole.','bene')}
   else if(z.tipo==='guerra'){s.guerra[k]=true;relaz(s,b,-10);L(s,A+' dichiara guerra a '+B+', su tua richiesta.','guerra')}
   else{const al=s.alleanza[k];al.rompe=Math.max(g+D.DIPL.PREAVVISO,al.da+D.DIPL.MIN);L(s,A+' annuncia la rottura dell\'alleanza con '+B+': finirà il giorno '+al.rompe+'.','guerra')}
   (s.parola=s.parola||{})[a]=g+D.DIPL.ATTESA;return{s}}
  if(z.a==='pace'){const f=l.faz;if(!D.REGNI.includes(f)&&f!=='tu')return{err:'Qui non si tratta'};const con=z.f||f;if(!(con in s.rel)||(s.corona?!inGuerra(s,'tu',con):s.rel[con]>-25))return{err:'Non siete in guerra'};const oro=400+Math.max(0,Math.round(-s.rel[con]*6));if(tu.oro<oro)return{err:'Servono '+oro+' monete di tributo'};tu.oro-=oro;s.rel[con]=Math.max(s.rel[con],-5);if(s.corona)VEN.faiPace(s,'tu',con);L(s,'Paghi un tributo di '+oro+' monete: pace con '+D.FAZ[con].breve+'.');return{s}}
  if(z.a==='guarnigione'){if(!mio||!MURA[l.tipo])return{err:'Non è una tua fortezza'};const n=Math.max(1,z.n||1);if(z.verso>0){if(togliUomini(tu.tr,z.t,n)<1)return{err:'Nessuno da lasciare'};aggiungi(l.g,z.t,n)}else{if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};const k=togliUomini(l.g,z.t,n);if(!k)return{err:'Nessuno da riprendere'};aggiungi(tu.tr,z.t,k)}return{s}}
  return{err:'Azione sconosciuta'}}
 const M0=(s,l)=>D.REGNI[mappa(s.seme).R[cella(mappa(s.seme),l.x,l.y)]];
 // traguardi: danno una direzione senza imporre una trama
 function traguardi(s){const mie=s.l.filter(l=>l.faz==='tu'||l.sig===-2);return[
  ['Venti uomini sotto lo stendardo',uomini(TU(s))>=20],['Fama 25: un contratto di ventura',s.fama>=25],['Cinque battaglie vinte',s.stat.vinte>=5],
  ['Fama 100: vassallo di un regno, o signore di te stesso',s.fama>=100],['Un covo di predoni stanato',s.stat.covi>0],['Un cimelio unico',capi(s).some(c=>indossa(c).some(o=>o.q===4))||TU(s).zaino.some(id=>D.OGG[id]&&D.OGG[id].q===4)],['Una terra tua',mie.length>0],['Una fortezza tua',mie.some(l=>MURA[l.tipo])],['Un regno caduto',Object.keys(s.cadute).length>0],['Un regno tuo',!!s.corona||!!s.vinta],['Tutte le capitali',!!s.vinta]]}
 const salva=s=>JSON.stringify(Object.assign({},s,{ev:[]}));
 function apri(tx){try{const s=typeof tx==='string'?JSON.parse(tx):tx;if(!s||!s.p||!s.l)return null;if(s.v===1)return migra(s);if(s.v!==2)return null;if(!s.alleanza)s.alleanza={};gradApri(s);vociApri(s);s.ev=[];mappa(s.seme);return s}catch(e){return null}}
 return{P,G,MURA,MERCATO,SITO,OSTERIA,MARE,COLLE,MONTE,ogg,indossa,somma,statCap,prezzoOgg,migra,assedioStato,capi,capDi,alt,mappa,via,libero,passa,cella,nuovo,ordina,passo,fai,scegli,voce,parla,accoda,EFF_VOCI,campo,esito,auto,torneoOggi,tornei,quando,premioTorneo,avversariTorneo,statArena,schieramenti,forza,forzaTr,uomini,sani,limite,limitePrig,razioni,carico,caricoMax,paga,rendite,velocita,vista,visibili,prezzo,abil,xpLiv,giorno,ora,notte,nemiche,ostile,inGuerra,alleate,alleatoDi,proposta,dominante,forzaRegno,lato,TU,part,traguardi,titoloInc,salva,apri,dist,nuovoCap,reagisci,umore,parte,confidenza,fazioni,nomeF,colFaz,renditaL,lealta,confinanti,vittoria,conquista,
  _:{D,G,L,M0,MERCATO,MURA,P,TU,abil,addii,aggiungi,alleate,alleatoDi,assalto,chiave,chiudiTorneo,cultura,debiti,dist,dominante,fazioni,forza,forzaTr,giorno,gradPaga,inGuerra,leva,limite,mappa,nemiche,nomeF,nuovaP,ostile,paga,part,reagisci,renditaL,rendite,rinnova,rnd,somma,titoloInc,togliUomini,uomini,via,vicinoOk,vista,vittoria,viva,vociDelGiorno}}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VEN;
