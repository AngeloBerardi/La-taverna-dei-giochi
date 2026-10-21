/* ZUCCA MATTA (gioco di squadre con prove diverse, ispirato al genere dei party game a prove miste; prove, grafica e testi nostri). 2-6 squadre (di base un posto = una squadra).
   Percorso di 40 caselle; ogni casella ha una prova: Mimo, Disegno, Parole (enigmi), Canto (canticchia) o Cultura (domanda a 4 risposte); ogni 8 caselle un Jolly (la squadra sceglie).
   Chi ha il telefono pesca la carta e la fa indovinare ai compagni (a parole, a gesti o a disegni); se la squadra indovina si preme «Indovinato» e si avanza del dado.
   Cultura si risolve da sé (4 risposte). In fondo (casella 39) gli avversari scelgono la prova finale: riuscita = vittoria, altrimenti si riprova al prossimo turno.
   Fasi: choose (jolly) · draw (cur pesca) · play (cur mostra/risponde) · pick (cur = chi sceglie la prova finale per who).
   Azioni: choose{cat} draw result{ok} answer{k} pick{cat}. */
const ZUCCA=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const CATS=[{id:'mimo',n:'Mimo',c:'#e8453c',d:'Fai indovinare la frase solo a gesti, senza parlare né fare rumori.'},
 {id:'disegno',n:'Disegno',c:'#2f9bd8',d:'Disegna su un foglio (o plasma con le mani) senza lettere, numeri né parole.'},
 {id:'parole',n:'Parole',c:'#3aa05a',d:'Risolvete l’enigma: la squadra lo risolve a voce.'},
 {id:'canto',n:'Canto',c:'#9a5fd0',d:'Canticchia o fischietta il brano senza dire parole del titolo.'},
 {id:'cultura',n:'Cultura',c:'#f2b81c',d:'Rispondi alla domanda: una sola risposta è giusta.'}];
const NC=CATS.length,PATH=40,GOAL=PATH-1,JOLLY=8;
const MIMO=['Pescare con la canna','Tuffarsi da un trampolino','Farsi un selfie','Il cuoco che fa volare la pizza','Dormire in piedi sull’autobus','Un pinguino che cammina','Montare un mobile senza istruzioni','Il vigile che dirige il traffico','Suonare il violino','Una gallina che cova','Giocare a bowling','Pelare le patate','Stendere i panni','Cambiare la ruota di un’auto','Il dentista al lavoro','Telefonare al capo','Il pompiere con la pompa','Una scimmia che si arrampica','Accendere il fuoco in campeggio','Guidare un trattore','Fare surf','Tagliare i capelli','Il cameriere con troppi piatti','Un robot che balla','Lavare l’auto','Il ladro che scassina una porta','Il direttore d’orchestra','Gonfiare un canotto','Un gatto che si lava','Lanciare il giavellotto'];
const DISEGNO=['Faro','Mongolfiera','Chiave inglese','Bicicletta','Gelato','Castello','Ombrello','Elefante','Treno','Luna','Occhiali','Bussola','Tenda da campeggio','Pizza','Razzo','Sirena','Fantasma','Ponte','Orologio','Pirata','Aeroplano','Ragno','Chitarra','Cactus','Scala','Clessidra','Dinosauro','Gondola','Lampadina','Pinguino'];
const CANTO=['Volare','Tanti auguri a te','Fra Martino campanaro','Bella ciao','O sole mio','Jingle Bells','Azzurro','Imagine','We Will Rock You','La Cucaracha','Gianna','Sapore di sale','Con te partirò','Yesterday','Despacito','La donna è mobile','Va’ pensiero','Alla fiera dell’est','Il ballo del qua qua','Macarena','Happy','Thriller','Via con me','L’italiano','Maledetta primavera','Gloria','Summertime','Marcia nuziale'];
const PAROLE_W=['cavallo','montagna','giraffa','finestra','bicicletta','pomodoro','tartaruga','lavagna','farfalla','chitarra','orologio','tavolino','cioccolato','elicottero','ombrellone','calzino','semaforo','telefono','fragola','stazione','pinguino','astronave','biblioteca','gelateria','formaggio','coccodrillo','arcobaleno','lampadario','spaghetti','cappello','valigia','giardino','tramonto','conchiglia','scoiattolo','pantofola','cacciavite','panettone','funicolare','lucertola'];
const INDOVINELLI=[['Più ne togli e più diventa grande. Che cos’è?','La buca'],['Ha i denti ma non morde. Che cos’è?','Il pettine'],['Ha i tasti ma non apre porte. Che cos’è?','Il pianoforte'],['Ha quattro gambe ma non cammina. Che cos’è?','Il tavolo'],['Più è caldo e più è fresco. Che cos’è?','Il pane'],['Vola senza ali e piange senza occhi. Che cos’è?','La nuvola'],['Ha un collo ma non ha la testa. Che cos’è?','La bottiglia'],['Ha le foglie ma non è un albero, ha il dorso ma non è un animale. Che cos’è?','Il libro'],['Cammina sempre e non si stanca mai, ha le lancette ma non è un soldato. Che cos’è?','L’orologio'],['Si rompe appena lo nomini. Che cos’è?','Il silenzio'],['Ha una chioma ma non è un albero, ha una cassa ma non è un mobile. Che cos’è?','Il violino'],['Più è lunga e meno dura. Che cos’è?','La candela']];
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const nm=(s,i)=>s.names[i];
/* squadre: o.squads = numero di squadra per posto (0..k-1, almeno 2 squadre, tutte non vuote). Di base ogni posto è una squadra.
   Gli amici della stessa squadra condividono la pedina; a turno (a rotazione) uno di loro fa la prova. */
