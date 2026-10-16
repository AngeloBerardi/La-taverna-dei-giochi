/* PERUDO – dadi del bugiardo (gioco tradizionale peruviano). 2-6 giocatori, 5 dadi a testa.
   Stato: hands[i] = dadi di i (nascosti agli altri dalla vista), bid = ultima dichiarazione {q,f,p}, pal = posto che gioca il round "palifico" (o null).
   Azioni: {t:'bid',q,f} · {t:'dudo'} · {t:'calza'} · {t:'next'} (dopo la rivelazione, phase:'summary'). */
const PERU=(()=>{
let RND=Math.random;const die=()=>1+Math.floor(RND()*6);
const FN=['','Assi','Due','Tre','Quattro','Cinque','Sei'];
const clone=s=>JSON.parse(JSON.stringify(s));
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const alive=s=>s.hands.map((h,i)=>h.length?i:-1).filter(i=>i>=0);
const total=s=>s.hands.reduce((a,h)=>a+h.length,0);
function nextAlive(s,i){for(let k=1;k<=s.n;k++){const j=(i+k)%s.n;if(s.hands[j].length)return j}return i}
function roll(s){for(let i=0;i<s.n;i++)s.hands[i]=s.hands[i].map(die)}
function newGame(n,names,o={}){const s={n,names:names.slice(0,n),cur:0,hands:[],log:[],ev:[],evn:0,over:null,bid:null,pal:null,palUsed:Array(n).fill(false),round:1,phase:'bid',res:null,start:n*5};
 for(let i=0;i<n;i++)s.hands.push(Array.from({length:5},die));
 s.cur=Math.floor(RND()*n);L(s,'Cinque dadi a testa: si parte con '+names[s.cur]);return s}
/* quanti dadi valgono per la dichiarazione f (gli assi sono jolly, tranne nel palifico e quando si dichiarano assi) */
function count(s,f){let c=0;for(const h of s.hands)for(const d of h)if(d===f||(d===1&&f!==1&&s.pal==null))c++;return c}
/* controlla se (q,f) è un rilancio valido sopra la dichiarazione precedente */
function valid(s,q,f){const b=s.bid,tot=total(s);
 if(!Number.isInteger(q)||!Number.isInteger(f)||f<1||f>6)return'Dichiarazione non valida';
 if(q<1)return'Dichiara almeno un dado';if(q>tot)return'Ci sono solo '+tot+' dadi in tavola';
 if(!b)return null;
 if(s.pal!=null){if(f!==b.f)return'Nel palifico non si cambia valore';return q>b.q?null:'Devi dichiarare più dadi di '+b.q}
 if(b.f!==1&&f!==1){return q>b.q||(q===b.q&&f>b.f)?null:'Alza la quantità, o a parità sali di valore'}
 if(b.f!==1&&f===1){const m=Math.ceil(b.q/2);return q>=m?null:'Per gli assi servono almeno '+m+' dadi (metà, per eccesso)'}
 if(b.f===1&&f!==1){const m=b.q*2+1;return q>=m?null:'Dagli assi agli altri valori servono almeno '+m+' dadi (doppio più uno)'}
 return q>b.q?null:'Sugli assi servono più di '+b.q+' dadi'}
/* dichiarazioni valide, per i bot e per l'interfaccia */
function options(s){const out=[],tot=total(s);for(let q=1;q<=tot;q++)for(let f=1;f<=6;f++)if(!valid(s,q,f))out.push({q,f});return out}
function canCalza(s){return !!s.bid&&s.pal==null&&total(s)*2>=s.start}
function reveal(s,kind,loser,gain,c){const bid=s.bid,by=bid.p,ch=s.cur;
 s.res={kind,bid:{...bid},count:c,bidder:by,challenger:ch,loser,gain,pal:s.pal!=null,hands:clone(s.hands)};
 s.ev.push({t:'reveal',kind,count:c});
 let starter;
 if(loser!=null){const h=s.hands[loser];h.pop();s.ev.push({t:'lose',p:loser});
  if(!h.length){L(s,names0(s,loser)+' è eliminato!');s.ev.push({t:'out',p:loser});starter=nextAlive(s,loser)}else starter=loser}
 else{if(gain){if(s.hands[ch].length<5)s.hands[ch].push(1);s.ev.push({t:'gain',p:ch})}starter=ch}
 s.pal=null;
 const a=alive(s);
 if(a.length===1){const w=a[0];s.over={win:w,scores:s.hands.map(h=>h.length),reason:'Ultimo con i dadi'};s.phase='summary';s.cur=w;s.ev.push({t:'end',win:w});return}
 if(loser!=null&&s.hands[loser].length===1&&!s.palUsed[loser]){s.palUsed[loser]=true;s.palNext=true}else s.palNext=false;
 s.cur=starter;s.phase='summary'}
const names0=(s,i)=>s.names[i];
function act(st,a){const s=clone(st);if(s.over)return{err:'Partita finita'};s.ev=[];
 if(s.phase==='summary'){if(a.t!=='next')return{err:'Si riparte con “Prossimo round”'};
  s.round++;roll(s);s.bid=null;s.res=null;s.phase='bid';s.pal=s.palNext?s.cur:null;s.palNext=false;s.ev.push({t:'roll'});
  L(s,'Round '+s.round+(s.pal!=null?' · PALIFICO di '+names0(s,s.pal):'')+' · apre '+names0(s,s.cur));s.evn++;return{s}}
 const me=s.cur;
 if(a.t==='bid'){const q=+a.q,f=+a.f,e=valid(s,q,f);if(e)return{err:e};
  s.bid={q,f,p:me};s.ev.push({t:'bid',p:me,q,f});L(s,names0(s,me)+': '+q+' × '+FN[f]);s.cur=nextAlive(s,me);s.evn++;return{s}}
 if(a.t==='dudo'){if(!s.bid)return{err:'Non c’è ancora nessuna dichiarazione da sfidare'};
  const c=count(s,s.bid.f),ok=c>=s.bid.q;L(s,names0(s,me)+' dice DUDO a '+names0(s,s.bid.p)+': c’erano '+c+' × '+FN[s.bid.f]);
  reveal(s,'dudo',ok?me:s.bid.p,false,c);s.evn++;return{s}}
 if(a.t==='calza'){if(!s.bid)return{err:'Non c’è ancora nessuna dichiarazione'};
  if(s.pal!=null)return{err:'Nel palifico non si può calzare'};if(!canCalza(s))return{err:'Calza si può dire solo con almeno metà dei dadi iniziali in tavola'};
  const c=count(s,s.bid.f),ok=c===s.bid.q;L(s,names0(s,me)+' dice CALZA: c’erano '+c+' × '+FN[s.bid.f]+(ok?' · esatto!':''));
  reveal(s,'calza',ok?null:me,ok,c);s.evn++;return{s}}
 return{err:'Azione sconosciuta'}}
return{newGame,act,setRnd:f=>{RND=f},valid,options,count,total,canCalza,alive,FN}})();
if(typeof module!=='undefined')module.exports=PERU;
