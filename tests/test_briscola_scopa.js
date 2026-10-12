// Briscola e Scopa: conservazione delle 40 carte, partite sempre concluse, bot con euristica batte il casuale.
const carica=require('./carica.js'),IT=carica('02-briscola-scopa.js','IT'),{BRIS,SCOPA,P,VAL}=IT;
const BP={'1':11,'3':10,R:4,C:3,F:2},STR=['2','4','5','6','7','F','C','R','3','1'];
const pts=c=>BP[P(c).r]||0,str=c=>STR.indexOf(P(c).r);
function brisSmart(s){const h=s.hands[s.cur],ts=P(s.trump).s;
 if(!s.trick.length){return h.slice().sort((a,b)=>(pts(a)+(P(a).s===ts?8:0)+str(a)/10)-(pts(b)+(P(b).s===ts?8:0)+str(b)/10))[0]}
 const mine=s.n===4?s.trick.find(x=>x.p%2===s.cur%2):null;
 let best=null;for(const c of h){const t=[...s.trick,{p:s.cur,c}];const w=BRIS.winner(s,t);const win=s.n===4?w%2===s.cur%2:w===s.cur;
  const sum=t.reduce((a,x)=>a+pts(x.c),0);const v=win?sum-(P(c).s===ts?4+pts(c)/2:0):-pts(c)-(P(c).s===ts?5:0);if(!best||v>best.v)best={v,c}}return best.c}
function scopaSmart(s){const h=s.hands[s.cur];let best=null;
 for(const c of h){const opts=SCOPA.options(s.table,c);
  if(!opts.length){const v=-VAL(c)/10-(c==='7D'?5:0)-(P(c).s==='D'?1:0)-(s.table.reduce((a,x)=>a+VAL(x),0)+VAL(c)<=10?2:0);if(!best||v>best.v)best={v,a:{t:'play',c,take:[]}}}
  for(const k of opts){const all=[c,...k];let v=all.length+all.filter(x=>P(x).s==='D').length*.7+(all.includes('7D')?6:0)+all.filter(x=>P(x).r==='7').length*1.2+(k.length===s.table.length?10:0);
   if(!best||v>best.v)best={v,a:{t:'play',c,take:k}}}}return best.a}
function rnd(s,R,G){if(s.phase==='summary')return{t:'next'};const h=s.hands[s.cur],c=h[Math.floor(R()*h.length)];
 if(G===BRIS)return{t:'play',c};const o=SCOPA.options(s.table,c);return{t:'play',c,take:o.length?o[Math.floor(R()*o.length)]:[]}}
function partita(G,n,bots,R){IT.setRnd(R);let s=G.newGame(n,['a','b','c','d'].slice(0,n),{target:11}),k=0;
 while(!s.over&&k++<5000){let a;if(s.phase==='summary')a={t:'next'};else{const b=bots[s.cur%bots.length];a=b?(G===BRIS?{t:'play',c:brisSmart(s)}:scopaSmart(s)):rnd(s,R,G)}
  const r=G.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));s=r.s;
  if(s.phase!=='summary'&&!s.over){const tot=(s.deck||[]).length+s.hands.flat().length+(s.table||[]).length+(s.trick||[]).length+s.taken.flat().length;
   if(tot!==(G===BRIS&&n===3?39:40))throw new Error('carte: '+tot)}}
 if(!s.over)throw new Error('senza fine');return s.over}
const R=carica.rng(9);let ok=true;
for(const [G,nome] of [[BRIS,'Briscola'],[SCOPA,'Scopa']])for(const n of [2,3,4]){let w=0,N=G===BRIS?400:150;
 for(let g=0;g<N;g++){const bots=Array(n).fill(false);bots[g%n]=true;if(n===4)bots[(g+2)%4]=true;const o=partita(G,n,bots,R);if(o.win!=null&&(n===4?o.win===g%2:o.win===g%n))w++}
 const att=n===4?.5:1/n,rate=w/N;console.log(nome,n,'giocatori: il bot vince',(rate*100).toFixed(0)+'% (a caso sarebbe',(att*100).toFixed(0)+'%)');if(rate<att+.1)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
