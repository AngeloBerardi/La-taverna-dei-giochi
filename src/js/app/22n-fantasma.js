/* ================= CACCIA AL FANTASMA (inseguimento a biglietti su mappa) ================= */
const FAC=['#e8453c','#2f9bd8','#f2b81c','#3aa05a','#e8782a'];
const FTK={taxi:'Taxi',bus:'Bus',metro:'Metro',black:'Nero'},FTC={taxi:'#d9b84a',bus:'#3aa05a',metro:'#d8342c',black:'#8a6fd0'};
/* mappa: unità di griglia → pixel del disegno (SVG 560×580), con gli incroci sfalsati di FANTASMA.pos */
const FSX=74,FSY=62,FOX=40,FOY=38,FVW=FOX*2+(FANTASMA.W-1)*FSX,FVH=FOY*2+(FANTASMA.H-1)*FSY;
const fpos=i=>{const p=FANTASMA.pos(i);return[FOX+p.x*FSX,FOY+p.y*FSY]};
const FZ=[1,1.7,2.5];
function fantasmaMapH(s,opts){const v=viewer(),seeGhost=s.over||v===0,dest=opts.dest||[],F=FANTASMA;
 let o=`<svg class="fm" viewBox="0 0 ${FVW} ${FVH}" role="img" aria-label="Mappa della città">`;
 /* parco e fiume */
 const rv=y=>FOX+F.river(y)*FSX+FSX/2-FSX*.5;let d='';for(let k=0;k<=24;k++){const y=-.7+k*(F.H+.4)/24;d+=(k?'L':'M')+(FOX+(F.river(y)+.5)*FSX-FSX*.0)+' '+(FOY+y*FSY)}
 o+=`<rect x="0" y="0" width="${FVW}" height="${FVH}" rx="14" fill="#2c3b2a"/><path d="${d}" fill="none" stroke="#2b6cb0" stroke-width="${FSX*.5}" stroke-linecap="round" opacity=".85"/><path d="${d}" fill="none" stroke="#6fb4ee" stroke-width="3" opacity=".6" transform="translate(-9 0)"/><text x="${FOX+(F.river(.2)+.5)*FSX-4}" y="${FOY-14}" class="fr">FIUME</text>`;
 /* linee: prima le più larghe, così il taxi resta leggibile sopra */
 for(const t of['metro','bus','taxi']){const w={metro:6.5,bus:4.2,taxi:2.2}[t];for(let i=0;i<F.N;i++)for(const j of F.adj[t][i])if(j>i){const[a,b]=fpos(i),[c,e]=fpos(j);o+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="${FTC[t]}" stroke-width="${w}" stroke-linecap="round" opacity="${t==='taxi'?.8:.95}"/>`}}
 /* traghetti: tratteggio nero con barca a metà, solo con il biglietto nero */
 F.FERRY.forEach(f=>{const[a,b]=fpos(f[1]*F.W+f[0]),[c,e]=fpos(f[3]*F.W+f[2]),mx=(a+c)/2,my=(b+e)/2;o+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${e}" stroke="#0b0b10" stroke-width="5" stroke-dasharray="2 8" stroke-linecap="round"/><g transform="translate(${mx} ${my})"><rect x="-17" y="-10" width="34" height="20" rx="6" fill="#0b0b10" stroke="#fff" stroke-width="1.5"/><path d="M-9 3H9L6 7H-6ZM0-7V2M0-7L6 0H0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></g>`});
 /* stazioni: cartello con il numero; sotto, i mezzi che ci passano (bus verde, metro rossa, traghetto nero) */
 for(let i=0;i<F.N;i++){const[x,y]=fpos(i),dd=dest.find(z=>z.to===i),bus=F.isBus(i),met=F.isMetro(i),fer=F.isFerry(i);
  o+=`<g ${dd?`data-a="fmove" data-v="${i}" class="fd" role="button" tabindex="0" aria-label="Vai in ${i+1}"`:''}>`+
   `<circle cx="${x}" cy="${y}" r="${dd?16:14}" fill="#fff8e1" stroke="${dd?'#fff':met?FTC.metro:bus?FTC.bus:'#6b5b3a'}" stroke-width="${dd?4:met||bus?4:2.4}"/>`+
   (met&&bus?`<circle cx="${x}" cy="${y}" r="10.5" fill="none" stroke="${FTC.bus}" stroke-width="3"/>`:'')+
   `<text x="${x}" y="${y+4.6}" class="fn">${i+1}</text>`+
   [bus?FTC.bus:null,met?FTC.metro:null,fer?'#0b0b10':null].filter(Boolean).map((c,k,arr)=>`<rect x="${x-(arr.length*9-2)/2+k*9}" y="${y+14}" width="7" height="6" rx="1.5" fill="${c}" stroke="#fff" stroke-width=".8"/>`).join('')+
   (dd?`<circle cx="${x}" cy="${y}" r="22" fill="none" stroke="#fff" stroke-width="3" class="fp"/>`:'')+`</g>`}
 if(s.last&&!seeGhost){const[x,y]=fpos(s.last.pos);o+=`<g class="fl"><circle cx="${x}" cy="${y}" r="22" fill="#b79cff33" stroke="#b79cff" stroke-width="4" stroke-dasharray="6 4"/><text x="${x}" y="${y-26}" class="fn w">visto al round ${s.last.round}</text></g>`}
 if(seeGhost){const[x,y]=fpos(s.pos[0]);o+=`<g class="fg"><circle cx="${x}" cy="${y-2}" r="17" fill="#8a6fd0" stroke="#fff" stroke-width="3.5"/><text x="${x}" y="${y+4}" class="fn w">F</text></g>`}
 for(let i=1;i<s.n;i++){const[x,y]=fpos(s.pos[i]);o+=`<g class="ft ${i===s.cur&&!s.over?'act':''}"><circle cx="${x}" cy="${y-3}" r="${i===s.cur&&!s.over?17:15}" fill="${FAC[(i-1)%5]}" stroke="#fff" stroke-width="3.5"/><text x="${x}" y="${y+3}" class="fn w">${esc((s.names[i][0]||'?').toUpperCase())}</text></g>`}
 return o+`</svg>`}
