/* ================= SABOTEUR ================= */
const SEP={1:[25,0],2:[50,35],4:[25,70],8:[0,35]};
function tileSVG(id,r,o={}){if(o.hidden)return`<svg viewBox="0 0 50 70" class="tile"><rect width="50" height="70" rx="5" fill="#2b1d14"/><rect x="3" y="3" width="44" height="64" rx="4" fill="none" stroke="#c8a24a" stroke-width="2"/><text x="25" y="44" text-anchor="middle" font-size="26" font-weight="900" fill="#c8a24a" font-family="Cinzel,serif">?</text></svg>`;
 const K=SAB.C[id];let g='';const segs=K.segs;
 const line=(d,len=1)=>{const[x,y]=SEP[d];return`<line x1="25" y1="35" x2="${25+(x-25)*len}" y2="${35+(y-35)*len}"/>`};
 segs.forEach((m,si)=>{const ds=[1,2,4,8].filter(d=>m&d);if(K.dead)ds.forEach(d=>{const[x,y]=SEP[d];g+=`<line x1="${x}" y1="${y}" x2="${25+(x-25)*.35}" y2="${35+(y-35)*.35}"/>`});
  else if(K.bridge&&si===1)g+=`<g class="over">${ds.map(d=>line(d)).join('')}</g>`;else{g+=ds.map(d=>line(d)).join('');if(ds.length>1&&!K.bridge)g+='<circle cx="25" cy="35" r="7"/>'}});
 let deco='';if(K.dead)deco+='<circle cx="25" cy="35" r="8" fill="#4a3526" stroke="#1a110b" stroke-width="2"/><circle cx="22" cy="33" r="3" fill="#6b5240"/>';
 if(K.door)deco+=`<rect x="18" y="26" width="14" height="18" rx="3" fill="${K.door==='g'?'#2fa65b':'#2c7fd6'}" stroke="#000" stroke-width="1.5"/><circle cx="29" cy="35" r="1.5" fill="#ffd34d"/>`;
 if(K.cry)for(let i=0;i<K.cry;i++)deco+=`<path d="M${11+i*24} 10l5 6-5 6-5-6z" fill="#c38cff" stroke="#5a2a8a"/>`;
 if(K.ladder&&!K.start)deco+='<g stroke="#8a5a2a" stroke-width="2"><line x1="20" y1="22" x2="20" y2="48"/><line x1="30" y1="22" x2="30" y2="48"/><line x1="20" y1="28" x2="30" y2="28"/><line x1="20" y1="35" x2="30" y2="35"/><line x1="20" y1="42" x2="30" y2="42"/></g>';
 if(K.start)deco+='<circle cx="25" cy="35" r="12" fill="#ffd34d" opacity=".35"/><g stroke="#8a5a2a" stroke-width="2.5"><line x1="19" y1="22" x2="19" y2="48"/><line x1="31" y1="22" x2="31" y2="48"/><line x1="19" y1="28" x2="31" y2="28"/><line x1="19" y1="35" x2="31" y2="35"/><line x1="19" y1="42" x2="31" y2="42"/></g>';
 if(K.goal==='gold')deco+='<g fill="#ffd34d" stroke="#8a5a00" stroke-width="1"><circle cx="20" cy="38" r="6"/><circle cx="31" cy="37" r="7"/><circle cx="25" cy="29" r="6"/></g>';
 if(K.goal==='coal')deco+='<g fill="#555" stroke="#222"><circle cx="21" cy="38" r="6"/><circle cx="30" cy="36" r="5"/><circle cx="26" cy="30" r="4"/></g>';
 return`<svg viewBox="0 0 50 70" class="tile ${K.goal||''}"><rect width="50" height="70" rx="5" fill="url(#rockg)"/><g transform="${r?'rotate(180 25 35)':''}"><g class="tun">${g}</g>${deco}</g></svg>`}
