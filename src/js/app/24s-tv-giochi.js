/* ---- Schermo comune (?tv=CODICE) low-poly per Parole in Codice, Quiz, Teste Matte e Il Ricercato di Londra ----
   Stesso schema di Valle/Azul: una scena three.js (LP) che legge solo lo stato `G`, più il guscio HUD 2D (LP.shell).
   Sulla TV NON compare mai un'informazione nascosta: niente chiave delle spie, niente posizione del Fantasma (solo le apparizioni),
   niente soluzione delle prove di Teste Matte. Senza WebGL resta l'HUD con elenco giocatori e cronaca. */
const TVM=(id,gid,dims,bs,bd)=>{let R_=null,failed=false,loading=null,gk='',key='';
 const clear=g=>{while(g.children.length)g.remove(g.children[0])};
 async function init(){if(R_||failed)return;if(!loading)loading=(async()=>{try{if(!VENDOR.gl())throw new Error('niente WebGL');await LP.init();R_=LP.runtime(id,dims);
   if(typeof G!=='undefined'&&G&&G.g===gid&&typeof render==='function')render()}catch(e){failed=true;console.warn(gid+' 3D non disponibile:',e&&e.message);if(typeof render==='function')render()}})();return loading}
 function sync(s){if(failed)return false;if(!R_){init();return false}R_.show();
  const g=gid+':'+s.n+':'+(s.gid||'');if(g!==gk){gk=g;clear(R_.stat);bs(R_,s);key=''}
  const nk=(s.gid||'')+':'+s.evn;if(nk!==key){const first=!key;key=nk;R_.pulses.length=0;R_.anims.length=0;clear(R_.dyn);bd(R_,s,!first)}return true}
 return{sync,hide(){if(R_)R_.hide()},init,get failed(){return failed},get ready(){return !!R_}}};
LP.reg=LP.reg||{};
const dkc=(c,t)=>LP.mix(c,'#000000',t);
/* gruppo con mesh + decal di un builder */
const bmesh=(T,...bs)=>{const g=new T.Group();bs.forEach(b=>{const m=b.mesh(),d=b.decalMesh();if(m)g.add(m);if(d)g.add(d)});return g};
const pawn=(b,x,z,y,col,f)=>{f=f||1;b.cone(x,z,.2*f,.5*f,7,y,col,{r2:.07*f});b.prism(LP.ngon(x,z,.2*f,7,0),y,y+.05,dkc(col,.3))};
/* ================= AGENTI SEGRETI ================= */
const SPTV=TVM('sptv3d','spie',{fw:14.4,fd:9.6,cx:-.4},(R_,s)=>{LP.table(R_,{w:13.6,d:8.6,felt:'#232b38',frame:'#5a3b20'})},(R_,s,anim)=>{
 const T=LP.T,b=LP.builder(),cw=2.2,ch=1.34,gp=.2,x0=-(5*cw+4*gp)/2+cw/2,z0=-(5*ch+4*gp)/2+ch/2,ev=anim?(s.ev||[]):[],fresh=ev.filter(e=>e.t==='reveal').map(e=>e.i),fb=LP.builder(),end=!!s.over;
 s.words.forEach((w,i)=>{const x=x0+(i%5)*(cw+gp),z=z0+Math.floor(i/5)*(ch+gp),r=s.rev[i],k=s.key[i],col=r?(k==='N'?'#a39468':SPCOL[k]):'#e9dcb8',hint=end&&!r?SPCOL[k]:null,B=fresh.includes(i)?fb:b;
  B.prism(LP.cutRect(x,z,cw,ch,.18),LP.TOP,LP.TOP+(r?.05:.12),col,{side:dkc(col,.3)});
  if(hint)B.prism(LP.cutRect(x,z,cw-.3,ch-.3,.12),LP.TOP+.12,LP.TOP+.15,hint,{side:hint});
  if(r&&k!=='N')pawn(B,x+cw/2-.32,z-ch/2+.32,LP.TOP+.05,dkc(col,.35),.8)});
 const m=bmesh(T,b);R_.dyn.add(m);const fg=bmesh(T,fb);
 s.words.forEach((w,i)=>{const x=x0+(i%5)*(cw+gp),z=z0+Math.floor(i/5)*(ch+gp),r=s.rev[i],k=s.key[i],pl=LP.plate(w,cw-.3,.55,{bg:r?dkc(k==='N'?'#a39468':SPCOL[k],.15):'#f7efd6',edge:r?dkc(k==='N'?'#a39468':SPCOL[k],.4):'#b9a77a',fg:r?(k==='N'?'#2a1f0a':'#fff'):'#2a1f12'});pl.position.set(x,LP.TOP+(r?.057:.127),z+.06);(fresh.includes(i)?fg:R_.dyn).add(pl)});if(fg.children.length){R_.dyn.add(fg);R_.drop(fg)}});
