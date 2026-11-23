/* ---- Compagnia di ventura, Economia e azioni nei luoghi: prezzi e mercato, paga e viveri, rendite, botteghe (`rinnova`), incarichi e `fai`. Motore puro, senza DOM né rete. ----
   Estensione di VEN (28k): aggiunge le sue funzioni allo stesso oggetto; gli aiutanti del nucleo arrivano da `VEN._`,
   le funzioni degli altri file si chiamano `VEN.nome(...)`. Piano: docs/passi/01-spacca-mondo.md. */
// Passo 36, l'economia del mondo (solo mondi `s.geo===2`): tutti i numeri qui. Niente Math.pow/exp/log: la curva dei prezzi è una tabella.
VDAT.ECO={
 RIF:40,            // scorta di riferimento: con tanta merce in magazzino il prezzo è quello base
 // CURVA[i] ≈ q^0,6 con q = 0,3 + i/10 (0,3 … 3,0), calcolata una volta e scritta qui; q = RIF / scorta, arrotondato a 0,1
 CURVA:[.486,.577,.66,.736,.807,.875,.939,1,1.059,1.116,1.17,1.224,1.275,1.326,1.375,1.423,1.47,1.516,1.561,1.605,1.648,1.691,1.733,1.774,1.815,1.855,1.894,1.933],
 MIN:.4,MAX:3,      // il prezzo (curva × rialzo di guerra) resta tra queste due volte la base
 // al giorno, per luogo, con k = prosperità/60: [produce, non produce, consuma] (cibo e altre merci). Scorta di equilibrio = RIF × produzione / consumo
 TASSI:{villaggio:{c:[2.4,1.8,1.4],a:[1,.5,.7]},citta:{c:[2.4,2.4,3],a:[1.8,.8,1.2]},porto:{c:[3,2.2,2.5],a:[1.6,.6,1]}},
 STAG:{prim:1,est:1.1,aut:1.5,inv:.5},   // quanto producono i villaggi nelle stagioni (il raccolto è in autunno)
 TETTO:120,         // scorta massima di un luogo
 RAGGIO:15,         // mercato regionale: luoghi entro quante celle si scambiano scorte...
 QUOTA:.05,         // ...e ogni settimana si pareggia il 5% della differenza
 SETT:3,            // giorno della settimana (giorno % 7) in cui si pareggia
 RAGGIO_GUERRA:30,  // razzia e assedio fanno salire il cibo in tutti i luoghi entro tante celle
 RIALZO:.35,        // di quanto sale il cibo al momento dell'evento: poi cala in linea retta...
 DURATA:21,         // ...e dopo tanti giorni è finito
 FERMO:14,          // giorni senza produzione per un villaggio razziato
 FAME:.05,          // quota di guarnigione che muore ogni giorno di assedio senza cibo (almeno uno)
 PAGA_SOGLIA:40,PAGA_OLTRE:.02,   // la paga delle truppe (non delle guarnigioni) sale del 2% per ogni uomo oltre i 40
 CAV_VIVERI:2,      // un cavaliere mangia 2 razioni invece di 1 (uomo con `molt('viveri')`, cavallo col foraggio)
 BOTTINO:{4:.003,5:.006},BOTTINO_COMP:.4,BOTTINO_MAX:.2,   // quota di bottino chiesta dalle truppe di grado alto (per uomo); i compagni la chiedono al 40%
 STORIA:8};         // prezzi degli ultimi giorni tenuti per la freccia della tendenza (il più vecchio è di 7 giorni fa)
