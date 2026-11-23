/* ---- Compagnia di ventura (piano C): la bottega della grafica 3D, comune a mappa del mondo (24hu) e battaglia (24hv). ----
   Un solo canvas e un solo renderer. La scena si disegna su un bersaglio piccolo (circa 300 righe) con telecamera
   ortografica a tre quarti; la telecamera scatta sulla griglia dei pixel d'arte e lo scarto si recupera nell'ingrandimento:
   così lo scorrimento è liscio e i pixel non «nuotano». La rifinitura aggiunge contorni dalla profondità, retino e tinta dell'ora.
   Qui stanno anche: il costruttore di solidi a facce piatte (`Solidi`), le schiere di figure a istanze (`Schiera`),
   gli stendardi, le particelle. Nessuna regola di gioco: solo disegno. three.js r128 (VENDOR). Piano: docs/VENTURA.md. */
const VenArte=(()=>{
 let T=null,ren=null,cv=null,rt=null,post=null,postScene=null,postCam=null,grad=null,matToon=null,matInst=null;
 const A={pronta:false,fallita:false,carica:false,W:0,H:0,k:3,rw:0,rh:0,host:null,t:0,fps:60,nfps:0,lento:0};
 const RIGHE={alta:500,media:400,bassa:290,tv:450};
 const qual=()=>{if(typeof ui!=='undefined'&&ui.tv)return'tv';try{return localStorage.getItem('ven-q')||'media'}catch(e){return'media'}};   // la TV ha la sua (V7)
 const ELEV=52*Math.PI/180,SE=Math.sin(ELEV),CE=Math.cos(ELEV);
 function avvia(){if(A.pronta||A.fallita)return Promise.resolve(A.pronta);if(A.attesa)return A.attesa;
  A.attesa=VENDOR.load('three').then(()=>{T=THREE;A.pronta=accendi();return A.pronta},e=>{A.fallita=true;A.errore='libreria 3D non caricata';A.attesa=null;return false});return A.attesa}
 // Sul telefono i contesti WebGL sono pochi: la home e la mappa dell'Avventura ne tengono uno ciascuna, quindi si chiudono prima di aprire questo.
 // Se la creazione fallisce lo stesso si riprova una volta, poi si ricorda il motivo (si legge nel velo) e «Riprova» ricomincia da capo.
 function accendi(){for(const f of[()=>Crocevia.rilascia(),()=>Scena3D.rilascia()]){try{f()}catch(e){}}
  for(let i=0;i<2;i++){try{costruisci();A.errore='';return true}catch(e){A.errore=String((e&&e.message)||e).slice(0,120);ERR.n(e,'ventura-3d');scarta()}}
  A.fallita=true;return false}
 function riprova(){scarta();A.fallita=false;A.pronta=false;A.attesa=null;A.errore='';A.persa=false;A.W=0;A.host=null;A.t=0;A.nfps=0;return avvia()}
 // Il telefono può togliere il contesto grafico (memoria, scheda in secondo piano): il canvas resta bianco.
 // Si segna la perdita e `rifai` ricostruisce canvas, renderer e materiali; le scene le rifà chi le possiede (Ven.ripara).
 const persa=()=>!!(A.pronta&&(A.persa||(ren&&ren.getContext().isContextLost())));
 // dispose() non chiude il contesto: lo si chiude a mano, altrimenti i contesti persi restano vivi e il telefono smette di darne di nuovi
 function scarta(){try{if(rt){rt.depthTexture.dispose();rt.dispose()}}catch(e){}try{if(ren){ren.dispose();ren.forceContextLoss()}}catch(e){}if(cv){cv.width=cv.height=1}ren=null;rt=null}
 function rifai(){const vecchio=cv;scarta();A.persa=false;A.W=0;A.t=0;A.nfps=0;A.rinascite=(A.rinascite||0)+1;if(A.rinascite>=1&&A.lento<2)A.lento++;// a ogni perdita pixel d'arte più grossi: meno memoria
  try{costruisci();if(vecchio&&vecchio.parentNode){const h=vecchio.parentNode;h.removeChild(vecchio);A.host=null;monta(h)}return true}catch(e){A.fallita=true;A.pronta=false;ERR.n(e,'ventura-3d');return false}}
 function costruisci(){cv=document.createElement('canvas');cv.className='vn-cv';const mio=cv;cv.addEventListener('webglcontextlost',e=>{e.preventDefault();if(mio===cv)A.persa=true});// un canvas scartato (forceContextLoss) non deve far credere che la scena nuova sia persa
  ren=new T.WebGLRenderer({canvas:cv,antialias:false,alpha:false,powerPreference:'high-performance'});ren.setPixelRatio(1);// colori scritti come si vedono: nessuna conversione di spazio colore
  
  ren.shadowMap.enabled=(A.rinascite||0)<2;ren.shadowMap.type=T.PCFShadowMap;ren.autoClear=true;
  const g=new Uint8Array([70,70,70,255,138,138,138,255,205,205,205,255,255,255,255,255]);grad=new T.DataTexture(g,4,1,T.RGBAFormat);grad.minFilter=grad.magFilter=T.NearestFilter;grad.needsUpdate=true;
  matToon=new T.MeshToonMaterial({vertexColors:true,gradientMap:grad});matInst=new T.MeshToonMaterial({vertexColors:true,gradientMap:grad});// r128: un materiale non può servire insieme maglie semplici e a istanze colorate
  postCam=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene=new T.Scene();
  post=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tD:{value:null},tZ:{value:null},res:{value:new T.Vector2(1,1)},off:{value:new T.Vector2()},zr:{value:100},tinta:{value:new T.Vector3(1,1,1)},
    notte:{value:0},bordo:{value:.55},vig:{value:.35},lampo:{value:0},nebbia:{value:0}},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`precision highp float;varying vec2 vUv;uniform sampler2D tD;uniform sampler2D tZ;uniform vec2 res;uniform vec2 off;uniform float zr;uniform vec3 tinta;uniform float notte;uniform float bordo;uniform float vig;uniform float lampo;uniform float nebbia;
float bayer(vec2 p){vec2 q=floor(mod(p,4.));float i=q.x+q.y*4.;float v=0.;
 if(i<1.)v=0.;else if(i<2.)v=8.;else if(i<3.)v=2.;else if(i<4.)v=10.;else if(i<5.)v=12.;else if(i<6.)v=4.;else if(i<7.)v=14.;else if(i<8.)v=6.;
 else if(i<9.)v=3.;else if(i<10.)v=11.;else if(i<11.)v=1.;else if(i<12.)v=9.;else if(i<13.)v=15.;else if(i<14.)v=7.;else if(i<15.)v=13.;else v=5.;return v/16.-.47;}
void main(){vec2 tx=floor(1.+vUv*(res-2.)+off)+.5;vec2 uv=tx/res;vec3 c=texture2D(tD,uv).rgb;float d=texture2D(tZ,uv).x;
 vec2 e=1./res;float dn=min(min(texture2D(tZ,uv+vec2(e.x,0.)).x,texture2D(tZ,uv-vec2(e.x,0.)).x),min(texture2D(tZ,uv+vec2(0.,e.y)).x,texture2D(tZ,uv-vec2(0.,e.y)).x));
 float k=smoothstep(.55,1.1,(d-dn)*zr);c*=1.-k*bordo;
 float l=dot(c,vec3(.3,.59,.11));c=mix(c,vec3(l)*vec3(.6,.74,1.12),notte*.3);c*=tinta;c=mix(c,mix(vec3(.8,.84,.88),vec3(.3,.36,.5),notte),nebbia*(.14+.2*vUv.y));
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
  const u=post.uniforms;u.off.value.set(dx/w,du/w);u.zr.value=320-.1;u.notte.value=o.notte||0;u.lampo.value=o.lampo||0;u.nebbia.value=o.nebbia||0;if(o.tinta)u.tinta.value.set(o.tinta[0],o.tinta[1],o.tinta[2]);else u.tinta.value.set(1,1,1);
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
   agg(geo,x,y,z,colore,o){o=o||{};const g=geo.index?geo.toNonIndexed():geo;g.computeVertexNormals();e.set(o.rx||0,o.ry||0,o.rz||0,o.ord||'XYZ');q.setFromEuler(e);
    m.compose(v.set(x,y,z),q,new T.Vector3(o.sx||1,o.sy||1,o.sz||1));const nm=new T.Matrix3().getNormalMatrix(m),P=g.attributes.position,N=g.attributes.normal;c.set(colore);if(o.c2!=null)c2.set(o.c2);
    let y0=1e9,y1=-1e9;if(o.c2!=null)for(let i=0;i<P.count;i++){const yy=P.getY(i);if(yy<y0)y0=yy;if(yy>y1)y1=yy}
    for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const ty=o.c2!=null?(v.y-y0)/Math.max(1e-6,y1-y0):0;v.applyMatrix4(m);pos.push(v.x,v.y,v.z);n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();nor.push(n.x,n.y,n.z);
     if(o.c2!=null)col.push(c.r+(c2.r-c.r)*ty,c.g+(c2.g-c.g)*ty,c.b+(c2.b-c.b)*ty);else col.push(c.r,c.g,c.b)}
    S.n+=P.count;g.dispose();if(g!==geo)geo.dispose();return S},
   box(w,h,d,x,y,z,colore,o){return S.agg(new T.BoxGeometry(w,h,d),x,y+h/2,z,colore,o)},
   cil(r1,r2,h,seg,x,y,z,colore,o){return S.agg(new T.CylinderGeometry(r1,r2,h,seg),x,y+h/2,z,colore,o)},
   cono(r,h,seg,x,y,z,colore,o){return S.agg(new T.ConeGeometry(r,h,seg),x,y+h/2,z,colore,o)},
   sfera(r,x,y,z,colore,o){return S.agg(new T.IcosahedronGeometry(r,0),x,y,z,colore,o)},
   // tetto a due falde: prisma triangolare lungo z; ord 'YXZ' = prima si inclina il prisma, poi lo si gira (ry) attorno alla verticale come le scatole
   tetto(w,h,d,x,y,z,colore,o){const g=new T.CylinderGeometry(w*.5774,w*.5774,d,3);return S.agg(g,x,y+h*.33,z,colore,Object.assign({rx:-Math.PI/2,ord:'YXZ',sy:1,sz:h/(w*.866)},o||{}))},
   geo(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));return g},
   mesh(o){const me=new T.Mesh(S.geo(),matToon);me.castShadow=!(o&&o.ombra===false);me.receiveShadow=true;return me}};return S}
 // ---------- schiere di figure a istanze ----------
 // Ogni figura è fatta di pezzi scelti dal suo aspetto (`asp`, da VDAT.aspetto o dall'equipaggiamento del capitano): corpo e
 // corazza, testa ed elmo, arma, scudo, mantello, cavallo e barda. Un InstancedMesh per pezzo, colore per istanza: così ogni
 // truppa si riconosce a colpo d'occhio e l'equipaggiamento del capitano si vede addosso.
 function Schiera(scene,max){const d=new T.Object3D(),d2=new T.Object3D(),col=new T.Color(),c2=new T.Color(),c3=new T.Color(),hc=new T.Color(),So=Solidi;
  const pezzo=(S,ombra)=>{const me=new T.InstancedMesh(S.geo(),matInst,max);me.castShadow=ombra!==false;me.receiveShadow=false;me.count=0;me.frustumCulled=false;me.instanceMatrix.setUsage(T.DynamicDrawUsage);
   me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(max*3).fill(1),3);me.instanceColor.setUsage(T.DynamicDrawUsage);scene.add(me);return me};
  const P={};
  P.base=pezzo(So().cil(.62,.62,.05,10,0,.02,0,'#ffffff'),false);P.base.receiveShadow=true;
  P.corpo=pezzo(So().box(.2,.62,.24,-.15,0,0,'#6e665f').box(.2,.62,.24,.15,0,0,'#6e665f').box(.66,.62,.4,0,.6,0,'#ffffff',{c2:'#f2f2f2'}).box(.2,.5,.24,-.43,.7,0,'#e4e4e4').box(.2,.5,.24,.43,.7,0,'#e4e4e4').box(.66,.12,.4,0,.56,0,'#4a3a2c'));
  P.vest=pezzo(So().box(.72,.5,.46,0,.72,0,'#ffffff',{c2:'#e4e4e4'}),false);
  P.spall=pezzo(So().box(.3,.16,.36,-.44,1.1,0,'#ffffff').box(.3,.16,.36,.44,1.1,0,'#ffffff').box(.25,.3,.29,-.15,.04,0,'#dcdcdc').box(.25,.3,.29,.15,.04,0,'#dcdcdc'),false);
  P.testa=pezzo(So().box(.34,.32,.32,0,1.22,0,'#ffe2c0'));
  P.cappuccio=pezzo(So().box(.42,.36,.4,0,1.25,-.03,'#ffffff').box(.44,.16,.2,0,1.16,-.17,'#e2e2e2'),false);
  P.paglia=pezzo(So().cil(.44,.48,.06,8,0,1.52,0,'#c9a95a').cil(.2,.24,.14,7,0,1.56,0,'#b4974a'),false);
  P.berretto=pezzo(So().box(.4,.12,.4,0,1.52,0,'#ffffff').box(.22,.09,.22,.1,1.62,0,'#e0e0e0'),false);
  P.pelliccia=pezzo(So().box(.46,.24,.44,0,1.46,0,'#7a5a3c').box(.52,.1,.5,0,1.44,0,'#cbbb9e'),false);
  P.cervelliera=pezzo(So().box(.4,.16,.38,0,1.48,0,'#8a949f').box(.52,.05,.5,0,1.46,0,'#6f7883'),false);
  P.bacinetto=pezzo(So().box(.42,.38,.4,0,1.29,0,'#8e98a4').box(.3,.09,.08,0,1.38,.2,'#3a4048'),false);
  P.corna=pezzo(So().box(.42,.3,.4,0,1.36,0,'#858e99').box(.08,.32,.08,-.26,1.56,0,'#f2ead4',{rz:.55}).box(.08,.32,.08,.26,1.56,0,'#f2ead4',{rz:-.55}),false);
  P.cappello=pezzo(So().cil(.46,.46,.05,8,0,1.52,0,'#3a3030').cil(.2,.23,.17,7,0,1.56,0,'#4a3c3c'),false);
  P.cresta=pezzo(So().box(.09,.2,.46,0,1.66,-.02,'#ffffff'),false);
  P.piuma=pezzo(So().box(.08,.36,.12,.2,1.6,-.12,'#ffffff',{rx:-.5}),false);
  P.spada=pezzo(So().box(.07,.8,.07,.46,.86,.22,'#aeb7c1',{rx:.5}).box(.2,.06,.08,.46,.88,.12,'#8a6a2c'),false);
  P.sciabola=pezzo(So().box(.07,.5,.07,.46,.86,.2,'#dfe6ee',{rx:.5}).box(.07,.4,.07,.46,1.22,.44,'#e8eef4',{rx:1}).box(.18,.06,.08,.46,.88,.12,'#8a6a2c'),false);
  P.ascia=pezzo(So().box(.06,.9,.06,.46,.6,.2,'#7a5a3a',{rx:.4}).box(.06,.28,.32,.46,1.32,.58,'#cfd6de',{rx:.4}),false);
  P.mazza=pezzo(So().box(.06,.7,.06,.46,.7,.2,'#7a5a3a',{rx:.4}).box(.22,.22,.22,.46,1.32,.5,'#8a9099',{rx:.4}),false);
  P.lancia=pezzo(So().box(.06,2.1,.06,.46,.1,.16,'#6e5232').box(.08,.2,.08,.46,2.18,.16,'#9aa3ad'),false);
  P.alabarda=pezzo(So().box(.06,2.0,.06,.46,.1,.16,'#6e5232').box(.05,.36,.32,.46,1.86,.28,'#9ca5b0').box(.08,.22,.08,.46,2.08,.16,'#9aa3ad'),false);
  P.spadone=pezzo(So().box(.1,1.3,.08,.46,.8,.26,'#e3e9f0',{rx:.45}).box(.36,.07,.09,.46,.86,.12,'#8a6a2c'),false);
  P.arco=pezzo(So().box(.05,.5,.05,-.44,.95,.32,'#7a5230',{rx:.35}).box(.05,.5,.05,-.44,.5,.32,'#7a5230',{rx:-.35}).box(.3,.36,.14,.12,.86,-.26,'#6a4a2c'),false);
  P.balestra=pezzo(So().box(.08,.1,.6,.3,.9,.3,'#7a5230').box(.6,.06,.06,.3,.92,.52,'#5a4028').box(.3,.36,.14,.12,.86,-.26,'#6a4a2c'),false);
  P.tondo=pezzo(So().cil(.32,.32,.08,8,-.54,.56,.12,'#ffffff',{rz:1.5708}).cil(.1,.1,.12,6,-.57,.82,.12,'#d0d0d0',{rz:1.5708}),false);
  P.mandorla=pezzo(So().box(.1,.62,.5,-.52,.62,.1,'#ffffff').box(.1,.3,.34,-.52,.36,.1,'#f0f0f0').box(.12,.2,.16,-.54,.82,.1,'#d8d8d8'),false);
  P.pavese=pezzo(So().box(.1,.96,.62,-.54,.34,.12,'#ffffff').box(.12,.96,.12,-.56,.34,.12,'#d0d0d0'),false);
  P.mantello=pezzo(So().box(.62,.84,.08,0,.4,-.25,'#ffffff',{c2:'#dedede',rx:-.14}),false);
  P.cavallo=pezzo(So().box(.56,.6,1.5,0,.72,0,'#ffffff').box(.34,.66,.36,0,1.1,.74,'#f4f4f4',{rx:-.5}).box(.3,.3,.56,0,1.54,1.06,'#ececec').box(.16,.74,.18,-.19,0,.58,'#d8d8d8').box(.16,.74,.18,.19,0,.58,'#d8d8d8')
   .box(.16,.74,.18,-.19,0,-.58,'#d8d8d8').box(.16,.74,.18,.19,0,-.58,'#d8d8d8').box(.12,.6,.12,0,.6,-.82,'#5a5a5a',{rx:.4}).box(.6,.14,.7,0,1.3,-.05,'#b0b0b0'));
  P.barda=pezzo(So().box(.64,.5,1.34,0,.78,-.04,'#ffffff',{c2:'#e2e2e2'}).box(.4,.32,.32,0,1.16,.72,'#f0f0f0',{rx:-.5}),false);
  // oltre il tetto (livello 2): un omino di due scatole senza ombra (gambe e busto tinti, testa a parte); lo stesso omino allungato fa da cavallo.
  P.omino=pezzo(So().box(.56,.62,.34,0,0,0,'#6e665f').box(.66,.62,.4,0,.6,0,'#ffffff',{c2:'#f2f2f2'}),false);
  P.capo=pezzo(So().box(.34,.32,.32,0,1.22,0,'#ffe2c0'),false);
  const ord=Object.keys(P),n={};const MANTI=['#8a5a34','#5c3c26','#b89468','#3a302c','#e6e0d4','#6e4a2e'],COR=[null,'#8a5a34','#6f7882','#98a1ab'],ELMO={paglia:'paglia',cappuccio:'cappuccio',berretto:'berretto',pelliccia:'pelliccia',cervelliera:'cervelliera',bacinetto:'bacinetto',crestato:'bacinetto',piuma:'cappello',corna:'corna'};
  let LV=0;   // livello di dettaglio di base
  const L2V=new T.Matrix4().makeScale(.85,1.08,3.6),m2=new T.Matrix4(),zero=new T.Matrix4().makeScale(0,0,0);
  const m=(k,r,g,b,mat)=>{const me=P[k],i=n[k];if(i>=max)return;me.setMatrixAt(i,mat||d.matrix);me.instanceColor.setXYZ(i,r,g,b);n[k]=i+1};
  return{P,
   // 0 figure intere, 2 omino di due scatole senza ombra (oltre il tetto), 1 senza armi, scudi e parti piccole (i pezzi a istanze restano gli stessi: le draw call non cambiano)
   livello(v){LV=v|0},
   inizio(){for(const k of ord)n[k]=0},
   // f: {x,y,z,yaw,sc,col,col2,asp,cav,fase,colpo,giu,lampo,seme}
   metti(f){const lv=f.liv!=null?f.liv:LV,sc=f.sc||1,a=f.asp||{},cav=!!f.cav,giu=f.giu||0,fase=f.fase||0,sw=Math.sin(fase*6.283),bob=cav?Math.abs(sw)*.1:Math.abs(sw)*.07,colpo=f.colpo||0,aff=Math.sin(colpo*3.1416),L=f.lampo?1.7:0,sd=f.scuro||0,W=L||1-sd;   // scuro: i caduti a terra sono più scuri (0..1)
    col.set(f.col||'#888');c2.set(f.col2||'#ccc');c3.set(a.col||f.col||'#888');if(!a.col)c3.multiplyScalar(.72);if(sd){col.multiplyScalar(1-sd);c2.multiplyScalar(1-sd);c3.multiplyScalar(1-sd)}const yb=f.y+(cav?.78*sc:0)+bob*sc;
    d.position.set(f.x,yb-giu*(cav?.5:.05)*sc,f.z);d.rotation.set(0,0,0);d.rotation.order='YXZ';d.rotation.y=f.yaw;d.rotation.x=giu*1.45+aff*.22+(cav?0:sw*.03);d.rotation.z=cav?0:sw*.05;d.scale.set(sc,sc*(1-giu*.2),sc);d.updateMatrix();
    if(f.base&&giu<.5&&lv<2){const kb=new T.Color(f.base),mb=new T.Matrix4().compose(new T.Vector3(f.x,f.y,f.z),new T.Quaternion(),new T.Vector3(sc*(cav?1.5:1),sc,sc*(cav?1.5:1)));m('base',kb.r,kb.g,kb.b,mb)}
    if(lv>1){m('omino',L||col.r,L||col.g,L||col.b);m('capo',L||1,L||1,L||1)}else{m('corpo',L||col.r,L||col.g,L||col.b);m('testa',W,W,W)}
    if(a.cor>0&&lv<2){const k=new T.Color(COR[a.cor]).lerp(col,.4);m('vest',L||k.r,L||k.g,L||k.b);if(a.cor===3&&!lv)m('spall',L||k.r,L||k.g,L||k.b)}
    const el=lv>1?null:ELMO[a.elmo];if(el){const tinto=el==='cappuccio'||el==='berretto',h=tinto?c3:hc.setRGB(W,W,W).lerp(col,.35);m(el,L||h.r,L||h.g,L||h.b);if(!lv){if(a.elmo==='crestato')m('cresta',c2.r,c2.g,c2.b);else if(a.elmo==='piuma')m('piuma',c2.r,c2.g,c2.b)}}
    if(a.mant&&!lv)m('mantello',L||c3.r,L||c3.g,L||c3.b);
    if(giu<.5&&!lv){const arma=a.arma||'spada';
     if(arma==='arco'||arma==='balestra')m(arma,W,W,W);
     else{d2.position.copy(d.position);d2.rotation.copy(d.rotation);d2.rotation.x+=aff*1.1;d2.scale.copy(d.scale);if(arma==='picca')d2.scale.y*=1.15;d2.updateMatrix();m(arma==='picca'?'lancia':P[arma]?arma:'spada',W,W,W,d2.matrix)}
     if(a.scudo&&P[a.scudo])m(a.scudo,c2.r,c2.g,c2.b)}
    if(cav&&giu<.9){const mt=new T.Color(MANTI[(a.manto!=null?a.manto:(f.seme||0))%MANTI.length]);if(sd)mt.multiplyScalar(1-sd);d.position.set(f.x,f.y+bob*sc*.6-giu*.3*sc,f.z);d.rotation.set(sw*.06+giu*.2,f.yaw,giu*1.3,'YXZ');d.scale.set(sc,sc,sc);d.updateMatrix();if(lv>1){m('omino',mt.r,mt.g,mt.b,m2.multiplyMatrices(d.matrix,L2V));return}m('cavallo',mt.r,mt.g,mt.b);if(a.barda)m('barda',col.r,col.g,col.b)}},
   // se c'è almeno una figura ogni pezzo si disegna (un'istanza schiacciata se vuoto): le draw call non dipendono da quanti uomini ci sono, da chi è in vista o da chi passa il tetto
   fine(){const tutti=ord.some(k=>n[k]>0);if(tutti)for(const k of ord)if(!n[k])m(k,1,1,1,zero);
    for(const k of ord){const me=P[k];me.count=n[k];me.visible=n[k]>0;me.instanceMatrix.needsUpdate=true;me.instanceColor.needsUpdate=true}},
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
 return{A,avvia,riprova,monta,smonta,persa,rifai,misura,camera,disegna,aTerra,aSchermo,Solidi,Schiera,Stendardi,Particelle,luce,qual,
  get T(){return T},get mat(){return matToon},get matI(){return matInst},get cv(){return cv},get ren(){return ren},get grad(){return grad},SE,CE}})();
