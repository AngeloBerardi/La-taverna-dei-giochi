/* CATAN – commercio e costruzione su un'isola esagonale (regole del gioco base, 3-4 giocatori; con 2 e 5-6 giocatori si gioca allo stesso modo).
   Geometria fissa (19 esagoni, 54 incroci, 72 strade, 9 porti) costruita una volta sola; ogni partita mescola terreni, numeri e porti.
   Stato: res[p] e dev[p] sono nascosti agli altri (la vista mostra solo i totali). Gioco a stanze con azioni di tutti: s.sim = true, ogni azione porta a.seat.
   Fasi: setup (colonia + strada, a serpentina) · roll · discard (tutti i giocatori con più di 7 carte) · robber · steal · main · rb (strade gratis).
   Azioni: settle{v} road{e} city{v} roll buydev play{card,...} bank{give,get} offer{give,want,to?} accept reject cancel deal{p}
           discard{res} robber{h} steal{p} end. */
const CATAN=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const RES=['wood','brick','wool','grain','ore'];
const RN={wood:'Legno',brick:'Argilla',wool:'Lana',grain:'Grano',ore:'Roccia'};
const COST={road:{wood:1,brick:1},settle:{wood:1,brick:1,wool:1,grain:1},city:{grain:2,ore:3},dev:{wool:1,grain:1,ore:1}};
const LIM={road:15,settle:5,city:4};
/* ---- geometria ---- */
const HX=[],V=[],E=[],VK=new Map(),EK=new Map();
for(let r=-2;r<=2;r++)for(let q=-2;q<=2;q++)if(Math.abs(q+r)<=2)HX.push({q,r,x:Math.sqrt(3)*(q+r/2),y:1.5*r,v:[],e:[]});
HX.forEach((h,i)=>{for(let k=0;k<6;k++){const a=Math.PI/180*(60*k-30),x=h.x+Math.cos(a),y=h.y+Math.sin(a),kk=Math.round(x*100)+','+Math.round(y*100);let id=VK.get(kk);
  if(id==null){id=V.length;VK.set(kk,id);V.push({x,y,h:[],n:[],e:[]})}V[id].h.push(i);h.v.push(id)}});
HX.forEach((h,i)=>{for(let k=0;k<6;k++){const a=h.v[k],b=h.v[(k+1)%6],kk=Math.min(a,b)+'-'+Math.max(a,b);let id=EK.get(kk);
  if(id==null){id=E.length;EK.set(kk,id);E.push({a,b,h:[]});V[a].n.push(b);V[b].n.push(a);V[a].e.push(id);V[b].e.push(id)}E[id].h.push(i);h.e.push(id)}});
