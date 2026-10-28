function pileH(id,label,n,face){return`<div class="pile ${n?'':'empty'}" id="${id}"><div class="stk">${n?(face?cardH(face,{}):[0,1,2].slice(0,Math.min(3,n)).map(()=>cardH('',{back:1})).join('')):''}</div>${label}${n?`<b>${n}</b>`:''}</div>`}
function regicideH(){
 if(ui.tv)return regicideTVH();
 const X=G.g==='regix',E=X?RGX:RG; /* Regicidio X: stessa vista, in più classi e tratti (22q-regicide-x.js) */
 if(X&&G.camp&&G.fase!=='fight')return RX.campH(G);
 const s=G,en=ui.viewEn||s.en,cur=s.cur,cover=needCover(),mine=myTurn(),cname=esc(s.names[cur]),sel=ui.sel;
 const owner=viewer(),okHand=!cover&&owner>=0;
 const hand=okHand?s.hands[owner].slice().sort((a,b)=>E.cv(a)-E.cv(b)||(a<b?-1:1)):[];
 const ob=s.phase==='discard'&&mine;
 let boss='',act='';
 if(en){const rk=P(en.c).r,su=P(en.c).s,hp=X?RGX.hpE(en):RG.hpOf[rk],atk=X?RGX.atkBase(en,s):RG.atOf[rk],eff=Math.max(0,atk-en.sh),left=Math.max(0,hp-en.dmg);act=X&&s.camp?RX.tappa(s):`${(X?RX.ACTS:ACTS)[rk][0]} · ${(X?RX.ACTS:ACTS)[rk][1]} · nemico ${Math.min(12,12-s.castle.length)}/12`;
  boss=`<div class="arena3"><div class="side">${pileH('pcastle','Castello',s.castle.length)}</div>
  <div class="boss ${su}" id="boss"><div class="frame">${cardH(en.c,{cls:'xl holo',boss:1})}</div>
   <div class="imm ${en.can?'off':''}" title="${en.can?'Immunità annullata dal Jolly':'Immune: '+(X?RX.imm(en):IMMTXT[su])}">IMMUNE ${X?RX.simboli(en):SYM[su]}</div>${X?RX.sigillo(en):''}
   <div class="gem atk" id="gatk" title="Attacco">${eff}<small>ATT</small></div><div class="gem hp" id="ghp" title="Vita">${left}<small>VITA</small></div>${en.sh?`<div class="gem sh" title="Scudo dalle Picche">−${en.sh}</div>`:''}</div>
  <div class="side">${pileH('ptav','Taverna',s.tav.length)}${pileH('pdisc','Scarti',s.disc.length,s.disc.length?s.disc[s.disc.length-1]:null)}</div></div>
  <div class="nameplate"><span class="rib">${RN[rk]} di ${SN[su]}</span><em>${esc(titolo(en.c))}${X&&en.tr?' · <b class="rxtrn">'+RGX.TR[en.tr].n+'</b>':''} · ${X?RX.imm(en):en.can?'immunità annullata':IMMTXT[su]}</em><div class="hpbar"><i style="width:${left/hp*100}%"></i></div></div>`}
 const played=s.played.map(c=>{const nw=!seen.p.has(c);return cardH(c,{cls:'sm '+(nw?'pop':''),style:`--r:${(hash(c)%9)-4}deg`})}).join('')||'<span class="muted">Il campo di battaglia è vuoto</span>';seen.p=new Set(s.played);
 const pls=`<div class="players" id="players">${s.names.map((n,i)=>`<div class="pl ${i===cur&&!s.over?'act':''}"><div class="av" id="av${i}">${esc(n[0]||'?')}</div><span class="n">${X?RX.mini(s,i):''}${esc(n)}${seatTag(i)}</span><span class="hc">${s.hands[i].length}🂠</span></div>`).join('')}${s.n===1?`<div class="pl row0"><div class="av">J</div><span class="n">Jolly</span><span class="hc">${s.jl}</span></div>`:''}</div>`;
 let bub='',prev='',ctl='';const nar=esc(s.log[s.log.length-1]||'');
 if(s.over||cover)bub='';
 else if(ui.anim)bub=`<div class="bubble"><span class="nar">${nar}</span>&nbsp;</div>`;
 else if(!mine)bub=`<div class="bubble"><span class="nar">${nar}</span>Tocca a <b>${cname}</b><span class="dots"></span><small>${ui.busy?'invio mossa…':s.phase==='discard'?'deve scartare '+s.owed+' per il danno':s.phase==='pick'?'sta scegliendo chi gioca dopo':'sta scegliendo cosa giocare'}</small></div>`;
 else if(s.phase==='play'){bub=`<div class="bubble me"><span class="nar">${nar}</span><b>${cname}</b>, a te la mossa! ${infoH('Scegli le carte da giocare, oppure cedi (subirai comunque l’attacco).')}</div>`;
  if(sel.length){const e=E.checkPlay(s,sel),pv=e?null:X?RGX.preview(s,sel,ui.pw):RG.preview(s,sel);
   prev=e?`<span class="chip w">${esc(e)}</span>`:pv.jester?'<span class="chip sh">Annulla l’immunità · scegli chi gioca dopo</span>':`<span class="chip atk">⚔ danno ${pv.dmg}${pv.x2?' (×2)':''}</span>${pv.pw?`<span class="chip pw">${RGX.CLS[s.cls[cur]].p}</span>`:''}${pv.heal?`<span class="chip hl">♥ ${pv.heal} in Taverna</span>`:''}${pv.drawFull?(pv.draw?`<span class="chip sh">♦ pesca ${pv.draw}${pv.draw<pv.atk?' (mano piena)':''}</span>`:'<span class="chip off">♦ mano piena: non peschi</span>'):''}${pv.shield?`<span class="chip sh">♠ attacco −${pv.shield}</span>`:''}${pv.ign?`<span class="chip off">${SYM[pv.ign]} ignorato (immune)</span>`:''}`}
  else prev='<span class="muted">Tocca le carte per selezionarle</span>';
  ctl=`<button class="b play" data-a="play" ${(!sel.length||E.checkPlay(s,sel))?'disabled':''}>Attacca${sel.length?' ('+E.sum(sel)+')':''}</button><button class="b yld sm" data-a="yieldask">Cedi…</button>${s.n===1&&s.jl?`<button class="b gold sm" data-a="flip">Jolly (${s.jl})</button>`:''}`}
 else if(s.phase==='discard'){const sm=E.sum(sel),pc=Math.min(100,sm/s.owed*100);
  bub=`<div class="bubble atk"><span class="nar">${nar}</span>⚔ Il nemico colpisce <b>${cname}</b>! Scarta ${s.owed} ${infoH('Scarta carte per almeno '+s.owed+' punti: il numero rosso è il loro valore.')}</div>`;
  prev=`<div class="meter ${sm>=s.owed?'ok':''}"><i style="width:${pc}%"></i><b>${sm} / ${s.owed}</b></div>`;
  ctl=`<button class="b disc" data-a="disc" ${sm<s.owed?'disabled':''}>Para il colpo</button><button class="b grn sm" data-a="auto">Suggerisci</button>${s.n===1&&s.jl?`<button class="b gold sm" data-a="flip">Jolly (${s.jl})</button>`:''}`}
 else if(s.phase==='pick'){bub=`<div class="bubble me"><b>${cname}</b> ha giocato il Jolly!<small>Scegli chi gioca dopo.</small></div>`;ctl=s.names.map((n,i)=>`<button class="b play" data-a="pick" data-v="${i}">${esc(n)}</button>`).join('')}
 const n=hand.length,same=seen.h&&seen.h.owner===owner,prevIds=new Set(same?seen.h.ids:[]),now=Date.now()/1000;
 const handH=cover?coverH(cur)
 :`<div class="hand" id="hand">${hand.map((c,i)=>{const mid=(n-1)/2,rot=(i-mid)*(n>6?3.2:4),ty=Math.pow(Math.abs(i-mid),2)*1.8,isNew=seen.h!==null&&!prevIds.has(c);
   return`<div class="slot ${sel.includes(c)?'sel':''}" style="--rot:${rot}deg;--ty:${ty}px">${X?RX.sig(s,c):''}${cardH(c,{cls:(mine?'':'off ')+(isNew?'deal ':'fl8 '),style:`--fd:-${((now+i*.43)%3.6).toFixed(2)}s`,attrs:`data-a="sel" data-v="${c}" tabindex="0" role="button" aria-label="${E.fmt(c)}"`,dv:ob?E.cv(c):0})}</div>`}).join('')||(okHand?'<span class="muted">Nessuna carta in mano</span>':'')}</div>`;
 seen.h=okHand?{owner,ids:hand}:null;
 const over=endH();
 return`${hudH(GN(s.g))}${act?`<div class="acttag">${act}</div>`:''}<div class="rgx"><section class="arena rgA">${boss}<div class="battle" id="played">${played}</div></section><div class="rgB">${pls}${X?RX.barra(s,okHand?owner:-1):''}${bub}<div class="prev">${prev}</div><div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div></div><div class="handbox rgH">${handH}</div></div>${over}${ui.yc&&s.phase==='play'&&mine?`<div class="modal"><div class="box col"><h2>Cedere il turno?</h2><p>Non giochi nessuna carta e subisci comunque l’attacco del nemico.</p><button class="b disc" data-a="yieldno">No, torna indietro</button><button class="b yld" data-a="yield">Sì, cedi</button></div></div>`:''}${X?RX.info(s):''}${rulesH()}${cfgH()}${storyH()}`}
