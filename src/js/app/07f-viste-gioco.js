function coverH(i){const n=esc(G.names[i]);return`<div class="cover panel"><h3>Passa il telefono a</h3><div class="nm">${n}</div><button class="b play" data-a="reveal">Sono ${n}</button></div>`}
// true se ha vinto chi gioca su questo telefono (Regicide: vittoria cooperativa; a squadre in 4: i posti pari/dispari)
// vittoria di chi gioca su questo telefono: cooperativi = esito booleano; altrimenti ELO.vincitori (singoli, pari merito, squadre)
function iWon(s){const o=s.over;if(typeof o.win==='boolean')return o.win;const w=ELO.vincitori(s);return!!w&&local().some(i=>w.includes(i))}
function endH(){const s=G;if(!s.over||ui.anim)return'';let body='';
 if(s.camp)body=`<div class="crown">${ic(s.over.win?'corona':'teschio',44)}</div><h2>${s.over.win?'La torre è caduta!':'La scalata finisce qui'}</h2><p>${s.over.win?'Il signore della torre è sconfitto: la scalata è completa.':esc(s.over.reason||'')+'.'}</p><p class="muted">Nemici sconfitti: ${s.camp.cleared} · artefatti: ${s.camp.art.length}</p>`;
 else if(isRG(s.g))body=`<div class="crown">${ic(s.over.win?'corona':'teschio',44)}</div><h2>${s.over.win?'Regicidio compiuto!':'Il regno è perduto'}</h2>${s.over.win?(s.over.medal?`<div class="medal">${ic('medaglia',18)+' '+{gold:'Oro',silver:'Argento',bronze:'Bronzo'}[s.over.medal]}</div>`:'')+'<p>Il Re Oscuro è caduto. La Taverna brinda alla vostra gloria!</p>':`<p>${esc(s.over.reason)}.</p><p class="muted">La corruzione dilaga. Ma gli eroi tornano sempre.</p>`}<p class="muted">Nemici sconfitti: ${12-s.castle.length-(s.en?1:0)} su 12</p>`;
 else{const tn=t=>esc(IT.teamName(s,t)),w=s.over.win;body=`<div class="crown">${ic(w==null?'stretta':'coppa',44)}</div><h2>${w==null?'Pareggio!':'Vince '+tn(w)+'!'}</h2><div class="scores">${s.over.scores.map((v,t)=>`<div class="${t===w?'w':''}"><span>${tn(t)}</span><b>${v}</b></div>`).join('')}</div>${s.g==='briscola'?'<p class="muted">Su 120 punti totali</p>':''}`}
 const win=iWon(s);
 return`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox ${isRG(s.g)?(s.over.win?'win':'lose'):'win'}">${body}<div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`}
function playersH(s,{teams=false,extra}={}){return`<div class="players" id="players">${s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''} ${teams?'t'+(i%2):''}"><div class="av" id="av${i}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc">${s.hands[i].length}🂠</span></div>`).join('')}${extra||''}</div>`}
function fanH(cards,rend,{mine,dv,many}={}){const owner=viewer(),n=cards.length,same=seen.h&&seen.h.owner===owner,prevIds=new Set(same?seen.h.ids:[]),now=Date.now()/1000;
 const h=`<div class="hand ${many?'many':''}" id="hand">${cards.map((c,i)=>{const mid=(n-1)/2,rot=many?0:(i-mid)*(rend===icardH?1.7:n>6?3.2:4),ty=many?0:Math.pow(Math.abs(i-mid),2)*1.8,isNew=seen.h!==null&&!prevIds.has(c);
  return`<div class="slot ${ui.sel.includes(c)?'sel':''}" style="--rot:${rot}deg;--ty:${ty}px">${rend(c,{cls:(mine?'':'off ')+(isNew?'deal ':(many?'':'fl8 ')),style:`--fd:-${((now+i*.43)%3.6).toFixed(2)}s`,attrs:`data-a="sel" data-v="${c}" tabindex="0" role="button"`,dv:dv?dv(c):0,nofoil:many})}</div>`}).join('')||'<span class="muted">Nessuna carta in mano</span>'}</div>`;
 seen.h={owner,ids:cards};return h}
function bubbleH(s,mineTxt,waitTxt){if(s.over||ui.anim)return`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`;
 const mine=myTurn();return mine?`<div class="bubble me"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span><b>${esc(s.names[s.cur])}</b>, tocca a te! ${infoH(mineTxt)}</div>`
 :`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>Tocca a <b>${esc(s.names[s.cur])}</b><span class="dots"></span>${waitTxt?`<small>${waitTxt}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`}
function gameH(){if(!G)return hudH()+'<p class="muted" style="text-align:center">Caricamento…</p>';return VIEW[G.g]()}
/* musica di sottofondo: gioco -> traccia (quelli non elencati usano 'it', i giochi a simulazione 'gang') */
const MUSICA={giallo:'giallo',rlegacy:'rleg',gang:'gang',saboteur:'mine',azul:'azul',island:'island',machiavelli:'mach',valle:'valle',accordi:'accordi',discesa:'disc',trono:'trono',spie:'spie',quiz:'quiz',zucca:'zucca',fantasma:'fantasma',uno:'uno',pets:'pets',catan:'cata',kittens:'kitt',perudo:'peru'};
const traccia=()=>!(ui.screen==='game'&&G&&!G.over)?'menu':G.g==='giallo'?(ui.tv&&Snd.__gk?'kit':'giallo'):isRG(G.g)?(G.en?P(G.en.c).r:'menu'):MUSICA[G.g]||(G.sim?'gang':'it');
function render(){applyTheme();const ae=document.activeElement,id=ae&&ae.id;
 $('#app').classList.toggle('fixed',fxOn());
 $('#app').innerHTML=(ui.screen==='name'?nameH():ui.screen==='room'?roomH():ui.screen==='tv'?TV.lobbyH():gameH())+(ui.screen==='game'?chatDrawerH():'');
 if(id){const el=document.getElementById(id);if(el&&el.focus)el.focus({preventScroll:true})}afterRender();
 Snd.track(traccia())}
