/* Regicidio X: Regicidio con classi degli eroi e tratti dei boss.
   Stesse carte, stessi semi e stesso flusso di 01-regicide.js; in più:
   - ogni giocatore ha una classe con un potere da usare una volta per nemico;
   - Regine e Re hanno un tratto speciale (corazza, rigenerazione, maledizione...); i Fanti no.
   API come gli altri motori: newGame(n,names,opts) -> stato; act(stato,azione) -> {s}|{err}.
   opts.tratti===false toglie i tratti; opts.cls fissa le classi (altrimenti a caso, tutte diverse). */
const RGX=(()=>{
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

/* classi degli eroi: ic = icona dell'interfaccia (01b-icone.js), use = quando si usa il potere */
const CLS={
 war:{n:'Guerriero',ic:'spada',p:'Furia',d:'Giocando le carte infliggi 5 danni in più.',use:'play'},
 cle:{n:'Chierico',ic:'croce',p:'Preghiera',d:'Giocando le carte, 3 carte dagli Scarti tornano nella Taverna, anche contro l’immunità ai Cuori.',use:'play'},
 ran:{n:'Ranger',ic:'freccia',p:'Colpo mirato',d:'Giocando le carte ignori le immunità del nemico.',use:'play'},
 gua:{n:'Guardiano',ic:'scudo',p:'Bastione',d:'Quando tu o un alleato subite un attacco, il danno cala di 5.',use:'ward'},
 mag:{n:'Mago',ic:'scintilla',p:'Visione',d:'Peschi 2 carte dalla Taverna, anche oltre il limite della mano. Non consuma il turno.',use:'vision'}};
const CLSIDS=Object.keys(CLS);

/* tratti dei nemici */
const TR={
 arm:{n:'Corazzato',ic:'scudo',d:'Ogni attacco che subisce fa 2 danni in meno (minimo 1).'},
 reg:{n:'Rigenerante',ic:'cuore',d:'Quando attacca recupera 5 danni.'},
 fer:{n:'Feroce',ic:'fuoco',d:'Il suo attacco aumenta di 5.'},
 spi:{n:'Spinoso',ic:'pugnale',d:'Chi cede subisce 5 danni in più.'},
 dup:{n:'Doppia immunità',ic:'bersaglio',d:'È immune anche a un secondo seme.'},
 mal:{n:'Maledizione',ic:'teschio',d:'Quando attacca, 2 carte della Taverna finiscono negli Scarti.'},
 ant:{n:'Anti-scudo',ic:'x',d:'Le Picche riducono il suo attacco solo della metà (per difetto).'},
 sil:{n:'Silenzio',ic:'luna',d:'Le Quadri fanno pescare al massimo 3 carte.'},
 bru:{n:'Brutale',ic:'spada',d:'Niente combo: una carta sola, oppure un Animale (Asso) con un’altra carta.'}};
const TRIDS=Object.keys(TR);

const hs=s=>HAND[s.n];
const atkBase=en=>atOf[P(en.c).r]+(en.tr==='fer'?5:0);
const imms=en=>en.can?[]:[P(en.c).s,en.im2].filter(Boolean);
function trQueue(){const q=[];while(q.length<12)q.push(...shuffle(TRIDS.slice()));return q.slice(0,12)}
function nextEn(s){const c=s.castle.shift(),en={c,dmg:0,sh:0,sp:0,can:false,tr:'',im2:''};
 if(s.tratti&&P(c).r!=='J')en.tr=s.trq.shift()||''; /* i Fanti (primo atto) non hanno tratti: si impara il gioco */
 if(en.tr==='dup'){const o=[...SU].filter(x=>x!==P(c).s);en.im2=o[Math.floor(RND()*o.length)]}
 return en}
const trTxt=en=>en.tr?' ('+TR[en.tr].n+')':'';

function newGame(n,names,opts){opts=opts||{};
 const tav=[];for(const s of SU){for(let r=2;r<=10;r++)tav.push(r+s);tav.push('A'+s)}
 const jn=n===3?1:n===4?2:0;for(let i=1;i<=jn;i++)tav.push('X'+i);shuffle(tav);
 const castle=[];for(const r of 'JQK')castle.push(...shuffle([...SU].map(x=>r+x)));
 const cls=Array.isArray(opts.cls)&&opts.cls.length===n&&opts.cls.every(c=>CLS[c])?opts.cls.slice():shuffle(CLSIDS.slice()).slice(0,n);
 const s={n,names:Array.from({length:n},(_,i)=>names[i]||'Giocatore '+(i+1)),hands:Array.from({length:n},()=>[]),tav,disc:[],castle,played:[],en:null,cur:0,phase:'play',owed:0,yr:0,
  jl:n===1?2:0,uj:0,cls,pw:Array(n).fill(false),tratti:opts.tratti!==false&&opts.tratti!=='no',trq:trQueue(),log:[],over:null,ev:[],evn:0};
 s.en=nextEn(s);
 for(let k=0;k<HAND[n];k++)for(let p=0;p<n;p++)s.hands[p].push(s.tav.pop());
 L(s,'Inizia la partita. Primo nemico: '+fmt(s.en.c)+trTxt(s.en));return s}

function checkPlay(s,cards){
 if(s.phase!=='play')return 'Non è il momento di giocare carte';
 if(!cards||!cards.length)return 'Seleziona almeno una carta';
 const h=s.hands[s.cur];if(new Set(cards).size!==cards.length||cards.some(c=>!h.includes(c)))return 'Carte non valide';
 if(cards.length===1)return null;
 if(cards.some(c=>c[0]==='X'))return 'Il Jolly si gioca da solo';
 const hasA=cards.some(c=>P(c).r==='A');
 if(s.en&&s.en.tr==='bru'&&!(hasA&&cards.length===2))return 'Nemico Brutale: niente combo';
 if(hasA)return cards.length===2?null:'Un Animale (Asso) si abbina a una sola altra carta';
 const r=P(cards[0]).r;if(cards.some(c=>P(c).r!==r))return 'Le combo richiedono carte dello stesso valore (o un Asso + una carta)';
 if(cards.length>4)return 'Massimo 4 carte';
 if(sum(cards)>10)return 'Il totale di una combo non può superare 10';return null}
function heal(s,k){shuffle(s.disc);const m=s.disc.splice(0,Math.min(k,s.disc.length));s.tav.unshift(...m);return m.length}
function draw(s,k){let i=s.cur,stuck=0,got=0;
 while(k>0&&s.tav.length&&stuck<s.n){if(s.hands[i].length<hs(s)){s.hands[i].push(s.tav.pop());k--;got++;stuck=0}else stuck++;i=(i+1)%s.n}return got}
function lose(s,why){s.over={win:false,reason:why};E(s,{t:'lose'});L(s,'SCONFITTA: '+why)}
function endTurn(s){s.cur=(s.cur+1)%s.n;E(s,{t:'turn',p:s.cur});s.phase='play';s.owed=0;
 if(s.n===1&&!s.hands[0].length&&s.jl<1)return lose(s,'Mano vuota e nessun Jolly: il castello resiste');
 if(s.n>1&&s.yr>=s.n-1&&!s.hands[s.cur].length)lose(s,s.names[s.cur]+' non può né giocare né cedere')}
const wardAvail=s=>s.cls.some((c,i)=>c==='gua'&&!s.pw[i]);
function checkDeath(s){if(sum(s.hands[s.cur])<s.owed&&!(s.n===1&&s.jl>0)&&!wardAvail(s))lose(s,s.names[s.cur]+' deve scartare '+s.owed+' ma in mano ha solo '+sum(s.hands[s.cur]))}
function beginDamage(s,pen){const en=s.en;
 if(en.tr==='reg'&&en.dmg>0){const b=Math.min(5,en.dmg);en.dmg-=b;L(s,fmt(en.c)+' si rigenera di '+b);E(s,{t:'regen',v:b})}
 if(en.tr==='mal'){let k=0;while(k<2&&s.tav.length){s.disc.push(s.tav.shift());k++}if(k){L(s,'Maledizione: '+k+' carte dalla Taverna agli Scarti');E(s,{t:'curse',v:k})}}
 s.owed=Math.max(0,atkBase(en)+(pen||0)-en.sh);
 if(!s.owed){L(s,'Il nemico non infligge danni (scudo)');E(s,{t:'block'});return endTurn(s)}
 E(s,{t:'atk',v:s.owed,p:s.cur});
 s.phase='discard';L(s,s.names[s.cur]+' deve scartare almeno '+s.owed);checkDeath(s)}
function defeat(s,exact){
 s.disc.push(...s.played);s.played=[];
 E(s,{t:'kill',exact:!!exact,c:s.en.c});
 if(exact){s.tav.push(s.en.c);L(s,'Danno esatto! '+fmt(s.en.c)+' va in cima alla Taverna')}else{s.disc.push(s.en.c);L(s,fmt(s.en.c)+' sconfitto')}
 s.yr=0;
 if(!s.castle.length){s.en=null;s.over={win:true,medal:s.n===1?['gold','silver','bronze'][s.uj]:null};L(s,'VITTORIA! Il castello è liberato');E(s,{t:'win'});return}
 s.en=nextEn(s);s.pw=Array(s.n).fill(false);s.phase='play';E(s,{t:'next',c:s.en.c});L(s,'Nuovo nemico: '+fmt(s.en.c)+trTxt(s.en)+' · poteri ricaricati')}
/* effetti di una giocata, calcolo puro (anteprima e giocata vera) */
function eff(s,cards,pw){
 const en=s.en,cl=s.cls[s.cur],atk=sum(cards),suits=new Set(cards.map(c=>P(c).s));
 const usePw=!!pw&&!!cl&&CLS[cl].use==='play'&&!s.pw[s.cur];
 const im=usePw&&cl==='ran'?[]:imms(en),has=x=>suits.has(x)&&!im.includes(x);
 const healN=(has('H')?atk:0)+(usePw&&cl==='cle'?3:0);
 const drawN=has('D')?(en.tr==='sil'?Math.min(atk,3):atk):0;
 let hit=has('C')?2*atk:atk;if(en.tr==='arm')hit=Math.max(1,hit-2);if(usePw&&cl==='war')hit+=5;
 const sb=en.tr==='ant'?Math.floor(atk/2):atk;
 return{atk,suits,im,healN,drawN,hit,shv:has('S')?sb:0,spv:suits.has('S')?sb:0,usePw,cl,x2:has('C')}}
function doPlay(s,cards,pw){
 const e=checkPlay(s,cards);if(e)return e;const nm=s.names[s.cur],cl=s.cls[s.cur];
 if(pw){if(!cl||CLS[cl].use!=='play')return 'La tua classe non ha un potere da usare con l’attacco';if(s.pw[s.cur])return 'Hai già usato il potere contro questo nemico';if(cards[0][0]==='X')return 'Il Jolly non si combina con i poteri'}
 const h=s.hands[s.cur];for(const c of cards)h.splice(h.indexOf(c),1);s.played.push(...cards);s.yr=0;
 if(cards[0][0]==='X'){s.en.can=true;s.en.sh=s.en.sp;s.phase='pick';E(s,{t:'play',p:s.cur,c:cards});E(s,{t:'jester'});L(s,nm+' gioca il Jolly: immunità annullata');return null}
 const f=eff(s,cards,pw);
 if(f.usePw){s.pw[s.cur]=true;E(s,{t:'power',p:s.cur,k:cl});L(s,nm+' usa '+CLS[cl].p)}
 L(s,nm+' gioca '+cards.map(fmt).join(' ')+' (attacco '+f.atk+')');
 E(s,{t:'play',p:s.cur,c:cards});for(const x of f.im)if(f.suits.has(x))E(s,{t:'imm',s:x});
 if(f.healN)E(s,{t:'heal',v:heal(s,f.healN)});
 if(f.drawN)E(s,{t:'draw',v:draw(s,f.drawN)});
 s.en.dmg+=f.hit;E(s,{t:'hit',v:f.hit,x2:f.x2});
 if(f.shv){s.en.sh+=f.shv;E(s,{t:'shield',v:f.shv})}if(f.spv)s.en.sp+=f.spv;
 const hp=hpOf[P(s.en.c).r];
 if(s.en.dmg>=hp)defeat(s,s.en.dmg===hp);else beginDamage(s,0);return null}
function doYield(s){if(s.phase!=='play')return 'Non puoi cedere ora';
 if(s.n>1&&s.yr>=s.n-1)return 'Non puoi cedere: tutti gli altri hanno ceduto';
 s.yr++;L(s,s.names[s.cur]+' cede');E(s,{t:'yield',p:s.cur});beginDamage(s,s.en.tr==='spi'?5:0);return null}
function doDisc(s,cards){if(s.phase!=='discard')return 'Nessun danno da subire';
 const h=s.hands[s.cur];if(!cards||new Set(cards).size!==cards.length||cards.some(c=>!h.includes(c)))return 'Carte non valide';
 if(sum(cards)<s.owed)return 'Devi scartare almeno '+s.owed+' (selezionati '+sum(cards)+')';
 for(const c of cards)h.splice(h.indexOf(c),1);s.disc.push(...cards);E(s,{t:'disc',p:s.cur,c:cards});L(s,s.names[s.cur]+' scarta '+cards.map(fmt).join(' '));endTurn(s);return null}
function doPick(s,to){if(s.phase!=='pick')return 'Scelta non richiesta';if(!(to>=0&&to<s.n))return 'Giocatore non valido';
 s.cur=to;s.phase='play';E(s,{t:'turn',p:to});L(s,'Tocca a '+s.names[to]);
 if(s.n>1&&s.yr>=s.n-1&&!s.hands[to].length)lose(s,s.names[to]+' non può né giocare né cedere');return null}
function doFlip(s){if(s.n!==1||s.jl<1)return 'Nessun Jolly disponibile';if(s.phase!=='play'&&s.phase!=='discard')return 'Non ora';
 s.disc.push(...s.hands[0]);s.hands[0]=[];while(s.hands[0].length<hs(s)&&s.tav.length)s.hands[0].push(s.tav.pop());
 s.jl--;s.uj++;E(s,{t:'flip'});L(s,'Jolly: mano scartata e ripescata');if(s.phase==='discard')checkDeath(s);return null}
function doWard(s,by){if(s.phase!=='discard')return 'Il Bastione si usa quando qualcuno subisce un attacco';
 if(!(by>=0&&by<s.n)||s.cls[by]!=='gua')return 'Solo il Guardiano può alzare il Bastione';if(s.pw[by])return 'Bastione già usato contro questo nemico';
 s.pw[by]=true;const was=s.owed;s.owed=Math.max(0,s.owed-5);E(s,{t:'power',p:by,k:'gua'});L(s,s.names[by]+' alza il Bastione: danno '+was+' → '+s.owed);
 if(!s.owed){E(s,{t:'block'});return endTurn(s)}
 checkDeath(s);return null}
function doVision(s){if(s.phase!=='play')return 'La Visione si usa quando è il tuo turno di gioco';
 if(s.cls[s.cur]!=='mag')return 'Solo il Mago ha la Visione';if(s.pw[s.cur])return 'Visione già usata contro questo nemico';
 s.pw[s.cur]=true;let k=0;while(k<2&&s.tav.length){s.hands[s.cur].push(s.tav.pop());k++}
 E(s,{t:'power',p:s.cur,k:'mag'});E(s,{t:'draw',v:k});L(s,s.names[s.cur]+' ha una Visione: pesca '+k+' carte');return null}
function act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];let e;
 switch(a.t){case'play':e=doPlay(s,a.cards,!!a.pw);break;case'yield':e=doYield(s);break;case'discard':e=doDisc(s,a.cards);break;case'pick':e=doPick(s,a.to);break;
  case'flip':e=doFlip(s);break;case'ward':e=doWard(s,a.by);break;case'vision':e=doVision(s);break;default:e='Azione sconosciuta'}
 if(e)return{err:e};s.evn=(s.evn||0)+1;return{s}}