function setup(n,o){let sq=Array.from({length:n},(_,i)=>i);
 if(Array.isArray(o.squads)&&o.squads.length===n&&o.squads.every(x=>Number.isInteger(x)&&x>=0&&x<n)){const k=Math.max(...o.squads)+1;
  if(k>=2&&k<=6&&Array.from({length:k},(_,j)=>o.squads.includes(j)).every(Boolean))sq=o.squads.slice()}
 return sq}
const members=(s,q)=>s.sq.map((x,i)=>x===q?i:-1).filter(i=>i>=0);
const tn=(s,i)=>{const m=members(s,s.sq[i]).map(j=>nm(s,j));return m.length<=2?m.join(' e '):m[0]+' e altri '+(m.length-1)};
const nsq=s=>Math.max(...s.sq)+1;
/* chi fa la prova per la squadra q (a rotazione) */
const perf=(s,q)=>{const m=members(s,q),i=(s.rot[q]||0)%m.length;s.rot[q]=(s.rot[q]||0)+1;return m[i]};
/* categoria della casella p: -1 jolly, -2 traguardo */
const sq=p=>p===GOAL?-2:p%JOLLY===JOLLY-1?-1:(p*3+Math.floor(p/5))%NC;
function newGame(n,names,o={}){const sq=setup(n,o),s={n,names:names.slice(0,n),hands:Array.from({length:n},()=>[]),sq,rot:{},pos:Array(n).fill(0),used:{},cur:0,phase:'draw',cat:0,card:null,final:false,who:-1,log:[],ev:[],evn:0,over:null};
 s.cur=perf(s,Math.floor(RND()*nsq(s)));begin(s);L(s,'Comincia la squadra di '+tn(s,s.cur));return s}
function begin(s){const p=s.cur,k=sq(s.pos[p]);s.card=null;s.final=false;
 if(k===-2){s.who=p;s.cur=perf(s,(s.sq[p]+1)%nsq(s));s.phase='pick';s.ev.push({t:'final',p});L(s,tn(s,p)+' è al traguardo! '+tn(s,s.cur)+' sceglie la prova finale');return}
 if(k===-1){s.phase='choose';L(s,tn(s,p)+' è su un Jolly: sceglie la prova');return}
 s.cat=k;s.phase='draw'}
