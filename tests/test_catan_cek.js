// Catan · Città e Cavalieri: merci, migliorie e metropoli, cavalieri, barbari, mura, carte progresso, e partite complete (bot competenti contro giocatori casuali).
const carica=require('./carica.js'),C=carica.multi(['18-catan.js','18b-catan-marinai.js','18c-catan-cek.js'],'CATAN'),assert=require('assert');
const R=carica.rng(33);C.setRnd(R);
const B=require('./bot_catan_cek.js')(C),RES=C.RES,E=C.EXTS.cek,H=E.helpers;
const names=n=>Array.from({length:n},(_,i)=>'g'+i);
const A=(s,p,a)=>{const r=C.act(s,{seat:p,...a});if(r.err)throw new Error(r.err+' '+JSON.stringify(a));return r.s};
const ERR=(s,p,a)=>C.act(s,{seat:p,...a}).err;
const give=(s,p,o)=>{for(const k in o){s.res[p][k]+=o[k];s.bank[k]-=o[k]}};
const KEYS=s=>C.KEYS(s),same=(a,b,m)=>assert.strictEqual(JSON.stringify(a),JSON.stringify(b),m);
const inv=s=>KEYS(s).forEach(k=>assert.strictEqual(s.bank[k]+s.res.reduce((a,r)=>a+r[k],0),RES.includes(k)?C.KIT[C.profOf(s.n)].bank:12,'le carte '+k+' non si conservano'));
// partita pronta: preparazione fatta dai bot, tocca a 0, fase di gioco
const fresh=(n,o)=>{C.setRnd(R);let s=C.newGame(n,names(n),Object.assign({ext:['cek']},o||{}));s=B.gioca(s,Array(n).fill(B.smart),null,4*n);assert.strictEqual(s.phase,'roll');s.phase='main';s.cur=0;s.turnP=0;s.dice=[3,4];s.ed=null;return s};
// dadi imposti: d1, d2 e faccia del dado evento (1-3 nave, 4 commercio, 5 politica, 6 scienza)
const roll=(s,p,d1,d2,f)=>{const seq=[(d1-.5)/6,(d2-.5)/6,(f-.5)/6];let i=0;C.setRnd(()=>i<seq.length?seq[i++]:R());const r=C.act(s,{seat:p,t:'roll'});C.setRnd(R);if(r.err)throw new Error(r.err);return r.s};
const pre=s=>{s.phase='roll';s.cur=0;s.dice=null;return s};
const roads=(s,p,n)=>{for(let i=0;i<n;i++){const r=C.roadSpots(s,p);if(r.length)s.roads[r[0]]=p}return s};
const clear=s=>{s.res.forEach(r=>KEYS(s).forEach(k=>{s.bank[k]+=r[k];r[k]=0}));return s};

// ---- avvio
{const s=fresh(3);assert.strictEqual(s.vp,13);same(s.xk,['cloth','coin','paper']);assert.strictEqual(s.deck.length,0);assert(s.robOff&&s.noDev);
 for(let p=0;p<3;p++){assert.strictEqual(C.count(s,p,1),1,'una colonia');assert.strictEqual(C.count(s,p,2),1,'una città (seconda posa)');['cloth','coin','paper'].forEach(k=>assert(s.res[p][k]===0))}
 inv(s);assert.strictEqual(s.bank.cloth,12);
 assert.strictEqual(Object.values(s.pdeck).flat().length,10+13+16,'carte progresso');
 assert.strictEqual(ERR(s,0,{t:'buydev'}),'Le carte sviluppo sono finite');
 console.log('avvio: colonia+città, 13 punti, merci, mazzi progresso, niente carte sviluppo')}

