/* ---- Bottega: modale, acquisto e scelta dei cosmetici (catalogo: motori/22-bottega.js; dati: FB) ---- */
const Shop={
 // allinea la scelta locale (rg-dorso) con quella salvata nel profilo; ignora oggetti non posseduti
 sync(){const p=FB.p;if(!p)return;const eq=(p.equipped||{}).dorso||'';
  const id=eq&&BOTTEGA.usabile(eq,p.owned)?eq:'';dorsoSel=id==='dorso-classico'?'':id;ST('rg-dorso',dorsoSel);applyTheme()},
 cfgH(){return FB.st==='ok'&&FB.p?'<button class="b sm" data-a="shop">Bottega 🛍️</button>':''},
 html(){const p=FB.p,ok=FB.st==='ok'&&p,cur=ok?((p.equipped||{}).dorso||BOTTEGA.SLOT.dorso.base):'';
  const lista=[{id:BOTTEGA.SLOT.dorso.base,nome:'Classico',prezzo:0,desc:'Il dorso di sempre.'},...BOTTEGA.oggetti.filter(o=>o.slot==='dorso')];
  const voce=o=>{const su=BOTTEGA.suffisso(o.id),mio=BOTTEGA.usabile(o.id,ok&&p.owned);
   const b=!ok?'':o.id===cur?'<span class="chip">In uso</span>':mio?`<button class="b sm" data-a="shopuse" data-v="${o.id}">Usa</button>`
    :`<button class="b sm gold" data-a="shopbuy" data-v="${o.id}" ${p.coins<o.prezzo?'disabled':''}>🪙 ${o.prezzo}</button>`;
   return`<div class="shopi ${o.id===cur?'on':''}"><div class="card back ${o.id===BOTTEGA.SLOT.dorso.base?'':'d-'+su}" aria-hidden="true"></div><div class="shopt"><b>${esc(o.nome)}</b><small>${esc(o.desc)}</small>${b}</div></div>`};
  return`<div class="modal"><div class="box col"><h2>Bottega</h2><p class="muted" style="margin:0">${ok?`🪙 ${p.coins} monete · guadagni 10 a partita e 15 in più se vinci`:'Serve il profilo online: controlla la connessione.'}</p>
<h3 style="margin:4px 0 0">${BOTTEGA.SLOT.dorso.nome}</h3><div class="shop">${lista.map(voce).join('')}</div><button class="b sm" data-a="shopx">Chiudi</button></div></div>`},
 async act(a,v){
  if(a==='shop'){ui.shop=true;ui.cfg=false;return render()}
  if(a==='shopx'){ui.shop=false;ui.cfg=true;return render()}
  if(FB.st!=='ok'||ui.busyShop)return;ui.busyShop=true;
  try{if(a==='shopbuy'){await FB.buy(v);say('Comprato: '+BOTTEGA.per(v).nome,1800)}else await FB.equip('dorso',v);Shop.sync()}
  catch(e){say(e&&e.code==='monete'?'Monete insufficienti':'Non riuscito, riprova tra poco',2200);console.warn('Bottega',e)}
  finally{ui.busyShop=false;render()}}};
