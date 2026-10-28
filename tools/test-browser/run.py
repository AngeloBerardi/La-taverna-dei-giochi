#!/usr/bin/env python3
"""Test dell'app in Chromium headless (390x844). Servono: python3, playwright (pip) e un browser per playwright.
  npm run build && python3 tools/test-browser/run.py            # tutti
  python3 tools/test-browser/run.py firebase                    # solo gli scenari il cui nome contiene "firebase"
Firebase è simulato (stub.py): nessuna rete, nessun dato vero. Esce con codice 1 se qualcosa fallisce."""
import asyncio, contextvars, json, os, re, shutil, socket, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(__file__))
import stub

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
DIST = os.path.join(ROOT, 'dist')
SDK = re.compile(r'^https://www\.gstatic\.com/firebasejs/[\d.]+/(firebase-[a-z]+\.js)$')
RESULTS = []

USCITA = contextvars.ContextVar('uscita', default=None)
def check(cond, msg):
    riga = ('  OK   ' if cond else '  FAIL ') + msg
    if USCITA.get() is not None: USCITA.get().append(riga)
    else: print(riga)
    RESULTS.append(bool(cond)); return bool(cond)

class Server:
    def __init__(self, d):
        s = socket.socket(); s.bind(('127.0.0.1', 0)); self.port = s.getsockname()[1]; s.close()
        self.p = subprocess.Popen(['python3', '-m', 'http.server', str(self.port), '-d', d, '-b', '127.0.0.1'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(0.8); self.url = f'http://localhost:{self.port}/'
    def stop(self): self.p.terminate()

class Shared:
    """Archivio Firestore condiviso tra più contesti (= più telefoni): lo stub ne parla con fetch('/__fs')."""
    def __init__(self): self.d = {}
    async def handle(self, route):
        o = json.loads(route.request.post_data); op = o['op']; out = {}
        if op == 'get': out = {'v': self.d.get(o['k'])}
        elif op == 'put': self.d[o['k']] = o['v']
        elif op == 'del': self.d.pop(o['k'], None)
        elif op == 'cas':
            ok = self.d.get(o['k']) == o['e']
            if ok: self.d[o['k']] = o['v']
            out = {'ok': ok}
        elif op == 'tree':  # tutto ciò che sta sotto un ramo (percorsi relativi)
            c = o['c']; out = {'rows': [{'k': k[len(c) + 1:], 'v': v} for k, v in self.d.items() if k.startswith(c + '/')]}
        elif op == 'deltree':
            for k in [k for k in self.d if k == o['k'] or k.startswith(o['k'] + '/')]: del self.d[k]
        elif op == 'list':
            c = o['c']; n = len(c.split('/')) + 1
            out = {'rows': [{'id': k.split('/')[-1], 'd': v} for k, v in self.d.items() if k.startswith(c + '/') and len(k.split('/')) == n]}
        await route.fulfill(status=200, content_type='application/json', body=json.dumps(out))

async def new_context(b, port, name='Tester', sw=False, auth_error=None, extra_init='', shared=None):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, service_workers='allow' if sw else 'block')
    init = "localStorage.setItem('rg-lb','iso');" + (f"localStorage.setItem('rg-name',{name!r});localStorage.setItem('rg-intro','1');" if name else '')  # falò: il 3D in software rallenta i test
    if auth_error: init += f"window.__stubAuthError={auth_error!r};"
    if shared: init += 'window.__stubShared=true;'
    await ctx.add_init_script(init + extra_init)
    async def route(r):
        u = r.request.url; m = SDK.match(u)
        if m: return await r.fulfill(status=200, content_type='application/javascript', body=stub.MODULES[m.group(1)])
        if u.startswith(f'http://localhost:{port}'): return await r.continue_()
        await r.abort()
    await ctx.route('**/*', route)
    if shared: await ctx.route('**/__fs', shared.handle)
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
        check('taverna-nuova' in dopo and not any(k not in ('taverna-nuova', 'taverna-font', 'taverna-vendor') for k in dopo), f'cache vecchia cancellata: {prima} -> {dopo}')
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

async def sc_firebase_coda_premi(b, srv):
    # la coda dei premi non si blocca: il limite dei 50 s si riprova da solo; un premio guasto perde l'ELO e poi viene scartato
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    r = await pg.evaluate("(async()=>{const f=" + FINISH + ";await f(true);await f(false);return[FB.p.coins,FB.q.length,FB.q[0]&&FB.q[0].ko||0,!!FB.tq,FB.err]})()")
    check(r == [25, 1, 0, True, ''], f'secondo premio entro 50 s: resta in coda senza contare come errore, riprova programmata {r}')
    r = await pg.evaluate("""(async()=>{const vero=Date.now;Date.now=()=>vero()+70000;await FB.flush();Date.now=vero;return[FB.p.coins,FB.q.length]})()""")
    check(r == [35, 0], f'passato il minuto il premio arriva {r}')
    r = await pg.evaluate("""(async()=>{const a=FB.award,rc=FB.recente;FB.recente=async()=>false;
      FB.award=async x=>{if(x.rotto){const e=new Error('permission-denied');e.code='permission-denied';throw e}return a(x)};
      FB.q.push({n:10,won:false,gid:'x1',elo:{g:'scopa'},rotto:1},{n:10,won:false,gid:'x2',elo:null});FB.saveQ();const st=[];
      for(let i=0;i<4;i++){await FB.flush();st.push([FB.q.length,FB.q[0]&&FB.q[0].ko||0,!!(FB.q[0]&&FB.q[0].elo)])}
      ui.cfg=true;ui.cfgAll=true;render();const t=document.body.innerText;ui.cfg=false;ui.cfgAll=false;render();FB.award=a;FB.recente=rc;return[st,t.includes('ultimo errore: permission-denied')]})()""")
    check(r[0][0] == [2, 1, True] and r[0][1] == [2, 2, False] and r[0][3][0] == 1 and r[1], f'premio guasto: ELO tolto al 2° rifiuto, scartato al 4°, errore mostrato {r}')
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

async def vendor_pg(ctx, url, wait=3500):
    pg = await ctx.new_page(); pg.errs = []; pg.reqs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e))); pg.on('request', lambda r: pg.reqs.append(r.url))
    await pg.goto(url); await pg.wait_for_timeout(wait); return pg

def vendor_chiesti(pg): return sorted(re.findall(r'/vendor/([a-z]+)\.', ' '.join(pg.reqs)))

async def sc_vendor_su_richiesta(b, srv):
    # database (predefinito): niente librerie esterne né PeerJS né three.js
    ctx = await new_context(b, srv.port, shared=Shared(), extra_init="localStorage.setItem('rg-lb','iso');window.__stubRt=true;"); pg = await vendor_pg(ctx, srv.url, 5000)
    check(await pg.evaluate('R.mode') == 'rt' and vendor_chiesti(pg) == [], f'database: nessuna libreria scaricata {vendor_chiesti(pg)}')
    check(await pg.evaluate('!window.THREE && typeof Peer==="undefined"'), 'database: né THREE né Peer')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()
    # p2p (solo prove, ?net=p2p): three.js non viene nemmeno scaricato, PeerJS sì (serve alla stanza)
    ctx = await new_context(b, srv.port, extra_init="localStorage.setItem('rg-lb','iso');"); pg = await vendor_pg(ctx, srv.url + '?net=p2p')
    check(vendor_chiesti(pg) == ['peerjs'], f'falò: scaricato solo peerjs {vendor_chiesti(pg)}')
    check(await pg.evaluate('!window.THREE && typeof Peer!=="undefined"'), 'falò: THREE assente, Peer presente')
    check(len(await pg.inner_html('#app')) > 500, 'falò: la lobby è disegnata')
    # passando alla lobby 3D dalle impostazioni, three.js viene caricato in quel momento
    gl = await pg.evaluate('VENDOR.gl()')
    await pg.evaluate("(()=>{const s=document.createElement('select');s.id='lb';s.innerHTML='<option value=3d>3d</option>';document.body.appendChild(s);s.value='3d';s.dispatchEvent(new Event('change',{bubbles:true}))})()")
    await pg.wait_for_timeout(2500)
    if gl: check(await pg.evaluate('!!window.THREE') and 'three' in vendor_chiesti(pg), 'cambio lobby: three caricato al bisogno')
    else: print('  --   WebGL assente in questo browser: cambio lobby non verificabile')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()
    # lobby 3D all'avvio: three.js caricato prima del primo disegno
    ctx = await new_context(b, srv.port, extra_init="localStorage.setItem('rg-lb','3d');"); pg = await vendor_pg(ctx, srv.url, 5000)
    gl = await pg.evaluate('VENDOR.gl()')
    if gl: check('three' in vendor_chiesti(pg) and await pg.evaluate('!!window.THREE'), 'avvio 3D: three caricato')
    else: check('three' not in vendor_chiesti(pg), 'senza WebGL three non si scarica')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_vendor_guasto(b, srv):
    # three.js non scaricabile: l'app parte lo stesso (ripiego sul falò), senza errori
    ctx = await new_context(b, srv.port, extra_init="localStorage.setItem('rg-lb','3d');VENDOR_FORZA=1;")
    await ctx.route('**/vendor/three.*', lambda r: r.abort())
    pg = await vendor_pg(ctx, srv.url, 5000)
    check(await pg.evaluate('!window.THREE'), 'three guasto: THREE assente')
    check(len(await pg.inner_html('#app')) > 500, 'three guasto: l\'app si disegna comunque')
    check(not [e for e in pg.errs if 'vendor' not in e], f'nessun errore JS imprevisto {pg.errs[:1]}'); await ctx.close()
    # PeerJS non scaricabile: si usa il relay, l'app non si blocca
    ctx = await new_context(b, srv.port, extra_init="localStorage.setItem('rg-lb','iso');")
    await ctx.route('**/vendor/peerjs.*', lambda r: r.abort())
    pg = await vendor_pg(ctx, srv.url + '?net=p2p', 5000)
    check(len(await pg.inner_html('#app')) > 500, 'peerjs guasto: l\'app si disegna comunque')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_vendor_offline_e_cache(b, srv):
    ctx = await new_context(b, srv.port, name=None, sw=True, extra_init="localStorage.setItem('rg-lb','iso');")
    pg = await vendor_pg(ctx, srv.url + '?net=p2p', 500)
    await pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)', timeout=15000); await pg.wait_for_timeout(1500)
    nomi = await pg.evaluate("caches.open('taverna-vendor').then(c=>c.keys()).then(k=>k.map(r=>new URL(r.url).pathname))")
    check(len(nomi) == 3 and all(n.startswith('/vendor/') for n in nomi), f'le librerie sono nella cache dedicata {nomi}')
    await pg.reload(); await pg.wait_for_timeout(800)
    await ctx.set_offline(True); await pg.reload(); await pg.wait_for_timeout(1500)
    check(await pg.evaluate('VENDOR.load("peerjs").then(()=>typeof Peer!=="undefined",()=>false)'), 'offline: PeerJS arriva dalla cache')
    await ctx.set_offline(False); await ctx.close()

