/* ---- Scena 3D (Cantari di Ventura, A12): un canvas three.js sotto l'SVG della battaglia e della mappa del mondo. ----
   Il 3D disegna terreno, rilievi, oggetti, luce e ombre; l'SVG sopra resta la plancia di gioco (tocchi, zoom, evidenziazioni, PF, stati, numeri).
   La telecamera è obliqua e coincide al pixel con il viewBox dell'SVG (ASCE.proiez): niente picking, niente gesti nuovi. Le viste chiedono `Scena3D.on()` a ogni disegno
   e saltano il terreno se è vero. three.js (r128) si carica su richiesta; senza WebGL, con telefono lento o con «Grafica 3D: no» resta l'SVG di sempre.
   Qui: ciclo di vita, telecamera, terreno e oggetti fissi, luce da ambiente cotto (PMREM da un cielo procedurale), ombre, sonda dei fps, impostazione.
   `Scena3D.disegna(K)`, se c'è, disegna al posto di `K.ren.render` (la resa pixel di 24hp-pixel.js). Con `Scena3D.pixel(true)` (B2) la scena passa alla resa
   pixel: materiali a bande (luce, mezzaluce, ombra) con riflesso freddo e luce di contorno, pavimento a tessere 16×16 dal tema del bioma, muri alti,
   fino a 4 luci puntiformi calde (torce, fuochi, bracieri), luce da ASCE.lucePx; i materiali sono gli stessi, una divisa (uBande) sceglie la resa.
   Miniature, particelle e animazioni: 24ho-scena-fx.js. Forme e quote: motori/28f (ASCE) e 28g (AMIN). Piano: docs/AVVENTURA-A12.md. */
