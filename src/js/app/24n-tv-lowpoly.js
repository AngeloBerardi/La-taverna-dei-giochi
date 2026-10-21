/* ---- Kit low-poly per i tavoli 3D dello schermo comune (Azul, Valle Selvaggia) ----
   Stesso palcoscenico di Catan e Regicide (CTV.stage): qui c'è solo ciò che serve a costruire solidi a facce piatte:
   - builder(): accumula triangoli con il colore per vertice e li unisce in UNA mesh (centinaia di tessere = una sola chiamata di disegno);
   - un atlante di glifi originali (animali, pigna, motivi delle piastrelle di Azul) usato come decalcomania sopra i solidi;
   - targhe di testo, tavolo e un piccolo «runtime» (camera, ciclo, caduta dei pezzi nuovi);
   - i glifi sono percorsi SVG: gli stessi disegnano la texture 3D e le icone dell'HUD 2D (niente emoji).
   Non legge né scrive stato: lo fanno i moduli dei giochi. Senza WebGL i giochi usano la vista 2D di ripiego. */
const LP=(()=>{
let T=null,K=null,ATL=null,MV=null;
const TOP=.34,GC=8,CELL=128,PT={},PM={};
const cir=(x,y,r,cw)=>`M${x-r} ${y}a${r} ${r} 0 1 ${cw?1:0} ${2*r} 0a${r} ${r} 0 1 ${cw?1:0} ${-2*r} 0Z`;
/* glifi in un quadrato 40x40: f = riempimento (i buchi sono cerchi con verso opposto), l = tratto, w = spessore del tratto */
const GLY={
 o:{f:cir(20,24,11)+cir(10.5,13,4.5)+cir(29.5,13,4.5)+cir(15.5,21,1.7,1)+cir(24.5,21,1.7,1)+cir(20,28.5,3.6,1)},
 a:{f:'M14 17Q20 15 26 17L23 33Q20 35 17 33Z'+cir(16.5,22,1.4)+cir(23.5,22,1.4),l:'M16 17L10 9L5 11M10 9L9 3M13 13L7 15M24 17L30 9L35 11M30 9L31 3M27 13L33 15',w:2.6},
 s:{f:'M5 20Q19 6 32 18L37 12V28L32 22Q19 34 5 20Z'+cir(12,18,1.6)},
 f:{f:'M20 9L24 14L37 19L26 21L20 33L14 21L3 19L16 14Z'},
 v:{f:'M7 6L16 14H24L33 6L35 22L20 35L5 22Z'+cir(14,21,1.8)+cir(26,21,1.8)+cir(20,30,2.2)},
 p:{f:'M20 4Q31 12 29 26Q25 36 20 36Q15 36 11 26Q9 12 20 4Z'+cir(16,16,1.8)+cir(24,16,1.8)+cir(20,22,1.8)+cir(15.5,27,1.8)+cir(24.5,27,1.8)},
 M:{f:'M3 33L15 10L22 22L27 15L37 33Z'},
 F:{f:'M20 3L29 15H24L32 26H8L16 15H11ZM18 26H22V36H18Z'},
 P:{f:cir(10,13,3)+cir(20,6,3.2)+cir(30,13,3),l:'M10 35V15M20 35V8M30 35V15',w:2.6},
 W:{l:'M3 13Q9 7 15 13T27 13T37 13M3 23Q9 17 15 23T27 23T37 23M3 33Q9 27 15 33T27 33T37 33',w:3},
 R:{l:'M9 3Q27 12 17 21T31 37',w:5}};
const AIDX={o:0,a:1,s:2,f:3,v:4,p:5},FIRST=13;
/* icona SVG per l'HUD (colore = currentColor) */
const gsvg=(k,px)=>{const d=GLY[k];return`<svg class="lpg" width="${px||24}" height="${px||24}" viewBox="0 0 40 40" aria-hidden="true">${d.f?`<path d="${d.f}" fill="currentColor"/>`:''}${d.l?`<path d="${d.l}" fill="none" stroke="currentColor" stroke-width="${d.w||3}" stroke-linecap="round" stroke-linejoin="round"/>`:''}</svg>`};
function paintG(g,k,col){const d=GLY[k];g.fillStyle=g.strokeStyle=col;if(d.f)g.fill(new Path2D(d.f));if(d.l){g.lineWidth=d.w||3;g.lineCap=g.lineJoin='round';g.stroke(new Path2D(d.l))}}
/* i cinque motivi delle piastrelle di Azul, come in 16-azul.js ma su canvas */
function azMark(g,c){const[bg,dk,lt]=AZC[c];const C=(x,y,r,f)=>{g.beginPath();g.arc(x,y,r,0,7);f?g.fill():g.stroke()};g.lineCap='round';
 if(c===0){g.fillStyle=lt;[[20,20,4],[20,11,4.5],[20,29,4.5],[11,20,4.5],[29,20,4.5]].forEach(a=>C(a[0],a[1],a[2],1));g.fillStyle=dk;C(20,20,2,1)}
 else if(c===1){g.fillStyle=lt;g.strokeStyle=dk;g.lineWidth=1.5;C(20,20,6.5,1);C(20,20,6.5,0);g.lineWidth=2;g.stroke(new Path2D('M20 5v6M20 29v6M5 20h6M29 20h6M9.5 9.5l4 4M26.5 26.5l4 4M30.5 9.5l-4 4M13.5 26.5l-4 4'))}
 else if(c===2){g.strokeStyle=lt;g.lineWidth=2.4;g.stroke(new Path2D('M20 5L35 20L20 35L5 20Z'));g.fillStyle=lt;g.fill(new Path2D('M20 12L28 20L20 28L12 20Z'));g.fillStyle=bg;C(20,20,2.4,1)}
 else if(c===3){g.strokeStyle=lt;g.lineWidth=2.4;C(20,20,11,0);g.fillStyle=lt;C(20,20,4,1);[[7,7],[33,7],[7,33],[33,33]].forEach(a=>C(a[0],a[1],2,1))}
 else{g.strokeStyle=lt;g.lineWidth=2;g.stroke(new Path2D('M20 4v32M4 20h32M9 9l22 22M31 9L9 31'));g.fillStyle=bg;C(20,20,5,1);C(20,20,5,0)}}
function atlas(){if(ATL)return ATL;const c=K.canv(GC*CELL,2*CELL),g=c.getContext('2d'),sc=(CELL-16)/40;
 const put=(i,f)=>{g.save();g.translate((i%GC)*CELL+8,Math.floor(i/GC)*CELL+8);g.scale(sc,sc);f();g.restore()};
 Object.keys(AIDX).forEach(k=>put(AIDX[k],()=>paintG(g,k,'#fff')));
 if(typeof AZC!=='undefined')for(let i=0;i<5;i++)put(8+i,()=>azMark(g,i));
 put(FIRST,()=>{g.fillStyle='#8a2a1a';g.font='900 34px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('1',20,22)});
 ATL=K.ctex(c);ATL.anisotropy=8;return ATL}
/* ---------- colore ---------- */
const lin=c=>'#'+[1,3,5].map(i=>Math.round(255*Math.pow(parseInt(c.slice(i,i+2),16)/255,2.2)).toString(16).padStart(2,'0')).join('');
const rgbL=c=>[1,3,5].map(i=>Math.pow(parseInt(c.slice(i,i+2),16)/255,2.2));
const mix=(a,b,t)=>{const x=[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t));return'#'+x.map(v=>v.toString(16).padStart(2,'0')).join('')};
const jit=(c,i)=>K.shade(c,(((i*37)%11)/11-.5)*.16);
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/* ---------- builder: solidi a facce piatte con colore per vertice ---------- */
function builder(){const P=[],C=[],DP=[],DU=[],DC=[];let n=0;
 const push=(a,hex)=>{const c=rgbL(hex);P.push(a[0],a[1],a[2]);C.push(c[0],c[1],c[2])};
 const b={
  tri(a,x,y,hex,ref){if(ref&&dot(crs(sub(x,a),sub(y,a)),ref)<0){const t=x;x=y;y=t}push(a,hex);push(x,hex);push(y,hex);n++},
  quad(a,x,y,z,hex,ref){b.tri(a,x,y,hex,ref);b.tri(a,y,z,hex,ref)},
  /* prisma retto su un poligono convesso [[x,z]...] tra y0 e y1; lati leggermente più scuri */
  prism(pts,y0,y1,hex,o){o=o||{};const m=pts.length,cx=pts.reduce((s,p)=>s+p[0],0)/m,cz=pts.reduce((s,p)=>s+p[1],0)/m,top=o.top||hex,sd=o.side||K.shade(hex,-.2);
   for(let i=0;i<m;i++){const p=pts[i],q=pts[(i+1)%m];b.tri([cx,y1,cz],[p[0],y1,p[1]],[q[0],y1,q[1]],o.jit?jit(top,i):top,[0,1,0]);
    if(y1>y0)b.quad([p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],sd,[(p[0]+q[0])/2-cx,0,(p[1]+q[1])/2-cz])}},
  /* piramide/cono con m lati, base a y, vertice a y+h (r2 = raggio in cima: tronco) */
  cone(cx,cz,r,h,m,y,hex,o){o=o||{};const r2=o.r2||0,ya=y+h;for(let i=0;i<m;i++){const a=Math.PI*2*i/m+(o.rot||0),a2=Math.PI*2*(i+1)/m+(o.rot||0),c=o.jit===false?hex:jit(hex,i+(o.seed||0)),
    p=[cx+r*Math.cos(a),y,cz+r*Math.sin(a)],q=[cx+r*Math.cos(a2),y,cz+r*Math.sin(a2)],ref=[Math.cos((a+a2)/2),.5,Math.sin((a+a2)/2)];
    if(r2>0){const p2=[cx+r2*Math.cos(a),ya,cz+r2*Math.sin(a)],q2=[cx+r2*Math.cos(a2),ya,cz+r2*Math.sin(a2)];b.quad(p,q,q2,p2,c,ref);b.tri([cx,ya,cz],p2,q2,K.shade(hex,.1),[0,1,0])}
    else b.tri(p,q,[cx,ya,cz],c,ref)}},
  /* decalcomania: quadrato col glifo k dell'atlante, orizzontale a quota y (non scrive ombre, sta sopra per polygonOffset) */
  decal(k,x,y,z,size,hex,rot){const col=k>=8?'#ffffff':(hex||'#3a2a18'),c=rgbL(col),u0=(k%GC)/GC,v0=1-(Math.floor(k/GC)+1)/2,du=1/GC,dv=.5,h=size/2,r=rot||0,cs=Math.cos(r),sn=Math.sin(r);
   const V=[[-h,-h,0,1],[h,-h,1,1],[h,h,1,0],[-h,h,0,0]].map(([dx,dz,u,v])=>[x+dx*cs-dz*sn,y,z+dx*sn+dz*cs,u0+u*du,v0+v*dv]);
   [[0,3,2],[0,2,1]].forEach(t=>t.forEach(i=>{DP.push(V[i][0],V[i][1],V[i][2]);DU.push(V[i][3],V[i][4]);DC.push(c[0],c[1],c[2])}))},
  mesh(o){o=o||{};if(!n)return null;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeVertexNormals();
   const m=new T.Mesh(g,MV||(MV=new T.MeshStandardMaterial({vertexColors:true,roughness:.82,flatShading:true})));m.castShadow=o.shadow!==false;m.receiveShadow=true;return m},
  decalMesh(){if(!DP.length)return null;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(DP,3));g.setAttribute('uv',new T.Float32BufferAttribute(DU,2));g.setAttribute('color',new T.Float32BufferAttribute(DC,3));g.computeVertexNormals();
   const m=new T.Mesh(g,decalMat());m.renderOrder=2;return m}};
 return b}
let DM=null;const decalMat=()=>DM||(DM=new T.MeshStandardMaterial({map:atlas(),vertexColors:true,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
/* ---------- forme ---------- */
const cutRect=(cx,cz,w,d,c)=>[[cx-w/2+c,cz-d/2],[cx+w/2-c,cz-d/2],[cx+w/2,cz-d/2+c],[cx+w/2,cz+d/2-c],[cx+w/2-c,cz+d/2],[cx-w/2+c,cz+d/2],[cx-w/2,cz+d/2-c],[cx-w/2,cz-d/2+c]];
const ngon=(cx,cz,r,m,rot)=>Array.from({length:m},(_,i)=>{const a=Math.PI*2*i/m+(rot||0);return[cx+r*Math.cos(a),cz+r*Math.sin(a)]});
const hexPts=(cx,cz,r)=>Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i-30);return[cx+r*Math.cos(a),cz+r*Math.sin(a)]});
/* ---------- targhe di testo (canvas) ---------- */
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const flat=(w,h)=>K.geo('lp'+w+'x'+h,()=>{const g=new T.PlaneGeometry(w,h);g.rotateX(-Math.PI/2);return g});
function cplate(key,w,h,draw){if(!PT[key]){const pw=Math.min(1024,Math.round(w*170)),ph=Math.max(32,Math.round(pw*h/w)),c=K.canv(pw,ph),g=c.getContext('2d');draw(g,pw,ph);PT[key]=K.ctex(c)}
 const m=new T.Mesh(flat(w,h),PM[key]||(PM[key]=new T.MeshStandardMaterial({map:PT[key],roughness:.7})));m.receiveShadow=true;return m}
function plate(txt,w,h,o){o=o||{};return cplate('t|'+txt+'|'+w+'|'+h+'|'+(o.bg||'')+(o.fg||''),w,h,(g,pw,ph)=>{g.fillStyle=o.bg||'#3b2616';rr(g,2,2,pw-4,ph-4,ph*.22);g.fill();g.strokeStyle=o.edge||'#c9973b';g.lineWidth=Math.max(2,ph*.05);g.stroke();
 g.fillStyle=o.fg||'#f6ead0';g.textAlign='center';g.textBaseline='middle';let fs=ph*.58;g.font='700 '+fs+'px Georgia,serif';while(g.measureText(txt).width>pw*.92&&fs>8){fs*=.92;g.font='700 '+fs+'px Georgia,serif'}g.fillText(txt,pw/2,ph/2+ph*.03)})}
/* ---------- tavolo, runtime ---------- */
function table(rt,o){const b=builder(),floor=new T.Mesh(new T.PlaneGeometry(90,90),new T.MeshStandardMaterial({map:K.woodTex(),roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;rt.stat.add(floor);
 b.prism(cutRect(0,0,o.w+.9,o.d+.9,.55),0,TOP-.04,o.frame||'#6f4726',{side:'#4a2f18',jit:1});b.prism(cutRect(0,0,o.w,o.d,.42),TOP-.04,TOP,o.felt||'#1b3a78');rt.stat.add(b.mesh())}
/* alone trasparente con la forma della plancia (poligono [[x,z]...]) per chi è di turno */
function glow(pts,hex,op){const sh=new T.Shape();pts.forEach((p,i)=>i?sh.lineTo(p[0],-p[1]):sh.moveTo(p[0],-p[1]));const g=new T.ShapeGeometry(sh);g.rotateX(-Math.PI/2);return new T.Mesh(g,new T.MeshBasicMaterial({color:lin(hex),transparent:true,opacity:op||.5,depthWrite:false}))}
function runtime(id,o){const S=CTV.stage(id),cam=S.cam,anims=[],pulses=[],reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,stat=new T.Group(),dyn=new T.Group();let t0=0,lk='',onTick=null;S.scn.add(stat,dyn);
 function size(){const r=document.querySelector(o.right||'.tv3-right'),w=Math.max(300,r?Math.floor(r.getBoundingClientRect().left):innerWidth),h=innerHeight,k=w+'x'+h;if(k===lk)return;lk=k;
  S.ren.setSize(w,h,false);S.cv.style.width=w+'px';S.cv.style.height=h+'px';cam.aspect=w/h;cam.updateProjectionMatrix();
  const asp=w/h,th=Math.tan(cam.fov*Math.PI/180/2),tilt=.98;cam.userData={cx:o.cx||0,cz:o.cz||0,tilt,dist:Math.max((o.fd*Math.sin(tilt)+.8)/2/th,o.fw/2/(th*asp))*1.16}}
 function loop(t){requestAnimationFrame(loop);if(document.hidden||S.cv.style.display==='none')return;if(!t0)t0=t;const sec=(t-t0)/1000,dt=Math.min(.05,(t-(loop.l||t))/1000);loop.l=t;
  const u=cam.userData;if(u&&u.dist){const sw=reduce?0:Math.sin(sec*.18)*.025;cam.position.set(u.cx+Math.sin(sw)*u.dist*.35,Math.sin(u.tilt)*u.dist,u.cz+Math.cos(u.tilt)*u.dist);cam.lookAt(u.cx,0,u.cz+.02*u.dist)}
  pulses.forEach((m,i)=>{if(m.material&&m.material.transparent)m.material.opacity=.4+.3*Math.sin(sec*4+i)});
  for(let i=anims.length-1;i>=0;i--){const a=anims[i];if(a.w>0){a.w-=dt;if(a.w>0)continue;a.o.visible=true}a.t+=dt;const k=Math.min(1,a.t/a.d),e=1-Math.pow(1-k,3),bn=k<1?Math.abs(Math.sin(k*Math.PI*2.4))*.1*(1-k):0;a.o.position.y=a.y0+(1-e)*2.2+bn;if(k>=1){a.o.position.y=a.y0;anims.splice(i,1)}}
  if(onTick)onTick(dt,sec);S.ren.render(S.scn,cam)}
 requestAnimationFrame(loop);addEventListener('resize',()=>{lk='';size()});
 return{S,stat,dyn,anims,pulses,size,tick:f=>{onTick=f},show(){S.cv.style.display='block';size()},hide(){S.cv.style.display='none'},
  /* il pezzo cade dall'alto con un piccolo rimbalzo (w = attesa in secondi, per sfalsare l'arrivo) */
  drop(o3,w){if(reduce)return;const y0=o3.position.y;o3.position.y=y0+2.2;if(w>0)o3.visible=false;anims.push({o:o3,y0,t:0,d:.5,w:w||0})},
  wipe(g){while(g.children.length)g.remove(g.children[0]);pulses.length=0;anims.length=0}}}
async function init(){if(T)return;T=await CTV.lib();K=CTV.kit()}
/* ---------- guscio HUD 2D (sopra il canvas, o con il tavolo piatto di ripiego) ---------- */
function shell(o){const url=TV.linkGioco();
 return`<div class="tv3 ${o.cls||''}"><header class="tv3-top"><div><div class="tv3-logo">${o.logo}</div><div class="tv3-act">${o.sub||''}</div></div><div class="tv3-state">${o.state||''}</div>
  <div class="tv3-join"><div class="tv3-qr">${QR.svg(url,{scuro:'#1a1208',chiaro:'#f6ecd2'})}</div><div><div class="tv3-code">${esc(R.code||TV.code)}</div><div class="tv3-hint">Inquadra per sederti al tavolo</div></div></div></header>
  ${o.mid?`<main class="tv3-mid">${o.mid}</main>`:''}<aside class="tv3-right">${o.right||''}</aside><footer class="tv3-foot">${o.foot||''}</footer>${o.end||''}</div>`}
const feedH=s=>'<div class="tv3-lt">Cronaca</div><ul class="tv3-feed">'+(s.log||[]).slice(-5).reverse().map((t,i)=>`<li class="${i?'':'new'}">${esc(t)}</li>`).join('')+'</ul>';
const endH=(ok,title,sub,rows)=>`<div class="tv3-end"><div class="tv3-endbox"><div class="tv3-crown">${ic(ok?'corona':'stretta',72)}</div><h2>${title}</h2><p>${sub||''}</p>${rows||''}</div></div>`;
/* chiamato da afterRender: fuori dal gioco i canvas si nascondono e il pannello QR di sinistra torna */
function away(){const on=ui.tv&&ui.screen==='game'&&G&&(G.g==='azul'||G.g==='valle');if(!on){document.documentElement.dataset.tv3='';if(typeof AZ3!=='undefined')AZ3.hide();if(typeof VL3!=='undefined')VL3.hide()}
 else{if(G.g!=='azul'&&typeof AZ3!=='undefined')AZ3.hide();if(G.g!=='valle'&&typeof VL3!=='undefined')VL3.hide()}}
return{init,builder,runtime,table,glow,plate,cplate,cutRect,ngon,hexPts,mix,lin,gsvg,shell,feedH,endH,away,rr,TOP,AIDX,FIRST,get T(){return T},get K(){return K},atlas};
})();