async def sc_account_email(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    uid0 = await pg.evaluate('FB.uid')
    await pg.evaluate("(()=>{window.__db['players/'+FB.uid].coins=77;localStorage.setItem('__stub',JSON.stringify(window.__db))})()")
    await pg.reload(); await pg.wait_for_timeout(3500)
    await pg.evaluate("(()=>{ui.cfg=true;render()})()")
    check('Profilo anonimo' in await pg.inner_text('.modal'), 'impostazioni: profilo anonimo')
    await pg.click('.modal [data-a=acc]'); await pg.wait_for_timeout(200)
    # password corta e email già usata danno messaggi chiari
    await pg.fill('#acc-mail', 'a@b.it'); await pg.fill('#acc-pw', '123'); await pg.click('[data-a=acclink]'); await pg.wait_for_timeout(500)
    check('almeno 6' in await pg.inner_text('.acc-msg'), 'password corta rifiutata con messaggio')
    await pg.fill('#acc-pw', 'segreta1'); await pg.click('[data-a=acclink]'); await pg.wait_for_timeout(500)
    check(await pg.evaluate('FB.mail()') == 'a@b.it' and await pg.evaluate('FB.uid') == uid0, 'email collegata, stesso profilo')
    check('a@b.it' in await pg.inner_text('.modal') and await pg.query_selector('#acc-mail') is None, 'il modale mostra l\'account collegato')
    # esci: nuovo profilo anonimo vuoto
    await pg.click('[data-a=accout]'); await pg.wait_for_timeout(800)
    uid1 = await pg.evaluate('FB.uid')
    check(uid1 != uid0 and await pg.evaluate('FB.p.coins') == 0 and await pg.evaluate('FB.mail()') == '', f'uscita: nuovo profilo anonimo {uid0}->{uid1}')
    # accedi con password sbagliata e giusta: tornano le monete
    await pg.fill('#acc-mail', 'a@b.it'); await pg.fill('#acc-pw', 'sbagliata'); await pg.click('[data-a=accin]'); await pg.wait_for_timeout(500)
    check('errate' in await pg.inner_text('.acc-msg'), 'password errata: messaggio')
    await pg.fill('#acc-pw', 'segreta1'); await pg.click('[data-a=accin]'); await pg.wait_for_timeout(900)
    check(await pg.evaluate('[FB.uid,FB.p.coins]') == [uid0, 77], 'accesso: ritrovato il profilo con le monete')
    check(await pg.evaluate('R.mine.uid') == uid0, 'la stanza vede l\'uid del profilo attivo')
    # il reset password parte con l'email scritta; l'email già usata da un altro profilo è rifiutata
    await pg.click('[data-a=accout]'); await pg.wait_for_timeout(800)
    await pg.fill('#acc-mail', 'a@b.it'); await pg.click('[data-a=accreset]'); await pg.wait_for_timeout(400)
    check(await pg.evaluate('window.__resetMail') == 'a@b.it', 'reset password inviato')
    await pg.fill('#acc-pw', 'altra123'); await pg.click('[data-a=acclink]'); await pg.wait_for_timeout(500)
    check('già un profilo' in await pg.inner_text('.acc-msg'), 'email già usata: messaggio')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_account_google(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    uid0 = await pg.evaluate('FB.uid')
    await pg.evaluate("(()=>{window.__db['players/'+FB.uid].coins=55;localStorage.setItem('__stub',JSON.stringify(window.__db))})()")
    await pg.reload(); await pg.wait_for_timeout(3500)
    await pg.evaluate("(()=>{ui.acc='acc';render()})()")
    check(await pg.query_selector('[data-a=accgoogle]') is not None, 'pulsante Google presente')
    await pg.click('[data-a=accgoogle]'); await pg.wait_for_timeout(600)
    check(await pg.evaluate('FB.mail()') == 'giulia@gmail.test' and await pg.evaluate('FB.uid') == uid0, 'Google collega lo stesso profilo')
    check(await pg.query_selector('[data-a=accgoogle]') is None, 'dopo il collegamento il pulsante sparisce')
    # nessun dato di Google finisce nel profilo salvato
    prof = await pg.evaluate("JSON.stringify(window.__db['players/'+FB.uid])")
    check('gmail' not in prof and 'giulia' not in prof, 'nessuna email/nome di Google nel profilo salvato')
    # esci, poi un nuovo telefono entra con lo stesso Google: ritrova il profilo
    await pg.click('[data-a=accout]'); await pg.wait_for_timeout(800)
    check(await pg.evaluate('FB.uid') != uid0, 'uscita: nuovo profilo anonimo')
    await pg.click('[data-a=accgoogle]'); await pg.wait_for_timeout(900)
    check(await pg.evaluate('[FB.uid,FB.p.coins]') == [uid0, 55], 'Google su profilo già legato: ritrovate le monete')
    # finestra chiusa: messaggio chiaro
    await pg.click('[data-a=accout]'); await pg.wait_for_timeout(800)
    await pg.evaluate('window.__popupClosed=true'); await pg.click('[data-a=accgoogle]'); await pg.wait_for_timeout(400)
    check('Finestra chiusa' in await pg.inner_text('.acc-msg'), 'finestra chiusa: messaggio')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_taverna_dock(b, srv):
    ctx = await new_context(b, srv.port, extra_init="localStorage.setItem('rg-lb','iso');"); pg = await page(ctx, srv.url)
    check(await pg.query_selector('#plancia') is not None and len(await pg.query_selector_all('#plancia button')) == 5, 'plancia a 5 destinazioni')
    # la Taverna è la lobby personale: niente dock, niente «Gioca ora»
    check(await pg.query_selector('.hm') is not None or 'Gioca da solo' in await pg.inner_text('body'), 'Home personale')
    check(not await pg.is_visible('#dock'), 'nessun dock nella Home')
    check(await pg.query_selector('.hm-hero svg') is not None and await pg.query_selector('.hm-go[data-a=pl][data-v=giochi]') is not None, 'Home: scena e «Gioca ora»')
    check(await pg.query_selector('.hm-duo [data-a=newroom]') is not None and await pg.query_selector('.hm-duo [data-a=codice]') is not None, 'Home: «Crea stanza» e «Entra con codice»')
    check(await pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), 'Home: niente scroll orizzontale')
    await pg.click('.hm-c[data-a=acc]'); await pg.wait_for_timeout(250)
    check(await pg.query_selector('.modal [data-a=acclink]') is not None, 'Sfida senza account: appare il popup di accesso')
    await pg.click('[data-a=pl][data-v=taverna]'); await pg.wait_for_timeout(250)
    check(await pg.query_selector('.gl-feat') is None and await pg.query_selector('.hm-note') is None, 'niente note a margine né Gioca in evidenza')
    await pg.click('[data-a=pl][data-v=giochi]'); await pg.wait_for_timeout(250)
    check(await pg.query_selector('.gl-grid') is not None, 'catalogo giochi a griglia')
    check(await pg.evaluate("document.documentElement.scrollWidth") <= 390, 'catalogo senza scroll orizzontale')
    await pg.click('[data-a=pl][data-v=amici]'); await pg.wait_for_timeout(250)
    check(await pg.query_selector('#gname') is not None, 'Amici: tavolo, ospiti e distanza nella stessa pagina')
    check(await pg.evaluate("document.documentElement.scrollWidth") <= 390, 'amici senza scroll orizzontale')
    await pg.click('[data-a=pl][data-v=taverna]'); await pg.wait_for_timeout(250)
    await pg.evaluate("(()=>{ui.unread=3;ui.screen='game';render()})()")
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

ELO_PARTITA = """async([gioco,seats,over])=>{await startGame(gioco,seats);await Q;
 const ns=JSON.parse(JSON.stringify(G));ns.over=over;pushState(ns);await Q;await new Promise(r=>setTimeout(r,900))}"""
RIVALE = "localStorage.setItem('__stub',JSON.stringify({'players/u-2':{name:'Rivale',coins:5,played:3,wins:1,owned:{},equipped:{},elo:{uno:1200}}}));"

async def sc_elo_fine_partita(b, srv):
    A = {'dev': 'DEV', 'k': 'm', 'name': 'Tester', 'uid': 'u-1'}; Bb = {'dev': 'altro', 'k': 'm', 'name': 'Rivale', 'uid': 'u-2'}
    async def gioca(over, seats=None, gioco='uno', extra=''):
        ctx = await new_context(b, srv.port, extra_init=RIVALE + extra); pg = await page(ctx, srv.url)
        dev = await pg.evaluate('ME.dev'); s = seats or [dict(A, dev=dev), Bb]
        s = [dict(x, dev=dev) if x.get('dev') == 'DEV' else x for x in s]
        await pg.evaluate(ELO_PARTITA, [gioco, s, over]); return ctx, pg
    # vittoria contro uno più forte (1200): +24
    ctx, pg = await gioca({'win': 0, 'scores': [0, 5]})
    check(await pg.evaluate('(FB.p.elo||{}).uno') == 1024, f'vittoria contro 1200: ELO {await pg.evaluate("(FB.p.elo||{}).uno")}')
    check(await pg.evaluate('FB.p.wins') == 1 and await pg.evaluate('FB.p.coins') == 25, 'monete e vittoria registrate insieme')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()
    # sconfitta: 1000 - 8 (attesa 0.24 -> perde 8)
    ctx, pg = await gioca({'win': 1, 'scores': [5, 0]})
    check(await pg.evaluate('(FB.p.elo||{}).uno') == 992, f'sconfitta contro 1200: ELO {await pg.evaluate("(FB.p.elo||{}).uno")}')
    await ctx.close()
    # con un ospite al tavolo, in un gioco cooperativo o senza vincitore: nessun ELO, ma i premi sì
    for nome, over, seats, gioco in [('ospite', {'win': 0, 'scores': [0, 5]}, [A, {'dev': 'DEV', 'k': 'g1', 'name': 'Ospite'}], 'uno'),
                                     ('cooperativo', {'win': True}, [A, Bb], 'regicide'), ('pareggio', {'win': None, 'scores': [60, 60]}, [A, Bb], 'briscola')]:
        ctx, pg = await gioca(over, seats, gioco)
        check(await pg.evaluate('FB.p.elo') is None and await pg.evaluate('FB.p.played') == 1, f'{nome}: niente ELO, premio sì')
        await ctx.close()
    # chi ha vinto, per ogni forma di partita (coop booleano, singolo, squadre a 4, pari merito)
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    esiti = await pg.evaluate("""async()=>{const dev=ME.dev,S=n=>Array.from({length:n},(_,i)=>({dev:i===0?dev:'x'+i,k:'m',name:'p'+i}));
      const t=async(g,n,over,mio)=>{R.offSeats=S(n).map((x,i)=>i===mio?{...x,dev}:i===0&&mio!==0?{...x,dev:'x0'}:x);return !!iWon({g,n,over})};
      return[await t('gang',3,{win:true},0),await t('gang',3,{win:false},0),await t('uno',4,{win:0},0),await t('uno',4,{win:0},2),await t('uno',4,{win:2},2),
        await t('briscola',4,{win:0},2),await t('briscola',4,{win:1},2),await t('azul',3,{win:null,winners:[0,2]},2),await t('azul',3,{win:null,winners:[]},0),await t('regicide',2,{win:true},0)]}""")
    check(esiti == [True, False, True, False, True, True, False, True, False, True], f'iWon in tutte le forme {esiti}'); await ctx.close()
    # stesso uid in due posti (tentativo di gonfiare il punteggio): niente ELO
    ctx, pg = await gioca({'win': 0, 'scores': [0, 5]}, [A, dict(A, dev='altro')])
    check(await pg.evaluate('FB.p.elo') is None, 'stesso profilo su due posti: niente ELO'); await ctx.close()

async def sc_classifica(b, srv):
    db = {f'players/u-{i}': {'name': n, 'coins': c, 'played': p, 'wins': w, 'owned': {}, 'equipped': {}, **({'elo': e} if e else {})}
          for i, (n, c, p, w, e) in enumerate([('Anna', 300, 20, 9, {'uno': 1100}), ('Bruno', 50, 8, 2, {'uno': 1300, 'perudo': 900}), ('Carla', 120, 30, 5, None)], start=2)}
    import json
    ctx = await new_context(b, srv.port, extra_init=f"localStorage.setItem('__stub',{json.dumps(json.dumps(db))});"); pg = await page(ctx, srv.url)
    await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await pg.click('[data-a=top]'); await pg.wait_for_timeout(500)
    nomi = await pg.eval_on_selector_all('.top li b', 'e=>e.map(x=>x.textContent)')
    check(nomi == ['Anna', 'Carla', 'Bruno', 'Tester'][:len(nomi)] or nomi[:3] == ['Anna', 'Bruno', 'Carla'] or nomi[0] == 'Anna', f'vittorie in ordine {nomi}')
    check(nomi[0] == 'Anna' and nomi[1] == 'Carla' and nomi[2] == 'Bruno', f'ordine per vittorie {nomi}')
    check(await pg.eval_on_selector_all('.top li.me b', 'e=>e.map(x=>x.textContent)') == ['Tester'], 'la mia riga è evidenziata')
    await pg.click('[data-a=topk][data-v="elo.uno"]'); await pg.wait_for_timeout(500)
    check(await pg.eval_on_selector_all('.top li', 'e=>e.map(x=>x.querySelector("b").textContent+":"+x.querySelector("em").textContent)') == ['Bruno:1300', 'Anna:1100'], 'ELO Uno: solo chi ha giocato, in ordine')
    check('ELO' in await pg.inner_text('.modal') and not [c for c in await pg.eval_on_selector_all('.chips .chip', 'e=>e.map(x=>x.textContent)') if 'Regicide' in c or 'Gang' in c], 'i giochi cooperativi non hanno la classifica ELO')
    await pg.click('[data-a=accx]'); await pg.wait_for_timeout(200)
    check(await pg.evaluate('ui.cfg===true&&!ui.acc'), 'chiudendo si torna alle impostazioni')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_locandiere(b, srv):
    # risposte a copioni
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await pg.click('[data-a=oste]'); await pg.wait_for_timeout(300)
    check('Sono il locandiere' in await pg.inner_text('#oste-log'), 'saluto iniziale')
    check(len(await pg.query_selector_all('[data-a=osteq]')) == 4, 'quattro domande pronte')
    await pg.click('[data-a=osteq] >> nth=2'); await pg.wait_for_timeout(600)
    txt = await pg.inner_text('#oste-log')
    check('10 monete' in txt and 'Come guadagno monete?' in txt, 'chip: domanda e risposta a copioni')
    await pg.fill('#oste-q', 'regole di dudo'); await pg.press('#oste-q', 'Enter'); await pg.wait_for_timeout(500)
    check('Dudo' in (await pg.inner_text('#oste-log')).split('regole di dudo')[-1], 'invio con Enter: regole del gioco')
    await pg.fill('#oste-q', 'che gioco ci consigli'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(500)
    check('proverei' in await pg.inner_text('#oste-log'), 'consiglio per il tavolo')
    check(await pg.evaluate('document.getElementById("oste-q").value') == '', 'campo svuotato dopo l\'invio')
    await pg.fill('#oste-q', '<img src=x onerror=window.__xss=1>'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(500)
    check(await pg.evaluate('window.__xss') is None and await pg.query_selector('#oste-log img') is None, 'il testo scritto non diventa HTML')
    await pg.click('[data-a=ostex]'); check(await pg.evaluate('ui.cfg===true&&!ui.oste'), 'chiudendo si torna alle impostazioni')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def telefono(b, srv, sh, nome, seq, query='', wait=5000):
    ctx = await new_context(b, srv.port, name=nome, shared=sh, extra_init=f"localStorage.setItem('__stubseq','{seq}');")
    pg = await page(ctx, srv.url + query, wait); return ctx, pg

async def sc_distanza_due_telefoni(b, srv):
    sh = Shared()
    ctxA, A = await telefono(b, srv, sh, 'Ada', 1)
    A.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    check(await A.evaluate('Dist.ok()'), 'A: profilo online pronto')
    await A.evaluate("(()=>{ui.cfg=true;render()})()"); await A.click('.modal [data-a=dist]'); await A.wait_for_timeout(300)
    await A.click('[data-a=distnew]'); await A.wait_for_function("R.mode==='fs'&&R.code&&R.members.length>0", timeout=30000)
    code = await A.evaluate('R.code')
    check(await A.evaluate('R.mode') == 'fs' and len(code) == 8 and await A.evaluate('ME.dev') == 'u:u-1', f'A: nuova partita {code} in modalità a distanza')
    st = sh.d.get('partite/' + code) or {}
    check(st.get('uids') == ['u-1'] and st.get('host') == 'u-1' and st.get('phase') == 'lobby', f'A: salvata con host e uids {st.get("uids")}')
    check('?dist=' + code in await A.evaluate('(()=>{Dist.msg="";return Dist.invito(R.code)})()'), 'A: link di invito')
    # B apre il link d'invito sul suo telefono
    ctxB, B = await telefono(b, srv, sh, 'Bruno', 2, '?dist=' + code)
    await B.wait_for_function("R.mode==='fs'&&R.members.length>0", timeout=30000)
    check(await B.evaluate('[R.mode,R.code,ME.dev]') == ['fs', code, 'u:u-2'], 'B: entrato dal link')
    check('dist=' not in B.url, 'B: il link viene ripulito dall\'indirizzo')
    check(sh.d['partite/' + code]['uids'] == ['u-1', 'u-2'], 'B: aggiunto agli uid senza toccare lo stato')
    await A.wait_for_timeout(1500)
    check(await A.evaluate('R.members.length') == 2 and await B.evaluate('R.members.length') == 2, 'A e B vedono due persone al tavolo')
    # A avvia Uno: parte per entrambi
    await A.evaluate("startGame('uno')"); await A.wait_for_timeout(3500)
    check(await A.evaluate('[ui.screen,G&&G.g]') == ['game', 'uno'] and await B.evaluate('[ui.screen,G&&G.g]') == ['game', 'uno'], 'la partita parte su entrambi i telefoni')
    meta = sh.d['partite/' + code]
    check(meta['phase'] == 'play' and meta['game'] == 'uno' and len(meta['turno']) == 1 and set(meta['nomi'].values()) == {'Ada', 'Bruno'}, f'meta a chi tocca: {meta["turno"]} {meta["nomi"]}')
    # chi deve muovere muove: il turno passa all'altro e arriva sull'altro telefono
    tur = meta['turno'][0]; att, altro = (A, B) if tur == 'u-1' else (B, A); uid_altro = 'u-2' if tur == 'u-1' else 'u-1'
    for _ in range(4):
        await att.wait_for_timeout(1500)
        if sh.d['partite/' + code]['turno'] == [uid_altro]: break
        await att.evaluate("(async()=>{await dispatch({t:G.phase==='pass'?'pass':'draw'})})()")
    await altro.wait_for_timeout(2500)
    check(sh.d['partite/' + code]['turno'] == [uid_altro], 'dopo la mossa, il turno passa all\'altro giocatore')
    check(await altro.evaluate('G.cur===local()[0]'), 'la mossa è arrivata sull\'altro telefono')
    await altro.evaluate('Dist.aggiorna()'); await altro.wait_for_timeout(500)
    check(await altro.evaluate('Dist.tocca()') == 1, 'nell\'elenco compare «tocca a te»')
    # una scrittura con uno stato più vecchio viene rifiutata (telefono rimasto indietro)
    esito = await att.evaluate("FsDb.setRoom(R.code,{...R.doc,rev:0}).then(()=>'scritto',e=>e.code)")
    check(esito == 'conflitto', f'stato vecchio rifiutato ({esito})')
    # il giorno dopo: B chiude tutto, riapre l'app, ritrova la partita nell'elenco e rientra
    await B.close(); B = await ctxB.new_page(); B.errs = []; B.on('pageerror', lambda e: B.errs.append(str(e))); await B.goto(srv.url); await B.wait_for_timeout(5000)
    check(await B.evaluate('R.mode') != 'fs', 'B: riaperta l\'app, non è dentro alcuna partita a distanza')
    await B.evaluate("(()=>{ui.cfg=true;render()})()"); await B.click('.modal [data-a=dist]'); await B.wait_for_timeout(1500)
    check(await B.eval_on_selector_all('.drow small', 'e=>e.map(x=>x.textContent)') != [] and code in await B.inner_text('.modal'), 'B: la partita è nell\'elenco')
    await B.click(f'[data-a=distgo][data-v="{code}"]'); await B.wait_for_function("R.mode==='fs'&&G", timeout=30000)
    check(await B.evaluate('[R.mode,ui.screen,G&&G.g]') == ['fs', 'game', 'uno'], 'B: rientra e ritrova la partita in corso')
    # B esce: torna alla modalità di prima, con il suo identificativo di telefono
    await B.evaluate("Dist.esci()"); await B.wait_for_timeout(500)
    check(await B.evaluate('[R.mode!=="fs",ME.dev.startsWith("u:")]') == [True, False], 'B: uscito, identificativo del telefono ripristinato')
    # solo chi l'ha creata può eliminarla; gli altri vengono riportati fuori
    await B.evaluate("(()=>{ui.cfg=true;render()})()"); await B.click('.modal [data-a=dist]'); await B.wait_for_timeout(500)
    check(await B.query_selector('[data-a=distdel]') is None, 'B non vede il cestino')
    await B.click(f'[data-a=distgo][data-v="{code}"]'); await B.wait_for_function("R.mode==='fs'", timeout=30000); await B.wait_for_timeout(800)
    await A.evaluate("(()=>{ui.cfg=true;render()})()") if await A.evaluate('!ui.dist') else None
    await A.evaluate("Dist.act('dist')"); await A.wait_for_timeout(800); await A.click(f'[data-a=distdel][data-v="{code}"]'); await A.wait_for_timeout(2500)
    check(not [k for k in sh.d if k.startswith('partite/' + code)], f'A: eliminata con membri e chat ({[k for k in sh.d if k.startswith("partite/")]})')
    check(await B.evaluate('R.mode') != 'fs', 'B: avvisato e riportato fuori dalla partita eliminata')
    for p in (A, B): check(not p.errs, f'nessun errore JS {p.errs[:1]}')
    await ctxA.close(); await ctxB.close()

async def telefono_rt(b, srv, sh, nome, seq, query='?net=rt', rt=True, wait=5000):
    ctx = await new_context(b, srv.port, name=nome, shared=sh, extra_init=f"localStorage.setItem('__stubseq','{seq}');" + ('window.__stubRt=true;' if rt else ''))
    pg = await page(ctx, srv.url + query, wait); return ctx, pg

NASCOSTA = "(v=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>v});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>v?'hidden':'visible'});document.dispatchEvent(new Event('visibilitychange'))})"

async def sc_piazza_fondo(b, srv):
    """Stanza generale: chi mette il telefono in tasca (pagina in background) o chiude la pagina sparisce dall'elenco degli altri, e chi torna rientra da solo."""
    sh = Shared()
    ctxA, A = await telefono_rt(b, srv, sh, 'Ada', 21)
    await A.wait_for_function("R.mode==='rt'&&R.code==='PIAZZA'&&R.members.length>0", timeout=30000)
    ctxB, B = await telefono_rt(b, srv, sh, 'Bruno', 22)
    ctxC, C = await telefono_rt(b, srv, sh, 'Carla', 23)
    for p_ in (B, C): await p_.wait_for_function("R.mode==='rt'&&R.code==='PIAZZA'", timeout=30000)
    await A.wait_for_function("R.members.length>=3", timeout=20000)
    await A.evaluate('RT.TOLLERANZA=2500'); await B.evaluate('RT.FONDO=800')
    devB = await B.evaluate('ME.dev'); devC = await C.evaluate('ME.dev')
    # B in tasca: dopo FONDO si stacca, la presenza sparisce e A lo toglie dall'elenco
    await B.evaluate(NASCOSTA + '(true)'); await B.wait_for_timeout(1500)
    check('stanze/PIAZZA/p/' + devB not in sh.d, 'in tasca: la presenza sparisce dopo il tempo in background')
    await A.wait_for_function(f"R.members.every(m=>m.id!=={devB!r})", timeout=20000)
    check(True, 'in tasca: gli altri non lo vedono più in piazza')
    # B torna: si riattacca, rimette la presenza e rientra tra i membri
    await B.evaluate(NASCOSTA + '(false)'); await B.wait_for_timeout(2500)
    check('stanze/PIAZZA/p/' + devB in sh.d, 'di ritorno: presenza rimessa')
    await A.wait_for_function(f"R.members.some(m=>m.id==={devB!r})", timeout=20000)
    check(await B.evaluate("ui.err||''") == '', 'di ritorno: nessun messaggio di errore rimasto')
    # un attimo in background (meno di FONDO) non stacca nessuno
    await B.evaluate(NASCOSTA + '(true)'); await B.wait_for_timeout(300); await B.evaluate(NASCOSTA + '(false)'); await B.wait_for_timeout(1200)
    check('stanze/PIAZZA/p/' + devB in sh.d and not await B.evaluate('!!RT.spento'), 'un attimo in background: resta collegato')
    # C chiude la pagina: si stacca subito
    await C.evaluate("dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}))"); await C.wait_for_timeout(400)
    check('stanze/PIAZZA/p/' + devC not in sh.d, 'pagina chiusa: presenza tolta subito')
    await A.wait_for_function(f"R.members.every(m=>m.id!=={devC!r})", timeout=20000)
    check(True, 'pagina chiusa: sparisce dall\'elenco')
    for p_ in (A, B): check(not p_.errs, f'nessun errore JS {p_.errs[:1]}')
    for c in (ctxA, ctxB, ctxC): await c.close()

async def sc_stanze_database(b, srv):
    """Stanze live sul Realtime Database (stub condiviso): ingresso, invito, partita, conflitti, presenza e schermo comune."""
    sh = Shared()
    ctxA, A = await telefono_rt(b, srv, sh, 'Ada', 1)
    await A.wait_for_function("R.mode==='rt'&&R.code==='PIAZZA'&&R.members.length>0", timeout=30000)
    check(await A.evaluate('[R.mode,R.on,R.code]') == ['rt', True, 'PIAZZA'], 'A: entra nella stanza generale sul database')
    devA = await A.evaluate('ME.dev')
    check('stanze/PIAZZA/d' in sh.d and isinstance(sh.d['stanze/PIAZZA/d'].get('j'), str) and sh.d['stanze/PIAZZA/d']['rev'] == 0, 'la stanza è salvata come testo JSON con rev')
    check('stanze/PIAZZA/m/' + devA in sh.d and 'stanze/PIAZZA/p/' + devA in sh.d, 'A ha il documento di membro e la presenza')
    await A.evaluate('RT.TOLLERANZA=2500')
    ctxB, B = await telefono_rt(b, srv, sh, 'Bruno', 2)
    await B.wait_for_function("R.mode==='rt'&&R.members.length>=2", timeout=30000); await A.wait_for_timeout(1200)
    check(await A.evaluate('R.members.length') == 2 and await B.evaluate('R.members.length') == 2, 'A e B si vedono nella stanza generale')
    # stanza privata e invito con il link (porta con sé net=rt)
    code = await A.evaluate("(async()=>{const c=await createRoom();await joinRoom(c);setRoomUrl(c);return c})()")
    link = await A.evaluate("RT.link(location.origin+location.pathname+'?room='+R.code)")
    check(len(code) == 4 and 'net=rt' not in link and 'room=' + code in link, f'A: stanza privata {code}, link {link.split("/")[-1]}')
    ctxC, C = await telefono_rt(b, srv, sh, 'Carla', 3, '?room=' + code + '&net=rt')
    await C.wait_for_function(f"R.mode==='rt'&&R.code==={code!r}&&R.members.length>=2", timeout=30000); await A.wait_for_timeout(1200)
    check(await A.evaluate('R.members.map(m=>m.name).sort()') == ['Ada', 'Carla'], 'C entra dal link e A la vede al tavolo')
    # la stanza non dipende da chi l'ha creata: A esce dalla pagina, C ci resta e B può entrare
    await A.close()
    await B.evaluate(f"(async()=>{{await joinRoom({code!r})}})()"); await B.wait_for_timeout(1500)
    check(await B.evaluate('R.members.length') >= 2, 'B entra nella stanza privata anche se chi l\'ha creata ha chiuso la pagina')
    # partita: parte su entrambi, la mossa passa, e uno stato più vecchio viene rifiutato
    await C.evaluate("startGame('uno')"); await C.wait_for_timeout(3500)
    check(await C.evaluate('[ui.screen,G&&G.g]') == ['game', 'uno'] and await B.evaluate('[ui.screen,G&&G.g]') == ['game', 'uno'], 'la partita parte su entrambi i telefoni')
    rev = await C.evaluate('R.doc.rev')
    await C.evaluate("(async()=>{const r=R.doc.rev;await RT.setRoom(R.code,{...R.doc,rev:r+1});await RT.setRoom(R.code,{...R.doc,rev:r+2})})()"); await C.wait_for_timeout(600); rev = await C.evaluate('R.doc.rev')
    esito = await C.evaluate("RT.setRoom(R.code,{...R.doc,rev:R.doc.rev-1}).then(()=>'scritto',e=>e.code)")
    check(esito == 'conflitto', f'stato più vecchio rifiutato ({esito})')
    esito = await C.evaluate("RT.setRoom(R.code,{...R.doc,rev:R.doc.rev}).then(()=>'scritto',e=>e.code)")
    check(esito == 'conflitto', f'stato con la stessa rev rifiutato ({esito})')
    check(await C.evaluate('R.doc.rev') == rev, 'lo stato resta quello più recente')
    # presenza: B perde la linea in attesa; dopo la tolleranza gli altri la tolgono dall'elenco, al ritorno rientra da sola
    await C.evaluate("SYNC.esegui(R.ref,cur=>({doc:{...cur,phase:'lobby',game:null,s:null,seats:[],rev:cur.rev+1}}))"); await C.wait_for_timeout(1500)
    await C.evaluate('RT.TOLLERANZA=2500')
    await B.evaluate('__rtDrop()'); await B.wait_for_timeout(5200)
    devB = await B.evaluate('ME.dev')
    check('stanze/' + code + '/p/' + devB not in sh.d, 'B: il server ha tolto la sua presenza')
    check('Connessione persa' in (await B.evaluate('ui.err') or ''), 'B: vede «Connessione persa»')
    await C.wait_for_function(f"R.members.every(m=>m.id!=={devB!r})", timeout=20000)
    check('stanze/' + code + '/m/' + devB not in sh.d, 'C: B tolta dall\'elenco dopo la tolleranza')
    await B.evaluate('__rtBack()'); await B.wait_for_timeout(2500)
    check(await B.evaluate("ui.err||''") == '' and 'stanze/' + code + '/p/' + devB in sh.d, 'B: linea tornata, presenza rimessa, messaggio sparito')
    await C.wait_for_function(f"R.members.some(m=>m.id==={devB!r})", timeout=20000)
    check('stanze/' + code + '/m/' + devB in sh.d, 'B: rientra da sola tra i membri')
    # schermo comune: legge la stanza senza sedersi
    n_membri = len([k for k in sh.d if k.startswith('stanze/' + code + '/m/')])
    ctxT, T = await telefono_rt(b, srv, sh, '', 4, '?tv=' + code + '&net=rt')
    await T.wait_for_function("ui.tv&&R.mode==='rt'&&R.doc", timeout=30000)
    check(await T.evaluate('[ui.tv,R.mode,R.code]') == [True, 'rt', code], 'TV: collegata alla stanza dal database')
    check(len([k for k in sh.d if k.startswith('stanze/' + code + '/m/')]) == n_membri, 'TV: non occupa un posto')
    # senza ?net=rt resta tutto com'era; con il database irraggiungibile si ripiega
    ctxD, D = await telefono_rt(b, srv, sh, 'Dino', 5, '?net=p2p')
    check(await D.evaluate('R.mode') != 'rt', '?net=p2p esclude il database')
    ctxF, F = await telefono_rt(b, srv, sh, 'Fabio', 7, '')
    check(await F.evaluate('R.mode') == 'rt', 'predefinito: senza parametri si usa il database')
    ctxE, E = await telefono_rt(b, srv, sh, 'Elsa', 6, '?net=rt', rt=False, wait=6000)
    await E.wait_for_function("R.net==='off'", timeout=60000)  # 3 tentativi con pause prima di dichiarare Offline
    check(await E.evaluate('[R.mode,R.on,R.net]') == [None, False, 'off'], 'database irraggiungibile: Offline, nessun ripiego silenzioso su altri trasporti')
    check(await E.evaluate("document.querySelector('button.hm-st.off[data-a=retrynet]')!==null"), 'database irraggiungibile: pulsante per riprovare')
    for p in (B, C, T, D, E, F): check(not p.errs, f'nessun errore JS {p.errs[:1]}')
    for c in (ctxB, ctxC, ctxT, ctxD, ctxE, ctxF): await c.close()
    await ctxA.close()

async def sc_schermo_tutti_i_giochi(b, srv):
    # lo schermo comune non ha posti: ogni gioco deve disegnarsi senza errori e senza mostrare una mano
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500)
    ids = await pg.evaluate('GAMES.map(g=>g.id)')
    # la cena con delitto ha bisogno della stanza online e della regia: senza rete deve rifiutarsi (la sua TV è in sc_giallo)
    r = await pg.evaluate("""async()=>{const S=Array.from({length:6},(_,i)=>({dev:'altro'+i,k:'m',name:'G'+i}));ui.tv=true;
      await startGame('giallo',S,{kit:'ultima-cena'});await Q;const e=ui.err;ui.err='';return[!!G,e]}""")
    check(r[0] is False and 'online' in r[1], f'giallo: senza stanza online non parte ({r[1]})')
    for gid in [i for i in ids if i != 'giallo']:
        r = await pg.evaluate("""async(gid)=>{const g=GAMES.find(x=>x.id===gid);let n=1;while(n<=12&&!g.ok(n))n++;
          const S=Array.from({length:n},(_,i)=>({dev:'altro'+i,k:'m',name:'G'+i}));ui.tv=true;
          await startGame(gid,S);await Q;await new Promise(r=>setTimeout(r,500));
          const app=document.getElementById('app');
          return{g:G&&G.g,len:app.innerHTML.length,mano:document.querySelectorAll('#hand .card:not(.back)').length,local:local().length,sc:ui.screen}}""", gid)
        check(r['g'] == gid and r['len'] > 200 and r['mano'] == 0 and r['local'] == 0, f'{gid}: disegnato senza mano ({r["len"]} byte)')
        await pg.evaluate("(()=>{G=null;ui.screen='room';R.offSeats=null})()")
    check(not pg.errs, f'nessun errore JS {pg.errs[:2]}'); await ctx.close()

async def sc_schermo_tavoli(b, srv):
    # i giochi senza scena 3D hanno un tavolo TV dedicato (app/24y-tv-tavoli.js): posti, niente mani, niente scroll, fine partita
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500); await pg.set_viewport_size({'width': 1920, 'height': 1080})
    for gid, n in [('briscola', 4), ('scopa', 2), ('burraco', 4), ('machiavelli', 3), ('uno', 6), ('perudo', 5), ('gang', 4), ('mind', 3), ('mindx', 2),
                   ('harvest', 3), ('saboteur', 7), ('kittens', 8), ('pets', 4), ('trono', 3)]:
        r = await pg.evaluate("""async(a)=>{const[gid,n]=a;const S=Array.from({length:n},(_,i)=>({dev:'altro'+i,k:'m',name:'G'+i}));ui.tv=true;document.documentElement.dataset.tv='1';
          await startGame(gid,S);await Q;await new Promise(r=>setTimeout(r,300));ui.anim=false;render();
          const d=document.documentElement,txt=document.querySelector('.tv3').innerText;
          return{pg:!!document.querySelector('.tvk-pg'),posti:document.querySelectorAll('.tvk-seat').length,tv3:d.dataset.tv3,
            scroll:d.scrollWidth<=innerWidth&&d.scrollHeight<=innerHeight,mano:document.querySelectorAll('#hand .card,.handbox .card').length,
            bad:/undefined|NaN|null/.test(txt)}}""", [gid, n])
        check(r['pg'] and r['posti'] == n and r['tv3'] == '1', f'{gid} TV: tavolo dedicato con {n} posti ({r})')
        check(r['scroll'] and r['mano'] == 0 and not r['bad'], f'{gid} TV: niente scroll, niente mani, niente testi vuoti ({r})')
        fine = await pg.evaluate("""(()=>{const s=JSON.parse(JSON.stringify(G));s.over={win:0,winners:[0],wins:[0],tie:[0],scores:s.names.map(()=>1),vaults:3,alarms:0,lvl:1,reason:'prova',txt:'prova'};
          G=s;render();return!!document.querySelector('.tv3-end')&&!/undefined|NaN/.test(document.querySelector('.tv3-end').innerText)})()""")
        check(fine, f'{gid} TV: schermata di fine partita')
        await pg.evaluate("(()=>{G=null;ui.screen='room';R.offSeats=null;render()})()")
    check(not pg.errs, f'nessun errore JS {pg.errs[:2]}'); await ctx.close()

async def sc_impostazioni_android(b, srv):
    # da Android (fuori dall'app) le impostazioni offrono l'APK; dentro l'app (?app=android) no; le pagine della barra coprono tutto lo schermo
    ua = "Object.defineProperty(navigator,'userAgent',{get:()=>'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'});"
    for q, atteso in (('', True), ('?app=android', False)):
        ctx = await new_context(b, srv.port, extra_init=ua); pg = await page(ctx, srv.url + q, 2500); await pg.set_viewport_size({'width': 412, 'height': 915})
        await pg.evaluate("(()=>{document.querySelector('#plancia [data-v=giochi]').click()})()"); await pg.wait_for_timeout(400)
        await pg.evaluate("(()=>{document.querySelector('#plancia [data-v=profilo]').click()})()"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("""(()=>{const a=document.querySelector('.modal a.apkdl'),m=document.querySelector('.modal').getBoundingClientRect(),
          vis=[...document.querySelectorAll('#app>:not(.modal)')].every(e=>getComputedStyle(e).visibility==='hidden');
          return[!!a,a?a.getAttribute('href'):'',Math.round(m.bottom)===innerHeight,vis]})()""")
        check(r[0] == atteso and (not atteso or r[1] == '/taverna.apk'), f'APK in impostazioni {"da Android" if atteso else "dentro l app"}: {r[:2]}')
        check(r[2] and r[3], f'impostazioni a tutto schermo, pagina di sotto nascosta ({r[2:]})')
        check(not pg.errs, f'nessun errore JS {pg.errs[:2]}'); await ctx.close()

async def sc_mani_nello_schermo(b, srv):
    # in ogni gioco la mano (anche piena, 12 carte) sta dentro lo schermo del telefono, sui telefoni stretti e larghi
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500)
    ids = await pg.evaluate("GAMES.map(g=>g.id).filter(i=>i!=='giallo')")
    for w, h in ((360, 740), (412, 915)):
        await pg.set_viewport_size({'width': w, 'height': h})
        for gid in ids:
            m = await pg.evaluate("""async(gid)=>{const g=GAMES.find(x=>x.id===gid),n=g.ok(1)?1:g.ok(3)?3:g.ok(4)?4:2;
              const S=[{dev:ME.dev,k:'m',name:'Angelo'},...Array.from({length:n-1},(_,i)=>({dev:'altro'+i,k:'m',name:'G'+i}))];
              localStorage.setItem('rg-intro','1');await startGame(gid,S);await Q;
              {const b=document.querySelector('[data-a=rlstart]');if(b){b.click();await Q;await new Promise(r=>setTimeout(r,300))}}
              if(G&&Array.isArray(G.hands)&&Array.isArray(G.hands[0])){const s=JSON.parse(JSON.stringify(G)),src=s.deck||s.stock||s.res||null;
                if(Array.isArray(src)){while(s.hands[0].length<12&&src.length)s.hands[0].push(src.pop());G=s}}
              ui.story=null;ui.anim=false;render();await new Promise(r=>setTimeout(r,250));
              const W=innerWidth;let fuori=0;
              document.querySelectorAll('#hand .slot,.fanrow > *').forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();fuori=Math.max(fuori,-r.left,r.right-W)});
              G=null;ui.screen='room';R.offSeats=null;render();return Math.round(fuori)}""", gid)
            check(m <= 1, f'{gid} a {w}px: la mano sta nello schermo (sporge di {m}px)')
    check(not pg.errs, f'nessun errore JS {pg.errs[:2]}'); await ctx.close()

def leggi_qr(png):
    import cv2, numpy as np
    img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_GRAYSCALE)
    img = cv2.copyMakeBorder(img, 30, 30, 30, 30, cv2.BORDER_CONSTANT, value=255)
    return cv2.QRCodeDetector().detectAndDecode(img)[0]

