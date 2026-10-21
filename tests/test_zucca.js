// Zucca Matta: percorso, jolly, pesca per categoria, cultura che si risolve da sé, finale scelta dagli avversari, bot che riesce sempre vs bot che spesso fallisce.
const carica=require('./carica.js'),Z=carica.multi(['30-domande.js','32-zucca.js'],'ZUCCA'),assert=require('assert');
Z.setRnd(carica.rng(5));
const mk=n=>Z.newGame(n,Array.from({length:n},(_,i)=>'sq'+i));
const A=(s,a)=>{const r=Z.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
// percorso: jolly ogni 8, traguardo in fondo, tutte le prove presenti
let jol=0,cats=new Set();for(let p=0;p<Z.PATH;p++){const k=Z.sq(p);if(k===-1)jol++;else if(k>=0)cats.add(k)}assert.strictEqual(jol,4);assert.strictEqual(cats.size,5);assert.strictEqual(Z.sq(Z.GOAL),-2);
// contenuti
assert(Z.MIMO.length>=25&&Z.DISEGNO.length>=25&&Z.CANTO.length>=20&&Z.PAROLE_W.length>=30&&Z.INDOVINELLI.length>=10);
for(const id of ['mimo','disegno','canto','parole','cultura']){const k=Z.CATS.findIndex(c=>c.id===id);let s=mk(2);s.pos[s.cur]=0;s.cat=k;s.phase='draw';const r=A(s,{t:'draw'});assert.strictEqual(r.phase,'play');assert(r.card&&r.card.t,id);if(id==='cultura'){assert.strictEqual(r.card.o.length,4)}if(id==='parole')assert(r.card.a)}
// successo: si avanza del dado e tocca all'altra squadra; fallimento: si resta
let s=mk(3);s.pos=[0,0,0];s.cur=0;s.cat=Z.CATS.findIndex(c=>c.id==='mimo');s.phase='draw';let r=A(s,{t:'draw'});assert(Z.act(r,{t:'answer',k:0}).err,'mimo non ha risposte');
let ok=A(r,{t:'result',ok:true});assert(ok.pos[0]>=1&&ok.pos[0]<=6&&ok.cur===1);assert(ok.ev.some(e=>e.t==='roll'));
let no=A(r,{t:'result',ok:false});assert.strictEqual(no.pos[0],0);assert.strictEqual(no.cur,1);
// cultura: risposta giusta avanza, sbagliata no
s=mk(2);s.pos=[0,0];s.cur=0;s.cat=4;s.phase='draw';r=A(s,{t:'draw'});assert(Z.act(r,{t:'result',ok:true}).err,'cultura si risponde');
assert(A(r,{t:'answer',k:r.card.a}).pos[0]>0);assert.strictEqual(A(r,{t:'answer',k:(r.card.a+1)%4}).pos[0],0);
// jolly: la squadra sceglie la prova
s=mk(2);s.pos=[7,0];s.cur=0;s.phase='draw';s.cat=0;let b=Z.act(s,{t:'result',ok:true});assert(b.err);
s=mk(2);s.pos=[6,0];s.cur=0;s.cat=0;s.phase='play';s.card={cat:0,t:'x'};r=A(s,{t:'result',ok:true});
// forza una squadra su casella jolly e controlla begin
s=mk(2);s.cur=0;s.pos=[0,0];s.phase='play';s.card={cat:0,t:'x'};s.pos[0]=7-0;let j=A({...s,pos:[7,0],cur:1,phase:'play',card:{cat:0,t:'x'}},{t:'result',ok:false});assert.strictEqual(j.cur,0);assert.strictEqual(j.phase,'choose');
const jc=A(j,{t:'choose',cat:2});assert.strictEqual(jc.phase,'draw');assert.strictEqual(jc.cat,2);
// traguardo: l'avversario sceglie la prova; riuscire = vittoria, fallire = si riprova
s=mk(3);s.pos=[Z.GOAL-1,0,0];s.cur=0;s.cat=0;s.phase='play';s.card={cat:0,t:'x'};let g=A(s,{t:'result',ok:true});
if(g.pos[0]===Z.GOAL){assert.strictEqual(g.cur,1)}
s=mk(3);s.pos=[0,Z.GOAL,0];s.cur=0;s.phase='play';s.card={cat:0,t:'x'};g=A(s,{t:'result',ok:false});assert.strictEqual(g.cur,2);assert.strictEqual(g.phase,'pick');assert.strictEqual(g.who,1);
const f=A(g,{t:'pick',cat:1});assert.strictEqual(f.cur,1);assert(f.final);assert.strictEqual(f.phase,'draw');const fp=A(f,{t:'draw'});
const lose=A(fp,{t:'result',ok:false});assert(!lose.over&&lose.cur===2&&lose.pos[1]===Z.GOAL&&lose.phase==='draw'&&lose.who===-1);
const win=A(fp,{t:'result',ok:true});assert(win.over&&win.over.win===1);assert(Z.act(win,{t:'draw'}).err);
// partite complete
function gioca(seed,rates){const R=carica.rng(seed);Z.setRnd(R);let s=mk(rates.length),n=0;
 while(!s.over&&n++<20000){const p=s.cur,good=R()<rates[p];
  if(s.phase==='choose')s=A(s,{t:'choose',cat:Math.floor(R()*5)});
  else if(s.phase==='pick')s=A(s,{t:'pick',cat:Math.floor(R()*5)});
  else if(s.phase==='draw')s=A(s,{t:'draw'});
  else if(s.card.o)s=A(s,{t:'answer',k:good?s.card.a:(s.card.a+1)%4});
  else s=A(s,{t:'result',ok:good})}
 assert(s.over,'la partita finisce');return s.over.win}
let w=0,N=40;for(let i=0;i<N;i++)w+=gioca(40+i,[1,.3])===0?1:0;assert(w>=N*.9,'squadra sicura vince ('+w+'/'+N+')');
let w2=0;for(let i=0;i<20;i++)w2+=gioca(700+i,[.6,.6,.6])<3?1:0;assert.strictEqual(w2,20);
console.log('zucca OK',w);
