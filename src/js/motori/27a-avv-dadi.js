/* ---- Dadi dell'avventura (Cantari di Ventura): generatore deterministico e tiri (regole pure, senza DOM né rete). ----
   Il generatore vive nello stato della partita (`s.rng`, un intero a 32 bit): stessa partita + stesse azioni = stessi dadi,
   così telefono, schermo comune e test arrivano allo stesso risultato. Le funzioni di tiro prendono un `rnd` (0..1): quello
   dello stato (`ADADI.gen(s)`) oppure uno finto nei test (`() => .99`).
   Mai usare Math.random in un motore dell'avventura. */
const ADADI=(()=>{
 const u32=n=>(Number(n)>>>0);
 // un passo di mulberry32: avanza h.rng e restituisce un numero in [0,1)
 function passo(h){h.rng=(h.rng+0x6D2B79F5)|0;let t=Math.imul(h.rng^(h.rng>>>15),1|h.rng);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
 // seme di partenza ben mescolato a partire da un numero qualsiasi (per esempio il seme della mappa)
 function semina(n){const h={rng:(u32(n)^0x9E3779B9)|0};for(let i=0;i<4;i++)passo(h);return h.rng}
 // generatore che scrive il proprio avanzamento nello stato `h` (qualsiasi oggetto con il campo `rng`)
 const gen=h=>()=>passo(h);
 // dado a n facce (1..n)
 const d=(rnd,n)=>1+Math.floor(rnd()*n);
 // d20: con vantaggio si tiene il migliore di due dadi, con svantaggio il peggiore; se ci sono entrambi si annullano
 function d20(rnd,o){o=o||{};const v=o.vant&&!o.svant,s=o.svant&&!o.vant,a=d(rnd,20);if(!v&&!s)return{tiro:a,tiri:[a]};
  const b=d(rnd,20);return{tiro:v?Math.max(a,b):Math.min(a,b),tiri:[a,b]}}
 // espressione di danno: '2d6+3', 'd8', '1d10-1', '5'
 function leggi(expr){const m=/^\s*(\d*)d(\d+)\s*([+-]\s*\d+)?\s*$/.exec(String(expr));
  if(m)return{n:m[1]===''?1:+m[1],f:+m[2],b:m[3]?+m[3].replace(/\s+/g,''):0};
  if(/^\s*[+-]?\d+\s*$/.test(String(expr)))return{n:0,f:0,b:+expr};throw new Error('espressione di dadi non valida: '+expr)}
 // tira i dadi di un'espressione; con `critico` i dadi (non il bonus) raddoppiano. Il danno non scende mai sotto 0.
 function danno(rnd,expr,critico){const e=leggi(expr),n=e.n*(critico?2:1),dadi=[];for(let i=0;i<n;i++)dadi.push(d(rnd,e.f));
  return{tot:Math.max(0,dadi.reduce((a,x)=>a+x,0)+e.b),dadi,bonus:e.b}}
 const medio=expr=>{const e=leggi(expr);return e.n*(e.f+1)/2+e.b};
 // probabilità esatta di riuscire: d20 + bonus >= cd; 1 naturale fallisce sempre, 20 naturale riesce sempre
 function prob(bonus,cd,o){o=o||{};let ok=0;for(let t=1;t<=20;t++)if(t===20||(t!==1&&t+bonus>=cd))ok++;const p=ok/20;
  if(o.vant&&!o.svant)return 1-(1-p)*(1-p);if(o.svant&&!o.vant)return p*p;return p}
 return{u32,passo,semina,gen,d,d20,leggi,danno,medio,prob}})();
if(typeof module!=='undefined')module.exports=ADADI;
