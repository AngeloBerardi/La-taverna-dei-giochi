/* ================= THE GANG ================= */
const GCOL=['w','y','o','r'];
function gcardH(id,o={}){if(id==='JX')return`<div class="card X jx ${o.cls||''}" ${o.attrs||''}><div class="ix"><span>J</span><i>★</i></div><div class="ix r"><span>J</span><i>★</i></div><div class="art" style="--su:#7a3cff">${ART.J}<em>★</em></div></div>`;return cardH(id,{...o,nofoil:true})}
function chipH(r,star,o={}){return`<div class="gchip c${GCOL[r]} ${o.dk?'dk':''} ${o.cls||''}" ${o.attrs||''}><b>${star}</b><i>${'★'.repeat(Math.min(star,6))}</i></div>`}
function gangH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),r=s.round,row=s.chips[r];
 const vaults=[0,1,2].map(i=>`<span class="vault ${i<s.vaults?'open':''}" title="Caveau">${i<s.vaults?'◉':'◎'}</span>`).join(''),alarms=Array.from({length:s.maxAlarm},(_,i)=>`<span class="alarm ${i<s.alarms?'on':''}" title="Allarme">${i<s.alarms?'🚨':'◌'}</span>`).join('');
 const cards=[...s.chal.map(c=>`<button class="gc chal" data-a="gcard" data-v="c${c}">⚠ ${esc(GANG.CHAL[c].n)}</button>`),s.spec?`<button class="gc spec ${s.used?'used':''}" data-a="gcard" data-v="s${s.spec}">✦ ${esc(GANG.SPEC[s.spec].n)}${s.used?' (usato)':''}</button>`:''].join('');
 const top=`<div class="heist"><div class="hv">${vaults}</div><div class="hn">Colpo ${s.heist}<small>${GANG.RND_N[r]} · gettoni ${GANG.COL[r]}</small></div><div class="ha">${alarms}</div></div>${cards?`<div class="gcs">${cards}</div>`:''}`;
 const info=[...s.info.map(t=>`<div>${esc(t)}</div>`),...(v>=0?s.priv[v].map(t=>`<div class="pv">🔒 ${esc(t)}</div>`):[])].join('');
 const board=`<div class="board" id="board">${[0,1,2,3,4].map(i=>s.board[i]?`<div class="bslot">${gcardH(s.board[i],{cls:seen.p.has(s.board[i])?'':'flip'})}</div>`:'<div class="bslot empty"></div>').join('')}</div>`;seen.p=new Set(s.board);
 const can=mine&&s.phase==='chips';
 const center=`<div class="center" id="gcenter">${row.map((o,i)=>o<0?chipH(r,i+1,{dk:GANG.locked(s,r,i+1),attrs:`id="gc${i+1}" ${can?`data-a="take" data-v="${i+1}" role="button" tabindex="0"`:''}`,cls:can?'can':''}):`<div class="gchip ghost"></div>`).join('')}</div>`;
 const felt=`<div class="felt gang">${board}${center}</div>`;
 const pl=`<div class="gplayers" id="players">${s.names.map((n,i)=>{const hist=[0,1,2,3].map(k=>{const st=s.chips[k].indexOf(i)+1;if(k>r||!st)return`<span class="gslot"></span>`;if(s.hidden[k]&&k<r)return`<span class="gslot">?</span>`;
   const isCur=k===r,steal=isCur&&can&&i!==s.cur&&!GANG.locked(s,r,st);return chipH(k,st,{cls:(isCur?'cur ':'old ')+(steal?'can':''),dk:GANG.locked(s,k,st)&&k<3,attrs:isCur?`id="pc${i}" ${steal?`data-a="take" data-v="${st}" role="button" tabindex="0"`:''}`:''})}).join('');
  return`<div class="gp ${i===s.cur&&!s.over&&s.phase!=='summary'?'act':''}"><div class="av" id="av${i}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}${s.muscle===i?' 💪':''}</span><div class="hist">${hist}</div></div>`}).join('')}</div>`;
 let bub='',ctl='',extra='';
 if(s.phase==='chips'){bub=bubbleH(s,'Prendi un gettone: più stelle = mano più forte. Puoi rubarlo a un altro o passare se la classifica ti convince.',null);
  if(mine){const has=row.indexOf(s.cur)>=0;ctl=`<button class="b disc" data-a="gpass" ${has?'':'disabled'}>${has?'Passo':'Prendi un gettone'}</button>${s.spec&&!s.used&&GANG.SPEC[s.spec].use?`<button class="b gold sm" data-a="gspec">Usa ${esc(GANG.SPEC[s.spec].n)}</button>`:''}`;
   if(ui.gspec)extra=specPanel(s)}}
 else if(s.phase==='hack')bub=bubbleH(s,'Hacker: tocca la carta da scartare.',null);
 else if(s.phase==='coord')bub=bubbleH(s,'Coordinatore: tocca la carta da passare a sinistra.',null);
 else if(s.phase==='guess'){const g=s.guess,kind=g.kind==='both'?(g.done.retina==null?'retina':'finger'):g.kind;bub=bubbleH(s,`Decidete insieme: ${kind==='retina'?'quale valore ha sicuramente':'che combinazione ha'} ${esc(s.names[g.top])} (rosso più alto)?`,`La squadra deve indovinare la ${kind==='retina'?'scansione retina':'impronta'} di ${esc(s.names[g.top])}`);
  if(mine)extra=`<div class="guess">${kind==='retina'?['2','3','4','5','6','7','8','9','10','J','Q','K','A'].map(x=>`<button class="b sm" data-a="gguess" data-v="retina|${x}">${x}</button>`).join(''):GANG.CAT.slice(0,9).map((x,i)=>`<button class="b sm" data-a="gguess" data-v="finger|${i}">${x}</button>`).join('')}</div>`}
 const hand=cover?coverH(s.cur):v>=0?`<div class="gpocket">${fanH(s.hands[v],gcardH,{mine:mine&&['hack','coord','chips'].includes(s.phase)})}<button class="b sm" data-a="hguide">Guida alle mani</button>${s.board.length?`<span class="chip hl">Ora hai: ${GANG.CAT[GANG.handOf(s,v)[0]]}</span>`:''}</div>`:'';
 const sum=s.phase==='summary'&&!ui.anim?gangSummary(s):'';
 return`${hudH('The Gang')}${top}${info?`<div class="ginfo">${info}</div>`:''}${felt}${pl}${bub}${extra}<div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${hand}</div>${sum}${ui.gcard?gcardModal():''}${ui.hguide?handGuide():''}${rulesH()}${cfgH()}`}
