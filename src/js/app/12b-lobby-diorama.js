/* Lobby a diorama (falò isometrico, canvas) ripristinata: predefinita. La sala dark fantasy (12-sala-hall.js) è scelta dalle impostazioni. */
/* ---- Lobby isometrica: diorama del falò (canvas 2D) ----
   API: const c=ISO.create(host,{players:[{id,name,own,guest,idx}],onShelf,onMove,onEmote});
        c.setPlayers(list) · c.setRemote(id,x,y) · c.emote(id,'👋') · c.destroy()
   Coordinate di gioco: griglia N×N (0..N), falò al centro. */
const ISO=(()=>{
const N=8,CX=4,CY=4,FIRE_R=1.0,SPEED=2.3;
const PAL=[['#c8262f','#8e1b22','#2f8a5b','#1f6a43'],['#2c7fd6','#123f7a','#e2b13c','#a67d12'],['#7d55c7','#40287a','#d8402f','#8e1b22'],['#e8742c','#9a4a12','#3f8fe0','#1d5aa0'],['#2fa65b','#17603a','#c8434a','#8e1b22'],['#e8b83a','#a67d12','#7d55c7','#40287a'],['#d85a9a','#8a2a5a','#2f8a5b','#1f6a43'],['#5cc8d8','#1d6a7a','#e8742c','#9a4a12']];
const SPR=[[8,0,2,1,'w'],[6,1,4,1,0],[5,2,6,1,0],[4,3,8,1,1],[5,4,6,3,'s'],[6,7,4,1,'s'],[3,12,1,1,'s'],[12,12,1,1,'s'],[6,5,1,1,'k'],[9,5,1,1,'k'],[7,6,2,1,'m'],[4,8,8,3,2],[4,12,8,1,2],[3,9,1,3,2],[12,9,1,3,2],[5,13,6,1,3],[7,9,2,1,3],[4,11,8,1,'b']];
const FIX={w:'#fff3c4',s:'#f2c29b',k:'#1a1206',m:'#b5533c',b:'#e9c46a'};
const EMO=['👋','😂','🔥','❤️','🎲','🍡'];
const STUMPS=[0,1,2,3,4,5].map(i=>{const a=i/6*Math.PI*2+.5;return[CX+2.5*Math.cos(a),CY+2.5*Math.sin(a)]});
const TREES=[[.7,6.3,1],[1.5,7.3,.85],[7.3,6.9,1],[7.6,2.6,.9],[3.6,.5,.8],[6.1,7.5,.7]];
const BOARD={x0:5.2,x1:7.5,y:.9};
const rnd=(a,b)=>a+Math.random()*(b-a);
function create(host,o){
 o=o||{};const cv=document.createElement('canvas');cv.className='isocv';cv.setAttribute('role','img');cv.setAttribute('aria-label','Il falò con i giocatori: tocca per muoverti');
 const bar=document.createElement('div');bar.className='isobar';
 bar.innerHTML=EMO.map(e=>`<button type="button" class="isoem" data-e="${e}" aria-label="Emote ${e}">${e}</button>`).join('');
 host.innerHTML='';host.append(cv);if(o.bar!==false)host.append(bar);
 const ctx=cv.getContext('2d');let W=0,H=0,u=20,hh=10,cx=0,oy=0,dpr=1,raf=0,dead=false,t0=performance.now(),last=t0;
 let P=[],ctl=null,sparks=[],hint=true;const stars=Array.from({length:26},(_,i)=>[(i*47%100)/100,(i*29%46)/100,i%3]);
 function size(){const r=host.clientWidth||W||360;dpr=Math.min(2,window.devicePixelRatio||1);W=r;u=Math.max(14,(W-14)/(N*2));hh=u/2;H=Math.round(N*u+u*6.8);cx=W/2;oy=u*4.4;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px'}
 const X=(x,y)=>cx+(x-y)*u,Y=(x,y,z)=>oy+(x+y)*hh-(z||0);
 const poly=(pts,f,s)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();if(f){ctx.fillStyle=f;ctx.fill()}if(s){ctx.strokeStyle=s;ctx.lineWidth=1;ctx.stroke()}};
 const I=(x,y,z)=>[X(x,y),Y(x,y,z)];
 const seatOf=(i,n)=>{const a=Math.PI*1.25+(i-(n-1)/2)*.85;return[CX+2.6*Math.cos(a),CY+2.6*Math.sin(a)]};
 function setPlayers(list){const old=new Map(P.map(p=>[p.id,p]));P=list.map((p,i)=>{const s=seatOf(i,list.length),q=old.get(p.id)||{x:s[0],y:s[1],tx:null,ty:null,ph:Math.random()*6,em:null,wait:rnd(1,4)};return Object.assign(q,{id:p.id,name:String(p.name||'?'),own:!!p.own,guest:!!p.guest,sync:!!p.sync,idx:i})});
  if(!P.some(p=>p.id===ctl))ctl=(P.find(p=>p.own&&!p.guest)||P.find(p=>p.own)||{}).id||null}
 function walk(p,x,y){p.tx=Math.max(.5,Math.min(N-.5,x));p.ty=Math.max(.5,Math.min(N-.5,y))}
 function emote(id,e,quiet){const p=P.find(q=>q.id===id);if(p)p.em={s:e,t:performance.now()};if(!quiet&&o.onEmote)o.onEmote(id,e)}
 function say(id,text,t){const p=P.find(q=>q.id===id);if(p&&(!p.say||p.say.t!==t))p.say={text:String(text).slice(0,26),t}}
 function setRemote(id,x,y){const p=P.find(q=>q.id===id);if(p)walk(p,x,y)}
 /* ---- disegno ---- */
 function sky(t){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#050818');g.addColorStop(.45,'#0b1233');g.addColorStop(1,'#1f2f78');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  stars.forEach(([a,b,k],i)=>{ctx.globalAlpha=.4+.6*Math.abs(Math.sin(t*1.3+i));ctx.fillStyle='#fff3c4';const s=k?2:3;ctx.fillRect(Math.round(a*W),Math.round(b*H),s,s)});ctx.globalAlpha=1;
  ctx.fillStyle='#fff3c4';ctx.shadowColor='rgba(255,243,196,.6)';ctx.shadowBlur=22;ctx.beginPath();ctx.arc(W*.84,u*2.2,u*.9,0,7);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#10163f';ctx.beginPath();ctx.arc(W*.84+u*.35,u*2.05,u*.8,0,7);ctx.fill();
  ctx.fillStyle='#1a2260';poly([[0,H*.55],[W*.12,H*.4],[W*.24,H*.5],[W*.4,H*.3],[W*.55,H*.46],[W*.7,H*.36],[W*.86,H*.5],[W,H*.42],[W,H],[0,H]],'#141b52');
  poly([[0,H*.7],[W*.18,H*.55],[W*.34,H*.66],[W*.52,H*.5],[W*.7,H*.64],[W*.9,H*.54],[W,H*.62],[W,H],[0,H]],'#0e1440')}
 function island(){const T=u*.9,A=I(0,N,0),B=I(N,N,0),C=I(N,0,0),Dd=I(0,0,0);
  poly([[A[0],A[1]+T*2.2],[B[0],B[1]+T*2.9],[C[0],C[1]+T*2.2],[C[0],C[1]+T],[B[0],B[1]+T],[A[0],A[1]+T]],'#241408');
  poly([[A[0],A[1]],[B[0],B[1]],[B[0],B[1]+T],[A[0],A[1]+T]],'#4a2c16');poly([[B[0],B[1]],[C[0],C[1]],[C[0],C[1]+T],[B[0],B[1]+T]],'#33200f');
  ctx.fillStyle='#5f3d1f';for(let i=1;i<6;i++){const k=i/6;ctx.fillRect(A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k+T*.35,u*.5,2)}
  for(let gx=0;gx<N;gx++)for(let gy=0;gy<N;gy++){const d=Math.hypot(gx+.5-CX,gy+.5-CY),dirt=d<1.7,chk=(gx+gy)&1;
   poly([I(gx,gy,0),I(gx+1,gy,0),I(gx+1,gy+1,0),I(gx,gy+1,0)],dirt?(chk?'#5a3a22':'#63402a'):(chk?'#1f4a2c':'#255a34'),'rgba(255,255,255,.035)')}
  poly([Dd,C,B,A],null,'rgba(255,255,255,.08)')}
 function box(x,y,w,d,h,top,l,r){poly([I(x,y,h),I(x+w,y,h),I(x+w,y+d,h),I(x,y+d,h)],top);poly([I(x,y+d,0),I(x+w,y+d,0),I(x+w,y+d,h),I(x,y+d,h)],l);poly([I(x+w,y,0),I(x+w,y+d,0),I(x+w,y+d,h),I(x+w,y,h)],r)}
 function stump(x,y){const c=I(x,y,0);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(c[0]+3,c[1]+3,u*.62,u*.32,0,0,7);ctx.fill();const h=u*.55;ctx.fillStyle='#6a4020';ctx.fillRect(c[0]-u*.5,c[1]-h,u,h);ctx.beginPath();ctx.ellipse(c[0],c[1],u*.5,u*.25,0,0,7);ctx.fill();ctx.fillStyle='#8a5a30';ctx.beginPath();ctx.ellipse(c[0],c[1]-h,u*.5,u*.25,0,0,7);ctx.fill();ctx.strokeStyle='#5a3414';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(c[0],c[1]-h,u*.28,u*.14,0,0,7);ctx.stroke()}
 function tree(x,y,s){const c=I(x,y,0),w=u*.95*s,h=u*1.1*s;ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(c[0]+4,c[1]+2,w*.7,w*.3,0,0,7);ctx.fill();ctx.fillStyle='#4a2c14';ctx.fillRect(c[0]-u*.12,c[1]-u*.5*s,u*.24,u*.5*s);
  for(let i=0;i<3;i++){const by=c[1]-u*.4*s-i*h*.62,ww=w*(1-i*.24);poly([[c[0]-ww,by],[c[0],by-h],[c[0]+ww,by]],i%2?'#1d5a34':'#17482a');poly([[c[0],by-h],[c[0]+ww,by],[c[0]+ww*.1,by]],'rgba(255,170,80,.10)')}}
 function tent(){const x0=.5,y0=.7,w=2.2,d=1.9,hz=u*2.1,ym=y0+d/2;
  poly([I(x0,y0+d,0),I(x0+w,y0+d,0),I(x0+w,ym,hz),I(x0,ym,hz)],'#c8434a');poly([I(x0+w,y0,0),I(x0+w,y0+d,0),I(x0+w,ym,hz)],'#e8767c');
  poly([I(x0+w,ym-.3,0),I(x0+w,ym+.3,0),I(x0+w,ym,hz*.62)],'#1a0e08');ctx.strokeStyle='#8e1b22';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...I(x0,y0+d,0));ctx.lineTo(...I(x0,ym,hz));ctx.stroke()}
 function board(t){const{x0,x1,y}=BOARD,zb=u*.9,zt=u*2.7,q=(a,b,z)=>I(x0+(x1-x0)*a,y,zb+(zt-zb)*b);
  box(x0-.1,y-.1,.18,.18,zt+u*.4,'#8a5a30','#5a3414','#3d2410');box(x1-.08,y-.1,.18,.18,zt+u*.4,'#8a5a30','#5a3414','#3d2410');
  poly([q(0,0),q(1,0),q(1,1),q(0,1)],'#7a4a24','#3d2410');
  const cols=['#c8434a','#e8b83a','#3f8fe0','#8a62d6'];for(let r=0;r<2;r++)for(let c=0;c<4;c++){const a=.07+c*.235,b=.1+r*.46;poly([q(a,b),q(a+.2,b),q(a+.2,b+.38),q(a,b+.38)],cols[(c+r*2)%4],'#05081c')}
  const m=I((x0+x1)/2,y,zt+u*.95);ctx.fillStyle='#fff3c4';ctx.strokeStyle='#05081c';ctx.lineWidth=2;const tw=u*3.2;ctx.fillRect(m[0]-tw/2,m[1]-u*.3,tw,u*.6);ctx.strokeRect(m[0]-tw/2,m[1]-u*.3,tw,u*.6);ctx.fillStyle='#1a1206';ctx.font=`${Math.max(7,Math.round(u*.4))}px "Press Start 2P",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('GIOCHI',m[0],m[1]+1);
  if(hint){const b=Math.sin(t*5)*3;ctx.fillStyle='#ffe83d';ctx.strokeStyle='#05081c';poly([[m[0]-7,m[1]-u*.95+b],[m[0]+7,m[1]-u*.95+b],[m[0],m[1]-u*.55+b]],'#ffe83d','#05081c')}}
 function fire(t){const c=I(CX,CY,0);ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(c[0],c[1]+2,u*1.2,u*.6,0,0,7);ctx.fill();
  ctx.fillStyle='#4a2c14';ctx.save();ctx.translate(c[0],c[1]-3);ctx.rotate(.45);ctx.fillRect(-u*.9,-3,u*1.8,7);ctx.rotate(-.9);ctx.fillRect(-u*.9,-3,u*1.8,7);ctx.restore();
  const L=[['#d8402f',1],['#e8742c',.78],['#ffd36a',.52],['#fff3c4',.28]];L.forEach(([col,k],i)=>{const w=u*.62*k+1,h=u*1.7*k*(1+.14*Math.sin(t*9+i*2)),j=Math.sin(t*7+i)*u*.07;
   poly([[c[0]-w,c[1]-3],[c[0]-w*.7+j,c[1]-h*.5],[c[0]-w*.35,c[1]-h*.42],[c[0]+j,c[1]-h-3],[c[0]+w*.3,c[1]-h*.45],[c[0]+w*.7+j,c[1]-h*.55],[c[0]+w,c[1]-3]],col)})}
 function hero(p,t){const o=p.idx%PAL.length,pal=PAL[o],ps=u/8.6,gx=X(p.x,p.y),gy=Y(p.x,p.y,0),mv=p.tx!=null,ph=mv?Math.sin(t*14+p.ph):0,bob=mv?Math.abs(ph)*ps*1.2:Math.sin(t*2+p.ph)*ps*.35;
  const x0=gx-8*ps,y0=gy-18*ps-bob+ps*.6,ol=Math.max(1,ps*.9);const col=k=>typeof k==='number'?pal[k]:FIX[k];
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(gx,gy,u*.5,u*.22,0,0,7);ctx.fill();
  if(p.id===ctl){ctx.strokeStyle='#ffe83d';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(gx,gy,u*.7,u*.32,0,0,7);ctx.stroke()}
  const legs=[[5,14,3,3],[8,14,3,3]],boots=[[4,17,4,1],[8,17,4,1]];const lo=[mv&&ph>0?-1:0,mv&&ph<0?-1:0];
  const all=[...SPR.map(r=>[r[0],r[1],r[2],r[3],col(r[4])]),...legs.map((r,i)=>[r[0],r[1]+lo[i],r[2],r[3],'#3a2f6b']),...boots.map((r,i)=>[r[0],r[1]+lo[i],r[2],r[3],'#4a2c14'])];
  ctx.fillStyle='#05081c';all.forEach(r=>ctx.fillRect(x0+r[0]*ps-ol,y0+r[1]*ps-ol,r[2]*ps+ol*2,r[3]*ps+ol*2));all.forEach(r=>{ctx.fillStyle=r[4];ctx.fillRect(x0+r[0]*ps,y0+r[1]*ps,r[2]*ps,r[3]*ps)});
  const fs=Math.max(7,Math.round(u*.4));ctx.font=`${fs}px "Press Start 2P",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';const nm=p.name.length>8?p.name.slice(0,7)+'…':p.name,tw=ctx.measureText(nm).width+8,ty=y0-fs*.9;
  ctx.fillStyle=p.own&&!p.guest?'#ffb347':'#fff3c4';ctx.strokeStyle='#05081c';ctx.lineWidth=2;if(p.guest)ctx.setLineDash([3,2]);ctx.fillRect(gx-tw/2,ty-fs*.7,tw,fs*1.4);ctx.strokeRect(gx-tw/2,ty-fs*.7,tw,fs*1.4);ctx.setLineDash([]);ctx.fillStyle='#1a1206';ctx.fillText(nm,gx,ty+1);
  if(p.say){const age=Date.now()-p.say.t;if(age<7000&&age>-3000){const bf=Math.max(7,Math.round(u*.38));ctx.font=`${bf}px "Silkscreen",monospace`;const bw=ctx.measureText(p.say.text).width+10,by=ty-fs*2.1-(p.em?u*1.2:0);ctx.fillStyle='#fff';ctx.strokeStyle='#05081c';ctx.lineWidth=2;ctx.fillRect(gx-bw/2,by-bf,bw,bf*1.7);ctx.strokeRect(gx-bw/2,by-bf,bw,bf*1.7);ctx.fillStyle='#1a1206';ctx.fillText(p.say.text,gx,by-bf*.1)}}
  if(p.em){const a=(performance.now()-p.em.t)/2400;if(a>=1)p.em=null;else{const k=a<.12?a/.12:1,fy=a*u*.9;ctx.globalAlpha=a>.75?(1-a)*4:1;ctx.font=`${Math.round(u*1.15*(.6+.4*k))}px sans-serif`;ctx.fillText(p.em.s,gx,ty-fs*1.4-fy);ctx.globalAlpha=1}}}
 function glow(t,k){const c=I(CX,CY,u*.4),f=.85+.15*Math.sin(t*11)+.08*Math.sin(t*23);const g=ctx.createRadialGradient(c[0],c[1],0,c[0],c[1],u*6.5);g.addColorStop(0,`rgba(255,170,70,${.42*f*k})`);g.addColorStop(.5,`rgba(255,120,40,${.16*f*k})`);g.addColorStop(1,'rgba(255,120,40,0)');ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over'}
 function frame(now){if(dead)return;raf=requestAnimationFrame(frame);if(!cv.isConnected||document.hidden){last=now;return}
  const dt=Math.min(.05,(now-last)/1000),t=(now-t0)/1000;last=now;
  P.forEach(p=>{if(!p.own&&!p.sync&&p.tx==null&&!o.noAi){p.wait-=dt;if(p.wait<=0){const a=rnd(0,7),r=rnd(1.8,3.4);walk(p,CX+r*Math.cos(a),CY+r*Math.sin(a));p.wait=rnd(2.5,7);if(Math.random()<.35)emote(p.id,EMO[(Math.random()*EMO.length)|0])}}
   if(p.tx!=null){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=SPEED*dt;if(d<=st){p.x=p.tx;p.y=p.ty;p.tx=p.ty=null;if(p.own&&o.onMove)o.onMove(p.id,p.x,p.y);if(p.after){const f=p.after;p.after=null;f()}}else{p.x+=dx/d*st;p.y+=dy/d*st}}
   const fx=p.x-CX,fy=p.y-CY,fd=Math.hypot(fx,fy);if(fd<FIRE_R){p.x=CX+fx/(fd||1)*FIRE_R;p.y=CY+fy/(fd||1)*FIRE_R}});
  if(Math.random()<dt*14)sparks.push({x:rnd(-.2,.2),y:rnd(-.2,.2),z:u*.8,vx:rnd(-8,8),vz:rnd(30,60),l:1});sparks=sparks.filter(s=>(s.l-=dt*.8)>0);sparks.forEach(s=>{s.z+=s.vz*dt;s.x+=s.vx*dt*.02});
  ctx.setTransform(dpr,0,0,dpr,0,0);sky(t);island();glow(t,1);
  const D=[];STUMPS.forEach(([x,y])=>D.push([x+y,()=>stump(x,y)]));TREES.forEach(([x,y,s])=>D.push([x+y,()=>tree(x,y,s)]));D.push([2.4,tent]);D.push([BOARD.y*2+3,()=>board(t)]);D.push([CX+CY,()=>fire(t)]);P.forEach(p=>D.push([p.x+p.y+.01,()=>hero(p,t)]));
  D.sort((a,b)=>a[0]-b[0]).forEach(d=>d[1]());
  glow(t,.35);const fc=I(CX,CY,0);sparks.forEach(s=>{ctx.globalAlpha=Math.min(1,s.l);ctx.fillStyle='#ffcf5a';ctx.fillRect(fc[0]+s.x*u*3,fc[1]-s.z,3,3)});ctx.globalAlpha=1}
 /* ---- tocchi ---- */
 function pick(e){const r=cv.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top,a=(sx-cx)/u,b=(sy-oy)/hh,gx=(a+b)/2,gy=(b-a)/2;return{sx,sy,gx,gy}}
 cv.addEventListener('pointerdown',e=>{e.preventDefault();const{sx,sy,gx,gy}=pick(e),me=P.find(p=>p.id===ctl);hint=false;
  const hp=[...P].sort((a,b)=>b.x+b.y-a.x-a.y).find(p=>Math.abs(sx-X(p.x,p.y))<u*.75&&sy<Y(p.x,p.y,0)+u*.3&&sy>Y(p.x,p.y,0)-u*3);
  if(hp){if(hp.own){ctl=hp.id;if(o.onSelect)o.onSelect(ctl);return}if(me){const dx=me.x-hp.x,dy=me.y-hp.y,d=Math.hypot(dx,dy)||1;walk(me,hp.x+dx/d*1.1,hp.y+dy/d*1.1);me.after=()=>emote(me.id,'👋')}return}
  const bx=I(BOARD.x0,BOARD.y,0),bx2=I(BOARD.x1,BOARD.y,0);if(sx>bx[0]-u&&sx<bx2[0]+u&&sy>Y(BOARD.x0,BOARD.y,u*3.6)&&sy<Y(BOARD.x0,BOARD.y,0)+u*.5){if(o.onShelf)o.onShelf();return}
  if(Math.hypot(gx-CX,gy-CY)<FIRE_R+.15&&me){const d=Math.hypot(me.x-CX,me.y-CY)||1;walk(me,CX+(me.x-CX)/d*1.35,CY+(me.y-CY)/d*1.35);me.after=()=>emote(me.id,'🍡');return}
  if(me&&gx>0&&gx<N&&gy>0&&gy<N)walk(me,gx,gy)});
 bar.addEventListener('click',e=>{const b=e.target.closest('[data-e]');if(b&&ctl)emote(ctl,b.dataset.e)});
 const onR=()=>size();window.addEventListener('resize',onR);
 function destroy(){dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onR)}
 size();setPlayers(o.players||[]);raf=requestAnimationFrame(frame);
 return{setPlayers,setRemote,emote,say,destroy,resize:size,get ctl(){return ctl},select(id){ctl=id}}}
return{create}})();

