/* CATAN · CITTÀ E CAVALIERI – regole di un'espansione di Catan, riscritte con nomi e testi nostri (le meccaniche non sono protette, l'arte e i testi sì).
   Si attiva con opts.ext=['cek'] e si gioca a 13 punti. Si affianca al nucleo (motori/18-catan.js) tramite i ganci di CATAN.ext.
   · Merci: le città su bosco, pascolo e montagna rendono una risorsa più una merce (carta, stoffa, moneta). Le merci stanno in s.res[p] come le risorse (s.xk).
   · Migliorie: tre rotte (Commercio, Politica, Scienza) da 5 livelli, ognuna si paga con la sua merce. Primo livello 4 = metropoli (+2 punti), il livello 5 la ruba.
   · Cavalieri: semplici, forti, possenti (2 per livello). Si reclutano su un incrocio libero lungo le proprie strade, si attivano col grano, si muovono lungo le strade.
   · Barbari: il dado evento (3 navi, 3 porte) fa avanzare la nave; al 7° passo attaccano. Forza = città in gioco, difesa = cavalieri attivi. Se vincono i difensori: chi ha contribuito
     di più prende il Difensore di Catan (+1 punto), se perdono: chi ha contribuito meno perde una città (le metropoli non si saccheggiano). Poi i cavalieri si disattivano.
   · Il ladro entra in gioco solo dopo il primo attacco; con un 7 si scarta lo stesso (limite 7 + 2 per ogni mura). Si parte con una colonia e una città.
   · Carte progresso: pescate col dado evento (colore della porta, se il dado rosso è ≤ livello+1), massimo 4 in mano.
   Stato aggiunto: xk, xn, imp[p]={tr,po,sc}, kn[v]={p,l,a,u}, wall[v], metro={tr,po,sc}(vertice), bar, dof[p], pg[p], pgvp[p], pdeck, ed, merch, fleet, crane[p], robOff, noDev. */