function specPanel(s){const id=s.spec,me=s.cur;let body='';
 if(id===1)body=`<p>Tocca una tua carta, poi scegli a chi mostrarla in segreto.</p><div class="row">${s.names.map((n,i)=>i===me?'':`<button class="b sm" data-a="gdo" data-v="${i}" ${ui.sel.length===1?'':'disabled'}>A ${esc(n)}</button>`).join('')}</div>`;
 else if(id===4)body=`<p>Scegli un valore: annuncerai quante carte di quel valore hai.</p><div class="guess">${['2','3','4','5','6','7','8','9','10','J','Q','K','A'].map(x=>`<button class="b sm" data-a="gdo" data-v="${x}">${x}</button>`).join('')}</div>`;
 else if(id===7)body=`<p>Tocca la carta da sostituire con il Fante speciale.</p><button class="b play sm" data-a="gdo" data-v="x" ${ui.sel.length===1?'':'disabled'}>Sostituisci</button>`;
 else if(id===10)body=`<p>Chi riceve i Muscoli?</p><div class="row">${s.names.map((n,i)=>`<button class="b sm" data-a="gdo" data-v="${i}">${esc(n)}</button>`).join('')}</div>`;
 else body=`<p>${esc(GANG.SPEC[id].d)}</p><button class="b play sm" data-a="gdo" data-v="x">Conferma</button>`;
 return`<div class="panel col gspec"><h3>${esc(GANG.SPEC[id].n)}</h3>${body}<button class="b sm" data-a="gspec">Annulla</button></div>`}
