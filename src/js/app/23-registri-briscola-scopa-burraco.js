/* ================= CARTE NAPOLETANE E FRANCESI (BURRACO) ================= */
const ISU={C:'<path d="M4 3h16c0 5.5-3.2 8.6-6.5 9.3V17H17v2.5H7V17h3.5v-4.7C7.2 11.6 4 8.5 4 3z"/><path d="M6.5 5h11" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>',
 D:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="rgba(255,255,255,.85)"/>',
 S:'<path d="M12 1l2.6 3.2V15h-5.2V4.2z"/><rect x="6.5" y="15" width="11" height="2.4" rx="1.1"/><rect x="10.9" y="17.3" width="2.2" height="4"/><circle cx="12" cy="22.3" r="1.4"/>',
 B:'<path d="M10 22.5 10.8 7c0-1.8.4-3.3 1.3-4.6.7-1 2.1-1 2.7.1.8 1.4.6 3.1-.2 4.5l-.7 1.1 1 .9-1 1.4.9 1-.9 1.4.8.9-.9 1.3-1.2 10.5z"/><circle cx="12.3" cy="9.5" r=".9" fill="rgba(255,255,255,.6)"/>'};
const IFIG={F:'<svg viewBox="0 0 40 44"><circle cx="20" cy="11" r="7"/><path d="M7 43c0-12 6-19 13-19s13 7 13 19z"/><path d="M12 6 30 2l-3 6z"/><path d="M27 2l6-1-2 4z"/></svg>',
 C:'<svg viewBox="0 0 40 44"><path d="M9 42l4-13-6-5 3-9 9-9 3-4 2 6c7 3 10 10 9 18l-3 16z"/><path d="M22 4l3 8" stroke="var(--faceA)" stroke-width="1.5"/><circle cx="17" cy="16" r="1.8" fill="var(--faceA)"/></svg>',R:ART.K};
function icardH(id,o={}){if(!id||o.back)return cardH('',{back:1,cls:o.cls});const{r,s}=IT.P(id),a=o.attrs||'',st=o.style?`style="${o.style}"`:'',lab=r==='1'?'A':r,sv=pstyle?psv(s):`<svg viewBox="0 0 24 24">${ISU[s]}</svg>`;let inner;
 if('FCR'.includes(r))inner=pstyle?`<div class="pcart"><div class="pa">${pfig(r,s)}</div><div class="pa rv">${pfig(r,s)}</div></div>`:`<div class="art">${IFIG[r]}<em>${sv}</em></div>`;else if(r==='1')inner=`<div class="big1">${pstyle?'<i class="ring"></i>':''}${sv}</div>`;
 else inner=`<div class="pips">${PIPS[r].map(([x,y])=>`<b class="${y>.5?'f':''}" style="left:${x*50}%;top:${y*100}%">${sv}</b>`).join('')}</div>`;
 const dv=o.dv?`<div class="dv">${o.dv}</div>`:'';
 if(!pstyle)return`<div class="card it nap i${s} ${o.cls||''}" ${a} ${st} role="img" aria-label="${lab==='F'?'Fante':lab==='C'?'Cavallo':lab==='R'?'Re':lab==='A'?'Asso':lab} di ${IT.SN[s]}">${NAP.face(r,s)}${dv}</div>`;
 return`<div class="card it ${pstyle?'pc':''} i${s} ${o.cls||''}" ${a} ${st}><div class="ix"><span>${lab}</span><i>${sv}</i></div><div class="ix r"><span>${lab}</span><i>${sv}</i></div>${inner}${dv}</div>`}
