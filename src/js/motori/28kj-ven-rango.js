/* ---- Compagnia di ventura, rango dei comandanti (passo 12) e maestro di guerra (passo 30: memoria delle tue tattiche qui sotto, il rango 5 in battaglia nella fabbrica `VDAT.MAESTRO` in fondo). ----
   Ogni comandante ha un rango 0-5: base per tipo + esperienza (`sg.esp`, facoltativa) + opzione `nem`. `VEN.rango(s,parte)` → {r,nome} (parte: una compagnia, un signore o un luogo),
   `VEN.rangoCap(s)` → il rango del tuo capitano (dall'abilità comando). L'esperienza si accumula sempre; premi, cattura, forza dei signori e scheda
   cambiano solo con `VDAT.ACCESO.consiglio`. Dopo 28ke, prima di 28l. */
Object.assign(VDAT,{RANGO:{BASE:{pre:0,capo:1,car:1,guar:1,mer:2,sig:2,mar:3,re:4},VOLPE:2,PASSO_ESP:6,MAX:5,PREMIO:.2,FORZA:.05,CATTURA:{capo:.8,senza:.3},
 NOMI:['sprovveduto','accorto','esperto','astuto','maestro di guerra','leggendario'],COMANDO:[2,2,3,3,4,4,4],PRIGIONIA_GIORNI:10}});