function gcardModal(){const k=ui.gcard[0],id=+ui.gcard.slice(1),c=k==='c'?GANG.CHAL[id]:GANG.SPEC[id];return`<div class="modal"><div class="box gcardbox ${k==='c'?'chal':'spec'}"><div class="gnum">${k==='c'?'Sfida':'Specialista'} ${id}</div><h2>${esc(c.n)}</h2><p>${esc(c.d)}</p><button class="b gold" data-a="gcard">Chiudi</button></div></div>`}
function handGuide(){const ex=[['AH','KH','QH','JH','10H'],['9S','8S','7S','6S','5S'],['QC','QD','QS','QH','3D'],['KS','KD','KC','4H','4S'],['AD','JD','8D','5D','2D'],['9C','8H','7S','6D','5C'],['7H','7C','7D','KS','2H'],['10S','10D','4C','4H','AS'],['JC','JD','9S','6H','3C'],['AS','QD','9H','6C','3S']];
 return`<div class="modal"><div class="box"><h2>Le mani del poker</h2><p class="muted">Dalla più forte alla più debole. Conta la migliore combinazione di 5 carte tra le tue e quelle sul tavolo.</p>${ex.map((h,i)=>`<div class="hg"><b>${GANG.CAT[9-i]}</b><div class="hgc">${h.map(c=>cardH(c,{cls:'sm',nofoil:true})).join('')}</div></div>`).join('')}<p class="muted">Pareggi: decide la carta più alta (kicker). L’Asso vale alto o basso solo nelle scale (A-2-3-4-5).</p><button class="b gold" data-a="hguide">Chiudi</button></div></div>`}
function gangSummary(s){const R0=s.res;if(!R0)return'';const rows=R0.order.map((p,i)=>`<div class="sd ${!R0.ok&&R0.bad===i?'bad':''}" style="--d:${(i*.35).toFixed(2)}s"><span class="gchip cr sm"><b>${s.chips[3].indexOf(p)+1}</b></span><span class="n">${esc(s.names[p])}${s.muscle===p?' 💪':''}</span><div class="hgc">${R0.hands[i].map(c=>gcardH(c,{cls:'sm'})).join('')}</div><em>${GANG.CAT[R0.cats[i]]}</em></div>`).join('');
 const nx=s.next&&(s.next.chal||s.next.spec)?(s.next.chal?`<p class="chip">Prossimo colpo – Sfida: ${esc(GANG.CHAL[s.next.chal].n)}</p>`:`<p class="chip hl">Prossimo colpo – Specialista: ${esc(GANG.SPEC[s.next.spec].n)}</p>`):'';
 const end=s.over?`<div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div>`:(myTurn()?'<button class="b play" data-a="next">Prossimo colpo</button>':`<p class="muted">${esc(s.names[s.cur])} prepara il prossimo colpo…</p>`);
 return`<div class="modal ${s.over?'late':''}" style="--late:${(.4*SP).toFixed(2)}s"><div class="box gsum ${R0.ok?'ok':'ko'}"><h2>${s.over?(s.over.win?'Colpo grosso! Avete vinto':'Arrestati! Avete perso'):R0.ok?'Caveau aperto!':'Allarme!'}</h2><div class="hgc board2">${s.board.map(c=>gcardH(c,{cls:'sm'})).join('')}</div>${rows}${R0.ok?'':`<p class="why">${esc(R0.why)}</p>`}<p class="muted">Caveau ${s.vaults}/3 · Allarmi ${s.alarms}/${s.maxAlarm}</p>${nx}${end}</div></div>`}
