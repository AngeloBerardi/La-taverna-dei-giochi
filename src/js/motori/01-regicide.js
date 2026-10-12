const RG=(()=>{
const SU='HDCS',SYM={H:'♥',D:'♦',C:'♣',S:'♠'};
const HAND=[0,8,7,6,5],hpOf={J:20,Q:30,K:40},atOf={J:10,Q:15,K:20};
let RND=Math.random;
const P=c=>c[0]==='X'?{r:'X',s:''}:{r:c.slice(0,-1),s:c.slice(-1)};
const cv=c=>{const r=P(c).r;return r==='A'?1:r==='J'?10:r==='Q'?15:r==='K'?20:r==='X'?0:+r};
const clone=o=>JSON.parse(JSON.stringify(o));
const sum=a=>a.reduce((t,c)=>t+cv(c),0);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const fmt=c=>c[0]==='X'?'Jolly':P(c).r+SYM[P(c).s];
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};
const E=(s,o)=>s.ev.push(o);
const nextEn=s=>({c:s.castle.shift(),dmg:0,sh:0,sp:0,can:false});
function newGame(n,names){
 const tav=[];for(const s of SU){for(let r=2;r<=10;r++)tav.push(r+s);tav.push('A'+s)}
 const jn=n===3?1:n===4?2:0;for(let i=1;i<=jn;i++)tav.push('X'+i);shuffle(tav);
 const castle=[];for(const r of 'JQK')castle.push(...shuffle([...SU].map(x=>r+x)));
 const s={n,names:Array.from({length:n},(_,i)=>names[i]||'Giocatore '+(i+1)),hands:Array.from({length:n},()=>[]),tav,disc:[],castle,played:[],en:null,cur:0,phase:'play',owed:0,yr:0,jl:n===1?2:0,uj:0,log:[],over:null,ev:[],evn:0};
 s.en=nextEn(s);
 for(let k=0;k<HAND[n];k++)for(let p=0;p<n;p++)s.hands[p].push(s.tav.pop());
 L(s,'Inizia la partita. Primo nemico: '+fmt(s.en.c));return s}
function checkPlay(s,cards){
 if(s.phase!=='play')return 'Non è il momento di giocare carte';
 if(!cards||!cards.length)return 'Seleziona almeno una carta';
 const h=s.hands[s.cur];if(new Set(cards).size!==cards.length||cards.some(c=>!h.includes(c)))return 'Carte non valide';
 if(cards.length===1)return null;
 if(cards.some(c=>c[0]==='X'))return 'Il Jolly si gioca da solo';
 if(cards.some(c=>P(c).r==='A')){return cards.length===2?null:'Un Animale (Asso) si abbina a una sola altra carta'}
 const r=P(cards[0]).r;if(cards.some(c=>P(c).r!==r))return 'Le combo richiedono carte dello stesso valore (o un Asso + una carta)';
 if(cards.length>4)return 'Massimo 4 carte';
 if(sum(cards)>10)return 'Il totale di una combo non può superare 10';return null}
function heal(s,k){shuffle(s.disc);const m=s.disc.splice(0,Math.min(k,s.disc.length));s.tav.unshift(...m);return m.length}
function draw(s,k){let i=s.cur,stuck=0,got=0;
 while(k>0&&s.tav.length&&stuck<s.n){if(s.hands[i].length<HAND[s.n]){s.hands[i].push(s.tav.pop());k--;got++;stuck=0}else stuck++;i=(i+1)%s.n}return got}
function lose(s,why){s.over={win:false,reason:why};E(s,{t:'lose'});L(s,'SCONFITTA: '+why)}
function endTurn(s){s.cur=(s.cur+1)%s.n;E(s,{t:'turn',p:s.cur});s.phase='play';s.owed=0;
 if(s.n===1&&!s.hands[0].length&&s.jl<1)return lose(s,'Mano vuota e nessun Jolly: il castello resiste');
 if(s.n>1&&s.yr>=s.n-1&&!s.hands[s.cur].length)lose(s,s.names[s.cur]+' non può né giocare né cedere')}
function beginDamage(s){const rk=P(s.en.c).r;s.owed=Math.max(0,atOf[rk]-s.en.sh);
 if(!s.owed){L(s,'Il nemico non infligge danni (scudo)');E(s,{t:'block'});return endTurn(s)}
 E(s,{t:'atk',v:s.owed,p:s.cur});
 s.phase='discard';L(s,s.names[s.cur]+' deve scartare almeno '+s.owed);checkDeath(s)}
function checkDeath(s){if(sum(s.hands[s.cur])<s.owed&&!(s.n===1&&s.jl>0))lose(s,s.names[s.cur]+' deve scartare '+s.owed+' ma in mano ha solo '+sum(s.hands[s.cur]))}
function defeat(s,exact){
 s.disc.push(...s.played);s.played=[];
 E(s,{t:'kill',exact:!!exact,c:s.en.c});
 if(exact){s.tav.push(s.en.c);L(s,'Danno esatto! '+fmt(s.en.c)+' va in cima alla Taverna')}else{s.disc.push(s.en.c);L(s,fmt(s.en.c)+' sconfitto')}
 s.yr=0;
 if(!s.castle.length){s.en=null;s.over={win:true,medal:s.n===1?['gold','silver','bronze'][s.uj]:null};L(s,'VITTORIA! Il castello è liberato');E(s,{t:'win'});return}
 s.en=nextEn(s);s.phase='play';E(s,{t:'next',c:s.en.c});L(s,'Nuovo nemico: '+fmt(s.en.c))}
function doPlay(s,cards){
 const e=checkPlay(s,cards);if(e)return e;const nm=s.names[s.cur];
 const h=s.hands[s.cur];for(const c of cards)h.splice(h.indexOf(c),1);s.played.push(...cards);s.yr=0;
 if(cards[0][0]==='X'){s.en.can=true;s.en.sh=s.en.sp;s.phase='pick';E(s,{t:'play',p:s.cur,c:cards});E(s,{t:'jester'});L(s,nm+' gioca il Jolly: immunità annullata');return null}
 const atk=sum(cards),suits=new Set(cards.map(c=>P(c).s)),imm=s.en.can?'':P(s.en.c).s;
 const has=x=>suits.has(x)&&imm!==x;
 L(s,nm+' gioca '+cards.map(fmt).join(' ')+' (attacco '+atk+')');
 E(s,{t:'play',p:s.cur,c:cards});if(imm&&suits.has(imm))E(s,{t:'imm',s:imm});
 if(has('H'))E(s,{t:'heal',v:heal(s,atk)});if(has('D'))E(s,{t:'draw',v:draw(s,atk)});
 const hit=has('C')?2*atk:atk;s.en.dmg+=hit;E(s,{t:'hit',v:hit,x2:has('C')});if(has('S')){s.en.sh+=atk;E(s,{t:'shield',v:atk})}if(suits.has('S'))s.en.sp+=atk;
 const hp=hpOf[P(s.en.c).r];
 if(s.en.dmg>=hp)defeat(s,s.en.dmg===hp);else beginDamage(s);return null}
function doYield(s){if(s.phase!=='play')return 'Non puoi cedere ora';
 if(s.n>1&&s.yr>=s.n-1)return 'Non puoi cedere: tutti gli altri hanno ceduto';
 s.yr++;L(s,s.names[s.cur]+' cede');E(s,{t:'yield',p:s.cur});beginDamage(s);return null}
function doDisc(s,cards){if(s.phase!=='discard')return 'Nessun danno da subire';
 const h=s.hands[s.cur];if(!cards||new Set(cards).size!==cards.length||cards.some(c=>!h.includes(c)))return 'Carte non valide';
 if(sum(cards)<s.owed)return 'Devi scartare almeno '+s.owed+' (selezionati '+sum(cards)+')';
 for(const c of cards)h.splice(h.indexOf(c),1);s.disc.push(...cards);E(s,{t:'disc',p:s.cur,c:cards});L(s,s.names[s.cur]+' scarta '+cards.map(fmt).join(' '));endTurn(s);return null}
function doPick(s,to){if(s.phase!=='pick')return 'Scelta non richiesta';if(!(to>=0&&to<s.n))return 'Giocatore non valido';
 s.cur=to;s.phase='play';E(s,{t:'turn',p:to});L(s,'Tocca a '+s.names[to]);
 if(s.n>1&&s.yr>=s.n-1&&!s.hands[to].length)lose(s,s.names[to]+' non può né giocare né cedere');return null}
function doFlip(s){if(s.n!==1||s.jl<1)return 'Nessun Jolly disponibile';if(s.phase!=='play'&&s.phase!=='discard')return 'Non ora';
 s.disc.push(...s.hands[0]);s.hands[0]=[];while(s.hands[0].length<8&&s.tav.length)s.hands[0].push(s.tav.pop());
 s.jl--;s.uj++;E(s,{t:'flip'});L(s,'Jolly: mano scartata e ripescata');if(s.phase==='discard')checkDeath(s);return null}
function act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];let e;
 switch(a.t){case'play':e=doPlay(s,a.cards);break;case'yield':e=doYield(s);break;case'discard':e=doDisc(s,a.cards);break;case'pick':e=doPick(s,a.to);break;case'flip':e=doFlip(s);break;default:e='Azione sconosciuta'}
 if(e)return{err:e};s.evn=(s.evn||0)+1;return{s}}
