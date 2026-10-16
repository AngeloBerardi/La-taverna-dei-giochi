/* POWER HUNGRY PETS (meccaniche del gioco di carte omonimo, nomi e grafica nostri). 2-6 giocatori.
   21 carte numerate 0-10. Ognuno ha una carta in mano; al proprio turno ne pesca una seconda, ne tiene una e gioca l'altra a faccia in su
   applicandone l'effetto. Il round finisce quando resta un solo giocatore in gioco o quando bisogna pescare e il mazzo è vuoto (vince la carta più alta).
   Stato: hands[p] = carta in mano (null se fuori), drawn = carta appena pescata da cur, played[p] = carte giocate a faccia in su, out[p] = carta rivelata all'eliminazione,
   shield[p], aside = {down, up[]} carte messe da parte, tok[p] gettoni. Fasi: play · dig (carta 6: scegli se scambiare) · trap (carta 2: rimetti la carta in cima dove vuoi) · round (riepilogo) .
   Azioni: play{which:'h'|'d', to?, num?} dig{swap} trap{i} next. */
const PETS=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const COUNTS={10:1,9:1,8:1,7:1,6:1,5:2,4:2,3:3,2:3,1:5,0:1};
const NAMES={10:'Re dei Gatti',9:'Falso Pelo',8:'Scambio Eremita',7:'Giocoliere',6:'Cane Scavatore',5:'Serpente Mago',4:'Guscio Scudo',3:'Coniglio Guerriero',2:'Topo Trappola',1:'Sfera di Cristallo',0:'Aspirapolvere Reale'};
const TARGET={2:3,3:3,4:2,5:2,6:2};
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const alive=s=>s.hands.map((h,i)=>h!=null?i:-1).filter(i=>i>=0);
const nm=(s,i)=>s.names[i];
const nextAlive=(s,i)=>{for(let k=1;k<=s.n;k++){const j=(i+k)%s.n;if(s.hands[j]!=null)return j}return i};
const targets=(s,p,self)=>alive(s).filter(i=>(self||i!==p)&&!s.shield[i]);
function deal(s,first){const deck=[];for(const v in COUNTS)for(let k=0;k<COUNTS[v];k++)deck.push(+v);shuffle(deck);
 s.hands=Array.from({length:s.n},()=>deck.pop());s.played=Array.from({length:s.n},()=>[]);s.out=Array(s.n).fill(null);s.shield=Array(s.n).fill(false);
 const down=deck.pop(),up=s.n===2?[deck.pop(),deck.pop()]:[];s.aside={down,up};s.deck=deck;s.res=null;s.peek=null;s.drawn=null;s.cur=first;startTurn(s,first,true)}
function newGame(n,names,o={}){const s={n,names:names.slice(0,n),tok:Array(n).fill(0),target:TARGET[n],round:1,log:[],ev:[],evn:0,over:null,phase:'play',cur:0};
 const first=Math.floor(RND()*n);deal(s,first);L(s,'Round 1: ogni giocatore ha una carta. Si gioca a chi arriva a '+s.target+' gettoni');return s}
/* inizio turno: toglie lo scudo, pesca; se il mazzo è vuoto il round finisce */
function startTurn(s,p,first){s.cur=p;s.shield[p]=false;s.phase='play';
 if(!s.deck.length){endRound(s,null);return}
 s.drawn=s.deck.shift();s.ev.push({t:'draw',p});if(!first)L(s,'Tocca a '+nm(s,p))}
function eliminate(s,p,why){const c=s.hands[p];s.out[p]=c;s.hands[p]=null;s.shield[p]=false;s.ev.push({t:'out',p,c});L(s,nm(s,p)+' è eliminato'+(why?' ('+why+')':'')+': mostrava '+c+' · '+NAMES[c])}
function beats(a,b){if(a===0&&b===10)return true;if(a===10&&b===0)return false;return a>b}
function endRound(s,winner){let w=winner,reveal=null;
 if(w==null){const al=alive(s);reveal=Object.fromEntries(al.map(i=>[i,s.hands[i]]));const mx=Math.max(...al.map(i=>s.hands[i])),
   top=al.filter(i=>s.hands[i]===mx);let cand=top;
  if(mx===10){const z=al.filter(i=>s.hands[i]===0);if(z.length)cand=z}
  if(cand.length>1){const hi=i=>Math.max(...s.played[i],-1);const m2=Math.max(...cand.map(hi));cand=cand.filter(i=>hi(i)===m2);
   if(cand.length>1){const sm=i=>s.played[i].reduce((a,b)=>a+b,0);const m3=Math.max(...cand.map(sm));cand=cand.filter(i=>sm(i)===m3)}}
  winners_(s,cand,reveal);return}
 winners_(s,[w],null)}
function winners_(s,ws,reveal){ws.forEach(w=>s.tok[w]++);s.res={win:ws,reveal,hands:s.hands.slice(),out:s.out.slice()};s.phase='round';s.cur=ws[0];s.drawn=null;s.peek=null;s.ev.push({t:'round',win:ws});
 L(s,ws.map(w=>nm(s,w)).join(' e ')+(ws.length>1?' pareggiano e prendono':' prende')+' un gettone'+(reveal?' (carte più alte a fine mazzo)':' (ultimo in gioco)'));
 const done=s.tok.some(t=>t>=s.target);if(done){const m=Math.max(...s.tok),wn=s.tok.map((t,i)=>t===m?i:-1).filter(i=>i>=0);s.over={win:wn[0],wins:wn,scores:s.tok.slice(),reason:'Primo a '+s.target+' gettoni'}}}
