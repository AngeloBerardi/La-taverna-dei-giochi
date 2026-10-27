/* CATAN – commercio e costruzione su un'isola esagonale (regole del gioco base e ampliamenti per 5-6 e 7-8 giocatori, con fase di costruzione speciale).
   Tre plance: 3-4 giocatori 19 esagoni/54 incroci/72 strade/9 porti; 5-6: 30 esagoni, 11 porti; 7-8: 37 esagoni, 12 porti (dotazioni in KIT); ogni partita mescola terreni, numeri e porti.
   Stato: res[p] e dev[p] sono nascosti agli altri (la vista mostra solo i totali). Gioco a stanze con azioni di tutti: s.sim = true, ogni azione porta a.seat.
   Fasi: setup (colonia + strada, a serpentina) · roll · discard (tutti i giocatori con più di 7 carte) · robber · steal · main · rb (strade gratis).
   Azioni: settle{v} road{e} city{v} roll buydev play{card,...} bank{give,get} offer{give,want,to?} accept reject cancel deal{p}
           discard{res} robber{h} steal{p} end. */
const CATAN=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
/* espansioni: moduli registrati con CATAN.ext(nome,{...}); un gioco ne attiva alcune in s.xt. Ogni gancio riceve (KX, s, ...argomenti):
   X = l'ultimo risultato non undefined (sostituzioni), XS = somma (punti). Vedi docs/CATAN-ESPANSIONI.md. */
const EXT={};let KX=null;
const X=(s,n,...a)=>{let r;for(const k of(s&&s.xt)||[]){const h=EXT[k]&&EXT[k][n];if(h){const v=h(KX,s,...a);if(v!==undefined)r=v}}return r};
const XS=(s,n,...a)=>(((s&&s.xt)||[]).reduce((t,k)=>t+((EXT[k]&&EXT[k][n]&&EXT[k][n](KX,s,...a))||0),0));
const RES=['wood','brick','wool','grain','ore'];
const RN={wood:'Legno',brick:'Argilla',wool:'Lana',grain:'Grano',ore:'Roccia'};
const COST={ship:{wood:1,wool:1},road:{wood:1,brick:1},settle:{wood:1,brick:1,wool:1,grain:1},city:{grain:2,ore:3},dev:{wool:1,grain:1,ore:1}};
const LIM={road:15,settle:5,city:4,ship:15};
/* ---- geometria: tre plance (3-4 giocatori: 19 esagoni; 5-6: 30; 7-8: 37), costruite una volta sola ---- */
const PROF={a:[3,4,5,4,3],b:[3,4,5,6,5,4,3],c:[4,5,6,7,6,5,4]};
function buildHexes(HC){const HX=HC.map(h=>({q:h.q,r:h.r,x:h.x,y:h.y,v:[],e:[]})),V=[],E=[],VK=new Map(),EK=new Map();
 HX.forEach((h,i)=>{for(let k=0;k<6;k++){const a=Math.PI/180*(60*k-30),x=h.x+Math.cos(a),y=h.y+Math.sin(a),kk=Math.round(x*100)+','+Math.round(y*100);let id=VK.get(kk);
  if(id==null){id=V.length;VK.set(kk,id);V.push({x,y,h:[],n:[],e:[]})}V[id].h.push(i);h.v.push(id)}});
 HX.forEach((h,i)=>{for(let k=0;k<6;k++){const a=h.v[k],b=h.v[(k+1)%6],kk=Math.min(a,b)+'-'+Math.max(a,b);let id=EK.get(kk);
  if(id==null){id=E.length;EK.set(kk,id);E.push({a,b,h:[]});V[a].n.push(b);V[b].n.push(a);V[a].e.push(id);V[b].e.push(id)}E[id].h.push(i);h.e.push(id)}});
 const HN=HX.map((h,i)=>{const o=new Set();h.e.forEach(e=>E[e].h.forEach(j=>{if(j!==i)o.add(j)}));return[...o]});
 return{HX,V,E,HN}}
function coastOf(g,nPorts){const{V,E}=g;
 const COAST=E.map((e,i)=>i).filter(i=>E[i].h.length===1).sort((a,b)=>{const m=i=>Math.atan2((V[E[i].a].y+V[E[i].b].y)/2,(V[E[i].a].x+V[E[i].b].x)/2);return m(a)-m(b)});
 const PORT_AT=nPorts===9?[0,3,7,10,14,17,21,24,27].map(i=>COAST[i]):Array.from({length:nPorts},(_,i)=>COAST[Math.floor(i*COAST.length/nPorts)]);
 return{COAST,PORT_AT}}
function build(rows,nPorts){const HC=[];rows.forEach((len,r)=>{for(let c=0;c<len;c++)HC.push({q:c,r,x:Math.sqrt(3)*(c-(len-1)/2),y:1.5*(r-(rows.length-1)/2)})});
 const g=buildHexes(HC);return Object.assign(g,coastOf(g,nPorts))}
