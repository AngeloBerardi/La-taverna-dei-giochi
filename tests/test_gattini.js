// Gattini Esplosivi: mazzo e distribuzione, bomba/disinnesco, attacco a catena, Niet a catena, favore, coppie e tris,
// partite complete a caso (terminano, nessuna carta si perde) e un giocatore prudente che batte quelli casuali.
const carica=require('./carica.js'),K=carica('17-gattini.js','KITT'),assert=require('assert');
const R=carica.rng(11);K.setRnd(R);
const T=K.T,all=s=>[...s.deck,...s.discard,...s.hands.flat(),...(s.pend&&s.pend.bomb?[s.pend.bomb]:[]),...(s.pend&&s.pend.cards?[]:[])];
const mk=(n,hands,deck,o={})=>{const s=K.newGame(n,Array.from({length:n},(_,i)=>'g'+i));Object.assign(s,{hands,deck,discard:[],turner:0,cur:0,turns:1,phase:'play',pend:null,peek:null,alive:Array(n).fill(true)},o);return s};

// --- distribuzione
for(let n=2;n<=5;n++){const s=K.newGame(n,Array.from({length:n},(_,i)=>'g'+i));
 assert(s.hands.every(h=>h.length===8&&h.filter(c=>T(c)==='defuse').length===1),'8 carte, un Disinnesco a testa');
 assert.strictEqual(s.deck.filter(c=>T(c)==='bomb').length,n-1,'bombe = giocatori − 1');
 assert.strictEqual(s.deck.filter(c=>T(c)==='defuse').length,n<=3?2:6-n);
 assert.strictEqual(new Set(all(s)).size,all(s).length,'id unici')}

// --- pescare: carta normale chiude il turno; bomba con Disinnesco → reinserimento; senza → eliminato
let s=mk(3,[['cat1#1'],['cat2#1'],['cat3#1']],['skip#1','bomb#1','attack#1']);
let r=K.act(s,{t:'draw'});assert(!r.err);assert.strictEqual(r.s.turner,1);assert(r.s.hands[0].includes('skip#1'));
s=mk(3,[['defuse#1','cat1#1'],['cat2#1'],['cat3#1']],['bomb#1','attack#1']);
r=K.act(s,{t:'draw'});assert.strictEqual(r.s.phase,'insert');assert(!r.s.hands[0].includes('defuse#1'));assert.strictEqual(r.s.deck.length,1);
assert(K.act(r.s,{t:'insert',i:9}).err,'posizione oltre il mazzo');
let r2=K.act(r.s,{t:'insert',i:1});assert(!r2.err);assert.deepStrictEqual(r2.s.deck,['attack#1','bomb#1']);assert.strictEqual(r2.s.turner,1);
s=mk(3,[['cat1#1'],['cat2#1'],['cat3#1']],['bomb#1','attack#1']);
r=K.act(s,{t:'draw'});assert.strictEqual(r.s.alive[0],false);assert.strictEqual(r.s.hands[0].length,0);assert.strictEqual(r.s.turner,1);assert(r.s.discard.includes('cat1#1'));
// ultimo rimasto vince
s=mk(2,[['cat1#1'],['cat2#1']],['bomb#1','attack#1']);r=K.act(s,{t:'draw'});assert.strictEqual(r.s.over.win,1);

// --- salta e attacco (con attacco a catena: 2 turni diventano 4)
s=mk(3,[['skip#1','cat1#1'],['attack#1','cat2#1'],['cat3#1']],['cat4#1','cat4#2','cat5#1','cat5#2','cat3#2']);
r=K.act(s,{t:'play',c:'skip#1'});assert(!r.err);assert.strictEqual(r.s.turner,1,'Salta chiude il turno senza pescare');assert.strictEqual(r.s.deck.length,5);
s=mk(3,[['attack#1','cat1#1'],['attack#2','cat2#1'],['cat3#1']],['cat4#1','cat4#2','cat5#1','cat5#2','cat3#2','cat3#3']);
r=K.act(s,{t:'play',c:'attack#1'});assert.strictEqual(r.s.turner,1);assert.strictEqual(r.s.turns,2,'Attacco: due turni al successivo');assert.strictEqual(r.s.deck.length,6,'non si pesca');
r=K.act(r.s,{t:'play',c:'attack#2'});assert.strictEqual(r.s.turner,2);assert.strictEqual(r.s.turns,4,'Attacco su Attacco: 2 + 2');
s=mk(3,[['cat1#1'],['cat2#1'],['cat3#1']],['cat4#1','cat4#2','cat5#1','cat5#2'],{turner:1,cur:1,turns:2});
r=K.act(s,{t:'draw'});assert.strictEqual(r.s.turner,1);assert.strictEqual(r.s.turns,1,'primo dei due turni');r=K.act(r.s,{t:'draw'});assert.strictEqual(r.s.turner,2);

