// Agenti Segreti: chiave 9/8/7/1, indizi validi, trappola, fine per parole, bot che vince (conosce la chiave) contro bot casuale.
const carica=require('./carica.js'),S=carica('29-spie.js','SPIE'),assert=require('assert');
S.setRnd(carica.rng(11));
const mk=n=>S.newGame(n,Array.from({length:n},(_,i)=>'g'+i));
const A=(s,a)=>{const r=S.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const cnt=(s,k)=>s.key.filter(x=>x===k).length;
for(const n of [4,5,7,10]){const s=mk(n);assert.strictEqual(s.words.length,25);assert.strictEqual(new Set(s.words).size,25,'parole uniche');
 assert.strictEqual(cnt(s,s.start?'B':'R'),9);assert.strictEqual(cnt(s,s.start?'R':'B'),8);assert.strictEqual(cnt(s,'N'),7);assert.strictEqual(cnt(s,'A'),1);
 assert.strictEqual(s.cur,s.start);assert(S.isSpy(s,s.cur));assert.strictEqual(s.teams.length,n)}
// indizi non validi
let s=mk(4);const w0=s.words[0];
assert(S.act(s,{t:'clue',w:w0,k:2}).err,'parola sul tavolo');assert(S.act(s,{t:'clue',w:'due parole',k:2}).err);assert(S.act(s,{t:'clue',w:'ciao',k:10}).err);assert(S.act(s,{t:'guess',i:0}).err,'prima l’indizio');
// trappola: perde chi la tocca
s=mk(4);let r=A(s,{t:'clue',w:'zzz',k:1});const t=r.turnT,ia=r.key.indexOf('A');assert.strictEqual(r.phase,'guess');assert.notStrictEqual(r.cur,r.spies[t]);assert.strictEqual(S.teamOf(r,r.cur),t);
r=A(r,{t:'guess',i:ia});assert(r.over&&r.over.win===1-t);assert(r.over.winners.every(p=>S.teamOf(r,p)===1-t));
// parola neutra e dell'altra squadra chiudono il turno; parola giusta no
s=mk(4);r=A(s,{t:'clue',w:'yyy',k:2});const mine=r.turnT?'B':'R';let ig=r.key.indexOf(mine),inn=r.key.indexOf('N');
let q=A(r,{t:'guess',i:ig});assert.strictEqual(q.phase,'guess');assert.strictEqual(q.left,2);q=A(q,{t:'guess',i:inn});assert.strictEqual(q.phase,'clue');assert.strictEqual(q.turnT,1-r.turnT);assert(S.isSpy(q,q.cur));
assert(S.act(r,{t:'end'}).err,'non si passa senza provare');assert(S.act(A(r,{t:'guess',i:ig}),{t:'guess',i:ig}).err,'già scoperta');
// bot: la spia della squadra dà indizi «giusti» (numero = parole sue rimaste, tocca tutte); il bot casuale tocca a caso
function gioca(smart,seed){const R=carica.rng(seed);S.setRnd(R);let s=mk(6),guard=0;
 while(!s.over&&guard++<2000){if(s.phase==='clue'){const t=s.turnT,k=Math.min(9,S.left(s,t));s=A(s,{t:'clue',w:'k'+'abcdefghij'[guard%10]+'x',k})}
  else{const t=s.turnT,own=t?'B':'R',free=s.key.map((k,i)=>i).filter(i=>!s.rev[i]);
   const pick=(smart&&t===0)?free.find(i=>s.key[i]===own):free[Math.floor(R()*free.length)];s=A(s,{t:'guess',i:pick})}}
 assert(s.over,'la partita finisce');return s.over.win}
let w0n=0,N=60;for(let i=0;i<N;i++)w0n+=gioca(true,100+i)===0?1:0;
assert(w0n>N*0.9,'il bot con la chiave vince quasi sempre ('+w0n+'/'+N+')');
let w0r=0;for(let i=0;i<N;i++)w0r+=gioca(false,500+i)===0?1:0;
assert(w0r<N*0.7&&w0r>N*0.3,'a caso, pari ('+w0r+'/'+N+')');
console.log('spie OK',w0n,w0r);
/* squadre scelte: 5 giocatori, Rossi = 0,3,4 con spia 4; Blu = 1,2 con spia 2 */
{const o={teams:[0,1,1,0,0],spies:[4,2]};S.setRnd(()=>0.3);const s=S.newGame(5,['a','b','c','d','e'],o);
 assert.strictEqual(JSON.stringify(s.teams),JSON.stringify(o.teams));assert.strictEqual(JSON.stringify(s.spies),JSON.stringify([4,2]));assert.strictEqual(s.cur,s.spies[s.start]);
 assert.strictEqual(JSON.stringify(S.agents(s,0)),JSON.stringify([0,3]));assert.strictEqual(JSON.stringify(S.agents(s,1)),JSON.stringify([1]));
 let r=A(s,{t:'clue',w:'zzz',k:1});const ag=S.agents(r,r.turnT);assert(ag.includes(r.cur));
 r=A(r,{t:'guess',i:r.key.indexOf('A')});assert(r.over.winners.every(p=>r.teams[p]===1-s.turnT));
 /* squadre non valide (una sola persona): si torna a quelle di base */
 const bad=S.newGame(4,['a','b','c','d'],{teams:[0,1,1,1],spies:[0,1]});assert.strictEqual(JSON.stringify(bad.teams),JSON.stringify([0,1,0,1]));
 /* spia non della squadra: si sceglie il primo della squadra */
 const sp=S.newGame(4,['a','b','c','d'],{teams:[0,0,1,1],spies:[2,0]});assert.strictEqual(JSON.stringify(sp.spies),JSON.stringify([0,2]))}
console.log('spie squadre ok');
