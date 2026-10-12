// Machiavelli: 108 carte sempre presenti, tavolo sempre valido, partite concluse;
// il bot che usa il solutore (riordina il tavolo) batte chi cala solo combinazioni dalla mano.
const carica=require('./carica.js'),M=carica('08-machiavelli.js','MACH');
function smart(s){const r=M.suggest(s.table,s.hands[s.cur],25);return r?{t:'play',table:r.table}:{t:'draw'}}
function semplice(s,R){const h=s.hands[s.cur];if(R()<.5){const r=M.solve([],h,3000,20);if(r)return{t:'play',table:[...s.table,...r.table]}}return{t:'draw'}}
function partita(n,chi,R){M.setRnd(R);let s=M.newGame(n,['a','b','c','d','e'].slice(0,n)),k=0;
 while(!s.over&&k++<2000){const a=s.cur===chi?smart(s):semplice(s,R),r=M.act(s,a);if(r.err)throw new Error(r.err);s=r.s;
  const tot=s.stock.length+s.hands.flat().length+s.table.flat().length;if(tot!==108)throw new Error('carte: '+tot);if(!s.table.every(M.validMeld))throw new Error('tavolo non valido')}
 if(!s.over)throw new Error('senza fine');return s.over}
const R=carica.rng(31);let ok=true;
for(const n of [2,3,5]){let w=0;const N=8;for(let g=0;g<N;g++){const o=partita(n,g%n,R);if(o.winners.includes(g%n))w++}
 console.log('Machiavelli',n,'giocatori: il bot col solutore vince',Math.round(w/N*100)+'%');if(w/N<Math.min(.85,1/n+.25))ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
