// Regicide: invarianti (54 carte sempre presenti) e confronto bot che valuta le mosse contro bot casuale.
const carica=require('./carica.js'),RG=carica('01-regicide.js','RG');
function subsets(h){const out=[];for(let m=1;m<1<<h.length;m++){const k=h.filter((_,i)=>m>>i&1);if(k.length<=4)out.push(k)}return out}
function plays(s){const r=[];for(const k of subsets(s.hands[s.cur]))if(!RG.checkPlay(s,k))r.push({t:'play',cards:k});if(!(s.n>1&&s.yr>=s.n-1)&&!(s.n===1&&s.yr>=3))r.push({t:'yield'});return r}
const killed=s=>12-s.castle.length-(s.en?1:0);
function val(s){if(s.over)return s.over.win?1e6:-1e6+killed(s)*1000;
 const hp=RG.hpOf[RG.P(s.en.c).r],cards=s.hands.flat();
 return killed(s)*1000+s.en.dmg/hp*300+RG.sum(cards)*4+cards.length*6+s.tav.length*2+s.jl*60-(s.en.can?0:0)}
function settle(s){// dopo una giocata: scarta il meno possibile; nel solitario usa il Jolly se servisse
 let g=0;while(!s.over&&s.phase==='discard'&&g++<3){const d=RG.bestDiscard(s);const r=d.length?RG.act(s,{t:'discard',cards:d}):RG.act(s,{t:'flip'});if(r.err)break;s=r.s}
 if(!s.over&&s.phase==='pick'){let best=null;for(let p=0;p<s.n;p++){const v=s.hands[p].length;if(!best||v>best.v)best={v,p}}s=RG.act(s,{t:'pick',to:best.p}).s}return s}
function smart(s){if(s.phase==='discard'){const d=RG.bestDiscard(s);if(d.length)return{t:'discard',cards:d};return{t:'flip'}}
 if(s.phase==='pick'){let best=0;for(let p=0;p<s.n;p++)if(s.hands[p].length>s.hands[best].length)best=p;return{t:'pick',to:best}}
 let best=null;for(const a of plays(s)){const r=RG.act(s,a);if(r.err)continue;const v=val(settle(r.s))-(a.t==='yield'?40:0);if(!best||v>best.v)best={v,a}}
 if(s.n===1&&s.jl>0){const r=RG.act(s,{t:'flip'});if(!r.err){const v=val(settle(r.s))-120;if(!best||v>best.v)best={v,a:{t:'flip'}}}}
 return best.a}
function rnd(s,R){if(s.phase==='discard'){const h=s.hands[s.cur].slice().sort(()=>R()-.5),k=[];for(const c of h){if(RG.sum(k)>=s.owed)break;k.push(c)}return RG.sum(k)>=s.owed?{t:'discard',cards:k}:{t:'flip'}}
 if(s.phase==='pick')return{t:'pick',to:Math.floor(R()*s.n)};if(s.n===1&&!s.hands[0].length&&s.jl>0)return{t:'flip'};const p=plays(s);return p[Math.floor(R()*p.length)]}
function partita(n,bot,R){RG.setRnd(R);let s=RG.newGame(n,[]),k=0;while(!s.over&&k++<800){const a=bot(s,R),r=RG.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));s=r.s;
  const tot=s.tav.length+s.disc.length+s.castle.length+(s.en?1:0)+s.played.length+s.hands.flat().length;
  if(s.over&&s.over.win)break;if(tot!==52+(n===3?1:n===4?2:0)){/* il nemico sconfitto esatto torna in taverna: già contato */throw new Error('carte perse: '+tot)}}
 if(!s.over)throw new Error('partita senza fine');return s.over.win}
const R=carica.rng(5);let ok=true;
for(const n of [1,2,3,4]){let ws=0,wr=0;const G=n===1?400:200;
 for(let g=0;g<G;g++){if(partita(n,smart,R))ws++;if(partita(n,rnd,R))wr++}
 console.log('giocatori',n,'bot',ws+'/'+G,'casuale',wr+'/'+G);if(!(ws>wr&&wr<=G*.01))ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
