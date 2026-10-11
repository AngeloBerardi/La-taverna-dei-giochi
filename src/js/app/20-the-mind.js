/* ================= THE MIND / THE MIND EXTREME ================= */
const MCOL={n:'n',w:'w',r:'r'};
function mcardH(c,o={}){if(c==null||o.back)return`<div class="mcd back ${o.cls||''}" ${o.attrs||''}><i>?</i></div>`;
 const k=MIND.col(c),v=MIND.num(c);return`<div class="mcd ${MCOL[k]} ${o.cls||''}" ${o.attrs||''}><b>${v}</b><span>${v}</span></div>`}
function mindH(){const s=G,v=viewer(),L=local(),x=s.x,me=v>=0?s.hands[v]:[],ph=s.phase,inPlay=ph==='play';
 const lives=Array.from({length:Math.max(s.lives,0)},()=>'❤').join(''),stars=Array.from({length:s.stars},()=>'★').join('');
 const top=`<div class="mtop"><div class="mlv">Livello <b>${s.level}</b><small>/ ${s.maxLevel}</small></div><div class="mst"><span class="mlife" title="Vite">${lives||'💔'}</span><span class="mstar" title="Shuriken">${stars||'<s>★</s>'}</span></div></div>`;
 const pileH=(arr,k)=>{const last=arr[arr.length-1];if(!last)return`<div class="mpile empty ${k}"><span>${k==='r'?'50 ↓':k==='w'?'1 ↑':'1 ↑'}</span></div>`;
  const bl=arr.some(e=>e.h);return`<div class="mpile ${k}" id="mp${k}">${bl?mcardH(null,{cls:'sm'})+`<em>${arr.length} coperte</em>`:mcardH(last.c)+`<em>${arr.length}</em>`}</div>`};
 const piles=x?`<div class="mpiles">${pileH(s.wp,'w')}${pileH(s.rp,'r')}</div>`:`<div class="mpiles">${pileH(s.wp,'n')}</div>`;
 const pl=`<div class="mplayers">${s.names.map((n,i)=>`<div class="mpl ${s.ready[i]&&ph==='ready'?'rdy':''} ${i===v?'me':''}"><div class="av">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${s.hands[i].length}🂠${ph==='ready'?(s.ready[i]?' ✓':''):''}</span></div>`).join('')}</div>`;
 const burn=s.burn.length?`<div class="mburn"><small>Scartate</small>${s.burn.slice(-10).map(b=>mcardH(b.c,{cls:'xs'})).join('')}</div>`:'';
 let rev='';if(s.x&&s.blind&&s.res&&s.res.blindErr&&ph==='summary'){const bad=new Set(s.res.blindErr.map(e=>e.c));rev=`<div class="mrev"><small>Carte coperte rivelate</small><div>${[...s.wp,...s.rp].filter(e=>true).map(e=>mcardH(e.c,{cls:'xs '+(bad.has(e.c)?'bad':'')})).join('')}</div></div>`}
 const seatSel=L.length>1?`<div class="mseat"><small>Giochi come</small>${L.map(i=>`<button class="b sm ${i===v?'gold':''}" data-a="mseat" data-v="${i}">${esc(s.names[i])}</button>`).join('')}</div>`:'';
 let bub=esc(s.log[s.log.length-1]||''),ctl='',hand='';
 if(v<0)bub='Guardi la partita';
 else if(ph==='ready'){const rd=s.ready.filter(Boolean).length;bub+=` · pronti ${rd}/${s.n}`;ctl=s.ready[v]?`<button class="b disc" data-a="munready">Aspetta, non sono pronto</button>`:`<button class="b play" data-a="mready">Sono pronto</button>`}
 else if(inPlay){ctl=`<button class="b disc sm" data-a="mstop">✋ Stop</button>${s.stars>0?`<button class="b gold sm" data-a="mstar">★ Shuriken</button>`:''}`;if(!x&&me.length)ctl=`<button class="b play" data-a="mplay" ${ui.anim?'disabled':''}>Gioca la più bassa</button>`+ctl}
 else if(ph==='starvote'){const sv=s.star,voted=sv.v[v]!=null;bub=`${esc(s.names[sv.by])} propone uno shuriken: ognuno scarta la propria carta più ${x?'bassa (bianca) o più alta (rossa)':'bassa'}.`;
  if(!voted){ctl=x?`<button class="b play sm" data-a="mvote" data-v="w">Sì · scarto bianca</button><button class="b play sm" data-a="mvote" data-v="r">Sì · scarto rossa</button>`:`<button class="b play" data-a="mvote" data-v="n">Sì</button>`;ctl+=`<button class="b disc sm" data-a="mvote" data-v="no">No</button>`}else ctl=`<small class="muted">Aspettiamo gli altri (${sv.v.filter(Boolean).length}/${s.n})</small>`}
 else if(ph==='summary'&&!s.over){const r=s.res||{};bub=`Livello ${s.level} completato`+(r.reward&&r.reward.length?(r.reward[0]==='life'?' · +1 vita ❤':' · +1 shuriken ★'):'');ctl=`<button class="b play" data-a="next">Livello ${s.level+1}</button>`}
 if(v>=0&&s.hands[v]){const fw=x?me.find(c=>MIND.col(c)==='w'):me[0],fr=x?me.find(c=>MIND.col(c)==='r'):null;
  hand=me.length?`<div class="mhand ${ph==='ready'?'tbl':''}">${me.map(c=>{const pl=inPlay&&(c===fw||c===fr);return mcardH(c,{cls:(pl?'can':'')+(ph==='ready'?' flat':''),attrs:pl?`data-a="mplay" data-v="${MIND.col(c)}" role="button" tabindex="0"`:''})}).join('')}</div>`:`<div class="mhand"><span class="muted">Mano vuota</span></div>`}
 const end=s.over?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${s.over.win?'🧠':'💀'}</div><h2>${s.over.win?'Siete una sola mente!':'Le menti si sono perse'}</h2><p>${s.over.win?'Avete completato tutti i '+s.maxLevel+' livelli.':esc(s.over.reason)+'.'}</p><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 return`${hudH(GN(s.g))}${top}${piles}${pl}<div class="bubble ${inPlay?'':'me'}"><span class="nar">${bub}</span></div>${rev}${burn}<div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div>${seatSel}<div class="handbox">${hand}</div>${s.over&&!ui.anim?end:''}${rulesH()}${cfgH()}`}
function mindClick(a,v){const s=G;
 if(a==='mseat'){ui.ms=+v;return render()}
 if(!myTurn())return;
 if(a==='mready')return dispatch({t:'ready'});if(a==='munready')return dispatch({t:'unready'});
 if(a==='mstop')return dispatch({t:'stop'});if(a==='mstar')return dispatch({t:'star',pick:s.x?'w':'n'});
 if(a==='mvote')return v==='no'?dispatch({t:'starvote',yes:false}):dispatch({t:'starvote',pick:v});
 if(a==='mplay')return dispatch(s.x?{t:'play',col:v||'w'}:{t:'play'})}
const MIFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='go'){banner('VIA!','');Snd.play('turn');await W(350)}
  else if(e.t==='play'){Snd.play('deal')}
  else if(e.t==='err'){Snd.play('err');banner('ERRORE!','Carte saltate');await W(700)}
  else if(e.t==='star'){Snd.play('redeem');banner('SHURIKEN','');await W(600)}
  else if(e.t==='done'){Snd.play('redeem')}
  else if(e.t==='stop'){Snd.play('ok')}}
  endFx(ns)}};