async def sc_schermo_comune(b, srv):
    sh = Shared()
    ctxA, A = await telefono(b, srv, sh, 'Ada', 1)
    await A.evaluate("(()=>{ui.cfg=true;render()})()"); await A.click('.modal [data-a=dist]'); await A.click('[data-a=distnew]')
    await A.wait_for_function("R.mode==='fs'&&R.code&&R.members.length>0", timeout=30000)
    code = await A.evaluate('R.code')
    ctxB, B = await telefono(b, srv, sh, 'Bruno', 2, '?dist=' + code)
    await B.wait_for_function("R.mode==='fs'&&R.members.length>0", timeout=30000)
    # il telefono propone il link dello schermo comune, con un QR leggibile
    await A.evaluate("(()=>{ui.cfg=true;ui.dist=false;render()})()"); await A.click('.modal [data-a=tvm]'); await A.wait_for_timeout(300)
    link = await A.evaluate('TV.linkSchermo()')
    check(link.endswith('?tv=' + code), f'link schermo {link}')
    check(leggi_qr(await (await A.query_selector('.tvm-qr svg')).screenshot()) == link, 'il QR del telefono contiene il link dello schermo')
    # la TV apre il link
    prima = {k: str(v) for k, v in sh.d.items()}
    ctxT = await new_context(b, srv.port, name=None, shared=sh, extra_init="localStorage.setItem('__stubseq','9');")
    await ctxT.add_init_script("")
    T = await page(ctxT, srv.url + '?tv=' + code, 2000); await T.set_viewport_size({'width': 1920, 'height': 1080})
    await T.wait_for_function("R.mode==='fs'&&R.code&&ui.tv", timeout=30000); await T.wait_for_timeout(1500)
    check(await T.evaluate('[ui.screen,document.documentElement.dataset.tv]') == ['tv', '1'], 'TV: modalità schermo, in attesa del gioco')
    check({k: str(v) for k, v in sh.d.items() if k.startswith('partite/' + code)} == {k: v for k, v in prima.items() if k.startswith('partite/' + code)}, 'TV: non ha scritto nulla (nessun posto, nessun membro)')
    check(len([k for k in sh.d if '/membri/' in k and code in k]) == 2, 'TV: i membri restano due')
    inv = await T.evaluate('Dist.invito(R.code)')
    check(leggi_qr(await (await T.query_selector('.tvp-qr svg')).screenshot()) == inv, f'TV: il QR del pannello invita al tavolo {inv}')
    nomi = await T.eval_on_selector_all('.tvp-pl li', 'e=>e.map(x=>x.textContent.replace("▶",""))')
    check(sorted(nomi) == ['Ada', 'Bruno'], f'TV: giocatori in attesa {nomi}')
    # si avvia Uno dal telefono: la TV passa al tavolo
    await A.evaluate("startGame('uno')"); await T.wait_for_function("ui.screen==='game'&&G&&G.g==='uno'", timeout=20000); await T.wait_for_timeout(800)
    check(await T.evaluate('local().length') == 0 and await T.evaluate('document.querySelectorAll("#hand .card:not(.back)").length') == 0, 'TV: nessuna mano a vista')
    on = await T.eval_on_selector_all('.tvp-pl li.on', 'e=>e.map(x=>x.textContent.replace("▶",""))')
    tur = sh.d['partite/' + code]['turno'][0]; nome_t = 'Ada' if tur == 'u-1' else 'Bruno'
    check(on == [nome_t], f'TV: freccia sul giocatore di turno {on} (turno di {nome_t})')
    check('Ultima Carta' in await T.inner_text('#tvpanel'), 'TV: pannello con il nome del gioco')
    # il turno passa: la freccia si sposta
    att, altro_nome = (A, 'Bruno') if tur == 'u-1' else (B, 'Ada'); uid_altro = 'u-2' if tur == 'u-1' else 'u-1'
    for _ in range(4):
        await att.wait_for_timeout(1500)
        if sh.d['partite/' + code]['turno'] == [uid_altro]: break
        await att.evaluate("(async()=>{await dispatch({t:G.phase==='pass'?'pass':'draw'})})()")
    await T.wait_for_timeout(2500)
    on = await T.eval_on_selector_all('.tvp-pl li.on', 'e=>e.map(x=>x.textContent.replace("▶",""))')
    check(on == [altro_nome], f'TV: dopo la mossa la freccia passa a {altro_nome} {on}')
    # layout da TV: pannello a sinistra, tavolo a destra, tutto dentro lo schermo
    geo = await T.evaluate("(()=>{const p=document.getElementById('tvpanel').getBoundingClientRect(),a=document.getElementById('app').getBoundingClientRect();return[Math.round(p.right),Math.round(a.left),document.documentElement.scrollWidth<=innerWidth]})()")
    check(geo[0] <= geo[1] + 2 and geo[2], f'TV: pannello e tavolo non si sovrappongono {geo}')
    for p_ in (A, B, T): check(not p_.errs, f'nessun errore JS {p_.errs[:1]}')
    await T.screenshot(path='/tmp/claude-0/tv-finale.png')
    # tavolo eliminato: la TV lo dice e riprova, senza errori
    A.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    await A.evaluate("Dist.act('dist')"); await A.wait_for_timeout(600); await A.click(f'[data-a=distdel][data-v="{code}"]'); await T.wait_for_timeout(3000)
    check(await T.evaluate('[ui.screen,!!ui.err]') == ['tv', True], 'TV: tavolo eliminato, torna in attesa con un avviso')
    for c in (ctxA, ctxB, ctxT): await c.close()

