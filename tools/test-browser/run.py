#!/usr/bin/env python3
"""Test dell'app in Chromium headless (390x844). Servono: python3, playwright (pip) e un browser per playwright.
  npm run build && python3 tools/test-browser/run.py            # tutti
  python3 tools/test-browser/run.py firebase                    # solo gli scenari il cui nome contiene "firebase"
Firebase è simulato (stub.py): nessuna rete, nessun dato vero. Esce con codice 1 se qualcosa fallisce."""
import asyncio, os, re, shutil, socket, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(__file__))
import stub

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
DIST = os.path.join(ROOT, 'dist')
SDK = re.compile(r'^https://www\.gstatic\.com/firebasejs/[\d.]+/(firebase-[a-z]+\.js)$')
RESULTS = []

def check(cond, msg):
    print(('  OK   ' if cond else '  FAIL ') + msg); RESULTS.append(bool(cond)); return bool(cond)

class Server:
    def __init__(self, d):
        s = socket.socket(); s.bind(('127.0.0.1', 0)); self.port = s.getsockname()[1]; s.close()
        self.p = subprocess.Popen(['python3', '-m', 'http.server', str(self.port), '-d', d, '-b', '127.0.0.1'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.8); self.url = f'http://localhost:{self.port}/'
    def stop(self): self.p.terminate()

async def new_context(b, port, name='Tester', sw=False, auth_error=None, extra_init=''):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, service_workers='allow' if sw else 'block')
    init = f"localStorage.setItem('rg-name',{name!r});localStorage.setItem('rg-intro','1');" if name else ''
    if auth_error: init += f"window.__stubAuthError={auth_error!r};"
    await ctx.add_init_script(init + extra_init)
    async def route(r):
        u = r.request.url; m = SDK.match(u)
        if m: return await r.fulfill(status=200, content_type='application/javascript', body=stub.MODULES[m.group(1)])
        if u.startswith(f'http://localhost:{port}'): return await r.continue_()
        await r.abort()
    await ctx.route('**/*', route)
    return ctx

async def page(ctx, url, wait=3500):
    pg = await ctx.new_page(); pg.errs = []; pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    await pg.goto(url); await pg.wait_for_timeout(wait); return pg

# a fine partita (Regicide da solo) con vittoria o sconfitta
FINISH = """async(win)=>{await startGame('regicide',[{dev:ME.dev,name:'Tester'}]);await Q;
 const ns=JSON.parse(JSON.stringify(G));ns.over={win};pushState(ns);await Q;await new Promise(r=>setTimeout(r,600))}"""

async def sc_pwa_installa_e_offline(b, srv):
    ctx = await new_context(b, srv.port, name=None, sw=True); pg = await page(ctx, srv.url, 500)
    await pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)', timeout=15000); await pg.wait_for_timeout(800)
    man = await pg.evaluate("fetch(document.querySelector('link[rel=manifest]').href).then(r=>r.json())")
    check(man['name'] == 'La Taverna dei Giochi' and len(man['icons']) == 3, 'manifest collegato, 3 icone')
    for i in man['icons']:
        st = await pg.evaluate("u=>fetch(u).then(r=>r.status+' '+r.headers.get('content-type'))", i['src'])
        check(st.startswith('200 image/png'), f"icona {i['src']}: {st}")
    await pg.reload(); await pg.wait_for_timeout(800)
    check(await pg.evaluate('!!navigator.serviceWorker.controller'), 'la pagina è controllata dal service worker')
    await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(1200)
    check(await pg.evaluate("typeof render==='function'&&!!document.querySelector('#app')"), 'offline: l\'app parte dalla cache')
    await ctx.set_offline(False)
    await pg.evaluate("(()=>{PWA.ev={prompt(){window.__p=1},userChoice:Promise.resolve({})};ui.cfg=true;render()})()")
    await pg.click('[data-a=pwainstall]'); await pg.wait_for_timeout(300)
    check(await pg.evaluate('window.__p===1'), 'il pulsante Installa lancia il prompt')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_pwa_aggiornamento(b, srv):
    tmp = tempfile.mkdtemp(); d = os.path.join(tmp, 'd'); shutil.copytree(DIST, d); s2 = Server(d)
    try:
        ctx = await new_context(b, s2.port, name=None, sw=True); pg = await page(ctx, s2.url, 500)
        await pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)'); await pg.reload(); await pg.wait_for_timeout(800)
        await pg.evaluate('window.__m=1'); prima = await pg.evaluate('caches.keys()')
        sw = open(d + '/sw.js').read(); open(d + '/sw.js', 'w').write(re.sub(r"const BUILD = '[0-9a-f]+'", "const BUILD = 'nuova'", sw))
        h = open(d + '/index.html').read(); open(d + '/index.html', 'w').write(h.replace('<title>', '<!--v2--><title>', 1))
        await pg.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update())'); await pg.wait_for_timeout(2500)
        dopo = await pg.evaluate('caches.keys()')
        check(await pg.evaluate('window.__m||0') == 0, 'nuova versione: ricarica da sola (fuori partita)')
        check('taverna-nuova' in dopo and not any(k not in ('taverna-nuova', 'taverna-font') for k in dopo), f'cache vecchia cancellata: {prima} -> {dopo}')
        check('<!--v2-->' in await pg.content(), 'viene servita la pagina nuova'); await ctx.close()
    finally: s2.stop(); shutil.rmtree(tmp, ignore_errors=True)

