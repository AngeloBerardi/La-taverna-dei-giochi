/* ================= DISCESA TASCABILE ================= */
const DMEA={base:['🕷️','🐀','👺','💀','🏹','👹','🐺','👻','🗿','🧙','🛡️','🐉'],porto:['🦀','🐀','🏴‍☠️','🧟','🏹','🦈','🧜','👻','🐙','🧙‍♀️','☠️','🐋'],vetta:['🦇','🐺','👺','🦍','🏹','🧌','🦅','👻','🗿','🧙','🦍','🐲'],soglia:['😈','🐕','👿','🧟','🏹','👹','🔥','👻','🌋','💀','🛡️','👹']},DCE={nessuna:'🧝',paladino:'🛡️',barbaro:'🪓',ranger:'🏹',mago:'🧙',monaco:'🧘',chierico:'⛪',assassino:'🗡️',corsaro:'🏴‍☠️',sherpa:'🧗',esorcista:'📿'};
const DSN={S:'Velocità',A:'Attacco',D:'Difesa',R:'Gittata'},DSI={S:'👟',A:'⚔️',D:'🛡️',R:'🎯'};
const DPIP={1:[[.5,.5]],2:[[.28,.28],[.72,.72]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.28,.28],[.72,.28],[.28,.72],[.72,.72]],5:[[.26,.26],[.74,.26],[.5,.5],[.26,.74],[.74,.74]],6:[[.28,.24],[.72,.24],[.28,.5],[.72,.5],[.28,.76],[.72,.76]]};
function ddieH(v,cls='',attrs=''){const p=(DPIP[v]||[]).map(([x,y])=>`<circle cx="${x*40}" cy="${y*40}" r="4.2"/>`).join('');return`<span class="ddie ${cls}" ${attrs}><svg viewBox="0 0 40 40" width="40" height="40" aria-label="dado ${v}"><rect x="2" y="2" width="36" height="36" rx="7"/>${p}</svg></span>`}
function dMonIcon(s,m){if(m.boss)return'👑';if(m.n==='Comandanti')return'⚔️';return(DMEA[s.adv]||DMEA.base)[Math.max(0,Math.min(11,s.level-1))]}
function dGridH(s,o){const z=56,W=DISC.W*z,H=DISC.H*z;let g='';const reach=o.reach||{},atk=o.atk||new Set();
 for(let y=0;y<DISC.H;y++)for(let x=0;x<DISC.W;x++){const c=s.map[y][x],k=x+','+y,X=x*z,Y=y*z,cost=reach[k];
  const cls=c==='#'?'dw':c==='~'?'dwa':c==='*'?'dbl':c==='x'?'dlv':'dfl';
  g+=`<g ${cost!=null?`data-a="dmove" data-v="${k}" role="button" class="dtap"`:''}><rect x="${X+1}" y="${Y+1}" width="${z-2}" height="${z-2}" rx="5" class="dt ${cls}"/>`;
  if(c==='#')g+=`<path d="M${X+6} ${Y+20}h${z-12}M${X+6} ${Y+38}h${z-12}M${X+22} ${Y+6}v14M${X+34} ${Y+20}v18M${X+18} ${Y+38}v12" class="dbrick"/>`;
  else if(c==='~')g+=`<path d="M${X+8} ${Y+24}q6-6 12 0t12 0t12 0M${X+8} ${Y+38}q6-6 12 0t12 0t12 0" class="dwave"/>`;
  else if(c==='*')g+=`<text x="${X+z/2}" y="${Y+z/2+6}" text-anchor="middle" class="dflake">❄</text>`;
  else if(c==='x')g+=`<circle cx="${X+18}" cy="${Y+20}" r="4" class="dbub"/><circle cx="${X+36}" cy="${Y+36}" r="3" class="dbub"/>`;
  if(cost!=null&&cost>0)g+=`<rect x="${X+3}" y="${Y+3}" width="${z-6}" height="${z-6}" rx="5" class="dreach"/><text x="${X+z-8}" y="${Y+14}" text-anchor="end" class="dcost">${cost}</text>`;
  g+=`</g>`}
 if(s.chest)g+=`<text x="${s.chest.x*z+z/2}" y="${s.chest.y*z+z/2+10}" text-anchor="middle" font-size="28">🧰</text>`;
 DISC.alive(s).forEach((m,i)=>{const X=m.x*z,Y=m.y*z,t=atk.has(i);g+=`<g ${o.mtap?`data-a="dmon" data-v="${i}" role="button" class="dtap"`:''}>${t?`<rect x="${X+2}" y="${Y+2}" width="${z-4}" height="${z-4}" rx="6" class="datk"/>`:''}<text x="${X+z/2}" y="${Y+z/2+11}" text-anchor="middle" font-size="31">${dMonIcon(s,m)}</text><rect x="${X+z-21}" y="${Y+z-21}" width="18" height="18" rx="4" class="dmhp"/><text x="${X+z-12}" y="${Y+z-8}" text-anchor="middle" class="dmhpt">${m.hp}</text>${m.lives>1?`<text x="${X+6}" y="${Y+14}" font-size="11">♥${m.lives}</text>`:''}</g>`});
 const h=s.hero;g+=`<g class="dhero"><circle cx="${h.x*z+z/2}" cy="${h.y*z+z/2}" r="${z/2-5}" class="dhc"/><text x="${h.x*z+z/2}" y="${h.y*z+z/2+11}" text-anchor="middle" font-size="30">${DCE[s.cls]||'🧝'}</text></g>`;
 return`<svg class="dgrid" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Livello ${s.level} del dungeon">${g}</svg>`}
