/* ================= I COLONI: IL DUELLO – vista =================
   Due principati (il tuo grande, l'avversario piccolo), mazzi, mano. Si gioca toccando: strade e colonie sulla fila centrale,
   regioni per le scelte, posti sopra/sotto le colonie per le carte. Stato dei tocchi in ui.cd (si azzera a ogni mossa). */
const CDS_SHORT={L:'Bosco',A:'Colline',G:'Campi',N:'Pascolo',R:'Montagna',O:'Miniera'};
function cduMe(){const v=viewer();return v>=0?v:0}
function cduCost(c){return Object.keys(c).map(t=>`<i class="cc t-${t}">${c[t]}</i>`).join('')}
function cduStat(cd){return[cd.fr?'F'+cd.fr:'',cd.ab?'A'+cd.ab:'',cd.co?'C'+cd.co:'',cd.pr?'P'+cd.pr:'',cd.bo?'x2':''].filter(Boolean).join(' ')}
/* bersagli evidenziati: dipende dalla fase e dalla modalità scelta */
function cduTargets(s,me,d){const C=CDUEL,P=s.p[me],T={mine:new Set(),opp:new Set(),slots:new Set(),cols:new Set(),eL:'',eR:''};
 if(!myTurn()||s.cur!==me)return T;
 if(s.phase==='choose'){const q=s.pend[0];if(q&&q.p===me)C.opts(s,q).forEach(r=>(q.k==='gain'?T.mine:T.opp).add(r));return T}
 if(s.phase!=='main')return T;
 const all=f=>C.regs(P).forEach(x=>{if(f(x[1]))T.mine.add(x[0])});
 if(d.mode==='place'){const id=s.hands[me][d.sel],cd=id&&C.CARDS[id];
  if(cd&&C.canPay(P,cd.cost)&&!(cd.uniq&&C.has(P,id)))P.cols.forEach((c,i)=>{for(const sd of['top','bot'])if(C.freeSlot(c,sd)>=0)T.slots.add(i+':'+sd)})}
 else if(d.mode==='trade')all(r=>r.t!==d.tr&&r.r<3);
 else if(d.mode==='orafo')all(r=>r.r<3);
 else if(d.mode==='carovana')all(r=>d.pick.length<2?r.r>0:r.r<3);
 else if(d.mode==='trasloco')all(()=>true);
 else if(d.mode==='gnave'){if(!d.pick.length){P.cols.forEach((c,i)=>{for(const sd of['top','bot'])if(c[sd].includes('gnave'))C.nb(i,sd).forEach(ref=>{if(C.R(P,ref).r>=2)T.mine.add(ref)})})}else all(r=>r.r<3)}
 else{
  if(C.canPay(P,C.COST.citta))P.cols.forEach((c,i)=>{if(c.c===1)T.cols.add(i)});
  const rd=C.canPay(P,C.COST.strada),co=C.canPay(P,C.COST.colonia);
  if(P.rl?co:rd)T.eL='1';if(P.rr?co:rd)T.eR='1'}
 return T}
/* misure: le carte si rimpiccioliscono quando il tavolo ha più righe (città) o più colonie, così tutto sta nello schermo */
function cduSize(s,i,mine,me){const rows=q=>5+(s.p[q].cols.some(c=>c.top.length>1)?1:0)+(s.p[q].cols.some(c=>c.bot.length>1)?1:0),m=q=>s.p[q].cols.length;
 const bud=Math.max(240,innerHeight*.41),h0=Math.max(22,Math.min(40,bud/(rows(me)+.6*rows(1-me)))),k=mine?1:.6,w=Math.min(innerWidth-10,720);
 const u=Math.max(15,Math.min(h0*.96*k,w/(2*m(i)+1)));return{u:u.toFixed(1),h:(h0*k).toFixed(1)}}
