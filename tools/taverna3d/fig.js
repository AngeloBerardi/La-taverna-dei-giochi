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
