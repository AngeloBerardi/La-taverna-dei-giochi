/* ---- Azul sullo schermo comune (?tv=CODICE): «il tavolo delle piastrelle» low-poly (three.js) ----
   Si usa quando ui.tv è vero (vedi azulH in 16-azul.js). Tutto è pubblico, quindi la TV mostra tutto: le fabbriche in cerchio con il centro a sinistra,
   le plance di tutti i giocatori a destra (righe, muro, pavimento), un sacchetto, e sopra l'HUD 2D (stato, giocatori, tracciato dei punti, cronaca).
   Solidi a facce piatte, colori per vertice (24n-tv-lowpoly.js). Solo grafica: legge lo stato e non scrive nulla. Senza WebGL: tavolo piatto in SVG. */
const AZ3=(()=>{
let R_=null,failed=false,loading=null,geoKey='',key='',prev=new Set();
const P=.4,BW=4.7,BH=3.7,FC=[-5.05,-.1],Z0=-BH/2+.95,TOP=LP.TOP,MT={};
const boardPos=(i,n)=>n===2?{x:3.6,z:i?2.45:-2.45,k:1.12}:{x:i%2?6:1.1,z:i<2?-2.45:2.45,k:1};
const lineAt=(r,j)=>[-.35+(j-r)*P,Z0+r*P],wallAt=(r,c)=>[.45+c*P,Z0+r*P],floorAt=i=>[.05+(i-3)*P,Z0+5*P+.2];
const facPos=(i,n)=>{const R=n<=5?2.2:n<=7?2.45:2.6,a=-Math.PI/2+Math.PI*2*i/n;return[FC[0]+R*Math.cos(a),FC[1]+R*Math.sin(a)]};
const sq=(x,z,h)=>[[x-h,z-h],[x+h,z-h],[x+h,z+h],[x-h,z+h]];
/* ---------- piastrelle: corpo a tronco di piramide + glifo dell'atlante sopra ---------- */
function tileM(c){const T=LP.T,K=LP.K,g=new T.Group(),F=c==='F',bc=F?'#f5efe0':AZC[c][0];
 const mt=MT[bc]||(MT[bc]=new T.MeshStandardMaterial({color:LP.lin(bc),roughness:.45,flatShading:true}));
 const body=new T.Mesh(K.geo('azt',()=>{const q=new T.CylinderGeometry(.2,.245,.09,4,1);q.rotateY(Math.PI/4);return q}),mt);body.castShadow=true;body.receiveShadow=true;g.add(body);
 const k=F?LP.FIRST:8+c,dg=K.geo('azd'+k,()=>{const q=new T.PlaneGeometry(.27,.27),uv=q.attributes.uv,u0=(k%8)/8,v0=1-(Math.floor(k/8)+1)/2;
  for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)/8,v0+uv.getY(i)/2);q.rotateX(-Math.PI/2);return q});
 const dm=MT.dec||(MT.dec=new T.MeshStandardMaterial({map:LP.atlas(),transparent:true,roughness:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
 const d=new T.Mesh(dg,dm);d.position.y=.047;g.add(d);return g}
const clear=g=>{while(g.children.length)g.remove(g.children[0])};
/* ---------- parte fissa: tavolo, piatti delle fabbriche, plance, sacchetto ---------- */
function buildStatic(s){const T=LP.T,K=LP.K;clear(R_.stat);LP.table(R_,{w:16.6,d:9.8,felt:'#16336b'});
 const b=LP.builder(),nf=s.factories.length;
 for(let i=0;i<nf;i++){const[x,z]=facPos(i,nf);b.prism(LP.ngon(x,z,.68,12,i*.3),TOP,TOP+.1,'#e8dcc0',{side:'#b9a982',jit:1})}
 b.prism(LP.ngon(FC[0],FC[1],1.75,10,.2),TOP,TOP+.03,'#1f4f9f',{side:'#143a78'});
 /* sacchetto: sacco sfaccettato con il collo legato */
 b.cone(-7.3,3.95,.62,.62,7,TOP,'#c9b48a',{r2:.42});b.cone(-7.3,3.95,.42,.5,7,TOP+.62,'#d6c294',{r2:.14});b.cone(-7.3,3.95,.2,.16,6,TOP+1.12,'#8a3a2a',{r2:.0});
 R_.stat.add(b.mesh());
 for(let p=0;p<s.n;p++){const bp=boardPos(p,s.n),g=new T.Group(),bb=LP.builder(),col=VPC[p];g.position.set(bp.x,TOP,bp.z);g.scale.setScalar(bp.k);
  bb.prism(LP.cutRect(.05,0,BW+.2,BH+.2,.35),0,.1,col,{side:K.shade(col,-.3)});bb.prism(LP.cutRect(.05,0,BW,BH,.3),.1,.16,'#10285c',{side:'#0a1a3c'});
  for(let r=0;r<5;r++){for(let j=0;j<=r;j++){const[x,z]=lineAt(r,j);bb.prism(sq(x,z,.18),.16,.175,'#1f4694')}
   for(let c=0;c<5;c++){const[x,z]=wallAt(r,c);bb.prism(sq(x,z,.18),.16,.175,s.grey?'#173a7c':LP.mix('#142f6a',AZC[(c+r)%5][0],.3));if(!s.grey)bb.decal(8+(c+r)%5,x,.178,z,.26)}}
  for(let i=0;i<7;i++){const[x,z]=floorAt(i);bb.prism(sq(x,z,.18),.16,.175,'#3a1a1a')}
  g.add(bb.mesh());const dm=bb.decalMesh();if(dm){dm.material=dm.material.clone();dm.material.opacity=.22;g.add(dm)}
  const pen=LP.cplate('azpen',7*P,.3,(c,w,h)=>{c.fillStyle='#2a1010';LP.rr(c,1,1,w-2,h-2,h*.25);c.fill();c.fillStyle='#ff9c8a';c.textAlign='center';c.textBaseline='middle';c.font='700 '+h*.62+'px Georgia,serif';[-1,-1,-2,-2,-2,-3,-3].forEach((v,i)=>c.fillText('−'+(-v),(i+.5)*w/7,h*.54))});
  pen.position.set(.05,.18,Z0+5*P+.2+.34);g.add(pen);R_.stat.add(g)}}
/* ---------- parte che cambia a ogni stato ---------- */
function buildDyn(s,anim){const T=LP.T;clear(R_.dyn);R_.pulses.length=0;R_.anims.length=0;const keys=new Set(),fresh=[],bd=[];
 const add=(g,k,c,x,y,z)=>{const m=tileM(c);m.position.set(x,y+.045,z);g.add(m);keys.add(k);if(anim&&!prev.has(k))fresh.push(m)};
 const nf=s.factories.length,rd=s.round;
 s.factories.forEach((f,i)=>{const[fx,fz]=facPos(i,nf);f.forEach((c,j)=>add(R_.dyn,'f'+rd+':'+i+'.'+j+':'+c,c,fx+(j%2?.22:-.22),TOP+.1,fz+(j>1?.22:-.22)))});
 const cen=[...(s.firstInCenter?['F']:[]),...[...s.center].sort()],cnt={};
 cen.forEach((c,i)=>{const n=(cnt[c]=(cnt[c]||0)+1),cols=6,rows=Math.ceil(cen.length/cols),x=FC[0]+(i%cols-(cols-1)/2)*P*1.05,z=FC[1]+(Math.floor(i/cols)-(rows-1)/2)*P*1.05;add(R_.dyn,'c'+rd+':'+c+':'+n,c,x,TOP+.03,z)});
 const sack=LP.plate('Sacchetto '+s.bag.length,1.7,.34);sack.position.set(-7.3,TOP+.02,4.62);R_.dyn.add(sack);
 for(let p=0;p<s.n;p++){const bp=boardPos(p,s.n),g=new T.Group(),b=s.boards[p],act=p===s.cur&&!s.over;g.position.set(bp.x,TOP,bp.z);g.scale.setScalar(bp.k);R_.dyn.add(g);bd.push(g);
  b.lines.forEach((L,r)=>{for(let t=0;t<L.k;t++){const[x,z]=lineAt(r,r-t);add(g,'l'+rd+':'+p+':'+r+':'+t+':'+L.c,L.c,x,.16,z)}});
  b.wall.forEach((row,r)=>row.forEach((v,c)=>{if(v>=0){const[x,z]=wallAt(r,c);add(g,'w'+p+':'+r+':'+c+':'+v,v,x,.16,z)}}));
  b.floor.slice(0,7).forEach((t,i)=>{const[x,z]=floorAt(i);add(g,'x'+rd+':'+p+':'+i+':'+t,t,x,.16,z)});
  const pl=LP.plate(s.names[p]+'   '+b.score,3.5,.4,{bg:act?'#7a5212':'#12306e',edge:act?'#ffd36b':'#c9973b'});pl.position.set(.05,.18,-BH/2+.28);g.add(pl);
  if(act){const gl=LP.glow(LP.cutRect(.05,0,BW+.6,BH+.6,.5),'#ffd36b',.6);gl.position.y=-.012;g.add(gl);R_.pulses.push(gl)}}
 prev=keys;fresh.forEach((m,i)=>R_.drop(m,(i%14)*.03))}
async function init(){if(R_||failed)return;if(!loading)loading=(async()=>{try{if(!VENDOR.gl())throw new Error('niente WebGL');await LP.init();R_=LP.runtime('aztv3d',{fw:17.6,fd:10.8,cz:-.45});
  if(typeof G!=='undefined'&&G&&G.g==='azul'&&typeof render==='function')render()}catch(e){failed=true;console.warn('Azul 3D non disponibile:',e&&e.message);if(typeof render==='function')render()}})();return loading}
function sync(s){if(failed)return false;if(!R_){init();return false}
 R_.show();const gk=s.n+':'+s.factories.length+':'+(s.grey?1:0)+':'+(s.gid||'');
 if(gk!==geoKey){geoKey=gk;buildStatic(s);prev=new Set();key=''}
 const nk=(s.gid||'')+':'+s.evn+':'+s.round;if(nk!==key){const first=!key;key=nk;buildDyn(s,!first)}
 return true}
function hide(){if(R_)R_.hide()}
return{sync,hide,init,get failed(){return failed},get ready(){return !!R_},debug:()=>({R_})}})();
/* ---------- HUD 2D ---------- */
function azulTVH(){const s=G,ok=AZ3.sync(s),fail=AZ3.failed,nm=i=>esc(s.names[i]);document.documentElement.dataset.tv3='1';
 const state=s.over?(s.over.winners.length>1?'Pareggio in testa':'<b>'+nm(s.over.win)+'</b> vince la partita'):s.phase==='tile'?'<b>'+nm(s.cur)+'</b> posa le piastrelle sul muro':'Tocca a <b>'+nm(s.cur)+'</b>: sceglie una fabbrica o il centro';
 const done=b=>{let c=0;for(let k=0;k<5;k++)if(b.wall.every(r=>r[k]>=0))c++;return{rows:b.wall.filter(r=>r.every(x=>x>=0)).length,cols:c}};
 const pls=s.names.map((n,i)=>{const b=s.boards[i],d=done(b);return`<li class="${i===s.cur&&!s.over?'act':''}" style="--pc:${VPC[i]}"><i class="tv3-dot"></i><span class="tv3-n">${esc(n)}</span><b class="tv3-vp">${b.score}<small>★</small></b>
  <span class="tv3-st"><span>Righe <b>${d.rows}</b></span><span>Colonne <b>${d.cols}</b></span><span>Pavimento <b>${b.floor.length}</b></span></span></li>`}).join('');
 const track=`<div class="tv3-track"><div class="tv3-bar">${[0,25,50,75,100].map(v=>`<span style="left:${v}%">${v}</span>`).join('')}${s.boards.map((b,i)=>`<i style="left:${Math.min(100,b.score)}%;--pc:${VPC[i]};--o:${i}">${esc((s.names[i][0]||'?').toUpperCase())}</i>`).join('')}</div></div>`;
 let mid='';if(fail){const fac=s.factories.map(f=>`<div class="atv-f">${f.map(c=>`<span>${azT(c)}</span>`).join('')}</div>`).join(''),cen=(s.firstInCenter?`<span>${azFirst}</span>`:'')+[...s.center].sort().map(c=>`<span>${azT(c)}</span>`).join('');
  mid=`<div class="atv-flat"><div class="atv-fs">${fac}</div><div class="atv-c">${cen}</div><div class="atv-bs n${s.n}">${s.boards.map((_,i)=>azBoard(s,i)).join('')}</div></div>`}
 let end='';if(s.over){const R0=s.res||[],o=s.over;end=LP.endH(o.winners.length===1,o.winners.length>1?'Pareggio tra '+o.winners.map(i=>nm(i)).join(' e '):'Vince '+nm(o.win)+'!','Si contano righe, colonne e colori completi',
  `<ul>${s.names.map((n,i)=>`<li class="${o.winners.includes(i)?'w':''}"><span>${esc(n)}</span><small>${R0[i]?R0[i].rows+'×2 · '+R0[i].cols+'×7 · '+R0[i].colors+'×10':''}</small><b>${o.scores[i]}★</b></li>`).join('')}</ul>`)}
 return LP.shell({cls:'atv',logo:'Azul',sub:'Round '+s.round+' · sacchetto '+s.bag.length+(s.grey?' · muro libero':''),state,mid,right:`<ul class="tv3-pl">${pls}</ul>${LP.feedH(s)}`,foot:track,end})}
