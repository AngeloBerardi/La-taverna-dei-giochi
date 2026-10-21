/* ---- Regicide sullo schermo comune: i dodici nemici in 3D e le loro animazioni (three.js) ----
   Usato da RTV3 (24k-regicide-tavolo.js), che passa palcoscenico e geometria del tavolo. Solo grafica: legge lo stato, non scrive nulla.
   Ogni nemico (Fante, Regina, Re × 4 semi) ha corona, arma e tratti suoi. Le animazioni si scelgono a caso ma in modo ripetibile (seme = partita + evento):
   entrata (5), colpo subito (4), contrattacco (4), sconfitta (4). Accodate in una coda: un solo nemico in scena, mai compenetrazioni con carte e targhette. */
const RACT=(()=>{
let T=null,K=null,scn=null,actor=null,fxg=null,cur=null,run=null,queue=[],want='',lastEvn=-1,geo=null,sec=0,reduce=false;
const SUC={H:'#d9604f',D:'#e08a3c',C:'#4f9a6a',S:'#5d72c2'},GL={H:'♥',D:'♦',C:'♣',S:'♠'};
const lin=c=>'#'+[1,3,5].map(i=>Math.round(255*Math.pow(parseInt(c.slice(i,i+2),16)/255,2.2)).toString(16).padStart(2,'0')).join('');
const sat=t=>Math.max(0,Math.min(1,t)),cl=(a,b,t)=>a+(b-a)*t,EZ=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,OUT=t=>1-Math.pow(1-t,3);
const mulb=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hsh=c=>{let h=7;for(let i=0;i<c.length;i++)h=(h*31+c.charCodeAt(i))|0;return Math.abs(h)};
const Y=.25;
/* ---------- mattoncini ---------- */
let MS=null;
const M=(c,o)=>{const m=new T.MeshStandardMaterial(Object.assign({color:lin(c),flatShading:true,roughness:.7},o||{}));if(MS)MS.push(m);return m};
const GLOW=(c,i)=>M(c,{emissive:new T.Color(lin(c)),emissiveIntensity:i==null?.9:i,roughness:.4});
const add=(p,o,x,y,z)=>{o.position.set(x||0,y||0,z||0);o.castShadow=true;p.add(o);return o};
const box=(w,h,d,m)=>new T.Mesh(new T.BoxGeometry(w,h,d),m),sph=(r,m,d)=>new T.Mesh(new T.IcosahedronGeometry(r,d==null?1:d),m),cyl=(a,b,h,n,m)=>new T.Mesh(new T.CylinderGeometry(a,b,h,n||8),m),cone=(r,h,n,m)=>new T.Mesh(new T.ConeGeometry(r,h,n||6),m),octa=(r,m)=>new T.Mesh(new T.OctahedronGeometry(r,0),m);
const tor=(r,t,m,arc,sg)=>new T.Mesh(new T.TorusGeometry(r,t,5,sg||14,arc||6.283),m);
function heart(m,s){const g=new T.Group();[-1,1].forEach(d=>add(g,sph(.5*s,m,1),d*.3*s,.26*s,0));const c=cone(.7*s,.95*s,4,m);c.rotation.set(Math.PI,Math.PI/4,0);c.scale.z=.8;add(g,c,0,-.1*s,0);g.scale.z=.6;return g}
function emblem(suit){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle=SUC[suit];g.beginPath();g.arc(64,64,62,0,7);g.fill();g.fillStyle='#f6e7c1';g.beginPath();g.arc(64,64,48,0,7);g.fill();g.fillStyle=SUC[suit];g.font='bold 76px "DejaVu Sans",serif';g.textAlign='center';g.textBaseline='middle';g.fillText(GL[suit],64,68);
 const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t}
/* ---------- armi: asse y verso l'alto, impugnatura nell'origine ---------- */
function weapon(rank,suit,P){const g=new T.Group(),{mg,mst,mk,mw}=P,wood=M('#6f4726'),dk=M('#2c2a3a');const rd=M('#d9604f'),gc=suit==='H'?GLOW('#ff5a6a',.7):suit==='D'?GLOW('#ffb040',.8):suit==='C'?GLOW('#6fe08a',.6):GLOW('#b07aff',1);
 const hilt=(len)=>add(g,cyl(.03,.03,len||.3,6,wood),0,0,0);
 if(rank==='K'){
  if(suit==='H'){hilt(.34);add(g,box(.42,.07,.07,mg),0,.16,0);add(g,box(.1,1.05,.03,mst),0,.72,0);add(g,cone(.05,.18,4,mst),0,1.34,0);const h=heart(gc,.16);h.position.set(0,.16,.06);g.add(h);add(g,sph(.05,mg,0),0,-.17,0)}
  else if(suit==='D'){add(g,cyl(.035,.035,1.15,6,mg),0,.45,0);const hd=octa(.3,mg);hd.scale.set(1,.85,.7);add(g,hd,0,1.08,0);add(g,octa(.12,gc),0,1.08,.14);add(g,octa(.12,gc),0,1.08,-.14);add(g,tor(.08,.03,mg),0,.62,0)}
  else if(suit==='C'){add(g,cyl(.035,.035,1.15,6,wood),0,.45,0);[-1,1].forEach(d=>{const b=cyl(.3,.3,.05,3,mst);b.rotation.set(Math.PI/2,0,d>0?-Math.PI/2:Math.PI/2);add(g,b,d*.2,.98,0)});add(g,cone(.05,.2,4,mst),0,1.12,0);add(g,sph(.06,mg,0),0,-.05,0)}
  else{add(g,cyl(.03,.03,1.5,6,dk),0,.6,0);add(g,cone(.09,.4,4,gc),0,1.55,0);[-1,1].forEach(d=>{const b=cone(.1,.3,4,dk);b.rotation.z=d*Math.PI/2;add(g,b,d*.12,1.28,0)});add(g,sph(.07,gc,1),0,1.15,0)}}
 else if(rank==='Q'){
  if(suit==='H'){add(g,cyl(.025,.025,.95,6,mg),0,.38,0);const h=heart(gc,.2);h.position.y=.98;g.add(h);add(g,tor(.12,.015,mg),0,.98,0)}
  else if(suit==='D'){add(g,cyl(.025,.025,.95,6,mg),0,.38,0);add(g,octa(.14,gc),0,.98,0);[0,1.6].forEach(a=>{const r=tor(.2,.012,mg);r.rotation.set(a,0,.5);add(g,r,0,.98,0)})}
  else if(suit==='C'){const b=tor(.5,.03,wood,Math.PI*1.1,12);b.rotation.z=Math.PI/2-.55;add(g,b,0,.1,0);add(g,box(.012,.9,.012,mw),.0,.12,-.0);add(g,cyl(.012,.012,.7,4,mk),.05,.12,.25).rotation.x=Math.PI/2;add(g,cone(.03,.1,4,mst),.05,.12,.62).rotation.x=Math.PI/2}
  else{add(g,cyl(.025,.025,1.2,6,dk),0,.5,0);const b=tor(.34,.045,mst,Math.PI*.85,12);b.rotation.z=Math.PI/2;add(g,b,.1,1.1,0);add(g,sph(.05,gc,1),0,1.15,0)}}
 else{
  if(suit==='H'){hilt(.2);add(g,box(.26,.05,.05,mg),0,.1,0);add(g,box(.07,.66,.02,mst),0,.46,0);add(g,cone(.035,.12,4,mst),0,.85,0)}
  else if(suit==='D'){hilt(.2);add(g,sph(.1,mg,1),0,.1,0);add(g,box(.035,.85,.015,mst),0,.55,0)}
  else if(suit==='C'){hilt(.5);add(g,sph(.15,mst,1),0,.35,0);for(let i=0;i<6;i++){const a=i/6*6.283,s=cone(.04,.12,4,mst);s.position.set(Math.cos(a)*.15,.35,Math.sin(a)*.15);s.rotation.set(Math.sin(a)*1.5,0,-Math.cos(a)*1.5);g.add(s)}}
  else{add(g,cyl(.025,.025,.95,6,wood),0,.3,0);add(g,cone(.06,.28,4,mst),0,.9,0);add(g,box(.14,.1,.03,mst),0,.72,0)}}
 g.traverse(o=>{o.castShadow=true});return g}
/* ---------- copricapi e volti ---------- */
function headgear(rank,suit,hd,P){const {mg,mst,mk,mw,mm,md}=P,gc=suit==='H'?GLOW('#ff5a6a',.8):suit==='D'?GLOW('#ffb040',.9):suit==='C'?GLOW('#6fe08a',.7):GLOW('#b07aff',1.1);
 if(rank==='K'){
  if(suit==='H'){add(hd,cyl(.21,.23,.12,8,mg),0,.22,0);for(let i=0;i<5;i++){const a=i/5*6.283,s=cone(.05,.2,4,mg);add(hd,s,Math.cos(a)*.2,.38,Math.sin(a)*.2);add(hd,sph(.03,M('#d9304a'),0),Math.cos(a)*.2,.5,Math.sin(a)*.2)}const h=heart(gc,.12);h.position.set(0,.24,.22);hd.add(h)}
  else if(suit==='D'){add(hd,cyl(.24,.24,.1,8,mg),0,.2,0);for(let i=0;i<4;i++){const a=i/4*6.283+.78,o=octa(.07,gc);add(hd,o,Math.cos(a)*.24,.3,Math.sin(a)*.24)}[0,1.57].forEach(r=>{const ar=tor(.2,.025,mg,Math.PI,10);ar.rotation.set(0,r,0);add(hd,ar,0,.26,0)});add(hd,octa(.07,gc),0,.47,0)}
  else if(suit==='C'){add(hd,cyl(.22,.25,.16,8,mst),0,.2,0);[-1,1].forEach(d=>{const hn=cone(.07,.36,5,mw);hn.rotation.z=-d*.7;add(hd,hn,d*.27,.38,0);add(hd,sph(.035,mg,0),d*.4,.55,0)});add(hd,box(.04,.18,.2,mg),0,.36,0);add(hd,box(.03,.18,.03,M('#c0392b')),.08,.04,.2)}
  else{add(hd,cyl(.21,.23,.1,8,M('#2c2a3a')),0,.21,0);for(let i=0;i<8;i++){const a=i/8*6.283,s=cone(.035,.3+(i%2)*.14,4,M('#2c2a3a'));add(hd,s,Math.cos(a)*.2,.4,Math.sin(a)*.2);add(hd,sph(.025,gc,0),Math.cos(a)*.2,.56+(i%2)*.14,Math.sin(a)*.2)}}}
 else if(rank==='Q'){
  const hair=M(({H:'#8a3a2a',D:'#e8c46a',C:'#7a4a2a',S:'#2a2230'})[suit]);add(hd,sph(.25,hair,1),0,.03,-.07);add(hd,box(.1,.38,.1,hair),-.22,-.2,0);add(hd,box(.1,.38,.1,hair),.22,-.2,0);
  if(suit==='H'){add(hd,cyl(.17,.2,.08,8,mg),0,.22,0);for(let i=0;i<6;i++){const a=i/6*6.283,p=cone(.05,.16,4,mm);p.position.set(Math.cos(a)*.17,.34,Math.sin(a)*.17);p.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);hd.add(p);add(hd,sph(.03,mw,0),Math.cos(a)*.19,.4,Math.sin(a)*.19)}add(hd,heart(gc,.09),0,.28,.2)}
  else if(suit==='D'){add(hd,cyl(.15,.18,.08,8,mg),0,.22,0);for(let i=-3;i<=3;i++){const s=box(.04,.2+(3-Math.abs(i))*.05,.02,mg);s.position.set(i*.065,.36+(3-Math.abs(i))*.025,.0);s.rotation.z=-i*.14;hd.add(s);add(hd,sph(.025,gc,0),i*.07,.5+(3-Math.abs(i))*.02,.0)}}
  else if(suit==='C'){const w=tor(.2,.035,M('#4f9a3a'),5.2,10);w.rotation.x=Math.PI/2;add(hd,w,0,.2,0);for(let i=0;i<7;i++){const a=i/7*5-1.6,l=cone(.035,.12,4,M('#6fbf4a'));l.position.set(Math.sin(a)*.2,.22,Math.cos(a)*.2);l.rotation.set(0,a,-1.2);hd.add(l)}add(hd,sph(.04,gc,0),0,.24,.2)}
  else{const vl=box(.46,.5,.02,M('#3a3c6a',{transparent:true,opacity:.8}));add(hd,vl,0,-.05,-.22);add(hd,cyl(.19,.2,.04,10,M('#2c2a3a')),0,.22,0);const mo=tor(.1,.02,mst,Math.PI*1.2,8);mo.rotation.z=Math.PI*.4;add(hd,mo,0,.32,.14);add(hd,sph(.025,gc,0),0,.34,.15)}}
 else{
  if(suit==='H'){add(hd,new T.Mesh(new T.SphereGeometry(.235,9,6,0,6.283,0,1.55),mm),0,.03,0);add(hd,box(.36,.03,.14,md),0,.06,.2);const f=cone(.045,.42,5,mw);f.rotation.z=-1.15;add(hd,f,-.22,.22,-.05)}
  else if(suit==='D'){const hat=cone(.36,.16,10,M('#e08a3c'));hat.position.set(0,.14,0);hat.scale.y=.6;hd.add(hat);add(hd,cyl(.25,.25,.05,10,M('#b8661e')),0,.1,0);const f=cone(.04,.5,5,mw);f.rotation.z=-1.0;add(hd,f,-.28,.3,-.03);add(hd,sph(.04,mg,0),.18,.14,.2)}
  else if(suit==='C'){add(hd,new T.Mesh(new T.SphereGeometry(.235,9,6,0,6.283,0,1.45),mst),0,.03,0);add(hd,box(.04,.12,.32,M('#4f9a3a')),0,.28,0);add(hd,box(.34,.03,.04,mk),0,.0,.22)}
  else{const hl=cone(.24,.46,8,M('#3a3c6a'));add(hd,hl,0,.28,0);add(hd,cone(.04,.2,4,mst),0,.58,0);add(hd,sph(.05,M('#1a1a22'),0),.09,.04,.205).scale.set(1.4,1.4,.4)}}}
/* ---------- il nemico ---------- */
function hero(rank,suit){MS=[];const g=new T.Group(),u={amb:[],mats:MS},main=SUC[suit],dark=K.shade(main,-.32),light=K.shade(main,.3);
 const P={mm:M(main),md:M(dark),ml:M(light),ms:M('#f1cfa6'),mg:M('#f0c166',{roughness:.4}),mst:M('#cfd6de',{roughness:.4}),mk:M('#2a1d10'),mw:M('#f4efe4')},{mm,md,ml,ms,mg,mst,mk,mw}=P;
 const Kg=rank==='K',Q=rank==='Q',J=rank==='J',e2=suit==='S'||suit==='C';
 const leg=x=>{const p=new T.Group();p.position.set(x,.36,0);add(p,box(.13,.34,.15,md),0,-.17,0);add(p,box(.17,.08,.24,mk),0,-.36,.04);return p};
 if(!Q){u.legL=leg(-.1);u.legR=leg(.1);g.add(u.legL,u.legR)}else{add(g,cone(.38,.66,9,mm),0,.33,0);const tr=tor(.36,.035,mg,6.283,12);tr.rotation.x=Math.PI/2;add(g,tr,0,.04,0);add(g,box(.18,.07,.2,mk),-.1,.03,.28);add(g,box(.18,.07,.2,mk),.1,.03,.28)}
 u.body=add(g,cyl(.19,Kg?.3:.26,.44,7,mm),0,.6,0);add(g,cyl(.2,.2,.05,7,mg),0,.4,0);
 const em=new T.Mesh(new T.CircleGeometry(.11,16),new T.MeshStandardMaterial({map:emblem(suit),roughness:.6}));em.position.set(0,.62,.27);g.add(em);
 const arm=x=>{const p=new T.Group();p.position.set(x,.76,0);add(p,box(.1,.3,.1,ml),0,-.15,0);add(p,sph(.075,ms,0),0,-.33,0);add(p,sph(.1,md,0),0,.0,0);return p};
 u.armL=arm(-.28);u.armR=arm(.28);g.add(u.armL,u.armR);
 if(Kg){[-1,1].forEach(d=>{const s=sph(.13,e2?mst:mg,1);add(u.body,s,d*.3,.2,0);if(e2)[0,1,2].forEach(i=>{const sp=cone(.04,.14,4,mst);sp.position.set(d*(.3+i*.03),.32+i*.0,0);sp.rotation.z=-d*(.4+i*.4);u.body.add(sp)})})}
 const hd=new T.Group();hd.position.y=1.0;
 add(hd,sph(.22,ms,1),0,0,0);
 const eye=x=>{const e=new T.Group();e.position.set(x,.03,.19);add(e,sph(.055,mw,0),0,0,0);add(e,sph(.03,suit==='S'&&Kg?GLOW('#c08aff',1.4):mk,0),0,0,.04);hd.add(e);return e};
 u.eyeL=eye(-.085);u.eyeR=eye(.085);add(hd,sph(.045,ms,0),0,-.03,.22);add(hd,sph(.04,M('#f2a9a0'),0),-.14,-.05,.15);add(hd,sph(.04,M('#f2a9a0'),0),.14,-.05,.15);
 const brow=(x,r)=>{const b=box(.1,.022,.02,mk);b.position.set(x,.1,.2);b.rotation.z=r;hd.add(b)};brow(-.085,Kg||e2?-.4:.15);brow(.085,Kg||e2?.4:-.15);
 if(!Kg){const sm=tor(.05,.012,M('#8a4a3a'),Math.PI,8);sm.rotation.z=Math.PI;add(hd,sm,0,-.08,.21)}
 if(Kg){const bc={H:'#f4efe4',D:'#e0883a',C:'#b4432a',S:'#6a6a78'}[suit],mb=M(bc),bd=cone(.17,.34,6,mb);bd.rotation.x=Math.PI;add(hd,bd,0,-.2,.1);add(hd,box(.22,.045,.05,mb),0,-.08,.21);
  if(suit==='C'){add(hd,box(.015,.16,.015,M('#c0392b')),.1,.03,.215).rotation.z=.4}if(suit==='D'){add(hd,sph(.035,mg,0),-.17,-.02,.12)}}
 if(J&&suit==='S'){add(hd,sph(.05,M('#1a1a22'),0),-.085,.03,.215).scale.set(1.3,1.3,.4)}
 g.add(hd);u.head=hd;headgear(rank,suit,hd,P);
 if(Kg){const cb={H:'#a3303a',D:'#b8661e',C:'#2f6a3a',S:'#3a2a6a'}[suit],cape=box(.64,.84,.05,M(cb));cape.position.set(0,.55,-.22);cape.castShadow=true;g.add(cape);u.cape=cape;
  const fur=tor(.26,.075,mw,6.283,10);fur.rotation.x=Math.PI/2;add(g,fur,0,.82,0)}
 if(Q&&suit!=='C'){const ca=box(.5,.62,.03,M(K.shade(main,-.45)));ca.position.set(0,.5,-.2);ca.castShadow=true;g.add(ca);u.cape=ca}
 if(J){const sh=new T.Mesh(new T.CylinderGeometry(.24,.24,.05,12),[M(dark),new T.MeshStandardMaterial({map:emblem(suit),flatShading:true,roughness:.6}),M(dark)]);sh.rotation.x=Math.PI/2;sh.position.set(-.09,-.2,.12);sh.castShadow=true;u.armL.add(sh)}
 const wp=weapon(rank,suit,P);wp.position.set(0,-.33,.06);const wr=J?-1.25:Q?-.5:-1.0;wp.rotation.x=wr;u.armR.add(wp);u.weapon=wp;u.wr=wr;
 /* particelle d'ambiente del seme */
 const nAmb=Kg?4:Q?3:0;for(let i=0;i<nAmb;i++){let m;if(suit==='H'){m=heart(GLOW('#ff6a7a',.9),.07)}else if(suit==='D'){m=cyl(.06,.06,.015,10,GLOW('#ffcf4a',.7));m.rotation.x=1.2}else if(suit==='C'){m=cone(.04,.12,4,GLOW('#7ae08a',.6))}else{m=octa(.05,GLOW('#b07aff',1.2))}
  m.userData={r:.45+(i%2)*.15,sp:.7+i*.13,h0:.35+i*.22,ph:i*1.7};g.add(m);u.amb.push(m)}
 u.s0=Kg?3.0:Q?2.65:2.4;g.scale.setScalar(u.s0);u.rank=rank;u.suit=suit;g.userData=u;return g}
function reset(h){const u=h.userData;['legL','legR','armL','armR'].forEach(k=>{if(u[k])u[k].rotation.set(0,0,0)});u.head.rotation.set(0,0,0);u.body.rotation.set(0,0,0);u.weapon.rotation.set(u.wr,0,0);h.scale.setScalar(u.s0);h.rotation.set(0,0,0);u.eyeL.scale.y=u.eyeR.scale.y=1}
function idlePose(h,s){const u=h.userData,b=Math.sin(s*2);reset(h);u.armR.rotation.x=-.3+b*.03;u.armL.rotation.x=.05;h.scale.y=u.s0*(1+b*.012);
 const bl=(s%3.4)>3.28;u.eyeL.scale.y=u.eyeR.scale.y=bl?.12:1;if(u.cape)u.cape.rotation.x=.05+Math.sin(s*1.6)*.06;
 u.amb.forEach(m=>{const d=m.userData,a=s*d.sp+d.ph;m.position.set(Math.cos(a)*d.r,d.h0+Math.sin(s*1.3+d.ph)*.09,Math.sin(a)*d.r);m.rotation.y=a*2})}
function walkPose(h,ph){const u=h.userData,s=Math.sin(ph);reset(h);if(u.legL){u.legL.rotation.x=s*.7;u.legR.rotation.x=-s*.7}u.armL.rotation.x=-s*.5;u.armR.rotation.x=s*.4-.3;u.body.rotation.z=s*.05;u.head.rotation.z=-s*.04;return Math.abs(s)*.06*u.s0/2}
function flash(h,r,g,b,i){h.userData.mats.forEach(m=>{if(!m.emissive)return;if(m.userData.e0===undefined){m.userData.e0=m.emissiveIntensity;m.userData.c0=m.emissive.clone()}
 if(i>0){m.emissive.setRGB(r,g,b);m.emissiveIntensity=i}else if(m.userData.c0){m.emissive.copy(m.userData.c0);m.emissiveIntensity=m.userData.e0}})}
/* ---------- effetti (si ricostruiscono a ogni fotogramma con forme condivise) ---------- */
const GE={};const ge=(k,f)=>GE[k]||(GE[k]=f());const BM={};
const bm=(c,o,side)=>{const k=c+Math.round(o*20)+(side||'');return BM[k]||(BM[k]=new T.MeshBasicMaterial({color:lin(c),transparent:true,opacity:o,depthWrite:false,side:side?T.DoubleSide:T.FrontSide}))};
const fxAdd=m=>{fxg.add(m);return m};
const puff=(x,y,z,r,o,c)=>{const m=new T.Mesh(ge('ico',()=>new T.IcosahedronGeometry(1,1)),bm(c||'#f4ecd8',o==null?.55:o));m.position.set(x,y,z);m.scale.setScalar(r);return fxAdd(m)};
const ringFx=(x,z,r,c,o,y)=>{const m=new T.Mesh(ge('tor',()=>new T.TorusGeometry(1,.045,6,40)),bm(c,o));m.rotation.x=Math.PI/2;m.position.set(x,y==null?Y+.04:y,z);m.scale.set(r,r,1+r*.5);return fxAdd(m)};
const spark=(x,y,z,c,s)=>{const m=new T.Mesh(ge('oct',()=>new T.OctahedronGeometry(1,0)),bm(c||'#ffe27a',.95));m.position.set(x,y,z);m.scale.setScalar(s||.07);m.rotation.set(x*7,y*5,z*3);return fxAdd(m)};
const beamFx=(x,y,z,r,hgt,c,o)=>{const m=new T.Mesh(ge('cyl',()=>new T.CylinderGeometry(.6,1,1,24,1,true)),bm(c,o,1));m.position.set(x,y+hgt/2,z);m.scale.set(r,hgt,r);return fxAdd(m)};
const confetti=(x,y,z,c,s)=>{const m=new T.Mesh(ge('box',()=>new T.BoxGeometry(1,.4,.6)),bm(c,.95));m.position.set(x,y,z);m.scale.setScalar(s||.09);m.rotation.set(x*9+y*4,y*6,z*5);return fxAdd(m)};
const PT={};
function plateFx(txt,x,y,z,col,w){const k=txt+col;let t=PT[k];if(!t){const c=document.createElement('canvas');c.width=320;c.height=128;const g=c.getContext('2d');g.fillStyle='#2a1b0f';g.beginPath();g.moveTo(34,4);g.lineTo(286,4);g.quadraticCurveTo(316,4,316,34);g.lineTo(316,94);g.quadraticCurveTo(316,124,286,124);g.lineTo(34,124);g.quadraticCurveTo(4,124,4,94);g.lineTo(4,34);g.quadraticCurveTo(4,4,34,4);g.fill();g.strokeStyle=col;g.lineWidth=8;g.stroke();
  g.fillStyle=col;let fs=70;g.font='bold '+fs+'px Georgia,serif';while(g.measureText(txt).width>280&&fs>20){fs-=4;g.font='bold '+fs+'px Georgia,serif'}g.textAlign='center';g.textBaseline='middle';g.fillText(txt,160,68);t=PT[k]=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding}
 const m=new T.Mesh(ge('pl',()=>new T.PlaneGeometry(1,.4)),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));m.scale.set(w||2,w||2,1);m.position.set(x,y,z);m.rotation.x=-.98;return fxAdd(m)}
