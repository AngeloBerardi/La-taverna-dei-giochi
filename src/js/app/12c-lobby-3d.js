/* ---- Lobby 3D: la locanda isometrica ----
   Solo estetica della stanza: legge membri, ospiti, chat ed emote dallo stato esistente (R, lobbySeats),
   per scegliere un gioco apre lo scaffale dell'app (ui.tab='games', ui.pick) e non tocca motori, rete o avvio partita.
   three.js r128 viene caricato solo quando si sceglie questa lobby; se manca WebGL o la rete si torna al falò. */
const L3D=(()=>{
 const URL3='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
 let state='idle',T=null,K=null,el=null,ren=null,scene=null,ocam=null,pcam=null,S=null,raf=0,last=0,seatSig='',view=null,vp=null,vl=null;
 const PI=Math.PI;
 /* catalogo per le copertine: icona procedurale per ogni gioco */
 const ICON={regicide:0,briscola:1,burraco:2,gang:3,saboteur:4,azul:5,island:6,machiavelli:7,scopa:9,mind:10,mindx:11,harvest:12,valle:13,discesa:14,scoundrel:15,uno:9,pets:6,catan:13,kittens:3,perudo:14};
 const CATN={carte:'Carte',tavolo:'Da tavolo',coop:'Cooperativi',solo:'Solitari'};
 const lum=h=>{const n=parseInt(h.slice(1),16);return(.3*(n>>16&255)+.59*(n>>8&255)+.11*(n&255))/255};
 function catalog(){return GAMES.map(g=>{const ti=(typeof tvInfo==='function'?tvInfo(g):(TVG[g.id]||['tavolo',g.name.toUpperCase()])),b=(typeof TVB!=='undefined'&&TVB[g.id])||null;
  let c=b?b.c[0]:(TVC[ti[0]]||TVC.tavolo).s;if(lum(c)>.62)c=b?b.c[1]:'#4a3a2a';if(lum(c)>.62)c='#5a3a24';
  return{id:g.id,t:g.name,l:ti[1].length>12?ti[1].slice(0,12):ti[1],c,m:ICON[g.id]!=null?ICON[g.id]:(g.id.length%15),k:ti[0],g}})}
 /* avatar: av3 se presente, altrimenti traduce il pupazzetto a pixel {t,h,c,s} dell'app */
 const HEADS=['beret','crown','hood','elmo','none','top'];
 function avTo3(av,av3,i){if(av3)return Object.assign({},av3);const a=av||{};const hx=c=>parseInt(String(c).slice(1),16);
  const H=(typeof AVC!=='undefined'&&AVC[(a.h||0)%AVC.length])||['#6a3a1c'],C=(typeof AVC!=='undefined'&&AVC[(a.c!=null?a.c:i+3)%AVC.length])||['#9a3a1c'],sk=(typeof AVS!=='undefined'&&AVS[(a.s||0)%AVS.length])||'#f2c29b';
  const head=HEADS[(a.t||0)%HEADS.length];return{robe:hx(C[0]),skin:hx(sk),head:head,hatc:hx(H[0]),hair:head==='none'?'short':'bald',hairc:hx(H[1]||H[0])}}
 function myAv3(){const a=R.mine.av3||(()=>{try{return JSON.parse(ST('rg-av3')||'null')}catch(e){return null}})();return avTo3(R.mine.av,a,0)}
 function hasGL(){try{const c=document.createElement('canvas');return!!(c.getContext('webgl')||c.getContext('experimental-webgl'))}catch(e){return false}}
 function fail(msg){state='fail';ui.lobby='iso';ST('rg-lobby','iso');ui.err=msg;render()}
 function boot(){if(state!=='idle')return;state='loading';
  if(!hasGL())return fail('La locanda 3D richiede WebGL: torno al falò.');
  const go=()=>{try{init();state='ready';mount()}catch(e){console.error(e);fail('La locanda 3D non si è avviata su questo dispositivo: torno al falò.')}};
  if(window.THREE)return go();
  const s=document.createElement('script');s.src=URL3;s.onload=go;s.onerror=()=>fail('Non riesco a scaricare la grafica 3D (serve la rete): torno al falò.');document.head.appendChild(s)}
 /* ---------- costruzione ---------- */
 function init(){
  T=window.THREE;
  el=document.createElement('div');el.className='l3d';
  el.innerHTML='<div class="l3d-st"></div><div class="l3d-tags"></div><div class="l3d-plq"></div><div class="l3d-zb"></div><div class="l3d-pg"></div><div class="l3d-hint">Tocca il pavimento per camminare, uno scaffale per i giochi, il guardaroba o lo specchio per cambiarti.</div><div class="l3d-cust"></div><div class="l3d-fade"></div>';
  ren=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  ren.setPixelRatio(Math.min(2,window.devicePixelRatio||1));ren.outputEncoding=T.sRGBEncoding;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.9;
  ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;
  el.querySelector('.l3d-st').appendChild(ren.domElement);
  K=TavernaKit(T,ren,{games:catalog(),tagsEl:el.querySelector('.l3d-tags')});
  scene=new T.Scene();scene.background=new T.Color(0x07060d);scene.fog=new T.FogExp2(0x07060d,.0012);
  ocam=new T.OrthographicCamera(-1,1,1,-1,1,400);pcam=new T.PerspectiveCamera(50,1,1,300);
  S=build();scene.add(S.g);
  ren.domElement.addEventListener('pointerdown',pDown);ren.domElement.addEventListener('pointerup',pUp);ren.domElement.addEventListener('pointercancel',()=>{ptr=null});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loop()});
 }
 function build(){
  const S=K.newS(),g=S.g,W=28,D=22,M=K.M,box=K.box,mesh=K.mesh,std=K.std;
  S.cam={tx:1.5,ty:3,tz:3,fitW:15};S.fx=S.fx||[];S.hit=[];S.boxes={};S.dest={};S.cases=[];
  K.hall(S,W,D,15);K.fireplace(S,W,1.2);S.fireL=S.flick[S.flick.length-1];
  g.add(box(W+.6,.9,D+.6,M.dark,0,-.46,0,false));
  const fx=-W/2,bz=-D/2+1.7;
  // bancone, bottiglie, oste
  g.add(box(8,2.4,1.5,M.dark,8,1.2,bz));g.add(box(8.4,.24,1.9,M.tableEdge,8,2.5,bz));
  K.shelfBottles(S,8,5.6,-D/2+.8,7,7.6);K.shelfBottles(S,8,8.2,-D/2+.8,6,7.6);
  const ho=K.figure({robe:0x4a3a1c,head:'brim',hatc:0x2a2010,skin:0xc98f64});ho.position.set(8.6,0,-D/2+.7);ho.scale.setScalar(.55);g.add(ho);ho.add(box(1.9,2.3,.08,std({color:0xe6dcc4,roughness:.9}),0,2.6,.97));
  K.barrel(S,12.9,-D/2+2.2,.8);K.pendant(S,8,12,bz+1,.6,0xffc477,1.1,14);
  S.plq=mesh(new T.PlaneGeometry(3.8,1.9),std({roughness:.7}),8,11,-D/2+.07,false,true);g.add(S.plq);
  // muretti dei lati aperti
  const lwM=std({map:K.rep(K.wallTex,4,.3),bumpMap:K.rep(K.wallTex,4,.3),bumpScale:.9,roughness:.85});
  g.add(box(W+.4,1.1,.4,lwM,0,.55,D/2+.1));g.add(box(.4,1.1,D,lwM,W/2+.1,.55,0));
  // pianta nell'angolo
  K.plant(S,-12.85,-9.85,1.05);
  // porta del bagno (specchio)
  const dsh=new T.Shape();dsh.moveTo(-1.1,0);dsh.lineTo(1.1,0);dsh.lineTo(1.1,3.4);dsh.absarc(0,3.4,1.1,0,PI,false);dsh.lineTo(-1.1,0);
  g.add(new T.Mesh(new T.ShapeGeometry(dsh),new T.MeshBasicMaterial({color:0x0a0604})).translateX(1.9).translateZ(-D/2+.06));
  const dg=new T.ExtrudeGeometry(dsh,{depth:.16,bevelEnabled:false});dg.translate(1.1,0,0);
  const bdoor=new T.Group();bdoor.position.set(.8,0,-D/2+.12);g.add(bdoor);const dl=mesh(dg,std({map:K.rep(K.darkWood,.5,.5),color:0xb08a68,roughness:.7}));bdoor.add(dl);
  bdoor.add(mesh(new T.TorusGeometry(.14,.035,8,14),M.gold,1.9,1.8,.2,false,false));
  g.add(mesh(new T.PlaneGeometry(2.2,.6),std({map:K.signTex(['SPECCHIO'],512,128,{fs:62}),roughness:.8}),1.9,5.3,-D/2+.08,false,false));
  [-1,1].forEach(sd=>g.add(box(.3,4.6,.3,M.dark,1.9+sd*1.25,2.3,-D/2+.15)));
  dl.userData.item='bath';S.hit.push(dl);S.bdoor=bdoor;
  // guardaroba con le spalle al muretto
  const ward=new T.Group();ward.position.set(12.95,0,.4);ward.rotation.y=-PI/2;g.add(ward);
  ward.add(box(2.8,5.4,1.4,M.dark,0,2.7,0));ward.add(box(3.1,.35,1.6,M.tableEdge,0,5.55,0));ward.add(box(3.0,.3,1.55,M.tableEdge,0,.15,0));
  ward.add(box(2.4,4.6,.1,std({color:0x150b06}),0,2.8,.66));
  [[0xb03a2a,-.7],[0x2a4a8a,-.2],[0x3a7a3a,.3],[0x8a6a2a,.75]].forEach(c=>ward.add(box(.38,2.6,.9,std({color:c[0],roughness:.9}),c[1],3.2,.05)));
  S.wdoors=[-1,1].map(sd=>{const pv=new T.Group();pv.position.set(sd*1.3,0,.72);ward.add(pv);const d=box(1.3,4.8,.12,std({map:K.rep(K.darkWood,.5,.5),color:0x9a7458,roughness:.7}),-sd*.65,2.8,0);pv.add(d);pv.userData.sd=sd;return pv});
  ward.traverse(m=>{if(m.isMesh){m.userData.item='ward';S.hit.push(m)}});
  // scaffali per categoria, 2x2 a pagine
  const cat=catalog(),cats=['carte','tavolo','coop','solo'].concat([...new Set(cat.map(x=>x.k))].filter(k=>!CATN[k]));
  const SL=[[-9.3,-D/2+.05,0],[-3.4,-D/2+.05,0],[fx+.05,-6.0,PI/2],[fx+.05,8.25,PI/2],[-7.6,-2.2,0]];
  cats.forEach((k,ci)=>{const list=cat.map((x,i)=>i).filter(i=>cat[i].k===k);if(!list.length||!SL[ci])return;bookcase(S,k,list,SL[ci],cat)});
  // tavolo lungo
  const TX=1.5,TZ=4.2,TD=2.7,TH=1.5;S.T={TX,TZ,TD,TH};
  const tg=new T.Group();tg.position.set(TX,0,TZ);g.add(tg);S.tg=tg;
  S.top=box(1,.24,TD,M.tableEdge,0,TH,0);tg.add(S.top);S.apr=box(1,.32,TD-.3,M.dark,0,TH-.27,0);tg.add(S.apr);
  S.benches=[1,-1].map(s=>{const b=box(1,.16,.7,M.dark,0,.86,s*(TD/2+.8));tg.add(b);return b});
  S.legs=[];[-1,1].forEach(e=>[-1,1].forEach(s=>{const l=box(.24,TH-.1,.24,M.dark,0,(TH-.1)/2,s*(TD/2-.3));l.userData.e=e;tg.add(l);S.legs.push(l);const bl=box(.18,.8,.5,M.dark,0,.42,s*(TD/2+.8));bl.userData.e=e;bl.userData.b=1;tg.add(bl);S.legs.push(bl)}));
  S.head=new T.Group();tg.add(S.head);S.head.add(box(1.1,.14,1.1,M.dark,0,1.0,0));S.head.add(box(.14,1.4,1.1,M.dark,.55,1.6,0));
  [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]].forEach(p=>S.head.add(box(.12,1,.12,M.dark,p[0],.5,p[1])));
  [S.top,S.benches[0],S.benches[1]].forEach(m=>{m.userData.item='T';S.hit.push(m)});
  S.lamps=[0,1,2].map(()=>K.pendant(S,TX,6.0,TZ,.38,0xffc477,1.0,11));
  const key=new T.SpotLight(0xffc477,.75,70,.95,.9,1.0);key.position.set(0,18,5);key.target.position.set(0,0,1);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=6;key.shadow.camera.far=42;key.shadow.bias=-.0004;key.shadow.normalBias=.04;g.add(key);g.add(key.target);
  S.L=4.6;S.Lt=4.6;S.seated=[];
  // camino toccabile
  const fh=new T.Mesh(new T.BoxGeometry(2.4,6.6,7.6),new T.MeshBasicMaterial({visible:false}));fh.position.set(-W/2+1.2,3.3,1.2);fh.userData.item='fire';g.add(fh);S.hit.push(fh);
  // pavimento per i tocchi
  const pick=new T.Mesh(new T.PlaneGeometry(W,D),new T.MeshBasicMaterial({visible:false}));pick.rotation.x=-PI/2;g.add(pick);S.floor=pick;
  // tu
  S.pos=new T.Vector3(6,0,8.5);S.goal=null;S.pend=null;S.sit=false;S.W=W;S.D=D;
  S.me=meFig();g.add(S.me);
  S.tu=K.addTag(S,new T.Vector3(0,4.3,0),'Tu','');S.tu.follow=S.me;
  return S;
 }
 function meFig(){const f=K.figure(myAv3(),true);f.scale.setScalar(.55);const rg=K.mesh(new T.TorusGeometry(1.7,.09,8,40),K.std({color:0,emissive:0xffb23e,emissiveIntensity:1.8}),0,.05,0,false,false);rg.rotation.x=PI/2;f.add(rg);if(S&&S.me){f.position.copy(S.me.position);f.rotation.copy(S.me.rotation)}return f}
 function bookcase(S,k,list,sl,cat){
  const g=S.g,M=K.M,box=K.box,cw=2.4,ch=2.8,cols=2,rows=2,per=4,bc=new T.Group();bc.position.set(sl[0],0,sl[1]);bc.rotation.y=sl[2];g.add(bc);
  const Wd=cols*cw,zb=.95,Hh=rows*ch;
  bc.add(box(Wd+.6,Hh+.5,.3,M.dark,0,.3+Hh/2,.15));
  for(let r=0;r<=rows;r++)bc.add(box(Wd+.5,.3,1.9,M.tableEdge,0,.3+r*ch,zb));
  for(let c=0;c<=cols;c++)bc.add(box(.3,Hh,1.9,M.dark,-Wd/2+c*cw,.3+Hh/2,zb));
  const col=(TVC[k]&&TVC[k].f)||'#e8b83a',nm=(CATN[k]||k).toUpperCase();
  bc.add(K.mesh(new T.PlaneGeometry(Wd,1.0),K.std({map:K.signTex([nm+' · '+list.length],512,128,{fs:56,fg:col,bd:col}),roughness:.7}),0,Hh+1.25,zb-.6,false,true));
  bc.add(box(Wd+.3,1.2,.18,M.dark,0,Hh+1.25,zb-.72));
  bc.updateMatrixWorld(true);
  const slot=q=>({x:-Wd/2+cw*(q%cols+.5)-.18,y:.3+(rows-1-Math.floor(q/cols))*ch+.15}),ci=S.cases.length,pages=Math.max(1,Math.ceil(list.length/per)),bxs=[];
  const decor=new T.Group();bc.add(decor);
  for(let q=list.length%per||per;q<per;q++){const sp=slot(q);for(let j=0;j<3;j++)decor.add(box(.3,1.3+j*.12,1.0,K.std({color:[0x6a2a1a,0x2a3a5a,0x4a5a2a][j],roughness:.8}),sp.x-.4+j*.34,sp.y+.65+j*.06,zb))}
  list.forEach((i,n)=>{const G=cat[i],sd=K.std({color:G.c,roughness:.8}),face=K.std({map:K.boxTex(i),roughness:.7});
   const b=new T.Mesh(new T.BoxGeometry(1.8,1.8,.7),[sd,sd,sd,sd,face,sd]);b.castShadow=b.receiveShadow=true;
   const sp=slot(n%per);b.position.set(sp.x,sp.y+.9,zb);b.userData={item:'g:'+G.id,id:G.id,z0:zb,tz:zb,cs:ci,pg:Math.floor(n/per),mat:b.material,grey:null};bc.add(b);S.hit.push(b);S.boxes[G.id]=b;bxs.push(b)});
  const C={k,col,nm,bc,Wd,Hh,zb,page:0,pages,front:bc.localToWorld(new T.Vector3(0,0,zb+3.2)),bxs};
  C.show=p=>{C.page=(p+pages)%pages;bxs.forEach(b=>b.visible=b.userData.pg===C.page);decor.visible=C.page===pages-1};
  C.show(0);S.cases.push(C);
  const lp=bc.localToWorld(new T.Vector3(0,0,3));K.pendant(S,lp.x,11.5,lp.z,.55,0xffc477,1.0,14);
 }
 function greyFor(b){if(b.userData.grey)return b.userData.grey;const src=b.userData.mat[4].map.image,c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.filter='grayscale(1) brightness(.55)';x.drawImage(src,0,0);
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;const gm=K.std({color:0x4a4a4a,roughness:.8});return b.userData.grey=[gm,gm,gm,gm,K.std({map:t,roughness:.7}),gm]}
 /* ---------- sincronizzazione con la stanza ---------- */
 function sync(){
  const seats=lobbySeats(),N=seats.length,M0=members();
  // targa, giochi disponibili
  if(S.plqCode!==(R.on?R.code:'—')){S.plqCode=R.on?R.code:'—';S.plq.material.map=K.signTex(R.on?['STANZA',R.code||'…']:['SU QUESTO','TELEFONO'],512,256,{fs:R.on?96:70,f2:.8});S.plq.material.needsUpdate=true}
  Object.values(S.boxes).forEach(b=>{const g=GAMES.find(x=>x.id===b.userData.id),ok=g&&g.ok(N);b.material=ok?b.userData.mat:greyFor(b)});
  el.querySelector('.l3d-plq').innerHTML=R.on?`<span>STANZA</span><b>${esc(R.code||'…')}</b><button class="tvcp" data-a="copy">COPIA</button>`:'<span>SU QUESTO TELEFONO</span>';
  // gli altri seduti al tavolo (tu cammini)
  const others=seats.filter(s=>!(s.dev===ME.dev&&s.k==='m'));
  const sig=others.map(s=>{const m=M0.find(x=>x.id===s.dev)||{},av=s.k==='m'?[m.av,m.av3]:[((m.guests||[]).find(x=>x.k===s.k)||{}).av,((m.guests||[]).find(x=>x.k===s.k)||{}).av3];return s.dev+s.k+s.name+JSON.stringify(av)}).join('|')+'#'+JSON.stringify(myAv3());
  if(sig!==seatSig){seatSig=sig;
   S.seated.forEach(o=>{S.g.remove(o.f);o.tag.el.remove();const i=S.tags.indexOf(o.tag);if(i>=0)S.tags.splice(i,1)});S.seated=[];
   S.Lt=Math.max(2,Math.ceil(others.length/2))*2.1+.4;
   others.forEach((s,i)=>{const m=M0.find(x=>x.id===s.dev)||{},gu=(m.guests||[]).find(x=>x.k===s.k)||{},o=avTo3(s.k==='m'?m.av:gu.av,s.k==='m'?m.av3:gu.av3,i+1);
    const f=K.figure(o);f.scale.setScalar(.55);S.g.add(f);const tag=K.addTag(S,new T.Vector3(0,4.2,0),esc(s.name)+(s.k!=='m'?'<small>ospite</small>':''),'');tag.follow=f;
    S.seated.push({f,i,tag,id:s.dev+'|'+s.k,bub:null,bt:0})});
   const old=S.me;S.me=meFig();S.g.remove(old);S.g.add(S.me);S.tu.follow=S.me;
  }
  // fumetti di chat ed emote
  const now=Date.now();
  S.seated.concat([{f:S.me,id:ME.dev+'|m',self:1}]).forEach(o=>{const[dv,k]=o.id.split('|'),m=M0.find(x=>x.id===dv);let txt=null,t=0;
   const em=m&&m.emo&&m.emo[k];if(em&&now-em.t<5000&&now-em.t>-3000){txt=em.e;t=em.t}
   for(let i=R.chat.length-1;i>=0&&!txt;i--){const x=R.chat[i];if(now-x.t>7000)break;if(x.dev===dv&&(x.k||'m')===k){txt=x.text.length>34?x.text.slice(0,33)+'…':x.text;t=x.t}}
   if(txt&&o.bt!==t){o.bt=t;bubble(o.f,txt)}});
 }
 function bubble(f,text){const o=K.addTag(S,new T.Vector3(0,4.9,0),esc(text),'bub');o.follow=f;setTimeout(()=>{o.el.remove();const k=S.tags.indexOf(o);if(k>=0)S.tags.splice(k,1)},4500)}
 /* ---------- input ---------- */
 let ptr=null;
 function pDown(e){ptr={x:e.clientX,y:e.clientY,t:performance.now()}}
 function pUp(e){if(!ptr)return;const p=ptr;ptr=null;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(S.zoom>=0&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){pageStep(dx<0?1:-1);return}
  if(Math.hypot(dx,dy)>10||S.cust)return;
  const r=ren.domElement.getBoundingClientRect(),rc=new T.Raycaster(),v=new T.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
  rc.setFromCamera(v,view?pcam:ocam);
  const h=rc.intersectObjects(S.hit,false).filter(x=>{for(let o=x.object;o;o=o.parent)if(!o.visible)return false;return true});
  const it=h.length?h[0].object.userData.item:null;
  if(S.zoom>=0||S.zoomFire){if(it&&it.startsWith('g:'))openGame(it.slice(2));return}
  if(it){walkTo(null,it);return}
  const f=rc.intersectObject(S.floor,false);if(f.length)walkTo(f[0].point,null)}
 function openGame(id){ui.tab='games';ui.pick=id;ui.err='';render();scrollTo(0,0)}
 function walkTo(p,item){
  S.sit=false;const W=S.W,D=S.D,T0=S.T;let d;
  if(item&&item.startsWith('g:')){const b=S.boxes[item.slice(2)],C=S.cases[b.userData.cs];C.show(b.userData.pg);d=C.front.clone()}
  else if(item==='T')d=new T.Vector3(T0.TX+S.L/2+1.0,0,T0.TZ);
  else if(item==='ward')d=new T.Vector3(10.6,0,.4);
  else if(item==='bath')d=new T.Vector3(1.9,0,-D/2+3.4);
  else if(item==='fire')d=new T.Vector3(-9.4,0,1.2);
  else{d=p.clone();d.x=Math.max(-W/2+3.4,Math.min(W/2-2,d.x));d.z=Math.max(-D/2+4,Math.min(D/2-1.5,d.z))}
  d.y=0;S.goal=d;S.pend=item||'floor';
 }
 function arrive(it){
  if(it==='T'){S.sit=true;return}
  if(it&&it.startsWith('g:')){const b=S.boxes[it.slice(2)];enterZoom(b.userData.cs);b.userData.tz=b.userData.z0+.9;return}
  if(it==='ward'||it==='bath'){openCust(it);return}
  if(it==='fire'){fireZoom();return}
  let best=-1,bd=3.4;S.cases.forEach((c,k)=>{const dd=Math.hypot(c.front.x-S.pos.x,c.front.z-S.pos.z);if(dd<bd){bd=dd;best=k}});if(best>=0)enterZoom(best);
  else if(Math.hypot(S.pos.x+9.6,S.pos.z-1.2)<2.6)fireZoom();
 }
 function pushOut(){const T0=S.T,hx=S.L/2+.9,hz=T0.TD/2+1.35,dx=S.pos.x-T0.TX,dz=S.pos.z-T0.TZ;
  if(Math.abs(dx)<hx&&Math.abs(dz)<hz){const ox=hx-Math.abs(dx),oz=hz-Math.abs(dz);if(ox<oz)S.pos.x=T0.TX+Math.sign(dx||1)*hx;else S.pos.z=T0.TZ+Math.sign(dz||1)*hz}}
 /* ---------- viste ravvicinate ---------- */
 function fade(){const f=el.querySelector('.l3d-fade');f.style.transition='none';f.style.opacity=.85;requestAnimationFrame(()=>{f.style.transition='opacity .45s';f.style.opacity=0})}
 function zbar(html){const z=el.querySelector('.l3d-zb');z.innerHTML=html;z.classList.toggle('on',!!html);el.querySelector('.l3d-hint').style.display=html?'none':''}
 function enterZoom(k){const first=!(S.zoom>=0);S.zoom=k;const C=S.cases[k],asp=(el.clientWidth||390)/(el.clientHeight||420),vh=Math.tan(25*PI/180),hh=vh*asp,d=Math.max((C.Wd/2+1.5)/hh,(C.Hh/2+2.2)/vh),cy=C.Hh/2+.9;
  view={pos:C.bc.localToWorld(new T.Vector3(0,cy+d*.12,C.zb+d)),look:C.bc.localToWorld(new T.Vector3(0,cy,C.zb))};if(first){vp=null;S.me.visible=false;S.tu.el.style.visibility='hidden';fade()}
  zbar(S.cases.map((c,j)=>`<button type="button" data-z="${j}" class="${j===k?'on':''}" style="--cc:${c.col}">${esc(CATN[c.k]||c.k)}</button>`).join('')+'<button type="button" class="x" data-z="x">Esci</button>');
  const pg=el.querySelector('.l3d-pg');if(C.pages>1){pg.innerHTML=`<button type="button" data-p="-1" aria-label="Pagina precedente">‹</button><span>${esc(CATN[C.k]||C.k)} · pagina ${C.page+1} di ${C.pages}</span><button type="button" data-p="1" aria-label="Pagina successiva">›</button>`;pg.classList.add('on')}else pg.classList.remove('on')}
 function pageStep(d){const C=S.cases[S.zoom];if(!C||C.pages<2)return;unpop();C.show(C.page+d);enterZoom(S.zoom)}
 function exitZoom(){S.zoom=-1;S.zoomFire=false;view=null;vp=null;S.me.visible=true;S.tu.el.style.visibility='';unpop();zbar('');el.querySelector('.l3d-pg').classList.remove('on');if(S.hearth)S.hearth.dim=1;fade()}
 function unpop(){Object.values(S.boxes).forEach(b=>b.userData.tz=b.userData.z0)}
 function fireZoom(){S.zoomFire=true;S.zoom=-1;view={pos:new T.Vector3(-1.2,4.6,1.2),look:new T.Vector3(-13.4,2.9,1.2),exp:.8};vp=null;S.me.visible=false;S.tu.el.style.visibility='hidden';fade();if(S.hearth)S.hearth.dim=.75;
  zbar('<button type="button" class="on" style="--cc:#e8742c">Il camino</button><button type="button" data-z="f" style="--cc:#e8742c">Attizza il fuoco</button><button type="button" class="x" data-z="x">Esci</button>')}
 /* ---------- guardaroba e specchio ---------- */
 const OPT={skin:[0xf6d7bd,0xf0c4a0,0xe0aa80,0xc48a5e,0x9a6440,0x6a4028,0x9ad0a0,0xa8b8e8],body:[['snello','Snello'],['normale','Normale'],['robusto','Robusto']],height:[['basso','Basso'],['medio','Medio'],['alto','Alto']],
  eyes:[['tondi','Tondi'],['grandi','Grandi'],['felici','Felici'],['assonnati','Assonnati'],['stelle','Stellati']],brows:[['nessuna','Nessuna'],['sottili','Sottili'],['folte','Folte'],['arrabbiate','Arrabbiate']],
  mouth:[['sorriso','Sorriso'],['neutra','Seria'],['stupita','Stupita'],['ghigno','Ghigno'],['lingua','Linguaccia']],nose:[['piccolo','Piccolo'],['tondo','Tondo'],['lungo','Lungo']],ears:[['normali','Normali'],['grandi','Grandi'],['elfo','Da elfo']],
  blush:[[false,'No'],[true,'Guance rosse']],freckles:[[false,'No'],[true,'Lentiggini']],glasses:[['none','Niente'],['tondi','Occhiali'],['monocolo','Monocolo'],['benda','Benda da pirata']],
  hair:[['short','Corti'],['long','Lunghi'],['bun','Chignon'],['coda','Coda'],['ricci','Ricci'],['cresta','Cresta'],['bald','Calvo']],hairc:[0x1a1210,0x3a2414,0x6a3a1c,0xc8902a,0xe8c87a,0xb04a1a,0x9a9a9a,0xf2f2ee,0x3a6ac8,0xc84a8a],
  beard:[['none','Nessuna'],['baffi','Baffi'],['pizzetto','Pizzetto'],['corta','Corta'],['lunga','Lunga']],outfit:[['veste','Veste'],['tunica','Tunica'],['abito','Abito lungo'],['grembiule','Grembiule'],['armatura','Armatura']],
  robe:[0x9a3a1c,0x1c2f4d,0x23402e,0x3a2a48,0x5a2a1a,0x2a2a2a,0x8a6a2a,0x6a1a3a,0x2a6a6a,0xd8c8a8],collar:[['gorgiera','Gorgiera'],['sciarpa','Sciarpa'],['none','Nessuno']],collarc:[0xcfc2a2,0xf2ede0,0xb03a2a,0x2a4a8a,0x3a6a2a,0x111111],
  beltc:[0x1a0f09,0x6a3a1c,0x8a2424,0x2a2a2a],cape:[['none','Niente'],['mantello','Mantello']],capec:[0x6a1a2a,0x1c2f4d,0x23402e,0x2a2a2a,0x8a6a2a],
  head:[['none','Niente'],['brim','Cappello'],['hood','Cappuccio'],['beret','Basco'],['top','Cilindro'],['bandana','Bandana'],['elmo','Elmo'],['fiori','Fiori'],['crown','Corona']],hatc:[0x4a2410,0x121c30,0x2a1a10,0x6b5a3a,0x8a2424,0x111111,0x2a5a3a,0xd8c8a8],
  prop:[['none','Niente'],['boccale','Boccale'],['libro','Libro'],['spada','Spada'],['lanterna','Lanterna'],['liuto','Liuto'],['pipa','Pipa'],['fiore','Fiore']],jewel:[['none','Niente'],['orecchini','Orecchini'],['collana','Collana']]};
 const TABS=[['corpo','Corpo',[['Corporatura','body'],['Altezza','height'],['Carnagione','skin']]],['viso','Viso',[['Occhi','eyes'],['Sopracciglia','brows'],['Bocca','mouth'],['Naso','nose'],['Orecchie','ears'],['Guance','blush'],['Lentiggini','freckles'],['Occhiali','glasses']]],
  ['capelli','Capelli',[['Taglio','hair'],['Colore','hairc'],['Barba','beard']]],['abiti','Abiti',[['Vestito','outfit'],['Colore','robe'],['Colletto','collar'],['Colore colletto','collarc'],['Cintura','beltc'],['Mantello','cape'],['Colore mantello','capec']]],
  ['extra','Accessori',[['In testa','head'],['Colore','hatc'],['In mano','prop'],['Gioielli','jewel']]]];
 const hex=c=>'#'+('00000'+c.toString(16)).slice(-6);
 let draft=null;
 function openCust(kind){S.cust=kind;S.ctab=kind==='bath'?'corpo':'abiti';draft=K.normFig(myAv3());
  const dir=new T.Vector3(-S.pos.x,0,-S.pos.z).normalize(),cp=S.pos.clone().addScaledVector(dir,13.5);cp.y=3.8;S.me.rotation.y=K.faceTo(S.pos.x,S.pos.z,cp.x,cp.z);
  view={pos:cp,look:new T.Vector3(S.pos.x,-.45,S.pos.z)};vp=null;S.tu.el.style.visibility='hidden';el.querySelector('.l3d-hint').style.display='none';renderCust()}
 function renderCust(){const c=el.querySelector('.l3d-cust'),bath=S.cust==='bath',MY=TABS.filter(t=>bath?['corpo','viso','capelli'].includes(t[0]):['abiti','extra'].includes(t[0]));
  if(!MY.some(t=>t[0]===S.ctab))S.ctab=MY[0][0];const tab=MY.find(t=>t[0]===S.ctab);
  const row=(label,f)=>{const L=OPT[f],col=typeof L[0]==='number';return`<div class="crow"><span>${label}</span><div>${L.map((v,k)=>{const val=col?v:v[0],on=val===draft[f];return`<button type="button" class="sw${on?' on':''}${col?'':' tx'}" data-f="${f}" data-k="${k}"${col?` style="background:${hex(v)}" aria-label="${label} ${k+1}"`:''}>${col?'':v[1]}</button>`}).join('')}</div></div>`};
  c.innerHTML=`<div class="ch"><h3>${bath?'Lo specchio':'Il guardaroba'}</h3><div><button type="button" class="x" data-c="rnd">Casuale</button> <button type="button" class="x" data-c="spin">Gira</button></div></div>
   <div class="ctabs">${MY.map(t=>`<button type="button" data-t="${t[0]}" class="${t[0]===S.ctab?'on':''}">${t[1]}</button>`).join('')}</div><div class="cscroll">${tab[2].map(r=>row(r[0],r[1])).join('')}</div>
   <div class="crow2"><button type="button" class="b sm" data-c="x">Annulla</button><button type="button" class="b play" data-c="ok">Fatto</button></div>`;c.classList.add('on')}
 function custClick(b){
  if(b.dataset.t){S.ctab=b.dataset.t;return renderCust()}
  if(b.dataset.f){const f=b.dataset.f,v=OPT[f][+b.dataset.k],val=typeof v==='number'?v:v[0];draft[f]=val;if(!K.updateFigure(S.me,f,val))swapMe();[...b.parentNode.children].forEach(x=>x.classList.toggle('on',x===b));return}
  const a=b.dataset.c;
  if(a==='spin'){S.spin=1;return}
  if(a==='rnd'){const MY=TABS.filter(t=>S.cust==='bath'?['corpo','viso','capelli'].includes(t[0]):['abiti','extra'].includes(t[0]));MY.forEach(t=>t[2].forEach(r=>{const L=OPT[r[1]],v=L[Math.floor(Math.random()*L.length)];draft[r[1]]=typeof v==='number'?v:v[0]}));swapMe();renderCust();S.spin=.6;return}
  if(a==='x'||a==='ok'){const c=el.querySelector('.l3d-cust');c.classList.remove('on');S.cust=null;view=null;vp=null;S.tu.el.style.visibility='';el.querySelector('.l3d-hint').style.display='';
   if(a==='ok'){R.mine.av3=draft;ST('rg-av3',JSON.stringify(draft));seatSig='';saveMine()}else{seatSig='';sync()}}
 }
 function swapMe(){const old=S.me,f=K.figure(draft,true);f.scale.setScalar(.55);const rg=old.children[old.children.length-1];f.add(rg.clone());f.position.copy(old.position);f.rotation.copy(old.rotation);S.g.remove(old);S.g.add(f);S.me=f;S.tu.follow=f}
 /* ---------- ciclo ---------- */
 const v3={x:0,y:0,z:0};
 function frame(now){raf=0;if(!el||!el.isConnected||document.hidden||ui.screen!=='room'||ui.lobby!=='3d')return;raf=requestAnimationFrame(frame);
  const t=now/1000,dt=Math.min(.05,(now-(last||now))/1000);last=now;
  const w=el.clientWidth||390,h=el.clientHeight||420;
  if(ren.domElement.width!==Math.round(w*ren.getPixelRatio())||ren.domElement.height!==Math.round(h*ren.getPixelRatio())){ren.setSize(w,h,false);pcam.aspect=w/h;pcam.updateProjectionMatrix()}
  const c=S.cam,a=Math.min(1,dt*3.5);let cam;
  // tavolo che si allunga
  S.L+=(S.Lt-S.L)*a;const T0=S.T;S.top.scale.x=S.L;S.apr.scale.x=S.L-.3;S.benches.forEach(b=>b.scale.x=S.L-.3);S.legs.forEach(l=>l.position.x=l.userData.e*(S.L/2-(l.userData.b?.35:.3)));S.head.position.x=S.L/2+1.0;
  S.lamps.forEach((l,k)=>{const x=T0.TX+(k-1)*S.L/3.2;l.position.x=x;l.userData.g.position.x=x;l.userData.s.position.x=x});
  S.seated.forEach(o=>{const col=Math.floor(o.i/2),side=o.i%2?-1:1,x=T0.TX-S.L/2+1.25+col*2.1,z=T0.TZ+side*(T0.TD/2+.8);o.f.position.x+=(x-o.f.position.x)*a;o.f.position.z=z;o.f.rotation.y=side>0?PI:0});
  // avatar
  let moving=false;
  if(S.sit){const hx=T0.TX+S.L/2+1.0;S.pos.x+=(hx-S.pos.x)*a;S.pos.z=T0.TZ;S.me.rotation.y=-PI/2}
  else if(S.goal&&!S.cust){const dx=S.goal.x-S.pos.x,dz=S.goal.z-S.pos.z,L=Math.hypot(dx,dz);
   if(L<.06){S.goal=null;const it=S.pend;S.pend=null;arrive(it)}
   else{moving=true;const st=Math.min(L,7*dt);S.pos.x+=dx/L*st;S.pos.z+=dz/L*st;if(!(S.pend==='T'&&L<1.4))pushOut();const ty=Math.atan2(dx,dz);let dy=ty-S.me.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));S.me.rotation.y+=dy*Math.min(1,dt*14)}}
  if(S.spin>0){S.spin=Math.max(0,S.spin-dt*.8);S.me.rotation.y+=dt*PI*1.6}
  S.me.position.set(S.pos.x,moving?Math.abs(Math.sin(t*12))*.09:(S.sit?.82:0),S.pos.z);S.me.rotation.z=moving?Math.sin(t*12)*.04:0;
  S.wdoors.forEach(pv=>{const tg=S.cust==='ward'?pv.userData.sd*1.9:0;pv.rotation.y+=(tg-pv.rotation.y)*Math.min(1,dt*5)});
  S.bdoor.rotation.y+=((S.cust==='bath'?-1.2:0)-S.bdoor.rotation.y)*Math.min(1,dt*5);
  Object.values(S.boxes).forEach(b=>b.position.z+=(b.userData.tz-b.position.z)*.15);
  // effetti e luci
  S.fx.forEach(f=>f(t,dt));const fk=RM?.2:1;S.flick.forEach(f=>{f.l.intensity=f.b*(1+f.a*fk*(Math.sin(t*17+f.p)+Math.sin(t*9.3+f.p)*.7))});
  // camera
  const wantE=view&&view.exp?view.exp:1.9;ren.toneMappingExposure+=(wantE-ren.toneMappingExposure)*Math.min(1,dt*4);
  if(view){if(!vp){vp=view.pos.clone();vl=view.look.clone()}const za=Math.min(1,dt*4);vp.lerp(view.pos,za);vl.lerp(view.look,za);pcam.position.copy(vp);pcam.lookAt(vl);cam=pcam}
  else{c.tx+=(S.pos.x*.35+.6-c.tx)*Math.min(1,dt*3);c.tz+=(S.pos.z*.35+.4-c.tz)*Math.min(1,dt*3);const hw=c.fitW/2,hh=hw*h/w;ocam.left=-hw;ocam.right=hw;ocam.top=hh;ocam.bottom=-hh;ocam.updateProjectionMatrix();
   ocam.position.set(c.tx+Math.sin(PI/4)*120*Math.cos(.62),c.ty+Math.sin(.62)*120,c.tz+Math.cos(PI/4)*120*Math.cos(.62));ocam.lookAt(c.tx,c.ty,c.tz);cam=ocam}
  const V=new T.Vector3();S.tags.forEach(o=>{if(o.follow)V.set(o.follow.position.x,o.follow.position.y+o.pos.y,o.follow.position.z);else V.copy(o.pos);V.project(cam);o.el.style.transform=`translate(${Math.round((V.x*.5+.5)*w)}px,${Math.round((-V.y*.5+.5)*h)}px) translate(-50%,-100%)`});
  ren.render(scene,cam)}
 function loop(){if(!raf&&state==='ready'&&el&&el.isConnected){last=0;raf=requestAnimationFrame(frame)}}
 function mount(){const host=document.getElementById('l3dhost');if(!host)return;
  if(state==='idle')boot();
  if(state!=='ready'){host.innerHTML='<div class="l3d-load">Si accendono le lanterne della locanda…</div>';return}
  if(el.parentNode!==host){host.innerHTML='';host.appendChild(el)}
  sync();loop()}
 // clic sui bottoni sovrapposti alla scena (non passano dal gestore globale dell'app)
 document.addEventListener('click',e=>{if(!el||!el.contains(e.target))return;const b=e.target.closest('button');if(!b)return;
  if(b.dataset.z!=null){e.stopPropagation();const z=b.dataset.z;if(z==='x')exitZoom();else if(z==='f'){S.hearth&&S.hearth.burst(40)}else enterZoom(+z);return}
  if(b.dataset.p!=null){e.stopPropagation();pageStep(+b.dataset.p);return}
  if(el.querySelector('.l3d-cust').contains(b)){e.stopPropagation();custClick(b)}},true);
 const sceneH=S=>`<div class="tvscene3d" role="group" aria-label="La locanda con ${S.length} giocator${S.length===1?'e':'i'}: tocca per muoverti"><div id="l3dhost"></div>${emoBar()}</div>`;
 return{sceneH,mount,get ready(){return state==='ready'}};
})();
