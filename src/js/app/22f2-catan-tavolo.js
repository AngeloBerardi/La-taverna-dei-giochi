/* ---- Catan sullo schermo comune: la plancia come su un tavolo da gioco (three.js) ----
   Solo grafica: legge lo stato (G) e non scrive nulla. Si carica solo quando serve (VENDOR.load('three')); senza WebGL la TV usa la plancia 2D.
   Mondo: un esagono ha raggio 1 (centro → vertice); x,z = coordinate del motore (x,y); y = altezza.
   Gli esagoni di terra sono tessere sollevate (LAND_Y); il mare sta più in basso (SEA_Y). I pezzi si ricostruiscono a ogni nuovo stato (gid:evn)
   e quelli nuovi «cadono» sul tavolo. Tutta l'arte è procedurale e originale (texture dipinte su canvas + solidi semplici). */
const CTV=(()=>{
const SEA_Y=.1,LAND_Y=.34,TOK_Y=.04;
let T=null,ren=null,scn=null,cam=null,cv=null,loading=null,failed=false,raf=0,board=null,pieces=null,marks=null,geoKey='',stateKey='',fit=null,prevKeys=new Set(),anims=[],pulses=[],hot=null,hotT=0,lastRob=null,lastPir=null,tick0=0;
const TEX={},MAT={},GEOM={};
/* ---------- utilità ---------- */
const mul=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hex2=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const shade=(c,f)=>{const[r,g,b]=hex2(c),m=f<0?0:255,t=Math.abs(f);return'#'+[r,g,b].map(x=>Math.round(x+(m-x)*t).toString(16).padStart(2,'0')).join('')};
const mat=(c,o)=>{const k=c+JSON.stringify(o||{});return MAT[k]||(MAT[k]=new T.MeshStandardMaterial(Object.assign({color:c,roughness:.75,metalness:0,flatShading:true},o||{})))};
const geo=(k,f)=>GEOM[k]||(GEOM[k]=f());
function canv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h||w;return c}
function ctex(c,rep,cap){const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep[0],rep[1])}if(cap){t.center.set(.5,.5);t.rotation=cap>0?-Math.PI/2:Math.PI/2}return t}
/* ---------- texture dei terreni (dipinte, 256 px) ---------- */
const BASE={wood:'#2c6633',brick:'#b3532b',wool:'#86bc52',grain:'#dcb43a',ore:'#868a97',desert:'#d9c288',gold:'#cf9f22',sea:'#2a6a9e',fog:'#c3cbd3'};
function paint(type){const c=canv(256),g=c.getContext('2d'),r=mul(type.length*131+type.charCodeAt(0)),b=BASE[type]||'#888';
 const gr=g.createRadialGradient(128,112,8,128,128,160);gr.addColorStop(0,shade(b,.16));gr.addColorStop(1,shade(b,-.2));g.fillStyle=gr;g.fillRect(0,0,256,256);
 for(let i=0;i<1400;i++){g.fillStyle=r()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.05)';g.fillRect(r()*256,r()*256,1+r()*2,1+r()*2)}
 g.lineCap='round';
 if(type==='sea'){g.strokeStyle='rgba(255,255,255,.2)';g.lineWidth=2;for(let i=0;i<46;i++){const x=r()*256,y=r()*256,w=10+r()*16;g.beginPath();g.arc(x,y,w,Math.PI*1.1,Math.PI*1.9);g.stroke()}}
 else if(type==='grain'){for(let i=-6;i<22;i++){g.strokeStyle=i%2?'rgba(120,80,10,.22)':'rgba(255,240,170,.28)';g.lineWidth=7;g.beginPath();g.moveTo(-20+i*14,0);g.quadraticCurveTo(80+i*14,128,-20+i*14+30,256);g.stroke()}}
 else if(type==='wool'){g.strokeStyle='rgba(30,90,30,.35)';g.lineWidth=2;for(let i=0;i<190;i++){const x=r()*256,y=r()*256;g.beginPath();g.moveTo(x,y);g.lineTo(x-3,y-9);g.moveTo(x,y);g.lineTo(x+3,y-8);g.stroke()}}
 else if(type==='wood'){for(let i=0;i<46;i++){g.fillStyle=r()<.5?'rgba(10,50,20,.4)':'rgba(70,130,60,.28)';const x=r()*256,y=r()*256,s=10+r()*24;g.beginPath();g.arc(x,y,s,0,7);g.fill()}}
 else if(type==='brick'){g.strokeStyle='rgba(60,20,5,.3)';g.lineWidth=3;for(let i=0;i<22;i++){g.beginPath();g.moveTo(0,i*12+r()*4);g.bezierCurveTo(80,i*12-6,170,i*12+10,256,i*12);g.stroke()}}
 else if(type==='ore'){for(let i=0;i<34;i++){g.fillStyle=r()<.5?'rgba(40,40,60,.3)':'rgba(255,255,255,.18)';const x=r()*256,y=r()*256,s=8+r()*20;g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s,y+s*.6);g.lineTo(x-s,y+s*.6);g.fill()}}
 else if(type==='desert'){g.strokeStyle='rgba(140,100,40,.3)';g.lineWidth=3;for(let i=0;i<20;i++){g.beginPath();g.moveTo(0,i*13);for(let x=0;x<=256;x+=16)g.lineTo(x,i*13+Math.sin(x/28+i)*6);g.stroke()}}
 else if(type==='gold'){g.strokeStyle='rgba(255,230,120,.5)';g.lineWidth=2;for(let i=0;i<22;i++){const x=r()*256,y=r()*256,s=5+r()*9;g.beginPath();g.moveTo(x-s,y);g.lineTo(x+s,y);g.moveTo(x,y-s);g.lineTo(x,y+s);g.stroke()}}
 else if(type==='fog'){for(let i=0;i<34;i++){g.fillStyle='rgba(255,255,255,'+(.16+r()*.2)+')';g.beginPath();g.arc(r()*256,r()*256,14+r()*28,0,7);g.fill()}}
 return c}
