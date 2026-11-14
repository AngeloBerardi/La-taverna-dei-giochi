/* ---- Compagnia di ventura (piano C): la battaglia campale in 3D. Disegno, ciclo e gesti; le regole stanno in VCAM (motori/28l). ----
   Ciclo: 10 istanti al secondo di logica (×1, ×2), 60 fotogrammi interpolati. Ogni soldato è una figura a istanze con passo,
   affondo, caduta; frecce in volo ad arco, polvere, stendardi dei gruppi, muro e torri negli assedi.
   Tocchi: sul campo = il capitano va lì; su un nemico = lo attacca; trascina = sposta la visuale; pizzico = zoom.
   Bottega comune: `VenArte` (24ht). HUD e pulsanti: `Ven` (24hw). Piano: docs/VENTURA.md. */
const VenCampo=(()=>{
 const K={s:null,scene:null,cam:null,fuoco:{x:30,y:0,z:80},alt:38,segue:true,acc:0,pausa:false,vel:1,t:0,U:{},frecce:[],numeri:[],lampo:0,scossa:0,gruppo:'tutti'};
 const hh=(x,y,s)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 function apri(scheda,o){const T=VenArte.T,A=VenArte,C=VCAM.C;K.s=VCAM.nuovo(scheda,o);K.scheda=scheda;K.U={};K.frecce=[];K.numeri=[];K.acc=0;K.pausa=true;K.vel=1;K.t=0;K.gruppo='tutti';K.segue=true;K.finita=false;
  if(K.scene)K.scene.traverse(q=>{if(q.geometry)q.geometry.dispose()});
  const semeT=(scheda.seme|0)&255,sc=K.scene=new T.Scene(),bio=scheda.bioma||0,bosco=scheda.terreno===2,s=K.s;K.cam=A.camera();K.luce=A.luce(sc);
  const PAL=bio===1?['#eef3f6','#dfe9ef','#cddbe4']:bio===2?['#d2bf62','#c6b25a','#bcb65c']:['#78ad49','#6fa445','#83b750'];sc.background=new T.Color(bio===1?'#b9c8d4':bio===2?'#a89a58':'#4f8240');
  // ---- terreno: prato a chiazze dentro il campo, dossi fuori ----
  const pos=[],col=[],N=72,x0=-40,z0=-40,pw=(C.W+80)/N,ph=(C.H+80)/N,alto=(x,z)=>{const fx=Math.max(0,-x,x-C.W),fz=Math.max(0,-z,z-C.H),f=Math.min(1,Math.max(fx,fz)/14);return f*f*(1.5+hh(x/6,z/6,3)*5)+(hh(x*2,z*2,9)-.5)*.06};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const P=(a,b)=>{const x=x0+(i+a)*pw,z=z0+(j+b)*ph;return[x,alto(x,z),z]},a=P(0,0),b=P(1,0),c=P(0,1),d=P(1,1);
   for(const t of((i+j)%2?[[a,c,b],[b,c,d]]:[[a,c,d],[a,d,b]])){const cx=(t[0][0]+t[1][0]+t[2][0])/3,cz=(t[0][2]+t[1][2]+t[2][2])/3,n=VEN.alt(semeT,cx/2.2+40,cz/2.2+40),k=new T.Color(PAL[n<.42?0:n<.56?1:2]);if(VEN.alt(semeT+3,cx/1.3,cz/1.3)>.63)k.lerp(new T.Color(bio===1?'#b9c6cf':'#9c8a5a'),.55);k.offsetHSL(0,0,(hh(cx*3,cz*3,6)-.5)*.035);
    if(bosco)k.lerp(new T.Color('#4a7a38'),.35);for(const v of t){pos.push(v[0],v[1],v[2]);col.push(k.r,k.g,k.b)}}}
  const gt=new T.BufferGeometry();gt.setAttribute('position',new T.Float32BufferAttribute(pos,3));gt.setAttribute('color',new T.Float32BufferAttribute(col,3));gt.computeVertexNormals();const terra=new T.Mesh(gt,A.mat);terra.receiveShadow=true;sc.add(terra);
  // ---- ciuffi, fiori, sassi, alberi ai margini (e radi nel campo se è bosco) ----
  const ciuffo=A.Solidi().cono(.16,.42,4,0,0,0,'#ffffff').cono(.12,.34,4,.16,0,.06,'#f0f0f0').cono(.11,.3,4,-.12,0,.1,'#e6e6e6').geo();
  const pino=A.Solidi().cil(.14,.2,.9,5,0,0,0,'#6b4a2e').cono(1.0,1.5,6,0,.7,0,'#3f7a3a',{c2:'#4f9247'}).cono(.78,1.3,6,0,1.6,0,'#478743',{c2:'#5aa14f'}).cono(.5,1.1,6,0,2.5,0,'#52964b',{c2:'#73b862'}).geo();
  const lati=A.Solidi().cil(.18,.24,1.1,5,0,0,0,'#6e4d30').sfera(1.1,0,1.9,0,'#5fa046').sfera(.8,.6,2.6,.2,'#74b653').sfera(.75,-.6,2.4,-.3,'#69aa4c').geo();
  const sasso=A.Solidi().sfera(.5,0,.2,0,'#9a948c').sfera(.34,.36,.14,.16,'#857f78').geo();
  const liste={ciuffo:[],pino:[],lati:[],sasso:[]},semeD=(scheda.seme|0)&1023;
  for(let k=0;k<700;k++){const x=hh(k,1,semeD)*(C.W+50)-25,z=hh(k,2,semeD)*(C.H+50)-25,q=hh(k,3,semeD);liste.ciuffo.push([x,alto(x,z),z,.7+q,bio===1?[.86,.93,.98]:bio===2?[.78,.7,.34]:q<.12?[1,.86,.4]:q<.2?[.95,.5,.5]:[.36+q*.2,.62+q*.2,.26]])}
  for(let k=0;k<(bosco?150:90);k++){let x=hh(k,4,semeD)*(C.W+70)-35,z=hh(k,5,semeD)*(C.H+70)-35;const dentro=x>-2&&x<C.W+2&&z>-2&&z<C.H+2;if(dentro&&!(bosco&&k%4===0))continue;if(s.muro&&Math.abs(z-s.muro)<8)continue;
   const q=hh(k,6,semeD),tipo=bio===1?'pino':q<.45?'pino':'lati';liste[tipo].push([x,alto(x,z)-.05,z,.8+q*.9,bio===1?[.9,1.05,1.08]:bio===2?[1,.92,.6]:[.85+q*.3,.95,.8+q*.2]])}
  for(let k=0;k<40;k++){const x=hh(k,7,semeD)*(C.W+50)-25,z=hh(k,8,semeD)*(C.H+50)-25;liste.sasso.push([x,alto(x,z),z,.5+hh(k,9,semeD)*1.4,[1,1,1]])}
  const d=new T.Object3D();for(const[nome,geo]of[['ciuffo',ciuffo],['pino',pino],['lati',lati],['sasso',sasso]]){const Ls=liste[nome];if(!Ls.length)continue;const me=new T.InstancedMesh(geo,A.matI,Ls.length);me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(Ls.length*3),3);
   Ls.forEach((p,k)=>{d.position.set(p[0],p[1],p[2]);d.rotation.set(0,hh(k,10,semeD)*6.28,0);d.scale.setScalar(p[3]);d.updateMatrix();me.setMatrixAt(k,d.matrix);me.instanceColor.setXYZ(k,p[4][0],p[4][1],p[4][2])});me.castShadow=nome!=='ciuffo';me.frustumCulled=false;sc.add(me)}
  // ---- assedio: mura merlate con i varchi, torri, mastio alle spalle ----
  if(s.muro){const S=A.Solidi(),m=s.muro,p='#aaa49b',p2='#cfc8bc',F=VDAT.FAZ[scheda.fazb]||VDAT.FAZ.fer;let x=-12;const tratti=[];for(const v of s.varchi){tratti.push([x,v[0]]);x=v[1]}tratti.push([x,C.W+12]);
   for(const[a,b]of tratti){const w=b-a;S.box(w,3.4,1.6,(a+b)/2,0,m,p,{c2:p2});for(let k=0;k<Math.floor(w/1.6);k++)S.box(.8,.7,.5,a+.6+k*1.6,3.4,m+.5,p2);S.box(w,.3,1.2,(a+b)/2,2.5,m-1.3,'#8a6a48')}
   for(const v of s.varchi)for(const e of v){S.cil(1.3,1.5,5.2,8,e+(e===v[0]?-1.1:1.1),0,m,p,{c2:p2});S.cono(1.7,1.8,8,e+(e===v[0]?-1.1:1.1),5.2,m,F.col)}
   for(const v of s.varchi){const cx=(v[0]+v[1])/2;S.box(v[1]-v[0],.5,1.8,cx,4.2,m,p2);S.box(.5,2.6,.3,v[0]+.4,0,m+1.6,'#6b4a2e',{ry:.5});S.box(.5,2.6,.3,v[1]-.4,0,m+1.6,'#6b4a2e',{ry:-.5})}
   S.box(14,8,10,C.W/2,0,m-22,p,{c2:p2});S.tetto(15,4,11,C.W/2,8,m-22,F.col);for(const ox of[-8,8]){S.cil(2.2,2.5,11,8,C.W/2+ox,0,m-17,p,{c2:p2});S.cono(2.9,3.4,8,C.W/2+ox,11,m-17,F.col)}
   for(let k=0;k<7;k++){const hx=6+hh(k,1,77)*(C.W-12),hz=m-6-hh(k,2,77)*9;S.box(3,2,2.6,hx,0,hz,'#e9dfc6');S.tetto(3.5,1.6,2.9,hx,2,hz,'#b0703c')}sc.add(S.mesh())}
  K.fig=A.Schiera(sc,170);K.ste=A.Stendardi(sc,10);K.par=A.Particelle(sc,320);
  K.fre=new T.InstancedMesh(new T.BoxGeometry(.07,.07,1.1),new T.MeshBasicMaterial({color:'#f4ecd8'}),90);K.fre.count=0;K.fre.frustumCulled=false;sc.add(K.fre);
  const anello=(c,r)=>{const m=new T.Mesh(new T.RingGeometry(r,r+.16,22),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.95,depthTest:false}));m.rotation.x=-Math.PI/2;m.renderOrder=5;m.visible=false;sc.add(m);return m};
  K.anCap=anello('#ffd75a',.8);K.anMeta=anello('#fff2b0',.5);K.anBers=anello('#ff5a4a',.85);
  const c=VCAM.capU(s);if(c){K.fuoco.x=c.x;K.fuoco.z=c.y-9}K.ora=scheda.notte?22.5:10+hh(semeD,1,2)*6;return s}
 const FAZ=(l)=>VDAT.FAZ[l==='a'?(K.scheda.faza||'tu'):K.scheda.fazb]||VDAT.FAZ.pre;
 function eventi(ev){const s=K.s;for(const e of ev){
   if(e.t==='colpo'){const a=K.U[e.da],b=K.U[e.a],ub=s.u.find(u=>u.id===e.a);if(a&&!e.freccia)a.colpo=K.t;if(b&&e.dan>0){b.lampo=K.t;if(ub){for(let k=0;k<(e.crit?5:2);k++)K.par.emetti(ub.x,1+Math.random()*.5,ub.y,{vx:(Math.random()-.5)*3,vy:2+Math.random()*2,vz:(Math.random()-.5)*3,g:9,s:.13,dur:.5,col:e.crit?'#ffe27a':'#ffffff'})}}
    const cap=VCAM.capU(s);if(ub&&cap&&(e.da===cap.id||e.a===cap.id)&&e.dan>0&&K.numeri.length<7)K.numeri.push({x:ub.x,z:ub.y,v:e.dan,t:K.t,cls:e.a===cap.id?'male':e.crit?'crit':''});
    if(cap&&e.a===cap.id&&e.dan>0){K.scossa=.25}if(e.crit)suono('avv-critico');else if(e.dan>0&&(e.da===s.cap||e.a===s.cap))suono('avv-colpo-taglio')}
   else if(e.t==='tiro'){K.frecce.push({x0:e.x0,z0:e.y0,x1:e.x1,z1:e.y1,t0:K.t,dur:e.vt/10/K.vel,ok:e.colpito});const a=K.U[e.da];if(a)a.colpo=K.t}
   else if(e.t==='ko'){const u=s.u.find(u=>u.id===e.id);if(u){for(let k=0;k<6;k++)K.par.emetti(u.x+(Math.random()-.5),.2,u.y+(Math.random()-.5),{vy:.8,s:.22,dur:.8,col:'#d8c8a4',cresce:1.3});if(e.cap){K.lampo=.5;suono('avv-cade')}}}
   else if(e.t==='grido'){K.lampo=.25;for(let k=0;k<26;k++){const an=k/26*6.28;K.par.emetti(e.x,.4,e.y,{vx:Math.cos(an)*7,vz:Math.sin(an)*7,vy:.4,s:.24,dur:.7,col:'#ffe27a'})}suono('avv-livello')}
   else if(e.t==='rinforzi')Ven.avviso(e.l==='a'?'Arrivano i tuoi rinforzi':'Rinforzi nemici in campo');
   else if(e.t==='rotta')Ven.avviso(e.l==='a'?'I tuoi uomini sono in rotta!':'Il nemico è in rotta!');
   else if(e.t==='cap-ko')Ven.avviso('Sei caduto: gli uomini combattono senza di te');
   else if(e.t==='fine'){K.finita=true;suono(e.vince==='a'?'avv-fanfara':'avv-lamento')}}}
 const suono=n=>{try{Snd.play(n)}catch(e){}};
 function passo(dt){const s=K.s;if(!s||!K.scene)return;const T=VenArte.T,A=VenArte,C=VCAM.C;K.t+=dt;
  if(!K.pausa&&!s.fine){K.acc+=dt*10*K.vel;let n=0;while(K.acc>=1&&n++<6){K.acc-=1;eventi(VCAM.passo(s,1))}if(K.acc>1)K.acc=0}
  const al=s.fine||K.pausa?1:Math.min(1,K.acc),cap=VCAM.capU(s);
  K.fig.inizio();K.ste.inizio();const cen={a:{f:[0,0,0],t:[0,0,0],c:[0,0,0]},b:{f:[0,0,0],t:[0,0,0],c:[0,0,0]}};let caduti=0;
  for(let i=s.u.length-1;i>=0;i--){const u=s.u[i];if(u.st==='via')continue;let q=K.U[u.id];if(!q)q=K.U[u.id]={f:Math.random(),yaw:u.l==='a'?Math.PI:0,giu:0,colpo:-9,lampo:-9};
   const x=u.st==='ko'?u.x:u.px+(u.x-u.px)*al,z=u.st==='ko'?u.y:u.py+(u.y-u.py)*al,mosso=Math.hypot(u.x-u.px,u.y-u.py);
   if(u.st==='ko'){q.giu=Math.min(1,q.giu+dt*3.2);if(++caduti>46&&q.giu>=1)continue}else{if(mosso>.02)q.f+=dt*(u.c==='c'||u.cav?3.2:2.6)*K.vel*(K.pausa?0:1);const ya=Math.atan2(u.fx,u.fy);let da=ya-q.yaw;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;q.yaw+=da*Math.min(1,dt*12)}
   const F=FAZ(u.l),tc=K.t-q.colpo;
   K.fig.metti({x,y:0,z,yaw:q.yaw,sc:u.cap?1.75:1.48,col:u.cap?VDAT.FAZ.tu.col:F.col,col2:u.cap?'#fff4d6':F.col2,cls:u.cap?'k':u.c,liv:u.cap?5:u.liv,cav:u.cav,fase:mosso>.02&&u.st!=='ko'?q.f:0,colpo:tc<.32?tc/.32:0,giu:q.giu,lampo:K.t-q.lampo<.09,seme:u.id});
   if(u.st==='vivo'&&!u.cap){const g=cen[u.l][u.c];g[0]+=x;g[1]+=z;g[2]++}
   if(u.st==='fuga'&&Math.random()<dt*2)K.par.emetti(x,.1,z,{vy:.4,s:.16,dur:.6,col:'#d8c8a4',cresce:1});
   else if(mosso>.3&&Math.random()<dt*6)K.par.emetti(x,.1,z,{vy:.5,s:.18,dur:.7,col:K.scheda.bioma===1?'#ffffff':'#d8c8a4',cresce:1.2})}
  K.fig.fine();
  for(const l of['a','b'])for(const g of['f','t','c']){const c=cen[l][g];if(c[2]>1)K.ste.metti(c[0]/c[2],0,c[1]/c[2]+(l==='a'?1.2:-1.2),FAZ(l).col,1.8,K.t,g.charCodeAt(0)+(l==='a'?0:9))}
  if(cap&&cap.st==='vivo'){const cx=cap.px+(cap.x-cap.px)*al,cz=cap.py+(cap.y-cap.py)*al;K.ste.metti(cx-.9,0,cz+.6,VDAT.FAZ.tu.col,2.3,K.t,3);K.anCap.visible=true;K.anCap.position.set(cx,.08,cz);
   if(cap.vx!=null){K.anMeta.visible=true;K.anMeta.position.set(cap.vx,.08,cap.vy);const sp=1+Math.sin(K.t*6)*.2;K.anMeta.scale.set(sp,sp,sp)}else K.anMeta.visible=false;
   const b=cap.ob>=0?s.u.find(u=>u.id===cap.ob&&u.st==='vivo'):null;if(b){K.anBers.visible=true;K.anBers.position.set(b.x,.09,b.y)}else K.anBers.visible=false;
   if(K.segue){const k=Math.min(1,dt*4);K.fuoco.x+=(cx-K.fuoco.x)*k;K.fuoco.z+=(cz-7-K.fuoco.z)*k}}
  else{K.anCap.visible=K.anMeta.visible=K.anBers.visible=false}
  K.ste.fine();
  // frecce ad arco
  {const d=new T.Object3D();let n=0;for(let i=K.frecce.length-1;i>=0;i--){const f=K.frecce[i],q=(K.t-f.t0)/Math.max(.08,f.dur);if(q>=1){if(!f.ok)K.par.emetti(f.x1+(Math.random()-.5)*1.5,.1,f.z1+(Math.random()-.5)*1.5,{vy:.3,s:.1,dur:.4,col:'#cfc4a8'});K.frecce.splice(i,1);continue}
    if(n>=90)continue;const L=Math.hypot(f.x1-f.x0,f.z1-f.z0),hm=1.3+L*.16,x=f.x0+(f.x1-f.x0)*q,z=f.z0+(f.z1-f.z0)*q,y=1.3+4*hm*q*(1-q)-q*.4,vy=4*hm*(1-2*q);
    d.position.set(x,y,z);d.rotation.set(0,0,0);d.lookAt(x+(f.x1-f.x0),y+vy,z+(f.z1-f.z0));d.updateMatrix();K.fre.setMatrixAt(n++,d.matrix)}K.fre.count=n;K.fre.instanceMatrix.needsUpdate=true}
  K.par.passo(dt);
  K.fuoco.x=Math.max(4,Math.min(C.W-4,K.fuoco.x));K.fuoco.z=Math.max(2,Math.min(C.H-2,K.fuoco.z));
  const L=K.luce.ora(K.ora,{x:C.W/2,y:0,z:K.fuoco.z},48);K.lampo=Math.max(0,K.lampo-dt*1.6);K.scossa=Math.max(0,K.scossa-dt);
  const sx=K.scossa>0?(Math.random()-.5)*K.scossa*2:0;
  A.disegna(K.scene,K.cam,{x:K.fuoco.x+sx,y:0,z:K.fuoco.z+sx},K.alt,{notte:L.notte,lampo:K.lampo*.5});
  numeri()}
 function numeri(){const host=document.querySelector('.vn-etc');if(!host)return;const A=VenArte;let h='';K.numeri=K.numeri.filter(n=>K.t-n.t<.8);
  for(const n of K.numeri){const q=(K.t-n.t)/.8,p=A.aSchermo(K.cam,n.x,2.2+q*2.4,n.z);h+='<i class="vn-num '+n.cls+'" style="left:'+Math.round(p.x)+'px;top:'+Math.round(p.y)+'px;opacity:'+(1-q*q).toFixed(2)+'">'+n.v+'</i>'}
  if(host._h!==h){host.innerHTML=h;host._h=h}}
 function trascina(dx,dy){const A=VenArte,r=A.cv.getBoundingClientRect(),u=K.alt/r.height;K.fuoco.x-=dx*u;K.fuoco.z-=dy*u/A.SE;K.segue=false}
 function pizzico(f){K.alt=Math.max(24,Math.min(80,K.alt/f))}
 function tocco(px,py){const A=VenArte,s=K.s;if(!s||s.fine)return null;const r=A.cv.getBoundingClientRect();let m=null,md=26;
  for(const u of s.u){if(u.l!=='b'||u.st!=='vivo')continue;const c=A.aSchermo(K.cam,u.x,.9,u.y),d=Math.hypot(c.x-(px-r.left),c.y-(py-r.top));if(d<md){md=d;m=u}}
  if(m)return VCAM.capitano(s,{b:m.id});const g=A.aTerra(K.cam,px,py,0);return VCAM.capitano(s,{x:g.x,y:g.z})}
 const centra=()=>{K.segue=true};
 return{K,apri,passo,trascina,pizzico,tocco,centra}})();
