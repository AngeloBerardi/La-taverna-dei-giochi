/* ---- Mostri visibili (A6.4): gruppi di nemici sulla mappa del mondo, la loro fase di movimento, il contatto e chi entra in battaglia (motore puro). ----
   Un gruppo è { id, fam, liv, diff, seme, ids (mostri del bestiario, solo per mostrare quanti sono), q, r, stato: vaga | caccia | guardia, pausa, assedio? }.
   Vaga a caso, insegue chi gli è a 3 esagoni (1 passo di giorno, 2 di notte), la guardia non si muove. Non entra nei luoghi sicuri.
   La composizione vera si calcola al contatto (`composizione`): livello del gruppo + bonus di perdizione + 1 di notte, secondo il numero di eroi che entrano.
   Funziona su uno stato con { celle, luoghi, eroi:[{slot,liv,hp,q,r}], mostri, fase, perdizione, dentro }. I dadi sono `rnd` (funzione 0..1). */
const AMOS=(()=>{
 const MON=typeof AMON!=='undefined'?AMON:require('./27m-avv-mondo.js');
 const LU=typeof ALUO!=='undefined'?ALUO:require('./27n-avv-luoghi.js');
 const SC=typeof ASCO!=='undefined'?ASCO:require('./27i-avv-scontro.js');
 const K=MON.K,dist=MON.dist;
 const VISTA=3,AIUTO=3,BASE=5,MAX_GRUPPI=8,DISTANZA_NASCITA=5;
 const sicuraCella=x=>!!(x&&x.poi&&MON.TIPI[x.poi]&&MON.TIPI[x.poi].sicuro);
 const inPiedi=s=>s.eroi.filter(e=>e.hp>0);
 const livelloMedio=s=>{const v=inPiedi(s);return Math.max(1,Math.round((v.length?v:s.eroi).reduce((a,e)=>a+(e.liv||1),0)/Math.max(1,(v.length?v:s.eroi).length)))};
 const bersagli=s=>s.dentro?[]:inPiedi(s).filter(e=>!sicuraCella(s.celle[K(e.q,e.r)]));
 const occupate=s=>new Set(s.mostri.map(m=>K(m.q,m.r)));
 const libera=(s,q,r,occ)=>{const x=s.celle[K(q,r)];return!!x&&MON.passabile(x.t)&&!x.poi&&!occ.has(K(q,r))};
 const obiettivo=s=>LU.EFFETTI[LU.livelloPerdizione(s.perdizione)].gruppi+BASE;
 // bonus al livello dei mostri: perdizione (soglie) e notte
 const bonusLivello=s=>LU.EFFETTI[LU.livelloPerdizione(s.perdizione)].mostri+(s.fase==='notte'?1:0);
 const seme32=rnd=>Math.floor(rnd()*4294967296)>>>0;
 // nuovo gruppo: regione `reg` (o a caso), lontano dagli eroi; ritorna il gruppo o null se non c'è posto
 function nuovoGruppo(s,rnd,o){o=o||{};const regioni=s.regioni||[{fam:'banditi'}],reg=o.reg!=null?o.reg:Math.floor(rnd()*regioni.length),occ=occupate(s),eroi=s.eroi;
  const cand=filtraReg=>Object.values(s.celle).filter(x=>libera(s,x.q,x.r,occ)&&(o.q!=null||!filtraReg||x.reg===reg||x.reg==null)&&(o.q!=null||eroi.every(e=>dist(e,x)>=(o.vicino?1:DISTANZA_NASCITA)))&&(o.q!=null||!Object.values(s.luoghi||{}).some(l=>MON.TIPI[l.tipo].sicuro&&dist(l,x)<2)));
  let cs=cand(true);if(!cs.length&&o.q==null)cs=cand(false);   // la regione è piena o troppo vicina agli eroi: ovunque
  if(o.q!=null)cs=cs.filter(x=>x.q===o.q&&x.r===o.r);
  if(!cs.length)return null;const c=cs[Math.floor(rnd()*cs.length)],fam=o.fam||(regioni[c.reg==null?reg:c.reg]||regioni[0]).fam;
  const n=(s.proxMostro=(s.proxMostro||0)+1),r2=rnd(),diff=o.diff||(r2<.2?'facile':r2>.85?'difficile':'medio'),liv=Math.max(1,Math.min(8,o.liv!=null?o.liv:livelloMedio(s)+(c.reg===2?1:0)));
  const g={id:'m'+n,fam,liv,diff,seme:seme32(rnd),ids:[],q:c.q,r:c.r,stato:o.stato||'vaga',pausa:0};if(o.assedio)g.assedio=o.assedio;
  g.ids=SC.incontro(fam,liv,Math.max(1,Math.min(4,s.eroi.length)),diff,g.seme).nemici;s.mostri.push(g);return g}
 // riporta il numero dei gruppi all'obiettivo (alba, soglie di perdizione); gli assedianti non contano
 function rinasci(s,rnd){let n=0;const liberi=()=>s.mostri.filter(m=>!m.assedio).length;while(liberi()<Math.min(MAX_GRUPPI,obiettivo(s))&&n<12){if(!nuovoGruppo(s,rnd))break;n++}return n}
 // composizione al contatto: i mostri del bestiario, secondo il livello di oggi e il numero di eroi che entrano
 function composizione(s,m,nEroi){const liv=Math.max(1,Math.min(8,m.liv+bonusLivello(s)));return SC.incontro(m.fam,liv,Math.max(1,Math.min(4,nEroi)),m.diff,m.seme)}
 const vicinoA=(s,m,r)=>bersagli(s).some(e=>dist(e,m)<=r);
 // un passo verso (o via da) un punto: tra i vicini liberi il più vicino, a parità un po' di caso
 function passoVerso(s,m,t,rnd,occ){let best=null,bd=dist(m,t);const v=MON.vicini(m.q,m.r).filter(n=>libera(s,n.q,n.r,occ));
  for(const n of v.sort(()=>rnd()-.5)){const d=dist(n,t);if(d<bd){bd=d;best=n}}return best}
 // fase dei mostri: ritorna gli spostamenti [{t:'mostro', id, da, a}]
 function fase(s,rnd){const ev=[],occ=occupate(s),notte=s.fase==='notte';
  for(const m of s.mostri){if(m.pausa>0){m.pausa--;continue}if(m.stato==='guardia')continue;
   const bers=bersagli(s).filter(e=>dist(e,m)<=VISTA);let target=null;for(const e of bers)if(!target||dist(e,m)<dist(target,m))target=e;
   const da={q:m.q,r:m.r};
   if(target){m.stato='caccia';const passi=notte?2:1;for(let k=0;k<passi&&dist(m,target)>1;k++){const n=passoVerso(s,m,target,rnd,occ);if(!n)break;occ.delete(K(m.q,m.r));m.q=n.q;m.r=n.r;occ.add(K(m.q,m.r))}}
   else{m.stato='vaga';if(rnd()<.5){const v=MON.vicini(m.q,m.r).filter(n=>libera(s,n.q,n.r,occ));if(v.length){const n=v[Math.floor(rnd()*v.length)];occ.delete(K(m.q,m.r));m.q=n.q;m.r=n.r;occ.add(K(m.q,m.r))}}}
   if(m.q!==da.q||m.r!==da.r)ev.push({t:'mostro',id:m.id,da,a:{q:m.q,r:m.r}})}
  return ev}
 // mercanti vaganti: ogni fase metà di loro fa un passo sulla strada
 function mercanti(s,rnd){for(const x of s.mercanti||[]){if(rnd()<.5){const v=MON.vicini(x.q,x.r).filter(n=>{const c=s.celle[K(n.q,n.r)];return c&&c.t==='strada'&&!c.poi});if(v.length){const n=v[Math.floor(rnd()*v.length)];x.q=n.q;x.r=n.r}}}}
 // gruppo in contatto con la cella (q,r): a un esagono o meno, e la cella non è un luogo sicuro. Se ce ne sono più d'uno, il più vicino.
 function contatto(s,q,r){if(s.dentro)return null;if(sicuraCella(s.celle[K(q,r)]))return null;let best=null;
  for(const m of s.mostri){if(m.pausa>0)continue;if(dist(m,{q,r})<=1&&(!best||dist(m,{q,r})<dist(best,{q,r})))best=m}return best}
 // chi entra in battaglia: gli eroi in piedi entro AIUTO esagoni dal gruppo; dist = esagoni (0–1 subito, 2–3 arrivano dopo)
 function quali(s,m){const quali=[],d={};s.eroi.forEach((e,i)=>{if(e.hp<=0)return;const x=dist(e,m);if(x<=AIUTO){quali.push(i);d[e.slot]=x}});return{quali,dist:d}}
 const visibili=s=>s.mostri.filter(m=>inPiedi(s).some(e=>dist(e,m)<=VISTA));
 // assedio: un villaggio (non la partenza) è circondato da un gruppo di guardia; ritorna il luogo o null
 function assedia(s,rnd){const cand=Object.values(s.luoghi).filter(l=>l.tipo==='villaggio'&&!l.partenza&&!l.assedio);if(!cand.length)return null;
  const citta=Object.values(s.luoghi).find(l=>l.tipo==='citta')||{q:0,r:0};cand.sort((a,b)=>dist(a,citta)-dist(b,citta));const l=cand[0];
  const vic=MON.vicini(l.q,l.r).filter(n=>libera(s,n.q,n.r,occupate(s)));if(!vic.length)return null;
  const p=vic[Math.floor(rnd()*vic.length)],g=nuovoGruppo(s,rnd,{q:p.q,r:p.r,stato:'guardia',diff:'difficile',liv:livelloMedio(s)+1,assedio:l.id,fam:(s.regioni[l.reg]||s.regioni[0]).fam});
  if(!g)return null;l.assedio=true;return l}
 // toglie l'assedio: i gruppi di guardia di quel luogo (o di tutti) tornano a vagare
 function togliAssedio(s,id){for(const l of Object.values(s.luoghi))if(l.assedio&&(id==null||l.id===id))l.assedio=false;
  for(const m of s.mostri)if(m.assedio&&(id==null||m.assedio===id)){delete m.assedio;m.stato='vaga'}}
 return{VISTA,AIUTO,BASE,MAX_GRUPPI,sicuraCella,livelloMedio,bersagli,obiettivo,bonusLivello,nuovoGruppo,rinasci,composizione,fase,mercanti,contatto,quali,visibili,assedia,togliAssedio}})();
if(typeof module!=='undefined')module.exports=AMOS;