const SAI={break:'💥',fix:'🔧',map:'🗺️',rock:'🪨',trap:'⛓️',free:'🔓',theft:'💰',handsoff:'✋',hats:'🎩',inspect:'🔍',swap:'🔄'},TOOLI={pick:'⛏️',lamp:'🔦',cart:'🛒'};
const SAN={break:'Sabotaggio',fix:'Riparazione',map:'Mappa',rock:'Frana',trap:'Prigione',free:'Libertà',theft:'Furto',handsoff:'Giù le mani',hats:'Cambio cappello',inspect:'Ispezione',swap:'Scambio mani'};
function sabCardH(id,o={}){const K=SAB.C[id];const a=o.attrs||'',st=o.style?`style="${o.style}"`:'';
 if(K.segs)return`<div class="card scard ${o.cls||''}" ${a} ${st}>${tileSVG(id,o.r||0)}</div>`;
 const tools=(K.tools||(K.tool?[K.tool]:[])).map(t=>TOOLI[t]).join('');
 return`<div class="card scard act ${K.a} ${o.cls||''}" ${a} ${st}><div class="sic">${SAI[K.a]}</div><div class="stl">${tools}</div><div class="sname">${SAN[K.a]}</div></div>`}
function sabTargets(s,c){const out=new Set();if(!c)return out;for(let p=0;p<s.n;p++){const K=SAB.C[c];const tools=K.tools||[undefined];if(tools.some(t=>!SAB.act(s,{t:'act',c,to:p,tool:t}).err))out.add(p)}return out}
function sabotH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&s.phase==='play',c=ui.sel[0],K=c&&SAB.C[c];
 const ks=Object.keys(s.board).map(k=>k.split(',').map(Number));const xs=ks.map(k=>k[0]),ys=ks.map(k=>k[1]);
 const x0=Math.min(0,...xs)-1,x1=Math.max(8,...xs)+1,y0=Math.min(-2,...ys)-1,y1=Math.max(2,...ys)+1,cols=x1-x0+1;
 const rotc=ui.srot||0;let hot=new Set();
 if(mine&&c){if(SAB.isPath(c))SAB.placements(s,c).filter(p=>p.r===rotc).forEach(p=>hot.add(p.x+','+p.y));
  else if(K.a==='rock')for(const k in s.board)if(SAB.isPath(s.board[k].id))hot.add(k);
  else if(K.a==='map')[-2,0,2].forEach(y=>{if(s.board['8,'+y]&&s.board['8,'+y].hidden)hot.add('8,'+y)})}
 let cells='';for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=x+','+y,b=s.board[k],h=hot.has(k);
  cells+=`<div class="cell ${h?'hot':''} ${b?'full':''}" ${h?`data-a="cell" data-v="${k}" role="button" tabindex="0"`:''} id="cell${x}_${y}">${b?tileSVG(b.id,b.r,{hidden:b.hidden}):h&&SAB.isPath(c)?`<div class="ghost">${tileSVG(c,rotc)}</div>`:''}</div>`}
 const board=`<div class="mine" style="--tw:${ui.szoom?'46px':`min(48px,calc((min(100vw,620px) - 58px) / ${cols}))`}"><svg width="0" height="0" style="position:absolute"><defs><radialGradient id="rockg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#4a3424"/><stop offset="1" stop-color="#22160e"/></radialGradient></defs></svg><div class="grid" style="grid-template-columns:repeat(${x1-x0+1},var(--tw))">${cells}</div></div>`;
 const T=K&&!K.segs&&!['rock','map'].includes(K.a)&&mine?sabTargets(s,c):new Set();
 const pls=`<div class="splayers" id="players">${s.names.map((n,i)=>{const br=SAB.TOOLS.filter(t=>s.broken[i][t]).map(t=>`<span class="brk">${TOOLI[t]}</span>`).join('');
  return`<div class="sp ${i===s.cur&&s.phase!=='summary'?'act':''} ${T.has(i)?'tgt':''}" ${T.has(i)?`data-a="target" data-v="${i}" role="button" tabindex="0"`:''}><div class="av" id="av${i}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span>${br}${s.trap[i]?'<span class="brk">⛓️</span>':''}${s.theft[i]?'<span class="brk">💰</span>'.repeat(s.theft[i]):''}<span class="hc">${s.hands[i].length}🂠</span></div>`}).join('')}</div>`;
 const role=v>=0&&s.phase!=='summary'?`<div class="srole ${s.roles[v]}"><span>Il tuo ruolo</span><b>${SAB.RN[s.roles[v]]}</b>${(s.priv[v]||[]).map(t=>`<em>🔒 ${esc(t)}</em>`).join('')}</div>`:'';
 const info=`<div class="tinfo"><span class="chip">Round ${s.round}/3</span><span class="chip">Mazzo ${s.deck.length}</span>${s.exp?'<span class="chip sh">Saboteur 2</span>':''}<button class="chip" data-a="szoom">${ui.szoom?'Vista intera':'Ingrandisci'}</button>${v>=0?`<span class="chip hl">Le tue pepite: ${s.score[v]}</span>`:''}</div>`;
 let hint='',ctl='';
 if(mine){if(!c)hint='<span class="muted">Scegli una carta: galleria, azione o da scartare</span>';
  else if(SAB.isPath(c)){const blocked=Object.values(s.broken[s.cur]).some(Boolean)||s.trap[s.cur];hint=blocked?'<span class="chip w">Hai un attrezzo rotto o sei imprigionato: non puoi scavare</span>':hot.size?'<span class="chip hl">Tocca una casella illuminata per scavare</span>':'<span class="chip w">Nessun posto valido con questo verso: prova a ruotare</span>';
   ctl=`<button class="b sm yld" data-a="srot">Ruota ↻</button>`}
  else if(K.a==='rock')hint='<span class="chip">Tocca una galleria da far crollare</span>';else if(K.a==='map')hint='<span class="chip">Tocca una meta coperta per sbirciare</span>';
  else hint=T.size?'<span class="chip">Tocca il giocatore bersaglio</span>':'<span class="chip w">Nessun bersaglio valido</span>';
  ctl+=`<button class="b disc sm" data-a="spass" ${c||!s.hands[s.cur].length?'':'disabled'}>${s.hands[s.cur].length?'Scarta e passa':'Passa'}</button>`;
  if(ui.sfix)hint=`<span class="chip">Quale attrezzo riparare?</span>${ui.sfix.tools.map(t=>`<button class="b sm grn" data-a="sfixt" data-v="${t}">${TOOLI[t]} ${SAB.TN[t]}</button>`).join('')}`}
 const hand=cover?coverH(s.cur):v>=0?fanH(s.hands[v],(id,o)=>sabCardH(id,{...o,r:SAB.isPath(id)?(ui.srot||0):0}),{mine}):'';
 const sum=(s.phase==='summary'||s.phase==='gold')&&!ui.anim?sabSummary(s):'';
 return`${hudH('Saboteur')}${info}${role}${board}${pls}${bubbleH(s,'Scava verso l’oro, o sabota di nascosto se sei un sabotatore!',null)}<div class="prev">${hint}</div><div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${hand}</div>${sum}${rulesH()}${cfgH()}`}
