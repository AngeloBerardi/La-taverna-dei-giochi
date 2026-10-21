/* ---- La Taverna 3D: ingresso, locanda e boschetto (estetica di base della lobby) ----
   Solo aspetto e interazioni della lobby: legge stanza, membri, ospiti, chat ed emote dallo stato dell'app
   e usa le sue azioni (setname, addguest, join, copy, chatsend, emo, rules…) e startGame per avviare le partite.
   Motori, viste dei giochi e rete non sono toccati. Senza WebGL o se il 3D è troppo lento si torna al falò (modalità semplice).
   Generato da tools/taverna3d/mk.py (python3 tools/taverna3d/mk.py): le parti 3D vengono da lì. */
const L3D=(()=>{
 const A={
  R:()=>R,ME:()=>ME,ui:()=>ui,members:()=>members(),seats:()=>lobbySeats(),games:()=>GAMES,
  info:g=>tvInfo(g),box:id=>(typeof TVB!=='undefined'&&TVB[id])||null,cat:k=>TVC[k],avc:()=>AVC,avs:()=>AVS,
  ST:(k,v)=>ST(k,v),Snd:()=>Snd,inv:()=>INV,defOpts:id=>defOpts(id),
  busy:()=>!!(R.on&&R.doc&&R.doc.phase==='play'),
  canResume:()=>{if(R.on)return false;try{return!!(JSON.parse(ST('rg-off')||'null')||{}).game}catch(e){return false}},
  save:()=>saveMine(),savePos:()=>savePos(),start:(id,o)=>startGame(id,null,o),
  act:(a,v)=>{const b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.a=a;if(v!=null)b.dataset.v=v;(A.root||document.body).appendChild(b);b.click();b.remove()},
  duck:v=>{if(Snd.duck)Snd.duck(v)},audioKick:()=>{if(Snd.mus)Snd.start()},
  fallback:msg=>{state='fail';ui.lobby='iso';ST('rg-lb','iso');ui.err=msg;hide();render()}
 };
 let E=null,state='idle',wrap=null;
 const hasGL=()=>{try{const c=document.createElement('canvas');return!!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch(e){return false}};
 function boot(){
  if(state!=='idle')return state==='ready';
  if(!window.THREE||!hasGL()){state='fail';return false}
  try{
   const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Alegreya+SC:wght@500;700&family=Alegreya+Sans:wght@400;500;700&family=IM+Fell+English:ital@0;1&display=swap';document.head.appendChild(l);
   wrap=document.createElement('div');wrap.id='l3d';wrap.innerHTML=`<div id="l3dapp">
  <div id="stage"></div>
  <div class="vig"></div>
  <div id="tags"></div>
  <div class="hudr"><button type="button" class="hb" data-a="mus" aria-label="Musica sì/no">♪</button><button type="button" class="hb" data-a="cfg" aria-label="Impostazioni">⚙</button></div>
  <div class="panel" id="login">
    <label for="myname" id="lq">Benvenuto! Come ti chiami?</label>
    <input id="myname" maxlength="14" placeholder="Il tuo nome" autocomplete="nickname" autocapitalize="words" spellcheck="false">
    <button class="btn" id="enter" type="button">Siediti</button>
  </div>
  <div id="chat"><div id="clog" aria-live="polite"></div><div id="cemo"><button type="button" data-a="emo" data-v="😀|m">😀</button><button type="button" data-a="emo" data-v="😂|m">😂</button><button type="button" data-a="emo" data-v="😍|m">😍</button><button type="button" data-a="emo" data-v="👍|m">👍</button><button type="button" data-a="emo" data-v="🎉|m">🎉</button><button type="button" data-a="emo" data-v="🍻|m">🍻</button><button type="button" data-a="emo" data-v="😡|m">😡</button><button type="button" data-a="emo" data-v="🔥|m">🔥</button></div><div id="cbar"><input id="cin" maxlength="120" placeholder="Scrivi alla stanza" autocomplete="off" aria-label="Messaggio"><button class="btn" id="csend" type="button">Invia</button></div></div>
  <div id="sbar"><span id="sinfo"></span><button class="btn ghost" id="rtog" type="button" aria-label="La stanza: persone, ospiti, inviti">🚪</button><button class="btn ghost" id="ctog" type="button" aria-label="Apri la chat">💬</button><button class="btn" id="open" type="button">Giochi</button></div>
  <div id="sim"><span>Ospiti al tavolo<b id="simn">0</b></span><button type="button" id="sim-m" aria-label="Togli un ospite">−</button><button type="button" id="sim-p" aria-label="Aggiungi un ospite">+</button></div>
  <div class="ov" id="glist" aria-hidden="true"><div class="hd"><b>Lo scaffale</b><button class="x" id="gl-x" type="button">Chiudi</button></div><input id="glq" placeholder="Cerca un gioco" autocomplete="off" aria-label="Cerca un gioco"><div id="gl-grid"></div></div>
  <div id="zpg"></div>
  <div class="ov" id="gpage" aria-hidden="true"><div class="hd"><b id="gp-k"></b><button class="x" id="gp-x" type="button">Torna nella locanda</button></div>
    <div class="gp"><img id="gp-img" alt=""><h2 id="gp-t"></h2><div class="meta" id="gp-m"></div><p id="gp-d"></p><div id="gp-o"></div>
    <div class="row"><button class="btn ghost" id="gp-v" type="button">Regole</button><button class="btn" id="gp-go" type="button">Proponi al tavolo</button></div></div></div>
  <div id="zbar"></div>
  <div id="vote" role="dialog" aria-label="Proposta di gioco"></div>
  <div class="ov" id="roomp" aria-hidden="true"><div class="rp"><div class="rph"><h3>La stanza</h3><button class="x" id="rp-x" type="button">Chiudi</button></div><div id="rp-body"></div></div></div>
  <div class="panel" id="juke" role="dialog" aria-label="Jukebox"></div>
  <div class="panel" id="cust" role="dialog" aria-label="Personalizza il pupazzo"></div>
  <div id="l3dtoast"></div>
  <div id="fade"></div>
</div>`;document.body.appendChild(wrap);A.root=wrap.querySelector('#l3dapp');
   E=(function(A){
'use strict';
var T=window.THREE;
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var R=mulberry32(7);
var rnd=function(a,b){return a+Math.random()*(b-a)};
var mk=function(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c};
var L=function(a,b,t){return a+(b-a)*t};
var $=function(id){return document.getElementById(id)};
var app=A.root,stage=$('stage');
var renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
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
var camera=new T.PerspectiveCamera(30,1,4,300);
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
var PI=Math.PI;
function rep(t,x,y){var c=t.clone();c.needsUpdate=true;c.repeat.set(x,y);return c}
function box(w,h,d,m,x,y,z,cast){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,cast)}
function lathe(p,seg){return new T.LatheGeometry(p.map(function(a){return new T.Vector2(a[0],a[1])}),seg||24)}
var glowT=new T.CanvasTexture(spriteCanvas([[0,'rgba(255,230,170,1)'],[.25,'rgba(255,190,100,.55)'],[1,'rgba(255,160,60,0)']]));
function newS(){return {g:new T.Group(),hit:[],tags:[],flick:[],items:[],fires:[],bg:0x07060d,fog:.016,exp:1,cam:{az:PI/4,el:.7,tx:0,ty:2,tz:0,fitW:16},tick:null}}
function glowSpr(S,x,y,z,s,op){var sp=new T.Sprite(new T.SpriteMaterial({map:glowT,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:op==null?1:op}));sp.position.set(x,y,z);sp.scale.set(s,s,1);S.g.add(sp);return sp}
function plight(S,x,y,z,col,int,dist,fl){var l=new T.PointLight(col,int,dist,1.6);l.position.set(x,y,z);S.g.add(l);if(fl!==0)S.flick.push({l:l,b:int,p:Math.random()*6,a:fl||.08});return l}
function addTag(S,pos,html,cls){var d=document.createElement('div');d.className='tag'+(cls?' '+cls:'');d.innerHTML=html;$('tags').appendChild(d);var o={pos:pos.clone(),el:d};S.tags.push(o);return o}
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
  g.fillStyle='#2a1a10';g.textAlign='left';g.font='700 40px "IM Fell English",Georgia,serif';g.fillText('Registro degli ospiti',34,76);
  g.font='italic 36px "IM Fell English",Georgia,serif';g.fillStyle='rgba(42,26,16,.7)';
  ['Anselmo','Giulia','Marco'].forEach(function(s,i){g.save();g.translate(44,122+i*52);g.rotate(-.01*(i+1));g.fillText(s,0,0);g.restore()});
  var nm=NAME||'';g.fillStyle='#10101e';g.font='italic 700 42px "IM Fell English",Georgia,serif';g.fillText(nm,44,122+3*52);
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
  g.font='italic 26px "IM Fell English",Georgia,serif';g.fillStyle='rgba(42,26,14,.9)';g.fillText('Taverna dei Giochi · ospite n. 37',256,140);g.textAlign='left';g.font='600 26px "Alegreya SC",Georgia,serif';g.fillStyle='rgba(42,26,14,.85)';g.fillText('Nome:',70,238);g.textAlign='center';
  g.strokeStyle='rgba(74,46,28,.5)';g.lineWidth=2;g.beginPath();g.moveTo(90,300);g.lineTo(422,300);g.stroke();
  var nm=NAME||'';g.fillStyle='#08070f';g.font='italic 700 '+(NAME.length>9?60:76)+'px "IM Fell English",Georgia,serif';g.fillText(nm,256,286,380);
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


/* ================= catalogo: i giochi veri dell'app ================= */
var CATN={classici:'Classici',strategia:'Strategia',squadra:'Squadra e risate'};
var ICON={regicide:0,briscola:1,burraco:2,gang:3,saboteur:4,azul:5,island:6,machiavelli:7,scopa:9,mind:10,mindx:11,harvest:12,valle:13,discesa:14,scoundrel:15,uno:16,pets:17,catan:18,kittens:19,perudo:20};
function lum(h){var n=parseInt(h.slice(1),16);return(.3*(n>>16&255)+.59*(n>>8&255)+.11*(n&255))/255}
var GAMES=A.games().map(function(g){var I=A.info(g),b=A.box(g.id);var c=b?b.c[0]:'#5a3a24';if(lum(c)>.62)c=b?b.c[1]:'#5a3a24';if(lum(c)>.62)c='#5a3a24';
  return{id:g.id,g:g,t:g.name,l:I[1].length>13?I[1].slice(0,13):I[1],s:g.desc,r:g.range,k:CATN[I[0]]||I[0],ck:I[0],c:c,v:0,m:ICON[g.id]!=null?ICON[g.id]:(g.id.length%16)}});
var CATS=[];['classici','strategia','squadra'].concat(GAMES.map(function(G){return G.ck}).filter(function(k,i,a){return!CATN[k]&&a.indexOf(k)===i})).forEach(function(k){
  if(GAMES.some(function(G){return G.ck===k}))CATS.push({k:CATN[k]||k,c:(A.cat(k)||{f:'#e8b83a'}).f})});
function boxTex(i){
  var c=mk(256,256),g=c.getContext('2d'),G=GAMES[i];i=G.m;
  g.fillStyle=G.c;g.fillRect(0,0,256,256);
  var gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.35)');g.fillStyle=gr;g.fillRect(0,0,256,256);
  grain(g,256,256,22);
  g.strokeStyle='#d8b062';g.lineWidth=8;g.strokeRect(12,12,232,232);g.lineWidth=2;g.strokeRect(24,24,208,208);
  g.fillStyle='#d8b062';g.strokeStyle='#d8b062';g.lineWidth=7;
  var cx=128,cy=110,k,a,b;
  if(i===0){g.beginPath();g.moveTo(80,150);g.lineTo(80,80);g.lineTo(104,110);g.lineTo(128,66);g.lineTo(152,110);g.lineTo(176,80);g.lineTo(176,150);g.closePath();g.fill()}
  else if(i===1){g.beginPath();g.arc(cx,cy,42,0,7);g.stroke();g.beginPath();g.arc(cx,cy,24,0,7);g.fill()}
  else if(i===2){g.save();g.translate(cx,cy);g.rotate(-.25);g.strokeRect(-48,-30,50,70);g.rotate(.5);g.strokeRect(-2,-34,50,70);g.restore()}
  else if(i===3){for(k=0;k<5;k++){g.beginPath();g.arc(70+k*29,cy,13,0,7);g.fill()}}
  else if(i===4){g.beginPath();g.moveTo(88,150);g.lineTo(168,70);g.stroke();g.beginPath();g.moveTo(140,62);g.quadraticCurveTo(190,70,184,118);g.stroke()}
  else if(i===5){for(a=0;a<3;a++)for(b=0;b<3;b++){g.fillStyle=(a+b)%2?'#d8b062':'rgba(216,176,98,.35)';g.fillRect(84+a*32,64+b*32,28,28)}}
  else if(i===6){g.beginPath();g.ellipse(cx,cy+10,54,30,0,0,7);g.fill();g.beginPath();g.moveTo(60,150);g.quadraticCurveTo(90,136,128,150);g.quadraticCurveTo(166,164,196,150);g.stroke()}
  else if(i===7){for(var q=0;q<4;q++){g.strokeRect(58+q*36,86,30,46)}}
  else if(i===9){for(var q2=0;q2<3;q2++){g.save();g.translate(cx-40+q2*40,cy);g.rotate((q2-1)*.3);g.strokeRect(-18,-30,36,60);g.restore()}}
  else if(i===10||i===11){g.font='700 46px "Alegreya SC",Georgia,serif';g.textAlign='center';g.fillStyle=i===11?'#ff8a7a':'#d8b062';g.fillText('1 · 2 · 3',cx,cy+14)}
  else if(i===12){g.beginPath();g.arc(cx,cy-10,26,0,7);g.fill();for(var w=0;w<5;w++){g.beginPath();g.moveTo(70+w*30,160);g.lineTo(76+w*30,112);g.stroke()}}
  else if(i===13||i===18){g.beginPath();for(var h=0;h<6;h++){var an=h*Math.PI/3+(i===18?Math.PI/6:0);g.lineTo(cx+44*Math.cos(an),cy+44*Math.sin(an))}g.closePath();g.stroke();g.beginPath();g.arc(cx,cy,12,0,7);g.fill()}
  else if(i===14||i===20){g.strokeRect(cx-38,cy-38,76,76);[[-18,-18],[18,18],[0,0],[18,-18],[-18,18]].forEach(function(p){g.beginPath();g.arc(cx+p[0],cy+p[1],7,0,7);g.fill()})}
  else if(i===15){g.beginPath();g.moveTo(cx,cy-52);g.lineTo(cx+9,cy+18);g.lineTo(cx-9,cy+18);g.closePath();g.fill();g.fillRect(cx-28,cy+18,56,9);g.fillRect(cx-5,cy+27,10,24)}
  else if(i===16){g.save();g.translate(cx,cy);g.rotate(-.5);g.beginPath();g.ellipse(0,0,52,30,0,0,7);g.stroke();g.font='700 34px "Alegreya SC",Georgia,serif';g.textAlign='center';g.fillText('1',0,12);g.restore()}
  else if(i===17||i===19){g.beginPath();g.arc(cx,cy+8,34,0,7);g.fill();g.beginPath();g.moveTo(cx-30,cy-10);g.lineTo(cx-22,cy-48);g.lineTo(cx-6,cy-24);g.moveTo(cx+30,cy-10);g.lineTo(cx+22,cy-48);g.lineTo(cx+6,cy-24);g.fill()}
  else{g.beginPath();g.arc(cx,cy,40,0,7);g.stroke()}
  g.fillStyle='#f6e8c4';g.textAlign='center';g.font='700 38px "Alegreya SC",Georgia,serif';g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=5;g.fillText((G.l||G.t).toUpperCase(),128,206,200);
  return tex(c,1,1);
}


/* ================= LOCANDA v2: scaffali per categoria, cose buffe, chat ================= */
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function openList(){
  var gr=$('gl-grid');
  if(!gr.children.length)CATS.forEach(function(C){
    var h=document.createElement('div');h.style.cssText='grid-column:1/-1;margin-top:8px;font:700 15px "Alegreya SC",Georgia,serif;letter-spacing:.08em;color:'+C.c;h.textContent=C.k.toUpperCase();gr.appendChild(h);
    GAMES.forEach(function(G,i){if(G.k!==C.k)return;var b=document.createElement('button');b.type='button';b.dataset.i=i;b.innerHTML='<img alt="" src="'+cover(i)+'"><span>'+esc(G.t)+'</span><small>'+G.r+(G.r==='1'?' giocatore':' giocatori')+'</small>';b.onclick=function(){openPage(i)};gr.appendChild(b)});
  });
  [].forEach.call(gr.querySelectorAll('button[data-i]'),function(b){var ok=okG(+b.dataset.i);b.style.opacity=ok?1:.42;b.querySelector('img').style.filter=ok?'':'grayscale(1)'});
  $('glist').classList.add('on');$('glist').setAttribute('aria-hidden','false');
}
/* ---- chat ---- */
function okFor(r,N){if(r.indexOf(' o ')>=0)return r.split(' o ').map(Number).indexOf(N)>=0;var p=r.split('–').map(Number);return p.length===1?N===p[0]:(N>=p[0]&&N<=p[1])}
var GREY=[];function greyTex(i){if(!GREY[i]){var src=boxTex(i).image,c=mk(256,256),x=c.getContext('2d');x.filter='grayscale(1) brightness(.55)';x.drawImage(src,0,0);if(x.filter!=='grayscale(1) brightness(.55)'){x.fillStyle='rgba(60,60,60,.65)';x.fillRect(0,0,256,256)}GREY[i]=tex(c,1,1)}return GREY[i]}
function curN(){return A.seats().length}
function openPage(i){
  var G=GAMES[i],N=curN(),ok=okFor(G.r,N);PAGE=i;
  $('gp-k').textContent=G.k;$('gp-img').src=cover(i);$('gp-img').alt='Scatola di '+G.t;$('gp-img').style.filter=ok?'':'grayscale(1) brightness(.6)';$('gp-t').textContent=G.t;
  $('gp-m').innerHTML='<span>'+G.r+(G.r==='1'?' giocatore':' giocatori')+'</span><span>'+G.k+'</span>'+(ok?'':'<span style="border-color:#c8434a;color:#ff9a8a">Non disponibile in '+N+'</span>');
  $('gp-d').textContent=G.s;$('gp-v').style.display='none';
  $('gp-go').disabled=!ok;$('gp-go').style.opacity=ok?1:.4;$('gp-go').textContent=ok?'Porta al tavolo':'Servono '+G.r;
  $('gpage').classList.add('on');$('gpage').setAttribute('aria-hidden','false');
}
$('gp-go').onclick=function(){if(PAGE<0)return;var i=PAGE;if(!okFor(GAMES[i].r,curN()))return;closePage();closeList();if(cur&&cur.propose)cur.propose(i,null);else if(cur&&cur.setGame)cur.setGame(i)};
function chatPush(name,text,cls){
  var d=document.createElement('div');d.className='cm'+(cls?' '+cls:'');d.innerHTML=(name?'<b>'+esc(name)+'</b>':'')+esc(text);
  var L=$('clog');L.appendChild(d);while(L.children.length>40)L.removeChild(L.firstChild);
  L.scrollTop=L.scrollHeight;setTimeout(function(){d.classList.add('old')},9000);
}
$('ctog').onclick=function(){var c=$('chat');c.classList.toggle('open');if(c.classList.contains('open'))setTimeout(function(){$('cin').focus()},50);else $('cin').blur()};
function chatSend(){var v=$('cin').value.trim();if(!v)return;$('cin').value='';E.sendChat(v)}
$('csend').onclick=chatSend;
$('cin').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();chatSend()}});

var NPCN=['Giulia','Marco','Anselmo','Bice','Tano','Nora','Ugo','Lia','Rocco'];
var CHATTER=['Chi ha finito la birra?','Stasera a Briscola vi distruggo','Oste! Un altro giro!','Il gatto mi sta fissando','Qualcuno ha visto il mio cappello?','Marco bara, lo sanno tutti','Proviamo The Mind?','Passami il formaggio','Questa panca traballa','Saboteur? Mi fido di nessuno'];
var REPLY=['Ahah, vero!','Ma che dici','Concordo','Seee, figurati','Giusto!','Dopo questo giro','Ci sto!'];
var OUCH=['Ehi!','Me la paghi!','Ma sei matto?','Buona però…','Questa era alla crema'];

function sceneLocanda3(){
  var S=newS(),g=S.g,W=28,D=22,me;
  S.ortho=true;S.fog=.0012;S.cam={az:PI/4,el:.62,tx:1.5,ty:3.0,tz:3,fitW:15};S.exp=1.9;
  hall(S,W,D,15);fireplace(S,W,1.2);S.fireL=S.flick[S.flick.length-1];
  var fireHit=new T.Mesh(new T.BoxGeometry(2.4,6.6,7.6),new T.MeshBasicMaterial({visible:false}));fireHit.position.set(-W/2+1.2,3.3,1.2);fireHit.userData.item='fire';S.g.add(fireHit);
  g.add(box(W+.6,.9,D+.6,M.dark,0,-.46,0,false));
  var fx=-W/2,bz=-D/2+1.7;
  // ---- bancone, spina, cibo, campanello
  g.add(box(8,2.4,1.5,M.dark,8,1.2,bz));g.add(box(8.4,.24,1.9,M.tableEdge,8,2.5,bz));
  shelfBottles(S,8,5.6,-D/2+.8,7,7.6);shelfBottles(S,8,8.2,-D/2+.8,6,7.6);
  var ho=person(S,3,8.6,0,-D/2+.7,0,.55);ho.add(box(1.9,2.3,.08,std({color:0xe6dcc4,roughness:.9}),0,2.6,.97));
  barrel(S,12.9,-D/2+2.2,.8);
  var roomSign=mesh(new T.PlaneGeometry(3.8,1.9),std({map:signTex(['STANZA',ROOM],512,256,{fs:96,f2:.8}),roughness:.7}),8,11,-D/2+.07,false,true);g.add(roomSign);
  S.setRoomSign=function(code){var m=roomSign.material,old=m.map;m.map=signTex(['STANZA',code],512,256,{fs:96,f2:.8});m.needsUpdate=true;if(old)old.dispose()};
  pendant(S,8,12,bz+1,.6,0xffc477,1.1,14);
  var keg=new T.Group();keg.position.set(5.0,2.62,bz);g.add(keg);
  var kb=mesh(barrelG,M.dark,0,.62,0);kb.scale.setScalar(.4);kb.rotation.z=PI/2;kb.position.x=.64;keg.add(kb);
  var tap=mesh(new T.CylinderGeometry(.08,.08,.5,8),M.gold,0,.55,.0);tap.rotation.x=PI/2;tap.position.set(-.05,.62,.7);keg.add(tap);
  var food=new T.Group();food.position.set(10.6,2.62,bz+.1);g.add(food);
  food.add(mesh(new T.CylinderGeometry(.75,.68,.08,20),M.pewter,0,.04,0));
  var roast=new T.Group();food.add(roast);
  var rm=mesh(new T.SphereGeometry(.42,14,10),std({color:0x7a3a14,roughness:.55}),0,.38,0);rm.scale.set(1.3,.85,1);roast.add(rm);
  var bone=mesh(new T.CylinderGeometry(.06,.06,.6,8),std({color:0xf0e6cc,roughness:.6}),.62,.42,0);bone.rotation.z=PI/2;roast.add(bone);
  food.add(mesh(new T.SphereGeometry(.3,12,8),std({color:0xc89a52,roughness:.8}),-.75,.22,.45));
  var bell=mesh(new T.SphereGeometry(.32,16,10,0,PI*2,0,PI/2),M.gold,7.2,2.62,bz+.55);g.add(bell);
  // ---- freccette
  var dc=mk(256,256),dg=dc.getContext('2d');[['#1a1a1a',128],['#e8d8b0',112],['#1a1a1a',96],['#b02a2a',80],['#e8d8b0',64],['#1a1a1a',48],['#2a7a3a',30],['#b02a2a',12]].forEach(function(r){dg.fillStyle=r[0];dg.beginPath();dg.arc(128,128,r[1],0,7);dg.fill()});
  var board=new T.Group();board.position.set(13.1,6.2,-D/2+.1);g.add(board);
  board.add(box(2.6,2.6,.12,M.dark,0,0,0));
  var face=mesh(new T.CircleGeometry(1.1,40),std({map:tex(dc,1,1),roughness:.9}),0,0,.08,false,true);board.add(face);
  // ---- porta del bagno
  var dsh=new T.Shape();dsh.moveTo(-1.1,0);dsh.lineTo(1.1,0);dsh.lineTo(1.1,3.4);dsh.absarc(0,3.4,1.1,0,PI,false);dsh.lineTo(-1.1,0);
  var dfr=new T.Mesh(new T.ShapeGeometry(dsh),new T.MeshBasicMaterial({color:0x0a0604}));dfr.position.set(1.9,0,-D/2+.06);g.add(dfr);
  var dleafG=new T.ExtrudeGeometry(dsh,{depth:.16,bevelEnabled:false});dleafG.translate(1.1,0,0);
  var bdoor=new T.Group();bdoor.position.set(.8,0,-D/2+.12);g.add(bdoor);
  var dl=mesh(dleafG,std({map:rep(darkWood,.5,.5),color:0xb08a68,roughness:.7}),0,0,0);bdoor.add(dl);
  bdoor.add(mesh(new T.CircleGeometry(.22,20,-.6,4.2),std({color:0x000000,emissive:0xffd890,emissiveIntensity:1.3}),1.1,3.2,.17,false,false));
  bdoor.add(mesh(new T.TorusGeometry(.14,.035,8,14),M.gold,1.9,1.8,.2,false,false));
  g.add(mesh(new T.PlaneGeometry(2.2,.6),std({map:signTex(['BAGNO'],512,128,{fs:70}),roughness:.8}),1.9,5.3,-D/2+.08,false,false));
  [-1,1].forEach(function(sd){g.add(box(.3,4.6,.3,M.dark,1.9+sd*1.25,2.3,-D/2+.15))});
  dl.userData.item='bath';S.hit.push(dl);
  // ---- muretti bassi sui bordi aperti e porta d'uscita
  var lwM=std({map:rep(wallTex,4,.3),bumpMap:rep(wallTex,4,.3),bumpScale:.9,roughness:.85});
  g.add(box(W+.4,1.1,.4,lwM,0,.55,D/2+.1));
  g.add(box(.4,1.1,D/2+5.4,lwM,W/2+.1,.55,(-D/2+5.4)/2));g.add(box(.4,1.1,D/2-8.6,lwM,W/2+.1,.55,(8.6+D/2)/2));
  var exitG=new T.Group();exitG.position.set(W/2+.1,0,7);g.add(exitG);
  var ep=[box(.5,4.8,.5,M.dark,0,2.4,-1.6),box(.5,4.8,.5,M.dark,0,2.4,1.6),box(.6,.5,3.8,M.dark,0,4.9,0)];ep.forEach(function(m){exitG.add(m)});
  var eleaf=new T.Group();eleaf.position.set(0,0,-1.4);eleaf.rotation.y=-1.1;exitG.add(eleaf);
  var el2=box(.14,4.4,2.8,std({map:rep(darkWood,.5,.5),color:0x9a7458,roughness:.7}),0,2.25,1.4);eleaf.add(el2);ep.push(el2);
  var esg=mesh(new T.PlaneGeometry(2.8,.6),std({map:signTex(['AL BOSCO'],512,128,{fs:66}),roughness:.8}),.36,5.6,0,false,false);esg.rotation.y=PI/2;exitG.add(esg);
  var eglow=mesh(new T.PlaneGeometry(3.0,4.4),new T.MeshBasicMaterial({color:new T.Color(.25,.4,.9),transparent:true,opacity:.35,blending:T.AdditiveBlending,depthWrite:false}),.05,2.2,0,false,false);eglow.rotation.y=PI/2;exitG.add(eglow);
  plight(S,W/2-1,2.5,7,0x6f86e0,.6,8,0);
  var exHit=new T.Mesh(new T.BoxGeometry(1.2,4.6,3.4),new T.MeshBasicMaterial({visible:false}));exHit.position.set(0,2.3,0);exitG.add(exHit);
  ep.concat([exHit]).forEach(function(m){m.userData.item='exit';S.hit.push(m)});
  // ---- jukebox
  var jb=new T.Group();jb.position.set(12.9,0,-4.4);jb.rotation.y=-PI/2;g.add(jb);
  var jw=std({map:rep(tableWood,.5,1),color:0xb07a50,roughness:.45,envMap:envTex,envMapIntensity:.4});
  jb.add(box(2.2,3.0,1.2,jw,0,1.5,0));
  var arch=mesh(new T.CylinderGeometry(1.1,1.1,1.2,24,1,false,-PI/2,PI),jw,0,3.0,0);arch.rotation.x=PI/2;arch.rotation.z=0;jb.add(arch);
  arch.rotation.set(PI/2,0,0);arch.rotation.order='XYZ';
  var jgl=std({color:0x000000,emissive:0xff8a2a,emissiveIntensity:1.4,roughness:.3});
  var tube=mesh(new T.TorusGeometry(.95,.09,8,30,PI),jgl,0,3.0,.62,false,false);jb.add(tube);
  jb.add(mesh(new T.PlaneGeometry(1.5,1.0),std({color:0x1a0f08,emissive:0x3a2a10,emissiveIntensity:.6,roughness:.2,metalness:.4}),0,2.5,.61,false,false));
  var disc=mesh(new T.CylinderGeometry(.42,.42,.03,24),std({color:0x111111,roughness:.25,metalness:.4}),0,2.5,.66,false,false);disc.rotation.x=PI/2;jb.add(disc);
  jb.add(mesh(new T.CircleGeometry(.13,16),std({color:0xc8302a,roughness:.6}),0,2.5,.69,false,false));
  var bubbles=[];for(var q=0;q<6;q++){var bm=std({color:0x000000,emissive:[0xff4a4a,0xffc84a,0x4aff8a,0x4ac8ff,0xc84aff,0xff8a2a][q],emissiveIntensity:1.2});var bu=mesh(new T.CylinderGeometry(.1,.1,.6,10),bm,-.75+q*.3,1.2,.62,false,false);jb.add(bu);bubbles.push(bm)}
  jb.add(box(1.8,.4,.1,M.gold,0,.55,.62,false));
  var jlight=new T.PointLight(0xff9a4a,0,7,1.6);jlight.position.set(0,2.6,1.6);jb.add(jlight);
  jb.children.forEach(function(m){if(m.isMesh){m.userData.item='juke';S.hit.push(m)}});
  S.jbFx={disc:disc,bubbles:bubbles,light:jlight,tube:jgl,notes:[],jb:jb,nT:0};
  // ---- guardaroba
  var ward=new T.Group();ward.position.set(12.95,0,.4);ward.rotation.y=-PI/2;g.add(ward);
  ward.add(box(2.8,5.4,1.4,M.dark,0,2.7,0));ward.add(box(3.1,.35,1.6,M.tableEdge,0,5.55,0));ward.add(box(3.0,.3,1.55,M.tableEdge,0,.15,0));
  ward.add(box(2.4,4.6,.1,std({color:0x150b06}),0,2.8,.66));
  [[0xb03a2a,-.7],[0x2a4a8a,-.2],[0x3a7a3a,.3],[0x8a6a2a,.75]].forEach(function(c){ward.add(box(.38,2.6,.9,std({color:c[0],roughness:.9}),c[1],3.2,.05))});
  ward.add(box(2.3,.06,.06,M.iron,0,4.55,.1));
  var wdoors=[-1,1].map(function(sd){var pv=new T.Group();pv.position.set(sd*1.3,0,.72);ward.add(pv);var dd=box(1.3,4.8,.12,std({map:rep(darkWood,.5,.5),color:0x9a7458,roughness:.7}),-sd*.65,2.8,0);pv.add(dd);pv.add(mesh(new T.SphereGeometry(.09,8,6),M.gold,-sd*1.15,2.8,.1,false,false));dd.userData.item='ward';S.hit.push(dd);pv.userData.sd=sd;return pv});
  ward.children.forEach(function(m){if(m.isMesh){m.userData.item='ward';S.hit.push(m)}});
  // ---- gatto davanti al camino
  var cat=new T.Group();cat.position.set(fx+4.3,0,4.6);cat.rotation.y=2.2;g.add(cat);
  var fur=std({color:0xd9822b,roughness:.9});
  var cbody=mesh(new T.SphereGeometry(.55,16,12),fur,0,.42,0);cbody.scale.set(1,.68,1.45);cat.add(cbody);
  var chd=mesh(new T.SphereGeometry(.35,14,10),fur,0,.55,.78);cat.add(chd);
  [-1,1].forEach(function(s){cat.add(mesh(new T.ConeGeometry(.11,.26,6),fur,s*.17,.88,.8));cat.add(mesh(new T.SphereGeometry(.04,6,4),std({color:0x111111}),s*.13,.6,1.08,false,false))});
  var tail=mesh(new T.TorusGeometry(.5,.08,6,16,PI*1.1),fur,.1,.18,-.55);tail.rotation.x=PI/2;cat.add(tail);
  // ---- gallina
  var hen=new T.Group();hen.position.set(9,0,7);g.add(hen);
  var wht=std({color:0xf2ede0,roughness:.85});
  var hb=mesh(new T.SphereGeometry(.42,14,10),wht,0,.62,0);hb.scale.set(.85,.8,1.15);hen.add(hb);
  hen.add(mesh(new T.SphereGeometry(.22,12,8),wht,0,1.02,.36));
  hen.add(mesh(new T.ConeGeometry(.07,.2,6),std({color:0xe8962a}),0,1.0,.6).rotateX(PI/2));
  hen.add(mesh(new T.BoxGeometry(.06,.16,.2),std({color:0xc82a2a}),0,1.25,.36));
  [-1,1].forEach(function(s){hen.add(mesh(new T.CylinderGeometry(.03,.03,.32,5),std({color:0xe8962a}),s*.13,.16,0))});
  hen.userData={tx:9,tz:7,sp:1.4,wait:2};

  // ---- scaffali per categoria
  S.dest={};S.boxes=[];
  var coinG=new T.CylinderGeometry(.2,.2,.08,12);
  S.cases=[];
  function bookcase(C,cols,rows,px,pz,ry){
    var cw=2.4,ch=2.8,bc=new T.Group();bc.position.set(px,0,pz);bc.rotation.y=ry;g.add(bc);
    var Wd=cols*cw,zb=.95,Hh=rows*ch,per=cols*rows;
    bc.add(box(Wd+.6,Hh+.5,.3,M.dark,0,.3+Hh/2,.15));
    for(var r=0;r<=rows;r++)bc.add(box(Wd+.5,.3,1.9,M.tableEdge,0,.3+r*ch,zb));
    // i montanti sporgono di .08 davanti e .02 dietro alle assi: facce alla stessa profondità = sfarfallio nei punti di congiunzione
    for(var c=0;c<=cols;c++)bc.add(box(.3,Hh,2.0,M.dark,-Wd/2+c*cw,.3+Hh/2,zb+.03));
    var list=[];GAMES.forEach(function(G,i){if(G.k===C.k)list.push(i)});
    var sw=Math.min(Wd,5.6);
    var sg=mesh(new T.PlaneGeometry(sw,1.0),std({map:signTex([C.k.toUpperCase()+' · '+list.length],512,128,{fs:58,fg:C.c,bd:C.c}),roughness:.7}),0,Hh+1.25,zb-.6,false,true);bc.add(sg);
    bc.add(box(sw+.3,1.2,.18,M.dark,0,Hh+1.25,zb-.72));
    bc.updateMatrixWorld(true);
    var ci=S.cases.length,pages=Math.max(1,Math.ceil(list.length/per));
    function slot(q){var col=q%cols,row=rows-1-Math.floor(q/cols);return {x:-Wd/2+cw*(col+.5)-.18,y:.3+row*ch+.15}}
    var decor=new T.Group();bc.add(decor);
    for(var q=list.length%per||per;q<per;q++){var sp=slot(q),d=q%3;
      if(d===0){for(var k=0;k<3;k++){var bk=box(.3,1.3+k*.12,1.0,std({color:[0x6a2a1a,0x2a3a5a,0x4a5a2a][k],roughness:.8}),sp.x-.4+k*.34,sp.y+.65+k*.06,zb);decor.add(bk)}}
      else if(d===1){[[0,0],[.45,.1]].forEach(function(p){var dd=box(.36,.36,.36,std({color:0xf2ede0,roughness:.5}),sp.x+p[0],sp.y+.18,zb+p[1]);dd.rotation.y=p[0]*2;decor.add(dd)})}
      else{var bt=mesh(bottleG,M.glass2,sp.x,sp.y,zb);bt.scale.setScalar(.6);decor.add(bt)}}
    var bxs=[];
    list.forEach(function(i,k){
      var G=GAMES[i],sd=std({color:G.c,roughness:.8}),b=new T.Mesh(new T.BoxGeometry(1.8,1.8,.7),[sd,sd,sd,sd,std({map:boxTex(i),roughness:.7}),sd]);
      b.castShadow=true;b.receiveShadow=true;b.userData={item:i,z0:zb,tz:zb,mat:b.material,cs:ci,pg:Math.floor(k/per),
        gm:null};Object.defineProperty(b.userData,'gm',{get:function(){return this._gm||(this._gm=[0,1,2,3,4,5].map(function(q){return std({color:q===4?0xffffff:0x4a4a4a,map:q===4?greyTex(i):null,roughness:.8})}))}});
      var sp=slot(k%per);b.position.set(sp.x,sp.y+.9,zb);bc.add(b);S.hit.push(b);S.boxes[i]=b;bxs.push(b);
      S.dest[i]=bc.localToWorld(new T.Vector3(sp.x,0,zb+3.2));
    });
    var CS={k:C.k,c:C.c,bc:bc,Wd:Wd,Hh:Hh,zb:zb,page:0,pages:pages,n:list.length,front:bc.localToWorld(new T.Vector3(0,0,zb+3.2))};
    CS.show=function(p){CS.page=(p+pages)%pages;bxs.forEach(function(b){b.visible=b.userData.pg===CS.page});decor.visible=CS.page===pages-1};
    CS.show(0);S.cases.push(CS);
    pendant(S,bc.localToWorld(new T.Vector3(0,0,3)).x,11.5,bc.localToWorld(new T.Vector3(0,0,3)).z,.55,0xffc477,1.0,14);
  }
  // pareti-libreria: le categorie occupano gli slot liberi, ogni scaffale pagina i giochi
  var SLOTS=[[2,2,-9.3,-D/2+.05,0],[2,2,-3.4,-D/2+.05,0],[2,2,fx+.05,-6.0,PI/2],[2,2,fx+.05,8.25,PI/2],[2,2,-7.6,-2.2,0]];
  plant(S,-12.85,-9.85,1.05);
  CATS.forEach(function(C,k){var sl=SLOTS[k%SLOTS.length];bookcase(C,sl[0],sl[1],sl[2],sl[3],sl[4])});
  // ---- bersaglio delle freccette: prende il posto del vecchio scaffale dei solitari
  function darts(px,pz,ry){
    var d=new T.Group();d.position.set(px,0,pz);d.rotation.y=ry;g.add(d);
    var c=mk(512,512),x=c.getContext('2d'),cx=256;
    x.fillStyle='#17120e';x.fillRect(0,0,512,512);
    var rings=[[250,1],[230,0],[150,1],[130,0]];
    rings.forEach(function(R){for(var i=0;i<20;i++){var a0=(i-.5)*PI/10-PI/2;
      x.beginPath();x.moveTo(cx,cx);x.arc(cx,cx,R[0],a0,a0+PI/10);x.closePath();
      x.fillStyle=R[1]?(i%2?'#b3261e':'#2f7a3a'):(i%2?'#1b1712':'#efe3c8');x.fill()}});
    x.beginPath();x.arc(cx,cx,30,0,PI*2);x.fillStyle='#2f7a3a';x.fill();
    x.beginPath();x.arc(cx,cx,12,0,PI*2);x.fillStyle='#b3261e';x.fill();
    x.strokeStyle='rgba(190,190,200,.55)';x.lineWidth=2;
    [250,230,150,130,30].forEach(function(r){x.beginPath();x.arc(cx,cx,r,0,PI*2);x.stroke()});
    d.add(box(2.7,2.7,.2,M.dark,0,5.0,.1));
    var cab=mesh(new T.CylinderGeometry(1.18,1.18,.26,40),M.tableEdge,0,5.0,.33,true,true);cab.rotation.x=PI/2;d.add(cab);
    d.add(mesh(new T.CircleGeometry(1.0,48),std({map:tex(c,1,1),roughness:.85}),0,5.0,.47,false,true));
    [[.25,.35,0xd8402f],[-.3,.1,0x2a63b8],[.05,-.45,0xe3ac1f]].forEach(function(q){
      var br=mesh(new T.CylinderGeometry(.03,.03,.55,6),std({color:0xb8b8c0,metalness:.6,roughness:.4}),5.0*0+q[0],5.0+q[1],.47+.27);br.rotation.x=PI/2;d.add(br);
      d.add(box(.22,.22,.02,std({color:q[2],roughness:.7}),q[0],5.0+q[1],.47+.56))});
    d.add(mesh(new T.PlaneGeometry(2.4,.6),std({map:signTex(['FRECCETTE'],512,128,{fs:58}),roughness:.7}),0,6.7,.3,false,true));
    d.add(box(2.2,.03,.12,std({color:0xefe3c8,roughness:.8}),0,.02,2.8));
    d.updateMatrixWorld(true);var w=d.localToWorld(new T.Vector3(0,0,3));
    pendant(S,w.x,11.5,w.z,.55,0xffc477,1.0,14);
  }
  darts(SLOTS[3][2],SLOTS[3][3],SLOTS[3][4]);
  S.unpop=function(){S.boxes.forEach(function(b){if(b)b.userData.tz=b.userData.z0})};

  // ---- il tavolo lungo
  var TX=1.5,TZ=4.2,TD=2.7,TH=1.5;
  var tg=new T.Group();tg.position.set(TX,0,TZ);g.add(tg);
  var top=box(1,.24,TD,M.tableEdge,0,TH,0);tg.add(top);
  var apr=box(1,.32,TD-.3,M.dark,0,TH-.27,0);tg.add(apr);
  var benches=[1,-1].map(function(s){var b=box(1,.16,.7,M.dark,0,.86,s*(TD/2+.8));tg.add(b);return b});
  var legs=[];[-1,1].forEach(function(e){[-1,1].forEach(function(s){var l=box(.24,TH-.1,.24,M.dark,0,(TH-.1)/2,s*(TD/2-.3));l.userData.e=e;tg.add(l);legs.push(l);var bl=box(.18,.8,.5,M.dark,0,.42,s*(TD/2+.8));bl.userData.e=e;bl.userData.b=1;tg.add(bl);legs.push(bl)})});
  var head=new T.Group();tg.add(head);head.add(box(1.1,.14,1.1,M.dark,0,1.0,0));head.add(box(.14,1.4,1.1,M.dark,.55,1.6,0));
  [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]].forEach(function(p){head.add(box(.12,1,.12,M.dark,p[0],.5,p[1]))});
  var freeR=mesh(new T.TorusGeometry(.95,.07,8,40),std({color:0x000000,emissive:0xffb23e,emissiveIntensity:1.7}),0,.05,0,false,false);freeR.rotation.x=PI/2;head.add(freeR);
  [top,apr].concat(benches).forEach(function(m){m.userData.item='T'});S.hit.push(top,benches[0],benches[1]);
  var gbox=new T.Mesh(new T.BoxGeometry(1.8,.4,1.8),std({color:0x333333}));gbox.position.set(0,TH+.32,0);gbox.visible=false;gbox.castShadow=true;tg.add(gbox);
  S.setGame=function(i,by){var sd=std({color:GAMES[i].c,roughness:.8});gbox.material=[sd,sd,std({map:boxTex(i),roughness:.7}),sd,sd,sd];gbox.visible=true;S.gpop=0;};
  var lamps=[0,1,2].map(function(){return pendant(S,TX,6.0,TZ,.38,0xffc477,1.0,11)});
  var key=new T.SpotLight(0xffc477,.75,70,.95,.9,1.0);key.position.set(0,18,5);key.target.position.set(0,0,1);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=6;key.shadow.camera.far=42;key.shadow.bias=-.0004;key.shadow.normalBias=.04;g.add(key);g.add(key.target);

  // ---- persone
  S.L=4.6;S.Lt=4.6;S.M=1;S.npc=[];
  function seat(i,L){var col=Math.floor(i/2),side=i%2?-1:1;return {x:TX-L/2+1.25+col*2.1,z:TZ+side*(TD/2+.8),f:side>0?PI:0}}
  function lenFor(M){return Math.max(2,Math.ceil((M-1)/2))*2.1+.4}
  S.peopleInit=false;
  S.setPeople=function(list){
    S.Lt=Math.max(2,Math.ceil(list.length/2))*2.1+.4;
    var keep={};list.forEach(function(e,idx){keep[e.id+e.sig]=idx});
    S.npc.forEach(function(n){var k=n.id+n.sig;if(keep[k]==null){if(!n.out){n.out=true;if(n.tag){n.tag.el.remove();var ti=S.tags.indexOf(n.tag);if(ti>=0)S.tags.splice(ti,1)}if(S.peopleInit&&!list.some(function(e){return e.id===n.id}))chatPush('',n.name+' lascia il tavolo','sys')}}else{n.i=keep[k];delete keep[k]}});
    Object.keys(keep).forEach(function(k){var idx=keep[k],e=list[idx],f=figure(e.o),s0=seat(idx,S.L);f.position.set(s0.x,0,s0.z);f.rotation.y=s0.f;f.scale.setScalar(.01);g.add(f);
      var mg=mesh(new T.CylinderGeometry(.22,.19,.45,14),M.pewter,0,0,0);mg.scale.setScalar(.01);tg.add(mg);
      var n={f:f,i:idx,s:0,out:false,mug:mg,name:e.name,guest:e.guest,lift:0,id:e.id,sig:e.sig};
      n.tag=addTag(S,new T.Vector3(0,4.2,0),esc(e.name)+(e.guest?'<small>ospite</small>':''),'');n.tag.follow=f;
      var hp=new T.Mesh(new T.CylinderGeometry(1.4,1.4,6.6,8),new T.MeshBasicMaterial({visible:false}));hp.position.y=3.3;hp.userData={item:'npc',n:n};f.add(hp);S.hit.push(hp);n.hp=hp;
      S.npc.push(n);if(S.peopleInit&&!S.npc.some(function(x){return x!==n&&x.id===e.id}))chatPush('',e.name+(e.guest?' (ospite di '+(e.owner||'?')+')':'')+' si siede al tavolo','sys')});
    S.peopleInit=true;
  };
  S.npc=S.npc||[];
  // ---- avatar
  me=person(S,6,6,0,9,PI+.6,.55);S.me=me;S.pos=new T.Vector3(6,0,9);S.goal=null;S.pend=null;S.sit=false;
  var tu=addTag(S,new T.Vector3(0,4.3,0),'Tu','');tu.follow=me;
  var hmug=mesh(new T.CylinderGeometry(.34,.3,.7,14),M.pewter,.95,3.45,1.3,false,false);hmug.visible=false;me.add(hmug);
  var hfoam=mesh(new T.CylinderGeometry(.3,.3,.12,14),std({color:0xf1e6c8}),0,.38,0,false,false);hmug.add(hfoam);

  // ---- utilità buffe
  S.parts=[];S.fly=[];S.drunk=0;S.darts=[];S.hicT=0;S.chatT=6;S.catJ=0;S.drink=0;
  function say(f,text,ms){var o=addTag(S,new T.Vector3(0,f===cat||f===hen?1.9:4.6,0),esc(text),'bub sm');o.follow=f;setTimeout(function(){o.el.remove();var k=S.tags.indexOf(o);if(k>=0)S.tags.splice(k,1)},ms||2600);return o}
  function headPos(f){return new T.Vector3(f.position.x,f.position.y+5.0*f.scale.x,f.position.z)}
  function crumbs(p,col,n){for(var i=0;i<n;i++){var m=mesh(new T.BoxGeometry(.09,.09,.09),std({color:col}),p.x,p.y,p.z,false,false);g.add(m);S.parts.push({m:m,v:new T.Vector3((Math.random()-.5)*3,2+Math.random()*2,(Math.random()-.5)*3),t:0})}}
  function fly(m,a,b,h,dur,spin,done){g.add(m);m.position.copy(a);S.fly.push({m:m,a:a.clone(),b:b.clone(),h:h,d:dur,t:0,spin:spin,done:done})}
  function pie(){var p=new T.Group();p.add(mesh(new T.CylinderGeometry(.34,.28,.14,14),std({color:0xc8964a}),0,0,0,false,false));p.add(mesh(new T.CylinderGeometry(.3,.3,.06,14),std({color:0xfff4e0}),0,.09,0,false,false));return p}
  function splat(f){var s=mesh(new T.SphereGeometry(.5,12,8),std({color:0xfff4e0,roughness:.4}),0,5.05,.45,false,false);s.scale.set(1.1,.9,.35);f.add(s);setTimeout(function(){f.remove(s)},6000)}
  function throwPie(n,back){
    if(!n||n.out)return;
    var from=back?headPos(n.f):headPos(me),to=back?headPos(me):headPos(n.f);
    if(!back){me.rotation.y=faceTo(S.pos.x,S.pos.z,n.f.position.x,n.f.position.z)}
    fly(pie(),from,to,2.2,.75,8,function(){
      if(back){splat(me);say(me,'Pfff!');chatPush(n.name,'Tiè! 🥧')}
      else{splat(n.f);var w=OUCH[Math.floor(Math.random()*OUCH.length)];say(n.f,w);chatPush(n.name,w);
        if(Math.random()<.5)setTimeout(function(){throwPie(n,true)},1500)}
    });
  }
  S.acts={
    beer:function(){hmug.visible=true;S.drink=1.2;S.drunk+=1;say(me,S.drunk>=3?'Hic! Glu glu…':'Glu glu…');if(S.drunk===3)chatPush('',(NAME||'Tu')+' comincia a barcollare','sys')},
    food:function(){var p=food.localToWorld(new T.Vector3(0,.5,0));crumbs(p,0x8a4a1c,10);roast.scale.multiplyScalar(.82);if(roast.scale.x<.35)roast.scale.setScalar(.35);say(me,'Gnam!')},
    bell:function(){say(ho,'Un giro per tutti!');chatPush('Oste','Un giro per tutti, offre '+(NAME||'Tu')+'!');
      S.npc.forEach(function(n,k){setTimeout(function(){if(n.out)return;n.lift=1.4;say(n.f,'Salute!',1600)},300+k*260)})},
    dart:function(){
      me.rotation.y=faceTo(S.pos.x,S.pos.z,board.position.x,board.position.z+2);
      var a=Math.random()*6.28,r=Math.pow(Math.random(),.8)*1.35,tp=new T.Vector3(board.position.x+Math.cos(a)*r,board.position.y+Math.sin(a)*r,board.position.z+.25);
      var dm=new T.Group();var sh=mesh(new T.CylinderGeometry(.03,.03,.6,6),M.iron,0,0,0,false,false);sh.rotation.x=PI/2;dm.add(sh);dm.add(mesh(new T.BoxGeometry(.02,.22,.2),std({color:0xc82a2a}),0,0,.3,false,false));
      fly(dm,headPos(me),tp,.4,.45,0,function(){S.darts.push(dm);if(S.darts.length>3)g.remove(S.darts.shift());
        var w=r<.14?'Centro! 50':r<.5?'20 punti':r<1.1?'5 punti':'Hai preso il muro…';say(me,w);if(r<.14)chatPush('',(NAME||'Tu')+' fa centro!','sys')});
    },
    cat:function(){var rr=Math.random();if(rr<.35){say(cat,'Miao!');S.catJ=1}else if(rr<.6){say(cat,'Ffff!');S.catRun=new T.Vector3(fx+2.5+Math.random()*4,0,2+Math.random()*6)}else say(cat,'Purrr…')}
  };
  S.hit.push(fireHit);S.acts.juke=function(){openJuke()};
  S.acts.fire=function(){S.fireZoom()};
  var ACTD={fire:new T.Vector3(-9.4,0,1.2),beer:new T.Vector3(5.0,0,bz+2.6),food:new T.Vector3(10.6,0,bz+2.6),bell:new T.Vector3(7.2,0,bz+2.6),dart:new T.Vector3(11.0,0,-7.4),ward:new T.Vector3(10.6,0,.4),juke:new T.Vector3(10.7,0,-4.4),exit:new T.Vector3(12.6,0,7),bath:new T.Vector3(1.9,0,-D/2+3.4)};
  [kb,tap].forEach(function(m){m.userData.item='beer';S.hit.push(m)});
  food.children.concat(roast.children).forEach(function(m){if(m.isMesh){m.userData.item='food';S.hit.push(m)}});
  bell.userData.item='bell';S.hit.push(bell);face.userData.item='dart';S.hit.push(face);
  [cbody,chd].forEach(function(m){m.userData.item='cat';S.hit.push(m)});
  var henHit=new T.Mesh(new T.SphereGeometry(.9,8,6),new T.MeshBasicMaterial({visible:false}));henHit.position.y=.7;henHit.userData.item='hen';hen.add(henHit);S.hit.push(henHit);

  S.walkTo=function(p,item,obj){
    if(S.cust)return;
    if(S.zoomFire)return;
    if(S.zoom>=0){if(typeof item==='number'){var bz2=S.boxes[item];S.unpop();bz2.userData.tz=bz2.userData.z0+.9;setTimeout(function(){openPage(item)},250)}return}
    if(item==='npc'){throwPie(obj.userData.n);return}
    if(item==='hen'){say(hen,'Coccodè!');var a=Math.random()*6.28;hen.userData.tx=Math.max(-W/2+3,Math.min(W/2-2,hen.position.x+Math.cos(a)*7));hen.userData.tz=Math.max(-D/2+5,Math.min(D/2-1.5,hen.position.z+Math.sin(a)*7));hen.userData.sp=7;hen.userData.wait=0;return}
    S.sit=false;hmug.visible=hmug.visible&&S.drink>0;
    if(typeof item==='number'&&S.dest[item])p=S.dest[item].clone();
    else if(item==='T')p=new T.Vector3(TX+S.L/2+1.0,0,TZ);
    else if(item==='cat')p=new T.Vector3(cat.position.x+1.8,0,cat.position.z+1.2);
    else if(ACTD[item])p=ACTD[item].clone();
    else{p=p.clone();p.x=Math.max(-W/2+3.4,Math.min(W/2-2,p.x));p.z=Math.max(-D/2+4,Math.min(D/2-1.5,p.z))}
    p.y=0;S.goal=p;S.pend=item==null?'floor':item;S.unpop();E.movedTo(p,item==='T');
  };
  S.mySay=function(v){chatPush(NAME||'Tu',v,'me');say(me,v,3500);
    if(0){var n=S.npc[Math.floor(Math.random()*S.npc.length)];setTimeout(function(){if(n.out)return;var w=REPLY[Math.floor(Math.random()*REPLY.length)];say(n.f,w);chatPush(n.name,w)},1400)}};
  function pushOut(){
    var hx=S.L/2+.9,hz=TD/2+1.35,dx=S.pos.x-TX,dz=S.pos.z-TZ;
    if(Math.abs(dx)<hx&&Math.abs(dz)<hz){var ox=hx-Math.abs(dx),oz=hz-Math.abs(dz);if(ox<oz)S.pos.x=TX+Math.sign(dx||1)*hx;else S.pos.z=TZ+Math.sign(dz||1)*hz}
  }
  S.tick=function(t,dt){
    var k,a=Math.min(1,dt*3.5);
    S.L+=(S.Lt-S.L)*a;
    top.scale.x=S.L;apr.scale.x=S.L-.3;benches.forEach(function(b){b.scale.x=S.L-.3});
    legs.forEach(function(l){l.position.x=l.userData.e*(S.L/2-(l.userData.b?.35:.3))});
    head.position.x=S.L/2+1.0;freeR.visible=!S.sit;
    lamps.forEach(function(l,k){var x=TX+(k-1)*S.L/3.2;l.position.x=x;l.userData.g.position.x=x;l.userData.s.position.x=x});
    for(k=S.npc.length-1;k>=0;k--){var n=S.npc[k],s=seat(n.i,S.L);
      n.s+=((n.out?0:1)-n.s)*Math.min(1,dt*5);n.lift=Math.max(0,n.lift-dt);
      n.f.position.x+=(s.x-n.f.position.x)*a;n.f.position.z=s.z;n.f.scale.setScalar(Math.max(.01,.55*n.s));
      n.mug.position.set(s.x-TX,TH+.35+(n.lift>0?Math.sin(Math.min(1,n.lift)*PI)*1.2:0),(s.z-TZ)*(n.lift>0?.75:.62));n.mug.scale.setScalar(Math.max(.01,n.s));
      if(n.out&&n.s<.03){g.remove(n.f);tg.remove(n.mug);var hi=S.hit.indexOf(n.hp);if(hi>=0)S.hit.splice(hi,1);S.npc.splice(k,1)}}
    if(gbox.visible&&S.gpop<1){S.gpop=Math.min(1,S.gpop+dt*2.5);gbox.position.y=TH+.32+Math.sin(S.gpop*PI)*.8}
    S.boxes.forEach(function(b){if(b)b.position.z+=(b.userData.tz-b.position.z)*.15});
    // proiettili e briciole
    for(k=S.fly.length-1;k>=0;k--){var f=S.fly[k];f.t+=dt/f.d;var e=Math.min(1,f.t);f.m.position.lerpVectors(f.a,f.b,e);f.m.position.y+=Math.sin(e*PI)*f.h;if(f.spin)f.m.rotation.x+=dt*f.spin;else f.m.lookAt(f.b);
      if(e>=1){S.fly.splice(k,1);if(f.spin)g.remove(f.m);f.done&&f.done()}}
    for(k=S.parts.length-1;k>=0;k--){var pp=S.parts[k];pp.t+=dt;pp.v.y-=9*dt;pp.m.position.addScaledVector(pp.v,dt);if(pp.m.position.y<0||pp.t>1.4){g.remove(pp.m);S.parts.splice(k,1)}}
    if(roast.scale.x<1)roast.scale.setScalar(Math.min(1,roast.scale.x+dt*.02));
    // gatto
    cbody.scale.y=.68+Math.sin(t*2)*.03;
    if(S.catJ>0){S.catJ=Math.max(0,S.catJ-dt*1.8);cat.position.y=Math.sin((1-S.catJ)*PI)*1.2}
    if(S.catRun){var cd=S.catRun.clone().sub(cat.position);cd.y=0;var cl=cd.length();if(cl<.1)S.catRun=null;else{cat.rotation.y=Math.atan2(cd.x,cd.z);cat.position.addScaledVector(cd,Math.min(1,6*dt/cl))}}
    // gallina
    var hu=hen.userData;hu.wait-=dt;
    if(hu.wait<=0){var hd=new T.Vector3(hu.tx-hen.position.x,0,hu.tz-hen.position.z),hl=hd.length();
      if(hl<.1){hu.wait=1.5+Math.random()*3;hu.sp=1.4;var a2=Math.random()*6.28;hu.tx=Math.max(-W/2+4,Math.min(W/2-2,hen.position.x+Math.cos(a2)*4));hu.tz=Math.max(-D/2+5,Math.min(D/2-1.5,hen.position.z+Math.sin(a2)*4));
        if(Math.abs(hu.tx-TX)<S.L/2+1.5&&Math.abs(hu.tz-TZ)<TD/2+1.6)hu.tz=TZ+TD/2+2.5}
      else{hen.rotation.y=Math.atan2(hd.x,hd.z);hen.position.addScaledVector(hd,Math.min(1,hu.sp*dt/hl));hen.position.y=Math.abs(Math.sin(t*16))*.08*(hu.sp>3?3:1)}}
    else hb.rotation.x=Math.sin(t*6)*.1;
    // avatar
    var moving=false;
    if(S.sit){var hx=TX+S.L/2+1.0;S.pos.x+=(hx-S.pos.x)*a;S.pos.z=TZ;me.rotation.y=-PI/2}
    else if(S.goal){
      var d=S.goal.clone().sub(S.pos);d.y=0;var L=d.length();
      if(L<.06){S.goal=null;var it=S.pend;S.pend=null;
        if(it==='T'){S.sit=true;toast('Ti siedi a capotavola')}
        else if(typeof it==='number'&&S.boxes[it]){var b=S.boxes[it];S.cases[b.userData.cs].show(b.userData.pg);S.enterZoom(b.userData.cs);b.userData.tz=b.userData.z0+.9}
        else if(it==='ward'||it==='bath'){S.openCust(it)}
        else if(it==='exit'){me.rotation.y=PI/2;goArea('bosco')}
        else if(it==null||it==='floor'){var nc=S.nearCase();if(nc>=0)S.enterZoom(nc);else if(Math.hypot(S.pos.x+9.6,S.pos.z-1.2)<2.6)S.fireZoom()}
        else if(S.acts[it]){if(it==='juke')me.rotation.y=PI/2;else if(it!=='dart'&&it!=='cat')me.rotation.y=PI;S.acts[it]()}}
      else{moving=true;var st=Math.min(L,7*dt);S.pos.add(d.multiplyScalar(st/L));if(!(S.pend==='T'&&L<1.4))pushOut();
        var ty=Math.atan2(d.x,d.z),dy=ty-me.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));me.rotation.y+=dy*Math.min(1,dt*14)}
    }
    if(S.drink>0){S.drink-=dt;hmug.rotation.x=-Math.sin(Math.min(1,(1.2-S.drink)/1.2)*PI)*1.2;if(S.drink<=0)setTimeout(function(){if(S.drink<=0)hmug.visible=false},4000)}
    S.drunk=Math.max(0,S.drunk-dt*.04);
    var wob=S.drunk>2.5?Math.sin(t*2.3)*.14:0;
    if(S.drunk>2.5){S.hicT-=dt;if(S.hicT<=0){S.hicT=4+Math.random()*3;say(me,'Hic!',1200)}}
    me.position.set(S.pos.x,moving?Math.abs(Math.sin(t*12))*.09:(S.sit?.82:0),S.pos.z);me.rotation.z=(moving?Math.sin(t*12)*.04:0)+wob;
    // chiacchiere
    if(0){S.chatT=7+Math.random()*7;var live=S.npc.filter(function(n){return !n.out});if(live.length){var n2=live[Math.floor(Math.random()*live.length)],w=CHATTER[Math.floor(Math.random()*CHATTER.length)];say(n2.f,w,3000);chatPush(n2.name,w)}}
    if(S.hearth)S.hearth.dim=S.zoomFire?.75:1;
    if(S.stoke>0){S.stoke=Math.max(0,S.stoke-dt);S.fireL.l.intensity=S.fireL.b*(1+S.stoke*1.6)}
    for(var sk=S.sparks.length-1;sk>=0;sk--){var spk=S.sparks[sk];spk.t+=dt;spk.v.y-=1.2*dt;spk.m.position.addScaledVector(spk.v,dt);spk.m.material.opacity=1-spk.t/1.6;if(spk.t>1.6){g.remove(spk.m);spk.m.material.dispose();S.sparks.splice(sk,1)}}
    if(S.spin>0){S.spin=Math.max(0,S.spin-dt*.8);me.rotation.y+=dt*PI*1.6}
    S.tick2(t,dt);
    (function(F){var on=MUS.cur>=0;F.light.intensity+=((on?1.4:0)-F.light.intensity)*Math.min(1,dt*4);F.tube.emissiveIntensity=on?1.2+Math.sin(t*4)*.5:.5;
      F.bubbles.forEach(function(b,k){b.emissiveIntensity=on?.7+Math.sin(t*3+k)*.6:.35});if(on)F.disc.rotation.y+=dt*5;
      if(on){F.nT-=dt;if(F.nT<=0){F.nT=.7;var nc=mk(64,64),nx=nc.getContext('2d');nx.fillStyle='#ffd27a';nx.font='700 52px Georgia';nx.textAlign='center';nx.fillText(Math.random()<.5?'♪':'♫',32,50);
        var sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(nc),transparent:true,depthWrite:false,fog:false}));var p=F.jb.localToWorld(new T.Vector3((Math.random()-.5)*1.2,4.2,.4));sp.position.copy(p);sp.scale.set(.6,.6,1);g.add(sp);F.notes.push({s:sp,t:0,x:p.x})}}
      for(var k=F.notes.length-1;k>=0;k--){var n=F.notes[k];n.t+=dt;n.s.position.y+=dt*1.1;n.s.position.x=n.x+Math.sin(n.t*3)*.3;n.s.material.opacity=1-n.t/2.4;if(n.t>2.4){g.remove(n.s);F.notes.splice(k,1)}}
    })(S.jbFx);
    if(0){var ca=Math.min(1,dt*3);S.cam.tx+=(S.pos.x+1.9-S.cam.tx)*ca;S.cam.tz+=(S.pos.z+1.9-S.cam.tz)*ca;S.cam.fitW+=(7-S.cam.fitW)*ca;S.cam.ty+=(.4-S.cam.ty)*ca}
    else{S.cam.tx+=(S.pos.x*.35+.6-S.cam.tx)*Math.min(1,dt*3);S.cam.tz+=(S.pos.z*.35+.4-S.cam.tz)*Math.min(1,dt*3);S.cam.fitW+=(15-S.cam.fitW)*Math.min(1,dt*3);S.cam.ty+=(3.0-S.cam.ty)*Math.min(1,dt*3)}
    wdoors.forEach(function(pv){var tgt=S.cust==='ward'?pv.userData.sd*1.9:0;pv.rotation.y+=(tgt-pv.rotation.y)*Math.min(1,dt*5)});
    bdoor.rotation.y+=((S.cust==='bath'?-1.2:0)-bdoor.rotation.y)*Math.min(1,dt*5);
  };
  /* ---- zoom in prima persona sugli scaffali ---- */
  S.zoom=-1;S.view=null;
  S.nearCase=function(){var best=-1,bd=3.4;S.cases.forEach(function(c,k){var d=Math.hypot(c.front.x-S.pos.x,c.front.z-S.pos.z);if(d<bd){bd=d;best=k}});return best};
  function caseView(k){
    var c=S.cases[k],asp=(app.clientWidth||390)/(app.clientHeight||844),vh=Math.tan(25*PI/180),hh=vh*asp;
    var d=Math.max((c.Wd/2+1.5)/hh,(c.Hh/2+2.2)/vh);
    var cy=c.Hh/2+.9;
    return {pos:c.bc.localToWorld(new T.Vector3(0,cy+d*.12,c.zb+d)),look:c.bc.localToWorld(new T.Vector3(0,cy,c.zb))};
  }
  S.pageStep=function(d){if(S.zoom<0)return;var C=S.cases[S.zoom];if(C.pages<2)return;S.unpop();C.show(C.page+d);S.enterZoom(S.zoom)};
  S.sparks=[];
  S.fireZoom=function(){
    S.zoomFire=true;S.view={pos:new T.Vector3(-1.2,4.6,1.2),look:new T.Vector3(-13.4,2.9,1.2),exp:.8};S.vp=null;me.visible=false;tu.el.style.visibility='hidden';flashFade();
    var zb=$('zbar');zb.innerHTML='<button type="button" class="on" style="--cc:#e8742c">Il camino</button><button type="button" id="stoke" style="--cc:#e8742c">🔥 Attizza il fuoco</button><button type="button" class="x">Esci</button>';
    zb.children[1].onclick=function(){S.stoke=1.4;if(S.hearth)S.hearth.burst(40);return;for(var q=0;q<40;q++){var m=new T.Mesh(GEO('spark',function(){return new T.SphereGeometry(.05,4,3)}),new T.MeshBasicMaterial({color:0xffb050,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));m.position.set(-13.2+Math.random()*.6,.8+Math.random()*.6,1.2+(Math.random()-.5)*2.4);g.add(m);S.sparks.push({m:m,v:new T.Vector3(Math.random()*.8,2+Math.random()*3,(Math.random()-.5)*1.2),t:0})}};
    zb.children[2].onclick=function(){S.exitFire()};zb.classList.add('show');$('sim').classList.remove('show');
  };
  S.exitFire=function(){if(!S.zoomFire)return;S.zoomFire=false;S.view=null;S.vp=null;me.visible=true;tu.el.style.visibility='';$('zbar').classList.remove('show');$('sim').classList.add('show');flashFade()};
  S.enterZoom=function(k){
    var first=S.zoom<0;S.zoom=k;S.view=caseView(k);if(first){S.vp=null;me.visible=false;flashFade()}
    var zb=$('zbar');zb.innerHTML='';
    S.cases.forEach(function(c,j){var b=document.createElement('button');b.type='button';b.textContent=c.k;b.className=j===k?'on':'';b.style.setProperty('--cc',c.c);b.onclick=function(){S.enterZoom(j)};zb.appendChild(b)});
    var x=document.createElement('button');x.type='button';x.className='x';x.textContent='Esci';x.onclick=function(){S.exitZoom()};zb.appendChild(x);
    var C=S.cases[k],pg=$('zpg');if(C.pages>1){pg.innerHTML='<button type="button" aria-label="Pagina precedente">‹</button><span>'+C.k+' · pagina '+(C.page+1)+' di '+C.pages+'</span><button type="button" aria-label="Pagina successiva">›</button>';pg.children[0].onclick=function(){S.pageStep(-1)};pg.children[2].onclick=function(){S.pageStep(1)};pg.classList.add('show')}else pg.classList.remove('show');
    tu.el.style.visibility='hidden';
    zb.classList.add('show');$('sim').classList.remove('show');
  };
  S.exitZoom=function(){if(S.zoom<0)return;$('zpg').classList.remove('show');tu.el.style.visibility='';S.zoom=-1;S.view=null;S.vp=null;me.visible=true;S.unpop();$('zbar').classList.remove('show');$('sim').classList.add('show');flashFade()};
  function flashFade(){var f=$('fade');f.style.transition='none';f.style.opacity=.85;requestAnimationFrame(function(){f.style.transition='opacity .45s';f.style.opacity=0})}

  S.clearGame=function(){gbox.visible=false};
  S.propose=function(i){E.propose(i)};
  S.tick2=function(t,dt){E.voteTick(dt)};
  /* ---- guardaroba e bagno: personalizza il pupazzo ---- */
  var OPT={
    skin:[0xf6d7bd,0xf0c4a0,0xe0aa80,0xc48a5e,0x9a6440,0x6a4028,0x9ad0a0,0xa8b8e8],
    body:[['snello','Snello'],['normale','Normale'],['robusto','Robusto']],
    height:[['basso','Basso'],['medio','Medio'],['alto','Alto']],
    eyes:[['tondi','Tondi'],['grandi','Grandi'],['felici','Felici'],['assonnati','Assonnati'],['stelle','Stellati']],
    brows:[['nessuna','Nessuna'],['sottili','Sottili'],['folte','Folte'],['arrabbiate','Arrabbiate']],
    mouth:[['sorriso','Sorriso'],['neutra','Seria'],['stupita','Stupita'],['ghigno','Ghigno'],['lingua','Linguaccia']],
    nose:[['piccolo','Piccolo'],['tondo','Tondo'],['lungo','Lungo']],
    ears:[['normali','Normali'],['grandi','Grandi'],['elfo','Da elfo']],
    blush:[[false,'No'],[true,'Guance rosse']],freckles:[[false,'No'],[true,'Lentiggini']],
    glasses:[['none','Niente'],['tondi','Occhiali'],['monocolo','Monocolo'],['benda','Benda da pirata']],
    hair:[['short','Corti'],['long','Lunghi'],['bun','Chignon'],['coda','Coda'],['ricci','Ricci'],['cresta','Cresta'],['bald','Calvo']],
    hairc:[0x1a1210,0x3a2414,0x6a3a1c,0xc8902a,0xe8c87a,0xb04a1a,0x9a9a9a,0xf2f2ee,0x3a6ac8,0xc84a8a],
    beard:[['none','Nessuna'],['baffi','Baffi'],['pizzetto','Pizzetto'],['corta','Corta'],['lunga','Lunga']],
    outfit:[['veste','Veste'],['tunica','Tunica'],['abito','Abito lungo'],['grembiule','Grembiule'],['armatura','Armatura']],
    robe:[0x9a3a1c,0x1c2f4d,0x23402e,0x3a2a48,0x5a2a1a,0x2a2a2a,0x8a6a2a,0x6a1a3a,0x2a6a6a,0xd8c8a8],
    collar:[['gorgiera','Gorgiera'],['sciarpa','Sciarpa'],['none','Nessuno']],
    collarc:[0xcfc2a2,0xf2ede0,0xb03a2a,0x2a4a8a,0x3a6a2a,0x111111],
    beltc:[0x1a0f09,0x6a3a1c,0x8a2424,0x2a2a2a],
    cape:[['none','Niente'],['mantello','Mantello']],capec:[0x6a1a2a,0x1c2f4d,0x23402e,0x2a2a2a,0x8a6a2a],
    head:[['none','Niente'],['brim','Cappello'],['hood','Cappuccio'],['beret','Basco'],['top','Cilindro'],['bandana','Bandana'],['elmo','Elmo'],['fiori','Fiori'],['crown','Corona']],
    hatc:[0x4a2410,0x121c30,0x2a1a10,0x6b5a3a,0x8a2424,0x111111,0x2a5a3a,0xd8c8a8],
    prop:[['none','Niente'],['boccale','Boccale'],['libro','Libro'],['spada','Spada'],['lanterna','Lanterna'],['liuto','Liuto'],['pipa','Pipa'],['fiore','Fiore']],
    jewel:[['none','Niente'],['orecchini','Orecchini'],['collana','Collana']]
  };
  var TABS=[['corpo','Corpo','',[['Corporatura','body'],['Altezza','height'],['Carnagione','skin']]],
    ['viso','Viso','',[['Occhi','eyes'],['Sopracciglia','brows'],['Bocca','mouth'],['Naso','nose'],['Orecchie','ears'],['Guance','blush'],['Lentiggini','freckles'],['Occhiali','glasses']]],
    ['capelli','Capelli','',[['Taglio','hair'],['Colore','hairc'],['Barba','beard']]],
    ['abiti','Abiti','',[['Vestito','outfit'],['Colore','robe'],['Colletto','collar'],['Colore colletto','collarc'],['Cintura','beltc'],['Mantello','cape'],['Colore mantello','capec']]],
    ['extra','Accessori','',[['In testa','head'],['Colore','hatc'],['In mano','prop'],['Gioielli','jewel']]]];
  function hex(c){return '#'+('00000'+c.toString(16)).slice(-6)}
  function rebuildMe(){
    var old=me,nm=person(S,6,old.position.x,old.position.y,old.position.z,old.rotation.y,.55);
    g.remove(old);old.remove(hmug);nm.add(hmug);me=nm;S.me=nm;tu.follow=nm;nm.visible=old.visible;
  }
  function row(label,f){var F=FIG[6],L=OPT[f],col=typeof L[0]==='number';
    return '<div class="crow"><span>'+label+'</span><div>'+L.map(function(v,k){var val=col?v:v[0],on=val===F[f]||(!col&&F[f]==null&&k===0);
      return '<button type="button" class="sw'+(on?' on':'')+(col?'':' tx')+'" data-f="'+f+'" data-k="'+k+'"'+(col?' style="background:'+hex(v)+'" aria-label="'+label+' '+(k+1)+'"':'')+'>'+(col?'':v[1])+'</button>'}).join('')+'</div></div>'}
  S.ctab='corpo';
  function renderCust(){
    var el=$('cust'),bath=S.cust==='bath',MY=TABS.filter(function(t){return bath?['corpo','viso','capelli'].indexOf(t[0])>=0:['abiti','extra'].indexOf(t[0])>=0});if(!MY.some(function(t){return t[0]===S.ctab}))S.ctab=MY[0][0];var tab=MY.filter(function(t){return t[0]===S.ctab})[0];
    el.innerHTML='<div class="ch"><h3>'+(bath?'Lo specchio':'Il guardaroba')+'</h3><div><button type="button" class="x" id="crnd">Casuale</button> <button type="button" class="x" id="cspin">Gira</button></div></div>'+
      '<div class="ctabs">'+MY.map(function(t){return '<button type="button" data-t="'+t[0]+'" class="'+(t[0]===S.ctab?'on':'')+'">'+t[1]+'</button>'}).join('')+'</div>'+
      '<div class="cscroll">'+tab[3].map(function(r){return row(r[0],r[1])}).join('')+(S.ctab==='viso'&&S.cust==='bath'?'<button type="button" class="btn ghost" id="wash">Lavati la faccia</button>':'')+'</div><button type="button" class="btn" id="cdone">Fatto</button>';
    [].forEach.call(el.querySelectorAll('.ctabs button'),function(b){b.onclick=function(){S.ctab=b.dataset.t;renderCust()}});
    [].forEach.call(el.querySelectorAll('.sw'),function(b){b.onclick=function(){var f=b.dataset.f,v=OPT[f][+b.dataset.k],val=typeof v==='number'?v:v[0];FIG[6][f]=val;if(!updateFigure(me,f,val))rebuildMe();[].forEach.call(b.parentNode.children,function(x){x.classList.toggle('on',x===b)})}});
    $('cspin').onclick=function(){S.spin=1};
    $('crnd').onclick=function(){var FS=[];MY.forEach(function(t){t[3].forEach(function(r){FS.push(r[1])})});FS.forEach(function(f){var L=OPT[f],v=L[Math.floor(Math.random()*L.length)];FIG[6][f]=typeof v==='number'?v:v[0]});FIG[6].hat=null;rebuildMe();renderCust();S.spin=.6};
    var w=$('wash');if(w)w.onclick=function(){rebuildMe();say(me,'Splash! Pulito.')};
    $('cdone').onclick=function(){E.saveLook();var kd=S.cust;S.cust=null;S.view=null;S.vp=null;tu.el.style.visibility='';$('sim').classList.add('show');el.classList.remove('show');$('sbar').classList.add('show');$('chat').classList.add('show');chatPush('',(NAME||'Tu')+' esce dal '+(kd==='bath'?'bagno':'guardaroba')+' con un look nuovo','sys')};
  }
  S.openCust=function(kind){S.cust=kind;S.ctab=kind==='bath'?'viso':'abiti';
    var dir=new T.Vector3(-S.pos.x,0,-S.pos.z).normalize(),cp=S.pos.clone().addScaledVector(dir,13.5);cp.y=3.8;
    me.rotation.y=faceTo(S.pos.x,S.pos.z,cp.x,cp.z);S.view={pos:cp,look:new T.Vector3(S.pos.x,-.45,S.pos.z)};S.vp=null;tu.el.style.visibility='hidden';$('sim').classList.remove('show');renderCust();$('cust').classList.add('show');$('sbar').classList.remove('show');$('chat').classList.remove('show')};

  return S;
}


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


