/* BEHIND THE THRONE (meccaniche del gioco di carte omonimo, nomi e grafica nostri). 2-4 giocatori.
   Si pescano carte una alla volta in fila (fino a 5): ogni carta dev'essere più bassa della precedente, altrimenti la fila salta.
   Si raccolgono mazzetti per personaggio (max 5 mazzetti da 5 carte); chi ha il mazzetto più grosso di un tipo ne usa il potere.
   A fine partita ogni mazzetto con almeno 2 carte vale il valore della carta.
   Valori: Re 9, Regina 8, Giullare 6, Giudice 5 (confermati); Generale 7, Assassino 4, Profeta 3, Menestrello 2, Alchimista 1 sono una nostra assunzione (VAL).
   Regole non specificate e scelte nostre: la carta precedente si confronta col valore stampato; si rivela almeno una carta prima di fermarsi; si può distruggere solo dai mazzetti.
   Stato: deck, discard, row (tipi), mod (somma delle modifiche all'ultima carta), used[p] (poteri già usati nel turno), phase: turn · overflow (scegli cosa scartare) · end.
   Azioni: reveal · use{k,d?,via?} · destroy{p,type} · collect · swap{to,take} · giveup · drop{type}. */
const THRONE=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const TYPES=['king','queen','general','jester','judge','assassin','prophet','minstrel','alchemist'];
const VAL={king:9,queen:8,general:7,jester:6,judge:5,assassin:4,prophet:3,minstrel:2,alchemist:1};
const NAMES={king:'Re',queen:'Regina',general:'Generale',jester:'Giullare',judge:'Giudice',assassin:'Assassino',prophet:'Profeta',minstrel:'Menestrello',alchemist:'Alchimista',END:'Fine del regno'};
const MANIP=['prophet','general','assassin','jester','judge'],RED={general:3,assassin:2};
const COPIES={2:5,3:7,4:9};
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const nm=(s,i)=>s.names[i];
const cnt=(s,p,t)=>s.stacks[p][t]||0;
const largest=(s,p,t)=>{const c=cnt(s,p,t);return c>0&&s.stacks.every(st=>(st[t]||0)<=c)};
const avail=(s,p,t)=>largest(s,p,t)&&!s.used[p][t];
const nstacks=(s,p)=>Object.keys(s.stacks[p]).length;
function newGame(n,names,o={}){const k=COPIES[n]||9,deck=[];for(const t of TYPES)for(let i=0;i<k;i++)deck.push(t);shuffle(deck);
 const s={n,names:names.slice(0,n),deck,discard:['END'],stacks:Array.from({length:n},()=>({})),used:Array.from({length:n},()=>({})),row:[],mod:0,destroyed:false,hit:[],peek:null,cur:Math.floor(RND()*n),phase:'turn',pend:null,log:[],ev:[],evn:0,over:null};
 L(s,'Si parte: pesca fino a cinque carte, sempre più basse della precedente');return s}
function draw(s){if(!s.deck.length){s.deck=shuffle(s.discard);s.discard=[];s.ev.push({t:'reshuffle'});L(s,'Mazzo finito: si rimescolano gli scarti (con la carta Fine del regno)')}return s.deck.shift()}
const prevVal=s=>s.row.length>1?VAL[s.row[s.row.length-2]]:null;
const curVal=s=>s.row.length?VAL[s.row[s.row.length-1]]+s.mod:null;
/* 'bust' se più alta della precedente, 'eq' se uguale, 'ok' altrimenti */
function status(s){const p=prevVal(s);if(p==null||!s.row.length)return'ok';const c=curVal(s);return c>p?'bust':c===p?'eq':'ok'}
/* quanto si può ancora abbassare l'ultima carta con i poteri disponibili */
function maxReduce(s,p){let r=0;const free=['general','assassin','jester'].filter(k=>avail(s,p,k));free.forEach(k=>{r+=k==='jester'?1:RED[k]});
 if(avail(s,p,'judge')){const used=['general','assassin','jester'].filter(k=>largest(s,p,k)&&s.used[p][k]);if(used.length)r+=Math.max(...used.map(k=>k==='jester'?1:RED[k]))}return r}
function score(s,p){let v=0;for(const t in s.stacks[p])if(s.stacks[p][t]>1)v+=VAL[t];return v}
function finish(s){const sc=s.names.map((_,i)=>score(s,i)),m=Math.max(...sc),w=sc.map((v,i)=>v===m?i:-1).filter(i=>i>=0);
 s.over={win:w[0],wins:w,scores:sc,reason:'Carta Fine del regno'};s.ev.push({t:'end'});L(s,'È uscita la Fine del regno: si contano i punti')}