/* leggenda dei mezzi + zoom */
const fleg=()=>`<div class="fleg"><span><i style="background:${FTC.taxi}"></i>Taxi</span><span><i style="background:${FTC.bus}"></i>Bus</span><span><i style="background:${FTC.metro}"></i>Metro</span><span><i style="background:#0b0b10"></i>Traghetto · solo nero</span><span class="fzb"><button class="b sm" data-a="fzoom" data-v="-1" aria-label="Riduci la mappa">−</button><button class="b sm" data-a="fzoom" data-v="1" aria-label="Ingrandisci la mappa">+</button></span></div>`;
/* dopo il disegno: la mappa grande si riposiziona dove sei (o dove stavi guardando) */
function fantasmaScroll(s){setTimeout(()=>{const el=document.querySelector('.fmw');if(!el)return;const z=FZ[ui.fz??1],k=el.scrollWidth/FVW;
  if(ui.fscr&&ui.fscr.z===z){el.scrollLeft=ui.fscr.x;el.scrollTop=ui.fscr.y}else{const[x,y]=fpos(s.pos[s.over?0:s.cur===0&&viewer()!==0?(s.last?0:1):s.cur]);el.scrollLeft=x*k-el.clientWidth/2;el.scrollTop=y*k-el.clientHeight/2}
  el.onscroll=()=>{ui.fscr={z,x:el.scrollLeft,y:el.scrollTop}}},0)}