/* plance libere (espansioni): elenco di esagoni in coordinate assiali [q,r], tenuto in s.lay; la geometria si costruisce una volta e si tiene in cache */
const GEOC=new Map();
function geoLay(lay){const k=lay.join(';');let g=GEOC.get(k);if(!g){g=buildHexes(lay.map(([q,r])=>({q,r,x:Math.sqrt(3)*(q+r/2),y:1.5*r})));g.COAST=[];g.PORT_AT=[];if(GEOC.size>12)GEOC.delete(GEOC.keys().next().value);GEOC.set(k,g)}return g}
const GEO={a:build(PROF.a,9),b:build(PROF.b,11),c:build(PROF.c,12)};
/* profilo per numero di giocatori e dotazione (terreni, numeri, banca, mazzo) */
const profOf=n=>n<=4?'a':n<=6?'b':'c';
const KIT={
 a:{terr:{wood:4,brick:3,wool:4,grain:4,ore:3,desert:1},toks:[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],bank:19,ports:{any:4,res:1},dev:{knight:14,vp:5,rb:2,yop:2,mono:2}},
 b:{terr:{wood:6,brick:5,wool:6,grain:6,ore:5,desert:2},toks:[2,2,3,3,3,4,4,4,5,5,5,6,6,6,8,8,8,9,9,9,10,10,10,11,11,11,12,12],bank:24,ports:{any:6,res:1},dev:{knight:20,vp:5,rb:3,yop:3,mono:3}},
 c:{terr:{wood:7,brick:7,wool:7,grain:7,ore:7,desert:2},toks:[2,2,3,3,3,4,4,4,5,5,5,6,6,6,6,8,8,8,8,9,9,9,10,10,10,10,11,11,11,12,12,3,4,9,10],bank:29,ports:{any:7,res:1},dev:{knight:26,vp:5,rb:4,yop:4,mono:4}}};
let HX,V,E,HN,COAST,PORT_AT;
const use=s=>{const g=s&&s.lay?geoLay(s.lay):GEO[(s&&s.prof)||'a'];HX=g.HX;V=g.V;E=g.E;HN=g.HN;COAST=g.COAST;PORT_AT=g.PORT_AT;return g};
use(null);
const other=(e,v)=>E[e].a===v?E[e].b:E[e].a;
const L=(s,t)=>{s.log.push(t);if(s.log.length>50)s.log.shift()};
const tot=(r)=>Object.values(r).reduce((a,b)=>a+b,0);
/* carte in mano: le 5 risorse più le eventuali merci di un'espansione (s.xk) */
const KEYS=s=>s&&s.xk&&s.xk.length?RES.concat(s.xk):RES;
const zero=()=>({wood:0,brick:0,wool:0,grain:0,ore:0});
const pips=n=>n?6-Math.abs(7-n):0;
/* plancia classica: terreni, numeri (mai 6 e 8 vicini), porti sulla costa */
function defaultMap(n){const prof=profOf(n),Kt=KIT[prof];use({prof});
 const terr=shuffle(Object.entries(Kt.terr).flatMap(([k,c])=>Array(c).fill(k)));
 const toks=Kt.toks.slice();let num;
 for(let tries=0;tries<3000;tries++){shuffle(toks);let k=0;num=terr.map(t=>t==='desert'?0:toks[k++]);
  if(!num.some((x,i)=>(x===6||x===8)&&HN[i].some(j=>num[j]===6||num[j]===8)))break}
 const pk=shuffle([...Array(Kt.ports.any).fill('any'),...RES]);
 return{prof,hexes:terr.map((t,i)=>({t,num:num[i]})),ports:PORT_AT.map((e,i)=>({e,k:pk[i]})),robber:terr.indexOf('desert')}}
/* partite predefinite per la stanza: opts.x sceglie un modo (espansioni e scenari) senza dover conoscere i singoli interruttori */
const PRE=[['base','Gioco base · 10 punti',{}],['rapida','Gioco base · partita rapida (8 punti)',{vp:8}],
 ['nt','Marinai · Terre da scoprire',{ext:['mar'],scen:'nt'}],['qi','Marinai · Le quattro isole',{ext:['mar'],scen:'qi'}],['ne','Marinai · Mare di nebbia',{ext:['mar'],scen:'ne'}],['ar','Marinai · Arcipelago',{ext:['mar'],scen:'ar'}],
 ['cek','Città e Difensori',{ext:['cek']}],['cekmar','Città e Difensori sul mare',{ext:['mar','cek'],scen:'nt'}]];
const presets=()=>PRE.filter(p=>(p[2].ext||[]).every(k=>EXT[k]));
function newGame(n,names,o={}){
 if(o.x){const pr=PRE.find(p=>p[0]===o.x);if(pr)o=Object.assign({},pr[2],o)}
 const xt=(o.ext||[]).filter(k=>EXT[k]),mapper=xt.map(k=>EXT[k]).find(e=>e.map);
 const M=mapper?mapper.map(KX,n,o):defaultMap(n),Kt=KIT[profOf(n)];
 if(M.lay)use({lay:M.lay});else use({prof:M.prof});
 const vp=+o.vp>=5?+o.vp:Math.max(10,M.vp||0,...xt.map(k=>EXT[k].vp||0));
 const s={n,prof:M.prof||null,lay:M.lay||null,xt,names:names.slice(0,n),sim:true,sbp:null,turnP:0,vp,hexes:M.hexes,ports:M.ports,robber:M.robber,pirate:M.pirate==null?null:M.pirate,start:M.start||null,
  bld:{},roads:{},ships:{},newShips:[],shipMoved:false,gold:null,res:Array.from({length:n},zero),dev:Array.from({length:n},()=>[]),newDev:Array.from({length:n},()=>[]),playedDev:Array(n).fill(0),knights:Array(n).fill(0),
  bank:Object.fromEntries(RES.map(k=>[k,M.bank||Kt.bank])),deck:shuffle(Object.entries(M.devKit||Kt.dev).flatMap(([k,c])=>Array(c).fill(k))),
  longest:null,army:null,cur:0,phase:'setup',dice:null,devPlayed:false,trade:null,disc:null,vict:null,after:null,rbLeft:0,setup:null,log:[],ev:[],evn:0,over:null};
 if(M.extra)Object.assign(s,M.extra);
 const st=Math.floor(RND()*n),order=[];for(let i=0;i<n;i++)order.push((st+i)%n);for(let i=n-1;i>=0;i--)order.push((st+i)%n);
 s.setup={order,i:0,step:'v',v:null};s.cur=order[0];s.turnP=order[0];X(s,'init',o);L(s,'Si parte: ognuno posa due colonie con una strada. Comincia '+names[order[0]]);return s}
