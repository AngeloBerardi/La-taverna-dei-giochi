/* ================= CACCIA AL FANTASMA (inseguimento a biglietti su mappa) ================= */
const FAC=['#e8453c','#2f9bd8','#f2b81c','#3aa05a','#e8782a'];
const FTK={taxi:'Taxi',bus:'Bus',metro:'Metro',black:'Nero'},FTC={taxi:'#d9b84a',bus:'#3aa05a',metro:'#d8342c',black:'#8a6fd0'};
const fpos=i=>{const x=i%FANTASMA.W,y=Math.floor(i/FANTASMA.W);return[24+x*43+((i*37)%7-3)*1.6,24+y*43+((i*53)%7-3)*1.6]};
function fantasmaMapH(s,opts){const v=viewer(),seeGhost=s.over||v===0,dest=opts.dest||[];let o=`<svg class="fm" viewBox="0 0 350 400" role="img" aria-label="Mappa della città">`;
 for(const t of['metro','bus','taxi']){const w={metro:5,bus:3.2,taxi:1.6}[t];for(let i=0;i<FANTASMA.N;i++)for(const j of FANTASMA.adj[t][i])if(j>i){const[a,b]=fpos(i),[c,d]=fpos(j);o+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${FTC[t]}" stroke-width="${w}" stroke-linecap="round" opacity="${t==='taxi'?.55:.9}"/>`}}
 for(let i=0;i<FANTASMA.N;i++){const[x,y]=fpos(i),d=dest.find(z=>z.to===i);
  o+=`<g ${d?`data-a="fmove" data-v="${i}" class="fd" role="button" tabindex="0"`:''}><circle cx="${x}" cy="${y}" r="10.5" fill="#1f1d28" stroke="${d?'#fff':FANTASMA.isMetro(i)?FTC.metro:FANTASMA.isBus(i)?FTC.bus:'#9a8f78'}" stroke-width="${d?3.2:2}"/>`+
   `<text x="${x}" y="${y+3.4}" class="fn">${i+1}</text>${d?`<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="#fff" stroke-width="2" class="fp"/>`:''}</g>`}
 if(s.last&&!seeGhost){const[x,y]=fpos(s.last.pos);o+=`<g class="fl"><circle cx="${x}" cy="${y}" r="14" fill="none" stroke="#b79cff" stroke-width="3" stroke-dasharray="4 3"/><text x="${x}" y="${y-17}" class="fn w">visto al round ${s.last.round}</text></g>`}
 if(seeGhost){const[x,y]=fpos(s.pos[0]);o+=`<g class="fg"><circle cx="${x}" cy="${y}" r="13" fill="#8a6fd0" stroke="#fff" stroke-width="2.5"/><text x="${x}" y="${y+4}" class="fn w">F</text></g>`}
 for(let i=1;i<s.n;i++){const[x,y]=fpos(s.pos[i]);o+=`<g class="ft ${i===s.cur&&!s.over?'act':''}"><circle cx="${x}" cy="${y-1}" r="12" fill="${FAC[(i-1)%5]}" stroke="#fff" stroke-width="2.5"/><text x="${x}" y="${y+3}" class="fn w">${esc((s.names[i][0]||'?').toUpperCase())}</text></g>`}
 return o+`</svg>`}
function fantasmaH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,ph=s.phase,cur=s.cur;
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
 const mapHtml=cover?hidden:`<div class="fmw">${fantasmaMapH(s,{dest:ui.fsel==null?dest:[]})}</div>`;
 return fixH({title:'Caccia al Fantasma',chips,strip,mid:mapHtml,bot:trail+bub+`<div class="ctl kctl">${ctl}</div>`,players:pl,end})}
function fantasmaClick(a,v){if(!myTurn())return;const s=G;
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
