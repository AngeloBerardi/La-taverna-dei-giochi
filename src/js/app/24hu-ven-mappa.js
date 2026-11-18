/* ---- Compagnia di ventura (piano C): la mappa del mondo in 3D. Solo disegno e gesti: le regole stanno in VEN (motori/28k). ----
   Terreno a facce piatte ricavato dalla quota continua `VEN.alt`, diviso in tasselli (si disegnano solo quelli in vista),
   mare con risacca, boschi a istanze, strade, campi. Luoghi: villaggi, castelli e città con lo stile del loro regno, porti con
   moli e barche, monasteri, locande, rovine e covi (questi due compaiono solo quando si scoprono). Fumo dai camini, finestre
   accese la notte, ombre di nuvole, pioggia e nebbia. Le compagnie marciano con lo stendardo e un seguito che mostra
   di che truppe sono fatte. Le etichette sono elementi della pagina (`.vn-etc`). Bottega comune: `VenArte` (24ht). Piano: docs/VENTURA.md. */
const VenMappa=(()=>{
 const K={s:null,seme:-1,scene:null,cam:null,fuoco:{x:32,y:0,z:32},alt:13,segue:true,t:0,P:{},lu:[],M:null};
 const SEN=Math.sin(52*Math.PI/180);
 function aspetto(){const A=VenArte;return A.rw&&A.rh?(A.rw-2)/(A.rh-2):.5}
 // striscia di mare oltre la terra che si può ancora guardare (cresce con il mondo)
 function margine(G){return Math.max(8,G/20)}
 function altMax(G,asp){const e=G/2+margine(G);return Math.max(8,Math.max(e/asp,e*SEN))}
 function limita(f,alt,G,asp){const R=(h)=>{const m=h-margine(G);return m>=G/2?G/2:m},mx=R(alt*asp),mz=R(alt/SEN);return{x:Math.max(mx,Math.min(G-mx,f.x)),z:Math.max(mz,Math.min(G-mz,f.z))}}
 function quotaA(a){const m=VEN.MARE;if(a<m)return Math.max(-1.3,(a-m)*7);let h=(a-m)*5;if(a>VEN.COLLE)h+=(a-VEN.COLLE)*13;if(a>VEN.MONTE)h+=(a-VEN.MONTE)*44;return h+(Math.round(h*2)/2-h)*.4+.06}
 // i luoghi stanno su un ripiano: attorno a ognuno il terreno si spiana alla sua quota
 function piano(x,y,base){const L=K.pianiG[(Math.max(0,Math.min(K.M.G-1,y))>>3)*(K.M.G>>3)+(Math.max(0,Math.min(K.M.G-1,x))>>3)];if(!L)return base;for(const f of L){const dx=x-f.x,dy=y-f.y;if(dx>f.r||dx<-f.r||dy>f.r||dy<-f.r)continue;const d=Math.sqrt(dx*dx+dy*dy);if(d<f.r){const t=Math.min(1,(f.r-d)/(f.r*.42)),u=t*t*(3-2*t);base+=(f.h-base)*u}}return base}
 // quota e altezza lette dalla griglia del terreno già calcolata (media dei quattro punti vicini): niente rumore a ogni chiamata
 const bil=(A,x,y)=>{const N=K.N,fx=Math.max(0,Math.min(N-.001,x*2)),fy=Math.max(0,Math.min(N-.001,y*2)),xi=Math.floor(fx),yi=Math.floor(fy),u=fx-xi,v=fy-yi,k=yi*(N+1)+xi;return A[k]*(1-u)*(1-v)+A[k+1]*u*(1-v)+A[k+N+1]*(1-u)*v+A[k+N+2]*u*v};
 const quota=(x,y)=>Math.max(0,bil(K.H,x,y)),altG=(x,y)=>bil(K.AL,x,y);
 const hh=(x,y,s)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 // rumore morbido a buon mercato per le chiazze di colore (niente quota: solo quattro dadi e una media)
 const vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=hh(xi,yi,s),b=hh(xi+1,yi,s),c=hh(xi,yi+1,s),d=hh(xi+1,yi+1,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
 const cellaDi=(x,y)=>{const G=K.M.G;return Math.max(0,Math.min(G-1,Math.floor(y)))*G+Math.max(0,Math.min(G-1,Math.floor(x)))};
 // lo stile delle case di ogni regno
 const STILE={val:{muro:'#e9dfc6',tetto:'#b0703c',t2:'#8a5a3a'},sel:{muro:'#8f7150',tetto:'#4f7a3a',t2:'#3f6a34'},fer:{muro:'#b9b3aa',tetto:'#566270',t2:'#465260'},mar:{muro:'#f6f1e4',tetto:'#2a9a98',t2:'#1f7f86'},alt:{muro:'#e6d8b8',tetto:'#c57a1c',t2:'#9a5a2c',tende:1},neu:{muro:'#d8ccb4',tetto:'#8a6a4a',t2:'#6e5540'}};
 function costruisci(s){const T=VenArte.T,M=VEN.mappaDi(s),G=M.G,A=VenArte;K.seme=s.seme;K.M=M;
  // mondo nuovo (s.geo===2): quota letta dalla mappa, tasselli a richiesta, acqua dei laghi e dei fiumi, vista lontana
  const geo2=!!(M.F&&M.LG&&M.PN);K.geo2=geo2;K.tess={};K.nTess=0;K.cvOk=0;K.gBordi=-1;K.nebbia=geo2&&!!VEN.opz(s).nebbia;
  if(!geo2&&K.mini){if(K.mini.parentNode)K.mini.parentNode.removeChild(K.mini);K.mini=null}
  const AF=geo2?(x,y)=>{const fx=Math.max(0,Math.min(G-1.001,x-.5)),fy=Math.max(0,Math.min(G-1.001,y-.5)),xi=Math.floor(fx),yi=Math.floor(fy),u=fx-xi,v=fy-yi,k=yi*G+xi,Q=M.A;return Q[k]*(1-u)*(1-v)+Q[k+1]*u*(1-v)+Q[k+G]*(1-u)*v+Q[k+G+1]*u*v}:(x,y)=>VEN.alt(s.seme,x,y);K.AF=AF;
  if(K.scene){K.scene.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
  K.piani=M.luoghi.map(l=>({x:l.x,y:l.y,h:Math.max(.3,quotaA(AF(l.x,l.y))),r:l.tipo==='citta'?3.9:l.tipo==='castello'?2.7:l.tipo==='porto'?2.6:2.3}));
  K.pianiG=[];{const q=G>>3;for(const f of K.piani)for(let cy=Math.max(0,(f.y-f.r)>>3);cy<=Math.min(q-1,(f.y+f.r)>>3);cy++)for(let cx=Math.max(0,(f.x-f.r)>>3);cx<=Math.min(q-1,(f.x+f.r)>>3);cx++)(K.pianiG[cy*q+cx]||(K.pianiG[cy*q+cx]=[])).push(f)}
  const sc=K.scene=new T.Scene();sc.background=new T.Color('#1d4f78');K.cam=A.camera();K.luce=A.luce(sc);
  const CC={},cl=h=>CC[h]||(CC[h]=new T.Color(h)),CM=new T.Color(),mix=(a,b,t)=>CM.copy(cl(a)).lerp(cl(b),Math.max(0,Math.min(1,t)));
  // ---- terreno a tasselli di 32×32 celle: in un mondo nuovo si costruiscono solo quelli vicini alla vista (K.gestisci), negli altri tutti subito ----
  const R=2,N=G*R,H=new Float32Array((N+1)*(N+1)),AL=new Float32Array((N+1)*(N+1));K.H=H;K.AL=AL;K.N=N;
  // laghi: livello dell'acqua per lago e fondo scavato (solo mondi nuovi)
  const LQ=[];if(geo2)for(let i=0;i<G*G;i++){const id=M.LG[i];if(id)LQ[id]=Math.max(LQ[id]||0,M.Q[i])}
  for(let id=0;id<LQ.length;id++)if(LQ[id]!=null)LQ[id]=Math.max(.3,quotaA(LQ[id]));
  const lago=(x,y)=>x>=0&&y>=0&&x<G&&y<G?M.LG[y*G+x]:0;
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=i/R,y=j/R,a=AF(x,y);AL[j*(N+1)+i]=a;let h=piano(x,y,quotaA(a));
   if(geo2){const cx=Math.floor(x),cy=Math.floor(y),id=lago(cx,cy);if(id&&(i%R||lago(cx-1,cy)===id)&&(j%R||lago(cx,cy-1)===id)&&(i%R||j%R||lago(cx-1,cy-1)===id))h=Math.min(h,LQ[id]-.4)}
   H[j*(N+1)+i]=h}
  const tinta=(cx,cy,a,h,pend)=>{const ci=cellaDi(cx,cy),b=M.B[ci],t=M.T[ci],n=hh(cx*3,cy*3,7),n2=vn(cx*.45,cy*.45,s.seme+5);
   if(geo2&&M.LG[ci])return mix('#d9c890','#2c6f86',.65+n*.2);
   if(a<VEN.MARE&&h<.02)return mix('#d9c890','#2c6f86',(VEN.MARE-a)*9);if(a<VEN.MARE+.012)return mix('#e8dba6','#d4c28a',n);
   let c;if(b===1)c=a<VEN.MARE+.05?mix('#a8b79c','#c9d6cf',n):mix('#e2eaf0','#c8d8e4',n*.9);else if(b===2)c=mix('#d9c463','#b7b25a',n2*1.5-.25);else if(b===3)c=mix('#c9b96a','#a9a85a',n2*1.6-.3+n*.1);else c=mix('#86b84e','#5f9a42',n2*1.7-.35+n*.15);
   if(t===2)c.lerp(cl(b===1?'#b9cbbf':b===2?'#8f9a4a':b===3?'#8f9550':'#4c8038'),.6);
   if(a>VEN.COLLE)c.lerp(cl(b===1?'#d2dde6':b===2?'#b79f62':b===3?'#b09a62':'#8e9a58'),Math.min(1,(a-VEN.COLLE)*9));
   if(a>VEN.MONTE-.02||pend>1.5)c.lerp(cl(n<.5?'#8d8782':'#77726e'),Math.min(1,Math.max((a-VEN.MONTE+.02)*14,(pend-1.5)*.9)));
   if(h>7.4||(b===1&&h>4.6))c.lerp(cl('#fbfdff'),Math.min(1,(h-(b===1?4.6:7.4))*.9));return c};
  // alberi e rocce: la forma, una volta sola
  const occ=new Uint8Array(G*G);for(const l of M.luoghi){const rg=l.tipo==='citta'?3:l.tipo==='villaggio'||l.tipo==='locanda'?1:2;for(let oy=-rg;oy<=rg;oy++)for(let ox=-rg;ox<=rg;ox++)if(ox*ox+oy*oy<=rg*rg+1)occ[cellaDi(l.x+ox,l.y+oy)]=1}
  const GEO={pino:A.Solidi().cil(.05,.07,.3,5,0,0,0,'#6b4a2e').cono(.34,.5,6,0,.22,0,'#3f7a3a',{c2:'#4f9247'}).cono(.26,.44,6,0,.52,0,'#478743',{c2:'#5aa14f'}).cono(.17,.38,6,0,.8,0,'#52964b',{c2:'#73b862'}).geo(),
   pinoN:A.Solidi().cil(.05,.07,.3,5,0,0,0,'#5a4030').cono(.34,.5,6,0,.22,0,'#3c6e52',{c2:'#dfeef2'}).cono(.26,.44,6,0,.52,0,'#4a7c5e',{c2:'#f2f8fa'}).cono(.17,.38,6,0,.8,0,'#cfe2e8',{c2:'#ffffff'}).geo(),
   lati:A.Solidi().cil(.06,.08,.34,5,0,0,0,'#6e4d30').sfera(.36,0,.62,0,'#5fa046').sfera(.27,.2,.86,.08,'#74b653').sfera(.24,-.2,.8,-.1,'#69aa4c').geo(),
   sasso:A.Solidi().sfera(.3,0,.12,0,'#9a948c').sfera(.2,.22,.08,.1,'#857f78').geo()};
  const d=new T.Object3D(),CH=32,NC=Math.ceil(G/CH),CB=16;
  // acqua dei mondi nuovi: laghi e mare restano d'acqua piatta, i fiumi sono nastri larghi quanto la portata, con il filo centrale più chiaro
  let Fmax=1;if(geo2)for(let i=0;i<G*G;i++)if(M.F[i]>Fmax)Fmax=M.F[i];
  const larg=f=>.16+.52*Math.min(1,Math.sqrt(f/Fmax));
  K.acqua=geo2?new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.9,depthWrite:false,side:T.DoubleSide}):null;
  const PONTI={};if(geo2)for(const p of M.P){const k=(Math.floor(p.y/CH))*NC+Math.floor(p.x/CH);(PONTI[k]||(PONTI[k]=[])).push(p)}
  // le stagioni (solo con s.anno): tinta del terreno, neve, laghi gelati. I colori di base restano in userData e si rifanno al cambio di stagione
  const STT={prim:[.95,1.1,.92],est:[1.15,1.05,.75],aut:[1.2,.85,.65],inv:[.8,.97,1.2]},NEVE=[.93,.96,.98],GHIACCIO=[.78,.9,.96];
  const stagTessera=gr=>{const st=K.stag;if(!st||!K.s)return;gr.userData.stag=st.k;for(const me of gr.children){const u=me.userData;if(!u.terreno&&!u.lago)continue;
    const c=me.geometry.attributes.color,p=me.geometry.attributes.position,b=u.base||(u.base=c.array.slice()),m=STT[st.k],n=c.count;
    for(let v=0;v<n;v++){const o=v*3;let r=b[o]*m[0],g=b[o+1]*m[1],bl=b[o+2]*m[2],w=0,X;
     if(u.terreno){const q=v-v%3;const cx=Math.floor(p.getX(q)+.1),cz=Math.floor(p.getZ(q)+.1);if(VEN.innevata(K.s,cz*K.M.G+cx)){w=.7;X=NEVE}}
     else{const q=v-v%6;const px=p.getX(q),pz=p.getZ(q);if(px===Math.floor(px)&&pz===Math.floor(pz)&&VEN.lagoGelato(K.s,pz*K.M.G+px)){w=.85;X=GHIACCIO}else{r=b[o];g=b[o+1];bl=b[o+2]}}
     if(w){r+=(X[0]-r)*w;g+=(X[1]-g)*w;bl+=(X[2]-bl)*w}
     c.array[o]=Math.min(2,r);c.array[o+1]=Math.min(2,g);c.array[o+2]=Math.min(2,bl)}
    c.needsUpdate=true}};
  K.stagTessera=stagTessera;
  K.stagSync=()=>{for(const k in K.tess){const g=K.tess[k];if(K.stag&&g.userData.stag!==K.stag.k)stagTessera(g)}};
  // fiocchi di neve: pochi punti che cadono solo sulle celle innevate vicino al fuoco, solo d'inverno
  const NF=140;
  function fiocchi(dt,on){let f=K.fiocchi;if(!on){if(f)f.visible=false;return}
   if(!f){const g=new T.BufferGeometry(),a=new Float32Array(NF*3);for(let i=0;i<NF;i++)a[i*3+1]=-99;g.setAttribute('position',new T.BufferAttribute(a,3));
    f=K.fiocchi=new T.Points(g,new T.PointsMaterial({color:0xffffff,size:.18,transparent:true,opacity:.85,depthWrite:false}));f.frustumCulled=false;sc.add(f)}
   f.visible=true;const a=f.geometry.attributes.position.array,Gd=K.M.G,R0=Math.min(14,K.alt*.9+4);
   for(let i=0;i<NF;i++){const o=i*3;a[o+1]-=dt*(1.2+(i%5)*.2);a[o]+=Math.sin(K.t+i)*dt*.2;
    if(a[o+1]<0){for(let t=0;t<4;t++){const x=K.fuoco.x+(Math.random()*2-1)*R0,z=K.fuoco.z+(Math.random()*2-1)*R0,cx=Math.floor(x),cz=Math.floor(z);
      if(cx>=0&&cz>=0&&cx<Gd&&cz<Gd&&VEN.innevata(K.s,cz*Gd+cx)){a[o]=x;a[o+1]=2+Math.random()*4;a[o+2]=z;break}}
     if(a[o+1]<0)a[o+1]=-99}}
   f.geometry.attributes.position.needsUpdate=true}
  K.fiocchiFn=fiocchi;K.fiocchi=null;K.STT=STT;
  // un tassello: terreno, strade, boschi e rocce, acqua, ponti e guadi, velo dell'ignoto. Restituisce un gruppo, da liberare con K.libera
  function tessera(ci,cj){const gr=new T.Group(),pos=[],col=[],x0t=ci*CH,y0t=cj*CH,x1t=Math.min(G,x0t+CH),y1t=Math.min(G,y0t+CH);
   for(let j=cj*CH*R;j<Math.min(N,(cj+1)*CH*R);j++)for(let i=ci*CH*R;i<Math.min(N,(ci+1)*CH*R);i++){const k=j*(N+1)+i,a4=(AL[k]+AL[k+1]+AL[k+N+1]+AL[k+N+2])/4;if(a4<VEN.MARE-.2)continue;
    const h0=H[k],h1=H[k+1],h2=H[k+N+1],h3=H[k+N+2],x0=i/R,x1=(i+1)/R,z0=j/R,z1=(j+1)/R,pend=(Math.max(h0,h1,h2,h3)-Math.min(h0,h1,h2,h3))*R,c=tinta(x0+.25,z0+.25,a4,(h0+h1+h2+h3)/4,pend),sc2=.96+hh(i,j,3)*.08;
    if((i+j)%2)pos.push(x0,h0,z0,x0,h2,z1,x1,h1,z0, x1,h1,z0,x0,h2,z1,x1,h3,z1);else pos.push(x0,h0,z0,x0,h2,z1,x1,h3,z1, x0,h0,z0,x1,h3,z1,x1,h1,z0);
    for(let v=0;v<6;v++){const q=v<3?1:sc2;col.push(c.r*q,c.g*q,c.b*q)}}
   if(pos.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();g.computeBoundingSphere();
    const me=new T.Mesh(g,A.mat);me.receiveShadow=true;me.castShadow=true;me.userData.terreno=1;gr.add(me);
    // velo dell'ignoto: la stessa forma, appena sopra, con la trama delle celle viste
    if(K.nebbia){const uv=[];for(let v=0;v<pos.length;v+=3)uv.push(pos[v]/G,pos[v+2]/G);const g2=new T.BufferGeometry();g2.setAttribute('position',g.attributes.position);g2.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g2.boundingSphere=g.boundingSphere;
     const ve=new T.Mesh(g2,K.velo);ve.position.y=.06;ve.renderOrder=3;gr.add(ve)}}
   // strade: nastri chiari che seguono il terreno
   {const S=A.Solidi();const nastro=(xa,ya,xb,yb)=>{const n=3;for(let k=0;k<n;k++){const ax=xa+(xb-xa)*k/n,ay=ya+(yb-ya)*k/n,bx=xa+(xb-xa)*(k+1)/n,by=ya+(yb-ya)*(k+1)/n,mx=(ax+bx)/2,my=(ay+by)/2;
      const l=Math.hypot(bx-ax,by-ay),ha=quota(ax,ay),hb=quota(bx,by);S.box(.2,.03,l*1.12,mx,(ha+hb)/2+.035,my,k%2?'#c9ac7c':'#bfa070',{ry:Math.atan2(bx-ax,by-ay),rx:-Math.atan2(hb-ha,l)})}};
    for(let y=y0t;y<y1t;y++)for(let x=x0t;x<x1t;x++){if(!M.S[y*G+x])continue;for(const[ox,oy]of[[1,0],[0,1],[1,1],[-1,1]]){const nx=x+ox,ny=y+oy;if(nx<0||ny>=G||nx>=G||!M.S[ny*G+nx])continue;
       if(ox&&oy&&(M.S[y*G+nx]||M.S[ny*G+x]))continue;nastro(x+.5,y+.5,nx+.5,ny+.5)}}
    if(S.n)gr.add(S.mesh({ombra:false}))}
   // boschi e rocce, a blocchi da 16 caselle con la loro sfera: in r128 le maglie a istanze nascono senza scarto fuori campo, va acceso a mano
   for(let cj2=cj*CH/CB;cj2<Math.min(G/CB,(cj+1)*CH/CB);cj2++)for(let ci2=ci*CH/CB;ci2<Math.min(G/CB,(ci+1)*CH/CB);ci2++){const lista={pino:[],pinoN:[],lati:[],sasso:[]},ox0=ci2*CB+CB/2,oz0=cj2*CB+CB/2;
    for(let y=Math.max(1,cj2*CB);y<Math.min(G-1,(cj2+1)*CB);y++)for(let x=Math.max(1,ci2*CB);x<Math.min(G-1,(ci2+1)*CB);x++){const i=y*G+x,t=M.T[i],b=M.B[i];if(occ[i]||t===0||(geo2&&(M.PN[i]||M.PN[i-1]||M.PN[i+1]||M.PN[i-G]||M.PN[i+G]||M.PN[i-G-1]||M.PN[i-G+1]||M.PN[i+G-1]||M.PN[i+G+1])))continue;
     const quanti=t===2?3:t===3?(hh(x,y,11)<.4?1:0):t===1?(hh(x,y,12)<(b===3?.03:.09)?1:0):0;
     for(let k=0;k<quanti;k++){const px=x+.14+hh(x*7+k,y*5,13)*.72,py=y+.14+hh(x*3,y*9+k,14)*.72;if(M.S[i]&&Math.abs(px-x-.5)<.3&&Math.abs(py-y-.5)<.3)continue;if(geo2&&M.F[i]>0&&Math.abs(px-x-.5)<.42&&Math.abs(py-y-.5)<.42)continue;const a=AF(px,py);if(a<VEN.MARE+.015||a>VEN.MONTE+.03)continue;
      const q=hh(x+k*31,y,15),tipo=b===1?'pinoN':b===2?(q<.3?'pino':'lati'):(q<.42?'pino':'lati'),sc0=(.8+hh(x,y*3+k,16)*.65)*(t===2?1.1:1);
      const tn=b===1?[1,1,1]:b===2?[1.02,.94,.62]:b===3?[.95,.9,.6]:[.85+q*.3,.9+hh(x,y+k,17)*.2,.8+q*.25];lista[tipo].push([px-ox0,quota(px,py)-.03,py-oz0,sc0,tn,hh(x,y+k*3,18)*6.28,b===2&&tipo==='pino'?1.5:1])}
     if(t===4||t===3){if(hh(x,y,19)<(t===4?.45:.18)){const px=x+hh(x,y,21),py=y+hh(x,y,22);lista.sasso.push([px-ox0,quota(px,py),py-oz0,.6+hh(x,y,23)*1.3,[1,1,1],hh(x,y,24)*6.28,1])}}}
    for(const nome of Object.keys(lista)){const Ls=lista[nome];if(!Ls.length)continue;const g=GEO[nome].clone();g.boundingSphere=new T.Sphere(new T.Vector3(0,3,0),CB*.8);const me=new T.InstancedMesh(g,A.matI,Ls.length);me.position.set(ox0,0,oz0);
     me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(Ls.length*3),3);
     Ls.forEach((p,k)=>{d.position.set(p[0],p[1],p[2]);d.rotation.set(0,p[5],0);d.scale.set(p[3],p[3]*p[6],p[3]);d.updateMatrix();me.setMatrixAt(k,d.matrix);me.instanceColor.setXYZ(k,p[4][0],p[4][1],p[4][2])});
     me.castShadow=true;me.receiveShadow=nome==='sasso';me.frustumCulled=true;gr.add(me)}}
   if(geo2){
    // laghi: una lastra piatta per cella, al livello del lago
    const wp=[],wc=[],ci0=new T.Color('#4aa0b4'),ci1=new T.Color('#3f93a8'),ce=new T.Color('#9bd6df');
    for(let y=y0t;y<y1t;y++)for(let x=x0t;x<x1t;x++){const id=M.LG[y*G+x];if(!id)continue;const h=LQ[id]-.03,c=(x+y)%2?ci0:ci1;
     wp.push(x,h,y,x,h,y+1,x+1,h,y, x+1,h,y,x,h,y+1,x+1,h,y+1);for(let v=0;v<6;v++)wc.push(c.r,c.g,c.b)}
    // fiumi: da ogni cella a quella a valle
    for(let y=y0t;y<y1t;y++)for(let x=x0t;x<x1t;x++){const i=y*G+x,f=M.F[i],dn=M.D[i];if(!(f>0)||dn<0||M.LG[i])continue;const bx=dn%G+.5,by=Math.floor(dn/G)+.5,ax=x+.5,ay=y+.5,dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,
      wa=larg(f)/2,wb=larg(M.F[dn]>0?M.F[dn]:f)/2,ha=quota(ax,ay)+.07,hb=quota(bx,by)+.07,
      P=[[ax+nx*wa,ha,ay+ny*wa,0],[ax,ha+.01,ay,1],[ax-nx*wa,ha,ay-ny*wa,0],[bx+nx*wb,hb,by+ny*wb,0],[bx,hb+.01,by,1],[bx-nx*wb,hb,by-ny*wb,0]];
     for(const t of[[0,1,3],[1,4,3],[1,2,4],[2,5,4]])for(const v of t){const p=P[v],c=p[3]?ce:ci0;wp.push(p[0],p[1],p[2]);wc.push(c.r,c.g,c.b)}}
    if(wp.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(wp,3));g.setAttribute('color',new T.Float32BufferAttribute(wc,3));g.computeBoundingSphere();const me=new T.Mesh(g,K.acqua);me.renderOrder=1;me.userData.lago=1;gr.add(me)}
    // ponti (legno o pietra) e guadi (sassi nel letto)
    const S=A.Solidi();for(const p of PONTI[cj*NC+ci]||[]){const dn=M.D[p.i],fx0=dn>=0?(dn%G+.5)-(p.i%G+.5):1,fy0=dn>=0?Math.floor(dn/G)+.5-(Math.floor(p.i/G)+.5):0,fl=Math.hypot(fx0,fy0)||1,fx=fx0/fl,fy=fy0/fl,px=-fy,py=fx,ry=Math.atan2(px,py),
      hy=Math.max(quota(p.x,p.y),quota(p.x+px*.9,p.y+py*.9),quota(p.x-px*.9,p.y-py*.9))+.08;
     if(M.luoghi.some(l=>(l.tipo==='citta'||l.tipo==='castello')&&Math.hypot(l.x-p.x,l.y-p.y)<(l.tipo==='citta'?2.4:1.4)))continue; // dentro le mura il ponte lo coprirebbe
     if(p.t==='guado'){for(let k=0;k<5;k++){const o=-.9+k*.45;S.sfera(.17,p.x+px*o,quota(p.x+px*o,p.y+py*o)+.03,p.y+py*o,k%2?'#9a948c':'#857f78')}continue}
     if(hh(p.i,3,77)<.5){S.box(.6,.12,2.0,p.x,hy,p.y,'#8a6a48',{ry});for(const o of[-.28,.28])S.box(.05,.22,2.0,p.x+fx*o,hy+.12,p.y+fy*o,'#6e4d30',{ry});for(const e of[-.95,.95])for(const o of[-.28,.28])S.box(.07,.34,.07,p.x+px*e+fx*o,hy,p.y+py*e+fy*o,'#5a4030')}
     else{S.box(.7,.18,2.0,p.x,hy-.04,p.y,'#b5aea3',{ry,c2:'#d6cfc2'});for(const o of[-.32,.32])S.box(.1,.24,2.0,p.x+fx*o,hy+.14,p.y+fy*o,'#c8c2b8',{ry,c2:'#e2dccf'});for(const e of[-1,1])S.box(.8,.5,.3,p.x+px*e,hy-.4,p.y+py*e,'#9c968c',{ry})}}
    // passi: un mucchio di sassi e un palo con la bandierina
    for(let y=y0t;y<y1t;y++)for(let x=x0t;x<x1t;x++){if(!M.PS[y*G+x]||(x+y)%3)continue;const px=x+.5,py=y+.5,h=quota(px,py);S.sfera(.2,px,h+.08,py,'#8d8782');S.sfera(.14,px+.12,h+.24,py,'#a39e97');S.box(.04,.7,.04,px-.12,h,py-.1,'#6e4d30');S.box(.2,.12,.02,px-.02,h+.56,py-.1,'#d9553f')}
    if(S.n)gr.add(S.mesh({ombra:false}))}
   stagTessera(gr);sc.add(gr);return gr}
  K.tessera=tessera;K.NC=NC;K.CH=CH;
  K.libera=gr=>{sc.remove(gr);gr.traverse(o=>{if(o.geometry)o.geometry.dispose()})};
  K.tess={};K.nTess=0;
  if(!geo2)for(let cj=0;cj<NC;cj++)for(let ci=0;ci<NC;ci++)tessera(ci,cj);
  // ---- mare: bande di colore per fondale, risacca che batte la riva, luccichii ----
  const TS=G*2,td=new Uint8Array(TS*TS*4);for(let j=0;j<TS;j++)for(let i=0;i<TS;i++){const a=AL[Math.min(N,j)*(N+1)+Math.min(N,i)],v=Math.max(0,Math.min(255,Math.round((a-VEN.MARE)*600+128)));td[(j*TS+i)*4]=v;td[(j*TS+i)*4+3]=255}
  const ta=new T.DataTexture(td,TS,TS,T.RGBAFormat);ta.minFilter=ta.magFilter=T.LinearFilter;ta.needsUpdate=true;
  K.mare=new T.ShaderMaterial({uniforms:{tA:{value:ta},t:{value:0},luce:{value:new T.Vector3(1,1,1)},G:{value:G}},
   vertexShader:'varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`precision highp float;varying vec3 vP;uniform sampler2D tA;uniform float t;uniform vec3 luce;uniform float G;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 uv=vP.xz/G;float d=.3;if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)d=(128.-texture2D(tA,uv).r*255.)/600.;d=max(d,0.);
 vec3 c=mix(vec3(.42,.83,.78),vec3(.16,.5,.66),smoothstep(0.,.045,d));c=mix(c,vec3(.09,.3,.5),smoothstep(.05,.19,d));
 float onda=sin(vP.x*1.7+t*.9)*.5+sin(vP.z*2.3-t*.7)*.5;c+=step(.93,onda*.5+.5)*.05;
 float ris=fract(d*30.-t*.22+h(floor(vP.xz*1.5))*.15);float riva=(1.-smoothstep(0.,.075,d));c=mix(c,vec3(1.),step(.72,ris)*riva*.85);c=mix(c,vec3(1.),step(d,.004)*.9);
 float sp=step(.992,h(floor(vP.xz*5.)+floor(t*1.6)));c+=sp*.5*(1.-riva);gl_FragColor=vec4(c*luce,1.);}`});
  const mare=new T.Mesh(new T.PlaneGeometry(G*3,G*3),K.mare);mare.rotation.x=-Math.PI/2;mare.position.set(G/2,0,G/2);sc.add(mare);
  // ---- mondo nuovo: la texture unica dell'intera mappa (vista lontana e mini-mappa) e il velo dell'ignoto ----
  if(geo2){const TX=G*2,cv=document.createElement('canvas');cv.width=cv.height=TX;K.cv=cv;K.cx=cv.getContext('2d');
   const base=new Uint8ClampedArray(TX*TX*4),COLT=[[42,104,138],[150,186,96],[84,134,70],[166,158,104],[128,124,120]],BIO={1:[232,238,242],2:[214,196,104],3:[196,182,108]};
   for(let py=0;py<TX;py++)for(let px=0;px<TX;px++){const i=(py>>1)*G+(px>>1),t=M.T[i];let c=COLT[t];if(t===1&&BIO[M.B[i]])c=BIO[M.B[i]];else if(t===2&&M.B[i]===1)c=[176,200,190];
    let q=1;if(M.LG[i])c=[74,160,180];else if(M.F[i]>0)c=[88,170,196];else if(M.S[i]&&t!==0)c=[201,172,124];else if(t!==0)q=.84+Math.min(.5,Math.max(0,M.A[i]-VEN.MARE))*.6;
    const o=(py*TX+px)*4;base[o]=Math.min(255,c[0]*q);base[o+1]=Math.min(255,c[1]*q);base[o+2]=Math.min(255,c[2]*q);base[o+3]=255}
   for(const p of M.P)for(let k=0;k<4;k++){const o=((Math.floor(p.y)*2+(k>>1))*TX+Math.floor(p.x)*2+(k&1))*4;base[o]=138;base[o+1]=96;base[o+2]=58}
   K.base=base;K.tex=new T.CanvasTexture(cv);K.tex.minFilter=K.tex.magFilter=T.LinearFilter;K.tex.generateMipmaps=false;
   K.far=new T.Mesh(new T.PlaneGeometry(G,G),new T.MeshBasicMaterial({map:K.tex}));K.far.rotation.x=-Math.PI/2;K.far.position.set(G/2,.15,G/2);K.far.visible=false;sc.add(K.far);
   K.visto=new Uint8Array(G*G);K.vistoVivo=0;
   if(K.nebbia){try{const z=localStorage.getItem('ven-visto-'+s.seme);if(z){const b=atob(z);for(let i=0;i<G*G;i++)if((b.charCodeAt(i>>3)||0)>>(i&7)&1)K.visto[i]=1}}catch(e){}
    K.fogD=new Uint8Array(G*G*4);for(let i=0;i<G*G;i++){const o=i*4;K.fogD[o]=18;K.fogD[o+1]=28;K.fogD[o+2]=44;K.fogD[o+3]=K.visto[i]?0:175}
    K.fogT=new T.DataTexture(K.fogD,G,G,T.RGBAFormat);K.fogT.minFilter=K.fogT.magFilter=T.LinearFilter;K.fogT.needsUpdate=true;
    K.velo=new T.MeshBasicMaterial({map:K.fogT,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})}}
  // ---- luoghi ----
  K.lu=[];const fin=A.Solidi(),SL=1.5;K.pale=[];K.camini=[];K.fuochi=[];
  for(const b of M.luoghi){const S=A.Solidi(),h0=quota(b.x,b.y),bio=M.B[cellaDi(b.x,b.y)],r=(k)=>hh(b.id*13+k,b.id*7,31),st=STILE[b.faz]||STILE.neu,muro=st.muro,tetto=st.tetto,p='#aaa49b',p2='#c8c2b8';
   const lume=(x,y,z,ry)=>fin.box(.1,.13,.03,b.x+x*SL,h0+y*SL,b.y+z*SL,'#ffd98a',{ry:ry||0});
   const casa=(x,z,w,dd,hc,ry,tc)=>{if(st.tende){S.cil(w*.62,w*.66,hc*.8,8,x,0,z,muro,{c2:'#fff7e0'});S.cono(w*.74,hc*.7,8,x,hc*.8,z,tc||tetto);S.box(.08,.14,.03,x+Math.sin(ry)*w*.64,0,z+Math.cos(ry)*w*.64,'#5a4030',{ry})}
     else{S.box(w,hc,dd,x,0,z,muro,{ry,c2:'#fff7e0'});S.tetto(w*1.16,hc*.9,dd*1.1,x,hc,z,tc||tetto,{ry});if(b.faz==='sel')S.box(w*1.02,.05,dd*1.02,x,hc*.5,z,'#5a4030',{ry})}
    if(bio===1)S.tetto(w*1.0,hc*.5,dd*1.12,x,hc+hc*.46,z,'#f4f8fa',{ry});
    lume(x+Math.sin(ry)*dd*.52,hc*.45,z+Math.cos(ry)*dd*.52,ry);if(r(x*9+z)<.6)K.camini.push([b.x+x*SL,h0+hc*1.7*SL,b.y+z*SL,b.id])};
   const campi=(n)=>{for(let k=0;k<n;k++){const an=r(k+40)*6.28,rd=1.25+r(k+50)*.7,fx=Math.cos(an)*rd,fz=Math.sin(an)*rd;if(altG(b.x+fx*SL,b.y+fz*SL)<VEN.MARE+.03)continue;const hf=(quota(b.x+fx*SL,b.y+fz*SL)-h0)/SL;
      for(let q=0;q<4;q++)S.box(.62,.04,.13,fx,hf+.02,fz+(q-1.5)*.15,[bio===2?'#e6c64e':'#b9c552','#8fae45','#d9b24a','#a6803e'][(q+k)%4],{ry:an})}};
   let alto=1.1;
   if(b.tipo==='villaggio'){for(let k=0;k<5;k++){const an=k*1.26+r(k)*.6,rd=.42+r(k+9)*.34;casa(Math.cos(an)*rd,Math.sin(an)*rd,.32+r(k+3)*.1,.3,.24+r(k+5)*.08,an+1.57)}
    S.cil(.09,.09,.1,7,0,0,0,'#9a948c');
    if(b.faz==='alt'){for(let k=0;k<4;k++)S.box(.05,.16,.5,-.9+k*.02,0,.4+k*.01,'#7a5a3a',{ry:k*1.57});S.box(.3,.2,.14,-.85,.02,.5,'#6e4a2e');S.box(.3,.2,.14,-.95,.02,.2,'#b89468')}
    else{S.cono(.14,.2,5,.2,0,.1,'#e0c45a');S.cono(.12,.17,5,-.9,0,.5,'#e0c45a');S.cil(.14,.2,.62,7,.95,0,-.35,muro,{c2:'#fff7e0'});S.cono(.22,.26,7,.95,.62,-.35,tetto);K.pale.push([b.x+.95*SL,h0+.6*SL,b.y+(-.35+.22)*SL]);campi(5)}}
   else if(b.tipo==='castello'){alto=2.1;S.cil(1.0,1.25,.3,9,0,-.3,0,'#8b8680');
    if(b.faz==='alt'||b.faz==='sel'){const lg='#7a5a3a';for(let k=0;k<14;k++){const an=k/14*6.283;S.box(.24,.7,.12,Math.cos(an)*.95,0,Math.sin(an)*.95,lg,{ry:-an+1.5708,c2:'#9a7a52'})}
     S.box(.7,.6,.7,0,0,0,b.faz==='alt'?'#e6d8b8':'#8f7150');S.tetto(.86,.5,.8,0,.6,0,'#ffffff');S.box(.3,.9,.3,.5,0,-.4,lg);S.cono(.28,.3,4,.5,.9,-.4,'#ffffff',{ry:.785})}
    else{S.box(.8,.9,.8,0,0,0,p,{c2:p2});for(let k=0;k<4;k++){const ox=(k%2?1:-1)*.36,oz=(k<2?1:-1)*.36;S.box(.14,.12,.14,ox,.9,oz,p2)}
     S.box(.5,.5,.5,0,.9,0,p,{c2:p2});S.tetto(.6,.36,.56,0,1.4,0,'#ffffff');
     for(let k=0;k<4;k++){const ox=(k%2?1:-1)*.78,oz=(k<2?1:-1)*.78;S.cil(.2,.23,1.0,8,ox,0,oz,p,{c2:p2});S.cono(.28,.36,8,ox,1.0,oz,'#ffffff')}
     for(let k=0;k<4;k++){const ry=k*Math.PI/2;S.box(1.56,.6,.12,Math.sin(ry)*.78,0,Math.cos(ry)*.78,p,{ry,c2:p2})}S.box(.3,.42,.16,0,0,.8,'#5a4030')}
    lume(-.15,.55,.41);lume(.15,.55,.41);lume(0,1.15,.26)}
   else if(b.tipo==='citta'){alto=2.5;const pm=b.faz==='mar'?'#e8e2d2':b.faz==='alt'?'#b89468':'#b5aea3',pm2=b.faz==='mar'?'#fbf7ec':b.faz==='alt'?'#d2b488':'#d6cfc2',RC=1.55;S.cil(RC+.25,RC+.5,.24,12,0,-.24,0,'#9c968c');
    for(let k=0;k<10;k++){const an=k/10*6.283,nx=Math.cos(an),nz=Math.sin(an);if(k!==2)S.box(1.0,.5,.12,nx*RC,0,nz*RC,pm,{ry:-an+1.5708,c2:pm2});const a2=an+.314;S.cil(.15,.17,.76,7,Math.cos(a2)*RC*1.03,0,Math.sin(a2)*RC*1.03,pm,{c2:pm2});S.cono(.2,.26,7,Math.cos(a2)*RC*1.03,.76,Math.sin(a2)*RC*1.03,'#ffffff')}
    const TC=[tetto,st.t2,tetto,'#9a4a3a'];for(let k=0;k<17;k++){const an=r(k)*6.283,rd=.25+Math.sqrt(r(k+20))*1.05;casa(Math.cos(an)*rd,Math.sin(an)*rd,.26+r(k+3)*.12,.26,.26+r(k+6)*.2,r(k+8)*3,TC[k%4])}
    if(b.faz==='mar'){S.box(.5,.8,.5,0,0,0,pm2);S.sfera(.3,0,.9,0,'#ffffff');S.box(.2,1.5,.2,.5,0,-.3,pm2);S.sfera(.14,.5,1.56,-.3,'#ffffff')}
    else if(b.faz==='alt'){S.cil(.5,.54,.6,10,0,0,0,'#e6d8b8');S.cono(.62,.6,10,0,.6,0,'#ffffff');S.box(.06,1.4,.06,.6,0,-.2,'#6b4a2c')}
    else{S.box(.42,1.0,.6,0,0,0,pm2,{c2:'#fffaf0'});S.tetto(.5,.4,.66,0,1.0,0,st.t2);S.box(.26,1.7,.26,0,0,-.42,pm2);S.cono(.24,.6,4,0,1.7,-.42,'#ffffff',{ry:.785})}
    for(let k=0;k<3;k++)S.box(.2,.14,.16,.5+k*.26,0,.62,['#c94a3a','#3a78c9','#e0b83a'][k]);lume(0,.6,.31);lume(0,1.3,-.28)}
   else if(b.tipo==='porto'){alto=1.6;let ax=0,az=1;for(const[ox,oz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])if(M.T[cellaDi(b.x+ox*2,b.y+oz*2)]===0){ax=ox;az=oz;break}
    const ln=Math.hypot(ax,az),ux=ax/ln,uz=az/ln,ry=Math.atan2(ux,uz);for(let k=0;k<6;k++){const an=ry+3.14+(k-2.5)*.5,rd=.5+r(k)*.4;casa(Math.sin(an)*rd,Math.cos(an)*rd,.3+r(k+3)*.1,.28,.26+r(k+5)*.1,an)}
    for(const off of[-.4,.4]){S.box(.22,.08,2.0,ux*1.5-uz*off,-.14,uz*1.5+ux*off,'#8a6a48',{ry});for(let k=0;k<3;k++)S.box(.07,.3,.07,ux*(1+k*.5)-uz*off,-.34,uz*(1+k*.5)+ux*off,'#5a4030')}
    S.box(.36,.14,.9,ux*2.3-uz*.9,-.2,uz*2.3+ux*.9,'#7a5230',{ry});S.box(.05,.8,.05,ux*2.3-uz*.9,-.1,uz*2.3+ux*.9,'#5a4030');S.box(.04,.5,.5,ux*2.3-uz*.9,.14,uz*2.3+ux*.9,'#f4f0e2',{ry});
    S.box(.3,.12,.7,ux*2.0+uz*1.0,-.2,uz*2.0-ux*1.0,'#8a5a34',{ry:ry+.4});
    S.cil(.16,.22,1.1,8,-uz*1.1+ux*.6,0,ux*1.1+uz*.6,'#f4f0e2',{c2:'#ffffff'});S.cono(.2,.24,8,-uz*1.1+ux*.6,1.1,ux*1.1+uz*.6,'#ffffff');lume(-uz*1.1+ux*.6,1.0,ux*1.1+uz*.6+.16);S.box(.3,.16,.2,.2,0,-.2,'#c9b48a');S.box(.2,.2,.2,-.3,0,.2,'#8a6a48')}
   else if(b.tipo==='monastero'){alto=1.9;S.box(.6,.7,1.1,0,0,0,'#e6dcc4',{c2:'#fff8e6'});S.tetto(.7,.5,1.2,0,.7,0,'#8a4a3a');S.box(.34,1.5,.34,0,0,-.72,'#e6dcc4',{c2:'#fff8e6'});S.cono(.3,.5,4,0,1.5,-.72,'#8a4a3a',{ry:.785});S.box(.04,.26,.04,0,2.0,-.72,'#e8c35a');S.box(.16,.04,.04,0,2.14,-.72,'#e8c35a');
    for(let k=0;k<4;k++){const ry=k*Math.PI/2;S.box(1.9,.3,.1,Math.sin(ry)*.95,0,Math.cos(ry)*.95+.2,'#cfc6b0',{ry})}S.box(.5,.4,.4,.55,0,.5,'#e6dcc4');S.tetto(.6,.3,.46,.55,.4,.5,'#8a4a3a');
    for(let k=0;k<6;k++)S.sfera(.1,-.6+(k%3)*.22,.1,.5+Math.floor(k/3)*.26,'#5fa046');lume(0,.4,.56);lume(.31,.35,0,1.57);lume(0,1.1,-.54)}
   else if(b.tipo==='locanda'){alto=1.4;S.box(.9,.5,.6,0,0,0,'#e9dfc6',{c2:'#fff7e0'});S.box(.92,.06,.62,0,.5,0,'#5a4030');S.box(.9,.36,.6,0,.56,0,'#d9c9a6');S.tetto(1.04,.5,.7,0,.92,0,'#a8502e',{ry:1.5708});S.box(.14,.5,.14,.3,1.1,0,'#8b8680');K.camini.push([b.x+.3*SL,h0+1.7*SL,b.y,b.id]);
    S.box(.5,.34,.4,-.8,0,.3,'#8a6a48');S.tetto(.6,.24,.46,-.8,.34,.3,'#6e5540');S.box(.05,.7,.05,.6,0,.5,'#5a4030');S.box(.3,.2,.04,.6,.5,.5,'#e0b83a');S.box(.4,.16,.24,.2,0,.7,'#8a6a48');S.cil(.1,.1,.06,7,.06,.02,.7,'#5a4030',{rz:1.57});S.cil(.1,.1,.06,7,.34,.02,.7,'#5a4030',{rz:1.57});
    lume(-.2,.26,.31);lume(.2,.26,.31);lume(0,.74,.31);lume(-.46,.3,0,1.57)}
   else if(b.tipo==='rovine'){alto=1.5;const pr='#b8b2a4',pr2='#d8d2c2';S.cil(1.0,1.1,.1,10,0,-.04,0,'#9c968a');for(let k=0;k<8;k++){const an=k/8*6.283,hc=.3+r(k)*1.0;S.cil(.1,.12,hc,6,Math.cos(an)*.8,0,Math.sin(an)*.8,pr,{c2:pr2,rz:r(k+5)<.25?.3:0})}
    S.box(.7,.1,.14,0,1.2,-.8,pr2);S.box(.14,1.2,.14,-.3,0,-.8,pr);S.box(.14,1.2,.14,.3,0,-.8,pr);S.box(.5,.2,.4,.2,0,.1,pr,{ry:.5});S.box(.3,.14,.3,-.4,0,.3,pr2,{ry:1.1});S.box(.24,.3,.24,0,0,0,'#6e7a5a');S.sfera(.12,0,.42,0,'#9fe0c8')}
   else if(b.tipo==='covo'){alto=1.4;const lg='#6a4a2e';for(let k=0;k<16;k++){if(k===4)continue;const an=k/16*6.283;S.cono(.1,.7+r(k)*.2,5,Math.cos(an)*1.0,0,Math.sin(an)*1.0,lg)}
    for(let k=0;k<4;k++){const an=k*1.6+.5,rd=.5;S.cono(.26,.4,5,Math.cos(an)*rd,0,Math.sin(an)*rd,['#7a6a52','#5a5048','#8a5a3a','#6a6a4a'][k])}S.box(.05,1.3,.05,0,0,0,lg);S.box(.3,.2,.03,.16,1.0,0,'#3a3230');S.sfera(.09,0,1.36,0,'#e8e2d2');
    S.cil(.14,.16,.06,6,.3,0,.3,'#4a4038');K.fuochi.push([b.x+.3*SL,h0+.1*SL,b.y+.3*SL,b.id])}
   const me=S.mesh();me.position.set(b.x,h0,b.y);me.scale.setScalar(SL);sc.add(me);
   K.lu.push({id:b.id,me,h0,x:b.x,y:b.y,tipo:b.tipo,faz:null,alto:alto*SL})}
  K.fin=new T.Mesh(fin.geo(),new T.MeshBasicMaterial({vertexColors:true}));K.fin.visible=false;K.fin.frustumCulled=false;sc.add(K.fin);
  // pale dei mulini
  {const S=A.Solidi();for(let k=0;k<4;k++)S.box(.07,.5,.02,0,0,0,'#efe6cf',{rz:k*Math.PI/2});K.palaGeo=S.geo();K.palaMe=K.pale.map(p=>{const m=new T.Mesh(K.palaGeo,A.mat);m.position.set(p[0],p[1],p[2]);m.scale.setScalar(SL);sc.add(m);return m})}
  // nuvole: non si vedono, fanno solo ombra
  {const S=A.Solidi();S.sfera(2.6,0,0,0,'#fff',{sy:.3});S.sfera(2,2.2,0,.6,'#fff',{sy:.3});S.sfera(1.7,-2,0,-.8,'#fff',{sy:.3});const gm=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
   K.nuvole=[];for(let k=0;k<26;k++){const m=new T.Mesh(S.geo(),gm);m.castShadow=true;m.position.set(hh(k,1,40)*G,26,hh(k,2,41)*G);m.scale.setScalar(.8+hh(k,3,42)*1.2);m.userData.v=.5+hh(k,4,43)*.5;sc.add(m);K.nuvole.push(m)}}
  // parti vive
  K.fig=A.Schiera(sc,140);K.ste=A.Stendardi(sc,80);K.par=A.Particelle(sc,340);K.P={};
  K.lumi=[0,1,2,3].map(()=>{const p=new T.PointLight('#ffb45a',0,5,2);sc.add(p);return p});
  K.anello=new T.Mesh(new T.RingGeometry(.2,.3,20),new T.MeshBasicMaterial({color:'#fff2b0',transparent:true,opacity:.9,depthTest:false}));K.anello.rotation.x=-Math.PI/2;K.anello.visible=false;K.anello.renderOrder=5;sc.add(K.anello);
  K.orme=new T.InstancedMesh(new T.BoxGeometry(.09,.02,.09),new T.MeshBasicMaterial({color:'#fff2b0',depthTest:false}),60);K.orme.count=0;K.orme.frustumCulled=false;K.orme.renderOrder=4;sc.add(K.orme);
  const tu=VEN.TU(s);K.fuoco.x=tu.x;K.fuoco.z=tu.y;K.fuoco.y=quota(tu.x,tu.y);K.segue=true}
 // ---- mondo nuovo: tasselli vivi, confini, velo dell'ignoto, mini-mappa ----
 const LONT=34,MAXT=25;
 // si tengono solo i tasselli attorno alla vista (al massimo 25, i più vicini) e se ne costruiscono 2 per fotogramma; da lontano resta la texture unica
 function gestisci(){const CH=K.CH,NC=K.NC,G=K.M.G;K.nuovi=0;K.lontano=K.alt>LONT;K.far.visible=K.lontano;
  if(K.lontano){for(const k in K.tess)K.tess[k].visible=false;return}
  const asp=aspetto(),vx=K.alt*asp+CH*.7,vz=K.alt*1.3+CH*.7,fx=K.fuoco.x,fz=K.fuoco.z,c0=Math.max(0,Math.floor((fx-vx)/CH)),c1=Math.min(NC-1,Math.floor((fx+vx)/CH)),r0=Math.max(0,Math.floor((fz-vz)/CH)),r1=Math.min(NC-1,Math.floor((fz+vz)/CH)),w=[];
  for(let cj=r0;cj<=r1;cj++)for(let ci=c0;ci<=c1;ci++){const dx=(ci+.5)*CH-fx,dz=(cj+.5)*CH-fz;w.push([dx*dx+dz*dz,ci,cj])}
  w.sort((a,b)=>a[0]-b[0]);w.length=Math.min(w.length,MAXT);const vol={};for(const t of w)vol[t[2]*NC+t[1]]=1;
  for(const k in K.tess){if(vol[k])K.tess[k].visible=true;else{K.libera(K.tess[k]);delete K.tess[k];K.nTess--}}
  for(const t of w){if(K.nuovi>=2)break;const k=t[2]*NC+t[1];if(K.tess[k])continue;K.tess[k]=K.tessera(t[1],t[2]);K.nTess++;K.nuovi++}
  return G}
 // confini: ogni cella di terra va al regno del luogo abitato più vicino (rifatto una volta al giorno di gioco)
 function confini(s){const M=K.M,G=M.G,L=s.l.filter(l=>l.tipo==='citta'||l.tipo==='castello'||l.tipo==='villaggio'||l.tipo==='porto'),fz=[],own=new Uint8Array(G*G);
  for(const l of L){if(l.faz!=='neu'&&!fz.includes(l.faz))fz.push(l.faz)}
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=y*G+x;if(M.T[i]===0||M.LG[i])continue;let m=1e9,f=null;for(const l of L){const dx=l.x-x-.5,dy=l.y-y-.5,d=dx*dx+dy*dy;if(d<m){m=d;f=l.faz}}own[i]=f==='neu'||f==null?0:fz.indexOf(f)+1}
  const hex=h=>{const n=parseInt(String(h).replace('#','').slice(0,6),16)||0;return[n>>16&255,n>>8&255,n&255]};
  K.own=own;K.ownCol=[null].concat(fz.map(f=>hex(VEN.colFaz(s,f).col)))}
 // rifà la texture unica: la base, il velo dell'ignoto e i confini a tratteggio col colore di ciascun regno
 function ridisegna(){const TX=K.cv.width,G=K.M.G,out=K.cx.createImageData(TX,TX),d=out.data;d.set(K.base);
  if(K.nebbia)for(let py=0;py<TX;py++)for(let px=0;px<TX;px++){if(K.visto[(py>>1)*G+(px>>1)])continue;const o=(py*TX+px)*4;d[o]=d[o]*.25+14;d[o+1]=d[o+1]*.25+20;d[o+2]=d[o+2]*.25+32}
  const pt=(x,y,c)=>{const o=(y*TX+x)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2]};
  if(K.own)for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=y*G+x,a=K.own[i];if(!a||(K.nebbia&&!K.visto[i])||(x+y)%3===2)continue;
   if(x+1<G&&K.own[i+1]&&K.own[i+1]!==a){pt(2*x+1,2*y,K.ownCol[a]);pt(2*x+1,2*y+1,K.ownCol[a]);pt(2*x+2,2*y,K.ownCol[K.own[i+1]]);pt(2*x+2,2*y+1,K.ownCol[K.own[i+1]])}
   if(y+1<G&&K.own[i+G]&&K.own[i+G]!==a){pt(2*x,2*y+1,K.ownCol[a]);pt(2*x+1,2*y+1,K.ownCol[a]);pt(2*x,2*y+2,K.ownCol[K.own[i+G]]);pt(2*x+1,2*y+2,K.ownCol[K.own[i+G]])}}
  K.cx.putImageData(out,0,0);K.tex.needsUpdate=true;K.cvOk=1}
 // le celle viste (il raggio cresce con l'esplorazione); si ricordano per telefono, un bit per cella
 function esplora(dt,s){K.tEsp=(K.tEsp||0)-dt;if(K.tEsp>0)return;K.tEsp=.25;const tu=VEN.TU(s),G=K.M.G,r=Math.max(6,Math.min(24,(VEN.vista?VEN.vista(s):8)*1.2)),cx=Math.floor(tu.x),cy=Math.floor(tu.y);let n=0;
  for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(G-1,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(G-1,Math.ceil(cx+r));x++){const i=y*G+x;if(K.visto[i]||(x-cx)*(x-cx)+(y-cy)*(y-cy)>r*r)continue;K.visto[i]=1;K.fogD[i*4+3]=0;n++}
  if(n){K.fogT.needsUpdate=true;K.sporco=1;K.salva=1;K.sSeme=s.seme}}
 // si salva solo al cambio di giorno e quando la pagina si nasconde, non a ogni passo
 function salvaVisto(){if(!K.salva||!K.visto||!K.M)return;K.salva=0;const G=K.M.G;try{const b=new Uint8Array(G*G+7>>3);for(let i=0;i<G*G;i++)if(K.visto[i])b[i>>3]|=1<<(i&7);let z='';for(let i=0;i<b.length;i++)z+=String.fromCharCode(b[i]);localStorage.setItem('ven-visto-'+K.sSeme,btoa(z))}catch(e){}}
 if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(document.hidden)salvaVisto()});window.addEventListener('pagehide',salvaVisto)}
 // bussola e mini-mappa nell'angolo: la stessa texture, il riquadro della vista, la compagnia; un tocco porta lo sguardo lì
 function mini(dt,s){const host=document.querySelector('.vn-etc'),par=host&&host.parentNode;if(!par)return;
  if(!K.mini||K.mini.dataset.seme!==String(s.seme)){if(K.mini&&K.mini.parentNode)K.mini.parentNode.removeChild(K.mini);const c=document.createElement('canvas');c.width=c.height=144;c.className='vn-mini';c.dataset.seme=s.seme;c.setAttribute('aria-label','Mini-mappa: tocca per andare lì');
   c.style.cssText='position:absolute;right:8px;top:calc(122px + env(safe-area-inset-top,0px));width:72px;height:72px;border:2px solid #1a120a;border-radius:6px;box-shadow:0 0 0 1px #b8883c;pointer-events:auto;touch-action:none;z-index:6;background:#1d4f78';
   const vai=e=>{e.stopPropagation();e.preventDefault();const r=c.getBoundingClientRect(),G=K.M.G;guarda(Math.max(0,Math.min(G,(e.clientX-r.left)/r.width*G)),Math.max(0,Math.min(G,(e.clientY-r.top)/r.height*G)))};
   c.addEventListener('pointerdown',vai);c.addEventListener('click',e=>e.stopPropagation());K.mini=c}
  if(!K.mini.isConnected)par.appendChild(K.mini);K.tMini=(K.tMini||0)-dt;if(K.tMini>0||!K.cvOk)return;K.tMini=.4;
  const c=K.mini,x=c.getContext('2d'),W=c.width,G=K.M.G,k=W/G,tu=VEN.TU(s),asp=aspetto(),me=K.P[0]||tu;x.imageSmoothingEnabled=true;x.drawImage(K.cv,0,0,W,W);
  x.strokeStyle='#fff';x.lineWidth=2;x.strokeRect((K.fuoco.x-K.alt*asp)*k,(K.fuoco.z-K.alt/SEN)*k,K.alt*asp*2*k,K.alt/SEN*2*k);
  x.fillStyle='#d98a1f';x.beginPath();x.arc(me.x*k,me.y*k,5,0,6.283);x.fill();x.stroke();
  x.fillStyle='rgba(20,14,8,.7)';x.beginPath();x.arc(16,18,13,0,6.283);x.fill();x.fillStyle='#f4e9c8';x.beginPath();x.moveTo(16,6);x.lineTo(21,19);x.lineTo(11,19);x.fill();x.font='800 12px sans-serif';x.textAlign='center';x.fillText('N',16,32)}
 function vistaGrande(dt,s,L,lm){gestisci();const nt=L.notte,r=lm*(1-nt*.25),g=lm*(1-nt*.1),b=Math.min(1,lm+nt*.1);K.acqua.color.setRGB(r,g,b);K.far.material.color.setRGB(r,g,b);
  const sg=s.anno!=null?VEN.stagione(s):null,sk=sg?sg.k:'';if(K.stagK!==sk){K.stagK=sk;K.stag=sg;}
  K.stagSync();
  K.fiocchiFn(dt,!!sg&&sg.k==='inv'&&!K.lontano);
  if(sg){const m=K.STT[sg.k];K.far.material.color.multiply((K.cStag||(K.cStag=new VenArte.T.Color())).setRGB(m[0],m[1],m[2]))}
  const gi=VEN.giorno(s);if(K.gBordi!==gi){K.gBordi=gi;confini(s);K.sporco=1;salvaVisto()}
  if(K.nebbia)esplora(dt,s);
  if(K.sporco&&(!K.cvOk||K.t-K.tUlt>.5)){K.sporco=0;K.tUlt=K.t;ridisegna()}
  mini(dt,s)}
 // tinge i tetti bianchi (stendardo di pietra) col colore di chi tiene il luogo
 function colora(l,lu){if(lu.faz===l.faz)return;const T=VenArte.T,c=lu.me.geometry.attributes.color,base=lu.base||(lu.base=c.array.slice()),k=new T.Color(VEN.colFaz(K.s,l.faz).col);
  for(let i=0;i<c.count;i++){const r=base[i*3],g=base[i*3+1],b=base[i*3+2];if(r>.97&&g>.97&&b>.97)c.setXYZ(i,k.r,k.g,k.b);else c.setXYZ(i,r,g,b)}c.needsUpdate=true;lu.faz=l.faz}
 function apri(s){K.s=s;if(K.seme!==s.seme||!K.scene)costruisci(s);return true}
 // l'aspetto di chi guida una compagnia e del suo seguito: si vede di che truppe è fatta
 function seguito(p){const L=[];for(const e of p.tr){const T=VDAT.TR[e.t];if(T&&!T.capo)L.push([e.t,e.n-(e.f||0)])}L.sort((a,b)=>VDAT.TR[b[0]].t*100+b[1]-VDAT.TR[a[0]].t*100-a[1]);return L}
 // un fotogramma: aggiorna le parti vive e disegna
 function passo(dt,s){if(!K.scene)return;const T=VenArte.T,A=VenArte,tu=VEN.TU(s);K.t+=dt;const h=(s.t%1440)/60;K.s=s;
  // compagnie visibili (più la tua), con posizione ammorbidita
  const vis=VEN.visibili(s).slice();if(!s.prigioniero)vis.unshift(tu);const visti={};K.fig.inizio();K.ste.inizio();const etc=[];
  for(const p of vis){let q=K.P[p.id];if(!q||Math.abs(q.x-p.x)+Math.abs(q.y-p.y)>3)q=K.P[p.id]={x:p.x,y:p.y,yaw:0,f:0};visti[p.id]=1;
   const dx=p.x-q.x,dy=p.y-q.y,dl=Math.hypot(dx,dy),k=Math.min(1,dt*9);q.x+=dx*k;q.y+=dy*k;const fermo=dl<.004;if(!fermo){const ya=Math.atan2(dx,dy);let da=ya-q.yaw;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;q.yaw+=da*Math.min(1,dt*8);q.f+=dt*(p.k==='car'?1.4:2.2)}
   const F=Object.assign({},VEN.rg(s,p.id===0?VEN.lato(s):p.faz),VEN.colFaz(s,p.id===0?VEN.lato(s):p.faz)),n=VEN.uomini(p),S=seguito(p),hq=quota(q.x,q.y),col=p.id===0?VEN.colFaz(s,'tu').col:F.col,sn=Math.sin(q.yaw),cs=Math.cos(q.yaw);
   // chi guida: il tuo capitano con quello che ha addosso; un signore, un capobanda o la rivale col loro aspetto
   const capo=p.tr.find(e=>VDAT.TR[e.t]&&VDAT.TR[e.t].capo);let asp,cav;
   if(p.id===0){const st=VEN.statCap(s.cap);asp=st.asp;cav=st.cavallo}else if(capo){asp=VDAT.aspetto(capo.t);cav=p.k==='riv'}else if(p.k==='sig'){asp=Object.assign({},VDAT.aspetto(p.faz+'_c4'),{mant:1});cav=true}else{asp=S.length?VDAT.aspetto(S[0][0]):{};cav=S.length>0&&VDAT.TR[S[0][0]].c==='c'}
   if(p.k!=='car')K.fig.metti({x:q.x,y:hq,z:q.y,yaw:q.yaw,sc:p.id===0?.54:.48,col,col2:F.col2,asp,cav,fase:fermo?0:q.f,seme:p.id});
   const seg=Math.min(6,Math.ceil(n/8));for(let j=0;j<seg;j++){const tid=S.length?S[j%S.length][0]:null,ox=((j%2)?.3:-.3)*(1+Math.floor(j/2)*.5),oz=-.42-Math.floor(j/2)*.34,fx=q.x+cs*ox+sn*oz,fy=q.y-sn*ox+cs*oz;
    K.fig.metti({x:fx,y:quota(fx,fy),z:fy,yaw:q.yaw,sc:.35,col,col2:F.col2,asp:tid?VDAT.aspetto(tid):{},cav:tid?VDAT.TR[tid].c==='c':false,fase:fermo?0:q.f+j*.37,seme:p.id+j})}
   if(p.k==='car'){K.fig.metti({x:q.x,y:hq,z:q.y,yaw:q.yaw,sc:.36,col:'#c9b48a',asp:{elmo:'paglia',arma:'lancia'},cav:true,fase:fermo?0:q.f+.5,seme:p.id+3})}
   else K.ste.metti(q.x-cs*.16,hq,q.y+sn*.16,col,p.id===0?.58:.5,K.t,p.id);
   if(!fermo&&Math.random()<dt*5&&K.M.T[cellaDi(q.x,q.y)]===1)K.par.emetti(q.x,hq+.03,q.y,{vy:.25,s:.08,dur:.7,col:'#d8c8a4',cresce:1.2});
   etc.push({id:'p'+p.id,x:q.x,y:hq+(cav?1.7:1.4),z:q.y,tx:p.id===0?'':p.nome,n,cls:p.id===0?'tu':VEN.ostile(s,p,tu)?'nem':p.k==='sig'?'sig':p.k==='riv'?'riv':'neu',col})}
  for(const id of Object.keys(K.P))if(!visti[id])delete K.P[id];
  K.fig.fine();K.ste.fine();
  // luoghi: colori, fumo, assedi, saccheggi; rovine e covi solo se scoperti
  const g=VEN.giorno(s),vx=K.alt*1.2,vz=K.alt*1.7;
  for(const lu of K.lu){const l=s.l[lu.id],noto=l.noto!==false;if(lu.me.visible!==noto)lu.me.visible=noto;if(!noto)continue;if(Math.abs(lu.x-K.fuoco.x)>vx||Math.abs(lu.y-K.fuoco.z)>vz)continue;colora(l,lu);
   if(l.sacc>g&&Math.random()<dt*7)K.par.emetti(lu.x+(Math.random()-.5)*.8,lu.h0+.3,lu.y+(Math.random()-.5)*.8,{vy:.7,vx:.15,s:.2,dur:2.4,col:'#3a3432',col2:'#857c76',cresce:1.4});
   if((l.ass||(s.assedio&&s.assedio.lid===l.id))&&Math.random()<dt*6)K.par.emetti(lu.x+(Math.random()-.5)*1.6,lu.h0+.5,lu.y+(Math.random()-.5)*1.6,{vy:.9,s:.16,dur:1.6,col:'#ff8a3a',col2:'#4a403c',cresce:1.6});
   const vuoto=VEN.SITO[l.tipo]&&!l.g.length;
   etc.push({id:'l'+l.id,x:lu.x,y:lu.h0+lu.alto,z:lu.y,tx:l.nome,cls:'luogo '+l.tipo+(l.ass?' ass':'')+(l.faz==='tu'||l.sig===-2?' mio':'')+(vuoto?' vuoto':''),col:VEN.colFaz(s,l.faz).col,luogo:1})}
  for(const c of K.camini){if(Math.abs(c[0]-K.fuoco.x)<vx&&Math.abs(c[2]-K.fuoco.z)<vz&&Math.random()<dt*.9&&!(s.l[c[3]].sacc>g))K.par.emetti(c[0],c[1],c[2],{vy:.32,vx:.1,s:.07,dur:2.6,col:'#e8e4dc',col2:'#bdb8b0',cresce:1.5})}
  for(const c of K.fuochi){const l=s.l[c[3]];if(l.noto!==false&&l.g.length&&Math.abs(c[0]-K.fuoco.x)<vx&&Math.abs(c[2]-K.fuoco.z)<vz&&Math.random()<dt*9)K.par.emetti(c[0]+(Math.random()-.5)*.1,c[1],c[2]+(Math.random()-.5)*.1,{vy:.7,s:.1,dur:.7,col:'#ffd45a',col2:'#e0481c'})}
  for(const sc of s.scontri){if(Math.random()<dt*10)K.par.emetti(sc.x+(Math.random()-.5)*.6,quota(sc.x,sc.y)+.1,sc.y+(Math.random()-.5)*.6,{vy:.5,s:.13,dur:.9,col:'#d9c9a6',cresce:1.2});etc.push({id:'s'+sc.id,x:sc.x,y:quota(sc.x,sc.y)+1,z:sc.y,tx:'Battaglia',cls:'scontro'})}
  // pioggia: stille che cadono attorno allo sguardo
  if(s.meteo==='pioggia')for(let k=0;k<Math.min(8,Math.ceil(dt*220));k++)K.par.emetti(K.fuoco.x+(Math.random()-.5)*K.alt*.9,K.fuoco.y+5+Math.random()*3,K.fuoco.z+(Math.random()-.4)*K.alt*1.3,{vy:-11,vx:-1.2,s:.045,dur:.55,col:'#cfe2f6'});
  K.par.passo(dt);for(const m of K.palaMe)m.rotation.z=K.t*1.1;for(const n of K.nuvole){n.position.x+=dt*n.userData.v*(s.meteo==='sereno'?1:2);if(n.position.x>K.M.G+8)n.position.x=-8}
  // meta e orme della via
  const via=tu.via||[];if(via.length&&!s.prigioniero){const m=via[via.length-1];K.anello.visible=true;K.anello.position.set(m[0],quota(m[0],m[1])+.08,m[1]);const sp=1+Math.sin(K.t*5)*.15;K.anello.scale.set(sp,sp,sp);
   const d=new T.Object3D();let n=0,px=tu.x,py=tu.y,resto=.3;for(const w of via){let dl=Math.hypot(w[0]-px,w[1]-py);while(dl>resto&&n<60){px+=(w[0]-px)/dl*resto;py+=(w[1]-py)/dl*resto;dl-=resto;resto=.45;d.position.set(px,quota(px,py)+.06,py);d.rotation.y=.785;d.updateMatrix();K.orme.setMatrixAt(n++,d.matrix)}resto-=dl;px=w[0];py=w[1]}
   K.orme.count=n;K.orme.instanceMatrix.needsUpdate=true}else{K.anello.visible=false;K.orme.count=0}
  // telecamera
  const me=K.P[0]||tu,G=K.M.G;if(K.segue&&!s.prigioniero){const k=Math.min(1,dt*5);K.fuoco.x+=(me.x-K.fuoco.x)*k;K.fuoco.z+=(me.y-K.fuoco.z)*k}
  {const asp=aspetto(),a=altMax(G,asp);if(K.alt>a)K.alt=a;const t=limita(K.fuoco,K.alt,G,asp),k=Math.min(1,dt*16);K.fuoco.x+=(t.x-K.fuoco.x)*k;K.fuoco.z+=(t.z-K.fuoco.z)*k}K.fuoco.y+=(quota(K.fuoco.x,K.fuoco.z)-K.fuoco.y)*Math.min(1,dt*4);
  const L=K.luce.ora(h,K.fuoco,Math.max(16,K.alt*1.15));if(s.meteo!=='sereno'){K.luce.sole.intensity*=s.meteo==='nebbia'?.62:.78}K.fin.visible=L.notte>.35;
  {const vic=L.notte>.35?K.lu.filter(lu=>lu.me.visible&&Math.abs(lu.x-K.fuoco.x)<vx&&Math.abs(lu.y-K.fuoco.z)<vz).sort((a,b)=>Math.hypot(a.x-K.fuoco.x,a.y-K.fuoco.z)-Math.hypot(b.x-K.fuoco.x,b.y-K.fuoco.z)):[];K.lumi.forEach((p,i)=>{const lu=vic[i];if(lu){p.position.set(lu.x,lu.h0+1.6,lu.y+.6);p.intensity=L.notte*(lu.tipo==='citta'||lu.tipo==='castello'?.8:.5)*(1+Math.sin(K.t*7+i)*.06)}else p.intensity=0})}
  K.mare.uniforms.t.value=K.t;const lm=(1-L.notte*.55)*(s.meteo==='sereno'?1:.82);K.mare.uniforms.luce.value.set(lm*(1-L.notte*.25),lm*(1-L.notte*.1),lm+L.notte*.1);
  if(K.geo2)vistaGrande(dt,s,L,lm);
  K.scene.background.set(L.notte>.5?'#0f2038':'#1d4f78');
  {const r=A.cv.getBoundingClientRect(),H=r.height||1,want=typeof Ven!=='undefined'&&Ven.V.foglio?(H/2-(96+H*.42)/2)*K.alt/H/A.SE:0;K.dz=(K.dz||0)+(want-(K.dz||0))*Math.min(1,dt*8);K.fz=K.fz||{x:0,y:0,z:0};K.fz.x=K.fuoco.x;K.fz.y=K.fuoco.y;K.fz.z=K.fuoco.z+K.dz}
  A.disegna(K.scene,K.cam,K.fz,K.alt,{notte:L.notte,nebbia:s.meteo==='nebbia'?1:s.meteo==='pioggia'?.3:0,tinta:s.meteo==='pioggia'?[.9,.94,1]:h>17.5&&h<20.5?[1.06,.97,.9]:h>5&&h<7.5?[1.04,.98,.95]:null});
  etichette(etc)}
 // etichette nella pagina: un elemento per luogo o compagnia in vista, riusato
 function etichette(L){const host=document.querySelector('.vn-etc');if(!host)return;const A=VenArte,vivi={},lontano=K.alt>30;
  for(const e of L){if(K.geo2&&K.alt>LONT&&e.luogo&&!/citta/.test(e.cls))continue;if(lontano&&e.luogo&&!/citta|castello|porto/.test(e.cls))continue;const p=A.aSchermo(K.cam,e.x,e.y,e.z);if(!p.ok)continue;vivi[e.id]=1;let el=host.querySelector('[data-e="'+e.id+'"]');
   if(!el){el=document.createElement('div');el.dataset.e=e.id;host.appendChild(el)}const cls='vn-et '+e.cls,tx=(e.luogo?'':(e.n!=null?'<b>'+e.n+'</b>':''))+(e.tx?'<span>'+esc(e.tx)+'</span>':'');
   if(el.className!==cls)el.className=cls;if(el._tx!==tx){el.innerHTML=tx;el._tx=tx}{const W=host.clientWidth,w=el.offsetWidth||0,x0=p.x-w/2,cx=p.x<40?w/2:p.x>W-40?W-w/2:p.x;el.style.transform='translate('+Math.round(Math.max(w/2,Math.min(W-w/2,cx)))+'px,'+Math.round(p.y)+'px) translate(-50%,-100%)'}if(e.col&&el._c!==e.col){el.style.setProperty('--fz',e.col);el._c=e.col}}
  for(const el of Array.from(host.children))if(!vivi[el.dataset.e])host.removeChild(el)}
 // ---------- gesti ----------
 function trascina(dx,dy){const A=VenArte,r=A.cv.getBoundingClientRect(),u=K.alt/r.height;K.fuoco.x-=dx*u;K.fuoco.z-=dy*u/A.SE;K.segue=false}
 function pizzico(f){K.alt=Math.max(8,Math.min(altMax(K.M?K.M.G:64,aspetto()),K.alt/f))}
 // dove ho toccato: una compagnia, un luogo o un punto di terra
 function tocco(px,py){const A=VenArte,s=K.s,r=A.cv.getBoundingClientRect();let m=null,md=30;
  for(const p of VEN.visibili(s)){const q=K.P[p.id]||p,c=A.aSchermo(K.cam,q.x,quota(q.x,q.y)+.4,q.y),d=Math.hypot(c.x-(px-r.left),c.y-(py-r.top));if(d<md){md=d;m={tipo:'parte',id:p.id}}}
  if(m)return m;md=34;for(const lu of K.lu){if(!lu.me.visible||Math.abs(lu.x-K.fuoco.x)>K.alt*1.3||Math.abs(lu.y-K.fuoco.z)>K.alt*1.8)continue;const c=A.aSchermo(K.cam,lu.x,lu.h0+.5,lu.y),d=Math.hypot(c.x-(px-r.left),c.y-(py-r.top));if(d<md){md=d;m={tipo:'luogo',id:lu.id}}}
  if(m)return m;let q=0,g=null;for(let k=0;k<5;k++){g=A.aTerra(K.cam,px,py,q);q=quota(g.x,g.z)}return{tipo:'terra',x:g.x,y:g.z}}
 const centra=()=>{K.segue=true};
 const guarda=(x,y)=>{K.fuoco.x=x;K.fuoco.z=y;K.segue=false};
 // la carta d'insieme: terre, strade e luoghi noti su un canvas (per il pannello «Carta»)
 function carta(cv,s){const M=VEN.mappaDi(s),G=M.G,x=cv.getContext('2d'),k=cv.width/G,im=x.createImageData(G,G),COL=[[42,104,138],[150,186,96],[84,134,70],[166,158,104],[128,124,120]],BIO={1:[232,238,242],2:[214,196,104],3:[196,182,108]};
  for(let i=0;i<G*G;i++){const t=M.T[i];let c=COL[t];if(t===1&&BIO[M.B[i]])c=BIO[M.B[i]];else if(t===2&&M.B[i]===1)c=[176,200,190];if(M.S[i]&&t!==0)c=[201,172,124];if(M.LG&&M.LG[i])c=[74,160,180];else if(M.F&&M.F[i]>0)c=[88,170,196];im.data[i*4]=c[0];im.data[i*4+1]=c[1];im.data[i*4+2]=c[2];im.data[i*4+3]=255}
  const tmp=document.createElement('canvas');tmp.width=tmp.height=G;tmp.getContext('2d').putImageData(im,0,0);x.imageSmoothingEnabled=false;x.drawImage(tmp,0,0,cv.width,cv.height);
  for(const l of s.l){if(l.noto===false)continue;const r=l.tipo==='citta'?5:l.tipo==='castello'?3.4:l.tipo==='villaggio'?2:2.8;x.fillStyle='#1a120a';x.fillRect(l.x*k-r-1,l.y*k-r-1,r*2+2,r*2+2);x.fillStyle=VEN.colFaz(s,l.faz).col;
   if(VEN.SITO[l.tipo]||l.tipo==='monastero'||l.tipo==='locanda'){x.beginPath();x.arc(l.x*k,l.y*k,r,0,6.283);x.fillStyle=l.tipo==='covo'?'#c0392b':l.tipo==='rovine'?'#9fe0c8':'#f4e9c8';x.fill()}else x.fillRect(l.x*k-r,l.y*k-r,r*2,r*2)}
  const tu=VEN.TU(s);x.strokeStyle='#fff';x.lineWidth=2;x.fillStyle='#d98a1f';x.beginPath();x.arc(tu.x*k,tu.y*k,5,0,6.283);x.fill();x.stroke()}
 return{K,limita,altMax,aspetto,STILE,apri,passo,trascina,pizzico,tocco,centra,guarda,carta,quota}})();