/* ---- regole di costruzione ---- */
const count=(s,p,k)=>Object.values(s.bld).filter(b=>b.p===p&&b.k===k).length;
const roadsOf=(s,p)=>Object.keys(s.roads).filter(e=>s.roads[e]===p).length;
const shipsOf=(s,p)=>Object.keys(s.ships||{}).filter(e=>s.ships[e]===p).length;
const nbBuilt=(s,v)=>V[v].n.some(w=>s.bld[w]);
/* terra e mare: un esagono nascosto dalla nebbia conta come mare finché non viene scoperto */
const landH=(s,i)=>s.hexes[i].t!=='sea'&&!s.hexes[i].fog;
const seaH=(s,i)=>s.hexes[i].t==='sea'||!!s.hexes[i].fog;
const hasShip=(s,p,e)=>s.ships&&s.ships[e]===p;
function canSettle(s,p,v,setup){if(!V[v]||s.bld[v])return'Incrocio occupato';if(!V[v].h.some(i=>landH(s,i)))return'Qui c’è solo mare';
 if(nbBuilt(s,v))return'Troppo vicino a un’altra colonia (serve una strada di distanza)';
 if(count(s,p,1)>=LIM.settle)return'Hai già 5 colonie';
 if(setup)return s.start&&!s.start.includes(v)?'Si comincia sull’isola di partenza':null;
 return V[v].e.some(e=>s.roads[e]===p||hasShip(s,p,e))?null:'Serve una tua strada (o una nave) che arrivi lì'}
function canRoad(s,p,e,from){if(!E[e]||s.roads[e]!=null||(s.ships&&s.ships[e]!=null))return'Strada occupata';if(roadsOf(s,p)>=LIM.road)return'Hai già 15 strade';
 if(!E[e].h.some(i=>landH(s,i)))return'Le strade stanno sulla terra: in mare servono le navi';
 const ends=from!=null?[from]:[E[e].a,E[e].b];
 if(from!=null)return E[e].a===from||E[e].b===from?null:'La strada deve partire dalla colonia appena posata';
 return ends.some(v=>{const b=s.bld[v];if(b)return b.p===p;return V[v].e.some(x=>x!==e&&s.roads[x]===p)})?null:'La strada deve collegarsi alle tue'}
/* nave: solo su tratti che toccano il mare, collegata a una propria colonia o a un'altra propria nave; il pirata blocca i tratti intorno a sé */
function canShip(s,p,e,o){o=o||{};if(!E[e])return'Posizione non valida';if(s.roads[e]!=null||(s.ships[e]!=null&&e!==o.skip))return'Tratto occupato';
 if(!E[e].h.some(i=>seaH(s,i)))return'Le navi navigano solo sul mare';
 if(s.pirate!=null&&HX[s.pirate].e.includes(e))return'Il pirata blocca quel tratto di mare';
 if(!o.skip&&shipsOf(s,p)>=LIM.ship)return'Hai già 15 navi';
 if(o.from!=null)return E[e].a===o.from||E[e].b===o.from?null:'La nave deve partire dalla colonia appena posata';
 return[E[e].a,E[e].b].some(v=>{const b=s.bld[v];if(b)return b.p===p;return V[v].e.some(x=>x!==e&&x!==o.skip&&hasShip(s,p,x))})?null:'La nave deve collegarsi a una tua colonia o a una tua nave'}
/* una nave è «aperta» se un suo estremo non è agganciato a una tua colonia, città o altra nave: solo quelle si spostano */
function shipOpen(s,p,e){return[E[e].a,E[e].b].some(v=>{const b=s.bld[v];if(b&&b.p===p)return false;return!V[v].e.some(x=>x!==e&&hasShip(s,p,x))})}
const settleSpots=(s,p,setup)=>V.map((x,i)=>i).filter(v=>!canSettle(s,p,v,setup));
const roadSpots=(s,p,from)=>E.map((x,i)=>i).filter(e=>!canRoad(s,p,e,from));
const shipSpots=(s,p,o)=>E.map((x,i)=>i).filter(e=>!canShip(s,p,e,o));
const citySpots=(s,p)=>Object.keys(s.bld).map(Number).filter(v=>s.bld[v].p===p&&s.bld[v].k===1);
/* percorso più lungo: strade e navi insieme; da una strada a una nave (o viceversa) si passa solo da una propria colonia o città */
function roadLen(s,p){const mine=[];for(const e in s.roads)if(s.roads[e]===p)mine.push([+e,0]);for(const e in (s.ships||{}))if(s.ships[e]===p)mine.push([+e,1]);if(!mine.length)return 0;
 const kind={},byV={};mine.forEach(([e,k])=>{kind[e]=k;[E[e].a,E[e].b].forEach(v=>(byV[v]=byV[v]||[]).push(e))});let best=0;const used=new Set();
 const dfs=(v,len,pk)=>{best=Math.max(best,len);for(const e of byV[v]||[]){if(used.has(e))continue;if(pk!=null&&pk!==kind[e]&&!(s.bld[v]&&s.bld[v].p===p))continue;
   used.add(e);const w=other(e,v);if(s.bld[w]&&s.bld[w].p!==p)best=Math.max(best,len+1);else dfs(w,len+1,kind[e]);used.delete(e)}};
 for(const v in byV)dfs(+v,0,null);return best}
