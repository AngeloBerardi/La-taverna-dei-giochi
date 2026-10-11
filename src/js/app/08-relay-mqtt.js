/* ================= RELAY MQTT (WebSocket) =================
   Canale di riserva a PeerJS/WebRTC: i messaggi passano da un broker MQTT pubblico, quindi funziona anche
   in 4G e dietro NAT dove WebRTC senza TURN fallisce. Espone le stesse API di Peer/DataConnection usate in p2p.js. */
const MQ={list:(()=>{const q=new URLSearchParams(location.search).get('mq');return q?[q]:['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081/mqtt']})(),
 pre:'latavdg/v1/',bi:(()=>{const b=+new URLSearchParams(location.search).get('b');return b>=0&&b<9?b:0})()};
function mqConnect(url,cid,onMsg,onClose,timeout=7000){return new Promise((res,rej)=>{let ws,done=false,buf=new Uint8Array(0),pid=1,ping=0;
 const te=new TextEncoder(),td=new TextDecoder();
 const str=s=>{const b=te.encode(s);const o=new Uint8Array(b.length+2);o[0]=b.length>>8;o[1]=b.length&255;o.set(b,2);return o};
 const len=n=>{const o=[];do{let d=n%128;n=Math.floor(n/128);if(n>0)d|=128;o.push(d)}while(n>0);return o};
 const pkt=(h,...parts)=>{const body=parts.reduce((a,p)=>{const o=new Uint8Array(a.length+p.length);o.set(a);o.set(p,a.length);return o},new Uint8Array(0));const L=len(body.length);const o=new Uint8Array(1+L.length+body.length);o[0]=h;o.set(L,1);o.set(body,1+L.length);return o};
 const send=p=>{try{if(ws&&ws.readyState===1)ws.send(p)}catch(e){}};
 const api={sub(t){const id=pid++&65535||1;send(pkt(0x82,new Uint8Array([id>>8,id&255]),str(t),new Uint8Array([0])))},
  pub(t,obj){send(pkt(0x30,str(t),te.encode(JSON.stringify(obj))))},
  close(){clearInterval(ping);try{send(new Uint8Array([0xE0,0]));ws.close()}catch(e){}},get open(){return ws&&ws.readyState===1}};
 const fail=m=>{if(!done){done=true;clearTimeout(to);try{ws.close()}catch(e){}rej(Object.assign(new Error(m),{code:'broker'}))}};
 const to=setTimeout(()=>fail('Server di incontro non raggiungibile'),timeout);
 try{ws=new WebSocket(url,'mqtt')}catch(e){return fail('ws')}
 ws.binaryType='arraybuffer';
 ws.onopen=()=>{const vh=new Uint8Array([0,4,77,81,84,84,4,2,0,30]);send(pkt(0x10,vh,str(cid)))};
 ws.onmessage=ev=>{const d=new Uint8Array(ev.data);const n=new Uint8Array(buf.length+d.length);n.set(buf);n.set(d,buf.length);buf=n;
  for(;;){if(buf.length<2)break;let m=1,v=0,i=1,b;do{if(i>=buf.length)return;b=buf[i++];v+=(b&127)*m;m*=128}while(b&128);if(buf.length<i+v)break;
   const h=buf[0],body=buf.slice(i,i+v);buf=buf.slice(i+v);const ty=h>>4;
   if(ty===2){if(body[1]===0){if(!done){done=true;clearTimeout(to);ping=setInterval(()=>send(new Uint8Array([0xC0,0])),20000);res(api)}}else fail('rifiutato '+body[1])}
   else if(ty===3){const tl=(body[0]<<8)|body[1],topic=td.decode(body.slice(2,2+tl));let off=2+tl;if((h>>1)&3)off+=2;try{onMsg(topic,JSON.parse(td.decode(body.slice(off))))}catch(e){}}}};
 ws.onerror=()=>fail('errore');ws.onclose=()=>{clearInterval(ping);if(!done)fail('chiuso');else onClose&&onClose()}})}
