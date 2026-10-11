/* ---- effetti: particelle, testi, animazioni ---- */
const PF={c:null,x:null,ps:[],run:false};
function pinit(){if(PF.c)return;const c=document.createElement('canvas');c.id='pfx';document.body.appendChild(c);PF.c=c;PF.x=c.getContext('2d');const rs=()=>{const d=Math.min(2,devicePixelRatio||1);c.width=innerWidth*d;c.height=innerHeight*d;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';PF.x.setTransform(d,0,0,d,0,0)};rs();addEventListener('resize',rs)}
function burst(x,y,col,n=24,o={}){if(RM||SP<.2)return;pinit();for(let i=0;i<n;i++){const a=o.ang!=null?o.ang+(Math.random()-.5)*(o.spread??1):Math.random()*6.283,v=(o.v||5)*(.4+Math.random());PF.ps.push({x:x+(Math.random()-.5)*(o.jx||0),y:y+(Math.random()-.5)*(o.jy||0),vx:Math.cos(a)*v,vy:Math.sin(a)*v-(o.up||0),g:o.g??.15,life:1,dec:(o.dec||.016)*(.6+Math.random()*.8),r:(o.r||3)*(.5+Math.random()),col:Array.isArray(col)?col[i%col.length]:col,sq:o.sq,tx:o.tx,ty:o.ty})}if(!PF.run){PF.run=true;requestAnimationFrame(ptick)}}
function ptick(){const X=PF.x;X.clearRect(0,0,innerWidth,innerHeight);PF.ps=PF.ps.filter(p=>p.life>0);X.globalCompositeOperation=theme==='carta'?'source-over':'lighter';
 for(const p of PF.ps){if(p.tx!=null){p.vx+=(p.tx-p.x)*.02;p.vy+=(p.ty-p.y)*.02;p.vx*=.88;p.vy*=.88}else{p.vy+=p.g;p.vx*=.98}p.x+=p.vx;p.y+=p.vy;p.life-=p.dec;X.globalAlpha=Math.max(0,p.life);X.fillStyle=p.col;
  if(p.sq){X.save();X.translate(p.x,p.y);X.rotate(p.life*9);X.fillRect(-p.r,-p.r/2,p.r*2,p.r);X.restore()}else{X.beginPath();X.arc(p.x,p.y,p.r,0,7);X.fill()}}
 X.globalAlpha=1;X.globalCompositeOperation='source-over';if(PF.ps.length)requestAnimationFrame(ptick);else{PF.run=false;X.clearRect(0,0,innerWidth,innerHeight)}}
function ctr(sel){const e=typeof sel==='string'?document.querySelector(sel):sel;if(!e)return{x:innerWidth/2,y:innerHeight/2,r:null};const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,r}}
function add(html,cls,x,y,ms){const d=document.createElement('div');d.className=cls;if(html!=null)d.innerHTML=html;if(x!=null){d.style.left=x+'px';d.style.top=y+'px'}$('#fx').appendChild(d);setTimeout(()=>d.remove(),ms);return d}
function say(t,ms=2200){const el=document.createElement('div');el.textContent=t;const T=$('#toast');T.replaceChildren(el);clearTimeout(say.t);say.t=setTimeout(()=>{if(T.firstChild===el)el.remove()},ms)}
function flt(sel,text,cls,dx=0,dy=0){const c=ctr(sel);const d=add(null,'fl '+cls,Math.min(innerWidth-50,Math.max(50,c.x+dx)),c.y+dy,1600);d.textContent=text}
function speech(text){const c=ctr('#boss');if(!c.r)return;const d=add(null,'speech',Math.min(innerWidth-120,Math.max(120,c.x)),c.r.top-6,2300);d.textContent=text}
function bump(sel,cls,ms=600){const e=typeof sel==='string'?document.querySelector(sel):sel;if(!e||RM)return;e.classList.remove(cls);void e.offsetWidth;e.classList.add(cls);setTimeout(()=>e.classList.remove(cls),ms)}
function shake(power=10){const a=$('#app');if(!a||RM||!a.animate)return;a.animate([{transform:'none'},{transform:`translate(${-power}px,${power/3}px)`},{transform:`translate(${power}px,${-power/3}px)`},{transform:`translate(${-power/2}px,0)`},{transform:'none'}],{duration:420})}
function banner(t,sub,cls=''){add(`<b>${esc(t)}</b>${sub?`<small>${esc(sub)}</small>`:''}`,'banner '+cls,null,null,1700)}
function confetti(){const cs=['#f7c948','#e84a3d','#2f8be6','#35b866','#fff'];for(let i=0;i<80;i++){const d=add(null,'conf',null,null,4800);d.style.left=Math.random()*100+'vw';d.style.background=cs[i%5];d.style.animationDuration=1.8+Math.random()*2+'s';d.style.animationDelay=Math.random()*.9+'s'}}
const SUITC={H:['#ff4a5a','#ff9aa4','#fff'],D:['#ffc93c','#fff1a0','#ff9a1e'],C:['#5be08a','#c8ffd8','#1fa04a'],S:['#8a9bff','#d6dcff','#5a3bd6'],X:['#ffd34d','#ff6ad5','#5cf0ff']};
/* le carte giocate volano dalla mano (o dall'avatar di chi gioca) fino al nemico */
let cap=null;
function captureSel(){cap=[...document.querySelectorAll('.slot.sel .card')].map(c=>({id:c.dataset.v,r:c.getBoundingClientRect()}))}
async function flyCards(items,target,{dur=520,rot=0,scale=.55,fade=true}={},rend=cardH){
 if(RM||!items.length){return}const T=ctr(target);
 await Promise.all(items.map((it,i)=>{const d=document.createElement('div');d.innerHTML=rend(it.id);const c=d.firstElementChild;const r=it.r;
  c.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;--cw:${r.width}px;z-index:78;margin:0`;$('#fx').appendChild(c);
  const dx=T.x-(r.left+r.width/2)+(i-(items.length-1)/2)*22,dy=T.y-(r.top+r.height/2);
  const a=c.animate([{transform:'translate(0,0) rotate(0) scale(1)'},{transform:`translate(${dx*.35}px,${dy*.35-50}px) rotate(${-12+i*8}deg) scale(1.25)`,offset:.4},{transform:`translate(${dx}px,${dy}px) rotate(${rot+i*10}deg) scale(${scale})`,opacity:fade?.2:1}],{duration:dur*SP,delay:i*70*SP,easing:'cubic-bezier(.55,0,.75,.4)',fill:'forwards'});
  return a.finished.then(()=>c.remove(),()=>c.remove())}))}
function avatarItems(p,cards){const a=document.getElementById('av'+p);const r=a?a.getBoundingClientRect():{left:innerWidth/2-20,top:innerHeight-120,width:40,height:56};return cards.map(id=>({id,r:{left:r.left,top:r.top,width:40,height:56}}))}
/* splash del nemico in arrivo, stile duello */
function splash(c,first){const rk=P(c).r,s=P(c).s,[a1,a2]=ACTS[rk],act=first||'JQK'.indexOf(rk)>0&&prevRank!==rk;prevRank=rk;
 add(`${act?`<div class="act">${a1}<b>${a2}</b></div>`:''}<div class="vs" style="--glow:${SUITC[s][0]}">${cardH(c,{boss:1,cls:'holo'})}</div><h2>${RN[rk]} di ${SN[s]}</h2><em>${esc(TITLES[c])}</em><q>${esc(QUOTES[c])}</q>`,'splash',null,null,2800*Math.max(SP,.05));
 Snd.play('enemy');setTimeout(()=>{const c2=ctr('.splash .vs');burst(c2.x,c2.y,SUITC[s],40,{v:7,g:.05,dec:.02})},250*SP)}
let prevRank=null;
async function runFx(ev,own){const nm=i=>G.names[i]??'',B='#boss';let killed=null;
 for(const e of ev){const T=e.t;
  if(T==='play'){if(e.c[0][0]==='X'){}else say(nm(e.p)+' gioca '+e.c.map(RG.fmt).join(' + '),2200)}
  else if(T==='imm'){const c=ctr(B);flt(B,'IMMUNE '+SYM[e.s],'gry',0,-30);burst(c.x,c.y,['#999','#ccc'],14,{v:3});Snd.play('immune');await W(380)}
  else if(T==='heal'){const a=ctr('#pdisc'),b=ctr('#ptav');burst(a.x,a.y,SUITC.H,26,{v:3,tx:b.x,ty:b.y,dec:.012});flt('#ptav','+'+e.v+' ♥','grn');Snd.play('heal');await W(450)}
  else if(T==='draw'){Snd.play('draw');flt('#hand','+'+e.v+' carte','gold',0,-40);await W(420)}
  else if(T==='hit'){const c=ctr(B);bump(B,'hitfx');shake(e.v>15?14:8);Snd.play('impact');burst(c.x,c.y,['#fff','#ffd34d','#ff6a3d'],30+Math.min(40,e.v*2),{v:6+e.v/6,g:.12,sq:true});add(null,'flash w',null,null,600);
   if(e.x2){const d=add('×2','x2',c.x+50,c.y-40,900);Snd.play('slash')}
   flt(B,'−'+e.v,'red',0,-10);bump('#ghp','bump');if(Math.random()<.5)speech(pick(HURT));await W(560)}
  else if(T==='shield'){const c=ctr(B);add(null,'ring',c.x,c.y,900);Snd.play('shield');flt('#gatk','−'+e.v,'blu',0,-30);bump('#gatk','bump');await W(450)}
  else if(T==='kill'){killed=e;const c=ctr(B);Snd.play(e.exact?'redeem':'kill');burst(c.x,c.y,e.exact?['#fff','#ffe9a0','#a0e8ff']:SUITC[P(e.c).s].concat(['#fff']),90,{v:9,g:.18,sq:true,dec:.012});add(null,'flash w',null,null,600);shake(16);
   banner(e.exact?'REDENTO!':'SCONFITTO!',e.exact?RN[P(e.c).r]+' di '+SN[P(e.c).s]+' si unisce alla Taverna':TITLES[e.c]+' è caduto');await W(1300);ui.viewEn=null;render()}
  else if(T==='next'){await W(150);splash(e.c);await W(2300)}
  else if(T==='atk'){const b=$(B);if(b&&b.animate&&!RM)b.animate([{transform:'none'},{transform:'translateY(-14px) scale(1.05)',offset:.3},{transform:'translateY(70px) scale(1.12)',offset:.55},{transform:'none'}],{duration:620*SP,easing:'ease-in-out'});
   speech(pick(TAUNT));await W(330);Snd.play('atk');add('<i></i><i></i><i></i>','claw',null,null,700);add(null,'flash',null,null,600);shake(14);const h=ctr('#hand');burst(h.x,h.y-20,['#ff3b2f','#ff9a6a','#fff'],40,{v:7,ang:-1.57,spread:2.4});flt('#hand','⚔ −'+e.v,'red',0,-50);await W(500)}
  else if(T==='block'){const c=ctr(B);add(null,'ring',c.x,c.y,900);flt(B,'BLOCCATO','blu');Snd.play('shield');await W(400)}
  else if(T==='disc'){Snd.play('deal');await W(150)}
  else if(T==='jester'){const c=ctr(B);burst(c.x,c.y,SUITC.X,60,{v:8,g:.05});banner('JOLLY!','L’immunità del nemico è annullata');Snd.play('redeem');await W(900)}
  else if(T==='flip'){const h=ctr('#hand');burst(h.x,h.y,SUITC.X,50,{v:7,g:.1});banner('NUOVA MANO','Il Jolly rimescola la sorte');Snd.play('draw');await W(700)}
  else if(T==='yield'){flt('#av'+e.p,'cede','gry');await W(250)}
  else if(T==='turn'){if(!G.over&&G.n>1){if(isMine(e.p)&&!multiLocal()&&R.on){banner('IL TUO TURNO','');Snd.play('turn')}else if(!isMine(e.p))say('Tocca a '+nm(e.p),1600)}}
  else if(T==='win'){Snd.play('win');confetti();const c=ctr(B);burst(c.x,c.y,['#ffe9a0','#fff','#ffd34d'],120,{v:10,g:.1,sq:true})}
  else if(T==='lose'){Snd.play('lose');shake(18)}}}
/* coda degli stati: prima le carte volano, poi lo stato cambia, poi gli effetti */
