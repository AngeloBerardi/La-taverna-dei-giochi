const MACH=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));
const SU='SHDC',RK=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const parse=id=>{if(id[0]==='X')return{j:1};const b=id.split('.')[0];return{r:RK.indexOf(b.slice(0,-1)),s:b.slice(-1)}};
const isJ=id=>id[0]==='X';
const base=id=>isJ(id)?'X1':id.split('.')[0];
function runPos(cards){ // restituisce {s,n} della prima sistemazione valida come scala, o null
 const n=cards.length;if(n<3||n>13)return null;const nj=cards.filter(c=>!isJ(c)).map(parse);if(!nj.length)return null;const su=nj[0].s;if(nj.some(p=>p.s!==su))return null;
 const rs=nj.map(p=>p.r);if(new Set(rs).size!==rs.length)return null;
 for(let s=1;s<=14-n+1;s++){let ok=true;for(const r of rs){const lo=r>=s&&r<=s+n-1,hi=r===1&&14>=s&&14<=s+n-1;if(!lo&&!hi){ok=false;break}}if(ok)return{s,n,su}}return null}
function isSet(cards){const n=cards.length;if(n<3||n>4)return false;const nj=cards.filter(c=>!isJ(c)).map(parse);if(!nj.length)return false;if(nj.some(p=>p.r!==nj[0].r))return false;return new Set(nj.map(p=>p.s)).size===nj.length}
const validMeld=c=>isSet(c)||!!runPos(c);
function layout(cards){ // ordine di visualizzazione
 if(isSet(cards)&&!runPos(cards))return cards.slice().sort((a,b)=>(isJ(a)-isJ(b))||(SU.indexOf(parse(a).s)-SU.indexOf(parse(b).s)));
 const rp=runPos(cards);if(!rp)return cards.slice().sort((a,b)=>(isJ(a)-isJ(b))||(parse(a).r-parse(b).r)||(SU.indexOf(parse(a).s)-SU.indexOf(parse(b).s)));
 const out=Array(rp.n).fill(null),js=cards.filter(isJ);
 for(const c of cards.filter(x=>!isJ(x))){const r=parse(c).r;let q=r>=rp.s&&r<=rp.s+rp.n-1?r:14;out[q-rp.s]=c}
 return out.map(x=>x||js.pop())}
