/* ---- rete ---- */
async function netInit(){if(R.tried)return;R.tried=true;const nq=new URLSearchParams(location.search).get('net');
 ME.dev=ST('rg-dev')||('d'+rid()+rid());ST('rg-dev',ME.dev);
 if(nq!=='db'&&!window.__NETDB&&await p2pProbe()){R.mode='p2p';R.on=true;return}
 try{const c=window.claude;if(!c)return;const[d,u]=await Promise.all([c.use('db'),c.use('user')]);const id=u?await u.id():null;if(d&&id){R.db=d;ME.dev=id;R.on=true;R.mode='db'}}catch(e){}}
function unsubAll(){R.un.forEach(f=>{try{f()}catch(e){}});R.un=[]}
async function enterHub(){ui.screen='room';ui.err='';R.mine.name=ME.name;render();await netInit();
 if(!R.on){try{const o=JSON.parse(ST('rg-off')||'null');if(o&&o.mine)R.mine={...o.mine,name:ME.name}}catch(e){}render();return}
 if(R.mode==='p2p'){try{await p2pEnter()}catch(e){ui.err=netErr(e);render()}return}
 try{let code=ST('rg-room');
  if(code){const sn=await R.db.doc('rooms/'+code).get();if(!sn.exists)code=null;else{const d=sn.data();if(d.phase==='play'&&!(d.seats||[]).some(x=>x.dev===ME.dev))code=null}}
  if(!code)code=await createRoom();await joinRoom(code)}catch(e){ui.err=netErr(e);render()}}
async function p2pCreate(){for(let i=0;i<6;i++){const c=newCode();try{R.db=await p2pHost(c,false);ST('rg-role','host');await R.db.doc('rooms/'+c).set({host:ME.dev,t:Date.now(),phase:'lobby',game:null,opts:{},seats:[],s:null,rev:0});return c}catch(e){if(e.code!=='unavailable-id')throw e}}throw new Error('nessun codice libero')}
async function p2pEnter(){let code=ST('rg-room'),role=ST('rg-role');if(code){try{if(role==='host'){R.db=await p2pHost(code,true);if(!(await R.db.doc('rooms/'+code).get()).exists)code=null}else{R.db=await p2pJoin(code);ST('rg-role','guest')}}catch(e){code=null}}
 if(code){const d=(await R.db.doc('rooms/'+code).get()).data();if(d&&d.phase==='play'&&!(d.seats||[]).some(x=>x.dev===ME.dev))code=null}
 if(!code)code=await p2pCreate();await joinRoom(code)}
const netErr=e=>e&&e.code==='broker'?'Il server di incontro non è raggiungibile: controlla la connessione.':e&&(e.code==='peer-unavailable'||e.code==='timeout'||e.code==='close')&&R.mode==='p2p'?'Stanza non trovata: controlla il codice (l’host deve avere la pagina aperta).':e&&e.code==='invalid_argument'?'Non hai il permesso di scrivere in questa pagina: chiedi al proprietario di condividerla come Contributor.':'Errore di rete: '+(e&&(e.message||e.code)||e);
async function createRoom(){for(let i=0;i<6;i++){const c=newCode(),ref=R.db.doc('rooms/'+c);const sn=await ref.get();if(!sn.exists){await ref.set({host:ME.dev,t:Date.now(),phase:'lobby',game:null,opts:{},seats:[],s:null,rev:0});return c}}throw new Error('nessun codice libero')}
async function joinRoom(code){const old=R.code;unsubAll();
 if(old&&old!==code){try{await R.db.doc('rooms/'+old+'/members/'+ME.dev).delete()}catch(e){}}
 R.code=code;R.ref=R.db.doc('rooms/'+code);R.rev=0;R.doc=null;R.members=[];R.chat=[];G=null;fxDone=null;
 const meRef=R.db.doc('rooms/'+code+'/members/'+ME.dev),ex=await meRef.get(),pv=ex.exists?ex.data():null;
 R.mine={name:ME.name,t:pv?pv.t:Date.now(),guests:pv?pv.guests||[]:R.mine.guests||[],votes:pv?pv.votes||{}:{}};await meRef.set(R.mine);ST('rg-room',code);subscribe()}
function subscribe(){
 R.un.push(R.ref.onSnapshot(sn=>{if(!sn.exists){ST('rg-room','');R.code='';unsubAll();enterHub();return}
  const d=sn.data();R.doc=d;const seated=d.phase==='play'&&!!d.s&&(d.seats||[]).some(x=>x.dev===ME.dev),was=ui.screen;
  ui.screen=ui.screen==='name'?'name':seated?'game':'room';
  if(seated){if(d.rev>=R.rev){const ch=d.rev>R.rev;R.rev=d.rev;if(ch){ui.sel=[];ui.tsel=[]}if(was!=='game'){fxDone=null;G=null;ui.shown=-1}pushState(d.s,false);return}}
  else{R.rev=Math.max(R.rev,d.rev||0);if(was==='game'){G=null;ui.anim=false}}
  render()},e=>{ui.err='Connessione persa ('+e.code+')';render()}));
 R.un.push(R.db.collection('rooms/'+R.code+'/members').onSnapshot(q=>{R.members=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.t-b.t||(a.id<b.id?-1:1));if(ui.screen==='room'){render();tvLater()}},()=>{}));
 R.un.push(R.db.collection('rooms/'+R.code+'/chat').onSnapshot(q=>{const n0=R.chat.length;R.chat=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.t-b.t);if(ui.screen==='room'){render();tvLater();const l=$('#chatlog');if(l)l.scrollTop=l.scrollHeight}else if(R.chat.length>n0&&ui.screen==='game')ui.unread=(ui.unread||0)+1},()=>{}))}
async function writeRoom(patch){if(patch.rev!=null)R.rev=patch.rev;R.doc={...R.doc,...patch};await R.ref.set(R.doc)}
async function saveMine(){if(!R.on){ST('rg-off',JSON.stringify({mine:R.mine,game:G&&ui.screen==='game'?{G,seats:R.offSeats}:null}));render();return}
 try{await R.db.doc('rooms/'+R.code+'/members/'+ME.dev).set(R.mine)}catch(e){ui.err=netErr(e)}render()}
function saveOff(s){if(!R.on)ST('rg-off',JSON.stringify({mine:R.mine,game:s?{G:s,seats:R.offSeats}:null}))}