Object.assign(VEN,(()=>{
 const{D,L,M0,MERCATO,MURA,OSTERIA,P,SITO,TU,abil,aggiungi,capDi,capi,chiave,dist,forza,forzaTr,giorno,inGuerra,limite,nemiche,nomeF,ogg,part,relaz,rnd,togliUomini,uomini,vicinoOk}=VEN._;
 function prezzoOgg(s,o,verso){const c=abil(s,'commercio'),b=Math.max(20,o.prezzo);return Math.round(verso>0?b*(1.1-c*.02):b*.4*(1+c*.03))}
 // offerte del luogo: mercenari in taverna e incarichi
 function rinnova(s,l,r){const pesca=(a,n)=>{const c=a.slice(),o=[];while(o.length<n&&c.length)o.push(c.splice(Math.floor(r()*c.length),1)[0]);return o},g=giorno(s);
  if(OSTERIA[l.tipo]){l.merc=[];const tipi=['mer_f3','mer_t3','mer_c4'];for(let k=0;k<(l.tipo==='citta'?2:1);k++)aggiungi(l.merc,tipi[Math.floor(r()*3)],1+Math.floor(r()*(l.tipo==='citta'?5:3)))}
  if(l.tipo==='citta')l.bott=pesca(D.BOTTEGA[VEN.regni(s).includes(l.faz)?VEN.cult(s,l.faz):M0(s,l)],4).concat(pesca(D.COMUNI,3));
  else if(l.tipo==='porto')l.bott=pesca(['cannocchiale','borsa','corno','stocco','sciabola','piumato','dadi','brocchiere'],3);
  else if(l.tipo==='monastero')l.bott=pesca(['bisaccia','stendardo','trattato','cuoio','mazza'],2);
  else if(l.tipo==='locanda')l.bott=pesca(D.COMUNI,2);
  if(l.inc&&l.inc.preso)return;const sito=t=>s.l.filter(x=>x.tipo===t&&x.g.length).sort((a,b)=>dist(a,l)-dist(b,l))[0];
  if(l.tipo==='villaggio')l.inc={tipo:'predoni',premio:120+Math.floor(r()*80)+g*2,giorni:6};
  else if(l.tipo==='citta'||l.tipo==='porto'){const altre=s.l.filter(x=>(x.tipo==='citta'||x.tipo==='porto')&&x.id!==l.id&&x.faz!==l.faz),a=altre[Math.floor(r()*altre.length)],beni=D.PRODUCE[VEN.regni(s).includes(l.faz)?VEN.cult(s,l.faz):M0(s,l)].filter(m=>!D.MERCI[m].cibo),m=beni[Math.floor(r()*beni.length)],n=4+Math.floor(r()*5);
   l.inc=a?{tipo:'consegna',bene:m,n,a:a.id,premio:Math.round(n*D.MERCI[m].base*.9+60+dist(a,l)*4),giorni:12}:null}
  else if(l.tipo==='castello')l.inc={tipo:'reclute',n:4+Math.floor(r()*4),premio:260+Math.floor(r()*120),giorni:12};
  else if(l.tipo==='monastero'){const x=sito('rovine');l.inc=x?{tipo:'reliquia',a:x.id,premio:280+Math.floor(r()*160),giorni:24}:null}
  else if(l.tipo==='locanda'){const x=sito('covo');l.inc=x?{tipo:'taglia',a:x.id,premio:420+Math.floor(r()*200),giorni:30}:null}
  else l.inc=null}
 const razioni=p=>Object.keys(p.merci||{}).reduce((a,m)=>a+(D.MERCI[m].cibo?p.merci[m]:0),0);
 const carico=p=>Object.keys(p.merci||{}).reduce((a,m)=>a+p.merci[m],0);
 const caricoMax=s=>30+uomini(TU(s))*2+capi(s).reduce((a,c)=>a+(c.eq.cavallo?12:0),0);
 // giorni di viveri: razioni diviso il consumo giornaliero (una razione ogni sei uomini, almeno una)
 const giorniViveri=s=>{const t=TU(s);return Math.floor(razioni(t)/Math.max(1,Math.ceil(VEN.uomini(t)/6)))};
 const paga=s=>{const tr=TU(s).tr.reduce((a,e)=>a+e.n*D.TR[e.t].paga*2,0),x=tr+s.l.reduce((a,l)=>a+(l.faz==='tu'?Math.ceil(forzaTr(l.g)*.12):0),0),m=VEN.molt(s,'paga',{});return m===1?x:Math.round(x*m)};
 // prezzo di una merce in un luogo: sale quando la scorta è bassa. verso = 1 compri, -1 vendi
 function prezzo(s,l,m,verso){const sc=l.scorte[m]||0,k=s.geo===2?VEN.curvaEco(s,l,m):Math.max(.45,Math.min(2.1,1.9-1.2*sc/60)),c=abil(s,'commercio');
  return Math.max(1,Math.round(D.MERCI[m].base*k*(verso>0?1.12-c*.02:.88+c*.02)*VEN.molt(s,'prezzo',{lid:l.id,m,compra:verso>0})))}
 // prezzo d'acquisto medio di una merce nei luoghi noti con mercato (pura); se nessuno la tratta vale il prezzo base
 function prezzoMedio(s,m){const v=s.l.filter(l=>l.noto&&MERCATO[l.tipo]).map(l=>prezzo(s,l,m,1));return v.length?Math.round(v.reduce((a,x)=>a+x,0)/v.length):D.MERCI[m].base}
 // novità di un luogo, al più tre, in quest'ordine: torneo, incarico, compagno, pezzo unico, assedio
 function segnali(s,lid){const l=s.l[lid];if(!l)return[];const o=[],g=giorno(s);
  if(VEN.torneoOggi(s,l))o.push({k:'torneo',tx:'Torneo oggi'});
  // l'incarico è una novità solo se paga almeno 1,3 volte la media di quelli che conosci (quelli già presi o appena chiusi); senza riferimento si segnala sempre
  if(l.inc&&!l.inc.preso){const nt=s.incarichi.map(q=>q.premio),md=nt.length?nt.reduce((a,x)=>a+x,0)/nt.length:0;if(!md||l.inc.premio>=1.3*md)o.push({k:'incarico',tx:'Incarico'})}
  if(D.COMPAGNI.some(c=>s.compagni[c.id]===l.id))o.push({k:'compagno',tx:'Compagno in taverna'});
  if(l.unica)o.push({k:'unico',tx:'Pezzo unico dall\'armaiolo'});
  if(l.ass||(s.assedio&&s.assedio.lid===l.id))o.push({k:'assedio',tx:'Assedio in vista'});
  return o.slice(0,3)}
 const renditaL=l=>l.tipo==='villaggio'?Math.round(l.prosp*2.5):l.tipo==='porto'?Math.round(l.prosp*3.5):l.tipo==='castello'?120:l.tipo==='citta'?Math.round(l.prosp*7):0;
 // rendite: solo i luoghi che tieni (quelli dati in feudo rendono al signore) e, da vassallo, i feudi del re; il malcontento del regno le riduce
 function rendite(s){let x=0;for(const l of s.l)if((l.faz==='tu'&&l.sig<0)||(s.servizio&&s.servizio.tipo==='vas'&&l.sig===-2)){const m=VEN.molt(s,'rendita',{lid:l.id}),v=renditaL(l);x+=m===1?v:Math.round(v*m)}
  if(s.corona&&s.corona.malc)x=Math.round(x*(1-s.corona.malc/200));
  if(s.servizio&&s.servizio.tipo==='mer')x+=Math.round(forza(TU(s))*.8);return x}
 // ---------- prigionia ----------
 function libera(s){const tu=TU(s),M=VEN.mappaDi(s);let m=null,md=1e9;for(const l of s.l){if(l.faz!=='tu'&&nemiche(s,'tu',l.faz))continue;const d=dist(l,tu);if(d<md){md=d;m=l}}
  if(m){const v=vicinoOk(M,m.x+1,m.y);tu.x=v[0];tu.y=v[1]}s.prigioniero=null;L(s,'Sei di nuovo libero'+(m?', nei pressi di '+m.nome:'')+'.','bene');s.ev.push({t:'libero'})}
 // ---------- incontri ----------
 const titoloInc=(s,q)=>q.tipo==='reliquia'?'Ripulire '+s.l[q.a].nome:q.tipo==='taglia'?'Taglia: '+s.l[q.a].nome:q.tipo==='predoni'?'Caccia ai predoni presso '+s.l[q.da].nome:q.tipo==='consegna'?q.n+' di '+D.MERCI[q.bene].nome+' a '+s.l[q.a].nome:q.n+' soldati per '+s.l[q.da].nome;
 // un solo punto d'uscita: il corpo di `fai` sta in `faiNucleo`; prima si offre l'azione ai ganci `azione` (azioni nuove), dopo una riuscita si chiama `fatto`
 function fai(s,z){if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};
  const x=VEN.chiedi('azione',s,z);if(x&&(x.s||x.err))return x;
  const rr=faiNucleo(s,z);if(rr&&rr.s)VEN.ganci('fatto',s,z,rr);return rr}
 function faiNucleo(s,z){const tu=TU(s),r=rnd(s),lid=s.dentro>=0?s.dentro:s.davanti,l=lid>=0?s.l[lid]:null,c=capDi(s,z.seat);if(!c)return{err:'Capitano sconosciuto'};
  if(s.incontro&&s.incontro.tipo==='arena'&&!['ritira','equipa','togli','abilita'].includes(z.a))return{err:'Il duello ti aspetta'};
  // sempre possibili
  if(['feudo','investi','aduna','dichiara','rompi'].includes(z.a)){if(!s.corona)return{err:'Non hai un regno'};return VEN.faiRegno(s,z)}
  if(z.a==='abilita'){if(c.punti<1)return{err:'Nessun punto da spendere'};if(!(z.k in c.ab))return{err:'Abilità sconosciuta'};if(c.ab[z.k]>=10)return{err:'Già al massimo'};c.ab[z.k]++;c.punti--;return{s}}
  if(z.a==='promuovi'){const e=tu.tr.find(e=>e.t===z.t),T=e&&D.TR[e.t];if(!e||!T.su.includes(z.su))return{err:'Promozione non valida'};const n=Math.max(1,z.n||1),xp=D.XP_SU[T.t]*n,oro=D.PROMO[T.t]*n;
   if(e.n<n)return{err:'Non hai abbastanza uomini'};if((e.xp||0)<xp)return{err:'Non hanno ancora abbastanza esperienza'};if(tu.oro<oro)return{err:'Servono '+oro+' monete'};
   e.xp-=xp;tu.oro-=oro;const fer=Math.min(e.f||0,Math.max(0,n-(e.n-(e.f||0))));togliUomini(tu.tr,z.t,n);aggiungi(tu.tr,z.su,n);if(fer){const e2=tu.tr.find(x=>x.t===z.su);e2.f=(e2.f||0)+fer}return{s}}
  if(z.a==='congeda'){const n=togliUomini(tu.tr,z.t,Math.max(1,z.n||1));return n?{s}:{err:'Nessuno da congedare'}}
  if(z.a==='libera'){const i=s.prig.findIndex(e=>e.t===z.t&&!e.sig);if(i<0)return{err:'Nessun prigioniero'};s.prig.splice(i,1);VEN.reagisci(s,'libera');return{s}}
  if(z.a==='liberasig'){const i=s.prig.findIndex(e=>e.sig!=null&&e.sig===z.sig);if(i<0)return{err:'Non è tuo prigioniero'};const sg=s.sig[z.sig];s.prig.splice(i,1);sg.prig=null;const pg=part(s,sg.pid);if(pg)pg.ia.t=s.t+P.GIORNO;
   VEN.memSig(sg).lib++;relaz(s,sg.faz,6);L(s,'Liberi '+sg.nome+' senza riscatto: se ne ricorderà.','bene');return{s}}
  if(z.a==='esci'){s.dentro=-1;s.davanti=-1;return{s}}
  if(z.a==='equipa'){const i=z.i|0,id=tu.zaino[i],o=ogg(id),eq=c.eq;if(!o)return{err:'Oggetto sconosciuto'};
   if(o.slot==='cimelio'){const k=z.k===1?1:z.k===0?0:(eq.cimeli[0]&&!eq.cimeli[1]?1:0),old=eq.cimeli[k];eq.cimeli[k]=id;tu.zaino.splice(i,1);if(old)tu.zaino.push(old);return{s}}
   if(o.slot==='scudo'&&(ogg(eq.arma)||{}).due)return{err:'Con un\'arma a due mani non si porta lo scudo'};
   const old=eq[o.slot];eq[o.slot]=id;tu.zaino.splice(i,1);if(old)tu.zaino.push(old);if(o.slot==='arma'&&o.due&&eq.scudo){tu.zaino.push(eq.scudo);eq.scudo=null}return{s}}
  if(z.a==='togli'){const eq=c.eq;if(z.slot==='cimelio'){const k=z.k?1:0;if(!eq.cimeli[k])return{err:'Niente da togliere'};tu.zaino.push(eq.cimeli[k]);eq.cimeli[k]=null;return{s}}
   if(z.slot==='arma'||z.slot==='armatura')return{err:'Senza non si va in battaglia: scambiala con un\'altra'};if(!eq[z.slot])return{err:'Niente da togliere'};tu.zaino.push(eq[z.slot]);eq[z.slot]=null;return{s}}
  if(!l)return{err:'Devi essere in un luogo'};
  const dentro=s.dentro>=0,ost=l.faz!=='tu'&&nemiche(s,'tu',l.faz),mio=l.faz==='tu'||(l.sig===-2);
  if(z.a==='fonda')return VEN.fondaRegno(s,z,l,dentro,mio);
  if(z.a==='assalta'){if(!SITO[l.tipo])return{err:'Qui non c\'è nulla da assaltare'};if(!l.g.length)return{err:'Non c\'è più nessuno'};s.incontro={tipo:'assalto',lid:l.id};s.ev.push({t:'incontro'});return{s}}
  if(z.a==='assedia'){if(!ost||!MURA[l.tipo])return{err:'Non si può assediare'};s.assedio={lid:l.id,pronto:s.t+Math.max(4,P.ASSEDIO_ORE-abil(s,'comando'))*60,da:s.t,ariete:false};tu.ord={t:'aspetta',fino:s.assedio.pronto+60};L(s,'Cingete d\'assedio '+l.nome+': scale e arieti saranno pronti tra qualche ora.','guerra');return{s}}
  if(z.a==='razzia'){if(!ost||l.tipo!=='villaggio')return{err:'Non si può razziare'};if(l.sacc>giorno(s))return{err:'Non è rimasto nulla da prendere'};const oro=60+Math.round(l.prosp*2.2);tu.oro+=oro;tu.merci.grano=(tu.merci.grano||0)+6;
   l.sacc=giorno(s)+6;l.prosp=Math.max(5,l.prosp-20);l.rec=0;l.rel-=40;relaz(s,l.faz,-6);s.t+=180;L(s,'Mettete a sacco '+l.nome+': '+oro+' monete e sei sacchi di grano.','guerra');VEN.reagisci(s,'razzia');VEN.ganci('luogo',s,l,'razzia');return{s}}
  if(!dentro)return{err:'Le porte sono chiuse'};
  if(z.a==='torneo'){if(!VEN.torneoOggi(s,l))return{err:'Oggi non c\'è torneo'};if(s.torneo)return{err:'Sei già iscritto'};if(s.torneoUsato&&s.torneoUsato[l.id]===giorno(s))return{err:'Hai già partecipato al torneo di oggi'};const posta=capi(s).reduce((a,x)=>a+D.TORNEO.posta*x.liv,0);if(tu.oro<posta)return{err:'Non hai abbastanza monete'};
   tu.oro-=posta;s.torneo={lid:l.id,turno:0,posta,giorno:giorno(s)};(s.torneoUsato=s.torneoUsato||{})[l.id]=giorno(s);L(s,'Ti iscrivi al torneo di '+l.nome+' per '+posta+' monete.');VEN.reagisci(s,'torneo');return{s,oro:-posta}}
  if(z.a==='lizza'){const t=s.torneo;if(!t||t.lid!==l.id)return{err:'Non sei iscritto a un torneo qui'};if(t.giorno!==giorno(s))return{err:'Il torneo è finito'};if(s.incontro)return{err:'Il duello ti aspetta'};s.incontro={tipo:'arena'};s.ev.push({t:'incontro'});return{s}}
  if(z.a==='ritira'){const t=s.torneo;if(!t||t.lid!==l.id)return{err:'Non sei iscritto a un torneo qui'};if(s.incontro&&s.incontro.tipo==='arena')s.incontro=null;const oro=VEN.chiudiTorneo(s,'Ti ritiri dal torneo di '+l.nome);return{s,oro}}
  if(z.a==='recluta'){if(l.tipo!=='villaggio')return{err:'Qui non si recluta'};const n=Math.max(1,z.n||1);if(l.rec<n)return{err:'Non ci sono abbastanza volontari'};if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};
   const f=VEN.regni(s).includes(l.faz)?VEN.cult(s,l.faz):M0(s,l),t=f+'_'+(l.rel>=20&&r()<.4?'f2':'f1'),oro=D.INGAGGIO[1]*n;if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;l.rec-=n;aggiungi(tu.tr,t,n);return{s}}
  if(z.a==='compra'||z.a==='vendi'){if(!MERCATO[l.tipo])return{err:'Qui non c\'è mercato'};const m=z.m,n=Math.max(1,z.n||1);if(!D.MERCI[m])return{err:'Merce sconosciuta'};
   if(z.a==='compra'){if((l.scorte[m]||0)<n)return{err:'Non ne hanno abbastanza'};let tot=0;for(let k=0;k<n;k++){tot+=prezzo(s,l,m,1);l.scorte[m]--}if(tu.oro<tot){l.scorte[m]+=n;return{err:'Servono '+tot+' monete'}}tu.oro-=tot;tu.merci[m]=(tu.merci[m]||0)+n;return{s,oro:-tot}}
   if((tu.merci[m]||0)<n)return{err:'Non ne hai abbastanza'};let tot=0;for(let k=0;k<n;k++){tot+=prezzo(s,l,m,-1);l.scorte[m]=(l.scorte[m]||0)+1}tu.oro+=tot;tu.merci[m]-=n;if(!tu.merci[m])delete tu.merci[m];return{s,oro:tot}}
  if(z.a==='assolda'){if(!OSTERIA[l.tipo])return{err:'Qui non c\'è taverna'};const e=l.merc.find(e=>e.t===z.t),n=Math.max(1,z.n||1);if(!e||e.n<n)return{err:'Non ce ne sono abbastanza'};if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};
   const oro=D.INGAGGIO[D.TR[z.t].t]*n;if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;togliUomini(l.merc,z.t,n);aggiungi(tu.tr,z.t,n);return{s}}
  if(z.a==='compagno'){const co=D.COMPAGNI.find(x=>x.id===z.id);if(!co||s.compagni[co.id]!==l.id)return{err:'Non è qui'};if(tu.oro<co.costo)return{err:'Servono '+co.costo+' monete'};if(uomini(tu)+1>limite(s))return{err:'La compagnia è al completo'};
   tu.oro-=co.costo;s.compagni[co.id]=-1;aggiungi(tu.tr,co.id,1);if(s.grad)delete s.grad[co.id];VEN.gradDi(s,co.id);L(s,co.nome+' si unisce alla compagnia.','bene');return{s}}
  if(z.a==='compraogg'){const o=ogg(z.id),unica=l.unica===z.id;if(!o||(!l.bott.includes(z.id)&&!unica))return{err:'Qui non lo vendono'};const pz=prezzoOgg(s,o,1);if(tu.oro<pz)return{err:'Servono '+pz+' monete'};
   tu.oro-=pz;tu.zaino.push(z.id);if(unica)l.unica=null;else l.bott.splice(l.bott.indexOf(z.id),1);return{s,oro:-pz}}
  if(z.a==='vendiogg'){if(MURA[l.tipo]&&l.tipo!=='citta'||l.tipo==='villaggio'||SITO[l.tipo])return{err:'Qui nessuno compra roba simile'};const i=z.i|0,o=ogg(tu.zaino[i]);if(!o)return{err:'Oggetto sconosciuto'};const pz=prezzoOgg(s,o,-1);tu.oro+=pz;tu.zaino.splice(i,1);return{s,oro:pz}}
  if(z.a==='imbarca'){if(l.tipo!=='porto')return{err:'Qui non ci sono navi'};const a=s.l[z.lid];if(!a||a.tipo!=='porto'||a.id===l.id)return{err:'Rotta sconosciuta'};if(a.faz!=='tu'&&nemiche(s,'tu',a.faz))return{err:'Quel porto vi è nemico'};
   const oro=40+uomini(tu)*3;if(tu.oro<oro)return{err:'Servono '+oro+' monete per il passaggio'};tu.oro-=oro;tu.x=a.x;tu.y=a.y;tu.via=[];s.dentro=a.id;tu.ord={t:'aspetta',fino:s.t+Math.round(dist(l,a)*5)+120};L(s,'Vi imbarcate per '+a.nome+'.');return{s}}
  if(z.a==='cura'){if(l.tipo!=='monastero')return{err:'Qui non ci sono cerusici'};const fer=tu.tr.reduce((a,e)=>a+(e.f||0),0);if(!fer)return{err:'Nessun ferito'};const oro=fer*4;if(tu.oro<oro)return{err:'Servono '+oro+' monete di offerta'};tu.oro-=oro;for(const e of tu.tr)e.f=0;tu.mor=Math.min(100,tu.mor+4);VEN.reagisci(s,'cura');return{s}}
  if(z.a==='benedizione'){if(l.tipo!=='monastero')return{err:'Qui nessuno benedice'};if(l.bened>giorno(s))return{err:'La compagnia è già stata benedetta di recente'};if(tu.oro<80)return{err:'Servono 80 monete di offerta'};tu.oro-=80;l.bened=giorno(s)+7;s.slancio=Math.min(30,s.slancio+12);tu.mor=Math.min(100,tu.mor+8);return{s}}
  if(z.a==='voci'){if(l.tipo!=='locanda')return{err:'Qui nessuno chiacchiera'};if(tu.oro<25)return{err:'Servono 25 monete per un giro di vino'};const x=s.l.filter(q=>q.noto===false&&q.g.length).sort((a,b)=>dist(a,tu)-dist(b,tu))[0];
   // il torneo si sa sempre; un posto nascosto solo finché ce n'è qualcuno da raccontare
   tu.oro-=25;const tn=VEN.tornei(s)[0],dt='«A '+s.l[tn.lid].nome+' c\'è torneo '+VEN.quando(tn.giorni)+'.»';if(x)x.noto=true;
   L(s,l.oste+(x?' abbassa la voce: «'+x.nome+'. Io non ci andrei, ma tu hai l\'aria di chi ci va.» E aggiunge: '+dt:' non ha storie nuove, ma una la sa: '+dt),'bene');return x?{s,lid:x.id}:{s}}
  if(z.a==='riposa'){if((l.tipo==='villaggio'||SITO[l.tipo])&&!mio)return{err:'Qui non c\'è locanda'};const oro=mio?0:Math.ceil(uomini(tu)*(l.tipo==='locanda'||l.tipo==='monastero'?1:1.5));if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;for(const e of tu.tr)e.f=Math.max(0,(e.f||0)-Math.ceil(e.n*.5));tu.mor=Math.min(100,tu.mor+6);tu.ord={t:'aspetta',fino:s.t+8*60};return{s}}
  if(z.a==='riscatta'){if(!MURA[l.tipo])return{err:'Qui nessuno compra prigionieri'};let oro=0;for(const e of s.prig){if(e.sig!=null){const sg=s.sig[e.sig];oro+=350+(sg.re?450:0);sg.prig=null;const p=part(s,sg.pid);if(p)p.ia.t=s.t+P.GIORNO}else oro+=e.n*(12+D.TR[e.t].t*14)}
   if(!oro)return{err:'Non hai prigionieri'};s.prig=[];tu.oro+=oro;L(s,'Riscatti incassati: '+oro+' monete.','bene');VEN.reagisci(s,'riscatta');return{s,oro}}
  if(z.a==='incarico'){const q=l.inc;if(!q||q.preso)return{err:'Nessun incarico'};if(s.incarichi.filter(x=>!x.fatto&&!x.fallito).length>=4)return{err:'Hai già troppi incarichi'};
   const inc=Object.assign({id:s.uid++,da:l.id,scad:giorno(s)+q.giorni},q);if(q.tipo==='predoni'){const b=VEN.nascePredoni(s,r,[l.x,l.y]);b.cov=[l.x,l.y];inc.pid=b.id}if(q.tipo==='reliquia'||q.tipo==='taglia')s.l[q.a].noto=true;q.preso=true;s.incarichi.push(inc);return{s}}
  if(z.a==='consegna'){const q=s.incarichi.find(q=>!q.fatto&&!q.fallito&&(q.tipo==='consegna'&&q.a===l.id||q.tipo==='reclute'&&q.da===l.id));if(!q)return{err:'Niente da consegnare qui'};const da=s.l[q.da];
   if(q.tipo==='consegna'){if((tu.merci[q.bene]||0)<q.n)return{err:'Ti servono '+q.n+' di '+D.MERCI[q.bene].nome};tu.merci[q.bene]-=q.n;if(!tu.merci[q.bene])delete tu.merci[q.bene];l.scorte[q.bene]=(l.scorte[q.bene]||0)+q.n}
   else{let k=q.n;const buoni=tu.tr.filter(e=>D.TR[e.t].t>=2&&!D.TR[e.t].compagno&&!D.TR[e.t].faz.startsWith('mer'));if(buoni.reduce((a,e)=>a+e.n,0)<k)return{err:'Servono '+q.n+' soldati addestrati (non reclute)'};
    for(const e of buoni.sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t)){const x=Math.min(k,e.n);aggiungi(l.g,e.t,x);togliUomini(tu.tr,e.t,x);k-=x;if(!k)break}}
   q.fatto=true;tu.oro+=q.premio;da.inc=null;da.rel+=6;relaz(s,da.faz,4);s.fama+=4;if(l.sig>=0)VEN.memSig(s.sig[l.sig]).fav++;L(s,'Incarico compiuto: '+q.premio+' monete.','bene');return{s,oro:q.premio}}
  if(z.a==='contratto'){if(s.corona)return{err:'Un sovrano non serve nessuno'};if(!MURA[l.tipo]||!VEN.regni(s).includes(l.faz))return{err:'Qui non c\'è chi firma'};if(s.servizio)return{err:'Servi già un regno'};if(s.fama<P.FAMA_CONTRATTO&&!(s.lettere&&s.lettere[l.faz]>=giorno(s)))return{err:'Serve fama '+P.FAMA_CONTRATTO};if(s.rel[l.faz]<0)return{err:'Non si fidano di te'};
   s.servizio={faz:l.faz,tipo:'mer',fino:giorno(s)+28};L(s,'Firmi un contratto di ventura con '+VEN.rg(s,l.faz).nome+': quattro settimane di soldo.','bene');return{s}}
  if(z.a==='giura'){if(s.corona)return{err:'Un sovrano non serve nessuno'};if(!MURA[l.tipo]||!VEN.regni(s).includes(l.faz))return{err:'Qui non c\'è chi riceve giuramenti'};if(s.servizio&&s.servizio.tipo==='vas')return{err:'Hai già un sovrano'};if(s.fama<P.FAMA_VASSALLO)return{err:'Serve fama '+P.FAMA_VASSALLO};if(s.rel[l.faz]<10)return{err:'Serve più amicizia col regno'};
   if(s.l.some(x=>x.faz==='tu'))return{err:'Chi ha terre proprie non giura'};s.servizio={faz:l.faz,tipo:'vas'};const v=s.l.filter(x=>x.faz===l.faz&&x.tipo==='villaggio'&&x.sig!==-2).sort((a,b)=>a.prosp-b.prosp)[0];if(v){v.sig=-2;L(s,'Giuri fedeltà a '+VEN.rg(s,l.faz).re+': ti è dato in feudo '+v.nome+'.','bene')}return{s}}
  if(z.a==='lascia'){if(!s.servizio)return{err:'Non servi nessuno'};const f=s.servizio.faz;if(s.servizio.tipo==='vas')for(const sg of s.sig)if(sg.faz===f)VEN.memSig(sg).trad++;relaz(s,f,s.servizio.tipo==='vas'?-30:-8);for(const x of s.l)if(x.sig===-2&&x.faz===f)x.sig=x.capo>=0?s.l[x.capo].sig:-1;s.servizio=null;L(s,'Sciogli il tuo legame con '+VEN.rg(s,f).breve+'.');return{s}}
  if(z.a==='proponi'){const a=l.faz;if(!VEN.regni(s).includes(a)||l.tipo!=='citta')return{err:'Solo il re, nella sua capitale'};if(!dentro)return{err:'Devi essere dentro le mura'};
   const b=s.corona&&!s.servizio?'tu':z.f,p=VEN.proposta(s,z.tipo,a,b);if(p.err)return p;const k=chiave(a,b),g=giorno(s),A=VEN.rg(s,a).breve,B=nomeF(s,b);
   if(!p.ok)return{err:VEN.rg(s,a).re+' rifiuta: il conto dà '+p.tot+' (serve 0)'};
   if(z.tipo==='pace'){VEN.faiPace(s,a,b);relaz(s,a,3);L(s,'Per le tue parole '+A+' e '+B+' firmano la pace.','bene')}
   else if(z.tipo==='alleanza'){s.alleanza=s.alleanza||{};s.alleanza[k]={da:g,rompe:0};VEN.scioglieScontri(s,a,b);relaz(s,a,2);L(s,A+' e '+B+' stringono un\'alleanza, per le tue parole.','bene')}
   else if(z.tipo==='guerra'){s.guerra[k]=true;relaz(s,b,-10);L(s,A+' dichiara guerra a '+B+', su tua richiesta.','guerra')}
   else{const al=s.alleanza[k];al.rompe=Math.max(g+D.DIPL.PREAVVISO,al.da+D.DIPL.MIN);L(s,A+' annuncia la rottura dell\'alleanza con '+B+': finirà il giorno '+al.rompe+'.','guerra')}
   (s.parola=s.parola||{})[a]=g+D.DIPL.ATTESA;return{s}}
  if(z.a==='pace'){const f=l.faz;if(!VEN.regni(s).includes(f)&&f!=='tu')return{err:'Qui non si tratta'};const con=z.f||f;if(!(con in s.rel)||(s.corona?!inGuerra(s,'tu',con):s.rel[con]>-25))return{err:'Non siete in guerra'};const oro=400+Math.max(0,Math.round(-s.rel[con]*6));if(tu.oro<oro)return{err:'Servono '+oro+' monete di tributo'};tu.oro-=oro;s.rel[con]=Math.max(s.rel[con],-5);if(s.corona)VEN.faiPace(s,'tu',con);L(s,'Paghi un tributo di '+oro+' monete: pace con '+VEN.rg(s,con).breve+'.');return{s}}
  if(z.a==='guarnigione'){if(!mio||!MURA[l.tipo])return{err:'Non è una tua fortezza'};const n=Math.max(1,z.n||1);if(z.verso>0){if(togliUomini(tu.tr,z.t,n)<1)return{err:'Nessuno da lasciare'};aggiungi(l.g,z.t,n)}else{if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};const k=togliUomini(l.g,z.t,n);if(!k)return{err:'Nessuno da riprendere'};aggiungi(tu.tr,z.t,k)}return{s}}
  return{err:'Azione sconosciuta'}}
 return{prezzoOgg,rinnova,razioni,giorniViveri,carico,caricoMax,paga,prezzo,prezzoMedio,segnali,renditaL,rendite,libera,titoloInc,fai}})());
