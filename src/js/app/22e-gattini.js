/* ================= GATTINI ESPLOSIVI ================= */
const KST={bomb:['💣','#3a0f14','#ff6b4a'],defuse:['🧯','#145a3a','#c9ffe0'],nope:['🚫','#5a2a8a','#f0dcff'],attack:['⚔️','#a8261c','#ffe0d0'],skip:['⏩','#1d5fb0','#d8ecff'],
 favor:['🎁','#b83a78','#ffe0f0'],shuffle:['🔀','#12767a','#d0fbff'],future:['🔮','#4a3ca8','#e6e0ff'],cat1:['🐱','#c98a3a','#fff3d8','🛏️'],cat2:['🐱','#6b4fb0','#efe6ff','🧙'],cat3:['🐱','#2a5a7a','#dcefff','🏴‍☠️'],cat4:['🐱','#b8541f','#ffe9d8','🍳'],cat5:['🐱','#2b3a5c','#dfe8ff','🚀']};
const KORD=['defuse','nope','attack','skip','favor','shuffle','future','cat1','cat2','cat3','cat4','cat5','bomb'];
function kcardH(c,o={}){const t=KITT.T(c),k=KST[t];return`<div class="kc ${KITT.NAMES[t].length>9?'lng ':''}${o.cls||''}" style="--kb:${k[1]};--kf:${k[2]}" ${o.attrs||''}><i>${k[0]}</i>${k[3]?`<em>${k[3]}</em>`:''}<b>${KITT.NAMES[t]}</b></div>`}
const kSort=h=>h.slice().sort((a,b)=>KORD.indexOf(KITT.T(a))-KORD.indexOf(KITT.T(b))||(a<b?-1:1));
function kEffTxt(s,p){const by=esc(s.names[p.by]),e=p.eff,nm=k=>KITT.NAMES[k];
 if(e.k==='favor')return`<b>${by}</b> gioca <b>Favore</b> su <b>${esc(s.names[e.to])}</b>`;
 if(e.k==='pair')return`<b>${by}</b> gioca una <b>coppia di gatti</b> e ruba una carta a <b>${esc(s.names[e.to])}</b>`;
 if(e.k==='triple')return`<b>${by}</b> gioca un <b>tris di gatti</b> e chiede “${nm(e.name)}” a <b>${esc(s.names[e.to])}</b>`;
 return`<b>${by}</b> gioca <b>${nm(e.k)}</b>`}