LP.reg.spie=SPTV;
function spieTVH(){const s=G,ok=SPTV.sync(s),o=s.over,nm=i=>esc(s.names[i]),t=s.turnT;document.documentElement.dataset.tv3='1';
 const state=o?`<b>Vincono i ${SPT[o.win]}</b>${o.why==='trappola'?' · l’altra squadra ha toccato la trappola':''}`:s.phase==='clue'?`Squadra <b style="color:${SPCOL[t?'B':'R']}">${SPT[t]}</b>: la spia <b>${nm(s.cur)}</b> pensa all’indizio`:`Squadra <b style="color:${SPCOL[t?'B':'R']}">${SPT[t]}</b>: indizio <b>«${esc(s.clue.w)}» ${s.clue.k}</b> · tocca a <b>${nm(s.cur)}</b>`;
 const sc=[0,1].map(q=>`<div class="sptv-sc" style="--pc:${SPCOL[q?'B':'R']}"><b>${SPIE.left(s,q)}</b><span>${SPT[q]}</span></div>`).join('');
 const pls=[0,1].map(q=>`<li class="tv3-team" style="--pc:${SPCOL[q?'B':'R']}"><span class="tv3-n">${SPT[q]}</span><span class="tv3-st">${s.names.map((n,i)=>s.teams[i]===q?`<span>${s.spies.includes(i)?'★ ':''}<b>${esc(n)}</b></span>`:'').join('')}</span></li>`).join('');
 const mid=ok?'':`<div class="sptv-flat">${s.words.map((w,i)=>`<i class="${s.rev[i]?'r'+s.key[i]:''}">${esc(w)}</i>`).join('')}</div>`;
 const end=o?LP.endH(true,'Vincono i '+SPT[o.win]+'!',o.why==='trappola'?'L’altra squadra ha toccato la trappola.':'Tutte le parole trovate.',''):'';
 return LP.shell({cls:'sptv n'+s.n,logo:GN('spie'),sub:'Rossi '+SPIE.left(s,0)+' · Blu '+SPIE.left(s,1)+' parole da trovare',state,mid,right:`<div class="sptv-scs">${sc}</div><ul class="tv3-pl">${pls}</ul>${LP.feedH(s)}`,foot:'',end})}
