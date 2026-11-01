/* ---- Scena 3D (Cantari di Ventura, A12): un canvas three.js sotto l'SVG della battaglia e della mappa del mondo. ----
   Il 3D disegna terreno, rilievi, oggetti, luce e ombre; l'SVG sopra resta la plancia di gioco (tocchi, zoom, evidenziazioni, PF, stati, numeri).
   La telecamera è obliqua e coincide al pixel con il viewBox dell'SVG (ASCE.proiez): niente picking, niente gesti nuovi. Le viste chiedono `Scena3D.on()` a ogni disegno
   e saltano il terreno se è vero. three.js (r128) si carica su richiesta; senza WebGL, con telefono lento o con «Grafica 3D: no» resta l'SVG di sempre.
   Qui: ciclo di vita, telecamera, terreno e oggetti fissi, luce da ambiente cotto (PMREM da un cielo procedurale), ombre, sonda dei fps, impostazione.
   Miniature, particelle e animazioni: 24ho-scena-fx.js. Forme e quote: motori/28f (ASCE) e 28g (AMIN). Piano: docs/AVVENTURA-A12.md. */
const Scena3D=(()=>{
 const LS='avv-3d',VEG=new Set(['albero','albero-secco','bosco','albero-solo','canne','ciuffi','fiori']),RUOTA=new Set(['albero','albero-secco','bosco','albero-solo','picco','roccia','masso','canne','ciuffi','sassi','fiori','stalagmite']);
 let T=null;
 const K={pronta:false,fallita:false,carico:null,wrap:null,modo:null,sigT:'',sigO:'',sigL:'',cv:null,ren:null,scn:null,cam:null,sun:null,hemi:null,pm:null,env:null,envK:'',fondo:null,suolo:null,
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
 const V=()=>({pos:[],nor:[],col:[],sw:[]});
 // aggiunge una geometria unitaria trasformata da M, con colore c (lineare) e occlusione cotta: più scuro in basso (ao = quanto)
 function metti(A,gk,M,c,ao,sway){const g=gu(gk),nm=metti.nm||(metti.nm=new T.Matrix3()),v=metti.v||(metti.v=new T.Vector3()),n=metti.n||(metti.n=new T.Vector3());nm.getNormalMatrix(M);
  for(let i=0;i<g.N;i++){v.set(g.p[i*3],g.p[i*3+1],g.p[i*3+2]);const u=(v.y-g.y0)/(g.y1-g.y0);v.applyMatrix4(M);A.pos.push(v.x,v.y,v.z);
   n.set(g.n[i*3],g.n[i*3+1],g.n[i*3+2]).applyMatrix3(nm).normalize();A.nor.push(n.x,n.y,n.z);const f=1-ao+ao*u;A.col.push(c[0]*f,c[1]*f,c[2]*f);A.sw.push(sway?Math.min(1,Math.max(0,(v.y-2)/34)):0)}}
 // una tessera esagonale: cima e fianchi di colore diverso, fianchi sfumati verso il basso
 function tessera(A,M,top,side){const g=gu('hex'),nm=tessera.nm||(tessera.nm=new T.Matrix3()),v=tessera.v||(tessera.v=new T.Vector3()),n=tessera.n||(tessera.n=new T.Vector3());nm.getNormalMatrix(M);
  for(let i=0;i<g.N;i++){v.set(g.p[i*3],g.p[i*3+1],g.p[i*3+2]);const u=v.y+.5;v.applyMatrix4(M);A.pos.push(v.x,v.y,v.z);n.set(g.n[i*3],g.n[i*3+1],g.n[i*3+2]).applyMatrix3(nm).normalize();A.nor.push(n.x,n.y,n.z);
   const alto=g.n[i*3+1]>.5,sotto=g.n[i*3+1]<-.5,f=alto?1:sotto?.35:.5+.5*u,c=alto?top:side;A.col.push(c[0]*f,c[1]*f,c[2]*f);A.sw.push(0)}}
 function mesh(A,mat,o){o=o||{};const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(Float32Array.from(A.pos),3));g.setAttribute('normal',new T.BufferAttribute(Float32Array.from(A.nor),3));
  g.setAttribute('color',new T.BufferAttribute(Float32Array.from(A.col),3));if(o.sway)g.setAttribute('aSw',new T.BufferAttribute(Float32Array.from(A.sw),1));
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
  if(Scena3D.creaFx)Scena3D.creaFx();
  if(typeof ResizeObserver!=='undefined')K.ro=new ResizeObserver(()=>{if(K.wrap)dimensiona(true)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sporca()})}
 // trama delle onde (si sposta nel tempo): righe chiare morbide su fondo bianco, ripetuta
 function ondeTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,128,128);g.strokeStyle='rgba(120,170,215,.55)';g.lineWidth=5;g.lineCap='round';
  for(const [x,y,w] of[[8,20,50],[70,52,44],[22,92,56],[80,112,36]]){g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+w/2,y-8,x+w,y);g.stroke()}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;return t}
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
 function arenaDa(){const s=typeof Bat!=='undefined'&&Bat.s;if(!s||!s.arena)return null;const A=s.arena;return{D:ASCE.arena(A),A,pal:BatMappa.PAL[A.ambiente]||BatMappa.PAL.pianura,s,
  sigT:'b|'+A.id+'|'+A.ambiente+'|'+A.righe.join('')+'|'+(A.sup||[]).join(''),sigO:'b|'+A.id+'|'+A.ambiente+'|'+A.righe.join(''),fase:'giorno',liv:0,amb:A.ambiente}}
 function mondoDa(){const s=typeof Camp!=='undefined'&&Camp.s;if(!s||!s.celle)return null;const liv=ASCE.livello(s.perdizione|0),D=ASCE.mondo(s,{vista:AMOS.VISTA,livello:liv});
  let a='',b='';for(const t of D.tiles){a+=t.visto?(t.vicino?2:1):0;b+=t.visto?1:0}
  return{D,s,sigT:'m|'+a+'|'+liv,sigO:'m|'+b+'|'+s.fase+'|'+liv+'|'+Object.values(s.luoghi||{}).map(l=>(l.ripulito?1:0)+(l.assedio?2:0)).join(''),fase:s.fase,liv,amb:null}}
 function costruisci(modo,d){
  const L=ASCE.luce(modo,{fase:d.fase,ambiente:d.amb,liv:d.liv});L.fondo=d.pal?d.pal.bg:'#0f0b08';K.L=L;
  const sigL=modo+'|'+d.fase+'|'+d.amb+'|'+d.liv;if(sigL!==K.sigL){K.sigL=sigL;luce(L,modo)}
  if(d.sigT!==K.sigT){K.sigT=d.sigT;terreno(modo,d,L)}
  if(d.sigO!==K.sigO){K.sigO=d.sigO;oggetti(modo,d,L)}
  K.D=d.D}
 // la luce: sole con ombre, cielo emisferico, ambiente cotto da un cielo procedurale (come l'esempio di three.js con il Sky e PMREM)
 function luce(L,modo){K.ren.toneMappingExposure=L.esp;K.scn.background=new T.Color(L.fondo);if(K.suolo)K.suolo.material.color.setRGB(...C(L.fondo));K.hemi.intensity=L.emi.int*.22
  K.sun.color.set(L.sole.col);K.sun.intensity=L.sole.int*(L.notte?1.1:1.15);K.hemi.color.set(L.emi.cielo);K.hemi.groundColor.set(L.emi.suolo);
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
  const A=V(),W=V(),S={fuoco:V(),veleno:V(),ghiaccio:V()},D=d.D,R=D.R,base=modo==='bat'?D.quota.base:-12,tint=L.tinta;let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;K.pozze=[];K.fuochi=[];
  for(const t of D.tiles){let top,side,h=t.h;
   if(modo==='bat'){const P=d.pal,sc=t.scac?P.g:P.f;if(t.tipo==='muro'){top=P.m;side=P.ml}else if(t.tipo==='rialzo'){top=P.r;side=scuro(P.g,.2)}else if(t.tipo==='difficile'){top=scuro(sc,.1);side=scuro(sc,.34)}else{top=sc;side=scuro(sc,.3)}}
   else{if(!t.visto){top='#15110d';side='#0b0907'}else{let c=MoMappa.COL[t.t]||'#86a554';if(t.t==='acqua')c='#2b5278';c=mescola(c,'#15110d',1-ASCE.nebbia(t));if(tint)c=mescola(c,tint.col,tint.mix);top=c;side=scuro(c,.4)}}
   const M=matrice(t.x,(h+base)/2,t.z,0,0,R,h-base,R);tessera(A,M,C(top),C(side));
   x0=Math.min(x0,t.x);x1=Math.max(x1,t.x);z0=Math.min(z0,t.z);z1=Math.max(z1,t.z);
   const acqua=(modo==='bat'&&t.sup==='acqua')||(modo==='mon'&&t.visto&&t.t==='acqua');
   if(acqua){const y=h+(modo==='bat'?.9:1.4);K.pozze.push({x:t.x,y,z:t.z});esagono(W,t.x,y,t.z,R-.6,C(modo==='bat'?'#3b78bb':'#3a72ad'))}
   if(modo==='bat'&&t.sup&&t.sup!=='acqua'){const u={fuoco:['#f0782a','#3c1d0e',5],veleno:['#58b02a','#27441a',4],ghiaccio:['#a2dcf4','#5f93b4',3]}[t.sup];esagono(A,t.x,h+.3,t.z,R-1.2,C(u[1]));esagono(S[t.sup],t.x,h+.7,t.z,R-u[2],C(u[0]));K.fuochi.push({x:t.x,y:h,z:t.z,k:t.sup})}}
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
 // un esagono piatto (6 triangoli) a quota y; colore c; uv in coordinate del mondo per far scorrere le onde
 function esagono(A,x,y,z,r,c){for(let i=0;i<6;i++){const a0=Math.PI/3*i,a1=Math.PI/3*(i+1),p=[[x,z],[x+Math.sin(a0)*r,z+Math.cos(a0)*r],[x+Math.sin(a1)*r,z+Math.cos(a1)*r]];
   for(const[px,pz]of p){A.pos.push(px,y,pz);A.nor.push(0,1,0);A.col.push(c[0],c[1],c[2]);A.sw.push(0)}}}
 // ---- oggetti fissi (alberi, edifici, rocce, colonne…) ----
 function oggetti(modo,d,L){libera(K.g.ogg);K.g.ogg=new T.Group();K.scn.add(K.g.ogg);const F=V(),G=V(),E=V(),D=d.D,ctx={notte:!!L.finestre};K.torce=[];K.camini=[];K.corvi=[];
  for(const t of D.tiles){const h=t.h;let oggetti=[];
   if(t.oggetto)oggetti.push(t.oggetto);if(t.deco)oggetti.push(t.deco);
   for(const o of oggetti){const parti=ASCE.parti(o.k,o.s,Object.assign({},ctx,{g:o.g})),ro=RUOTA.has(o.k)?o.s*Math.PI*2:0,veg=VEG.has(o.k);
    let mul=1;if(modo==='mon'){mul=ASCE.nebbia(t)*(L.tinta?1-L.tinta.mix*.5:1)}
    for(const p of parti){const A=p[10]==='e'?E:veg?G:F;pezzo(A,p,t.x,h,t.z,ro,o.g||1,p[10]==='e'?1:mul,p[10]==='e'?0:.5,veg)}
    if(o.k==='citta'||o.k==='villaggio'||o.k==='campo')K.camini.push({x:t.x+(o.k==='campo'?0:8),y:h+(o.k==='campo'?8:26),z:t.z+(o.k==='campo'?-4:-4),k:o.k});
    if(o.k==='rovina'||o.k==='torre')K.corvi.push({x:t.x,y:h+(o.k==='torre'?58:30),z:t.z});
    if(o.k==='campo'||o.k==='santuario')K.torce.push({x:t.x,y:h+4,z:t.z,k:o.k})}
   // torce sui muri dei sotterranei
   if(modo==='bat'&&L.torce&&t.tipo==='muro'&&ASCE.hash(t.q,t.r,9)<.22){const px=t.x,pz=t.z+13;pezzo(F,['c','#5a3a1c',0,0,0,.9,1.1,8,0,0,''],px,h+4,pz,0,1,1,.5,false);pezzo(E,['k','#ffb347',0,0,0,2.2,0,6,0,0,'e'],px,h+11,pz,0,1,1,0,false);K.torce.push({x:px,y:h+11,z:pz,k:'torcia'})}}
  if(F.pos.length)K.g.ogg.add(mesh(F,K.mat.ogg));if(G.pos.length)K.g.ogg.add(mesh(G,K.mat.veg,{sway:true}));if(E.pos.length)K.g.ogg.add(mesh(E,K.mat.lum,{cast:false,rec:false}));
  if(Scena3D.sorgenti)Scena3D.sorgenti(modo)}
 // ---- ciclo di disegno: a richiesta; solo con animazioni o ambiente si resta in ciclo ----
 function avviaCiclo(){if(K.raf||!K.wrap||!K.pronta||document.hidden)return;K.raf=requestAnimationFrame(ciclo)}
 function ciclo(t){K.raf=0;if(!K.wrap||!K.wrap.isConnected||!K.pronta){parcheggia();return}
  if(!K.t0)K.t0=t;const sec=(t-K.t0)/1000,dt=Math.min(.06,(t-(ciclo.l||t))/1000);ciclo.l=t;
  const anim=Scena3D.anima?Scena3D.anima(sec,dt):false,amb=t-K.tAmb>=82&&Scena3D.ambiente&&Scena3D.dinamico();
  if(K.sucio||anim||amb){if(amb){K.tAmb=t;Scena3D.ambiente(sec,dt)}K.uT.value=RM?0:sec;K.uLum.value=RM?1:.9+.1*Math.sin(sec*9)*Math.sin(sec*3.1)+.04*Math.sin(sec*23);
   const m=K.mat.onde;if(m&&!RM){m.offset.x=sec*.012;m.offset.y=sec*.007}
   K.sucio=false;const p0=performance.now();K.ren.render(K.scn,K.cam);sondaFps(p0)}
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
 const Pub={K,C,GU,V,metti,tessera,mesh,pezzo,matrice,mescola,scuro,esagono,libera,sporca,dopo,vista,on,avvia,impostaH,imposta,impo,sync,
  get T(){return T},get fallita(){return K.fallita},get pronta(){return K.pronta},sonda:()=>K.msMediano,
  // quanto alzare etichette e numeri sopra le miniature quando il 3D è attivo
  sup:()=>on()?14:0,
  debug:()=>({K,T})};
 return Pub})();
