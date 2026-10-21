/* QUIZ DELLA TAVERNA (gioco di domande su percorso, ispirato al genere dei quiz da tavolo; domande, grafica e testi nostri). 2-6 giocatori.
   Percorso circolare di 42 caselle; ogni 7 c'è un SPICCHIO (6 categorie), alle caselle 3,10,17… «Rilancia». Si tira un dado, si va avanti o indietro,
   si risponde (4 risposte) alla domanda della categoria della casella. Giusto: si tira ancora (e su uno spicchio non ancora tuo lo guadagni). Sbagliato: tocca al prossimo.
   Con i 6 spicchi si va al centro: gli avversari scelgono la categoria della domanda finale; giusta = vittoria, sbagliata = si riparte da uno spicchio.
   Fasi: roll (cur tira) · move (cur sceglie la direzione) · ask (cur risponde) · pick (cur = chi sceglie la categoria finale per who).
   Azioni: roll move{dir} answer{k} pick{cat}. */
const QUIZ=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const SQ=42,HUB=7,NC=6;
/* tipo della casella: {h:categoria} spicchio · {r:1} rilancia · {c:categoria} normale */
const sq=p=>p%HUB===0?{h:p/HUB}:p%HUB===3?{r:1}:{c:(p+Math.floor(p/HUB))%NC};
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const nm=(s,i)=>s.names[i];
const wcount=m=>{let n=0;for(let i=0;i<NC;i++)if(m&(1<<i))n++;return n};
const wedges=(s,p)=>wcount(s.wedge[p]);
function newGame(n,names,o={}){const used={};for(const c of DOMANDE.CATS)used[c.id]=[];
 const s={n,names:names.slice(0,n),hands:Array.from({length:n},()=>[]),pos:Array(n).fill(0),wedge:Array(n).fill(0),used,phase:'roll',roll:0,q:null,hub:false,final:false,who:-1,
  cur:Math.floor(RND()*n),log:[],ev:[],evn:0,over:null};L(s,'Ognuno parte da uno spicchio. Comincia '+nm(s,s.cur));return s}
function ask(s,cat,final){const id=DOMANDE.CATS[cat].id,bank=DOMANDE.Q[id];let u=s.used[id];if(u.length>=bank.length)u=s.used[id]=[];
 const free=bank.map((_,i)=>i).filter(i=>!u.includes(i));const i=free[Math.floor(RND()*free.length)];u.push(i);
 const r=bank[i],opts=shuffle(r.slice(1).map((t,j)=>({t,ok:j===0})));
 s.q={cat,t:r[0],o:opts.map(x=>x.t),a:opts.findIndex(x=>x.ok),final:!!final};s.phase='ask'}
function startFinal(s){const p=s.cur;s.who=p;s.phase='pick';s.cur=(p+1)%s.n;s.q=null;s.ev.push({t:'final',p});L(s,nm(s,p)+' ha tutti i sei spicchi: va al centro! '+nm(s,s.cur)+' sceglie la categoria della domanda finale')}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];const p=s.cur;
 if(a.t==='roll'){if(s.phase!=='roll')return fail('Non adesso');const d=1+Math.floor(RND()*6);s.roll=d;s.phase='move';s.ev.push({t:'roll',p,d});L(s,nm(s,p)+' tira: '+d);s.evn++;return{s}}
 if(a.t==='move'){if(s.phase!=='move')return fail('Prima tira il dado');if(a.dir!==1&&a.dir!==-1)return fail('Scegli una direzione');
  const from=s.pos[p],to=((from+a.dir*s.roll)%SQ+SQ)%SQ;s.pos[p]=to;s.ev.push({t:'move',p,from,to,dir:a.dir});const k=sq(to);
  if(k.r){L(s,nm(s,p)+' arriva su «Rilancia»: tira ancora');s.phase='roll';s.evn++;return{s}}
  ask(s,k.h!=null?k.h:k.c,false);s.hub=k.h!=null;L(s,nm(s,p)+' va su '+DOMANDE.CATS[s.q.cat].n.toLowerCase()+(k.h!=null?' (spicchio)':''));s.evn++;return{s}}
 if(a.t==='answer'){if(s.phase!=='ask')return fail('Non c’è una domanda');if(!(a.k>=0&&a.k<s.q.o.length))return fail('Scegli una risposta');
  const ok=a.k===s.q.a,q=s.q,cat=q.cat;s.ev.push({t:'answer',p,ok,a:s.q.a});
  if(q.final){if(ok){const winners=[p];s.over={win:p,winners,scores:s.wedge.map(wcount),why:'finale'};s.phase='end';L(s,nm(s,p)+' risponde giusto alla domanda finale e vince!');s.ev.push({t:'over',p});s.q=null;s.evn++;return{s}}
   L(s,nm(s,p)+' sbaglia la finale: «'+q.o[q.a]+'». Riparte da uno spicchio');s.pos[p]=0;s.q=null;s.who=-1;s.phase='roll';s.cur=(p+1)%s.n;s.ev.push({t:'turn',p:s.cur});s.evn++;return{s}}
  if(ok){L(s,nm(s,p)+' risponde giusto');
   if(s.hub&&!(s.wedge[p]&(1<<cat))){s.wedge[p]|=1<<cat;s.ev.push({t:'wedge',p,cat});L(s,nm(s,p)+' guadagna lo spicchio '+DOMANDE.CATS[cat].n+' ('+wedges(s,p)+'/6)')}
   s.q=null;s.hub=false;if(wedges(s,p)===NC){startFinal(s);s.evn++;return{s}}
   s.phase='roll';s.evn++;return{s}}
  L(s,nm(s,p)+' sbaglia: la risposta era «'+q.o[q.a]+'»');s.q=null;s.hub=false;s.phase='roll';s.cur=(p+1)%s.n;s.ev.push({t:'turn',p:s.cur});s.evn++;return{s}}
 if(a.t==='pick'){if(s.phase!=='pick')return fail('Non adesso');if(!(a.cat>=0&&a.cat<NC))return fail('Categoria non valida');
  const who=s.who;s.cur=who;ask(s,a.cat,true);L(s,nm(s,p)+' sceglie '+DOMANDE.CATS[a.cat].n+' per '+nm(s,who));s.evn++;return{s}}
 return fail('Azione non valida adesso')}
/* caselle raggiungibili con il tiro corrente (per la vista e per i bot) */
const dests=s=>[1,-1].map(d=>({dir:d,to:((s.pos[s.cur]+d*s.roll)%SQ+SQ)%SQ}));
return{newGame,act,setRnd:f=>{RND=f},sq,dests,wedges,SQ,HUB,NC}})();
if(typeof module!=='undefined')module.exports=QUIZ;