function bcardH(id,o={}){if(!id||o.back)return cardH('',{back:1,cls:o.cls});const p=BURR.P(id);return cardH(p.j?'X1':p.rk+p.s,{...o,nofoil:true})}
const deckH=(n,extra='')=>`<div class="pile ${n?'':'empty'}" id="deck"><div class="stk">${[0,1,2].slice(0,Math.min(3,n)).map(()=>cardH('',{back:1})).join('')}</div>Mazzo${n?`<b>${n}</b>`:''}${extra}</div>`;
/* ================= BRISCOLA ================= */
function briscolaH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),tr=(ui.view&&ui.view.trick)||s.trick,w=ui.view?ui.view.w:-1,ts=IT.P(s.trump).s;
 const trick=`<div class="trick" id="trick">${tr.map(x=>`<div class="tc ${x.p===w?'win':''}">${icardH(x.c,{attrs:`data-v="${x.c}"`,cls:'pop'})}<span>${esc(s.names[x.p])}</span></div>`).join('')||'<span class="muted">Il tavolo è vuoto</span>'}</div>`;
 const felt=`<div class="felt brisc"><div class="deckbox">${deckH(s.deck.length)}${s.deck.length?`<div class="trumpc" title="Briscola">${icardH(s.trump)}</div>`:''}</div>${trick}</div>`;
 const info=`<div class="tinfo"><span class="chip sh">Briscola: ${IT.SN[ts]} <svg class="isv i${ts}" viewBox="0 0 24 24">${ISU[ts]}</svg></span>${s.n===4?'<span class="chip">Coppie: '+[0,1].map(t=>esc(IT.teamName(s,t))).join(' vs ')+'</span>':''}</div>`;
 const sel=ui.sel[0];const ctl=mine?`<button class="b play" data-a="play" ${sel?'':'disabled'}>Gioca${sel?' '+esc(IT.fmt(sel)):''}</button>`:'';
 const hand=cover?coverH(s.cur):v>=0?fanH(s.hands[v],icardH,{mine}):'';
 return`${hudH('Briscola')}${info}${playersH(s,{teams:s.n===4})}${felt}${bubbleH(s,'Tocca una carta e premi Gioca (o toccala due volte).',null)}<div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${hand}</div>${endH()}${rulesH()}${cfgH()}`}
function brisClick(a,v){if(a==='sel'){if(!myTurn())return;if(ui.sel[0]===v){return dispatch({t:'play',c:v})}ui.sel=[v];Snd.play('sel');return render()}
 if(a==='play'&&ui.sel[0])return dispatch({t:'play',c:ui.sel[0]})}
const BRFX={async pre(prev,ns,own){const pl=ns.ev.find(e=>e.t==='play'),tr=ns.ev.find(e=>e.t==='trick');
  if(pl){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(pl.p,pl.c);await flyCards(items,'#trick',{fade:false,scale:.9},icardH)}
  if(tr)ui.view={trick:ns.last.trick,w:ns.last.w};return{}},
 async run(prev,ns){const tr=ns.ev.find(e=>e.t==='trick');
  if(tr){Snd.play('impact');await W(650);const wc=ctr('#trick .tc.win');burst(wc.x,wc.y,['#ffd34d','#fff'],tr.pts>=10?60:24,{v:tr.pts>=10?8:4,sq:true});flt('#av'+tr.w,tr.pts?'+'+tr.pts:'0','gold');if(tr.pts>=10)Snd.play('kill');await W(550);
   const items=[...document.querySelectorAll('#trick .card')].map(c=>({id:c.dataset.v,r:c.getBoundingClientRect()}));ui.view=null;render();Snd.play('whoosh');await flyCards(items,'#av'+tr.w,{scale:.3},icardH)}
  endFx(ns)}};