function newDeck(){const d=[];for(let k=0;k<2;k++)for(const s of SU)for(let r=1;r<=13;r++)d.push(RK[r]+s+'.'+k);for(let k=0;k<4;k++)d.push('X.'+k);return shuffle(d)}
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};const E=(s,o)=>s.ev.push(o);
const sortH=h=>h.slice().sort((a,b)=>(isJ(a)-isJ(b))||(SU.indexOf(parse(a).s)-SU.indexOf(parse(b).s))||(parse(a).r-parse(b).r)||(a<b?-1:1));
/* ---------- solutore: trova la miglior sistemazione del tavolo che cala più carte dalla mano ---------- */
function solve(tableIds,handIds,cap=20000,ms=200){const T0=Date.now();
 const K=id=>{const p=parse(id);return(p.r-1)*4+SU.indexOf(p.s)};
 const tp=Array.from({length:52},()=>[]),hp=Array.from({length:52},()=>[]),tj=[],hj=[];
 const M0=new Int8Array(52),O0=new Int8Array(52);
 tableIds.forEach(id=>{if(isJ(id))tj.push(id);else{tp[K(id)].push(id);M0[K(id)]++}});handIds.forEach(id=>{if(isJ(id))hj.push(id);else{hp[K(id)].push(id);O0[K(id)]++}});
 let nodes=0;const memo=new Map(),choice=new Map();
 const kr=k=>Math.floor(k/4)+1,ks=k=>k%4;
 function cands(st,k){const{M,O,mj,oj}=st;const J=mj+oj,av=q=>M[q]+O[q],out=[],seen=new Set();
  const push=(keys,j)=>{if(keys.length<2||keys.length+j<3||j>J)return;const sig=keys.slice().sort((a,b)=>a-b).join(',')+'/'+j;if(seen.has(sig))return;seen.add(sig);out.push({keys,j})};
  const r=kr(k),sk=ks(k);
  const oth=[0,1,2,3].filter(x=>x!==sk&&av((r-1)*4+x)>0);
  for(let m=0;m<(1<<oth.length);m++){const ks2=[k];oth.forEach((x,i)=>{if(m>>i&1)ks2.push((r-1)*4+x)});for(let j=0;j<=J&&ks2.length+j<=4;j++)push(ks2,j)}
  const ps=r===1?[1,14]:[r];
  for(const p0 of ps)for(let n=3;n<=13;n++)for(let s=Math.max(1,p0-n+1);s<=Math.min(p0,14-n+1);s++){const keys=[];let j=0,ok=true;
   for(let q=s;q<s+n;q++){const rr=q>13?q-13:q,key=(rr-1)*4+sk;if(q===p0)keys.push(k);else if(av(key)>0)keys.push(key);else{j++;if(j>J){ok=false;break}}}
   if(ok)push(keys,j)}
  return out}
 function take(st,c){const M=st.M.slice(),O=st.O.slice();let mj=st.mj,oj=st.oj,used=0;for(const q of c.keys){if(M[q]>0)M[q]--;else{O[q]--;used++}}for(let i=0;i<c.j;i++){if(mj>0)mj--;else{oj--;used++}}return{st:{M,O,mj,oj},used}}
 const key=st=>String.fromCharCode(...st.M)+'|'+String.fromCharCode(...st.O)+(st.mj)+'|'+st.oj;
 function f(st){if(++nodes>cap||((nodes&255)===0&&Date.now()-T0>ms))throw 0;const ky=key(st);if(memo.has(ky))return memo.get(ky);let best=-Infinity,ch=null;
  let k=-1;for(let q=0;q<52;q++)if(st.M[q]>0){k=q;break}
  if(k>=0){for(const c of cands(st,k)){const t=take(st,c),v=t.used+f(t.st);if(v>best){best=v;ch={c}}}}
  else{let o=-1;for(let q=0;q<52;q++)if(st.O[q]>0){o=q;break}
   if(o<0)best=0;else{const s2={M:st.M,O:st.O.slice(),mj:st.mj,oj:st.oj};s2.O[o]--;best=f(s2);ch={skip:o};
    for(const c of cands(st,o)){const t=take(st,c),v=t.used+f(t.st);if(v>best){best=v;ch={c}}}}}
  memo.set(ky,best);choice.set(ky,ch);return best}
 let root={M:M0,O:O0,mj:tj.length,oj:hj.length},val;
 try{val=f(root)}catch(e){return null}
 if(!(val>=1))return null;
 const melds=[];let st=root;
 for(;;){const ch=choice.get(key(st));if(!ch)break;if(ch.skip!=null){st={M:st.M,O:st.O.slice(),mj:st.mj,oj:st.oj};st.O[ch.skip]--;continue}const t=take(st,ch.c);melds.push(ch.c);st=t.st}
 const tpc=tp.map(a=>a.slice()),hpc=hp.map(a=>a.slice()),tjc=tj.slice(),hjc=hj.slice(),usedHand=[];
 const out=melds.map(c=>{const m=[];for(const q of c.keys){if(tpc[q].length)m.push(tpc[q].pop());else{const id=hpc[q].pop();m.push(id);usedHand.push(id)}}for(let i=0;i<c.j;i++){if(tjc.length)m.push(tjc.pop());else{const id=hjc.pop();m.push(id);usedHand.push(id)}}return m});
 for(const jk of tjc){let ok=false;for(const m of out){m.push(jk);if(validMeld(m)){ok=true;break}m.pop()}if(!ok)return null}
 if(!out.every(validMeld)||!usedHand.length)return null;
 return{table:out,used:usedHand}}
