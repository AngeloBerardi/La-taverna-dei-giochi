const AZUL=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));const CN=['blu','gialle','rosse','nere','turchesi'],CN1=['blu','gialla','rossa','nera','turchese'];
const FLOOR=[-1,-1,-2,-2,-2,-3,-3],NF={2:5,3:7,4:9};
const L=(s,t)=>{s.log.push(t);if(s.log.length>80)s.log.shift()};const E=(s,o)=>s.ev.push(o);
const colOf=(s,r,c)=>s.grey?-1:(c+r)%5;
function rowHas(b,r,c){return b.wall[r].includes(c)}
function colHas(b,col,c){return b.wall.some(row=>row[col]===c)}
function canLine(s,b,r,c){const ln=b.lines[r];if(ln.k>=r+1)return false;if(ln.k&&ln.c!==c)return false;if(rowHas(b,r,c))return false;if(s.grey&&!freeCols(b,r,c).length)return false;return true}
function freeCols(b,r,c){const out=[];for(let col=0;col<5;col++)if(b.wall[r][col]<0&&!colHas(b,col,c))out.push(col);return out}
function adj(b,r,col){let h=1,v=1;for(let x=col-1;x>=0&&b.wall[r][x]>=0;x--)h++;for(let x=col+1;x<5&&b.wall[r][x]>=0;x++)h++;for(let y=r-1;y>=0&&b.wall[y][col]>=0;y--)v++;for(let y=r+1;y<5&&b.wall[y][col]>=0;y++)v++;
 if(h>1&&v>1)return h+v;return Math.max(h,v)}
function fill(s){for(let f=0;f<s.factories.length;f++){const F=[];for(let k=0;k<4;k++){if(!s.bag.length){if(!s.lid.length)break;s.bag=shuffle(s.lid);s.lid=[]}F.push(s.bag.pop())}s.factories[f]=F}}
function newRound(s){s.round++;s.center=[];s.firstInCenter=true;fill(s);s.phase='pick';s.cur=s.startNext;E(s,{t:'round',r:s.round});L(s,'Round '+s.round+': fabbriche piene')}
function floorAdd(s,b,tiles){for(const t of tiles){if(b.floor.length<7)b.floor.push(t);else if(t!=='F')s.lid.push(t)}}
function tileAll(s){for(let p=0;p<s.n;p++){const b=s.boards[p];for(let r=0;r<5;r++){const ln=b.lines[r];if(ln.k===r+1){const col=colOf(s,r,ln.c);b.wall[r][col]=ln.c;const pts=adj(b,r,col);b.score+=pts;E(s,{t:'wall',p,r,col,pts});for(let k=0;k<r;k++)s.lid.push(ln.c);b.lines[r]={c:-1,k:0}}}}endTiling(s)}
function endTiling(s){for(let p=0;p<s.n;p++){const b=s.boards[p];let pen=0;b.floor.forEach((t,i)=>{pen+=FLOOR[i];if(t==='F')s.startNext=p;else s.lid.push(t)});if(pen){b.score=Math.max(0,b.score+pen);E(s,{t:'floor',p,pen})}b.floor=[]}
 if(s.boards.some(b=>b.wall.some(row=>row.every(x=>x>=0)))){finalScore(s);return}newRound(s)}
function finalScore(s){const res=s.boards.map(b=>{const rows=b.wall.filter(row=>row.every(x=>x>=0)).length;let cols=0;for(let c=0;c<5;c++)if(b.wall.every(row=>row[c]>=0))cols++;let colors=0;for(let c=0;c<5;c++)if(b.wall.flat().filter(x=>x===c).length===5)colors++;
  const bonus=rows*2+cols*7+colors*10;b.score+=bonus;return{rows,cols,colors,bonus}});
 s.res=res;const sc=s.boards.map(b=>b.score),mx=Math.max(...sc);let ws=sc.map((v,i)=>v===mx?i:-1).filter(i=>i>=0);
 if(ws.length>1){const mr=Math.max(...ws.map(i=>res[i].rows));ws=ws.filter(i=>res[i].rows===mr)}
 s.over={scores:sc,win:ws.length===1?ws[0]:null,winners:ws};s.phase='summary';E(s,{t:'win'});L(s,'Fine partita!')}
