
/* ================= IL BOSCHETTO "INFINITO" (si ripete come Pac-Man) ================= */
var BPX=60,BPZ=46;
function SF(x){return 2.6*Math.sin(x*2*PI/BPX)+1.2+.8*Math.sin(x*6*PI/BPX)}
function SFd(x){return (SF(x+.01)-SF(x-.01))/.02}
function grassTex(){
  var N=512,c=mk(N,N),g=c.getContext('2d');g.fillStyle='#2c5228';g.fillRect(0,0,N,N);
  for(var i=0;i<16000;i++){var x=Math.random()*N,y=Math.random()*N,l=3+Math.random()*7,v=Math.random();g.strokeStyle=v<.5?'rgba(90,150,70,'+(.2+Math.random()*.3)+')':'rgba(10,40,12,'+(.2+Math.random()*.3)+')';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+(Math.random()-.5)*3,y-l);g.stroke()}
  var fc=['#f2ede0','#f2d04a','#b88ae0'];for(i=0;i<140;i++){g.fillStyle=fc[i%3];g.beginPath();g.arc(Math.random()*N,Math.random()*N,1.6+Math.random(),0,7);g.fill()}
  grain(g,N,N,14);return tex(c,15,11.5);
}
function waterTex(){
  var N=256,c=mk(N,N),g=c.getContext('2d');g.fillStyle='#1b4560';g.fillRect(0,0,N,N);
  for(var i=0;i<260;i++){var x=Math.random()*N,y=Math.random()*N,l=10+Math.random()*30;g.strokeStyle='rgba(170,220,255,'+(.08+Math.random()*.22)+')';g.lineWidth=1+Math.random()*1.5;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l/2,y+(Math.random()-.5)*6,x+l,y);g.stroke()}
  var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;return t;
}
function ribbon(w,y,mat,x0,x1){
  var pos=[],uv=[],idx=[],n=0,len=0,px=null,pz=null;
  for(var x=x0;x<=x1+.01;x+=.5){var z=SF(x),d=SFd(x),L=Math.hypot(1,d),nx=-d/L,nz=1/L;
    if(px!=null)len+=Math.hypot(x-px,z-pz);px=x;pz=z;
    pos.push(x+nx*w/2,y,z+nz*w/2,x-nx*w/2,y,z-nz*w/2);uv.push(0,len/4,1,len/4);
    if(n)idx.push(2*n-2,2*n-1,2*n,2*n-1,2*n+1,2*n);n++}
  var gm=new T.BufferGeometry();gm.setAttribute('position',new T.Float32BufferAttribute(pos,3));gm.setAttribute('uv',new T.Float32BufferAttribute(uv,2));gm.setIndex(idx);gm.computeVertexNormals();
  var m=new T.Mesh(gm,mat);m.receiveShadow=true;return m;
}
function sceneBosco(){
  var S=newS(),g=S.g,me;S.bg=0x060a14;S.fog=.0012;S.exp=1.9;S.ortho=true;
  S.cam={az:PI/4,el:.62,tx:-13,ty:2,tz:-13.5,fitW:16};S.info='Il boschetto · torna dalla porta della locanda';
  var X0=-BPX/2,X1=BPX/2,Z0=-23,Z1=Z0+BPZ,BX=2;
  var tile=new T.Group();g.add(tile);   // contenuto statico di una "piastrella" di bosco
  // terreno
  var gt=grassTex(),gr=mesh(new T.PlaneGeometry(BPX,BPZ),std({map:gt,bumpMap:gt,bumpScale:.6,roughness:.95}),0,0,(Z0+Z1)/2,false,true);gr.rotation.x=-PI/2;tile.add(gr);
  var pick=new T.Mesh(new T.PlaneGeometry(600,600),new T.MeshBasicMaterial({visible:false}));pick.rotation.x=-PI/2;pick.userData.noMerge=1;g.add(pick);S.floor=pick;
  // ruscello
  var mud=ribbon(4.6,.04,std({color:0x2e2416,roughness:1,side:T.DoubleSide}),X0,X1);tile.add(mud);
  var wt=waterTex();
  var water=ribbon(3.2,.1,new T.MeshStandardMaterial({side:T.DoubleSide,map:wt,color:0xa8d4f0,roughness:.12,metalness:.2,envMap:envTex,envMapIntensity:1.1,transparent:true,opacity:.93}),X0,X1);tile.add(water);
  water.userData.item='water';S.hit.push(water);
  var stoneM=std({color:0x6c6c72,roughness:.9}),stG=new T.DodecahedronGeometry(1,0);
  for(var x=X0+.5;x<X1;x+=1.1){[1,-1].forEach(function(sd){if(Math.abs(x-BX)<1.8)return;var z=SF(x),d=SFd(x),L=Math.hypot(1,d),off=2.05+Math.random()*.5,st=mesh(stG,stoneM,x+(-d/L)*off*sd,.05,z+(1/L)*off*sd);var s=.22+Math.random()*.3;st.scale.set(s,s*.6,s);st.rotation.y=Math.random()*6;tile.add(st)})}
  // ponte
  var bz0=SF(BX),bd=SFd(BX),bL=Math.hypot(1,bd),bn=new T.Vector3(-bd/bL,0,1/bL);
  var bridge=new T.Group();bridge.position.set(BX,0,bz0);bridge.rotation.y=Math.atan2(bn.x,bn.z);tile.add(bridge);
  function archY(z){return .22+Math.cos(Math.max(-1,Math.min(1,z/3.3))*PI/2)*1.0}
  for(var k=0;k<15;k++){var z=-3.3+k*6.6/14,pl=box(2.6,.14,.42,M.dark,0,archY(z),z);pl.rotation.x=-Math.atan((archY(z+.05)-archY(z-.05))/.1);bridge.add(pl)}
  [-1.25,1.25].forEach(function(xx){for(var k=0;k<=6;k++){var z=-3.0+k,y=archY(z);bridge.add(box(.12,1.0,.12,M.dark,xx,y+.5,z));if(k<6){var z2=z+1,r=box(.1,.1,1.05,M.dark,xx,(archY(z)+archY(z2))/2+1.0,(z+z2)/2);r.rotation.x=-Math.atan(archY(z2)-archY(z));bridge.add(r)}}});
  bridge.updateMatrixWorld(true);
  var bEnd=[bridge.localToWorld(new T.Vector3(0,0,3.9)),bridge.localToWorld(new T.Vector3(0,0,-3.9))];
  // falò
  var CX=-7,CZ=SF(-7)+5.6;
  // alberi
  var trunkM=std({color:0x4a3220,roughness:.95}),pineM=[0x1d4226,0x24502c,0x1a3a22].map(function(c){return std({color:c,roughness:.9,flatShading:true})}),leafM=[0x3a6a2a,0x4a7a30,0x2f5a26].map(function(c){return std({color:c,roughness:.9,flatShading:true})});
  var trunkG=[new T.CylinderGeometry(.22,.32,1.8,8),new T.CylinderGeometry(.22,.32,2.2,8)];
  function tree(x,z,s,kind){
    var t=new T.Group();t.position.set(x,0,z);t.scale.setScalar(s);t.rotation.y=Math.random()*6;tile.add(t);
    t.add(mesh(trunkG[kind],trunkM,0,kind?1.1:.9,0));
    if(!kind){[[1.7,2.6,2.3],[1.3,2.2,3.5],[.9,1.8,4.6]].forEach(function(c,i){t.add(mesh(GEO('pine'+i,function(){return new T.ConeGeometry(c[0],c[1],9)}),pineM[i%3],0,c[2],0))})}
    else{[[0,3.0,0,1.5],[.8,2.6,.4,1.1],[-.7,2.8,-.3,1.15],[.1,3.8,-.2,1.0]].forEach(function(c,i){t.add(mesh(GEO('leaf'+i,function(){return new T.IcosahedronGeometry(c[3],1)}),leafM[i%3],c[0],c[1],c[2]))})}
  }
  function free(tx,tz,r){if(Math.abs(tz-SF(tx))<3.4)return false;if(tx>-24&&tx<-2&&tz<-12.5)return false;if(Math.hypot(tx-BX,tz-bz0)<5)return false;if(Math.hypot(tx-9,tz-(SF(9)-3.4))<3)return false;if(Math.hypot(tx-CX,tz-CZ)<(r||5))return false;return true}
  var rr=mulberry32(11);
  for(var i=0;i<95;i++){var tx=X0+1+rr()*(BPX-2),tz=Z0+1+rr()*(BPZ-2);if(!free(tx,tz))continue;tree(tx,tz,.75+rr()*.55,rr()<.45?1:0)}
  var bushM=std({color:0x2f5a26,roughness:.9,flatShading:true}),bushG=new T.IcosahedronGeometry(.85,1);
  for(i=0;i<44;i++){var bx=X0+1+rr()*(BPX-2),bz=Z0+1+rr()*(BPZ-2);if(!free(bx,bz,4)||Math.abs(bz-SF(bx))<2.8)continue;var bu=mesh(bushG,bushM,bx,.4,bz);bu.scale.set(1,.7,1);bu.scale.multiplyScalar(.85+rr()*.4);tile.add(bu)}
  var capM=std({color:0xc8302a,roughness:.6}),stemM=std({color:0xf0e6d0,roughness:.8}),dotM=std({color:0xffffff,roughness:.6});
  [[-3,10],[11,12],[-17,4],[15,-7],[6,-12],[22,16],[-24,-6],[24,-17]].forEach(function(p){var gq=new T.Group();gq.position.set(p[0],0,p[1]);tile.add(gq);
    [[0,0,1],[.5,.3,.7],[-.4,.35,.6]].forEach(function(q){var sg=new T.Group();sg.position.set(q[0],0,q[1]);sg.scale.setScalar(q[2]);gq.add(sg);
      sg.add(mesh(GEO('stem',function(){return new T.CylinderGeometry(.12,.16,.5,8)}),stemM,0,.25,0));var cp=mesh(GEO('cap',function(){return new T.SphereGeometry(.38,14,8,0,PI*2,0,PI/2)}),capM,0,.48,0);sg.add(cp);
      for(var d=0;d<4;d++){var a=d*1.6+.3;sg.add(mesh(GEO('dot',function(){return new T.SphereGeometry(.05,6,4)}),dotM,Math.cos(a)*.25,.72,Math.sin(a)*.25,false,false))}
      cp.userData.item='shroom';S.hit.push(cp)})});
  // ninfee
  var padM=std({color:0x3a7a2e,roughness:.7,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});var pads=[];
  [-12.5,-11,-9.6,-14].forEach(function(x,i){var z=SF(x)+(i%2?.6:-.5),p=mesh(new T.CircleGeometry(.5,16,.3,5.8),padM,x,.2,z,false,true);p.renderOrder=2;p.rotation.x=-PI/2;tile.add(p);pads.push(new T.Vector3(x,.2,z))});
  // angolo della pesca
  var fx=9,fz=SF(9)-3.0;
  var rock=mesh(stG,stoneM,fx,.2,fz);rock.scale.set(1.3,.45,1.0);tile.add(rock);
  var bucket=mesh(new T.CylinderGeometry(.3,.24,.5,12),M.pewter,fx-1.2,.25,fz-.4);tile.add(bucket);
  var rod0=mesh(new T.CylinderGeometry(.03,.04,3.2,6),M.dark,fx+.6,1.4,fz-.6);rod0.rotation.z=-.35;rod0.userData.noMerge=1;g.add(rod0);
  [rock,bucket,rod0].forEach(function(m){m.userData.item='fish';S.hit.push(m)});
  // la locanda vista da fuori, completa
  var HX0=-21,HX1=-5,HZ0=-22.6,HZ1=-15.9,HH=6.5,HC=(HX0+HX1)/2,HZC=(HZ0+HZ1)/2,HW=HX1-HX0,HD=HZ1-HZ0;
  var wallM=std({map:rep(wallTex,2.4,1),bumpMap:rep(wallTex,2.4,1),bumpScale:.9,roughness:.85,color:0xc8b8a8});
  var wallS=std({map:rep(wallTex,1.1,1),bumpMap:rep(wallTex,1.1,1),bumpScale:.9,roughness:.85,color:0xc8b8a8});
  var stoneB=std({map:rep(stoneT,4,.5),bumpMap:rep(stoneT,4,.5),bumpScale:1.2,roughness:.95,color:0x9a948e});
  tile.add(box(HW+.4,1.2,HD+.4,stoneB,HC,.6,HZC));
  tile.add(box(HW,HH-1.2,.4,wallM,HC,1.2+(HH-1.2)/2,HZ1-.2));tile.add(box(HW,HH-1.2,.4,wallM,HC,1.2+(HH-1.2)/2,HZ0+.2));
  tile.add(box(.4,HH-1.2,HD-.8,wallS,HX0+.2,1.2+(HH-1.2)/2,HZC));tile.add(box(.4,HH-1.2,HD-.8,wallS,HX1-.2,1.2+(HH-1.2)/2,HZC));
  [HX0+.15,HX1-.15].forEach(function(x){[HZ0+.15,HZ1-.15].forEach(function(z){tile.add(box(.5,HH+.1,.5,M.dark,x,HH/2,z))})});
  tile.add(box(HW+.3,.35,.5,M.dark,HC,HH,HZ1-.1));tile.add(box(HW+.3,.35,.5,M.dark,HC,HH,HZ0+.1));
  // tetto a due falde
  var half=HD/2+.9,ang=PI/6,run=half,rise=run*Math.tan(ang),plen=run/Math.cos(ang);
  var roofM=std({color:0x5a2a22,roughness:.85,map:rep(darkWood,6,3),bumpMap:rep(darkWood,6,3),bumpScale:.8});
  [1,-1].forEach(function(sd){var rf=box(HW+1.6,.35,plen+.2,roofM,HC,HH+rise/2+.15,HZC+sd*run/2);rf.rotation.x=sd*ang;tile.add(rf);
    for(var q=0;q<7;q++){var tl=box(HW+1.6,.12,.14,M.dark,HC,0,0);tl.position.set(HC,HH+.25+rise*(q+.5)/7,HZC+sd*run*(1-(q+.5)/7));tile.add(tl)}});
  tile.add(box(HW+1.7,.3,.4,M.dark,HC,HH+rise+.3,HZC));
  var gsh=new T.Shape();gsh.moveTo(-HD/2,0);gsh.lineTo(HD/2,0);gsh.lineTo(0,rise-.3);gsh.closePath();
  [HX0+.2,HX1-.2].forEach(function(x){var gb=mesh(new T.ShapeGeometry(gsh),std({map:rep(wallTex,.6,.4),roughness:.85,color:0xc8b8a8,side:T.DoubleSide}),x,HH+.15,HZC);gb.rotation.y=PI/2;tile.add(gb)});
  // comignolo
  tile.add(box(1.4,4.0,1.4,stoneB,HX0+3.5,HH+rise,HZ0+2.6));tile.add(box(1.7,.3,1.7,M.dark,HX0+3.5,HH+rise+2.1,HZ0+2.6));
  // finestre accese su tutti i lati
  var winM=new T.MeshBasicMaterial({color:new T.Color(1.9,1.1,.42)});
  function win(x,y,z,ry){var w=new T.Group();w.position.set(x,y,z);w.rotation.y=ry;tile.add(w);w.add(mesh(new T.PlaneGeometry(1.8,1.6),winM,0,0,0,false,false));
    w.add(box(2.1,.15,.2,M.dark,0,.85,.05));w.add(box(2.1,.15,.2,M.dark,0,-.85,.05));w.add(box(.15,1.8,.2,M.dark,-1,0,.05));w.add(box(.15,1.8,.2,M.dark,1,0,.05));w.add(box(.08,1.6,.2,M.dark,0,0,.05));w.add(box(1.8,.08,.2,M.dark,0,0,.05));w.add(box(2.3,.18,.45,M.dark,0,-.98,.15))}
  [HX0+3.2,HX1-3.2].forEach(function(x){win(x,3.4,HZ1+.03,0);win(x,3.4,HZ0-.03,PI)});
  win(HX0-.03,3.4,HZC,-PI/2);win(HX1+.03,3.4,HZC,PI/2);
  // porta
  var dsh=new T.Shape();dsh.moveTo(-1.2,0);dsh.lineTo(1.2,0);dsh.lineTo(1.2,3.3);dsh.absarc(0,3.3,1.2,0,PI,false);dsh.lineTo(-1.2,0);
  tile.add(mesh(new T.ShapeGeometry(dsh),new T.MeshBasicMaterial({color:new T.Color(2.2,1.3,.5)}),HC,0,HZ1+.02,false,false));
  var hd=new T.ExtrudeGeometry(dsh,{depth:.15,bevelEnabled:false});hd.translate(1.2,0,0);
  var hdoor=mesh(hd,std({map:rep(darkWood,.5,.5),color:0xb08a68,roughness:.7}),0,0,0);var hp=new T.Group();hp.position.set(HC-1.2,0,HZ1+.1);hp.rotation.y=-.5;hp.add(hdoor);tile.add(hp);
  tile.add(box(3.2,.25,1.4,stoneB,HC,.12,HZ1+.7));
  tile.add(mesh(new T.PlaneGeometry(3.6,.9),std({map:signTex(['LOCANDA'],512,128,{fs:72}),roughness:.8}),HC,4.9,HZ1+.03,false,false));
  // botti e cassette sul retro
  barrel(S,HX1+1.4,HZ0+1.6,.6);barrel(S,HX1+1.3,HZ0+3.2,.5);
  hdoor.userData.item='home';S.hit.push(hdoor);
  var homeHit=new T.Mesh(new T.BoxGeometry(3,4.6,1.4),new T.MeshBasicMaterial({visible:false}));homeHit.position.set(HC,2.3,HZ1+.3);homeHit.userData.item='home';homeHit.userData.noMerge=1;g.add(homeHit);S.hit.push(homeHit);
  // fumo dal comignolo
  (function(){var X=fireTextures(),sm=[];for(var q=0;q<12;q++){var sp=new T.Sprite(new T.SpriteMaterial({map:X.smoke,transparent:true,depthWrite:false,opacity:0,color:0xa0a0aa}));sp.userData={ph:q/12};g.add(sp);sm.push(sp)}
    S.fx=S.fx||[];S.fx.push(function(t){sm.forEach(function(s){var p=(t*.07+s.userData.ph)%1;s.position.set(HX0+3.5+p*2.5+Math.sin(t*.5+s.userData.ph*7)*.4*p,HH+rise+2.4+p*7,HZ0+2.6+p*1.5);var k=.9+p*3.5;s.scale.set(k,k,1);s.material.opacity=.5*Math.sin(p*PI)})})})();
  lantern(S,HC+2.4,4.4,HZ1+.4,1.4);
  plight(S,HC,2.2,HZ1+1.6,0xffa84a,1.4,12,.06);plight(S,HC,3,HZ0-1.5,0xffa84a,.6,8,0);
  // ---- falò con ceppi per sedersi
  var ringG=new T.DodecahedronGeometry(.42,0);
  for(i=0;i<10;i++){var a=i/10*PI*2,st2=mesh(ringG,stoneM,CX+Math.cos(a)*1.25,.15,CZ+Math.sin(a)*1.25);st2.scale.set(1,.6,.8);st2.rotation.y=a;g.add(st2)}
  var SEATS=[];
  [[.4,0],[2.3,0],[4.2,1]].forEach(function(p,k){var a=p[0],sx=CX+Math.cos(a)*2.9,sz=CZ+Math.sin(a)*2.9;
    var lg=logMesh(.42,2.4,false);lg.rotation.z=PI/2;lg.rotation.y=-a+PI/2;lg.position.set(sx,.42,sz);g.add(lg);lg.userData.item='seat'+k;S.hit.push(lg);
    SEATS.push({x:CX+Math.cos(a)*3.6,z:CZ+Math.sin(a)*3.6,face:faceTo(sx,sz,CX,CZ)})});
  var pile=[[-1,.25],[1,.25],[0,.62]];pile.forEach(function(p){var l=logMesh(.22,1.6,false);l.rotation.x=PI/2;l.position.set(CX+3.2+p[0]*.45,p[1],CZ-1.6);g.add(l)});
  var axe=new T.Group();axe.position.set(CX+3.4,0,CZ-2.6);axe.rotation.y=.7;g.add(axe);var ah=mesh(new T.CylinderGeometry(.05,.06,1.6,6),M.dark,0,.7,0);ah.rotation.z=.25;axe.add(ah);axe.add(box(.5,.3,.07,M.iron,.25,1.45,0));
  var camp=makeFire(S,CX,0,CZ,1,{kind:'teepee',smoke:true,int:2.2,dist:20});
  var campHit=new T.Mesh(new T.CylinderGeometry(1.2,1.2,2.4,10),new T.MeshBasicMaterial({visible:false}));campHit.position.set(CX,1.2,CZ);campHit.userData.item='camp';g.add(campHit);S.hit.push(campHit);
  // ---- copie della piastrella intorno: il bosco sembra infinito
  var lite=mergeStatic(tile);
  for(var ix=-1;ix<=1;ix++)for(var iz=-1;iz<=1;iz++){if(!ix&&!iz)continue;var cpy=new T.Group();lite.children.forEach(function(m){var mm=new T.Mesh(m.geometry,m.material);mm.receiveShadow=true;cpy.add(mm)});cpy.position.set(ix*BPX,0,iz*BPZ);g.add(cpy)}
  // luna, lucciole
  var moon=new T.DirectionalLight(0x8fa2f0,.7);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);var sc=moon.shadow.camera;sc.left=-30;sc.right=30;sc.top=30;sc.bottom=-30;sc.near=1;sc.far=80;moon.shadow.bias=-.0006;g.add(moon);g.add(moon.target);
  g.add(new T.HemisphereLight(0x3a4a8a,0x1a2a12,.75));
  var FN=120,fp=new Float32Array(FN*3),fb0=[];for(i=0;i<FN;i++){fb0.push([(Math.random()-.5)*60,.6+Math.random()*2.6,(Math.random()-.5)*50,Math.random()*6])}
  var fgeo=new T.BufferGeometry();fgeo.setAttribute('position',new T.BufferAttribute(fp,3));
  var flies=new T.Points(fgeo,new T.PointsMaterial({color:0xd8ff7a,size:6,sizeAttenuation:false,transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false,fog:false}));flies.frustumCulled=false;g.add(flies);
  plight(S,BX,2.4,bz0,0xbfe07a,.5,10,.3);
  // rana
  var frog=new T.Group();frog.position.copy(pads[1]);g.add(frog);var fm=std({color:0x4caa3a,roughness:.6});
  var fbm=mesh(new T.SphereGeometry(.28,12,8),fm,0,.18,0);fbm.scale.set(1,.7,1.1);frog.add(fbm);
  [-1,1].forEach(function(s){frog.add(mesh(new T.SphereGeometry(.09,8,6),fm,s*.14,.36,.14));frog.add(mesh(new T.SphereGeometry(.045,6,4),std({color:0x111111}),s*.15,.4,.2,false,false))});
  fbm.userData.item='frog';S.hit.push(fbm);frog.userData={pad:1,j:0,from:null,to:null};

  // ---- avatar e camminata
  S.pos=new T.Vector3(HC,0,HZ1+1.6);S.goal=null;S.path=[];S.pend=null;S.fly=[];S.rings=[];S.sit=null;
  function spawnMe(){if(me)g.remove(me);me=person(S,6,S.pos.x,0,S.pos.z,0,.55);S.me=me;if(S.tu)S.tu.follow=me}
  spawnMe();S.tu=addTag(S,new T.Vector3(0,4.3,0),'Tu','');S.tu.follow=me;
  function say(f,text,ms){var o=addTag(S,new T.Vector3(0,f===frog?1.4:4.6,0),esc(text),'bub sm');o.follow=f;setTimeout(function(){o.el.remove();var k=S.tags.indexOf(o);if(k>=0)S.tags.splice(k,1)},ms||2600);return o}
  function ring(p){var r=mesh(GEO('ripple',function(){return new T.TorusGeometry(.3,.04,6,24)}),new T.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.8}),p.x,.15,p.z,false,false);r.rotation.x=PI/2;g.add(r);S.rings.push({m:r,t:0})}
  function bankPoint(x,z0,sd){var r=Math.round((z0-SF(x))/BPZ),z=SF(x)+r*BPZ,d=SFd(x),L=Math.hypot(1,d);return new T.Vector3(x+(-d/L)*2.7*sd,0,z+(1/L)*2.7*sd)}
  function u(p){return p.z-SF(p.x)}
  function band(p){return Math.floor(u(p)/BPZ)}
  function sideOf(p){var v=u(p),r=Math.round(v/BPZ);return Math.sign(v-r*BPZ)||1}
  function route(d){
    var out=[],c=S.pos.clone(),b=band(c),db=band(d),guard=0;
    while(b!==db&&guard++<4){var st=db>b?1:-1,r=st>0?b+1:b,kx=Math.round((c.x-BX)/BPX),off=new T.Vector3(kx*BPX,0,r*BPZ);
      var e1=bEnd[0].clone().add(off),e2=bEnd[1].clone().add(off);if(band(e1)!==b){var t=e1;e1=e2;e2=t}out.push(e1,e2);c=e2;b+=st}
    out.push(d);return out;
  }
  var rodHand=null,stick=null;
  S.acts={
    fish:function(){me.rotation.y=faceTo(S.pos.x,S.pos.z,9,SF(9));if(!rodHand){rodHand=mesh(new T.CylinderGeometry(.04,.05,4.4,6),M.dark,.95,3.9,2.6,false,false);rodHand.rotation.x=1.1;me.add(rodHand)}rodHand.visible=true;rod0.visible=false;say(me,'Silenzio, pesco…',2200);
      setTimeout(function(){var c=['una trota!','una scarpa vecchia','un pesce gatto','solo alghe…','un anello d’oro!','un granchio arrabbiato'][Math.floor(Math.random()*6)];say(me,'Ho preso '+c,3000);chatPush('',(NAME||'Tu')+' ha pescato '+c,'sys');ring(new T.Vector3(9,0,SF(9)));setTimeout(function(){rodHand.visible=false;rod0.visible=true},2500)},2600)},
    water:function(){var dir=new T.Vector3(1,0,SFd(S.pos.x)).normalize().multiplyScalar(Math.random()<.5?1:-1),n=1+Math.floor(Math.random()*6),p=S.pos.clone();p.y=1.4;
      var r=Math.round(u(S.pos)/BPZ),c=new T.Vector3(S.pos.x,0,SF(S.pos.x)+r*BPZ);me.rotation.y=faceTo(S.pos.x,S.pos.z,c.x,c.z);var hops=[c.clone()],step=2.2;for(var h=1;h<n;h++){var q=hops[h-1].clone().addScaledVector(dir,step);q.z=SF(q.x)+r*BPZ+(Math.random()-.5)*.6;hops.push(q);step*=.8}
      var st=mesh(GEO('pebble',function(){return new T.SphereGeometry(.14,8,6)}),stoneM,0,0,0,false,false);st.scale.y=.5;var a=p;(function hop(k){if(k>=hops.length){g.remove(st);say(me,n===1?'Plof. Affondato.':n+' rimbalzi!');if(n>=5)chatPush('',(NAME||'Tu')+' fa '+n+' rimbalzi sul ruscello!','sys');return}
        var b=hops[k].clone();b.y=.1;S.fly.push({m:st,a:a.clone(),b:b,h:k?.6:.8,d:k?.32:.45,t:0,done:function(){ring(b);a=b;hop(k+1)}});if(!st.parent)g.add(st)})(0)},
    shroom:function(){say(me,['Meglio di no…','Profuma di guai','Questo brilla al buio?','Lo porto all’oste'][Math.floor(Math.random()*4)])},
    frog:function(){var fu=frog.userData,nx=(fu.pad+1+Math.floor(Math.random()*(pads.length-1)))%pads.length;fu.from=frog.position.clone();fu.to=pads[nx].clone();fu.pad=nx;fu.j=0.001;say(frog,'Cra!',1400)},
    home:function(){goArea('loc')},
    camp:function(){me.rotation.y=faceTo(S.pos.x,S.pos.z,CX,CZ);
      if(!stick){stick=new T.Group();var sk=mesh(new T.CylinderGeometry(.03,.03,3.2,5),M.dark,0,0,0,false,false);sk.rotation.x=PI/2;stick.add(sk);var mm=mesh(new T.CylinderGeometry(.16,.16,.3,10),std({color:0xfff6ea,roughness:.9}),0,0,1.7,false,false);mm.rotation.x=PI/2;stick.add(mm);stick.userData.m=mm.material;stick.position.set(.95,3.4,2.0);stick.rotation.x=.35;me.add(stick)}
      stick.visible=true;stick.userData.m.color.setHex(0xfff6ea);camp.burst(20);say(me,'Arrostisco un marshmallow…',2200);
      setTimeout(function(){var r=Math.random(),w=r<.45?['Dorato e perfetto!',0xd8a050]:r<.8?['Un po’ bruciacchiato',0x8a5a2a]:['Carbonizzato! Pfff',0x1a1210];stick.userData.m.color.setHex(w[1]);say(me,w[0],2600);setTimeout(function(){stick.visible=false},2600)},2300)},
    sit:function(k){var s=SEATS[k];S.sit=s;me.rotation.y=s.face;say(me,['Che tepore…','Si sta bene qui','Raccontiamo storie?'][k%3],2200)}
  };
  function destFor(item,p){
    if(item==='fish')return new T.Vector3(9.4,0,SF(9)-4.4);
    if(item==='home')return new T.Vector3(HC,0,HZ1+1.3);
    if(item==='camp')return new T.Vector3(CX+1.6,0,CZ+1.6);
    if(/^seat/.test(item)){var s=SEATS[+item.slice(4)];return new T.Vector3(s.x,0,s.z)}
    if(item==='water')return bankPoint(p.x,p.z,sideOf(S.pos.clone().setX(p.x)));
    p=p.clone();p.y=0;var v=u(p),r=Math.round(v/BPZ);
    if(Math.abs(v-r*BPZ)<2.4)return bankPoint(p.x,p.z,Math.sign(v-r*BPZ)||1);
    return p;
  }
  S.walkTo=function(p,item,obj){
    S.sit=null;
    if(item==='frog'){S.acts.frog();return}
    if(item==='shroom'){var w=new T.Vector3();obj.getWorldPosition(w);S.path=route(new T.Vector3(w.x+1.2,0,w.z+1.2));S.pend='shroom';S.goal=S.path.shift();return}
    var d=destFor(item,p);if(!d)return;S.path=route(d);S.pend=item;S.goal=S.path.shift();E.movedTo(d,false);
  };
  function shift(dx,dz){var v=new T.Vector3(dx,0,dz);S.pos.add(v);if(S.goal)S.goal.add(v);S.path.forEach(function(q){q.add(v)});S.cam.tx+=dx;S.cam.tz+=dz;
    S.fly.forEach(function(f){f.a.add(v);f.b.add(v);f.m.position.add(v)});S.rings.forEach(function(r){r.m.position.add(v)})}
  S.onEnter=function(){spawnMe();S.pos.set(HC,0,HZ1+1.6);S.goal=null;S.path=[];S.sit=null;me.position.copy(S.pos);S.cam.tx=HC;S.cam.tz=HZ1+2;chatPush('','Esci dalla locanda: il bosco continua all’infinito… o quasi','sys')};
  S.tick=function(t,dt){
    wt.offset.y-=dt*.22;
    var fa=fgeo.attributes.position;for(var q=0;q<FN;q++){var b=fb0[q];fa.setXYZ(q,S.cam.tx+b[0]+Math.sin(t*.7+b[3])*.6,b[1]+Math.sin(t*1.3+b[3]*2)*.3,S.cam.tz+b[2]+Math.cos(t*.6+b[3])*.6)}fa.needsUpdate=true;flies.material.opacity=.6+Math.sin(t*3)*.3;
    for(var k=S.fly.length-1;k>=0;k--){var f=S.fly[k];f.t+=dt/f.d;var e=Math.min(1,f.t);f.m.position.lerpVectors(f.a,f.b,e);f.m.position.y+=Math.sin(e*PI)*f.h;if(e>=1){S.fly.splice(k,1);f.done&&f.done()}}
    for(k=S.rings.length-1;k>=0;k--){var r=S.rings[k];r.t+=dt;r.m.scale.setScalar(1+r.t*4);r.m.material.opacity=.8*(1-r.t/.9);if(r.t>.9){g.remove(r.m);r.m.material.dispose();S.rings.splice(k,1)}}
    var fu=frog.userData;if(fu.j>0){fu.j=Math.min(1,fu.j+dt*1.6);frog.position.lerpVectors(fu.from,fu.to,fu.j);frog.position.y=.2+Math.sin(fu.j*PI)*1.2;if(fu.j>=1)fu.j=0}
    S.fishT=(S.fishT||4)-dt;if(S.fishT<=0){S.fishT=5+Math.random()*5;var fxx=X0+4+Math.random()*(BPX-8),fish=mesh(GEO('fish',function(){return new T.SphereGeometry(.25,10,6)}),std({color:0xe8962a,roughness:.5}),0,0,0,false,false);fish.scale.set(1,.6,.5);var a2=new T.Vector3(fxx,.05,SF(fxx)),b2=new T.Vector3(fxx+1.4,.05,SF(fxx+1.4));g.add(fish);ring(a2);S.fly.push({m:fish,a:a2,b:b2,h:1.3,d:.7,t:0,done:function(){g.remove(fish);ring(b2)}})}
    var moving=false;
    if(S.sit){S.pos.x+=(S.sit.x-S.pos.x)*.2;S.pos.z+=(S.sit.z-S.pos.z)*.2}
    else if(S.goal){var d=S.goal.clone().sub(S.pos);d.y=0;var L=d.length();
      if(L<.06){if(S.path.length)S.goal=S.path.shift();else{S.goal=null;var it=S.pend;S.pend=null;if(/^seat/.test(it||''))S.acts.sit(+it.slice(4));else if(S.acts[it])S.acts[it]()}}
      else{moving=true;S.pos.addScaledVector(d,Math.min(1,6.5*dt/L));var ty=Math.atan2(d.x,d.z),dy=ty-me.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));me.rotation.y+=dy*Math.min(1,dt*14)}}
    // muro della locanda e cerchio del falò
    if(S.pos.x>HX0-.9&&S.pos.x<HX1+.9&&S.pos.z>HZ0-.9&&S.pos.z<HZ1+.9){var dl=S.pos.x-(HX0-.9),dr=(HX1+.9)-S.pos.x,db=S.pos.z-(HZ0-.9),df=(HZ1+.9)-S.pos.z,mn=Math.min(dl,dr,db,df);if(mn===dl)S.pos.x=HX0-.9;else if(mn===dr)S.pos.x=HX1+.9;else if(mn===db)S.pos.z=HZ0-.9;else S.pos.z=HZ1+.9}
    var fd=Math.hypot(S.pos.x-CX,S.pos.z-CZ);if(fd<2.0&&fd>.001){S.pos.x=CX+(S.pos.x-CX)/fd*2.0;S.pos.z=CZ+(S.pos.z-CZ)/fd*2.0}
    // effetto Pac-Man: si esce da un lato e si rientra dall'altro
    if(S.pos.x>X1)shift(-BPX,0);else if(S.pos.x<X0)shift(BPX,0);
    if(S.pos.z>Z1)shift(0,-BPZ);else if(S.pos.z<Z0)shift(0,BPZ);
    var lp=bridge.worldToLocal(S.pos.clone()),y=0;if(Math.abs(lp.x)<1.4&&Math.abs(lp.z)<3.4)y=archY(lp.z)+.08;
    if(S.sit){y=.7;me.rotation.y=S.sit.face}
    me.position.set(S.pos.x,y+(moving?Math.abs(Math.sin(t*12))*.09:0),S.pos.z);me.rotation.z=moving?Math.sin(t*12)*.04:0;
    S.cam.tx+=(S.pos.x-S.cam.tx)*Math.min(1,dt*2.5);S.cam.tz+=(S.pos.z+.5-S.cam.tz)*Math.min(1,dt*2.5);
    moon.position.set(S.cam.tx-10,20,S.cam.tz+12);moon.target.position.set(S.cam.tx,0,S.cam.tz);
  };
  return S;
}
