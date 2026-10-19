import sys,threading, http.server, socketserver, functools, time, json
from playwright.sync_api import sync_playwright
import os
ROOT=os.environ.get('ROOT',os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','dist'))
MQ='ws://127.0.0.1:18840'
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
def serve():
    srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=ROOT)); srv.daemon_threads=True
    threading.Thread(target=srv.serve_forever,daemon=True).start(); return srv.server_address[1]
def mkpage(b,errs,tag,gl=False,force3d=False,iso=False):
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    pg=ctx.new_page()
    pg.on('pageerror',lambda e: errs.append((tag,'pageerror',str(e)[:200])))
    pg.route('**/*',lambda r: r.continue_() if (r.request.url.startswith('http://127.0.0.1') or r.request.url.startswith('ws://127.0.0.1')) else r.abort())
    if iso: pg.add_init_script("localStorage.setItem('rg-lb','iso')")
    if force3d: pg.add_init_script("localStorage.setItem('rg-3dforce','1');localStorage.setItem('rg-3dfps','8')")
    return ctx,pg
def state(pg):
    return pg.evaluate("({screen:ui.screen,code:R.code,err:ui.err,on:R.on,mode:R.mode,tr:(typeof P2P!=='undefined'?P2P.tr:null),members:R.members.map(m=>m.name),lobby:ui.lobby})")
