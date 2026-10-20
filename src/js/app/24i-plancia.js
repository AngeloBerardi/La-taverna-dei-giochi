/* ---- Plancia: barra in basso a cinque destinazioni (Taverna, Giochi, Avventura, Amici, Profilo). Visibile nelle lobby, non in partita ---- */
const Plancia={
 last:'',
 vis(){return ui.screen==='room'&&!ui.tv},
 attivo(){return ui.eroi||ui.camp?'avventura':ui.dist||ui.tvm?'amici':ui.acc||ui.shop||ui.oste||ui.cfg?'profilo':ui.glist||ui.tab==='games'?'giochi':'taverna'},
 VOCI:[['taverna','Taverna','casa'],['giochi','Giochi','dado'],['avventura','Avventura','mappa'],['amici','Amici','amici'],['profilo','Profilo','utente']],
 draw(){let el=document.getElementById('plancia');if(!el){el=document.createElement('nav');el.id='plancia';el.setAttribute('aria-label','Navigazione principale');document.body.appendChild(el)}
  const v=Plancia.vis();document.documentElement.classList.toggle('has-pl',v);if(!v){document.documentElement.classList.remove('pg');return}
  const a=Plancia.attivo();document.documentElement.classList.toggle('pg',a!=='taverna'&&a!=='giochi'&&!ui.joinm&&!ui.rules);
  const h=Plancia.VOCI.map(([k,n,i])=>`<button data-a="pl" data-v="${k}" class="${k===a?'on':''}" aria-label="${n}" ${k===a?'aria-current="page"':''}>${ic(i,24)}<span>${n}</span></button>`).join('');
  if(h!==Plancia.last){el.innerHTML=h;Plancia.last=h}Plancia.dock(a)},
 // Dock della Taverna: azione principale in ottone + tre azioni rapide, sempre sopra la plancia
 dock(a){let d=document.getElementById('dock');if(!d){d=document.createElement('div');d.id='dock';document.body.appendChild(d)}
  const on=a==='taverna'&&!ui.joinm&&!ui.rules&&!ui.avk&&ui.avk!==0;document.documentElement.classList.toggle('has-dk',on);if(!on)return;
  const N=lobbySeats().length,T=tally(N),MD=multiDev(),busy=R.on&&R.doc&&R.doc.phase==='play',
   top=GAMES.map(g=>({g,ok:g.ok(N),v:MD?T[g.id]||0:0})).sort((x,y)=>(y.ok-x.ok)||(y.v-x.v)).find(x=>x.ok&&x.v>0);
  const cel=(i,t,act,v,dis)=>`<button data-a="${act}"${v?` data-v="${v}"`:''}${dis?' disabled':''}>${ic(i,20)}<span>${t}</span></button>`;
  const prim=busy?'<button class="pri" disabled><span>Partita in corso</span></button>':top?`<button class="pri" data-a="start" data-v="${top.g.id}"><span>Gioca a ${esc(top.g.name)}</span>${ic('play',26)}</button>`:`<button class="pri" data-a="pl" data-v="giochi"><span>Gioca ora</span>${ic('play',26)}</button>`;
  const h=`<div class="cells3">${cel('amici','Invita','copy','',!R.on)}${cel('plus','Nuovo tavolo','newroom','',!R.on)}${cel('chiave','Codice','pl','codice',false)}</div>${prim}`;
  if(h!==Plancia.lastd){d.innerHTML=h;Plancia.lastd=h}},
 joinH(){return`<div class="modal"><div class="box col"><h2>Entra con un codice</h2><p class="muted" style="margin:0">Scrivi il codice del tavolo che ti hanno mandato.</p><input class="acc-in" type="text" id="plc" maxlength="6" placeholder="Codice" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;font-size:22px;letter-spacing:.2em;text-align:center"><div class="row"><button class="b gold" data-a="join" style="flex:1">Entra</button><button class="b" data-a="pl" data-v="taverna">Annulla</button></div><p class="acc-msg" role="status">${esc(ui.err||'')}</p></div></div>`},
 chiudi(){ui.joinm=false;ui.cfg=ui.acc=ui.shop=ui.oste=ui.dist=ui.tvm=ui.eroi=ui.camp=ui.rules=false},
 act(v){Plancia.chiudi();ui.err='';
  if(v==='codice'){ui.joinm=true;ui.err='';return render()}
  if(v==='taverna'){ui.glist=false;ui.tab='room';return render()}
  if(v==='giochi'){ui.glist=true;ui.tab='games';return render()}
  if(v==='avventura')return Eroi.act('eroi');
  if(v==='amici'){if(FB.st==='ok')return Dist.act('dist');ui.cfg=true;return render()}
  ui.cfg=true;render()}};
