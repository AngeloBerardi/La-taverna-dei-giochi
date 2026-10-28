/* ---- Regicide sullo schermo comune: «il tavolo del Castello» (three.js) ----
   Stesso palcoscenico di Catan (CTV.stage: tavolo di legno, luci calde, solidi low-poly pastello). Solo grafica: legge lo stato e non scrive nulla.
   Sul vassoio: il percorso dei 12 sovrani (torrette), il nemico su un cavalletto con la barra della vita, i tre mazzi, le carte giocate e un sottobicchiere
   per ogni giocatore con le carte coperte in mano (mai i valori). Le carte sono dipinte su canvas, originali. Senza WebGL la TV usa la vista 2D (RTV). */
const RTV3=(()=>{
let T=null,K=null,S=null,failed=false,loading=null,tick0=0,pcs=null,key='',prev=new Set(),anims=[],pulses=[],fit=null,built=false;
const TEX={},GL={H:'♥',D:'♦',C:'♣',S:'♠'},SUC={H:'#d9604f',D:'#e08a3c',C:'#4f9a6a',S:'#5d72c2'},RK={J:'#a9c8e8',Q:'#e8b3d0',K:'#f0d58a'};
const CW=1,CH=1.4,TRAY_Y=.12;
const lin=c=>'#'+[1,3,5].map(i=>Math.round(255*Math.pow(parseInt(c.slice(i,i+2),16)/255,2.2)).toString(16).padStart(2,'0')).join('');
const M=(c,o)=>K.mat(lin(c),o);
const hsh=c=>{let h=7;for(let i=0;i<c.length;i++)h=(h*31+c.charCodeAt(i))|0;return Math.abs(h)};
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const PIPS={2:[[.5,.2],[.5,.8]],3:[[.5,.2],[.5,.5],[.5,.8]],4:[[.3,.2],[.7,.2],[.3,.8],[.7,.8]]};
PIPS[5]=PIPS[4].concat([[.5,.5]]);PIPS[6]=PIPS[4].concat([[.3,.5],[.7,.5]]);PIPS[7]=PIPS[6].concat([[.5,.35]]);PIPS[8]=PIPS[6].concat([[.5,.35],[.5,.65]]);
PIPS[9]=PIPS[4].concat([[.3,.4],[.7,.4],[.3,.6],[.7,.6],[.5,.5]]);PIPS[10]=PIPS[4].concat([[.3,.4],[.7,.4],[.3,.6],[.7,.6],[.5,.3],[.5,.7]]);
/* ---------- carte dipinte ---------- */
function crown(g,cx,y,w,h,n,col){g.fillStyle=col;g.strokeStyle='rgba(70,40,5,.7)';g.lineWidth=3;g.beginPath();g.moveTo(cx-w/2,y);
 for(let i=0;i<n;i++){const x0=cx-w/2+w*i/n,x1=cx-w/2+w*(i+.5)/n,x2=cx-w/2+w*(i+1)/n;g.lineTo(x0,y-h*.25);g.lineTo(x1,y-h);g.lineTo(x2,y-h*.25)}g.lineTo(cx+w/2,y);g.closePath();g.fill();g.stroke();
 g.fillStyle='#f6e08a';g.fillRect(cx-w/2,y,w,h*.22);g.strokeRect(cx-w/2,y,w,h*.22)}
function court(g,p,W,H){const red=p.s==='H'||p.s==='D',main=SUC[p.s],cx=W/2,cy=H/2-4;
 g.fillStyle=red?'#f4cdbf':'#cdd3e6';rr(g,34,52,W-68,H-104,14);g.fill();g.strokeStyle='rgba(90,60,20,.45)';g.lineWidth=3;g.stroke();
 g.fillStyle=main;g.beginPath();g.moveTo(cx-80,H-58);g.quadraticCurveTo(cx-84,cy+44,cx-34,cy+30);g.lineTo(cx+34,cy+30);g.quadraticCurveTo(cx+84,cy+44,cx+80,H-58);g.closePath();g.fill();
 if(p.r==='Q'){g.fillStyle='#8a5a3a';g.beginPath();g.ellipse(cx-34,cy+8,16,46,.12,0,7);g.ellipse(cx+34,cy+8,16,46,-.12,0,7);g.fill()}
 g.fillStyle='#f1cfa6';g.beginPath();g.arc(cx,cy-6,36,0,7);g.fill();
 if(p.r==='K'){g.fillStyle='#e6e1d4';g.beginPath();g.moveTo(cx-34,cy+4);g.quadraticCurveTo(cx,cy+78,cx+34,cy+4);g.quadraticCurveTo(cx,cy+22,cx-34,cy+4);g.fill()}
 g.fillStyle='#2a1d10';g.beginPath();g.arc(cx-12,cy-12,3.6,0,7);g.arc(cx+12,cy-12,3.6,0,7);g.fill();
 if(p.r!=='K'){g.strokeStyle='#8a4a3a';g.lineWidth=3;g.beginPath();g.arc(cx,cy+2,10,.25,Math.PI-.25);g.stroke()}
 if(p.r==='K')crown(g,cx,cy-38,78,48,5,'#e8b83a');else if(p.r==='Q')crown(g,cx,cy-38,66,40,3,'#e8b83a');
 else{g.fillStyle=main;g.beginPath();g.arc(cx,cy-12,38,Math.PI,0);g.fill();g.strokeStyle='#f6e08a';g.lineWidth=5;g.beginPath();g.moveTo(cx+20,cy-44);g.quadraticCurveTo(cx+70,cy-90,cx+54,cy-20);g.stroke()}
 g.fillStyle='#fff8e0';g.font='bold 40px "Segoe UI Symbol","DejaVu Sans",serif';g.textAlign='center';g.textBaseline='middle';g.fillText(GL[p.s],cx,cy+84)}
function jolly(g,W,H){const cx=W/2,cy=H/2;g.fillStyle='#e6d6f2';rr(g,34,52,W-68,H-104,14);g.fill();g.strokeStyle='rgba(90,60,20,.45)';g.lineWidth=3;g.stroke();
 g.fillStyle='#f1cfa6';g.beginPath();g.arc(cx,cy+20,38,0,7);g.fill();g.fillStyle='#8a5ac2';g.beginPath();g.moveTo(cx-44,cy+4);g.quadraticCurveTo(cx-90,cy-60,cx-70,cy-96);g.lineTo(cx-14,cy-20);g.lineTo(cx,cy-92);g.lineTo(cx+14,cy-20);g.lineTo(cx+70,cy-96);g.quadraticCurveTo(cx+90,cy-60,cx+44,cy+4);g.closePath();g.fill();
 g.fillStyle='#f6c23a';[[cx-70,cy-96],[cx,cy-92],[cx+70,cy-96]].forEach(q=>{g.beginPath();g.arc(q[0],q[1],9,0,7);g.fill()});
 g.fillStyle='#2a1d10';g.beginPath();g.arc(cx-13,cy+14,4,0,7);g.arc(cx+13,cy+14,4,0,7);g.fill();g.strokeStyle='#b0453a';g.lineWidth=3;g.beginPath();g.arc(cx,cy+26,13,.2,Math.PI-.2);g.stroke()}
function face(c){const k='f'+c;if(TEX[k])return TEX[k];const W=256,H=358,cv=K.canv(W,H),g=cv.getContext('2d'),p=c[0]==='X'?{r:'X',s:''}:P(c),red=p.s==='H'||p.s==='D',col=red?'#c2413a':'#2a2d3a';
 g.fillStyle='#f7efd8';rr(g,0,0,W,H,18);g.fill();g.strokeStyle='rgba(90,60,20,.5)';g.lineWidth=5;rr(g,8,8,W-16,H-16,12);g.stroke();
 g.textAlign='center';g.textBaseline='middle';
 if(p.r==='X')jolly(g,W,H);
 else{g.fillStyle=col;const num=+p.r;
  if(num>=2&&num<=10){g.font='bold 54px "Segoe UI Symbol","DejaVu Sans",serif';PIPS[num].forEach(q=>g.fillText(GL[p.s],34+q[0]*(W-68),60+q[1]*(H-120)))}
  else if(p.r==='A'){g.font='bold 150px "Segoe UI Symbol","DejaVu Sans",serif';g.fillText(GL[p.s],W/2,H/2)}
  else court(g,p,W,H);
  g.fillStyle=col;g.font='bold 44px Georgia,serif';g.fillText(p.r,30,34);g.font='bold 34px "Segoe UI Symbol","DejaVu Sans",serif';g.fillText(GL[p.s],30,74);
  g.save();g.translate(W,H);g.rotate(Math.PI);g.font='bold 44px Georgia,serif';g.fillText(p.r,30,34);g.font='bold 34px "Segoe UI Symbol","DejaVu Sans",serif';g.fillText(GL[p.s],30,74);g.restore()}
 return TEX[k]=K.ctex(cv)}
function back(){if(TEX.back)return TEX.back;const W=256,H=358,cv=K.canv(W,H),g=cv.getContext('2d');g.fillStyle='#7a2f3a';rr(g,0,0,W,H,18);g.fill();
 g.strokeStyle='rgba(240,200,120,.55)';g.lineWidth=2;for(let i=-H;i<W+H;i+=26){g.beginPath();g.moveTo(i,0);g.lineTo(i+H,H);g.moveTo(i+H,0);g.lineTo(i,H);g.stroke()}
 g.strokeStyle='#f0c166';g.lineWidth=6;rr(g,10,10,W-20,H-20,12);g.stroke();g.fillStyle='#7a2f3a';g.beginPath();g.arc(W/2,H/2,58,0,7);g.fill();g.stroke();
 crown(g,W/2,H/2+10,64,40,3,'#f0c166');return TEX.back=K.ctex(cv)}
/* ---------- piccoli pezzi ---------- */
function plate(txt,w,h,o){o=o||{};const k='pl'+txt+'|'+w+'|'+h+'|'+(o.bg||'')+(o.fg||'');if(TEX[k])return TEX[k].clone();const cw=512,ch=Math.round(512*h/w),cv=K.canv(cw,ch),g=cv.getContext('2d');
 g.fillStyle=o.bg||'#3b2616';rr(g,2,2,cw-4,ch-4,ch*.28);g.fill();g.strokeStyle='#c9973b';g.lineWidth=6;g.stroke();g.fillStyle=o.fg||'#f6e7c1';g.textAlign='center';g.textBaseline='middle';
 let fs=Math.round(ch*.52);g.font=`bold ${fs}px Georgia,"DejaVu Sans",serif`;while(g.measureText(txt).width>cw-40&&fs>14){fs-=2;g.font=`bold ${fs}px Georgia,"DejaVu Sans",serif`}g.fillText(txt,cw/2,ch/2+2);
 const t=K.ctex(cv);TEX[k]=t;return t}
function plateM(txt,w,h,o){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:plate(txt,w,h,o),roughness:.7}));m.rotation.x=-Math.PI/2;return m}
/* carte con spessore e angoli arrotondati: una lastra di bordo crema + una faccia sopra + un dorso sotto (nessuna carta è piatta, nessuna si compenetra) */
const TH=.055,FM={};let BMAT=null;
function rrShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
const slab=h=>K.geo('slab'+h.toFixed(2),()=>{const g=new T.ExtrudeGeometry(rrShape(CW,CH,.07),{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);return g});
const fpl=()=>K.geo('fpl',()=>{const g=new T.PlaneGeometry(CW-.07,CH-.07);g.rotateX(-Math.PI/2);return g}),bpl=()=>K.geo('bpl',()=>{const g=new T.PlaneGeometry(CW-.07,CH-.07);g.rotateX(Math.PI/2);return g});
const faceMat=c=>FM[c]||(FM[c]=new T.MeshStandardMaterial({map:face(c),roughness:.6})),backMat=()=>BMAT||(BMAT=new T.MeshStandardMaterial({map:back(),roughness:.6}));
function cardM(c,sc,down){const g=new T.Group(),body=new T.Mesh(slab(TH),M('#efe3c4'));body.castShadow=true;g.add(body);
 const f=new T.Mesh(fpl(),down?backMat():faceMat(c));f.position.y=TH+.002;g.add(f);const b=new T.Mesh(bpl(),backMat());b.position.y=-.002;g.add(b);g.scale.set(sc||1,1,sc||1);return g}
const backM=sc=>cardM(null,sc,true);
function stackM(n,tilt){const g=new T.Group();if(!n){const r=new T.Mesh(slab(.012),M('#2e4a40'));g.add(r);return g}
 const h=Math.round((TH+Math.min(1.0,n*.028))/.02)*.02,m=new T.Mesh(slab(h),M('#efe3c4'));m.castShadow=true;g.add(m);const t=new T.Mesh(fpl(),backMat());t.position.y=h+.002;g.add(t);
 if(tilt){const c=backM(1);c.position.set(.2,h+.006,.12);c.rotation.y=.35;g.add(c)}return g}
function tower(col,tall){const g=new T.Group(),m=M(col,{roughness:.6}),d=M(K.shade(col,-.25),{roughness:.6});
 const b=new T.Mesh(new T.CylinderGeometry(.34,.4,.34*tall,8),m);b.position.y=.17*tall;const t=new T.Mesh(new T.ConeGeometry(.42,.34,8),d);t.position.y=.34*tall+.17;g.add(b,t);g.traverse(o=>{o.castShadow=true});return g}
function pawn(col){const g=new T.Group(),m=K.mat(col,{roughness:.5,flatShading:false});const b=new T.Mesh(new T.CylinderGeometry(.14,.2,.34,12),m),h=new T.Mesh(new T.SphereGeometry(.15,12,10),m);h.position.y=.34;b.position.y=.17;g.add(b,h);g.traverse(o=>{o.castShadow=true});return g}
/* ---------- tavolo (si costruisce una volta) ---------- */
function buildTable(){const t=new T.Group(),wood=K.woodTex();
 const floor=new T.Mesh(new T.PlaneGeometry(90,90),new T.MeshStandardMaterial({map:wood,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;t.add(floor);
 const frame=new T.Mesh(new T.BoxGeometry(15.2,.3,10.6),M('#6f4726',{roughness:.7}));frame.position.set(0,.05,.3);frame.receiveShadow=true;frame.castShadow=true;t.add(frame);
 const felt=new T.Mesh(new T.BoxGeometry(14.4,.06,9.8),M('#3f7a66',{roughness:.95}));felt.position.set(0,.2,.3);felt.receiveShadow=true;t.add(felt);
 const inl=(x,z,w,d,c)=>{const m=new T.Mesh(new T.BoxGeometry(w,.02,d),M(c,{roughness:.95}));m.position.set(x,.235,z);m.receiveShadow=true;t.add(m)};
 inl(-5.9,.35,1.6,5.3,'#356a58');inl(4,1.3,5.7,3.2,'#356a58');inl(-.9,-.5,3.6,3.6,'#4b8a74');
 S.scn.add(t);return t}
/* ---------- pezzi (si ricostruiscono a ogni stato) ---------- */
const PC=()=>(typeof CPC!=='undefined'?CPC:['#e8574a','#3a8fe6','#35b866','#f2c230','#b06be0','#e8742c']);
const Y=.25;
const SP={x:1.5,z:1.0};
function buildPieces(s,en,isNew){if(pcs)S.scn.remove(pcs);pcs=new T.Group();const keys=new Set(),fresh=[];pulses=[];
 const reg=(k,o)=>{keys.add(k);pcs.add(o);if(isNew&&!prev.has(k))fresh.push(o)},put=(o,x,y,z,ry)=>{o.position.set(x,y,z);if(ry)o.rotation.y=ry;return o};
 const done=s.en?12-s.castle.length-1:12;
 /* percorso dei 12 sovrani */
 for(let i=0;i<12;i++){const r='JQK'[Math.floor(i/4)],st=i<done?'d':i===done&&s.en?'n':'x',x=-5.775+i*1.05;
  const col=st==='d'?'#8ccf9f':st==='n'?'#f0c166':RK[r],tw=tower(col,st==='n'?1.7:st==='d'?.7:1.1);put(tw,x,Y,-3.9);pcs.add(tw);
  const pl=plateM(st==='d'?'✓':r,.62,.36,{bg:st==='n'?'#7a5212':st==='d'?'#2f5a43':'#3b2616'});put(pl,x,Y+.01,-3.3);pcs.add(pl);if(st==='n')pulses.push(tw)}
 /* mazzi: l'altezza della pila è il numero di carte */
 [['Castello',s.castle.length,-2.2,0],['Taverna',s.tav.length,-.25,1],['Scarti',s.disc.length,1.7,1]].forEach(([nm,n,z,tl])=>{const st=stackM(n,tl);put(st,-5.9,Y,z);pcs.add(st);const p=plateM(nm+' '+n,1.5,.34);put(p,-5.9,Y+.01,z+1.0);pcs.add(p)});
 /* nemico: la carta poggia su un cavalletto (appoggio davanti, puntone dietro) */
 if(en){const X=G.g==='regix',rk=P(en.c).r,su=P(en.c).s,hp=RG.hpOf[rk],atk=X?RGX.atkBase(en):RG.atOf[rk],eff=Math.max(0,atk-en.sh),left=Math.max(0,hp-en.dmg);
  const ring=new T.Mesh(new T.CylinderGeometry(1.95,1.95,.04,36),new T.MeshBasicMaterial({color:lin(SUC[su]),transparent:true,opacity:.35}));put(ring,-.9,Y+.01,-.4);pcs.add(ring);pulses.push(ring);
  const ledge=new T.Mesh(new T.BoxGeometry(2.4,.235,.34),M('#6f4726'));put(ledge,-.9,Y+.1175,1.02);ledge.castShadow=true;pcs.add(ledge);
  const leg=new T.Mesh(new T.BoxGeometry(.22,2.2,.12),M('#6f4726'));put(leg,-.9,Y+.82,-1.71);leg.rotation.x=.7;leg.castShadow=true;pcs.add(leg);
  const bc=cardM(en.c,2.15);bc.scale.y=1.8;put(bc,-.9,Y+1.12,-.28);bc.rotation.x=.62;reg('en'+en.c,bc);
  const nm=plateM(RN[rk]+' di '+SN[su],3.1,.5);put(nm,-.9,Y+.02,1.55);pcs.add(nm);
  const ti=plateM(TITLES[en.c]||'',3.1,.34,{bg:'#2a1b0f',fg:'#e6cf9a'});put(ti,-.9,Y+.02,2.0);pcs.add(ti);
  const tr=new T.Mesh(new T.BoxGeometry(4.1,.12,.58),M('#3a2616'));put(tr,4.9,Y+.06,-3.0);tr.castShadow=true;pcs.add(tr);
  const fl=Math.max(.001,3.8*left/hp),fb=new T.Mesh(new T.BoxGeometry(fl,.16,.36),M('#e0504a',{roughness:.5}));put(fb,2.95+fl/2,Y+.12,-3.0);pcs.add(fb);
  for(let q=1;q<hp/10;q++){const tk=new T.Mesh(new T.BoxGeometry(.04,.2,.5),M('#1a120a'));put(tk,2.95+3.8*q*10/hp,Y+.13,-3.0);pcs.add(tk)}
  const hpl=plateM('Vita '+left+' / '+hp,2.4,.42);put(hpl,4.9,Y+.02,-2.4);pcs.add(hpl);
  const at=plateM('Attacco '+eff+(en.sh?'  (scudo −'+en.sh+')':''),3.2,.42,{bg:'#5a1f1f'});put(at,4.9,Y+.02,-1.9);pcs.add(at);
  const im=plateM(en.can?'Immunità annullata dal Jolly':'Immune ai '+SN[su].toLowerCase()+' '+GL[su]+(en.im2?' e ai '+SN[en.im2].toLowerCase()+' '+GL[en.im2]:''),3.8,.42,{bg:en.can?'#3a2d22':'#4a2a6a'});put(im,4.9,Y+.02,-1.4);pcs.add(im);
  if(X&&en.tr){const t=plateM('Tratto: '+RGX.TR[en.tr].n,3.8,.42,{bg:'#7a1c22'});put(t,4.9,Y+.02,-.9);pcs.add(t)}}
 /* carte giocate: una accanto all'altra, ognuna un gradino sopra la precedente */
 s.played.forEach((c,i)=>{const col=i%5,row=Math.floor(i/5),m=cardM(c,.75);put(m,2.95+col*.82,Y+.01+i*(TH+.006),.45+row*1.1,((hsh(c)%9)-4)*.03);reg('p'+c,m)});
 if(!s.played.length){const p=plateM('Nessuna carta sul campo',3.4,.4,{bg:'#2e4a40',fg:'#cfe6da'});put(p,4.9,Y+.02,1.2);pcs.add(p)}
 /* giocatori: sottobicchiere + carte coperte a ventaglio, una sopra l'altra */
 const n=s.n,cols=PC();
 for(let i=0;i<n;i++){const x=n===1?0:-5.2+(10.4/(n-1))*i,act=i===s.cur&&!s.over,h=s.hands[i].length;
  const co=new T.Mesh(new T.CylinderGeometry(.5,.55,.08,24),M(cols[i]||'#ccc',{roughness:.6}));put(co,x,Y+.04,4.25);co.castShadow=true;pcs.add(co);
  const cnt=Math.min(h,10);for(let k=0;k<cnt;k++){const a=(k-(cnt-1)/2)*.17,m=backM(.5);put(m,x+Math.sin(a)*1.5,Y+.01+k*(TH+.006),3.55-Math.cos(a)*.15+Math.abs(a)*.4,-a*.9);pcs.add(m)}
  const nm=plateM(s.names[i]+(act?' ▸':''),2.2,.42,{bg:act?'#7a5212':'#3b2616'});put(nm,x,Y+.02,5.12);pcs.add(nm);
  const hc=plateM(h+(h===1?' carta':' carte'),1.1,.3,{bg:'#2a1b0f',fg:'#e6cf9a'});put(hc,x,Y+.1,4.25);pcs.add(hc);
  if(act){const r=new T.Mesh(new T.TorusGeometry(.78,.06,8,30),new T.MeshBasicMaterial({color:lin('#ffd36b'),transparent:true,opacity:.8}));r.rotation.x=Math.PI/2;put(r,x,Y+.1,4.25);pcs.add(r);pulses.push(r)}}
 if(s.n===1&&s.jl!=null){const j=cardM('X1',.7);put(j,6.4,Y+.01,3.9,.1);pcs.add(j);const p=plateM('Jolly '+s.jl,1.2,.3);put(p,6.4,Y+.02,4.7);pcs.add(p)}
 S.scn.add(pcs);prev=keys;
 fresh.forEach(o=>{const y0=o.position.y;o.position.y=y0+2.2;anims.push({o,y0,t:0,d:.5+Math.random()*.15})})}
/* ---------- avvio, ciclo, adattamento ---------- */
function size(){if(!S)return;const r=document.querySelector('.rtv-right'),w=Math.max(300,r?Math.floor(r.getBoundingClientRect().left):innerWidth),h=innerHeight;
 S.ren.setSize(w,h,false);S.cv.style.width=w+'px';S.cv.style.height=h+'px';S.cam.aspect=w/h;S.cam.updateProjectionMatrix();
 const asp=w/h,th=Math.tan(S.cam.fov*Math.PI/180/2),tilt=.98,fw=15.4,fd=10.6;S.cam.userData={cx:0,cz:.3,tilt,dist:Math.max((fd*Math.sin(tilt)+.8)/2/th,fw/2/(th*asp))*1.2}}
function loop(t){requestAnimationFrame(loop);if(!S||document.hidden||S.cv.style.display==='none')return;if(!tick0)tick0=t;const sec=(t-tick0)/1000,dt=Math.min(.05,(t-(loop.l||t))/1000);loop.l=t;
 const u=S.cam.userData;if(u&&u.dist){const sway=Math.sin(sec*.18)*.025;S.cam.position.set(u.cx+Math.sin(sway)*u.dist*.35,Math.sin(u.tilt)*u.dist,u.cz+Math.cos(u.tilt)*u.dist);const sh=RACT.shake||0;S.cam.position.x+=Math.sin(sec*61)*.07*sh;S.cam.position.y+=Math.sin(sec*53)*.05*sh;S.cam.lookAt(u.cx,0,u.cz+.02*u.dist)}
 RACT.tick(dt,sec);
 pulses.forEach((m,i)=>{if(m.material&&m.material.opacity!==undefined&&m.material.transparent)m.material.opacity=.45+.3*Math.sin(sec*4);else{const k=1+.05*Math.sin(sec*3+i);m.scale.set(1,k,1)}});
 for(let i=anims.length-1;i>=0;i--){const a=anims[i];a.t+=dt;const k=Math.min(1,a.t/a.d),e=1-Math.pow(1-k,3),b=k<1?Math.abs(Math.sin(k*Math.PI*2.4))*.1*(1-k):0;a.o.position.y=a.y0+(1-e)*2.2+b;if(k>=1){a.o.position.y=a.y0;anims.splice(i,1)}}
 S.ren.render(S.scn,S.cam)}
async function init(){if(S||failed)return;if(!loading)loading=(async()=>{try{T=await CTV.lib();K=CTV.kit();S=CTV.stage('rtv3d');buildTable();RACT.init(T,K,S.scn);requestAnimationFrame(loop);addEventListener('resize',size);
  if(typeof G!=='undefined'&&G&&isRG(G.g)&&typeof render==='function')render()}catch(e){failed=true;console.warn('Regicide 3D non disponibile:',e&&e.message);if(typeof render==='function')render()}})();return loading}
let curN=3,lastGid='',fired=false;
const GEO={spot:SP,card:{x:-.9,y:Y+1.3,z:-.28},tower:s=>({x:-5.775+(s.en?12-s.castle.length-1:11)*1.05,z:-3.9}),seat:p=>({x:curN===1?0:-5.2+(10.4/(curN-1))*p,z:4.25})};
function sync(s,en){if(failed)return false;if(!S){init();return false}
 const nk=(s.gid||'')+':'+s.evn+':'+(en?en.c+en.dmg+'/'+en.sh+(en.can?'j':''):'')+':'+s.cur;
 S.cv.style.display='block';size();curN=s.n;
 if(nk!==key){const first=!key;key=nk;buildPieces(s,en,!first)}
 if((s.gid||'')!==lastGid){lastGid=s.gid||'';fired=false;RACT.clear()}
 RACT.sync(s,en,s.ev,!fired,GEO);fired=true;
 return true}
function hide(){if(S)S.cv.style.display='none'}
return{sync,hide,init,get failed(){return failed},get ready(){return !!S},debug:()=>({S,K})}})();