const terTex=t=>TEX[t]||(TEX[t]=ctex(paint(t)));
function tokenTex(n){const k='t'+n;if(TEX[k])return TEX[k];const c=canv(128),g=c.getContext('2d');
 g.fillStyle='#efe4c0';g.fillRect(0,0,128,128);g.strokeStyle='rgba(90,60,20,.45)';g.lineWidth=5;g.beginPath();g.arc(64,64,58,0,7);g.stroke();
 const red=n===6||n===8;g.fillStyle=red?'#b2201c':'#2a1d10';g.textAlign='center';g.textBaseline='middle';g.font='bold '+(n>9?54:62)+'px Georgia,serif';g.fillText(String(n),64,56);
 const pp=Math.max(1,6-Math.abs(7-n));for(let i=0;i<pp;i++){g.beginPath();g.arc(64+(i-(pp-1)/2)*10,98,3.6,0,7);g.fill()}
 return TEX[k]=ctex(c,null,-1)}
function portTex(k,ratio){const key='p'+k+ratio;if(TEX[key])return TEX[key];const c=canv(128),g=c.getContext('2d');
 g.fillStyle='#e9dcb2';g.beginPath();g.arc(64,64,62,0,7);g.fill();const col={any:'#6b5a3c',wood:'#2c6633',brick:'#b3532b',wool:'#86bc52',grain:'#dcb43a',ore:'#868a97'}[k];
 g.fillStyle=col;g.beginPath();g.arc(64,64,52,0,7);g.fill();g.fillStyle='#fff6dc';g.textAlign='center';g.textBaseline='middle';g.font='bold 44px Georgia,serif';g.fillText(ratio,64,50);
 g.font='bold 22px Georgia,serif';g.fillText(k==='any'?'ogni merce':({wood:'legno',brick:'argilla',wool:'lana',grain:'grano',ore:'roccia'})[k],64,92);return TEX[key]=ctex(c,null,1)}
function woodTex(){if(TEX.table)return TEX.table;const c=canv(512),g=c.getContext('2d'),r=mul(7);
 for(let i=0;i<8;i++){const y=i*64;g.fillStyle=['#5b3a22','#523320','#613f25','#4f311d'][i%4];g.fillRect(0,y,512,64);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y,512,2);
  g.strokeStyle='rgba(20,10,0,.2)';g.lineWidth=1;for(let j=0;j<14;j++){const yy=y+4+r()*56;g.beginPath();g.moveTo(0,yy);g.bezierCurveTo(150,yy+r()*5-2,330,yy+r()*5-2,512,yy);g.stroke()}}
 return TEX.table=ctex(c,[5,5])}
function seaPlateTex(){if(TEX.plate)return TEX.plate;const c=paint('sea');return TEX.plate=ctex(c,[3,3])}
/* ---------- geometria utile ---------- */
function hull(pts){const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[];
 for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}const up=[];
 for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}
 lo.pop();up.pop();return lo.concat(up)}
function offsetPoly(pts,d){const n=pts.length;return pts.map((p,i)=>{const a=pts[(i+n-1)%n],b=pts[(i+1)%n];
 const n1=(()=>{const x=p[0]-a[0],y=p[1]-a[1],l=Math.hypot(x,y)||1;return[y/l,-x/l]})(),n2=(()=>{const x=b[0]-p[0],y=b[1]-p[1],l=Math.hypot(x,y)||1;return[y/l,-x/l]})();
 const k=1+n1[0]*n2[0]+n1[1]*n2[1];return[p[0]+(n1[0]+n2[0])/k*d,p[1]+(n1[1]+n2[1])/k*d]})}