/* ================= SCOPA ================= */
function scopaH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),c=ui.sel[0],opts=c&&mine?IT.SCOPA.options(s.table,c):[],canT=new Set(opts.flat());
 const T=s.teams,tn=t=>esc(IT.teamName(s,t));
 const score=`<div class="tinfo">${s.scores.map((v,t)=>`<span class="chip ${t%2?'sh':'atk'}">${tn(t)}: <b>${v}</b></span>`).join('')}<span class="chip">a ${s.target} · mano ${s.round}</span></div>`;
 const piles=`<div class="tinfo">${s.taken.map((p,t)=>`<span class="muted">${tn(t)}: ${p.length} carte${s.scope[t]?' · '+'★'.repeat(Math.min(s.scope[t],8))+(s.scope[t]>8?'+':'')+' scope':''}</span>`).join(' · ')}</div>`;
 const table=`<div class="felt"><div class="deckbox">${deckH(s.deck.length)}</div><div class="table" id="table">${s.table.map(x=>`<div class="tslot ${ui.tsel.includes(x)?'tsel':''} ${canT.has(x)?'can':''}">${icardH(x,{attrs:`data-a="tsel" data-v="${x}" tabindex="0" role="button"`,cls:seen.p.has(x)?'':'pop'})}</div>`).join('')||'<span class="muted">Tavolo vuoto</span>'}</div></div>`;seen.p=new Set(s.table);
 let hint='',ok=false;
 if(mine&&s.phase==='play'){if(!c)hint='<span class="muted">Scegli una carta dalla mano</span>';
  else if(!opts.length){ok=!ui.tsel.length;hint=ok?'<span class="chip">Nessuna presa: la carta va in tavola</span>':'<span class="chip w">Con questa carta non puoi prendere nulla</span>'}
  else{const key=k=>k.slice().sort().join();ok=opts.some(o=>key(o)===key(ui.tsel));hint=ok?`<span class="chip hl">Prendi ${ui.tsel.map(IT.fmt).join(' + ')}${ui.tsel.length===s.table.length?' · SCOPA!':''}</span>`:`<span class="chip w">${opts.length>1?'Scegli dal tavolo cosa prendere ('+opts.map(o=>o.map(IT.fmt).join('+')).join(' oppure ')+')':'Tocca le carte da prendere'}</span>`}}
 const ctl=mine&&s.phase==='play'?`<button class="b play" data-a="play" ${c&&ok?'':'disabled'}>${c&&opts.length?'Prendi':'Gioca'}</button>`:'';
 const hand=cover?coverH(s.cur):v>=0?fanH(s.hands[v],icardH,{mine}):'';
 const sum=s.phase==='summary'&&!s.over&&!ui.anim?summaryScopa(s):'';
 return`${hudH('Scopa')}${score}${playersH(s,{teams:s.n===4})}${table}${piles}${bubbleH(s,'Scegli una carta; se può prendere, scegli cosa prendere dal tavolo.',null)}<div class="prev">${hint}</div><div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${hand}</div>${sum}${s.over&&s.res&&!ui.anim?'':''}${endH()}${rulesH()}${cfgH()}`}
function summaryScopa(s){const tn=t=>esc(IT.teamName(s,t)),r=s.res;
 return`<div class="modal"><div class="box"><h2>Fine della mano ${s.round}</h2><table class="sumt"><tr><th></th>${s.scores.map((_,t)=>`<th>${tn(t)}</th>`).join('')}</tr>${r.rows.map(x=>`<tr><td>${x.label}</td>${x.vals.map((v,t)=>`<td class="${x.w===t?'w':''}">${v}${x.w===t?' ✓':''}</td>`).join('')}</tr>`).join('')}<tr class="tot"><td>Punti mano</td>${r.pts.map(v=>`<td>+${v}</td>`).join('')}</tr><tr class="tot"><td>Totale</td>${s.scores.map(v=>`<td>${v}</td>`).join('')}</tr></table>
 ${myTurn()?'<button class="b play" data-a="next">Prossima mano</button>':`<p class="muted">${esc(s.names[s.cur])} distribuisce la prossima mano…</p>`}</div></div>`}
function scopaClick(a,v){const s=G;if(!myTurn()||s.phase!=='play')return;
 if(a==='sel'){if(ui.sel[0]===v){const o=IT.SCOPA.options(s.table,v);if(!o.length)return dispatch({t:'play',c:v,take:[]});if(o.length===1)return dispatch({t:'play',c:v,take:o[0]})}
  ui.sel=[v];const o=IT.SCOPA.options(s.table,v);ui.tsel=o.length===1?o[0].slice():[];ui.err='';Snd.play('sel');return render()}
 if(a==='tsel'){if(!ui.sel[0])return;const i=ui.tsel.indexOf(v);i<0?ui.tsel.push(v):ui.tsel.splice(i,1);Snd.play(i<0?'sel':'unsel');return render()}
 if(a==='play'&&ui.sel[0])return dispatch({t:'play',c:ui.sel[0],take:ui.tsel.slice()})}
