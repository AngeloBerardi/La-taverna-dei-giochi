/* CACCIA AL FANTASMA (inseguimento con biglietti di trasporto, ispirato al genere "un fuggitivo nascosto contro i detective"; mappa, grafica e testi nostri). 3-6 giocatori.
   Il posto 0 è il Fantasma, nascosto in una città di 72 incroci (a griglia 8×9) collegati da TAXI (tutti), BUS (fermate verdi) e METRO (stazioni rosse). Gli altri sono i detective.
   Ogni mossa costa un biglietto del mezzo usato. Il Fantasma mostra solo il tipo di biglietto, e la sua posizione compare ai round 3, 8, 13, 18 e 24.
   Biglietti: detective 10 taxi, 8 bus, 4 metro (quelli usati passano al Fantasma); Fantasma 4 taxi, 3 bus, 3 metro, 1 nero per detective (vale per qualunque mezzo e nasconde il mezzo), 2 doppie mosse.
   I detective vincono se uno di loro arriva sul Fantasma o se non ha mosse; il Fantasma vince se resiste 24 round o se nessun detective può muoversi.
   Fasi: ghost (cur 0) · det (cur = detective di turno). Azioni: move{to,tk} double (solo Fantasma, prima della mossa).*/
const FANTASMA=(()=>{
let RND=Math.random;
const clone=s=>JSON.parse(JSON.stringify(s));
const W=8,H=9,N=W*H,ROUNDS=24,REVEAL=[3,8,13,18,24],TYPES=['taxi','bus','metro'];
/* Il fiume attraversa la città tra le colonne 3 e 4: lo si passa solo ai ponti (righe BR) o con i traghetti (solo biglietto nero) */
const BR=[1,4,7],FERRY=[[2,2,5,2],[1,5,6,5]];
const idx=(x,y)=>y*W+x,X=i=>i%W,Y=i=>Math.floor(i/W);
/* mappa deterministica */
const G=(()=>{const adj={taxi:Array.from({length:N},()=>[]),bus:Array.from({length:N},()=>[]),metro:Array.from({length:N},()=>[]),ferry:Array.from({length:N},()=>[])};
 const add=(t,a,b)=>{if(!adj[t][a].includes(b)){adj[t][a].push(b);adj[t][b].push(a)}};
 const h=(x,y,k)=>((x*73856093^y*19349663^k*83492791)>>>0)%7;
 const cand=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(x<W-1&&(x!==3||BR.includes(y)))cand.push([idx(x,y),idx(x+1,y),h(x,y,1)]);if(y<H-1)cand.push([idx(x,y),idx(x,y+1),h(x,y,2)])}
 const conn=(skip)=>{const a=Array.from({length:N},()=>[]);cand.forEach((e,i)=>{if(i!==skip&&!e.cut){a[e[0]].push(e[1]);a[e[1]].push(e[0])}});
  for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++)if((x+y)%5===0&&x!==3){a[idx(x,y)].push(idx(x+1,y+1));a[idx(x+1,y+1)].push(idx(x,y))}
  const seen=new Set([0]),q=[0];while(q.length){const v=q.pop();for(const w of a[v])if(!seen.has(w)){seen.add(w);q.push(w)}}return seen.size===N};
 cand.forEach((e,i)=>{if(e[2]===0&&conn(i))e.cut=true});
 cand.forEach(e=>{if(!e.cut)add('taxi',e[0],e[1])});
 for(let y=0;y<H-1;y++)for(let x=0;x<W-1;x++)if((x+y)%5===0&&x!==3)add('taxi',idx(x,y),idx(x+1,y+1));
 FERRY.forEach(f=>add('ferry',idx(f[0],f[1]),idx(f[2],f[3])));
 const bus=i=>(X(i)*3+Y(i)*2)%5===0,metro=i=>X(i)%3===1&&Y(i)%3===1;
 const nextIn=(i,dx,dy,f)=>{let x=X(i)+dx,y=Y(i)+dy;while(x>=0&&x<W&&y>=0&&y<H){if(dx&&X(i)<=3&&x>=4&&!BR.includes(Y(i)))return-1;if(f(idx(x,y)))return idx(x,y);x+=dx;y+=dy}return-1};
 for(let i=0;i<N;i++){if(bus(i)){for(const[dx,dy]of[[1,0],[0,1]]){const j=nextIn(i,dx,dy,bus);if(j>=0)add('bus',i,j)}}
  if(metro(i)){for(const[dx,dy]of[[1,0],[0,1]]){const j=nextIn(i,dx,dy,metro);if(j>=0)add('metro',i,j)}}}
 return{adj,bus,metro}})();
