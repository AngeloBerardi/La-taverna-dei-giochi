/* ---- Plancia: barra in basso a cinque destinazioni (Taverna, Giochi, Avventura, Amici, Profilo). Visibile nelle lobby, non in partita ---- */
const Plancia={
 last:'',
 vis(){return ui.screen==='room'&&!ui.tv},
 attivo(){return ui.eroi||ui.camp?'avventura':ui.amici||ui.dist||ui.tvm?'amici':ui.acc||ui.shop||ui.oste||ui.cfg?'profilo':ui.glist||ui.tab==='games'?'giochi':'taverna'},
 VOCI:[['taverna','Taverna','casa'],['giochi','Giochi','dado'],['avventura','Avventura','mappa'],['amici','Amici','amici'],['profilo','Profilo','utente']],
 draw(){let el=document.getElementById('plancia');if(!el){el=document.createElement('nav');el.id='plancia';el.setAttribute('aria-label','Navigazione principale');document.body.appendChild(el)}
  if(R.code!==Plancia.rc){Plancia.rc=R.code;if(R.code&&!isGen())ui.inroom=true}
  if(!Plancia.init){Plancia.init=1;if(/[?&](room|b|dist)=/.test(location.search))ui.inroom=true}
  const v=Plancia.vis();document.documentElement.classList.toggle('has-pl',v);if(!v){document.documentElement.classList.remove('pg');return}
  const a=Plancia.attivo();document.documentElement.classList.toggle('pg',a!=='taverna'&&a!=='giochi'&&!ui.rules);
  const h=Plancia.VOCI.map(([k,n,i])=>`<button data-a="pl" data-v="${k}" class="${k===a?'on':''}" aria-label="${n}" ${k===a?'aria-current="page"':''}>${ic(i,24)}<span>${n}</span></button>`).join('');
  if(h!==Plancia.last){el.innerHTML=h;Plancia.last=h}Plancia.dock(a)},
 // Dock della Taverna: compare solo quando c'è davvero qualcosa da fare adesso (gioco votato, partita interrotta, turno a distanza)
 dock(a){let d=document.getElementById('dock');if(!d){d=document.createElement('div');d.id='dock';document.body.appendChild(d)}
  let h='';if(a==='taverna'&&ui.inroom&&!ui.rules&&ui.avk==null){
   const N=lobbySeats().length,T=tally(N),MD=multiDev(),busy=R.on&&R.doc&&R.doc.phase==='play',
    top=GAMES.map(g=>({g,ok:g.ok(N),v:MD?T[g.id]||0:0})).sort((x,y)=>(y.ok-x.ok)||(y.v-x.v)).find(x=>x.ok&&x.v>0),
    off=!R.on&&(()=>{try{return JSON.parse(ST('rg-off')||'null')?.game}catch(e){return null}})(),tc=Dist.ok&&Dist.ok()?Dist.tocca():0;
   const btn=(act,v,t,sub)=>`<button class="pri" data-a="${act}"${v?` data-v="${v}"`:''}><span>${t}${sub?`<small>${sub}</small>`:''}</span>${ic('play',26)}</button>`;
   if(!busy&&top)h=btn('start',top.g.id,'Gioca a '+esc(top.g.name),top.v+' vot'+(top.v===1?'o':'i')+' al tavolo');
   else if(off)h=btn('resume','','Riprendi la partita','interrotta su questo telefono');
   else if(tc)h=btn('pl','amici','Tocca a te','hai '+tc+' partit'+(tc===1?'a':'e')+' a distanza')}
  document.documentElement.classList.toggle('has-dk',!!h);if(h!==Plancia.lastd){d.innerHTML=h;Plancia.lastd=h}},
 // Taverna: lobby personale. Da qui si sceglie se giocare da soli, sfidare un'amica a turni, usare lo schermo comune o entrare nella taverna (3D)
 homeH(){const nm=esc(R.mine.name||ME.name||'viaggiatore'),h=new Date().getHours(),sal=h<6?'Buonanotte':h<13?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera',dist=Dist.ok&&Dist.ok(),tc=dist?Dist.tocca():0,
   off=!R.on&&(()=>{try{return JSON.parse(ST('rg-off')||'null')?.game}catch(e){return null}})(),N=members().length,tv=R.on&&R.code;
  const card=(i,t,s,a,v,dis,cls)=>`<button class="hm-c ${cls||''}" data-a="${a}"${v?` data-v="${v}"`:''}${dis?' disabled':''}><span class="ic0">${ic(i,28)}</span><b>${t}</b></button>`;
  const resume=(tc?`<button class="rw3 hot" data-a="dist"><span class="g"><b>Tocca a te (${tc})</b></span>${ic('play',20)}</button>`:'')+(off?`<button class="rw3" data-a="resume"><span class="g"><b>Riprendi la partita</b></span>${ic('play',20)}</button>`:'');
  return`<div class="hm"><div class="hm-top"><div><small>${sal}</small><h1>${nm}</h1></div>${R.on?'<span class="hm-st on">Online</span>':R.net==='prova'?'<span class="hm-st prova">Connessione…</span>':'<button class="hm-st off" data-a="retrynet" aria-label="Offline: tocca per riprovare a collegarti">Offline · riprova</button>'}<button class="ib" data-a="mus" aria-label="Musica">${ic('nota',22)}</button></div>
<div class="hm-grid">${card('utente','Gioca da solo','Un solitario o una partita con i bot','pl','solo')}${card('globo','Sfida un\'amica','Partita a turni, anche a giorni di distanza',dist&&FB.mail()?'dist':'acc','',false)}${card('tv','Schermo comune','Mostra il tavolo sulla TV o sul PC','tvm','',!tv)}${card('fuoco','Entra nella taverna',N>1?N+' persone sedute adesso':'Il locale in 3D, da soli o in compagnia','pl','entra',false,'big')}</div>
${resume?`<div class="sh2">Da riprendere</div>${resume}`:''}
</div>`},
 // Giochi: catalogo con ricerca, categorie, gioco in evidenza e scheda di dettaglio
 giochiH(){const N=lobbySeats().length,T=tally(N),MD=multiDev(),busy=R.on&&R.doc&&R.doc.phase==='play',myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))];
  const list=GAMES.filter(g=>!ui.solo||g.ok(1)).map(g=>({g,ok:g.ok(N),v:MD?T[g.id]||0:0})).sort((x,y)=>(y.ok-x.ok)||(y.v-x.v)),cat=ui.cat||'tutti',q=(ui.q||'').trim().toLowerCase(),
   order=['classici','strategia','squadra'].filter(k=>list.some(x=>tvInfo(x.g)[0]===k)),
   vis=list.filter(x=>(cat==='tutti'||tvInfo(x.g)[0]===cat)&&(!q||x.g.name.toLowerCase().includes(q))),
   pick=list.find(x=>x.g.id===ui.pick),feat=list.find(x=>x.ok&&x.v>0)||list.find(x=>x.ok);
  const col=x=>{const k=tvInfo(x.g)[0],b=TVB[x.g.id],c=b?b.c:[TVC[k].f,TVC[k].s,TVC[k].e];return`--c1:${c[0]};--c2:${c[1]}`};
  const tabs=[['tutti','Tutti'],...order.map(k=>[k,TVC[k].n[0]+TVC[k].n.slice(1).toLowerCase()])].map(([k,l])=>`<button class="${cat===k?'on':''}" data-a="tvcat" data-v="${k}" aria-pressed="${cat===k}">${l}</button>`).join('');
  const band=feat&&!q&&cat==='tutti'?`<div class="gl-feat" style="${col(feat)}"><span class="eye">${feat.v?'IL PIÙ VOTATO':'CONSIGLIATO PER '+N+(N===1?' GIOCATORE':' GIOCATORI')}</span><h2>${esc(feat.g.name)}</h2><p>${esc(feat.g.desc)}</p><button class="pri" data-a="${busy?'tvpick':'start'}" data-v="${feat.g.id}"${busy?' disabled':''}><span>Gioca</span>${ic('play',22)}</button></div>`:'';
  const tiles=vis.map(x=>{const g=x.g,k=tvInfo(g)[0];return`<button class="gl-t${x.ok?'':' off'}${pick&&pick.g===g?' on':''}" data-a="tvpick" data-v="${g.id}" style="${col(x)}" aria-label="${esc(g.name)}, ${g.range} giocatori${x.ok?'':', non disponibile con '+N}"><span class="cv"><i>${TVC[k].n}</i><b>${tvInfo(g)[1]}</b></span><span class="tx"><b>${esc(g.name)}</b><small>${g.range} giocatori${MD&&x.v?' · '+ic('star',11)+' '+x.v:''}</small></span></button>`}).join('');
  const sheet=pick?`<div class="gl-sheet"><button class="gl-x" data-a="pickx" aria-label="Chiudi la scheda">${ic('x',18)}</button>${tvDet(pick,N,MD,myKeys,busy)}</div>`:'';
  return`<div class="gl"><div class="gl-h"><h1>${ui.solo?'Da solo':'Giochi'}</h1></div>
<input type="text" id="tvq" class="gl-q" placeholder="Cerca un gioco" aria-label="Cerca un gioco" value="${esc(ui.q||'')}" autocomplete="off"><div class="gl-tabs">${tabs}</div>
<div class="gl-grid">${tiles||'<p class="muted" style="padding:20px">Nessun gioco trovato.</p>'}</div>${sheet}<div class="err" role="alert">${esc(ui.err||'')}</div></div>`},
 // Amici: stanza, codice, invito, ospiti, partite a distanza e schermo comune in un'unica pagina
 amiciH(){const M=members(),N=lobbySeats().length,gen=isGen();
  const mem=M.map(m=>`<div class="rw2"><span class="av2">${esc((m.name||'?')[0])}</span><span class="g">${esc(m.name||'?')}${m.id===ME.dev?' (tu)':''}</span>${m.id!==ME.dev&&R.on?`<button class="x2" data-a="rmmember" data-v="${m.id}" aria-label="Rimuovi ${esc(m.name)}">${ic('x',16)}</button>`:''}</div>${(m.guests||[]).map(g=>`<div class="rw2"><span class="av2 gs">${esc(g.name[0]||'?')}</span><span class="g">${esc(g.name)} <small class="muted">ospite di ${esc(m.name)}</small></span>${m.id===ME.dev?`<button class="x2" data-a="rmguest" data-v="${g.k}" aria-label="Rimuovi ${esc(g.name)}">${ic('x',16)}</button>`:''}</div>`).join('')}`).join('');
  const tiles=(Dist.cfgH()+TV.cfgH());
  return`<div class="modal"><div class="box col am"><h2>Amici</h2>
<div class="sh2">Il tavolo</div>
<div class="am-room"><div><b>${R.on?(gen?'Stanza generale':'Stanza privata '+esc(R.code))+' · '+N:'Offline'}</b></div>${R.on?'<button class="b gold sm" data-a="copy">Copia invito</button>':'<button class="b sm" data-a="retrynet">Riprova</button>'}</div>
<div class="am-list">${mem}</div>
<div class="row"><input type="text" id="gname" maxlength="14" placeholder="Nome ospite" class="acc-in" style="flex:1"><button class="b sm" data-a="addguest">Aggiungi ospite</button></div>
${R.on?`<div class="sh2">Un altro tavolo</div><div class="row"><input type="text" id="plc" maxlength="6" placeholder="Codice" class="acc-in" autocomplete="off" autocapitalize="characters" style="flex:1;text-transform:uppercase;letter-spacing:.2em"><button class="b gold sm" data-a="join">Entra</button></div><div class="row"><button class="b sm" data-a="newroom" style="flex:1">Nuovo tavolo privato</button>${gen?'':'<button class="b sm" data-a="genroom" style="flex:1">Stanza generale</button>'}</div>`:''}
${tiles?`<div class="sh2">Più modi di giocare</div><div class="cfgtiles">${tiles}</div>`:''}
<p class="acc-msg" role="status">${esc(ui.err||'')}</p></div></div>`},
 chiudi(){ui.amici=false;ui.solo=false;ui.pick=null;ui.cfg=ui.acc=ui.shop=ui.oste=ui.dist=ui.tvm=ui.eroi=ui.camp=ui.rules=false},
 act(v){Plancia.chiudi();ui.err='';
  if(v==='taverna'){const era=!ui.glist&&!ui.amici&&ui.tab!=='games'&&ui.inroom;ui.glist=false;ui.solo=false;ui.tab='room';if(era)ui.inroom=false;return render()}
  if(v==='solo'){ui.solo=true;ui.glist=true;ui.tab='games';ui.cat='tutti';ui.pick=null;ui.q='';return render()}
  if(v==='entra'){ui.inroom=true;ui.glist=false;ui.tab='room';return render()}
  if(v==='giochi'){ui.glist=true;ui.tab='games';return render()}
  if(v==='avventura')return Eroi.act('eroi');
  if(v==='amici'){ui.amici=true;return render()}
  ui.cfg=true;render()}};
