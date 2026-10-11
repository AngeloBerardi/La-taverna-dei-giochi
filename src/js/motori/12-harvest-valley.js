/* HARVEST VALLEY – motore (2-5). Griglia condivisa 5x5 (2/4 giocatori) o 6x5 (3/5). Ricostruzione dalle regole pubbliche:
   carte terreno in un mercato di 3; a turno si gioca una fattoria o una carta del mercato in una cella libera adiacente alle carte già giocate;
   Erbacce coprono una carta (che torna al mercato), il Trattore la spinge in una cella libera adiacente. A griglia piena: Corvi (frutteti vicini, anche in diagonale) e Cinghiali
   (ortaggi adiacenti) rimuovono carte; poi punteggio per ogni fattoria. Valori delle carte e conteggi: ricostruiti (vedi note nelle regole). */
const HARV=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const DIMS={2:[5,5],3:[6,5],4:[5,5],5:[6,5]};
function deckList(){const d=[];[1,1,1,2,2,2,2,3,3,3].forEach((v,i)=>d.push({id:'v'+i,k:'veg',v}));[2,2,3,3,4,4].forEach((v,i)=>d.push({id:'f'+i,k:'fruit',v}));
 for(let i=0;i<5;i++)d.push({id:'w'+i,k:'wheat'});for(let i=0;i<3;i++)d.push({id:'p'+i,k:'pond'});for(let i=0;i<2;i++){d.push({id:'c'+i,k:'crow'});d.push({id:'b'+i,k:'boar'})}
 d.push({id:'x0',k:'weeds'});d.push({id:'t0',k:'tractor'});return d}
const key=(x,y)=>x+','+y,N4=[[1,0],[-1,0],[0,1],[0,-1]],N8=[...N4,[1,1],[1,-1],[-1,1],[-1,-1]];
function newGame(n,names,o={}){const deck=shuffle(deckList());const s={n,names:names.slice(),cur:0,log:[],ev:[],evn:0,over:null,hands:Array.from({length:n},()=>[]),dims:DIMS[n],cap:DIMS[n][0]*DIMS[n][1],grid:{},deck,market:[],farms:Array(n).fill(n<=3?2:1),placed:0};
 while(s.market.length<3&&s.deck.length)s.market.push(s.deck.pop());s.log.push('Si comincia: gioca una fattoria o una carta del mercato');return s}
const cells=s=>Object.keys(s.grid).map(k=>k.split(',').map(Number));
const fits=(s,pts)=>{let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const[x,y]of pts){a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,y);d=Math.max(d,y)}const w=b-a+1,h=d-c+1,[A,B]=s.dims;return(w<=A&&h<=B)||(w<=B&&h<=A)};
function spots(s,extra){const occ=cells(s).filter(([x,y])=>!extra||key(x,y)!==extra.skip),out=[];if(!Object.keys(s.grid).length)return[[0,0]];const seen=new Set();
 for(const[x,y]of cells(s))for(const[dx,dy]of N4){const q=[x+dx,y+dy],k=key(...q);if(s.grid[k]||seen.has(k))continue;seen.add(k);if(fits(s,[...cells(s),q]))out.push(q)}return out}
function covers(s){return Object.entries(s.grid).filter(([k,c])=>!['farm','weeds','tractor'].includes(c.k)).map(([k])=>k.split(',').map(Number))}
function dests(s,x,y){return N4.map(([dx,dy])=>[x+dx,y+dy]).filter(q=>!s.grid[key(...q)]&&fits(s,[...cells(s),q]))}
function adj(s,x,y,N,pred){const o=[];for(const[dx,dy]of N){const c=s.grid[key(x+dx,y+dy)];if(c&&!c.gone&&pred(c))o.push([x+dx,y+dy,c])}return o}
function score(s){ // applica corvi/cinghiali e calcola i punti
 const eaten=[];for(const[k,c]of Object.entries(s.grid)){const[x,y]=k.split(',').map(Number);if(c.k==='crow')adj(s,x,y,N8,q=>q.k==='fruit').forEach(([a,b,q])=>{q.gone=1;eaten.push({x:a,y:b,by:'crow'})});
  if(c.k==='boar')adj(s,x,y,N4,q=>q.k==='veg').forEach(([a,b,q])=>{q.gone=1;eaten.push({x:a,y:b,by:'boar'})})}
 const val=(x,y,c)=>c.v+adj(s,x,y,N4,q=>q.k==='pond').length;
 const det=Array.from({length:s.n},()=>({veg:0,fruit:0,wheat:0,tot:0}));
 // campi di grano connessi
 const comp={};let id=0;for(const[k,c]of Object.entries(s.grid)){if(c.k!=='wheat'||c.gone||comp[k]!=null)continue;const st=[k];comp[k]=id;while(st.length){const[x,y]=st.pop().split(',').map(Number);for(const[dx,dy]of N4){const kk=key(x+dx,y+dy),q=s.grid[kk];if(q&&q.k==='wheat'&&comp[kk]==null){comp[kk]=id;st.push(kk)}}}id++}
 const size={};Object.values(comp).forEach(i=>size[i]=(size[i]||0)+1);
 for(const[k,c]of Object.entries(s.grid)){if(c.k!=='farm')continue;const[x,y]=k.split(',').map(Number),d=det[c.o];
  adj(s,x,y,N4,q=>q.k==='veg').forEach(([a,b,q])=>d.veg+=val(a,b,q));adj(s,x,y,N8,q=>q.k==='fruit').forEach(([a,b,q])=>d.fruit+=val(a,b,q));
  const f=new Set();adj(s,x,y,N4,q=>q.k==='wheat').forEach(([a,b])=>f.add(comp[key(a,b)]));f.forEach(i=>d.wheat+=size[i]*size[i])}
 det.forEach(d=>d.tot=d.veg+d.fruit+d.wheat);return{det,eaten}}
