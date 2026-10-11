const IT=(()=>{
let RND=Math.random;const SU='CDSB',RK=['1','2','3','4','5','6','7','F','C','R'];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const P=c=>({r:c.slice(0,-1),s:c.slice(-1)});
const deck=()=>{const d=[];for(const s of SU)for(const r of RK)d.push(r+s);return d};
const clone=o=>JSON.parse(JSON.stringify(o));
const SN={C:'Coppe',D:'Denari',S:'Spade',B:'Bastoni'},RN={'1':'Asso','F':'Fante','C':'Cavallo','R':'Re'};
const fmt=c=>{const{r,s}=P(c);return(RN[r]||r)+' di '+SN[s]};
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};
const teamsOf=n=>n===4?2:n;const teamOf=(n,i)=>n===4?i%2:i;
const teamName=(s,t)=>s.n===4?s.names.filter((_,i)=>i%2===t).join(' & '):s.names[t];
function finish(s,ok){if(!ok)return{err:ok===false?'Mossa non valida':ok};s.evn=(s.evn||0)+1;return{s}}
/* ---------- BRISCOLA ---------- */
const BPTS={'1':11,'3':10,R:4,C:3,F:2},BSTR=['2','4','5','6','7','F','C','R','3','1'];
const BRIS={id:'briscola',name:'Briscola',ok:n=>n>=2&&n<=4,
 newGame(n,names){const d=shuffle(deck().filter(c=>!(n===3&&c==='2C')));const s={g:'briscola',n,names:names.slice(0,n),deck:d,trump:d[0],hands:Array.from({length:n},()=>[]),trick:[],taken:Array.from({length:n},()=>[]),cur:0,first:0,last:null,log:[],ev:[],evn:0,over:null,teams:teamsOf(n)};
  for(let k=0;k<3;k++)for(let p=0;p<n;p++)s.hands[p].push(s.deck.pop());L(s,'Briscola: '+fmt(s.trump));return s},
 pts:cards=>cards.reduce((t,c)=>t+(BPTS[P(c).r]||0),0),
 winner(s,trick){const ts=P(s.trump).s,led=P(trick[0].c).s;let best=trick[0];for(const x of trick.slice(1)){const a=P(x.c),b=P(best.c);
  if(a.s===b.s){if(BSTR.indexOf(a.r)>BSTR.indexOf(b.r))best=x}else if(a.s===ts)best=x}return best.p},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];
  if(a.t!=='play')return{err:'Azione sconosciuta'};const h=s.hands[s.cur];if(!h.includes(a.c))return{err:'Carta non valida'};
  h.splice(h.indexOf(a.c),1);s.trick.push({p:s.cur,c:a.c});s.ev.push({t:'play',p:s.cur,c:[a.c]});L(s,s.names[s.cur]+' gioca '+fmt(a.c));
  if(s.trick.length<s.n){s.cur=(s.cur+1)%s.n;return finish(s,true)}
  const w=BRIS.winner(s,s.trick),cards=s.trick.map(x=>x.c),pts=BRIS.pts(cards);s.taken[w].push(...cards);s.last={trick:s.trick,w,pts};s.trick=[];
  s.ev.push({t:'trick',w,pts,cards});L(s,s.names[w]+' prende ('+pts+' punti)');
  if(s.deck.length){for(let k=0;k<s.n;k++){const p=(w+k)%s.n;if(s.deck.length)s.hands[p].push(s.deck.pop())}s.ev.push({t:'draw'})}
  s.cur=w;
  if(s.hands.every(x=>!x.length)){const sc=Array(s.teams).fill(0);s.taken.forEach((t,i)=>sc[teamOf(s.n,i)]+=BRIS.pts(t));const mx=Math.max(...sc),ws=sc.map((v,i)=>v===mx?i:-1).filter(i=>i>=0);
   s.over={scores:sc,win:ws.length===1?ws[0]:null};s.ev.push({t:ws.length===1?'win':'tie'});L(s,ws.length===1?'Vince '+teamName(s,ws[0])+' con '+mx+' punti':'Pareggio '+mx+' a '+mx)}
  return finish(s,true)}};
