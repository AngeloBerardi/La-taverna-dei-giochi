/* ---- Valle Selvaggia sullo schermo comune (?tv=CODICE): «le valli» low-poly (three.js) ----
   Si usa quando ui.tv è vero (vedi valleH in 22b-valle-selvaggia.js). Le valli di TUTTI i giocatori sono visibili insieme (quella di turno è evidenziata),
   le tessere esagonali sono in rilievo (montagne con la neve, foreste di abeti, prati, palude e fiume incassati), gli animali sono gettoni con il glifo.
   A sinistra il sentiero con le 4 coppie tessera + animale. Ogni valle è UNA mesh (colori per vertice): il rilievo costa pochissimo da disegnare.
   Solo grafica: legge lo stato e non scrive nulla. Senza WebGL: valli piatte in SVG. */
const VL3=(()=>{
let R_=null,failed=false,loading=null,geoKey='',key='',prev={};
const ZR=.62,RI=.5,SL=.2,PADH=.07,TOP=LP.TOP,SZ=[-2.9,-.9,1.1,3.1],SX=[-7.15,-5.55];
const HC={M:'#8e98a8',F:'#2f7d4a',P:'#c9b44a',W:'#4fa9a3',R:'#3d74c9'},HT={M:.1,F:.12,P:.08,W:.035,R:.05};
const pix=(q,r,z)=>[z*Math.sqrt(3)*(q+r/2),z*1.5*r];
const cells=n=>n===1?[{x:1.6,z:0,w:12.6,d:8.4}]:n===2?[{x:-1.6,z:0,w:6.3,d:8.4},{x:4.8,z:0,w:6.3,d:8.4}]:[{x:-1.6,z:-2.45,w:6.3,d:4.6},{x:4.8,z:-2.45,w:6.3,d:4.6},{x:-1.6,z:2.45,w:6.3,d:4.6},{x:4.8,z:2.45,w:6.3,d:4.6}];
const maj=ed=>{const c={};ed.forEach(h=>c[h]=(c[h]||0)+1);return Object.keys(c).sort((a,b)=>c[b]-c[a])[0]};
const dark=(c,t)=>LP.mix(c,'#000000',t);
/* gettone dell'animale: dischetto crema con il glifo sopra; y = quota del piano su cui poggia */
function addToken(b,an,cx,cz,y,f){b.prism(LP.ngon(cx,cz,.3*f,10,.3),y,y+.09,'#f1e6c8',{side:'#c9b98f'});b.decal(LP.AIDX[an],cx,y+.094,cz,.46*f,'#2c1f12')}
/* una tessera: zoccolo di legno, piazzola centrale, sei spicchi in rilievo secondo l'habitat del lato */
function addTile(b,c,cx,cz,z,withTok){const f=z/ZR,ed=[0,1,2,3,4,5].map(i=>VALLE.edgeH(c,i)),ri=z*RI,py=SL+PADH,pc=c.t.k?'#e0b53c':LP.mix(HC[maj(ed)],'#ffffff',.25);
 b.prism(LP.hexPts(cx,cz,z*.985),0,SL,'#4a3624',{side:'#3a2a1c'});b.prism(LP.hexPts(cx,cz,ri),SL,py,pc,{side:dark(pc,.25)});
 for(let i=0;i<6;i++){const h=ed[i],a1=Math.PI/180*(-i*60-30),a2=Math.PI/180*(-i*60+30),ro=z*.985,col=HC[h],
   O1=[cx+ro*Math.cos(a1),cz+ro*Math.sin(a1)],O2=[cx+ro*Math.cos(a2),cz+ro*Math.sin(a2)],I1=[cx+ri*Math.cos(a1),cz+ri*Math.sin(a1)],I2=[cx+ri*Math.cos(a2),cz+ri*Math.sin(a2)],
   mx=(I1[0]+I2[0]+O1[0]+O2[0])/4,mz=(I1[1]+I2[1]+O1[1]+O2[1])/4,y=SL+HT[h],quad=[I1,I2,O2,O1];
  if(h==='M'){b.prism(quad,SL,y,col);const ay=y+.62*f,ap=[mx,ay,mz],B=quad.map(p=>[p[0],y,p[1]]),Cp=B.map(p=>[p[0]+(ap[0]-p[0])*.58,y+(ay-y)*.58,p[2]+(ap[2]-p[2])*.58]);
   for(let k=0;k<4;k++){const j=(k+1)%4,ref=[(B[k][0]+B[j][0])/2-mx,.6,(B[k][2]+B[j][2])/2-mz];b.quad(B[k],B[j],Cp[j],Cp[k],LP.mix(col,k%2?'#ffffff':'#000000',.12),ref);b.tri(Cp[k],Cp[j],ap,'#eef2f7',ref)}}
  else{b.prism(quad,SL,y,col,{jit:1});
   if(h==='F'){const dx=mx-cx,dz=mz-cz,l=Math.hypot(dx,dz)||1,tx=-dz/l*.12*f,tz=dx/l*.12*f;b.cone(mx+tx,mz+tz,.16*f,.4*f,5,y,'#1d5a35',{seed:i});b.cone(mx-tx,mz-tz,.13*f,.32*f,5,y,'#27703f',{seed:i+3,rot:.5})}}}
 const a=c.t.a;
 if(c.tok&&withTok!==false)addToken(b,c.tok,cx,cz,py,f);
 else if(!c.tok){const P1={1:[[0,0,.46]],2:[[-.15,0,.27],[.15,0,.27]],3:[[0,-.14,.22],[-.15,.1,.22],[.15,.1,.22]]}[a.length]||[];a.split('').forEach((an,i)=>{const q=P1[i];if(q)b.decal(LP.AIDX[an],cx+q[0]*f,py+.004,cz+q[1]*f,q[2]*f,'#2c1f12')})}}
const clear=g=>{while(g.children.length)g.remove(g.children[0])};
function bbox(B){const ks=Object.keys(B);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;ks.forEach(k=>{const[q,r]=VALLE.QR(k),[x,z]=pix(q,r,ZR);x0=Math.min(x0,x-ZR*.87);x1=Math.max(x1,x+ZR*.87);z0=Math.min(z0,z-ZR);z1=Math.max(z1,z+ZR)});return{x0,x1,z0,z1}}
function buildStatic(s){const T=LP.T;clear(R_.stat);LP.table(R_,{w:16.6,d:9.8,felt:'#1d3b2a',frame:'#6f4726'});const b=LP.builder();
 b.prism(LP.cutRect(-6.35,0,3.3,9.2,.45),TOP,TOP+.06,'#3b2616',{side:'#25180d',jit:1});
 cells(s.n).forEach((c,i)=>{b.prism(LP.cutRect(c.x,c.z,c.w-.1,c.d-.1,.55),TOP,TOP+.06,VPC[i]||'#888',{side:dark(VPC[i]||'#888888',.3)});b.prism(LP.cutRect(c.x,c.z,c.w-.34,c.d-.34,.5),TOP+.06,TOP+.12,'#2c4a30',{side:'#1a2c1e',jit:1})});
 R_.stat.add(b.mesh());const pl=LP.plate('Il sentiero',2.4,.4);pl.position.set(-6.35,TOP+.075,-4.3);R_.stat.add(pl)}
function buildDyn(s,anim){const T=LP.T;clear(R_.dyn);R_.pulses.length=0;R_.anims.length=0;const cs=cells(s.n),ev=anim?(s.ev||[]):[],now={};
 /* sentiero */
 const sb=LP.builder();s.disp.forEach((d,i)=>{if(d.t)addTile(sb,{t:d.t,rot:0,tok:null},SX[0],SZ[i],.8,false);if(d.k){sb.prism(LP.ngon(SX[1],SZ[i],.46,12,.2),0,.06,'#6a4a2a');addToken(sb,d.k,SX[1],SZ[i],.06,1.3)}});
 const sm=sb.mesh();if(sm){sm.position.y=TOP+.06;R_.dyn.add(sm)}const sd=sb.decalMesh();if(sd){sd.position.y=TOP+.06;R_.dyn.add(sd)}
 for(let p=0;p<s.n;p++){const c=cs[p],B=s.boards[p].cells,bb=bbox(B),W=bb.x1-bb.x0,D=bb.z1-bb.z0,kv=Math.min(1.8,(c.w-.8)/W,(c.d-1.05)/D),act=p===s.cur&&!s.over;
  const vg=new T.Group();vg.scale.setScalar(kv);vg.position.set(c.x-(bb.x0+bb.x1)/2*kv,TOP+.12,c.z-(bb.z0+bb.z1)/2*kv-.12);R_.dyn.add(vg);
  const newT=ev.filter(e=>e.t==='place'&&e.p===p).map(e=>e.q+','+e.r),newK=ev.filter(e=>e.t==='token'&&e.p===p).map(e=>e.q+','+e.r);
  const b=LP.builder(),extra=LP.builder();
  Object.keys(B).forEach(k=>{const[q,r]=VALLE.QR(k),[x,z]=pix(q,r,ZR),cell=B[k];
   if(newT.includes(k))addTile(extra,cell,x,z,ZR,true);
   else{addTile(b,cell,x,z,ZR,!newK.includes(k));if(newK.includes(k)&&cell.tok)addToken(extra,cell.tok,x,z,SL+PADH,1)}});
  const m=b.mesh();if(m)vg.add(m);const d=b.decalMesh();if(d)vg.add(d);
  const eg=new T.Group(),em=extra.mesh(),ed=extra.decalMesh();if(em)eg.add(em);if(ed)eg.add(ed);if(eg.children.length){vg.add(eg);R_.drop(eg)}
  const nm=LP.plate(s.names[p]+'   '+(s.over?s.over.scores[p]:liveScore(s)[p])+' punti   '+s.boards[p].nature+' pigne',4.6,.4,{bg:act?'#7a5212':'#2a1b0f',edge:act?'#ffd36b':'#c9973b'});
  nm.position.set(c.x,TOP+.135,c.z+c.d/2-.42);R_.dyn.add(nm);
  if(act){const gl=LP.glow(LP.cutRect(c.x,c.z,c.w+.12,c.d+.12,.62),'#ffd36b',.55);gl.position.y=TOP+.012;R_.dyn.add(gl);R_.pulses.push(gl);
   if(s.phase==='token'&&s.held){const hb=LP.builder();addToken(hb,s.held,0,0,0,1.5);const hm=hb.mesh(),hd=hb.decalMesh(),hg=new T.Group();if(hm)hg.add(hm);if(hd)hg.add(hd);hg.position.set(c.x-c.w/2+.9,TOP+.7,c.z+c.d/2-1.0);R_.dyn.add(hg)}}}}
const liveScore=s=>{try{return VALLE.score(s).map(d=>d.tot)}catch(e){return s.names.map(()=>0)}};
async function init(){if(R_||failed)return;if(!loading)loading=(async()=>{try{if(!VENDOR.gl())throw new Error('niente WebGL');await LP.init();R_=LP.runtime('vltv3d',{fw:17.6,fd:10.8,cz:-.45});
  if(typeof G!=='undefined'&&G&&G.g==='valle'&&typeof render==='function')render()}catch(e){failed=true;console.warn('Valle 3D non disponibile:',e&&e.message);if(typeof render==='function')render()}})();return loading}
function sync(s){if(failed)return false;if(!R_){init();return false}
 R_.show();const gk=s.n+':'+(s.gid||'');if(gk!==geoKey){geoKey=gk;buildStatic(s);key=''}
 const nk=(s.gid||'')+':'+s.evn;if(nk!==key){const first=!key;key=nk;buildDyn(s,!first)}
 return true}
function hide(){if(R_)R_.hide()}
return{sync,hide,init,get failed(){return failed},get ready(){return !!R_},debug:()=>({R_})}})();
/* ---------- HUD 2D ---------- */
function valleTVH(){const s=G,ok=VL3.sync(s),fail=VL3.failed,nm=i=>esc(s.names[i]);document.documentElement.dataset.tv3='1';
 let sc;try{sc=VALLE.score(s)}catch(e){sc=s.names.map(()=>({tot:0,an:{},cor:{},bon:{},nat:0}))}
 const ART={o:'un orso',a:'un alce',s:'un salmone',f:'un falco',v:'una volpe'},o=s.over,tot=i=>o?o.scores[i]:sc[i].tot;
 const state=o?(o.win==null?'Pareggio in testa':'<b>'+nm(o.win)+'</b> vince la partita'):s.phase==='token'?'<b>'+nm(s.cur)+'</b> porta '+ART[s.held]+' su una tessera':'<b>'+nm(s.cur)+'</b> sceglie una tessera e un animale';
 const pls=s.names.map((n,i)=>`<li class="${i===s.cur&&!o?'act':''}" style="--pc:${VPC[i]}"><i class="tv3-dot"></i><span class="tv3-n">${esc(n)}</span><b class="tv3-vp">${tot(i)}<small>★</small></b><span class="tv3-st"><span>Pigne <b>${s.boards[i].nature}</b></span><span>Turni <b>${s.left[i]}</b></span></span></li>`).join('');
 const row=(g,col,f)=>`<tr><th style="color:${col}">${LP.gsvg(g,30)}</th>${s.names.map((_,i)=>`<td>${f(sc[i])}</td>`).join('')}</tr>`;
 const tab=`<table class="vtv-tab"><tr><th></th>${s.names.map((n,i)=>`<th><i class="tv3-dot" style="--pc:${VPC[i]}"></i></th>`).join('')}</tr>${'oasfv'.split('').map(a=>row(a,'#f3e6c4',d=>d.an[a]||0)).join('')}${'MFPWR'.split('').map(h=>row(h,VHC[h],d=>(d.cor[h]||0)+(d.bon[h]||0))).join('')}${row('p','#d6aa3c',d=>d.nat||0)}<tr class="tot"><th>Tot.</th>${s.names.map((_,i)=>`<td>${tot(i)}</td>`).join('')}</tr></table>`;
 let mid='';if(fail){mid=`<div class="vtv-flat n${s.n}">${s.names.map((n,i)=>`<div class="vtv-fb ${i===s.cur&&!o?'act':''}"><b>${esc(n)}</b>${vBoardH(s,i,{spots:[],ghost:null,tokT:null})}</div>`).join('')}<div class="vtv-fd">${s.disp.map(d=>`<span class="vtv-fp">${d.t?vMiniTile(d.t):''}<em>${d.k?LP.gsvg(d.k,40):''}</em></span>`).join('')}</div></div>`}
 let end='';if(o){end=LP.endH(o.win!=null,o.win==null?'Pareggio!':'Vince '+nm(o.win)+'!','La valle è completa',`<ul>${s.names.map((n,i)=>`<li class="${o.winners.includes(i)?'w':''}"><span>${esc(n)}</span><b>${o.scores[i]}★</b></li>`).join('')}</ul>`)}
 return LP.shell({cls:'vtv n'+s.n,logo:'Valle Selvaggia',sub:'Turni '+(s.left[s.cur]||0)+' · tessere nel mazzo '+s.pile.length,state,mid,right:`<ul class="tv3-pl">${pls}</ul>${tab}${LP.feedH(s)}`,foot:'',end})}
