/* ---- Suggerimenti al tocco e regole dell'Avventura (A10): la vista di `ATUT` (motori/28d-avv-tutorial.js). ----
   `html(sch)` dà la schedina da mettere dentro la mappa, la battaglia o il dialogo (al massimo una, con «Capito» e «Basta suggerimenti»); `pagH()` sono i comandi della pagina Avventura
   (leggere le regole, suggerimenti sì/no, rivedere); `act` è l'unico comando `data-a="tut"`. I suggerimenti già visti si ricordano sul telefono (`avv-tut`). Prefisso CSS: tut-. */
const AvvTut={
 mem:null,
 carica(){if(AvvTut.mem)return AvvTut.mem;let t=null;try{t=localStorage.getItem('avv-tut')}catch(e){/* niente memoria: si ricomincia ogni volta */}AvvTut.mem=ATUT.leggi(t);return AvvTut.mem},
 salva(){try{localStorage.setItem('avv-tut',ATUT.scrivi(AvvTut.mem||ATUT.vuota()))}catch(e){/* storage non disponibile */}},
 // il contesto della schermata, dallo stato che la vista già ha
 contesto(sch){
  if(sch==='mappa')return ATUT.contesto('mappa',Ses.a,{camp:Camp.s,foglio:!!Camp.u.foglio});
  if(sch==='battaglia')return ATUT.contesto('battaglia',Ses.a,{bat:Bat.s,pronto:!!(Bat.c&&Bat.c.pronto),foglio:!!(Bat.foglio||Bat.pausa)});
  if(sch==='dialogo'){const f=Dia.fonte();return ATUT.contesto('dialogo',Ses.a,{dia:f&&f.s&&f.cap&&f.s.scena?ARAC.vista(f.s,f.cap,f.ctx):null})}
  return{sch}},
 id(sch){try{return ATUT.prossimo(AvvTut.contesto(sch),AvvTut.carica())}catch(e){ERR.n(e);return null}},
 html(sch){const id=AvvTut.id(sch),s=id&&ATUT.trova(id);if(!s)return'';
  return`<div class="tut" role="status" aria-live="polite" data-tut="${s.id}"><b>${esc(s.titolo)}</b><p>${esc(s.testo)}</p><div class="tut-bt"><button class="b sm gold" data-a="tut" data-v="ok:${s.id}">Capito</button><button class="b sm" data-a="tut" data-v="basta">Basta suggerimenti</button></div></div>`},
 // il testo delle regole, da mettere dentro una pagina o un foglio
 regoleH(){return`<div class="tut-regole">${RULES.avventura}</div>`},
 // i comandi nella pagina Avventura
 pagH(){const m=AvvTut.carica(),n=ATUT.restano(m);
  return`<div class="sh2">Regole e suggerimenti ${infoH('Le regole dell\'Avventura in poche righe, e piccoli box al tocco nella prima sessione: uno alla volta, si chiudono con «Capito».')}</div>
<div class="tut-pag"><button class="b sm" data-a="tut" data-v="regole" aria-expanded="${!!Avv.regole}">${ic('diario',16)} ${Avv.regole?'Nascondi le regole':'Leggi le regole'}</button>
<button class="b sm" data-a="tut" data-v="onoff" aria-pressed="${!m.spento}">Suggerimenti: ${m.spento?'no':'sì'}</button>
<button class="b sm" data-a="tut" data-v="rivedi">Rivedi i suggerimenti</button></div>
${Avv.regole?AvvTut.regoleH():''}<small class="muted">${m.spento?'I suggerimenti sono spenti.':n?'Restano '+n+' suggerimenti da vedere.':'Li hai visti tutti.'}</small>`},
 act(a,v){if(a!=='tut')return;const i=String(v).indexOf(':'),verbo=i<0?String(v):String(v).slice(0,i),arg=i<0?'':String(v).slice(i+1);let m=AvvTut.carica();
  if(verbo==='ok')m=ATUT.visto(m,arg);else if(verbo==='basta')m=ATUT.spegni(m);
  else if(verbo==='onoff')m=m.spento?Object.assign({},m,{spento:false}):ATUT.spegni(m);
  else if(verbo==='rivedi'){m=ATUT.rivedi();Avv.msg='I suggerimenti ricominciano dalla prossima mappa.'}
  else if(verbo==='regole'){Avv.regole=!Avv.regole;return render()}
  else return;
  AvvTut.mem=m;AvvTut.salva();render()}};