/* ================= JUKEBOX: musica procedurale con WebAudio ================= */
var TRACKS=[
  {n:'Ballata della locanda',k:'pluck',sp:.29,bar:6,arp:1,drum:'frame3',
   mel:[69,0,67,69,71,72, 74,0,72,71,69,0, 67,0,65,67,69,67, 65,64,62,0,0,0, 69,0,67,69,71,72, 74,0,76,74,72,71, 69,0,71,69,67,65, 62,0,0,0,0,0],
   bass:[50,50,48,50,50,45,43,50],bassAt:[0,3],ch:[[62,65,69],[62,65,69],[60,64,67],[62,65,69],[62,65,69],[57,60,64],[55,59,62],[62,65,69]]},
  {n:'Il boccale vuoto',k:'fiddle',sp:.19,bar:6,arp:1,drum:'jig',
   mel:[69,71,72,74,72,71, 69,0,76,74,72,71, 72,74,76,79,76,74, 76,0,74,72,71,0, 69,71,72,74,72,71, 69,0,76,78,79,76, 74,72,71,72,71,69, 69,0,0,69,0,0],
   bass:[45,45,48,52,45,50,43,45],bassAt:[0,3],ch:[[57,60,64],[57,60,64],[60,64,67],[52,55,59],[57,60,64],[50,54,57],[55,59,62],[57,60,64]]},
  {n:'La canzone del viandante',k:'flute',sp:.36,bar:6,arp:1,
   mel:[71,0,0,69,71,72, 71,0,69,67,0,0, 67,0,69,71,0,74, 76,0,0,0,0,0, 76,0,74,72,0,71, 69,0,71,72,71,69, 67,0,66,64,0,66, 64,0,0,0,0,0],
   bass:[40,38,43,48,45,45,47,40],bassAt:[0],ch:[[52,55,59],[50,54,57],[55,59,62],[48,52,55],[57,60,64],[57,60,64],[59,62,66],[52,55,59]]},
  {n:'Danza del fuoco',k:'fiddle',sp:.16,bar:8,arp:1,drum:'reel',
   mel:[74,72,69,72,74,76,74,72, 69,67,66,67,69,72,69,67, 66,69,74,69,72,69,67,64, 62,64,66,67,69,0,69,0, 74,72,69,72,74,76,78,76, 74,72,69,72,71,69,67,66, 67,69,71,72,74,72,69,67, 66,64,62,0,62,0,0,0],
   bass:[50,48,50,57,50,48,43,50],bassAt:[0,4],ch:[[62,66,69],[60,64,67],[62,66,69],[57,61,64],[62,66,69],[60,64,67],[55,59,62],[62,66,69]]},
  {n:'Brindisi all’oste',k:'pluck',sp:.24,bar:6,arp:1,drum:'frame3',lead2:'flute',
   mel:[67,0,71,74,0,71, 72,0,76,74,0,72, 71,0,67,69,71,72, 74,0,0,0,0,0, 76,0,74,72,0,71, 72,0,71,69,0,67, 69,0,71,69,66,69, 67,0,0,0,0,0],
   bass:[43,48,43,50,48,45,50,43],bassAt:[0,3],ch:[[55,59,62],[60,64,67],[55,59,62],[57,62,66],[60,64,67],[57,60,64],[57,62,66],[55,59,62]]},
  {n:'Notturno al camino',k:'bell',sp:.82,bar:4,
   mel:[76,0,74,72, 71,0,0,0, 72,0,71,69, 68,0,0,0, 69,0,72,76, 74,0,72,71, 72,71,69,68, 69,0,0,0],
   bass:[45,40,45,40,41,38,40,45],bassAt:[0],ch:[[57,60,64],[56,59,64],[57,60,64],[56,59,64],[53,57,60],[50,53,57],[52,56,59],[57,60,64]]},
  {n:'Il lamento del menestrello',k:'flute',sp:.42,bar:6,arp:1,
   mel:[64,0,67,69,0,71, 72,0,71,69,0,67, 69,0,0,0,67,64, 62,0,0,0,0,0, 64,0,67,69,0,71, 72,0,74,76,0,74, 72,71,69,67,0,62, 64,0,0,0,0,0],
   bass:[45,48,43,50,45,41,43,45],bassAt:[0],ch:[[57,60,64],[60,64,67],[55,59,62],[50,53,57],[57,60,64],[53,57,60],[55,59,62],[57,60,64]]},
  {n:'Giga del boccale',k:'reed',sp:.2,bar:6,drum:'jig',
   mel:[74,71,74,79,74,71, 72,69,72,76,72,69, 71,67,71,74,71,67, 69,71,72,74,72,69, 74,71,74,79,78,79, 76,74,72,71,69,67, 69,72,71,69,67,66, 67,0,74,67,0,0],
   bass:[43,48,43,50,43,48,50,43],bassAt:[0,3],ch:[[55,59,62],[60,64,67],[55,59,62],[57,62,66],[55,59,62],[60,64,67],[57,62,66],[55,59,62]]}
];
var MUS={ctx:null,cur:-1,vol:.55,step:0,next:0,timer:null};
function mtof(m){return 440*Math.pow(2,(m-69)/12)}
function musInit(){
  if(MUS.ctx)return true;var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  var c=MUS.ctx=new AC();MUS.master=c.createGain();MUS.master.gain.value=MUS.mute?0:MUS.vol*.5;
  var dl=c.createDelay(1),fb=c.createGain(),wet=c.createGain();dl.delayTime.value=.27;fb.gain.value=.28;wet.gain.value=.22;
  MUS.bus=c.createGain();MUS.bus.connect(MUS.master);MUS.bus.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(MUS.master);
  MUS.master.connect(c.destination);
  var nb=c.createBuffer(1,c.sampleRate*.5,c.sampleRate),d=nb.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;MUS.noise=nb;
  return true;
}
function voice(type,f,t,dur,gain){
  var c=MUS.ctx,g=c.createGain(),o=c.createOscillator(),lp=c.createBiquadFilter();lp.type='lowpass';
  if(type==='pluck'){o.type='triangle';lp.frequency.setValueAtTime(f*6,t);lp.frequency.exponentialRampToValueAtTime(f*1.5,t+.4);var o2=c.createOscillator();o2.type='sawtooth';o2.frequency.value=f*1.003;var g2=c.createGain();g2.gain.value=.25;o2.connect(g2);g2.connect(lp);o2.start(t);o2.stop(t+dur+.1)}
  else if(type==='reed'){o.type='square';lp.frequency.value=f*3.2}
  else if(type==='fiddle'||type==='flute'){o.type=type==='fiddle'?'sawtooth':'triangle';lp.frequency.value=type==='fiddle'?f*3.5:f*5;lp.Q.value=type==='fiddle'?2:.7;
    var lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=type==='fiddle'?5.6:4.8;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*(type==='fiddle'?.007:.004),t+.18);lfo.connect(lg);lg.connect(o.frequency);lfo.start(t);lfo.stop(t+dur+.1);
    if(type==='flute'){var o4=c.createOscillator();o4.type='sine';o4.frequency.value=f;var g4=c.createGain();g4.gain.value=.8;o4.connect(g4);g4.connect(lp);o4.start(t);o4.stop(t+dur+.1)}}
  else if(type==='bell'){o.type='sine';lp.frequency.value=8000;var o3=c.createOscillator();o3.type='sine';o3.frequency.value=f*2.01;var g3=c.createGain();g3.gain.setValueAtTime(.3,t);g3.gain.exponentialRampToValueAtTime(.001,t+dur*.6);o3.connect(g3);g3.connect(g);o3.start(t);o3.stop(t+dur+.1)}
  else if(type==='pad'){o.type='sine';lp.frequency.value=1800}
  else{o.type='triangle';lp.frequency.value=700}
  o.frequency.value=f;o.connect(lp);lp.connect(g);g.connect(MUS.bus);
  var a=type==='pad'?.35:type==='fiddle'?.035:type==='flute'?.06:.008;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+a);
  if(type==='pad'||type==='fiddle'||type==='flute'){g.gain.setValueAtTime(gain,t+Math.max(a+.01,dur-.12));g.gain.exponentialRampToValueAtTime(.0001,t+dur)}
  else g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.start(t);o.stop(t+dur+.05);
}
function drum(kind,t){
  var c=MUS.ctx,g=c.createGain();g.connect(MUS.bus);
  if(kind==='frame'||kind==='frameL'){var fo=c.createOscillator();fo.type='sine';fo.frequency.setValueAtTime(kind==='frame'?95:150,t);fo.frequency.exponentialRampToValueAtTime(kind==='frame'?52:90,t+.16);g.gain.setValueAtTime(kind==='frame'?.45:.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);fo.connect(g);fo.start(t);fo.stop(t+.24);
    var ns=c.createBufferSource(),bp=c.createBiquadFilter(),ng=c.createGain();ns.buffer=MUS.noise;bp.type='bandpass';bp.frequency.value=900;ng.gain.setValueAtTime(.06,t);ng.gain.exponentialRampToValueAtTime(.001,t+.05);ns.connect(bp);bp.connect(ng);ng.connect(MUS.bus);ns.start(t);ns.stop(t+.06);return}
  if(kind==='kick'){var o=c.createOscillator();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);o.start(t);o.stop(t+.22);return}
  var s=c.createBufferSource(),hp=c.createBiquadFilter();s.buffer=MUS.noise;hp.type='highpass';hp.frequency.value=kind==='hat'?7000:1500;s.connect(hp);hp.connect(g);
  var L=kind==='hat'?.03:.12;g.gain.setValueAtTime(kind==='hat'?.08:.22,t);g.gain.exponentialRampToValueAtTime(.001,t+L);s.start(t);s.stop(t+L+.02);
}
function musTick(){
  var c=MUS.ctx,Tk=TRACKS[MUS.cur];if(!Tk)return;
  if(MUS.next<c.currentTime-.4)MUS.next=c.currentTime+.05;
  while(MUS.next<c.currentTime+.15){
    var s=MUS.step%Tk.mel.length,t=MUS.next,bar=Math.floor(s/Tk.bar),inb=s%Tk.bar,nb=Tk.ch.length,bi=bar%nb;
    var m=Tk.mel[s];if(m){var hold=1;while(hold<4&&Tk.mel[(s+hold)%Tk.mel.length]===0)hold++;
      var dur=Tk.k==='bell'?Tk.sp*2.2:Tk.k==='reed'?Tk.sp*.9:(Tk.k==='fiddle'||Tk.k==='flute')?Tk.sp*hold*.95:Tk.sp*2.4;
      voice(Tk.k,mtof(m),t,dur,Tk.k==='reed'?.07:Tk.k==='fiddle'?.06:Tk.k==='flute'?.12:.16);
      if(Tk.lead2&&bar%4>=2)voice(Tk.lead2,mtof(m+12),t,Tk.sp*hold*.9,.05)}
    if(Tk.arp){var cd=Tk.ch[bi];voice('pluck',mtof(cd[inb%3]-12+(inb%Tk.bar===Tk.bar-1?12:0)),t,Tk.sp*2,.06)}
    if(Tk.bassAt.indexOf(inb)>=0)voice('bass',mtof(Tk.bass[bi%Tk.bass.length]),t,Tk.sp*(Tk.bar/Tk.bassAt.length)*.9,.22);
    if(inb===0)Tk.ch[bi].forEach(function(n){voice('pad',mtof(n),t,Tk.sp*Tk.bar,.035)});
    if(Tk.drum==='march'){if(inb%4===0)drum('kick',t);if(inb%4===2)drum('snare',t);drum('hat',t)}
    if(Tk.drum==='jig'){if(inb===0||inb===3)drum('frame',t);else if(inb===2||inb===5)drum('frameL',t)}
    if(Tk.drum==='reel'){if(inb%4===0)drum('frame',t);else if(inb%2===0)drum('frameL',t)}
    if(Tk.drum==='frame3'){if(inb===0)drum('frame',t);else if(inb===2||inb===4)drum('frameL',t)}
    if(Tk.drum==='giga'){if(inb===0||inb===3)drum('kick',t);if(inb===2||inb===5)drum('hat',t)}
    MUS.step++;MUS.next+=Tk.sp*((Tk.drum==='jig'||Tk.drum==='giga')&&inb%3===0?1.08:(Tk.drum==='jig'||Tk.drum==='giga')&&inb%3===1?.94:1);
  }
}
function musPlay(i){
  if(!musInit())return false;if(MUS.ctx.state==='suspended')MUS.ctx.resume();
  MUS.cur=i;MUS.step=0;MUS.next=MUS.ctx.currentTime+.08;clearInterval(MUS.timer);
  if(i>=0)MUS.timer=setInterval(musTick,30);return true;
}
function musVol(v){MUS.vol=v;if(MUS.master)MUS.master.gain.setTargetAtTime(MUS.mute?0:v*.5,MUS.ctx.currentTime,.05)}
function openJuke(){
  var el=$('juke');
  el.innerHTML='<h3>Il jukebox</h3><div class="jl">'+TRACKS.map(function(t,i){return '<button type="button" class="jt'+(MUS.cur===i?' on':'')+'" data-i="'+i+'"><span>'+(MUS.cur===i?'♫':'♪')+'</span>'+esc(t.n)+'</button>'}).join('')+
    '<button type="button" class="jt'+(MUS.cur<0?' on':'')+'" data-i="-1"><span>■</span>Silenzio</button></div>'+
    '<label class="jv">Volume <input type="range" min="0" max="100" value="'+Math.round(MUS.vol*100)+'" id="jvol"></label><button type="button" class="btn" id="jx">Chiudi</button>';
  [].forEach.call(el.querySelectorAll('.jt'),function(b){b.onclick=function(){E.setJuke(+b.dataset.i);openJuke()}});
  $('jvol').oninput=function(){musVol(this.value/100)};
  $('jx').onclick=function(){el.classList.remove('show');$('sbar').classList.add('show');$('chat').classList.add('show')};
  el.classList.add('show');$('sbar').classList.remove('show');$('chat').classList.remove('show');
}


