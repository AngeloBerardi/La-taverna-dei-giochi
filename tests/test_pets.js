// Power Hungry Pets: regole delle 11 carte, scudo, eliminazione, fine mazzo, spareggi, gettoni, partite complete.
const carica=require('./carica.js'),P=carica('19-pets.js','PETS'),assert=require('assert');
const R=carica.rng(9);P.setRnd(R);
const mk=(n=3)=>P.newGame(n,Array.from({length:n},(_,i)=>'g'+i));
const A=(s,a)=>{const r=P.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const tot=s=>s.hands.filter(x=>x!=null).length+s.out.filter(x=>x!=null).length+s.played.flat().length+s.deck.length+(s.aside.down!=null?1:0)+s.aside.up.length+(s.drawn!=null?1:0)+(s.peek&&s.phase==='trap'?1:0);
// preparazione
for(const n of [2,3,6]){const s=mk(n);assert.strictEqual(tot(s),21+0-0,'21 carte in totale');assert.strictEqual(s.target,P.TARGET[n]);assert.strictEqual(s.aside.up.length,n===2?2:0);assert.strictEqual(s.drawn!=null,true)}
// costruisce un round controllato: mano di cur, carta pescata, mani degli altri, mazzo
function set(n,{cur=0,h,d,deck}){const s=mk(n);s.cur=cur;s.hands=h.slice();s.drawn=d;s.deck=deck||[5,5,3];s.played=Array.from({length:n},()=>[]);s.out=Array(n).fill(null);s.shield=Array(n).fill(false);s.aside={down:2,up:[]};s.phase='play';return s}
let s=set(3,{h:[4,6,9],d:10});
// Re dei Gatti: giocarlo elimina
let r=A(s,{t:'play',which:'d'});assert.strictEqual(r.hands[0],null);assert.strictEqual(r.out[0],4);assert.strictEqual(r.cur,1);
// 9: chi ha il 10 scambia con te
s=set(3,{h:[3,10,5],d:9});r=A(s,{t:'play',which:'d'});assert.strictEqual(r.hands[0],10);assert.strictEqual(r.hands[1],3);
s=set(3,{h:[10,4,5],d:9});r=A(s,{t:'play',which:'d'});assert.strictEqual(r.hands[0],10,'chi ha già il re non scambia con sé');
// 8: scambio con un giocatore a scelta
s=set(3,{h:[3,6,5],d:8});assert(P.act(s,{t:'play',which:'d'}).err,'serve il bersaglio');assert(P.act(s,{t:'play',which:'d',to:0}).err,'non se stessi');
r=A(s,{t:'play',which:'d',to:1});assert.strictEqual(r.hands[0],6);assert.strictEqual(r.hands[1],3);
// 4: scudo contro 8, 3, 1, 5, 7, 9
s=set(3,{h:[3,6,5],d:4});r=A(s,{t:'play',which:'d'});assert.strictEqual(r.shield[0],true);
let q=r;q.drawn=8;assert(P.act(q,{t:'play',which:'d',to:0}).err,'bersaglio protetto');
q=JSON.parse(JSON.stringify(r));q.cur=1;q.hands=[3,6,5];q.drawn=8;let rr=A(q,{t:'play',which:'d',to:2});assert.strictEqual(rr.shield[0],true);
q=JSON.parse(JSON.stringify(r));q.cur=1;q.hands=[10,6,5];q.drawn=9;rr=A(q,{t:'play',which:'d'});assert.strictEqual(rr.hands[0],10,'lo scudo blocca il 9');
// 4 si scioglie al turno successivo
q=JSON.parse(JSON.stringify(r));q.cur=2;q.hands=[3,6,5];q.drawn=0;rr=A(q,{t:'play',which:'d'});assert.strictEqual(rr.cur,0);assert.strictEqual(rr.shield[0],false);
// 7: tutti rimettono la carta e ne ricevono una nuova
s=set(3,{h:[3,6,5],d:7,deck:[8,9,10,4]});const t0=tot(s);r=A(s,{t:'play',which:'d'});assert.strictEqual(tot(r),t0);assert(r.hands.every(x=>x!=null));
// 3: confronto, il più basso esce, parità nessuno
s=set(3,{h:[6,4,5],d:3});r=A(s,{t:'play',which:'d',to:1});assert.strictEqual(r.hands[1],null);assert.strictEqual(r.hands[0],6);
s=set(3,{h:[2,4,5],d:3});r=A(s,{t:'play',which:'d',to:1});assert.strictEqual(r.hands[0],null,'chi ha il più basso esce (anche chi ha giocato)');
s=set(3,{h:[4,4,5],d:3});r=A(s,{t:'play',which:'d',to:1});assert(r.hands[0]!=null&&r.hands[1]!=null);
// 1: indovina → eliminato; sbagli → niente
s=set(3,{h:[4,6,5],d:1});assert(P.act(s,{t:'play',which:'d',to:1,num:1}).err,'non si nomina 1');
r=A(s,{t:'play',which:'d',to:1,num:6});assert.strictEqual(r.hands[1],null);r=A(s,{t:'play',which:'d',to:1,num:7});assert.strictEqual(r.hands[1],6);
// 5: il bersaglio gioca la carta e ne pesca una; se è il Re esce; mazzo vuoto → carta da parte
s=set(3,{h:[4,6,5],d:5,deck:[9,8,7]});r=A(s,{t:'play',which:'d',to:1});assert.strictEqual(r.hands[1],9);assert.deepStrictEqual(r.played[1],[6]);
s=set(3,{h:[4,10,5],d:5,deck:[9,8,7]});r=A(s,{t:'play',which:'d',to:1});assert.strictEqual(r.hands[1],null);
s=set(3,{h:[4,6,5],d:5,deck:[]});s.aside.down=7;s.deck=[];r=P.act(s,{t:'play',which:'d',to:1});assert.strictEqual(r.s.hands[1],7,'mazzo vuoto: carta da parte');
// 6: sbircia la carta da parte e puoi scambiare
s=set(3,{h:[4,6,5],d:6});s.aside.down=9;r=A(s,{t:'play',which:'d'});assert.strictEqual(r.phase,'dig');assert.strictEqual(r.peek.card,9);let r2=A(r,{t:'dig',swap:true});assert.strictEqual(r2.hands[0],9);assert.strictEqual(r2.aside.down,4);assert.strictEqual(r2.cur,1);
// 2: guarda la prima carta e rimettila dove vuoi
s=set(3,{h:[4,6,5],d:2,deck:[9,8,7]});r=A(s,{t:'play',which:'d'});assert.strictEqual(r.phase,'trap');assert.strictEqual(r.peek.card,9);assert(P.act(r,{t:'trap',i:9}).err);r2=A(r,{t:'trap',i:2});assert.strictEqual(JSON.stringify(r2.deck),'[7,9]');assert.strictEqual(r2.drawn,8);
// ultimo in piedi vince il round e prende un gettone
s=set(2,{h:[6,4],d:3,deck:[5,5,5]});r=A(s,{t:'play',which:'d',to:1});assert.strictEqual(r.phase,'round');assert.strictEqual(r.tok[0],1);
// fine mazzo: vince la carta più alta; lo 0 batte il 10
s=set(3,{h:[4,6,8],d:0,deck:[]});s.drawn=null;s.deck=[];let e=P.act(set(3,{h:[4,6,8],d:1,deck:[]}),{t:'play',which:'d',to:1,num:9});
// con mazzo vuoto dopo il turno, il turno successivo inizia con round che termina
s=set(3,{h:[4,6,8],d:0,deck:[]});r=A(s,{t:'play',which:'d'});assert.strictEqual(r.phase,'round');assert.deepStrictEqual(r.res.win,[2],'vince la carta più alta');
s=set(3,{h:[0,10,8],d:2,deck:[]});r=A(s,{t:'play',which:'d'});assert.deepStrictEqual(r.res.win,[0],'lo 0 batte il 10 anche con altre carte in tavola');
s=set(3,{h:[4,10,8],d:0,deck:[]});r=A(s,{t:'play',which:'h'});assert.strictEqual(r.hands[0],0);assert.deepStrictEqual(r.res.win,[0],'lo 0 batte il 10');
// spareggio con le carte scoperte
s=set(3,{h:[5,5,2],d:1,deck:[]});s.played[0]=[3];s.played[1]=[8];r=A(s,{t:'play',which:'d',to:2,num:9});
// round successivo e vittoria a N gettoni
s=set(2,{h:[6,4],d:3,deck:[5,5,5]});s.tok=[2,0];r=A(s,{t:'play',which:'d',to:1});assert(r.over&&r.over.win===0);
s=set(2,{h:[6,4],d:3,deck:[5,5,5]});s.tok=[1,0];r=A(s,{t:'play',which:'d',to:1});assert(!r.over);const nx=A(r,{t:'next'});assert.strictEqual(nx.round,2);assert.strictEqual(tot(nx),21);
// partite complete a caso: carte conservate, nessun errore
function legal(s){const p=s.cur,out=[];
 if(s.phase==='round')return[{t:'next'}];if(s.phase==='dig')return[{t:'dig',swap:true},{t:'dig',swap:false}];if(s.phase==='trap')return Array.from({length:s.deck.length+1},(_,i)=>({t:'trap',i}));
 for(const w of ['h','d']){const c=w==='d'?s.drawn:s.hands[p];if(c==null)continue;const tg=P.targets(s,p,c===5);
  if([1,3,5,8].includes(c)&&tg.length){for(const to of tg){if(c===1)for(let n=0;n<=10;n++){if(n!==1)out.push({t:'play',which:w,to,num:n})}else out.push({t:'play',which:w,to})}}else out.push({t:'play',which:w})}
 return out}
for(const n of [2,3,4,5,6])for(let g=0;g<60;g++){let s=mk(n),k=0;while(!s.over&&k++<3000){const L=legal(s),a=L[Math.floor(R()*L.length)],r=P.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' '+s.phase);s=r.s;assert.strictEqual(tot(s),21,'carte perse')}
 assert(s.over,'partita senza fine '+n);assert(s.tok.some(t=>t>=s.target))}
console.log('Pets: regole, scudo, fine mazzo, spareggi e partite 2-6 giocatori ok');console.log('ALL OK');