const HN=HX.map((h,i)=>{const o=new Set();h.e.forEach(e=>E[e].h.forEach(j=>{if(j!==i)o.add(j)}));return[...o]});
const COAST=E.map((e,i)=>i).filter(i=>E[i].h.length===1).sort((a,b)=>{const m=i=>Math.atan2((V[E[i].a].y+V[E[i].b].y)/2,(V[E[i].a].x+V[E[i].b].x)/2);return m(a)-m(b)});
const PORT_AT=[0,3,7,10,14,17,21,24,27].map(i=>COAST[i]);
const other=(e,v)=>E[e].a===v?E[e].b:E[e].a;
const L=(s,t)=>{s.log.push(t);if(s.log.length>50)s.log.shift()};
const tot=(r)=>RES.reduce((a,k)=>a+r[k],0);
const zero=()=>({wood:0,brick:0,wool:0,grain:0,ore:0});
const pips=n=>n?6-Math.abs(7-n):0;
function newGame(n,names,o={}){
 const terr=shuffle([...Array(4).fill('wood'),...Array(3).fill('brick'),...Array(4).fill('wool'),...Array(4).fill('grain'),...Array(3).fill('ore'),'desert']);
 const toks=[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12];let num;
 for(let tries=0;tries<500;tries++){shuffle(toks);let k=0;num=terr.map(t=>t==='desert'?0:toks[k++]);
  if(!num.some((x,i)=>(x===6||x===8)&&HN[i].some(j=>num[j]===6||num[j]===8)))break}
 const pk=shuffle(['any','any','any','any',...RES]);
 const s={n,names:names.slice(0,n),sim:true,vp:+o.vp>=5?+o.vp:10,hexes:terr.map((t,i)=>({t,num:num[i]})),ports:PORT_AT.map((e,i)=>({e,k:pk[i]})),robber:terr.indexOf('desert'),
  bld:{},roads:{},res:Array.from({length:n},zero),dev:Array.from({length:n},()=>[]),newDev:Array.from({length:n},()=>[]),playedDev:Array(n).fill(0),knights:Array(n).fill(0),
  bank:{wood:19,brick:19,wool:19,grain:19,ore:19},deck:shuffle([...Array(14).fill('knight'),...Array(5).fill('vp'),'rb','rb','yop','yop','mono','mono']),
  longest:null,army:null,cur:0,phase:'setup',dice:null,devPlayed:false,trade:null,disc:null,vict:null,after:null,rbLeft:0,setup:null,log:[],ev:[],evn:0,over:null};
 const st=Math.floor(RND()*n),order=[];for(let i=0;i<n;i++)order.push((st+i)%n);for(let i=n-1;i>=0;i--)order.push((st+i)%n);
 s.setup={order,i:0,step:'v',v:null};s.cur=order[0];L(s,'Si parte: ognuno posa due colonie con una strada. Comincia '+names[order[0]]);return s}
/* ---- regole di costruzione ---- */
const count=(s,p,k)=>Object.values(s.bld).filter(b=>b.p===p&&b.k===k).length;
const roadsOf=(s,p)=>Object.keys(s.roads).filter(e=>s.roads[e]===p).length;
const nbBuilt=(s,v)=>V[v].n.some(w=>s.bld[w]);
function canSettle(s,p,v,setup){if(!V[v]||s.bld[v])return'Incrocio occupato';if(nbBuilt(s,v))return'Troppo vicino a un’altra colonia (serve una strada di distanza)';
 if(count(s,p,1)>=LIM.settle)return'Hai già 5 colonie';if(setup)return null;
 return V[v].e.some(e=>s.roads[e]===p)?null:'Serve una tua strada che arrivi lì'}
function canRoad(s,p,e,from){if(!E[e]||s.roads[e]!=null)return'Strada occupata';if(roadsOf(s,p)>=LIM.road)return'Hai già 15 strade';
 const ends=from!=null?[from]:[E[e].a,E[e].b];
 if(from!=null)return E[e].a===from||E[e].b===from?null:'La strada deve partire dalla colonia appena posata';
 return ends.some(v=>{const b=s.bld[v];if(b)return b.p===p;return V[v].e.some(x=>x!==e&&s.roads[x]===p)})?null:'La strada deve collegarsi alle tue'}
const settleSpots=(s,p,setup)=>V.map((x,i)=>i).filter(v=>!canSettle(s,p,v,setup));
const roadSpots=(s,p,from)=>E.map((x,i)=>i).filter(e=>!canRoad(s,p,e,from));
const citySpots=(s,p)=>Object.keys(s.bld).map(Number).filter(v=>s.bld[v].p===p&&s.bld[v].k===1);
function roadLen(s,p){const mine=Object.keys(s.roads).filter(e=>s.roads[e]===p).map(Number);if(!mine.length)return 0;
 const byV={};mine.forEach(e=>[E[e].a,E[e].b].forEach(v=>(byV[v]=byV[v]||[]).push(e)));let best=0;const used=new Set();
 const dfs=(v,len)=>{best=Math.max(best,len);for(const e of byV[v]||[]){if(used.has(e))continue;used.add(e);const w=other(e,v);
   if(s.bld[w]&&s.bld[w].p!==p)best=Math.max(best,len+1);else dfs(w,len+1);used.delete(e)}};
 for(const v in byV)dfs(+v,0);return best}