/* ---------- animazioni ---------- */
const ENT={
 marcia(h,t,c){const a=c.tower,sp=c.sp,e=EZ(sat(t/.88)),far=a.x>sp.x-.6,x=cl(a.x,sp.x,e),z=cl(a.z,sp.z,e),head=Math.atan2(sp.x-a.x,sp.z-a.z),face=sat((t-.8)/.2),moving=t<.88,u=h.userData;
  const bob=moving?walkPose(h,t*42):(idlePose(h,sec),0),hop=far&&moving?Math.sin(e*Math.PI)*1.9:0;if(far&&moving){reset(h);u.armL.rotation.z=-.9;u.armR.rotation.z=.9;if(u.legL){u.legL.rotation.x=-.5;u.legR.rotation.x=.3}}
  h.position.set(x,Y+(far?hop:bob),z);h.rotation.y=cl(head,0,EZ(face));
  if(!far)for(let i=1;i<=6;i++){const tt=t-i*.04;if(tt<0||tt>.88)continue;const ee=EZ(tt/.88);puff(cl(a.x,sp.x,ee),Y+.1,cl(a.z,sp.z,ee),.12*(1-i*.09),.5-i*.07)}
  else if(t>.84){const w=sat((t-.84)/.16);ringFx(sp.x,sp.z,.4+w*1.8,'#ffffff',.7*(1-w));for(let i=0;i<8;i++){const aa=i/8*6.283;puff(sp.x+Math.cos(aa)*(.3+w*1.4),Y+.12+w*.3,sp.z+Math.sin(aa)*(.3+w*1.4),.14*(1-w*.5),.5*(1-w))}c.shake=.5*(1-w)}
  if(t>.84)ringFx(sp.x,sp.z,1.0,SUC[c.suit],.35)},
 cielo(h,t,c){const sp=c.sp,fall=sat(t/.55),y=cl(6.5,0,fall*fall),u=h.userData;h.position.set(sp.x,Y+y,sp.z);
  if(t<.55){reset(h);u.armL.rotation.z=-1.2;u.armR.rotation.z=1.2;h.rotation.y=fall*3}else{idlePose(h,sec)}
  const sq=t>.55&&t<.72?1-Math.sin((t-.55)/.17*Math.PI)*.22:1;if(t>.55&&t<.9){h.scale.set(u.s0*(2-sq),u.s0*sq,u.s0*(2-sq))}
  const sd=new T.Mesh(ge('cir',()=>new T.CircleGeometry(1,28)),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.1+.3*fall,depthWrite:false}));sd.rotation.x=-Math.PI/2;sd.position.set(sp.x,Y+.012,sp.z);sd.scale.setScalar(.25+.9*fall);fxAdd(sd);
  if(t<.6)beamFx(sp.x,Y,sp.z,.9,9,SUC[c.suit],.16);
  if(t>=.55){const w=sat((t-.55)/.45);ringFx(sp.x,sp.z,.4+w*2.6,'#ffffff',.7*(1-w));ringFx(sp.x,sp.z,.3+w*1.8,SUC[c.suit],.6*(1-w));for(let i=0;i<10;i++){const a=i/10*6.283+.3,r=.3+w*1.9;puff(sp.x+Math.cos(a)*r,Y+.15+w*.5,sp.z+Math.sin(a)*r,.16*(1-w*.5),.55*(1-w))}c.shake=(h.userData.rank==='K'?1:.5)*(1-w)}},
 botola(h,t,c){const sp=c.sp,rise=EZ(sat(t/.7)),w=sat(t/.25);h.position.set(sp.x,Y-2.6*(1-rise),sp.z);idlePose(h,sec);
  const hole=new T.Mesh(ge('cir',()=>new T.CircleGeometry(1,28)),new T.MeshBasicMaterial({color:0x050302}));hole.rotation.x=-Math.PI/2;hole.position.set(sp.x,Y+.012,sp.z);hole.scale.setScalar(.85*sat(t/.12)*(1-sat((t-.88)/.12)));fxAdd(hole);
  const glow=new T.Mesh(ge('cir',()=>new T.CircleGeometry(1,28)),bm('#ff8a3c',.55*(1-sat((t-.8)/.2))));glow.rotation.x=-Math.PI/2;glow.position.set(sp.x,Y+.02,sp.z);glow.scale.setScalar(.8);fxAdd(glow);
  if(t<.9)beamFx(sp.x,Y,sp.z,.8,3.2,'#ffb865',.2*(1-sat((t-.6)/.3)));
  for(let i=0;i<8;i++){const a=i*2.4+t*3,r=.2+(i%3)*.22,hh=((t*1.4+i*.13)%1)*2.4;puff(sp.x+Math.cos(a)*r,Y+hh,sp.z+Math.sin(a)*r,.12+.1*((i%3)/2),.45*(1-hh/2.4)*w);spark(sp.x+Math.cos(a+1)*r*1.3,Y+hh*1.3,sp.z+Math.sin(a+1)*r*1.3,'#ffcc66',.06)}},
 carta(h,t,c){const sp=c.sp,cd=c.card,e=EZ(sat(t/.8)),arc=Math.sin(e*Math.PI)*1.3;h.position.set(cl(cd.x,sp.x,e),cl(cd.y,Y,e)+arc,cl(cd.z+.3,sp.z,e));
  idlePose(h,sec);h.scale.setScalar(h.userData.s0*cl(.12,1,e));h.rotation.y=cl(6.283*1.5,0,e);
  const b=beamFx(cd.x,cd.y-.4,cd.z+.5,1.1,2.6,c.suit==='H'||c.suit==='D'?'#ffd7c8':'#d8e2ff',.26*(1-sat((t-.7)/.3)));b.rotation.x=.6;
  for(let i=0;i<14;i++){const a=i*.9+t*6,r=.3+i*.07,p=sat(t*1.3-i*.03);spark(cl(cd.x,sp.x,e)+Math.cos(a)*r*(1-p*.3),cl(cd.y,Y+.8,e)+Math.sin(a*1.3)*r*.8,cl(cd.z+.3,sp.z,e)+Math.sin(a)*r*.6,i%2?'#ffe27a':SUC[c.suit],.06+.04*(i%3))}
  if(t>.78){const w=sat((t-.78)/.22);ringFx(sp.x,sp.z,.5+w*1.6,SUC[c.suit],.7*(1-w))}},
 vortice(h,t,c){const sp=c.sp,e=OUT(sat(t/.75)),u=h.userData;h.position.set(sp.x,Y,sp.z);idlePose(h,sec);h.scale.setScalar(u.s0*Math.max(.001,e));h.rotation.y=(1-e)*6.283*3;
  for(let i=0;i<16;i++){const a=i/16*6.283+t*9,r=(1-e)*2.2+.35,hh=.3+((i*.37+t*1.6)%1)*2.2;spark(sp.x+Math.cos(a)*r,Y+hh*(1-e*.4),sp.z+Math.sin(a)*r,i%2?SUC[c.suit]:'#ffe27a',.07+.04*(i%3))}
  ringFx(sp.x,sp.z,.5+(1-e)*1.6,SUC[c.suit],.8*(1-sat((t-.7)/.3)));ringFx(sp.x,sp.z,.25+(1-e)*1.1,'#ffffff',.6*(1-sat((t-.7)/.3)),Y+.08);if(t<.8)beamFx(sp.x,Y,sp.z,.6,4,SUC[c.suit],.2*(1-t))}};
