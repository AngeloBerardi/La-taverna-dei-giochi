/* ================= L'ISOLA DEI PREDATORI ================= */
const itop=st=>st[st.length-1];
const KK='stroke="#2a1a10" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
const iEye=(x,y,r=4.6)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#2a1a10" stroke-width="1.4"/><circle cx="${x+r*.2}" cy="${y+r*.25}" r="${r*.52}" fill="#2a1a10"/>`;
const IBG=['#8fd16a,#2f8a3f','#e08a5a,#8a3a1c','#a58be0,#4a2c8a','#c9c9d6,#6a6a80','#8ee07a,#2c8a3a','#b89a82,#6a4a32','#9a7ad0,#3a2468','#bfe07a,#5a8a1c','#b0b0bc,#4a4a58','#ffb061,#c4571a','#ecd09a,#8a6a2c','#a9b8cf,#4a5a78','#ffc24a,#c47a00','#78d08a,#1f6a3a','#ffd27a,#b8631a','#e6f4ff,#7aa6d0'];
const IBGW={shark:'#7ad0ff,#1a5a9a',whale:'#6a9aff,#1a2a7a'};

const IVAL=(id)=>typeof id==='number'?id:'';
function isleCard(id,o={}){const w=typeof id==='string',bg=(w?IBGW[id]:IBG[id]).split(',');
 return`<div class="ic ${o.cls||''}" style="--a:${bg[0]};--b:${bg[1]}" ${o.attrs||''}><svg viewBox="0 0 100 100" class="iart">${ISD}${azArt(id)}</svg>${w?'':`<b class="iv">${id}</b>`}${o.n>1?`<em class="ist">×${o.n}</em>`:''}</div>`}
const EATS=id=>id===0?'—':[...Array(3).keys()].map(i=>id-1-i).filter(v=>v>=0).join(' / ');
function isleBig(id){const w=typeof id==='string',bg=(w?IBGW[id]:IBG[id]).split(',');const nm=w?{shark:'Squalo',whale:'Balena'}[id]:ISLE.NAMES[id],pw=w?{shark:'Sposta un animale di 1 casella per mangiare, ma può mangiare qualsiasi animale di valore minore.',whale:'Sposta un animale in una qualsiasi casella vuota.'}[id]:ISLE.POW[id];
 return`<div class="ibig" style="--a:${bg[0]};--b:${bg[1]}"><svg viewBox="0 0 100 100" class="iart">${ISD}${azArt(id)}</svg>${w?'':`<b class="iv">${id}</b>`}<div class="inm">${nm}</div>${w?'<div class="ie">Carta acquatica</div>':`<div class="ie">Mangia ${EATS(id)}</div>`}<div class="ip">${pw}</div></div>`}
