/* ---- Firebase: profilo anonimo e monete (piano: docs/FIREBASE-PIANO.md, regole: firestore.rules) ----
   L'SDK si scarica solo dopo l'ingresso in taverna e non blocca mai l'app: senza rete o con Firebase non
   configurato il gioco funziona come prima e i premi restano in coda sul telefono (localStorage rg-fbq). */
const FB={
 CFG:{apiKey:'AIzaSyBhLn7ArFoHOtumCZpMb0LlRb23mOblLGM',authDomain:'la-taverna-dei-giochi.firebaseapp.com',projectId:'la-taverna-dei-giochi',storageBucket:'la-taverna-dei-giochi.firebasestorage.app',messagingSenderId:'879748781861',appId:'1:879748781861:web:d67778b6e973f1fc19eccc'},
 V:'12.11.0',
 PREMIO:{gioca:10,vinci:15}, // monete per partita finita e in più per la vittoria (le regole accettano al massimo 30 per volta)
 st:'idle',err:'',uid:null,p:null,m:null,db:null,ready:null,last:null,
 q:(()=>{try{return JSON.parse(ST('rg-fbq')||'[]')}catch(e){return[]}})(),
 saveQ(){ST('rg-fbq',JSON.stringify(FB.q.slice(-20)))},
 start(){if(FB.st==='load'||FB.st==='ok')return FB.ready;FB.st='load';FB.err='';
  return FB.ready=FB._init().then(()=>{FB.st='ok';if(ui.cfg)render()}).catch(e=>{FB.st='err';FB.err=String((e&&e.code)||e);console.warn('Firebase',e);if(ui.cfg)render()})},
 async _init(){const B='https://www.gstatic.com/firebasejs/'+FB.V+'/';
  const [A,Au,F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
  FB.m={A,Au,F};const app=A.initializeApp(FB.CFG),auth=Au.getAuth(app);
  await auth.authStateReady();if(!auth.currentUser)await Au.signInAnonymously(auth);
  FB.uid=auth.currentUser.uid;FB.db=F.getFirestore(app);
  await FB.load();await FB.flush()},
 ref(){return FB.m.F.doc(FB.db,'players',FB.uid)},
 // legge il profilo, lo crea alla prima volta, tiene il nome allineato
 async load(){const F=FB.m.F,ref=FB.ref(),nome=(ME.name||'Ospite').slice(0,24);
  FB.p=await F.runTransaction(FB.db,async tx=>{const s=await tx.get(ref);
   if(s.exists()){const d=s.data();if(d.name!==nome)tx.update(ref,{name:nome});return{...d,name:nome}}
   const n={name:nome,coins:0,played:0,wins:0,owned:{},equipped:{},createdAt:F.serverTimestamp(),lastAward:null};tx.set(ref,n);return{...n,createdAt:null}})},
 // salva un premio: monete, partite, vittorie. Le regole lasciano passare un premio ogni ~50 s.
 async award(r){const F=FB.m.F,ref=FB.ref();
  FB.p=await F.runTransaction(FB.db,async tx=>{const d=(await tx.get(ref)).data();
   const u={coins:d.coins+r.n,played:(d.played||0)+1,wins:(d.wins||0)+(r.won?1:0),lastAward:F.serverTimestamp()};tx.update(ref,u);return{...d,...u,lastAward:null}})},
 // svuota la coda dei premi in attesa, in ordine; al primo errore si ferma e riprova alla prossima occasione
 async flush(){if(FB.st!=='ok'&&FB.st!=='load'||!FB.p||FB.busy)return;FB.busy=true;
  try{while(FB.q.length){const r=FB.q[0];await FB.award(r);FB.q.shift();FB.saveQ();say('+'+r.n+' 🪙 monete',2200);if(ui.cfg)render();
    if(FB.q.length)await new Promise(ok=>setTimeout(ok,52000))}}
  catch(e){FB.err=String((e&&e.code)||e);console.warn('Firebase premio',e)}finally{FB.busy=false}},
 // chiamata da pushState quando una partita passa a "finita": un premio per partita e per telefono
 matchEnd(ns){if(!ns.over||FB.last===ns.gid||!local().length)return;FB.last=ns.gid;
  const won=!!iWon(ns);FB.q.push({n:FB.PREMIO.gioca+(won?FB.PREMIO.vinci:0),won,gid:ns.gid});FB.saveQ();
  if(FB.st==='ok')FB.flush();else FB.start().then(()=>FB.flush())},
 cfgH(){if(FB.st==='ok'&&FB.p)return`<p class="muted" style="margin:0">🪙 ${FB.p.coins} monete · ${FB.p.played||0} partite · ${FB.p.wins||0} vittorie${FB.q.length?' · '+FB.q.length+' premi in attesa':''}</p>`;
  if(FB.st==='err')return`<p class="muted" style="margin:0">Profilo online non attivo (${esc(FB.err)}).</p>`;return''}};
window.addEventListener('online',()=>{if(FB.st==='err'&&ME.name)FB.start()});
