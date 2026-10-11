const M=require('../src/js/motori/11-the-mind.js');let fails=0;const ck=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}};
// perfect bot: play globally lowest card
function run(n,x,perfect,seed){let r=seed;M.setRnd(()=>{r=(r*1664525+1013904223)%4294967296;return r/4294967296});
 let s=M.newGame(n,Array.from({length:n},(_,i)=>'P'+i),{x});let guard=0;
 while(!s.over&&guard++<5000){
  if(s.phase==='ready'){for(let p=0;p<n;p++){const o=M.act(s,{t:'ready',seat:p});ck(!o.err,'ready '+o.err);s=o.s}continue}
  if(s.phase==='summary'){const o=M.act(s,{t:'next',seat:0});ck(!o.err,'next '+o.err);s=o.s;continue}
  if(s.phase==='play'){
   // choose seat+col
   let best=null;
   for(let p=0;p<n;p++){const cs=x?['w','r']:['n'];for(const c of cs){const k=M.lowest(s,p,c);if(k==null)continue;
     const v=M.num(k);const key=c==='r'?-v:v; if(!best||(best.c===c&&key<best.key)||best.c!==c&&false)best={p,c,key}}}
   if(x){ // pick globally: white lowest or red highest, whichever; any order is fine in separate piles
     let bw=null,br=null;for(let p=0;p<n;p++){const w=M.lowest(s,p,'w'),r2=M.lowest(s,p,'r');if(w&&(!bw||M.num(w)<bw.v))bw={p,c:'w',v:M.num(w)};if(r2&&(!br||M.num(r2)>br.v))br={p,c:'r',v:M.num(r2)}}
     best=bw||br}
   if(!perfect&&r%7===0){const q=(r>>>3)%n;const c=x?'w':'n';if(M.lowest(s,q,c)!=null)best={p:q,c}}
   const o=M.act(s,{t:'play',seat:best.p,col:best.c});ck(!o.err,'play '+o.err);if(o.err)break;s=o.s;continue}
  break}
 return s}
for(const x of [false,true])for(const n of [2,3,4]){const s=run(n,x,true,n*7+1);ck(s.over&&s.over.win,`perfect win n${n} x${x} lvl${s.level} lives${s.lives} ${JSON.stringify(s.over)}`);console.log('perfect',n,x,s.over&&s.over.win,s.level,s.lives,s.stars)}
for(const x of [false,true])for(const n of [2,3,4]){let w=0,l=0;for(let i=0;i<20;i++){const s=run(n,x,false,i*13+5);ck(s.over,'ends');s.over.win?w++:l++}console.log('noisy',n,x,'w',w,'l',l)}
// blind examples
let s=M.newGame(2,['a','b'],{x:true});s.level=4;s.blind='w';s.lives=3;
s.hands=[[],[]];s.wp=[7,14,28,20,25,23,37,48].map(c=>({c:'w'+c,p:0,h:true}));s.rp=[];s.phase='play';
let o={};const sv=JSON.parse(JSON.stringify(s));
// simulate by calling finish through a last play: put one card in hand
s.hands=[['w49'],[]];s.wp.pop();s.wp.push({c:'w48',p:0,h:true});
let r=M.act(s,{t:'play',seat:0,col:'w'});ck(!r.err,'blind play');console.log('ex1 lives',3,'->',r.s.lives,r.s.phase);ck(r.s.lives===2,'ex1 one life');
s=M.newGame(2,['a','b'],{x:true});s.level=4;s.blind='w';s.lives=4;s.hands=[['w37'],[]];s.wp=[2,13,11,28,44,42].map(c=>({c:'w'+c,p:0,h:true}));s.phase='play';
r=M.act(s,{t:'play',seat:0,col:'w'});console.log('ex2 lives 4 ->',r.s.lives);ck(r.s.lives===2,'ex2 two lives');
console.log(fails?'FAILS '+fails:'ALL OK');
process.exit(fails?1:0)