const Scena3D=(()=>{
 const LS='avv-3d',VEG=new Set(['albero','albero-secco','bosco','albero-solo','canne','ciuffi','fiori']),RUOTA=new Set(['albero','albero-secco','bosco','albero-solo','picco','roccia','masso','canne','ciuffi','sassi','fiori','stalagmite']);
 let T=null;
 const K={pronta:false,fallita:false,carico:null,wrap:null,modo:null,sigT:'',sigO:'',sigL:'',px:false,Lp:null,luciP:[],cv:null,ren:null,scn:null,cam:null,sun:null,hemi:null,pm:null,env:null,envK:'',fondo:null,suolo:null,
  g:{terr:null,ogg:null,acq:null,sup:null,fig:null,fx:null},mat:{},W:0,H:0,dpr:1,vis:null,sucio:true,raf:0,tAmb:0,t0:0,uT:{value:0},uLum:{value:1},sonda:null,L:null,P:null,D:null,bbox:null,SQ:1,vb:''};
 const impo=()=>{try{return localStorage.getItem(LS)||'auto'}catch(e){return'auto'}};
 const scrivi=v=>{try{localStorage.setItem(LS,v)}catch(e){}};
 // ---- colori: esadecimale sRGB → [r,g,b] lineare (three r128 non converte da solo) ----
 const colori=new Map();
 function C(hex,m){let c=colori.get(hex);if(!c){const k=new T.Color(hex);if(k.convertSRGBToLinear&&!(T.ColorManagement&&T.ColorManagement.enabled))k.convertSRGBToLinear();c=[k.r,k.g,k.b];colori.set(hex,c)}return m==null?c:[c[0]*m,c[1]*m,c[2]*m]}
 const mescola=(a,b,k)=>{const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16),f=(s,i)=>Math.round(((x>>s)&255)*(1-k)+((y>>s)&255)*k);return'#'+((1<<24)|(f(16)<<16)|(f(8)<<8)|f(0)).toString(16).slice(1)};
 const scuro=(h,k)=>AMIN.scuro(h,k);
 // ---- geometrie unitarie non indicizzate (una volta sola) ----
 const GU={};
 function gu(k){if(GU[k])return GU[k];let g;
  if(k==='k')g=new T.CylinderGeometry(0,1,1,7,1);else if(k==='s')g=new T.SphereGeometry(1,8,6);else if(k==='b')g=new T.BoxGeometry(1,1,1);else if(k==='hex')g=new T.CylinderGeometry(1,1,1,6,1);
  else{const[a,b]=k.slice(1).split('_').map(Number);g=new T.CylinderGeometry(a/10,b/10,1,8,1)}
  g=g.toNonIndexed();const p=g.attributes.position.array,n=g.attributes.normal.array;let y0=1e9,y1=-1e9;for(let i=1;i<p.length;i+=3){y0=Math.min(y0,p[i]);y1=Math.max(y1,p[i])}
  return GU[k]={p,n,y0,y1,N:p.length/3}}
 const V=t=>t?{pos:[],nor:[],col:[],sw:[],tex:[]}:{pos:[],nor:[],col:[],sw:[]};
 const tx=(A,a,b,c)=>{if(A.tex)A.tex.push(a,b,c)};
 // aggiunge una geometria unitaria trasformata da M, con colore c (lineare) e occlusione cotta: più scuro in basso (ao = quanto)
 function metti(A,gk,M,c,ao,sway){const g=gu(gk),nm=metti.nm||(metti.nm=new T.Matrix3()),v=metti.v||(metti.v=new T.Vector3()),n=metti.n||(metti.n=new T.Vector3());nm.getNormalMatrix(M);
  for(let i=0;i<g.N;i++){v.set(g.p[i*3],g.p[i*3+1],g.p[i*3+2]);const u=(v.y-g.y0)/(g.y1-g.y0);v.applyMatrix4(M);A.pos.push(v.x,v.y,v.z);
   n.set(g.n[i*3],g.n[i*3+1],g.n[i*3+2]).applyMatrix3(nm).normalize();A.nor.push(n.x,n.y,n.z);const f=1-ao+ao*u;A.col.push(c[0]*f,c[1]*f,c[2]*f);A.sw.push(sway?Math.min(1,Math.max(0,(v.y-2)/34)):0);tx(A,0,0,-1)}}
 // una tessera esagonale: cima e fianchi di colore diverso, fianchi sfumati verso il basso
 function tessera(A,M,top,side,tex){const g=gu('hex'),nm=tessera.nm||(tessera.nm=new T.Matrix3()),v=tessera.v||(tessera.v=new T.Vector3()),n=tessera.n||(tessera.n=new T.Vector3());nm.getNormalMatrix(M);
  for(let i=0;i<g.N;i++){v.set(g.p[i*3],g.p[i*3+1],g.p[i*3+2]);const u=v.y+.5;v.applyMatrix4(M);A.pos.push(v.x,v.y,v.z);n.set(g.n[i*3],g.n[i*3+1],g.n[i*3+2]).applyMatrix3(nm).normalize();A.nor.push(n.x,n.y,n.z);
   const alto=g.n[i*3+1]>.5,sotto=g.n[i*3+1]<-.5,f=alto?1:sotto?.35:.5+.5*u,c=alto?top:side;A.col.push(c[0]*f,c[1]*f,c[2]*f);A.sw.push(0);
   if(tex&&alto)tx(A,tex[0],tex[1],0);else if(tex&&tex[2]&&!sotto)tx(A,tex[2][0],tex[2][1],1);else tx(A,0,0,-1)}}
 function mesh(A,mat,o){o=o||{};const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(Float32Array.from(A.pos),3));g.setAttribute('normal',new T.BufferAttribute(Float32Array.from(A.nor),3));
  g.setAttribute('color',new T.BufferAttribute(Float32Array.from(A.col),3));if(o.sway)g.setAttribute('aSw',new T.BufferAttribute(Float32Array.from(A.sw),1));if(A.tex)g.setAttribute('aTex',new T.BufferAttribute(Float32Array.from(A.tex),3));
  const m=new T.Mesh(g,mat);m.frustumCulled=false;m.castShadow=o.cast!==false;m.receiveShadow=o.rec!==false;return m}
 function matrice(x,y,z,ry,rz,sx,sy,sz){const e=new T.Euler(0,ry||0,rz||0,'YZX'),q=new T.Quaternion().setFromEuler(e);return new T.Matrix4().compose(new T.Vector3(x,y,z),q,new T.Vector3(sx,sy,sz))}
 // un pezzo ASCE/AMIN [forma, colore, x, y, z, a, b, c, ry, rz, flag] posto in (ox, oy, oz) con rotazione `ro` e scala `so`; `mul` schiarisce o scurisce
 function pezzo(A,p,ox,oy,oz,ro,so,mul,ao,sway){const f=p[0],co=Math.cos(ro),si=Math.sin(ro),x=(p[2]*co+p[4]*si)*so,z=(-p[2]*si+p[4]*co)*so,y=p[3]*so,a=p[5]*so,b=p[6]*so,c=p[7]*so,col=C(p[1],mul);let M,k;
  if(f==='c'){const m=Math.max(a,b)||.01;k='c'+Math.round(a/m*10)+'_'+Math.round(b/m*10);M=matrice(ox+x,oy+y,oz+z,p[8]+ro,p[9],m,c,m)}
  else if(f==='k'){k='k';M=matrice(ox+x,oy+y,oz+z,p[8]+ro,p[9],a,c,a)}
  else if(f==='s'){k='s';M=matrice(ox+x,oy+y,oz+z,p[8]+ro,p[9],a,b,c)}
  else{k='b';M=matrice(ox+x,oy+y,oz+z,p[8]+ro,p[9],a,b,c)}
  metti(A,k,M,col,ao==null?.5:ao,sway)}
 // ---- ciclo di vita ----
 const attivo=()=>{const i=impo();return i!=='no'&&i!=='lento'};
 function on(){return K.pronta&&!K.fallita&&attivo()}
 function avvia(){if(K.carico||K.fallita||!attivo())return K.carico;
  K.carico=(async()=>{try{if(!VENDOR.gl())throw new Error('niente WebGL');await VENDOR.load('three');T=window.THREE;crea();K.pronta=true;if(typeof render==='function')render()}
   catch(e){K.fallita=true;console.warn('Grafica 3D non disponibile:',e&&e.message);if(typeof render==='function')render()}})();return K.carico}
 function crea(){const cv=document.createElement('canvas');cv.className='s3-cv';cv.setAttribute('aria-hidden','true');K.cv=cv;
  const ren=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});ren.outputEncoding=T.sRGBEncoding;ren.toneMapping=T.ACESFilmicToneMapping;ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;K.ren=ren;
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();K.fallita=true;parcheggia();if(typeof render==='function')render()});
  const scn=new T.Scene();K.scn=scn;K.cam=new T.Camera();
  K.hemi=new T.HemisphereLight('#dbe8ff','#5a4a30',.3);scn.add(K.hemi);
  const sun=new T.DirectionalLight('#fff0d0',1);sun.castShadow=true;sun.shadow.bias=-.0009;sun.shadow.normalBias=.5;scn.add(sun);scn.add(sun.target);K.sun=sun;
  K.pm=new T.PMREMGenerator(ren);
  for(const g of['terr','ogg','acq','sup','fig','fx']){K.g[g]=new T.Group();scn.add(K.g[g])}
  const std=(o)=>new T.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.9,metalness:0,flatShading:true,envMapIntensity:.55},o));
  K.mat.terr=std({});K.mat.ogg=std({});K.mat.veg=std({roughness:.95});
  K.mat.veg.onBeforeCompile=sh=>{sh.uniforms.uT=K.uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;attribute float aSw;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.x+=sin(uT*1.5+transformed.z*.09+transformed.x*.05)*aSw*1.5;transformed.z+=cos(uT*1.2+transformed.x*.07)*aSw*.8;')};
  K.mat.lum=new T.MeshBasicMaterial({vertexColors:true});K.mat.lum.onBeforeCompile=sh=>{sh.uniforms.uL=K.uLum;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uL;').replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*=uL;')};
  K.mat.acq=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,transparent:true,opacity:.88,roughness:.3,metalness:.04,envMapIntensity:.6,flatShading:true,depthWrite:false});
  K.mat.ghi=new T.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.92,roughness:.22,metalness:.08,envMapIntensity:.7,flatShading:true});
  K.mat.ven=new T.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.88,roughness:.45,envMapIntensity:.3,flatShading:true,depthWrite:false});
  K.mat.onde=ondeTex();K.mat.acq.map=K.mat.onde;
  bandeU();bande(K.mat.terr,{terr:true});bande(K.mat.ogg);bande(K.mat.veg);for(const k of['acq','ghi','ven'])bande(K.mat[k],{maschera:-1});
  for(let i=0;i<4;i++){const l=new T.PointLight('#ffb347',0,110,1.4);l.castShadow=false;K.luciP.push(l)}
  if(Scena3D.creaFx)Scena3D.creaFx();
  if(typeof ResizeObserver!=='undefined')K.ro=new ResizeObserver(()=>{if(K.wrap)dimensiona(true)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sporca()})}
 // trama delle onde (si sposta nel tempo): righe chiare morbide su fondo bianco, ripetuta
 function ondeTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,128,128);g.strokeStyle='rgba(120,170,215,.55)';g.lineWidth=5;g.lineCap='round';
  for(const [x,y,w] of[[8,20,50],[70,52,44],[22,92,56],[80,112,36]]){g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+w/2,y-8,x+w,y);g.stroke()}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;return t}
 // ---- resa pixel (B2): materiali a bande. Una divisa sceglie fra la luce di sempre e quella a bande, senza ricompilare ----
 // Bande: per ogni luce t = N·L × intensità (1 = sole pieno); t > S1 luce, t > S2 mezzaluce, sotto ombra. Ombra = luce ambiente blu-viola,
 // più un riflesso freddo sulle facce rivolte in basso e la luce di contorno (rim) sulle figure. Il terreno a tessere legge l'atlante di ASCE.
 // Alfa del bersaglio = maschera per la rifinitura: 0,5 sulle figure (lì niente retino della nebbia), 1 altrove; i trasparenti la lasciano com'è.
 const PARS_B=`uniform float uBande,uRif,uS1,uS2,uRimS,uMaschera;uniform vec3 uAmb,uRifl,uRim;
void RE_Direct_Bande(const in IncidentLight dl,const in GeometricContext g,const in PhysicalMaterial m,inout ReflectedLight rl){
 if(uBande<.5){RE_Direct_Physical(dl,g,m,rl);return;}
 vec3 c=dl.color*PI;float L=max(max(c.r,c.g),c.b);if(L<=0.)return;
 float t=saturate(dot(g.normal,dl.direction))*L/uRif,q=t>uS1?1.:t>uS2?.5:0.;
 rl.directDiffuse+=c/L*uRif*q*BRDF_Diffuse_Lambert(m.diffuseColor);}
#undef RE_Direct
#define RE_Direct RE_Direct_Bande`;
 const FINE_LUCI=`if(uBande<.5){
#include <lights_fragment_end>
}else{vec3 nW=inverseTransformDirection(geometry.normal,viewMatrix);
 reflectedLight.indirectDiffuse+=(uAmb+uRifl*step(.18,-nW.y))*BRDF_Diffuse_Lambert(material.diffuseColor)*PI;
 reflectedLight.indirectDiffuse+=uRim*step(uRimS,1.-abs(geometry.normal.z))*step(-.25,nW.y);}`;
 const FINE_B='#include <dithering_fragment>\nif(uBande>.5&&uMaschera>=0.&&gl_FragColor.a>.999)gl_FragColor.a=uMaschera;';
 // tessere: aTex = (materiale, spostamento di tono, faccia: 0 sopra, 1 fianco del muro, −1 niente); coordinate del mondo → texel 1:1 coi pixel d'arte
 const VS_T=['attribute vec3 aTex;varying vec3 vTex;varying vec3 vWp;','vTex=aTex;vWp=(modelMatrix*vec4(transformed,1.)).xyz;'];
 const FS_T=`uniform sampler2D tAtlas,tPal;uniform vec2 uKt;uniform float uKc;varying vec3 vTex;varying vec3 vWp;`;
 const FS_T2=`if(uBande>.5&&vTex.z>-.5){vec2 tx=vTex.z<.5?floor(vec2(vWp.x*uKt.x,vWp.z*uKt.y)):floor(vec2(vWp.x*uKt.x,-vWp.y*uKc));
 vec2 cel=floor(tx/16.),loc=tx-cel*16.;float v=floor(fract(sin(dot(cel,vec2(12.9898,78.233)))*43758.5453)*6.);
 float i=floor(texture2D(tAtlas,(vec2(v*16.,vTex.x*16.)+loc+.5)/vec2(96.,64.)).r*255.+.5),r=floor(i/5.);i=clamp(i+vTex.y,r*5.,r*5.+4.);
 diffuseColor.rgb*=sRGBToLinear(texture2D(tPal,vec2((i+.5)/40.,.5))).rgb;}`;
 function bandeU(){const pal=APAL.paletta(),A=ASCE.atlante(),d=new Uint8Array(A.w*A.h*4);for(let i=0;i<A.dati.length;i++)d[i*4]=A.dati[i];
  const tex=(arr,w,h)=>{const t=new T.DataTexture(arr,w,h,T.RGBAFormat);t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t};
  const k=APAL.k(),C=APAL.CAMERA;
  K.U={uBande:{value:0},uRif:{value:Math.PI},uS1:{value:.6},uS2:{value:.25},uRimS:{value:.62},uAmb:{value:new T.Color(0,0,0)},uRifl:{value:new T.Color(0,0,0)},
   tAtlas:{value:tex(d,A.w,A.h)},tPal:{value:tex(pal,40,1)},uKt:{value:new T.Vector2(k,k*C.sin)},uKc:{value:k*C.cos}}}
 // aggiunge le bande a un materiale standard; o = { terr (tessere), rim ('eroi'|'nemici'), maschera (0,5 figure, 1 scena, −1 trasparenti) }
 function bande(mat,o){o=o||{};const prima=mat.onBeforeCompile,proprie={uRim:{value:new T.Color(0,0,0)},uMaschera:{value:o.maschera==null?1:o.maschera}};
  mat.userData.bande=proprie;mat.userData.rim=o.rim||null;
  mat.onBeforeCompile=(sh,r)=>{if(prima&&prima!==T.Material.prototype.onBeforeCompile)prima(sh,r);Object.assign(sh.uniforms,K.U,proprie);
   let f=sh.fragmentShader.replace('#include <lights_physical_pars_fragment>','#include <lights_physical_pars_fragment>\n'+PARS_B)
    .replace('#include <lights_fragment_end>',FINE_LUCI).replace('#include <dithering_fragment>',FINE_B);
   if(o.terr){f=f.replace('#include <common>','#include <common>\n'+FS_T).replace('#include <color_fragment>','#include <color_fragment>\n'+FS_T2);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+VS_T[0]).replace('#include <begin_vertex>','#include <begin_vertex>\n'+VS_T[1])}
   sh.fragmentShader=f};
  const chiave=(prima&&prima.toString())||'';mat.customProgramCacheKey=()=>'bande|'+(o.terr?'t':'')+'|'+chiave}
 // la tinta di ASCE.lucePx ([esadecimale, forza]) come colore lineare con il canale più forte a 1, per la forza
 function tinta(c,v){const q=C(v[0]),m=Math.max(q[0],q[1],q[2])||1;c.setRGB(q[0]/m*v[1],q[1]/m*v[1],q[2]/m*v[1])}
 // accende o spegne la resa pixel: luce a bande, tessere e temi, niente toni ACES (la palette fa il resto), luci puntiformi, niente pavimento sotto
 function pixel(on){on=!!on;if(!K.pronta||K.px===on)return;K.px=on;K.U.uBande.value=on?1:0;
  K.ren.toneMapping=on?T.NoToneMapping:T.ACESFilmicToneMapping;for(const l of K.luciP){if(on)K.scn.add(l);else K.scn.remove(l)}
  if(K.suolo)K.suolo.visible=!on;K.sigT=K.sigO=K.sigL='';if(K.modo)sync(K.modo);sporca()}
 // ---- montaggio nella schermata ----
 const trova=()=>document.querySelector('.bt-mappa')||document.querySelector('.mo-mappa');
 function parcheggia(){if(K.raf){cancelAnimationFrame(K.raf);K.raf=0}if(K.cv&&K.cv.parentNode)K.cv.parentNode.removeChild(K.cv);if(K.wrap){K.wrap.classList.remove('s3');if(K.ro)K.ro.unobserve(K.wrap)}K.wrap=null;document.documentElement.classList.remove('s3-on')}
 // dopo ogni disegno dell'app: aggancia il canvas alla mappa che c'è (se c'è) e porta la scena allo stato
 function dopo(){
  try{const w=trova();if(!w||!attivo()||K.fallita){if(K.wrap||K.cv&&K.cv.parentNode)parcheggia();return}
   if(!K.pronta){avvia();return}
   const modo=w.classList.contains('bt-mappa')?'bat':'mon';
   if(K.wrap!==w){if(K.wrap&&K.ro)K.ro.unobserve(K.wrap);K.wrap=w;if(K.ro)K.ro.observe(w)}
   if(K.cv.parentNode!==w||w.firstChild!==K.cv)w.insertBefore(K.cv,w.firstChild);w.classList.add('s3');document.documentElement.classList.add('s3-on');
   if(K.modo!==modo){K.modo=modo;K.sigT=K.sigO=K.sigL='';svuota()}
   dimensiona(false);sync(modo);vista();avviaCiclo()}
  catch(e){K.fallita=true;if(typeof ERR!=='undefined')ERR.n(e,'scena3d');else console.warn(e);parcheggia();if(typeof render==='function')render()}}
 function dimensiona(forza){const w=K.wrap;if(!w)return;const W=w.clientWidth|0,H=w.clientHeight|0;if(!W||!H)return;
  const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1,Math.sqrt(2.4e6/(W*H))));if(!forza&&W===K.W&&H===K.H&&dpr===K.dpr)return;K.W=W;K.H=H;K.dpr=dpr;K.ren.setPixelRatio(dpr);K.ren.setSize(W,H,false);K.cv.style.width='100%';K.cv.style.height='100%';vista();sporca()}
 const sporca=()=>{K.sucio=true;avviaCiclo()};
 // la telecamera segue il viewBox dell'SVG
 function vista(){const svg=K.wrap&&K.wrap.querySelector('.bt-svg,.mo-svg');if(!svg||!K.W)return;const b=svg.viewBox.baseVal;if(!b||!b.width)return;const vb=[b.x,b.y,b.width,b.height],k=vb.join(',')+'|'+K.W+'|'+K.H+'|'+K.SQ;if(k===K.vb)return;K.vb=k;
  const P=ASCE.proiez({vb,px:[K.W,K.H],SQ:K.SQ});K.P=P;K.cam.projectionMatrix.fromArray(P.m);K.cam.projectionMatrixInverse.copy(K.cam.projectionMatrix).invert();K.cam.matrixWorld.identity();K.cam.matrixWorldInverse.identity();K.cam.matrixAutoUpdate=false;K.vis=P.vis;sporca()}
 // ---- contenuto ----
 function svuota(){for(const n of['terr','ogg','acq','sup','fig']){const g=K.g[n];if(!g)continue;while(g.children.length){const c=g.children.pop();libera(c)}}if(Scena3D.resetFx)Scena3D.resetFx()}
 function libera(o){o.traverse&&o.traverse(c=>{if(c.geometry)c.geometry.dispose()});if(o.parent)o.parent.remove(o)}
 function sync(modo){const d=modo==='bat'?arenaDa():mondoDa();if(!d)return;K.SQ=d.D.SQ;costruisci(modo,d);if(Scena3D.sincFigure)Scena3D.sincFigure(modo)}
 function arenaDa(){const s=typeof Bat!=='undefined'&&Bat.s;if(!s||!s.arena)return null;const A=s.arena,px=K.px?1:0,fase=A.fase||'giorno',liv=ASCE.livello(A.perdizione|0);
  // fase e perdizione dell'arena sono facoltative (la pagina di prova della resa pixel le mette); senza, giorno e nessuna perdizione
  return{D:ASCE.arena(A,{temi:!!px}),A,pal:BatMappa.PAL[A.ambiente]||BatMappa.PAL.pianura,s,
  sigT:'b|'+A.id+'|'+A.ambiente+'|'+A.righe.join('')+'|'+(A.sup||[]).join('')+'|'+px,sigO:'b|'+A.id+'|'+A.ambiente+'|'+A.righe.join('')+'|'+px+'|'+fase+'|'+liv,fase,liv,amb:A.ambiente}}
 function mondoDa(){const s=typeof Camp!=='undefined'&&Camp.s;if(!s||!s.celle)return null;const liv=ASCE.livello(s.perdizione|0),D=ASCE.mondo(s,{vista:AMOS.VISTA,livello:liv});
  let a='',b='';for(const t of D.tiles){a+=t.visto?(t.vicino?2:1):0;b+=t.visto?1:0}
  return{D,s,sigT:'m|'+a+'|'+liv,sigO:'m|'+b+'|'+s.fase+'|'+liv+'|'+Object.values(s.luoghi||{}).map(l=>(l.ripulito?1:0)+(l.assedio?2:0)).join(''),fase:s.fase,liv,amb:null}}
 function costruisci(modo,d){
  const L=ASCE.luce(modo,{fase:d.fase,ambiente:d.amb,liv:d.liv});L.fondo=d.pal?d.pal.bg:'#0f0b08';K.L=L;
  // resa pixel: la tabella delle luci del tema (B2) decide sole, torce e finestre
  K.Lp=K.px?ASCE.lucePx(d.D.tema||d.amb||'foresta',d.fase,d.liv):null;if(K.Lp){L.torce=K.Lp.torce;L.finestre=K.Lp.finestre;L.sole=Object.assign({},K.Lp.sole)}
  const sigL=modo+'|'+d.fase+'|'+d.amb+'|'+d.liv+'|'+K.px;if(sigL!==K.sigL){K.sigL=sigL;luce(L,modo)}
  if(d.sigT!==K.sigT){K.sigT=d.sigT;terreno(modo,d,L)}
  if(d.sigO!==K.sigO){K.sigO=d.sigO;oggetti(modo,d,L)}
  K.D=d.D}
 // la luce: sole con ombre, cielo emisferico, ambiente cotto da un cielo procedurale (come l'esempio di three.js con il Sky e PMREM)
 function luce(L,modo){K.ren.toneMappingExposure=L.esp;if(K.Lp){tinta(K.U.uAmb.value,K.Lp.amb);tinta(K.U.uRifl.value,K.Lp.rifl)}K.scn.background=new T.Color(L.fondo);if(K.suolo)K.suolo.material.color.setRGB(...C(L.fondo));K.hemi.intensity=L.emi.int*.22
  K.sun.color.set(L.sole.col);K.sun.intensity=K.Lp?L.sole.int:L.sole.int*(L.notte?1.1:1.15);K.hemi.color.set(L.emi.cielo);K.hemi.groundColor.set(L.emi.suolo);
  const k=L.sole.col+L.emi.cielo+L.emi.suolo+(L.tinta?L.tinta.col:'');if(k!==K.envK){K.envK=k;if(K.env)K.env.dispose();K.env=cielo(L);K.scn.environment=K.env}
  K.mat.terr.envMapIntensity=K.mat.ogg.envMapIntensity=K.mat.veg.envMapIntensity=L.notte?.3:.34}
 // cupola a gradiente (cielo → orizzonte → suolo) con un disco di sole/luna, cotta in una mappa d'ambiente
 function cielo(L){const s=new T.Scene(),g=new T.SphereGeometry(100,16,10),p=g.attributes.position,col=[],su=new T.Color(L.emi.cielo),ho=new T.Color(L.emi.cielo).lerp(new T.Color(L.sole.col),.35),gr=new T.Color(L.emi.suolo);
  for(const c of[su,ho,gr])c.convertSRGBToLinear();for(let i=0;i<p.count;i++){const y=p.getY(i)/100,c=y>0?ho.clone().lerp(su,Math.pow(y,.6)):ho.clone().lerp(gr,Math.min(1,-y*2.2));col.push(c.r,c.g,c.b)}
  g.setAttribute('color',new T.Float32BufferAttribute(col,3));s.add(new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
  const so=new T.Mesh(new T.SphereGeometry(9,10,8),new T.MeshBasicMaterial({color:new T.Color(L.sole.col).convertSRGBToLinear().multiplyScalar(L.notte?2.2:6)}));const d=new T.Vector3(...L.sole.pos).normalize().multiplyScalar(90);so.position.copy(d);s.add(so);
  const e=K.pm.fromScene(s,.04).texture;g.dispose();return e}
 // ---- terreno ----
 function terreno(modo,d,L){libera(K.g.terr);K.g.terr=new T.Group();K.scn.add(K.g.terr);libera(K.g.acq);K.g.acq=new T.Group();K.scn.add(K.g.acq);libera(K.g.sup);K.g.sup=new T.Group();K.scn.add(K.g.sup);
  // resa pixel: esagoni pieni (niente fessure: gli esagoni non si vedono), cime a tessere del tema, fianchi dei muri a lastre
  const px=K.px&&modo==='bat',A=V(px),W=V(),S={fuoco:V(),veleno:V(),ghiaccio:V()},D=d.D,R=px?ASCE.GEO.bat.Z+.02:D.R,base=modo==='bat'?D.quota.base:-12,tint=L.tinta,BIANCO=C('#ffffff');let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;K.pozze=[];K.fuochi=[];
  for(const t of D.tiles){let top,side,h=t.h;
   if(modo==='bat'){const P=d.pal,sc=t.scac?P.g:P.f;if(t.tipo==='muro'){top=P.m;side=P.ml}else if(t.tipo==='rialzo'){top=P.r;side=scuro(P.g,.2)}else if(t.tipo==='difficile'){top=scuro(sc,.1);side=scuro(sc,.34)}else{top=sc;side=scuro(sc,.3)}}
   else{if(!t.visto){top='#15110d';side='#0b0907'}else{let c=MoMappa.COL[t.t]||'#86a554';if(t.t==='acqua')c='#2b5278';c=mescola(c,'#15110d',1-ASCE.nebbia(t));if(tint)c=mescola(c,tint.col,tint.mix);top=c;side=scuro(c,.4)}}
   const M=matrice(t.x,(h+base)/2,t.z,0,0,R,h-base,R);
   if(px&&t.pav){const m=ASCE.MATERIALI.indexOf(t.pav[0]),tex=[m,t.pav[1],t.tipo==='muro'?[m,t.pav[1]-1]:null];tessera(A,M,BIANCO,tex[2]?BIANCO:C(side),tex)}else tessera(A,M,C(top),C(side),px?null:undefined);
   x0=Math.min(x0,t.x);x1=Math.max(x1,t.x);z0=Math.min(z0,t.z);z1=Math.max(z1,t.z);
   const acqua=(modo==='bat'&&t.sup==='acqua')||(modo==='mon'&&t.visto&&t.t==='acqua');
   if(acqua){const y=h+(modo==='bat'?.9:1.4);K.pozze.push({x:t.x,y,z:t.z});esagono(W,t.x,y,t.z,R-.6,C(modo==='bat'?'#3b78bb':'#3a72ad'))}
   if(modo==='bat'&&t.sup&&t.sup!=='acqua'){const u={fuoco:['#f0782a','#3c1d0e',5],veleno:['#58b02a','#27441a',4],ghiaccio:['#a2dcf4','#5f93b4',3]}[t.sup];esagono(A,t.x,h+.3,t.z,R-1.2,C(u[1]));
    // resa pixel: il fuoco è un letto di braci con fiamme a cono (non un esagono acceso tutto uguale)
    if(px&&t.sup==='fuoco'){esagono(S.fuoco,t.x,h+.7,t.z,R*.5,C('#c44404'));for(let i=0;i<7;i++){const a=i*2.4+t.q,dd=i?6+(i%3)*4:0,fh=7+((i*5)%4)*2.6;
      pezzo(S.fuoco,['k',i%2?'#ffcf6a':'#ff8a2a',Math.cos(a)*dd,fh/2,Math.sin(a)*dd,2.6+(i%2),0,fh,0,0,'e'],t.x,h,t.z,0,1,1,0,false)}}
    else esagono(S[t.sup],t.x,h+.7,t.z,R-u[2],C(u[0]));K.fuochi.push({x:t.x,y:h,z:t.z,k:t.sup})}}
  const mt=mesh(A,K.mat.terr);K.g.terr.add(mt);if(W.pos.length){const m=mesh(W,K.mat.acq,{cast:false});m.renderOrder=2;K.g.acq.add(m)}
  if(S.fuoco.pos.length){const m=mesh(S.fuoco,K.mat.lum,{cast:false,rec:false});K.g.sup.add(m)}
  if(S.veleno.pos.length){K.g.sup.add(mesh(S.veleno,K.mat.ven,{cast:false}))}
  if(S.ghiaccio.pos.length){K.g.sup.add(mesh(S.ghiaccio,K.mat.ghi,{cast:false}))}
  // bordo del mondo: un pavimento scuro sotto tutto (si vede nelle fessure fra le tessere)
  if(!K.suolo){K.suolo=new T.Mesh(new T.PlaneGeometry(6000,6000),new T.MeshBasicMaterial({color:0x000000,toneMapped:false}));K.suolo.material.color.setRGB(...C(K.L.fondo));K.suolo.rotation.x=-Math.PI/2;K.suolo.frustumCulled=false;K.scn.add(K.suolo)}
  K.suolo.position.y=base-.5;const cx=(x0+x1)/2,cz=(z0+z1)/2,rr=Math.hypot(x1-x0,z1-z0)/2+R+30;K.bbox={cx,cz,rr,x0,x1,z0,z1};
  const sh=K.sun.shadow,sz=modo==='mon'&&(navigator.deviceMemory||4)>2?2048:1024;if(sh.mapSize.x!==sz){sh.mapSize.set(sz,sz);if(sh.map){sh.map.dispose();sh.map=null}}
  const cam=sh.camera;cam.left=-rr;cam.right=rr;cam.top=rr;cam.bottom=-rr;cam.near=10;cam.far=900;cam.updateProjectionMatrix();
  const dir=new T.Vector3(...K.L.sole.pos).normalize();K.sun.target.position.set(cx,0,cz);K.sun.position.set(cx+dir.x*420,dir.y*420,cz+dir.z*420);K.sun.target.updateMatrixWorld();
  if(Scena3D.sorgenti)Scena3D.sorgenti(modo)}
 // resa pixel: fino a 4 luci puntiformi calde, le più vicine al centro dell'arena (torce, fuochi, bracieri, santuari); le altre restano solo fiamme
 function luciPuntiformi(modo,d,L){const b=K.bbox||{cx:0,cz:0},F=modo==='bat'?ASCE.fonti(d.D,{torce:L.torce,px:true}):[];
  F.sort((a,c)=>Math.hypot(a.x-b.cx,a.z-b.cz)-Math.hypot(c.x-b.cx,c.z-b.cz));K.fontiP=F;
  K.luciP.forEach((l,i)=>{const f=F[i];if(!f){l.intensity=0;return}l.position.set(f.x,f.y,f.z);l.color.set(f.col);l.intensity=1.7*f.forza*(K.Lp?K.Lp.fiamme:1);l.distance=110;l.decay=1.4})}
 // un esagono piatto (6 triangoli) a quota y; colore c; uv in coordinate del mondo per far scorrere le onde
 function esagono(A,x,y,z,r,c){for(let i=0;i<6;i++){const a0=Math.PI/3*i,a1=Math.PI/3*(i+1),p=[[x,z],[x+Math.sin(a0)*r,z+Math.cos(a0)*r],[x+Math.sin(a1)*r,z+Math.cos(a1)*r]];
   for(const[px,pz]of p){A.pos.push(px,y,pz);A.nor.push(0,1,0);A.col.push(c[0],c[1],c[2]);A.sw.push(0);tx(A,0,0,-1)}}}
 // ---- oggetti fissi (alberi, edifici, rocce, colonne…) ----
 function oggetti(modo,d,L){libera(K.g.ogg);K.g.ogg=new T.Group();K.scn.add(K.g.ogg);const F=V(),G=V(),E=V(),D=d.D,ctx={notte:!!L.finestre};K.torce=[];K.camini=[];K.corvi=[];
  for(const t of D.tiles){const h=t.h;let oggetti=[];
   if(t.oggetto)oggetti.push(t.oggetto);if(t.deco)oggetti.push(t.deco);
   for(const o of oggetti){const parti=ASCE.parti(o.k,o.s,Object.assign({},ctx,{g:o.g})),ro=RUOTA.has(o.k)?o.s*Math.PI*2:0,veg=VEG.has(o.k);
    let mul=1;if(modo==='mon'){mul=ASCE.nebbia(t)*(L.tinta?1-L.tinta.mix*.5:1)}
    for(const p of parti){const A=p[10]==='e'?E:veg?G:F;pezzo(A,p,t.x,h,t.z,ro,o.g||1,p[10]==='e'?1:mul,p[10]==='e'?0:.5,veg)}
    if(o.k==='citta'||o.k==='villaggio'||o.k==='campo')K.camini.push({x:t.x+(o.k==='campo'?0:8),y:h+(o.k==='campo'?8:26),z:t.z+(o.k==='campo'?-4:-4),k:o.k});
    if(o.k==='rovina'||o.k==='torre')K.corvi.push({x:t.x,y:h+(o.k==='torre'?58:30),z:t.z});
    if(o.k==='campo'||o.k==='santuario')K.torce.push({x:t.x,y:h+4,z:t.z,k:o.k});
    if(o.k==='braciere'||o.k==='candele')K.torce.push({x:t.x,y:h+ASCE.LUCI_OGG[o.k].y,z:t.z,k:'torcia'})}}
  // torce sui muri dei sotterranei (ASCE.torce: sempre le stesse); nella resa pixel più grandi, sulla faccia del muro, con supporto e fiamma doppia
  if(modo==='bat'&&L.torce)for(const q of ASCE.torce(D,K.px)){
   if(K.px){pezzo(F,['b','#3a3a40',0,0,0,4,2,4,0,0,''],q.x,q.y-6,q.z-2,0,1,1,.3,false);pezzo(F,['c','#5a3a1c',0,0,0,1.4,1,11,0,.18,''],q.x,q.y-1,q.z,0,1,1,.3,false);
    pezzo(E,['k','#ff8a2a',0,0,0,3.4,0,9,0,0,'e'],q.x,q.y+7,q.z,0,1,1,0,false);pezzo(E,['k','#fff0a0',0,0,0,1.8,0,5.5,0,0,'e'],q.x,q.y+6,q.z+.6,0,1,1,0,false);K.torce.push({x:q.x,y:q.y+7,z:q.z,k:'torcia'})}
   else{pezzo(F,['c','#5a3a1c',0,0,0,.9,1.1,8,0,0,''],q.x,q.y-7,q.z,0,1,1,.5,false);pezzo(E,['k','#ffb347',0,0,0,2.2,0,6,0,0,'e'],q.x,q.y,q.z,0,1,1,0,false);K.torce.push({x:q.x,y:q.y,z:q.z,k:'torcia'})}}
  if(K.px)luciPuntiformi(modo,d,L);
  if(F.pos.length)K.g.ogg.add(mesh(F,K.mat.ogg));if(G.pos.length)K.g.ogg.add(mesh(G,K.mat.veg,{sway:true}));if(E.pos.length)K.g.ogg.add(mesh(E,K.mat.lum,{cast:false,rec:false}));
  if(Scena3D.sorgenti)Scena3D.sorgenti(modo)}
 // ---- ciclo di disegno: a richiesta; solo con animazioni o ambiente si resta in ciclo ----
 function avviaCiclo(){if(K.raf||!K.wrap||!K.pronta||document.hidden)return;K.raf=requestAnimationFrame(ciclo)}
 function ciclo(t){K.raf=0;if(!K.wrap||!K.wrap.isConnected||!K.pronta){parcheggia();return}
  if(!K.t0)K.t0=t;const sec=(t-K.t0)/1000,dt=Math.min(.06,(t-(ciclo.l||t))/1000);ciclo.l=t;
  const anim=Scena3D.anima?Scena3D.anima(sec,dt):false,amb=t-K.tAmb>=82&&Scena3D.ambiente&&Scena3D.dinamico();
  if(K.sucio||anim||amb){if(amb){K.tAmb=t;Scena3D.ambiente(sec,dt)}K.uT.value=RM?0:sec;K.uLum.value=RM?1:.9+.1*Math.sin(sec*9)*Math.sin(sec*3.1)+.04*Math.sin(sec*23);
   const m=K.mat.onde;if(m&&!RM){m.offset.x=sec*.012;m.offset.y=sec*.007}
   K.sucio=false;const p0=performance.now();if(Scena3D.disegna)Scena3D.disegna(K);else K.ren.render(K.scn,K.cam);sondaFps(p0)}
  K.raf=requestAnimationFrame(ciclo)}
 // se i primi disegni sono lenti il telefono non regge: si torna all'SVG e si ricorda (impostazione «lento»); con «Sempre» non si controlla
 function sondaFps(p0){if(impo()!=='auto')return;const s=K.sonda||(K.sonda={n:0,t:[],ok:false});if(s.ok)return;const ora=performance.now();s.t.push(ora);K.sucio=true;
  if(s.t.length>=30){const d=[];for(let i=4;i<s.t.length;i++)d.push(s.t[i]-s.t[i-1]);d.sort((a,b)=>a-b);const med=d[d.length>>1];s.ok=true;K.sucio=false;K.msMediano=med;
   if(med>(Scena3D.msMax||58)){scrivi('lento');parcheggia();if(typeof render==='function')render()}}}
 // ---- impostazione dell'utente ----
 const NOMI={auto:'Automatica',si:'Sempre',no:'No',lento:'No (telefono lento)'};
 function impostaH(){const v=impo();return`<div class="sh2">Grafica 3D ${infoH('Mappa e battaglie in 3D, con miniature, ombre e luce. «Automatica» prova il telefono e torna alla grafica piatta se è lento; «Sempre» non controlla; «No» usa solo la grafica piatta.')}</div>
<div class="s3-set" role="group" aria-label="Grafica 3D">${['auto','si','no'].map(k=>`<button class="b sm ${v===k||(v==='lento'&&k==='no')?'gold':''}" data-a="s3d" data-v="${k}" aria-pressed="${v===k}">${NOMI[k]}</button>`).join('')}</div>
${v==='lento'?'<small class="muted">Il telefono è sembrato lento: la grafica 3D è spenta. Scegli «Automatica» per riprovare.</small>':''}`}
 function imposta(v){if(!['auto','si','no'].includes(v))return;scrivi(v);K.sonda=null;if(v==='no')parcheggia();else if(!K.pronta&&!K.carico)K.fallita=false;if(typeof render==='function')render()}
 const Pub={K,C,GU,V,metti,tessera,mesh,pezzo,matrice,mescola,scuro,esagono,libera,sporca,dopo,vista,dimensiona,on,avvia,impostaH,imposta,impo,sync,bande,pixel,tinta,
  get T(){return T},get fallita(){return K.fallita},get pronta(){return K.pronta},sonda:()=>K.msMediano,
  // quanto alzare etichette e numeri sopra le miniature quando il 3D è attivo
  sup:()=>on()?14:0,
  debug:()=>({K,T})};
 return Pub})();
