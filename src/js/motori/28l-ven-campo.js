/* ---- Compagnia di ventura (piano C): la battaglia campale. Motore puro, senza DOM né rete. ----
   Due schiere su un campo W×H (passi), in tempo reale: un istante = 100 ms, `passo(s, n)` avanza, la pausa è non chiamarlo.
   Ogni soldato è un'unità; chi gioca guida il capitano (`capitano`) e dà ordini ai tre gruppi (`ordina`): fanti, tiratori,
   cavalieri. Il lato `a` parte dal basso, il lato `b` dall'alto. In campo stanno al massimo `MAX` uomini per lato: gli altri
   arrivano a ondate dal proprio bordo. Negli assedi un muro taglia il campo e si passa solo dai varchi.
   `risolvi(scheda)` gioca tutta la battaglia senza grafica (risoluzione automatica: stesso motore, stessi numeri).
   Mai `Math.random`, `Date.now` o trigonometria. I numeri delle truppe stanno in `VDAT` (28j); qui solo quelli del campo, in `C`.
   Piano: docs/VENTURA.md. */
const VCAM=(()=>{
 const D=VDAT;
 const C={W:60,H:100,ARENA:17,MAX:34,ONDATA:10,PASSO:.03,MISCHIA:1.5,RITMO:12,RITMO_T:24,VOLO:.55,ROTTA:.22,TMAX:7000,DANNO:.5,GRIDO:320,GRIDO_DUR:90,MURO:34};
 const rad=Math.sqrt,d2=(a,b)=>rad((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
 const stretto=(v,a,b)=>v<a?a:v>b?b:v;
 const GR=['f','t','c'];
 function unita(s,l,riga,x,y){const T=D.TR[riga.t],u={id:s.uid++,l,p:riga.p,t:riga.t,c:T.c,x,y,px:x,py:y,pf:T.pf,pfm:T.pf,att:T.att,dif:T.dif,dan:T.dan,git:s.meteo==='nebbia'?Math.round(T.git*.7):T.git,vel:T.vel,cd:Math.floor(s.r()*10),b:-1,st:'vivo',
   fx:0,fy:l==='a'?-1:1,ca:0,liv:T.t,col:0,buff:0};if(riga.st){Object.assign(u,riga.st);u.pfm=u.pf}s.u.push(u);return u}
 // posti di una schiera attorno a un'ancora: righe larghe, i più forti davanti
 function posto(k,n,passo,larg){const perRiga=Math.max(4,Math.min(larg,Math.ceil(rad(n*2.6)))),riga=Math.floor(k/perRiga),col=k%perRiga,inRiga=Math.min(perRiga,n-riga*perRiga);
  return[(col-(inRiga-1)/2)*passo,riga*passo]}
 function nuovo(scheda,o){o=o||{};const s={v:1,t:0,rng:ADADI.semina(scheda.seme||1),seme0:scheda.seme||1,scena:scheda.scena||null,ora:scheda.ora==null?-1:scheda.ora,meteo:(scheda.scena&&scheda.scena.meteo)||'sereno',W:C.W,H:C.H,tipo:scheda.tipo||'campo',terreno:scheda.terreno||1,bioma:scheda.bioma||0,notte:!!scheda.notte,u:[],uid:1,
   ris:{a:[],b:[]},ord:{a:{},b:{}},voli:[],ev:[],fine:null,cad:{},fug:{a:0,b:0},n0:{a:0,b:0},v0:{a:0,b:0},autoA:!!o.autoA,cap:-1,capi:[],ko:[],capKo:false,grido:0,gridi:[],
   faza:scheda.faza,fazb:scheda.fazb,noma:scheda.noma,nomb:scheda.nomb,ia:{a:{f:0},b:{f:0}},muro:scheda.tipo==='assedio'?C.MURO:0,varchi:scheda.tipo==='assedio'?[[14,19],[41,46]]:[]};
  s.r=ADADI.gen(s);
  for(const l of['a','b']){const righe=(scheda[l]||[]).map(x=>({p:x.p,t:x.t,n:x.n,st:x.st})).sort((x,y)=>D.TR[y.t].t-D.TR[x.t].t);
   for(const x of righe){s.n0[l]+=x.n;s.v0[l]+=x.n*D.valore(x.t)}
   // in campo i migliori, in proporzione ai gruppi; il resto in riserva
   const capi=l==='a'?(scheda.capi||(scheda.cap?[scheda.cap]:[])):[];let liberi=C.MAX-capi.length;const tot=s.n0[l],campo=[];
   for(const x of righe){const q=tot<=liberi?x.n:Math.max(x.n?1:0,Math.round(x.n*liberi/tot));const k=Math.min(q,x.n);if(k>0)campo.push({p:x.p,t:x.t,n:k,st:x.st});if(x.n-k>0)s.ris[l].push({p:x.p,t:x.t,n:x.n-k,st:x.st})}
   const arena=s.tipo==='arena',ya=arena?(l==='a'?C.H/2+4:C.H/2-6):l==='a'?C.H-20:(s.muro?s.muro-7:20),ver=l==='a'?1:-1;
   s.ord[l]={f:{t:'tieni',x:C.W/2,y:ya},t:{t:'tieni',x:C.W/2,y:ya+ver*7},c:{t:'tieni',x:C.W/2+(l==='a'?17:-17),y:ya+ver*2}};
   if(s.muro&&l==='b'){s.ord.b.t={t:'tieni',x:C.W/2,y:s.muro-2.5};s.ord.b.c={t:'tieni',x:C.W/2,y:s.muro-12}}
   const perG={f:[],t:[],c:[]};for(const x of campo)for(let k=0;k<x.n;k++)perG[D.TR[x.t].c].push(x);
   for(const g of GR){const L=perG[g],o2=s.ord[l][g];L.forEach((x,k)=>{const pt=posto(k,L.length,arena?4:g==="c"?2.4:1.7,s.muro&&l==="b"&&g==="t"?26:10);unita(s,l,x,stretto(o2.x+pt[0],2,C.W-2),o2.y+ver*pt[1])})}
   // i capitani: uno per posto (in compagnia ognuno guida il suo)
   capi.forEach((c,i)=>{const u=unita(s,'a',{p:0,t:scheda.a[0]?scheda.a[0].t:'val_f1'},C.W/2+(i-(capi.length-1)/2)*4,ya+2);
    Object.assign(u,{cap:true,seat:i,c:'k',pf:c.pf,pfm:c.pf,att:c.att,dif:c.dif,dan:c.dan,git:c.git||0,rit:c.rit||0,perf:c.perf||0,car:c.car||0,gf:c.grido||1,asp:c.asp||null,vel:c.vel,cav:!!c.cavallo,liv:5,nome:c.nome,vx:u.x,vy:u.y,ob:-1});s.capi.push(u.id);s.ko.push(false);s.gridi.push(0)});
   if(l==='a'&&capi.length)s.cap=s.capi[0]}
  s.mor={a:scheda.morale==null?55:scheda.morale,b:55};
  if(s.fazb==='pre'){for(const g of GR)s.ord.b[g].t='carica'}
  return s}
 const vivi=(s,l)=>s.u.filter(u=>u.l===l&&u.st==='vivo');
 const riserva=(s,l)=>s.ris[l].reduce((a,x)=>a+x.n,0);
 // il capitano di un posto; senza posto, il primo ancora in piedi (è lui che «Seguimi» segue)
 const capU=(s,seat)=>{if(!s.capi||!s.capi.length)return null;if(seat!=null)return s.u.find(u=>u.id===s.capi[seat])||null;let primo=null;for(const id of s.capi){const u=s.u.find(u=>u.id===id);if(!primo)primo=u;if(u&&u.st==='vivo')return u}return primo};
 // ---------- ordini ----------
 function ordina(s,o){if(s.fine)return{err:'La battaglia è finita'};if(s.tipo==='arena')return{err:'In lizza non si danno ordini'};const l=o.l||'a',gs=o.g==='tutti'||!o.g?GR:[o.g];const cap=o.seat!=null&&capU(s,o.seat)&&capU(s,o.seat).st==='vivo'?capU(s,o.seat):capU(s);
  for(const g of gs){const q=s.ord[l][g];if(!q)return{err:'Gruppo sconosciuto'};
   if(o.t==='carica'||o.t==='segui'){q.t=o.t;q.seg=o.t==='segui'&&cap?cap.seat:null}
   else if(o.t==='tieni'){q.t='tieni';const U=s.u.filter(u=>u.l===l&&u.c===g&&u.st==='vivo');if(o.x!=null){q.x=o.x;q.y=o.y}else if(U.length){q.x=U.reduce((a,u)=>a+u.x,0)/U.length;q.y=U.reduce((a,u)=>a+u.y,0)/U.length}}
   else if(o.t==='avanza'||o.t==='arretra'){if(q.t==='segui'&&cap){q.x=cap.x;q.y=cap.y}q.t='tieni';q.y=stretto(q.y+(l==='a'?-1:1)*(o.t==='avanza'?12:-12),4,C.H-4)}
   else return{err:'Ordine sconosciuto'}}
  s.ev.push({t:'ordine',l,g:o.g||'tutti',o:o.t});return{s}}
 function capitano(s,o){const seat=o.seat||0,u=capU(s,seat);if(s.fine)return{err:'La battaglia è finita'};if(!u||u.st!=='vivo')return{err:'Il capitano è a terra'};
  if(o.grido){if(s.tipo==='arena')return{err:'In lizza non si grida'};if(s.t<(s.gridi[seat]||0))return{err:'Non hai ancora fiato'};s.gridi[seat]=s.t+Math.round(C.GRIDO*(u.gf||1));s.grido=s.gridi[0];for(const q of s.u)if(q.l==='a'&&d2(q,u)<16){q.buff=s.t+C.GRIDO_DUR;if(q.st==='fuga'){q.st='vivo'}}s.mor.a=Math.min(100,s.mor.a+12);s.ev.push({t:'grido',x:u.x,y:u.y});return{s}}
  if(o.b!=null){const b=s.u.find(q=>q.id===o.b&&q.l==='b'&&q.st==='vivo');if(!b)return{err:'Bersaglio non valido'};u.ob=b.id;u.vx=null;return{s}}
  if(o.x!=null){u.vx=stretto(o.x,1,C.W-1);u.vy=stretto(o.y,1,C.H-1);u.ob=-1;return{s}}
  return{err:'Ordine sconosciuto'}}
 // ---------- movimento ----------
 function versoVarco(s,u,tx,ty){if(!s.muro)return[tx,ty];const m=s.muro,sopra=u.y<m,tsopra=ty<m;if(sopra===tsopra)return[tx,ty];
  let best=null,bd=1e9;for(const v of s.varchi){const cx=(v[0]+v[1])/2,d=Math.abs(u.x-cx)+Math.abs(tx-cx)*.5;if(d<bd){bd=d;best=v}}
  const cx=stretto(u.x,best[0]+.7,best[1]-.7);if(u.x>best[0]+.5&&u.x<best[1]-.5)return[cx,ty];return[(best[0]+best[1])/2,m+(sopra?-1.6:1.6)]}
 function muovi(s,u,tx,ty,k){const w=versoVarco(s,u,tx,ty);tx=w[0];ty=w[1];const dx=tx-u.x,dy=ty-u.y,d=rad(dx*dx+dy*dy);if(d<.05)return 0;
  let v=u.vel*C.PASSO*(k||1);if(s.terreno===2&&(u.c==='c'||u.cav))v*=.78;if(s.bioma===1)v*=.92;if(u.buff>s.t)v*=1.12;const st=Math.min(d,v);
  let nx=u.x+dx/d*st,ny=u.y+dy/d*st;
  if(s.muro){const m=s.muro,dentro=s.varchi.some(g=>nx>g[0]+.4&&nx<g[1]-.4);if(!dentro&&(u.y-m)*(ny-m)<=0)ny=u.y<m?m-.5:m+.5;
   if(Math.abs(ny-m)<.5&&!dentro)ny=u.y<m?m-.5:m+.5}
  u.x=stretto(nx,.5,C.W-.5);u.y=stretto(ny,.5,C.H-.5);u.fx=dx/d;u.fy=dy/d;return st}
 // ---------- colpi ----------
 function ferisci(s,b,dan,da){if(b.st==='ko')return;b.pf-=dan;b.col=s.t;
  if(b.pf<=0){b.pf=0;b.st='ko';b.kt=s.t;const k=b.p+'|'+b.t;if(!b.cap)s.cad[k]=(s.cad[k]||0)+1;else if(b.l==='a'){s.ko[b.seat||0]=true;s.capKo=s.ko.every(x=>x)}
   s.mor[b.l]-=(b.cap?18:60/Math.max(8,s.n0[b.l]));const o=b.l==='a'?'b':'a';s.mor[o]=Math.min(100,s.mor[o]+20/Math.max(8,s.n0[o]));
   s.ev.push({t:'ko',id:b.id,da:da?da.id:-1,cap:!!b.cap,seat:b.seat});if(b.cap&&b.l==='a'){s.ev.push({t:'cap-ko',seat:b.seat||0,tutti:s.capKo});if(s.capKo)for(const g of GR)if(s.ord.a[g].t==='segui')s.ord.a[g].t='carica'}}}
 function armatura(dan,dif){return Math.max(1,dan*(1-dif/(dif+34)))}
 function mischia(s,u,b){const r=s.r,att=u.att*(u.buff>s.t?1.2:1)*(u.c==='t'?.7:1),p=stretto(.5+(att-b.dif)/40,.15,.93);u.cd=(u.rit||(u.c==='c'||u.cav?C.RITMO+2:C.RITMO))+Math.floor(r()*3);
  const dx=b.x-u.x,dy=b.y-u.y,d=rad(dx*dx+dy*dy)||1;u.fx=dx/d;u.fy=dy/d;
  if(r()>p){s.ev.push({t:'colpo',da:u.id,a:b.id,dan:0});u.ca=0;return}
  let dan=u.dan*(.7+r()*.6)*(1+u.ca*(.9+(u.car||0)));const crit=r()<.08+(u.cap?.08:0);if(crit)dan*=1.8;dan=Math.max(1,Math.round(armatura(dan,b.dif*(1-(u.perf||0)))*C.DANNO));
  if(u.ca>.6){b.cd=Math.max(b.cd,8);b.x=stretto(b.x+u.fx*.9,.5,C.W-.5);b.y=stretto(b.y+u.fy*.9,.5,C.H-.5)}
  s.ev.push({t:'colpo',da:u.id,a:b.id,dan,crit,carica:u.ca>.6});u.ca=0;ferisci(s,b,dan,u)}
 function tiro(s,u,b,d){const r=s.r;u.cd=(u.cap&&u.rit?u.rit:C.RITMO_T)+Math.floor(r()*6);const dx=b.x-u.x,dy=b.y-u.y;u.fx=dx/(d||1);u.fy=dy/(d||1);
  let p=.42+(u.att-b.dif*.5)/40-d/u.git*.22;if(s.terreno===2)p-=.12;if(s.notte)p-=.1;if(s.meteo==='pioggia')p-=.1;if(s.muro&&b.y<s.muro&&u.y>s.muro)p-=.2;if(b.c==='c'||b.cav)p-=.06;p=stretto(p,.08,.9);
  const colpito=r()<p,vt=Math.max(2,Math.round(d*C.VOLO)),dan=colpito?Math.max(1,Math.round(armatura(u.dan*(.75+r()*.5),b.dif*.8*(1-(u.perf||0)))*C.DANNO)):0;
  s.voli.push({at:s.t+vt,a:b.id,dan,da:u.id});s.ev.push({t:'tiro',da:u.id,a:b.id,x0:u.x,y0:u.y,x1:b.x,y1:b.y,vt,colpito})}
 // ---------- il comandante avversario (e il tuo, nella risoluzione automatica) ----------
 function comanda(s,l){const o=s.ord[l],ia=s.ia[l],me=vivi(s,l),ne=vivi(s,l==='a'?'b':'a');if(!me.length||!ne.length)return;
  const my=me.reduce((a,u)=>a+u.y,0)/me.length,ny=ne.reduce((a,u)=>a+u.y,0)/ne.length,dist=Math.abs(my-ny),ver=l==='a'?-1:1;
  const mt=me.filter(u=>u.c==='t').length,nt=ne.filter(u=>u.c==='t').length;
  if(s.tipo==='arena'){for(const g of GR)o[g].t='carica';return}
  if(s.muro){if(l==='b'){o.f.t='tieni';o.f.x=C.W/2;o.f.y=s.muro-6;if(ne.some(u=>u.y<s.muro+1)){o.f.t='carica';o.c.t='carica'}return}for(const g of GR)o[g].t='carica';if(s.t<60){o.t.t='tieni';o.t.y=s.muro+18;o.t.x=C.W/2}return}
  if(ia.f===0){// avvicinamento: i tiratori si fermano a tiro, i fanti avanzano fino al contatto, i cavalieri aspettano sul fianco
   const aspetta=mt>nt+2&&s.t<420&&(l==='b'?s.fazb!=='pre':true);
   if(!aspetta){o.f.t='tieni';o.f.y=stretto(o.f.y+ver*3.2,6,C.H-6);o.t.t='tieni';o.t.y=o.f.y-ver*6;o.t.x=o.f.x;o.c.t='tieni';o.c.y=o.f.y-ver*3}
   if(dist<26||s.t>900){ia.f=1}}
  else{o.f.t='carica';o.c.t='carica';if(dist<9||s.t>ia.t0+200)o.t.t='carica';if(!ia.t0)ia.t0=s.t}}
 // ---------- un istante ----------
 function istante(s){s.t++;const U=s.u;
  // frecce in arrivo
  if(s.voli.length){const resto=[];for(const v of s.voli){if(v.at>s.t){resto.push(v);continue}const b=U.find(u=>u.id===v.a);if(b&&b.st!=='ko'&&v.dan>0){s.ev.push({t:'colpo',da:v.da,a:b.id,dan:v.dan,freccia:true});ferisci(s,b,v.dan,U.find(u=>u.id===v.da))}}s.voli=resto}
  if(s.t%20===1){comanda(s,'b');if(s.autoA)comanda(s,'a')}
  const cap0=capU(s),vv=U.filter(u=>u.st==='vivo');
  const conta={a:{f:0,t:0,c:0},b:{f:0,t:0,c:0}},idx={};for(const u of vv)if(!u.cap){idx[u.id]=conta[u.l][u.c]++}
  for(const u of U){if(u.st==='ko')continue;u.px=u.x;u.py=u.y;if(u.cd>0)u.cd--;
   if(u.st==='fuga'){const ty=u.l==='a'?C.H+2:-2;const dy=ty-u.y;u.y+=(dy>0?1:-1)*u.vel*C.PASSO*1.15;u.fy=dy>0?1:-1;u.fx=0;if(u.y<=.2||u.y>=C.H-.2){u.st='via';s.fug[u.l]++}continue}
   if(u.st!=='vivo')continue;
   // bersaglio: ogni mezzo secondo si guarda intorno
   const nem=u.l==='a'?'b':'a',o=u.cap?null:s.ord[u.l][u.c];let b=u.b>=0?U.find(q=>q.id===u.b&&q.st==='vivo'):null;
   if(!b||(s.t+u.id)%5===0){let m=null,md=1e9;for(const q of vv){if(q.l!==nem)continue;const d=d2(u,q)+(s.muro&&(q.y<s.muro)!==(u.y<s.muro)&&!u.git?6:0);if(d<md){md=d;m=q}}b=m;u.b=m?m.id:-1;u.bd=md}
   let ax=u.x,ay=u.y;// l'ancora: dove dovrei stare
   if(u.cap){if(s.autoA){const of=s.ord.a.f,db0=b?d2(u,b):1e9;if(of.t!=='carica'&&db0>6){muovi(s,u,of.x,of.y+3,.6);continue}
     if(b&&db0>C.MISCHIA+.3){let amici=0;for(const q of vv)if(q.l==='a'&&q!==u&&d2(q,b)<db0+1)amici++;if(amici<2&&db0>4&&s.tipo!=='arena'){continue}muovi(s,u,b.x,b.y,.6);continue}}
    if(u.ob>=0){const q=U.find(x=>x.id===u.ob&&x.st==='vivo');if(q)b=q;else u.ob=-1}
    const db=b?d2(u,b):1e9;
    if(u.vx!=null&&!s.autoA){const dv=rad((u.vx-u.x)*(u.vx-u.x)+(u.vy-u.y)*(u.vy-u.y));if(dv>.4&&!(b&&db<=C.MISCHIA+.2&&u.ob>=0)){const st=muovi(s,u,u.vx,u.vy);u.ca=u.cav?Math.min(1,u.ca+st*.12):0;if(b&&db<=C.MISCHIA+.3&&u.cd<=0)mischia(s,u,b);continue}u.vx=null}
    if(b&&u.git&&db>3.2&&db<=u.git&&(u.ob>=0||s.autoA||u.vx==null)){if(u.cd<=0)tiro(s,u,b,db);continue}
    if(b&&(u.ob>=0||s.autoA||db<7)){if(db<=C.MISCHIA+.3){if(u.cd<=0)mischia(s,u,b)}else{const st=muovi(s,u,b.x,b.y);u.ca=u.cav?Math.min(1,u.ca+st*.12):0}}continue}
   const ver=u.l==='a'?1:-1;
   const cap=o&&o.seg!=null&&capU(s,o.seg)&&capU(s,o.seg).st==='vivo'?capU(s,o.seg):cap0;
   if(o.t==='segui'&&cap&&u.l==='a'){const pt=posto(idx[u.id],conta[u.l][u.c],u.c==='c'?2.4:1.7,12);ax=cap.x+pt[0]+(u.c==='c'?9:0);ay=cap.y+(3+pt[1]+(u.c==='t'?5:0))*ver}
   else if(o.t==='tieni'||o.t==='segui'){const pt=posto(idx[u.id],conta[u.l][u.c],u.c==='c'?2.4:1.7,s.muro&&u.l==="b"&&u.c==="t"?26:10);ax=stretto(o.x+pt[0],1.5,C.W-1.5);ay=o.y+pt[1]*ver}
   const libero=o.t==='carica',db=b?u.bd=d2(u,b):1e9;
   if(b&&u.git&&db<=u.git&&db>3){// tiratore a tiro: fermo e scocca (chi tiene la posizione non la lascia)
    if(!libero){const da=rad((ax-u.x)*(ax-u.x)+(ay-u.y)*(ay-u.y));if(da>1.2){muovi(s,u,ax,ay);continue}}
    if(u.cd<=0)tiro(s,u,b,db);continue}
   const ingaggio=libero?1e9:(u.git?3:5.5);
   if(b&&db<=C.MISCHIA+(u.c==='c'?.4:0)){if(u.cd<=0)mischia(s,u,b);continue}
   if(b&&(libero||db<=ingaggio||rad((b.x-ax)*(b.x-ax)+(b.y-ay)*(b.y-ay))<=ingaggio)){if(u.git&&libero&&db>u.git){muovi(s,u,b.x,b.y)}else if(u.git&&libero){if(u.cd<=0)tiro(s,u,b,db)}else{const st=muovi(s,u,b.x,b.y);if(u.c==='c')u.ca=Math.min(1,u.ca+st*.12)}continue}
   const st=muovi(s,u,ax,ay);if(u.c==='c')u.ca=st>.2?Math.min(1,u.ca+st*.06):0;if(st<.02&&b){const dx=b.x-u.x,dy=b.y-u.y,d=rad(dx*dx+dy*dy)||1;u.fx=dx/d;u.fy=dy/d}}
  // non ci si sovrappone
  for(let i=0;i<vv.length;i++){const a=vv[i];if(a.st!=='vivo')continue;for(let j=i+1;j<vv.length;j++){const b=vv[j];if(b.st!=='vivo')continue;const dx=b.x-a.x,dy=b.y-a.y;if(dx>1.3||dx<-1.3||dy>1.3||dy<-1.3)continue;
    const r0=(a.c==='c'||b.c==='c'||a.cav||b.cav)?1.25:.95,q=dx*dx+dy*dy;if(q>=r0*r0)continue;const d=rad(q)||.01,k=(r0-d)*.5*(a.l===b.l?.5:.35),ox=d<.02?.1:dx/d,oy=d<.02?.07:dy/d;
    a.x-=ox*k;a.y-=oy*k;b.x+=ox*k;b.y+=oy*k}}
  if(s.tipo==='arena')for(const u of vv){const dx=u.x-C.W/2,dy=u.y-C.H/2,d=rad(dx*dx+dy*dy);if(d>C.ARENA){u.x=C.W/2+dx/d*C.ARENA;u.y=C.H/2+dy/d*C.ARENA}}
  if(s.muro)for(const u of vv){const m=s.muro;if(Math.abs(u.y-m)<.5&&!s.varchi.some(g=>u.x>g[0]&&u.x<g[1]))u.y=u.py<m?m-.5:m+.5;u.x=stretto(u.x,.5,C.W-.5);u.y=stretto(u.y,.5,C.H-.5)}
  // rinforzi, rotta, fine
  if(s.t%10===0){for(const l of['a','b']){const n=vivi(s,l).length,ris=riserva(s,l);
    if(ris>0&&n<C.MAX*.62){let k=Math.min(C.ONDATA,ris,C.MAX-n),q=0;const y=l==='a'?C.H-2:2;while(k>0&&s.ris[l].length){const x=s.ris[l][0];unita(s,l,x,8+s.r()*(C.W-16),y+(l==='a'?-1:1)*s.r()*3);x.n--;if(x.n<=0)s.ris[l].shift();k--;q++}if(q)s.ev.push({t:'rinforzi',l,n:q})}
    const val=s.u.reduce((a,u)=>a+(u.l===l&&u.st==='vivo'&&!u.cap?D.valore(u.t):0),0)+s.ris[l].reduce((a,x)=>a+x.n*D.valore(x.t),0),fr=val/Math.max(1,s.v0[l]);
    const soglia=C.ROTTA+(55-s.mor[l])*.004;
    if(fr<soglia&&!(l==='b'&&s.muro)&&s.tipo!=='arena'){for(const u of s.u)if(u.l===l&&u.st==='vivo'&&!u.cap){u.st='fuga'}s.ris[l]=[];s.ev.push({t:'rotta',l});if(l==='a'&&s.autoA)chiudi(s,'b')}}
   const na=vivi(s,'a').length+riserva(s,'a'),nb=vivi(s,'b').length+riserva(s,'b');const soloCap=vivi(s,'a').every(u=>u.cap);
   if(nb===0)chiudi(s,'a');else if(na===0||(soloCap&&riserva(s,'a')===0&&nb>3&&s.tipo!=='arena'))chiudi(s,'b');
   else if(s.t>=C.TMAX){const va=s.u.reduce((a,u)=>a+(u.l==='a'&&u.st==='vivo'?1:0),0)/Math.max(1,s.n0.a),vb=s.u.reduce((a,u)=>a+(u.l==='b'&&u.st==='vivo'?1:0),0)/Math.max(1,s.n0.b);chiudi(s,s.tipo==='arena'?(pfRes(s,'a')>=pfRes(s,'b')?'a':'b'):va>=vb&&!s.muro?'a':'b')}}}
 // in arena, a tempo scaduto vince chi ha più vita rimasta in proporzione
 const pfRes=(s,l)=>{let a=0,b=0;for(const u of s.u)if(u.l===l){a+=u.st==='ko'?0:u.pf;b+=u.pfm}return a/Math.max(1,b)};
 function chiudi(s,l){if(s.fine)return;s.fine={vince:l,t:s.t};s.ev.push({t:'fine',vince:l})}
 function passo(s,n){s.ev=[];if(!s.r)s.r=ADADI.gen(s);for(let k=0;k<(n||1)&&!s.fine;k++)istante(s);return s.ev}
 function riepilogo(s){const cad=Object.keys(s.cad).map(k=>{const i=k.indexOf('|');return{p:+k.slice(0,i),t:k.slice(i+1),n:s.cad[k]}});let ua=0,ub=0;
  for(const c of cad){const mio=c.p===0||s.u.some(u=>u.p===c.p&&u.l==='a');if(mio)ub+=c.n*D.valore(c.t);else ua+=c.n*D.valore(c.t)}
  return{vince:s.fine?s.fine.vince:'b',cad,capKo:s.capKo,ko:(s.ko||[]).slice(),uccisi:{a:Math.round(ua),b:Math.round(ub)},durata:s.t,fuggiti:s.fug}}
 function risolvi(scheda){const s=nuovo(scheda,{autoA:true});while(!s.fine)passo(s,50);return riepilogo(s)}
 // quanti ne restano per gruppo (per i bottoni della vista)
 function gruppi(s,l){const g={f:0,t:0,c:0};for(const u of s.u)if(u.l===(l||'a')&&u.st==='vivo'&&!u.cap)g[u.c]++;return g}
 return{C,nuovo,passo,ordina,capitano,riepilogo,risolvi,gruppi,vivi,riserva,capU}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VCAM;
