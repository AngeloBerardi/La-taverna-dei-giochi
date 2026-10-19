import os,sys; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from common import *
port=serve(); errs=[]
def enter(b,name,url):
    c,P=mkpage(b,errs,name,iso=True); P.goto(url); P.wait_for_timeout(800)
    P.fill('#myname',name); P.click('[data-a=setname]')
    for i in range(60):
        s=state(P)
        if s['screen']=='room' and s['code'] and not s['err']: break
        P.wait_for_timeout(300)
    return c,P
with sync_playwright() as p:
    b=p.chromium.launch(); u=f'http://127.0.0.1:{port}/index.html?mq={MQ}'
    cA,A=enter(b,'Host',u); cB,B=enter(b,'Ospite',u)
    hostdev=A.evaluate("ME.dev"); gdev=B.evaluate("ME.dev")
    # (percorso, dato, espressione JS sull'host che deve essere vera se la scrittura è gestita correttamente)
    tests={
     'proprio membro (accettato)':("rooms/PIAZZA/members/"+gdev,"{name:'Nuovo',x:1}","(P2P.store.get('rooms/PIAZZA/members/%s')||{}).x===1"%gdev),
     'membro altrui (rifiutato)':("rooms/PIAZZA/members/"+hostdev,"{name:'HACK'}","(P2P.store.get('rooms/PIAZZA/members/%s')||{}).name!=='HACK'"%hostdev),
     'altra stanza (rifiutato)':("rooms/ALTRA/x","{a:1}","!P2P.store.has('rooms/ALTRA/x')"),
     'percorso strano (rifiutato)':("rooms/PIAZZA/../x","{a:1}","!P2P.store.has('rooms/PIAZZA/../x')"),
     'troppo grande (rifiutato)':("rooms/PIAZZA","{blob:'x'.repeat(300000)}","!(P2P.store.get('rooms/PIAZZA')||{}).blob"),
     'array (rifiutato)':("rooms/PIAZZA/chat/abc","[1,2]","!P2P.store.has('rooms/PIAZZA/chat/abc')"),
     'chat (accettato)':("rooms/PIAZZA/chat/zz1","{text:'ciao'}","P2P.store.has('rooms/PIAZZA/chat/zz1')"),
    }
    for k,(path,data,chk) in tests.items():
        r=B.evaluate("async()=>{try{await R.db.doc('%s').set(%s);return 'ok'}catch(e){return 'err:'+e.message}}"%(path,data))
        B.wait_for_timeout(300)
        print('PASS' if A.evaluate(chk) else 'FAIL',k,'| risposta all\'ospite:',r)
    print('errori:',errs); b.close()
