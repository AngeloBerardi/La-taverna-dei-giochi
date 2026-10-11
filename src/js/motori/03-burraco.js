const BURR=(()=>{
let RND=Math.random;const SU='HDCS',RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));
const P=c=>{if(c.includes('X'))return{j:true,r:0,s:'',rk:'X'};const b=c.slice(1),rk=b.slice(0,-1),s=b.slice(-1);return{j:false,r:RK.indexOf(rk)+1,s,rk}};
const PTS=c=>{const p=P(c);return p.j?30:p.r===2?20:p.r===1?15:p.r>=8?10:5};
const SYM={H:'♥',D:'♦',C:'♣',S:'♠'};const fmt=c=>{const p=P(c);return p.j?'Jolly':p.rk+SYM[p.s]};
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};
const team=(s,i)=>i%2;
function validSet(cards){if(cards.length<3)return null;const nat=cards.filter(c=>{const p=P(c);return!p.j&&p.r!==2}),w=cards.length-nat.length;
 if(w>1||!nat.length)return null;const r=P(nat[0]).r;if(nat.some(c=>P(c).r!==r))return null;
 return{t:'set',r,cards:[...nat.sort(),...cards.filter(c=>!nat.includes(c))],wild:w>0}}
function validSeq(cards){if(cards.length<3||cards.length>14)return null;
 const fixed=cards.filter(c=>{const p=P(c);return!p.j&&p.r!==2&&p.r!==1}),suit=fixed.length?P(fixed[0]).s:null;
 if(fixed.some(c=>P(c).s!==suit))return null;
 const twos=cards.filter(c=>!P(c).j&&P(c).r===2),aces=cards.filter(c=>P(c).r===1),jok=cards.filter(c=>P(c).j);
 let best=null;
 const tryIt=(twoNat,aceHigh)=>{ // twoNat: bitmask over twos; aceHigh: bitmask over aces
  const s0=suit||[...twos,...aces].map(c=>P(c).s).find((x,i)=>true);
  const pos=[],wild=[...jok];let su=suit;
  for(let i=0;i<twos.length;i++){if(twoNat>>i&1){const p=P(twos[i]);if(su&&p.s!==su)return;su=su||p.s;pos.push([2,twos[i]])}else wild.push(twos[i])}
  for(let i=0;i<aces.length;i++){const p=P(aces[i]);if(su&&p.s!==su)return;su=su||p.s;pos.push([aceHigh>>i&1?14:1,aces[i]])}
  for(const c of fixed)pos.push([P(c).r,c]);
  if(wild.length>1||!pos.length)return;if(pos.some(([,c])=>P(c).s!==su))return;
  pos.sort((a,b)=>a[0]-b[0]);for(let i=1;i<pos.length;i++)if(pos[i][0]===pos[i-1][0])return;
  const lo=pos[0][0],hi=pos[pos.length-1][0],gaps=hi-lo+1-pos.length;if(gaps>wild.length)return;
  const out=[];let wpos=null;
  if(gaps===1){for(let v=lo;v<=hi;v++){const f=pos.find(x=>x[0]===v);if(f)out.push(f[1]);else{out.push(wild[0]);wpos=v}}}
  else{pos.forEach(x=>out.push(x[1]));if(wild.length){if(hi<14){out.push(wild[0]);wpos=hi+1}else if(lo>1){out.unshift(wild[0]);wpos=lo-1}else return}}
  const cand={t:'seq',s:su,cards:out,wild:wild.length>0,lo:Math.min(lo,wpos??lo)};
  if(!best||(best.wild&&!cand.wild))best=cand};
 for(let m=0;m<1<<twos.length;m++)for(let k=0;k<1<<aces.length;k++)tryIt(m,k);
 return best}