function sabSummary(s){const R0=s.res;if(!R0)return'';const isGold=s.phase==='gold';
 const rows=s.names.map((n,i)=>`<tr class="${R0.win.includes(i)?'w':''}"><td>${esc(n)}</td><td><span class="rtag ${R0.roles[i]}">${SAB.RN[R0.roles[i]]}</span></td><td>+${R0.gold[i]}</td><td><b>${s.score[i]+(isGold?0:0)}</b></td></tr>`).join('');
 let body=`<h2>${esc(R0.txt)}</h2><table class="sumt"><tr><th>Giocatore</th><th>Ruolo</th><th>Round</th><th>Totale</th></tr>${rows}</table>${R0.steal?R0.steal.map(([t,v])=>`<p class="muted">💰 ${esc(s.names[t])} ruba 1 pepita a ${esc(s.names[v])}</p>`).join(''):''}`;
 if(isGold){const gp=s.gp,me=myTurn();body+=`<h3>Spartizione dell’oro</h3><p class="muted">${me?'Scegli la tua pepita, le altre passano al prossimo cercatore.':esc(s.names[s.cur])+' sta scegliendo una pepita…'}</p><div class="nuggets">${gp.cards.map((v,i)=>`<button class="nug" data-a="sgold" data-v="${i}" ${me?'':'disabled'}>${'●'.repeat(v)}<b>${v}</b></button>`).join('')}</div>`}
 else if(s.over){const w=s.over.winners||[];body+=`<h3>Fine della partita</h3><p>${w.map(i=>esc(s.names[i])).join(' e ')} ${w.length>1?'vincono':'vince'} con ${s.over.scores[w[0]]} pepite!</p><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div>`}
 else body+=myTurn()?'<button class="b play" data-a="next">Prossimo round</button>':`<p class="muted">${esc(s.names[s.cur])} avvia il prossimo round…</p>`;
 return`<div class="modal"><div class="box ssum">${body}</div></div>`}