const SCFX={async pre(prev,ns,own){const pl=ns.ev.find(e=>e.t==='play');if(!pl)return{};Snd.play('whoosh');
  const items=own&&cap&&cap.length?cap:avatarItems(pl.p,pl.c);await flyCards(items,'#table',{fade:false,scale:.95},icardH);
  if(!pl.take.length){Snd.play('deal');return{}}
  pl.take.forEach(c=>{const el=document.querySelector('#table [data-v="'+c+'"]');if(el)el.parentElement.classList.add('taking')});Snd.play('impact');await W(480);
  const taken=pl.take.map(c=>{const el=document.querySelector('#table [data-v="'+c+'"]');return el?{id:c,r:el.getBoundingClientRect()}:null}).filter(Boolean);return{taken,p:pl.p}},
 async run(prev,ns,own,cx){if(cx.taken&&cx.taken.length){Snd.play('whoosh');flyCards(cx.taken,'#av'+cx.p,{scale:.3},icardH)}
  for(const e of ns.ev){if(e.t==='scopa'){await W(250);const c=ctr('#table');banner('SCOPA!',ns.names[e.p]);burst(c.x,c.y,['#fff','#ffd34d','#5be08a'],90,{v:9,sq:true});Snd.play('kill');shake(10);await W(1000)}
   else if(e.t==='deal'){await W(200);say('Nuove carte!',1200);Snd.play('deal')}
   else if(e.t==='sweep'){say('Le carte rimaste vanno a '+IT.teamName(ns,e.w),1800);await W(400)}
   else if(e.t==='round'){Snd.play('redeem');await W(300)}}
  await W(300);endFx(ns)}};
/* ================= BURRACO ================= */
function burracoH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn(),L=local(),my=(v>=0?v:(L[0]??0))%2,op=1-my,tn=t=>esc(IT.teamName(s,t));
 const sortB=cs=>cs.slice().sort((a,b)=>{const p=BURR.P(a),q=BURR.P(b);if(ui.bsort==='rank')return(p.j-q.j)||(p.r-q.r)||(p.s<q.s?-1:p.s>q.s?1:0)||(a<b?-1:1);const so='SHDC';return(p.j-q.j)||(so.indexOf(p.s)-so.indexOf(q.s))||(p.r-q.r)||(a<b?-1:1)});
 const meldsH=(t,click)=>`<div class="melds" id="melds${t}">${s.melds[t].map((m,i)=>{const b=BURR.isBurraco(m);return`<div class="meld ${b?(m.wild?'bs':'bp'):''} ${click&&ui.sel.length?'can':''}" ${click?`data-a="meld" data-v="${i}" tabindex="0" role="button"`:''}>${m.cards.map(c=>bcardH(c,{cls:'sm'})).join('')}${b?`<span class="btag">${m.wild?'Burraco sporco':'Burraco pulito'}</span>`:''}</div>`}).join('')||'<span class="muted">Nessuna combinazione</span>'}</div>`;
 const teamBox=(t,click)=>`<div class="team ${t===my?'mine':''}"><div class="th"><b>${t===my?'Noi':'Loro'}: ${tn(t)}</b><span class="chip ${s.pozzTaken[t]?'hl':''}">${s.pozzTaken[t]?'Pozzetto preso':'Pozzetto da prendere'}</span><span class="chip">${s.scores[t]} pt</span></div>${meldsH(t,click)}</div>`;
 const disc=`<div class="pile" id="bdisc" ${mine&&s.phase==='draw'&&s.disc.length?'data-a="drawdisc" role="button" tabindex="0"':''}><div class="dfan">${s.disc.slice(-7).map(c=>bcardH(c,{cls:'sm',attrs:`data-v="${c}"`})).join('')||'<span class="muted">vuoto</span>'}</div>Scarti${s.disc.length?`<b>${s.disc.length}</b>`:''}</div>`;
 const center=`<div class="felt bur"><div class="deckbox" ${mine&&s.phase==='draw'?'data-a="drawdeck" role="button" tabindex="0"':''}>${deckH(s.deck.length)}</div>${disc}<div class="pile"><div class="stk">${s.pozz.length?cardH('',{back:1}):''}</div>Pozzetti<b>${s.pozz.length}</b></div></div>`;
 let hint='',ctl='';
 if(mine&&s.phase==='draw'){ctl=`<button class="b disc" data-a="drawdeck" ${s.deck.length?'':'disabled'}>Pesca dal mazzo</button><button class="b yld" data-a="drawdisc" ${s.disc.length?'':'disabled'}>Raccogli scarti (${s.disc.length})</button>`}
 else if(mine&&s.phase==='play'){const sel=ui.sel,m=sel.length>=3?BURR.validate(sel):null;
  hint=!sel.length?'<span class="muted">Seleziona carte da calare, poi tocca una tua combinazione per attaccarle, oppure scarta una carta</span>':m?`<span class="chip hl">${m.t==='seq'?'Scala':'Tris'} valid${m.t==='seq'?'a':'o'}${sel.length>=7?' · BURRACO!':''}</span>`:sel.length===1?`<span class="chip">${BURR.fmt(sel[0])}: puoi scartarla o attaccarla a una combinazione</span>`:`<span class="chip">${sel.length} carte selezionate (${sel.length<3?'per calare ne servono 3':'non formano una combinazione'})</span>`;
  ctl=`<button class="b play" data-a="bmeld" ${m?'':'disabled'}>Cala</button><button class="b disc" data-a="bdisc" ${sel.length===1?'':'disabled'}>Scarta</button>`}
 const sortBtn=v>=0?`<button class="b sm" data-a="bsort">Ordina per ${ui.bsort==='suit'?'valore':'seme'}</button>`:'';
 const hand=cover?coverH(s.cur):v>=0?fanH(sortB(s.hands[v]),bcardH,{mine,many:true}):'';
 const sum=s.phase==='summary'&&!s.over&&!ui.anim?summaryBurraco(s):'';
 return`${hudH('Burraco')}<div class="tinfo"><span class="chip">${s.target?'a '+s.target+' punti':'una mano'} · mano ${s.round}</span></div>${playersH(s,{teams:s.n===4})}${teamBox(op,false)}${center}${teamBox(my,mine&&s.phase==='play')}${bubbleH(s,s.phase==='draw'?'Pesca dal mazzo o raccogli tutti gli scarti.':'Cala, attacca e poi scarta una carta per finire il turno.',null)}<div class="prev">${hint}</div><div class="ctl">${ctl}${sortBtn}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${hand}</div>${sum}${endH()}${rulesH()}${cfgH()}`}
