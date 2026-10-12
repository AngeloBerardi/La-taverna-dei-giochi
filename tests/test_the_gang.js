// The Gang: partite sempre concluse in tutte le modalità (sfide, specialisti, indovinelli) e
// una squadra che sceglie i gettoni stimando la forza della propria mano apre più caveau di una squadra casuale.
const carica=require('./carica.js'),G=carica('04-the-gang.js','GANG');
const RK=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const cmp=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0};
function forza(s,p,R){// percentuale di mani casuali battute (vede solo le proprie carte e il tavolo)
 const known=new Set([...s.hands[p],...s.board]),deck=[];for(const su of 'HDCS')for(const r of RK){const c=r+su;if(!known.has(c))deck.push(c)}
 const mine=G.best([...s.hands[p],...s.board]);let w=0,N=40;for(let i=0;i<N;i++){const a=deck[Math.floor(R()*deck.length)];let b;do b=deck[Math.floor(R()*deck.length)];while(b===a);
  const o=G.best([a,b,...s.board]);const d=cmp(mine,o);w+=d>0?1:d===0?.5:0}return w/N}
function comune(s,R){if(s.phase==='summary')return{t:'next'};const p=s.cur,h=s.hands[p];
 if(s.phase==='hack')return{t:'hackdisc',c:h[Math.floor(R()*h.length)]};
 if(s.phase==='coord')return{t:'coordpick',c:h[Math.floor(R()*h.length)]};
 if(s.phase==='guess'){const k=s.guess.kind==='both'?(s.guess.done.retina==null?'retina':'finger'):s.guess.kind;
  if(k==='retina'){const t=s.hands[s.guess.top];return{t:'guess',kind:k,v:G.P(t[Math.floor(R()*t.length)]).r}}return{t:'guess',kind:k,v:String(Math.floor(R()*9))}}
 return null}
function rnd(s,R){const c=comune(s,R);if(c)return c;const p=s.cur,row=s.chips[s.round];
 if(s.spec&&!s.used&&G.SPEC[s.spec].use&&R()<.3)return{t:'spec',to:(p+1)%s.n,c:s.hands[p][0],v:'A'};
 if(row.indexOf(p)>=0&&R()<.85)return{t:'pass'};return{t:'take',star:1+Math.floor(R()*s.n)}}
function smart(s,R,mem){const c=comune(s,R);if(c)return c;const p=s.cur,row=s.chips[s.round],key=s.heist+'/'+s.round+'/'+p;
 mem[key]=mem[key]||{f:forza(s,p,R),n:0};const want=Math.min(s.n,1+Math.round(mem[key].f*(s.n-1)));const mine=row.indexOf(p)+1;
 if(mine&&(Math.abs(mine-want)<=0||mem[key].n>=2))return{t:'pass'};
 // prendi il gettone libero più vicino a quello desiderato, oppure rubalo
 let best=null;for(let st=1;st<=s.n;st++){if(st===mine)continue;const d=Math.abs(st-want)+(row[st-1]>=0?(mem[key].n>=2?99:.5):0);if(!best||d<best.d)best={d,st}}
 mem[key].n++;return{t:'take',star:best.st}}
function partita(n,mode,bot,R){G.setRnd(R);let s=G.newGame(n,['a','b','c','d','e','f'].slice(0,n),{mode}),k=0,mem={};
 while(!s.over&&k++<4000){let a=bot(s,R,mem),r=G.act(s,a);let g=0;while(r.err&&g++<20){a=rnd(s,R);r=G.act(s,a)}if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase);s=r.s;
  if(!s.over&&s.phase!=='summary'){const tot=s.deck.length+s.board.length+s.hands.flat().filter(c=>c!=='JX').length;if(tot>52)throw new Error('carte duplicate')}}
 if(!s.over)throw new Error('senza fine ('+mode+')');return s.over}
const R=carica.rng(21);let ok=true;
for(const mode of ['base','avanzata','pro','maestro'])for(let g=0;g<40;g++)partita(3+g%4,mode,rnd,R);
console.log('fuzz in tutte le modalità: ok');
for(const n of [3,4,5]){let ws=0,wr=0;const N=40;for(let g=0;g<N;g++){if(partita(n,'base',smart,R).win)ws++;if(partita(n,'base',rnd,R).win)wr++}
 console.log('The Gang',n,'giocatori: squadra di bot',ws+'/'+N,'casuale',wr+'/'+N);if(ws<=wr)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