function regClick(a,v){const s=G;
 if(s.g==='regix'&&RX.click(a,v))return;
 if(a==='sel'){if(!myTurn()||s.phase==='pick')return;const i=ui.sel.indexOf(v);i<0?ui.sel.push(v):ui.sel.splice(i,1);ui.err='';Snd.play(i<0?'sel':'unsel');return render()}
 if(a==='play'){const pw=s.g==='regix'&&!!ui.pw;ui.pw=false;return dispatch({t:'play',cards:ui.sel.slice(),pw})}
 if(a==='disc')return dispatch({t:'discard',cards:ui.sel.slice()});
 if(a==='auto'){ui.sel=ENG[s.g].bestDiscard(s);return render()}
 if(a==='yieldask'){ui.yc=true;return render()}if(a==='yieldno'){ui.yc=false;return render()}if(a==='yield'){ui.yc=false;return dispatch({t:'yield'})}if(a==='flip')return dispatch({t:'flip'});
 if(a==='pick')return dispatch({t:'pick',to:+v})}
async function regPre(prev,ns,own){const ev=ns.ev,pl=ev.find(e=>e.t==='play'),dc=ev.find(e=>e.t==='disc'),kill=ev.find(e=>e.t==='kill');
 if(pl){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(pl.p,pl.c);await flyCards(items,'#boss',{fade:false,scale:.6})}
 if(dc&&own&&cap&&cap.length&&!pl){Snd.play('whoosh');await flyCards(cap,'#pdisc',{scale:.3,rot:30})}
 if(kill&&prev&&prev.en){const hit=ev.find(e=>e.t==='hit');ui.viewEn={...prev.en,dmg:prev.en.dmg+(hit?hit.v:0)}}return{}}
