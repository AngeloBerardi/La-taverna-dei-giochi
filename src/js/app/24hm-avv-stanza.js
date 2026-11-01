/* ---- Avventura in compagnia (A11): il tramite tra la stanza live e le viste dell'Avventura. ----
   Motore: motori/28e-avv-stanza.js (AST: posti, permessi, voto, battaglia condivisa, arruolamento, rientro). Qui la stanza è una partita come le altre: `ENG.avventura`, `VIEW.avventura`, `FX.avventura`
   (registri in 07-nucleo e 23). Lo stato `G` ha `av` (la sessione di AVV) e `lotta` (la battaglia). Le schermate di A5–A9 (Camp, Dia, Bat, Ses, Inv) restano quelle: `sync()` ne specchia lo stato
   da `G` (Ses.a, Camp.s, Bat.s, quale schermata) e le loro azioni passano da qui come mosse (`manda`): le guardie di una riga `if(inAvv())return AvvStanza.xxx()` stanno in Ses.fai/dialogo/combatti/
   fineBattaglia/esci/riscuoti, Camp.combatti e Bat.umano/avanza/salva. La battaglia viaggia come `film` (le azioni da rigiocare): `FX.avventura` le anima su `Bat.gioca`, uguale su ogni telefono.
   Sulla TV (`ui.tv`, sola visione) è tutto in lettura: gli stessi fogli, ingranditi (css/39g-stanza.css, prefisso avt-). Un solo comando: data-a="avt" data-v="verbo:argomento". Piano: docs/AVVENTURA-A11.md. */