async def sc_schermo_regicide(b, srv):
    # lo schermo comune ha una vista propria per Regicide: boss grande, giocatori, cronaca, nessuna mano, schermata finale
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500); await pg.set_viewport_size({'width': 1920, 'height': 1080})
    await pg.evaluate("""async()=>{ui.tv=true;document.documentElement.dataset.tv='1';localStorage.setItem('rg-intro','1');
      await startGame('regicide',[{dev:'a',k:'m',name:'Ada'},{dev:'b',k:'m',name:'Bruno'}]);await Q;await new Promise(r=>setTimeout(r,1500))}""")
    check(await pg.query_selector('.rtv') is not None, 'Regicide TV: vista dedicata')
    d3 = await pg.evaluate("document.documentElement.dataset.rtv3==='1'")  # con WebGL il tavolo è 3D: boss e percorso stanno nella scena
    check(d3 or await pg.evaluate("document.querySelectorAll('.rtv .card:not(.back)').length") == 1, 'Regicide TV: solo il boss, nessuna mano')
    check(await pg.evaluate("document.querySelectorAll('.rtv-pl li').length") == 2 and 'carte' in await pg.inner_text('.rtv-pl'), 'Regicide TV: giocatori con numero di carte')
    check(d3 or await pg.evaluate("document.querySelectorAll('.rtv-path span').length") == 12 and await pg.evaluate("document.querySelectorAll('.rtv-path .now').length") == 1, 'Regicide TV: percorso di 12 nemici con quello attuale')
    # il percorso non svela i semi dei nemici futuri
    check(d3 or await pg.evaluate("[...document.querySelectorAll('.rtv-path .next')].every(e=>/^[JQK]$/.test(e.textContent))"), 'Regicide TV: semi dei nemici futuri nascosti')
    check(await pg.evaluate("document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight"), 'Regicide TV: niente scroll a 1920x1080')
    await pg.evaluate("(()=>{const s=JSON.parse(JSON.stringify(G));s.over={win:true};G=s;render()})()"); await pg.wait_for_timeout(400)
    check('Regicidio compiuto' in await pg.inner_text('.rtv-end'), 'Regicide TV: schermata di vittoria')
    await pg.evaluate("(()=>{const s=JSON.parse(JSON.stringify(G));s.over={win:false,reason:'Ada deve scartare 9'};G=s;render()})()"); await pg.wait_for_timeout(400)
    check('Il regno è perduto' in await pg.inner_text('.rtv-end') and 'Ada deve scartare 9' in await pg.inner_text('.rtv-end'), 'Regicide TV: schermata di sconfitta con il motivo')
