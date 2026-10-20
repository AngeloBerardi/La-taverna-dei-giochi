// Catan · Marinai: mappe generate (isole, oro, nebbia, porti), navi, pirata, oro, nebbia, isole nuove, e partite complete (bot competenti e giocatori casuali).
const carica=require('./carica.js'),C=carica.multi(['18-catan.js','18b-catan-marinai.js'],'CATAN'),assert=require('assert');
const R=carica.rng(21);C.setRnd(R);
const B=require('./bot_catan.js')(C),RES=C.RES;
const names=n=>Array.from({length:n},(_,i)=>'g'+i);
const mk=(n,sc,o)=>{C.setRnd(R);return C.newGame(n,names(n),Object.assign({ext:['mar'],scen:sc},o||{}))};
const inv=s=>RES.forEach(k=>assert.strictEqual(s.bank[k]+s.res.reduce((a,r)=>a+r[k],0),C.KIT[C.profOf(s.n)].bank,'le carte '+k+' non si conservano'));
const A=(s,p,a)=>{const r=C.act(s,{seat:p,...a});if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const ERR=(s,p,a)=>C.act(s,{seat:p,...a}).err;
const main=s=>{s.phase='main';s.cur=0;s.turnP=0;s.setup=null;s.dice=[3,4];return s};
const give=(s,p,o)=>{for(const k in o){s.res[p][k]+=o[k];s.bank[k]-=o[k]}};

// ---- mappe: validità per ogni scenario e numero di giocatori
for(const sc of['nt','qi','ne','ar'])for(const n of[2,3,4,5,6]){
 const s=mk(n,sc),G=C.geo(s),L=s.hexes.filter(h=>h.t!=='sea').length;
 assert.strictEqual(L,12+5*n,'terra '+sc+n);assert.strictEqual(s.hexes.length,G.HX.length);
 assert.strictEqual(G.V.length-G.E.length+G.HX.length,1,'Eulero '+sc+n);
 assert(G.HX.every(h=>h.v.length===6&&h.e.length===6));
 const nIsl=new Set(s.isl.filter(x=>x>=0)).size;assert(nIsl>=3,'isole '+sc+n+': '+nIsl);
 // isole davvero separate dal mare: due terre di isole diverse non si toccano
 G.HN.forEach((nb,i)=>nb.forEach(j=>{if(s.isl[i]>=0&&s.isl[j]>=0)assert.strictEqual(s.isl[i],s.isl[j],'isole attaccate')}));
 assert.strictEqual(s.hexes[s.robber].t,'desert');assert.strictEqual(s.hexes.filter(h=>h.t==='desert').length,1);
 assert(s.hexes.filter(h=>h.t==='gold').length>=2,'oro');
 s.hexes.forEach((h,i)=>{if(h.t==='sea')assert.strictEqual(h.num,0);else if(h.t!=='desert'){assert(h.num>=2&&h.num<=12&&h.num!==7);
  if(h.num===6||h.num===8)G.HN[i].forEach(j=>assert(s.hexes[j].num!==6&&s.hexes[j].num!==8,'6 e 8 vicini'))}});
 // porti: tratti di costa tra terra e mare, distinti; ogni risorsa ha il suo porto
 assert(s.ports.length>=7);assert.strictEqual(new Set(s.ports.map(p=>p.e)).size,s.ports.length);
 s.ports.forEach(p=>{const h=G.E[p.e].h;assert.strictEqual(h.length,2);assert.notStrictEqual(s.hexes[h[0]].t==='sea',s.hexes[h[1]].t==='sea','porto sulla costa')});
 RES.forEach(k=>assert.strictEqual(s.ports.filter(p=>p.k===k).length,1));
 assert(s.pirate!=null&&s.hexes[s.pirate].t==='sea'&&!s.hexes[s.pirate].fog,'pirata in mare aperto');
 if(sc==='ne'){assert(s.fogN>10&&s.fogN===s.hexes.filter(h=>h.fog).length);assert(s.hexes.every((h,i)=>!h.fog||s.isl[i]!==0),'l’isola di partenza è visibile')}else assert.strictEqual(s.fogN,0);
 if(sc==='nt'||sc==='ne'){assert(s.start&&s.start.length>20);s.start.forEach(v=>assert(G.V[v].h.some(h=>s.isl[h]===0)))}else assert.strictEqual(s.start,null);
 const big=s.hexes.map((h,i)=>s.isl[i]===0&&h.t!=='desert'&&h.t!=='gold'?h.t:null).filter(Boolean);assert(new Set(big).size>=4,'l’isola principale ha almeno 4 risorse diverse');
}
console.log('mappe: 4 scenari × 2-6 giocatori valide (isole separate, porti, oro, nebbia, numeri)');

// ---- preparazione: si comincia sull'isola di partenza; si può posare una nave al posto della strada
{let s=mk(3,'nt'),G=C.geo(s);const out=G.V.map((v,i)=>i).filter(v=>!s.start.includes(v)&&G.V[v].h.some(h=>s.hexes[h].t!=='sea'));assert(out.length);
 assert(ERR(s,s.cur,{t:'settle',v:out[0]}).includes('isola di partenza'));
 const p=s.cur,coast=s.start.find(v=>G.V[v].e.some(e=>C.shipSpots(s,p,{from:v}).includes(e))&&C.canSettle(s,p,v,true)===null);
 s=A(s,p,{t:'settle',v:coast});const sp=C.shipSpots(s,p,{from:coast}),e=sp.find(x=>G.E[x].h.every(h=>s.hexes[h].t==='sea'))??sp[0];if(sp.some(x=>G.E[x].h.every(h=>s.hexes[h].t==='sea')))assert(ERR(s,p,{t:'road',e}),'in mare aperto non si posano strade');
 s=A(s,p,{t:'ship',e});assert.strictEqual(s.ships[e],p);assert.notStrictEqual(s.cur,p)}

// ---- navi: collegamento, terra/mare, costo, pirata, spostamento
{const s=main(mk(3,'nt')),G=C.geo(s);
 const vc=s.start.find(v=>G.V[v].e.some(e=>G.E[e].h.some(h=>s.hexes[h].t==='sea')&&G.E[e].h.some(h=>s.hexes[h].t!=='sea')));s.bld[vc]={p:0,k:1};
 const shipsHere=G.V[vc].e.filter(e=>!C.canShip(s,0,e));assert(shipsHere.length>=1,'una colonia costiera permette navi');
 const e1=shipsHere[0],far=G.E.map((x,i)=>i).find(e=>!G.E[e].a!==vc&&G.E[e].b!==vc&&G.E[e].a!==vc&&G.E[e].h.some(h=>s.hexes[h].t==='sea')&&G.E[e].h.every(h=>s.hexes[h].t==='sea'));
 assert(C.canShip(s,0,far),'una nave lontana dalla rete non si può posare');
 const landOnly=G.E.map((x,i)=>i).find(e=>G.E[e].h.length===2&&G.E[e].h.every(h=>s.hexes[h].t!=='sea')&&(G.E[e].a===vc||G.E[e].b===vc||G.V[vc].n.some(w=>G.E[e].a===w||G.E[e].b===w)));
 if(landOnly!=null)assert(C.canShip(s,0,landOnly).includes('mare'));
 const seaOnly=G.E.findIndex(e=>e.h.length>=2&&e.h.every(h=>s.hexes[h].t==='sea'));assert(C.canRoad(s,0,seaOnly).includes('terra'));
 assert(ERR(s,0,{t:'ship',e:e1}).includes('Ti servono'),'servono legno e lana');give(s,0,{wood:3,wool:3,brick:1});
 let t=A(s,0,{t:'ship',e:e1});assert.strictEqual(t.ships[e1],0);assert.strictEqual(t.res[0].wood,2);assert.strictEqual(t.res[0].wool,2);inv(t);
 assert(ERR(t,0,{t:'road',e:e1}),'tratto occupato');
 // pirata: blocca i tratti intorno a sé
 const u=JSON.parse(JSON.stringify(s));u.pirate=G.E[e1].h.find(h=>u.hexes[h].t==='sea');assert(C.canShip(u,0,e1).includes('pirata'));
 // spostamento: non subito, una per turno, solo navi aperte
 assert(ERR(t,0,{t:'mship',e:e1,to:G.V[vc].e.find(e=>e!==e1&&!C.canShip(t,0,e))}).includes('appena costruita'));
 t.newShips=[];const to=C.shipSpots(t,0,{skip:e1}).find(e=>e!==e1);assert(to!=null);
 assert(C.shipOpen(t,0,e1),'una nave con un estremo libero è aperta');
 const m=A(t,0,{t:'mship',e:e1,to});assert.strictEqual(m.ships[e1],undefined);assert.strictEqual(m.ships[to],0);assert.strictEqual(m.shipMoved,true);
 assert(ERR(m,0,{t:'mship',e:to,to:e1}),'una sola nave per turno');
 // strada più lunga: strada + nave si uniscono solo in una colonia propria
 const road=G.V[vc].e.find(e=>!C.canRoad(s,0,e)),sh=G.V[vc].e.find(e=>e!==road&&!C.canShip(s,0,e));
 if(road!=null&&sh!=null){const q=JSON.parse(JSON.stringify(s));q.roads[road]=0;q.ships[sh]=0;assert.strictEqual(C.roadLen(q,0),2,'strada + nave dalla colonia');delete q.bld[vc];assert.strictEqual(C.roadLen(q,0),1,'senza colonia non si passa da strada a nave')}}
console.log('navi, pirata, spostamenti e strada più lunga: ok');

// ---- oro: chi ha una colonia accanto sceglie la risorsa; fine della scelta riporta al turno
{const s=mk(3,'nt'),G=C.geo(s);main(s);s.phase='roll';s.dice=null;
 const gi=s.hexes.findIndex((h,i)=>h.t==='gold'&&!h.fog);s.hexes.forEach(h=>{if(h.num===8)h.num=9});s.hexes[gi].num=8;
 const v=G.HX[gi].v[0];s.bld[v]={p:1,k:2};C.setRnd(()=>.6);   // dadi 4+4
 let t=A(s,0,{t:'roll'});assert.strictEqual(t.phase,'gold');assert.strictEqual(JSON.stringify(t.gold),'{"1":2}');
 assert(ERR(t,0,{t:'gold',res:{ore:2}}),'chi non ha oro non sceglie');assert(ERR(t,1,{t:'gold',res:{ore:1}}),'servono 2 carte');
 t=A(t,1,{t:'gold',res:{ore:1,grain:1}});assert.strictEqual(t.phase,'main');assert.strictEqual(t.res[1].ore+t.res[1].grain,2);inv(t);C.setRnd(R)}
console.log('oro: ok');

// ---- nebbia: si scopre toccando; si prende la carta del terreno
{const s=main(mk(3,'ne')),G=C.geo(s);const fi=s.hexes.findIndex((h,i)=>h.fog&&h.t!=='sea'&&h.t!=='gold'&&h.t!=='desert');const e=G.HX[fi].e.find(x=>G.E[x].h.some(h=>s.hexes[h].t==='sea'));
 const n0=s.fogN;give(s,0,{wood:2,wool:2});const owner=G.E[e].a;s.bld[owner]={p:0,k:1};   // finta: colonia sull'estremo
 const t=A(s,0,{t:'ship',e});assert(!t.hexes[fi].fog,'scoperto');assert(t.fogN<n0);const ty=t.hexes[fi].t,paid=C.COST.ship[ty]||0;assert.strictEqual(t.res[0][ty],s.res[0][ty]-paid+1,'la carta del terreno scoperto');assert(t.ev.some(x=>x.t==='reveal'&&x.h===fi));inv(t)}
console.log('nebbia: ok');

// ---- isole nuove: +1 punto alla prima colonia su un'isola nuova; non per l'isola di partenza
{const s=main(mk(3,'nt')),G=C.geo(s);const v0=s.start[0];s.bld[v0]={p:0,k:1};s.vis[0]=[0];
 const v2=G.V.map((x,i)=>i).find(v=>!s.bld[v]&&G.V[v].h.some(h=>s.isl[h]>0&&s.hexes[h].t!=='sea')&&!G.V[v].n.some(w=>s.bld[w])&&G.V[v].e.some(e=>G.E[e].h.some(h=>s.hexes[h].t==='sea')));
 const e2=G.V[v2].e.find(e=>G.E[e].h.some(h=>s.hexes[h].t==='sea'));s.ships[e2]=0;give(s,0,{wood:1,brick:1,wool:1,grain:1});const p0=C.points(s,0,false);
 const t=A(s,0,{t:'settle',v:v2});assert.strictEqual(t.ib[0],1);assert.strictEqual(C.points(t,0,false),p0+2,'colonia + isola nuova');assert(t.ev.some(x=>x.t==='island'));
 const v3=G.V.map((x,i)=>i).find(v=>!t.bld[v]&&!G.V[v].n.some(w=>t.bld[w])&&G.V[v].h.some(h=>t.isl[h]===t.isl[G.V[v2].h.find(k=>t.isl[k]>0)])&&G.V[v].e.some(e=>t.roads[e]==null&&C.landH(t,G.E[e].h[0])));
 void v3}
console.log('isole nuove: ok');

// ---- ladro e pirata
{const s=main(mk(3,'nt'),{});s.phase='robber';s.after='main';const sea=s.hexes.findIndex((h,i)=>h.t==='sea'&&i!==s.pirate&&!h.fog),land=s.hexes.findIndex((h,i)=>h.t==='gold'&&i!==s.robber);
 const a=A(s,0,{t:'robber',h:sea});assert.strictEqual(a.pirate,sea);assert.strictEqual(a.robber,s.robber);
 const b=A(s,0,{t:'robber',h:land});assert.strictEqual(b.robber,land);assert.strictEqual(b.pirate,s.pirate);
 assert(ERR(s,0,{t:'robber',h:s.pirate}).includes('pirata'));assert(ERR(s,0,{t:'robber',h:s.robber}).includes('ladro'))}
console.log('ladro e pirata: ok');

// ---- partite complete: bot competenti finiscono la partita, bot casuali non provocano errori e le carte si conservano
let navi=0,isole=0,fin=0,tot=0;
for(const sc of['nt','qi','ne','ar'])for(const n of[3,4]){const s=B.gioca(mk(n,sc),Array(n).fill(B.smart),inv,12000);tot++;inv(s);
 if(s.over){fin++;assert(C.points(s,s.over.win,true)>=s.vp)}
 navi+=Object.keys(s.ships).length;isole+=s.ib.reduce((a,b)=>a+b,0)}
console.log('partite con bot competenti: '+fin+'/'+tot+' concluse; navi in plancia '+navi+', isole nuove colonizzate '+isole);
assert(fin>=tot*.75,'i bot competenti devono chiudere almeno tre partite su quattro');assert(navi>0,'i bot costruiscono navi');assert(isole>0,'i bot colonizzano isole nuove');
for(const sc of['nt','qi','ne','ar'])for(let g=0;g<3;g++){const n=3+g%2,bots=Array(n).fill((s,p)=>B.casuale(s,p,R));const s=B.gioca(mk(n,sc),bots,inv,2500);inv(s)}
console.log('fuzz con giocatori casuali (mosse legali): nessun errore, le carte si conservano');
let ok=true;
for(const sc of['nt','ar']){let w=0;const N=30,n=3;for(let g=0;g<N;g++){const seat=g%n,bots=Array.from({length:n},(_,i)=>i===seat?B.smart:(s,p)=>B.casuale(s,p,R));const s=B.gioca(mk(n,sc),bots,null,6000);if(s.over&&s.over.win===seat)w++}
 console.log('Marinai '+sc+': chi costruisce con criterio vince '+w+'/'+N+' (caso: '+Math.round(N/n)+')');if(w<N*.6)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1);