const AvvStanza={
 pre:null,rip:null,seme0:null,g:null,anim:false,riepVisto:0,fineVisto:'',premiato:'',salvato:'',apertoGid:'',sh:null,eroi:null,occ:false,ri:null,msg:'',slot:null,pr:0,sosp:null,tm:0,caricando:false,
 // ---- dove siamo ----
 on(){return!!(G&&G.g==='avventura')},
 seat(){return AvvStanza.on()&&!ui.tv?viewer():-1},
 v(){return AST.vista(G,Ses.cap,AvvStanza.seat())},
 ritr(e,px){return e&&e.razza?`<span class="avt-rit">${Eroi.ritratto(e.aspetto,e.razza,e.classe,px)}</span>`:''},
 // il capitolo serve a chiunque entri in una stanza già in corso (telefoni e TV): si scarica una volta
 caricaCap(){if(Ses.cap||AvvStanza.caricando||!G||!G.av)return;AvvStanza.caricando=true;
  Ses.carica(G.av.cap).catch(e=>{ERR.n(e);AvvStanza.msg='Il capitolo non si scarica: riprova più tardi.'}).finally(()=>{AvvStanza.caricando=false;render()})},
 // ---- partire ----
 // prima di creare la partita: capitolo, seme, e l'eroe di chi la avvia (gli altri lo portano dal tavolo). `rip` = un salvataggio da riprendere
 async prepara(S){await Ses.carica();const seme=AvvStanza.seme0!=null?AvvStanza.seme0:(Date.now()^(Math.random()*4294967296))>>>0;   // seme0: solo per le prove del browserlet h=null,slot=null;
  if(Avv.online()&&!AvvStanza.rip){try{const L=await FB.eroi();Eroi.lista=L;AvvStanza.eroi=L;const id=AvvStanza.sc&&L[AvvStanza.sc]&&EROI.coerente(L[AvvStanza.sc])?AvvStanza.sc:EROI.SLOT_ID.find(i=>L[i]&&EROI.coerente(L[i]));if(id){h=L[id];slot=id}}catch(e){ERR.n(e)}}
  AvvStanza.pre={seme,rip:AvvStanza.rip,posti:S.map(x=>{const io=x.dev===ME.dev&&x.k==='m';return{nome:x.name,uid:x.uid||null,ospite:x.k!=='m',eroe:io&&h?JSON.parse(JSON.stringify(h)):null,slot:io?slot:null}})}},
 nuova(n,names,o){const p=AvvStanza.pre;AvvStanza.pre=null;AvvStanza.rip=null;if(!p||!Ses.cap)throw new Error('Cantari di Ventura: capitolo non pronto');
  if(p.rip){const r=AST.apri(p.rip,p.posti);if(r.err)throw new Error(r.err);return r.s}
  return AST.nuova(Ses.cap,p.posti,p.seme,{difficolta:Ses.diff})},
 // ---- mosse ----
 // La mossa si calcola qui (la vista ha subito la risposta o l'errore), poi parte come per ogni gioco di stanza (SYNC.mossa: atomica, `rev`); se un altro telefono è passato prima ci si riallinea.
 manda(a){if(!AvvStanza.on())return{err:'Nessuna partita'};if(ui.tv)return{err:'La TV guarda soltanto'};const seat=viewer();if(seat<0)return{err:'Non sei seduto a questo tavolo'};a.seat=seat;let r;
  try{r=AST.act(G,a,Ses.cap)}catch(e){ERR.n(e);return{err:'Mossa non riuscita'}}
  if(r.err){Snd.play('err');return r}
  AvvStanza.applica(r.s);const ns=r.s,base=R.grev!=null?R.grev:R.rev,gid=G.gid;
  if(!R.on){pushState(ns,true);saveOff(ns);return r}
  R.rev=Math.max(R.rev,base+1);pushState(ns,true,base+1);
  SYNC.esegui(R.ref,cur=>SYNC.mossa(cur,{base,gid,a,s:ns},ENG)).then(e=>{if(e.err){ui.err=e.code==='conflitto'||e.code==='regola'&&/un attimo prima/.test(e.err)?'Un altro telefono ha mosso un attimo prima: riprova.':e.err;return risincronizza()}})
   .catch(e=>{ui.err='Mossa non inviata: '+netErr(e);return risincronizza()}).finally(()=>render());
  return r},
 // Ses.fai in stanza: stessa risposta di AVV.act (r.s = lo stato di AVV dopo l'azione)
 fai(az){const a=Ses.a;if(!a)return{err:'Nessuna campagna aperta'};const r=AvvStanza.manda({t:'av',az,base:a.evn});if(r.err)return r;
  AvvAudio.dopo(az,a,r.s.av);Ses.righe=r.righe||[];return{s:r.s.av,righe:r.righe||[],cambio:r.cambio,riepilogo:r.riepilogo}},
 dialogo(verbo,arg){if(verbo==='chiudi')return AvvStanza.apri('tavolo');const base=G.av.evn;let r;
  if(verbo==='scegli')r=AvvStanza.manda({t:'voto',i:+arg,base});else if(verbo==='continua')r=AvvStanza.manda({t:'av',az:{t:'racconto',a:{t:'continua'}},base});else return;
  Dia.msg=r.err||'';render()},
 combatti(){const r=AvvStanza.manda({t:'combatti',base:G.av.evn});if(r.err){Dia.msg=r.err;Camp.u.msg=r.err}render()},
 // un'azione della battaglia (dal tocco o dai pulsanti): `Bat.umano` arriva qui; l'animazione la fa FX.avventura quando lo stato torna
 lotta(a){const l=G.lotta;if(!l)return;const r=AvvStanza.manda({t:'lotta',a,base:l.evn});if(r.err){Bat.msg=r.err;if(Bat.s)Bat.c=ACOM.nuovo(Bat.s)}render()},
 chiudiLotta(){const r=AvvStanza.manda({t:'chiudiLotta'});if(r.err){Bat.msg=r.err}render()},
 puoBat(){if(ui.tv||!G||!G.lotta||G.lotta.over)return false;return AvvStanza.v().lotta.mioTurno},
 // ---- lo specchio: dallo stato di stanza alle schermate di A5–A9 ----
 schermo(s){const f=AVV.fase(s.av);return s.lotta?'bat':(f==='dialogo'||(f==='battaglia'&&s.av.racc.scena))?'dia':'camp'},
 // `applica(ns)` rispecchia uno stato (anche quello calcolato in locale, prima che torni dalla stanza); la battaglia si allinea a parte (`allinea`), perché ha il suo film
 applica(ns){const prima=AvvStanza.g,stessa=prima&&prima.gid===ns.gid;if(stessa&&ns.evn<prima.evn)return;AvvStanza.g=ns;
  const av=ns.av,nuova=!stessa;Ses.a=av;Ses.slot=AvvStanza.slot;Camp.s=av.camp;Ses.righe=ns.righe||[];
  if(nuova){Camp.azzera();if(ui.tv)Camp.v.k=1.3;Dia.rev={k:'',n:0,fatto:false};AvvStanza.riepVisto=0;AvvStanza.fineVisto='';AvvStanza.sh=null;AvvStanza.salvato='';AvvStanza.ri=null;AvvStanza.msg='';
   const k=AST.vista(ns,Ses.cap,ui.tv?-1:viewer()).mioEroe;if(k>=0)Camp.u.sel=k}
  // fogli: sconfitta, fine sessione, fine del capitolo (una volta sola ciascuno)
  if(av.fine){if(AvvStanza.fineVisto!==ns.gid){AvvStanza.fineVisto=ns.gid;Ses.vista='fine';AvvStanza.premia(ns)}}
  else if(ns.riep&&ns.riep.n!==AvvStanza.riepVisto){AvvStanza.riepVisto=ns.riep.n;Ses.riep=ns.riep;Ses.vista='sessione'}
  else if(stessa&&av.vite<prima.av.vite)Ses.vista='sveglia';
  if(stessa&&prima.av.racc.scena&&!av.racc.scena&&!ns.lotta&&(ns.righe||[]).length&&!ui.tv){const t=ns.righe.slice(0,2).join(' · ');setTimeout(()=>say(t,3200),0)}
  ui.ses=!!Ses.vista;
  // la schermata: la fase decide (mappa, dialogo, battaglia); lo zaino resta aperto sopra la mappa
  const ora=ui.bat?'bat':ui.dia?'dia':(ui.camp||ui.inv)?'camp':null,vol=AvvStanza.schermo(ns);
  if(ora!==vol){ui.camp=vol==='camp';ui.dia=vol==='dia';ui.bat=vol==='bat';ui.inv=false;ui.avv=ui.eroi=false;Ses.dia=vol==='dia';if(vol==='camp'&&stessa&&prima.lotta&&!ns.lotta)Camp.v.cx=Camp.v.cy=null}
  else Ses.dia=vol==='dia';
  const v=AST.vista(ns,Ses.cap,ui.tv?-1:viewer());
  if(v.pre&&AvvStanza.apertoGid!==ns.gid&&!ui.tv&&ns.n>1){AvvStanza.apertoGid=ns.gid;AvvStanza.sh='tavolo';setTimeout(()=>AvvStanza.carEroi(),0)}},
 // la battaglia di stanza: uguale a `G.lotta` su ogni telefono (nessuna mossa fuori dal film)
 allinea(){const key='stanza:'+G.gid;
  if(G.lotta){if(AvvStanza.anim)return;if(!Bat.s||Bat.mondo!==key||Bat.s.evn!==G.lotta.evn){const av=G.av;Bat.daMondo(JSON.parse(JSON.stringify(G.lotta)),AVV.quali(av).map(i=>av.camp.eroi[i].aspetto),key)}}
  else if(Bat.mondo&&String(Bat.mondo).startsWith('stanza:')){Bat.gen++;Bat.s=null;Bat.c=null;Bat.mondo=null;Bat.log=[];Bat.pausa=null;Bat.anim=false;Bat.lavoro=false;Bat.foglio=null}},
 sync(forza){if(!AvvStanza.on()||!Ses.cap)return;const g=AvvStanza.g;if(forza||!g||g!==G)AvvStanza.applica(G);AvvStanza.allinea()},
 // il film della battaglia: lo stato di prima + le azioni giocate (la mossa e le risposte dell'IA); si rigioca passo per passo, uguale per tutti
 async pre(prev,ns,own){const f=ns.film,ok=!!(f&&f.azioni&&f.azioni.length&&prev&&prev.gid===ns.gid&&prev.lotta&&f.da===prev.lotta.evn&&ui.bat&&Bat.s&&Bat.s.evn===f.da&&!document.hidden);
  AvvStanza.anim=ok;return{film:ok?f.azioni:null}},
 async run(prev,ns,own,cx){try{if(cx&&cx.film){Bat.salta=false;for(const a of cx.film){if(!AvvStanza.on()||!Bat.s||!ui.bat)break;if(await Bat.gioca(a)===false)break}}}
  catch(e){ERR.n(e)}finally{AvvStanza.anim=false;AvvStanza.sync(true);render()}},
 // dopo ogni disegno: classi della pagina, presenza di chi è al tavolo, salvataggio della campagna
 dopo(){const on=AvvStanza.on()&&ui.screen==='game',d=document.documentElement.classList;d.toggle('avt-on',on);d.toggle('avt-str',on&&!!G.av&&(G.n>1||ui.tv));if(!on||!G.av)return;AvvStanza.salvaAuto();
  // la presenza cambia fuori dai disegni (nessun render): la si guarda a intervalli, finché si è in partita
  if(!AvvStanza.tm)AvvStanza.tm=setInterval(()=>{if(AvvStanza.on()&&ui.screen==='game'&&G.av)AvvStanza.vigila();else{clearInterval(AvvStanza.tm);AvvStanza.tm=0}},1500)},
 // chi sparisce dalla stanza resta al suo posto con `qui:false` (il suo eroe lo guida chi ospita e in battaglia gioca l'IA); chi torna riprende il suo eroe. Solo dopo qualche secondo di certezza.
 vigila(){if(ui.tv||R.mode!=='rt'||!R.code||!RT.on)return;const h=RT.here&&RT.here[R.code];if(!h)return;const k=viewer();if(k<0)return;const S=seatsNow();let m=null;   // la presenza è quella del database (RT.here): durante la partita R.members tiene i seduti anche se sono fuori
  for(let i=0;i<G.n;i++){const dev=(S[i]||{}).dev,qui=!!dev&&(dev===ME.dev||h.has(dev));if(qui!==G.posti[i].qui&&(i===k||G.posti[k].qui)){m={t:'presenza',posto:i,qui};break}}
  if(!m){AvvStanza.sosp=null;return}const chiave=m.posto+':'+m.qui,ora=Date.now();
  if(!AvvStanza.sosp||AvvStanza.sosp.k!==chiave){AvvStanza.sosp={k:chiave,t:ora};return}
  if(ora-AvvStanza.sosp.t<3000||AvvStanza.pr>ora)return;AvvStanza.pr=ora+2500+700*k;AvvStanza.sosp=null;
  setTimeout(()=>{if(AvvStanza.on()&&G.posti[m.posto]&&!!G.posti[m.posto].qui!==m.qui){const r=AvvStanza.manda(m);if(r.err)console.warn('presenza',r.err)}},300*k)},
 // ---- salvare la campagna condivisa: sul profilo di chi ospita, a ogni fine sessione e a fine capitolo ----
 salvaAuto(){if(ui.tv||!Avv.online()||!(G.av.fine||G.riep))return;if(AST.host(G)!==viewer())return;const k=G.gid+':'+(G.av.fine?'fine':G.riep.n);if(AvvStanza.salvato===k)return;AvvStanza.salvato=k;AvvStanza.salva()},
 async salva(){try{await Ses.leggiElenco();let s=AvvStanza.slot;if(!s||(Ses.elenco[s]&&Ses.elenco[s].remoto&&false))s=Ses.SLOT.find(x=>!Ses.elenco[x]);
   if(!s){AvvStanza.msg='La campagna non è salvata: i tre posti sono pieni (eliminane uno dalla pagina Avventura).';return render()}
   AvvStanza.slot=s;Ses.slot=s;Ses.a=G.av;Ses.scriviLocale();await FB.salvaAvventura(s,AVV.salva(G.av));AvvStanza.msg='Campagna salvata sul tuo profilo.';render()}
  catch(e){ERR.n(e,'salvataggio campagna di stanza');AvvStanza.msg='Non riesco a salvare la campagna sul profilo.';render()}},
 // il premio della fine del capitolo, una volta per telefono
 premia(ns){if(ui.tv||!Avv.online()||AvvStanza.premiato===ns.gid)return;const p=ARIE.premio(ns.av);if(p.monete>0){AvvStanza.premiato=ns.gid;FB.premiaAvventura(p.monete)}},
 // ---- rientro sull'account: solo il proprio eroe, a tappe, come in A9 ----
 slotDi(L,e,hint){const ok=id=>{const h=L[id];return h&&EROI.coerente(h)&&h.razza===e.razza&&h.classe===e.classe&&JSON.stringify(h.aspetto)===JSON.stringify(e.aspetto)&&JSON.stringify(h.base)===JSON.stringify(e.base)};
  return(hint&&ok(hint)?hint:Object.keys(L||{}).find(ok))||null},
 async riscuoti(){const k=AvvStanza.seat();if(AvvStanza.occ||k<0||!Avv.online())return;AvvStanza.occ=true;AvvStanza.ri={msg:'Scrivo sul tuo profilo…'};render();
  try{let r=AST.rientro(G,k),n=0;if(!r||r.finito){AvvStanza.ri.msg='Niente da riscuotere.';return}
   while(r&&!r.finito&&n<20){const L=await FB.eroi(),e=G.av.camp.eroi.find(q=>q.slot===r.slot),id=AvvStanza.slotDi(L,e,r.slotAccount);
    if(!id){AvvStanza.ri.msg='Il tuo eroe non è più sul profilo: non c\'è dove riscuotere.';return}
    const h=L[id],agg=h.agg&&h.agg.toMillis?h.agg.toMillis():+h.agg||0;
    if(ARIE.guadagna(r.tappa)){for(let w=ARIE.attesa(agg,Date.now());w>0;w=ARIE.attesa(agg,Date.now())){AvvStanza.ri.msg='Prossima tappa tra '+w+' s…';render();await new Promise(ok=>setTimeout(ok,Math.min(1000,w*1000)))}}
    await FB.rientroEroi([{slot:id,h:ARIE.applica(h,r.tappa,e),prima:h}]);
    const m=AvvStanza.manda({t:'conto',tappa:{slot:r.slot,xp:r.tappa.xp,oro:r.tappa.oro}});if(m.err){AvvStanza.ri.msg='Scritto sul profilo, ma non riesco a segnarlo: '+m.err;return}
    Eroi.lista=null;n++;r=AST.rientro(m.s,k);if(r&&!r.finito){AvvStanza.ri.msg='Tappa '+n+' fatta.';render()}}
   AvvStanza.ri.msg='Fatto: l\'esperienza, le monete e gli oggetti del tuo eroe sono sul profilo.'}
  catch(e){ERR.n(e,'rientro di stanza');AvvStanza.ri.msg='Non riesco a scrivere sul profilo: riprova fra poco.'}
  finally{AvvStanza.occ=false;render()}},
 // ---- uscire ----
 esci(){if(G&&G.av&&G.av.fine)return AvvStanza.alza();AvvStanza.apri('esci')},
 async alza(){AvvStanza.sh=null;ui.ses=false;Ses.vista=null;await toLobby()},
 apri(k){AvvStanza.sh=k||null;if(k==='tavolo'||k==='eroe')AvvStanza.carEroi();render()},
 // gli eroi del mio profilo (per arruolarsi): una lettura, poi in memoria
 carEroi(){if(AvvStanza.eroi||!Avv.online()||AvvStanza.occ)return;AvvStanza.occ=true;FB.eroi().then(L=>{AvvStanza.eroi=L;Eroi.lista=L}).catch(e=>ERR.n(e)).finally(()=>{AvvStanza.occ=false;render()})},
 // ---- disegno ----
 html(){if(!G||!G.av)return'';if(!Ses.cap){AvvStanza.caricaCap();return`${hudH(GN('avventura'))}<p class="muted avt-att" role="status">${esc(AvvStanza.msg||'Apro il capitolo…')}</p>${rulesH()}${cfgH()}`}
  AvvStanza.sync();return`${hudH(GN('avventura'))}${AvvStanza.tavoloH()}${rulesH()}${cfgH()}${AvvStanza.stripH()}${AvvStanza.sheetH()}`},
 // lo sfondo (visibile solo quando nessuna schermata di gioco è aperta): chi c'è al tavolo
 tavoloH(){return`<div class="avt-tavolo"><h2>${esc(GN('avventura'))}</h2>${AvvStanza.postiH()}</div>`},
 stato(i){const s=G.posti[i],e=G.av.camp.eroi[s.eroe],v=AvvStanza.v();return{s,e,mio:!ui.tv&&viewer()===i,qui:s.qui,tocca:!!(v.lotta&&G.lotta&&!G.lotta.over&&(()=>{const a=ASCO.attore(G.lotta);return a&&a.lato==='eroi'&&AST.guidaComb(G,a)===i})()),voto:G.voto&&G.voto.v[i]!=null,host:v.host===i}},
 postiH(){return`<ul class="avt-posti">${G.posti.map((p,i)=>{const x=AvvStanza.stato(i),e=x.e;return`<li class="${x.qui?'':'fuori'}${x.mio?' mio':''}${x.tocca?' tocca':''}">${AvvStanza.ritr(e,44)}<span class="avt-tx"><b>${esc(p.nome)}${x.mio?' (tu)':''}</b><small>${e?esc(e.nome)+' · '+esc(EROI.CLASSI[e.classe].nome)+' '+e.liv+' · '+Math.max(0,e.hp)+'/'+e.hpMax+' PF':''}</small></span><span class="avt-st">${x.qui?(x.host?'Ospita':'Qui'):'Fuori'}${x.tocca?' · tocca a lui':''}</span></li>`}).join('')}</ul>`},
 // la striscia in alto: un tondo per posto (ritratto, presente/fuori, di turno, ha votato); tocco = il tavolo
 stripH(){if(G.n<2&&!ui.tv)return'';return`<div class="avt-strip" role="group" aria-label="Il tavolo">${G.posti.map((p,i)=>{const x=AvvStanza.stato(i);return`<button class="avt-chip${x.qui?'':' fuori'}${x.mio?' mio':''}${x.tocca?' tocca':''}${x.voto?' vota':''}" data-a="avt" data-v="tavolo" aria-label="${esc(p.nome)}${x.mio?' (tu)':''}: ${x.qui?'qui':'fuori'}${x.tocca?', tocca a lui':''}${x.voto?', ha votato':''}">${AvvStanza.ritr(x.e,26)}</button>`}).join('')}</div>`},
 // il voto sulle scelte del dialogo: chi ha votato, chi manca
 votoH(){if(!AvvStanza.on()||G.n<2)return'';const v=G.voto,P=G.posti.map((p,i)=>i).filter(i=>G.posti[i].qui);
  return`<div class="avt-voto" role="status">${v?`Votano: ${P.map(i=>`<span class="${v.v[i]!=null?'si':'no'}">${esc(G.posti[i].nome)}${v.v[i]!=null?' ✓':' …'}</span>`).join(' ')}`:'Si sceglie a maggioranza: ognuno vota col suo telefono.'}${v&&AST.host(G)===(ui.tv?-1:viewer())?`<button class="b sm" data-a="avt" data-v="votaora">Decido io ora</button>`:''}</div>`},
 // un segno sulla scelta: i voti che ha preso
 segno(i){if(!AvvStanza.on()||!G.voto)return'';const L=G.posti.map((p,k)=>G.voto.v[k]===i?`<i title="${esc(p.nome)}">${esc(String(p.nome).slice(0,1).toUpperCase())}</i>`:'').join('');return L?`<span class="avt-vt">${L}</span>`:''},
 // il foglio del tavolo: posti, il mio eroe (prima di partire), uscita
 sheetH(){const k=AvvStanza.sh;if(!k||!G)return'';const v=AvvStanza.v(),d=AvvStanza.occ?' disabled':'';
  const box=(t,corpo,bt)=>`<div class="modal avt-modal"><div class="box col avt" role="dialog" aria-label="${esc(t)}"><h2>${esc(t)}</h2>${corpo}<div class="se-bt">${bt}</div></div></div>`;
  if(k==='esci')return box('Chiudere il cantare?',`<p class="muted">Il cantare si ferma per tutti e si torna alla stanza. Se avevi esperienza o monete da riscuotere, falle tornare sul profilo prima di uscire. La campagna resta salvata sul profilo di chi ospita.</p>`,`<button class="b" data-a="avt" data-v="chiudi">Resta</button><button class="b gold" data-a="avt" data-v="alza"${d}>Torna alla stanza</button>`);
  const mio=v.mioEroe>=0?G.av.camp.eroi[v.mioEroe]:null,L=AvvStanza.eroi,pre=v.pre&&!ui.tv&&viewer()>=0;
  const scelta=pre?`<div class="sh2">Il tuo eroe ${infoH('Prima della prima mossa ognuno porta qui uno dei propri eroi. Chi non ne sceglie uno gioca con un eroe di prova. Quando muovete, la compagnia è chiusa.')}</div>${Avv.online()?(L&&Object.keys(L).length?`<div class="se-eroi">${EROI.SLOT_ID.filter(id=>L[id]&&EROI.coerente(L[id])).map(id=>{const h=L[id],on=mio&&mio.nome===h.nome&&mio.razza===h.razza&&mio.classe===h.classe;return`<button class="se-er${on?' on':''}" data-a="avt" data-v="eroe:${id}" aria-pressed="${!!on}"${d}>${Eroi.ritratto(h.aspetto,h.razza,h.classe,44)}<b>${esc(h.nome)}</b><small>${esc(EROI.CLASSI[h.classe].nome)} ${h.liv}</small></button>`}).join('')}</div>`:AvvStanza.occ?'<small class="muted">Leggo i tuoi eroi…</small>':'<small class="muted">Sul tuo profilo non c\'è ancora nessun eroe: usi quello di prova.</small>'):'<small class="muted">Con il profilo online porti uno dei tuoi eroi; per ora giochi con un eroe di prova.</small>'}`:'';
  const voto=G.voto&&v.sonoHost?`<button class="b sm" data-a="avt" data-v="votaora">Chiudi il voto ora</button>`:'';
  const salva=!ui.tv&&v.sonoHost&&Avv.online()&&(G.riep||G.av.fine)?`<button class="b sm" data-a="avt" data-v="salva"${d}>Salva la campagna sul profilo</button>`:'';
  return box('Il tavolo',`${AvvStanza.postiH()}${scelta}<small class="muted">Chi ospita (il primo posto presente) guida i compagni della storia e ciò che riguarda tutti; ognuno comanda il proprio eroe. ${G.n>1?'Se un telefono esce, il suo eroe lo guida chi ospita.':''}</small>${AvvStanza.msg?`<p class="se-st" role="status">${esc(AvvStanza.msg)}</p>`:''}${voto}${salva}`,`<button class="b" data-a="avt" data-v="esci">Lascia il cantare</button><button class="b gold" data-a="avt" data-v="chiudi">Chiudi</button>`)},
 // il rientro (fogli di fine sessione e fine capitolo): il proprio eroe soltanto
 riH(){const k=AvvStanza.seat(),r=k>=0?AST.rientro(G,k):null;if(!r)return'';const st=AvvStanza.ri,x=r;
  const dett=[x.pendente.xp?'+'+x.pendente.xp+' PE':'',x.pendente.oro?(x.pendente.oro>0?'+':'−')+Math.abs(x.pendente.oro)+' monete':''].filter(Boolean).join(' · ');
  return`<div class="sh2">Sul profilo del tuo eroe</div><ul class="se-ri"><li><b>${esc(x.nome)}</b> ${x.finito?'<span class="muted">tutto riscosso</span>':dett}</li></ul>${x.finito?'':Avv.online()?`<button class="b gold" data-a="ses" data-v="riscuoti"${AvvStanza.occ?' disabled':''}>Riscuoti${x.scritture>1?' ('+x.scritture+' tappe)':''}</button>`:'<small class="muted">Per riscuotere serve il profilo online.</small>'}${st?`<p class="se-st" role="status">${esc(st.msg)}</p>`:''}`},
 // la sezione nella pagina Avventura: partire in compagnia o riprendere una campagna salvata
 sezioneH(){if(!R.on)return'';const on=Avv.online(),E=Ses.elenco||{},salv=Ses.SLOT.filter(s=>E[s]&&!(E[s].sal.fine));
  return`<div class="sh2">In compagnia ${infoH('Una stanza, un eroe a testa: ognuno sul suo telefono comanda il proprio eroe; sulla TV (Impostazioni → Schermo comune) si vede la mappa grande. Le scelte della storia si votano e gli scontri si combattono insieme. I premi tornano a ciascun eroe.')}</div>
<p class="muted" style="margin:0">Chi è nella tua stanza si siede al tavolo: ognuno porta uno dei propri eroi.${on?'':' Senza profilo giocate con eroi di prova.'}</p>
<button class="b gold ecta" data-a="avt" data-v="parti"${AvvStanza.occ?' disabled':''}>${ic('spada',18)} Comincia un cantare in compagnia</button>
${salv.map(s=>{const d=E[s].sal;return`<button class="b sm" data-a="avt" data-v="riprendi:${s}"${AvvStanza.occ?' disabled':''}>Riprendi in compagnia: ${esc((d.eroi||[]).map(x=>x.nome).join(', ')||'Compagnia')} · giorno ${d.giorno}</button>`}).join('')}${AvvStanza.msg&&ui.avv?`<small class="muted" role="status">${esc(AvvStanza.msg)}</small>`:''}`},
 // ---- comandi ----
 async act(a,v){if(a!=='avt')return;const i=String(v).indexOf(':'),verbo=i<0?String(v):String(v).slice(0,i),arg=i<0?'':String(v).slice(i+1);
  switch(verbo){
   case'tavolo':return AvvStanza.apri('tavolo');
   case'chiudi':AvvStanza.sh=null;return render();
   case'esci':return AvvStanza.apri('esci');
   case'alza':return AvvStanza.alza();
   case'eroe':{if(!AvvStanza.eroi||!AvvStanza.eroi[arg])return;const r=AvvStanza.manda({t:'eroe',scheda:AvvStanza.eroi[arg],slot:arg});AvvStanza.msg=r.err||'';return render()}
   case'votaora':{const r=AvvStanza.manda({t:'voto',ora:true,base:G.av.evn});if(r.err)Dia.msg=r.err;return render()}
   case'salva':return AvvStanza.salva();
   case'parti':case'riprendi':{if(AvvStanza.occ)return;AvvStanza.occ=true;AvvStanza.msg='';render();
    try{AvvStanza.rip=null;if(verbo==='riprendi'){const e=Ses.elenco[arg];if(!e)throw new Error('posto vuoto');AvvStanza.rip=e.sal;AvvStanza.slot=arg}else AvvStanza.slot=null;
     ui.avv=false;await startGame('avventura')}
    catch(e){ERR.n(e);AvvStanza.msg='Non riesco ad aprire il cantare: riprova.';ui.avv=true}
    finally{AvvStanza.occ=false;render()}return}}}
};
