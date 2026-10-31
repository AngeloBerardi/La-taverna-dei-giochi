/* ---- Orchestratore dell'Avventura (A9): lo stato unico della sessione sopra la campagna, il racconto e la battaglia (motore puro). ----
   `AVV` tiene insieme `CAMP` (il mondo e gli eroi, 28), `ARAC` (scene, scelte e prove, 27q), `ACMP` (compagni, 27p), `AEVE` (eventi di strada, 27r) e `ASCO` (la battaglia, 27i): decide in
   quale fase si è (mappa, città, dialogo, battaglia, sotterraneo, fine), applica gli effetti `fuori` del racconto (oro, oggetti, PF, perdizione, XP, razioni, spostamenti, compagni, scontri),
   conta le vite di gruppo, chiude la sessione e prepara il salvataggio. Il rientro sull'account è di `ARIE` (28b).
   Contratto come gli altri motori: nuova(...) -> stato, act(stato, azione, capitolo) -> {s, righe, cambio?} | {err}. Lo stato è JSON puro; i dadi vengono da `s.rng` (27a): niente Math.random.
   Azioni: {t:'camp',a} · {t:'scena',id} · {t:'parla',id} · {t:'racconto',a:{t:'scegli',i}|{t:'continua'}} · {t:'esito',riep} · {t:'compagnia',id,azione:'entra'|'attende'} · {t:'chiudi'}. Piano: docs/AVVENTURA-A9.md. */
