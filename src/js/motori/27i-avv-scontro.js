/* ---- Battaglia tattica di Cantari di Ventura: stato, turni, movimento, azioni, fine. Regole pure, JSON puro, deterministico. ----
   Contratto come gli altri motori: nuovo(compagnia, nemici, arena, opz) -> stato; act(stato, azione) -> { s, ev } | { err }.
   Tutti i dadi vengono dal generatore dentro lo stato (`s.rng`, ADADI): stessa battaglia, stesse azioni => stesso finale, e si riprende da qualsiasi
   punto salvato. Poteri, stati e danni sono di APOT/ASTA (27d, 27e); la geometria è di AGRI (27g); le arene di AARE (27h). Qui si decide chi può
   fare che cosa, dove, e quando finisce.
   Regole (docs/AVVENTURA-A4.md): iniziativa d20+iniz; a inizio turno il movimento si tira (mov effettivo − 2 + 1d4, almeno 1); un'azione, un'azione
   bonus, una reazione per giro; Attacca, Scatto, Disimpegno, Nasconditi, Aiuta, Rialza, Spingi, Fuggi, Arrenditi; attacco di opportunità automatico
   uscendo dalla portata di mischia; vista, copertura (+2/+5 CA), altezza (vantaggio) e gittata lunga (svantaggio) dalla griglia; chi è a terra non si
   attacca; vittoria / sconfitta / fuga / stallo (40 giri).
   Stato: { v, rng, giro, arena, cb:[combattenti con q, r, rea, …], ordine:[id], i, turno:{ id, pm, pmTirato, azione, bonus, scattato, disimpegno, ritMov },
   riserva:[{ id, giro }], opz, over, ev, evn }. Un combattente è quello di APOT.combattente (eroi) o BEST.combattente (mostri) con: q, r (null se non ancora
   arrivato), fuori, fuggito, arreso, morto, rea (reazione disponibile), sorpreso, inizTot. */
