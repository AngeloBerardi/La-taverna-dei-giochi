// Catan 5-6 e 7-8 giocatori: plance più grandi, dotazioni, fase di costruzione speciale, partite complete.
const carica=require('./carica.js'),C=carica('18-catan.js','CATAN'),assert=require('assert');
const R=carica.rng(11);C.setRnd(R);const RES=C.RES;
const names=n=>Array.from({length:n},(_,i)=>'g'+i);
const eq=(a,b,m)=>assert.strictEqual(JSON.stringify(a),JSON.stringify(b),m);
const A=(s,p,a)=>{const r=C.act(s,{seat:p,...a});if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase);return r.s};
const inv=s=>RES.forEach(k=>assert.strictEqual(s.bank[k]+s.res.reduce((a,r)=>a+r[k],0),C.KIT[s.prof].bank,'carte '+k));
const PROFILI={5:['b',30,11,24,34,28],6:['b',30,11,24,34,28],7:['c',37,12,29,43,35],8:['c',37,12,29,43,35]};
for(const n of [5,6,7,8]){
 const [prof,nh,np,bank,deck,ntok]=PROFILI[n];C.setRnd(R);const s=C.newGame(n,names(n)),G=C.geo(s);
 assert.strictEqual(s.prof,prof);assert.strictEqual(G.HX.length,nh,'esagoni '+n);assert.strictEqual(s.hexes.length,nh);
 assert(G.HX.every(h=>h.v.length===6&&h.e.length===6));assert(G.V.every(v=>v.n.length>=2&&v.n.length<=3));
 assert.strictEqual(G.V.length-G.E.length+nh,1,'formula di Eulero (plancia connessa e senza buchi)');
 assert.strictEqual(s.ports.length,np);assert.strictEqual(new Set(s.ports.map(p=>p.e)).size,np);assert(s.ports.every(p=>G.E[p.e].h.length===1));
 RES.forEach(k=>assert.strictEqual(s.ports.filter(p=>p.k===k).length,1));
 assert.strictEqual(s.hexes.filter(h=>h.num).length,ntok);assert.strictEqual(s.hexes.filter(h=>h.t==='desert').length,2);
 assert.strictEqual(s.deck.length,deck);assert.strictEqual(s.bank.wood,bank);
 for(let g=0;g<30;g++){const t=C.newGame(n,names(n));t.hexes.forEach((h,i)=>{if(h.num===6||h.num===8)G.HN[i].forEach(j=>assert(t.hexes[j].num!==6&&t.hexes[j].num!==8,'6 e 8 adiacenti in '+n))})}
 // nessuna colonia di preparazione può essere sul mare: ogni incrocio tocca almeno un esagono
 assert(G.V.every(v=>v.h.length>=1));
}
// fase di costruzione speciale
let s=C.newGame(5,names(5));const G=C.geo(s);
const spotV=(s,p)=>C.settleSpots(s,p,true);
while(s.phase==='setup'){const p=s.cur,S=s.setup;if(S.step==='v')s=A(s,p,{t:'settle',v:spotV(s,p)[0]});else s=A(s,p,{t:'road',e:C.roadSpots(s,p,S.v)[0]})}
assert.strictEqual(s.phase,'roll');const first=s.cur;
s.dice=[3,4];s.phase='main';s.res[first].wood+=1;s.bank.wood-=1;
s=A(s,first,{t:'end'});assert.strictEqual(s.phase,'sbp');assert.strictEqual(s.cur,(first+1)%5);
assert(C.act(s,{seat:first,t:'roll'}).err,'chi ha finito non agisce');
const sb=s.cur;
assert(C.act(s,{seat:sb,t:'offer',give:{wood:1},want:{ore:1}}).err,'niente scambi');
assert(C.act(s,{seat:sb,t:'play',card:'knight'}).err,'niente sviluppo');
assert(C.act(s,{seat:sb,t:'roll'}).err,'niente dadi');
// chi ha le risorse costruisce
s.res[sb]={wood:1,brick:1,wool:1,grain:1,ore:0};s.bank.wood--;s.bank.brick--;s.bank.wool--;s.bank.grain--;
s.res[sb].wood+=0;
const rd=C.roadSpots(s,sb)[0];s=A(s,sb,{t:'road',e:rd});assert.strictEqual(s.roads[rd],sb);
// compra carta sviluppo in sbp: nuova, ma giocabile nel proprio turno
s.res[sb]={wood:0,brick:0,wool:1,grain:1,ore:1};
s=A(s,sb,{t:'buydev'});
for(let i=0;i<4;i++){assert.strictEqual(s.phase,'sbp');s=A(s,s.cur,{t:'end'})}
assert.strictEqual(s.phase,'roll');assert.strictEqual(s.cur,(first+1)%5,'dopo la costruzione speciale tocca al giocatore successivo');
assert.strictEqual(s.newDev[sb].length,0,'la carta comprata in costruzione speciale è giocabile nel proprio turno');
// partite complete con un giocatore semplice
function partita(n){C.setRnd(R);let s=C.newGame(n,names(n)),k=0,sbp=0;const G=C.geo(s);
 while(!s.over&&k++<30000){const p=s.cur;let a;
  if(s.phase==='setup'){const S=s.setup;a=S.step==='v'?{t:'settle',v:C.settleSpots(s,p,true).sort((x,y)=>G.V[y].h.length-G.V[x].h.length)[0]}:{t:'road',e:C.roadSpots(s,p,S.v)[0]}}
  else if(s.phase==='roll')a={t:'roll'};
  else if(s.phase==='discard'){const q=Number(Object.keys(s.disc)[0]);const need=s.disc[q],res={},r={...s.res[q]};for(let i=0;i<need;i++){const kk=RES.slice().sort((x,y)=>r[y]-r[x])[0];r[kk]--;res[kk]=(res[kk]||0)+1}const r2=C.act(s,{seat:q,t:'discard',res});if(r2.err)throw new Error(r2.err);s=r2.s;continue}
  else if(s.phase==='robber')a={t:'robber',h:G.HX.findIndex((h,i)=>i!==s.robber&&h.v.some(v=>s.bld[v]&&s.bld[v].p!==p))>=0?G.HX.findIndex((h,i)=>i!==s.robber&&h.v.some(v=>s.bld[v]&&s.bld[v].p!==p)):(s.robber+1)%G.HX.length};
  else if(s.phase==='steal')a={t:'steal',p:s.vict[0]};
  else if(s.phase==='rb')a={t:'road',e:C.roadSpots(s,p)[0]};
  else{if(s.phase==='sbp')sbp++;const can=kk=>C.has(s,p,C.COST[kk]);const sp=C.settleSpots(s,p,false);
   if(can('city')&&C.citySpots(s,p).length&&C.count(s,p,2)<4)a={t:'city',v:C.citySpots(s,p)[0]};
   else if(can('settle')&&sp.length)a={t:'settle',v:sp.sort((x,y)=>G.V[y].h.length-G.V[x].h.length)[0]};
   else if(can('dev')&&s.deck.length)a={t:'buydev'};
   else if(can('road')&&C.roadsOf(s,p)<15&&C.roadSpots(s,p).length&&R()<.5)a={t:'road',e:C.roadSpots(s,p)[Math.floor(R()*C.roadSpots(s,p).length)]};
   else a={t:'end'}}
  let r=C.act(s,{seat:p,...a});if(r.err){if(s.phase==='main'||s.phase==='sbp')r=C.act(s,{seat:p,t:'end'});if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase)}
  s=r.s;if(k%50===0)inv(s)}
 inv(s);return{s,k,sbp}}
for(const n of [5,6,7,8]){let fin=0;for(let g=0;g<3;g++){const r=partita(n);assert(r.sbp>0,'la costruzione speciale deve verificarsi');if(r.s.over){fin++;assert(C.points(r.s,r.s.over.win,true)>=10)}}
 console.log('Catan '+n+' giocatori: '+fin+'/3 partite concluse, plancia '+C.geo(C.newGame(n,names(n))).HX.length+' esagoni')}
// fuori dai 5+ giocatori non c'è costruzione speciale
s=C.newGame(4,names(4));assert.strictEqual(s.prof,'a');assert.strictEqual(s.sbp,null);
console.log('ALL OK');
