/* ---- Regicide Legacy: vista del telefono ----
   Preparazione (storia, mercenari, belva, chi inizia), tavolo (nemico, pile, zona missione, campo, mano), magia del Mago,
   giullare, fine missione con la campagna salvata in localStorage ('rl-camp') su ogni telefono al tavolo. Motore: RLEG. */
const RLV={
 KEY:'rl-camp',
 load(){try{const c=JSON.parse(ST(RLV.KEY)||'null');return c&&Array.isArray(c.party)?c:null}catch(e){return null}},
 save(c){if(!c||!c.party)return;const o=RLV.load();if(o&&o.id===c.id&&(o.v|0)>=(c.v|0))return;ST(RLV.KEY,JSON.stringify(c))},
 // la campagna da portare in una nuova partita: quella salvata, o quella appena conclusa se più nuova
 campFor(){let c=RLV.load();if(G&&G.g==='rlegacy'&&G.over&&G.camp&&(!c||(G.camp.id===c.id&&(G.camp.v|0)>(c.v|0))||!c.id))c=G.camp;
  if(!c){c=RLEG.newCamp();c.id=rid();RLV.save(c)}if(!c.id){c.id=rid();ST(RLV.KEY,JSON.stringify(c))}return c},
 reset(){const c=RLEG.newCamp();c.id=rid();ST(RLV.KEY,JSON.stringify(c));return c},
 card(id,o={}){if(!id)return`<div class="card rlc back ${o.cls||''}" ${o.style?`style="${o.style}"`:''}>${RLA.back()}</div>`;const s=o.s||G,d=RLEG.def(s,id);
  return`<div class="card rlc ${d.k==='e'?'foe':''} ${o.cls||''}" ${o.style?`style="${o.style}"`:''} ${o.attrs||''}>${RLA.svg(d,{id,corr:s.corr&&s.corr.includes(id)})}${o.dv?`<i class="dv">${o.dv}</i>`:''}</div>`},
 foeCard(s,en,cls){return`<div class="card rlc foe ${cls||''}">${RLA.svg({k:'e',f:en.f,v:RLEG.effStr(s),c:en.c,nm:en.nm},{hp:Math.max(0,en.hp-en.dmg)})}</div>`},
 icons(cl,px){return(cl==='W'?['W']:(cl||'').split('')).map(k=>RLA.icon(k,px||18)).join('')},
 name(s){return s.modo==='libera'?RLEG.LIB.n:'Missione '+s.mis+' · '+RLEG.MIS[s.mis].n},
 info(s){return s.modo==='libera'?RLEG.LIB:RLEG.MIS[s.mis]},
 rules(s){const f=s.fx,t=[];
  if(f.ricresce)t.push(['Teste che ricrescono','Una testa non finita col danno esatto torna in fondo al mazzo con 10 di vita (una volta). Col danno esatto viene bandita.']);
  if(f.esp)t.push(['Esperimenti','+1 forza al nemico per ogni carta bandita (massimo +5).']);
  if(f.spore)t.push(['Spore','Chi cede brucia la carta in cima alla riserva.']);
  if(f.mem)t.push(['Memoria','Le carte giocate contro il nemico vengono bandite quando cade (gli animali no).']);
  if(f.zona)t.push(['Zona missione','Quando pari un colpo, la carta col prossimo valore della scala (A, 2, 3…) va nella zona: +1 forza al nemico per carta. Al 10 la rinascita riporta gli scarti nella riserva.']);
  if(f.vento)t.push(['Vento','A ogni nuovo nemico ognuno passa una carta a caso a sinistra.']);
  if(f.pile)t.push(['Compagni dispersi','30 carte sono in tre pile: una volta per turno puoi bandire una carta della mano per riportarne una negli scarti. Col danno esatto un disperso torna in cima alla riserva.']);
  if(f.trad)t.push(['Traditori','Forza +8, immuni alla loro classe. Ascia: colpo +5 · Scudo: ogni attacco −3 · Pozione: si rigenerano di 5 · Liuto: strappano una carta dalla riserva.']);
  if(f.boss)t.push(['Lira la Corrotta','80 di vita, immune a liuto e scudo, ogni attacco fa 3 danni in meno, a ogni colpo brucia una carta della riserva.']);
  if(f.corr)t.push(['Corruzione','Dopo il 2º e il 6º nemico caduto un eroe estratto a sorte si corrompe: ignora le immunità, ma a ogni uso brucia una carta.']);
  return t},
 chips(s){return RLV.rules(s).map(([n,d])=>`<span class="rl-rule">${esc(n)} ${infoH(esc(d))}</span>`).join('')}
};
function rlegacyH(){if(ui.tv)return rlegacyTVH();const s=G;if(s.phase==='prep')return rlPrepH(s);
 if(s.over)RLV.save(s.camp);
 const cover=needCover(),mine=myTurn(),owner=viewer(),okHand=!cover&&owner>=0,sel=ui.sel,cname=esc(s.names[s.cur]);
 const hand=okHand?s.hands[owner].slice().sort((a,b)=>RLEG.val(s,a)-RLEG.val(s,b)||(a<b?-1:1)):[];
 const en=ui.viewEn||s.en;let foe='';
 if(en){const str=RLEG.effStr(s),left=Math.max(0,en.hp-en.dmg),tot=s.castle.length+1+s.kills;
  const mods=[];if(en.red)mods.push('scudo −'+en.red);if(s.fx.esp&&s.ban.length)mods.push('banditi +'+Math.min(5,s.ban.length));if(s.fx.zona&&s.mz.length)mods.push('zona +'+s.mz.filter(c=>RLEG.def(s,c).k!=='p').length);
  // tracciati come sulla plancia: forza a sinistra, vita a destra (0-60), con il segnalino d'ottone sul valore
  const trk=(v,lab,cls)=>`<div class="rl-trk ${cls}" aria-label="${lab} ${v}"><small>${lab}</small><div class="rl-rul"><i style="bottom:${Math.min(60,v)/60*100}%"><b>${v}</b></i></div></div>`;
  foe=`<section class="rl-foe">${RLA.mappa()}${trk(str,'FORZA','l')}<div class="rl-en" id="boss">${RLV.foeCard(s,en,'xl')}</div><div class="rl-st">
   <div class="rl-enm">${esc(en.nm)}</div>
   <div class="rl-hp"><i style="width:${left/en.hp*100}%"></i><b>${left}<small> / ${en.hp}</small></b></div>
   <div class="rl-stats"><span class="rl-str" title="Forza: il colpo che subirai">${ic('spada',16)}<b>${str}</b></span><span class="rl-imm">Immune ${RLV.icons(en.c,20)}</span></div>
   ${mods.length?`<div class="rl-mods">${mods.join(' · ')}</div>`:''}
   <div class="rl-prog" aria-label="Nemici">${Array.from({length:tot},(_,i)=>`<i class="${i<s.kills?'ok':i===s.kills?'now':''}"></i>`).join('')}</div></div>${trk(left,'VITA','r')}</section>`}
 const piles=`<div class="rl-piles"><div class="pile" id="pres">${RLV.card(s.res.length?'':null,{cls:'mini'})}<span>Riserva <b>${s.res.length}</b></span></div>
  <div class="pile" id="pdisc">${s.disc.length?RLV.card(s.disc[s.disc.length-1],{cls:'mini'}):'<i class="rl-empty"></i>'}<span>Scarti <b>${s.disc.length}</b></span></div>
  <div class="pile" id="pban">${s.ban.length?RLV.card(s.ban[s.ban.length-1],{cls:'mini ban'}):'<i class="rl-empty"></i>'}<span>Banditi <b>${s.ban.length}</b></span></div>
  ${s.stacks?`<div class="rl-stk">${s.stacks.map((x,k)=>`<button class="b sm ${ui.rlsac!=null?'gold':''}" data-a="rlsacr" data-v="${k}" ${ui.rlsac==null||!x.length||!mine?'disabled':''}>Dispersi ${k+1}<b>${x.length}</b></button>`).join('')}</div>`:''}
  <div class="rl-rel">${(s.rel||[]).map(r=>`<span class="rl-relic">${esc(RLEG.REL[r].n.split(' ')[0])} ${infoH('<b>'+esc(RLEG.REL[r].n)+'</b><br>'+esc(RLEG.REL[r].d))}</span>`).join('')}</div></div>`;
 const zona=s.fx.zona?`<div class="rl-zona" aria-label="Zona missione">${Array.from({length:10},(_,i)=>`<i class="${s.mz[i]?'on':''}">${s.mz[i]?(i?i+1:'A'):i?i+1:'A'}</i>`).join('')}</div>`:'';
 const field=s.mats.map((m,p)=>m.length?`<div class="rl-mat"><small>${esc(s.names[p])}</small>${m.map(c=>/^XS/.test(c)?RLV.card(c,{cls:'sm pop'}):RLV.card(c,{cls:'sm '+(seen.p&&!seen.p.has(c)?'pop':'')})).join('')}</div>`:'').join('')||'<span class="muted">Il campo di battaglia è vuoto</span>';seen.p=new Set(s.played);
 const pls=playersH(s,{extra:s.n===1?`<div class="pl"><div class="av">J</div><span class="n">Giullari</span><span class="hc">${s.jl}</span></div>`:''});
 let bub='',prev='',ctl='';const nar=esc(s.log[s.log.length-1]||'');
 if(s.over||cover)bub='';
 else if(ui.anim)bub=`<div class="bubble"><span class="nar">${nar}</span>&nbsp;</div>`;
 else if(!mine)bub=`<div class="bubble"><span class="nar">${nar}</span>Tocca a <b>${cname}</b><span class="dots"></span><small>${ui.busy?'invio mossa…':s.phase==='discard'?'deve parare '+s.owed:s.phase==='pick'?'sceglie chi reclama il giullare':s.phase==='magic'?'sceglie la carta del Mago':'sta formando l’attacco'}</small></div>`;
 else if(s.phase==='play'){bub=`<div class="bubble me"><span class="nar">${nar}</span><b>${cname}</b>, forma l’attacco${s.jx?' <em class="rl-jx">senza immunità</em>':''} ${infoH('Una carta, un animale con un’altra carta, oppure carte della stessa forza (totale massimo '+(s.rel.includes('flauto')?15:10)+'). Puoi anche cedere: subirai il colpo.')}</div>`;
  const rsel=sel.filter(c=>s.hands[s.cur].includes(c));
  if(ui.rlsac!=null)prev=`<span class="chip sh">Sacrifichi ${esc(RLEG.nm(s,ui.rlsac))}: scegli una pila di dispersi</span>`;
  else if(rsel.length){const e=RLEG.checkPlay(s,rsel),pv=e?null:RLEG.preview(s,rsel);
   prev=e?`<span class="chip w">${esc(e)}</span>`:pv.jester?'<span class="chip sh">Giullare: chi lo reclama attacca senza immunità</span>'
   :`<span class="chip atk">${ic('spada',14)} danno ${pv.dmg}${pv.mult>1?' (×'+pv.mult+')':''}</span>${pv.heal?`<span class="chip hl2">${RLA.icon('C',14)} ${pv.heal} nella riserva</span>`:''}${pv.druid?`<span class="chip hl2">${RLA.icon('D',14)} tutti gli scarti tornano</span>`:''}${pv.draw?`<span class="chip sh">${RLA.icon('B',14)} pesca ${pv.draw}</span>`:''}${pv.chant?`<span class="chip sh">${RLA.icon('T',14)} tutti pescano ${pv.chant}</span>`:''}${pv.shield?`<span class="chip sh">${RLA.icon('P',14)} forza −${pv.shield}</span>`:''}${pv.guard?`<span class="chip sh">${RLA.icon('S',14)} nessun colpo</span>`:''}${pv.mage?`<span class="chip sh">${RLA.icon('M',14)} scopre ${Math.min(10,pv.atk)+(s.rel.includes('emblema')?2:0)}</span>`:''}${pv.blk.length?`<span class="chip off">immune: ${RLV.icons(pv.blk.join(''),14)}</span>`:''}${pv.corr?'<span class="chip w">corrotto: brucia una carta</span>':''}`;
   if(pv&&pv.devour)prev+=`<span class="rl-dev">Divora ${[0,1,2,3].map(k=>`<button class="b sm ${(ui.rldev??2)===k?'gold':''}" data-a="rldev" data-v="${k}">${k}</button>`).join('')}</span>`}
  else prev='<span class="muted">Tocca le carte per selezionarle</span>';
  ctl=`<button class="b play" data-a="rlplay" ${(!rsel.length||RLEG.checkPlay(s,rsel))?'disabled':''}>Attacca${rsel.length?' ('+RLEG.atkOf(s,rsel)+')':''}</button><button class="b yld sm" data-a="rlyc">Cedi…</button>${s.stacks&&!s.sac&&rsel.length===1?'<button class="b sm" data-a="rlsac">Sacrifica</button>':''}${s.n===1&&s.jl?'<button class="b gold sm" data-a="rlsj">Giullare ('+s.jl+')</button>':''}`;
  if(ui.rlsj&&s.n===1&&s.jl)ctl+=`<div class="rl-sj">${'GPCB'.split('').map(k=>`<button class="b sm" data-a="rlsolo" data-v="${k}">${RLA.icon(k,18)} ${RLEG.CL[k].n}</button>`).join('')}</div>`}
 else if(s.phase==='discard'){const sm=sel.reduce((t,c)=>t+(s.hands[s.cur].includes(c)?RLEG.val(s,c):0),0),pc=Math.min(100,sm/s.owed*100);
  bub=`<div class="bubble atk"><span class="nar">${nar}</span>Il nemico colpisce <b>${cname}</b>! Para ${s.owed} ${infoH('Scarta carte per almeno '+s.owed+' punti. Con la mano piena puoi fingerti morto e scartarla tutta, qualunque sia la somma.')}</div>`;
  prev=`<div class="meter ${sm>=s.owed?'ok':''}"><i style="width:${pc}%"></i><b>${sm} / ${s.owed}</b></div>`;
  ctl=`<button class="b disc" data-a="rldisc" ${sm<s.owed?'disabled':''}>Para il colpo</button><button class="b grn sm" data-a="rlauto">Suggerisci</button>${RLEG.canFeign(s)?'<button class="b gold sm" data-a="rlfeign">Fingiti morto</button>':''}`}
 else if(s.phase==='pick'){bub=`<div class="bubble me">Giullare in campo! <small>Chi lo reclama? Attaccherà senza immunità.</small></div>`;ctl=s.names.map((n,i)=>`<button class="b play sm" data-a="rlpick" data-v="${i}">${esc(n)}</button>`).join('')}
 const magic=s.phase==='magic'?`<div class="rl-magic"><h3>${RLA.icon('M',22)} Il Mago scopre ${s.rev.length} carte</h3><div class="rl-rev">${s.rev.map(c=>`<button class="rl-revc" data-a="rlmago" data-v="${c}" ${mine?'':'disabled'}>${RLV.card(c,{cls:'sm'})}</button>`).join('')}</div>${mine?'<button class="b sm" data-a="rlmago" data-v="">Nessuna</button><small class="muted">La carta scelta si aggiunge all’attacco; mago e carta vengono banditi quando il nemico cade.</small>':`<small class="muted">${cname} sceglie…</small>`}</div>`:'';
 const handH=cover?coverH(s.cur):fanH(hand,(c,o)=>RLV.card(c,o),{mine,dv:s.phase==='discard'&&mine?c=>RLEG.val(s,c):null});
 return`${hudH(GN('rlegacy'))}<div class="acttag">${esc(RLV.name(s))}</div><div class="rl">${foe}<div class="rl-rules">${RLV.chips(s)}</div>${piles}${zona}
  <div class="battle rl-field" id="played">${field}</div>${magic}${pls}${bub}<div class="prev">${prev}</div><div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div>
  <div class="handbox">${handH}</div></div>${rlEndH(s)}${ui.yc&&s.phase==='play'&&mine?`<div class="modal"><div class="box col"><h2>Cedere il turno?</h2><p>Non attacchi e subisci comunque il colpo${s.fx.spore?'; le spore bruciano una carta della riserva':''}.</p><button class="b disc" data-a="rlyn">No, torna indietro</button><button class="b yld" data-a="rlyield">Sì, cedi</button></div></div>`:''}${rulesH()}${cfgH()}`}