const ENTD={marcia:2.5,cielo:1.7,botola:2.2,carta:2.1,vortice:1.9};
const HIT={
 sussulto(h,t,c){const s=Math.sin(sat(t)*Math.PI),u=h.userData;reset(h);h.position.set(c.sp.x+Math.sin(t*70)*.06*(1-t),Y,c.sp.z);h.scale.set(u.s0*(1+.12*s),u.s0*(1-.18*s),u.s0*(1+.12*s));u.armL.rotation.z=-.7*s;u.armR.rotation.z=.7*s;flash(h,1,.25,.15,.6*(1-sat(t*1.6)))},
 rinculo(h,t,c){const s=Math.sin(sat(t)*Math.PI),u=h.userData;reset(h);h.position.set(c.sp.x+.9*s,Y,c.sp.z-.25*s);h.rotation.set(-.3*s,0,.12*s);u.armL.rotation.x=-1.6*s;u.armR.rotation.x=-1.6*s;u.head.rotation.x=-.3*s;flash(h,1,.25,.15,.5*(1-sat(t*1.5)));if(t<.25)ringFx(c.sp.x,c.sp.z,.4+t*4,'#ffffff',.6)},
 giravolta(h,t,c){const e=EZ(sat(t)),u=h.userData;reset(h);h.position.set(c.sp.x,Y+Math.sin(sat(t)*Math.PI)*.5,c.sp.z);h.rotation.y=e*6.283*2;u.armL.rotation.z=-1.2;u.armR.rotation.z=1.2;flash(h,1,.35,.15,.5*(1-sat(t*1.8)));
  for(let i=0;i<4;i++){const a=i*1.57+t*10;spark(c.sp.x+Math.cos(a)*.7,Y+h.userData.s0*1.45,c.sp.z+Math.sin(a)*.7,'#ffe27a',.1)}},
 stordito(h,t,c){const k=1-sat(t),u=h.userData;reset(h);h.position.set(c.sp.x+Math.sin(t*14)*.18*k,Y,c.sp.z);u.head.rotation.z=Math.sin(t*22)*.35*k;u.body.rotation.z=Math.sin(t*14)*.15*k;u.eyeL.scale.y=u.eyeR.scale.y=.4;flash(h,1,.25,.15,.5*(1-sat(t*2)));
  for(let i=0;i<3;i++){const a=i*2.1+t*9;spark(c.sp.x+Math.cos(a)*.55,Y+u.s0*1.42,c.sp.z+Math.sin(a)*.55,'#ffe27a',.09)}}};
