/* ---- Battaglia a istanti di Cantari di Ventura (piano B, step B3): il cuore del tempo reale. Regole pure, JSON puro, deterministico. ----
   Il tempo è fatto di istanti da 100 ms (10 al secondo): `passo(s, n)` avanza n istanti, `ordina(s, ordine)` registra un ordine valido
   dall'istante corrente. Nessun orologio qui dentro: il tempo lo porta chi chiama, e la grafica interpola fra un istante e l'altro.
   Stessi ordini negli stessi istanti ⇒ stessa battaglia: i dadi stanno in `s.rng` (ADADI). Vietati Math.random, Date.now e la trigonometria.
   Regole (docs/AVVENTURA-B.md, Principi tecnici): ognuno occupa un esagono e passa al vicino a mov/3 caselle al secondo lungo il percorso
   di AGRI; l'attacco con l'arma va al ritmo dell'arma; i poteri «azione» si lanciano (interrompibili) e poi si ricaricano, i «bonus» sono
   istantanei, le reazioni scattano da sole (APOT.tempi); stati e Concentrazione durano secondi (ASTA.scorri); attacco di opportunità
   all'uscita dalla portata di mischia; rinforzi che entrano da un bordo dopo un ritardo; fine per vittoria, sconfitta, fuga o stallo.
   Ordini: { chi, t } con t = vai (a:{q,r}) | attacca (bers) | potere (id + bers | cella | dir) | oggetto (id + …) | rialza (bers) | fuggi |
   conc (Concentrazione: vantaggio per 6 s) | arrendi (solo mostri con `ia.arrende` sotto il 25% dei PF) | ferma. Un ordine dato con `ia:true` resta marcato (anche dopo un lancio,
   che lo trasforma in «attacca»): così l'IA (27t) distingue i suoi ordini da quelli a mano del giocatore. L'evento `lancia` porta `zona` (le celle dell'area
   rossa) per i poteri ad area; `zonaDi(s, c)` la dà per il lancio in corso. I poteri bonus già a portata partono subito e lasciano stare l'ordine principale
   (`rapidi`); fuori portata diventano l'ordine principale. Chi non ha ordini colpisce da solo un nemico a portata (il resto lo decide B4).
   Stato: { v, t, rng, arena, cb, ordini:{ id: ordine }, rapidi:{ id: ordine bonus }, riserva:[{ id, t }], opz:{ tMax, sorpresa }, over, ev, evn }.
   Un combattente è quello di APOT/BEST (come in ASCO) più: via (istante in cui si muove la prima volta), pronto (prossimo colpo), ritmo,
   ric:{ potere: istante pronto }, reaT (reazione pronta), concT / disT (Concentrazione / disimpegno fino a), lancio:{ id, A, da, fine } | null,
   mv:{ da, k, n } | null (passo in corso: occupa già la cella nuova, la grafica scivola da `da` per k/n), sosta (fermo fino a), supT.
   Da B5 le battaglie della campagna in solitario passano da qui (`daCampagna` / `riepilogo`, stesse forme di ASCO); il vecchio ASCO (27i) resta per
   la battaglia di prova della pagina Avventura e per la co-op (A11) finché B10 non porta anche quella al tempo reale. */