let tvHi=0,tvSeats=[],isoC=null,isoEl=null,isoSaveT=0;const isoSeen={};
const isoSave=()=>{clearTimeout(isoSaveT);isoSaveT=setTimeout(()=>{saveMine()},400)};
function tvSceneIso(S){tvSeats=S;const N=S.length;
 return`<div class="tvscene2" role="group" aria-label="Il falò con ${N} giocator${N===1?'e':'i'}: tocca per muoverti">
 <div class="tvplq">${R.on?`<span>STANZA</span><b>${isGen()?'GENERALE':esc(R.code||'…')}</b><button class="tvcp" data-a="copy">COPIA</button>`:`<span>SU QUESTO TELEFONO</span>`}</div>
 <div id="isohost"></div>${emoBar()}</div>`}
/* collega il diorama persistente (non si ricrea a ogni render) e sincronizza posizioni, emote e chat */
function tvIso(){const h=document.getElementById('isohost');if(!h)return;
 if(!isoEl){isoEl=document.createElement('div');isoEl.className='isoel';
  isoC=ISO.create(isoEl,{players:[],bar:false,
   onShelf(){const e=$('.tvshelf');if(e)e.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'})},
   onSelect(id){ui.ek=id.split('|')[1]},
   onMove(id,x,y){if(ui.screen==='room'&&id===ME.dev+'|m'){R.mine.pos={x:+x.toFixed(2),y:+y.toFixed(2),t:Date.now()};isoSave()}},
   onEmote(id,e){const[d,k]=id.split('|');if(ui.screen!=='room'||d!==ME.dev)return;const t=Date.now();isoSeen['e'+id]=t;(R.mine.emo=R.mine.emo||{})[k]={e,t};isoSave()}})}
 h.appendChild(isoEl);isoC.resize();
 const S=tvSeats,now=Date.now();
 isoC.setPlayers(S.map(s=>{const m=members().find(x=>x.id===s.dev);return{id:s.dev+'|'+s.k,name:s.name,own:s.dev===ME.dev,guest:s.k!=='m',sync:!!(m&&m.pos&&s.k==='m'&&s.dev!==ME.dev)}}));
 S.forEach(s=>{const id=s.dev+'|'+s.k,m=members().find(x=>x.id===s.dev);if(!m)return;
  const em=m.emo&&m.emo[s.k];if(em&&isoSeen['e'+id]!==em.t){isoSeen['e'+id]=em.t;if(now-em.t<5000&&now-em.t>-3000)isoC.emote(id,em.e,true)}
  if(s.k==='m'&&s.dev!==ME.dev&&m.pos&&isoSeen['p'+id]!==m.pos.t){isoSeen['p'+id]=m.pos.t;isoC.setRemote(id,m.pos.x,m.pos.y)}});
 for(let i=R.chat.length-1;i>=0&&i>R.chat.length-8;i--){const x=R.chat[i];if(now-x.t>7000)break;isoC.say(x.dev+'|'+(x.k||'m'),x.text,x.t)}
 if(ui.screen==='name'&&!tvHi){tvHi=1;setTimeout(()=>isoC&&isoC.emote(ME.dev+'|m','👋',true),600)}}
const tvNameIso=()=>{tvSeats=[{dev:ME.dev,k:'m',name:ME.name||'Tu'}];return`<div class="tvscene2 namesc" role="group" aria-label="Il tuo omino al falò"><div id="isohost"></div></div>`};
document.addEventListener('input',e=>{if(e.target.id==='myname'&&tvSeats[0]&&ui.lobby!=='hall'){tvSeats[0].name=e.target.value.trim().slice(0,14)||'Tu';tvIso()}});
document.addEventListener('change',e=>{if(e.target.id==='lb'){ui.lobby=['hall','iso','3d'].includes(e.target.value)?e.target.value:'3d';ST('rg-lb',ui.lobby);render()}});