function summaryBurraco(s){const tn=t=>esc(IT.teamName(s,t)),r=s.res,row=(l,k)=>`<tr><td>${l}</td>${r.map(x=>`<td>${x[k]>0&&k!=='cards'?'+':''}${x[k]}</td>`).join('')}</tr>`;
 return`<div class="modal"><div class="box"><h2>Fine della mano ${s.round}</h2><table class="sumt"><tr><th></th>${r.map((_,t)=>`<th>${tn(t)}</th>`).join('')}</tr>${row('Carte calate','cards')}${row('Burraco','bonus')}${row('Chiusura','close')}${row('Carte in mano','hand')}${row('Pozzetto non preso','pozz')}<tr class="tot"><td>Punti mano</td>${r.map(x=>`<td>${x.tot}</td>`).join('')}</tr><tr class="tot"><td>Totale</td>${s.scores.map(v=>`<td>${v}</td>`).join('')}</tr></table>
 ${myTurn()?'<button class="b play" data-a="next">Prossima mano</button>':`<p class="muted">${esc(s.names[s.cur])} distribuisce la prossima mano…</p>`}</div></div>`}
function burClick(a,v){const s=G;if(a==='bsort'){ui.bsort=ui.bsort==='suit'?'rank':'suit';return render()}
 if(!myTurn())return;
 if(a==='drawdeck')return dispatch({t:'draw',from:'deck'});if(a==='drawdisc')return dispatch({t:'draw',from:'disc'});
 if(a==='sel'){if(s.phase!=='play'){ui.err='Prima pesca dal mazzo o raccogli gli scarti';return render()}const i=ui.sel.indexOf(v);i<0?ui.sel.push(v):ui.sel.splice(i,1);ui.err='';Snd.play(i<0?'sel':'unsel');return render()}
 if(a==='bmeld')return dispatch({t:'meld',cards:ui.sel.slice()});
 if(a==='bdisc'&&ui.sel.length===1)return dispatch({t:'discard',c:ui.sel[0]});
 if(a==='meld'){if(!ui.sel.length){ui.err='Seleziona prima le carte da attaccare';return render()}return dispatch({t:'add',mi:+v,cards:ui.sel.slice()})}}
