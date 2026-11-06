/* ---- Resa pixel di Cantari di Ventura (B1–B2): la scena 3D disegnata a bassa risoluzione e ingrandita a pixel netti. ----
   Catena di un fotogramma: 1) scena su un bersaglio piccolo (colore + profondità, filtro Nearest, nessun antialias) con una telecamera
   ortografica inclinata di 55° e agganciata ai pixel d'arte; i materiali sono a bande (Scena3D.pixel, 24hn) e in alfa portano la maschera
   delle figure; 2) una passata di rifinitura alla stessa misura: palette (tabella 32³ di APAL), contorno esterno di 1 pixel dove la profondità
   salta (tono più scuro della rampa di chi sta davanti; per le figure notte:0, quasi nero, così si staccano anche da un fondo dello stesso colore), filo di luce interno sugli spigoli convessi (un tono più chiaro), retino di Bayer sul
   cielo e sulla nebbia ai bordi dell'arena (mai sulle figure), ancorato al mondo; 3) ingrandimento intero sullo schermo, spostato del resto di
   pixel della telecamera per uno scorrimento morbido. Le miniature si posano su pixel interi e guardano in otto direzioni.
   `PixelProva`: pagina `?prova=pixel` con le tre scene di controllo (foresta di giorno, sotterraneo con torce, notte con perdizione), i sei temi,
   l'ora e la perdizione; 3 eroi e 4 nemici camminano in cerchio (`&t=2` ferma il cammino a 2 secondi; `&scena=notte`, `&tema=torre`).
   Numeri e palette: motori/28h-avv-palette.js (APAL); temi, tessere e luci: motori/28f (ASCE). Piano: docs/AVVENTURA-B.md (Resa grafica, B1–B2). */
