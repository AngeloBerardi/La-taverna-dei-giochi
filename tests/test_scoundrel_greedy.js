// Il bot che pianifica la stanza deve vincere davvero; quello casuale (test_scoundrel.js) perde quasi sempre.
const S=require('../src/js/motori/13-scoundrel.js'),B=require('./bot_scoundrel.js');let w=0,l=0,sc=[],seed=7;
S.setRnd(()=>((seed=seed*16807%2147483647)/2147483647));
for(let g=0;g<1000;g++){let s=S.newGame(1,['a']),k=0;while(!s.over&&k++<300){const r=S.act(s,B.move(s));if(r.err){console.log('ERR',r.err);process.exit(1)}s=r.s}
 s.over&&s.over.win?w++:l++;sc.push(s.over?s.over.scores[0]:-999)}
console.log({w,l,avg:+(sc.reduce((a,b)=>a+b)/sc.length).toFixed(1)});process.exit(w>=15?0:1)