function updateLongest(s){const lens=s.n?Array.from({length:s.n},(_,p)=>roadLen(s,p)):[],M=Math.max(...lens),old=s.longest&&s.longest.p;
 let w=null;if(M>=5){const c=lens.map((l,p)=>l===M?p:-1).filter(p=>p>=0);w=c.includes(old)?old:c.length===1?c[0]:null}
 s.longest=w==null?null:{p:w,len:lens[w]};if(w!=null&&w!==old)L(s,s.names[w]+' ha la strada più lunga ('+M+')');else if(w==null&&old!=null)L(s,'La strada più lunga non appartiene più a nessuno')}
function updateArmy(s,p){const k=s.knights[p];if(k>=3&&(!s.army||(s.army.p!==p&&k>s.army.n))){s.army={p,n:k};L(s,s.names[p]+' ha l’esercito più grande ('+k+' cavalieri)')}else if(s.army&&s.army.p===p)s.army.n=k}
function points(s,p,hidden){let v=0;for(const k in s.bld)if(s.bld[k].p===p)v+=s.bld[k].k;if(s.longest&&s.longest.p===p)v+=2;if(s.army&&s.army.p===p)v+=2;if(hidden)v+=s.dev[p].filter(c=>c==='vp').length;return v}
function ratio(s,p,r){let q=4;for(const pt of s.ports){const mine=[E[pt.e].a,E[pt.e].b].some(v=>s.bld[v]&&s.bld[v].p===p);if(!mine)continue;if(pt.k==='any')q=Math.min(q,3);else if(pt.k===r)q=Math.min(q,2)}return q}
const has=(s,p,c)=>RES.every(k=>(c[k]||0)<=s.res[p][k]);
function pay(s,p,c){RES.forEach(k=>{const n=c[k]||0;s.res[p][k]-=n;s.bank[k]+=n})}
/* produzione con il limite della banca (19 carte per risorsa) */
function produce(s,roll){const want=Array.from({length:s.n},zero);
 HX.forEach((h,i)=>{if(s.hexes[i].num!==roll||i===s.robber)return;h.v.forEach(v=>{const b=s.bld[v];if(b)want[b.p][s.hexes[i].t]+=b.k})});
 const got=Array.from({length:s.n},zero);
 for(const k of RES){const tot=want.reduce((a,w)=>a+w[k],0),who=want.map((w,p)=>w[k]?p:-1).filter(p=>p>=0);
  if(tot<=s.bank[k])who.forEach(p=>{got[p][k]=want[p][k]});else if(who.length===1)got[who[0]][k]=s.bank[k]}
 got.forEach((g,p)=>RES.forEach(k=>{s.res[p][k]+=g[k];s.bank[k]-=g[k]}));return got}
function check(s){if(s.over||s.phase==='setup')return;const p=s.cur,v=points(s,p,true);if(v>=s.vp){s.over={win:p,scores:Array.from({length:s.n},(_,i)=>points(s,i,true)),reason:s.vp+' punti vittoria'};s.ev.push({t:'end',win:p});L(s,s.names[p]+' arriva a '+v+' punti e vince!')}}
const cardsOf=(s,p)=>tot(s.res[p]);
function startRobber(s,after){s.phase='robber';s.after=after}
function endRobber(s){s.phase=s.after||'main';s.after=null;s.vict=null}
function stealFrom(s,vic){const me=s.cur,hand=[];RES.forEach(k=>{for(let i=0;i<s.res[vic][k];i++)hand.push(k)});if(!hand.length){endRobber(s);return}
 const k=hand[Math.floor(RND()*hand.length)];s.res[vic][k]--;s.res[me][k]++;s.ev.push({t:'steal',p:me,from:vic});L(s,s.names[me]+' ruba una carta a '+s.names[vic]);endRobber(s)}