const ASCO=(()=>{
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const ST=typeof ASTA!=='undefined'?ASTA:require('./27d-avv-stati.js');
 const AP=typeof APOT!=='undefined'?APOT:require('./27e-avv-poteri.js');
 const BE=typeof BEST!=='undefined'?BEST:require('./27f-avv-bestiario.js');
 const G=typeof AGRI!=='undefined'?AGRI:require('./27g-avv-griglia.js');
 const ERR=err=>({err}),cl=x=>JSON.parse(JSON.stringify(x));
 const MAX_EROI=4,GIRI_MAX=40,CD_SUP=11,CD_FUGA=10;
 // ---- stato dei combattenti ----
 const trova=(s,id)=>s.cb.find(c=>c.id===id);
 const inCampo=c=>c.q!=null&&!c.morto&&!c.fuggito&&!c.arreso&&!c.fuori;       // sulla griglia (anche a terra)
 const inPiedi=c=>inCampo(c)&&c.hp>0;
 const nemici=(a,b)=>a.lato!==b.lato;
 const pos=c=>({q:c.q,r:c.r});
 const melee=c=>c.gitt<=2;                                                   // arma da mischia: la portata è anche il raggio degli attacchi di opportunità
 const vicino=(s,c,r)=>s.cb.filter(x=>inPiedi(x)&&x!==c&&G.dist(x,c)<=r);
 const attore=s=>s.over?null:trova(s,s.ordine[s.i]);
 const rndDi=s=>DAD.gen(s);
 // ---- messa in campo ----
 const inMischia=c=>c.lato==='eroi'?melee(c)&&!['mago','bardo'].includes(c.classe):c.ruolo==='bruto'||c.ruolo==='sciame';
 // i combattenti di mischia davanti, gli altri dietro; il resto dal centro verso l'esterno (l'ordine delle celle dell'arena)
 function schiera(arena,cbs,lato,esplicite){const cel=lato==='eroi'?arena.ingressi.eroi:arena.ingressi.nemici,n=lato==='eroi'?5:7,davanti=cel.slice(0,n),dietro=cel.slice(n),usate=new Set();
  for(const c of cbs){const e=esplicite[c.id];if(e)usate.add(G.K(e.q,e.r))}
  const prendi=l=>{while(l.length){const x=l.shift();if(!usate.has(G.K(x.q,x.r))){usate.add(G.K(x.q,x.r));return x}}return null};
  for(const c of cbs){const e=esplicite[c.id];if(e){c.q=e.q;c.r=e.r;continue}
   const x=inMischia(c)?(prendi(davanti)||prendi(dietro)):(prendi(dietro)||prendi(davanti));
   if(!x)throw new Error('arena senza posti per tutti');c.q=x.q;c.r=x.r}}
 // compagnia: [{ eroe, dist }] (dist: esagoni dallo scontro, ≥2 arriva dopo `dist` giri); nemici: [def | { def, q, r }]; opz: { seme, sorpresa, difficolta, reazioni, giriMax }
 function nuovo(compagnia,nemiciIn,arena,opz){opz=opz||{};
  if(!Array.isArray(compagnia)||compagnia.length<1||compagnia.length>MAX_EROI)throw new Error('la compagnia va da 1 a '+MAX_EROI+' eroi');
  if(!Array.isArray(nemiciIn)||!nemiciIn.length)throw new Error('servono dei nemici');
  const s={v:1,rng:DAD.semina(opz.seme==null?1:opz.seme),giro:1,arena:cl(arena),cb:[],ordine:[],i:-1,turno:null,riserva:[],prima:null,
   opz:{difficolta:opz.difficolta||'normale',giriMax:opz.giriMax||GIRI_MAX,sorpresa:opz.sorpresa||null,reazioni:Object.assign({eroi:'chiedi',nemici:'auto'},opz.reazioni||{})},over:null,ev:[],evn:0};
  const eroi=compagnia.map((m,k)=>{const c=AP.combattente(m.eroe,{id:'e'+(k+1)});c.indice=k;c.dist=m.dist||0;return c});
  const conta={},defs=nemiciIn.map(n=>typeof n==='string'?{def:n}:n);for(const d of defs)conta[d.def]=(conta[d.def]||0)+1;const visti={};
  const mostri=defs.map(d=>{visti[d.def]=(visti[d.def]||0)+1;const c=BE.combattente(d.def,{id:conta[d.def]>1?d.def+'#'+visti[d.def]:d.def});c.espl=d.q!=null?{q:d.q,r:d.r}:null;return c});
  const capiPrima=mostri.slice().sort((a,b)=>(b.capo?1:0)-(a.capo?1:0)),esplicite=lato=>Object.fromEntries(lato.filter(c=>c.espl).map(c=>[c.id,c.espl]));
  const subito=eroi.filter(c=>c.dist<2);schiera(s.arena,subito.slice().sort((a,b)=>(inMischia(a)?0:1)-(inMischia(b)?0:1)),'eroi',{});schiera(s.arena,capiPrima,'nemici',esplicite(mostri));
  for(const c of eroi.filter(c=>c.dist>=2)){c.fuori=true;c.q=null;c.r=null;s.riserva.push({id:c.id,giro:1+c.dist})}
  s.cb=[...eroi,...mostri];for(const c of s.cb){delete c.espl;c.rea=true;c.fuori=!!c.fuori;c.fuggito=false;c.arreso=false;AP.iniziaScontro(c)}
  const lato=opz.sorpresa;if(lato)for(const c of s.cb)if(c.lato===lato&&!c.fuori){c.sorpreso=true;c.rea=false}
  const rnd=rndDi(s);for(const c of s.cb)if(!c.fuori)tiraIniziativa(s,c,rnd);
  s.ordine=s.cb.filter(c=>!c.fuori).sort(confronto).map(c=>c.id);
  const ev=[];prossimo(s,rnd,ev);s.ev=ev;s.evn=1;return s}
 const confronto=(a,b)=>b.inizTot-a.inizTot||b.iniz-a.iniz||(a.lato===b.lato?0:a.lato==='eroi'?-1:1);
 function tiraIniziativa(s,c,rnd){const r=DAD.d20(rnd,{vant:!!(c.hook&&c.hook.inizVant)});c.inizTot=r.tiro+c.iniz;return r}
 // ---- turni ----
 function rimuoviDaOrdine(s,id){const k=s.ordine.indexOf(id);if(k<0)return;s.ordine.splice(k,1);if(k<=s.i)s.i--}
 // ciò che succede dopo un danno: chi arriva a 0 PF cade (eroe) o muore (mostro, esce dall'ordine)
 function dopoEventi(s,evs,ev){for(const e of evs){ev.push(e);if(e.a0){const c=trova(s,e.bers||e.chi);if(c){ev.push({t:c.lato==='eroi'?'cade':'muore',chi:c.id});if(c.lato!=='eroi')rimuoviDaOrdine(s,c.id)}}}}
 // effetto di una superficie su chi entra (o inizia il turno) nella sua cella
 function superficie(s,c,rnd,ev,quando){const sp=G.sup(s.arena,c);if(!sp||!inPiedi(c))return false;let ferma=false;
  if(sp==='fuoco'){const n=DAD.danno(rnd,'1d6').tot,r=AP.subisci(c,n,'fuoco');ST.aggiungi(c,'in-fiamme',2);dopoEventi(s,[{t:'superficie',chi:c.id,sup:sp,n:r.n,a0:r.a0,bers:c.id}],ev)}
  else if(sp==='veleno'){const t=ST.salvezza(c,'cos',CD_SUP,rnd);ev.push({t:'superficie',chi:c.id,sup:sp,ok:t.ok,tiro:t.tiro});if(!t.ok)ST.aggiungi(c,'avvelenato',2)}
  else if(sp==='ghiaccio'&&quando==='entra'){const t=ST.salvezza(c,'des',CD_SUP,rnd);ev.push({t:'superficie',chi:c.id,sup:sp,ok:t.ok,tiro:t.tiro});if(!t.ok)ferma=true}
  else if(sp==='acqua'&&quando==='entra'&&ST.togli(c,'in-fiamme'))ev.push({t:'superficie',chi:c.id,sup:sp,spenta:true});
  return ferma}
 function iniziaTurno(s,c,rnd,ev){
  ev.push({t:'turno',chi:c.id,giro:s.giro});
  const ris=AP.inizioTurno(c,rnd);dopoEventi(s,ris,ev);
  if(!c.morto)superficie(s,c,rnd,ev,'inizio');
  c.rea=true;const salta=!!c.sorpreso;c.sorpreso=false;
  s.turno={id:c.id,pm:0,pmTirato:0,mosso:false,azione:true,bonus:true,scattato:false,disimpegno:false,ritMov:false,salta};
  if(inPiedi(c)&&ST.puoAgire(c)&&!salta){const base=ST.movEff(c);if(base>0){const d=DAD.d(rnd,4);s.turno.pm=s.turno.pmTirato=Math.max(1,base-2+d);ev.push({t:'movimento',chi:c.id,pm:s.turno.pm,dado:d})}}
  controllaFine(s,ev)}
 // arrivo degli eroi in ritardo: sull'uscita libera più vicina al centro
 function arrivi(s,rnd,ev){for(const r of s.riserva.filter(x=>x.giro<=s.giro)){const c=trova(s,r.id),occ=new Set(s.cb.filter(inCampo).map(x=>G.K(x.q,x.r)));
   const cel=s.arena.uscite.slice().sort((a,b)=>Math.abs(G.aOffset(a.q,a.r).col-4)-Math.abs(G.aOffset(b.q,b.r).col-4)),x=cel.find(u=>!occ.has(G.K(u.q,u.r)))||G.vicini(cel[0]).find(u=>G.passabile(s.arena,u)&&!occ.has(G.K(u.q,u.r)));
   c.q=x.q;c.r=x.r;c.fuori=false;tiraIniziativa(s,c,rnd);s.riserva=s.riserva.filter(y=>y!==r);
   const k=s.ordine.findIndex(id=>confronto(c,trova(s,id))<0);s.ordine.splice(k<0?s.ordine.length:k,0,c.id);ev.push({t:'arriva',chi:c.id,q:c.q,r:c.r})}}
 // dal turno che finisce al prossimo di chi può agire (chi non può — a terra, stordito, sorpreso — salta, ma le sue durate scorrono)
 function prossimo(s,rnd,ev){let guardia=0;
  while(!s.over&&guardia++<4*(s.cb.length+2)){s.i++;
   if(s.i>=s.ordine.length){s.i=0;s.giro++;if(s.giro>s.opz.giriMax){finisci(s,'stallo',ev);return}ev.push({t:'giro',n:s.giro});arrivi(s,rnd,ev)}
   if(!s.ordine.length){controllaFine(s,ev);return}
   const c=trova(s,s.ordine[s.i]);iniziaTurno(s,c,rnd,ev);if(s.over)return;if(!inCampo(c)){continue}
   if(inPiedi(c)&&ST.puoAgire(c)&&!s.turno.salta)return;
   for(const e of ST.fineTurno(c))ev.push(Object.assign({chi:c.id},e))}}
 function finisci(s,esito,ev){s.over={esito,giri:s.giro};ev.push({t:'fine',esito})}
 function controllaFine(s,ev){if(s.over)return;const enem=s.cb.filter(c=>c.lato==='nemici'&&inCampo(c)),pend=s.riserva.some(r=>trova(s,r.id).lato==='eroi'),pendN=s.riserva.some(r=>trova(s,r.id).lato==='nemici');
  if(!enem.length&&!pendN)return finisci(s,'vittoria',ev);
  if(!s.cb.some(c=>c.lato==='eroi'&&inPiedi(c))&&!pend)return finisci(s,s.cb.some(c=>c.lato==='eroi'&&c.fuggito)?'fuga':'sconfitta',ev)}
 // ---- tiri e condizioni di un attacco ----
 // per ogni bersaglio: vista, distanza, copertura, altezza, tiro ravvicinato -> { per:{ vant, svant, ca }, v, d } oppure { err }
 function condizioni(s,a,b,p,o){o=o||{};if(a===b)return{per:{},v:{visibile:true,cop:'nessuna',ca:0,dislivello:0},d:0,lunga:false};
  const v=G.vista(s.arena,pos(a),pos(b));if(!v.visibile)return ERR('Non lo vedi: la linea di vista è bloccata');
  const d=G.dist(a,b),norm=p.gitt==='arma'?a.gitt:p.gitt,lunga=p.gitt==='arma'?a.gittaLunga:null;
  if(!o.senzaGittata&&d>(lunga||Math.max(1,norm)))return ERR('Troppo lontano');
  const per={vant:v.dislivello>0,svant:!!(lunga&&d>norm),ca:p.att?v.ca:0};
  if(p.att&&norm>2&&s.cb.some(x=>inPiedi(x)&&nemici(a,x)&&G.dist(a,x)<=1))per.svant=true;       // tirare con un nemico addosso
  if(p.att&&a.hook&&a.hook.branco&&alleatoVicino(s,a,b))per.vant=true;                           // il branco: un compagno accanto al bersaglio
  return{per,v,d,lunga:!!(lunga&&d>norm)}}
 const alleatoVicino=(s,a,b)=>s.cb.some(x=>inPiedi(x)&&x!==a&&x.lato===a.lato&&G.dist(x,b)<=1);
 function colpo(s,a,id,b,rnd,ev){const p=AP.P[id],k=condizioni(s,a,b,p);if(k.err)return k;
  const R=AP.applica(a,id,[b],rnd,{per:{[b.id]:k.per},alleatoVicino:alleatoVicino(s,a,b),rea:REA});if(R.err)return R;dopoEventi(s,R.ev,ev);return R}
 // ---- reazioni difensive (D9): scudo e ritiro dopo un colpo a segno, riduzione prima del danno. «Tenace» scatta da sola (APOT.subisci). ----
 // Ai mostri e agli eroi in modo 'auto' decide la regola; agli eroi in modo 'chiedi' decide la vista: `act` torna { pausa } e si richiama con `a.dec`
 // (le risposte, nell'ordine). Lo stato non cambia: i dadi stanno nello stato, quindi il calcolo si rifà identico fino alla stessa domanda.
 let REA=null;
 function Pausa(p){this.pausa=p}
 function reazioni(s,rnd,a){let k=0,rifiutate=new Set();const dec=a.dec||[],modo=l=>l==='eroi'?(s.opz.reazioni||{}).eroi||'chiedi':'auto';
  // le reazioni che `r` può usare adesso, solo se servono davvero (lo scudo se cambia l'esito, la riduzione se c'è danno)
  const opzioni=(r,quando,b,info)=>{const o=[];
   for(const id of r.poteri){const p=AP.P[id];if(!p||p.costo!=='reazione'||AP.usiRimasti(r,p)<=0)continue;
    if(quando==='colpo'){const scudo=p.eff.find(e=>e.k==='stato'&&e.ca),rit=p.eff.some(e=>e.k==='ritira');if(!scudo&&!rit)continue;
     if(p.area==='se'?r!==b:(G.dist(r,b)>p.gitt||(r!==b&&!G.vista(s.arena,pos(r),pos(b)).visibile)))continue;
     if(scudo&&(info.tiro===20||info.tot>=info.ca+scudo.ca))continue;
     o.push({id,nome:p.nome,tipo:scudo?'scudo':'ritira',desc:p.desc})}
    else{if(r!==b||p.area!=='se'||!p.eff.some(e=>e.k==='riduci'))continue;const at=AP.stimaRiduzione(r,id,info.n);if(at>=1)o.push({id,nome:p.nome,tipo:'riduci',atteso:at,desc:p.desc})}}
   return o};
  const automatica=(o,quando,info)=>{if(quando==='colpo'){const sc=o.find(x=>x.tipo==='scudo');if(sc)return sc;const ri=o.find(x=>x.tipo==='ritira');return ri&&(info.crit||info.ca-info.bonus>=9)?ri:null}
   const m=o.slice().sort((x,y)=>y.atteso-x.atteso)[0];return m&&info.n>=5&&m.atteso>=2?m:null};
  const decidi=(r,o,quando,att,b,info)=>{
   if(modo(r.lato)==='chiedi'){if(k<dec.length){const d=dec[k++];return o.find(x=>x.id===d)||null}
    throw new Pausa({chi:r.id,tipo:'reazione',quando,opzioni:o.map(x=>({id:x.id,nome:x.nome,desc:x.desc,tipo:x.tipo})),info:{att:att.id,bers:b.id,tiro:info.tiro,tot:info.tot,ca:info.ca,n:info.n,dtipo:info.dtipo}})}
   return automatica(o,quando,info)};
  return{
   colpo(att,p,b,info){if(info.giro===0)rifiutate=new Set();
    for(const r of s.cb.filter(x=>x.lato===b.lato&&inPiedi(x)&&x.rea&&ST.puoAgire(x)&&!rifiutate.has(x.id))){
     const o=opzioni(r,'colpo',b,info);if(!o.length)continue;const sc=decidi(r,o,'colpo',att,b,info);if(!sc){rifiutate.add(r.id);continue}
     r.rea=false;const R2=AP.applica(r,sc.id,[b],rnd,{});if(R2.err){rifiutate.add(r.id);continue}
     return{ev:[{t:'reazione',chi:r.id,potere:sc.id,bers:b.id},...R2.ev],ritira:R2.ritira}}
    return null},
   danno(att,e,b,n,tipo){if(n<=0||!b.rea||!inPiedi(b)||!ST.puoAgire(b))return null;const info={n,dtipo:tipo},o=opzioni(b,'danno',b,info);if(!o.length)return null;
    const sc=decidi(b,o,'danno',att,b,info);if(!sc)return null;b.rea=false;const R2=AP.applica(b,sc.id,[b],rnd,{danno:n});if(R2.err)return null;
    return{riduci:R2.ridotto,ev:[{t:'reazione',chi:b.id,potere:sc.id,bers:b.id},...R2.ev]}}}}
 // ---- movimento ----
 const portata=c=>c.gitt;
 function raggiunte(s,c,pm){const bloc=s.cb.filter(x=>inPiedi(x)&&nemici(c,x)).map(pos),   // i nemici in piedi sbarrano; alleati e chi è a terra si attraversano ma non ci si ferma
   ris=G.raggiungibili(s.arena,pos(c),pm,{blocca:bloc,ignoraDifficile:!!(c.hook&&c.hook.ignoraDifficile)});
  return{ris,fermabili:G.fermabili(ris,s.cb.filter(x=>inCampo(x)&&x!==c).map(pos))}}
 function muovi(s,c,dest,rnd,ev){const t=s.turno;if(t.pm<1)return ERR('Non hai movimento');
  const{ris,fermabili}=raggiunte(s,c,t.pm);if(!fermabili.some(x=>x.q===dest.q&&x.r===dest.r))return ERR('Non puoi arrivarci');
  const pc=G.percorso(ris,dest),opz={ignoraDifficile:!!(c.hook&&c.hook.ignoraDifficile)},inizio=pos(c);let da=pos(c),costo=0;const passi=[];
  for(const n of pc){
   if(!t.disimpegno)for(const e of s.cb.filter(x=>inPiedi(x)&&nemici(c,x)&&x.rea&&melee(x)&&ST.puoAgire(x)&&G.dist(x,da)<=portata(x)&&G.dist(x,n)>portata(x))){
    if(!inPiedi(c))break;e.rea=false;ev.push({t:'opportunita',chi:e.id,bers:c.id});colpo(s,e,'attacco',c,rnd,ev)}
   if(!inPiedi(c))break;
   costo+=G.costoEntrata(s.arena,da,n,opz);c.q=n.q;c.r=n.r;da=n;passi.push(n);
   if(superficie(s,c,rnd,ev,'entra')){t.pm=costo;ev.push({t:'scivola',chi:c.id});break}
   if(!inPiedi(c))break}
  // se il movimento si ferma (caduta, scivolata) su una cella occupata — un alleato a terra si attraversa ma non ci si ferma — si torna all'ultima cella libera
  const occupata=p=>s.cb.some(x=>x!==c&&inCampo(x)&&x.q===p.q&&x.r===p.r);let indietro=false;
  while(passi.length&&occupata(c)){passi.pop();const p=passi.length?passi[passi.length-1]:inizio;c.q=p.q;c.r=p.r;indietro=true}
  t.pm=Math.max(0,t.pm-costo);t.mosso=true;const mv={t:'muovi',chi:c.id,passi,costo};if(indietro)mv.indietro=true;ev.push(mv);return{ok:true}}
 // ---- azioni ----
 const AZIONI=['attacca','scatto','disimpegno','nasconditi','aiuta','rialza','spingi','fuggi','fuga-gruppo','arrendi'];
 function nasconditi(s,c,rnd,ev){const vedono=s.cb.filter(x=>inPiedi(x)&&nemici(c,x)&&G.vista(s.arena,pos(x),pos(c)).visibile);
  if(vedono.some(x=>G.vista(s.arena,pos(x),pos(c)).cop==='nessuna'))return ERR('Non c\'è un riparo: ti vedono');
  const bonus=(c.abil&&c.abil.fur||0)+((c.hook&&c.hook.nascondiBonus)||0);let ok=true,tiro=null,cd=null;
  if(vedono.length){cd=Math.max(...vedono.map(x=>(x.abil&&x.abil.perc)||10));tiro=DAD.d20(rnd).tiro;ok=tiro===20||(tiro!==1&&tiro+bonus>=cd)}
  if(ok)ST.aggiungi(c,'nascosto');ev.push({t:'nasconditi',chi:c.id,ok,tiro,cd,tot:tiro==null?null:tiro+bonus});return{ok:true}}
 function rialza(s,c,b,rnd,ev){if(!b||!inCampo(b)||b.lato!==c.lato||b.hp>0||b.morto)return ERR('Serve un alleato a terra');if(G.dist(c,b)>1)return ERR('Devi essere vicino');
  const tiro=DAD.d20(rnd).tiro,tot=tiro+((c.abil&&c.abil.med)||0),ok=tiro===20||(tiro!==1&&tot>=10);let hp=0;
  if(ok){const r=ST.cura(b,DAD.danno(rnd,'1d4').tot+c.liv);hp=r.n}
  ev.push({t:'rialza',chi:c.id,bers:b.id,ok,tiro,tot,cd:10,hp});return{ok:true}}
 function spingi(s,c,b,rnd,ev){if(!b||!inPiedi(b)||!nemici(c,b))return ERR('Serve un nemico in piedi');if(G.dist(c,b)>1)return ERR('Devi essere vicino');
  const t=ST.salvezza(b,'for',c.cd,rnd),dest=G.indietro(s.arena,pos(c),pos(b)),libero=G.passabile(s.arena,dest)&&!s.cb.some(x=>inCampo(x)&&x.q===dest.q&&x.r===dest.r);
  ev.push({t:'spingi',chi:c.id,bers:b.id,ok:!t.ok&&libero,tiro:t.tiro,tot:t.tot,cd:t.cd});if(!t.ok&&libero){b.q=dest.q;b.r=dest.r}return{ok:true}}
 // ---- poteri e oggetti: bersagli secondo la forma, spinta, Concentrazione ----
 // chi può essere colpito da un potere in base al suo `bers` (niente fuoco amico: le aree dei nemici colpiscono solo l'altra parte)
 const tipoOk=(c,p,x)=>{const amico=x.lato===c.lato;switch(p.bers){case'nemico':case'nemici':return!amico&&inPiedi(x);case'alleato':case'alleati':return amico&&inPiedi(x);
   case'amico':case'amici':return amico&&inCampo(x);case'terra':return amico&&inCampo(x)&&x.hp<=0;default:return x===c}};
 const dentroArea=(s,celle)=>{const k=new Set(celle.map(x=>G.K(x.q,x.r)));return x=>inCampo(x)&&k.has(G.K(x.q,x.r))};
 // bersagli e condizioni di un potere: { bs, per, centro, dir } oppure { err }. A: { bers | cella | dir }
 function forma(s,c,p,A){const ar=s.arena,qui=pos(c),b0=A.bers?trova(s,A.bers):null;let bs,centro=null,dir=null;
  switch(p.area){
   case'se':bs=[c];break;
   case'singolo':{if(!b0||!inCampo(b0))return ERR('Scegli un bersaglio');const k=condizioni(s,c,b0,p);if(k.err)return k;return{bs:[b0],per:{[b0.id]:k.per}}}
   case'aura':{const d=dentroArea(s,G.aura(ar,qui,p.raggio));bs=s.cb.filter(x=>(x===c||d(x))&&tipoOk(c,p,x));break}
   case'cerchio':{const ce=A.cella||(b0&&inCampo(b0)?pos(b0):null);if(!ce||!Number.isFinite(ce.q)||!Number.isFinite(ce.r)||!G.passabile(ar,ce))return ERR('Scegli dove');
    const norm=p.gitt==='arma'?c.gitt:p.gitt;if(G.dist(qui,ce)>Math.max(1,norm))return ERR('Troppo lontano');
    if(G.dist(qui,ce)>0&&!G.vista(ar,qui,ce).visibile)return ERR('Non vedi quel punto');
    centro={q:ce.q,r:ce.r};const d=dentroArea(s,G.cerchio(ar,centro,p.raggio));bs=s.cb.filter(x=>d(x)&&tipoOk(c,p,x));break}
   case'cono':case'linea':{dir=Number.isInteger(A.dir)?((A.dir%6)+6)%6:A.cella?(p.area==='cono'?G.direzioneVerso(qui,A.cella):G.asseVerso(qui,A.cella)):b0&&inCampo(b0)?(p.area==='cono'?G.direzioneVerso(qui,pos(b0)):G.asseVerso(qui,pos(b0))):null;
    if(dir==null)return ERR('Scegli la direzione');const d=dentroArea(s,p.area==='cono'?G.cono(ar,qui,dir,p.raggio):G.lineaDa(ar,qui,dir,p.raggio));bs=s.cb.filter(x=>d(x)&&tipoOk(c,p,x));break}
   default:return ERR('Potere non valido')}
  if(!bs.length)return ERR('Nessun bersaglio nell\'area');
  const per={};for(const b of bs){if(p.att){const k=condizioni(s,c,b,p,{senzaGittata:true});per[b.id]=k.err?{}:k.per}}
  return{bs,per,centro,dir}}
 // spinge `b` di `n` esagoni lontano da `c`: si ferma davanti a muri, ostacoli e creature
 function spinta(s,c,b,n){const da=pos(b);let passi=0;
  for(let i=0;i<n&&inPiedi(b);i++){const d=G.indietro(s.arena,pos(c),pos(b));if(!G.passabile(s.arena,d)||s.cb.some(x=>x!==b&&inCampo(x)&&x.q===d.q&&x.r===d.r))break;b.q=d.q;b.r=d.r;passi++}
  return{passi,da,a:pos(b)}}
 // usa un potere (o un oggetto) secondo la sua forma. A.conc:'vant' = Concentrazione per il vantaggio; A.ritiraD20 = rigioco dopo `ritira`
 function potere(s,c,p,A,rnd,ev){
  if(A.conc&&(A.conc!=='vant'||!p.att))return ERR(A.conc!=='vant'?'Concentrazione non valida':'La Concentrazione serve per i tiri per colpire');
  if((A.conc||A.ritiraD20)&&c.conc<1)return ERR('Non hai Concentrazione');
  const f=forma(s,c,p,A);if(f.err)return f;
  const ctx={per:f.per,alleatoVicino:f.bs.some(b=>b!==c&&alleatoVicino(s,c,b)),vant:A.conc==='vant',ritira:!!A.ritiraD20,rea:REA};
  const R=p.oggetto?AP.applicaOggetto(c,p.oggetto,f.bs,rnd,ctx):AP.applica(c,p.id,f.bs,rnd,ctx);if(R.err)return R;
  if(p.oggetto)ev.push({t:'oggetto',chi:c.id,id:p.oggetto,nome:p.nome,centro:f.centro});
  if(A.conc==='vant'||A.ritiraD20){c.conc--;ev.push({t:'conc-spesa',chi:c.id,uso:A.ritiraD20?'ritira':'vant'})}
  const spinti=[],evs=R.ev.map(e=>{
   if(e.t==='spingi'&&e.n!=null&&e.chi==null){const b=trova(s,e.bers);if(!b||!inPiedi(b))return{t:'spinto',chi:c.id,bers:e.bers,passi:0};const m=spinta(s,c,b,e.n);if(m.passi)spinti.push(b);return{t:'spinto',chi:c.id,bers:b.id,passi:m.passi,da:m.da,a:m.a}}
   if(e.t==='disimpegna'){s.turno.disimpegno=true;return e}
   return e});
  dopoEventi(s,evs,ev);for(const b of spinti)if(inPiedi(b))superficie(s,b,rnd,ev,'entra');
  return R}
 // dove e a chi si può usare un potere adesso: su di sé / bersagli (singolo) / chi colpisce (aura) / centri (cerchio) / direzioni (cono e linea)
 function possibilita(s,c,p){const prova=A=>{const f=forma(s,c,p,A);return f.err?null:f};
  switch(p.area){
   case'se':return{bersagli:[c.id]};
   case'singolo':{const ids=s.cb.filter(b=>inCampo(b)&&tipoOk(c,p,b)&&prova({bers:b.id})).map(b=>b.id);return ids.length?{bersagli:ids}:null}
   case'aura':{const f=prova({});return f?{colpiti:f.bs.map(b=>b.id)}:null}
   case'cerchio':{const cand=new Map();for(const x of s.cb)if(inCampo(x)&&tipoOk(c,p,x)){cand.set(G.K(x.q,x.r),pos(x));for(const v of G.vicini(x))cand.set(G.K(v.q,v.r),v)}
    const centri=[];for(const ce of cand.values()){const f=prova({cella:ce});if(f)centri.push({q:ce.q,r:ce.r,colpiti:f.bs.map(b=>b.id)})}return centri.length?{centri}:null}
   case'cono':case'linea':{const dirs=[];for(let d=0;d<6;d++){const f=prova({dir:d});if(f)dirs.push({dir:d,colpiti:f.bs.map(b=>b.id)})}return dirs.length?{direzioni:dirs}:null}}
  return null}
 const uscite=(s,lato)=>lato==='eroi'?s.arena.uscite:G.celle(s.arena).filter(c=>c.r===0&&G.passabile(s.arena,c));
 function esci(s,c,esito,ev){c[esito]=true;ev.push({t:esito==='fuggito'?'fuggito':'arreso',chi:c.id});rimuoviDaOrdine(s,c.id)}
 // fuga del gruppo: ogni eroe in piedi tira (Furtività) contro una CD che sale con il livello dei nemici; basta la metà
 function fugaGruppo(s,c,rnd,ev){const nem=s.cb.filter(x=>x.lato==='nemici'&&inCampo(x)),cd=CD_FUGA+Math.ceil(Math.max(1,...nem.map(x=>x.liv))/2),eroi=s.cb.filter(x=>x.lato==='eroi'&&inPiedi(x));
  const prove=eroi.map(x=>{const tiro=DAD.d20(rnd).tiro,tot=tiro+((x.abil&&x.abil.fur)||0);return{chi:x.id,tiro,tot,ok:tiro===20||(tiro!==1&&tot>=cd)}}),riusciti=prove.filter(p=>p.ok).length,ok=riusciti*2>=eroi.length;
  ev.push({t:'fuga-gruppo',chi:c.id,cd,prove,ok});if(ok){for(const x of eroi){x.fuggito=true;rimuoviDaOrdine(s,x.id)}finisci(s,'fuga',ev)}return{ok:true}}
 // ---- act ----
 // act può tornare { pausa } se un eroe deve scegliere una reazione (vedi `reazioni`); lo stato passato non cambia mai
 function act(s0,a){try{return agisci(s0,a)}catch(e){if(e instanceof Pausa)return{pausa:e.pausa};throw e}finally{REA=null}}
 function agisci(s0,a){if(!a||typeof a!=='object')return ERR('Azione non valida');if(s0.over)return ERR('Battaglia finita');
  const c0=attore(s0);
  // «ritira»: dopo un attacco singolo di un eroe con Concentrazione si può rigiocare l'azione dal punto di prima, tirando il d20 una seconda volta (D10)
  if(a.t==='ritira'){const pr=s0.prima;if(!pr||!c0||pr.chi!==c0.id)return ERR('Non c\'è un tiro da ritirare');
   const base=cl(pr.stato);base.prima=null;return agisci(base,Object.assign({},pr.a,{ritiraD20:true,conc:undefined,dec:a.dec||[]}))}
  const s=cl(s0),c=attore(s);if(!c)return ERR('Nessuno può agire');if(a.chi&&a.chi!==c.id)return ERR('Non è il turno di '+a.chi);
  const rnd=rndDi(s),ev=[],t=s.turno;let r={ok:true};REA=reazioni(s,rnd,a);
  const pa=a.t==='potere'?AP.P[a.id]:null,ritirabile=c.lato==='eroi'&&c.conc>=1&&!a.ritiraD20&&!a.conc&&(a.t==='attacca'||(pa&&pa.att&&pa.multi===1&&pa.area==='singolo'));
  let prima=null;if(ritirabile){const{prima:_,...resto}=s0;prima=cl(resto)}
  const spendi=k=>{if(!t[k])return ERR(k==='azione'?'Hai già usato l\'azione':'Hai già usato l\'azione bonus');t[k]=false;return null};
  const puo=()=>inPiedi(c)&&ST.puoAgire(c)?null:ERR(c.nome+' non può agire');
  const bersaglio=()=>{const b=trova(s,a.bers);return b&&inCampo(b)?b:null};
  switch(a.t){
   case'fine':{for(const e of ST.fineTurno(c))ev.push(Object.assign({chi:c.id},e));prossimo(s,rnd,ev);break}
   case'muovi':{r=puo()||muovi(s,c,{q:a.a&&a.a.q,r:a.a&&a.a.r},rnd,ev);break}
   case'ritira-mov':{r=puo();if(r)break;if(t.ritMov||t.pm<1||c.conc<1||t.mosso)return ERR('Non puoi ritirare il movimento');
    c.conc--;t.ritMov=true;const base=ST.movEff(c),d=DAD.d(rnd,4);t.pm=t.pmTirato=Math.max(1,base-2+d);ev.push({t:'ritira-mov',chi:c.id,pm:t.pm,dado:d});break}
   case'attacca':{r=puo();if(r)break;const b=bersaglio();if(!b||!inPiedi(b)||!nemici(c,b))return ERR('Serve un nemico in piedi');
    if(!t.azione)return ERR('Hai già usato l\'azione');const x=potere(s,c,AP.P['attacco'],a,rnd,ev);if(x.err)return x;t.azione=false;break}
   case'potere':{r=puo();if(r)break;const p=AP.P[a.id];if(!p||!c.poteri.includes(a.id))return ERR('Non conosci questo potere');
    if(p.costo==='reazione')return ERR('È una reazione: scatta da sola quando serve');const k=p.costo==='bonus'?'bonus':'azione';if(!t[k])return ERR(k==='azione'?'Hai già usato l\'azione':'Hai già usato l\'azione bonus');
    const x=potere(s,c,p,a,rnd,ev);if(x.err)return x;t[k]=false;break}
   case'oggetto':{r=puo();if(r)break;const p=AP.oggetto(a.id);if(!p)return ERR('Non si può usare in battaglia');if(!(c.cintura||[]).includes(a.id))return ERR('Non è alla cintura');
    if(!t[p.costo])return ERR(p.costo==='azione'?'Hai già usato l\'azione':'Hai già usato l\'azione bonus');
    const x=potere(s,c,p,a,rnd,ev);if(x.err)return x;t[p.costo]=false;c.cintura.splice(c.cintura.indexOf(a.id),1);break}
   case'scatto':{r=puo()||spendi('azione');if(r)break;if(ST.movEff(c)<=0)return ERR('Non puoi muoverti');t.pm+=t.pmTirato;t.scattato=true;ev.push({t:'scatto',chi:c.id,pm:t.pm});break}
   case'disimpegno':{r=puo()||spendi('azione');if(r)break;t.disimpegno=true;ev.push({t:'disimpegno',chi:c.id});break}
   case'nasconditi':{r=puo();if(r)break;if(!t.azione)return ERR('Hai già usato l\'azione');const x=nasconditi(s,c,rnd,ev);if(x.err)return x;t.azione=false;break}
   case'aiuta':{r=puo();if(r)break;const b=bersaglio();if(!b||b===c||!inPiedi(b)||b.lato!==c.lato)return ERR('Serve un alleato in piedi');if(G.dist(c,b)>2)return ERR('È troppo lontano');
    if(!t.azione)return ERR('Hai già usato l\'azione');t.azione=false;ST.aggiungi(b,'mirato',1);ev.push({t:'aiuta',chi:c.id,bers:b.id});break}
   case'rialza':{r=puo();if(r)break;if(!t.azione)return ERR('Hai già usato l\'azione');const x=rialza(s,c,bersaglio(),rnd,ev);if(x.err)return x;t.azione=false;break}
   case'spingi':{r=puo();if(r)break;if(!t.azione)return ERR('Hai già usato l\'azione');const x=spingi(s,c,bersaglio(),rnd,ev);if(x.err)return x;t.azione=false;break}
   case'fuggi':{r=puo();if(r)break;if(t.pm<1)return ERR('Non hai movimento per uscire');if(!uscite(s,c.lato).some(u=>u.q===c.q&&u.r===c.r))return ERR('Devi stare su un\'uscita');
    esci(s,c,'fuggito',ev);break}
   case'fuga-gruppo':{r=puo();if(r)break;if(c.lato!=='eroi')return ERR('Solo la compagnia fugge così');if(!t.azione)return ERR('Hai già usato l\'azione');t.azione=false;fugaGruppo(s,c,rnd,ev);break}
   case'arrendi':{if(!(c.ia&&c.ia.arrende)||c.hp>c.hpMax*.25)return ERR('Non si arrende');esci(s,c,'arreso',ev);break}
   default:return ERR('Azione sconosciuta')}
  if(r&&r.err)return r;
  // chi esce dal campo o cade durante il proprio turno lo finisce lì
  if(a.t!=='fine'&&!s.over){controllaFine(s,ev);if(!s.over&&s.turno&&s.turno.id===c.id&&(!s.ordine.includes(c.id)||!inPiedi(c)))prossimo(s,rnd,ev)}
  s.prima=prima&&!s.over&&s.turno&&s.turno.id===c.id?{chi:c.id,a:Object.fromEntries(Object.entries(a).filter(([k])=>k!=='dec')),stato:prima}:null;
  s.ev=ev;s.evn++;return{s,ev}}
 // ---- viste per chi gioca (e per l'IA) ----
 const ordine=s=>s.ordine.map((id,k)=>{const c=trova(s,id);return{id,nome:c.nome,lato:c.lato,hp:c.hp,hpMax:c.hpMax,inizTot:c.inizTot,attuale:k===s.i&&!s.over,aTerra:c.hp<=0}});
 function anteprima(s,a){const c=attore(s);if(!c)return ERR('Nessuno agisce');
  if(a.t==='attacca'){const b=trova(s,a.bers);if(!b||!inPiedi(b)||!nemici(c,b))return ERR('Serve un nemico in piedi');const k=condizioni(s,c,b,AP.P['attacco']);if(k.err)return k;
   const x=AP.stima(c,'attacco',b,{vant:k.per.vant,svant:k.per.svant,ca:k.per.ca});return Object.assign({},x,{cop:k.v.cop,ca:k.v.ca,vant:k.per.vant,svant:k.per.svant,dist:k.d,lunga:k.lunga})}
  if(a.t==='potere'||a.t==='oggetto'){const p=a.t==='oggetto'?AP.oggetto(a.id):AP.P[a.id];if(!p)return ERR('Potere sconosciuto');const f=forma(s,c,p,a);if(f.err)return f;
   const bersagli=f.bs.map(b=>Object.assign({bers:b.id,lato:b.lato},AP.stima(c,p,b,f.per[b.id]||{}))),nem=bersagli.filter(x=>x.lato!==c.lato),amici=bersagli.filter(x=>x.lato===c.lato);
   return{bersagli,n:bersagli.length,atteso:nem.reduce((x,y)=>x+y.atteso,0),cura:amici.reduce((x,y)=>x+y.cura,0),centro:f.centro,dir:f.dir,costo:p.costo}}
  return ERR('Anteprima non disponibile')}
 function mosseValide(s){const c=attore(s);if(!c)return null;const t=s.turno,agisce=inPiedi(c)&&ST.puoAgire(c),o={chi:c.id,pm:t.pm,azione:t.azione,bonus:t.bonus,rea:c.rea,muovi:[],attacchi:[],azioni:['fine'],bersagli:{}};
  if(!agisce)return o;
  if(t.pm>=1)o.muovi=raggiunte(s,c,t.pm).fermabili.filter(x=>x.costo>0);
  if(t.azione){for(const b of s.cb.filter(x=>inPiedi(x)&&nemici(c,x))){const x=anteprima(s,{t:'attacca',bers:b.id});if(!x.err)o.attacchi.push({bers:b.id,dist:x.dist,lunga:x.lunga,pc:x.pc,dannoColpo:x.dannoColpo,atteso:x.atteso,cop:x.cop,vant:x.vant,svant:x.svant})}
   o.azioni.push('disimpegno');if(ST.movEff(c)>0)o.azioni.push('scatto');
   const vedono=s.cb.filter(x=>inPiedi(x)&&nemici(c,x)&&G.vista(s.arena,pos(x),pos(c)).visibile);if(!vedono.some(x=>G.vista(s.arena,pos(x),pos(c)).cop==='nessuna'))o.azioni.push('nasconditi');
   const al=s.cb.filter(x=>inPiedi(x)&&x!==c&&x.lato===c.lato&&G.dist(c,x)<=2);if(al.length){o.azioni.push('aiuta');o.bersagli.aiuta=al.map(x=>x.id)}
   const gi=s.cb.filter(x=>inCampo(x)&&x.lato===c.lato&&x.hp<=0&&G.dist(c,x)<=1);if(gi.length){o.azioni.push('rialza');o.bersagli.rialza=gi.map(x=>x.id)}
   const sp=s.cb.filter(x=>inPiedi(x)&&nemici(c,x)&&G.dist(c,x)<=1);if(sp.length){o.azioni.push('spingi');o.bersagli.spingi=sp.map(x=>x.id)}
   if(c.lato==='eroi')o.azioni.push('fuga-gruppo')}
  o.poteri=[];o.oggetti=[];
  for(const id of c.poteri){const p=AP.P[id];if(id==='attacco'||!p||p.costo==='reazione')continue;const k=p.costo==='bonus'?'bonus':'azione';if(!t[k]||AP.usiRimasti(c,p)<=0)continue;
   const x=possibilita(s,c,p);if(x)o.poteri.push(Object.assign({id,nome:p.nome,costo:p.costo,area:p.area,usi:AP.usiRimasti(c,p)},x))}
  for(const id of new Set(c.cintura||[])){const p=AP.oggetto(id);if(!p||!t[p.costo])continue;const x=possibilita(s,c,p);if(x)o.oggetti.push(Object.assign({id,nome:p.nome,costo:p.costo,area:p.area},x))}
  if(s.prima&&s.prima.chi===c.id&&c.conc>=1)o.azioni.push('ritira');
  if(t.pm>=1&&uscite(s,c.lato).some(u=>u.q===c.q&&u.r===c.r))o.azioni.push('fuggi');
  if(c.ia&&c.ia.arrende&&c.hp<=c.hpMax*.25)o.azioni.push('arrendi');
  if(!t.ritMov&&!t.mosso&&t.pm>=1&&c.conc>=1)o.azioni.push('ritira-mov');
  return o}
 // ---- fine battaglia ----
 // esito e conti da riportare agli eroi della campagna (PF, cariche, Concentrazione) e l'esperienza guadagnata
 function riepilogo(s){const sconfitti=s.cb.filter(c=>c.lato==='nemici'&&(c.morto||c.arreso)),xp=sconfitti.reduce((a,c)=>a+(c.xp||0),0),eroi=s.cb.filter(c=>c.lato==='eroi'),part=eroi.filter(c=>!c.fuori);
  const quota=part.length?Math.floor(xp/part.length):0;
  return{esito:s.over?s.over.esito:null,giri:s.giro,xp,xpPerEroe:quota,
   eroi:eroi.map(c=>({id:c.id,indice:c.indice,nome:c.nome,hp:c.hp,hpMax:c.hpMax,conc:c.conc,usi:cl(c.usi),cintura:(c.cintura||[]).slice(),stato:c.fuggito?'fuggito':c.hp<=0?'a-terra':'in-piedi',xp:c.fuori?0:quota})),
   nemici:s.cb.filter(c=>c.lato==='nemici').map(c=>({id:c.id,def:c.def,esito:c.morto?'sconfitto':c.arreso?'arreso':c.fuggito?'fuggito':'in-campo'}))}}
 return{MAX_EROI,GIRI_MAX,AZIONI,nuovo,act,attore,ordine,mosseValide,anteprima,riepilogo,condizioni,raggiunte,inCampo,inPiedi,trova,uscite}})();
if(typeof module!=='undefined')module.exports=ASCO;
