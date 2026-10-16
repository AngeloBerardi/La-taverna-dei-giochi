// Uno: mazzo, giocabilità, effetti, +4 con sfida, accumulo, UNO dimenticato, partite complete (anche 10 giocatori, due mazzi).
const carica=require('./carica.js'),U=carica('20-uno.js','UNO'),assert=require('assert');
const R=carica.rng(4);U.setRnd(R);
const mk=(n=3,edi)=>U.newGame(n,Array.from({length:n},(_,i)=>'g'+i),{edi});
const A=(s,a)=>{const r=U.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const all=s=>[...s.hands.flat(),...s.deck,...s.discard];
for(const n of [2,6,7,10]){const s=mk(n);assert.strictEqual(all(s).length,n>6?216:108);assert(s.hands.every(h=>h.length===7));assert(!'SVDW'.includes(s.discard[0][1])&&s.discard[0][0]!=='W')}
const base=(n=3,edi)=>{const s=mk(n,edi);s.cur=0;s.dir=1;s.discard=['R5'];s.color='R';s.pend=0;s.pendK=null;s.phase='play';s.hands=s.hands.map(()=>['Y1','Y2','B3','G4','G7']);return s};
let s=base();s.hands[0]=['R7','Y5','G9','B1','B2'];
assert(U.act(s,{t:'play',c:'B1'}).err,'colore e valore diversi');
let r=A(s,{t:'play',c:'R7'});assert.strictEqual(r.cur,1);assert.strictEqual(r.color,'R');
r=A(s,{t:'play',c:'Y5'});assert.strictEqual(r.color,'Y','stesso valore, cambia colore');
// Salta, Inverti, +2
s=base();s.hands[0]=['RS','R1','R2'];r=A(s,{t:'play',c:'RS'});assert.strictEqual(r.cur,2);
s=base();s.hands[0]=['RV','R1','R2'];r=A(s,{t:'play',c:'RV'});assert.strictEqual(r.dir,-1);assert.strictEqual(r.cur,2);
s=base(2);s.hands[0]=['RV','R1','R2'];r=A(s,{t:'play',c:'RV'});assert.strictEqual(r.cur,0,'in due, Inverti vale Salta');
s=base();s.hands[0]=['RD','R1','R2'];r=A(s,{t:'play',c:'RD'});assert.strictEqual(r.hands[1].length,7);assert.strictEqual(r.hands[1].length+0,7);
const n1=r.hands[1].length;
s=base();s.hands[0]=['RD','R1','R2'];const b1=s.hands[1].length;r=A(s,{t:'play',c:'RD'});assert.strictEqual(r.hands[1].length,b1+2);assert.strictEqual(r.cur,2);
// Jolly: serve il colore
s=base();s.hands[0]=['WW','R1','R2'];assert(U.act(s,{t:'play',c:'WW'}).err);r=A(s,{t:'play',c:'WW',color:'B'});assert.strictEqual(r.color,'B');
// pesca: se giocabile puoi giocarla o passare
s=base();s.hands[0]=['Y1','Y2'];s.deck=['R9','G1'];r=A(s,{t:'draw'});assert.strictEqual(r.phase,'pass');assert.strictEqual(r.drawn,'R9');assert(U.act(r,{t:'play',c:'Y1'}).err,'solo la carta pescata');
let r2=A(r,{t:'play',c:'R9'});assert.strictEqual(r2.cur,1);r2=A(r,{t:'pass'});assert.strictEqual(r2.cur,1);
s=base();s.hands[0]=['Y1','Y2'];s.deck=['B9','G1'];r=A(s,{t:'draw'});assert.strictEqual(r.cur,1,'non giocabile: passa da solo');
// UNO dimenticato
s=base();s.hands[0]=['R1','R2'];r=A(s,{t:'play',c:'R1'});assert.strictEqual(r.hands[0].length,3,'senza UNO pesca 2');
r=A(s,{t:'play',c:'R1',uno:true});assert.strictEqual(r.hands[0].length,1);
// vittoria
s=base();s.hands[0]=['R1'];r=A(s,{t:'play',c:'R1'});assert(r.over&&r.over.win===0);
// +4 classico: accetta
s=base();s.hands[0]=['WF','G1','R2'];r=A(s,{t:'play',c:'WF',color:'G'});assert.strictEqual(r.phase,'challenge');assert.strictEqual(r.cur,1);
let ra=A(r,{t:'accept'});assert.strictEqual(ra.hands[1].length,9);assert.strictEqual(ra.cur,2);
// sfida: aveva il colore (R2 in mano) → chi l'ha giocato pesca 4
let rc=A(r,{t:'challenge'});assert.strictEqual(rc.hands[0].length,2+4,'giocatore del +4 pesca 4');assert.strictEqual(rc.cur,1);assert.strictEqual(rc.phase,'play');
// sfida: non aveva il colore → chi sfida pesca 6
s=base();s.hands[0]=['WF','G1','B2'];r=A(s,{t:'play',c:'WF',color:'G'});rc=A(r,{t:'challenge'});assert.strictEqual(rc.hands[1].length,11);assert.strictEqual(rc.cur,2);
// accumulo
s=base(3,'stack');s.hands[0]=['RD','R1','R2'];s.hands[1]=['YD','G1','B1'];r=A(s,{t:'play',c:'RD'});assert.strictEqual(r.pend,2);assert.strictEqual(r.cur,1);
assert(U.act(r,{t:'play',c:'G1'}).err,'devi rispondere col +2 o pescare');r2=A(r,{t:'play',c:'YD'});assert.strictEqual(r2.pend,4);assert.strictEqual(r2.cur,2);
let r3=A(r2,{t:'draw'});assert.strictEqual(r3.hands[2].length,9);assert.strictEqual(r3.pend,0);assert.strictEqual(r3.cur,0);
// mazzo finito: si rimescola
s=base();s.deck=[];s.discard=['R5','Y1','Y2','B3'];s.color='B';s.hands[0]=['Y9','G9'];r=A(s,{t:'draw'});assert(all(r).length>=4);
// partite
function bot(s){const p=s.cur,h=s.hands[p];
 if(s.phase==='challenge')return{t:R()<.4?'challenge':'accept'};
 const pl=U.canPlay(s,p).filter(c=>s.phase!=='pass'||c===s.drawn);
 if(pl.length&&(s.phase!=='pass'||R()<.9)){const c=pl[Math.floor(R()*pl.length)],cc=U.COLORS.slice().sort((a,b)=>h.filter(x=>x[0]===b).length-h.filter(x=>x[0]===a).length)[0];return{t:'play',c,color:cc,uno:R()<.9}}
 return{t:s.phase==='pass'?'pass':'draw'}}
for(const edi of ['classic','stack'])for(const n of [2,3,5,7,10])for(let g=0;g<40;g++){let s=mk(n,edi),k=0;const N=all(s).length;while(!s.over&&k++<4000){const a=bot(s),r=U.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' '+s.phase);s=r.s;assert.strictEqual(all(s).length,N,'carte perse')}
 assert(s.over,'partita senza fine '+edi+n)}
console.log('Uno: regole, +4 con sfida, accumulo, UNO e partite 2-10 giocatori ok');console.log('ALL OK');
