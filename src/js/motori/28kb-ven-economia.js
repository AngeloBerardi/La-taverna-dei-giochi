/* ---- Compagnia di ventura, Economia e azioni nei luoghi: prezzi e mercato, paga e viveri, rendite, botteghe (`rinnova`), incarichi e `fai`. Motore puro, senza DOM né rete. ----
   Estensione di VEN (28k): aggiunge le sue funzioni allo stesso oggetto; gli aiutanti del nucleo arrivano da `VEN._`,
   le funzioni degli altri file si chiamano `VEN.nome(...)`. Piano: docs/passi/01-spacca-mondo.md. */
Object.assign(VEN,(()=>{
 const{D,L,M0,MERCATO,MURA,OSTERIA,P,SITO,TU,abil,aggiungi,capDi,capi,chiave,chiudiTorneo,dist,faiRegno,fondaRegno,forza,forzaTr,giorno,gradDi,inGuerra,limite,mappa,memSig,nemiche,nomeF,ogg,part,proposta,quando,reagisci,relaz,rnd,togliUomini,tornei,torneoOggi,uomini,vicinoOk}=VEN._;
 function prezzoOgg(s,o,verso){const c=abil(s,'commercio'),b=Math.max(20,o.prezzo);return Math.round(verso>0?b*(1.1-c*.02):b*.4*(1+c*.03))}
 // offerte del luogo: mercenari in taverna e incarichi
 function rinnova(s,l,r){const pesca=(a,n)=>{const c=a.slice(),o=[];while(o.length<n&&c.length)o.push(c.splice(Math.floor(r()*c.length),1)[0]);return o},g=giorno(s);
  if(OSTERIA[l.tipo]){l.merc=[];const tipi=['mer_f3','mer_t3','mer_c4'];for(let k=0;k<(l.tipo==='citta'?2:1);k++)aggiungi(l.merc,tipi[Math.floor(r()*3)],1+Math.floor(r()*(l.tipo==='citta'?5:3)))}
  if(l.tipo==='citta')l.bott=pesca(D.BOTTEGA[D.REGNI.includes(l.faz)?l.faz:M0(s,l)],4).concat(pesca(D.COMUNI,3));
  else if(l.tipo==='porto')l.bott=pesca(['cannocchiale','borsa','corno','stocco','sciabola','piumato','dadi','brocchiere'],3);
  else if(l.tipo==='monastero')l.bott=pesca(['bisaccia','stendardo','trattato','cuoio','mazza'],2);
  else if(l.tipo==='locanda')l.bott=pesca(D.COMUNI,2);
  if(l.inc&&l.inc.preso)return;const sito=t=>s.l.filter(x=>x.tipo===t&&x.g.length).sort((a,b)=>dist(a,l)-dist(b,l))[0];
  if(l.tipo==='villaggio')l.inc={tipo:'predoni',premio:120+Math.floor(r()*80)+g*2,giorni:6};
  else if(l.tipo==='citta'||l.tipo==='porto'){const altre=s.l.filter(x=>(x.tipo==='citta'||x.tipo==='porto')&&x.id!==l.id&&x.faz!==l.faz),a=altre[Math.floor(r()*altre.length)],beni=D.PRODUCE[D.REGNI.includes(l.faz)?l.faz:M0(s,l)].filter(m=>!D.MERCI[m].cibo),m=beni[Math.floor(r()*beni.length)],n=4+Math.floor(r()*5);
   l.inc=a?{tipo:'consegna',bene:m,n,a:a.id,premio:Math.round(n*D.MERCI[m].base*.9+60+dist(a,l)*4),giorni:12}:null}
  else if(l.tipo==='castello')l.inc={tipo:'reclute',n:4+Math.floor(r()*4),premio:260+Math.floor(r()*120),giorni:12};
  else if(l.tipo==='monastero'){const x=sito('rovine');l.inc=x?{tipo:'reliquia',a:x.id,premio:280+Math.floor(r()*160),giorni:24}:null}
  else if(l.tipo==='locanda'){const x=sito('covo');l.inc=x?{tipo:'taglia',a:x.id,premio:420+Math.floor(r()*200),giorni:30}:null}
  else l.inc=null}
 const razioni=p=>Object.keys(p.merci||{}).reduce((a,m)=>a+(D.MERCI[m].cibo?p.merci[m]:0),0);
 const carico=p=>Object.keys(p.merci||{}).reduce((a,m)=>a+p.merci[m],0);
 const caricoMax=s=>30+uomini(TU(s))*2+capi(s).reduce((a,c)=>a+(c.eq.cavallo?12:0),0);
 const paga=s=>TU(s).tr.reduce((a,e)=>a+e.n*D.TR[e.t].paga*2,0)+s.l.reduce((a,l)=>a+(l.faz==='tu'?Math.ceil(forzaTr(l.g)*.12):0),0);
 // prezzo di una merce in un luogo: sale quando la scorta è bassa. verso = 1 compri, -1 vendi
 function prezzo(s,l,m,verso){const sc=l.scorte[m]||0,k=Math.max(.45,Math.min(2.1,1.9-1.2*sc/60)),c=abil(s,'commercio');
  return Math.max(1,Math.round(D.MERCI[m].base*k*(verso>0?1.12-c*.02:.88+c*.02)))}
 const renditaL=l=>l.tipo==='villaggio'?Math.round(l.prosp*2.5):l.tipo==='porto'?Math.round(l.prosp*3.5):l.tipo==='castello'?120:l.tipo==='citta'?Math.round(l.prosp*7):0;
 // rendite: solo i luoghi che tieni (quelli dati in feudo rendono al signore) e, da vassallo, i feudi del re; il malcontento del regno le riduce
 function rendite(s){let x=0;for(const l of s.l)if((l.faz==='tu'&&l.sig<0)||(s.servizio&&s.servizio.tipo==='vas'&&l.sig===-2))x+=renditaL(l);
  if(s.corona&&s.corona.malc)x=Math.round(x*(1-s.corona.malc/200));
  if(s.servizio&&s.servizio.tipo==='mer')x+=Math.round(forza(TU(s))*.8);return x}
 // ---------- prigionia ----------
 function libera(s){const tu=TU(s),M=mappa(s.seme);let m=null,md=1e9;for(const l of s.l){if(l.faz!=='tu'&&nemiche(s,'tu',l.faz))continue;const d=dist(l,tu);if(d<md){md=d;m=l}}
  if(m){const v=vicinoOk(M,m.x+1,m.y);tu.x=v[0];tu.y=v[1]}s.prigioniero=null;L(s,'Sei di nuovo libero'+(m?', nei pressi di '+m.nome:'')+'.','bene');s.ev.push({t:'libero'})}
 // ---------- incontri ----------
 const titoloInc=(s,q)=>q.tipo==='reliquia'?'Ripulire '+s.l[q.a].nome:q.tipo==='taglia'?'Taglia: '+s.l[q.a].nome:q.tipo==='predoni'?'Caccia ai predoni presso '+s.l[q.da].nome:q.tipo==='consegna'?q.n+' di '+D.MERCI[q.bene].nome+' a '+s.l[q.a].nome:q.n+' soldati per '+s.l[q.da].nome;
 function fai(s,z){if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};const tu=TU(s),r=rnd(s),lid=s.dentro>=0?s.dentro:s.davanti,l=lid>=0?s.l[lid]:null,c=capDi(s,z.seat);if(!c)return{err:'Capitano sconosciuto'};
  if(s.incontro&&s.incontro.tipo==='arena'&&!['ritira','equipa','togli','abilita'].includes(z.a))return{err:'Il duello ti aspetta'};
  // sempre possibili
  if(['feudo','investi','aduna','dichiara','rompi'].includes(z.a)){if(!s.corona)return{err:'Non hai un regno'};return faiRegno(s,z)}
  if(z.a==='abilita'){if(c.punti<1)return{err:'Nessun punto da spendere'};if(!(z.k in c.ab))return{err:'Abilità sconosciuta'};if(c.ab[z.k]>=10)return{err:'Già al massimo'};c.ab[z.k]++;c.punti--;return{s}}
  if(z.a==='promuovi'){const e=tu.tr.find(e=>e.t===z.t),T=e&&D.TR[e.t];if(!e||!T.su.includes(z.su))return{err:'Promozione non valida'};const n=Math.max(1,z.n||1),xp=D.XP_SU[T.t]*n,oro=D.PROMO[T.t]*n;
   if(e.n<n)return{err:'Non hai abbastanza uomini'};if((e.xp||0)<xp)return{err:'Non hanno ancora abbastanza esperienza'};if(tu.oro<oro)return{err:'Servono '+oro+' monete'};
   e.xp-=xp;tu.oro-=oro;const fer=Math.min(e.f||0,Math.max(0,n-(e.n-(e.f||0))));togliUomini(tu.tr,z.t,n);aggiungi(tu.tr,z.su,n);if(fer){const e2=tu.tr.find(x=>x.t===z.su);e2.f=(e2.f||0)+fer}return{s}}
  if(z.a==='congeda'){const n=togliUomini(tu.tr,z.t,Math.max(1,z.n||1));return n?{s}:{err:'Nessuno da congedare'}}
  if(z.a==='libera'){const i=s.prig.findIndex(e=>e.t===z.t&&!e.sig);if(i<0)return{err:'Nessun prigioniero'};s.prig.splice(i,1);reagisci(s,'libera');return{s}}
  if(z.a==='liberasig'){const i=s.prig.findIndex(e=>e.sig!=null&&e.sig===z.sig);if(i<0)return{err:'Non è tuo prigioniero'};const sg=s.sig[z.sig];s.prig.splice(i,1);sg.prig=null;const pg=part(s,sg.pid);if(pg)pg.ia.t=s.t+P.GIORNO;
   memSig(sg).lib++;relaz(s,sg.faz,6);L(s,'Liberi '+sg.nome+' senza riscatto: se ne ricorderà.','bene');return{s}}
  if(z.a==='esci'){s.dentro=-1;s.davanti=-1;return{s}}
  if(z.a==='equipa'){const i=z.i|0,id=tu.zaino[i],o=ogg(id),eq=c.eq;if(!o)return{err:'Oggetto sconosciuto'};
   if(o.slot==='cimelio'){const k=z.k===1?1:z.k===0?0:(eq.cimeli[0]&&!eq.cimeli[1]?1:0),old=eq.cimeli[k];eq.cimeli[k]=id;tu.zaino.splice(i,1);if(old)tu.zaino.push(old);return{s}}
   if(o.slot==='scudo'&&(ogg(eq.arma)||{}).due)return{err:'Con un\'arma a due mani non si porta lo scudo'};
   const old=eq[o.slot];eq[o.slot]=id;tu.zaino.splice(i,1);if(old)tu.zaino.push(old);if(o.slot==='arma'&&o.due&&eq.scudo){tu.zaino.push(eq.scudo);eq.scudo=null}return{s}}
  if(z.a==='togli'){const eq=c.eq;if(z.slot==='cimelio'){const k=z.k?1:0;if(!eq.cimeli[k])return{err:'Niente da togliere'};tu.zaino.push(eq.cimeli[k]);eq.cimeli[k]=null;return{s}}
   if(z.slot==='arma'||z.slot==='armatura')return{err:'Senza non si va in battaglia: scambiala con un\'altra'};if(!eq[z.slot])return{err:'Niente da togliere'};tu.zaino.push(eq[z.slot]);eq[z.slot]=null;return{s}}
  if(!l)return{err:'Devi essere in un luogo'};
  const dentro=s.dentro>=0,ost=l.faz!=='tu'&&nemiche(s,'tu',l.faz),mio=l.faz==='tu'||(l.sig===-2);
  if(z.a==='fonda')return fondaRegno(s,z,l,dentro,mio);
  if(z.a==='assalta'){if(!SITO[l.tipo])return{err:'Qui non c\'è nulla da assaltare'};if(!l.g.length)return{err:'Non c\'è più nessuno'};s.incontro={tipo:'assalto',lid:l.id};s.ev.push({t:'incontro'});return{s}}
  if(z.a==='assedia'){if(!ost||!MURA[l.tipo])return{err:'Non si può assediare'};s.assedio={lid:l.id,pronto:s.t+Math.max(4,P.ASSEDIO_ORE-abil(s,'comando'))*60,da:s.t,ariete:false};tu.ord={t:'aspetta',fino:s.assedio.pronto+60};L(s,'Cingete d\'assedio '+l.nome+': scale e arieti saranno pronti tra qualche ora.','guerra');return{s}}
  if(z.a==='razzia'){if(!ost||l.tipo!=='villaggio')return{err:'Non si può razziare'};if(l.sacc>giorno(s))return{err:'Non è rimasto nulla da prendere'};const oro=60+Math.round(l.prosp*2.2);tu.oro+=oro;tu.merci.grano=(tu.merci.grano||0)+6;
   l.sacc=giorno(s)+6;l.prosp=Math.max(5,l.prosp-20);l.rec=0;l.rel-=40;relaz(s,l.faz,-6);s.t+=180;L(s,'Mettete a sacco '+l.nome+': '+oro+' monete e sei sacchi di grano.','guerra');reagisci(s,'razzia');return{s}}
  if(!dentro)return{err:'Le porte sono chiuse'};
  if(z.a==='torneo'){if(!torneoOggi(s,l))return{err:'Oggi non c\'è torneo'};if(s.torneo)return{err:'Sei già iscritto'};if(s.torneoUsato&&s.torneoUsato[l.id]===giorno(s))return{err:'Hai già partecipato al torneo di oggi'};const posta=capi(s).reduce((a,x)=>a+D.TORNEO.posta*x.liv,0);if(tu.oro<posta)return{err:'Non hai abbastanza monete'};
   tu.oro-=posta;s.torneo={lid:l.id,turno:0,posta,giorno:giorno(s)};(s.torneoUsato=s.torneoUsato||{})[l.id]=giorno(s);L(s,'Ti iscrivi al torneo di '+l.nome+' per '+posta+' monete.');reagisci(s,'torneo');return{s,oro:-posta}}
  if(z.a==='lizza'){const t=s.torneo;if(!t||t.lid!==l.id)return{err:'Non sei iscritto a un torneo qui'};if(t.giorno!==giorno(s))return{err:'Il torneo è finito'};if(s.incontro)return{err:'Il duello ti aspetta'};s.incontro={tipo:'arena'};s.ev.push({t:'incontro'});return{s}}
  if(z.a==='ritira'){const t=s.torneo;if(!t||t.lid!==l.id)return{err:'Non sei iscritto a un torneo qui'};if(s.incontro&&s.incontro.tipo==='arena')s.incontro=null;const oro=chiudiTorneo(s,'Ti ritiri dal torneo di '+l.nome);return{s,oro}}
  if(z.a==='recluta'){if(l.tipo!=='villaggio')return{err:'Qui non si recluta'};const n=Math.max(1,z.n||1);if(l.rec<n)return{err:'Non ci sono abbastanza volontari'};if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};
   const f=D.REGNI.includes(l.faz)?l.faz:M0(s,l),t=f+'_'+(l.rel>=20&&r()<.4?'f2':'f1'),oro=D.INGAGGIO[1]*n;if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;l.rec-=n;aggiungi(tu.tr,t,n);return{s}}
  if(z.a==='compra'||z.a==='vendi'){if(!MERCATO[l.tipo])return{err:'Qui non c\'è mercato'};const m=z.m,n=Math.max(1,z.n||1);if(!D.MERCI[m])return{err:'Merce sconosciuta'};
   if(z.a==='compra'){if((l.scorte[m]||0)<n)return{err:'Non ne hanno abbastanza'};let tot=0;for(let k=0;k<n;k++){tot+=prezzo(s,l,m,1);l.scorte[m]--}if(tu.oro<tot){l.scorte[m]+=n;return{err:'Servono '+tot+' monete'}}tu.oro-=tot;tu.merci[m]=(tu.merci[m]||0)+n;return{s,oro:-tot}}
   if((tu.merci[m]||0)<n)return{err:'Non ne hai abbastanza'};let tot=0;for(let k=0;k<n;k++){tot+=prezzo(s,l,m,-1);l.scorte[m]=(l.scorte[m]||0)+1}tu.oro+=tot;tu.merci[m]-=n;if(!tu.merci[m])delete tu.merci[m];return{s,oro:tot}}
  if(z.a==='assolda'){if(!OSTERIA[l.tipo])return{err:'Qui non c\'è taverna'};const e=l.merc.find(e=>e.t===z.t),n=Math.max(1,z.n||1);if(!e||e.n<n)return{err:'Non ce ne sono abbastanza'};if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};
   const oro=D.INGAGGIO[D.TR[z.t].t]*n;if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;togliUomini(l.merc,z.t,n);aggiungi(tu.tr,z.t,n);return{s}}
  if(z.a==='compagno'){const co=D.COMPAGNI.find(x=>x.id===z.id);if(!co||s.compagni[co.id]!==l.id)return{err:'Non è qui'};if(tu.oro<co.costo)return{err:'Servono '+co.costo+' monete'};if(uomini(tu)+1>limite(s))return{err:'La compagnia è al completo'};
   tu.oro-=co.costo;s.compagni[co.id]=-1;aggiungi(tu.tr,co.id,1);if(s.grad)delete s.grad[co.id];gradDi(s,co.id);L(s,co.nome+' si unisce alla compagnia.','bene');return{s}}
  if(z.a==='compraogg'){const o=ogg(z.id),unica=l.unica===z.id;if(!o||(!l.bott.includes(z.id)&&!unica))return{err:'Qui non lo vendono'};const pz=prezzoOgg(s,o,1);if(tu.oro<pz)return{err:'Servono '+pz+' monete'};
   tu.oro-=pz;tu.zaino.push(z.id);if(unica)l.unica=null;else l.bott.splice(l.bott.indexOf(z.id),1);return{s,oro:-pz}}
  if(z.a==='vendiogg'){if(MURA[l.tipo]&&l.tipo!=='citta'||l.tipo==='villaggio'||SITO[l.tipo])return{err:'Qui nessuno compra roba simile'};const i=z.i|0,o=ogg(tu.zaino[i]);if(!o)return{err:'Oggetto sconosciuto'};const pz=prezzoOgg(s,o,-1);tu.oro+=pz;tu.zaino.splice(i,1);return{s,oro:pz}}
  if(z.a==='imbarca'){if(l.tipo!=='porto')return{err:'Qui non ci sono navi'};const a=s.l[z.lid];if(!a||a.tipo!=='porto'||a.id===l.id)return{err:'Rotta sconosciuta'};if(a.faz!=='tu'&&nemiche(s,'tu',a.faz))return{err:'Quel porto vi è nemico'};
   const oro=40+uomini(tu)*3;if(tu.oro<oro)return{err:'Servono '+oro+' monete per il passaggio'};tu.oro-=oro;tu.x=a.x;tu.y=a.y;tu.via=[];s.dentro=a.id;tu.ord={t:'aspetta',fino:s.t+Math.round(dist(l,a)*5)+120};L(s,'Vi imbarcate per '+a.nome+'.');return{s}}
  if(z.a==='cura'){if(l.tipo!=='monastero')return{err:'Qui non ci sono cerusici'};const fer=tu.tr.reduce((a,e)=>a+(e.f||0),0);if(!fer)return{err:'Nessun ferito'};const oro=fer*4;if(tu.oro<oro)return{err:'Servono '+oro+' monete di offerta'};tu.oro-=oro;for(const e of tu.tr)e.f=0;tu.mor=Math.min(100,tu.mor+4);reagisci(s,'cura');return{s}}
  if(z.a==='benedizione'){if(l.tipo!=='monastero')return{err:'Qui nessuno benedice'};if(l.bened>giorno(s))return{err:'La compagnia è già stata benedetta di recente'};if(tu.oro<80)return{err:'Servono 80 monete di offerta'};tu.oro-=80;l.bened=giorno(s)+7;s.slancio=Math.min(30,s.slancio+12);tu.mor=Math.min(100,tu.mor+8);return{s}}
  if(z.a==='voci'){if(l.tipo!=='locanda')return{err:'Qui nessuno chiacchiera'};if(tu.oro<25)return{err:'Servono 25 monete per un giro di vino'};const x=s.l.filter(q=>q.noto===false&&q.g.length).sort((a,b)=>dist(a,tu)-dist(b,tu))[0];
   // il torneo si sa sempre; un posto nascosto solo finché ce n'è qualcuno da raccontare
   tu.oro-=25;const tn=tornei(s)[0],dt='«A '+s.l[tn.lid].nome+' c\'è torneo '+quando(tn.giorni)+'.»';if(x)x.noto=true;
   L(s,l.oste+(x?' abbassa la voce: «'+x.nome+'. Io non ci andrei, ma tu hai l\'aria di chi ci va.» E aggiunge: '+dt:' non ha storie nuove, ma una la sa: '+dt),'bene');return x?{s,lid:x.id}:{s}}
  if(z.a==='riposa'){if((l.tipo==='villaggio'||SITO[l.tipo])&&!mio)return{err:'Qui non c\'è locanda'};const oro=mio?0:Math.ceil(uomini(tu)*(l.tipo==='locanda'||l.tipo==='monastero'?1:1.5));if(tu.oro<oro)return{err:'Servono '+oro+' monete'};tu.oro-=oro;for(const e of tu.tr)e.f=Math.max(0,(e.f||0)-Math.ceil(e.n*.5));tu.mor=Math.min(100,tu.mor+6);tu.ord={t:'aspetta',fino:s.t+8*60};return{s}}
  if(z.a==='riscatta'){if(!MURA[l.tipo])return{err:'Qui nessuno compra prigionieri'};let oro=0;for(const e of s.prig){if(e.sig!=null){const sg=s.sig[e.sig];oro+=350+(sg.re?450:0);sg.prig=null;const p=part(s,sg.pid);if(p)p.ia.t=s.t+P.GIORNO}else oro+=e.n*(12+D.TR[e.t].t*14)}
   if(!oro)return{err:'Non hai prigionieri'};s.prig=[];tu.oro+=oro;L(s,'Riscatti incassati: '+oro+' monete.','bene');reagisci(s,'riscatta');return{s,oro}}
  if(z.a==='incarico'){const q=l.inc;if(!q||q.preso)return{err:'Nessun incarico'};if(s.incarichi.filter(x=>!x.fatto&&!x.fallito).length>=4)return{err:'Hai già troppi incarichi'};
   const inc=Object.assign({id:s.uid++,da:l.id,scad:giorno(s)+q.giorni},q);if(q.tipo==='predoni'){const b=VEN.nascePredoni(s,r,[l.x,l.y]);b.cov=[l.x,l.y];inc.pid=b.id}if(q.tipo==='reliquia'||q.tipo==='taglia')s.l[q.a].noto=true;q.preso=true;s.incarichi.push(inc);return{s}}
  if(z.a==='consegna'){const q=s.incarichi.find(q=>!q.fatto&&!q.fallito&&(q.tipo==='consegna'&&q.a===l.id||q.tipo==='reclute'&&q.da===l.id));if(!q)return{err:'Niente da consegnare qui'};const da=s.l[q.da];
   if(q.tipo==='consegna'){if((tu.merci[q.bene]||0)<q.n)return{err:'Ti servono '+q.n+' di '+D.MERCI[q.bene].nome};tu.merci[q.bene]-=q.n;if(!tu.merci[q.bene])delete tu.merci[q.bene];l.scorte[q.bene]=(l.scorte[q.bene]||0)+q.n}
   else{let k=q.n;const buoni=tu.tr.filter(e=>D.TR[e.t].t>=2&&!D.TR[e.t].compagno&&!D.TR[e.t].faz.startsWith('mer'));if(buoni.reduce((a,e)=>a+e.n,0)<k)return{err:'Servono '+q.n+' soldati addestrati (non reclute)'};
    for(const e of buoni.sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t)){const x=Math.min(k,e.n);aggiungi(l.g,e.t,x);togliUomini(tu.tr,e.t,x);k-=x;if(!k)break}}
   q.fatto=true;tu.oro+=q.premio;da.inc=null;da.rel+=6;relaz(s,da.faz,4);s.fama+=4;if(l.sig>=0)memSig(s.sig[l.sig]).fav++;L(s,'Incarico compiuto: '+q.premio+' monete.','bene');return{s,oro:q.premio}}
  if(z.a==='contratto'){if(s.corona)return{err:'Un sovrano non serve nessuno'};if(!MURA[l.tipo]||!D.REGNI.includes(l.faz))return{err:'Qui non c\'è chi firma'};if(s.servizio)return{err:'Servi già un regno'};if(s.fama<P.FAMA_CONTRATTO&&!(s.lettere&&s.lettere[l.faz]>=giorno(s)))return{err:'Serve fama '+P.FAMA_CONTRATTO};if(s.rel[l.faz]<0)return{err:'Non si fidano di te'};
   s.servizio={faz:l.faz,tipo:'mer',fino:giorno(s)+28};L(s,'Firmi un contratto di ventura con '+D.FAZ[l.faz].nome+': quattro settimane di soldo.','bene');return{s}}
  if(z.a==='giura'){if(s.corona)return{err:'Un sovrano non serve nessuno'};if(!MURA[l.tipo]||!D.REGNI.includes(l.faz))return{err:'Qui non c\'è chi riceve giuramenti'};if(s.servizio&&s.servizio.tipo==='vas')return{err:'Hai già un sovrano'};if(s.fama<P.FAMA_VASSALLO)return{err:'Serve fama '+P.FAMA_VASSALLO};if(s.rel[l.faz]<10)return{err:'Serve più amicizia col regno'};
   if(s.l.some(x=>x.faz==='tu'))return{err:'Chi ha terre proprie non giura'};s.servizio={faz:l.faz,tipo:'vas'};const v=s.l.filter(x=>x.faz===l.faz&&x.tipo==='villaggio'&&x.sig!==-2).sort((a,b)=>a.prosp-b.prosp)[0];if(v){v.sig=-2;L(s,'Giuri fedeltà a '+D.FAZ[l.faz].re+': ti è dato in feudo '+v.nome+'.','bene')}return{s}}
  if(z.a==='lascia'){if(!s.servizio)return{err:'Non servi nessuno'};const f=s.servizio.faz;if(s.servizio.tipo==='vas')for(const sg of s.sig)if(sg.faz===f)memSig(sg).trad++;relaz(s,f,s.servizio.tipo==='vas'?-30:-8);for(const x of s.l)if(x.sig===-2&&x.faz===f)x.sig=x.capo>=0?s.l[x.capo].sig:-1;s.servizio=null;L(s,'Sciogli il tuo legame con '+D.FAZ[f].breve+'.');return{s}}
  if(z.a==='proponi'){const a=l.faz;if(!D.REGNI.includes(a)||l.tipo!=='citta')return{err:'Solo il re, nella sua capitale'};if(!dentro)return{err:'Devi essere dentro le mura'};
   const b=s.corona&&!s.servizio?'tu':z.f,p=proposta(s,z.tipo,a,b);if(p.err)return p;const k=chiave(a,b),g=giorno(s),A=D.FAZ[a].breve,B=nomeF(s,b);
   if(!p.ok)return{err:D.FAZ[a].re+' rifiuta: il conto dà '+p.tot+' (serve 0)'};
   if(z.tipo==='pace'){VEN.faiPace(s,a,b);relaz(s,a,3);L(s,'Per le tue parole '+A+' e '+B+' firmano la pace.','bene')}
   else if(z.tipo==='alleanza'){s.alleanza=s.alleanza||{};s.alleanza[k]={da:g,rompe:0};VEN.scioglieScontri(s,a,b);relaz(s,a,2);L(s,A+' e '+B+' stringono un\'alleanza, per le tue parole.','bene')}
   else if(z.tipo==='guerra'){s.guerra[k]=true;relaz(s,b,-10);L(s,A+' dichiara guerra a '+B+', su tua richiesta.','guerra')}
   else{const al=s.alleanza[k];al.rompe=Math.max(g+D.DIPL.PREAVVISO,al.da+D.DIPL.MIN);L(s,A+' annuncia la rottura dell\'alleanza con '+B+': finirà il giorno '+al.rompe+'.','guerra')}
   (s.parola=s.parola||{})[a]=g+D.DIPL.ATTESA;return{s}}
  if(z.a==='pace'){const f=l.faz;if(!D.REGNI.includes(f)&&f!=='tu')return{err:'Qui non si tratta'};const con=z.f||f;if(!(con in s.rel)||(s.corona?!inGuerra(s,'tu',con):s.rel[con]>-25))return{err:'Non siete in guerra'};const oro=400+Math.max(0,Math.round(-s.rel[con]*6));if(tu.oro<oro)return{err:'Servono '+oro+' monete di tributo'};tu.oro-=oro;s.rel[con]=Math.max(s.rel[con],-5);if(s.corona)VEN.faiPace(s,'tu',con);L(s,'Paghi un tributo di '+oro+' monete: pace con '+D.FAZ[con].breve+'.');return{s}}
  if(z.a==='guarnigione'){if(!mio||!MURA[l.tipo])return{err:'Non è una tua fortezza'};const n=Math.max(1,z.n||1);if(z.verso>0){if(togliUomini(tu.tr,z.t,n)<1)return{err:'Nessuno da lasciare'};aggiungi(l.g,z.t,n)}else{if(uomini(tu)+n>limite(s))return{err:'La compagnia è al completo'};const k=togliUomini(l.g,z.t,n);if(!k)return{err:'Nessuno da riprendere'};aggiungi(tu.tr,z.t,k)}return{s}}
  return{err:'Azione sconosciuta'}}
 return{prezzoOgg,rinnova,razioni,carico,caricoMax,paga,prezzo,renditaL,rendite,libera,titoloInc,fai}})());
