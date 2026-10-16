// Exploding Kittens: fino a 10 giocatori e edizione "Implosione" (Implodente, Inverti, Pesca dal fondo, Randagio, Altera il futuro, Attacco mirato).
const carica=require('./carica.js'),K=carica('17-gattini.js','KITT'),assert=require('assert');
const R=carica.rng(3);K.setRnd(R);const T=K.T;
const eq=(a,b,m)=>assert.strictEqual(JSON.stringify(a),JSON.stringify(b),m);
const mk=(n,edi='imp')=>K.newGame(n,Array.from({length:n},(_,i)=>'g'+i),{edi});
const all=s=>[...s.hands.flat(),...s.deck,...s.discard,...(s.phase==='insert'?[s.pend.bomb]:[])];
const A=(s,a)=>{const r=K.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const rig=(s,top)=>{const p=s.turner;s.deck=top.concat(s.deck.filter(c=>!top.includes(c)));return p};
const give=(s,p,c)=>{for(const o of s.hands)if(o.includes(c))o.splice(o.indexOf(c),1);s.deck=s.deck.filter(x=>x!==c);s.discard=s.discard.filter(x=>x!==c);s.hands[p].push(c)};
// dotazioni
for(const n of [2,6,10]){const b=mk(n,'base');assert(!all(b).some(c=>['reverse','bottom','feral','alter','tattack','imp'].includes(T(c))),'il mazzo base non ha carte dell’espansione');
 const s=mk(n);assert(all(s).some(c=>T(c)==='imp'));assert.strictEqual(all(s).filter(c=>T(c)==='bomb').length,n-1);assert.strictEqual(new Set(all(s)).size,all(s).length,'id unici');
 assert.strictEqual(all(s).filter(c=>T(c)==='reverse').length,n>5?8:4);assert(s.hands.every(h=>h.length===8))}
// carte dell'espansione non giocabili nel gioco base
let s=mk(3,'base');s.hands[s.cur].push('reverse#99');assert(K.act(s,{t:'play',c:'reverse#99'}).err,'Inverti non esiste nel gioco base');
// Inverti: cambia verso e chiude il turno senza pescare
s=mk(4);let p=s.turner;give(s,p,'reverse#1');s.hands.forEach((h,i)=>{for(let k=h.length-1;k>=0;k--)if(T(h[k])==='nope')h.splice(k,1)});
let d0=s.deck.length;s=A(s,{t:'play',c:'reverse#1'});assert.strictEqual(s.dir,-1);assert.strictEqual(s.deck.length,d0,'non si pesca');assert.strictEqual(s.turner,(p+3)%4,'tocca al giocatore precedente');
// Pesca dal fondo
s=mk(3);p=s.turner;give(s,p,'bottom#1');s.hands.forEach(h=>{for(let k=h.length-1;k>=0;k--)if(T(h[k])==='nope')h.splice(k,1)});
s.deck=s.deck.filter(c=>T(c)!=='bomb'&&T(c)!=='imp');s.deck.push('skip#77');s=A(s,{t:'play',c:'bottom#1'});assert(s.hands[p].includes('skip#77'),'pesca l’ultima carta');assert.notStrictEqual(s.turner,p);
// Attacco mirato: sceglie il bersaglio, che fa due turni
s=mk(4);p=s.turner;give(s,p,'tattack#1');s.hands.forEach(h=>{for(let k=h.length-1;k>=0;k--)if(T(h[k])==='nope')h.splice(k,1)});
const tgt=(p+2)%4;assert(K.act(s,{t:'play',c:'tattack#1'}).err,'serve il bersaglio');assert(K.act(s,{t:'play',c:'tattack#1',to:p}).err,'non se stessi');
s=A(s,{t:'play',c:'tattack#1',to:tgt});assert.strictEqual(s.turner,tgt);assert.strictEqual(s.turns,2);
// Altera il futuro: riordina le prime 3
s=mk(3);p=s.turner;give(s,p,'alter#1');s.hands.forEach(h=>{for(let k=h.length-1;k>=0;k--)if(T(h[k])==='nope')h.splice(k,1)});
const before=s.deck.slice(0,3);s=A(s,{t:'play',c:'alter#1'});assert.strictEqual(s.phase,'alter');eq(s.peek.cards,before);
assert(K.act(s,{t:'alter',order:[0,0,1]}).err);assert(K.act(s,{t:'alter',order:[0,1]}).err);
s=A(s,{t:'alter',order:[2,0,1]});eq(s.deck.slice(0,3),[before[2],before[0],before[1]]);assert.strictEqual(s.phase,'play');assert.strictEqual(s.peek,null);
// Randagio: jolly nelle combinazioni
s=mk(3);p=s.turner;const o=(p+1)%3;s.hands[p]=['cat1#1','feral#1','feral#2','cat2#1'];s.hands[o]=['skip#50'];s.hands.forEach((h,i)=>{if(i!==p)for(let k=h.length-1;k>=0;k--)if(T(h[k])==='nope')h.splice(k,1)});
assert(K.act(s,{t:'combo',cs:['cat1#1','cat2#1'],to:o}).err,'gatti diversi');
let r=A(s,{t:'combo',cs:['cat1#1','feral#1'],to:o});assert(r.hands[p].includes('skip#50'),'coppia con randagio');
r=A(s,{t:'combo',cs:['feral#1','feral#2'],to:o});assert(r.hands[p].includes('skip#50'),'coppia di randagi');
// Gattino Implodente: prima volta si rimette a faccia in su, la seconda si esplode (anche con Disinnesco)
s=mk(3);p=s.turner;s.hands[p]=['defuse#91','skip#91'];s.deck=['imp#1',...s.deck.filter(c=>T(c)!=='imp'&&T(c)!=='bomb')];
s=A(s,{t:'draw'});assert.strictEqual(s.phase,'insert');assert.strictEqual(s.impUp,true);assert(s.pend.imp);assert(s.hands[p].includes('defuse#91'),'il Disinnesco non si usa');
assert.strictEqual(new Set(all(s)).size,all(s).length);s=A(s,{t:'insert',i:0});assert.strictEqual(s.deck[0],'imp#1');assert.notStrictEqual(s.turner,p);
const q=s.turner;s.hands[q]=['defuse#92'];s=A(s,{t:'draw'});assert.strictEqual(s.alive[q],false,'la seconda pescata elimina anche con Disinnesco');
// partite complete e fuzz con tutte le carte
function legali(s){const me=s.cur,h=s.hands[me],out=[];
 if(s.phase==='nope'){out.push({t:'pass'});if(h.some(c=>T(c)==='nope'))out.push({t:'nope'});return out}
 if(s.phase==='favor'){h.forEach(c=>out.push({t:'give',c}));return out}
 if(s.phase==='insert'){for(let i=0;i<=s.deck.length;i++)out.push({t:'insert',i});return out}
 if(s.phase==='alter'){const k=Math.min(3,s.deck.length);return[{t:'alter',order:Array.from({length:k},(_,i)=>i).reverse()},{t:'alter',order:Array.from({length:k},(_,i)=>i)}]}
 out.push({t:'draw'});const others=K.alive(s).filter(i=>i!==me);
 for(const c of h){const k=T(c);if(K.ACTIONS.includes(k)&&(s.edi==='imp'||K.BASE_ACT.includes(k))){if(k==='favor'||k==='tattack')for(const to of others.filter(i=>k==='tattack'||s.hands[i].length))out.push({t:'play',c,to});else out.push({t:'play',c})}}
 const cats=h.filter(K.isCat);for(let i=0;i<cats.length;i++)for(let j=i+1;j<cats.length;j++){const ty=new Set([cats[i],cats[j]].map(T).filter(x=>x!=='feral'));if(ty.size<=1)for(const to of others.filter(x=>s.hands[x].length))out.push({t:'combo',cs:[cats[i],cats[j]],to})}
 return out}
const casuale=s=>{const L=legali(s);if(s.phase==='play'&&R()<.45)return{t:'draw'};return L[Math.floor(R()*L.length)]};
function partita(n,edi){let s=mk(n,edi),k=0;const N0=all(s).length;
 while(!s.over&&k++<6000){const a=casuale(s),r=K.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase);s=r.s;assert.strictEqual(all(s).length,N0,'carte perse o duplicate')}
 if(!s.over)throw new Error('partita senza fine ('+n+','+edi+')');return s}
for(const edi of ['base','imp'])for(const n of [2,3,5,6,8,10])for(let g=0;g<25;g++)partita(n,edi);
console.log('fuzz 2-10 giocatori, gioco base ed edizione Implosione: ok, nessuna carta persa');
console.log('ALL OK');
