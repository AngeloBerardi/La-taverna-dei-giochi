/* ---- Compagnia di ventura, dati del campo di battaglia (file vuoto, preparato dal passo 04). ----
   Passo 06: `VDAT.TAGLIA` (uomini in campo e misure del campo per taglia della battaglia) e gli altri numeri delle grandi battaglie.
   Va dopo 28ja e prima del mondo (28k): sta nel manifest già al suo posto, così nessun altro passo lo tocca. */
// Uomini in campo per lato e misure del campo (passi) per taglia della battaglia. Senza `max` nella scheda il campo resta quello di sempre (34 uomini, 60×100).
VDAT.TAGLIA={piccola:{max:40,W:60,H:100},media:{max:70,W:80,H:120},grande:{max:110,W:100,H:140}};

// Passo 16: morale per reparto, fatica, frecce, comandante nemico. Agiscono solo con i reparti (`s.rep`): senza, la battaglia resta quella di sempre.
// MR = morale del reparto (caduti, colpi di fianco, cariche, vicini in rotta, comandante caduto, nemici abbattuti; sotto ROTTA fugge, il Grido lo riporta a RADUNO).
VDAT.MR={KO:60,KOMIN:6,FIANCO:.4,FIANCO_P:-.3,CARICA:2,VICINO:8,VICINO_D:15,CAPO:25,UCCIDE:.5,ROTTA:15,RADUNO:30};
// FA = fatica (0-100): quanto cresce (correre, carica, colpi), quanto cala (fermo, serrata ferma, dopo RIPOSO istanti senza colpi), soglie e moltiplicatori di attacco e velocità;
// CARRO = istanti al carro delle frecce, VICINO_NEMICO = distanza a cui un tiratore senza frecce combatte invece di andare al carro
VDAT.FA={CORRI:.25,CARICA:3,COLPO:.6,FERMO:.4,SERRATA:.6,RIPOSO:20,S1:60,M1:.85,S2:85,M2:.7,CARRO:40,VICINO_NEMICO:3};
// frecce di ogni tiratore, per arma; chi ha un'arma senza voce qui tira senza limite
VDAT.FRECCE={arco:20,balestra:14,giavellotto:6};
for(const k of Object.keys(VDAT.TR)){const T=VDAT.TR[k],f=T.git>0?VDAT.FRECCE[VDAT.aspetto(k).arma]:null;if(f!=null)T.fr=f}
// il comandante nemico (un signore): sta dietro i fanti. Il suo equilibrio si regola qui. `scheda.capoB` può essere `true`, un oggetto con numeri suoi o `'volpe'`.
VDAT.SIG_CAMPO={pf:70,att:14,dif:12,dan:11,vel:14,cav:true,nome:'Il signore'};
VDAT.VOLPE_CAMPO={pf:130,att:23,dif:18,dan:15,vel:18,cav:true,nome:'La Volpe Rossa'};
// Le regole del passo 16 stanno qui (il motore, 28l, ha il tetto dei 35 KB): `VDAT.CAMPO16(K)` riceve gli attrezzi del motore e restituisce i ganci che 28l chiama.
VDAT.CAMPO16=K=>{const {C,stretto,d2,GR,chiavi}=K,M=C.MR,FA=C.FA;
 // il morale di un reparto nasce dal morale del lato (più lo scarto `morIni`) la prima volta che serve
 const mrG=(s,l,r)=>{const m=s.mr[l];if(m[r]==null)m[r]=stretto(s.mor[l]+(s.morIni?s.morIni[l]:0),0,100);return m[r]};
 const mrAdd=(s,l,r,v)=>{if(!s.mr||r==null||r<0)return;mrG(s,l,r);s.mr[l][r]=stretto(s.mr[l][r]+v,0,100)};
 const mrTutti=(s,l,v)=>{for(const u of s.u)if(u.l===l&&!u.cap&&u.r>=0)mrG(s,l,u.r);for(const k of Object.keys(s.mr[l]))mrAdd(s,l,+k,v)};
 const cen=L=>({x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length});
 const delRep=(s,l,r)=>s.u.filter(u=>u.l===l&&u.r===r&&!u.cap&&u.st==='vivo');
 const fat=(u,v)=>{if(u.fa!=null)u.fa=Math.min(100,u.fa+v*(u.mfa||1))};
 // frecce finite: va al proprio bordo, dopo CARRO istanti torna con la faretra piena
 function carro(s,u){const y=u.l==='a'?s.H-1:1;
  if(u.cz>0){if(s.t>=u.cz){u.cz=0;u.fr=u.frM;s.ev.push({t:'carro',r:u.r})}return}
  if(Math.abs(u.y-y)<1.2){u.cz=s.t+FA.CARRO;return}
  u.cz=-1;K.muovi(s,u,u.x,y)}
 // il comandante nemico: difende chi gli sta addosso, altrimenti sta 4 passi dietro il reparto di fanti più vicino al centro
 function capoNemico(s,u,b,vv){const db=b?d2(u,b):1e9;
  if(b&&!K.muroTra(s,u,b)){if(db<=C.MISCHIA+.4){if(u.cd<=0)K.mischia(s,u,b);return}if(db<6){K.muovi(s,u,b.x,b.y);return}}
  if(u.ax==null||(s.t+u.id)%5===0){let best=null,bd=1e9;const R={};for(const q of vv)if(q.l===u.l&&!q.cap&&q.c==='f')(R[q.r]=R[q.r]||[]).push(q);
   for(const k of Object.keys(R)){const c=cen(R[k]),d=Math.abs(c.x-s.W/2);if(d<bd){bd=d;best=R[k]}}
   if(best){const c=cen(best);u.ax=c.x;u.ay=stretto(best.reduce((a,q)=>Math.min(a,q.y),1e9)-4,1,s.H-1)}}
  if(u.ax!=null&&d2(u,{x:u.ax,y:u.ay})>.6)K.muovi(s,u,u.ax,u.ay)}
 // sotto la soglia un reparto fugge (e fa tremare i vicini, una volta); chi difende le mura non si rompe
 function rotteRep(s){for(const l of['a','b']){if(l==='b'&&s.muro)continue;const m=s.mr[l];
  for(const k of Object.keys(m)){const r=+k;if(m[k]>=M.ROTTA)continue;const L=delRep(s,l,r);if(!L.length)continue;
   if(s.rf[l][k]==null){s.rf[l][k]=L.length;const c=cen(L);s.ev.push({t:'rotta-r',l,r});
    for(const k2 of Object.keys(m)){if(k2===k)continue;const L2=delRep(s,l,+k2);if(L2.length&&d2(c,cen(L2))<M.VICINO_D)m[k2]=stretto(m[k2]-M.VICINO,0,100)}}
   for(const u of L){if(u.sal>s.t&&u.scI>=0)s.scalaT[u.scI]=0;u.sal=0;u.st='fuga'}}}}
 return{
  // la battaglia nasce con i reparti: stato del morale, e (dopo le unità) fatica iniziale e comandante nemico
  avvia(s,scheda){s.mr={a:{},b:{}};s.rf={a:{},b:{}};if(scheda.morIni)s.morIni={a:+scheda.morIni.a||0,b:+scheda.morIni.b||0}},
  dopo(s,scheda){if(scheda.fatica0)for(const u of s.u)if(u.fa!=null)u.fa=+scheda.fatica0[u.l]||0;
   if(scheda.capoB&&scheda.b&&scheda.b[0]){const g=scheda.capoB,D=K.D,SC=Object.assign({},D.SIG_CAMPO,g==='volpe'?D.VOLPE_CAMPO:typeof g==='object'?g:null),u=K.unita(s,'b',{p:scheda.b[0].p,t:scheda.b[0].t,cap:1},s.W/2,(s.muro?s.muro-7:20)-6);
    Object.assign(u,{cap:true,capo:true,c:'k',r:-1,pf:SC.pf,pfm:SC.pf,att:SC.att,dif:SC.dif,dan:SC.dan,git:0,vel:SC.vel,cav:!!SC.cav,liv:5,nome:SC.nome,ob:-1});s.capoB=u.id}},
  // fatica, frecce e moltiplicatore dei modificatori di un uomo appena nato
  nasce(u,T,Mo){u.fa=0;if(T.fr!=null)u.fr=u.frM=T.fr;if(Mo&&Mo.fa!=null)u.mfa=Mo.fa},
  fm:u=>u.fa>FA.S2?FA.M2:u.fa>FA.S1?FA.M1:1,
  corri(s,u){fat(u,FA.CORRI);u.mv=s.t},
  // un colpo in mischia: fatica di chi lo dà (con la carica) e di chi lo prende
  colpo(s,u,b){fat(u,FA.COLPO+(u.ca>.6?FA.CARICA:0));fat(b,FA.COLPO);u.lt=b.lt=s.t},
  // il colpo è andato a segno: morale di chi lo prende (fianco o spalle, carica)
  colpito(s,u,b,ca){if(b.cap||b.r<0)return;if(u.fx*b.fx+u.fy*b.fy>M.FIANCO_P)mrAdd(s,b.l,b.r,-M.FIANCO);if(ca>.6)mrAdd(s,b.l,b.r,-M.CARICA)},
  // un caduto: morale del suo reparto (e di chi l'ha abbattuto); cade un comandante: tutti i reparti del suo lato
  ko(s,b,da){
   if(b.capo){s.capoKo=true;s.ev.push({t:'stendardo',l:'b'});mrTutti(s,'b',-M.CAPO)}
   else if(b.cap){if(b.l==='a')mrTutti(s,'a',-M.CAPO)}
   else if(b.r>=0)mrAdd(s,b.l,b.r,-M.KO/Math.max(M.KOMIN,s.u.reduce((a,u)=>a+(u.l===b.l&&u.r===b.r&&!u.cap?1:0),0)));
   if(da&&!da.cap&&da.r>=0)mrAdd(s,da.l,da.r,M.UCCIDE)},
  // il comandante nemico agisce da sé; chi ha finito le frecce (e non ha nemici vicini) va al carro: vero se l'uomo è stato mosso qui
  spec(s,u,b,vv){if(u.capo){capoNemico(s,u,b,vv);return true}if(u.fr===0&&!(b&&d2(u,b)<=FA.VICINO_NEMICO)){carro(s,u);return true}return false},
  // a ogni istante: all'inizio i reparti prendono il loro morale
  inizio(s){if(!s.mr){s.mr={a:{},b:{}};s.rf={a:{},b:{}}}if(s.t===1)for(const u of s.u)if(!u.cap&&u.r>=0)mrG(s,u.l,u.r)},
  // alla fine: chi sta fermo riprende fiato (da fermi e senza colpi, meglio se in serrata); i reparti sotto soglia fuggono
  fine(s,vv){for(const u of vv)if(u.fa>0&&u.mv!==s.t&&s.t-(u.lt==null?-99:u.lt)>FA.RIPOSO)u.fa=Math.max(0,u.fa-(K.forma(s,u)==='serrata'?FA.SERRATA:FA.FERMO));rotteRep(s)},
  // il Grido raduna un reparto in fuga se torna almeno metà dei suoi fuggitivi
  raduna(s){for(const k of Object.keys(s.rf.a))if(delRep(s,'a',+k).length*2>=s.rf.a[k]){s.mr.a[k]=M.RADUNO;delete s.rf.a[k];s.ev.push({t:'raduno',r:+k})}},
  // il comandante nemico ancora in piedi non conta tra le truppe
  capoVivo:s=>s.capoB&&K.perId(s.u,s.capoB).st==='vivo'?1:0,
  riep(s,R){if(s.capoB)R.capoKo=!!s.capoKo;return R},
  // morale, fatica e frecce di ogni reparto, per la vista: [{r,n,mor,fa,fr}] (medie intere; `fr` null se nessuno ha frecce contate)
  morali(s,l){l=l||'a';return chiavi(s.ord[l]).map(k=>{const r=k>2?k:GR.indexOf(k),L=s.u.filter(u=>u.l===l&&!u.cap&&u.r===r&&(u.st==='vivo'||u.st==='fuga')),F=L.filter(u=>u.fr!=null),m=s.mr&&s.mr[l]&&s.mr[l][r]!=null?s.mr[l][r]:s.mor[l];
   return{r,n:L.length,mor:Math.round(m),fa:L.length?Math.round(L.reduce((a,u)=>a+(u.fa||0),0)/L.length):0,fr:F.length?Math.round(F.reduce((a,u)=>a+u.fr,0)/F.length):null}}).filter(x=>x.n>0||x.r<3)}}};