const HITD={sussulto:.7,rinculo:.9,giravolta:1.1,stordito:1.0};
const CNT={
 affondo(h,t,c){const l=EZ(sat(t/.45)),back=EZ(sat((t-.75)/.25)),lg=l*(1-back),u=h.userData;reset(h);const tx=c.seat.x*.6+c.sp.x*.4,tz=2.3;h.position.set(cl(c.sp.x,tx,lg),Y,cl(c.sp.z,tz,lg));h.rotation.y=cl(0,Math.atan2(c.seat.x-c.sp.x,4.2-c.sp.z)*.7,lg);
  const sw=EZ(sat((t-.4)/.2));u.armR.rotation.x=cl(-2.5,-.3,sw);if(t>.55&&t<.9)impact(c,sat((t-.55)/.35))},
 schianto(h,t,c){const u=h.userData;reset(h);const cr=sat(t/.22),lp=sat((t-.22)/.38),bk=EZ(sat((t-.72)/.28)),tx=c.seat.x*.5+c.sp.x*.5,tz=2.4;
  let x=cl(c.sp.x,tx,EZ(lp)),z=cl(c.sp.z,tz,EZ(lp)),y=Math.sin(lp*Math.PI)*2.2;x=cl(x,c.sp.x,bk);z=cl(z,c.sp.z,bk);h.position.set(x,Y+y,z);
  h.scale.set(u.s0*(1+.1*Math.sin(cr*Math.PI)),u.s0*(1-.2*Math.sin(cr*Math.PI)),u.s0*(1+.1*Math.sin(cr*Math.PI)));u.armL.rotation.x=u.armR.rotation.x=lp>0&&lp<1?-2.6:-.3+cr*-.4;
  if(t>.6&&t<.9){const w=sat((t-.6)/.3);ringFx(tx,tz,.4+w*2,'#ffffff',.7*(1-w));ringFx(tx,tz,.3+w*1.4,'#ff6a4a',.6*(1-w));c.shake=.7*(1-w);impact(c,w)}},
 dardo(h,t,c){const u=h.userData;reset(h);h.position.set(c.sp.x,Y,c.sp.z);h.rotation.y=Math.atan2(c.seat.x-c.sp.x,4.2-c.sp.z)*.5;const ch=EZ(sat(t/.35)),sh=sat((t-.35)/.3);u.armR.rotation.x=cl(-.3,-2.4,ch);u.armL.rotation.x=cl(0,-1.0,ch);
  const hx=c.sp.x+Math.sin(h.rotation.y)*.4,hy=Y+u.s0*1.0,hz=c.sp.z+.35;
  if(t<.35){puff(hx,hy+.5,hz,.12+ch*.25,.8,SUC[c.suit]);for(let i=0;i<6;i++){const a=i*1.05+t*14;spark(hx+Math.cos(a)*.35*(1-ch*.4),hy+.5+Math.sin(a)*.3,hz+Math.sin(a*.7)*.2,'#ffe27a',.05)}}
  else if(t<.65){const px=cl(hx,c.seat.x,sh),pz=cl(hz,4.0,sh),py=cl(hy+.5,Y+.5,sh)+Math.sin(sh*Math.PI)*.5;puff(px,py,pz,.4,.9,SUC[c.suit]);puff(px,py,pz,.22,.95,'#ffffff');for(let i=1;i<=5;i++){const s2=sat(sh-i*.06);puff(cl(hx,c.seat.x,s2),cl(hy+.5,Y+.5,s2)+Math.sin(s2*Math.PI)*.5,cl(hz,4.0,s2),.3-i*.04,.5-i*.08,SUC[c.suit])}}
  if(t>.64&&t<.95)impact(c,sat((t-.64)/.31))},
 carica(h,t,c){const u=h.userData;const go=EZ(sat(t/.38)),st=sat((t-.38)/.2),back=EZ(sat((t-.6)/.4)),tx=c.seat.x*.55+c.sp.x*.45,tz=2.3;
  const lg=go*(1-back),x=cl(c.sp.x,tx,lg),z=cl(c.sp.z,tz,lg),dir=back>0&&back<1?Math.atan2(c.sp.x-tx,c.sp.z-tz):Math.atan2(tx-c.sp.x,tz-c.sp.z);
  const moving=(t<.38)||(t>.6&&t<1);const bob=moving?walkPose(h,t*55):(reset(h),0);h.position.set(x,Y+bob,z);h.rotation.y=dir*.9;
  if(t>=.38&&t<.6){u.armR.rotation.x=cl(-2.5,-.4,EZ(st));impact(c,sat((t-.42)/.2))}
  if(moving)for(let i=1;i<=4;i++)puff(x-Math.sin(dir)*i*.25,Y+.1,z-Math.cos(dir)*i*.25,.1,.4-i*.07)}};