function cduBoard(s,i,mine,T,me){const sz=cduSize(s,i,mine,me);const C=CDUEL,P=s.p[i],m=P.cols.length,tex=P.cols.some(c=>c.top.length>1)?1:0,bex=P.cols.some(c=>c.bot.length>1)?1:0;
 const yt1=1,yt0=1+tex,yc=yt0+1,yb0=yc+1,yb1=yb0+1,yrb=yb0+bex+1,rows=yrb+1,hot=mine?T.mine:T.opp;
 const at=(x,y,cls,inner,attrs)=>`<div class="${cls}" style="left:calc(var(--u)*${x});top:calc(var(--h)*${y})" ${attrs||''}>${inner||''}</div>`;
 let h='';
 const reg=(ref,r,x,y)=>{const on=hot.has(ref);
  h+=at(x,y,`dqr rg-${r.t}${on?' dqhot':''}`,`<b class="dqn">${r.n}</b><span class="dqp">${[0,1,2].map(k=>`<i class="${k<r.r?'on':''}"></i>`).join('')}</span><small>${CDS_SHORT[r.t]}</small>`,`data-a="cdreg" data-v="${i}:${ref}" aria-label="${CDS_SHORT[r.t]} ${r.n}, ${r.r} risorse"`)};
 P.rt.forEach((r,j)=>reg('t'+j,r,2*j,0));P.rb.forEach((r,j)=>reg('b'+j,r,2*j,yrb));
 P.cols.forEach((c,ci)=>{const x=1+2*ci;
  h+=at(x,yc,`dqs${c.c===2?' city':''}${mine&&T.cols.has(ci)?' dqhot':''}`,c.c===2?'<svg viewBox="0 0 24 24"><path d="M3 20V12l5-4 5 4v8zM13 20V6l4-3 4 3v14z"/></svg>':'<svg viewBox="0 0 24 24"><path d="M4 20V11l8-6 8 6v9z"/></svg>',mine?`data-a="cdcol" data-v="${ci}"`:'');
  if(ci<m-1)h+=at(x+1,yc,'dqroad');
  for(const sd of['top','bot'])c[sd].forEach((id,k)=>{const y=sd==='top'?(k?yt1:yt0):(k?yb1:yb0);
   if(id){const cd=C.CARDS[id];h+=at(x,y,`dqx k-${cd.k}`,`<b>${esc(cd.n)}</b><small>${cduStat(cd)}</small>`,`title="${esc(cd.n)}"`)}
   else h+=at(x,y,`dqslot${mine&&T.slots.has(ci+':'+sd)?' dqhot':''}`,'',mine&&T.slots.has(ci+':'+sd)?`data-a="cdslot" data-v="${ci}:${sd}"`:'')})});
 const end=(x,built,on,side)=>at(x,yc,`dqroad end ${built?'built':'ghost'}${mine&&on?' dqhot':''}`,'',mine&&on?`data-a="cdend" data-v="${side}"`:'');
 h+=end(0,P.rl,T.eL,'L')+end(2*m,P.rr,T.eR,'R');
 return`<div class="dqwrap"><div class="dqb ${mine?'':'mini'}" style="--u:${sz.u}px;--h:${sz.h}px;width:calc(var(--u)*${2*m+1});height:calc(var(--h)*${rows})">${h}</div></div>`}
function cduHandH(s,me,d){const C=CDUEL,P=s.p[me],cards=s.hands[me].map((id,i)=>{const cd=C.CARDS[id],pay=cd.k==='az'||C.canPay(P,cd.cost);
  return`<button class="dqc k-${cd.k}${d.sel===i?' sel':''}${pay?'':' dim'}" data-a="cdhand" data-v="${i}"><b>${esc(cd.n)}</b><span class="cost">${cduCost(cd.cost)}</span><small>${cduStat(cd)}</small></button>`});
 return cards.length?fanRowsH(cards,6):'<span class="muted">Nessuna carta in mano</span>'}
