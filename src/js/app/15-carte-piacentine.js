/* ===== CARTE PIACENTINE (grafica originale in stile piacentino: doppia figura, semi colorati) ===== */
let pstyle=ST('rg-cards')!=='nap';
const PSU={
 C:'<path d="M5 2h14c0 6-2.5 9.2-5.6 10.2V16h3.1v2.2H7.5V16h3.1v-3.8C7.5 11.2 5 8 5 2z" fill="#c8312b" stroke="#5a1210" stroke-width="1"/><path d="M5 2h14" stroke="#e8b923" stroke-width="2.4"/><path d="M8 4.5c0 2.4 1 4 2.6 5" stroke="#fff" stroke-opacity=".55" fill="none"/><rect x="6" y="19" width="12" height="2.8" rx="1.3" fill="#e8b923" stroke="#6a4a00" stroke-width=".8"/><path d="M5 4.5C1 4.5 1 11 6 10.4M19 4.5c4 0 4 6.5-1 5.9" fill="none" stroke="#e8b923" stroke-width="1.5"/>',
 D:'<circle cx="12" cy="12" r="10.3" fill="#f0b82a" stroke="#6a4a00" stroke-width="1.2"/><circle cx="12" cy="12" r="7.8" fill="none" stroke="#fff3b0" stroke-width="1" stroke-dasharray="1.6 1.4"/><path d="M12 5.2l1.6 4.2 4.4.2-3.4 2.7 1.2 4.3L12 14.2 8.2 16.6l1.2-4.3L6 9.6l4.4-.2z" fill="#c8312b" stroke="#6a4a00" stroke-width=".7"/>',
 S:'<path d="M17 1c3.2 6.4 1 13.4-5.6 17.4l-1.6-1.7C14.2 12.6 14.8 6.6 12 2.2z" fill="#9cc2ec" stroke="#1d3a66" stroke-width="1"/><path d="M13 3.5c1 4.5-.6 8.4-4 11" stroke="#fff" stroke-opacity=".6" fill="none"/><path d="M4.8 17.4l9.4-3.4 1.2 2.6-9.4 3.6z" fill="#e8b923" stroke="#6a4a00" stroke-width=".9"/><path d="M6.2 20.2L3 23" stroke="#5b3510" stroke-width="2.2" stroke-linecap="round"/>',
 B:'<path d="M9.4 22.6 10.6 7C10.8 4 12 2 14 2.5c2.1.6 2.2 3.6 1 6L13.8 22.6z" fill="#8a5a24" stroke="#3a210a" stroke-width="1"/><path d="M11 8.2C8 7 6 8 5 10c3 1 5 .5 6-1.8zM13.4 13c3-1 5 0 6 2-3 1-5 .5-6-2z" fill="#3f9a45" stroke="#1f5a25" stroke-width=".7"/><path d="M10.2 14h3.6M10 18h3.8" stroke="#3a210a" stroke-width="1"/>'};