// --- Niet: dispari annulla, pari lascia passare; il Niet è una carta come le altre
s=mk(3,[['attack#1'],['nope#1'],['nope#2']],['cat1#1','cat1#2','cat2#1']);
r=K.act(s,{t:'play',c:'attack#1'});assert.strictEqual(r.s.phase,'nope');assert.strictEqual(r.s.cur,1);
let a=K.act(r.s,{t:'nope'});assert(!a.err);assert.strictEqual(a.s.cur,2,'dopo il Niet risponde chi ne ha un altro (chi ha giocato non ne ha)');
let b=K.act(a.s,{t:'pass'});assert.strictEqual(b.s.phase,'play');assert.strictEqual(b.s.turner,0,'un Niet: attacco annullato');
s=mk(3,[['attack#1'],['nope#1'],['nope#2']],['cat1#1','cat1#2','cat2#1']);
r=K.act(s,{t:'play',c:'attack#1'});a=K.act(r.s,{t:'nope'});   // 1 dice Niet
assert.strictEqual(a.s.cur,2,'ora risponde chi ha un altro Niet');b=K.act(a.s,{t:'nope'});     // 2 contro-Niet
assert.strictEqual(b.s.turner,1,'Niet sul Niet: l’attacco passa');assert.strictEqual(b.s.turns,2);
assert(K.act(r.s,{t:'draw'}).err,'durante la finestra non si pesca');
assert(K.act(mk(2,[['nope#1'],['cat1#1']],['cat2#1']),{t:'play',c:'nope#1'}).err,'il Niet non si gioca da solo');

// --- favore: sceglie chi lo riceve
s=mk(3,[['favor#1','cat1#1'],['cat2#1','cat2#2'],[]],['cat3#1','cat4#1']);
assert(K.act(s,{t:'play',c:'favor#1',to:2}).err,'chi non ha carte non si può scegliere');assert(K.act(s,{t:'play',c:'favor#1',to:0}).err);
r=K.act(s,{t:'play',c:'favor#1',to:1});assert.strictEqual(r.s.phase,'favor');assert.strictEqual(r.s.cur,1);
assert(K.act(r.s,{t:'give',c:'cat1#1'}).err,'si dà una carta propria');
r=K.act(r.s,{t:'give',c:'cat2#2'});assert(!r.err);assert(r.s.hands[0].includes('cat2#2'));assert.strictEqual(r.s.cur,0);assert.strictEqual(r.s.phase,'play');

// --- coppia (carta a caso) e tris (carta nominata)
s=mk(3,[['cat1#1','cat1#2','cat1#3','cat2#1'],['cat3#1','skip#1'],['cat4#1']],['cat5#1','cat5#2']);
assert(K.act(s,{t:'combo',cs:['cat1#1','cat2#1'],to:1}).err,'gatti diversi');
r=K.act(s,{t:'combo',cs:['cat1#1','cat1#2'],to:1});assert(!r.err);assert.strictEqual(r.s.hands[0].length,3);assert.strictEqual(r.s.hands[1].length,1);
r=K.act(s,{t:'combo',cs:['cat1#1','cat1#2','cat1#3'],to:1,name:'skip'});assert(r.s.hands[0].includes('skip#1'),'il tris ottiene la carta nominata');
r=K.act(s,{t:'combo',cs:['cat1#1','cat1#2','cat1#3'],to:1,name:'attack'});assert.strictEqual(r.s.hands[1].length,2,'se non ce l’ha non succede nulla');
assert(K.act(s,{t:'combo',cs:['cat1#1','cat1#2','cat1#3'],to:1}).err,'il tris chiede un nome');

