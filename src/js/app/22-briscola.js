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
