/* ================= SCOUNDREL ================= */
const SSY={C:'♣',S:'♠',D:'♦',H:'♥'},SKIND={C:'Mostro',S:'Mostro',D:'Arma',H:'Pozione'};
function scardH(c,o={}){const v=SCOUN.val(c),s=SCOUN.suit(c);return`<div class="mcd sc ${s} ${o.cls||''}" ${o.attrs||''}><b>${SCOUN.rk(v)}</b><i>${SSY[s]}</i><small>${SKIND[s]}</small></div>`}
function scoundH(){const s=G,mine=myTurn(),w=s.weapon,sel=ui.ssel;
 const hearts=`<div class="slife"><b>${s.life}</b><small>/ ${s.max}</small> ❤<div class="sbar"><i style="width:${Math.max(0,s.life/s.max*100)}%"></i></div></div>`;
 const wp=`<div class="swp"><div class="slab">Arma</div>${w?`<div class="swc">${scardH(w.c,{cls:'sm'})}<div class="sstack">${w.stack.map(c=>scardH(c,{cls:'xs'})).join('')}</div></div><small>${w.last==null?'Colpisce qualsiasi mostro':'Solo mostri ≤ '+SCOUN.rk(w.last)}</small>`:'<div class="swc empty">Mani nude</div>'}</div>`;
 const room=`<div class="sroom">${s.room.map((c,i)=>scardH(c,{cls:(sel===i?'sel ':'')+(mine?'can':''),attrs:mine?`data-a="stake" data-v="${i}" role="button" tabindex="0"`:''})).join('')}</div>`;
 let ctl='';
 if(sel!=null&&s.room[sel]){const c=s.room[sel],v=SCOUN.val(c),dm=Math.max(0,v-(w?+w.c.slice(1):0));ctl=`<button class="b play sm" data-a="sfight" data-v="w">Con l’arma · −${dm}</button><button class="b disc sm" data-a="sfight" data-v="b">A mani nude · −${v}</button><button class="b sm" data-a="scancel">Annulla</button>`}
 else if(mine){const can=s.took===0&&!s.ranLast&&s.room.length===4&&s.dungeon.length>0;ctl=`<button class="b disc sm" data-a="srun" ${can?'':'disabled'}>🏃 Scappa dalla stanza</button>`}
 const left=s.need-s.took;
 const bub=s.over?esc(s.log[s.log.length-1]||''):`${esc(s.log[s.log.length-1]||'')}<br><b>Scegli ${left} ${left===1?'carta':'carte'}</b>${s.potion?' · pozione già usata':''}${s.ranLast?' · non puoi scappare':''}`;
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${s.over.win?'🏆':'💀'}</div><h2>${s.over.win?'Dungeon ripulito!':'Siete caduto nel dungeon'}</h2><div class="scores"><div class="w"><span>Punteggio</span><b>${s.over.scores[0]}</b></div></div><div class="col"><button class="b play" data-a="rematch">Rigioca</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 return`${hudH(GN('scoundrel'))}<div class="tinfo"><span class="chip">Dungeon ${s.dungeon.length}</span><span class="chip">Scartate ${s.discard.length}</span></div>${hearts}${wp}<div class="hlabel">Stanza</div>${room}<div class="bubble me"><span class="nar">${bub}</span></div><div class="ctl">${ctl}</div><div class="err" role="alert">${esc(ui.err)}</div>${end}${rulesH()}${cfgH()}`}
function sclClick(a,v){const s=G;if(a==='scancel'){ui.ssel=null;return render()}if(!myTurn())return;
 if(a==='srun'){ui.ssel=null;return dispatch({t:'run'})}
 if(a==='stake'){const i=+v,c=s.room[i];if(c==null)return;if(SCOUN.isMon(c)&&s.weapon&&SCOUN.canWeapon(s,c)){ui.ssel=ui.ssel===i?null:i;return render()}ui.ssel=null;return dispatch({t:'take',i,weapon:false})}
 if(a==='sfight'){const i=ui.ssel;ui.ssel=null;if(i==null)return;return dispatch({t:'take',i,weapon:v==='w'})}}
const SCFXX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='fight'){Snd.play(e.dmg?'err':'impact');await W(150)}else if(e.t==='potion'){Snd.play('redeem')}else if(e.t==='weapon'){Snd.play('draw')}else if(e.t==='run'){Snd.play('ok')}}
  endFx(ns)}};
