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
  if(ui.cfg)render();
  const lento=new Promise((_,no)=>setTimeout(()=>no({code:'timeout: nessuna risposta da Firebase'}),20000));
  return FB.ready=Promise.race([FB._init(),lento]).then(()=>{FB.st='ok';if(ui.cfg)render()}).catch(e=>{FB.st='err';FB.err=String((e&&e.code)||e);console.warn('Firebase',e);if(ui.cfg)render()})},
 async _init(){const B='https://www.gstatic.com/firebasejs/'+FB.V+'/';
  const [A,Au,F]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
  FB.m={A,Au,F};const app=A.initializeApp(FB.CFG),auth=Au.getAuth(app);
  await auth.authStateReady();if(!auth.currentUser)await Au.signInAnonymously(auth);
  FB.auth=auth;FB.uid=auth.currentUser.uid;FB.db=F.getFirestore(app);
  await FB.load();Shop.sync();R.mine.uid=FB.uid;if(R.on)savePos();Dist.init();await FB.flush()},
 ref(){return FB.m.F.doc(FB.db,'players',FB.uid)},
 // legge il profilo, lo crea alla prima volta, tiene il nome allineato
 async load(){const F=FB.m.F,ref=FB.ref(),nome=(ME.name||'Ospite').slice(0,24);
  FB.p=await F.runTransaction(FB.db,async tx=>{const s=await tx.get(ref);
   if(s.exists()){const d=s.data();if(d.name!==nome)tx.update(ref,{name:nome});return{...d,name:nome}}
   const n={name:nome,coins:0,played:0,wins:0,owned:{},equipped:{},createdAt:F.serverTimestamp(),lastAward:null};tx.set(ref,n);return{...n,createdAt:null}})},
 // compra un oggetto della bottega al prezzo del catalogo e lo mette subito in uso (una sola scrittura)
 async buy(id){const o=BOTTEGA.per(id);if(!o)throw new Error('oggetto sconosciuto');const F=FB.m.F,ref=FB.ref();
  FB.p=await F.runTransaction(FB.db,async tx=>{const d=(await tx.get(ref)).data();if((d.owned||{})[id])return d;
   if(d.coins<o.prezzo){const e=new Error('monete');e.code='monete';throw e}
   const u={coins:d.coins-o.prezzo,owned:{...(d.owned||{}),[id]:true},equipped:{...(d.equipped||{}),[o.slot]:id}};tx.update(ref,u);return{...d,...u}})},
 // sceglie cosa usare in uno slot (solo oggetti gratuiti o già posseduti)
 async equip(slot,id){const F=FB.m.F,ref=FB.ref();
  FB.p=await F.runTransaction(FB.db,async tx=>{const d=(await tx.get(ref)).data();if(!BOTTEGA.usabile(id,d.owned))throw new Error('non posseduto');
   const u={equipped:{...(d.equipped||{}),[slot]:id}};tx.update(ref,u);return{...d,...u}})},
 // salva un premio: monete, partite, vittorie. Le regole lasciano passare un premio ogni ~50 s.
 // valutazioni degli altri giocatori del tavolo (lette prima: se una lettura fallisce si parte dalla base)
 async rivali(e){const F=FB.m.F;return Promise.all(e.u.filter(x=>x!==FB.uid).map(x=>F.getDoc(F.doc(FB.db,'players',x)).then(s=>s.exists()?((s.data().elo||{})[e.g]||ELO.BASE):ELO.BASE,()=>ELO.BASE)))},
 async award(r){const F=FB.m.F,ref=FB.ref(),e=r.elo&&r.elo.me===FB.uid?r.elo:null,altri=e?await FB.rivali(e):null;FB.dElo=null;
  FB.p=await F.runTransaction(FB.db,async tx=>{const d=(await tx.get(ref)).data();
   const u={coins:d.coins+r.n,played:(d.played||0)+1,wins:(d.wins||0)+(r.won?1:0),lastAward:F.serverTimestamp()};
   if(e){const mio=(d.elo||{})[e.g]||ELO.BASE,nuovo=ELO.nuovo(mio,altri,e.w.includes(FB.uid),e.w.length);u.elo={...(d.elo||{}),[e.g]:nuovo};FB.dElo=nuovo-mio}
   tx.update(ref,u);return{...d,...u,lastAward:null}})},
 // svuota la coda dei premi in attesa, in ordine; al primo errore si ferma e riprova alla prossima occasione
 async flush(){if(FB.st!=='ok'&&FB.st!=='load'||!FB.p||FB.busy)return;FB.busy=true;
  try{while(FB.q.length){const r=FB.q[0];await FB.award(r);FB.q.shift();FB.saveQ();say('+'+r.n+' 🪙 monete'+(FB.dElo?' · ELO '+(FB.dElo>0?'+':'')+FB.dElo:''),2600);if(ui.cfg)render();
    if(FB.q.length)await new Promise(ok=>setTimeout(ok,52000))}}
  catch(e){FB.err=String((e&&e.code)||e);console.warn('Firebase premio',e)}finally{FB.busy=false}},
 // dati per la classifica ELO, o null se la partita non vale (cooperativa, pareggio, ospiti, posti ripetuti)
 eloInfo(ns){const S=seatsNow(),w=ELO.vincitori(ns);if(!w||S.length<2||S.length!==ns.n||!FB.uid)return null;
  const u=S.map(x=>x.uid);if(!S.every(x=>x.k==='m'&&x.uid)||new Set(u).size!==u.length)return null;
  const me=S.findIndex(x=>x.dev===ME.dev);return me<0||u[me]!==FB.uid?null:{g:ns.g,u,me:FB.uid,w:w.map(i=>u[i])}},
 // ---- eroi delle campagne (players/{uid}/eroi/e1..e5, vedi motori/27-eroi.js) ----
 async eroi(){const F=FB.m.F,q=await F.getDocs(F.collection(FB.db,'players',FB.uid,'eroi')),m={};for(const d of q.docs)m[d.id]=d.data();return m},
 async salvaEroe(slot,h){const F=FB.m.F;await F.setDoc(F.doc(FB.db,'players',FB.uid,'eroi',slot),h)},
 async eliminaEroe(slot){const F=FB.m.F;await F.deleteDoc(F.doc(FB.db,'players',FB.uid,'eroi',slot))},
 // ---- account: l'anonimo si collega a un'email (stesso profilo), o si entra in un profilo già legato ----
 mail(){return FB.auth&&FB.auth.currentUser&&FB.auth.currentUser.email||''},
 async collega(email,pw){const Au=FB.m.Au;await Au.linkWithCredential(FB.auth.currentUser,Au.EmailAuthProvider.credential(email,pw))},
 // Accesso con Google: serve solo a riconoscerti. Nessun dato di Google (nome, email, foto) viene copiato nel profilo o in Firestore.
 async google(){const Au=FB.m.Au,p=new Au.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
  try{await Au.linkWithPopup(FB.auth.currentUser,p)}
  catch(e){if(e&&(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use')){const c=Au.GoogleAuthProvider.credentialFromError(e);if(!c)throw e;await Au.signInWithCredential(FB.auth,c);await FB.cambiaProfilo()}else throw e}
  const u=FB.auth.currentUser;if(u&&u.reload)await u.reload()},
 async cambiaProfilo(){if(R.mode==='fs')await Dist.esci();Eroi.lista=null;FB.uid=FB.auth.currentUser.uid;FB.p=null;await FB.load();Shop.sync();R.mine.uid=FB.uid;if(R.on)savePos();FB.q=FB.q.map(r=>({...r,elo:null}));FB.saveQ()},
 async entra(email,pw){await FB.m.Au.signInWithEmailAndPassword(FB.auth,email,pw);await FB.cambiaProfilo()},
 async reset(email){await FB.m.Au.sendPasswordResetEmail(FB.auth,email)},
 async esci(){await FB.m.Au.signOut(FB.auth);await FB.m.Au.signInAnonymously(FB.auth);await FB.cambiaProfilo()},
 // prime 20 righe di una classifica: campo = 'wins' | 'played' | 'coins' | 'elo.<gioco>'
 async top(campo){const F=FB.m.F,s=await F.getDocs(F.query(F.collection(FB.db,'players'),F.orderBy(campo,'desc'),F.limit(20)));return s.docs.map(d=>({uid:d.id,...d.data()}))},
 // chiamata da pushState quando una partita passa a "finita": un premio per partita e per telefono
 matchEnd(ns){if(!ns.over||FB.last===ns.gid||!local().length)return;FB.last=ns.gid;
  const won=!!iWon(ns);FB.q.push({n:FB.PREMIO.gioca+(won?FB.PREMIO.vinci:0),won,gid:ns.gid,elo:FB.eloInfo(ns)});FB.saveQ();
  if(FB.st==='ok')FB.flush();else FB.start().then(()=>FB.flush())},
 cfgH(){if(FB.st==='ok'&&FB.p)return`<p class="muted" style="margin:0">🪙 ${FB.p.coins} monete · ${FB.p.played||0} partite · ${FB.p.wins||0} vittorie${FB.q.length?' · '+FB.q.length+' premi in attesa':''}</p><p class="muted" style="margin:0">${FB.mail()?'Account: '+esc(FB.mail()):'Profilo anonimo su questo telefono'}</p>`;
  if(FB.st==='err')return`<p class="muted" style="margin:0">Profilo online non attivo (${esc(FB.err)}).</p><button class="b sm" data-a="fbstart">Riprova</button>`;
  if(FB.st==='load')return'<p class="muted" style="margin:0">Connessione al profilo online…</p>';
  return'<button class="b sm gold" data-a="fbstart">Attiva profilo online</button>'}};
window.addEventListener('online',()=>{if(FB.st==='err'&&ME.name)FB.start()});