function preview(s,cards,pw){if(checkPlay(s,cards))return null;if(cards[0][0]==='X')return{jester:true,atk:0,dmg:0};
 const f=eff(s,cards,pw);let dr=0;
 if(f.drawN){let free=0;s.hands.forEach((h,i)=>{free+=Math.max(0,hs(s)-(i===s.cur?h.length-cards.length:h.length))});dr=Math.min(f.drawN,free,s.tav.length+Math.min(f.healN,s.disc.length))}
 return{atk:f.atk,dmg:f.hit,x2:f.x2,heal:f.healN,draw:dr,drawFull:f.drawN>0,shield:f.shv,ign:[...f.suits].filter(x=>f.im.includes(x)).join(''),pw:f.usePw}}
function bestDiscard(s){const h=s.hands[s.cur],n=h.length;let best=null;for(let m=1;m<1<<n;m++){let t=0,k=0;for(let i=0;i<n;i++)if(m>>i&1){t+=cv(h[i]);k++}if(t<s.owed)continue;const key=(t-s.owed)*100+k*10+t/100;if(!best||key<best.key)best={key,m}}
 return best?h.filter((_,i)=>best.m>>i&1):[]}
return{preview,bestDiscard,newGame,act,checkPlay,P,cv,sum,SYM,HAND,hpOf,atOf,fmt,clone,CLS,CLSIDS,TR,TRIDS,atkBase,imms,wardAvail,setRnd:f=>{RND=f}}})();
