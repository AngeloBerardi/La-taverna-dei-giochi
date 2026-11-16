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
 const C={W:60,H:100,ARENA:17,MAX:34,ONDATA:10,PASSO:.03,MISCHIA:1.5,RITMO:12,RITMO_T:24,VOLO:.55,ROTTA:.22,TMAX:7000,DANNO:.5,GRIDO:320,GRIDO_DUR:90,MURO:34,
  // terreno (V5): effetti delle zone; ALTO = unità di scena per quota 1 (lo legge solo la vista)
  TER:{GIT:.25,MISCHIA:.10,DISL:.25,SALITA:.4,COPRE:.5,ACQUA:.5,BOSCO_CAV:.78,ALTO:3.2},
  // assedio a fasi (V5b): SCALA = istanti per salire, FIATO = istanti in cima prima di poter colpire, PORTA = punti del portone, SPINTA = punti tolti a ogni colpo d'ariete,
  // SPINGONO = quanti fanti spingono insieme, SALE_P = bonus ai tiri contro chi sale, MURO_Q = quota del camminamento
  AS:{SCALA:40,FIATO:100,PORTA:60,SPINTA:1,SPINGONO:6,SALE_P:.1,MURO_Q:1},
  // formazioni (V5): p = passo tra i posti (i cavalieri + CAV), ATTESA = istanti prima di poter cambiare di nuovo
  FM:{serrata:{p:1.2,vel:.8,dif:1.2,scudo:.5,nudo:1.15,carica:.5},larga:{p:2.6,danT:.5,carica:1.5},cuneo:{p:1.7,att:1.15,carica:1.25,fianco:.75},CAV:.7,ATTESA:30,RIMBALZO:.8}};
 const rad=Math.sqrt,d2=(a,b)=>rad((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
 const stretto=(v,a,b)=>v<a?a:v>b?b:v;
 const GR=['f','t','c'],FORME=['larga','serrata','cuneo'],ASTA={picca:1,alabarda:1,lancia:1};
 // ---------- terreno: zone ellittiche (altura, bosco, case, acqua). Una sola funzione per il motore e per la vista ----------
 const ZONE=s=>s.zone||[];
 const ell=(z,x,y)=>{const a=(x-z.x)/z.rx,b=(y-z.y)/z.ry;return a*a+b*b};
 function acqua(s,x,y){for(const z of ZONE(s))if(z.k==='acqua'&&ell(z,x,y)<1)return true;return false}
 // quota: 0 in piano, fino a `h` sul centro di un'altura, un poco sotto nell'acqua
 // in assedio il camminamento (da `muro-4` al muro) sta a MURO_Q: chi difende tira e colpisce dall'alto
 function quota(s,x,y){if(s.muro&&y>=s.muro-4&&y<=s.muro)return C.AS.MURO_Q;let q=0;for(const z of ZONE(s))if(z.k==='altura'){const e=ell(z,x,y);if(e<1){const v=(z.h||1)*(1-e)*(1-e);if(v>q)q=v}}return q>0?q:acqua(s,x,y)?-.12:0}
 function copre(s,x,y){for(const z of ZONE(s))if((z.k==='bosco'||z.k==='case')&&ell(z,x,y)<1)return z.k;return null}
 const piuAlto=(s,u,b)=>(ZONE(s).length>0||s.muro>0)&&quota(s,u.x,u.y)-quota(s,b.x,b.y)>C.TER.DISL;
 const gittata=(s,u,b)=>piuAlto(s,u,b)?u.git*(1+C.TER.GIT):u.git;
 // la formazione di un'unità: capitani e arena non ne hanno; negli stati vecchi senza `fm` vale `larga`
 const forma=(s,u)=>{if(u.cap||s.tipo==='arena')return null;const q=s.ord[u.l][u.c];return q&&q.fm||'larga'};
 const passoFm=(fm,c)=>C.FM[fm].p+(c==='c'?C.FM.CAV:0);
 // zone di una battaglia: date dalla scheda (test, riproducibilità) oppure estratte dal seme, prima delle unità
 function zoneNuove(s,scheda){if(Array.isArray(scheda.zone))return scheda.zone.map(z=>Object.assign({},z));if(s.tipo==='arena'||s.tipo==='assedio')return[];
  const r=s.r,Z=[],sc=scheda.scena||{},t=s.terreno,al=(a,b)=>Math.round((a+r()*(b-a))*10)/10;
  const metti=z=>{if(!Z.some(q=>rad((q.x-z.x)*(q.x-z.x)+(q.y-z.y)*(q.y-z.y))<10))Z.push(z)};
  const altura=()=>({k:'altura',x:al(12,48),y:al(36,64),rx:al(9,14),ry:al(7,10),h:al(.6,1)});
  if(t===3||sc.pend){metti(altura());metti(altura())}
  else if(t===2){const n=2+Math.floor(r()*2);for(let i=0;i<n;i++)metti({k:'bosco',x:al(8,52),y:al(24,76),rx:al(7,12),ry:al(6,10)});if(r()<.3)metti(altura())}
  else if(t===1){if(r()<.6)metti(altura());if(r()<.4)metti({k:'bosco',x:al(8,52),y:al(24,76),rx:al(5,7),ry:al(4,6)})}
  const v=sc.vicino;if(v&&(v.tipo==='villaggio'||v.tipo==='porto'||v.tipo==='locanda'||v.tipo==='monastero'))metti({k:'case',x:r()<.5?12:48,y:al(16,22),rx:7,ry:5});
  if(sc.costa)metti({k:'acqua',x:sc.costa==='e'?C.W:0,y:C.H/2,rx:7,ry:70});
  if(t===1&&s.bioma!==1&&!Z.some(q=>q.k==='altura')&&r()<1/6)metti({k:'acqua',x:30,y:50,rx:45,ry:3});
  return Z}
 function unita(s,l,riga,x,y){const T=D.TR[riga.t],u={id:s.uid++,l,p:riga.p,t:riga.t,c:T.c,x,y,px:x,py:y,pf:T.pf,pfm:T.pf,att:T.att,dif:T.dif,dan:T.dan,git:s.meteo==='nebbia'?Math.round(T.git*.7):T.git,vel:T.vel,cd:Math.floor(s.r()*10),b:-1,st:'vivo',
   fx:0,fy:l==='a'?-1:1,ca:0,liv:T.t,col:0,buff:0,sal:0,scI:-1};if(riga.st){Object.assign(u,riga.st);u.pfm=u.pf}s.u.push(u);return u}
 // posti di una schiera attorno a un'ancora: righe larghe, i più forti davanti
 // con `cuneo` la riga r ha 1+2r posti: la punta (riga 0) guarda il nemico
 function posto(k,n,passo,larg,fm){if(fm==='cuneo'){const riga=Math.floor(rad(k)),col=k-riga*riga,inRiga=Math.min(1+2*riga,n-riga*riga);return[(col-(inRiga-1)/2)*passo,riga*passo]}
  const perRiga=Math.max(4,Math.min(larg,Math.ceil(rad(n*2.6)))),riga=Math.floor(k/perRiga),col=k%perRiga,inRiga=Math.min(perRiga,n-riga*perRiga);
  return[(col-(inRiga-1)/2)*passo,riga*passo]}
 function nuovo(scheda,o){o=o||{};const s={v:1,t:0,rng:ADADI.semina(scheda.seme||1),seme0:scheda.seme||1,scena:scheda.scena||null,ora:scheda.ora==null?-1:scheda.ora,meteo:(scheda.scena&&scheda.scena.meteo)||'sereno',W:C.W,H:C.H,tipo:scheda.tipo||'campo',terreno:scheda.terreno||1,bioma:scheda.bioma||0,notte:!!scheda.notte,u:[],uid:1,zone:[],
   ris:{a:[],b:[]},ord:{a:{},b:{}},voli:[],ev:[],fine:null,cad:{},fug:{a:0,b:0},n0:{a:0,b:0},v0:{a:0,b:0},autoA:!!o.autoA,cap:-1,capi:[],ko:[],capKo:false,grido:0,gridi:[],
   faza:scheda.faza,fazb:scheda.fazb,cola:scheda.cola,colb:scheda.colb,noma:scheda.noma,nomb:scheda.nomb,ia:{a:{f:0},b:{f:0}},muro:scheda.tipo==='assedio'?C.MURO:0,varchi:[],scale:[],scalaT:[],porta:null};
  if(s.muro){// fasi dell'assedio: senza `assedio` nella scheda la breccia è aperta e non c'è l'ariete (come prima delle fasi)
   const as=scheda.assedio||{breccia:true,ariete:false};s.scale=[9,21,39,51];s.scalaT=[0,0,0,0];s.porta={x0:28,x1:32,pf:C.AS.PORTA,ariete:!!as.ariete};s.varchi=as.breccia?[[41,46]]:[]}
  s.r=ADADI.gen(s);s.zone=zoneNuove(s,scheda);
  for(const l of['a','b']){const righe=(scheda[l]||[]).map(x=>({p:x.p,t:x.t,n:x.n,st:x.st})).sort((x,y)=>D.TR[y.t].t-D.TR[x.t].t);
   for(const x of righe){s.n0[l]+=x.n;s.v0[l]+=x.n*D.valore(x.t)}
   // in campo i migliori, in proporzione ai gruppi; il resto in riserva
   const capi=l==='a'?(scheda.capi||(scheda.cap?[scheda.cap]:[])):[];let liberi=C.MAX-capi.length;const tot=s.n0[l],campo=[];
   for(const x of righe){const q=tot<=liberi?x.n:Math.max(x.n?1:0,Math.round(x.n*liberi/tot));const k=Math.min(q,x.n);if(k>0)campo.push({p:x.p,t:x.t,n:k,st:x.st});if(x.n-k>0)s.ris[l].push({p:x.p,t:x.t,n:x.n-k,st:x.st})}
   const arena=s.tipo==='arena',ya=arena?(l==='a'?C.H/2+4:C.H/2-6):l==='a'?C.H-20:(s.muro?s.muro-7:20),ver=l==='a'?1:-1;
   s.ord[l]={f:{t:'tieni',x:C.W/2,y:ya,fm:'serrata',fmT:0},t:{t:'tieni',x:C.W/2,y:ya+ver*7,fm:'larga',fmT:0},c:{t:'tieni',x:C.W/2+(l==='a'?17:-17),y:ya+ver*2,fm:'larga',fmT:0}};
   if(s.muro&&l==='b'){Object.assign(s.ord.b.t,{x:C.W/2,y:s.muro-2.5});Object.assign(s.ord.b.c,{x:C.W/2,y:s.muro-12})}
   const perG={f:[],t:[],c:[]};for(const x of campo)for(let k=0;k<x.n;k++)perG[D.TR[x.t].c].push(x);
   for(const g of GR){const L=perG[g],o2=s.ord[l][g];L.forEach((x,k)=>{const pt=posto(k,L.length,arena?4:passoFm(o2.fm,g),s.muro&&l==="b"&&g==="t"?26:10,o2.fm);unita(s,l,x,stretto(o2.x+pt[0],2,C.W-2),o2.y+ver*pt[1])})}
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
  if(o.t==='forma')return formazione(s,o,l,gs);
  for(const g of gs){const q=s.ord[l][g];if(!q)return{err:'Gruppo sconosciuto'};
   if(o.t==='carica'||o.t==='segui'){q.t=o.t;q.seg=o.t==='segui'&&cap?cap.seat:null}
   else if(o.t==='tieni'){q.t='tieni';const U=s.u.filter(u=>u.l===l&&u.c===g&&u.st==='vivo');if(o.x!=null){q.x=o.x;q.y=o.y}else if(U.length){q.x=U.reduce((a,u)=>a+u.x,0)/U.length;q.y=U.reduce((a,u)=>a+u.y,0)/U.length}}
   else if(o.t==='avanza'||o.t==='arretra'){if(q.t==='segui'&&cap){q.x=cap.x;q.y=cap.y}q.t='tieni';q.y=stretto(q.y+(l==='a'?-1:1)*(o.t==='avanza'?12:-12),4,C.H-4)}
   else return{err:'Ordine sconosciuto'}}
  s.ev.push({t:'ordine',l,g:o.g||'tutti',o:o.t});return{s}}
 // formazione di un gruppo (V5): senza `f` gira larga → serrata → cuneo → larga (i tiratori saltano il cuneo); dopo il cambio si aspetta ATTESA istanti
 function formazione(s,o,l,gs){const solo=gs.length===1;if(o.f!=null&&!FORME.includes(o.f))return{err:'Formazione sconosciuta'};
  for(const g of gs)if(!s.ord[l][g])return{err:'Gruppo sconosciuto'};
  if(solo&&gs[0]==='t'&&o.f==='cuneo')return{err:'I tiratori non fanno il cuneo'};
  const fatti=[];let attesa=0;
  for(const g of gs){const q=s.ord[l][g];if(g==='t'&&o.f==='cuneo')continue;if(s.t<(q.fmT||0)){attesa++;continue}
   let n=o.f;if(n==null){const cur=q.fm||'larga';n=cur==='larga'?'serrata':cur==='serrata'?'cuneo':'larga';if(g==='t'&&n==='cuneo')n='larga'}fatti.push([q,n])}
  if(!fatti.length)return{err:'Il gruppo si sta ancora schierando'};
  for(const[q,n]of fatti){q.fm=n;q.fmT=s.t+C.FM.ATTESA}
  s.ev.push({t:'ordine',l,g:o.g||'tutti',o:'forma',f:solo?fatti[0][1]:(o.f||null)});return{s}}
 function capitano(s,o){const seat=o.seat||0,u=capU(s,seat);if(s.fine)return{err:'La battaglia è finita'};if(!u||u.st!=='vivo')return{err:'Il capitano è a terra'};
  if(o.grido){if(s.tipo==='arena')return{err:'In lizza non si grida'};if(s.t<(s.gridi[seat]||0))return{err:'Non hai ancora fiato'};s.gridi[seat]=s.t+Math.round(C.GRIDO*(u.gf||1));s.grido=s.gridi[0];for(const q of s.u)if(q.l==='a'&&d2(q,u)<16){q.buff=s.t+C.GRIDO_DUR;if(q.st==='fuga'){q.st='vivo'}}s.mor.a=Math.min(100,s.mor.a+12);s.ev.push({t:'grido',x:u.x,y:u.y});return{s}}
  if(o.b!=null){const b=s.u.find(q=>q.id===o.b&&q.l==='b'&&q.st==='vivo');if(!b)return{err:'Bersaglio non valido'};u.ob=b.id;u.vx=null;return{s}}
  if(o.x!=null){u.vx=stretto(o.x,1,C.W-1);u.vy=stretto(o.y,1,C.H-1);u.ob=-1;return{s}}
  return{err:'Ordine sconosciuto'}}
 // ---------- movimento ----------
 // assedio: chi attacca sale con le scale (lente, sotto tiro); i cavalieri passano solo dai varchi; il capitano a cavallo sale a piedi
 const cavaliere=u=>u.c==='c'||(u.cav&&!u.cap);
 const puoSalire=u=>u.l==='a'&&!cavaliere(u);
 // il muro separa due unità se stanno ai due lati e tra loro non c'è un varco aperto: niente mischia attraverso le pietre
 const muroTra=(s,u,b)=>{if(!s.muro||(u.y<s.muro)===(b.y<s.muro))return false;const mx=(u.x+b.x)/2;return!s.varchi.some(g=>mx>g[0]&&mx<g[1])};
 function versoVarco(s,u,tx,ty){if(!s.muro)return[tx,ty];const m=s.muro,sopra=u.y<m,tsopra=ty<m;if(sopra===tsopra)return[tx,ty];
  let best=null,bd=1e9,sc=-1;for(const v of s.varchi){const cx=(v[0]+v[1])/2,d=Math.abs(u.x-cx)+Math.abs(tx-cx)*.5;if(d<bd){bd=d;best=v}}
  const SC=s.scale||[];if(!sopra&&puoSalire(u))for(let i=0;i<SC.length;i++){const sx=SC[i],d=Math.abs(u.x-sx)+Math.abs(tx-sx)*.5+4;if(d<bd){bd=d;best=null;sc=i}}
  if(sc>=0)return[SC[sc],m+.6];
  if(!best)return!sopra&&cavaliere(u)?[u.x,m+12]:[u.x,u.y];// nessun passaggio: i cavalieri aspettano a distanza, gli altri restano
  const cx=stretto(u.x,best[0]+.7,best[1]-.7);if(u.x>best[0]+.5&&u.x<best[1]-.5)return[cx,ty];return[(best[0]+best[1])/2,m+(sopra?-1.6:1.6)]}
 function muovi(s,u,tx,ty,k){const w=versoVarco(s,u,tx,ty);tx=w[0];ty=w[1];const dx=tx-u.x,dy=ty-u.y,d=rad(dx*dx+dy*dy);if(d<.05)return 0;
  let v=u.vel*C.PASSO*(k||1);if(s.bioma===1)v*=.92;if(u.buff>s.t)v*=1.12;if(forma(s,u)==='serrata')v*=C.FM.serrata.vel;
  const zz=ZONE(s).length>0;if(zz){if(acqua(s,u.x,u.y))v*=C.TER.ACQUA;if((u.c==='c'||u.cav)&&copre(s,u.x,u.y))v*=C.TER.BOSCO_CAV}
  let st=Math.min(d,v),nx=u.x+dx/d*st,ny=u.y+dy/d*st;
  if(zz){const qn=quota(s,nx,ny);if(qn>0&&qn>quota(s,u.x,u.y)){st=Math.min(d,v*C.TER.SALITA);nx=u.x+dx/d*st;ny=u.y+dy/d*st}}// salire rallenta
  if(s.muro){const m=s.muro,dentro=s.varchi.some(g=>nx>g[0]+.4&&nx<g[1]-.4);if(!dentro&&(u.y-m)*(ny-m)<=0)ny=u.y<m?m-.5:m+.5;
   if(Math.abs(ny-m)<.5&&!dentro)ny=u.y<m?m-.5:m+.5}
  u.x=stretto(nx,.5,C.W-.5);u.y=stretto(ny,.5,C.H-.5);u.fx=dx/d;u.fy=dy/d;return st}
 // ---------- colpi ----------
 function ferisci(s,b,dan,da){if(b.st==='ko')return;b.pf-=dan;b.col=s.t;
  if(b.pf<=0){b.pf=0;b.st='ko';b.kt=s.t;if(b.sal>s.t){if(b.scI>=0)s.scalaT[b.scI]=0;b.sal=0}// cade mentre sale: la scala si libera
const k=b.p+'|'+b.t;if(!b.cap)s.cad[k]=(s.cad[k]||0)+1;else if(b.l==='a'){s.ko[b.seat||0]=true;s.capKo=s.ko.every(x=>x)}
   s.mor[b.l]-=(b.cap?18:60/Math.max(8,s.n0[b.l]));const o=b.l==='a'?'b':'a';s.mor[o]=Math.min(100,s.mor[o]+20/Math.max(8,s.n0[o]));
   s.ev.push({t:'ko',id:b.id,da:da?da.id:-1,cap:!!b.cap,seat:b.seat});if(b.cap&&b.l==='a'){s.ev.push({t:'cap-ko',seat:b.seat||0,tutti:s.capKo});if(s.capKo)for(const g of GR)if(s.ord.a[g].t==='segui')s.ord.a[g].t='carica'}}}
 function armatura(dan,dif){return Math.max(1,dan*(1-dif/(dif+34)))}
 function mischia(s,u,b){if(muroTra(s,u,b))return;const r=s.r,fa=forma(s,u),fb=forma(s,b),dx=b.x-u.x,dy=b.y-u.y,d=rad(dx*dx+dy*dy)||1;u.fx=dx/d;u.fy=dy/d;
  // niente carica da bosco, case o acqua, né contro chi sta in bosco o case
  if(u.ca>0&&ZONE(s).length&&(copre(s,u.x,u.y)||acqua(s,u.x,u.y)||copre(s,b.x,b.y)))u.ca=0;
  if(u.cap&&u.cav&&s.muro&&u.y<s.muro)u.ca=0;// il capitano a cavallo salito sulle mura non carica
  // fanti serrati con l'asta: la carica si spezza sulle punte e chi carica si fa male prima del suo colpo
  if(fb==='serrata'&&u.ca>0&&b.c==='f'&&ASTA[D.aspetto(b.t).arma]){if(u.ca>.6){const rb=Math.max(1,Math.round(armatura(b.dan*C.FM.RIMBALZO,u.dif)*C.DANNO));s.ev.push({t:'colpo',da:b.id,a:u.id,dan:rb});ferisci(s,u,rb,b)}u.ca=0;if(u.st==='ko')return}
  const fianco=fb==='cuneo'&&u.fx*b.fx+u.fy*b.fy>-.3,dif=b.dif*(fb==='serrata'?C.FM.serrata.dif:1)*(fianco?C.FM.cuneo.fianco:1);
  const att=u.att*(u.buff>s.t?1.2:1)*(u.c==='t'?.7:1)*(piuAlto(s,u,b)?1+C.TER.MISCHIA:1)*(fa==='cuneo'?C.FM.cuneo.att:1),p=stretto(.5+(att-dif)/40,.15,.93);u.cd=(u.rit||(u.c==='c'||u.cav?C.RITMO+2:C.RITMO))+Math.floor(r()*3);
  if(r()>p){s.ev.push({t:'colpo',da:u.id,a:b.id,dan:0});u.ca=0;return}
  let ca=u.ca;if(fa==='cuneo')ca*=C.FM.cuneo.carica;if(fb==='serrata'||fb==='larga')ca*=C.FM[fb].carica;
  let dan=u.dan*(.7+r()*.6)*(1+ca*(.9+(u.car||0)));const crit=r()<.08+(u.cap?.08:0);if(crit)dan*=1.8;dan=Math.max(1,Math.round(armatura(dan,dif*(1-(u.perf||0)))*C.DANNO));
  if(ca>.6){b.cd=Math.max(b.cd,8);b.x=stretto(b.x+u.fx*.9,.5,C.W-.5);b.y=stretto(b.y+u.fy*.9,.5,C.H-.5)}
  s.ev.push({t:'colpo',da:u.id,a:b.id,dan,crit,carica:ca>.6});u.ca=0;ferisci(s,b,dan,u)}
 function tiro(s,u,b,d){const r=s.r;u.cd=(u.cap&&u.rit?u.rit:C.RITMO_T)+Math.floor(r()*6);const dx=b.x-u.x,dy=b.y-u.y;u.fx=dx/(d||1);u.fy=dy/(d||1);
  const fb=forma(s,b),dif=b.dif*(fb==='cuneo'&&u.fx*b.fx+u.fy*b.fy>-.3?C.FM.cuneo.fianco:1);
  let p=.42+(u.att-dif*.5)/40-d/gittata(s,u,b)*.22;if(s.notte)p-=.1;if(s.meteo==='pioggia')p-=.1;if(s.muro&&b.y<s.muro&&u.y>s.muro)p-=.2;if(b.sal>s.t)p+=C.AS.SALE_P;if(b.c==='c'||b.cav)p-=.06;p=stretto(p,.08,.9);
  if(ZONE(s).length&&copre(s,b.x,b.y))p*=C.TER.COPRE;// chi sta tra gli alberi o le case è più difficile da colpire
  if(fb==='serrata')p*=D.aspetto(b.t).scudo?C.FM.serrata.scudo:C.FM.serrata.nudo;
  const colpito=r()<p,vt=Math.max(2,Math.round(d*C.VOLO)),dan=colpito?Math.max(1,Math.round(armatura(u.dan*(.75+r()*.5),dif*.8*(1-(u.perf||0)))*C.DANNO*(fb==='larga'?C.FM.larga.danT:1))):0;
  s.voli.push({at:s.t+vt,a:b.id,dan,da:u.id});s.ev.push({t:'tiro',da:u.id,a:b.id,x0:u.x,y0:u.y,x1:b.x,y1:b.y,vt,colpito})}
 // ---------- il comandante avversario (e il tuo, nella risoluzione automatica) ----------
 // mura intere: i fanti di chi difende si dividono tra le scale (e la porta, se c'è l'ariete) sul camminamento
 const guardie=s=>{const g=(s.scale||[]).slice();if(s.porta&&s.porta.ariete)g.push((s.porta.x0+s.porta.x1)/2);return g.length?g:[C.W/2]};
 // ogni fante di chi difende va a un passaggio: uno a testa, il resto dove gli assalitori premono di più (vicino al piede o già sopra)
 function presidi(s,ne,n){const G2=guardie(s),m=s.muro,w=G2.map(x=>{let k=0;for(const u of ne)if(Math.abs(u.x-x)<6&&u.y>m-4&&u.y<m+10)k++;return k});const out=[];
  const quota0=G2.map(()=>n>=G2.length?1:0);let resto=n-quota0.reduce((a,b)=>a+b,0);const tot=w.reduce((a,b)=>a+b,0);
  if(resto>0){const q=G2.map((_,i)=>tot?resto*w[i]/tot:resto/G2.length),f=q.map(Math.floor);let r=resto-f.reduce((a,b)=>a+b,0);const ord=q.map((v,i)=>[v-f[i],i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]);for(let j=0;j<r;j++)f[ord[j][1]]++;for(let i=0;i<G2.length;i++)quota0[i]+=f[i]}
  for(let i=0;i<G2.length;i++)for(let k=0;k<quota0[i];k++)out.push(G2[i]);return out}
 function comanda(s,l){const o=s.ord[l],ia=s.ia[l],me=vivi(s,l),ne=vivi(s,l==='a'?'b':'a');if(!me.length||!ne.length)return;
  const my=me.reduce((a,u)=>a+u.y,0)/me.length,ny=ne.reduce((a,u)=>a+u.y,0)/ne.length,dist=Math.abs(my-ny),ver=l==='a'?-1:1;
  const mt=me.filter(u=>u.c==='t').length,nt=ne.filter(u=>u.c==='t').length;
  if(s.tipo==='arena'){for(const g of GR)o[g].t='carica';return}
  if(s.muro){if(l==='b'){o.f.t='tieni';o.f.x=C.W/2;o.f.y=s.muro-6;o.f.guard=!s.varchi.length;if(o.f.guard){o.f.gx=presidi(s,ne,me.filter(u=>u.c==='f').length);if(ne.some(u=>u.y<s.muro-4))o.f.t='carica'}else if(ne.some(u=>u.y<s.muro+1)){o.f.t='carica';o.c.t='carica'}return}for(const g of GR)o[g].t='carica';if(s.t<60){o.t.t='tieni';o.t.y=s.muro+18;o.t.x=C.W/2}
   // con l'ariete e senza breccia i fanti vanno alla porta; altrimenti al passaggio più vicino (lo sceglie `versoVarco`)
   if(s.porta&&s.porta.ariete&&s.porta.pf>0&&!s.varchi.length){o.f.t='tieni';o.f.x=(s.porta.x0+s.porta.x1)/2;o.f.y=s.muro+1.4}return}
  if(ia.f===0){// avvicinamento: i tiratori si fermano a tiro, i fanti avanzano fino al contatto, i cavalieri aspettano sul fianco
   const aspetta=mt>nt+2&&s.t<420&&(l==='b'?s.fazb!=='pre':true);
   if(ia.m!==0){ia.m=0;o.f.fm='serrata';o.t.fm='larga';o.c.fm='larga'}// le formazioni si scelgono una volta per fase, senza attesa
   if(!aspetta){
    // un'altura vicina, nella propria metà campo: i tiratori la prendono e i fanti le stanno davanti
    let alt=null,ad=24;for(const z of ZONE(s))if(z.k==='altura'&&(l==='b'?z.y<=C.H/2:z.y>=C.H/2)){const dz=rad((z.x-o.f.x)*(z.x-o.f.x)+(z.y-o.f.y)*(z.y-o.f.y));if(dz<ad){ad=dz;alt=z}}
    o.f.t='tieni';o.t.t='tieni';o.c.t='tieni';
    if(alt){o.t.x=alt.x;o.t.y=alt.y;o.f.x=alt.x;o.f.y=alt.y+ver*5}
    else{o.f.y=stretto(o.f.y+ver*3.2,6,C.H-6);o.t.y=o.f.y-ver*6;o.t.x=o.f.x}
    // i cavalieri a 14 passi di lato, dalla parte senza acqua
    o.c.y=o.f.y-ver*3;let sg=o.c.x>=o.f.x?1:-1;if(acqua(s,o.f.x+sg*14,o.c.y)&&!acqua(s,o.f.x-sg*14,o.c.y))sg=-sg;o.c.x=stretto(o.f.x+sg*14,3,C.W-3);
    for(const g of GR)if(acqua(s,o[g].x,o[g].y))o[g].y=stretto(o[g].y-ver*6,3,C.H-3)}// un'ancora in acqua arretra
   if(dist<26||s.t>900){ia.f=1}}
  else{if(ia.m!==1){ia.m=1;o.c.fm='cuneo';if(nt>ne.filter(u=>u.c==='c').length&&!ne.some(u=>u.c==='c'))o.f.fm='larga'}
   o.f.t='carica';o.c.t='carica';if(dist<9||s.t>ia.t0+200)o.t.t='carica';if(!ia.t0)ia.t0=s.t}}
 // ---------- un istante ----------
 function istante(s){s.t++;const U=s.u;
  // frecce in arrivo
  if(s.voli.length){const resto=[];for(const v of s.voli){if(v.at>s.t){resto.push(v);continue}const b=U.find(u=>u.id===v.a);if(b&&b.st!=='ko'&&v.dan>0){s.ev.push({t:'colpo',da:v.da,a:b.id,dan:v.dan,freccia:true});ferisci(s,b,v.dan,U.find(u=>u.id===v.da))}}s.voli=resto}
  if(s.t%20===1){comanda(s,'b');if(s.autoA)comanda(s,'a')}
  const cap0=capU(s),vv=U.filter(u=>u.st==='vivo');
  let spingono=0;const conta={a:{f:0,t:0,c:0},b:{f:0,t:0,c:0}},idx={};for(const u of vv)if(!u.cap){idx[u.id]=conta[u.l][u.c]++}
  for(const u of U){if(u.st==='ko')continue;u.px=u.x;u.py=u.y;if(u.cd>0)u.cd--;
   if(u.st==='fuga'){const ty=u.l==='a'?C.H+2:-2;const dy=ty-u.y;u.y+=(dy>0?1:-1)*u.vel*C.PASSO*1.15;u.fy=dy>0?1:-1;u.fx=0;if(u.y<=.2||u.y>=C.H-.2){u.st='via';s.fug[u.l]++}continue}
   if(u.st!=='vivo')continue;
   if(u.sal){if(u.sal>s.t)continue;u.y=s.muro-.6;u.sal=0;u.scI=-1;u.cd=Math.max(u.cd,C.AS.FIATO)}// in cima alla scala: scende sul camminamento
   // bersaglio: ogni mezzo secondo si guarda intorno
   const nem=u.l==='a'?'b':'a',o=u.cap?null:s.ord[u.l][u.c];let b=u.b>=0?U.find(q=>q.id===u.b&&q.st==='vivo'):null;
   if(!b||(s.t+u.id)%5===0){let m=null,md=1e9;for(const q of vv){if(q.l!==nem)continue;const d=d2(u,q)+(s.muro&&(q.y<s.muro)!==(u.y<s.muro)&&!u.git?6:0);if(d<md){md=d;m=q}}b=m;u.b=m?m.id:-1;u.bd=md}
   if(s.muro&&u.l==='a'&&u.y>s.muro){
    // al piede di una scala libera, chi può sale (lento: non si muove né colpisce finché sale)
    if(puoSalire(u)&&u.y>=s.muro+.4&&u.y<=s.muro+1&&b&&b.y<s.muro){const SC=s.scale||[];for(let i=0;i<SC.length;i++)if(Math.abs(u.x-SC[i])<.8&&s.scalaT[i]<=s.t){u.sal=s.t+C.AS.SCALA;u.scI=i;s.scalaT[i]=u.sal;s.ev.push({t:'scala',id:u.id,i});break}if(u.sal>s.t)continue}
    // il portone: fino a SPINGONO fanti davanti alla porta, senza nemico in mischia, la spingono con l'ariete a ogni loro ritmo
    const P0=s.porta;if(P0&&P0.ariete&&P0.pf>0&&!u.cap&&u.c==='f'&&spingono<C.AS.SPINGONO&&Math.abs(u.x-(P0.x0+P0.x1)/2)<2.4&&u.y>=s.muro+.4&&u.y<=s.muro+2.4&&!(b&&d2(u,b)<=C.MISCHIA+.3&&!muroTra(s,u,b))){
     spingono++;if(u.cd<=0){u.cd=(u.rit||C.RITMO)+Math.floor(s.r()*3);P0.pf-=C.AS.SPINTA;s.ev.push({t:'ariete',id:u.id,pf:Math.max(0,P0.pf)});
      if(P0.pf<=0){P0.pf=0;s.varchi.push([P0.x0,P0.x1]);s.ev.push({t:'porta'})}}continue}}
   let ax=u.x,ay=u.y;// l'ancora: dove dovrei stare
   if(u.cap){if(s.autoA){const of=s.ord.a.f,db0=b?d2(u,b):1e9;if(of.t!=='carica'&&db0>6){muovi(s,u,of.x,of.y+3,.6);continue}
     if(b&&db0>C.MISCHIA+.3){let amici=0;for(const q of vv)if(q.l==='a'&&q!==u&&d2(q,b)<db0+1)amici++;if(amici<2&&db0>4&&s.tipo!=='arena'){continue}muovi(s,u,b.x,b.y,.6);continue}}
    if(u.ob>=0){const q=U.find(x=>x.id===u.ob&&x.st==='vivo');if(q)b=q;else u.ob=-1}
    const db=b?d2(u,b):1e9,mt=!!b&&muroTra(s,u,b);
    if(u.vx!=null&&!s.autoA){const dv=rad((u.vx-u.x)*(u.vx-u.x)+(u.vy-u.y)*(u.vy-u.y));if(dv>.4&&!(b&&db<=C.MISCHIA+.2&&u.ob>=0&&!mt)){const st=muovi(s,u,u.vx,u.vy);u.ca=u.cav?Math.min(1,u.ca+st*.12):0;if(b&&db<=C.MISCHIA+.3&&!mt&&u.cd<=0)mischia(s,u,b);continue}u.vx=null}
    if(b&&u.git&&db>3.2&&db<=gittata(s,u,b)&&(u.ob>=0||s.autoA||u.vx==null)){if(u.cd<=0)tiro(s,u,b,db);continue}
    if(b&&(u.ob>=0||s.autoA||db<7)){if(db<=C.MISCHIA+.3&&!mt){if(u.cd<=0)mischia(s,u,b)}else{const st=muovi(s,u,b.x,b.y);u.ca=u.cav?Math.min(1,u.ca+st*.12):0}}continue}
   const ver=u.l==='a'?1:-1;
   const cap=o&&o.seg!=null&&capU(s,o.seg)&&capU(s,o.seg).st==='vivo'?capU(s,o.seg):cap0;
   const fmo=o.fm||'larga',pas=passoFm(fmo,u.c);
   if(o.t==='segui'&&cap&&u.l==='a'){const pt=posto(idx[u.id],conta[u.l][u.c],pas,12,fmo);ax=cap.x+pt[0]+(u.c==='c'?9:0);ay=cap.y+(3+pt[1]+(u.c==='t'?5:0))*ver}
   else if(o.t==='tieni'||o.t==='segui'){const pt=posto(idx[u.id],conta[u.l][u.c],pas,s.muro&&u.l==="b"&&u.c==="t"?26:10,fmo);ax=stretto(o.x+pt[0],1.5,C.W-1.5);ay=o.y+pt[1]*ver;
    if(o.guard&&u.c==='f'&&o.gx&&o.gx.length){const k=idx[u.id]%o.gx.length;ax=o.gx[k]+(k%2?1.2:-1.2);ay=s.muro-1.6}}
   const libero=o.t==='carica',db=b?u.bd=d2(u,b):1e9,mt=!!b&&muroTra(s,u,b),gt=b&&u.git?gittata(s,u,b):0;
   if(b&&u.git&&db<=gt&&db>3){// tiratore a tiro: fermo e scocca (chi tiene la posizione non la lascia)
    if(!libero){const da=rad((ax-u.x)*(ax-u.x)+(ay-u.y)*(ay-u.y));if(da>1.2){muovi(s,u,ax,ay);continue}}
    if(u.cd<=0)tiro(s,u,b,db);continue}
   const ingaggio=libero?1e9:(u.git?3:5.5);
   if(b&&!mt&&db<=C.MISCHIA+(u.c==='c'?.4:0)){if(u.cd<=0)mischia(s,u,b);continue}
   // chi tiene la posizione non insegue chi sta oltre il muro (resta al portone o sul camminamento)
   if(b&&(libero||!mt&&(db<=ingaggio||rad((b.x-ax)*(b.x-ax)+(b.y-ay)*(b.y-ay))<=ingaggio))){if(u.git&&libero&&db>gt){muovi(s,u,b.x,b.y)}else if(u.git&&libero){if(u.cd<=0)tiro(s,u,b,db)}else{const st=muovi(s,u,b.x,b.y);if(u.c==='c')u.ca=Math.min(1,u.ca+st*.12)}continue}
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
    if(fr<soglia&&!(l==='b'&&s.muro)&&s.tipo!=='arena'){for(const u of s.u)if(u.l===l&&u.st==='vivo'&&!u.cap){if(u.sal>s.t&&u.scI>=0)s.scalaT[u.scI]=0;u.sal=0;u.st='fuga'}s.ris[l]=[];s.ev.push({t:'rotta',l});if(l==='a'&&s.autoA)chiudi(s,'b')}}
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
 // la formazione di ogni gruppo (per i bottoni della vista)
 function forme(s,l){const o=s.ord[l||'a'],f={};for(const g of GR)f[g]=(o[g]&&o[g].fm)||'larga';return f}
 return{C,nuovo,passo,ordina,capitano,riepilogo,risolvi,gruppi,vivi,riserva,capU,quota,copre,acqua,forme}})();
if(typeof module!=='undefined'&&module&&module.exports)module.exports=VCAM;