const PSC={C:'#c8312b',D:'#d99a1a',S:'#2f64b5',B:'#2f8a3f'};
const psv=s=>`<svg viewBox="0 0 24 24">${PSU[s]}</svg>`;
function pfig(r,s){const c=PSC[s],sk='#f1c9a0',ol='#3a2a1a',g='#e8b923';const em=`<g transform="translate(24 25) scale(.62)">${PSU[s]}</g>`;let b;
 if(r==='F')b=`<path d="M8 43c0-11 5-18 12-18s12 7 12 18z" fill="${c}" stroke="${ol}" stroke-width="1.4"/><path d="M14 30l6 6 6-6" fill="#fff" stroke="${ol}"/><circle cx="20" cy="15" r="7" fill="${sk}" stroke="${ol}" stroke-width="1.4"/><path d="M12 13c0-7 5-9 9-9 4 0 7 3 7 9z" fill="${c}" stroke="${ol}" stroke-width="1.4"/><path d="M26 6c6-4 9-2 10 3-4-1-7 0-9 2z" fill="#fff" stroke="${ol}"/><circle cx="17.5" cy="15" r="1" fill="${ol}"/><circle cx="22.5" cy="15" r="1" fill="${ol}"/>${em}`;
 else if(r==='C')b=`<path d="M3 40c1-9 3-14 9-16l6-8 2-6 4 3-1 6c8 1 13 7 14 21z" fill="#f2ead6" stroke="${ol}" stroke-width="1.4"/><path d="M3 38l5-6 7 2" fill="none" stroke="${c}" stroke-width="3"/><path d="M23 12l8 2 3 10" fill="none" stroke="${c}" stroke-width="3"/><circle cx="25" cy="8" r="5" fill="${sk}" stroke="${ol}"/><path d="M20 7c0-5 4-6 7-5 3 1 3 4 3 5z" fill="${c}" stroke="${ol}"/><path d="M14 22c4 2 9 2 13 0l3 8c-5 3-14 3-19 0z" fill="${c}" stroke="${ol}" stroke-width="1.2"/><circle cx="13" cy="13" r="1" fill="${ol}"/>${em}`;
 else b=`<path d="M6 43c0-11 5-19 14-19s14 8 14 19z" fill="${c}" stroke="${ol}" stroke-width="1.4"/><path d="M10 30c3 5 8 6 10 6s7-1 10-6c-2-3-6-5-10-5s-8 2-10 5z" fill="#fff" stroke="${ol}"/><circle cx="20" cy="15" r="7.5" fill="${sk}" stroke="${ol}" stroke-width="1.4"/><path d="M13 19c1 8 4 10 7 10s6-2 7-10c-3 2-5 2-7 2s-4 0-7-2z" fill="#e9e2d0" stroke="${ol}"/><path d="M11 10l2-8 4 5 3-6 3 6 4-5 2 8z" fill="${g}" stroke="${ol}" stroke-width="1.3"/><circle cx="17.5" cy="14" r="1" fill="${ol}"/><circle cx="22.5" cy="14" r="1" fill="${ol}"/><path d="M33 40V18" stroke="#6a4a00" stroke-width="2.4"/><circle cx="33" cy="16" r="3" fill="${g}" stroke="${ol}"/>`;
 return`<svg viewBox="0 0 40 44" preserveAspectRatio="xMidYMid meet">${b}</svg>`}