async def sc_firebase_profilo_e_premi(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    st = await pg.evaluate('[FB.st,FB.uid,FB.p&&FB.p.coins,FB.p&&FB.p.name]')
    check(st[0] == 'ok' and st[2] == 0 and st[3] == 'Tester', f'avvio: profilo creato {st}')
    r = await pg.evaluate("(async()=>{const f=" + FINISH + ";await f(true);return[FB.p.coins,FB.p.played,FB.p.wins,FB.q.length]})()")
    check(r == [25, 1, 1, 0], f'vittoria: monete/partite/vittorie/coda = {r}')
    r = await pg.evaluate("(async()=>{const f=" + FINISH + ";await f(false);return[FB.p.coins,FB.q.length,JSON.parse(localStorage.getItem('rg-fbq')).length]})()")
    check(r == [25, 1, 1], f'secondo premio subito dopo: rifiutato e in coda (anche sul telefono) {r}')
    h = await pg.evaluate("(()=>{ui.cfg=true;render();const t=document.body.innerText;ui.cfg=false;render();return t})()")
    check('25 monete' in h, 'impostazioni mostrano il profilo')
    await pg.reload(); await pg.wait_for_timeout(3500)
    check(await pg.evaluate('[FB.p.coins,FB.p.played]') == [25, 1], 'dopo il ricarico il profilo è quello salvato')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_firebase_accesso_negato(b, srv):
    ctx = await new_context(b, srv.port, auth_error='auth/admin-restricted-operation'); pg = await page(ctx, srv.url)
    r = await pg.evaluate("(async()=>{ui.cfg=true;render();const t=document.body.innerText;ui.cfg=false;render();const f=" + FINISH + ";await f(true);return[FB.st,t.includes('auth/admin-restricted-operation'),!!G.over,FB.q.length]})()")
    check(r == ['err', True, True, 1], f'errore mostrato, partita normale, premio in coda {r}')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()


async def sc_bottega(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    # il profilo parte con 100 monete (simulatore): ricarico perché l'app lo rilegga
    await pg.evaluate("(()=>{const k=Object.keys(window.__db).find(x=>x.startsWith('players/'));window.__db[k].coins=100;localStorage.setItem('__stub',JSON.stringify(window.__db))})()")
    await pg.reload(); await pg.wait_for_timeout(3500)
    check(await pg.evaluate('FB.p.coins') == 100, 'profilo con 100 monete')
    await pg.evaluate("ui.cfg=true;render()")
    check(await pg.evaluate("!!document.querySelector('[data-a=shop]')"), 'le impostazioni hanno il pulsante Bottega')
    await pg.click('[data-a=shop]'); await pg.wait_for_timeout(200)
    check(await pg.evaluate("document.querySelectorAll('.shopi').length") == 7, 'bottega: classico + 6 dorsi')
    check(await pg.evaluate("document.querySelector('[data-a=shopbuy][data-v=dorso-oro]').disabled") is True, 'dorso da 160 con 100 monete: pulsante disattivato')
    await pg.click('[data-a=shopbuy][data-v=dorso-notte]'); await pg.wait_for_timeout(500)
    st = await pg.evaluate("[FB.p.coins,!!FB.p.owned['dorso-notte'],FB.p.equipped.dorso,document.documentElement.dataset.dorso,localStorage.getItem('rg-dorso')]")
    check(st == [60, True, 'dorso-notte', 'notte', 'dorso-notte'], f'acquisto a 40: monete, posseduto, in uso, attributo, memoria locale = {st}')
    bordo = await pg.evaluate("(()=>{const e=document.createElement('div');e.className='card back';document.body.appendChild(e);const c=getComputedStyle(e).borderTopColor;e.remove();return c})()")
    check(bordo == 'rgb(143, 160, 224)', f'una carta coperta qualsiasi usa il dorso scelto (bordo {bordo})')
    await pg.click('[data-a=shopbuy][data-v=dorso-bosco]'); await pg.wait_for_timeout(400)
    await pg.click('[data-a=shopuse][data-v=dorso-notte]'); await pg.wait_for_timeout(400)
    check(await pg.evaluate("[FB.p.coins,FB.p.equipped.dorso,document.documentElement.dataset.dorso]") == [0, 'dorso-notte', 'notte'], 'secondo acquisto (60) poi si torna al dorso notte')
    await pg.click('[data-a=shopuse][data-v=dorso-classico]'); await pg.wait_for_timeout(400)
    check(await pg.evaluate("[FB.p.equipped.dorso,document.documentElement.dataset.dorso]") == ['dorso-classico', ''], 'dorso classico: attributo vuoto')
    # una scelta non posseduta (manomessa) non si applica dopo il ricarico
    await pg.evaluate("(()=>{const k=Object.keys(window.__db).find(x=>x.startsWith('players/'));window.__db[k].equipped={dorso:'dorso-oro'};localStorage.setItem('__stub',JSON.stringify(window.__db))})()")
    await pg.reload(); await pg.wait_for_timeout(3500)
    check(await pg.evaluate("document.documentElement.dataset.dorso") == '', 'dorso non posseduto ignorato dopo il ricarico')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

SCENARI = [v for k, v in sorted(globals().items()) if k.startswith('sc_')]

async def main():
    filtro = sys.argv[1:]
    if not os.path.exists(DIST + '/index.html'): sys.exit('manca dist/: lancia prima npm run build')
    srv = Server(DIST)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for sc in SCENARI:
                if filtro and not any(f in sc.__name__ for f in filtro): continue
                print(sc.__name__[3:]); await sc(b, srv)
            await b.close()
    finally: srv.stop()
    print('RISULTATO:', 'TUTTO OK' if all(RESULTS) else 'CI SONO ERRORI', f'({sum(RESULTS)}/{len(RESULTS)})'); sys.exit(0 if all(RESULTS) else 1)
asyncio.run(main())
