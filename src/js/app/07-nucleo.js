/* ================= STATO, STANZA, GIOCHI ================= */
let G=null,fxDone=null;
const ui={lobby:(()=>{try{const l=ST('rg-lb');return l==='iso'||l==='hall'?l:'3d'}catch(e){return'3d'}})(),screen:'name',sel:[],tsel:[],shown:-1,err:'',busy:false,anim:false,rules:null,cfg:false,story:false,viewEn:null,view:null,opts:{},bsort:'suit',confirm:false};
const ME={name:ST('rg-name')||'',dev:'local'};
const R={on:false,db:null,tried:false,code:'',ref:null,doc:null,members:[],chat:[],un:[],rev:0,mine:{name:'',t:0,guests:[],votes:{}},offSeats:null};
const ENG={regicide:RG,briscola:IT.BRIS,scopa:IT.SCOPA,burraco:BURR,gang:GANG,saboteur:SAB,azul:AZUL,island:ISLE,machiavelli:MACH,mind:MIND,mindx:MIND,harvest:HARV,scoundrel:SCOUN,trono:THRONE,uno:UNO,quiz:QUIZ,spie:SPIE,pets:PETS,catan:CATAN,kittens:KITT,perudo:PERU,valle:VALLE,discesa:DISC};
const GAMES=[
 {id:'regicide',name:'Regicide',desc:'Cooperativo: insieme contro i sovrani corrotti del castello.',range:'1–4',ok:n=>n>=1&&n<=4,mode:n=>n===1?'Solitario con 2 Jolly':n+' eroi in cooperazione'},
 {id:'briscola',name:'Briscola',desc:'Carte napoletane: vince chi supera i 60 punti.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n===4?'A coppie, 2 contro 2':n===3?'Tutti contro tutti (senza il 2 di Coppe)':'Testa a testa'},
 {id:'scopa',name:'Scopa',desc:'Prendi le carte dal tavolo, fai scopa, conquista il settebello.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n===4?'A coppie, 2 contro 2':n===3?'Tutti contro tutti':'Testa a testa',opts:{k:'target',label:'Si gioca a',vals:[['11','11 punti'],['21','21 punti']]}},
 {id:'burraco',name:'Burraco',desc:'Scale e tris con jolly e pinelle, pozzetto e chiusura.',range:'2 o 4',ok:n=>n===2||n===4,mode:n=>n===4?'A coppie, 2 contro 2':'Testa a testa',opts:{k:'target',label:'Si gioca a',vals:[['one','Una mano'],['1005','1005 punti'],['2005','2005 punti']]}}];
GAMES.push({id:'gang',name:'The Gang',desc:'Poker cooperativo: ordinate le vostre mani senza parlare e svaligiate 3 caveau.',range:'3–6',ok:n=>n>=3&&n<=6,mode:n=>n+' scassinatori in squadra',opts:{k:'mode',label:'Modalità',vals:[['base','Base'],['avanzata','Avanzata (sfide e specialisti)'],['pro','Professionista'],['maestro','Maestro del furto']]}});
GAMES.push({id:'island',name:'L’isola dei predatori',desc:'Solitario: sposta gli animali e mangia in ordine di catena alimentare, finché ne resta uno solo.',range:'1',ok:n=>n===1,mode:n=>'Solitario',opts:{k:'water',label:'Carte acquatiche',vals:[['2','Squalo e balena'],['1','Una sola, a caso'],['0','Nessuna (difficile)']]}});
GAMES.push({id:'mind',name:'The Mind',desc:'Cooperativo senza parole: giocate le carte in ordine crescente, senza comunicare. Sentite il gruppo.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n+' giocatori · '+({2:12,3:10,4:8}[n])+' livelli'});
GAMES.push({id:'mindx',name:'The Mind Extreme',desc:'La versione estrema: carte bianche crescenti e rosse decrescenti, e più avanti carte giocate coperte.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n+' giocatori · '+({2:12,3:10,4:8}[n])+' livelli'});
GAMES.push({id:'harvest',name:'Harvest Valley',desc:'Costruisci la tua fattoria in una valle condivisa: ortaggi, frutteti e grano… ma attenti a corvi e cinghiali!',range:'2–5',ok:n=>n>=2&&n<=5,mode:n=>n+' contadini · valle '+(n%2?'6×5':'5×5')});
GAMES.push({id:'valle',name:'Valle Selvaggia',desc:'Fai crescere la tua valle con tessere di habitat e accogli orsi, alci, salmoni, falchi e volpi nei posti giusti.',range:'1–4',ok:n=>n>=1&&n<=4,mode:n=>n===1?'Solitario · 20 turni':n+' giocatori · 20 turni a testa'});
GAMES.push({id:'discesa',name:'Discesa Tascabile',desc:'Solitario a dadi: scendi 12 livelli di dungeon su una sola carta, assegna l’energia, muoviti e colpisci prima che i mostri ti raggiungano.',range:'1',ok:n=>n===1,mode:n=>'Solitario · 12 livelli',opts:{k:'adv',label:'Avventura',vals:[['base','Le Cripte (gioco base)'],['porto','Porto delle Ombre'],['vetta','Vetta Eterna'],['soglia','Soglia Infernale']]}});
GAMES.push({id:'perudo',name:'Perudo',desc:'Il gioco di bluff coi dadi: dichiara quanti ce ne sono sul tavolo, sfida con Dudo, calza al momento giusto. Gli assi sono jolly.',range:'2–6',ok:n=>n>=2&&n<=6,mode:n=>n+' giocatori · 5 dadi a testa'});
GAMES.push({id:'kittens',name:'Exploding Kittens',desc:'Pesca, bluffa e sopravvivi: un Micio Bomba nel mazzo e un solo Disinnesco tra te e il botto. Attacchi, Niet a catena e gatti ladri.',range:'2–10',ok:n=>n>=2&&n<=10,mode:n=>n+' giocatori · '+(n-1)+' bombe nel mazzo'+(n>5?' · due mazzi':''),opts:{k:'edi',label:'Edizione',vals:[['base','Classica'],['imp','Implosione (con carte extra)']]}});
GAMES.push({id:'catan',name:'Catan',desc:'Costruisci strade, colonie e città su un’isola esagonale: raccogli risorse con i dadi, commercia, schiva il ladro e arriva per primo ai punti vittoria.',range:'2–8',ok:n=>n>=2&&n<=8,mode:n=>n+' coloni · '+(n<=4?'isola classica (19 esagoni)':n<=6?'ampliamento 5-6 (30 esagoni)':'ampliamento 7-8 (37 esagoni)')+(n>=5?' · costruzione speciale':''),opts:{k:'x',label:'Espansione o scenario',vals:CATAN.presets().map(p=>[p[0],p[1]])}});
GAMES.push({id:'pets',name:'Power Hungry Pets',desc:'Una carta in mano e un solo turno di vantaggio: pesca, gioca, scambia e smaschera gli avversari. Vince chi ha la carta più alta o resta l’ultimo.',range:'2–6',ok:n=>n>=2&&n<=6,mode:n=>n+' giocatori · si vince a '+(n<=3?3:2)+' gettoni'});
GAMES.push({id:'uno',name:'Uno',desc:'Svuota la mano per primo: stesso colore o stesso numero, salti, inversioni, +2 e +4. Non dimenticare di dire UNO!',range:'2–10',ok:n=>n>=2&&n<=10,mode:n=>n+' giocatori · mano singola'+(n>6?' · due mazzi':''),opts:{k:'edi',label:'Regole',vals:[['classic','Classiche (sfida al +4)'],['stack','Con accumulo di +2 e +4']]}});
GAMES.push({id:'spie',name:'Agenti Segreti',desc:'Due squadre, due spie e 25 parole: un indizio di una parola e un numero per far trovare ai tuoi agenti le parole giuste, ma attenti alla trappola.',range:'4–10',ok:n=>n>=4&&n<=10,mode:n=>n+' giocatori · Rossi contro Blu'});
GAMES.push({id:'quiz',name:'Quiz della Taverna',desc:'Gira sul percorso, rispondi alle domande delle sei categorie e conquista tutti gli spicchi: poi la domanda finale scelta dagli avversari.',range:'2–6',ok:n=>n>=2&&n<=6,mode:n=>n+' giocatori · 120 domande'});
GAMES.push({id:'trono',name:'Behind the Throne',desc:'Pesca carte sempre più basse, raccogli i personaggi di corte e distruggi i mazzetti rivali. Quando esce la Fine del regno vince chi ha più punti.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n+' giocatori · fino a 5 carte per fila'});
GAMES.push({id:'scoundrel',name:'Scoundrel',desc:'Solitario roguelike con un mazzo di carte: affronta il dungeon, scegli le armi, scappa (ma non due volte di fila).',range:'1',ok:n=>n===1,mode:n=>'Solitario · 20 vite'});
GAMES.push({id:'machiavelli',name:'Machiavelli',desc:'Cala tris e scale, riorganizza il tavolo e svuota per primo la mano.',range:'2–5',ok:n=>n>=2&&n<=5,mode:n=>n+' giocatori · 2 mazzi + 4 jolly'});
GAMES.push({id:'azul',name:'Azul',desc:'Decora il palazzo di Evora con azulejos: prendi, incastra, posa sul muro.',range:'2–4',ok:n=>n>=2&&n<=4,mode:n=>n+' decoratori · '+({2:5,3:7,4:9}[n])+' fabbriche',opts:{k:'wall',label:'Muro',vals:[['classic','Classico'],['grey','Libero (variante)']]}});
GAMES.push({id:'saboteur',name:'Saboteur',desc:'Nani cercatori d’oro contro sabotatori nascosti: scava le gallerie, ma di chi ti fidi?',range:'3–10',ok:n=>n>=3&&n<=10,mode:n=>{const r={3:'1 sabotatore',4:'1 sabotatore',5:'2 sabotatori',6:'2 sabotatori',7:'3 sabotatori',8:'3 sabotatori',9:'3 sabotatori',10:'4 sabotatori'}[n];return n+' nani · '+r},opts:{k:'exp',label:'Edizione',vals:[['base','Gioco base'],['sab2','Con Saboteur 2']]}});
const GN=id=>(GAMES.find(g=>g.id===id)||{}).name||id;
/* posti: chi gioca su questo dispositivo */
const seatsNow=()=>(R.on?(R.doc&&R.doc.seats):R.offSeats)||[];
const local=()=>{const S=seatsNow();const L=[];S.forEach((x,i)=>{if(x.dev===ME.dev)L.push(i)});return L};
const isMine=i=>local().includes(i);
const multiLocal=()=>local().length>1;
function viewer(){if(!G)return-1;const L=local();if(G.sim)return L.includes(ui.ms)?ui.ms:(L.length?L[0]:-1);if(L.length===1)return L[0];if(isMine(G.cur)&&ui.shown===G.cur)return G.cur;return-1}
function needCover(){return!!(G&&!G.sim&&!G.over&&G.phase!=='summary'&&isMine(G.cur)&&multiLocal()&&ui.shown!==G.cur)}
function myTurn(){if(!G||G.over||ui.busy||ui.anim||ui.story)return false;if(G.sim)return local().length>0;if(G.g==='harvest'||G.g==='valle'||G.g==='quiz')return isMine(G.cur);if(!isMine(G.cur))return false;if(G.phase==='summary')return true;return!multiLocal()||ui.shown===G.cur}
function seatTag(i){const x=seatsNow()[i];if(!x||x.dev!==ME.dev||G&&G.n===1)return'';return x.k==='m'?' (tu)':' (ospite)'}
const members=()=>R.on?R.members:[{id:ME.dev,...R.mine}];
const multiDev=()=>members().length>=2;
/* infobox: una ⓘ che mostra la spiegazione toccandola o passandoci sopra col cursore */
const infoH=(t,cls='')=>t?`<span class="info ${cls}" tabindex="0" role="button" aria-label="Spiegazione: ${String(t).replace(/<[^>]+>/g,'').replace(/"/g,'&quot;')}"><i aria-hidden="true">i</i><span class="tip" role="tooltip">${t}</span></span>`:'';
(()=>{const place=el=>{const tip=el.querySelector('.tip');if(!tip)return;const r=el.getBoundingClientRect(),W=innerWidth,w=Math.min(280,W-32);tip.style.width=w+'px';
  let x=r.left+r.width/2-w/2;x=Math.max(16,Math.min(W-16-w,x));tip.style.left=x+'px';const below=r.bottom+8,th=tip.offsetHeight||80;tip.style.top=(below+th>innerHeight-8?Math.max(8,r.top-8-th):below)+'px'};
 document.addEventListener('click',e=>{const i=e.target.closest('.info');document.querySelectorAll('.info.open').forEach(x=>{if(x!==i)x.classList.remove('open')});if(i){e.stopPropagation();i.classList.toggle('open');place(i)}},true);
 document.addEventListener('mouseover',e=>{const i=e.target.closest&&e.target.closest('.info');if(i)place(i)});
 document.addEventListener('focusin',e=>{const i=e.target.closest&&e.target.closest('.info');if(i)place(i)});
 addEventListener('scroll',()=>document.querySelectorAll('.info.open').forEach(x=>x.classList.remove('open')),{passive:true})})();
const GENROOM='PIAZZA',isGen=()=>R.code===GENROOM;
function setRoomUrl(c){try{const u=new URL(location.href);if(c&&c!==GENROOM)u.searchParams.set('room',c);else u.searchParams.delete('room');history.replaceState(null,'',u)}catch(e){}}
const INV=(()=>{try{const c=(new URLSearchParams(location.search).get('room')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');return c.length>=3&&c.length<=6?c:''}catch(e){return''}})();
function lobbySeats(){return members().flatMap(m=>[{dev:m.id,k:'m',name:m.name||'?',uid:m.uid||null},...(m.guests||[]).map(g=>({dev:m.id,k:g.k,name:g.name}))])}
function tally(n){const t={};members().forEach(m=>{const keys=['m',...(m.guests||[]).map(g=>g.k)];keys.forEach(k=>((m.votes||{})[k]||[]).forEach(g=>{const G0=GAMES.find(x=>x.id===g);if(G0&&G0.ok(n))t[g]=(t[g]||0)+1}))});return t}
const rid=()=>Math.random().toString(36).slice(2,10);
const newCode=()=>Array.from({length:4},()=>'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('');