function gangClick(a,v){const s=G;
 if(a==='gcard'){ui.gcard=ui.gcard?null:v;return render()}if(a==='hguide'){ui.hguide=!ui.hguide;return render()}
 if(!myTurn())return;
 if(a==='take')return dispatch({t:'take',star:+v});
 if(a==='gpass')return dispatch({t:'pass'});
 if(a==='gspec'){ui.gspec=!ui.gspec;ui.sel=[];return render()}
 if(a==='gguess'){const[k,x]=v.split('|');return dispatch({t:'guess',kind:k,v:x})}
 if(a==='sel'){if(s.phase==='hack')return dispatch({t:'hackdisc',c:v});if(s.phase==='coord')return dispatch({t:'coordpick',c:v});if(ui.gspec&&[1,7].includes(s.spec)){ui.sel=[v];return render()}return}
 if(a==='gdo'){const id=s.spec,act={t:'spec'};if(id===1){act.to=+v;act.c=ui.sel[0]}else if(id===4)act.v=v;else if(id===7)act.c=ui.sel[0];else if(id===10)act.to=+v;ui.gspec=false;return dispatch(act)}}
async function flyHtml(html,from,toSel){if(RM||!from)return;const T=ctr(toSel);const d=document.createElement('div');d.innerHTML=html;const c=d.firstElementChild;c.style.cssText=`position:fixed;left:${from.left}px;top:${from.top}px;z-index:78;margin:0`;$('#fx').appendChild(c);
 const a=c.animate([{transform:'none'},{transform:`translate(${(T.x-from.left-from.width/2)*.5}px,${(T.y-from.top-from.height/2)*.5-30}px) scale(1.4)`,offset:.5},{transform:`translate(${T.x-from.left-from.width/2}px,${T.y-from.top-from.height/2}px)`}],{duration:420*SP,easing:'cubic-bezier(.5,0,.5,1)',fill:'forwards'});await a.finished.catch(()=>{});c.remove()}
const GAFX={async pre(prev,ns){const e=ns.ev.find(x=>x.t==='take');if(e&&prev){const src=e.from>=0?document.getElementById('pc'+e.from):document.getElementById('gc'+e.star);const r=src?src.getBoundingClientRect():null;Snd.play('chip');await flyHtml(chipH(e.r,e.star),r,'#av'+e.p)}return{}},
 async run(prev,ns){for(const e of ns.ev){
  if(e.t==='take'){Snd.play('chip');if(e.from>=0)flt('#av'+e.from,'rubato!','gry')}
  else if(e.t==='pass'){flt('#av'+e.p,'passo','gry')}
  else if(e.t==='roundEnd'){}
  else if(e.t==='reveal'){Snd.play('deal');await W(150);for(let i=0;i<e.k;i++){setTimeout(()=>Snd.play('deal'),i*120*SP)}const b=ctr('#board');burst(b.x,b.y,['#fff','#9fe8c0'],18,{v:3});await W(400)}
  else if(e.t==='redraw'){flt('#av'+e.p,'nuove carte!','gold');Snd.play('draw')}
  else if(e.t==='deal'){Snd.play('deal')}
  else if(e.t==='spec'){banner(GANG.SPEC[e.id].n.toUpperCase(),'Specialista in azione');Snd.play('turn');await W(700)}
  else if(e.t==='showdown'){await W(200);if(e.ok){Snd.play('vault');banner('CAVEAU APERTO!','Le mani erano in ordine');const c=ctr('.felt');burst(c.x,c.y,['#ffd34d','#fff','#c8a24a'],100,{v:9,sq:true})}else{Snd.play('alarm');banner('ALLARME!','Qualcuno ha sbagliato i conti','red');add(null,'flash',null,null,600);shake(12)}await W(900)}
  else if(e.t==='win'){Snd.play('win');confetti()}else if(e.t==='lose'){Snd.play('lose')}}}};