/* ================= pagina del gioco: tipo di partita, opzioni reali dell'app, regole ================= */
var PSEL={},PENDSEL='',PAGE=-1,COVERS=[];
function cover(i){if(!COVERS[i])COVERS[i]=boxTex(i).image.toDataURL();return COVERS[i]}
function okG(i,N){return GAMES[i].g.ok(N==null?curN():N)}
function optOf(i){var g=GAMES[i].g;if(!g.opts)return null;var u=A.ui();return (u.opts&&u.opts[g.id])||g.opts.vals[0][0]}
function selSummary(i){var G=GAMES[i],N=curN(),out=[G.g.ok(N)?G.g.mode(N):(G.r+' giocatori')];var o=G.g.opts,v=optOf(i);if(o)o.vals.forEach(function(x){if(x[0]===v)out.push(x[1])});return out.join(' · ')}
function isExp(o){return /edizion|espansion|avventur/i.test(o.label)}
function openPage(i){
  var G=GAMES[i],N=curN(),ok=okG(i,N);PAGE=i;
  $('gp-k').textContent=G.k;$('gp-img').src=cover(i);$('gp-img').alt='Scatola di '+G.t;$('gp-img').style.filter=ok?'':'grayscale(1) brightness(.6)';$('gp-t').textContent=G.t;
  $('gp-m').innerHTML='<span>'+esc(G.r)+(G.r==='1'?' giocatore':' giocatori')+'</span><span>'+esc(G.k)+'</span>'+(ok?'':'<span style="border-color:#c8434a;color:#ff9a8a">Non disponibile in '+N+'</span>');
  $('gp-d').textContent=G.s;
  var o=G.g.opts,h='<div class="gopt"><div class="gol"><span>Tipo di partita</span><b>'+esc(ok?G.g.mode(N):'Servono '+G.r+' giocatori')+'</b></div>';
  if(o){var cur=optOf(i);h+='<div class="gol"><span>'+(isExp(o)?'Espansione · ':'')+esc(o.label)+'</span><div class="gch">'+o.vals.map(function(v){return '<button type="button" data-k="'+o.k+'" data-v="'+esc(v[0])+'" class="'+(v[0]===cur?'on':'')+'">'+esc(v[1])+'</button>'}).join('')+'</div></div>'}
  if(!o||!isExp(o))h+='<div class="gol"><span>Espansione</span><b class="mut">Nessuna espansione disponibile</b></div>';
  $('gp-o').innerHTML=h+'</div>';
  [].forEach.call($('gp-o').querySelectorAll('.gch button'),function(b){b.onclick=function(){var u=A.ui();u.opts=u.opts||{};u.opts[G.id]=b.dataset.v;[].forEach.call(b.parentNode.children,function(x){x.classList.toggle('on',x===b)})}});
  $('gp-v').style.display='';$('gp-v').textContent='Regole';
  var busy=A.busy();
  $('gp-go').disabled=!ok||!!busy;$('gp-go').style.opacity=ok&&!busy?1:.4;$('gp-go').textContent=busy?'Partita in corso':ok?'Proponi al tavolo':'Servono '+G.r;
  $('gpage').classList.add('on');$('gpage').setAttribute('aria-hidden','false');$('gpage').scrollTop=0;
}
function closePage(){$('gpage').classList.remove('on');$('gpage').setAttribute('aria-hidden','true');if(cur&&cur.unpop)cur.unpop();PAGE=-1}
function closeList(){$('glist').classList.remove('on');$('glist').setAttribute('aria-hidden','true')}
$('gl-x').onclick=closeList;$('gp-x').onclick=closePage;
$('gp-v').onclick=function(){if(PAGE>=0)A.act('rules',GAMES[PAGE].id)};
$('gp-go').onclick=function(){if(PAGE<0)return;var i=PAGE;if(!okG(i)||A.busy())return;PENDSEL=selSummary(i);closePage();closeList();E.propose(i);PENDSEL=''};
$('glq').addEventListener('input',function(){var q=this.value.trim().toLowerCase();[].forEach.call($('gl-grid').children,function(el){if(el.dataset.i!=null)el.style.display=!q||GAMES[+el.dataset.i].t.toLowerCase().indexOf(q)>=0?'':'none';else el.style.display=q?'none':''})});