Object.assign(VEN,(()=>{const{D,L,abil,giorno}=VEN._,R=VDAT.RANGO,lim=r=>Math.max(0,Math.min(R.MAX,r));
 const attivo=()=>!!VDAT.ACCESO.consiglio;
 const sigDi=(s,p)=>p&&p.k==='sig'&&s.sig?s.sig[p.sig]:null;
 // il re vale quanto il suo regno (solo nei mondi nuovi, si legge al momento da s.l): 2 con una città, 3 con due o tre, 4 da quattro in su; altrove resta 4
 const reDi=(s,sg)=>{if(s.geo!==2||!s.rg)return R.BASE.re;let n=0;for(const l of s.l)if(l.tipo==='citta'&&l.faz===sg.faz)n++;return n>=4?4:n>=2?3:2};
 // base ed esperienza di una parte
 function baseDi(s,p){if(p.g&&p.tipo)return{b:R.BASE.guar,e:0};   // un luogo con la sua guarnigione
  if(p.k==='riv')return{b:Math.min(R.MAX,R.VOLPE+((s.volpe||{}).tappa|0)),e:0};
  const sg=sigDi(s,p);if(sg)return{b:sg.mar?R.BASE.mar:sg.re?reDi(s,sg):R.BASE.sig,e:sg.esp|0};
  if(p.k==='mer')return{b:R.BASE.mer,e:0};if(p.k==='car')return{b:R.BASE.car,e:0};
  if(p.k==='pre'&&(p.tr||[]).some(e=>D.TR[e.t]&&D.TR[e.t].capo))return{b:R.BASE.capo,e:0};
  return{b:R.BASE.pre,e:0}}
 function rango(s,p){const x=baseDi(s,p),r=lim(Math.min(R.MAX,x.b+Math.floor(x.e/R.PASSO_ESP))+(VEN.opz(s).nem|0));return{r,nome:R.NOMI[r]}}
 function rangoCap(s){const c=abil(s,'comando');return R.COMANDO[Math.min(R.COMANDO.length-1,c)]}
 const nemici=s=>s.incontro&&s.incontro.tipo!=='arena'?VEN.schieramenti(s):{nem:[],all:[],luogo:null};
 const rangoNem=(s,v)=>{let m=null;for(const p of v.nem.length?v.nem:v.luogo?[v.luogo]:[]){const x=VEN.rango(s,p);if(!m||x.r>m.r)m=x}return m||{r:0,nome:R.NOMI[0]}};
 const fazDi=v=>v.nem[0]?v.nem[0].faz:v.luogo?v.luogo.faz:'neu';
 // esperienza: la decisione 3 del passo la vuole sempre attiva, ma sg.esp entra nel salvataggio e cambierebbe l'impronta: finché la domanda è aperta (vedi la PR) segue l'interruttore
 const ESP_SEMPRE=false;
 // ---------- la memoria delle tue tattiche (passo 30): {n: battaglie con te, cavPrima: quante volte, …} in sg.mem.tat (signori) o s.volpe.tat (la Volpe) ----------
 const memKey=p=>p&&p.k==='sig'&&p.sig>=0?p.sig:p&&p.k==='riv'?-1:null;
 // la memoria di un comandante (crea: la apre se manca; la Volpe solo se le voci l'hanno già presentata)
 function memDi(s,m,crea){if(m===-1){const v=s.volpe;if(!v)return null;return v.tat||(crea?(v.tat={n:0}):null)}
  const sg=s.sig&&s.sig[m];if(!sg)return null;if(!crea)return sg.mem&&sg.mem.tat||null;const mm=VEN.memSig(sg);return mm.tat||(mm.tat={n:0})}
 // chi ha combattuto: battuto da te (s.incontro.ms, scritto da VEN.sconfitta) o, se hai perso, chi ti stava davanti
 function combattenti(s,riep){const out=[];for(const m of riep.vince==='a'?(s.incontro&&s.incontro.ms)||[]:nemici(s).nem.map(memKey))if(m!=null&&out.indexOf(m)<0)out.push(m);return out}
 const nomeMem=(s,m)=>{const n=m===-1?D.RIVALE.nome:s.sig[m]?s.sig[m].nome:'';return n?n[0].toUpperCase()+n.slice(1):''};
 VEN.aggancia('battaglia',(s,riep)=>{if(!attivo()||!riep.tat)return;const ms=combattenti(s,riep);
  for(const m of ms){const x=memDi(s,m,true);if(!x)continue;x.n=(x.n|0)+1;for(const k of Object.keys(riep.tat))if(riep.tat[k]>0)x[k]=(x[k]|0)+riep.tat[k]}
  // le contromosse usate si annunciano nella cronaca, a nome del comandante (il re, poi un maresciallo, poi il primo)
  if(!riep.contro||!riep.contro.length||typeof VVOC==='undefined'||!VVOC.CONTRO)return;
  let m=ms.find(i=>i===-1);if(m==null)m=ms.find(i=>s.sig[i]&&s.sig[i].re);if(m==null)m=ms.find(i=>s.sig[i]&&s.sig[i].mar);if(m==null)m=ms[0];
  const chi=m!=null&&nomeMem(s,m)||'Il nemico';for(const id of riep.contro)if(VVOC.CONTRO[id])L(s,VVOC.CONTRO[id].replace('{chi}',chi))});
 VEN.aggancia('battaglia',(s,riep)=>{if(!ESP_SEMPRE&&!attivo())return;const v=nemici(s);
  if(riep.vince==='a'){for(const p of v.all){const sg=sigDi(s,p);if(sg)sg.esp=(sg.esp|0)+1}}
  else for(const p of v.nem){const sg=sigDi(s,p);if(sg)sg.esp=(sg.esp|0)+2}});
 // -1 ogni 10 giorni dalla presa (sg.pgg = giorno della presa, scritto solo da qui)
 VEN.aggancia('giorno',s=>{if(!ESP_SEMPRE&&!attivo())return;const g=giorno(s);for(const sg of s.sig){if(sg.prig==null||sg.prig===false){delete sg.pgg;continue}
  if(sg.pgg==null){sg.pgg=g;continue}if(g>sg.pgg&&(g-sg.pgg)%R.PRIGIONIA_GIORNI===0&&(sg.esp|0)>0)sg.esp--}});
 // il rango del nemico si fissa prima che VEN.sconfitta lo tolga dalla mappa (s.incontro.rg, azzerato con l'incontro)
 // passo 30: e anche chi è stato battuto da chi gioca (s.incontro.ms: indici dei signori, -1 la Volpe), per la memoria delle tattiche
 const sconfitta=VEN.sconfitta;VEN.sconfitta=(s,p,da,preso)=>{if(attivo()&&s.incontro&&p){const r=VEN.rango(s,p).r;if(!(s.incontro.rg>=r))s.incontro.rg=r;
  const m=memKey(p);if(da==='tu'&&m!=null){const ms=s.incontro.ms||(s.incontro.ms=[]);if(ms.indexOf(m)<0)ms.push(m)}}return sconfitta(s,p,da,preso)};
 // solo con l'interruttore
 VEN.aggancia('premio',(s,riep,out)=>{if(!attivo()||riep.vince!=='a')return;const m=1+R.PREMIO*Math.max(s.incontro&&s.incontro.rg|0,rangoNem(s,nemici(s)).r);if(m===1)return;
  const f=Math.round(out.fama*m);s.fama+=f-out.fama;out.fama=f;out.xp=Math.round(out.xp*m);out.oro=Math.round(out.oro*m)});
 const cattura=VEN.probCattura;VEN.probCattura=(s,riep)=>attivo()?(riep&&riep.capoKo?R.CATTURA.capo:R.CATTURA.senza):cattura(s,riep);
 const molt=VEN.molt;VEN.molt=(s,k,c)=>{const x=molt(s,k,c);return attivo()&&k==='forza'&&c&&c.p?x*(1+R.FORZA*VEN.rango(s,c.p).r):x};
 VEN.aggancia('scheda',(s,sc)=>{if(!attivo())return;const v=nemici(s),n=rangoNem(s,v),sg=sigDi(s,v.nem[0]);
  sc.rango={a:VEN.rangoCap(s),b:n.r};sc.dott={a:'tu',b:VEN.cult(s,fazDi(v))};if(sg)sc.indole={b:(D.TRATTI[sg.tratto]||{}).nome};
  sc.esplora={a:abil(s,'esplora'),b:n.r};
  // la memoria del comandante più alto di rango tra i nemici (il consiglio la usa solo dal rango 5)
  let best=null,br=-1;for(const p of v.nem){const m=memKey(p);if(m==null)continue;const r=VEN.rango(s,p).r;if(r>br){br=r;best=m}}
  const mm=best==null?null:memDi(s,best,false);if(mm)sc.memo=Object.assign({},mm)});
 VEN.aggancia('anteprima',(s,a)=>{if(!attivo()||!a.loro)return;const v=nemici(s);a.loro.rango=rangoNem(s,v);a.loro.dott=VEN.cult(s,fazDi(v))});
 return{rango,rangoCap}})());
