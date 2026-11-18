/* ---- Compagnia di ventura, consiglio di guerra (passo 21): il nemico guarda il campo e sceglie tra le manovre che conosce. ----
   Il rango (0-5) decide quante manovre conosce, ogni quanto ci ripensa e quanto sbaglia; dottrina del regno e indole del signore pesano le scelte.
   `VCAM` lo chiama solo se la battaglia ha `s.rango` (scheda `rango:{a,b}`): senza, resta il `comanda` di sempre. Il passo 25 aggiunge le manovre dei ranghi 3-5, il 30 il maestro di guerra.
   Motore puro: nessun Math.random, Date.now o trigonometria. Dopo 28l (VCAM), prima di 28m. */
// RIFL = istanti tra due decisioni, ERR = rumore sul valore, ISTERESI = quanto deve valere di più una manovra nuova per scalzare quella in corso, AV = passo dell'avanzata,
// MINACCIA = raggio entro cui un nemico pesa, GITT = quota della gittata a cui tirano i tiratori, RIPIEGA/CONTRO/INDIETRO = distanze di `ripiega` e `contro`, LATO = scarto dei cavalieri sul fianco.
// Valori delle manovre: PAZIENZA = fino a quale istante conviene aspettare il nemico, ASPETTA/CAVTI = valore di `tieni` lontano dal nemico (fanti e tiratori / cavalieri),
// CAVAV = `avanza` dei cavalieri, CAVATT = `attendi`, FIANCO = bonus di `carica` dei cavalieri quando i fanti sono già in mischia. Tarati con la scala dei ranghi (tests/test_ven_p21_lento.js).
VDAT.CONS={RIFL:[60,40,30,20,15,10],ERR:[.6,.45,.3,.18,.1,.04],ISTERESI:.15,AV:12,MINACCIA:15,GITT:.9,RIPIEGA:9,CONTRO:15,INDIETRO:10,LATO:17,PAZIENZA:360,ASPETTA:.72,CAVTI:.72,CAVAV:.5,CAVATT:.6,FIANCO:.3};
// pesi delle manovre per regno (`*` = tutte le altre); la compagnia di chi gioca (`tu`), i mercenari e i regni senza voce pesano 1
VDAT.DOTTRINE={val:{attendi:1.4,aggira:1.5},sel:{tiro:1.5,prendi:1.5},fer:{tieni:1.5,contro:1.5,aggira:.6},mar:{tiro:1.4,ripiega:1.4,rotazione:1.4},alt:{tiro:1.6,esca:1.6},pre:{carica:2,'*':.5},mer:{},tu:{}};
// indole del signore: pesi sulle manovre e quanto cambia la soglia di rotta
VDAT.INDOLE={prode:{p:{carica:1.4,caccia:1.4,ritirata:.3}},prudente:{p:{tieni:1.4,riserva:1.4,ritirata:1.5},rotta:.05},crudele:{p:{debole:1.5,insegui:1.5}},avido:{p:{insegui:1.3},rotta:.04}};
const VCONS=(()=>{
 const D=VDAT,K=D.CONS,I=VCAM.int,C=I.C,rad=I.rad,stretto=I.stretto,chiave=I.chiave,chiavi=I.chiavi,repC=I.repC,GR=I.GR;
 const d2=(a,b)=>rad((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
 const OFF={f:0,t:-6,c:-3};   // dove sta ogni tipo rispetto alla linea dei fanti (come nel vecchio `comanda`)
 // ---------- il quadro: tutto ciò che serve per decidere, calcolato una volta per decisione ----------
 const PICCA={};   // tipo di truppa -> ha la picca (cache di dati fissi, non è stato)
 const picca=t=>PICCA[t]!=null?PICCA[t]:(PICCA[t]=D.aspetto(t).arma==='picca');
 function reparti(s,lt){const M={},out=[],o=s.ord[lt],mr=s.mr&&s.mr[lt];let fug=0;
  for(const u of s.u){if(u.l!==lt||u.cap)continue;if(u.st==='fuga'){fug++;continue}if(u.st!=='vivo')continue;(M[chiave(u)]=M[chiave(u)]||[]).push(u)}
  for(const k of chiavi(o)){const L=M[k];if(!L)continue;const r=k>2?k:GR.indexOf(k),n=L.length;let x=0,y=0,fo=0,fa=0,ti=0,gi=0,fr=0,nf=0,pi=0,mo=s.mor[lt];
   for(const u of L){x+=u.x;y+=u.y;fo+=u.att*u.pf/30;fa+=u.fa||0;if(u.git>0){ti++;gi+=u.git}if(u.fr!=null){fr+=u.fr;nf++}if(picca(u.t))pi++}
   if(mr&&mr[r]!=null)mo=mr[r];
   const c=repC(o[k],k),qu=VCAM.quota(s,x/n,y/n);
   out.push({k,r,c,n,x:x/n,y:y/n,fo,mo,fa:fa/n,fr:nf?fr/nf:null,ti:ti/n,git:ti?gi/ti:0,pi:pi/n,qu,co:VCAM.copre(s,x/n,y/n),min:0,nm:null})}
  return{rep:out,fug}}
 // quanto pesa un nemico `e` su un reparto `m`: i contrari contano di più
 const contrario=(e,m,aperto)=>e.c==='c'&&m.c==='t'?1.5:e.c==='t'&&m.c==='f'&&aperto?1.2:e.pi>.5&&m.c==='c'?1.5:1;
 const valore=(s,l)=>{let v=0;for(const u of s.u)if(u.l===l&&u.st==='vivo'&&!u.cap)v+=D.valore(u.t);for(const x of s.ris[l])v+=x.n*D.valore(x.t);return v};
 function quadro(s,l){const nl=l==='a'?'b':'a',me=reparti(s,l),ne=reparti(s,nl),aperto=!(s.zone&&s.zone.some(z=>z.k==='bosco'||z.k==='case')),Q={l,t:s.t,ver:l==='a'?-1:1,W:s.W,H:s.H,rep:me.rep,nem:ne.rep,fug:ne.fug,nfug:me.fug};
  for(const m of Q.rep){let d=1e9,mn=null;for(const e of Q.nem){const de=d2(m,e);if(de<d){d=de;mn=e}if(de<=K.MINACCIA)m.min+=e.fo*contrario(e,m,aperto)}m.nm=mn?{x:mn.x,y:mn.y,d,c:mn.c,r:mn.r,git:mn.git,ti:mn.ti}:null}
  for(const e of Q.nem){e.nd=1e9;for(const m of Q.rep){const de=d2(m,e);if(de<e.nd)e.nd=de}}
  const vm=valore(s,l),vn=valore(s,nl);Q.R=vm/Math.max(1,vn);
  Q.alt=Q.rep.some(m=>m.qu>C.TER.DISL);
  Q.onde=s.ond&&s.ond[l]?s.ond[l].filter(w=>!w.fatta).length:0;
  // il capitano nemico è esposto se nessun suo reparto gli sta entro 8
  const cn=s.u.find(u=>u.l===nl&&u.cap&&u.st==='vivo');Q.cap=cn?!Q.nem.some(e=>d2(cn,e)<=8):false;
  Q.xi=Q.rep.length?Q.rep.reduce((a,m)=>a+m.x*m.n,0)/Q.rep.reduce((a,m)=>a+m.n,0):s.W/2;
  return Q}
 // ---------- le manovre ----------
 // avanza lungo y di un certo passo (in avanti rispetto al lato)
 const prog=(Q,y)=>Q.l==='a'?-y:y,daProg=(Q,p)=>Q.l==='a'?-p:p;
 const tieni=(s,l,m,Q,x,y,fm)=>{const o=s.ord[l][m.k];if(fm===undefined&&m.c==='f')fm='serrata';o.t='tieni';o.x=stretto(x,1.5,s.W-1.5);o.y=stretto(y,3,s.H-3);if(fm&&fm!==o.fm&&s.t>=(o.fmT||0)){o.fm=fm;o.fmT=s.t+C.FM.ATTESA}};
 // la linea dei fanti: il progresso più avanzato tra i reparti di fanti
 const fantiPr=Q=>{let p=null;for(const m of Q.rep)if(m.c==='f'){const v=prog(Q,m.y);if(p==null||v>p)p=v}return p};
 const MANOVRE=[
  {id:'carica',rango:0,tipo:['f','t','c'],
   vale:(Q,m)=>m.nm&&m.nm.d<=9?.9+stretto((Q.R-1)*.4,-.3,.3):m.c==='c'?.7+(Q.rep.some(q=>q.c==='f'&&q.nm&&q.nm.d<=9)?K.FIANCO:0):.3,
   ordina:(s,l,m)=>{s.ord[l][m.k].t='carica'}},
  {id:'avanza',rango:1,tipo:['f','t','c'],
   vale:(Q,m)=>m.nm&&m.nm.d>18?(m.c==='c'?K.CAVAV:.5):.25,
   ordina:(s,l,m,Q)=>{const o=s.ord[l][m.k];
    // al passo del più lento: tutti i reparti che avanzano vanno alla stessa linea (con lo scarto del proprio tipo)
    let lento=1e9;for(const q of Q.rep)if(Q.man[q.k]==='avanza'){const v=prog(Q,q.y)-(OFF[q.c]||0);if(v<lento)lento=v}
    const p=Math.min(prog(Q,m.y)+K.AV,lento+K.AV+(OFF[m.c]||0));tieni(s,l,m,Q,o.x,daProg(Q,p))}},
  {id:'tieni',rango:1,tipo:['f','t','c'],
   vale:(Q,m)=>(m.nm&&m.nm.d>9&&Q.t<K.PAZIENZA?(m.c==='c'?K.CAVTI:K.ASPETTA):.4)+(m.qu>C.TER.DISL?.2:0)+(Q.R<.8?.2:0),
   ordina:(s,l,m,Q)=>{const o=s.ord[l][m.k];if(m.nuova||o.t!=='tieni')tieni(s,l,m,Q,m.x,m.y,m.c==='f'?'serrata':null)}},
  {id:'tiro',rango:1,tipo:['t','c'],
   vale:(Q,m)=>m.ti<.5||m.fr===0||!m.nm?0:m.nm.d<=m.git*1.1?1:.95,
   ordina:(s,l,m,Q)=>{const e=m.nm,g=m.git*K.GITT,o=s.ord[l][m.k];if(!e)return;
    if(e.d<=g){if(m.nuova||o.t!=='tieni')tieni(s,l,m,Q,m.x,m.y);return}
    // a gittata ×0,9 dal nemico più vicino, ma mai davanti ai propri fanti
    const dx=(m.x-e.x)/e.d,dy=(m.y-e.y)/e.d;let ax=e.x+dx*g,ay=e.y+dy*g;const fp=fantiPr(Q);if(fp!=null&&prog(Q,ay)>fp-3)ay=daProg(Q,fp-3);
    tieni(s,l,m,Q,ax,ay)}},
  {id:'contro',rango:2,tipo:['f'],
   vale:(Q,m)=>{const t=minacce(Q,m);return t.cav?2.5:t.tiro?1.2:0},
   ordina:(s,l,m,Q)=>{tieni(s,l,m,Q,m.x,m.y,minacce(Q,m).cav?'serrata':'larga')}},
  {id:'ripiega',rango:2,tipo:['t','c'],
   // solo se nessun reparto amico non-tiratore sta tra il tiratore e il nemico che arriva
   vale:(Q,m)=>m.nm&&m.nm.d<=K.RIPIEGA&&m.ti>.5&&!Q.rep.some(q=>q.c!=='t'&&d2(q,m.nm)<m.nm.d)?1.5:0,
   ordina:(s,l,m,Q)=>{tieni(s,l,m,Q,m.x,m.y-Q.ver*K.INDIETRO)}},
  {id:'debole',rango:2,tipo:['f','t','c'],
   vale:(Q,m)=>{const e=bersaglio(Q);return e?.4+(100-e.mo)/100*(e.mo<45?1.2:.4):0},
   ordina:(s,l,m,Q)=>{const e=bersaglio(Q);if(e)tieni(s,l,m,Q,e.x,e.y)}},
  {id:'copri',rango:2,tipo:['c'],
   vale:(Q,m)=>{const t=Q.rep.filter(q=>q.c==='t'&&q.min>0);return t.length?1.3:0},
   ordina:(s,l,m,Q)=>{let b=null;for(const q of Q.rep)if(q.c==='t'&&q.min>0&&(!b||q.min>b.min))b=q;if(!b||!b.nm)return;
    const dx=(b.nm.x-b.x)/Math.max(1,b.nm.d),dy=(b.nm.y-b.y)/Math.max(1,b.nm.d);tieni(s,l,m,Q,b.x+dx*5,b.y+dy*5)}},
  {id:'insegui',rango:2,tipo:['c'],
   vale:(Q,m)=>Q.fug>3?1.4:0,
   ordina:(s,l,m,Q)=>{const nl=Q.l==='a'?'b':'a';let x=0,y=0,n=0;for(const u of s.u)if(u.l===nl&&u.st==='fuga'&&!u.cap){x+=u.x;y+=u.y;n++}if(n)tieni(s,l,m,Q,x/n,y/n)}},
  {id:'attendi',rango:2,tipo:['c'],
   vale:(Q,m)=>Q.rep.some(q=>q.c==='f'&&q.nm&&q.nm.d<=9)?.2:K.CAVATT,
   ordina:(s,l,m,Q)=>{const fp=fantiPr(Q);tieni(s,l,m,Q,Q.xi+(m.x>=Q.xi?1:-1)*K.LATO,fp!=null?daProg(Q,fp-3):m.y)}}];
 // cosa minaccia un reparto di fanti: cavalli entro 15 (serrata) o frecce senza nessuno in mischia vicina (larga, ma non per le picche)
 function minacce(Q,m){let cav=false,tiro=false,vicino=false;for(const e of Q.nem){const d=d2(m,e);if(e.c==='c'&&e.n>2&&d<=K.CONTRO)cav=true;if(e.ti>.5&&d<=e.git*1.05)tiro=true;if(e.ti<=.5&&d<12)vicino=true}return{cav,tiro:tiro&&!vicino&&m.pi<=.5}}   // un blocco di picche non si apre mai
 // il reparto nemico più debole di morale (a pari morale, il più piccolo)
 function bersaglio(Q){let b=null;for(const e of Q.nem)if(!b||e.mo<b.mo||(e.mo===b.mo&&e.fo<b.fo))b=e;return b}
 // ---------- decidere ----------
 const peso=(tab,id)=>{if(!tab)return 1;const v=tab[id];return v!=null?v:tab['*']!=null?tab['*']:1};
 function decidi(s,l){const rg=Math.max(0,Math.min(5,s.rango[l]|0));if(!s.cons)s.cons={};const c=s.cons[l]||(s.cons[l]={t:-1e9,man:{}});
  if(s.t-c.t<K.RIFL[rg])return;
  if(!I.vivi(s,l).length||!I.vivi(s,l==='a'?'b':'a').length)return;
  const Q=quadro(s,l),dot=D.DOTTRINE[s.dott&&s.dott[l]],ind=(D.INDOLE[s.indole&&s.indole[l]]||{}).p;c.t=s.t;Q.man={};
  const nuovi={};
  for(const m of Q.rep){let best=null,bs=-1e9;
   for(const mv of MANOVRE){if(mv.rango>rg||mv.tipo.indexOf(m.c)<0)continue;const v=mv.vale(Q,m);if(!(v>0))continue;
    const sc=v*peso(dot,mv.id)*peso(ind,mv.id)+s.r()*K.ERR[rg]+(c.man[m.k]===mv.id?K.ISTERESI:0);
    if(sc>bs){bs=sc;best=mv}}
   if(best){nuovi[m.k]=best;Q.man[m.k]=best.id;m.nuova=c.man[m.k]!==best.id}}
  for(const m of Q.rep){const mv=nuovi[m.k];if(!mv)continue;mv.ordina(s,l,m,Q);
   if(m.nuova){c.man[m.k]=mv.id;s.ev.push({t:'piano',l,r:m.r,m:mv.id})}}}
 // un istante di comando per i due lati: col rango decide il consiglio (negli assedi e in lizza resta il `comanda` di sempre), senza rango il `comanda`
 function turno(s){for(const l of s.autoA?['b','a']:['b']){if(s.rango[l]!=null&&!s.muro&&s.tipo!=='arena')API.decidi(s,l);else if(s.t%20===1)I.comanda(s,l)}}
 // all'avvio della battaglia: rango, dottrina e indole dalla scheda, poi lo schieramento dell'IA (se il lato `a` schiera da sé, `Pronto` fa rischierare il `b`: 28m)
 function avvia(s,scheda){s.rango=Object.assign({},scheda.rango);if(scheda.dott)s.dott=Object.assign({},scheda.dott);if(scheda.indole)s.indole=Object.assign({},scheda.indole);
  if(!(s.esp&&s.primo==='a')||s.autoA)schiera(s,'b');if(s.autoA)schiera(s,'a')}
 // soglia di rotta: l'indole del signore la sposta
 const soglia=(s,l)=>(D.INDOLE[s.indole&&s.indole[l]]||{}).rotta||0;
 // ---------- schieramento dell'IA ----------
 // rango 0-1: tutto al centro; rango 2: i tiratori dietro i fanti, i cavalieri ai lati. Dal passo 25 i ranghi alti leggono il terreno e lo schieramento avversario
 function schiera(s,l){if(!s.rango||s.rango[l]==null||(l==='a'&&!s.autoA)||s.tipo==='arena'||s.muro||s.t>0)return;const rg=s.rango[l]|0,o=s.ord[l],ver=l==='a'?1:-1,cx=s.W/2;
  if(rg<=1){for(const k of chiavi(o)){o[k].x=cx;if(repC(o[k],k)==='c')o[k].y=o.f.y+ver*2}}
  else{let lato=1;for(const k of chiavi(o)){const g=repC(o[k],k);if(g==='t'){o[k].x=cx;o[k].y=o.f.y+ver*7}else if(g==='c'){o[k].x=cx+lato*K.LATO;o[k].y=o.f.y+ver*2;lato=-lato}}}
  for(const k of chiavi(o))I.rimetti(s,l,k);
  // le ondate dell'IA (se la battaglia le permette): tutta la riserva entra dal retro quando la linea cala al 60%
  if(s.ondOk&&rg<=2&&s.ond[l]&&!s.ond[l].length){const tr=[];for(const x of s.ris[l])tr.push({t:x.t,n:x.n,p:x.p});
   if(tr.length){const r=VCAM.preparaOndata(s,{l,id:'ia',tr,ing:'retro',quando:{k:'linea',v:60},ord:'carica'});if(r&&r.err)return}}}
 const API={quadro,decidi,turno,avvia,schiera,soglia,MANOVRE,peso};return API})();