function preview(s,cards){if(checkPlay(s,cards))return null;if(cards[0][0]==='X')return{jester:true,atk:0,dmg:0};
 const atk=sum(cards),suits=new Set(cards.map(c=>P(c).s)),imm=s.en.can?'':P(s.en.c).s,has=x=>suits.has(x)&&imm!==x;
 let dr=0;if(has('D')){const cap=HAND[s.n];let free=0;s.hands.forEach((h,i)=>{free+=Math.max(0,cap-(i===s.cur?h.length-cards.length:h.length))});dr=Math.min(atk,free,s.tav.length+(has('H')?Math.min(atk,s.disc.length):0))}
 return{atk,dmg:has('C')?2*atk:atk,x2:has('C'),heal:has('H')?atk:0,draw:dr,drawFull:has('D'),shield:has('S')?atk:0,ign:imm&&suits.has(imm)?imm:''}}
function bestDiscard(s){const h=s.hands[s.cur],n=h.length;let best=null;for(let m=1;m<1<<n;m++){let t=0,k=0;for(let i=0;i<n;i++)if(m>>i&1){t+=cv(h[i]);k++}if(t<s.owed)continue;const key=(t-s.owed)*100+k*10+t/100;if(!best||key<best.key)best={key,m}}
 return best?h.filter((_,i)=>best.m>>i&1):[]}
return{preview,bestDiscard,newGame,act,checkPlay,P,cv,sum,SYM,HAND,hpOf,atOf,fmt,clone,setRnd:f=>{RND=f}}})();


/* Carte napoletane: semi C=Coppe D=Denari S=Spade B=Bastoni; ranghi 1-7, F(8) C(9) R(10) */
