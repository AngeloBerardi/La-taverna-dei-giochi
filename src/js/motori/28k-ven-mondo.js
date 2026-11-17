/* ---- Compagnia di ventura (Cantari di Ventura, piano C): il mondo libero. Motore puro, senza DOM né rete. ----
   Una mappa continua (griglia nascosta G×G generata dal seme), tre regni con i loro signori che girano, si fanno guerra,
   razziano e assediano; predoni e carovane; villaggi dove reclutare, città con mercato e taverna, castelli da prendere.
   Chi gioca è il capitano di una compagnia: `ordina` dà la meta, `passo` fa scorrere i minuti, `fai` agisce nei luoghi,
   `scegli` risolve un incontro, `campo`/`esito` aprono e chiudono una battaglia (motore 28l, VCAM).
   Il tempo scorre solo dentro `passo`: un istante = un minuto di gioco. Lo stato è JSON; la mappa si rigenera dal seme.
   Mai `Math.random`, `Date.now` o trigonometria: solo + − × ÷ e radice, così telefoni diversi danno lo stesso mondo.
   Lo stato si modifica sul posto (come `ATEM` con `qui`). I numeri si ritoccano in `P` e in `VDAT` (28j).
   Nucleo (questo file): mappa, tempo, movimento, `ordina`, `passo`, salvataggio. Le estensioni aggiungono le loro funzioni allo stesso oggetto
   (`Object.assign(VEN,…)`) e prendono gli aiutanti interni da `VEN._`: 28ka IA, 28kb economia e `fai`, 28kc scontri, 28kd corte, 28ke gente.
   Una funzione di un altro file si chiama sempre `VEN.nome(...)`. Piano: docs/VENTURA.md.
   Ganci e punti d'estensione (passo 04): le novità si attaccano con `VEN.aggancia(nome,fn)` e il nucleo li chiama tutti con `VEN.ganci(nome,...)`, oppure col primo risultato con `VEN.chiedi(nome,...)` (scheda, esito, scelta, azione);
   `VEN.regni/rg/cult`, `VEN.mappaDi`, `VEN.molt`, `VEN.probCattura`, `VEN.decidi`, `VEN.opz` si possono sostituire componendo la versione precedente. */