async def sc_stato_connessione(b, srv):
    # senza rete la Taverna dice «Connessione…» finché prova, poi «Offline» cliccabile che rilancia la ricerca
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 300)
    st0 = await pg.evaluate("document.querySelector('.hm-st')?.textContent||''")
    check('Connessione' in st0 or 'Offline' in st0, f'stato iniziale: {st0!r}')
    await pg.wait_for_function("R.net==='off'", timeout=60000); await pg.wait_for_timeout(300)
    check(await pg.query_selector('button.hm-st.off[data-a=retrynet]') is not None, 'offline: pulsante per riprovare nella Taverna')
    await pg.click('button.hm-st.off'); await pg.wait_for_timeout(100)
    check(await pg.evaluate("R.net")=='prova' or await pg.evaluate("R.net")=='off', 'riprova: la ricerca riparte')
    await pg.wait_for_function("R.net==='off'", timeout=60000)
    # tornata la rete, da Offline si riprova da soli (senza toccare il pulsante)
    check(await pg.evaluate("(()=>{dispatchEvent(new Event('online'));return R.net})()") == 'prova', 'evento «online»: la ricerca riparte da sola')
    await pg.wait_for_function("R.net==='off'", timeout=60000)
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_schermo_condividi(b, srv):
    # dal telefono il link dello schermo comune si invia a un altro dispositivo con il foglio di condivisione
    ctx = await new_context(b, srv.port, extra_init="window.__sh=[];navigator.share=async d=>{window.__sh.push(d)};"); pg = await page(ctx, srv.url, 2500)
    await pg.evaluate("(()=>{R.on=true;R.code='ABCD';R.mode='p2p';ui.tvm=true;render()})()"); await pg.wait_for_timeout(300)
    check(await pg.query_selector('.modal [data-a=tvshare]') is not None, 'Schermo comune: pulsante «Invia il link al PC o alla TV»')
    check('Trasmetti scheda' in await pg.inner_text('.modal'), 'Schermo comune: istruzioni per il Chromecast da PC')
    await pg.click('.modal [data-a=tvshare]'); await pg.wait_for_timeout(300)
    inviato = await pg.evaluate("window.__sh")
    check(len(inviato) == 1 and '?tv=ABCD' in inviato[0]['url'], f'condivide il link dello schermo {inviato}')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_schermo_cast(b, srv):
    # Chromecast: il telefono carica l'SDK Cast, avvia la sessione e manda il codice; il ricevitore apre lo schermo comune
    sdk = ("window.__msg=[];window.cast={framework:{AutoJoinPolicy:{},CastContext:{getInstance:()=>{const c={sess:null,"
           "setOptions(o){window.__opt=o},requestSession:async()=>{c.sess={sendMessage:async(ns,m)=>{window.__msg.push([ns,m])}};return null},"
           "getCurrentSession:()=>c.sess,endCurrentSession(){c.sess=null}};window.__cx=window.__cx||c;return window.__cx}}}};"
           "window.chrome={cast:{AutoJoinPolicy:{ORIGIN_SCOPED:'origin_scoped'}}};setTimeout(()=>window.__onGCastApiAvailable&&window.__onGCastApiAvailable(true),10);")
    ctx = await new_context(b, srv.port, extra_init="localStorage.setItem('rg-castid','ABC12345');")
    await ctx.route('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js*', lambda r: r.fulfill(content_type='text/javascript', body=sdk))
    pg = await page(ctx, srv.url, 2500)
    await pg.evaluate("(()=>{R.on=true;R.code='ABCD';R.mode='p2p';ui.tvm=true;render()})()"); await pg.wait_for_timeout(300)
    # il pulsante dipende da https e Chrome: in prova lo si forza
    visibile = await pg.evaluate("TV.castId()")
    check(visibile == 'ABC12345', f'ID Cast letto dal telefono {visibile}')
    await pg.evaluate("(()=>{TV.puoiCast=()=>true;render()})()"); await pg.wait_for_timeout(200)
    check(await pg.query_selector('.modal [data-a=tvcast]') is not None, 'Schermo comune: pulsante «Trasmetti al Chromecast»')
    await pg.click('.modal [data-a=tvcast]'); await pg.wait_for_timeout(600)
    msg = await pg.evaluate("window.__msg"); opt = await pg.evaluate("window.__opt")
    check(len(msg) == 1 and msg[0][0] == 'urn:x-cast:app.web.latavernadeigiochi' and msg[0][1]['code'] == 'ABCD', f'manda il codice al ricevitore {msg}')
    check(opt and opt['receiverApplicationId'] == 'ABC12345', f'usa l\'ID dell\'app {opt}')
    await pg.click('.modal [data-a=tvcastx]'); await pg.wait_for_timeout(200)
    check(await pg.evaluate("TV.inCast()") is False, 'la trasmissione si interrompe')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()
    # ricevitore: riceve il codice e apre lo schermo comune a tutto schermo (da browser, senza Cast)
    ctx = await new_context(b, srv.port); pg = await ctx.new_page()
    await pg.goto(f'{srv.url.split("?")[0].rstrip("/")}/receiver.html?tv=abcd&b=2'); await pg.wait_for_timeout(500)
    src = await pg.evaluate("document.getElementById('f').getAttribute('src')")
    check(src == '/?tv=ABCD&b=2', f'il ricevitore apre lo schermo comune {src}')
    await pg.goto(f'{srv.url.split("?")[0].rstrip("/")}/receiver.html?tv=%3Cx%3E'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("document.getElementById('f').hidden") is True, 'codice non valido: il ricevitore non apre nulla'); await ctx.close()

