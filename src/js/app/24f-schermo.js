/* ---- Schermo comune: ?tv=CODICE apre la stanza in sola visione, pensata per una TV o un PC ----
   Non occupa un posto e non scrive nulla (niente membri, niente chat): legge lo stato e mostra il tavolo grande, con il
   codice QR per unirsi dal telefono e l'elenco dei giocatori. I telefoni restano i comandi. Funziona con le stanze p2p
   (codice di 4 lettere) e con le partite a distanza (8 caratteri). Dati: stessa stanza di tutti (R.doc, G). */
// ID dell'app Google Cast (vuoto finché non è registrata: vedi docs/CAST.md)
const CAST_APP_ID='';
const TV={
 code:'',strict:false,
 // legge il link: ?tv=CODICE (&b=indice del broker, come negli inviti)
 leggi(){try{const q=new URLSearchParams(location.search),c=(q.get('tv')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
   if(c.length<3||c.length>DIST.LUN)return false;TV.code=c;TV.strict=q.has('b');return true}catch(e){return false}},
 // link per aprire lo schermo (dal telefono di un giocatore) e link per unirsi (nel QR)
 linkSchermo(){return location.origin+location.pathname+'?tv='+R.code+(R.mode==='p2p'&&P2P.tr==='mq'?'&b='+MQ.bi:'')},
 linkGioco(){return R.mode==='fs'?Dist.invito(R.code):location.origin+location.pathname+'?room='+R.code+(R.mode==='p2p'&&P2P.tr==='mq'?'&b='+MQ.bi:'')},
 async avvia(){ui.tv=true;document.documentElement.dataset.tv='1';ME.name=ME.name||'Schermo';R.mine.name=ME.name;ui.screen='tv';ui.err='';render();TV.sveglio();
  try{await netInit();const c=TV.code;
   if(c.length===DIST.LUN){await FB.start();if(!Dist.ok())throw new Error('profilo online non disponibile');R.db=FsDb;R.mode='fs';R.on=true;ME.dev='tv-'+rid()}
   else{if(R.mode!=='p2p')throw new Error('servono le stanze online');
    const t0=Date.now();let ultimo;while(Date.now()-t0<75000){try{R.db=await p2pJoin(c,8000,TV.strict);ultimo=null;break}catch(e){ultimo=e;await new Promise(r=>setTimeout(r,2500))}}
    if(ultimo)throw ultimo}
   await joinRoom(c,true);ui.err=''}
  catch(e){ui.err=netErr?netErr(e):String(e);render();setTimeout(()=>TV.avvia(),6000)}},
 // sul telefono di un giocatore: finestra con il QR da inquadrare con la TV (o il link da aprire sul PC)
 cfgH(){return R.on&&R.code&&!ui.tv?'<button class="b sm tile" data-a="tvm"><span class="ti">'+ic('tv')+'</span>Schermo comune</button>':''},
 modaleH(){const u=TV.linkSchermo();return`<div class="modal"><div class="box col"><h2>Schermo comune</h2>
<p class="muted" style="margin:0">Apri questo link sulla TV o sul PC: mostra il tavolo in grande, tu giochi dal telefono.</p>
<div class="tvm-qr">${QR.svg(u)}</div><input class="acc-in" readonly value="${esc(u)}" onfocus="this.select()">
${TV.puoiCondividere()?'<button class="b gold" data-a="tvshare">Invia il link al PC o alla TV</button>':''}
<p class="muted" style="margin:0;font-size:13px">Per il Chromecast: apri questo link su un PC con Chrome, poi menu ⋮ → <b>Trasmetti</b> → scegli il Chromecast → <b>Trasmetti scheda</b>. Con una smart TV puoi aprire il link nel suo browser. I telefoni restano i comandi.</p>
${TV.puoiCast()?(TV.inCast()?`<button class="b" data-a="tvcastx">Interrompi la trasmissione</button><p class="muted" style="margin:0">Il Chromecast mostra il tavolo: puoi continuare a giocare dal telefono.</p>`:`<button class="b gold" data-a="tvcast">Trasmetti al Chromecast</button>`):''}
<div class="row"><button class="b sm gold" data-a="tvcopy">Copia link</button><button class="b sm" data-a="tvmx">Chiudi</button></div></div></div>`},
 // dal telefono: il foglio di condivisione manda il link a un altro dispositivo (Chrome: «Invia ai tuoi dispositivi»), da cui si trasmette
 puoiCondividere(){return typeof navigator.share==='function'&&!ui.tv},
 async condividi(){try{await navigator.share({title:'Schermo comune · La Taverna dei Giochi',url:TV.linkSchermo()})}catch(e){if(!e||e.name!=='AbortError')say('Condivisione non riuscita: usa «Copia link»',3500)}},
 // Chromecast: ricevitore Google Cast (src/pwa/receiver.html) che apre da solo lo schermo comune; il telefono resta il comando.
 // Serve l'ID dell'app registrata su Google Cast (docs/CAST.md): CAST_APP_ID, oppure una volta sola ?castid=ID sul telefono.
 castId(){try{const q=new URLSearchParams(location.search).get('castid');if(q&&/^[A-F0-9]{6,12}$/i.test(q)){ST('rg-castid',q.toUpperCase());return q.toUpperCase()}}catch(e){}
  const v=CAST_APP_ID||ST('rg-castid')||'';return/^[A-F0-9]{6,12}$/i.test(v)?v.toUpperCase():''},
 puoiCast(){return!ui.tv&&location.protocol==='https:'&&!!TV.castId()&&/Chrome\//.test(navigator.userAgent)&&!/SamsungBrowser|OPR\/|Edg\/|Firefox/.test(navigator.userAgent)},
 inCast(){try{return!!(window.cast&&cast.framework&&cast.framework.CastContext.getInstance().getCurrentSession())}catch(e){return false}},
 // carica l'SDK Cast solo quando serve
 castSdk(){if(TV._sdk)return TV._sdk;return TV._sdk=new Promise((ok,ko)=>{if(window.cast&&cast.framework)return ok();const t=setTimeout(()=>ko(new Error('sdk')),10000);
  window.__onGCastApiAvailable=d=>{clearTimeout(t);d?ok():ko(new Error('sdk'))};const sc=document.createElement('script');sc.src='https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';sc.onerror=()=>{clearTimeout(t);ko(new Error('sdk'))};document.head.appendChild(sc)}).catch(e=>{TV._sdk=null;throw e})},
 async cast(){if(!R.code)return say('Entra prima in una stanza',2500);
  try{await TV.castSdk();const cx=cast.framework.CastContext.getInstance();
   cx.setOptions({receiverApplicationId:TV.castId(),autoJoinPolicy:chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,language:'it'});
   const err=await cx.requestSession();if(err&&err!=='cancel'&&err!=='session_error'){throw new Error(err)}if(err==='cancel')return;
   const ss=cx.getCurrentSession();if(!ss)throw new Error('nessuna sessione');
   await ss.sendMessage(TV.NS,{code:R.code,b:R.mode==='p2p'&&P2P.tr==='mq'?MQ.bi:null});
   say('Trasmissione avviata',2500);render()}
  catch(e){say(e&&e.message==='sdk'?'Cast non disponibile su questo browser':e&&e.message==='receiver_unavailable'?'Il Chromecast non riesce ad aprire l’app: controlla l’ID Cast':'Trasmissione non riuscita: '+(e&&e.message||e),4500)}},
 async castStop(){try{cast.framework.CastContext.getInstance().endCurrentSession(true)}catch(e){}render()},
 NS:'urn:x-cast:app.web.latavernadeigiochi',
 async act(a){if(a==='tvfull')return TV.pieno();if(a==='tvcast')return TV.cast();if(a==='tvcastx')return TV.castStop();if(a==='tvshare')return TV.condividi();
  if(a==='tvm'){ui.tvm=true;ui.cfg=false;return render()}if(a==='tvmx'){ui.tvm=false;ui.cfg=true;return render()}
  if(a==='tvcopy'){const u=TV.linkSchermo();try{await navigator.clipboard.writeText(u);say('Link copiato',1800)}catch(e){say(u,4000)}}},
 sveglio(){try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}},
 pieno(){const d=document;if(d.fullscreenElement)d.exitFullscreen();else if(d.documentElement.requestFullscreen)d.documentElement.requestFullscreen().catch(()=>{})},
 // posti con chi gioca; ▶ = a chi tocca
 giocatori(){const S=seatsNow();
  if(G&&S.length){return S.map((x,i)=>({nome:x.name||'?',turno:!G.over&&(G.sim||G.cur===i)}))}
  return(R.members||[]).map(m=>({nome:m.name||'?',turno:false}))},
 panelH(){const url=TV.linkGioco(),gg=R.doc&&R.doc.game&&GAMES.find(x=>x.id===R.doc.game);
  return`<div class="tvp-qr">${QR.svg(url,{scuro:'#1a1208',chiaro:'#f6ecd2'})}</div>
<div class="tvp-cod">${esc(R.code||TV.code)}</div><div class="tvp-hint">Inquadra per sederti al tavolo</div>
${gg?`<div class="tvp-game">${esc(gg.name)}</div>`:''}
<ul class="tvp-pl">${TV.giocatori().map(p=>`<li class="${p.turno?'on':''}"><span>${p.turno?'▶':''}</span>${esc(p.nome)}</li>`).join('')||'<li class="vuoto">Nessuno è ancora seduto</li>'}</ul>
${G&&G.over?'<div class="tvp-fine">Partita finita</div>':''}
<button class="b sm" data-a="tvfull">Schermo intero</button>`},
 panel(){if(!ui.tv)return;let el=document.getElementById('tvpanel');if(!el){el=document.createElement('aside');el.id='tvpanel';document.body.appendChild(el)}
  if(!R.code){el.innerHTML='';return}el.innerHTML=TV.panelH()},
 lobbyH(){const gg=R.doc&&R.doc.game&&GAMES.find(x=>x.id===R.doc.game);
  return`<div class="tvwait"><h1>La Taverna dei Giochi</h1>${ui.err?`<p class="err">${esc(ui.err)}</p>`:R.code?`<p>${gg?'Si sta per giocare a <b>'+esc(gg.name)+'</b>':'Il tavolo sta scegliendo un gioco…'}</p>`:'<p>Mi collego al tavolo…</p>'}</div>`}};
document.addEventListener('keydown',e=>{if(ui.tv&&(e.key==='f'||e.key==='F')&&!/INPUT|TEXTAREA/.test((e.target||{}).tagName||''))TV.pieno()});
