/* ---- Sessione (Cantari di Ventura, A9): la campagna col racconto, le vite, i salvataggi e il rientro sull'account. ----
   Motori: motori/28a-avv-orchestratore.js (AVV: stato unico, fasi, vite), 28b-avv-rientro.js (ARIE), 28-campagna.js (CAMP), 27q (ARAC). Qui si tengono lo stato di AVV (`Ses.a`), il capitolo (`Ses.cap`),
   i salvataggi (telefono: `avv-a1..a3`; account: `players/{uid}/avventure/a1..a3`) e si decide quale schermata mostrare (`Ses.vai`): mappa (Camp), dialogo (Dia), battaglia (Bat),
   foglio di sconfitta / fine sessione / fine capitolo (`ui.ses`). Mentre una sessione è aperta `Camp.s` è lo specchio di `Ses.a.camp`: Camp, Inv e Dia agiscono sempre tramite `Ses`.
   Un solo comando: data-a="ses" data-v="verbo:argomento". Stile: css/39e-sessione.css (prefisso se-). Piano: docs/AVVENTURA-A9.md. */
const Ses={
 CAP:'corona',SLOT:['a1','a2','a3'],
 a:null,cap:null,slot:null,dia:false,vista:null,righe:[],riep:null,msg:'',occ:false,ult:0,tm:null,pend:null,elenco:{},nuova:null,sel:[],ri:null,conf:null,
 // ---- il capitolo ----
 async carica(id){id=id||Ses.CAP;if(Ses.cap&&Ses.cap.id===id)return Ses.cap;const i=Dia.INDICE[id];if(!i)throw new Error('capitolo mancante');
  const r=await fetch(i.url);if(!r.ok)throw new Error('capitolo non scaricato');return Ses.cap=await r.json()},
 // ---- memoria: telefono e account ----
 lsKey:s=>'avv-'+s,
 locale(slot){try{const j=JSON.parse(localStorage.getItem(Ses.lsKey(slot))||'null');return j&&j.v===1&&j.sal&&typeof j.sal.dati==='string'?j.sal:null}catch(e){ERR.n(e);return null}},
 scriviLocale(){if(!Ses.a||!Ses.slot)return;try{localStorage.setItem(Ses.lsKey(Ses.slot),JSON.stringify({v:1,sal:AVV.salva(Ses.a)}))}catch(e){ERR.n(e)}},
 togliLocale(slot){try{localStorage.removeItem(Ses.lsKey(slot))}catch(e){ERR.n(e)}},
 // sull'account al massimo una volta ogni 12 secondi (le regole ne vogliono 10): se si scrive troppo spesso, resta in attesa solo l'ultimo stato e parte a tempo scaduto
 remoto(a,slot){a=a||Ses.a;slot=slot||Ses.slot;if(!a||!slot||!Avv.online())return;Ses.pend={a,slot};const ms=Date.now()-Ses.ult;
  if(ms<12000){if(!Ses.tm)Ses.tm=setTimeout(Ses.scrivi,12000-ms+150);return}
  Ses.scrivi()},
 scrivi(){clearTimeout(Ses.tm);Ses.tm=null;const p=Ses.pend;Ses.pend=null;if(!p)return;Ses.ult=Date.now();
  FB.salvaAvventura(p.slot,AVV.salva(p.a)).catch(e=>{ERR.n(e,'salvataggio avventura');Ses.ult=0})},
 // l'elenco dei tre posti: il più recente (per numero di azioni) tra telefono e account
 async leggiElenco(){const E={};for(const s of Ses.SLOT){const l=Ses.locale(s);if(l)E[s]={sal:l,locale:true}}
  if(Avv.online()){try{const R=await FB.avventure();for(const s of Ses.SLOT){const d=R[s];if(!d||typeof d.dati!=='string')continue;const l=E[s];if(!l||(d.evn|0)>(l.sal.evn|0))E[s]={sal:d,remoto:true,locale:!!l};else l.remoto=true}}catch(e){console.warn('Ses',e)}}
  return Ses.elenco=E},
 // ---- partire, riprendere, uscire ----
 async parti(){const slot=Ses.nuova;if(!slot||Ses.occ)return;Ses.occ=true;Ses.msg='';render();
  try{const L=await FB.eroi();Eroi.lista=L;const eroi=Ses.sel.map(id=>L[id]&&EROI.coerente(L[id])?{...L[id],slot:id}:null).filter(Boolean).slice(0,CAMP.MAX_EROI);
   if(!eroi.length){Ses.msg='Scegli almeno un eroe.';return}
   await Ses.carica();if(Ses.elenco[slot]&&Ses.elenco[slot].remoto)await FB.eliminaAvventura(slot).catch(e=>ERR.n(e,'posto avventura'));Ses.togliLocale(slot);Ses.pend=null;Ses.ult=0;   // una creazione non ha attesa: le regole contano i 10 secondi solo tra due aggiornamenti
   const seme=(Date.now()^(Math.random()*4294967296))>>>0;   // il seme casuale nasce qui, nella vista: i motori non lanciano dadi da soli
   Ses.a=AVV.nuova(Ses.cap,eroi,seme);Ses.slot=slot;Ses.nuova=null;Ses.avvia(true)}
  catch(e){ERR.n(e);Ses.msg='Non riesco a partire: riprova.'}
  finally{Ses.occ=false;render()}},
 async apri(slot){if(Ses.occ)return;Ses.occ=true;Ses.msg='';render();
  try{const e=Ses.elenco[slot];if(!e)throw new Error('posto vuoto');const r=AVV.apri(e.sal);if(r.err){Ses.msg=r.err;return}
   await Ses.carica(r.s.cap);Ses.a=r.s;Ses.slot=slot;Ses.avvia(false)}
  catch(e){ERR.n(e);Ses.msg='Non riesco a riaprire la campagna: riprova.'}
  finally{Ses.occ=false;render()}},
 async elimina(slot){Ses.conf=null;Ses.togliLocale(slot);if(Ses.pend&&Ses.pend.slot===slot)Ses.pend=null;try{if(Avv.online()&&(Ses.elenco[slot]||{}).remoto)await FB.eliminaAvventura(slot)}catch(e){ERR.n(e,'elimina avventura')}await Ses.leggiElenco();render()},
 avvia(nuova){const a=Ses.a;Camp.s=a.camp;Camp.azzera();Ses.scriviLocale();Ses.remoto();Ses.righe=[];Ses.vista=null;Ses.ri=null;ui.avv=false;ui.eroi=false;
  if(!nuova&&(a.racc.sessioni|0)>0&&!a.racc.scena&&!a.fine)Ses.vista='apertura';
  if(a.fine)Ses.vista='fine';
  Ses.vai(true)},
 esci(){if(Ses.a){Ses.scriviLocale();Ses.remoto()}Ses.a=null;Ses.slot=null;Ses.dia=false;Ses.vista=null;Ses.ri=null;ui.ses=ui.dia=ui.camp=ui.bat=ui.inv=false;Camp.s=null;Camp.riprendi();ui.avv=true;
  Ses.leggiElenco().then(()=>{if(ui.avv)render()});render()},
 // ---- quale schermata: la fase di AVV decide ----
 // `apri` = se la storia ha scene da giocare qui, si apre il foglio del luogo (dopo un arrivo, una scena, una battaglia)
 vai(apri){const a=Ses.a;if(!a)return;const f=AVV.fase(a);ui.camp=ui.dia=ui.bat=ui.inv=false;Ses.dia=false;ui.ses=!!Ses.vista;
  if(f==='dialogo'||(f==='battaglia'&&a.racc.scena)){ui.dia=true;Ses.dia=true;return}
  ui.camp=true;if(apri&&['mappa','citta'].includes(f)&&AVV.vista(a,Ses.cap).scene.length)Camp.u.foglio='luogo'},
 // ---- azioni: tutto passa da AVV.act ----
 fai(az){const a=Ses.a;if(!a)return{err:'Nessuna campagna aperta'};let r;try{r=AVV.act(a,az,Ses.cap)}catch(e){ERR.n(e);r={err:'Azione non riuscita'}}
  if(r.err)return r;AvvAudio.dopo(az,a,r.s);Ses.a=r.s;Camp.s=r.s.camp;Ses.righe=r.righe||[];
  if(r.s.vite<a.vite&&!r.s.fine)Ses.vista='sveglia';if(r.riepilogo){Ses.riep=r.riepilogo;Ses.vista='sessione'}
  if(r.s.fine&&!a.fine){Ses.vista='fine';Ses.premia()}
  Ses.scriviLocale();if(r.cambio||r.riepilogo||r.s.fine)Ses.remoto();return r},
 // le azioni della mappa (Camp.fai e Inv) arrivano qui con lo stesso formato di CAMP.act
 camp(a){const r=Ses.fai({t:'camp',a});return r.err?{err:r.err}:{s:r.s.camp}},
 prova(a){try{return AVV.act(Ses.a,{t:'camp',a},Ses.cap).err||''}catch(e){ERR.n(e);return'Non adesso'}},
 // dopo un'azione della mappa: se la fase è cambiata (un evento di strada, una battaglia) si cambia schermata; arrivati in un luogo con scene, si apre il suo foglio
 dopoCamp(a){Ses.vai(a.t==='muovi')},
 dialogo(verbo,arg){if(verbo==='chiudi')return Ses.esci();const az=verbo==='scegli'?{t:'scegli',i:+arg}:verbo==='continua'?{t:'continua'}:null;if(!az)return;
  const era=!!Ses.a.racc.scena,r=Ses.fai({t:'racconto',a:az});if(r.err){Dia.msg=r.err;return render()}Dia.msg='';
  if(era&&!Ses.a.racc.scena&&!Ses.a.bat&&Ses.righe.length)say(Ses.righe.slice(0,2).join(' · '),3200);Ses.vai(true);render()},
 scena(id){const r=Ses.fai({t:'scena',id});if(r.err){Camp.u.msg=r.err;return render()}Camp.u.msg='';Camp.u.foglio=null;Dia.msg='';Ses.vai(true);render()},
 // la bacheca degli incarichi: legge un'offerta (nuova o in sospeso) e apre il dialogo
 bacheca(){const r=Ses.fai({t:'bacheca'});if(r.err){Camp.u.msg=r.err;return render()}Camp.u.msg='';Camp.u.foglio=null;Dia.msg='';Ses.vai(true);render()},
 parla(id){const r=Ses.fai({t:'parla',id});if(r.err){Camp.u.msg=r.err;return render()}Camp.u.msg='';Camp.u.foglio=null;Dia.msg='';Ses.vai(true);render()},
 compagnia(id,az){const r=Ses.fai({t:'compagnia',id,azione:az});Camp.u.msg=r.err||'';if(!r.err)Ses.vai();render()},
 chiudiSessione(){const r=Ses.fai({t:'chiudi'});if(r.err){Camp.u.msg=r.err;return render()}Camp.u.msg='';Camp.u.foglio=null;Ses.vai();render()},
 // battaglia chiesta dal racconto: la mappa non c'entra, si apre `Bat` con gli stessi eroi; quella del mondo la apre Camp.combatti
 combatti(){const a=Ses.a;if(!a)return;
  if(a.camp.sfida){Ses.dia=false;ui.dia=false;ui.camp=true;return Camp.combatti()}
  if(!a.bat)return;const seme=a.bat.seme;
  if(Bat.mondo===seme&&Bat.s){ui.dia=false;ui.bat=true;Bat.foglio=null;return render()}
  try{Bat.daMondo(AVV.battaglia(a),AVV.quali(a).map(i=>a.camp.eroi[i].aspetto),seme)}catch(e){ERR.n(e);Dia.msg='Non riesco a preparare la battaglia: riprova.';return render()}
  ui.dia=false;ui.camp=false;ui.bat=true;render()},
 fineBattaglia(b){const r=Ses.fai({t:'esito',riep:ASCO.riepilogo(b)});if(r.err){Bat.msg=r.err;return render()}
  Bat.chiudiMondo();Camp.u.dado=null;Camp.u.msg='';Camp.v.cx=Camp.v.cy=null;Ses.vai(true);render()},
 premia(){const a=Ses.a;if(!a||!a.fine||!Avv.online())return;const p=ARIE.premio(a);if(p.monete>0){FB.premiaAvventura(p.monete);Ses.a=ARIE.premiato(a);Camp.s=Ses.a.camp;Ses.scriviLocale()}},
 // ---- rientro sull'account: a tappe, aspettando il minuto che le regole chiedono tra un guadagno e l'altro ----
 async riscuoti(){if(Ses.occ||!Ses.a||!Avv.online())return;Ses.occ=true;clearTimeout(Ses.tm);Ses.tm=null;Ses.pend=null;   // la scrittura del rientro porta già lo stato più recente
  let piano=ARIE.piano(Ses.a);Ses.ri={msg:piano.finito?'Niente da riscuotere.':'Scrivo sul tuo profilo…',tappe:piano.scritture,fatte:0};render();
  try{while(!piano.finito){const L=await FB.eroi(),da=piano.eroi.filter(x=>!x.finito);let nuovo=Ses.a;const tappe=[];
    for(const x of da){const h=L[x.slot];if(!h||!EROI.coerente(h)){nuovo=ARIE.accredita(nuovo,{slot:x.slot,xp:x.pendente.xp,oro:x.pendente.oro});continue}   // l'eroe non c'è più: non si aspetta
     tappe.push({x,h,e:nuovo.camp.eroi.find(q=>q.slot===x.slot)})}
    if(tappe.some(t=>ARIE.guadagna(t.x.tappa))){const agg=Math.max(0,...tappe.map(t=>t.h.agg&&t.h.agg.toMillis?t.h.agg.toMillis():+t.h.agg||0));
     for(let w=ARIE.attesa(agg,Date.now());w>0;w=ARIE.attesa(agg,Date.now())){Ses.ri.msg='Prossima tappa tra '+w+' s…';render();await new Promise(ok=>setTimeout(ok,Math.min(1000,w*1000)))}}
    for(let w=Math.ceil((Ses.ult+12000-Date.now())/1000);w>0;w=Math.ceil((Ses.ult+12000-Date.now())/1000)){Ses.ri.msg='Un attimo, salvo la sessione… '+w+' s';render();await new Promise(ok=>setTimeout(ok,Math.min(1000,w*1000)))}   // anche il salvataggio ha il suo minimo di 10 s
    const scritte=tappe.map(t=>({slot:t.x.slot,h:ARIE.applica(t.h,t.x.tappa,t.e),prima:t.h}));
    for(const t of tappe)nuovo=ARIE.accredita(nuovo,t.x.tappa);
    await FB.rientro(scritte,Ses.slot,AVV.salva(nuovo));Ses.a=nuovo;Camp.s=nuovo.camp;Ses.ult=Date.now();Ses.pend=null;Ses.scriviLocale();Ses.ri.fatte++;
    Eroi.lista=null;piano=ARIE.piano(Ses.a);if(!piano.finito){Ses.ri.msg='Tappa '+Ses.ri.fatte+' di '+Ses.ri.tappe+' fatta.';render()}}
   Ses.ri.msg='Fatto: l\'esperienza, le monete e gli oggetti sono sul tuo profilo.';Ses.premia()}
  catch(e){ERR.n(e,'rientro');Ses.ri.msg='Non riesco a scrivere sul profilo: riprova fra poco.'}
  finally{Ses.occ=false;render()}},
 // ---- pezzi per la mappa ----
 viteH(){const a=Ses.a;return`<span class="se-vite" role="img" aria-label="Vite della compagnia: ${a.vite} su ${a.viteMax}">${Array.from({length:a.viteMax},(_,i)=>`<i class="${i<a.vite?'':'vuota'}">${ic('cuore',14)}</i>`).join('')}</span>`},
 // il foglio del luogo: scene della storia, compagni, fine sessione
 luogoH(){const a=Ses.a,v=AVV.vista(a,Ses.cap);let r='';
  if(v.bacheca&&v.bacheca.visibile)r+=MoPan.riga('Bacheca degli incarichi',esc(v.bacheca.ok?v.bacheca.testo:''),`<button class="b gold" data-a="ses" data-v="bacheca"${v.bacheca.ok?'':' disabled'}>${ic('diario',16)} Leggi</button>`,v.bacheca.ok?'':v.bacheca.perche);
  for(const sc of v.scene)r+=MoPan.riga(esc(sc.titolo),sc.id.indexOf('gen-')===0?'Un incarico che avete accettato.':'Una scena della storia.',`<button class="b gold" data-a="ses" data-v="scena:${esc(sc.id)}">${ic('diario',16)} Vai</button>`);
  const pieno=a.camp.eroi.length>=ACMP.POSTI,citta=v.luogo&&v.luogo.tipo==='citta';
  for(const c of v.compagni){const liv=ACMP.livello(c.approv).nome;
   if(c.stato==='gruppo'&&c.parla)r+=MoPan.riga('Parla con '+esc(c.nome),esc(liv)+' ('+c.approv+')',`<button class="b" data-a="ses" data-v="parla:${esc(c.id)}">Parla</button>`);
   if(citta&&c.stato==='attende')r+=MoPan.riga(esc(c.nome)+' aspetta qui','Si unisce alla compagnia se c\'è un posto (4 in tutto).',`<button class="b" data-a="ses" data-v="compagnia:${esc(c.id)}:entra"${pieno?' disabled':''}>Unisciti</button>`,pieno?'La compagnia è al completo':'');
   if(citta&&c.stato==='gruppo'&&a.camp.eroi.length>1)r+=MoPan.riga(esc(c.nome),'Lo lasci qui ad aspettare.',`<button class="b" data-a="ses" data-v="compagnia:${esc(c.id)}:attende">Resta qui</button>`)}
  return r},
 // il diario della storia: missioni e appunti (la perdizione e la cronaca le aggiunge MoPan.diarioH), poi vite e fine sessione
 diarioH(){const a=Ses.a,cap=Ses.cap,m=a.racc.missioni||{},att=Object.keys(m).filter(id=>m[id].stato==='attiva'&&cap.missioni[id]),fatte=Object.keys(m).filter(id=>m[id].stato==='fatta'&&cap.missioni[id]),
   riga=(id,k)=>`<li class="${k}">${ic(k==='fatto'?'spunta':'bersaglio',16)}<span><b>${esc(cap.missioni[id].titolo)}</b><small>${esc(cap.missioni[id].descr||'')}</small></span></li>`,ap=a.racc.diario||[];
  return`<div class="sh2">${esc(cap.titolo)}</div><ul class="mo-passi">${att.map(id=>riga(id,'ora')).join('')||'<li><span><small>Nessuna missione attiva: parla con chi incontri.</small></span></li>'}${fatte.map(id=>riga(id,'fatto')).join('')}</ul>
${Ses.incarichiH()}
${ap.length?`<div class="sh2">Appunti</div><div class="mo-log">${ap.slice(-6).reverse().map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}`},
 // gli incarichi della bacheca: dove andare, entro quando, che cosa danno
 incarichiH(){const L=AVV.incarichi(Ses.a);if(!L.length)return'';
  const sotto=x=>x.stato==='attiva'?`Per ${x.cliente} · vai a ${x.luogo}${x.entro?`, entro il giorno ${x.entro}`:''} · ${x.premio}`:x.stato==='offerta'?`Offerta di ${x.cliente} a ${x.da}: va ancora accettata`:x.stato==='fatta'?`${x.cliente} · concluso`:`${x.cliente} · scaduto`;
  return`<div class="sh2">Incarichi</div><ul class="mo-passi">${L.map(x=>`<li class="${x.stato==='attiva'?'ora':x.stato==='fatta'?'fatto':''}">${ic(x.stato==='fatta'?'spunta':'bersaglio',16)}<span><b>${esc(x.titolo)}</b><small>${esc(sotto(x))}</small></span></li>`).join('')}</ul>`},
 diarioFondoH(){const f=AVV.fase(Ses.a);
  return`<div class="sh2">Vite della compagnia</div><div class="se-vita">${Ses.viteH()}</div><small class="muted">Una battaglia persa ne costa una: ci si risveglia nell'ultima città con metà dei PF, metà dell'oro in meno e più perdizione. Senza vite la campagna è persa.</small>
<div class="se-bt">${['mappa','citta'].includes(f)?'<button class="b gold" data-a="ses" data-v="chiudi">Concludi la sessione</button>':''}<button class="b" data-a="campx">Esci</button></div>`},
 // sotto i fogli della sessione resta la schermata di gioco (mappa o dialogo)
 sopra(){return(Ses.dia?Dia.html():Camp.html())+Ses.html()},
 // ---- la pagina Avventura: tre posti ----
 portrait(h,px){return`<span class="av-rit">${Eroi.ritratto(h.aspetto,h.razza,h.classe,px)}</span>`},
 sceltaH(slot){const L=Eroi.lista||{},ids=EROI.SLOT_ID.filter(id=>L[id]);
  if(!ids.length)return`<div class="av-card se-slot nuovo"><div class="av-tx"><b>Nuova campagna</b><small>Prima crea un eroe da «Gestisci gli eroi».</small></div><div class="se-bt"><button class="b" data-a="ses" data-v="annulla">Chiudi</button></div></div>`;
  return`<div class="av-card se-slot nuovo"><div class="av-tx"><b>Nuova campagna</b><small>Scegli fino a ${CAMP.MAX_EROI} eroi; i compagni della storia si uniscono lungo la strada.</small></div>
<div class="se-eroi">${ids.map(id=>{const h=L[id],on=Ses.sel.includes(id);return`<button class="se-er${on?' on':''}" data-a="ses" data-v="scegli:${id}" aria-pressed="${on}">${Ses.portrait(h,44)}<b>${esc(h.nome)}</b><small>${esc(EROI.CLASSI[h.classe].nome)} ${h.liv}</small></button>`}).join('')}</div>
<div class="se-bt"><button class="b gold" data-a="ses" data-v="parti"${Ses.sel.length&&!Ses.occ?'':' disabled'}>${ic('spada',16)} Parti</button><button class="b" data-a="ses" data-v="annulla">Annulla</button></div></div>`},
 sezioneH(){if(!Avv.online()||!Dia.INDICE[Ses.CAP])return'';const i=Dia.INDICE[Ses.CAP],E=Ses.elenco;
  let h=`<div class="sh2">${esc(i.titolo)} ${infoH('Tre posti per tre campagne. Ogni sessione si salva da sola, sul telefono e sul tuo profilo; quando concludi, esperienza, monete e oggetti tornano ai tuoi eroi.')}</div>`;
  for(const s of Ses.SLOT){const e=E[s];
   if(Ses.nuova===s){h+=Ses.sceltaH(s);continue}
   if(!e){h+=`<button class="av-card se-slot vuoto" data-a="ses" data-v="nuova:${s}"><span class="av-tx"><b>Posto libero</b><small>Comincia un nuovo cantare</small></span><span class="av-go">Nuova</span></button>`;continue}
   const d=e.sal,fin=d.fine,viti=Array.from({length:d.viteMax||3},(_,k)=>`<i class="${k<d.vite?'':'vuota'}">${ic('cuore',12)}</i>`).join('');
   h+=`<div class="av-card se-slot"><button class="se-go" data-a="ses" data-v="apri:${s}" ${Ses.occ?'disabled':''}><span class="av-tx"><b>${esc((d.eroi||[]).map(x=>x.nome).join(', ')||'Compagnia')}</b><small>${fin?(/^finale/.test(fin)?'Concluso':'Perduto'):'Giorno '+d.giorno+' · cantare '+((d.sessioni|0)+1)}${e.remoto&&!e.locale?' · dal profilo':''}</small></span><span class="se-vite">${viti}</span><span class="av-go">${fin?'Rivedi':'Continua'}</span></button>
${Ses.conf===s?`<div class="se-bt"><small>Eliminare questa campagna?</small><button class="b sm" data-a="ses" data-v="elimina2:${s}">Elimina</button><button class="b sm" data-a="ses" data-v="annulla">No</button></div>`:`<button class="se-x" data-a="ses" data-v="elimina:${s}" aria-label="Elimina la campagna">${ic('x',14)}</button>`}</div>`}
  return h+(Ses.msg?`<small class="no" role="status">${esc(Ses.msg)}</small>`:'')},
 // ---- fogli sopra la mappa: sconfitta, fine sessione, fine del capitolo ----
 riH(){const a=Ses.a,p=ARIE.piano(a);if(!p.eroi.length)return'';const st=Ses.ri;
  const righe=p.eroi.map(x=>`<li><b>${esc(x.nome)}</b> ${x.finito?'<span class="muted">tutto riscosso</span>':[x.pendente.xp?'+'+x.pendente.xp+' PE':'',x.pendente.oro?(x.pendente.oro>0?'+':'−')+Math.abs(x.pendente.oro)+' monete':''].filter(Boolean).join(' · ')}</li>`).join('');
  return`<div class="sh2">Sul profilo dei tuoi eroi</div><ul class="se-ri">${righe}</ul>${p.finito?'':Avv.online()?`<button class="b gold" data-a="ses" data-v="riscuoti"${Ses.occ?' disabled':''}>Riscuota${p.scritture>1?' ('+p.scritture+' tappe)':''}</button>`.replace('Riscuota','Riscuoti'):'<small class="muted">Per riscuotere serve il profilo online.</small>'}${st?`<p class="se-st" role="status">${esc(st.msg)}</p>`:''}`},
 html(){const a=Ses.a,v=Ses.vista;if(!a||!v)return'';const box=(t,corpo,bt)=>`<div class="modal se-modal"><div class="box col se" role="dialog" aria-label="${esc(t)}"><h2>${esc(t)}</h2>${corpo}<div class="se-bt">${bt}</div></div></div>`,d=Ses.occ?' disabled':'';
  if(v==='sveglia'){const l=a.camp.luoghi[a.ultimaCitta];return box('La compagnia è sconfitta',`<p>${esc(Ses.righe[0]||'')}</p><p class="muted">Vi risvegliate a ${esc(l?l.nome:'una città')} con metà dei PF, meno monete e più perdizione.</p><div class="se-vita">${Ses.viteH()}</div>`,'<button class="b gold" data-a="ses" data-v="ok">Rialzati</button>')}
  if(v==='apertura'){const k=ARAC.cantare(AVV.capitolo(a,Ses.cap),a.racc,AVV.ctx(a));return box(k.titolo,`<p class="se-testo">${esc(LOC.apertura({cantare:k}))}</p>${ARIE.piano(a).finito?'':Ses.riH()}`,`<button class="b gold" data-a="ses" data-v="ok"${d}>Si parte</button>`)}
  if(v==='sessione'){const r=Ses.riep||{},k=r.cantare;return box('Per oggi basta così',`<p class="se-testo">${esc(k?LOC.chiusura({cantare:k}):'')}</p><small class="muted">Giorni di viaggio: ${r.giorni|0} · battaglie: ${r.battaglie|0} · monete: ${(r.oro|0)>=0?'+':''}${r.oro|0}</small>${Ses.riH()}`,`<button class="b" data-a="ses" data-v="ok"${d}>Resto qui</button><button class="b gold" data-a="ses" data-v="esci"${d}>Alla taverna</button>`)}
  if(v==='fine'){const f=a.fine||{},nomi=(f.sbloccati||[]).map(id=>(Ses.cap.compagni[id]||{}).nome).filter(Boolean);
   return box(f.titolo||'Il cantare è finito',`<p class="se-testo">${esc(f.testo||'')}</p><small class="muted">${f.vinta?'Giorno '+f.giorni+' · vite rimaste: '+f.vite:'Il cantare finisce qui.'}</small>${nomi.length?`<p><b>Compagni di strada:</b> ${nomi.map(esc).join(', ')}</p>`:''}${f.vinta&&f.monete?`<p><b>Premio:</b> ${f.monete} monete della Taverna${f.premiato?' (già nel borsellino)':''}.</p>`:''}${Ses.riH()}`,`<button class="b gold" data-a="ses" data-v="esci"${d}>Alla taverna</button>`)}
  return''},
 // ---- comandi ----
 act(a,v){if(a!=='ses')return;const i=String(v).indexOf(':'),verbo=i<0?String(v):String(v).slice(0,i),arg=i<0?'':String(v).slice(i+1);
  switch(verbo){
   case'nuova':{Ses.nuova=arg;Ses.msg='';Ses.conf=null;Ses.sel=EROI.SLOT_ID.filter(id=>(Eroi.lista||{})[id]).slice(0,CAMP.MAX_EROI);return render()}
   case'scegli':{const k=Ses.sel.indexOf(arg);if(k>=0)Ses.sel.splice(k,1);else if(Ses.sel.length<CAMP.MAX_EROI)Ses.sel.push(arg);return render()}
   case'annulla':Ses.nuova=null;Ses.conf=null;return render();
   case'parti':return Ses.parti();
   case'apri':return Ses.apri(arg);
   case'elimina':Ses.conf=arg;return render();
   case'elimina2':return Ses.elimina(arg);
   case'scena':return Ses.scena(arg);
   case'parla':return Ses.parla(arg);
   case'bacheca':return Ses.bacheca();
   case'compagnia':{const[id,az]=arg.split(':');return Ses.compagnia(id,az)}
   case'chiudi':return Ses.chiudiSessione();
   case'combatti':return Ses.combatti();
   case'riscuoti':return Ses.riscuoti();
   case'ok':Ses.vista=null;ui.ses=false;Ses.vai(true);return render();
   case'esci':return Ses.esci();}}
};
