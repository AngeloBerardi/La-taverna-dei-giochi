const SAB=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));
const N=1,E=2,S=4,W=8,DIRS=[[N,0,-1],[E,1,0],[S,0,1],[W,-1,0]],OPP={1:4,2:8,4:1,8:2};
const rot=m=>((m&1)<<2)|((m&4)>>2)|((m&2)<<2)|((m&8)>>2);
const C={};let ix=0;const add=(k,o,n)=>{for(let i=0;i<n;i++)C[k+String(++ix).padStart(3,'0')]=o};
/* --- percorsi base (40) --- */
add('P',{segs:[N|E|S|W]},5);add('P',{segs:[N|S|E]},5);add('P',{segs:[E|W|N]},5);add('P',{segs:[N|S]},4);add('P',{segs:[E|W]},3);add('P',{segs:[S|E]},4);add('P',{segs:[S|W]},5);
add('P',{segs:[S],dead:1},1);add('P',{segs:[E],dead:1},1);add('P',{segs:[N,E,S,W],dead:1},1);add('P',{segs:[N,S,E],dead:1},1);add('P',{segs:[E,W,N],dead:1},1);
add('P',{segs:[N,S],dead:1},1);add('P',{segs:[E,W],dead:1},1);add('P',{segs:[S,E],dead:1},1);add('P',{segs:[S,W],dead:1},1);
/* --- azioni base (27) --- */
const TOOLS=['pick','lamp','cart'];
TOOLS.forEach(t=>add('A',{a:'break',tool:t},3));TOOLS.forEach(t=>add('A',{a:'fix',tools:[t]},2));[['pick','lamp'],['pick','cart'],['lamp','cart']].forEach(ts=>add('A',{a:'fix',tools:ts},1));
add('A',{a:'map'},6);add('A',{a:'rock'},3);
const BASE=Object.keys(C);
/* --- Saboteur 2: 30 percorsi (forme ricostruite) + 20 azioni --- */
add('Q',{segs:[N|S,E|W],bridge:1},2);add('Q',{segs:[N|E,S|W]},1);add('Q',{segs:[N|W,S|E]},1);
add('Q',{segs:[N|E|S|W],ladder:1},1);add('Q',{segs:[E|W|S],ladder:1},1);add('Q',{segs:[S|E],ladder:1},1);add('Q',{segs:[E|W],ladder:1},1);
[['g',1],['b',2]].forEach(([d])=>{add('Q',{segs:[E|W],door:d},1);add('Q',{segs:[E|W|N],door:d},1);add('Q',{segs:[N|E|S|W],door:d},1)});
add('Q',{segs:[N|E,S]},2);add('Q',{segs:[E|W,N]},2);add('Q',{segs:[N|S,W]},2);
add('Q',{segs:[N|E|S|W],cry:1},2);add('Q',{segs:[N|S|E],cry:1},2);add('Q',{segs:[E|W],cry:1},2);add('Q',{segs:[S|W],cry:1},2);add('Q',{segs:[N|S],cry:2},2);
add('B',{a:'trap'},3);add('B',{a:'free'},4);add('B',{a:'theft'},4);add('B',{a:'handsoff'},3);add('B',{a:'hats'},2);add('B',{a:'inspect'},2);add('B',{a:'swap'},2);
const EXP=Object.keys(C).filter(k=>!BASE.includes(k));
C.START={segs:[N|E|S|W],start:1,ladder:1};C.GOLD={segs:[N|E|S|W],goal:'gold'};C.COAL1={segs:[S|W],goal:'coal'};C.COAL2={segs:[N|W],goal:'coal'};
const segsOf=(id,r)=>C[id].segs.map(m=>r?rot(m):m);const edgesOf=(id,r)=>segsOf(id,r).reduce((a,b)=>a|b,0);
const isPath=id=>!!C[id]&&!!C[id].segs&&!C[id].goal&&!C[id].start;
const key=(x,y)=>x+','+y;
const L=(s,t)=>{s.log.push(t);if(s.log.length>80)s.log.shift()};const E2=(s,o)=>s.ev.push(o);
const ROLE_BASE={3:[1,3],4:[1,4],5:[2,4],6:[2,5],7:[3,5],8:[3,6],9:[3,7],10:[4,7]};
const HAND=n=>n<=5?6:n<=7?5:4;
const RN={dig:'Cercatore',sab:'Sabotatore',blue:'Cercatore blu',green:'Cercatore verde',boss:'Capo',prof:'Profittatore',geo:'Geologo'};
const TN={pick:'piccone',lamp:'lanterna',cart:'carrello'};
/* raggiungibilità dal punto di partenza (e dalle scale): stati (cella, gruppo, porte) */
function reach(s){const B=s.board,seen=new Set(),q=[],res={};
 const push=(x,y,si,dm)=>{const k=key(x,y)+'|'+si+'|'+dm;if(seen.has(k))return;seen.add(k);q.push([x,y,si,dm])};
 for(const k in B){const c=B[k];if(C[c.id].ladder){const[x,y]=k.split(',').map(Number);segsOf(c.id,c.r).forEach((_,si)=>push(x,y,si,0))}}
 while(q.length){const[x,y,si,dm]=q.shift();const c=B[key(x,y)];const m=segsOf(c.id,c.r)[si];const door=C[c.id].door,dm2=dm|(door==='g'?1:door==='b'?2:0);
  const kk=key(x,y);res[kk]=res[kk]||{};(res[kk][si]=res[kk][si]||new Set()).add(dm2);
  for(const[d,dx,dy]of DIRS){if(!(m&d))continue;const nx=x+dx,ny=y+dy,nb=B[key(nx,ny)];if(!nb||nb.hidden)continue;const ss=segsOf(nb.id,nb.r);const j=ss.findIndex(t=>t&OPP[d]);if(j>=0)push(nx,ny,j,dm2)}}
 return res}
