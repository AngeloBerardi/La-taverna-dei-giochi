// Burraco: 108 carte sempre presenti, mani sempre concluse, coppia di bot che cala e attacca batte la coppia casuale.
const carica=require('./carica.js'),B=carica('03-burraco.js','BURR'),{P,PTS,validate}=B;
const hand=s=>s.hands[s.cur],team=s=>s.cur%2;
function tryAct(s,a){const r=B.act(s,a);return r.err?null:r.s}
function findMelds(h){const out=[],nat=h.filter(c=>!P(c).j&&P(c).r!==2);
 const byR={};for(const c of nat){(byR[P(c).r]=byR[P(c).r]||[]).push(c)}for(const k in byR){const g=[...new Map(byR[k].map(c=>[c.slice(1),c])).values()];if(byR[k].length>=3)out.push(byR[k].slice(0,Math.min(byR[k].length,7)))}
 for(const su of 'HDCS'){const cs=[...new Map(nat.filter(c=>P(c).s===su).map(c=>[P(c).r,c])).values()].sort((a,b)=>P(a).r-P(b).r);let run=[];
  for(const c of cs){if(run.length&&P(c).r!==P(run[run.length-1]).r+1){if(run.length>=3)out.push(run);run=[]}run.push(c)}if(run.length>=3)out.push(run)}
 return out.filter(m=>validate(m))}
function smart(s){if(s.phase==='summary')return[{t:'next'}];const h=hand(s),t=team(s);
 if(s.phase==='draw'){const top=s.disc[s.disc.length-1];const useful=s.disc.length>=3||findMelds([...h,...s.disc]).length>findMelds(h).length;return[useful&&s.disc.length?{t:'draw',from:'disc'}:s.deck.length?{t:'draw'}:{t:'draw',from:'disc'}]}
 const seq=[];let cur=s,changed=true;
 while(changed){changed=false;const hh=hand(cur);
  for(const m of findMelds(hh)){const n=tryAct(cur,{t:'meld',cards:m});if(n){seq.push({t:'meld',cards:m});cur=n;changed=true;break}}if(changed)continue;
  for(const c of hand(cur)){for(let mi=0;mi<cur.melds[t].length;mi++){const n=tryAct(cur,{t:'add',mi,cards:[c]});if(n&&(!(P(c).j||P(c).r===2)||cur.melds[t][mi].cards.length>=5)){seq.push({t:'add',mi,cards:[c]});cur=n;changed=true;break}}if(changed)break}}
 const hh=hand(cur);const keep=c=>(P(c).j||P(c).r===2?50:0)+hh.filter(x=>x!==c&&!P(x).j&&(P(x).r===P(c).r||P(x).s===P(c).s&&Math.abs(P(x).r-P(c).r)<=2)).length*5-PTS(c)/5;
 const order=hh.slice().sort((a,b)=>keep(a)-keep(b));for(const c of order){if(tryAct(cur,{t:'discard',c})){seq.push({t:'discard',c});break}}return seq}
function rnd(s,R){if(s.phase==='summary')return[{t:'next'}];const h=hand(s);if(s.phase==='draw')return[R()<.2&&s.disc.length||!s.deck.length?{t:'draw',from:'disc'}:{t:'draw'}];
 const seq=[];let cur=s;if(R()<.5)for(const m of findMelds(h)){const n=tryAct(cur,{t:'meld',cards:m});if(n){seq.push({t:'meld',cards:m});cur=n;break}}
 const hh=hand(cur).slice().sort(()=>R()-.5);for(const c of hh)if(tryAct(cur,{t:'discard',c})){seq.push({t:'discard',c});break}return seq}
function conta(s){return s.hands.flat().length+s.pozz.flat().length+s.disc.length+s.deck.length+s.melds.flat().reduce((a,m)=>a+m.cards.length,0)}
function partita(n,smartTeam,R){B.setRnd(R);let s=B.newGame(n,['a','b','c','d'].slice(0,n),{target:'one'}),k=0;
 while(!s.over&&k++<3000){const bot=s.cur%2===smartTeam?smart(s):rnd(s,R);if(!bot.length)throw new Error('nessuna mossa');
  for(const a of bot){const r=B.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));s=r.s;if(s.phase!=='summary'&&conta(s)!==108)throw new Error('carte: '+conta(s))}}
 if(!s.over)throw new Error('senza fine');return s.over}
const R=carica.rng(4);let ok=true;
for(const n of [2,4]){let w=0;const N=60;for(let g=0;g<N;g++){const o=partita(n,g%2,R);if(o.win===g%2)w++}
 console.log('Burraco',n,'giocatori: la coppia di bot vince',Math.round(w/N*100)+'%');if(w/N<.7)ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
