// Uno: mazzo, giocabilità, effetti, +4 con sfida, accumulo, UNO dimenticato, partite complete (anche 10 giocatori, due mazzi).
const carica=require('./carica.js'),U=carica('20-uno.js','UNO'),assert=require('assert');
const R=carica.rng(4);U.setRnd(R);
const mk=(n=3,edi)=>U.newGame(n,Array.from({length:n},(_,i)=>'g'+i),{edi});
assert.strictEqual(mk(3,'caos').edi,'stack');assert(mk(3,'caos').sw);assert(mk(3,'sette').sw&&mk(3,'sette').edi==='classic');assert(!mk(3,'stack').sw);assert.strictEqual(mk(3,'boh').modo,'classic');
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
s=base();s.hands[0]=['RD','R1','R2'];let b1=s.hands[1].length;r=A(s,{t:'play',c:'RD'});assert.strictEqual(r.hands[1].length,b1+2);assert.strictEqual(r.cur,2);
// Jolly: serve il colore
s=base();s.hands[0]=['WW','R1','R2'];assert(U.act(s,{t:'play',c:'WW'}).err);r=A(s,{t:'play',c:'WW',color:'B'});assert.strictEqual(r.color,'B');
// pesca: se giocabile puoi giocarla o passare
s=base();s.hands[0]=['Y1','Y2'];s.deck=['R9','G1'];r=A(s,{t:'draw'});assert.strictEqual(r.phase,'pass');assert.strictEqual(r.drawn,'R9');assert(U.act(r,{t:'play',c:'Y1'}).err,'solo la carta pescata');
let r2=A(r,{t:'play',c:'R9'});assert.strictEqual(r2.cur,1);r2=A(r,{t:'pass'});assert.strictEqual(r2.cur,1);
s=base();s.hands[0]=['Y1','Y2'];s.deck=['B9','G1'];r=A(s,{t:'draw'});assert.strictEqual(r.cur,1,'non giocabile: passa da solo');
// UNO dimenticato: niente penalità automatica, ma il giocatore dopo può denunciarlo
s=base();s.hands[0]=['R1','R2'];r=A(s,{t:'play',c:'R1'});assert.strictEqual(r.hands[0].length,1);assert.strictEqual(r.miss,0,'scoperto');assert.strictEqual(r.cur,1);
let rk=A(r,{t:'catch'});assert.strictEqual(rk.hands[0].length,3,'denunciato: pesca 2');assert.strictEqual(rk.miss,null);assert.strictEqual(rk.cur,1,'la denuncia non consuma il turno');
assert(U.act(rk,{t:'catch'}).err,'una sola denuncia');
rk=A(r,{t:'draw'});assert.strictEqual(rk.miss,null,'se il prossimo muove, è tardi');assert(U.act(rk,{t:'catch'}).err);
r=A(s,{t:'play',c:'R1',uno:true});assert.strictEqual(r.hands[0].length,1);assert.strictEqual(r.miss,null);assert(U.act(r,{t:'catch'}).err,'chi ha detto UNO non si denuncia');
// in due: Salta riporta il turno al colpevole, che non si può più denunciare
s=base(2);s.hands[0]=['RS','R1'];r=A(s,{t:'play',c:'RS'});assert.strictEqual(r.cur,0);assert.strictEqual(r.miss,null,'il turno è tornato al colpevole: niente denuncia');
// UNO anche dopo aver pescato: con 1 carta pesco, gioco la pescata e resto con 1 carta
s=base();s.hands[0]=['Y1'];s.deck=['R9','G1'];r=A(s,{t:'draw'});assert.strictEqual(r.phase,'pass');r=A(r,{t:'play',c:'R9'});assert.strictEqual(r.miss,0,'senza UNO è scoperto');
s=base();s.hands[0]=['Y1'];s.deck=['R9','G1'];r=A(s,{t:'draw'});r=A(r,{t:'play',c:'R9',uno:true});assert.strictEqual(r.miss,null);
// doppie: due carte identiche insieme
s=base();s.hands[0]=['R7','R7','Y5','G9'];assert.strictEqual(U.maxN(s,0,'R7'),2);assert.strictEqual(U.maxN(s,0,'Y5'),1,'Y5 non è giocabile');
assert(U.act(s,{t:'play',c:'R7',n:3}).err,'non hai 3 carte');assert(U.act(s,{t:'play',c:'Y5',n:2}).err);
r=A(s,{t:'play',c:'R7',n:2});assert.strictEqual(r.hands[0].length,2);assert.strictEqual(r.discard.length,3);assert.strictEqual(r.discard[2],'R7');assert.strictEqual(r.cur,1);
s=base();s.hands[0]=['R7','R7','Y5'];r=A(s,{t:'play',c:'R7',n:2});assert.strictEqual(r.miss,0,'doppia che lascia una carta: serve UNO');
s=base();s.hands[0]=['R7','R7'];r=A(s,{t:'play',c:'R7',n:2});assert(r.over&&r.over.win===0,'si può chiudere con una doppia');
s=base();s.hands[0]=['RS','RS','R1'];r=A(s,{t:'play',c:'RS',n:2});assert.strictEqual(r.cur,0,'due Salta: salta due giocatori (con tre torna a me)');
s=base(4);s.hands[0]=['RS','RS','R1'];r=A(s,{t:'play',c:'RS',n:2});assert.strictEqual(r.cur,3);
s=base(4);s.hands[0]=['RV','RV','R1'];r=A(s,{t:'play',c:'RV',n:2});assert.strictEqual(r.dir,1,'due Inverti si annullano');assert.strictEqual(r.cur,1);
s=base(4);s.hands[0]=['RV','R1'];r=A(s,{t:'play',c:'RV'});assert.strictEqual(r.dir,-1);assert.strictEqual(r.cur,3);
s=base(2);s.hands[0]=['RV','RV','R1'];r=A(s,{t:'play',c:'RV',n:2});assert.strictEqual(r.cur,1,'in due ogni Inverti vale Salta');
s=base();s.hands[0]=['RD','RD','R1'];b1=s.hands[1].length;r=A(s,{t:'play',c:'RD',n:2});assert.strictEqual(r.hands[1].length,b1+4,'due +2 = 4 carte');assert.strictEqual(r.cur,2);
s=base(3,'stack');s.hands[0]=['RD','RD','R1'];r=A(s,{t:'play',c:'RD',n:2});assert.strictEqual(r.pend,4);
s=base();s.hands[0]=['WW','WW','R1'];assert(U.act(s,{t:'play',c:'WW',n:2,color:'B'}).err,'i jolly non si giocano in doppia');
s=base();s.hands[0]=['Y1','Y1'];s.deck=['R9','R9','G1'];r=A(s,{t:'draw'});assert.strictEqual(r.phase,'pass');assert(U.act(r,{t:'play',c:'R9',n:2}).err,'dopo la pesca solo la carta pescata');
// Chiudere con una carta speciale (regolamento ufficiale: si vince con qualsiasi carta; +2/+4 fanno pescare il prossimo prima del conteggio)
const pun=(r,w)=>r.hands.reduce((a,h,i)=>i===w?a:a+h.reduce((x,c)=>x+U.pts(c),0),0);
for(const edi of ['classic','stack','sette','caos'])for(const n of [2,3,4]){
 for(const [c,extra,pesca] of [['RS',{},0],['RV',{},0],['RD',{},2],['WW',{color:'B'},0],['WF',{color:'B'},4]]){
  s=base(n,edi);s.hands[0]=[c];const nx=n===2?1:1,b=s.hands[nx].length;r=A(s,{t:'play',c,...extra});
  assert(r.over&&r.over.win===0,'si vince chiudendo con '+c+' '+edi+n);assert.strictEqual(r.hands[nx].length,b+pesca,'pesca del prossimo con '+c);assert.strictEqual(r.over.scores[0],pun(r,0),'punti dopo la pesca con '+c);assert.strictEqual(r.hands[0].length,0)}}
