/* ---- Compagnia di ventura, la sorte ti getta nel mondo (passo 33). ----
   Nei mondi `s.geo===2` il regno non si sceglie: il gancio `nuovo` sposta la compagnia in un villaggio o in una locanda a caso, non vicino a un covo,
   fuori da un regno in guerra al giorno 0 e con una città entro 20 celle (più peso ai regni piccoli), le dà la dotazione della difficoltà
   (uomini della cultura del luogo) e le apre davanti un incarico vero entro 10 celle, raccontato in tre righe (`VVOC.APERTURE`, nel diario).
   Stato facoltativo: `s.inizio={lid,cult,aggancio:{k,meta,inc},testo}`. Chi recluta truppe della cultura d'origine paga il 10% in meno (gancio `fatto`).
   In compagnia i capitani stanno già tutti nella stessa compagnia: nascono insieme, a pochi passi. Ripetibile: solo il seme. Dopo 28ke, prima di 28l. */
(()=>{
 const{D,L,TU,dist,giorno,uomini,via,vicinoOk}=VEN._;
 const RAGGIO=10,CITTA=20,COVO=8,SCONTO=.1;
 // dotazione per difficoltà: monete, fanti (f1), picchieri (f2), grano; ogni socio aggiunge (come nel nucleo) 140 monete, 3+1 uomini, 3 grano
 const DOTE={recluta:{oro:350,f1:6,f2:3,grano:10},condottiero:{oro:250,f1:5,f2:2,grano:6},leggenda:{oro:150,f1:4,f2:2,grano:4}};
 const ORDINE=['covo','scorta','recluta','torneo','villaggio','affare'];
 const voc=()=>typeof VVOC!=='undefined'?VVOC:(typeof require!=='undefined'?require('./28ja-ven-voci.js'):null);
 const inGuerra0=(s,f)=>Object.keys(s.guerra).some(k=>k.split('|').includes(f));
 // gli spunti possibili attorno a un luogo: [{k, meta}] (la meta è raggiungibile a piedi)
 function spunti(s,M,l,r){
  const g=giorno(s),vic=t=>s.l.filter(x=>x.id!==l.id&&t(x)&&dist(x,l)<=RAGGIO).sort((a,b)=>dist(a,l)-dist(b,l)),ok=x=>via(M,l.x,l.y,x.x,x.y).length>0,o=[];
  const pronto=(k,lista)=>{const x=lista.find(ok);if(x)o.push({k,meta:x.id})};
  pronto('covo',vic(x=>x.tipo==='covo'&&x.g.length));
  const merc=vic(x=>x.tipo==='citta'||x.tipo==='porto').filter(ok);
  if(merc.length){o.push({k:'scorta',meta:merc[0].id});o.push({k:'affare',meta:merc[merc.length-1].id})}
  pronto('recluta',vic(x=>x.tipo==='castello'));
  pronto('torneo',vic(x=>x.tipo==='citta'&&(g+3+x.id)%7===0));
  pronto('villaggio',vic(x=>x.tipo==='villaggio'));
  return o}
 // luogo d'inizio: tre gradi di rigore, dal più stretto; il peso di un regno è l'inverso dei suoi luoghi
 function scegli(s,M,r){
  const covi=s.l.filter(l=>l.tipo==='covo'),citta=s.l.filter(l=>l.tipo==='citta'),per={};for(const l of s.l)per[l.faz]=(per[l.faz]||0)+1;
  const grado=[{guerra:true,covo:COVO},{guerra:false,covo:COVO},{guerra:false,covo:4}];
  for(const gr of grado){
   let c=s.l.filter(l=>(l.tipo==='villaggio'||l.tipo==='locanda')&&covi.every(v=>dist(v,l)>=gr.covo)&&(!gr.guerra||!inGuerra0(s,l.faz))&&citta.some(t=>dist(t,l)<=CITTA));
   while(c.length){
    const pesi=c.map(l=>1/per[l.faz]),tot=pesi.reduce((a,b)=>a+b,0);let x=r()*tot,i=0;for(;i<c.length-1;i++){if(x<pesi[i])break;x-=pesi[i]}
    const l=c[i],sp=spunti(s,M,l,r);if(sp.length)return{l,sp};c.splice(i,1)}}
  return null}
 function incarico(s,q,da){const inc=Object.assign({id:s.uid++,da,scad:giorno(s)+q.giorni},q);s.incarichi.push(inc);s.l[da].inc=Object.assign({},q,{preso:true});return inc}
 const prodotti=(s,l)=>(D.PRODUCE[VEN.cult(s,l.faz)]||D.PRODUCE.val).filter(m=>!D.MERCI[m].cibo);
 // crea l'incarico dello spunto; restituisce il suo id (null per il torneo)
 function apri(s,M,l,sp,r){
  const meta=s.l[sp.meta],tu=TU(s),g=giorno(s);
  if(sp.k==='covo'){meta.noto=true;return incarico(s,{tipo:'taglia',a:meta.id,premio:420+Math.floor(r()*200),giorni:30},l.id).id}
  if(sp.k==='scorta'||sp.k==='affare'){const beni=prodotti(s,l),m=beni[Math.floor(r()*beni.length)],n=sp.k==='affare'?5:4;
   const premio=Math.round((n*D.MERCI[m].base*.9+60+dist(meta,l)*4)*(sp.k==='affare'?1.5:1));
   tu.merci[m]=(tu.merci[m]||0)+n;return incarico(s,{tipo:'consegna',bene:m,n,a:meta.id,premio,giorni:12},l.id).id}
  if(sp.k==='recluta')return incarico(s,{tipo:'reclute',n:2,premio:260+Math.floor(r()*120),giorni:12},meta.id).id;
  if(sp.k==='villaggio'){const b=VEN.nascePredoni(s,r,[meta.x,meta.y]);b.cov=[meta.x,meta.y];
   return incarico(s,{tipo:'predoni',premio:120+Math.floor(r()*80)+g*2,giorni:6,pid:b.id},meta.id).id}
  return null}
 function testo(s,l,sp,r){
  const V=voc(),A=V&&V.APERTURE&&V.APERTURE[sp.k],tu=TU(s),meta=s.l[sp.meta];
  const t=A?A[Math.floor(r()*A.length)]:'La sorte ti getta a {luogo}, nelle terre di {regno}, con {uomini} uomini e {monete} monete.';
  const v={luogo:l.nome,regno:VEN.rg(s,l.faz).breve,uomini:uomini(tu),monete:tu.oro,meta:meta.nome};
  return t.replace(/\{([a-z]+)\}/g,(m,k)=>v[k]!=null?v[k]:m)}
 function nasce(s,o){
  if(s.geo!==2||s.inizio)return;
  const M=VEN.mappaDi(s),r=ADADI.gen({rng:ADADI.semina((s.seme^0x7a3c91d5)>>>0)}),tu=TU(s);
  const sc=scegli(s,M,r);if(!sc)return;
  const l=sc.l,sp=sc.sp[Math.floor(r()*sc.sp.length)],cult=VEN.cult(s,l.faz),ns=s.soci.length;
  // la compagnia riparte dal luogo estratto, con la dotazione della difficoltà e le truppe della sua cultura
  const d=DOTE[VEN.opz(s).diff]||DOTE.condottiero,v=vicinoOk(M,l.x+2.6,l.y+2.2);
  tu.x=v[0];tu.y=v[1];tu.via=[];tu.dentro=-1;tu.oro=d.oro+ns*140;tu.merci={grano:d.grano+ns*3,carne:2+ns};
  tu.tr=[{t:cult+'_f1',n:d.f1+ns*3,f:0,xp:0},{t:cult+'_f2',n:d.f2+ns,f:0,xp:0}];
  const inc=apri(s,M,l,sp,r),t=testo(s,l,sp,r);
  s.inizio={lid:l.id,cult,aggancio:{k:sp.k,meta:sp.meta,inc},testo:t};
  const p=s.log.findIndex(x=>/^La compagnia leva le tende/.test(x.tx));if(p>=0)s.log[p].tx='La compagnia leva le tende presso '+l.nome+'.';
  L(s,t,'bene')}
 VEN.aggancia('nuovo',(s,o)=>nasce(s,o));
 // truppe della cultura d'origine: ingaggio scontato del 10% (rimborso dopo l'acquisto)
 VEN.aggancia('fatto',(s,z)=>{if(z.a!=='assolda'||!s.inizio||!D.TR[z.t]||D.TR[z.t].faz!==s.inizio.cult)return;
  const n=Math.max(1,z.n||1),rim=Math.floor(D.INGAGGIO[D.TR[z.t].t]*n*SCONTO);if(rim>0)TU(s).oro+=rim});
 VEN.SORTE={ORDINE,RAGGIO,CITTA,COVO,DOTE}})();
