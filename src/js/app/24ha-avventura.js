/* ---- Avventura (Cantari di Ventura): la pagina della barra in basso. Continua, nuova campagna, eroi, compagni, regole in breve.
   Piano: docs/AVVENTURA.md. Eroi: app/24g-eroi.js; campagna: app/24h-campagna.js (motore motori/28-campagna.js). ---- */
const Avv={
 msg:'',
 // salvataggio in corso (nessuna campagna finita)
 inCorso(){return Camp.s&&!Camp.s.over?Camp.s:null},
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
  const eroi=on?(lista.length?`<div class="av-ritt big">${lista.map(h=>`<span class="av-rit" title="${esc(h.nome)}">${Eroi.ritratto(h.aspetto,h.razza,h.classe,52)}</span>`).join('')}</div>
<small class="muted">${lista.map(h=>esc(h.nome)+' · '+esc(EROI.CLASSI[h.classe].nome)+' '+h.liv).join(' — ')}</small>${pend.length?`<small class="muted"><b>Scelte di livello in attesa:</b> ${pend.map(h=>esc(h.nome)).join(', ')}. Falle da «Gestisci gli eroi».</small>`:''}`:'<p class="muted" style="margin:0">Nessun eroe: creane uno per partire.</p>'):
   '<p class="muted" style="margin:0">Per creare e salvare gli eroi serve il profilo online.</p>';
  return`<div class="modal"><div class="box col av"><h2>Cantari di Ventura ${infoH('Una campagna a capitoli: ogni sessione è un «cantare». Qui parti, riprendi e gestisci i tuoi eroi.')}</h2>
<p class="muted" style="margin:0">Una compagnia, una mappa a esagoni e la perdizione che avanza.</p>
${s?Avv.cartaCont(s):''}
${on?`<button class="b ${s?'':'gold '}ecta" data-a="avvnuova" ${pochi&&Eroi.lista?'disabled':''}>${ic('spada',18)} ${s?'Nuova campagna':'Parti in campagna'}</button>${pochi&&Eroi.lista?'<small class="muted" style="text-align:center">Prima crea un eroe.</small>':''}`:`<button class="b gold ecta" data-a="acc">Accedi per giocare</button>`}
<div class="sh2">I tuoi eroi</div>${eroi}
${on?`<button class="b ${pochi?'gold ':''}sm" data-a="eroi">${pochi?'Crea il tuo primo eroe':'Gestisci gli eroi'}</button>`:''}
${Bat.setupH()}
<div class="sh2">Compagni ${infoH('I compagni sono personaggi della storia che si uniscono alla compagnia lungo il cammino. Arriveranno con il primo capitolo.')}</div>
<p class="muted" style="margin:0">Nessun compagno ancora.</p>
<div class="sh2">Come si gioca</div>
<div class="av-come">${Avv.COME.map(([t,x])=>`<div><b>${esc(t)}</b> ${infoH(esc(x))}</div>`).join('')}</div>
<p class="acc-msg" role="status">${esc(Avv.msg)}</p></div></div>`},
 async act(a){
  if(a==='avv'){Plancia.chiudi();ui.avv=true;Avv.msg='';render();if(Avv.online()&&!Eroi.lista){await Eroi.carica()}return}
  if(a==='avvx'){ui.avv=false;return render()}
  if(a==='avvcontinua'){if(!Avv.inCorso())return render();ui.avv=false;ui.camp=true;return render()}
  if(a==='avvnuova'){if(Avv.busy)return;Avv.busy=true;Avv.msg='';render();
   try{await Camp.parti();if(Camp.msg){Avv.msg=Camp.msg;Camp.msg=''}else{ui.avv=false;ui.camp=true}}
   catch(e){console.warn('Avv',e);Avv.msg='Non riesco a leggere i tuoi eroi: riprova.'}
   finally{Avv.busy=false;render()}return}}};