const CNTD={affondo:1.5,schianto:1.5,dardo:1.4,carica:1.7};
function impact(c,w){ringFx(c.seat.x,4.25,.3+w*1.4,'#ff5a4a',.8*(1-w),Y+.1);plateFx('scarta '+c.v,c.seat.x,Y+1.5+w*.5,3.5,'#ff8a6b',2.2)}
const DTH={
 crollo(h,t,c){const sp=c.sp,fall=EZ(sat((t-.05)/.35)),diss=sat((t-.55)/.45),u=h.userData;reset(h);h.position.set(sp.x,Y+.3*Math.sin(fall*Math.PI)-fall*.2,sp.z+fall*.6*u.s0*.5);u.armL.rotation.z=-1.5*fall;u.armR.rotation.z=1.5*fall;h.rotation.x=-fall*1.45;h.scale.setScalar(u.s0*Math.max(.001,1-diss));
  if(t<.55)for(let i=0;i<6;i++){const a=i/6*6.283+t*6;spark(sp.x+Math.cos(a)*.55,Y+u.s0*1.2+Math.sin(a*2)*.1,sp.z+Math.sin(a)*.55+fall*.6,'#ffe27a',.09)}
  if(diss>0){for(let i=0;i<20;i++){const a=i*2.2,rr=.3+i*.05;spark(sp.x+Math.cos(a)*rr*(1+diss*2),Y+.4+diss*(1.2+(i%5)*.35),sp.z+Math.sin(a)*rr*(1+diss*2)*.6,i%3?'#ffe27a':SUC[c.suit],.07+.05*(i%2))}ringFx(sp.x,sp.z,.6+diss*2.2,'#ffe27a',.6*(1-diss))}},
 esplosione(h,t,c){const sp=c.sp,u=h.userData,sw=sat(t/.35);reset(h);h.position.set(sp.x+Math.sin(t*80)*.05*(t<.35),Y,sp.z);
  if(t<.35){h.scale.setScalar(u.s0*(1+.35*sw));flash(h,1,.9,.7,.9*sw)}else h.scale.setScalar(.001);
  if(t>=.3){const w=sat((t-.3)/.7);ringFx(sp.x,sp.z,.5+w*3.4,'#ffffff',.8*(1-w));ringFx(sp.x,sp.z,.4+w*2.2,SUC[c.suit],.7*(1-w));const cols=[SUC[c.suit],'#ffe27a','#ffffff','#7ad0ff','#ff8ac0'],rr=mulb(7);
   for(let i=0;i<44;i++){const a=rr()*6.283,sp0=1.2+rr()*3.4,vy=3.2+rr()*3.8,tt=w*1.4;confetti(sp.x+Math.cos(a)*sp0*tt,Y+u.s0*.7+vy*tt-4.9*tt*tt,sp.z+Math.sin(a)*sp0*tt*.7,cols[i%5],.09+.05*rr())}
   if(w<.3)puff(sp.x,Y+u.s0*.7,sp.z,1.4*(1-w*3),.7*(1-w*3),'#ffffff')}},
 cielo(h,t,c){const sp=c.sp,u=h.userData,up=sat((t-.18)/.6),cr=sat(t/.18);reset(h);const y=up*up*11;h.position.set(sp.x,Y+y,sp.z);h.rotation.y=up*6.283*4;h.scale.set(u.s0*(1+.1*Math.sin(cr*Math.PI)),u.s0*(1-.2*Math.sin(cr*Math.PI))*(1-up*.3),u.s0*(1+.1*Math.sin(cr*Math.PI)));
  u.armL.rotation.z=-2.4*up;u.armR.rotation.z=2.4*up;if(t<.2)ringFx(sp.x,sp.z,.5+t*5,'#ffffff',.6);
  for(let i=1;i<=8;i++){const u2=sat(up-i*.04);spark(sp.x+Math.sin(i+t*8)*.25,Y+u2*u2*11+.3,sp.z+Math.cos(i*2)*.25,i%2?'#ffe27a':SUC[c.suit],.1)}
  if(t>.78){const w=sat((t-.78)/.22);h.scale.setScalar(.001);for(let i=0;i<14;i++){const a=i/14*6.283;spark(sp.x+Math.cos(a)*w*2.2,Y+8.5+Math.sin(a)*w*1.2,sp.z+Math.sin(a)*w*1.2,i%2?'#ffe27a':'#ffffff',.12*(1-w))}}},
 carta(h,t,c){const sp=c.sp,cd=c.card,e=EZ(sat((t-.1)/.7)),u=h.userData;reset(h);const x=cl(sp.x,cd.x,e),z=cl(sp.z,cd.z+.3,e),y=cl(Y,cd.y,e)+Math.sin(e*Math.PI)*1.2;h.position.set(x,y,z);h.scale.setScalar(u.s0*Math.max(.001,1-e*.97));h.rotation.y=e*6.283*2;u.armL.rotation.z=-1.4*e;u.armR.rotation.z=1.4*e;
  const b=beamFx(cd.x,cd.y-.4,cd.z+.5,1.1,2.6,'#ffe9a8',.26*Math.sin(sat(t)*Math.PI));b.rotation.x=.6;
  for(let i=0;i<10;i++){const a=i*.9+t*8,r=.9*(1-e)+.2;spark(cl(sp.x,cd.x,e)+Math.cos(a)*r,y+.5+Math.sin(a*1.3)*.5,cl(sp.z,cd.z+.3,e)+Math.sin(a)*r*.6,i%2?'#ffe27a':SUC[c.suit],.07)}
  if(t>.8){const w=sat((t-.8)/.2);ringFx(cd.x,cd.z+.5,.5+w*1.8,'#ffe27a',.8*(1-w),cd.y)}}};
