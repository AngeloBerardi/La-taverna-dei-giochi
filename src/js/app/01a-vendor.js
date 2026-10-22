/* Librerie esterne (three.js, PeerJS): non stanno nella pagina, sono file a parte (dist/vendor/<nome>.<hash>.js)
   con cache lunga e caricati solo quando servono. scripts/build.js riempie la mappa nome -> url. */
const VENDOR=(()=>{
 const MAP=/*VENDOR*/{};
 const PRONTO={three:()=>!!window.THREE,peerjs:()=>!!(window.Peer||(window.peerjs&&window.peerjs.Peer)),lobby3d:()=>!!window.__L3D};
 const dentro={};
 const gl=()=>{try{const c=document.createElement('canvas');return!!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch(e){return false}};
 function load(n){
  if(!PRONTO[n])return Promise.reject(new Error('vendor sconosciuto: '+n));
  if(PRONTO[n]())return Promise.resolve(true);
  if(dentro[n])return dentro[n];
  if(!MAP[n])return Promise.reject(new Error('vendor non in mappa: '+n));
  return dentro[n]=new Promise((res,rej)=>{
   const s=document.createElement('script');s.src=MAP[n];s.async=true;
   s.onload=()=>{if(n==='peerjs'&&!window.Peer&&window.peerjs)window.Peer=window.peerjs.Peer;delete dentro[n];PRONTO[n]()?res(true):rej(new Error('vendor vuoto: '+n))};
   s.onerror=()=>{delete dentro[n];s.remove();rej(new Error('vendor non caricato: '+n))};
   document.head.appendChild(s);
  });
 }
 // come load, ma non rifiuta mai e non aspetta oltre ms (rete lenta: si parte comunque con il ripiego)
 const prova=(n,ms)=>Promise.race([load(n).then(()=>true,()=>false),new Promise(r=>setTimeout(()=>r(false),ms||10000))]);
 return{load,prova,gl,map:MAP};
})();
