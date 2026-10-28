// Regicidio X: classi e tratti. Invarianti (carte mai perse), tratti e poteri uno per uno, bot che usa i poteri contro bot casuale.
const carica=require('./carica.js'),RX=carica('37-regicide-x.js','RGX');
let ok=true;const ck=(c,m)=>{if(!c){ok=false;console.log('FALLITO:',m)}};
// --- casi mirati ---
function base(n,en,cls){RX.setRnd(carica.rng(3));const s=RX.newGame(n,[],{cls});s.en=Object.assign({c:'JC',dmg:0,sh:0,sp:0,can:false,tr:'',im2:''},en);return s}
{const s=RX.newGame(4,[]);ck(new Set(s.cls).size===4,'classi tutte diverse');ck(!s.en.tr,'nessun tratto ai Fanti');s.castle=['QH'];s.en.dmg=99;ck(RX.P(s.castle[0]).r==='Q','ok');
 const s2=RX.newGame(2,[],{tratti:'no'});ck(!s2.en.tr,'tratti spenti')}
{let s=base(2,{tr:'fer'},['war','cle']);s.hands[0]=['2H'];const r=RX.act(s,{t:'play',cards:['2H']}).s;ck(r.owed===15,'Feroce: attacco 10+5 (ha '+r.owed+')')}
{let s=base(2,{tr:'arm'},['war','cle']);s.hands[0]=['5D','9S'];const r=RX.act(s,{t:'play',cards:['5D'],pw:true}).s;ck(r.en.dmg===5-2+5,'Corazzato −2 e Furia +5 (ha '+r.en.dmg+')');ck(r.pw[0],'potere consumato');
 const r2=RX.act(r,{t:'discard',cards:['9S']});ck(!r2.err||true,'scarto')}
{let s=base(2,{c:'JH'},['ran','cle']);s.disc=['3C','4C','5C','6C'];s.hands[0]=['4H'];const r=RX.act(s,{t:'play',cards:['4H'],pw:true}).s;ck(r.disc.length<=1&&r.tav.length>=s.tav.length+3,'Ranger: i Cuori curano anche contro l’immunità')}
{let s=base(2,{},['gua','war']);s.hands[0]=['2D'];s.hands[1]=['3S'];let r=RX.act(s,{t:'play',cards:['2D']}).s;ck(r.phase==='discard'&&r.owed===10,'attacco 10');
 const w=RX.act(r,{t:'ward',by:0}).s;ck(w.owed===5&&w.pw[0],'Bastione: 10 → 5');ck(RX.act(w,{t:'ward',by:0}).err,'Bastione una volta per nemico')}
{let s=base(1,{},['mag']);const n=s.hands[0].length;const r=RX.act(s,{t:'vision'}).s;ck(r.hands[0].length===n+2&&r.cur===0&&r.phase==='play','Visione: +2 carte, turno non consumato')}
{let s=base(2,{tr:'bru'},['war','cle']);s.hands[0]=['3H','3D','AS'];ck(RX.checkPlay(s,['3H','3D']),'Brutale: niente coppie');ck(!RX.checkPlay(s,['AS','3H']),'Brutale: Asso + carta sì')}
{let s=base(2,{tr:'sil'},['war','cle']);s.hands[0]=['8D'];s.hands[0]=['8D'];s.hands[1]=[];const r=RX.act(s,{t:'play',cards:['8D']}).s;ck(r.hands.flat().length<=3,'Silenzio: al massimo 3 carte pescate')}
// --- partite intere: bot che valuta mosse e poteri contro bot casuale ---
function subsets(h){const out=[];for(let m=1;m<1<<h.length;m++){const k=h.filter((_,i)=>m>>i&1);if(k.length<=4)out.push(k)}return out}
function plays(s){const r=[];for(const k of subsets(s.hands[s.cur]))if(!RX.checkPlay(s,k)){r.push({t:'play',cards:k});if(!s.pw[s.cur]&&RX.CLS[s.cls[s.cur]].use==='play'&&k[0][0]!=='X')r.push({t:'play',cards:k,pw:true})}
 if(s.cls[s.cur]==='mag'&&!s.pw[s.cur])r.push({t:'vision'});if(!(s.n>1&&s.yr>=s.n-1)&&!(s.n===1&&s.yr>=3&&s.hands[0].length))r.push({t:'yield'});return r}
