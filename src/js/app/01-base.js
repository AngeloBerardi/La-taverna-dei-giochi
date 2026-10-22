/*ENGINE*/
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* Errori: niente più catch vuoti né errori che spariscono. ERR.n(e) li annota (ultimi 30 in memoria, ultimi 10 in 'rg-err'),
   uno stesso messaggio al massimo ogni 2 s; error/unhandledrejection globali finiscono qui. Non si mostra nulla a chi gioca. */
const ERR={b:[],t:{},n(e,dove){try{const m=String((e&&e.message)||e||'?').slice(0,160),k=m+'|'+(dove||''),ora=Date.now();
  if(/ResizeObserver|^Script error/.test(m)||ERR.t[k]&&ora-ERR.t[k]<2000)return;ERR.t[k]=ora;
  ERR.b.push({t:ora,m,dove:dove||'',s:String((e&&e.stack)||'').split('\n').slice(1,3).join(' | ').slice(0,200)});if(ERR.b.length>30)ERR.b.shift();
  try{localStorage.setItem('rg-err',JSON.stringify(ERR.b.slice(-10)))}catch(x){}console.warn('[errore]',dove||'',m);ERR.invia(ERR.b[ERR.b.length-1])}catch(x){}},
 /* anche nel database (nodo errori/, lo legge solo la console): al massimo 10 per sessione e uno ogni 5 s, solo se la rete è pronta */
 invia(r){try{const ora=Date.now();if(ERR.nv>=10||ora-(ERR.tv||0)<5000||typeof RT==='undefined'||!RT.on||!RT.m)return;ERR.nv=(ERR.nv||0)+1;ERR.tv=ora;
  RT.errore({t:r.t,m:r.m,dove:r.dove,s:r.s,u:RT.uid(),p:String(location.pathname).slice(0,60)}).catch(()=>{})}catch(x){}}};
addEventListener('error',ev=>ERR.n(ev.error||ev.message,'finestra'));
addEventListener('unhandledrejection',ev=>ERR.n(ev.reason,'promessa'));
const SYM=RG.SYM,P=RG.P,SN={H:'Cuori',D:'Quadri',C:'Fiori',S:'Picche'},RN={J:'Fante',Q:'Regina',K:'Re'};
const ST=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
let SP=1;const W=ms=>new Promise(r=>setTimeout(r,ms*SP));