function dStatsH(s){const h=s.hero,d=s.die||{},hp=Array.from({length:6},(_,i)=>`<i class="${i<h.hp?'on':''}">❤️</i>`).join('');
 const cell=k=>{const tot=s.phase==='hero'?DISC.hStat(s,k):h[k],left=k==='S'?DISC.leftS(s):k==='A'?DISC.leftA(s):null;return`<div class="dst"><b>${DSI[k]} ${tot}</b><small>${DSN[k]}${s.phase==='hero'&&left!=null&&left!==tot?' · resta '+left:''}</small><em>${h[k]}${d[k]?' + 🎲'+d[k]:''}</em></div>`};
 return`<div class="dhp" aria-label="Salute ${h.hp} su 6">${hp}</div><div class="dstats">${['S','A','D','R'].map(cell).join('')}</div>`}
function dMonInfo(s){const ms=DISC.alive(s);if(!ms.length)return'';const seen=new Set(),rows=[];
 for(const m of ms){if(seen.has(m.n))continue;seen.add(m.n);const b=m.bon?` <span class="dbon">🌊 +${['Vel','Att','Dif','Git'].map((n,i)=>m.bon[i]?m.bon[i]+' '+n:'').filter(Boolean).join(', +')}</span>`:'';
  rows.push(`<div>${dMonIcon(s,m)} <b>${esc(m.n)}</b> · ❤${m.max} · 🎯${m.rng} · 🛡️${m.def} · ⚔️${m.atk} · 👟${m.spd}${b}</div>`)}return`<div class="dmi">${rows.join('')}</div>`}
function discSetupH(s){const c=ui.dcls||'nessuna',mo=ui.dmods||{};const tog=(k,lab,desc)=>`<button class="dtog ${mo[k]?'on':''}" data-a="dmod" data-v="${k}" aria-pressed="${!!mo[k]}"><b>${mo[k]?'☑':'☐'} ${lab}</b><small>${desc}</small></button>`;
 return`<div class="dsetup"><h3>${esc(DISC.ADV[s.adv].n)}</h3><div class="dlab">Classe</div><div class="dcls">${Object.keys(DISC.CLS).map(k=>`<button class="dcb ${k===c?'on':''}" data-a="dcls" data-v="${k}"><span>${DCE[k]}</span><b>${DISC.CLS[k].n}</b><small>${DISC.CLS[k].d}</small></button>`).join('')}</div>
 <div class="dlab">Espansioni e moduli</div>${tog('chest','Forzieri','Lo Scettro Risorge: un forziere per livello.')}${tog('boss','Boss finale','Lo Scettro Risorge: lo Scettrarca e i suoi comandanti al livello 12.')}${tog('items','Oggetti','3 oggetti a uso singolo da Porto, Vetta e Soglia.')}${tog('stone','Pietra della Perdizione','Soglia Infernale: +1 a ogni dado energia, ma −1 salute a ogni nuovo livello.')}
 <button class="b play" data-a="dstart">Scendi nel dungeon</button></div>`}
