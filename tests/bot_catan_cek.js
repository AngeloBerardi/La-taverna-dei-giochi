// Bot di Catan · Città e Cavalieri: gioca con il bot base per costruire e commerciare, aggiungendo difesa dai barbari, migliorie e carte progresso.
module.exports=function(C){
const B=require('./bot_catan.js')(C),E=()=>C.EXTS.cek;
const mine=(s,p)=>Object.keys(s.kn).filter(v=>s.kn[v].p===p).map(Number);
const army=s=>{let ct=0,d=0;for(const v in s.bld)if(s.bld[v].k===2)ct++;for(const v in s.kn)if(s.kn[v].a)d+=s.kn[v].l;return{ct,d}};
function smart(s,p){if(s.phase!=='main'||p!==s.cur)return B.smart(s,p);
 const r=s.res[p],H=E().helpers,{ct,d}=army(s),ks=mine(s,p),can=c=>C.has(s,p,c),cs=H.cities(s,p);
 const mm=ks.reduce((a,v)=>a+(s.kn[v].a?s.kn[v].l:0),0);
 // 1. carte progresso (qualunque mossa valida suggerita dal motore)
 const pg=C.moves(s,p).filter(m=>m.t==='pg'&&m.card!=='saboteur');if(pg.length)return pg[0];
 // 2. difesa dai barbari
 const urgent=s.bar>=4||(s.bar>=2&&mm<Math.ceil(ct/s.n));
 if(urgent||(ks.length<1&&ct>=2)){
  const sl=ks.find(v=>!s.kn[v].a);if(sl!=null&&r.grain>=1)return{t:'kn_act',v:sl};
  if(can({wool:1,ore:1})){if(H.knOf(s,p,1)<2){const sp=H.knSpots(s,p);if(sp.length)return{t:'kn_new',v:sp[0]}}const up=ks.find(v=>!H.promoteOk(s,p,v));if(up!=null)return{t:'kn_up',v:up}}}
 // 3. città, poi migliorie
 if(can(C.COST.city)&&C.citySpots(s,p).length&&C.count(s,p,2)<4)return B.smart(s,p);
 if(cs.length){const E_=E();const t=E_.TR.filter(k=>s.imp[p][k]<5&&r[E_.COM[k]]>=s.imp[p][k]+1-(s.crane[p]>0?1:0)).sort((a,b)=>s.imp[p][a]-s.imp[p][b])[0];if(t)return{t:'imp',k:t}}
 const a=B.smart(s,p);
 if(a.t==='end'){const w=cs.find(v=>!s.wall[v]);if(w!=null&&r.brick>=2&&H.walls(s,p)<3&&C.cardsOf(s,p)>=6)return{t:'wall',v:w}}
 return a}
return Object.assign({},B,{smart})};
