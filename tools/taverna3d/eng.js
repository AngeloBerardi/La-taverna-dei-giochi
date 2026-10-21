
/* ================= motore: collega la scena 3D ai dati veri dell'app ================= */
var E={};
var ocam=new T.OrthographicCamera(-1,1,1,-1,1,400),cam=ocam;
var cur=null,area=null,busy=false,CACHE={},azOff=0;
function toast(s){var t=$('toast');t.textContent=s;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('on')},1900)}
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
function activeProp(){var best=null,now=Date.now();A.members().forEach(function(m){var P=m.prop;if(!P||!P.id||P.k==='stop'||doneProp[P.id])return;if(!seenProp[P.id]){if(now-P.t>90000)return;seenProp[P.id]=now}
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
