
/* ================= INGRESSO ================= */
var NAME='';
function liveTex(w,h){var c=mk(w,h),t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=ANIS;return {c:c,t:t}}
function stars(S){
  var N=260,p=new Float32Array(N*3);
  for(var i=0;i<N;i++){var a=Math.random()*6.28,e=.15+Math.random()*1.2,r=80;p[i*3]=Math.cos(a)*Math.cos(e)*r;p[i*3+1]=Math.sin(e)*r*.9+8;p[i*3+2]=-Math.abs(Math.sin(a))*Math.cos(e)*r-10}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
  S.g.add(new T.Points(g,new T.PointsMaterial({color:0xfff2d0,size:.5,sizeAttenuation:true,transparent:true,opacity:.8,fog:false,depthWrite:false})));
  glowSpr(S,-26,34,-60,22,.85);
}
function lantern(S,x,y,z,int){
  S.g.add(box(.14,.14,1.1,M.iron,x,y+.7,z-.45));
  S.g.add(box(.55,.9,.55,M.iron,x,y,z));
  S.g.add(mesh(new T.BoxGeometry(.4,.7,.4),new T.MeshBasicMaterial({color:new T.Color(3,1.9,.8)}),x,y,z,false,false));
  glowSpr(S,x,y,z,3.4,.8);
  return plight(S,x,y,z+.4,0xffb060,int||1.2,13,.12);
}

