/* ---- Battaglia (Cantari di Ventura, A5.4–A5.7): la vista a tutto schermo dello scontro, pensata per il telefono a 390 px. ----
   I motori fanno tutto il lavoro: ASCO (regole), AIA (nemici), ACOM (cosa significa un tocco), ACRO (cronaca e animazioni). Qui si disegna e si tiene il filo.
   Mappa e gesti: 24hc-bat-mappa.js · sagome dei mostri: 24hd · animazioni: 24hf · stile: css/39c-battaglia.css · piano: docs/AVVENTURA-A5.md.
   La battaglia di prova parte dalla pagina Avventura (nessun premio, nessun rischio per gli eroi) e si salva a ogni azione: si riprende dopo un'uscita o un ricaricamento. */
const Bat={
 DEF:{fam:'bestie',diff:'medio',liv:1,party:'prova',rea:'chiedi',vel:1},
 FAM_AMB:{bestie:['bosco','pianura','collina'],banditi:['strada','pianura','citta'],nonmorti:['palude','antro','collina'],torre:['torre','antro']},
 DIFF:[['facile','Facile'],['medio','Media'],['difficile','Difficile'],['capo','Capo']],
 // la compagnia di prova: quattro eroi (guerriero, mago, chierico, ladro) del livello scelto, con qualche oggetto in cintura
 PROVA:[['guerriero','Brenno','umano',{for:15,des:12,cos:14,int:8,sag:10,car:8},['pozione-cura']],['mago','Iselda','elfo',{for:8,des:14,cos:12,int:15,sag:10,car:8},['bomba-fuoco']],
  ['chierico','Fra Tomaso','nano',{for:12,des:10,cos:13,int:8,sag:15,car:10},['pozione-cura','pozione-cura']],['ladro','Nina','piccolo',{for:8,des:15,cos:13,int:12,sag:10,car:10},['bomba-fuoco']]],
 s:null,c:null,mondo:null,v:{k:1,cx:null,cy:null},aspetti:{},cfg:null,log:[],foglio:null,pausa:null,msg:'',msgSetup:'',
 anim:false,lavoro:false,salta:false,vedi:false,logAperto:false,gen:0,
 // ---- salvataggio ----
 carica(){try{const j=JSON.parse(localStorage.getItem('batcfg')||'null');Bat.cfg=Object.assign({},Bat.DEF,j&&typeof j==='object'?j:{})}catch(e){ERR.n(e);Bat.cfg=Object.assign({},Bat.DEF)}
  Bat.cfg.liv=Math.max(1,Math.min(8,Bat.cfg.liv|0||1))},
 salvaCfg(){try{localStorage.setItem('batcfg',JSON.stringify(Bat.cfg))}catch(e){ERR.n(e)}},
 salva(){try{if(!Bat.s||(Bat.s.over&&!Bat.mondo))localStorage.removeItem('bat');else localStorage.setItem('bat',JSON.stringify({v:1,s:Bat.s,aspetti:Bat.aspetti,log:Bat.log.slice(-60),mondo:Bat.mondo||null}))}catch(e){ERR.n(e)}},
 riprendi(){try{const j=JSON.parse(localStorage.getItem('bat')||'null');
  if(j&&j.v===1&&j.s&&j.s.v===1&&j.s.arena&&(!j.s.over||j.mondo)){Bat.s=j.s;Bat.mondo=j.mondo||null;Bat.aspetti=j.aspetti||{};Bat.log=Array.isArray(j.log)?j.log:[];Bat.c=ACOM.nuovo(Bat.s)}}catch(e){ERR.n(e)}},
 inCorso(){return!!Bat.s&&!Bat.s.over},
 auto(c){return c.lato==='nemici'||c.hp<=0},
 // ---- avvio ----
 prova(liv){return Bat.PROVA.map(([cl,nome,razza,base,cint],i)=>{const h=EROI.nuovo({nome,razza,classe:cl,base,aspetto:{pelle:i%6,capelli:(i*2+1)%7,mantello:(i+2)%6,viso:i%4}},1000+i);
   h.liv=liv;h.xp=EROI.SOGLIE_XP[liv-1];h.hpMax=EROI.derivati(h).hpMax;h.hp=h.hpMax;h.cintura=cint.slice();return{eroe:APOT.completa(h),dist:0}})},
 // gli eroi dell'account (riletti dal profilo), al massimo dei PF e senza cariche spese: la prova non tocca nulla
 async conto(){let L=Eroi.lista;try{L=await FB.eroi();Eroi.lista=L}catch(e){console.warn('Bat',e)}
  return EROI.SLOT_ID.map(id=>L&&L[id]&&EROI.coerente(L[id])?{...L[id],slot:id}:null).filter(Boolean).slice(0,ASCO.MAX_EROI)
   .map(h=>({eroe:APOT.completa({...h,hp:EROI.derivati(h).hpMax,usi:{},conc:undefined}),dist:0}))},
 async avvia(){if(Bat.lavoro||Bat.avviando)return;if(Bat.mondo){Bat.msgSetup='Prima concludi la battaglia della campagna.';return render()}Bat.avviando=true;Bat.msgSetup='';
  try{const cfg=Bat.cfg;let squad;
   if(cfg.party==='conto'){squad=await Bat.conto();if(!squad.length){Bat.msgSetup='Non hai eroi sul profilo: scegli la compagnia di prova.';return}}else squad=Bat.prova(cfg.liv);
   const liv=cfg.party==='conto'?Math.max(1,Math.round(squad.reduce((a,m)=>a+(m.eroe.liv||1),0)/squad.length)):cfg.liv,seme=(Date.now()^(Math.random()*4294967296))>>>0;
   const inc=ASCO.incontro(cfg.fam,liv,squad.length,cfg.diff,seme),amb=Bat.FAM_AMB[cfg.fam]||['strada'],arena=AARE.perIncontro(seme,amb[seme%amb.length],inc.nemici);
   const s=ASCO.nuovo(squad,inc.nemici,arena,{seme,difficolta:cfg.diff,reazioni:{eroi:cfg.rea==='auto'?'auto':'chiedi',nemici:'auto'}});
   Bat.gen++;Bat.s=s;Bat.c=ACOM.nuovo(s);Bat.aspetti={};squad.forEach((m,k)=>{Bat.aspetti['e'+(k+1)]=m.eroe.aspetto});
   Bat.v={k:1,cx:null,cy:null};Bat.log=[{testo:`Comincia lo scontro: ${inc.nemici.length} ${inc.nemici.length===1?'nemico':'nemici'} contro ${squad.length} ${squad.length===1?'eroe':'eroi'}.`,lato:null,peso:'normale'}];
   Bat.foglio=null;Bat.pausa=null;Bat.msg='';Bat.anim=false;Bat.salta=false;Bat.vedi=false;Bat.logAperto=false;Bat.salva();ui.avv=false;ui.bat=true}
  catch(e){ERR.n(e);Bat.msgSetup='Non riesco a preparare la battaglia: riprova.'}
  finally{Bat.avviando=false;render()}},
 // la battaglia della campagna (A6.5): `stato` = CAMP.battaglia(s), `aspetti` = gli aspetti degli eroi che partecipano (nell'ordine di `sfida.quali`), `chiave` = il seme della sfida
 daMondo(stato,aspetti,chiave){Bat.gen++;Bat.s=stato;Bat.c=ACOM.nuovo(stato);Bat.mondo=chiave;Bat.aspetti={};aspetti.forEach((a,k)=>{Bat.aspetti['e'+(k+1)]=a});
  Bat.v={k:1,cx:null,cy:null};Bat.log=[{testo:`Comincia lo scontro: ${stato.cb.filter(c=>c.lato==='nemici').length} nemici contro ${stato.cb.filter(c=>c.lato==='eroi').length} eroi.`,lato:null,peso:'normale'}];
  Bat.foglio=null;Bat.pausa=null;Bat.msg='';Bat.anim=false;Bat.salta=false;Bat.vedi=false;Bat.logAperto=false;Bat.salva()},
 // dopo «Continua»: la battaglia è registrata nella campagna e non serve più
 chiudiMondo(){Bat.gen++;Bat.s=null;Bat.c=null;Bat.mondo=null;Bat.log=[];Bat.pausa=null;Bat.anim=false;Bat.lavoro=false;Bat.foglio=null;Bat.salva();ui.bat=false;ui.camp=true;document.documentElement.classList.remove('bat-on')},
 // ---- tocchi sulla mappa e comandi ----
 tocca(cella){if(!Bat.s||Bat.anim||Bat.lavoro||Bat.pausa||Bat.s.over||Bat.foglio)return;Bat.msg='';
  if(!cella){Bat.c=ACOM.annulla(Bat.c,Bat.s);return render()}
  const r=ACOM.tocca(Bat.c,Bat.s,cella);Bat.c=r.c;if(r.azione)return Bat.umano(r.azione);render()},
 // un'azione di un giocatore: se serve una reazione si ferma e aspetta; poi `dopo` fa giocare i nemici
 async umano(a){Bat.lavoro=true;try{await Bat.gioca(a)}catch(e){ERR.n(e);Bat.msg='Azione non riuscita.';Bat.anim=false;Bat.c=ACOM.nuovo(Bat.s)}finally{Bat.lavoro=false}if(ui.bat)render()},
 // esegue un'azione con la sua animazione. Torna false se non è stata eseguita (errore o reazione da scegliere).
 async gioca(a){const r=ASCO.act(Bat.s,a);
  if(r.pausa){Bat.pausa={azione:a,p:r.pausa};Bat.anim=false;Bat.c=ACOM.nuovo(Bat.s);render();return false}
  if(r.err){Bat.msg=r.err;Bat.anim=false;Bat.c=ACOM.nuovo(Bat.s);render();return false}
  const g=Bat.gen;Bat.pausa=null;Bat.foglio=null;Bat.c=ACOM.nuovo(Bat.s);Bat.anim=true;render();
  await BatAnima.gira(r.ev,r.s,Bat);
  Bat.s=r.s;Bat.c=ACOM.nuovo(r.s);Bat.anim=false;Bat.salva();if(g===Bat.gen&&ui.bat)render();return g===Bat.gen},
 // i turni dei nemici (e degli eroi a terra) si giocano da soli, uno dopo l'altro
 async avanza(){if(Bat.lavoro||Bat.pausa||!Bat.s||Bat.s.over||!ui.bat)return;Bat.lavoro=true;const g=Bat.gen;
  try{for(let n=0;n<400&&g===Bat.gen&&ui.bat&&!Bat.s.over&&!Bat.pausa;n++){
    const att=ASCO.attore(Bat.s);if(!att||!Bat.auto(att)){Bat.salta=false;break}
    let ok=await Bat.gioca(AIA.prossima(Bat.s,{livello:'normale'}));
    if(!ok&&!Bat.pausa&&g===Bat.gen)ok=await Bat.gioca({t:'fine'});
    if(!ok)break;if(!Bat.salta)await BatAnima.attesa(110/(Bat.cfg.vel||1))}}
  catch(e){ERR.n(e);Bat.msg='Qualcosa è andato storto: la battaglia è salvata.';Bat.anim=false}
  finally{Bat.lavoro=false}
  if(g===Bat.gen&&ui.bat){Bat.anim=false;render()}},
 // chiamato da afterRender dopo ogni disegno
 dopo(){const on=!!(ui.bat&&Bat.s);document.documentElement.classList.toggle('bat-on',on);if(!on)return;
  const att=ASCO.attore(Bat.s);if(att&&Bat.auto(att)&&!Bat.lavoro&&!Bat.pausa&&!Bat.s.over)setTimeout(()=>Bat.avanza(),60)},
 suTurno(id,s){const c=ASCO.trova(s,id);if(!c)return;for(const e of document.querySelectorAll('.bt-tok.attivo'))e.classList.remove('attivo');
  const el=BatAnima.tok(id);if(el){el.classList.add('attivo');if((Bat.v.k||1)>1.05){const [x,y]=BatAnima.pos(el);Bat.segui(x,y)}}
  const t=document.querySelector('.bt-turno');if(t)t.textContent=c.lato==='eroi'?'Tocca a '+ACRO.nome(s,id):'Turno di '+ACRO.nome(s,id)},
 // porta la vista su un punto (solo se si è ingranditi)
 segui(x,y){const svg=document.querySelector('.bt-svg');if(svg&&Bat.s)BatMappa.centra(svg,x,y)},
 logDom(){const el=document.querySelector('.bt-alto');if(el&&Bat.s){el.innerHTML=Bat.altoH(Bat.s);const l=el.querySelector('.bt-log');if(l)l.scrollTop=l.scrollHeight}},
 // ---- disegno ----
 html(){const s=Bat.s;if(!s)return'';Bat.c=ACOM.fresco(Bat.c,s);
  const att=ASCO.attore(s),p=ACOM.pannello(Bat.c,s),e=ACOM.evidenzia(Bat.c,s);
  return`<div class="bt${Bat.anim?' anima':''}${Bat.lavoro?' lavoro':''}" role="dialog" aria-modal="true" aria-label="Battaglia">${Bat.topH(s,att)}
<div class="bt-mappa">${BatMappa.svg(s,{ev:e,vista:Bat.v,aspetti:Bat.aspetti})}<div class="bt-alto">${Bat.altoH(s)}</div>${Bat.zoomH()}<div class="bt-dado" aria-live="polite"></div><div class="bt-toast" role="status"></div>${Bat.testoH(e)}</div>
${Bat.risH(s,p,att)}${Bat.barraH(s,p)}${Bat.foglioH(s,p)}${Bat.pausaH(s)}${Bat.fineH(s)}</div>`},
 // la fila dell'iniziativa: chi è di turno è sempre il primo
 topH(s,att){const ids=s.ordine.map(id=>ASCO.trova(s,id)).filter(c=>c&&ASCO.inCampo(c)),k=ids.findIndex(c=>att&&c.id===att.id),rot=k>0?ids.slice(k).concat(ids.slice(0,k)):ids;
  const ch=rot.map((c,i)=>{const eroe=c.lato==='eroi';return`<button class="bt-ch ${eroe?'ce':'cn'}${i===0?' cur':''}${c.hp<=0?' ko':''}" data-a="batinfo" data-v="${esc(c.id)}" aria-label="${esc(ACRO.nome(s,c.id))}${i===0?', di turno':''}">${eroe?Eroi.ritratto(Bat.aspetti[c.id],c.razza,c.classe,30):Sagome.svg(c,30)}</button>`}).join('');
  return`<div class="bt-top"><span class="bt-giro">Giro<b>${s.giro}</b></span><div class="bt-ini" role="group" aria-label="Ordine di iniziativa">${ch}</div><button class="ib" data-a="batlog" aria-label="Registro della battaglia">${ic('chat',18)}</button><button class="ib" data-a="batfoglio" data-v="menu" aria-label="Menu della battaglia">${ic('x',18)}</button></div>`},
 // in alto sulla mappa: la scheda della creatura toccata oppure le ultime righe del registro
 altoH(s){const i=Bat.c&&Bat.c.info&&ASCO.trova(s,Bat.c.info);if(i&&!Bat.logAperto)return Bat.infoH(s,i);
  const n=Bat.logAperto?16:3,L=Bat.log.slice(-n);if(!L.length)return'';
  return`<div class="bt-log${Bat.logAperto?' aperto':''}" data-a="batlog" role="log" aria-label="Registro">${L.map((r,k)=>`<p class="${r.lato?'l-'+r.lato:''} ${r.peso}${!Bat.logAperto&&k<L.length-2?' vec':''}">${esc(r.testo)}</p>`).join('')}</div>`},
 infoH(s,c){const eroe=c.lato==='eroi',m=!eroe&&typeof BEST!=='undefined'?BEST.M[c.def]:null,st=(c.stati||[]).map(z=>z.id).filter(id=>id!=='terra'||c.hp<=0);
  const nomeSt=id=>(ASTA.STATI[id]&&ASTA.STATI[id].nome)||id,stati=st.length?st.map(id=>`<span class="bt-sc">${esc(nomeSt(id))}</span>`).join(''):'';
  const sotto=eroe?`${esc(EROI.CLASSI[c.classe].nome)} ${c.liv}`:`${esc(BEST.FAMIGLIE[m.fam]||'')} · ${esc((BEST.RUOLI[m.ruolo]||{}).nome||m.ruolo)}${m.capo?' · capo':''}`;
  return`<div class="bt-info" role="region" aria-label="Scheda di ${esc(ACRO.nome(s,c.id))}"><span class="bt-ir">${eroe?Eroi.ritratto(Bat.aspetti[c.id],c.razza,c.classe,44):Sagome.svg(c,44)}</span>
<div class="bt-it"><b>${esc(ACRO.nome(s,c.id))}</b><small>${sotto}</small><div class="bt-nn"><span>PF <b>${Math.max(0,c.hp)}/${c.hpMax}</b></span><span>CA <b>${c.ca}</b></span><span>Mov <b>${c.mov}</b></span>${c.conc!=null&&eroe?`<span>Conc. <b>${c.conc}/${c.concMax}</b></span>`:''}</div>${stati?`<div class="bt-ss">${stati}</div>`:''}${m&&m.desc?`<p class="bt-dsc">${esc(m.desc)}</p>`:''}</div>
<button class="ib" data-a="batinfox" aria-label="Chiudi la scheda">${ic('x',16)}</button></div>`},
 zoomH(){const meno='<svg class="ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M5 12h14"/></svg>';
  return`<div class="bt-zoom"><button class="ib" data-a="batzoom" data-v="+" aria-label="Ingrandisci">${ic('plus',20)}</button><button class="ib" data-a="batzoom" data-v="-" aria-label="Rimpicciolisci">${meno}</button><button class="ib" data-a="batzoom" data-v="c" aria-label="Centra su chi è di turno">${ic('bersaglio',20)}</button></div>`},
 // sotto la mappa: che cosa succede se tocchi ancora, con i numeri dell'anteprima
 testoH(e){if(Bat.s.over&&!Bat.vedi)return'';const t=Bat.c.msg||Bat.msg||e.testo,an=e.anteprima?ACOM.testoAnteprima(e.anteprima,Bat.c.conc):'';if(!t&&!an)return'';
  return`<div class="bt-testo" role="status">${an?`<b>${esc(an)}</b>`:''}<span>${esc(t)}</span></div>`},
 // risorse del turno: azione, bonus, reazione, movimento, Concentrazione (o chi sta giocando)
 risH(s,p,att){if(!p.eroe)return`<div class="bt-ris"><span class="bt-turno">${att?(att.lato==='nemici'?'Turno di ':'Tocca a ')+esc(ACRO.nome(s,att.id)):''}</span></div>`;
  const c=p.conc,pip=(on,t,k)=>`<span class="bt-pip ${k}${on?' on':''}" aria-label="${t}: ${on?'disponibile':'usata'}"><i></i>${t}</span>`;
  return`<div class="bt-ris">${pip(p.azione,'Azione','p-a')}${pip(p.bonus,'Bonus','p-b')}${pip(p.rea,'Reazione','p-r')}<span class="bt-pm" aria-label="Movimento ${p.pm}">${ic('passi',14)}<b>${p.pm}</b></span>
<button class="bt-conc${c.attiva?' on':''}" data-a="batconc" ${c.ok||c.attiva?'':'disabled'} aria-pressed="${c.attiva}" aria-label="Concentrazione ${c.n} su ${c.max}">${ic('scintilla',14)}<b>${c.n}/${c.max}</b><span>${c.attiva?'vantaggio':'Conc.'}</span></button></div>`},
 // una riga che dice che cosa fa un oggetto (il catalogo non ha un testo: si ricava dall'effetto)
 descOgg(p){const e=((p||{}).eff||[])[0]||{},N={cura:'Cura',danno:'Danni',stato:'Applica uno stato'};return(N[e.k]||'Effetto')+(e.expr?' '+e.expr:'')+(e.tipo?' ('+e.tipo+')':'')+(p&&p.area&&p.area!=='singolo'?' · '+p.area:'')},
 etichettaPronto(c){const a=c.pronto;if(!a)return'';
  if(a.t==='potere'){const p=APOT.P[a.id];return p?p.nome:'Potere'}if(a.t==='oggetto'){const p=APOT.oggetto(a.id);return p?p.nome:'Oggetto'}
  if(a.t==='attacca')return'Attacca';if(a.t==='muovi')return'Muovi';if(a.t==='fine')return'Fine turno';return(ACOM.SPECIALI[a.t]||[a.t])[0]},
 barraH(s,p){if(s.over||Bat.pausa)return'';
  if(!p.eroe){const v=Bat.cfg.vel||1;return`<div class="bt-barra nem"><button class="b sm${v===1?' gold':''}" data-a="batvel" data-v="1" aria-pressed="${v===1}">1×</button><button class="b sm${v===2?' gold':''}" data-a="batvel" data-v="2" aria-pressed="${v===2}">2×</button><button class="b sm" data-a="batsalta">Salta ${ic('freccia',16)}</button></div>`}
  const c=Bat.c;
  if(c.pronto)return`<div class="bt-barra"><button class="b" data-a="batannulla">Annulla</button><button class="b gold bt-ok" data-a="batconferma">${ic('spunta',20)} ${esc(Bat.etichettaPronto(c))}</button></div>`;
  if(c.uso)return`<div class="bt-barra"><button class="b" data-a="batannulla">Annulla</button></div>`;
  const bt=(a,v,ico,t,ok,n)=>`<button class="bt-az${ok?'':' off'}" data-a="${a}" ${v?`data-v="${v}"`:''} aria-disabled="${!ok}">${ic(ico,24)}<span>${t}</span>${n?`<i>${n}</i>`:''}</button>`;
  return`<div class="bt-barra b5">${bt('batuso','attacca','spada','Attacca',p.attacca.ok,p.attacca.n)}${bt('batfoglio','poteri','scintilla','Poteri',p.poteri.some(x=>x.ok))}${bt('batfoglio','oggetti','borsa','Oggetti',p.oggetti.some(x=>x.ok))}${bt('batfoglio','altro','passi','Altro',true)}${bt('batfine','','freccia','Fine',true)}</div>`},
 // fogli dal basso: poteri, oggetti, altro, menu
 foglioH(s,p){const f=Bat.foglio;if(!f||s.over)return'';
  const riga=(v,nome,tag,desc,ok,perche,extra)=>`<button class="bt-riga${ok?'':' off'}" data-a="batuso" data-v="${v}" ${ok?'':'disabled'}><b>${esc(nome)}</b>${tag?`<em>${esc(tag)}</em>`:''}${extra?`<i>${esc(extra)}</i>`:''}<small>${esc(ok?desc:(perche||desc))}</small></button>`;
  const COSTO={azione:'Azione',bonus:'Bonus',reazione:'Reazione',gratis:'Gratis'};let titolo='',corpo='';
  if(f==='poteri'){titolo='Poteri';corpo=p.poteri.length?p.poteri.map(x=>riga('potere:'+x.id,x.nome,COSTO[x.costo]||'',x.desc,x.ok,x.perche,x.usiMax!=null&&isFinite(x.usiMax)?`${x.usi}/${x.usiMax}`:'')).join(''):'<p class="muted">Nessun potere da usare adesso.</p>'}
  else if(f==='oggetti'){titolo='Oggetti';corpo=p.oggetti.length?p.oggetti.map(x=>riga('oggetto:'+x.id,x.nome,COSTO[x.costo]||'',Bat.descOgg(APOT.oggetto(x.id)),x.ok,x.perche,x.n>1?'×'+x.n:'')).join(''):'<p class="muted">Non hai oggetti alla cintura.</p>'}
  else if(f==='altro'){titolo='Altre azioni';corpo=p.speciali.map(x=>riga('speciale:'+x.t,x.nome,'',x.desc,x.ok,x.perche,'')).join('')}
  else if(f==='menu'){titolo='Battaglia';const v=Bat.cfg.vel||1;
   corpo=`<div class="bt-menu"><div class="bt-vv"><span>Velocità dei nemici</span><button class="b sm${v===1?' gold':''}" data-a="batvel" data-v="1">1×</button><button class="b sm${v===2?' gold':''}" data-a="batvel" data-v="2">2×</button></div>
<button class="b" data-a="batlog">Registro completo</button><button class="b" data-a="batesci">Esci e riprendi dopo</button>${Bat.mondo?'':'<button class="b" data-a="batabbandona">Abbandona la battaglia</button>'}<button class="b gold" data-a="batchiudi">Torna alla battaglia</button></div>`}
  else return'';
  return`<div class="bt-vela" data-a="batchiudi"></div><div class="bt-foglio" role="dialog" aria-label="${titolo}"><div class="bt-fh"><b>${titolo}</b><button class="ib" data-a="batchiudi" aria-label="Chiudi">${ic('x',16)}</button></div><div class="bt-fl">${corpo}</div></div>`},
 // la reazione che il giocatore può scegliere (scudo, ritiro, riduzione del danno…)
 pausaH(s){const P=Bat.pausa;if(!P||s.over)return'';const q=ACOM.pausa(P.p,s);
  return`<div class="bt-vela"></div><div class="bt-foglio bt-pausa" role="alertdialog" aria-label="${esc(q.titolo)}"><div class="bt-fh"><b>${esc(q.titolo)}</b></div><div class="bt-fl"><p>${esc(q.testo)}</p>
${q.opzioni.map(o=>`<button class="bt-riga" data-a="batrea" data-v="${esc(o.id)}"><b>${esc(o.nome)}</b><small>${esc(o.desc)}</small></button>`).join('')}<button class="b" data-a="batrea" data-v="">${esc(q.rifiuta)}</button></div></div>`},
 // fine della battaglia: esito, giri, punti esperienza e stato degli eroi
 fineH(s){if(!s.over)return'';const R=ASCO.riepilogo(s),ok=R.esito==='vittoria';
  if(Bat.vedi)return`<div class="bt-barra fine"><button class="b" data-a="batvedi">${esc(ACRO.ESITO[R.esito]||'Fine')}</button><button class="b gold" data-a="${Bat.mondo?'batmondo':'batesci'}">${Bat.mondo?'Continua':'Esci'}</button></div>`;
  const stato={'in-piedi':'in piedi','a-terra':'a terra',fuggito:'fuggito'};
  return`<div class="bt-vela"></div><div class="bt-fine ${ok?'vitt':'sconf'}" role="alertdialog" aria-label="${esc(ACRO.ESITO[R.esito]||'Fine')}"><h2>${esc(ACRO.ESITO[R.esito]||'Fine')}</h2>
<p class="muted">${R.giri} ${R.giri===1?'giro':'giri'} · ${R.xp} PE${R.xp?` (${R.xpPerEroe} a testa)`:''}</p>
<ul>${R.eroi.map(h=>`<li class="${h.hp<=0?'ko':''}"><span>${Eroi.ritratto(Bat.aspetti[h.id],(ASCO.trova(s,h.id)||{}).razza,(ASCO.trova(s,h.id)||{}).classe,34)}</span><b>${esc(h.nome)}</b><small>${Math.max(0,h.hp)}/${h.hpMax} PF · ${stato[h.stato]||h.stato}</small></li>`).join('')}</ul>
${Bat.mondo?`<p class="muted">${R.esito==='vittoria'?'Il bottino e l\'esperienza entrano nella campagna.':'La compagnia si ritira: la campagna ne tiene conto.'}</p>${Bat.msg?`<p class="no" role="status">${esc(Bat.msg)}</p>`:''}
<button class="b gold" data-a="batmondo">Continua</button><button class="b" data-a="batvedi">Guarda il campo</button></div>`:`<p class="muted">Battaglia di prova: i tuoi eroi non cambiano.</p>
<button class="b gold" data-a="batrigioca">${ok?'Combatti ancora':'Riprova'}</button><button class="b" data-a="batvedi">Guarda il campo</button><button class="b" data-a="batesci">Esci</button></div>`}`},
 // ---- la sezione nella pagina Avventura: scelte e pulsante «Combatti» ----
 chip(a,v,t,on){return`<button class="chip${on?' on':''}" data-a="${a}" data-v="${v}" aria-pressed="${on}">${t}</button>`},
 setupH(){const c=Bat.cfg||Bat.DEF,s=Bat.inCorso()?Bat.s:null,pers=Avv.online()&&Avv.eroiElenco().length;
  const cont=s?`<button class="av-card av-cont" data-a="batcont"><span class="av-tx"><b>Battaglia in corso</b><small>Giro ${s.giro} · ${s.cb.filter(x=>x.lato==='eroi'&&x.hp>0).length} eroi in piedi, ${s.cb.filter(x=>x.lato==='nemici'&&ASCO.inCampo(x)).length} nemici</small></span><span class="av-go">Continua</span></button>`:'';
  const fam=Object.keys(BEST.FAMIGLIE).map(k=>Bat.chip('batcfg','fam:'+k,esc(BEST.FAMIGLIE[k]),c.fam===k)).join('');
  const dif=Bat.DIFF.map(([k,t])=>Bat.chip('batcfg','diff:'+k,t,c.diff===k)).join('');
  return`<div class="sh2">Battaglia di prova ${infoH('Prova le battaglie a esagoni senza avviare una campagna: scegli i nemici, la difficoltà e la compagnia. Nessun premio e nessun rischio: i tuoi eroi non cambiano.')}</div>${cont}
<div class="bt-cfg"><div class="bt-gr" role="group" aria-label="Nemici">${fam}</div><div class="bt-gr" role="group" aria-label="Difficoltà">${dif}</div>
<div class="bt-gr" role="group" aria-label="Compagnia">${Bat.chip('batcfg','party:prova','Compagnia di prova',c.party==='prova')}${Bat.chip('batcfg','party:conto','I miei eroi',c.party==='conto')}</div>
${c.party==='prova'?`<div class="bt-gr lv" role="group" aria-label="Livello"><span>Livello</span><button class="ib" data-a="batcfg" data-v="liv:-" aria-label="Livello più basso">−</button><b>${c.liv}</b><button class="ib" data-a="batcfg" data-v="liv:+" aria-label="Livello più alto">+</button></div>`:(pers?'':'<small class="muted">Per usare i tuoi eroi serve il profilo online con almeno un eroe.</small>')}
<div class="bt-gr" role="group" aria-label="Reazioni">${Bat.chip('batcfg','rea:chiedi','Reazioni: le scelgo io',c.rea==='chiedi')}${Bat.chip('batcfg','rea:auto','Reazioni automatiche',c.rea==='auto')}</div></div>
<button class="b gold ecta" data-a="batavvia" ${Bat.avviando?'disabled':''}>${ic('spada',18)} Combatti</button>${Bat.msgSetup?`<small class="muted" style="text-align:center" role="status">${esc(Bat.msgSetup)}</small>`:''}`},
 // ---- comandi (data-a="bat…") ----
 chiudiAvv(){Bat.gen++;Bat.pausa=null;Bat.anim=false;Bat.lavoro=false;Bat.foglio=null;ui.bat=false;if(Bat.mondo)ui.camp=true;else ui.avv=true;document.documentElement.classList.remove('bat-on')},
 act(a,v){
  switch(a){
   case'batcfg':{const i=String(v).indexOf(':'),k=String(v).slice(0,i),x=String(v).slice(i+1);
    if(k==='liv')Bat.cfg.liv=Math.max(1,Math.min(8,Bat.cfg.liv+(x==='+'?1:-1)));else if(['fam','diff','party','rea'].includes(k))Bat.cfg[k]=x;
    Bat.salvaCfg();Bat.msgSetup='';return render()}
   case'batavvia':return Bat.avvia();
   case'batmondo':return Camp.fineBattaglia();
   case'batcont':if(!Bat.inCorso())return render();Bat.msgSetup='';ui.avv=false;ui.bat=true;Bat.foglio=null;return render();
   case'batrigioca':if(Bat.mondo)return;Bat.s=null;Bat.salva();ui.bat=false;ui.avv=true;return Bat.avvia();
   case'batesci':if(Bat.s&&Bat.s.over&&!Bat.mondo){Bat.s=null;Bat.salva()}return(Bat.chiudiAvv(),render());
   case'batabbandona':if(Bat.mondo)return;Bat.s=null;Bat.c=null;Bat.log=[];Bat.salva();return(Bat.chiudiAvv(),render());
   case'batvedi':Bat.vedi=!Bat.vedi;return render();
   case'batfoglio':if(Bat.lavoro||Bat.pausa)return;Bat.foglio=Bat.foglio===v?null:v;return render();
   case'batchiudi':Bat.foglio=null;return render();
   case'batlog':Bat.logAperto=!Bat.logAperto;Bat.foglio=null;return render();
   case'batvel':Bat.cfg.vel=v==='2'?2:1;Bat.salvaCfg();return render();
   case'batsalta':Bat.salta=true;return;
   case'batinfox':Bat.c=Object.assign(ACOM.fresco(Bat.c,Bat.s),{info:null});return render();
   case'batinfo':{if(!Bat.s)return;Bat.c=Object.assign(ACOM.fresco(Bat.c,Bat.s),{info:v});Bat.logAperto=false;const c=ASCO.trova(Bat.s,v);
    if(c&&c.q!=null&&(Bat.v.k||1)>1.05){const [x,y]=BatMappa.xy(c.q,c.r);Bat.v.cx=x;Bat.v.cy=y}return render()}
   case'batzoom':{const svg=document.querySelector('.bt-svg');if(!svg||!Bat.s)return;
    if(v==='+')BatMappa.zoom(svg,1.4);else if(v==='-')BatMappa.zoom(svg,1/1.4);
    else{const att=ASCO.attore(Bat.s);if(!att||att.q==null)return;const [x,y]=BatMappa.xy(att.q,att.r);BatMappa.centra(svg,x,y,(Bat.v.k||1)<1.2?1.8:Bat.v.k)}return}
   case'batuso':{if(!Bat.s||Bat.lavoro||Bat.pausa)return;Bat.msg='';const i=String(v).indexOf(':'),k=i<0?String(v):String(v).slice(0,i),id=i<0?'':String(v).slice(i+1);
    const uso=k==='attacca'?{k:'attacca'}:k==='speciale'?{k:'speciale',t:id}:{k,id},r=ACOM.scegli(Bat.c,Bat.s,uso);Bat.c=r.c;Bat.foglio=null;
    if(r.azione)return Bat.umano(r.azione);return render()}
   case'batfine':{if(!Bat.s||Bat.lavoro||Bat.pausa)return;Bat.msg='';const p=ACOM.pannello(Bat.c,Bat.s);
    if(!p.azione&&!p.bonus&&p.pm<=0)return Bat.umano({t:'fine'});
    const r=ACOM.scegli(Bat.c,Bat.s,{k:'speciale',t:'fine'});Bat.c=r.c;return render()}
   case'batconferma':{if(!Bat.s||Bat.lavoro||Bat.pausa)return;const r=ACOM.conferma(Bat.c,Bat.s);Bat.c=r.c;if(r.azione)return Bat.umano(r.azione);return render()}
   case'batannulla':if(!Bat.s||Bat.lavoro)return;Bat.msg='';Bat.c=ACOM.annulla(Bat.c,Bat.s);return render();
   case'batconc':if(!Bat.s||Bat.lavoro||Bat.pausa)return;Bat.c=ACOM.concentrazione(Bat.c,Bat.s);return render();
   case'batrea':{const P=Bat.pausa;if(!P)return;Bat.pausa=null;return Bat.umano(ACOM.rispondi(P.azione,v||null))}}}
};
Bat.carica();Bat.riprendi();