function cduStacksH(s,me,d){return`<div class="dqstacks">${s.stacks.map((x,k)=>`<button class="dqstack${d.to===k?' sel':''}" data-a="cdstack" data-v="${k}" ${x.length?'':'disabled'} aria-label="Mazzo ${k+1}, ${x.length} carte"><b>${x.length}</b></button>`).join('')}<span class="dqev" title="${esc(s.nev?CDUEL.EVDESC[s.nev]:'')}">${s.nev?'Evento: '+esc(CDUEL.EVNAME[s.nev]):'Eventi: '+s.evs.length}</span></div>`}
function cduHint(s,me,d){const C=CDUEL,q=s.pend[0];
 if(s.over)return'Partita finita.';
 if(s.cur!==me&&!needCover())return'Tocca a '+s.names[s.cur]+(s.phase==='choose'?' scegliere…':'…');
 if(s.phase==='roll')return d.mode==='veg'?'Scegli il numero del dado di produzione.':'Tira i dadi, poi costruisci e gioca carte.';
 if(s.phase==='choose')return q.k==='gain'?q.w+': tocca una tua regione per metterci 1 risorsa.':q.w+': tocca una regione dell’avversario per rubare 1 risorsa.';
 if(s.phase==='main'){const id=s.hands[me][d.sel],cd=id&&C.CARDS[id];
  if(d.mode==='place')return'Tocca un posto libero sopra o sotto una colonia per '+cd.n+'.';
  if(d.mode==='trade')return'Scambi 3 '+C.TN[d.tr]+' (2 con la nave): tocca la regione che riceve la risorsa.';
  if(d.mode==='orafo')return'Orafo: tocca le 2 regioni che ricevono le risorse ('+d.pick.length+'/2).';
  if(d.mode==='carovana')return d.pick.length<2?'Carovana: tocca 2 risorse da dare ('+d.pick.length+'/2).':'Carovana: ora tocca 2 regioni da riempire ('+(d.pick.length-2)+'/2).';
  if(d.mode==='trasloco')return'Trasloco: tocca due tue regioni da scambiare di posto ('+d.pick.length+'/2).';
  if(d.mode==='gnave')return d.pick.length?'Veliero: tocca la regione che riceve 1 risorsa.':'Veliero: tocca la regione accanto da cui spendere 2 risorse.';
  if(d.mode==='scout')return'Cartografo: tocca la strada in fondo per fondare la colonia e scegliere le regioni.';
  return'Tocca una strada o una colonia per costruire; gioca carte dalla mano; scambia; poi fine azioni.'}
 if(s.phase==='draw'){const lim=C.limit(s,me),n=s.hands[me].length;return n>lim?'Hai troppe carte: scegli una carta e il mazzo sotto cui metterla.':'Pesca da un mazzo ('+n+'/'+lim+').'}
 if(s.phase==='exch')return d.sel==null?'Scambio facoltativo: scegli una carta da mettere sotto un mazzo, o salta.':d.to==null?'Scegli il mazzo sotto cui metterla.':d.look?'Scegli il mazzo da guardare (paghi 2 risorse).':'Scegli il mazzo da cui pescare la prima carta.';
 return''}
function cduCtl(s,me,d){const C=CDUEL,P=s.p[me];if(!myTurn()||s.cur!==me||needCover())return'';
 if(s.phase==='roll'){const v=s.hands[me].includes('veggente');
  if(d.mode==='veg')return`<div class="dqnum">${[1,2,3,4,5,6].map(n=>`<button class="b sm disc" data-a="cdvn" data-v="${n}">${n}</button>`).join('')}</div><div class="ctl"><button class="b disc sm" data-a="cdcancel">Indietro</button></div>`;
  return`<div class="ctl"><button class="b play" data-a="cdroll">Tira i dadi</button>${v?'<button class="b gold sm" data-a="cdveg">Veggente</button>':''}</div>`}
 if(s.phase==='main'){const cancel=d.mode?'<button class="b disc sm" data-a="cdcancel">Annulla</button>':'';
  const menu=d.menu?`<div class="dqtrm">${C.TY.map(t=>{const k=C.rate(P,t),have=C.regs(P).filter(x=>x[1].t===t).reduce((a,x)=>a+x[1].r,0);return`<button class="dqtt t-${t}" data-a="cdtr" data-v="${t}" ${have>=k?'':'disabled'}>${C.TN[t]} ${k}:1</button>`}).join('')}</div>`:'';
  return`${menu}<div class="ctl"><button class="b sm gold" data-a="cdtrm">Scambia</button>${C.has(P,'gnave')?'<button class="b sm gold" data-a="cdgn">Veliero</button>':''}${cancel}<button class="b play sm" data-a="cdfin">Fine azioni</button></div>`}
 if(s.phase==='exch')return`<div class="ctl"><button class="b sm gold ${d.look?'sel':''}" data-a="cdlook" ${d.sel==null?'disabled':''}>Guarda un mazzo (2 risorse)</button><button class="b disc sm" data-a="cdskip">Salta</button></div>`;
 return''}
function cduScoutH(s,d){if(d.scoutSide==null)return'';const idx=s.regs.map((r,j)=>[r,j]).sort((a,b)=>CDUEL.TY.indexOf(a[0].t)-CDUEL.TY.indexOf(b[0].t)||a[0].n-b[0].n);
 return`<div class="modal"><div class="box"><h3>Scegli 2 regioni (${d.sc.length}/2)</h3><div class="dqscout">${idx.map(([r,j])=>`<button class="dqr rg-${r.t}${d.sc.includes(j)?' dqhot':''}" data-a="cdsc" data-v="${j}"><b class="dqn">${r.n}</b><small>${CDS_SHORT[r.t]}</small></button>`).join('')}</div><div class="col"><button class="b disc" data-a="cdscx">Annulla</button></div></div></div>`}