// --- partite complete
const types=x=>x.map(T);
function legali(s){const me=s.cur,h=s.hands[me],out=[];
 if(s.phase==='nope'){out.push({t:'pass'});if(h.some(c=>T(c)==='nope'))out.push({t:'nope'});return out}
 if(s.phase==='favor'){for(const c of h)out.push({t:'give',c});return out}
 if(s.phase==='insert'){for(let i=0;i<=s.deck.length;i++)out.push({t:'insert',i});return out}
 out.push({t:'draw'});const others=K.alive(s).filter(i=>i!==me&&s.hands[i].length);
 for(const c of h){const k=T(c);if(K.ACTIONS.includes(k)){if(k==='favor')for(const to of others)out.push({t:'play',c,to});else out.push({t:'play',c})}}
 for(const k of K.CATS){const cs=h.filter(c=>T(c)===k);if(cs.length>=2)for(const to of others){out.push({t:'combo',cs:cs.slice(0,2),to});if(cs.length>=3)for(const name of ['skip','attack','defuse','nope'])out.push({t:'combo',cs:cs.slice(0,3),to,name})}}
 return out}
function casuale(s){const L=legali(s);if(s.phase==='play'&&R()<.45)return{t:'draw'};return L[Math.floor(R()*L.length)]}
function prudente(s){const me=s.cur,h=s.hands[me],has=k=>h.find(c=>T(c)===k);
 if(s.phase==='nope'){const e=s.pend.eff,mira=e.to===me||(e.k==='attack'&&K.alive(s).length&&((s.turner+1)%s.n===me));return has('nope')&&mira&&R()<.9?{t:'nope'}:{t:'pass'}}
 if(s.phase==='favor'){const c=h.find(K.isCat)||h.find(c=>T(c)!=='defuse'&&T(c)!=='nope')||h[0];return{t:'give',c}}
 if(s.phase==='insert')return{t:'insert',i:s.turns>1?s.deck.length:0};
 const top=s.peek&&s.peek.p===me&&s.peek.cards.length?s.peek.cards[0]:null,def=has('defuse'),others=K.alive(s).filter(i=>i!==me&&s.hands[i].length);
 if(top){if(T(top)!=='bomb'||def)return{t:'draw'};const c=has('skip')||has('attack')||has('shuffle');if(c)return{t:'play',c};return{t:'draw'}}
 if(def)return{t:'draw'};
 // senza Disinnesco: evita di pescare, cerca un Disinnesco, sbircia il mazzo
 const trio=K.CATS.find(k=>h.filter(c=>T(c)===k).length>=3),duo=K.CATS.find(k=>h.filter(c=>T(c)===k).length>=2);
 if(trio&&others.length)return{t:'combo',cs:h.filter(c=>T(c)===trio).slice(0,3),to:others[0],name:'defuse'};
 if(has('attack'))return{t:'play',c:has('attack')};if(has('skip'))return{t:'play',c:has('skip')};
 if(duo&&others.length)return{t:'combo',cs:h.filter(c=>T(c)===duo).slice(0,2),to:others[Math.floor(R()*others.length)]};
 if(has('future'))return{t:'play',c:has('future')};
 return{t:'draw'}}
function partida(n,bots){let s=K.newGame(n,Array.from({length:n},(_,i)=>'g'+i)),k=0;const N0=new Set(all(s));
 while(!s.over&&k++<4000){const a=bots[s.cur](s),r=K.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase);s=r.s;
  assert.strictEqual(all(s).length,N0.size,'carte perse o duplicate');if(s.phase!=='nope'&&s.phase!=='favor')assert.strictEqual(s.cur,s.cur)}
 if(!s.over)throw new Error('partita senza fine');return s.over.win}
for(let n=2;n<=5;n++)for(let g=0;g<60;g++)partida(n,Array(n).fill(casuale));
console.log('fuzz 2-5 giocatori: ok, nessuna carta persa');
let ok=true;
for(const n of [3,4]){let w=0;const N=600;for(let g=0;g<N;g++){const seat=g%n;const bots=Array.from({length:n},(_,i)=>i===seat?prudente:casuale);if(partida(n,bots)===seat)w++}
 console.log('Gattini '+n+' giocatori: il giocatore prudente vince '+w+'/'+N+' (caso: '+Math.round(N/n)+')');if(w<N/n*1.12)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
