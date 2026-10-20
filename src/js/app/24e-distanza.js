/* ---- Partite a distanza: stanze salvate su Firestore, per giocare a turni anche a giorni di distanza ----
   FsDb ha la stessa interfaccia di R.db (doc/collection: get, set, delete, onSnapshot): il resto dell'app (stanza, lobby,
   partita) non sa se sotto c'è il p2p o Firestore. Dati puri: motori/25-distanza.js. Regole: firestore.rules (`partite`). */
const FsDb={
 P(path){const a=path.split('/');if(a[0]!=='rooms')throw new Error('percorso non valido');a[0]='partite';if(a[2]==='members')a[2]='membri';return a},
 ref(path){return FB.m.F.doc(FB.db,...FsDb.P(path))},
 snap(s){const ex=s.exists();return{exists:ex,id:s.id,data:()=>ex?DIST.de(s.data()):undefined}},
 // la stanza si scrive in transazione: gli uid già presenti non si perdono e un telefono rimasto indietro non cancella una mossa più recente
 async setRoom(code,d){const F=FB.m.F,ref=F.doc(FB.db,'partite',code);
  await F.runTransaction(FB.db,async tx=>{const cur=await tx.get(ref),old=cur.exists()?cur.data():null;
   if(old&&old.rev!=null&&d.rev!=null&&old.rev>d.rev){const e=new Error('conflitto');e.code='conflitto';throw e}
   tx.set(ref,{j:DIST.ser(d),...DIST.meta(d,old,FB.uid),rev:d.rev||0,upd:F.serverTimestamp()})})},
 doc(path){const seg=FsDb.P(path),stanza=seg.length===2,F=()=>FB.m.F;return{
  get:async()=>FsDb.snap(await F().getDoc(FsDb.ref(path))),
  set:async d=>stanza?FsDb.setRoom(seg[1],d):F().setDoc(FsDb.ref(path),{j:DIST.ser(d),t:d.t||Date.now()}),
  delete:()=>F().deleteDoc(FsDb.ref(path)),
  onSnapshot:(n,er)=>F().onSnapshot(FsDb.ref(path),s=>n(FsDb.snap(s)),er)}},
 collection(path){return{doc:id=>FsDb.doc(path+'/'+id),
  onSnapshot:(n,er)=>FB.m.F.onSnapshot(FB.m.F.collection(FB.db,...FsDb.P(path)),q=>n({docs:q.docs.map(d=>FsDb.snap(d))}),er)}}};