function cduPickH(s,me){if(s.phase!=='pick'||!s.look||s.look.p!==me||!myTurn())return'';
 return`<div class="modal"><div class="box"><h3>Scegli una carta del mazzo</h3><div class="dqpick">${s.stacks[s.look.stack].map((id,j)=>{const cd=CDUEL.CARDS[id];return`<button class="dqc k-${cd.k}" data-a="cdpick" data-v="${j}"><b>${esc(cd.n)}</b><span class="cost">${cduCost(cd.cost)}</span><small>${cduStat(cd)}</small></button>`}).join('')}</div></div></div>`}
function cduPlayersH(s){const C=CDUEL;return s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}"><div class="av">${esc((n[0]||'?').toUpperCase())}</div><span class="n">${esc(n)}${seatTag(i)}</span>
 <span class="dqpl"><b>${C.vp(s,i)}</b> punti · forza ${C.pts(s,i,'fr')} · abilità ${C.pts(s,i,'ab')} · commercio ${C.pts(s,i,'co')} · progresso ${C.pts(s,i,'pr')} · ${s.hands[i].length} carte · ${C.nres(s.p[i])} risorse${s.tok.eroe===i?' · segno del comando':''}${s.tok.comm===i?' · segno del commercio':''}</span></div>`).join('')}
function cduH(){const s=G,C=CDUEL,me=cduMe(),op=1-me,cover=needCover(),key=s.gid+':'+s.evn;
 if(ui.cdk!==key){ui.cdk=key;ui.cd={}}
 const d=ui.cd;d.pick=d.pick||[];d.sc=d.sc||[];
 const T=cduTargets(s,me,d),ov=s.over&&!ui.anim;
 const info=`<span class="chip">Fino a ${s.goal} punti</span>${s.dice?`<span class="chip">Dado ${s.dice.n} · ${C.EVN[s.dice.e]}</span>`:''}<span class="chip">Turno ${s.tn}</span>`;
 const strip=stripH(s,i=>({b:C.vp(s,i),trn:i===s.turn&&!s.over}));
 const head=(i,t)=>`<div class="dqhead${i===s.turn&&!s.over?' act':''}"><b>${esc(s.names[i])}${seatTag(i)}</b><span>${C.vp(s,i)} punti</span><span class="dqtk">${s.tok.eroe===i?'comando ':''}${s.tok.comm===i?'commercio':''}</span><span class="muted">${s.hands[i].length} carte · ${C.nres(s.p[i])} risorse</span></div>`;
 const mid=`<div class="dqt"><div class="dqside">${head(op)}${cduBoard(s,op,false,T,me)}</div>${cduStacksH(s,me,d)}<div class="dqside">${head(me)}${cduBoard(s,me,true,T,me)}</div></div>`;
 const hand=cover?coverH(s.cur):`<div class="handbox dqhand"><div class="hlabel">La tua mano${multiLocal()?' · '+esc(s.names[me]):''}</div>${cduHandH(s,me,d)}</div>`;
 const end=ov?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic('corona',40)}</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>punti</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 return fixH({title:GN('coloniduello'),chips:info,strip,mid,bot:bubbleH(s,cduHint(s,me,d),null)+cduCtl(s,me,d),hand,players:cduPlayersH(s),end:end+cduScoutH(s,d)+cduPickH(s,me)})}
function cduClick(a,v){const s=G,C=CDUEL;if(!myTurn())return;const me=s.cur,P=s.p[me],d=ui.cd=ui.cd||{};d.pick=d.pick||[];d.sc=d.sc||[];const hand=s.hands[me];
 const reset=()=>{d.mode=null;d.sel=null;d.pick=[];d.menu=false;d.look=false;d.to=null;d.tr=null;d.scoutSide=null;d.sc=[]};
 if(a==='cdroll')return dispatch({t:'roll'});
 if(a==='cdveg'){d.mode='veg';return render()}
 if(a==='cdvn')return dispatch({t:'play',i:hand.indexOf('veggente'),n:+v});
 if(a==='cdcancel'){reset();return render()}
 if(a==='cdhand'){const i=+v,id=hand[i];if(id==null)return;
  if(s.phase==='main'){if(d.sel===i){reset();return render()}reset();d.sel=i;const cd=C.CARDS[id];
   d.mode=cd.k!=='az'?'place':id==='orafo'||id==='carovana'||id==='trasloco'?id:id==='cartografo'?'scout':null;
   if(!d.mode){d.sel=null;ui.err=cd.d}}
  else{d.sel=d.sel===i?null:i;d.to=null}
  return render()}
 if(a==='cdslot'){const[c,sd]=v.split(':');if(d.mode==='place')return dispatch({t:'play',i:d.sel,col:+c,side:sd});return}
 if(a==='cdcol'){if(s.phase==='main'&&!d.mode)return dispatch({t:'build',w:'citta',col:+v});return}
 if(a==='cdend'&&s.phase==='main'){const built=v==='L'?P.rl:P.rr;
  if(!built)return dispatch({t:'build',w:'strada',side:v});
  if(d.mode==='scout'){d.scoutSide=v;d.sc=[];return render()}
  return dispatch({t:'build',w:'colonia',side:v})}
 if(a==='cdsc'){const j=+v;if(d.sc.includes(j))d.sc=d.sc.filter(x=>x!==j);else d.sc.push(j);
  if(d.sc.length===2){const side=d.scoutSide,sc=d.sc.slice();reset();return dispatch({t:'build',w:'colonia',side,scout:sc})}return render()}
 if(a==='cdscx'){d.scoutSide=null;d.sc=[];return render()}
 if(a==='cdtrm'){const m=!d.menu;reset();d.menu=m;return render()}
 if(a==='cdtr'){reset();d.mode='trade';d.tr=v;return render()}
 if(a==='cdgn'){reset();d.mode='gnave';return render()}
 if(a==='cdfin')return dispatch({t:'end'});
 if(a==='cdreg'){const[o,ref]=v.split(':'),own=+o===me;
  if(s.phase==='choose'){const q=s.pend[0];if(!q||q.p!==me||(q.k==='gain')!==own)return;return dispatch({t:'sel',ref})}
  if(s.phase!=='main'||!own)return;
  if(d.mode==='trade')return dispatch({t:'trade',give:d.tr,to:ref});
  if(d.mode==='orafo'){d.pick.push(ref);return d.pick.length===2?dispatch({t:'play',i:d.sel,to:d.pick}):render()}
  if(d.mode==='carovana'){d.pick.push(ref);return d.pick.length===4?dispatch({t:'play',i:d.sel,from:d.pick.slice(0,2),to:d.pick.slice(2)}):render()}
  if(d.mode==='trasloco'){d.pick.push(ref);return d.pick.length===2?dispatch({t:'play',i:d.sel,a:d.pick[0],b:d.pick[1]}):render()}
  if(d.mode==='gnave'){d.pick.push(ref);return d.pick.length===2?dispatch({t:'gnave',from:d.pick[0],to:d.pick[1]}):render()}
  return}
 if(a==='cdstack'){const k=+v;
  if(s.phase==='draw'){if(hand.length>C.limit(s,me)){if(d.sel==null){ui.err='Scegli prima la carta da scartare';return render()}return dispatch({t:'discard',i:d.sel,stack:k})}return dispatch({t:'draw',stack:k})}
  if(s.phase==='exch'){if(d.sel==null){ui.err='Scegli prima una carta dalla mano';return render()}
   if(d.to==null){d.to=k;return render()}
   return d.look?dispatch({t:'exchlook',i:d.sel,to:d.to,look:k}):dispatch({t:'exch',i:d.sel,to:d.to,take:k})}
  return}
 if(a==='cdlook'){d.look=!d.look;return render()}
 if(a==='cdskip')return dispatch({t:'skip'});
 if(a==='cdpick')return dispatch({t:'pick',j:+v})}
const CDFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='roll'){Snd.play('dice');await W(380)}
  else if(e.t==='prod'){Snd.play('redeem');await W(90)}
  else if(e.t==='build'){Snd.play('impact');await W(220)}
  else if(e.t==='card'){Snd.play('sel');await W(140)}
  else if(e.t==='draw'||e.t==='trade'){Snd.play('sel');await W(90)}
  else if(e.t==='raid'||e.t==='steal'){Snd.play('err');await W(260)}
  else if(e.t==='event'||e.t==='tok'){Snd.play('turn');await W(220)}}
  endFx(ns)}};