const AZUL={id:'azul',name:'Azulejos',ok:n=>n>=2&&n<=4,CN,CN1,FLOOR,canLine,freeCols,colOf,
 newGame(n,names,opts={}){const s={g:'azul',n,names:names.slice(0,n),grey:opts.wall==='grey',bag:[],lid:[],factories:Array(NF[n]).fill(null),center:[],firstInCenter:true,round:0,startNext:0,
  boards:Array.from({length:n},()=>({lines:Array.from({length:5},()=>({c:-1,k:0})),wall:Array.from({length:5},()=>Array(5).fill(-1)),floor:[],score:0})),log:[],ev:[],evn:0,over:null,teams:n};
  for(let c=0;c<5;c++)for(let k=0;k<20;k++)s.bag.push(c);shuffle(s.bag);s.hands=Array.from({length:n},()=>[]);newRound(s);return s},
 options(s){const b=s.boards[s.cur],out=[];const srcs=[...s.factories.map((f,i)=>[i,f]),['c',s.center]];
  for(const[src,ts]of srcs){for(const c of new Set(ts)){for(let r=0;r<5;r++)if(canLine(s,b,r,c))out.push({t:'take',src,color:c,line:r});out.push({t:'take',src,color:c,line:'f'})}}return out},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];const p=s.cur,b=s.boards[p],nm=s.names[p];const ok=()=>{s.evn=(s.evn||0)+1;return{s}};
  if(s.phase==='tile'){if(a.t!=='wall')return{err:'Scegli dove posare la piastrella sul muro'};const r=b.lines.findIndex((ln,i)=>ln.k===i+1);if(r<0)return{err:'Niente da posare'};const ln=b.lines[r],fc=freeCols(b,r,ln.c);
   if(a.col===-1){if(fc.length)return{err:'C’è ancora un posto libero sul muro'};floorAdd(s,b,Array(r+1).fill(ln.c));b.lines[r]={c:-1,k:0};E(s,{t:'tofloor',p,r})}
   else{if(!fc.includes(a.col))return{err:'Lì non si può: colonna occupata o colore già presente nella colonna'};b.wall[r][a.col]=ln.c;const pts=adj(b,r,a.col);b.score+=pts;for(let k=0;k<r;k++)s.lid.push(ln.c);b.lines[r]={c:-1,k:0};E(s,{t:'wall',p,r,col:a.col,pts});L(s,nm+' posa una piastrella '+CN1[ln.c]+' (+'+pts+')')}
   const more=(q)=>s.boards[q].lines.some((ln,i)=>ln.k===i+1);if(more(p))return ok();
   for(let k=1;k<=s.n;k++){const q=(p+k)%s.n;if(q===s.tileStart)break;if(more(q)){s.cur=q;return ok()}}endTiling(s);return ok()}
  if(s.phase!=='pick'||a.t!=='take')return{err:'Non ora'};
  const src=a.src==='c'?s.center:s.factories[a.src];if(!src||!src.includes(a.color))return{err:'Lì non ci sono piastrelle di quel colore'};
  if(a.line!=='f'&&!canLine(s,b,a.line,a.color))return{err:'Non puoi metterle in quella riga: '+(b.lines[a.line]&&b.lines[a.line].k>=a.line+1?'è piena':b.lines[a.line].k&&b.lines[a.line].c!==a.color?'contiene un altro colore':'quel colore è già sul muro in quella riga')};
  const got=src.filter(t=>t===a.color),rest=src.filter(t=>t!==a.color);
  if(a.src==='c'){s.center=rest;if(s.firstInCenter){s.firstInCenter=false;floorAdd(s,b,['F']);E(s,{t:'first',p})}}else{s.factories[a.src]=[];s.center.push(...rest)}
  let over=got.length;if(a.line!=='f'){const ln=b.lines[a.line],room=a.line+1-ln.k,put=Math.min(room,got.length);ln.c=a.color;ln.k+=put;over=got.length-put}
  floorAdd(s,b,Array(over).fill(a.color));
  E(s,{t:'take',p,src:a.src,color:a.color,n:got.length,line:a.line,over});L(s,nm+' prende '+got.length+' '+(got.length>1?CN[a.color]:CN1[a.color])+(a.line==='f'?' e le butta sul pavimento':' per la riga '+(a.line+1))+(over&&a.line!=='f'?' ('+over+' cadono sul pavimento)':''));
  if(s.factories.every(f=>!f.length)&&!s.center.length){E(s,{t:'tiling'});
   if(!s.grey){tileAll(s);return ok()}
   s.phase='tile';s.tileStart=0;const first=[...Array(s.n).keys()].find(q=>s.boards[q].lines.some((ln,i)=>ln.k===i+1));if(first==null){endTiling(s);return ok()}s.tileStart=first;s.cur=first;return ok()}
  s.cur=(p+1)%s.n;return ok()},
 setRnd:f=>{RND=f}};
return AZUL})();


/* L'ISOLA DEI PREDATORI (solitario, ispirato a Food Chain Island di Scott Almes). 16 animali di terra 0-15 in griglia 4x4 + squalo e balena.
   Celle 'x,y' -> pila [fondo..cima]. Area di gioco 6x6 (da -1 a 4 su entrambi gli assi). */