async def sc_campagna(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.evaluate("(async()=>{const mk=(n,c,r)=>EROI.nuovo({nome:n,razza:r,classe:c,base:EROI.baseIniziale(),aspetto:{pelle:0,capelli:0,mantello:0,viso:0}});await FB.salvaEroe('e1',mk('Aldo','guerriero','umano'));await FB.salvaEroe('e2',mk('Mira','ladro','elfo'));ui.cfg=true;render()})()")
    await pg.click('[data-a=eroi]'); await pg.wait_for_timeout(600)
    await pg.click('[data-a=campstart]'); await pg.wait_for_timeout(200)
    check(await pg.query_selector('svg.cmap') is not None, 'mappa disegnata')
    check(len(await pg.query_selector_all('.ce')) == 2, 'due eroi nel gruppo')
    check(len(await pg.query_selector_all('.hx.adj')) >= 2, 'esagoni adiacenti toccabili')
    check('Giorno 1' in await pg.inner_text('.chud'), 'giorno 1')
    # tocco su un esagono: il gruppo si muove (o scatta un incontro) e il movimento scende
    pm0 = await pg.evaluate('Camp.s.pm')
    await pg.evaluate("(()=>{const n=CAMP.vicini(0,0)[0];Camp.s.celle[n.q+','+n.r].t='strada';render()})()")
    await pg.click('.hx.adj'); await pg.wait_for_timeout(200)
    check(await pg.evaluate('Camp.s.turno') == 1 and await pg.evaluate('Camp.s.pm') < pm0, 'il movimento viene speso')
    # incontro forzato: bottoni delle prove, risultato registrato
    await pg.evaluate("(()=>{Camp.s.incontro={kind:'bestie',cd:1,testo:'Prova',ab:['atletica','percezione']};render()})()")
    check(await pg.query_selector('.cinc') is not None and await pg.query_selector('[data-a=campriposa]') is None, 'incontro: niente riposo')
    await pg.click('[data-a=campris][data-v="0:atletica"]'); await pg.wait_for_timeout(200)
    check(await pg.query_selector('.cinc') is None and await pg.evaluate('Camp.s.ultima.ok') is True, 'prova superata (CD 1), incontro chiuso')
    # giorno e notte
    await pg.click('[data-a=campriposa]'); await pg.click('[data-a=campriposa]')
    check('Giorno 2' in await pg.inner_text('.chud') and await pg.evaluate('Camp.s.perdizione') == 3, 'giorno 2, perdizione 3')
    # errore leggibile: entrare dove non c'è nulla
    await pg.click('[data-a=campentra]', force=True); await pg.wait_for_timeout(100)
    # salvataggio: dopo il ricaricamento la partita riprende
    await pg.evaluate("localStorage.setItem('__stub',JSON.stringify(window.__db))")
    await pg.reload(); await pg.wait_for_timeout(3500)
    check(await pg.evaluate('Camp.s&&Camp.s.giorno') == 2, 'la campagna riprende dopo il ricaricamento')
    # fine campagna
    await pg.evaluate("(()=>{ui.camp=true;Camp.s.over={win:true,reason:'La torre oscura è caduta',giorni:2};render()})()")
    check('Vittoria' in await pg.inner_text('.cfine'), 'schermata di vittoria')
    await pg.click('[data-a=campnuova]'); await pg.wait_for_timeout(1200)
    check(await pg.evaluate('Camp.s.giorno') == 1 and await pg.query_selector('.cfine') is None, 'nuova campagna')
    await ctx.close()

async def sc_eroi(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await pg.click('[data-a=eroi]'); await pg.wait_for_timeout(500)
    check('5 posti liberi' in await pg.inner_text('.ecard.nuovo'), 'cinque posti liberi')
    await pg.click('[data-a=eroinuovo][data-v=e1]')
    await pg.click('[data-a=eroiavanti]'); check('Scegli un nome' in await pg.inner_text('.acc-msg'), 'senza nome non si prosegue')
    await pg.fill('#eroe-nome', 'Brunilde'); await pg.click('[data-a=eroicol][data-v="capelli:1"]'); await pg.click('[data-a=eroicol][data-v="viso:0"]')
    check(await pg.evaluate('Eroi.bozza.aspetto') == {'pelle': 0, 'capelli': 1, 'mantello': 0, 'viso': 0}, 'aspetto scelto (capelli 1, viso 0)')
    check(await pg.query_selector('.eritr svg.rit') is not None, 'ritratto disegnato')
    await pg.click('[data-a=eroiavanti]'); await pg.click('[data-a=eroirazza][data-v=nano]'); await pg.click('[data-a=eroiavanti]')
    await pg.click('[data-a=eroiclasse][data-v=guerriero]'); await pg.click('[data-a=eroiavanti]')
    for _ in range(7): await pg.click('[data-a=eroipt][data-v="for:1"]')
    check(await pg.evaluate('Eroi.bozza.base.for') == 15 and await pg.inner_text('#punti') == '18', 'FOR a 15 costa 9 punti: ne restano 18')
    for _ in range(6): await pg.click('[data-a=eroipt][data-v="cos:1"]')
    check(await pg.evaluate('[Eroi.bozza.base.cos,Eroi.puntiLiberi()]') == [14, 11], 'COS a 14: costo progressivo 7, restano 11')
    for _ in range(2): await pg.click('[data-a=eroipt][data-v="des:1"]')
    await pg.click('[data-a=eroipt][data-v="des:-1"]')
    for k in ('int', 'sag', 'car'):
        for _ in range(8): await pg.click(f'[data-a=eroipt][data-v="{k}:1"]') if await pg.evaluate(f'!document.querySelector(\'[data-a=eroipt][data-v="{k}:1"]\').disabled') else None
    check(await pg.evaluate('Eroi.puntiLiberi()') >= 0 and await pg.evaluate('EROI.costoBase(Eroi.bozza.base)') <= 27, 'mai oltre i 27 punti')
    check(await pg.evaluate('document.querySelector(\'[data-a=eroipt][data-v="for:-1"]\').disabled') is False and await pg.evaluate('Eroi.bozza.base.for') == 15, 'si può togliere un punto')
    await pg.click('[data-a=eroiavanti]'); await pg.wait_for_timeout(200)
    check('brunilde' in (await pg.inner_text('.escheda')).lower() and 'CA 19' in (await pg.inner_text('.escheda')).upper(), 'riepilogo: nome e CA (maglia 16 + scudo 2 + nano 1 + DES)')
    await pg.click('[data-a=eroicrea]'); await pg.wait_for_timeout(800)
    k = 'players/u-1/eroi/e1'
    st = await pg.evaluate(f"window.__db['{k}']||null")
    check(st and st['nome'] == 'Brunilde' and st['razza'] == 'nano' and st['classe'] == 'guerriero' and st['liv'] == 1 and st['xp'] == 0 and st['oro'] == 20, f'salvato nel profilo {st and st["nome"]}')
    check(await pg.evaluate('EROI.coerente(window.__db["' + k + '"])'), 'l\'eroe salvato è coerente')
    check('brunilde' in (await pg.inner_text('.escheda')).lower(), 'si apre la scheda')
    await pg.click('[data-a=eroiindietro]'); check('brunilde' in (await pg.inner_text('.ecard')).lower() and '4 posti liberi' in await pg.inner_text('.ecard.nuovo'), 'nell\'elenco, quattro posti liberi')
    # difese delle regole (simulate nello stub): punteggi truccati, sesto posto, modifica di razza, lettura degli eroi di altri
    async def prova(js): return await pg.evaluate("(async()=>{try{" + js + ";return 'ok'}catch(e){return e.code||e.message}})()")
    base_ok = "const h=EROI.nuovo({nome:'X',razza:'umano',classe:'mago',base:EROI.baseIniziale(),aspetto:{pelle:0,capelli:0,mantello:0,viso:0}});"
    check(await prova(base_ok + "h.base={for:15,des:15,cos:15,int:15,sag:15,car:15};await FB.salvaEroe('e2',h)") == 'permission-denied', 'punteggi oltre i 27 punti: rifiutati')
    check(await prova(base_ok + "await FB.salvaEroe('e6',h)") == 'permission-denied', 'un sesto eroe: rifiutato')
    check(await prova(base_ok + "h.liv=5;await FB.salvaEroe('e2',h)") == 'permission-denied', 'eroe nuovo di livello 5: rifiutato')
    check(await prova(base_ok + "await FB.salvaEroe('e2',h)") == 'ok', 'un eroe valido sul secondo posto passa')
    check(await prova("const h={...Eroi.lista.e1,razza:'orco'};await FB.salvaEroe('e1',h)") == 'permission-denied', 'cambiare razza: rifiutato')
    check(await prova("const h={...Eroi.lista.e1,classe:'mago'};await FB.salvaEroe('e1',h)") == 'permission-denied', 'cambiare classe: rifiutato')
    check(await prova("const h=EROI.guadagna(Eroi.lista.e1,150);await FB.salvaEroe('e1',h)") == 'ok', 'salire di livello: permesso')
    check(await prova("const h={...Eroi.lista.e1,xp:0,liv:1};await FB.salvaEroe('e1',h)") == 'permission-denied', 'tornare indietro di livello: rifiutato')
    check(await prova("const F=FB.m.F;await F.getDocs(F.collection(FB.db,'players','u-2','eroi'))") == 'permission-denied', 'leggere gli eroi di un altro: rifiutato')
    # persistenza e scheda manomessa
    await pg.evaluate("(()=>{const k='players/u-1/eroi/e2';window.__db[k].hpMax=150;window.__db[k].hp=150;localStorage.setItem('__stub',JSON.stringify(window.__db))})()")
    await pg.reload(); await pg.wait_for_timeout(3500)
    await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await pg.click('[data-a=eroi]'); await pg.wait_for_timeout(600)
    check(len(await pg.query_selector_all('.ecard:not(.nuovo)')) == 1 and 'brunilde' in (await pg.inner_text('.ecard')).lower(), 'dopo il ricarico: c\'è Brunilde, la scheda manomessa è nascosta')
    await pg.click('[data-a=eroischeda][data-v=e1]'); await pg.wait_for_timeout(200)
    check('liv' in (await pg.inner_text('.modal')).lower() or 'livello 2' in await pg.inner_text('.modal'), 'scheda dopo il ricarico')
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    await pg.click('[data-a=eroielimina]'); await pg.wait_for_timeout(600)
    check(await pg.evaluate("window.__db['players/u-1/eroi/e1']") is None and '5 posti liberi' in await pg.inner_text('.ecard.nuovo'), 'eliminato: il posto torna libero')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_mosse_simultanee(b, srv):
    """Due telefoni nella stessa stanza sul Realtime Database: «Pronto» in contemporanea (The Mind), doppio tocco a turni e riallineamento."""
    sh = Shared()
    ctxA, A = await telefono_rt(b, srv, sh, 'Ada', 1)
    await A.wait_for_function("R.mode==='rt'&&R.code==='PIAZZA'&&R.members.length>0", timeout=30000)
    code = await A.evaluate("(async()=>{const c=await createRoom();await joinRoom(c);setRoomUrl(c);return c})()")
    ctxB, B = await telefono_rt(b, srv, sh, 'Bruno', 2, '?room=' + code + '&net=rt')
    await B.wait_for_function(f"R.mode==='rt'&&R.code==={code!r}&&R.members.length>=2", timeout=30000)
    await A.wait_for_function("R.members.length>=2", timeout=15000)
    # 1) The Mind: tutti toccano «Pronto» nello stesso istante, nessuno deve andare perso
    await A.evaluate("startGame('mind')")
    for p in (A, B): await p.wait_for_function("ui.screen==='game'&&G&&G.g==='mind'", timeout=20000)
    await A.wait_for_timeout(2500)
    rev0 = await A.evaluate('R.doc.rev')
    await asyncio.gather(A.evaluate("dispatch({t:'ready'})"), B.evaluate("dispatch({t:'ready'})"))
    await A.wait_for_timeout(2500)
    check(await A.evaluate('G.phase') == 'play' and await B.evaluate('G.phase') == 'play', 'Mind: i due «Pronto» simultanei sono arrivati entrambi, la partita è partita')
    check(await A.evaluate('R.doc.rev') == rev0 + 2, f'Mind: rev +2 sulla stanza ({rev0} -> {await A.evaluate("R.doc.rev")})')
    check(await A.evaluate('JSON.stringify(G)') == await B.evaluate('JSON.stringify(G)'), 'Mind: i due telefoni hanno lo stesso stato')
    # 2) gioco a turni: doppio tocco di chi ha il turno, la seconda mossa parte dallo stesso stato e deve essere rifiutata
    await A.evaluate("toLobby()")
    for p in (A, B): await p.wait_for_function("ui.screen==='room'", timeout=20000)
    await A.evaluate("startGame('briscola')")
    for p in (A, B): await p.wait_for_function("ui.screen==='game'&&G&&G.g==='briscola'", timeout=20000)
    await A.wait_for_timeout(3500)
    att = A if await A.evaluate('isMine(G.cur)') else B
    altro = B if att is A else A
    rev1 = await att.evaluate('R.doc.rev')
    err = await att.evaluate("""(async()=>{const h=G.hands[G.cur].slice();const p1=dispatch({t:'play',c:h[0]});ui.busy=false;ui.anim=false;
      const p2=dispatch({t:'play',c:h[1]});await Promise.all([p1,p2]);await new Promise(r=>setTimeout(r,1500));return ui.err})()""")
    await A.wait_for_timeout(1500)
    check('Un altro telefono' in (err or ''), f'doppio tocco: la seconda mossa è rifiutata con messaggio ({err!r})')
    check(await att.evaluate('R.doc.rev') == rev1 + 1 and await altro.evaluate('R.doc.rev') == rev1 + 1, 'doppio tocco: rev +1, una sola mossa salvata')
    check(await att.evaluate('G.trick.length') == 1 and await altro.evaluate('G.trick.length') == 1, 'doppio tocco: una sola carta sul tavolo, su entrambi')
    check(await A.evaluate('JSON.stringify(G)') == await B.evaluate('JSON.stringify(G)'), 'doppio tocco: dopo il riallineamento i due telefoni sono identici')
    check(await att.evaluate('R.grev') == rev1 + 1, 'la versione di base della prossima mossa è quella nuova')
    check(not A.errs and not B.errs, f'nessun errore JS {A.errs[:1]} {B.errs[:1]}')
    await ctxA.close(); await ctxB.close()

async def sc_posizioni_separate(b, srv):
    """Camminare scrive solo il nodo pos/: l'altro telefono vede la posizione senza che i membri cambino né la pagina si ridisegni."""
    sh = Shared()
    ctxA, A = await telefono_rt(b, srv, sh, 'Ada', 1)
    await A.wait_for_function("R.mode==='rt'&&R.code==='PIAZZA'&&R.members.length>0", timeout=30000)
    code = await A.evaluate("(async()=>{const c=await createRoom();await joinRoom(c);setRoomUrl(c);return c})()")
    ctxB, B = await telefono_rt(b, srv, sh, 'Bruno', 2, '?room=' + code + '&net=rt')
    await B.wait_for_function(f"R.mode==='rt'&&R.code==={code!r}&&R.members.length>=2", timeout=30000)
    await A.wait_for_function("R.members.length>=2", timeout=15000)
    await B.evaluate("window.__rn=0;const _r=render;render=function(){window.__rn++;return _r.apply(this,arguments)}")
    n0 = await B.evaluate('window.__rn')
    for i in range(6):
        await A.evaluate(f"R.mine.pos3={{a:'loc',x:{i}.5,z:2,sit:false,t:Date.now()}};savePos()")
        await A.wait_for_timeout(150)
    await B.wait_for_function("(R.members.find(m=>m.id!==ME.dev)||{}).pos3&&R.members.find(m=>m.id!==ME.dev).pos3.x===5.5", timeout=10000)
    check(await B.evaluate('window.__rn') == n0, f'6 spostamenti: nessun render sull\'altro telefono ({n0} -> {await B.evaluate("window.__rn")})')
    check(await B.evaluate("R.pos[R.members.find(m=>m.id!==ME.dev).id].x") == 5.5, 'la posizione arriva dal nodo pos/')
    check(not A.errs and not B.errs, f'nessun errore JS {A.errs[:1]} {B.errs[:1]}')
    await ctxA.close(); await ctxB.close()

async def sc_errori_globali(b, srv):
    """Gestore globale: errori e promesse rifiutate vengono annotati (con limite di frequenza) senza rompere la pagina."""
    ctx = await new_context(b, srv.port); pg = await vendor_pg(ctx, srv.url, 3000)
    await pg.evaluate("Promise.reject(new Error('prova-promessa'));setTimeout(()=>{throw new Error('prova-finestra')},0)")
    await pg.evaluate("for(let i=0;i<20;i++)ERR.n(new Error('ripetuto'),'t')")
    await pg.wait_for_timeout(500)
    m = await pg.evaluate("ERR.b.map(x=>x.m)")
    check('prova-promessa' in m and 'prova-finestra' in m, f'errori globali annotati {m}')
    check(m.count('ripetuto') == 1, 'stesso errore ripetuto: una sola voce in 2 s')
    check('prova-finestra' in (await pg.evaluate("localStorage.getItem('rg-err')")), 'gli ultimi errori restano in rg-err')
    check(len(await pg.inner_html('#app')) > 300, 'la pagina resta viva')
    await ctx.close()

async def sc_modale_unica(b, srv):
    """Una sola finestra aperta alla volta (ui.modal), con i vecchi flag che continuano a funzionare."""
    ctx = await new_context(b, srv.port); pg = await vendor_pg(ctx, srv.url, 3000)
    r = await pg.evaluate("""(()=>{const o=[];ui.cfg=true;o.push(ui.modal);ui.shop=true;o.push(ui.modal+'/'+ui.cfg);ui.cfg=false;o.push(ui.modal);
      ui.acc='top';o.push(ui.modal+'/'+ui.acc+'/'+ui.shop);ui.cfg=ui.acc=ui.shop=ui.oste=ui.dist=ui.tvm=ui.eroi=ui.camp=false;o.push(String(ui.modal));
      ui.eroi=true;ui.eroi=false;ui.camp=true;o.push(ui.modal);ui.camp=false;o.push(String(ui.modal));return o})()""")
    check(r == ['cfg', 'shop/false', 'shop', 'top/top/false', 'null', 'camp', 'null'], f'finestre esclusive {r}')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_font_locali(b, srv):
    """I caratteri vengono dal sito stesso (assets/fonts): nessuna richiesta a Google e i font si caricano davvero."""
    ctx = await new_context(b, srv.port); pg = await ctx.new_page(); ext = []; woff = []
    pg.on('request', lambda r: ext.append(r.url) if 'googleapis' in r.url or 'fonts.gstatic' in r.url else None)
    pg.on('response', lambda r: woff.append(r.status) if '/assets/fonts/' in r.url else None)
    await pg.goto(srv.url); await pg.wait_for_timeout(3000)
    ok = await pg.evaluate("""(async()=>{await Promise.all(['700 16px "Alegreya SC"','500 16px "Alegreya Sans"','16px Silkscreen'].map(f=>document.fonts.load(f,'àèé')));
      return ['700 16px "Alegreya SC"','500 16px "Alegreya Sans"','16px Silkscreen'].every(f=>document.fonts.check(f,'àèé'))})()""")
    check(not ext, f'nessuna richiesta a Google Fonts {ext[:2]}')
    check(ok and woff and all(x == 200 for x in woff), f'font locali caricati ({len(woff)} file)')
    await ctx.close()

async def sc_errori_nel_database(b, srv):
    """Un errore con la rete pronta finisce anche nel nodo errori/, con limite di frequenza."""
    sh = Shared()
    ctx, A = await telefono_rt(b, srv, sh, 'Ada', 1)
    await A.wait_for_function("R.mode==='rt'&&RT.on", timeout=30000)
    await A.evaluate("for(let i=0;i<5;i++)ERR.n(new Error('guasto '+i),'prova')")
    await A.wait_for_timeout(800)
    w = await A.evaluate("__rt.w.filter(x=>x[1].startsWith('errori/')).length")
    check(w == 1, f'5 errori ravvicinati: una sola scrittura in errori/ ({w})')
    check(not A.errs, f'nessun errore JS {A.errs[:1]}'); await ctx.close()

async def sc_catan_tocchi(b, srv):
    """Catan: la preparazione e il primo tiro si giocano con tocchi veri sulla plancia. Lo scenario controlla anche che ogni bersaglio (cerchi degli incroci,
    linee delle strade) sia davvero l'elemento colpito: una classe CSS in comune con la TV (.ctv, pointer-events:none) rendeva le colonie intoccabili."""
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500)
    await pg.evaluate("async()=>{await startGame('catan',[{dev:ME.dev,name:'G1'},{dev:ME.dev,name:'G2'},{dev:ME.dev,name:'G3'}],{x:'base'});await Q;await new Promise(r=>setTimeout(r,800))}")
    colpo = """()=>{const t=Array.from(document.querySelectorAll('[data-a=ctg]'));
      const pt=e=>{const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);return{x,y,ok:h===e||e.contains(h)||(!!h&&h.getAttribute('data-v')===e.getAttribute('data-v'))}};
      return{n:t.length,ko:t.filter(e=>!pt(e).ok).length,mid:t.length?pt(t[Math.floor(t.length/2)]):null}}"""
    for passo in range(12):
        if await pg.evaluate('G.phase') != 'setup': break
        r = await pg.evaluate(colpo)
        if not check(r['n'] > 0 and r['ko'] == 0, f"preparazione, passo {passo}: {r['n']} bersagli, tutti colpibili ({r['ko']} coperti)"): break
        e0 = await pg.evaluate('G.evn')
        await pg.mouse.click(r['mid']['x'], r['mid']['y']); await pg.wait_for_timeout(700)
        if not check(await pg.evaluate('G.evn') > e0, f'preparazione, passo {passo}: il tocco posa il pezzo'): break
    check(await pg.evaluate('G.phase') == 'roll', 'la preparazione (6 colonie e 6 strade) finisce con i tocchi e si passa ai dadi')
    await pg.locator('[data-a=croll]').click(timeout=4000); await pg.wait_for_timeout(900)
    check(await pg.evaluate('!!G.dice'), 'il bottone «Tira i dadi» tira i dadi')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

# Regicide Legacy: una missione giocata davvero dall'interfaccia (tocchi su carte e pulsanti), campagna salvata, missione successiva,
# poi due telefoni sulla stessa stanza del database e lo schermo comune con la plancia 3D
RL_STEP = """()=>{const q=s=>document.querySelector(s);if(ui.anim||ui.busy)return'wait';if(!G)return'nog';if(G.over)return'over';
 const cv=q('.cover [data-a=reveal]');if(cv){cv.click();return'cover'}
 if(!myTurn())return'other';
 if(G.phase==='prep'){q('[data-a=rlstart]').click();return'start'}
 if(G.phase==='magic'){const b=q('.rl-revc:not([disabled])');(b||q('[data-a=rlmago][data-v=""]')).click();return'mago'}
 if(G.phase==='pick'){q('[data-a=rlpick]').click();return'pick'}
 if(G.phase==='discard'){q('[data-a=rlauto]').click();const d=q('[data-a=rldisc]');if(d&&!d.disabled){d.click();return'disc'}const f=q('[data-a=rlfeign]');if(f){f.click();return'feign'}return'stuck'}
 const h=G.hands[G.cur];let best=null;for(let i=0;i<h.length;i++)for(let j=i;j<h.length;j++){const k=i===j?[h[i]]:[h[i],h[j]];if(RLEG.checkPlay(G,k))continue;const p=RLEG.preview(G,k);if(!p||p.jester)continue;
  const left=h.filter(c=>!k.includes(c)).reduce((t,c)=>t+RLEG.val(G,c),0),v=p.dmg*2+p.shield*3+p.draw*2+p.heal+(left>=RLEG.effStr(G)?40:0)-k.length*3;if(!best||v>best.v)best={v,k}}
 if(!best){q('[data-a=rlyc]').click();const y=q('[data-a=rlyield]');if(y){y.click();return'yield'}return'stuck'}
 ui.sel=[];best.k.forEach(c=>q('#hand [data-v="'+c+'"]').click());const b=q('[data-a=rlplay]');if(b.disabled)return'bad:'+best.k.join(',');b.click();return'play'}"""
RL_TXT = "(()=>{const t=document.getElementById('app').innerText;return /\\bundefined\\b|\\bNaN\\b|\\bnull\\b|\\[object/.test(t)?t.slice(0,200):''})()"

async def rl_gioca(pg, passi=900):
    visti = set(); brutto = ''
    for _ in range(passi):
        r = await pg.evaluate(RL_STEP); visti.add(r.split(':')[0])
        if r.startswith('bad') or r == 'stuck': return r, visti, brutto
        t = await pg.evaluate(RL_TXT)
        if t and not brutto: brutto = t
        if r == 'over': return r, visti, brutto
        await pg.wait_for_timeout(15 if r in ('wait', 'other') else 40)
    return 'timeout', visti, brutto

async def sc_regicide_legacy(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500)
    await pg.evaluate("(()=>{SP=.02;localStorage.removeItem('rl-camp')})()")
    # due eroi sullo stesso telefono (ospite): si passa il telefono
    await pg.evaluate("startGame('rlegacy',[{dev:ME.dev,k:'m',name:'Ada'},{dev:ME.dev,k:'g1',name:'Bruno'}])"); await pg.wait_for_timeout(800)
    check(await pg.evaluate("G.g==='rlegacy'&&G.phase==='prep'&&G.mis===1"), 'RL: si parte dalla preparazione della missione 1')
    check('Chiamata alle armi' in await pg.inner_text('#app'), 'RL: storia della missione 1')
    await pg.screenshot(path='/tmp/claude-0/rl-prep.png')
    r, visti, brutto = await rl_gioca(pg)
    check(r == 'over', f'RL: missione giocata fino alla fine dall\'interfaccia ({r}, azioni {sorted(visti)})')
    check({'start', 'play', 'disc', 'cover'} <= visti, f'RL: usati inizio, attacco, parata e passaggio del telefono {sorted(visti)}')
    check(brutto == '', f'RL: nessun testo undefined/NaN/null ({brutto[:80]})')
    await pg.wait_for_timeout(600)
    fine = await pg.evaluate("[G.over.win,JSON.parse(localStorage.getItem('rl-camp')),document.querySelector('.endbox')&&document.querySelector('.endbox').innerText]")
    win, camp, txt = fine
    check(camp is not None and camp['v'] >= 2, f'RL: campagna salvata sul telefono (v{camp and camp["v"]})')
    check(txt and ('Missione compiuta' in txt or 'Missione fallita' in txt), 'RL: schermata di fine missione')
    await pg.screenshot(path='/tmp/claude-0/rl-fine.png')
    await pg.click('[data-a=rematch]'); await pg.wait_for_timeout(900)
    nxt = await pg.evaluate("[G.phase,G.mis,G.coins,!!document.querySelector('.rl-merc')]")
    if win: check(nxt[0] == 'prep' and nxt[1] == 2, f'RL: dopo la vittoria si passa alla missione 2 {nxt}')
    else: check(nxt[0] == 'prep' and nxt[1] == 1 and nxt[2] == 1 and nxt[3], f'RL: dopo la sconfitta si riprova con 1 moneta e i mercenari {nxt}')
    # missione avanzata (campagna fittizia alla 9): classi nuove, dispersi, reliquie; si gioca un po' e si fotografa a 390 px
    await pg.evaluate("""(()=>{const c=RLEG.newCamp();c.id='prova';c.m=9;c.merc=true;c.fails[9]=1;c.beasts=true;c.rel=['flauto','fischietto','emblema'];c.party.push('tronco');c.mod.tronco='G';c.done=[1,2,3,4,5,6,7,8];c.v=20;
      localStorage.setItem('rl-camp',JSON.stringify(c));G=null})()""")
    await pg.evaluate("startGame('rlegacy',[{dev:ME.dev,k:'m',name:'Ada'}])"); await pg.wait_for_timeout(800)
    check(await pg.evaluate("G.mis===9&&!!document.querySelector('.rl-merc')&&document.querySelectorAll('[data-a=rlbeast]').length===4"), 'RL: missione 9 con mercenari e belve in preparazione')
    await pg.click('[data-a=rlmerc][data-v=mg1]'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("G.prep.merc.includes('mg1')"), 'RL: mercenario scelto con un tocco')
    await pg.click('[data-a=rlstart][data-v="0"]'); await pg.wait_for_timeout(900)
    check(await pg.evaluate("!!G.stacks&&document.querySelectorAll('[data-a=rlsacr]').length===3"), 'RL: tre pile di dispersi sul tavolo')
    for _ in range(12):
        await pg.evaluate(RL_STEP); await pg.wait_for_timeout(120)
    await pg.wait_for_timeout(500)
    check(await pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), 'RL: niente scroll orizzontale a 390 px')
    await pg.screenshot(path='/tmp/claude-0/rl-tavolo.png', full_page=True)
    check(await pg.evaluate(RL_TXT) == '', 'RL: testi puliti in missione 9')
    # schermo comune: plancia low-poly (WebGL software) e niente mani a vista
    await pg.set_viewport_size({'width': 1920, 'height': 1080})
    await pg.evaluate("(async()=>{ui.tv=true;document.documentElement.dataset.tv='1';const S=[{dev:'a',k:'m',name:'Ada'},{dev:'b',k:'m',name:'Bruno'},{dev:'c',k:'m',name:'Carla'}];await startGame('rlegacy',S);await Q;})()")
    await pg.wait_for_timeout(800)
    check('Regicidio: la Campagna' in await pg.inner_text('#app'), 'RL TV: preparazione sullo schermo')
    await pg.evaluate("(async()=>{const r=RLEG.act(G,{t:'start',first:1});pushState(r.s,false);await Q})()"); await pg.wait_for_timeout(500)
    await pg.evaluate("(async()=>{let s=G;for(let i=0;i<4&&!s.over;i++){const h=s.hands[s.cur];const r=RLEG.act(s,{t:'play',cards:[h[h.length-1]]});if(r.err)break;s=r.s;if(s.phase==='discard'){const d=RLEG.bestDiscard(s);const r2=d.length?RLEG.act(s,{t:'discard',cards:d}):RLEG.act(s,{t:'feign'});if(r2.err)break;s=r2.s}if(s.phase==='magic')s=RLEG.act(s,{t:'mago',c:null}).s;if(s.phase==='pick')s=RLEG.act(s,{t:'pick',to:s.cur}).s}pushState(s,false);await Q})()")
    await pg.wait_for_timeout(4000)
    d3 = await pg.evaluate("document.documentElement.dataset.tv3==='1'")
    check(await pg.evaluate("document.querySelectorAll('#hand .card:not(.back)').length") == 0, f'RL TV: nessuna mano a vista (3D: {d3})')
    check(await pg.evaluate("document.querySelectorAll('.tv3-pl li').length") == 3, 'RL TV: tre giocatori con le carte in mano')
    await pg.screenshot(path='/tmp/claude-0/rl-tv.png')
    check(not pg.errs, f'RL: nessun errore JS {pg.errs[:2]}'); await ctx.close()