function shapeOf(pts){const s=new T.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],-p[1]):s.moveTo(p[0],-p[1]));s.closePath();return s}
/* ---------- tessere: rilievi ---------- */
function props(type,i,hx,hz,out){const r=mul(i*977+type.length),add=m=>{m.castShadow=true;out.add(m)};const at=(rad)=>{const a=r()*6.283,d=rad;return[hx+Math.cos(a)*d,hz+Math.sin(a)*d]};
 const ring=(n,r0,r1,f)=>{for(let k=0;k<n;k++){const a=(k/n)*6.283+r()*.7,d=r0+r()*(r1-r0);f(hx+Math.cos(a)*d,hz+Math.sin(a)*d,k)}};
 if(type==='wood')ring(6,.5,.78,(x,z)=>{const h=.8+r()*.5,tr=new T.Mesh(geo('trk',()=>new T.CylinderGeometry(.03,.04,.12,6)),mat('#5a3a1e'));tr.position.set(x,LAND_Y+.06,z);add(tr);
  const a=new T.Mesh(geo('fo1',()=>new T.ConeGeometry(.16,.26,7)),mat(r()<.5?'#1d5a2b':'#27693a'));a.scale.setScalar(h);a.position.set(x,LAND_Y+.12+.13*h,z);add(a);
  const b=new T.Mesh(geo('fo2',()=>new T.ConeGeometry(.12,.22,7)),mat('#2c7440'));b.scale.setScalar(h);b.position.set(x,LAND_Y+.12+.3*h,z);add(b)});
 else if(type==='brick')ring(4,.52,.75,(x,z,k)=>{const m=new T.Mesh(geo('mnd',()=>new T.SphereGeometry(.2,9,5,0,6.283,0,1.57)),mat('#9d4520'));m.scale.set(1,.55+r()*.3,1);m.position.set(x,LAND_Y,z);add(m);
  if(k<3){const bk=new T.Mesh(geo('bk',()=>new T.BoxGeometry(.14,.05,.07)),mat('#7a2f14'));bk.position.set(x+.1,LAND_Y+.025,z-.1);bk.rotation.y=r()*3;add(bk)}});
 else if(type==='wool')ring(5,.5,.78,(x,z)=>{const g=new T.Group(),b=new T.Mesh(geo('shb',()=>new T.SphereGeometry(.09,8,6)),mat('#f4f1e6',{roughness:1}));b.scale.set(1.25,.95,.95);b.position.y=.1;g.add(b);
  const h=new T.Mesh(geo('shh',()=>new T.SphereGeometry(.05,7,5)),mat('#3b3a38'));h.position.set(.11,.13,0);g.add(h);
  [[-.05,-.05],[.05,-.05],[-.05,.05],[.05,.05]].forEach(([a,c])=>{const l=new T.Mesh(geo('shl',()=>new T.CylinderGeometry(.012,.012,.07,5)),mat('#3b3a38'));l.position.set(a,.035,c);g.add(l)});
  g.position.set(x,LAND_Y,z);g.rotation.y=r()*6.283;g.traverse(o=>{o.castShadow=true});out.add(g)});
 else if(type==='grain')ring(6,.48,.78,(x,z)=>{const g=new T.Group();for(let k=0;k<9;k++){const s=new T.Mesh(geo('whe',()=>new T.CylinderGeometry(.008,.012,.22,4)),mat(k%2?'#e9c24a':'#d4a935'));
  const a=r()*6.283,d=r()*.07;s.position.set(Math.cos(a)*d,.11,Math.sin(a)*d);s.rotation.set((r()-.5)*.3,0,(r()-.5)*.3);g.add(s);
  const ear=new T.Mesh(geo('ear',()=>new T.SphereGeometry(.02,5,4)),mat('#f1cf62'));ear.scale.y=2.2;ear.position.set(s.position.x,.23,s.position.z);g.add(ear)}g.position.set(x,LAND_Y,z);out.add(g)});
 else if(type==='ore'){[[.55,.3,.22,.5],[.7,-.35,.26,.62],[.4,-.55,.2,.38]].forEach(([d,a,rd,h],k)=>{const x=hx+Math.cos(a+i)*d,z=hz+Math.sin(a+i)*d;const m=new T.Mesh(geo('mt'+k,()=>new T.ConeGeometry(rd,h,6)),mat('#767b89'));m.position.set(x,LAND_Y+h/2,z);m.rotation.y=r()*3;add(m);
  const sn=new T.Mesh(geo('sn'+k,()=>new T.ConeGeometry(rd*.45,h*.3,6)),mat('#f1f4f7'));sn.position.set(x,LAND_Y+h*.86,z);sn.rotation.y=m.rotation.y;add(sn)})}
 else if(type==='desert'){const[x,z]=at(.55),c=new T.Mesh(geo('cac',()=>new T.CylinderGeometry(.045,.05,.24,7)),mat('#4f8b45'));c.position.set(x,LAND_Y+.12,z);add(c);
  [-1,1].forEach(sd=>{const a=new T.Mesh(geo('cac2',()=>new T.CylinderGeometry(.03,.03,.1,6)),mat('#4f8b45'));a.position.set(x+sd*.07,LAND_Y+.14,z);a.rotation.z=sd*.5;add(a)});
  ring(3,.5,.7,(xx,zz)=>{const d=new T.Mesh(geo('dun',()=>new T.SphereGeometry(.16,8,5,0,6.283,0,1.57)),mat('#cdb577'));d.scale.set(1.5,.35,1);d.position.set(xx,LAND_Y,zz);d.rotation.y=r()*3;out.add(d)})}
 else if(type==='gold')ring(6,.45,.75,(x,z)=>{const m=new T.Mesh(geo('nug',()=>new T.IcosahedronGeometry(.07,0)),mat('#f2c230',{metalness:.7,roughness:.3,emissive:'#6b4a00',emissiveIntensity:.35}));m.scale.set(1+r()*.5,.8,1+r()*.4);m.position.set(x,LAND_Y+.05,z);m.rotation.set(r()*3,r()*3,0);add(m)})}
