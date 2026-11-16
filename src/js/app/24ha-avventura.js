/* ---- Avventura (Cantari di Ventura): la pagina della barra in basso. Continua, nuova campagna, eroi, compagni, regole in breve.
   Piano: docs/AVVENTURA.md. Eroi: app/24g-eroi.js; campagna: app/24h-campagna.js (motore motori/28-campagna.js). ---- */
const Avv={
 msg:'',
 // salvataggio in corso (nessuna campagna finita)
 inCorso(){return!Ses.a&&Camp.s&&!Camp.s.over?Camp.s:null},
 online(){return FB.st==='ok'&&!!FB.p},
 eroiElenco(){const L=Eroi.lista||{};return EROI.SLOT_ID.filter(id=>L[id]).map(id=>({...L[id],slot:id}))},
 COME:[
  ['Mappa del mondo','Trascina per scorrere, pizzica per ingrandire. Ogni eroe tira il suo movimento (un d4 più la velocità, con Concentrazione tiri due dadi e tieni il migliore): poi tocca dove andare e conferma con un secondo tocco. Strada e pianura costano poco, boschi, colli e paludi di più.'],
  ['Compagnia e nemici','Gli eroi possono camminare insieme o separarsi. I gruppi di nemici si vedono a tre esagoni e si muovono a ogni giro: se uno vi raggiunge, parte la battaglia con gli eroi vicini.'],
  ['Giorno, notte, perdizione','Un giorno dura otto giri, gli ultimi tre sono di notte. Dormire in una locanda o a un accampamento fa passare al giorno dopo: la perdizione sale di 3 a ogni alba (a 100 la campagna è persa) e a 25, 50 e 75 il mondo peggiora. Santuari, taglie e covi ripuliti la fanno calare.'],
  ['Luoghi e sotterranei','Città e villaggi hanno locanda, guaritore, bottega; la città anche tempio e bacheca delle taglie. Antri, rovine e la torre sono sotterranei a stanze: ogni stanza costa un giro e l\'ultima è la più dura.'],
  ['Zaino e botteghe','Dal pulsante Zaino vedi cosa indossi e cosa porti, con il confronto prima di equipaggiare. Le botteghe sono in città e nei villaggi (qui solo merce comune) e dai mercanti vaganti; rivendi a metà prezzo. L\'oro è comune a tutta la compagnia.'],
  ['La missione','Il diario (pulsante in alto) dice dove andare: ascolta chi comanda in città, ripulisci l\'antro e abbatti la Torre dei Corvi. Il capo vero compare solo se la compagnia è abbastanza forte.']],
 cartaCont(s){const e=s.eroi.map(h=>`<span class="av-rit${h.hp<=0?' ko':''}">${Eroi.ritratto(h.aspetto,h.razza,h.classe,40)}</span>`).join('');
  return`<button class="av-card av-cont" data-a="avvcontinua"><span class="av-ritt">${e}</span><span class="av-tx"><b>${esc(s.missione.titolo)}</b><small>Giorno ${s.giorno} · perdizione ${s.perdizione}/100 · ${CAMP.vivi(s).length} eroi in piedi</small></span><span class="av-go">Continua</span></button>`},
 // ---- menù (T4): Riprendi, due insegne, schede Partite · Eroi · Guida, foglio del gioco ----
 tab:null,foglio:null,modo:'solo',
 // tutte le partite salvate dei due giochi: [{gioco,posto,titolo,sub,fine,coop,az:[data-a,data-v]}]
 partite(){const L=[],E=Ses.elenco||{};
  for(const s of Ses.SLOT){const e=E[s];if(!e)continue;const d=e.sal,fin=d.fine;
   L.push({gioco:'campagna',posto:s,titolo:(d.eroi||[]).map(x=>x.nome).join(', ')||'Compagnia',fine:!!fin,coop:false,
    sub:(fin?(/^finale/.test(fin)?'Concluso':'Perduto'):'Giorno '+d.giorno+' · cronaca '+((d.sessioni|0)+1))+(Ses.diffDi(d)!=='normale'?' · '+ADIF.di(Ses.diffDi(d)).nome:'')+(e.remoto&&!e.locale?' · dal profilo':''),az:['ses','apri:'+s]})}
  const vs=VenStanza.leggiSalv('solo');if(vs)L.push({gioco:'ventura',posto:'solo',titolo:vs.nome,fine:false,coop:false,sub:'Giorno '+VEN.giorno(vs)+' · '+VEN.uomini(VEN.TU(vs))+' uomini · fama '+vs.fama,az:['ven','continua']});
  const vc=VenStanza.leggiSalv('coop');if(vc)L.push({gioco:'ventura',posto:'coop',titolo:vc.w.nome,fine:false,coop:true,sub:'In compagnia · giorno '+VEN.giorno(vc.w),az:['ven','dasolo']});
  const lib=Avv.inCorso();if(lib)L.push({gioco:'libera',posto:'libera',titolo:lib.missione.titolo,fine:false,coop:false,sub:'Giorno '+lib.giorno+' · perdizione '+lib.perdizione+'/100',az:['avvcontinua','']});
  return L},
 NOMEG:{campagna:'Cronache del Crocevia',ventura:'Compagnia di ventura',libera:'Campagna libera'},
 riprendiH(L){const r=L.find(x=>!x.fine&&!x.coop);if(!r)return'';
  return`<button class="av2-ripr" data-a="${r.az[0]}"${r.az[1]?` data-v="${r.az[1]}"`:''}${r.gioco==='campagna'&&Ses.occ?' disabled':''}><span class="av2-k">Riprendi · ${esc(Avv.NOMEG[r.gioco])}</span><b>${esc(r.titolo)}</b><small>${esc(r.sub)}</small><span class="av2-go">Continua</span></button>`},
 insegneH(){const ins=(k,t,x,ic2)=>`<button class="av2-ins av2-${k}" data-a="avvfoglio" data-v="${k}"><span class="av2-ill" aria-hidden="true">${ic(ic2,34)}</span><b>${t}</b><small>${x}</small></button>`;
  return`<div class="av2-insegne">${ins('campagna','La campagna a capitoli','Storia, eroi, scelte a voto: una cronaca alla volta.','libro')}${ins('ventura','La compagnia di ventura','Mondo libero, truppe e battaglie campali.','spada')}</div>`},
 tabsH(L){const t=Avv.tab||(Avv.caricando||L.length?'partite':'guida');
  return`<div class="av2-tabs" role="tablist">${[['partite','Partite'],['eroi','Eroi'],['guida','Guida']].map(([k,n])=>`<button type="button" role="tab" aria-selected="${k===t}" class="${k===t?'on':''}" data-a="avvtab" data-v="${k}">${n}</button>`).join('')}</div><div class="av2-pane">${Avv.paneH(t,L)}</div>`},
 paneH(t,L){
  if(t==='partite'){if(Avv.caricando)return'<div class="avv-vuoto" style="height:132px" aria-hidden="true"></div>';
   if(!L.length)return'<p class="muted" style="margin:0">Nessuna partita salvata: scegli un gioco qui sopra per cominciare.</p>';
   return L.map(x=>{const campagna=x.gioco==='campagna',conf=campagna&&Ses.conf===x.posto;
    return`<div class="av-card se-slot av2-par"><button class="se-go" data-a="${x.az[0]}"${x.az[1]?` data-v="${x.az[1]}"`:''}${campagna&&Ses.occ?' disabled':''}><span class="av-tx"><b>${esc(x.titolo)}</b><small>${esc(Avv.NOMEG[x.gioco])} · ${esc(x.sub)}</small></span><span class="av-go">${x.fine?'Rivedi':'Continua'}</span></button>${campagna?(conf?`<div class="se-bt"><small>Eliminare questa campagna?</small><button class="b sm" data-a="ses" data-v="elimina2:${x.posto}">Elimina</button><button class="b sm" data-a="ses" data-v="annulla">No</button></div>`:`<button class="se-x" data-a="ses" data-v="elimina:${x.posto}" aria-label="Elimina la campagna">${ic('x',14)}</button>`):''}</div>`}).join('')+(Ses.msg?`<small class="no" role="status">${esc(Ses.msg)}</small>`:'')}
  if(t==='eroi'){const lista=Avv.eroiElenco(),on=Avv.online(),pochi=!lista.length,pend=lista.filter(h=>APOT.daScegliere(h).length);
   if(!on)return'<p class="muted" style="margin:0">Per creare e salvare gli eroi serve il profilo online.</p><button class="b gold ecta" data-a="acc">Accedi per giocare</button>';
   if(Avv.caricando)return'<div class="avv-vuoto" style="height:84px" aria-hidden="true"></div>';
   return`${lista.length?`<div class="av-ritt big">${lista.map(h=>`<span class="av-rit" title="${esc(h.nome)}">${Eroi.ritratto(h.aspetto,h.razza,h.classe,52)}</span>`).join('')}</div>
<small class="muted">${lista.map(h=>esc(h.nome)+' · '+esc(EROI.CLASSI[h.classe].nome)+' '+h.liv).join(' — ')}</small>${pend.length?`<small class="muted"><b>Scelte di livello in attesa:</b> ${pend.map(h=>esc(h.nome)).join(', ')}. Falle da «Gestisci gli eroi».</small>`:''}`:'<p class="muted" style="margin:0">Nessun eroe: creane uno per partire.</p>'}
<button class="b ${pochi?'gold ':''}sm" data-a="eroi">${pochi?'Crea il tuo primo eroe':'Gestisci gli eroi'}</button>`}
  return`<div class="av-come">${Avv.COME.map(([k,x])=>`<div><b>${esc(k)}</b> ${infoH(esc(x))}</div>`).join('')}</div>${AvvTut.pagH()}
<details class="av2-prove"${Avv.prove?' open':''}><summary data-a="avvprove">Prove</summary>${Avv.liberaH()}${Bat.setupH()}${Dia.setupH()}${Scena3D.impostaH()}</details>`},
 liberaH(){const on=Avv.online(),s=Avv.inCorso(),pochi=Avv.eroiElenco().length<1;return on?`<button class="b sm ecta" data-a="avvnuova" ${pochi&&Eroi.lista?'disabled':''}>${ic('spada',18)} ${s?'Nuova campagna libera':'Parti in campagna libera'}</button>`:''},
 // foglio del gioco scelto: Nuova partita, Carica, Da solo / Con la stanza
 foglioH(){const f=Avv.foglio;if(!f)return'';const stanza=!!R.on,nm=stanza?members().map(m=>esc(m.name||'?')).join(', '):'';
  const modo=stanza?Avv.modo:'solo',on=Avv.online(),camp=f==='campagna';
  const sw=`<div class="av2-modo" role="radiogroup" aria-label="Come giochi"><button type="button" role="radio" aria-checked="${modo==='solo'}" class="${modo==='solo'?'on':''}" data-a="avvmodo" data-v="solo">Da solo</button><button type="button" role="radio" aria-checked="${modo==='stanza'}" class="${modo==='stanza'?'on':''}" data-a="avvmodo" data-v="stanza"${stanza?'':' disabled'}>Con la stanza</button></div>${stanza?`<small class="muted">In stanza: ${nm}</small>`:'<small class="muted">Per giocare in compagnia apri o entra in una stanza dalla Taverna.</small>'}`;
  let nuova;
  if(camp){
   if(!on)nuova='<button class="b gold ecta" data-a="acc">Accedi per giocare</button>';
   else if(modo==='stanza')nuova=`<button class="b gold ecta" data-a="avt" data-v="parti"${AvvStanza.occ?' disabled':''}>${ic('spada',18)} Comincia una cronaca in compagnia</button>${AvvStanza.msg&&ui.avv?`<small class="muted" role="status">${esc(AvvStanza.msg)}</small>`:''}`;
   else if(Ses.nuova)nuova=Ses.sceltaH(Ses.nuova);
   else{const lib=Ses.SLOT.find(s=>!(Ses.elenco||{})[s]);nuova=lib?`<button class="b gold ecta" data-a="ses" data-v="nuova:${lib}">${ic('spada',18)} Nuova partita</button>`:'<small class="muted">I tre posti sono pieni: elimina una partita dalla scheda Partite.</small>'}}
  else nuova=modo==='stanza'?`<button class="b gold ecta" data-a="avvstanza" data-v="ventura">${ic('spada',18)} Comincia in compagnia</button>`:Ven.nuovaH();
  const salvati=Avv.partite().some(x=>camp?x.gioco==='campagna':x.gioco==='ventura');
  return`<div class="av2-foglio" role="dialog" aria-label="${camp?'La campagna a capitoli':'La compagnia di ventura'}"><div class="av2-fbox"><div class="av2-fh"><h3>${camp?'La campagna a capitoli':'La compagnia di ventura'}</h3><button class="se-x" data-a="avvfoglio" data-v="" aria-label="Chiudi">${ic('x',14)}</button></div>
<p class="muted" style="margin:0">${camp?'Il Locandiere racconta, voi decidete: eroi tuoi, scelte a voto, una cronaca alla volta.':'Un mondo libero: tre regni in guerra, villaggi dove reclutare, città dove commerciare, castelli da prendere.'}</p>${sw}${nuova}
<button class="b sm" data-a="avvfoglio" data-v="carica"${salvati?'':' disabled'}>Carica una partita salvata</button></div></div>`},
 html(){const L=Avv.partite();
  return`<div class="modal" data-sc><div class="box col av"><h2>Avventura ${infoH('Due giochi: la campagna a capitoli (Cronache del Crocevia) e la compagnia di ventura. Qui riprendi, cominci, gestisci gli eroi e leggi la guida.')}</h2>
${Avv.riprendiH(L)}${Avv.insegneH()}${Avv.tabsH(L)}<p class="acc-msg" role="status">${esc(Avv.msg)}</p></div>${Avv.foglioH()}</div>`},
 async act(a,v){
  if(a==='avv'){Plancia.chiudi();ui.avv=true;Avv.msg='';Avv.foglio=null;Avv.tab=null;Ses.nuova=Ses.conf=null;
   // scheletro subito (altezze fisse), poi un solo ridisegno quando eroi e salvataggi sono arrivati insieme
   Avv.caricando=Avv.online()&&(!Eroi.lista||!Ses.elenco);render();
   if(Avv.online()){try{await Promise.all([Eroi.lista?null:Eroi.carica(),Ses.leggiElenco()])}catch(e){ERR.n(e,'avventura')}}
   Avv.caricando=false;if(ui.avv)render();return}
  if(a==='avvx'){ui.avv=false;return render()}
  if(a==='avvprove'){Avv.prove=!Avv.prove;return render()}
  if(a==='avvtab'){Avv.tab=v;return render()}
  if(a==='avvfoglio'){if(v==='carica'){Avv.tab='partite';Avv.foglio=null}else Avv.foglio=v||null;Ses.nuova=Ses.conf=null;return render()}
  if(a==='avvmodo'){Avv.modo=v;return render()}
  if(a==='avvstanza'){Avv.foglio=null;ui.avv=false;try{await startGame('ventura')}catch(e){ERR.n(e,'ventura stanza');ui.avv=true}return render()}
  if(a==='avvcontinua'){if(!Avv.inCorso())return render();ui.avv=false;ui.camp=true;return render()}
  if(a==='avvnuova'){if(Avv.busy)return;Avv.busy=true;Avv.msg='';render();
   try{await Camp.parti();if(Camp.msg){Avv.msg=Camp.msg;Camp.msg=''}else{ui.avv=false;ui.camp=true}}
   catch(e){console.warn('Avv',e);Avv.msg='Non riesco a leggere i tuoi eroi: riprova.'}
   finally{Avv.busy=false;render()}return}}};