function suggest(table,hand,ms0=250){const T=table.flat();let r=solve(T,hand,20000,ms0);if(r)return r;
 // ripiego: lascia il tavolo com'è, cala nuove combinazioni solo dalla mano e prova ad attaccare singole carte
 let tb=table.map(m=>m.slice()),h=hand.slice(),used=[];const n0=solve([],h,8000,Math.max(20,ms0/2));if(n0){tb=tb.concat(n0.table);used=n0.used.slice();h=h.filter(c=>!used.includes(c))}
 for(let again=true;again;){again=false;for(const c of h.slice()){for(const m of tb){m.push(c);if(validMeld(m)){h.splice(h.indexOf(c),1);used.push(c);again=true;break}m.pop()}}}
 return used.length?{table:tb,used}:null}
const MACH={id:'machiavelli',name:'Machiavelli',ok:n=>n>=2&&n<=5,validMeld,layout,parse,isJ,base,sortH,solve,suggest,runPos,
 newGame(n,names,opts={}){const d=newDeck();const s={g:'machiavelli',n,names:names.slice(0,n),hands:[],stock:null,table:[],cur:0,passes:0,log:[],ev:[],evn:0,over:null,phase:'play',teams:n,turn:1};
  for(let i=0;i<n;i++)s.hands.push(sortH(d.splice(0,13)));s.stock=d;L(s,'Si gioca: cala le tue carte svuotando la mano per primo');return s},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];const p=s.cur,nm=s.names[p];const ok=()=>{s.evn=(s.evn||0)+1;return{s}};
  const nextT=()=>{s.cur=(s.cur+1)%s.n;s.turn++};
  if(a.t==='draw'){if(s.stock.length){const c=s.stock.pop();s.hands[p].push(c);s.hands[p]=sortH(s.hands[p]);s.passes=0;E(s,{t:'draw',p,c});L(s,nm+' pesca');nextT();return ok()}
   s.passes++;E(s,{t:'pass',p});L(s,nm+' passa (mazzo finito)');if(s.passes>=s.n){const cnt=s.hands.map(h=>h.length),mn=Math.min(...cnt),w=cnt.map((v,i)=>v===mn?i:-1).filter(i=>i>=0);s.over={win:w.length===1?w[0]:null,winners:w,scores:cnt,txt:'Nessuno può più giocare'};s.phase='summary';E(s,{t:'win'})}else nextT();return ok()}
  if(a.t!=='play'||!Array.isArray(a.table))return{err:'Mossa non valida'};
  const nt=a.table.filter(m=>m.length);const flat=nt.flat(),old=s.table.flat();
  if(new Set(flat).size!==flat.length)return{err:'Una carta compare due volte'};
  const fs=new Set(flat);if(old.some(c=>!fs.has(c)))return{err:'Tutte le carte già sul tavolo devono restare in gioco'};
  const os=new Set(old),add=flat.filter(c=>!os.has(c));if(!add.length)return{err:'Devi calare almeno una carta della tua mano (altrimenti pesca)'};
  const hs=new Set(s.hands[p]);if(add.some(c=>!hs.has(c)))return{err:'Carta non valida'};
  for(let i=0;i<nt.length;i++)if(!validMeld(nt[i]))return{err:'La combinazione '+(i+1)+' non è valida (tris/quartetti di semi diversi, scale dello stesso seme di almeno 3 carte)'};
  s.hands[p]=s.hands[p].filter(c=>!add.includes(c));s.table=nt.map(layout);s.passes=0;E(s,{t:'play',p,n:add.length,cards:add});L(s,nm+' cala '+add.length+(add.length>1?' carte':' carta'));
  if(!s.hands[p].length){const cnt=s.hands.map(h=>h.length);s.over={win:p,winners:[p],scores:cnt,txt:nm+' ha finito le carte!'};s.phase='summary';E(s,{t:'win'});return ok()}
  nextT();return ok()},
 setRnd:f=>{RND=f}};
return MACH})();