function pileH(id,label,n,face){return`<div class="pile ${n?'':'empty'}" id="${id}"><div class="stk">${n?(face?cardH(face,{}):[0,1,2].slice(0,Math.min(3,n)).map(()=>cardH('',{back:1})).join('')):''}</div>${label}${n?`<b>${n}</b>`:''}</div>`}
function regicideH(){
 const s=G,en=ui.viewEn||s.en,cur=s.cur,cover=needCover(),mine=myTurn(),cname=esc(s.names[cur]),sel=ui.sel;
 const owner=viewer(),okHand=!cover&&owner>=0;
 const hand=okHand?s.hands[owner].slice().sort((a,b)=>RG.cv(a)-RG.cv(b)||(a<b?-1:1)):[];
 const ob=s.phase==='discard'&&mine;
 let boss='',act='';
 if(en){const rk=P(en.c).r,su=P(en.c).s,hp=RG.hpOf[rk],atk=RG.atOf[rk],eff=Math.max(0,atk-en.sh),left=Math.max(0,hp-en.dmg);act=`${ACTS[rk][0]} · ${ACTS[rk][1]} · nemico ${Math.min(12,12-s.castle.length)}/12`;
  boss=`<div class="arena3"><div class="side">${pileH('pcastle','Castello',s.castle.length)}</div>
  <div class="boss ${su}" id="boss"><div class="frame">${cardH(en.c,{cls:'xl holo',boss:1})}</div>
   <div class="imm ${en.can?'off':''}" title="${en.can?'Immunità annullata dal Jolly':'Immune: '+IMMTXT[su]}">IMMUNE ${SYM[su]}</div>
   <div class="gem atk" id="gatk" title="Attacco">${eff}<small>ATT</small></div><div class="gem hp" id="ghp" title="Vita">${left}<small>VITA</small></div>${en.sh?`<div class="gem sh" title="Scudo dalle Picche">−${en.sh}</div>`:''}</div>
  <div class="side">${pileH('ptav','Taverna',s.tav.length)}${pileH('pdisc','Scarti',s.disc.length,s.disc.length?s.disc[s.disc.length-1]:null)}</div></div>
  <div class="nameplate"><span class="rib">${RN[rk]} di ${SN[su]}</span><em>${esc(TITLES[en.c])} · ${en.can?'immunità annullata':IMMTXT[su]}</em><div class="hpbar"><i style="width:${left/hp*100}%"></i></div></div>`}
 const played=s.played.map(c=>{const nw=!seen.p.has(c);return cardH(c,{cls:'sm '+(nw?'pop':''),style:`--r:${(hash(c)%9)-4}deg`})}).join('')||'<span class="muted">Il campo di battaglia è vuoto</span>';seen.p=new Set(s.played);
 const pls=`<div class="players" id="players">${s.names.map((n,i)=>`<div class="pl ${i===cur&&!s.over?'act':''}"><div class="av" id="av${i}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${s.hands[i].length}🂠</span></div>`).join('')}${s.n===1?`<div class="pl row0"><div class="av">J</div><span class="n">Jolly</span><span class="hc">${s.jl}</span></div>`:''}</div>`;
 let bub='',prev='',ctl='';const nar=esc(s.log[s.log.length-1]||'');
 if(s.over||cover)bub='';
 else if(ui.anim)bub=`<div class="bubble"><span class="nar">${nar}</span>&nbsp;</div>`;
 else if(!mine)bub=`<div class="bubble"><span class="nar">${nar}</span>Tocca a <b>${cname}</b><span class="dots"></span><small>${ui.busy?'invio mossa…':s.phase==='discard'?'deve scartare '+s.owed+' per il danno':s.phase==='pick'?'sta scegliendo chi gioca dopo':'sta scegliendo cosa giocare'}</small></div>`;
 else if(s.phase==='play'){bub=`<div class="bubble me"><span class="nar">${nar}</span><b>${cname}</b>, a te la mossa!<small>Scegli le carte da giocare, oppure cedi (subirai comunque l’attacco).</small></div>`;
  if(sel.length){const e=RG.checkPlay(s,sel),pv=e?null:RG.preview(s,sel);
   prev=e?`<span class="chip w">${esc(e)}</span>`:pv.jester?'<span class="chip sh">Annulla l’immunità · scegli chi gioca dopo</span>':`<span class="chip atk">⚔ danno ${pv.dmg}${pv.x2?' (×2)':''}</span>${pv.heal?`<span class="chip hl">♥ ${pv.heal} in Taverna</span>`:''}${pv.drawFull?(pv.draw?`<span class="chip sh">♦ pesci ${pv.draw}${pv.draw<pv.atk?' (mano piena)':''}</span>`:'<span class="chip off">♦ mano piena: non peschi</span>'):''}${pv.shield?`<span class="chip sh">♠ attacco −${pv.shield}</span>`:''}${pv.ign?`<span class="chip off">${SYM[pv.ign]} ignorato (immune)</span>`:''}`}
  else prev='<span class="muted">Tocca le carte per selezionarle</span>';
  ctl=`<button class="b play" data-a="play" ${(!sel.length||RG.checkPlay(s,sel))?'disabled':''}>Attacca${sel.length?' ('+RG.sum(sel)+')':''}</button><button class="b yld" data-a="yield">Cedi</button>${s.n===1&&s.jl?`<button class="b gold sm" data-a="flip">Jolly (${s.jl})</button>`:''}`}
 else if(s.phase==='discard'){const sm=RG.sum(sel),pc=Math.min(100,sm/s.owed*100);
  bub=`<div class="bubble atk"><span class="nar">${nar}</span>⚔ Il nemico colpisce <b>${cname}</b>!<small>Scarta carte per almeno ${s.owed} punti: il numero rosso è il loro valore.</small></div>`;
  prev=`<div class="meter ${sm>=s.owed?'ok':''}"><i style="width:${pc}%"></i><b>${sm} / ${s.owed}</b></div>`;
  ctl=`<button class="b disc" data-a="disc" ${sm<s.owed?'disabled':''}>Para il colpo</button><button class="b grn sm" data-a="auto">Suggerisci</button>${s.n===1&&s.jl?`<button class="b gold sm" data-a="flip">Jolly (${s.jl})</button>`:''}`}
 else if(s.phase==='pick'){bub=`<div class="bubble me"><b>${cname}</b> ha giocato il Jolly!<small>Scegli chi gioca dopo.</small></div>`;ctl=s.names.map((n,i)=>`<button class="b play" data-a="pick" data-v="${i}">${esc(n)}</button>`).join('')}
 const n=hand.length,same=seen.h&&seen.h.owner===owner,prevIds=new Set(same?seen.h.ids:[]),now=Date.now()/1000;
 const handH=cover?coverH(cur)
 :`<div class="hand" id="hand">${hand.map((c,i)=>{const mid=(n-1)/2,rot=(i-mid)*(n>6?3.2:4),ty=Math.pow(Math.abs(i-mid),2)*1.8,isNew=seen.h!==null&&!prevIds.has(c);
   return`<div class="slot ${sel.includes(c)?'sel':''}" style="--rot:${rot}deg;--ty:${ty}px">${cardH(c,{cls:(mine?'':'off ')+(isNew?'deal ':'fl8 '),style:`--fd:-${((now+i*.43)%3.6).toFixed(2)}s`,attrs:`data-a="sel" data-v="${c}" tabindex="0" role="button" aria-label="${RG.fmt(c)}"`,dv:ob?RG.cv(c):0})}</div>`}).join('')||(okHand?'<span class="muted">Nessuna carta in mano</span>':'')}</div>`;
 seen.h=okHand?{owner,ids:hand}:null;
 const over=endH();
 return`${hudH('Regicide')}${act?`<div class="acttag">${act}</div>`:''}<section class="arena">${boss}<div class="battle" id="played">${played}</div></section>${pls}${bub}<div class="prev">${prev}</div><div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${handH}</div>${over}${rulesH()}${cfgH()}${storyH()}`}
