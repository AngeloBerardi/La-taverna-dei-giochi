// L'isola dei predatori: partite sempre concluse con 0, 1 o 2 animali d'acqua; una ricerca in profondità
// (informazione completa, solitario) vince molto più spesso di un giocatore casuale.
const carica=require('./carica.js'),I=carica('07-isola.js','ISLE');
function chiave(s){return JSON.stringify([s.cells,s.water,s.mods,s.pend])}
function cerca(s0,budget){let nodi=0,best={left:99,path:null};const seen=new Set();
 (function dfs(s,path){if(nodi++>budget||best.left===1)return;if(s.over){if(s.over.left<best.left)best={left:s.over.left,path:path.slice()};return}
  const k=chiave(s);if(seen.has(k))return;seen.add(k);
  let opts=I.options(s);if(!opts.length){const r=I.act(s,{t:'end'});return dfs(r.s,[...path,{t:'end'}])}
  opts=opts.slice().sort((a,b)=>(a.t==='whale')-(b.t==='whale')||(a.shark?1:0)-(b.shark?1:0));
  if(opts.length>40)opts=opts.filter((_,i)=>i%Math.ceil(opts.length/40)===0);
  for(const a of opts){const r=I.act(s,a);if(r.err)continue;path.push(a);dfs(r.s,path);path.pop();if(best.left===1)return}})(s0,[]);
 return best}
function partita(water,smart,R){I.setRnd(R);let s=I.newGame(1,['io'],{water}),k=0;
 if(smart){const b=cerca(s,4000);if(b.path)for(const a of b.path){const r=I.act(s,a);if(r.err)throw new Error(r.err);s=r.s}}
 while(!s.over&&k++<200){const o=I.options(s);const a=o.length?o[Math.floor(R()*o.length)]:{t:'end'};const r=I.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));s=r.s}
 if(!s.over)throw new Error('senza fine');return s.over}
const R=carica.rng(29);let ok=true;
for(const water of ['0','1','2']){let ws=0,wr=0;const N=15;for(let g=0;g<N;g++){if(partita(water,true,R).win)ws++;if(partita(water,false,R).win)wr++}
 console.log('Isola, animali d’acqua',water+': ricerca vince',ws+'/'+N,'casuale',wr+'/'+N);if(ws<=wr)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