function islandH(){const s=G,mine=myTurn(),it=s.pend[0],wm=ui.wm,sel=ui.isel;
 if(needCover())return`${hudH('Isola')}${coverH(s.cur)}${rulesH()}${cfgH()}`;
 const sK=sel?sel[0]+','+sel[1]:null;let hot=new Set(),pick=new Set();
 if(mine&&!s.over){
  if(it){const opts=ISLE.pendOpts(s,it);
   if(it.k==='mv'){if(sel)opts.filter(o=>o.from[0]===sel[0]&&o.from[1]===sel[1]).forEach(o=>hot.add(o.to.join(',')));else opts.forEach(o=>pick.add(o.from.join(',')))}
   else if(it.k==='rm')opts.forEach(o=>pick.add(o.at.join(',')));
   else if(it.k==='sw'){const ks=Object.keys(s.cells);ks.forEach(k=>pick.add(k))}}
  else if(wm==='whale'){if(sel)ISLE.whaleOpts(s).filter(o=>o.from[0]===sel[0]&&o.from[1]===sel[1]).forEach(o=>hot.add(o.to.join(',')));else Object.keys(s.cells).forEach(k=>pick.add(k))}
  else{const eo=ISLE.eatOpts(s,wm==='shark');if(sel)eo.filter(o=>o.from[0]===sel[0]&&o.from[1]===sel[1]).forEach(o=>hot.add(o.to.join(',')));else eo.forEach(o=>pick.add(o.from.join(',')))}}
 let cells='';for(let y=ISLE.LO;y<=ISLE.HI;y++)for(let x=ISLE.LO;x<=ISLE.HI;x++){const k=x+','+y,st=s.cells[k],h=hot.has(k),p=pick.has(k)&&!sel||(it&&it.k==='sw'&&pick.has(k)),isS=sK===k;
  const act=h||p||(!it&&mine&&st&&!s.over);
  cells+=`<div class="icell ${st?'full':''} ${h?'hot':''} ${p?'pk':''} ${isS?'sel':''} ${x>=0&&x<=3&&y>=0&&y<=3?'in':''}" id="ic${x}_${y}" ${(h||p||(st&&!s.over&&mine))?`data-a="icell" data-v="${k}" role="button" tabindex="0"`:''}>${st?isleCard(itop(st),{n:st.length}):''}</div>`}
 const view=ui.iinfo!=null?ui.iinfo:(sel&&s.cells[sK]?itop(s.cells[sK]):null);
 const wbar=s.water.map(w=>`<button class="b sm ${wm===w?'gold':'disc'}" data-a="iwater" data-v="${w}" ${mine&&!it&&!s.over?'':'disabled'}>${w==='shark'?'🦈 Squalo':'🐋 Balena'}</button>`).join('');
 let hint='';if(mine){if(it){hint=({mv:sel?'<span class="chip hl">Tocca la casella vuota di destinazione</span>':'<span class="chip hl">Potere: scegli l’animale da spostare</span>',rm:'<span class="chip hl">Potere: tocca un animale non impilato da eliminare</span>',sw:ui.isw?'<span class="chip hl">Tocca la seconda carta</span>':'<span class="chip hl">Potere: tocca la prima carta da scambiare</span>'})[it.k]}
  else if(wm==='whale')hint=sel?'<span class="chip hl">Balena: tocca la casella vuota</span>':'<span class="chip hl">Balena: scegli l’animale da spostare</span>';
  else hint=sel?'<span class="chip">Tocca l’animale da mangiare (casella illuminata)</span>':wm==='shark'?'<span class="chip hl">Squalo: scegli l’animale che mangia</span>':'<span class="muted">Tocca un animale, poi quello da mangiare</span>'}
 const mods=(s.mods||[]).map(m=>({fox:'🦊 Prossima mossa: diagonale di 1',lynx:'🐆 Prossima mossa: salto su 1 carta',tiger:'🐯 Prossima mossa: due caselle',lion:'🦁 Prossima mossa: solo 1 in meno',polar:'🐻‍❄️ L’Orso polare non può mangiare',raccoon:'🦝 Se mangi 1 in meno: elimini un animale'})[m.k]).filter(Boolean).map(t=>`<span class="chip sh">${t}</span>`).join('');
 const left=Object.keys(s.cells).length;
 const sum=s.over&&!ui.anim?islSummary(s):'';
 return`${hudH('Isola')}<div class="tinfo"><span class="chip">Animali ${left}</span><span class="chip">Turno ${s.turn}</span>${mods}</div><div class="isl"><div class="igrid" id="igrid">${cells}</div></div>
 ${bubbleH(s,'Mangia in ordine di catena alimentare: ne deve restare uno solo!',null)}<div class="prev">${hint}</div><div class="ctl">${wbar}${wm?'<button class="b sm disc" data-a="iwater" data-v="">Annulla</button>':''}</div><div class="err" role="alert">${esc(ui.err)}</div>
 ${view!=null?`<div class="ibw">${isleBig(view)}</div>`:'<p class="muted" style="text-align:center">Tocca una carta per leggerne il potere</p>'}
 <div class="ctl"><button class="b sm gold" data-a="iundo" ${(ui.ih||[]).length&&!ui.busy&&!ui.anim?'':'disabled'}>↶ Annulla mossa</button><button class="b sm disc" data-a="iinfo">Carte e poteri</button><button class="b sm disc" data-a="iend" ${mine&&!it?'':'disabled'}>Concludi la partita</button></div>${ui.iall?islAll():''}${sum}${rulesH()}${cfgH()}`}