function updateLongest(s){const lens=s.n?Array.from({length:s.n},(_,p)=>roadLen(s,p)):[],M=Math.max(...lens),old=s.longest&&s.longest.p;
 let w=null;if(M>=5){const c=lens.map((l,p)=>l===M?p:-1).filter(p=>p>=0);w=c.includes(old)?old:c.length===1?c[0]:null}
 s.longest=w==null?null:{p:w,len:lens[w]};if(w!=null&&w!==old)L(s,s.names[w]+' ha la strada più lunga ('+M+')');else if(w==null&&old!=null)L(s,'La strada più lunga non appartiene più a nessuno')}
function updateArmy(s,p){const k=s.knights[p];if(k>=3&&(!s.army||(s.army.p!==p&&k>s.army.n))){s.army={p,n:k};L(s,s.names[p]+' ha l’esercito più grande ('+k+' cavalieri)')}else if(s.army&&s.army.p===p)s.army.n=k}
function points(s,p,hidden){let v=0;for(const k in s.bld)if(s.bld[k].p===p)v+=s.bld[k].k;if(s.longest&&s.longest.p===p)v+=2;if(s.army&&s.army.p===p)v+=2;if(hidden)v+=s.dev[p].filter(c=>c==='vp').length;v+=XS(s,'points',p,hidden);return v}
function ratio(s,p,r){let q=4;for(const pt of s.ports){const mine=[E[pt.e].a,E[pt.e].b].some(v=>s.bld[v]&&s.bld[v].p===p);if(!mine)continue;if(pt.k==='any')q=Math.min(q,3);else if(pt.k===r)q=Math.min(q,2)}const o=X(s,'ratio',p,r,q);return o==null?q:o}
const has=(s,p,c)=>Object.keys(c).every(k=>(c[k]||0)<=(s.res[p][k]||0));
function pay(s,p,c){Object.keys(c).forEach(k=>{const n=c[k]||0;s.res[p][k]-=n;s.bank[k]+=n})}
/* produzione con il limite della banca (19 carte per risorsa) */
function produce(s,roll){const K=KEYS(s),z=()=>Object.fromEntries(K.map(k=>[k,0])),want=Array.from({length:s.n},z),gw=Array(s.n).fill(0);
 HX.forEach((h,i)=>{const x=s.hexes[i];if(x.num!==roll||(i===s.robber&&!s.robOff)||x.fog||x.t==='sea')return;h.v.forEach(v=>{const b=s.bld[v];if(!b)return;
  if(x.t==='gold')gw[b.p]+=b.k;else{const y=X(s,'yield',b,x.t,i);if(y)Object.keys(y).forEach(k=>{want[b.p][k]+=y[k]});else want[b.p][x.t]+=b.k}})});
 /* oro: chi ha una colonia (1) o una città (2) accanto sceglie altrettante risorse a piacere, nei limiti della banca */
 let left=RES.reduce((a,k)=>a+s.bank[k],0);s.gold=null;gw.forEach((n,p)=>{if(n>0&&left>0){const m=Math.min(n,left);(s.gold=s.gold||{})[p]=m;left-=m}});
 const got=Array.from({length:s.n},z);
 for(const k of K){const tot=want.reduce((a,w)=>a+w[k],0),who=want.map((w,p)=>w[k]?p:-1).filter(p=>p>=0);
  if(tot<=s.bank[k])who.forEach(p=>{got[p][k]=want[p][k]});else if(who.length===1)got[who[0]][k]=s.bank[k]}
 got.forEach((g,p)=>K.forEach(k=>{s.res[p][k]+=g[k];s.bank[k]-=g[k]}));return got}
function check(s){if(s.over||s.phase==='setup'||s.phase==='sbp')return;const p=s.cur,v=points(s,p,true);if(v>=s.vp){s.over={win:p,scores:Array.from({length:s.n},(_,i)=>points(s,i,true)),reason:s.vp+' punti vittoria'};s.ev.push({t:'end',win:p});L(s,s.names[p]+' arriva a '+v+' punti e vince!')}}
const cardsOf=(s,p)=>tot(s.res[p]);
const handOf=(s,p)=>{const v=X(s,'handSize',p);return v==null?cardsOf(s,p):v};
/* nebbia: un esagono nascosto si scopre quando una tua strada, nave o colonia lo tocca; chi lo scopre prende una carta di quel terreno (oro: la sceglie) */
function reveal(s,p,hs){if(!s.fogN)return;for(const i of hs){const x=s.hexes[i];if(!x.fog)continue;x.fog=false;s.fogN--;s.ev.push({t:'reveal',h:i});L(s,s.names[p]+' scopre '+(x.t==='sea'?'altro mare':x.t==='gold'?'una terra con l’oro':x.t==='desert'?'un deserto':'un terreno di '+RN[x.t]));
  if(RES.includes(x.t)&&s.bank[x.t]>0){s.res[p][x.t]++;s.bank[x.t]--}else if(x.t==='gold'){(s.gold=s.gold||{})[p]=(s.gold[p]||0)+1;if(s.phase!=='gold'){s.goldBack=s.phase;s.phase='gold'}}}}