// ---- merci: la città su bosco, pascolo, montagna dà risorsa + merce; argilla e grano ne danno 2
{const s0=fresh(3),exp={wood:{wood:1,paper:1},wool:{wool:1,cloth:1},ore:{ore:1,coin:1},brick:{brick:2},grain:{grain:2}};
 for(const t in exp){const s=JSON.parse(JSON.stringify(s0)),G=C.geo(s),i=s.hexes.findIndex(h=>h.t===t&&h.num&&h.num!==6&&h.num!==8);s.bld={};s.roads={};s.res.forEach(r=>KEYS(s).forEach(k=>{s.bank[k]+=r[k];r[k]=0}));
  s.bld[G.HX[i].v[0]]={p:0,k:2};s.bld[G.HX[i].v[3]]={p:1,k:1};
  const num=s.hexes[i].num,d1=Math.min(6,num-1),d2=num-d1,n=pre(s);
  const r=roll(n,0,d1,d2,1);KEYS(r).forEach(k=>{const w=exp[t][k]||0;assert.strictEqual(r.res[0][k],w,t+' '+k)});assert.strictEqual(r.res[1][t],1,'la colonia ne prende 1');inv(r)}
 console.log('produzione: città = risorsa + merce (bosco→carta, pascolo→stoffa, montagna→moneta), 2 su argilla/grano')}

// ---- migliorie, metropoli, rapporti di scambio
{let s=fresh(3);const c0=H.cities(s,0)[0],c1=H.cities(s,1)[0];
 assert.strictEqual(ERR(s,0,{t:'imp',k:'tr'}),'Ti servono 1 × Stoffa');
 give(s,0,{cloth:1});s=A(s,0,{t:'imp',k:'tr'});assert.strictEqual(s.imp[0].tr,1);assert.strictEqual(s.res[0].cloth,0);inv(s);
 give(s,0,{cloth:2});assert.strictEqual(ERR(s,0,{t:'imp',k:'tr'}),null||undefined);
 s=A(s,0,{t:'imp',k:'tr'});assert.strictEqual(s.imp[0].tr,2);
 give(s,0,{cloth:3});s=A(s,0,{t:'imp',k:'tr'});assert.strictEqual(s.imp[0].tr,3);
 // commercio 3: le merci si scambiano 2:1
 give(s,0,{cloth:2});s=A(s,0,{t:'bank',give:'cloth',get:'ore'});assert.strictEqual(s.res[0].ore,1);
 give(s,0,{cloth:4});s=A(s,0,{t:'imp',k:'tr'});assert.strictEqual(s.imp[0].tr,4);assert.strictEqual(s.metro.tr,c0,'metropoli al primo livello 4');
 assert.strictEqual(C.points(s,0,false),C.points(JSON.parse(JSON.stringify({...s,metro:{tr:null,po:null,sc:null}})),0,false)+2);
 // un altro non la prende a 4, la ruba a 5
 s.imp[1].tr=4;s.cur=1;give(s,1,{cloth:5});s=A(s,1,{t:'imp',k:'tr'});assert.strictEqual(s.imp[1].tr,5);assert.strictEqual(s.metro.tr,c1,'il livello 5 ruba la metropoli');
 // chi è già al 5 non la perde
 s.cur=0;give(s,0,{cloth:5});s=A(s,0,{t:'imp',k:'tr'});assert.strictEqual(s.imp[0].tr,5);assert.strictEqual(s.metro.tr,c1,'a 5 contro 5 resta al primo');
 assert.strictEqual(ERR(s,0,{t:'imp',k:'tr'}),'Rotta già al massimo');inv(s);
 // senza città niente migliorie
 const t=fresh(3);Object.keys(t.bld).forEach(v=>{if(t.bld[v].p===0)t.bld[v].k=1});give(t,0,{paper:1});assert.strictEqual(ERR(t,0,{t:'imp',k:'sc'}),'Serve almeno una città');
 // gru: sconto di una merce
 const g=fresh(3);g.crane[0]=1;give(g,0,{coin:1});const g2=A(g,0,{t:'imp',k:'po'});assert.strictEqual(g2.imp[0].po,1);assert.strictEqual(g2.crane[0],0);give(g2,0,{coin:1});const g3=A(g2,0,{t:'imp',k:'po'});assert.strictEqual(g3.imp[0].po,2);
 console.log('migliorie: costi crescenti, scambio 2:1 delle merci, metropoli (livello 4), furto al livello 5, gru')}