function pesca(s,cat){const id=CATS[cat].id;
 const pick=(arr,key)=>{const u=s.used[key]=s.used[key]||[];if(u.length>=arr.length)u.length=0;const free=arr.map((_,i)=>i).filter(i=>!u.includes(i));const i=free[Math.floor(RND()*free.length)];u.push(i);return arr[i]};
 if(id==='mimo')return{cat,t:pick(MIMO,'mimo')};
 if(id==='disegno')return{cat,t:pick(DISEGNO,'disegno')};
 if(id==='canto')return{cat,t:pick(CANTO,'canto')};
 if(id==='parole'){if(RND()<.3){const r=pick(INDOVINELLI,'indov');return{cat,t:r[0],a:r[1]}}
  const w=pick(PAROLE_W,'pw'),m=Math.floor(RND()*4);
  if(m===0){let a=w.split(''),g;for(let i=0;i<8;i++){g=shuffle(a.slice()).join('');if(g!==w)break}return{cat,t:'Anagramma: '+g.toUpperCase().split('').join(' '),a:w}}
  if(m===1)return{cat,t:'Senza vocali: '+w.replace(/[aeiou]/g,'·').toUpperCase().split('').join(' '),a:w}
  if(m===2)return{cat,t:'Al contrario: '+w.split('').reverse().join('').toUpperCase(),a:w}
  return{cat,t:'Parola di '+w.length+' lettere: '+w[0].toUpperCase()+' '+'_ '.repeat(w.length-2)+w[w.length-1].toUpperCase(),a:w}}
 const c=DOMANDE.CATS[Math.floor(RND()*DOMANDE.CATS.length)],bank=DOMANDE.Q[c.id],r=pick(bank,'q'+c.id),o=shuffle(r.slice(1).map((t,j)=>({t,ok:j===0})));
 return{cat,t:r[0],o:o.map(x=>x.t),a:o.findIndex(x=>x.ok)}}
function nextTurn(s){s.cur=perf(s,(s.sq[s.cur]+1)%nsq(s));s.ev.push({t:'turn',p:s.cur});begin(s)}
function resolve(s,ok){const p=s.cur,c=s.card,fin=s.final;s.ev.push({t:'result',p,ok});
 if(fin){if(ok){const w=members(s,s.sq[p]);s.over={win:p,winners:w,scores:s.pos.slice(),why:'finale'};s.phase='end';s.ev.push({t:'over',p});L(s,tn(s,p)+' supera la prova finale e vince!');s.card=null;return}
  L(s,tn(s,p)+' non supera la prova finale: riprova al prossimo giro');s.card=null;s.who=-1;s.final=false;s.cur=perf(s,(s.sq[p]+1)%nsq(s));s.ev.push({t:'turn',p:s.cur});begin(s);return}
 if(ok){const d=1+Math.floor(RND()*6),from=s.pos[p],to=Math.min(GOAL,from+d);members(s,s.sq[p]).forEach(i=>{s.pos[i]=to});s.ev.push({t:'roll',p,d},{t:'move',p,from,to});L(s,tn(s,p)+' ci riesce: dado '+d+(to===GOAL?' e arriva al traguardo':''))}
 else L(s,tn(s,p)+' non ci riesce'+(c&&c.a!=null?' (era «'+(c.o?c.o[c.a]:c.a)+'»)':''));
 s.card=null;nextTurn(s)}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];
 if(a.t==='choose'){if(s.phase!=='choose')return fail('Non adesso');if(!(a.cat>=0&&a.cat<NC))return fail('Prova non valida');s.cat=a.cat;s.phase='draw';L(s,tn(s,s.cur)+' sceglie '+CATS[a.cat].n);s.evn++;return{s}}
 if(a.t==='pick'){if(s.phase!=='pick')return fail('Non adesso');if(!(a.cat>=0&&a.cat<NC))return fail('Prova non valida');const who=s.who;s.cur=who;s.final=true;s.cat=a.cat;s.phase='draw';L(s,'Prova finale per '+tn(s,who)+': '+CATS[a.cat].n);s.evn++;return{s}}
 if(a.t==='draw'){if(s.phase!=='draw')return fail('Non adesso');s.card=pesca(s,s.cat);s.phase='play';s.ev.push({t:'draw',p:s.cur,cat:s.cat});L(s,nm(s,s.cur)+' pesca una carta di '+CATS[s.cat].n);s.evn++;return{s}}
 if(a.t==='result'){if(s.phase!=='play')return fail('Non adesso');if(s.card.o)return fail('Rispondi alla domanda');resolve(s,!!a.ok);s.evn++;return{s}}
 if(a.t==='answer'){if(s.phase!=='play'||!s.card.o)return fail('Non adesso');if(!(a.k>=0&&a.k<s.card.o.length))return fail('Scegli una risposta');resolve(s,a.k===s.card.a);s.evn++;return{s}}
 return fail('Azione non valida adesso')}
return{newGame,act,setRnd:f=>{RND=f},members,tn,CATS,NC,PATH,GOAL,JOLLY,sq,MIMO,DISEGNO,CANTO,PAROLE_W,INDOVINELLI}})();
if(typeof module!=='undefined')module.exports=ZUCCA;
