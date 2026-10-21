/* ================= AZUL ================= */
const AZC=[['#1f5fbf','#0e3a7d','#e8f1ff'],['#f2c230','#b8860b','#fff3c4'],['#c8412f','#7d2218','#ffd9cf'],['#2a2d38','#0f1016','#e5c26a'],['#2fb5b0','#12706c','#d8fffd']];
function azT(c,cls=''){const[bg,dk,lt]=AZC[c];let m='';
 if(c===0)m=`<g fill="${lt}"><circle cx="20" cy="20" r="4"/><circle cx="20" cy="11" r="4.5"/><circle cx="20" cy="29" r="4.5"/><circle cx="11" cy="20" r="4.5"/><circle cx="29" cy="20" r="4.5"/></g><circle cx="20" cy="20" r="2" fill="${dk}"/>`;
 else if(c===1)m=`<circle cx="20" cy="20" r="6.5" fill="${lt}" stroke="${dk}" stroke-width="1.5"/><g stroke="${dk}" stroke-width="2" stroke-linecap="round"><path d="M20 5v6M20 29v6M5 20h6M29 20h6M9.5 9.5l4 4M26.5 26.5l4 4M30.5 9.5l-4 4M13.5 26.5l-4 4"/></g>`;
 else if(c===2)m=`<path d="M20 5L35 20L20 35L5 20Z" fill="none" stroke="${lt}" stroke-width="2.4"/><path d="M20 12L28 20L20 28L12 20Z" fill="${lt}"/><circle cx="20" cy="20" r="2.4" fill="${bg}"/>`;
 else if(c===3)m=`<circle cx="20" cy="20" r="11" fill="none" stroke="${lt}" stroke-width="2.4"/><circle cx="20" cy="20" r="4" fill="${lt}"/><g fill="${lt}"><circle cx="7" cy="7" r="2"/><circle cx="33" cy="7" r="2"/><circle cx="7" cy="33" r="2"/><circle cx="33" cy="33" r="2"/></g>`;
 else m=`<g stroke="${lt}" stroke-width="2" fill="none"><path d="M20 4v32M4 20h32M9 9l22 22M31 9L9 31"/></g><circle cx="20" cy="20" r="5" fill="${bg}" stroke="${lt}" stroke-width="2"/>`;
 return`<svg viewBox="0 0 40 40" class="azt ${cls}"><rect x="1" y="1" width="38" height="38" rx="5" fill="${bg}" stroke="${dk}" stroke-width="2"/><rect x="4" y="4" width="32" height="32" rx="3" fill="none" stroke="${lt}" stroke-opacity=".45" stroke-width="1"/>${m}</svg>`}
