/* ================= BEHIND THE THRONE (vista) ================= */
const TCI={king:['👑','#b8860b','#fff3b0'],queen:['👸','#8e2a6b','#f4c2e3'],general:['⚔️','#a32a2a','#f3b9b9'],jester:['🃏','#2a8a5a','#bdf0d3'],judge:['⚖️','#3a4fa8','#c3cdf5'],assassin:['🗡️','#3b3f4a','#c9ccd6'],prophet:['🔮','#6a3aa8','#d9c4f5'],minstrel:['🎻','#b8641f','#f5d3b0'],alchemist:['⚗️','#1f8a8a','#b3ecec']};
const TTX={king:'Non scambi se in fila hai meno carte dei Re che hai.',queen:'Non distruggi se in fila hai al massimo tante carte quante le tue Regine.',general:'Una volta per turno: −3 alla carta.',jester:'Una volta per turno: ±1 alla carta.',judge:'Ripeti un potere già usato (anche di un mazzetto non tuo).',assassin:'Una volta per turno: −2 alla carta.',prophet:'Guardi la prima carta del mazzo.',minstrel:'Se hai il Menestrello più grosso, si scambia solo lui.',alchemist:'Se hai l’Alchimista più grosso, si distrugge solo lui.'};
const tcH=(t,o={})=>{const k=TCI[t];return`<div class="tc ${o.cls||''}" style="--tc:${k[1]};--tl:${k[2]}" ${o.attrs||''}><b class="tn">${THRONE.VAL[t]}</b><div class="tw"><i>${k[0]}</i></div><span class="tt">${THRONE.NAMES[t]}</span>${o.txt?`<small class="tx">${TTX[t]}</small>`:''}<b class="tn r">${THRONE.VAL[t]}</b>${o.n!=null?`<em class="tcn">×${o.n}</em>`:''}</div>`};
const tcBack=(cls)=>`<div class="tc back ${cls||''}"><i>♛</i></div>`;
function thH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,ph=s.phase,p=s.cur;
 const key=s.gid+':'+s.evn;if(ui.tk2!==key){ui.tk2=key;ui.tm=null;ui.tj=null}
 const st=THRONE.status(s),can=a=>!THRONE.act(s,a).err;
 const chips=`<span class="chip">Mazzo ${s.deck.length}</span><span class="chip">Scarti ${s.discard.length}</span>`;
 const strip=stripH(s,i=>({b:THRONE.score(s,i),trn:false}));
 const pl=s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}"><div class="av">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${THRONE.score(s,i)} pt</span></div>`).join('');
 /* fila corrente */
 const last=s.row.length-1,eff=THRONE.curVal(s),prv=THRONE.prevVal(s);
 const rowH=`<div class="trow">${s.row.length?s.row.map((c,i)=>`<div class="tslot">${tcH(c,{cls:'mid'})}<small class="tv ${i===last&&s.mod?'m':''}">${i===last?eff:THRONE.VAL[c]}</small></div>`).join(''):`<div class="trow0">${tcBack('mid')}<small>Pesca per iniziare la fila</small></div>`}</div>`;
 const stT=!s.row.length?'':st==='bust'?'<b class="tb bad">Troppo alta! Abbassala o rinuncia</b>':st==='eq'?'<b class="tb eq">Pari! Puoi distruggere una carta</b>':`<b class="tb">Più bassa o pari della precedente${prv!=null?' ('+prv+')':''}</b>`;
 /* mazzetti di tutti */
 const stk=s.names.map((n,i)=>{const ts=THRONE.TYPES.filter(t=>THRONE.cnt(s,i,t)).sort((a,b)=>THRONE.VAL[b]-THRONE.VAL[a]);
  const tg=ui.tm&&mine?`data-tgp="${i}"`:'';
  return`<div class="tpl ${i===p&&!s.over?'act':''}"><div class="tpn">${esc(n)}<span>${THRONE.score(s,i)}</span></div><div class="tst">${ts.map(t=>{const big=THRONE.largest(s,i,t),ok=ui.tm&&mine&&can(ui.tm==='swap'?{t:'swap',to:i,take:t}:{t:'destroy',p:i,type:t});
   return tcH(t,{cls:'mini '+(big?'big ':'')+(s.used[i][t]&&big?'spent ':'')+(ui.tm&&mine?(ok?'tgt':'dim'):''),n:THRONE.cnt(s,i,t),attrs:ui.tm&&mine&&ok?`data-a="ttg" data-v="${i}:${t}" role="button" tabindex="0"`:''})}).join('')||'<small class="muted">nessun mazzetto</small>'}</div></div>`}).join('');
 const mid=`<div class="tmid"><div class="tfila">${rowH}${stT}${s.row.length>1||s.mod?`<small class="muted">${s.row.length}/5 carte${s.mod?' · modifica '+(s.mod>0?'+':'')+s.mod:''}</small>`:''}</div><div class="tpls">${stk}</div></div>`;
 /* comandi */
 let ctl='',hint='';
 if(mine&&ph==='turn'){
  const pw=[];
  if(s.row.length){
   ['general','assassin'].forEach(k=>{if(THRONE.avail(s,p,k))pw.push(`<button class="b sm gold" data-a="tpow" data-v="${k}">${THRONE.NAMES[k]} −${k==='general'?3:2}</button>`)});
   if(THRONE.avail(s,p,'jester'))pw.push(`<button class="b sm gold" data-a="tpow" data-v="jester||1">Giullare +1</button><button class="b sm gold" data-a="tpow" data-v="jester||-1">Giullare −1</button>`)}
  if(THRONE.avail(s,p,'prophet')&&!s.peek)pw.push(`<button class="b sm gold" data-a="tpow" data-v="prophet">🔮 Guarda il mazzo</button>`);
  if(THRONE.avail(s,p,'judge')&&s.row.length){const vs=['general','assassin','jester','prophet'].filter(k=>THRONE.largest(s,p,k)&&s.used[p][k]);
   vs.forEach(k=>{if(k==='jester')pw.push(`<button class="b sm gold" data-a="tpow" data-v="judge|jester|1">⚖️ Giullare +1</button><button class="b sm gold" data-a="tpow" data-v="judge|jester|-1">⚖️ Giullare −1</button>`);else pw.push(`<button class="b sm gold" data-a="tpow" data-v="judge|${k}">⚖️ ripeti ${THRONE.NAMES[k]}</button>`)})}
  if(s.peek&&s.peek.p===v)hint=`In cima al mazzo: <b>${THRONE.NAMES[s.peek.card]} (${THRONE.VAL[s.peek.card]})</b>`;
  const main=[`<button class="b play" data-a="treveal" ${can({t:'reveal'})?'':'disabled'}>Pesca</button>`,
   `<button class="b gold" data-a="tcollect" ${can({t:'collect'})?'':'disabled'}>Raccogli</button>`,
   `<button class="b gold ${ui.tm==='swap'?'sel':''}" data-a="tmode" data-v="swap" ${s.row.length&&st!=='bust'?'':'disabled'}>Scambia</button>`,
   st==='eq'&&!s.destroyed?`<button class="b gold ${ui.tm==='destroy'?'sel':''}" data-a="tmode" data-v="destroy">Distruggi</button>`:'',
   s.row.length?`<button class="b disc" data-a="tgive">Rinuncia</button>`:''];
  ctl=`<div class="tbtn">${main.join('')}</div>${pw.length?`<div class="tbtn">${pw.join('')}</div>`:''}`;
  if(ui.tm)hint=(ui.tm==='swap'?'Scambio: dai la fila a un avversario e prendi una sua carta. Tocca la carta che vuoi.':'Distruzione: tocca una carta sul tavolo da eliminare.');
 }else if(mine&&ph==='overflow'){const q=s.pend.need[0];
  hint=`Hai già 5 mazzetti: ${q.count>1?q.count+' carte di ':'una carta di '}<b>${THRONE.NAMES[q.type]}</b> non ci stanno. Scarta qualcosa.`;
  ctl=`<div class="tbtn"><button class="b disc" data-a="tdrop" data-v="${q.type}">Scarta le nuove (${THRONE.NAMES[q.type]})</button></div><div class="hlabel">…oppure scarta un mazzetto</div><div class="tbtn">${Object.keys(s.stacks[p]).map(t=>`<button class="b sm gold" data-a="tdrop" data-v="${t}">${THRONE.NAMES[t]} ×${s.stacks[p][t]}</button>`).join('')}</div>`}
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${mine?`<b>${esc(s.names[p])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[p])}</b><span class="dots"></span>`}${mine&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 /* i miei mazzetti, grandi, con il potere */
 let hand='';
 if(cover)hand=coverH(s.cur);
 else if(v>=0){const ts=THRONE.TYPES.filter(t=>THRONE.cnt(s,v,t)).sort((a,b)=>THRONE.VAL[b]-THRONE.VAL[a]);
  hand=`<div class="hlabel">I tuoi mazzetti · ${THRONE.score(s,v)} punti</div><div class="thand">${fanRowsH(ts.map(t=>tcH(t,{cls:'hnd '+(THRONE.largest(s,v,t)?'big ':'')+(s.used[v][t]&&THRONE.largest(s,v,t)?'spent':''),n:THRONE.cnt(s,v,t)})),8)||'<small class="muted">Nessun mazzetto: raccogli qualche carta</small>'}</div>`}
 const win=s.over?s.over.wins:null;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">👑</div><h2>Vince ${win.map(i=>esc(s.names[i])).join(' e ')}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${win.includes(i)?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>pt</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 return fixH({title:GN('trono'),chips,strip,mid,bot:bub+`<div class="ctl kctl">${ctl}</div>`,hand:hand?`<div class="tmine">${hand}</div>`:'',players:pl,end})}
function thClick(a,v){const s=G;if(!myTurn())return;
 if(a==='treveal')return dispatch({t:'reveal'});
 if(a==='tcollect')return dispatch({t:'collect'});
 if(a==='tgive')return dispatch({t:'giveup'});
 if(a==='tmode'){ui.tm=ui.tm===v?null:v;Snd.play('sel');return render()}
 if(a==='ttg'){const[q,t]=v.split(':'),m=ui.tm;ui.tm=null;return dispatch(m==='swap'?{t:'swap',to:+q,take:t}:{t:'destroy',p:+q,type:t})}
 if(a==='tdrop')return dispatch({t:'drop',type:v});
 if(a==='tpow'){const[k,via,d]=v.split('|');if(k==='judge'){const x={t:'use',k:'judge',via};if(d)x.d=+d;return dispatch(x)}
  const x={t:'use',k};if(d)x.d=+d;return dispatch(x)}}
const THFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='reveal'){Snd.play('deal');await W(260)}
  else if(e.t==='bust'){Snd.play('err');await W(500)}
  else if(e.t==='power'){Snd.play('sel');await W(240)}
  else if(e.t==='destroy'){Snd.play('boom');await W(500)}
  else if(e.t==='swap'){Snd.play('whoosh');await W(360)}
  else if(e.t==='collect'){Snd.play('draw');await W(300)}
  else if(e.t==='reshuffle'){Snd.play('draw');await W(300)}}
  endFx(ns)}};