$('open').onclick=function(){openList()};


/* ================= motore: collega la scena 3D ai dati veri dell'app ================= */
var E={};
var ocam=new T.OrthographicCamera(-1,1,1,-1,1,400),cam=ocam;
var cur=null,area=null,busy=false,CACHE={},azOff=0;
function toast(s){var t=$('l3dtoast');t.textContent=s;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('on')},1900)}
function rid(){return Math.random().toString(36).slice(2,10)}
var NAME=A.ME().name||'';
/* ---- aspetto: av3 (pupazzo 3D) <-> av (pupazzetto a pixel delle altre lobby) ---- */
var HEADS=['beret','crown','hood','elmo','none','top'];
function hx(c){return parseInt(String(c).slice(1),16)}
function avTo3(av,av3,i){if(av3&&typeof av3==='object')return normFig(av3);var a=av||{},C=A.avc(),S0=A.avs();
  var H=C[(a.h!=null?a.h:i)%C.length],Cc=C[(a.c!=null?a.c:i+3)%C.length],sk=S0[(a.s||0)%S0.length],hd=HEADS[(a.t||0)%HEADS.length];
  return normFig({robe:hx(Cc[0]),skin:hx(sk),head:hd,hatc:hx(H[0]),hair:hd==='none'?'short':'bald',hairc:hx(H[1]||H[0])})}
