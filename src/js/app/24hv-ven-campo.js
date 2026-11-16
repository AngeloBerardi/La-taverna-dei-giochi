/* ---- Compagnia di ventura (piano C): la battaglia campale in 3D. Disegno, ciclo e gesti; le regole stanno in VCAM (motori/28l). ----
   Ciclo: 10 istanti al secondo di logica (×1, ×2), 60 fotogrammi interpolati. Ogni soldato è una figura a istanze con passo,
   affondo, caduta; frecce in volo ad arco, polvere, stendardi dei gruppi, muro e torri negli assedi.
   Tocchi: sul campo = il capitano va lì; su un nemico = lo attacca; trascina = sposta la visuale; pizzico = zoom.
   Bottega comune: `VenArte` (24ht). HUD e pulsanti: `Ven` (24hw). Piano: docs/VENTURA.md. */
const VenCampo=(()=>{
 const K={s:null,scene:null,cam:null,fuoco:{x:30,y:0,z:80},alt:38,segue:true,acc:0,pausa:false,vel:1,t:0,U:{},frecce:[],numeri:[],lampo:0,scossa:0,gruppo:'tutti'};
 const hh=(x,y,s)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 function apri(scheda,o){K.esterno=false;K.batt=null;K.seat=0;K.s=VCAM.nuovo(scheda,o);K.scheda=scheda;K.U={};K.frecce=[];K.numeri=[];K.acc=0;K.pausa=true;K.vel=1;K.t=0;K.gruppo='tutti';K.segue=true;K.finita=false;scena();
  const c=VCAM.capU(K.s);if(c){K.fuoco.x=c.x;K.fuoco.z=c.y-9}K.ora=scheda.ora>=0?scheda.ora:scheda.notte?22.5:10+hh((scheda.seme|0)&1023,1,2)*6;return K.s}
 // in compagnia (VenStanza) lo stato arriva da fuori e il tempo lo fa scorrere la stanza: qui si disegna soltanto
 function usa(s,batt){const nuova=K.batt!==batt||!K.scene||!K.esterno;K.s=s;K.batt=batt;K.esterno=true;if(!nuova)return;
  K.scheda={seme:s.seme0,bioma:s.bioma,terreno:s.terreno,notte:s.notte,faza:s.faza,fazb:s.fazb,cola:s.cola,colb:s.colb,scena:s.scena,ora:s.ora};K.U={};K.frecce=[];K.numeri=[];K.acc=0;K.vel=1;K.t=0;K.gruppo='tutti';K.segue=true;K.finita=false;scena();
  const c=VCAM.capU(s,K.seat||0);if(c){K.fuoco.x=c.x;K.fuoco.z=c.y-9}K.ora=s.ora>=0?s.ora:s.notte?22.5:10+hh((s.seme0|0)&1023,1,2)*6}
 const CAPC=['#d98a1f','#2f9bd6','#b455c8','#3fb968'];
 // la scena si può rifare a battaglia in corso (contesto grafico perso): lo stato della battaglia non si tocca
 function scena(){const T=VenArte.T,A=VenArte,C=VCAM.C,scheda=K.scheda;K.frecce=[];
  if(K.scene)K.scene.traverse(q=>{if(q.geometry)q.geometry.dispose()});
  const semeT=(scheda.seme|0)&255,sc=K.scene=new T.Scene(),bio=scheda.bioma||0,bosco=scheda.terreno===2,s=K.s,sn=scheda.scena||{},costa=sn.costa||null,vic=sn.vicino||null,monte=scheda.terreno===3||sn.pend;K.sn=sn;K.fuochi=[];K.cam=A.camera();K.luce=A.luce(sc);
  const PAL=bio===1?['#dfe8ee','#d0dde6','#c0d0dc']:bio===2?['#c4ae5a','#b8a252','#ad9c4c']:bio===3?['#bfae62','#b0a258','#a39850']:['#6fa446','#679b41','#7aae4a'];sc.background=new T.Color(bio===1?'#b9c8d4':bio===2?'#a89a58':'#4f8240');
  // ---- terreno: prato a chiazze dentro il campo, dossi fuori ----
  const pos=[],col=[],N=72,x0=-40,z0=-40,pw=(C.W+80)/N,ph=(C.H+80)/N,vn=(x,y,q)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=hh(xi,yi,q),b=hh(xi+1,yi,q),c=hh(xi,yi+1,q),e=hh(xi+1,yi+1,q);return a+(b-a)*fx+(c-a)*fy+(a-b-c+e)*fx*fy},
   alto=(x,z)=>{const fx=Math.max(0,-x,x-C.W),fz=Math.max(0,-z,z-C.H),f=Math.min(1,Math.max(fx,fz)/14);let y=f*f*(1.5+hh(x/6,z/6,3)*(monte?9:5))+(monte?(vn(x/11+3,z/11+7,semeT)-.5)*2.6:0);
    if(costa){const dc=costa==='e'?x-C.W-1:-1-x;if(dc>0)y=Math.min(y,0)-dc*.34}return y};K.alto=alto;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const P=(a,b)=>{const x=x0+(i+a)*pw,z=z0+(j+b)*ph;return[x,alto(x,z),z]},a=P(0,0),b=P(1,0),c=P(0,1),d=P(1,1);
   for(const t of((i+j)%2?[[a,c,b],[b,c,d]]:[[a,c,d],[a,d,b]])){const cx=(t[0][0]+t[1][0]+t[2][0])/3,cz=(t[0][2]+t[1][2]+t[2][2])/3,n=VEN.alt(semeT,cx/2.2+40,cz/2.2+40),k=new T.Color(PAL[n<.42?0:n<.56?1:2]);if(VEN.alt(semeT+3,cx/1.3,cz/1.3)>.63)k.lerp(new T.Color(bio===1?'#b9c6cf':'#9c8a5a'),.55);k.offsetHSL(0,0,(hh(cx*3,cz*3,6)-.5)*.035);
    if(bosco)k.lerp(new T.Color(bio===1?'#b9cbbf':'#4a7a38'),.35);if(sn.strada&&Math.abs(cx-C.W/2-Math.sin(cz/9)*3.5)<2.1)k.lerp(new T.Color(bio===1?'#b9b0a0':'#b99a6c'),.8);if(costa&&(costa==='e'?cx>C.W-5:cx<5))k.lerp(new T.Color('#e3d3a0'),Math.min(1,((costa==='e'?cx-C.W+5:5-cx))/5));for(const v of t){pos.push(v[0],v[1],v[2]);col.push(k.r,k.g,k.b)}}}
  const gt=new T.BufferGeometry();gt.setAttribute('position',new T.Float32BufferAttribute(pos,3));gt.setAttribute('color',new T.Float32BufferAttribute(col,3));gt.computeVertexNormals();const terra=new T.Mesh(gt,A.mat);terra.receiveShadow=true;sc.add(terra);
  // ---- ciuffi, fiori, sassi, alberi ai margini (e radi nel campo se è bosco) ----
  const ciuffo=A.Solidi().cono(.16,.42,4,0,0,0,'#ffffff').cono(.12,.34,4,.16,0,.06,'#f0f0f0').cono(.11,.3,4,-.12,0,.1,'#e6e6e6').geo();
  const pino=A.Solidi().cil(.14,.2,.9,5,0,0,0,'#6b4a2e').cono(1.0,1.5,6,0,.7,0,'#3f7a3a',{c2:'#4f9247'}).cono(.78,1.3,6,0,1.6,0,'#478743',{c2:'#5aa14f'}).cono(.5,1.1,6,0,2.5,0,'#52964b',{c2:'#73b862'}).geo();
  const lati=A.Solidi().cil(.18,.24,1.1,5,0,0,0,'#6e4d30').sfera(1.1,0,1.9,0,'#5fa046').sfera(.8,.6,2.6,.2,'#74b653').sfera(.75,-.6,2.4,-.3,'#69aa4c').geo();
  const sasso=A.Solidi().sfera(.5,0,.2,0,'#9a948c').sfera(.34,.36,.14,.16,'#857f78').geo();
  const liste={ciuffo:[],pino:[],lati:[],sasso:[]},semeD=(scheda.seme|0)&1023;
  for(let k=0;k<700;k++){const x=hh(k,1,semeD)*(C.W+50)-25,z=hh(k,2,semeD)*(C.H+50)-25,q=hh(k,3,semeD);if(alto(x,z)<-.1)continue;liste.ciuffo.push([x,alto(x,z),z,.7+q,bio===1?[.86,.93,.98]:bio===2?[.78,.7,.34]:q<.12?[1,.86,.4]:q<.2?[.95,.5,.5]:[.36+q*.2,.62+q*.2,.26]])}
  for(let k=0;k<(bosco?150:90);k++){let x=hh(k,4,semeD)*(C.W+70)-35,z=hh(k,5,semeD)*(C.H+70)-35;const dentro=x>-2&&x<C.W+2&&z>-2&&z<C.H+2;if(dentro&&!(bosco&&k%4===0))continue;if(s.muro&&Math.abs(z-s.muro)<8)continue;if(alto(x,z)<-.1||(vic&&z<4&&x>-6&&x<C.W+6))continue;
   const q=hh(k,6,semeD),tipo=bio===1?'pino':q<.45?'pino':'lati';liste[tipo].push([x,alto(x,z)-.05,z,.8+q*.9,bio===1?[.9,1.05,1.08]:bio===2?[1,.92,.6]:[.85+q*.3,.95,.8+q*.2]])}
  for(let k=0;k<(monte?90:40);k++){const x=hh(k,7,semeD)*(C.W+50)-25,z=hh(k,8,semeD)*(C.H+50)-25;if(alto(x,z)<-.1)continue;liste.sasso.push([x,alto(x,z),z,.5+hh(k,9,semeD)*1.4,[1,1,1]])}
  const d=new T.Object3D();for(const[nome,geo]of[['ciuffo',ciuffo],['pino',pino],['lati',lati],['sasso',sasso]]){const Ls=liste[nome];if(!Ls.length)continue;const me=new T.InstancedMesh(geo,A.matI,Ls.length);me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(Ls.length*3),3);
   Ls.forEach((p,k)=>{d.position.set(p[0],p[1],p[2]);d.rotation.set(0,hh(k,10,semeD)*6.28,0);d.scale.setScalar(p[3]);d.updateMatrix();me.setMatrixAt(k,d.matrix);me.instanceColor.setXYZ(k,p[4][0],p[4][1],p[4][2])});me.castShadow=nome!=='ciuffo';me.frustumCulled=false;sc.add(me)}
  // ---- assedio: mura merlate con i varchi, torri, mastio alle spalle ----
  if(s.muro){const S=A.Solidi(),m=s.muro,p='#aaa49b',p2='#cfc8bc',F=VDAT.FAZ[scheda.fazb]||VDAT.FAZ.fer;let x=-12;const tratti=[];for(const v of s.varchi){tratti.push([x,v[0]]);x=v[1]}tratti.push([x,C.W+12]);
   for(const[a,b]of tratti){const w=b-a;S.box(w,3.4,1.6,(a+b)/2,0,m,p,{c2:p2});for(let k=0;k<Math.floor(w/1.6);k++)S.box(.8,.7,.5,a+.6+k*1.6,3.4,m+.5,p2);S.box(w,.3,1.2,(a+b)/2,2.5,m-1.3,'#8a6a48')}
   for(const v of s.varchi)for(const e of v){S.cil(1.3,1.5,5.2,8,e+(e===v[0]?-1.1:1.1),0,m,p,{c2:p2});S.cono(1.7,1.8,8,e+(e===v[0]?-1.1:1.1),5.2,m,F.col)}
   for(const v of s.varchi){const cx=(v[0]+v[1])/2;S.box(v[1]-v[0],.5,1.8,cx,4.2,m,p2);S.box(.5,2.6,.3,v[0]+.4,0,m+1.6,'#6b4a2e',{ry:.5});S.box(.5,2.6,.3,v[1]-.4,0,m+1.6,'#6b4a2e',{ry:-.5})}
   S.box(14,8,10,C.W/2,0,m-22,p,{c2:p2});S.tetto(15,4,11,C.W/2,8,m-22,F.col);for(const ox of[-8,8]){S.cil(2.2,2.5,11,8,C.W/2+ox,0,m-17,p,{c2:p2});S.cono(2.9,3.4,8,C.W/2+ox,11,m-17,F.col)}
   for(let k=0;k<7;k++){const hx=6+hh(k,1,77)*(C.W-12),hz=m-6-hh(k,2,77)*9;S.box(3,2,2.6,hx,0,hz,'#e9dfc6');S.tetto(3.5,1.6,2.9,hx,2,hz,'#b0703c')}sc.add(S.mesh())}
  // ---- il mare, se si combatte sulla riva ----
  if(costa){K.acqua=new T.ShaderMaterial({uniforms:{t:{value:0},luce:{value:1}},vertexShader:'varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'precision highp float;varying vec3 vP;uniform float t;uniform float luce;void main(){float d='+(costa==='e'?'vP.x-'+(C.W+2).toFixed(1):'-2.-vP.x')+';vec3 c=mix(vec3(.42,.83,.78),vec3(.12,.42,.62),smoothstep(0.,14.,d));float r=fract(d*.22-t*.25+sin(vP.z*.3)*.2);c=mix(c,vec3(1.),step(.8,r)*(1.-smoothstep(0.,9.,d))*.8);gl_FragColor=vec4(c*luce,1.);}'});
   const m=new T.Mesh(new T.PlaneGeometry(90,C.H+90),K.acqua);m.rotation.x=-Math.PI/2;m.position.set(costa==='e'?C.W+46:-46,-.35,C.H/2);sc.add(m)}else K.acqua=null;
  // ---- quel che c'è intorno: si combatte davanti a un villaggio, sotto un monastero, tra le rovine, alle porte di un covo… ----
  if(vic&&!s.muro&&s.tipo!=='arena'){const S=A.Solidi(),st=(VenMappa.STILE[vic.faz]||VenMappa.STILE.neu),r=k=>hh(k,semeD,91),cx0=C.W/2;
   const casa=(x,z,w,h,ry)=>{const y=Math.max(0,alto(x,z));if(st.tende){S.cil(w*.6,w*.64,h*.8,8,x,y,z,st.muro,{c2:'#fff7e0'});S.cono(w*.74,h*.8,8,x,y+h*.8,z,st.tetto)}else{S.box(w,h,w*.85,x,y,z,st.muro,{ry,c2:'#fff7e0'});S.tetto(w*1.16,h*.8,w,x,y+h,z,st.tetto,{ry})}};
   const steccato=(x0,z0,x1,z1)=>{const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/2);for(let k=0;k<n;k++){const x=x0+(x1-x0)*(k+.5)/n,z=z0+(z1-z0)*(k+.5)/n;S.box(2,.12,.1,x,Math.max(0,alto(x,z))+.6,z,'#7a5a3a',{ry:Math.atan2(x1-x0,z1-z0)+1.5708});S.box(.14,.9,.14,x,Math.max(0,alto(x,z)),z,'#6a4a2e')}};
   const campo2=(x,z,c1,c2)=>{for(let q=0;q<5;q++)S.box(7,.08,1.1,x,Math.max(0,alto(x,z))+.04,z+q*1.3,q%2?c1:c2)};
   if(vic.tipo==='villaggio'||vic.tipo==='porto'){for(let k=0;k<7;k++)casa(4+r(k)*(C.W-8),-5-r(k+9)*12,3.2+r(k+3),2.4+r(k+5)*.8,r(k+7)*3);steccato(2,-2,cx0-6,-2);steccato(cx0+6,-2,C.W-2,-2);
    campo2(-13,20,'#d9c45a','#b9c552');campo2(C.W+13,48,'#c98a3c','#9fbf50');if(!st.tende){S.cil(1.4,1.9,6,8,C.W+9,alto(C.W+9,14),14,st.muro,{c2:'#fff7e0'});S.cono(2.1,2.4,8,C.W+9,alto(C.W+9,14)+6,14,st.tetto);for(let k=0;k<4;k++)S.box(.5,4.4,.14,C.W+9,alto(C.W+9,14)+5,15.8,'#efe6cf',{rz:k*1.5708+.4})}
    for(let k=0;k<5;k++)S.cono(1.1,1.6,6,-8-r(k+20)*8,alto(-10,60),56+k*3,'#e0c45a')}
   else if(vic.tipo==='locanda'){const x=C.W+10,z=44,y=Math.max(0,alto(x,z));S.box(8,4,6,x,y,z,'#e9dfc6',{c2:'#fff7e0'});S.box(8.2,.4,6.2,x,y+4,z,'#5a4030');S.box(8,2.6,6,x,y+4.4,z,'#d9c9a6');S.tetto(7.2,3.4,9,x,y+7,z,'#a8502e');S.box(1.2,3.6,1.2,x+2,y+8,z-1,'#8b8680');
    S.box(.4,5,.4,x-5.5,y,z+4,'#5a4030');S.box(2.4,1.6,.2,x-5.5,y+3.4,z+4,'#e0b83a');S.box(4,1.6,2.4,x-7,y+.6,z-6,'#8a6a48');for(const o of[-1.4,1.4])S.cil(.9,.9,.3,8,x-7+o,y+.9,z-4.6,'#5a4030',{rx:1.5708});steccato(C.W+4,30,C.W+4,58);K.fuochi.push([x-4,y,z+7])}
   else if(vic.tipo==='monastero'){const x=cx0,z=-13,y=Math.max(0,alto(x,z));S.box(9,7,14,x,y,z,'#e6dcc4',{c2:'#fff8e6'});S.tetto(10.4,5,15,x,y+7,z,'#8a4a3a',{ry:0});S.box(4.4,16,4.4,x-8,y,z+2,'#e6dcc4',{c2:'#fff8e6'});S.cono(3.8,5.4,4,x-8,y+16,z+2,'#8a4a3a',{ry:.785});S.box(.4,2.4,.4,x-8,y+21.4,z+2,'#e8c35a');S.box(1.6,.4,.4,x-8,y+22.6,z+2,'#e8c35a');
    for(let k=0;k<9;k++)S.box(3.4,2.4,.8,6+k*6,Math.max(0,alto(6+k*6,-3)),-3,'#cfc6b0');for(let k=0;k<8;k++)S.box(.5,1.4+r(k)*.6,.2,C.W+6+r(k)*8,alto(C.W+10,20+k*3),20+k*3.2,'#b8b2a4')}
   else if(vic.tipo==='citta'||vic.tipo==='castello'){const p='#aaa49b',p2='#cfc8bc',F=VDAT.FAZ[vic.faz]||VDAT.FAZ.neu,z=-17;S.box(C.W+50,6,2.4,cx0,alto(cx0,z),z,p,{c2:p2});for(let k=0;k<Math.floor((C.W+50)/2.4);k++)S.box(1.2,1,.8,-25+1+k*2.4,alto(cx0,z)+6,z+.8,p2);
    for(const x of[-14,cx0-9,cx0+9,C.W+14]){S.cil(2.4,2.8,9.5,8,x,alto(x,z),z,p,{c2:p2});S.cono(3.2,3.6,8,x,alto(x,z)+9.5,z,F.col)}S.box(7,5,1,cx0,alto(cx0,z),z+1.4,'#5a4030');S.box(12,9,8,cx0+18,alto(cx0,z-12),z-12,p,{c2:p2});S.tetto(13,5,9,cx0+18,alto(cx0,z-12)+9,z-12,F.col)}
   else if(vic.tipo==='rovine'){const pr='#b8b2a4',pr2='#d8d2c2';for(let k=0;k<26;k++){const lato=k%3,x=lato===0?-3-r(k)*10:lato===1?C.W+3+r(k)*10:4+r(k)*(C.W-8),z=lato===2?-3-r(k+40)*12:r(k+40)*C.H,y=Math.max(0,alto(x,z)),h=1.5+r(k+60)*5;
     S.cil(.7,.8,h,7,x,y,z,pr,{c2:pr2,rz:r(k+80)<.2?.25:0});if(r(k+90)<.3)S.box(2.2,.7,2.2,x,y+h,z,pr2)}
    S.box(1.4,8,1.4,cx0-5,alto(cx0,-9),-9,pr,{c2:pr2});S.box(1.4,8,1.4,cx0+5,alto(cx0,-9),-9,pr,{c2:pr2});S.box(12.4,1.4,1.6,cx0,alto(cx0,-9)+8,-9,pr2);S.box(5,.8,5,cx0,alto(cx0,-15),-15,'#8f9a86');S.sfera(1.1,cx0,alto(cx0,-15)+2.4,-15,'#9fe0c8');
    for(let k=0;k<8;k++)S.box(1.6+r(k)*2,.8,1.2+r(k+5)*2,3+r(k+10)*(C.W-6),.02,8+r(k+15)*(C.H-16),'#a8a294',{ry:r(k+20)*3})}
   else if(vic.tipo==='covo'){const lg='#6a4a2e';for(let k=0;k<34;k++){const x=-6+k*(C.W+12)/33;if(Math.abs(x-cx0)<5)continue;const z=3+Math.sin(k*.4)*2;S.cono(.7,5+r(k)*1.4,5,x,Math.max(0,alto(x,z)),z,lg,{c2:'#8a6a48'})}
    for(let k=0;k<6;k++){const x=6+k*(C.W-12)/5,z=-6-r(k)*6;S.cono(3,4.2,6,x,Math.max(0,alto(x,z)),z,['#7a6a52','#5a5048','#8a5a3a','#6a6a4a'][k%4])}
    for(const x of[cx0-6,cx0+6]){S.box(.4,7,.4,x,alto(x,4),4,lg);S.sfera(.6,x,alto(x,4)+7.3,4,'#e8e2d2');S.box(2,1.4,.2,x+1,alto(x,4)+5,4,'#3a3230')}K.fuochi.push([cx0-12,alto(cx0-12,-6),-6],[cx0+12,alto(cx0+12,-8),-8])}
   if(S.n)sc.add(S.mesh())}
  // ---- arena dei tornei: sabbia battuta, steccato tondo, gradoni con il pubblico a istanze, stendardi della città ----
  if(s.tipo==='arena'){const S=A.Solidi(),F=VDAT.FAZ[scheda.fazb]||VDAT.FAZ.neu,cx=C.W/2,cz=C.H/2,R=C.ARENA+1.4,N=40,PI2=Math.PI*2,pt=(rr,a)=>[cx+Math.cos(a)*rr,cz+Math.sin(a)*rr];
   S.cil(R+.4,R+.4,.1,36,cx,.03,cz,'#d9c58e',{c2:'#c8b47a'});
   for(let k=0;k<N;k++){const a=k/N*PI2,am=(k+.5)/N*PI2,p=pt(R,a),m=pt(R,am),y=Math.max(0,alto(p[0],p[1]));S.box(.3,1.5,.3,p[0],y,p[1],'#6a4a2e');
    S.box(2*R*Math.sin(Math.PI/N)+.15,.14,.14,m[0],y+1.05,m[1],'#8a6a48',{ry:-(am+Math.PI/2)});S.box(2*R*Math.sin(Math.PI/N)+.15,.14,.14,m[0],y+.55,m[1],'#7a5a3a',{ry:-(am+Math.PI/2)})}
   const G=28,gr=[R+2.4,R+4.6,R+6.8],gh=[.9,1.8,2.7];
   for(let t=0;t<3;t++)for(let k=0;k<G;k++){const am=(k+.5)/G*PI2,m=pt(gr[t],am);if(Math.abs(Math.sin(am-Math.PI/2))<.12&&t===0&&Math.cos(am-Math.PI/2)>0)continue;// il varco d'ingresso, in basso
    S.box(2*gr[t]*Math.sin(Math.PI/G)+.2,gh[t],2.2,m[0],0,m[1],t%2?'#a4825a':'#9a7a52',{c2:'#c0996c',ry:-(am+Math.PI/2)})}
   for(let k=0;k<6;k++){const a=k/6*PI2+.26,p=pt(gr[2]+1.6,a);S.box(.22,6.2,.22,p[0],0,p[1],'#5a4030');S.box(2.1,1.5,.08,p[0]+Math.cos(a+1.5708)*1.1,4.4,p[1]+Math.sin(a+1.5708)*1.1,F.col,{c2:F.col2,ry:-(a+Math.PI)});S.sfera(.32,p[0],6.3,p[1],'#e8c35a')}
   for(const a of[.2,PI2/2+.2]){const p=pt(R-1,a);K.fuochi.push([p[0],0,p[1]])}
   sc.add(S.mesh());
   // il pubblico: un corpo tinto e una testa per persona, seduti sui gradoni
   const corpo=A.Solidi().cil(.26,.34,.75,5,0,0,0,'#ffffff').geo(),testa=A.Solidi().sfera(.24,0,.98,0,'#ffffff').geo(),vesti=[[.85,.35,.3],[.3,.5,.85],[.9,.75,.3],[.35,.7,.4],[.7,.4,.8],[.9,.9,.85],[.85,.55,.25]],pelli=[[.96,.8,.66],[.84,.64,.5],[.66,.46,.34],[.92,.74,.58]],tutti=[];
   for(let t=0;t<3;t++){const rr=gr[t]+.2,n=Math.floor(PI2*rr/1.35);for(let k=0;k<n;k++){const a=k/n*PI2+hh(k,t,semeD)*.05;if(hh(k,t+9,semeD)<.12)continue;if(t===0&&Math.abs(Math.sin(a-Math.PI/2))<.14&&Math.cos(a-Math.PI/2)>0)continue;const p=pt(rr,a);tutti.push([p[0],gh[t],p[1],.85+hh(k,t+3,semeD)*.3,vesti[Math.floor(hh(k,t+5,semeD)*vesti.length)],pelli[Math.floor(hh(k,t+7,semeD)*pelli.length)],a])}}
   const d2=new T.Object3D();for(const[geo,ic]of[[corpo,4],[testa,5]]){const me=new T.InstancedMesh(geo,A.matI,tutti.length);me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(tutti.length*3),3);
    tutti.forEach((p,k)=>{d2.position.set(p[0],p[1],p[2]);d2.rotation.set(0,-p[6],0);d2.scale.setScalar(p[3]);d2.updateMatrix();me.setMatrixAt(k,d2.matrix);me.instanceColor.setXYZ(k,p[ic][0],p[ic][1],p[ic][2])});me.frustumCulled=false;sc.add(me)}}
  if(scheda.notte||K.ora>19.5||K.ora<5.5){K.fuochi.push([C.W/2-10,alto(C.W/2-10,C.H+3),C.H+3],[C.W/2+10,alto(C.W/2+10,C.H+4),C.H+4])}
  {const S=A.Solidi();for(const f of K.fuochi){for(let k=0;k<5;k++)S.box(.3,.3,1.4,f[0],f[1]+.1,f[2],'#4a3626',{ry:k*1.25});S.cil(1,1.1,.2,7,f[0],f[1],f[2],'#6e665f')}if(S.n)sc.add(S.mesh({ombra:false}))}
  K.luci=K.fuochi.slice(0,3).map(f=>{const p=new T.PointLight('#ff9a3a',1.6,26,1.6);p.position.set(f[0],f[1]+2,f[2]);sc.add(p);return p});
  K.fig=A.Schiera(sc,170);K.ste=A.Stendardi(sc,10);K.par=A.Particelle(sc,400);
  K.fre=new T.InstancedMesh(new T.BoxGeometry(.07,.07,1.1),new T.MeshBasicMaterial({color:'#f4ecd8'}),90);K.fre.count=0;K.fre.frustumCulled=false;sc.add(K.fre);
  const anello=(c,r)=>{const m=new T.Mesh(new T.RingGeometry(r,r+.16,22),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.95,depthTest:false}));m.rotation.x=-Math.PI/2;m.renderOrder=5;m.visible=false;sc.add(m);return m};
  K.anCap=anello('#ffd75a',.8);K.anMeta=anello('#fff2b0',.5);K.anBers=anello('#ff5a4a',.85);
}
 const FAZ=(l)=>Object.assign({},VDAT.FAZ[l==='a'?(K.scheda.faza||'tu'):K.scheda.fazb]||VDAT.FAZ.pre,l==='a'?K.scheda.cola:K.scheda.colb);
 function eventi(ev){const s=K.s,mio=VCAM.capU(s,K.seat||0);for(const e of ev){
   if(e.t==='colpo'){const a=K.U[e.da],b=K.U[e.a],ub=s.u.find(u=>u.id===e.a);if(a&&!e.freccia)a.colpo=K.t;if(b&&e.dan>0){b.lampo=K.t;if(ub){for(let k=0;k<(e.crit?5:2);k++)K.par.emetti(ub.x,1+Math.random()*.5,ub.y,{vx:(Math.random()-.5)*3,vy:2+Math.random()*2,vz:(Math.random()-.5)*3,g:9,s:.13,dur:.5,col:e.crit?'#ffe27a':'#ffffff'})}}
    const cap=mio;if(ub&&cap&&(e.da===cap.id||e.a===cap.id)&&e.dan>0&&K.numeri.length<7)K.numeri.push({x:ub.x,z:ub.y,v:e.dan,t:K.t,cls:e.a===cap.id?'male':e.crit?'crit':''});
    if(cap&&e.a===cap.id&&e.dan>0){K.scossa=.25}if(e.crit)suono('avv-critico');else if(e.dan>0&&cap&&(e.da===cap.id||e.a===cap.id))suono('avv-colpo-taglio')}
   else if(e.t==='tiro'){K.frecce.push({x0:e.x0,z0:e.y0,x1:e.x1,z1:e.y1,t0:K.t,dur:e.vt/10/K.vel,ok:e.colpito});const a=K.U[e.da];if(a)a.colpo=K.t}
   else if(e.t==='ko'){const u=s.u.find(u=>u.id===e.id);if(u){for(let k=0;k<6;k++)K.par.emetti(u.x+(Math.random()-.5),.2,u.y+(Math.random()-.5),{vy:.8,s:.22,dur:.8,col:'#d8c8a4',cresce:1.3});if(e.cap){K.lampo=.5;suono('avv-cade')}}}
   else if(e.t==='grido'){K.lampo=.25;for(let k=0;k<26;k++){const an=k/26*6.28;K.par.emetti(e.x,.4,e.y,{vx:Math.cos(an)*7,vz:Math.sin(an)*7,vy:.4,s:.24,dur:.7,col:'#ffe27a'})}suono('avv-livello')}
   else if(e.t==='rinforzi')Ven.avviso(e.l==='a'?'Arrivano i tuoi rinforzi':'Rinforzi nemici in campo');
   else if(e.t==='rotta')Ven.avviso(e.l==='a'?'I tuoi uomini sono in rotta!':'Il nemico è in rotta!');
   else if(e.t==='cap-ko')Ven.avviso(e.seat===(K.seat||0)?'Sei caduto: gli uomini combattono senza di te':'Un capitano è caduto!','male');
   else if(e.t==='fine'){K.finita=true;suono(e.vince==='a'?'avv-fanfara':'avv-lamento')}}}
 const suono=n=>{try{Snd.play(n)}catch(e){}};
 function passo(dt){const s=K.s;if(!s||!K.scene)return;const T=VenArte.T,A=VenArte,C=VCAM.C;K.t+=dt;
  if(!K.esterno&&!K.pausa&&!s.fine){K.acc+=dt*10*K.vel;let n=0;while(K.acc>=1&&n++<6){K.acc-=1;eventi(VCAM.passo(s,1))}if(K.acc>1)K.acc=0}
  const al=s.fine||K.pausa?1:Math.min(1,K.acc),cap=VCAM.capU(s,K.seat||0);
  K.fig.inizio();K.ste.inizio();const cen={a:{f:[0,0,0],t:[0,0,0],c:[0,0,0]},b:{f:[0,0,0],t:[0,0,0],c:[0,0,0]}};let caduti=0;
  for(let i=s.u.length-1;i>=0;i--){const u=s.u[i];if(u.st==='via')continue;let q=K.U[u.id];if(!q)q=K.U[u.id]={f:Math.random(),yaw:u.l==='a'?Math.PI:0,giu:0,colpo:-9,lampo:-9};
   const x=u.st==='ko'?u.x:u.px+(u.x-u.px)*al,z=u.st==='ko'?u.y:u.py+(u.y-u.py)*al,mosso=Math.hypot(u.x-u.px,u.y-u.py);
   if(u.st==='ko'){q.giu=Math.min(1,q.giu+dt*3.2);if(++caduti>46&&q.giu>=1)continue}else{if(mosso>.02)q.f+=dt*(u.c==='c'||u.cav?3.2:2.6)*K.vel*(K.pausa?0:1);const ya=Math.atan2(u.fx,u.fy);let da=ya-q.yaw;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;q.yaw+=da*Math.min(1,dt*12)}
   const F=FAZ(u.l),tc=K.t-q.colpo,FT=VDAT.FAZ[(VDAT.TR[u.t]||{}).faz]||F,mioL=u.l==='a';
   K.fig.metti({x,y:Math.max(0,K.alto(x,z)),z,yaw:q.yaw,sc:u.cap||s.tipo==='arena'?1.75:VDAT.TR[u.t]&&VDAT.TR[u.t].capo?1.8:1.48,base:u.cap?null:mioL?'#f0a030':'#7a1c1c',col:u.cap?CAPC[u.seat||0]:mioL&&FT!==VDAT.FAZ.tu?FT.col:F.col,col2:u.cap?'#fff4d6':mioL?'#f0a030':F.col2,asp:u.cap?(u.asp||{}):u.asp||VDAT.aspetto(u.t),cav:u.cav||u.c==='c',fase:mosso>.02&&u.st!=='ko'?q.f:0,colpo:tc<.32?tc/.32:0,giu:q.giu,lampo:K.t-q.lampo<.09,seme:u.id});
   if(u.st==='vivo'&&!u.cap){const g=cen[u.l][u.c];g[0]+=x;g[1]+=z;g[2]++}
   if(u.st==='fuga'&&Math.random()<dt*2)K.par.emetti(x,.1,z,{vy:.4,s:.16,dur:.6,col:'#d8c8a4',cresce:1});
   else if(mosso>.3&&Math.random()<dt*6)K.par.emetti(x,.1,z,{vy:.5,s:.18,dur:.7,col:K.scheda.bioma===1?'#ffffff':'#d8c8a4',cresce:1.2})}
  K.fig.fine();
  for(const l of['a','b'])for(const g of['f','t','c']){const c=cen[l][g];if(c[2]>1)K.ste.metti(c[0]/c[2],0,c[1]/c[2]+(l==='a'?1.2:-1.2),FAZ(l).col,1.8,K.t,g.charCodeAt(0)+(l==='a'?0:9))}
  for(const id of s.capi){const q=s.u.find(u=>u.id===id);if(q&&q.st==='vivo'&&q!==cap)K.ste.metti(q.px+(q.x-q.px)*al-.9,0,q.py+(q.y-q.py)*al+.6,CAPC[q.seat||0],2.1,K.t,5+q.seat)}
  if(cap&&cap.st==='vivo'){const cx=cap.px+(cap.x-cap.px)*al,cz=cap.py+(cap.y-cap.py)*al;K.ste.metti(cx-.9,0,cz+.6,CAPC[cap.seat||0],2.3,K.t,3);K.anCap.visible=true;K.anCap.position.set(cx,.08,cz);
   if(cap.vx!=null){K.anMeta.visible=true;K.anMeta.position.set(cap.vx,.08,cap.vy);const sp=1+Math.sin(K.t*6)*.2;K.anMeta.scale.set(sp,sp,sp)}else K.anMeta.visible=false;
   const b=cap.ob>=0?s.u.find(u=>u.id===cap.ob&&u.st==='vivo'):null;if(b){K.anBers.visible=true;K.anBers.position.set(b.x,.09,b.y)}else K.anBers.visible=false;
   if(K.segue){const k=Math.min(1,dt*4);K.fuoco.x+=(cx-K.fuoco.x)*k;K.fuoco.z+=(cz-7-K.fuoco.z)*k}}
  else{K.anCap.visible=K.anMeta.visible=K.anBers.visible=false}
  K.ste.fine();
  // frecce ad arco
  {const d=new T.Object3D();let n=0;for(let i=K.frecce.length-1;i>=0;i--){const f=K.frecce[i],q=(K.t-f.t0)/Math.max(.08,f.dur);if(q>=1){if(!f.ok)K.par.emetti(f.x1+(Math.random()-.5)*1.5,.1,f.z1+(Math.random()-.5)*1.5,{vy:.3,s:.1,dur:.4,col:'#cfc4a8'});K.frecce.splice(i,1);continue}
    if(n>=90)continue;const L=Math.hypot(f.x1-f.x0,f.z1-f.z0),hm=1.3+L*.16,x=f.x0+(f.x1-f.x0)*q,z=f.z0+(f.z1-f.z0)*q,y=1.3+4*hm*q*(1-q)-q*.4,vy=4*hm*(1-2*q);
    d.position.set(x,y,z);d.rotation.set(0,0,0);d.lookAt(x+(f.x1-f.x0),y+vy,z+(f.z1-f.z0));d.updateMatrix();K.fre.setMatrixAt(n++,d.matrix)}K.fre.count=n;K.fre.instanceMatrix.needsUpdate=true}
  // fuochi, pioggia, neve
  for(const f of K.fuochi)if(Math.random()<dt*14)K.par.emetti(f[0]+(Math.random()-.5)*.6,f[1]+.4,f[2]+(Math.random()-.5)*.6,{vy:2.2,s:.42,dur:.8,col:'#ffd45a',col2:'#d8421c'});
  K.luci.forEach((p,i)=>{p.intensity=1.5+Math.sin(K.t*9+i*2)*.25});
  const met=K.sn.meteo;if(met==='pioggia'||K.scheda.bioma===1)for(let k=0;k<Math.min(10,Math.ceil(dt*(met==='pioggia'?300:90)));k++){const nv=met!=='pioggia';K.par.emetti(K.fuoco.x+(Math.random()-.5)*K.alt*.8,7+Math.random()*4,K.fuoco.z+(Math.random()-.45)*K.alt*1.2,{vy:nv?-3:-26,vx:nv?-.8:-3,s:nv?.16:.13,dur:nv?2.6:.42,col:nv?'#ffffff':'#cfe2f6'})}
  if(K.acqua){K.acqua.uniforms.t.value=K.t}
  K.par.passo(dt);
  K.fuoco.x=Math.max(4,Math.min(C.W-4,K.fuoco.x));K.fuoco.z=Math.max(2,Math.min(C.H-2,K.fuoco.z));
  const L=K.luce.ora(K.ora,{x:C.W/2,y:0,z:K.fuoco.z},48);if(L.notte>.3){K.luce.amb.intensity+=.62*L.notte;K.luce.sole.intensity+=.5*L.notte}K.lampo=Math.max(0,K.lampo-dt*1.6);K.scossa=Math.max(0,K.scossa-dt);
  const sx=K.scossa>0?(Math.random()-.5)*K.scossa*2:0;
  if(K.acqua)K.acqua.uniforms.luce.value=1-L.notte*.5;
  A.disegna(K.scene,K.cam,{x:K.fuoco.x+sx,y:0,z:K.fuoco.z+sx},K.alt,{notte:L.notte,lampo:K.lampo*.5,nebbia:met==='nebbia'?.5:met==='pioggia'?.2:0,tinta:met==='pioggia'?[.9,.94,1]:K.ora>17.5&&K.ora<20.5?[1.06,.97,.9]:null});
  numeri()}
 function numeri(){const host=document.querySelector('.vn-etc');if(!host)return;const A=VenArte;let h='';K.numeri=K.numeri.filter(n=>K.t-n.t<.8);
  for(const n of K.numeri){const q=(K.t-n.t)/.8,p=A.aSchermo(K.cam,n.x,2.2+q*2.4,n.z);h+='<i class="vn-num '+n.cls+'" style="left:'+Math.round(p.x)+'px;top:'+Math.round(p.y)+'px;opacity:'+(1-q*q).toFixed(2)+'">'+n.v+'</i>'}
  if(host._h!==h){host.innerHTML=h;host._h=h}}
 function trascina(dx,dy){const A=VenArte,r=A.cv.getBoundingClientRect(),u=K.alt/r.height;K.fuoco.x-=dx*u;K.fuoco.z-=dy*u/A.SE;K.segue=false}
 function pizzico(f){K.alt=Math.max(24,Math.min(80,K.alt/f))}
 function tocco(px,py){const A=VenArte,s=K.s;if(!s||s.fine)return null;const r=A.cv.getBoundingClientRect();let m=null,md=26;
  for(const u of s.u){if(u.l!=='b'||u.st!=='vivo')continue;const c=A.aSchermo(K.cam,u.x,.9,u.y),d=Math.hypot(c.x-(px-r.left),c.y-(py-r.top));if(d<md){md=d;m=u}}
  if(m)return{b:m.id};const g=A.aTerra(K.cam,px,py,0);return{x:g.x,y:g.z}}
 const centra=()=>{K.segue=true};
 return{K,CAPC,apri,usa,scena,eventi,passo,trascina,pizzico,tocco,centra}})();