function reachedEdges(s,R){const out={};for(const k in R){const c=s.board[k];const ss=segsOf(c.id,c.r);let m=0;for(const si in R[k])m|=ss[si];out[k]=m}return out}
function canPlace(s,id,x,y,r,RE){if(!isPath(id))return false;const k=key(x,y);if(s.board[k])return false;const e=edgesOf(id,r);let touch=false,linked=false;
 for(const[d,dx,dy]of DIRS){const nb=s.board[key(x+dx,y+dy)];if(!nb)continue;if(nb.hidden){continue}touch=true;const ne=edgesOf(nb.id,nb.r);if(!!(e&d)!==!!(ne&OPP[d]))return false;
  if((e&d)&&RE&&RE[key(x+dx,y+dy)]&OPP[d])linked=true}
 if(!touch)return false;if(C[id].ladder)return true;return linked}
function placements(s,id){if(!isPath(id))return[];const RE=reachedEdges(s,reach(s)),out=[],cand=new Set();
 for(const k in s.board){const[x,y]=k.split(',').map(Number);for(const[,dx,dy]of DIRS)cand.add(key(x+dx,y+dy))}
 for(const k of cand){const[x,y]=k.split(',').map(Number);for(const r of[0,1])if(canPlace(s,id,x,y,r,RE))out.push({x,y,r})}return out}
function dealRound(s){s.round++;const n=s.n;
 let roles;if(s.exp){roles=shuffle(['blue','blue','blue','blue','green','green','green','green','boss','prof','geo','geo','sab','sab','sab'])}
 else{const[sb,dg]=ROLE_BASE[n];roles=shuffle([...Array(sb).fill('sab'),...Array(dg).fill('dig')])}
 s.roles=roles.slice(0,n);s.aside=roles.slice(n);
 s.deck=shuffle([...BASE,...(s.exp?EXP:[])]);s.hands=Array.from({length:n},()=>s.deck.splice(0,HAND(n)));
 const goals=shuffle(['GOLD','COAL1','COAL2']);s.board={};s.board[key(0,0)]={id:'START',r:0};
 [-2,0,2].forEach((y,i)=>{s.board[key(8,y)]={id:goals[i],r:0,hidden:1}});
 s.broken=Array.from({length:n},()=>({}));s.trap=Array(n).fill(false);s.theft=Array(n).fill(0);s.priv=Array.from({length:n},()=>[]);
 s.phase='play';s.res=null;s.lastPath=null;s.finder=null;s.cur=s.startNext!=null?s.startNext:0;s.passRun=0;
 L(s,'Round '+s.round+': ruoli distribuiti');E2(s,{t:'deal'})}