function regClick(a,v){const s=G;
 if(a==='sel'){if(!myTurn()||s.phase==='pick')return;const i=ui.sel.indexOf(v);i<0?ui.sel.push(v):ui.sel.splice(i,1);ui.err='';Snd.play(i<0?'sel':'unsel');return render()}
 if(a==='play')return dispatch({t:'play',cards:ui.sel.slice()});
 if(a==='disc')return dispatch({t:'discard',cards:ui.sel.slice()});
 if(a==='auto'){ui.sel=RG.bestDiscard(s);return render()}
 if(a==='yield')return dispatch({t:'yield'});if(a==='flip')return dispatch({t:'flip'});
 if(a==='pick')return dispatch({t:'pick',to:+v})}
async function regPre(prev,ns,own){const ev=ns.ev,pl=ev.find(e=>e.t==='play'),dc=ev.find(e=>e.t==='disc'),kill=ev.find(e=>e.t==='kill');
 if(pl){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(pl.p,pl.c);await flyCards(items,'#boss',{fade:false,scale:.6})}
 if(dc&&own&&cap&&cap.length&&!pl){Snd.play('whoosh');await flyCards(cap,'#pdisc',{scale:.3,rot:30})}
 if(kill&&prev&&prev.en){const hit=ev.find(e=>e.t==='hit');ui.viewEn={...prev.en,dmg:prev.en.dmg+(hit?hit.v:0)}}return{}}

