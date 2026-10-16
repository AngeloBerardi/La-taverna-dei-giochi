/* GATTINI ESPLOSIVI (regole del gioco di carte “Exploding Kittens”, testi e grafica nostri). 2-10 giocatori (oltre 5 si mescolano due mazzi). Edizione opzionale “Implosione”: Gattino Implodente, Inverti, Pesca dal fondo, Gatto Randagio, Altera il futuro, Attacco mirato.
   Si gioca tutte le carte che si vuole, poi si pesca per chiudere il turno: chi pesca un Micio Bomba salta in aria, a meno che abbia un Disinnesco.
   Carte: bomb · defuse · nope (Niet) · attack · skip · favor · shuffle · future · cat1..cat5. Ogni carta ha un id unico "tipo#n".
   Stato: cur = chi deve agire adesso, turner = di chi è il turno, turns = turni ancora dovuti da turner.
   phase: 'play' (agisce turner) · 'nope' (finestra di Niet: agisce chi ne ha uno) · 'favor' (chi riceve la richiesta sceglie cosa dare) · 'insert' (turner rimette la bomba nel mazzo). */
const KITT=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const T=id=>id.split('#')[0];
const NAMES={bomb:'Micio Bomba',defuse:'Disinnesco',nope:'Niet',attack:'Attacco',skip:'Salta',favor:'Favore',shuffle:'Mescola',future:'Preveggenza',cat1:'Gatto Pigiama',cat2:'Gatto Mago',cat3:'Gatto Pirata',cat4:'Gatto Cuoco',cat5:'Gatto Astronauta',imp:'Gattino Implodente',reverse:'Inverti',bottom:'Pesca dal fondo',feral:'Gatto Randagio',alter:'Altera il futuro',tattack:'Attacco mirato'};
const CATS=['cat1','cat2','cat3','cat4','cat5'],BASE_ACT=['attack','skip','favor','shuffle','future'],EXTRA=['reverse','bottom','alter','tattack'],ACTIONS=[...BASE_ACT,...EXTRA];
const IMPC={reverse:4,bottom:4,feral:4,alter:4,tattack:3};
const COUNT={nope:5,attack:4,skip:4,favor:4,shuffle:4,future:5,cat1:4,cat2:4,cat3:4,cat4:4,cat5:4};
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const isCat=c=>T(c).startsWith('cat')||T(c)==='feral';
const alive=s=>s.alive.map((a,i)=>a?i:-1).filter(i=>i>=0);
function nextAlive(s,i){const d=s.dir||1;for(let k=1;k<=s.n;k++){const j=((i+k*d)%s.n+s.n)%s.n;if(s.alive[j])return j}return i}
function newGame(n,names,o={}){const base=[],imp=o.edi==='imp',mult=n>5?2:1,cnt={...COUNT,...(imp?IMPC:{})};for(const t in cnt)for(let k=1;k<=cnt[t]*mult;k++)base.push(t+'#'+k);shuffle(base);
 const hands=[];for(let i=0;i<n;i++){hands.push(['defuse#'+(i+1),...base.splice(0,7)])}
 const deck=base;const extraDef=n<=3?2:6-n;for(let k=0;k<extraDef;k++)deck.push('defuse#'+(n+1+k));
 for(let k=1;k<=n-1;k++)deck.push('bomb#'+k);if(imp)deck.push('imp#1');shuffle(deck);
 const s={n,edi:imp?'imp':'base',dir:1,impUp:false,names:names.slice(0,n),hands,cur:0,turner:0,turns:1,deck,discard:[],alive:Array(n).fill(true),phase:'play',pend:null,peek:null,log:[],ev:[],evn:0,over:null};
 s.cur=s.turner=Math.floor(RND()*n);L(s,'Otto carte a testa, una è un Disinnesco. Attenti ai mici: '+(n-1)+' bombe nel mazzo'+(imp?' e un Gattino Implodente':''));return s}
const nm=(s,i)=>s.names[i];
function discard(s,p,c){const h=s.hands[p],i=h.indexOf(c);if(i<0)return false;h.splice(i,1);s.discard.push(c);return true}
/* chi può rispondere con un Niet: chi ne ha uno, in ordine di tavolo a partire da dopo "from", escluso "excl" */
function nopeQueue(s,from,excl){const q=[];for(let k=1;k<=s.n;k++){const j=(from+k)%s.n;if(j!==excl&&s.alive[j]&&s.hands[j].some(c=>T(c)==='nope'))q.push(j)}return q}
function toPlay(s){s.phase='play';s.pend=null;s.cur=s.turner}
function eliminate(s,p){s.discard.push(...s.hands[p]);s.hands[p]=[];s.alive[p]=false;s.ev.push({t:'out',p});L(s,nm(s,p)+' salta in aria!');
 const a=alive(s);if(a.length===1){s.over={win:a[0],scores:s.hands.map(h=>h.length),reason:'Ultimo gatto in piedi'};s.phase='play';s.cur=a[0];s.pend=null;return true}return false}