function near(list,c){var best=0,bd=1e9;list.forEach(function(x,k){var v=hx(Array.isArray(x)?x[0]:x),d=Math.abs((v>>16)-(c>>16))+Math.abs((v>>8&255)-(c>>8&255))+Math.abs((v&255)-(c&255));if(d<bd){bd=d;best=k}});return best}
function pixFrom3(o){var t={beret:0,crown:1,hood:2,elmo:3,none:4,top:5,brim:5,bandana:0,fiori:4}[o.head];return{t:t==null?4:t,h:near(A.avc(),o.head==='none'?o.hairc:o.hatc),c:near(A.avc(),o.robe),s:near(A.avs(),o.skin)}}
function myLook(){var m=A.R().mine;if(m.av3)return normFig(m.av3);var s=null;try{s=JSON.parse(A.ST('rg-av3')||'null')}catch(e){}if(s)return normFig(s);return avTo3(m.av,null,0)}
E.saveLook=function(){var o=Object.assign({},FIG[6]);delete o.hat;var m=A.R().mine;m.av3=o;m.av=pixFrom3(o);A.ST('rg-av3',JSON.stringify(o));A.ST('rg-av',JSON.stringify(m.av));A.save()};
/* ---- aree ---- */
function build(n){if(n==='ing')return sceneSolo();if(n==='bosco')return sceneBosco();ROOM=A.R().on?A.R().code||'…':'—';FIG[6]=myLook();var S=sceneLocanda3();return S}
function uiFor(n){var room=n!=='ing';$('login').classList.toggle('show',!room);$('sbar').classList.toggle('show',room);$('chat').classList.toggle('show',room);$('sim').classList.toggle('show',n==='loc');
  ['zbar','vote','cust','zpg','juke'].forEach(function(x){$(x).classList.remove('show')});closePage();closeList();closeRooms();$('chat').classList.remove('open')}
