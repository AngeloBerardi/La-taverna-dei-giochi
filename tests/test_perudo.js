// Perudo: regole di rilancio, dudo/calza, palifico, conservazione dei dadi e fine partita.
// Un giocatore che stima le probabilità batte i giocatori casuali.
const carica=require('./carica.js'),P=carica('16-perudo.js','PERU');
const assert=require('assert');
const R=carica.rng(7);
const mk=(n,hands,bid,cur=0)=>{P.setRnd(R);const s=P.newGame(n,Array.from({length:n},(_,i)=>'g'+i));s.hands=hands;s.bid=bid;s.cur=cur;return s};

// --- regole di rilancio (valori e assi jolly)
let s=mk(2,[[2,2,3,4,5],[1,2,3,4,6]],{q:4,f:3,p:1});
assert(!P.valid(s,5,2),'più dadi, valore più basso: ok');
assert(!P.valid(s,4,4),'stessa quantità, valore più alto: ok');
assert(P.valid(s,4,2),'stessa quantità, valore più basso: no');
assert(!P.valid(s,2,1),'dai valori agli assi: metà per eccesso (4→2)');
assert(P.valid(s,1,1),'sotto la metà: no');
s.bid={q:3,f:1,p:1};
assert(P.valid(s,6,2),'dagli assi: doppio più uno = 7');assert(!P.valid(s,7,2));
assert(!P.valid(s,4,1)&&P.valid(s,3,1),'assi su assi: serve di più');
s.bid=null;assert(!P.valid(s,1,1),'si può aprire con gli assi');assert(P.valid(s,11,2),'non più dadi di quelli in tavola');

// --- conteggio: assi jolly (non nel palifico)
s=mk(2,[[1,1,2,3,4],[1,2,2,5,6]],{q:5,f:2,p:0},1);
assert.strictEqual(P.count(s,2),6);assert.strictEqual(P.count(s,1),3);
s.pal=0;assert.strictEqual(P.count(s,2),3,'nel palifico gli assi non sono jolly');

// --- dudo: chi ha ragione vince, chi sbaglia perde un dado
s=mk(2,[[2,2,3,4,5],[1,2,3,4,6]],{q:4,f:2,p:0},1);   // 2,2,2 + asso = 4 dadi → la dichiarazione regge
let r=P.act(s,{t:'dudo'});assert(!r.err);assert.strictEqual(r.s.hands[1].length,4,'lo sfidante sbagliava');assert.strictEqual(r.s.cur,1,'perde e apre');assert.strictEqual(r.s.phase,'summary');
s=mk(2,[[2,2,3,4,5],[1,2,3,4,6]],{q:5,f:2,p:0},1);
r=P.act(s,{t:'dudo'});assert.strictEqual(r.s.hands[0].length,4,'il dichiarante bluffava');assert.strictEqual(r.s.cur,0);

// --- calza: esatto guadagna un dado (max 5), sbagliato ne perde uno
s=mk(3,[[2,2,3,4,1],[1,2,3,4,6],[5,5,5,2,2]],{q:7,f:2,p:0},1);
r=P.act(s,{t:'calza'});assert(!r.err);assert.strictEqual(r.s.hands[1].length,5,'guadagno limitato a 5');
s=mk(3,[[2,2,3,4],[1,2,3,4],[5,5,5]],{q:4,f:2,p:0},1);
r=P.act(s,{t:'calza'});assert.strictEqual(r.s.hands[1].length,5,'esatto: +1 (4→5)');assert.strictEqual(r.s.cur,1);
s=mk(3,[[2,2,3,4],[1,2,3,4],[5,5,5]],{q:3,f:2,p:0},1);
r=P.act(s,{t:'calza'});assert.strictEqual(r.s.hands[1].length,3,'sbagliato: −1');
s=mk(4,[[2],[3],[4],[5]],{q:1,f:2,p:0},1);assert(!P.canCalza(s)&&P.act(s,{t:'calza'}).err,'troppi pochi dadi per calzare');

