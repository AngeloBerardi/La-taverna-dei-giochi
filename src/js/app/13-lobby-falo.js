/* ---- Lobby: falò + scaffale ---- */
const TVC={carte:{f:'#c8434a',s:'#8e1b22',e:'#e8767c',n:'CARTE'},tavolo:{f:'#e8b83a',s:'#a67d12',e:'#fff0a0',n:'DA TAVOLO'},coop:{f:'#3f8fe0',s:'#1d5aa0',e:'#7ab8f0',n:'COOPERATIVI'},solo:{f:'#8a62d6',s:'#4d3490',e:'#b99af0',n:'SOLITARI'}};
const TVG={regicide:['coop','REGICIDE'],briscola:['carte','BRISCOLA'],scopa:['carte','SCOPA'],burraco:['carte','BURRACO'],gang:['coop','THE GANG'],saboteur:['carte','SABOTEUR'],island:['solo','ISOLA'],machiavelli:['carte','MACHIAVELLI'],azul:['tavolo','AZUL']};
const tvInfo=g=>TVG[g.id]||['tavolo',g.name.toUpperCase().slice(0,11)];
const TVP=[['#c8262f','#8e1b22','#2f8a5b','#1f6a43'],['#2c7fd6','#123f7a','#e2b13c','#a67d12'],['#7d55c7','#40287a','#d8402f','#8e1b22'],['#e8742c','#9a4a12','#3f8fe0','#1d5aa0'],['#2fa65b','#17603a','#c8434a','#8e1b22'],['#e8b83a','#a67d12','#7d55c7','#40287a'],['#d85a9a','#8a2a5a','#2f8a5b','#1f6a43'],['#5cc8d8','#1d6a7a','#e8742c','#9a4a12']];
const tvExt=c=>{let a=[];for(let i=1;i<=6;i++)a.push(i+'px -'+i+'px 0 '+c);a.push('12px 5px 12px rgba(0,0,0,.55)');return a.join(',')};
const tvSprite=c=>`<svg viewBox="0 0 16 18" width="44" height="50" shape-rendering="crispEdges" aria-hidden="true" style="display:block;filter:drop-shadow(3px 0 0 #05081c) drop-shadow(-3px 0 0 #05081c) drop-shadow(0 3px 0 #05081c) drop-shadow(0 -3px 0 #05081c)"><rect x="8" y="0" width="2" height="1" fill="#fff3c4"/><g fill="${c[0]}"><rect x="6" y="1" width="4" height="1"/><rect x="5" y="2" width="6" height="1"/></g><rect x="4" y="3" width="8" height="1" fill="${c[1]}"/><g fill="#f2c29b"><rect x="5" y="4" width="6" height="3"/><rect x="6" y="7" width="4" height="1"/><rect x="3" y="12" width="1" height="1"/><rect x="12" y="12" width="1" height="1"/></g><g fill="#1a1206"><rect x="6" y="5" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/></g><rect x="7" y="6" width="2" height="1" fill="#b5533c"/><g fill="${c[2]}"><rect x="4" y="8" width="8" height="3"/><rect x="4" y="12" width="8" height="1"/><rect x="3" y="9" width="1" height="3"/><rect x="12" y="9" width="1" height="3"/></g><g fill="${c[3]}"><rect x="5" y="13" width="6" height="1"/><rect x="7" y="9" width="2" height="1"/></g><rect x="4" y="11" width="8" height="1" fill="#e9c46a"/><g fill="#3a2f6b"><rect x="5" y="14" width="3" height="3"/><rect x="8" y="14" width="3" height="3"/></g><g fill="#4a2c14"><rect x="4" y="17" width="4" height="1"/><rect x="8" y="17" width="4" height="1"/></g></svg>`;
const TVEMO=['😀','😂','😍','😎','😭','😡','👍','🎉','🍻','🔥'];
function tvBub(s){const now=Date.now();const m=members().find(x=>x.id===s.dev);const em=m&&m.emo&&m.emo[s.k];if(em&&now-em.t<5000&&now-em.t>-3000)return`<div class="tvbub e">${esc(em.e)}</div>`;
 for(let i=R.chat.length-1;i>=0;i--){const x=R.chat[i];if(now-x.t>7000)break;if(x.dev===s.dev&&(x.k||'m')===s.k)return`<div class="tvbub">${esc(x.text.length>34?x.text.slice(0,33)+'…':x.text)}</div>`}return''}

