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
