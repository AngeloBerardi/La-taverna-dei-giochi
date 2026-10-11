/* ================= STATO, STANZA, GIOCHI ================= */
let G=null,fxDone=null;
const ui={screen:'name',sel:[],tsel:[],shown:-1,err:'',busy:false,anim:false,rules:null,cfg:false,story:false,viewEn:null,view:null,opts:{},bsort:'suit',confirm:false};
const ME={name:ST('rg-name')||'',dev:'local'};
const R={on:false,db:null,tried:false,code:'',ref:null,doc:null,members:[],chat:[],un:[],rev:0,mine:{name:'',t:0,guests:[],votes:{}},offSeats:null};
const ENG={regicide:RG,briscola:IT.BRIS,scopa:IT.SCOPA,burraco:BURR,gang:GANG,saboteur:SAB,azul:AZUL,island:ISLE,machiavelli:MACH};
const GAMES=[
 {id:'regicide',name:'Regicide',desc:'Cooperativo: insieme contro i sovrani corrotti del castello.',range:'1–4',ok:n=>n>=1&&n<=4,mode:n=>n===1?'Solitario con 2 Jolly':n+' eroi in cooperazione'},
 {id:'briscola',name:'Briscola',desc:'Carte napoletane: vince chi supera i 60 punti.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n===4?'A coppie, 2 contro 2':n===3?'Tutti contro tutti (senza il 2 di Coppe)':'Testa a testa'},
 {id:'scopa',name:'Scopa',desc:'Prendi le carte dal tavolo, fai scopa, conquista il settebello.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n===4?'A coppie, 2 contro 2':n===3?'Tutti contro tutti':'Testa a testa',opts:{k:'target',label:'Si gioca a',vals:[['11','11 punti'],['21','21 punti']]}},
 {id:'burraco',name:'Burraco',desc:'Scale e tris con jolly e pinelle, pozzetto e chiusura.',range:'2 o 4',ok:n=>n===2||n===4,mode:n=>n===4?'A coppie, 2 contro 2':'Testa a testa',opts:{k:'target',label:'Si gioca a',vals:[['one','Una mano'],['1005','1005 punti'],['2005','2005 punti']]}}];
GAMES.push({id:'gang',name:'The Gang',desc:'Poker cooperativo: ordinate le vostre mani senza parlare e svaligiate 3 caveau.',range:'3–6',ok:n=>n>=3&&n<=6,mode:n=>n+' scassinatori in squadra',opts:{k:'mode',label:'Modalità',vals:[['base','Base'],['avanzata','Avanzata (sfide e specialisti)'],['pro','Professionista'],['maestro','Maestro del furto']]}});
GAMES.push({id:'island',name:'L’isola dei predatori',desc:'Solitario: sposta gli animali e mangia in ordine di catena alimentare, finché ne resta uno solo.',range:'1',ok:n=>n===1,mode:n=>'Solitario',opts:{k:'water',label:'Carte acquatiche',vals:[['2','Squalo e balena'],['1','Una sola, a caso'],['0','Nessuna (difficile)']]}});
GAMES.push({id:'machiavelli',name:'Machiavelli',desc:'Cala tris e scale, riorganizza il tavolo e svuota per primo la mano.',range:'2–5',ok:n=>n>=2&&n<=5,mode:n=>n+' giocatori · 2 mazzi + 4 jolly'});
GAMES.push({id:'azul',name:'Azul',desc:'Decora il palazzo di Evora con azulejos: prendi, incastra, posa sul muro.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n+' decoratori · '+({2:5,3:7,4:9}[n])+' fabbriche',opts:{k:'wall',label:'Muro',vals:[['classic','Classico'],['grey','Libero (variante)']]}});
GAMES.push({id:'saboteur',name:'Saboteur',desc:'Nani cercatori d’oro contro sabotatori nascosti: scava le gallerie, ma di chi ti fidi?',range:'3–10',ok:n=>n>=3&&n<=10,mode:n=>{const r={3:'1 sabotatore',4:'1 sabotatore',5:'2 sabotatori',6:'2 sabotatori',7:'3 sabotatori',8:'3 sabotatori',9:'3 sabotatori',10:'4 sabotatori'}[n];return n+' nani · '+r},opts:{k:'exp',label:'Edizione',vals:[['base','Gioco base'],['sab2','Con Saboteur 2']]}});
const GN=id=>(GAMES.find(g=>g.id===id)||{}).name||id;
/* posti: chi gioca su questo dispositivo */
const seatsNow=()=>(R.on?(R.doc&&R.doc.seats):R.offSeats)||[];
const local=()=>{const S=seatsNow();const L=[];S.forEach((x,i)=>{if(x.dev===ME.dev)L.push(i)});return L};
const isMine=i=>local().includes(i);
const multiLocal=()=>local().length>1;
function viewer(){if(!G)return-1;const L=local();if(L.length===1)return L[0];if(isMine(G.cur)&&ui.shown===G.cur)return G.cur;return-1}
function needCover(){return!!(G&&!G.over&&G.phase!=='summary'&&isMine(G.cur)&&multiLocal()&&ui.shown!==G.cur)}
function myTurn(){if(!G||G.over||ui.busy||ui.anim||ui.story)return false;if(!isMine(G.cur))return false;if(G.phase==='summary')return true;return!multiLocal()||ui.shown===G.cur}
function seatTag(i){const x=seatsNow()[i];if(!x||x.dev!==ME.dev||G&&G.n===1)return'';return x.k==='m'?' (tu)':' (ospite)'}
const members=()=>R.on?R.members:[{id:ME.dev,...R.mine}];
function lobbySeats(){return members().flatMap(m=>[{dev:m.id,k:'m',name:m.name||'?'},...(m.guests||[]).map(g=>({dev:m.id,k:g.k,name:g.name}))])}
function tally(n){const t={};members().forEach(m=>{const keys=['m',...(m.guests||[]).map(g=>g.k)];keys.forEach(k=>((m.votes||{})[k]||[]).forEach(g=>{const G0=GAMES.find(x=>x.id===g);if(G0&&G0.ok(n))t[g]=(t[g]||0)+1}))});return t}
const rid=()=>Math.random().toString(36).slice(2,10);
const newCode=()=>Array.from({length:4},()=>'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('');