function startRobber(s,after){s.phase='robber';s.after=after}
function endRobber(s){s.phase=s.after||'main';s.after=null;s.vict=null}
function stealFrom(s,vic){const me=s.cur,hand=[];KEYS(s).forEach(k=>{for(let i=0;i<s.res[vic][k];i++)hand.push(k)});if(!hand.length){endRobber(s);return}
 const k=hand[Math.floor(RND()*hand.length)];s.res[vic][k]--;s.res[me][k]++;s.ev.push({t:'steal',p:me,from:vic});L(s,s.names[me]+' ruba una carta a '+s.names[vic]);endRobber(s)}
function startTurn(s,p){s.cur=p;s.turnP=p;s.newDev[p]=[];s.newShips=[];s.shipMoved=false;X(s,'turn',p);s.phase='roll';s.dice=null;s.devPlayed=false;s.trade=null;s.sbp=null;s.ev.push({t:'turn',p});L(s,'Tocca a '+s.names[p])}
/* fase di costruzione speciale (5-8 giocatori): finito il turno, ogni altro giocatore in ordine può costruire e comprare, ma non scambiare né giocare sviluppo */
function nextTurn(s){const p=s.turnP=s.phase==='sbp'?s.turnP:s.cur;s.newDev[p]=[];s.trade=null;X(s,'end',p);
 if(s.n>=5){s.sbp={left:s.n-1};s.cur=(p+1)%s.n;s.phase='sbp';s.dice=null;s.devPlayed=false;s.ev.push({t:'sbp',p:s.cur});L(s,'Costruzione speciale: '+s.names[s.cur]+' può costruire');return}
 startTurn(s,(p+1)%s.n)}
function nextSbp(s){const p=s.cur;s.sbp.left--;if(s.sbp.left<=0)return startTurn(s,(s.turnP+1)%s.n);s.cur=(p+1)%s.n;s.ev.push({t:'sbp',p:s.cur});L(s,'Costruzione speciale: '+s.names[s.cur]+' può costruire')}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);use(s);if(s.over)return fail('Partita finita');s.ev=[];const p=a.seat;if(!Number.isInteger(p)||p<0||p>=s.n)return fail('Giocatore sconosciuto');
 const r=run(s,a,p);if(r&&r.err)return r;check(s);s.evn++;return{s}}
function run(s,a,p){
 const xr=X(s,'act',a,p);if(xr)return xr===true?undefined:xr;
 /* risposte fuori turno */
 if(a.t==='discard'){if(s.phase!=='discard'||!s.disc||!s.disc[p])return fail('Non devi scartare');const c=a.res||{};let n=0;
  for(const k of KEYS(s)){const x=c[k]||0;if(!Number.isInteger(x)||x<0||x>s.res[p][k])return fail('Scarto non valido');n+=x}
  if(n!==s.disc[p])return fail('Devi scartare esattamente '+s.disc[p]+' carte');pay(s,p,c);delete s.disc[p];s.ev.push({t:'discard',p,n});L(s,s.names[p]+' scarta '+n+' carte');
  if(!Object.keys(s.disc).length){s.disc=null;afterSeven(s)}return}
 if(a.t==='gold'){if(s.phase!=='gold'||!s.gold||!s.gold[p])return fail('Non devi scegliere risorse');const c=a.res||{};let n=0;
  for(const k of RES){const x=c[k]||0;if(!Number.isInteger(x)||x<0||x>s.bank[k])return fail('Scelta non valida');n+=x}
  if(n!==s.gold[p])return fail('Devi scegliere esattamente '+s.gold[p]+' carte');RES.forEach(k=>{const x=c[k]||0;s.res[p][k]+=x;s.bank[k]-=x});delete s.gold[p];s.ev.push({t:'goldpick',p,n});L(s,s.names[p]+' sceglie '+n+' '+(n>1?'risorse':'risorsa')+' dall’oro');
  if(!Object.keys(s.gold).length){s.gold=null;s.phase=s.goldBack||'main'}return}
 if(a.t==='accept'||a.t==='reject'){const t=s.trade;if(s.phase!=='main'||!t||p===t.from||(t.to!=null&&t.to!==p))return fail('Nessuna offerta per te');
  if(a.t==='accept'){if(!has(s,p,t.want))return fail('Non hai le carte richieste');if(!t.acc.includes(p))t.acc.push(p);t.rej=t.rej.filter(x=>x!==p)}
  else{if(!t.rej.includes(p))t.rej.push(p);t.acc=t.acc.filter(x=>x!==p)}return}
 if(p!==s.cur)return fail('Non è il tuo turno');
 switch(s.phase){
 case'setup':{const S=s.setup;
  if(S.step==='v'){if(a.t!=='settle')return fail('Posa una colonia');const e=canSettle(s,p,a.v,true);if(e)return fail(e);
   s.bld[a.v]={p,k:X(s,'setupK',p,S.i>=s.n)||1};S.v=a.v;S.step='e';s.ev.push({t:'build',p,k:'settle',x:a.v});X(s,'built',p,'settle',a.v,true);L(s,s.names[p]+' posa una colonia');
   if(S.i>=s.n){const g=zero();V[a.v].h.forEach(h=>{const t=s.hexes[h].t;if(t!=='desert'&&s.bank[t]>0){s.res[p][t]++;s.bank[t]--;g[t]++}});s.ev.push({t:'gain',p,res:g})}return}
  if(a.t!=='road'&&a.t!=='ship')return fail('Posa una strada (o una nave) accanto alla colonia');const e=a.t==='ship'?canShip(s,p,a.e,{from:S.v}):canRoad(s,p,a.e,S.v);if(e)return fail(e);
  (a.t==='ship'?s.ships:s.roads)[a.e]=p;s.ev.push({t:'build',p,k:a.t==='ship'?'ship':'road',x:a.e});if(a.t==='ship')reveal(s,p,E[a.e].h);S.i++;S.step='v';S.v=null;
  if(S.i>=S.order.length){s.phase='roll';s.cur=S.order[0];s.turnP=s.cur;s.setup=null;L(s,'Si gioca! Tocca a '+s.names[s.cur])}else s.cur=S.order[S.i];return}
 case'roll':
  if(a.t==='roll')return doRoll(s,p,null);
  if(a.t==='play'&&a.card==='knight')return playDev(s,p,a);
  return fail('Tira i dadi');
 case'robber':{if(a.t!=='robber')return fail('Sposta il ladro');const h=a.h;if(!Number.isInteger(h)||h<0||h>=HX.length)return fail('Esagono non valido');
  const pir=s.pirate!=null&&s.hexes[h].t==='sea'&&!s.hexes[h].fog;
  if(pir){if(h===s.pirate)return fail('Il pirata deve cambiare esagono');s.pirate=h;s.ev.push({t:'pirate',h})}
  else{if(!landH(s,h))return fail('Il ladro sta sulla terra (sul mare si muove il pirata)');if(h===s.robber)return fail('Il ladro deve cambiare esagono');s.robber=h;s.ev.push({t:'robber',h})}
  const vic=[...new Set((pir?HX[h].e.map(e=>s.ships[e]):HX[h].v.map(v=>s.bld[v]&&s.bld[v].p)).filter(x=>x!=null&&x!==p&&cardsOf(s,x)>0))];L(s,s.names[p]+(pir?' sposta il pirata':' sposta il ladro'));
  if(!vic.length)endRobber(s);else if(vic.length===1)stealFrom(s,vic[0]);else{s.phase='steal';s.vict=vic}return}
 case'steal':{if(a.t!=='steal'||!s.vict.includes(a.p))return fail('Scegli a chi rubare');stealFrom(s,a.p);return}
 case'rb':{if(a.t!=='road'&&a.t!=='ship')return fail('Posa le strade (o le navi) gratuite');const e=a.t==='ship'?canShip(s,p,a.e):canRoad(s,p,a.e);if(e)return fail(e);(a.t==='ship'?s.ships:s.roads)[a.e]=p;if(a.t==='ship')s.newShips.push(a.e);
  s.ev.push({t:'build',p,k:a.t==='ship'?'ship':'road',x:a.e});s.rbLeft--;updateLongest(s);if(a.t==='ship')reveal(s,p,E[a.e].h);
  if(s.rbLeft<=0||(!roadSpots(s,p).length&&!shipSpots(s,p).length))s.phase='main';return}
 case'discard':return fail('Aspetta gli scarti degli altri');
 case'sbp':{if(a.t==='end'){nextSbp(s);return}if(!['road','ship','settle','city','buydev'].includes(a.t))return fail('Nella costruzione speciale puoi solo costruire o comprare');return main(s,a,p)}
 case'main':return main(s,a,p)}
 return fail('Azione non valida adesso')}
