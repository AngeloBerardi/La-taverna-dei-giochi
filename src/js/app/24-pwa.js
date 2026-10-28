/* ---- PWA: service worker, aggiornamenti, installazione (vedi src/pwa/sw.js) ---- */
const PWA={ev:null,
 installed:()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}},
 ios:/iphone|ipad|ipod/i.test(navigator.userAgent||'')&&!window.MSStream,
 sw:'serviceWorker' in navigator&&/^https?:$/.test(location.protocol),
 reg:null,
 android:/android/i.test(navigator.userAgent||''),
 // dentro l'app Android (android/, docs/ANDROID.md) il primo indirizzo porta ?app=android: lo ricorda la sessione, non il browser
 // (l'app e Chrome condividono la memoria del sito, quindi niente localStorage)
 twa:(()=>{try{const t=/[?&]app=android\b/.test(location.search)||/^android-app:\/\/app\.web\.latavernadeigiochi/.test(document.referrer||'');
  if(t)sessionStorage.setItem('rg-twa','1');return t||sessionStorage.getItem('rg-twa')==='1'}catch(e){return false}})(),
 // da un telefono Android, fuori dall'app: scarica l'APK pubblicato con il sito (src/pwa/taverna.apk)
 apkH(){return PWA.android&&!PWA.twa?'<a class="b sm gold apkdl" href="/taverna.apk" download="La-Taverna-dei-Giochi.apk">Scarica l’app per Android</a>':''},
 // pulsante o suggerimento per le impostazioni
 cfgH(){const apk=PWA.apkH();if(PWA.installed())return apk;
  if(PWA.ev)return apk+'<button class="b sm" data-a="pwainstall">Installa l’app sul telefono</button>';
  if(PWA.ios)return'<p class="muted" style="margin:0">Per installarla: tasto Condividi → «Aggiungi alla schermata Home».</p>';return apk},
 async install(){const e=PWA.ev;if(!e)return;PWA.ev=null;try{e.prompt();await e.userChoice}catch(x){}render()}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();PWA.ev=e;if(ui.cfg)render()});
window.addEventListener('appinstalled',()=>{PWA.ev=null;if(ui.cfg)render()});
if(PWA.sw){
 let ricarica=false;const aveva=!!navigator.serviceWorker.controller;
 // nuova versione attiva: ricarica solo se non c'è una partita in corso
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!aveva||ricarica)return;if(ui.screen==='game'&&G)return;ricarica=true;location.reload()});
 window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').then(r=>{PWA.reg=r;
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&r)r.update().catch(()=>{})})}).catch(()=>{}));
}
