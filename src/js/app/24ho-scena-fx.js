/* ---- Scena 3D, parte viva (A12): miniature, particelle, animazioni e agganci alla battaglia. Estende Scena3D (24hn-scena3d.js). ----
   Le miniature vengono da AMIN (motori/28g), fuse in una sola mesh con colori per vertice. Le animazioni seguono i passi di ACRO.effetti (come BatAnima sul DOM):
   BatAnima.passo chiama Scena3D.passo(x, s, f, rid). Due ritmi: le animazioni brevi (tween, scoppi, dardi) disegnano a ogni fotogramma; l'ambiente (fuochi,
   fumo, torce, corvi, respiro) a ~12 fps e solo se la scena ha qualcosa che si muove. Il caso è usato solo per la grafica (mai per il gioco). */
(()=>{
 const S=Scena3D,K=S.K;
 let T=null,tex=null;
 const FG=new Map(),TW=[],EM=[],UCC=[];let FA=null,FS=null,FE=null,UCCG=null;
 const R=(a,b)=>a+Math.random()*(b-a),ora=()=>performance.now();
 // ---- particelle: tre sistemi (ambiente additivo, fumo, effetti additivi) con un solo Points ciascuno ----
 const VS='attribute vec4 col;attribute float size;uniform float px;varying vec4 vC;void main(){vC=col;gl_PointSize=size*px;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  FSH='uniform sampler2D map;varying vec4 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC.rgb,vC.a*t.a);if(gl_FragColor.a<.004)discard;}';
 function morbida(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.7)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new T.CanvasTexture(c)}
 function sistema(N,add){const g=new T.BufferGeometry(),pos=new Float32Array(N*3),col=new Float32Array(N*4),size=new Float32Array(N);
  g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('col',new T.BufferAttribute(col,4));g.setAttribute('size',new T.BufferAttribute(size,1));
  const m=new T.ShaderMaterial({uniforms:{px:{value:1},map:{value:tex}},vertexShader:VS,fragmentShader:FSH,transparent:true,depthWrite:false,blending:add?T.AdditiveBlending:T.NormalBlending});
  const pts=new T.Points(g,m);pts.frustumCulled=false;pts.renderOrder=6;const p=[];for(let i=0;i<N;i++)p.push({a:1,l:0,x:0,y:-999,z:0,vx:0,vy:0,vz:0,gy:0,s0:1,s1:1,c0:[1,1,1],c1:[1,1,1],a0:1});
  return{N,pts,pos,col,size,p,i:0,viva:0,g}}
 // una particella: posizione, velocità, vita (s), dimensione (unità del mondo) iniziale→finale, colore iniziale→finale, opacità, gravità
 function emetti(S_,x,y,z,vx,vy,vz,l,s0,s1,c0,c1,a0,gy){const q=S_.p[S_.i];S_.i=(S_.i+1)%S_.N;S_.viva++;q.a=0;q.l=l;q.x=x;q.y=y;q.z=z;q.vx=vx;q.vy=vy;q.vz=vz;q.s0=s0;q.s1=s1;q.c0=c0;q.c1=c1;q.a0=a0;q.gy=gy||0}
 function aggiorna(S_,dt){let viva=0;for(let i=0;i<S_.N;i++){const q=S_.p[i];
   if(q.a>=q.l){S_.size[i]=0;S_.col[i*4+3]=0;continue}
   q.a+=dt;viva++;const u=Math.min(1,q.a/q.l);q.vy+=q.gy*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;
   S_.pos[i*3]=q.x;S_.pos[i*3+1]=q.y;S_.pos[i*3+2]=q.z;S_.size[i]=q.s0+(q.s1-q.s0)*u;
   S_.col[i*4]=q.c0[0]+(q.c1[0]-q.c0[0])*u;S_.col[i*4+1]=q.c0[1]+(q.c1[1]-q.c0[1])*u;S_.col[i*4+2]=q.c0[2]+(q.c1[2]-q.c0[2])*u;S_.col[i*4+3]=q.a0*Math.pow(1-u,1.4)*Math.min(1,u*8)}
  S_.viva=viva;S_.g.attributes.position.needsUpdate=S_.g.attributes.col.needsUpdate=S_.g.attributes.size.needsUpdate=true;return viva}
 S.creaFx=function(){T=S.T;tex=morbida();FA=sistema(900,true);FS=sistema(260,false);FE=sistema(700,true);UCCG=new T.Group();K.g.fx.add(FA.pts,FS.pts,FE.pts,UCCG)};
 S.resetFx=function(){for(const f of FG.values())S_libera(f);FG.clear();TW.length=0;EM.length=0;if(FA){for(const s of[FA,FS,FE])for(const q of s.p)q.a=q.l=1;}};
 const S_libera=f=>{if(f.g.parent)f.g.parent.remove(f.g);f.g.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material&&c.material!==K.mat.lum)c.material.dispose()})};
 // ---- colori degli effetti per tipo di danno ----
 const FX={taglio:{c0:[1,.96,.88],c1:[.75,.7,.62],n:9,v:34},perforante:{c0:[1,.96,.88],c1:[.75,.7,.62],n:9,v:34},contundente:{c0:[.95,.9,.8],c1:[.6,.55,.5],n:11,v:30,peso:1},
  fuoco:{c0:[1,.85,.35],c1:[.95,.22,.04],n:30,v:58,su:34},gelo:{c0:[.92,.99,1],c1:[.45,.72,1],n:24,v:48,su:16},fulmine:{c0:[1,1,.75],c1:[.5,.7,1],n:26,v:76},
  necrotico:{c0:[.85,.62,1],c1:[.3,.08,.5],n:24,v:40,su:26},radioso:{c0:[1,.97,.65],c1:[1,.72,.2],n:28,v:44,su:42},veleno:{c0:[.72,1,.42],c1:[.2,.5,.1],n:22,v:32,su:30},
  cura:{c0:[.8,1,.8],c1:[.3,.85,.4],n:16,v:16,su:44},arcano:{c0:[.95,.75,1],c1:[.5,.3,1],n:22,v:50,su:20}};
 function scoppio(x,y,z,tipo,crit){const d=FX[tipo]||FX.taglio,n=Math.round(d.n*(crit?1.7:1));
  for(let i=0;i<n;i++){const a=R(0,Math.PI*2),e=R(-.25,1),v=R(.35,1)*d.v*(crit?1.25:1);emetti(FE,x,y,z,Math.cos(a)*v*(1-e*.4),R(.2,1)*(d.su||22)+e*v*.5,Math.sin(a)*v*.8*(1-e*.4),R(.35,.75),R(5,8)*(crit?1.3:1),1,d.c0,d.c1,.95,d.peso?-120:(d.su?-30:-70))}}
 // ---- tween ----
 function tween(dur,f,fine,ritardo){const t={t0:ora()+(ritardo||0),dur:Math.max(1,dur),f,fine};TW.push(t);S.sporca();return t}
 const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
 // ---- miniature ----
 const cols=(c,asp)=>{asp=asp||{};const pe=(c.razza==='orco'?Eroi.PELLE_ORCO:Eroi.PELLE)[asp.pelle|0]||Eroi.PELLE[0];return{pelle:pe,capelli:Eroi.CAPELLI[asp.capelli|0]||Eroi.CAPELLI[0],mantello:Eroi.MANTELLO[asp.mantello|0]||Eroi.MANTELLO[0]}};
 const firma=c=>(K.px?'p':'')+(c.lato==='eroi'?'e|'+c.razza+'|'+c.classe+'|'+JSON.stringify((Bat.aspetti||{})[c.id]||0):'m|'+c.def);
 // nella resa pixel (B2) le miniature hanno le proporzioni «da bambola» di AMIN (arma e scudo più grandi, gambe sottili)
 function modello(c){const o={bambola:!!K.px};if(c.lato==='eroi'){const a=(Bat.aspetti||{})[c.id]||{};return AMIN.eroe(c.razza,c.classe,cols(c,a),a.capelli|0,o)}
  const m=typeof BEST!=='undefined'&&BEST.M[c.def];return AMIN.mostro(c.def,!!(m&&m.capo),o)}
 const FS_=1.3;   // le miniature sono un po' più grandi del vero per leggersi su un telefono
 function costruisciFig(c){const m0=modello(c),m=Object.assign({},m0,{parti:AMIN.scala(m0.parti,FS_),alt:m0.alt*FS_,base:Object.assign({},m0.base,{r:m0.base.r*FS_})}),A=S.V(),E=S.V();for(const p of m.parti)S.pezzo(p[10]==='e'?E:A,p,0,0,0,0,1,p[10]==='e'?1:1,p[10]==='e'?0:.55,false);
  const mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.04,flatShading:true,envMapIntensity:.7});mat.userData.mio=true;
  mat.userData.lum=!!m.lum;if(m.lum){mat.transparent=true;mat.opacity=.8;mat.emissive.setRGB(.125,.19,.25)}
  const g=new T.Group(),body=S.mesh(A,mat);body.castShadow=true;body.receiveShadow=false;
  if(E.pos.length){const l=S.mesh(E,S.K.mat.lum,{cast:false,rec:false});body.add(l)}
  // base: anello scuro + disco del colore della fazione (oro per gli eroi)
  const b=new T.Group(),r=m.base.r,cb=new T.Color(m.base.col);cb.convertSRGBToLinear&&!(T.ColorManagement&&T.ColorManagement.enabled)&&cb.convertSRGBToLinear();
  const ring=new T.Mesh(new T.CylinderGeometry(r+1.4,r+2.4,2.6,20),new T.MeshStandardMaterial({color:0x2a1c10,roughness:.8,flatShading:true})),top=new T.Mesh(new T.CylinderGeometry(r,r+.2,.9,20),new T.MeshStandardMaterial({color:cb,roughness:.45,metalness:.35,envMapIntensity:1}));
  ring.position.y=1.3;top.position.y=2.7;ring.castShadow=ring.receiveShadow=true;b.add(ring,top);
  if(m.base.capo){const rr=new T.Mesh(new T.CylinderGeometry(r+3.4,r+3.8,1.6,24),new T.MeshStandardMaterial({color:0xd6aa3c,roughness:.35,metalness:.7,envMapIntensity:1.2}));rr.position.y=.9;b.add(rr)}
  body.position.y=2.9;g.add(b,body);
  // materiali a bande (luce di contorno calda sugli eroi, fredda sui nemici; maschera delle figure per la rifinitura): contano solo nella resa pixel
  const rim=c.lato==='eroi'?'eroi':'nemici';S.bande(mat,{maschera:.5,rim});S.tinta(mat.userData.bande.uRim.value,[ASCE.RIM[rim],ASCE.RIM.forza]);
  b.traverse(o=>{if(o.material)S.bande(o.material,{maschera:.5})});
  return{id:c.id,sig:firma(c),g,body,mat,alt:m.alt+3,r,rot:0,occ:0,dy:0,x:0,y:0,z:0,ph:Math.random()*6.28,ko:false,nasc:false,fiamme:false,veleno:false,stordito:false,lato:c.lato,classe:c.classe,def:c.def,sca:1}}
 const pos3=(s,c)=>{const p=ASCE.pos('bat',c.q,c.r);return{x:p.x,z:p.z,y:AGRI.alt(s.arena,c)?ASCE.QUOTA.rialzo:0}};
 function metti(f){f.g.position.set(f.x,f.y+f.dy,f.z);f.g.rotation.y=f.rot;f.g.scale.setScalar(f.sca)}
 function posa(f,ko){f.ko=ko;f.body.rotation.z=ko?-1.5:0;f.body.position.y=ko?5:2.9;f.body.position.x=ko?-f.r*.4:0}
 function stati(f,c){const st=new Set((c.stati||[]).map(z=>z.id));f.fiamme=st.has('in-fiamme');f.veleno=st.has('avvelenato');f.stordito=st.has('stordito');f.gelo=st.has('congelato');const n=st.has('nascosto');
  if(n!==f.nasc){f.nasc=n;f.mat.transparent=n||f.mat.userData.lum;f.mat.opacity=n?.38:1;f.mat.needsUpdate=true}}
 S.sincFigure=function(modo){
  if(modo!=='bat'){for(const f of FG.values())S_libera(f);FG.clear();return}
  const s=Bat.s;if(!s)return;const vivi=new Set();
  for(const c of s.cb){if(!ASCO.inCampo(c))continue;vivi.add(c.id);let f=FG.get(c.id);if(f&&f.sig!==firma(c)){S_libera(f);FG.delete(c.id);f=null}
   if(!f){f=costruisciFig(c);FG.set(c.id,f);K.g.fig.add(f.g);const p=pos3(s,c);f.x=p.x;f.y=p.y;f.z=p.z;metti(f)}
   const giu=c.hp<=0;if(f.occ<=0&&!segue()){const p=pos3(s,c);f.x=p.x;f.y=p.y;f.z=p.z;metti(f)}if(giu!==f.ko&&f.occ<=0)posa(f,giu);stati(f,c)}
  for(const [id,f] of FG)if(!vivi.has(id)&&f.occ<=0){S_libera(f);FG.delete(id)}}
 S.altFig=id=>{const f=FG.get(id);return f?f.alt:30};
 S.nFig=()=>FG.size;
 // le miniature in scena (per i controlli della resa pixel): gruppo, altezza, raggio della base, lato
 S.figure=()=>[...FG.values()].map(f=>({id:f.id,g:f.g,alt:f.alt,r:f.r,lato:f.lato}));
 S.stat=()=>({fa:FA?FA.viva:-1,fs:FS?FS.viva:-1,fe:FE?FE.viva:-1,em:EM.length,fig:FG.size,fuochi:(K.fuochi||[]).length,mat:EM.map(e=>e.k).join(',')});
 // ---- sorgenti d'ambiente (le liste le riempie 24hn): fuochi sul pavimento, torce, camini, falò, corvi ----
 S.sorgenti=function(modo){EM.length=0;while(UCCG&&UCCG.children.length){const c=UCCG.children.pop();c.geometry.dispose();c.material.dispose()}UCC.length=0;
  for(const f of K.fuochi||[])EM.push({k:f.k,x:f.x,y:f.y,z:f.z,acc:Math.random()});
  for(const t of K.torce||[])EM.push({k:t.k==='torcia'?'torcia':t.k==='campo'?'falo':'motivi',x:t.x,y:t.y,z:t.z,acc:Math.random()});
  for(const c of K.camini||[])EM.push({k:'fumo',x:c.x,y:c.y,z:c.z,acc:Math.random()});
  for(const c of K.corvi||[])for(let i=0;i<3;i++){const m=new T.Mesh(new T.BoxGeometry(6,.7,2.2),new T.MeshBasicMaterial({color:0x14141c}));m.frustumCulled=false;UCCG.add(m);UCC.push({m,cx:c.x,cy:c.y,cz:c.z,r:R(16,26),w:R(.6,1.1)*(i%2?1:-1),f:R(0,6.28),ph:R(0,6.28)})}
  K.haDin=true;S.sporca()};
 S.dinamico=()=>K.haDin!==false&&!RM;   // a «riduci animazioni» niente fiamme, fumo, ondeggiare né tremolio: la scena resta ferma
 // ---- ciclo: tween e particelle degli effetti (ogni fotogramma) ----
 S.anima=function(sec,dt){let vivo=false;const t=ora();
  for(let i=TW.length-1;i>=0;i--){const w=TW[i];if(t<w.t0){vivo=true;continue}const u=Math.min(1,(t-w.t0)/w.dur);w.f(u);if(u>=1){TW.splice(i,1);w.fine&&w.fine()}else vivo=true}
  if(FE&&FE.pts){FE.pts.material.uniforms.px.value=FA.pts.material.uniforms.px.value=FS.pts.material.uniforms.px.value=(K.vis?K.vis.k:1)*K.dpr;if(FE.viva||vivo)if(aggiorna(FE,dt)>0)vivo=true}
  return vivo};
 // ---- ambiente (~12 fps): emissioni, respiro, corvi ----
 S.ambiente=function(sec,dt){const d=Math.min(.2,sec-(S.ambiente.l==null?sec:S.ambiente.l));S.ambiente.l=sec;if(!FA)return;
  for(const e of EM){switch(e.k){
    case'fuoco':e.acc+=26*d;while(e.acc>=1){e.acc--;emetti(FA,e.x+R(-14,14),e.y+1.5,e.z+R(-12,12),R(-3,3),R(28,52),0,R(.5,.95),R(8,11),1.5,[1,.82,.35],[.95,.2,.04],.95,0)}break;
    case'veleno':e.acc+=6*d;while(e.acc>=1){e.acc--;emetti(FA,e.x+R(-12,12),e.y+2,e.z+R(-10,10),0,R(8,16),0,R(.9,1.5),R(4,6),9,[.6,.95,.4],[.2,.5,.1],.7,0)}break;
    case'ghiaccio':e.acc+=3*d;while(e.acc>=1){e.acc--;emetti(FA,e.x+R(-12,12),e.y+3,e.z+R(-10,10),0,R(5,10),0,R(1,1.6),R(3,5),0,[.95,1,1],[.5,.8,1],.9,0)}break;
    case'torcia':e.acc+=16*d;while(e.acc>=1){e.acc--;emetti(FA,e.x+R(-1,1),e.y,e.z+R(-1,1),R(-2,2),R(14,26),0,R(.35,.6),R(4,5.5),1,[1,.78,.3],[.9,.25,.05],.95,0)}break;
    case'falo':e.acc+=22*d;while(e.acc>=1){e.acc--;emetti(FA,e.x+R(-2,2),e.y+2,e.z-4+R(-2,2),R(-3,3),R(20,34),0,R(.4,.8),R(6,8),1,[1,.8,.3],[.9,.2,.05],.95,0)}break;
    case'motivi':e.acc+=7*d;while(e.acc>=1){e.acc--;emetti(FA,e.x+R(-14,14),e.y+R(0,6),e.z+R(-12,12),0,R(6,14),0,R(1.2,2),R(3,4.5),0,[.7,.95,1],[.4,.7,1],.8,0)}break;
    case'fumo':e.acc+=3.2*d;while(e.acc>=1){e.acc--;emetti(FS,e.x+R(-1,1),e.y,e.z+R(-1,1),R(3,6),R(10,15),0,R(2.2,3),R(3,4),R(12,16),[.86,.84,.82],[.55,.56,.6],.34,0)}break}}
  for(const f of FG.values()){f.body.scale.y=f.ko?1:1+.016*Math.sin(sec*2.3+f.ph);
   if(f.fiamme){f.fx=(f.fx||0)+22*d;while(f.fx>=1){f.fx--;emetti(FA,f.x+R(-6,6),f.y+f.dy+R(2,f.alt*.8),f.z+R(-4,4),R(-4,4),R(24,44),0,R(.4,.75),R(6,9),1,[1,.8,.3],[.95,.2,.04],.95,0)}}
   if(f.veleno){f.fv=(f.fv||0)+5*d;while(f.fv>=1){f.fv--;emetti(FA,f.x+R(-6,6),f.y+f.dy+R(2,f.alt*.6),f.z+R(-4,4),0,R(10,18),0,R(.9,1.3),R(4,5),7,[.6,.95,.4],[.2,.5,.1],.7,0)}}
   if(f.gelo){f.fg=(f.fg||0)+9*d;while(f.fg>=1){f.fg--;emetti(FA,f.x+R(-6,6),f.y+f.dy+R(2,f.alt*.8),f.z+R(-4,4),R(-2,2),R(6,14),0,R(.7,1.2),R(3,4.5),0,[.95,1,1],[.5,.8,1],.9,0)}}   // B6: gelo azzurro
   if(f.stordito){const a=sec*5+f.ph;for(let k=0;k<3;k++){const b=a+k*2.09;emetti(FA,f.x+Math.cos(b)*7,f.y+f.dy+f.alt+4,f.z+Math.sin(b)*5,0,0,0,.18,4,2,[1,.92,.4],[1,.7,.2],.95,0)}}}
  for(const u of UCC){const a=sec*u.w+u.f;u.m.position.set(u.cx+Math.cos(a)*u.r,u.cy+Math.sin(sec*.9+u.ph)*3,u.cz+Math.sin(a)*u.r*.8);u.m.rotation.y=-a+(u.w>0?Math.PI/2:-Math.PI/2);u.m.rotation.z=Math.sin(sec*9+u.ph)*.5}
  if(FA)aggiorna(FA,Math.max(d,.04));if(FS)aggiorna(FS,Math.max(d,.04));K.sucio=true};
 // ---- animazioni dei passi della battaglia ----
 const fig=id=>FG.get(id);
 const mezzo=f=>({x:f.x,y:f.y+f.dy+f.alt*.55,z:f.z});
 // otto direzioni di sguardo, scattanti (B5): il pixel resta pulito e la figura non ruota di continuo
 const OTTO=Math.PI/4,dir8=(dx,dz)=>Math.round(Math.atan2(dx,dz)/OTTO)*OTTO;
 const volto=(f,x,z)=>{const dx=x-f.x,dz=z-f.z;if(Math.abs(dx)+Math.abs(dz)>.5)f.rot=dir8(dx,dz)};
 // ---- tempo reale (B5): la battaglia a istanti porta a ogni fotogramma le posizioni interpolate { id: { q, r, h, mv, la } } (q, r frazionari,
 // h = quota del rialzo 0..1, mv = sta camminando, la = sta lanciando). Le animazioni procedurali: passo (molleggio e dondolio), lancio (si alza e brilla).
 // Le figure con un'animazione breve in corso (occ > 0: affondo, caduta…) restano a quella; `sincFigure` non le rimette al centro dell'esagono.
 let SEG=0;const segue=()=>ora()-SEG<400;
 S.muovi=function(P,sec){if(!S.on()||K.modo!=='bat')return;SEG=ora();const fermo=typeof RM!=='undefined'&&RM;
  for(const f of FG.values()){const p=P[f.id];if(!p||f.occ>0)continue;const w=ASCE.pos('bat',p.q,p.r),dx=w.x-f.x,dz=w.z-f.z;
   if(dx*dx+dz*dz>.02)f.rot=dir8(dx,dz);f.x=w.x;f.z=w.z;f.y=p.h*ASCE.QUOTA.rialzo;
   const passo=p.mv&&!fermo&&!f.ko,on=p.la&&!fermo&&!f.ko,k=sec*11+f.ph;
   f.dy=passo?Math.abs(Math.sin(k))*2.4:on?2+Math.sin(sec*7)*1.2:0;if(!f.ko)f.body.rotation.z=passo?Math.sin(k)*.08:0;
   if(on||f.brilla){const b=f.mat.userData.lum?[.125,.19,.25]:[0,0,0],g=on?.5+.5*Math.sin(sec*9):0;f.brilla=on;f.mat.emissive.setRGB(b[0]+.34*g,b[1]+.26*g,b[2]+.08*g)}
   metti(f)}
  S.sporca()};
 const MAGICO=new Set(['mago','chierico','bardo']);
 function sposta(x,s,f_,rid){const f=fig(x.chi);if(!f)return;const A=s.arena,pts=x.passi.map(p=>{const q=ASCE.pos('bat',p.q,p.r);return{x:q.x,z:q.z,y:AGRI.alt(A,p)?ASCE.QUOTA.rialzo:0}});
  if(rid||f_<=0){const u=pts[pts.length-1];volto(f,u.x,u.z);f.x=u.x;f.z=u.z;f.y=u.y;metti(f);S.sporca();return}
  const dur=ACRO.MS.passo*f_;f.occ++;
  pts.forEach((p,i)=>{let da=null;tween(dur,u=>{if(!da){da={x:f.x,z:f.z,y:f.y};volto(f,p.x,p.z)}f.x=da.x+(p.x-da.x)*u;f.z=da.z+(p.z-da.z)*u;f.y=da.y+(p.y-da.y)*u;f.dy=Math.sin(u*Math.PI)*3;metti(f)},()=>{f.dy=0;if(i===pts.length-1){f.occ--;metti(f)}},i*dur)})}
 function colpo(f,tipo,ms){if(!f)return;const c=tipo==='cura'?[.1,.42,.17]:[.55,.1,.06],b=f.mat.userData.lum?[.125,.19,.25]:[0,0,0];
  tween(ms||260,u=>{const k=1-u;f.mat.emissive.setRGB(b[0]+c[0]*k,b[1]+c[1]*k,b[2]+c[2]*k)},()=>f.mat.emissive.setRGB(b[0],b[1],b[2]))}
 function scossa(f){if(!f)return;f.occ++;tween(260,u=>{f.body.position.x=Math.sin(u*Math.PI*6)*(1-u)*2.6+(f.ko?-f.r*.4:0)},()=>{f.body.position.x=f.ko?-f.r*.4:0;f.occ--})}
 // B6, il succo: lampo bianco sul colpito e spinta di 1–2 «pixel d'arte» dalla parte opposta a chi colpisce; il critico scuote. PX3 = quanto vale un pixel d'arte nel mondo
 const PX3=1.5;
 function lampo(f,ms){if(!f)return;const b=f.mat.userData.lum?[.125,.19,.25]:[0,0,0];tween(ms||160,u=>{const k=1-u;f.mat.emissive.setRGB(b[0]+.9*k,b[1]+.9*k,b[2]+.9*k)},()=>f.mat.emissive.setRGB(b[0],b[1],b[2]))}
 function colpito(x,rid){const f=fig(x.chi);if(!f)return;if(!rid)lampo(f,x.scossa?220:160);const a=x.da!=null?fig(x.da):null;if(rid||!a||!x.px)return;
  const dx=f.x-a.x,dz=f.z-a.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d,k=x.px*PX3,x0=f.x,z0=f.z;f.occ++;
  tween(x.scossa?240:150,u=>{const e=x.scossa?Math.sin(u*Math.PI*4)*(1-u)*.9+Math.sin(u*Math.PI)*.6:Math.sin(u*Math.PI);f.x=x0+ux*k*e;f.z=z0+uz*k*e;metti(f)},()=>{f.x=x0;f.z=z0;f.occ--;metti(f)})}
 function affondo(f,b,f_){if(!f||!b)return;const dx=b.x-f.x,dz=b.z-f.z,d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d,x0=f.x,z0=f.z;volto(f,b.x,b.z);f.occ++;
  tween(130*f_,u=>{const k=Math.sin(u*Math.PI*.5)*9;f.x=x0+ux*k;f.z=z0+uz*k;f.dy=Math.sin(u*Math.PI)*2;metti(f)},()=>tween(150*f_,u=>{const k=(1-u)*9;f.x=x0+ux*k;f.z=z0+uz*k;f.dy=0;metti(f)},()=>{f.x=x0;f.z=z0;f.occ--;metti(f)}))}
 function proiettile(a,b,magia,col,ms){const t0=ora(),A=mezzo(a),B=mezzo(b),c0=col[0],c1=col[1];let ult=0;
  tween(ms,u=>{const x=A.x+(B.x-A.x)*u,z=A.z+(B.z-A.z)*u,y=A.y+(B.y-A.y)*u+Math.sin(u*Math.PI)*(magia?8:14);
   if(u-ult>.04||u>=1){ult=u;emetti(FE,x,y,z,R(-4,4),R(-4,4),R(-4,4),R(.18,.3),magia?9:5,1,c0,c1,1,0)}
   if(magia)emetti(FE,x+R(-2,2),y+R(-2,2),z+R(-2,2),0,0,0,.14,11,2,c0,c1,.8,0)})}
 S.passo=function(x,s,f_,rid){if(!S.on()||!K.modo||K.modo!=='bat')return;
  try{switch(x.t){
   case'sposta':return sposta(x,s,f_,rid);
   case'compare':{const f=fig(x.chi);if(f&&!rid){f.occ++;f.sca=.01;tween(300*f_,u=>{f.sca=ease(u);metti(f)},()=>{f.sca=1;f.occ--;metti(f)})}return}
   case'dado':{const a=fig(x.chi),b=fig(x.bers);if(!a||!b||a===b||rid)return;const d=Math.hypot(a.x-b.x,a.z-b.z);volto(a,b.x,b.z);
    if(d>62){const mag=a.lato==='eroi'?MAGICO.has(a.classe):(BEST.M[a.def]&&BEST.M[a.def].fam==='torre'||/stregone|officiante/.test(a.def||''));
     proiettile(a,b,mag,mag?(a.lato==='eroi'&&a.classe==='chierico'?[[1,.97,.6],[1,.75,.2]]:[[.85,.7,1],[.45,.3,1]]):[[1,.95,.8],[.8,.7,.5]],Math.max(160,Math.min(380,d*2.2))*f_)}
    else affondo(a,b,f_);return}
   case'numero':{const g=fig(x.chi);if(!g||rid)return;const p=mezzo(g);if(x.v>0){scoppio(p.x,p.y-6,p.z,'cura');colpo(g,'cura',380)}else scoppio(p.x,p.y,p.z,x.tipo,x.crit);return}
   case'scossa':return rid?0:scossa(fig(x.chi));
   case'colpito':return colpito(x,rid);
   case'cade':{const g=fig(x.chi);if(!g)return;if(rid){posa(g,true);S.sporca();return}g.occ++;tween(380*f_,u=>{g.body.rotation.z=-1.5*ease(u);g.body.position.y=2.9+2.1*u;g.body.position.x=-g.r*.4*u},()=>{g.occ--;g.ko=true});return}
   case'esce':{const g=fig(x.chi);if(!g||rid)return;g.occ++;tween(380*f_,u=>{g.sca=1-ease(u);metti(g)},()=>{g.occ--});return}
   case'turno':{const g=fig(x.chi);if(!g||rid||g.ko)return;g.occ++;tween(320,u=>{g.dy=Math.sin(u*Math.PI)*5;metti(g)},()=>{g.dy=0;g.occ--;metti(g)});return}
  }}catch(e){if(typeof ERR!=='undefined')ERR.n(e,'scena3d-passo')}};
})();