function discesaH(){const s=G,mine=myTurn();
 if(s.phase==='setup')return`${hudH('Discesa Tascabile')}${mine?discSetupH(s):'<p class="muted">Il giocatore sta preparando la discesa…</p>'}${rulesH()}${cfgH()}`;
 const md=ui.dmode;let reach={},atk=new Set(),mtap=false;
 if(mine&&s.phase==='hero'){const h=s.hero;
  if(md==='warp'){for(let y=0;y<DISC.H;y++)for(let x=0;x<DISC.W;x++)if(!DISC.wall(s,x,y)&&!DISC.monAt(s,x,y)&&!(x===h.x&&y===h.y))reach[x+','+y]=0}
  else{const P=DISC.paths(s,h,DISC.leftS(s),(x,y)=>!DISC.monAt(s,x,y),md==='sherpa');for(const k in P){const[x,y]=k.split(',').map(Number);if(P[k]>0&&!DISC.wall(s,x,y))reach[k]=P[k]}}
  DISC.alive(s).forEach((m,i)=>{if(md==='eso'||md==='santa'){if(DISC.los(s,h,m))atk.add(i);return}if(DISC.dist(h,m)<=DISC.hStat(s,'R')&&(md==='ass'||DISC.los(s,h,m))&&DISC.leftA(s)>=DISC.mStat(s,m,'def'))atk.add(i)});mtap=true}
 const grid=`<div class="dwrap">${dGridH(s,{reach,atk,mtap})}</div>`;let ctl='',hint='';
 if(mine&&s.phase==='energy'){const sel=ui.dsel||[],next=['S','A','D'][sel.length];const ranger=s.cls==='ranger'&&!s.once.rng;
  hint=ui.dbus?'Bussola: tocca il dado da ritirare.':s.lock?'Il Paladino tiene il primo dado su '+DSN[s.lock]+': tocca il dado per '+DSN[['S','A','D'].filter(k=>k!==s.lock)[0]]+'.':'Tocca il dado per '+(next==='S'&&ui.drng?'la Gittata (Ranger)':DSN[next])+'.';
  ctl=`<div class="ddice">${s.dice.map((v,i)=>{const at=sel.indexOf(i);return ddieH(v,at>=0?'used':'',`data-a="ddie" data-v="${i}" role="button" tabindex="0"`)+(at>=0?`<small class="dtag">${DSI[['S','A','D'][at]]}</small>`:'')}).join('')}</div><div class="ctl dctl">`;
  if(sel.length)ctl+=`<button class="b sm disc" data-a="dundo">Annulla</button>`;
  if(s.cls==='mago'&&!s.once.mago||s.cls==='barbaro'&&s.hero.hp===1&&!s.once.barb)ctl+=`<button class="b sm" data-a="dreroll">🎲 Ritira tutto</button>`;
  if(s.cls==='paladino'&&!s.once.pal&&s.prevDie&&!sel.length)ctl+=['S','A','D'].map(k=>`<button class="b sm" data-a="dpal" data-v="${k}">Tieni ${DSI[k]}${s.prevDie[k]}</button>`).join('');
  if(ranger&&!sel.length)ctl+=`<button class="b sm ${ui.drng?'gold':''}" data-a="drng">🎯 Ranger</button>`;
  s.items.filter(i=>i==='bussola'||i==='specchio').forEach(i=>ctl+=`<button class="b sm" data-a="ditem" data-v="${i}">${DISC.ITEMS[i].n}</button>`);ctl+='</div>'}
 if(mine&&s.phase==='hero'){hint=md==='warp'?'Corsaro: tocca una casella libera qualsiasi.':md==='sherpa'?'Sherpa: muoviti ignorando i muri.':md==='ass'?'Assassino: tocca un mostro in gittata, anche senza vista.':md==='eso'?'Esorcista: tocca un mostro in vista.':md==='santa'?'Acqua santa: tocca un mostro in vista.':'Tocca una casella per muoverti, un mostro evidenziato per colpirlo.';
  ctl=`<div class="ctl dctl"><button class="b sm gold" data-a="dend">Fine turno</button>`;
  const cl=s.cls,o=s.once;if(cl==='corsaro'&&!o.cor)ctl+=`<button class="b sm ${md==='warp'?'gold':''}" data-a="dpow" data-v="warp">🏴‍☠️ Balzo</button>`;if(cl==='sherpa'&&!o.she)ctl+=`<button class="b sm ${md==='sherpa'?'gold':''}" data-a="dpow" data-v="sherpa">🧗 Scavalca</button>`;
  if(cl==='assassino'&&!o.ass)ctl+=`<button class="b sm ${md==='ass'?'gold':''}" data-a="dpow" data-v="ass">🗡️ Nell’ombra</button>`;if(cl==='esorcista'&&!o.eso)ctl+=`<button class="b sm ${md==='eso'?'gold':''}" data-a="dpow" data-v="eso">📿 Esorcismo</button>`;
  if(cl==='chierico'&&!o.chi)ctl+=`<button class="b sm" data-a="dpw2">⛪ Preghiera</button>`;if(cl==='monaco'&&!o.mon&&!s.monk)ctl+=`<button class="b sm" data-a="dpw2">🧘 Concentrazione</button>`;
  s.items.filter(i=>i!=='bussola'&&i!=='specchio').forEach(i=>ctl+=`<button class="b sm ${md==='santa'&&i==='acquasanta'?'gold':''}" data-a="ditem" data-v="${i}" title="${esc(DISC.ITEMS[i].d)}">${DISC.ITEMS[i].n}</button>`);
  if(md)ctl+=`<button class="b sm disc" data-a="dcancel">Annulla</button>`;ctl+='</div>'}
 const up=s.phase==='levelup'&&mine&&!ui.anim?`<div class="modal"><div class="box"><h2>Livello ${s.level} completato!</h2><p>Scegli una ricompensa:</p><div class="col">${['S','A','D','R'].map(k=>`<button class="b" data-a="dup" data-v="${k}" ${s.hero[k]>=6?'disabled':''}>${DSI[k]} +1 ${DSN[k]} (${s.hero[k]}→${Math.min(6,s.hero[k]+1)})</button>`).join('')}<button class="b play" data-a="dup" data-v="heal">❤ Cura completa (${s.hero.hp}→6)</button></div></div></div>`:'';
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox ${s.over.win?'win':''}"><div class="crown">${s.over.win?'👑':'💀'}</div><h2>${s.over.win?'Vittoria!':'Sconfitta'}</h2><p>${esc(s.over.reason)}</p><p class="muted">${s.over.win?'Hai finito con '+s.hero.hp+' di salute':'Arrivato al livello '+s.over.lv+' di 12'} · ${esc(DISC.CLS[s.cls].n)}</p><div class="col"><button class="b play" data-a="rematch">Rigioca</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const items=s.items.length?`<div class="ditems">🎒 ${s.items.map(i=>esc(DISC.ITEMS[i].n)).join(' · ')}</div>`:'';
 return`${hudH('Discesa Tascabile')}<div class="tinfo"><span class="chip">Livello ${s.level}/12</span><span class="chip">${esc(DISC.ADV[s.adv].n)}</span><span class="chip">${DCE[s.cls]} ${esc(DISC.CLS[s.cls].n)}</span></div>${dStatsH(s)}${grid}${dMonInfo(s)}${items}${bubbleH(s,hint,null)}${ctl}<div class="err" role="alert">${esc(ui.err)}</div>${up}${end}${rulesH()}${cfgH()}`}
