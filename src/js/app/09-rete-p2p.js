if(typeof window!=="undefined"&&!window.Peer&&window.peerjs)window.Peer=window.peerjs.Peer;
/* ================= RETE PEER-TO-PEER (PeerJS + WebRTC) =================
   Il creatore della stanza è l'host: tiene lo stato e lo rilancia a tutti. Gli altri entrano col codice a 4 lettere.
   Espone la stessa interfaccia minima del db (doc/collection: get, set, delete, onSnapshot), così il resto dell'app non cambia. */
const P2P={tr:'pj',peer:null,conns:new Map(),store:new Map(),subs:[],role:null,code:'',pend:new Map(),oid:0,hostConn:null,lost:false,retry:null,state:'off'};
const p2pPeerOpts=()=>{const q=new URLSearchParams(location.search).get('peer');const o={debug:0};if(q){const[h,p]=q.split(':');o.host=h;o.port=+p;o.path='/';o.secure=false;o.config={iceServers:[]}}return o};
const p2pParent=p=>p.split('/').slice(0,-1).join('/');
const p2pClone=o=>o===undefined?undefined:JSON.parse(JSON.stringify(o));
function p2pSnap(p){const d=P2P.store.get(p);return{id:p.split('/').pop(),exists:d!==undefined,data:()=>p2pClone(d),metadata:{}}}
function p2pNotify(){P2P.subs.slice().forEach(s=>{try{s.check()}catch(e){}})}
function p2pApply(path,data){if(data===null||data===undefined)P2P.store.delete(path);else P2P.store.set(path,data);p2pNotify();if(P2P.role==='host')p2pSave()}
let p2pSaveT=0;function p2pSave(){clearTimeout(p2pSaveT);p2pSaveT=setTimeout(()=>{try{ST('rg-p2p-store',JSON.stringify({code:P2P.code,e:[...P2P.store]}))}catch(e){}},300)}
function p2pSend(c,m){try{if(c.open)c.send(m)}catch(e){}}
function p2pBroadcast(m){P2P.conns.forEach(c=>p2pSend(c,m))}
const p2pDB={
 doc(p){return{path:p,id:p.split('/').pop(),async get(){return p2pSnap(p)},
  async set(d){return p2pWrite(p,p2pClone(d))},async delete(){return p2pWrite(p,null)},
  onSnapshot(n,er){let last;const s={check(){const sn=p2pSnap(p),j=JSON.stringify(sn.data());if(j===last)return;last=j;n(sn)}};P2P.subs.push(s);setTimeout(()=>s.check(),0);return()=>{const i=P2P.subs.indexOf(s);if(i>=0)P2P.subs.splice(i,1)}}}},
 collection(p){return{doc:id=>p2pDB.doc(p+'/'+id),onSnapshot(n){let last;const s={check(){const ks=[...P2P.store.keys()].filter(k=>p2pParent(k)===p).sort(),ds=ks.map(p2pSnap),j=JSON.stringify(ds.map(d=>[d.id,d.data()]));if(j===last)return;last=j;n({docs:ds})}};P2P.subs.push(s);setTimeout(()=>s.check(),0);return()=>{const i=P2P.subs.indexOf(s);if(i>=0)P2P.subs.splice(i,1)}}}}};
function p2pWrite(path,data){
 if(P2P.role==='host'){p2pApply(path,data);p2pBroadcast({op:'put',path,data});return Promise.resolve()}
 if(!P2P.hostConn||!P2P.hostConn.open)return Promise.reject(Object.assign(new Error('Connessione con l’host persa'),{code:'offline'}));
 const oid=++P2P.oid;return new Promise((res,rej)=>{const t=setTimeout(()=>{P2P.pend.delete(oid);rej(Object.assign(new Error('timeout'),{code:'timeout'}))},9000);P2P.pend.set(oid,{res,rej,t});p2pSend(P2P.hostConn,{op:'set',path,data,oid})})}
function p2pReset(){clearTimeout(P2P.retry);P2P.code=null;P2P.role=null;try{P2P.peer&&P2P.peer.destroy()}catch(e){}P2P.peer=null;P2P.conns.clear();P2P.hostConn=null;P2P.subs.length=0;P2P.store=new Map();P2P.pend.forEach(p=>{clearTimeout(p.t);p.rej(new Error('chiusa'))});P2P.pend.clear();P2P.lost=false;P2P.state='off'}
const p2pOpen=(opts,id,tr)=>new Promise((res,rej)=>{tr=tr||P2P.tr;if(tr==='pj'&&typeof Peer==='undefined')return rej(Object.assign(new Error('PeerJS non disponibile'),{code:'nolib'}));let done=false;const pe=tr==='mq'?new MQPeer(id||null,{bi:MQ.bi}):id?new Peer(id,opts):new Peer(opts);
 const to=setTimeout(()=>{if(!done){done=true;try{pe.destroy()}catch(e){}rej(Object.assign(new Error('Server di incontro non raggiungibile'),{code:'broker'}))}},tr==='mq'?9000:10000);
 pe.on('open',()=>{if(!done){done=true;clearTimeout(to);res(pe)}});pe.on('error',e=>{if(!done){done=true;clearTimeout(to);try{pe.destroy()}catch(x){}rej(Object.assign(new Error(e.type||'errore'),{code:e.type||'err'}))}})});