function nextTurn(s){for(let k=1;k<=s.n;k++){const p=(s.cur+k)%s.n;if(s.hands[p].length){s.cur=p;return}}endRound(s,null)}
function reveal(s){const R=reach(s),RE=reachedEdges(s,R);let gold=false;
 for(const k in s.board){const g=s.board[k];if(!g.hidden)continue;const[x,y]=k.split(',').map(Number);let inc=0;
  for(const[d,dx,dy]of DIRS){if(RE[key(x+dx,y+dy)]&OPP[d])inc|=d}
  if(!inc)continue;delete g.hidden;g.r=0;if(!(edgesOf(g.id,0)&inc))g.r=1;E2(s,{t:'goal',x,y,gold:C[g.id].goal==='gold'});L(s,'Raggiunta una meta: '+(C[g.id].goal==='gold'?'ORO!':'solo carbone'));if(C[g.id].goal==='gold')gold=true}
 return gold}
function doorMasksToGold(s){const R=reach(s);for(const k in s.board){if(s.board[k].id==='GOLD'&&!s.board[k].hidden){const out=new Set();Object.values(R[k]||{}).forEach(st=>st.forEach(m=>out.add(m)));return[...out]}}return[]}
function endRound(s,finder){s.phase='summary';const n=s.n,gold=Array(n).fill(0),win=[];let txt;
 if(!s.exp){const sabs=[...Array(n).keys()].filter(p=>s.roles[p]==='sab'),digs=[...Array(n).keys()].filter(p=>s.roles[p]==='dig');
  if(finder!=null){const k=Math.min(n,9),cards=s.pool.splice(0,k);let order=[],p=finder;for(let i=0;i<n;i++){const q=(finder-i+n)%n;if(s.roles[q]==='dig')order.push(q)}
   if(!order.length)order=digs;s.phase='gold';s.gp={cards:cards.sort((a,b)=>b-a),order,i:0};s.cur=order[0];win.push(...digs);txt='I cercatori trovano l’oro!'}
  else{const v=sabs.length===1?4:sabs.length<=3?3:2;sabs.forEach(p=>gold[p]=v);win.push(...sabs);txt=sabs.length?'I sabotatori vincono: l’oro resta sepolto':'Nessuno trova l’oro'}}
 else{const masks=finder!=null?doorMasksToGold(s):[],fr=finder!=null?s.roles[finder]:null;
  const blueOk=masks.some(m=>!(m&1)),greenOk=masks.some(m=>!(m&2));
  for(let p=0;p<n;p++){const r=s.roles[p];
   if(r==='prof')win.push(p);else if(finder==null){if(r==='sab')win.push(p)}
   else if(r==='boss')win.push(p);else if(r==='blue'&&(fr==='blue'?blueOk:fr==='green'?false:blueOk))win.push(p);else if(r==='green'&&(fr==='green'?greenOk:fr==='blue'?false:greenOk))win.push(p)}
  const per=[0,5,4,3,2][win.length]??1;win.forEach(p=>{let v=per;if(s.roles[p]==='boss')v-=1;if(s.roles[p]==='prof')v-=2;gold[p]=Math.max(0,v)});
  const geos=[...Array(n).keys()].filter(p=>s.roles[p]==='geo');if(geos.length){let cr=0;for(const k in s.board){const c=C[s.board[k].id];if(c.cry&&!s.board[k].hidden)cr+=c.cry}const v=Math.floor(cr/geos.length);geos.forEach(p=>gold[p]+=v)}
  for(let p=0;p<n;p++)if(s.trap[p])gold[p]=0;
  txt=finder!=null?'Oro trovato da '+s.names[finder]:'L’oro resta sepolto'}
 s.res={gold,win,txt,finder,roles:s.roles.slice()};s.startNext=((s.lastPath??s.cur)+1)%n;
 if(s.phase!=='gold')finishRound(s);E2(s,{t:'round',finder});L(s,txt)}
