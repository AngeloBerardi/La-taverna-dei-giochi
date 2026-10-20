"""SDK Firebase simulato (in memoria, persistente tra i ricarichi nello stesso test) per provare l'app senza rete.
Imita solo ciò che l'app usa. Le regole di sicurezza NON sono simulate, tranne il tempo minimo tra due premi (50 s)."""
APP = "export const initializeApp=c=>({c});"
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
  const u={...user,isAnonymous:false,email:c.email};save(u);return{user:u}};
export const signInWithEmailAndPassword=async(au,email,password)=>{const db=JSON.parse(localStorage.getItem('__stubmail')||'{}');
  if(!db[email]||db[email].password!==password){const e=new Error('x');e.code='auth/invalid-credential';throw e}
  const u={uid:db[email].uid,isAnonymous:false,email};save(u);au.currentUser=u;return{user:u}};
export const sendPasswordResetEmail=async(au,email)=>{window.__resetMail=email};
export const signOut=async au=>{localStorage.removeItem('__stubuser');au.currentUser=null};
"""
FIRESTORE = """
const S=window.__db=JSON.parse(localStorage.getItem('__stub')||'{}');window.__w=[];
const persist=()=>localStorage.setItem('__stub',JSON.stringify(S));
const clone=x=>JSON.parse(JSON.stringify(x));
const stamp=d=>{if(d&&typeof d==='object'){for(const k of Object.keys(d)){if(d[k]&&d[k].__ts)d[k]=Date.now();else if(d[k]&&typeof d[k]==='object')stamp(d[k])}}return d};
export const getFirestore=a=>({});
export const doc=(d,c,i)=>({k:c+'/'+i,c,i});
export const collection=(d,c)=>({c});
export const serverTimestamp=()=>({__ts:1});
export const orderBy=(f,dir)=>({o:[f,dir||'asc']});
export const limit=n=>({l:n});
export const query=(col,...cs)=>({c:col.c,cs});
export const getDoc=async r=>({exists:()=>!!S[r.k],data:()=>clone(S[r.k]),id:r.i});
export const setDoc=async(r,d)=>{S[r.k]=stamp(clone(d));persist();window.__w.push(['set',r.k])};
export const updateDoc=async(r,d)=>{S[r.k]={...(S[r.k]||{}),...stamp(clone(d))};persist();window.__w.push(['upd',r.k])};
export const getDocs=async q=>{let rows=Object.keys(S).filter(k=>k.startsWith(q.c+'/')).map(k=>({id:k.split('/')[1],d:clone(S[k])}));
  for(const c of q.cs||[]){if(c.o){const[f,dir]=c.o;rows.sort((a,b)=>(dir==='desc'?-1:1)*((a.d[f]||0)-(b.d[f]||0)))}if(c.l)rows=rows.slice(0,c.l)}
  return{docs:rows.map(r=>({id:r.id,data:()=>r.d})),size:rows.length}};
export const runTransaction=async(db,fn)=>{const w=[];const tx={get:async r=>({exists:()=>!!S[r.k],data:()=>clone(S[r.k])}),
 set:(r,d)=>w.push(['set',r.k,d]),update:(r,u)=>w.push(['upd',r.k,u])};const out=await fn(tx);
 for(const[o,k,d]of w){const cur=S[k]||{};
  if(o==='upd'&&d.lastAward&&d.lastAward.__ts&&cur.lastAward&&Date.now()-cur.lastAward<50000){const e=new Error('cooldown');e.code='permission-denied';throw e}
  S[k]=stamp({...cur,...clone(d)});window.__w.push([o,k])}
 persist();return out};
"""
MODULES = {'firebase-app.js': APP, 'firebase-auth.js': AUTH, 'firebase-firestore.js': FIRESTORE}