/* pupazzi remoti: vanno tolti dalla scena a cui appartengono (le scene restano in cache), altrimenti al ritorno ne compare uno fermo accanto a quello che cammina */
function clearWalkers(){Object.keys(walk).forEach(function(id){var W=walk[id],S0=W.S||cur;try{(S0?S0.g:W.f.parent).remove(W.f)}catch(e){}if(W.tag){W.tag.el.remove();if(S0){var k=S0.tags.indexOf(W.tag);if(k>=0)S0.tags.splice(k,1)}}});walk={};peopleSig=''}
function disposeScene(S0){if(!S0)return;var keys=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap','bumpMap','aoMap'];
  S0.g.traverse(function(o){if(o.geometry&&o.geometry.dispose)o.geometry.dispose();var m=o.material;if(m)(Array.isArray(m)?m:[m]).forEach(function(mm){keys.forEach(function(k){if(mm[k]&&mm[k].dispose)mm[k].dispose()});if(mm.dispose)mm.dispose()})});
  S0.tags.forEach(function(t){t.el.remove()});S0.tags.length=0}
function setArea(n,instant){
  var doit=function(){
    clearWalkers();
    if(cur){scene.remove(cur.g);cur.tags.forEach(function(t){t.el.dataset.d=t.el.style.display;t.el.style.display='none'})}
    var S=CACHE[n]||(CACHE[n]=build(n));cur=S;area=n;
    S.tags.forEach(function(t){t.el.style.display=t.el.dataset.d||''});
    cam=S.ortho?ocam:camera;scene.add(S.g);scene.background=new T.Color(S.bg);scene.fog.color.set(S.bg);scene.fog.density=S.fog;renderer.toneMappingExposure=S.exp;
    uiFor(n);if(S.onEnter)S.onEnter();peopleSig='';walk={};sync();
    if(n==='loc'||n==='bosco')E.movedTo(S.pos,false,true);
    requestAnimationFrame(function(){$('fade').style.opacity=0;busy=false});
  };
  if(instant){doit();return}
  busy=true;$('fade').style.opacity=1;setTimeout(doit,500);
}
function goArea(n){if(!busy)setArea(n)}
/* ---- ingresso: nome e seduta ---- */
$('myname').value=NAME;
$('myname').addEventListener('input',function(){NAME=this.value});
$('myname').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();e.stopPropagation();$('enter').click()}},true);
$('enter').onclick=function(){
  if(busy)return;NAME=$('myname').value.trim().slice(0,14);if(!NAME){toast('Scrivi il tuo nome nel modulo');$('myname').focus();return}
  $('myname').blur();busy=true;
  var fin=function(){busy=false;toast('Ciao, '+NAME);A.act('setname')};
  if(cur&&cur.enter)cur.enter(fin);else fin();
};
/* ---- persone: ospiti seduti al tavolo, altri telefoni liberi di camminare ---- */
var peopleSig='',walk={},seenChat={},chatInit=false,seenEmo={},jukeT=0;
function figKey(dev,k){return dev+'|'+k}
function sync(){
  if(!cur||area==='ing')return;
  var R0=A.R(),me=A.ME(),M0=A.members(),seats=A.seats(),list=[],walkers=[];
  var seenSeat={};
  seats.forEach(function(s,i){if(s.dev===me.dev&&s.k==='m')return;if(seenSeat[figKey(s.dev,s.k)])return;seenSeat[figKey(s.dev,s.k)]=1;var m=M0.find(function(x){return x.id===s.dev})||{},gu=s.k==='m'?m:((m.guests||[]).find(function(x){return x.k===s.k})||{});
    var o=avTo3(gu.av,gu.av3,i+1),p=s.k==='m'&&m.pos3;
    var e={id:figKey(s.dev,s.k),name:s.name,o:o,guest:s.k!=='m',owner:m.name,sig:s.name+JSON.stringify(o)};
    if(p&&!p.sit&&s.dev!==me.dev)walkers.push({e:e,p:p});else list.push(e)});
  if(cur.setPeople){var sg=list.map(function(x){return x.id+x.sig}).join('|');if(sg!==peopleSig){peopleSig=sg;cur.setPeople(list)}}
  // camminatori remoti nell'area corrente
  var live={};walkers.forEach(function(w){if(w.p.a!==area)return;live[w.e.id]=1;var W=walk[w.e.id];
    if(!W||W.sig!==w.e.sig){if(W){cur.g.remove(W.f);W.tag.el.remove();cur.tags.splice(cur.tags.indexOf(W.tag),1)}
      var f=figure(w.e.o);f.scale.setScalar(.55);f.position.set(w.p.x,0,w.p.z);cur.g.add(f);var tg=addTag(cur,new T.Vector3(0,4.3,0),esc(w.e.name),'');tg.follow=f;W=walk[w.e.id]={f:f,tag:tg,sig:w.e.sig,x:w.p.x,z:w.p.z,S:cur}}
    W.tx=w.p.x;W.tz=w.p.z});
  Object.keys(walk).forEach(function(id){if(!live[id]){var W=walk[id];cur.g.remove(W.f);W.tag.el.remove();var k=cur.tags.indexOf(W.tag);if(k>=0)cur.tags.splice(k,1);delete walk[id]}});
  // info in basso
  var N=seats.length,gs=(R0.mine.guests||[]).length;
  $('sinfo').textContent=(R0.on?R0.code:'Su questo telefono')+' · '+N+(N===1?' giocatore':' giocatori');$('simn').textContent=gs;
  if(cur.boxes)cur.boxes.forEach(function(b,i){if(b)b.material=okG(i,N)?b.userData.mat:b.userData.gm});
  // chat vera della stanza
  (R0.chat||[]).forEach(function(x){if(seenChat[x.id])return;seenChat[x.id]=1;if(!chatInit&&Date.now()-x.t>20000)return;
    chatPush(x.name,x.text,x.dev===me.dev?'me':'');bubbleFor(figKey(x.dev,x.k||'m'),x.text.length>40?x.text.slice(0,39)+'…':x.text)});chatInit=true;
  // emote
  M0.forEach(function(m){Object.keys(m.emo||{}).forEach(function(k){var em=m.emo[k];if(!em||seenEmo[m.id+k]===em.t)return;seenEmo[m.id+k]=em.t;if(Date.now()-em.t<6000)bubbleFor(figKey(m.id,k),em.e)})});
  // jukebox condiviso: vince l'ultimo che ha scelto
  var J=null,Jby='';M0.forEach(function(m){if(m.juke&&(!J||m.juke.t>J.t)){J=m.juke;Jby=m.name}});
  if(J&&J.t!==jukeT){var first=!jukeT;jukeT=J.t;if(J.i!==MUS.cur){musPlay(J.i);if(!first)chatPush('',(Jby||'Qualcuno')+(J.i>=0?' mette su «'+TRACKS[J.i].n+'»':' spegne il jukebox'),'sys')}}
  MUS.mute=!A.Snd().mus;musVol(MUS.vol);A.duck(MUS.cur>=0&&!MUS.mute);
  // errori dell'app
  var er=A.ui().err;if(er&&er!==E.lastErr)toast(er);E.lastErr=er;
  if(area==='loc'&&ROOM!==roomLabel())roomChanged();
  if($('roomp').classList.contains('on'))renderRooms();
}
function bubbleFor(id,text){var me=A.ME(),f=null;if(id===figKey(me.dev,'m'))f=cur.me;else if(walk[id])f=walk[id].f;else if(cur.npc){var n=cur.npc.find(function(x){return x.id===id&&!x.out});if(n)f=n.f}
  if(!f)return;var o=addTag(cur,new T.Vector3(0,4.9,0),esc(text),'bub sm');o.follow=f;setTimeout(function(){o.el.remove();var k=cur.tags.indexOf(o);if(k>=0)cur.tags.splice(k,1)},4200)}