CATAN.ext('cek',(()=>{
let K=null;
const TR=['tr','po','sc'],TN={tr:'Commercio',po:'Politica',sc:'Scienza'},COM={tr:'cloth',po:'coin',sc:'paper'},CN={cloth:'Stoffa',coin:'Moneta',paper:'Carta'};
const LV={tr:['Bancarella','Emporio','Casa di commercio','Banco dei cambi','Gilda dei mercanti'],po:['Consiglio','Tribunale','Fortezza','Palazzo','Senato'],sc:['Scriptorium','Biblioteca','Acquedotto','Accademia','Osservatorio']};
const KN=['','Cavaliere semplice','Cavaliere forte','Cavaliere possente'];
const PC={merchant:['Mercante','tr',2,'Posa il Mercante su un esagono accanto a una tua colonia o città: vale 1 punto e scambi quella risorsa 2:1.'],
 rmono:['Monopolio di risorsa','tr',2,'Scegli una risorsa: ogni avversario te ne dà fino a 2.'],
 cmono:['Monopolio di merce','tr',2,'Scegli una merce: ogni avversario te ne dà 1.'],
 master:['Mercante supremo','tr',2,'Scegli un giocatore con più punti di te e prendigli 2 carte a caso.'],
 fleet:['Flotta mercantile','tr',2,'Per questo turno scambi 2:1 una risorsa o merce a tua scelta.'],
 bishop:['Vescovo','po',2,'Sposta il ladro e ruba una carta a ogni giocatore adiacente (solo se il ladro è in gioco).'],
 deserter:['Disertore','po',2,'Un avversario perde il suo cavaliere più debole e tu ne posi uno uguale.'],
 intrigue:['Intrigo','po',2,'Scaccia un cavaliere avversario accanto a una tua strada.'],
 wedding:['Matrimonio','po',2,'Ogni avversario con più punti di te ti dà 2 carte.'],
 warlord:['Signore della guerra','po',2,'Attivi gratis tutti i tuoi cavalieri.'],
 saboteur:['Sabotatore','po',2,'Ogni avversario con almeno i tuoi punti scarta metà delle carte.'],
 constitution:['Costituzione','po',1,'1 punto vittoria (si rivela subito).'],
 irrig:['Irrigazione','sc',2,'Prendi 2 grano per ogni campo accanto alle tue costruzioni.'],
 mining:['Miniera','sc',2,'Prendi 2 roccia per ogni montagna accanto alle tue costruzioni.'],
 smith:['Fabbro','sc',2,'Promuovi gratis fino a 2 cavalieri.'],
 roadb:['Costruzione strade','sc',2,'Posa 2 strade gratis.'],
 medicine:['Medicina','sc',2,'Trasforma una colonia in città pagando solo 2 roccia e 1 grano.'],
 crane:['Gru','sc',2,'La tua prossima miglioria costa 1 merce in meno.'],
 inventor:['Inventore','sc',1,'Scambia due gettoni numero (non 2, 6, 8, 12).'],
 printer:['Stampatrice','sc',1,'1 punto vittoria (si rivela subito).'],
 alchemist:['Alchimista','sc',2,'Prima di tirare scegli i due dadi.']};
const HAND=new Set(['imp','kn_new','kn_act','kn_up','kn_mv','kn_chase','wall','pg']);
const F=e=>({err:e});
const cities=(s,p)=>Object.keys(s.bld).filter(v=>s.bld[v].p===p&&s.bld[v].k===2).map(Number);
const knOf=(s,p,l)=>Object.keys(s.kn).filter(v=>s.kn[v].p===p&&(l==null||s.kn[v].l===l)).length;
const walls=(s,p)=>Object.keys(s.wall).filter(v=>s.bld[v]&&s.bld[v].p===p).length;
const isMetro=(s,v)=>TR.some(t=>s.metro[t]===+v);
const deck=t=>{const a=[];for(const c in PC)if(PC[c][1]===t)for(let i=0;i<PC[c][2];i++)a.push(c);return a};
const pips=(s,v)=>K.g().V[v].h.reduce((a,h)=>a+K.pips(s.hexes[h].num),0);
const cardsIn=(s,p)=>{const h=[];K.KEYS(s).forEach(k=>{for(let i=0;i<s.res[p][k];i++)h.push(k)});return h};
function take(s,from,to,n){const h=K.shuffle(cardsIn(s,from)).slice(0,n);h.forEach(k=>{s.res[from][k]--;s.res[to][k]++});return h.length}
function draw(s,p,t){const d=s.pdeck[t];if(!d.length)return;const c=d.shift();
 if(c==='constitution'||c==='printer'){s.pgvp[p]++;s.ev.push({t:'prog',p,vp:1});K.L(s,s.names[p]+' pesca «'+PC[c][0]+'»: +1 punto');return}
 s.pg[p].push(c);if(s.pg[p].length>(s.n>=5?5:4))d.push(s.pg[p].shift());s.ev.push({t:'prog',p});K.L(s,s.names[p]+' pesca una carta progresso')}
/* strada → incroci raggiungibili da un cavaliere (non si attraversano avversari); destinazione: libera o un cavaliere avversario più debole */
function reach(s,p,from){const{V}=K.g(),me=s.kn[from],seen=new Set([from]),q=[from],out=[];
 while(q.length){const v=q.shift();for(const e of V[v].e){if(s.roads[e]!==p)continue;const w=K.other(e,v);if(seen.has(w))continue;seen.add(w);
  const b=s.bld[w],k=s.kn[w];if(b&&b.p!==p)continue;
  if(k&&k.p!==p){if(me&&k.l<me.l)out.push(w);continue}
  q.push(w);if(!b&&!k)out.push(w)}}
 return out}
function relocate(s,from,kn){const{V}=K.g(),seen=new Set([from]),q=[from];
 while(q.length){const v=q.shift();for(const e of V[v].e){if(s.roads[e]!==kn.p)continue;const w=K.other(e,v);if(seen.has(w))continue;seen.add(w);
  if(s.bld[w]&&s.bld[w].p!==kn.p)continue;const k2=s.kn[w];if(k2&&k2.p!==kn.p)continue;if(!s.bld[w]&&!k2){s.kn[w]=kn;return w}q.push(w)}}
 return null}
const knSpots=(s,p)=>{const{V}=K.g();return V.map((x,i)=>i).filter(v=>!s.bld[v]&&!s.kn[v]&&V[v].h.some(i=>K.landH(s,i))&&V[v].e.some(e=>s.roads[e]===p))};
function metropolis(s,p,k,l,pref){if(l<4)return;const cur=s.metro[k],cand=cities(s,p).filter(v=>!isMetro(s,v));
 let ok=false;if(cur==null)ok=true;else{const o=s.bld[cur]&&s.bld[cur].p;if(o!==p&&l===5&&s.imp[o][k]<5)ok=true}
 if(!ok||!cand.length)return;const v=cand.includes(+pref)?+pref:cand.sort((a,b)=>pips(s,b)-pips(s,a))[0];s.metro[k]=v;s.ev.push({t:'metro',p,k,v});K.L(s,s.names[p]+' ottiene la metropoli di '+TN[k]+' (+2 punti)')}
function promoteOk(s,p,v){const k=s.kn[v];if(!k||k.p!==p)return'Quello non è un tuo cavaliere';if(k.l>=3)return'È già un cavaliere possente';
 if(knOf(s,p,k.l+1)>=2)return'Hai già 2 cavalieri di quel livello';if(k.l===2&&s.imp[p].po<3)return'Per i cavalieri possenti serve la Fortezza (Politica livello 3)';return null}
function attack(s){const ct=Object.values(s.bld).filter(b=>b.k===2).length,per=Array(s.n).fill(0);for(const v in s.kn)if(s.kn[v].a)per[s.kn[v].p]+=s.kn[v].l;
 const def=per.reduce((a,b)=>a+b,0),win=def>=ct;s.ev.push({t:'attack',str:ct,def,win});K.L(s,'I barbari attaccano! Forza '+ct+' contro difesa '+def);
 if(win){const M=Math.max(...per);if(M>0){const w=per.map((x,i)=>x===M?i:-1).filter(i=>i>=0);
   if(w.length===1){s.dof[w[0]]++;K.L(s,s.names[w[0]]+' è il Difensore di Catan: +1 punto')}else{w.forEach(p=>draw(s,p,TR[Math.floor(K.RND()*3)]));K.L(s,'Pari merito: ogni difensore pesca una carta progresso')}}
  else K.L(s,'Nessuna città da difendere: i barbari se ne vanno')}
 else{const has=[];for(let p=0;p<s.n;p++)if(cities(s,p).some(v=>!isMetro(s,v)))has.push(p);const m=Math.min(...has.map(p=>per[p]));
  has.filter(p=>per[p]===m).forEach(p=>{const cand=cities(s,p).filter(v=>!isMetro(s,v)).sort((a,b)=>pips(s,a)-pips(s,b));
   const v=cand[0];s.bld[v].k=1;delete s.wall[v];s.ev.push({t:'pillage',p,v});K.L(s,'I barbari saccheggiano una città di '+s.names[p])})}
 for(const v in s.kn)s.kn[v].a=false;s.bar=0;if(s.robOff){s.robOff=false;s.ev.push({t:'robber',h:s.robber});K.L(s,'Dopo l’attacco il ladro entra in gioco')}}
function playCard(s,p,a){const c=a.card,{HX,V}=K.g();if(!PC[c])return F('Carta sconosciuta');const i=s.pg[p].indexOf(c);if(i<0)return F('Non hai quella carta');
 const use=()=>{s.pg[p].splice(i,1);s.ev.push({t:'pplay',p,c});K.L(s,s.names[p]+' gioca «'+PC[c][0]+'»')};
 const pts=q=>K.points(s,q,false);
 if(c==='alchemist'){if(p!==s.cur||s.phase!=='roll')return F('L’Alchimista si gioca prima di tirare i dadi');const d=a.d;if(!Array.isArray(d)||d.length!==2||d.some(x=>!Number.isInteger(x)||x<1||x>6))return F('Scegli due dadi da 1 a 6');use();K.doRoll(s,p,d.slice());return true}
 if(p!==s.cur||s.phase!=='main')return F('Le carte progresso si giocano nella tua fase di gioco');
 const others=()=>Array.from({length:s.n},(_,q)=>q).filter(q=>q!==p);
 const mineAdj=h=>HX[h].v.some(v=>s.bld[v]&&s.bld[v].p===p);
 switch(c){
 case'merchant':{const h=a.h;if(!Number.isInteger(h)||!s.hexes[h]||!K.RES.includes(s.hexes[h].t)||s.hexes[h].fog)return F('Scegli un esagono di terreno');if(!mineAdj(h))return F('Deve toccare una tua colonia o città');use();s.merch={h,p};return true}
 case'rmono':{if(!K.RES.includes(a.r))return F('Scegli una risorsa');use();let n=0;others().forEach(q=>{const m=Math.min(2,s.res[q][a.r]);s.res[q][a.r]-=m;s.res[p][a.r]+=m;n+=m});K.L(s,'Prende '+n+' carte');s.ev.push({t:'mono',p,n});return true}
 case'cmono':{if(!Object.values(COM).includes(a.r))return F('Scegli una merce');use();let n=0;others().forEach(q=>{const m=Math.min(1,s.res[q][a.r]);s.res[q][a.r]-=m;s.res[p][a.r]+=m;n+=m});K.L(s,'Prende '+n+' merci');s.ev.push({t:'mono',p,n});return true}
 case'master':{const q=a.p;if(!Number.isInteger(q)||q===p||q<0||q>=s.n)return F('Scegli un giocatore');if(pts(q)<=pts(p))return F('Deve avere più punti di te');use();take(s,q,p,2);s.ev.push({t:'steal',p,from:q});return true}
 case'fleet':{if(!K.KEYS(s).includes(a.k))return F('Scegli una risorsa o una merce');use();s.fleet={p,k:a.k};return true}
 case'bishop':{if(s.robOff)return F('Il ladro non è ancora in gioco');const h=a.h;if(!Number.isInteger(h)||!HX[h]||!K.landH(s,h)||h===s.robber)return F('Scegli un altro esagono di terra');use();s.robber=h;s.ev.push({t:'robber',h});
  const vic=[...new Set(HX[h].v.map(v=>s.bld[v]&&s.bld[v].p).filter(x=>x!=null&&x!==p))];vic.forEach(q=>{if(take(s,q,p,1))s.ev.push({t:'steal',p,from:q})});return true}
 case'deserter':{const q=a.p;if(!Number.isInteger(q)||q===p||q<0||q>=s.n)return F('Scegli un giocatore');const ks=Object.keys(s.kn).filter(v=>s.kn[v].p===q).sort((x,y)=>s.kn[x].l-s.kn[y].l||(s.kn[x].a?1:0)-(s.kn[y].a?1:0));
  if(!ks.length)return F('Non ha cavalieri');use();const old=s.kn[ks[0]];delete s.kn[ks[0]];K.L(s,s.names[q]+' perde un cavaliere');
  let l=old.l;while(l>0&&knOf(s,p,l)>=2)l--;const sp=knSpots(s,p);if(l>0&&sp.length)s.kn[sp[0]]={p,l,a:false,u:true};return true}
 case'intrigue':{const v=a.v,k=s.kn[v];if(!k||k.p===p)return F('Scegli un cavaliere avversario');if(!V[v].e.some(e=>s.roads[e]===p))return F('Deve essere accanto a una tua strada');use();delete s.kn[v];k.a=false;const w=relocate(s,v,k);K.L(s,w==null?'Il cavaliere di '+s.names[k.p]+' è messo in fuga':'Il cavaliere di '+s.names[k.p]+' è scacciato');return true}
 case'wedding':{use();others().forEach(q=>{if(pts(q)>pts(p))take(s,q,p,2)});return true}
 case'warlord':{use();for(const v in s.kn)if(s.kn[v].p===p)s.kn[v].a=true;return true}
 case'saboteur':{use();others().forEach(q=>{if(pts(q)>=pts(p)){const h=K.shuffle(cardsIn(s,q)).slice(0,Math.floor(cardsIn(s,q).length/2));h.forEach(k=>{s.res[q][k]--;s.bank[k]++})}});return true}
 case'irrig':case'mining':{const t=c==='irrig'?'grain':'ore',hs=new Set();HX.forEach((h,j)=>{if(s.hexes[j].t===t&&!s.hexes[j].fog&&mineAdj(j))hs.add(j)});use();const n=Math.min(s.bank[t],2*hs.size);s.res[p][t]+=n;s.bank[t]-=n;return true}
 case'smith':{const vs=[a.v1,a.v2].filter(v=>v!=null);if(!vs.length||new Set(vs).size!==vs.length)return F('Scegli uno o due cavalieri');
  const ghost=JSON.parse(JSON.stringify(s));for(const v of vs){const e=promoteOk(ghost,p,v);if(e)return F(e);ghost.kn[v].l++}use();vs.forEach(v=>s.kn[v].l++);return true}
 case'roadb':{if(!K.roadSpots(s,p).length)return F('Non hai dove posare strade');use();s.phase='rb';s.rbLeft=2;return true}
 case'medicine':{const b=s.bld[a.v];if(!b||b.p!==p||b.k!==1)return F('Serve una tua colonia');if(K.count(s,p,2)>=K.LIM.city)return F('Hai già 4 città');if(!K.has(s,p,{ore:2,grain:1}))return F('Ti servono 2 Roccia e 1 Grano');use();K.pay(s,p,{ore:2,grain:1});b.k=2;s.ev.push({t:'build',p,k:'city',x:+a.v});return true}
 case'crane':{use();s.crane[p]=1;return true}
 case'inventor':{const x=a.h1,y=a.h2,ok=h=>Number.isInteger(h)&&s.hexes[h]&&K.landH(s,h)&&s.hexes[h].num&&![2,6,8,12].includes(s.hexes[h].num);if(x===y||!ok(x)||!ok(y))return F('Scegli due gettoni diversi (non 2, 6, 8, 12)');use();const t=s.hexes[x].num;s.hexes[x].num=s.hexes[y].num;s.hexes[y].num=t;return true}}
 return F('Carta non giocabile')}
return{vp:13,PC,TR,TN,COM,CN,LV,KN,
 attach(KX){K=KX},
 init(KX,s){K=KX;s.xk=['cloth','coin','paper'];s.xn=CN;s.res.forEach(r=>s.xk.forEach(k=>{r[k]=0}));s.xk.forEach(k=>{s.bank[k]=12});
  s.imp=Array.from({length:s.n},()=>({tr:0,po:0,sc:0}));s.kn={};s.wall={};s.metro={tr:null,po:null,sc:null};s.bar=0;s.dof=Array(s.n).fill(0);s.pg=Array.from({length:s.n},()=>[]);s.pgvp=Array(s.n).fill(0);
  s.pdeck={};TR.forEach(t=>{s.pdeck[t]=K.shuffle(deck(t))});s.ed=null;s.merch=null;s.fleet=null;s.crane=Array(s.n).fill(0);s.robOff=true;s.deck=[];s.noDev=true;
  K.L(s,'Città e Cavalieri: la seconda posa è una città, i barbari arrivano dopo 7 navi')},
 setupK(KX,s,p,second){return second?2:1},
 yield(KX,s,b,t){if(b.k!==2)return;if(t==='wood')return{wood:1,paper:1};if(t==='wool')return{wool:1,cloth:1};if(t==='ore')return{ore:1,coin:1}},
 discardLimit(KX,s,p){K=KX;return 7+2*walls(s,p)},
 ratio(KX,s,p,r,q){if(!KX.RES.includes(r)){q=4;if(s.imp[p].tr>=3)q=2}
  if(s.merch&&s.merch.p===p&&s.hexes[s.merch.h].t===r)q=Math.min(q,2);if(s.fleet&&s.fleet.p===p&&s.fleet.k===r)q=Math.min(q,2);return q},
 noRobber(KX,s){return s.robOff?true:undefined},
 roll(KX,s,d){K=KX;const f=1+Math.floor(K.RND()*6),e=f<=3?'b':TR[f-4];s.ed=e;s.ev.push({t:'edie',f:e});
  if(e==='b'){s.bar++;s.ev.push({t:'barb',n:s.bar});K.L(s,'La nave dei barbari avanza ('+s.bar+'/7)');if(s.bar>=7)attack(s)}
  else for(let k=0;k<s.n;k++){const q=(s.cur+k)%s.n,lv=s.imp[q][e];if(lv>=1&&d[1]<=lv+1)draw(s,q,e)}},
 rolled(KX,s,sum,got){K=KX;for(let q=0;q<s.n;q++)if(s.imp[q].sc>=3&&!K.tot(got[q])&&K.RES.some(k=>s.bank[k]>0)){(s.gold=s.gold||{})[q]=1;s.ev.push({t:'aq',p:q});K.L(s,s.names[q]+' riceve una risorsa dall’Acquedotto')}},
 turn(KX,s,p){for(const v in s.kn)if(s.kn[v].p===p)s.kn[v].u=false},
 end(KX,s){s.fleet=null},
 points(KX,s,p){let v=s.dof[p]+s.pgvp[p];TR.forEach(t=>{const m=s.metro[t];if(m!=null&&s.bld[m]&&s.bld[m].p===p)v+=2});if(s.merch&&s.merch.p===p)v++;return v},
 act(KX,s,a,p){K=KX;const t=a.t;if(!HAND.has(t))return;const{V}=K.g();
  if(t==='pg')return playCard(s,p,a);
  if(p!==s.cur)return F('Non è il tuo turno');if(s.phase!=='main')return F('Puoi farlo solo nella tua fase di gioco');
  const need=(c,msg)=>K.has(s,p,c)?null:F(msg);
  switch(t){
  case'imp':{const k=a.k;if(!TR.includes(k))return F('Rotta non valida');const lv=s.imp[p][k];if(lv>=5)return F('Rotta già al massimo');if(!cities(s,p).length)return F('Serve almeno una città');
   let cost=lv+1;if(s.crane[p]>0)cost--;const c=COM[k];if(s.res[p][c]<cost)return F('Ti servono '+cost+' × '+CN[c]);
   K.pay(s,p,{[c]:cost});s.crane[p]=0;s.imp[p][k]=lv+1;s.ev.push({t:'imp',p,k,l:lv+1});K.L(s,s.names[p]+' porta '+TN[k]+' al livello '+(lv+1)+' ('+LV[k][lv]+')');metropolis(s,p,k,lv+1,a.v);return true}
  case'kn_new':{const v=a.v;if(!V[v]||s.bld[v]||s.kn[v])return F('Posto occupato');if(!V[v].h.some(i=>K.landH(s,i)))return F('I cavalieri stanno sulla terra');if(!V[v].e.some(e=>s.roads[e]===p))return F('Serve una tua strada che arrivi lì');
   if(knOf(s,p,1)>=2)return F('Hai già 2 cavalieri semplici');const e=need({wool:1,ore:1},'Ti servono Lana e Roccia');if(e)return e;K.pay(s,p,{wool:1,ore:1});s.kn[v]={p,l:1,a:false,u:true};s.ev.push({t:'kn',p,v,k:'new'});K.L(s,s.names[p]+' recluta un cavaliere');return true}
  case'kn_act':{const k=s.kn[a.v];if(!k||k.p!==p)return F('Quello non è un tuo cavaliere');if(k.a)return F('È già attivo');const e=need({grain:1},'Ti serve 1 Grano');if(e)return e;K.pay(s,p,{grain:1});k.a=true;k.u=true;s.ev.push({t:'kn',p,v:+a.v,k:'act'});K.L(s,s.names[p]+' attiva un cavaliere');return true}
  case'kn_up':{const e=promoteOk(s,p,a.v);if(e)return F(e);const e2=need({wool:1,ore:1},'Ti servono Lana e Roccia');if(e2)return e2;K.pay(s,p,{wool:1,ore:1});const k=s.kn[a.v];k.l++;s.ev.push({t:'kn',p,v:+a.v,k:'up'});K.L(s,s.names[p]+' promuove un cavaliere: '+KN[k.l]);return true}
  case'kn_mv':{const k=s.kn[a.v];if(!k||k.p!==p)return F('Quello non è un tuo cavaliere');if(!k.a)return F('Il cavaliere deve essere attivo');if(k.u)return F('Questo cavaliere ha già agito (o è appena stato attivato)');
   if(!reach(s,p,a.v).includes(a.to))return F('Non puoi arrivare lì lungo le tue strade');const old=s.kn[a.to];delete s.kn[a.v];s.kn[a.to]={p,l:k.l,a:false,u:true};s.ev.push({t:'kn',p,v:a.to,from:+a.v,k:'mv'});
   if(old){old.a=false;const w=relocate(s,a.to,old);K.L(s,s.names[p]+' scaccia un cavaliere di '+s.names[old.p]+(w==null?': non trova rifugio e sparisce':''))}else K.L(s,s.names[p]+' sposta un cavaliere');return true}
  case'kn_chase':{const k=s.kn[a.v];if(!k||k.p!==p)return F('Quello non è un tuo cavaliere');if(!k.a||k.u)return F('Serve un cavaliere attivo che non abbia già agito');if(s.robOff)return F('Il ladro non è ancora in gioco');
   if(!V[a.v].h.includes(s.robber))return F('Il cavaliere deve essere accanto al ladro');k.a=false;k.u=true;s.ev.push({t:'kn',p,v:+a.v,k:'chase'});K.L(s,s.names[p]+' scaccia il ladro');K.startRobber(s,'main');return true}
  case'wall':{const b=s.bld[a.v];if(!b||b.p!==p||b.k!==2)return F('Serve una tua città');if(s.wall[a.v])return F('C’è già una mura');if(walls(s,p)>=3)return F('Hai già 3 mura');const e=need({brick:2},'Ti servono 2 Argilla');if(e)return e;
   K.pay(s,p,{brick:2});s.wall[a.v]=true;s.ev.push({t:'wall',p,v:+a.v});K.L(s,s.names[p]+' costruisce le mura');return true}}},
 moves(KX,s,p,out){K=KX;if(p!==s.cur)return;const rnd=()=>K.RND(),pick=(a,n)=>K.shuffle(a.slice()).slice(0,n);
  if(s.phase==='roll'&&s.pg[p].includes('alchemist'))out.push({t:'pg',card:'alchemist',d:[1+Math.floor(rnd()*6),1+Math.floor(rnd()*6)]});
  if(s.phase!=='main')return;const R=K.RES;
  TR.forEach(k=>{const lv=s.imp[p][k];if(lv<5&&cities(s,p).length&&s.res[p][COM[k]]>=lv+1-(s.crane[p]>0?1:0))out.push({t:'imp',k})});
  if(K.has(s,p,{wool:1,ore:1})){if(knOf(s,p,1)<2)pick(knSpots(s,p),3).forEach(v=>out.push({t:'kn_new',v}));for(const v in s.kn)if(s.kn[v].p===p&&!promoteOk(s,p,v))out.push({t:'kn_up',v:+v})}
  if(s.res[p].grain>=1)for(const v in s.kn)if(s.kn[v].p===p&&!s.kn[v].a)out.push({t:'kn_act',v:+v});
  for(const v in s.kn){const k=s.kn[v];if(k.p!==p||!k.a||k.u)continue;pick(reach(s,p,+v),2).forEach(to=>out.push({t:'kn_mv',v:+v,to}));if(!s.robOff&&K.g().V[v].h.includes(s.robber))out.push({t:'kn_chase',v:+v})}
  if(s.res[p].brick>=2&&walls(s,p)<3)cities(s,p).filter(v=>!s.wall[v]).forEach(v=>out.push({t:'wall',v}));
  const{HX}=K.g(),oth=Array.from({length:s.n},(_,q)=>q).filter(q=>q!==p);
  new Set(s.pg[p]).forEach(c=>{const m=(x)=>out.push(Object.assign({t:'pg',card:c},x));
   if(c==='merchant'){const h=HX.map((x,i)=>i).filter(i=>K.RES.includes(s.hexes[i].t)&&!s.hexes[i].fog&&HX[i].v.some(v=>s.bld[v]&&s.bld[v].p===p));if(h.length)m({h:h[0]})}
   else if(c==='rmono')m({r:R[Math.floor(rnd()*5)]});else if(c==='cmono')m({r:s.xk[Math.floor(rnd()*3)]});
   else if(c==='master'){const q=oth.filter(q=>K.points(s,q,false)>K.points(s,p,false));if(q.length)m({p:q[0]})}
   else if(c==='fleet')m({k:K.KEYS(s)[Math.floor(rnd()*8)]});
   else if(c==='bishop'){if(!s.robOff){const h=HX.map((x,i)=>i).filter(i=>K.landH(s,i)&&i!==s.robber);m({h:h[Math.floor(rnd()*h.length)]})}}
   else if(c==='deserter'){const q=oth.filter(q=>knOf(s,q)>0);if(q.length)m({p:q[0]})}
   else if(c==='intrigue'){const{V}=K.g(),v=Object.keys(s.kn).filter(v=>s.kn[v].p!==p&&V[v].e.some(e=>s.roads[e]===p));if(v.length)m({v:+v[0]})}
   else if(c==='smith'){const v=Object.keys(s.kn).filter(v=>s.kn[v].p===p&&!promoteOk(s,p,v));if(v.length)m({v1:+v[0]})}
   else if(c==='medicine'){const v=Object.keys(s.bld).filter(v=>s.bld[v].p===p&&s.bld[v].k===1);if(v.length&&K.has(s,p,{ore:2,grain:1}))m({v:+v[0]})}
   else if(c==='inventor'){const h=HX.map((x,i)=>i).filter(i=>K.landH(s,i)&&s.hexes[i].num&&![2,6,8,12].includes(s.hexes[i].num));if(h.length>1)m({h1:h[0],h2:h[1]})}
   else if(c!=='alchemist')m({})})},
 /* per la vista: forza attuale dei barbari e difesa */
 barb(KX,s){const ct=Object.values(s.bld).filter(b=>b.k===2).length,per=Array(s.n).fill(0);for(const v in s.kn)if(s.kn[v].a)per[s.kn[v].p]+=s.kn[v].l;return{str:ct,def:per.reduce((a,b)=>a+b,0),per}},
 helpers:{cities,knOf,walls,isMetro,knSpots:(s,p)=>{K.use(s);return knSpots(s,p)},reach:(s,p,v)=>{K.use(s);return reach(s,p,v)},promoteOk}};
})());