/* ---------- SCOPA ---------- */
const VAL=c=>{const r=P(c).r;return r==='F'?8:r==='C'?9:r==='R'?10:+r};
const PRIM={'7':21,'6':18,'1':16,'5':15,'4':14,'3':13,'2':12,F:10,C:10,R:10};
function subsets(arr,target){const out=[];const n=arr.length;for(let m=1;m<1<<n;m++){let t=0,k=[];for(let i=0;i<n;i++)if(m>>i&1){t+=VAL(arr[i]);k.push(arr[i])}if(t===target)out.push(k)}return out}
const SCOPA={id:'scopa',name:'Scopa',ok:n=>n>=2&&n<=4,
 options(table,c){const v=VAL(c),single=table.filter(x=>VAL(x)===v);if(single.length)return single.map(x=>[x]);return subsets(table,v).filter(k=>k.length>1)},
 newGame(n,names,opts={}){const s={g:'scopa',n,names:names.slice(0,n),teams:teamsOf(n),target:+opts.target||11,scores:Array(teamsOf(n)).fill(0),round:0,dealer:n-1,log:[],ev:[],evn:0,over:null};SCOPA.deal(s);return s},
 deal(s){let d;do{d=shuffle(deck())}while(d.slice(-4).filter(c=>P(c).r==='R').length>=3);
  s.round++;s.dealer=(s.dealer+1)%s.n;s.deck=d;s.table=[d.pop(),d.pop(),d.pop(),d.pop()];s.hands=Array.from({length:s.n},()=>[]);s.taken=Array.from({length:s.teams},()=>[]);s.scope=Array(s.teams).fill(0);s.lastCap=null;s.phase='play';s.res=null;
  s.cur=(s.dealer+1)%s.n;SCOPA.give(s);L(s,'Mano '+s.round+': in tavola '+s.table.map(fmt).join(', '))},
 give(s){for(let k=0;k<3;k++)for(let i=0;i<s.n;i++){const p=(s.cur+i)%s.n;if(s.deck.length)s.hands[p].push(s.deck.pop())}},
 prim(cards){let t=0;for(const su of 'CDSB'){const b=Math.max(0,...cards.filter(c=>P(c).s===su).map(c=>PRIM[P(c).r]));if(!b)return 0;t+=b}return t},
 tally(s){const T=s.teams,rows=[];const best=(arr,label)=>{const mx=Math.max(...arr),w=arr.filter(v=>v===mx).length===1&&mx>0?arr.indexOf(mx):null;rows.push({label,vals:arr,w});return w};
  best(s.taken.map(t=>t.length),'Carte');best(s.taken.map(t=>t.filter(c=>P(c).s==='D').length),'Denari');
  const sb=s.taken.findIndex(t=>t.includes('7D'));rows.push({label:'Settebello',vals:s.taken.map((_,i)=>i===sb?1:0),w:sb>=0?sb:null});
  best(s.taken.map(t=>SCOPA.prim(t)),'Primiera');rows.push({label:'Scope',vals:s.scope.slice(),w:null,sum:true});
  const pts=Array(T).fill(0);rows.forEach(r=>{if(r.sum)r.vals.forEach((v,i)=>pts[i]+=v);else if(r.w!=null)pts[r.w]++});return{rows,pts}},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];
  if(a.t==='next'){if(s.phase!=='summary')return{err:'Non ora'};SCOPA.deal(s);s.ev.push({t:'deal'});return finish(s,true)}
  if(a.t!=='play'||s.phase!=='play')return{err:'Azione non valida'};
  const h=s.hands[s.cur],c=a.c,take=a.take||[];if(!h.includes(c))return{err:'Carta non valida'};
  if(take.some(x=>!s.table.includes(x))||new Set(take).size!==take.length)return{err:'Prese non valide'};
  const opts=SCOPA.options(s.table,c);
  if(!take.length){if(opts.length)return{err:'Con questa carta devi prendere: la presa è obbligatoria'}}
  else{const key=k=>k.slice().sort().join();if(!opts.some(o=>key(o)===key(take)))return{err:VAL(c)&&s.table.some(x=>VAL(x)===VAL(c))?'Se c’è una carta uguale devi prendere quella':'La somma delle carte prese deve fare '+VAL(c)}}
  h.splice(h.indexOf(c),1);const tm=teamOf(s.n,s.cur);s.ev.push({t:'play',p:s.cur,c:[c],take});
  if(take.length){s.table=s.table.filter(x=>!take.includes(x));s.taken[tm].push(c,...take);s.lastCap=tm;
   const lastPlay=!s.deck.length&&s.hands.every(x=>!x.length);
   if(!s.table.length&&!lastPlay){s.scope[tm]++;s.ev.push({t:'scopa',p:s.cur});L(s,s.names[s.cur]+' fa SCOPA con '+fmt(c)+'!')}else L(s,s.names[s.cur]+' prende '+take.map(fmt).join(', ')+' con '+fmt(c))}
  else{s.table.push(c);L(s,s.names[s.cur]+' cala '+fmt(c))}
  s.cur=(s.cur+1)%s.n;
  if(s.hands.every(x=>!x.length)){
   if(s.deck.length){SCOPA.give(s);s.ev.push({t:'deal'})}
   else{if(s.table.length&&s.lastCap!=null){s.taken[s.lastCap].push(...s.table);s.ev.push({t:'sweep',w:s.lastCap,cards:s.table.slice()});L(s,'Le carte rimaste vanno a '+teamName(s,s.lastCap))}s.table=[];
    const r=SCOPA.tally(s);r.pts.forEach((v,i)=>s.scores[i]+=v);s.res=r;s.phase='summary';s.ev.push({t:'round'});
    const mx=Math.max(...s.scores),lead=s.scores.filter(v=>v===mx).length===1;
    if(mx>=s.target&&lead){s.over={scores:s.scores.slice(),win:s.scores.indexOf(mx)};s.ev.push({t:'win'});L(s,'Vince '+teamName(s,s.over.win)+'!')}}}
  return finish(s,true)}};
return{BRIS,SCOPA,P,fmt,VAL,SN,RN,teamOf,teamsOf,teamName,setRnd:f=>{RND=f}}})();


/* Burraco: 2 mazzi francesi + 4 jolly. Id carta: mazzo(a/b)+rango+seme, jolly a/b + 'X' + n */
