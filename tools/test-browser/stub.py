"""SDK Firebase simulato (in memoria, persistente tra i ricarichi nello stesso test) per provare l'app senza rete.
Imita solo ciò che l'app usa. Le regole di sicurezza NON sono simulate, tranne il tempo minimo tra due premi (50 s) e il limite ELO (±32, un gioco per volta)."""
APP = "export const initializeApp=c=>({c});export const getApp=()=>({});"
AUTH = """
const U=()=>JSON.parse(localStorage.getItem('__stubuser')||'null');
const save=u=>localStorage.setItem('__stubuser',JSON.stringify(u));
const ERR=window.__stubAuthError;
export const getAuth=a=>{const au={currentUser:U(),authStateReady:async()=>{}};return au};
export const signInAnonymously=async au=>{if(ERR){const e=new Error('x');e.code=ERR;throw e}
  const u={uid:'u-'+(localStorage.getItem('__stubseq')||'1'),isAnonymous:true,email:null};save(u);au.currentUser=u;return{user:u}};
export const EmailAuthProvider={credential:(email,password)=>({email,password})};
export const linkWithCredential=async(user,c)=>{const db=JSON.parse(localStorage.getItem('__stubmail')||'{}');
  if(db[c.email]){const e=new Error('x');e.code='auth/email-already-in-use';throw e}
  if((c.password||'').length<6){const e=new Error('x');e.code='auth/weak-password';throw e}
  db[c.email]={uid:user.uid,password:c.password};localStorage.setItem('__stubmail',JSON.stringify(db));
  Object.assign(user,{isAnonymous:false,email:c.email});save(user);return{user}};
export const signInWithEmailAndPassword=async(au,email,password)=>{const db=JSON.parse(localStorage.getItem('__stubmail')||'{}');
  if(!db[email]||db[email].password!==password){const e=new Error('x');e.code='auth/invalid-credential';throw e}
  const u={uid:db[email].uid,isAnonymous:false,email};save(u);au.currentUser=u;return{user:u}};
export const sendPasswordResetEmail=async(au,email)=>{window.__resetMail=email};
export class GoogleAuthProvider{setCustomParameters(){}static credentialFromError(e){return e.credential||null}}
const GEM='giulia@gmail.test',gdb=()=>JSON.parse(localStorage.getItem('__stubgoogle')||'{}');
export const linkWithPopup=async(user,p)=>{if(window.__popupClosed){const e=new Error('x');e.code='auth/popup-closed-by-user';throw e}
  const db=gdb();if(db[GEM]&&db[GEM]!==user.uid){const e=new Error('x');e.code='auth/credential-already-in-use';e.credential={google:GEM};throw e}
  db[GEM]=user.uid;localStorage.setItem('__stubgoogle',JSON.stringify(db));Object.assign(user,{isAnonymous:false,email:GEM});save(user);return{user}};
export const signInWithCredential=async(au,c)=>{const u={uid:gdb()[c.google],isAnonymous:false,email:c.google};save(u);au.currentUser=u;return{user:u}};
export const signOut=async au=>{localStorage.removeItem('__stubuser');localStorage.setItem('__stubseq',String(+(localStorage.getItem('__stubseq')||'1')+1));au.currentUser=null};
"""
FIRESTORE = r"""
// Archivio: nel telefono (localStorage, persiste tra i ricarichi) oppure condiviso tra più telefoni (window.__stubShared:
// un piccolo server nel test, vedi run.py). Tutte le funzioni sotto lavorano su queste quattro operazioni.
const SH=!!window.__stubShared;const LS=JSON.parse(localStorage.getItem('__stub')||'{}');window.__db=LS;window.__w=[];
const call=async(o)=>(await fetch('/__fs',{method:'POST',body:JSON.stringify(o)})).json();
const store=SH?{get:async k=>(await call({op:'get',k})).v,put:async(k,v)=>{await call({op:'put',k,v})},del:async k=>{await call({op:'del',k})},list:async c=>(await call({op:'list',c})).rows}
 :{get:async k=>LS[k]===undefined?null:JSON.parse(JSON.stringify(LS[k])),put:async(k,v)=>{LS[k]=v;localStorage.setItem('__stub',JSON.stringify(LS))},del:async k=>{delete LS[k];localStorage.setItem('__stub',JSON.stringify(LS))},
  list:async c=>Object.keys(LS).filter(k=>k.startsWith(c+'/')&&k.split('/').length===c.split('/').length+1).map(k=>({id:k.split('/').pop(),d:JSON.parse(JSON.stringify(LS[k]))}))};
const clone=x=>JSON.parse(JSON.stringify(x));
const stamp=d=>{if(d&&typeof d==='object'){for(const k of Object.keys(d)){if(d[k]&&d[k].__ts)d[k]=Date.now();else if(d[k]&&typeof d[k]==='object')stamp(d[k])}}return d};
const me=()=>{const u=JSON.parse(localStorage.getItem('__stubuser')||'null');return u&&u.uid};
const denied=()=>{const e=new Error('permission-denied');e.code='permission-denied';return e};
// regole di sicurezza simulate per le partite a distanza (specchio di firestore.rules)
async function regolePartite(k,nuovo,vecchio){const m=k.match(/^partite\/([A-Z0-9]+)(?:\/(membri|chat)\/(.+))?$/);if(!m)return;const uid=me();if(!uid)throw denied();
  if(!m[2]){ if(nuovo===null){if(!vecchio||vecchio.host!==uid)throw denied();return}
    if(!vecchio){if(JSON.stringify(nuovo.uids)!==JSON.stringify([uid])||nuovo.host!==uid)throw denied();return}
    if(nuovo.host!==vecchio.host||!vecchio.uids.every(u=>nuovo.uids.includes(u))||nuovo.uids.length>8)throw denied();
    if(vecchio.uids.includes(uid))return;
    if(!(nuovo.uids.includes(uid)&&nuovo.uids.length===vecchio.uids.length+1&&nuovo.j===vecchio.j))throw denied();return}
  const par=await store.get('partite/'+m[1]);if(!par||!par.uids.includes(uid))throw denied();
  if(m[2]==='membri'&&nuovo!==null&&m[3]!=='u:'+uid)throw denied()}
// regole simulate per gli eroi (specchio di firestore.rules)
const COSTO={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
function regoleEroi(k,nuovo,vecchio){const m=k.match(/^players\/([^/]+)\/eroi\/(.+)$/);if(!m)return;if(m[1]!==me())throw denied();
  if(nuovo===null)return;if(!['e1','e2','e3','e4','e5'].includes(m[2]))throw denied();
  const b=nuovo.base||{};const ks=['for','des','cos','int','sag','car'];
  if(ks.some(x=>COSTO[b[x]]===undefined)||ks.reduce((s,x)=>s+COSTO[b[x]],0)>27)throw denied();
  if(!nuovo.nome||nuovo.nome.length>16||nuovo.liv<1||nuovo.liv>10)throw denied();
  // oggetti (equipEroeOk, zainoEroeOk): id del catalogo nel posto giusto, zaino da 16, cintura da 3 consumabili
  {const q=nuovo.equip,A=AOGG.OGG,sl={arma:'arma',scudo:'scudo',armatura:'armatura',acc1:'acc',acc2:'acc'};
   if(!q||typeof q!=='object'||Array.isArray(q)||Object.keys(q).some(x=>!sl[x])||Object.entries(q).some(([x,i])=>i!=null&&!(A[i]&&A[i].slot===sl[x])))throw denied();
   if(nuovo.zaino!==undefined&&(!Array.isArray(nuovo.zaino)||nuovo.zaino.length>16||nuovo.zaino.some(i=>!A[i])))throw denied();
   if(nuovo.cintura!==undefined&&(!Array.isArray(nuovo.cintura)||nuovo.cintura.length>3||nuovo.cintura.some(i=>!A[i]||A[i].slot!=='cons')))throw denied()}
  if(!vecchio){if(nuovo.liv!==1||nuovo.xp!==0||nuovo.oro!==20||'agg' in nuovo)throw denied();return}
  if(nuovo.razza!==vecchio.razza||nuovo.classe!==vecchio.classe||JSON.stringify(nuovo.base)!==JSON.stringify(vecchio.base)||nuovo.creato!==vecchio.creato||nuovo.liv<vecchio.liv||nuovo.xp<vecchio.xp)throw denied();
  // crescita limitata (guadagnoOk): +800 xp e +1000 oro per scrittura; chi guadagna porta agg = ora del server e aspetta 60 s dall'ultimo guadagno
  if(nuovo.xp-vecchio.xp>800||nuovo.oro-vecchio.oro>1000)throw denied();
  const senza=nuovo.xp===vecchio.xp&&nuovo.oro<=vecchio.oro&&nuovo.agg===vecchio.agg,con=nuovo.agg!==vecchio.agg&&typeof nuovo.agg==='number'&&Math.abs(nuovo.agg-Date.now())<3000&&Date.now()>(vecchio.agg||0)+60000;
  if(!senza&&!con)throw denied();if(nuovo.agg!==undefined&&typeof nuovo.agg!=='number')throw denied()}
export const getFirestore=a=>({});
export const doc=(d,...s)=>({k:s.join('/'),c:s.slice(0,-1).join('/'),i:s[s.length-1]});
export const collection=(d,...s)=>({c:s.join('/')});
export const serverTimestamp=()=>({__ts:1});
export const orderBy=(f,dir)=>({o:[f,dir||'asc']});
export const limit=n=>({l:n});
export const where=(f,op,v)=>({w:[f,op,v]});
export const query=(col,...cs)=>({c:col.c,cs});
const snapDoc=(r,v)=>({exists:()=>v!==null,data:()=>v===null?undefined:clone(v),id:r.i});
export const getDoc=async r=>{const m=r.k.match(/^players\/([^/]+)\/eroi\//);if(m&&m[1]!==me())throw denied();return snapDoc(r,await store.get(r.k))};
export const setDoc=async(r,d)=>{const v=stamp(clone(d));await regolePartite(r.k,v,await store.get(r.k));regoleEroi(r.k,v,await store.get(r.k));await store.put(r.k,v);window.__w.push(['set',r.k])};
export const updateDoc=async(r,d)=>{const cur=(await store.get(r.k))||{},v={...cur,...stamp(clone(d))};await regolePartite(r.k,v,cur);regoleEroi(r.k,v,cur);await store.put(r.k,v);window.__w.push(['upd',r.k])};
export const deleteDoc=async r=>{await regolePartite(r.k,null,await store.get(r.k));regoleEroi(r.k,null,null);await store.del(r.k);window.__w.push(['del',r.k])};
export const getDocs=async q=>{const mq=q.c.match(/^players\/([^/]+)\/eroi$/);if(mq&&mq[1]!==me())throw denied();let rows=await store.list(q.c);
  for(const c of q.cs||[]){
   if(c.w){const[f,op,v]=c.w;rows=rows.filter(r=>op==='array-contains'?(r.d[f]||[]).includes(v):r.d[f]===v)}
   if(c.o){const[f,dir]=c.o;const v=d=>f.split('.').reduce((o,k)=>o==null?o:o[k],d);rows=rows.filter(r=>v(r.d)!=null);rows.sort((a,b)=>(dir==='desc'?-1:1)*((v(a.d)||0)-(v(b.d)||0)))}
   if(c.l)rows=rows.slice(0,c.l)}
  return{docs:rows.map(r=>({id:r.id,exists:()=>true,data:()=>clone(r.d)})),size:rows.length}};
// onSnapshot: scatta subito e poi a ogni cambiamento (controllo ogni 200 ms)
export const onSnapshot=(x,cb,er)=>{let vivo=true,ultimo;const giro=async()=>{if(!vivo)return;try{
   const s=x.k!==undefined?await getDoc(x):await getDocs(x),j=x.k!==undefined?JSON.stringify(s.data()):JSON.stringify(s.docs.map(d=>[d.id,d.data()]));
   if(j!==ultimo){ultimo=j;if(vivo)cb(s)}}catch(e){if(er&&vivo)er(e)}if(vivo)setTimeout(giro,200)};giro();return()=>{vivo=false}};
export const runTransaction=async(db,fn)=>{const w=[];const tx={get:async r=>snapDoc(r,await store.get(r.k)),
 set:(r,d)=>w.push(['set',r.k,d]),update:(r,u)=>w.push(['upd',r.k,u])};const out=await fn(tx);
 for(const[o,k,d]of w){const cur=(await store.get(k))||{};
  if(o==='upd'&&d.lastAward&&d.lastAward.__ts&&cur.lastAward&&Date.now()-cur.lastAward<50000){const e=new Error('cooldown');e.code='permission-denied';throw e}
  if(o==='upd'&&d.elo){const g=Object.keys(d.elo).filter(x=>d.elo[x]!==(cur.elo||{})[x]);
    if(g.length>1||g.some(x=>Math.abs(d.elo[x]-((cur.elo||{})[x]||1000))>32||d.elo[x]<100||d.elo[x]>3000)){const e=new Error('elo');e.code='permission-denied';throw e}}
  const nuovo=stamp({...(o==='set'?{}:cur),...clone(d)});await regolePartite(k,nuovo,await store.get(k));
  await store.put(k,nuovo);window.__w.push([o,k])}
 return out};
"""