// ---- cavalieri
{let s=fresh(3);const G=C.geo(s),sp=H.knSpots(s,0);assert(sp.length>=2);
 assert.strictEqual(ERR(s,0,{t:'kn_new',v:sp[0]}),'Ti servono Lana e Roccia');
 const far=G.V.map((v,i)=>i).find(v=>!s.bld[v]&&!sp.includes(v)&&G.V[v].h.some(h=>C.landH(s,h)));assert.strictEqual(ERR(s,0,{t:'kn_new',v:far}),'Serve una tua strada che arrivi lì');
 give(s,0,{wool:9,ore:9,grain:9});s=A(s,0,{t:'kn_new',v:sp[0]});same(s.kn[sp[0]],{p:0,l:1,a:false,u:true});
 assert.strictEqual(ERR(s,0,{t:'kn_new',v:sp[0]}),'Posto occupato');
 s=A(s,0,{t:'kn_new',v:sp[1]});for(let i=0;i<3;i++)s.roads[C.roadSpots(s,0)[0]]=0;assert.strictEqual(ERR(s,0,{t:'kn_new',v:H.knSpots(s,0)[0]}),'Hai già 2 cavalieri semplici');
 assert.strictEqual(ERR(s,0,{t:'kn_mv',v:sp[0],to:sp[1]}),'Il cavaliere deve essere attivo');
 s=A(s,0,{t:'kn_act',v:sp[0]});assert(s.kn[sp[0]].a);assert.strictEqual(ERR(s,0,{t:'kn_act',v:sp[0]}),'È già attivo');
 assert.strictEqual(ERR(s,0,{t:'kn_mv',v:sp[0],to:sp[0]}),'Questo cavaliere ha già agito (o è appena stato attivato)');
 s=A(s,0,{t:'kn_up',v:sp[0]});assert.strictEqual(s.kn[sp[0]].l,2);assert(s.kn[sp[0]].a,'resta attivo');
 assert.strictEqual(ERR(s,0,{t:'kn_up',v:sp[0]}),'Per i cavalieri possenti serve la Fortezza (Politica livello 3)');
 s.imp[0].po=3;s=A(s,0,{t:'kn_up',v:sp[0]});assert.strictEqual(s.kn[sp[0]].l,3);assert.strictEqual(ERR(s,0,{t:'kn_up',v:sp[0]}),'È già un cavaliere possente');
 assert.strictEqual(ERR(s,1,{t:'kn_act',v:sp[1]}),'Non è il tuo turno');
 // movimento: all'inizio del turno dopo il cavaliere può agire, lungo le proprie strade
 s=A(s,0,{t:'end'});s=A(s,1,{t:'roll'});s.phase='main';s.cur=0;s.turnP=0;s.kn[sp[0]].u=false;
 const to=H.reach(s,0,sp[0]);
 if(to.length){s=A(s,0,{t:'kn_mv',v:sp[0],to:to[0]});assert(!s.kn[sp[0]]&&s.kn[to[0]].l===3&&!s.kn[to[0]].a,'si sposta e si disattiva')}
 inv(s);
 // spostare scacciando un cavaliere più debole
 {const t=fresh(3);for(let i=0;i<4;i++)t.roads[C.roadSpots(t,0)[0]]=0;const sp=H.knSpots(t,0).filter(v=>{t.kn[v]={p:0,l:2,a:true,u:false};const r=H.reach(t,0,v).length;delete t.kn[v];return r});assert(sp.length);t.kn[sp[0]]={p:0,l:2,a:true,u:false};const nxt=H.reach(t,0,sp[0]);assert(nxt.length);t.kn[nxt[0]]={p:1,l:1,a:true,u:false};
  const r=H.reach(t,0,sp[0]);assert(r.includes(nxt[0]),'si può scacciare un più debole');const u=A(t,0,{t:'kn_mv',v:sp[0],to:nxt[0]});assert.strictEqual(u.kn[nxt[0]].p,0);assert(Object.values(u.kn).filter(k=>k.p===1).every(k=>!k.a),'lo scacciato è disattivato');
  t.kn[nxt[0]]={p:1,l:2,a:true,u:false};assert(!H.reach(t,0,sp[0]).includes(nxt[0]),'uno di pari forza non si scaccia')}
 // inseguire il ladro
 {const t=fresh(3);const v=Object.keys(t.bld).map(Number).find(v=>t.bld[v].p===0);const G=C.geo(t),sp=H.knSpots(t,0)[0];t.kn[sp]={p:0,l:1,a:true,u:false};
  assert.strictEqual(ERR(t,0,{t:'kn_chase',v:sp}),'Il ladro non è ancora in gioco');t.robOff=false;t.robber=G.V[sp].h.find(h=>C.landH(t,h));const u=A(t,0,{t:'kn_chase',v:sp});assert.strictEqual(u.phase,'robber');assert(!u.kn[sp].a)}
 console.log('cavalieri: reclutare, attivare, promuovere (limiti 2+2+2, Fortezza), muovere lungo le strade, scacciare, inseguire il ladro')}

