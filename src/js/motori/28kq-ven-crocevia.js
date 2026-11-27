/* ---- Compagnia di ventura, incontri del crocevia (passo 44). ----
   Nei mondi nuovi (`s.geo===2`), mentre cammini, ai crocevia e nei luoghi selvaggi capita una scena di `VVOC.CROCEVIA` (passo 42), che passa dalla coda delle voci (`VEN.accoda`).
   Si attacca ai ganci `vedi` (decide se e quale scena) ed `effetto` (uomini, merce, viveri, gusto). Nei mondi vecchi non fa nulla.
   Stato facoltativo: `s.croc={ult,visti:{id:giorno}}` (`ult` = `s.t` dell'ultima scena). Nuova: `VEN.croceviaQui(s)` → 'incrocio'|'selvaggio'|null.
   Ripetibile: niente Math.random né trigonometria. Dopo 28ke, prima di 28l. */
// tutti i numeri qui: ogni quanti giorni al minimo (OGNI), probabilità all'ora (PROB), giorni prima di rivedere la stessa scena (MEMORIA), distanza minima da un luogo per dirsi in luoghi selvaggi (LONTANO), vicini sulla strada per essere un incrocio (VICINI)
VDAT.CROCEVIA={OGNI:2,PROB:.5,MEMORIA:30,LONTANO:6,VICINI:3};
Object.assign(VEN,(()=>{
 const{D,L,TU,aggiungi,cella,dist,giorno,inGuerra,lato,limite,nemiche,notte,rnd,togliUomini,uomini,MURA}=VEN._,C=VDAT.CROCEVIA;
 const nuovoGeo=s=>s.geo===2;
 // la casella di chi gioca: 'incrocio' (una strada con almeno VICINI strade intorno), 'selvaggio' (bosco o monte lontano da ogni luogo) o null
 function tipoCasella(s,M,tu){const i=cella(M,tu.x,tu.y),G=M.G||128;
  if(M.S[i]){const cx=i%G,cy=(i-cx)/G;let n=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const x=cx+ox,y=cy+oy;if(x>=0&&y>=0&&x<G&&y<G&&M.S[y*G+x])n++}
   return n>=C.VICINI?'incrocio':null}
  if(M.T[i]===2||M.T[i]===4){for(const l of s.l)if(dist(l,tu)<C.LONTANO)return null;return'selvaggio'}return null}
 const croceviaQui=s=>{if(!nuovoGeo(s))return null;const M=VEN.mappaDi(s);return M?tipoCasella(s,M,TU(s)):null};
 // il regno della casella: la fazione del luogo murato più vicino
 function regnoQui(s,tu){let b=null,bd=1e9;for(const l of s.l){if(!MURA[l.tipo])continue;const d=dist(l,tu);if(d<bd){bd=d;b=l}}return b?b.faz:null}
 const lista=v=>v==null?null:Array.isArray(v)?v:[v];
 // le condizioni `se` di una voce contro la situazione di adesso
 function vale(se,c){se=se||{};
  const bi=lista(se.bioma);if(bi&&!bi.includes(c.bioma))return false;
  if(se.regno!=null&&se.regno!==c.regno)return false;
  if(se.guerra!=null&&!!se.guerra!==c.guerra)return false;
  if(se.notte!=null&&!!se.notte!==c.notte)return false;
  if(se.fama!=null){const f=se.fama;if(typeof f==='number'){if(c.fama<f)return false}else if(f&&((f.min!=null&&c.fama<f.min)||(f.max!=null&&c.fama>f.max)))return false}
  const co=lista(se.con);if(co&&!co.some(id=>c.con.includes(id)))return false;return true}
 // la situazione: bioma, regno (tuo|nemico|amico), guerra, notte, fama, compagni
 function situazione(s,M,tu,tipo){const i=cella(M,tu.x,tu.y),faz=regnoQui(s,tu),me=lato(s);
  const regno=faz==null?'amico':(faz===me||faz==='tu')?'tuo':nemiche(s,me,faz)?'nemico':'amico';
  const guerra=!!faz&&VEN.regni(s).some(f=>f!==faz&&inGuerra(s,faz,f));
  return{bioma:tipo==='incrocio'?'strada':M.T[i]===4?'monte':'bosco',regno,guerra,notte:notte(s),fama:s.fama|0,con:VEN.inCompagnia(s).map(x=>x.id),faz}}
  // ---------- quando e quale ----------
 VEN.aggancia('vedi',s=>{if(!nuovoGeo(s)||s.over)return;const P=C;
  const tu=TU(s);if(!tu.via||!tu.via.length||s.dentro>=0||s.incontro||s.prigioniero||(s.rac&&s.rac.scena))return;
  const cr=s.croc;if(cr&&cr.ult!=null&&s.t-cr.ult<P.OGNI*1440)return;
  const M=VEN.mappaDi(s),tipo=M&&tipoCasella(s,M,tu);if(!tipo)return;
  const r=rnd(s);if(r()>=P.PROB)return;
  const V=VOCI(),lis=V&&V.CROCEVIA;if(!lis)return;
  const c=situazione(s,M,tu,tipo),g=giorno(s),visti=(cr&&cr.visti)||{};
  const cand=lis.filter(v=>vale(v.se,c)&&!(visti[v.id]!=null&&g-visti[v.id]<P.MEMORIA));if(!cand.length)return;
  let tot=0;for(const v of cand)tot+=v.peso||1;let x=r()*tot,sc=cand[cand.length-1];for(const v of cand){x-=v.peso||1;if(x<0){sc=v;break}}
  if(!VEN.accoda(s,sc.id))return;
  const k=s.croc||(s.croc={ult:null,visti:{}});k.ult=s.t;k.visti[sc.id]=g});
 // le voci della compagnia (il capitolo VVOC, se il motore di racconto è caricato)
 function VOCI(){return typeof VVOC!=='undefined'?VVOC:null}
 // ---------- effetti ----------
 const segno=n=>(n>0?'+':'−')+Math.abs(n);
 const cultQui=s=>{const f=regnoQui(s,TU(s)),c=f&&f!=='tu'&&f!=='neu'?VEN.cult(s,f):null;return c&&D.TR[c+'_f1']?c:(VEN.regni(s).map(x=>VEN.cult(s,x)).find(x=>D.TR[x+'_f1'])||null)};
 function uomini_(s,n){const tu=TU(s);
  if(n>0){const c=cultQui(s);if(!c)return;const k=Math.min(n,Math.max(0,limite(s)-uomini(tu)));if(k>0){aggiungi(tu.tr,c+'_f1',k);L(s,segno(k)+(k===1?' recluta':' reclute'),'bene')}return}
  if(n<0){const co=D.COMPAGNI.map(x=>x.id);let da=-n,tot=0;
   while(da>0){const e=tu.tr.filter(x=>x.n>0&&!co.includes(x.t)&&D.TR[x.t]).sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t)[0];if(!e)break;const k=togliUomini(tu.tr,e.t,da);if(!k)break;da-=k;tot+=k}
   if(tot)L(s,segno(-tot)+(tot===1?' uomo':' uomini'),'male')}}
 function merce_(s,m,n){const tu=TU(s);if(!D.MERCI[m]||D.MERCI[m].cibo||!n)return;const mg=tu.merci||(tu.merci={}),av=mg[m]||0;
  let nuovo=Math.max(0,av+n);if(n>0)nuovo=Math.min(nuovo,av+Math.max(0,VEN.caricoMax(s)-VEN.carico(tu)));mg[m]=nuovo;if(!nuovo)delete mg[m];
  const d=nuovo-av;if(d)L(s,segno(d)+' '+D.MERCI[m].nome.toLowerCase(),d>0?'bene':'male')}
 function viveri_(s,n){const tu=TU(s);if(!n)return;const mg=tu.merci||(tu.merci={}),av=mg.grano||0,nuovo=Math.max(0,av+n);if(nuovo)mg.grano=nuovo;else delete mg.grano;
  const d=nuovo-av;if(d)L(s,segno(d)+' grano',d>0?'bene':'male')}
 VEN.aggancia('effetto',(s,e)=>{if(!e)return;
  if(e.k==='uomini')uomini_(s,e.n|0);else if(e.k==='merce')merce_(s,e.m,e.n|0);else if(e.k==='viveri')viveri_(s,e.n|0);else if(e.k==='gusto'&&e.ev)VEN.reagisci(s,String(e.ev))});
 return{croceviaQui}})());