const AVV=(()=>{
 const DAD=typeof ADADI!=='undefined'?ADADI:require('./27a-avv-dadi.js');
 const CP=typeof CAMP!=='undefined'?CAMP:require('./28-campagna.js');
 const RA=typeof ARAC!=='undefined'?ARAC:require('./27q-avv-racconto.js');
 const CM=typeof ACMP!=='undefined'?ACMP:require('./27p-avv-compagni.js');
 const EV=typeof AEVE!=='undefined'?AEVE:require('./27r-avv-eventi.js');
 const SC=typeof ASCO!=='undefined'?ASCO:require('./27i-avv-scontro.js');
 const BE=typeof BEST!=='undefined'?BEST:require('./27f-avv-bestiario.js');
 const MOS=typeof AMOS!=='undefined'?AMOS:require('./27o-avv-mostri.js');
 const VERSIONE=1,FASI=['mappa','citta','dialogo','battaglia','sotterraneo','fine'];
 // i numeri dell'orchestratore in un posto solo (il bilanciamento fine è di A13)
 const PARAM={vite:3,pfRisveglio:.5,oroPersa:.5,perdizioneSconfitta:10,perdizioneFuga:1,eventoStrada:.14,eventoNotte:.08,monete:30,righe:60};
 const copia=x=>JSON.parse(JSON.stringify(x));
 const seme32=g=>Math.floor(g()*4294967296)>>>0;
 // ---- dove si trova il gruppo ----
 const unito=c=>{const v=CP.vivi(c);return v.length>0&&v.every(e=>e.q===v[0].q&&e.r===v[0].r)};
 const luogoGruppo=c=>unito(c)?CP.luogoDi(c,CP.vivi(c)[0]):null;
 const livelloGruppo=s=>{const L=s.camp.eroi.filter(e=>!e.compagno);return Math.max(1,Math.round(L.reduce((a,e)=>a+(e.liv||1),0)/Math.max(1,L.length)))};
 // la storia ha scene in quel luogo (la cripta e la torre del capitolo si attraversano a scene, non a stanze)
 const storia=(cap,id)=>Object.values((cap&&cap.scene)||{}).some(sc=>sc.dove&&[].concat(sc.dove).includes(id));
 // ---- fase: si ricalcola, non si sceglie ----
 function fase(s){if(s.fine)return'fine';const c=s.camp;if(s.bat||c.sfida)return'battaglia';if(s.racc.scena)return'dialogo';if(c.dentro)return'sotterraneo';
  const l=luogoGruppo(c);return l&&(l.tipo==='citta'||l.tipo==='villaggio')?'citta':'mappa'}
 // ---- il contesto che il racconto vuole (eroi, compagni compresi) ----
 const ctx=s=>{const c=s.camp,l=luogoGruppo(c);return{eroi:c.eroi,oro:c.oro,perdizione:c.perdizione,giorno:c.giorno,luogo:l?l.id:null}};
 // gli eventi di strada sono scene generate: l'orchestratore le aggiunge al capitolo solo per il tempo che servono
 const evDi=(cap,id)=>EV.EVENTI.concat((cap&&cap.eventi)||[]).find(e=>e.id===id)||null;
 const conEvento=(cap,ev)=>Object.assign({},cap,{scene:Object.assign({},cap.scene,{['ev-'+ev.id]:EV.scena(ev)})});
 function capDi(s,cap){const sc=s.racc.scena;if(!sc||!/^ev-/.test(sc.id))return cap;const e=evDi(cap,sc.id.slice(3));return e?conEvento(cap,e):cap}
 const nuovaSessione=s=>({da:{giorno:s.camp.giorno,oro:s.camp.oro,xp:Object.fromEntries(s.camp.eroi.filter(e=>!e.compagno).map(e=>[e.slot,e.xp|0]))},battaglie:0,sconfitte:0});
 // ---- nuova campagna ----
 // eroi: schede dell'account ({…, slot}); seme: numero; opz.avvio=false non fa partire il prologo
 function nuova(cap,eroi,seme,opz){opz=opz||{};const w=cap.mondo||{};
  const camp=CP.nuova(eroi,seme,{regioni:w.regioni,luoghi:w.luoghi,conta:w.conta,partenza:w.partenza,mercanti:w.mercanti,raggio:w.raggio,titolo:cap.titolo});
  const par=Object.values(camp.luoghi).find(l=>l.partenza)||Object.values(camp.luoghi)[0];
  const s={v:VERSIONE,g:'avventura',cap:cap.id,seme:seme>>>0,rng:DAD.semina((seme>>>0)+7),evn:0,camp,racc:RA.nuovo(cap.id,seme),bat:null,vite:PARAM.vite,viteMax:PARAM.vite,ultimaCitta:par?par.id:null,fase:'mappa',
   strada:{usati:[]},conto:{iniziale:Object.fromEntries(camp.eroi.map(e=>[e.slot,{xp:e.xp|0,liv:e.liv}])),oroIniziale:camp.oro,accreditato:Object.fromEntries(camp.eroi.map(e=>[e.slot,{xp:0,oro:0}]))},
   sessione:null,fine:null,log:[]};
  s.sessione=nuovaSessione(s);
  const primo=opz.avvio===false?null:(cap.ingressi||[])[0];
  if(primo){const righe=[],r=passoRacconto(s,cap,{t:'avvia',id:primo},righe);if(r.err)throw new Error('prologo: '+r.err);dopo(s,cap,righe)}
  s.fase=fase(s);return s}
 // ---- salvataggio: versione e migrazione ----
 function migra(st){if(!st||st.g!=='avventura')throw new Error('non è un salvataggio dell\'Avventura');if(st.v>VERSIONE)throw new Error('salvataggio più nuovo di questa versione');
  const s=copia(st);s.camp=CP.migra(s.camp);
  if(!s.strada)s.strada={usati:[]};if(!s.sessione)s.sessione=nuovaSessione(s);if(!Array.isArray(s.log))s.log=[];if(s.viteMax==null)s.viteMax=PARAM.vite;
  s.v=VERSIONE;return s}
 // il riassunto che si vede nell'elenco dei salvataggi, e i dati interi in una stringa (un solo campo per Firestore)
 function salva(s){return{v:VERSIONE,cap:s.cap,fase:fase(s),vite:s.vite,viteMax:s.viteMax,sessioni:s.racc.sessioni|0,giorno:s.camp.giorno,evn:s.evn|0,fine:s.fine?s.fine.esito:null,
  eroi:s.camp.eroi.filter(e=>!e.compagno).map(e=>({nome:e.nome,classe:e.classe,liv:e.liv})),dati:JSON.stringify(s)}}
 function apri(sal){try{const s=typeof sal==='string'?JSON.parse(sal):typeof sal.dati==='string'?JSON.parse(sal.dati):sal.dati||sal;return{s:migra(s)}}catch(e){return{err:'Salvataggio illeggibile: '+e.message}}}
 // ---- il racconto ----
 function passoRacconto(s,cap,a,righe){const r=RA.act(s.racc,a,capDi(s,cap),ctx(s));if(r.err)return r;s.racc=r.s;
  const e=applica(s,cap,r.fuori||[],righe);if(e)return e;
  if(typeof r.esito==='string'&&/^finale-/.test(r.esito))concludi(s,cap,r.esito,righe);
  return{}}
 // gli effetti sul mondo: passano dal ponte di CAMP; lo scontro apre `bat` e il racconto aspetta
 function applica(s,cap,fuori,righe){
  for(const f of fuori){
   if(f.t==='battaglia'){if(!s.bat)preparaBat(s,f);continue}
   if(f.t==='apri')continue;
   if(f.t==='compagno'){const e=compagno(s,cap,f,righe);if(e)return e;continue}
   const r=CP.ponte(s.camp,f);if(r.err)return r;s.camp=r.s;righe.push(...r.righe)}
  return null}
 function compagno(s,cap,f,righe){const d=(cap.compagni||{})[f.id];if(!d)return{err:'Compagno sconosciuto: '+f.id};
  if(f.azione==='entra'){const r=CP.ponte(s.camp,{t:'ingresso',scheda:CM.scheda(d,livelloGruppo(s),f.id)});
   if(r.err){if(s.racc.compagni[f.id])s.racc.compagni[f.id].stato='attende';return null}   // niente posto: aspetta in taverna
   s.camp=r.s;righe.push(...r.righe)}
  else{const r=CP.ponte(s.camp,{t:'congedo',id:f.id});if(r.s){s.camp=r.s;righe.push(...r.righe)}}
  return null}
 // ---- battaglie del racconto ----
 function preparaBat(s,f){const c=s.camp,v=c.eroi.map((e,i)=>e.hp>0?i:-1).filter(i=>i>=0).slice(0,SC.MAX_EROI||4),fam=f.fam||(BE.M[f.capo]||{}).fam;
  if(!fam||!v.length)throw new Error('battaglia non preparabile: '+JSON.stringify(f));
  const g=DAD.gen(s),liv=Math.min(8,MOS.livelloMedio(c)),inc=SC.incontro(fam,liv,v.length,f.diff||'medio',seme32(g));
  s.bat={k:'racconto',nemici:inc.nemici,ambiente:f.arena||null,seme:seme32(g),sorpresa:f.sorpresa||null,quali:v,dist:{},capo:f.capo||null}}
 // la battaglia pronta da giocare: di CAMP (mostro sulla mappa, stanza di un sotterraneo) o chiesta dal racconto
 function battaglia(s){if(s.camp.sfida)return CP.battaglia(s.camp);const b=s.bat;if(!b)return null;
  return SC.daCampagna({eroi:b.quali.map(i=>s.camp.eroi[i]),seed:s.camp.seed,evn:s.camp.evn,giorno:s.camp.giorno,party:s.camp.party,celle:s.camp.celle},
   {nemici:b.nemici,ambiente:b.ambiente||undefined,seme:b.seme,dist:b.dist,sorpresa:b.sorpresa||undefined})}
 // chi combatte (indici in camp.eroi) e i loro ritratti, per la vista
 const quali=s=>s.camp.sfida?s.camp.sfida.quali:s.bat?s.bat.quali:[];
 function esito(s,cap,riep,righe){
  if(!s.bat&&!s.camp.sfida)return{err:'Nessuna battaglia in corso'};if(!riep||riep.esito==null)return{err:'La battaglia non è finita'};
  s.sessione.battaglie++;
  if(s.camp.sfida){const r=CP.act(s.camp,{t:'esito',riep});if(r.err)return r;s.camp=r.s;
   if(riep.esito==='sconfitta'&&!s.camp.over)sconfitta(s,cap,righe)}
  else{const b=s.bat,r=SC.aggiorna({eroi:b.quali.map(i=>s.camp.eroi[i])},riep);if(r.err)return r;b.quali.forEach((i,k)=>{s.camp.eroi[i]=r.s.eroi[k]});s.bat=null;
   if(riep.esito==='vittoria'){righe.push('Vittoria!'+(riep.xpPerEroe?' '+riep.xpPerEroe+' esperienza a testa.':''))}
   else{s.racc.scena=null;
    if(riep.esito==='sconfitta'||!CP.vivi(s.camp).length)sconfitta(s,cap,righe);
    else{const p=CP.ponte(s.camp,{t:'perdizione',n:PARAM.perdizioneFuga});if(p.s)s.camp=p.s;righe.push('La compagnia si ritira: la scena è interrotta.')}}}
  return null}
 // ---- vite e risveglio ----
 function sconfitta(s,cap,righe){s.sessione.sconfitte++;s.vite=Math.max(0,s.vite-1);s.bat=null;s.racc.scena=null;
  if(s.camp.over&&!s.camp.over.win&&s.camp.perdizione<100)s.camp.over=null;
  if(s.vite<=0){s.fine={esito:'persa',vinta:false,titolo:'La compagnia è perduta',testo:'Le vite sono finite. Gli eroi tornano alla Taverna con ciò che hanno imparato.',sbloccati:[],monete:0,vite:0,giorni:s.camp.giorno};righe.push('Le vite sono finite.');return}
  const r=CP.risveglio(s.camp,s.ultimaCitta,null,{pf:PARAM.pfRisveglio,oro:PARAM.oroPersa,perdizione:PARAM.perdizioneSconfitta});
  if(r.err)throw new Error(r.err);s.camp=r.s;
  righe.push('La compagnia è sconfitta. '+(s.vite===1?'Resta una sola vita.':'Restano '+s.vite+' vite.')+(r.persi?' Nel buio sono sparite '+r.persi+' monete.':''))}
 // ---- fine del capitolo ----
 function concludi(s,cap,esito,righe){const f=(cap.finali||{})[esito]||{};
  const sbloccati=Object.keys(cap.compagni||{}).filter(id=>['gruppo','attende'].includes(CM.stato(s.racc,id)));
  s.fine={esito,vinta:true,titolo:f.titolo||'Il cantare è finito',testo:f.testo||'',sbloccati,monete:PARAM.monete,vite:s.vite,giorni:s.camp.giorno};
  s.bat=null;righe.push(s.fine.titolo)}
 // ---- eventi di strada ----
 function strada(s,cap,righe){const c=s.camp;if(c.sfida||c.incontro||c.evento||c.dentro||s.racc.scena||s.bat||s.fine)return;
  const v=CP.vivi(c);if(!v.length)return;const x=c.celle[CP.K(v[0].q,v[0].r)];if(!x||x.luogo||x.poi)return;
  const g=DAD.gen(s);if(g()>=PARAM.eventoStrada+(c.fase==='notte'?PARAM.eventoNotte:0)+c.perdizione/500)return;
  const ev=EV.eventoStrada(seme32(g),{terreno:x.t,notte:c.fase==='notte',perdizione:c.perdizione,usati:s.strada.usati,extra:cap.eventi});if(!ev)return;
  const r=RA.act(s.racc,{t:'avvia',id:'ev-'+ev.id},conEvento(cap,ev),ctx(s));if(r.err)return;
  s.racc=r.s;s.strada.usati.push(ev.id);const e=applica(s,cap,r.fuori||[],righe);if(e)return}
 // ---- azioni ----
 function azCamp(s,cap,a,righe){const c=s.camp;
  if(s.bat||c.sfida)return{err:'Prima va combattuta la battaglia'};if(s.racc.scena)return{err:'C\'è un racconto in corso'};
  if(a.t==='esito')return{err:'Il risultato della battaglia si dà con «esito»'};
  if(a.t==='entra'){const e=a.eroe!=null?c.eroi[a.eroe]:CP.vivi(c)[0],l=e&&CP.luogoDi(c,e);if(l&&storia(cap,l.id))return{err:'Qui la storia decide il passo: apri la scena del luogo'}}
  const r=CP.act(c,a);if(r.err)return r;s.camp=r.s;
  if(a.t==='muovi')strada(s,cap,righe);
  return{}}
 function azScena(s,cap,id,righe,vieneDa){const c=s.camp;
  if(s.racc.scena)return{err:'C\'è già una scena in corso'};if(s.bat||c.sfida||c.incontro||c.evento||c.dentro)return{err:'Non adesso'};
  const l=luogoGruppo(c);if(vieneDa==='luogo'){if(!l)return{err:'Riunite la compagnia in un luogo'};
   if(!RA.disponibili(cap,s.racc,ctx(s),l.id).includes(id))return{err:'Qui non c\'è nulla da fare'}}
  return passoRacconto(s,cap,{t:'avvia',id},righe)}
 function azCompagnia(s,cap,a,righe){const c=s.camp,l=luogoGruppo(c),d=(cap.compagni||{})[a.id];
  if(!d)return{err:'Compagno sconosciuto'};if(!l||l.tipo!=='citta')return{err:'I compagni si cambiano in città'};if(s.racc.scena||s.bat||c.sfida)return{err:'Non adesso'};
  const st=CM.stato(s.racc,a.id);
  if(a.azione==='entra'){if(st!=='attende')return{err:d.nome+' non sta aspettando'};if(c.eroi.length>=CM.POSTI)return{err:'La compagnia è al completo'};
   s.racc.compagni[a.id].stato='gruppo';return compagno(s,cap,{id:a.id,azione:'entra'},righe)}
  if(a.azione==='attende'){if(st!=='gruppo')return{err:d.nome+' non è nel gruppo'};if(c.eroi.length<2)return{err:'Deve restare almeno un eroe'};
   s.racc.compagni[a.id].stato='attende';return compagno(s,cap,{id:a.id,azione:'esce'},righe)}
  return{err:'Azione sconosciuta'}}
 function riepilogo(s,cap){const da=s.sessione.da,c=s.camp;
  return{sessione:(s.racc.sessioni|0)+1,giorni:c.giorno-da.giorno,oro:c.oro-da.oro,xp:Object.fromEntries(c.eroi.filter(e=>!e.compagno).map(e=>[e.slot,(e.xp|0)-(da.xp[e.slot]|0)])),battaglie:s.sessione.battaglie,sconfitte:s.sessione.sconfitte}}
 function chiudi(s,cap){const f=fase(s);if(f!=='mappa'&&f!=='citta')return{err:'La sessione si chiude sulla mappa, non nel mezzo di una scena o di una battaglia'};
  const rie=riepilogo(s,cap);s.racc=RA.finisciSessione(s.racc);s.sessione=nuovaSessione(s);rie.cantare=RA.cantare(cap,s.racc,ctx(s));return{riepilogo:rie}}
 // ---- dopo ogni azione ----
 function dopo(s,cap,righe){
  const lv=CP.livelli(s.camp);s.camp=lv.s;righe.push(...lv.su);
  if(s.camp.over&&!s.fine){
   if(!s.camp.over.win&&s.camp.perdizione<100)sconfitta(s,cap,righe);
   else if(!s.camp.over.win)s.fine={esito:'persa',vinta:false,titolo:'La perdizione ha inghiottito il regno',testo:'Il buio ha vinto. Gli eroi tornano alla Taverna con ciò che hanno imparato.',sbloccati:[],monete:0,vite:s.vite,giorni:s.camp.giorno};
   else s.camp.over=null}
  const l=luogoGruppo(s.camp);if(l&&l.tipo==='citta')s.ultimaCitta=l.id;
  s.log.push(...righe);if(s.log.length>PARAM.righe)s.log.splice(0,s.log.length-PARAM.righe)}
 function act(st,a,cap){
  if(!st||st.g!=='avventura')return{err:'Stato non valido'};if(!a||!a.t)return{err:'Azione mancante'};
  let s;try{s=migra(st)}catch(e){return{err:e.message}}
  if(s.fine)return{err:'La campagna è finita'};
  const prima=fase(s),righe=[];s.evn++;let r;
  try{switch(a.t){
   case'camp':r=azCamp(s,cap,a.a||{},righe);break;
   case'scena':r=azScena(s,cap,a.id,righe,'luogo');break;
   case'parla':{const id=CM.parla(s.racc,cap,a.id);r=id?azScena(s,cap,id,righe,null):{err:'Non ha niente da dirti, adesso'};break}
   case'racconto':{if(s.bat||s.camp.sfida)return{err:'Prima va combattuta la battaglia'};if(!s.racc.scena)return{err:'Nessuna scena in corso'};
    const b=a.a||{};if(b.t!=='scegli'&&b.t!=='continua')return{err:'Azione del racconto non valida'};r=passoRacconto(s,cap,b,righe);break}
   case'esito':r=esito(s,cap,a.riep,righe);break;
   case'compagnia':r=azCompagnia(s,cap,a,righe);break;
   case'chiudi':r=chiudi(s,cap);break;
   default:return{err:'Azione sconosciuta: '+a.t}}}
  catch(e){return{err:e.message}}
  if(r&&r.err)return{err:r.err};
  dopo(s,cap,righe);s.fase=fase(s);
  const out={s,righe};if(s.fase!==prima)out.cambio={da:prima,a:s.fase};if(r&&r.riepilogo)out.riepilogo=r.riepilogo;return out}
 // ---- per la vista: tutto ciò che serve a disegnare, senza toccare lo stato ----
 function vista(s,cap){const c=s.camp,l=luogoGruppo(c),cx=ctx(s);
  return{fase:fase(s),vite:s.vite,viteMax:s.viteMax,luogo:l?{id:l.id,nome:l.nome,tipo:l.tipo}:null,
   scene:!s.racc.scena&&!s.bat&&!c.sfida&&l?RA.disponibili(cap,s.racc,cx,l.id).map(id=>({id,titolo:(cap.scene[id]||{}).titolo||id})):[],
   compagni:Object.keys(cap.compagni||{}).filter(id=>CM.stato(s.racc,id)!=='sconosciuto').map(id=>({id,nome:cap.compagni[id].nome,stato:CM.stato(s.racc,id),approv:CM.approv(s.racc,cap,id),parla:!!CM.parla(s.racc,cap,id)})),
   racconto:s.racc.scena?RA.vista(s.racc,capDi(s,cap),cx):null,fine:s.fine,ultimaCitta:s.ultimaCitta}}
 return{VERSIONE,FASI,PARAM,nuova,act,fase,ctx,vista,battaglia,quali,salva,apri,migra,storia,livelloGruppo}})();
if(typeof module!=='undefined')module.exports=AVV;