/* ---------- costruzione del tavolo (cambia solo con la plancia) ---------- */
function disposeG(g){if(!g)return;scn.remove(g)}
function buildBoard(s,Gm){disposeG(board);board=new T.Group();const V=Gm.V,E=Gm.E,HX=Gm.HX;
 const all=HX.map(h=>[h.x,h.y]);const verts=V.map(v=>[v.x,v.y]);
 /* tavolo */
 const tb=new T.Mesh(new T.PlaneGeometry(120,120),new T.MeshStandardMaterial({map:woodTex(),roughness:.9}));tb.rotation.x=-Math.PI/2;tb.position.y=-.06;tb.receiveShadow=true;board.add(tb);
 /* cornice e mare: la plancia classica ha il suo mare con i porti; le mappe libere (Marinai) hanno tessere di mare */
 const lay=!!s.lay,hl=hull(verts),inner=offsetPoly(hl,lay?.12:1.55),outer=offsetPoly(hl,lay?.42:1.95);
 const fsh=shapeOf(outer),hole=new T.Path();inner.forEach((p,i)=>i?hole.lineTo(p[0],-p[1]):hole.moveTo(p[0],-p[1]));hole.closePath();fsh.holes.push(hole);
 const fr=new T.Mesh(new T.ExtrudeGeometry(fsh,{depth:.2,bevelEnabled:true,bevelSize:.05,bevelThickness:.04,bevelSegments:2}),mat('#6a4528',{roughness:.6,flatShading:false}));fr.rotation.x=-Math.PI/2;fr.position.y=-.04;fr.castShadow=true;fr.receiveShadow=true;board.add(fr);
 const seaMat=new T.MeshStandardMaterial({map:seaPlateTex(),roughness:.35,metalness:.05});const sp=new T.Mesh(new T.ShapeGeometry(shapeOf(inner)),seaMat);sp.rotation.x=-Math.PI/2;sp.position.y=SEA_Y;sp.receiveShadow=true;
 {const uv=sp.geometry.attributes.uv,pos=sp.geometry.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/6,pos.getY(i)/6)}board.add(sp);
 /* tessere */
 const side=mat('#e6dcc0',{roughness:.9});
 HX.forEach((h,i)=>{const x=s.hexes[i],t=x.t;
  if(t==='sea'&&!x.fog){if(!lay)return;const m=new T.Mesh(geo('hx0',()=>new T.CylinderGeometry(.985,.985,.04,6)),[new T.MeshStandardMaterial({color:'#2a6a9e',roughness:.4}),new T.MeshStandardMaterial({map:ctex(paint('sea')),roughness:.35}),side]);
   m.position.set(h.x,SEA_Y+.02,h.y);m.receiveShadow=true;board.add(m);return}
  const typ=x.fog?'fog':t,mats=[side,new T.MeshStandardMaterial({map:terTex(typ),roughness:.85}),side];
  const hh=LAND_Y-SEA_Y+(x.fog?-.1:0),m=new T.Mesh(geo('hx'+hh,()=>new T.CylinderGeometry(.985,.985,hh,6)),mats);m.position.set(h.x,SEA_Y+hh/2,h.y);m.castShadow=true;m.receiveShadow=true;board.add(m);
  if(x.fog){for(let k=0;k<5;k++){const c=new T.Mesh(geo('cld',()=>new T.SphereGeometry(.22,8,6)),mat('#eef2f6',{roughness:1,transparent:true,opacity:.92}));c.scale.set(1.3,.7,1);const a=k*1.26;c.position.set(h.x+Math.cos(a)*.38,LAND_Y+.12+(k%2)*.05,h.y+Math.sin(a)*.38);board.add(c)}
   const q=new T.Mesh(new T.PlaneGeometry(.5,.5),new T.MeshBasicMaterial({map:qTex(),transparent:true}));q.rotation.x=-Math.PI/2;q.position.set(h.x,LAND_Y+.32,h.y);board.add(q);return}
  props(t,i,h.x,h.y,board);
  if(x.num){const tk=new T.Mesh(geo('tok',()=>new T.CylinderGeometry(.3,.3,.05,28)),[mat('#d8c999'),new T.MeshStandardMaterial({map:tokenTex(x.num),roughness:.7}),mat('#d8c999')]);tk.position.set(h.x,LAND_Y+TOK_Y,h.y);tk.castShadow=true;tk.userData={num:x.num,base:LAND_Y+TOK_Y};board.add(tk)}});
 /* porti: gettone sul mare, con due cime fino ai vertici della costa */
 (s.ports||[]).forEach(pt=>{const e=E[pt.e],a=V[e.a],b=V[e.b],mx=(a.x+b.x)/2,mz=(a.y+b.y)/2;let ox,oz;
  const land=e.h.find(i=>s.hexes[i].t!=='sea'&&!s.hexes[i].fog),sea=e.h.find(i=>i!==land);
  if(sea!=null){ox=HX[sea].x-HX[land].x;oz=HX[sea].y-HX[land].y}else{ox=mx-HX[land].x;oz=mz-HX[land].y}const d=Math.hypot(ox,oz)||1;ox/=d;oz/=d;
  const px=mx+ox*.78,pz=mz+oz*.78,tk=new T.Mesh(geo('port',()=>new T.CylinderGeometry(.34,.34,.08,26)),[mat('#e9dcb2'),new T.MeshStandardMaterial({map:portTex(pt.k,pt.k==='any'?'3:1':'2:1'),roughness:.6}),mat('#e9dcb2')]);
  tk.position.set(px,SEA_Y+.06,pz);tk.rotation.y=Math.atan2(ox,oz);tk.castShadow=true;board.add(tk);
  [a,b].forEach(v=>{const dx=v.x-px,dz=v.y-pz,len=Math.hypot(dx,dz),ln=new T.Mesh(new T.BoxGeometry(len-.3,.025,.045),mat('#6b4a2a'));ln.position.set((v.x+px)/2,SEA_Y+.04,(v.y+pz)/2);ln.rotation.y=-Math.atan2(dz,dx);board.add(ln)})});
 scn.add(board);
 /* inquadratura: contiene tutti i vertici più i porti */
 let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;outer.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1])});
 fit={cx:(x0+x1)/2,cz:(z0+z1)/2,w:x1-x0,d:z1-z0}}