const Pixel=(()=>{
 const R={T:null,rt:null,rt2:null,lut:null,pal:null,fin:null,blit:null,sFin:null,sBlit:null,cam2:null,cam:null,aw:0,ah:0};
 const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 // rifinitura. w = coordinate del pixel nel mondo (pixel d'arte interi del piano della vista): retino, cielo e nebbia non scivolano quando la telecamera scorre
 const FS_FIN=`uniform sampler2D tCol,tDep,tLut,tPal;uniform vec2 res,uCam,uCentro,uRaggio,uCieloY;uniform float prof,soglia,contorni,uFilo,uConv,uNeb;
uniform vec3 uC0,uC1,uC2,uNebCol;
vec4 lut(vec3 c){vec3 q=floor(clamp(c,0.,1.)*31.999);return texture2D(tLut,vec2((q.b*32.+q.r+.5)/1024.,(q.g+.5)/32.));}
vec3 pal(float i){return texture2D(tPal,vec2((i+.5)/40.,.5)).rgb;}
float num(vec4 k){return floor(k.a*255.+.5);}
float dep(vec2 p){return texture2D(tDep,p/res).x*prof;}
float b2(vec2 a){a=floor(a);return fract(a.x*.5+a.y*a.y*.75);}
float bayer(vec2 a){return b2(.5*a)*.25+b2(a);}
void main(){vec2 p=floor(gl_FragCoord.xy)+.5,w=floor(gl_FragCoord.xy)-floor(res*.5)+uCam;float d=dep(p),m=d-soglia;vec2 q=p;bool c=false;
 vec4 src=texture2D(tCol,p/res);bool cielo=d>=prof*.99999,fig=!cielo&&src.a<.75;
 for(int i=0;i<4;i++){vec2 o=i==0?vec2(1.,0.):i==1?vec2(-1.,0.):i==2?vec2(0.,1.):vec2(0.,-1.);float e=dep(p+o);if(e<m){m=e;q=p+o;c=true;}}
 vec3 col;
 if(c&&contorni>.5){vec4 fq=texture2D(tCol,q/res);col=fq.a<.75?pal(35.):pal(floor(num(lut(fq.rgb))/5.)*5.);}   // figure: notte:0, quasi nero (B6.5); scena: il tono più scuro della sua rampa
 else if(cielo){float t=clamp((uCieloY.x-w.y)/(uCieloY.x-uCieloY.y),0.,1.)*2.,s=min(floor(t),1.),f=t-s;col=bayer(w)<f?(s<.5?uC1:uC2):(s<.5?uC0:uC1);}
 else{vec4 k=lut(src.rgb);float i0=num(k);col=k.rgb;
  if(uFilo>.5){float l=dep(p-vec2(1.,0.)),r=dep(p+vec2(1.,0.)),s=dep(p-vec2(0.,1.)),u=dep(p+vec2(0.,1.));
   bool piano=abs(l-d)<soglia&&abs(r-d)<soglia&&abs(s-d)<soglia&&abs(u-d)<soglia;
   float cv=max((l+r)*.5-d,(s+u)*.5-d);if(piano&&cv>uConv){float rr=floor(i0/5.);col=pal(min(i0+1.,rr*5.+4.));}}}
 if(uNeb>0.&&!fig){vec2 e=(w-uCentro)/uRaggio;float f=uNeb*smoothstep(.8,1.2,length(e));if(bayer(w+vec2(2.,1.))<f)col=uNebCol;}
 gl_FragColor=vec4(col,1.);}`;
 // ingrandimento intero: ogni pixel dello schermo prende il suo pixel d'arte (off = spostamento in pixel dello schermo, intero)
 const FS_BLIT='uniform sampler2D t;uniform vec2 res,off;uniform float s;void main(){vec2 a=floor((gl_FragCoord.xy-off)/s);gl_FragColor=vec4(texture2D(t,(a+.5)/res).rgb,1.);}';
 function dati(T,arr,w,h){const t=new T.DataTexture(arr,w,h,T.RGBAFormat);t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.flipY=false;t.needsUpdate=true;return t}
 function prepara(){const T=Scena3D.T;if(R.T===T)return;R.T=T;
  const L=APAL.tabella(32);R.lut=dati(T,L.dati,L.w,L.h);R.pal=dati(T,APAL.paletta(),40,1);
  const quad=m=>{const q=new T.Mesh(new T.PlaneGeometry(2,2),m);q.frustumCulled=false;return q},v2=()=>({value:new T.Vector2()}),v3=()=>({value:new T.Vector3()});
  R.fin=new T.ShaderMaterial({uniforms:{tCol:{value:null},tDep:{value:null},tLut:{value:R.lut},tPal:{value:R.pal},res:v2(),uCam:v2(),uCentro:v2(),uRaggio:v2(),uCieloY:v2(),
   prof:{value:1},soglia:{value:5},contorni:{value:1},uFilo:{value:1},uConv:{value:.42},uNeb:{value:0},uC0:v3(),uC1:v3(),uC2:v3(),uNebCol:v3()},
   vertexShader:VS,fragmentShader:FS_FIN,depthTest:false,depthWrite:false});
  R.blit=new T.ShaderMaterial({uniforms:{t:{value:null},res:{value:new T.Vector2()},off:{value:new T.Vector2()},s:{value:1}},vertexShader:VS,fragmentShader:FS_BLIT,depthTest:false,depthWrite:false});
  R.sFin=new T.Scene();R.sFin.add(quad(R.fin));R.sBlit=new T.Scene();R.sBlit.add(quad(R.blit));R.cam2=new T.OrthographicCamera(-1,1,1,-1,0,1);
  R.cam=new T.OrthographicCamera(-1,1,1,-1,1,4000);R.cam.rotation.set(-APAL.CAMERA.incl*Math.PI/180,0,0);
  R.Y=new T.Vector3(0,1,0);R.qy=new T.Quaternion();R.qx=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-APAL.FIGURA.incl*Math.PI/180)}
 // bersagli a bassa risoluzione: si rifanno solo quando cambia la misura
 function bersagli(aw,ah){const T=R.T;if(R.rt&&R.aw===aw&&R.ah===ah)return;if(R.rt){R.rt.depthTexture.dispose();R.rt.dispose();R.rt2.dispose()}
  const o={minFilter:T.NearestFilter,magFilter:T.NearestFilter,format:T.RGBAFormat,generateMipmaps:false,stencilBuffer:false};
  R.rt=new T.WebGLRenderTarget(aw,ah,Object.assign({depthBuffer:true},o));R.rt.texture.encoding=T.sRGBEncoding;
  R.rt.depthTexture=new T.DepthTexture(aw,ah);R.rt.depthTexture.type=T.UnsignedIntType;
  R.rt2=new T.WebGLRenderTarget(aw,ah,Object.assign({depthBuffer:false},o));R.aw=aw;R.ah=ah}
 // il canvas a pixel veri del dispositivo: un pixel del bersaglio ingrandito = s × s pixel dello schermo, mai a metà
 function tela(K,M,dpr){const cv=K.cv;if(cv.width===M.W&&cv.height===M.H&&cv.classList.contains('s3-px'))return;
  K.ren.setPixelRatio(1);K.ren.setSize(M.W,M.H,false);cv.style.width=M.W/dpr+'px';cv.style.height=M.H/dpr+'px';cv.classList.add('s3-px')}
 function lascia(K){Scena3D.pixel(false);if(!K.cv||!K.cv.classList.contains('s3-px'))return;K.cv.classList.remove('s3-px');Scena3D.dimensiona(true)}
 const pari=n=>n+(n&1);
 // colore della palette come vettore lineare per lo shader (il bersaglio rifinito è già in sRGB: si passano i valori sRGB 0–1)
 const col3=(v,c)=>{const q=APAL.RGB[APAL.indice(c)];v.set(q[0]/255,q[1]/255,q[2]/255)};
 // o = { x, y, z (centro della vista nel mondo), k (pixel d'arte per unità), zoom, contorni, filo }; restituisce le misure usate
 function disegna(K,o){prepara();Scena3D.pixel(true);const T=R.T,dpr=window.devicePixelRatio||1,w=K.wrap.clientWidth,h=K.wrap.clientHeight;
  // bersaglio di misura pari: i centri dei pixel cadono a metà dei texel delle tessere (niente texel saltati o doppi)
  const M=APAL.misure({w,h,dpr,tv:!!(typeof ui!=='undefined'&&ui.tv),zoom:o.zoom}),aw=pari(M.art[0]+2),ah=pari(M.art[1]+2),k=o.k,s=M.s;
  tela(K,M,dpr);bersagli(aw,ah);
  // telecamera: centro agganciato ai pixel d'arte sul piano della vista; il resto (meno di un pixel) va nell'ingrandimento
  const C=APAL.CAMERA,[px,py]=APAL.piano(o.x,o.y||0,o.z),ax=APAL.aggancia(px,k),ay=APAL.aggancia(py,k),D=2000,cam=R.cam;
  cam.left=-aw/2/k;cam.right=aw/2/k;cam.top=ah/2/k;cam.bottom=-ah/2/k;cam.updateProjectionMatrix();
  cam.position.set(ax.v,ay.v*C.cos+D*C.sin,-ay.v*C.sin+D*C.cos);cam.updateMatrixWorld();
  // le miniature si posano su pixel interi (sul piano della vista) e guardano in una delle otto direzioni, sempre di 3/4 verso la telecamera
  // (B6.5: chi punta un bersaglio più in alto sullo schermo si gira di lato, non di schiena): niente forme che tremano quando camminano
  // e il corpo (non la basetta) si inclina all'indietro di APAL.FIGURA.incl nel mondo, qualunque sia lo sguardo: q = sguardo⁻¹ · inclinazione · sguardo · q
  const fig=K.g.fig?K.g.fig.children:[],sv=[],qc=[],qx=R.qx,qy=R.qy;
  for(const g of fig){const p=g.position,[gx,gy]=APAL.piano(p.x,p.y,p.z);sv.push(p.x,p.z,g.rotation.y);p.x=APAL.aggancia(gx,k).v;p.z-=(APAL.aggancia(gy,k).v-gy)/C.sin;g.rotation.y=APAL.fronte(g.rotation.y);
   const b=g.children[1];if(b){qc.push(b.quaternion.clone());qy.setFromAxisAngle(R.Y,g.rotation.y);b.quaternion.premultiply(qy).premultiply(qx).premultiply(qy.invert())}else qc.push(null)}
  for(const c of K.g.fx?K.g.fx.children:[]){const u=c.material&&c.material.uniforms;if(u&&u.px)u.px.value=k}
  const ren=K.ren;ren.setRenderTarget(R.rt);ren.render(K.scn,cam);
  fig.forEach((g,i)=>{g.position.x=sv[i*3];g.position.z=sv[i*3+1];g.rotation.y=sv[i*3+2];if(qc[i])g.children[1].quaternion.copy(qc[i])});
  const f=R.fin.uniforms,Lp=K.Lp,b=K.bbox||{cx:0,cz:0,x0:0,x1:0,z0:0,z1:0};f.tCol.value=R.rt.texture;f.tDep.value=R.rt.depthTexture;f.res.value.set(aw,ah);
  f.prof.value=cam.far-cam.near;f.contorni.value=o.contorni===false?0:1;f.uFilo.value=o.filo===false?0:1;f.uCam.value.set(Math.round(ax.v*k),Math.round(ay.v*k));
  // cielo a retino dall'alto (lontano) al basso, nebbia ai bordi dell'arena: misure in pixel d'arte del piano, dal riquadro dell'arena
  const pc=APAL.piano(b.cx,0,b.cz),ytop=APAL.piano(b.cx,0,b.z0)[1]*k,ybot=APAL.piano(b.cx,0,b.z1)[1]*k,RR=ASCE.GEO.bat.Z;
  f.uCentro.value.set(pc[0]*k,pc[1]*k);f.uRaggio.value.set(((b.x1-b.x0)/2+RR)*k,((b.z1-b.z0)/2+RR)*C.sin*k);f.uCieloY.value.set(ytop+40,ybot-40);
  const cie=Lp?Lp.cielo:['notte:2','notte:1','notte:0'];col3(f.uC0.value,cie[0]);col3(f.uC1.value,cie[1]);col3(f.uC2.value,cie[2]);
  if(Lp&&Lp.nebbia&&o.nebbia!==false){f.uNeb.value=Lp.nebbia[1];col3(f.uNebCol.value,Lp.nebbia[0])}else f.uNeb.value=0;
  ren.setRenderTarget(R.rt2);ren.render(R.sFin,R.cam2);
  // centro vero della vista sullo schermo: off = metà schermo − s · (metà bersaglio + resto), arrotondato al pixel dello schermo
  const off=[Math.round(M.W/2-s*(aw/2+ax.resto)),Math.round(M.H/2-s*(ah/2+ay.resto))],bl=R.blit.uniforms;
  bl.t.value=R.rt2.texture;bl.res.value.set(aw,ah);bl.off.value.set(off[0],off[1]);bl.s.value=s;
  ren.setRenderTarget(null);ren.render(R.sBlit,R.cam2);
  return Object.assign({},M,{k,aw,ah,off,w,h,dpr,resto:[ax.resto,ay.resto],cam:[Math.round(ax.v*k),Math.round(ay.v*k)]})}
 // il bersaglio rifinito (pixel d'arte, righe dal basso): per i test
 function leggi(K){const a=new Uint8Array(R.aw*R.ah*4);K.ren.readRenderTargetPixels(R.rt2,0,0,R.aw,R.ah,a);return{w:R.aw,h:R.ah,px:a}}
 // dove cade una miniatura nel bersaglio (pixel d'arte, origine in basso): riquadro dalla base alla testa, per i controlli sui contorni
 function riquadro(K,u,g,alt,r){const k=u.k,[gx,gy]=APAL.piano(g.position.x,g.position.y,g.position.z),cx=Math.round(gx*k)-u.cam[0]+u.aw/2,cy=Math.round(gy*k)-u.cam[1]+u.ah/2;
  return{x0:Math.floor(cx-r*k-2),x1:Math.ceil(cx+r*k+2),y0:Math.floor(cy-r*APAL.CAMERA.sin*k-2),y1:Math.ceil(cy+alt*APAL.CAMERA.cos*k+3)}}
 return{R,disegna,lascia,leggi,riquadro}})();