/* ================= QUIZ DELLA TAVERNA ================= */
const QZTV=TVM('qztv3d','quiz',{fw:10.6,fd:9.8,cx:0},(R_,s)=>{LP.table(R_,{w:10,d:9.2,felt:'#2a1a3a',frame:'#6a4524'});
 const T=LP.T,b=LP.builder(),RAD=3.85,pos=p=>{const a=p/QUIZ.SQ*2*Math.PI-Math.PI/2;return[RAD*Math.cos(a),RAD*Math.sin(a)]};
 for(let p=0;p<QUIZ.SQ;p++){const k=QUIZ.sq(p),[x,z]=pos(p),col=k.h!=null?qcol(k.h):k.r?'#2b2118':qcol(k.c),r=k.h!=null?.36:.25;
  b.prism(LP.ngon(x,z,r,k.r?4:10,k.r?Math.PI/4:0),LP.TOP,LP.TOP+(k.h!=null?.14:.08),col,{side:dkc(col,.35)});
  if(k.h!=null)b.prism(LP.ngon(x,z,r*.55,10),LP.TOP+.14,LP.TOP+.17,'#fff4d0',{side:'#fff4d0'});if(k.r)b.prism(LP.ngon(x,z,.12,4,Math.PI/4),LP.TOP+.08,LP.TOP+.1,'#f2b81c')}
 b.prism(LP.ngon(0,0,2.25,36),LP.TOP,LP.TOP+.05,'#3b2616',{side:'#25180d'});R_.stat.add(bmesh(T,b))},(R_,s,anim)=>{
 const T=LP.T,b=LP.builder(),RAD=3.85,pos=(p,r)=>{const a=p/QUIZ.SQ*2*Math.PI-Math.PI/2;return[(r||RAD)*Math.cos(a),(r||RAD)*Math.sin(a)]};
 /* spicchi del giocatore di turno al centro */
 for(let k=0;k<6;k++){const own=s.wedge[s.cur]&(1<<k),a0=k/6*Math.PI*2-Math.PI/2,a1=(k+1)/6*Math.PI*2-Math.PI/2,pts=[[0,0]];for(let j=0;j<=6;j++){const a=a0+(a1-a0)*j/6;pts.push([2.05*Math.cos(a)*.98,2.05*Math.sin(a)*.98])}
  b.prism(pts,LP.TOP+.05,LP.TOP+(own?.16:.07),own?qcol(k):dkc(qcol(k),.72),{side:dkc(qcol(k),.5)})}
 const at={};s.pos.forEach((p,i)=>{(at[p]=at[p]||[]).push(i)});
 for(const p in at){const l=at[p];l.forEach((i,j)=>{const[x,z]=pos(+p),a=j/l.length*Math.PI*2,ox=l.length>1?Math.cos(a)*.2:0,oz=l.length>1?Math.sin(a)*.2:0;pawn(b,x+ox,z+oz,LP.TOP+.14,QPC[i%6],i===s.cur&&!s.over?1.25:1)})}
 R_.dyn.add(bmesh(T,b));
 const[hx,hz]=pos(s.pos[s.cur]),gl=LP.glow(LP.ngon(hx,hz,.5,16),'#ffd36b',.6);gl.position.y=LP.TOP+.02;R_.dyn.add(gl);R_.pulses.push(gl);
 const pl=LP.plate(s.phase==='roll'?'Tira il dado':s.phase==='move'?'Dado: '+s.roll:s.phase==='ask'&&s.q?DOMANDE.CATS[s.q.cat].n:s.phase==='pick'?'Scegli la categoria':s.over?'Fine':'…',3.2,.6,{bg:s.q&&s.phase==='ask'?dkc(qcol(s.q.cat),.2):'#3b2616'});pl.position.set(0,LP.TOP+.2,0);R_.dyn.add(pl)});
LP.reg.quiz=QZTV;
function quizTVH(){const s=G,ok=QZTV.sync(s),o=s.over,q=s.q,nm=i=>esc(s.names[i]);document.documentElement.dataset.tv3='1';
 const state=o?`<b>${nm(o.win)}</b> vince la partita`:s.phase==='ask'?`<b>${nm(s.cur)}</b> risponde`:s.phase==='roll'?`<b>${nm(s.cur)}</b> tira il dado`:s.phase==='move'?`<b>${nm(s.cur)}</b> muove di ${s.roll}`:`<b>${nm(s.cur)}</b> sceglie la categoria`;
 const dots=i=>DOMANDE.CATS.map((c,k)=>`<i class="tv3-w" style="background:${s.wedge[i]&(1<<k)?c.c:'transparent'};border-color:${c.c}"></i>`).join('');
 const pls=s.names.map((n,i)=>`<li class="${i===s.cur&&!o?'act':''}" style="--pc:${QPC[i%6]}"><i class="tv3-dot"></i><span class="tv3-n">${esc(n)}</span><b class="tv3-vp">${QUIZ.wedges(s,i)}<small>/6</small></b><span class="tv3-st">${dots(i)}</span></li>`).join('');
 const card=q&&s.phase==='ask'?`<div class="qztv-q" style="--qc:${qcol(q.cat)}"><small>${DOMANDE.CATS[q.cat].n}${q.final?' · FINALE':''}</small><b>${esc(q.t)}</b><ol>${q.o.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`:'';
 const end=o?LP.endH(true,'Vince '+nm(o.win)+'!','Sei spicchi e la domanda finale',`<ul>${s.names.map((n,i)=>`<li class="${o.winners.includes(i)?'w':''}"><span>${esc(n)}</span><b>${o.scores[i]}/6</b></li>`).join('')}</ul>`):'';
 return LP.shell({cls:'qztv n'+s.n,logo:GN('quiz'),sub:'Giro '+(s.pos[s.cur]+1)+' / '+QUIZ.SQ,state,mid:ok?'':'<p class="tv3-fb">Grafica 3D non disponibile su questo schermo.</p>',right:`${card}<ul class="tv3-pl">${pls}</ul>${LP.feedH(s)}`,foot:'',end})}
