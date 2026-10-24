/* ---- Lobby: falò + scaffale ---- */
const TVC={classici:{f:'#c8434a',s:'#8e1b22',e:'#e8767c',n:'CLASSICI'},strategia:{f:'#e8b83a',s:'#a67d12',e:'#fff0a0',n:'STRATEGIA'},squadra:{f:'#3f8fe0',s:'#1d5aa0',e:'#7ab8f0',n:'COOPERATIVI'}};
const TVG={giallo:['squadra','DELITTO'],fantasma:['squadra', 'FANTASMA'],zucca:['squadra', 'ZUCCA'],quiz:['classici', 'QUIZ'],spie:['squadra', 'AGENTI'],briscola:['classici','BRISCOLA'],scopa:['classici','SCOPA'],burraco:['classici','BURRACO'],machiavelli:['classici','MACHIAVELLI'],uno:['classici','UNO'],perudo:['classici','PERUDO'],catan:['strategia','CATAN'],azul:['strategia','AZUL'],valle:['strategia','VALLE'],harvest:['strategia','HARVEST'],discesa:['strategia','DISCESA'],regicide:['strategia','REGICIDE'],island:['strategia','ISOLA'],scoundrel:['strategia','SCOUNDREL'],gang:['squadra','THE GANG'],mind:['squadra','THE MIND'],mindx:['squadra','MIND EXTREME'],saboteur:['squadra','SABOTEUR'],kittens:['squadra','KITTENS'],pets:['squadra','PETS'],trono:['squadra','TRONO']};
const tvInfo=g=>TVG[g.id]||['strategia',g.name.toUpperCase().slice(0,11)];
/* Scatole in proporzioni reali (misure approssimate in mm: altezza in piedi, spessore, larghezza del fronte).
   k: deck = astuccio di carte con linguetta, box = scatola con coperchio, wallet = bustina, flat = scatola grande coricata.
   Colori che richiamano le confezioni originali, ma titoli e grafica restano nostri (niente copertine né loghi). */
const TVB={giallo:{mm:[300,60],k:'flat',c:['#5a1a1e','#240709','#e2c27a']},fantasma:{mm:[300,70],k:'flat',c:['#3a2a6a','#150e2c','#d9b84a']},zucca:{mm:[270,65],k:'flat',c:['#e87a1f','#8a3a08','#3aa05a']},quiz:{mm:[300,60],k:'flat',c:['#2a62b0','#112a55','#f2b81c']},spie:{mm:[100,42],k:'box',c:['#1b1b24','#08080c','#d8342c']},trono:{mm:[95,45],k:'deck',c:['#8e2a6b','#3a1030','#f2c230']},uno:{mm:[95,60],k:'deck',c:['#d8342c','#7a1712','#f2b81c']},pets:{mm:[95,38],k:'deck',c:['#a8355a','#5a1730','#f2c230']},catan:{mm:[300,70],k:'flat',c:['#2f7a3c','#164029','#e7c445']},kittens:{mm:[95,38],k:'deck',c:['#f26b21','#8a2f08','#1c1c24']},perudo:{mm:[118,62],k:'box',c:['#8a5a2a','#4a2e12','#f2c230']},regicide:{mm:[98,38],k:'deck',c:['#6e1420','#3a0a10','#e2b13c']},briscola:{mm:[95,20],k:'deck',c:['#f1ebdd','#b9ad94','#c8262f'],ink:'#8e1b22'},scopa:{mm:[95,20],k:'deck',c:['#c8262f','#7a121a','#f1ebdd']},
 burraco:{mm:[98,42],k:'deck',c:['#1d4f9a','#0e2a55','#f1ebdd']},machiavelli:{mm:[98,42],k:'deck',c:['#2f7a4a','#164029','#f1ebdd']},gang:{mm:[125,40],k:'box',c:['#1c1c24','#09090d','#d8402f']},
 saboteur:{mm:[126,28],k:'box',c:['#8a4a1a','#4a240a','#f2c230']},mind:{mm:[112,22],k:'box',c:['#2a4fa8','#122660','#9fd2ff']},mindx:{mm:[112,22],k:'box',c:['#a8261c','#5a0e08','#ffb347']},
 harvest:{mm:[150,42],k:'box',c:['#6aa33a','#35601a','#f2c230']},azul:{mm:[265,80],k:'flat',c:['#f3efe6','#b9b2a2','#2c5fb0'],ink:'#1d3f7a'},valle:{mm:[254,70],k:'flat',c:['#2f7a6a','#163f36','#e0c95a']},
 island:{mm:[128,12],k:'wallet',c:['#3aa39a','#1d5c56','#f2c230']},scoundrel:{mm:[92,22],k:'deck',c:['#2a2a30','#101014','#c8262f']},discesa:{mm:[118,25],k:'box',c:['#4d3490','#24164a','#f2c230']}};
