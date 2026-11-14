/* ---- Crocevia: la scena 3D della home (Taverna). Notte, una torcia in cima al palo, le vie che si diramano, l'omino che arriva
   e imbocca la via dell'insegna toccata. Solo con la lobby 3D e WebGL; altrimenti resta la scena disegnata (SVG) di Plancia.homeH.
   Impostazione di prova `cv-3d`: 'si' salta la sonda dei fps, 'no' la spegne. ---- */
const Crocevia=(()=>{
 const K={pronta:false,fallita:false,carica:false,host:null,raf:0,W:0,H:0,passa:false,quando:0};
 const st={mode:'arrivo',pts:[],d:0,len:0,fine:'idle',porta:false,t:0};
 const PI=Math.PI,CASA={x:0,z:1.9},VEL=4.2,ATTESA=750;
 const attiva=()=>ui.lobby==='3d'&&ST('cv-3d')!=='no'&&!K.fallita&&VENDOR.gl();
 const dir=g=>{const r=g*PI/180;return{x:Math.sin(r),z:-Math.cos(r)}};
 let T,ren,scn,cam,man,fig,cardine,luceP,chiave,alone,fiamme=[],lucc=[],trem=[],cv;
 // ---- piccoli aiuti ----
 const MAT={},m=(c,r,mt)=>MAT[c+'|'+r+'|'+mt]||(MAT[c+'|'+r+'|'+mt]=new T.MeshStandardMaterial({color:c,roughness:r==null?.85:r,metalness:mt||0}));
 const me=(geo,mat,x,y,z,o)=>{const k=new T.Mesh(geo,mat);k.position.set(x||0,y||0,z||0);o=o||{};k.castShadow=o.cast!==false;k.receiveShadow=o.recv!==false;return k};
 const bx=(w,h,d,mat,x,y,z,o)=>me(new T.BoxGeometry(w,h,d),mat,x,y,z,o);
 const tela=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 function caso(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 function texPietra(R){const c=tela(256,256),g=c.getContext('2d');g.fillStyle='#241b13';g.fillRect(0,0,256,256);let y=0,riga=0;
  while(y<256){const h=26+R()*10;let x=riga%2?-20:0;while(x<256){const w=44+R()*32,v=62+R()*34;g.fillStyle=`rgb(${v|0},${v*.8|0},${v*.58|0})`;g.fillRect(x+2,y+2,w-4,h-4);x+=w}y+=h;riga++}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;return t}
 function texAlone(stop){const c=tela(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);stop.forEach(s=>gr.addColorStop(s[0],s[1]));g.fillStyle=gr;g.fillRect(0,0,128,128);return new T.CanvasTexture(c)}
 function texInsegna(){const c=tela(512,170),g=c.getContext('2d');g.fillStyle='#3a2314';g.fillRect(0,0,512,170);g.strokeStyle='#9a6a3a';g.lineWidth=6;g.strokeRect(8,8,496,154);
  g.textAlign='center';g.textBaseline='middle';g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=5;g.shadowOffsetY=3;
  g.font='700 64px "Alegreya SC",Georgia,serif';g.fillStyle='#ffb23e';g.fillText('La Taverna',256,60);g.font='700 50px "Alegreya SC",Georgia,serif';g.fillStyle='#e8d8b0';g.fillText('dei Giochi',256,120);
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t}
 let texA;
 function bagliore(g,x,y,z,s,op){const sp=new T.Sprite(new T.SpriteMaterial({map:texA,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:op}));sp.position.set(x,y,z);sp.scale.set(s,s,1);g.add(sp);return sp}
 function punto(g,x,y,z,col,int,dist,tr){const l=new T.PointLight(col,int,dist,1.6);l.position.set(x,y,z);g.add(l);if(tr)trem.push({l,b:int,a:tr,p:trem.length*1.7});return l}
 // ---- l'omino: un pupazzo di legno con cappello a tesa e sciarpa ----
 function omino(){const g=new T.Group(),veste=m(0x1c2f4d,.88),pelle=m(0xf0c4a0,.55),capp=m(0x121c30,.8),sci=m(0x8a2a1c,.9);
  const pm=(geo,mat,x,y,z)=>{const k=me(geo,mat,x,y,z);g.add(k);return k},S=(r,a,b)=>new T.SphereGeometry(r,a||14,b||10),C=(a,b,h,s)=>new T.CylinderGeometry(a,b,h,s||20);
  const corpo=pm(new T.LatheGeometry([[0,0],[1.5,0],[1.5,1.2],[1.3,2.4],[1.15,3.4],[.85,4.05],[.45,4.38],[.3,4.5],[0,4.5]].map(p=>new T.Vector2(p[0],p[1])),22),veste);corpo.scale.set(1,1,.62);
  pm(C(1.42,1.45,.22,24),m(0x1a0f09,.6),0,2.1,0).scale.set(1,1,.62);
  [-1,1].forEach(q=>{pm(S(.34),veste,q*.95,4,0);const b=pm(C(.22,.2,1.5,10),veste,q*1.15,3.45,.45);b.rotation.set(-.7,0,q*.45);pm(S(.22,10,8),pelle,q*.95,3.0,1.0);pm(S(.055,8,6),m(0x140a06),q*.18,5.1,.5)});
  pm(S(.52,22,16),pelle,0,5.05,.08).scale.set(.92,1.06,.96);pm(S(.085,8,6),pelle,0,4.98,.55);
  pm(C(.95,.95,.07,28),capp,0,5.5,.05);pm(C(.5,.58,.55,20),capp,0,5.8,.05);
  const s=pm(new T.TorusGeometry(.58,.2,8,24),sci,0,4.38,.04);s.rotation.x=PI/2;pm(new T.BoxGeometry(.3,1,.12),sci,.32,3.8,.62).rotation.z=.15;
  g.scale.setScalar(.55);return g}
 // ---- la taverna in fondo alla via di mezzo ----
 function taverna(){const g=new T.Group(),intonaco=m(0x54462f,.92),trave=m(0x24160c,.8),tetto=m(0x2a1712,.9),pietra=m(0x3c3836,.9),ferro=m(0x141316,.5,.3),caldo=new T.MeshBasicMaterial({color:new T.Color(2.3,1.35,.5)});
  const a=(...k)=>k.forEach(x=>g.add(x));
  a(bx(12,4.6,.4,intonaco,0,2.3,0),bx(12.3,.7,.7,pietra,0,.35,.05),bx(12.3,.34,.14,trave,0,4.55,.27),bx(.26,3.4,.12,trave,0,6.2,.27));
  [[-5.9,2.3,.36,4.6],[5.9,2.3,.36,4.6],[-1.5,2.5,.26,4.2],[1.5,2.5,.26,4.2]].forEach(b=>g.add(bx(b[2],b[3],.12,trave,b[0],b[1],.26)));
  const f=new T.Shape();f.moveTo(-6.2,0);f.lineTo(6.2,0);f.lineTo(0,3.7);f.lineTo(-6.2,0);g.add(me(new T.ShapeGeometry(f),new T.MeshStandardMaterial({color:0x54462f,roughness:.92,side:T.DoubleSide}),0,4.6,.18));
  const lf=Math.sqrt(6.6*6.6+3.9*3.9),af=Math.atan2(3.9,6.6);[-1,1].forEach(q=>{const r=bx(lf+.6,.3,5.4,tetto,q*3.25,6.58,-1.7);r.rotation.z=-q*af;g.add(r)});
  g.add(bx(1.1,2.6,1.1,pietra,3.6,8.2,-2.4));
  [-3.6,3.6].forEach(x=>{a(me(new T.PlaneGeometry(1.7,1.8),caldo,x,2.6,.215,{cast:false,recv:false}),bx(2,.16,.16,trave,x,3.55,.28),bx(2,.16,.2,trave,x,1.65,.3),
   bx(.14,1.9,.14,trave,x-.92,2.6,.28),bx(.14,1.9,.14,trave,x+.92,2.6,.28),bx(.08,1.8,.08,trave,x,2.6,.26),bx(1.7,.08,.08,trave,x,2.6,.26));bagliore(g,x,2.6,.6,3,.3)});
  a(me(new T.CircleGeometry(.55,20),caldo,0,6.3,.2,{cast:false,recv:false}),bx(.1,1.1,.1,trave,0,6.3,.26),bx(1.1,.1,.1,trave,0,6.3,.26));
  a(me(new T.PlaneGeometry(1.8,3.1),caldo,0,1.75,.212,{cast:false,recv:false}),bx(.2,3.3,.2,trave,-1,1.85,.3),bx(.2,3.3,.2,trave,1,1.85,.3),bx(2.2,.22,.22,trave,0,3.4,.3),bx(2.4,.2,1,pietra,0,.1,.75));
  cardine=new T.Group();cardine.position.set(-.9,.2,.3);g.add(cardine);
  cardine.add(bx(1.8,3.1,.1,m(0x2a170b,.7),.9,1.55,0),bx(1.8,.1,.12,ferro,.9,2.5,.01),bx(1.8,.1,.12,ferro,.9,.7,.01),me(new T.SphereGeometry(.07,10,8),m(0xe2b13c,.35,.4),1.55,1.55,.09,{cast:false}));
  g.add(me(new T.PlaneGeometry(3,1),new T.MeshStandardMaterial({map:texInsegna(),roughness:.8}),0,4.02,.34,{cast:false,recv:false}));
  a(bx(.14,.14,1.1,ferro,1.95,3.6,.3),bx(.5,.8,.5,ferro,1.95,2.9,.75),me(new T.BoxGeometry(.36,.62,.36),new T.MeshBasicMaterial({color:new T.Color(3,1.9,.8)}),1.95,2.9,.75,{cast:false,recv:false}));bagliore(g,1.95,2.9,.75,3,.7);punto(g,1.95,2.9,1.15,0xffb060,.7,13,.12);
  [[-2.2,1.1,.5],[-2.95,.95,.42]].forEach(b=>{g.add(me(new T.CylinderGeometry(b[2]*.95,b[2]*.95,b[2]*2.6,14),m(0x2d1a0f,.8),b[0],b[2]*1.3,b[1]));
   [.5,2.1].forEach(h=>{const t=me(new T.TorusGeometry(b[2]*.97,.03,6,24),ferro,b[0],b[2]*h,b[1],{cast:false});t.rotation.x=PI/2;g.add(t)})});
  luceP=punto(g,0,2.6,1.4,0xffa550,.8,10,.06);g.position.set(0,0,-10.5);g.scale.setScalar(.8);return g}
 // ---- la scena ----
 function costruisci(){T=window.THREE;const R=caso(7);cv=document.createElement('canvas');cv.className='hm-cv';cv.setAttribute('aria-hidden','true');
  ren=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});ren.outputEncoding=T.sRGBEncoding;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.35;
  ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;
  scn=new T.Scene();scn.background=new T.Color(0x0a1220);scn.fog=new T.FogExp2(0x0a1220,.026);cam=new T.PerspectiveCamera(38,1,.1,200);
  texA=texAlone([[0,'rgba(255,230,170,1)'],[.25,'rgba(255,190,100,.55)'],[1,'rgba(255,160,60,0)']]);
  // luci: la torcia ambra domina, la luna fredda fa da controluce
  scn.add(new T.HemisphereLight(0x2c3f66,0x0a0806,.34));const luna=new T.DirectionalLight(0x7f9bd8,.4);luna.position.set(-9,12,-10);scn.add(luna);
  chiave=new T.SpotLight(0xffa64d,3.3,21,1.3,.8,1.5);chiave.position.set(0,5.65,0);chiave.target.position.set(0,0,.6);chiave.castShadow=true;chiave.shadow.mapSize.set(1024,1024);chiave.shadow.bias=-.002;chiave.shadow.radius=4;
  scn.add(chiave,chiave.target);punto(scn,0,5.55,.3,0xffa64d,1.5,15,.14);punto(scn,.4,2,2.8,0xff9a48,.75,7,0);
  // terreno, piazzola e vie
  const suolo=me(new T.CircleGeometry(70,40),m(0x18281b,1),0,0,0,{cast:false});suolo.rotation.x=-PI/2;scn.add(suolo);
  const tp=texPietra(R),tv=tp.clone();tv.needsUpdate=true;tv.repeat.set(1,7);tp.repeat.set(2,2);const via=new T.MeshStandardMaterial({map:tv,roughness:1}),piazza=new T.MeshStandardMaterial({map:tp,roughness:1});
  VIE.forEach((g,i)=>{const d=dir(g),L=g===180?22:15,p=me(new T.PlaneGeometry(1.7,L),via,d.x*L/2,.04+i*.004,d.z*L/2,{cast:false});p.rotation.x=-PI/2;p.rotation.z=-g*PI/180;scn.add(p);
   if(g!==180&&g!==0)bagliore(scn,d.x*13.5,1.2,d.z*13.5,1.3,.5)});
  const pz=me(new T.CircleGeometry(2.5,30),piazza,0,.075,0,{cast:false});pz.rotation.x=-PI/2;scn.add(pz);
  scn.add(taverna());
  // alberi a pochi poligoni, mai sulle vie né davanti alla telecamera
  const tronco=m(0x1c120b,1),foglie=[0x10241a,0x0b1b14].map(c=>new T.MeshStandardMaterial({color:c,roughness:1,flatShading:true})),cono=new T.ConeGeometry(1,1,7),fusto=new T.CylinderGeometry(.16,.24,1,6);
  let n=0,giri=0;while(n<46&&giri++<900){const ra=R()*PI*2,rr=5+R()*19,x=Math.sin(ra)*rr,z=-Math.cos(ra)*rr;let ok=!(Math.abs(x)<7&&z<-7.5&&z>-17)&&!(z>4&&Math.abs(x)<6.5);
   VIE.forEach(g=>{const d=dir(g),al=x*d.x+z*d.z;if(al>0&&Math.hypot(x-d.x*al,z-d.z*al)<2.1)ok=false});if(!ok)continue;
   const h=5+R()*5,a=new T.Group(),f=new T.Mesh(fusto,tronco);f.scale.set(h*.14,h*.3,h*.14);f.position.y=h*.15;a.add(f);
   [[.34,.42,.25],[.27,.4,.5],[.18,.36,.74]].forEach(c=>{const k=new T.Mesh(cono,foglie[n%2]);k.scale.set(h*c[0],h*c[1],h*c[0]);k.position.y=h*c[2]+h*c[1]/2-.1*h;a.add(k)});a.position.set(x,0,z);a.rotation.y=n*1.7;scn.add(a);n++}
  // il palo: una freccia per via, la torcia in cima
  scn.add(me(new T.CylinderGeometry(.12,.16,4.9,10),m(0x2a190d,.8),0,2.45,0),me(new T.CylinderGeometry(.42,.5,.26,12),m(0x3c3836,.9),0,.13,0));
  const fr=new T.Shape();[[.1,-.2],[1.25,-.2],[1.55,0],[1.25,.2],[.1,.2],[.1,-.2]].forEach((p,i)=>i?fr.lineTo(p[0],p[1]):fr.moveTo(p[0],p[1]));
  const gf=new T.ExtrudeGeometry(fr,{depth:.07,bevelEnabled:false});gf.translate(0,0,-.035);const asse=new T.MeshStandardMaterial({color:0x4a2a12,roughness:.75,side:T.DoubleSide});
  VIE.filter(g=>g!==180).forEach((g,i)=>{const k=me(gf,asse,0,4.2-i*.42,0);k.rotation.y=PI/2-g*PI/180;scn.add(k)});
  scn.add(me(new T.CylinderGeometry(.3,.16,.4,10,1,true),new T.MeshStandardMaterial({color:0x1b1a1d,roughness:.5,metalness:.3,side:T.DoubleSide}),0,5.05,0));
  [[.24,.9,0xff7a1a],[.16,.7,0xffb23e],[.09,.48,0xffe08a]].forEach((c,i)=>{const k=new T.Mesh(new T.ConeGeometry(c[0],c[1],8),new T.MeshBasicMaterial({color:new T.Color(c[2]).multiplyScalar(1.6),transparent:true,opacity:.95,fog:false}));
   k.position.set(0,5.2+c[1]/2,0);scn.add(k);fiamme.push({m:k,h:c[1],p:i*2.1})});
  alone=bagliore(scn,0,5.5,0,4.6,.9);
  // l'omino e la sua ombra morbida
  man=new T.Group();fig=omino();man.add(fig);const om=me(new T.CircleGeometry(.75,20),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}),0,.1,0,{cast:false,recv:false});om.rotation.x=-PI/2;man.add(om);scn.add(man);
  for(let i=0;i<10;i++){const x=(R()-.5)*14,y=1+R()*2.5,z=-6+R()*10;lucc.push({s:bagliore(scn,x,y,z,.22,.9),x,y,z,p:R()*6})}
  K.pronta=true;arriva()}
 const VIE=[0,45,-45,90,-90,135,180];
 // ---- cammino lungo una spezzata ----
 function percorso(pts,fine,porta){st.pts=pts;st.d=0;st.len=0;for(let i=1;i<pts.length;i++)st.len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);st.fine=fine;st.porta=!!porta;st.mode='cammino';st.t=0}
 function arriva(){man.position.set(0,0,13);man.rotation.y=PI;man.scale.setScalar(1);percorso([[0,13],[CASA.x,CASA.z]],'idle')}
 function verso(g){const d=dir(g),qui=[man.position.x,man.position.z];
  if(g===0)return percorso([qui,[.95,.3],[0,-1.9],[0,-10.3]],'via',true);
  percorso([qui,[d.x*1.5,d.z*1.5],[d.x*12.5,d.z*12.5]],'via')}
 function lungo(){let r=st.d;for(let i=1;i<st.pts.length;i++){const a=st.pts[i-1],b=st.pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(r<=l||i===st.pts.length-1){const k=l?Math.min(1,r/l):1;return[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]}r-=l}return st.pts[0]}
 const giro=q=>{while(q>PI)q-=2*PI;while(q<-PI)q+=2*PI;return q};
 // ---- montaggio nella pagina ----
 function misura(){const w=K.host;if(!w)return;const W=w.clientWidth|0,H=w.clientHeight|0;if(!W||!H||(W===K.W&&H===K.H))return;K.W=W;K.H=H;
  ren.setPixelRatio(Math.min(1.75,window.devicePixelRatio||1));ren.setSize(W,H,false);cam.aspect=W/H;
  const tv=Math.tan(cam.fov*PI/360),d=Math.max(8.6/tv,9.2/(tv*cam.aspect)),t=new T.Vector3(0,1.2,-4.2);cam.position.copy(t).addScaledVector(new T.Vector3(0,.66,1).normalize(),d);cam.lookAt(t);cam.updateProjectionMatrix()}
 function parcheggia(){if(K.raf){cancelAnimationFrame(K.raf);K.raf=0}if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);if(K.host)K.host.classList.remove('cv-on');K.host=null}
 function guasto(e){K.fallita=true;parcheggia();if(e)ERR.n(e,'crocevia')}
 function dopo(){
  try{const w=document.querySelector('.hm-hero');if(!w||!attiva()){if(K.host||cv&&cv.parentNode)parcheggia();return}
   if(!K.pronta){if(!K.carica){K.carica=true;VENDOR.load('three').then(()=>{try{costruisci()}catch(e){guasto(e)}dopo()},()=>{K.fallita=true})}return}
   if(K.host!==w){const nuovo=!K.host;K.host=w;K.W=0;w.insertBefore(cv,w.firstChild);if(nuovo&&st.mode!=='cammino')arriva();K.t0=0;K.n=0}
   w.classList.add('cv-on');misura();if(!K.raf){K.ult=0;K.raf=requestAnimationFrame(passo)}}
  catch(e){guasto(e)}}
 // ---- un fotogramma ----
 let ora=0;
 function passo(ms){K.raf=0;if(!K.host||!K.host.isConnected)return parcheggia();
  const dt=Math.min(.05,K.ult?(ms-K.ult)/1000:.016);K.ult=ms;ora+=dt;
  // sonda: sotto ~12 fotogrammi al secondo si torna alla scena disegnata
  if(ST('cv-3d')!=='si'&&K.n>=0){if(!K.t0)K.t0=ms;K.n++;if(ms-K.t0>2500){if(K.n/((ms-K.t0)/1000)<12)return guasto();K.n=-1}}
  misura();const fk=Math.sin(ora*11)*.6+Math.sin(ora*23+1)*.4;
  trem.forEach(f=>{f.l.intensity=f.b*(1+f.a*(Math.sin(ora*11+f.p)*.6+Math.sin(ora*23+f.p*2)*.4))});chiave.intensity=3.3*(1+.1*fk);alone.material.opacity=.85+fk*.08;
  fiamme.forEach(f=>{const s=1+Math.sin(ora*13+f.p)*.14;f.m.scale.set(1+Math.sin(ora*17+f.p)*.1,s,1);f.m.position.y=5.2+f.h*s/2});
  lucc.forEach(f=>{f.s.position.set(f.x+Math.sin(ora*.5+f.p)*.8,f.y+Math.sin(ora*.9+f.p*2)*.4,f.z+Math.cos(ora*.4+f.p)*.8);f.s.material.opacity=.5+.5*Math.sin(ora*2+f.p)});
  let apri=0;
  if(st.mode==='cammino'){st.t+=dt;st.d=Math.min(st.len,st.d+VEL*dt*(RM?40:1));const p=lungo(),dx=p[0]-man.position.x,dz=p[1]-man.position.z;
   if(Math.abs(dx)+Math.abs(dz)>1e-4)man.rotation.y+=giro(Math.atan2(dx,dz)-man.rotation.y)*Math.min(1,dt*9);
   man.position.set(p[0],Math.abs(Math.sin(st.t*9))*.1,p[1]);fig.rotation.z=Math.sin(st.t*9)*.07;const resto=st.len-st.d;
   if(st.porta)apri=Math.min(1,Math.max(0,(3.4-resto)/1.6));if(st.fine==='via')man.scale.setScalar(resto<1.2?Math.max(.001,resto/1.2):1);
   if(resto<=0){fig.rotation.z=0;man.position.y=0;if(st.fine==='via'){st.mode='rientro';st.t=0}else st.mode='idle'}}
  else if(st.mode==='rientro'){st.t+=dt;apri=st.porta?Math.max(0,1-st.t/.9):0;if(st.t>.9)arriva()}
  else{man.rotation.y+=giro(PI-man.rotation.y)*Math.min(1,dt*5);fig.rotation.z=RM?0:Math.sin(ora*1.6)*.025;fig.position.y=RM?0:Math.abs(Math.sin(ora*1.6))*.03}
  cardine.rotation.y=-1.9*apri;luceP.intensity*=1+2*apri;
  ren.render(scn,cam);K.raf=requestAnimationFrame(passo)}
 // un tocco su un'insegna (data-cv = gradi della via): l'omino parte, e l'azione vera arriva poco dopo. false = non mi riguarda, prosegui subito
 function parte(t){if(K.passa){K.passa=false;return false}
  if(!K.pronta||!K.host||K.fallita||RM||!K.raf)return false;if(Date.now()<K.quando)return true;
  const a=t.dataset.a,v=t.dataset.v;verso(+t.dataset.cv||0);K.quando=Date.now()+ATTESA;
  setTimeout(()=>{K.quando=0;const b=document.querySelector(`.hm [data-cv][data-a="${a}"]${v?`[data-v="${v}"]`:''}`);if(!b||b.disabled)return;K.passa=true;b.click();K.passa=false},ATTESA);return true}
 return{dopo,parte,st,K};
})();
