/* ---- Plancia: barra in basso a cinque destinazioni (Taverna, Giochi, Avventura, Amici, Profilo). Visibile nelle lobby, non in partita ---- */
const Plancia={
 last:'',
 vis(){return ui.screen==='room'&&!ui.tv&&!ui.bat&&!ui.camp&&!ui.dia&&!ui.ses},
 attivo(){return ui.avv||ui.eroi||ui.camp||ui.inv||ui.bat||ui.dia||ui.ses?'avventura':ui.amici||ui.dist||ui.tvm?'amici':ui.acc||ui.shop||ui.oste||ui.cfg?'profilo':ui.glist||ui.tab==='games'?'giochi':'taverna'},
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
 // Taverna: lobby personale. In alto chi sei (monete, rete, musica), poi la scena del crocevia (3D con Crocevia, 24ia; altrimenti disegnata) e il palo con le insegne: «Gioca ora», la stanza e i modi di giocare
 homeH(){const nm=esc(R.mine.name||ME.name||'viaggiatore'),h=new Date().getHours(),sal=h<6?'Buonanotte':h<13?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera',dist=Dist.ok&&Dist.ok(),tc=dist?Dist.tocca():0,
   off=!R.on&&(()=>{try{const g=JSON.parse(ST('rg-off')||'null')?.game;return g&&g.G?g:null}catch(e){return null}})(),N=members().length,tv=R.on&&R.code,coins=FB.st==='ok'&&FB.p?FB.p.coins:null;
  const net=R.on?'<span class="hm-st on">Online</span>':R.net==='prova'?'<span class="hm-st prova">Connessione…</span>':'<button class="hm-st off" data-a="retrynet" aria-label="Offline: tocca per riprovare a collegarti">Offline · riprova</button>';
  const chi=R.on?(N>1?`<b>${N-1}</b> ${N-1===1?'persona è':'persone sono'} ${N-1===1?'seduta':'sedute'} in taverna`:'Sei solo in taverna: invita qualcuno'):R.net==='prova'?'Mi collego alla taverna…':'Giochi su questo telefono, senza stanza online';
  const tile=(i,t,sub,a,v,dis,lato,cv)=>`<button class="hm-c hm-sg ${lato}" data-a="${a}"${v?` data-v="${v}"`:''} data-cv="${cv}"${dis?' disabled':''} aria-label="${t}: ${sub}">${ic(i,20)}<b>${t}</b></button>`;
  const rs=[];if(tc)rs.push(['Partite a distanza',`Tocca a te (${tc})`,'dist',1]);
  if(off){const g=GAMES.find(x=>x.id===(off.G&&off.G.g));rs.push([g?g.name:'Partita',g?'Riprendi la partita sul telefono':'Riprendi',  'resume',0])}
  const resume=rs.map(([t,sub,a,hot])=>`<button class="rw3${hot?' hot':''}" data-a="${a}"><span class="g"><b>${t}</b><small>${sub}</small></span>${ic('play',20)}</button>`).join('');
  const scena='<svg class="hm-sc" viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="hmsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a14"/><stop offset=".6" stop-color="#101a2c"/><stop offset="1" stop-color="#2c4257"/></linearGradient>'
   +'<radialGradient id="hmlt"><stop offset="0" stop-color="#f6b94a" stop-opacity=".6"/><stop offset="1" stop-color="#f6b94a" stop-opacity="0"/></radialGradient></defs><rect width="390" height="300" fill="url(#hmsk)"/>'
   +'<g fill="#e8e4d4" class="hm-stars"><circle cx="40" cy="36" r="1.3"/><circle cx="96" cy="68" r="1"/><circle cx="150" cy="30" r="1.4"/><circle cx="214" cy="56" r="1"/><circle cx="262" cy="24" r="1.2"/><circle cx="356" cy="96" r="1"/><circle cx="24" cy="100" r="1"/></g>'
   +'<circle cx="312" cy="62" r="20" fill="#ece5c8"/><path d="M0 196l14-34 12 26 16-48 15 44 13-30 14 36 15-52 16 50 12-28 15 34 14-44 15 42 13-30 15 36 16-50 14 46 13-28 15 32 14-44 16 46 13-30 14 34 15-48 15 46 15-36V300H0z" fill="#22344a"/>'
   +'<path d="M0 226l20-46 18 40 22-64 20 60 20-44 20 50 22-70 20 66 20-40 20 48 22-62 20 58 20-44 20 50 22-66 20 62 20-42 20 46 14-30V300H0z" fill="#132030"/><rect y="236" width="390" height="64" fill="#0b1118"/>'
   +'<path d="M150 300L190 240h10l40 60zM0 262l188-22v8L0 286zM390 262L202 240v8l188 38z" fill="#2a2620"/><circle cx="195" cy="150" r="80" fill="url(#hmlt)"/><rect x="191" y="154" width="8" height="92" fill="#3e2714"/>'
   +'<path d="M199 172h44l10 9-10 9h-44zM191 200h-44l-10 9 10 9h44z" fill="#6b4526"/><path class="hm-win" d="M195 126c8 10 9 18 0 28-9-10-8-18 0-28z" fill="#ffc45a"/></svg>';
  return`<div class="hm"><div class="hm-bar"><span class="av2">${esc((R.mine.name||ME.name||'?')[0]||'?')}</span><div class="hm-who"><b>${nm}</b>${coins!==null?`<small>${ic('moneta',14)} ${coins} monete</small>`:'<small>Profilo su questo telefono</small>'}</div>${net}<button class="ib" data-a="mus" aria-label="Musica">${ic('nota',22)}</button></div>
<div class="hm-hero">${scena}<div class="hm-hi"><small>${sal},</small><h1>${nm}</h1><p>${chi}</p></div></div>
<div class="hm-cro"><i class="hm-post" aria-hidden="true"></i>
<button class="b play hm-go" data-a="pl" data-v="giochi" data-cv="0"><span>Gioca ora</span>${ic('play',22)}</button>
<div class="hm-duo"><button class="hm-sg r a" data-a="newroom" data-cv="45"${R.on?'':' disabled'}>${ic('plus',20)}<b>Crea stanza</b></button><button class="hm-sg l a" data-a="codice" data-cv="-45"${R.on?'':' disabled'}>${ic('chiave',20)}<b>Entra con codice</b></button></div>
<div class="hm-grid">${tile('utente','Gioca da solo','Solitari e partite con i bot','pl','solo',false,'r',90)}${tile('globo','Sfida a distanza','A turni, anche a giorni di distanza',dist&&FB.mail()?'dist':'acc','',false,'l',-90)}
${tile('tv','Schermo comune','Il tavolo sulla TV o sul PC','tvm','',!tv,'r',135)}${tile('fuoco','Entra nella taverna',N>1?N+' persone sedute adesso':'Il locale in 3D','pl','entra',false,'l',0)}</div></div>
${resume?`<div class="sh2">Da riprendere</div>${resume}`:''}
</div>`},
 // Giochi: catalogo con ricerca, categorie, gioco in evidenza e scheda di dettaglio
 giochiH(){const N=lobbySeats().length,T=tally(N),MD=multiDev(),busy=R.on&&R.doc&&R.doc.phase==='play',myKeys=[{k:'m',name:R.mine.name||ME.name},...(R.mine.guests||[]).map(g=>({k:g.k,name:g.name}))];
  const list=GAMES.filter(g=>!ui.solo||g.ok(1)).map(g=>({g,ok:g.ok(N),v:MD?T[g.id]||0:0})).sort((x,y)=>(y.ok-x.ok)||(y.v-x.v)),cat=ui.cat||'tutti',q=(ui.q||'').trim().toLowerCase(),
   order=['classici','strategia','squadra','festa'].filter(k=>list.some(x=>tvInfo(x.g)[0]===k)),
   vis=list.filter(x=>(cat==='tutti'||(cat==='solo'?x.g.ok(1):tvInfo(x.g)[0]===cat))&&(!q||x.g.name.toLowerCase().includes(q))),
   pick=list.find(x=>x.g.id===ui.pick),feat=list.find(x=>x.ok&&x.v>0)||list.find(x=>x.ok);
  const col=x=>{const k=tvInfo(x.g)[0],b=TVB[x.g.id],c=b?b.c:[TVC[k].f,TVC[k].s,TVC[k].e];return`--c1:${c[0]};--c2:${c[1]}`};
  const tabs=[['tutti','Tutti'],...order.map(k=>[k,TVC[k].n[0]+TVC[k].n.slice(1).toLowerCase()]),...(ui.solo?[]:[['solo','Da soli']])].map(([k,l])=>`<button class="${cat===k?'on':''}" data-a="tvcat" data-v="${k}" aria-pressed="${cat===k}">${l}</button>`).join('');
  const band=feat&&!q&&cat==='tutti'?`<div class="gl-feat${COPIMG.includes(feat.g.id)?' bx':''}" style="${col(feat)}${COPIMG.includes(feat.g.id)?`;--cv:url(/assets/copertine/${feat.g.id}.webp)`:''}"><span class="eye">${feat.v?'IL PIÙ VOTATO':'CONSIGLIATO PER '+N+(N===1?' GIOCATORE':' GIOCATORI')}</span><h2>${esc(feat.g.name)}</h2><p>${esc(feat.g.desc)}</p><button class="pri" data-a="${busy?'tvpick':'start'}" data-v="${feat.g.id}"${busy?' disabled':''}><span>${MD?'Proponi':'Gioca'}</span>${ic('play',22)}</button></div>`:'';
  const tiles=vis.map(x=>{const g=x.g,k=tvInfo(g)[0];return`<button class="gl-t${COPIMG.includes(g.id)?' bx':''}${x.ok?'':' off'}${pick&&pick.g===g?' on':''}" data-a="tvpick" data-v="${g.id}" style="${col(x)}" aria-label="${esc(g.name)}, ${g.range} giocatori${x.ok?'':', non disponibile con '+N}"><span class="cv"><i>${TVC[k].n}</i>${COPIMG.includes(g.id)?`<img class="art ph" src="/assets/copertine/${g.id}.webp" alt="" loading="lazy" decoding="async">`:COP.svg(g.id,k)}</span><span class="tx"><b>${esc(g.name)}</b><small>${g.range} giocatori${MD&&x.v?' · '+ic('star',11)+' '+x.v:''}</small></span></button>`}).join('');
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
 chiudi(){ui.amici=false;ui.solo=false;ui.pick=null;ui.cfg=ui.acc=ui.shop=ui.oste=ui.dist=ui.tvm=ui.eroi=ui.camp=ui.inv=ui.avv=ui.bat=ui.dia=ui.ses=ui.rules=false},
 act(v){Plancia.chiudi();ui.err='';
  if(v==='taverna'){const era=!ui.glist&&!ui.amici&&ui.tab!=='games'&&ui.inroom;ui.glist=false;ui.solo=false;ui.tab='room';if(era)ui.inroom=false;return render()}
  if(v==='solo'){ui.solo=true;ui.glist=true;ui.tab='games';ui.cat='tutti';ui.pick=null;ui.q='';return render()}
  if(v==='entra'){ui.inroom=true;ui.glist=false;ui.tab='room';return render()}
  if(v==='giochi'){ui.glist=true;ui.tab='games';return render()}
  if(v==='avventura')return Avv.act('avv');
  if(v==='amici'){ui.amici=true;return render()}
  ui.cfg=true;render()}};
