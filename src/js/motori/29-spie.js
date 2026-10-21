/* AGENTI SEGRETI (gioco di parole a squadre, ispirato al genere "indizio + parole" di Nomi in Codice; parole, grafica e testi nostri).
   4-10 giocatori in due squadre (posti pari = Rossi, dispari = Blu). Il posto 0 è la Spia dei Rossi, il posto 1 la Spia dei Blu: solo le spie
   vedono la chiave (25 parole: 9 della squadra che comincia, 8 dell'altra, 7 neutre, 1 trappola). La spia dà un indizio (una parola + un numero),
   gli altri della squadra, uno alla volta a turno, toccano parole. Si indovina finché sono giuste, al massimo numero+1 tentativi (numero 0 = senza limite).
   Fasi: clue (cur = spia di turnT) · guess (cur = un agente della squadra di turnT).
   Azioni: clue{w,k} guess{i} end. */
const SPIE=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const TN=['Rossi','Blu'];
const WORDS=('acqua albero aereo ago alba ala altalena ambra ancora anello angelo ape arancia arco argento armadio asino asta aula autunno '+
'baffo balena ballo bambola banca banco barca barile basilico bastone bacio benda biglia bilancia bocca bomba borsa bosco bottone braccio briciola bruco bussola burro '+
'cabina cactus caffe calamita calcio camino campana candela cane cannone capanna cappello carota carta casco castello catena cavallo cena ceppo cerchio chiave chiesa '+
'chitarra cielo cipolla circo citta coda collana colonna coltello corda corona corvo costa cratere cravatta croce cuoco cuscino '+
'dado dama deserto diamante dito dottore dragone drago duello '+
'edicola elefante elmo eroe estate '+
'fabbro faro fata fattoria fenice ferro festa fiamma fiasco fiocco fiore fiume foglia fontana foresta forno fossa fragola freccia frutta fulmine fumo fungo funivia '+
'gabbia gallo gamba gatto gelato gemma ghiaccio giardino gigante ginocchio giostra gnomo gomma gondola gonna gru guanto guscio '+
'hotel ' +
'iceberg idra impero incendio inchiostro inverno isola '+
'jolly '+
'labirinto lacrima lago lama lampada lancia lana latte lavagna legno lente leone letto libro lince lingua luna lupo lusso '+
'macchina madre maga maglia mago mano mantello mare maschera mattone mela mercato meteora miele miniera mirto molla montagna moneta mosca mulino muro museo '+
'nastro nave nebbia neve nido nodo notte nuvola '+
'occhio oca onda orchestra orecchio orologio orso ortica ospedale osso ostrica '+
'padella pagina palla palazzo palma pane panna pantera papavero parco parrucca pasta pecora penna pennello pera perla pesce pettine piano piazza piede pietra pigna pilota pinguino pioggia pipa piramide pirata piscina pizza polvere pompa ponte porta porto pozzo prato principe prugna pugno '+
'quadro quercia '+
'radio ragno rana razzo regina remo re riccio rete riso roccia rosa rospo ruota ruggine '+
'sabbia sacco sale salmone sangue sapone sasso scacchi scala scarpa scatola scheletro schiuma sciarpa scimmia scopa scudo sedia seme sera serpente sigaro sirena sole sottomarino spada specchio spia spiaggia spillo sposa stella stivale strega strada sveglia '+
'tacco talpa tamburo tappeto tavolo tazza teatro telefono tenda terra tesoro tetto tigre timone tonno topo torcia torre tosse trapezio trave treno tromba tronco tuono '+
'ufficio uncino unicorno uovo uragano uva '+
'vaso vela veleno vento verme vetro villaggio vino viola volpe vulcano '+
'zaino zattera zebra zero zolla zucca').split(/\s+/).filter(Boolean);
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const nm=(s,i)=>s.names[i];
const teamOf=i=>i%2;
const agents=(s,t)=>{const r=[];for(let i=0;i<s.n;i++)if(teamOf(i)===t&&i!==t)r.push(i);return r};
const left=(s,t)=>s.key.reduce((n,k,i)=>n+((k===(t?'B':'R')&&!s.rev[i])?1:0),0);
function newGame(n,names,o={}){const ws=shuffle(WORDS.slice()).slice(0,25),start=Math.floor(RND()*2);
 const key=shuffle([...Array(start?8:9).fill('R'),...Array(start?9:8).fill('B'),...Array(7).fill('N'),'A']);
 const s={n,names:names.slice(0,n),hands:Array.from({length:n},()=>[]),teams:Array.from({length:n},(_,i)=>teamOf(i)),words:ws,key,rev:Array(25).fill(false),
  start,turnT:start,phase:'clue',clue:null,left:0,tried:0,ix:[0,0],cur:start,log:[],ev:[],evn:0,over:null};
 L(s,'Comincia la squadra '+TN[start]+' ('+(9)+' parole da trovare). Tocca alla sua spia: '+nm(s,start));return s}