/* tiro dei dadi (dice: valori imposti da una carta, altrimenti casuali); le espansioni si agganciano con 'roll' (prima di tutto: dado evento) e 'rolled' (dopo la produzione) */
function afterSeven(s){if(X(s,'noRobber'))s.phase='main';else startRobber(s,'main')}
function doRoll(s,p,dice){const d=dice||[1+Math.floor(RND()*6),1+Math.floor(RND()*6)],sum=d[0]+d[1];s.dice=d;s.ev.push({t:'roll',d});L(s,s.names[p]+' tira: '+d[0]+' + '+d[1]+' = '+sum);X(s,'roll',d,sum,p);
 if(sum===7){const need={};for(let i=0;i<s.n;i++){const c=handOf(s,i),lm=X(s,'discardLimit',i);if(c>(lm==null?7:lm))need[i]=Math.floor(c/2)}
  s.ev.push({t:'seven'});if(Object.keys(need).length){s.disc=need;s.phase='discard'}else afterSeven(s);return}
 const g=produce(s,sum);X(s,'rolled',sum,g,p);s.phase=s.gold?'gold':'main';s.goldBack='main';s.ev.push({t:'gain',all:g});if(s.gold)s.ev.push({t:'gold',who:Object.keys(s.gold).map(Number)});
 if(g.every(x=>!tot(x)))L(s,'Nessuno raccoglie risorse')}
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
 case'road':{const e=canRoad(s,p,a.e);if(e)return fail(e);if(!has(s,p,COST.road))return fail('Ti servono Legno e Argilla');pay(s,p,COST.road);s.roads[a.e]=p;s.ev.push({t:'build',p,k:'road',x:a.e});L(s,s.names[p]+' costruisce una strada');updateLongest(s);reveal(s,p,E[a.e].h);return}
 case'ship':{const e=canShip(s,p,a.e);if(e)return fail(e);if(!has(s,p,COST.ship))return fail('Ti servono Legno e Lana');pay(s,p,COST.ship);s.ships[a.e]=p;s.newShips.push(a.e);s.ev.push({t:'build',p,k:'ship',x:a.e});L(s,s.names[p]+' vara una nave');updateLongest(s);reveal(s,p,E[a.e].h);return}
 case'mship':{const f=a.e,t=a.to;if(s.ships[f]!==p)return fail('Quella non è una tua nave');if(s.shipMoved)return fail('Puoi spostare una sola nave per turno');if(s.newShips.includes(f))return fail('Una nave appena costruita non si sposta');
  if(s.pirate!=null&&HX[s.pirate].e.includes(f))return fail('Il pirata blocca quella nave');if(!shipOpen(s,p,f))return fail('Si spostano solo le navi con un’estremità libera');
  if(t===f)return fail('Scegli un altro tratto di mare');const e=canShip(s,p,t,{skip:f});if(e)return fail(e);delete s.ships[f];s.ships[t]=p;s.newShips.push(t);s.shipMoved=true;s.ev.push({t:'mship',p,x:f,y:t});L(s,s.names[p]+' sposta una nave');updateLongest(s);reveal(s,p,E[t].h);return}
 case'settle':{const e=canSettle(s,p,a.v);if(e)return fail(e);if(!has(s,p,COST.settle))return fail('Ti servono Legno, Argilla, Lana e Grano');pay(s,p,COST.settle);s.bld[a.v]={p,k:1};s.ev.push({t:'build',p,k:'settle',x:a.v});L(s,s.names[p]+' costruisce una colonia');updateLongest(s);reveal(s,p,V[a.v].h);X(s,'built',p,'settle',a.v);return}
 case'city':{const b=s.bld[a.v];if(!b||b.p!==p||b.k!==1)return fail('Serve una tua colonia');if(count(s,p,2)>=LIM.city)return fail('Hai già 4 città');if(!has(s,p,COST.city))return fail('Ti servono 2 Grano e 3 Roccia');pay(s,p,COST.city);b.k=2;s.ev.push({t:'build',p,k:'city',x:a.v});L(s,s.names[p]+' trasforma una colonia in città');return}
 case'buydev':{if(!s.deck.length)return fail('Le carte sviluppo sono finite');if(!has(s,p,COST.dev))return fail('Ti servono Lana, Grano e Roccia');pay(s,p,COST.dev);const c=s.deck.shift();s.dev[p].push(c);s.newDev[p].push(c);s.ev.push({t:'buydev',p});L(s,s.names[p]+' compra una carta sviluppo');return}
 case'play':return playDev(s,p,a);
 case'bank':{const K=KEYS(s),nm=k=>RN[k]||(s.xn&&s.xn[k])||k;if(!K.includes(a.give)||!K.includes(a.get)||a.give===a.get)return fail('Scegli due carte diverse');const q=ratio(s,p,a.give);
  if(s.res[p][a.give]<q)return fail('Ti servono '+q+' × '+nm(a.give));if(s.bank[a.get]<1)return fail('La banca non ha '+nm(a.get));
  s.res[p][a.give]-=q;s.bank[a.give]+=q;s.res[p][a.get]++;s.bank[a.get]--;s.ev.push({t:'bank',p});L(s,s.names[p]+' scambia '+q+' × '+nm(a.give)+' con 1 × '+nm(a.get)+' in banca');return}
 case'offer':{const g=a.give||{},w=a.want||{},K=KEYS(s);for(const k of K){if(!Number.isInteger(g[k]||0)||!Number.isInteger(w[k]||0)||(g[k]||0)<0||(w[k]||0)<0)return fail('Offerta non valida');if(g[k]&&w[k])return fail('Non puoi dare e chiedere la stessa risorsa')}
  if(!K.some(k=>g[k]>0)||!K.some(k=>w[k]>0))return fail('Dai e chiedi almeno una carta');if(!has(s,p,g))return fail('Non hai le carte che offri');
  if(a.to!=null&&(a.to===p||!(a.to>=0&&a.to<s.n)))return fail('Destinatario non valido');
  s.trade={from:p,give:Object.fromEntries(K.map(k=>[k,g[k]||0])),want:Object.fromEntries(K.map(k=>[k,w[k]||0])),to:a.to==null?null:a.to,acc:[],rej:[]};s.ev.push({t:'offer',p});L(s,s.names[p]+' propone uno scambio');return}
 case'cancel':s.trade=null;return;
 case'deal':{const t=s.trade;if(!t||!t.acc.includes(a.p))return fail('Nessuno ha accettato');if(!has(s,p,t.give)||!has(s,a.p,t.want))return fail('Le carte non bastano più');
  KEYS(s).forEach(k=>{s.res[p][k]+=t.want[k]-t.give[k];s.res[a.p][k]+=t.give[k]-t.want[k]});s.trade=null;s.ev.push({t:'trade',p,q:a.p});L(s,s.names[p]+' e '+s.names[a.p]+' si scambiano delle carte');return}
 case'end':nextTurn(s);return}
 return fail('Azione sconosciuta')}