// ---- mura e limite delle carte
{let s=fresh(3);const c=H.cities(s,0)[0];give(s,0,{brick:2});s=A(s,0,{t:'wall',v:c});assert(s.wall[c]);assert.strictEqual(ERR(s,0,{t:'wall',v:c}),'C’è già una mura');
 const col=Object.keys(s.bld).find(v=>s.bld[v].p===0&&s.bld[v].k===1);assert.strictEqual(ERR(s,0,{t:'wall',v:+col}),'Serve una tua città');
 // 7 nel mondo senza ladro: si scarta lo stesso, ma poi non si muove nulla
 const t=pre(clear(fresh(3)));t.res[0].wood+=8;t.bank.wood-=8;const r=roll(t,0,3,4,4);assert.strictEqual(r.phase,'discard');assert.strictEqual(r.disc[0],4);
 const w=clear(fresh(3));w.wall[H.cities(w,0)[0]]=true;w.res[0].wood+=8;w.bank.wood-=8;const r2=roll(pre(w),0,3,4,4);assert.notStrictEqual(r2.phase,'discard','con le mura il limite è 9');
 const k=pre(clear(fresh(3)));const r3=roll(k,0,3,4,4);assert.strictEqual(r3.phase,'main','con il ladro fuori gioco il 7 non lo muove');
 const d=A(r,0,{t:'discard',res:{wood:4}});assert.strictEqual(d.phase,'main');inv(d);
 console.log('mura (+2 al limite di carte), 7 senza ladro in gioco')}

