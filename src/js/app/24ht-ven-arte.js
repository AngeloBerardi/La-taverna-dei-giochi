/* ---- Compagnia di ventura (piano C): la bottega della grafica 3D, comune a mappa del mondo (24hu) e battaglia (24hv). ----
   Un solo canvas e un solo renderer. La scena si disegna su un bersaglio piccolo (circa 300 righe) con telecamera
   ortografica a tre quarti; la telecamera scatta sulla griglia dei pixel d'arte e lo scarto si recupera nell'ingrandimento:
   così lo scorrimento è liscio e i pixel non «nuotano». La rifinitura aggiunge contorni dalla profondità, retino e tinta dell'ora.
   Qui stanno anche: il costruttore di solidi a facce piatte (`Solidi`), le schiere di figure a istanze (`Schiera`),
   gli stendardi, le particelle. Nessuna regola di gioco: solo disegno. three.js r128 (VENDOR). Piano: docs/VENTURA.md. */
const VenArte=(()=>{
 let T=null,ren=null,cv=null,rt=null,post=null,postScene=null,postCam=null,grad=null,matToon=null,matInst=null;
 const A={pronta:false,fallita:false,carica:false,W:0,H:0,k:3,rw:0,rh:0,host:null,t:0,fps:60,nfps:0,lento:0};
 const RIGHE={alta:500,media:400,bassa:290};
 const qual=()=>{try{return localStorage.getItem('ven-q')||'media'}catch(e){return'media'}};
 const ELEV=52*Math.PI/180,SE=Math.sin(ELEV),CE=Math.cos(ELEV);
 function avvia(){if(A.pronta||A.fallita)return Promise.resolve(A.pronta);if(A.attesa)return A.attesa;
  A.attesa=VENDOR.load('three').then(()=>{try{T=THREE;costruisci();A.pronta=true}catch(e){A.fallita=true;ERR.n(e,'ventura-3d')}return A.pronta},()=>{A.fallita=true;return false});return A.attesa}
 function costruisci(){cv=document.createElement('canvas');cv.className='vn-cv';
  ren=new T.WebGLRenderer({canvas:cv,antialias:false,alpha:false,powerPreference:'high-performance'});ren.setPixelRatio(1);// colori scritti come si vedono: nessuna conversione di spazio colore
  
  ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFShadowMap;ren.autoClear=true;
  const g=new Uint8Array([70,70,70,255,138,138,138,255,205,205,205,255,255,255,255,255]);grad=new T.DataTexture(g,4,1,T.RGBAFormat);grad.minFilter=grad.magFilter=T.NearestFilter;grad.needsUpdate=true;
  matToon=new T.MeshToonMaterial({vertexColors:true,gradientMap:grad});matInst=new T.MeshToonMaterial({vertexColors:true,gradientMap:grad});// r128: un materiale non può servire insieme maglie semplici e a istanze colorate
  postCam=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene=new T.Scene();
  post=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tD:{value:null},tZ:{value:null},res:{value:new T.Vector2(1,1)},off:{value:new T.Vector2()},zr:{value:100},tinta:{value:new T.Vector3(1,1,1)},
    notte:{value:0},bordo:{value:.55},vig:{value:.35},lampo:{value:0}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`precision highp float;varying vec2 vUv;uniform sampler2D tD;uniform sampler2D tZ;uniform vec2 res;uniform vec2 off;uniform float zr;uniform vec3 tinta;uniform float notte;uniform float bordo;uniform float vig;uniform float lampo;
float bayer(vec2 p){vec2 q=floor(mod(p,4.));float i=q.x+q.y*4.;float v=0.;
 if(i<1.)v=0.;else if(i<2.)v=8.;else if(i<3.)v=2.;else if(i<4.)v=10.;else if(i<5.)v=12.;else if(i<6.)v=4.;else if(i<7.)v=14.;else if(i<8.)v=6.;
 else if(i<9.)v=3.;else if(i<10.)v=11.;else if(i<11.)v=1.;else if(i<12.)v=9.;else if(i<13.)v=15.;else if(i<14.)v=7.;else if(i<15.)v=13.;else v=5.;return v/16.-.47;}
void main(){vec2 tx=floor(1.+vUv*(res-2.)+off)+.5;vec2 uv=tx/res;vec3 c=texture2D(tD,uv).rgb;float d=texture2D(tZ,uv).x;
 vec2 e=1./res;float dn=min(min(texture2D(tZ,uv+vec2(e.x,0.)).x,texture2D(tZ,uv-vec2(e.x,0.)).x),min(texture2D(tZ,uv+vec2(0.,e.y)).x,texture2D(tZ,uv-vec2(0.,e.y)).x));
 float k=smoothstep(.55,1.1,(d-dn)*zr);c*=1.-k*bordo;
 float l=dot(c,vec3(.3,.59,.11));c=mix(c,vec3(l)*vec3(.6,.74,1.12),notte*.3);c*=tinta;
 c+=bayer(tx)*(1./26.);c=floor(c*26.+.5)/26.;
 vec2 v=vUv-.5;c*=1.-dot(v,v)*vig*1.5;c+=lampo;gl_FragColor=vec4(c,1.);}`});
  postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),post))}
 // misura del canvas: k pixel veri per pixel d'arte, bersaglio con un texel di margine
 function misura(){const h=A.host;if(!h)return;const W=h.clientWidth|0,H=h.clientHeight|0;if(!W||!H)return;const q=qual()+A.lento;if(W===A.W&&H===A.H&&q===A.q)return;A.W=W;A.H=H;A.q=q;
  const dpr=Math.min(3,window.devicePixelRatio||1),dw=Math.round(W*dpr),dh=Math.round(H*dpr);A.k=Math.max(dpr>1.4?2:1,Math.round(dh/(RIGHE[qual()]||400))+A.lento);
  const aw=Math.ceil(dw/A.k),ah=Math.ceil(dh/A.k);A.rw=aw+2;A.rh=ah+2;ren.setSize(aw*A.k,ah*A.k,false);cv.style.width=(aw*A.k/dpr)+'px';cv.style.height=(ah*A.k/dpr)+'px';
  if(rt){rt.depthTexture.dispose();rt.dispose()}
  rt=new T.WebGLRenderTarget(A.rw,A.rh,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,format:T.RGBAFormat,generateMipmaps:false,stencilBuffer:false,depthBuffer:true});
  rt.depthTexture=new T.DepthTexture(A.rw,A.rh);rt.depthTexture.type=T.UnsignedIntType;post.uniforms.tD.value=rt.texture;post.uniforms.tZ.value=rt.depthTexture;post.uniforms.res.value.set(A.rw,A.rh)}
 function monta(host){if(!A.pronta)return false;if(A.host!==host){A.host=host;A.W=0;host.insertBefore(cv,host.firstChild)}else if(cv.parentNode!==host)host.insertBefore(cv,host.firstChild);misura();return true}
 function smonta(){if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);A.host=null}
 // telecamera ortografica a tre quarti: guarda verso nord (−z), `alt` = unità di mondo visibili in altezza
 function camera(){const c=new T.OrthographicCamera(-1,1,1,-1,.1,400);c.userData.alt=30;return c}
 // un fotogramma: mette la telecamera sul fuoco (scattando sui pixel d'arte), disegna e ingrandisce
 function disegna(scene,cam,fuoco,alt,o){if(!A.pronta||!rt)return;o=o||{};const asp=(A.rw-2)/(A.rh-2),hw=alt,w=hw/(A.rh-2);
  const pr=fuoco.x,pu=fuoco.y*CE-fuoco.z*SE,sr=Math.round(pr/w)*w,su=Math.round(pu/w)*w,dx=pr-sr,du=pu-su;
  const fx=fuoco.x-dx,fy=fuoco.y-du*CE,fz=fuoco.z+du*SE,D=140;
  cam.position.set(fx,fy+SE*D,fz+CE*D);cam.up.set(0,1,0);cam.lookAt(fx,fy,fz);
  const hh=hw*A.rh/(A.rh-2)/2,ww=hw*asp*A.rw/(A.rw-2)/2;cam.left=-ww;cam.right=ww;cam.top=hh;cam.bottom=-hh;cam.near=.1;cam.far=320;cam.updateProjectionMatrix();cam.userData.alt=alt;cam.userData.w=w;
  const u=post.uniforms;u.off.value.set(dx/w,du/w);u.zr.value=320-.1;u.notte.value=o.notte||0;u.lampo.value=o.lampo||0;if(o.tinta)u.tinta.value.set(o.tinta[0],o.tinta[1],o.tinta[2]);else u.tinta.value.set(1,1,1);
  ren.setRenderTarget(rt);ren.render(scene,cam);ren.setRenderTarget(null);ren.render(postScene,postCam);
  // sonda dei fps: se il telefono fatica i pixel d'arte diventano più grossi (una volta, due al massimo)
  const ora=performance.now();if(A.t){const dt=ora-A.t;A.fps+=(1000/Math.max(1,dt)-A.fps)*.05;if(++A.nfps>180){A.nfps=0;if(A.fps<26&&A.lento<2){A.lento++;misura()}}}A.t=ora}
 // dal punto dello schermo (pixel CSS dentro il canvas) al piano y=0 del mondo, e viceversa
 function aTerra(cam,px,py,quota){const r=cv.getBoundingClientRect(),nx=(px-r.left)/r.width*2-1,ny=-((py-r.top)/r.height*2-1);const o=new T.Vector3(nx,ny,-1).unproject(cam),d=new T.Vector3(0,-SE,-CE);
  const t=(o.y-(quota||0))/SE;return{x:o.x+d.x*t,z:o.z+d.z*t}}
 function aSchermo(cam,x,y,z){const v=new T.Vector3(x,y,z).project(cam),r=cv.getBoundingClientRect();return{x:(v.x+1)/2*r.width,y:(1-v.y)/2*r.height,ok:v.x>-1.1&&v.x<1.1&&v.y>-1.1&&v.y<1.1}}
 // ---------- solidi a facce piatte con colore per vertice ----------
 function Solidi(){const pos=[],nor=[],col=[],m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),n=new T.Vector3(),c=new T.Color(),c2=new T.Color();
  const S={n:0,
   agg(geo,x,y,z,colore,o){o=o||{};const g=geo.index?geo.toNonIndexed():geo;g.computeVertexNormals();e.set(o.rx||0,o.ry||0,o.rz||0);q.setFromEuler(e);
    m.compose(v.set(x,y,z),q,new T.Vector3(o.sx||1,o.sy||1,o.sz||1));const nm=new T.Matrix3().getNormalMatrix(m),P=g.attributes.position,N=g.attributes.normal;c.set(colore);if(o.c2!=null)c2.set(o.c2);
    let y0=1e9,y1=-1e9;if(o.c2!=null)for(let i=0;i<P.count;i++){const yy=P.getY(i);if(yy<y0)y0=yy;if(yy>y1)y1=yy}
    for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const ty=o.c2!=null?(v.y-y0)/Math.max(1e-6,y1-y0):0;v.applyMatrix4(m);pos.push(v.x,v.y,v.z);n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);
     if(o.c2!=null)col.push(c.r+(c2.r-c.r)*ty,c.g+(c2.g-c.g)*ty,c.b+(c2.b-c.b)*ty);else col.push(c.r,c.g,c.b)}
    S.n+=P.count;g.dispose();if(g!==geo)geo.dispose();return S},
   box(w,h,d,x,y,z,colore,o){return S.agg(new T.BoxGeometry(w,h,d),x,y+h/2,z,colore,o)},
   cil(r1,r2,h,seg,x,y,z,colore,o){return S.agg(new T.CylinderGeometry(r1,r2,h,seg),x,y+h/2,z,colore,o)},
   cono(r,h,seg,x,y,z,colore,o){return S.agg(new T.ConeGeometry(r,h,seg),x,y+h/2,z,colore,o)},
   sfera(r,x,y,z,colore,o){return S.agg(new T.IcosahedronGeometry(r,0),x,y,z,colore,o)},
   // tetto a due falde: prisma triangolare lungo z
   tetto(w,h,d,x,y,z,colore,o){const g=new T.CylinderGeometry(w*.5774,w*.5774,d,3);return S.agg(g,x,y+h*.33,z,colore,Object.assign({rx:-Math.PI/2,sy:1,sz:h/(w*.866)},o||{}))},
   geo(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));return g},
   mesh(o){const me=new T.Mesh(S.geo(),matToon);me.castShadow=!(o&&o.ombra===false);me.receiveShadow=true;return me}};return S}
 // ---------- schiere di figure a istanze ----------
 // Ogni figura è fatta di pochi pezzi (corpo, testa, arma, scudo, cavallo): un InstancedMesh per pezzo, colore per istanza.
 function Schiera(scene,max){const d=new T.Object3D(),d2=new T.Object3D(),col=new T.Color();
  const pezzo=(S,ombra)=>{const me=new T.InstancedMesh(S.geo(),matInst,max);me.castShadow=ombra!==false;me.receiveShadow=false;me.count=0;me.frustumCulled=false;me.instanceMatrix.setUsage(T.DynamicDrawUsage);
   me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(max*3).fill(1),3);me.instanceColor.setUsage(T.DynamicDrawUsage);scene.add(me);return me};
  const P={};
  P.corpo=pezzo(Solidi().box(.2,.62,.24,-.15,0,0,'#6e665f').box(.2,.62,.24,.15,0,0,'#6e665f').box(.66,.62,.4,0,.6,0,'#ffffff',{c2:'#f2f2f2'}).box(.2,.5,.24,-.43,.7,0,'#e4e4e4').box(.2,.5,.24,.43,.7,0,'#e4e4e4').box(.66,.12,.4,0,.56,0,'#4a3a2c'));
  P.testa=pezzo(Solidi().box(.34,.32,.32,0,1.22,0,'#ffe2c0').box(.38,.16,.36,0,1.44,0,'#ffffff').box(.4,.05,.4,0,1.42,0,'#d0d0d0'));
  P.spada=pezzo(Solidi().box(.07,.8,.07,.46,.86,.22,'#dfe6ee',{rx:.5}).box(.2,.06,.08,.46,.88,.12,'#8a6a2c'),false);
  P.lancia=pezzo(Solidi().box(.06,2.1,.06,.46,.1,.16,'#8b6b43').box(.1,.28,.1,.46,2.2,.16,'#e6edf4'),false);
  P.arco=pezzo(Solidi().box(.05,.5,.05,-.44,.95,.32,'#7a5230',{rx:.35}).box(.05,.5,.05,-.44,.5,.32,'#7a5230',{rx:-.35}).box(.3,.36,.14,.12,.86,-.26,'#6a4a2c'),false);
  P.scudo=pezzo(Solidi().box(.1,.62,.5,-.52,.62,.1,'#ffffff').box(.12,.2,.16,-.54,.82,.1,'#d8d8d8'),false);
  P.cavallo=pezzo(Solidi().box(.56,.6,1.5,0,.72,0,'#ffffff').box(.34,.66,.36,0,1.1,.74,'#f4f4f4',{rx:-.5}).box(.3,.3,.56,0,1.54,1.06,'#ececec').box(.16,.74,.18,-.19,0,.58,'#d8d8d8').box(.16,.74,.18,.19,0,.58,'#d8d8d8')
   .box(.16,.74,.18,-.19,0,-.58,'#d8d8d8').box(.16,.74,.18,.19,0,-.58,'#d8d8d8').box(.12,.6,.12,0,.6,-.82,'#5a5a5a',{rx:.4}).box(.6,.14,.7,0,1.3,-.05,'#b0b0b0'));
  const ord=Object.keys(P),n={};const MANTI=['#8a5a34','#5c3c26','#b89468','#3a302c','#d8d2c6','#6e4a2e'],ELMI=['#c9a678','#c9a678','#9aa6b4','#b9c5d3','#e6c35a','#ffd866'];
  const metti=(me,k,r,g,b)=>{me.setMatrixAt(k,d.matrix);me.instanceColor.setXYZ(k,r,g,b)};
  return{P,
   inizio(){for(const k of ord)n[k]=0},
   // f: {x,y,z,yaw,sc,col,col2,cls,liv,cav,fase,colpo,giu,lampo,seme}
   metti(f){const sc=f.sc||1,cav=f.cav||f.cls==='c',giu=f.giu||0,fase=f.fase||0,sw=Math.sin(fase*6.283),bob=cav?Math.abs(sw)*.1:Math.abs(sw)*.07,colpo=f.colpo||0,aff=Math.sin(colpo*3.1416);
    col.set(f.col||'#888');let r=col.r,g=col.g,b=col.b;if(f.lampo){r=g=b=1.6}
    const yb=f.y+(cav?.78*sc:0)+bob*sc;
    d.position.set(f.x,yb-giu*(cav?.5:.05)*sc,f.z);d.rotation.set(0,0,0);d.rotation.order='YXZ';d.rotation.y=f.yaw;d.rotation.x=giu*1.45+aff*.22+(cav?0:sw*.03);d.rotation.z=cav?0:sw*.05;d.scale.set(sc,sc*(1-giu*.2),sc);d.updateMatrix();
    if(n.corpo<max){metti(P.corpo,n.corpo++,r,g,b);const e=new T.Color(ELMI[Math.min(5,f.liv||1)]);metti(P.testa,n.testa++,f.lampo?1.6:e.r,f.lampo?1.6:e.g,f.lampo?1.6:e.b)}
    if(giu<.5){const c2=new T.Color(f.col2||'#ccc');
     if(f.cls==='t'){metti(P.arco,n.arco++,1,1,1)}
     else{d2.position.copy(d.position);d2.rotation.copy(d.rotation);d2.rotation.x+=aff*1.1;d2.scale.copy(d.scale);d2.updateMatrix();const me=(f.cls==='c'||f.cls==='k'||(f.liv||1)===2&&f.cls==='f'&&(f.seme||0)%2)?P.lancia:P.spada;me.setMatrixAt(n[me===P.lancia?'lancia':'spada'],d2.matrix);me.instanceColor.setXYZ(n[me===P.lancia?'lancia':'spada']++,1,1,1);
      if((f.liv||1)>=2||f.cls==='k')metti(P.scudo,n.scudo++,c2.r,c2.g,c2.b)}}
    if(cav&&giu<.9){const m=new T.Color(MANTI[(f.seme||0)%MANTI.length]);d.position.set(f.x,f.y+bob*sc*.6-giu*.3*sc,f.z);d.rotation.set(sw*.06+giu*.2,f.yaw,giu*1.3,'YXZ');d.scale.set(sc,sc,sc);d.updateMatrix();metti(P.cavallo,n.cavallo++,m.r,m.g,m.b)}},
   fine(){for(const k of ord){const me=P[k];me.count=n[k];me.instanceMatrix.needsUpdate=true;me.instanceColor.needsUpdate=true}},
   via(){for(const k of ord){scene.remove(P[k]);P[k].geometry.dispose()}}}}
 // ---------- stendardi: asta e drappo che sventola, a istanze ----------
 function Stendardi(scene,max){const asta=new T.InstancedMesh(Solidi().box(.07,2.6,.07,0,0,0,'#6b4a2c').sfera(.11,0,2.66,0,'#e8c35a').geo(),matInst,max),d=new T.Object3D();asta.instanceColor=new T.InstancedBufferAttribute(new Float32Array(max*3).fill(1),3);
  const S=Solidi();for(let k=0;k<4;k++)S.box(.3,.74-k*.08,.05,.18+k*.3,1.82+k*.04,0,'#ffffff',{c2:'#e6e6e6'});S.box(.3,.2,.06,.48,2.1,0,'#d0d0d0');
  const drappo=new T.InstancedMesh(S.geo(),matInst,max);drappo.instanceColor=new T.InstancedBufferAttribute(new Float32Array(max*3).fill(1),3);
  for(const me of[asta,drappo]){me.count=0;me.frustumCulled=false;me.castShadow=true;scene.add(me)}let n=0;const c=new T.Color();
  return{inizio(){n=0},metti(x,y,z,colore,sc,t,fase){if(n>=max)return;d.position.set(x,y,z);d.rotation.set(0,0,0);d.scale.setScalar(sc||1);d.updateMatrix();asta.setMatrixAt(n,d.matrix);
    d.rotation.y=Math.sin(t*2.2+(fase||0))*.35-.2;d.scale.set(sc,sc*(1+Math.sin(t*5+(fase||0))*.04),sc);d.updateMatrix();drappo.setMatrixAt(n,d.matrix);c.set(colore);drappo.instanceColor.setXYZ(n,c.r,c.g,c.b);n++},
   fine(){asta.count=drappo.count=n;asta.instanceMatrix.needsUpdate=drappo.instanceMatrix.needsUpdate=true;drappo.instanceColor.needsUpdate=true},via(){scene.remove(asta);scene.remove(drappo)}}}
 // ---------- particelle: cubetti che salgono, cadono e svaniscono rimpicciolendo ----------
 function Particelle(scene,max){const me=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({vertexColors:false}),max),L=[],d=new T.Object3D(),c=new T.Color();
  me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(max*3).fill(1),3);me.count=0;me.frustumCulled=false;scene.add(me);
  return{n:()=>L.length,
   emetti(x,y,z,o){if(L.length>=max)return;o=o||{};L.push({x,y,z,vx:o.vx||0,vy:o.vy==null?.6:o.vy,vz:o.vz||0,g:o.g||0,v:0,dur:o.dur||1.2,t:0,s:o.s||.25,col:o.col||'#cccccc',col2:o.col2||null,cresce:o.cresce||0})},
   passo(dt){let k=0;for(let i=L.length-1;i>=0;i--){const p=L[i];p.t+=dt;if(p.t>=p.dur){L.splice(i,1);continue}p.vy-=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.g&&p.y<.05){p.y=.05;p.vy=0;p.vx*=.6;p.vz*=.6}}
    for(const p of L){const q=p.t/p.dur,s=p.s*(1+p.cresce*q)*(q>.6?(1-q)/.4:1);d.position.set(p.x,p.y,p.z);d.rotation.set(q*2,q*3,0);d.scale.setScalar(Math.max(.001,s));d.updateMatrix();me.setMatrixAt(k,d.matrix);
     c.set(p.col);if(p.col2)c.lerp(new T.Color(p.col2),q);me.instanceColor.setXYZ(k,c.r,c.g,c.b);k++}
    me.count=k;me.instanceMatrix.needsUpdate=true;me.instanceColor.needsUpdate=true},via(){scene.remove(me)}}}
 // sole, cielo e ombre per un'ora del giorno (0..24): restituisce tinta e quanta notte c'è
 function luce(scene){const sole=new T.DirectionalLight(0xffffff,1),amb=new T.HemisphereLight(0xbfd6ff,0x6b5a44,.55);sole.castShadow=true;sole.shadow.mapSize.set(1024,1024);sole.shadow.bias=-.0025;sole.shadow.normalBias=.04;
  scene.add(sole);scene.add(sole.target);scene.add(amb);const K=[[0,'#7088d8',.5,'#44589c'],[5,'#7890dc',.52,'#4a5ea0'],[6.5,'#ffb07a',.82,'#9a8fb0'],[9,'#fff1d6',1.02,'#bcd2ff'],[16,'#fff4dc',1.04,'#bcd2ff'],[19,'#ffb884',.9,'#b4a2bc'],[20.5,'#8078cc',.56,'#565c9c'],[24,'#7088d8',.5,'#44589c']];
  const a=new T.Color(),b=new T.Color(),giorno0=h=>h>=6&&h<=20;
  return{sole,amb,
   ora(h,fuoco,raggio){let i=0;while(i<K.length-2&&h>=K[i+1][0])i++;const k0=K[i],k1=K[i+1],t=Math.max(0,Math.min(1,(h-k0[0])/(k1[0]-k0[0])));
    sole.color.copy(a.set(k0[1]).lerp(b.set(k1[1]),t));sole.intensity=k0[2]+(k1[2]-k0[2])*t;amb.color.copy(a.set(k0[3]).lerp(b.set(k1[3]),t));amb.intensity=.5+(giorno0(h)?0:.1);
    const giorno=h>=5.5&&h<=20,ang=giorno?(h-5.5)/14.5*Math.PI:((h<5.5?h+24:h)-20)/9.5*Math.PI,ex=Math.cos(ang),ey=Math.max(.55,Math.sin(ang));
    const r=raggio||30;sole.position.set(fuoco.x+ex*60,fuoco.y+ey*70+10,fuoco.z+38);sole.target.position.set(fuoco.x,fuoco.y,fuoco.z);sole.target.updateMatrixWorld();
    const sc=sole.shadow.camera;sc.left=-r;sc.right=r;sc.top=r;sc.bottom=-r;sc.near=1;sc.far=260;sc.updateProjectionMatrix();
    const notte=h<5?1:h<6.5?1-(h-5)/1.5:h<19.5?0:h<21?(h-19.5)/1.5:1;return{notte}}}}
 return{A,avvia,monta,smonta,misura,camera,disegna,aTerra,aSchermo,Solidi,Schiera,Stendardi,Particelle,luce,qual,
  get T(){return T},get mat(){return matToon},get matI(){return matInst},get cv(){return cv},get grad(){return grad},SE,CE}})();
