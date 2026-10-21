// Bot di Catan riusabile dai test: gioca con criterio su qualunque plancia (anche con mare, navi, oro).
// Uso: const {smart,casuale,discardPlan,goldPlan,gioca}=require('./bot_catan.js')(C);
module.exports=function(C){
const RES=C.RES;
const pv=(s,v,G)=>{let t=0;const k=new Set();G.V[v].h.forEach(h=>{const x=s.hexes[h];if(x.t==='sea'||x.t==='desert'||x.fog)return;t+=x.t==='gold'?3.5:C.pips(x.num);k.add(x.t==='gold'?'g':x.t)});return t+k.size*1.3};
const freeV=(s,v,G)=>!s.bld[v]&&!G.V[v].n.some(x=>s.bld[x])&&G.V[v].h.some(i=>C.landH(s,i));
function discardPlan(s,p){const need=s.disc[p],res={},r={...s.res[p]},K=C.KEYS(s);for(let i=0;i<need;i++){const k=K.slice().sort((a,b)=>r[b]-r[a])[0];r[k]--;res[k]=(res[k]||0)+1}return res}
function goldPlan(s,p){const need=s.gold[p],res={},have={...s.res[p]};const want=['ore','grain','wool','brick','wood'];
 for(let i=0;i<need;i++){const k=want.filter(x=>s.bank[x]-(res[x]||0)>0).sort((a,b)=>(have[a]+(res[a]||0))-(have[b]+(res[b]||0)))[0];res[k]=(res[k]||0)+1}return res}
// strada verso il miglior incrocio libero entro 3 passi
function roadToward(s,p,G){let best=null;
 for(const e of C.roadSpots(s,p)){for(const w of [G.E[e].a,G.E[e].b]){if(s.bld[w]&&s.bld[w].p===p)continue;
  let front=[w],seen=new Set([w]),sc=-1;for(let d=0;d<=3&&front.length;d++){for(const v of front)if(freeV(s,v,G))sc=Math.max(sc,pv(s,v,G)/(1+d));
   const nx=[];for(const v of front)for(const u of G.V[v].n)if(!seen.has(u)&&!(s.bld[u]&&s.bld[u].p!==p)){seen.add(u);nx.push(u)}front=nx}
  if(sc>=0&&(!best||sc>best.sc))best={e,sc}}}
 return best&&best.e}
// nave: ricerca in ampiezza sul mare dalla propria rete fino agli incroci liberi di terra; restituisce il primo tratto da costruire
function shipToward(s,p,G,maxd){maxd=maxd||4;const{V,E}=G;
 const edgeOk=e=>s.roads[e]==null&&s.ships[e]==null&&E[e].h.some(i=>C.seaH(s,i))&&!(s.pirate!=null&&G.HX[s.pirate].e.includes(e));
 const dist=new Map(),par=new Map(),q=[];const add=v=>{if(!dist.has(v)){dist.set(v,0);q.push(v)}};
 for(const v in s.bld)if(s.bld[v].p===p)add(+v);for(const e in s.ships)if(s.ships[e]===p){add(E[e].a);add(E[e].b)}
 while(q.length){const v=q.shift();if(dist.get(v)>=maxd)continue;if(s.bld[v]&&s.bld[v].p!==p)continue;
  for(const e of V[v].e){if(!edgeOk(e))continue;const w=E[e].a===v?E[e].b:E[e].a;if(dist.has(w))continue;dist.set(w,dist.get(v)+1);par.set(w,{v,e});q.push(w)}}
 let best=null;for(const[v,d]of dist){if(d===0||!freeV(s,v,G))continue;const sc=pv(s,v,G)-1.4*d;if(!best||sc>best.sc)best={v,sc}}
 if(!best)return null;let v=best.v,e=null;while(par.has(v)){const x=par.get(v);e=x.e;v=x.v}
 return e!=null&&!C.canShip(s,p,e)?e:null}
function smart(s,p){const G=C.geo(s),r=s.res[p],ph=s.phase,own=c=>s.dev[p].filter(x=>x===c).length-s.newDev[p].filter(x=>x===c).length;
 if(ph==='setup'){const S=s.setup;if(S.step==='v')return{t:'settle',v:C.settleSpots(s,p,true).sort((a,b)=>pv(s,b,G)-pv(s,a,G))[0]};
  const rs=C.roadSpots(s,p,S.v).sort((a,b)=>{const w=e=>G.E[e].a===S.v?G.E[e].b:G.E[e].a;return pv(s,w(b),G)-pv(s,w(a),G)});
  if(rs.length)return{t:'road',e:rs[0]};return{t:'ship',e:C.shipSpots(s,p,{from:S.v})[0]}}
 if(ph==='gold')return{t:'gold',res:goldPlan(s,p)};
 if(ph==='roll'){if(!s.devPlayed&&own('knight')&&G.HX[s.robber].v.some(v=>s.bld[v]&&s.bld[v].p===p))return{t:'play',card:'knight'};return{t:'roll'}}
 if(ph==='robber'){let best=null;G.HX.forEach((h,i)=>{if(i===s.robber||!C.landH(s,i))return;let sc=0;h.v.forEach(v=>{const b=s.bld[v];if(b)sc+=(b.p===p?-3:1)*b.k*C.pips(s.hexes[i].num)});if(!best||sc>best.sc)best={sc,i}});return{t:'robber',h:best.i}}
 if(ph==='steal')return{t:'steal',p:s.vict.slice().sort((a,b)=>C.cardsOf(s,b)-C.cardsOf(s,a))[0]};
 if(ph==='rb'){const e=roadToward(s,p,G);if(e!=null)return{t:'road',e};const sh=shipToward(s,p,G);if(sh!=null)return{t:'ship',e:sh};const rs=C.roadSpots(s,p);return rs.length?{t:'road',e:rs[0]}:{t:'ship',e:C.shipSpots(s,p)[0]}}
 const can=k=>C.has(s,p,C.COST[k]);
 if(can('city')&&C.citySpots(s,p).length&&C.count(s,p,2)<4)return{t:'city',v:C.citySpots(s,p).sort((a,b)=>pv(s,b,G)-pv(s,a,G))[0]};
 const spots=C.settleSpots(s,p,false);
 if(can('settle')&&spots.length)return{t:'settle',v:spots.sort((a,b)=>pv(s,b,G)-pv(s,a,G))[0]};
 if(ph==='sbp'){if(can('road')&&!spots.length){const e=roadToward(s,p,G);if(e!=null)return{t:'road',e}}return{t:'end'}}
 if(can('dev')&&s.deck.length&&(r.ore>3||!C.citySpots(s,p).length||r.wool>1))return{t:'buydev'};
 if(!s.devPlayed){if(own('knight')&&G.HX[s.robber].v.some(v=>s.bld[v]&&s.bld[v].p===p))return{t:'play',card:'knight'};
  if(own('rb')&&(roadToward(s,p,G)!=null||shipToward(s,p,G)!=null))return{t:'play',card:'rb'};if(own('knight')&&s.knights[p]>=1)return{t:'play',card:'knight'}}
 const needs=spots.length?{wood:1,brick:1,wool:1,grain:1}:C.citySpots(s,p).length?{grain:2,ore:3}:s.xt.includes('mar')?{wood:1,wool:1,brick:1}:{wood:1,brick:1};
 const miss=Object.keys(needs).filter(k=>r[k]<needs[k]);
 if(miss.length){const sur=RES.filter(k=>r[k]-(needs[k]||0)>=C.ratio(s,p,k)).sort((a,b)=>r[b]-r[a])[0];if(sur&&sur!==miss[0]&&s.bank[miss[0]]>0)return{t:'bank',give:sur,get:miss[0]}}
 if(!spots.length){
  if(can('ship')&&C.shipsOf(s,p)<15&&s.xt.includes('mar')){const sh=shipToward(s,p,G);if(sh!=null)return{t:'ship',e:sh}}
  if(can('road')&&C.roadsOf(s,p)<15){const e=roadToward(s,p,G);if(e!=null)return{t:'road',e}}}
 return{t:'end'}}
// scelta a caso tra le mosse legali dell'elenco C.moves (senza «fine turno» troppo spesso)
function casuale(s,p,R){const m=C.moves(s,p);if(!m.length)return{t:'end'};const nonEnd=m.filter(x=>x.t!=='end');return nonEnd.length&&R()<.85?nonEnd[Math.floor(R()*nonEnd.length)]:m[Math.floor(R()*m.length)]}
// una partita intera: bots[p](s,p) decide; scarti e oro si risolvono per tutti. Esce con lo stato finale.
function gioca(s,bots,inv,maxSteps){let k=0;maxSteps=maxSteps||9000;
 while(!s.over&&k++<maxSteps){let p=s.cur,a;
  if(s.phase==='discard'){const q=Number(Object.keys(s.disc)[0]);a={t:'discard',res:discardPlan(s,q)};p=q}
  else if(s.phase==='gold'){const q=Number(Object.keys(s.gold)[0]);a={t:'gold',res:goldPlan(s,q)};p=q}
  else a=bots[p](s,p);
  let r=C.act(s,{seat:p,...a});
  if(r.err){if(s.phase==='main'||s.phase==='sbp')r=C.act(s,{seat:p,t:'end'});if(r.err)throw new Error(r.err+' '+JSON.stringify(a)+' fase '+s.phase)}
  s=r.s;if(inv&&k%40===0)inv(s)}
 return s}
return{smart,casuale,discardPlan,goldPlan,roadToward,shipToward,gioca,pv}};