// ---- barbari
{const base=()=>{const s=fresh(3);s.bar=6;return s};
 // sconfitta: nessun cavaliere attivo, tutti perdono una città, la metropoli è salva
 {const s=base();const ct=Object.values(s.bld).filter(b=>b.k===2).length,m=H.cities(s,0)[0];s.metro.tr=m;s.imp[0].tr=4;s.wall[H.cities(s,1)[0]]=true;
  const r=roll(pre(s),0,1,1,1);assert.strictEqual(r.bar,0);assert(!r.robOff,'dopo il primo attacco il ladro entra in gioco');
  assert.strictEqual(r.bld[m].k,2,'la metropoli non si saccheggia');assert.strictEqual(C.count(r,1,2),0);assert.strictEqual(C.count(r,2,2),0);assert(!r.wall[H.cities(s,1)[0]],'le mura cadono con la città');
  const ev=r.ev.find(e=>e.t==='attack');assert.strictEqual(ev.win,false);assert.strictEqual(ev.str,ct);assert.strictEqual(r.ev.filter(e=>e.t==='pillage').length,2)}
 // vittoria: il giocatore con più difesa prende il Difensore
 {const s=base(),sp=H.knSpots(s,0),sp1=H.knSpots(s,1).filter(v=>!sp.includes(v));s.kn[sp[0]]={p:0,l:3,a:true,u:false};s.kn[sp1[0]]={p:1,l:1,a:true,u:false};s.kn[sp1[1]]={p:1,l:1,a:false,u:false};
  const r=roll(pre(s),0,1,1,1);assert.strictEqual(r.ev.find(e=>e.t==='attack').win,true);assert.strictEqual(r.dof[0],1);assert.strictEqual(r.dof[1],0);assert(Object.values(r.kn).every(k=>!k.a),'tutti disattivati');
  assert.strictEqual(C.points(r,0,false),C.points(s,0,false)+1)}
 // pareggio: nessun punto, ma una carta progresso a testa
 {const s=base(),sp=H.knSpots(s,0),sp1=H.knSpots(s,1).filter(v=>!sp.includes(v));s.kn[sp[0]]={p:0,l:2,a:true,u:false};s.kn[sp1[0]]={p:1,l:2,a:true,u:false};const r=roll(pre(s),0,1,1,1);assert.strictEqual(r.dof.reduce((a,b)=>a+b,0),0);
  assert(r.pg[0].length+r.pgvp[0]>=1&&r.pg[1].length+r.pgvp[1]>=1,'carta ai pari merito')}
 // chi contribuisce di meno perde: solo il più debole
 {const s=base(),sp=H.knSpots(s,0);s.kn[sp[0]]={p:0,l:1,a:true,u:false};const r=roll(pre(s),0,1,1,1);assert.strictEqual(C.count(r,0,2),1,'chi ha difeso non perde');assert.strictEqual(C.count(r,1,2)+C.count(r,2,2),0)}
 // la nave avanza di uno a ogni faccia con la nave
 {const s=fresh(3);const r=roll(pre(s),0,2,3,2);assert.strictEqual(r.bar,1);assert.strictEqual(r.ed,'b');const r2=roll(pre(A(r,0,{t:'end'})&&{...r,phase:'roll',cur:0,dice:null}),0,2,3,3);assert.strictEqual(r2.bar,2)}
 console.log('barbari: sconfitta (città saccheggiate, metropoli salve), vittoria (Difensore +1), pareggio (carte), ladro attivato')}

// ---- dado evento: carte progresso
{let s=fresh(3);s.imp[0].po=1;s.imp[1].po=3;
 const r=roll(pre(s),0,1,3,5);assert.strictEqual(r.ed,'po');assert(r.pg[1].length+r.pgvp[1]>=1,'livello 3 e dado rosso 3 → carta');assert.strictEqual(r.pg[2].length+r.pgvp[2],0,'senza livello niente');
 assert.strictEqual(r.pg[0].length+r.pgvp[0],0,'dado rosso 3 > livello 1 + 1');
 const q=roll(pre(fresh(3)).constructor===Object?(()=>{const t=fresh(3);t.imp[0].po=1;return pre(t)})():null,0,2,2,5);assert(q.pg[0].length+q.pgvp[0]>=1,'livello 1 con dado rosso 2 → carta');
 // limite di 4 in mano
 const t=fresh(3);t.imp[0].po=5;t.pg[0]=['bishop','bishop','warlord','wedding'];const w=roll(pre(t),0,1,1,5);assert(w.pg[0].length<=4);
 console.log('dado evento: carta progresso se il dado rosso è ≤ livello+1, massimo 4 in mano')}

