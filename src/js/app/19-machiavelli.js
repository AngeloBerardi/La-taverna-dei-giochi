/* ================= MACHIAVELLI ================= */
function mWork(){const s=G,key=s.gid+':'+s.turn;if(ui.mk!==key){ui.mk=key;ui.mt=s.table.map(m=>m.slice());ui.mh=(s.hands[s.cur]||[]).slice();ui.msel=[]}}
const mOrig=()=>new Set(G.table.flat());
function mRemove(id){ui.mh=ui.mh.filter(c=>c!==id);ui.mt=ui.mt.map(m=>m.filter(c=>c!==id))}
const mCompact=()=>{ui.mt=ui.mt.filter(m=>m.length).map(m=>MACH.layout(m))};
function mCardH(id,o={}){return cardH(MACH.base(id),{cls:'sm '+(o.cls||''),attrs:`data-a="mc" data-v="${id}" role="button" tabindex="0"`})}
function machH(){const s=G,v=viewer(),cover=needCover(),mine=myTurn()&&s.phase==='play';
 if(cover)return`${hudH('Machiavelli')}${coverH(s.cur)}${rulesH()}${cfgH()}`;
 if(mine)mWork();
 const melds=mine?ui.mt:s.table,hand=mine?ui.mh:(v>=0?s.hands[v]:[]),sel=new Set(mine?ui.msel:[]),orig=mine?mOrig():null,fresh=new Set((s.ev.find(e=>e.t==='play')||{cards:[]}).cards);
 const mh=melds.map((m,i)=>{const ok=MACH.validMeld(m),wip=!ok&&m.length<3;
  return`<div class="mm ${ok?'ok':wip?'wip':'bad'}" id="mm${i}"><div class="mmh">${m.map(c=>mCardH(c,{cls:(sel.has(c)?'msel ':'')+(fresh.has(c)||(orig&&!orig.has(c))?'nw':'')})).join('')}</div>${mine&&ui.msel.length?`<button class="b sm yld mpl" data-a="madd" data-v="${i}">+ qui</button>`:''}<span class="mmv">${ok?'✓':wip?'…':'✗'}</span></div>`}).join('')||'<span class="muted">Il tavolo è vuoto: cala la prima combinazione</span>';
 const players=`<div class="mpls">${s.names.map((n,i)=>`<span class="chip ${i===s.cur&&!s.over?'hl':''}" id="av${i}">${esc(n)} · ${s.hands[i].length}</span>`).join('')}</div>`;
 let hint='',ctl='';
 if(mine){const nsel=ui.msel.length,added=ui.mt.flat().filter(c=>!orig.has(c)).length;
  hint=nsel?`<span class="chip">${nsel} selezionat${nsel>1?'e':'a'}: «Nuova combinazione» oppure tocca «+ qui» su una combinazione</span>`:'<span class="muted">Tocca le carte (mano o tavolo) per selezionarle, poi componi le combinazioni</span>';
  ctl=`<button class="b sm yld" data-a="mnew" ${nsel?'':'disabled'}>Nuova combinazione</button><button class="b sm disc" data-a="mback" ${ui.msel.some(c=>!orig.has(c))?'':'disabled'}>Rimetti in mano</button><button class="b sm disc" data-a="mhint">Suggerisci</button><button class="b sm disc" data-a="mreset">Annulla</button>`
  +`<button class="b play" data-a="mgo" ${added?'':'disabled'}>Conferma (${added})</button><button class="b disc" data-a="mdraw" ${added?'disabled':''}>${s.stock.length?'Pesca e passa':'Passa'}</button>`}
 const handH=hand.length?`<div class="mhand many" id="hand">${MACH.sortH(hand).map(c=>mCardH(c,{cls:sel.has(c)?'msel':''})).join('')}</div>`:(v>=0?'<span class="muted">Mano vuota</span>':'');
 const sum=s.over&&!ui.anim?machSummary(s):'';
 return`${hudH('Machiavelli')}<div class="tinfo"><span class="chip">Mazzo ${s.stock.length}</span><span class="chip">Turno ${s.turn}</span></div>${players}<div class="mach"><div class="mtab" id="mtab">${mh}</div></div>${bubbleH(s,'Cala almeno una carta rispettando le combinazioni, oppure pesca.',null)}<div class="prev">${hint}</div><div class="ctl mctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div><div class="handbox">${handH}</div>${sum}${rulesH()}${cfgH()}`}
function machSummary(s){const o=s.over;return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${o.win==null?'🤝':'🏆'}</div><h2>${o.win==null?'Pareggio':esc(s.names[o.win])+' vince!'}</h2><p class="muted">${esc(o.txt)}</p><div class="scores">${s.names.map((n,i)=>`<div class="${(o.winners||[]).includes(i)?'w':''}"><span>${esc(n)}</span><b>${o.scores[i]}</b></div>`).join('')}</div><p class="muted">Carte rimaste in mano</p><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function machClick(a,v){const s=G;if(!myTurn()||s.phase!=='play')return;mWork();ui.err='';const orig=mOrig();
 if(a==='mc'){ui.msel=ui.msel.includes(v)?ui.msel.filter(c=>c!==v):[...ui.msel,v];Snd.play('sel');return render()}
 if(a==='mnew'){const ids=ui.msel.slice();ids.forEach(mRemove);ui.mt.push(ids);ui.msel=[];mCompact();Snd.play('deal');return render()}
 if(a==='madd'){const i=+v,ids=ui.msel.slice(),tgt=ui.mt[i];ids.forEach(c=>{ui.mh=ui.mh.filter(x=>x!==c);ui.mt=ui.mt.map(m=>m.filter(x=>x!==c))});const t2=ui.mt[i]?i:Math.min(i,ui.mt.length-1);
  // l'indice può slittare se una combinazione si è svuotata: ritrova la target per contenuto
  let idx=ui.mt.findIndex(m=>tgt.length&&m.includes(tgt.find(c=>!ids.includes(c))));if(idx<0){ui.mt.push([]);idx=ui.mt.length-1}ui.mt[idx].push(...ids);ui.msel=[];mCompact();Snd.play('pick');return render()}
 if(a==='mback'){const ids=ui.msel.filter(c=>!orig.has(c));ids.forEach(mRemove);ui.mh.push(...ids);ui.msel=ui.msel.filter(c=>orig.has(c));mCompact();return render()}
 if(a==='mreset'){ui.mk=null;mWork();return render()}
 if(a==='mhint'){const sg=MACH.suggest(s.table,s.hands[s.cur]);if(!sg){ui.err='Nessuna giocata trovata: conviene pescare';return render()}ui.mt=sg.table.map(m=>MACH.layout(m));ui.mh=s.hands[s.cur].filter(c=>!sg.used.includes(c));ui.msel=[];Snd.play('heal');return render()}
 if(a==='mgo')return dispatch({t:'play',table:ui.mt});
 if(a==='mdraw')return dispatch({t:'draw'})}
const MAFX={async pre(){return{}},
 async run(prev,ns){for(const e of ns.ev){
  if(e.t==='play'){Snd.play('pick');const c=ctr('#mtab');burst(c.x,c.y,['#ffd34d','#fff','#c8312b'],14+e.n*4,{v:4,sq:true});flt('#av'+e.p,'+'+e.n+(e.n>1?' carte':' carta'),'gold');await W(250)}
  else if(e.t==='draw'){Snd.play('draw');flt('#av'+e.p,'pesca','gry')}
  else if(e.t==='pass'){flt('#av'+e.p,'passa','gry')}
  else if(e.t==='win'){Snd.play('win');confetti()}}}};
