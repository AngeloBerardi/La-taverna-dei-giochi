/* ---- Compagnia di ventura, Gente: gradimento dei compagni, voci e dialoghi, confidenza dei signori, favori e debiti. Motore puro, senza DOM né rete. ----
   Estensione di VEN (28k): aggiunge le sue funzioni allo stesso oggetto; gli aiutanti del nucleo arrivano da `VEN._`,
   le funzioni degli altri file si chiamano `VEN.nome(...)`. Piano: docs/passi/01-spacca-mondo.md. */
Object.assign(VEN,(()=>{
 const{D,L,TU,abil,giorno,relaz,togliUomini,uomini,vicinoOk}=VEN._;
 // ---------- gradimento dei compagni e memoria dei signori (V6a) ----------
 // I numeri stanno in VDAT.GRAD e VDAT.SIG. Niente dadi: tutto è un conto. s.grad[id]={g,avv,visto}: g 0..100, avv = giorno dell'avviso di partenza, visto = eventi già successi.
 const inCompagnia=s=>D.COMPAGNI.filter(c=>TU(s).tr.some(e=>e.t===c.id&&e.n>0));
 const gradDi=(s,id)=>{if(!s.grad)s.grad={};return s.grad[id]||(s.grad[id]={g:D.GRAD.INIZIO,avv:0,visto:[]})};
 const memSig=sg=>sg.mem||(sg.mem={lib:0,sconf:0,trad:0,fav:0,g:-99});
 const limita=v=>Math.max(0,Math.min(100,v));
 // un salvataggio v2 precedente alla scheda: talenti a 0, memoria dei signori, gradimento dei compagni già in compagnia
 function gradApri(s){if(!s.grad)s.grad={};if(!s.lettere)s.lettere={};if(!s.debiti)s.debiti=[];
  for(const c of [s.cap].concat(s.soci||[]))for(const k of ['carisma','diplomazia','cavaliere'])if(c.ab[k]==null)c.ab[k]=0;
  for(const sg of s.sig)memSig(sg);for(const c of inCompagnia(s))gradDi(s,c.id)}
 function umore(g){return g>=D.GRAD.FIDO?'fedele':g>=55?'contento':g>=35?'tranquillo':g>=D.GRAD.PARLA?'scontento':'in bilico'}
 // un evento di cronaca: chi lo ama sale, chi lo detesta scende (con Carisma più su e meno giù). Il servizio presso un regno pesa SERVE/NONSERVE.
 function reagisci(s,ev){const G=D.GRAD,car=abil(s,'carisma'),servi=ev.slice(0,6)==='servi_';
  for(const c of inCompagnia(s)){const ama=c.ama.includes(ev),odia=c.odia.includes(ev);if(!ama&&!odia)continue;const gr=gradDi(s,c.id);if(!gr.visto.includes(ev))gr.visto.push(ev);
   const d=ama?(servi?G.SERVE:G.AMA)*(1+.1*car):(servi?G.NONSERVE:G.ODIA)*Math.max(0,1-.05*car),n=limita(gr.g+Math.round(d));
   if(n!==gr.g){gr.g=n;L(s,c.nome+(ama?' approva.':' non gradisce.'),ama?'bene':'male')}}}
 // il compagno se ne va per sempre, con qualche uomo dei ranghi più bassi; chi aveva intesa con lui ne soffre
 function parte(s,id){const G=D.GRAD,tu=TU(s),c=D.COMPAGNI.find(x=>x.id===id);if(!c)return{err:'Non è un compagno'};if(!tu.tr.some(e=>e.t===id&&e.n>0))return{err:'Non è in compagnia'};
  accoda(s,id.slice(3)+'-addio');togliUomini(tu.tr,id,1);s.compagni[id]=-3;if(s.grad)delete s.grad[id];
  let k=Math.min(G.SEGUONO,Math.floor(uomini(tu)*G.QUOTA)),via=0;
  while(k>0){const e=tu.tr.filter(x=>!D.TR[x.t].compagno&&x.n>0).sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t)[0];if(!e)break;togliUomini(tu.tr,e.t,1);k--;via++}
  for(const x of inCompagnia(s))if(x.lega&&x.lega.id===id&&x.lega.n>0){const gr=gradDi(s,x.id);gr.g=limita(gr.g+G.LUTTO)}
  L(s,c.nome+' lascia la compagnia'+(via?' e porta con sé '+via+' uomini.':'.'),'male');s.ev.push({t:'compagno',id,via:1});return{s}}
 // ogni giorno: chi sta male lo dice, poi se ne va
 function addii(s){const G=D.GRAD,g=giorno(s);
  for(const c of inCompagnia(s)){const gr=gradDi(s,c.id);if(gr.g<=G.VIA){parte(s,c.id);continue}
   if(gr.g<G.PARLA){if(!gr.avv){gr.avv=g;L(s,c.nome+' vuole parlarti: così non resta.','male');accoda(s,c.id.slice(3)+'-lamento')}else if(g-gr.avv>=G.GIORNI)parte(s,c.id)}else gr.avv=0}}
 // giorno di paga: pagati +PAGA, in ritardo è un evento; servizio presso un regno; legami con chi è in compagnia
 function gradPaga(s,pagato){const G=D.GRAD,ci=inCompagnia(s);if(!ci.length)return;
  if(pagato)for(const c of ci){const gr=gradDi(s,c.id);gr.g=limita(gr.g+G.PAGA)}else reagisci(s,'pagatardi');
  if(s.servizio&&VEN.regni(s).includes(s.servizio.faz))reagisci(s,'servi_'+s.servizio.faz);
  for(const c of ci)if(c.lega&&ci.some(x=>x.id===c.lega.id)){const gr=gradDi(s,c.id);gr.g=limita(gr.g+(c.lega.n>0?G.INTESA:G.ANTIPATIA))}}
 // ---------- dialoghi (V6b) ----------
 // Le scene stanno in VVOC (28ja) e girano nel motore di racconto ARAC (27q): qui sta ciò che le lega al mondo. Se i due file non sono caricati non succede nulla.
 // s.rac = stato del racconto · s.voci = scene in coda [{id,sig?}] · s.vsig = signore della scena aperta (-1 nessuno) · s.volpe = {tappa, coda, dono}.
 // Il gradimento resta di s.grad: la scena legge i fatti copiati in bandiere (fattiVoci) e scrive solo con gli effetti `ven` (EFF_VOCI) e `oro`.
 const RAC=()=>typeof ARAC!=='undefined'?ARAC:(typeof require!=='undefined'?require('./27q-avv-racconto.js'):null);
 const VOC=()=>typeof VVOC!=='undefined'?VVOC:(typeof require!=='undefined'?require('./28ja-ven-voci.js'):null);
 const EFF_VOCI=['grad','via','passo','premio','scontro','conf','tappa','uomini','merce','viveri','gusto','adunata'];
 function voceInit(s){const R=RAC();if(!s.rac&&R)s.rac=R.nuovo('ventura',s.seme);if(!s.voci)s.voci=[];if(!s.volpe)s.volpe={tappa:0};if(s.vsig==null)s.vsig=-1}
 // un salvataggio più vecchio non rivive le tappe già passate della rivale
 function vociApri(s){const nuova=!s.volpe;voceInit(s);if(nuova){s.volpe.tappa=D.VOLPE.GIORNI.filter(x=>x<giorno(s)).length;if(s.rivVinta)s.volpe.dono=1}}
 function accoda(s,id,sig){const V=VOC();if(!V||!s.voci||!V.scene[id]||s.voci.some(x=>x.id===id&&x.sig===sig)||(s.rac&&s.rac.scena&&s.rac.scena.id===id))return false;
  if(s.voci.length>=12)return false;s.voci.push(sig==null?{id}:{id,sig});return true}
 function fattiVoci(s){const b={},ci=inCompagnia(s);for(const c of D.COMPAGNI){const k=c.id.slice(3),gr=(s.grad||{})[c.id];b['grad-'+k]=gr?gr.g:0;b['inc-'+k]=gr?gr.inc|0:0;b['con-'+k]=ci.includes(c)?1:0}
  for(const f of VEN.regni(s))b['serve-'+f]=s.servizio&&s.servizio.faz===f?1:0;b.fama=s.fama|0;b.tappa=(s.volpe||{}).tappa|0;b.giorno=giorno(s);return b}
 const ctxVoci=s=>({oro:TU(s).oro,giorno:giorno(s),eroi:[]});
 const statoRac=s=>Object.assign({},s.rac,{bandiere:Object.assign({},s.rac.bandiere,fattiVoci(s))});
 // la scena aperta, come la mostra la vista (null se nessuno parla)
 function voce(s){const R=RAC(),V=VOC();if(!R||!V||!s.rac||!s.rac.scena)return null;const v=R.vista(statoRac(s),V,ctxVoci(s));if(!v)return null;
  const sg=s.vsig>=0?s.sig[s.vsig]:null,nome=sg?sg.nome:'il signore',sub=x=>String(x).replace(/\{signore\}/g,nome).replace(/\{capitano\}/g,s.cap.nome);
  v.testo=sub(v.testo);if(v.chi.id==='signore')v.chi=Object.assign({},v.chi,{nome:sg?sg.nome:'Il signore'});for(const c of v.scelte)c.t=sub(c.t);return v}
 // avvia la prima scena in coda che esiste (le altre si scartano); il tempo si ferma finché non è chiusa
 function avviaVoce(s){const R=RAC(),V=VOC();if(!R||!V||!s.rac)return false;
  while(s.voci.length){const q=s.voci.shift();if(!V.scene[q.id]){if(/^volpe-/.test(q.id))s.volpe.coda=0;continue}
   const r=R.act(statoRac(s),{t:'avvia',id:q.id},V,ctxVoci(s));if(r.err)continue;
   const x=chiudiAtto(s,r);if(x.err)continue;s.vsig=q.sig==null?-1:q.sig;s.ev.push({t:'voce'});avanzaInc(s,'scena');return true}
  return false}
 // risposta del giocatore: {t:'scegli',i} | {t:'continua'}
 function parla(s,a){const R=RAC(),V=VOC();if(!R||!V||!s.rac||!s.rac.scena)return{err:'Nessuno ti sta parlando'};
  if(!a||(a.t!=='scegli'&&a.t!=='continua'))return{err:'Risposta non valida'};
  const r=R.act(statoRac(s),a,V,ctxVoci(s));if(r.err)return{err:r.err};const x=chiudiAtto(s,r);return x.err?x:{s}}
 // applica un atto del racconto: prima si controllano tutti gli effetti (o non cambia nulla), poi lo stato e gli effetti sul mondo
 function chiudiAtto(s,r){for(const e of r.fuori||[])if(!(e.t==='oro'||(e.t==='ven'&&EFF_VOCI.includes(e.k))))return{err:'Effetto sconosciuto'};
  s.rac=r.s;for(const k of Object.keys(fattiVoci(s)))delete s.rac.bandiere[k];for(const e of r.fuori||[])applicaVoce(s,e);
  if(!s.rac.scena){s.vsig=-1;if(s.volpe.coda){s.volpe.tappa=Math.max(s.volpe.tappa,s.volpe.coda);s.volpe.coda=0}}return{s}}
 function applicaVoce(s,e){const tu=TU(s);
  if(e.t==='oro'){tu.oro=Math.max(0,tu.oro+(e.n|0));return}
  const c=D.COMPAGNI.find(x=>x.id===e.id);
  switch(e.k){
   case'grad':if(c&&inCompagnia(s).includes(c)){const gr=gradDi(s,c.id);gr.g=limita(gr.g+(e.n|0))}return;
   case'via':if(c)parte(s,c.id);return;
   case'passo':if(c&&c.inc&&inCompagnia(s).includes(c)){const gr=gradDi(s,c.id);if((gr.inc|0)<c.inc.length&&!gr.incA)gr.incA=(gr.inc|0)+1}return;
   case'premio':if(e.id==='rv_volpe'){if(!s.volpe.dono){s.volpe.dono=2;if(D.OGG[D.RIVALE.premio])tu.zaino.push(D.RIVALE.premio);L(s,'La Volpe Rossa ti lascia la sua cavalla.','bene')}}else if(c)premioComp(s,c);return;
   case'scontro':{const rv=s.p.find(p=>p.k==='riv');if(rv&&!s.incontro){rv.dentro=-1;rv.sc=0;tu.ord=null;tu.via=[];s.incontro={tipo:'nemico',pid:[rv.id],all:[],da:'tu'};s.ev.push({t:'incontro'})}return}
   case'conf':{const sg=s.vsig>=0?s.sig[s.vsig]:null;if(sg){memSig(sg).fav+=e.n|0;confSig(s,sg)}return}
   case'tappa':s.volpe.tappa++;s.volpe.coda=0;return
   default:VEN.ganci('effetto',s,e)}}
 function premioComp(s,c){if(!c.premio||!inCompagnia(s).includes(c))return;const gr=gradDi(s,c.id);if(gr.prem)return;gr.prem=1;
  if(c.premio.ogg&&D.OGG[c.premio.ogg])TU(s).zaino.push(c.premio.ogg);if(c.premio.abil)gr.piu=1;L(s,c.nome+(c.premio.ogg&&D.OGG[c.premio.ogg]?' ti dona '+D.OGG[c.premio.ogg].nome+'.':' ti ripaga: il suo aiuto conta di più.'),'bene')}
 // un signore che ti conosce di più ha qualcosa da dirti (una volta per livello)
 function confSig(s,sg){const l=confidenza(s,sg),m=memSig(sg);if(l>(m.vl|0)&&accoda(s,'sig-'+sg.tratto+'-'+l,sg.id))m.vl=l}
 // un passo dell'incarico personale è compiuto? ev: arriva (luogo) · vinci (compagnia nemica) · sito (luogo ripulito) · scena (inizio di una scena)
 function avanzaInc(s,ev,x){if(!s.grad)return;
  for(const c of inCompagnia(s)){const gr=s.grad[c.id];if(!c.inc||!gr||!gr.incA)continue;const p=c.inc[gr.incA-1],tu=TU(s);let ok=false;
   if(p.tipo==='luogo')ok=ev==='arriva'&&(!p.tipoL||x.tipo===p.tipoL)&&(!p.faz||x.faz===p.faz);
   else if(p.tipo==='vinci')ok=ev==='vinci'&&x.k===p.k&&(!p.faz||x.faz===p.faz);
   else if(p.tipo==='sito')ok=ev==='sito'&&x.tipo===p.tipoL;
   else if(p.tipo==='porta'&&((ev==='scena'&&!p.tipoL)||(ev==='arriva'&&(!p.tipoL||x.tipo===p.tipoL)))){ok=p.oro?tu.oro>=p.oro:(tu.merci[p.m]||0)>=p.n;if(ok){if(p.oro)tu.oro-=p.oro;else tu.merci[p.m]-=p.n}}
   if(!ok)continue;gr.inc=gr.incA;gr.incA=0;L(s,c.nome+' ha compiuto un passo: '+p.d,'bene');
   if(gr.inc>=c.inc.length)premioComp(s,c);else accoda(s,c.id.slice(3)+'-inc-'+(gr.inc+1))}}
 // ogni giorno: chi è fedele ti racconta il suo incarico; la rivale ti raggiunge ai giorni di VDAT.VOLPE
 function vociDelGiorno(s){if(!s.voci)return;const g=giorno(s),tu=TU(s);
  for(const c of inCompagnia(s)){const gr=gradDi(s,c.id);if(c.inc&&!gr.invito&&!gr.inc&&!gr.incA&&gr.g>=D.GRAD.FIDO&&accoda(s,c.id.slice(3)+'-inc-1'))gr.invito=1}
  const T=s.volpe.tappa,V=VOC();
  if(V&&!s.prigioniero&&!s.volpe.coda&&T<D.VOLPE.GIORNI.length&&g>=D.VOLPE.GIORNI[T]&&V.scene['volpe-'+(T+1)]){const rv=s.p.find(p=>p.k==='riv');
   if(rv&&!rv.sc){const v=vicinoOk(VEN.mappaDi(s),tu.x+1.5,tu.y+1);rv.x=v[0];rv.y=v[1];rv.via=[];rv.dentro=-1;rv.fermo=s.t+360;rv.ia={st:'giro',t:0};s.volpe.coda=T+1;accoda(s,'volpe-'+(T+1))}}}
 // confidenza di un signore verso chi gioca: 0..3, dalla sua memoria e dall'amicizia col suo regno
 function confidenza(s,sg){const m=memSig(sg),S=D.SIG.SOGLIE,pt=m.lib*3+m.fav*2+Math.floor(Math.max(0,s.rel[sg.faz]||0)/15)-m.sconf*2-m.trad*6;return pt>=S[2]?3:pt>=S[1]?2:pt>=S[0]?1:0}
 // favori di un signore nell'incontro (notizie, lettera, prestito) e il debito da rendere
 function favoreSig(s,sg,v){const S=D.SIG,m=memSig(sg),tu=TU(s),g=giorno(s),vuole=n=>confidenza(s,sg)<n?{err:'Non ti conosce abbastanza'}:null;
  if(v==='rendi'){const i=s.debiti.findIndex(d=>d.sig===sg.id);if(i<0)return{err:'Non gli devi nulla'};const d=s.debiti[i];if(tu.oro<d.oro)return{err:'Servono '+d.oro+' monete'};tu.oro-=d.oro;s.debiti.splice(i,1);L(s,'Rendi a '+sg.nome+' le '+d.oro+' monete: il conto è chiuso.','bene');return{s}}
  const e=vuole(v==='notizie'?1:2);if(e)return e;if(g-m.g<S.ATTESA)return{err:'Torna tra qualche giorno'};
  if(v==='lettera'){if(!VEN.regni(s).includes(sg.faz))return{err:'Non scrive per nessun re'};s.lettere[sg.faz]=g+S.LETTERA;m.g=g;L(s,sg.nome+' scrive per te una lettera di raccomandazione ('+S.LETTERA+' giorni).','bene');return{s}}
  if(v==='prestito'){if(s.debiti.some(d=>d.sig===sg.id))return{err:'Gli devi già del denaro'};tu.oro+=S.PRESTITO;s.debiti.push({sig:sg.id,oro:S.RESA,scad:g+S.SCAD});m.g=g;L(s,sg.nome+' ti presta '+S.PRESTITO+' monete: ne vuole '+S.RESA+' entro '+S.SCAD+' giorni.');return{s}}
  return null}
 // debiti scaduti: se hai l'oro li paga la compagnia da sé, altrimenti il signore se ne ricorda
 function debiti(s){const tu=TU(s),g=giorno(s);for(const d of s.debiti.slice()){if(g<d.scad)continue;const sg=s.sig[d.sig];s.debiti.splice(s.debiti.indexOf(d),1);if(!sg)continue;
  if(tu.oro>=d.oro){tu.oro-=d.oro;L(s,'Il debito con '+sg.nome+' scade: gli sono rese '+d.oro+' monete.')}
  else{memSig(sg).trad++;relaz(s,sg.faz,-10);L(s,'Non rendi il denaro a '+sg.nome+': non lo dimenticherà.','male')}}}
 Object.assign(VEN._,{memSig,inCompagnia,gradDi});
 return{inCompagnia,gradDi,memSig,limita,gradApri,umore,reagisci,parte,addii,gradPaga,EFF_VOCI,voceInit,vociApri,accoda,voce,avviaVoce,parla,confSig,avanzaInc,vociDelGiorno,confidenza,favoreSig,debiti}})());
