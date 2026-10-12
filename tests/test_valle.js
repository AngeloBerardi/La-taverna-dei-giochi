// Valle Selvaggia: punteggi delle carte su casi costruiti a mano, conservazione di tessere e animali,
// partite da 1 a 4 sempre concluse dopo 20 turni a testa, bot goloso batte il casuale.
const V=require('../src/js/motori/14-valle-selvaggia.js'),carica=require('./carica.js');const assert=require('assert');
// --- casi a mano ---
const T=(h,a,k=0)=>({t:{h,a,k},rot:0,tok:null});
function board(list){const B={};for(const[q,r,tok,h]of list){B[q+','+r]={t:{h:h||['M'],a:'oasfv',k:0},rot:0,tok}}return B}
const st=(B,n=1)=>({n,boards:[{cells:B,nature:0}]});
assert.strictEqual(V.score(st(board([[0,0,'o'],[1,0,'o']])))[0].an.o,4,'una coppia di orsi = 4');
assert.strictEqual(V.score(st(board([[0,0,'o'],[1,0,'o'],[2,0,'o']])))[0].an.o,0,'tre orsi insieme non sono una coppia');
assert.strictEqual(V.score(st(board([[0,0,'a'],[1,0,'a'],[2,0,'a']])))[0].an.a,9,'fila di 3 alci = 9');
assert.strictEqual(V.score(st(board([[0,0,'s'],[1,0,'s'],[2,0,'s']])))[0].an.s,7,'corso di 3 salmoni = 7');
assert.strictEqual(V.score(st(board([[0,0,'s'],[1,0,'s'],[-1,0,'s'],[0,1,'s']])))[0].an.s,0,'salmone con 3 vicini rompe il corso');
assert.strictEqual(V.score(st(board([[0,0,'f'],[3,0,'f'],[1,0,'f']])))[0].an.f,2,'solo il falco isolato conta');
assert.strictEqual(V.score(st(board([[0,0,'v'],[1,0,'o'],[0,1,'a'],[-1,0,'o']])))[0].an.v,2,'volpe: 2 specie diverse vicine');
assert.strictEqual(V.score(st(board([[0,0,null,['F']],[1,0,null,['F']],[2,0,null,['F']],[0,1,null,['M']]])))[0].cor.F,3,'corridoio di foresta da 3');
// tessera doppia ruotata: il lato 0 (E) è habitat h[0] con rot 0, h[1] con rot 3
const dual={t:{h:['F','R'],a:'o',k:0},rot:0,tok:null};assert.strictEqual(V.edgeH(dual,0),'F');assert.strictEqual(V.edgeH({...dual,rot:3},0),'R');
console.log('casi di punteggio: ok');
// --- partite ---
function opzioni(s){const p=s.cur,out=[];for(let i=0;i<4;i++){if(!s.disp[i].t)continue;for(const[q,r]of V.spots(s,p))for(let rot=0;rot<(s.disp[i].t.h.length>1?6:1);rot++)out.push({t:'place',tile:i,q,r,rot})}return out}
function gol(s){const p=s.cur;const base=V.score(s)[p].tot;
 if(s.phase==='token'){let best={v:-1,a:{t:'skip'}};for(const[q,r]of V.tokSpots(s,p,s.held)){const n=V.act(s,{t:'token',q,r}).s;const v=V.score({n:s.n,boards:n.boards})[p].tot-base;if(v>best.v)best={v,a:{t:'token',q,r}}}return best.a}
 let best=null;for(const a of opzioni(s)){const r=V.act(s,a);if(r.err)continue;const n=r.s;let v=V.score({n:s.n,boards:n.boards})[p].tot-base;
  if(n.phase==='token'){let bt=0;for(const[q,rr]of V.tokSpots(n,p,n.held)){const m=V.act(n,{t:'token',q,r:rr}).s;bt=Math.max(bt,V.score({n:s.n,boards:m.boards})[p].tot-base-v)}v+=bt}
  if(!best||v>best.v)best={v,a}}return best.a}
function rnd(s,R){if(s.phase==='token'){const t=V.tokSpots(s,s.cur,s.held);if(!t.length||R()<.1)return{t:'skip'};const[q,r]=t[Math.floor(R()*t.length)];return{t:'token',q,r}}
 const o=opzioni(s);return o[Math.floor(R()*o.length)]}
function conta(s){let tiles=s.pile.length+s.disp.filter(d=>d.t).length,toks=s.bag.length+s.disp.filter(d=>d.k).length+(s.held&&s.phase==='token'?1:0);
 for(const b of s.boards)for(const k in b.cells){tiles++;if(b.cells[k].tok)toks++}return{tiles,toks}}
function partita(n,chi,R){V.setRnd(R);let s=V.newGame(n,['a','b','c','d'].slice(0,n)),k=0;const c0=conta(s);
 while(!s.over&&k++<1000){const a=s.cur===chi?gol(s):rnd(s,R),r=V.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));s=r.s;
  const c=conta(s);if(c.toks!==100||c.tiles!==c0.tiles)throw new Error('conteggio: '+JSON.stringify(c))}
 if(!s.over)throw new Error('senza fine');s.boards.forEach(b=>assert.strictEqual(Object.keys(b.cells).length,23));return s.over}
const R=carica.rng(37);let ok=true;
// azioni con pigne e sovrappopolazione
{V.setRnd(R);let s=V.newGame(2,['a','b']);s.boards[0].nature=2;const r=V.act(s,{t:'wipe',idx:[0,1]});assert(!r.err&&r.s.boards[0].nature===1,'cambio animali con pigna');
 const f=V.act(r.s,{t:'place',tile:0,tok:2,...(()=>{const[q,rr]=V.spots(r.s,0)[0];return{q,r:rr}})(),rot:0});assert(!f.err&&f.s.boards[0].nature===0,'scelta libera con pigna')}
for(const n of [1,2,3,4]){let w=0,sc=0;const N=n===1?3:3;for(let g=0;g<N;g++){const o=partita(n,g%n,R);if(o.winners.includes(g%n))w++;sc+=o.scores[g%n]}
 console.log('Valle Selvaggia',n,'giocatori: il bot goloso',n===1?'fa in media '+Math.round(sc/N)+' punti':'vince '+Math.round(w/N*100)+'%');
 if(n>1&&w/N<.75)ok=false;if(n===1&&sc/N<60)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
