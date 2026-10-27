/* ================= PERUDO ================= */
const PDP={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function dieH(v,o={}){let c='';for(let k=0;k<9;k++)c+=`<i class="${PDP[v].includes(k)?'on':''}"></i>`;
 return`<span class="pd v${v} ${o.cls||''}" ${o.attrs||''} aria-label="${PERU.FN[v]}">${c}</span>`}
function peruDefault(s){const b=s.bid,tot=PERU.total(s);if(!b)return{q:Math.max(1,Math.round(tot/6)),f:2};
 const c=[{q:b.q+1,f:b.f},{q:b.q,f:Math.min(6,b.f+1)}].find(x=>!PERU.valid(s,x.q,x.f));if(c)return c;const o=PERU.options(s);return o[0]||{q:b.q,f:b.f}}
function peruH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),sum=s.phase==='summary',res=s.res,tot=PERU.total(s);
 const key=s.gid+':'+s.evn;if(ui.pk!==key){ui.pk=key;const d=peruDefault(s);ui.pq=d.q;ui.pf=d.f}
 if(s.pal!=null&&s.bid)ui.pf=s.bid.f;
 const pl=`<div class="players pdpl" id="players">${s.names.map((n,i)=>{const c=(sum&&res?res.hands[i]:s.hands[i]).length,out=!s.hands[i].length&&!(sum&&res&&res.hands[i].length);
  return`<div class="pl ${i===s.cur&&!s.over&&!sum?'act':''} ${out?'out':''} ${s.bid&&s.bid.p===i&&!sum?'bidder':''}"><div class="av" id="av${i}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc pdc">${s.hands[i].length?'<b>'+s.hands[i].length+'</b>🎲':'✕'}</span></div>`}).join('')}</div>`;
 const info=`<span class="chip">Round ${s.round}</span><span class="chip">${tot} dadi in tavola</span>${(s.pal!=null)?`<span class="chip pal">PALIFICO · ${esc(s.names[s.pal])}</span>`:''}`;
 let table;
 if(sum&&res){const hit=x=>x===res.bid.f||(x===1&&!res.pal&&res.bid.f!==1);
  const rows=res.hands.map((h,i)=>h.length?`<div class="prow ${i===res.bidder?'bd':''}"><span class="pn">${esc(s.names[i])}</span><span class="pdice">${h.map(x=>dieH(x,{cls:'sm '+(hit(x)?'hit':'dim')})).join('')}</span></div>`:'').join('');
  const verdict=res.kind==='dudo'?(res.loser===res.challenger?`${esc(s.names[res.challenger])} sbagliava: perde un dado`:`${esc(s.names[res.bidder])} bluffava: perde un dado`)
   :(res.loser==null?`Esatto! ${esc(s.names[res.challenger])} guadagna un dado`:`Calza sbagliata: ${esc(s.names[res.challenger])} perde un dado`);
  table=`<div class="ptable reveal"><div class="pbid">${res.count} <small>trovati su</small> ${res.bid.q}× ${dieH(res.bid.f,{cls:'md hit'})}</div><div class="pdice-rows">${rows}</div><div class="pverdict">${verdict}</div></div>`}
 else table=`<div class="ptable">${s.bid?`<div class="pbid"><span class="pq">${s.bid.q}×</span> ${dieH(s.bid.f,{cls:'lg'})}</div><div class="pby">dichiarato da <b>${esc(s.names[s.bid.p])}</b></div>`:`<div class="pby">Nessuna dichiarazione: apre <b>${esc(s.names[s.cur])}</b></div>`}</div>`;
 let mine_dice='';
 if(!sum){if(cover)mine_dice=coverH(s.cur);else if(v>=0)mine_dice=`<div class="pmine"><div class="hlabel">I tuoi dadi${s.names[v]&&multiLocal()?' · '+esc(s.names[v]):''}</div><div class="pdice big">${s.hands[v].map(x=>dieH(x,{cls:'md'})).join('')||'<span class="muted">Sei fuori dal gioco</span>'}</div></div>`}
 let ctl='';
 if(mine&&!cover&&!s.over){
  if(sum)ctl=`<button class="b play" data-a="pnext">Prossimo round</button>`;
  else{const err=PERU.valid(s,ui.pq,ui.pf),faces=[1,2,3,4,5,6].map(f=>`<button class="pfb ${ui.pf===f?'sel':''}" data-a="pf" data-v="${f}" ${s.pal!=null&&s.bid&&s.bid.f!==f?'disabled':''} aria-label="${PERU.FN[f]}">${dieH(f,{cls:'sm'})}</button>`).join('');
   ctl=`<div class="pbidbox"><div class="pstep"><button class="b sm disc" data-a="pq" data-v="-1" ${ui.pq<=1?'disabled':''}>−</button><b class="pqn">${ui.pq}</b><button class="b sm disc" data-a="pq" data-v="1" ${ui.pq>=tot?'disabled':''}>＋</button></div><div class="pfaces">${faces}</div></div>
   <div class="ctl"><button class="b play" data-a="pbid" ${err?'disabled':''}>Dichiara ${ui.pq}× ${PERU.FN[ui.pf]}</button></div>${err?`<div class="phint">${esc(err)}</div>`:''}
   ${s.bid?`<div class="ctl"><button class="b gold sm" data-a="pdudo">🗡 Dudo!</button><button class="b grn sm" data-a="pcalza" ${PERU.canCalza(s)?'':'disabled'}>🎯 Calza</button></div>`:''}`}}
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">🏆</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>dadi</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const strip=stripH(s,i=>({b:s.hands[i].length||'',out:!s.hands[i].length&&!(sum&&res&&res.hands[i].length),trn:!!(s.bid&&s.bid.p===i&&!sum)}));
 return fixH({title:GN('perudo'),chips:info,strip,mid:table,bot:bubbleH(s,sum?'Guarda i dadi, poi si riparte.':'Alza la dichiarazione, sfida con Dudo o prova la Calza.',null)+ctl,hand:mine_dice?`<div class="handbox pdhand">${mine_dice}</div>`:'',players:pl,end})}
function peruClick(a,v){const s=G;if(!myTurn())return;
 if(a==='pq'){ui.pq=Math.max(1,Math.min(PERU.total(s),ui.pq+(+v)));return render()}
 if(a==='pf'){ui.pf=+v;return render()}
 if(a==='pbid')return dispatch({t:'bid',q:ui.pq,f:ui.pf});
 if(a==='pdudo')return dispatch({t:'dudo'});
 if(a==='pcalza')return dispatch({t:'calza'});
 if(a==='pnext')return dispatch({t:'next'})}
const PEFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='roll'){Snd.play('dice');await W(350)}
  else if(e.t==='bid'){Snd.play('sel');await W(120)}
  else if(e.t==='reveal'){Snd.play('impact');await W(500)}
  else if(e.t==='lose'){Snd.play('err');await W(250)}
  else if(e.t==='gain'){Snd.play('redeem');await W(250)}
  else if(e.t==='out'){Snd.play('lose');await W(300)}}
  endFx(ns)}};