const azFirst=`<svg viewBox="0 0 40 40" class="azt"><rect x="1" y="1" width="38" height="38" rx="5" fill="#f5efe0" stroke="#8a7a52" stroke-width="2"/><text x="20" y="27" text-anchor="middle" font-size="22" font-weight="900" fill="#8a2a1a">1</text></svg>`;
function azBoard(s,p,o={}){const b=s.boards[p],act=o.act,sel=ui.azs,tilePh=s.phase==='tile'&&act&&s.cur===p;
 const r0=tilePh?b.lines.findIndex((l,i)=>l.k===i+1):-1,fc=tilePh&&r0>=0?AZUL.freeCols(b,r0,b.lines[r0].c):[];
 let ln='';for(let r=0;r<5;r++){const L=b.lines[r];let cells='';for(let k=0;k<5;k++){if(k<4-r){cells+='<i class="azs sp"></i>';continue}const idx=k-(4-r);const filled=idx>=r+1-L.k;
   cells+=`<i class="azs ${filled?'f':''}">${filled?azT(L.c):''}</i>`}
  const hot=act&&s.phase==='pick'&&sel&&AZUL.canLine(s,b,r,sel.color);
  ln+=`<div class="azl ${hot?'hot':''}" id="azl${p}_${r}" ${hot?`data-a="azline" data-v="${r}" role="button" tabindex="0"`:''}>${cells}</div>`}
 let wl='';for(let r=0;r<5;r++){let cells='';for(let c=0;c<5;c++){const v=b.wall[r][c];const hot=tilePh&&r===r0&&fc.includes(c);
   const ghost=!s.grey?AZUL.colOf(s,r,c):-1;
   cells+=`<i class="azw ${v>=0?'f':''} ${hot?'hot':''}" id="azc${p}_${r}_${c}" ${hot?`data-a="azcell" data-v="${c}" role="button" tabindex="0"`:''}>${v>=0?azT(v):ghost>=0?azT(ghost,'gh'):''}</i>`}
  wl+=`<div class="azr">${cells}</div>`}
 const fh=act&&((s.phase==='pick'&&sel)||(tilePh&&!fc.length&&r0>=0));
 let fl='';for(let i=0;i<7;i++){const t=b.floor[i];fl+=`<i class="azf">${t==null?'':t==='F'?azFirst:azT(t)}<em>${AZUL.FLOOR[i]}</em></i>`}
 return`<div class="azb ${o.mini?'mini':''} ${s.cur===p&&!s.over?'cur':''}" id="azb${p}"><div class="azh"><b>${esc(s.names[p])}</b><span class="azsc" id="azsc${p}">${b.score}</span></div><div class="azg"><div class="azls">${ln}</div><div class="azwall ${s.grey?'grey':''}">${wl}</div></div>
 <div class="azfl ${fh?'hot':''}" id="azf${p}" ${fh?`data-a="azfloor" role="button" tabindex="0"`:''}>${fl}</div></div>`}
function azulH(){if(ui.tv)return azulTVH();const s=G,mine=myTurn(),v=viewer();const L=local();if(needCover())return`${hudH('Azul')}${coverH(s.cur)}${rulesH()}${cfgH()}`;
 const me=isMine(s.cur)?s.cur:v>=0?v:(L[0]??0);const sel=ui.azs;
 const fac=s.factories.map((f,i)=>`<div class="azfa ${f.length?'':'e'}" id="azfa${i}">${f.map(c=>{const h=sel&&sel.src===i&&sel.color===c;return`<span class="azp ${h?'hl':''}" ${mine&&s.phase==='pick'?`data-a="azp" data-v="${i}|${c}" role="button" tabindex="0"`:''}>${azT(c)}</span>`}).join('')}</div>`).join('');
 const cen=`<div class="azcen" id="azfc">${s.firstInCenter?`<span class="azp">${azFirst}</span>`:''}${[...s.center].sort().map(c=>{const h=sel&&sel.src==='c'&&sel.color===c;return`<span class="azp ${h?'hl':''}" ${mine&&s.phase==='pick'?`data-a="azp" data-v="c|${c}" role="button" tabindex="0"`:''}>${azT(c)}</span>`}).join('')}${!s.center.length&&!s.firstInCenter?'<em class="muted">centro vuoto</em>':''}</div>`;
 let hint='';
 if(mine){if(s.phase==='tile'){const b=s.boards[s.cur],r=b.lines.findIndex((l,i)=>l.k===i+1),fc=r>=0?AZUL.freeCols(b,r,b.lines[r].c):[];hint=fc.length?`<span class="chip hl">Riga ${r+1}: tocca la casella del muro dove posare la piastrella</span>`:`<span class="chip w">Nessun posto libero: tocca il pavimento</span>`}
  else if(!sel)hint='<span class="muted">Tocca un colore in una fabbrica o al centro</span>';
  else{const src=sel.src==='c'?s.center:s.factories[sel.src];const n=src.filter(c=>c===sel.color).length;hint=`<span class="chip">Prendi ${n} ${n>1?AZUL.CN[sel.color]:AZUL.CN1[sel.color]}: scegli una riga o il pavimento</span><button class="b sm disc" data-a="azno">Annulla</button>`}}
 const others=s.names.map((_,i)=>i).filter(i=>i!==me).map(i=>azBoard(s,i,{mini:true})).join('');
 const sum=s.over&&!ui.anim?azSummary(s):'';
 return`${hudH('Azul')}<div class="tinfo"><span class="chip">Round ${s.round}</span><span class="chip">Sacchetto ${s.bag.length}</span>${s.grey?'<span class="chip sh">Muro libero</span>':''}</div>
 <div class="azx"><div class="azL"><div class="az"><div class="azfs">${fac}</div>${cen}</div>${bubbleH(s,'Scegli un colore: prendi tutte le piastrelle di quel colore.',null)}<div class="prev">${hint}</div><div class="err" role="alert">${esc(ui.err)}</div>${others?`<div class="azo">${others}</div>`:''}</div>
 <div class="azR"><div class="az">${azBoard(s,me,{act:mine})}</div></div></div>${sum}${rulesH()}${cfgH()}`}