function islAll(){return`<div class="modal"><div class="box" style="max-width:520px"><h2>Tutti gli animali</h2><div class="iall">${[...Array(16).keys(),'shark','whale'].map(id=>isleBig(id)).join('')}</div><button class="b gold" data-a="iall">Chiudi</button></div></div>`}
function islSummary(s){const o=s.over;return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox ${o.win?'win':'lose'}"><div class="crown">${o.win?'🏝️':'🦴'}</div><h2>${esc(o.txt)}</h2><p>${o.left} ${o.left===1?'animale rimasto':'animali rimasti'} sull’isola.</p><div class="col"><button class="b gold" data-a="iundo" ${(ui.ih||[]).length?'':'disabled'}>↶ Annulla ultima mossa</button><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
async function islUndo(){if(!ui.ih||!ui.ih.length||ui.busy||ui.anim)return;const prev=JSON.parse(ui.ih.pop());ui.isel=null;ui.wm=null;ui.isw=null;ui.iinfo=null;ui.err='';fxDone=prev.evn;
 if(!R.on){pushState(prev,true);saveOff(prev);return}
 const base=R.grev!=null?R.grev:R.rev,gid=G.gid;R.rev=Math.max(R.rev,base+1);
 ui.busy=true;pushState(prev,true,base+1);
 try{const e=await SYNC.esegui(R.ref,cur=>SYNC.mossa(cur,{base,gid,s:prev},ENG));if(e.err){ui.err='Annullamento non inviato: '+e.err;await risincronizza()}}
 catch(e){ui.err='Annullamento non inviato: '+netErr(e);await risincronizza()}
 ui.busy=false;render()}
function islClick(a,v){const s=G;
 if(a==='iundo')return islUndo();
 if(a==='iinfo'){ui.iall=!ui.iall;return render()}if(a==='iall'){ui.iall=false;return render()}
 if(a==='iwater'){ui.wm=v||null;ui.isel=null;ui.isw=null;ui.err='';return render()}
 if(!myTurn())return;if(a==='iend')return dispatch({t:'end'});
 if(a!=='icell')return;const p=v.split(',').map(Number),st=s.cells[v],it=s.pend[0],sel=ui.isel;ui.err='';
 if(st)ui.iinfo=itop(st);
 if(it){
  if(it.k==='rm')return dispatch({t:'rm',at:p});
  if(it.k==='sw'){if(!st)return;if(!ui.isw){ui.isw=p;Snd.play('sel');return render()}const a1=ui.isw;ui.isw=null;if(a1[0]===p[0]&&a1[1]===p[1])return render();return dispatch({t:'sw',a:a1,b:p})}
  if(it.k==='mv'){if(sel&&!st){ui.isel=null;return dispatch({t:'mv',from:sel,to:p})}if(st){ui.isel=p;Snd.play('sel');return render()}return}}
 if(ui.wm==='whale'){if(sel&&!st){ui.isel=null;const w=ui.wm;ui.wm=null;return dispatch({t:'whale',from:sel,to:p})}if(st){ui.isel=p;Snd.play('sel');return render()}return}
 if(sel&&st&&!(sel[0]===p[0]&&sel[1]===p[1])){const sh=ui.wm==='shark';const ok=ISLE.eatOpts(s,sh).some(o=>o.from[0]===sel[0]&&o.from[1]===sel[1]&&o.to[0]===p[0]&&o.to[1]===p[1]);if(ok){ui.isel=null;ui.wm=null;return dispatch({t:'eat',from:sel,to:p,shark:sh})}}
 if(st){ui.isel=sel&&sel[0]===p[0]&&sel[1]===p[1]?null:p;Snd.play('sel');return render()}
 ui.isel=null;render()}
const ISFX={async pre(){return{}},
 async run(prev,ns){ui.isel=null;for(const e of ns.ev){
  if(e.t==='eat'){const q='#ic'+e.to[0]+'_'+e.to[1];const c=ctr(q);Snd.play('impact');shake(6);burst(c.x,c.y,['#ffd34d','#ff7a5a','#fff'],26,{v:5,sq:true});flt(q,'GNAM!','gold');await W(300)}
  else if(e.t==='move'){Snd.play('whoosh');await W(120)}
  else if(e.t==='rm'){const c=ctr('#ic'+e.at[0]+'_'+e.at[1]);Snd.play('rock');burst(c.x,c.y,['#6b5240','#999'],24,{v:4,sq:true})}
  else if(e.t==='swap'){Snd.play('deal')}
  else if(e.t==='whale'){Snd.play('heal');banner('🐋','La balena sposta un animale')}
  else if(e.t==='win'){Snd.play('win');confetti()}else if(e.t==='lose'){Snd.play('lose')}}}};
