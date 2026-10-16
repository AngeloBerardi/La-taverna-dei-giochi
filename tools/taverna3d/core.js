<script>
(function(){
'use strict';
var T=window.THREE;
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var R=mulberry32(7);
var rnd=function(a,b){return a+Math.random()*(b-a)};
var mk=function(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c};
var L=function(a,b,t){return a+(b-a)*t};
var $=function(id){return document.getElementById(id)};
var stage=$('stage'),app=$('app');

/* ---------- renderer ---------- */
var renderer;
try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(e){console.error("GLERR "+e);$("fallback").style.display="flex";return}
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);
var scene=new T.Scene();
scene.background=new T.Color(0x07060d);
scene.fog=new T.FogExp2(0x07060d,0.016);
var camera=new T.PerspectiveCamera(30,1,1,200);
var ANIS=Math.min(8,renderer.capabilities.getMaxAnisotropy());

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