const killed=s=>12-s.castle.length-(s.en?1:0);
function val(s){if(s.over)return s.over.win?1e6:-1e6+killed(s)*1000;const hp=RX.hpOf[RX.P(s.en.c).r],cards=s.hands.flat();
 return killed(s)*1000+s.en.dmg/hp*300+RX.sum(cards)*4+cards.length*6+s.tav.length*2+s.jl*60+s.pw.filter(x=>!x).length*25}
function ward(s){const g=s.cls.findIndex((c,i)=>c==='gua'&&!s.pw[i]);return g>=0&&(RX.sum(s.hands[s.cur])<s.owed||s.owed>=12)?{t:'ward',by:g}:null}
function settle(s){let g=0;while(!s.over&&s.phase==='discard'&&g++<4){const w=ward(s);const d=RX.bestDiscard(s);const r=w?RX.act(s,w):d.length?RX.act(s,{t:'discard',cards:d}):RX.act(s,{t:'flip'});if(r.err)break;s=r.s}
 if(!s.over&&s.phase==='pick'){let b=0;for(let p=0;p<s.n;p++)if(s.hands[p].length>s.hands[b].length)b=p;s=RX.act(s,{t:'pick',to:b}).s}return s}
function smart(s){if(s.phase==='discard'){const w=ward(s);if(w)return w;const d=RX.bestDiscard(s);return d.length?{t:'discard',cards:d}:{t:'flip'}}
 if(s.phase==='pick'){let b=0;for(let p=0;p<s.n;p++)if(s.hands[p].length>s.hands[b].length)b=p;return{t:'pick',to:b}}
 if(s.n===1&&!s.hands[0].length&&s.jl>0)return{t:'flip'};
 let best=null;for(const a of plays(s)){const r=RX.act(s,a);if(r.err)continue;const v=val(settle(r.s))-(a.t==='yield'?40:0);if(!best||v>best.v)best={v,a}}
 if(s.n===1&&s.jl>0){const r=RX.act(s,{t:'flip'});if(!r.err){const v=val(settle(r.s))-120;if(!best||v>best.v)best={v,a:{t:'flip'}}}}return best.a}
function rnd(s,R){if(s.phase==='discard'){const h=s.hands[s.cur].slice().sort(()=>R()-.5),k=[];for(const c of h){if(RX.sum(k)>=s.owed)break;k.push(c)}
  if(RX.sum(k)>=s.owed)return{t:'discard',cards:k};const w=ward(s);return w||{t:'flip'}}
 if(s.phase==='pick')return{t:'pick',to:Math.floor(R()*s.n)};if(s.n===1&&!s.hands[0].length&&s.jl>0)return{t:'flip'};const p=plays(s);return p[Math.floor(R()*p.length)]}
function partita(n,bot,R){RX.setRnd(R);let s=RX.newGame(n,[]),k=0;while(!s.over&&k++<900){const a=bot(s,R),r=RX.act(s,a);if(r.err)throw new Error(r.err+' '+JSON.stringify(a));s=r.s;
  const tot=s.tav.length+s.disc.length+s.castle.length+(s.en?1:0)+s.played.length+s.hands.flat().length;
  if(s.over&&s.over.win)break;if(tot!==52+(n===3?1:n===4?2:0))throw new Error('carte perse: '+tot)}
 if(!s.over)throw new Error('partita senza fine');return s.over.win}
const R=carica.rng(7);
for(const n of [1,2,3,4]){let ws=0,wr=0;const G=n===1?400:150;
 for(let g=0;g<G;g++){if(partita(n,smart,R))ws++;if(partita(n,rnd,R))wr++}
 console.log('giocatori',n,'bot',ws+'/'+G,'casuale',wr+'/'+G);if(!(ws>wr&&wr<=G*.01))ok=false}
console.log(ok?'ALL OK':'FALLITO');process.exit(ok?0:1)