function sabClick(a,v){const s=G;if(a==='srot'){ui.srot=ui.srot?0:1;return render()}if(a==='szoom'){ui.szoom=!ui.szoom;return render()}
 if(!myTurn())return;
 if(a==='sgold')return dispatch({t:'gold',i:+v});
 if(a==='sel'){if(s.phase!=='play')return;ui.sel=ui.sel[0]===v?[]:[v];ui.sfix=null;ui.err='';Snd.play('sel');return render()}
 const c=ui.sel[0];if(!c)return;const K=SAB.C[c];
 if(a==='cell'){const[x,y]=v.split(',').map(Number);if(SAB.isPath(c))return dispatch({t:'path',c,x,y,r:ui.srot||0});if(K.a==='rock')return dispatch({t:'rock',c,x,y});if(K.a==='map')return dispatch({t:'map',c,y})}
 if(a==='target'){const p=+v;if(K.a==='fix'&&K.tools.length>1){const br=K.tools.filter(t=>s.broken[p][t]);if(br.length>1){ui.sfix={to:p,tools:br};return render()}}return dispatch({t:'act',c,to:p})}
 if(a==='sfixt'&&ui.sfix){const f=ui.sfix;ui.sfix=null;return dispatch({t:'act',c,to:f.to,tool:v})}
 if(a==='spass')return dispatch({t:'pass',c})}
const SBFX={async pre(prev,ns,own){const e=ns.ev[0];if(e&&e.t==='path'){Snd.play('whoosh');const it=own&&cap&&cap.length?cap:null;if(it)await flyCards(it,'#cell'+e.x+'_'+e.y,{fade:false,scale:.6},(id)=>sabCardH(id))}return{}},
 async run(prev,ns){for(const e of ns.ev){
  if(e.t==='path'){Snd.play('pick');const c=ctr('#cell'+e.x+'_'+e.y);burst(c.x,c.y,['#c8a27a','#8a6a4a'],14,{v:3,sq:true});bump('#cell'+e.x+'_'+e.y,'newt',700)}
  else if(e.t==='goal'){const c=ctr('#cell'+e.x+'_'+e.y);await W(250);if(e.gold){Snd.play('gold');banner('ORO!','Il filone è stato trovato');burst(c.x,c.y,['#ffd34d','#fff1a0','#fff'],120,{v:9,sq:true});await W(900)}else{Snd.play('coal');flt('#cell'+e.x+'_'+e.y,'carbone…','gry');await W(500)}}
  else if(e.t==='rock'){Snd.play('rock');shake(10);const c=ctr('#cell'+e.x+'_'+e.y);burst(c.x,c.y,['#6b5240','#3a2a1e','#9a8a7a'],40,{v:5,sq:true})}
  else if(e.t==='act'){const icon={break:'💥 rotto!',fix:'🔧 riparato',trap:'⛓️ in prigione',free:'🔓 libero',theft:'💰',handsoff:'✋',hats:'🎩',inspect:'🔍',swap:'🔄'}[e.a]||'';flt('#av'+e.to,icon,e.a==='break'||e.a==='trap'?'red':'grn');Snd.play(e.a==='break'||e.a==='trap'?'impact':'heal')}
  else if(e.t==='map'){Snd.play('deal');flt('#av'+e.p,'🗺️','gold')}
  else if(e.t==='pass'){flt('#av'+e.p,'passa','gry')}
  else if(e.t==='nugget'){Snd.play('draw');flt('#av'+e.p,'+'+e.v+' ●','gold')}
  else if(e.t==='deal'){Snd.play('deal');banner('ROUND '+ns.round,'Controlla in segreto il tuo ruolo')}
  else if(e.t==='round'){Snd.play(e.finder!=null?'win':'lose')}
  else if(e.t==='win'){confetti()}}}};