/* mosse legali (per bot, test di fuzzing e suggerimenti): un elenco di azioni senza il campo seat. Le espansioni aggiungono le loro con il gancio 'moves'. */
function pickCards(s,p,n,from,rnd){const hand=[];KEYS(s).forEach(k=>{for(let i=0;i<(from[k]||0);i++)hand.push(k)});const r={};for(let i=0;i<n&&hand.length;i++){const j=Math.floor(rnd()*hand.length),k=hand.splice(j,1)[0];r[k]=(r[k]||0)+1}return r}
function moves(s,p){use(s);const out=[],ph=s.phase,rnd=()=>RND();if(s.over)return out;
 if(ph==='discard'){if(s.disc&&s.disc[p])out.push({t:'discard',res:X(s,'discardPlan',p,s.disc[p])||pickCards(s,p,s.disc[p],s.res[p],rnd)});return out}
 if(ph==='gold'){if(s.gold&&s.gold[p]){const bank={};RES.forEach(k=>bank[k]=s.bank[k]);out.push({t:'gold',res:pickCards(s,p,s.gold[p],bank,rnd)})}return out}
 const T=s.trade;if(ph==='main'&&T&&p!==T.from&&(T.to==null||T.to===p)){if(has(s,p,T.want)&&!T.acc.includes(p))out.push({t:'accept'});out.push({t:'reject'})}
 if(p!==s.cur){X(s,'moves',p,out);return out}
 if(ph==='setup'){const S=s.setup;if(S.step==='v')settleSpots(s,p,true).forEach(v=>out.push({t:'settle',v}));else{roadSpots(s,p,S.v).forEach(e=>out.push({t:'road',e}));shipSpots(s,p,{from:S.v}).forEach(e=>out.push({t:'ship',e}))}return out}
 if(ph==='roll'){out.push({t:'roll'});if(!s.devPlayed&&s.dev[p].filter(c=>c==='knight').length>s.newDev[p].filter(c=>c==='knight').length)out.push({t:'play',card:'knight'});X(s,'moves',p,out);return out}
 if(ph==='robber'){HX.forEach((h,i)=>{if(i===s.robber&&landH(s,i)||i===s.pirate)return;if(landH(s,i)||(s.pirate!=null&&s.hexes[i].t==='sea'&&!s.hexes[i].fog))out.push({t:'robber',h:i})});return out}
 if(ph==='steal'){s.vict.forEach(q=>out.push({t:'steal',p:q}));return out}
 if(ph==='rb'){roadSpots(s,p).forEach(e=>out.push({t:'road',e}));shipSpots(s,p).forEach(e=>out.push({t:'ship',e}));return out}
 if(ph==='main'||ph==='sbp'){const sb=ph==='sbp';
  if(has(s,p,COST.road))roadSpots(s,p).forEach(e=>out.push({t:'road',e}));
  if(has(s,p,COST.ship))shipSpots(s,p).forEach(e=>out.push({t:'ship',e}));
  if(has(s,p,COST.settle))settleSpots(s,p,false).forEach(v=>out.push({t:'settle',v}));
  if(has(s,p,COST.city)&&count(s,p,2)<LIM.city)citySpots(s,p).forEach(v=>out.push({t:'city',v}));
  if(has(s,p,COST.dev)&&s.deck.length)out.push({t:'buydev'});
  if(!sb){
   if(!s.shipMoved)Object.keys(s.ships).filter(e=>s.ships[e]===p&&!s.newShips.includes(+e)&&shipOpen(s,p,+e)).forEach(f=>{const opts=shipSpots(s,p,{skip:+f}).filter(e=>e!==+f);for(let i=0;i<Math.min(3,opts.length);i++)out.push({t:'mship',e:+f,to:opts[Math.floor(rnd()*opts.length)]})});
   if(!s.devPlayed){const own=c=>s.dev[p].filter(x=>x===c).length-s.newDev[p].filter(x=>x===c).length;
    if(own('knight')>0)out.push({t:'play',card:'knight'});if(own('rb')>0&&(roadSpots(s,p).length||shipSpots(s,p).length))out.push({t:'play',card:'rb'});
    if(own('yop')>0)out.push({t:'play',card:'yop',a:RES[Math.floor(rnd()*5)],b:RES[Math.floor(rnd()*5)]});if(own('mono')>0)out.push({t:'play',card:'mono',r:RES[Math.floor(rnd()*5)]})}
   for(const g of KEYS(s)){const q=ratio(s,p,g);if(s.res[p][g]>=q)KEYS(s).forEach(k=>{if(k!==g&&s.bank[k]>0)out.push({t:'bank',give:g,get:k})})}
   if(!s.trade){const g=RES.filter(k=>s.res[p][k]>0);if(g.length){const a=g[Math.floor(rnd()*g.length)],b=RES.filter(k=>k!==a)[Math.floor(rnd()*4)];out.push({t:'offer',give:{[a]:1},want:{[b]:1}})}}
   if(T&&T.from===p){T.acc.forEach(q=>{if(has(s,p,T.give)&&has(s,q,T.want))out.push({t:'deal',p:q})});out.push({t:'cancel'})}}
  out.push({t:'end'})}
 X(s,'moves',p,out);return out}
