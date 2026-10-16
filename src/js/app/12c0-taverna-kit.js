/* ---- TavernaKit: asset 3D procedurali della locanda (three.js r128). Generato dal prototipo: definisce solo window.TavernaKit, non tocca il resto dell'app. ---- */
window.TavernaKit=function(T,renderer,opts){
'use strict';opts=opts||{};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var R=mulberry32(opts.seed||7),PI=Math.PI;
var mk=function(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c};
var $=function(id){return document.getElementById(id)};
var ANIS=Math.min(8,renderer.capabilities.getMaxAnisotropy());
var GAMES=opts.games||[],CATS=opts.cats||[];
/* ---------- texture procedurali ---------- */
function grain(g,w,h,amt){var d=g.getImageData(0,0,w,h),a=d.data;for(var i=0;i<a.length;i+=4){var n=(R()-.5)*amt;a[i]+=n;a[i+1]+=n;a[i+2]+=n}g.putImageData(d,0,0)}
function tex(c,rx,ry,srgb){var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=ANIS;if(srgb!==false)t.encoding=T.sRGBEncoding;return t}
function wood(w,h,base,o){
  o=o||{};var c=mk(w,h),g=c.getContext('2d');
  g.fillStyle=base;g.fillRect(0,0,w,h);
  var pw=o.plank||0,i,y,x;
  if(pw){for(y=0;y<h;y+=pw){g.fillStyle=R()<.5?'rgba(0,0,0,'+(R()*.16)+')':'rgba(255,200,140,'+(R()*.08)+')';g.fillRect(0,y,w,pw)}}
  for(i=0;i<(o.lines||320);i++){
    var yy=R()*h,amp=R()*3+.6,fr=R()*.012+.002,ph=R()*6,al=R()*.2+.04;
    g.strokeStyle=R()<.62?'rgba(18,8,2,'+al+')':'rgba(255,205,150,'+(al*.45)+')';
    g.lineWidth=R()*2.2+.4;g.beginPath();
    for(x=0;x<=w;x+=16){var v=yy+Math.sin(x*fr+ph)*amp;if(x)g.lineTo(x,v);else g.moveTo(x,v)}
    g.stroke();
  }
  for(i=0;i<(o.knots||4);i++){
    var kx=R()*w,ky=R()*h,kr=6+R()*10;
    for(var r=kr;r>1;r-=2.2){g.strokeStyle='rgba(20,9,3,'+(.1+R()*.25)+')';g.lineWidth=1.3;g.beginPath();g.ellipse(kx,ky,r*2.6,r,0,0,7);g.stroke()}
  }
  if(pw){for(y=0;y<h;y+=pw){g.fillStyle='rgba(0,0,0,.7)';g.fillRect(0,y,w,2.5);g.fillStyle='rgba(255,210,160,.12)';g.fillRect(0,y+3,w,1.5)}}
  grain(g,w,h,16);return c;
}
function feltCanvas(){
  var S=512,c=mk(S,S),g=c.getContext('2d');
  g.fillStyle='#21704c';g.fillRect(0,0,S,S);
  for(var i=0;i<9000;i++){var a=R()*6.28,l=2+R()*7,x=R()*S,y=R()*S;g.strokeStyle=R()<.5?'rgba(120,200,150,'+(R()*.1)+')':'rgba(0,25,12,'+(R()*.16)+')';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  for(i=0;i<26;i++){var wx=R()*S,wy=R()*S,wr=18+R()*50,gr=g.createRadialGradient(wx,wy,0,wx,wy,wr);gr.addColorStop(0,'rgba(150,230,180,.025)');gr.addColorStop(1,'rgba(150,230,180,0)');g.fillStyle=gr;g.fillRect(wx-wr,wy-wr,wr*2,wr*2)}
  grain(g,S,S,20);return c;
}
function rugCanvas(){
  var S=1024,c=mk(S,S),g=c.getContext('2d'),cx=S/2;
  g.fillStyle='#4e1520';g.beginPath();g.arc(cx,cx,cx,0,7);g.fill();
  var rings=[[500,'#b88a3a',10],[470,'#1c0c10',26],[430,'#7c2431',44],[380,'#b88a3a',6],[360,'#3b1019',40],[300,'#7c2431',38],[250,'#b88a3a',6]],i,k;
  rings.forEach(function(r){g.strokeStyle=r[1];g.lineWidth=r[2];g.beginPath();g.arc(cx,cx,r[0]-r[2]/2,0,7);g.stroke()});
  for(k=0;k<36;k++){g.save();g.translate(cx,cx);g.rotate(k/36*6.283);g.fillStyle='#d8b062';g.beginPath();g.moveTo(0,-410);g.lineTo(11,-396);g.lineTo(0,-382);g.lineTo(-11,-396);g.closePath();g.fill();g.restore()}
  for(k=0;k<12;k++){g.save();g.translate(cx,cx);g.rotate(k/12*6.283);g.fillStyle='rgba(216,176,98,.85)';g.beginPath();g.moveTo(0,-230);g.lineTo(26,-170);g.lineTo(0,-110);g.lineTo(-26,-170);g.closePath();g.fill();g.fillStyle='#4e1520';g.beginPath();g.arc(0,-170,9,0,7);g.fill();g.restore()}
  g.fillStyle='#b88a3a';g.beginPath();g.arc(cx,cx,70,0,7);g.fill();g.fillStyle='#4e1520';g.beginPath();g.arc(cx,cx,48,0,7);g.fill();
  var d=g.getImageData(0,0,S,S),a=d.data;for(i=0;i<a.length;i+=4){var n=(R()-.5)*30;a[i]+=n;a[i+1]+=n*.8;a[i+2]+=n*.8}g.putImageData(d,0,0);
  for(i=0;i<5000;i++){var x=R()*S,y=R()*S;g.fillStyle='rgba(0,0,0,'+R()*.12+')';g.fillRect(x,y,1,1+R()*3)}
  return c;
}
function stoneCanvas(){
  var W=512,H=512,c=mk(W,H),g=c.getContext('2d'),y=0,row=0;
  g.fillStyle='#3c3836';g.fillRect(0,0,W,H);
  while(y<H){var h=56+R()*22,x=row%2?-40:0;while(x<W){var w=90+R()*70,v=70+R()*50;g.fillStyle='rgb('+v+','+(v-4)+','+(v-10)+')';g.fillRect(x+3,y+3,w-6,h-6);var gr=g.createLinearGradient(x,y,x,y+h);gr.addColorStop(0,'rgba(255,255,255,.1)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(x+3,y+3,w-6,h-6);x+=w}y+=h;row++}
  grain(g,W,H,30);return c;
}
function windowCanvas(){
  var W=256,H=320,c=mk(W,H),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,H);
  gr.addColorStop(0,'#0d1435');gr.addColorStop(1,'#34468a');g.fillStyle=gr;g.fillRect(0,0,W,H);
  for(var i=0;i<70;i++){g.fillStyle='rgba(255,246,210,'+(.3+R()*.7)+')';var s=R()<.15?2.2:1.2;g.fillRect(R()*W,R()*H*.8,s,s)}
  var mg=g.createRadialGradient(170,90,4,170,90,70);mg.addColorStop(0,'rgba(255,248,220,.95)');mg.addColorStop(.18,'rgba(255,244,205,.5)');mg.addColorStop(1,'rgba(255,244,205,0)');g.fillStyle=mg;g.fillRect(0,0,W,H);
  g.fillStyle='#fff6d8';g.beginPath();g.arc(170,90,22,0,7);g.fill();g.fillStyle='rgba(180,170,140,.35)';g.beginPath();g.arc(162,84,6,0,7);g.arc(178,98,4,0,7);g.fill();
  g.fillStyle='rgba(6,8,22,.9)';g.beginPath();g.moveTo(0,H);g.lineTo(0,250);g.lineTo(60,236);g.lineTo(120,258);g.lineTo(190,232);g.lineTo(256,250);g.lineTo(256,H);g.fill();
  return c;
}
function spriteCanvas(stops){var c=mk(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);stops.forEach(function(s){gr.addColorStop(s[0],s[1])});g.fillStyle=gr;g.fillRect(0,0,128,128);return c}
function flameCanvas(){var c=mk(128,192),g=c.getContext('2d'),gr=g.createRadialGradient(64,120,2,64,120,64);gr.addColorStop(0,'rgba(255,250,200,1)');gr.addColorStop(.25,'rgba(255,190,70,.95)');gr.addColorStop(.6,'rgba(255,90,20,.55)');gr.addColorStop(1,'rgba(200,30,0,0)');g.save();g.translate(64,120);g.scale(.8,1.5);g.translate(-64,-120);g.fillStyle=gr;g.fillRect(0,0,128,240);g.restore();return c}

/* ---------- materiali ---------- */
var floorTex=tex(wood(1024,1024,'#4b2f1c',{plank:128,lines:420,knots:6}),5,5);
var wallTex=tex(wood(1024,1024,'#2c1a10',{plank:170,lines:300,knots:3}),7,3);
var tableWood=tex(wood(1024,256,'#5a3820',{lines:240,knots:2}),4,1);
var darkWood=tex(wood(512,512,'#2d1a0f',{lines:200,knots:2}),1,1);
var feltT=tex(feltCanvas(),5,5);
var rugT=tex(rugCanvas(),1,1);
var stoneT=tex(stoneCanvas(),2,2);
var envTex=(function(){
  var es=new T.Scene(),m;
  es.background=new T.Color(0x0a0810);
  m=new T.Mesh(new T.BoxGeometry(14,2,14),new T.MeshBasicMaterial({color:new T.Color(1.3,.9,.45)}));m.position.set(0,12,0);es.add(m);
  m=new T.Mesh(new T.BoxGeometry(2,12,16),new T.MeshBasicMaterial({color:new T.Color(1.1,.55,.2)}));m.position.set(-20,4,0);es.add(m);
  m=new T.Mesh(new T.BoxGeometry(14,10,2),new T.MeshBasicMaterial({color:new T.Color(.12,.17,.4)}));m.position.set(8,6,-20);es.add(m);
  var p=new T.PMREMGenerator(renderer);var t=p.fromScene(es).texture;p.dispose();return t;
})();
function std(o){return new T.MeshStandardMaterial(o)}
var M={
  floor:std({map:floorTex,bumpMap:floorTex,bumpScale:.8,roughness:.62}),
  wall:std({map:wallTex,bumpMap:wallTex,bumpScale:.9,roughness:.85}),
  tableEdge:std({map:tableWood,bumpMap:tableWood,bumpScale:.5,roughness:.55,envMap:envTex,envMapIntensity:.35}),
  dark:std({map:darkWood,bumpMap:darkWood,bumpScale:.5,roughness:.7}),
  felt:std({map:feltT,bumpMap:feltT,bumpScale:.35,roughness:1}),
  leather:std({color:0x4a2a1a,roughness:.5,metalness:0,envMap:envTex,envMapIntensity:.5}),
  rug:std({map:rugT,roughness:1}),
  stone:std({map:stoneT,bumpMap:stoneT,bumpScale:1.4,roughness:.95}),
  iron:std({color:0x1b1a1d,roughness:.45,metalness:.85,envMap:envTex,envMapIntensity:.8}),
  gold:std({color:0xe2b13c,roughness:.32,metalness:.9,envMap:envTex,envMapIntensity:1}),
  glass:std({color:0x10301f,roughness:.12,metalness:.1,envMap:envTex,envMapIntensity:1.2}),
  glass2:std({color:0x3a1d0e,roughness:.12,metalness:.1,envMap:envTex,envMapIntensity:1.2}),
  pewter:std({color:0x8d8f94,roughness:.35,metalness:.85,envMap:envTex,envMapIntensity:.9}),
  paper:std({color:0xe9dcc0,roughness:.9})
};
function mesh(geo,mat,x,y,z,cast,recv){var m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=cast!==false;m.receiveShadow=recv!==false;return m}

function cylBetween(a,b,r,mat){var d=b.clone().sub(a),len=d.length(),m=new T.Mesh(GEO('cyl'+r+'|'+len.toFixed(3),function(){return new T.CylinderGeometry(r,r*.88,len,10)}),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.castShadow=true;return m}
var gold2=new T.MeshStandardMaterial({color:0xb8943a,metalness:.9,roughness:.35});
var steel=new T.MeshStandardMaterial({color:0x9aa0a8,metalness:.85,roughness:.3});
var MATC={};function mc(c,r,mt){var k=c+'|'+(r||.8)+'|'+(mt||0);return MATC[k]||(MATC[k]=new T.MeshStandardMaterial({color:c,roughness:r||.8,metalness:mt||0}))}
/* cache geometrie: ogni forma viene creata una volta sola */
var GEOC={};function GEO(k,f){return GEOC[k]||(GEOC[k]=f())}
function gS(r,w,h,a,b,c,d){return GEO('s'+[r,w,h,a,b,c,d].join(','),function(){return new T.SphereGeometry(r,w,h,a,b,c,d)})}
function gC(rt,rb,h,s,o,ts,tl){return GEO('c'+[rt,rb,h,s,o,ts,tl].join(','),function(){return new T.CylinderGeometry(rt,rb,h,s,1,o,ts,tl)})}
function gT(r,t,rs,ts,arc){return GEO('t'+[r,t,rs,ts,arc].join(','),function(){return new T.TorusGeometry(r,t,rs,ts,arc)})}
function gB(w,h,d){return GEO('b'+[w,h,d].join(','),function(){return new T.BoxGeometry(w,h,d)})}
function gK(r,h,s){return GEO('k'+[r,h,s].join(','),function(){return new T.ConeGeometry(r,h,s)})}
function gL(k,pts){return GEO('l'+k,function(){return new T.LatheGeometry(pts.map(function(p){return new T.Vector2(p[0],p[1])}),26)})}
function pm(geo,mat,x,y,z,cast){var m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=cast!==false;m.receiveShadow=true;return m}
var BODYP={veste:[[0,0],[1.5,0],[1.5,1.2],[1.3,2.4],[1.15,3.4],[.85,4.05],[.45,4.38],[.3,4.5],[0,4.5]],
  abito:[[0,0],[1.8,0],[1.72,.5],[1.4,1.8],[1.12,3.2],[.85,4.05],[.45,4.38],[.3,4.5],[0,4.5]],
  tunica:[[0,0],[1.3,0],[1.36,1.0],[1.3,2.4],[1.2,3.4],[.88,4.05],[.45,4.38],[.3,4.5],[0,4.5]]};
var BODYS={snello:[.84,1],normale:[1,1],robusto:[1.2,1.05]},HEIGHTS={basso:.86,medio:1,alto:1.12};
/* pupazzo: tutte le opzioni (default tra parentesi)
   corpo: body snello|(normale)|robusto, height basso|(medio)|alto, skin
   viso: eyes (tondi)|grandi|felici|assonnati|stelle, brows nessuna|(sottili)|folte|arrabbiate, mouth (sorriso)|neutra|stupita|ghigno|lingua,
         nose piccolo|(tondo)|lungo, ears (normali)|elfo|grandi, blush, freckles, glasses (none)|tondi|monocolo|benda, jewel (none)|orecchini|collana
   capelli: hair short|long|bun|bald|coda|cresta|ricci, hairc, beard (none)|baffi|corta|lunga|pizzetto
   abiti: outfit (veste)|abito|tunica|grembiule|armatura, robe, collar gorgiera|sciarpa|none, collarc, beltc, cape (none)|mantello, capec
   accessori: head none|brim|hood|beret|top|bandana|crown|elmo|fiori, hatc, prop none|pipa|fiore|liuto|boccale|libro|spada|lanterna
   compatibilità: o.hat = brim|hood|bald.  own:true → materiali propri, modificabili al volo con updateFigure */
function normFig(o){o=Object.assign({},o);
  if(o.hat&&!o.head){if(o.hat==='bald'){o.head='none';o.hair='short';o.hairc=o.hairc||o.hatc}else{o.head=o.hat;o.hair='bald'}}
  var D={hair:'bald',head:'none',collar:'gorgiera',beard:'none',prop:'none',body:'normale',height:'medio',eyes:'tondi',brows:'sottili',mouth:'sorriso',nose:'tondo',ears:'normali',glasses:'none',jewel:'none',outfit:'veste',cape:'none'};
  Object.keys(D).forEach(function(k){if(o[k]==null)o[k]=D[k]});if(o.glasses===true)o.glasses='tondi';if(o.glasses===false)o.glasses='none';return o}
var DARK=mc(0x140a06,.5),WHITE=mc(0xf6f2ea,.4);
var FIGPART={
  outfit:function(o,X){var g=new T.Group(),prof=BODYP[o.outfit==='abito'?'abito':o.outfit==='tunica'?'tunica':'veste'];
    var body=pm(gL(o.outfit==='abito'?'abito':o.outfit==='tunica'?'tunica':'veste',prof),X.robe);body.scale.set(1,1,.62);g.add(body);
    var belt=pm(gC(1.42,1.45,.22,28),X.belt,0,2.1,0);belt.scale.set(1,1,.62);g.add(belt);g.add(pm(gB(.3,.26,.05),gold2,0,2.1,.9,false));
    if(o.outfit==='tunica'){[-1,1].forEach(function(s){g.add(pm(gC(.32,.36,.5,12),mc(0x2a1a10,.7),s*.55,.22,.15))});var hem=pm(gT(1.32,.08,6,26),X.collar,0,1.0,0);hem.rotation.x=PI/2;hem.scale.set(1,.62,1);g.add(hem)}
    if(o.outfit==='abito'){var h2=pm(gT(1.74,.1,6,28),X.collar,0,.42,0);h2.rotation.x=PI/2;h2.scale.set(1,.62,1);g.add(h2)}
    if(o.outfit==='grembiule'){var ap=pm(gB(1.5,2.3,.06),mc(0xe8e0cc,.9),0,1.65,.98);ap.rotation.x=.08;g.add(ap);g.add(pm(gB(.7,.6,.06),mc(0xe8e0cc,.9),0,3.1,.88));g.add(pm(gB(.5,.35,.07),mc(0xd0c4a8,.9),0,1.4,1.03,false))}
    if(o.outfit==='armatura'){var pl=pm(gS(1.0,18,12,0,PI*2,0,PI*.55),steel,0,2.9,.1);pl.scale.set(1.05,.9,.75);g.add(pl);[-1,1].forEach(function(s){var pa=pm(gS(.42,14,10,0,PI*2,0,PI*.5),steel,s*1.0,4.05,0);pa.rotation.z=-s*.5;g.add(pa)});g.add(pm(gS(.16,10,8),gold2,0,3.4,.82,false))}
    return g},
  cape:function(o,X){var g=new T.Group();if(o.cape==='none')return g;var c=pm(gC(1.25,1.75,3.9,20,true,PI*.62,PI*.76),X.cape,0,2.4,-.08);c.scale.set(1,1,.7);g.add(c);[-1,1].forEach(function(s){g.add(pm(gS(.12,8,6),gold2,s*.55,4.25,.42,false))});return g},
  hair:function(o,X){var g=new T.Group(),H=X.hair;
    if(o.hair!=='bald'&&o.hair!=='cresta')g.add(pm(gS(.56,20,14,0,PI*2,0,PI*.52),H,0,5.07,-.03));
    if(o.hair==='long')g.add(pm(gC(.5,.62,1.1,18,true,PI*.6,PI*1.8),H,0,4.75,-.05));
    if(o.hair==='bun')g.add(pm(gS(.24,12,10),H,0,5.68,-.22));
    if(o.hair==='coda'){g.add(pm(gS(.16,10,8),H,0,5.35,-.56));var tl=pm(gK(.18,1.0,10),H,0,4.85,-.66);tl.rotation.x=PI+.25;g.add(tl)}
    if(o.hair==='cresta')for(var k=0;k<5;k++){var cn=pm(gK(.12,.5,6),H,0,5.42+Math.sin(k/4*PI)*.18,.38-k*.22);cn.rotation.x=-.3+k*.18;g.add(cn)}
    if(o.hair==='ricci')for(k=0;k<14;k++){var a=k/14*PI*2,yy=5.2+(k%2)*.15;g.add(pm(gS(.17,8,6),H,Math.cos(a)*.5,yy,Math.sin(a)*.5-.05))}
    return g},
  beard:function(o,X){var g=new T.Group(),H=X.hair;
    if(o.beard==='baffi')[-1,1].forEach(function(s){var b=pm(gS(.1,8,6),H,s*.12,4.9,.52,false);b.scale.set(1.6,.6,.7);g.add(b)});
    else if(o.beard==='corta'||o.beard==='lunga'){g.add(pm(gS(.42,16,10,0,PI*2,PI*.55,PI*.45),H,0,4.98,.12));
      if(o.beard==='lunga'){var bl=pm(gK(.3,.9,12),H,0,4.35,.42);bl.rotation.x=PI+.25;g.add(bl)}}
    else if(o.beard==='pizzetto'){var pz=pm(gK(.1,.3,8),H,0,4.62,.44,false);pz.rotation.x=PI+.4;g.add(pz)}
    return g},
  face:function(o,X){var g=new T.Group(),sk=X.skin,E=o.eyes;
    [-1,1].forEach(function(s){var x=s*.18;
      if(E==='grandi'){g.add(pm(gS(.11,10,8),WHITE,x,5.12,.47,false));g.add(pm(gS(.06,8,6),DARK,x,5.12,.56,false))}
      else if(E==='felici'){var a=pm(gT(.065,.022,5,10,PI),DARK,x,5.08,.52,false);g.add(a)}
      else if(E==='assonnati'){var e=pm(gS(.06,8,6),DARK,x,5.08,.5,false);e.scale.y=.35;g.add(e);var lid=pm(gB(.16,.03,.03),sk,x,5.12,.53,false);g.add(lid)}
      else if(E==='stelle'){var st=pm(gK(.07,.05,5),mc(0xf2c84a,.4),x,5.1,.54,false);st.rotation.x=PI/2;g.add(st)}
      else g.add(pm(gS(.055,8,6),DARK,x,5.1,.5,false));
      if(o.brows!=='nessuna'){var bw=pm(gB(o.brows==='folte'?.2:.16,o.brows==='folte'?.06:.03,.04),X.hair,x,5.26,.47,false);bw.rotation.z=o.brows==='arrabbiate'?-s*.45:s*.1;g.add(bw)}
      // orecchie
      if(o.ears==='elfo'){var ea=pm(gK(.1,.42,6),sk,s*.52,5.18,0);ea.rotation.z=-s*1.0;g.add(ea)}
      else g.add(pm(gS(o.ears==='grandi'?.16:.1,8,6),sk,s*.5,5.05,0,false));
      if(o.blush)g.add(pm(gS(.09,8,6),mc(0xe88a8a,.7),s*.3,4.92,.42,false));
      if(o.freckles)for(var q=0;q<3;q++)g.add(pm(gS(.018,4,3),mc(0x8a4a2a,.8),s*(.22+q*.05),4.98-q*.03,.47,false));
      if(o.jewel==='orecchini')g.add(pm(gS(.05,6,4),gold2,s*.52,4.9,.02,false));
    });
    // naso
    if(o.nose==='lungo'){var n=pm(gK(.08,.3,8),sk,0,4.98,.62,false);n.rotation.x=PI/2;g.add(n)}else g.add(pm(gS(o.nose==='piccolo'?.06:.1,10,8),sk,0,4.98,.55,false));
    // bocca
    var M0=o.mouth;
    if(M0==='sorriso'){var sm=pm(gT(.1,.02,5,12,PI),DARK,0,4.86,.48,false);sm.rotation.z=PI;g.add(sm)}
    else if(M0==='neutra')g.add(pm(gB(.14,.025,.02),DARK,0,4.83,.5,false));
    else if(M0==='stupita'){var mo=pm(gS(.05,8,6),DARK,0,4.8,.5,false);mo.scale.y=1.4;g.add(mo)}
    else if(M0==='ghigno'){var gh=pm(gT(.09,.02,5,12,PI*.7),DARK,.03,4.86,.48,false);gh.rotation.z=PI+.3;g.add(gh)}
    else if(M0==='lingua'){var l1=pm(gT(.1,.02,5,12,PI),DARK,0,4.86,.48,false);l1.rotation.z=PI;g.add(l1);g.add(pm(gS(.05,8,6),mc(0xd85a6a,.6),.03,4.76,.5,false))}
    // occhiali
    if(o.glasses==='tondi'){[-1,1].forEach(function(s){g.add(pm(gT(.12,.025,6,16),mc(0x1a1a1a,.4,.6),s*.19,5.1,.53,false))});g.add(pm(gB(.14,.025,.025),mc(0x1a1a1a,.4,.6),0,5.12,.55,false))}
    else if(o.glasses==='monocolo'){g.add(pm(gT(.12,.02,6,16),gold2,.19,5.1,.54,false));var ch=pm(gC(.008,.008,.6,4),gold2,.32,4.8,.45,false);ch.rotation.z=.3;g.add(ch)}
    else if(o.glasses==='benda'){g.add(pm(gS(.12,10,8),mc(0x111111,.6),.19,5.1,.49,false));var bd=pm(gT(.54,.02,4,24),mc(0x111111,.6),0,5.15,.05,false);bd.rotation.x=PI/2;bd.rotation.y=.25;g.add(bd)}
    if(o.jewel==='collana'){var nk=pm(gT(.5,.035,6,24),gold2,0,4.28,.15,false);nk.rotation.x=PI/2-.35;g.add(nk);g.add(pm(gS(.09,8,6),mc(0xc82a3a,.2,.3),0,4.12,.62,false))}
    return g},
  head:function(o,X){var g=new T.Group(),h=X.hat;
    if(o.head==='brim'){g.add(pm(gC(.95,.95,.07,32),h,0,5.5,.05));g.add(pm(gC(.5,.58,.55,24),h,0,5.8,.05));var f=pm(gK(.07,.9,6),mc(0xe8dcc0,.7),.5,6.0,.1);f.rotation.z=-.5;g.add(f)}
    else if(o.head==='hood'){var hd=pm(gS(.68,26,18,0,PI*2,0,PI*.64),h,0,5.1,-.02);hd.rotation.x=-.42;hd.scale.set(1,1.08,1.05);g.add(hd);g.add(pm(gS(.4,16,12),mc(0x3a2412,1),0,4.65,.32))}
    else if(o.head==='beret'){var be=pm(gS(.62,20,10),h,.08,5.52,-.02);be.scale.set(1,.32,1);be.rotation.z=-.18;g.add(be);g.add(pm(gC(.04,.04,.14,6),h,.06,5.74,0))}
    else if(o.head==='top'){g.add(pm(gC(.8,.8,.06,28),h,0,5.48,.02));g.add(pm(gC(.46,.46,1.05,22),h,0,6.02,.02));g.add(pm(gC(.47,.47,.16,22),mc(0x8a1a1a,.6),0,5.6,.02))}
    else if(o.head==='bandana'){g.add(pm(gS(.58,20,12,0,PI*2,0,PI*.42),h,0,5.1,-.03));g.add(pm(gS(.12,8,6),h,0,5.2,-.6))}
    else if(o.head==='crown'){var cr=new T.Group();cr.position.set(0,5.52,.02);g.add(cr);cr.add(pm(gC(.46,.46,.22,20,true),gold2,0,0,0));
      for(var k=0;k<6;k++){var a=k/6*PI*2;cr.add(pm(gK(.09,.3,4),gold2,Math.cos(a)*.44,.24,Math.sin(a)*.44));cr.add(pm(gS(.05,6,4),mc(k%2?0xc82a2a:0x2a6ac8,.3),Math.cos(a)*.47,0,Math.sin(a)*.47,false))}}
    else if(o.head==='elmo'){g.add(pm(gS(.6,20,12,0,PI*2,0,PI*.5),steel,0,5.12,-.02));g.add(pm(gB(.08,.5,.08),steel,0,5.05,.6));var cr2=pm(gB(.06,.3,1.0),h,0,5.75,-.05);g.add(cr2)}
    else if(o.head==='fiori'){var tr=pm(gT(.52,.06,6,24),mc(0x3a7a2a,.8),0,5.42,0);tr.rotation.x=PI/2;g.add(tr);for(var q=0;q<8;q++){var b=q/8*PI*2;g.add(pm(gS(.09,8,6),mc([0xe84a7a,0xf2d04a,0xf2f2ee,0xb88ae0][q%4],.6),Math.cos(b)*.52,5.47,Math.sin(b)*.52,false))}}
    return g},
  collar:function(o,X){var g=new T.Group();
    if(o.collar==='gorgiera'){var c=pm(gT(.62,.17,10,28),X.collar,0,4.42,.04);c.rotation.x=PI/2;g.add(c)}
    else if(o.collar==='sciarpa'){var s=pm(gT(.58,.2,10,28),X.collar,0,4.38,.04);s.rotation.x=PI/2;g.add(s);var tl=pm(gB(.3,1.0,.12),X.collar,.32,3.8,.62);tl.rotation.z=.15;g.add(tl)}
    return g},
  prop:function(o,X){var g=new T.Group(),R0=new T.Vector3(.95,3.3,1.15),L0=new T.Vector3(-.95,3.3,1.15);
    if(o.prop==='pipa'){var st=pm(gC(.025,.025,.5,6),mc(0x3a2412,.6),.38,4.86,.72,false);st.rotation.z=PI/2.4;g.add(st);g.add(pm(gC(.09,.07,.18,10),mc(0x5a3420,.6),.6,4.96,.74,false))}
    else if(o.prop==='fiore'){g.add(pm(gS(.13,10,8),mc(0xe84a7a,.6),-.48,4.25,.5,false));g.add(pm(gS(.06,6,4),mc(0xf2d04a,.6),-.48,4.25,.62,false))}
    else if(o.prop==='liuto'){var lu=new T.Group();lu.position.set(-.5,2.9,1.0);lu.rotation.z=.9;g.add(lu);var lb=pm(gS(.55,14,10),mc(0x9a6a2a,.5),0,0,0);lb.scale.set(1,1.25,.45);lu.add(lb);lu.add(pm(gB(.16,1.3,.1),mc(0x3a2412,.6),0,1.2,0));lu.add(pm(GEO('lucirc',function(){return new T.CircleGeometry(.16,12)}),mc(0x1a0f08,.9),0,.1,.26,false))}
    else if(o.prop==='boccale'){g.add(pm(gC(.24,.21,.5,14),mc(0x8d8f94,.35,.85),R0.x,R0.y+.25,R0.z+.1));g.add(pm(gC(.21,.21,.08,14),mc(0xf1e6c8,.9),R0.x,R0.y+.52,R0.z+.1,false))}
    else if(o.prop==='libro'){var bk=pm(gB(.55,.75,.18),mc(0x6a1a2a,.7),L0.x,L0.y+.15,L0.z+.15);bk.rotation.y=.4;g.add(bk);var pg=pm(gB(.5,.7,.14),mc(0xf0e6d0,.9),L0.x+.04,L0.y+.15,L0.z+.18,false);pg.rotation.y=.4;g.add(pg)}
    else if(o.prop==='spada'){var sw=new T.Group();sw.position.copy(R0);sw.rotation.x=.25;g.add(sw);sw.add(pm(gB(.1,1.9,.03),steel,0,1.15,0));sw.add(pm(gB(.5,.08,.1),gold2,0,.2,0));sw.add(pm(gC(.045,.045,.35,6),mc(0x3a2412,.6),0,0,0))}
    else if(o.prop==='lanterna'){var ln=new T.Group();ln.position.set(L0.x,L0.y-.45,L0.z+.15);g.add(ln);ln.add(pm(gB(.32,.42,.32),mc(0x1b1a1d,.45,.85),0,0,0));ln.add(pm(gB(.24,.32,.24),new T.MeshBasicMaterial({color:new T.Color(2.4,1.6,.6)}),0,0,0,false));ln.add(pm(gT(.12,.02,4,10,PI),mc(0x1b1a1d,.45,.85),0,.3,0,false))}
    return g}
};
var FIGKEYS={hair:['hair'],beard:['beard'],eyes:['face'],brows:['face'],mouth:['face'],nose:['face'],ears:['face'],blush:['face'],freckles:['face'],glasses:['face'],jewel:['face'],head:['head'],collar:['collar'],prop:['prop'],outfit:['outfit'],cape:['cape']};
var FIGCOL={robe:'robe',skin:'skin',hairc:'hair',hatc:'hat',collarc:'collar',beltc:'belt',capec:'cape'};
function figScale(F){var b=BODYS[F.o.body]||BODYS.normale,h=HEIGHTS[F.o.height]||1;F.root.scale.set(b[0],h*b[1],b[0])}
function figure(o,own){
  o=normFig(o);
  function MM(c,r){return own?new T.MeshStandardMaterial({color:c,roughness:r}):mc(c,r)}
  var X={robe:MM(o.robe,.88),skin:MM(o.skin,.55),hair:MM(o.hairc||0x2a1a10,.95),hat:MM(o.hatc||0x2a1a10,.8),collar:MM(o.collarc||0xcfc2a2,.9),belt:MM(o.beltc||0x1a0f09,.6),cape:own?new T.MeshStandardMaterial({color:o.capec||0x6a1a2a,roughness:.85,side:T.DoubleSide}):new T.MeshStandardMaterial({color:o.capec||0x6a1a2a,roughness:.85,side:T.DoubleSide})};
  var g=new T.Group(),r=new T.Group();g.add(r);
  [-1,1].forEach(function(q){r.add(pm(gS(.34,14,10),X.robe,q*.95,4.0,0))});
  var head=pm(gS(.52,26,20),X.skin,0,5.05,.08);head.scale.set(.92,1.06,.96);r.add(head);
  var sh=[new T.Vector3(.95,4.0,0),new T.Vector3(-.95,4.0,0)],el=[new T.Vector3(1.35,3.1,.55),new T.Vector3(-1.35,3.1,.55)],hd=[new T.Vector3(.95,3.3,1.15),new T.Vector3(-.95,3.3,1.15)];
  for(var i=0;i<2;i++){r.add(cylBetween(sh[i],el[i],.24,X.robe));r.add(cylBetween(el[i],hd[i],.2,X.robe));r.add(pm(gS(.22,12,10),X.skin,hd[i].x,hd[i].y,hd[i].z))}
  var P={};Object.keys(FIGPART).forEach(function(k){P[k]=FIGPART[k](o,X);r.add(P[k])});
  g.userData.fig={o:o,X:X,P:P,own:!!own,root:r};figScale(g.userData.fig);
  return g;
}
/* cambia un solo attributo senza ricostruire il pupazzo */
function updateFigure(g,field,val){
  var F=g.userData.fig;if(!F)return false;F.o[field]=val;
  if(field==='body'||field==='height'){figScale(F);return true}
  if(FIGCOL[field]){if(!F.own)return false;F.X[FIGCOL[field]].color.setHex(val);return true}
  (FIGKEYS[field]||[]).forEach(function(k){var old=F.P[k],nw=FIGPART[k](F.o,F.X);F.root.remove(old);F.root.add(nw);F.P[k]=nw});
  return true;
}


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

var TABLE_R=3.4,TABLE_Y=2.53,ROOM='K7QM';

/* ================= utilità condivise ================= */

function rep(t,x,y){var c=t.clone();c.needsUpdate=true;c.repeat.set(x,y);return c}
function box(w,h,d,m,x,y,z,cast){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,cast)}
function lathe(p,seg){return new T.LatheGeometry(p.map(function(a){return new T.Vector2(a[0],a[1])}),seg||24)}
var glowT=new T.CanvasTexture(spriteCanvas([[0,'rgba(255,230,170,1)'],[.25,'rgba(255,190,100,.55)'],[1,'rgba(255,160,60,0)']]));
function newS(){return {g:new T.Group(),hit:[],tags:[],flick:[],items:[],fires:[],bg:0x07060d,fog:.016,exp:1,cam:{az:PI/4,el:.7,tx:0,ty:2,tz:0,fitW:16},tick:null}}
function glowSpr(S,x,y,z,s,op){var sp=new T.Sprite(new T.SpriteMaterial({map:glowT,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:op==null?1:op}));sp.position.set(x,y,z);sp.scale.set(s,s,1);S.g.add(sp);return sp}
function plight(S,x,y,z,col,int,dist,fl){var l=new T.PointLight(col,int,dist,1.6);l.position.set(x,y,z);S.g.add(l);if(fl!==0)S.flick.push({l:l,b:int,p:Math.random()*6,a:fl||.08});return l}
function addTag(S,pos,html,cls){var d=document.createElement('div');d.className='tag'+(cls?' '+cls:'');d.innerHTML=html;(opts.tagsEl||$('tags')).appendChild(d);var o={pos:pos.clone(),el:d};S.tags.push(o);return o}
function signTex(lines,w,h,o){
  o=o||{};var c=mk(w,h),g=c.getContext('2d'),n=lines.length;
  g.drawImage(wood(w,h,o.bg||'#3a2314',{lines:140,knots:1}),0,0);
  g.strokeStyle=o.bd||'#9a6a3a';g.lineWidth=h*.035;g.strokeRect(h*.05,h*.05,w-h*.1,h-h*.1);
  g.textAlign='center';g.textBaseline='middle';
  lines.forEach(function(s,i){var fs=(o.fs||h/(n+.9))*(i?(o.f2||.6):1);g.font='700 '+fs+'px "Alegreya SC",Georgia,serif';g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=5;g.shadowOffsetY=3;g.fillStyle=i?(o.fg2||'#e8d8b0'):(o.fg||'#ffb23e');g.fillText(s,w/2,h*(i+1)/(n+1))});
  return tex(c,1,1);
}
var FIG=[
  {robe:0x1c2f4d,hat:'brim',hatc:0x121c30,skin:0xf0c4a0},{robe:0x3d1a17,hat:'hood',hatc:0x24130c,skin:0xd9a374},
  {robe:0x23402e,hat:'bald',hatc:0x2a1a10,skin:0xe3b48c},{robe:0x4a3a1c,hat:'brim',hatc:0x2a2010,skin:0xc98f64},
  {robe:0x3a2a48,hat:'hood',hatc:0x1e1428,skin:0xf0c4a0},{robe:0x5a2a1a,hat:'bald',hatc:0x1a1008,skin:0xd9a374},
  {robe:0x9a3a1c,head:'brim',hatc:0x4a2410,skin:0xf0c4a0,hair:'short',hairc:0x3a2414,beard:'none',glasses:'none',blush:false,freckles:false,collar:'gorgiera',collarc:0xcfc2a2,beltc:0x1a0f09,prop:'none',body:'normale',height:'medio',eyes:'tondi',brows:'sottili',mouth:'sorriso',nose:'tondo',ears:'normali',jewel:'none',outfit:'veste',cape:'none',capec:0x6a1a2a}
];
function person(S,i,x,y,z,face,sc){var f=figure(FIG[i===6?6:((i%6)+6)%6],i===6);if(i===6){var rg=mesh(new T.TorusGeometry(1.7,.09,8,40),std({color:0x000000,emissive:0xffb23e,emissiveIntensity:1.8}),0,.05,0,false,false);rg.rotation.x=PI/2;f.add(rg)}f.position.set(x,y,z);f.rotation.y=face;f.scale.setScalar(sc);S.g.add(f);return f}
function faceTo(x,z,tx,tz){return Math.atan2(tx-x,tz-z)}

/* stanza ad angolo: pavimento + due pareti (a -x e -z) */
function hall(S,W,D,H){
  var ft=rep(floorTex,W/16,D/16);
  var fl=S.floor=mesh(new T.PlaneGeometry(W,D),std({map:ft,bumpMap:ft,bumpScale:.8,roughness:.62}),0,0,0,false,true);fl.rotation.x=-PI/2;S.g.add(fl);
  var t1=rep(wallTex,W/8.5,H/6);S.g.add(mesh(new T.PlaneGeometry(W,H),std({map:t1,bumpMap:t1,bumpScale:.9,roughness:.85}),0,H/2,-D/2,false,true));
  var t2=rep(wallTex,D/8.5,H/6),wb=mesh(new T.PlaneGeometry(D,H),std({map:t2,bumpMap:t2,bumpScale:.9,roughness:.85}),-W/2,H/2,0,false,true);wb.rotation.y=PI/2;S.g.add(wb);
  S.g.add(box(W,.7,.35,M.dark,0,.35,-D/2+.17));S.g.add(box(.35,.7,D,M.dark,-W/2+.17,.35,0));
  var hm=new T.HemisphereLight(0x2b3a72,0x1a0f08,.5);S.g.add(hm);
  var moon=new T.DirectionalLight(0x7b8fe0,.4);moon.position.set(8,14,6);S.g.add(moon);
}
function fireplace(S,W,fz){
  var wx=-W/2,g=S.g;
  // nessuna faccia complanare: pilastri dentro la cappa, cappa sporgente, mensola staccata dal muro
  g.add(box(1.7,6.3,1.9,M.stone,wx+.97,3.15,fz-2.6));g.add(box(1.7,6.3,1.9,M.stone,wx+.97,3.15,fz+2.6));
  g.add(box(1.84,1.8,7.34,M.stone,wx+1.02,5.68,fz));g.add(box(2.4,.45,8.2,M.dark,wx+1.33,6.86,fz));g.add(box(2.3,.33,7.5,M.stone,wx+1.2,.165,fz));
  var back=mesh(new T.PlaneGeometry(3.4,4.6),std({color:0x0c0705,roughness:1}),wx+.14,2.4,fz,false,true);back.rotation.y=PI/2;g.add(back);
  S.hearth=makeFire(S,wx+1.25,.33,fz,1.15,{kind:'stack',int:1.0,dist:16});
  plight(S,wx+2.2,2.2,fz,0xff8a3a,1.2,22,.1);
}
var barrelG=lathe([[0,0],[1.1,0],[1.35,.7],[1.5,1.6],[1.35,2.5],[1.1,3.2],[0,3.2]],22);
function barrel(S,x,z,sc){var b=mesh(barrelG,M.dark,x,0,z);b.scale.setScalar(sc);S.g.add(b);[.5,1.0,2.5,2.9].forEach(function(h,k){var r=[1.18,1.42,1.38,1.16][k]*sc;var t=mesh(new T.TorusGeometry(r,.05*sc,8,40),M.iron,x,h*sc,z,true,false);t.rotation.x=PI/2;S.g.add(t)});return b}
var bottleG=lathe([[0,0],[.34,0],[.36,.2],[.36,1.0],[.3,1.35],[.14,1.6],[.13,2.0],[.16,2.05],[.16,2.2],[0,2.2]],16);
function shelfBottles(S,x,y,z,n,w){
  S.g.add(box(w,.3,1.2,M.dark,x,y,z));
  for(var i=0;i<n;i++){var bt=mesh(bottleG,i%2?M.glass2:M.glass,x-w/2+.8+i*(w-1.6)/Math.max(1,n-1),y+.15,z);bt.scale.setScalar(.85+Math.random()*.3);S.g.add(bt)}
}
var shadeG=lathe([[.12,0],[.5,-.15],[1.2,-.9],[1.5,-1.2],[1.5,-1.28],[1.4,-1.28],[1.1,-1.0],[.4,-.28],[.12,-.2]],24);
function pendant(S,x,y,z,sc,col,int,dist){
  var g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(sc);S.g.add(g);
  g.add(mesh(new T.CylinderGeometry(.04,.04,14,6),M.iron,0,7,0,false,false));
  g.add(mesh(shadeG,std({color:0x1d3a2c,roughness:.4,metalness:.5,envMap:envTex,envMapIntensity:.6,side:T.DoubleSide}),0,0,0,false,false));
  var bl=new T.Mesh(new T.SphereGeometry(.34,14,10),new T.MeshBasicMaterial({color:new T.Color(3,2.2,1.2)}));bl.position.y=-.65;g.add(bl);
  var gs=glowSpr(S,x,y-.7*sc,z,5.2*sc,.9);
  var l=plight(S,x,y-1.6*sc,z,col||0xffc477,int||1.3,dist||15,.04);l.userData.g=g;l.userData.s=gs;return l;
}
var feltCache={};
function feltMat(hex){
  if(feltCache[hex])return feltCache[hex];
  var c=mk(256,256),g=c.getContext('2d');g.fillStyle=hex;g.fillRect(0,0,256,256);
  for(var i=0;i<3000;i++){var a=Math.random()*6.28,l=2+Math.random()*6,x=Math.random()*256,y=Math.random()*256;g.strokeStyle=Math.random()<.5?'rgba(255,255,255,'+Math.random()*.07+')':'rgba(0,0,0,'+Math.random()*.16+')';g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  grain(g,256,256,18);var t=tex(c,4,4);
  return feltCache[hex]=std({map:t,bumpMap:t,bumpScale:.3,roughness:1});
}
var pedG=lathe([[0,0],[1.7,0],[1.75,.18],[1.2,.3],[.7,.55],[.55,.9],[.78,1.3],[.62,1.7],[.6,2.2],[1.4,2.3],[0,2.3]],28);
var cardBackM=std({color:0x7a1f2b,roughness:.7});
function chair(g,phi,r){
  var o=new T.Vector3(Math.cos(phi),0,Math.sin(phi)),c=new T.Group();c.position.copy(o).multiplyScalar(r);c.rotation.y=Math.atan2(-o.x,-o.z);
  c.add(box(1.4,.16,1.4,M.dark,0,1.45,0));c.add(box(1.4,1.7,.16,M.dark,0,2.35,-.7));
  [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]].forEach(function(p){c.add(box(.14,1.4,.14,M.dark,p[0],.7,p[1]))});
  g.add(c);
}
/* tavolo completo con seduti: x,z posizione, sc scala, o:{felt,seats:[idx|-1],base} */
function cluster(S,x,z,sc,o){
  var g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(sc);S.g.add(g);
  g.add(mesh(pedG,M.dark,0,0,0));
  var top=mesh(new T.CylinderGeometry(TABLE_R,TABLE_R,.26,56),M.tableEdge,0,TABLE_Y-.14,0);g.add(top);
  var fm=feltMat(o.felt||'#21704c');
  var felt=mesh(new T.CircleGeometry(TABLE_R-.5,56),fm,0,TABLE_Y,0,false,true);felt.rotation.x=-PI/2;g.add(felt);
  var rim=mesh(new T.TorusGeometry(TABLE_R-.3,.3,14,72),M.leather,0,TABLE_Y+.04,0);rim.rotation.x=PI/2;rim.scale.z=.7;g.add(rim);
  var ring=mesh(new T.TorusGeometry(TABLE_R-.52,.022,8,72),M.gold,0,TABLE_Y+.03,0,false,false);ring.rotation.x=PI/2;g.add(ring);
  // carte sul feltro
  for(var k=0;k<(o.cards===false?0:4);k++){var cd=box(.8,.03,1.25,cardBackM,(k-1.5)*.62,TABLE_Y+.03+k*.045,(k%2?.5:-.4)+Math.random()*.2);cd.rotation.y=Math.random()*1.2-.6;g.add(cd)}
  var seats=o.seats||[0,-1,1,-1],n=seats.length,base=o.base==null?PI/2:o.base;
  seats.forEach(function(s,i){
    var phi=base+i*2*PI/n;
    if(s<0){chair(g,phi,TABLE_R+1.5);return}
    var out=new T.Vector3(Math.cos(phi),0,Math.sin(phi)),f=figure(FIG[s%6]);f.position.copy(out).multiplyScalar(TABLE_R+1.5);f.rotation.y=Math.atan2(-out.x,-out.z);g.add(f);
  });
  // anello di selezione
  var sel=mesh(new T.TorusGeometry(TABLE_R+3.6,.1,8,64),std({color:0x000000,emissive:0xffb23e,emissiveIntensity:1.6}),0,.06,0,false,false);sel.rotation.x=PI/2;sel.visible=false;g.add(sel);
  top.userData.sel=sel;felt.userData.sel=sel;
  return {g:g,top:top,felt:felt,sel:sel};
}

/* pianta in vaso per riempire gli angoli */
var potG=lathe([[0,0],[.55,0],[.62,.12],[.7,1.1],[.8,1.2],[.8,1.32],[.66,1.32],[.6,1.2],[0,1.2]],18);
var leafMs=[0x2f6a2a,0x3a7a30,0x26582a].map(function(c){return std({color:c,roughness:.75,flatShading:true,side:T.DoubleSide})});
function plant(S,x,z,sc){
  var p=new T.Group();p.position.set(x,0,z);p.scale.setScalar(sc||1);S.g.add(p);
  p.add(mesh(potG,std({color:0xa8572e,roughness:.85}),0,0,0));
  var soil=mesh(new T.CircleGeometry(.62,16),std({color:0x2a1a0e,roughness:1}),0,1.22,0,false,true);soil.rotation.x=-PI/2;p.add(soil);
  var lg=new T.SphereGeometry(.5,8,6);
  for(var i=0;i<14;i++){var a=i/14*PI*2+(i%3)*.3,t=.4+(i%4)*.18,l=mesh(lg,leafMs[i%3],Math.cos(a)*.35,1.6+t*1.2,Math.sin(a)*.35);
    l.scale.set(.32,.09,1.25);l.rotation.y=-a+PI/2;l.rotation.x=-.9+t*.6;l.position.x+=Math.cos(a)*.5;l.position.z+=Math.sin(a)*.5;p.add(l)}
  for(i=0;i<5;i++){var a2=i/5*PI*2,st=mesh(new T.CylinderGeometry(.03,.04,1.8,5),leafMs[1],Math.cos(a2)*.18,2.1,Math.sin(a2)*.18);st.rotation.z=Math.cos(a2)*.25;st.rotation.x=Math.sin(a2)*.25;p.add(st);
    var top=mesh(lg,leafMs[(i+1)%3],Math.cos(a2)*.5,3.0,Math.sin(a2)*.5);top.scale.set(.3,.08,1.0);top.rotation.y=-a2;top.rotation.x=-.5;p.add(top)}
  return p;
}

function liveTex(w,h){var c=mk(w,h),t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=ANIS;return {c:c,t:t}}
function lantern(S,x,y,z,int){
  S.g.add(box(.14,.14,1.1,M.iron,x,y+.7,z-.45));
  S.g.add(box(.55,.9,.55,M.iron,x,y,z));
  S.g.add(mesh(new T.BoxGeometry(.4,.7,.4),new T.MeshBasicMaterial({color:new T.Color(3,1.9,.8)}),x,y,z,false,false));
  glowSpr(S,x,y,z,3.4,.8);
  return plight(S,x,y,z+.4,0xffb060,int||1.2,13,.12);
}
function boxTex(i){
  var c=mk(256,256),g=c.getContext('2d'),G=GAMES[i];i=G.m;
  g.fillStyle=G.c;g.fillRect(0,0,256,256);
  var gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=gr;g.fillRect(0,0,256,256);
  grain(g,256,256,22);
  g.strokeStyle='#d8b062';g.lineWidth=8;g.strokeRect(12,12,232,232);g.lineWidth=2;g.strokeRect(24,24,208,208);
  g.fillStyle='#d8b062';g.strokeStyle='#d8b062';g.lineWidth=7;
  var cx=128,cy=110;
  if(i===0){g.beginPath();g.moveTo(80,150);g.lineTo(80,80);g.lineTo(104,110);g.lineTo(128,66);g.lineTo(152,110);g.lineTo(176,80);g.lineTo(176,150);g.closePath();g.fill()}
  else if(i===10||i===11){g.font='700 46px "Alegreya SC",Georgia,serif';g.textAlign='center';g.fillStyle=i===11?'#ff8a7a':'#d8b062';g.fillText('1 · 2 · 3',cx,cy+14)}
  else if(i===12){g.beginPath();g.arc(cx,cy-10,26,0,7);g.fill();for(var w=0;w<5;w++){g.beginPath();g.moveTo(70+w*30,160);g.lineTo(76+w*30,112);g.stroke()}}
  else if(i===13){g.beginPath();for(var h=0;h<6;h++){var an=h*PI/3;g.lineTo(cx+44*Math.cos(an),cy+44*Math.sin(an))}g.closePath();g.stroke();g.beginPath();g.arc(cx,cy,12,0,7);g.fill()}
  else if(i===14){g.strokeRect(cx-38,cy-38,76,76);[[-18,-18],[18,18],[0,0],[18,-18],[-18,18]].forEach(function(p){g.beginPath();g.arc(cx+p[0],cy+p[1],7,0,7);g.fill()})}
  else if(i===15){g.beginPath();g.moveTo(cx,cy-52);g.lineTo(cx+9,cy+18);g.lineTo(cx-9,cy+18);g.closePath();g.fill();g.fillRect(cx-28,cy+18,56,9);g.fillRect(cx-5,cy+27,10,24)}
  else if(i===9){for(var q2=0;q2<3;q2++){g.save();g.translate(cx-40+q2*40,cy);g.rotate((q2-1)*.3);g.strokeRect(-18,-30,36,60);g.restore()}}
  else if(i===1){g.beginPath();g.arc(cx,cy,42,0,7);g.stroke();g.beginPath();g.arc(cx,cy,24,0,7);g.fill()}
  else if(i===2){g.save();g.translate(cx,cy);g.rotate(-.25);g.strokeRect(-48,-30,50,70);g.rotate(.5);g.strokeRect(-2,-34,50,70);g.restore()}
  else if(i===3){for(var k=0;k<5;k++){g.beginPath();g.arc(70+k*29,cy,13,0,7);g.fill()}}
  else if(i===4){g.beginPath();g.moveTo(88,150);g.lineTo(168,70);g.stroke();g.beginPath();g.moveTo(140,62);g.quadraticCurveTo(190,70,184,118);g.stroke()}
  else if(i===5){for(var a=0;a<3;a++)for(var b=0;b<3;b++){g.fillStyle=(a+b)%2?'#d8b062':'rgba(216,176,98,.35)';g.fillRect(84+a*32,64+b*32,28,28)}}
  else if(i===6){g.beginPath();g.ellipse(cx,cy+10,54,30,0,0,7);g.fill();g.strokeStyle='#d8b062';g.beginPath();g.moveTo(60,150);g.quadraticCurveTo(90,136,128,150);g.quadraticCurveTo(166,164,196,150);g.stroke()}
  else{for(var q=0;q<4;q++){g.strokeRect(58+q*36,86,30,46)}}
  g.fillStyle='#f6e8c4';g.textAlign='center';g.font='700 38px "Alegreya SC",Georgia,serif';g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=5;g.fillText((G.l||G.t).toUpperCase(),128,206,200);
  return tex(c,1,1);
}
return {T:T,R:R,mk:mk,grain:grain,tex:tex,rep:rep,wood:wood,spriteCanvas:spriteCanvas,flameCanvas:flameCanvas,signTex:signTex,boxTex:boxTex,liveTex:liveTex,
 M:M,std:std,envTex:envTex,floorTex:floorTex,wallTex:wallTex,tableWood:tableWood,darkWood:darkWood,stoneT:stoneT,rugT:rugT,feltMat:feltMat,mc:mc,GEO:GEO,
 mesh:mesh,box:box,lathe:lathe,newS:newS,glowSpr:glowSpr,plight:plight,addTag:addTag,faceTo:faceTo,
 figure:figure,updateFigure:updateFigure,normFig:normFig,person:person,FIG:FIG,hall:hall,fireplace:fireplace,barrel:barrel,shelfBottles:shelfBottles,pendant:pendant,chair:chair,plant:plant,lantern:lantern,
 makeFire:makeFire,logMesh:logMesh,fireTextures:fireTextures,mergeStatic:mergeStatic,
 geo:{barrel:barrelG,bottle:bottleG,shade:shadeG},TABLE_Y:TABLE_Y,GAMES:GAMES,CATS:CATS};
};