function fantasmaH(){if(ui.tv)return fantasmaTVH();const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,ph=s.phase,cur=s.cur;
 const key=s.gid+':'+s.evn;if(ui.fk!==key){ui.fk=key;ui.fsel=null}
 const mv=mine&&(ph==='ghost'||ph==='det')?FANTASMA.moves(s,cur):[];
 const toMap={};mv.forEach(m=>{(toMap[m.to]=toMap[m.to]||[]).push(m.tk)});const dest=Object.keys(toMap).map(k=>({to:+k}));
 const chips=`<span class="chip pal">Round ${s.round}/${FANTASMA.ROUNDS}</span><span class="chip">${ph==='ghost'?'Muove il Fantasma':'Muovono i detective'}</span>${s.dbl?'<span class="chip">Doppia mossa</span>':''}`;
 const strip=stripH(s,i=>({c:i?FAC[(i-1)%5]:'#8a6fd0',b:i?s.tk[i].taxi+'·'+s.tk[i].bus+'·'+s.tk[i].metro:'F'}));
 const pl=s.names.map((n,i)=>`<div class="pl ${i===cur&&!s.over?'act':''}"><div class="av" style="background:${i?FAC[(i-1)%5]:'#8a6fd0'}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${i===0?'Fantasma · taxi '+s.tk[0].taxi+' bus '+s.tk[0].bus+' metro '+s.tk[0].metro+' nero '+s.tk[0].black+' doppie '+s.tk[0].dbl:'Detective · taxi '+s.tk[i].taxi+' bus '+s.tk[i].bus+' metro '+s.tk[i].metro}</span></div>`).join('');
 const trail=`<div class="ftr">${s.trail.map((t,i)=>`<i class="${FANTASMA.REVEAL.includes(i+1)?'rv':''}" style="background:${FTC[t]}" title="Round ${i+1}">${i+1}</i>`).join('')||'<small class="muted">Il Fantasma non si è ancora mosso.</small>'}</div>`;
 const t=s.tk[cur];let ctl='',hint='';
 if(mine){const sel=ui.fsel;
  if(sel!=null&&toMap[sel]){hint='Con quale biglietto?';ctl=`<div class="ktg">${toMap[sel].map(k=>`<button class="b ${k==='black'?'disc':'gold'}" style="border-color:${FTC[k]}" data-a="ftk" data-v="${k}">${FTK[k]} (${t[k]})</button>`).join('')}<button class="b disc sm" data-a="fcancel">Indietro</button></div>`}
  else{hint=cur===0?'Tocca una casella che brilla: dove vuoi nasconderti? Il mezzo che usi resta visibile a tutti.':'Tocca una casella che brilla per muoverti: cerca di raggiungere il Fantasma.';
   if(cur===0&&!s.dbl&&s.tk[0].dbl>0&&s.round<FANTASMA.ROUNDS-1)ctl=`<button class="b disc sm" data-a="fdouble">Doppia mossa (${s.tk[0].dbl})</button>`}}
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic('corona',48)}</div><h2>${s.over.winners.includes(0)?'Il Fantasma sfugge alla caccia!':'I detective hanno preso il Fantasma!'}</h2><p class="muted">Il Fantasma era in ${s.pos[0]+1}.</p><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${mine?`<b>${esc(s.names[cur])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[cur])}</b><span class="dots"></span>`}${mine&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 const hidden=cover?'<div class="zcard" style="--zc:#8a6fd0"><small>Passa il telefono</small><b>Il Fantasma si nasconde: nessun altro guardi lo schermo.</b></div>':'';
 const z=FZ[ui.fz??1];if(!cover)fantasmaScroll(s);
 const mapHtml=cover?hidden:`<div class="fmw"><div class="fmi" style="width:${z*100}%">${fantasmaMapH(s,{dest:ui.fsel==null?dest:[]})}</div></div>${fleg()}`;
 return fixH({title:'Caccia al Fantasma',chips,strip,mid:mapHtml,bot:trail+bub+`<div class="ctl kctl">${ctl}</div>`,players:pl,end})}
function fantasmaClick(a,v){const s=G;if(a==='fzoom'){ui.fz=Math.max(0,Math.min(FZ.length-1,(ui.fz??1)+ +v));ui.fscr=null;return render()}if(!myTurn())return;
 if(a==='fmove'){const to=+v,opts=FANTASMA.moves(s,s.cur).filter(m=>m.to===to);if(!opts.length)return;
  if(opts.length===1)return dispatch({t:'move',to,tk:opts[0].tk});ui.fsel=to;return render()}
 if(a==='ftk'){const to=ui.fsel;ui.fsel=null;return dispatch({t:'move',to,tk:v})}
 if(a==='fcancel'){ui.fsel=null;return render()}
 if(a==='fdouble')return dispatch({t:'double'})}
const FAFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='ghost'){Snd.play('whoosh');await W(350)}
  else if(e.t==='det'){Snd.play('deal');await W(300)}
  else if(e.t==='reveal'){Snd.play('redeem');await W(500)}
  else if(e.t==='double'){Snd.play('dice');await W(300)}
  else if(e.t==='over'){Snd.play(e.ghost?'lose':'atk');await W(300)}}
  endFx(ns)}};