/* chiude un turno (pescato o saltato): se non restano turni, tocca al giocatore dopo */
function endTurn(s){s.turns--;s.peek=null;if(s.turns<=0){s.turner=nextAlive(s,s.turner);s.turns=1}toPlay(s)}
function drawCard(s,bottom){const me=s.turner;s.peek=null;const c=bottom?s.deck.pop():s.deck.shift();
 if(T(c)==='imp'){s.ev.push({t:'bomb',p:me});
  if(!s.impUp){s.impUp=true;L(s,nm(s,me)+' pesca il Gattino Implodente: lo rimette nel mazzo a faccia in su!');s.phase='insert';s.pend={k:'insert',bomb:c,imp:true};s.cur=me;return}
  s.discard.push(c);if(eliminate(s,me))return;s.turns=1;s.turner=nextAlive(s,me);toPlay(s);return}
 if(T(c)==='bomb'){s.ev.push({t:'bomb',p:me});
  const d=s.hands[me].find(x=>T(x)==='defuse');
  if(d){discard(s,me,d);s.ev.push({t:'defuse',p:me});L(s,nm(s,me)+' pesca un Micio Bomba e lo disinnesca!');s.phase='insert';s.pend={k:'insert',bomb:c};s.cur=me;return}
  s.discard.push(c);if(eliminate(s,me))return;s.turns=1;s.turner=nextAlive(s,me);toPlay(s);return}
 s.hands[me].push(c);s.ev.push({t:'draw',p:me});L(s,nm(s,me)+(bottom?' pesca dal fondo del mazzo':' pesca una carta'));endTurn(s)}
function apply(s,eff){const me=s.turner;
 switch(eff.k){
 case'attack':{const t=s.turns,nx=nextAlive(s,me);s.peek=null;s.turner=nx;s.turns=t>1?t+2:2;s.ev.push({t:'attack',p:me,to:nx});L(s,nm(s,me)+' attacca: '+nm(s,nx)+' dovrà fare '+s.turns+' turni');toPlay(s);return}
case'reverse':s.dir=-(s.dir||1);s.ev.push({t:'reverse',p:me});L(s,nm(s,me)+' inverte il giro e chiude il turno senza pescare');endTurn(s);return;
 case'bottom':L(s,nm(s,me)+' pesca dal fondo');drawCard(s,true);return;
 case'alter':s.peek={p:me,cards:s.deck.slice(0,3)};s.phase='alter';s.pend={k:'alter'};s.cur=me;s.ev.push({t:'future',p:me});L(s,nm(s,me)+' altera il futuro del mazzo');return;
 case'tattack':{const t=s.turns,nx=eff.to;s.peek=null;s.turner=nx;s.turns=t>1?t+2:2;s.ev.push({t:'attack',p:me,to:nx});L(s,nm(s,me)+' attacca '+nm(s,nx)+': dovrà fare '+s.turns+' turni');toPlay(s);return}
 case'skip':s.ev.push({t:'skip',p:me});L(s,nm(s,me)+' salta il turno senza pescare');endTurn(s);return;
 case'shuffle':shuffle(s.deck);s.ev.push({t:'shuffle'});L(s,nm(s,me)+' mescola il mazzo');toPlay(s);return;
 case'future':s.peek={p:me,cards:s.deck.slice(0,3)};s.ev.push({t:'future',p:me});L(s,nm(s,me)+' guarda le prime carte del mazzo');toPlay(s);return;
 case'favor':if(!s.hands[eff.to].length){L(s,nm(s,eff.to)+' non ha carte da dare');toPlay(s);return}
  s.phase='favor';s.pend={k:'favor',from:me,to:eff.to};s.cur=eff.to;L(s,nm(s,me)+' chiede un favore a '+nm(s,eff.to));return;
 case'pair':{const h=s.hands[eff.to];if(!h.length){L(s,nm(s,eff.to)+' non ha carte');toPlay(s);return}
  const c=h.splice(Math.floor(RND()*h.length),1)[0];s.hands[me].push(c);s.ev.push({t:'steal',p:me,from:eff.to,c});L(s,nm(s,me)+' ruba una carta a '+nm(s,eff.to));toPlay(s);return}
 case'triple':{const h=s.hands[eff.to],i=h.findIndex(c=>T(c)===eff.name);
  if(i<0){s.ev.push({t:'miss',p:me,from:eff.to});L(s,nm(s,eff.to)+' non ha “'+NAMES[eff.name]+'”');toPlay(s);return}
  const c=h.splice(i,1)[0];s.hands[me].push(c);s.ev.push({t:'steal',p:me,from:eff.to,c});L(s,nm(s,me)+' si fa dare '+NAMES[eff.name]+' da '+nm(s,eff.to));toPlay(s);return}}}
/* apre la finestra dei Niet sulla carta appena giocata */
function openNope(s,eff,cards){const me=s.turner,q=nopeQueue(s,me,-1);
 s.ev.push({t:'play',p:me,cards});
 if(!q.length){apply(s,eff);return}
 s.phase='nope';s.pend={k:'nope',eff,by:me,n:0,q,cards};s.cur=q[0]}
