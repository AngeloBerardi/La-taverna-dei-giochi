// Saboteur (base e Saboteur 2): partite sempre concluse con tutte le carte azione e 3-10 giocatori;
// cercatori che scavano verso le mete trovano l'oro molto più spesso di giocatori casuali.
const carica=require('./carica.js'),S=carica('05-saboteur.js','SAB'),{C}=S;
function legali(s,R,max){const p=s.cur,h=s.hands[p],out=[];
 for(const c of h){const K=C[c];
  if(S.isPath(c)){for(const pl of S.placements(s,c))out.push({t:'path',c,...pl})}
  else if(K.a==='rock'){for(const k in s.board)if(S.isPath(s.board[k].id)){const[x,y]=k.split(',').map(Number);out.push({t:'rock',c,x,y})}}
  else if(K.a==='map'){for(const y of[-2,0,2])out.push({t:'map',c,y})}
  else for(let to=0;to<s.n;to++)out.push({t:'act',c,to,tool:K.tools?K.tools[0]:undefined})}
 return out}
function rnd(s,R){if(s.phase==='summary')return{t:'next'};if(s.phase==='gold')return{t:'gold',i:0};const h=s.hands[s.cur];
 const L=legali(s,R);for(let g=0;g<6&&L.length;g++){const a=L[Math.floor(R()*L.length)];if(!S.act(s,a).err)return a}
 return h.length?{t:'pass',c:h[Math.floor(R()*h.length)]}:{t:'pass'}}
function cerca(s,R){if(s.phase==='summary')return{t:'next'};if(s.phase==='gold')return{t:'gold',i:0};const p=s.cur,h=s.hands[p];
 // ripara i propri attrezzi, poi scava avvicinandosi alle mete (x=8), poi passa scartando la carta peggiore
 for(const c of h){const K=C[c];if(K.a==='fix'){for(const t of K.tools)if(s.broken[p][t])return{t:'act',c,to:p,tool:t}}}
 let best=null;for(const c of h){if(!S.isPath(c)||C[c].dead)continue;for(const pl of S.placements(s,c)){const a={t:'path',c,...pl},r=S.act(s,a);if(r.err)continue;
  const ns=r.s;if(ns.phase!=='play'){return a}const RE=S.reachedEdges(ns,S.reach(ns));let v=-99;
  const goals=Object.keys(ns.board).filter(k=>ns.board[k].hidden).map(k=>k.split(',').map(Number));
  for(const k in RE){const[x,y]=k.split(',').map(Number);for(const[dx,dy,d]of[[1,0,2],[0,1,4],[-1,0,8],[0,-1,1]]){if(!(RE[k]&d))continue;const nx=x+dx,ny=y+dy;if(ns.board[nx+','+ny])continue;for(const[gx,gy]of goals)v=Math.max(v,-(Math.abs(nx-gx)+Math.abs(ny-gy)))}}
  if(!best||v>best.v)best={v,a}}}
 if(best)return best.a;const bad=h.find(c=>C[c].dead||C[c].a==='break')||h[0];return h.length?{t:'pass',c:bad}:{t:'pass'}}
function partita(n,exp,bot,R){S.setRnd(R);let s=S.newGame(n,Array.from({length:n},(_,i)=>'g'+i),{exp:exp?'sab2':''}),k=0,trovati=0;
 while(!s.over&&k++<3000){const a=bot(s,R),r=S.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));if(s.phase==='play'&&r.s.phase!=='play'&&r.s.res&&r.s.res.finder!=null)trovati++;s=r.s}
 if(!s.over)throw new Error('senza fine');return trovati}
const R=carica.rng(13);let ok=true;
for(const exp of [false,true])for(let n=3;n<=10;n++)for(let g=0;g<3;g++)partita(n,exp,rnd,R);
console.log('fuzz base e Saboteur 2, 3-10 giocatori: ok');
for(const n of [4,6]){let a=0,b=0;const N=12;for(let g=0;g<N;g++){a+=partita(n,false,cerca,R);b+=partita(n,false,rnd,R)}
 console.log('Saboteur',n,'giocatori: oro trovato',a+'/'+N*3,'round dai cercatori,',b+'/'+N*3,'dai casuali');if(a<N*3*.7||a<=b)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