const BUFX={async pre(prev,ns,own){const e=ns.ev[0];if(!e)return{};
  if(e.t==='discard'){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(e.p,[e.c]);await flyCards(items,'#bdisc',{fade:false,scale:.7},bcardH)}
  else if(e.t==='meld'||e.t==='add'){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(e.p,e.cards);await flyCards(items,'#melds'+(e.p%2),{fade:true,scale:.6},bcardH)}
  else if(e.t==='drawdisc'){const items=[...document.querySelectorAll('#bdisc .card')].map(c=>({id:c.dataset.v,r:c.getBoundingClientRect()}));Snd.play('whoosh');await flyCards(items,isMine(e.p)?'#hand':'#av'+e.p,{scale:.6},bcardH)}
  return{}},
 async run(prev,ns){for(const e of ns.ev){
  if(e.t==='drawdeck'){if(!isMine(e.p))flt('#av'+e.p,'+1','gry');Snd.play('deal')}
  else if(e.t==='drawdisc'){flt('#av'+e.p,'+'+e.n,'gold')}
  else if(e.t==='meld'||e.t==='add'){if(e.bur){const c=ctr('#melds'+(e.p%2));banner('BURRACO!',ns.names[e.p]);burst(c.x,c.y,['#ffd34d','#fff','#ff6ad5'],90,{v:9,sq:true});Snd.play('redeem');await W(900)}else Snd.play('impact')}
  else if(e.t==='pozz'){banner('POZZETTO!',ns.names[e.p]+(e.volo?' lo prende al volo':''));Snd.play('draw');await W(800)}
  else if(e.t==='close'){banner('CHIUSURA!',ns.names[e.p]);Snd.play('win');await W(900)}
  else if(e.t==='round'){Snd.play('redeem')}}
  endFx(ns)}};
function endFx(ns){if(ns.over){if(ns.over.win!=null){Snd.play('win');confetti()}else Snd.play('turn')}}
/* ================= REGISTRI ================= */
const VIEW={giallo:()=>gialloH(),rlegacy:rlegacyH,fantasma:fantasmaH,zucca:zuccaH,quiz:quizH,spie:spieH,trono:thH,uno:unoH,pets:petsH,catan:catanH,kittens:kittH,perudo:peruH,regicide:()=>regicideH(),regix:()=>regicideH(),briscola:briscolaH,scopa:scopaH,burraco:burracoH,gang:gangH,saboteur:sabotH,azul:azulH,island:islandH,machiavelli:machH,mind:mindH,mindx:mindH,harvest:harvH,scoundrel:scoundH,valle:valleH,accordi:accordiH,discesa:discesaH};
const FX={giallo:{pre:async()=>({}),run:async()=>{}},rlegacy:RLFX,fantasma:FAFX,zucca:ZUFX,quiz:QZFX,spie:SPFX,trono:THFX,uno:UNFX,pets:PTFX,catan:CAFX,kittens:KIFX,perudo:PEFX,regicide:{pre:regPre,run:(p,n,o)=>runFx(n.ev,o)},regix:{pre:regPre,run:(p,n,o)=>runFx(n.ev,o)},briscola:BRFX,scopa:SCFX,burraco:BUFX,gang:GAFX,saboteur:SBFX,azul:AZFX,island:ISFX,machiavelli:MAFX,mind:MIFX,mindx:MIFX,harvest:HVFX,scoundrel:SCFXX,valle:VLFX,accordi:ACFX,discesa:DIFX};
function gameClick(a,v){({giallo:gialloClick,rlegacy:rlClick,fantasma:fantasmaClick,zucca:zuccaClick,quiz:quizClick,spie:spieClick,perudo:peruClick,kittens:kittClick,catan:catanClick,pets:petsClick,uno:unoClick,trono:thClick,regicide:regClick,regix:regClick,briscola:brisClick,scopa:scopaClick,burraco:burClick,gang:gangClick,saboteur:sabClick,azul:azClick,island:islClick,machiavelli:machClick,mind:mindClick,mindx:mindClick,harvest:harvClick,scoundrel:sclClick,valle:valClick,accordi:accordiClick,discesa:discClick})[G.g](a,v)}
