/* ---- Compagnia di ventura (piano C): la battaglia campale in 3D. Disegno, ciclo e gesti; le regole stanno in VCAM (motori/28l). ----
   Ciclo: 10 istanti al secondo di logica (×1, ×2), 60 fotogrammi interpolati. Ogni soldato è una figura a istanze con passo,
   affondo, caduta; frecce in volo ad arco, polvere, stendardi dei gruppi, muro e torri negli assedi.
   Tocchi: sul campo = il capitano va lì; su un nemico = lo attacca; trascina = sposta la visuale; pizzico = zoom.
   Bottega comune: `VenArte` (24ht). HUD e pulsanti: `Ven` (24hw). Piano: docs/VENTURA.md. */
const VenCampo=(()=>{
 // palette dei regni e delle fazioni: da `VEN.rg` (il mondo, se c'è, dice i colori dei regni; senza, valgono quelli di base).
 // `rip` è il ripiego per un id sconosciuto (`ignota` di VEN.rg; come prima: assedio `fer`, campo `pre`, arena e mura `neu`); 'tu' resta quello di base, senza lo stendardo della corona.
 const rg0=f=>VEN.rg(f==='tu'||typeof Ven==='undefined'||!Ven.V?null:Ven.V.s,f);
 const rg=(f,rip)=>{const x=rg0(f);return x.ignota?rg0(rip||'neu'):x};
 const K={s:null,scene:null,cam:null,fuoco:{x:30,y:0,z:80},alt:38,segue:true,acc:0,pausa:false,vel:1,t:0,U:{},frecce:[],numeri:[],lampo:0,scossa:0,gruppo:'tutti',tvT:-1,selR:null,gt:{},od:1,bz:{},fogOnd:false,dt:0,fit:true,lod:0,bl:null,piani:{},ripr:'regia',stacco:null,ultStacco:-99,lento:0,hot:[],tCap:0,lont:0,ultLont:0,grande:false,ALT_MIN:30,ALT_MAX:92};
 // tavolo dello schieramento (passo 19): solo vista, vero a t===0 se la battaglia ha i reparti (`s.rep`); riparte da zero a ogni battaglia
 const rz=()=>{K.tvT=-1;K.selR=null;K.gt={};K.fogOnd=false;K.od=1;K.bz={};K.piani={};K._cen=null;K._lodP=-1;K._tv=false;K.fit=true;K.sigO=undefined};
 const tavolo=s=>!!(s&&s.rep&&s.t===0&&!s.fine&&s.pronto&&!s.pronto.a);
 const hh=(x,y,s)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);n^=n>>>16;return(n>>>0)/4294967296};
 function apri(scheda,o){K.esterno=false;K.batt=null;K.seat=0;K.s=VCAM.nuovo(scheda,o);K.scheda=scheda;K.U={};K.frecce=[];K.numeri=[];K.acc=0;K.pausa=true;K.vel=1;K.t=0;K.gruppo='tutti';K.segue=true;K.ripr='regia';K.stacco=null;K.hot=[];K.ultStacco=-99;K.lento=0;K.tCap=0;K.finita=false;rz();scena();
  const c=VCAM.capU(K.s);if(c){K.fuoco.x=c.x;K.fuoco.z=c.y-9}K.ora=scheda.ora>=0?scheda.ora:scheda.notte?22.5:10+hh((scheda.seme|0)&1023,1,2)*6;return K.s}
 // in compagnia (VenStanza) lo stato arriva da fuori e il tempo lo fa scorrere la stanza: qui si disegna soltanto
 function usa(s,batt){const nuova=K.batt!==batt||!K.scene||!K.esterno;K.s=s;K.batt=batt;K.esterno=true;if(!nuova)return;
  K.scheda={seme:s.seme0,bioma:s.bioma,terreno:s.terreno,notte:s.notte,faza:s.faza,fazb:s.fazb,cola:s.cola,colb:s.colb,scena:s.scena,ora:s.ora};K.U={};K.frecce=[];K.numeri=[];K.acc=0;K.vel=1;K.t=0;K.gruppo='tutti';K.segue=true;K.ripr='regia';K.stacco=null;K.hot=[];K.ultStacco=-99;K.lento=0;K.tCap=0;K.finita=false;rz();scena();
  const c=VCAM.capU(s,K.seat||0);if(c){K.fuoco.x=c.x;K.fuoco.z=c.y-9}K.ora=s.ora>=0?s.ora:s.notte?22.5:10+hh((s.seme0|0)&1023,1,2)*6}
 const CAPC=['#d98a1f','#2f9bd6','#b455c8','#3fb968'];
 // la scena si può rifare a battaglia in corso (contesto grafico perso): lo stato della battaglia non si tocca
 function scena(){const T=VenArte.T,A=VenArte,scheda=K.scheda;K.frecce=[];
  // il campo può essere più grande di 60×100 (taglie della battaglia): terreno, alberi e bordi leggono `s.W`, `s.H`
  const C=Object.assign(Object.create(VCAM.C),{W:K.s.W||VCAM.C.W,H:K.s.H||VCAM.C.H}),ar=Math.max(1,(C.W+50)*(C.H+50)/(110*150));K.portone=K.abbattuto=null;
  if(K.scene)K.scene.traverse(q=>{if(q.geometry)q.geometry.dispose()});
  const semeT=(scheda.seme|0)&255,sc=K.scene=new T.Scene(),bio=scheda.bioma||0,bosco=scheda.terreno===2,s=K.s,sn=scheda.scena||{},costa=sn.costa||null,vic=sn.vicino||null,monte=scheda.terreno===3||sn.pend;K.sn=sn;K.fuochi=[];K.cam=A.camera();K.luce=A.luce(sc);
  const PAL=bio===1?['#dfe8ee','#d0dde6','#c0d0dc']:bio===2?['#c4ae5a','#b8a252','#ad9c4c']:bio===3?['#bfae62','#b0a258','#a39850']:['#6fa446','#679b41','#7aae4a'];sc.background=new T.Color(bio===1?'#b9c8d4':bio===2?'#a89a58':'#4f8240');
  // ---- terreno: prato a chiazze dentro il campo, dossi fuori ----
  const ZACQ=new T.Color('#8fb7b0'),ZBOSCO=new T.Color('#3f6a30'),ZCASE=new T.Color('#b99a6c'),ZALT=new T.Color('#b8ad62');
  const pos=[],col=[],N=Math.min(110,Math.max(72,Math.round(72*(Math.max(C.W,C.H)+80)/180))),x0=-40,z0=-40,pw=(C.W+80)/N,ph=(C.H+80)/N,vn=(x,y,q)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=hh(xi,yi,q),b=hh(xi+1,yi,q),c=hh(xi,yi+1,q),e=hh(xi+1,yi+1,q);return a+(b-a)*fx+(c-a)*fy+(a-b-c+e)*fx*fy},
   alto=(x,z)=>{const fx=Math.max(0,-x,x-C.W),fz=Math.max(0,-z,z-C.H),f=Math.min(1,Math.max(fx,fz)/14);
    // dentro il campo l'altezza è la quota del motore (una sola funzione, la stessa che decide i combattimenti); fuori i dossi, raccordati sul bordo
    const q=VCAM.quota(K.s,Math.min(C.W,Math.max(0,x)),Math.min(C.H,Math.max(0,z)))*C.TER.ALTO;let y=f*f*(1.5+hh(x/6,z/6,3)*(monte?9:5))+q*(1-f)+(monte?(vn(x/11+3,z/11+7,semeT)-.5)*2.6*f:0);
    if(costa){const dc=costa==='e'?x-C.W-1:-1-x;if(dc>0)y=Math.min(y,0)-dc*.34}return y};K.alto=alto;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const P=(a,b)=>{const x=x0+(i+a)*pw,z=z0+(j+b)*ph;return[x,alto(x,z),z]},a=P(0,0),b=P(1,0),c=P(0,1),d=P(1,1);
   for(const t of((i+j)%2?[[a,c,b],[b,c,d]]:[[a,c,d],[a,d,b]])){const cx=(t[0][0]+t[1][0]+t[2][0])/3,cz=(t[0][2]+t[1][2]+t[2][2])/3,n=VEN.alt(semeT,cx/2.2+40,cz/2.2+40),k=new T.Color(PAL[n<.42?0:n<.56?1:2]);if(VEN.alt(semeT+3,cx/1.3,cz/1.3)>.63)k.lerp(new T.Color(bio===1?'#b9c6cf':'#9c8a5a'),.55);k.offsetHSL(0,0,(hh(cx*3,cz*3,6)-.5)*.035);
    if(bosco)k.lerp(new T.Color(bio===1?'#b9cbbf':'#4a7a38'),.35);
    {const qz=VCAM.quota(s,cx,cz),cz2=VCAM.copre(s,cx,cz);if(qz>0){k.offsetHSL(0,0,qz*.05);k.lerp(ZALT,qz*.4)}else if(VCAM.acqua(s,cx,cz))k.lerp(ZACQ,.5);if(cz2==='bosco')k.lerp(ZBOSCO,.3);else if(cz2==='case')k.lerp(ZCASE,.4)}if(sn.strada&&Math.abs(cx-C.W/2-Math.sin(cz/9)*3.5)<2.1)k.lerp(new T.Color(bio===1?'#b9b0a0':'#b99a6c'),.8);if(costa&&(costa==='e'?cx>C.W-5:cx<5))k.lerp(new T.Color('#e3d3a0'),Math.min(1,((costa==='e'?cx-C.W+5:5-cx))/5));for(const v of t){pos.push(v[0],v[1],v[2]);col.push(k.r,k.g,k.b)}}}
  const gt=new T.BufferGeometry();gt.setAttribute('position',new T.Float32BufferAttribute(pos,3));gt.setAttribute('color',new T.Float32BufferAttribute(col,3));gt.computeVertexNormals();const terra=new T.Mesh(gt,A.mat);terra.receiveShadow=true;sc.add(terra);
  // ---- ciuffi, fiori, sassi, alberi ai margini (e radi nel campo se è bosco) ----
  const ciuffo=A.Solidi().cono(.16,.42,4,0,0,0,'#ffffff').cono(.12,.34,4,.16,0,.06,'#f0f0f0').cono(.11,.3,4,-.12,0,.1,'#e6e6e6').geo();
  const pino=A.Solidi().cil(.14,.2,.9,5,0,0,0,'#6b4a2e').cono(1.0,1.5,6,0,.7,0,'#3f7a3a',{c2:'#4f9247'}).cono(.78,1.3,6,0,1.6,0,'#478743',{c2:'#5aa14f'}).cono(.5,1.1,6,0,2.5,0,'#52964b',{c2:'#73b862'}).geo();
  const lati=A.Solidi().cil(.18,.24,1.1,5,0,0,0,'#6e4d30').sfera(1.1,0,1.9,0,'#5fa046').sfera(.8,.6,2.6,.2,'#74b653').sfera(.75,-.6,2.4,-.3,'#69aa4c').geo();
  const sasso=A.Solidi().sfera(.5,0,.2,0,'#9a948c').sfera(.34,.36,.14,.16,'#857f78').geo();
  const liste={ciuffo:[],pino:[],lati:[],sasso:[]},semeD=(scheda.seme|0)&1023;
  for(let k=0;k<Math.round(700*ar);k++){const x=hh(k,1,semeD)*(C.W+50)-25,z=hh(k,2,semeD)*(C.H+50)-25,q=hh(k,3,semeD);if(alto(x,z)<-.1)continue;liste.ciuffo.push([x,alto(x,z),z,.7+q,bio===1?[.86,.93,.98]:bio===2?[.78,.7,.34]:q<.12?[1,.86,.4]:q<.2?[.95,.5,.5]:[.36+q*.2,.62+q*.2,.26]])}
  for(let k=0;k<Math.round((bosco?150:90)*ar);k++){let x=hh(k,4,semeD)*(C.W+70)-35,z=hh(k,5,semeD)*(C.H+70)-35;const dentro=x>-2&&x<C.W+2&&z>-2&&z<C.H+2;if(dentro)continue;if(s.muro&&Math.abs(z-s.muro)<8)continue;if(alto(x,z)<-.1||(vic&&z<4&&x>-6&&x<C.W+6))continue;
   const q=hh(k,6,semeD),tipo=bio===1?'pino':q<.45?'pino':'lati';liste[tipo].push([x,alto(x,z)-.05,z,.8+q*.9,bio===1?[.9,1.05,1.08]:bio===2?[1,.92,.6]:[.85+q*.3,.95,.8+q*.2]])}
  // dentro il campo gli alberi stanno solo dove il motore dice «bosco», fitti (uno ogni 9 passi quadrati)
  (s.zone||[]).forEach((zb,zi)=>{if(zb.k!=='bosco')return;const n=Math.round(Math.PI*zb.rx*zb.ry/9);let messi=0;
   for(let k=0;k<n*8&&messi<n;k++){const x=zb.x+(hh(k,zi+11,semeD)*2-1)*zb.rx,z=zb.y+(hh(k,zi+12,semeD)*2-1)*zb.ry;if(VCAM.copre(s,x,z)!=='bosco')continue;
    const q=hh(k,zi+13,semeD),tipo=bio===1?'pino':q<.45?'pino':'lati';liste[tipo].push([x,alto(x,z)-.05,z,.8+q*.9,bio===1?[.9,1.05,1.08]:bio===2?[1,.92,.6]:[.85+q*.3,.95,.8+q*.2]]);messi++}});
  for(let k=0;k<Math.round((monte?90:40)*ar);k++){const x=hh(k,7,semeD)*(C.W+50)-25,z=hh(k,8,semeD)*(C.H+50)-25;if(alto(x,z)<-.1)continue;liste.sasso.push([x,alto(x,z),z,.5+hh(k,9,semeD)*1.4,[1,1,1]])}
  // erba, alberi e sassi a istanze; tutte le istanze stanno in `K.sce`, nel buffer solo quelle vicine alla camera (vedi `ritaglia`): il campo grande costa come il piccolo
  const d=new T.Object3D();K.sce=[];K._rq=null;for(const[nome,geo]of[['ciuffo',ciuffo],['pino',pino],['lati',lati],['sasso',sasso]]){const Ls=liste[nome];if(!Ls.length)continue;const me=new T.InstancedMesh(geo,A.matI,Ls.length);me.instanceColor=new T.InstancedBufferAttribute(new Float32Array(Ls.length*3),3);
   Ls.forEach((p,k)=>{d.position.set(p[0],p[1],p[2]);d.rotation.set(0,hh(k,10,semeD)*6.28,0);d.scale.setScalar(p[3]);d.updateMatrix();me.setMatrixAt(k,d.matrix);me.instanceColor.setXYZ(k,p[4][0],p[4][1],p[4][2])});me.castShadow=nome!=='ciuffo';me.frustumCulled=false;sc.add(me);
   K.sce.push({me,M:me.instanceMatrix.array.slice(),Cc:me.instanceColor.array.slice(),X:Ls.map(p=>p[0]),Z:Ls.map(p=>p[2])})}
  // ---- assedio: mura merlate con i varchi, torri, mastio alle spalle ----
  if(s.muro){const S=A.Solidi(),m=s.muro,p='#aaa49b',p2='#cfc8bc',F=rg(scheda.fazb,"fer"),PO=s.porta;
   // aperture del muro: la porta (chiusa dal portone finché regge) e le brecce già aperte all'inizio (macerie)
   const ap=s.varchi.map(v=>v.slice());if(PO&&!ap.some(v=>v[0]===PO.x0))ap.push([PO.x0,PO.x1]);ap.sort((a,b)=>a[0]-b[0]);
   let x=-12;const tratti=[];for(const v of ap){tratti.push([x,v[0]]);x=v[1]}tratti.push([x,C.W+12]);
   for(const[a,b]of tratti){const w=b-a;S.box(w,3.4,1.6,(a+b)/2,0,m,p,{c2:p2});for(let k=0;k<Math.floor(w/1.6);k++)S.box(.8,.7,.5,a+.6+k*1.6,3.4,m+.5,p2);S.box(w,.3,1.2,(a+b)/2,2.5,m-1.3,'#8a6a48')}
   for(const v of ap){const porta=PO&&v[0]===PO.x0,cx=(v[0]+v[1])/2;
    if(porta){for(const e of v){S.cil(1.3,1.5,5.2,8,e+(e===v[0]?-1.1:1.1),0,m,p,{c2:p2});S.cono(1.7,1.8,8,e+(e===v[0]?-1.1:1.1),5.2,m,F.col)}S.box(v[1]-v[0],.5,1.8,cx,4.2,m,p2)}
    else for(let k=0;k<14;k++){const rx=v[0]+.3+hh(k,v[0],5)*(v[1]-v[0]-.6),rz=m-1.6+hh(k,v[0],6)*3.4,r=.25+hh(k,v[0],7)*.45;S.box(r*2,r*1.3,r*1.6,rx,0,rz,k%3?p:p2,{ry:hh(k,v[0],8)*3,rz:(hh(k,v[0],9)-.5)*.6})}}
   // scale appoggiate al muro (dal piede, fuori, alla cima del parapetto)
   for(const sx of s.scale||[]){const th=-.3,L=3.87,yc=1.85,zc=m+1.42;for(const ox of[-.36,.36])S.box(.12,L,.12,sx+ox,yc-L/2,zc,'#7a5232',{rx:th});
    for(let k=1;k<9;k++){const f=k/9-.5;S.box(.72,.08,.08,sx,yc+f*L*Math.cos(th)-.04,zc-f*L*Math.sin(-th),'#9a7046')}}
   // l'ariete: un tronco ferrato su ruote, davanti alla porta
   if(PO&&PO.ariete){const ax=(PO.x0+PO.x1)/2,az=m+4.6;S.box(2,.3,4.6,ax,.6,az,'#5e4128');S.cil(.42,.42,6,8,ax,1.25-3,az,'#7b5634',{rx:1.5708});S.cono(.48,.6,8,ax,1.25-.3,az-3.2,'#4a4a4e',{rx:-1.5708});
    for(const dx of[-1.15,1.15])for(const dz of[-1.4,1.4])S.cil(.55,.55,.28,10,ax+dx,.41,az+dz,'#3e2c1c',{rz:1.5708})}
   // il portone: due battenti chiusi; abbattuto, resta a terra
   if(PO){const G1=A.Solidi(),G2=A.Solidi(),w=PO.x1-PO.x0,cx=(PO.x0+PO.x1)/2;G1.box(w,3.6,.35,cx,0,m+.55,'#6b4a2e',{c2:'#8a6440'});for(const y of[.7,2.6])G1.box(w,.22,.12,cx,y,m+.78,'#3a3a3e');G1.box(.08,3.6,.4,cx,0,m+.55,'#3a2a1a');
    G2.box(w,.3,3.4,cx,.05,m-1.4,'#6b4a2e',{rx:.05,c2:'#8a6440'});G2.box(w*.5,.25,1.2,cx-.8,.05,m+1.4,'#5e4128',{ry:.4});
    K.portone=G1.mesh();K.abbattuto=G2.mesh();sc.add(K.portone);sc.add(K.abbattuto);K.portone.visible=PO.pf>0;K.abbattuto.visible=PO.pf<=0}
   S.box(14,8,10,C.W/2,0,m-22,p,{c2:p2});S.tetto(15,4,11,C.W/2,8,m-22,F.col);for(const ox of[-8,8]){S.cil(2.2,2.5,11,8,C.W/2+ox,0,m-17,p,{c2:p2});S.cono(2.9,3.4,8,C.W/2+ox,11,m-17,F.col)}
   for(let k=0;k<7;k++){const hx=6+hh(k,1,77)*(C.W-12),hz=m-6-hh(k,2,77)*9;S.box(3,2,2.6,hx,0,hz,'#e9dfc6');S.tetto(3.5,1.6,2.9,hx,2,hz,'#b0703c')}sc.add(S.mesh())}
  // ---- il mare, se si combatte sulla riva ----
  if(costa){K.acqua=new T.ShaderMaterial({uniforms:{t:{value:0},luce:{value:1}},vertexShader:'varying vec3 vP;void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader:'precision highp float;varying vec3 vP;uniform float t;uniform float luce;void main(){float d='+(costa==='e'?'vP.x-'+(C.W+2).toFixed(1):'-2.-vP.x')+';vec3 c=mix(vec3(.42,.83,.78),vec3(.12,.42,.62),smoothstep(0.,14.,d));float r=fract(d*.22-t*.25+sin(vP.z*.3)*.2);c=mix(c,vec3(1.),step(.8,r)*(1.-smoothstep(0.,9.,d))*.8);gl_FragColor=vec4(c*luce,1.);}'});
   const m=new T.Mesh(new T.PlaneGeometry(90,C.H+90),K.acqua);m.rotation.x=-Math.PI/2;m.position.set(costa==='e'?C.W+46:-46,-.35,C.H/2);sc.add(m)}else K.acqua=null;
  // ---- acqua bassa (riva, guado): un piano azzurro semitrasparente sulle zone «acqua», appena sopra il fondo ----
  for(const za of s.zone||[]){if(za.k!=='acqua')continue;const m=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:'#5fb4d6',transparent:true,opacity:.5,depthWrite:false}));m.rotation.x=-Math.PI/2;m.scale.set(za.rx,za.ry,1);m.position.set(za.x,-.1,za.y);m.renderOrder=1;sc.add(m)}
  // ---- quel che c'è intorno: si combatte davanti a un villaggio, sotto un monastero, tra le rovine, alle porte di un covo… ----
  const vq=vic||((s.zone||[]).some(z=>z.k==='case')?{tipo:'',faz:'neu'}:null);// una zona «case» data a mano si vede anche senza luogo vicino
  if(vq&&!s.muro&&s.tipo!=='arena'){const vic=vq,S=A.Solidi(),st=(VenMappa.STILE[vic.faz]||VenMappa.STILE.neu),r=k=>hh(k,semeD,91),cx0=C.W/2;
   const casa=(x,z,w,h,ry)=>{const y=Math.max(0,alto(x,z));if(st.tende){S.cil(w*.6,w*.64,h*.8,8,x,y,z,st.muro,{c2:'#fff7e0'});S.cono(w*.74,h*.8,8,x,y+h*.8,z,st.tetto)}else{S.box(w,h,w*.85,x,y,z,st.muro,{ry,c2:'#fff7e0'});S.tetto(w*1.16,h*.8,w,x,y+h,z,st.tetto,{ry})}};
   const steccato=(x0,z0,x1,z1)=>{const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/2);for(let k=0;k<n;k++){const x=x0+(x1-x0)*(k+.5)/n,z=z0+(z1-z0)*(k+.5)/n;S.box(2,.12,.1,x,Math.max(0,alto(x,z))+.6,z,'#7a5a3a',{ry:Math.atan2(x1-x0,z1-z0)+1.5708});S.box(.14,.9,.14,x,Math.max(0,alto(x,z)),z,'#6a4a2e')}};
   const campo2=(x,z,c1,c2)=>{for(let q=0;q<5;q++)S.box(7,.08,1.1,x,Math.max(0,alto(x,z))+.04,z+q*1.3,q%2?c1:c2)};
   // le zone «case» del campo: da tre a cinque case del luogo vicino, in due file sfalsate
   (s.zone||[]).forEach((zc,zi)=>{if(zc.k!=='case')return;const n=3+Math.floor(r(zi+30)*3);for(let k=0;k<n;k++)casa(zc.x+((k+.5)/n*2-1)*zc.rx*.72,zc.y+(k%2?.38:-.38)*zc.ry+(r(k+zi*7+40)-.5)*zc.ry*.3,2.8+r(k+50)*.8,2.4+r(k+60)*.8,r(k+70)*3)});
   if(vic.tipo==='villaggio'||vic.tipo==='porto'){for(let k=0;k<7;k++)casa(4+r(k)*(C.W-8),-5-r(k+9)*12,3.2+r(k+3),2.4+r(k+5)*.8,r(k+7)*3);steccato(2,-2,cx0-6,-2);steccato(cx0+6,-2,C.W-2,-2);
    campo2(-13,20,'#d9c45a','#b9c552');campo2(C.W+13,48,'#c98a3c','#9fbf50');if(!st.tende){S.cil(1.4,1.9,6,8,C.W+9,alto(C.W+9,14),14,st.muro,{c2:'#fff7e0'});S.cono(2.1,2.4,8,C.W+9,alto(C.W+9,14)+6,14,st.tetto);for(let k=0;k<4;k++)S.box(.5,4.4,.14,C.W+9,alto(C.W+9,14)+5,15.8,'#efe6cf',{rz:k*1.5708+.4})}
    for(let k=0;k<5;k++)S.cono(1.1,1.6,6,-8-r(k+20)*8,alto(-10,60),56+k*3,'#e0c45a')}
   else if(vic.tipo==='locanda'){const x=C.W+10,z=44,y=Math.max(0,alto(x,z));S.box(8,4,6,x,y,z,'#e9dfc6',{c2:'#fff7e0'});S.box(8.2,.4,6.2,x,y+4,z,'#5a4030');S.box(8,2.6,6,x,y+4.4,z,'#d9c9a6');S.tetto(7.2,3.4,9,x,y+7,z,'#a8502e');S.box(1.2,3.6,1.2,x+2,y+8,z-1,'#8b8680');
    S.box(.4,5,.4,x-5.5,y,z+4,'#5a4030');S.box(2.4,1.6,.2,x-5.5,y+3.4,z+4,'#e0b83a');S.box(4,1.6,2.4,x-7,y+.6,z-6,'#8a6a48');for(const o of[-1.4,1.4])S.cil(.9,.9,.3,8,x-7+o,y+.9,z-4.6,'#5a4030',{rx:1.5708});steccato(C.W+4,30,C.W+4,58);K.fuochi.push([x-4,y,z+7])}
   else if(vic.tipo==='monastero'){const x=cx0,z=-13,y=Math.max(0,alto(x,z));S.box(9,7,14,x,y,z,'#e6dcc4',{c2:'#fff8e6'});S.tetto(10.4,5,15,x,y+7,z,'#8a4a3a',{ry:0});S.box(4.4,16,4.4,x-8,y,z+2,'#e6dcc4',{c2:'#fff8e6'});S.cono(3.8,5.4,4,x-8,y+16,z+2,'#8a4a3a',{ry:.785});S.box(.4,2.4,.4,x-8,y+21.4,z+2,'#e8c35a');S.box(1.6,.4,.4,x-8,y+22.6,z+2,'#e8c35a');
    for(let k=0;k<9;k++)S.box(3.4,2.4,.8,6+k*6,Math.max(0,alto(6+k*6,-3)),-3,'#cfc6b0');for(let k=0;k<8;k++)S.box(.5,1.4+r(k)*.6,.2,C.W+6+r(k)*8,alto(C.W+10,20+k*3),20+k*3.2,'#b8b2a4')}
   else if(vic.tipo==='citta'||vic.tipo==='castello'){const p='#aaa49b',p2='#cfc8bc',F=rg(vic.faz,"neu"),z=-17;S.box(C.W+50,6,2.4,cx0,alto(cx0,z),z,p,{c2:p2});for(let k=0;k<Math.floor((C.W+50)/2.4);k++)S.box(1.2,1,.8,-25+1+k*2.4,alto(cx0,z)+6,z+.8,p2);
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
  if(s.tipo==='arena'){const S=A.Solidi(),F=rg(scheda.fazb,"neu"),cx=C.W/2,cz=C.H/2,R=C.ARENA+1.4,N=40,PI2=Math.PI*2,pt=(rr,a)=>[cx+Math.cos(a)*rr,cz+Math.sin(a)*rr];
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
  K.fig=A.Schiera(sc,520);K.ste=A.Stendardi(sc,24);K.par=A.Particelle(sc,400);
  // vista del comandante: i reparti diventano blocchi piatti (una base scura e il colore del lato), a istanze
  K.blk=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:'#ffffff'}),48);K.blk.instanceColor=new T.InstancedBufferAttribute(new Float32Array(48*3).fill(1),3);K.blk.count=0;K.blk.frustumCulled=false;sc.add(K.blk);
  K.fre=new T.InstancedMesh(new T.BoxGeometry(.07,.07,1.1),new T.MeshBasicMaterial({color:'#f4ecd8'}),90);K.fre.count=0;K.fre.frustumCulled=false;sc.add(K.fre);
  const anello=(c,r)=>{const m=new T.Mesh(new T.RingGeometry(r,r+.16,22),new T.MeshBasicMaterial({color:c,transparent:true,opacity:.95,depthTest:false}));m.rotation.x=-Math.PI/2;m.renderOrder=5;m.visible=false;sc.add(m);return m};
  K.anCap=anello('#ffd75a',.8);K.anMeta=anello('#fff2b0',.5);K.anBers=anello('#ff5a4a',.85);K.anGr=anello('#fff2b0',1);K.anGr.material.opacity=.55;K.anGr.geometry=new T.RingGeometry(.97,1,48);
  {const pl=new T.Mesh(new T.BoxGeometry(.1,2.4,.1),new T.MeshBasicMaterial({color:'#e8dcc0'})),bn=new T.Mesh(new T.PlaneGeometry(1.1,.7),new T.MeshBasicMaterial({color:'#f0a830',side:T.DoubleSide}));bn.position.set(.55,2,0);K.band=new T.Group();K.band.add(pl,bn);pl.position.y=1.2;K.band.visible=false;sc.add(K.band)}
}
 // le frasi del nemico: una per manovra del consiglio (passo 21), in parole nostre e senza numeri. `{t}` è il tipo del reparto
 const FRASI={carica:'I loro {t} si lanciano alla carica',avanza:'I loro {t} avanzano in linea',tieni:'I loro {t} serrano i ranghi',tiro:'I loro {t} prendono la mira',contro:'I loro {t} puntano sui tuoi cavalli',ripiega:'I loro {t} si ritirano dietro la linea',debole:'Puntano sul tuo reparto più provato',copri:'I loro {t} coprono il fianco',insegui:'I loro {t} inseguono i fuggiaschi',attendi:'I loro {t} aspettano di lato'};
 const TIPI={f:'fanti',t:'tiratori',c:'cavalieri'},LATO=x=>x<K.s.W/3?'sinistra':x>K.s.W*2/3?'destra':'centro';
 const tipoR=(s,l,r)=>{const c=r>=0&&r<3?VCAM.int.GR[r]:(s.u.find(u=>u.l===l&&u.r===r)||{}).c;return TIPI[c]||'uomini'};
 // gli eventi del campo diventano avvisi: al più due per volta, nell'ordine stendardo, rotta, ondata, piano, carro, raduno
 function parlano(ev){const s=K.s,P=[];
  for(const e of ev){let p=null,tx=null;
   if(e.t==='stendardo'){p=0;tx=e.l==='b'?'Lo stendardo nemico è caduto!':'Il tuo stendardo è caduto!'}
   else if(e.t==='rotta-r'){p=1;const U=s.u.filter(u=>u.l===e.l&&u.r===e.r&&!u.cap),x=U.length?U.reduce((a,u)=>a+u.x,0)/U.length:s.W/2;tx=e.l==='b'?'Cede un reparto nemico: '+tipoR(s,e.l,e.r)+', '+LATO(x)+'!':'Cede il reparto di '+LATO(x)+'!'}
   else if(e.t==='ondata'){p=2;const d=e.ing==='fsx'?'dal fianco sinistro':e.ing==='fdx'?'dal fianco destro':'dalle retrovie';tx=e.l==='b'?"Entra un'ondata nemica "+d:"Entra l'ondata "+d}
   else if(e.t==='piano'&&e.l==='b'&&!K.piani[e.r]){K.piani[e.r]=1;p=3;tx=(FRASI[e.m]||'Il nemico muove i suoi uomini').replace('{t}',tipoR(s,'b',e.r))}
   else if(e.t==='carro'){p=4;tx='I balestrieri corrono al carro'}
   else if(e.t==='raduno'){p=5;tx='Il Grido raduna i '+(e.r>=0&&e.r<3?tipoR(s,'a',e.r):'reparti')}
   if(tx)P.push({p,tx})}
  P.sort((a,b)=>a.p-b.p);for(const q of P.slice(0,2))Ven.avviso(q.tx)}
 const FAZ=(l)=>Object.assign({},rg(l==='a'?K.scheda.faza||'tu':K.scheda.fazb,"pre"),l==='a'?K.scheda.cola:K.scheda.colb);
 function eventi(ev){const s=K.s,mio=VCAM.capU(s,K.seat||0);parlano(ev);regiaEv(ev,s);for(const e of ev){
   if(e.t==='colpo'){const a=K.U[e.da],b=K.U[e.a],ub=s.u.find(u=>u.id===e.a);if(a&&!e.freccia)a.colpo=K.t;if(b&&e.dan>0){b.lampo=K.t;if(ub){for(let k=0;k<(e.crit?5:2);k++)K.par.emetti(ub.x,1+Math.random()*.5,ub.y,{vx:(Math.random()-.5)*3,vy:2+Math.random()*2,vz:(Math.random()-.5)*3,g:9,s:.13,dur:.5,col:e.crit?'#ffe27a':'#ffffff'})}}
    const cap=mio;if(ub&&cap&&(e.da===cap.id||e.a===cap.id)&&e.dan>0&&K.numeri.length<7)K.numeri.push({x:ub.x,z:ub.y,v:e.dan,t:K.t,cls:e.a===cap.id?'male':e.crit?'crit':''});
    if(cap&&e.a===cap.id&&e.dan>0){K.scossa=.25}}
   else if(e.t==='tiro'){K.frecce.push({x0:e.x0,z0:e.y0,x1:e.x1,z1:e.y1,t0:K.t,dur:e.vt/10/K.vel,ok:e.colpito});const a=K.U[e.da];if(a)a.colpo=K.t}
   else if(e.t==='ko'){const u=s.u.find(u=>u.id===e.id);if(u){for(let k=0;k<6;k++)K.par.emetti(u.x+(Math.random()-.5),.2,u.y+(Math.random()-.5),{vy:.8,s:.22,dur:.8,col:'#d8c8a4',cresce:1.3});if(e.cap)K.lampo=.5}}
   else if(e.t==='grido'){K.lampo=.25;for(let k=0;k<26;k++){const an=k/26*6.28;K.par.emetti(e.x,.4,e.y,{vx:Math.cos(an)*7,vz:Math.sin(an)*7,vy:.4,s:.24,dur:.7,col:'#ffe27a'})}}
   else if(e.t==='ariete'&&s.porta){if(e.pf%6===0){const m=s.muro;for(let k=0;k<4;k++)K.par.emetti((s.porta.x0+s.porta.x1)/2+(Math.random()-.5)*2,1.4,m+.9,{vy:.5,vz:.6,s:.18,dur:.5,col:'#c9b48a'});K.scossa=Math.max(K.scossa,.08)}}
   else if(e.t==='porta'&&s.porta){const m=s.muro;for(let k=0;k<22;k++)K.par.emetti(s.porta.x0+Math.random()*(s.porta.x1-s.porta.x0),.4+Math.random()*2.5,m+(Math.random()-.5)*2,{vy:1,s:.3,dur:1.1,col:'#d8c8a4',cresce:1.4});K.scossa=.35;Ven.avviso('La porta cede!')}
   else if(e.t==='rinforzi')Ven.avviso(e.l==='a'?'Arrivano i tuoi rinforzi':'Rinforzi nemici in campo');
   else if(e.t==='rotta')Ven.avviso(e.l==='a'?'I tuoi uomini sono in rotta!':'Il nemico è in rotta!');
   else if(e.t==='cap-ko')Ven.avviso(e.seat===(K.seat||0)?'Sei caduto: gli uomini combattono senza di te':'Un capitano è caduto!','male');
   else if(e.t==='fine')K.finita=true}
  if(ev.length)VenAudio.campo(ev)}
 // il rettangolo di terreno che la camera vede, allargato di `m` (le cose alte e le loro ombre entrano dal bordo)
 const visto=m=>{const A=VenArte.A,asp=A.rw>2?(A.rw-2)/(A.rh-2):.5,hx=K.alt*asp/2+m,hz=K.alt/2/VenArte.SE+m;return[K.fuoco.x-hx,K.fuoco.x+hx,K.fuoco.z-hz,K.fuoco.z+hz]};
 // erba, alberi e sassi: nel buffer solo le istanze attorno alla camera; si rifà quando la camera esce dal rettangolo già pronto o lo vede molto più piccolo
 function ritaglia(){const v=visto(6),w=visto(18),r=K._rq;if(!K.sce||(r&&v[0]>=r[0]&&v[1]<=r[1]&&v[2]>=r[2]&&v[3]<=r[3]&&r[0]>=w[0]&&r[1]<=w[1]&&r[2]>=w[2]&&r[3]<=w[3]))return;const q=K._rq=visto(12);
  for(const o of K.sce){const M=o.me.instanceMatrix.array,Cc=o.me.instanceColor.array;let n=0;
   for(let k=0;k<o.X.length;k++){const x=o.X[k],z=o.Z[k];if(x<q[0]||x>q[1]||z<q[2]||z>q[3])continue;M.set(o.M.subarray(k*16,k*16+16),n*16);Cc.set(o.Cc.subarray(k*3,k*3+3),n*3);n++}
   o.me.count=n;o.me.instanceMatrix.needsUpdate=o.me.instanceColor.needsUpdate=true}}
 // tetto delle figure intere per lato (qualità): le più vicine al centro dell'inquadratura restano intere, le altre diventano omini (livello 2). Torna il quadrato della distanza limite
 function tetto(s,V,bud){const D={a:[],b:[]},fx=K.fuoco.x,fz=K.fuoco.z,lim={a:1e9,b:1e9};if(bud>=1e9)return lim;
  for(const u of s.u){if(u.cap||u.st==='via'||u.x<V[0]||u.x>V[1]||u.y<V[2]||u.y>V[3])continue;D[u.l].push((u.x-fx)*(u.x-fx)+(u.y-fz)*(u.y-fz))}
  for(const l of['a','b'])if(D[l].length>bud)lim[l]=bud>0?D[l].sort((p,q)=>p-q)[bud-1]:-1;return lim}

 // ---- la regia: la camera inquadra dove si combatte, con le due schiere in vista, e stacca sui momenti decisivi (solo vista). K.ripr ∈ regia · capitano · libera (K.cam è la camera 3D) ----
 const tvOn=()=>typeof ui!=='undefined'&&!!ui.tv;
 // dove guardare: media pesata delle unità che hanno colpito o sono state colpite negli ultimi 30 istanti (peso 3) e di tutte le vive (peso 1); altezza tale che le vive dei due lati stiano nell'80% della vista
 function inquadra(s){const A=VenArte.A,asp=A&&A.rw>2?(A.rw-2)/(A.rh-2):.5,V=s.u.filter(u=>u.st==='vivo');if(!V.length)return{x:K.fuoco.x,z:K.fuoco.z,alt:K.alt,grande:false};
  const H=K.hot.filter(h=>h.t>=s.t-30);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,sx=0,sz=0,w=0;
  for(const u of V){x0=Math.min(x0,u.x);x1=Math.max(x1,u.x);z0=Math.min(z0,u.y);z1=Math.max(z1,u.y);sx+=u.x;sz+=u.y;w++}
  for(const h of H){sx+=3*h.x;sz+=3*h.z;w+=3}
  let x=sx/w,z=sz/w;const hw=Math.max(x-x0,x1-x)+3,hz=Math.max(z-z0,z1-z)+3,alt=Math.max(2*hw/(.8*asp),2*hz*VenArte.SE/.8);
  if(alt>K.ALT_MAX){   // battaglia grande: il fronte più caldo, cioè la cella da 20 passi con più colpi recenti
   const C={};let b=null;for(const h of H){const k=Math.floor(h.x/20)+','+Math.floor(h.z/20),c=C[k]||(C[k]={n:0,x:0,z:0});c.n++;c.x+=h.x;c.z+=h.z;if(!b||c.n>b.n)b=c}
   if(b){x=b.x/b.n;z=b.z/b.n}return{x,z,alt:K.ALT_MAX,grande:true}}
  return{x,z,alt:Math.max(K.ALT_MIN,alt),grande:false}}
 const cen=(s,f)=>{let n=0,x=0,z=0;for(const u of s.u)if(f(u)){x+=u.x;z+=u.y;n++}return n?{x:x/n,z:z/n}:null};
 function stacca(p){if(!p||(K.ripr!=='regia'&&!tvOn())||(K.stacco&&K.t<K.stacco.fino)||K.t-K.ultStacco<6)return;K.stacco={x:p.x,z:p.z,fino:K.t+1.6};K.ultStacco=K.t}
 function regiaEv(ev,s){let M=null,car=0,cx=0,cz=0;
  for(const e of ev){
   if(e.t==='colpo'){M=M||new Map(s.u.map(u=>[u.id,u]));const a=M.get(e.da),b=M.get(e.a);for(const u of[a,b])if(u)K.hot.push({t:s.t,x:u.x,z:u.y});if(e.carica&&b){car++;cx+=b.x;cz+=b.y}}
   else if(e.t==='rotta-r')stacca(cen(s,u=>u.l===e.l&&u.r===e.r));
   else if(e.t==='stendardo'||e.t==='cap-ko'){const c=e.t==='cap-ko'?VCAM.capU(s,e.seat||0):null,p=c?{x:c.x,z:c.y}:cen(s,u=>u.l===e.l&&VDAT.TR[u.t]&&VDAT.TR[u.t].capo)||cen(s,u=>u.l===e.l&&u.st==='vivo');stacca(p);if(!K.esterno)K.lento=.7}
   else if(e.t==='porta'&&s.porta)stacca({x:(s.porta.x0+s.porta.x1)/2,z:s.muro});
   else if(e.t==='ondata'){const W=s.W,H=s.H,a=e.l==='a';stacca(e.ing==='fsx'?{x:2,z:H/2}:e.ing==='fdx'?{x:W-2,z:H/2}:{x:W/2,z:a?H-2:2})}
   else if(e.t==='piano'){if(e.m==='aggira'||e.m==='esca'||e.m==='caccia')stacca(cen(s,u=>u.l===e.l&&u.r===e.r));
    if(e.l==='b'&&K.grande&&K.t-K.ultLont>=2){K.lont=K.t+2;K.ultLont=K.t}}}
  if(car>=3)stacca({x:cx/car,z:cz/car});
  if(K.hot.length>400)K.hot.splice(0,K.hot.length-400)}
 // un passo di regia per fotogramma; avvicinamento indipendente dai fotogrammi
 function regia(s,dt){if(tavolo(s))return;const m=tvOn()?'regia':K.ripr;K.segue=m==='capitano';
  if(K.tCap&&K.t>=K.tCap){K.tCap=0;if(K.ripr==='capitano')K.ripr='regia'}
  if(K.lento>0)K.lento-=dt;
  if(m!=='regia')return;
  const q=inquadra(s);K.grande=q.grande;let T=q;
  if(K.stacco&&K.t<K.stacco.fino)T={x:K.stacco.x,z:K.stacco.z,alt:26};
  else{K.stacco=null;if(q.grande&&K.t-K.ultLont>=12){K.lont=K.t+2;K.ultLont=K.t}if(K.lont>K.t)T={x:s.W/2,z:s.H/2,alt:150}}
  const k=1-Math.pow(T===q?.92:.85,Math.min(dt,.1)*60);K.fuoco.x+=(T.x-K.fuoco.x)*k;K.fuoco.z+=(T.z-K.fuoco.z)*k;K.alt+=(T.alt-K.alt)*k;K.fit=false}
 // il tasto «occhio» nella barra alta: regia, capitano, libera
 const OCC={regia:'Regia',capitano:'Capitano',libera:'Libera'};
 function occhio(){if(tvOn())return;const h=document.querySelector('.vn-alto .vn-capo');if(!h)return;let b=h.querySelector('.vn-occ');
  if(!b){b=document.createElement('button');b.className='vn-ib vn-occ';b.type='button';b.innerHTML='<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
   b.addEventListener('click',e=>{e.stopPropagation();K.ripr=K.ripr==='regia'?'capitano':K.ripr==='capitano'?'libera':'regia';K.tCap=0;K.stacco=null;occhio()});h.appendChild(b)}
  b.setAttribute('aria-label','Camera: '+OCC[K.ripr]);b.classList.toggle('on',K.ripr!=='regia')}
 function passo(dt){const s=K.s;if(!s||!K.scene)return;const T=VenArte.T,A=VenArte,C=VCAM.C;K.t+=dt;K.dt=dt;
  {const tv=tavolo(s);if(tv!==K._tv){K._tv=tv;if(tv){K.segue=false;K.fit=true;K.selR=null}else if(typeof ui!=='undefined'&&ui.tv){K.alt=80;K.fuoco.x=s.W/2;K.fuoco.z=s.H/2}else{K.segue=true;K.alt=38}render()}if(tv&&K.fit)fitta()}
  if(K.portone){const su=!!(s.porta&&s.porta.pf>0);K.portone.visible=su;K.abbattuto.visible=!su}
  if(!K.esterno&&!K.pausa&&!s.fine){K.acc+=dt*10*K.vel*(K.lento>0?.35:1);let n=0;while(K.acc>=1&&n++<6){K.acc-=1;eventi(VCAM.passo(s,1))}if(K.acc>1)K.acc=0}
  regia(s,dt);const al=s.fine||K.pausa?1:Math.min(1,K.acc),cap=VCAM.capU(s,K.seat||0);
  // livello di dettaglio dall'altezza della camera: 0 vicino (<45), 1 medio, 2 lontano (>=80: vista del comandante). Al tavolo e sulla TV si vedono sempre le figure
  const lod=K.lod=(l=>tavolo(s)||(typeof ui!=='undefined'&&ui.tv)?Math.min(l,1):l)(K.alt<45?0:K.alt<80?1:2),bud={bassa:70,media:110}[VenArte.qual()]||1e9;
  K.ste.inizio();const dF=dt+(K._dtA||0);let cen=K._cen;
  const salta=lod===1&&K._lodP===1&&cen&&(K._fr=(K._fr|0)+1)%2===1;K._lodP=lod;
  if(lod===2){K.fig.inizio();K.fig.fine();K._dtA=0}
  else if(salta)K._dtA=dF;   // al livello medio le figure si aggiornano un fotogramma su due
  else{K._dtA=0;cen=K._cen={a:{f:[0,0,0],t:[0,0,0],c:[0,0,0]},b:{f:[0,0,0],t:[0,0,0],c:[0,0,0]}};K.fig.inizio();K.fig.livello(lod?1:0);{const dt=dF,V=visto(4),lim=tetto(s,V,bud);let caduti=0;
  for(let i=s.u.length-1;i>=0;i--){const u=s.u[i];if(u.st==='via')continue;if(u.l==='b'&&s.primo==='a'&&s.rep&&(K._tv||K.t<K.tvT))continue;let q=K.U[u.id];if(!q)q=K.U[u.id]={f:Math.random(),yaw:u.l==='a'?Math.PI:0,giu:0,colpo:-9,lampo:-9};
   const x=u.st==='ko'?u.x:u.px+(u.x-u.px)*al,z=u.st==='ko'?u.y:u.py+(u.y-u.py)*al,mosso=Math.hypot(u.x-u.px,u.y-u.py);
   if(u.st==='ko'){q.giu=Math.min(1,q.giu+dt*3.2);if(++caduti>46&&q.giu>=1)continue}else{if(mosso>.02)q.f+=dt*(u.c==='c'||u.cav?3.2:2.6)*K.vel*(K.pausa?0:1);const ya=Math.atan2(u.fx,u.fy);let da=ya-q.yaw;while(da>Math.PI)da-=6.283;while(da<-Math.PI)da+=6.283;q.yaw+=da*Math.min(1,dt*12)}
   const F=FAZ(u.l),tc=K.t-q.colpo,tf=(VDAT.TR[u.t]||{}).faz,xt=tf&&rg0(tf),FT=xt&&!xt.ignota?xt:F,mioL=u.l==='a';
   // chi sale una scala: la quota va dal piede al camminamento in SCALA istanti
   const sal=u.sal>s.t?Math.min(1,Math.max(0,1-(u.sal-s.t-1+al)/C.AS.SCALA)):-1;
   // fuori dall'inquadratura la figura non si disegna (e non conta nel tetto delle figure intere): conta solo per lo stendardo del reparto
   const fuori=!u.cap&&(x<V[0]||x>V[1]||z<V[2]||z>V[3]);if(fuori){if(u.st==='vivo'){const g=cen[u.l][u.c];g[0]+=x;g[1]+=z;g[2]++}continue}
   K.fig.metti({x,y:sal>=0?sal*C.AS.MURO_Q*C.TER.ALTO+.2:Math.max(-.4,K.alto(x,z)),z:sal>=0?z+.6-sal*1.4:z,yaw:q.yaw,sc:u.cap||s.tipo==='arena'?1.75:VDAT.TR[u.t]&&VDAT.TR[u.t].capo?1.8:1.48,base:u.cap?null:mioL?'#f0a030':'#7a1c1c',col:u.cap?CAPC[u.seat||0]:mioL&&tf!=="tu"?FT.col:F.col,col2:u.cap?'#fff4d6':mioL?'#f0a030':F.col2,asp:u.cap?(u.asp||{}):u.asp||VDAT.aspetto(u.t),cav:u.cav||u.c==='c',fase:mosso>.02&&u.st!=='ko'?q.f:0,colpo:tc<.32?tc/.32:0,giu:q.giu,lampo:K.t-q.lampo<.09,seme:u.id,liv:u.cap?0:(x-K.fuoco.x)*(x-K.fuoco.x)+(z-K.fuoco.z)*(z-K.fuoco.z)>lim[u.l]?2:lod?1:0});
   if(u.st==='vivo'&&!u.cap){const g=cen[u.l][u.c];g[0]+=x;g[1]+=z;g[2]++}
   if(u.st==='fuga'&&Math.random()<dt*2)K.par.emetti(x,.1,z,{vy:.4,s:.16,dur:.6,col:'#d8c8a4',cresce:1});
   else if(mosso>.3&&Math.random()<dt*6)K.par.emetti(x,.1,z,{vy:.5,s:.18,dur:.7,col:K.scheda.bioma===1?'#ffffff':'#d8c8a4',cresce:1.2})}
  }K.fig.fine()}
  if(lod===2){K.bl=blocchi(s);blocchiMesh(K.bl);for(const b of K.bl)K.ste.metti(b.x,0,b.y,FAZ(b.l).col,3.2,K.t,b.r+(b.l==='a'?0:9))}
  else{K.bl=null;blocchiMesh(null);if(cen)for(const l of['a','b'])for(const g of['f','t','c']){const c=cen[l][g];if(c[2]>1)K.ste.metti(c[0]/c[2],0,c[1]/c[2]+(l==='a'?1.2:-1.2),FAZ(l).col,1.8,K.t,g.charCodeAt(0)+(l==='a'?0:9))}}
  for(const id of s.capi){const q=s.u.find(u=>u.id===id);if(q&&q.st==='vivo'&&q!==cap)K.ste.metti(q.px+(q.x-q.px)*al-.9,0,q.py+(q.y-q.py)*al+.6,CAPC[q.seat||0],2.1,K.t,5+q.seat)}
  if(cap&&cap.st==='vivo'){const cx=cap.px+(cap.x-cap.px)*al,cz=cap.py+(cap.y-cap.py)*al;K.ste.metti(cx-.9,0,cz+.6,CAPC[cap.seat||0],2.3,K.t,3);K.anCap.visible=true;K.anCap.position.set(cx,.08,cz);
   if(cap.vx!=null){K.anMeta.visible=true;K.anMeta.position.set(cap.vx,.08,cap.vy);const sp=1+Math.sin(K.t*6)*.2;K.anMeta.scale.set(sp,sp,sp)}else K.anMeta.visible=false;
   const b=cap.ob>=0?s.u.find(u=>u.id===cap.ob&&u.st==='vivo'):null;if(b){K.anBers.visible=true;K.anBers.position.set(b.x,.09,b.y)}else K.anBers.visible=false;
   if(K.segue){const k=Math.min(1,dt*4);K.fuoco.x+=(cx-K.fuoco.x)*k;K.fuoco.z+=(cz-7-K.fuoco.z)*k}}
  else{K.anCap.visible=K.anMeta.visible=K.anBers.visible=false}
  hudGruppo(s);K.ste.fine();
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
  K.fuoco.x=Math.max(4,Math.min((s.W||C.W)-4,K.fuoco.x));K.fuoco.z=Math.max(2,Math.min((s.H||C.H)-2,K.fuoco.z));
  const L=K.luce.ora(K.ora,{x:(s.W||C.W)/2,y:0,z:K.fuoco.z},48);if(L.notte>.3){K.luce.amb.intensity+=.62*L.notte;K.luce.sole.intensity+=.5*L.notte}K.lampo=Math.max(0,K.lampo-dt*1.6);K.scossa=Math.max(0,K.scossa-dt);
  const sx=K.scossa>0?(Math.random()-.5)*K.scossa*2:0;
  if(K.acqua)K.acqua.uniforms.luce.value=1-L.notte*.5;
  ritaglia();A.disegna(K.scene,K.cam,{x:K.fuoco.x+sx,y:0,z:K.fuoco.z+sx},K.alt,{notte:L.notte,lampo:K.lampo*.5,nebbia:met==='nebbia'?.5:met==='pioggia'?.2:0,tinta:met==='pioggia'?[.9,.94,1]:K.ora>17.5&&K.ora<20.5?[1.06,.97,.9]:null});
  {const sg=s.ond?s.ond.a.filter(w=>!w.fatta&&w.quando.k==='comando').map(w=>w.id+':'+w.tr.reduce((a,x)=>a+x.n,0)).join():'';if(K.sigO!==undefined&&sg!==K.sigO)render();K.sigO=sg}
  numeri()}
 function numeri(){const host=document.querySelector('.vn-etc');if(!host)return;const A=VenArte;let h=tavoloH()+lontanoH();K.numeri=K.numeri.filter(n=>K.t-n.t<.8);
  for(const n of K.numeri){const q=(K.t-n.t)/.8,p=A.aSchermo(K.cam,n.x,2.2+q*2.4,n.z);h+='<i class="vn-num '+n.cls+'" style="left:'+Math.round(p.x)+'px;top:'+Math.round(p.y)+'px;opacity:'+(1-q*q).toFixed(2)+'">'+n.v+'</i>'}
  if(host._h!==h){host.innerHTML=h;host._h=h}}
 function trascina(dx,dy){K.ripr='libera';K.fit=false;const A=VenArte,r=A.cv.getBoundingClientRect(),u=K.alt/r.height;K.fuoco.x-=dx*u;K.fuoco.z-=dy*u/A.SE;K.segue=false}
 function pizzico(f){K.ripr='libera';K.fit=false;K.alt=Math.max(24,Math.min(K._tv?220:Math.max(130,((K.s&&K.s.W)||60)*2.3),K.alt/f))}
 // vista del comandante: toccare un blocco tuo sceglie il suo gruppo, uno nemico lo attacca (bersaglio largo almeno 44 px)
 function toccoBlocco(px,py,r){const A=VenArte,x=px-r.left,y=py-r.top;let m=null,md=1e9;
  for(const b of K.bl||[]){const c=[[b.x-b.w/2,b.y-b.h/2],[b.x+b.w/2,b.y-b.h/2],[b.x-b.w/2,b.y+b.h/2],[b.x+b.w/2,b.y+b.h/2]].map(q=>A.aSchermo(K.cam,q[0],0,q[1])),xs=c.map(q=>q.x),ys=c.map(q=>q.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,hw=Math.max(22,(Math.max(...xs)-Math.min(...xs))/2),hy=Math.max(22,(Math.max(...ys)-Math.min(...ys))/2);
   if(Math.abs(x-cx)<=hw&&Math.abs(y-cy)<=hy){const d=Math.hypot(x-cx,y-cy);if(d<md){md=d;m=b}}}
  if(!m)return null;
  if(m.l==='a'){K.gruppo=m.c;K.selR=null;render();return{}}
  const u=K.s.u.find(u=>u.l==='b'&&u.r===m.r&&!u.cap&&u.st==='vivo');return u?{b:u.id}:{}}
 function tocco(px,py){const A=VenArte,s=K.s;if(!s||s.fine)return null;const r=A.cv.getBoundingClientRect();let m=null,md=26;
  const cp=()=>{if(K.ripr==='regia'&&!tvOn()&&!tavolo(s)){K.ripr='capitano';K.tCap=K.t+4}};
  if(K.lod===2){const o=toccoBlocco(px,py,r);if(o){if(o.b!=null){cp();return o}return null}}
  if(K.selR!=null&&tavolo(s)){const g=A.aTerra(K.cam,px,py,0);VenScontro.schieraSu(K.selR,g.x,g.z);return null}
  for(const u of s.u){if(u.l!=='b'||u.st!=='vivo')continue;const c=A.aSchermo(K.cam,u.x,.9,u.y),d=Math.hypot(c.x-(px-r.left),c.y-(py-r.top));if(d<md){md=d;m=u}}
  cp();
  if(m)return{b:m.id};const g=A.aTerra(K.cam,px,py,0);return{x:g.x,y:g.z}}
 const centra=(x,y)=>{if(x==null){K.ripr='capitano';K.segue=true;return}K.ripr='libera';K.fit=false;K.segue=false;K.fuoco.x=x;K.fuoco.z=y-7};
 // anello del gruppo scelto, bandierina dell'ordine «Tieni» e HUD (mini-mappa, morale) quattro volte al secondo
 function hudGruppo(s){const g=K.gruppo,U=g==='tutti'?[]:s.u.filter(u=>u.l==='a'&&u.st==='vivo'&&!u.cap&&u.c===g);
  if(U.length&&K.anGr){let cx=0,cy=0;for(const u of U){cx+=u.x;cy+=u.y}cx/=U.length;cy/=U.length;let m=0;for(const u of U)m=Math.max(m,Math.hypot(u.x-cx,u.y-cy));K.anGr.visible=true;K.anGr.position.set(cx,.07,cy);const q=Math.min(14,m+1.6);K.anGr.scale.set(q,q,q);
   const o=s.ord&&s.ord.a&&s.ord.a[g];if(o&&o.t==='tieni'&&o.x!=null&&Math.hypot(o.x-cx,o.y-cy)>2.5){K.band.visible=true;K.band.position.set(o.x,0,o.y)}else K.band.visible=false}
  else{if(K.anGr)K.anGr.visible=false;if(K.band)K.band.visible=false}
  if(K.t-(K._hud||0)>=.25&&typeof VenScontro!=='undefined'){K._hud=K.t;const cv=document.getElementById('vn-mm');if(cv)VenScontro.minimappa(cv);VenScontro.hudReparti();occhio()}}
 // il tavolo: il campo intero entra nella parte libera dello schermo (sopra le barre, sotto i comandi)
 function fitta(){const s=K.s,A=VenArte;if(!K.cam||!A.cv)return;const r=A.cv.getBoundingClientRect();if(!r.width)return;const tvm=typeof ui!=='undefined'&&ui.tv,top=tvm?56:84,bot=tvm?60:200;
  const P=[[0,0],[s.W,0],[0,s.H],[s.W,s.H]].map(q=>A.aSchermo(K.cam,q[0],0,q[1])),xs=P.map(p=>p.x),ys=P.map(p=>p.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const f=Math.min((r.width-10)/Math.max(1,x1-x0),(r.height-top-bot)/Math.max(1,y1-y0));K.alt=Math.max(24,Math.min(220,K.alt*Math.pow(1/f,.6)));
  const u=K.alt/r.height;K.fuoco.z-=(top+(r.height-top-bot)/2-(y0+y1)/2)*u/A.SE*.6;K.fuoco.x-=(r.width/2-(x0+x1)/2)*u*.6}
 // vista del comandante: un blocco per reparto vivo (centro, ingombro, uomini, morale). Funzione pura sullo stato della battaglia.
 function blocchi(s){const out=[],GR=VCAM.int.GR;
  for(const l of['a','b']){const G={},mo=VCAM.morali?VCAM.morali(s,l):[];
   for(const u of s.u){if(u.l!==l||u.cap||u.r<0||(u.st!=='vivo'&&u.st!=='fuga'))continue;const g=G[u.r]||(G[u.r]={x0:1e9,x1:-1e9,y0:1e9,y1:-1e9,sx:0,sy:0,n:0,c:u.c});g.x0=Math.min(g.x0,u.x);g.x1=Math.max(g.x1,u.x);g.y0=Math.min(g.y0,u.y);g.y1=Math.max(g.y1,u.y);g.sx+=u.x;g.sy+=u.y;g.n++}
   for(const k of Object.keys(G).map(Number).sort((a,b)=>a-b)){const g=G[k],m=mo.find(q=>q.r===k);
    out.push({l,r:k,c:k<3?GR[k]:g.c,x:g.sx/g.n,y:g.sy/g.n,w:Math.max(5,g.x1-g.x0+2.4),h:Math.max(3.6,g.y1-g.y0+2.4),n:g.n,mor:m?m.mor:Math.round(s.mor[l])})}}
  return out}
 function blocchiMesh(bl){const me=K.blk;if(!me)return;let n=0;
  if(bl){const d=K._db||(K._db=new VenArte.T.Object3D()),c=new VenArte.T.Color();
   for(const b of bl){if(n+2>48)break;const y=K.alto(b.x,b.y)+.5;
    d.position.set(b.x,y,b.y);d.rotation.set(0,0,0);d.scale.set(b.w+.9,.6,b.h+.9);d.updateMatrix();me.setMatrixAt(n,d.matrix);c.set('#2a1a0e');me.instanceColor.setXYZ(n++,c.r,c.g,c.b);
    d.position.y=y+.15;d.scale.set(b.w,.6,b.h);d.updateMatrix();me.setMatrixAt(n,d.matrix);c.set(FAZ(b.l).col);me.instanceColor.setXYZ(n++,c.r,c.g,c.b)}}
  me.count=n;me.instanceMatrix.needsUpdate=true;me.instanceColor.needsUpdate=true}
 // due gettoni (o blocchi) non si coprono mai: se i centri sono troppo vicini si affiancano (almeno 58 px in orizzontale o 44 in verticale)
 function separa(L,W){const SX=58,SY=44;
  for(let it=0;it<24;it++){let ok=true;
   for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j],dx=b.x-a.x;if(Math.abs(dx)>=SX||Math.abs(b.y-a.y)>=SY)continue;ok=false;const sg=dx>0||(dx===0&&i<j)?1:-1,m=(SX-Math.abs(dx))/2+.5;a.x-=sg*m;b.x+=sg*m}
   for(const q of L)q.x=Math.max(SX/2,Math.min(W-SX/2,q.x));
   if(ok)break}
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(Math.abs(b.x-a.x)<SX&&Math.abs(b.y-a.y)<SY)b.y=a.y+SY*(j-i)}}
 // alture e boschi hanno il nome scritto sul terreno
 function nomiZone(P){let t='';for(const z of K.s.zone||[]){if(z.k!=='altura'&&z.k!=='bosco')continue;const p=P(z.x,z.y);t+=`<text x="${p.x.toFixed(0)}" y="${p.y.toFixed(0)}" style="opacity:.85">${z.k==='altura'?'Altura':'Bosco'}</text>`}return t}
 // vista del comandante: frecce delle manovre e dei reparti, numero e barra del morale di ogni blocco, sopra il campo (sola visione)
 function lontanoH(){const s=K.s,A=VenArte;if(!s||K.lod!==2||!K.bl||!K.cam)return'';const P=(x,z)=>A.aSchermo(K.cam,x,0,z),f=n=>n.toFixed(0),W=A.cv.getBoundingClientRect().width,GR=VCAM.int.GR;let sv=nomiZone(P),gt='';const IT=[];
  for(const b of K.bl){const p=P(b.x,b.y),o=s.ord&&s.ord[b.l]&&s.ord[b.l][b.r<3?GR[b.r]:b.r];IT.push({x:p.x,y:p.y,b});
   if(o&&o.x!=null&&Math.hypot(o.x-b.x,o.y-b.y)>3){const q=P(o.x,o.y),dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,col=FAZ(b.l).col;
    sv+=`<line x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(q.x-ux*8)}" y2="${f(q.y-uy*8)}" stroke="${col}" stroke-width="4" stroke-linecap="round" opacity=".9"/><polygon points="${f(q.x)},${f(q.y)} ${f(q.x-ux*14-uy*8)},${f(q.y-uy*14+ux*8)} ${f(q.x-ux*14+uy*8)},${f(q.y-uy*14-ux*8)}" style="fill:${col};stroke:#2a1a0e;stroke-width:1.5;stroke-dasharray:none"/>`}}
  separa(IT,W);
  for(const i of IT){const b=i.b;gt+=`<i class="vt-g${b.l==='b'?' ne':''}${K.gruppo===b.c&&b.l==='a'?' on':''}" style="left:${f(i.x)}px;top:${f(i.y)}px;min-width:44px;min-height:30px;justify-content:center">${ic({f:'scudo',t:'freccia',c:'passi'}[b.c]||'scudo',14)}<b>${b.n}</b><u style="position:absolute;left:5px;right:5px;bottom:-7px;height:5px;border-radius:3px;background:#2a1a0e;border:1px solid #d8b26a;overflow:hidden"><u style="display:block;height:100%;width:${b.mor}%;background:${b.mor<25?'#e0523c':b.mor<50?'#e0a430':'#6cbf5a'}"></u></u></i>`}
  return`<svg class="vt-sv">${sv}</svg>${gt}`}
 // settori, frecce degli ingressi e gettoni dei reparti, disegnati sopra il campo (sola visione: i tocchi passano al campo)
 function tavoloH(){const s=K.s,A=VenArte;if(!s||!s.rep||!(tavolo(s)||K.t<K.tvT)||!K.cam)return'';const P=(x,z)=>A.aSchermo(K.cam,x,0,z),f=n=>n.toFixed(0);let sv='',gt='';
  const NOMI={sx:'Sinistra',cx:'Centro',dx:'Destra',avan:'Avanguardia',alt:'Altura',imb:'Imboscata',mura:'Mura',cortile:'Cortile'};
  if(tavolo(s))for(const z of VCAM.settori(s,'a')){
   if(z.k==='ingresso'){const px=z.id==='fsx'?0:z.id==='fdx'?s.W:(z.x0+z.x1)/2,pz=z.id==='retro'?s.H:(z.y0+z.y1)/2,ix=z.id==='fsx'?4:z.id==='fdx'?-4:0,iz=z.id==='retro'?-4:0,p=P(px,pz),q=P(px+ix,pz+iz),dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
    sv+=`<polygon class="ar" points="${f(p.x+ux*20)},${f(p.y+uy*20)} ${f(p.x-uy*11)},${f(p.y+ux*11)} ${f(p.x+uy*11)},${f(p.y-ux*11)}"/>`;continue}
   const c=[[z.x0,z.y0],[z.x1,z.y0],[z.x1,z.y1],[z.x0,z.y1]].map(q=>P(q[0],q[1])),m=P((z.x0+z.x1)/2,(z.y0+z.y1)/2);
   sv+=`<polygon points="${c.map(p=>f(p.x)+','+f(p.y)).join(' ')}"/><text x="${f(m.x)}" y="${f(Math.min(...c.map(p=>p.y))+11)}">${NOMI[z.id.replace(/[0-9]+$/,'')]||z.id}</text>`}
  if(tavolo(s))sv+=nomiZone(P);
  const ICO={f:'scudo',t:'freccia',c:'passi'},IT=[];
  for(const l of['b','a']){const om=l==='b'&&!(s.primo==='b'||s.pronto.a),G={};
   for(const u of s.u){if(u.l!==l||u.cap||u.st!=='vivo')continue;const g=G[u.r]||(G[u.r]={x:0,y:0,n:0,c:u.c});g.x+=u.x;g.y+=u.y;g.n++}
   for(const r of Object.keys(G)){const g=G[r];let x=g.x/g.n,y=g.y/g.n;
    if(l==='b'){const e=K.gt[r]||(K.gt[r]={x,y});e.x+=(x-e.x)*Math.min(1,K.dt*5);e.y+=(y-e.y)*Math.min(1,K.dt*5);x=e.x;y=e.y}
    const p=P(x,y);IT.push({x:p.x,y:p.y,l,r,om,g})}}
  separa(IT,A.cv.getBoundingClientRect().width);   // i gettoni dello stesso settore stanno affiancati e non si coprono
  for(const i of IT){const{l,r,om,g}=i;gt+=`<i class="vt-g${l==='b'?' ne':''}${om?' om':''}${l==='a'&&K.selR===+r?' on':''}" style="left:${f(i.x)}px;top:${f(i.y)}px">${om?'':ic(ICO[g.c]||'scudo',14)+'<b>'+g.n+'</b>'}</i>`}
  return`<svg class="vt-sv">${sv}</svg>${gt}`}
 return{K,CAPC,inquadra,apri,usa,scena,eventi,passo,trascina,pizzico,tocco,centra,tavolo,blocchi,vista:on=>{K.ripr=on?'libera':'regia';K.fit=false;K.alt=on?Math.max(90,K.alt):38;K.segue=!on}}})();
