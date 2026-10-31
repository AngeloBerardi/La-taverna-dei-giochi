/* ---- Dialoghi (A7): la vista del racconto. Ritratto di chi parla, testo a comparsa, scelte con etichette ([Persuasione 65%], [Solo Mago]), esito delle prove, reazioni dei compagni.
   Motore: motori/27q-avv-racconto.js (ARAC) + 27p-avv-compagni.js (ACMP). Capitoli: src/avventura/<id>.json, validati e scritti a parte dal build (dist/avventura/…), scaricati al bisogno.
   Qui c'è anche il «Racconto di prova» della pagina Avventura: una scena con tre eroi di prova, senza premi veri. Un solo comando: data-a="dl" data-v="verbo:arg". Prefisso CSS dl-. ---- */
const Dia={
 INDICE:/*CAPITOLI*/ {},
 CAP:'prova',
 cap:null,s:null,oro:50,fine:null,righe:[],msg:'',riassunto:'',occupato:false,letto:false,
 rev:{k:'',n:0,fatto:false},timer:null,
 // ---- stato di prova, salvato nel telefono ----
 leggi(){if(Dia.letto)return;Dia.letto=true;try{const c=localStorage.getItem('racc-cap');if(c&&Dia.INDICE[c])Dia.CAP=c;if(!Dia.INDICE[Dia.CAP]&&Object.keys(Dia.INDICE)[0])Dia.CAP=Object.keys(Dia.INDICE)[0];const j=JSON.parse(localStorage.getItem('racc-'+Dia.CAP)||'null');if(j&&j.v===1&&j.s&&j.s.cap===Dia.CAP){Dia.s=j.s;Dia.oro=j.oro|0;Dia.fine=j.fine||null;Dia.righe=Array.isArray(j.righe)?j.righe:[]}}catch(e){ERR.n(e)}},
 salva(){try{localStorage.setItem('racc-cap',Dia.CAP);if(!Dia.s)localStorage.removeItem('racc-'+Dia.CAP);else localStorage.setItem('racc-'+Dia.CAP,JSON.stringify({v:1,s:Dia.s,oro:Dia.oro,fine:Dia.fine,righe:Dia.righe}))}catch(e){ERR.n(e)}},
 async carica(){if(Dia.cap)return Dia.cap;const i=Dia.INDICE[Dia.CAP];if(!i)throw new Error('capitolo mancante');const r=await fetch(i.url);if(!r.ok)throw new Error('capitolo non scaricato');Dia.cap=await r.json();return Dia.cap},
 // la compagnia di prova: tre eroi (resta un posto per Ilda) più i compagni che sono nel gruppo
 eroi(){const b=Bat.prova(3).slice(0,3).map((m,i)=>Object.assign({},m.eroe,{slot:'e'+(i+1)}));
  if(Dia.s&&Dia.cap)for(const id of ACMP.nelGruppo(Dia.s))b.push(Dia.compagno(id));return b},
 comp:{},
 compagno(id){return Dia.comp[id]||(Dia.comp[id]=ACMP.scheda(Dia.cap.compagni[id],3,id))},
 ctx(){return{eroi:Dia.eroi(),oro:Dia.oro,perdizione:0,giorno:1,luogo:null}},
 // ---- a parole: ciò che succede quando la scena finisce o cambia qualcosa ----
 effetto(f){const c=Dia.cap;switch(f.t){
  case'oro':return f.n>0?`Ricevi ${f.n} monete`:`Paghi ${-f.n} monete`;
  case'xp':return`${f.n} punti esperienza a testa`;
  case'oggetto':{const o=AOGG.OGG[f.id],n=Math.abs(f.n||1);return`${(f.n||1)<0?'Perdi':'Ricevi'}: ${o?o.nome:f.id}${n>1?' ×'+n:''}`}
  case'pf':return f.pct>0?`Gli eroi recuperano il ${Math.round(f.pct*100)}% dei PF`:`Gli eroi perdono il ${Math.round(-f.pct*100)}% dei PF`;
  case'perdizione':return`La perdizione ${f.n>0?'sale':'scende'} di ${Math.abs(f.n)}`;
  case'razioni':return f.n>0?`${f.n} ${f.n===1?'razione':'razioni'} in più`:`Consumi ${-f.n} ${f.n===-1?'razione':'razioni'}`;
  case'battaglia':return`Scontro: ${f.capo?BEST.M[f.capo].nome:BEST.FAMIGLIE[f.fam]} (qui è solo un cenno)`;
  case'compagno':{const n=(c.compagni[f.id]||{}).nome||f.id;return f.azione==='entra'?`${n} si unisce alla compagnia`:f.azione==='attende'?`${n} vi aspetta in taverna`:f.motivo==='lascia'?`${n} lascia la compagnia`:`${n} se ne va`}
  default:return''}},
 registra(fuori){for(const f of fuori){if(f.t==='oro')Dia.oro=Math.max(0,Dia.oro+f.n);const t=Dia.effetto(f);if(t)Dia.righe.push(t)}},
 // ---- comandi ----
 async act(a,v){const[verbo,arg]=String(v).split(':');
  try{
   if(verbo==='chiudi'){ui.dia=false;ui.avv=true;if(!(Dia.s&&Dia.s.scena))Dia.fine=null;Dia.salva();return render()}
   if(verbo==='nuovo'){Dia.s=null;Dia.oro=50;Dia.fine=null;Dia.righe=[];Dia.riassunto='';Dia.comp={};Dia.salva();return render()}
   if(verbo==='salta'){Dia.rev.fatto=true;return Dia.dopo()}
   if(verbo==='capitolo'){if(Dia.INDICE[arg]&&arg!==Dia.CAP){Dia.CAP=arg;Dia.cap=null;Dia.s=null;Dia.letto=false;Dia.oro=50;Dia.fine=null;Dia.righe=[];Dia.riassunto='';Dia.comp={};Dia.provato=false;Dia.msg='';try{localStorage.setItem('racc-cap',arg)}catch(e){ERR.n(e)}}return render()}
   if(Dia.occupato)return;Dia.occupato=true;await Dia.carica();Dia.msg='';
   const cap=Dia.cap;if(!Dia.s)Dia.s=ARAC.nuovo(cap.id,(Date.now()^(Math.random()*4294967296))>>>0);
   if(verbo==='riprendi'){ui.avv=false;ui.dia=true;return render()}
   if(verbo==='riassunto'){Dia.riassunto=LOC.apertura({cantare:ARAC.cantare(cap,Dia.s,Dia.ctx())});return render()}
   if(verbo==='sessione'){Dia.riassunto=LOC.chiusura({cantare:ARAC.cantare(cap,Dia.s,Dia.ctx())});Dia.s=ARAC.finisciSessione(Dia.s);Dia.salva();return render()}
   let az;
   if(verbo==='avvia'||verbo==='parla'){const id=verbo==='parla'?ACMP.parla(Dia.s,cap,arg):arg;if(!id){Dia.msg='Non ha niente da dirvi, adesso.';return render()}az={t:'avvia',id};Dia.righe=[];Dia.fine=null}
   else if(verbo==='scegli')az={t:'scegli',i:+arg};else if(verbo==='continua')az={t:'continua'};else return;
   const r=ARAC.act(Dia.s,az,cap,Dia.ctx());if(r.err){Dia.msg=r.err;return render()}
   Dia.s=r.s;Dia.registra(r.fuori);if(r.esito!=null&&!Dia.s.scena)Dia.fine={esito:r.esito};
   ui.avv=false;ui.dia=true;Dia.salva();render()}
  catch(e){ERR.n(e);Dia.msg='Non riesco ad aprire il racconto: riprova.';render()}
  finally{Dia.occupato=false}},
 // ---- vista ----
 ritratto(p,px){return p&&p.razza?`<span class="dl-rit">${Eroi.ritratto(p.aspetto,p.razza,p.classe,px)}</span>`:`<span class="dl-rit dl-nar">${ic('diario',px*.55)}</span>`},
 provaH(p){if(!p)return'';const ab=EROI.NOME_AB[p.ab]||p.ab;
  return`<div class="dl-pr ${p.ok?'ok':'ko'}" role="status"><b>${esc(p.eroe)}</b> prova ${esc(ab)}: ${p.tiro} ${p.mod<0?'−':'+'} ${Math.abs(p.mod)} = <b>${p.tot}</b> contro ${p.cd} — ${p.critico?'colpo perfetto!':p.fallimento?'passo falso.':p.ok?'riesce.':'non riesce.'}</div>`},
 reazioniH(L){return(L||[]).map(r=>`<span class="dl-re ${r.n>0?'su':'giu'}" role="status">${esc(r.nome)} ${r.n>0?'approva':'non approva'} (${r.n>0?'+':'−'}${Math.abs(r.n)})${r.lascia?' — se ne va':''}</span>`).join('')},
 html(){Dia.leggi();const s=Dia.s,cap=Dia.cap;if(!s||!cap)return'';
  const v=s.scena?ARAC.vista(s,cap,Dia.ctx()):null;
  if(!v)return`<div class="dl dl-ok" role="dialog" aria-label="Fine della scena"><div class="dl-top"><b>${esc(cap.titolo)}</b><button class="ib" data-a="dl" data-v="chiudi" aria-label="Chiudi">${ic('x',16)}</button></div>
<div class="dl-corpo"><div class="dl-fine"><h2>Fine della scena</h2>${Dia.righe.length?`<ul>${Dia.righe.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p class="muted">Niente da segnare.</p>'}
<p class="muted">Qui i premi non contano: nella campagna vera entrano nella compagnia.</p></div></div><div class="dl-bar"><button class="b gold" data-a="dl" data-v="chiudi">Torna alla taverna</button></div></div>`;
  const ok=Dia.rev.fatto&&Dia.rev.k===Dia.chiave(v);
  const sc=v.scelte.map(c=>`<button class="dl-sc${c.prova?' prova':''}" data-a="dl" data-v="scegli:${c.i}" ${c.ok?'':'disabled'}>${c.etichetta?`<b class="dl-et">[${esc(c.etichetta)}]</b>`:''}<span>${esc(c.t)}</span>${c.prova&&c.chi?`<small>tira ${esc(c.chi)}</small>`:''}${c.ok?'':`<small>${esc(c.perche)}</small>`}</button>`).join('');
  return`<div class="dl${ok?' dl-ok':''}" role="dialog" aria-label="Dialogo">
<div class="dl-top"><b>${esc(cap.titolo)}</b><button class="ib" data-a="dl" data-v="chiudi" aria-label="Esci dal dialogo">${ic('x',16)}</button></div>
<div class="dl-corpo" data-a="dl" data-v="salta">
 <div class="dl-chi">${Dia.ritratto(v.chi,88)}${v.chi.nome?`<span class="dl-nome"><b>${esc(v.chi.nome)}</b>${v.chi.classe?`<small>${esc(EROI.CLASSI[v.chi.classe].nome)}</small>`:''}</span>`:''}</div>
 <p class="dl-testo${v.chi.nome?'':' nar'}" data-t="${esc(v.testo)}" aria-label="${esc(v.testo)}">${ok?esc(v.testo):''}</p>
 <div class="dl-nota">${Dia.provaH(v.nota&&v.nota.prova)}${v.nota&&v.nota.testo?`<p class="dl-es">${esc(v.nota.testo)}</p>`:''}${Dia.reazioniH(v.reazioni)}</div>
 ${Dia.msg?`<p class="no" role="alert">${esc(Dia.msg)}</p>`:''}</div>
<div class="dl-bar">${v.continua?`<button class="b gold dl-co" data-a="dl" data-v="continua">${esc(v.continua)}</button>`:`<div class="dl-scelte">${sc}</div>`}</div></div>`},
 chiave(v){return v.scena+':'+v.nodo+':'+Dia.s.evn},
 // dopo ogni disegno: il testo compare a poco a poco (un tocco lo mostra tutto); a movimento ridotto compare subito
 dopo(){const on=!!(ui.dia&&Dia.s&&Dia.cap);document.documentElement.classList.toggle('dl-on',on);clearInterval(Dia.timer);if(!on)return;
  const el=document.querySelector('.dl-testo');if(!el)return;const t=el.dataset.t||'',k=Dia.chiave({scena:Dia.s.scena.id,nodo:Dia.s.scena.nodo});
  if(Dia.rev.k!==k)Dia.rev={k,n:0,fatto:false};
  const fine=()=>{Dia.rev.fatto=true;Dia.rev.n=t.length;const e=document.querySelector('.dl-testo');if(e)e.textContent=t;const d=document.querySelector('.dl');if(d)d.classList.add('dl-ok')};
  if(Dia.rev.fatto||Dia.rev.n>=t.length||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return fine();
  el.textContent=t.slice(0,Dia.rev.n);
  Dia.timer=setInterval(()=>{const e=document.querySelector('.dl-testo');if(!e||!ui.dia){clearInterval(Dia.timer);return}Dia.rev.n=Math.min(t.length,Dia.rev.n+3);e.textContent=t.slice(0,Dia.rev.n);if(Dia.rev.n>=t.length){clearInterval(Dia.timer);fine()}},22)},
 // ---- la sezione nella pagina Avventura ----
 luogoDi(cap,id){const w=cap.mondo||{},l=(w.luoghi||[]).concat(w.partenza?[w.partenza]:[]).find(x=>x.id===id);return l?l.nome:((cap.luoghi||{})[id]||{}).nome||id},
 // anteprima di un capitolo vero: le scene che si possono avviare adesso (ingressi e luoghi), i compagni nel gruppo
 capH(i,cont){const cap=Dia.cap;
  if(!cap||cap.id!==Dia.CAP){if(!Dia.provato){Dia.provato=true;Dia.carica().then(()=>render()).catch(e=>{ERR.n(e);Dia.msg='Il capitolo non si scarica: riprova più tardi.';render()})}return`<p class="muted" role="status">Apro il capitolo…</p>`}
  const st=Dia.s||ARAC.nuovo(cap.id,1),ing=(cap.ingressi||[]).filter(id=>!(st.fatte[id]>0)),sc=ARAC.disponibili(cap,st,Dia.ctx(),null);
  const bt=(id,tx,gold)=>`<button class="b ${gold?'gold ':''}ecta" data-a="dl" data-v="avvia:${esc(id)}" ${Dia.occupato?'disabled':''}>${ic('diario',18)} ${esc(tx)}</button>`;
  return`<p class="muted" style="margin:0">«${esc(i.titolo)}»${i.sottotitolo?' · '+esc(i.sottotitolo):''}. Anteprima delle scene: gli scontri non si combattono (si danno per vinti) e i premi non contano.</p>${cont}
${ing.map(id=>bt(id,cap.scene[id].titolo||id,!(Dia.s&&Dia.s.scena))).join('')}${sc.map(id=>bt(id,Dia.luogoDi(cap,[].concat(cap.scene[id].dove)[0])+' · '+cap.scene[id].titolo)).join('')}
${ACMP.nelGruppo(st).map(id=>`<button class="b sm" data-a="dl" data-v="parla:${esc(id)}">Parla con ${esc(cap.compagni[id].nome)} · ${esc(ACMP.livello(st.approv[id]|0).nome)} (${st.approv[id]|0})</button>`).join('')}
${!ing.length&&!sc.length&&!(Dia.s&&Dia.s.scena)?'<p class="muted">Nessuna scena da giocare, per ora: altre arrivano con i prossimi luoghi del capitolo.</p>':''}`},
 setupH(){const ids=Object.keys(Dia.INDICE);if(!ids.length)return'';Dia.leggi();const i=Dia.INDICE[Dia.CAP];if(!i)return'';const s=Dia.s,cap=Dia.cap,incorso=!!(s&&s.scena),prova=Dia.CAP==='prova';
  const sch=ids.length>1?`<div class="dl-ctl" role="group" aria-label="Capitolo">${ids.map(id=>`<button class="b sm${id===Dia.CAP?' gold':''}" data-a="dl" data-v="capitolo:${esc(id)}" aria-pressed="${id===Dia.CAP}">${esc(id==='prova'?'Racconto di prova':Dia.INDICE[id].titolo)}</button>`).join('')}</div>`:'';
  const cont=incorso?`<button class="av-card av-cont" data-a="dl" data-v="riprendi"><span class="av-tx"><b>Scena in corso</b><small>${esc(i.titolo)}</small></span><span class="av-go">Continua</span></button>`:'';
  const ilda=prova&&s&&ACMP.stato(s,'ilda')==='gruppo',ap=s?s.approv.ilda|0:0;
  const corpo=prova?`<p class="muted" style="margin:0">«${esc(i.titolo)}»: tre eroi di prova ascoltano una voce che esce da un pozzo.</p>${cont}
<button class="b ${incorso?'':'gold '}ecta" data-a="dl" data-v="avvia:pozzo" ${Dia.occupato?'disabled':''}>${ic('diario',18)} ${s&&s.fatte&&s.fatte.pozzo?'Riascolta la scena del pozzo':'Ascolta la scena del pozzo'}</button>
${ilda?`<button class="b sm" data-a="dl" data-v="parla:ilda">Parla con Ilda · ${esc(ACMP.livello(ap).nome)} (${ap})</button>`:''}`:Dia.capH(i,cont);
  return`<div class="sh2">${prova?'Racconto di prova':'Capitolo 1'} ${infoH(prova?'Una scena breve per provare i dialoghi: chi parla, scelte con la probabilità scritta sul bottone, un compagno che può unirsi e andarsene. Nessun premio vero.':'Le scene scritte del primo capitolo, da leggere e provare una per una nell\'ordine che preferisci. La campagna con la mappa le userà tutte; qui gli scontri non si combattono e i premi non contano.')}</div>${sch}${corpo}
${s?`<div class="dl-ctl"><button class="b sm" data-a="dl" data-v="riassunto">A che punto siamo?</button><button class="b sm" data-a="dl" data-v="sessione">Concludi la sessione</button><button class="b sm" data-a="dl" data-v="nuovo">Ricomincia da capo</button></div>`:''}
${Dia.riassunto?`<p class="dl-riass" role="status">${esc(Dia.riassunto)}</p>`:''}${Dia.msg&&!ui.dia?`<small class="muted" role="status">${esc(Dia.msg)}</small>`:''}`}};