/* ---- L0: la porta, di notte ---- */
function sceneDoor(){
  var S=newS(),g=S.g;S.bg=0x070a18;S.fog=.012;
  S.cam={az:.2,el:.27,tx:0,ty:4.2,tz:2,fitW:15.5};S.exp=1.15;
  stars(S);
  var gt=rep(stoneT,10,7),gm=std({map:gt,bumpMap:gt,bumpScale:1.6,roughness:.9,color:0x70707e});
  var gr=mesh(new T.PlaneGeometry(70,46),gm,0,0,8,false,true);gr.rotation.x=-PI/2;g.add(gr);
  var st=rep(stoneT,7,1.4),sm=std({map:st,bumpMap:st,bumpScale:1.4,roughness:.95,color:0xb0a8a0});
  g.add(box(18,3.6,1.4,sm,0,1.8,0));
  var wt=rep(wallTex,3,1),wm=std({map:wt,bumpMap:wt,bumpScale:.9,roughness:.85,color:0xc8b8a8});
  g.add(box(18,6.2,1.2,wm,0,6.7,-.1));
  [-8.7,-4.3,4.3,8.7].forEach(function(x){g.add(box(.4,6.2,.3,M.dark,x,6.7,.62))});
  g.add(box(18,.4,.3,M.dark,0,3.8,.62));g.add(box(18,.4,.3,M.dark,0,9.7,.62));
  var rm=std({color:0x2a1c1e,roughness:.9,map:rep(darkWood,6,2),bumpMap:rep(darkWood,6,2),bumpScale:.8});
  var roof=box(20.4,.5,7,rm,0,11.5,.3);roof.rotation.x=.45;g.add(roof);
  g.add(box(1.5,4.4,1.5,sm,-6.2,12.2,-1.4));
  g.add(box(1.4,9.8,10,sm,9.7,4.9,-4.3));
  // porta ad arco
  var sh=new T.Shape();sh.moveTo(-1.6,0);sh.lineTo(1.6,0);sh.lineTo(1.6,3.9);sh.absarc(0,3.9,1.6,0,PI,false);sh.lineTo(-1.6,0);
  var inner=mesh(new T.ShapeGeometry(sh),new T.MeshBasicMaterial({color:new T.Color(2.3,1.35,.5),toneMapped:true}),0,0,.62,false,false);g.add(inner);
  var leafG=new T.ExtrudeGeometry(sh,{depth:.22,bevelEnabled:false});leafG.translate(1.6,0,0);
  var lm=std({map:rep(darkWood,.4,.4),bumpMap:rep(darkWood,.4,.4),bumpScale:.8,roughness:.7,color:0xb08a68});
  var pivot=new T.Group();pivot.position.set(-1.6,0,.7);pivot.rotation.y=-.22;g.add(pivot);
  var leaf=mesh(leafG,lm,0,0,0);pivot.add(leaf);
  [1.0,2.6,4.2].forEach(function(y){pivot.add(box(3.0,.18,.06,M.iron,1.6,y,.25,false))});
  var rg=mesh(new T.TorusGeometry(.2,.04,8,16),M.iron,2.6,2.3,.27,false,false);pivot.add(rg);
  S.door=pivot;
  [-1.9,1.9].forEach(function(x){g.add(box(.6,3.9,.9,sm,x,1.95,.5))});
  var arc=mesh(new T.TorusGeometry(1.95,.3,10,26,PI),sm,0,3.9,.5);g.add(arc);
  // finestre calde
  [-5.8,5.8].forEach(function(x){
    g.add(mesh(new T.PlaneGeometry(2.6,2.4),new T.MeshBasicMaterial({color:new T.Color(1.9,1.1,.42)}),x,6.2,.66,false,false));
    g.add(box(2.9,.18,.3,M.dark,x,4.95,.7));g.add(box(2.9,.18,.3,M.dark,x,7.45,.7));g.add(box(.18,2.5,.3,M.dark,x-1.4,6.2,.7));g.add(box(.18,2.5,.3,M.dark,x+1.4,6.2,.7));
    g.add(box(.12,2.4,.3,M.dark,x,6.2,.7));g.add(box(2.6,.12,.3,M.dark,x,6.2,.7));
    plight(S,x,6.2,2.2,0xffa84a,.5,9,.1);
  });
  // insegna
  var sn=box(9,2.3,.3,M.dark,0,8.5,.8);g.add(sn);
  var sp=mesh(new T.PlaneGeometry(8.5,2.1),std({map:signTex(['LA TAVERNA','DEI GIOCHI'],1024,256,{fs:92,f2:.62}),roughness:.7}),0,8.5,.96,false,true);g.add(sp);
  lantern(S,-3.6,5.9,1.2,1.1);lantern(S,3.6,5.9,1.2,1.1);
  // luce che esce dalla porta
  var fc=mk(256,256),fg=fc.getContext('2d'),gg=fg.createRadialGradient(128,0,4,128,0,250);gg.addColorStop(0,'rgba(255,190,100,.9)');gg.addColorStop(1,'rgba(255,150,60,0)');fg.fillStyle=gg;fg.fillRect(0,0,256,256);
  var fan=mesh(new T.PlaneGeometry(11,11),new T.MeshBasicMaterial({map:new T.CanvasTexture(fc),transparent:true,blending:T.AdditiveBlending,depthWrite:false,opacity:.75,fog:false}),0,.04,6.2,false,false);fan.rotation.x=-PI/2;g.add(fan);
  S.doorL=plight(S,0,2.6,2.3,0xffa84a,1.3,17,.06);
  plight(S,0,5,9,0x6677bb,.5,22,0);
  // props
  barrel(S,-6.6,2.4,.85);barrel(S,-8.1,1.6,.7);
  g.add(box(1.6,1.4,1.6,M.dark,6.9,.7,2.4));g.add(box(1.3,1.1,1.3,M.dark,7.1,1.95,2.3));g.add(box(1.4,1.1,1.4,M.dark,8.3,.55,3.5));
  g.add(box(3,.2,.9,M.dark,-3.2,1.2,2.6));g.add(box(.2,1.2,.8,M.dark,-4.4,.6,2.6));g.add(box(.2,1.2,.8,M.dark,-2.0,.6,2.6));
  // il giocatore, di spalle
  var me=person(S,0,-1.7,0,7.6,PI,.62);S.me=me;
  S.tick=function(t){S.door&&0};
  S.enter=function(done){
    var t0=performance.now(),c0=S.cam.fitW,y0=S.cam.ty,r0=S.door.rotation.y;
    (function st(){var k=Math.min(1,(performance.now()-t0)/1500),e=k*k*(3-2*k);
      S.door.rotation.y=r0+(-1.5-r0)*e;S.cam.fitW=c0+(5.5-c0)*e;S.cam.ty=y0+(3.2-y0)*e;S.cam.az=.2*(1-e);S.doorL.intensity=1.3+e*4;S.me.position.z=7.6-e*6.5;S.me.position.x=-1.7*(1-e);
      if(k<1)requestAnimationFrame(st);else done()})();
  };
  return S;
}