/* ================= ZUCCA MATTA ================= */
const ZUTV=TVM('zutv3d','zucca',{fw:14.4,fd:9.6,cx:-.4},(R_,s)=>{LP.table(R_,{w:13.8,d:9,felt:'#3a2410',frame:'#5a3b20'});
 const T=LP.T,b=LP.builder(),cols=8,sp=1.62,x0=-(cols-1)*sp/2,z0=-(Math.ceil(ZUCCA.PATH/cols)-1)*sp/2;
 for(let p=0;p<ZUCCA.PATH;p++){const r=Math.floor(p/cols),c=r%2?cols-1-p%cols:p%cols,k=ZUCCA.sq(p),col=k>=0?zcat(k).c:k===-1?'#8a5a1d':'#2a2a30',x=x0+c*sp,z=z0+r*sp;
  b.prism(LP.cutRect(x,z,sp-.14,sp-.14,.22),LP.TOP,LP.TOP+(k<0?.16:.09),col,{side:dkc(col,.4)});
  if(k===-1)b.cone(x,z,.4,.5,6,LP.TOP+.16,'#f2c14e',{r2:.12});
  if(k===-2){b.prism(LP.ngon(x,z,.06,6),LP.TOP+.16,LP.TOP+1.0,'#d8d0c0');b.tri([x,LP.TOP+1.0,z],[x+.5,LP.TOP+.82,z],[x,LP.TOP+.64,z],'#d8342c',[0,0,1])}}
 R_.stat.add(bmesh(T,b))},(R_,s,anim)=>{
 const T=LP.T,b=LP.builder(),cols=8,sp=1.62,x0=-(cols-1)*sp/2,z0=-(Math.ceil(ZUCCA.PATH/cols)-1)*sp/2,sqs=[...new Set(s.sq)];
 const cell=p=>{const r=Math.floor(p/cols),c=r%2?cols-1-p%cols:p%cols;return[x0+c*sp,z0+r*sp]},at={};
 sqs.forEach(q=>{const i=s.sq.indexOf(q);(at[s.pos[i]]=at[s.pos[i]]||[]).push(q)});
 for(const p in at){const l=at[p],[x,z]=cell(+p);l.forEach((q,j)=>{const a=j/l.length*Math.PI*2,ox=l.length>1?Math.cos(a)*.34:0,oz=l.length>1?Math.sin(a)*.34:0;pawn(b,x+ox,z+oz,LP.TOP+.1,ZPC[q%6],q===s.sq[s.cur]&&!s.over?1.5:1.25)})}
 R_.dyn.add(bmesh(T,b));const[cx,cz]=cell(s.pos[s.cur]),gl=LP.glow(LP.cutRect(cx,cz,sp,sp,.24),'#ffd36b',.55);gl.position.y=LP.TOP+.012;R_.dyn.add(gl);R_.pulses.push(gl);
 const k=ZUCCA.sq(s.pos[s.cur]),pl=LP.plate(s.over?'Fine':s.phase==='pick'?'Prova finale: la sceglie chi è dopo':s.final?'Prova finale':s.phase==='choose'?'Jolly: scegli la prova':zcat(s.cat).n,4.2,.62,{bg:s.over?'#3b2616':dkc(s.phase==='choose'?'#8a5a1d':zcat(s.cat).c,.15)});pl.position.set(0,LP.TOP+.2,0);R_.dyn.add(pl)});
LP.reg.zucca=ZUTV;
function zuccaTVH(){const s=G,ok=ZUTV.sync(s),o=s.over,tn=i=>esc(ZUCCA.tn(s,i)),c=s.card,cat=zcat(s.cat);document.documentElement.dataset.tv3='1';
 const state=o?`<b>${tn(o.win)}</b> vince la partita`:s.phase==='pick'?`<b>${tn(s.who)}</b> è al traguardo: <b>${tn(s.cur)}</b> sceglie la prova finale`:s.phase==='choose'?`<b>${tn(s.cur)}</b> è su un Jolly: sceglie la prova`:s.phase==='draw'?`Squadra <b>${tn(s.cur)}</b>: <b>${esc(s.names[s.cur])}</b> prende il telefono · prova di <b style="color:${cat.c}">${cat.n}</b>`:`Squadra <b>${tn(s.cur)}</b> · <b style="color:${cat.c}">${cat.n}</b> ${s.final?'(finale)':''}`;
 const q=c&&c.o?`<div class="qztv-q" style="--qc:${cat.c}"><small>${cat.n}</small><b>${esc(c.t)}</b><ol>${c.o.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></div>`:'';
 const sqs=[...new Set(s.sq)],pls=sqs.map(q=>{const i=s.sq.indexOf(q);return`<li class="${q===s.sq[s.cur]&&!o?'act':''}" style="--pc:${ZPC[q%6]}"><i class="tv3-dot"></i><span class="tv3-n">${esc(ZUCCA.tn(s,i))}</span><b class="tv3-vp">${s.pos[i]+1}<small>/${ZUCCA.PATH}</small></b></li>`}).join('');
 const end=o?LP.endH(true,'Vince '+tn(o.win)+'!','Prova finale superata',''):'';
 return LP.shell({cls:'zutv n'+s.n,logo:GN('zucca'),sub:'Casella '+(s.pos[s.cur]+1)+' di '+ZUCCA.PATH,state,mid:ok?'':'<p class="tv3-fb">Grafica 3D non disponibile su questo schermo.</p>',right:`${q}<ul class="tv3-pl">${pls}</ul>${LP.feedH(s)}`,foot:'',end})}