const TVPX=.85;
const TVP=[['#c8262f','#8e1b22','#2f8a5b','#1f6a43'],['#2c7fd6','#123f7a','#e2b13c','#a67d12'],['#7d55c7','#40287a','#d8402f','#8e1b22'],['#e8742c','#9a4a12','#3f8fe0','#1d5aa0'],['#2fa65b','#17603a','#c8434a','#8e1b22'],['#e8b83a','#a67d12','#7d55c7','#40287a'],['#d85a9a','#8a2a5a','#2f8a5b','#1f6a43'],['#5cc8d8','#1d6a7a','#e8742c','#9a4a12']];
const tvExt=c=>{let a=[];for(let i=1;i<=6;i++)a.push(i+'px -'+i+'px 0 '+c);a.push('12px 5px 12px rgba(0,0,0,.55)');return a.join(',')};
const AVC=[['#c8262f','#8e1b22'],['#2c7fd6','#123f7a'],['#2fa65b','#17603a'],['#7d55c7','#40287a'],['#e8742c','#9a4a12'],['#e8b83a','#a67d12'],['#d85a9a','#8a2a5a'],['#5cc8d8','#1d6a7a'],['#3a3a44','#1a1a22'],['#f3efe6','#a8a090']];
const AVS=['#f2c29b','#d9a074','#a8693e','#6b4226'],AVT=['Berretto','Corona','Cappuccio','Elmo','Capelli','Cappello da mago'];
const avDef=i=>({t:i%6===1?4:0,h:i%8,c:(i+3)%8,s:i%4===3?2:0});
function avOf(s,i){const m=members().find(x=>x.id===s.dev);let a=null;if(m){if(s.k==='m')a=m.av;else{const g=(m.guests||[]).find(x=>x.k===s.k);a=g&&g.av}}return Object.assign(avDef(i),a||{})}
function tvSprite(av,w=44){const H=AVC[av.h%AVC.length],C=AVC[av.c%AVC.length],sk=AVS[av.s%AVS.length],R1=(x,y,ww,hh,f)=>`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${f}"/>`;
 let hat='';
 if(av.t===0)hat=R1(8,0,2,1,'#fff3c4')+R1(6,1,4,1,H[0])+R1(5,2,6,1,H[0])+R1(4,3,8,1,H[1]);
 else if(av.t===1)hat=R1(5,1,1,1,'#ffd34d')+R1(8,1,1,1,'#ffd34d')+R1(10,1,1,1,'#ffd34d')+R1(5,2,6,2,'#e9b23a')+R1(7,2,2,1,H[0]);
 else if(av.t===2)hat=R1(5,1,6,1,H[0])+R1(4,2,8,2,H[0])+R1(4,4,1,4,H[1])+R1(11,4,1,4,H[1]);
 else if(av.t===3)hat=R1(5,1,6,1,'#c9d1df')+R1(4,2,8,2,'#9aa3b5')+R1(7,4,2,2,'#9aa3b5')+R1(7,0,2,1,H[0]);
 else if(av.t===4)hat=R1(5,2,6,2,H[1])+R1(4,3,1,3,H[1])+R1(11,3,1,3,H[1]);
 else hat=R1(7,-3,2,1,H[0])+R1(6,-2,4,2,H[0])+R1(5,0,6,2,H[0])+R1(3,2,10,1,H[1])+R1(7,-1,1,1,'#ffd34d');
 return`<svg viewBox="0 -3 16 21" width="${w}" height="${Math.round(w*21/16)}" shape-rendering="crispEdges" aria-hidden="true" style="display:block;overflow:visible;filter:drop-shadow(3px 0 0 #05081c) drop-shadow(-3px 0 0 #05081c) drop-shadow(0 3px 0 #05081c) drop-shadow(0 -3px 0 #05081c)">${R1(5,4,6,3,sk)}${R1(6,7,4,1,sk)}${R1(3,12,1,1,sk)}${R1(12,12,1,1,sk)}${R1(6,5,1,1,'#1a1206')}${R1(9,5,1,1,'#1a1206')}${R1(7,6,2,1,'#b5533c')}${hat}${R1(4,8,8,3,C[0])}${R1(4,12,8,1,C[0])}${R1(3,9,1,3,C[0])}${R1(12,9,1,3,C[0])}${R1(5,13,6,1,C[1])}${R1(7,9,2,1,C[1])}${R1(4,11,8,1,'#e9c46a')}${R1(5,14,3,3,'#3a2f6b')}${R1(8,14,3,3,'#3a2f6b')}${R1(4,17,4,1,'#4a2c14')}${R1(8,17,4,1,'#4a2c14')}</svg>`}