function emoBar(){if(!R.on)return'';const myKeys=[{k:'m'},...(R.mine.guests||[]).map(g=>({k:g.k}))],ek=myKeys.some(x=>x.k===ui.ek)?ui.ek:'m';
 return`<div class="emos">${TVEMO.map(e=>`<button class="emo" data-a="emo" data-v="${e}|${ek}" aria-label="Emoji ${e}">${e}</button>`).join('')}</div>`}
function chatH(){if(!R.on)return'';const myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))],ek=myKeys.some(x=>x.k===ui.ek)?ui.ek:'m';
 return`<div class="panel col chatp"><h3>Chat della stanza</h3><div class="chatlog" id="chatlog">${R.chat.map(x=>`<div class="cm ${x.dev===ME.dev?'me':''}"><b>${esc(x.name)}</b> ${esc(x.text)}</div>`).join('')||'<span class="muted">Nessun messaggio: scrivi il primo!</span>'}</div>
 <div class="row"><input type="text" id="cmsg" maxlength="120" placeholder="Scrivi un messaggio" value="${esc(ui.cm||'')}" autocomplete="off" style="flex:1"><button class="b sm disc" data-a="chatsend">Invia</button></div>
 ${myKeys.length>1?`<div class="row">${myKeys.map(x=>`<button class="vote ${x.k===ek?'on':''}" data-a="ek" data-v="${x.k}">${esc(x.name)}</button>`).join('')}</div>`:''}
</div>`}
let tvSeats=[],isoC=null,isoEl=null,isoSaveT=0;const isoSeen={};
const isoSave=()=>{clearTimeout(isoSaveT);isoSaveT=setTimeout(()=>{saveMine()},400)};
function tvScene(S){tvSeats=S;const N=S.length;
 return`<div class="tvscene2" role="group" aria-label="Il falò con ${N} giocator${N===1?'e':'i'}: tocca per muoverti">
 <div class="tvplq">${R.on?`<span>STANZA</span><b>${esc(R.code||'…')}</b><button class="tvcp" data-a="copy">COPIA</button>`:`<span>SU QUESTO TELEFONO</span>`}</div>
 <div id="isohost"></div>${emoBar()}</div>`}