/* ================= CACCIA AL FANTASMA ================= */
const FATV=TVM('fatv3d','fantasma',{fw:11.4,fd:9.8,cx:0},(R_,s)=>{LP.table(R_,{w:10.6,d:9.2,felt:'#1c1a26',frame:'#4a2f18'});
 const T=LP.T,b=LP.builder(),P=i=>{const q=FANTASMA.pos(i);return[(q.x-(FANTASMA.W-1)/2)*1.2,(q.y-(FANTASMA.H-1)/2)*1.0]};
 const line=(i,j,w,h,col)=>{const[a,c]=P(i),[d,e]=P(j),l=Math.hypot(d-a,e-c)||1,nx=-(e-c)/l*w/2,nz=(d-a)/l*w/2;b.prism([[a+nx,c+nz],[d+nx,e+nz],[d-nx,e-nz],[a-nx,c-nz]],LP.TOP,LP.TOP+h,col,{side:col})};
 /* fiume: striscia blu che segue FANTASMA.river */
 for(let k=0;k<24;k++){const y0=-.6+k*(FANTASMA.H+.2)/24,y1=-.6+(k+1)*(FANTASMA.H+.2)/24,x0=FANTASMA.river(y0)+.5,x1=FANTASMA.river(y1)+.5,X=v=>(v-(FANTASMA.W-1)/2)*1.2,Z=v=>(v-(FANTASMA.H-1)/2)*1.0,w=.5;
  b.prism([[X(x0)-w,Z(y0)],[X(x0)+w,Z(y0)],[X(x1)+w,Z(y1)],[X(x1)-w,Z(y1)]],LP.TOP,LP.TOP+.012,'#2b6cb0',{side:'#2b6cb0'})}
 FANTASMA.FERRY.forEach(f=>{const i=f[1]*FANTASMA.W+f[0],j=f[3]*FANTASMA.W+f[2],[a,c]=P(i),[d,e]=P(j);for(let k=0;k<7;k++){const t0=k/7+.03,t1=k/7+.09,x0=a+(d-a)*t0,z0=c+(e-c)*t0,x1=a+(d-a)*t1,z1=c+(e-c)*t1,l=Math.hypot(x1-x0,z1-z0)||1,nx=-(z1-z0)/l*.08,nz=(x1-x0)/l*.08;b.prism([[x0+nx,z0+nz],[x1+nx,z1+nz],[x1-nx,z1-nz],[x0-nx,z0-nz]],LP.TOP,LP.TOP+.06,'#0b0b10',{side:'#0b0b10'})}
  const mx=(a+d)/2,mz=(c+e)/2;b.prism(LP.ngon(mx,mz,.2,6),LP.TOP,LP.TOP+.1,'#0b0b10',{side:'#0b0b10'});b.cone(mx,mz,.12,.3,3,LP.TOP+.1,'#ffffff')});
 for(const t of['taxi','bus','metro']){const w={metro:.16,bus:.1,taxi:.06}[t],h={metro:.05,bus:.035,taxi:.02}[t];for(let i=0;i<FANTASMA.N;i++)for(const j of FANTASMA.adj[t][i])if(j>i)line(i,j,w,h,FTC[t])}
 for(let i=0;i<FANTASMA.N;i++){const[x,z]=P(i),col=FANTASMA.isMetro(i)?'#8a2a24':FANTASMA.isBus(i)?'#2a6a3a':'#4a4438',h=FANTASMA.isMetro(i)||FANTASMA.isBus(i)?.2:.12;b.prism(LP.ngon(x,z,.3,10),LP.TOP,LP.TOP+h,col,{side:dkc(col,.4)});b.prism(LP.ngon(x,z,.2,10),LP.TOP+h,LP.TOP+h+.02,'#f2ead0')}
 R_.stat.add(bmesh(T,b));
 for(let i=0;i<FANTASMA.N;i++){const[x,z]=P(i),h=FANTASMA.isMetro(i)||FANTASMA.isBus(i)?.2:.12,pl=LP.plate(String(i+1),.3,.2,{bg:'#f2ead0',fg:'#241c12',edge:'#f2ead0'});pl.position.set(x,LP.TOP+h+.03,z+.01);R_.stat.add(pl)}},(R_,s,anim)=>{
 const T=LP.T,b=LP.builder(),P=i=>{const q=FANTASMA.pos(i);return[(q.x-(FANTASMA.W-1)/2)*1.2,(q.y-(FANTASMA.H-1)/2)*1.0]},end=!!s.over;
 for(let i=1;i<s.n;i++){const[x,z]=P(s.pos[i]);pawn(b,x+(i%2?.1:-.1),z-.05,LP.TOP+.2,FAC[(i-1)%5],i===s.cur&&!end?1.7:1.4)}
 if(end){const[x,z]=P(s.pos[0]);pawn(b,x,z,LP.TOP+.2,'#8a6fd0',1.7)}
 R_.dyn.add(bmesh(T,b));
 if(s.last&&!end){const[x,z]=P(s.last.pos),gl=LP.glow(LP.ngon(x,z,.5,16),'#b79cff',.6);gl.position.y=LP.TOP+.02;R_.dyn.add(gl);R_.pulses.push(gl);const pl=LP.plate('visto al round '+s.last.round,2.2,.34,{bg:'#3a2a62',edge:'#b79cff'});pl.position.set(x,LP.TOP+.3,z-.7);R_.dyn.add(pl)}
 if(s.phase==='det'&&!end){const[x,z]=P(s.pos[s.cur]),gl=LP.glow(LP.ngon(x,z,.55,16),'#ffd36b',.6);gl.position.y=LP.TOP+.02;R_.dyn.add(gl);R_.pulses.push(gl)}});
