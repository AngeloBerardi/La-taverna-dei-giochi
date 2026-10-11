/* THE MIND / THE MIND EXTREME – cooperativo (2-4). Gioco in tempo reale: non esiste un turno, qualunque giocatore può giocare in qualsiasi momento (s.sim=true).
   Base: carte 1-100, un'unica pila crescente. Extreme: 50 carte bianche (pila crescente 1→50) e 50 rosse (pila decrescente 50→1); dal livello 3 alcune carte si giocano coperte
   e gli errori si scoprono a fine livello. Fasi: ready (mano sul tavolo) → play → (starvote) → summary (livello finito) → ready…  Le carte di un giocatore si giocano sempre dalla più bassa (bianche)
   o dalla più alta (rosse). Errore = una carta giocata mentre qualcuno ne ha una che andava prima: -1 vita e le carte "saltate" vengono scartate scoperte. */
const MIND=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const MAXL={2:12,3:10,4:8},START={2:2,3:3,4:4};
const REW={2:'star',3:'life',5:'star',6:'life',8:'star',9:'life'};      // premi di fine livello (come The Mind)
const BLIND={3:'w',5:'r',6:'wr',8:'w',9:'r',10:'wr',11:'w',12:'r'};       // livelli coperti in Extreme: bianche, rosse, entrambe
const cap={life:5,star:3};
const col=c=>typeof c==='number'?'n':c[0],num=c=>typeof c==='number'?c:+c.slice(1);
const E=(s,o)=>s.ev.push(o);const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};
const nm=(s,p)=>s.names[p];
function sortHand(h,x){return h.slice().sort((a,b)=>x?(col(a)===col(b)?(col(a)==='w'?num(a)-num(b):num(b)-num(a)):(col(a)==='w'?-1:1)):a-b)}
const deckOf=x=>x?[...Array.from({length:50},(_,i)=>'w'+(i+1)),...Array.from({length:50},(_,i)=>'r'+(i+1))]:Array.from({length:100},(_,i)=>i+1);
function deal(s){const d=shuffle(deckOf(s.x));s.hands=Array.from({length:s.n},()=>[]);for(let k=0;k<s.level;k++)for(let p=0;p<s.n;p++)s.hands[p].push(d.pop());s.hands=s.hands.map(h=>sortHand(h,s.x));
 s.wp=[];s.rp=[];s.burn=[];s.ready=Array(s.n).fill(false);s.star=null;s.res=null;s.blind=s.x?(BLIND[s.level]||''):'';s.phase='ready'}
function newGame(n,names,o={}){const s={n,names:names.slice(),x:!!o.x,sim:true,level:1,maxLevel:MAXL[n],lives:START[n],stars:1,cur:-1,log:[],ev:[],evn:0,over:null,hands:[],phase:'ready',mx:0};deal(s);L(s,'Livello 1: appoggiate la mano sul tavolo');return s}
const empty=s=>s.hands.every(h=>!h.length);
function lowest(s,p,c){const h=s.hands[p];if(!h.length)return null;if(!s.x)return h[0];if(c==='w')return h.find(k=>col(k)==='w')||null;if(c==='r')return h.find(k=>col(k)==='r')||null;return null}
/* carte che "andavano prima" di c (stesso colore) nelle mani di tutti */
function earlier(s,c){const k=col(c),v=num(c),out=[];s.hands.forEach((h,p)=>h.forEach(x=>{if(col(x)!==k)return;if(k==='r'?num(x)>v:num(x)<v)out.push([p,x])}));if(k==='n')return out;return out}
const isBlind=(s,c)=>s.x&&s.blind.includes(col(c));
function loseLife(s,why){s.lives--;E(s,{t:'life',n:s.lives});L(s,why);if(s.lives<=0){s.phase='summary';s.over={win:false,scores:[s.level-1],reason:'Le vite sono finite al livello '+s.level,lvl:s.level}}}
function finishLevel(s){ // tutte le mani vuote: eventuale rivelazione dei coperti, poi premio
 if(s.x&&s.blind){const bad=[];for(const k of ['w','r']){if(!s.blind.includes(k))continue;const seq=(k==='w'?s.wp:s.rp).slice(),gone=new Set();seq.forEach((e,i)=>{if(gone.has(i))return;const v=num(e.c);seq.forEach((f,j)=>{if(j>i&&!gone.has(j)&&(k==='w'?num(f.c)<v:num(f.c)>v)){gone.add(j)}});if(seq.slice(i+1).some((f,j)=>gone.has(i+1+j)))bad.push(e)})}
  s.res={blindErr:bad.map(e=>({p:e.p,c:e.c}))};s.blindN=bad.length;for(const e of bad){if(s.over)break;loseLife(s,'Errore a carte coperte: '+nm(s,e.p)+' ha giocato troppo presto il '+num(e.c)+' ('+(col(e.c)==='w'?'bianca':'rossa')+')')}
  s.wp.forEach(e=>e.h=false);s.rp.forEach(e=>e.h=false);if(s.over)return}
 const r=REW[s.level],g=[];if(r==='life'&&s.lives<cap.life){s.lives++;g.push('life')}if(r==='star'&&s.stars<cap.star){s.stars++;g.push('star')}
 s.res={...(s.res||{}),lvl:s.level,reward:g,blindErr:(s.res&&s.res.blindErr)||[]};E(s,{t:'done',lvl:s.level,reward:g});L(s,'Livello '+s.level+' completato'+(g.length?' · premio: '+(g[0]==='life'?'+1 vita':'+1 shuriken'):''));
 s.phase='summary';if(s.level>=s.maxLevel){s.over={win:true,scores:[s.level],lvl:s.level}}}