// ---- acquedotto
{const s=fresh(3);s.imp[0].sc=3;const G=C.geo(s);s.bld={};Object.keys(s.bld);s.bld[G.HX[0].v[0]]={p:1,k:1};s.res.forEach(r=>KEYS(s).forEach(k=>{s.bank[k]+=r[k];r[k]=0}));
 const hit=s.hexes.map(h=>h.num).filter(n=>n&&n!==7);const n=[2,3,4,5,6,8,9,10,11,12].find(x=>!G.HX.some((h,i)=>s.hexes[i].num===x&&h.v.some(v=>s.bld[v])))||2;
 const r=roll(pre(s),0,Math.max(1,n-6),n-Math.max(1,n-6),1);if(n!==7){assert.strictEqual(r.phase,'gold');assert.strictEqual(r.gold[0],1);const t=A(r,0,{t:'gold',res:{ore:1}});assert.strictEqual(t.res[0].ore,1);inv(t)}
 console.log('acquedotto (scienza 3): una risorsa a scelta se non incassi nulla')}

// ---- carte progresso, una per una
{const mk=(cards,f)=>{const s=fresh(3);s.pg[0]=cards.slice();if(f)f(s);return s};
 const play=(s,a)=>A(s,0,{t:'pg',...a});
 const G0=C.geo(fresh(3));
 // risorse e merci
 {const s=mk(['rmono'],s=>{clear(s);give(s,1,{wool:3});give(s,2,{wool:1})});const r=play(s,{card:'rmono',r:'wool'});assert.strictEqual(r.res[0].wool,s.res[0].wool+3);assert.strictEqual(r.res[1].wool,1);assert.strictEqual(r.pg[0].length,0);inv(r)}
 {const s=mk(['cmono'],s=>{give(s,1,{coin:3});give(s,2,{coin:1})});const r=play(s,{card:'cmono',r:'coin'});assert.strictEqual(r.res[0].coin,2);inv(r);assert.strictEqual(ERR(s,0,{t:'pg',card:'cmono',r:'wool'}),'Scegli una merce')}
 {const s=mk(['master'],s=>{s.dof[1]=3;give(s,1,{ore:4})});const n0=C.cardsOf(s,0),n1=C.cardsOf(s,1);const r=play(s,{card:'master',p:1});assert.strictEqual(C.cardsOf(r,0),n0+2);assert.strictEqual(C.cardsOf(r,1),n1-2);assert.strictEqual(ERR(s,0,{t:'pg',card:'master',p:2}),'Deve avere più punti di te')}
 {const s=mk(['fleet'],s=>{clear(s);give(s,0,{wood:2})});const r=play(s,{card:'fleet',k:'wood'});const r2=A(r,0,{t:'bank',give:'wood',get:'ore'});assert.strictEqual(r2.res[0].wood,0);assert.strictEqual(r2.res[0].ore,1);const r3=A(r2,0,{t:'end'});assert.strictEqual(r3.fleet,null)}
 {const s=mk(['merchant']);const G=C.geo(s),v=Object.keys(s.bld).find(v=>s.bld[v].p===0),h=G.V[v].h.find(h=>RES.includes(s.hexes[h].t));const r=play(s,{card:'merchant',h});same(r.merch,{h,p:0});assert.strictEqual(C.points(r,0,false),C.points(s,0,false)+1);
  const t=r.hexes[h].t;give(r,0,{[t]:2});const q=A(r,0,{t:'bank',give:t,get:RES.find(k=>k!==t)});assert.strictEqual(q.res[0][t],r.res[0][t]-2,'2:1 sulla risorsa del Mercante')}
 // politica
 {const s=mk(['bishop'],s=>{give(s,1,{wool:2});give(s,2,{wool:2})});assert.strictEqual(ERR(s,0,{t:'pg',card:'bishop',h:0}),'Il ladro non è ancora in gioco');s.robOff=false;const G=C.geo(s);
  const v=Object.keys(s.bld).map(Number).find(v=>s.bld[v].p===1);const h=G.V[v].h.find(h=>h!==s.robber&&C.landH(s,h));give(s,1,{brick:1});const n=C.cardsOf(s,0),r=play(s,{card:'bishop',h});assert.strictEqual(r.robber,h);assert(C.cardsOf(r,0)>n,'ruba ai vicini');inv(r)}
 {const s=mk(['deserter'],s=>{roads(s,1,3);const sp=H.knSpots(s,1);s.kn[sp[0]]={p:1,l:2,a:true,u:false}});const r=play(s,{card:'deserter',p:1});assert.strictEqual(Object.values(r.kn).filter(k=>k.p===1).length,0);assert.strictEqual(Object.values(r.kn).filter(k=>k.p===0).length,1);assert.strictEqual(ERR(s,0,{t:'pg',card:'deserter',p:2}),'Non ha cavalieri')}
 {const s=mk(['intrigue'],s=>{roads(s,0,3);const sp=H.knSpots(s,0)[0];s.kn[sp]={p:1,l:3,a:true,u:false}});const v=+Object.keys(s.kn)[0];const r=play(s,{card:'intrigue',v});assert(!r.kn[v]||r.kn[v].p===1&&r.kn[v].a===false)}
 {const s=mk(['wedding'],s=>{s.dof[1]=2;give(s,1,{ore:3});s.dof[2]=2;give(s,2,{ore:3})});const n=C.cardsOf(s,0),r=play(s,{card:'wedding'});assert.strictEqual(C.cardsOf(r,0),n+4)}
 {const s=mk(['warlord'],s=>{roads(s,0,4);const sp=H.knSpots(s,0);s.kn[sp[0]]={p:0,l:1,a:false,u:false};s.kn[sp[1]]={p:0,l:1,a:false,u:false}});const r=play(s,{card:'warlord'});assert(Object.values(r.kn).every(k=>k.a))}
 {const s=mk(['saboteur'],s=>{s.dof[0]=0;give(s,1,{ore:8});give(s,2,{ore:2})});const r=play(s,{card:'saboteur'});assert(C.cardsOf(r,1)<=C.cardsOf(s,1)/2+.5);inv(r)}
 // scienza
 {const s=mk(['irrig','mining']),G=C.geo(s);const cnt=t=>new Set(Object.keys(s.bld).filter(v=>s.bld[v].p===0).flatMap(v=>G.V[v].h).filter(h=>s.hexes[h].t===t)).size;const r=play(s,{card:'irrig'}),g=r.res[0].grain-s.res[0].grain;assert.strictEqual(g,2*cnt('grain'));
  const q=A({...r,pg:[['mining'],[],[]]},0,{t:'pg',card:'mining'});assert.strictEqual(q.res[0].ore-r.res[0].ore,2*cnt('ore'));inv(q)}
 {const s=mk(['smith'],s=>{roads(s,0,4);const sp=H.knSpots(s,0);s.kn[sp[0]]={p:0,l:1,a:false,u:false};s.kn[sp[1]]={p:0,l:1,a:false,u:false}});const[a,b]=Object.keys(s.kn);const r=play(s,{card:'smith',v1:+a,v2:+b});assert(Object.values(r.kn).every(k=>k.l===2));assert.strictEqual(ERR(s,0,{t:'pg',card:'smith',v1:+a,v2:+a}),'Scegli uno o due cavalieri')}
 {const s=mk(['roadb']);const r=play(s,{card:'roadb'});assert.strictEqual(r.phase,'rb');assert.strictEqual(r.rbLeft,2)}
 {const s=mk(['medicine'],s=>give(s,0,{ore:2,grain:1}));const v=+Object.keys(s.bld).find(v=>s.bld[v].p===0&&s.bld[v].k===1);const r=play(s,{card:'medicine',v});assert.strictEqual(r.bld[v].k,2);assert.strictEqual(r.res[0].ore,s.res[0].ore-2);inv(r)}
 {const s=mk(['inventor']),G=C.geo(s),ok=s.hexes.map((h,i)=>h.num&&![2,6,8,12].includes(h.num)?i:-1).filter(i=>i>=0);const[x,y]=ok;const nx=s.hexes[x].num,ny=s.hexes[y].num;const r=play(s,{card:'inventor',h1:x,h2:y});assert.strictEqual(r.hexes[x].num,ny);assert.strictEqual(r.hexes[y].num,nx);
  const bad=s.hexes.findIndex(h=>h.num===6||h.num===8);assert(ERR(s,0,{t:'pg',card:'inventor',h1:x,h2:bad}))}
 {const s=mk(['alchemist']);s.phase='roll';s.dice=null;const r=A(s,0,{t:'pg',card:'alchemist',d:[2,3]});same(r.dice,[2,3]);assert(r.phase!=='roll');assert.strictEqual(ERR(mk(['alchemist']),0,{t:'pg',card:'alchemist',d:[2,3]}),'L’Alchimista si gioca prima di tirare i dadi')}
 // non si gioca una carta che non si ha, né fuori turno
 {const s=mk(['bishop']);assert.strictEqual(ERR(s,0,{t:'pg',card:'wedding'}),'Non hai quella carta');s.pg[1]=['warlord'];assert.strictEqual(ERR(s,1,{t:'pg',card:'warlord'}),'Le carte progresso si giocano nella tua fase di gioco')}
 console.log('carte progresso: 19 effetti provati uno per uno')}

