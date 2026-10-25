/* ================= UNO ================= */
const UCOL={R:'#d8342c',Y:'#f2b81c',G:'#2f9e44',B:'#2468c9',W:'#17171d'};
/* simboli stampati: salta, inverti e girandola del jolly (tratto pieno, il colore lo dà la carta) */
const USVG={S:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3.6"/><path d="M6.4 17.6 17.6 6.4" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/></svg>',
 V:'<svg viewBox="0 0 24 24"><g transform="rotate(35 12 12)" fill="currentColor"><path d="M8 2.5 13.5 10H10v11.5H6V10H2.5z"/><path d="M16 21.5 10.5 14H14V2.5h4V14h3.5z"/></g></svg>',
 W:'<svg viewBox="0 0 24 24" stroke="#fff" stroke-width="1.4"><path d="M12 12V3A9 9 0 0 1 21 12z" fill="#d8342c"/><path d="M12 12h9a9 9 0 0 1-9 9z" fill="#2468c9"/><path d="M12 12v9a9 9 0 0 1-9-9z" fill="#2f9e44"/><path d="M12 12H3a9 9 0 0 1 9-9z" fill="#f2b81c"/></svg>'};
const USYM=(c,small)=>{const v=c[1];if(c==='WW')return small?USVG.W:'';if(c==='WF')return'+4';if(v==='S'||v==='V')return USVG[v];if(v==='D')return'+2';return v==='6'||v==='9'?`<span class="ul">${v}</span>`:v};
const UORD='R Y G B W'.split(' ');
/* carta stampata: bordo bianco, riquadro a colori, ovale inclinato, numero con ombra nera; i jolly hanno l'ovale a quattro colori */
const ucardH=(c,o={})=>{const w=c[0]==='W',lab=w?(c==='WF'?'Jolly più quattro':'Jolly cambia colore'):UNO.CN[c[0]]+' '+({S:'Salta',V:'Inverti',D:'più due'}[c[1]]||c[1]);
 return`<div class="uc ${w?'wild':''} k${c[1]} ${o.cls||''}" style="--uc:${UCOL[c[0]]};${o.style||''}" ${(o.attrs||'').includes('aria-label')?'':`aria-label="${lab}"`} ${o.attrs||''}><i class="ov"></i><em>${USYM(c,1)}</em><b>${USYM(c)}</b><em class="r">${USYM(c,1)}</em></div>`};
