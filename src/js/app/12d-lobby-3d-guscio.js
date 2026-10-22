/* Guscio della Taverna 3D: il codice vero (12c-lobby-3d.js, generato) non sta nella pagina ma in dist/vendor/lobby3d.<hash>.js
   e si scarica solo a chi usa la lobby 3D. Stessa interfaccia di prima (ok, show, hide, sync, dbg). Se il file non arriva si torna al falò. */
const L3D=(()=>{
 let vero=null,carica=null,perso=false;
 const avvia=()=>carica||(carica=VENDOR.load('lobby3d').then(()=>{vero=window.__L3D;return true},e=>{
  perso=true;ERR.n(e,'lobby3d');if(ui.lobby==='3d'){ui.lobby='iso';ST('rg-lb','iso');render()}return false}));
 return{
  ok:()=>vero?vero.ok():!perso&&!!window.THREE&&VENDOR.gl(),
  show:screen=>{if(vero)return vero.show(screen);avvia().then(ok=>{if(ok&&ui.lobby==='3d')render()})},
  hide:()=>{if(vero)vero.hide()},
  sync:()=>{if(vero)vero.sync()},
  dbg:()=>vero?vero.dbg():null,
  avvia};
})();
