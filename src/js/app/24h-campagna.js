/* ---- Campagna (Cantari di Ventura, A6.5): la vista del mondo a tutto schermo e il filo del gioco. ----
   Regole: motori/28-campagna.js (CAMP, stato v3) con 27m (mondo), 27n (luoghi), 27o (mostri). Qui si tengono lo stato e la selezione (`Camp.s`, `Camp.u`, `Camp.v`) e si
   traducono i tocchi in azioni di CAMP.act; la mappa è in 24hg-mondo-mappa.js (`MoMappa`), pannelli e fogli in 24hh-mondo-pannelli.js (`MoPan`), lo scontro in 24he-battaglia.js (`Bat`,
   avviato da `combatti` e chiuso da `fineBattaglia`). Un solo comando nel `switch` di 07c: `data-a="mo" data-v="verbo:argomento"`. Stile: css/39-campagna.css (prefisso mo-). */
const Camp={
 s:null,seed:0,msg:'',
 // u = scelte di chi gioca (eroe scelto, destinazione, foglio aperto); v = zoom e centro della mappa (cx nullo = segui l'eroe scelto)
 u:{sel:0,dest:null,insieme:true,foglio:null,mostro:null,msg:'',dado:null},v:{k:2.2,cx:null,cy:null},
 azzera(){Camp.u={sel:0,dest:null,insieme:true,foglio:null,mostro:null,msg:'',dado:null};Camp.v={k:2.2,cx:null,cy:null}},
 // ---- che cosa è scelto ----
 eroeSel(s){const u=Camp.u,e=s.eroi[u.sel];if(e&&e.hp>0)return u.sel;const i=s.eroi.findIndex(x=>x.hp>0);return u.sel=i>=0?i:0},
 // chi si muove insieme: gli eroi nella cella dell'eroe scelto (se «Insieme» è acceso), altrimenti lui solo
 gruppo(s){const e=s.eroi[Camp.eroeSel(s)];if(!e)return[];const qui=s.eroi.filter(x=>x.hp>0&&x.q===e.q&&x.r===e.r);return Camp.u.insieme&&qui.length>1?qui:[e]},
 nomeCella(s,x){if(!x)return'Fuori dalla mappa';if(!x.visto)return'Terra ignota';const l=x.luogo&&s.luoghi[x.luogo],r=s.regioni&&s.regioni[x.reg];return l?l.nome:CAMP.TERRENI[x.t].n+(r?' · '+r.nome:'')},
 num:n=>String(n).replace('.',','),
 // il cammino verso la destinazione scelta, con quanto costa e fin dove si arriva col movimento che c'è (non cambia lo stato)
 anteprima(s){const u=Camp.u,i=Camp.eroeSel(s),e=s.eroi[i];if(!u.dest||!e||e.hp<=0||s.dentro)return null;const d=u.dest,k=d.q+','+d.r,x=s.celle[k],cc=CAMP.costoCella(s),base={nome:Camp.nomeCella(s,x)};
  if(!x||!x.visto)return{...base,err:'Terra ignota: esplorala prima'};if(cc(x)==null)return{...base,err:CAMP.TERRENI[x.t].n+': non si passa'};if(e.q===d.q&&e.r===d.r)return{...base,err:'Sei già qui'};
  const occ=new Set(s.mostri.map(m=>m.q+','+m.r));if(occ.has(k))return{...base,err:'Lì c\'è un nemico'};
  const p=CAMP.percorso(s.celle,e,d,null,{vieta:occ,costo:cc});if(!p||!p.length)return{...base,err:'Non c\'è un cammino fin lì'};
  let fine=p.length,contatto=false;for(let j=0;j<p.length;j++)if(AMOS.contatto(s,p[j].q,p[j].r)){fine=j+1;contatto=true;break}
  const passi=p.slice(0,fine),costi=passi.map(c=>cc(s.celle[c.q+','+c.r])),tot=costi.reduce((a,b)=>a+b,0),gr=Camp.gruppo(s),tirato=gr.every(x=>x.pm!=null),pm=tirato?Math.min(...gr.map(x=>x.pm)):null;
  let acc=0,j=-1;if(pm!=null)for(let n=0;n<costi.length;n++){if(acc+costi[n]>pm)break;acc+=costi[n];j=n}
  return{...base,passi,costi,costo:tot,pm,contatto,tirato,n:j+1,completo:pm!=null&&j===costi.length-1,fine:pm==null?passi[passi.length-1]:j>=0?passi[j]:null,costoFino:acc}},
 // prova un'azione senza applicarla: ritorna il motivo per cui non si può (testo) oppure ''
 prova(a){try{const r=CAMP.act(Camp.s,a);return r.err||''}catch(e){ERR.n(e);return'Non adesso'}},
 haLuogo(s,i){const e=s.eroi[i];return!!(e&&(CAMP.luogoDi(s,e)||CAMP.mercanteQui(s,e)))},
 // ---- tocchi sulla mappa ----
 tocca(c){const s=Camp.s,u=Camp.u;if(!s||s.over||s.sfida||s.dentro||s.incontro||s.evento||u.foglio)return;const x=s.celle[c.q+','+c.r];
  const m=x&&AMOS.visibili(s).find(g=>g.q===c.q&&g.r===c.r);if(m){u.mostro=m.id;u.dest=null;u.foglio='mostro';return render()}   // i nemici si vedono anche nella nebbia
  if(!x||!x.visto){u.dest=null;u.mostro=null;return render()}
  const qui=s.eroi.map((e,i)=>e.hp>0&&e.q===c.q&&e.r===c.r?i:-1).filter(i=>i>=0);
  if(qui.length){u.dest=null;u.mostro=null;const k=qui.indexOf(u.sel);if(k<0)u.sel=qui[0];else if(qui.length>1)u.sel=qui[(k+1)%qui.length];else if(Camp.haLuogo(s,qui[0]))u.foglio='luogo';return render()}
  if(Camp.gruppo(s).some(x=>x.pm==null)){u.dest=null;u.msg='Prima tira il movimento.';return render()}
  u.mostro=null;u.msg='';if(u.dest&&u.dest.q===c.q&&u.dest.r===c.r){const a=Camp.anteprima(s);if(a&&!a.err&&a.n>0)return Camp.vai()}  // il secondo tocco sulla stessa cella conferma
  u.dest={q:c.q,r:c.r};render()},
 vai(){const s=Camp.s,u=Camp.u,a=Camp.anteprima(s);if(!a||a.err||!a.tirato||a.n<1)return render();const d=a.completo?u.dest:a.fine;
  return Camp.fai({t:'muovi',eroe:Camp.eroeSel(s),q:d.q,r:d.r,tutti:Camp.gruppo(s).length>1})},
 // ---- applicare un'azione ----
 fai(a,tieni){const s=Camp.s,u=Camp.u;if(!s)return;let r;try{r=CAMP.act(s,a)}catch(e){ERR.n(e);r={err:'Azione non riuscita'}}
  if(r.err){u.msg=r.err;return render()}
  Camp.s=r.s;u.msg='';u.dado=a.t==='risolvi'?r.s.ultima:null;if(a.t!=='tira')u.dest=null;u.mostro=null;
  if(!tieni||['lungo','entra','muovi','fineTurno'].includes(a.t))u.foglio=null;if(['muovi','fineTurno','lungo'].includes(a.t))Camp.v.cx=Camp.v.cy=null;
  Camp.salva();render()},
 // ---- battaglia ----
 combatti(){const s=Camp.s;if(!s||!s.sfida)return;
  if(Bat.mondo===s.sfida.seme&&Bat.s){ui.camp=false;ui.bat=true;Bat.foglio=null;return render()}
  try{Bat.daMondo(CAMP.battaglia(s),s.sfida.quali.map(i=>s.eroi[i].aspetto),s.sfida.seme)}catch(e){ERR.n(e);Camp.u.msg='Non riesco a preparare la battaglia: riprova.';return render()}
  ui.camp=false;ui.bat=true;render()},
 // il pulsante «Continua» alla fine della battaglia del mondo: il risultato entra nella campagna e si torna alla mappa
 fineBattaglia(){const b=Bat.s,s=Camp.s;if(!b||!b.over||!s||!s.sfida)return;let r;try{r=CAMP.act(s,{t:'esito',riep:ASCO.riepilogo(b)})}catch(e){ERR.n(e);r={err:'Non riesco a registrare il risultato'}}
  if(r.err){Bat.msg=r.err;return render()}
  Camp.s=r.s;Camp.u.dado=null;Camp.u.msg='';Camp.v.cx=Camp.v.cy=null;Camp.salva();Bat.chiudiMondo();render()},
 // ---- disegno ----
 html(){const s=Camp.s;
  if(!s)return`<div class="modal"><div class="box col"><h2>Campagna</h2><p class="muted">Dalla pagina Avventura scegli i tuoi eroi e parti.</p><button class="b sm" data-a="campx">Chiudi</button></div></div>`;
  return`<div class="mo" role="dialog" aria-modal="true" aria-label="Campagna">${MoPan.topH(s)}<div class="mo-mappa">${MoMappa.svg(s)}${MoPan.sopraH(s)}</div><div class="mo-giu">${MoPan.eroiH(s)}${MoPan.ctxH(s)}${MoPan.barraH(s)}</div>${MoPan.fogliH(s)}</div>`},
 // chiamato da afterRender: la mappa prende la misura vera dello schermo
 dopo(){const on=!!(ui.camp&&Camp.s);document.documentElement.classList.toggle('mo-on',on);if(!on)return;const svg=document.querySelector('.mo-svg');if(svg)MoMappa.applica(svg)},
 // ---- salvataggio ----
 salva(){try{localStorage.setItem('camp',JSON.stringify({s:Camp.s}))}catch(e){ERR.n(e)}},
 riprendi(){try{const j=JSON.parse(localStorage.getItem('camp')||'null');if(j&&j.s&&j.s.g==='campagna')Camp.s=CAMP.migra(j.s)}catch(e){ERR.n(e)}},
 cfgH(){return Eroi.lista&&Object.keys(Eroi.lista).length?'<button class="b sm gold" data-a="campstart">Campagna '+ic('spada',16)+'</button>':''},
 // gli eroi vengono sempre riletti dal profilo: la scheda in memoria potrebbe non essere ancora stata caricata
 async parti(){let L=Eroi.lista;try{L=await FB.eroi();Eroi.lista=L}catch(e){console.warn('Camp',e)}
  const eroi=EROI.SLOT_ID.map(id=>L&&L[id]&&EROI.coerente(L[id])?{...L[id],slot:id}:null).filter(Boolean).slice(0,CAMP.MAX_EROI);
  if(!eroi.length){Camp.msg='Crea prima un eroe.';return}Camp.seed=(Date.now()^(Math.random()*4294967296))>>>0;Camp.s=CAMP.nuova(eroi,Camp.seed);Camp.msg='';Camp.azzera();Camp.salva()},
 // ---- comandi: campstart / campx / campnuova e «mo» con v = «verbo» oppure «verbo:argomento» ----
 act(a,v){
  if(a==='campstart'){return(async()=>{if(!Camp.s||Camp.s.over)await Camp.parti();if(!Camp.s||Camp.s.over){render();return}ui.eroi=false;ui.camp=true;render()})()}
  if(a==='campx'){ui.camp=false;ui.avv=true;return render()}
  if(a==='campnuova'){return(async()=>{await Camp.parti();render()})()}
  const s=Camp.s;if(!s||a!=='mo')return;const u=Camp.u,i=String(v).indexOf(':'),verbo=i<0?String(v):String(v).slice(0,i),arg=i<0?'':String(v).slice(i+1),sel=Camp.eroeSel(s);
  switch(verbo){
   case'sel':u.sel=+arg;u.dest=null;u.msg='';return render();
   case'tira':return Camp.fai(arg==='t'?{t:'tira',tutti:true}:{t:'tira',eroe:sel,conc:arg==='c'},true);
   case'vai':return Camp.vai();
   case'annulla':u.dest=null;u.msg='';return render();
   case'insieme':u.insieme=!u.insieme;return render();
   case'giro':return Camp.fai({t:'fineTurno'});
   case'foglio':u.foglio=arg&&u.foglio!==arg?arg:null;u.mostro=u.foglio==='mostro'?u.mostro:null;u.msg='';return render();
   case'breve':return Camp.fai({t:'breve',eroe:+arg},true);
   case'lungo':return Camp.fai({t:'lungo'});
   case'entra':return Camp.fai({t:'entra',eroe:sel});
   case'esci':return Camp.fai({t:'esci'});
   case'avanza':return Camp.fai({t:'avanza'});
   case'scegli':return Camp.fai({t:'scegli',i:+arg});
   case'ris':{const[e,ab]=arg.split(':');return Camp.fai({t:'risolvi',eroe:+e,abilita:ab})}
   case'fuggi':return Camp.fai({t:'fuggi'});
   case'cura':return Camp.fai({t:'cura',eroe:sel},true);
   case'rialza':return Camp.fai({t:'rialza',eroe:+arg},true);
   case'prega':return Camp.fai({t:'prega',eroe:sel,offerta:arg==='1'},true);
   case'taglia':return Camp.fai({t:'taglia',eroe:sel,id:arg},true);
   case'zoom':{const svg=document.querySelector('.mo-svg');if(svg)MoMappa.zoom(svg,arg==='+'?1.4:1/1.4);return}
   case'centra':Camp.v.cx=Camp.v.cy=null;Camp.v.k=2.2;return render();
   case'obiettivo':{const l=s.luoghi[CAMP.passoCorrente(s)];if(l){const[x,y]=MoMappa.xy(l.q,l.r);Camp.v.cx=x;Camp.v.cy=y;u.foglio=null}return render()}
   case'combatti':return Camp.combatti();
  }}
};
Camp.riprendi();