LP.reg.fantasma=FATV;
function fantasmaTVH(){const s=G,ok=FATV.sync(s),o=s.over,nm=i=>esc(s.names[i]);document.documentElement.dataset.tv3='1';
 const state=o?(o.winners.includes(0)?'Il Fantasma sfugge alla caccia!':'I detective hanno preso il Fantasma!'):s.phase==='ghost'?'Il Fantasma si muove nell’ombra…':`Detective <b>${nm(s.cur)}</b> si muove`;
 const trail=`<div class="ftr">${s.trail.map((t,i)=>`<i class="${FANTASMA.REVEAL.includes(i+1)?'rv':''}" style="background:${FTC[t]}">${i+1}</i>`).join('')||'<small>Il Fantasma non si è ancora mosso.</small>'}</div>`;
 const pls=s.names.map((n,i)=>`<li class="${i===s.cur&&!o?'act':''}" style="--pc:${i?FAC[(i-1)%5]:'#8a6fd0'}"><i class="tv3-dot"></i><span class="tv3-n">${esc(n)}${i?'':' · Fantasma'}</span><span class="tv3-st">${i?`<span>taxi <b>${s.tk[i].taxi}</b></span><span>bus <b>${s.tk[i].bus}</b></span><span>metro <b>${s.tk[i].metro}</b></span>`:`<span>doppie <b>${s.tk[0].dbl}</b></span><span>neri <b>${s.tk[0].black}</b></span>`}</span></li>`).join('');
 const end=o?LP.endH(o.winners.includes(0),o.winners.includes(0)?'Il Fantasma vince!':'Vincono i detective!','Il Fantasma era in '+(s.pos[0]+1),''):'';
 return LP.shell({cls:'fatv n'+s.n,logo:GN('fantasma'),sub:'Round '+s.round+' / '+FANTASMA.ROUNDS+' · prossima apparizione al round '+(FANTASMA.REVEAL.find(r=>r>s.round)||'—'),state,mid:ok?'':'<p class="tv3-fb">Grafica 3D non disponibile su questo schermo.</p>',right:`<div class="tv3-lt">Biglietti del Fantasma</div>${trail}<ul class="tv3-pl">${pls}</ul>${LP.feedH(s)}`,foot:'',end})}
