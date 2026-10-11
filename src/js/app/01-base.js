/*ENGINE*/
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SYM=RG.SYM,P=RG.P,SN={H:'Cuori',D:'Quadri',C:'Fiori',S:'Picche'},RN={J:'Fante',Q:'Regina',K:'Re'};
const ST=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
let SP=1;const W=ms=>new Promise(r=>setTimeout(r,ms*SP));
