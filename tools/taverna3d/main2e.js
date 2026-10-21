
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
    el.innerHTML='<div class="ch"><h3>'+(bath?'Lo specchio':'Il guardaroba')+'</h3><div><button type="button" class="x" id="crnd">Casuale</button> <button type="button" class="x" id="cspin">Gira</button> <button type="button" class="x save" id="cdone2">Salva ed esci</button></div></div>'+
      '<div class="ctabs">'+MY.map(function(t){return '<button type="button" data-t="'+t[0]+'" class="'+(t[0]===S.ctab?'on':'')+'">'+t[1]+'</button>'}).join('')+'</div>'+
      '<div class="cscroll">'+tab[3].map(function(r){return row(r[0],r[1])}).join('')+(S.ctab==='viso'&&S.cust==='bath'?'<button type="button" class="btn ghost" id="wash">Lavati la faccia</button>':'')+'</div><button type="button" class="btn" id="cdone">Salva ed esci</button>';
    [].forEach.call(el.querySelectorAll('.ctabs button'),function(b){b.onclick=function(){S.ctab=b.dataset.t;renderCust()}});
    [].forEach.call(el.querySelectorAll('.sw'),function(b){b.onclick=function(){var f=b.dataset.f,v=OPT[f][+b.dataset.k],val=typeof v==='number'?v:v[0];FIG[6][f]=val;if(!updateFigure(me,f,val))rebuildMe();[].forEach.call(b.parentNode.children,function(x){x.classList.toggle('on',x===b)})}});
    $('cspin').onclick=function(){S.spin=1};
    $('crnd').onclick=function(){var FS=[];MY.forEach(function(t){t[3].forEach(function(r){FS.push(r[1])})});FS.forEach(function(f){var L=OPT[f],v=L[Math.floor(Math.random()*L.length)];FIG[6][f]=typeof v==='number'?v:v[0]});FIG[6].hat=null;rebuildMe();renderCust();S.spin=.6};
    var w=$('wash');if(w)w.onclick=function(){rebuildMe();say(me,'Splash! Pulito.')};
    var done=function(){document.body.classList.remove('cust-open');E.saveLook();var kd=S.cust;S.cust=null;S.view=null;S.vp=null;tu.el.style.visibility='';$('sim').classList.add('show');el.classList.remove('show');$('sbar').classList.add('show');$('chat').classList.add('show');chatPush('',(NAME||'Tu')+' esce dal '+(kd==='bath'?'bagno':'guardaroba')+' con un look nuovo','sys')};$('cdone').onclick=done;$('cdone2').onclick=done;
  }
  S.openCust=function(kind){S.cust=kind;S.ctab=kind==='bath'?'viso':'abiti';
    var dir=new T.Vector3(-S.pos.x,0,-S.pos.z).normalize(),cp=S.pos.clone().addScaledVector(dir,13.5);cp.y=3.8;
    me.rotation.y=faceTo(S.pos.x,S.pos.z,cp.x,cp.z);S.view={pos:cp,look:new T.Vector3(S.pos.x,-1.9,S.pos.z)};document.body.classList.add('cust-open');S.vp=null;tu.el.style.visibility='hidden';$('sim').classList.remove('show');renderCust();$('cust').classList.add('show');$('sbar').classList.remove('show');$('chat').classList.remove('show')};

  return S;
}