function azSummary(s){const o=s.over,R0=s.res||[];const rows=s.names.map((n,i)=>`<tr class="${o.winners.includes(i)?'w':''}"><td>${esc(n)}</td><td>${R0[i].rows}×2</td><td>${R0[i].cols}×7</td><td>${R0[i].colors}×10</td><td><b>${o.scores[i]}</b></td></tr>`).join('');
 return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${o.winners.length>1?'🤝':'🏆'}</div><h2>${o.winners.length>1?'Pareggio tra '+o.winners.map(i=>esc(s.names[i])).join(' e '):esc(s.names[o.win])+' vince!'}</h2><table class="sumt"><tr><th>Giocatore</th><th>Righe</th><th>Colonne</th><th>Colori</th><th>Totale</th></tr>${rows}</table><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function azClick(a,v){const s=G;if(a==='azno'){ui.azs=null;return render()}
 if(!myTurn())return;
 if(a==='azp'){const[src,c]=v.split('|');const k={src:src==='c'?'c':+src,color:+c};ui.azs=ui.azs&&ui.azs.src===k.src&&ui.azs.color===k.color?null:k;ui.err='';Snd.play('sel');return render()}
 if(a==='azcell')return dispatch({t:'wall',col:+v});
 if(a==='azfloor'){if(s.phase==='tile')return dispatch({t:'wall',col:-1});const z=ui.azs;if(!z)return;ui.azs=null;return dispatch({t:'take',src:z.src,color:z.color,line:'f'})}
 if(a==='azline'){const z=ui.azs;if(!z)return;ui.azs=null;return dispatch({t:'take',src:z.src,color:z.color,line:+v})}}
const AZFX={async pre(){return{}},
 async run(prev,ns){const P3=ui.tv&&AZ3.ready;for(const e of ns.ev){
  if(e.t==='round'){banner('ROUND '+e.r,'Le fabbriche si riempiono');Snd.play('deal');await W(500)}
  else if(e.t==='take'){Snd.play('draw');if(!P3){const t=e.line==='f'?'#azf'+e.p:'#azl'+e.p+'_'+e.line;const c=ctr(t);burst(c.x,c.y,AZC[e.color].slice(0,2),10,{v:3,sq:true});if(e.over)flt(t,'−'+e.over,'red')}await W(180)}
  else if(e.t==='first'){if(!P3)flt('#azf'+e.p,'1° giocatore','gold')}
  else if(e.t==='wall'){await W(160);Snd.play('pick');if(!P3){const q='#azc'+e.p+'_'+e.r+'_'+e.col,c=ctr(q);bump(q,'newt',700);burst(c.x,c.y,['#f5efe0','#2f8be6','#ffd34d'],10+e.pts*3,{v:3+e.pts/2,sq:true});flt(q,'+'+e.pts,'gold')}if(e.pts>=6)Snd.play('gold');if(P3)await W(120)}
  else if(e.t==='floor'){Snd.play('impact');if(!P3)flt('#azf'+e.p,String(e.pen),'red');await W(250)}
  else if(e.t==='tofloor'){Snd.play('impact')}
  else if(e.t==='win'){Snd.play('win');confetti()}}}};