/* collega il diorama persistente (non si ricrea a ogni render) e sincronizza posizioni, emote e chat */
function tvIso(){const h=document.getElementById('isohost');if(!h)return;
 if(!isoEl){isoEl=document.createElement('div');isoEl.className='isoel';
  isoC=ISO.create(isoEl,{players:[],bar:false,
   onShelf(){const e=$('.tvshelf');if(e)e.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'})},
   onSelect(id){ui.ek=id.split('|')[1]},
   onMove(id,x,y){if(id===ME.dev+'|m'){R.mine.pos={x:+x.toFixed(2),y:+y.toFixed(2),t:Date.now()};isoSave()}},
   onEmote(id,e){const[d,k]=id.split('|');if(d!==ME.dev)return;const t=Date.now();isoSeen['e'+id]=t;(R.mine.emo=R.mine.emo||{})[k]={e,t};isoSave()}})}
 h.appendChild(isoEl);isoC.resize();
 const S=tvSeats,now=Date.now();
 isoC.setPlayers(S.map(s=>{const m=members().find(x=>x.id===s.dev);return{id:s.dev+'|'+s.k,name:s.name,own:s.dev===ME.dev,guest:s.k!=='m',sync:!!(m&&m.pos&&s.k==='m'&&s.dev!==ME.dev)}}));
 S.forEach(s=>{const id=s.dev+'|'+s.k,m=members().find(x=>x.id===s.dev);if(!m)return;
  const em=m.emo&&m.emo[s.k];if(em&&isoSeen['e'+id]!==em.t){isoSeen['e'+id]=em.t;if(now-em.t<5000&&now-em.t>-3000)isoC.emote(id,em.e,true)}
  if(s.k==='m'&&s.dev!==ME.dev&&m.pos&&isoSeen['p'+id]!==m.pos.t){isoSeen['p'+id]=m.pos.t;isoC.setRemote(id,m.pos.x,m.pos.y)}});
 for(let i=R.chat.length-1;i>=0&&i>R.chat.length-8;i--){const x=R.chat[i];if(now-x.t>7000)break;isoC.say(x.dev+'|'+(x.k||'m'),x.text,x.t)}}
function tvShelf(list,top,N,myKeys,busy){
 const cat=ui.cat||'tutti',q=(ui.q||'').trim().toLowerCase();
 const pick=list.find(x=>x.g.id===ui.pick)||top||list[0];
 const order=['carte','tavolo','coop','solo'].filter(k=>list.some(x=>tvInfo(x.g)[0]===k));
 const chips=[['tutti','TUTTI ('+list.length+')'],...order.map(k=>[k,TVC[k].n+' ('+list.filter(x=>tvInfo(x.g)[0]===k).length+')'])].map(([k,l])=>`<button class="tvchip ${cat===k?'on':''}" data-a="tvcat" data-v="${k}" aria-pressed="${cat===k}">${l}</button>`).join('');
 const vis=list.filter(x=>(cat==='tutti'||tvInfo(x.g)[0]===cat)&&(!q||x.g.name.toLowerCase().includes(q)));
 let rows='';
 order.forEach(k=>{const items=vis.filter(x=>tvInfo(x.g)[0]===k);
  for(let i=0;i<items.length;i+=6){const ch=items.slice(i,i+6);
   rows+=`<div class="tvrow">${i===0?`<div class="tvplate">${TVC[k].n}<small>${items.length}</small></div>`:''}<div class="tvboxes">${ch.map(({g,ok,v},j)=>{const c=TVC[k],on=pick&&pick.g===g,h=112+((i+j)*7%5)*4;
    return`<button class="tvbox" data-a="tvpick" data-v="${g.id}" aria-pressed="${!!on}" aria-label="${esc(g.name)}, ${g.range} giocatori, ${v} voti${ok?'':', non disponibile con '+N}" style="height:${h}px;background:linear-gradient(90deg,${ok?c.f:'#7a819e'},${ok?c.s:'#4a5072'});box-shadow:${tvExt(ok?c.s:'#4a5072')};border-top-color:${ok?c.e:'#aab0c8'};transform:translateY(${on?-14:0}px);opacity:${ok?1:.65}"><span class="tvv">${tvInfo(g)[1]}</span><span class="tvt">${g.range.replace(' o ','/')}${v?' ★'+v:''}</span></button>`}).join('')}</div><div class="tvplank"></div></div>`}});
 if(!vis.length)rows='<div class="tvnone">NESSUN GIOCO TROVATO</div>';
 const g=pick&&pick.g,ok=pick&&pick.ok,v=pick?pick.v:0;
 const det=g?`<div class="tvdet"><div class="tvdh"><div><div class="tvdn">${g.name}</div><div class="tvdm">${g.range} giocatori${ok?' · '+g.mode(N):' · non disponibile con '+N}</div></div><div class="tvdv"><b>${v}</b><small>VOTI</small></div></div>
  <p class="tvdd">${g.desc}</p>${ok?`<div class="tvdl">TOSTA IL TUO MARSHMALLOW</div><div class="votes">${myKeys.map(x=>{const on=(R.mine.votes[x.k]||[]).includes(g.id);return`<button class="vote ${on?'on':''}" data-a="vote" data-v="${g.id}|${x.k}">${on?'★':'☆'} ${esc(x.name)}</button>`}).join('')}</div>`:''}
  <div class="row">${g.opts&&ok?`<select class="sel sm" id="opt-${g.id}" aria-label="${g.opts.label}">${g.opts.vals.map(([k,l])=>`<option value="${k}" ${(ui.opts[g.id]||g.opts.vals[0][0])===k?'selected':''}>${l}</option>`).join('')}</select>`:''}<button class="b sm ${ok?'play':''}" data-a="start" data-v="${g.id}" ${ok&&!busy?'':'disabled'}>Gioca</button><button class="b sm" data-a="rules" data-v="${g.id}">Regole</button></div></div>`:'';
 return`<div class="tvshelf"><div class="tvsh"><div class="tvst2">LO SCAFFALE</div><div class="tvsn">${vis.length} ${vis.length===1?'gioco':'giochi'} · ${N} giocator${N===1?'e':'i'}</div></div>
 <input type="text" id="tvq" class="tvq" placeholder="Cerca tra i giochi" aria-label="Cerca tra i giochi" value="${esc(ui.q||'')}" autocomplete="off"><div class="tvchips">${chips}</div>${rows}<p class="tvhint">Tocca una scatola per scegliere. Ogni giocatore può votare fino a 3 giochi.</p>${det}</div>`}

function roomH(){const M=members(),S=lobbySeats(),N=S.length,T=tally(N),busy=R.on&&R.doc&&R.doc.phase==='play';
 const myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))];
 const list=GAMES.map(g=>({g,ok:g.ok(N),v:T[g.id]||0})).sort((a,b)=>(b.ok-a.ok)||(b.v-a.v));
 const top=list.find(x=>x.ok);
 const hint=R.on?`<p class="muted" style="margin:0">Gli amici aprono questa pagina, scrivono il loro nome e inseriscono il codice sulla targa. ${R.mode==='p2p'?'<b>Online diretto</b>: tieni questa pagina aperta, sei tu a fare da tavolo.':''}</p><button class="b sm" data-a="copy">Copia invito</button>`:`<p class="muted" style="margin:0">Non riesco a collegarmi per il gioco online (server di incontro non raggiungibile da questa pagina). Intanto puoi aggiungere ospiti e passarvi il telefono.</p><button class="b sm" data-a="retrynet">Riprova il collegamento</button>`;
 const mem=M.map(m=>`<div class="mem"><div class="pl ${m.id===ME.dev?'act':''}"><div class="av">${esc((m.name||'?')[0])}</div><span class="n">${esc(m.name||'?')}${m.id===ME.dev?' (tu)':''}</span>${m.id!==ME.dev&&R.on?`<button class="x" data-a="rmmember" data-v="${m.id}" aria-label="Rimuovi ${esc(m.name)}">✕</button>`:''}</div>
  ${(m.guests||[]).map(g=>`<div class="pl guest"><div class="av">${esc(g.name[0]||'?')}</div><span class="n">${esc(g.name)} <small class="muted">ospite di ${esc(m.name)}</small></span>${m.id===ME.dev?`<button class="x" data-a="rmguest" data-v="${g.k}" aria-label="Rimuovi ${esc(g.name)}">✕</button>`:''}</div>`).join('')}</div>`).join('');
 const games=tvShelf(list,top,N,myKeys,busy),scene=tvScene(S);
 return`${hudH()}${scene}<div class="panel col">${hint}<div class="mems">${mem}</div>
 <div class="row"><input type="text" id="gname" maxlength="14" placeholder="Nome ospite" style="flex:1"><button class="b sm disc" data-a="addguest">+ Ospite</button></div>
 <p class="muted" style="margin:0">Gli ospiti giocano su questo telefono: ve lo passate a ogni turno.</p></div>
 ${busy?`<div class="bubble">Partita di <b>${GN(R.doc.game)}</b> in corso in questa stanza. Potrai unirti alla prossima.</div>`:''}
 <h3 style="margin-top:4px">Giochi per ${N} giocator${N===1?'e':'i'}</h3>${N>10?'<p class="err">Massimo 10 giocatori per tavolo: togliete qualche ospite.</p>':''}
 ${top&&!busy?`<button class="b play big" data-a="start" data-v="${top.g.id}">Gioca a ${top.g.name}${top.v?` · ${top.v} vot${top.v===1?'o':'i'}`:''}</button>`:''}
 ${chatH()}
 ${games}
 ${R.on?`<div class="panel col"><h3>Entra nella stanza di un amico</h3><div class="row"><input type="text" id="jc" maxlength="6" placeholder="Codice" style="flex:1;text-transform:uppercase"><button class="b sm disc" data-a="join">Entra</button></div><button class="b sm" data-a="newroom">Crea una stanza nuova</button></div>`:''}
 ${!R.on&&(()=>{try{return JSON.parse(ST('rg-off')||'null')?.game}catch(e){return null}})()?'<button class="b gold" data-a="resume">Riprendi la partita interrotta</button>':''}
 <div class="err" role="alert">${esc(ui.err)}</div><div style="height:20px"></div>${rulesH()}${cfgH()}`}
