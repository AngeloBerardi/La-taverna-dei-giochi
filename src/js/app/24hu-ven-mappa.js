/* ---- Compagnia di ventura (piano C): la mappa del mondo in 3D. Solo disegno e gesti: le regole stanno in VEN (motori/28k). ----
   Terreno a facce piatte ricavato dalla quota continua `VEN.alt`, mare con risacca, boschi a istanze, strade, campi,
   villaggi con mulino, castelli e città murate con gli stendardi del regno, fumo dai camini, finestre accese la notte,
   ombre di nuvole che scorrono, compagnie in marcia con lo stendardo. Le etichette sono elementi della pagina (`.vn-etc`).
   Colori dei regni da `VDAT.FAZ`. Bottega comune: `VenArte` (24ht). Piano: docs/VENTURA.md. */
const VenMappa=(()=>{
 const K={s:null,seme:-1,scene:null,cam:null,fuoco:{x:32,y:0,z:32},alt:13,segue:true,t:0,P:{},lu:[],meta:null};
 const QM=()=>VEN.MARE;
 function quotaA(a){const m=VEN.MARE;if(a<m)return Math.max(-1.3,(a-m)*7);let h=(a-m)*5;if(a>VEN.COLLE)h+=(a-VEN.COLLE)*13;if(a>VEN.MONTE)h+=(a-VEN.MONTE)*44;return h+(Math.round(h*2)/2-h)*.4+.06}
 // i luoghi stanno su un ripiano: attorno a ognuno il terreno si spiana alla sua quota
 function piano(x,y,base){for(const f of K.piani){const dx=x-f.x,dy=y-f.y;if(dx>f.r||dx<-f.r||dy>f.r||dy<-f.r)continue;const d=Math.sqrt(dx*dx+dy*dy);if(d<f.r){const t=Math.min(1,(f.r-d)/(f.r*.42)),u=t*t*(3-2*t);base+=(f.h-base)*u}}return base}
 const quota=(x,y)=>Math.max(0,piano(x,y,quotaA(VEN.alt(K.seme,x,y))));
 const hh=(x,y,s)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 const mix=(a,b,t)=>{const T=VenArte.T,c=new T.Color(a);return c.lerp(new T.Color(b),Math.max(0,Math.min(1,t)))};
 function costruisci(s){const T=VenArte.T,M=VEN.mappa(s.seme),G=M.G,A=VenArte;K.seme=s.seme;K.M=M;
  if(K.scene){K.scene.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
  K.piani=M.luoghi.map(l=>({x:l.x,y:l.y,h:Math.max(.3,quotaA(VEN.alt(s.seme,l.x,l.y))),r:l.tipo==='citta'?3.9:l.tipo==='castello'?2.7:2.3}));
  const sc=K.scene=new T.Scene();sc.background=new T.Color('#1d4f78');K.cam=A.camera();K.luce=A.luce(sc);
  // ---- terreno ----
  const R=2,N=G*R,pos=[],col=[],H=new Float32Array((N+1)*(N+1)),AL=new Float32Array((N+1)*(N+1));
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const a=VEN.alt(s.seme,i/R,j/R);AL[j*(N+1)+i]=a;H[j*(N+1)+i]=piano(i/R,j/R,quotaA(a))}
  const tinta=(cx,cy,a,h,pend)=>{const ci=Math.min(G-1,Math.floor(cy))*G+Math.min(G-1,Math.floor(cx)),b=M.B[ci],t=M.T[ci],n=hh(cx*3,cy*3,7),n2=VEN.alt(s.seme+5,cx*2.3,cy*2.3);
   if(a<VEN.MARE&&h<.02)return mix('#d9c890','#2c6f86',(VEN.MARE-a)*9);if(a<VEN.MARE+.012)return mix('#e8dba6','#d4c28a',n);
   let c;if(b===1)c=a<VEN.MARE+.05?mix('#a8b79c','#c9d6cf',n):mix('#f2f6f8','#d5e2ea',n*.9);else if(b===2)c=mix('#d9c463','#b7b25a',n2*1.6-.3);else c=mix('#86b84e','#5f9a42',n2*1.7-.35+n*.15);
   if(t===2)c.lerp(new T.Color(b===1?'#b9cbbf':b===2?'#8f9a4a':'#4c8038'),.6);
   if(a>VEN.COLLE)c.lerp(new T.Color(b===1?'#dfe7ec':b===2?'#b79f62':'#8e9a58'),Math.min(1,(a-VEN.COLLE)*9));
   if(a>VEN.MONTE-.02||pend>1.5)c.lerp(mix('#8d8782','#6c6865',n),Math.min(1,Math.max((a-VEN.MONTE+.02)*14,(pend-1.5)*.9)));
   if(h>7.4||(b===1&&h>4.6))c.lerp(new T.Color('#fbfdff'),Math.min(1,(h-(b===1?4.6:7.4))*.9));return c};
  const vert=(i,j)=>[i/R,H[j*(N+1)+i],j/R];
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=vert(i,j),b=vert(i+1,j),c=vert(i,j+1),d=vert(i+1,j+1),alt4=(AL[j*(N+1)+i]+AL[j*(N+1)+i+1]+AL[(j+1)*(N+1)+i]+AL[(j+1)*(N+1)+i+1])/4;
   if(alt4<VEN.MARE-.2)continue;const tri=(i+j)%2?[[a,c,b],[b,c,d]]:[[a,c,d],[a,d,b]];
   for(const t of tri){const cx=(t[0][0]+t[1][0]+t[2][0])/3,cy=(t[0][2]+t[1][2]+t[2][2])/3,h=(t[0][1]+t[1][1]+t[2][1])/3,pend=(Math.max(t[0][1],t[1][1],t[2][1])-Math.min(t[0][1],t[1][1],t[2][1]))*R;
    const k=tinta(cx,cy,VEN.alt(s.seme,cx,cy),h,pend);for(const v of t){pos.push(v[0],v[1],v[2]);col.push(k.r,k.g,k.b)}}}
  const gt=new T.BufferGeometry();gt.setAttribute('position',new T.Float32BufferAttribute(pos,3));gt.setAttribute('color',new T.Float32BufferAttribute(col,3));gt.computeVertexNormals();
  const terra=new T.Mesh(gt,A.mat);terra.receiveShadow=true;terra.castShadow=true;sc.add(terra);
  // ---- mare: bande di colore per fondale, risacca che batte la riva, luccichii ----
  const td=new Uint8Array(128*128*4);for(let j=0;j<128;j++)for(let i=0;i<128;i++){const a=VEN.alt(s.seme,(i+.5)/2,(j+.5)/2),v=Math.max(0,Math.min(255,Math.round((a-VEN.MARE)*600+128)));td[(j*128+i)*4]=v;td[(j*128+i)*4+3]=255}
  const ta=new T.DataTexture(td,128,128,T.RGBAFormat);ta.minFilter=ta.magFilter=T.LinearFilter;ta.needsUpdate=true;
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
  // ---- strade: nastri chiari che seguono il terreno ----
  {const S=A.Solidi(),fatto={};const nastro=(x0,y0,x1,y1)=>{const n=4;for(let k=0;k<n;k++){const ax=x0+(x1-x0)*k/n,ay=y0+(y1-y0)*k/n,bx=x0+(x1-x0)*(k+1)/n,by=y0+(y1-y0)*(k+1)/n,mx=(ax+bx)/2,my=(ay+by)/2;
     const l=Math.hypot(bx-ax,by-ay),ha=quota(ax,ay),hb=quota(bx,by);S.box(.2,.03,l*1.12,mx,(ha+hb)/2+.035,my,k%2?'#c9ac7c':'#bfa070',{ry:Math.atan2(bx-ax,by-ay),rx:-Math.atan2(hb-ha,l)})}};
   for(let y=0;y<G;y++)for(let x=0;x<G;x++){if(!M.S[y*G+x])continue;for(const[ox,oy]of[[1,0],[0,1],[1,1],[-1,1]]){const nx=x+ox,ny=y+oy;if(nx<0||ny>=G||nx>=G||!M.S[ny*G+nx])continue;
      if(ox&&oy&&(M.S[y*G+nx]||M.S[ny*G+x]))continue;nastro(x+.5,y+.5,nx+.5,ny+.5)}}
   if(S.n){const me=S.mesh({ombra:false});sc.add(me)}}
  // ---- boschi, rocce ----
  const occ=new Uint8Array(G*G);for(const l of M.luoghi){const rg=l.tipo==='citta'?3:l.tipo==='castello'?2:1;for(let oy=-rg;oy<=rg;oy++)for(let ox=-rg;ox<=rg;ox++)if(ox*ox+oy*oy<=rg*rg+1)occ[cellaDi(l.x+ox,l.y+oy)]=1}
  const pino=A.Solidi().cil(.05,.07,.3,5,0,0,0,'#6b4a2e').cono(.34,.5,6,0,.22,0,'#3f7a3a',{c2:'#4f9247'}).cono(.26,.44,6,0,.52,0,'#478743',{c2:'#5aa14f'}).cono(.17,.38,6,0,.8,0,'#52964b',{c2:'#73b862'}).geo();
  const lati=A.Solidi().cil(.06,.08,.34,5,0,0,0,'#6e4d30').sfera(.36,0,.62,0,'#5fa046').sfera(.27,.2,.86,.08,'#74b653').sfera(.24,-.2,.8,-.1,'#69aa4c').geo();
  const sasso=A.Solidi().sfera(.3,0,.12,0,'#9a948c').sfera(.2,.22,.08,.1,'#857f78').geo();
  const pinoN=A.Solidi().cil(.05,.07,.3,5,0,0,0,'#5a4030').cono(.34,.5,6,0,.22,0,'#3c6e52',{c2:'#dfeef2'}).cono(.26,.44,6,0,.52,0,'#4a7c5e',{c2:'#f2f8fa'}).cono(.17,.38,6,0,.8,0,'#cfe2e8',{c2:'#ffffff'}).geo();
  const lista={pino:[],pinoN:[],lati:[],sasso:[]};
  for(let y=1;y<G-1;y++)for(let x=1;x<G-1;x++){const i=y*G+x,t=M.T[i],b=M.B[i];if(occ[i]||t===0)continue;
   const quanti=t===2?4:t===3?(hh(x,y,11)<.45?1:0):t===1?(hh(x,y,12)<.1?1:0):0;
   for(let k=0;k<quanti;k++){const px=x+.14+hh(x*7+k,y*5,13)*.72,py=y+.14+hh(x*3,y*9+k,14)*.72;if(M.S[i]&&Math.abs(px-x-.5)<.3&&Math.abs(py-y-.5)<.3)continue;const a=VEN.alt(s.seme,px,py);if(a<VEN.MARE+.015||a>VEN.MONTE+.03)continue;
    const q=hh(x+k*31,y,15),tipo=b===1?'pino':b===2?(q<.3?'pino':'lati'):(q<.42?'pino':'lati'),sc0=.75+hh(x,y*3+k,16)*.6;
    const tn=b===1?[1,1,1]:b===2?[1.02,.94,.62]:[.85+q*.3,.9+hh(x,y+k,17)*.2,.8+q*.25];lista[b===1&&tipo==='pino'?'pinoN':tipo].push([px,quota(px,py)-.03,py,sc0*(tipo==='pino'&&b===2?.8:1),tn,hh(x,y+k*3,18)*6.28,b===2&&tipo==='pino'?1.5:1])}
   if(t===4||t===3){const n=t===4?(hh(x,y,19)<.5?1:0):(hh(x,y,20)<.2?1:0);for(let k=0;k<n;k++){const px=x+hh(x,y,21),py=y+hh(x,y,22),a=VEN.alt(s.seme,px,py);lista.sasso.push([px,quota(px,py),py,.6+hh(x,y,23)*1.3,[1,1,1],hh(x,y,24)*6.28,1])}}}
  const d=new T.Object3D(),cc=new T.Color();
  for(const[nome,geo]of[['pino',pino],['pinoN',pinoN],['lati',lati],['sasso',sasso]]){const Ls=lista[nome];if(!Ls.length)continue;const me=new T.InstancedMesh(geo,A.matI,Ls.length);me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(Ls.length*3),3);
   Ls.forEach((p,k)=>{d.position.set(p[0],p[1],p[2]);d.rotation.set(0,p[5],0);d.scale.set(p[3],p[3]*p[6],p[3]);d.updateMatrix();me.setMatrixAt(k,d.matrix);me.instanceColor.setXYZ(k,p[4][0],p[4][1],p[4][2])});
   me.castShadow=true;me.receiveShadow=nome==='sasso';me.frustumCulled=false;sc.add(me)}
  // ---- luoghi ----
  K.lu=[];const fin=A.Solidi(),SL=1.5;K.pale=[];K.camini=[];
  for(const b of M.luoghi){const S=A.Solidi(),h0=quota(b.x,b.y),bio=M.B[cellaDi(b.x,b.y)],r=(k)=>hh(b.id*13+k,b.id*7,31);
   const muro=bio===1?'#b9b3aa':bio===2?'#e6d2a4':'#e9dfc6',tetto=bio===1?'#5a4636':bio===2?'#c8623a':'#b0703c',legno='#7a5636';
   const casa=(x,z,w,dd,hc,ry,tc)=>{S.box(w,hc,dd,x,0,z,muro,{ry,c2:'#fff7e0'});S.tetto(w*1.16,hc*.9,dd*1.1,x,hc,z,tc||tetto,{ry});if(bio===1)S.tetto(w*1.0,hc*.5,dd*1.12,x,hc+hc*.46,z,'#f4f8fa',{ry});
    fin.box(.1,.13,.03,b.x+(x+Math.sin(ry)*dd*.52)*SL,h0+hc*.45*SL,b.y+(z+Math.cos(ry)*dd*.52)*SL,'#ffd98a',{ry});if(r(x*9+z)<.6)K.camini.push([b.x+x*SL,h0+hc*1.7*SL,b.y+z*SL,b.id])};
   if(b.tipo==='villaggio'){for(let k=0;k<5;k++){const an=k*1.26+r(k)*.6,rd=.42+r(k+9)*.34;casa(Math.cos(an)*rd,Math.sin(an)*rd,.32+r(k+3)*.1,.3,.24+r(k+5)*.08,an+1.57)}
    S.cil(.09,.09,.1,7,0,0,0,'#9a948c');S.cono(.14,.2,5,.2,0,.1,'#e0c45a');S.cono(.12,.17,5,-.9,0,.5,'#e0c45a');
    // mulino
    S.cil(.14,.2,.62,7,.95,0,-.35,muro,{c2:'#fff7e0'});S.cono(.22,.26,7,.95,.62,-.35,tetto);K.pale.push([b.x+.95*SL,h0+.6*SL,b.y+(-.35+.22)*SL]);
    // campi a strisce
    for(let k=0;k<5;k++){const an=r(k+40)*6.28,rd=1.25+r(k+50)*.7,fx=Math.cos(an)*rd,fz=Math.sin(an)*rd;if(VEN.alt(s.seme,b.x+fx*SL,b.y+fz*SL)<VEN.MARE+.03)continue;const hf=(quota(b.x+fx*SL,b.y+fz*SL)-h0)/SL;
     for(let q=0;q<4;q++)S.box(.62,.04,.13,fx,hf+.02,fz+(q-1.5)*.15,[bio===2?'#e6c64e':'#b9c552','#8fae45','#d9b24a','#a6803e'][(q+k)%4],{ry:an})}}
   else if(b.tipo==='castello'){S.cil(1.0,1.25,.3,9,0,-.3,0,'#8b8680');const p='#aaa49b',p2='#c8c2b8';S.box(.8,.9,.8,0,0,0,p,{c2:p2});for(let k=0;k<4;k++){const ox=(k%2?1:-1)*.36,oz=(k<2?1:-1)*.36;S.box(.14,.12,.14,ox,.9,oz,p2)}
    S.box(.5,.5,.5,0,.9,0,p,{c2:p2});S.tetto(.6,.36,.56,0,1.4,0,'#ffffff');
    for(let k=0;k<4;k++){const ox=(k%2?1:-1)*.78,oz=(k<2?1:-1)*.78;S.cil(.2,.23,1.0,8,ox,0,oz,p,{c2:p2});S.cono(.28,.36,8,ox,1.0,oz,'#ffffff')}
    for(let k=0;k<4;k++){const ry=k*Math.PI/2;S.box(1.56,.6,.12,Math.sin(ry)*.78,0,Math.cos(ry)*.78,p,{ry,c2:p2})}S.box(.3,.42,.16,0,0,.8,'#5a4030');
    for(const[fx,fy,fz]of[[-.15,.55,.41],[.15,.55,.41],[0,1.15,.26]])fin.box(.12,.18,.03,b.x+fx*SL,h0+fy*SL,b.y+fz*SL,'#ffd98a')}
   else{const p='#b5aea3',p2='#d6cfc2',RC=1.55;S.cil(RC+.25,RC+.5,.24,12,0,-.24,0,'#9c968c');
    for(let k=0;k<10;k++){const an=k/10*6.283,nx=Math.cos(an),nz=Math.sin(an);if(k!==2)S.box(1.0,.5,.12,nx*RC,0,nz*RC,p,{ry:-an+1.5708,c2:p2});const a2=an+.314;S.cil(.15,.17,.76,7,Math.cos(a2)*RC*1.03,0,Math.sin(a2)*RC*1.03,p,{c2:p2});S.cono(.2,.26,7,Math.cos(a2)*RC*1.03,.76,Math.sin(a2)*RC*1.03,'#ffffff')}
    const TC=[tetto,bio===2?'#a8502e':'#8a5a3a','#6e7f96','#9a4a3a'];for(let k=0;k<17;k++){const an=r(k)*6.283,rd=.25+Math.sqrt(r(k+20))*1.05;casa(Math.cos(an)*rd,Math.sin(an)*rd,.26+r(k+3)*.12,.26,.26+r(k+6)*.2,r(k+8)*3,TC[k%4])}
    S.box(.42,1.0,.6,0,0,0,p2,{c2:'#fffaf0'});S.tetto(.5,.4,.66,0,1.0,0,'#6e7f96');S.box(.26,1.7,.26,0,0,-.42,p2);S.cono(.24,.6,4,0,1.7,-.42,'#ffffff',{ry:.785});
    for(let k=0;k<3;k++)S.box(.2,.14,.16,.5+k*.26,0,.62,['#c94a3a','#3a78c9','#e0b83a'][k]);fin.box(.15,.3,.03,b.x,h0+.6*SL,b.y+.31*SL,'#ffd98a');fin.box(.12,.2,.03,b.x,h0+1.3*SL,b.y-.28*SL,'#ffd98a')}
   const me=S.mesh();me.position.set(b.x,h0,b.y);me.scale.setScalar(SL);sc.add(me);
   // i tetti bianchi prendono il colore del regno: il materiale è comune, quindi li tingo sul colore dei vertici alla consegna
   K.lu.push({id:b.id,me,h0,x:b.x,y:b.y,tipo:b.tipo,faz:null,alto:(b.tipo==='villaggio'?1.1:b.tipo==='castello'?2.1:2.5)*SL})}
  K.fin=new T.Mesh(fin.geo(),new T.MeshBasicMaterial({vertexColors:true}));K.fin.visible=false;sc.add(K.fin);
  // pale dei mulini
  {const S=A.Solidi();for(let k=0;k<4;k++)S.box(.07,.5,.02,0,0,0,'#efe6cf',{rz:k*Math.PI/2});K.palaGeo=S.geo();K.palaMe=K.pale.map(p=>{const m=new T.Mesh(K.palaGeo,A.mat);m.position.set(p[0],p[1],p[2]);m.scale.setScalar(SL);sc.add(m);return m})}
  // nuvole: non si vedono, fanno solo ombra
  {const S=A.Solidi();S.sfera(2.6,0,0,0,'#fff',{sy:.3});S.sfera(2,2.2,0,.6,'#fff',{sy:.3});S.sfera(1.7,-2,0,-.8,'#fff',{sy:.3});const gm=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false});
   K.nuvole=[];for(let k=0;k<9;k++){const m=new T.Mesh(S.geo(),gm);m.castShadow=true;m.position.set(hh(k,1,40)*G,26,hh(k,2,41)*G);m.scale.setScalar(.8+hh(k,3,42)*1.2);m.userData.v=.5+hh(k,4,43)*.5;sc.add(m);K.nuvole.push(m)}}
  // parti vive
  K.fig=A.Schiera(sc,96);K.ste=A.Stendardi(sc,80);K.par=A.Particelle(sc,260);K.P={};
  K.lumi=[0,1,2,3].map(()=>{const p=new T.PointLight('#ffb45a',0,5,2);sc.add(p);return p});
  K.anello=new T.Mesh(new T.RingGeometry(.2,.3,20),new T.MeshBasicMaterial({color:'#fff2b0',transparent:true,opacity:.9,depthTest:false}));K.anello.rotation.x=-Math.PI/2;K.anello.visible=false;K.anello.renderOrder=5;sc.add(K.anello);
  K.orme=new T.InstancedMesh(new T.BoxGeometry(.09,.02,.09),new T.MeshBasicMaterial({color:'#fff2b0',depthTest:false}),60);K.orme.count=0;K.orme.frustumCulled=false;K.orme.renderOrder=4;sc.add(K.orme);
  const tu=VEN.TU(s);K.fuoco.x=tu.x;K.fuoco.z=tu.y;K.fuoco.y=quota(tu.x,tu.y);K.segue=true}
 const cellaDi=(x,y)=>Math.max(0,Math.min(63,Math.floor(y)))*64+Math.max(0,Math.min(63,Math.floor(x)));
 // tinge i tetti bianchi (stendardo di pietra) col colore del regno che tiene il luogo
 function colora(l,lu){if(lu.faz===l.faz)return;const T=VenArte.T,c=lu.me.geometry.attributes.color,base=lu.base||(lu.base=c.array.slice()),k=new T.Color(VDAT.FAZ[l.faz].col);
  for(let i=0;i<c.count;i++){const r=base[i*3],g=base[i*3+1],b=base[i*3+2];if(r>.97&&g>.97&&b>.97)c.setXYZ(i,k.r,k.g,k.b);else c.setXYZ(i,r,g,b)}c.needsUpdate=true;lu.faz=l.faz}
 function apri(s){K.s=s;if(K.seme!==s.seme||!K.scene)costruisci(s);return true}
 // un fotogramma: aggiorna le parti vive e disegna
 function passo(dt,s){if(!K.scene)return;const T=VenArte.T,A=VenArte,tu=VEN.TU(s);K.t+=dt;const h=(s.t%1440)/60;K.s=s;
  // compagnie visibili (più la tua), con posizione ammorbidita
  const vis=VEN.visibili(s).slice();if(!s.prigioniero)vis.unshift(tu);const visti={};K.fig.inizio();K.ste.inizio();const etc=[];
  for(const p of vis){let q=K.P[p.id];if(!q||Math.abs(q.x-p.x)+Math.abs(q.y-p.y)>3)q=K.P[p.id]={x:p.x,y:p.y,yaw:0,f:0};visti[p.id]=1;
   const dx=p.x-q.x,dy=p.y-q.y,dl=Math.hypot(dx,dy),k=Math.min(1,dt*9);q.x+=dx*k;q.y+=dy*k;const fermo=dl<.004;if(!fermo){const ya=Math.atan2(dx,dy);let da=ya-q.yaw;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;q.yaw+=da*Math.min(1,dt*8);q.f+=dt*(p.k==='car'?1.4:2.2)}
   const F=VDAT.FAZ[p.id===0?VEN.lato(s):p.faz],n=VEN.uomini(p),cav=p.k==='sig'||(p.id===0&&s.cap.eq.cavallo>0)||p.tr.some(e=>VDAT.TR[e.t].c==='c'&&e.n>=3),seg=Math.min(5,Math.floor(n/9)),hq=quota(q.x,q.y);
   const col=p.id===0?VDAT.FAZ.tu.col:F.col,sn=Math.sin(q.yaw),cs=Math.cos(q.yaw);
   K.fig.metti({x:q.x,y:hq,z:q.y,yaw:q.yaw,sc:p.id===0?.52:.46,col,col2:F.col2,cls:p.k==='sig'||p.id===0?'k':'f',liv:p.k==='sig'||p.id===0?5:p.k==='pre'?1:2,cav,fase:fermo?0:q.f,seme:p.id});
   for(let j=0;j<seg;j++){const ox=((j%2)?.3:-.3)*(1+Math.floor(j/2)*.5),oz=-.4-Math.floor(j/2)*.32,fx=q.x+cs*ox+sn*oz,fy=q.y-sn*ox+cs*oz;
    K.fig.metti({x:fx,y:quota(fx,fy),z:fy,yaw:q.yaw,sc:.34,col,col2:F.col2,cls:j%3===2?'t':'f',liv:p.k==='pre'?1:2,fase:fermo?0:q.f+j*.37,seme:p.id+j})}
   if(p.k==='car'){K.fig.metti({x:q.x-sn*.34,y:hq,z:q.y-cs*.34,yaw:q.yaw,sc:.3,col:'#c9b48a',cls:'f',liv:1,cav:true,fase:fermo?0:q.f+.5,seme:p.id+3})}
   else K.ste.metti(q.x-cs*.16,hq,q.y+sn*.16,col,p.id===0?.56:.48,K.t,p.id);
   if(!fermo&&Math.random()<dt*5&&M0(q.x,q.y)!==1)K.par.emetti(q.x,hq+.03,q.y,{vy:.25,s:.08,dur:.7,col:'#d8c8a4',cresce:1.2});
   etc.push({id:'p'+p.id,x:q.x,y:hq+(cav?1.6:1.3),z:q.y,tx:p.id===0?'':p.nome,n,cls:p.id===0?'tu':VEN.ostile(s,p,tu)?'nem':p.k==='sig'?'sig':'neu',col})}
  for(const id of Object.keys(K.P))if(!visti[id])delete K.P[id];
  K.fig.fine();K.ste.fine();
  // luoghi: colori del regno, fumo, assedi, saccheggi
  for(const lu of K.lu){const l=s.l[lu.id];colora(l,lu);const vicino=Math.abs(lu.x-K.fuoco.x)<K.alt*1.2&&Math.abs(lu.y-K.fuoco.z)<K.alt*1.6;
   if(vicino){if(l.sacc>VEN.giorno(s)&&Math.random()<dt*7)K.par.emetti(lu.x+(Math.random()-.5)*.8,lu.h0+.3,lu.y+(Math.random()-.5)*.8,{vy:.7,vx:.15,s:.2,dur:2.4,col:'#3a3432',col2:'#857c76',cresce:1.4});
    if(l.ass||(s.assedio&&s.assedio.lid===l.id)){if(Math.random()<dt*6)K.par.emetti(lu.x+(Math.random()-.5)*1.6,lu.h0+.5,lu.y+(Math.random()-.5)*1.6,{vy:.9,s:.16,dur:1.6,col:'#ff8a3a',col2:'#4a403c',cresce:1.6})}
    etc.push({id:'l'+l.id,x:lu.x,y:lu.h0+lu.alto,z:lu.y,tx:l.nome,cls:'luogo '+l.tipo+(l.ass?' ass':'')+(l.faz==='tu'||l.sig===-2?' mio':''),col:VDAT.FAZ[l.faz].col,luogo:1})}}
  for(const c of K.camini){if(Math.abs(c[0]-K.fuoco.x)<K.alt&&Math.abs(c[2]-K.fuoco.z)<K.alt*1.4&&Math.random()<dt*.9&&!(s.l[c[3]].sacc>VEN.giorno(s)))K.par.emetti(c[0],c[1],c[2],{vy:.32,vx:.1,s:.07,dur:2.6,col:'#e8e4dc',col2:'#bdb8b0',cresce:1.5})}
  for(const sc of s.scontri){if(Math.random()<dt*10)K.par.emetti(sc.x+(Math.random()-.5)*.6,quota(sc.x,sc.y)+.1,sc.y+(Math.random()-.5)*.6,{vy:.5,s:.13,dur:.9,col:'#d9c9a6',cresce:1.2});etc.push({id:'s'+sc.id,x:sc.x,y:quota(sc.x,sc.y)+1,z:sc.y,tx:'Battaglia',cls:'scontro'})}
  K.par.passo(dt);for(const m of K.palaMe)m.rotation.z=K.t*1.1;for(const n of K.nuvole){n.position.x+=dt*n.userData.v;if(n.position.x>K.M.G+8)n.position.x=-8}
  // meta e orme della via
  const via=tu.via||[];if(via.length&&!s.prigioniero){const m=via[via.length-1];K.anello.visible=true;K.anello.position.set(m[0],quota(m[0],m[1])+.08,m[1]);const sp=1+Math.sin(K.t*5)*.15;K.anello.scale.set(sp,sp,sp);
   const d=new T.Object3D();let n=0,px=tu.x,py=tu.y,resto=.3;for(const w of via){let dl=Math.hypot(w[0]-px,w[1]-py);while(dl>resto&&n<60){px+=(w[0]-px)/dl*resto;py+=(w[1]-py)/dl*resto;dl-=resto;resto=.45;d.position.set(px,quota(px,py)+.06,py);d.rotation.y=.785;d.updateMatrix();K.orme.setMatrixAt(n++,d.matrix)}resto-=dl;px=w[0];py=w[1]}
   K.orme.count=n;K.orme.instanceMatrix.needsUpdate=true}else{K.anello.visible=false;K.orme.count=0}
  // telecamera
  const me=K.P[0]||tu;if(K.segue&&!s.prigioniero){const k=Math.min(1,dt*5);K.fuoco.x+=(me.x-K.fuoco.x)*k;K.fuoco.z+=(me.y-K.fuoco.z)*k}
  K.fuoco.x=Math.max(2,Math.min(62,K.fuoco.x));K.fuoco.z=Math.max(2,Math.min(63,K.fuoco.z));K.fuoco.y+=(quota(K.fuoco.x,K.fuoco.z)-K.fuoco.y)*Math.min(1,dt*4);
  const L=K.luce.ora(h,K.fuoco,Math.max(16,K.alt*1.15));K.fin.visible=L.notte>.35;
  {const vic=L.notte>.35?K.lu.slice().sort((a,b)=>Math.hypot(a.x-K.fuoco.x,a.y-K.fuoco.z)-Math.hypot(b.x-K.fuoco.x,b.y-K.fuoco.z)):[];K.lumi.forEach((p,i)=>{const lu=vic[i];if(lu){p.position.set(lu.x,lu.h0+1.6,lu.y+.6);p.intensity=L.notte*(lu.tipo==='villaggio'?.5:.8)*(1+Math.sin(K.t*7+i)*.06)}else p.intensity=0})}K.mare.uniforms.t.value=K.t;const lm=1-L.notte*.55;K.mare.uniforms.luce.value.set(lm*(1-L.notte*.25),lm*(1-L.notte*.1),lm+L.notte*.1);
  K.scene.background.set(L.notte>.5?'#0f2038':'#1d4f78');
  A.disegna(K.scene,K.cam,K.fuoco,K.alt,{notte:L.notte,tinta:h>17.5&&h<20.5?[1.06,.97,.9]:h>5&&h<7.5?[1.04,.98,.95]:null});
  etichette(etc)}
 const M0=(x,y)=>K.M.T[cellaDi(x,y)]===1?0:1;
 // etichette nella pagina: un elemento per luogo o compagnia in vista, riusato
 function etichette(L){const host=document.querySelector('.vn-etc');if(!host)return;const A=VenArte,vivi={};
  for(const e of L){const p=A.aSchermo(K.cam,e.x,e.y,e.z);if(!p.ok)continue;vivi[e.id]=1;let el=host.querySelector('[data-e="'+e.id+'"]');
   if(!el){el=document.createElement('div');el.dataset.e=e.id;host.appendChild(el)}const cls='vn-et '+e.cls,tx=(e.luogo?'':(e.n!=null?'<b>'+e.n+'</b>':''))+(e.tx?'<span>'+esc(e.tx)+'</span>':'');
   if(el.className!==cls)el.className=cls;if(el._tx!==tx){el.innerHTML=tx;el._tx=tx}el.style.transform='translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px) translate(-50%,-100%)';if(e.col&&el._c!==e.col){el.style.setProperty('--fz',e.col);el._c=e.col}}
  for(const el of Array.from(host.children))if(!vivi[el.dataset.e])host.removeChild(el)}
 // ---------- gesti ----------
 function trascina(dx,dy){const A=VenArte,r=A.cv.getBoundingClientRect(),u=K.alt/r.height;K.fuoco.x-=dx*u;K.fuoco.z-=dy*u/A.SE;K.segue=false}
 function pizzico(f){K.alt=Math.max(8,Math.min(36,K.alt/f))}
 // dove ho toccato: una compagnia, un luogo o un punto di terra
 function tocco(px,py){const A=VenArte,s=K.s,r=A.cv.getBoundingClientRect(),tu=VEN.TU(s);let m=null,md=30;
  for(const p of VEN.visibili(s)){const q=K.P[p.id]||p,c=A.aSchermo(K.cam,q.x,quota(q.x,q.y)+.4,q.y),d=Math.hypot(c.x-(px-r.left),c.y-(py-r.top));if(d<md){md=d;m={tipo:'parte',id:p.id}}}
  if(m)return m;md=34;for(const lu of K.lu){const c=A.aSchermo(K.cam,lu.x,lu.h0+.5,lu.y),d=Math.hypot(c.x-(px-r.left),c.y-(py-r.top));if(d<md){md=d;m={tipo:'luogo',id:lu.id}}}
  if(m)return m;let q=0,g=null;for(let k=0;k<5;k++){g=A.aTerra(K.cam,px,py,q);q=quota(g.x,g.z)}return{tipo:'terra',x:g.x,y:g.z}}
 const centra=()=>{K.segue=true};
 return{K,apri,passo,trascina,pizzico,tocco,centra,quota}})();
