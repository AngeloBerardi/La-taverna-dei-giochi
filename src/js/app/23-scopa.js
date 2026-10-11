/* ================= SCOPA ================= */
function scopaH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),c=ui.sel[0],opts=c&&mine?IT.SCOPA.options(s.table,c):[],canT=new Set(opts.flat());
 const T=s.teams,tn=t=>esc(IT.teamName(s,t));
 const score=`<div class="tinfo">${s.scores.map((v,t)=>`<span class="chip ${t%2?'sh':'atk'}">${tn(t)}: <b>${v}</b></span>`).join('')}<span class="chip">a ${s.target} · mano ${s.round}</span></div>`;
 const piles=`<div class="tinfo">${s.taken.map((p,t)=>`<span class="muted">${tn(t)}: ${p.length} carte${s.scope[t]?' · '+'★'.repeat(Math.min(s.scope[t],8))+(s.scope[t]>8?'+':'')+' scope':''}</span>`).join(' · ')}</div>`;
 const table=`<div class="felt"><div class="deckbox">${deckH(s.deck.length)}</div><div class="table" id="table">${s.table.map(x=>`<div class="tslot ${ui.tsel.includes(x)?'tsel':''} ${canT.has(x)?'can':''}">${icardH(x,{attrs:`data-a="tsel" data-v="${x}" tabindex="0" role="button"`,cls:seen.p.has(x)?'':'pop'})}</div>`).join('')||'<span class="muted">Tavolo vuoto</span>'}</div></div>`;seen.p=new Set(s.table);
 let hint='',ok=false;
 if(mine&&s.phase==='play'){if(!c)hint='<span class="muted">Scegli una carta dalla mano</span>';
  else if(!opts.length){ok=!ui.tsel.length;hint=ok?'<span class="chip">Nessuna presa: la carta va in tavola</span>':'<span class="chip w">Con questa carta non puoi prendere nulla</span>'}
  else{const key=k=>k.slice().sort().join();ok=opts.some(o=>key(o)===key(ui.tsel));hint=ok?`<span class="chip hl">Prendi ${ui.tsel.map(IT.fmt).join(' + ')}${ui.tsel.length===s.table.length?' · SCOPA!':''}</span>`:`<span class="chip w">${opts.length>1?'Scegli dal tavolo cosa prendere ('+opts.map(o=>o.map(IT.fmt).join('+')).join(' oppure ')+')':'Tocca le carte da prendere'}</span>`}}
 const ctl=mine&&s.phase==='play'?`<button class="b play" data-a="play" ${c&&ok?'':'disabled'}>${c&&opts.length?'Prendi':'Gioca'}</button>`:'';
 const hand=cover?coverH(s.cur):v>=0?fanH(s.hands[v],icardH,{mine}):'';
 const sum=s.phase==='summary'&&!s.over&&!ui.anim?summaryScopa(s):'';
 return`${hudH('Scopa')}${score}${playersH(s,{teams:s.n===4})}${table}${piles}${bubbleH(s,'Scegli una carta; se può prendere, scegli cosa prendere dal tavolo.',null)}<div class="prev">${hint}</div><div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${hand}</div>${sum}${s.over&&s.res&&!ui.anim?'':''}${endH()}${rulesH()}${cfgH()}`}
function summaryScopa(s){const tn=t=>esc(IT.teamName(s,t)),r=s.res;
 return`<div class="modal"><div class="box"><h2>Fine della mano ${s.round}</h2><table class="sumt"><tr><th></th>${s.scores.map((_,t)=>`<th>${tn(t)}</th>`).join('')}</tr>${r.rows.map(x=>`<tr><td>${x.label}</td>${x.vals.map((v,t)=>`<td class="${x.w===t?'w':''}">${v}${x.w===t?' ✓':''}</td>`).join('')}</tr>`).join('')}<tr class="tot"><td>Punti mano</td>${r.pts.map(v=>`<td>+${v}</td>`).join('')}</tr><tr class="tot"><td>Totale</td>${s.scores.map(v=>`<td>${v}</td>`).join('')}</tr></table>
 ${myTurn()?'<button class="b play" data-a="next">Prossima mano</button>':`<p class="muted">${esc(s.names[s.cur])} distribuisce la prossima mano…</p>`}</div></div>`}
function scopaClick(a,v){const s=G;if(!myTurn()||s.phase!=='play')return;
 if(a==='sel'){if(ui.sel[0]===v){const o=IT.SCOPA.options(s.table,v);if(!o.length)return dispatch({t:'play',c:v,take:[]});if(o.length===1)return dispatch({t:'play',c:v,take:o[0]})}
  ui.sel=[v];const o=IT.SCOPA.options(s.table,v);ui.tsel=o.length===1?o[0].slice():[];ui.err='';Snd.play('sel');return render()}
 if(a==='tsel'){if(!ui.sel[0])return;const i=ui.tsel.indexOf(v);i<0?ui.tsel.push(v):ui.tsel.splice(i,1);Snd.play(i<0?'sel':'unsel');return render()}
 if(a==='play'&&ui.sel[0])return dispatch({t:'play',c:ui.sel[0],take:ui.tsel.slice()})}
const SCFX={async pre(prev,ns,own){const pl=ns.ev.find(e=>e.t==='play');if(!pl)return{};Snd.play('whoosh');
  const items=own&&cap&&cap.length?cap:avatarItems(pl.p,pl.c);await flyCards(items,'#table',{fade:false,scale:.95},icardH);
  if(!pl.take.length){Snd.play('deal');return{}}
  pl.take.forEach(c=>{const el=document.querySelector('#table [data-v="'+c+'"]');if(el)el.parentElement.classList.add('taking')});Snd.play('impact');await W(480);
  const taken=pl.take.map(c=>{const el=document.querySelector('#table [data-v="'+c+'"]');return el?{id:c,r:el.getBoundingClientRect()}:null}).filter(Boolean);return{taken,p:pl.p}},
 async run(prev,ns,own,cx){if(cx.taken&&cx.taken.length){Snd.play('whoosh');flyCards(cx.taken,'#av'+cx.p,{scale:.3},icardH)}
  for(const e of ns.ev){if(e.t==='scopa'){await W(250);const c=ctr('#table');banner('SCOPA!',ns.names[e.p]);burst(c.x,c.y,['#fff','#ffd34d','#5be08a'],90,{v:9,sq:true});Snd.play('kill');shake(10);await W(1000)}
   else if(e.t==='deal'){await W(200);say('Nuove carte!',1200);Snd.play('deal')}
   else if(e.t==='sweep'){say('Le carte rimaste vanno a '+IT.teamName(ns,e.w),1800);await W(400)}
   else if(e.t==='round'){Snd.play('redeem');await W(300)}}
  await W(300);endFx(ns)}};