const DTHD={crollo:2.4,esplosione:2.2,cielo:2.2,carta:2.2};
const IMMD=.6;
/* ---------- regia ---------- */
function geoCtx(extra){return Object.assign({sp:geo.spot,card:geo.card,tower:geo.tower,seat:geo.seat(0),suit:'H',v:0,shake:0},extra||{})}
/* RACT.force = {enter,hit,atk,death}: solo per le prove, fissa la variante */
const PICK=(rnd,names,kind)=>RACT.force&&RACT.force[kind]&&names.includes(RACT.force[kind])?RACT.force[kind]:names[Math.floor(rnd()*names.length)];
function spawn(c,idle){if(cur){actor.remove(cur);cur=null}const h=hero(P0(c).r,P0(c).s);cur=h;h.position.set(geo.spot.x,Y,geo.spot.z);actor.add(h);if(idle)idlePose(h,sec)}
const P0=c=>({r:c.slice(0,-1),s:c.slice(-1)});
function enq(it){if(queue.length>6&&it.k==='hit')return;queue.push(it)}
function sync(s,en,evs,first,g){geo=g;if(!T||!actor)return;
 const n=s.n,seed=hsh((s.gid||'')+':'+s.evn),rnd=mulb(seed);
 const seatOf=p=>geo.seat(p);
 if(first){reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);lastEvn=s.evn;if(en){want=en.c;if(s.evn<=1&&!reduce){queue.length=0;cur=null;enq({k:'enter',v:PICK(rnd,Object.keys(ENT),'enter'),c:en.c,d:0,tower:geo.tower(s)})}else spawn(en.c,true)}return}
 if(s.evn!==lastEvn){lastEvn=s.evn;
  (evs||[]).forEach(e=>{
   if(e.t==='hit'){enq({k:'hit',v:PICK(rnd,Object.keys(HIT),'hit'),n:e.v,x2:e.x2})}
   else if(e.t==='imm'){enq({k:'imm',s:e.s})}
   else if(e.t==='atk'){enq({k:'atk',v:PICK(rnd,Object.keys(CNT),'atk'),n:e.v,p:e.p})}
   else if(e.t==='kill'){enq({k:'death',v:PICK(rnd,Object.keys(DTH),'death')});want=e.c}})}
 if(en&&en.c!==want){want=en.c;enq({k:'enter',v:PICK(rnd,Object.keys(ENT),'enter'),c:en.c,tower:geo.tower(s)})}}
