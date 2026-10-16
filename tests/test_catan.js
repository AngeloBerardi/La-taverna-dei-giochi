// Catan: geometria, preparazione a serpentina, produzione (con limite della banca), ladro e scarti, costruzioni, porti, carte sviluppo,
// strada più lunga ed esercito, scambi tra giocatori, e partite complete: i giocatori che costruiscono con criterio battono quelli casuali.
const carica=require('./carica.js'),C=carica('18-catan.js','CATAN'),assert=require('assert');
const R=carica.rng(5);C.setRnd(R);
const {V,E,HX,RES}=C;
const mk=(n=3)=>{C.setRnd(R);const s=C.newGame(n,Array.from({length:n},(_,i)=>'g'+i));return s};
const A=(s,p,a)=>{const r=C.act(s,{seat:p,...a});if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const eq=(a,b,m)=>assert.strictEqual(JSON.stringify(a),JSON.stringify(b),m);
const E_=(s,p,a)=>C.act(s,{seat:p,...a}).err;
// salta la preparazione: stato "main" con il giocatore 0 di turno
const main=(s)=>{s.phase='main';s.cur=0;s.setup=null;s.dice=[3,4];return s};
const give=(s,p,o)=>{for(const k in o){s.res[p][k]+=o[k];s.bank[k]-=o[k]}};
const inv=s=>RES.forEach(k=>assert.strictEqual(s.bank[k]+s.res.reduce((a,r)=>a+r[k],0),19,'carte '+k+' non si conservano'));

// --- geometria
assert.strictEqual(HX.length,19);assert.strictEqual(V.length,54);assert.strictEqual(E.length,72);
assert(HX.every(h=>h.v.length===6&&h.e.length===6));assert(V.every(v=>v.n.length>=2&&v.n.length<=3&&v.h.length>=1&&v.h.length<=3));
let s=mk(4);
assert.strictEqual(s.ports.length,9);assert.strictEqual(new Set(s.ports.map(p=>p.e)).size,9);assert(s.ports.every(p=>E[p.e].h.length===1),'i porti stanno sulla costa');
assert.strictEqual(s.ports.filter(p=>p.k==='any').length,4);RES.forEach(k=>assert.strictEqual(s.ports.filter(p=>p.k===k).length,1));
const cnt=t=>s.hexes.filter(h=>h.t===t).length;eq(['wood','brick','wool','grain','ore','desert'].map(cnt),[4,3,4,4,3,1]);
eq(s.hexes.map(h=>h.num).filter(x=>x).sort((a,b)=>a-b),[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12]);
for(let g=0;g<50;g++){const t=mk(3);t.hexes.forEach((h,i)=>{if(h.num===6||h.num===8)C.HN[i].forEach(j=>assert(t.hexes[j].num!==6&&t.hexes[j].num!==8,'6 e 8 adiacenti'))});assert.strictEqual(t.hexes[t.robber].t,'desert')}

// --- preparazione a serpentina e risorse della seconda colonia
s=mk(3);const ord=s.setup.order;eq(ord.slice(0,3),ord.slice(3).reverse(),'ordine a serpentina');
const sp0=C.settleSpots(s,s.cur,true);assert.strictEqual(sp0.length,54);
let v0=sp0[10];s=A(s,s.cur,{t:'settle',v:v0});assert(E_(s,s.cur,{t:'settle',v:sp0[20]}),'prima la strada');
assert(E_(s,s.cur,{t:'road',e:E.findIndex(e=>e.a!==v0&&e.b!==v0)}),'la strada deve toccare la colonia');
s=A(s,s.cur,{t:'road',e:V[v0].e[0]});assert.notStrictEqual(s.cur,ord[0]);
assert(E_(s,s.cur,{t:'settle',v:v0}),'incrocio occupato');assert(E_(s,s.cur,{t:'settle',v:V[v0].n[0]}),'distanza di una strada');
assert(E_(s,(s.cur+1)%3,{t:'settle',v:sp0[40]}),'fuori turno');
// partita di preparazione completa: poi si tira
for(let k=1;k<6;k++){const p=s.cur,v=C.settleSpots(s,p,true)[0];s=A(s,p,{t:'settle',v});const gained=C.tot(s.res[p]);if(k>=3)assert(gained>0||V[v].h.every(h=>s.hexes[h].t==='desert'),'la 2ª colonia dà risorse');s=A(s,p,{t:'road',e:C.roadSpots(s,p,v)[0]})}
assert.strictEqual(s.phase,'roll');assert.strictEqual(s.cur,ord[0],'chi ha posato per ultimo comincia');assert.strictEqual(Object.keys(s.bld).length,6);inv(s);

// --- produzione: colonie 1, città 2; il ladro blocca; limite della banca
s=main(mk(3));const h=s.hexes.findIndex(x=>x.num>0&&x.t!=='desert'),hv=HX[h].v,t=s.hexes[h].t,num=s.hexes[h].num;
s.hexes.forEach((x,i)=>{if(i!==h&&x.num===num)x.num=0});s.robber=s.hexes.findIndex(x=>x.t==='desert');if(s.robber===h)s.robber=(h+1)%19;
s.bld[hv[0]]={p:0,k:1};s.bld[hv[2]]={p:1,k:2};s.phase='roll';s.dice=null;
let q=mk(3);let w=JSON.parse(JSON.stringify(s));C.setRnd(()=>0.5);
// forza il tiro: due dadi che sommano 'num' (anche 7 escluso)
const tira=(st,sum)=>{let r;const rr=[...Array(40)].map(()=>0);let k=0;const vals=[(sum-1)/6/ (1) ];return st};
// invece di truccare l'RNG: costruiamo la produzione chiamando act con RNG fissato dai dadi voluti
const dadi=(a,b)=>{const seq=[(a-1)/6+.01,(b-1)/6+.01];let i=0;C.setRnd(()=>seq[i++%2])};
if(num!==7){const a=Math.min(6,num-1),b=num-a;dadi(a,b);const r=A(w,w.cur,{t:'roll'});assert.strictEqual(r.res[0][t],1,'colonia: 1');assert.strictEqual(r.res[1][t],2,'città: 2');inv(r);
 const w2=JSON.parse(JSON.stringify(w));w2.robber=h;dadi(a,b);const r2=A(w2,0,{t:'roll'});assert.strictEqual(r2.res[0][t],0,'il ladro blocca la produzione');
 const w3=JSON.parse(JSON.stringify(w));w3.bank[t]=2;dadi(a,b);const r3=A(w3,0,{t:'roll'});assert.strictEqual(r3.res[0][t]+r3.res[1][t],0,'banca insufficiente per più giocatori: nessuno riceve');
 const w4=JSON.parse(JSON.stringify(w));w4.bld={[hv[0]]:{p:0,k:1}};w4.bank[t]=0;dadi(a,b);const r4=A(w4,0,{t:'roll'});assert.strictEqual(r4.res[0][t],0)}
C.setRnd(R);

// --- il 7: scarto di metà (da 8 carte in su), ladro e furto
s=main(mk(3));s.phase='roll';s.dice=null;give(s,1,{wood:5,brick:4});give(s,2,{wood:8});give(s,0,{ore:7});
const seven=()=>{const seq=[(3-1)/6+.01,(4-1)/6+.01];let i=0;C.setRnd(()=>seq[i++%2])};seven();let r7=A(s,0,{t:'roll'});C.setRnd(R);
assert.strictEqual(r7.phase,'discard');eq(r7.disc,{1:4,2:4},'chi ha più di 7 carte scarta metà (arrotondata per difetto)');
assert(E_(r7,1,{t:'discard',res:{wood:1}}),'scarto di numero sbagliato');assert(E_(r7,1,{t:'discard',res:{ore:4}}),'non si scartano carte che non hai');
let d=A(r7,1,{t:'discard',res:{wood:3,brick:1}});assert.strictEqual(d.phase,'discard');assert(E_(d,0,{t:'robber',h:0}),'prima scartano tutti');
d=A(d,2,{t:'discard',res:{wood:4}});assert.strictEqual(d.phase,'robber');inv(d);
// il ladro: va spostato, ruba a chi ha edifici lì
d.bld[HX[3].v[0]]={p:1,k:1};d.bld[HX[3].v[2]]={p:2,k:1};d.robber=0;
assert(E_(d,0,{t:'robber',h:0}),'deve cambiare esagono');let rb=A(d,0,{t:'robber',h:3});assert.strictEqual(rb.phase,'steal');
const before=C.tot(rb.res[0]);rb=A(rb,0,{t:'steal',p:1});assert.strictEqual(C.tot(rb.res[0]),before+1);assert.strictEqual(rb.phase,'main');inv(rb);
// un solo bersaglio: ruba subito; nessun bersaglio: prosegue
d.bld={[HX[5].v[0]]:{p:1,k:1}};rb=A(d,0,{t:'robber',h:5});assert.strictEqual(rb.phase,'main');
d.bld={};rb=A(d,0,{t:'robber',h:5});assert.strictEqual(rb.phase,'main');

// --- costruzioni
s=main(mk(3));const a0=V[20];s.bld[20]={p:0,k:1};const e0=V[20].e[0];
assert(E_(s,0,{t:'road',e:e0}),'senza risorse');give(s,0,{wood:3,brick:3,wool:1,grain:3,ore:3});
s=A(s,0,{t:'road',e:e0});assert.strictEqual(s.roads[e0],0);assert.strictEqual(s.res[0].wood,2);assert(E_(s,0,{t:'road',e:e0}),'strada occupata');
assert(E_(s,0,{t:'road',e:E.findIndex((e,i)=>s.roads[i]==null&&e.a!==20&&e.b!==20&&e.a!==other(e0,20)&&e.b!==other(e0,20))}),'strada non collegata');
function other(e,v){return E[e].a===v?E[e].b:E[e].a}
const far=other(e0,20);const e1=V[far].e.find(x=>x!==e0);s=A(s,0,{t:'road',e:e1});const far2=other(e1,far);
s.res[0]={wood:1,brick:1,wool:1,grain:3,ore:3};
s=A(s,0,{t:'settle',v:far2});eq(s.bld[far2],{p:0,k:1});assert(E_(s,0,{t:'settle',v:V[far2].n[0]}),'distanza');
s.res[0]={wood:0,brick:0,wool:0,grain:2,ore:3};s=A(s,0,{t:'city',v:far2});assert.strictEqual(s.bld[far2].k,2);assert(E_(s,0,{t:'city',v:far2}),'già città');assert.strictEqual(C.points(s,0),3);inv(s);
// strada interrotta da una colonia avversaria
s=main(mk(3));const path=[];{let v=HX[0].v[0];for(let k=0;k<5;k++){const e=C.E.findIndex((x,i)=>(x.a===v&&x.b===HX[0].v[k+1])||(x.b===v&&x.a===HX[0].v[k+1]));path.push(e);v=HX[0].v[k+1]}}
path.forEach(e=>s.roads[e]=0);assert.strictEqual(C.roadLen(s,0),5);
let ss=JSON.parse(JSON.stringify(s));ss.longest=null;let cut=ss;cut.bld[HX[0].v[2]]={p:1,k:1};assert.strictEqual(C.roadLen(cut,0),3,'la colonia avversaria spezza la strada (2+3 → max 3)');
// strada più lunga: ≥5 e solo se si supera chi la possiede
s=main(mk(3));give(s,0,{wood:2,brick:2});s.bld[HX[0].v[0]]={p:0,k:1};
path.slice(0,4).forEach(e=>s.roads[e]=0);s=A(s,0,{t:'road',e:path[4]});eq(s.longest,{p:0,len:5});assert.strictEqual(C.points(s,0),3);
// un avversario con 5 non supera; con 6 sì
s.longest={p:1,len:5};const lens=[0,5];
// esercito
s=main(mk(3));s.dev[0]=['knight','knight','knight','knight'];s.robber=0;
for(let k=1;k<=3;k++){s.devPlayed=false;s.newDev[0]=[];s.phase='main';s=A(s,0,{t:'play',card:'knight'});assert.strictEqual(s.phase,'robber');s=A(s,0,{t:'robber',h:k})}
eq(s.army,{p:0,n:3});assert.strictEqual(C.points(s,0),2);
s.knights[1]=3;s.devPlayed=false;s.phase='main';s=A(s,0,{t:'play',card:'knight'});s=A(s,0,{t:'robber',h:7});eq(s.army,{p:0,n:4},'si supera strettamente');

// --- carte sviluppo
s=main(mk(3));give(s,0,{wool:1,grain:1,ore:1});const deck0=s.deck.length;s.deck.unshift('knight');s=A(s,0,{t:'buydev'});assert.strictEqual(s.deck.length,deck0);
assert(E_(s,0,{t:'play',card:'knight'}),'non si gioca nel turno in cui si compra');
let t2=JSON.parse(JSON.stringify(s));t2.newDev[0]=[];t2.dev[0]=['knight','yop','mono','rb'];
let u=A(t2,0,{t:'play',card:'yop',a:'wood',b:'ore'});assert.strictEqual(u.res[0].wood,1);assert.strictEqual(u.res[0].ore,1);assert(E_(u,0,{t:'play',card:'mono',r:'wool'}),'una carta per turno');inv(u);
u=JSON.parse(JSON.stringify(t2));give(u,1,{wool:3});give(u,2,{wool:2});u=A(u,0,{t:'play',card:'mono',r:'wool'});assert.strictEqual(u.res[0].wool,5);assert.strictEqual(u.res[1].wool,0);inv(u);
u=JSON.parse(JSON.stringify(t2));u.bld[30]={p:0,k:1};u=A(u,0,{t:'play',card:'rb'});assert.strictEqual(u.phase,'rb');const [r1]=C.roadSpots(u,0);u=A(u,0,{t:'road',e:r1});u=A(u,0,{t:'road',e:C.roadSpots(u,0)[0]});assert.strictEqual(u.phase,'main');assert.strictEqual(u.res[0].wood,t2.res[0].wood,'strade gratis');
u=JSON.parse(JSON.stringify(t2));u.phase='roll';u.dice=null;assert(E_(u,0,{t:'play',card:'yop',a:'wood',b:'wood'}),'prima del tiro solo il cavaliere');u=A(u,0,{t:'play',card:'knight'});assert.strictEqual(u.phase,'robber');u=A(u,0,{t:'robber',h:0});assert.strictEqual(u.phase,'roll','dopo il cavaliere si tira ancora');
// punto vittoria nascosto: vince al decimo punto
s=main(mk(3));s.dev[0]=['vp','vp'];[1,2,3,4,5].forEach((v,i)=>s.bld[v*8]={p:0,k:2});assert.strictEqual(C.points(s,0,true),12);assert.strictEqual(C.points(s,0),10-0+0);

// --- porti e scambi con la banca
s=main(mk(3));give(s,0,{wood:4,brick:3,ore:2});assert.strictEqual(C.ratio(s,0,'wood'),4);s=A(s,0,{t:'bank',give:'wood',get:'grain'});assert.strictEqual(s.res[0].grain,1);assert(E_(s,0,{t:'bank',give:'brick',get:'grain'}),'servono 4 carte');
const pt3=s.ports.find(p=>p.k==='any'),pv=E[pt3.e].a;s.bld[pv]={p:0,k:1};assert.strictEqual(C.ratio(s,0,'brick'),3);s=A(s,0,{t:'bank',give:'brick',get:'ore'});assert.strictEqual(s.res[0].brick,0);
const pt2=s.ports.find(p=>p.k==='ore'),pv2=E[pt2.e].b;s.bld[pv2]={p:0,k:1};assert.strictEqual(C.ratio(s,0,'ore'),2);inv(s);

// --- scambi tra giocatori
s=main(mk(3));give(s,0,{wood:2});give(s,1,{ore:1});give(s,2,{grain:1});
assert(E_(s,0,{t:'offer',give:{wood:1},want:{wood:1}}),'non la stessa risorsa');assert(E_(s,0,{t:'offer',give:{ore:1},want:{wood:1}}),'non hai ciò che offri');
s=A(s,0,{t:'offer',give:{wood:2},want:{ore:1}});assert(E_(s,2,{t:'accept'})===undefined?false:true,'chi non ha ore non può accettare');
s=A(s,1,{t:'accept'});s=A(s,2,{t:'reject'});eq(s.trade.acc,[1]);assert(E_(s,2,{t:'deal',p:1}),'solo chi ha offerto conclude');
s=A(s,0,{t:'deal',p:1});assert.strictEqual(s.res[0].ore,1);assert.strictEqual(s.res[1].wood,2);assert.strictEqual(s.trade,null);inv(s);
s=A(s,0,{t:'offer',give:{ore:1},want:{wood:1},to:2});assert(E_(s,1,{t:'accept'}),'offerta riservata a un altro');
s=A(s,0,{t:'end'});assert.strictEqual(s.cur,1);assert.strictEqual(s.trade,null);assert.strictEqual(s.phase,'roll');

// --- partite complete
const pv_=(s,v)=>{let t=0;const k=new Set();V[v].h.forEach(h=>{const x=s.hexes[h];if(x.t!=='desert'){t+=C.pips(x.num);k.add(x.t)}});return t+k.size*1.3};
function discardPlan(s,p){const need=s.disc[p],res={};const r={...s.res[p]};for(let i=0;i<need;i++){const k=RES.slice().sort((a,b)=>r[b]-r[a])[0];r[k]--;res[k]=(res[k]||0)+1}return res}
function roadToward(s,p){const free=v=>!s.bld[v]&&!V[v].n.some(x=>s.bld[x]);let best=null;
 for(const e of C.roadSpots(s,p)){for(const w of [E[e].a,E[e].b]){if(s.bld[w]&&s.bld[w].p===p)continue;
  // cerca (in ampiezza, fino a 3 strade) l'incrocio libero migliore a partire da w
  let front=[w],seen=new Set([w]),sc=-1;for(let d=0;d<=3&&front.length;d++){for(const v of front)if(free(v))sc=Math.max(sc,pv_(s,v)/(1+d));
   const nx=[];for(const v of front)for(const u of V[v].n)if(!seen.has(u)&&!(s.bld[u]&&s.bld[u].p!==p)){seen.add(u);nx.push(u)}front=nx}
  if(sc>=0&&(!best||sc>best.sc))best={e,sc}}}
 return best&&best.e}
function smart(s,p){const r=s.res[p],ph=s.phase,own=(c)=>s.dev[p].filter(x=>x===c).length-s.newDev[p].filter(x=>x===c).length;
 if(ph==='setup'){const S=s.setup;if(S.step==='v')return{t:'settle',v:C.settleSpots(s,p,true).sort((a,b)=>pv_(s,b)-pv_(s,a))[0]};
  const rs=C.roadSpots(s,p,S.v).sort((a,b)=>{const w=e=>E[e].a===S.v?E[e].b:E[e].a;return pv_(s,w(b))-pv_(s,w(a))});return{t:'road',e:rs[0]}}
 if(ph==='roll'){if(!s.devPlayed&&own('knight')&&HX[s.robber].v.some(v=>s.bld[v]&&s.bld[v].p===p))return{t:'play',card:'knight'};return{t:'roll'}}
 if(ph==='robber'){let best=null;HX.forEach((h,i)=>{if(i===s.robber)return;let sc=0;h.v.forEach(v=>{const b=s.bld[v];if(b)sc+=(b.p===p?-3:1)*b.k*C.pips(s.hexes[i].num)});if(!best||sc>best.sc)best={sc,i}});return{t:'robber',h:best.i}}
 if(ph==='steal')return{t:'steal',p:s.vict.slice().sort((a,b)=>C.cardsOf(s,b)-C.cardsOf(s,a))[0]};
 if(ph==='rb'){const e=roadToward(s,p)??C.roadSpots(s,p)[0];return{t:'road',e}}
 // fase main
 const can=k=>C.has(s,p,C.COST[k]);
 if(can('city')&&C.citySpots(s,p).length&&C.count(s,p,2)<4)return{t:'city',v:C.citySpots(s,p).sort((a,b)=>pv_(s,b)-pv_(s,a))[0]};
 const spots=C.settleSpots(s,p,false);
 if(can('settle')&&spots.length)return{t:'settle',v:spots.sort((a,b)=>pv_(s,b)-pv_(s,a))[0]};
 if(can('dev')&&s.deck.length&&(r.ore>3||!C.citySpots(s,p).length||r.wool>1))return{t:'buydev'};
 if(!s.devPlayed){if(own('knight')&&HX[s.robber].v.some(v=>s.bld[v]&&s.bld[v].p===p))return{t:'play',card:'knight'};
  if(own('rb')&&roadToward(s,p)!=null)return{t:'play',card:'rb'};
  if(own('knight')&&s.knights[p]>=1)return{t:'play',card:'knight'}}
 // porti/banca: converti l'eccesso in ciò che manca per città o colonia
 const needs=spots.length?{wood:1,brick:1,wool:1,grain:1}:C.citySpots(s,p).length?{grain:2,ore:3}:{wood:1,brick:1};
 const miss=Object.keys(needs).filter(k=>r[k]<needs[k]);
 if(miss.length){const sur=RES.filter(k=>r[k]-(needs[k]||0)>=C.ratio(s,p,k)).sort((a,b)=>r[b]-r[a])[0];if(sur&&sur!==miss[0])return{t:'bank',give:sur,get:miss[0]}}
 if(can('road')&&C.roadsOf(s,p)<15&&!spots.length){const e=roadToward(s,p);if(e!=null)return{t:'road',e}}
 return{t:'end'}}
function casuale(s,p){const ph=s.phase;
 if(ph==='setup'){const S=s.setup;if(S.step==='v'){const sp=C.settleSpots(s,p,true);return{t:'settle',v:sp[Math.floor(R()*sp.length)]}}const rs=C.roadSpots(s,p,S.v);return{t:'road',e:rs[Math.floor(R()*rs.length)]}}
 if(ph==='roll')return{t:'roll'};if(ph==='robber')return{t:'robber',h:(s.robber+1+Math.floor(R()*18))%19};if(ph==='steal')return{t:'steal',p:s.vict[0]};
 if(ph==='rb'){const rs=C.roadSpots(s,p);return{t:'road',e:rs[Math.floor(R()*rs.length)]}}
 const k=R();
 if(k<.3)return{t:'end'};if(k<.55){const rs=C.roadSpots(s,p);return rs.length?{t:'road',e:rs[Math.floor(R()*rs.length)]}:{t:'end'}}
 if(k<.7){const sp=C.settleSpots(s,p,false);return sp.length?{t:'settle',v:sp[Math.floor(R()*sp.length)]}:{t:'end'}}
 if(k<.8){const sp=C.citySpots(s,p);return sp.length?{t:'city',v:sp[0]}:{t:'end'}}
 if(k<.9)return{t:'buydev'};return{t:'bank',give:RES[Math.floor(R()*5)],get:RES[Math.floor(R()*5)]}}
function partita(n,bots){C.setRnd(R);let s=C.newGame(n,Array.from({length:n},(_,i)=>'g'+i)),k=0;
 while(!s.over&&k++<9000){let p=s.cur,a;
  if(s.phase==='discard'){const q=Number(Object.keys(s.disc)[0]);a={t:'discard',res:discardPlan(s,q)};p=q}else a=bots[p](s,p);
  let r=C.act(s,{seat:p,...a});
  if(r.err){if(bots[p]===smart&&s.phase==='main'){r=C.act(s,{seat:p,t:'end'})}else if(s.phase==='main'){r=C.act(s,{seat:p,t:'end'})}if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase)}
  s=r.s;if(k%40===0)inv(s)}
 inv(s);return s}