function validate(cards,type){if(type==='set')return validSet(cards);if(type==='seq')return validSeq(cards);return validSeq(cards)||validSet(cards)}
const isBurraco=m=>m.cards.length>=7;
function meldPts(m){return m.cards.reduce((t,c)=>t+PTS(c),0)+(isBurraco(m)?(m.wild?100:200):0)}
const BURR={id:'burraco',name:'Burraco',ok:n=>n===2||n===4,P,PTS,fmt,validate,isBurraco,
 newGame(n,names,opts={}){const tgt=opts.target==='one'?0:(+opts.target||2005);const s={g:'burraco',n,names:names.slice(0,n),teams:2,target:tgt,scores:[0,0],round:0,dealer:n-1,log:[],ev:[],evn:0,over:null};BURR.deal(s);return s},
 deal(s){const d=[];for(const k of 'ab'){for(const su of SU)for(const r of RK)d.push(k+r+su);d.push(k+'X1',k+'X2')}shuffle(d);
  s.round++;s.dealer=(s.dealer+1)%s.n;s.hands=Array.from({length:s.n},()=>d.splice(0,11));s.pozz=[d.splice(0,11),d.splice(0,11)];s.pozzTaken=[false,false];
  s.disc=[d.pop()];s.deck=d;s.melds=[[],[]];s.cur=(s.dealer+1)%s.n;s.phase='draw';s.res=null;s.closer=null;L(s,'Mano '+s.round+' distribuita')},
 canClose(s,t){return s.pozzTaken[t]&&s.melds[t].some(isBurraco)},
 afterEmpty(s,viaDiscard){const t=team(s,s.cur);if(!s.pozzTaken[t]){s.pozzTaken[t]=true;s.hands[s.cur]=s.pozz.shift();s.ev.push({t:'pozz',p:s.cur,volo:!viaDiscard});L(s,s.names[s.cur]+' prende il pozzetto'+(viaDiscard?'':' al volo'));return true}return false},
 endRound(s,closed){const res=[0,1].map(t=>{const melds=s.melds[t].reduce((a,m)=>a+meldPts(m),0),bur=s.melds[t].filter(isBurraco);
   const hand=s.hands.reduce((a,h,i)=>a+(team(s,i)===t?h.reduce((x,c)=>x+PTS(c),0):0),0);
   const cards=s.melds[t].reduce((a,m)=>a+m.cards.reduce((x,c)=>x+PTS(c),0),0);
   return{cards,bonus:bur.reduce((a,m)=>a+(m.wild?100:200),0),close:closed===t?100:0,hand:-hand,pozz:s.pozzTaken[t]?0:-100}});
  res.forEach(r=>r.tot=r.cards+r.bonus+r.close+r.hand+r.pozz);res.forEach((r,t)=>s.scores[t]+=r.tot);s.res=res;s.phase='summary';s.ev.push({t:'round',closed});
  L(s,closed!=null?'Chiusura! Fine della mano':'Mazzo finito: fine della mano');
  const mx=Math.max(...s.scores);if(!s.target||(mx>=s.target&&s.scores[0]!==s.scores[1])){const w=s.scores[0]===s.scores[1]?null:s.scores.indexOf(mx);s.over={scores:s.scores.slice(),win:w};s.ev.push({t:w==null?'tie':'win'})}},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];const h=s.hands[s.cur],t=team(s,s.cur),nm=s.names[s.cur];
  const has=cs=>cs&&cs.length&&new Set(cs).size===cs.length&&cs.every(c=>h.includes(c));
  const rm=cs=>cs.forEach(c=>h.splice(h.indexOf(c),1));
  switch(a.t){
  case'next':if(s.phase!=='summary')return{err:'Non ora'};BURR.deal(s);s.ev.push({t:'deal'});break;
  case'draw':if(s.phase!=='draw')return{err:'Hai già pescato'};
   if(a.from==='disc'){if(!s.disc.length)return{err:'Il pozzo degli scarti è vuoto'};const n=s.disc.length;h.push(...s.disc);s.disc=[];s.ev.push({t:'drawdisc',p:s.cur,n});L(s,nm+' raccoglie gli scarti ('+n+')')}
   else{if(!s.deck.length)return{err:'Il mazzo è finito'};const c=s.deck.pop();h.push(c);s.ev.push({t:'drawdeck',p:s.cur});L(s,nm+' pesca dal mazzo')}
   s.phase='play';break;
  case'meld':{if(s.phase!=='play')return{err:'Prima devi pescare'};if(!has(a.cards))return{err:'Carte non valide'};const m=validate(a.cards);if(!m)return{err:'Combinazione non valida: servono almeno 3 carte in scala dello stesso seme o dello stesso valore, con al massimo un jolly o una pinella'};
   if(h.length===a.cards.length&&s.pozzTaken[t])return{err:'Devi tenere almeno una carta da scartare'};
   rm(a.cards);s.melds[t].push(m);if(s.pozzTaken[t]&&h.length===1&&(!BURR.canClose(s,t)||P(h[0]).j||P(h[0]).r===2))return{err:'Non puoi restare con una sola carta se non puoi chiudere scartandola (serve un burraco e una carta che non sia jolly o pinella)'};s.ev.push({t:'meld',p:s.cur,cards:m.cards,bur:isBurraco(m)});L(s,nm+' cala '+m.cards.map(fmt).join(' '));if(!h.length)BURR.afterEmpty(s,false);break}
  case'add':{if(s.phase!=='play')return{err:'Prima devi pescare'};if(!has(a.cards))return{err:'Carte non valide'};const old=s.melds[t][a.mi];if(!old)return{err:'Combinazione non trovata'};
   const m=validate([...old.cards,...a.cards],old.t);if(!m)return{err:'Queste carte non si attaccano a quella combinazione'};
   if(h.length===a.cards.length&&s.pozzTaken[t])return{err:'Devi tenere almeno una carta da scartare'};
   const was=isBurraco(old);rm(a.cards);s.melds[t][a.mi]=m;if(s.pozzTaken[t]&&h.length===1&&(!BURR.canClose(s,t)||P(h[0]).j||P(h[0]).r===2))return{err:'Non puoi restare con una sola carta se non puoi chiudere scartandola (serve un burraco e una carta che non sia jolly o pinella)'};s.ev.push({t:'add',p:s.cur,mi:a.mi,cards:a.cards,bur:!was&&isBurraco(m)});L(s,nm+' attacca '+a.cards.map(fmt).join(' '));if(!h.length)BURR.afterEmpty(s,false);break}
  case'discard':{if(s.phase!=='play')return{err:'Prima devi pescare'};if(!has([a.c]))return{err:'Carta non valida'};
   if(h.length===1&&s.pozzTaken[t]){if(!BURR.canClose(s,t))return{err:'Per chiudere serve almeno un burraco (7+ carte)'};const p=P(a.c);if(p.j||p.r===2)return{err:'Non puoi chiudere scartando un jolly o una pinella'}}
   rm([a.c]);s.disc.push(a.c);s.ev.push({t:'discard',p:s.cur,c:a.c});L(s,nm+' scarta '+fmt(a.c));
   if(!h.length){if(!BURR.afterEmpty(s,true)){s.closer=t;s.ev.push({t:'close',p:s.cur});BURR.endRound(s,t);break}}
   s.cur=(s.cur+1)%s.n;s.phase='draw';s.ev.push({t:'turn',p:s.cur});
   if(!s.deck.length){BURR.endRound(s,null)}break}
  default:return{err:'Azione sconosciuta'}}
  s.evn=(s.evn||0)+1;return{s}},
 setRnd:f=>{RND=f}};
return BURR})();


/* THE GANG – poker cooperativo (3-6). Carte: rango+seme (es. 'AH','10S'); 'JX' = Fante dello Specialista (senza seme).
   Adattamento digitale: i gettoni si prendono a turno in senso orario (prendi, ruba, scambia o passa); il round finisce quando tutti hanno un gettone e tutti passano di fila. */
