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
    print('prima:',state(A)['members'],state(B)['members'])
    A.close(); t=time.time()
    for i in range(60):
        r=B.evaluate("P2P.role"); 
        if r=='host': break
        B.wait_for_timeout(500)
    print('ruolo B dopo %.1fs: %s'%(time.time()-t,r), state(B))
    cC,C=enter(b,'Terzo',u)
    print('C:',state(C)['members'],'B:',state(B)['members'])
    print('errori:',errs); b.close()