const PixelProva=(()=>{
 // arene fisse 9 × 11: «chiusa» (muri e colonne ai lati, un rialzo al centro, due fuochi in fondo) per i temi al chiuso, «aperta» per gli altri
 const PIANTE={
  chiusa:{righe:['#########','#T.....T#','#..o....#','#.......#','#.......#','#...^...#','#.......#','#.......#','#....o..#','#T.....T#','.........'],
   sup:['.........','...f.f...','.........','.........','.........','.........','.........','.........','.........','.........','.........']},
  aperta:{righe:['TT..T..TT','T.......T','.o.......','.........','.........','....^....','.........','.........','.......o.','T.......T','.T.....T.'],
   sup:['.........','.........','.....f...','.........','.........','.........','.........','.........','.........','.........','....w....']}};
 // ambiente della battaglia per ogni tema (il contrario di ASCE.TEMA_DI) e nemici della famiglia giusta
 const AMB={foresta:'bosco',rovine:'collina',palude:'palude',sotterraneo:'antro',torre:'torre',fortezza:'citta'};
 const NEMICI={foresta:['lupo-grigio','brigante','arciere-bandito','lupo-grigio'],rovine:['brigante','tagliagole','arciere-bandito','brigante'],palude:['ghoul-di-tomba','ragno-tessitore','anima-in-pena','cinghiale-irsuto'],
  sotterraneo:['scheletro-armato','scheletro-armato','arciere-scheletro','arciere-scheletro'],torre:['famiglio-arcano','statua-vivente','sciame-di-scintille','custode-fiammeggiante'],fortezza:['brigante','stregone-rinnegato','arciere-bandito','tagliagole']};
 // le tre scene di controllo della resa (piano, sezione 12)
 const SCENE={foresta:{tema:'foresta',fase:'giorno',perd:0,nome:'Foresta di giorno'},sotterraneo:{tema:'sotterraneo',fase:'giorno',perd:0,nome:'Sotterraneo con torce'},notte:{tema:'foresta',fase:'notte',perd:80,nome:'Notte con perdizione'}};
 const FASI=['giorno','tramonto','notte'],PERD=[0,30,55,80],NOMI_F={giorno:'Giorno',tramonto:'Tramonto',notte:'Notte'};
 const P={on:false,modo:'pixel',zoom:'lontano',cam:'ferma',scena:'sotterraneo',tema:'sotterraneo',fase:'giorno',perd:0,pann:true,contorni:true,t0:0,fisso:null,camMan:null,ult:null,fps:[],ms:[],tInfo:0};
 const vuole=()=>/[?&]prova=pixel\b/.test(location.search);
 function arena(){const T=ASCE.TEMI[P.tema],L=PIANTE[T.interno?'chiusa':'aperta'],A=AGRI.arena(L.righe,P.tema==='palude'?L.sup.map((r,i)=>i===3?'..w......':i===7?'......ww.':r):L.sup),I=AARE.ingressi();
  return Object.assign(A,{id:'prova-'+P.tema,nome:'Prova della resa pixel',ambiente:AMB[P.tema],fase:P.fase,perdizione:P.perd,ingressi:{eroi:I.eroi,nemici:I.nemici},uscite:[]})}
 function battaglia(){const squad=Bat.prova(1).slice(0,3),A=arena(),s=ASCO.nuovo(squad,NEMICI[P.tema],A,{seme:7});
  Bat.s=s;Bat.aspetti={};squad.forEach((m,i)=>{Bat.aspetti['e'+(i+1)]=m.eroe.aspetto})}
 function scena(id){const c=SCENE[id];if(!c)return;P.scena=id;P.tema=c.tema;P.fase=c.fase;P.perd=c.perd}
 const bot=(v,txt,on)=>`<button class="b sm ${on?'gold':''}" data-a="pxp" data-v="${v}" aria-pressed="${!!on}">${txt}</button>`;
 function pannelloH(){if(!P.pann)return bot('pann:1','Mostra',false).replace('class="b sm','class="b sm pxp-mostra');
  const r=(tit,el)=>`<div class="pxp-riga"><span>${tit}</span>${el}</div>`;
  return`<div class="pxp-pan"><b>Prova della resa pixel</b>
${r('Scena',Object.keys(SCENE).map(k=>bot('scena:'+k,SCENE[k].nome,P.scena===k)).join(''))}
${r('Tema e ora',bot('tema:+',ASCE.TEMI[P.tema].nome,false)+bot('fase:+',NOMI_F[P.fase],false)+bot('perd:+','Perdizione '+P.perd,false))}
${r('Grafica',bot('modo:3d','3D di oggi',P.modo==='3d')+bot('modo:pixel','Pixel',P.modo==='pixel')+bot('zoom:'+(P.zoom==='vicino'?'lontano':'vicino'),P.zoom==='vicino'?'Zoom vicino':'Zoom lontano',false))}
${r('Telecamera',bot('cam:ferma','Ferma',P.cam==='ferma')+bot('cam:segue','Segue un eroe',P.cam==='segue')+bot('contorni:'+(P.contorni?0:1),P.contorni?'Contorni sì':'Contorni no',false))}
<div class="pxp-info" aria-live="off">${Scena3D.fallita?'Grafica 3D non disponibile su questo dispositivo.':['no','lento'].includes(Scena3D.impo())?'Grafica 3D spenta: '+bot('s3:si','Accendi',false):'Preparo la scena…'}</div>
<div class="pxp-riga">${bot('pann:0','Nascondi',false)}<a class="b sm" href="${location.pathname}">Esci</a></div></div>`}
 function html(){const A=Bat.s.arena;
  return`<div class="bt-mappa"><svg class="bt-svg" viewBox="${BatMappa.viewBox(A,{k:1})}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg></div>${pannelloH()}`}
 function monta(){let el=document.querySelector('.pxp');if(!el){el=document.createElement('div');el.className='pxp';el.setAttribute('role','region');el.setAttribute('aria-label','Prova della resa pixel');document.body.appendChild(el)}
  el.innerHTML=html();Scena3D.dopo();Scena3D.sporca()}
 function pannello(){const el=document.querySelector('.pxp');if(!el)return;const p=el.querySelector('.pxp-pan,.pxp-mostra');if(p)p.outerHTML=pannelloH();else el.insertAdjacentHTML('beforeend',pannelloH())}
 // ---- avvio: al posto dell'ingresso nella Taverna (25-avvio) quando l'indirizzo ha ?prova=pixel ----
 function apri(){if(!vuole())return false;P.on=true;P.t0=performance.now();const q=new URLSearchParams(location.search),t=q.get('t');if(t!=null&&isFinite(+t))P.fisso=+t;
  if(SCENE[q.get('scena')])scena(q.get('scena'));if(ASCE.TEMI[q.get('tema')])P.tema=q.get('tema');if(FASI.includes(q.get('fase')))P.fase=q.get('fase');if(q.get('perd')!=null&&isFinite(+q.get('perd')))P.perd=+q.get('perd');
  battaglia();Scena3D.msMax=1e9;Scena3D.disegna=disegna;
  document.documentElement.classList.add('pxp-on');monta();const c=Scena3D.avvia();if(c)c.then(()=>{pannello();Scena3D.dopo()});return true}
 const gira=(l,x)=>l[(l.indexOf(x)+1)%l.length];
 function act(v){const[k,x]=String(v||'').split(':');let nuova=false;
  if(k==='modo'&&(x==='3d'||x==='pixel'))P.modo=x;else if(k==='zoom'&&(x==='lontano'||x==='vicino'))P.zoom=x;else if(k==='cam'&&(x==='ferma'||x==='segue'))P.cam=x;
  else if(k==='scena'&&SCENE[x]){scena(x);nuova=true}
  else if(k==='tema'){P.tema=x==='+'?gira(Object.keys(ASCE.TEMI),P.tema):ASCE.TEMI[x]?x:P.tema;P.scena=null;nuova=true}
  else if(k==='fase'){P.fase=x==='+'?gira(FASI,P.fase):FASI.includes(x)?x:P.fase;P.scena=null;nuova=true}
  else if(k==='perd'){P.perd=x==='+'?gira(PERD,P.perd):isFinite(+x)?+x:P.perd;P.scena=null;nuova=true}
  else if(k==='contorni')P.contorni=x==='1';else if(k==='pann')P.pann=x==='1';else if(k==='s3'){Scena3D.imposta('si');return monta()}
  if(nuova){battaglia();return monta()}
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
  else{const c=P.camMan||(P.cam==='segue'&&eroe)||centro(K);P.ult=Pixel.disegna(K,{x:c.x,y:0,z:c.z,k:APAL.k(),zoom:P.zoom,contorni:P.contorni,filo:P.filo,nebbia:P.nebbia})}
  misura(p0);if(P.fisso==null)K.sucio=true}
 // fps dagli intervalli fra un fotogramma e l'altro, ms = tempo di disegno sul processore
 function misura(p0){const t=performance.now();if(P.tPrec)P.fps.push(t-P.tPrec);P.tPrec=t;P.ms.push(t-p0);if(P.fps.length>90){P.fps.shift();P.ms.shift()}
  if(t-P.tInfo<500)return;P.tInfo=t;const el=document.querySelector('.pxp-info');if(!el)return;const s=stat(),u=P.ult;
  el.textContent=(u?`${u.art[0]}×${u.art[1]} pixel d'arte · ×${u.s} · ${(APAL.ALTO_EROE)} px l'eroe`:'3D di oggi')+` · ${s.fps} fps · ${s.ms.toFixed(1).replace('.',',')} ms`}
 const med=a=>{const b=a.slice().sort((x,y)=>x-y);return b.length?b[b.length>>1]:0};
 function stat(){const f=med(P.fps);return{fps:f?Math.round(1000/f):0,ms:med(P.ms),n:P.fps.length}}
 return{P,PIANTE,SCENE,NEMICI,apri,act,disegna,stat,vuole,
  // per i test: tempo fermo, telecamera a mano, lettura del bersaglio rifinito, riquadri delle miniature
  ferma(t){P.fisso=t;Scena3D.sporca()},camera(x,z){P.camMan=x==null?null:{x,z};Scena3D.sporca()},
  figure(){const u=P.ult;return u?Scena3D.figure().map(f=>Object.assign({id:f.id,lato:f.lato},Pixel.riquadro(Scena3D.K,u,f.g,f.alt,f.r))):[]},
  // un fotogramma subito, con lo schermo letto prima di ogni altra chiamata a WebGL e il bersaglio rifinito; o.filo/o.nebbia = false li spengono
  scatta(o){o=o||{};if(o.cam)P.camMan={x:o.cam[0],z:o.cam[1]};if(o.zoom)P.zoom=o.zoom;if(o.contorni!=null)P.contorni=o.contorni;P.filo=o.filo;P.nebbia=o.nebbia;const K=Scena3D.K;disegna(K);
   let schermo=null;if(o.schermo){const gl=K.ren.getContext(),W=K.cv.width,H=K.cv.height;schermo={w:W,h:H,px:new Uint8Array(W*H*4)};gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,schermo.px)}
   const basso=Pixel.leggi(K);P.filo=P.nebbia=undefined;return{ult:P.ult,schermo,basso}}}})();
