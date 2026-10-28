/* ---- Armonie sullo schermo comune (?tv=CODICE): «i paesaggi» low-poly (three.js) ----
   Tutte le plance sul tavolo, una per giocatore (quella di turno illuminata): caselle di cartone, pile di dischi di legno
   (cilindri a 14 lati col fianco più scuro e un anello chiaro in cima), cubetti ambra, lilla e bianchi; a sinistra il centro
   con i suoi spazi da tre dischi. Ogni plancia è UNA mesh. Solo grafica: legge lo stato. Senza WebGL: plance SVG del telefono. */
const AC3=(()=>{
let R_=null,failed=false,loading=null,geoKey='',key='';
const ZR=.52,DH=.16,DR=.4,TOP=LP.TOP;
const pix=(k,z)=>{const[q,r]=ACC.QR(k);return[z*Math.sqrt(3)*(q+r/2),z*1.5*r]};
const cells=n=>n===1?[{x:1.9,z:0,w:11.6,d:8.6}]:[{x:-1.1,z:-2.3,w:6.6,d:4.4},{x:5.5,z:-2.3,w:6.6,d:4.4},{x:-1.1,z:2.3,w:6.6,d:4.4},{x:5.5,z:2.3,w:6.6,d:4.4}];
const cellsN=n=>n===2?[{x:-1.1,z:0,w:6.6,d:8.6},{x:5.5,z:0,w:6.6,d:8.6}]:n===3?cells(4).slice(0,3):cells(n);
const SLX=-6.55,SLZ=k=>-3.4+k*1.7;
const dark=(c,t)=>LP.mix(c,'#000000',t);
function disc(b,c,x,z,y,r,top){const C=ACOL[c];b.prism(LP.ngon(x,z,r,14,.11),y,y+DH,C[0],{side:C[1]});if(top)b.prism(LP.ngon(x,z,r*.55,14,.11),y+DH,y+DH+.012,C[2],{side:C[2]})}
function cube(b,x,z,y,s,kind){const C=kind==='w'?'#b48ae6':kind==='s'?'#f4eedc':'#f4a52e';b.prism(LP.ngon(x,z,s,4,Math.PI/4),y,y+s*1.35,C,{side:dark(C,.25)})}
function pile(b,cell,x,z,f,y0){const st=cell.s;for(let i=0;i<st.length;i++)disc(b,st[i],x,z,y0+DH*i*f,DR*f,i===st.length-1);
 const y=y0+DH*st.length*f+(st.length?.014:0);if(cell.a)cube(b,x-(cell.w?.12*f:0),z,y,.11*f,cell.a==='s'?'s':'a');if(cell.w)cube(b,x+(cell.a?.12*f:0),z,y,.1*f,'w')}
const clear=g=>{while(g.children.length)g.remove(g.children[0])};
function buildStatic(s){clear(R_.stat);LP.table(R_,{w:16.8,d:10,felt:'#24402c',frame:'#6f4726'});const b=LP.builder();
 b.prism(LP.cutRect(SLX,0,2.4,9.4,.4),TOP,TOP+.06,'#3b2616',{side:'#25180d',jit:1});
 cellsN(s.n).forEach((c,i)=>{b.prism(LP.cutRect(c.x,c.z,c.w-.1,c.d-.1,.5),TOP,TOP+.05,APC[i],{side:dark(APC[i],.3)});b.prism(LP.cutRect(c.x,c.z,c.w-.32,c.d-.32,.45),TOP+.05,TOP+.1,'#2c4632',{side:'#1a2c1e',jit:1})});
 R_.stat.add(b.mesh());const pl=LP.plate('Il centro',2.1,.36);pl.position.set(SLX,TOP+.07,-4.45);R_.stat.add(pl)}
function buildDyn(s,anim){const T=LP.T;clear(R_.dyn);R_.pulses.length=0;R_.anims.length=0;const cs=cellsN(s.n),ev=anim?(s.ev||[]):[];
 /* centro: vassoi rotondi con tre dischi */
 const sb=LP.builder();s.slots.forEach((sl,i)=>{const z=SLZ(i);sb.prism(LP.ngon(SLX,z,.78,16),0,.05,'#5a3a20',{side:'#3a2410'});if(sl)sl.forEach((c,j)=>disc(sb,c,SLX+[-.32,.32,0][j],z+[-.16,-.16,.3][j],.05,.3,1))});
 const sm=sb.mesh();if(sm){sm.position.y=TOP+.06;R_.dyn.add(sm)}
 for(let p=0;p<s.n;p++){const c=cs[p],B=s.pl[p].cells,all=ACC.shape(s.side==='C'?'A':s.side),pts=all.map(k=>pix(k,ZR)),
   x0=Math.min(...pts.map(v=>v[0]))-ZR,x1=Math.max(...pts.map(v=>v[0]))+ZR,z0=Math.min(...pts.map(v=>v[1]))-ZR,z1=Math.max(...pts.map(v=>v[1]))+ZR,
   kv=Math.min(1.9,(c.w-.6)/(x1-x0),(c.d-1)/(z1-z0)),act=p===s.cur&&!s.over;
  const vg=new T.Group();vg.scale.setScalar(kv);vg.position.set(c.x-(x0+x1)/2*kv,TOP+.1,c.z-(z0+z1)/2*kv-.2);R_.dyn.add(vg);
  const fresh=new Set(ev.filter(e=>(e.t==='put'||e.t==='cube')&&e.p===p).map(e=>e.k)),b=LP.builder(),ex=LP.builder(),arid=s.side==='D'?new Set(ACC.ARID):null;
  b.prism(LP.cutRect((x0+x1)/2,(z0+z1)/2,x1-x0+.3,z1-z0+.3,.4),0,.05,'#b8975f',{side:'#7a5a2e'});
  all.forEach(k=>{const[x,z]=pix(k,ZR);if(!B[k]){b.prism(LP.hexPts(x,z,ZR*.9),.05,.06,'#2a1c10');return}
   const dry=arid&&arid.has(k)&&!ACC.nbs(k).some(y=>B[y]&&B[y].s==='b');b.prism(LP.hexPts(x,z,ZR*.93),.05,.1,dry?'#d4b06a':'#e6d3a6',{side:'#a88758'});
   if(fresh.has(k))pile(ex,B[k],x,z,1,.1);else pile(b,B[k],x,z,1,.1)});
  const m=b.mesh();if(m)vg.add(m);
  /* le pile appena toccate cadono dall'alto */
  const em=ex.mesh();if(em){const eg=new T.Group();eg.add(em);vg.add(eg);R_.drop(eg)}
  const sc=s.over?s.over.scores[p]:liveScore(s)[p];
  const nm=LP.plate(s.names[p]+'   '+sc+' punti',4.2,.4,{bg:act?'#7a5212':'#2a1b0f',edge:act?'#ffd36b':'#c9973b'});nm.position.set(c.x,TOP+.115,c.z+c.d/2-.38);R_.dyn.add(nm);
  if(act){const gl=LP.glow(LP.cutRect(c.x,c.z,c.w+.12,c.d+.12,.55),'#ffd36b',.55);gl.position.y=TOP+.012;R_.dyn.add(gl);R_.pulses.push(gl);
   if(s.hold.length){const hb=LP.builder();s.hold.forEach((col,j)=>disc(hb,col,(j-1)*.5,0,0,.22,1));const hm=hb.mesh();if(hm){hm.position.set(c.x-c.w/2+1,TOP+.6,c.z+c.d/2-.9);R_.dyn.add(hm)}}}}}
const liveScore=s=>{try{return ACC.score(s).map(d=>d.tot)}catch(e){return s.names.map(()=>0)}};
async function init(){if(R_||failed)return;if(!loading)loading=(async()=>{try{if(!VENDOR.gl())throw new Error('niente WebGL');await LP.init();R_=LP.runtime('actv3d',{fw:17.8,fd:11,cz:-.4});
  if(typeof G!=='undefined'&&G&&G.g==='accordi'&&typeof render==='function')render()}catch(e){failed=true;console.warn('Accordi 3D non disponibile:',e&&e.message);if(typeof render==='function')render()}})();return loading}
function sync(s){if(failed)return false;if(!R_){init();return false}R_.show();const gk=s.n+':'+(s.gid||'');if(gk!==geoKey){geoKey=gk;buildStatic(s);key=''}
 const nk=(s.gid||'')+':'+s.evn;if(nk!==key){const first=!key;key=nk;buildDyn(s,!first)}return true}
function hide(){if(R_)R_.hide()}
return{sync,hide,init,get failed(){return failed}}})();
LP.reg=LP.reg||{};LP.reg.accordi=AC3;
/* ---------- HUD 2D ---------- */
function accordiTVH(){const s=G,ok=AC3.sync(s),fail=AC3.failed,nm=i=>esc(s.names[i]),o=s.over;document.documentElement.dataset.tv3='1';
 const sc=acLive(s),tot=i=>o?o.scores[i]:sc[i].tot;
 const state=o?(o.win==null?(s.n===1?'<b>'+o.scores[0]+' punti</b>':'Pareggio in testa'):'<b>'+nm(o.win)+'</b> vince la partita'):s.took==null?'<b>'+nm(s.cur)+'</b> sceglie tre dischi dal centro':'<b>'+nm(s.cur)+'</b> fa crescere il paesaggio';
 const pls=s.names.map((n,i)=>{const b=s.pl[i];return`<li class="${i===s.cur&&!o?'act':''}" style="--pc:${APC[i]}"><i class="tv3-dot"></i><span class="tv3-n">${esc(n)}</span><b class="tv3-vp">${tot(i)}<small>pt</small></b><span class="tv3-st"><span>Carte <b>${b.done.length}</b></span><span>Cubetti <b>${sc[i].cubes||0}</b></span><span>Vuote <b>${ACC.empty(s,i)}</b></span></span></li>`}).join('');
 const cur=s.pl[s.cur],hand=cur.hand.map(h=>acCardH(h.id,h.n,{})).join('');
 const disp=`<div class="tv3-lt">Animali</div><div class="ac-tvrow">${s.disp.map(id=>acCardH(id,0,{})).join('')}</div>`;
 let mid='';if(fail)mid=`<div class="ac-tvflat n${s.n}">${s.names.map((n,i)=>`<div class="ac-tvfb ${i===s.cur&&!o?'act':''}"><b>${esc(n)}</b>${acBoardSVG(s,i,{W:520})}</div>`).join('')}</div>`;
 let end='';if(o)end=LP.endH(o.win!=null||s.n===1,s.n===1?o.scores[0]+' punti · '+o.suns+' soli':o.win==null?'Pareggio!':'Vince '+nm(o.win)+'!','Il paesaggio è completo',`<ul>${s.names.map((n,i)=>`<li class="${o.winners.includes(i)?'w':''}"><span>${esc(n)}</span><b>${o.scores[i]}</b></li>`).join('')}</ul>`);
 return LP.shell({cls:'actv n'+s.n,logo:GN('accordi'),sub:'Lato '+s.side+' · '+ACC.SIDES[s.side]+' · sacchetto '+s.bag.length+(s.endTrig&&!o?' · ultimo giro':''),state,mid,
  right:`<ul class="tv3-pl">${pls}</ul>${hand?`<div class="tv3-lt">Carte di ${nm(s.cur)}</div><div class="ac-tvrow">${hand}</div>`:''}${disp}${LP.feedH(s)}`,foot:'',end})}
