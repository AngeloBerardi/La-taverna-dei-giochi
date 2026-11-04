/* ---- Resa pixel di Cantari di Ventura (B1): la scena 3D di oggi disegnata a bassa risoluzione e ingrandita a pixel netti. ----
   Catena di un fotogramma: 1) scena su un bersaglio piccolo (colore + profondità, filtro Nearest, nessun antialias) con una telecamera
   ortografica inclinata di 55° e agganciata ai pixel d'arte; 2) una passata di rifinitura alla stessa misura: palette (tabella 32³ di APAL)
   e contorno esterno di 1 pixel dove la profondità salta (tono più scuro della rampa di chi sta davanti); 3) ingrandimento intero sullo
   schermo, spostato del resto di pixel della telecamera per uno scorrimento morbido. Si aggancia a Scena3D con `Scena3D.disegna`.
   `PixelProva`: pagina `?prova=pixel` con arena fissa, 3 eroi e 4 scheletri che camminano in cerchio, interruttore 3D di oggi / pixel
   (`&t=2` ferma il cammino a 2 secondi: stesse schermate a ogni prova).
   Numeri e palette: motori/28h-avv-palette.js (APAL). Piano: docs/AVVENTURA-B.md (Resa grafica, B1). */
const Pixel=(()=>{
 const R={T:null,rt:null,rt2:null,lut:null,scuri:null,fin:null,blit:null,sFin:null,sBlit:null,cam2:null,cam:null,aw:0,ah:0};
 const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 // rifinitura: palette e contorno esterno (il pixel dietro un salto di profondità prende il tono scuro della rampa di chi sta davanti)
 const FS_FIN=`uniform sampler2D tCol,tDep,tLut,tScuri;uniform vec2 res;uniform float prof,soglia,contorni;
vec4 pal(vec3 c){vec3 q=floor(clamp(c,0.,1.)*31.999);return texture2D(tLut,vec2((q.b*32.+q.r+.5)/1024.,(q.g+.5)/32.));}
float dep(vec2 p){return texture2D(tDep,p/res).x*prof;}
void main(){vec2 p=floor(gl_FragCoord.xy)+.5;float d=dep(p),m=d-soglia;vec2 q=p;bool c=false;
 for(int i=0;i<4;i++){vec2 o=i==0?vec2(1.,0.):i==1?vec2(-1.,0.):i==2?vec2(0.,1.):vec2(0.,-1.);float e=dep(p+o);if(e<m){m=e;q=p+o;c=true;}}
 vec4 k=pal(texture2D(tCol,q/res).rgb);
 if(c&&contorni>.5){float r=floor(k.a*255.+.5);gl_FragColor=vec4(texture2D(tScuri,vec2((r+.5)/8.,.5)).rgb,1.);}
 else gl_FragColor=vec4(pal(texture2D(tCol,p/res).rgb).rgb,1.);}`;
 // ingrandimento intero: ogni pixel dello schermo prende il suo pixel d'arte (off = spostamento in pixel dello schermo, intero)
 const FS_BLIT='uniform sampler2D t;uniform vec2 res,off;uniform float s;void main(){vec2 a=floor((gl_FragCoord.xy-off)/s);gl_FragColor=vec4(texture2D(t,(a+.5)/res).rgb,1.);}';
 function dati(T,arr,w,h){const t=new T.DataTexture(arr,w,h,T.RGBAFormat);t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.flipY=false;t.needsUpdate=true;return t}
 function prepara(){const T=Scena3D.T;if(R.T===T)return;R.T=T;
  const L=APAL.tabella(32);R.lut=dati(T,L.dati,L.w,L.h);R.scuri=dati(T,APAL.scuri(),8,1);
  const quad=m=>{const q=new T.Mesh(new T.PlaneGeometry(2,2),m);q.frustumCulled=false;return q};
  R.fin=new T.ShaderMaterial({uniforms:{tCol:{value:null},tDep:{value:null},tLut:{value:R.lut},tScuri:{value:R.scuri},res:{value:new T.Vector2()},prof:{value:1},soglia:{value:5},contorni:{value:1}},
   vertexShader:VS,fragmentShader:FS_FIN,depthTest:false,depthWrite:false});
  R.blit=new T.ShaderMaterial({uniforms:{t:{value:null},res:{value:new T.Vector2()},off:{value:new T.Vector2()},s:{value:1}},vertexShader:VS,fragmentShader:FS_BLIT,depthTest:false,depthWrite:false});
  R.sFin=new T.Scene();R.sFin.add(quad(R.fin));R.sBlit=new T.Scene();R.sBlit.add(quad(R.blit));R.cam2=new T.OrthographicCamera(-1,1,1,-1,0,1);
  R.cam=new T.OrthographicCamera(-1,1,1,-1,1,4000);R.cam.rotation.set(-APAL.CAMERA.incl*Math.PI/180,0,0)}
 // bersagli a bassa risoluzione: si rifanno solo quando cambia la misura
 function bersagli(aw,ah){const T=R.T;if(R.rt&&R.aw===aw&&R.ah===ah)return;if(R.rt){R.rt.depthTexture.dispose();R.rt.dispose();R.rt2.dispose()}
  const o={minFilter:T.NearestFilter,magFilter:T.NearestFilter,format:T.RGBAFormat,generateMipmaps:false,stencilBuffer:false};
  R.rt=new T.WebGLRenderTarget(aw,ah,Object.assign({depthBuffer:true},o));R.rt.texture.encoding=T.sRGBEncoding;
  R.rt.depthTexture=new T.DepthTexture(aw,ah);R.rt.depthTexture.type=T.UnsignedIntType;
  R.rt2=new T.WebGLRenderTarget(aw,ah,Object.assign({depthBuffer:false},o));R.aw=aw;R.ah=ah}
 // il canvas a pixel veri del dispositivo: un pixel del bersaglio ingrandito = s × s pixel dello schermo, mai a metà
 function tela(K,M,dpr){const cv=K.cv;if(cv.width===M.W&&cv.height===M.H&&cv.classList.contains('s3-px'))return;
  K.ren.setPixelRatio(1);K.ren.setSize(M.W,M.H,false);cv.style.width=M.W/dpr+'px';cv.style.height=M.H/dpr+'px';cv.classList.add('s3-px')}
 function lascia(K){if(!K.cv||!K.cv.classList.contains('s3-px'))return;K.cv.classList.remove('s3-px');Scena3D.dimensiona(true)}
 // o = { x, y, z (centro della vista nel mondo), k (pixel d'arte per unità), zoom, contorni }; restituisce le misure usate
 function disegna(K,o){prepara();const T=R.T,dpr=window.devicePixelRatio||1,w=K.wrap.clientWidth,h=K.wrap.clientHeight;
  const M=APAL.misure({w,h,dpr,tv:!!(typeof ui!=='undefined'&&ui.tv),zoom:o.zoom}),aw=M.art[0]+2,ah=M.art[1]+2,k=o.k,s=M.s;
  tela(K,M,dpr);bersagli(aw,ah);
  // telecamera: centro agganciato ai pixel d'arte sul piano della vista; il resto (meno di un pixel) va nell'ingrandimento
  const C=APAL.CAMERA,[px,py]=APAL.piano(o.x,o.y||0,o.z),ax=APAL.aggancia(px,k),ay=APAL.aggancia(py,k),D=2000,cam=R.cam;
  cam.left=-aw/2/k;cam.right=aw/2/k;cam.top=ah/2/k;cam.bottom=-ah/2/k;cam.updateProjectionMatrix();
  cam.position.set(ax.v,ay.v*C.cos+D*C.sin,-ay.v*C.sin+D*C.cos);cam.updateMatrixWorld();
  // anche le miniature si posano su pixel interi (sul piano della vista): niente forme che tremano quando camminano
  const fig=K.g.fig?K.g.fig.children:[],sv=[];
  for(const g of fig){const p=g.position,[gx,gy]=APAL.piano(p.x,p.y,p.z);sv.push(p.x,p.z);p.x=APAL.aggancia(gx,k).v;p.z-=(APAL.aggancia(gy,k).v-gy)/C.sin}
  for(const c of K.g.fx?K.g.fx.children:[]){const u=c.material&&c.material.uniforms;if(u&&u.px)u.px.value=k}
  const ren=K.ren;ren.setRenderTarget(R.rt);ren.render(K.scn,cam);
  fig.forEach((g,i)=>{g.position.x=sv[i*2];g.position.z=sv[i*2+1]});
  const f=R.fin.uniforms;f.tCol.value=R.rt.texture;f.tDep.value=R.rt.depthTexture;f.res.value.set(aw,ah);f.prof.value=cam.far-cam.near;f.contorni.value=o.contorni===false?0:1;
  ren.setRenderTarget(R.rt2);ren.render(R.sFin,R.cam2);
  // centro vero della vista sullo schermo: off = metà schermo − s · (metà bersaglio + resto), arrotondato al pixel dello schermo
  const off=[Math.round(M.W/2-s*(aw/2+ax.resto)),Math.round(M.H/2-s*(ah/2+ay.resto))],b=R.blit.uniforms;
  b.t.value=R.rt2.texture;b.res.value.set(aw,ah);b.off.value.set(off[0],off[1]);b.s.value=s;
  ren.setRenderTarget(null);ren.render(R.sBlit,R.cam2);
  return Object.assign({},M,{k,aw,ah,off,resto:[ax.resto,ay.resto]})}
 // il bersaglio rifinito (pixel d'arte, righe dal basso): per i test
 function leggi(K){const a=new Uint8Array(R.aw*R.ah*4);K.ren.readRenderTargetPixels(R.rt2,0,0,R.aw,R.ah,a);return{w:R.aw,h:R.ah,px:a}}
 return{R,disegna,lascia,leggi}})();