// ---------- Passo 36: l'economia del mondo (solo `s.geo===2`) ----------
// Ogni giorno, per ogni luogo col mercato e per ogni merce: scorta += produzione − consumo × scorta/RIF (il resto frazionario sta in `l.prod.r`, così le scorte restano intere
// e il conto non usa il caso). Il nucleo (28ka) ritocca ancora le scorte alla sua maniera: nei mondi nuovi il ritocco si annulla (`giornoNuovo` qui sotto) e vale solo questo.
// `l.prod` (facoltativo): {t: merci del terreno, r: resti, fermo: fine della razzia, gu: giorno dell'ultimo evento di guerra, h: prezzi degli ultimi giorni}.
Object.assign(VEN,(()=>{
 const{D,L,M0,MERCATO,TU,dist,giorno,togliUomini,uomini,P}=VEN._,E=VDAT.ECO,CIBI=Object.keys(D.MERCI).filter(m=>D.MERCI[m].cibo);
 const culturaL=(s,l)=>VEN.regni(s).includes(l.faz)?VEN.cult(s,l.faz):M0(s,l);
 const sotto=(s,l)=>!!(l.ass||(s.assedio&&s.assedio.lid===l.id));
 // cosa dà la terra attorno a un villaggio (sette celle per lato): pesce sull'acqua, ferro sui monti, attrezzi (legname lavorato) nel bosco, altrimenti grano
 function terreno(s,l){const M=VEN.mappaDi(s),G=M.G||128,cx=Math.floor(l.x),cy=Math.floor(l.y);let ac=0,bo=0,mo=0;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=G||y>=G)continue;const t=M.T[y*G+x];if(t===0)ac++;else if(t===2)bo++;else if(t>=3)mo++}
  return ac>=3?'pesce':mo>=8?'ferro':bo>=8?'attrezzi':'grano'}
 // le merci che un luogo produce: la cultura, più il terreno (villaggi) o il porto (pesce); le città lavorano in attrezzi il ferro dei villaggi vicini
 function producono(s,l){const p=l.prod||(l.prod={});
  if(!p.t){p.t=[];if(l.tipo==='villaggio')p.t=[terreno(s,l)];else if(l.tipo==='citta'&&s.l.some(v=>v.tipo==='villaggio'&&v.prod&&v.prod.t&&v.prod.t[0]==='ferro'&&dist(v,l)<=12))p.t=['attrezzi']}
  return(D.PRODUCE[culturaL(s,l)]||[]).concat(p.t,l.tipo==='porto'?['pesce']:[])}
 const tasso=(l,m,prod)=>{const T=E.TASSI[l.tipo][D.MERCI[m].cibo?'c':'a'];return{P:prod?T[0]:T[1],C:T[2]}};
 const consF=s=>{const d=VDAT.DIFF.cons[(s.opz&&s.opz.cons)||VDAT.OPZ0.cons];return d?d.viveri:1};
 const arr=x=>Math.round(x*1000)/1000;
 // scorta di partenza di un mondo nuovo: l'equilibrio del luogo, ritoccato da una variazione fissa (nessun caso)
 function nuovo(s){if(s.geo!==2)return;const nm=Object.keys(D.MERCI);
  for(const l of s.l.filter(x=>x.tipo==='villaggio').concat(s.l.filter(x=>x.tipo!=='villaggio'))){if(!MERCATO[l.tipo])continue;const pr=producono(s,l);   // prima i villaggi: le città guardano il loro terreno
   nm.forEach((m,i)=>{const t=tasso(l,m,pr.includes(m)),eq=E.RIF*t.P/t.C,v=eq*(.9+.2*((l.id*7+i*3)%10)/10);l.scorte[m]=Math.max(0,Math.min(E.TETTO,Math.round(v)))})}}
 // rialzo del cibo per razzie e assedi vicini: subito RIALZO, poi cala in linea retta fino a zero in DURATA giorni
 // (l'elenco dei luoghi con un evento di guerra si tiene per il giorno: i prezzi si chiedono migliaia di volte)
 let ev={s:null,g:-1,l:[]};
 const eventi=s=>{const g=giorno(s);if(ev.s!==s||ev.g!==g){ev={s,g,l:s.l.filter(x=>x.prod&&x.prod.gu!=null&&g-x.prod.gu<E.DURATA)}}return ev.l};
 function rialzo(s,l,m){if(!D.MERCI[m].cibo)return 0;const g=giorno(s);let r=0;
  for(const x of eventi(s)){const e=g-x.prod.gu;if(e<0||dist(x,l)>E.RAGGIO_GUERRA)continue;r=Math.max(r,E.RIALZO*(1-e/E.DURATA))}
  return r}
 // la curva del prezzo: base × questo (tra MIN e MAX)
 function curvaEco(s,l,m){const sc=l.scorte[m]||0,q=sc<=0?30:Math.max(3,Math.min(30,Math.round(10*E.RIF/sc)));return Math.max(E.MIN,Math.min(E.MAX,E.CURVA[q-3]*(1+rialzo(s,l,m))))}
 // le strade della mappa (`M.S`, una per cella): a quale tratto di strada appartiene ogni cella (8 direzioni), calcolato una volta per mappa
 let rete={S:null,lab:null,G:0};
 function reteStrade(s){const M=VEN.mappaDi(s);if(rete.S===M.S)return rete;const G=M.G||128,lab=new Int32Array(G*G),pila=[];let n=0;
  for(let i=0;i<G*G;i++){if(!M.S[i]||lab[i])continue;lab[i]=++n;pila.push(i);
   while(pila.length){const c=pila.pop(),cx=c%G,cy=(c-cx)/G;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const x=cx+ox,y=cy+oy;if(x<0||y<0||x>=G||y>=G)continue;const j=y*G+x;if(M.S[j]&&!lab[j]){lab[j]=n;pila.push(j)}}}}
  rete={S:M.S,lab,G};return rete}
 const collegati=(R,a,b)=>{const G=R.G,ia=Math.floor(a.y)*G+Math.floor(a.x),ib=Math.floor(b.y)*G+Math.floor(b.x);return R.lab[ia]>0&&R.lab[ia]===R.lab[ib]};
 // ---------- il giorno ----------
 let snap=null;
 function giornoEco(s){const g=giorno(s),cf=consF(s),st=VEN.stagione&&VEN.stagione(s),ps=st?E.STAG[st.k]:1,mk=[];
  if(snap){s.l.forEach((l,i)=>{if(snap[i])l.scorte=snap[i]});snap=null}   // via il ritocco del nucleo
  for(const l of s.l){if(!MERCATO[l.tipo])continue;mk.push(l);const p=l.prod||(l.prod={}),r=p.r||(p.r={}),pr=producono(s,l),k=Math.max(.3,l.prosp/60),ass=sotto(s,l),fermo=p.fermo>g,vill=l.tipo==='villaggio';
   if(ass){p.gu=g;ev.s=null}
   for(const m of Object.keys(D.MERCI)){const prod=pr.includes(m),t=tasso(l,m,prod),S=l.scorte[m]||0,pro=ass||(vill&&prod&&fermo)?0:t.P*k*(vill&&prod?ps:1),tot=S+pro-(ass?0:t.C*k*cf*S/E.RIF)+(r[m]||0),n=Math.max(0,Math.min(E.TETTO,Math.floor(tot)));
    l.scorte[m]=n;r[m]=n===0||n===E.TETTO?0:arr(tot-n)}
   // assedio: la città non produce né consuma come al solito (il commercio si ferma): mangia soltanto la guarnigione, e senza cibo muore di fame
   if(ass&&l.g.length){let serve=Math.ceil(uomini({tr:l.g})/6),j=0;while(serve>0&&CIBI.some(m=>l.scorte[m]>0)){const m=CIBI[j++%CIBI.length];if(l.scorte[m]>0){l.scorte[m]--;serve--}}
    if(serve>0){const e=l.g.slice().sort((a,b)=>b.n-a.n)[0],x=togliUomini(l.g,e.t,Math.max(1,Math.floor(uomini({tr:l.g})*E.FAME)));if(x&&s.assedio&&s.assedio.lid===l.id)L(s,'La fame stringe '+l.nome+': '+x+' difensori muoiono tra gli stenti.','guerra')}}}
  // mercato regionale: una volta alla settimana si pareggia il 5% della differenza tra luoghi vicini e collegati da una strada (non quelli assediati)
  if(g%7===E.SETT){const lib=mk.filter(l=>!sotto(s,l)),rete=reteStrade(s);
   for(let i=0;i<lib.length;i++)for(let j=i+1;j<lib.length;j++){const a=lib[i],b=lib[j];if(dist(a,b)>E.RAGGIO||!collegati(rete,a,b))continue;
    for(const m of Object.keys(D.MERCI)){const d=Math.trunc(E.QUOTA*((a.scorte[m]||0)-(b.scorte[m]||0)));if(d){a.scorte[m]-=d;b.scorte[m]=(b.scorte[m]||0)+d}}}}
  // la memoria dei prezzi, per la freccia della tendenza
  for(const l of mk){const h=l.prod.h||(l.prod.h={});for(const m of Object.keys(D.MERCI)){const a=h[m]||(h[m]=[]);a.push(VEN.prezzo(s,l,m,1));if(a.length>E.STORIA)a.shift()}}}
 VEN.aggancia('nuovo',nuovo);
 // foraggio in più dei cavalieri: la mancanza la punisce il gancio di 28kh
 function foraggioExtra(s){let da=foraggioBase(s)*(E.CAV_VIVERI-1);const tu=TU(s),cibi=Object.keys(tu.merci).filter(m=>D.MERCI[m].cibo);let k=0;
  while(da>0&&cibi.some(m=>tu.merci[m]>0)){const m=cibi[k++%cibi.length];if(tu.merci[m]>0){tu.merci[m]--;da--}}}
 VEN.aggancia('giorno',s=>{if(s.geo===2){giornoEco(s);foraggioExtra(s)}snap=null});
 // razzia: il villaggio smette di produrre e il cibo sale in tutta la regione
 VEN.aggancia('luogo',(s,l,k)=>{if(s.geo!==2||k!=='razzia'||!l)return;const p=l.prod||(l.prod={}),g=giorno(s);p.fermo=g+E.FERMO;p.gu=g;ev.s=null});
 // il nucleo ritocca le scorte nel suo giornoNuovo: nei mondi nuovi si tiene l'istantanea di prima e `giornoEco` la rimette
 const gn0=VEN.giornoNuovo;
 const giornoNuovo=s=>{snap=s.geo===2?s.l.map(l=>MERCATO[l.tipo]?Object.assign({},l.scorte):null):null;try{gn0(s)}finally{snap=null}};
 // freccia del mercato: -1 se il prezzo di oggi è sceso di oltre il 5% rispetto a sette giorni fa, 1 se è salito, 0 altrimenti (e nei mondi vecchi)
 function tendenza(s,lid,m){const l=s.l[lid],h=l&&l.prod&&l.prod.h&&l.prod.h[m];if(!h||h.length<2)return 0;const a=h[0],b=VEN.prezzo(s,l,m,1);return b>a*1.05?1:b<a*.95?-1:0}
 // il foraggio di un giorno come lo toglie 28kh (se cambia là, cambia anche qui; test_ven_p36 li confronta); nei mondi nuovi ne vale CAV_VIVERI volte tanto
 function foraggioBase(s){const t=TU(s);if(s.anno==null||!VEN.stagione||s.prigioniero)return 0;
  const st=VEN.stagione(s),sc=((VDAT.DIFF.stag||{})[(s.opz&&s.opz.stag)||VDAT.OPZ0.stag]||{scarto:1}).scarto,cav=t.tr.reduce((a,e)=>a+(D.TR[e.t].c==='c'?e.n:0),0);
  return Math.round(cav*VDAT.STAG.FORAGGIO_QUOTA/6*Math.max(.05,1+(VDAT.STAG.EFF[st.k].foraggio-1)*sc)*consF(s))}
 // costo al giorno: paghe in monete, viveri e foraggio in razioni
 function costoGiorno(s){const t=TU(s),U=uomini(t),mv=VEN.molt(s,'viveri',{p:t}),paghe=Math.round(VEN.paga(s)/P.PAGA_GIORNI),viveri=Math.ceil(U/6*mv),foraggio=foraggioBase(s)*(s.geo===2?E.CAV_VIVERI:1);
  return{paghe,viveri,foraggio}}
 // la paga dei sette giorni e i giorni di viveri se arrivassero `n` reclute di quel villaggio (pura: lavora su una copia della compagnia)
 function conReclute(s,lid,n){const l=s.l[lid],f=VEN.regni(s).includes(l.faz)?VEN.cult(s,l.faz):M0(s,l),c=Object.assign({},s),t=Object.assign({},TU(s),{tr:TU(s).tr.map(e=>Object.assign({},e))});
  c.p=s.p.slice();c.p[0]=t;VEN._.aggiungi(t.tr,f+'_f1',n);return{paga:VEN.paga(c),giorni:VEN.giorniViveri(c)}}
 // il rincaro dei grandi eserciti si somma alla paga del nucleo, con lo stesso `molt('paga')`
 const paga0=VEN.paga;
 function paga(s){const x=paga0(s);if(s.geo!==2)return x;const tu=TU(s),tr=tu.tr.reduce((a,e)=>a+e.n*D.TR[e.t].paga*2,0),m=VEN.molt(s,'paga',{});
  return x+Math.round(tr*E.PAGA_OLTRE*Math.max(0,uomini(tu)-E.PAGA_SOGLIA)*m)}
 // la razione-uomo dei cavalieri (senza il foraggio) cresce in `molt('viveri')`; 28kh, che viene dopo, toglie la sua parte
 const molt0=VEN.molt;
 VEN.molt=(s,k,c)=>{const m=molt0(s,k,c);if(k!=='viveri'||s.geo!==2||s.anno==null||!c||!c.p||!c.p.tr)return m;
  let n=0,cav=0;for(const e of c.p.tr){n+=e.n;if(D.TR[e.t]&&D.TR[e.t].c==='c')cav+=e.n}
  return n?m*(n+cav*(E.CAV_VIVERI*(1-VDAT.STAG.FORAGGIO_QUOTA)-1))/(n-cav*VDAT.STAG.FORAGGIO_QUOTA):m}
 // quota di bottino che le truppe di grado alto chiedono (0–BOTTINO_MAX); i compagni ne chiedono meno
 function quotaBottino(s){let q=0;for(const e of TU(s).tr){const T=D.TR[e.t];q+=e.n*(E.BOTTINO[T.t]||0)*(T.compagno?E.BOTTINO_COMP:1)}return Math.min(E.BOTTINO_MAX,q)}
 VEN.aggancia('premio',(s,riep,out)=>{if(s.geo!==2||!out||!(out.oro>0))return;const x=Math.floor(out.oro*quotaBottino(s));if(x>0){out.oro-=x;L(s,'Le truppe scelte chiedono la loro parte del bottino: '+x+' monete.')}});
 // giorni di viveri: nei mondi nuovi contano anche la razione dei cavalieri e il foraggio
 const gv0=VEN.giorniViveri;
 const giorniViveri=s=>{if(s.geo!==2)return gv0(s);const c=costoGiorno(s),d=c.viveri+c.foraggio;return d>0?Math.floor(VEN.razioni(TU(s))/d):gv0(s)};
 return{giornoNuovo,curvaEco,tendenza,costoGiorno,quotaBottino,paga,conReclute,giorniViveri}})());