function rlPrepH(s){const mi=RLV.info(s),c=s.camp,mine=myTurn(),cname=esc(s.names[s.cur]);
 const spent=s.prep.merc.reduce((t,x)=>t+RLEG.CAT[x].cost,0);
 const camp=s.modo==='libera'?`<p class="muted">Spedizioni libere vinte: ${(c.lib||{}).w||0} · perse: ${(c.lib||{}).l||0}</p><p>Ostacolo: <b>${esc(RLEG.BANE[s.bane])}</b> · Aiuto: <b>${s.boon==='oro'?'3 monete per i mercenari':esc(RLEG.REL[s.boon].n)}</b></p>`
  :`<div class="rl-path">${Array.from({length:12},(_,i)=>`<i class="${c.done.includes(i+1)?'ok':i+1===s.mis?'now':''}" title="${esc(RLEG.MIS[i+1].n)}">${i+1}</i>`).join('')}</div>${c.fails[s.mis]?`<p class="muted">Tentativi falliti in questa missione: ${c.fails[s.mis]}</p>`:''}`;
 const party=c.party.filter(x=>!c.torn.includes(x)),corr=s.corr.length;
 const merc=s.coins?`<div class="rl-box"><h3>Mercenari <small>${s.coins-spent} monete su ${s.coins}</small> ${infoH('Dopo una sconfitta la Compagnia riceve oro: 1 moneta, poi 2, poi 3… I mercenari valgono solo per questo tentativo.')}</h3><div class="rl-merc">${RLEG.MERC.filter((id,i,a)=>a.findIndex(x=>RLEG.CAT[x].nm===RLEG.CAT[id].nm&&RLEG.CAT[x].c===RLEG.CAT[id].c)===i||s.prep.merc.includes(id)).map(id=>{const on=s.prep.merc.includes(id);
   return`<button class="rl-mc ${on?'on':''}" data-a="rlmerc" data-v="${id}" ${mine?'':'disabled'} aria-pressed="${on}">${RLV.card(id,{cls:'sm'})}<small>${esc(RLEG.CAT[id].nm)}</small></button>`}).join('')}</div></div>`:'';
 const beast=c.beasts?`<div class="rl-box"><h3>Belva della missione ${infoH('Una sola belva per missione: si abbina a un’altra carta e ne copia la forza, aggiungendo la sua classe.')}</h3><div class="rl-merc">${['bG','bP','bC','bB'].map(id=>`<button class="rl-mc ${s.prep.beast===id?'on':''}" data-a="rlbeast" data-v="${id}" ${mine?'':'disabled'}>${RLV.card(id,{cls:'sm'})}<small>${esc(RLEG.CAT[id].nm)}</small></button>`).join('')}</div></div>`:'';
 const start=mine?`<div class="rl-box"><h3>Chi inizia? ${infoH('Nell’edizione Legacy inizia chi vuole: decidetelo insieme.')}</h3><div class="ctl">${s.names.map((n,i)=>`<button class="b play sm" data-a="rlstart" data-v="${i}">${esc(n)}</button>`).join('')}</div></div>`
  :`<div class="bubble"><b>${cname}</b> prepara la missione<span class="dots"></span></div>`;
 return`${hudH(GN('rlegacy'))}<div class="rl rl-prep"><div class="rl-scroll"><small>${s.modo==='libera'?'Dopo la campagna':'Campagna · missione '+s.mis+' di 12'}</small><h2>${esc(mi.n)}</h2><em>${esc(mi.luogo)}</em><p>${esc(mi.intro)}</p>${s.modo==='camp'?`<p class="muted">In palio: ${esc(mi.premio)}</p>`:''}</div>
  ${camp}<div class="rl-rules">${RLV.chips(s)}</div>
  <div class="rl-box rl-party"><span>Compagnia <b>${party.length}</b> carte</span>${corr?`<span>Corrotti <b>${corr}</b></span>`:''}${c.torn.length?`<span>Perduti <b>${c.torn.length}</b></span>`:''}<span class="rl-rel">${(s.rel||[]).map(r=>`<span class="rl-relic">${esc(RLEG.REL[r].n)} ${infoH(esc(RLEG.REL[r].d))}</span>`).join('')}</span></div>
  ${merc}${beast}${start}${mine&&s.modo==='camp'&&(c.done.length||Object.keys(c.fails).length)?`<button class="b sm disc rl-reset" data-a="rlreset">Ricomincia la campagna…</button>`:''}<div class="err" role="alert">${esc(ui.err)}</div></div>
  ${ui.rlrc?`<div class="modal"><div class="box col"><h2>Ricominciare la campagna?</h2><p>Si torna alla missione 1 con la Compagnia di partenza. Su questo telefono i progressi vanno persi.</p><button class="b disc" data-a="rlrcno">No</button><button class="b yld" data-a="rlrcok">Sì, ricomincia</button></div></div>`:''}${rulesH()}${cfgH()}`}