let qT=null;function qTex(){if(qT)return qT;const c=canv(64),g=c.getContext('2d');g.fillStyle='rgba(30,40,50,.75)';g.font='bold 56px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('?',32,34);return qT=ctex(c)}
/* ---------- pezzi (si ricostruiscono a ogni stato) ---------- */
const PC=()=>(typeof CPC!=='undefined'?CPC:['#e8574a','#3a8fe6','#35b866','#f2c230','#b06be0','#e8742c','#2fc5c0','#e86bb0']);
const land=(s,hs)=>hs.some(i=>s.hexes[i].t!=='sea'&&!s.hexes[i].fog);
function roadM(a,b,col,y){const dx=b.x-a.x,dz=b.y-a.y,len=Math.hypot(dx,dz),m=new T.Mesh(new T.BoxGeometry(len*.72,.1,.16),mat(col,{roughness:.55}));m.position.set((a.x+b.x)/2,y+.05,(a.y+b.y)/2);m.rotation.y=-Math.atan2(dz,dx);m.castShadow=true;return m}
function houseM(col,city){const g=new T.Group(),m=mat(col,{roughness:.5}),dk=mat(shade(col,-.3),{roughness:.55});
 if(!city){const b=new T.Mesh(geo('hb',()=>new T.BoxGeometry(.3,.2,.26)),m);b.position.y=.1;const r=new T.Mesh(geo('hr',()=>new T.ConeGeometry(.24,.17,4)),dk);r.position.y=.285;r.rotation.y=Math.PI/4;r.scale.z=.9;g.add(b,r)}
 else{const b=new T.Mesh(geo('cb',()=>new T.BoxGeometry(.5,.22,.3)),m);b.position.y=.11;const t=new T.Mesh(geo('ct',()=>new T.BoxGeometry(.24,.46,.24)),m);t.position.set(-.12,.23,0);
  const r1=new T.Mesh(geo('cr1',()=>new T.ConeGeometry(.2,.16,4)),dk);r1.position.set(-.12,.54,0);r1.rotation.y=Math.PI/4;const r2=new T.Mesh(geo('cr2',()=>new T.ConeGeometry(.22,.14,4)),dk);r2.position.set(.1,.29,0);r2.rotation.y=Math.PI/4;r2.scale.set(.9,1,.7);g.add(b,t,r1,r2)}
 g.traverse(o=>{o.castShadow=true});return g}
function shipM(a,b,col,dark){const g=new T.Group(),dx=b.x-a.x,dz=b.y-a.y;const hull=new T.Mesh(geo('hull',()=>new T.BoxGeometry(.56,.1,.2)),mat(dark?'#222':shade(col,-.15),{roughness:.5}));hull.position.y=.07;
 const bow=new T.Mesh(geo('bow',()=>new T.ConeGeometry(.1,.2,4)),mat(dark?'#222':shade(col,-.15)));bow.rotation.z=-Math.PI/2;bow.rotation.x=Math.PI/4;bow.position.set(.36,.07,0);
 const mast=new T.Mesh(geo('mst',()=>new T.CylinderGeometry(.015,.015,.4,5)),mat('#4a2f18'));mast.position.set(0,.3,0);
 const sh=new T.Shape();sh.moveTo(0,0);sh.lineTo(.3,0);sh.lineTo(0,.34);sh.closePath();const sail=new T.Mesh(geo('sail',()=>new T.ShapeGeometry(sh)),new T.MeshStandardMaterial({color:dark?'#111':col,side:T.DoubleSide,roughness:.8}));sail.position.set(-.02,.17,0);sail.rotation.y=Math.PI/2*0;
 g.add(hull,bow,mast,sail);g.position.set((a.x+b.x)/2,SEA_Y+.02,(a.y+b.y)/2);g.rotation.y=-Math.atan2(dz,dx);g.traverse(o=>{o.castShadow=true});return g}
function pawnM(col){const pts=[[0,0],[.13,0],[.13,.03],[.08,.1],[.065,.24],[.1,.27],[.0,.28]].map(p=>new T.Vector2(p[0],p[1]));const g=new T.Group();
 const b=new T.Mesh(new T.LatheGeometry(pts,14),mat(col,{roughness:.5,flatShading:false}));const h=new T.Mesh(geo('pawnh',()=>new T.SphereGeometry(.075,12,10)),mat(col,{roughness:.5,flatShading:false}));h.position.y=.33;g.add(b,h);g.traverse(o=>{o.castShadow=true});return g}
function buildPieces(s,Gm,isNew){disposeG(pieces);pieces=new T.Group();const V=Gm.V,E=Gm.E,HX=Gm.HX,cols=PC(),keys=new Set(),fresh=[];
 const reg=(k,o,drop)=>{keys.add(k);pieces.add(o);if(isNew&&!prevKeys.has(k)&&drop!==false)fresh.push(o)};
 for(const e in s.roads){const E_=E[e],m=roadM(V[E_.a],V[E_.b],cols[s.roads[e]],LAND_Y);reg('r'+e,m)}
 for(const e in (s.ships||{})){const E_=E[e],m=shipM(V[E_.a],V[E_.b],cols[s.ships[e]],false);reg('s'+e,m)}
 for(const v in s.bld){const b=s.bld[v],g=houseM(cols[b.p],b.k===2),y=land(s,V[v].h)?LAND_Y:SEA_Y+.02;g.position.set(V[v].x,y,V[v].y);g.rotation.y=((+v*37)%7)*.08;reg('b'+v+':'+b.k,g)}
 /* ladro e pirata */
 {const h=HX[s.robber],p=pawnM('#2e2e33');p.position.set(h.x-.46,LAND_Y+.02,h.y+.36);p.userData={slot:'rob',to:[h.x-.46,h.y+.36],from:lastRob&&lastRob.i!==s.robber?lastRob.p:null};reg('rob',p,false);lastRob={i:s.robber,p:[h.x-.46,h.y+.36]}}
 if(s.pirate!=null){const h=HX[s.pirate],g=shipM({x:h.x-.4,y:h.y},{x:h.x+.4,y:h.y},'#111',true);g.scale.setScalar(1.35);g.position.y=SEA_Y+.02;g.userData={slot:'pir',to:[h.x,h.y],from:lastPir&&lastPir.i!==s.pirate?lastPir.p:null};reg('pir',g,false);lastPir={i:s.pirate,p:[h.x,h.y]}}
 pieces.traverse(o=>{if(o.isMesh)o.receiveShadow=false});scn.add(pieces);prevKeys=keys;
 fresh.forEach(o=>{const y0=o.position.y;o.position.y=y0+2.4;o.scale.multiplyScalar(1);anims.push({o,y0,t:0,d:.55+Math.random()*.15,k:'drop'})});
 pieces.children.forEach(o=>{const u=o.userData;if(u&&u.from){const fx=u.from[0],fz=u.from[1];anims.push({o,from:[fx,fz],to:u.to,t:0,d:.9,k:'slide',y0:o.position.y,dx:u.slot==='rob'?-.0:0});o.position.x=fx+(u.slot==='pir'?0:0);o.position.z=fz}})}
/* ---------- evidenziazioni: dove si può giocare adesso ---------- */
function buildMarks(s,Gm,tg){disposeG(marks);marks=new T.Group();pulses=[];if(!tg)return;const V=Gm.V,E=Gm.E,HX=Gm.HX,col=PC()[s.cur]||'#fff';
 const gm=new T.MeshBasicMaterial({color:col,transparent:true,opacity:.55,depthWrite:false});
 if(tg.k==='v')tg.l.forEach(v=>{const m=new T.Mesh(geo('ring',()=>new T.TorusGeometry(.17,.035,8,22)),gm);m.rotation.x=Math.PI/2;m.position.set(V[v].x,(land(s,V[v].h)?LAND_Y:SEA_Y)+.05,V[v].y);marks.add(m);pulses.push(m)});
 else if(tg.k==='e')tg.l.forEach(e=>{const a=V[E[e].a],b=V[E[e].b],dx=b.x-a.x,dz=b.y-a.y,m=new T.Mesh(new T.BoxGeometry(Math.hypot(dx,dz)*.6,.04,.1),gm);m.position.set((a.x+b.x)/2,(land(s,E[e].h)?LAND_Y:SEA_Y)+.05,(a.y+b.y)/2);m.rotation.y=-Math.atan2(dz,dx);marks.add(m);pulses.push(m)});
 else if(tg.k==='h')tg.l.forEach(i=>{const m=new T.Mesh(geo('hmark',()=>new T.CylinderGeometry(.9,.9,.03,6)),gm);m.position.set(HX[i].x,LAND_Y+.025,HX[i].y);marks.add(m);pulses.push(m)});
 scn.add(marks)}
/* ---------- avvio, ciclo, adattamento ---------- */
function size(){if(!ren)return;const tv=!!document.documentElement.dataset.tv,pw=tv?Math.min(Math.max(260,innerWidth*.24),460):0,rw=tv?Math.min(Math.max(230,innerWidth*.2),350)+innerWidth*.02:0,w=Math.max(200,innerWidth-pw-rw),h=innerHeight;
 ren.setSize(w,h,false);cv.style.width=w+'px';cv.style.height=h+'px';cam.aspect=w/h;frame();cam.updateProjectionMatrix()}
function frame(){if(!fit)return;const asp=cam.aspect,fov=cam.fov*Math.PI/180,tilt=.98,th=Math.tan(fov/2);
 const dist=Math.max((fit.d*Math.sin(tilt)+.6)/2/th,fit.w/2/(th*asp))*1.12;cam.userData={cx:fit.cx,cz:fit.cz,dist,tilt}}
function loop(t){raf=requestAnimationFrame(loop);if(!ren||document.hidden)return;if(!tick0)tick0=t;const sec=(t-tick0)/1000,dt=Math.min(.05,(t-(loop.l||t))/1000);loop.l=t;
 const u=cam.userData;if(u&&u.dist){const sway=Math.sin(sec*.18)*.025;cam.position.set(u.cx+Math.sin(sway)*u.dist*.35,Math.sin(u.tilt)*u.dist,u.cz+Math.cos(u.tilt)*u.dist);cam.lookAt(u.cx,0,u.cz+.02*u.dist)}
 pulses.forEach((m,i)=>{const k=1+.12*Math.sin(sec*4+i*.4);m.scale.set(k,1,k);m.material.opacity=.4+.25*Math.sin(sec*4)});
 if(hot&&board){hotT+=dt;board.children.forEach(o=>{const d=o.userData;if(d&&d.num){if(d.num===hot&&hotT<3.2){o.position.y=d.base+.05+Math.abs(Math.sin(hotT*7))*.22;o.scale.setScalar(1.18)}else{o.position.y=d.base;o.scale.setScalar(1)}}});if(hotT>=3.2)hot=null}
 for(let i=anims.length-1;i>=0;i--){const a=anims[i];a.t+=dt;const k=Math.min(1,a.t/a.d);
  if(a.k==='drop'){const e=1-Math.pow(1-k,3),b=k<1?Math.abs(Math.sin(k*Math.PI*2.4))*.12*(1-k):0;a.o.position.y=a.y0+(1-e)*2.4+b}
  else{const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;a.o.position.x=a.from[0]+(a.to[0]-a.from[0])*e+(a.o.userData.slot==='rob'?0:0);a.o.position.z=a.from[1]+(a.to[1]-a.from[1])*e;a.o.position.y=a.y0+Math.sin(k*Math.PI)*.5}
  if(k>=1){if(a.k==='drop')a.o.position.y=a.y0;anims.splice(i,1)}}
 ren.render(scn,cam)}
async function init(){if(T||failed)return;if(!loading)loading=(async()=>{try{if(!VENDOR.gl())throw new Error('niente WebGL');await VENDOR.load('three');T=window.THREE;
  cv=document.createElement('canvas');cv.id='ctv3d';cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);
  ren=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});ren.setPixelRatio(Math.min(2,devicePixelRatio||1));ren.outputEncoding=T.sRGBEncoding;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=.92;ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;
  scn=new T.Scene();scn.background=new T.Color('#1a120a');scn.fog=new T.Fog('#1a120a',40,90);cam=new T.PerspectiveCamera(34,1,.5,200);
  scn.add(new T.HemisphereLight('#dbe8ff','#5a4026',.62));const sun=new T.DirectionalLight('#fff1d4',1.15);sun.position.set(7,16,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:2,far:50});sun.shadow.bias=-.0006;scn.add(sun);const lamp=new T.PointLight('#ffb865',.9,40);lamp.position.set(-8,9,-6);scn.add(lamp);
  addEventListener('resize',size);raf=requestAnimationFrame(loop);if(typeof G!=='undefined'&&G&&G.g==='catan'&&typeof render==='function')render()}catch(e){failed=true;console.warn('Catan 3D non disponibile:',e&&e.message);if(typeof render==='function')render()}})();return loading}
