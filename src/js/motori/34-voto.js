/* VOTO DI STANZA (regole pure). Una proposta {id,k,g,o,by,t} e le risposte per dispositivo {devId: true|false|undefined}.
   k='play' (proporre un gioco): serve l'accordo di tutti, un solo "no" la boccia.
   k='stop' (interrompere la partita): basta la maggioranza dei presenti.
   Si decide appena l'esito è certo; allo scadere (DUR secondi) chi non ha risposto conta come "no". */
const VOTO=(()=>{
const DUR=30;
function esito(k,devs,ans,left){
 const n=devs.length,si=devs.filter(d=>ans[d]===true).length,no=devs.filter(d=>ans[d]===false).length,att=n-si-no;
 const need=k==='stop'?Math.floor(n/2)+1:n;
 if(si>=need)return{fine:true,ok:true,si,no,att,need};
 if(si+att<need)return{fine:true,ok:false,si,no,att,need};
 if(left<=0)return{fine:true,ok:false,si,no,att,need,tempo:true};
 return{fine:false,ok:false,si,no,att,need}}
const chi=(devs,ans,nomi)=>devs.filter(d=>ans[d]!==true).map(d=>nomi[d]||'?');
return{DUR,esito,chi}})();
if(typeof module!=='undefined')module.exports=VOTO;
