/* ---- Avventura (Cantari di Ventura): la pagina della barra in basso. Continua, nuova campagna, eroi, compagni, regole in breve.
   Piano: docs/AVVENTURA.md. Eroi: app/24g-eroi.js; campagna: app/24h-campagna.js (motore motori/28-campagna.js). ---- */
/* ---- Passo 18: il foglio «Nuova campagna» della Compagnia di ventura (difficoltà, capitano, seme). Il comando è `ven` (24hw). ---- */
const AvvNuova=(()=>{
 // la nuova campagna: difficoltà (preset o su misura), capitano e seme; `pronta` dice che si è scelto davvero (la stanza allora usa `opzNC`)
 const NC={fo:false,pronta:false,diff:'condottiero',nome:'',c1:0,c2:3,fig:0,seme:'',leve:{}};
 const LEVE=[['eco','Economia',['generosa','giusta','avara']],['cons','Consumi',['leggeri','normali','duri']],['nem','Nemici',[-1,0,1],{'-1':'deboli','0':'medi','1':'forti'}],['unif','Unificazione dei regni',['lenta','normale','rapida']],
  ['stag','Stagioni',['miti','normali','rigide']],['fer','Ferite del capitano',['indulgenti','normali','ferro']],['mondo','Grandezza del mondo',['ampio','vasto']],['taglia','Grandezza delle battaglie',['piccola','media','grande']]];
 const DIFFS=[['recluta','Recluta','Mondo più mite'],['condottiero','Condottiero','La via di mezzo'],['leggenda','Leggenda','Ferro e carestie'],['misura','Su misura','Scegli le leve']];
 const COLORI=['#b8322a','#2f6fa8','#3f8f4a','#e0b04a','#6a3a8a','#2b2b2b','#e8e0cc','#c46a1c'];
 const FIGURE=['Leone','Aquila','Lupo','Cervo','Torre','Spada','Corona','Rosa','Stella','Drago','Cinghiale','Ponte'];
 const leve=()=>Object.assign({},VDAT.OPZ0,VDAT.PRESET.condottiero,NC.diff==='misura'?{}:VDAT.PRESET[NC.diff],NC.leve);
 // le opzioni della partita nuova: quelle del preset (o le leve a mano) più lo stemma del capitano
 function opzNC(){const o=Object.assign({},VDAT.OPZ0,VDAT.PRESET.condottiero,NC.diff==='misura'?NC.leve:Object.assign({},VDAT.PRESET[NC.diff],{mondo:NC.leve.mondo||VDAT.OPZ0.mondo,taglia:NC.leve.taglia||VDAT.OPZ0.taglia}),{diff:NC.diff});
  o.stemma={c1:COLORI[NC.c1],c2:COLORI[NC.c2],fig:FIGURE[NC.fig]};return o}
 const etich=(k,v)=>{const L=LEVE.find(x=>x[0]===k);return L&&L[3]?L[3][v]:String(v)};
 const stemmaH=(c1,c2,fig)=>VenArte.stemma({c1,c2,fig},34);
 // riepilogo breve delle opzioni: lo vede anche l'ospite in compagnia
 function riepilogoH(o){o=o||{};const d=DIFFS.find(x=>x[0]===o.diff)||DIFFS[1];
  const L=LEVE.filter(x=>x[0]!=='mondo'&&x[0]!=='taglia'&&x[0]!=='fer').map(x=>`<span>${esc(x[1])}: <b>${esc(etich(x[0],o[x[0]]!=null?o[x[0]]:VDAT.OPZ0[x[0]]))}</b></span>`).join('');
  return`<div class="vn-riep"><b>Difficoltà: ${esc(d[1])}</b><div>${L}</div></div>`}
 // scena a mano: accampamento al tramonto, tende e stendardi in sagoma (sostituibile con la copertina dipinta)
 const INSEGNA='<svg class="av-ins-sv" viewBox="0 0 390 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="avc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a52"/><stop offset=".55" stop-color="#d9743a"/><stop offset="1" stop-color="#f3c36a"/></linearGradient></defs><rect width="390" height="220" fill="url(#avc)"/><circle cx="290" cy="128" r="34" fill="#ffe09a" opacity=".9"/><path d="M0 150Q70 118 150 144T300 138T390 146V220H0z" fill="#3b2a3a"/><path d="M0 176Q100 160 200 174T390 168V220H0z" fill="#241a22"/><path d="M40 190l30-46 30 46zM120 196l36-58 36 58zM250 192l32-50 32 50z" fill="#120d12"/><path d="M70 144V118M156 138V104M282 142V114" stroke="#120d12" stroke-width="3"/><path d="M70 118l16 5-16 5zM156 104l18 6-18 6zM282 114l16 5-16 5z" fill="#b8322a"/></svg>';
 function foglioH(){if(!NC.fo)return'';const R=VEN.regni(null),host=!VenStanza.on();if(!NC.nome)NC.nome=ME.name||'Capitano';const m=NC.diff==='misura',lv=leve();
  const cartaD=DIFFS.map(d=>`<button class="av-dc${NC.diff===d[0]?' on':''}" data-a="ven" data-v="diff:${d[0]}"><b>${d[1]}</b><small>${d[2]}</small></button>`).join('');
  const leveH=m?`<div class="av-leve">${LEVE.filter(x=>x[0]!=='fer').map(([k,t,vals])=>`<div><small>${t}</small><div class="av-ch">${vals.map(v=>`<button class="av-c${lv[k]===v?' on':''}" data-a="ven" data-v="leva:${k}:${v}">${esc(etich(k,v))}</button>`).join('')}</div></div>`).join('')}</div>`:'';
  const col=n=>COLORI.map((c,j)=>`<button class="av-cl${NC['c'+n]===j?' on':''}" style="background:${c}" data-a="ven" data-v="col:${n}:${j}" aria-label="Colore ${j+1}"></button>`).join('');
  const regno=VDAT.ACCESO.mondo2?'<small class="muted">Il regno non si sceglie: la sorte ti getta in un punto del mondo.</small>':`<div class="vn-nuova"><small class="muted">Da quale regno parti?</small><div class="vn-regni vn-r5">${R.map(f=>`<button class="vn-regno${Ven.V.regno===f?' on':''}" style="--fz:${VEN.rg(null,f).col}" data-a="ven" data-v="regno:${f}"><b>${esc(VEN.rg(null,f).breve)}</b><small>${esc(VEN.rg(null,f).motto)}</small></button>`).join('')}</div></div>`;
  return`<div class="av-fo-sf" data-a="ven" data-v="fochiudi"></div><div class="av-fo" role="dialog" aria-label="Nuova campagna"><div class="av-fo-t"><h3>Nuova campagna</h3><button class="vn-ib" data-a="ven" data-v="fochiudi" aria-label="Chiudi">${ic('x',18)}</button></div><div class="av-fo-c">
${host?`<div class="av-dd">${cartaD}</div>${leveH}`:riepilogoH(opzNC())+'<small class="muted">La difficoltà la sceglie chi ospita.</small>'}
<div class="sh2">Capitano</div><input class="av-in" id="av-nome" maxlength="20" value="${esc(NC.nome)}" aria-label="Nome del capitano"><div class="av-stm">${stemmaH(COLORI[NC.c1],COLORI[NC.c2],FIGURE[NC.fig])}<div><div class="av-cls">${col(1)}</div><div class="av-cls">${col(2)}</div></div></div>
<div class="av-ch">${FIGURE.map((f,i)=>`<button class="av-c${NC.fig===i?' on':''}" data-a="ven" data-v="fig:${i}">${f}</button>`).join('')}</div>
${regno}<details class="av-seme"><summary>Seme del mondo</summary><input class="av-in" id="av-seme" inputmode="numeric" maxlength="10" value="${esc(NC.seme)}" placeholder="a caso" aria-label="Seme"><small class="muted">Lo stesso seme dà lo stesso mondo.</small></details></div>
<div class="av-fo-b"><button class="b gold ecta" data-a="ven" data-v="nuova">${ic('spada',18)} Getta i dadi</button></div></div>`}
 if(typeof document!=='undefined')document.addEventListener('input',e=>{const t=e.target;if(!t)return;if(t.id==='av-nome')NC.nome=t.value;else if(t.id==='av-seme')NC.seme=t.value.replace(/\D/g,'')},true);
 return{NC,LEVE,opzNC,stemmaH,INSEGNA,riepilogoH,foglioH}})();
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
 html(){const lista=Avv.eroiElenco(),s=Avv.inCorso(),on=Avv.online(),pochi=!lista.length,pend=lista.filter(h=>APOT.daScegliere(h).length);
  const eroi=on&&Avv.caricando?'<div class="avv-vuoto" style="height:84px" aria-hidden="true"></div>':on?(lista.length?`<div class="av-ritt big">${lista.map(h=>`<span class="av-rit" title="${esc(h.nome)}">${Eroi.ritratto(h.aspetto,h.razza,h.classe,52)}</span>`).join('')}</div>
<small class="muted">${lista.map(h=>esc(h.nome)+' · '+esc(EROI.CLASSI[h.classe].nome)+' '+h.liv).join(' — ')}</small>${pend.length?`<small class="muted"><b>Scelte di livello in attesa:</b> ${pend.map(h=>esc(h.nome)).join(', ')}. Falle da «Gestisci gli eroi».</small>`:''}`:'<p class="muted" style="margin:0">Nessun eroe: creane uno per partire.</p>'):
   '<p class="muted" style="margin:0">Per creare e salvare gli eroi serve il profilo online.</p>';
  const tab=Avv.tab||'partite',TAB=[['partite','Partite'],['eroi','Eroi'],['guida','Guida']];
  const partite=`${Avv.caricando?(Avv.online()&&Dia.INDICE[Ses.CAP]?'<div class="avv-vuoto" style="height:132px" aria-hidden="true"></div>':''):`<div class="av-ins2"><b>La Corona Spezzata</b><small>campagna a capitoli</small></div>${Ses.sezioneH()}`}
${AvvStanza.sezioneH()}
<div class="sh2">Campagna libera ${infoH('Solo la mappa del mondo, senza la storia: i premi restano nella campagna e non tornano agli eroi.')}</div>
${s?Avv.cartaCont(s):''}
${on?`<button class="b ${s?'':'sm '}ecta" data-a="avvnuova" ${pochi&&Eroi.lista?'disabled':''}>${ic('spada',18)} ${s?'Nuova campagna libera':'Parti in campagna libera'}</button>${pochi&&Eroi.lista?'<small class="muted" style="text-align:center">Prima crea un eroe.</small>':''}`:`<button class="b gold ecta" data-a="acc">Accedi per giocare</button>`}
${Bat.setupH()}
${Dia.setupH()}
${Scena3D.impostaH()}`;
  const eroiP=`<div class="sh2">I tuoi eroi</div>${eroi}
${on?`<button class="b ${pochi?'gold ':''}sm" data-a="eroi">${pochi?'Crea il tuo primo eroe':'Gestisci gli eroi'}</button>`:''}
<div class="sh2">Compagni ${infoH('I compagni sono personaggi della storia che si uniscono alla compagnia lungo il cammino. Arriveranno con il primo capitolo.')}</div>
<p class="muted" style="margin:0">Nessun compagno ancora.</p>`;
  const guida=`<div class="av-come">${Avv.COME.map(([t,x])=>`<div><b>${esc(t)}</b> ${infoH(esc(x))}</div>`).join('')}</div>
${AvvTut.pagH()}`;
  return`<div class="modal" data-sc><div class="box col av"><h2>Cronache del Crocevia ${infoH('Una campagna a capitoli: ogni sessione è una «cronaca». Qui parti, riprendi e gestisci i tuoi eroi.')}</h2>
${Ven.sezioneH()}
<div class="av-tab" role="tablist">${TAB.map(([k,n])=>`<button role="tab" aria-selected="${tab===k}" class="${tab===k?'on':''}" data-a="avvtab" data-v="${k}">${n}</button>`).join('')}</div>
${tab==='eroi'?eroiP:tab==='guida'?guida:partite}
<p class="acc-msg" role="status">${esc(Avv.msg)}</p></div>${AvvNuova.foglioH()}</div>`},
 async act(a,v){
  if(a==='avv'){Plancia.chiudi();ui.avv=true;Avv.msg='';Ses.nuova=Ses.conf=null;
   // scheletro subito (altezze fisse), poi un solo ridisegno quando eroi e salvataggi sono arrivati insieme
   Avv.caricando=Avv.online()&&(!Eroi.lista||!Ses.elenco);render();
   if(Avv.online()){try{await Promise.all([Eroi.lista?null:Eroi.carica(),Ses.leggiElenco()])}catch(e){ERR.n(e,'avventura')}}
   Avv.caricando=false;if(ui.avv)render();return}
  if(a==='avvtab'){Avv.tab=['partite','eroi','guida'].includes(v)?v:'partite';return render()}
  if(a==='avvx'){ui.avv=false;return render()}
  if(a==='avvcontinua'){if(!Avv.inCorso())return render();ui.avv=false;ui.camp=true;return render()}
  if(a==='avvnuova'){if(Avv.busy)return;Avv.busy=true;Avv.msg='';render();
   try{await Camp.parti();if(Camp.msg){Avv.msg=Camp.msg;Camp.msg=''}else{ui.avv=false;ui.camp=true}}
   catch(e){console.warn('Avv',e);Avv.msg='Non riesco a leggere i tuoi eroi: riprova.'}
   finally{Avv.busy=false;render()}return}}};
