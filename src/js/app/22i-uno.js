/* ================= UNO ================= */
const UCOL={R:'#d8342c',Y:'#f2b81c',G:'#2f9e44',B:'#2468c9',W:'#22222c'};
const USYM=c=>{const v=c[1];return c==='WW'?'★':c==='WF'?'+4':v==='S'?'⊘':v==='V'?'⇄':v==='D'?'+2':v};
const UORD='R Y G B W'.split(' ');
const ucardH=(c,o={})=>{const w=c[0]==='W';return`<div class="uc ${w?'wild':''} ${o.cls||''}" style="--uc:${UCOL[c[0]]}" ${o.attrs||''}><em>${USYM(c)}</em><b>${USYM(c)}</b><em class="r">${USYM(c)}</em>${w?'<u><i style="background:#d8342c"></i><i style="background:#f2b81c"></i><i style="background:#2f9e44"></i><i style="background:#2468c9"></i></u>':''}</div>`};
const uSort=h=>h.slice().sort((a,b)=>UORD.indexOf(a[0])-UORD.indexOf(b[0])||(a[1]<b[1]?-1:a[1]>b[1]?1:0));
function unoH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,ph=s.phase,top=s.discard[s.discard.length-1];
 const key=s.gid+':'+s.evn;if(ui.uk!==key){ui.uk=key;ui.ucs=null;ui.udbl=null;ui.uuno=false}
 const chips=`<span class="chip">Colore <i class="ucd" style="background:${UCOL[s.color]}"></i> ${UNO.CN[s.color]}</span><span class="chip">${s.dir===1?'↻ orario':'↺ antiorario'}</span><span class="chip">Mazzo ${s.deck.length}</span>${s.pend?`<span class="chip pal">Accumulo +${s.pend}</span>`:''}${s.edi==='stack'?'<span class="chip">Accumulo attivo</span>':''}`;
 const strip=stripH(s,i=>({b:s.hands[i].length,c:s.hands[i].length===1?'#d8342c':undefined}));
 const pl=s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}"><div class="av">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">🂠 ${s.hands[i].length}${s.miss===i?' · senza UNO!':s.hands[i].length===1?' · UNO!':''}</span></div>`).join('');
 const mid=`<div class="utable"><div class="upile"><div class="uc back"><b>UNO</b></div><span>${s.deck.length}</span></div><div class="uturn" style="--uc:${UCOL[s.color]}"><div class="ucol"></div>${ucardH(top,{cls:'big'})}<span class="uarr">${s.dir===1?'↻':'↺'}</span></div></div>`;
 let ctl='',hint='';
 const h=v>=0?s.hands[v]:[];
 if(mine){
  if(ph==='challenge'){const w=s.w4;hint=`<b>${esc(s.names[w.by])}</b> ha giocato un +4: accettalo (pesca 4) o sfidalo. Se aveva in mano una carta del colore precedente pesca lui 4, altrimenti ne pesci 6 tu.`;
   ctl=(s.miss!=null&&s.miss!==s.cur?`<button class="b gold sm" data-a="ucatch">⚖️ Denuncia: ${esc(s.names[s.miss])} non ha detto UNO!</button>`:'')+`<div class="ktg"><button class="b disc" data-a="uacc">Accetta (+4)</button><button class="b gold" data-a="uchal">⚖️ Sfida!</button></div>`}
  else{const pl2=UNO.canPlay(s,v).filter(c=>ph!=='pass'||c===s.drawn);
   /* si può restare con una carta sola: dopo la pesca (1+1-1), con una carta normale (2-1) o con una doppia (3-2) */
   const dbl=ph!=='pass'&&h.length===3&&h.some(c=>UNO.maxN(s,v,c)>=2),needUno=ph==='pass'?h.length===2&&pl2.length>0:(h.length===2&&pl2.length>0)||dbl;
   const unoBtn=needUno?`<button class="b ${ui.uuno?'grn':'gold'} sm uunob" data-a="uuno">${ui.uuno?'✅ UNO annunciato':'📣 Di’ UNO prima di giocare'}</button>`:'';
   const catchBtn=s.miss!=null&&s.miss!==s.cur?`<button class="b gold" data-a="ucatch">⚖️ Denuncia: ${esc(s.names[s.miss])} non ha detto UNO!</button>`:'';
   hint=s.pend?`Rispondi con un ${s.pendK==='D'?'+2':'+4'} o pesca ${s.pend} carte.`:ph==='pass'?'Hai pescato: puoi giocare quella carta o passare.':pl2.length?'Tocca una carta illuminata (due carte uguali si giocano insieme).':'Niente da giocare: pesca.';
   if(catchBtn)hint=`<b>${esc(s.names[s.miss])}</b> ha una carta sola e non ha detto UNO: denuncialo prima di muovere, oppure lascialo stare. ${hint}`;
   if(ui.ucs){hint='Scegli il nuovo colore.';ctl+=`<div class="ucolors">${UNO.COLORS.map(c=>`<button class="ucb" style="--uc:${UCOL[c]}" data-a="ucolor" data-v="${c}" aria-label="${UNO.CN[c]}"></button>`).join('')}</div>${unoBtn}<button class="b disc sm" data-a="ucx">Annulla</button>`}
   else if(ui.udbl){const mx=UNO.maxN(s,v,ui.udbl);hint=`Hai ${mx} carte uguali: giocane una o più insieme.`;
    ctl+=`<div class="ktg">${Array.from({length:mx},(_,k)=>`<button class="b ${k?'play':'disc'}" data-a="uplay" data-v="${k+1}">${k?'Gioca '+(k+1)+' insieme':'Gioca 1'}</button>`).join('')}</div>${unoBtn}<button class="b disc sm" data-a="udx">Annulla</button>`}
   else{ctl+=catchBtn+unoBtn;
    ctl+=ph==='pass'?`<button class="b disc sm" data-a="upass">Passa</button>`:`<button class="b ${pl2.length?'disc sm':'play'}" data-a="udraw">${s.pend?`Pesca ${s.pend}`:'Pesca una carta'}</button>`}}}
 let hand='';
 if(cover)hand=coverH(s.cur);
 else if(v>=0)hand=`<div class="uhand">${fanH(uSort(h).map(c=>{const can=mine&&ph!=='challenge'&&UNO.playable(s,c)&&(ph!=='pass'||c===s.drawn);return ucardH(c,{cls:(can?'can ':'dim ')+(ui.ucs===c||ui.udbl===c?'sel':''),attrs:`data-a="ucard" data-v="${c}" role="button" tabindex="0"`})}),10)}</div>`;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">🏆</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>${i===s.over.win?'punti presi':'🂠'+s.hands[i].length}</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${mine?`<b>${esc(s.names[s.cur])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[s.cur])}</b><span class="dots"></span>`}${mine&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 return fixH({title:'Uno',chips,strip,mid,bot:bub+`<div class="ctl kctl">${ctl}</div>`,hand,players:pl,end})}
function unoClick(a,v){const s=G;if(!myTurn())return;
 if(a==='ucard'){if(s.phase==='challenge')return;const c=v;if(!UNO.playable(s,c)||(s.phase==='pass'&&c!==s.drawn)){ui.err=s.pend?'Devi rispondere con '+(s.pendK==='D'?'un +2':'un +4')+' o pescare':'Questa carta non si può giocare adesso';Snd.play('err');return render()}ui.err='';
  if(c[0]==='W'){ui.ucs=c;return render()}
  if(UNO.maxN(s,s.cur,c)>=2){ui.udbl=c;Snd.play('sel');return render()}
  return dispatch({t:'play',c,uno:ui.uuno})}
 if(a==='uplay'){const c=ui.udbl;ui.udbl=null;return dispatch({t:'play',c,n:+v,uno:ui.uuno})}
 if(a==='udx'){ui.udbl=null;return render()}
 if(a==='ucatch')return dispatch({t:'catch'});
 if(a==='ucolor'){const c=ui.ucs;ui.ucs=null;return dispatch({t:'play',c,color:v,uno:ui.uuno})}
 if(a==='ucx'){ui.ucs=null;return render()}
 if(a==='uuno'){ui.uuno=!ui.uuno;return render()}
 if(a==='udraw')return dispatch({t:'draw'});
 if(a==='upass')return dispatch({t:'pass'});
 if(a==='uacc')return dispatch({t:'accept'});
 if(a==='uchal')return dispatch({t:'challenge'})}
const UNFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='play'){Snd.play('deal');await W(220)}
  else if(e.t==='draw'){Snd.play('draw');await W(140)}
  else if(e.t==='skip'||e.t==='reverse'){Snd.play('whoosh');await W(240)}
  else if(e.t==='uno'){Snd.play('redeem');await W(300)}
  else if(e.t==='challenge'||e.t==='catch'){Snd.play('atk');await W(300)}
  else if(e.t==='reshuffle'){Snd.play('shuffle');await W(200)}}
  endFx(ns)}};
