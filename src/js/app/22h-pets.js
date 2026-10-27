/* ================= POWER HUNGRY PETS ================= */
const PPI={10:['👑','#7a1f2a'],9:['🎭','#6a3a8a'],8:['🔁','#1d6a7a'],7:['🤹','#b8541f'],6:['🐕','#7a5a2a'],5:['🐍','#2a7a3a'],4:['🐢','#2a5a9a'],3:['🐰','#a82a5a'],2:['🐭','#6a6a2a'],1:['🔮','#4a3ca8'],0:['🧹','#444a55']};
const PTX={10:'Se la giochi, sei eliminato.',9:'Chi ha il Re dei Gatti lo scambia con la tua carta.',8:'Scambia la tua carta con quella di un giocatore.',7:'Tutti rimettono la carta nel mazzo e ne ricevono una nuova.',6:'Guardi la carta messa da parte e puoi scambiarla con la tua.',5:'Un giocatore gioca la sua carta (senza effetto) e ne pesca un’altra.',4:'La tua carta è al sicuro fino al tuo prossimo turno.',3:'Confronti in segreto la carta con un giocatore: il più basso è eliminato.',2:'Guardi la prima carta del mazzo e la rimetti dove vuoi.',1:'Nomina un numero (non 1): se il giocatore ce l’ha, è eliminato.',0:'Se a fine round la tieni, batte il Re dei Gatti.'};
const pcardH=(v,o={})=>{const k=PPI[v];return`<div class="pc ${o.cls||''}" style="--pb:${k[1]}" ${o.attrs||''}><b class="pn">${v}</b><i>${k[0]}</i><span>${esc(PETS.NAMES[v])}</span></div>`};
function petsH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&!cover&&!s.over,ph=s.phase,res=s.res,al=PETS.alive(s);
 const key=s.gid+':'+s.evn;if(ui.pk2!==key){ui.pk2=key;ui.pw=null;ui.pt=null;ui.pn=null;ui.pins=null}
 const chips=`<span class="chip">Round ${s.round}</span><span class="chip">🪙 si vince a ${s.target}</span><span class="chip">Mazzo ${s.deck.length}</span>`;
 const strip=stripH(s,i=>({b:(s.tok[i]?'🪙'+s.tok[i]:'')+(s.shield[i]&&s.hands[i]!=null?'🛡':''),out:s.hands[i]==null,trn:!!s.shield[i]}));
 const pl=s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''} ${s.hands[i]==null?'out':''}"><div class="av">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">🪙${s.tok[i]}${s.shield[i]&&s.hands[i]!=null?' 🛡':''}${s.hands[i]==null?' ✕':''}</span></div>`).join('');
 /* tavolo: carte giocate a faccia in su di ciascuno */
 let mid;
 if(ph==='round'&&res){mid=`<div class="ptab round">${s.names.map((n,i)=>{const c=res.reveal?res.reveal[i]:(res.hands[i]!=null?res.hands[i]:res.out[i]),w=res.win.includes(i);
   return`<div class="pcell ${w?'win':''} ${res.hands[i]==null&&!(res.reveal&&res.reveal[i]!=null)?'out':''}"><div class="pcn">${esc(n)}${w?' 🪙':''}</div><div class="pcr">${c!=null?pcardH(c,{cls:'mini'}):'<small class="muted">—</small>'}</div></div>`}).join('')}</div>`}
 else mid=`<div class="ptab">${s.names.map((n,i)=>`<div class="pcell ${s.hands[i]==null?'out':''} ${i===s.cur&&!s.over?'act':''}"><div class="pcn">${esc(n)}${s.shield[i]&&s.hands[i]!=null?' 🛡':''}</div><div class="pcr">${s.played[i].map(c=>pcardH(c,{cls:'mini'})).join('')}${s.out[i]!=null?pcardH(s.out[i],{cls:'mini x'}):''}${!s.played[i].length&&s.out[i]==null?'<small class="muted">nessuna carta giocata</small>':''}</div></div>`).join('')}</div>`;
 let ctl='',hint=s.over||ph==='round'?'':'Hai due carte: giocane una, tieni l’altra.',hand='';
 if(cover)hand=coverH(s.cur);
 else if(v>=0&&s.hands[v]!=null){
  const myTurnNow=mine&&ph==='play'&&s.drawn!=null,sel=ui.pw;
  const cs=myTurnNow?[['h',s.hands[v]],['d',s.drawn]]:[['h',s.hands[v]]];
  hand=`<div class="phand">${cs.map(([w,c])=>pcardH(c,{cls:(sel===w?'sel ':'')+(myTurnNow?'can':''),attrs:myTurnNow?`data-a="pw" data-v="${w}" role="button" tabindex="0"`:''})).join('')}</div><small class="muted pnote">${myTurnNow?(w=>sel?'':'Tocca la carta da giocare.')():'La tua carta in mano'+(s.shield[v]?' (protetta 🛡)':'')}</small>`}
 else if(v>=0)hand='<div class="muted" style="text-align:center">Sei fuori dal round: guarda come va a finire.</div>';
 if(mine){
  if(ph==='play'&&s.drawn!=null){const sel=ui.pw,card=sel==='d'?s.drawn:sel==='h'?s.hands[v]:null;
   if(card==null)ctl='';
   else{hint=`<b>${PETS.NAMES[card]} (${card})</b>: ${PTX[card]}`;const tg=PETS.targets(s,v,card===5),need=[1,3,5,8].includes(card);let ok=true;
    if(need){if(!tg.length)hint+='<br><i>Nessun bersaglio libero: non succederà nulla.</i>';else{ctl+=`<div class="hlabel">Bersaglio</div><div class="ktg">${tg.map(i=>`<button class="kch ${ui.pt===i?'sel':''}" data-a="pt" data-v="${i}">${esc(s.names[i])}${i===v?' (tu)':''}</button>`).join('')}</div>`;ok=ui.pt!=null}
     if(need&&tg.length&&card===1){ctl+=`<div class="hlabel">Che numero ha?</div><div class="kchips">${[0,2,3,4,5,6,7,8,9,10].map(n=>`<button class="kch ${ui.pn===n?'sel':''}" data-a="pn" data-v="${n}">${n}</button>`).join('')}</div>`;ok=ok&&ui.pn!=null}}
    ctl+=`<button class="b play" data-a="pplay" ${ok?'':'disabled'}>Gioca ${PETS.NAMES[card]}</button>`}}
  else if(ph==='dig'){hint='Guardi in segreto la carta messa da parte.';ctl=`<div class="phand">${pcardH(s.peek.card,{})}</div><div class="ktg"><button class="b gold sm" data-a="pdig" data-v="1">Scambia con la mia</button><button class="b disc sm" data-a="pdig" data-v="0">Lascia stare</button></div>`}
  else if(ph==='trap'){const n=s.deck.length,opts=[[0,'In cima'],[1,'2ª'],[2,'3ª'],[Math.floor(n/2),'A metà'],[n,'In fondo']].filter(([i])=>i<=n).filter(([i],k,a)=>a.findIndex(x=>x[0]===i)===k);
   hint='Questa è la prima carta del mazzo: rimettila dove vuoi (solo tu sai dove).';ctl=`<div class="phand">${pcardH(s.peek.card,{})}</div><div class="kchips">${opts.map(([i,l])=>`<button class="kch ${ui.pins===i?'sel':''}" data-a="pins" data-v="${i}">${l}</button>`).join('')}<button class="kch" data-a="pins" data-v="r">🎲 A caso</button></div><button class="b gold" data-a="ptrap" ${ui.pins==null?'disabled':''}>Rimetti la carta</button>`}
  else if(ph==='round'){ctl=`<button class="b play" data-a="pnext">Prossimo round</button>`}}
 else if(!s.over&&!cover&&ph==='round'){ctl=''}
 const wn=s.over?s.over.wins:null;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">🏆</div><h2>Vince ${wn.map(i=>esc(s.names[i])).join(' e ')}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${wn.includes(i)?'w':''}"><span>${esc(n)}</span><b>${s.tok[i]}</b><small>🪙</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${ph==='round'?`<b>Round finito</b>`:mine?`<b>${esc(s.names[s.cur])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[s.cur])}</b><span class="dots"></span>`}${mine&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 return fixH({title:GN('pets'),chips,strip,mid,bot:bub+`<div class="ctl kctl">${ctl}</div>`,hand:hand?`<div class="pmine">${hand}</div>`:'',players:pl,end})}
function petsClick(a,v){const s=G;if(!myTurn())return;
 if(a==='pw'){ui.pw=ui.pw===v?null:v;ui.pt=null;ui.pn=null;Snd.play('sel');return render()}
 if(a==='pt'){ui.pt=+v;return render()}
 if(a==='pn'){ui.pn=+v;return render()}
 if(a==='pplay'){const x={t:'play',which:ui.pw};if(ui.pt!=null)x.to=ui.pt;if(ui.pn!=null)x.num=ui.pn;return dispatch(x)}
 if(a==='pdig')return dispatch({t:'dig',swap:v==='1'});
 if(a==='pins'){ui.pins=v==='r'?Math.floor(Math.random()*(s.deck.length+1)):+v;return render()}
 if(a==='ptrap'&&ui.pins!=null)return dispatch({t:'trap',i:ui.pins});
 if(a==='pnext')return dispatch({t:'next'})}
const PTFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='draw'){Snd.play('deal');await W(120)}
  else if(e.t==='play'||e.t==='forced'){Snd.play('whoosh');await W(260)}
  else if(e.t==='out'){Snd.play('boom');await W(600)}
  else if(e.t==='swap'||e.t==='shuffle'||e.t==='dig'||e.t==='trap'){Snd.play('draw');await W(240)}
  else if(e.t==='duel'){Snd.play('atk');await W(320)}
  else if(e.t==='guess'){Snd.play(e.ok?'redeem':'err');await W(300)}
  else if(e.t==='round'){Snd.play('redeem');await W(400)}}
  endFx(ns)}};
