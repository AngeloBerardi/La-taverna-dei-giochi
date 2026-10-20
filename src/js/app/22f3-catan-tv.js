/* ---- Catan sullo schermo comune (?tv=CODICE): la plancia 3D (22f2-catan-tavolo.js) con il HUD sopra ----
   La TV mostra solo informazioni pubbliche: punti, numero di carte in mano, sviluppi, cavalieri, strada più lunga; mai le carte. Le mani stanno sui telefoni.
   Se WebGL non c'è, la TV disegna la plancia 2D (SVG) al posto del tavolo 3D. */
const CRG={wood:'<path d="M12 3l5 7h-3l4 6H6l4-6H7zM12 16v5"/>',brick:'<rect x="3" y="7" width="18" height="10"/><path d="M3 12h18M9 7v5M15 12v5"/>',
 wool:'<circle cx="8" cy="11" r="4"/><circle cx="14" cy="9" r="4"/><circle cx="16" cy="14" r="3"/><path d="M8 16v4M15 17v3"/>',
 grain:'<path d="M12 21V8M12 8C9 7 8 5 8 3c3 0 4 2 4 5zM12 8c3-1 4-3 4-5-3 0-4 2-4 5zM12 14c-3-1-4-3-4-5M12 14c3-1 4-3 4-5"/>',ore:'<path d="M2 19l7-12 4 7 3-4 6 9z"/>',road:'<path d="M7 21L10 3M17 21L14 3M12 5v3M12 11v3M12 17v3"/>'};
const resI=(k,sz)=>`<svg class="rgl ${k}" viewBox="0 0 24 24" width="${sz||20}" height="${sz||20}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${CRG[k]||''}</svg>`;
const CTVP={setup:s=>s.setup&&s.setup.step==='v'?'posa una colonia':'posa una strada (o una nave)',roll:()=>'tira i dadi',main:()=>'costruisce e scambia',sbp:()=>'costruzione speciale',rb:()=>'posa le strade gratuite',
 robber:s=>'sposta il ladro'+(s.pirate!=null?' o il pirata':''),steal:()=>'sceglie a chi rubare una carta'};
function catanTVstato(s){if(s.over)return'<b>'+esc(s.names[s.over.win])+'</b> vince la partita';
 if(s.phase==='discard')return'Escono i sette: scartano '+Object.keys(s.disc||{}).map(i=>'<b>'+esc(s.names[i])+'</b>').join(', ');
 if(s.phase==='gold')return'Terra d’oro: scelgono '+Object.keys(s.gold||{}).map(i=>'<b>'+esc(s.names[i])+'</b>').join(', ');
 const f=CTVP[s.phase];return'<b>'+esc(s.names[s.cur])+'</b> '+(f?f(s):'gioca')}
function catanTVH(){const s=G,C=CATAN,url=TV.linkGioco(),cols=typeof CPC!=='undefined'?CPC:[];
 const ok=CTV.sync(s),fail=CTV.failed;
 const dice=s.dice?`<div class="ctv-dice">${dieH(s.dice[0],{cls:'tv'})}${dieH(s.dice[1],{cls:'tv'})}<b>${s.dice[0]+s.dice[1]}</b></div>`:'<div class="ctv-dice off"></div>';
 const pls=s.names.map((n,i)=>{const lr=s.longest&&s.longest.p===i,ar=s.army&&s.army.p===i;
  return`<li class="${i===s.cur&&!s.over?'act':''}" style="--pc:${cols[i]||'#ccc'}"><i class="ctv-dot"></i><span class="ctv-n">${esc(n)}</span><b class="ctv-vp">${C.points(s,i,false)}<small>★</small></b>
   <span class="ctv-st"><span title="Carte in mano">${ic('borsa',20)}<b>${C.handOf?C.handOf(s,i):C.cardsOf(s,i)}</b></span><span title="Carte sviluppo">${ic('star',20)}<b>${s.dev[i].length}</b></span><span title="Cavalieri giocati">${ic('pugnale',20)}<b>${s.knights[i]}</b></span><span title="Strada più lunga">${resI('road',20)}<b>${C.roadLen(s,i)}</b></span></span>
   ${lr||ar?`<span class="ctv-bd">${lr?'<em>Strada più lunga</em>':''}${ar?'<em>Esercito più grande</em>':''}</span>`:''}</li>`}).join('');
 const bank=C.RES.map(k=>`<span class="ctv-bk ${k}">${resI(k,22)}<b>${s.bank[k]}</b></span>`).join('');
 const feed=s.log.slice(-4).reverse().map((t,i)=>`<li class="${i?'':'new'}">${esc(t)}</li>`).join('');
 const T_=s.trade;let tr='';
 if(T_&&s.phase==='main'){const side=o=>C.RES.filter(k=>o[k]>0).map(k=>`<span class="ctv-rc ${k}">${o[k]}${resI(k,26)}</span>`).join('');
  tr=`<div class="ctv-trade"><div class="ctv-tt">${esc(s.names[T_.from])} propone uno scambio${T_.to!=null?' a '+esc(s.names[T_.to]):''}</div><div class="ctv-tb"><div>${side(T_.give)}</div><span>per</span><div>${side(T_.want)}</div></div>
   <div class="ctv-ta">${T_.acc.length?'Accettano: '+T_.acc.map(i=>'<b>'+esc(s.names[i])+'</b>').join(', '):'Nessuno ha ancora accettato'}</div></div>`}
 const end=s.over?`<div class="ctv-end"><div class="ctv-endbox"><div class="ctv-crown">${ic('corona',72)}</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><p>${esc(s.over.reason||'')}</p><ul>${s.names.map((n,i)=>`<li class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}★</b></li>`).join('')}</ul></div></div>`:'';
 const xp=(s.xt||[]).map(k=>({mar:'Marinai',cek:'Città e Cavalieri',mb:'Mercanti e Barbari',ep:'Esploratori e Pirati'})[k]).filter(Boolean);
 const sc=s.scen&&CATAN.EXTS&&CATAN.EXTS.mar&&CATAN.EXTS.mar.SC[s.scen];
 return`<div class="ctv ${fail?'flat':''}">
  <header class="ctv-top"><div><div class="ctv-logo">Catan</div><div class="ctv-sub">${esc(xp.join(' · ')||'Gioco base')}${sc?' · '+esc(sc.nome):''} · si vince a ${s.vp}★</div></div>
   <div class="ctv-st8">${catanTVstato(s)}</div>${dice}</header>
  ${fail||!ok&&CTV.failed?`<div class="ctv-flat">${boardH(s,null)}</div>`:''}
  <aside class="ctv-pl"><ul>${pls}</ul><div class="ctv-bank">${bank}</div></aside>
  <footer class="ctv-foot"><ul class="ctv-feed">${feed}</ul>${tr}</footer>${end}</div>`}
