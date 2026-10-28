/* ================= ZUCCA MATTA (squadre, prove miste) ================= */
const ZPC=['#e8453c','#2f9bd8','#f2b81c','#3aa05a','#9a5fd0','#e8782a'];
const zcat=c=>ZUCCA.CATS[c];
const multiSq=s=>s.sq.length>nsqZ(s);
const nsqZ=s=>Math.max(...s.sq)+1;
function zuccaBoardH(s){const cols=8,rows=Math.ceil(ZUCCA.PATH/cols),cell=[];
 for(let p=0;p<ZUCCA.PATH;p++){const r=Math.floor(p/cols),c=r%2?cols-1-p%cols:p%cols;cell[r*cols+c]=p}
 const at={};s.pos.forEach((p,i)=>{if(s.sq.indexOf(s.sq[i])===i)(at[p]=at[p]||[]).push(i)});
 return`<div class="zb" style="--cols:${cols}">`+cell.map(p=>{if(p==null)return'<i></i>';const k=ZUCCA.sq(p),col=k>=0?zcat(k).c:k===-1?'#6b4a1d':'#2a2a30';
  return`<div class="zs ${k===-1?'jol':''} ${k===-2?'goal':''} ${p===s.pos[s.cur]?'here':''}" style="--zc:${col}"><b>${k===-1?'★':k===-2?'⚑':''}</b>${(at[p]||[]).map(i=>`<u class="${s.sq[i]===s.sq[s.cur]&&!s.over?'act':''}" style="background:${ZPC[s.sq[i]%6]}">${esc((s.names[i][0]||'?').toUpperCase())}</u>`).join('')}</div>`}).join('')+`</div>`}
function zuccaH(){if(ui.tv)return zuccaTVH();const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,ph=s.phase,c=s.card,cat=zcat(s.cat),seen=!cover&&v===s.cur;
 const key=s.gid+':'+s.evn;if(ui.zk!==key){ui.zk=key;ui.zt0=Date.now()}
 const chips=`<span class="chip" style="border-color:${cat.c}">${ph==='pick'||ph==='choose'?'Prova da scegliere':cat.n}</span>${s.final?'<span class="chip pal">Prova finale</span>':''}${v!=null&&!cover&&multiSq(s)?`<span class="chip role" style="border-color:${ZPC[s.sq[v]%6]}">Squadra: ${esc(ZUCCA.tn(s,v))}</span>`:''}`;
 const strip=stripH(s,i=>({c:ZPC[s.sq[i]%6],b:Math.round(s.pos[i]/ZUCCA.GOAL*100)+'%'}));
 const pl=s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}"><div class="av" style="background:${ZPC[s.sq[i]%6]}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">casella ${s.pos[i]+1}/${ZUCCA.PATH}</span></div>`).join('');
 let body='',ctl='',hint='';
 const catBtns=a=>`<div class="zpick">${ZUCCA.CATS.map((k,i)=>`<button class="b sm" style="background:${k.c};color:#fff" data-a="${a}" data-v="${i}">${k.n}</button>`).join('')}</div>`;
 if(cover)body=`<div class="zcard" style="--zc:${cat.c}"><small>${cat.n}</small><b>…</b></div>`;
 else if(ph==='draw'){body=`<div class="zcard" style="--zc:${cat.c}"><small>${cat.n}${s.final?' · FINALE':''}</small><b>${esc(cat.d)}</b></div>`;
  if(mine){hint='Chi fa la prova prende il telefono: gli altri non devono guardare lo schermo. Poi tocca «Pesca la carta».';ctl=`<button class="b play" data-a="zdraw">Pesca la carta</button>`}}
 else if(ph==='play'&&c){
  if(c.o){body=`<div class="zcard" style="--zc:${cat.c}"><small>${cat.n}${s.final?' · FINALE':''}</small><b>${esc(c.t)}</b></div>`;
   ctl=`<div class="qans">${c.o.map((t,k)=>`<button class="b disc" ${mine?`data-a="zans" data-v="${k}"`:'disabled'}>${esc(t)}</button>`).join('')}</div>`}
  else if(seen){const el=Math.min(60,(Date.now()-(ui.zt0||Date.now()))/1000);
   body=`<div class="zcard big" style="--zc:${cat.c}"><small>${cat.n}${s.final?' · FINALE':''} · ${esc(cat.d)}</small><b>${esc(c.t)}</b><div class="ztime"><i style="animation-delay:-${el.toFixed(1)}s"></i></div></div>`;
   if(mine){hint='Fate indovinare alla squadra entro un minuto. Poi dì com’è andata.';ctl=`<div class="ktg"><button class="b disc" data-a="zres" data-v="0">Tempo scaduto</button><button class="b gold" data-a="zres" data-v="1">Indovinato!</button></div>`}}
  else body=`<div class="zcard" style="--zc:${cat.c}"><small>${cat.n}${s.final?' · FINALE':''}</small><b>${esc(s.names[s.cur])} sta facendo la prova…</b></div>`}
 else if(ph==='choose'){body=`<div class="zcard" style="--zc:#6b4a1d"><small>★ Jolly</small><b>${esc(s.names[s.cur])} sceglie la prova.</b></div>`;if(mine)ctl=catBtns('zchoose')}
 else if(ph==='pick'){body=`<div class="zcard" style="--zc:#2a2a30"><small>⚑ Traguardo</small><b>${esc(ZUCCA.tn(s,s.who))} ha tagliato il traguardo: ${esc(ZUCCA.tn(s,s.cur))} sceglie la prova finale.</b></div>`;if(mine)ctl=catBtns('zpick')}
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic('corona',48)}</div><h2>Vince ${esc(ZUCCA.tn(s,s.over.win))}!</h2><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${mine?`<b>${esc(s.names[s.cur])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[s.cur])}</b>${multiSq(s)?' · squadra '+esc(ZUCCA.tn(s,s.cur)):''}<span class="dots"></span>`}${mine&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 return fixH({title:GN('zucca'),chips,strip,mid:zuccaBoardH(s),bot:body+bub+`<div class="ctl kctl">${ctl}</div>`,players:pl,end})}
function zuccaClick(a,v){if(!myTurn())return;
 if(a==='zdraw')return dispatch({t:'draw'});
 if(a==='zres')return dispatch({t:'result',ok:v==='1'});
 if(a==='zans')return dispatch({t:'answer',k:+v});
 if(a==='zchoose')return dispatch({t:'choose',cat:+v});
 if(a==='zpick')return dispatch({t:'pick',cat:+v})}
const ZUFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='draw'){Snd.play('draw');await W(200)}
  else if(e.t==='result'){Snd.play(e.ok?'redeem':'err');await W(300)}
  else if(e.t==='roll'){Snd.play('dice');await W(450)}
  else if(e.t==='move'){Snd.play('deal');await W(300)}
  else if(e.t==='final'){Snd.play('whoosh');await W(300)}}
  endFx(ns)}};