/* bersagli da evidenziare sulla TV: le mosse obbligate del giocatore di turno */
function targets(s){if(s.over)return null;const C=CATAN;try{if(s.phase==='setup')return s.setup.step==='v'?{k:'v',l:C.settleSpots(s,s.cur,true)}:{k:'e',l:C.roadSpots(s,s.cur,s.setup.v).concat(C.shipSpots(s,s.cur,{from:s.setup.v}))};
 if(s.phase==='robber')return{k:'h',l:C.geo(s).HX.map((h,i)=>i).filter(i=>i!==s.robber&&(C.landH(s,i)||(s.pirate!=null&&s.hexes[i].t==='sea'&&!s.hexes[i].fog&&i!==s.pirate)))};
 if(s.phase==='rb')return{k:'e',l:C.roadSpots(s,s.cur).concat(C.shipSpots(s,s.cur))}}catch(e){}return null}
function sync(s){if(failed)return false;if(!T){init();return false}if(!scn)return false;
 const Gm=CATAN.geo(s),gk=(s.lay?'L'+s.lay.length+':'+s.hexes.map(h=>h.t[0]+h.num+(h.fog?'f':'')).join('').length:'P'+s.prof)+':'+(s.gid||'')+':'+(s.ports||[]).map(p=>p.e+p.k).join(','),nk=(s.gid||'')+':'+s.evn;
 const rebuilt=gk!==geoKey,fogK=s.hexes.map(h=>h.fog?1:0).join('');
 if(rebuilt||fogK!==sync.fk){geoKey=gk;sync.fk=fogK;buildBoard(s,Gm);size();prevKeys=new Set();lastRob=lastPir=null}
 if(nk!==stateKey||rebuilt){const first=!stateKey||rebuilt;stateKey=nk;const roll=(s.ev||[]).find(e=>e.t==='roll');if(roll&&!first){hot=roll.d[0]+roll.d[1];hotT=0}
  buildPieces(s,Gm,!first);buildMarks(s,Gm,targets(s))}
 cv.style.display='block';return true}
function hide(){if(cv)cv.style.display='none'}
return{sync,hide,init,get failed(){return failed},get ready(){return !!scn},debug:()=>({cam,scn,ren,T})}})();