function discClick(a,v){const s=G;
 if(a==='dcancel'){ui.dmode=null;ui.dbus=false;ui.err='';return render()}
 if(!myTurn())return;ui.err='';
 if(a==='dcls'){ui.dcls=v;return render()}
 if(a==='dmod'){ui.dmods=Object.assign({},ui.dmods);ui.dmods[v]=!ui.dmods[v];return render()}
 if(a==='dstart'){const m=ui.dmods||{};return dispatch({t:'setup',cls:ui.dcls||'nessuna',chest:!!m.chest,items:!!m.items,boss:!!m.boss,stone:!!m.stone})}
 if(a==='ddie'){const i=+v;if(ui.dbus){ui.dbus=false;return dispatch({t:'item',id:'bussola',i})}const sel=(ui.dsel||[]).slice();
  if(s.lock){if(i===0)return;const ix=k=>['S','A','D'].indexOf(k),oth=['S','A','D'].filter(k=>k!==s.lock),o=[0,0,0];o[ix(s.lock)]=0;o[ix(oth[0])]=i;o[ix(oth[1])]=i===1?2:1;ui.dsel=[];return dispatch({t:'assign',order:o})}
  if(sel.includes(i))return;sel.push(i);if(sel.length===2)sel.push([0,1,2].find(x=>!sel.includes(x)));
  if(sel.length===3){ui.dsel=[];const r=!!ui.drng;ui.drng=false;return dispatch({t:'assign',order:sel,ranger:r})}ui.dsel=sel;Snd.play('ok');return render()}
 if(a==='dundo'){ui.dsel=[];return render()}
 if(a==='drng'){ui.drng=!ui.drng;return render()}
 if(a==='dreroll'){ui.dsel=[];return dispatch({t:'reroll'})}
 if(a==='dpal'){ui.dsel=[];return dispatch({t:'paladin',stat:v})}
 if(a==='dmove'){const[x,y]=v.split(',').map(Number);const md=ui.dmode;ui.dmode=null;if(md==='warp')return dispatch({t:'warp',x,y});return dispatch({t:'move',x,y,sherpa:md==='sherpa'})}
 if(a==='dmon'){const m=+v,md=ui.dmode;ui.dmode=null;if(md==='eso')return dispatch({t:'power',m});if(md==='santa')return dispatch({t:'item',id:'acquasanta',m});return dispatch({t:'attack',m,ignoreLos:md==='ass'})}
 if(a==='dpow'){ui.dmode=ui.dmode===v?null:v;return render()}
 if(a==='dpw2')return dispatch({t:'power'});
 if(a==='ditem'){if(v==='acquasanta'){ui.dmode=ui.dmode==='santa'?null:'santa';return render()}if(v==='bussola'){ui.dbus=true;return render()}return dispatch({t:'item',id:v})}
 if(a==='dend'){ui.dmode=null;return dispatch({t:'end'})}
 if(a==='dup')return dispatch({t:'up',stat:v})}
const DIFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='move'){Snd.play('deal');await W(90)}
  else if(e.t==='hit'){Snd.play('impact');await W(160)}
  else if(e.t==='kill'){Snd.play('redeem');await W(200)}
  else if(e.t==='rise'){banner('SI RIALZA!','');Snd.play('err');await W(700)}
  else if(e.t==='matk'&&e.tot){banner(e.dmg?'−'+e.dmg+' ❤':'Parato!',e.tot+' contro difesa '+e.def);Snd.play(e.dmg?'impact':'ok');await W(e.dmg?750:450)}
  else if(e.t==='chest'){banner('Forziere: '+e.r,e.txt);Snd.play('redeem');await W(900)}
  else if(e.t==='lava'){Snd.play('impact');await W(200)}
  else if(e.t==='clear'){banner('LIVELLO '+e.lv+' COMPLETATO','');Snd.play('win');await W(800)}
  else if(e.t==='level'&&e.lv>1){banner('LIVELLO '+e.lv,'');await W(500)}
  else if(e.t==='roll'){Snd.play('deal');await W(120)}}
  endFx(ns)}};