function begin(it){const base=geoCtx({suit:it.s||(cur?cur.userData.suit:'H'),rank:cur?cur.userData.rank:'J'});
 const d=reduce?.01:it.k==='enter'?ENTD[it.v]:it.k==='hit'?HITD[it.v]:it.k==='atk'?CNTD[it.v]:it.k==='death'?DTHD[it.v]:IMMD;
 if(it.k==='enter'){spawn(it.c,false);base.suit=cur.userData.suit;base.rank=cur.userData.rank;base.tower=it.tower}
 if(it.k==='atk')base.seat=geo.seat(it.p);base.v=it.n||0;run={it,t:0,d,c:base};if(it.k==='enter'&&reduce){}}
function tick(dt,s){sec=s;if(!actor||!T)return;
 if(fxg){actor.remove(fxg);fxg=null}fxg=new T.Group();actor.add(fxg);
 if(!run&&queue.length)begin(queue.shift());
 if(!run){if(cur)idlePose(cur,sec),cur.position.set(geo.spot.x,Y,geo.spot.z);RACT.shake=0;return}
 const it=run.it,c=run.c;run.t+=dt;const t=sat(run.t/run.d);c.shake=0;
 if(!cur&&it.k!=='enter'){run=null;return}
 if(it.k==='enter')ENT[it.v](cur,t,c);
 else if(it.k==='hit'){HIT[it.v](cur,t,c);const f=it.x2?'#ffd24a':'#ff9a7a';plateFx((it.x2?'×2 ':'')+'−'+it.n,c.sp.x+1.3,Y+cur.userData.s0*1.0+t*.9,c.sp.z,f,1.6)}
 else if(it.k==='imm'){idlePose(cur,sec);cur.position.set(c.sp.x,Y,c.sp.z);ringFx(c.sp.x,c.sp.z,.6+t*1.4,'#b07aff',.8*(1-t),Y+cur.userData.s0*.6);plateFx('Immune '+GL[it.s],c.sp.x+1.3,Y+cur.userData.s0*1.0+t*.5,c.sp.z,'#d6b8ff',1.9)}
 else if(it.k==='atk')CNT[it.v](cur,t,c);
 else if(it.k==='death'){DTH[it.v](cur,t,c)}
 RACT.shake=c.shake||0;
 if(run.t>=run.d){flash(cur,0,0,0,0);if(it.k==='death'){actor.remove(cur);cur=null}else if(cur){idlePose(cur,sec);cur.position.set(geo.spot.x,Y,geo.spot.z);cur.rotation.set(0,0,0)}run=null}}
function init(t3,k,scene){T=t3;K=k;scn=scene;actor=new T.Group();scn.add(actor)}
function clear(){queue.length=0;run=null;if(cur){actor.remove(cur);cur=null}want='';lastEvn=-1}
return{init,sync,tick,clear,shake:0,force:null,hero,debug:()=>({cur,queue,run,want}),ENT,HIT,CNT,DTH}})();
