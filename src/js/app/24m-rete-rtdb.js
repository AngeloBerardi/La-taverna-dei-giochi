/* ---- Stanze live su Firebase Realtime Database (R.mode='rt') ----
   Stessa interfaccia di R.db degli altri trasporti (doc/collection: get, set, delete, onSnapshot), ma senza un telefono che
   fa da server: lo stato sta nel database, ognuno si collega al database, l'SDK riconnette e risincronizza da solo.
   Percorsi: stanze/CODICE/d (la stanza), /m/DEV (membri), /c/ID (chat), /p/DEV (presenza: sparisce da sola quando il
   telefono si scollega, grazie a onDisconnect). Ogni documento viaggia come testo JSON (j): RTDB toglie null, array vuoti
   e numera gli array, lo stato dei giochi ne è pieno. Regole: database.rules.json. Piano: docs/FIREBASE-PIANO.md.
   Spento di default (RT.PREDEFINITO): si prova con ?net=rt; se non risponde si ripiega sul p2p come prima. */
const RT={
 URL:'https://la-taverna-dei-giochi-default-rtdb.europe-west1.firebasedatabase.app',
 PREDEFINITO:false, // true quando il database esiste ed è stato provato dal vivo
 m:null,db:null,on:false,vivo:false,pc:{},pw:{},here:{},ass:{},mio:'',TOLLERANZA:20000, // ms senza presenza prima di togliere un membro dall'attesa

 attivo(){return RT.PREDEFINITO||new URLSearchParams(location.search).get('net')==='rt'},
 // i link da condividere portano ?net=rt finché non è il trasporto predefinito (chi li apre usa lo stesso trasporto)
 link(u){return R.mode==='rt'&&!RT.PREDEFINITO?u+(u.includes('?')?'&':'?')+'net=rt':u},
 // percorso logico dell'app -> percorso nel database
 P(path){const a=String(path).split('/');
  if(a[0]!=='rooms'||!/^[\w-]{1,16}$/.test(a[1]||''))throw new Error('percorso non valido');
  if(a.length===2)return['stanze',a[1],'d'];
  if(a.length===4&&(a[2]==='members'||a[2]==='chat')&&/^[\w:-]{1,64}$/.test(a[3]))return['stanze',a[1],a[2]==='members'?'m':'c',a[3]];
  throw new Error('percorso non valido')},
 ref(seg){return RT.m.ref(RT.db,seg.join('/'))},
 snap(s,id){const v=s.val(),ex=v!==null&&typeof v==='object'&&typeof v.j==='string';
  return{exists:ex,id:id||s.key,data:()=>ex?DIST.de(v):undefined}},
 doc(path){const seg=RT.P(path),stanza=seg.length===3,id=String(path).split('/').pop();return{path,id,
  get:async()=>RT.snap(await RT.m.get(RT.ref(seg)),id),
  set:async d=>stanza?RT.setRoom(seg[1],d):RT.setMem(seg,d),
  delete:async()=>RT.del(seg),
  onSnapshot:(n,er)=>RT.m.onValue(RT.ref(seg),s=>n(RT.snap(s,id)),er)}},
 collection(path){const a=String(path).split('/');
  if(a.length!==3||a[0]!=='rooms'||!['members','chat'].includes(a[2]))throw new Error('percorso non valido');
  const code=a[1],mem=a[2]==='members',seg=['stanze',code,mem?'m':'c'];
  return{doc:id=>RT.doc(path+'/'+id),
   onSnapshot:(n,er)=>{if(mem)RT.guarda(code);
    const un=RT.m.onValue(RT.ref(seg),s=>{const docs=[];s.forEach(c=>{docs.push(RT.snap(c,c.key))});n({docs})},er);
    return()=>{un();if(mem)RT.smetti(code)}}}},
 // la stanza si scrive in transazione: un telefono rimasto indietro (rev più vecchio) non cancella una mossa più recente
 async setRoom(code,d){const j=DIST.ser(d),rev=d.rev||0,M=RT.m;let vecchio=false;
  await M.runTransaction(RT.ref(['stanze',code,'d']),cur=>{
   if(cur&&cur.rev!=null&&cur.rev>rev){vecchio=true;return}
   return{j,rev,t:M.serverTimestamp()}});
  // la creazione (rev 0) che arriva dopo che la stanza esiste già non è un errore: qualcuno l'ha aperta un attimo prima
  if(vecchio&&rev>0){const e=new Error('conflitto');e.code='conflitto';throw e}},
 async setMem(seg,d){const j=DIST.ser(d);if(j.length>20000){const e=new Error('troppo grande');e.code='troppo-grande';throw e}
  await RT.m.set(RT.ref(seg),{j,t:Date.now()});
  if(seg[2]==='m'&&seg[3]===ME.dev)RT.presenza(seg[1])},
 async del(seg){await RT.m.remove(RT.ref(seg));if(seg[2]==='m'&&seg[3]===ME.dev)RT.assenza(seg[1])},
 // presenza: un nodo che il server toglie da solo quando il telefono si scollega; si ripristina a ogni riconnessione
 presenza(code){RT.pc[code]=1;if(RT.on)RT.segna(code)},
 assenza(code){delete RT.pc[code];try{const r=RT.ref(['stanze',code,'p',ME.dev]);RT.m.onDisconnect(r).cancel().catch(()=>{});RT.m.remove(r).catch(()=>{})}catch(e){}},
 segna(code){try{const r=RT.ref(['stanze',code,'p',ME.dev]);
  RT.m.onDisconnect(r).remove().then(()=>RT.m.set(r,{t:RT.m.serverTimestamp()})).catch(()=>{});
  // se nel frattempo gli altri mi hanno tolto dai membri (ero sparito dalla stanza in attesa), rientro
  if(code===R.code&&R.mode==='rt')RT.doc('rooms/'+code+'/members/'+ME.dev).get().then(s=>{if(!s.exists&&R.mode==='rt'&&R.code===code&&RT.pc[code])RT.setMem(['stanze',code,'m',ME.dev],R.mine)}).catch(()=>{})}catch(e){}},
 // chi c'è davvero (presenza) nella stanza che si guarda: serve a togliere dall'attesa chi è sparito senza salutare
 guarda(code){const w=RT.pw[code];if(w){w.n++;return}
  const un=RT.m.onValue(RT.ref(['stanze',code,'p']),s=>{const h=new Set();s.forEach(c=>{h.add(c.key)});RT.here[code]=h},()=>{});
  RT.pw[code]={n:1,un};if(!RT.tm)RT.tm=setInterval(()=>RT.pota(),5000)},
 smetti(code){const w=RT.pw[code];if(!w||--w.n>0)return;try{w.un()}catch(e){}delete RT.pw[code];delete RT.here[code];
  if(!Object.keys(RT.pw).length){clearInterval(RT.tm);RT.tm=0}},
 // nella stanza in attesa, chi non ha presenza da più di 20 s (e non sono io) esce dall'elenco; durante la partita nessuno viene tolto
 pota(){const h=RT.here[R.code],d=R.doc;if(R.mode!=='rt'||!R.code||!RT.on||!h||!d||d.phase!=='lobby'){RT.ass={};return}
  const ora=Date.now();
  for(const m of R.members||[]){if(m.id===ME.dev||h.has(m.id)){delete RT.ass[m.id];continue}
   const t0=RT.ass[m.id]||(RT.ass[m.id]=ora);
   if(ora-t0>RT.TOLLERANZA){delete RT.ass[m.id];RT.m.remove(RT.ref(['stanze',R.code,'m',m.id])).catch(()=>{})}}},
 // collegamento: .info/connected dice se il telefono è collegato al server; a ogni (ri)connessione si rimette la presenza
 avvia(){if(RT.vivo)return;RT.vivo=true;
  RT.m.onValue(RT.m.ref(RT.db,'.info/connected'),s=>{
   if(s.val()===true){RT.on=true;clearTimeout(RT.tp);if(RT.mio&&ui.err===RT.mio){ui.err='';RT.mio='';render()}Object.keys(RT.pc).forEach(c=>RT.segna(c))}
   else{RT.on=false;clearTimeout(RT.tp);RT.tp=setTimeout(()=>{if(!RT.on&&R.mode==='rt'&&R.code){RT.mio=ui.err='Connessione persa… riprovo';render()}},4000)}});
  // rientrando in primo piano dopo un po' i socket possono essere morti senza che nessuno se ne sia accorto: si riparte
  document.addEventListener('visibilitychange',()=>{if(document.hidden){RT.hid=Date.now();return}
   if(R.mode==='rt'&&RT.hid&&Date.now()-RT.hid>15000){try{RT.m.goOffline(RT.db);RT.m.goOnline(RT.db)}catch(e){}}RT.hid=0})},
 // sonda: l'accesso anonimo di Firebase è pronto e il database risponde entro il tempo dato? Altrimenti si ripiega sul p2p
 async prova(ms){ms=ms||10000;if(!RT.attivo())return false;
  const t0=Date.now(),res=()=>Math.max(0,ms-(Date.now()-t0)),pausa=t=>new Promise(r=>setTimeout(r,t));
  try{FB.start();
   while(!(FB.uid&&FB.m)&&FB.st!=='err'&&res()>0)await pausa(100);
   if(!(FB.uid&&FB.m))return false;
   if(!RT.m)RT.m=await Promise.race([import('https://www.gstatic.com/firebasejs/'+FB.V+'/firebase-database.js'),pausa(res()).then(()=>{throw new Error('timeout')})]);
   if(!RT.db)RT.db=RT.m.getDatabase(FB.m.A.getApp(),RT.URL);
   RT.avvia();
   while(!RT.on&&res()>0)await pausa(100);
   return RT.on}
  catch(e){console.warn('Stanze online (database)',e);return false}}};