/* ---- L1: il bancone e il registro ---- */
var LED=null;
function drawLedger(){
  if(!LED)LED=liveTex(512,512);
  var g=LED.c.getContext('2d');g.fillStyle='#dccaa0';g.fillRect(0,0,512,512);
  var gr=g.createLinearGradient(0,0,512,0);gr.addColorStop(0,'rgba(80,50,20,.35)');gr.addColorStop(.06,'rgba(80,50,20,0)');gr.addColorStop(.94,'rgba(80,50,20,0)');gr.addColorStop(1,'rgba(80,50,20,.3)');g.fillStyle=gr;g.fillRect(0,0,512,512);
  g.strokeStyle='rgba(90,60,30,.35)';g.lineWidth=2;for(var y=130;y<500;y+=52){g.beginPath();g.moveTo(34,y);g.lineTo(478,y);g.stroke()}
  g.fillStyle='#2a1a10';g.textAlign='left';g.font='700 40px "Alegreya SC",Georgia,serif';g.fillText('Registro degli ospiti',34,76);
  g.font='italic 36px "Alegreya SC",Georgia,serif';g.fillStyle='rgba(42,26,16,.7)';
  ['Anselmo','Giulia','Marco'].forEach(function(s,i){g.save();g.translate(44,122+i*52);g.rotate(-.01*(i+1));g.fillText(s,0,0);g.restore()});
  var nm=NAME||'';g.fillStyle='#10101e';g.font='italic 700 42px "Alegreya SC",Georgia,serif';g.fillText(nm,44,122+3*52);
  var w=g.measureText(nm).width;g.fillStyle='rgba(16,16,30,.65)';if(Math.floor(performance.now()/500)%2===0)g.fillRect(48+w,122+3*52-30,3,36);
  LED.t.needsUpdate=true;
}
function sceneBar(){
  var S=newS(),g=S.g,W=22,D=16;
  S.cam={az:.55,el:.62,tx:3.4,ty:3.4,tz:-4,fitW:13};S.exp=1.5;
  hall(S,W,D,14);fireplace(S,W,-1);
  var z0=-D/2+2.3;
  // bancone
  g.add(box(13,3.1,1.9,M.dark,3.5,1.55,z0));
  g.add(box(13.5,.26,2.4,M.tableEdge,3.5,3.2,z0+.1));
  g.add(box(13.2,.2,.3,M.gold,3.5,1.0,z0+1.0,false));
  shelfBottles(S,3.5,6.4,-D/2+.8,9,10);shelfBottles(S,3.5,9.2,-D/2+.8,8,10);
  g.add(box(.35,5.6,1.0,M.dark,-1.9,6.8,-D/2+.65));g.add(box(.35,5.6,1.0,M.dark,8.9,6.8,-D/2+.65));
  barrel(S,10.2,-D/2+1.9,.95);
  // oste
  var ho=person(S,3,5.6,0,-D/2+1.2,0,1.05);
  var apron=box(1.9,2.3,.08,std({color:0xe6dcc4,roughness:.9}),0,2.6,.97);ho.add(apron);
  // clienti sugli sgabelli (di spalle)
  [[-1.4,1],[8.2,5]].forEach(function(s,i){
    var sx=s[0],sz=z0+2.5;
    g.add(mesh(new T.CylinderGeometry(.7,.55,.18,16),M.leather,sx,2.0,sz));g.add(mesh(new T.CylinderGeometry(.12,.12,2,8),M.iron,sx,1,sz));
    var f=person(S,s[1],sx,2.0,sz,PI,.64);
  });
  // libro-registro su leggio
  drawLedger();
  var bk=new T.Group();bk.position.set(2.2,3.5,z0+.45);bk.rotation.y=.25;g.add(bk);
  bk.add(box(3.1,.14,2.3,M.leather,0,0,0));
  var pg=mesh(new T.PlaneGeometry(2.9,2.1),new T.MeshStandardMaterial({map:LED.t,roughness:.9}),0,.1,0,false,true);pg.rotation.x=-PI/2;bk.add(pg);
  bk.rotation.order='YXZ';bk.rotation.x=.6;bk.scale.setScalar(1.2);
  // piuma e calamaio
  var ink=mesh(new T.CylinderGeometry(.22,.26,.4,12),M.glass,4.2,3.5+.2,z0+.2);g.add(ink);
  var qu=mesh(new T.CylinderGeometry(.012,.02,2.2,6),M.paper,4.2,3.9+.4,z0+.2);qu.rotation.z=.55;g.add(qu);
  // candela
  var cn=mesh(new T.CylinderGeometry(.18,.2,.9,10),std({color:0xefe3c2,roughness:.8}),-.2,3.33+.45,z0+.2);g.add(cn);
  var fs=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(flameCanvas()),blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.9,fog:false}));fs.position.set(-.2,3.33+1.2,z0+.2);fs.scale.set(.6,.95,1);fs.userData={ph:1,base:fs.position.clone()};g.add(fs);S.fires.push(fs);
  plight(S,-.1,5.4,z0+.8,0xffb060,1.3,12,.1);
  [[6.6,.3],[7.6,-.6]].forEach(function(m,i){var mg=new T.Group(),mm=mesh(new T.LatheGeometry([[0,0],[.34,0],[.38,.05],[.4,.7],[.33,.7],[.33,.1],[0,.08]].map(function(p){return new T.Vector2(p[0],p[1])}),18),M.pewter,0,0,0);mm.material=M.pewter.clone();mm.material.side=T.DoubleSide;mg.add(mm);mg.position.set(m[0],3.33,z0+.25);mg.rotation.y=m[1];g.add(mg)});
  pendant(S,4.2,12.5,z0+1.4,.9,0xffc477,1.5,20);
  var key=new T.SpotLight(0xffc477,.9,40,.9,.8,1.1);key.position.set(4,13,z0+3);key.target.position.set(3,2,z0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=3;key.shadow.camera.far=30;key.shadow.bias=-.0005;g.add(key);g.add(key.target);
  S.bubble=addTag(S,new T.Vector3(5.6,6.6,-D/2+1.2),'Un nome per il registro, forestiero?','bub');
  S.tick=function(t){drawLedger()};
  return S;
}

