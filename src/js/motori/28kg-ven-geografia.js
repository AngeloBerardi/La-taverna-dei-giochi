/* ---- Compagnia di ventura, geografia del mondo nuovo (passo 07). ----
   Mondo ampio (192) o vasto (240) per i mondi `s.geo===2`: continente con isole, catene con passi, laghi, fiumi che scendono al mare o ai laghi,
   climi, luoghi scelti per idoneità, strade di valle con ponti e guadi. `VGEO.genera(seme,opz)` dà lo stesso formato di `VEN.mappa`
   ({seme,G,T,B,S,R,A,ok,luoghi,covi}) più: F (portata dei fiumi per cella), LG (id del lago per cella, 0 = mare), P (ponti e guadi), PN (per cella: 1 ponte, 2 guado),
   PS (passi), D (verso dove scende l'acqua), Q (quota con le conche riempite), catene, fiumi, laghi.
   Si attacca a `VEN.mappaDi` componendo la versione precedente; `VEN.molt('marcia')` tiene conto di fiumi, ponti e passi.
   Ripetibile: niente Math.random né trigonometria; gli spareggi vanno sempre per indice di cella. Passo 23: la divisione in regni. Dopo 28ke, prima di 28l. */
const VGEO=(()=>{
 const D=VDAT,M_floor=Math.floor,M_imul=Math.imul,M_sqrt=Math.sqrt,M_min=Math.min,M_max=Math.max,M_abs=Math.abs,M_ceil=Math.ceil; // alias locali: più veloci dei globali
 // i numeri del passo 07
 const GEO=D.GEO={BORDO:8,TERRA:.54,COLLINA:.84,CRESTA:.6,LARGO:5.2,DORSALI:[3,5],PASSI:2,LAGO_GRANDE:40,LAGO_MIN:8,PROFONDITA:.012,FIUMI:[6,10],
  PORTO_DIST:6,VILLAGGIO_DIST:4.5,CASTELLO_DIST:9,GUARDIA:8,SCALA_VIAGGIO:.6,K_FIUME:.35,K_PONTE:.9,K_PASSO:.7,CACHE:4};
 const MARE=VEN.MARE,COLLE=VEN.COLLE,MONTE=VEN.MONTE;
 const CENTRI={val:[.72,.48],sel:[.3,.74],fer:[.45,.2],mar:[.7,.8],alt:[.2,.4]};
 const h2=(x,y,s)=>{let n=M_imul(x,374761393)^M_imul(y,668265263)^M_imul(s,1274126177);n=M_imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 const liscio=t=>t*t*(3-2*t);
 function rumore(x,y,s){const xi=M_floor(x),yi=M_floor(y),fx=liscio(x-xi),fy=liscio(y-yi);
  const a=h2(xi,yi,s),b=h2(xi+1,yi,s),c=h2(xi,yi+1,s),d=h2(xi+1,yi+1,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy}
 // `rumore(x/scala,y/scala,s)·peso` su tutta la griglia G×G, sommato in `out`: i valori ai nodi si calcolano una volta sola (molto più svelto)
 function campo(G,out,scala,s,peso){const n=M_floor((G-1)/scala)+2,tb=new Float64Array(n*n),xi=new Int32Array(G),fx=new Float64Array(G);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)tb[j*n+i]=h2(i,j,s);
  for(let x=0;x<G;x++){const v=x/scala;xi[x]=M_floor(v);fx[x]=liscio(v-xi[x])}
  for(let y=0;y<G;y++){const r0=xi[y]*n,r1=r0+n,fy=fx[y],o=y*G;
   for(let x=0;x<G;x++){const k=xi[x],f=fx[x],a=tb[r0+k],b=tb[r0+k+1],c=tb[r1+k],d=tb[r1+k+1];out[o+x]+=peso*(a+(b-a)*f+(c-a)*fy+(a-b-c+d)*f*fy)}}
  return out}
 const d2p=(x0,y0,x1,y1)=>M_sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0));
 const clamp=(v,a,b)=>v<a?a:v>b?b:v;
 const OX=[1,-1,0,0,1,-1,1,-1],OY=[0,0,1,-1,1,1,-1,-1]; // i 4 vicini, poi le diagonali
 // coda di priorità: chiave più indice (1e-12 per cella) così gli spareggi sono sempre uguali
 function Coda(n){const k=new Float64Array(n+1),v=new Int32Array(n+1);let m=0;
  return{len:()=>m,vuota(){m=0},
   metti(c,id){const key=c+id*1e-12;let i=++m;while(i>1){const p=i>>1;if(k[p]<=key)break;k[i]=k[p];v[i]=v[p];i=p}k[i]=key;v[i]=id},
   togli(){const id=v[1],key=k[m],vv=v[m];m--;let i=1;for(;;){let c=2*i;if(c>m)break;if(c<m&&k[c+1]<k[c])c++;if(k[c]>=key)break;k[i]=k[c];v[i]=v[c];i=c}k[i]=key;v[i]=vv;return id}}}
 const CACHE={},CHIAVI=[];
 function genera(seme,opz){
  const lato=((D.DIFF.mondo||{})[(opz&&opz.mondo)||D.OPZ0.mondo]||D.DIFF.mondo.ampio).lato,G=lato,chiave=seme+':'+G;
  if(CACHE[chiave])return CACHE[chiave];
  const N=G*G,sc=G/128,BORDO=GEO.BORDO,REG=D.REGNI;
  const bordo=i=>{const x=i%G,y=(i-x)/G;return M_min(x,y,G-1-x,G-1-y)};
  // ---------- 1. continente e isole ----------
  let A=new Float32Array(N);
  const isole=[];for(let k=0;k<1+M_floor(h2(seme,5,701)*3);k++)isole.push([G*(.12+.76*h2(k,1,seme+702)),G*(.12+.76*h2(k,2,seme+703)),G*(.035+.035*h2(k,3,seme+704))]);
  const FB=new Float64Array(N),RR=campo(G,new Float64Array(N),20*sc,seme+740,1);
  for(let o=0,s0=13*sc,p=[.5,.25,.15,.1];o<4;o++)campo(G,FB,s0/(1<<o),seme+o,p[o]);
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=y*G+x,e=M_min(x,y,G-1-x,G-1-y);
   const dx=(x+.5-G/2)/(G/2),dy=(y+.5-G/2)/(G/2),rr=M_sqrt(dx*dx+dy*dy)*(1+(RR[i]-.5)*.7),rampa=liscio(clamp((1.02-rr)/.55,0,1)),base=FB[i];
   let a=base*.55+rampa*.65;
   for(const o of isole){const d=((x-o[0])*(x-o[0])+(y-o[1])*(y-o[1]))/(o[2]*o[2]);if(d<1)a+=.4*(1-d)*(1-d)}
   A[i]=e<BORDO?-1:a}
  {const ord=Float32Array.from(A).sort(),v0=ord[M_floor(N*GEO.TERRA)],v1=ord[M_floor(N*(GEO.TERRA+(1-GEO.TERRA)*GEO.COLLINA))],v2=ord[N-1],v00=ord[0];
   for(let i=0;i<N;i++){const a=A[i];let r;
    if(a<v0)r=MARE*.98*M_max(0,a-v00)/M_max(1e-9,v0-v00);else if(a<v1)r=MARE+(COLLE-MARE)*(a-v0)/M_max(1e-9,v1-v0);else r=COLLE+(MONTE-.02-COLLE)*(a-v1)/M_max(1e-9,v2-v1);
    A[i]=bordo(i)<BORDO?0:r}}
  // ---------- 2. catene con i loro passi ----------
  // la terra principale prima delle catene: le dorsali nascono e corrono solo lì
  const bm=new Uint8Array(N);
  {const comp=new Int32Array(N).fill(-1);let nc=0,gr=0,gm=0;
   for(let i=0;i<N;i++){if(comp[i]>=0||A[i]<MARE)continue;const lista=[i];comp[i]=nc;
    for(let k=0;k<lista.length;k++){const c=lista[k],cx=c%G,cy=(c-cx)/G;for(let d=0;d<4;d++){const ox=OX[d],oy=OY[d];const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(comp[j]<0&&A[j]>=MARE){comp[j]=nc;lista.push(j)}}}
    if(lista.length>gm){gm=lista.length;gr=nc}nc++}
   for(let i=0;i<N;i++)bm[i]=comp[i]===gr?1:0}
  const catene=[],R0=new Float32Array(N),nd=GEO.DORSALI[0]+M_floor(h2(seme,6,705)*(GEO.DORSALI[1]-GEO.DORSALI[0]+1)),larg=GEO.LARGO*sc;
  for(let t=0;t<80&&catene.length<nd;t++){
   let x=G*(.15+.7*h2(t,1,seme+710)),y=G*(.15+.7*h2(t,2,seme+711));if(!bm[M_floor(y)*G+M_floor(x)]||A[M_floor(y)*G+M_floor(x)]<MARE+.04)continue;
   let dx=h2(t,3,seme+712)-.5,dy=h2(t,4,seme+713)-.5;{const l=M_sqrt(dx*dx+dy*dy)||1;dx/=l;dy/=l}
   const pt=[],lung=M_floor(G*(.4+.3*h2(t,5,seme+714))),d0x=dx,d0y=dy;
   // la dorsale piega col rumore ma resta vicina alla direzione di partenza (al più 60°): niente riccioli né «S»
   for(let k=0;k<lung;k++){const ci=M_floor(y)*G+M_floor(x);if(x<BORDO||y<BORDO||x>=G-BORDO||y>=G-BORDO||!bm[ci])break;pt.push([x,y]);
    const w=(rumore(k/(9*sc),t*7.3,seme+715)-.5)*.5;let nx=(dx-dy*w)*.85+d0x*.15,ny=(dy+dx*w)*.85+d0y*.15;const l=M_sqrt(nx*nx+ny*ny)||1;nx/=l;ny/=l;
    if(nx*d0x+ny*d0y<.5){const lato=d0x*ny-d0y*nx<0?-1:1;nx=d0x*.5-d0y*.8660254*lato;ny=d0y*.5+d0x*.8660254*lato}
    dx=nx;dy=ny;x+=dx;y+=dy}
   if(pt.length<24*sc)continue;
   const passi=[],n=pt.length,quanti=GEO.PASSI+1;
   for(let k=0;k<quanti;k++){const f=(k+.5)/quanti,j=clamp(M_floor(n*(f+(h2(t,k+7,seme+717)-.5)*.16)),2,n-3);passi.push(j)}
   catene.push({pt,passi})}
  for(const c of catene){const lib=new Uint8Array(c.pt.length);for(const j of c.passi)for(let k=M_max(0,j-2);k<=M_min(c.pt.length-1,j+2);k++)lib[k]=1;
   c.pt.forEach((p,k)=>{if(lib[k])return;const r=M_ceil(larg);for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){const cx=M_floor(p[0])+ox,cy=M_floor(p[1])+oy;if(cx<0||cy<0||cx>=G||cy>=G)continue;
    const d=d2p(cx+.5,cy+.5,p[0],p[1]);if(d>=larg)continue;const v=GEO.CRESTA*(1-d/larg)*(1-d/larg),i=cy*G+cx;if(v>R0[i])R0[i]=v}})}
  for(let i=0;i<N;i++)if(A[i]>=MARE&&R0[i]>0)A[i]=M_min(1.2,A[i]+R0[i]);
  // il passo attraversa tutta la cresta: un corridoio di colline lungo la perpendicolare alla dorsale
  const scava=(c,k0,sul)=>{const p=c.pt[k0],pa=c.pt[M_max(0,k0-2)],pb=c.pt[M_min(c.pt.length-1,k0+2)];let tx=pb[0]-pa[0],ty=pb[1]-pa[1];const l=M_sqrt(tx*tx+ty*ty)||1;tx/=l;ty/=l;
   for(let s=-larg*1.6;s<=larg*1.6;s+=.5){const cx=p[0]-ty*s,cy=p[1]+tx*s;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const qx=M_floor(cx)+ox,qy=M_floor(cy)+oy;if(qx<BORDO||qy<BORDO||qx>=G-BORDO||qy>=G-BORDO)continue;const q=qy*G+qx;if(A[q]>=MONTE){A[q]=COLLE+.04;if(sul)sul[q]=1}}}};
  for(const c of catene){c.passi=c.passi.map(j=>{const p=c.pt[j],r=2;let x=M_floor(p[0]),y=M_floor(p[1]);
    for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){const i=(y+oy)*G+x+ox;if(A[i]>=MONTE&&ox*ox+oy*oy<=r*r+1)A[i]=COLLE+.04}
    scava(c,j);
    if(A[y*G+x]<COLLE+.01)A[y*G+x]=COLLE+.04;return[x,y]})}
  // ---------- 3. laghi: le conche si riempiono fino al punto di sfioro ----------
  const Q=new Float32Array(N),Dn=new Int32Array(N).fill(-1),vis=new Uint8Array(N),ordine=new Int32Array(N);let no=0;
  {const q=Coda(N);for(let i=0;i<N;i++)if(bordo(i)===0){vis[i]=1;Q[i]=A[i];q.metti(A[i],i)}
   while(q.len()){const c=q.togli();ordine[no++]=c;const cx=c%G,cy=(c-cx)/G;
    for(let d=0;d<8;d++){const ox=OX[d],oy=OY[d];const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(vis[j])continue;vis[j]=1;Dn[j]=c;Q[j]=M_max(A[j],Q[c]);q.metti(Q[j],j)}}}
  const T=new Uint8Array(N),PS0=new Uint8Array(N);
  for(const c of catene)for(const p of c.passi)for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++)PS0[(p[1]+oy)*G+p[0]+ox]=1;
  for(let i=0;i<N;i++){const a=A[i];T[i]=a<MARE||(a>=MARE&&!PS0[i]&&Q[i]-a>GEO.PROFONDITA)?0:a>MONTE?4:a>COLLE?3:1}
  const LG=new Uint16Array(N),laghi=[{id:0,n:0,grande:true}];
  {const vi=new Uint8Array(N);let id=1;const comp=[];
   for(let i=0;i<N;i++){if(T[i]!==0||vi[i])continue;const lista=[i];vi[i]=1;let mare=false;
    for(let k=0;k<lista.length;k++){const c=lista[k],cx=c%G,cy=(c-cx)/G;if(bordo(c)===0)mare=true;
     for(let d=0;d<4;d++){const ox=OX[d],oy=OY[d];const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(T[j]===0&&!vi[j]){vi[j]=1;lista.push(j)}}}
    comp.push({lista,mare})}
   for(const c of comp){if(c.mare){laghi[0].n+=c.lista.length;continue}
    if(c.lista.length<GEO.LAGO_MIN){for(const i of c.lista){const a=A[i];T[i]=a<MARE?1:a>MONTE?4:a>COLLE?3:1;if(a<MARE)A[i]=MARE+.01}continue}
    for(const i of c.lista)LG[i]=id;laghi.push({id,n:c.lista.length,grande:c.lista.length>=GEO.LAGO_GRANDE});id++}}
  const acqua=i=>T[i]===0,navig=i=>T[i]===0&&laghi[LG[i]].grande;
  // ---------- 4. fiumi: accumulo del flusso sulle quote riempite ----------
  const acc=new Float32Array(N),RA=campo(G,new Float64Array(N),7*sc,seme+720,1);for(let i=0;i<N;i++)acc[i]=bordo(i)===0?0:.6+.8*RA[i];
  for(let k=no-1;k>=0;k--){const c=ordine[k];if(Dn[c]>=0)acc[Dn[c]]+=acc[c]}
  const foci=[];for(let i=0;i<N;i++)if(!acqua(i)&&Dn[i]>=0&&acqua(Dn[i])&&navig(Dn[i])&&T[i]!==4)foci.push(i);
  foci.sort((a,b)=>acc[b]-acc[a]||a-b);
  const nf=M_min(foci.length,GEO.FIUMI[1]),principali=foci.slice(0,M_max(M_min(foci.length,GEO.FIUMI[0]),nf)),soglia=M_max(22*sc*sc,(principali.length?acc[principali[principali.length-1]]:100)*.12);
  const F=new Float32Array(N);for(let i=0;i<N;i++)if(!acqua(i)&&bordo(i)>0&&acc[i]>=soglia)F[i]=acc[i];
  const fiumi=principali.filter(i=>F[i]>0).map(i=>({foce:i,x:(i%G)+.5,y:M_floor(i/G)+.5,portata:acc[i]}));
  // ---------- la terra principale: celle percorribili raggiungibili ----------
  const ok=new Uint8Array(N);
  const calcolaOk=()=>{const comp=new Int16Array(N).fill(-1);let nc=0,gr=0,gm=0;
   for(let i=0;i<N;i++){if(comp[i]>=0||T[i]===0||T[i]===4)continue;let n=0;const lista=[i];comp[i]=nc;
    for(let k=0;k<lista.length;k++){const c=lista[k],cx=c%G,cy=(c-cx)/G;n++;
     for(let d=0;d<4;d++){const ox=OX[d],oy=OY[d];const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(comp[j]<0&&T[j]!==0&&T[j]!==4){comp[j]=nc;lista.push(j)}}}
    if(n>gm){gm=n;gr=nc}nc++}
   for(let i=0;i<N;i++)ok[i]=comp[i]===gr?1:0};
  calcolaOk();
  // una dorsale con meno di 2 passi raggiungibili ne riceve altri dove la terra principale la tocca
  {let nuovi=false;
   for(const c of catene){c.passi=c.passi.filter(p=>ok[p[1]*G+p[0]]);const n=c.pt.length;
    for(let k=3;k<n-3&&c.passi.length<GEO.PASSI;k++){const p=c.pt[k],x=M_floor(p[0]),y=M_floor(p[1]);if(c.passi.some(q=>d2p(q[0],q[1],x,y)<3*sc))continue;
     let tocca=false;for(let oy=-7;oy<=7&&!tocca;oy++)for(let ox=-7;ox<=7;ox++)if(ok[(y+oy)*G+x+ox]){tocca=true;break}
     if(!tocca||T[y*G+x]===0)continue;
     for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const q=(y+oy)*G+x+ox;if(T[q]===4){T[q]=3;A[q]=COLLE+.04}}
     {const sul=new Uint8Array(N);scava(c,k,sul);for(let q=0;q<N;q++)if(sul[q]&&T[q]===4)T[q]=3}
     c.passi.push([x,y]);nuovi=true}}
   if(nuovi){calcolaOk();for(const c of catene)c.passi=c.passi.filter(p=>ok[p[1]*G+p[0]]&&T[p[1]*G+p[0]]!==0)}}
  for(const c of catene)c.passi=c.passi.filter(p=>ok[p[1]*G+p[0]]);
  // ---------- 5. climi: umidità vicino all'acqua, bosco, neve a nord, secco a sud ----------
  const B=new Uint8Array(N),dw=new Uint8Array(N).fill(255);
  {const lista=[];for(let i=0;i<N;i++)if(acqua(i)||F[i]>0){dw[i]=0;lista.push(i)}
   for(let k=0;k<lista.length;k++){const c=lista[k],cx=c%G,cy=(c-cx)/G;if(dw[c]>=8)continue;for(let d=0;d<4;d++){const ox=OX[d],oy=OY[d];const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(dw[j]===255){dw[j]=dw[c]+1;lista.push(j)}}}}
  const umido=new Float32Array(N);
  const RU=campo(G,new Float64Array(N),6*sc,seme+730,1),RN=campo(G,new Float64Array(N),9*sc,seme+731,1);
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=y*G+x,h=.5*RU[i]+.5*(1-M_min(dw[i],8)/8),lat=y/G;umido[i]=h;
   const nv=RN[i]-.5;
   B[i]=(lat<.22+nv*.1||(T[i]===4&&A[i]>.95))&&T[i]>=3?1:lat>.7+nv*.1&&h<.5?3:lat>.52&&h<.4?2:0;
   if(T[i]===1&&h>(lat<.3?.5:.62)+(lat>.7?.1:0))T[i]=2}
  // ---------- 6. luoghi ----------
  const M={seme,G,T,B,S:new Uint8Array(N),R:new Uint8Array(N),A,ok,F,LG,Q,D:Dn,PN:new Uint8Array(N),PS:new Uint8Array(N),P:[],catene,fiumi,laghi};
  for(const c of catene)for(const p of c.passi){const r=2;for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){const i=(p[1]+oy)*G+p[0]+ox;if(T[i]===3)M.PS[i]=1}}
  const confl=new Uint8Array(N);for(let i=0;i<N;i++)if(F[i]>0){let n=0;const x=i%G,y=(i-x)/G;for(let d=0;d<8;d++){const ox=OX[d],oy=OY[d];const nx=x+ox,ny=y+oy;if(nx>=0&&ny>=0&&nx<G&&ny<G){const j=ny*G+nx;if(Dn[j]===i&&F[j]>0)n++}}confl[i]=n>=2?1:0}
  const costa=new Uint8Array(N),riva=new Uint8Array(N),baia=new Uint8Array(N),foce=new Uint8Array(N);
  for(let i=0;i<N;i++){if(acqua(i))continue;const x=i%G,y=(i-x)/G;let nc=0,nr=0,nb=0;
   for(let d=0;d<8;d++){const nx=x+OX[d],ny=y+OY[d];if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(T[j]!==0)continue;const lg=LG[j];if(lg===0)nb++;if(laghi[lg].grande){nc++;if(lg>0)nr++}}
   costa[i]=nc>0?1:0;riva[i]=nr>0?1:0;baia[i]=nb>=3?1:0;
   foce[i]=F[i]>0&&Dn[i]>=0&&acqua(Dn[i])?1:0}
  const L=[];
  const lontano=(x,y,d)=>{for(const l of L){const dx=x-l.x,dy=y-l.y;if(dx*dx+dy*dy<d*d)return false}return true};
  const rum=new Float32Array(N);for(let i=0;i<N;i++)rum[i]=h2(i%G,M_floor(i/G),seme+300)*.6;
  const cand=[],candF=[];for(let y=4;y<G-4;y++)for(let x=4;x<G-4;x++){const i=y*G+x;if(!ok[i])continue;candF.push(i);if(!(F[i]>0))cand.push(i)}
  // il candidato migliore (spareggio per indice di cella); per regione scorre solo le celle della regione (R non cambia più dopo le città)
  let perReg=null;
  const cerca=(reg,okf,punti,anche)=>{let m=null,mv=-1e9,lista=anche?candF:cand;
   if(reg>=0){if(!perReg){perReg=REG.map(()=>[[],[]]);for(const i of cand)perReg[M.R[i]][0].push(i);for(const i of candF)perReg[M.R[i]][1].push(i)}lista=perReg[reg][anche?1:0]}
   for(let k=0;k<lista.length;k++){const i=lista[k],x=i%G,y=(i-x)/G;
    const v=punti(x,y,i)+rum[i];if(v<=mv||!okf(x,y,i))continue;mv=v;m=[x,y]}return m};
  // lo stesso, solo nel quadrato di lato 2r intorno a (cx,cy): stesse celle di `cand`, stesso ordine
  const cercaVicino=(cx,cy,r,okf,punti)=>{let m=null,mv=-1e9;const y0=M_max(4,M_floor(cy-r)),y1=M_min(G-5,M_floor(cy+r)),x0=M_max(4,M_floor(cx-r)),x1=M_min(G-5,M_floor(cx+r));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*G+x;if(!ok[i]||F[i]>0)continue;const v=punti(x,y,i)+rum[i];if(v<=mv||!okf(x,y,i))continue;mv=v;m=[x,y]}return m};
  const metti=(tipo,f,k,pos,capo)=>{if(!pos)return null;const NM=D.NOMI[tipo],nomi=tipo==='covo'?[D.CAPIBANDA[k%D.CAPIBANDA.length].banda]:f==='neu'||f==='pre'?NM:NM[f];
   const l={id:L.length,tipo,faz:f,nome:(tipo==='covo'?'Covo: ':'')+nomi[k%nomi.length]+(k>=nomi.length&&tipo==='castello'?' bis':''),x:pos[0]+.5,y:pos[1]+.5,capo:capo==null?-1:capo,k};L.push(l);
   const i=pos[1]*G+pos[0];if(tipo==='citta'||tipo==='castello'){if(T[i]!==1)T[i]=3}else if(tipo!=='rovine'&&tipo!=='covo'&&tipo!=='monastero'){T[i]=1;if(B[i]===1)B[i]=0}return l}; // la neve resta sui rilievi
  // città: foci, confluenze, rive di lago grande, baie; una per regno, vicino al suo centro preferito e lontana dalle altre
  const minC=G/6,citta=[];
  REG.forEach((f,k)=>{const c=CENTRI[f],cx=c[0]*G,cy=c[1]*G,idoneo=(x,y,i)=>T[i]===1&&citta.every(q=>d2p(x,y,q[0],q[1])>=minC);
   const pt=(x,y,i)=>(foce[i]?3:0)+(confl[i]?2.5:0)+(riva[i]?2:0)+(baia[i]?1.5:0)+(f==='mar'&&costa[i]?3:0)+(dw[i]<=3?.8:0)-d2p(x,y,cx,cy)*(G>=192?.09:.12)/sc;
   const p=cerca(-1,idoneo,pt,true)||cerca(-1,(x,y,i)=>T[i]!==4&&T[i]!==0,pt,true);if(p)citta.push([p[0],p[1],k])});
  // regioni provvisorie: la città più vicina
  {const nc=citta.length;for(let i=0;i<N;i++){const x=i%G,y=(i-x)/G;let b=0,bd=1e18;for(let k=0;k<nc;k++){const q=citta[k],dx=x-q[0],dy=y-q[1],d=dx*dx+dy*dy;if(d<bd){bd=d;b=q[2]}}M.R[i]=b}}
  REG.forEach((f,k)=>{const q=citta.find(c=>c[2]===k);if(q)metti('citta',f,0,[q[0],q[1]])});
  const cittaDi=f=>L.find(l=>l.faz===f&&l.tipo==='citta');
  // celle a meno di 5 da un passo
  const vp=new Uint8Array(N);for(const c of catene)for(const p of c.passi)for(let y=M_max(0,p[1]-5);y<=M_min(G-1,p[1]+6);y++)for(let x=M_max(0,p[0]-5);x<=M_min(G-1,p[0]+6);x++){const dx=x-p[0]-.5,dy=y-p[1]-.5;if(dx*dx+dy*dy<25)vp[y*G+x]=1}
  REG.forEach((f,reg)=>{const cit=cittaDi(f);if(!cit)return;for(let k=0;k<4;k++)
   metti('castello',f,k,cerca(reg,(x,y)=>lontano(x+.5,y+.5,GEO.CASTELLO_DIST*sc),(x,y,i)=>(T[i]===3?1.5:0)+(M.PS[i]||vp[i]?3:0)+(dw[i]<=2?.8:0)+(confl[i]?1.5:0)-M_abs(d2p(x,y,cit.x,cit.y)-15*sc)*.25)||cerca(-1,(x,y)=>lontano(x+.5,y+.5,6*sc),(x,y)=>-d2p(x,y,cit.x,cit.y)*.2),cit.id)});
  REG.forEach((f,reg)=>{const capi=L.filter(l=>l.faz===f&&(l.tipo==='citta'||l.tipo==='castello'));if(!capi.length)return;for(let k=0;k<8;k++){const capo=capi[k%capi.length];
   metti('villaggio',f,k,cerca(reg,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,GEO.VILLAGGIO_DIST),(x,y,i)=>(dw[i]<=3?1.2:0)+(dw[i]===0?-5:0)-M_abs(d2p(x,y,capo.x,capo.y)-6*sc)*.5)||cerca(-1,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,4),(x,y)=>-d2p(x,y,capo.x,capo.y)),capo.id)}});
  // porti: solo dove il vicino è mare o lago grande; a ≥ 6 celle da un altro porto
  REG.forEach((f,reg)=>{const cit=cittaDi(f);if(!cit)return;for(let k=0;k<(f==='mar'?2:1);k++)
   metti('porto',f,k,cerca(reg,(x,y,i)=>T[i]!==4&&costa[i]&&lontanoTipo('porto',x+.5,y+.5,GEO.PORTO_DIST)&&lontano(x+.5,y+.5,4),(x,y)=>-d2p(x,y,cit.x,cit.y)*.25)||cerca(-1,(x,y,i)=>T[i]!==4&&costa[i]&&lontanoTipo('porto',x+.5,y+.5,GEO.PORTO_DIST)&&lontano(x+.5,y+.5,4),(x,y)=>-d2p(x,y,cit.x,cit.y)*.25),cit.id)});
  function lontanoTipo(tipo,x,y,d){for(const l of L)if(l.tipo===tipo&&(x-l.x)*(x-l.x)+(y-l.y)*(y-l.y)<d*d)return false;return true}
  // ---------- 7. strade: costo minimo, di valle; i fiumi si passano su ponti e guadi ----------
  const g=new Float32Array(N),da=new Int32Array(N),stampa=new Int32Array(N),chiuso=new Int32Array(N),coda=Coda(N*2);let giro=0;
  const COSTO=[9,1,1.45,1.35,9];
  function percorso(a,b){giro++;const bx=b%G,by=(b-bx)/G;coda.vuota();g[a]=0;da[a]=-1;stampa[a]=giro;coda.metti(0,a);   while(coda.len()){const c=coda.togli();if(chiuso[c]===giro)continue;chiuso[c]=giro;if(c===b)break;const cx=c%G,cy=(c-cx)/G;
    for(let d=0;d<8;d++){const ox=OX[d],oy=OY[d];const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(!ok[j])continue;
     if(ox&&oy&&(!ok[cy*G+nx]||!ok[ny*G+cx]))continue;
     const w=(M.S[j]?.5:COSTO[T[j]]+(T[j]===3?.6:0)+(F[j]>0?6:0)+M_abs(A[j]-A[c])*12)*(ox&&oy?1.4142:1),ng=g[c]+w;
     if(stampa[j]!==giro||ng<g[j]){stampa[j]=giro;g[j]=ng;da[j]=c;coda.metti(ng+d2p(nx,ny,bx,by)*.9,j)}}}
   if(stampa[b]!==giro)return null;const v=[];for(let c=b;c>=0;c=da[c]){v.push(c);if(c===a)break}return v.reverse()}
  const castelli=()=>L.filter(l=>l.tipo==='castello');
  function lega(a,b){const v=percorso(M_floor(a.y)*G+M_floor(a.x),M_floor(b.y)*G+M_floor(b.x));if(!v)return;for(const c of v)M.S[c]=1;
   for(let k=0;k<v.length;k++){if(!(F[v[k]]>0))continue;let e=k,mx=0;while(e<v.length&&F[v[e]]>0){mx=M_max(mx,F[v[e]]);e++}
    const run=v.slice(k,e);if(run.some(c=>M.PN[c])){for(const c of run)if(!M.PN[c])M.PN[c]=M.PN[run.find(z=>M.PN[z])];k=e-1;continue}
    const t=mx<soglia*4?2:1,mid=run[run.length>>1];for(const c of run)M.PN[c]=t;
    let cs=null,cd=1e9;for(const l of castelli()){const d=d2p(l.x,l.y,(mid%G)+.5,M_floor(mid/G)+.5);if(d<cd){cd=d;cs=l}}
    M.P.push({i:mid,x:(mid%G)+.5,y:M_floor(mid/G)+.5,t:t===1?'ponte':'guado',castello:cs?cs.id:-1});k=e-1}}
  for(const l of L)if(l.capo>=0)lega(l,L[l.capo]);
  {const C=L.filter(l=>l.tipo==='citta'),pv=l=>C.filter(b=>b!==l).sort((p,q)=>d2p(l.x,l.y,p.x,p.y)-d2p(l.x,l.y,q.x,q.y));
   const gruppo=C.map((c,i)=>i),trova=i=>gruppo[i]===i?i:(gruppo[i]=trova(gruppo[i]));
   for(const a of C){const v=pv(a);for(let k=0;k<2&&k<v.length;k++){lega(a,v[k]);gruppo[trova(C.indexOf(a))]=trova(C.indexOf(v[k]))}}
   for(;;){let b=null,bd=1e9;for(const a of C)for(const c of C)if(trova(C.indexOf(a))!==trova(C.indexOf(c))){const d=d2p(a.x,a.y,c.x,c.y);if(d<bd){bd=d;b=[a,c]}}
    if(!b)break;lega(b[0],b[1]);gruppo[trova(C.indexOf(b[0]))]=trova(C.indexOf(b[1]))}}
  // i castelli guardano i ponti e i passi: dove il più vicino è lontano se ne aggiunge uno accanto (con la sua strada)
  const guarda=(x,y)=>{let b=1e9;for(const l of L)if(l.tipo==='castello'){const d=d2p(l.x,l.y,x,y);if(d<b)b=d}return b},RAGGIO=GEO.GUARDIA*sc;
  const sorveglia=()=>{let n=0;const mire=M.P.map(p=>[p.x,p.y]);
   for(const c of catene){let b=null,bd=1e9;for(const p of c.passi){const d=guarda(p[0]+.5,p[1]+.5);if(d<bd){bd=d;b=[p[0]+.5,p[1]+.5]}}if(b)mire.push(b)}
   for(const m of mire){if(guarda(m[0],m[1])<=RAGGIO)continue;
    const q=cercaVicino(m[0],m[1],RAGGIO*.85,(x,y,i)=>T[i]!==4&&lontano(x+.5,y+.5,3)&&d2p(x+.5,y+.5,m[0],m[1])<=RAGGIO*.85,(x,y,i)=>-d2p(x+.5,y+.5,m[0],m[1])+(T[i]===3?.5:0));if(!q)continue;
    const f=REG[M.R[q[1]*G+q[0]]],cit=cittaDi(f);if(!cit)continue;const l=metti('castello',f,L.filter(z=>z.faz===f&&z.tipo==='castello').length,q,cit.id);if(l){lega(l,cit);n++}}
   return n};
  // un castello nuovo porta una strada nuova, e forse un ponte nuovo: si ripete finché tutto è guardato
  const guardaTutto=()=>{for(let k=0;k<8&&sorveglia();k++);};
  guardaTutto();
  // monasteri e locande lungo le strade; rovine e covi nei boschi e sui monti lontani
  const ds=new Uint8Array(N).fill(255);
  {const lista=[];for(let i=0;i<N;i++)if(M.S[i]){ds[i]=0;lista.push(i)}
   for(let k=0;k<lista.length;k++){const c=lista[k],cx=c%G,cy=(c-cx)/G;if(ds[c]>=12)continue;for(let d=0;d<4;d++){const ox=OX[d],oy=OY[d];const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=G||ny>=G)continue;const j=ny*G+nx;if(ds[j]===255){ds[j]=ds[c]+1;lista.push(j)}}}}
  const C2=L.filter(l=>l.tipo==='citta'),piuVicina=l=>C2.slice().sort((p,q)=>d2p(l.x,l.y,p.x,p.y)-d2p(l.x,l.y,q.x,q.y))[0];
  for(let k=0;k<5;k++){const l=metti('monastero','neu',k,cerca(-1,(x,y,i)=>T[i]!==1&&lontano(x+.5,y+.5,8*sc),(x,y,i)=>(T[i]===3?1.5:0)-M_min(ds[i],12)*.4));if(l)lega(l,piuVicina(l))}
  for(let k=0;k<7;k++){const l=metti('locanda','neu',k,cerca(-1,(x,y,i)=>T[i]===1&&lontano(x+.5,y+.5,7*sc),(x,y,i)=>-M_min(ds[i],12)*.4));if(l)lega(l,piuVicina(l))}
  // le strade di monasteri e locande possono aver aperto altri ponti
  guardaTutto();
  for(const p of M.P){let cs=-1,cd=1e9;for(const l of L)if(l.tipo==='castello'){const d=d2p(l.x,l.y,p.x,p.y);if(d<cd){cd=d;cs=l.id}}p.castello=cs}
  const dcit=new Float32Array(N);for(let i=0;i<N;i++){if(!ok[i])continue;const x=(i%G)+.5,y=M_floor(i/G)+.5;let b=1e18;for(const c of C2){const d=(x-c.x)*(x-c.x)+(y-c.y)*(y-c.y);if(d<b)b=d}dcit[i]=M_sqrt(b)}
  const lonCitta=(x,y,i)=>dcit[i];
  for(let k=0;k<8;k++)metti('rovine','neu',k,cerca(-1,(x,y,i)=>T[i]!==1&&lontano(x+.5,y+.5,7*sc),(x,y,i)=>M_min(lonCitta(x,y,i),40*sc)*.1+(T[i]===2?1:0)));
  for(let k=0;k<6;k++)metti('covo','pre',k,cerca(-1,(x,y,i)=>T[i]!==1&&lontano(x+.5,y+.5,9*sc),(x,y,i)=>M_min(lonCitta(x,y,i),40*sc)*.1+(T[i]===3?1:0)));
  M.luoghi=L;M.covi=L.filter(l=>l.tipo==='covo').map(l=>[l.x,l.y]);
  CACHE[chiave]=M;CHIAVI.push(chiave);while(CHIAVI.length>GEO.CACHE)delete CACHE[CHIAVI.shift()];
  return M}
 // ---------- aggancio ----------
 const prima=VEN.mappaDi;
 VEN.mappaDi=s=>s.geo===2?genera(s.seme,VEN.opz(s)):prima(s);
 // viaggio: un giorno attraversa la stessa frazione di mondo × 0,6; fiume lento, ponte e guado veloci, passo lento
 const molt0=VEN.molt;
 VEN.molt=(s,k,c)=>{let m=molt0(s,k,c);
  if(k==='marcia'&&s.geo===2&&c&&c.i!=null){const M=VEN.mappaDi(s);m*=GEO.SCALA_VIAGGIO*M.G/128;
   if(M.PN[c.i])m*=GEO.K_PONTE*.72;else if(M.F[c.i]>0)m*=GEO.K_FIUME;if(M.PS[c.i])m*=GEO.K_PASSO}
  return m};
 return{genera,GEO}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VGEO;