const TVEMO=['😀','😂','😍','😎','😭','😡','👍','🎉','🍻','🔥'];
function tvBub(s){const now=Date.now();const m=members().find(x=>x.id===s.dev);const em=m&&m.emo&&m.emo[s.k];if(em&&now-em.t<5000&&now-em.t>-3000)return`<div class="tvbub e">${esc(em.e)}</div>`;
 for(let i=R.chat.length-1;i>=0;i--){const x=R.chat[i];if(now-x.t>7000)break;if(x.dev===s.dev&&(x.k||'m')===s.k)return`<div class="tvbub">${esc(x.text.length>34?x.text.slice(0,33)+'…':x.text)}</div>`}return''}

function emoBar(){if(!R.on)return'';const myKeys=[{k:'m'},...(R.mine.guests||[]).map(g=>({k:g.k}))],ek=myKeys.some(x=>x.k===ui.ek)?ui.ek:'m';
 return`<div class="emos">${TVEMO.map(e=>`<button class="emo" data-a="emo" data-v="${e}|${ek}" aria-label="Emoji ${e}">${e}</button>`).join('')}</div>`}
function chatDrawerH(){if(!R.on||!ui.cd)return'';const myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))],ek=myKeys.some(x=>x.k===ui.ek)?ui.ek:'m';
 return`<div class="cdr" role="dialog" aria-label="Chat della stanza"><div class="cdh"><b>Chat · stanza ${esc(R.code)}</b><button class="ib sm" data-a="chatd" aria-label="Chiudi chat">${ic('x',18)}</button></div><div class="chatlog" id="chatlog">${R.chat.map(x=>`<div class="cm ${x.dev===ME.dev?'me':''}"><b>${esc(x.name)}</b> ${esc(x.text)}</div>`).join('')||'<span class="muted">Nessun messaggio: scrivi il primo!</span>'}</div>
 <div class="emos cde">${TVEMO.map(e=>`<button class="emo" data-a="chatemo" data-v="${e}" aria-label="Invia ${e}">${e}</button>`).join('')}</div>
 <div class="row"><input type="text" id="cmsg" maxlength="120" placeholder="Scrivi un messaggio" value="${esc(ui.cm||'')}" autocomplete="off" style="flex:1"><button class="b sm disc" data-a="chatsend">Invia</button></div>${myKeys.length>1?`<div class="row">${myKeys.map(x=>`<button class="vote ${x.k===ek?'on':''}" data-a="ek" data-v="${x.k}">${esc(x.name)}</button>`).join('')}</div>`:''}</div>`}