function rlEndH(s){if(!s.over||ui.anim)return'';const w=s.over.win,mi=RLV.info(s),c=s.camp,next=s.modo==='camp'&&w&&!c.fin;
 return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox ${w?'win':'lose'}"><div class="crown">${ic(w?'corona':'teschio',44)}</div><h2>${w?(s.modo==='camp'&&c.fin&&s.mis===12?'Il regno è salvo!':'Missione compiuta!'):'Missione fallita'}</h2>
  <p>${esc(w?mi.win:mi.lose)}</p>${w&&s.modo==='camp'?`<p class="rl-prize">${esc(mi.premio)}</p>`:''}${!w?`<p class="muted">${esc(s.over.reason||'')}</p>${s.modo==='camp'?`<p class="muted">La Compagnia riceve oro per i mercenari: ${RLEG.tri(c.fails[s.mis]||0)} monete al prossimo tentativo.</p>`:''}`:''}
  <p class="muted">Nemici sconfitti: ${s.kills}${s.corr.length>(s.camp.corr||[]).length?'':''}</p>
  <div class="col"><button class="b play" data-a="rematch">${next?'Prossima missione':w?'Nuova spedizione':'Riprova'}</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function rlClick(a,v){const s=G;
 if(a==='sel'){if(!myTurn()||!['play','discard'].includes(s.phase))return;const i=ui.sel.indexOf(v);i<0?ui.sel.push(v):ui.sel.splice(i,1);ui.err='';ui.rlsac=null;Snd.play(i<0?'sel':'unsel');return render()}
 if(a==='rlplay'){const c=ui.sel.filter(x=>s.hands[s.cur].includes(x)),pv=RLEG.preview(s,c);return dispatch({t:'play',cards:c,dev:pv&&pv.devour?(ui.rldev??2):0})}
 if(a==='rldev'){ui.rldev=+v;return render()}
 if(a==='rldisc')return dispatch({t:'discard',cards:ui.sel.filter(x=>s.hands[s.cur].includes(x))});
 if(a==='rlauto'){ui.sel=RLEG.bestDiscard(s);return render()}
 if(a==='rlfeign')return dispatch({t:'feign'});
 if(a==='rlyc'){ui.yc=true;return render()}if(a==='rlyn'){ui.yc=false;return render()}if(a==='rlyield'){ui.yc=false;return dispatch({t:'yield'})}
 if(a==='rlpick')return dispatch({t:'pick',to:+v});
 if(a==='rlmago')return dispatch({t:'mago',c:v||null});
 if(a==='rlsj'){ui.rlsj=!ui.rlsj;return render()}if(a==='rlsolo'){ui.rlsj=false;return dispatch({t:'solo',k:v})}
 if(a==='rlsac'){ui.rlsac=ui.sel[0];return render()}
 if(a==='rlsacr'){const c=ui.rlsac;ui.rlsac=null;return dispatch({t:'sacr',c,k:+v})}
 if(a==='rlmerc')return dispatch({t:'merc',id:v});if(a==='rlbeast')return dispatch({t:'beast',id:v});
 if(a==='rlstart')return dispatch({t:'start',first:+v});
 if(a==='rlreset'){ui.rlrc=true;return render()}if(a==='rlrcno'){ui.rlrc=false;return render()}
 if(a==='rlrcok'){ui.rlrc=false;RLV.reset();const S=seatsNow().slice();return startGame('rlegacy',S,{modo:s.modo,camp:RLV.load()})}}
const RLFX={async pre(prev,ns,own){const ev=ns.ev,pl=ev.find(e=>e.t==='play'),dc=ev.find(e=>e.t==='disc'||e.t==='feign');
  const rend=(c,o)=>RLV.card(c,Object.assign({s:ns},o));
  if(pl){Snd.play('whoosh');const items=own&&cap&&cap.length?cap:avatarItems(pl.p,pl.c);await flyCards(items,'#boss',{fade:false,scale:.6},rend)}
  else if(dc&&own&&cap&&cap.length){Snd.play('whoosh');await flyCards(cap,'#pdisc',{scale:.3,rot:30},rend)}
  const kill=ev.find(e=>e.t==='kill');if(kill&&prev&&prev.en){const hit=ev.find(e=>e.t==='hit');ui.viewEn=Object.assign({},prev.en,{dmg:prev.en.dmg+(hit?hit.v:0)})}return{}},
 async run(prev,ns){for(const e of ns.ev){
  if(e.t==='imm'){Snd.play('immune');flt('#boss','immune','w',0,-40);await W(260)}
  else if(e.t==='heal'){Snd.play('heal');flt('#pres','+'+e.v,'hl');await W(260)}
  else if(e.t==='draw'){Snd.play('draw');flt('#pres','pesca '+e.v,'sh');await W(240)}
  else if(e.t==='shield'){Snd.play('shield');flt('#boss','−'+e.v,'sh',40,0);await W(240)}
  else if(e.t==='devour'){Snd.play('impact');flt('#pban','+'+e.v,'atk');await W(240)}
  else if(e.t==='hit'){Snd.play('impact');shake(e.v>15?10:5);const c=ctr('#boss');burst(c.x,c.y,['#c9a0ff','#fff'],18);flt('#boss','−'+e.v,'atk',0,-20);await W(320)}
  else if(e.t==='guard'){Snd.play('rock');flt('#boss','bloccato','sh');await W(260)}
  else if(e.t==='kill'){Snd.play('kill');const c=ctr('#boss');burst(c.x,c.y,['#e3b53a','#c9a0ff','#fff'],40,{v:7});if(e.exact)flt('#boss','danno esatto!','hl',0,-40);await W(600);ui.viewEn=null;render()}
  else if(e.t==='next'){Snd.play('enemy');await W(200)}
  else if(e.t==='atk'){Snd.play('atk');await W(200)}
  else if(e.t==='corr'){Snd.play('nope');say(e.c?'Corruzione! '+RLEG.nm(ns,e.c)+' è corrotto':'La corruzione non trova nessuno');await W(500)}
  else if(e.t==='zona'){Snd.play('chip');await W(120)}else if(e.t==='rinascita'){Snd.play('redeem');say('Rinascita! Gli scarti tornano nella riserva');await W(500)}
  else if(e.t==='vento'){Snd.play('whoosh');say('Il vento strappa una carta a ognuno');await W(400)}
  else if(e.t==='burn'){Snd.play('boom');await W(200)}
  else if(e.t==='magic'){Snd.play('redeem');await W(200)}
  else if(e.t==='jester'){Snd.play('pick');await W(200)}
  else if(e.t==='win'){Snd.play('win');confetti()}else if(e.t==='lose')Snd.play('lose')}}};