const nbr=(from,tk)=>tk==='black'?[...new Set([...TYPES,'ferry'].flatMap(t=>G.adj[t][from]))]:G.adj[tk][from];
/* posizione sulla mappa in unità di griglia (stessa per tutte le viste): incroci un po' sfalsati come in una vera città */
const pos=i=>{const h=(i*2654435761>>>0),jx=((h%1000)/1000-.5)*.5,jy=(((h>>>10)%1000)/1000-.5)*.5;return{x:X(i)+jx,y:Y(i)+jy}};
const river=y=>3.5+.22*Math.sin(y*.8+.4);
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const nm=(s,i)=>s.names[i];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function newGame(n,names,o={}){const det=n-1,starts=shuffle(Array.from({length:N},(_,i)=>i).filter(i=>G.adj.taxi[i].length>=3)).slice(0,n);
 const tk=[{taxi:4,bus:3,metro:3,black:det,dbl:2}];for(let i=1;i<n;i++)tk.push({taxi:10,bus:8,metro:4,black:0,dbl:0});
 const s={n,names:names.slice(0,n),hands:Array.from({length:n},()=>[]),pos:starts,tk,round:0,last:null,trail:[],phase:'ghost',dbl:0,cur:0,log:[],ev:[],evn:0,over:null};
 L(s,'Il Fantasma è nascosto in città. I detective partono: '+nm(s,1));return s}
/* mosse possibili per un posto: [{to,tk}] (nessuno entra in una casella occupata da un detective; solo i detective possono entrare nella casella del Fantasma) */
function moves(s,seat){const out=[],from=s.pos[seat],t=s.tk[seat],occ=s.pos.slice(1);
 for(const k of [...TYPES,...(seat===0?['black']:[])])if(t[k]>0)for(const to of nbr(from,k))if(!occ.includes(to))out.push({to,tk:k});
 return out}
function win(s,ghost,why){const winners=ghost?[0]:Array.from({length:s.n-1},(_,i)=>i+1);
 s.over={win:ghost?0:1,winners,scores:Array.from({length:s.n},(_,i)=>winners.includes(i)?1:0),why};s.phase='end';s.ev.push({t:'over',ghost});L(s,ghost?'Il Fantasma sfugge alla caccia!':'Il Fantasma è stato preso!')}
function startDetectives(s){if(!Array.from({length:s.n-1},(_,i)=>i+1).some(i=>moves(s,i).length)){L(s,'I detective non hanno più biglietti né mosse');win(s,true,'bloccati');return}s.phase='det';s.cur=1;skipStuck(s)}
function skipStuck(s){let tries=0;while(tries++<s.n){if(s.cur>=s.n){endRound(s);return}if(moves(s,s.cur).length)return;L(s,nm(s,s.cur)+' non ha mosse e salta');s.cur++}endRound(s)}
function endRound(s){if(s.round>=ROUNDS){win(s,true,'tempo');return}
 s.phase='ghost';s.cur=0;s.dbl=0;if(!moves(s,0).length){win(s,false,'intrappolato');return}s.ev.push({t:'turn',p:0})}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];const p=s.cur;
 if(a.t==='double'){if(s.phase!=='ghost'||s.dbl)return fail('Non adesso');if(s.tk[0].dbl<1)return fail('Niente più doppie mosse');if(s.round>=ROUNDS-1)return fail('Troppo tardi per una doppia mossa');
  s.tk[0].dbl--;s.dbl=1;s.ev.push({t:'double'});L(s,'Il Fantasma usa una doppia mossa');s.evn++;return{s}}
 if(a.t==='move'){const mv=moves(s,p).find(m=>m.to===a.to&&m.tk===a.tk);if(!mv)return fail('Mossa non valida: mezzo, biglietto o casella');
  s.tk[p][a.tk]--;
  if(p===0){s.pos[0]=a.to;s.round++;s.trail.push(a.tk);s.ev.push({t:'ghost',tk:a.tk,round:s.round});L(s,'Round '+s.round+': il Fantasma usa '+({taxi:'il taxi',bus:'il bus',metro:'la metro',black:'un biglietto nero'})[a.tk]);
   if(REVEAL.includes(s.round)){s.last={pos:a.to,round:s.round};s.ev.push({t:'reveal',pos:a.to});L(s,'Il Fantasma si fa vedere: era in '+(a.to+1))}
   if(s.dbl===1){s.dbl=2;s.evn++;if(moves(s,0).length&&s.round<ROUNDS)return{s};s.dbl=0}
   startDetectives(s);s.evn++;return{s}}
  s.tk[0][a.tk]++;
  s.pos[p]=a.to;s.ev.push({t:'det',p,to:a.to,tk:a.tk});L(s,nm(s,p)+' si muove in '+(a.to+1)+' ('+a.tk+')');
  if(a.to===s.pos[0]){win(s,false,'preso');s.evn++;return{s}}
  s.cur++;skipStuck(s);s.evn++;return{s}}
 return fail('Azione non valida adesso')}
/* distanza (in mosse con i mezzi indicati) per i bot */
function dist(from,to,types=TYPES){const d=new Map([[from,0]]),q=[from];while(q.length){const v=q.shift();if(v===to)return d.get(v);for(const t of types)for(const w of G.adj[t][v])if(!d.has(w)){d.set(w,d.get(v)+1);q.push(w)}}return 99}
const isFerry=i=>G.adj.ferry[i].length>0;
return{newGame,act,setRnd:f=>{RND=f},W,H,N,ROUNDS,REVEAL,TYPES,BR,FERRY,adj:G.adj,isBus:G.bus,isMetro:G.metro,isFerry,pos,river,moves,dist}})();
if(typeof module!=='undefined')module.exports=FANTASMA;