function endGame(s){const{det,eaten}=score(s),sc=det.map(d=>d.tot);let best=Math.max(...sc),w=[];sc.forEach((v,i)=>{if(v===best)w.push(i)});if(w.length>1){const bf=Math.max(...w.map(i=>det[i].fruit));w=w.filter(i=>det[i].fruit===bf)}
 s.over={win:w.length===1?w[0]:null,tie:w,scores:sc,det,eaten,lvl:0};s.phase='summary';s.ev.push({t:'end',eaten});s.log.push('Valle completa! Corvi e cinghiali passano per il raccolto…')}
function act(st,a){const s=JSON.parse(JSON.stringify(st));if(s.over)return{err:'Partita finita'};s.ev=[];
 if(a.t!=='place')return{err:'Azione sconosciuta'};const p=s.cur,x=a.x,y=a.y;let card;
 if(a.src==='farm'){if(!s.farms[p])return{err:'Hai già giocato le tue fattorie'};card={id:'h'+p+'_'+s.farms[p],k:'farm',o:p}}
 else{const i=+String(a.src).slice(1);card=s.market[i];if(!card)return{err:'Carta non disponibile'}}
 const k=key(x,y);const sp=spots(s);
 if(card.k==='weeds'||card.k==='tractor'){if(!s.grid[k]||['farm','weeds','tractor'].includes(s.grid[k].k))return{err:'Scegli una carta terreno già sul tavolo'};
  const old=s.grid[k];
  if(card.k==='weeds'){s.grid[k]=card;s.market.push(old);s.ev.push({t:'weeds',p,x,y,old})}
  else{const d=dests(s,x,y);const to=a.to;if(!to||!d.some(q=>q[0]===to[0]&&q[1]===to[1]))return{err:'Spingi la carta in una cella libera adiacente'};s.grid[k]=card;s.grid[key(to[0],to[1])]=old;s.ev.push({t:'tractor',p,x,y,to,old})}}
 else{if(!sp.some(q=>q[0]===x&&q[1]===y))return{err:'Puoi giocare solo in una cella libera adiacente, dentro la griglia'};s.grid[k]=card;s.placed++;s.ev.push({t:'place',p,x,y,card})}
 if(a.src==='farm')s.farms[p]--;else s.market.splice(+String(a.src).slice(1),1);
 if(card.k==='tractor'||card.k==='weeds')s.placed+=card.k==='tractor'?1:0;
 s.log.push(s.names[p]+(a.src==='farm'?' costruisce una fattoria':' gioca '+({veg:'ortaggi',fruit:'un frutteto',wheat:'grano',pond:'uno stagno',crow:'un corvo',boar:'un cinghiale',weeds:'le erbacce',tractor:'il trattore'}[card.k])));
 while(s.market.length<3&&s.deck.length)s.market.push(s.deck.pop());
 s.evn++;
 const full=Object.keys(s.grid).length>=s.cap;
 s.cur=(p+1)%s.n;
 const can=q=>s.farms[q]>0||s.market.length>0;
 if(full||!can(s.cur)){endGame(s)}
 return{s}}
return{newGame,act,setRnd:f=>{RND=f},spots,covers,dests,score,DIMS,deckList}})();
if(typeof module!=='undefined')module.exports=HARV;
