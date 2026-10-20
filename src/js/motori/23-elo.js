/* ---- Classifica ELO (dati puri). Una valutazione per gioco, si parte da 1000. ----
   Vale solo per partite competitive tra giocatori con un account (nessun ospite). Nelle regole
   (firestore.rules) una partita può spostare la valutazione di al massimo ELO.K punti: tenerli uguali. */
const ELO=(()=>{
 const BASE=1000,K=32,MIN=100,MAX=3000;
 // giochi in cui si vince o si perde tutti insieme: niente classifica ELO
 const COOPERATIVI=['regicide','gang','island','mind','mindx','scoundrel','discesa'];
 const competitivo=id=>!COOPERATIVI.includes(id);
 const SQUADRE={briscola:(s,i)=>s.n===4?i%2:i,burraco:(s,i)=>i%2};
 // posti vincitori di una partita finita, oppure null se non c'è una classifica da fare
 // (gioco cooperativo, pareggio, partita non finita)
 function vincitori(s){
  const o=s&&s.over;if(!o||typeof o.win==='boolean')return null;
  const lista=a=>Array.isArray(a)&&a.length?a.slice():null;
  if(lista(o.winners))return lista(o.winners);
  if(lista(o.wins))return lista(o.wins);
  if(!Number.isInteger(o.win))return null;
  const sq=SQUADRE[s.g];if(sq){const r=[];for(let i=0;i<s.n;i++)if(sq(s,i)===o.win)r.push(i);return r.length?r:null}
  return[o.win]}
 const atteso=(a,b)=>1/(1+Math.pow(10,(b-a)/400));
 // nuova valutazione di chi ha valutazione `mio`, contro gli `altri` (valutazioni dei restanti giocatori al tavolo);
 // `vinto`: ha vinto lui (o la sua squadra, che conta `quanti` vincitori in totale)
 function nuovo(mio,altri,vinto,quanti){
  const N=altri.length+1;if(N<2)return mio;
  // parte attesa: somma delle probabilità di battere ciascun altro, divisa per il numero di coppie del tavolo
  let somma=0;for(const r of altri)somma+=atteso(mio,r);
  const coppie=N*(N-1)/2,att=somma/coppie;
  const punti=vinto?1/Math.max(1,quanti||1):0;
  const d=Math.round(K*(punti-att));
  return Math.max(MIN,Math.min(MAX,mio+Math.max(-K,Math.min(K,d))))}
 return{BASE,K,MIN,MAX,COOPERATIVI,competitivo,vincitori,atteso,nuovo}})();
if(typeof module!=='undefined')module.exports=ELO;
