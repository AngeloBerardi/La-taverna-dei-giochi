
/* ================= FUOCO: ceppi, braci, fiamme, fumo (riusabile) ================= */
var FIRETX=null;
function fireTextures(){
  if(FIRETX)return FIRETX;
  function cv(w,h,f){var c=mk(w,h),g=c.getContext('2d');f(g,w,h);return c}
  var bark=cv(128,256,function(g,w,h){g.fillStyle='#3a2414';g.fillRect(0,0,w,h);
    for(var i=0;i<46;i++){var x=Math.random()*w,wd=1+Math.random()*3;g.strokeStyle='rgba(12,6,2,'+(.5+Math.random()*.4)+')';g.lineWidth=wd;g.beginPath();g.moveTo(x,0);for(var y=0;y<=h;y+=16)g.lineTo(x+Math.sin(y*.05+i)*3,y);g.stroke()}
    for(i=0;i<30;i++){var x2=Math.random()*w;g.strokeStyle='rgba(140,100,60,'+(.15+Math.random()*.2)+')';g.lineWidth=1;g.beginPath();g.moveTo(x2,Math.random()*h);g.lineTo(x2+2,Math.random()*h);g.stroke()}
    grain(g,w,h,26)});
  var crack=cv(128,256,function(g,w,h){g.fillStyle='#000';g.fillRect(0,0,w,h);
    for(var i=0;i<34;i++){var x=Math.random()*w,y0=Math.random()*h,l=20+Math.random()*80;g.strokeStyle='rgba(255,'+(90+Math.random()*90|0)+',20,'+(.5+Math.random()*.5)+')';g.lineWidth=1+Math.random()*2.5;g.beginPath();g.moveTo(x,y0);for(var y=0;y<l;y+=8)g.lineTo(x+Math.sin(y*.2+i)*3,y0+y);g.stroke()}
    var gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,120,30,.25)');gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(255,120,30,.25)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
  var end=cv(128,128,function(g,w,h){var gr=g.createRadialGradient(64,64,2,64,64,64);gr.addColorStop(0,'#d8aa70');gr.addColorStop(.75,'#a8763e');gr.addColorStop(.86,'#3a2414');gr.addColorStop(1,'#1a0e06');g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(var r=6;r<54;r+=4+Math.random()*3){g.strokeStyle='rgba(90,55,25,'+(.3+Math.random()*.3)+')';g.lineWidth=1;g.beginPath();g.arc(64+Math.random()*2,64+Math.random()*2,r,0,7);g.stroke()}
    g.strokeStyle='rgba(40,20,8,.6)';g.lineWidth=2;g.beginPath();g.moveTo(64,64);g.lineTo(108,40);g.stroke();grain(g,w,h,18)});
  var endHot=cv(128,128,function(g,w,h){g.fillStyle='#000';g.fillRect(0,0,w,h);var gr=g.createRadialGradient(64,64,4,64,64,60);gr.addColorStop(0,'rgba(255,200,90,1)');gr.addColorStop(.5,'rgba(255,110,20,.9)');gr.addColorStop(.85,'rgba(120,20,0,.4)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
  var embers=cv(256,256,function(g,w,h){g.fillStyle='#000';g.fillRect(0,0,w,h);
    for(var i=0;i<420;i++){var x=Math.random()*w,y=Math.random()*h,r=1+Math.random()*4,d=Math.hypot(x-128,y-128)/128;if(d>1)continue;var a=(1-d)*(.4+Math.random()*.6);g.fillStyle='rgba(255,'+(70+Math.random()*120|0)+',10,'+a+')';g.beginPath();g.arc(x,y,r,0,7);g.fill()}});
  var ash=cv(256,256,function(g,w,h){var gr=g.createRadialGradient(128,128,10,128,128,128);gr.addColorStop(0,'#2a1a10');gr.addColorStop(.7,'#1a120c');gr.addColorStop(1,'rgba(20,14,10,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(var i=0;i<600;i++){var x=Math.random()*w,y=Math.random()*h;if(Math.hypot(x-128,y-128)>118)continue;g.fillStyle='rgba('+(60+Math.random()*60|0)+','+(55+Math.random()*50|0)+',50,.5)';g.fillRect(x,y,2,2)}});
  function tongue(core){return cv(128,256,function(g,w,h){
    g.save();g.beginPath();g.moveTo(64,250);g.bezierCurveTo(-6,230,6,140,40,96);g.bezierCurveTo(56,70,60,40,64,4);g.bezierCurveTo(68,40,72,70,88,96);g.bezierCurveTo(122,140,134,230,64,250);g.closePath();g.clip();
    var gr=g.createRadialGradient(64,200,4,64,170,150);
    if(core){gr.addColorStop(0,'rgba(255,255,235,1)');gr.addColorStop(.35,'rgba(255,230,140,.95)');gr.addColorStop(.7,'rgba(255,170,60,.5)');gr.addColorStop(1,'rgba(255,120,20,0)')}
    else{gr.addColorStop(0,'rgba(255,200,90,.95)');gr.addColorStop(.4,'rgba(255,120,30,.8)');gr.addColorStop(.75,'rgba(200,50,10,.45)');gr.addColorStop(1,'rgba(120,20,0,0)')}
    g.fillStyle=gr;g.fillRect(0,0,w,h);g.restore();
    var fd=g.createLinearGradient(0,0,0,h);fd.addColorStop(0,'rgba(0,0,0,1)');fd.addColorStop(.25,'rgba(0,0,0,0)');g.globalCompositeOperation='destination-out';g.fillStyle=fd;g.fillRect(0,0,w,h)})}
  var smoke=cv(128,128,function(g,w,h){for(var i=0;i<14;i++){var x=40+Math.random()*48,y=40+Math.random()*48,r=18+Math.random()*26,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(190,190,200,.28)');gr.addColorStop(1,'rgba(190,190,200,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)}});
  function T2(c,s){var t=new T.CanvasTexture(c);if(s!==false)t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;return t}
  var bt=T2(bark);bt.repeat.set(1,1.5);var ct=T2(crack);ct.repeat.set(1,1.5);
  FIRETX={
    bark:new T.MeshStandardMaterial({map:bt,bumpMap:bt,bumpScale:1.2,roughness:.95}),
    end:new T.MeshStandardMaterial({map:T2(end),roughness:.9}),
    burnt:new T.MeshStandardMaterial({color:0x2a1c14,map:bt,bumpMap:bt,bumpScale:1.4,roughness:1,emissive:0xff6a1a,emissiveMap:ct,emissiveIntensity:1.6}),
    burntEnd:new T.MeshStandardMaterial({color:0x1a0e08,roughness:1,emissive:0xff6a1a,emissiveMap:T2(endHot),emissiveIntensity:.8}),
    embers:new T.MeshStandardMaterial({color:0x140a06,roughness:1,emissive:0xff6a1a,emissiveMap:T2(embers),emissiveIntensity:1.8,transparent:true,depthWrite:false}),
    ash:new T.MeshStandardMaterial({map:T2(ash),roughness:1,transparent:true,depthWrite:false}),
    tOuter:T2(tongue(false)),tCore:T2(tongue(true)),smoke:T2(smoke)
  };
  return FIRETX;
}
/* ceppo con corteccia e anelli; hot = carbonizzato con crepe incandescenti */
var LOGG={};
function logMesh(r,len,hot){var X=fireTextures(),k=r+'|'+len;var gq=LOGG[k]||(LOGG[k]=new T.CylinderGeometry(r,r*1.04,len,12,1));
  var m=new T.Mesh(gq,hot?[X.burnt,X.burntEnd,X.burntEnd]:[X.bark,X.end,X.end]);m.castShadow=true;m.receiveShadow=true;return m}
/* makeFire(S, x,y,z, scala, {kind:'teepee'|'stack', smoke:bool}) — y = quota del piano su cui poggia */
function makeFire(S,x,y,z,sc,o){
  o=o||{};var X=fireTextures(),g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(sc||1);S.g.add(g);
  var ash=new T.Mesh(new T.CircleGeometry(1.3,24),X.ash);ash.rotation.x=-PI/2;ash.position.y=.02;ash.renderOrder=1;g.add(ash);
  var emb=new T.Mesh(new T.CircleGeometry(.95,24),X.embers);emb.rotation.x=-PI/2;emb.position.y=.05;emb.renderOrder=2;g.add(emb);
  for(var i=0;i<9;i++){var ch=new T.Mesh(GEO('chunk',function(){return new T.DodecahedronGeometry(.13,0)}),X.burnt);ch.position.set((Math.random()-.5)*1.2,.08,(Math.random()-.5)*1.2);ch.scale.set(1,.6,1.3);ch.rotation.y=Math.random()*6;g.add(ch)}
  if(o.kind==='stack'){
    [[0,.2,-.25,.1],[0,.2,.3,-.12],[0,.55,.03,.05]].forEach(function(p,k){var l=logMesh(.2,2.4,true);l.rotation.z=PI/2;l.rotation.y=p[3];l.position.set(p[0],p[1],p[2]);g.add(l)});
    // alari di ferro
    [-1,1].forEach(function(s){g.add(box(.08,.5,.08,M.iron,.6*s,.25,-.62));g.add(box(.08,.5,.08,M.iron,.6*s,.25,.62));g.add(box(.08,.06,1.3,M.iron,.6*s,.08,0))});
  }else{
    for(var k=0;k<5;k++){var a=k/5*PI*2,q=new T.Group();q.rotation.y=-a;q.position.set(Math.cos(a)*.6,0,Math.sin(a)*.6);var lg=logMesh(.13,1.9,true);lg.position.set(-.45,.8,0);lg.rotation.z=.55;q.add(lg);g.add(q)}
  }
  var light=plight(S,x,y+1.4*sc,z,0xff8a3a,o.int||1.6,o.dist||18,0);
  var tongues=[],N=o.kind==='stack'?14:12;
  for(i=0;i<N;i++){var core=i%3===0,sp=new T.Sprite(new T.SpriteMaterial({map:core?X.tCore:X.tOuter,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));
    var bx=(Math.random()-.5)*(o.kind==='stack'?1.7:.9),bz=(Math.random()-.5)*(o.kind==='stack'?.5:.9);
    sp.userData={bx:bx,bz:bz,ph:Math.random(),sp:core?.9+Math.random()*.4:.6+Math.random()*.5,w:core?.45:.7+Math.random()*.35,h:core?1.0:1.5+Math.random()*.7,core:core};g.add(sp);tongues.push(sp)}
  var smokes=[];
  if(o.smoke)for(i=0;i<14;i++){var sm=new T.Sprite(new T.SpriteMaterial({map:X.smoke,transparent:true,depthWrite:false,opacity:0,color:0x9a9aa6}));sm.userData={ph:i/14,dx:(Math.random()-.5)*.6};g.add(sm);smokes.push(sm)}
  var sparks=[];
  S.fx=S.fx||[];
  var F={g:g,light:light,boost:0,dim:1};
  F.burst=function(n){for(var q=0;q<(n||30);q++){var s=new T.Mesh(GEO('spark',function(){return new T.SphereGeometry(.05,4,3)}),new T.MeshBasicMaterial({color:0xffb050,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));s.position.set((Math.random()-.5)*.8,.6,(Math.random()-.5)*.8);g.add(s);sparks.push({m:s,v:new T.Vector3((Math.random()-.5)*1.2,2.4+Math.random()*3,(Math.random()-.5)*1.2),t:0})}F.boost=1.4};
  S.fx.push(function(t,dt){
    var B=1+F.boost*.8;F.boost=Math.max(0,F.boost-dt);
    tongues.forEach(function(s){var u=s.userData,p=(t*u.sp+u.ph)%1,life=Math.sin(p*PI);
      s.position.set(u.bx+Math.sin(t*3+u.ph*9)*.08,.15+p*u.h*.9*B,u.bz);
      s.scale.set(u.w*(1.05-p*.5)*B,u.h*(.7+life*.5)*B,1);s.material.opacity=(u.core?.85:.55)*life*F.dim});
    light.intensity=(o.int||1.6)*B*(.85+.15*Math.sin(t*17)+.08*Math.sin(t*7.3))*F.dim;
    X.burnt.emissiveIntensity=1.3+Math.sin(t*2.1)*.3;X.embers.emissiveIntensity=1.6+Math.sin(t*1.7)*.4;
    smokes.forEach(function(s){var u=s.userData,p=(t*.08+u.ph)%1;s.position.set(u.dx+Math.sin(t*.4+u.ph*8)*.6*p+p*1.2,2+p*8,Math.cos(t*.3+u.ph*5)*.5*p);var k=.8+p*3.4;s.scale.set(k,k,1);s.material.opacity=.55*Math.sin(p*PI)*(p<.08?p/.08:1)});
    if(Math.random()<dt*1.5)F.burst(2);
    for(var q=sparks.length-1;q>=0;q--){var sk=sparks[q];sk.t+=dt;sk.v.y-=1.4*dt;sk.m.position.addScaledVector(sk.v,dt);sk.m.material.opacity=1-sk.t/1.5;if(sk.t>1.5){g.remove(sk.m);sk.m.material.dispose();sparks.splice(q,1)}}
  });
  return F;
}
/* fonde i mesh statici di un gruppo in un mesh per materiale (per copie leggere) */
function mergeStatic(grp){
  grp.updateMatrixWorld(true);var inv=new T.Matrix4().copy(grp.matrixWorld).invert(),buckets={};
  grp.traverse(function(o){if(!o.isMesh||o.userData.noMerge||(o.material&&o.material.visible===false)||Array.isArray(o.material))return;
    var gm=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();var m=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld);gm.applyMatrix4(m);
    if(!gm.attributes.normal)gm.computeVertexNormals();
    var n=gm.attributes.position.count;if(!gm.attributes.uv)gm.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));
    var k=o.material.uuid;(buckets[k]=buckets[k]||{mat:o.material,list:[]}).list.push(gm)});
  var out=new T.Group();
  Object.keys(buckets).forEach(function(k){var B=buckets[k],tot=0;B.list.forEach(function(g){tot+=g.attributes.position.count});
    var P=new Float32Array(tot*3),N=new Float32Array(tot*3),U=new Float32Array(tot*2),o=0;
    B.list.forEach(function(g){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);U.set(g.attributes.uv.array.subarray(0,g.attributes.position.count*2),o*2);o+=g.attributes.position.count;g.dispose()});
    var bg=new T.BufferGeometry();bg.setAttribute('position',new T.BufferAttribute(P,3));bg.setAttribute('normal',new T.BufferAttribute(N,3));bg.setAttribute('uv',new T.BufferAttribute(U,2));
    var me=new T.Mesh(bg,B.mat);me.receiveShadow=true;me.castShadow=true;out.add(me)});
  return out;
}
