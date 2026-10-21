// Caccia al Fantasma: mappa connessa, biglietti, rivelazioni, doppia mossa, catture, bot detective (che vede il Fantasma) contro Fantasma a caso e Fantasma abile contro detective a caso.
const carica=require('./carica.js'),F=carica('33-fantasma.js','FANTASMA'),assert=require('assert');
F.setRnd(carica.rng(3));
const mk=n=>F.newGame(n,Array.from({length:n},(_,i)=>i?'d'+i:'Fantasma'));
const A=(s,a)=>{const r=F.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
// mappa: 72 incroci, taxi connesso, bus e metro presenti, archi simmetrici
assert.strictEqual(F.N,72);for(let i=0;i<F.N;i++){assert(F.dist(0,i,['taxi'])<99,'taxi connesso');for(const t of F.TYPES)for(const j of F.adj[t][i])assert(F.adj[t][j].includes(i),'archi simmetrici')}
assert(F.adj.bus.some(a=>a.length)&&F.adj.metro.some(a=>a.length));
// fiume: si passa solo ai ponti; i traghetti collegano le rive e solo con il biglietto nero
for(let i=0;i<F.N;i++)for(const t of F.TYPES)for(const j of F.adj[t][i])if(i%F.W<=3&&j%F.W>=4)assert(F.BR.includes(Math.floor(i/F.W)),'si attraversa solo ai ponti');
assert(F.FERRY.every(f=>F.adj.ferry[f[1]*F.W+f[0]].includes(f[3]*F.W+f[2])));assert(F.FERRY.every(f=>!F.moves({...mk(3),pos:[f[1]*F.W+f[0],0,71],tk:[{taxi:9,bus:9,metro:9,black:1,dbl:0},{},{}]},0).filter(m=>m.tk!=='black').some(m=>m.to===f[3]*F.W+f[2])),'senza nero niente traghetto');
assert(F.FERRY.every(f=>F.moves({...mk(3),pos:[f[1]*F.W+f[0],0,71]},0).some(m=>m.tk==='black'&&m.to===f[3]*F.W+f[2])),'con il nero sì');
// partenza: n posizioni distinte, biglietti previsti
for(const n of [3,4,6]){const s=mk(n);assert.strictEqual(new Set(s.pos).size,n);assert.strictEqual(s.tk[0].black,n-1);assert.strictEqual(s.tk[0].dbl,2);assert.deepStrictEqual([s.tk[1].taxi,s.tk[1].bus,s.tk[1].metro],[10,8,4]);assert.strictEqual(s.cur,0);assert.strictEqual(s.phase,'ghost')}
// mosse non valide
let s=mk(4);assert(F.act(s,{t:'move',to:s.pos[0],tk:'taxi'}).err,'non si sta fermi');const far=[...Array(F.N).keys()].find(i=>F.dist(s.pos[0],i)>3);assert(F.act(s,{t:'move',to:far,tk:'black'}).err,'troppo lontano');
// mossa del Fantasma: consuma il biglietto, passa ai detective in ordine, il biglietto del detective va al Fantasma
let m=F.moves(s,0).find(x=>x.tk==='taxi');let r=A(s,{t:'move',to:m.to,tk:m.tk});assert.strictEqual(r.tk[0].taxi,3);assert.strictEqual(r.round,1);assert.strictEqual(r.phase,'det');assert.strictEqual(r.cur,1);assert.strictEqual(r.trail[0],'taxi');
const dm=F.moves(r,1)[0];const g0=r.tk[0][dm.tk];const r2=A(r,{t:'move',to:dm.to,tk:dm.tk});assert.strictEqual(r2.tk[0][dm.tk],g0+1,'il biglietto passa al Fantasma');assert.strictEqual(r2.tk[1][dm.tk],r.tk[1][dm.tk]-1);assert.strictEqual(r2.cur,2);assert(F.act(r2,{t:'double'}).err,'solo il Fantasma, solo nel suo turno');
// cattura: un detective arriva sul Fantasma
s=mk(3);s.pos=[10,11,40];s.cur=1;s.phase='det';m=F.moves(s,1).find(x=>x.to===10);assert(m,'11 è vicino al 10');r=A(s,{t:'move',to:10,tk:m.tk});assert(r.over&&r.over.winners.length===2&&!r.over.winners.includes(0));
// i detective non si sovrappongono e il Fantasma non entra su un detective
s=mk(3);s.pos=[10,11,40];s.phase='ghost';s.cur=0;assert(!F.moves(s,0).some(x=>x.to===11));s.phase='det';s.cur=2;s.pos[2]=19;assert(!F.moves(s,2).some(x=>x.to===11));
// rivelazioni ai round 3, 8, 13, 18, 24
s=mk(3);let rev=[];for(let k=0;k<24&&!s.over;k++){let q=F.moves(s,0)[0];if(!q)break;s.pos[1]=71;s.pos[2]=70;s=A(s,{t:'move',to:q.to,tk:q.tk});if(s.last&&s.last.round===s.round&&!rev.includes(s.round))rev.push(s.round);if(s.over)break;while(s.phase==='det'&&!s.over){const d=F.moves(s,s.cur).find(x=>x.to!==s.pos[0]);s.pos[s.cur]=s.cur===1?71:70;s=A({...s,pos:s.pos.map((p,i)=>i===s.cur?(i===1?71:70):p),tk:s.tk},{t:'move',to:F.moves({...s,pos:s.pos.map((p,i)=>i===s.cur?(i===1?71:70):p)},s.cur)[0].to,tk:F.moves({...s,pos:s.pos.map((p,i)=>i===s.cur?(i===1?71:70):p)},s.cur)[0].tk})}}
assert.deepStrictEqual(rev,[3,8,13,18,24].filter(x=>x<=s.round));
// doppia mossa: due mosse di fila, due round; non all'ultimo round
s=mk(3);s.pos=[30,0,71];r=A(s,{t:'double'});assert.strictEqual(r.dbl,1);assert.strictEqual(r.tk[0].dbl,1);m=F.moves(r,0)[0];r=A(r,{t:'move',to:m.to,tk:m.tk});assert.strictEqual(r.phase,'ghost');assert.strictEqual(r.cur,0);assert.strictEqual(r.dbl,2);m=F.moves(r,0)[0];r=A(r,{t:'move',to:m.to,tk:m.tk});assert.strictEqual(r.round,2);assert.strictEqual(r.phase,'det');
s=mk(3);s.round=23;assert(F.act(s,{t:'double'}).err);
// biglietti esauriti: i detective senza mosse saltano; se non ne ha nessuno vince il Fantasma
s=mk(3);s.pos=[30,0,71];s.tk[1]={taxi:0,bus:0,metro:0,black:0,dbl:0};s.tk[2]={taxi:0,bus:0,metro:0,black:0,dbl:0};m=F.moves(s,0)[0];r=A(s,{t:'move',to:m.to,tk:m.tk});assert(r.over&&r.over.winners.length===1&&r.over.winners[0]===0&&r.over.why==='bloccati');
// partite complete
function gioca(seed,n,detSmart,ghostSmart){const R=carica.rng(seed);F.setRnd(R);let s=mk(n),k=0;
 while(!s.over&&k++<3000){const mv=F.moves(s,s.cur);if(!mv.length)throw new Error('senza mosse');let pick;
  if(s.cur===0){if(ghostSmart){const dets=s.pos.slice(1);let best=-1;for(const x of mv){const d=Math.min(...dets.map(p=>F.dist(x.to,p)))+(x.tk==='black'?-.5:0);if(d>best||(d===best&&R()<.5)){best=d;pick=x}}}else pick=mv[Math.floor(R()*mv.length)];if(!ghostSmart&&s.tk[0].dbl&&!s.dbl&&R()<.1){s=A(s,{t:'double'});continue}}
  else if(detSmart){let best=99;for(const x of mv){const d=F.dist(x.to,s.pos[0])+R()*.4;if(d<best){best=d;pick=x}}}
  else pick=mv[Math.floor(R()*mv.length)];
  s=A(s,{t:'move',to:pick.to,tk:pick.tk})}
 assert(s.over,'la partita finisce');return s.over.winners.includes(0)}
let det=0,N=40;for(let i=0;i<N;i++)det+=gioca(50+i,5,true,false)?0:1;assert(det>=N*.9,'detective che vedono il Fantasma vincono ('+det+'/'+N+')');
let gh=0;for(let i=0;i<N;i++)gh+=gioca(200+i,4,false,true)?1:0;assert(gh>=N*.8,'Fantasma abile contro detective a caso ('+gh+'/'+N+')');
console.log('fantasma OK',det,gh);
