/* ---- Plancia: barra in basso a cinque destinazioni (Taverna, Giochi, Avventura, Amici, Profilo). Visibile nelle lobby, non in partita ---- */
const Plancia={
 last:'',
 vis(){return ui.screen==='room'&&!ui.tv&&!ui.bat&&!ui.camp},
 attivo(){return ui.avv||ui.eroi||ui.camp||ui.inv||ui.bat?'avventura':ui.amici||ui.dist||ui.tvm?'amici':ui.acc||ui.shop||ui.oste||ui.cfg?'profilo':ui.glist||ui.tab==='games'?'giochi':'taverna'},
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
   if(!busy&&top)h=btn('start',top.g.id,(MD?'Proponi ':'Gioca a ')+esc(top.g.name),top.v+' vot'+(top.v===1?'o':'i')+' al tavolo');
   else if(off)h=btn('resume','','Riprendi la partita','interrotta su questo telefono');
   else if(tc)h=btn('pl','amici','Tocca a te','hai '+tc+' partit'+(tc===1?'a':'e')+' a distanza')}
  document.documentElement.classList.toggle('has-dk',!!h);if(h!==Plancia.lastd){d.innerHTML=h;Plancia.lastd=h}},
 // Taverna: lobby personale. Da qui si sceglie se giocare da soli, sfidare un'amica a turni, usare lo schermo comune o entrare nella taverna (3D)
 // Taverna: lobby personale. In alto chi sei (monete, rete, musica), poi la scena, «Gioca ora», la stanza e i modi di giocare
 homeH(){const nm=esc(R.mine.name||ME.name||'viaggiatore'),h=new Date().getHours(),sal=h<6?'Buonanotte':h<13?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera',dist=Dist.ok&&Dist.ok(),tc=dist?Dist.tocca():0,
   off=!R.on&&(()=>{try{const g=JSON.parse(ST('rg-off')||'null')?.game;return g&&g.G?g:null}catch(e){return null}})(),N=members().length,tv=R.on&&R.code,coins=FB.st==='ok'&&FB.p?FB.p.coins:null;
  const net=R.on?'<span class="hm-st on">Online</span>':R.net==='prova'?'<span class="hm-st prova">Connessione…</span>':'<button class="hm-st off" data-a="retrynet" aria-label="Offline: tocca per riprovare a collegarti">Offline · riprova</button>';
  const chi=R.on?(N>1?`<b>${N-1}</b> ${N-1===1?'persona è':'persone sono'} ${N-1===1?'seduta':'sedute'} in taverna`:'Sei solo in taverna: invita qualcuno'):R.net==='prova'?'Mi collego alla taverna…':'Giochi su questo telefono, senza stanza online';
  const tile=(i,t,sub,a,v,dis)=>`<button class="hm-c" data-a="${a}"${v?` data-v="${v}"`:''}${dis?' disabled':''}><span class="ic0">${ic(i,26)}</span><b>${t}</b><small>${sub}</small></button>`;
  const rs=[];if(tc)rs.push(['Partite a distanza',`Tocca a te (${tc})`,'dist',1]);
  if(off){const g=GAMES.find(x=>x.id===(off.G&&off.G.g));rs.push([g?g.name:'Partita',g?'Riprendi la partita sul telefono':'Riprendi',  'resume',0])}
  const resume=rs.map(([t,sub,a,hot])=>`<button class="rw3${hot?' hot':''}" data-a="${a}"><span class="g"><b>${t}</b><small>${sub}</small></span>${ic('play',20)}</button>`).join('');
  const scena='<svg class="hm-sc" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="hmsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1626"/><stop offset="1" stop-color="#3b2748"/></linearGradient><radialGradient id="hmlt"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs><rect width="390" height="150" fill="url(#hmsk)"/><circle cx="318" cy="38" r="15" fill="#f6e7b8"/><circle cx="324" cy="34" r="13" fill="#0f1a2c" opacity=".35"/><g fill="#f6e7b8" class="hm-stars"><circle cx="40" cy="26" r="1.3"/><circle cx="96" cy="48" r="1"/><circle cx="150" cy="20" r="1.4"/><circle cx="214" cy="40" r="1"/><circle cx="262" cy="18" r="1.2"/><circle cx="356" cy="76" r="1"/><circle cx="24" cy="70" r="1"/></g><path d="M0 118 Q80 96 160 112 T390 104 V150 H0Z" fill="#14202a"/><g fill="#0c1a1c"><path d="M20 128l14-46 14 46zM46 132l12-38 12 38zM322 130l14-44 14 44zM352 134l12-36 12 36z"/></g><circle cx="196" cy="102" r="46" fill="url(#hmlt)"/><g><rect x="160" y="88" width="72" height="44" fill="#2a1a10"/><path d="M152 90l44-34 44 34z" fill="#3b2418"/><rect x="214" y="58" width="9" height="20" fill="#2a1a10"/><rect x="180" y="100" width="18" height="16" fill="#ffc866" class="hm-win"/><rect x="204" y="106" width="16" height="26" fill="#1b110a"/></g><path d="M0 128 Q120 120 200 130 T390 126 V150 H0Z" fill="#101a18"/></svg>';
  return`<div class="hm"><div class="hm-bar"><span class="av2">${esc((R.mine.name||ME.name||'?')[0]||'?')}</span><div class="hm-who"><b>${nm}</b>${coins!==null?`<small>${ic('moneta',14)} ${coins} monete</small>`:'<small>Profilo su questo telefono</small>'}</div>${net}<button class="ib" data-a="mus" aria-label="Musica">${ic('nota',22)}</button></div>
<div class="hm-hero">${scena}<div class="hm-hi"><small>${sal},</small><h1>${nm}</h1><p>${chi}</p></div></div>
<button class="b play hm-go" data-a="pl" data-v="giochi"><span>Gioca ora</span>${ic('play',22)}</button>
<div class="hm-duo"><button class="b" data-a="newroom"${R.on?'':' disabled'}>Crea stanza</button><button class="b" data-a="codice"${R.on?'':' disabled'}>Entra con codice</button></div>
${resume?`<div class="sh2">Da riprendere</div>${resume}`:''}
<div class="sh2">Altri modi di giocare</div>
<div class="hm-grid">${tile('utente','Gioca da solo','Solitari e partite con i bot','pl','solo')}${tile('globo','Sfida a distanza','A turni, anche a giorni di distanza',dist&&FB.mail()?'dist':'acc','',false)}${tile('tv','Schermo comune','Il tavolo sulla TV o sul PC','tvm','',!tv)}${tile('fuoco','Entra nella taverna',N>1?N+' persone sedute adesso':'Il locale in 3D','pl','entra',false)}</div>
</div>`},
 // Giochi: catalogo con ricerca, categorie, gioco in evidenza e scheda di dettaglio
 giochiH(){const N=lobbySeats().length,T=tally(N),MD=multiDev(),busy=R.on&&R.doc&&R.doc.phase==='play',myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))];
  const list=GAMES.filter(g=>!ui.solo||g.ok(1)).map(g=>({g,ok:g.ok(N),v:MD?T[g.id]||0:0})).sort((x,y)=>(y.ok-x.ok)||(y.v-x.v)),cat=ui.cat||'tutti',q=(ui.q||'').trim().toLowerCase(),
   order=['classici','strategia','squadra','festa'].filter(k=>list.some(x=>tvInfo(x.g)[0]===k)),
   vis=list.filter(x=>(cat==='tutti'||(cat==='solo'?x.g.ok(1):tvInfo(x.g)[0]===cat))&&(!q||x.g.name.toLowerCase().includes(q))),
   pick=list.find(x=>x.g.id===ui.pick),feat=list.find(x=>x.ok&&x.v>0)||list.find(x=>x.ok);
  const col=x=>{const k=tvInfo(x.g)[0],b=TVB[x.g.id],c=b?b.c:[TVC[k].f,TVC[k].s,TVC[k].e];return`--c1:${c[0]};--c2:${c[1]}`};
  const tabs=[['tutti','Tutti'],...order.map(k=>[k,TVC[k].n[0]+TVC[k].n.slice(1).toLowerCase()]),...(ui.solo?[]:[['solo','Da soli']])].map(([k,l])=>`<button class="${cat===k?'on':''}" data-a="tvcat" data-v="${k}" aria-pressed="${cat===k}">${l}</button>`).join('');
  const band=feat&&!q&&cat==='tutti'?`<div class="gl-feat" style="${col(feat)}"><span class="eye">${feat.v?'IL PIÙ VOTATO':'CONSIGLIATO PER '+N+(N===1?' GIOCATORE':' GIOCATORI')}</span><h2>${esc(feat.g.name)}</h2><p>${esc(feat.g.desc)}</p><button class="pri" data-a="${busy?'tvpick':'start'}" data-v="${feat.g.id}"${busy?' disabled':''}><span>${MD?'Proponi':'Gioca'}</span>${ic('play',22)}</button></div>`:'';
  const tiles=vis.map(x=>{const g=x.g,k=tvInfo(g)[0];return`<button class="gl-t${x.ok?'':' off'}${pick&&pick.g===g?' on':''}" data-a="tvpick" data-v="${g.id}" style="${col(x)}" aria-label="${esc(g.name)}, ${g.range} giocatori${x.ok?'':', non disponibile con '+N}"><span class="cv"><i>${TVC[k].n}</i>${COP.svg(g.id,k)}</span><span class="tx"><b>${esc(g.name)}</b><small>${g.range} giocatori${MD&&x.v?' · '+ic('star',11)+' '+x.v:''}</small></span></button>`}).join('');
  const sheet=pick?`<div class="gl-sheet"><button class="gl-x" data-a="pickx" aria-label="Chiudi la scheda">${ic('x',18)}</button>${tvDet(pick,N,MD,myKeys,busy)}</div>`:'';
  return`<div class="gl"><div class="gl-h"><h1>${ui.solo?'Da solo':'Giochi'}</h1></div>
<input type="text" id="tvq" class="gl-q" placeholder="Cerca un gioco" aria-label="Cerca un gioco" value="${esc(ui.q||'')}" autocomplete="off"><div class="gl-tabs">${tabs}</div>
<div class="gl-grid">${tiles||'<p class="muted" style="padding:20px">Nessun gioco trovato.</p>'}</div><p class="gl-cr">Illustrazioni: <a href="https://game-icons.net" target="_blank" rel="noopener">game-icons.net</a>, CC BY 3.0</p>${sheet}<div class="err" role="alert">${esc(ui.err||'')}</div></div>`},
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
 chiudi(){ui.amici=false;ui.solo=false;ui.pick=null;ui.cfg=ui.acc=ui.shop=ui.oste=ui.dist=ui.tvm=ui.eroi=ui.camp=ui.inv=ui.avv=ui.bat=ui.rules=false},
 act(v){Plancia.chiudi();ui.err='';
  if(v==='taverna'){const era=!ui.glist&&!ui.amici&&ui.tab!=='games'&&ui.inroom;ui.glist=false;ui.solo=false;ui.tab='room';if(era)ui.inroom=false;return render()}
  if(v==='solo'){ui.solo=true;ui.glist=true;ui.tab='games';ui.cat='tutti';ui.pick=null;ui.q='';return render()}
  if(v==='entra'){ui.inroom=true;ui.glist=false;ui.tab='room';return render()}
  if(v==='giochi'){ui.glist=true;ui.tab='games';return render()}
  if(v==='avventura')return Avv.act('avv');
  if(v==='amici'){ui.amici=true;return render()}
  ui.cfg=true;render()}};
