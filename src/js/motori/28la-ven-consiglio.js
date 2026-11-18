/* ---- Compagnia di ventura, consiglio di guerra (passo 21): il nemico guarda il campo e sceglie tra le manovre che conosce. ----
   Il rango (0-5) decide quante manovre conosce, ogni quanto ci ripensa e quanto sbaglia; dottrina del regno e indole del signore pesano le scelte.
   `VCAM` lo chiama solo se la battaglia ha `s.rango` (scheda `rango:{a,b}`): senza, resta il `comanda` di sempre. Il passo 25 aggiunge le manovre dei ranghi 3 e 4 (altura, aggiramento, riserve, rotazione, trappole, caccia al capitano, ritirata), il 30 il maestro di guerra.
   Motore puro: nessun Math.random, Date.now o trigonometria. Dopo 28l (VCAM), prima di 28m. */
// RIFL = istanti tra due decisioni, ERR = rumore sul valore, ISTERESI = quanto deve valere di più una manovra nuova per scalzare quella in corso, AV = passo dell'avanzata,
// MINACCIA = raggio entro cui un nemico pesa, GITT = quota della gittata a cui tirano i tiratori, RIPIEGA/CONTRO/INDIETRO = distanze di `ripiega` e `contro`, LATO = scarto dei cavalieri sul fianco.
// Valori delle manovre: PAZIENZA = fino a quale istante conviene aspettare il nemico, ASPETTA/CAVTI = valore di `tieni` lontano dal nemico (fanti e tiratori / cavalieri),
// CAVAV = `avanza` dei cavalieri, CAVATT = `attendi`, FIANCO = bonus di `carica` dei cavalieri quando i fanti sono già in mischia. Tarati con la scala dei ranghi (tests/test_ven_p21_lento.js).
// Ranghi 3-4 (passo 25): DIVIDI = quanti fanti servono perché l'IA li schieri in due reparti (reparti piccoli perdono il morale più in fretta), PRENDI_AV/PRENDI_D = quanto oltre i fanti e a che distanza i tiratori vanno a prendere un'altura, AGGIRA/AGGIRA_V = scarto largo dal fianco nemico e valore del giro (pari alla carica: lo preferiscono le dottrine che lo amano), ROT_FA/ROT_FRESCO/ROT_D/ROT_ARR = fatica per dare il cambio, chi lo prende e a che distanza, quanto arretra chi esce;
// SERRA_T = istanti massimi di attesa davanti ad acqua o bosco sotto il tiro; RISERVA_T/RISERVA_MOR/RISERVA_LINEA = quando le riserve entrano comunque (istante, morale di un reparto nemico, linea rimasta);
// ESCA_AV/ESCA_OLTRE/ESCA_D/ESCA_COLPO = quanto avanza l'esca, di quanto deve inseguire oltre la sua linea, a che distanza e da che distanza il nascosto carica; INC_T/INC_D = istanti di mischia dei fanti prima del colpo alle spalle e distanza a cui i fanti devono avere il nemico perché l'incudine parta;
// PIANO_T/PIANO_PAUSA = durata massima di una trappola e pausa tra due; CACCIA_MAX/CACCIA_PAUSA = tetto della caccia al capitano; RIT_R/RIT_MAX/RIT_DA/RIT_T = ritirata (forze, tetto con l'indole, istante minimo, istanti per ripiegare);
// ONDA_T = istante della prima ondata di rango 4, ONDE_Q = quota di truppe tenuta in ondate dai ranghi alti.
VDAT.CONS={RIFL:[60,40,30,20,15,10],ERR:[.6,.45,.3,.18,.1,.04],ISTERESI:.15,AV:12,MINACCIA:15,GITT:.9,RIPIEGA:9,CONTRO:15,INDIETRO:10,LATO:17,PAZIENZA:360,ASPETTA:.72,CAVTI:.72,CAVAV:.5,CAVATT:.6,FIANCO:.3,
 DIVIDI:30,PRENDI_AV:6,PRENDI_D:28,AGGIRA:12,AGGIRA_V:1,ROT_FA:65,ROT_FRESCO:40,ROT_D:25,ROT_ARR:10,SERRA_T:150,RISERVA_T:900,RISERVA_MOR:35,RISERVA_LINEA:40,ESCA_AV:16,ESCA_OLTRE:10,ESCA_D:16,ESCA_COLPO:8,INC_T:40,INC_D:24,PIANO_T:450,PIANO_PAUSA:300,
 CACCIA_MAX:120,CACCIA_PAUSA:120,CACCIA_ESP:8,RIT_R:.5,RIT_MAX:.7,RIT_DA:150,RIT_T:160,ONDA_T:300,ONDA3_T:0,ONDE_Q:.3};
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
  const cn=s.u.find(u=>u.l===nl&&u.cap&&u.st==='vivo');Q.cap=cn?!Q.nem.some(e=>d2(cn,e)<=K.CACCIA_ESP):false;Q.cx=cn?{x:cn.x,y:cn.y}:null;
  Q.xi=Q.rep.length?Q.rep.reduce((a,m)=>a+m.x*m.n,0)/Q.rep.reduce((a,m)=>a+m.n,0):s.W/2;
  Q.rg=s.rango&&s.rango[l]!=null?s.rango[l]|0:0;Q.mr=!!s.mr;
  if(Q.rg>=3)alti(s,Q);
  return Q}
 // dati dei ranghi 3-4: zone da prendere, reparto nemico più impegnato, coppie per il cambio di fatica, miglior reparto di cavalieri
 function alti(s,Q){Q.zone=zonePrendi(s,Q.l);Q.imp=null;for(const e of Q.nem)if(e.nd<=9&&(!Q.imp||e.fo>Q.imp.fo))Q.imp=e;
  Q.mc=null;for(const m of Q.rep)if(m.c==='c'&&(!Q.mc||m.fo>Q.mc.fo))Q.mc=m}
 // cambi di fatica: un reparto stanco (fatica > ROT_FA) e uno fresco dello stesso tipo che gli sta dietro si scambiano una volta sola. Il cambio si ricorda in `s.cons[l].rt`
 // (ancora del primo, dove arretra, chi lo sostituisce) finché lo stanco non ha ripreso fiato, così le ancore non inseguono i reparti mentre si muovono
 function rotazioni(s,Q,c){const rt=c.rt||(c.rt={});
  for(const k of Object.keys(rt)){const r=rt[k],m=Q.rep.find(q=>String(q.k)===k);if(!m||!Q.rep.some(q=>q.k===r.p)||m.fa<=K.ROT_FA-25||s.t-r.t0>K.PIANO_T)delete rt[k]}
  const occ=new Set();for(const k of Object.keys(rt)){occ.add(k);occ.add(String(rt[k].p))}
  for(const m of Q.rep){if(rt[m.k]||occ.has(String(m.k))||!(m.fa>K.ROT_FA))continue;let b=null;
   for(const q of Q.rep)if(q!==m&&!occ.has(String(q.k))&&q.c===m.c&&q.fa<=K.ROT_FRESCO&&prog(Q,q.y)<prog(Q,m.y)&&d2(q,m)<=K.ROT_D&&(!b||q.fa<b.fa))b=q;
   if(b){rt[m.k]={p:b.k,x:m.x,y:m.y,ey:m.y-Q.ver*K.ROT_ARR,t0:s.t};occ.add(String(m.k));occ.add(String(b.k))}}
  for(const k of Object.keys(rt)){const r=rt[k],m=Q.rep.find(q=>String(q.k)===k),b=Q.rep.find(q=>q.k===r.p);m.rot={esce:true,x:r.x,y:r.ey};b.rot={esce:false,x:r.x,y:r.y}}}
 // altura o bosco nella propria metà o nel terzo centrale del campo
 function zonePrendi(s,l){const out=[];for(const z of I.ZONE(s)){if(z.k!=='altura'&&z.k!=='bosco')continue;const mia=l==='a'?z.y>=s.H/2:z.y<=s.H/2;if(mia||(z.y>=s.H/3&&z.y<=2*s.H/3))out.push(z)}return out}
 const dentro=(z,x,y)=>{const a=(x-z.x)/z.rx,b=(y-z.y)/z.ry;return a*a+b*b<1};
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
   ordina:(s,l,m,Q)=>{const fp=fantiPr(Q);tieni(s,l,m,Q,Q.xi+(m.x>=Q.xi?1:-1)*K.LATO,fp!=null?daProg(Q,fp-3):m.y)}},
  // ---------- rango 3 ----------
  // i tiratori salgono sull'altura (o nel bosco) della propria metà; se tengono già la zona restano e tirano
  {id:'prendi',rango:3,tipo:['t'],
   // mai davanti ai propri fanti (oltre PRENDI_AV passi) né troppo lontano: da soli sull'altura i tiratori verrebbero presi
   vale:(Q,m)=>{const z=zonaDi(Q,m);if(!z||m.fr===0)return 0;if(dentro(z,m.x,m.y))return 1.05;const fp=fantiPr(Q);if(fp==null||prog(Q,z.y)>fp+K.PRENDI_AV||d2(m,z)>K.PRENDI_D)return 0;
    return m.nm&&m.nm.d<=m.git*1.1?(d2(m,z)<8?1.1:0):m.nm&&m.nm.d<=K.RIPIEGA?0:1.25},
   ordina:(s,l,m,Q)=>{const z=zonaDi(Q,m);if(z)tieni(s,l,m,Q,z.x,z.y)}},
  // i cavalieri girano largo e cadono sul fianco (o sul retro) del reparto nemico più impegnato: prima il giro, poi la carica
  {id:'aggira',rango:3,tipo:['c'],
   vale:(Q,m)=>Q.mr&&Q.imp&&Q.rep.some(q=>q.c==='f'&&q.nm&&q.nm.d<=9)?K.AGGIRA_V:0,
   ordina:(s,l,m,Q,c)=>{const e=Q.imp;if(!e)return;const ag=c.ag||(c.ag={});if(m.nuova)ag[m.k]=0;
    if(!ag[m.k]){const w=giro(s,e,m,Q.l,0);if(d2(m,w)<=5)ag[m.k]=1;else{tieni(s,l,m,Q,w.x,w.y);return}}
    s.ord[l][m.k].t='carica'}},
  // un reparto stanco lascia il posto, quello fresco che gli sta dietro prende la sua ancora
  {id:'rotazione',rango:3,tipo:['f','t','c'],
   vale:(Q,m)=>m.rot?1.45:0,
   ordina:(s,l,m,Q)=>{const r=m.rot;if(r)tieni(s,l,m,Q,r.x,r.y)}},
  // non si attraversano acqua o bosco sotto il tiro nemico: si aspetta (al massimo SERRA_T istanti). Non sceglie reparti: corregge l'ordine già dato (`filtra`)
  {id:'serra',rango:3,tipo:[],
   filtra:(s,l,m,Q,c)=>{const o=s.ord[l][m.k];let tx,ty;if(o.t==='tieni'){tx=o.x;ty=o.y}else if(o.t==='carica'&&m.nm){tx=m.nm.x;ty=m.nm.y}else return;
    const sr=c.sr||(c.sr={}),zona=(x,y)=>VCAM.acqua(s,x,y)||VCAM.copre(s,x,y)==='bosco';
    if(zona(m.x,m.y)){delete sr[m.k];return}
    for(let i=1;i<=4;i++){const x=m.x+(tx-m.x)*i/4,y=m.y+(ty-m.y)*i/4;if(!zona(x,y)||!Q.nem.some(e=>e.ti>.5&&e.fr!==0&&d2(e,{x,y})<=e.git*1.05))continue;
     if(sr[m.k]==null){sr[m.k]=s.t;s.ev.push({t:'piano',l,r:m.r,m:'serra'})}
     if(s.t-sr[m.k]<K.SERRA_T)tieni(s,l,m,Q,m.x,m.y);return}
    delete sr[m.k]}},
  // le ondate della riserva entrano quando è entrata l'ultima ondata nemica o un reparto nemico cede (o, per non restare fermi, a linea calata o a tempo scaduto); dall'ingresso più vicino a quel reparto
  {id:'riserva',rango:3,tipo:[],
   globale:(s,l,Q,c)=>{if(!s.ond||!s.ond[l])return;const nl=l==='a'?'b':'a',W=s.ond[l].filter(w=>!w.fatta&&w.id==='riserva');if(!W.length)return;
    const nem=s.ond[nl]||[];let deb=null;for(const e of Q.nem)if(e.mo<K.RISERVA_MOR&&(!deb||e.mo<deb.mo))deb=e;
    const fine=nem.length>0&&nem.every(w=>w.fatta),linea=s.in0&&I.vivi(s,l).length*100<K.RISERVA_LINEA*s.in0[l];
    if(!(fine||deb||linea||s.t>=K.RISERVA_T))return;
    for(const w of W){if(!s.muro&&w.fi!==2){if(Q.rg>=4){w.ing=fiancoDebole(s,Q);w.fi=1}else w.ing=ingressoVicino(s,l,deb||Q.imp)}VCAM.ondata(s,{l,id:w.id})}
    s.ev.push({t:'piano',l,r:-1,m:'riserva'})}},
  // ---------- rango 4 ----------
  // trappola: il reparto più debole avanza da solo; chi lo insegue oltre la sua linea viene preso di fianco dal reparto nascosto
  {id:'esca',rango:4,tipo:['f','c'],muta:true,
   vale:(Q,m)=>{const p=Q.pl;return p&&p.m==='esca'?(m.k===p.k?1.5:m.c==='c'?(p.fase===1?1.6:1.2):0):0},
   ordina:(s,l,m,Q)=>{const p=Q.pl;if(m.k!==p.k&&p.fase===0){const fp=fantiPr(Q);tieni(s,l,m,Q,Q.xi+(m.x>=Q.xi?1:-1)*K.LATO,fp!=null?daProg(Q,fp-3):m.y);return}   // nascosto: di lato, fermo, come `attendi`
    if(m.k!==p.k){if(d2(m,p.ex)<K.ESCA_COLPO)s.ord[l][m.k].t='carica';else tieni(s,l,m,Q,p.ex.x,p.ex.y);return}
    if(p.fase===0)tieni(s,l,m,Q,m.x,daProg(Q,Math.min(prog(Q,m.y)+K.AV,prog(Q,p.home.y)+K.ESCA_AV)));else tieni(s,l,m,Q,p.home.x,p.home.y)}},
  // incudine e martello: i fanti inchiodano il reparto più forte, i cavalieri aspettano alle sue spalle e colpiscono dopo INC_T istanti di mischia
  {id:'incudine',rango:4,tipo:['f','c'],
   vale:(Q,m)=>{const p=Q.pl;return p&&p.m==='incudine'&&(m.c==='c'||m.k===p.k)?1.4:0},
   ordina:(s,l,m,Q)=>{const p=Q.pl,e=Q.nem.find(q=>q.k===p.tg);if(!e)return;
    if(m.c==='f')tieni(s,l,m,Q,e.x,e.y);else if(p.col)s.ord[l][m.k].t='carica';else{const w=giro(s,e,m,Q.l,1);tieni(s,l,m,Q,w.x,w.y)}}},
  // caccia al capitano esposto: il miglior reparto di cavalieri gli va addosso, mai più di CACCIA_MAX istanti di fila
  {id:'caccia',rango:4,tipo:['c'],
   vale:(Q,m,s,c)=>Q.cap&&Q.cx&&m===Q.mc&&(!c.cc||s.t-c.cc.t0<K.CACCIA_MAX||s.t-c.cc.t0>=K.CACCIA_MAX+K.CACCIA_PAUSA)?1.8:0,
   ordina:(s,l,m,Q,c)=>{if(!Q.cx)return;if(!c.cc||s.t-c.cc.t0>=K.CACCIA_MAX+K.CACCIA_PAUSA)c.cc={t0:s.t};
    if(d2(m,Q.cx)<6)s.ord[l][m.k].t='carica';else tieni(s,l,m,Q,Q.cx.x,Q.cx.y)}},
  // le ondate entrano dal fianco opposto a dove il nemico ha la cavalleria (senza cavalleria, dal suo fianco più debole); il segno esce quando l'ondata entra
  {id:'fianco',rango:4,tipo:[],
   globale:(s,l,Q,c)=>{if(!s.ond||!s.ond[l]||s.muro)return;const ing=fiancoDebole(s,Q);
    for(const w of s.ond[l]){if(w.fatta){if(w.fi===1&&!w.fe){w.fe=1;s.ev.push({t:'piano',l,r:-1,m:'fianco'})}continue}if(w.fi===2)continue;w.ing=ing;w.fi=1}}},
  // forze sotto la metà delle nemiche, riserve comprese, e nessuna ondata rimasta: tutti ripiegano in ordine verso il proprio bordo, coperti da un reparto in serrata (`ritira`)
  {id:'ritirata',rango:4,tipo:[]}];
 const FILTRI=MANOVRE.filter(m=>m.filtra),GLOBALI=MANOVRE.filter(m=>m.globale);
 // zona migliore per un reparto di tiratori (l'altura vale più del bosco)
 function zonaDi(Q,m){let b=null,bd=1e9;for(const z of Q.zone||[]){const d=d2(m,z)-(z.k==='altura'?8:0);if(d<bd){bd=d;b=z}}return b}
 // il punto del giro largo: a AGGIRA passi oltre il fianco del reparto nemico (`dietro`: alle sue spalle)
 function giro(s,e,m,l,dietro){const sg=m.x>=e.x?1:-1,hw=Math.min(8,.9*rad(e.n)),ver=l==='a'?-1:1;let x=e.x+sg*(K.AGGIRA+hw);if(x<2||x>s.W-2||VCAM.acqua(s,x,e.y))x=e.x-sg*(K.AGGIRA+hw);
  return{x:stretto(x,2,s.W-2),y:e.y+(dietro?ver*10:0)}}
 // l'ingresso (fsx, fdx, retro) più vicino a un reparto nemico
 function ingressoVicino(s,l,e){if(!e)return'retro';const d=[['fsx',d2(e,{x:2,y:s.H/2})],['fdx',d2(e,{x:s.W-2,y:s.H/2})],['retro',d2(e,{x:s.W/2,y:l==='a'?s.H-2:2})]];d.sort((a,b)=>a[1]-b[1]);return d[0][0]}
 // fianco da cui entrare: opposto a dove sta la cavalleria nemica, o quello dove il nemico è più debole
 function fiancoDebole(s,Q){let cx=0,nc=0,sx=0,dx=0;for(const e of Q.nem){if(e.c==='c'){cx+=e.x*e.n;nc+=e.n}if(e.x<s.W/2)sx+=e.fo;else dx+=e.fo}
  if(nc)return cx/nc<s.W/2?'fdx':'fsx';return sx<=dx?'fsx':'fdx'}
 // quanto un reparto avanza oltre la linea da cui è partito (la sua linea dei fanti alla nascita)
 const oltre=(s,Q,e)=>Q.l==='a'?e.y-20:s.H-20-e.y;
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
  if(rg>=3)rotazioni(s,Q,c);
  if(rg>=4&&ritira(s,l,Q,c,ind))return;
  if(rg>=4)pianifica(s,l,Q,c,dot,ind);
  const nuovi={};
  for(const m of Q.rep){let best=null,bs=-1e9;
   for(const mv of MANOVRE){if(mv.rango>rg||mv.tipo.indexOf(m.c)<0)continue;const v=mv.vale(Q,m,s,c);if(!(v>0))continue;
    const sc=v*peso(dot,mv.id)*peso(ind,mv.id)+s.r()*K.ERR[rg]+(c.man[m.k]===mv.id?K.ISTERESI:0);
    if(sc>bs){bs=sc;best=mv}}
   if(best){nuovi[m.k]=best;Q.man[m.k]=best.id;m.nuova=c.man[m.k]!==best.id}}
  for(const m of Q.rep){const mv=nuovi[m.k];if(!mv)continue;mv.ordina(s,l,m,Q,c);
   if(m.nuova){c.man[m.k]=mv.id;if(!mv.muta)s.ev.push({t:'piano',l,r:m.r,m:mv.id})}
   if(rg>=3)for(const f of FILTRI)f.filtra(s,l,m,Q,c)}
  if(rg>=3)for(const g of GLOBALI)if(g.rango<=rg)g.globale(s,l,Q,c)}
 // ritirata (rango 4): vedi la manovra. Restituisce vero finché il lato ripiega (e non decide altro)
 function ritira(s,l,Q,c,ind){if(s.ordinata===l)return true;let r=c.rit;
  if(!r){if(!(Q.R<Math.min(K.RIT_MAX,K.RIT_R*peso(ind,'ritirata'))&&Q.onde===0&&I.inOnda(s,l)===0&&s.t>=K.RIT_DA&&!s.muro&&s.tipo!=='arena'))return false;
   let cop=null;for(const m of Q.rep)if(m.c!=='c'&&(!cop||(m.c==='f'&&cop.c!=='f')||(m.c===cop.c&&m.fo>cop.fo)))cop=m;
   r=c.rit={t0:s.t,cop:cop?cop.k:null};s.ev.push({t:'piano',l,r:-1,m:'ritirata'})}
  const bordo=l==='a'?s.H-4:4;let arrivati=true;
  for(const m of Q.rep){if(m.k===r.cop){tieni(s,l,m,Q,m.x,m.y,'serrata');continue}
   const y=bordo+(m.c==='f'?Q.ver*4:0);tieni(s,l,m,Q,m.x,y);if(Math.abs(m.y-y)>10)arrivati=false}
  if(arrivati||s.t-r.t0>=K.RIT_T)finisci(s,l);
  return true}
 // la rotta in ordine: come quella dei reparti spezzati, ma voluta (gli uomini sono già al bordo); il riepilogo porta `ordinata`
 function finisci(s,l){for(const u of s.u)if(u.l===l&&u.st==='vivo'&&!u.cap){if(u.sal>s.t&&u.scI>=0)s.scalaT[u.scI]=0;u.sal=0;u.st='fuga'}
  s.ris[l]=[];if(s.ond)s.ond[l]=[];s.ordinata=l;s.ev.push({t:'rotta',l,ordinata:true});
  if(l==='a'&&s.autoA&&!s.fine){s.fine={vince:'b',t:s.t};s.ev.push({t:'fine',vince:'b'})}}
 // trappole del rango 4: un piano alla volta (esca o incudine), con la sua durata e una pausa tra due. Sta in `s.cons[l].pl` (JSON)
 function pianifica(s,l,Q,c,dot,ind){let p=c.pl;
  if(p&&(s.t-p.t0>K.PIANO_T||!Q.rep.some(m=>m.k===p.k)||(p.m==='incudine'&&(!Q.nem.some(e=>e.k===p.tg)||(p.col&&s.t-p.col>3*K.INC_T)))||(p.m==='esca'&&p.fase===1&&s.t-p.t1>200))){c.plF=s.t;p=c.pl=null}
  if(!p&&s.t-(c.plF==null?-1e9:c.plF)>=K.PIANO_PAUSA)p=c.pl=nuovoPiano(s,l,Q,dot,ind);
  Q.pl=p;if(!p)return;
  const m=Q.rep.find(q=>q.k===p.k);
  if(p.m==='esca'&&p.fase===1){const ch=Q.nem.reduce((a,e)=>!a||d2(e,m)<d2(a,m)?e:a,null);if(ch)p.ex={x:ch.x,y:ch.y}}   // il reparto nascosto segue l'inseguitore
  if(p.m==='esca'&&p.fase===0){const ch=Q.nem.find(e=>oltre(s,Q,e)>K.ESCA_OLTRE&&d2(e,m)<=K.ESCA_D);
   if(ch){p.fase=1;p.t1=s.t;p.ex={x:ch.x,y:ch.y};const w=s.ond&&s.ond[l]&&s.ond[l].find(x=>!x.fatta&&x.id==='riserva');   // una riserva ancora fuori è il reparto nascosto
    if(w&&!s.muro){w.ing=ingressoVicino(s,l,ch);w.fi=2;VCAM.ondata(s,{l,id:w.id})}}}
  if(p.m==='incudine'){const e=Q.nem.find(q=>q.k===p.tg);
   if(m&&e&&m.nm&&m.nm.d<=9&&m.nm.r===e.r){if(p.mi==null)p.mi=s.t}else p.mi=null;
   if(p.mi!=null&&!p.col&&s.t-p.mi>=K.INC_T)p.col=s.t}}
 function nuovoPiano(s,l,Q,dot,ind){const F=Q.rep.filter(m=>m.c==='f'),Cv=Q.rep.filter(m=>m.c==='c'),rn=s.ond&&s.ond[l]&&s.ond[l].some(w=>!w.fatta&&w.id==='riserva');let best=null,bs=0;
  if(!Q.mr)return null;   // le trappole contano per il morale dei reparti: senza reparti non servono
  const v0=(id,b)=>b*peso(dot,id)*peso(ind,id)+s.r()*K.ERR[Q.rg];
  if(F.length>=2&&(Cv.length||rn)&&!Q.rep.some(m=>m.nm&&m.nm.d<=12)){const es=F.reduce((a,m)=>m.fo<a.fo?m:a),v=v0('esca',1.2+(Q.nem.some(e=>e.c==='c')?.2:0));
   if(v>bs){bs=v;best={m:'esca',k:es.k,t0:s.t,fase:0,home:{x:es.x,y:es.y}}}}
  // l'incudine parte quando i fanti stanno per toccare il nemico: il reparto più forte tra quelli che hanno davanti a K.INC_D passi
  const vicini=Q.nem.filter(e=>F.some(m=>d2(m,e)<=K.INC_D));
  if(F.length&&Cv.length&&vicini.length){const tg=vicini.reduce((a,e)=>e.fo>a.fo?e:a),fm=F.reduce((a,m)=>d2(m,tg)<d2(a,tg)?m:a),v=v0('incudine',1.1+(Q.R>=.9?.1:0));
   if(v>bs){bs=v;best={m:'incudine',k:fm.k,tg:tg.k,t0:s.t,mi:null,col:0}}}
  return best}
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
  else if(rg===2){let lato=1;for(const k of chiavi(o)){const g=repC(o[k],k);if(g==='t'){o[k].x=cx;o[k].y=o.f.y+ver*7}else if(g==='c'){o[k].x=cx+lato*K.LATO;o[k].y=o.f.y+ver*2;lato=-lato}}}
  else{const fl=schieraAlto(s,l);if(s.ondOk&&s.ond[l]&&!s.ond[l].length)ondateAlto(s,l,rg,fl)}
  for(const k of chiavi(o))I.rimetti(s,l,k);
  // le ondate dell'IA (se la battaglia le permette): tutta la riserva entra dal retro quando la linea cala al 60%
  if(s.ondOk&&rg<=2&&s.ond[l]&&!s.ond[l].length){const tr=[];for(const x of s.ris[l])tr.push({t:x.t,n:x.n,p:x.p});
   if(tr.length){const r=VCAM.preparaOndata(s,{l,id:'ia',tr,ing:'retro',quando:{k:'linea',v:60},ord:'carica'});if(r&&r.err)return}}}
 // rango 3-4: fanti in due reparti (se la battaglia ha i reparti e sono abbastanza), tiratori sull'altura della propria metà, cavalieri ai lati.
 // Chi si schiera per secondo guarda il nemico: picche o serrata contro la sua cavalleria, cavalieri e ondata dal lato dove è più debole. Restituisce l'ingresso del lato debole (fsx/fdx) o null
 function schieraAlto(s,l){const o=s.ord[l],nl=l==='a'?'b':'a',ver=l==='a'?1:-1,W=s.W,H=s.H,cx=W/2,primo=(s.primo||'a')===l,dot=D.DOTTRINE[s.dott&&s.dott[l]];
  if(s.rep&&chiavi(o).filter(k=>repC(o[k],k)==='f').length===1&&s.u.filter(u=>u.l===l&&!u.cap&&u.st==='vivo'&&chiave(u)==='f').length>=K.DIVIDI)VCAM.dividi(s,{l,r:0});
  const ks=chiavi(o),F=ks.filter(k=>repC(o[k],k)==='f'),T=ks.filter(k=>repC(o[k],k)==='t'),Cv=ks.filter(k=>repC(o[k],k)==='c'),fy=o.f.y;
  let alt=null;if(peso(dot,'prendi')>=1)for(const z of I.ZONE(s))if(z.k==='altura'&&(l==='a'?z.y>=H/2:z.y<=H/2)&&(!alt||Math.abs(z.x-cx)<Math.abs(alt.x-cx)))alt=z;
  let cavX=null,deb=null;
  if(!primo){const L=s.u.filter(u=>u.l===nl&&u.st==='vivo'&&!u.cap);let nc=0,sx=0,dx=0;
   for(const u of L){if(u.c==='c'){cavX=(cavX||0)+u.x;nc++}if(u.x<cx)sx++;else dx++}
   if(nc)cavX/=nc;if(Math.abs(sx-dx)>.3*(sx+dx))deb=sx<dx?'sx':'dx'}
  F.forEach((k,i)=>{o[k].x=stretto((alt?alt.x:cx)+(i-(F.length-1)/2)*(alt?12:16),4,W-4);if(alt)o[k].y=alt.y-ver*5});
  T.forEach(k=>{o[k].x=alt?alt.x:cx;o[k].y=alt?alt.y:fy+ver*7});
  if(cavX!=null&&F.length>=2){let pk=F[0],pp=-1;for(const k of F){const L=s.u.filter(u=>u.l===l&&!u.cap&&u.st==='vivo'&&chiave(u)===k),p=L.filter(u=>D.aspetto(u.t).arma==='picca').length/Math.max(1,L.length);if(p>pp){pp=p;pk=k}}
   o[pk].x=stretto(cavX,4,W-4);o[pk].fm='serrata';o[pk].fmT=0}
  Cv.forEach((k,i)=>{o[k].x=deb?stretto((deb==='sx'?W*.2:W*.8)+(i%2?6:-6),4,W-4):cx+(i%2?-1:1)*K.LATO;o[k].y=fy+ver*2});
  return deb?(deb==='sx'?'fsx':'fdx'):null}
 // le ondate dei ranghi alti: ONDE_Q delle truppe (almeno la riserva) tenute fuori in due ondate; la seconda aspetta il comando della manovra `riserva`.
 // Rango 3: la prima entra dal retro a linea calata al 60%; rango 4: all'istante ONDA_T dal fianco debole del nemico
 function ondateAlto(s,l,rg,fl){const cnt={};for(const u of s.u)if(u.l===l&&!u.cap&&u.st==='vivo'&&!u.sp)cnt[u.t]=(cnt[u.t]||0)+1;for(const x of s.ris[l])cnt[x.t]=(cnt[x.t]||0)+x.n;
  const tipi=Object.keys(cnt).sort();let tot=0;for(const t of tipi)tot+=cnt[t];if(!tot)return;
  const q=Math.min(tot,Math.max(Math.round(tot*K.ONDE_Q),s.ris[l].reduce((a,x)=>a+x.n,0))),quota={};let ass=0;
  for(const t of tipi){quota[t]=Math.floor(cnt[t]*q/tot);ass+=quota[t]}
  for(let i=0;ass<q;i=(i+1)%tipi.length)if(quota[tipi[i]]<cnt[tipi[i]]){quota[tipi[i]]++;ass++}
  const w1=[],w2=[];for(const t of tipi){const a=Math.ceil(quota[t]/2);if(a>0)w1.push({t,n:a});if(quota[t]-a>0)w2.push({t,n:quota[t]-a})}
  const mk=(id,tr,ing,quando)=>{if(tr.length)VCAM.preparaOndata(s,{l,id,tr,ing,quando,ord:'carica'})};
  mk('ia',w1,rg>=4&&!s.muro?(fl||'fsx'):'retro',rg>=4?{k:'tempo',v:K.ONDA_T}:K.ONDA3_T?{k:'tempo',v:K.ONDA3_T}:{k:'linea',v:60});
  mk('riserva',w2,'retro',{k:'comando'})}
 // `riepilogo` porta `ordinata` se un lato ha ripiegato in ordine; `risolvi` lo rifà con quello nuovo (28l lo ha chiuso in sé)
 {const rie=VCAM.riepilogo;VCAM.riepilogo=s=>{const R=rie(s);if(s.ordinata)R.ordinata=true;return R};
  VCAM.risolvi=scheda=>{const s=VCAM.nuovo(scheda,{autoA:true});while(!s.fine)VCAM.passo(s,50);return VCAM.riepilogo(s)}}
 const API={quadro,decidi,turno,avvia,schiera,soglia,MANOVRE,peso};return API})();