/* mano a ventaglio: le carte si sovrappongono quanto basta per stare nello SCHERMO (non solo nel contenitore, che può essere
   più largo), poi si misura il ventaglio vero (le carte ai lati sono ruotate e sporgono) e si stringe ancora se esce dai bordi */
function fitHand(h){const sl=[...h.children].filter(x=>x.classList.contains('slot')),n=sl.length;h.style.setProperty('--ov','0px');if(n<2)return;
 const r=h.getBoundingClientRect(),L=Math.max(r.left,0)+6,R=Math.min(r.right,innerWidth)-6,cw=sl[0].firstElementChild.offsetWidth||64;
 let ov=cw-Math.min(cw+8,(R-L-cw)/(n-1));h.style.setProperty('--ov',ov+'px');
 for(let k=0;k<2;k++){let a=1e9,b=-1e9;sl.forEach(x=>{const q=x.getBoundingClientRect();a=Math.min(a,q.left);b=Math.max(b,q.right)});
  const fuori=Math.max(0,L-a)+Math.max(0,b-R);if(fuori<1)break;ov+=fuori/(n-1)+.5;h.style.setProperty('--ov',ov+'px')}}
function afterRender(){Bat.dopo();adaptScreen();{const x=ui.screen==='game'&&G&&G.g==='regix',d=document.documentElement.dataset;d.rx=x?'1':'';d.rxs=x&&G.en?P((ui.viewEn||G.en).c).s:''}if(ui.screen==='game'&&G&&G.g==='giallo')GIA.dopo();else SCENA.via();if(ui.tv)TV.panel();LP.away();if(!(ui.tv&&ui.screen==='game'&&G&&G.g==='catan'))CTV.hide();if(!(ui.tv&&ui.screen==='game'&&G&&isRG(G.g)))RTV3.hide();const u3=lob3()&&(ui.screen==='room'||ui.screen==='name');Plancia.draw();if(u3)L3D.show(ui.screen);else{L3D.hide();if(ui.lobby!=='hall'&&(ui.screen==='room'||ui.screen==='name'))tvIso()}const h=$('#hand');
 if(h&&!h.classList.contains('many'))fitHand(h);
 if(h){const deals=[...h.querySelectorAll('.card.deal')];if(deals.length&&!RM){const t=ctr(G&&isRG(G.g)?'#ptav':'#deck');deals.forEach((c,i)=>{const r=c.getBoundingClientRect();if(c.animate)c.animate([{transform:`translate(${t.x-(r.left+r.width/2)}px,${t.y-(r.top+r.height/2)}px) scale(.45) rotate(-25deg)`,opacity:.3},{transform:'none',opacity:1}],{duration:520*Math.max(SP,.1),delay:i*90*SP,easing:'cubic-bezier(.2,1.2,.4,1)',fill:'backwards'});if(i<6)setTimeout(()=>Snd.play('deal'),i*90*SP)})}}
 if(G&&isRG(G.g)&&G.en&&ui.screen==='game'){const en=ui.viewEn||G.en;if(seen.e&&seen.e!==en.c&&!RM){const b=$('#boss');if(b&&b.animate)b.animate([{transform:'translateY(-60px) scale(.6)',opacity:0},{transform:'none',opacity:1}],{duration:600*SP,easing:'cubic-bezier(.2,1.3,.4,1)'})}seen.e=en.c}}
addEventListener('resize',()=>afterRender());

document.addEventListener('input',e=>{if(e.target.id==='tvq'){ui.q=e.target.value;render();const el=document.getElementById('tvq');if(el){el.focus({preventScroll:true});try{el.setSelectionRange(ui.q.length,ui.q.length)}catch(x){}}}});

document.addEventListener('input',e=>{if(e.target.id==='cmsg')ui.cm=e.target.value});
let tvT=0;function tvLater(){clearTimeout(tvT);tvT=setTimeout(()=>{if(ui.screen==='room'){const l=$('#chatlog'),t=l?l.scrollTop:0;render();const l2=$('#chatlog');if(l2)l2.scrollTop=t}},7200)}
let lastChat=0;
async function chatSend(){const t=(ui.cm||'').trim().slice(0,120);if(!t||!R.on||!R.code)return;if(Date.now()-lastChat<600)return;lastChat=Date.now();
 const k=ui.ek||'m',g=(R.mine.guests||[]).find(x=>x.k===k),nm=g?g.name:(R.mine.name||ME.name),id=Date.now()+'_'+rid();ui.cm='';
 try{await R.db.doc('rooms/'+R.code+'/chat/'+id).set({dev:ME.dev,k:g?k:'m',name:nm,text:t,t:Date.now()});
  const old=R.chat.slice(0,Math.max(0,R.chat.length-39));for(const o of old){try{await R.db.doc('rooms/'+R.code+'/chat/'+o.id).delete()}catch(e){ERR.n(e)}}}catch(e){ui.err=netErr(e)}
 render();const l=$('#chatlog');if(l)l.scrollTop=l.scrollHeight;const el=$('#cmsg');if(el)el.focus({preventScroll:true})}