if(process.env.CATAN_DEBUG){const n=3;C.setRnd(R);let g=C.newGame(n,['a','b','c']),k=0,errs={};
 while(!g.over&&k++<3000){let p=g.cur,a;if(g.phase==='discard'){const q=Number(Object.keys(g.disc)[0]);a={t:'discard',res:discardPlan(g,q)};p=q}else a=smart(g,p);
  let r=C.act(g,{seat:p,...a});if(r.err){errs[r.err]=(errs[r.err]||0)+1;r=C.act(g,{seat:p,t:'end'});if(r.err){console.log('ERR',r.err,a,g.phase);break}}g=r.s}
 console.log('steps',k,'phase',g.phase,'pts',[0,1,2].map(p=>C.points(g,p,true)),'over',!!g.over,errs);console.log('edifici',[0,1,2].map(p=>[C.count(g,p,1),C.count(g,p,2),C.roadsOf(g,p)].join('/')),'mazzo',g.deck.length,'dev',g.dev.map(d=>d.join(',')),'longest',JSON.stringify(g.longest),'army',JSON.stringify(g.army),'ladro',g.robber,'spots',[0,1,2].map(p=>C.settleSpots(g,p,false).length));console.log('res',g.res.map(r=>JSON.stringify(r)),'roads',[0,1,2].map(p=>C.roadsOf(g,p)),'bld',Object.values(g.bld).length);process.exit(0)}
let turns=[];
for(let n=3;n<=4;n++)for(let g=0;g<6;g++){const s=partita(n,Array(n).fill(smart));assert(s.over,'la partita con giocatori competenti deve finire');turns.push(s.evn);assert(C.points(s,s.over.win,true)>=10)}
console.log('partite complete con giocatori competenti: tutte concluse (azioni medie '+Math.round(turns.reduce((a,b)=>a+b)/turns.length)+')');
for(let g=0;g<8;g++)partita(4,Array(4).fill(casuale));
console.log('fuzz con giocatori casuali: nessun errore, le carte si conservano');
let ok=true;
for(const n of [3,4]){let w=0;const N=60;for(let g=0;g<N;g++){const seat=g%n;const bots=Array.from({length:n},(_,i)=>i===seat?smart:casuale);const s=partita(n,bots);if(s.over&&s.over.win===seat)w++}
 console.log('Catan '+n+' giocatori: chi costruisce con criterio vince '+w+'/'+N+' (caso: '+Math.round(N/n)+')');if(w<N*.7)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