function chatH(){if(!R.on)return'';const myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))],ek=myKeys.some(x=>x.k===ui.ek)?ui.ek:'m';
 return`<div class="panel col chatp"><h3>Chat della stanza</h3><div class="chatlog" id="chatlog">${R.chat.map(x=>`<div class="cm ${x.dev===ME.dev?'me':''}"><b>${esc(x.name)}</b> ${esc(x.text)}</div>`).join('')||'<span class="muted">Nessun messaggio: scrivi il primo!</span>'}</div>
 <div class="row"><input type="text" id="cmsg" maxlength="120" placeholder="Scrivi un messaggio" value="${esc(ui.cm||'')}" autocomplete="off" style="flex:1"><button class="b sm disc" data-a="chatsend">Invia</button></div>
 ${myKeys.length>1?`<div class="row">${myKeys.map(x=>`<button class="vote ${x.k===ek?'on':''}" data-a="ek" data-v="${x.k}">${esc(x.name)}</button>`).join('')}</div>`:''}
</div>`}
const SAT=new Set();
const CAM={v:0,ptr:0,tilt:0,t:0};
function tvScene(S){const N=S.length,big=true,full=N>=5,H=N>=9?390:365,ry=N>=9?78:70,cy=272,cmp=N>=8?.82:1;
 const me0=Math.max(0,S.findIndex(x=>x.dev===ME.dev&&x.k==='m')),want=full?0:Math.floor((N-1)/2),ord=S.map((_,j)=>(j-want+me0+N)%N);
 let pl=ord.map((oi,i)=>{const s=S[oi];let th;if(!full){const gap=N>1?Math.PI*.95/(N-1):0;th=Math.PI/2+(i-(N-1)/2)*gap}else th=Math.PI/2+2*Math.PI*i/N;
  const sn=Math.sin(th),x=50+(big?40:37)*Math.cos(th),y=cy+ry*sn*(sn>0?1.1:1),sc=((.66+.34*(sn+1)/2)*cmp).toFixed(2),me=s.dev===ME.dev,mine=me&&s.k==='m';
  const sk=s.dev+'|'+s.k,fresh=!SAT.has(sk);SAT.add(sk);
  return`<div class="tvp${me?' tvme':''}${fresh?' sit':''}" style="left:${x.toFixed(1)}%;top:${y.toFixed(0)}px;z-index:${Math.round(y)};--s:1;--br:${(.7+.3*(sn+1)/2).toFixed(2)};--d:${(i*.09).toFixed(2)}s" ${me?`data-a="avedit" data-v="${s.k}" role="button" tabindex="0" aria-label="Personalizza ${esc(s.name)}"`:''}>${tvBub(s)}<div class="tvtag${mine?' me':''}${s.k!=='m'?' g':''}${N>=7?' sm':''}">${esc(s.name)}</div>${tvSprite(avOf(s,oi),Math.round(44*sc))}</div>`}).join('');
 const stars=[[8,40],[22,70],[41,28],[63,56],[78,34],[92,76],[30,102],[86,110]].map((p,i)=>`<i class="tvst" style="left:${p[0]}%;top:${p[1]}px;animation-delay:-${(i*.37).toFixed(2)}s"></i>`).join('');
 if(N===0)pl=`<div class="tvp ghost" style="left:50%;top:${cy+ry*1.1}px;z-index:${cy+ry};--s:1;--br:1"><div class="tvtag">TU?</div>${tvSprite(avOf({dev:ME.dev,k:'m'},0),44)}</div>`;
 const fb=cy-8;
 return`<div class="tvscene" style="height:${H}px;--px:${CAM.v.toFixed(3)}" role="img" aria-label="Il falò con ${N} giocator${N===1?'e':'i'} seduti intorno"><div class="tvsky"></div><div class="tvaur"><i></i><i></i><i></i></div>${stars}<div class="tvmoon"></div>${VH.mts}${VH.far}<div class="tvgnd"><i class="tvgrid"></i></div><div class="tvdirt" style="top:${fb-40}px"></div>${VH.near}<div class="tvfog"></div><div class="tvfog b"></div>${VH.fg}
 <div class="tvglow" style="top:${fb-150}px"></div><div class="tvlight" style="top:${fb-40}px"></div>
 <div class="tvplq" ${N===0?'hidden':''}>${R.on?`<span>STANZA</span><b>${isGen()?'GENERALE':esc(R.code||'…')}</b><button class="tvcp" data-a="copy">COPIA</button>`:`<span>SU QUESTO TELEFONO</span>`}</div>
 <div class="tvpit" style="top:${fb-34}px;z-index:${fb-2}">${VH.logs}</div><canvas class="tvfirec" id="tvfirec" width="40" height="36" style="top:${fb-112}px;z-index:${fb-1}"></canvas><div class="tvpit" style="top:${fb-34}px;z-index:${fb+1}">${VH.stones}</div>
 <i class="tvspk" style="left:50%;top:${fb-70}px"></i><i class="tvspk" style="left:calc(50% + 12px);top:${fb-64}px;animation-delay:-.8s"></i><i class="tvspk" style="left:calc(50% - 12px);top:${fb-66}px;animation-delay:-1.6s"></i><i class="tvspk" style="left:calc(50% + 4px);top:${fb-74}px;animation-delay:-2.1s"></i>${pl}</div>`}