# Realtime Database simulato. Spento se la pagina non imposta window.__stubRt (getDatabase fallisce, come un database
# irraggiungibile): così gli scenari che non lo chiedono restano sul p2p come prima. Archivio come per Firestore
# (locale o condiviso tra più telefoni via /__fs). Prove di rete: window.__rtDrop() = il telefono perde la linea (il
# «server» toglie i nodi di presenza registrati con onDisconnect), window.__rtBack() = torna la linea.
DATABASE = r"""
const SH=!!window.__stubShared;const LS=JSON.parse(localStorage.getItem('__stubrt')||'{}');
const call=async o=>(await fetch('/__fs',{method:'POST',body:JSON.stringify(o)})).json();
const store=SH?{get:async k=>{const v=(await call({op:'get',k})).v;return v===undefined?null:v},put:async(k,v)=>{await call({op:'put',k,v})},cas:async(k,e,v)=>(await call({op:'cas',k,e,v})).ok,del:async k=>{await call({op:'del',k})},list:async c=>(await call({op:'list',c})).rows,tree:async c=>(await call({op:'tree',c})).rows,deltree:async k=>{await call({op:'deltree',k})}}
 :{get:async k=>LS[k]===undefined?null:JSON.parse(JSON.stringify(LS[k])),put:async(k,v)=>{LS[k]=v;localStorage.setItem('__stubrt',JSON.stringify(LS))},cas:async(k,e,v)=>{const c=LS[k]===undefined?null:LS[k];if(JSON.stringify(c)!==JSON.stringify(e))return false;LS[k]=v;localStorage.setItem('__stubrt',JSON.stringify(LS));return true},del:async k=>{delete LS[k];localStorage.setItem('__stubrt',JSON.stringify(LS))},
  list:async c=>Object.keys(LS).filter(k=>k.startsWith(c+'/')&&k.split('/').length===c.split('/').length+1).map(k=>({id:k.split('/').pop(),d:JSON.parse(JSON.stringify(LS[k]))})),
  tree:async c=>Object.keys(LS).filter(k=>k.startsWith(c+'/')).map(k=>({k:k.slice(c.length+1),v:JSON.parse(JSON.stringify(LS[k]))})),
  deltree:async k=>{for(const x of Object.keys(LS))if(x===k||x.startsWith(k+'/'))delete LS[x];localStorage.setItem('__stubrt',JSON.stringify(LS))}};
const clone=x=>x==null?null:JSON.parse(JSON.stringify(x));
const stamp=d=>{if(d&&typeof d==='object'){for(const k of Object.keys(d)){if(d[k]&&d[k].__ts)d[k]=Date.now();else if(d[k]&&typeof d[k]==='object')stamp(d[k])}}return d};
const RTS=window.__rt={on:true,dis:[],w:[]};
window.__rtDrop=async()=>{for(const k of RTS.dis)await store.del(k);RTS.dis=[];RTS.on=false};
window.__rtBack=()=>{RTS.on=true};
const COLL=k=>/\/(m|c|p|pos)$/.test(k);
const leggi=async k=>{if(COLL(k)){const rows=await store.list(k);if(!rows.length)return null;const o={};rows.forEach(x=>{o[x.id]=x.d});return o}
 const v=await store.get(k);if(v!=null)return clone(v);const rows=await store.tree(k);if(!rows.length)return null;const o={};
 for(const x of rows){const p=x.k.split('/');let t=o;p.slice(0,-1).forEach(s=>{t=t[s]=t[s]&&typeof t[s]==='object'?t[s]:{}});t[p[p.length-1]]=x.v}return o};
const snapOf=(k,v)=>({key:k.split('/').pop(),val:()=>clone(v),forEach:f=>{if(v&&typeof v==='object')for(const[i,x]of Object.entries(v)){if(f({key:i,val:()=>clone(x)})===true)break}}});
export const getDatabase=(app,url)=>{if(!window.__stubRt)throw new Error('database non disponibile (stub)');window.__rtUrl=url;return{url}};
export const ref=(db,k)=>({k});
export const serverTimestamp=()=>({__ts:1});
export const get=async r=>snapOf(r.k,await leggi(r.k));
export const set=async(r,v)=>{if(!RTS.on)throw new Error('offline');await store.put(r.k,stamp(clone(v)));RTS.w.push(['set',r.k])};
export const remove=async r=>{await store.deltree(r.k);RTS.w.push(['del',r.k])};
// come l'SDK vero: si legge, si calcola, si scrive SOLO se il valore non è cambiato nel frattempo (altrimenti si riesegue)
export const runTransaction=async(r,fn)=>{for(let i=0;i<25;i++){const cur=await store.get(r.k);const out=fn(cur==null?null:clone(cur));if(out===undefined)return{committed:false};
 if(await store.cas(r.k,cur==null?null:cur,stamp(clone(out)))){RTS.w.push(['tx',r.k]);return{committed:true}}}
 throw Object.assign(new Error('maxretry'),{code:'maxretry'})};
export const onDisconnect=r=>({remove:async()=>{if(!RTS.dis.includes(r.k))RTS.dis.push(r.k)},cancel:async()=>{RTS.dis=RTS.dis.filter(x=>x!==r.k)}});
// come l'SDK vero: staccarsi a mano chiude la linea in modo pulito, quindi il «server» esegue subito gli onDisconnect
export const goOffline=()=>{const d=RTS.dis;RTS.dis=[];RTS.on=false;d.forEach(k=>store.del(k))};export const goOnline=()=>{RTS.on=true};
export const onValue=(r,cb,er)=>{let vivo=true,ultimo;const giro=async()=>{if(!vivo)return;try{
  const v=r.k==='.info/connected'?RTS.on:await leggi(r.k),j=JSON.stringify(v===undefined?null:v);
  if(j!==ultimo){ultimo=j;if(vivo)cb(snapOf(r.k,v))}}catch(e){if(er&&vivo)er(e)}if(vivo)setTimeout(giro,200)};giro();return()=>{vivo=false}};
"""
MODULES = {'firebase-app.js': APP, 'firebase-auth.js': AUTH, 'firebase-firestore.js': FIRESTORE, 'firebase-database.js': DATABASE}