const VEN=(()=>{
 const D=VDAT,G=128,MURA={citta:1,castello:1},MERCATO={citta:1,villaggio:1,porto:1},SITO={rovine:1,covo:1},OSTERIA={citta:1,locanda:1,porto:1};
 const P={VEL:2.6,VISTA:8,ORA:60,GIORNO:1440,CONTATTO:.55,CAPIENZA:20,PRED_MAX:16,ASSEDIO_ORE:10,ASSEDIO_IA_ORE:36,BRECCIA_ORE:72,ARIETE_ORE:6,ARIETE_ORO:150,MURA:1.6,PAGA_GIORNI:7,
  FAMA_CONTRATTO:25,FAMA_VASSALLO:100,ORO0:320};
 // ---------- ganci ----------
 // Gli ascoltatori si chiamano nell'ordine di registrazione (cioè del manifest). `ganci` li chiama TUTTI e ignora ciò che restituiscono
 // (giorno, ora, vedi, nuovo, luogo, fatto, premio, battaglia, effetto, scontro, incontro, anteprima).
 // `chiedi` è per i ganci che rispondono (scheda, esito, scelta, azione): ritorna il primo risultato che non è `undefined` né `null` e allora si ferma; per `scheda` conta solo un oggetto (un `sc.x=1` restituito non ferma gli altri).
 const GANCI={};
 function aggancia(nome,fn){(GANCI[nome]=GANCI[nome]||[]).push(fn)}
 function ganci(nome,...arg){const a=GANCI[nome];if(a)for(const fn of a.slice())fn(...arg)}
 function chiedi(nome,...arg){const a=GANCI[nome];if(!a)return undefined;for(const fn of a.slice()){const r=fn(...arg);if(r!=null&&(nome!=='scheda'||typeof r==='object'))return r}return undefined}
 // ---------- regni: il solo punto da cui si leggono D.FAZ e D.REGNI ----------
 // `regni(s)`: gli id dei regni (non 'tu'); `rg(s,f)`: la scheda di un regno o di una fazione {id,nome,breve,col,col2,re,motto,cult}, `s` può mancare; `cult(s,f)`: la cultura delle sue truppe.
 // Per un id che non è in D.FAZ né in `VEN.regni(s)` la scheda è quella di 'neu' con `ignota:true`: chi ha un suo ripiego (la vista del campo) lo riconosce da lì.
 const regni=s=>D.REGNI;
 const cult=(s,f)=>f;
 function rg(s,f){if(f==='tu'&&s&&s.corona){const t=D.REGNO.STENDARDI[s.corona.stend]||D.REGNO.STENDARDI[0];return{id:'tu',nome:s.corona.nome,breve:s.corona.nome,col:t.col,col2:t.col2,re:undefined,motto:undefined,cult:VEN.cult(s,f)}}
  const x=D.FAZ[f]||D.FAZ.neu,r={id:f,nome:x.nome,breve:x.breve,col:x.col,col2:x.col2,re:x.re,motto:x.motto,cult:VEN.cult(s,f)};
  if(!D.FAZ[f]&&!(s&&VEN.regni(s).includes(f)))r.ignota=true;return r}
 // ---------- punti d'estensione: i moltiplicatori valgono 1 finché nessuno li cambia ----------
 // k: viveri {p} · marcia {p,i} (0 = cella non percorribile) · prezzo {lid,m,compra} · paga · rendita {lid} · reclute {lid} · guerra {a,b} · forza {p} · vista
 const molt=(s,k,ctx)=>1;
 const probCattura=(s,riep)=>.5;
 const mappaDi=s=>mappa(s.seme);
 const opz=s=>Object.assign({},D.OPZ0,s.opz);
 // cambia in partita un'opzione elencata in VDAT.OPZ_PARTITA
 function opzione(s,z){const k=z&&z.k,v=z&&z.v;if(!D.OPZ_PARTITA.includes(k))return{err:'Questa opzione non si cambia in partita'};
  if(!(typeof v==='string'||typeof v==='number')||!Object.prototype.hasOwnProperty.call(D.DIFF[k]||{},v))return{err:'Valore non valido'};s.opz=Object.assign({},s.opz,{[k]:v});return{s}}
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
   let reg=0,best=1e9;regni().forEach((f,k)=>{const c=CENTRI[f],d=d2p(x,y,c[0]*G,c[1]*G);if(d<best){best=d;reg=k}});R[i]=reg;
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
  regni().forEach((f,reg)=>{const c=CENTRI[f],cx=c[0]*G,cy=c[1]*G;metti('citta',f,0,cerca(reg,(x,y,i)=>T[i]===1,(x,y)=>-d2p(x,y,cx,cy))||cerca(-1,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,14),(x,y)=>-d2p(x,y,cx,cy)))});
  const cittaDi=f=>L.find(l=>l.faz===f&&l.tipo==='citta');
  regni().forEach((f,reg)=>{const cit=cittaDi(f);for(let k=0;k<4;k++)
   metti('castello',f,k,cerca(reg,(x,y)=>lontano(x+.5,y+.5,9),(x,y,i)=>(T[i]===3?2:0)-Math.abs(d2p(x,y,cit.x,cit.y)-15)*.3)||cerca(-1,(x,y)=>lontano(x+.5,y+.5,7),(x,y)=>-d2p(x,y,cit.x,cit.y)*.2),cit.id)});
  regni().forEach((f,reg)=>{const capi=L.filter(l=>l.faz===f&&MURA[l.tipo]);for(let k=0;k<8;k++){const capo=capi[k%capi.length];
   metti('villaggio',f,k,cerca(reg,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,4.5),(x,y)=>-Math.abs(d2p(x,y,capo.x,capo.y)-5.5)*.5)||cerca(-1,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,4),(x,y)=>-d2p(x,y,capo.x,capo.y)),capo.id)}});
  regni().forEach((f,reg)=>{const cit=cittaDi(f);for(let k=0;k<(f==='mar'?2:1);k++)metti('porto',f,k,cerca(reg,(x,y,i)=>T[i]!==4&&mare(x,y)&&lontano(x+.5,y+.5,5),(x,y)=>-d2p(x,y,cit.x,cit.y)*.25),cit.id)});
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
 const cella=(M,x,y)=>{const G=M.G||128,cx=Math.max(0,Math.min(G-1,Math.floor(x))),cy=Math.max(0,Math.min(G-1,Math.floor(y)));return cy*G+cx};
 const passa=(M,x,y)=>x>=0&&y>=0&&x<(M.G||128)&&y<(M.G||128)&&M.ok[cella(M,x,y)]===1;
 const COSTO=[9,1,1.45,1.35,9];
 const costo=(M,i)=>M.S[i]?.72:COSTO[M.T[i]];
 function libero(M,x0,y0,x1,y1){const d=d2p(x0,y0,x1,y1),n=Math.ceil(d/.2);for(let k=1;k<=n;k++){const t=k/n;if(!passa(M,x0+(x1-x0)*t,y0+(y1-y0)*t))return false}return true}
 // A* a otto direzioni sulla griglia; restituisce l'elenco delle celle (dalla partenza all'arrivo) o null
 function aStar(M,x0,y0,x1,y1,strade){const G=M.G||128,a=cella(M,x0,y0),b=cella(M,x1,y1);if(a===b)return[a];
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
 function via(M,x0,y0,x1,y1){const G=M.G||128;if(!passa(M,x1,y1)){const v=vicinoOk(M,x1,y1);x1=v[0];y1=v[1]}
  if(libero(M,x0,y0,x1,y1))return[[x1,y1]];const c=aStar(M,x0,y0,x1,y1);if(!c)return[];
  const pt=c.map(i=>[(i%G)+.5,Math.floor(i/G)+.5]);pt[pt.length-1]=[x1,y1];const out=[];let px=x0,py=y0,k=0;
  while(k<pt.length){let j=Math.min(pt.length-1,k+7);while(j>k&&!libero(M,px,py,pt[j][0],pt[j][1]))j--;out.push(pt[j]);px=pt[j][0];py=pt[j][1];k=j+1}return out}
 function vicinoOk(M,x,y){const G=M.G||128;for(let r=0;r<12;r++)for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){const nx=Math.floor(x)+ox,ny=Math.floor(y)+oy;
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
 const fazioni=s=>s.corona?VEN.regni(s).concat(['tu']):VEN.regni(s);
 const viva=(s,f)=>f==='tu'?!!s.corona:!s.cadute[f];
 const nomeF=(s,f,lungo)=>{const r=VEN.rg(s,f);return lungo?r.nome:r.breve};
 const colFaz=(s,f)=>{const r=VEN.rg(s,f);return{col:r.col,col2:r.col2}};
 // la cultura delle truppe di un signore: quella d'origine se è passato a un altro stendardo
 const cultura=(s,p)=>(s.sig[p.sig]||{}).cult||p.faz;
 function nemiche(s,fa,fb){if(fa===fb)return false;if(fa==='pre'||fb==='pre')return true;if(fa==='mer'||fb==='mer')return false;
  if(fa==='tu'||fb==='tu'){const f=fa==='tu'?fb:fa;if(s.corona)return inGuerra(s,'tu',f);if(s.servizio){if(s.servizio.faz===f)return false;if(inGuerra(s,s.servizio.faz,f))return true}return(s.rel[f]||0)<=-25}
  return inGuerra(s,fa,fb)}
 const ostile=(s,a,b)=>nemiche(s,a.faz,b.faz);
 function relaz(s,f,d){if(!(f in s.rel))return;s.rel[f]=Math.max(-100,Math.min(100,s.rel[f]+d))}
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
 function nuovo(seme,o){o=o||{};seme=ADADI.u32(seme||1);
  const s={v:2,seme,rng:ADADI.semina(seme),t:8*60,uid:0,nome:o.compagnia||'Compagnia della Ventura',p:[],l:[],sig:[],guerra:{},alleanza:{},rel:{},servizio:null,incontro:null,
   dentro:-1,davanti:-1,assedio:null,scontri:[],prig:[],incarichi:[],log:[],ev:[],fama:0,slancio:0,stat:{vinte:0,perse:0,uccisi:0,covi:0,rovine:0},prigioniero:null,rotta:0,tregua:0,cadute:{},over:null,meteo:'sereno',
   cap:nuovoCap(o.nome||'Capitano'),soci:(o.soci||[]).slice(0,3).map(x=>nuovoCap(x&&x.nome||'Capitano'))};
  // opzioni di partita e mondo nuovo: vanno messi prima di generare la mappa (solo se chiesti, così i mondi di prima restano uguali)
  if(o.opz)s.opz=Object.assign({},o.opz);if((o.opz&&o.opz.geo===2)||(D.ACCESO&&D.ACCESO.mondo2))s.geo=2;
  const M=VEN.mappaDi(s),RG=VEN.regni(s);
  for(const f of RG)s.rel[f]=0;
  const r=rnd(s);
  // la tua compagnia parte accanto a un villaggio del regno scelto (o a caso)
  const f0=RG.includes(o.regno)?o.regno:RG[Math.floor(r()*RG.length)],vil=M.luoghi.filter(l=>l.faz===f0&&l.tipo==='villaggio')[0]||M.luoghi[0];
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
  RG.forEach((f,fi)=>{const mura=s.l.filter(l=>l.faz===f&&MURA[l.tipo]);D.NOMI.signori[f].forEach((nome,k)=>{const casa=mura[k%mura.length],sg={id:s.sig.length,nome,faz:f,casa:casa.id,pid:-1,prig:null,torna:0,re:k===0,tratto:D.TRATTI_ID[(k+fi*2)%D.TRATTI_ID.length],mem:{lib:0,sconf:0,trad:0,fav:0,g:-99}};
    s.sig.push(sg);if(casa.sig<0)casa.sig=sg.id;const p=nuovaP(s,'sig',f,nome,casa.x,casa.y,leva(f,(k===0?150:95)+r()*40,r),{oro:400,sig:sg.id,dentro:casa.id});sg.pid=p.id})});
  for(const l of s.l)if(!MURA[l.tipo]&&l.capo>=0)l.sig=s.l[l.capo].sig;
  // guerre di partenza: due, a caso
  {const cop=[];for(let i=0;i<RG.length;i++)for(let j=i+1;j<RG.length;j++)cop.push(chiave(RG[i],RG[j]));for(let k=0;k<2;k++)s.guerra[cop.splice(Math.floor(r()*cop.length),1)[0]]=true}
  // predoni, carovane, la rivale
  for(let k=0;k<9;k++)VEN.nascePredoni(s,r);for(const l of s.l)if(l.tipo==='citta'||l.tipo==='porto')VEN.nasceCarovana(s,l,r);
  {const c=s.l.filter(l=>l.tipo==='citta')[Math.floor(r()*RG.length)],v=vicinoOk(M,c.x+3,c.y+2),tr=leva('mer',120,r);aggiungi(tr,D.RIVALE.id,1);nuovaP(s,'riv','mer',D.RIVALE.compagnia,v[0],v[1],tr,{oro:500})}
  for(const l of s.l){VEN.rinnova(s,l,r)}
  s.compagni={};s.grad={};s.lettere={};s.debiti=[];{const conta={};for(const c of D.COMPAGNI){const posti=s.l.filter(l=>l.tipo===c.dove);conta[c.dove]=(conta[c.dove]||0)+1;s.compagni[c.id]=posti.length?posti[(conta[c.dove]*3+c.costo)%posti.length].id:-2}}
  VEN.voceInit(s);L(s,'La compagnia leva le tende presso '+vil.nome+'.');VEN.ganci('nuovo',s,o);s.ev=[];return s}
 // chi arriva da un salvataggio del mondo piccolo (v1) porta capitano, uomini e monete nel mondo nuovo
 function migra(v){const a=v.p[0],f0=((a.tr[0]||{}).t||'val_f1').slice(0,3),s=nuovo(v.seme,{nome:v.cap.nome,compagnia:v.nome,regno:f0}),tu=TU(s),c=s.cap,o=v.cap,feudi=v.l.filter(l=>l.faz==='tu'||l.sig===-2).length;
  tu.tr=a.tr.filter(e=>D.TR[e.t]);tu.oro=a.oro+feudi*400;tu.merci=a.merci||{};tu.mor=a.mor;s.fama=v.fama;s.stat.vinte=v.stat.vinte;s.stat.perse=v.stat.perse;
  c.liv=o.liv;c.xp=o.xp;c.punti=o.punti;c.ab=Object.assign({},c.ab,o.ab);c.eq.arma=['spada','bastarda','spadone','u_condottieri'][o.eq.arma]||'spada';c.eq.armatura=['giaco','maglia','piastre','u_margravio'][o.eq.armatura]||'giaco';c.eq.cavallo=[null,'ronzino','corsiero','destriero'][o.eq.cavallo]||null;
  for(const f of VEN.regni(s))if(v.rel[f]!=null)s.rel[f]=v.rel[f];for(const e of tu.tr)if(D.TR[e.t].compagno)s.compagni[e.t]=-1;
  L(s,'La compagnia varca i vecchi confini: il mondo è più grande di come lo ricordava.','bene');s.ev=[];return s}
 // ---------- numeri della compagnia ----------
 const abil=(s,k)=>capi(s).reduce((m,c)=>Math.max(m,c.ab[k]),0)+capi(s).reduce((a,c)=>a+indossa(c).reduce((x,o)=>x+(o.ab&&o.ab[k]||0),0),0)+TU(s).tr.reduce((a,e)=>a+(D.TR[e.t].compagno===k&&e.n-(e.f||0)>0?(s.grad&&s.grad[e.t]&&s.grad[e.t].piu?3:2):0),0);
 const limite=s=>P.CAPIENZA+abil(s,'comando')*5+Math.floor(s.fama/20)+(s.soci?s.soci.length*6:0);
 const limitePrig=s=>6+abil(s,'comando')*3;
 const xpLiv=l=>60*l*(l+1)/2;
 function velocita(s,p){const M=VEN.mappaDi(s),i=cella(M,p.x,p.y),n=uomini(p);let cav=0;for(const e of p.tr)if(D.TR[e.t].c==='c')cav+=e.n;
  let v=P.VEL-Math.min(1.1,n/90)+(n?cav/n*.7:0);if(p.k==='tu')v+=abil(s,'esplora')*.08+(capi(s).reduce((m,c)=>Math.min(m,(ogg(c.eq.cavallo)||{}).vel||10),99)-10)*.024-Math.max(0,VEN.carico(p)-VEN.caricoMax(s))*.02;
  if(p.k==='car')v=1.9;if(p.k==='pre')v-=.15;v=Math.max(.8,v)/costo(M,i);if(notte(s))v*=.82;if(s.meteo==='pioggia')v*=.9;return v*VEN.molt(s,'marcia',{p,i})}
 const vista=s=>(P.VISTA+abil(s,'esplora')*.5)*(notte(s)?.65:1)*(s.meteo==='nebbia'?.6:1)*VEN.molt(s,'vista',{});
 function visibili(s){const tu=TU(s),v=vista(s);return s.p.filter(p=>p.id&&p.dentro<0&&dist(p,tu)<=v)}
 // ---------- ordini ----------
 function ordina(s,o){if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};const tu=TU(s),M=VEN.mappaDi(s);if(s.incontro)return{err:'Prima decidi cosa fare dell\'incontro'};if(s.prigioniero)return{err:'Sei prigioniero'};if(s.rotta>s.t&&o.t!=='aspetta')return{err:'La compagnia si sta riordinando'};
  if(s.assedio&&o.t!=='aspetta')s.assedio=null;
  s.dentro=-1;s.davanti=-1;
  if(o.t==='ferma'){tu.ord=null;tu.via=[];return{s}}
  if(o.t==='aspetta'){tu.ord={t:'aspetta',fino:s.t+Math.max(1,o.ore||1)*60};tu.via=[];return{s}}
  if(o.t==='vai'){if(!(o.x>=0&&o.y>=0&&o.x<(M.G||G)&&o.y<(M.G||G)))return{err:'Fuori dalla mappa'};const v=via(M,tu.x,tu.y,o.x,o.y);if(!v.length)return{err:'Non c\'è una via fin lì'};tu.ord={t:'vai'};tu.via=v;return{s}}
  if(o.t==='entra'){const l=s.l[o.lid];if(!l)return{err:'Luogo sconosciuto'};const v=via(M,tu.x,tu.y,l.x,l.y);if(!v.length&&dist(tu,l)>.6)return{err:'Non c\'è una via fin lì'};tu.ord={t:'entra',lid:l.id};tu.via=v;return{s}}
  if(o.t==='segui'){const p=part(s,o.pid);if(!p||p.dentro>=0)return{err:'Non si vede più'};tu.ord={t:'segui',pid:p.id,n:0};tu.via=via(M,tu.x,tu.y,p.x,p.y);return{s}}
  return{err:'Ordine sconosciuto'}}
 function muovi(s,p){if(!p.via.length)return false;const v=velocita(s,p)/60,ox=p.x,oy=p.y;let resto=v;
  while(resto>0&&p.via.length){const w=p.via[0],d=d2p(p.x,p.y,w[0],w[1]);if(d<=resto){p.x=w[0];p.y=w[1];p.via.shift();resto-=d}else{p.x+=(w[0]-p.x)/d*resto;p.y+=(w[1]-p.y)/d*resto;resto=0}}
  if(!passa(VEN.mappaDi(s),p.x,p.y)){p.x=ox;p.y=oy;p.via=[]}return true}
 // ---------- il tempo ----------
 function passo(s,n){s.ev=[];const M=VEN.mappaDi(s),tu=TU(s);n=n||1;
  for(let k=0;k<n;k++){if(s.incontro||s.over)break;if(s.rac&&s.rac.scena)break;
   if(s.voci&&s.voci.length&&s.dentro<0&&s.davanti<0&&VEN.avviaVoce(s))break;
   if(s.dentro>=0||s.davanti>=0){if(!(tu.ord&&tu.ord.t==='aspetta'))break}
   s.t++;
   // chi gioca
   if(s.prigioniero){if(s.t>=s.prigioniero.fino)VEN.libera(s)}
   else if(tu.ord){const o=tu.ord;
    if(o.t==='aspetta'){if(s.t>=o.fino){tu.ord=null;s.ev.push({t:'fine-attesa'})}}
    else{if(o.t==='segui'){const b=part(s,o.pid);if(!b||b.dentro>=0||dist(b,tu)>vista(s)+2){tu.ord=null;tu.via=[]}else if(++o.n%12===0||!tu.via.length)tu.via=via(M,tu.x,tu.y,b.x,b.y)}
     muovi(s,tu);
     if(tu.ord&&!tu.via.length){if(o.t==='entra'){const l=s.l[o.lid];tu.ord=null;if(dist(tu,l)<.8)arriva(s,l)}else if(o.t==='vai')tu.ord=null}}}
   // gli altri
   for(const p of s.p){if(p.id===0)continue;if(p.dentro<0&&!p.fermo)muovi(s,p);if((s.t+p.id*7)%20===0)VEN.decidi(s,p,M)}
   if(!s.prigioniero)contatti(s);
   if(s.t%P.ORA===0)VEN.oraNuova(s);
   if(s.t%P.GIORNO===0)VEN.giornoNuovo(s)}
  return s.ev}
 function arriva(s,l){const tu=TU(s);tu.via=[];if(l.faz!=='tu'&&nemiche(s,'tu',l.faz)){s.davanti=l.id;s.ev.push({t:'davanti',lid:l.id})}else{s.dentro=l.id;s.ev.push({t:'dentro',lid:l.id});VEN.avanzaInc(s,'arriva',l)}}
 // scontri a vista: predoni e nemici che ti raggiungono, o che raggiungi tu
 function contatti(s){const tu=TU(s);if(s.dentro>=0||s.rotta>s.t)return;
  for(const sc of s.scontri)if(d2p(tu.x,tu.y,sc.x,sc.y)<.8&&tu.ord&&!sc.visto){sc.visto=true;tu.ord=null;tu.via=[];s.incontro={tipo:'mischia',sc:sc.id};s.ev.push({t:'incontro'});return}
  for(const p of s.p){if(p.id===0||p.dentro>=0||p.sc)continue;const d=dist(p,tu);if(d>P.CONTATTO)continue;const cerco=tu.ord&&tu.ord.t==='segui'&&tu.ord.pid===p.id;
   if(ostile(s,p,tu)){if(cerco||(p.ia&&p.ia.st==='caccia'&&p.ia.b===0&&!(s.tregua>s.t))){const amici=s.p.filter(q=>q.id&&q.dentro<0&&!q.sc&&q.id!==p.id&&dist(q,tu)<2.2);
      tu.ord=null;tu.via=[];s.incontro={tipo:'nemico',pid:[p.id].concat(amici.filter(q=>ostile(s,q,tu)&&!ostile(s,q,p)).map(q=>q.id)),all:amici.filter(q=>!ostile(s,q,tu)&&ostile(s,q,p)&&q.k==='sig').map(q=>q.id),da:cerco?'tu':'loro'};
      VEN.ganci('incontro',s,s.incontro);s.ev.push({t:'incontro'});return}}
   else if(cerco){tu.ord=null;tu.via=[];s.incontro={tipo:'parla',pid:[p.id],all:[]};s.ev.push({t:'incontro'});return}}}
 const M0=(s,l)=>VEN.regni(s)[VEN.mappaDi(s).R[cella(VEN.mappaDi(s),l.x,l.y)]];
 // traguardi: danno una direzione senza imporre una trama
 function traguardi(s){const mie=s.l.filter(l=>l.faz==='tu'||l.sig===-2);return[
  ['Venti uomini sotto lo stendardo',uomini(TU(s))>=20],['Fama 25: un contratto di ventura',s.fama>=25],['Cinque battaglie vinte',s.stat.vinte>=5],
  ['Fama 100: vassallo di un regno, o signore di te stesso',s.fama>=100],['Un covo di predoni stanato',s.stat.covi>0],['Un cimelio unico',capi(s).some(c=>indossa(c).some(o=>o.q===4))||TU(s).zaino.some(id=>D.OGG[id]&&D.OGG[id].q===4)],['Una terra tua',mie.length>0],['Una fortezza tua',mie.some(l=>MURA[l.tipo])],['Un regno caduto',Object.keys(s.cadute).length>0],['Un regno tuo',!!s.corona||!!s.vinta],['Tutte le capitali',!!s.vinta]]}
 const salva=s=>JSON.stringify(Object.assign({},s,{ev:[]}));
 function apri(tx){try{const s=typeof tx==='string'?JSON.parse(tx):tx;if(!s||!s.p||!s.l)return null;if(s.v===1)return migra(s);if(s.v!==2)return null;if(!s.alleanza)s.alleanza={};VEN.gradApri(s);VEN.vociApri(s);s.ev=[];VEN.mappaDi(s);return s}catch(e){return null}}
 return{P,G,MURA,MERCATO,SITO,OSTERIA,MARE,COLLE,MONTE,ogg,indossa,somma,statCap,migra,capi,capDi,alt,mappa,via,libero,passa,cella,nuovo,ordina,passo,forza,forzaTr,uomini,sani,limite,limitePrig,velocita,vista,visibili,abil,xpLiv,giorno,ora,notte,nemiche,ostile,inGuerra,alleate,alleatoDi,lato,TU,part,traguardi,salva,apri,dist,nuovoCap,fazioni,nomeF,colFaz,
  aggancia,ganci,chiedi,regni,rg,cult,molt,probCattura,mappaDi,opz,opzione,
  _:{D,G,L,M0,MERCATO,MURA,OSTERIA,P,SITO,TU,abil,aggiungi,alleate,alleatoDi,capDi,capi,cella,chiave,colFaz,cultura,dist,fazioni,forza,forzaTr,giorno,inGuerra,lato,leva,limite,limitePrig,mappa,nemiche,nomeF,notte,nuovaP,ogg,ostile,part,relaz,rnd,somma,statCap,togliUomini,uomini,via,vicinoOk,vista,viva,xpLiv}}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VEN;
