/* CATAN · MARINAI – mappe ad arcipelago generate al momento (originali, non copiate dalle scatole): mare, isole, oro, nebbia e isole da scoprire.
   Le regole di mare vere e proprie (navi, pirata, oro, nebbia) stanno nel nucleo (motori/18-catan.js): qui ci sono solo il generatore delle mappe,
   le restrizioni di partenza e il premio per ogni nuova isola colonizzata.
   Scenari (opts.scen): nt Terre da scoprire · qi Le quattro isole · ne Mare di nebbia · ar Arcipelago.
   Stato aggiunto: isl[i] = isola dell'esagono (−1 mare), ib[p] = isole nuove colonizzate, vis[p] = isole già toccate, ibv = punti per isola, fogN = esagoni nascosti. */
CATAN.ext('mar',(()=>{
const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
const key=(q,r)=>q+','+r;
const dist=(a,b)=>{const dq=a[0]-b[0],dr=a[1]-b[1];return(Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2};
/* divide total in k parti tra min e max */
function split(total,k,min,max,rnd){const a=Array(k).fill(min);let left=total-min*k;let g=0;while(left>0&&g++<999){const i=Math.floor(rnd()*k);if(a[i]<max){a[i]++;left--}}
 if(left>0)a[0]+=left;return a}
const SC={
 nt:{nome:'Terre da scoprire',ibv:1,home:true,fog:false,
  desc:'Si parte da un’isola grande: costruisci navi per colonizzare gli isolotti, alcuni ricchi d’oro. Ogni nuova isola con una colonia vale un punto.',
  plan:(n,L,rnd)=>{const main=Math.round(L*.52),rest=L-main,k=Math.max(3,Math.round(rest/3.6));return[main,...split(rest,k,2,6,rnd)]}},
 qi:{nome:'Le quattro isole',ibv:2,home:false,fog:false,
  desc:'Quattro isole di pari grandezza: si parte ovunque e si naviga per spartirsi il mondo. Le isole nuove valgono due punti.',
  plan:(n,L,rnd)=>split(L,4,Math.floor(L/4)-1,Math.ceil(L/4)+2,rnd)},
 ne:{nome:'Mare di nebbia',ibv:1,home:true,fog:true,
  desc:'Solo l’isola di partenza è visibile: il resto è coperto dalla nebbia e si scopre navigando (chi scopre una terra prende una carta).',
  plan:(n,L,rnd)=>{const main=Math.round(L*.5),rest=L-main,k=Math.max(3,Math.round(rest/3.6));return[main,...split(rest,k,2,6,rnd)]}},
 ar:{nome:'Arcipelago',ibv:1,home:false,fog:false,
  desc:'Molte isole di media grandezza: si parte dove si vuole e si naviga per collegarle. Ogni isola nuova vale un punto.',
  plan:(n,L,rnd)=>split(L,Math.max(4,Math.round(L/5.5)),3,8,rnd)}};
const landOf=n=>12+5*Math.min(Math.max(n,2),6);   // esagoni di terra: 3 giocatori 27, 4 → 32, 6 → 42
function tryGen(KX,n,sc,R){
 const rnd=KX.RND,sh=KX.shuffle,L=landOf(n),sizes=sc.plan(n,L,rnd);
 const inside=c=>Math.abs(c[0])<=R-1&&Math.abs(c[1])<=R-1&&Math.abs(c[0]+c[1])<=R-1;
 const nb=c=>DIRS.map(d=>[c[0]+d[0],c[1]+d[1]]);
 const isl=new Map(),cells=[];   // chiave -> isola
 const okCell=(c,id)=>{if(!inside(c)||isl.has(key(c[0],c[1])))return false;for(const m of nb(c)){const j=isl.get(key(m[0],m[1]));if(j!=null&&j!==id)return false}return true};
 for(let id=0;id<sizes.length;id++){
  let seed=null;const cand=[];
  for(let q=-R+1;q<R;q++)for(let r=-R+1;r<R;r++){const c=[q,r];if(!inside(c))continue;
   if(id===0&&sc.home&&dist(c,[0,0])>1)continue;
   if(cells.some(x=>dist(x,c)<3))continue;cand.push(c)}
  if(!cand.length)return null;seed=cand[Math.floor(rnd()*cand.length)];
  const mine=[seed];isl.set(key(seed[0],seed[1]),id);
  while(mine.length<sizes[id]){const fr=[];
   for(const c of mine)for(const m of nb(c))if(okCell(m,id)&&!fr.some(f=>f[0]===m[0]&&f[1]===m[1]))fr.push(m);
   if(!fr.length)return null;
   const w=fr.map(f=>{const k=nb(f).filter(m=>isl.get(key(m[0],m[1]))===id).length;return k*k+.2});const tw=w.reduce((a,b)=>a+b,0);let x=rnd()*tw,pick=0;for(let i=0;i<w.length;i++){x-=w[i];if(x<=0){pick=i;break}}
   const c=fr[pick];mine.push(c);isl.set(key(c[0],c[1]),id)}
  mine.forEach(c=>cells.push(c))}
 /* elenco completo (isole + mare + cornice di mare) */
 const lay=[];for(let q=-R;q<=R;q++)for(let r=-R;r<=R;r++)if(Math.abs(q+r)<=R)lay.push([q,r]);
 const idx=new Map(lay.map((c,i)=>[key(c[0],c[1]),i]));
 const islOf=lay.map(c=>isl.has(key(c[0],c[1]))?isl.get(key(c[0],c[1])):-1);
 const landIdx=lay.map((c,i)=>i).filter(i=>islOf[i]>=0);
 /* terreni: oro sulle isole piccole, un deserto, il resto bilanciato */
 const types=Array(lay.length).fill('sea');
 const small=landIdx.filter(i=>islOf[i]>0||!sc.home),big=landIdx.filter(i=>islOf[i]===0);
 const gc=sc.home?Math.min(small.length-1,2+(n>=5?1:0)+(n>=4?1:0)):Math.min(2+(n>=5?1:0),small.length);
 const gpool=sh(small.slice());let gi=0;
 for(;gi<gc&&gi<gpool.length;gi++)types[gpool[gi]]='gold';
 const dpool=sh(big.filter(i=>types[i]==='sea'));if(!dpool.length)return null;types[dpool[0]]='desert';
 const rest=landIdx.filter(i=>types[i]==='sea'),RES=KX.RES;
 let ok=false;
 for(let t=0;t<200&&!ok;t++){const pool=[];while(pool.length<rest.length)pool.push(...sh(RES.slice()));pool.length=rest.length;sh(pool);rest.forEach((i,k)=>{types[i]=pool[k]});
  ok=new Set(big.map(i=>types[i]).filter(x=>x!=='desert'&&x!=='gold')).size>=Math.min(4,big.length)}
 if(!ok)return null;
 /* numeri: 6 e 8 mai vicini */
 const g=KX.geoLay(lay),HN=g.HN,numbered=landIdx.filter(i=>types[i]!=='desert');
 const base=[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],toks=[];while(toks.length<numbered.length)toks.push(...base);toks.length=numbered.length;
 const num=Array(lay.length).fill(0);let good=false;
 for(let t=0;t<4000&&!good;t++){sh(toks);numbered.forEach((i,k)=>{num[i]=toks[k]});good=!numbered.some(i=>(num[i]===6||num[i]===8)&&HN[i].some(j=>num[j]===6||num[j]===8))}
 if(!good)return null;
 const hexes=lay.map((c,i)=>({t:types[i],num:num[i]}));
 /* nebbia: tutto ciò che non è l'isola di partenza né la sua costa */
 let fogN=0;
 if(sc.fog){const main=lay.filter((c,i)=>islOf[i]===0);
  lay.forEach((c,i)=>{if(islOf[i]===0)return;if(Math.abs(c[0])+Math.abs(c[1])+Math.abs(c[0]+c[1])>=2*(R-1)+1)return;   // la cornice esterna resta visibile
   const d=Math.min(...main.map(m=>dist(m,c)));if(d>=2&&(islOf[i]>0||rnd()<.6)){hexes[i].fog=true;fogN++}})}
 /* porti: tratti di costa tra una terra e un mare visibile, ben distanziati */
 const {V,E}=g,mid=e=>[(V[E[e].a].x+V[E[e].b].x)/2,(V[E[e].a].y+V[E[e].b].y)/2];
 const coast=E.map((e,i)=>i).filter(i=>{const h=E[i].h;if(h.length!==2)return false;const a=hexes[h[0]],b=hexes[h[1]],ln=x=>x.t!=='sea';return ln(a)!==ln(b)&&!a.fog&&!b.fog});
 const P=Math.max(8,Math.min(12,Math.round(L/3.2))),ports=[];
 for(let t=0;t<400&&ports.length<P;t++){const e=coast[Math.floor(rnd()*coast.length)],m=mid(e);if(ports.some(q=>Math.hypot(mid(q)[0]-m[0],mid(q)[1]-m[1])<2.4))continue;ports.push(e)}
 if(ports.length<7)return null;
 const pk=sh([...Array(ports.length-5).fill('any'),...RES]);
 /* partenza: sull'isola principale (o ovunque) */
 const start=sc.home?V.map((v,i)=>i).filter(i=>V[i].h.some(h=>islOf[h]===0)):null;
 const ring=lay.map((c,i)=>i).filter(i=>hexes[i].t==='sea'&&!hexes[i].fog);
 const mainCells=lay.filter((c,i)=>islOf[i]===0);
 const far=ring.filter(i=>Math.min(...mainCells.map(m=>dist(m,lay[i])))>=2);
 const pirate=(far.length?far:ring)[Math.floor(rnd()*(far.length||ring.length))];
 return{lay,hexes,ports:ports.map((e,i)=>({e,k:pk[i]})),robber:types.indexOf('desert'),pirate,start,
  extra:{isl:islOf,ib:Array(n).fill(0),vis:Array.from({length:n},()=>[]),ibv:sc.ibv,fogN,scen:sc.id}}}
function map(KX,n,o){const id=SC[o.scen]?o.scen:'nt',sc=Object.assign({id},SC[id]);n=Math.min(Math.max(n,2),6);
 const R=n<=4?5:6;
 for(let t=0;t<400;t++){const m=tryGen(KX,n,sc,R);if(m){m.prof=null;m.vp=12;return m}}
 throw new Error('Mappa dei Marinai non generata')}
return{vp:12,SC,landOf,map,
 built(KX,s,p,kind,v,setup){if(kind!=='settle'||!s.isl)return;
  for(const i of KX.g().V[v].h){const id=s.isl[i];if(id<0||s.vis[p].includes(id))continue;s.vis[p].push(id);
   if(!setup&&s.ibv){s.ib[p]++;s.ev.push({t:'island',p,h:i});KX.L(s,s.names[p]+' mette piede su una nuova isola: +'+s.ibv+(s.ibv>1?' punti':' punto'))}}},
 points(KX,s,p){return s.ib?s.ib[p]*(s.ibv||0):0}};
})());