function afterTurn(s){const al=alive(s);if(al.length<=1){endRound(s,al[0]);return}startTurn(s,nextAlive(s,s.cur))}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];const p=s.cur;let r;
 if(s.phase==='round'){if(a.t!=='next')return fail('Passa al round successivo');s.round++;s.log=s.log.slice(-3);deal(s,s.res.win[0]);L(s,'Round '+s.round);s.evn++;return{s}}
 if(s.phase==='dig'){if(a.t!=='dig')return fail('Scegli se scambiare');if(a.swap){const t=s.hands[p];s.hands[p]=s.aside.down;s.aside.down=t;L(s,nm(s,p)+' scambia la sua carta con quella messa da parte')}else L(s,nm(s,p)+' lascia le cose come stanno');
  s.peek=null;s.ev.push({t:'dig',p});afterTurn(s);s.evn++;return{s}}
 if(s.phase==='trap'){if(a.t!=='trap')return fail('Rimetti la carta nel mazzo');const i=+a.i,d=s.deck;if(!Number.isInteger(i)||i<0||i>d.length)return fail('Posizione non valida');
  d.splice(i,0,s.peek.card);s.peek=null;s.ev.push({t:'trap',p});L(s,nm(s,p)+' rimette la carta nel mazzo');afterTurn(s);s.evn++;return{s}}
 if(a.t!=='play')return fail('Azione non valida adesso');
 const which=a.which==='d'?'d':'h',card=which==='d'?s.drawn:s.hands[p],keep=which==='d'?s.hands[p]:s.drawn;
 if(card==null)return fail('Carta non valida');
 const T=a.to!=null?+a.to:null,ok=(self)=>T!=null&&Number.isInteger(T)&&s.hands[T]!=null&&(self||T!==p)&&!s.shield[T];
 const need=[1,3,5,8].includes(card),tg=targets(s,p,card===5);
 if(need&&tg.length&&!ok(card===5))return fail('Scegli un giocatore valido (non protetto)');
 if(card===1&&tg.length&&!(Number.isInteger(+a.num)&&+a.num>=0&&+a.num<=10&&+a.num!==1))return fail('Nomina un numero diverso da 1');
 s.hands[p]=keep;s.drawn=null;s.played[p].push(card);s.ev.push({t:'play',p,c:card});L(s,nm(s,p)+' gioca '+card+' · '+NAMES[card]);
 switch(card){
 case 10:eliminate(s,p,'ha giocato il Re dei Gatti');break;
 case 9:{const h=alive(s).find(i=>s.hands[i]===10);if(h!=null&&h!==p&&!s.shield[h]){[s.hands[h],s.hands[p]]=[s.hands[p],s.hands[h]];s.ev.push({t:'swap',p,q:h});L(s,nm(s,p)+' costringe '+nm(s,h)+' a scambiare la carta')}else L(s,'Nessun effetto');break}
 case 8:if(!tg.length)L(s,'Nessun bersaglio: nessun effetto');else{[s.hands[T],s.hands[p]]=[s.hands[p],s.hands[T]];s.ev.push({t:'swap',p,q:T});L(s,nm(s,p)+' scambia la carta con '+nm(s,T))}break;
 case 7:{const al=alive(s).filter(i=>!s.shield[i]||i===p);al.forEach(i=>{s.deck.push(s.hands[i])});shuffle(s.deck);al.forEach(i=>{s.hands[i]=s.deck.shift()});s.ev.push({t:'shuffle'});L(s,'Tutti rimettono la carta nel mazzo e ne ricevono una nuova');break}
 case 6:if(s.aside.down==null)L(s,'Non c’è più la carta da parte');else{s.phase='dig';s.peek={p,card:s.aside.down};s.evn++;return{s}}break;
 case 5:{if(!tg.length)L(s,'Nessun bersaglio: nessun effetto');else{const c=s.hands[T];s.played[T].push(c);s.ev.push({t:'forced',p:T,c});L(s,nm(s,T)+' è costretto a giocare '+c+' · '+NAMES[c]+' senza effetto');
   if(c===10){s.hands[T]=null;s.shield[T]=false;s.ev.push({t:'out',p:T,c:null});L(s,nm(s,T)+' è eliminato (costretto a giocare il Re dei Gatti)')}else{let n;if(s.deck.length)n=s.deck.shift();else{n=s.aside.down;s.aside.down=null}s.hands[T]=n}}break}
 case 4:s.shield[p]=true;L(s,nm(s,p)+' si protegge fino al prossimo turno');break;
 case 3:if(!tg.length)L(s,'Nessun bersaglio: nessun effetto');else{const x=s.hands[p],y=s.hands[T];s.ev.push({t:'duel',p,q:T});
   if(x===y)L(s,nm(s,p)+' e '+nm(s,T)+' hanno la stessa carta: nessuno esce');else if(x<y)eliminate(s,p,'perde il confronto con '+nm(s,T));else eliminate(s,T,'perde il confronto con '+nm(s,p))}break;
 case 2:if(!s.deck.length)L(s,'Il mazzo è vuoto');else{const c=s.deck.shift();s.phase='trap';s.peek={p,card:c};s.evn++;return{s}}break;
 case 1:if(!tg.length)L(s,'Nessun bersaglio: nessun effetto');else{const n=+a.num;if(s.hands[T]===n){eliminate(s,T,'indovinato da '+nm(s,p));s.ev.push({t:'guess',p,q:T,ok:true})}else{s.ev.push({t:'guess',p,q:T,ok:false});L(s,nm(s,p)+' prova con '+n+' su '+nm(s,T)+': sbagliato')}}break;
 case 0:break}
 afterTurn(s);s.evn++;return{s}}
return{newGame,act,setRnd:f=>{RND=f},NAMES,COUNTS,TARGET,alive,targets,beats}})();
if(typeof module!=='undefined')module.exports=PETS;
