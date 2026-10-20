/* ================= LAYOUT FISSO (nessuno scorrimento) =================
   Per i giochi in FIXED la pagina occupa esattamente lo schermo: in alto titolo e dati, striscia giocatori compatta, al centro il tavolo
   (si adatta allo spazio che resta), in basso messaggio, comandi e mano. Giocatori, registro e regole stanno in pannelli a scorrimento
   interno che si aprono dalla barra in fondo. */
const FIXED=new Set(['perudo','kittens','catan','pets','uno','trono']);
const fxOn=()=>ui.screen==='game'&&G&&FIXED.has(G.g);
/* striscia giocatori: f(i) → {b: badge, c: colore, out: eliminato} */
function stripH(s,f){return`<div class="fx-strip n${Math.min(s.names.length,10)}">`+s.names.map((n,i)=>{const o=f(i)||{};
 return`<button class="fxp ${i===s.cur&&!s.over?'act':''} ${o.out?'out':''} ${o.trn?'trn':''}" style="--pc:${o.c||'var(--accent)'}" data-a="fxsheet" data-v="players" aria-label="${esc(n)}"><i>${o.out?'💥':esc((n[0]||'?').toUpperCase())}</i><small>${esc(n.slice(0,7))}</small>${o.b!=null&&o.b!==''?`<b>${o.b}</b>`:''}</button>`}).join('')+`</div>`}
function fxSheetH(o){if(!ui.sheet)return'';const s=G;
 const body=ui.sheet==='players'?`<h3>Giocatori</h3><div class="fx-list">${o.players||''}</div>`:`<h3>Registro</h3><div class="fx-log">${(s.log||[]).slice().reverse().map(l=>`<div>${esc(l)}</div>`).join('')||'<small class="muted">Ancora niente.</small>'}</div>`;
 return`<div class="fx-sheet" data-a="fxsheet" data-v=""><div class="fx-card" onclick="event.stopPropagation()"><button class="ib fx-x" data-a="fxsheet" data-v="" aria-label="Chiudi">✕</button>${body}</div></div>`}
function fixH(o){const tab=(k,ic,l)=>`<button class="fxt ${ui.sheet===k?'sel':''}" data-a="fxsheet" data-v="${k}"><i>${ic}</i>${l}</button>`;
 return`<div class="fx"><div class="fx-top">${hudH(o.title)}${o.chips?`<div class="tinfo fx-chips">${o.chips}</div>`:''}</div>${o.strip||''}<div class="fx-mid">${o.mid||''}</div><div class="fx-bot">${o.bot||''}<div class="err" role="alert">${esc(ui.err)}</div></div>${o.hand?`<div class="fx-hand">${o.hand}</div>`:''}<nav class="fx-tabs">${tab('players','👥','Giocatori')}${tab('log','📜','Registro')}<button class="fxt" data-a="rules" data-v="${G.g}"><i>❓</i>Regole</button></nav></div>${fxSheetH(o)}${o.end||''}${rulesH()}${cfgH()}`}
/* mano a ventaglio su una o due file: le carte si sovrappongono quanto serve per stare nella larghezza */
function fanH(cards,per){per=per||8;const rows=cards.length>per?[cards.slice(0,Math.ceil(cards.length/2)),cards.slice(Math.ceil(cards.length/2))]:[cards];
 return rows.map(r=>`<div class="fanrow">${r.join('')}</div>`).join('')}
function fanFit(){document.querySelectorAll('.fanrow').forEach(r=>{const k=[...r.children],n=k.length;if(n<2){r.style.setProperty('--ov','0px');return}
 const w=r.clientWidth,cw=k[0].getBoundingClientRect().width||56,step=Math.min(cw+4,(w-cw)/(n-1));r.style.setProperty('--ov',(cw-step)+'px')})}
/* ADATTAMENTO ALLO SCHERMO: --k scala carte e pezzi in base allo spazio; i giochi non ancora migrati al layout fisso vengono rimpiccioliti (zoom) quanto basta per non scorrere, fino a un minimo leggibile */
const FITMIN=.58;
function adaptScreen(){const root=document.documentElement,app=document.getElementById('app');if(!app)return;
 const wide=innerWidth>=820||(innerWidth>innerHeight&&innerHeight<=520),k=Math.max(.7,Math.min(ui.tv?2.6:1.5,Math.min(innerHeight/760,innerWidth/(wide?700:390))));
 root.style.setProperty('--k',k.toFixed(3));root.classList.toggle('wide',wide);
 app.style.zoom='';
 if(ui.screen==='game'&&G&&!fxOn()){const ov=()=>root.scrollHeight-innerHeight;
  if(ov()>2){let z=Math.max(FITMIN,Math.min(1,innerHeight/root.scrollHeight));app.style.zoom=z.toFixed(3);
   if(ov()>2){z=Math.max(FITMIN,z*innerHeight/root.scrollHeight);app.style.zoom=z.toFixed(3)}}}
 if(fxOn())fanFit()}
