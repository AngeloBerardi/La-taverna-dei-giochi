/* ================= BURRACO ================= */
function burracoH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),L=local(),my=(v>=0?v:(L[0]??0))%2,op=1-my,tn=t=>esc(IT.teamName(s,t));
 const sortB=cs=>cs.slice().sort((a,b)=>{const p=BURR.P(a),q=BURR.P(b);if(ui.bsort==='rank')return(p.j-q.j)||(p.r-q.r)||(p.s<q.s?-1:p.s>q.s?1:0)||(a<b?-1:1);const so='SHDC';return(p.j-q.j)||(so.indexOf(p.s)-so.indexOf(q.s))||(p.r-q.r)||(a<b?-1:1)});
 const meldsH=(t,click)=>`<div class="melds" id="melds${t}">${s.melds[t].map((m,i)=>{const b=BURR.isBurraco(m);return`<div class="meld ${b?(m.wild?'bs':'bp'):''} ${click&&ui.sel.length?'can':''}" ${click?`data-a="meld" data-v="${i}" tabindex="0" role="button"`:''}>${m.cards.map(c=>bcardH(c,{cls:'sm'})).join('')}${b?`<span class="btag">${m.wild?'Burraco sporco':'Burraco pulito'}</span>`:''}</div>`}).join('')||'<span class="muted">Nessuna combinazione</span>'}</div>`;
 const teamBox=(t,click)=>`<div class="team ${t===my?'mine':''}"><div class="th"><b>${t===my?'Noi':'Loro'}: ${tn(t)}</b><span class="chip ${s.pozzTaken[t]?'hl':''}">${s.pozzTaken[t]?'Pozzetto preso':'Pozzetto da prendere'}</span><span class="chip">${s.scores[t]} pt</span></div>${meldsH(t,click)}</div>`;
 const disc=`<div class="pile" id="bdisc" ${mine&&s.phase==='draw'&&s.disc.length?'data-a="drawdisc" role="button" tabindex="0"':''}><div class="dfan">${s.disc.slice(-7).map(c=>bcardH(c,{cls:'sm',attrs:`data-v="${c}"`})).join('')||'<span class="muted">vuoto</span>'}</div>Scarti${s.disc.length?`<b>${s.disc.length}</b>`:''}</div>`;
 const center=`<div class="felt bur"><div class="deckbox" ${mine&&s.phase==='draw'?'data-a="drawdeck" role="button" tabindex="0"':''}>${deckH(s.deck.length)}</div>${disc}<div class="pile"><div class="stk">${s.pozz.length?cardH('',{back:1}):''}</div>Pozzetti<b>${s.pozz.length}</b></div></div>`;
 let hint='',ctl='';
 if(mine&&s.phase==='draw'){ctl=`<button class="b disc" data-a="drawdeck" ${s.deck.length?'':'disabled'}>Pesca dal mazzo</button><button class="b yld" data-a="drawdisc" ${s.disc.length?'':'disabled'}>Raccogli scarti (${s.disc.length})</button>`}
 else if(mine&&s.phase==='play'){const sel=ui.sel,m=sel.length>=3?BURR.validate(sel):null;
  hint=!sel.length?'<span class="muted">Seleziona carte da calare, poi tocca una tua combinazione per attaccarle, oppure scarta una carta</span>':m?`<span class="chip hl">${m.t==='seq'?'Scala':'Tris'} valid${m.t==='seq'?'a':'o'}${sel.length>=7?' · BURRACO!':''}</span>`:sel.length===1?`<span class="chip">${BURR.fmt(sel[0])}: puoi scartarla o attaccarla a una combinazione</span>`:`<span class="chip">${sel.length} carte selezionate (${sel.length<3?'per calare ne servono 3':'non formano una combinazione'})</span>`;
  ctl=`<button class="b play" data-a="bmeld" ${m?'':'disabled'}>Cala</button><button class="b disc" data-a="bdisc" ${sel.length===1?'':'disabled'}>Scarta</button>`}
 const sortBtn=v>=0?`<button class="b sm" data-a="bsort">Ordina per ${ui.bsort==='suit'?'valore':'seme'}</button>`:'';
 const hand=cover?coverH(s.cur):v>=0?fanH(sortB(s.hands[v]),bcardH,{mine,many:true}):'';
 const sum=s.phase==='summary'&&!s.over&&!ui.anim?summaryBurraco(s):'';
 return`${hudH('Burraco')}<div class="tinfo"><span class="chip">${s.target?'a '+s.target+' punti':'una mano'} · mano ${s.round}</span></div>${playersH(s,{teams:s.n===4})}${teamBox(op,false)}${center}${teamBox(my,mine&&s.phase==='play')}${bubbleH(s,s.phase==='draw'?'Pesca dal mazzo o raccogli tutti gli scarti.':'Cala, attacca e poi scarta una carta per finire il turno.',null)}<div class="prev">${hint}</div><div class="ctl">${ctl}${sortBtn}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${hand}</div>${sum}${endH()}${rulesH()}${cfgH()}`}
