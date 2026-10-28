/* Regicidio X: Regicidio con classi degli eroi, tratti dei nemici e una campagna da solitario.
   - Classica (1–4): ogni giocatore ha una classe con un potere una volta per nemico; Regine e Re hanno un tratto.
   - Campagna (solo, opts.modo='campagna'): mappa ad albero di 8 piani (scontri, élite, fucina, falò, tesori, boss),
     mazzo di 20 carte che cresce, sigilli sulle singole carte, artefatti passivi (fino a 5).
   API come gli altri motori: newGame(n,names,opts) -> stato; act(stato,azione) -> {s}|{err}.
   In campagna lo stato ha s.camp (la scalata) e s.fase: 'map' | 'choice' | 'fight'; gli scontri usano gli stessi campi della classica. */
const RGX=(()=>{
const SU='HDCS',SYM={H:'♥',D:'♦',C:'♣',S:'♠'};
const HAND=[0,8,7,6,5],hpOf={J:20,Q:30,K:40},atOf={J:10,Q:15,K:20};
let RND=Math.random;
const P=c=>c[0]==='X'?{r:'X',s:''}:{r:c.slice(0,-1),s:c.slice(-1)};
const cv=c=>{const r=P(c).r;return r==='A'?1:r==='J'?10:r==='Q'?15:r==='K'?20:r==='X'?0:+r};
const clone=o=>JSON.parse(JSON.stringify(o));
const sum=a=>a.reduce((t,c)=>t+cv(c),0);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const pick=a=>a[Math.floor(RND()*a.length)];
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
/* sigilli sulle carte (campagna) */
const SIG={
 aff:{n:'Affilata',ic:'pugnale',d:'Quando giochi questa carta: +3 danni.'},
 vam:{n:'Vampirica',ic:'cuore',d:'Quando giochi questa carta: 2 carte dagli Scarti tornano nella Taverna.'},
 ega:{n:'Egida',ic:'scudo',d:'Quando giochi questa carta: attacco del nemico −3, anche se è immune alle Picche.'},
 ras:{n:'Rapida',ic:'passi',d:'Quando giochi questa carta: peschi 1 carta.'},
 spe:{n:'Spettrale',ic:'luna',d:'Il seme di questa carta ignora le immunità del nemico.'}};
const SIGIDS=Object.keys(SIG);
/* artefatti passivi (campagna) */
const ART={
 rin:{n:'Anello del Boia',ic:'bersaglio',d:'Ogni attacco infligge 3 danni in più.'},
 cal:{n:'Calice Antico',ic:'coppa',d:'Ogni volta che curi, 2 carte in più tornano nella Taverna.'},
 bag:{n:'Borsa senza fondo',ic:'borsa',d:'Il limite di carte in mano aumenta di 1.'},
 occ:{n:'Occhio di vetro',ic:'globo',d:'Il primo attacco contro ogni nemico ignora le immunità.'},
 que:{n:'Scudo di quercia',ic:'bosco',d:'Ogni volta che le Picche funzionano, attacco del nemico −3 in più.'},
 cle:{n:'Clessidra',ic:'sole',d:'A inizio scontro peschi 2 carte in più.'},
 ace:{n:'Fortuna dell’Animale',ic:'star',d:'Ogni Asso (Animale) che giochi ti fa pescare 1 carta.'},
 ban:{n:'Stendardo di guerra',ic:'torre',d:'Le combo (2 o più carte) infliggono 4 danni in più.'},
 omb:{n:'Cappa d’ombra',ic:'luna',d:'L’attacco di ogni nemico è ridotto di 3.'},
 bil:{n:'Bilancia del Re',ic:'bilancia',d:'Danno esatto anche se superi la vita di 1 o 2 punti.'},
 dad:{n:'Dado truccato',ic:'dado',d:'Subito: +1 Jolly per la scalata.',meta:true},
 mon:{n:'Moneta del Mercante',ic:'moneta',d:'Ogni ricompensa offre una scelta in più.',meta:true}};
const ARTIDS=Object.keys(ART);
/* tappe della mappa */
const NODE={fight:{n:'Scontro',ic:'spada'},elite:{n:'Élite',ic:'teschio'},forge:{n:'Fucina',ic:'chiave'},rest:{n:'Falò',ic:'fuoco'},chest:{n:'Tesoro',ic:'tesoro'},boss:{n:'Boss',ic:'corona'}};
const LAYERS=8,MAXART=5,CHS=6;

/* ---------------- scontro ---------------- */
const hs=s=>s.hs||HAND[s.n];
const hpE=en=>en.hp||hpOf[P(en.c).r];
const atkBase=(en,s)=>(en.atk||atOf[P(en.c).r])+(en.tr==='fer'?5:0)-(s&&s.art&&s.art.includes('omb')?3:0);
const imms=en=>en.can?[]:[P(en.c).s,en.im2].filter(Boolean);
const arts=s=>s.art||[];
function trQueue(){const q=[];while(q.length<12)q.push(...shuffle(TRIDS.slice()));return q.slice(0,12)}
function nextEn(s){const sp=s.castle.shift(),spec=typeof sp==='string'?{c:sp}:sp,c=spec.c,en={c,dmg:0,sh:0,sp:0,can:false,tr:'',im2:'',used:false};
 if(spec.hp)en.hp=spec.hp;if(spec.atk)en.atk=spec.atk;
 if(spec.tr!==undefined)en.tr=spec.tr;else if(s.tratti&&P(c).r!=='J')en.tr=s.trq.shift()||''; /* i Fanti (primo atto) non hanno tratti */
 if(en.tr==='dup'){const o=[...SU].filter(x=>x!==P(c).s);en.im2=spec.im2||o[Math.floor(RND()*o.length)]}
 return en}
const trTxt=en=>en.tr?' ('+TR[en.tr].n+')':'';
/* prepara i campi di uno scontro su s (classica: mazzo intero e castello di 12; campagna: mazzo e nemico della scalata) */
function setupFight(s,o){
 let tav;if(o.deck)tav=shuffle(o.deck.slice());else{tav=[];for(const x of SU){for(let r=2;r<=10;r++)tav.push(r+x);tav.push('A'+x)}const jn=s.n===3?1:s.n===4?2:0;for(let i=1;i<=jn;i++)tav.push('X'+i);shuffle(tav)}
 let castle;if(o.castle)castle=o.castle.map(x=>typeof x==='string'?x:Object.assign({},x));else{castle=[];for(const r of 'JQK')castle.push(...shuffle([...SU].map(x=>r+x)))}
 s.art=(o.art||[]).slice();s.sig=Object.assign({},o.sig||{});s.hs=(o.hs||HAND[s.n])+(s.art.includes('bag')?1:0);
 Object.assign(s,{hands:Array.from({length:s.n},()=>[]),tav,disc:[],castle,played:[],en:null,cur:0,phase:'play',owed:0,yr:0,uj:0,pw:Array(s.n).fill(false),total:castle.length});
 s.en=nextEn(s);
 for(let k=0;k<s.hs;k++)for(let p=0;p<s.n;p++)if(s.tav.length)s.hands[p].push(s.tav.pop());
 if(s.art.includes('cle'))for(let k=0;k<2&&s.tav.length;k++)s.hands[0].push(s.tav.pop())}

function newGame(n,names,opts){opts=opts||{};const camp=opts.modo==='campagna'||opts.tratti==='campagna';
 const cls=Array.isArray(opts.cls)&&opts.cls.length===n&&opts.cls.every(c=>CLS[c])?opts.cls.slice():shuffle(CLSIDS.slice()).slice(0,n);
 const s={n,names:Array.from({length:n},(_,i)=>names[i]||'Giocatore '+(i+1)),hands:Array.from({length:n},()=>[]),tav:[],disc:[],castle:[],played:[],en:null,cur:0,phase:'play',owed:0,yr:0,
  jl:n===1?2:0,uj:0,cls,pw:Array(n).fill(false),tratti:opts.tratti!==false&&opts.tratti!=='no',trq:trQueue(),art:[],sig:{},log:[],over:null,ev:[],evn:0};
 if(camp){s.camp=newRun(cls[0]);s.fase='map';s.jl=s.camp.jl;L(s,'Inizia la scalata: scegli la prima tappa.');return s}
 setupFight(s,{});L(s,'Inizia la partita. Primo nemico: '+fmt(s.en.c)+trTxt(s.en));return s}

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
 s.owed=Math.max(0,atkBase(en,s)+(pen||0)-en.sh);
 if(!s.owed){L(s,'Il nemico non infligge danni (scudo)');E(s,{t:'block'});return endTurn(s)}
 E(s,{t:'atk',v:s.owed,p:s.cur});
 s.phase='discard';L(s,s.names[s.cur]+' deve scartare almeno '+s.owed);checkDeath(s)}
function defeat(s,exact){
 s.disc.push(...s.played);s.played=[];
 E(s,{t:'kill',exact:!!exact,c:s.en.c});
 if(exact){s.tav.push(s.en.c);L(s,'Danno esatto! '+fmt(s.en.c)+' va in cima alla Taverna')}else{s.disc.push(s.en.c);L(s,fmt(s.en.c)+' sconfitto')}
 s.yr=0;
 if(!s.castle.length){s.en=null;s.over={win:true,medal:s.n===1&&!s.camp?['gold','silver','bronze'][s.uj]:null};L(s,'VITTORIA! Il castello è liberato');E(s,{t:'win'});return}
 s.en=nextEn(s);s.pw=Array(s.n).fill(false);s.phase='play';E(s,{t:'next',c:s.en.c});L(s,'Nuovo nemico: '+fmt(s.en.c)+trTxt(s.en)+' · poteri ricaricati')}
/* effetti di una giocata, calcolo puro (anteprima e giocata vera) */
function eff(s,cards,pw){
 const en=s.en,cl=s.cls[s.cur],art=a=>arts(s).includes(a),sg=cards.map(c=>(s.sig||{})[c]).filter(Boolean),cnt=k=>sg.filter(x=>x===k).length;
 const atk=sum(cards),suits=new Set(cards.map(c=>P(c).s)),usePw=!!pw&&!!cl&&CLS[cl].use==='play'&&!s.pw[s.cur];
 const ghost=new Set(cards.filter(c=>(s.sig||{})[c]==='spe').map(c=>P(c).s));
 const omni=(usePw&&cl==='ran')||(art('occ')&&!en.used);
 const im=omni?[]:imms(en).filter(x=>!ghost.has(x)),has=x=>suits.has(x)&&!im.includes(x);
 let healN=(has('H')?atk:0)+(usePw&&cl==='cle'?3:0)+2*cnt('vam');if(healN&&art('cal'))healN+=2;
 const aces=cards.filter(c=>P(c).r==='A').length;
 const drawN=(has('D')?(en.tr==='sil'?Math.min(atk,3):atk):0)+cnt('ras')+(art('ace')?aces:0);
 let hit=has('C')?2*atk:atk;if(en.tr==='arm')hit=Math.max(1,hit-2);if(usePw&&cl==='war')hit+=5;hit+=3*cnt('aff');if(art('rin'))hit+=3;if(art('ban')&&cards.length>1)hit+=4;
 const sb=en.tr==='ant'?Math.floor(atk/2):atk,sq=art('que')?3:0;
 return{atk,suits,im,healN,drawN,hit,shv:(has('S')?sb+sq:0)+3*cnt('ega'),spv:(suits.has('S')?sb+sq:0)+3*cnt('ega'),usePw,cl,x2:has('C'),sg}}
function doPlay(s,cards,pw){
 const e=checkPlay(s,cards);if(e)return e;const nm=s.names[s.cur],cl=s.cls[s.cur];
 if(pw){if(!cl||CLS[cl].use!=='play')return 'La tua classe non ha un potere da usare con l’attacco';if(s.pw[s.cur])return 'Hai già usato il potere contro questo nemico';if(cards[0][0]==='X')return 'Il Jolly non si combina con i poteri'}
 const h=s.hands[s.cur];for(const c of cards)h.splice(h.indexOf(c),1);s.played.push(...cards);s.yr=0;
 if(cards[0][0]==='X'){s.en.can=true;s.en.sh=s.en.sp;s.phase='pick';E(s,{t:'play',p:s.cur,c:cards});E(s,{t:'jester'});L(s,nm+' gioca il Jolly: immunità annullata');return null}
 const f=eff(s,cards,pw);
 if(f.usePw){s.pw[s.cur]=true;E(s,{t:'power',p:s.cur,k:cl});L(s,nm+' usa '+CLS[cl].p)}
 L(s,nm+' gioca '+cards.map(fmt).join(' ')+' (attacco '+f.atk+')');
 E(s,{t:'play',p:s.cur,c:cards});for(const x of f.im)if(f.suits.has(x))E(s,{t:'imm',s:x});
 for(const c of cards)if((s.sig||{})[c])E(s,{t:'sigil',k:s.sig[c],c});
 if(f.healN)E(s,{t:'heal',v:heal(s,f.healN)});
 if(f.drawN)E(s,{t:'draw',v:draw(s,f.drawN)});
 s.en.dmg+=f.hit;E(s,{t:'hit',v:f.hit,x2:f.x2});
 if(f.shv){s.en.sh+=f.shv;E(s,{t:'shield',v:f.shv})}if(f.spv)s.en.sp+=f.spv;
 s.en.used=true;
 const hp=hpE(s.en),tol=arts(s).includes('bil')?2:0;
 if(s.en.dmg>=hp)defeat(s,s.en.dmg-hp<=tol);else beginDamage(s,0);return null}
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

/* ---------------- campagna ---------------- */
const allCards=()=>{const o=[];for(const s of SU){o.push('A'+s);for(let r=2;r<=10;r++)o.push(r+s)}return o};
const wtype=l=>{const w=[['fight',50],['forge',16],['rest',10],['chest',10]];if(l>=2)w.push(['elite',14]);const t=w.reduce((a,b)=>a+b[1],0);let x=RND()*t;for(const[k,v]of w){if((x-=v)<0)return k}return'fight'};
function genMap(){
 const widths=[2,3,3,3,3,3,2,1],layers=widths.map((w,l)=>Array.from({length:w},(_,i)=>({id:l+'-'+i,type:'fight',next:[]})));
 layers.forEach((ly,l)=>{if(l===LAYERS-1){ly[0].type='boss';return}if(l===0)return;
  if(l===LAYERS-2){const t=shuffle(['forge','rest']);ly.forEach((n,i)=>n.type=t[i]);return}
  ly.forEach(n=>n.type=wtype(l));if(!ly.some(n=>n.type==='fight'))ly[Math.floor(RND()*ly.length)].type='fight';
  ly.filter(n=>n.type==='elite').slice(1).forEach(n=>n.type='fight')});
 for(let l=0;l<LAYERS-1;l++){const a=layers[l],b=layers[l+1];
  a.forEach((n,i)=>{const j=a.length===1?0:Math.round(i*(b.length-1)/(a.length-1));n.next=[j];
   if(b.length>1&&RND()<.5){const k=j+(RND()<.5?-1:1);if(k>=0&&k<b.length&&!n.next.includes(k))n.next.push(k)}});
  b.forEach((m,j)=>{if(!a.some(n=>n.next.includes(j))){let bi=0,bd=9;a.forEach((n,i)=>{const d=Math.abs(n.next[0]-j);if(d<bd){bd=d;bi=i}});a[bi].next.push(j)}});
  a.forEach(n=>n.next.sort())}
 return layers}
function spec(type,l){const suit=pick(SU.split(''));
 if(type==='boss')return{c:'K'+suit,hp:58,atk:18,tr:pick(['reg','dup','mal','arm','fer']),boss:true};
 const elite=type==='elite',rk=elite?'K':(l<2?'J':(l<4?(RND()<.5?'Q':'J'):'Q'));
 return{c:rk+suit,hp:Math.round((10+l*4.3)*(elite?1.5:1)),atk:Math.round(5+l*1.4+(elite?3:0)),tr:(l>=2&&RND()<.7)||elite?pick(TRIDS):''}}
function newRun(cls){const deck=[];for(const s of SU)for(const r of['A',2,3,4,5])deck.push(r+s);
 return{cls,deck,sig:{},art:[],jl:2,map:genMap(),at:-1,node:null,phase:'map',choice:null,fight:null,cleared:0}}
const free=r=>allCards().filter(c=>!r.deck.includes(c));
const nOpts=r=>3+(r.art.includes('mon')?1:0);
function rewardOptions(r,elite){
 const pool=shuffle(free(r)),lv=r.cleared,cand=pool.filter(c=>cv(c)<=3+lv||RND()<.3),cards=[...cand,...pool.filter(c=>!cand.includes(c))];
 const o=[{t:'card',c:cards[0]},{t:'card',c:cards[1]},{t:'sig',k:pick(SIGIDS)}];
 const av=ARTIDS.filter(a=>!r.art.includes(a)),hasArt=(elite||RND()<.18)&&r.art.length<MAXART&&av.length>0;
 if(hasArt)o.push({t:'art',k:pick(av)});
 for(let i=2;o.length<nOpts(r)+(hasArt?1:0)&&i<cards.length;i++)o.push({t:'card',c:cards[i]});
 return o.filter(x=>x.t!=='card'||x.c)}
const reachable=r=>{const layer=r.map[r.at+1];if(!layer)return[];if(r.at<0)return layer.map(n=>n.id);const cur=r.map[r.at].find(n=>n.id===r.node);return cur?cur.next.map(j=>layer[j].id):[]};
function addArt(r,k){r.art.push(k);if(k==='dad')r.jl=Math.min(4,r.jl+1)}
/* sincronizza lo stato di gioco con la scalata (fase, Jolly, artefatti e sigilli visibili) */
function syncCamp(s){const r=s.camp;s.fase=r.phase;s.jl=r.jl;s.art=r.art.slice();s.sig=Object.assign({},r.sig)}
function done(s){const r=s.camp;r.choice=null;r.fight=null;r.phase=r.at>=LAYERS-1?'won':'map';
 if(r.phase==='won'){s.over={win:true,camp:true};E(s,{t:'win'});L(s,'La torre è caduta: scalata completata!')}syncCamp(s)}
function startFight(s,type){const r=s.camp,sp=spec(type,r.at);r.fight={spec:sp,type};r.phase='fight';
 s.jl=r.jl;setupFight(s,{deck:r.deck,castle:[sp],art:r.art,sig:r.sig,hs:CHS});s.fase='fight';
 E(s,{t:'next',c:s.en.c});L(s,(type==='boss'?'Il boss della torre: ':type==='elite'?'Élite: ':'Scontro: ')+fmt(s.en.c)+trTxt(s.en))}
/* fine di uno scontro della scalata: ricompensa, oppure fine della campagna */
function fightEnd(s){const r=s.camp,win=!!s.over.win,boss=r.fight&&r.fight.type==='boss';r.jl=Math.max(0,s.jl);
 if(!win){r.phase='over';s.over={win:false,camp:true,reason:(s.over.reason||'Sconfitto')+' · piano '+(r.at+1)+' di '+LAYERS};syncCamp(s);return}
 r.cleared++;
 if(boss){r.phase='won';r.fight=null;s.over={win:true,camp:true};syncCamp(s);return}
 s.over=null;r.choice={type:'reward',opts:rewardOptions(r,r.fight.type==='elite')};r.phase='choice';r.fight=null;
 Object.assign(s,{hands:s.hands.map(()=>[]),tav:[],disc:[],played:[],castle:[],en:null,phase:'play'});syncCamp(s);E(s,{t:'reward'})}
function enter(s,node){const r=s.camp,t=node.type;r.node=node.id;r.choice=null;
 if(t==='fight'||t==='elite'||t==='boss')return startFight(s,t);
 if(t==='forge'){r.phase='choice';r.choice={type:'forge',opts:['add','sig','fuse','purge']}}
 else if(t==='rest'){r.phase='choice';r.choice={type:'rest',opts:['jl','purge']}}
 else{const av=shuffle(ARTIDS.filter(a=>!r.art.includes(a)));
  if(r.art.length>=MAXART||!av.length){r.jl=Math.min(4,r.jl+1);L(s,'Il forziere è vuoto: trovi solo un Jolly.');return done(s)}
  r.phase='choice';r.choice={type:'chest',opts:av.slice(0,nOpts(r)).map(k=>({t:'art',k}))}}
 syncCamp(s)}
function campAct(s,a){const r=s.camp,ch=r.choice;
 switch(a.t){
  case'go':{if(r.phase!=='map')return 'Non ora';const layer=r.map[r.at+1];if(!layer)return 'Fine della mappa';
   const n=layer.find(x=>x.id===a.id);if(!n||!reachable(r).includes(a.id))return 'Da qui non ci arrivi';r.at++;L(s,'Piano '+(r.at+1)+': '+NODE[n.type].n);enter(s,n);return null}
  case'take':{if(!ch||!['reward','chest','fadd','fsig'].includes(ch.type))return 'Nessuna scelta';const o=ch.opts[a.i];if(!o)return 'Scelta non valida';
   if(o.t==='card'){r.deck.push(o.c);L(s,'Nuova carta: '+fmt(o.c));done(s)}
   else if(o.t==='art'){addArt(r,o.k);L(s,'Artefatto: '+ART[o.k].n);done(s)}
   else{r.choice={type:'apply',k:o.k};syncCamp(s)}return null}
  case'skip':{if(!ch||ch.type==='apply')return 'Non ora';done(s);return null}
  case'apply':{if(!ch||ch.type!=='apply')return 'Nessun sigillo da imprimere';if(!r.deck.includes(a.c))return 'Carta non nel mazzo';
   r.sig[a.c]=ch.k;L(s,SIG[ch.k].n+' su '+fmt(a.c));done(s);return null}
  case'forge':{if(!ch||ch.type!=='forge')return 'Non ora';
   if(a.k==='add')r.choice={type:'fadd',opts:shuffle(free(r).filter(c=>cv(c)>=4)).slice(0,nOpts(r)).map(c=>({t:'card',c}))};
   else if(a.k==='sig')r.choice={type:'fsig',opts:shuffle(SIGIDS.slice()).slice(0,nOpts(r)).map(k=>({t:'sig',k}))};
   else if(a.k==='fuse')r.choice={type:'fuse',first:null};else if(a.k==='purge')r.choice={type:'purge'};else return 'Scelta non valida';syncCamp(s);return null}
  case'fuse':{if(!ch||ch.type!=='fuse')return 'Non ora';if(!r.deck.includes(a.c))return 'Carta non nel mazzo';
   if(!ch.first||ch.first===a.c){ch.first=ch.first===a.c?null:a.c;syncCamp(s);return null}
   const p1=P(ch.first),p2=P(a.c);if(p1.s!==p2.s)return 'Si fondono solo carte dello stesso seme';
   const v=cv(ch.first)+cv(a.c);if(v>10)return 'Somma troppo alta (massimo 10)';
   const nc=(v===1?'A':v)+p1.s;if(r.deck.includes(nc))return 'Hai già '+fmt(nc);
   const sg=r.sig[ch.first]||r.sig[a.c];r.deck=r.deck.filter(c=>c!==ch.first&&c!==a.c);delete r.sig[ch.first];delete r.sig[a.c];r.deck.push(nc);if(sg)r.sig[nc]=sg;
   L(s,'Fusione: '+fmt(ch.first)+' + '+fmt(a.c)+' → '+fmt(nc));done(s);return null}
  case'purge':{if(!ch||ch.type!=='purge')return 'Non ora';if(r.deck.length<=8)return 'Il mazzo non può scendere sotto 8 carte';if(!r.deck.includes(a.c))return 'Carta non nel mazzo';
   r.deck=r.deck.filter(c=>c!==a.c);delete r.sig[a.c];L(s,'Carta rimossa: '+fmt(a.c));done(s);return null}
  case'rest':{if(!ch||ch.type!=='rest')return 'Non ora';
   if(a.k==='jl'){if(r.jl>=4)return 'Hai già il massimo di Jolly';r.jl++;L(s,'Riposi al falò: +1 Jolly');done(s);return null}
   if(a.k==='purge'){r.choice={type:'purge'};syncCamp(s);return null}return 'Scelta non valida'}
  default:return 'Azione sconosciuta'}}

const FIGHT=['play','yield','discard','pick','flip','ward','vision'];
function act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];let e;
 if(s.camp&&s.fase!=='fight'){if(FIGHT.includes(a.t))return{err:'Non c’è uno scontro in corso'};e=campAct(s,a)}
 else switch(a.t){case'play':e=doPlay(s,a.cards,!!a.pw);break;case'yield':e=doYield(s);break;case'discard':e=doDisc(s,a.cards);break;case'pick':e=doPick(s,a.to);break;
  case'flip':e=doFlip(s);break;case'ward':e=doWard(s,a.by);break;case'vision':e=doVision(s);break;default:e='Azione sconosciuta'}
 if(e)return{err:e};
 if(s.camp&&s.fase==='fight'&&s.over)fightEnd(s);
 s.evn=(s.evn||0)+1;return{s}}