/* ---- scenario nordico: montagne innevate, pini, falò a pixel ---- */
const VH=(()=>{let sd=7;const rnd=()=>{sd=(sd*9301+49297)%233280;return sd/233280};
 const pines=(n,hmin,hmax,col,cls)=>{let p='';const step=400/n;for(let k=0;k<=n;k++){const x=k*step+(rnd()-.5)*step*.6,h=hmin+rnd()*(hmax-hmin),w=h*.42,b=80;
   p+=`M${(x-w).toFixed(1)} ${b}L${x.toFixed(1)} ${(b-h).toFixed(1)}L${(x+w).toFixed(1)} ${b}Z`;p+=`M${(x-w*.8).toFixed(1)} ${(b-h*.35).toFixed(1)}L${x.toFixed(1)} ${(b-h*1.02).toFixed(1)}L${(x+w*.8).toFixed(1)} ${(b-h*.35).toFixed(1)}Z`}
  return`<svg class="${cls}" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true"><path d="${p}" fill="${col}"/></svg>`};
 const mts=`<svg class="tvmts" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120V70L40 40L70 62L120 14L160 52L190 36L240 70L290 20L330 50L370 30L400 48V120Z" fill="#22384a"/><path d="M120 14L104 30L114 28L120 36L128 27L138 31ZM290 20L276 34L286 33L292 40L300 32L309 34ZM40 40L30 49L38 48L44 54L50 46ZM370 30L360 39L368 38L374 44L381 37Z" fill="#d6e6ef"/><path d="M0 120V92L50 70L90 86L140 60L200 84L250 66L300 88L350 72L400 86V120Z" fill="#17283a"/></svg>`;
 const far=pines(30,26,46,'#0f2230','tvpine1'),near=pines(18,34,62,'#081720','tvpine2');
 const R1=(x,y,w,h,f)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
 const logs=`<svg viewBox="0 0 32 12" width="128" height="48" shape-rendering="crispEdges" aria-hidden="true">${R1(6,5,20,2,'#5a3414')}${R1(6,5,20,1,'#7a4a24')}${R1(9,3,3,5,'#4a2a10')}${R1(20,3,3,5,'#4a2a10')}${R1(11,6,10,2,'#3d2410')}${R1(14,4,4,4,'#ff8a2a')}${R1(12,6,8,2,'#ffb347')}</svg>`;
 const st=[[2,7,4,3],[6,8,4,3],[10,9,4,3],[14,9,4,3],[18,9,4,3],[22,8,4,3],[26,7,4,3],[4,5,3,2],[25,5,3,2]];
 const stones=`<svg viewBox="0 0 32 12" width="128" height="48" shape-rendering="crispEdges" aria-hidden="true">${st.map(([x,y,w,h],k)=>R1(x,y,w,h,k%2?'#5b636e':'#6f7884')+R1(x,y,w,1,'#a3acb8')+R1(x+1,y+h-1,w-1,1,'#3a4048')).join('')}</svg>`;
 const br=(sx)=>{let p='';for(let k=0;k<7;k++){const y=6+k*13,l=70-k*7;p+=`M0 ${y}L${l} ${y+8}L0 ${y+16}Z`}return`<svg class="tvfg ${sx}" viewBox="0 0 80 100" aria-hidden="true"><path d="M0 0H12V100H0Z" fill="#04090d"/><path d="${p}" fill="#050c11"/></svg>`};
 const fg=br('l')+br('r');
 return{mts,far,near,logs,stones,fg}})();
(()=>{const rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
 document.addEventListener('pointermove',e=>{const sc=document.querySelector('.tvscene');if(!sc)return;const r=sc.getBoundingClientRect();if(e.clientY<r.top-40||e.clientY>r.bottom+40)return;CAM.ptr=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1))},{passive:true});
 window.addEventListener('deviceorientation',e=>{if(e.gamma!=null)CAM.tilt=Math.max(-1,Math.min(1,e.gamma/22))},{passive:true});
 setInterval(()=>{if(document.hidden||rm)return;const sc=document.querySelector('.tvscene');if(!sc)return;CAM.t+=60;const tg=Math.sin(CAM.t/3800)*.45+CAM.ptr*.55+CAM.tilt*.5;CAM.v+=(Math.max(-1,Math.min(1,tg))-CAM.v)*.12;sc.style.setProperty('--px',CAM.v.toFixed(3))},60)})();
const FIRE=(()=>{const W=40,H=36,px=new Uint8Array(W*H);let img=null,ctx=null,cv=null,t=0;
 const PAL=[[7,7,7],[31,7,7],[47,15,7],[71,15,7],[87,23,7],[103,31,7],[119,31,7],[143,39,7],[159,47,7],[175,63,7],[191,71,7],[199,71,7],[223,79,7],[223,87,7],[223,87,7],[215,95,7],[215,95,7],[215,103,15],[207,111,15],[207,119,15],[207,127,15],[207,135,23],[199,135,23],[199,143,23],[199,151,31],[191,159,31],[191,159,31],[191,167,39],[191,167,39],[191,175,47],[183,175,47],[183,183,47],[183,183,55],[207,207,111],[223,223,159],[239,239,199],[255,255,255]];
 function step(){t++;const wind=Math.sin(t/31)*.22;
  for(let x=0;x<W;x++){const d=Math.abs(x-(W-1)/2)/(W*.2),v=d>=1?0:Math.round(36*(1-d*d*d)*(.8+.2*Math.random()));px[(H-1)*W+x]=v}
  for(let x=0;x<W;x++)for(let y=1;y<H;y++){const s=y*W+x,p=px[s];if(!p){px[s-W]=0;continue}const r=Math.max(0,Math.min(2,Math.floor(Math.random()*3+wind)));let dst=s-W-r+1;if(dst<0)dst=0;if(dst>=W*H)dst=W*H-1;px[dst]=Math.max(0,p-(Math.random()<.7?1:0)-(Math.random()<.22?1:0))}}
 function draw(){if(!ctx)return;const d=img.data;for(let k=0;k<W*H;k++){const p=px[k],c=PAL[p];d[k*4]=c[0];d[k*4+1]=c[1];d[k*4+2]=c[2];d[k*4+3]=p<2?0:Math.min(255,(p-1)*30)}ctx.putImageData(img,0,0)}
 function tick(){const el=document.getElementById('tvfirec');if(!el){cv=null;return}if(el!==cv){cv=el;ctx=el.getContext('2d');img=ctx.createImageData(W,H)}step();draw()}
 for(let k=0;k<40;k++)step();
 setInterval(()=>{if(!RM)tick();else if(document.getElementById('tvfirec')!==cv)tick()},70);return{tick}})();