function summaryBurraco(s){const tn=t=>esc(IT.teamName(s,t)),r=s.res,row=(l,k)=>`<tr><td>${l}</td>${r.map(x=>`<td>${x[k]>0&&k!=='cards'?'+':''}${x[k]}</td>`).join('')}</tr>`;
 return`<div class="modal"><div class="box"><h2>Fine della mano ${s.round}</h2><table class="sumt"><tr><th></th>${r.map((_,t)=>`<th>${tn(t)}</th>`).join('')}</tr>${row('Carte calate','cards')}${row('Burraco','bonus')}${row('Chiusura','close')}${row('Carte in mano','hand')}${row('Pozzetto non preso','pozz')}<tr class="tot"><td>Punti mano</td>${r.map(x=>`<td>${x.tot}</td>`).join('')}</tr><tr class="tot"><td>Totale</td>${s.scores.map(v=>`<td>${v}</td>`).join('')}</tr></table>
 ${myTurn()?'<button class="b play" data-a="next">Prossima mano</button>':`<p class="muted">${esc(s.names[s.cur])} distribuisce la prossima mano…</p>`}</div></div>`}
function burClick(a,v){const s=G;if(a==='bsort'){ui.bsort=ui.bsort==='suit'?'rank':'suit';return render()}
 if(!myTurn())return;
 if(a==='drawdeck')return dispatch({t:'draw',from:'deck'});if(a==='drawdisc')return dispatch({t:'draw',from:'disc'});
 if(a==='sel'){if(s.phase!=='play'){ui.err='Prima pesca dal mazzo o raccogli gli scarti';return render()}const i=ui.sel.indexOf(v);i<0?ui.sel.push(v):ui.sel.splice(i,1);ui.err='';Snd.play(i<0?'sel':'unsel');return render()}
 if(a==='bmeld')return dispatch({t:'meld',cards:ui.sel.slice()});
 if(a==='bdisc'&&ui.sel.length===1)return dispatch({t:'discard',c:ui.sel[0]});
 if(a==='meld'){if(!ui.sel.length){ui.err='Seleziona prima le carte da attaccare';return render()}return dispatch({t:'add',mi:+v,cards:ui.sel.slice()})}}
const BUFX={async pre(prev,ns,own){const e=ns.ev[0];if(!e)return{};
  if(e.t==='discard'){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(e.p,[e.c]);await flyCards(items,'#bdisc',{fade:false,scale:.7},bcardH)}
  else if(e.t==='meld'||e.t==='add'){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(e.p,e.cards);await flyCards(items,'#melds'+(e.p%2),{fade:true,scale:.6},bcardH)}
  else if(e.t==='drawdisc'){const items=[...document.querySelectorAll('#bdisc .card')].map(c=>({id:c.dataset.v,r:c.getBoundingClientRect()}));Snd.play('whoosh');await flyCards(items,isMine(e.p)?'#hand':'#av'+e.p,{scale:.6},bcardH)}
  return{}},
 async run(prev,ns){for(const e of ns.ev){
  if(e.t==='drawdeck'){if(!isMine(e.p))flt('#av'+e.p,'+1','gry');Snd.play('deal')}
  else if(e.t==='drawdisc'){flt('#av'+e.p,'+'+e.n,'gold')}
  else if(e.t==='meld'||e.t==='add'){if(e.bur){const c=ctr('#melds'+(e.p%2));banner('BURRACO!',ns.names[e.p]);burst(c.x,c.y,['#ffd34d','#fff','#ff6ad5'],90,{v:9,sq:true});Snd.play('redeem');await W(900)}else Snd.play('impact')}
  else if(e.t==='pozz'){banner('POZZETTO!',ns.names[e.p]+(e.volo?' lo prende al volo':''));Snd.play('draw');await W(800)}
  else if(e.t==='close'){banner('CHIUSURA!',ns.names[e.p]);Snd.play('win');await W(900)}
  else if(e.t==='round'){Snd.play('redeem')}}
  endFx(ns)}};
function endFx(ns){if(ns.over){if(ns.over.win!=null){Snd.play('win');confetti()}else Snd.play('turn')}}