function roomLabel(){var R0=A.R();return R0.on?R0.code||'…':'—'}
function roomChanged(){var now=roomLabel(),soft=ROOM.length<2||now.length<2||ROOM==='…'||ROOM==='—'||now==='…'||now==='—';
  if(soft&&cur&&cur.setRoomSign){ROOM=now;cur.setRoomSign(now);return}
  clearWalkers();var old=[CACHE.loc,CACHE.bosco];delete CACHE.loc;delete CACHE.bosco;seenChat={};chatInit=false;$('clog').innerHTML='';
  setArea('loc');setTimeout(function(){old.forEach(function(S0){if(S0&&S0!==cur)disposeScene(S0)})},900)}
E.sendChat=function(v){var R0=A.R();if(!R0.on){toast('La chat funziona nelle stanze online');return}A.ui().cm=v;A.act('chatsend')};
/* ---- posizione: la mando agli altri telefoni (al massimo ogni ~0,6 s) ---- */
var posT=0;
E.movedTo=function(p,sit,quiet){var R0=A.R();if(!R0.on)return;var q=(!sit&&cur&&cur.pos)?cur.pos:p;sendPos(q.x,q.z,!!sit,quiet)};
var ps={x:1e9,z:1e9,t:0};
function sendPos(x,z,sit,quiet){var R0=A.R();if(!R0.on)return;ps.x=x;ps.z=z;ps.t=performance.now();R0.mine.pos3={a:area,x:+x.toFixed(2),z:+z.toFixed(2),sit:!!sit,t:Date.now()};
  clearTimeout(posT);posT=setTimeout(function(){A.savePos()},quiet?400:0)}
/* mentre cammino mando la posizione vera ogni ~0,45 s (e un ultimo assestamento quando mi fermo): gli altri telefoni seguono lo stesso percorso */
function posStream(S,now){if(area==='ing'||!S.pos||S.sit||!A.R().on)return;var d=Math.hypot(S.pos.x-ps.x,S.pos.z-ps.z);
  if(d>.4&&now-ps.t>450)sendPos(S.pos.x,S.pos.z,false);else if(d>.03&&now-ps.t>1000)sendPos(S.pos.x,S.pos.z,false)}
function walkersTick(dt){Object.keys(walk).forEach(function(id){var W=walk[id],dx=W.tx-W.x,dz=W.tz-W.z,L0=Math.hypot(dx,dz),f=W.f;
  if(L0>.05){var st=Math.min(L0,Math.max(6.5,L0*2.6)*dt);W.x+=dx/L0*st;W.z+=dz/L0*st;f.rotation.y=Math.atan2(dx,dz);f.position.y=Math.abs(Math.sin(performance.now()/80))*.09}else f.position.y=0;
  if(L0>40){W.x=W.tx;W.z=W.tz}f.position.x=W.x;f.position.z=W.z})}
/* ---- proposta di gioco condivisa: 30 secondi, ✓/✗ visibili a tutti ---- */
var seenProp={},doneProp={},lastVoteSig='';
function activeProp(){var best=null,now=Date.now();A.members().forEach(function(m){var P=m.prop;if(!P||!P.id||doneProp[P.id])return;if(!seenProp[P.id]){if(now-P.t>90000)return;seenProp[P.id]=now}
  if(now-seenProp[P.id]>34000)return;if(!best||P.t>best.t)best=Object.assign({dev:m.id},P)});return best}