const ubackH=cls=>`<div class="uc back ${cls||''}"><i class="ov"></i><b>UNO</b></div>`;
const uSort=h=>h.slice().sort((a,b)=>UORD.indexOf(a[0])-UORD.indexOf(b[0])||(a[1]<b[1]?-1:a[1]>b[1]?1:0));
function unoH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,ph=s.phase,top=s.discard[s.discard.length-1];
 const key=s.gid+':'+s.evn,fresh=ui.uk!==key;if(fresh){ui.uk=key;ui.ucs=null;ui.udbl=null;ui.uuno=false}
 const chips=`<span class="chip">Colore <i class="ucd" style="background:${UCOL[s.color]}"></i> ${UNO.CN[s.color]}</span><span class="chip">${s.dir===1?'↻ orario':'↺ antiorario'}</span><span class="chip">Mazzo ${s.deck.length}</span>${s.pend?`<span class="chip pal">Accumulo +${s.pend}</span>`:''}${s.edi==='stack'?'<span class="chip">Accumulo attivo</span>':''}${s.sw?'<span class="chip">Sette-Zero</span>':''}`;
 const strip=stripH(s,i=>({b:s.hands[i].length,c:s.hands[i].length===1?'#d8342c':undefined}));
 const pl=s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}"><div class="av">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${s.hands[i].length} carte${s.miss===i?' · senza UNO!':s.hands[i].length===1?' · UNO!':''}</span></div>`).join('');
 const mid=`<div class="utable"><div class="upile">${ubackH()}<span>${s.deck.length}</span></div><div class="uturn" style="--uc:${UCOL[s.color]}"><div class="ucol"></div>${ucardH(top,{cls:'big'+(fresh&&!ui.anim?' land':''),style:'--t:'+(((s.evn*37)%13)-6)+'deg'})}<span class="uarr">${s.dir===1?'↻':'↺'}</span></div></div>`;
 let ctl='',hint='';
 const h=v>=0?s.hands[v]:[];
 /* chi ha giocato la penultima carta senza dire UNO può dirlo anche dopo, finché il prossimo non muove */
 const late=!mine&&!s.over&&s.miss!=null&&isMine(s.miss)&&!multiLocal();
 if(late){hint='Hai una carta sola: di’ UNO prima che il prossimo muova!';ctl=`<button class="b gold" data-a="ulate">${ic('megafono',16)} UNO!</button>`}
 if(mine){
  if(ph==='swap'){hint='Hai giocato un 7: scegli con chi scambiare la mano.';ctl=`<div class="ktg">${s.names.map((n,i)=>i===s.cur?'':`<button class="b disc" data-a="uswap" data-v="${i}">${ic('scambio',16)} ${esc(n)} (${s.hands[i].length})</button>`).join('')}</div>`}
  else if(ph==='challenge'){const w=s.w4;hint=`<b>${esc(s.names[w.by])}</b> ha giocato un +4: accettalo (pesca 4) o sfidalo. Se aveva in mano una carta del colore precedente pesca lui 4, altrimenti ne pesci 6 tu.`;
   ctl=(s.miss!=null&&s.miss!==s.cur?`<button class="b gold sm" data-a="ucatch">${ic('bilancia',16)} Denuncia: ${esc(s.names[s.miss])} non ha detto UNO!</button>`:'')+`<div class="ktg"><button class="b disc" data-a="uacc">Accetta (+4)</button><button class="b gold" data-a="uchal">${ic('bilancia',16)} Sfida!</button></div>`}
  else{const pl2=UNO.canPlay(s,v).filter(c=>ph!=='pass'||c===s.drawn);
   /* si può restare con una carta sola: dopo la pesca (1+1-1), con una carta normale (2-1) o con una doppia (3-2) */
   const dbl=ph!=='pass'&&h.length===3&&h.some(c=>UNO.maxN(s,v,c)>=2),needUno=ph==='pass'?h.length===2&&pl2.length>0:(h.length===2&&pl2.length>0)||dbl;
   const unoBtn=needUno?`<button class="b ${ui.uuno?'grn':'gold'} sm uunob" data-a="uuno">${ui.uuno?ic('spunta',16)+' UNO annunciato':ic('megafono',16)+' Di’ UNO prima di giocare'}</button>`:'';
   const catchBtn=s.miss!=null&&s.miss!==s.cur?`<button class="b gold" data-a="ucatch">${ic('bilancia',16)} Denuncia: ${esc(s.names[s.miss])} non ha detto UNO!</button>`:'';
   hint=s.pend?`Rispondi con un ${s.pendK==='D'?'+2':'+4'} o pesca ${s.pend} carte.`:ph==='pass'?'Hai pescato: puoi giocare quella carta o passare.':pl2.length?'Tocca una carta illuminata (due carte uguali si giocano insieme).':'Niente da giocare: pesca.';
   if(catchBtn)hint=`<b>${esc(s.names[s.miss])}</b> ha una carta sola e non ha detto UNO: denuncialo prima di muovere, oppure lascialo stare. ${hint}`;
   if(ui.ucs){hint='Scegli il nuovo colore.';ctl+=`<div class="ucolors">${UNO.COLORS.map(c=>`<button class="ucb" style="--uc:${UCOL[c]}" data-a="ucolor" data-v="${c}" aria-label="${UNO.CN[c]}"></button>`).join('')}</div>${unoBtn}<button class="b disc sm" data-a="ucx">Annulla</button>`}
   else if(ui.udbl){const mx=UNO.maxN(s,v,ui.udbl);hint=`Hai ${mx} carte uguali: giocane una o più insieme.`;
    ctl+=`<div class="ktg">${Array.from({length:mx},(_,k)=>`<button class="b ${k?'play':'disc'}" data-a="uplay" data-v="${k+1}">${k?'Gioca '+(k+1)+' insieme':'Gioca 1'}</button>`).join('')}</div>${unoBtn}<button class="b disc sm" data-a="udx">Annulla</button>`}
   else{ctl+=catchBtn+unoBtn;
    ctl+=ph==='pass'?`<button class="b disc sm" data-a="upass">Passa</button>`:`<button class="b ${pl2.length?'disc sm':'play'}" data-a="udraw">${s.pend?`Pesca ${s.pend}`:'Pesca una carta'}</button>`}}}
 let hand='';
 if(cover)hand=coverH(s.cur);
 else if(v>=0)hand=`<div class="uhand">${fanRowsH(uSort(h).map(c=>{const can=mine&&(ph==='play'||ph==='pass')&&UNO.playable(s,c)&&(ph!=='pass'||c===s.drawn);return ucardH(c,{cls:(can?'can ':'dim ')+(ui.ucs===c||ui.udbl===c?'sel':''),attrs:`data-a="ucard" data-v="${c}" role="button" tabindex="0"`})}),10)}</div>`;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic('corona',40)}</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>${i===s.over.win?'punti presi':s.hands[i].length+' carte'}</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${mine?`<b>${esc(s.names[s.cur])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[s.cur])}</b><span class="dots"></span>`}${(mine||late)&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 return fixH({title:'Uno',chips,strip,mid,bot:bub+`<div class="ctl kctl">${ctl}</div>`,hand,players:pl,end})}
function unoClick(a,v){const s=G;
 if(a==='ulate')return dispatch({t:'uno'});
 if(!myTurn())return;
 if(a==='uswap')return dispatch({t:'swap',to:+v});
 if(a==='ucard'){if(s.phase==='challenge'||s.phase==='swap')return;const c=v;if(!UNO.playable(s,c)||(s.phase==='pass'&&c!==s.drawn)){ui.err=s.pend?'Devi rispondere con '+(s.pendK==='D'?'un +2':'un +4')+' o pescare':'Questa carta non si può giocare adesso';Snd.play('err');return render()}ui.err='';
  if(c[0]==='W'){if(s.hands[s.cur].length===1)return dispatch({t:'play',c,uno:false});ui.ucs=c;return render()}
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
  else if(e.t==='swap'||e.t==='rotate'){Snd.play('shuffle');await W(320)}
  else if(e.t==='reshuffle'){Snd.play('shuffle');await W(200)}}
  endFx(ns)}};