// ---- partite complete
const run=(n,seed,bots,max)=>{C.setRnd(carica.rng(seed));let s=C.newGame(n,names(n),{ext:['cek']});s=B.gioca(s,bots,inv,max||9000);return s};
const rnd=carica.rng(77),casual=(s,p)=>B.casuale(s,p,rnd);
{let wins=0,fin=0,N=6;for(let g=0;g<N;g++){const s=run(2,100+g,[B.smart,casual]);if(s.over){fin++;if(s.over.win===0)wins++}inv(s)}
 assert(fin>=5,'le partite finiscono: '+fin);assert(wins>=5,'il bot competente batte quello casuale: '+wins+'/'+N);console.log('partite: bot competente batte il casuale '+wins+'/'+N+' (2 giocatori)')}
for(const n of[3,4,6]){const s=run(n,200+n,Array(n).fill(B.smart),12000);assert(s.over,n+' giocatori: partita non finita');assert(s.over.scores[s.over.win]>=13);inv(s);console.log(n+' giocatori, bot competenti: vince '+s.over.scores[s.over.win]+' punti in '+s.evn+' mosse (attacchi: '+s.dof.reduce((a,b)=>a+b,0)+' difensori)')}
{// tutti casuali: nessun crash, invarianti sempre vere
 let seen={imp:0,kn:0,wall:0,pg:0};for(let g=0;g<3;g++){C.setRnd(carica.rng(300+g));let s=C.newGame(3,names(3),{ext:['cek']});s=B.gioca(s,Array(3).fill(casual),inv,4000);inv(s);seen.imp+=s.imp.reduce((a,m)=>a+m.tr+m.po+m.sc,0);seen.kn+=Object.keys(s.kn).length;seen.wall+=Object.keys(s.wall).length;seen.pg+=s.pg.reduce((a,x)=>a+x.length,0)}
 console.log('casuali: nessun errore, carte conservate (migliorie '+seen.imp+', cavalieri '+seen.kn+', mura '+seen.wall+', progresso '+seen.pg+')')}
// con i Marinai insieme
{C.setRnd(carica.rng(9));let s=C.newGame(3,names(3),{ext:['mar','cek'],scen:'nt'});assert.strictEqual(s.vp,13);s=B.gioca(s,Array(3).fill(B.smart),inv,12000);assert(s.over,'Marinai + Città e Cavalieri: partita non finita');inv(s);console.log('Marinai + Città e Cavalieri: partita finita a '+s.over.scores[s.over.win]+' punti')}
console.log('OK catan cek');