E.propose=function(i){var G=GAMES[i],R0=A.R(),me=A.ME();if(!okG(i))return;if(A.busy()){toast('C’è già una partita in corso');return}
  var o=A.defOpts(G.id),sel=PENDSEL||selSummary(i);
  if(!R0.on||A.members().length<2){cur.setGame&&cur.setGame(i,NAME);toast('Si gioca a '+G.t+'!');setTimeout(function(){A.start(G.id,o)},1100);return}
  if(activeProp()){toast('C’è già una proposta in corso');return}
  var id=rid();R0.mine.prop={id:id,g:G.id,o:o,sel:sel,t:Date.now(),by:R0.mine.name||me.name};R0.mine.pv={id:id,a:true};A.save();
};
function myAnswer(v){var P=activeProp();if(!P)return;var R0=A.R();R0.mine.pv={id:P.id,a:v};A.save()}
var VRES=null;
E.voteTick=function(dt){
  var P=activeProp(),el=$('vote'),me=A.ME();
  if(!P){if(VRES&&Date.now()-VRES.t<3200)return;if(VRES&&!VRES.ok&&cur.clearGame)cur.clearGame();VRES=null;if(el.classList.contains('show')){el.classList.remove('show');lastVoteSig=''}return}
  var gi=GAMES.findIndex(function(G){return G.id===P.g});if(gi<0)return;
  if(cur.shownProp!==P.id){cur.shownProp=P.id;cur.setGame&&cur.setGame(gi,P.by);chatPush('',P.by+' propone '+GAMES[gi].t+' ('+(P.sel||'')+'): 30 secondi per votare','sys')}
  var ppl=A.members().map(function(m){var a=m.pv&&m.pv.id===P.id?m.pv.a:null,ng=(m.guests||[]).length;return{n:(m.name||'?')+(ng?' +'+ng:''),a:a,me:m.id===me.dev}});
  var left=Math.max(0,30-(Date.now()-seenProp[P.id])/1000),ok=ppl.every(function(p){return p.a===true}),no=ppl.some(function(p){return p.a===false}),end=ok||no||left<=0;
  if(end){doneProp[P.id]=1;VRES={t:Date.now(),ok:ok};
    if(ok)chatPush('','Tutti d’accordo: si gioca a '+GAMES[gi].t+'!','sys');else chatPush('','Proposta bocciata: '+ppl.filter(function(p){return p.a!==true}).map(function(p){return p.n}).join(', ')+(left<=0&&!no?' non ha risposto':' non ci sta'),'sys');
    renderVote(P,gi,ppl,0,true,ok);
    if(P.dev===me.dev){var R0=A.R();R0.mine.prop=null;R0.mine.pv=null;if(ok){A.save();setTimeout(function(){A.start(P.g,P.o)},700)}else A.save()}
    return}
  var mine=(ppl.find(function(p){return p.me})||{}).a,sig=P.id+JSON.stringify(ppl)+mine;
  if(sig!==lastVoteSig){lastVoteSig=sig;renderVote(P,gi,ppl,left,false,false,mine)}
  else{var vt=el.querySelector('.vt'),vb=el.querySelector('.vbar i');if(vt){vt.textContent=Math.ceil(left)+'s';vb.style.width=(left/30*100)+'%'}}
};
function renderVote(P,gi,ppl,left,end,ok,mine){var el=$('vote'),G=GAMES[gi],gs=(A.R().mine.guests||[]).length;
  el.innerHTML='<div class="vh"><img alt="" src="'+cover(gi)+'"><div><small>'+esc(P.by)+' propone</small><b>'+esc(G.t)+'</b><em>'+esc(P.sel||'')+'</em></div><span class="vt">'+(end?'':Math.ceil(left)+'s')+'</span></div>'+
    '<div class="vbar"><i style="width:'+(end?0:left/30*100)+'%"></i></div>'+
    '<div class="vp">'+ppl.map(function(p){var c=p.a===true?'y':p.a===false?'n':'w';return '<span class="'+c+'">'+(p.a===true?'✓':p.a===false?'✗':'…')+' '+esc(p.n)+'</span>'}).join('')+'</div>'+
    (end?'<div class="vres '+(ok?'y':'n')+'">'+(ok?'Si gioca a '+esc(G.t)+'!':'Proposta bocciata')+'</div>':
     (mine==null?'<div class="vbtn"><button type="button" class="btn ghost" data-v="0">✗ Rifiuto</button><button type="button" class="btn" data-v="1">✓ Accetto</button></div>':'<div class="vwait">Hai votato '+(mine?'✓':'✗')+(gs?' anche per i tuoi ospiti':'')+'. Si aspetta il resto del tavolo…</div>'));
  el.classList.add('show');[].forEach.call(el.querySelectorAll('[data-v]'),function(b){b.onclick=function(){myAnswer(b.dataset.v==='1')}})}
/* ---- jukebox condiviso ---- */
E.setJuke=function(i){musPlay(i);var R0=A.R();R0.mine.juke={i:i,t:Date.now()};jukeT=R0.mine.juke.t;chatPush('',(NAME||'Tu')+(i>=0?' mette su «'+TRACKS[i].n+'»':' spegne il jukebox'),'sys');if(R0.on)A.save()};
/* ---- la stanza: persone, ospiti, inviti, cambio stanza ---- */
function openRooms(focus){renderRooms(true);$('roomp').classList.add('on');$('roomp').setAttribute('aria-hidden','false');if(focus)setTimeout(function(){var i=$(focus);if(i)i.focus()},60)}
function closeRooms(){$('roomp').classList.remove('on');$('roomp').setAttribute('aria-hidden','true')}
function renderRooms(full){var R0=A.R(),me=A.ME(),M0=A.members(),rp=$('rp-body');
  var ppl=M0.map(function(m){return '<div class="rpm"><b>'+esc(m.name||'?')+(m.id===me.dev?' (tu)':'')+'</b>'+(m.id!==me.dev&&R0.on?'<button type="button" class="rx" data-a="rmmember" data-v="'+esc(m.id)+'" aria-label="Rimuovi '+esc(m.name)+'">✕</button>':'')+'</div>'+
    (m.guests||[]).map(function(g){return '<div class="rpm g"><span>'+esc(g.name)+' <small>ospite di '+esc(m.name||'?')+'</small></span>'+(m.id===me.dev?'<button type="button" class="rx" data-a="rmguest" data-v="'+esc(g.k)+'" aria-label="Rimuovi '+esc(g.name)+'">✕</button>':'')+'</div>'}).join('')}).join('');
  if(!full&&rp){var pl=$('rp-ppl');if(pl)pl.innerHTML=ppl;return}
  $('rp-body').innerHTML=(R0.on?'<p>Sei nella stanza <b>'+esc(R0.code||'…')+'</b>.</p><button type="button" class="btn ghost" data-a="copy">Copia invito</button>':'<p>Non riesco a collegarmi per il gioco online. Intanto potete giocare su questo telefono con gli ospiti.</p><button type="button" class="btn ghost" data-a="retrynet">Riprova il collegamento</button>')+
    '<h4>Al tavolo</h4><div id="rp-ppl">'+ppl+'</div>'+
    '<div class="rrow"><input id="gname" maxlength="14" placeholder="Nome ospite" autocomplete="off"><button type="button" class="btn" data-a="addguest">+ Ospite</button></div><small class="hint">Gli ospiti giocano su questo telefono: ve lo passate a ogni turno.</small>'+
    (R0.on?'<h4>Entra nella stanza di un amico</h4><div class="rrow"><input id="jc" maxlength="6" placeholder="CODICE" autocomplete="off" autocapitalize="characters" spellcheck="false"><button type="button" class="btn" data-a="join">Entra</button></div><button type="button" class="btn ghost" data-a="newroom">Crea una stanza nuova</button>':'')+
    (A.canResume()?'<button type="button" class="btn" data-a="resume">Riprendi la partita interrotta</button>':'')}
$('rtog').onclick=function(){openRooms()};$('rp-x').onclick=closeRooms;
$('sim-p').onclick=function(){openRooms('gname')};
$('sim-m').onclick=function(){var g=(A.R().mine.guests||[]).slice(-1)[0];if(g)A.act('rmguest',g.k)};
/* ---- input: tocca per camminare o scegliere ---- */
var ptr=null,ray=new T.Raycaster(),ndc=new T.Vector2();
stage.addEventListener('pointerdown',function(e){ptr={x:e.clientX,y:e.clientY,t:performance.now()};A.audioKick()});
stage.addEventListener('pointerup',function(e){
  if(!ptr)return;var p=ptr;ptr=null;
  if(cur&&cur.zoom>=0&&cur.pageStep&&Math.abs(e.clientX-p.x)>45&&Math.abs(e.clientX-p.x)>Math.abs(e.clientY-p.y)){cur.pageStep(e.clientX<p.x?1:-1);return}
  if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>10||busy||!cur||!cur.walkTo)return;
  var r=stage.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
  ray.setFromCamera(ndc,cam);var h=ray.intersectObjects(cur.hit,false).filter(function(x){for(var o=x.object;o;o=o.parent)if(!o.visible)return false;return true});
  if(h.length&&h[0].object.userData.item!=null)cur.walkTo(h[0].object.position,h[0].object.userData.item,h[0].object);
  else if(cur.floor){var f=ray.intersectObject(cur.floor,false);if(f.length)cur.walkTo(f[0].point,null)}
});
stage.addEventListener('pointercancel',function(){ptr=null});
/* ---- ciclo ---- */
var FMIN=1000/(+A.ST('rg-3dfps')||40)-4,v3=new T.Vector3(),raf=0,fpsN=0,fpsT=0,fpsChecked=A.ST('rg-3dforce')==='1';
function frame(now){
  raf=0;if(!E.on||document.hidden)return;raf=requestAnimationFrame(frame);
  if(now-(frame.l||0)<FMIN)return;
  var t=now/1000,S=cur,c=S.cam;
  var w=app.clientWidth||390,h=app.clientHeight||844,dt=Math.min(.05,(now-(frame.l||now))/1000);frame.l=now;
  if(!fpsChecked){if(frame.p&&now-frame.p>600){fpsT=0;fpsN=0}frame.p=now;if(!fpsT)fpsT=now;fpsN++;if(now-fpsT>4500){fpsChecked=true;var fps=fpsN*1000/(now-fpsT);if(fps<12){A.fallback('Il 3D è troppo lento su questo telefono: passo alla taverna semplice.');return}}}
  adaptQuality(now);
  if(renderer.domElement.width!==Math.round(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
  var wantE=S.view&&S.view.exp?S.view.exp:S.exp;renderer.toneMappingExposure+=(wantE-renderer.toneMappingExposure)*Math.min(1,dt*4);
  if(S.view){if(camera.fov!==50){camera.fov=50;camera.updateProjectionMatrix()}if(!S.vp){S.vp=S.view.pos.clone();S.vl=S.view.look.clone()}var za=Math.min(1,dt*4);S.vp.lerp(S.view.pos,za);S.vl.lerp(S.view.look,za);camera.position.copy(S.vp);camera.lookAt(S.vl);cam=camera}
  else{cam=ocam;var hw=c.fitW/2,hh=hw*h/w;ocam.left=-hw;ocam.right=hw;ocam.top=hh;ocam.bottom=-hh;ocam.updateProjectionMatrix();
    ocam.position.set(c.tx+Math.sin(c.az)*120*Math.cos(c.el),c.ty+Math.sin(c.el)*120,c.tz+Math.cos(c.az)*120*Math.cos(c.el));ocam.lookAt(c.tx,c.ty,c.tz)}
  var fk=RM?.2:1;
  S.fires.forEach(function(s){var p=s.userData.ph,k=s.scale.y>1.5?1:.34;s.scale.set((1.7+Math.sin(t*9+p)*.28*fk)*(k<1?.34:1),(2.6+Math.sin(t*11+p*2)*.5*fk)*(k<1?.34:1),1);s.position.y=s.userData.base.y+Math.sin(t*7+p)*.12*fk*(k<1?.3:1);s.material.opacity=(k<1?.7:.55)+Math.sin(t*13+p)*.15*fk});
  S.flick.forEach(function(f){f.l.intensity=f.b*(1+f.a*fk*(Math.sin(t*17+f.p)+Math.sin(t*9.3+f.p)*.7))});
  if(S.fx)for(var fi=0;fi<S.fx.length;fi++)S.fx[fi](t,dt);if(S.tick)S.tick(t,dt);
  if(area!=='ing'){walkersTick(dt);posStream(S,now);if(area!=='loc')E.voteTick(dt)}
  var tg=S.tags;for(var i=0;i<tg.length;i++){var o=tg[i];if(o.follow){v3.set(o.follow.position.x,o.follow.position.y+o.pos.y,o.follow.position.z)}else v3.copy(o.pos);v3.project(cam);
    o.el.style.transform='translate('+Math.round((v3.x*.5+.5)*w)+'px,'+Math.round((-v3.y*.5+.5)*h)+'px) translate(-50%,-100%)'}
  renderer.render(scene,cam);
}
/* qualità adattiva: se il telefono non regge (dopo un rientro dal background, scaldato…), prima si abbassa la risoluzione e poi si tolgono le ombre.
   Solo in discesa e solo per questa sessione; i tempi di background (salti tra un frame e l'altro) non contano. */
var aq={n:0,t:0,low:0};
function adaptQuality(now){if(!fpsChecked)return;if(aq.p&&now-aq.p>600){aq.n=0;aq.t=0;aq.low=0}aq.p=now;if(!aq.t){aq.t=now;aq.n=0}aq.n++;
  if(now-aq.t<2500)return;var f=aq.n*1000/(now-aq.t);aq.n=0;aq.t=now;
  if(f>=22){aq.low=0;return}if(++aq.low<2)return;aq.low=0;
  var pr=renderer.getPixelRatio();
  if(pr>1){renderer.setPixelRatio(Math.max(1,pr-.5))}
  else if(renderer.shadowMap.enabled){renderer.shadowMap.enabled=false;scene.traverse(function(o){var m=o.material;if(m)(Array.isArray(m)?m:[m]).forEach(function(x){x.needsUpdate=true})})}}
function loop(){if(!raf&&E.on){frame.l=0;raf=requestAnimationFrame(frame)}}
document.addEventListener('visibilitychange',function(){fpsT=0;fpsN=0;frame.p=0;if(!document.hidden)loop()});
/* ---- chiamate dall'app a ogni render ---- */
E.show=function(screen){
  E.on=true;app.style.display='';
  if(screen==='name'){if(area!=='ing'){CACHE={};setArea('ing',true)}var inv=A.inv();$('lq').textContent=inv?'Sei invitato alla stanza '+inv+'. Come ti chiami?':'Benvenuto! Come ti chiami?';$('enter').textContent=inv?'Siediti al tavolo':'Siediti'}
  else{if(area==='ing'||!area)setArea('loc',area!=='ing');else sync()}
  loop();
};
E.hide=function(){if(cur&&cur.clearGame&&!activeProp())cur.clearGame();E.on=false;app.style.display='none';if(MUS.ctx)musPlay(-1);jukeT=0;A.duck(false)};
E.sync=function(){if(E.on)sync()};
E.go=function(n){goArea(n)};E.openJuke=function(){openJuke()};
return E;

   })(A);
   state='ready';return true;
  }catch(e){console.error('Taverna 3D',e);state='fail';if(wrap)wrap.remove();wrap=null;return false}
 }
 function hide(){if(E)E.hide();if(wrap)wrap.style.display='none'}
 return{
  ok:()=>state==='ready'||(state==='idle'&&!!window.THREE&&hasGL()),
  show:screen=>{if(!boot()){if(ui.lobby==='3d'){ui.lobby='iso';render()}return}wrap.style.display='';E.show(screen)},
  hide,dbg:()=>E,
 };
})();
