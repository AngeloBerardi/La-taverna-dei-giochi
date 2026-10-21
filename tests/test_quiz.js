// Quiz della Taverna: percorso a 42 caselle, spicchi, rilancia, domande senza ripetizioni, finale scelta dagli avversari, bot che vince e bot casuale che perde.
const carica=require('./carica.js'),Q=carica.multi(['30-domande.js','31-quiz.js'],'QUIZ'),D=carica('30-domande.js','DOMANDE'),assert=require('assert');
Q.setRnd(carica.rng(7));
const mk=n=>Q.newGame(n,Array.from({length:n},(_,i)=>'g'+i));
const A=(s,a)=>{const r=Q.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
// percorso: 6 spicchi (una per categoria), 6 rilancia, resto caselle normali di tutte le categorie
let hub=0,ril=0,cats=new Set();for(let p=0;p<Q.SQ;p++){const k=Q.sq(p);if(k.h!=null)hub++;else if(k.r)ril++;else cats.add(k.c)}
assert.strictEqual(hub,6);assert.strictEqual(ril,6);assert.strictEqual(cats.size,6);
// banco domande
assert.strictEqual(D.CATS.length,6);for(const c of D.CATS)assert.strictEqual(D.Q[c.id].length,20);
let s=mk(3);assert(s.hands.length===3&&s.phase==='roll');assert(Q.act(s,{t:'move',dir:1}).err,'prima il dado');assert(Q.act(s,{t:'answer',k:0}).err);
// dado e direzioni
let r=A(s,{t:'roll'});assert(r.roll>=1&&r.roll<=6&&r.phase==='move');const d=Q.dests(r);assert.strictEqual(d.length,2);assert(Q.act(r,{t:'move',dir:2}).err);
// domanda con una sola risposta giusta
r=A(s,{t:'roll'});r.roll=1;r.pos[r.cur]=1;let m=A(r,{t:'move',dir:1});assert.strictEqual(m.phase,'ask');assert.strictEqual(m.q.o.length,4);assert.strictEqual(new Set(m.q.o).size,4);assert(m.q.a>=0&&m.q.a<4);
const cur=m.cur;let w=A(m,{t:'answer',k:(m.q.a+1)%4});assert.strictEqual(w.cur,(cur+1)%3,'risposta sbagliata: passa il turno');
let g=A(m,{t:'answer',k:m.q.a});assert.strictEqual(g.cur,cur,'giusta: tira ancora');assert.strictEqual(g.phase,'roll');
// rilancia
r=A(s,{t:'roll'});r.roll=3;r.pos[r.cur]=0;m=A(r,{t:'move',dir:1});assert.strictEqual(m.phase,'roll');assert.strictEqual(m.cur,r.cur);
// spicchio: si guadagna solo sullo spicchio con risposta giusta
r=A(s,{t:'roll'});r.roll=1;r.pos[r.cur]=6;m=A(r,{t:'move',dir:1});assert(m.hub&&m.pos[m.cur]===7);const cat=Q.sq(7).h;g=A(m,{t:'answer',k:m.q.a});assert(g.wedge[m.cur]&(1<<cat),'spicchio guadagnato');
// finale: con sei spicchi sceglie la categoria chi viene dopo; sbagliare rimanda a uno spicchio, indovinare vince
r=A(s,{t:'roll'});r.wedge[r.cur]=63^(1<<1);r.roll=1;r.pos[r.cur]=6;m=A(r,{t:'move',dir:1});assert.strictEqual(Q.sq(7).h,1);g=A(m,{t:'answer',k:m.q.a});
assert.strictEqual(g.phase,'pick');assert.strictEqual(g.cur,(m.cur+1)%3);assert.strictEqual(g.who,m.cur);assert(Q.act(g,{t:'answer',k:0}).err);
const f=A(g,{t:'pick',cat:3});assert.strictEqual(f.cur,m.cur);assert(f.q.final&&f.q.cat===3);
const lose=A(f,{t:'answer',k:(f.q.a+1)%4});assert(!lose.over&&lose.phase==='roll'&&lose.pos[m.cur]===0&&lose.cur===(m.cur+1)%3);
const win=A(f,{t:'answer',k:f.q.a});assert(win.over&&win.over.win===m.cur&&win.over.winners[0]===m.cur);assert(Q.act(win,{t:'roll'}).err);
// nessuna domanda si ripete finché ne restano
s=mk(2);const seen=new Set();for(let i=0;i<20;i++){const t=s.cur;let x=A(s,{t:'roll'});x.roll=1;x.pos[x.cur]=0;x=A(x,{t:'move',dir:1});const k=x.q.t;if(Q.sq(1).c===x.q.cat){assert(!seen.has(k),'domanda ripetuta');seen.add(k)}s=A(x,{t:'answer',k:x.q.a});}
// partite complete: bot sicuro (risponde giusto, va verso lo spicchio mancante) contro bot casuale
function gioca(seed,smartSeats){const R=carica.rng(seed);Q.setRnd(R);let s=mk(smartSeats.length),n=0;
 while(!s.over&&n++<60000){const smart=smartSeats[s.cur];
  if(s.phase==='roll')s=A(s,{t:'roll'});
  else if(s.phase==='move'){let best=Q.dests(s)[R()<.5?0:1];if(smart){const need=[0,1,2,3,4,5].filter(c=>!(s.wedge[s.cur]&(1<<c)));let b=-1;for(const dd of Q.dests(s)){const k=Q.sq(dd.to);const sc=k.h!=null&&need.includes(k.h)?3:k.r?2:1;if(sc>b){b=sc;best=dd}}}s=A(s,{t:'move',dir:best.dir})}
  else if(s.phase==='ask')s=A(s,{t:'answer',k:smart?s.q.a:Math.floor(R()*4)});
  else if(s.phase==='pick')s=A(s,{t:'pick',cat:Math.floor(R()*6)})}
 assert(s.over,'la partita finisce');return s.over.win}
let wins=0,N=40;for(let i=0;i<N;i++)wins+=gioca(300+i,[true,false])===0?1:0;assert(wins>=N*.9,'il bot sicuro vince ('+wins+'/'+N+')');
let rnd=0;for(let i=0;i<10;i++)rnd+=gioca(900+i,[false,false,false])<3?1:0;assert.strictEqual(rnd,10);
console.log('quiz OK',wins);