function nextTurn(s){const p=s.cur;s.newDev[p]=[];s.cur=(p+1)%s.n;s.phase='roll';s.dice=null;s.devPlayed=false;s.trade=null;s.ev.push({t:'turn',p:s.cur});L(s,'Tocca a '+s.names[s.cur])}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];const p=a.seat;if(!Number.isInteger(p)||p<0||p>=s.n)return fail('Giocatore sconosciuto');
 const r=run(s,a,p);if(r&&r.err)return r;check(s);s.evn++;return{s}}
function run(s,a,p){
 /* risposte fuori turno */
 if(a.t==='discard'){if(s.phase!=='discard'||!s.disc||!s.disc[p])return fail('Non devi scartare');const c=a.res||{};let n=0;
  for(const k of RES){const x=c[k]||0;if(!Number.isInteger(x)||x<0||x>s.res[p][k])return fail('Scarto non valido');n+=x}
  if(n!==s.disc[p])return fail('Devi scartare esattamente '+s.disc[p]+' carte');pay(s,p,c);delete s.disc[p];s.ev.push({t:'discard',p,n});L(s,s.names[p]+' scarta '+n+' carte');
  if(!Object.keys(s.disc).length){s.disc=null;startRobber(s,'main')}return}
 if(a.t==='accept'||a.t==='reject'){const t=s.trade;if(s.phase!=='main'||!t||p===t.from||(t.to!=null&&t.to!==p))return fail('Nessuna offerta per te');
  if(a.t==='accept'){if(!has(s,p,t.want))return fail('Non hai le carte richieste');if(!t.acc.includes(p))t.acc.push(p);t.rej=t.rej.filter(x=>x!==p)}
  else{if(!t.rej.includes(p))t.rej.push(p);t.acc=t.acc.filter(x=>x!==p)}return}
 if(p!==s.cur)return fail('Non è il tuo turno');
 switch(s.phase){
 case'setup':{const S=s.setup;
  if(S.step==='v'){if(a.t!=='settle')return fail('Posa una colonia');const e=canSettle(s,p,a.v,true);if(e)return fail(e);
   s.bld[a.v]={p,k:1};S.v=a.v;S.step='e';s.ev.push({t:'build',p,k:'settle',x:a.v});L(s,s.names[p]+' posa una colonia');
   if(S.i>=s.n){const g=zero();V[a.v].h.forEach(h=>{const t=s.hexes[h].t;if(t!=='desert'&&s.bank[t]>0){s.res[p][t]++;s.bank[t]--;g[t]++}});s.ev.push({t:'gain',p,res:g})}return}
  if(a.t!=='road')return fail('Posa una strada accanto alla colonia');const e=canRoad(s,p,a.e,S.v);if(e)return fail(e);
  s.roads[a.e]=p;s.ev.push({t:'build',p,k:'road',x:a.e});S.i++;S.step='v';S.v=null;
  if(S.i>=S.order.length){s.phase='roll';s.cur=S.order[0];s.setup=null;L(s,'Si gioca! Tocca a '+s.names[s.cur])}else s.cur=S.order[S.i];return}
 case'roll':
  if(a.t==='roll'){const d=[1+Math.floor(RND()*6),1+Math.floor(RND()*6)],sum=d[0]+d[1];s.dice=d;s.ev.push({t:'roll',d});L(s,s.names[p]+' tira: '+d[0]+' + '+d[1]+' = '+sum);
   if(sum===7){const need={};for(let i=0;i<s.n;i++){const c=cardsOf(s,i);if(c>7)need[i]=Math.floor(c/2)}
    if(Object.keys(need).length){s.disc=need;s.phase='discard';s.ev.push({t:'seven'})}else{s.ev.push({t:'seven'});startRobber(s,'main')}return}
   const g=produce(s,sum);s.phase='main';s.ev.push({t:'gain',all:g});
   if(g.every(x=>!tot(x)))L(s,'Nessuno raccoglie risorse');return}
  if(a.t==='play'&&a.card==='knight')return playDev(s,p,a);
  return fail('Tira i dadi');
 case'robber':{if(a.t!=='robber')return fail('Sposta il ladro');const h=a.h;if(!Number.isInteger(h)||h<0||h>=HX.length)return fail('Esagono non valido');if(h===s.robber)return fail('Il ladro deve cambiare esagono');
  s.robber=h;s.ev.push({t:'robber',h});const vic=[...new Set(HX[h].v.map(v=>s.bld[v]&&s.bld[v].p).filter(x=>x!=null&&x!==p&&cardsOf(s,x)>0))];L(s,s.names[p]+' sposta il ladro');
  if(!vic.length)endRobber(s);else if(vic.length===1)stealFrom(s,vic[0]);else{s.phase='steal';s.vict=vic}return}
 case'steal':{if(a.t!=='steal'||!s.vict.includes(a.p))return fail('Scegli a chi rubare');stealFrom(s,a.p);return}
 case'rb':{if(a.t!=='road')return fail('Posa le strade gratuite');const e=canRoad(s,p,a.e);if(e)return fail(e);s.roads[a.e]=p;s.ev.push({t:'build',p,k:'road',x:a.e});s.rbLeft--;updateLongest(s);
  if(s.rbLeft<=0||!roadSpots(s,p).length)s.phase='main';return}
 case'discard':return fail('Aspetta gli scarti degli altri');
 case'main':return main(s,a,p)}
 return fail('Azione non valida adesso')}