const mqRid=()=>Math.random().toString(36).slice(2,10);
class MQConn{constructor(peer,remote,cid,meta){this._p=peer;this.peer=remote;this.connectionId=cid;this.metadata=meta||{};this.open=false;this._h={};this.last=Date.now()}
 on(e,f){(this._h[e]=this._h[e]||[]).push(f)}
 _emit(e,...a){(this._h[e]||[]).slice().forEach(f=>{try{f(...a)}catch(x){console.error(x)}})}
 send(d){if(this.open)this._p._out(this.peer,{t:'d',c:this.connectionId,d})}
 close(){if(this._gone)return;this._p._out(this.peer,{t:'bye',c:this.connectionId});this._end()}
 _end(){if(this._gone)return;this._gone=true;this.open=false;this._p.conns.delete(this.connectionId);this._emit('close')}}
class MQPeer{constructor(id,opts){if(typeof id==='object'){opts=id;id=null}this.id=id||('g'+mqRid());this._h={};this.conns=new Map();this.dead=false;this.bi=(opts&&opts.bi)||0;this.nonce=mqRid();this._hb=setInterval(()=>this._beat(),4000);this._go(true)}
 on(e,f){(this._h[e]=this._h[e]||[]).push(f)}
 _emit(e,...a){(this._h[e]||[]).slice().forEach(f=>{try{f(...a)}catch(x){console.error(x)}})}
 _top(id){return MQ.pre+id}
 async _go(first){try{this.c=await mqConnect(MQ.list[this.bi],'tv'+mqRid()+mqRid(),(t,m)=>this._in(m),()=>{if(!this.dead)this._emit('disconnected')});if(this.dead){this.c.close();return}
   this.c.sub(this._top(this.id));
   if(first){if(this.id.startsWith('tvn')){this.c.pub(this._top(this.id),{t:'who',n:this.nonce});await new Promise(r=>setTimeout(r,900));if(this._taken){this._emit('error',{type:'unavailable-id'});return}}this._emit('open',this.id)}}
  catch(e){if(first)this._emit('error',{type:'broker'});else setTimeout(()=>{if(!this.dead)this._go(false)},3000)}}
 reconnect(){if(this.dead)return;if(!this.c||!this.c.open)this._go(false)}
 disconnect(){}
 destroy(){if(this.dead)return;this.dead=true;clearInterval(this._hb);[...this.conns.values()].forEach(c=>c.close());setTimeout(()=>{try{this.c&&this.c.close()}catch(e){}},150)}
 _out(to,m){if(this.c)this.c.pub(this._top(to),{...m,f:this.id})}
 _beat(){const now=Date.now();this.conns.forEach(c=>{if(!c.open)return;if(now-c.last>15000){c._end();return}this._out(c.peer,{t:'hb',c:c.connectionId})})}
 connect(id,o){const c=new MQConn(this,id,'c'+mqRid(),o&&o.metadata);this.conns.set(c.connectionId,c);
  const syn=()=>this._out(id,{t:'syn',c:c.connectionId,m:c.metadata});syn();let k=0;const rt=setInterval(()=>{if(c.open||c._gone||this.dead){clearInterval(rt);return}if(++k>=4){clearInterval(rt);this.conns.delete(c.connectionId);this._emit('error',{type:'peer-unavailable'});return}syn()},1500);return c}
 _in(m){if(!m||typeof m!=='object')return;
  if(m.t==='who'){if(m.n!==this.nonce&&!this.dead&&this._opened!==false)this._out(this.id,{t:'here',n:m.n});return}
  if(m.t==='here'){if(m.n===this.nonce)this._taken=true;return}
  if(m.f===this.id)return;
  if(m.t==='syn'){let c=this.conns.get(m.c);if(c){this._out(m.f,{t:'ack',c:m.c});return}c=new MQConn(this,m.f,m.c,m.m);this.conns.set(m.c,c);this._emit('connection',c);this._out(m.f,{t:'ack',c:m.c});setTimeout(()=>{c.open=true;c.last=Date.now();c._emit('open')},0);return}
  const c=this.conns.get(m.c);if(!c)return;c.last=Date.now();
  if(m.t==='ack'){if(!c.open){c.open=true;c._emit('open')}}
  else if(m.t==='d')c._emit('data',m.d);
  else if(m.t==='bye')c._end()}}