function tvBoxH(x,k,pick,MD,N){const{g,ok,v}=x,c=TVC[k],b=TVB[g.id]||{mm:[112,36],k:'box',c:[c.f,c.s,c.e]},on=pick&&pick.g===g,flat=b.k==='flat';
 const w=flat?Math.round(b.mm[0]*TVPX):Math.max(24,Math.round(b.mm[1]*TVPX)),h=flat?Math.round(b.mm[1]*TVPX):Math.round(b.mm[0]*TVPX),thin=w<40;
 return`<button class="tvbox tv-${b.k}${thin?' thin':''}${ok?'':' off'}" data-a="tvpick" data-v="${g.id}" aria-pressed="${!!on}" aria-label="${esc(g.name)}, ${g.range} giocatori${MD?', '+v+' voti':''}${ok?'':', non disponibile con '+N}" style="width:${w}px;height:${h}px;--bf:${b.c[0]};--bs:${b.c[1]};--be:${b.c[2]};--bi:${b.ink||'#fff3c4'};box-shadow:${tvExt(b.c[1])};transform:translateY(${on?-14:0}px)">${thin?'<i class="tvhit" aria-hidden="true"></i>':''}<span class="tvv">${tvInfo(g)[1]}</span><span class="tvt">${g.range.replace(' o ','/')}${MD&&v?' '+ic('star',12)+v:''}</span></button>`}
function tvBoxes(ch,k,pick,MD,N){const isF=x=>TVB[x.g.id]&&TVB[x.g.id].k==='flat';ch=[...ch.filter(isF),...ch.filter(x=>!isF(x))];let out='',pile=[];const flush=()=>{if(pile.length){out+=`<div class="tvpile">${pile.reverse().join('')}</div>`;pile=[]}};
 for(const x of ch){const b=TVB[x.g.id];if(b&&b.k==='flat'){pile.push(tvBoxH(x,k,pick,MD,N));if(pile.length===2)flush()}else{flush();out+=tvBoxH(x,k,pick,MD,N)}}flush();return out}
function tvDet(pick,N,MD,myKeys,busy){
 const g=pick&&pick.g,ok=pick&&pick.ok,v=pick?pick.v:0;
 return g?`<div class="tvdet"><div class="tvdh"><div><div class="tvdn">${g.name}</div><div class="tvdm">${g.range} giocatori${ok?' · '+g.mode(N):' · non disponibile con '+N}</div></div>${MD?`<div class="tvdv"><b>${v}</b><small>VOTI</small></div>`:''}</div>
  <p class="tvdd">${g.desc}</p>${ok&&MD?`<div class="tvdl">VOTA QUESTO GIOCO (tocca il tuo nome)</div><div class="votes">${myKeys.map(x=>{const on=(R.mine.votes[x.k]||[]).includes(g.id);return`<button class="vote ${on?'on':''}" data-a="vote" data-v="${g.id}|${x.k}">${ic('star',14)} ${esc(x.name)}</button>`}).join('')}</div>`:''}
  <div class="row">${g.opts&&ok?`<select class="sel sm" id="opt-${g.id}" aria-label="${g.opts.label}">${g.opts.vals.map(([k,l])=>`<option value="${k}" ${(ui.opts[g.id]||g.opts.vals[0][0])===k?'selected':''}>${l}</option>`).join('')}</select>`:''}<button class="b sm ${ok?'play':''}" data-a="start" data-v="${g.id}" ${ok&&!busy?'':'disabled'}>${MD?'Proponi':'Gioca'}</button><button class="b sm" data-a="rules" data-v="${g.id}">Regole</button></div></div>`:''}