function playDev(s,p,a){const c=a.card;if(s.devPlayed)return fail('Una sola carta sviluppo per turno');if(!['knight','rb','yop','mono'].includes(c))return fail('Carta non giocabile');
 const own=s.dev[p].filter(x=>x===c).length-s.newDev[p].filter(x=>x===c).length;if(own<1)return fail(s.dev[p].includes(c)?'Non puoi giocare una carta appena comprata':'Non hai quella carta');
 const before=s.phase;
 if(c==='yop'){if(!RES.includes(a.a)||!RES.includes(a.b))return fail('Scegli due risorse');const need=zero();need[a.a]++;need[a.b]++;if(RES.some(k=>need[k]>s.bank[k]))return fail('La banca non ha quelle carte')}
 if(c==='mono'&&!RES.includes(a.r))return fail('Scegli una risorsa');
 if(c==='rb'&&!roadSpots(s,p).length)return fail('Non hai dove posare strade');
 s.dev[p].splice(s.dev[p].indexOf(c),1);s.devPlayed=true;s.playedDev[p]++;s.ev.push({t:'dev',p,card:c});
 if(c==='knight'){s.knights[p]++;updateArmy(s,p);L(s,s.names[p]+' gioca un cavaliere');startRobber(s,before);return}
 if(c==='rb'){s.phase='rb';s.rbLeft=2;L(s,s.names[p]+' gioca Costruzione strade');return}
 if(c==='yop'){s.res[p][a.a]++;s.res[p][a.b]++;s.bank[a.a]--;s.bank[a.b]--;L(s,s.names[p]+' gioca Invenzione e prende 2 risorse');return}
 let n=0;for(let i=0;i<s.n;i++)if(i!==p){n+=s.res[i][a.r];s.res[p][a.r]+=s.res[i][a.r];s.res[i][a.r]=0}L(s,s.names[p]+' gioca Monopolio: prende '+n+' × '+RN[a.r]);s.ev.push({t:'mono',p,n})}
