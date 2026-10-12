// Azul (muro classico e grigio): 100 piastrelle sempre presenti, partite concluse, bot goloso batte il casuale.
const carica=require('./carica.js'),A=carica('06-azul.js','AZUL');
function conta(s){let t=s.bag.length+s.lid.length+s.center.length+s.factories.flat().length;
 for(const b of s.boards){t+=b.lines.reduce((a,l)=>a+l.k,0)+b.wall.flat().filter(x=>x>=0).length+b.floor.filter(x=>x!=='F').length}return t}
function gol(s){if(s.phase==='tile'){const b=s.boards[s.cur],r=b.lines.findIndex((l,i)=>l.k===i+1),fc=A.freeCols(b,r,b.lines[r].c);return{t:'wall',col:fc.length?fc[0]:-1}}
 const b=s.boards[s.cur];let best=null;for(const o of A.options(s)){const src=o.src==='c'?s.center:s.factories[o.src],n=src.filter(t=>t===o.color).length;
  let v;if(o.line==='f')v=-n*2-5;else{const ln=b.lines[o.line],room=o.line+1-ln.k,put=Math.min(room,n),over=n-put;v=put*1.5+(put===room?3+o.line:0)-over*2.2-(o.line>2&&ln.k===0&&n<2?2:0)}
  if(o.src==='c'&&s.firstInCenter)v-=1;if(!best||v>best.v)best={v,o}}return best.o}
function rnd(s,R){if(s.phase==='tile'){const b=s.boards[s.cur],r=b.lines.findIndex((l,i)=>l.k===i+1),fc=A.freeCols(b,r,b.lines[r].c);return{t:'wall',col:fc.length?fc[Math.floor(R()*fc.length)]:-1}}
 const o=A.options(s);return o[Math.floor(R()*o.length)]}
function partita(n,wall,goloso,R){A.setRnd(R);let s=A.newGame(n,['a','b','c','d'].slice(0,n),{wall}),k=0;
 while(!s.over&&k++<3000){const a=s.cur===goloso?gol(s):rnd(s,R),r=A.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));s=r.s;if(!s.over&&conta(s)!==100)throw new Error('piastrelle: '+conta(s))}
 if(!s.over)throw new Error('senza fine');return s.over}
const R=carica.rng(17);let ok=true;
for(const wall of ['classic','grey'])for(const n of [2,3,4]){let w=0;const N=60;for(let g=0;g<N;g++){const o=partita(n,wall,g%n,R);if(o.winners.includes(g%n))w++}
 console.log('Azul',wall,n,'giocatori: il bot goloso vince',Math.round(w/N*100)+'%');if(w/N<Math.min(.9,1/n+.25))ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