const ATEM=(()=>{
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const ST=typeof ASTA!=='undefined'?ASTA:require('./27d-avv-stati.js');
 const AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js');
 const BE=typeof BEST!=='undefined'?BEST:require('./27f-avv-bestiario.js');
 const G=typeof AGRI!=='undefined'?AGRI:require('./27g-avv-griglia.js');
 const AR=typeof AARE!=='undefined'?AARE:require('./27h-avv-arene.js');
 const ERR=err=>({err}),cl=x=>JSON.parse(JSON.stringify(x));
 // IST istanti al secondo; GIRO = 6 s; T_MAX = stallo (6 min); RINFORZO = istanti di ritardo per esagono di distanza; MOV: un esagono costa
 // MOV×costo punti e ogni istante se ne fanno `mov` (mov 6 → 2 caselle al secondo); ATTESA = pausa prima di ricalcolare un percorso chiuso
 const IST=10,GIRO=ST.GIRO,T_MAX=3600,RINFORZO=30,MOV=30,PMAX=99,ATTESA=5,RIALZO=15,MAX_EROI=4,CD_SUP=11;
 // ---- combattenti ----
 const trova=(s,id)=>s.cb.find(c=>c.id===id);
 const inCampo=c=>c.q!=null&&!c.morto&&!c.fuggito&&!c.arreso&&!c.fuori;
 const inPiedi=c=>inCampo(c)&&c.hp>0;
 const nemici=(a,b)=>a.lato!==b.lato;
 const pos=c=>({q:c.q,r:c.r});
 const melee=c=>c.gitt<=2;
 const stessa=(a,b)=>a.q===b.q&&a.r===b.r;
 const alleatoVicino=(s,a,b)=>s.cb.some(x=>inPiedi(x)&&x!==a&&x.lato===a.lato&&G.dist(x,b)<=1);
 // ---- messa in campo (come ASCO: chi combatte da vicino davanti, gli altri dietro) ----
 const inMischia=c=>c.lato==='eroi'?melee(c)&&!['mago','bardo'].includes(c.classe):c.ruolo==='bruto'||c.ruolo==='sciame';
 function schiera(arena,cbs,lato,esplicite){const cel=lato==='eroi'?arena.ingressi.eroi:arena.ingressi.nemici,n=lato==='eroi'?5:7,davanti=cel.slice(0,n),dietro=cel.slice(n),usate=new Set();
  for(const c of cbs){const e=esplicite[c.id];if(e)usate.add(G.K(e.q,e.r))}
  const prendi=l=>{while(l.length){const x=l.shift();if(!usate.has(G.K(x.q,x.r))){usate.add(G.K(x.q,x.r));return x}}return null};
  for(const c of cbs){const e=esplicite[c.id];if(e){c.q=e.q;c.r=e.r;continue}
   const x=inMischia(c)?(prendi(davanti)||prendi(dietro)):(prendi(dietro)||prendi(davanti));if(!x)throw new Error('arena senza posti per tutti');c.q=x.q;c.r=x.r}}
 // iniziativa: d20 + iniz; chi tira di più parte subito, chi tira poco dopo al massimo 1 s
 function parti(s,c,rnd){const r=DAD.d20(rnd,{vant:!!(c.hook&&c.hook.inizVant)});c.inizTot=r.tiro+c.iniz;c.via=s.t+IST-Math.floor(Math.max(0,Math.min(25,c.inizTot))*2/5);c.pronto=c.via;c.supT=s.t+GIRO}
 // compagnia: [{ eroe, dist }]; nemici: [def | { def, q, r, dist }] (dist ≥ 1: rinforzo che entra dal bordo dopo dist × 3 s); opz: { seme, sorpresa, tMax }
 function nuovo(compagnia,nemiciIn,arena,opz){opz=opz||{};
  if(!Array.isArray(compagnia)||compagnia.length<1||compagnia.length>MAX_EROI)throw new Error('la compagnia va da 1 a '+MAX_EROI+' eroi');
  if(!Array.isArray(nemiciIn)||!nemiciIn.length)throw new Error('servono dei nemici');
  const s={v:1,t:0,rng:DAD.semina(opz.seme==null?1:opz.seme),arena:cl(arena),cb:[],ordini:{},rapidi:{},riserva:[],opz:{tMax:opz.tMax||T_MAX,sorpresa:opz.sorpresa||null},over:null,ev:[],evn:0};
  const eroi=compagnia.map((m,k)=>{const c=AP.combattente(m.eroe,{id:'e'+(k+1)});c.indice=k;c.dist=m.dist||0;c.ritmo=AP.ritmo(c,m.eroe);return c});
  const conta={},defs=nemiciIn.map(n=>typeof n==='string'?{def:n}:n);for(const d of defs)conta[d.def]=(conta[d.def]||0)+1;const visti={};
  const mostri=defs.map(d=>{visti[d.def]=(visti[d.def]||0)+1;const c=BE.combattente(d.def,{id:conta[d.def]>1?d.def+'#'+visti[d.def]:d.def});c.espl=d.q!=null?{q:d.q,r:d.r}:null;c.dist=d.dist||0;c.ritmo=AP.ritmo(c);return c});
  const subito=l=>l.filter(c=>c.dist<1),esplicite=Object.fromEntries(mostri.filter(c=>c.espl).map(c=>[c.id,c.espl]));
  schiera(s.arena,subito(eroi).sort((a,b)=>(inMischia(a)?0:1)-(inMischia(b)?0:1)),'eroi',{});schiera(s.arena,subito(mostri).sort((a,b)=>(b.capo?1:0)-(a.capo?1:0)),'nemici',esplicite);
  s.cb=[...eroi,...mostri];
  for(const c of s.cb){delete c.espl;Object.assign(c,{fuori:c.dist>=1,fuggito:false,arreso:false,ric:{},reaT:0,concT:0,disT:0,lancio:null,mv:null,sosta:0,supT:0,pronto:0,via:0});AP.iniziaScontro(c);
   if(c.fuori){c.q=null;c.r=null;s.riserva.push({id:c.id,t:c.dist*RINFORZO})}}
  const rnd=DAD.gen(s);for(const c of s.cb)if(!c.fuori){parti(s,c,rnd);if(opz.sorpresa===c.lato){c.via+=GIRO;c.pronto=c.via}}
  return s}
 // ---- eventi, uscite, fine ----
 function dopoEventi(X,evs){const s=X.s;for(const e of evs){X.ev.push(e);if(!e.a0)continue;const c=trova(s,e.bers||e.chi);if(!c)continue;
   X.ev.push({t:c.lato==='eroi'?'cade':'muore',chi:c.id});c.lancio=null;c.mv=null;if(c.lato!=='eroi'){delete s.ordini[c.id];delete s.rapidi[c.id]}}}
 const uscite=(s,lato)=>lato==='eroi'?s.arena.uscite:G.celle(s.arena).filter(c=>c.r===0&&G.passabile(s.arena,c));
 function esci(X,c,esito){c[esito]=true;c.lancio=null;c.mv=null;delete X.s.ordini[c.id];delete X.s.rapidi[c.id];X.ev.push({t:esito,chi:c.id})}
 function finisci(X,esito){X.s.over={esito,t:X.s.t};X.ev.push({t:'fine',esito})}
 function controllaFine(X){const s=X.s;if(s.over)return;const attesi=l=>s.riserva.some(r=>trova(s,r.id).lato===l);
  if(!s.cb.some(c=>c.lato==='nemici'&&inCampo(c))&&!attesi('nemici'))return finisci(X,'vittoria');
  if(!s.cb.some(c=>c.lato==='eroi'&&inPiedi(c))&&!attesi('eroi'))finisci(X,s.cb.some(c=>c.lato==='eroi'&&c.fuggito)?'fuga':'sconfitta')}
 // rinforzi: entrano dal bordo della loro parte (gli eroi dalle uscite, i nemici dalla prima riga), sulla cella libera più vicina al centro
 function arrivi(X){const s=X.s;for(const r of s.riserva.slice()){if(r.t>s.t)continue;const c=trova(s,r.id);
   const cel=uscite(s,c.lato).slice().sort((a,b)=>Math.abs(G.aOffset(a.q,a.r).col-4)-Math.abs(G.aOffset(b.q,b.r).col-4)),x=cel.find(u=>!occupata(s,u,null));if(!x)continue;
   c.q=x.q;c.r=x.r;c.fuori=false;parti(s,c,X.rnd);s.riserva=s.riserva.filter(y=>y!==r);X.ev.push({t:'arriva',chi:c.id,q:c.q,r:c.r})}}
 const occupata=(s,x,salvo)=>s.cb.some(y=>y!==salvo&&inCampo(y)&&y.q===x.q&&y.r===x.r);
 // ---- superfici: entrando nella cella e poi ogni 6 s finché ci si resta (come a inizio turno) ----
 function superficie(X,c,quando){const s=X.s,sp=G.sup(s.arena,c);if(!sp||!inPiedi(c))return false;let ferma=false;
  if(sp==='fuoco'){const n=DAD.danno(X.rnd,'1d6').tot,r=AP.subisci(c,n,'fuoco');ST.aggiungi(c,'in-fiamme',2);dopoEventi(X,[{t:'superficie',chi:c.id,sup:sp,n:r.n,a0:r.a0,bers:c.id}])}
  else if(sp==='veleno'){const t=ST.salvezza(c,'cos',CD_SUP,X.rnd);X.ev.push({t:'superficie',chi:c.id,sup:sp,ok:t.ok,tiro:t.tiro});if(!t.ok)ST.aggiungi(c,'avvelenato',2)}
  else if(sp==='ghiaccio'&&quando==='entra'){const t=ST.salvezza(c,'des',CD_SUP,X.rnd);X.ev.push({t:'superficie',chi:c.id,sup:sp,ok:t.ok,tiro:t.tiro});if(!t.ok)ferma=true}
  else if(sp==='acqua'&&quando==='entra'&&ST.togli(c,'in-fiamme'))X.ev.push({t:'superficie',chi:c.id,sup:sp,spenta:true});
  return ferma}
 // ---- condizioni di un attacco e forme dei poteri (la stessa geometria di ASCO: vista, copertura, altezza, gittata lunga) ----
 function condizioni(s,a,b,p,o){o=o||{};if(a===b)return{per:{},v:{visibile:true,cop:'nessuna',ca:0,dislivello:0},d:0};
  const v=G.vista(s.arena,pos(a),pos(b));if(!v.visibile)return ERR('Non lo vedi: la linea di vista è bloccata');
  const d=G.dist(a,b),norm=p.gitt==='arma'?a.gitt:p.gitt,lunga=p.gitt==='arma'?a.gittaLunga:null;
  if(!o.senzaGittata&&d>(lunga||Math.max(1,norm)))return ERR('Troppo lontano');
  const per={vant:v.dislivello>0,svant:!!(lunga&&d>norm),ca:p.att?v.ca:0};
  if(p.att&&norm>2&&s.cb.some(x=>inPiedi(x)&&nemici(a,x)&&G.dist(a,x)<=1))per.svant=true;
  if(p.att&&a.hook&&a.hook.branco&&alleatoVicino(s,a,b))per.vant=true;
  return{per,v,d}}
 const tipoOk=(c,p,x)=>{const amico=x.lato===c.lato;switch(p.bers){case'nemico':case'nemici':return!amico&&inPiedi(x);case'alleato':case'alleati':return amico&&inPiedi(x);
   case'amico':case'amici':return amico&&inCampo(x);case'terra':return amico&&inCampo(x)&&x.hp<=0;default:return x===c}};
 const dentroArea=celle=>{const k=new Set(celle.map(x=>G.K(x.q,x.r)));return x=>inCampo(x)&&k.has(G.K(x.q,x.r))};
 // celle toccate da un potere lanciato da `da` verso { bers | cella | dir }
 function area(s,c,p,A,da){const ar=s.arena,b0=A.bers?trova(s,A.bers):null,verso=A.cella||(b0&&inCampo(b0)?pos(b0):null);
  if(p.area==='aura')return{celle:G.aura(ar,da,p.raggio)};
  if(p.area==='cono'||p.area==='linea'){const dir=Number.isInteger(A.dir)?((A.dir%6)+6)%6:verso?(p.area==='cono'?G.direzioneVerso(da,verso):G.asseVerso(da,verso)):null;
   if(dir==null)return ERR('Scegli la direzione');return{dir,celle:p.area==='cono'?G.cono(ar,da,dir,p.raggio):G.lineaDa(ar,da,dir,p.raggio)}}
  return ERR('Potere non valido')}
 // bersagli di un potere adesso: { bs, per, centro, dir } oppure { err }
 function forma(s,c,p,A){const ar=s.arena,qui=pos(c),b0=A.bers?trova(s,A.bers):null;let bs,centro=null,dir=null;
  switch(p.area){
   case'se':bs=[c];break;
   case'singolo':{if(!b0||!inCampo(b0)||!tipoOk(c,p,b0))return ERR('Scegli un bersaglio');const k=condizioni(s,c,b0,p);if(k.err)return k;return{bs:[b0],per:{[b0.id]:k.per}}}
   case'cerchio':{const ce=A.cella||(b0&&inCampo(b0)?pos(b0):null);if(!ce||!G.passabile(ar,ce))return ERR('Scegli dove');
    const norm=p.gitt==='arma'?c.gitt:p.gitt;if(G.dist(qui,ce)>Math.max(1,norm))return ERR('Troppo lontano');
    if(G.dist(qui,ce)>0&&!G.vista(ar,qui,ce).visibile)return ERR('Non vedi quel punto');
    centro={q:ce.q,r:ce.r};const d=dentroArea(G.cerchio(ar,centro,p.raggio));bs=s.cb.filter(x=>d(x)&&tipoOk(c,p,x));break}
   case'aura':case'cono':case'linea':{const a=area(s,c,p,A,qui);if(a.err)return a;dir=a.dir==null?null:a.dir;const d=dentroArea(a.celle);bs=s.cb.filter(x=>(p.area==='aura'&&x===c||d(x))&&tipoOk(c,p,x));break}
   default:return ERR('Potere non valido')}
  if(!bs.length)return ERR('Nessun bersaglio nell\'area');
  const per={};for(const b of bs)if(p.att){const k=condizioni(s,c,b,p,{senzaGittata:true});per[b.id]=k.err?{}:k.per}
  return{bs,per,centro,dir}}
 // celle toccate da un potere ad area lanciato da `c` con i bersagli `A` (l'area rossa a terra, B4); null se non è un'area
 function zona(s,c,p,A){if(!p||!['cerchio','aura','cono','linea'].includes(p.area))return null;
  if(p.area==='cerchio'){const b0=A.bers?trova(s,A.bers):null,ce=A.cella||(b0&&inCampo(b0)?pos(b0):null);return ce&&G.passabile(s.arena,ce)?G.cerchio(s.arena,ce,p.raggio):null}
  const a=area(s,c,p,A,pos(c));return a.err?null:a.celle}
 // l'area che sta per colpire il lancio in corso di `c` (si aggiorna se segue un bersaglio che si muove); null se non ce n'è
 function zonaDi(s,c){const L=c&&c.lancio;if(!L||L.id==='rialza')return null;return zona(s,c,potereDi({t:L.ogg?'oggetto':'potere',id:L.id}),L.A)}
 // spinge `b` di `n` esagoni lontano da `c`: chi viene spinto perde il lancio e il passo che stava facendo
 function spinta(s,c,b,n){const da=pos(b);let passi=0;
  for(let i=0;i<n&&inPiedi(b);i++){const d=G.indietro(s.arena,pos(c),pos(b));if(!G.passabile(s.arena,d)||occupata(s,d,b))break;b.q=d.q;b.r=d.r;passi++}
  if(passi){b.mv=null;b.lancio=null}return{passi,da,a:pos(b)}}
 // ---- reazioni automatiche: scudo e ritiro dopo un colpo a segno, riduzione prima del danno (la regola «auto» di ASCO); poi 6 s di ricarica ----
 function reazioni(X){const s=X.s;let rif=new Set();
  const pronta=(r,p)=>r.reaT<=s.t&&(r.ric[p.id]||0)<=s.t&&AP.usiRimasti(r,p)>0;
  const opzioni=(r,quando,b,info)=>{const o=[];
   for(const id of r.poteri){const p=AP.P[id];if(!p||p.costo!=='reazione'||!pronta(r,p))continue;
    if(quando==='colpo'){const scudo=p.eff.find(e=>e.k==='stato'&&e.ca),rit=p.eff.some(e=>e.k==='ritira');if(!scudo&&!rit)continue;
     if(p.area==='se'?r!==b:(G.dist(r,b)>p.gitt||(r!==b&&!G.vista(s.arena,pos(r),pos(b)).visibile)))continue;
     if(scudo&&(info.tiro===20||info.tot>=info.ca+scudo.ca))continue;o.push({id,tipo:scudo?'scudo':'ritira'})}
    else{if(r!==b||p.area!=='se'||!p.eff.some(e=>e.k==='riduci'))continue;const at=AP.stimaRiduzione(r,id,info.n);if(at>=1)o.push({id,tipo:'riduci',atteso:at})}}
   return o};
  const scegli=(o,quando,info)=>{if(quando==='colpo'){const sc=o.find(x=>x.tipo==='scudo');if(sc)return sc;const ri=o.find(x=>x.tipo==='ritira');return ri&&(info.crit||info.ca-info.bonus>=9)?ri:null}
   const m=o.slice().sort((x,y)=>y.atteso-x.atteso)[0];return m&&info.n>=5&&m.atteso>=2?m:null};
  const usata=(r,id)=>{r.reaT=s.t+GIRO;r.ric[id]=s.t+AP.tempi(AP.P[id]).ricarica};
  return{
   colpo(att,p,b,info){if(info.giro===0)rif=new Set();
    for(const r of s.cb.filter(x=>x.lato===b.lato&&inPiedi(x)&&ST.puoAgire(x)&&!rif.has(x.id))){const o=opzioni(r,'colpo',b,info),sc=o.length?scegli(o,'colpo',info):null;if(!sc){rif.add(r.id);continue}
     const R2=AP.applica(r,sc.id,[b],X.rnd,{});if(R2.err){rif.add(r.id);continue}usata(r,sc.id);return{ev:[{t:'reazione',chi:r.id,potere:sc.id,bers:b.id},...R2.ev],ritira:R2.ritira}}
    return null},
   danno(att,e,b,n,tipo){if(n<=0||!inPiedi(b)||!ST.puoAgire(b))return null;const info={n,dtipo:tipo},o=opzioni(b,'danno',b,info),sc=o.length?scegli(o,'danno',info):null;if(!sc)return null;
    const R2=AP.applica(b,sc.id,[b],X.rnd,{danno:n});if(R2.err)return null;usata(b,sc.id);return{riduci:R2.ridotto,ev:[{t:'reazione',chi:b.id,potere:sc.id,bers:b.id},...R2.ev]}}}}
 // ---- colpi e poteri ----
 function colpo(X,a,b){const s=X.s,p=AP.P.attacco,k=condizioni(s,a,b,p);if(k.err)return k;
  const R=AP.applica(a,'attacco',[b],X.rnd,{per:{[b.id]:k.per},alleatoVicino:alleatoVicino(s,a,b),vant:a.concT>s.t,rea:X.rea});if(R.err)return R;
  X.ev.push({t:'attacca',chi:a.id,bers:b.id});dopoEventi(X,R.ev);return R}
 function usaPotere(X,c,p,A){const s=X.s,f=forma(s,c,p,A);if(f.err)return f;
  const ctx={per:f.per,alleatoVicino:f.bs.some(b=>b!==c&&alleatoVicino(s,c,b)),vant:!!p.att&&c.concT>s.t,rea:X.rea};
  const R=p.oggetto?AP.applicaOggetto(c,p.oggetto,f.bs,X.rnd,ctx):AP.applica(c,p.id,f.bs,X.rnd,ctx);if(R.err)return R;
  if(p.oggetto)c.cintura.splice(c.cintura.indexOf(p.oggetto),1);else c.ric[p.id]=s.t+AP.tempi(p).ricarica;
  const ep={t:p.oggetto?'oggetto':'potere',chi:c.id,id:p.oggetto||p.id,colpiti:f.bs.map(b=>b.id)};if(f.centro)ep.centro=f.centro;if(f.dir!=null)ep.dir=f.dir;X.ev.push(ep);
  const spinti=[],evs=R.ev.map(e=>{
   if(e.t==='spingi'&&e.n!=null&&e.chi==null){const b=trova(s,e.bers);if(!b||!inPiedi(b))return{t:'spinto',chi:c.id,bers:e.bers,passi:0};const m=spinta(s,c,b,e.n);if(m.passi)spinti.push(b);return{t:'spinto',chi:c.id,bers:b.id,passi:m.passi,da:m.da,a:m.a}}
   if(e.t==='disimpegna')c.disT=s.t+GIRO;return e});
  dopoEventi(X,evs);for(const b of spinti)if(inPiedi(b))superficie(X,b,'entra');
  return R}
 const potereDi=o=>o.t==='oggetto'?AP.oggetto(o.id):AP.P[o.id];
 const pronto=(s,c,p)=>p.oggetto?(c.cintura||[]).includes(p.oggetto):(c.ric[p.id]||0)<=s.t&&AP.usiRimasti(c,p)>0;
 function interrompi(X,c,motivo){if(!c.lancio)return;X.ev.push({t:'interrotto',chi:c.id,id:c.lancio.id,motivo});c.lancio=null}
 function annulla(X,c,motivo,bonus){const m=bonus?X.s.rapidi:X.s.ordini;if(!m[c.id])return;X.ev.push({t:'annullato',chi:c.id,ordine:m[c.id].t,id:m[c.id].id,motivo});delete m[c.id]}
 // fine del lancio: il potere parte adesso, con i bersagli di adesso (se non è più possibile, si riprova: niente carica spesa)
 function rilascia(X,c){const s=X.s,L=c.lancio,o=s.ordini[c.id];c.lancio=null;
  if(L.id==='rialza'){const b=trova(s,L.A.bers);delete s.ordini[c.id];if(!b||!inCampo(b)||b.hp>0||G.dist(c,b)>1)return X.ev.push({t:'fallito',chi:c.id,id:'rialza'});
   const tiro=DAD.d20(X.rnd).tiro,tot=tiro+((c.abil&&c.abil.med)||0),ok=tiro===20||(tiro!==1&&tot>=10);let hp=0;if(ok)hp=ST.cura(b,DAD.danno(X.rnd,'1d4').tot+c.liv).n;
   return X.ev.push({t:'rialza',chi:c.id,bers:b.id,ok,tiro,tot,cd:10,hp})}
  const p=potereDi({t:L.ogg?'oggetto':'potere',id:L.id});if(!p||!pronto(s,c,p)){annulla(X,c,'Non si può più usare');return}
  const R=usaPotere(X,c,p,L.A);if(R.err){X.ev.push({t:'fallito',chi:c.id,id:L.id,motivo:R.err});if(/Cariche|non può|cintura/.test(R.err))annulla(X,c,R.err);return}
  c.pronto=Math.max(c.pronto,s.t+c.ritmo);
  const b=L.A.bers?trova(s,L.A.bers):null;if(o&&o.id===L.id){if(b&&inPiedi(b)&&nemici(c,b))s.ordini[c.id]=Object.assign({t:'attacca',bers:b.id},o.ia?{ia:true}:{});else delete s.ordini[c.id]}}
 // ---- movimento: un esagono alla volta, verso la cella più vicina che soddisfa `meta`; occupa subito la cella nuova ----
 // chi ha un attacco di opportunità se `c` passa da `da` a `n`: nemici in piedi con la reazione pronta, da mischia, che lo avevano a portata
 const minacciano=(s,c,da,n)=>s.cb.filter(x=>inPiedi(x)&&nemici(c,x)&&x.reaT<=s.t&&x.via<=s.t&&melee(x)&&ST.puoAgire(x)&&G.dist(x,da)<=x.gitt&&G.dist(x,n)>x.gitt);
 function passo1(X,c,n){const s=X.s,da=pos(c),costo=G.costoEntrata(s.arena,da,n,{ignoraDifficile:!!(c.hook&&c.hook.ignoraDifficile)});
  if(c.disT<=s.t)for(const e of minacciano(s,c,da,n)){if(!inPiedi(c))break;e.reaT=s.t+GIRO;X.ev.push({t:'opportunita',chi:e.id,bers:c.id});colpo(X,e,c)}
  if(!inPiedi(c)||c.mv)return;c.q=n.q;c.r=n.r;c.mv={da,k:0,n:MOV*costo}}
 // 'qui' = la meta è già soddisfatta, 'passo' = partito verso la meta, 'attesa' = strada chiusa (riprova fra mezzo secondo)
 function muoviVerso(X,c,meta,verso){const s=X.s;if(meta(pos(c)))return'qui';if(c.sosta>s.t||ST.movEff(c)<=0)return'attesa';
  const ris=G.raggiungibili(s.arena,pos(c),PMAX,{blocca:s.cb.filter(x=>x!==c&&inCampo(x)).map(pos),ignoraDifficile:!!(c.hook&&c.hook.ignoraDifficile)});let best=null;
  for(const k in ris){const x=ris[k];if(x.da!==null&&(!best||x.costo<best.costo)&&meta(x))best=x}
  if(!best&&verso){let bd=G.dist(c,verso);for(const k in ris){const x=ris[k];if(x.da===null)continue;const d=G.dist(x,verso);if(d<bd||(best&&d===bd&&x.costo<best.costo)){bd=d;best=x}}}
  if(!best){c.sosta=s.t+ATTESA;return'attesa'}
  passo1(X,c,G.percorso(ris,best)[0]);return'passo'}
 const aPortata=(s,c,b,R)=>x=>{const d=G.dist(x,b);return d<=R&&(d<=1||G.vista(s.arena,x,pos(b)).visibile)};
 // dove deve stare chi lancia per prendere il bersaglio: entro la gittata (o il raggio, per aure, coni e linee) e con la vista libera
 function metaPotere(s,c,p,A){const b=A.bers?trova(s,A.bers):null,ce=A.cella||(b&&inCampo(b)?pos(b):null);if(!ce||p.area==='se')return null;
  const norm=p.gitt==='arma'?c.gitt:p.gitt;
  if(p.area==='cono'||p.area==='linea'){const k=G.K(ce.q,ce.r);return{verso:ce,meta:x=>G.dist(x,ce)<=p.raggio&&area(s,c,p,{cella:ce},x).celle.some(y=>G.K(y.q,y.r)===k)}}
  return{verso:ce,meta:aPortata(s,c,ce,p.area==='aura'?p.raggio:Math.max(1,norm))}}
 // ---- un istante di un combattente ----
 function rapido(X,c){const s=X.s,o=s.rapidi[c.id];if(!o)return;
  if(o.t==='conc'){delete s.rapidi[c.id];if(c.conc<1)return;c.conc--;c.concT=s.t+GIRO;return X.ev.push({t:'conc-spesa',chi:c.id,uso:'vant'})}
  const p=potereDi(o);if(!p)return annulla(X,c,'Non si può usare',true);
  if(pronto(s,c,p)){const R=usaPotere(X,c,p,o);if(!R.err){delete s.rapidi[c.id];return}if(/Cariche|non può|cintura/.test(R.err))return annulla(X,c,R.err,true)}
  if(s.t>=o.scade)annulla(X,c,'Tempo scaduto',true)}
 // chi non ha ordini colpisce da solo il nemico a portata più vicino (a parità il più ferito)
 function difendi(X,c){const s=X.s;if(c.pronto>s.t)return;let b=null,bd=0;
  for(const x of s.cb)if(inPiedi(x)&&nemici(c,x)){const d=G.dist(c,x);if(d>(c.gittaLunga||c.gitt))continue;if(!b||d<bd||(d===bd&&x.hp<b.hp)){if(!condizioni(s,c,x,AP.P.attacco).err){b=x;bd=d}}}
  if(b){colpo(X,c,b);c.pronto=s.t+c.ritmo}}
 function attacca(X,c,o){const s=X.s,b=trova(s,o.bers);if(!b||!inPiedi(b))return annulla(X,c,'Il bersaglio non c\'è più');
  if(!condizioni(s,c,b,AP.P.attacco).err){if(c.pronto<=s.t){colpo(X,c,b);c.pronto=s.t+c.ritmo}return}
  if(muoviVerso(X,c,aPortata(s,c,pos(b),Math.max(1,c.gitt)),pos(b))==='attesa')difendi(X,c)}
 function lancia(X,c,o){const s=X.s,p=potereDi(o);if(!p||(o.t==='potere'&&AP.usiRimasti(c,p)<=0)||(o.t==='oggetto'&&!pronto(s,c,p)))return annulla(X,c,'Non si può più usare');
  const f=forma(s,c,p,o);
  if(!f.err){if(!pronto(s,c,p))return difendi(X,c);const T=AP.tempi(p),A={bers:o.bers,cella:o.cella,dir:o.dir};
   c.lancio={id:o.id,A,da:s.t,fine:s.t+T.lancio};if(o.t==='oggetto')c.lancio.ogg=true;
   const z=T.lancio?zona(s,c,p,A):null;X.ev.push(Object.assign({t:'lancia',chi:c.id,id:o.id,fine:c.lancio.fine},z?{zona:z.map(x=>({q:x.q,r:x.r}))}:{}));if(!T.lancio)rilascia(X,c);return}
  const m=metaPotere(s,c,p,o);if(!m)return annulla(X,c,f.err);
  const r=muoviVerso(X,c,m.meta,m.verso);if(r==='qui')return annulla(X,c,f.err);if(r==='attesa')difendi(X,c)}
 function turno(X,c){const s=X.s;
  dopoEventi(X,ST.scorri(c,X.rnd));if(!inCampo(c))return;if(s.t%GIRO===0)c.furtivoUsato=false;       // l'attacco furtivo torna ogni 6 s
  if(c.hp>0&&c.supT<=s.t){c.supT=s.t+GIRO;superficie(X,c,'inizio')}
  if(!inPiedi(c)){c.lancio=null;return}
  if(!ST.puoAgire(c))return interrompi(X,c,'non può agire');
  if(c.via>s.t)return;
  if(c.mv){c.mv.k+=ST.movEff(c);if(c.mv.k<c.mv.n)return rapido(X,c);c.mv=null;c.supT=s.t+GIRO;if(superficie(X,c,'entra'))c.sosta=s.t+IST;if(!inPiedi(c))return}
  rapido(X,c);if(!inPiedi(c)||s.over)return;
  if(c.lancio){if(s.t>=c.lancio.fine)rilascia(X,c);return}
  const o=s.ordini[c.id];if(!o)return difendi(X,c);
  switch(o.t){
   case'vai':{if(occupata(s,o.a,c)&&G.dist(c,o.a)<=1){delete s.ordini[c.id];break}const r=muoviVerso(X,c,x=>stessa(x,o.a),o.a);if(r==='qui')delete s.ordini[c.id];else if(r==='attesa')difendi(X,c);break}
   case'attacca':attacca(X,c,o);break;
   case'potere':case'oggetto':lancia(X,c,o);break;
   case'rialza':{const b=trova(s,o.bers);if(!b||!inCampo(b)||b.hp>0)return annulla(X,c,'Non serve più');
    if(muoviVerso(X,c,x=>G.dist(x,b)<=1,pos(b))==='qui'){c.lancio={id:'rialza',A:{bers:b.id},da:s.t,fine:s.t+RIALZO};X.ev.push({t:'lancia',chi:c.id,id:'rialza',fine:c.lancio.fine})}break}
   case'fuggi':{const U=uscite(s,c.lato),su=x=>U.some(u=>stessa(u,x));if(muoviVerso(X,c,su,null)==='qui')esci(X,c,'fuggito');break}
   default:delete s.ordini[c.id]}}
 // un istante: rinforzi, poi tutti (a istanti alterni prima gli eroi o prima i nemici, così nessuna parte colpisce sempre per prima), poi la fine
 function istante(X){const s=X.s,da=X.ev.length;s.t++;arrivi(X);const l=s.t%2?s.cb:s.cb.slice().reverse();
  for(const c of l){if(s.over)break;if(inCampo(c)){turno(X,c);controllaFine(X)}}
  if(!s.over&&s.t>=s.opz.tMax)finisci(X,'stallo');
  for(let k=da;k<X.ev.length;k++)if(X.ev[k].i==null)X.ev[k].i=s.t}
 // ---- API ----
 // passo(s, n, { qui }) → { s, ev }: avanza n istanti (si ferma alla fine). `qui` lavora sullo stato passato invece che su una copia (per chi simula, es. la TV).
 function passo(s0,n,o){o=o||{};if(!s0||!Array.isArray(s0.cb))return ERR('Stato non valido');if(s0.over)return ERR('Battaglia finita');
  n=n==null?1:Math.floor(n);if(!(n>=1))return ERR('Quanti istanti?');
  const s=o.qui?s0:cl(s0),X={s,rnd:DAD.gen(s),ev:[]};X.rea=reazioni(X);for(let k=0;k<n&&!s.over;k++)istante(X);
  s.ev=X.ev;s.evn++;return{s,ev:X.ev}}
 const metti=(X,c,o)=>{if(c.lancio)interrompi(X,c,'nuovo ordine');X.s.ordini[c.id]=o};
 // bersagli di un ordine di potere secondo la forma: { bers } | { cella } | { dir } | {} oppure il testo dell'errore
 function mira(s,c,p,a){const b=a.bers!=null?trova(s,a.bers):null;if(a.bers!=null&&(!b||!inCampo(b)))return'Bersaglio non valido';
  const cella=a.cella&&Number.isInteger(a.cella.q)&&Number.isInteger(a.cella.r)?{q:a.cella.q,r:a.cella.r}:null;if(a.cella&&(!cella||!G.passabile(s.arena,cella)))return'Cella non valida';
  switch(p.area){
   case'se':return{};
   case'singolo':return b&&tipoOk(c,p,b)?{bers:b.id}:'Scegli un bersaglio adatto';
   case'aura':return b?{bers:b.id}:{};
   case'cerchio':return cella?{cella}:b?{bers:b.id}:'Scegli dove';
   default:return Number.isInteger(a.dir)?{dir:((a.dir%6)+6)%6}:cella?{cella}:b?{bers:b.id}:'Scegli la direzione'}}
 function registra(X,a){const s=X.s;if(!a||typeof a!=='object')return'Ordine non valido';const c=trova(s,a.chi);if(!c)return'Combattente sconosciuto';
  if(!inCampo(c))return c.nome+' non è in campo';if(c.hp<=0)return c.nome+' è a terra';
  switch(a.t){
   case'ferma':interrompi(X,c,'ferma');delete s.ordini[c.id];return null;
   case'vai':{const d=a.a;if(!d||!Number.isInteger(d.q)||!Number.isInteger(d.r)||!G.passabile(s.arena,d))return'Lì non si può andare';metti(X,c,{t:'vai',a:{q:d.q,r:d.r}});return null}
   case'attacca':{const b=trova(s,a.bers);if(!b||!inPiedi(b)||!nemici(c,b))return'Serve un nemico in piedi';metti(X,c,{t:'attacca',bers:b.id});return null}
   case'potere':case'oggetto':{const p=potereDi(a);if(!p)return a.t==='potere'?'Potere sconosciuto':'Non si può usare in battaglia';
    if(a.t==='potere'){if(!c.poteri.includes(a.id))return'Non conosci questo potere';if(p.costo==='reazione')return'È una reazione: scatta da sola quando serve';if(AP.usiRimasti(c,p)<=0)return'Cariche esaurite'}
    else if(!(c.cintura||[]).includes(a.id))return'Non è alla cintura';
    const A=mira(s,c,p,a);if(typeof A==='string')return A;const o=Object.assign({t:a.t,id:a.id},A);
    if(p.costo==='bonus'&&!forma(s,c,p,o).err){o.scade=s.t+2*IST;s.rapidi[c.id]=o}else metti(X,c,o);return null}   // un bonus fuori portata diventa l'ordine principale: ci si avvicina
   case'conc':if(c.conc<1)return'Non hai Concentrazione';s.rapidi[c.id]={t:'conc'};return null;
   case'rialza':{const b=trova(s,a.bers);if(!b||b===c||!inCampo(b)||b.lato!==c.lato||b.hp>0)return'Serve un alleato a terra';metti(X,c,{t:'rialza',bers:b.id});return null}
   case'fuggi':metti(X,c,{t:'fuggi'});return null;
   case'arrendi':if(c.lato!=='nemici'||!(c.ia&&c.ia.arrende)||c.hp>c.hpMax*.25)return'Non si arrende';esci(X,c,'arreso');return null;   // come in ASCO: solo chi ha `ia.arrende`, sotto il 25% dei PF
   default:return'Ordine sconosciuto'}}
 // ordina(s, ordine | [ordini], { qui }) → { s, ev } | { err }: gli ordini partono dal prossimo istante; un ordine nuovo interrompe il lancio in corso
 function ordina(s0,o,x){x=x||{};if(!s0||!Array.isArray(s0.cb))return ERR('Stato non valido');if(s0.over)return ERR('Battaglia finita');
  const s=x.qui?s0:cl(s0),X={s,ev:[]};
  for(const a of Array.isArray(o)?o:[o]){const prima=a&&s.ordini[a.chi],e=registra(X,a);if(e)return ERR(e);const nuovo=a.ia&&s.ordini[a.chi];if(nuovo&&nuovo!==prima)nuovo.ia=true}   // `ia:true` = l'ordine è dell'IA (B4)
  for(const e of X.ev)e.i=s.t;s.ev=X.ev;s.evn++;return{s,ev:X.ev}}
 // per la barra delle abilità: quanto manca alla ricarica di un potere (istanti) e su quanto
 function ricarica(s,c,id){const p=AP.P[id];if(!p)return null;const T=AP.tempi(p),resta=Math.max(0,(id==='attacco'?c.pronto:c.ric[id]||0)-s.t);return{resta,tot:p.id==='attacco'?c.ritmo:T.ricarica,usi:AP.usiRimasti(c,p),lancio:T.lancio}}
 // ---- aggancio alla campagna (B5): stessi ingressi e stessa uscita di ASCO.daCampagna / ASCO.riepilogo, così CAMP e AVV registrano l'esito senza sapere
 // quale battaglia si è giocata (ASCO.aggiorna legge il riepilogo). daCampagna(camp, incontro): incontro = { nemici, seme?, ambiente?, sorpresa?, dist?:{ slot: esagoni } }
 function daCampagna(camp,inc){inc=inc||{};if(!camp||!Array.isArray(camp.eroi)||!camp.eroi.length)throw new Error('serve una campagna con degli eroi');
  if(!camp.eroi.some(e=>e.hp>0))throw new Error('nessun eroe in piedi');
  const cella=camp.party&&camp.celle&&camp.celle[camp.party.q+','+camp.party.r]||{},seme=inc.seme!=null?inc.seme>>>0:((camp.seed|0)*31+(camp.evn|0)*7+(camp.giorno|0))>>>0;
  const defs=(inc.nemici||[]).map(n=>typeof n==='string'?n:n.def),amb=inc.ambiente||AR.ambienteDa(cella.t,cella.poi);
  const squad=camp.eroi.map(e=>({eroe:cl(e),dist:(inc.dist&&inc.dist[e.slot])||0}));
  return nuovo(squad,inc.nemici,AR.conLuce(AR.perIncontro(seme,amb,defs),camp),{seme,sorpresa:inc.sorpresa,tMax:inc.tMax})}   // B6.5: ora e perdizione per la luce
 // riepilogo(s): come ASCO.riepilogo; `giri` = periodi di 6 s iniziati, `secondi` = durata della battaglia
 function riepilogo(s){const sconfitti=s.cb.filter(c=>c.lato==='nemici'&&(c.morto||c.arreso)),xp=sconfitti.reduce((a,c)=>a+(c.xp||0),0),eroi=s.cb.filter(c=>c.lato==='eroi'),part=eroi.filter(c=>!c.fuori);
  const quota=part.length?Math.floor(xp/part.length):0;
  return{esito:s.over?s.over.esito:null,giri:Math.max(1,Math.ceil(s.t/GIRO)),secondi:Math.floor(s.t/IST),xp,xpPerEroe:quota,
   eroi:eroi.map(c=>({id:c.id,indice:c.indice,nome:c.nome,hp:c.hp,hpMax:c.hpMax,conc:c.conc,usi:cl(c.usi),cintura:(c.cintura||[]).slice(),stato:c.fuggito?'fuggito':c.hp<=0?'a-terra':'in-piedi',xp:c.fuori?0:quota})),
   nemici:s.cb.filter(c=>c.lato==='nemici').map(c=>({id:c.id,def:c.def,esito:c.morto?'sconfitto':c.arreso?'arreso':c.fuggito?'fuggito':'in-campo'}))}}
 return{IST,GIRO,T_MAX,RINFORZO,MOV,MAX_EROI,nuovo,passo,ordina,trova,inCampo,inPiedi,forma,condizioni,uscite,ricarica,zona,zonaDi,daCampagna,riepilogo}})();
if(typeof module!=='undefined')module.exports=ATEM;