function finish(s,winT,why){const winners=[];for(let i=0;i<s.n;i++)if(teamOf(i)===winT)winners.push(i);
 s.over={win:winT,winners,scores:Array.from({length:s.n},(_,i)=>teamOf(i)===winT?1:0),why};s.phase='end';s.ev.push({t:'over',team:winT});L(s,'Vincono i '+TN[winT]+'!')}
function endTurn(s){const t=1-s.turnT;s.turnT=t;s.phase='clue';s.clue=null;s.left=0;s.tried=0;s.cur=t;s.ev.push({t:'turn',p:s.cur});L(s,'Tocca ai '+TN[t]+': la spia '+nm(s,t)+' dà un indizio')}
function nextAgent(s){const a=agents(s,s.turnT);const p=a[s.ix[s.turnT]%a.length];s.ix[s.turnT]++;return p}
const fail=e=>({err:e});
const norm=w=>String(w||'').trim().toLowerCase();
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];
 if(a.t==='clue'){if(s.phase!=='clue')return fail('Ora si indovina');
  const w=norm(a.w),k=+a.k;if(!w)return fail('Scrivi una parola');if(/\s/.test(w))return fail('L’indizio è una sola parola');if(!/^[a-zàèéìòù'-]+$/.test(w))return fail('Solo lettere');
  if(!(k>=0&&k<=9&&Number.isInteger(k)))return fail('Il numero va da 0 a 9');
  if(s.words.some((x,i)=>!s.rev[i]&&(x===w||(w.length>3&&(x.includes(w)||w.includes(x))&&x.length>3))))return fail('L’indizio non può essere (né contenere) una parola sul tavolo');
  s.clue={w,k};s.left=k===0?99:k+1;s.tried=0;s.phase='guess';s.ev.push({t:'clue',p:s.cur,w,k});L(s,nm(s,s.cur)+' ('+TN[s.turnT]+'): «'+w+'» '+k);s.cur=nextAgent(s);s.evn++;return{s}}
 if(a.t==='guess'){if(s.phase!=='guess')return fail('Aspetta l’indizio');const i=a.i;if(!(i>=0&&i<25)||s.rev[i])return fail('Parola non valida');
  const k=s.key[i],t=s.turnT,mine=t?'B':'R',who=nm(s,s.cur);s.rev[i]=true;s.tried++;s.ev.push({t:'reveal',i,k,p:s.cur});
  if(k==='A'){L(s,who+' tocca «'+s.words[i]+'»: è la TRAPPOLA!');finish(s,1-t,'trappola');s.evn++;return{s}}
  if(k===mine){L(s,who+': «'+s.words[i]+'» è dei '+TN[t]);if(left(s,t)===0){finish(s,t,'parole');s.evn++;return{s}}
   s.left--;if(s.left<=0){L(s,'Tentativi finiti');endTurn(s)}else s.cur=nextAgent(s);s.evn++;return{s}}
  if(k==='N'){L(s,who+': «'+s.words[i]+'» è neutra');endTurn(s);s.evn++;return{s}}
  L(s,who+': «'+s.words[i]+'» è dei '+TN[1-t]+'!');if(left(s,1-t)===0){finish(s,1-t,'parole');s.evn++;return{s}}endTurn(s);s.evn++;return{s}}
 if(a.t==='end'){if(s.phase!=='guess')return fail('Non adesso');if(!s.tried)return fail('Prova almeno una parola');L(s,nm(s,s.cur)+' si ferma');endTurn(s);s.evn++;return{s}}
 return fail('Azione non valida adesso')}
const isSpy=i=>i===0||i===1;
return{newGame,act,setRnd:f=>{RND=f},WORDS,TN,teamOf,left,agents,isSpy}})();
if(typeof module!=='undefined')module.exports=SPIE;