/* ---- L2: il tavolo che ti aspetta ---- */
var PAR=null;
function drawParchment(){
  if(!PAR)PAR=liveTex(512,512);
  var g=PAR.c.getContext('2d');g.fillStyle='#b99d68';g.fillRect(0,0,512,512);
  var rg=g.createRadialGradient(256,256,120,256,256,360);rg.addColorStop(0,'rgba(255,240,200,0)');rg.addColorStop(1,'rgba(80,50,20,.55)');g.fillStyle=rg;g.fillRect(0,0,512,512);
  g.strokeStyle='#6b4527';g.lineWidth=5;g.strokeRect(26,26,460,460);g.lineWidth=1.5;g.strokeRect(38,38,436,436);
  g.fillStyle='#2a1a0e';g.textAlign='center';g.font='700 34px "Alegreya SC",Georgia,serif';g.font='700 40px "Alegreya SC",Georgia,serif';g.fillText('Modulo di Registrazione',256,100,440);
  g.font='italic 26px "Alegreya SC",Georgia,serif';g.fillStyle='rgba(42,26,14,.9)';g.fillText('Taverna dei Giochi · ospite n. 37',256,140);g.textAlign='left';g.font='600 26px "Alegreya SC",Georgia,serif';g.fillStyle='rgba(42,26,14,.85)';g.fillText('Nome:',70,238);g.textAlign='center';
  g.strokeStyle='rgba(74,46,28,.5)';g.lineWidth=2;g.beginPath();g.moveTo(90,300);g.lineTo(422,300);g.stroke();
  var nm=NAME||'';g.fillStyle='#08070f';g.font='italic 700 '+(NAME.length>9?60:76)+'px "Alegreya SC",Georgia,serif';g.fillText(nm,256,286,380);
  var w=Math.min(380,g.measureText(nm).width);if(Math.floor(performance.now()/500)%2===0){g.fillStyle='rgba(20,18,31,.6)';g.fillRect(256+w/2+6,236,4,60)}
  g.fillStyle='#9b2a2a';g.beginPath();g.arc(256,400,38,0,7);g.fill();g.fillStyle='#7a1d1d';g.beginPath();g.arc(256,400,28,0,7);g.fill();
  g.fillStyle='#d9a98c';g.font='700 34px "Alegreya SC",Georgia,serif';g.fillText('T',256,412);
  PAR.t.needsUpdate=true;
}
function sceneSolo(){
  var S=newS(),g=S.g;S.bg=0x050409;S.fog=.03;
  S.ortho=true;S.fog=.0012;S.cam={az:PI/4,el:.8,tx:.3,ty:1.6,tz:.8,fitW:9.4};S.exp=1.35;
  var ft=rep(floorTex,2.5,2.5),fm=std({map:ft,bumpMap:ft,bumpScale:.8,roughness:.62});
  var fl=mesh(new T.CircleGeometry(24,48),fm,0,0,0,false,true);fl.rotation.x=-PI/2;g.add(fl);
  var rug=mesh(new T.CircleGeometry(7.6,64),M.rug,0,.015,0,false,true);rug.rotation.x=-PI/2;g.add(rug);
  var cl=cluster(S,0,0,1,{felt:'#21704c',seats:[-1,2,-1,4],base:PI/2,cards:false});
  // gli altri due, solo sagome nell'ombra: figure scure
  g.add(new T.HemisphereLight(0x3b4a82,0x2a1a10,.55));
  // pergamena d'invito
  drawParchment();
  var pm=mesh(new T.PlaneGeometry(3.9,3.9),new T.MeshStandardMaterial({map:PAR.t,roughness:1,color:0xbcbcbc,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),0,TABLE_Y+.06,.9,false,true);pm.rotation.x=-PI/2;pm.rotation.z=PI/4;g.add(pm);
  g.add(mesh(new T.CylinderGeometry(.25,.3,.5,12),M.glass,1.9,TABLE_Y+.25,-.2));
  var qu=mesh(new T.CylinderGeometry(.015,.025,2.4,6),M.paper,2.0,TABLE_Y+.9,-.2);qu.rotation.z=.5;g.add(qu);
  // mazzo e monete
  for(var i=0;i<8;i++)g.add(box(.9,.05,1.4,i===7?cardBackM:std({color:0xd8c9a4,roughness:.9}),-2.7,TABLE_Y+.04+i*.055,-.9));
  for(i=0;i<9;i++){var c=mesh(new T.CylinderGeometry(.22,.22,.06,14),M.gold,1.9+(i%3)*.5,TABLE_Y+.06+Math.floor(i/3)*.07,-1.0+(i%2)*.1);g.add(c)}

  var sp=new T.SpotLight(0xffc477,1.5,40,.6,.8,1.1);sp.position.set(0,9.3,0);sp.target.position.set(0,TABLE_Y,0);sp.castShadow=true;sp.shadow.mapSize.set(1024,1024);sp.shadow.camera.near=3;sp.shadow.camera.far=22;sp.shadow.bias=-.0004;g.add(sp);g.add(sp.target);
  pendant(S,0,11.2,0,.8,0xffc477,.5,16);
  var cc=mk(8,256),cg=cc.getContext('2d'),gr=cg.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,200,120,.5)');gr.addColorStop(1,'rgba(255,200,120,0)');cg.fillStyle=gr;cg.fillRect(0,0,8,256);
  var cone=new T.Mesh(new T.CylinderGeometry(.5,3.6,7.4,36,1,true),new T.MeshBasicMaterial({map:new T.CanvasTexture(cc),transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,opacity:.5,fog:false}));cone.position.set(0,5.55,0);g.add(cone);
  var me=person(S,6,-5,0,5.4,faceTo(-5,5.4,0,TABLE_R+1.5),.62);S.me=me;
  S.tick=function(t){drawParchment()};
  S.enter=function(done){
    var t0=performance.now(),a=new T.Vector3(-5,0,5.4),m=new T.Vector3(-1.5,0,5.1),b=new T.Vector3(0,1.15,TABLE_R+1.5);
    (function st(){var k=Math.min(1,(performance.now()-t0)/2200);
      if(k<.72){var e=k/.72;e=e*e*(3-2*e);me.position.set(a.x+(m.x-a.x)*e,Math.abs(Math.sin(k*22))*.1,a.z+(m.z-a.z)*e);me.rotation.y=faceTo(a.x,a.z,m.x,m.z)}
      else{var e2=(k-.72)/.28;e2=e2*e2*(3-2*e2);me.position.set(m.x+(b.x-m.x)*e2,b.y*e2+Math.sin(e2*PI)*.6,m.z+(b.z-m.z)*e2);var r0=faceTo(a.x,a.z,m.x,m.z),d=PI-r0;d=Math.atan2(Math.sin(d),Math.cos(d));me.rotation.y=r0+d*e2}
      if(k<1)requestAnimationFrame(st);else setTimeout(done,350)})();
  };
  return S;
}
