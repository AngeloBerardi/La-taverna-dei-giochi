const T=require('../src/js/motori/21-trono.js');const assert=require('assert');
let seed=7;T.setRnd(()=>{seed=(seed*16807)%2147483647;return seed/2147483647});
const mk=(n=3)=>T.newGame(n,['A','B','C','D'].slice(0,n));
// mazzo
let s=mk(3);assert.equal(s.deck.length,63);assert.equal(s.discard[0],'END');
assert.equal(T.newGame(2,['a','b']).deck.length,45);assert.equal(T.newGame(4,['a','b','c','d']).deck.length,81);
// pesca, bust, raccogli
s.deck=['queen','king'];s.cur=0;let r=T.act(s,{t:'reveal'});s=r.s;assert.equal(s.row[0],'queen');
r=T.act(s,{t:'reveal'});s=r.s;assert.equal(s.cur,1,'king su regina = salta');assert.equal(s.row.length,0);
// raccogli 3 carte decrescenti
s=mk(3);s.cur=0;s.deck=['king','queen','jester','x'];
for(let i=0;i<3;i++)s=T.act(s,{t:'reveal'}).s;
s=T.act(s,{t:'collect'}).s;assert.equal(s.stacks[0].king,1);assert.equal(s.stacks[0].queen,1);assert.equal(s.stacks[0].jester,1);assert.equal(s.cur,1);
// pari -> distruggi
s=mk(3);s.cur=0;s.stacks[1]={prophet:3};s.deck=['queen','queen','x'];
s=T.act(s,{t:'reveal'}).s;s=T.act(s,{t:'reveal'}).s;assert.equal(T.status(s),'eq');
r=T.act(s,{t:'destroy',p:1,type:'prophet'});assert(!r.err,r.err);s=r.s;assert.equal(s.stacks[1].prophet,2);
assert(T.act(s,{t:'destroy',p:1,type:'prophet'}).err);
// generale abbassa
s=mk(3);s.cur=0;s.stacks[0]={general:2};s.deck=['queen','king','x'];
s=T.act(s,{t:'reveal'}).s;s=T.act(s,{t:'reveal'}).s;assert.equal(s.row.length,2,'si può ancora salvare col generale');
s=T.act(s,{t:'use',k:'general'}).s;assert.equal(T.curVal(s),6);assert.equal(T.status(s),'ok');
assert(T.act(s,{t:'use',k:'general'}).err);
// scambio: re impedisce
s=mk(3);s.cur=0;s.stacks[0]={king:2};s.stacks[1]={alchemist:2};s.row=['queen'];
assert(T.act(s,{t:'swap',to:1,take:'alchemist'}).err);
s.row=['queen','jester'];r=T.act(s,{t:'swap',to:1,take:'alchemist'});assert(!r.err,r.err);
assert.equal(r.s.stacks[0].alchemist,1);assert.equal(r.s.stacks[1].queen,1);assert.equal(r.s.cur,1);
// mazzetti pieni -> overflow
s=mk(3);s.cur=0;s.stacks[0]={king:1,queen:1,general:1,jester:1,judge:1};s.row=['prophet'];s.deck=['x'];
s=T.act(s,{t:'collect'}).s;assert.equal(s.phase,'overflow');
s=T.act(s,{t:'drop',type:'king'}).s;assert.equal(s.phase,'turn');assert.equal(s.stacks[0].prophet,1);assert(!s.stacks[0].king);assert.equal(s.cur,1);
// fine
s=mk(3);s.cur=0;s.stacks[0]={king:2,queen:1};s.stacks[1]={judge:3};s.deck=['END'];s=T.act(s,{t:'reveal'}).s;
assert(s.over);assert.deepEqual(s.over.scores,[9,5,0]);assert.equal(s.over.win,0);
// rimescola
s=mk(2);s.deck=[];s.discard=['king','END'];s.cur=0;s=T.act(s,{t:'reveal'}).s;assert(s.over||s.row.length===1);
console.log('ok');
// partite casuali: nessun blocco, termina
for(let g=0;g<300;g++){const n=2+g%3;let s=T.newGame(n,['a','b','c','d'].slice(0,n)),k=0;
 while(!s.over&&k++<4000){const p=s.cur;let a;const o=(arr)=>arr[Math.floor(Math.random()*arr.length)];
  if(s.phase==='overflow'){const q=s.pend.need[0];a={t:'drop',type:o([q.type,...Object.keys(s.stacks[p])])}}
  else{const c=[{t:'reveal'},{t:'reveal'},{t:'collect'},{t:'giveup'},{t:'use',k:'general'},{t:'use',k:'jester',d:-1},{t:'use',k:'assassin'},{t:'use',k:'prophet'},{t:'use',k:'judge',via:'general'},
    {t:'swap',to:(p+1)%n,take:o(T.TYPES)},{t:'destroy',p:(p+1)%n,type:o(T.TYPES)},{t:'destroy',p,type:o(T.TYPES)}];a=o(c)}
  const r=T.act(s,a);if(!r.err)s=r.s}
 assert(s.over||k>=4000===false||true);if(!s.over&&k>=4000)throw new Error('non termina '+g)}
console.log('casuali ok');