const PixelProva=(()=>{
 // arene fisse 9 × 11: muri e colonne ai lati, un rialzo al centro, l'anello libero per chi cammina; braceri in fondo
 const LUOGHI={
  cripta:{amb:'antro',righe:['#########','#T.....T#','#.......#','#.......#','#.......#','#...^...#','#.......#','#.......#','#.......#','#T.....T#','.........'],
   sup:['.........','...f.f...','.........','.........','.........','.........','.........','.........','.........','.........','.........']},
  radura:{amb:'bosco',righe:['TT..T..TT','T.......T','.........','.........','.........','....^....','.........','.........','.........','T.......T','.T.....T.'],
   sup:['.........','.........','.........','.........','.........','.........','.........','.........','.........','.........','....w....']}};
 const NEMICI=['scheletro-armato','scheletro-armato','arciere-scheletro','arciere-scheletro'];
 const P={on:false,modo:'pixel',zoom:'lontano',cam:'ferma',luogo:'cripta',pann:true,contorni:true,t0:0,fisso:null,camMan:null,ult:null,fps:[],ms:[],tInfo:0};
 const vuole=()=>/[?&]prova=pixel\b/.test(location.search);
 function arena(id){const L=LUOGHI[id],A=AGRI.arena(L.righe,L.sup),I=AARE.ingressi();
  return Object.assign(A,{id:'prova-'+id,nome:'Prova della resa pixel',ambiente:L.amb,ingressi:{eroi:I.eroi,nemici:I.nemici},uscite:[]})}
 function battaglia(){const squad=Bat.prova(1).slice(0,3),A=arena(P.luogo),s=ASCO.nuovo(squad,NEMICI,A,{seme:7});
  Bat.s=s;Bat.aspetti={};squad.forEach((m,i)=>{Bat.aspetti['e'+(i+1)]=m.eroe.aspetto})}
 const bot=(v,txt,on)=>`<button class="b sm ${on?'gold':''}" data-a="pxp" data-v="${v}" aria-pressed="${!!on}">${txt}</button>`;
 function pannelloH(){if(!P.pann)return bot('pann:1','Mostra',false).replace('class="b sm','class="b sm pxp-mostra');
  const r=(tit,el)=>`<div class="pxp-riga"><span>${tit}</span>${el}</div>`;
  return`<div class="pxp-pan"><b>Prova della resa pixel</b>
${r('Grafica',bot('modo:3d','3D di oggi',P.modo==='3d')+bot('modo:pixel','Pixel',P.modo==='pixel'))}
${r('Zoom',bot('zoom:lontano','Lontano',P.zoom==='lontano')+bot('zoom:vicino','Vicino',P.zoom==='vicino'))}
${r('Telecamera',bot('cam:ferma','Ferma',P.cam==='ferma')+bot('cam:segue','Segue un eroe',P.cam==='segue'))}
${r('Luogo',bot('luogo:cripta','Cripta',P.luogo==='cripta')+bot('luogo:radura','Radura',P.luogo==='radura'))}
${r('Contorni',bot('contorni:1','Sì',P.contorni)+bot('contorni:0','No',!P.contorni))}
<div class="pxp-info" aria-live="off">${Scena3D.fallita?'Grafica 3D non disponibile su questo dispositivo.':['no','lento'].includes(Scena3D.impo())?'Grafica 3D spenta: '+bot('s3:si','Accendi',false):'Preparo la scena…'}</div>
<div class="pxp-riga">${bot('pann:0','Nascondi',false)}<a class="b sm" href="${location.pathname}">Esci</a></div></div>`}
 function html(){const A=Bat.s.arena;
  return`<div class="bt-mappa"><svg class="bt-svg" viewBox="${BatMappa.viewBox(A,{k:1})}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg></div>${pannelloH()}`}
 function monta(){let el=document.querySelector('.pxp');if(!el){el=document.createElement('div');el.className='pxp';el.setAttribute('role','region');el.setAttribute('aria-label','Prova della resa pixel');document.body.appendChild(el)}
  el.innerHTML=html();Scena3D.dopo();Scena3D.sporca()}
 function pannello(){const el=document.querySelector('.pxp');if(!el)return;const p=el.querySelector('.pxp-pan,.pxp-mostra');if(p)p.outerHTML=pannelloH();else el.insertAdjacentHTML('beforeend',pannelloH())}
 // ---- avvio: al posto dell'ingresso nella Taverna (25-avvio) quando l'indirizzo ha ?prova=pixel ----
 function apri(){if(!vuole())return false;P.on=true;P.t0=performance.now();const t=new URLSearchParams(location.search).get('t');if(t!=null&&isFinite(+t))P.fisso=+t;battaglia();Scena3D.msMax=1e9;Scena3D.disegna=disegna;
  document.documentElement.classList.add('pxp-on');monta();const c=Scena3D.avvia();if(c)c.then(()=>{pannello();Scena3D.dopo()});return true}
 function act(v){const[k,x]=String(v||'').split(':');
  if(k==='modo'&&(x==='3d'||x==='pixel'))P.modo=x;else if(k==='zoom'&&(x==='lontano'||x==='vicino'))P.zoom=x;else if(k==='cam'&&(x==='ferma'||x==='segue'))P.cam=x;
  else if(k==='luogo'&&LUOGHI[x]&&x!==P.luogo){P.luogo=x;battaglia();return monta()}
  else if(k==='contorni')P.contorni=x==='1';else if(k==='pann')P.pann=x==='1';else if(k==='s3'){Scena3D.imposta('si');return monta()}
  pannello();Scena3D.sporca()}
 // ---- ogni fotogramma: le miniature camminano in cerchio, poi 3D di oggi o catena pixel ----
 const tempo=()=>P.fisso!=null?P.fisso:(performance.now()-P.t0)/1000;
 function centro(K){const b=K.bbox;return b?{x:b.cx,z:b.cz}:{x:0,z:0}}
 function muovi(K){const t=tempo(),c=centro(K),fig=K.g.fig.children;let eroe=null;
  fig.forEach((g,i)=>{const e=i<3,j=e?i:i-3,r=e?70:128,w=e?-.64:.36,a=j*Math.PI*2/(e?3:4)+w*t,x=c.x+r*Math.cos(a),z=c.z+r*Math.sin(a);
   g.position.x=x;g.position.z=z;g.position.y=0;g.rotation.y=Math.atan2(-Math.sin(a)*w,Math.cos(a)*w);if(i===0)eroe={x,z}});
  return eroe}
 function disegna(K){if(!P.on)return K.ren.render(K.scn,K.cam);const p0=performance.now(),eroe=muovi(K);
  if(P.modo==='3d'){Pixel.lascia(K);K.ren.render(K.scn,K.cam);P.ult=null}
  else{const c=P.camMan||(P.cam==='segue'&&eroe)||centro(K);P.ult=Pixel.disegna(K,{x:c.x,y:0,z:c.z,k:APAL.k(),zoom:P.zoom,contorni:P.contorni})}
  misura(p0);if(P.fisso==null)K.sucio=true}
 // fps dagli intervalli fra un fotogramma e l'altro, ms = tempo di disegno sul processore
 function misura(p0){const t=performance.now();if(P.tPrec)P.fps.push(t-P.tPrec);P.tPrec=t;P.ms.push(t-p0);if(P.fps.length>90){P.fps.shift();P.ms.shift()}
  if(t-P.tInfo<500)return;P.tInfo=t;const el=document.querySelector('.pxp-info');if(!el)return;const s=stat(),u=P.ult;
  el.textContent=(u?`${u.art[0]}×${u.art[1]} pixel d'arte · ×${u.s} · ${(APAL.ALTO_EROE)} px l'eroe`:'3D di oggi')+` · ${s.fps} fps · ${s.ms.toFixed(1).replace('.',',')} ms`}
 const med=a=>{const b=a.slice().sort((x,y)=>x-y);return b.length?b[b.length>>1]:0};
 function stat(){const f=med(P.fps);return{fps:f?Math.round(1000/f):0,ms:med(P.ms),n:P.fps.length}}
 return{P,LUOGHI,apri,act,disegna,stat,vuole,
  // per i test: tempo fermo, telecamera a mano, lettura del bersaglio rifinito
  ferma(t){P.fisso=t;Scena3D.sporca()},camera(x,z){P.camMan=x==null?null:{x,z};Scena3D.sporca()},
  // un fotogramma subito, con lo schermo letto prima di ogni altra chiamata a WebGL e il bersaglio rifinito
  scatta(o){o=o||{};if(o.cam)P.camMan={x:o.cam[0],z:o.cam[1]};if(o.zoom)P.zoom=o.zoom;if(o.contorni!=null)P.contorni=o.contorni;const K=Scena3D.K;disegna(K);
   let schermo=null;if(o.schermo){const gl=K.ren.getContext(),W=K.cv.width,H=K.cv.height;schermo={w:W,h:H,px:new Uint8Array(W*H*4)};gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,schermo.px)}
   return{ult:P.ult,schermo,basso:Pixel.leggi(K)}}}})();