const Dist={
 righe:null,msg:'',busy:false,prev:null,visti:{},codice:'',
 ok(){return FB.st==='ok'&&!!FB.p},
 tocca(){return(Dist.righe||[]).filter(r=>r.tocca).length},
 cfgH(){return Dist.ok()?`<button class="b sm" data-a="dist">Partite a distanza 🌍${Dist.tocca()?' <b class="badge">'+Dist.tocca()+'</b>':''}</button>`:''},
 nomeGioco(id){const g=GAMES.find(x=>x.id===id);return g?g.name:id},
 invito(c){return location.origin+location.pathname+'?dist='+c},
 html(){const fs=R.mode==='fs'&&R.code;
  const riga=r=>`<div class="drow ${r.tocca?'tocca':''}"><div class="dtx"><b>${esc(r.gioco||'In attesa di avvio')}</b> <small>${esc(r.code)} · ${esc(r.fase)}${r.giocatori?' · '+esc(r.giocatori.join(', ')):' · '+r.n+(r.n===1?' persona':' persone')}</small>${r.tocca?'<span class="chip on">Tocca a te</span>':''}</div>
<div class="row"><button class="b sm" data-a="distgo" data-v="${esc(r.code)}">Entra</button>${r.mia?`<button class="b sm" data-a="distdel" data-v="${esc(r.code)}" aria-label="Elimina la partita ${esc(r.code)}">🗑</button>`:''}</div></div>`;
  return`<div class="modal"><div class="box col"><h2>Partite a distanza</h2>
<p class="muted" style="margin:0">Un tavolo che resta aperto: giocate a turni, anche a ore o giorni di distanza. Ognuno rientra quando può.</p>
${fs?`<div class="drow tocca"><div class="dtx"><b>Sei nella partita ${esc(R.code)}</b><small>Mandane il link agli amici</small></div><div class="row"><button class="b sm gold" data-a="distcopy">Copia invito</button><button class="b sm" data-a="distexit">Esci</button></div></div>`:''}
<div class="row"><button class="b sm gold" data-a="distnew" ${Dist.busy?'disabled':''}>Nuova partita</button></div>
<div class="row"><input class="acc-in" id="dist-c" type="text" maxlength="8" placeholder="Codice o link" autocomplete="off" value="${esc(Dist.codice)}" style="flex:1;text-transform:uppercase"><button class="b sm" data-a="distjoin" ${Dist.busy?'disabled':''}>Entra</button></div>
<h3 style="margin:4px 0 0">Le mie partite</h3>
${Dist.righe==null?'<p class="muted">Carico…</p>':Dist.righe.length?Dist.righe.map(riga).join(''):'<p class="muted">Nessuna partita: creane una e invita gli amici.</p>'}
${'Notification'in window&&Notification.permission==='default'?'<button class="b sm" data-a="distnot">Avvisami quando tocca a me</button>':''}
<p class="acc-msg" role="status">${esc(Dist.msg)}</p><button class="b sm" data-a="distx">Chiudi</button></div></div>`},
 async aggiorna(){if(!Dist.ok())return;
  try{const F=FB.m.F,q=await F.getDocs(F.query(F.collection(FB.db,'partite'),F.where('uids','array-contains',FB.uid),F.limit(30)));
   const nuove=DIST.ordina(q.docs.map(d=>DIST.riassunto(d.id,d.data(),FB.uid,Dist.nomeGioco)));
   for(const r of nuove)if(r.tocca&&Dist.righe&&!Dist.visti[r.code+'|'+r.gioco+'|'+r.fase+'|t'])Dist.avvisa(r);
   for(const r of nuove)if(r.tocca)Dist.visti[r.code+'|'+r.gioco+'|'+r.fase+'|t']=1;
   Dist.righe=nuove}catch(e){console.warn('Partite a distanza',e);Dist.msg='Non riesco a leggere le partite';if(!Dist.righe)Dist.righe=[]}
  if(ui.dist||ui.cfg)render()},
 // «tocca a te» mentre l'app è aperta: avviso a schermo e, se permesso e la pagina è in secondo piano, notifica
 avvisa(r){const t='Tocca a te: '+(r.gioco||r.code);if(document.hidden&&'Notification'in window&&Notification.permission==='granted'){
   try{navigator.serviceWorker.ready.then(s=>s.showNotification('La Taverna dei Giochi',{body:t,icon:'/icon-192.png',tag:'dist-'+r.code,data:{url:'/?dist='+r.code}}))}catch(e){}}
  else say(t,3200)},
 avvia(){if(Dist.timer)return;Dist.timer=setInterval(()=>{if(!document.hidden)Dist.aggiorna()},90000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)Dist.aggiorna()})},
 async nuova(){const F=FB.m.F;
  for(let i=0;i<6;i++){const c=DIST.codice(),ref=F.doc(FB.db,'partite',c);if((await F.getDoc(ref)).exists())continue;
   await Dist.apri(c,true);return c}
  throw new Error('codice')},
 // entra in una stanza salvata: da ora la rete della stanza è Firestore e l'identità è l'uid
 async apri(code,crea){
  try{await R.hub}catch(e){}
  if(R.mode!=='fs')Dist.prev={db:R.db,mode:R.mode,on:R.on,dev:ME.dev};
  unsubAll();R.code='';
  const F=FB.m.F,ref=F.doc(FB.db,'partite',code);
  if(crea){ME.dev=DIST.devDa(FB.uid);await FsDb.setRoom(code,{host:ME.dev,t:Date.now(),phase:'lobby',game:null,opts:{},seats:[],s:null,rev:0})}
  else await F.runTransaction(FB.db,async tx=>{const s=await tx.get(ref);if(!s.exists()){const e=new Error('non trovata');e.code='non-trovata';throw e}
   const d=s.data();if(!(d.uids||[]).includes(FB.uid)){if((d.uids||[]).length>=DIST.MAX_GIOCATORI){const e=new Error('piena');e.code='piena';throw e}tx.update(ref,{uids:[...d.uids,FB.uid]})}});
  R.db=FsDb;R.mode='fs';R.on=true;ME.dev=DIST.devDa(FB.uid);
  await joinRoom(code);ST('rg-room','');ui.dist=false;ui.cfg=false;render()},
 esci(){unsubAll();R.code='';R.doc=null;R.members=[];R.chat=[];G=null;ui.anim=false;const p=Dist.prev;
  if(p){R.db=p.db;R.mode=p.mode;R.on=p.on;ME.dev=p.dev}Dist.prev=null;ui.dist=false;ui.screen='room';return enterHub()},
 testo(e){const c=e&&e.code;return c==='non-trovata'?'Non trovo quella partita.':c==='piena'?'La partita è al completo.':c==='permission-denied'?'Non hai il permesso: controlla il codice.':c==='troppo-grande'?'La partita è diventata troppo grande.':'Non riuscito, riprova tra poco.'},
 async act(a,v){
  if(a==='dist'){ui.dist=true;ui.cfg=false;Dist.msg='';render();return Dist.aggiorna()}
  if(a==='distx'){ui.dist=false;ui.cfg=true;return render()}
  if(!Dist.ok()||Dist.busy&&a!=='distexit')return;
  if(a==='distcopy'){const u=Dist.invito(R.code);try{if(navigator.share&&matchMedia('(pointer:coarse)').matches)await navigator.share({title:'La Taverna dei Giochi',text:'Siediti al mio tavolo, giochiamo a turni!',url:u});else await navigator.clipboard.writeText(u);Dist.msg='Invito copiato'}catch(e){if(!e||e.name!=='AbortError')Dist.msg=u}return render()}
  if(a==='distnot'){try{await Notification.requestPermission()}catch(e){}return render()}
  if(a==='distexit')return Dist.esci();
  Dist.busy=true;Dist.msg='';render();
  try{
   if(a==='distnew')await Dist.nuova();
   else if(a==='distjoin'||a==='distgo'){const c=Dist.leggi(a==='distgo'?v:Dist.codice);if(!DIST.codiceOk(c)){Dist.msg='Il codice ha 8 caratteri.'}else await Dist.apri(c,false)}
   else if(a==='distdel'){if(confirm('Eliminare la partita '+v+' per tutti?')){await Dist.elimina(v);await Dist.aggiorna()}}
  }catch(e){Dist.msg=Dist.testo(e);console.warn('Partite a distanza',e)}
  finally{Dist.busy=false;render()}},
 // prima i documenti interni (membri e chat, che Firestore non cancella da solo), poi la stanza; chi è dentro viene riportato fuori dal ricevitore
 async elimina(code){const F=FB.m.F;for(const sub of['membri','chat']){const q=await F.getDocs(F.collection(FB.db,'partite',code,sub));for(const d of q.docs)await F.deleteDoc(F.doc(FB.db,'partite',code,sub,d.id))}
  await F.deleteDoc(F.doc(FB.db,'partite',code))},
 // accetta il codice nudo o il link d'invito
 leggi(t){t=String(t||'').trim();const m=t.match(/[?&]dist=([A-Za-z0-9]+)/);return(m?m[1]:t).toUpperCase()},
 // invito aperto con ?dist=CODICE: entra appena il profilo online è pronto
 init(){Dist.avvia();const c=new URLSearchParams(location.search).get('dist');if(c&&!Dist.fatto){Dist.fatto=true;const k=Dist.leggi(c);try{history.replaceState(null,'',location.pathname)}catch(e){}
   if(DIST.codiceOk(k))Dist.apri(k,false).catch(e=>{ui.err=Dist.testo(e);render()});else{ui.err='Link di invito non valido';render()}}
  Dist.aggiorna()}};
document.addEventListener('input',e=>{if(e.target.id==='dist-c')Dist.codice=e.target.value});