function tvShelf(list,top,N,myKeys,busy){
 const MD=multiDev();
 const cat=ui.cat||'tutti',q=(ui.q||'').trim().toLowerCase();
 const pick=list.find(x=>x.g.id===ui.pick)||top||list[0];
 const order=['classici','strategia','squadra'].filter(k=>list.some(x=>tvInfo(x.g)[0]===k));
 const chips=[['tutti','TUTTI ('+list.length+')'],...order.map(k=>[k,TVC[k].n+' ('+list.filter(x=>tvInfo(x.g)[0]===k).length+')'])].map(([k,l])=>`<button class="tvchip ${cat===k?'on':''}" data-a="tvcat" data-v="${k}" aria-pressed="${cat===k}">${l}</button>`).join('');
 const vis=list.filter(x=>(cat==='tutti'||tvInfo(x.g)[0]===cat)&&(!q||x.g.name.toLowerCase().includes(q)));
 let rows='';
 order.forEach(k=>{const items=vis.filter(x=>tvInfo(x.g)[0]===k);
  for(let i=0;i<items.length;i+=6){const ch=items.slice(i,i+6);
   rows+=`<div class="tvrow">${i===0?`<div class="tvplate">${TVC[k].n}<small>${items.length}</small></div>`:''}<div class="tvboxes">${tvBoxes(ch,k,pick,MD,N)}</div><div class="tvplank"></div></div>`}});
 if(!vis.length)rows='<div class="tvnone">NESSUN GIOCO TROVATO</div>';
 const det=tvDet(pick,N,MD,myKeys,busy);
 return`<div class="tvshelf"><div class="tvsh"><div class="tvst2">LO SCAFFALE ${infoH(MD?'Tocca una scatola per vederla. Ogni giocatore può votare fino a 3 giochi: vince il più votato.':'Tocca una scatola per scegliere, poi premi Gioca.',"dark")}</div><div class="tvsn">${vis.length} ${vis.length===1?'gioco':'giochi'} · ${N} giocator${N===1?'e':'i'}</div></div>
 <input type="text" id="tvq" class="tvq" placeholder="Cerca tra i giochi" aria-label="Cerca tra i giochi" value="${esc(ui.q||'')}" autocomplete="off"><div class="tvchips">${chips}</div>${rows}${det}</div>`}

function roomH(){if(ui.glist||ui.tab==='games')return`${Plancia.giochiH()}${avEditH()}${rulesH()}${cfgH()}`;if(ui.amici)return`${avEditH()}${rulesH()}${cfgH()}`;if(!ui.inroom)return`${Plancia.homeH()}${avEditH()}${rulesH()}${cfgH()}`;if(lob3())return`${avEditH()}${rulesH()}${cfgH()}`;const M=members(),S=lobbySeats(),N=S.length,T=tally(N),busy=R.on&&R.doc&&R.doc.phase==='play';
 const myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))];
 const MD=multiDev(),list=GAMES.map(g=>({g,ok:g.ok(N),v:MD?T[g.id]||0:0})).sort((a,b)=>(b.ok-a.ok)||(b.v-a.v));
 const top=list.find(x=>x.ok);
 const hint=R.on?`<div class="row" style="align-items:center"><button class="b sm" data-a="copy" style="flex:1">Copia invito</button>${infoH(isGen()?'Siete tutti nella <b>stanza generale</b>: chi apre il sito scrive il nome e si siede subito al falò. Manda il link del sito agli amici.':'Stanza privata <b>'+esc(R.code)+'</b>: manda il link d’invito, oppure fai inserire il codice sulla targa.'+(R.mode==='p2p'&&P2P.role==='host'?' Tieni questa pagina aperta: la stanza vive sul tuo telefono.':''))}</div>`:`<div class="row" style="align-items:center"><span class="stoff">Offline: si gioca su questo telefono</span><button class="b sm" data-a="retrynet">Riprova</button>${infoH("Non riesco a collegarmi per il gioco online (server di incontro non raggiungibile da questa pagina). Intanto puoi aggiungere ospiti e passarvi il telefono.")}</div>`;
 const mem=M.map(m=>`<div class="mem"><div class="pl ${m.id===ME.dev?'act':''}"><div class="av">${esc((m.name||'?')[0])}</div><span class="n">${esc(m.name||'?')}${m.id===ME.dev?' (tu)':''}</span>${m.id!==ME.dev&&R.on?`<button class="x" data-a="rmmember" data-v="${m.id}" aria-label="Rimuovi ${esc(m.name)}">${ic('x',16)}</button>`:''}</div>
  ${(m.guests||[]).map(g=>`<div class="pl guest"><div class="av">${esc(g.name[0]||'?')}</div><span class="n">${esc(g.name)} <small class="muted">ospite di ${esc(m.name)}</small></span>${m.id===ME.dev?`<button class="x" data-a="rmguest" data-v="${g.k}" aria-label="Rimuovi ${esc(g.name)}">${ic('x',16)}</button>`:''}</div>`).join('')}</div>`).join('');
 const tab=ui.tab==='games'?'games':'room',nv=MD?Object.values(T).reduce((a,b)=>a+b,0):0;
 const busyB=busy?`<div class="bubble">Partita di <b>${GN(R.doc.game)}</b> in corso in questa stanza. Potrai unirti alla prossima.</div>`:'';
 const nav=`<nav class="tvnav" aria-label="Sezioni"><button class="tvtab ${tab==='room'?'on':''}" data-a="tab" data-v="room" aria-pressed="${tab==='room'}">${ic('fuoco',22)}<span>Falò</span></button><button class="tvtab ${tab==='games'?'on':''}" data-a="tab" data-v="games" aria-pressed="${tab==='games'}">${ic('dado',22)}<span>Giochi</span>${nv?`<i>${nv}</i>`:''}</button></nav>`;
 const resume=!R.on&&(()=>{try{return JSON.parse(ST('rg-off')||'null')?.game}catch(e){return null}})()?'<button class="b gold" data-a="resume">Riprendi la partita interrotta</button>':'';
 let body;
 if(tab==='games'){const games=tvShelf(list,top,N,myKeys,busy);
  body=`<div class="gtop"><div class="tvplq mini">${R.on?`<span>STANZA</span><b>${isGen()?'GENERALE':esc(R.code||'…')}</b>`:`<span>SU QUESTO TELEFONO</span>`}</div><span class="chip">${N} giocator${N===1?'e':'i'}</span></div>${busyB}
  ${N>10?'<p class="err">Massimo 10 giocatori per tavolo: togliete qualche ospite.</p>':''}
  ${top&&!busy&&MD&&top.v?`<button class="b play big" data-a="start" data-v="${top.g.id}">Proponi ${top.g.name}${top.v?` · ${top.v} vot${top.v===1?'o':'i'}`:''}</button>`:''}
  ${games}${resume}`}
 else{body=`${tvSceneIso(S)}<div class="panel col">${hint}<div class="mems">${mem}</div>
  <div class="row"><input type="text" id="gname" maxlength="14" placeholder="Nome ospite" style="flex:1"><button class="b sm disc" data-a="addguest">+ Ospite</button>${infoH("Gli ospiti giocano su questo telefono: ve lo passate a ogni turno. Tocca il tuo pupazzetto per personalizzarlo.")}</div></div>
  ${busyB}
  ${top&&!busy?`<button class="tvnext" data-a="tab" data-v="games"><span>${ic('dado',16)} ${!MD?'Scegli un gioco dallo scaffale':top.v?'In testa: <b>'+esc(top.g.name)+'</b> · '+top.v+' vot'+(top.v===1?'o':'i'):'Votate il gioco di stasera'}</span><b>Vai ai giochi ›</b></button>`:''}
  ${chatH()}
  ${R.on?`<div class="panel col"><h3>${isGen()?'Sei nella stanza generale':'Sei nella stanza privata '+esc(R.code)} ${infoH(isGen()?'Chi apre il sito arriva qui. Se volete giocare da soli, create una stanza privata e condividete il codice.':'Solo chi ha il codice può entrare.')}</h3>${isGen()?'':'<button class="b sm" data-a="genroom">Torna alla stanza generale</button>'}<h3>Entra in una stanza privata</h3><div class="row"><input type="text" id="jc" maxlength="6" placeholder="Codice" style="flex:1;text-transform:uppercase"><button class="b sm disc" data-a="join">Entra</button></div><button class="b sm" data-a="newroom">Crea una stanza privata</button></div>`:''}
  ${resume}`}
 return`${hudH()}${body}<div class="err" role="alert">${esc(ui.err)}</div><div style="height:84px"></div>${nav}${avEditH()}${rulesH()}${cfgH()}`}
