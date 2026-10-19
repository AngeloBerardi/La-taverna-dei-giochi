import os,sys; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from common import *
port=serve(); errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    cA,A=mkpage(b,errs,'host',iso=True); A.goto(f'http://127.0.0.1:{port}/index.html?mq={MQ}'); A.wait_for_timeout(1000)
    A.fill('#myname','Host'); A.click('[data-a=setname]')
    t0=time.time()
    for i in range(40):
        s=state(A)
        if s['screen']=='room' and s['code']: break
        A.wait_for_timeout(300)
    print('HOST pronto in %.1fs'%(time.time()-t0), s)
    code=s['code']; bi=A.evaluate("MQ.bi")
    url=f'http://127.0.0.1:{port}/index.html?room={code}&b={bi}&mq={MQ}'
    print('invito:',url.replace(f'127.0.0.1:{port}','H'))
    cB,B=mkpage(b,errs,'guest',iso=True); B.goto(url); B.wait_for_timeout(1000)
    print('GUEST all\'apertura:',state(B))
    B.fill('#myname','Ospite'); B.click('[data-a=setname]'); t1=time.time()
    last=None
    for i in range(80):
        s=state(B); key=json.dumps([s['screen'],s['code'],s['err'],len(s['members'])])
        if key!=last: print('  +%.1fs'%(time.time()-t1), s); last=key
        if s['screen']=='room' and s['code']==code and len(s['members'])>=2 and not s['err']: break
        B.wait_for_timeout(500)
    print('HOST vede membri:',state(A)['members'])
    print('errori pagina:',errs)
    b.close()