// --- eliminazione e palifico
s=mk(3,[[2,2,3],[4],[5,5,5]],{q:2,f:2,p:0},1);
r=P.act(s,{t:'dudo'});assert.strictEqual(r.s.hands[1].length,0,'eliminato');assert.strictEqual(r.s.cur,2,'apre il successivo');
s=mk(3,[[2,2,3],[4,4],[5,5,5]],{q:6,f:2,p:0},1);
r=P.act(s,{t:'dudo'});assert.strictEqual(r.s.hands[0].length,2);
s=mk(3,[[2,2,3],[4,4],[5,5,5]],{q:3,f:5,p:0},1);   // 3×5: ci sono tre 5 → regge, lo sfidante resta con 1 dado → palifico
r=P.act(s,{t:'dudo'});assert.strictEqual(r.s.hands[1].length,1);
let n2=P.act(r.s,{t:'next'});assert(!n2.err);assert.strictEqual(n2.s.pal,1,'palifico di chi è rimasto con un dado');
assert(P.valid(n2.s,2,3)===null&&n2.s.bid===null,'chi apre sceglie il valore');
n2.s.cur=1;let b1=P.act(n2.s,{t:'bid',q:1,f:4});assert(!b1.err);assert(P.act(b1.s,{t:'bid',q:2,f:5}).err,'nel palifico non si cambia valore');assert(!P.act(b1.s,{t:'bid',q:2,f:4}).err);

// --- partite complete: terminano, i dadi si conservano
function stima(s,me){const mine=s.hands[me],others=P.total(s)-mine.length;let best=null;
 const lik=(q,f)=>{const own=mine.filter(d=>d===f||(d===1&&f!==1&&s.pal==null)).length;const p=f===1||s.pal!=null?1/6:1/3;return own+others*p-q};
 const opts=P.options(s);
 if(s.bid){const gap=lik(s.bid.q,s.bid.f);if(gap<-.9)return{t:'dudo'};if(Math.abs(gap)<.2&&P.canCalza(s)&&R()<.5)return{t:'calza'}}
 for(const o of opts){const v=lik(o.q,o.f);if(v>=-.3&&(!best||(o.q+o.f/10<best.q+best.f/10)&&v>=best.v-0.01||v>best.v+.45))best={...o,v}}
 if(!best){if(s.bid)return{t:'dudo'};best=opts[0]}
 return{t:'bid',q:best.q,f:best.f}}
function casuale(s){const o=P.options(s);if(s.bid&&R()<.18)return{t:'dudo'};if(!o.length)return{t:'dudo'};
 const low=o.slice(0,Math.min(o.length,6));const c=low[Math.floor(R()*low.length)];return{t:'bid',...c}}
function partita(n,bots){P.setRnd(R);let s=P.newGame(n,Array.from({length:n},(_,i)=>'g'+i)),k=0;
 while(!s.over&&k++<6000){const a=s.phase==='summary'?{t:'next'}:bots[s.cur](s,s.cur),r=P.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' '+JSON.stringify(s.bid));s=r.s;
  const tot=P.total(s);assert(tot<=n*5+0&&tot>=1,'dadi in tavola fuori misura '+tot)}
 if(!s.over)throw new Error('partita senza fine');return s.over.win}
for(let n=2;n<=6;n++)for(let g=0;g<20;g++)partita(n,Array(n).fill((s,me)=>casuale(s,me)));
console.log('fuzz 2-6 giocatori: ok');
let ok=true;
for(const n of [3,4]){let w=0;const N=300;for(let g=0;g<N;g++){const seat=g%n;const bots=Array.from({length:n},(_,i)=>i===seat?stima:casuale);if(partita(n,bots)===seat)w++}
 console.log('Perudo '+n+' giocatori: il giocatore che stima vince '+w+'/'+N+' (caso: '+Math.round(N/n)+')');if(w<N/n*1.4)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
