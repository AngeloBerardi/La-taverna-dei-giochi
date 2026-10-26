/* ================= HARVEST VALLEY ================= */
const HPC=['#e8574a','#3a8fe6','#35b866','#f2c230','#b06be0'],HIC={veg:'🥕',fruit:'🍎',wheat:'🌾',pond:'💧',crow:'🐦‍⬛',boar:'🐗',weeds:'🌿',tractor:'🚜',farm:'🏠'},HNM={veg:'Ortaggi',fruit:'Frutteto',wheat:'Grano',pond:'Stagno',crow:'Corvo',boar:'Cinghiale',weeds:'Erbacce',tractor:'Trattore',farm:'Fattoria'};
function hcardH(c,o={}){const own=c.k==='farm'?`style="--pc:${HPC[c.o]}"`:'';
 return`<div class="hc2 ${c.k} ${c.gone?'gone':''} ${o.cls||''}" ${own} ${o.attrs||''}><i>${HIC[c.k]}</i>${c.v?`<b>${c.v}</b>`:''}${c.k==='farm'?`<em>${esc((G.names[c.o]||'')[0]||'')}</em>`:''}<small>${HNM[c.k]}</small></div>`}
function harvH(){const s=G,mine=myTurn(),sel=ui.hsel,pk=ui.hpick;let targets=[];
 if(mine&&sel){const card=sel==='farm'?{k:'farm'}:s.market[+sel.slice(1)];if(card){if(card.k==='weeds'||card.k==='tractor'){targets=pk&&card.k==='tractor'?HARV.dests(s,pk[0],pk[1]):HARV.covers(s)}else targets=HARV.spots(s)}}
 const occ=Object.keys(s.grid).map(k=>k.split(',').map(Number)),all=[...occ,...targets];if(!all.length)all.push([0,0]);
 const xs=all.map(c=>c[0]),ys=all.map(c=>c[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),cols=x1-x0+1,rows=y1-y0+1,cs=Math.max(40,Math.min(62,Math.floor(354/cols)-4));
 const tset=new Set(targets.map(q=>q[0]+','+q[1]));let gr='';
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=x+','+y,c=s.grid[k],t=tset.has(k),isP=pk&&pk[0]===x&&pk[1]===y;
  gr+=c?`<div class="hcell ${t?'tgt':''} ${isP?'pick':''}" ${t?`data-a="hcell" data-v="${k}" role="button" tabindex="0"`:''}>${hcardH(c)}</div>`:`<div class="hcell ${t?'tgt empty':'void'}" ${t?`data-a="hcell" data-v="${k}" role="button" tabindex="0"`:''}>${t?'<span>＋</span>':''}</div>`}
 const grid=`<div class="hgrid" style="grid-template-columns:repeat(${cols},${cs}px);--cs:${cs}px">${gr}</div>`;
 const mk=`<div class="hmarket">${s.market.map((c,i)=>hcardH(c,{cls:'mk '+(sel==='m'+i?'sel':''),attrs:mine?`data-a="hsrc" data-v="m${i}" role="button" tabindex="0"`:''})).join('')||'<span class="muted">Mercato vuoto</span>'}${s.farms[s.cur]>0?hcardH({k:'farm',o:s.cur},{cls:'mk '+(sel==='farm'?'sel':''),attrs:mine?`data-a="hsrc" data-v="farm" role="button" tabindex="0"`:''}):''}</div>`;
 const live=(()=>{try{const c=JSON.parse(JSON.stringify(s));return HARV.score(c).det.map(d=>d.tot)}catch(e){return s.names.map(()=>0)}})();
 const pl=`<div class="players" id="players">${s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}" style="border-color:${HPC[i]}"><div class="av" style="background:${HPC[i]}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">🏠${s.farms[i]} · ${s.over?s.over.scores[i]:live[i]}★</span></div>`).join('')}</div>`;
 let hint='Scegli una carta dal mercato (o una fattoria), poi tocca dove metterla.';
 if(sel){const card=sel==='farm'?{k:'farm'}:s.market[+sel.slice(1)];if(card&&card.k==='weeds')hint='Tocca la carta da coprire: tornerà nel mercato.';else if(card&&card.k==='tractor')hint=pk?'Ora tocca la cella libera dove spingerla.':'Tocca la carta da spostare.';else hint='Tocca una cella libera accanto alle carte già giocate.'}
 const end=s.over&&!ui.anim?harvEnd(s):'';
 return`${hudH(GN('harvest'))}<div class="tinfo"><span class="chip">Valle ${Object.keys(s.grid).length}/${s.cap}</span><span class="chip">Mazzo ${s.deck.length}</span></div>${pl}<div class="hwrap" id="hv">${grid}</div>${bubbleH(s,hint,null)}<div class="hlabel">Mercato</div>${mk}<div class="ctl">${sel?'<button class="b sm disc" data-a="hcancel">Annulla</button>':''}</div><div class="err" role="alert">${esc(ui.err)}</div>${end}${rulesH()}${cfgH()}`}
function harvEnd(s){const o=s.over,w=o.win;return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${w==null?'🤝':'🌾'}</div><h2>${w==null?'Pareggio!':'Vince '+esc(s.names[w])+'!'}</h2>
 <div class="scores">${s.names.map((n,i)=>`<div class="${i===w?'w':''}"><span>${esc(n)}</span><b>${o.scores[i]}</b><small>🥕${o.det[i].veg} 🍎${o.det[i].fruit} 🌾${o.det[i].wheat}</small></div>`).join('')}</div>${o.eaten.length?`<p class="muted">Corvi e cinghiali hanno mangiato ${o.eaten.length} carte.</p>`:''}
 <div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function harvClick(a,v){const s=G;
 if(a==='hcancel'){ui.hsel=null;ui.hpick=null;return render()}
 if(!myTurn())return;
 if(a==='hsrc'){ui.hsel=ui.hsel===v?null:v;ui.hpick=null;ui.err='';return render()}
 if(a==='hcell'){const[x,y]=v.split(',').map(Number),sel=ui.hsel;if(!sel)return;const card=sel==='farm'?{k:'farm'}:s.market[+sel.slice(1)];
  if(card.k==='tractor'){if(!ui.hpick){ui.hpick=[x,y];return render()}const pk=ui.hpick;ui.hsel=null;ui.hpick=null;return dispatch({t:'place',src:sel,x:pk[0],y:pk[1],to:[x,y]})}
  ui.hsel=null;ui.hpick=null;return dispatch({t:'place',src:sel,x,y})}}
const HVFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='place'){Snd.play(e.card.k==='farm'?'redeem':'deal');await W(120)}
  else if(e.t==='weeds'||e.t==='tractor'){Snd.play('impact');await W(250)}
  else if(e.t==='end'){banner('RACCOLTO!',e.eaten.length?e.eaten.length+' carte mangiate':'');Snd.play('win');await W(900)}}
  endFx(ns)}};