function endTurn(s){const p=s.cur;for(const t of TYPES)if(largest(s,p,t))s.used[p][t]=false;s.discard.push(...s.row);s.row=[];s.mod=0;s.destroyed=false;s.hit=[];s.peek=null;s.pend=null;s.phase='turn';s.cur=(p+1)%s.n;s.ev.push({t:'turn',p:s.cur});L(s,'Tocca a '+nm(s,s.cur))}
/* mette carte (tipi) nei mazzetti di p; restituisce i gruppi che richiedono una scelta */
function collect(s,p,cards){const st=s.stacks[p],need=[],by={};cards.forEach(t=>by[t]=(by[t]||0)+1);
 for(const t in by){let c=by[t];if(st[t]){const room=5-st[t],add=Math.min(room,c);st[t]+=add;for(let i=add;i<c;i++)s.discard.push(t);continue}
  if(nstacks(s,p)<5){const add=Math.min(5,c);st[t]=add;for(let i=add;i<c;i++)s.discard.push(t);continue}
  need.push({type:t,count:c})}return need}
function resolveOverflow(s,p,need,after){if(!need.length){after();return}s.phase='overflow';s.pend={p,need,after:after===endTurn?'end':'none'};s.cur=p}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];const p=s.cur;let r=run(s,a,p);if(r&&r.err)return r;s.evn++;return{s}}
function run(s,a,p){
 if(s.phase==='overflow'){if(a.t!=='drop')return fail('Scegli cosa scartare');const q=s.pend.need[0],t=a.type;
  if(t!==q.type&&!s.stacks[p][t])return fail('Scelta non valida');
  if(t===q.type){for(let i=0;i<q.count;i++)s.discard.push(t);L(s,nm(s,p)+' scarta le carte appena prese ('+NAMES[t]+')')}
  else{for(let i=0;i<s.stacks[p][t];i++)s.discard.push(t);delete s.stacks[p][t];const add=Math.min(5,q.count);s.stacks[p][q.type]=add;for(let i=add;i<q.count;i++)s.discard.push(q.type);L(s,nm(s,p)+' scarta il mazzetto di '+NAMES[t]+' per fare posto a '+NAMES[q.type])}
  s.pend.need.shift();if(s.pend.need.length)return;const was=s.pend.after;s.pend=null;s.phase='turn';
  if(was==='end'){const turner=s.turner!=null?s.turner:p;endTurnFrom(s,turner)}return}
 if(s.phase!=='turn')return fail('Azione non valida adesso');
 const st=status(s);
 switch(a.t){
 case'reveal':{if(s.row.length>=5)return fail('Hai già cinque carte');if(st==='bust')return fail('La carta è troppo alta: abbassala o rinuncia');
  const c=draw(s);s.peek=null;
  if(c==='END'){s.ev.push({t:'reveal',c});L(s,nm(s,p)+' rivela la Fine del regno!');finish(s);return}
  s.row.push(c);s.mod=0;s.destroyed=false;s.ev.push({t:'reveal',c});L(s,nm(s,p)+' rivela '+NAMES[c]+' ('+VAL[c]+')');
  if(status(s)==='bust'&&maxReduce(s,p)<curVal(s)-prevVal(s)){s.ev.push({t:'bust'});L(s,nm(s,p)+' ha pescato troppo alto: la fila salta');endTurn(s)}return}
 case'giveup':{if(!s.row.length)return fail('Non hai ancora pescato');s.ev.push({t:'bust'});L(s,nm(s,p)+' rinuncia: la fila salta');endTurn(s);return}
 case'use':{const k=a.k;if(!MANIP.includes(k))return fail('Potere sconosciuto');let eff=k,via=false;
  if(k==='judge'){if(!avail(s,p,'judge'))return fail('Il Giudice non è disponibile');eff=a.via;if(!['prophet','general','assassin','jester'].includes(eff))return fail('Scegli quale potere ripetere');if(!largest(s,p,eff)||!s.used[p][eff])return fail('Quel potere non è già stato usato');via=true}
  else if(!avail(s,p,k))return fail('Potere non disponibile (serve il mazzetto più grande e non averlo già usato)');
  if(eff==='prophet'){if(s.peek)return fail('Hai già guardato');const top=s.deck.length?s.deck[0]:null;if(top==null){s.deck=shuffle(s.discard);s.discard=[]}s.peek={p,card:s.deck[0]}}
  else{if(!s.row.length)return fail('Prima pesca una carta');if(eff==='jester'){if(a.d!==1&&a.d!==-1)return fail('Scegli +1 o −1');s.mod+=a.d}else s.mod-=RED[eff]}
  if(via)s.used[p].judge=true;else s.used[p][k]=true;s.ev.push({t:'power',p,k:eff});L(s,nm(s,p)+' usa '+NAMES[k]+(via?' per ripetere '+NAMES[eff]:''));
  if(s.row.length&&eff!=='prophet')L(s,'La carta vale ora '+curVal(s));return}
 case'destroy':{if(st!=='eq')return fail('Si distrugge solo con due carte dello stesso valore');if(s.destroyed)return fail('Hai già distrutto una carta per questa pari');
  const q=+a.p,t=a.type;if(!(q>=0&&q<s.n)||!cnt(s,q,t))return fail('Bersaglio non valido');
  const queens=cnt(s,p,'queen');if(queens&&s.row.length<=queens)return fail('La tua Regina ti impedisce di distruggere con meno di '+(queens+1)+' carte in fila');
  if(s.hit.includes(q))return fail('Puoi colpire un giocatore una volta sola per turno');
  if(avail(s,q,'alchemist')&&t!=='alchemist'&&q!==p)return fail('Chi ha l’Alchimista può essere colpito solo lì');
  if(q!==p&&largest(s,q,'alchemist')&&t!=='alchemist')return fail('Chi ha l’Alchimista può essere colpito solo lì');
  s.stacks[q][t]--;if(!s.stacks[q][t])delete s.stacks[q][t];s.discard.push(t);s.destroyed=true;s.hit.push(q);s.ev.push({t:'destroy',p,q,c:t});L(s,nm(s,p)+' distrugge '+NAMES[t]+' di '+nm(s,q));return}
 case'collect':{if(!s.row.length)return fail('Pesca almeno una carta');if(st==='bust')return fail('La carta è troppo alta: abbassala o rinuncia');
  const cards=s.row.slice();s.row=[];s.ev.push({t:'collect',p,n:cards.length});L(s,nm(s,p)+' raccoglie '+cards.length+(cards.length>1?' carte':' carta'));
  const need=collect(s,p,cards);s.turner=p;if(need.length){resolveOverflow(s,p,need,endTurn);return}endTurnFrom(s,p);return}
 case'swap':{if(!s.row.length)return fail('Pesca almeno una carta');if(st==='bust')return fail('La carta è troppo alta: abbassala o rinuncia');
  const kings=cnt(s,p,'king');if(kings&&s.row.length<kings)return fail('Il tuo Re ti impedisce di scambiare con meno di '+kings+' carte in fila');
  const q=+a.to,t=a.take;if(!(q>=0&&q<s.n&&q!==p))return fail('Scegli un altro giocatore');if(!cnt(s,q,t))return fail('Quell’avversario non ha quella carta');
  if(avail(s,q,'minstrel')||largest(s,q,'minstrel')){if(t!=='minstrel')return fail('Con il Menestrello puoi prendere solo quello')}
  s.stacks[q][t]--;if(!s.stacks[q][t])delete s.stacks[q][t];
  const cards=s.row.slice();s.row=[];s.ev.push({t:'swap',p,q,n:cards.length});L(s,nm(s,p)+' dà '+cards.length+' carte a '+nm(s,q)+' e prende '+NAMES[t]);
  const mine=collect(s,p,[t]),theirs=collect(s,q,cards);s.turner=p;
  /* chi ha il mazzetto pieno decide: prima chi prende, poi chi riceve */
  const queue=[];if(mine.length)queue.push({p,need:mine});if(theirs.length)queue.push({p:q,need:theirs});
  if(!queue.length){endTurnFrom(s,p);return}
  s.queue=queue.slice(1);resolveOverflow(s,queue[0].p,queue[0].need,endTurn);return}}
 return fail('Azione sconosciuta')}
/* chiude il turno di p (anche dopo scelte di scarto fatte da altri) */
function endTurnFrom(s,p){if(s.queue&&s.queue.length){const q=s.queue.shift();s.phase='overflow';s.pend={p:q.p,need:q.need,after:'end'};s.cur=q.p;s.turner=p;return}s.queue=null;s.cur=p;endTurn(s)}
return{newGame,act,setRnd:f=>{RND=f},TYPES,VAL,NAMES,COPIES,status,curVal,prevVal,avail,largest,score,maxReduce,cnt}})();
if(typeof module!=='undefined')module.exports=THRONE;