function act(st,a){const s=clone(st);if(s.over)return{err:'Partita finita'};s.ev=[];const me=s.cur;
 if(s.phase==='nope'){const p=s.pend;
  if(a.t==='nope'){const c=s.hands[me].find(x=>T(x)==='nope');if(!c)return{err:'Non hai un Niet'};discard(s,me,c);p.n++;s.ev.push({t:'nope',p:me});L(s,nm(s,me)+' dice NIET!');
   p.q=nopeQueue(s,me,me);if(!p.q.length){fin(s,p);s.evn++;return{s}}s.cur=p.q[0];s.evn++;return{s}}
  if(a.t==='pass'){p.q.shift();if(!p.q.length){fin(s,p);s.evn++;return{s}}s.cur=p.q[0];s.evn++;return{s}}
  return{err:'Rispondi con Niet o passa'}}
 if(s.phase==='favor'){if(a.t!=='give')return{err:'Scegli una carta da dare'};const p=s.pend;if(!s.hands[me].includes(a.c))return{err:'Carta non valida'};
  const h=s.hands[me];h.splice(h.indexOf(a.c),1);s.hands[p.from].push(a.c);s.ev.push({t:'give',p:me,to:p.from});L(s,nm(s,me)+' dà una carta a '+nm(s,p.from));toPlay(s);s.evn++;return{s}}
 if(s.phase==='alter'){if(a.t!=='alter')return{err:'Riordina le carte'};const o=a.order,k=Math.min(3,s.deck.length);if(!Array.isArray(o)||o.length!==k||[...o].sort().join()!==Array.from({length:k},(_,i)=>i).join())return{err:'Ordine non valido'};
  const top=s.deck.slice(0,k);o.forEach((x,i)=>{s.deck[i]=top[x]});s.peek=null;L(s,nm(s,me)+' rimette le carte in ordine');toPlay(s);s.evn++;return{s}}
 if(s.phase==='insert'){if(a.t!=='insert')return{err:'Rimetti la bomba nel mazzo'};const i=+a.i;if(!Number.isInteger(i)||i<0||i>s.deck.length)return{err:'Posizione non valida'};
  s.deck.splice(i,0,s.pend.bomb);s.ev.push({t:'insert',p:me});L(s,nm(s,me)+' rimette la bomba nel mazzo');endTurn(s);s.evn++;return{s}}
 /* fase di gioco */
 if(a.t==='draw'){drawCard(s);s.evn++;return{s}}
 if(a.t==='play'){const c=a.c;if(!s.hands[me].includes(c))return{err:'Non hai quella carta'};const k=T(c);
  if(!ACTIONS.includes(k)||(EXTRA.includes(k)&&s.edi!=='imp'))return{err:k==='nope'?'Il Niet si gioca in risposta a un’altra carta':k==='defuse'?'Il Disinnesco si usa da solo quando peschi una bomba':'Le carte gatto si giocano in coppia o tris'};
  let eff={k};if(k==='tattack'){const to=+a.to;if(!(to!==me&&s.alive[to]))return{err:'Scegli un altro giocatore'};eff.to=to}
  if(k==='favor'){const to=+a.to;if(!(to!==me&&s.alive[to]))return{err:'Scegli un altro giocatore'};if(!s.hands[to].length)return{err:nm(s,to)+' non ha carte'};eff.to=to}
  discard(s,me,c);L(s,nm(s,me)+' gioca '+NAMES[k]);openNope(s,eff,[c]);s.evn++;return{s}}
 if(a.t==='combo'){const cs=a.cs;if(!Array.isArray(cs)||(cs.length!==2&&cs.length!==3)||new Set(cs).size!==cs.length)return{err:'Servono 2 o 3 carte gatto uguali'};
  const ty=[...new Set(cs.map(T).filter(x=>x!=='feral'))];if(!cs.every(c=>s.hands[me].includes(c)&&isCat(c))||ty.length>1)return{err:'Servono 2 o 3 carte gatto uguali (il Randagio vale per qualsiasi gatto)'};
  const to=+a.to;if(!(to!==me&&s.alive[to]))return{err:'Scegli un altro giocatore'};if(!s.hands[to].length)return{err:nm(s,to)+' non ha carte'};
  let eff;if(cs.length===2)eff={k:'pair',to};else{if(!NAMES[a.name]||a.name==='bomb')return{err:'Nomina una carta da chiedere'};eff={k:'triple',to,name:a.name}}
  cs.forEach(c=>discard(s,me,c));L(s,nm(s,me)+' gioca '+cs.length+' gatti uguali contro '+nm(s,to));openNope(s,eff,cs.slice());s.evn++;return{s}}
 return{err:'Azione non valida adesso'}}
function fin(s,p){const t=p.n%2===0;s.ev.push({t:'resolve',ok:t});if(t)apply(s,p.eff);else{L(s,'L’effetto è annullato dal Niet');toPlay(s)}}
return{newGame,act,setRnd:f=>{RND=f},T,NAMES,CATS,ACTIONS,BASE_ACT,EXTRA,isCat,alive}})();
if(typeof module!=='undefined')module.exports=KITT;