function avEditH(){if(ui.avk==null)return'';const k=ui.avk,g=k==='m'?null:(R.mine.guests||[]).find(x=>x.k===k);if(k!=='m'&&!g)return'';
 const S=lobbySeats(),i=Math.max(0,S.findIndex(x=>x.dev===ME.dev&&x.k===k)),av=avOf({dev:ME.dev,k},i),nm=g?g.name:(R.mine.name||ME.name);
 const sw=(f,arr,lab)=>`<div class="avrow"><span>${lab}</span><div class="avsw">${arr.map((c,n)=>`<button class="avc ${av[f]===n?'on':''}" style="background:${Array.isArray(c)?c[0]:c}" data-a="avset" data-v="${f}|${n}" aria-label="${lab} ${n+1}"></button>`).join('')}</div></div>`;
 return`<div class="modal edfull"><div class="box avbox"><header class="edh"><h2>${esc(nm)}</h2><div class="avprev">${tvSprite(av,96)}</div></header>
 <div class="edbody col"><div class="avrow"><span>Copricapo</span><div class="avsw">${AVT.map((t,n)=>`<button class="b sm ${av.t===n?'gold':''}" data-a="avset" data-v="t|${n}">${t}</button>`).join('')}</div></div>
 ${sw('h',AVC,'Colore copricapo')}${sw('c',AVC,'Vestito')}${sw('s',AVS,'Carnagione')}</div>
 <footer class="edf row"><button class="b sm" data-a="avrand">${ic('dado',16)} A caso</button><button class="b gold" data-a="avedit" data-v="">Salva</button></footer></div></div>`}