function kittH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),ph=s.phase,al=KITT.alive(s);
 const key=s.gid+':'+s.evn;if(ui.kk!==key){ui.kk=key;ui.ksel=[];ui.kname=null;ui.kins=null}
 const sel=(ui.ksel||[]).filter(c=>v>=0&&s.hands[v]&&s.hands[v].includes(c));
 const pl=`<div class="players kpl" id="players">${s.names.map((n,i)=>{const out=!s.alive[i];
  return`<div class="pl ${i===s.cur&&!s.over?'act':''} ${i===s.turner&&!s.over&&i!==s.cur?'trn':''} ${out?'out':''}"><div class="av" id="av${i}">${out?'💥':esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${out?'✕':s.hands[i].length+'🂠'+(i===s.turner&&s.turns>1?' ×'+s.turns:'')}</span></div>`}).join('')}</div>`;
 const info=`<div class="tinfo"><span class="chip">Mazzo ${s.deck.length}</span><span class="chip">💣 ${al.length-1} nel mazzo</span>${s.turns>1&&!s.over?`<span class="chip pal">${esc(s.names[s.turner])}: ${s.turns} turni</span>`:''}</div>`;
 const top=s.discard.length?kcardH(s.discard[s.discard.length-1],{cls:'sm'}):'<div class="kc sm empty"><b>Scarti</b></div>';
 const peek=s.peek&&v>=0&&s.peek.p===v&&s.peek.cards.length?`<div class="kpeek"><small>Le prime carte del mazzo (la prima è in cima)</small><div class="krow">${s.peek.cards.map(c=>kcardH(c,{cls:'sm'})).join('')}</div></div>`:'';
 const table=`<div class="ktable"><div class="kpile"><div class="kc sm back"><i>🐾</i><b>Mazzo</b></div><span>${s.deck.length}</span></div><div class="kpile">${top}<span>${s.discard.length}</span></div></div>${peek}`;
 let ctl='',hint=s.over?'':'Gioca le carte che vuoi, poi pesca per finire il turno.',ownable=false;
 const tg=al.filter(i=>i!==s.cur&&s.hands[i].length);
 if(mine&&!cover&&!s.over){
  if(ph==='play'){ownable=true;const types=sel.map(KITT.T),t0=types[0],allSame=types.every(x=>x===t0),isC=KITT.isCat(t0||'');
   const pesca=`<button class="b play" data-a="kdraw">Pesca${s.turns>1?' (ancora '+s.turns+' turni)':' e chiudi il turno'}</button>`;
   if(sel.length===1&&KITT.ACTIONS.includes(t0)){
    if(t0==='favor')ctl=`<div class="hlabel">Chiedi un favore a…</div><div class="ktg">${tg.map(i=>`<button class="b sm gold" data-a="kplay" data-v="${i}">${esc(s.names[i])} · ${s.hands[i].length}🂠</button>`).join('')||'<small class="muted">Nessuno ha carte</small>'}</div>`;
    else ctl=`<button class="b gold" data-a="kplay">Gioca ${KITT.NAMES[t0]}</button>`;
    ctl+=pesca;hint={attack:'Salti la pesca e il prossimo giocatore farà due turni.',skip:'Chiudi il turno senza pescare.',shuffle:'Mescola il mazzo: le bombe cambiano posto.',future:'Guardi in segreto le prime tre carte.',favor:'Il giocatore scelto decide quale carta darti.'}[t0]}
   else if(sel.length>=1&&allSame&&isC){
    if(sel.length===1)hint='Un gatto da solo non fa nulla: seleziona un altro gatto uguale per una coppia, o due per un tris.';
    else{hint=sel.length===2?'Coppia: rubi una carta a caso a un giocatore.':'Tris: chiedi una carta per nome a un giocatore.';
     const needName=sel.length===3;
     ctl=(needName?`<div class="hlabel">Che carta chiedi?</div><div class="kchips">${['defuse','nope','attack','skip','favor','shuffle','future',...KITT.CATS].map(k=>`<button class="kch ${ui.kname===k?'sel':''}" data-a="kname" data-v="${k}">${KST[k][0]}${KST[k][3]||''} ${KITT.NAMES[k]}</button>`).join('')}</div>`:'')
      +`<div class="hlabel">…a chi?</div><div class="ktg">${tg.map(i=>`<button class="b sm gold" data-a="kcombo" data-v="${i}" ${needName&&!ui.kname?'disabled':''}>${esc(s.names[i])} · ${s.hands[i].length}🂠</button>`).join('')||'<small class="muted">Nessuno ha carte</small>'}</div>`}
    ctl+=pesca}
   else{ctl=pesca;if(sel.length)hint='Seleziona una sola carta azione, oppure 2–3 gatti uguali.'}}
  else if(ph==='nope'){const p=s.pend,has=v>=0&&s.hands[v].some(c=>KITT.T(c)==='nope');
   hint=`${kEffTxt(s,p)}.<br>${p.n?`Niet già giocati: ${p.n} · adesso l’effetto è <b>${p.n%2?'annullato':'valido'}</b>.`:'Vuoi fermarla con un Niet?'}`;
   ctl=`<button class="b play" data-a="knope" ${has?'':'disabled'}>🚫 Niet!</button><button class="b disc" data-a="kpass">Lascia passare</button>`}
  else if(ph==='favor'){ownable=true;hint=`<b>${esc(s.names[s.pend.from])}</b> ti chiede un favore: scegli la carta da dare.`;ctl=`<button class="b gold" data-a="kgive" ${sel.length===1?'':'disabled'}>Dai la carta</button>`}
  else if(ph==='insert'){const n=s.deck.length,opts=[[0,'In cima'],[1,'2ª'],[2,'3ª'],[Math.floor(n/2),'A metà'],[n,'In fondo']].filter(([i])=>i<=n).filter(([i],k,a)=>a.findIndex(x=>x[0]===i)===k);
   hint='Disinnescato! Rimetti il Micio Bomba nel mazzo: solo tu saprai dov’è.';
   ctl=`<div class="kchips">${opts.map(([i,l])=>`<button class="kch ${ui.kins===i?'sel':''}" data-a="kins" data-v="${i}">${l}</button>`).join('')}<button class="kch" data-a="kins" data-v="r">🎲 A caso</button></div><button class="b gold" data-a="kinsok" ${ui.kins==null?'disabled':''}>Rimetti la bomba</button>`}}
 else if(!s.over&&!cover){hint=ph==='nope'?`${kEffTxt(s,s.pend)}: <b>${esc(s.names[s.cur])}</b> decide se dire Niet…`:ph==='favor'?`<b>${esc(s.names[s.cur])}</b> sceglie una carta da dare…`:ph==='insert'?`<b>${esc(s.names[s.cur])}</b> rimette la bomba nel mazzo…`:''}
 let hand='';
 if(cover)hand=coverH(s.cur);
 else if(v>=0&&s.hands[v]){hand=s.hands[v].length?`<div class="khand">${kSort(s.hands[v]).map(c=>{const t=KITT.T(c),can=ownable&&(ph==='favor'?t!=='bomb':!['defuse','nope','bomb'].includes(t));return kcardH(c,{cls:(sel.includes(c)?'sel ':'')+(can?'can':''),attrs:`data-a="ksel" data-v="${c}" role="button" tabindex="0"`})}).join('')}</div>`:(s.alive[v]?'':'<div class="muted" style="text-align:center">💥 Sei saltato in aria: guarda come va a finire.</div>')}
 const bub=`<div class="bubble ${mine&&!cover&&!s.over?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${s.over?'':(mine&&!cover?`<b>${esc(s.names[s.cur])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[s.cur])}</b><span class="dots"></span>`)}${hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">😼</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><p>L’ultimo gatto rimasto in piedi.</p><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 return`${hudH('Exploding Kittens')}${info}${pl}${table}${bub}<div class="ctl kctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox khb">${hand}</div>${end}${rulesH()}${cfgH()}`}
function kittClick(a,v){const s=G;if(!myTurn())return;
 if(a==='ksel'){const t=KITT.T(v);if(['defuse','nope','bomb'].includes(t)){ui.err=t==='nope'?'Il Niet si gioca solo in risposta a un’altra carta':t==='defuse'?'Il Disinnesco scatta da solo quando peschi una bomba':'';return render()}
  ui.err='';const cur=ui.ksel||[];
  if(s.phase==='favor'){ui.ksel=[v]}
  else if(cur.includes(v))ui.ksel=cur.filter(c=>c!==v);
  else if(KITT.isCat(v)&&cur.length&&cur.every(KITT.isCat)&&cur.every(c=>KITT.T(c)===t))ui.ksel=[...cur,v].slice(0,3);
  else ui.ksel=[v];
  Snd.play('sel');return render()}
 if(a==='kname'){ui.kname=v;return render()}
 if(a==='kdraw'){return dispatch({t:'draw'})}
 if(a==='kplay'){const c=(ui.ksel||[])[0];if(!c)return;return dispatch(KITT.T(c)==='favor'?{t:'play',c,to:+v}:{t:'play',c})}
 if(a==='kcombo'){const cs=(ui.ksel||[]).slice();return dispatch({t:'combo',cs,to:+v,name:cs.length===3?ui.kname:undefined})}
 if(a==='knope')return dispatch({t:'nope'});
 if(a==='kpass')return dispatch({t:'pass'});
 if(a==='kgive'){const c=(ui.ksel||[])[0];if(c)return dispatch({t:'give',c})}
 if(a==='kins'){ui.kins=v==='r'?Math.floor(Math.random()*(s.deck.length+1)):+v;return render()}
 if(a==='kinsok'&&ui.kins!=null)return dispatch({t:'insert',i:ui.kins})}
const KIFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='play'){Snd.play('whoosh');await W(260)}
  else if(e.t==='nope'){Snd.play('nope');await W(380)}
  else if(e.t==='draw'){Snd.play('deal');await W(160)}
  else if(e.t==='bomb'){Snd.play('impact');await W(380)}
  else if(e.t==='defuse'){Snd.play('redeem');await W(300)}
  else if(e.t==='out'){Snd.play('boom');await W(700)}
  else if(e.t==='attack'){Snd.play('atk');await W(300)}
  else if(e.t==='steal'||e.t==='give'){Snd.play('meow');await W(300)}
  else if(e.t==='shuffle'||e.t==='future'){Snd.play('draw');await W(260)}
  else if(e.t==='insert'){Snd.play('deal');await W(160)}}
  endFx(ns)}};