/* ---- Passo 30: il maestro di guerra in battaglia (rango 5). Fabbrica che il consiglio (28la) chiama con i suoi attrezzi, come VDAT.CAMPO16 per 28l: ----
   memoria di cosa fa chi gioca (`s.tat`, che il riepilogo porta al mondo come `tat`), abitudini dalla memoria della scheda (`scheda.memo` → `s.ab`, solo il lato b),
   contromosse (schieramento e manovre), inganni (finta rotta, ombre, tempo) e le contromosse usate (`s.cm` → riepilogo `contro`). Motore puro: niente Math.random, Date.now o trigonometria. */
// Memoria: CONTATTO = distanza di mischia per «chi ha colpito per primo», ALT_N/CAP_N = controlli (uno ogni 10 istanti) con i tiratori sull'altura o il capitano davanti perché l'abitudine conti, PRESTO = istante entro cui un'ondata è «presto»;
// contromosse: PICCHE_D = quanto l'esca sta davanti alle picche, ADESCA_D/ADESCA_T = a che distanza dai cavalieri l'esca si scansa e per quanto, FUORI_M/FUORI_T = margine oltre la gittata dall'altura e fin quando restarne fuori,
// GUARDA_D/GUARDA_T = raggio della guardia sul fianco e istanti dopo l'ultima ondata nemica prima di lasciarla, CONTRO_T = istanti dopo l'ondata di chi gioca prima della controcarica (se non è già stanca);
// inganni: FINTA_DA/FINTA_T/FINTA_D/FINTA_GITT = da quando, per quanto, quanto lontano corre il reparto della finta rotta e a che gittata dai tiratori sull'altura deve stare, OMBRE = quota di truppe che si mostra schierandosi per primo,
// TEMPO_FA/ONDA5_T = fatica media nemica che fa entrare la prima ondata e istante in cui entra comunque.
VDAT.CONS5={CONTATTO:2,ALT_N:6,CAP_N:5,PRESTO:300,PICCHE_D:6,ADESCA_D:14,ADESCA_T:90,FUORI_M:3,FUORI_T:900,GUARDA_D:14,GUARDA_T:200,CONTRO_T:150,FINTA_DA:60,FINTA_T:60,FINTA_D:20,FINTA_GITT:1.3,FINTA_CAV:12,FINTA_Q:.3,FINTA_MO:10,OMBRE:.7,TEMPO_FA:55,ONDA5_T:900};
VDAT.MAESTRO=A=>{const{K,I,C,D,d2,stretto,chiave,chiavi,repC,tieni,giro,ingressoVicino,fiancoDebole}=A,K5=VDAT.CONS5;
 const ASTE={picca:1,alabarda:1,lancia:1},asta=t=>!!ASTE[D.aspetto(t).arma];   // chi ferma una carica in serrata (come `ASTA` di 28l)
 const cavNem=Q=>Q.nem.some(e=>e.c==='c'&&e.n>=3);
 // il reparto di tiratori nemico più numeroso appostato sull'altura
 function tiratoriSu(Q){let b=null;for(const e of Q.nem)if(e.ti>.5&&e.qu>C.TER.DISL&&(!b||e.n>b.n))b=e;return b}
 // fatica media di un elenco di reparti (pesata sugli uomini)
 function fatica(L){let f=0,n=0;for(const e of L){f+=e.fa*e.n;n+=e.n}return n?f/n:0}
 // segna una contromossa usata: il riepilogo la porta al mondo (`contro`), che la annuncia nella cronaca
 function usa(s,id){const c=s.cm||(s.cm=[]);if(c.indexOf(id)<0)c.push(id)}
 // la riserva del rango 5: entra anche quando chi gioca è stanco; contro chi manda un'ondata presto (`ondataPresto`) aspetta
 // che quell'ondata sia entrata e stanca (o CONTRO_T istanti), poi entra dall'ingresso più vicino a lei
 function riserva5(s,l,Q,W){const nl=l==='a'?'b':'a',nem=s.ond[nl]||[];let deb=null;for(const e of Q.nem)if(e.mo<K.RISERVA_MOR&&(!deb||e.mo<deb.mo))deb=e;
  const linea=s.in0&&I.vivi(s,l).length*100<K.RISERVA_LINEA*s.in0[l];let ok,dove=null;   // senza contromossa entra dal fianco debole, come il rango 4
  if(Q.ab&&Q.ab.ondataPresto&&nem.length){const ent=nem.filter(w=>w.fatta);
   if(!ent.length)ok=linea||s.t>=K.RISERVA_T*1.5;
   else{const rp={};let t0=0;for(const w of ent){for(const g of Object.keys(w.rp||{}))rp[w.rp[g]]=1;const t=s.tat&&s.tat.on[w.id];if(t!=null&&t>t0)t0=t}
    let x=0,y=0,f=0,n=0;for(const u of s.u)if(u.l===nl&&u.st==='vivo'&&!u.cap&&rp[u.r]){x+=u.x;y+=u.y;f+=u.fa||0;n++}
    ok=linea||(n&&f/n>K5.TEMPO_FA)||s.t-t0>=K5.CONTRO_T||s.t>=K.RISERVA_T*1.5;if(n)dove={x:x/n,y:y/n}}
   if(ok)usa(s,'ondataPresto')}
  else ok=(nem.length>0&&nem.every(w=>w.fatta))||deb||linea||fatica(Q.nem)>K5.TEMPO_FA||s.t>=K.RISERVA_T;
  if(!ok)return;
  for(const w of W){if(!s.muro&&w.fi!==2){w.ing=dove?ingressoVicino(s,l,dove):fiancoDebole(s,Q);w.fi=1}VCAM.ondata(s,{l,id:w.id})}
  s.ev.push({l,r:-1,m:'riserva',t:'piano'})}   // evento del campo, non del mondo: `t` in coda perché la prova dell'audio cerca gli eventi del mondo nei file 28k
 // gli inganni del rango 5 (una finta rotta per battaglia) e la guardia sul fianco che finisce il suo turno
 function inganna(s,l,Q,c){const nl=l==='a'?'b':'a';
  if(c.gd&&!c.gd.fatto){const nw=(s.ond&&s.ond[nl])||[];let t0=0;if(s.tat)for(const k of Object.keys(s.tat.on))t0=Math.max(t0,s.tat.on[k]);
   if(!Q.rep.some(q=>q.k===c.gd.k)||!nw.length||(nw.every(w=>w.fatta)&&s.t-t0>=K5.GUARDA_T&&!Q.nem.some(e=>d2(e,c.gd)<=K5.GUARDA_D)))c.gd.fatto=1}
  if(c.fr||s.t<K5.FINTA_DA||Q.rep.length<2)return;const e=tiratoriSu(Q);if(!e)return;let b=null,bd=1e9,tot=0;for(const m of Q.rep)tot+=m.n;
  // un reparto piccolo (al massimo FINTA_Q degli uomini in campo), sotto il tiro dell'altura e non in mischia; meglio i cavalieri: la linea dei fanti resta intera
  for(const m of Q.rep){if(m.c==='t'||m.n<4||m.n>tot*K5.FINTA_Q||(m.nm&&m.nm.d<=9)||(c.pk&&(m.k===c.pk.k||m.k===c.pk.e))||(c.gd&&m.k===c.gd.k))continue;const d=d2(m,e)-(m.c==='c'?K5.FINTA_CAV:0);if(d<bd){bd=d;b=m}}
  if(b&&d2(b,e)<=e.git*K5.FINTA_GITT)c.fr={k:b.k,t0:s.t,x:b.x,y:stretto(b.y-Q.ver*K5.FINTA_D,4,s.H-4)}}
 // cosa fa in battaglia chi gioca (lato a), guardato a ogni istante del consiglio: primo contatto dei cavalieri e dei fanti, ondate (quando e da dove),
 // e ogni 10 istanti tiratori sull'altura, capitano davanti ai suoi fanti o in mischia, fanti in serrata. Sta in `s.tat` (JSON); `tattiche` ne fa il conto
 function osserva(s){const t=s.tat||(s.tat={cT:-1,fT:-1,altN:0,capN:0,ser:-1,fl:null,op:0,on:{}});
  if(t.cT<0||t.fT<0)for(const u of s.u)if(u.l==='a'&&u.st==='vivo'&&!u.cap&&u.bd!=null&&u.bd<=K5.CONTATTO){if(u.c==='c'&&t.cT<0)t.cT=s.t;else if(u.c==='f'&&t.fT<0)t.fT=s.t}
  if(s.ond&&s.ond.a)for(const w of s.ond.a)if(w.fatta&&t.on[w.id]==null){t.on[w.id]=s.t;if(s.t<K5.PRESTO)t.op=1;if(!t.fl&&w.ing!=='retro')t.fl=w.ing}
  if(s.t%10)return;
  let nt=0,su=0,fy=1e9;const fk={};
  for(const u of s.u){if(u.l!=='a'||u.st!=='vivo'||u.cap)continue;if(u.c==='t'){nt++;if(VCAM.quota(s,u.x,u.y)>C.TER.DISL)su++}else if(u.c==='f'){if(u.y<fy)fy=u.y;fk[chiave(u)]=1}}
  if(nt&&2*su>=nt)t.altN++;
  const cp=I.capU(s);if(cp&&cp.st==='vivo'&&((cp.bd!=null&&cp.bd<=K5.CONTATTO)||(fy<1e9&&cp.y<fy-1)))t.capN++;
  const ks=Object.keys(fk);if(ks.length&&t.ser!==0)t.ser=ks.every(k=>(s.ord.a[k]&&s.ord.a[k].fm)==='serrata')?1:0}
 // le tattiche di una battaglia: 1 se c'è stata, 0 se no (più il fianco dell'ondata, fsx o fdx)
 const ABIT=['cavPrima','alt','fianco','capAvanti','serrata','ondataPresto'];
 function tattiche(s){const t=s.tat;if(!t)return null;
  const o={cavPrima:t.cT>=0&&(t.fT<0||t.cT<t.fT)?1:0,alt:t.altN>=K5.ALT_N?1:0,fianco:t.fl?1:0,capAvanti:t.capN>=K5.CAP_N?1:0,serrata:t.ser===1?1:0,ondataPresto:t.op?1:0};if(t.fl)o[t.fl]=1;return o}
 // le abitudini da una memoria {n: battaglie, cavPrima: quante volte…}: contano se comparse in almeno metà delle battaglie, e almeno 2 volte
 function abitudini(m){const o={};if(!m||!(m.n>0))return o;for(const k of ABIT)if((m[k]|0)>=2&&2*(m[k]|0)>=m.n)o[k]=1;if(o.fianco)o.fl=(m.fdx|0)>(m.fsx|0)?'fdx':'fsx';return o}
 // lo schieramento contro le abitudini (dopo `schieraAlto` e le ondate): picche dietro l'esca, linea fuori gittata dall'altura, guardia sul fianco
 function contromosse(s,l){const ab=s.ab,o=s.ord[l],nl=l==='a'?'b':'a',av=l==='a'?-1:1,W=s.W,H=s.H,cs=s.cons||(s.cons={}),c=cs[l]||(cs[l]={t:-1e9,man:{}});
  const vivo=k=>s.u.some(u=>u.l===l&&!u.cap&&u.st==='vivo'&&chiave(u)===k),ks=chiavi(o).filter(vivo),F=ks.filter(k=>repC(o[k],k)==='f'),Cv=ks.filter(k=>repC(o[k],k)==='c'),usati=[];
  delete c.pk;delete c.al;delete c.gd;
  if(ab.cavPrima&&F.length){let P=F[0],pp=-1;
   for(const k of F){const L=s.u.filter(u=>u.l===l&&!u.cap&&u.st==='vivo'&&chiave(u)===k),p=L.filter(u=>asta(u.t)).length/Math.max(1,L.length);if(p>pp){pp=p;P=k}}
   let E=F.find(k=>k!==P);
   // con due reparti di fanti, prima del «Via» le aste passano tutte nel blocco delle picche e gli altri fanti nell'esca
   if(E!=null&&s.t===0){const rP=P>2?P:0,rE=E>2?E:0,L=s.u.filter(u=>u.l===l&&!u.cap&&u.st==='vivo'&&(chiave(u)===P||chiave(u)===E)),na=L.filter(u=>asta(u.t)).length;
    if(na>=C.REP.MIN&&L.length-na>=C.REP.MIN)for(const u of L)u.r=asta(u.t)?rP:rE}
   if(E==null)E=Cv[0];const oc=chiavi(s.ord[nl]).filter(k=>repC(s.ord[nl][k],k)==='c'),x=stretto(oc.length?oc.reduce((a,k)=>a+s.ord[nl][k].x,0)/oc.length:W/2,6,W-6);
   o[P].x=x;o[P].fm='serrata';o[P].fmT=0;usati.push(P);c.pk={k:P,x,y:o[P].y,e:E==null?null:E,fase:0};
   if(E!=null){o[E].x=x;o[E].y=o[P].y+av*K5.PICCHE_D;o[E].fm='larga';o[E].fmT=0;usati.push(E)}
   usa(s,'cavPrima')}
  if(ab.alt){let z=null;for(const q of I.ZONE(s))if(q.k==='altura'&&(l==='b'?q.y>=H/2:q.y<=H/2)&&(!z||Math.abs(q.x-W/2)<Math.abs(z.x-W/2)))z=q;
   let g=0;for(const u of s.u)if(u.l===nl&&u.c==='t'&&u.git>g)g=u.git;
   if(z&&g){const lim=stretto(z.y-av*(z.ry+g*(1+C.TER.GIT)+K5.FUORI_M),4,H-4),d=(o.f.y-lim)*av;
    if(d>0)for(const k of ks)o[k].y=stretto(o[k].y-av*d,3,H-3);
    c.al={x:z.x,y:z.y,lim};usa(s,'alt')}}
  if(ab.fianco&&s.ondOk&&!s.muro){let G=F.find(k=>usati.indexOf(k)<0);if(G==null)G=Cv.find(k=>usati.indexOf(k)<0);
   if(G!=null){const x=ab.fl==='fdx'?W-10:10,y=(o.f.y+H/2)/2;o[G].x=x;o[G].y=y;c.gd={k:G,x,y};usa(s,'fianco')}}}
 // ---------- le manovre del rango 5: contromosse alle abitudini di chi gioca (`Q.ab`) e inganni ----------
 const MANOVRE=[
  // cavPrima: il blocco con più picche resta in serrata dov'è stato schierato finché la cavalleria di chi gioca è in sella (nascosto: nessun segno)
  {id:'picche',rango:5,tipo:['f'],muta:true,
   vale:(Q,m,s,c)=>c.pk&&m.k===c.pk.k&&cavNem(Q)?2.6:0,
   ordina:(s,l,m,Q,c)=>{tieni(s,l,m,Q,c.pk.x,c.pk.y,'serrata')}},
  // l'esca davanti alle picche: quando i cavalieri arrivano si scansa di lato e dietro, e la carica finisce sulle punte
  {id:'adesca',rango:5,tipo:['f','c'],muta:true,
   vale:(Q,m,s,c)=>c.pk&&m.k===c.pk.e&&c.pk.fase<2&&cavNem(Q)?2.6:0,
   ordina:(s,l,m,Q,c)=>{const p=c.pk;
    if(p.fase===0){for(const e of Q.nem)if(e.c==='c'&&d2(e,m)<=K5.ADESCA_D){p.fase=1;p.t1=s.t;break}}
    if(p.fase===1&&s.t-p.t1>K5.ADESCA_T)p.fase=2;
    if(p.fase===0)tieni(s,l,m,Q,p.x,p.y+Q.ver*K5.PICCHE_D,'larga');
    else tieni(s,l,m,Q,p.x+(m.x>=p.x?1:-1)*9,p.y-Q.ver*6,'larga')}},
  // alt: i cavalieri girano largo e cadono alle spalle dei tiratori di chi gioca appostati sull'altura
  {id:'scaccia',rango:5,tipo:['c'],
   vale:(Q,m,s,c)=>c.al&&tiratoriSu(Q)?1.7:0,
   ordina:(s,l,m,Q,c)=>{const e=tiratoriSu(Q);if(!e)return;const ag=c.sg||(c.sg={});if(m.nuova)ag[m.k]=0;
    if(!ag[m.k]){const w=giro(s,e,m,Q.l,1);if(d2(m,w)<=5)ag[m.k]=1;else{tieni(s,l,m,Q,w.x,w.y);return}}
    s.ord[l][m.k].t='carica'}},
  // alt: fanti e tiratori restano fuori gittata dall'altura finché i cavalieri non l'hanno ripulita
  {id:'fuori',rango:5,tipo:['f','t'],
   vale:(Q,m,s,c)=>c.al&&s.t<K5.FUORI_T&&tiratoriSu(Q)&&Q.rep.some(q=>q.c==='c')&&!(m.nm&&m.nm.d<=9)?1.3:0,
   ordina:(s,l,m,Q,c)=>{const y=Q.l==='b'?Math.min(m.y,c.al.lim):Math.max(m.y,c.al.lim);tieni(s,l,m,Q,m.x,y)}},
  // fianco: un reparto di guardia sul fianco da cui chi gioca fa entrare le sue ondate
  {id:'guarda',rango:5,tipo:['f','c'],
   vale:(Q,m,s,c)=>c.gd&&m.k===c.gd.k&&!c.gd.fatto?1.6:0,
   ordina:(s,l,m,Q,c)=>{const g=c.gd;if(Q.nem.some(e=>d2(e,g)<=K5.GUARDA_D))s.ord[l][m.k].t='carica';else tieni(s,l,m,Q,g.x,g.y)}},
  // inganno: la finta rotta. Il reparto corre via (vivo, non in fuga: `quadro` lo mostra col morale a terra) per tirare giù dall'altura chi gioca;
  // dopo FINTA_T istanti si gira e carica chi lo ha inseguito (entro FINTA_D), altrimenti torna agli ordini di sempre
  {id:'finta',rango:5,tipo:['f','c'],muta:true,
   vale:(Q,m,s,c)=>{const f=c.fr;if(!f||m.k!==f.k)return 0;const t=s.t-f.t0;return t<K5.FINTA_T||(t<2*K5.FINTA_T&&m.nm&&m.nm.d<=K5.FINTA_D)?3:0},
   ordina:(s,l,m,Q,c)=>{const f=c.fr;if(s.t-f.t0<K5.FINTA_T)tieni(s,l,m,Q,f.x,f.y,m.c==='f'?'larga':undefined);else s.ord[l][m.k].t='carica'}},
  // inganno: il tempo. La prima ondata entra quando i reparti di chi gioca sono stanchi (o la propria linea cala, o a ONDA5_T)
  {id:'tempo',rango:5,tipo:[],
   globale:(s,l,Q,c)=>{if(!s.ond||!s.ond[l])return;const w=s.ond[l].find(x=>!x.fatta&&x.id==='ia');if(!w)return;
    const linea=s.in0&&I.vivi(s,l).length*100<60*s.in0[l];if(!(fatica(Q.nem)>K5.TEMPO_FA||linea||s.t>=K5.ONDA5_T))return;
    if(!s.muro&&w.fi!==2){w.ing=fiancoDebole(s,Q);w.fi=1}VCAM.ondata(s,{l,id:w.id})}},
  // capAvanti: col capitano di chi gioca esposto, la prima ondata entra dal lato più vicino a lui (la caccia pesa il doppio: vedi `decidi`; la riserva resta alla sua manovra)
  {id:'ondaCap',rango:5,tipo:[],
   globale:(s,l,Q,c)=>{if(!Q.ab||!Q.ab.capAvanti||!Q.cap||!Q.cx||s.muro||!s.ond||!s.ond[l])return;const w=s.ond[l].find(x=>!x.fatta&&x.id==='ia');if(!w)return;
    w.ing=ingressoVicino(s,l,Q.cx);w.fi=2;VCAM.ondata(s,{l,id:w.id});usa(s,'capAvanti')}}];
 return{osserva,tattiche,abitudini,ABIT,contromosse,riserva5,inganna,usa,MANOVRE}};