function finishRound(s){const g=s.res.gold;g.forEach((v,p)=>s.score[p]+=v);
 if(s.exp){const thieves=[...Array(s.n).keys()].filter(p=>s.theft[p]&&!s.trap[p]);for(const t of thieves)for(let k=0;k<s.theft[t];k++){const vs=[...Array(s.n).keys()].filter(p=>p!==t&&s.score[p]>0).sort((a,b)=>s.score[b]-s.score[a]);if(vs.length){s.score[vs[0]]--;s.score[t]++;s.res.steal=(s.res.steal||[]).concat([[t,vs[0]]])}}}
 s.phase='summary';if(s.round>=3){const mx=Math.max(...s.score),ws=s.score.map((v,i)=>v===mx?i:-1).filter(i=>i>=0);s.over={scores:s.score.slice(),win:ws.length===1?ws[0]:null,winners:ws};E2(s,{t:'win'})}else s.cur=s.startNext}
const SAB={id:'saboteur',name:'Saboteur',ok:n=>n>=3&&n<=10,C,TOOLS,TN,RN,placements,reach,reachedEdges,segsOf,edgesOf,isPath,canPlace,key,
 newGame(n,names,opts={}){const s={g:'saboteur',n,names:names.slice(0,n),exp:opts.exp==='sab2',round:0,score:Array(n).fill(0),pool:shuffle([...Array(16).fill(1),...Array(8).fill(2),...Array(4).fill(3)]),startNext:0,log:[],ev:[],evn:0,over:null,teams:n};dealRound(s);return s},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];const p=s.cur,h=s.hands[p],nm=s.names[p];const ok=()=>{s.evn=(s.evn||0)+1;return{s}};
  if(a.t==='next'){if(s.phase!=='summary')return{err:'Non ora'};dealRound(s);return ok()}
  if(a.t==='gold'){if(s.phase!=='gold')return{err:'Non ora'};const gp=s.gp;if(!(a.i>=0&&a.i<gp.cards.length))return{err:'Scegli una pepita'};const v=gp.cards.splice(a.i,1)[0];s.res.gold[p]+=v;E2(s,{t:'nugget',p,v});L(s,nm+' prende una pepita da '+v);
   if(gp.cards.length){gp.i=(gp.i+1)%gp.order.length;s.cur=gp.order[gp.i];return ok()}s.gp=null;finishRound(s);return ok()}
  if(s.phase!=='play')return{err:'Non ora'};
  const card=a.c;if(a.t!=='pass'&&!h.includes(card))return{err:'Carta non valida'};const K=card&&C[card];
  const use=()=>{h.splice(h.indexOf(card),1)};const draw=()=>{if(s.deck.length)h.push(s.deck.pop())};
  const tgt=a.to;const validT=tgt>=0&&tgt<s.n;
  if(a.t==='path'){if(!isPath(card))return{err:'Non è una carta percorso'};if(Object.values(s.broken[p]).some(Boolean))return{err:'Hai un attrezzo rotto: non puoi scavare'};if(s.trap[p])return{err:'Sei imprigionato: non puoi scavare'};
   const RE=reachedEdges(s,reach(s));if(!canPlace(s,card,a.x,a.y,a.r?1:0,RE))return{err:'Qui la galleria non si collega'};
   use();s.board[key(a.x,a.y)]={id:card,r:a.r?1:0};s.lastPath=p;E2(s,{t:'path',p,x:a.x,y:a.y});L(s,nm+' scava una galleria');
   if(reveal(s)){draw();endRound(s,p);return ok()}}
  else if(a.t==='rock'){if(K.a!=='rock')return{err:'Carta non valida'};const k=key(a.x,a.y),b=s.board[k];if(!b||!isPath(b.id))return{err:'Scegli una galleria da far crollare'};delete s.board[k];use();E2(s,{t:'rock',x:a.x,y:a.y});L(s,nm+' provoca una frana')}
  else if(a.t==='map'){if(K.a!=='map')return{err:'Carta non valida'};const b=s.board[key(8,a.y)];if(!b||!b.hidden)return{err:'Scegli una meta coperta'};use();s.priv[p].push('Mappa: la meta '+({'-2':'in alto','0':'al centro','2':'in basso'})[a.y]+' è '+(C[b.id].goal==='gold'?'l’ORO':'carbone'));E2(s,{t:'map',p,y:a.y});L(s,nm+' consulta una mappa')}
  else if(a.t==='act'){if(!validT)return{err:'Scegli un giocatore'};const A=K.a;
   if(A==='break'){if(s.broken[tgt][K.tool])return{err:'Ha già il '+TN[K.tool]+' rotto'};s.broken[tgt][K.tool]=true;L(s,nm+' rompe il '+TN[K.tool]+' di '+s.names[tgt])}
   else if(A==='fix'){const t=a.tool&&K.tools.includes(a.tool)?a.tool:K.tools.find(x=>s.broken[tgt][x]);if(!t||!s.broken[tgt][t])return{err:'Niente da riparare con questa carta'};s.broken[tgt][t]=false;L(s,nm+' ripara il '+TN[t]+' di '+s.names[tgt])}
   else if(A==='trap'){if(s.trap[tgt])return{err:'È già imprigionato'};s.trap[tgt]=true;L(s,nm+' imprigiona '+s.names[tgt])}
   else if(A==='free'){if(!s.trap[tgt])return{err:'Non è imprigionato'};s.trap[tgt]=false;L(s,nm+' libera '+s.names[tgt])}
   else if(A==='theft'){if(tgt!==p)return{err:'Il furto si gioca davanti a te'};s.theft[p]++;L(s,nm+' prepara un furto')}
   else if(A==='handsoff'){if(!s.theft[tgt])return{err:'Non ha un furto'};s.theft[tgt]--;L(s,nm+' ferma il furto di '+s.names[tgt])}
   else if(A==='hats'){if(!s.aside.length)return{err:'Nessun ruolo disponibile'};const i=Math.floor(RND()*s.aside.length);[s.roles[tgt],s.aside[i]]=[s.aside[i],s.roles[tgt]];s.priv[tgt].push('Cambio cappello: ora sei '+RN[s.roles[tgt]]);L(s,nm+' fa cambiare cappello a '+s.names[tgt])}
   else if(A==='inspect'){if(tgt===p)return{err:'Scegli un altro giocatore'};s.priv[p].push('Ispezione: '+s.names[tgt]+' è '+RN[s.roles[tgt]]);L(s,nm+' ispeziona '+s.names[tgt])}
   else if(A==='swap'){if(tgt===p)return{err:'Scegli un altro giocatore'};use();const t=s.hands[tgt];s.hands[tgt]=h.slice();s.hands[p]=t;L(s,nm+' scambia la mano con '+s.names[tgt]);E2(s,{t:'act',p,to:tgt,a:A});if(s.deck.length)s.hands[p].push(s.deck.pop());nextTurn(s);return ok()}
   else return{err:'Carta non valida'};
   use();E2(s,{t:'act',p,to:tgt,a:A})}
  else if(a.t==='pass'){if(h.length){if(!h.includes(card))return{err:'Scegli la carta da scartare'};use()}E2(s,{t:'pass',p});L(s,nm+' passa')}
  else return{err:'Azione sconosciuta'};
  draw();if(!s.deck.length&&s.hands.every(x=>!x.length)){endRound(s,null);return ok()}nextTurn(s);return ok()},
 setRnd:f=>{RND=f}};
return SAB})();


/* AZUL (2-4). Colori: 0 blu, 1 giallo, 2 rosso, 3 nero, 4 turchese. Muro classico: riga r, colore c in colonna (c+r)%5.
   Variante "muro grigio" del regolamento: si sceglie la colonna, senza ripetere colori su righe e colonne. */