function main(s,a,p){switch(a.t){
 case'road':{const e=canRoad(s,p,a.e);if(e)return fail(e);if(!has(s,p,COST.road))return fail('Ti servono Legno e Argilla');pay(s,p,COST.road);s.roads[a.e]=p;s.ev.push({t:'build',p,k:'road',x:a.e});L(s,s.names[p]+' costruisce una strada');updateLongest(s);return}
 case'settle':{const e=canSettle(s,p,a.v);if(e)return fail(e);if(!has(s,p,COST.settle))return fail('Ti servono Legno, Argilla, Lana e Grano');pay(s,p,COST.settle);s.bld[a.v]={p,k:1};s.ev.push({t:'build',p,k:'settle',x:a.v});L(s,s.names[p]+' costruisce una colonia');updateLongest(s);return}
 case'city':{const b=s.bld[a.v];if(!b||b.p!==p||b.k!==1)return fail('Serve una tua colonia');if(count(s,p,2)>=LIM.city)return fail('Hai già 4 città');if(!has(s,p,COST.city))return fail('Ti servono 2 Grano e 3 Roccia');pay(s,p,COST.city);b.k=2;s.ev.push({t:'build',p,k:'city',x:a.v});L(s,s.names[p]+' trasforma una colonia in città');return}
 case'buydev':{if(!s.deck.length)return fail('Le carte sviluppo sono finite');if(!has(s,p,COST.dev))return fail('Ti servono Lana, Grano e Roccia');pay(s,p,COST.dev);const c=s.deck.shift();s.dev[p].push(c);s.newDev[p].push(c);s.ev.push({t:'buydev',p});L(s,s.names[p]+' compra una carta sviluppo');return}
 case'play':return playDev(s,p,a);
 case'bank':{if(!RES.includes(a.give)||!RES.includes(a.get)||a.give===a.get)return fail('Scegli due risorse diverse');const q=ratio(s,p,a.give);
  if(s.res[p][a.give]<q)return fail('Ti servono '+q+' × '+RN[a.give]);if(s.bank[a.get]<1)return fail('La banca non ha '+RN[a.get]);
  s.res[p][a.give]-=q;s.bank[a.give]+=q;s.res[p][a.get]++;s.bank[a.get]--;s.ev.push({t:'bank',p});L(s,s.names[p]+' scambia '+q+' × '+RN[a.give]+' con 1 × '+RN[a.get]+' in banca');return}
 case'offer':{const g=a.give||{},w=a.want||{};for(const k of RES){if(!Number.isInteger(g[k]||0)||!Number.isInteger(w[k]||0)||(g[k]||0)<0||(w[k]||0)<0)return fail('Offerta non valida');if(g[k]&&w[k])return fail('Non puoi dare e chiedere la stessa risorsa')}
  if(!RES.some(k=>g[k]>0)||!RES.some(k=>w[k]>0))return fail('Dai e chiedi almeno una carta');if(!has(s,p,g))return fail('Non hai le carte che offri');
  if(a.to!=null&&(a.to===p||!(a.to>=0&&a.to<s.n)))return fail('Destinatario non valido');
  s.trade={from:p,give:Object.fromEntries(RES.map(k=>[k,g[k]||0])),want:Object.fromEntries(RES.map(k=>[k,w[k]||0])),to:a.to==null?null:a.to,acc:[],rej:[]};s.ev.push({t:'offer',p});L(s,s.names[p]+' propone uno scambio');return}
 case'cancel':s.trade=null;return;
 case'deal':{const t=s.trade;if(!t||!t.acc.includes(a.p))return fail('Nessuno ha accettato');if(!has(s,p,t.give)||!has(s,a.p,t.want))return fail('Le carte non bastano più');
  RES.forEach(k=>{s.res[p][k]+=t.want[k]-t.give[k];s.res[a.p][k]+=t.give[k]-t.want[k]});s.trade=null;s.ev.push({t:'trade',p,q:a.p});L(s,s.names[p]+' e '+s.names[a.p]+' si scambiano delle carte');return}
 case'end':nextTurn(s);return}
 return fail('Azione sconosciuta')}
return{newGame,act,setRnd:f=>{RND=f},HX,V,E,HN,RES,RN,COST,LIM,canSettle,canRoad,settleSpots,roadSpots,citySpots,roadLen,points,ratio,has,pips,count,roadsOf,cardsOf,tot}})();
if(typeof module!=='undefined')module.exports=CATAN;