function coverH(i){const n=esc(G.names[i]);return`<div class="cover panel"><h3>Passa il telefono a</h3><div class="nm">${n}</div><button class="b play" data-a="reveal">Sono ${n}</button></div>`}
function endH(){const s=G;if(!s.over||ui.anim)return'';let body='';
 if(s.g==='regicide')body=`<div class="crown">${s.over.win?'👑':'💀'}</div><h2>${s.over.win?'Regicidio compiuto!':'Il regno è perduto'}</h2>${s.over.win?(s.over.medal?`<div class="medal">${{gold:'🥇 Oro',silver:'🥈 Argento',bronze:'🥉 Bronzo'}[s.over.medal]}</div>`:'')+'<p>Il Re Oscuro è caduto. La Taverna brinda alla vostra gloria!</p>':`<p>${esc(s.over.reason)}.</p><p class="muted">La corruzione dilaga. Ma gli eroi tornano sempre.</p>`}<p class="muted">Nemici sconfitti: ${12-s.castle.length-(s.en?1:0)} su 12</p>`;
 else{const tn=t=>esc(IT.teamName(s,t)),w=s.over.win;body=`<div class="crown">${w==null?'🤝':'🏆'}</div><h2>${w==null?'Pareggio!':'Vince '+tn(w)+'!'}</h2><div class="scores">${s.over.scores.map((v,t)=>`<div class="${t===w?'w':''}"><span>${tn(t)}</span><b>${v}</b></div>`).join('')}</div>${s.g==='briscola'?'<p class="muted">Su 120 punti totali</p>':''}`}
 const win=s.g==='regicide'?s.over.win:s.over.win!=null&&isMine(s.over.win===null?-1:s.over.win)||s.over.win!=null&&s.n===4&&local().some(i=>i%2===s.over.win);
 return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox ${s.g==='regicide'?(s.over.win?'win':'lose'):'win'}">${body}<div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function playersH(s,{teams=false,extra}={}){return`<div class="players" id="players">${s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''} ${teams?'t'+(i%2):''}"><div class="av" id="av${i}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${s.hands[i].length}🂠</span></div>`).join('')}${extra||''}</div>`}
function fanH(cards,rend,{mine,dv,many}={}){const owner=viewer(),n=cards.length,same=seen.h&&seen.h.owner===owner,prevIds=new Set(same?seen.h.ids:[]),now=Date.now()/1000;
 const h=`<div class="hand ${many?'many':''}" id="hand">${cards.map((c,i)=>{const mid=(n-1)/2,rot=many?0:(i-mid)*(n>6?3.2:4),ty=many?0:Math.pow(Math.abs(i-mid),2)*1.8,isNew=seen.h!==null&&!prevIds.has(c);
  return`<div class="slot ${ui.sel.includes(c)?'sel':''}" style="--rot:${rot}deg;--ty:${ty}px">${rend(c,{cls:(mine?'':'off ')+(isNew?'deal ':(many?'':'fl8 ')),style:`--fd:-${((now+i*.43)%3.6).toFixed(2)}s`,attrs:`data-a="sel" data-v="${c}" tabindex="0" role="button"`,dv:dv?dv(c):0,nofoil:many})}</div>`}).join('')||'<span class="muted">Nessuna carta in mano</span>'}</div>`;
 seen.h={owner,ids:cards};return h}
function bubbleH(s,mineTxt,waitTxt){if(s.over||ui.anim)return`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`;
 const mine=myTurn();return mine?`<div class="bubble me"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span><b>${esc(s.names[s.cur])}</b>, tocca a te!<small>${mineTxt}</small></div>`
 :`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>Tocca a <b>${esc(s.names[s.cur])}</b><span class="dots"></span>${waitTxt?`<small>${waitTxt}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`}
function gameH(){if(!G)return hudH()+'<p class="muted" style="text-align:center">Caricamento…</p>';return VIEW[G.g]()}
function render(){applyTheme();const ae=document.activeElement,id=ae&&ae.id;
 $('#app').innerHTML=ui.screen==='name'?nameH():ui.screen==='room'?roomH():gameH();
 if(id){const el=document.getElementById(id);if(el&&el.focus)el.focus({preventScroll:true})}afterRender();
 Snd.track(ui.screen==='game'&&G&&!G.over?(G.g==='regicide'?(G.en?P(G.en.c).r:'menu'):G.g==='gang'?'gang':G.g==='saboteur'?'mine':G.g==='azul'?'azul':G.g==='island'?'island':G.g==='machiavelli'?'mach':'it'):'menu')}
function afterRender(){if(ui.screen==='room')tvIso();const h=$('#hand');
 if(h&&!h.classList.contains('many')){const sl=[...h.children].filter(x=>x.classList.contains('slot')),n=sl.length;if(n<2)h.style.setProperty('--ov','0px');else{const Wd=h.clientWidth-8,cw=sl[0].firstElementChild.getBoundingClientRect().width||64,step=Math.min(cw+8,(Wd-cw)/(n-1));h.style.setProperty('--ov',(cw-step)+'px')}}
 if(h){const deals=[...h.querySelectorAll('.card.deal')];if(deals.length&&!RM){const t=ctr(G&&G.g==='regicide'?'#ptav':'#deck');deals.forEach((c,i)=>{const r=c.getBoundingClientRect();if(c.animate)c.animate([{transform:`translate(${t.x-(r.left+r.width/2)}px,${t.y-(r.top+r.height/2)}px) scale(.45) rotate(-25deg)`,opacity:.3},{transform:'none',opacity:1}],{duration:520*Math.max(SP,.1),delay:i*90*SP,easing:'cubic-bezier(.2,1.2,.4,1)',fill:'backwards'});if(i<6)setTimeout(()=>Snd.play('deal'),i*90*SP)})}}
 if(G&&G.g==='regicide'&&G.en&&ui.screen==='game'){const en=ui.viewEn||G.en;if(seen.e&&seen.e!==en.c&&!RM){const b=$('#boss');if(b&&b.animate)b.animate([{transform:'translateY(-60px) scale(.6)',opacity:0},{transform:'none',opacity:1}],{duration:600*SP,easing:'cubic-bezier(.2,1.3,.4,1)'})}seen.e=en.c}}
addEventListener('resize',()=>afterRender());

document.addEventListener('input',e=>{if(e.target.id==='tvq'){ui.q=e.target.value;render();const el=document.getElementById('tvq');if(el){el.focus({preventScroll:true});try{el.setSelectionRange(ui.q.length,ui.q.length)}catch(x){}}}});

document.addEventListener('input',e=>{if(e.target.id==='cmsg')ui.cm=e.target.value});
let tvT=0;function tvLater(){clearTimeout(tvT);tvT=setTimeout(()=>{if(ui.screen==='room'){const l=$('#chatlog'),t=l?l.scrollTop:0;render();const l2=$('#chatlog');if(l2)l2.scrollTop=t}},7200)}
let lastChat=0;
async function chatSend(){const t=(ui.cm||'').trim().slice(0,120);if(!t||!R.on||!R.code)return;if(Date.now()-lastChat<600)return;lastChat=Date.now();
 const k=ui.ek||'m',g=(R.mine.guests||[]).find(x=>x.k===k),nm=g?g.name:(R.mine.name||ME.name),id=Date.now()+'_'+rid();ui.cm='';
 try{await R.db.doc('rooms/'+R.code+'/chat/'+id).set({dev:ME.dev,k:g?k:'m',name:nm,text:t,t:Date.now()});
  const old=R.chat.slice(0,Math.max(0,R.chat.length-39));for(const o of old){try{await R.db.doc('rooms/'+R.code+'/chat/'+o.id).delete()}catch(e){}}}catch(e){ui.err=netErr(e)}
 render();const l=$('#chatlog');if(l)l.scrollTop=l.scrollHeight;const el=$('#cmsg');if(el)el.focus({preventScroll:true})}

if(typeof window!=="undefined"&&!window.Peer&&window.peerjs)window.Peer=window.peerjs.Peer;