async function p2pProbe(){const q=new URLSearchParams(location.search);
 if(!q.get('peer')){const order=[MQ.bi,...MQ.list.map((_,i)=>i).filter(i=>i!==MQ.bi)];for(const i of order){try{const c=await mqConnect(MQ.list[i],'tvp'+mqRid(),()=>{},null,6000);c.close();MQ.bi=i;P2P.tr='mq';return true}catch(e){}}}
 if(q.get('mq'))return false;if(typeof Peer==='undefined')return false;try{const pe=await p2pOpen(p2pPeerOpts(),null,'pj');pe.destroy();P2P.tr='pj';return true}catch(e){return false}}
const p2pId=c=>'tvn1-'+c;
/* Validazione delle scritture degli ospiti sull'host: solo percorsi della stanza ospitata, il proprio documento tra i membri
   (la rimozione di un membro resta consentita), dati oggetto di dimensione ragionevole. Una scrittura rifiutata non cambia
   lo stato: l'ospite riceve il valore corrente e la sua attesa si chiude. */
function p2pValid(path,data,dev,code){
 if(typeof path!=='string'||path.length>120)return false;
 const m=/^rooms\/([A-Za-z0-9_-]{3,16})(?:\/(members|chat)\/([\w-]{1,64}))?$/.exec(path);
 if(!m||m[1]!==code)return false;
 if(m[2]==='members'&&data!==null&&m[3]!==dev)return false;
 if(data===null)return true;
 if(typeof data!=='object'||Array.isArray(data))return false;
 try{return JSON.stringify(data).length<=262144}catch(e){return false}}
async function p2pHost(code,restore,keep,fast){p2pReset();let pe;
 for(let i=0;i<5;i++){try{pe=await p2pOpen(p2pPeerOpts(),p2pId(code));break}catch(e){if(e.code==='unavailable-id'&&i<4&&!fast){await new Promise(r=>setTimeout(r,2000));continue}throw e}}
 P2P.peer=pe;P2P.role='host';P2P.code=code;P2P.state='on';
 if(keep)keep.forEach(([k,v])=>P2P.store.set(k,v));else if(restore){try{const o=JSON.parse(ST('rg-p2p-store')||'null');if(o&&o.code===code)o.e.forEach(([k,v])=>P2P.store.set(k,v))}catch(e){}}
 pe.on('connection',c=>{const dev=(c.metadata||{}).dev;
  c.on('open',()=>{P2P.conns.set(c.peer+'/'+c.connectionId,c);p2pSend(c,{op:'snap',e:[...P2P.store]})});
  c.on('data',m=>{if(!m||typeof m!=='object')return;if(m.op==='set'){if(p2pValid(m.path,m.data,dev,code)){p2pApply(m.path,m.data);p2pBroadcast({op:'put',path:m.path,data:m.data,oid:m.oid,by:dev})}else if(m.oid)p2pSend(c,{op:'put',path:String(m.path||''),data:P2P.store.get(m.path)||null,oid:m.oid,by:dev})}});
  const gone=()=>{P2P.conns.delete(c.peer+'/'+c.connectionId);if(!dev)return;setTimeout(()=>{if(P2P.peer!==pe)return;const room=P2P.store.get('rooms/'+code);if(room&&room.phase==='lobby'&&![...P2P.conns.values()].some(x=>(x.metadata||{}).dev===dev)){const mp='rooms/'+code+'/members/'+dev;if(P2P.store.has(mp)){p2pApply(mp,null);p2pBroadcast({op:'put',path:mp,data:null})}}},20000)};
  c.on('close',gone);c.on('error',gone)});
 pe.on('disconnected',()=>{try{pe.reconnect()}catch(e){}});
 if(restore||keep)setTimeout(()=>{if(P2P.peer!==pe)return;const room=P2P.store.get('rooms/'+code);if(!room||room.phase!=='lobby')return;[...P2P.store.keys()].filter(k=>p2pParent(k)==='rooms/'+code+'/members').forEach(k=>{const dv=k.split('/').pop();if(dv!==ME.dev&&![...P2P.conns.values()].some(x=>(x.metadata||{}).dev===dv)){p2pApply(k,null);p2pBroadcast({op:'put',path:k,data:null})}})},30000);
 return p2pDB}
async function p2pJoin(code,tmo,strict){const tr0=P2P.tr,bi0=MQ.bi,cands=[[tr0,bi0]];if(!strict&&tr0==='mq'&&!new URLSearchParams(location.search).get('mq'))MQ.list.forEach((_,i)=>{if(i!==bi0)cands.push(['mq',i])});let last;
 for(const[tr,bi]of cands){p2pReset();P2P.tr=tr;MQ.bi=bi;try{const pe=await p2pOpen(p2pPeerOpts());P2P.peer=pe;P2P.role='guest';P2P.code=code;await p2pLink(code,tmo||(tr===tr0&&bi===bi0?9000:5000));last=null;break}catch(e){last=e}}
 if(last){P2P.tr=tr0;MQ.bi=bi0;throw last}const pe=P2P.peer;pe.on('disconnected',()=>{try{pe.reconnect()}catch(e){}});return p2pDB}
