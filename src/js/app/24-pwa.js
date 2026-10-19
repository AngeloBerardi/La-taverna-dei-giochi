/* ---- PWA: service worker, aggiornamenti, installazione (vedi src/pwa/sw.js) ---- */
const PWA={ev:null,
 installed:()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}},
 ios:/iphone|ipad|ipod/i.test(navigator.userAgent||'')&&!window.MSStream,
 sw:'serviceWorker' in navigator&&/^https?:$/.test(location.protocol),
 reg:null,
 // pulsante o suggerimento per le impostazioni
 cfgH(){if(PWA.installed())return'';
  if(PWA.ev)return'<button class="b sm" data-a="pwainstall">Installa l’app sul telefono</button>';
  if(PWA.ios)return'<p class="muted" style="margin:0">Per installarla: tasto Condividi → «Aggiungi alla schermata Home».</p>';return''},
 async install(){const e=PWA.ev;if(!e)return;PWA.ev=null;try{e.prompt();await e.userChoice}catch(x){}render()}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();PWA.ev=e;if(ui.cfg)render()});
window.addEventListener('appinstalled',()=>{PWA.ev=null;if(ui.cfg)render()});
if(PWA.sw){
 let ricarica=false;const aveva=!!navigator.serviceWorker.controller;
 // nuova versione attiva: ricarica solo se non c'è una partita in corso
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!aveva||ricarica)return;if(ui.screen==='game'&&G)return;ricarica=true;location.reload()});
 window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').then(r=>{PWA.reg=r;
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)r.update().catch(()=>{})})}).catch(()=>{}));
}
