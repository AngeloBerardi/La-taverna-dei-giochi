const A=require('aedes'); const http=require('http'); const {WebSocketServer,createWebSocketStream}=require('ws');
(async()=>{const Ctor=A.Aedes||A.default||A; const aedes=typeof Ctor.createBroker==='function'?await Ctor.createBroker():new Ctor();
const srv=http.createServer(); const wss=new WebSocketServer({server:srv,handleProtocols:()=>'mqtt'});
wss.on('connection',s=>aedes.handle(createWebSocketStream(s)));
const port=+process.argv[2]||18840; srv.listen(port,'127.0.0.1',()=>console.log('broker su',port));
http.createServer((q,r)=>{if(q.url.startsWith('/hole')){const i=+(q.url.split('i=')[1]||0);const c=[...wss.clients][i];if(c){c.send=()=>{};c._socket.pause();r.end('buco su client '+i)}else r.end('nessun client');return}if(q.url==='/drop'){let n=0;wss.clients.forEach(c=>{n++;c.terminate()});r.end('dropped '+n)}else r.end(String(wss.clients.size))}).listen(port+1,'127.0.0.1');})();