function p2pLink(code,tmo=12000){return new Promise((res,rej)=>{const pe=P2P.peer;let first=true,t;const c=pe.connect(p2pId(code),{metadata:{dev:ME.dev},reliable:true,tries:Math.max(4,Math.ceil(tmo/1500))});
 const fail=(m,cd)=>{if(first){first=false;clearTimeout(t);rej(Object.assign(new Error(m),{code:cd}))}};
 t=setTimeout(()=>fail('Stanza non trovata o host non raggiungibile','timeout'),tmo);
 const onErr=e=>{if(e&&e.type==='peer-unavailable')fail('Stanza '+code+' non trovata','peer-unavailable')};pe.on('error',onErr);
 c.on('data',m=>{if(!m)return;
  if(m.op==='snap'){P2P.store=new Map(m.e);P2P.hostConn=c;P2P.state='on';if(P2P.lost){P2P.lost=false;ui.err='';}p2pNotify();if(first){first=false;clearTimeout(t);res()}}
  else if(m.op==='put'){p2pApply(m.path,m.data);if(m.oid&&m.by===ME.dev&&P2P.pend.has(m.oid)){const p=P2P.pend.get(m.oid);P2P.pend.delete(m.oid);clearTimeout(p.t);p.res()}}});
 const lost=()=>{if(P2P.hostConn===c)P2P.hostConn=null;if(first){fail('Connessione non riuscita','close');return}if(P2P.role!=='guest'||P2P.code!==code)return;
  P2P.lost=true;ui.err='Connessione con l’host persa… riprovo';render();P2P.pend.forEach(p=>{clearTimeout(p.t);p.rej(Object.assign(new Error('Connessione persa'),{code:'offline'}))});P2P.pend.clear();
  clearTimeout(P2P.retry);P2P.retry=setTimeout(P2P.again=function again(){if(P2P.role!=='guest'||P2P.code!==code||!P2P.lost)return;p2pLink(code).then(()=>{ui.err='';const mp='rooms/'+code+'/members/'+ME.dev;if(!P2P.store.has(mp))p2pWrite(mp,p2pClone(R.mine)).catch(()=>{});render()}).catch(()=>{if(code===GENROOM)return p2pRecoverGeneral();P2P.retry=setTimeout(again,3000)})},code===GENROOM?800+Math.random()*2200:2500)};
 c.on('close',lost);c.on('error',lost)})}

/* Ritorno in primo piano (dopo il foglio di condivisione, un'altra app, lo schermo spento): i socket possono essere morti senza
   che nessuno se ne sia accorto. Si controlla il broker, si dà tempo ai collegamenti e si accelera il recupero dell'host. */
function p2pWake(){const pe=P2P.peer;if(!pe||P2P.state==='off')return;
 try{if(typeof pe.revive==='function')pe.revive();else if(pe.disconnected)pe.reconnect()}catch(e){}
 const n=Date.now();P2P.conns.forEach(c=>{if(c.last!=null)c.last=n});if(P2P.hostConn&&P2P.hostConn.last!=null)P2P.hostConn.last=n;
 if(P2P.lost&&P2P.again){clearTimeout(P2P.retry);P2P.retry=setTimeout(P2P.again,300)}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)p2pWake()});
addEventListener('pageshow',e=>{if(e.persisted)p2pWake()});addEventListener('online',p2pWake);

/* stanza generale: se chi la ospitava se ne va, il primo che ci riesce la ospita con lo stato che aveva già (membri, voti, partita) */
let p2pRecovering=false;
async function p2pRecoverGeneral(){if(p2pRecovering)return;p2pRecovering=true;const keep=[...P2P.store];const code=GENROOM;
 try{for(let k=0;k<8;k++){
  try{await p2pTakeover(code,keep);return}catch(e){}
  await new Promise(r=>setTimeout(r,600+Math.random()*900));
  try{R.db=await p2pJoin(code,5000);ST('rg-role','guest');ui.err='';await joinRoom(code);return}catch(e){}
  await new Promise(r=>setTimeout(r,1000+Math.random()*1500))}
  ui.err='Stanza generale non raggiungibile: ricarica la pagina';render()}finally{p2pRecovering=false}}
async function p2pTakeover(code,keep0){const keep=keep0||[...P2P.store];R.db=await p2pHost(code,false,keep,true);ST('rg-role','host');
 const hp='rooms/'+code;const d=P2P.store.get(hp);if(d){const nd=Object.assign({},d,{host:ME.dev});p2pApply(hp,nd)}
 P2P.lost=false;ui.err='';await joinRoom(code);say('Ora ospiti tu la stanza generale')}

/* chi chiude la pagina saluta: gli altri se ne accorgono subito e la stanza generale passa a un altro */
addEventListener('pagehide',e=>{if(e.persisted)return;try{if(P2P.peer)P2P.peer.destroy()}catch(e){}});