async def sc_regicide_legacy_due_telefoni(b, srv):
    sh = Shared()
    ctxA, A = await telefono_rt(b, srv, sh, 'Ada', 11)
    await A.wait_for_function("R.mode==='rt'&&R.code&&R.members.length>0", timeout=30000)
    code = await A.evaluate("(async()=>{const c=await createRoom();await joinRoom(c);setRoomUrl(c);return c})()")
    ctxB, B = await telefono_rt(b, srv, sh, 'Bruno', 12, '?room=' + code + '&net=rt')
    await B.wait_for_function("R.mode==='rt'&&R.members.length>=2", timeout=30000); await A.wait_for_timeout(1200)
    for p_ in (A, B): await p_.evaluate("(()=>{SP=.02;localStorage.removeItem('rl-camp')})()")
    await A.evaluate("startGame('rlegacy')"); await A.wait_for_timeout(3500)
    check(await A.evaluate('G&&G.g') == 'rlegacy' and await B.evaluate('G&&G.g') == 'rlegacy', 'RL online: la missione parte su entrambi i telefoni')
    fini = 0
    for _ in range(500):
        ra = await A.evaluate(RL_STEP); rb = await B.evaluate(RL_STEP)
        if ra == 'over' and rb == 'over': fini = 1; break
        if 'stuck' in (ra, rb) or ra.startswith('bad') or rb.startswith('bad'): break
        await A.wait_for_timeout(120)
    await A.wait_for_timeout(1500)
    ga = await A.evaluate('JSON.stringify([G.evn,G.hands.map(h=>h.length),G.res.length,G.disc.length,G.kills,!!G.over])'); gb = await B.evaluate('JSON.stringify([G.evn,G.hands.map(h=>h.length),G.res.length,G.disc.length,G.kills,!!G.over])')
    check(fini == 1, f'RL online: missione portata a termine a due telefoni ({ra}/{rb})')
    check(ga == gb, f'RL online: stato uguale sui due telefoni {ga} {gb}')
    ca = await A.evaluate("JSON.parse(localStorage.getItem('rl-camp')||'null')"); cb = await B.evaluate("JSON.parse(localStorage.getItem('rl-camp')||'null')")
    check(ca and cb and ca['v'] == cb['v'] and ca['id'] == cb['id'], 'RL online: la campagna è salvata uguale su entrambi i telefoni')
    vis = await B.evaluate("[...document.querySelectorAll('#hand .card')].map(c=>c.dataset.v)")
    for p_ in (A, B): check(not p_.errs, f'RL online: nessun errore JS {p_.errs[:1]}')
    for c in (ctxA, ctxB): await c.close()

