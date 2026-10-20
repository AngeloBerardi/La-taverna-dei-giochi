/* ---- Plancia: barra in basso a cinque destinazioni (Taverna, Giochi, Avventura, Amici, Profilo). Visibile nelle lobby, non in partita ---- */
const Plancia={
 last:'',
 vis(){return ui.screen==='room'&&!ui.tv},
 attivo(){return ui.eroi||ui.camp?'avventura':ui.dist||ui.tvm?'amici':ui.acc||ui.shop||ui.oste||ui.cfg?'profilo':ui.glist||ui.tab==='games'?'giochi':'taverna'},
 VOCI:[['taverna','Taverna','casa'],['giochi','Giochi','dado'],['avventura','Avventura','mappa'],['amici','Amici','amici'],['profilo','Profilo','utente']],
 draw(){let el=document.getElementById('plancia');if(!el){el=document.createElement('nav');el.id='plancia';el.setAttribute('aria-label','Navigazione principale');document.body.appendChild(el)}
  const v=Plancia.vis();document.documentElement.classList.toggle('has-pl',v);if(!v)return;
  const a=Plancia.attivo(),h=Plancia.VOCI.map(([k,n,i])=>`<button data-a="pl" data-v="${k}" class="${k===a?'on':''}" aria-label="${n}" ${k===a?'aria-current="page"':''}>${ic(i,24)}<span>${n}</span></button>`).join('');
  if(h!==Plancia.last){el.innerHTML=h;Plancia.last=h}},
 chiudi(){ui.cfg=ui.acc=ui.shop=ui.oste=ui.dist=ui.tvm=ui.eroi=ui.camp=ui.rules=false},
 act(v){Plancia.chiudi();ui.err='';
  if(v==='taverna'){ui.glist=false;ui.tab='room';return render()}
  if(v==='giochi'){ui.glist=true;ui.tab='games';return render()}
  if(v==='avventura')return Eroi.act('eroi');
  if(v==='amici'){if(FB.st==='ok')return Dist.act('dist');ui.cfg=true;return render()}
  if(FB.st==='ok'&&FB.p)return Acc.act('acc');ui.cfg=true;render()}};