const w=f=>(s,...r)=>{use(s);return f(s,...r)};
KX={RND:()=>RND(),shuffle,clone,RES,KEYS,RN,COST,LIM,KIT,profOf,zero,tot,pips,L,use,other,defaultMap,doRoll,afterSeven,produce,roadSpots,settleSpots,citySpots,points,ratio,buildHexes,geoLay,coastOf,count,roadsOf,shipsOf,landH,seaH,cardsOf,handOf,has,pay,nbBuilt,updateLongest,updateArmy,startRobber,endRobber,reveal,canSettle,canRoad,canShip,roadLen,
 g:()=>({HX,V,E,HN}),X,XS,EXT};
return{moves,newGame,act,KEYS,presets,ext:(n,m)=>{EXT[n]=m;if(m.attach)m.attach(KX)},EXTS:EXT,setRnd:f=>{RND=f},canShip:w(canShip),shipSpots:w(shipSpots),shipOpen:w(shipOpen),shipsOf,landH,seaH,geo:s=>{const g=use(s);return{HX:g.HX,V:g.V,E:g.E,HN:g.HN,PORT_AT:g.PORT_AT}},KIT,profOf,HX:GEO.a.HX,V:GEO.a.V,E:GEO.a.E,HN:GEO.a.HN,RES,RN,COST,LIM,canSettle:w(canSettle),canRoad:w(canRoad),settleSpots:w(settleSpots),roadSpots:w(roadSpots),citySpots,roadLen:w(roadLen),points,ratio:w(ratio),has,pips,count,roadsOf,cardsOf,tot}})();
if(typeof module!=='undefined')module.exports=CATAN;