async def sc_mani_a_ventaglio(b, srv):
    # fanH (mano a ventaglio con le carte disegnate) non deve essere coperta da fanRowsH del layout fisso
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500)
    for gid, n in (('briscola', 2), ('scopa', 2), ('burraco', 2), ('saboteur', 3), ('gang', 3)):
        r = await pg.evaluate("""async([gid,n])=>{const S=Array.from({length:n},(_,i)=>({dev:i?'altro'+i:ME.dev,k:'m',name:'G'+i}));await startGame(gid,S);await Q;await new Promise(r=>setTimeout(r,400));
          const h=document.querySelector('#hand,.uhand');return h?[h.querySelectorAll('.card,.ucard,[data-a=sel],[data-v]').length,/^[A-Z0-9]+$/.test(h.innerText.replace(/\s/g,''))&&h.innerText.length>6]:[0,false]}""", [gid, n])
        check(r[0] > 0 and not r[1], f'{gid}: la mano mostra carte disegnate ({r[0]})')
        if gid == 'burraco':
            bad = await pg.evaluate("[...document.querySelectorAll('#bdisc .card b')].filter(b=>getComputedStyle(b).backgroundImage!=='none').length")
            check(bad == 0, f'burraco: gli scarti non diventano pallini dorati (simboli con sfondo: {bad})')
        await pg.evaluate("(()=>{G=null;ui.screen='room';R.offSeats=null})()")
    check(not pg.errs, f'mani: nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_giallo(b, srv):
    """Cena con delitto: sei telefoni e una TV regista sul database condiviso, dall'avvio al finale (con la TV riavviata a metà)."""
    sh = Shared(); kit = json.load(open(os.path.join(DIST, '..', 'src', 'kit', 'ultima-cena.json')))
    SCH = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    async def regia(sel):
        # un momento a tutto schermo può comparire in qualsiasi istante (come per chi fa da regista): lo si salta e si riprova
        for _ in range(8):
            await T.evaluate('SCENA.salta(true)')
            try:
                await T.click(sel, timeout=4000); return
            except Exception: await T.wait_for_timeout(300)
        await T.click(sel)
    nomi = ['Ada', 'Bruno', 'Carla', 'Dino', 'Elsa', 'Fabio']
    ctxA, A = await telefono_rt(b, srv, sh, nomi[0], 11)
    await A.wait_for_function("R.mode==='rt'&&R.code==='PIAZZA'", timeout=30000)
    code = await A.evaluate("(async()=>{const c=await createRoom();await joinRoom(c);setRoomUrl(c);return c})()")
    altri = await asyncio.gather(*[telefono_rt(b, srv, sh, n, 12 + i, '?room=' + code + '&net=rt') for i, n in enumerate(nomi[1:])])
    P = [A] + [x[1] for x in altri]; ctxs = [ctxA] + [x[0] for x in altri]
    await A.wait_for_function("R.members.length===6&&R.members.every(m=>m.uid)", timeout=40000)
    check(True, 'sei telefoni nella stanza ' + code)
    # senza regia non parte
    await A.evaluate("startGame('giallo',null,{kit:'ultima-cena'})"); await A.wait_for_timeout(400)
    check('regista' in (await A.evaluate("ui.err||''")), 'senza schermo regista la cena non parte')
    # TV: lobby con il pulsante, poi diventa regista
    ctxT, T = await telefono_rt(b, srv, sh, '', 20, '?tv=' + code + '&net=rt'); ctxs.append(ctxT)
    await T.set_viewport_size({'width': 1280, 'height': 720})
    await T.wait_for_function("ui.tv&&R.doc&&document.querySelector('[data-a=giaregia]')", timeout=30000)
    await T.click('[data-a=giaregia]')
    await T.wait_for_function('REGIA.sono()', timeout=30000)
    await A.wait_for_function('!!REGIA.uid', timeout=30000)
    check(sh.d.get('stanze/' + code + '/r') == await T.evaluate('RT.uid()'), 'la TV ha preso la regia')
    devT = await T.evaluate('ME.dev')
    check(not any(k.startswith('stanze/' + code + '/m/' + devT) for k in sh.d), 'la TV non è un giocatore')
    # avvio
    await A.evaluate("ui.err='';startGame('giallo',null,{kit:'ultima-cena'})")
    for p in P: await p.wait_for_function("G&&G.g==='giallo'&&G.fase==='prologo'&&GIA.mano.scheda", timeout=40000)
    check(True, 'prologo: la stanza è in gioco e ogni telefono ha la sua scheda')
    # sigla e cast sulla TV (la messa in scena comune)
    await T.wait_for_function("document.querySelector('#gia-scena.sigla')", timeout=30000)
    check(kit['titolo'] in await T.inner_text('#gia-scena'), 'TV: sigla con il titolo del kit')
    check(await T.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--gk-acc').trim()") == kit['scena']['palette']['accento'], 'TV: colori del kit applicati')
    await T.wait_for_function("getComputedStyle(document.documentElement).getPropertyValue('--gk-font').trim()!==''", timeout=30000)
    check(True, 'TV: carattere dei titoli del kit caricato')
    check(await T.evaluate("!!document.querySelector('#gia-fondo canvas')"), 'TV: atmosfera animata sotto la scena')
    await T.evaluate("SCENA.salta(false)")
    await T.wait_for_function("SCENA.visti.includes('cast')&&document.querySelector('#gia-scena.cast:not(.vittima) .gia-volto svg')", timeout=40000)
    await T.wait_for_timeout(1200); await T.screenshot(path=os.path.join(SCH, 'giallo-tv-cast.png'))
    await T.evaluate("SCENA.salta(true)")
    visti = await T.evaluate('SCENA.visti')
    check(visti[:3] == ['sigla', 'cast vittima', 'cast'], f'TV: sigla, vittima, poi il cast uno per uno ({visti})')
    errs_tel = [e for p in P for e in p.errs]
    check(not errs_tel, f'telefoni: nessun errore durante il prologo {errs_tel[:1]}')
    check(await T.evaluate("document.querySelectorAll('.giatv-side .gia-volto').length") == 6, 'TV: ritratto disegnato per ogni giocatore')
    schede = [await p.evaluate('GIA.mano.scheda.nome') for p in P]
    chiavi = [set(await p.evaluate('Object.keys(GIA.mano)')) for p in P]
    check(len(set(schede)) == 6 and all(c == {'scheda'} for c in chiavi), f'personaggi diversi, solo la propria scheda: {schede}')
    stanza = sh.d['stanze/' + code + '/d']['j']
    segreti = [x['segreto'][:40] for x in kit['personaggi']] + [x[:40] for x in kit['soluzione']['ricostruzione']]
    check(not any(t in stanza for t in segreti), 'il documento della stanza non contiene segreti né soluzione')
    check(await T.evaluate("document.body.innerText.includes(" + json.dumps(kit['vittima']['nome']) + ")"), 'TV: prologo con la vittima')
    check(await A.evaluate("!!document.querySelector('.gia-io .gia-volto svg')"), 'telefono: il proprio ritratto in cima alla scheda')
    # primo atto
    await regia('[data-a=giaavanti]')
    for p in P: await p.wait_for_function("G.fase==='atto'&&G.atto===0&&GIA.mano.ob0", timeout=40000)
    check(await A.evaluate("!!document.querySelector('.gia-t[data-scade]')"), 'atto 1: obiettivi a tutti, timer sul telefono')
    await T.wait_for_function("SCENA.visti.includes('cartello')", timeout=30000)
    check('Il brindisi mancato' in await T.inner_text('#gia-scena'), 'TV: cartello del primo atto')
    await A.wait_for_function("document.querySelector('#gia-scena.tel [data-a=giabusta]')", timeout=30000)
    await A.screenshot(path=os.path.join(SCH, 'giallo-tel-busta.png'))
    # la busta si chiude da sola dopo qualche secondo: la si tocca appena c'è (stesso passo in cui la si trova)
    await A.wait_for_function("(()=>{const b=document.querySelector('#gia-scena.tel [data-a=giabusta]');if(b)b.click();return !document.querySelector('#gia-scena.on')})()", timeout=30000)
    check(await A.evaluate("!document.querySelector('#gia-scena.on')&&['indizi','obiettivi'].includes(ui.gtab)"), 'telefono: busta del nuovo atto, si tocca e apre la scheda giusta')
    # evento con messaggio privato (biglietto per Ser Orlando): busta personale, la TV dice a chi guardare
    io_orl = None
    for p in P:
        if await p.evaluate("GIA.mano.scheda.id") == 'orlando': io_orl = p
    await T.evaluate("SCENA.salta(true);GIA.comanda({t:'evento',i:1})")
    await io_orl.wait_for_function("document.querySelector('#gia-scena.tel.privato')", timeout=30000)
    nome_orl = await io_orl.evaluate("G.giocatori.find(g=>g.uid===RT.uid()).nome")
    await T.wait_for_function("SCENA.visti.includes('evento fx-telegramma')", timeout=30000)
    check(nome_orl + ', guarda il telefono' in await T.inner_text('#gia-scena'), f'evento: la TV dice «{nome_orl}, guarda il telefono»')
    await io_orl.wait_for_function("(()=>{const b=document.querySelector('#gia-scena.tel.privato [data-a=giabusta]');if(b)b.click();return ui.gtab==='indizi'})()", timeout=30000)
    check('chiedi al ragazzo' in (await io_orl.inner_text('.gia-body')).lower(), 'messaggio privato: solo Orlando lo legge tra gli indizi')
    altri_testo = [await p.evaluate("JSON.stringify(GIA.mano)") for p in P if p is not io_orl]
    check(not any('Chiedi al ragazzo' in t for t in altri_testo), 'messaggio privato: nessun altro lo riceve')
    await T.evaluate("SCENA.salta(true);GIA.comanda({t:'evento',i:0})")
    await T.wait_for_function("SCENA.visti.includes('evento fx-lampo')", timeout=30000)
    await T.wait_for_timeout(300); await T.screenshot(path=os.path.join(SCH, 'giallo-tv-evento.png'))
    await T.evaluate("SCENA.salta(true)")
    # mostrare un indizio
    chi = None
    for i, p in enumerate(P):
        ind = await p.evaluate("(Object.values(GIA.mano).find(o=>o.t==='indizio'&&!o.da)||{}).id||''")
        if ind: chi = (i, ind); break
    i, ind = chi; j = (i + 1) % 6
    uid_j = await P[j].evaluate('RT.uid()')
    await P[i].evaluate("v=>{gialloClick('giatab','indizi');gialloClick('giamostra',v)}", ind)
    check(await P[i].evaluate("document.querySelectorAll('[data-a=giamostraa]').length") == 5, 'mostra a…: si sceglie tra gli altri cinque')
    await P[i].evaluate("v=>gialloClick('giamostraa',v)", ind + '|' + uid_j)
    await P[j].wait_for_function("k=>!!GIA.mano['m-'+k]", arg=ind, timeout=30000)
    check(await P[j].evaluate("k=>GIA.mano['m-'+k].da", ind) == nomi[i] and await P[i].evaluate("k=>!!GIA.mano['i-'+k]", ind), f'{nomi[i]} mostra un indizio a {nomi[j]}: copia a lui, originale a lei')
    # obiettivo segnato dal telefono
    await A.evaluate("gialloClick('giaob','0|0')")
    await A.wait_for_function("GIA.mano.ob0.fatti&&GIA.mano.ob0.fatti[0]===true", timeout=30000)
    check(True, 'obiettivo segnato dal telefono e confermato dalla regia')
    # un telefono non può comandare la regia
    await A.evaluate("REGIA.chiedi(R.code,{t:'avanti'})")
    await A.wait_for_function("GIA.mano.avviso", timeout=30000); await A.wait_for_timeout(500)
    check(await A.evaluate("G.fase==='atto'&&G.atto===0"), 'un telefono che prova a far avanzare la serata viene ignorato')
    await T.evaluate('SCENA.salta(true)'); await T.wait_for_timeout(900); await T.screenshot(path=os.path.join(SCH, 'giallo-tv-atto.png'))
    s0 = await A.evaluate('G.scade'); await regia('[data-a=giatempo]')
    await A.wait_for_function("t=>G.scade>=t+290000", arg=s0, timeout=30000)
    check(True, 'la TV aggiunge 5 minuti e il telefono li vede')
    # secondo atto, poi la TV si riavvia e riprende
    await regia('[data-a=giaavanti]')
    for p in P: await p.wait_for_function("G.atto===1&&GIA.mano.ob1", timeout=40000)
    await T.evaluate('SCENA.salta(true)'); await T.wait_for_timeout(2800); await T.screenshot(path=os.path.join(SCH, 'giallo-tv-cantina.png'))
    await T.reload(); await T.wait_for_function("ui.tv&&G&&G.g==='giallo'&&REGIA.sono()&&GIA.D.s&&GIA.D.s.atto===1", timeout=40000)
    check(await T.evaluate("GIA.D.s.mano&&Object.keys(GIA.D.s.mano).length") == 6, 'TV riavviata: riprende la serata dallo stato salvato')
    await regia('[data-a=giaavanti]')
    for p in P: await p.wait_for_function("G.atto===2&&GIA.mano.ob2", timeout=40000)
    await regia('[data-a=giaavanti]')
    for p in P: await p.wait_for_function("G.fase==='accusa'&&ui.gtab==='accusa'&&document.querySelector('#gq-chi')", timeout=40000)
    check(True, 'accusa: ogni telefono apre il modulo')
    # tutti accusano il giusto tranne l'assassino; l'attore è il vicino
    sol = kit['soluzione']['risposte']
    for i, p in enumerate(P):
        io_assassino = await p.evaluate("GIA.mano.scheda.nome") == next(x['nome'] for x in kit['personaggi'] if x['id'] == sol['chi'])
        ris = dict(sol); ris['chi'] = 'bettina' if io_assassino else sol['chi']
        uid_v = await P[(i + 1) % 6].evaluate('RT.uid()')
        await p.evaluate("([r,a])=>{for(const[k,v]of Object.entries(r))document.getElementById('gq-'+k).value=v;document.getElementById('gq-attore').value=a;gialloClick('giavota')}", [ris, uid_v])
    await A.wait_for_function("G.votati.length===6", timeout=30000)
    await T.wait_for_function("document.body.innerText.includes('6 / 6')", timeout=30000)
    check(await T.evaluate("!document.body.innerText.includes(" + json.dumps(kit['soluzione']['ricostruzione'][0][:30]) + ")"), 'TV: sei voti su sei, senza sapere cosa')
    await regia('[data-a=giaavanti]')
    for p in P: await p.wait_for_function("G.fase==='finale'&&G.finale&&G.over", timeout=40000)
    await T.wait_for_function("SCENA.visti.includes('riflettore')", timeout=40000)
    check('Tobia Lesto' in await T.inner_text('#gia-scena'), 'TV: rivelazione con il riflettore sull’assassino')
    await T.wait_for_timeout(1500); await T.screenshot(path=os.path.join(SCH, 'giallo-tv-rivelazione.png'))
    await T.evaluate('SCENA.salta(true)')
    f = await A.evaluate('G.finale')
    check(f['chi'] == 'Tobia Lesto' and not f['punti']['franca'], f"finale: l'assassino era {f['chi']}, scoperto")
    vinti = await A.evaluate("ELO.vincitori(G)")
    check(isinstance(vinti, list) and len(vinti) >= 1, f'chi ha più punti vince ({vinti})')
    await A.wait_for_timeout(2500)
    check(await A.evaluate("FB.p&&FB.p.played") == 1, 'premio di fine partita registrato')
    await A.evaluate("gialloClick('giatab','scheda')"); await A.screenshot(path=os.path.join(os.environ.get('SCHERMATE_DIR', tempfile.gettempdir()), 'giallo-telefono.png'))
    await P[i].evaluate("gialloClick('giatab','indizi')"); await P[i].screenshot(path=os.path.join(os.environ.get('SCHERMATE_DIR', tempfile.gettempdir()), 'giallo-indizi.png'))
    await T.screenshot(path=os.path.join(os.environ.get('SCHERMATE_DIR', tempfile.gettempdir()), 'giallo-tv.png'))
    for p in P + [T]: check(not p.errs, f'nessun errore JS {p.errs[:1]}')
    for c in ctxs: await c.close()

SCENARI = [v for k, v in sorted(globals().items()) if k.startswith('sc_')]

async def main():
    filtro = sys.argv[1:]
    if not os.path.exists(DIST + '/index.html'): sys.exit('manca dist/: lancia prima npm run build')
    srv = Server(DIST)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            scelti = [sc for sc in SCENARI if not filtro or any(f in sc.__name__ for f in filtro)]
            sem = asyncio.Semaphore(int(os.environ.get('PARALLELO', '4')))  # PARALLELO=1 per uno alla volta
            async def uno(sc):
                async with sem:
                    out = []; USCITA.set(out)
                    try: await sc(b, srv)
                    except Exception as e: check(False, f'{sc.__name__}: eccezione {type(e).__name__}: {str(e)[:200]}')
                    return sc.__name__[3:], out
            for nome, out in await asyncio.gather(*[uno(sc) for sc in scelti]):
                print(nome); print('\n'.join(out))
            await b.close()
    finally: srv.stop()
    print('RISULTATO:', 'TUTTO OK' if all(RESULTS) else 'CI SONO ERRORI', f'({sum(RESULTS)}/{len(RESULTS)})'); sys.exit(0 if all(RESULTS) else 1)
if __name__ == '__main__': asyncio.run(main())