function act(st,a){const s=JSON.parse(JSON.stringify(st));if(s.over&&a.t!=='x')return{err:'Partita finita'};s.ev=[];const ok=()=>{s.evn++;return{s}};
 const p=a.seat;
 if(a.t==='ready'){if(s.phase!=='ready')return{err:'Non serve'};if(!(p>=0&&p<s.n))return{err:'Posto non valido'};s.ready[p]=true;E(s,{t:'ready',p});if(s.ready.every(Boolean)){s.phase='play';E(s,{t:'go'});L(s,'Via!')}return ok()}
 if(a.t==='unready'){if(s.phase!=='ready')return{err:'Non serve'};s.ready[p]=false;return ok()}
 if(a.t==='stop'){if(s.phase!=='play')return{err:'Non puoi fermare adesso'};s.phase='ready';s.ready=Array(s.n).fill(false);E(s,{t:'stop',p});L(s,nm(s,p)+' dice STOP: ricalibratevi');return ok()}
 if(a.t==='next'){if(s.phase!=='summary'||s.over)return{err:'Non serve'};s.level++;s.mx=Math.max(s.mx,s.level);deal(s);E(s,{t:'level',lvl:s.level});L(s,'Livello '+s.level+(s.blind?' (carte coperte: '+(s.blind==='wr'?'tutte':s.blind==='w'?'bianche':'rosse')+')':''));return ok()}
 if(a.t==='star'){if(s.phase!=='play')return{err:'Lo shuriken si propone durante il gioco'};if(s.stars<=0)return{err:'Non avete shuriken'};s.phase='starvote';s.star={by:p,v:Array(s.n).fill(null)};s.star.v[p]=a.pick||(s.x?'w':'n');E(s,{t:'starq',p});L(s,nm(s,p)+' propone di usare uno shuriken');return ok()}
 if(a.t==='starvote'){if(s.phase!=='starvote')return{err:'Nessuna proposta'};if(!(p>=0&&p<s.n))return{err:'Posto non valido'};
  if(a.yes===false){s.phase='ready';s.ready=Array(s.n).fill(false);s.star=null;E(s,{t:'starno',p});L(s,nm(s,p)+' rifiuta lo shuriken');return ok()}
  s.star.v[p]=a.pick||(s.x?'w':'n');
  if(s.star.v.every(v=>v)){const out=[];s.hands.forEach((h,q)=>{const c=lowest(s,q,s.x?s.star.v[q]:'n')||lowest(s,q,s.x?(s.star.v[q]==='w'?'r':'w'):'n');if(c!=null){s.hands[q]=h.filter(x=>x!==c);out.push({p:q,c});s.burn.push({p:q,c})}});
   s.stars--;s.star=null;E(s,{t:'star',cards:out});L(s,'Shuriken: scartate '+out.map(o=>(typeof o.c==='number'?o.c:num(o.c))).join(', '));
   if(empty(s)){finishLevel(s);return ok()}s.phase='ready';s.ready=Array(s.n).fill(false)}
  return ok()}
 if(a.t==='play'){if(s.phase!=='play')return{err:'Aspettate che tutti siano pronti'};if(!(p>=0&&p<s.n))return{err:'Posto non valido'};
  const c=lowest(s,p,a.col||(s.x?null:'n'));if(c==null)return{err:'Nessuna carta da giocare'};
  const k=col(c),blind=isBlind(s,c),pile=k==='r'?s.rp:s.wp;
  s.hands[p]=s.hands[p].filter(x=>x!==c);pile.push({c,p,h:blind});E(s,{t:'play',p,c,blind});
  if(!blind){const ea=earlier(s,c);if(ea.length){const ids=ea.map(e=>e[1]);ea.forEach(([q,x])=>{s.hands[q]=s.hands[q].filter(y=>y!==x);s.burn.push({p:q,c:x})});E(s,{t:'err',p,c,lower:ea.map(e=>({p:e[0],c:e[1]}))});
    loseLife(s,'Errore! '+nm(s,p)+' gioca '+num(c)+' ma c’erano carte prima: '+ids.map(num).join(', '));if(s.over)return ok()}}
  if(empty(s)){finishLevel(s);return ok()}
  if(!s.over&&s.ev.some(e=>e.t==='err')){s.phase='ready';s.ready=Array(s.n).fill(false)}
  return ok()}
 return{err:'Azione sconosciuta'}}
return{newGame,act,setRnd:f=>{RND=f},num,col,lowest,sortHand,MAXL,REW,BLIND,deckOf}})();
if(typeof module!=='undefined')module.exports=MIND;
