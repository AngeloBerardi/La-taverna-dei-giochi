/* ================= AGENTI SEGRETI (gioco di parole a squadre) ================= */
const SPCOL={R:'#d8342c',B:'#2468c9',N:'#cdbb91',A:'#1b1b24'};
const SPT=['Rossi','Blu'];
function spieH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,t=s.turnT,spy=v===0||v===1,show=!cover&&(spy||!!s.over);
 const lr=SPIE.left(s,0),lb=SPIE.left(s,1);
 const chips=`<span class="chip" style="border-color:${SPCOL.R}">Rossi ${lr}</span><span class="chip" style="border-color:${SPCOL.B}">Blu ${lb}</span>${s.clue?`<span class="chip pal">Indizio «${esc(s.clue.w)}» ${s.clue.k}</span>`:''}${show&&!s.over?'<span class="chip">Vedi la chiave</span>':''}`;
 const strip=stripH(s,i=>({c:SPCOL[i%2?'B':'R'],b:i<2?'★':''}));
 const grid=s.words.map((w,i)=>{const k=s.key[i],r=s.rev[i],can=mine&&s.phase==='guess'&&!r;
  return`<button class="spc ${r?'rev k'+k:''} ${!r&&show?'hint h'+k:''} ${can?'can':''}" style="--sc:${SPCOL[k]}" ${can?`data-a="spcard" data-v="${i}"`:'disabled'}><span>${esc(w)}</span></button>`}).join('');
 const mid=`<div class="spgrid">${cover?s.words.map(w=>`<div class="spc"><span>${esc(w)}</span></div>`).join(''):grid}</div>`;
 const pl=s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}"><div class="av" style="background:${SPCOL[i%2?'B':'R']}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${i<2?'Spia':'Agente'} · ${SPT[i%2]}</span></div>`).join('');
 let ctl='',hint='';
 if(mine&&s.phase==='clue'){hint=`Dai un indizio di una sola parola e un numero: quante parole della tua squadra vuoi far trovare. Con 0 gli agenti non hanno limite.`;
  ctl=`<div class="spform"><input type="text" id="spw" maxlength="20" placeholder="Indizio" value="${esc(ui.spw||'')}" oninput="ui.spw=this.value" autocomplete="off" autocapitalize="none"><select id="spk" class="sel" onchange="ui.spk=this.value">${[0,1,2,3,4,5,6,7,8,9].map(k=>`<option value="${k}" ${+ui.spk===k||(ui.spk==null&&k===2)?'selected':''}>${k}</option>`).join('')}</select><button class="b gold" data-a="spclue">Invia</button></div>`}
 else if(mine&&s.phase==='guess'){hint=`Parlate con la squadra, poi tocca la parola che scegliete. Tentativi rimasti: ${s.left>50?'senza limite':s.left}.`;ctl=s.tried?`<button class="b disc sm" data-a="spend">Fermiamoci qui</button>`:''}
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">🕵️</div><h2>Vincono i ${SPT[s.over.win]}!</h2><p class="muted">${s.over.why==='trappola'?'L’altra squadra ha toccato la trappola.':'Tutte le parole della squadra sono state trovate.'}</p><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const who=s.over?'':`<b style="color:${SPCOL[t?'B':'R']}">${SPT[t]}</b>`;
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${mine?`<b>${esc(s.names[s.cur])}</b>, tocca a te!`:`Squadra ${who}: ${s.phase==='clue'?'la spia pensa all’indizio':'gli agenti scelgono'}<span class="dots"></span>`}${mine&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 return fixH({title:'Agenti Segreti',chips,strip,mid,bot:bub+`<div class="ctl kctl">${ctl}</div>`,players:pl,end})}
function spieClick(a,v){const s=G;if(!myTurn())return;
 if(a==='spclue'){const w=(document.getElementById('spw')||{}).value||ui.spw||'',k=+((document.getElementById('spk')||{}).value||ui.spk||2);ui.spw='';return dispatch({t:'clue',w,k})}
 if(a==='spcard')return dispatch({t:'guess',i:+v});
 if(a==='spend')return dispatch({t:'end'})}
const SPFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='clue'){Snd.play('whoosh');await W(260)}
  else if(e.t==='reveal'){Snd.play(e.k==='A'?'atk':e.k==='N'?'draw':'deal');await W(e.k==='A'?400:220)}
  else if(e.t==='turn'){Snd.play('turn');await W(120)}}
  endFx(ns)}};