function preview(s,cards,pw){if(checkPlay(s,cards))return null;if(cards[0][0]==='X')return{jester:true,atk:0,dmg:0};
 const f=eff(s,cards,pw);let dr=0;
 if(f.drawN){let fr=0;s.hands.forEach((h,i)=>{fr+=Math.max(0,hs(s)-(i===s.cur?h.length-cards.length:h.length))});dr=Math.min(f.drawN,fr,s.tav.length+Math.min(f.healN,s.disc.length))}
 return{atk:f.atk,dmg:f.hit,x2:f.x2,heal:f.healN,draw:dr,drawFull:f.drawN>0,shield:f.shv,ign:[...f.suits].filter(x=>f.im.includes(x)).join(''),pw:f.usePw,sg:f.sg}}
function bestDiscard(s){const h=s.hands[s.cur],n=h.length;let best=null;for(let m=1;m<1<<n;m++){let t=0,k=0;for(let i=0;i<n;i++)if(m>>i&1){t+=cv(h[i]);k++}if(t<s.owed)continue;const key=(t-s.owed)*100+k*10+t/100;if(!best||key<best.key)best={key,m}}
 return best?h.filter((_,i)=>best.m>>i&1):[]}
return{preview,bestDiscard,newGame,act,checkPlay,P,cv,sum,SYM,HAND,hpOf,atOf,fmt,clone,CLS,CLSIDS,TR,TRIDS,SIG,SIGIDS,ART,ARTIDS,NODE,LAYERS,MAXART,
 atkBase,hpE,imms,wardAvail,reachable,setRnd:f=>{RND=f}}})();