// il jolly come ultima carta non chiede il colore
s=base();s.hands[0]=['WW'];r=A(s,{t:'play',c:'WW'});assert(r.over&&r.over.win===0);
s=base();s.hands[0]=['WF'];r=A(s,{t:'play',c:'WF'});assert(r.over&&r.over.win===0,'+4 come ultima carta: sempre regolare, nessuna sfida');assert.strictEqual(r.phase,'play');
s=base();s.hands[0]=['WW','R1'];assert(U.act(s,{t:'play',c:'WW'}).err,'con altre carte in mano il colore serve');
// con l'accumulo in corso, chiudere con un +2 fa pescare tutto il mucchio al prossimo
s=base(3,'stack');s.hands[0]=['RD','R1'];s.hands[1]=['YD','G1'];r=A(s,{t:'play',c:'RD'});r=A(r,{t:'play',c:'YD'});r=A(r,{t:'draw'});assert.strictEqual(r.pend,0);
s=base(3,'stack');s.pend=4;s.pendK='D';s.hands[0]=['RD'];b1=s.hands[1].length;r=A(s,{t:'play',c:'RD'});assert(r.over);assert.strictEqual(r.hands[1].length,b1+6,'4 già in tavola + 2');
// ultima carta +2 / +4: il prossimo pesca prima dei punti
s=base();s.hands[0]=['RD'];b1=s.hands[1].length;r=A(s,{t:'play',c:'RD'});assert(r.over);assert.strictEqual(r.hands[1].length,b1+2);assert.strictEqual(r.over.scores[0],r.hands[1].reduce((a,c)=>a+U.pts(c),0)+r.hands[2].reduce((a,c)=>a+U.pts(c),0));
s=base();s.hands[0]=['WF'];b1=s.hands[1].length;r=A(s,{t:'play',c:'WF',color:'B'});assert(r.over);assert.strictEqual(r.hands[1].length,b1+4);
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
// Sette-Zero: il 7 scambia la mano, lo 0 fa girare le mani
s=base(3,'sette');s.hands=[['R7','Y1','Y2'],['B1','B2'],['G1','G2','G3','G4']];r=A(s,{t:'play',c:'R7'});assert.strictEqual(r.phase,'swap');assert.strictEqual(r.cur,0,'il turno resta a chi ha giocato il 7');
assert(U.act(r,{t:'draw'}).err,'prima scegli lo scambio');assert(U.act(r,{t:'swap',to:0}).err,'non con se stessi');assert(U.act(r,{t:'swap',to:7}).err);
r=A(r,{t:'swap',to:2});assert.deepStrictEqual(r.hands[0],['G1','G2','G3','G4']);assert.deepStrictEqual(r.hands[2],['Y1','Y2']);assert.strictEqual(r.cur,1);assert.strictEqual(r.phase,'play');
assert(U.act(s,{t:'swap',to:1}).err,'swap fuori fase');
s=base(2,'sette');s.hands=[['R7','Y1','Y2'],['B1','B2','B3','B4']];r=A(s,{t:'play',c:'R7'});assert.strictEqual(r.phase,'play','in due lo scambio è automatico');assert.strictEqual(r.hands[0].length,4);assert.strictEqual(r.hands[1].length,2);assert.strictEqual(r.cur,1);
s=base(3,'sette');s.hands=[['R0','Y1'],['B1','B2','B3'],['G1','G2','G3','G4']];s.discard=['R5'];r=A(s,{t:'play',c:'R0'});assert.deepStrictEqual(r.hands[1],['Y1']);assert.deepStrictEqual(r.hands[2],['B1','B2','B3']);assert.deepStrictEqual(r.hands[0],['G1','G2','G3','G4']);assert.strictEqual(r.cur,1);
s=base(3,'sette');s.dir=-1;s.hands=[['R0','Y1'],['B1','B2','B3'],['G1','G2','G3','G4']];r=A(s,{t:'play',c:'R0'});assert.deepStrictEqual(r.hands[2],['Y1'],'le mani girano nel verso di gioco');
s=base(3,'sette');s.hands=[['R7','R7','Y1'],['B1'],['G1']];assert.strictEqual(U.maxN(s,0,'R7'),1);assert(U.act(s,{t:'play',c:'R7',n:2}).err,'7 e 0 mai in doppia');
s=base(3,'sette');s.hands=[['R7'],['B1','B2'],['G1']];r=A(s,{t:'play',c:'R7'});assert(r.over,'se il 7 è l\'ultima carta si vince subito, senza scambio');
s=base(3,'classic');s.hands=[['R7','Y1'],['B1'],['G1']];r=A(s,{t:'play',c:'R7',uno:true});assert.strictEqual(r.phase,'play','fuori da Sette-Zero il 7 è una carta normale');
// il colpevole del mancato UNO che scambia la mano non e' piu' denunciabile se non ha una carta sola
s=base(3,'sette');s.hands=[['R7','Y1'],['B1','B2','B3'],['G1','G2']];r=A(s,{t:'play',c:'R7'});assert.strictEqual(r.miss,0);r=A(r,{t:'swap',to:1});assert.strictEqual(r.miss,null);
// partite
function bot(s){const p=s.cur,h=s.hands[p];
 if(s.phase==='swap')return{t:'swap',to:(p+1+Math.floor(R()*(s.n-1)))%s.n};
 if(s.miss!=null&&s.miss!==p&&R()<.5)return{t:'catch'};
 if(s.phase==='challenge')return{t:R()<.4?'challenge':'accept'};
 const pl=U.canPlay(s,p).filter(c=>s.phase!=='pass'||c===s.drawn);
 if(pl.length&&(s.phase!=='pass'||R()<.9)){const c=pl[Math.floor(R()*pl.length)],cc=U.COLORS.slice().sort((a,b)=>h.filter(x=>x[0]===b).length-h.filter(x=>x[0]===a).length)[0];const mx=U.maxN(s,p,c),n=mx>1&&R()<.5?2:1;return{t:'play',c,n,color:cc,uno:R()<.9}}
 return{t:s.phase==='pass'?'pass':'draw'}}
for(const edi of ['classic','stack','sette','caos'])for(const n of [2,3,5,7,10])for(let g=0;g<40;g++){let s=mk(n,edi),k=0;const N=all(s).length;while(!s.over&&k++<4000){const a=bot(s),r=U.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' '+s.phase);s=r.s;assert.strictEqual(all(s).length,N,'carte perse')}
 assert(s.over,'partita senza fine '+edi+n)}
console.log('Uno: regole, +4 con sfida, accumulo, UNO e partite 2-10 giocatori ok');console.log('ALL OK');
