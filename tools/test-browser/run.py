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
    # falò: three.js non viene nemmeno scaricato, PeerJS sì (serve alla stanza)
    ctx = await new_context(b, srv.port, extra_init="localStorage.setItem('rg-lb','iso');"); pg = await vendor_pg(ctx, srv.url)
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
    pg = await vendor_pg(ctx, srv.url, 5000)
    check(len(await pg.inner_html('#app')) > 500, 'peerjs guasto: l\'app si disegna comunque')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def sc_vendor_offline_e_cache(b, srv):
    ctx = await new_context(b, srv.port, name=None, sw=True, extra_init="localStorage.setItem('rg-lb','iso');")
    pg = await vendor_pg(ctx, srv.url, 500)
    await pg.wait_for_function('navigator.serviceWorker.ready.then(()=>true)', timeout=15000); await pg.wait_for_timeout(1500)
    nomi = await pg.evaluate("caches.open('taverna-vendor').then(c=>c.keys()).then(k=>k.map(r=>new URL(r.url).pathname))")
    check(len(nomi) == 2 and all(n.startswith('/vendor/') for n in nomi), f'le librerie sono nella cache dedicata {nomi}')
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
    await pg.click('[data-a=acc]'); await pg.wait_for_timeout(200)
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
    # senza funzione Netlify (qui il server risponde 501): risposte a copioni
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await pg.click('[data-a=oste]'); await pg.wait_for_timeout(300)
    check('Sono il locandiere' in await pg.inner_text('#oste-log'), 'saluto iniziale')
    check(len(await pg.query_selector_all('[data-a=osteq]')) == 4, 'quattro domande pronte')
    await pg.click('[data-a=osteq] >> nth=2'); await pg.wait_for_timeout(600)
    txt = await pg.inner_text('#oste-log')
    check('10 monete' in txt and 'Come guadagno monete?' in txt, 'chip: domanda e risposta a copioni')
    check(await pg.evaluate('Oste.ai') is False, 'funzione assente (501): si ricorda e non riprova')
    await pg.fill('#oste-q', 'regole di perudo'); await pg.press('#oste-q', 'Enter'); await pg.wait_for_timeout(500)
    check('Perudo' in (await pg.inner_text('#oste-log')).split('regole di perudo')[-1], 'invio con Enter: regole del gioco')
    await pg.fill('#oste-q', 'che gioco ci consigli'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(500)
    check('proverei' in await pg.inner_text('#oste-log'), 'consiglio per il tavolo')
    check(await pg.evaluate('document.getElementById("oste-q").value') == '', 'campo svuotato dopo l\'invio')
    await pg.fill('#oste-q', '<img src=x onerror=window.__xss=1>'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(500)
    check(await pg.evaluate('window.__xss') is None and await pg.query_selector('#oste-log img') is None, 'il testo scritto non diventa HTML')
    await pg.click('[data-a=ostex]'); check(await pg.evaluate('ui.cfg===true&&!ui.oste'), 'chiudendo si torna alle impostazioni')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()
    # con la funzione attiva: risposta di Claude, con il contesto del tavolo; poi 429 -> ripiego senza spegnerla
    ctx = await new_context(b, srv.port); corpi = []; stato = {'c': 200}
    async def fn(r):
        if r.request.method == 'POST': corpi.append(r.request.post_data_json)
        if stato['c'] == 200: return await r.fulfill(status=200, content_type='application/json', body='{"testo":"Risposta del locandiere vero"}')
        await r.fulfill(status=stato['c'], content_type='application/json', body='{"errore":"x"}')
    await ctx.route('**/.netlify/functions/locandiere', fn)
    pg = await page(ctx, srv.url)
    await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await pg.click('[data-a=oste]')
    await pg.fill('#oste-q', 'cosa giochiamo stasera?'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(500)
    check('Risposta del locandiere vero' in await pg.inner_text('#oste-log'), 'risposta dalla funzione')
    check(corpi and corpi[0]['domanda'] == 'cosa giochiamo stasera?' and corpi[0]['contesto']['n'] == 1 and 'Uno' in corpi[0]['contesto']['giochi'], f'contesto inviato {str(corpi[:1])[:120]}')
    stato['c'] = 429
    await pg.fill('#oste-q', 'come guadagno monete'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(500)
    check('10 monete' in await pg.inner_text('#oste-log') and await pg.evaluate('Oste.ai') is True, '429: ripiego a copioni, funzione ancora considerata attiva')
    stato['c'] = 503
    await pg.fill('#oste-q', 'aiuto'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(500)
    check(await pg.evaluate('Oste.ai') is False, '503 (chiave non configurata): spenta')
    n = len(corpi); await pg.fill('#oste-q', 'ciao'); await pg.click('[data-a=osteok]'); await pg.wait_for_timeout(400)
    check(len(corpi) == n, 'spenta: nessuna altra chiamata')
    check(not pg.errs, f'nessun errore JS {pg.errs[:1]}'); await ctx.close()

async def telefono(b, srv, sh, nome, seq, query='', wait=5000):
    ctx = await new_context(b, srv.port, name=nome, shared=sh, extra_init=f"localStorage.setItem('__stubseq','{seq}');")
    pg = await page(ctx, srv.url + query, wait); return ctx, pg

async def sc_distanza_due_telefoni(b, srv):
    sh = Shared()
    ctxA, A = await telefono(b, srv, sh, 'Ada', 1)
    A.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    check(await A.evaluate('Dist.ok()'), 'A: profilo online pronto')
    await A.evaluate("(()=>{ui.cfg=true;render()})()"); await A.click('[data-a=dist]'); await A.wait_for_timeout(300)
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
    await B.evaluate("(()=>{ui.cfg=true;render()})()"); await B.click('[data-a=dist]'); await B.wait_for_timeout(1500)
    check(await B.eval_on_selector_all('.drow small', 'e=>e.map(x=>x.textContent)') != [] and code in await B.inner_text('.modal'), 'B: la partita è nell\'elenco')
    await B.click(f'[data-a=distgo][data-v="{code}"]'); await B.wait_for_function("R.mode==='fs'&&G", timeout=30000)
    check(await B.evaluate('[R.mode,ui.screen,G&&G.g]') == ['fs', 'game', 'uno'], 'B: rientra e ritrova la partita in corso')
    # B esce: torna alla modalità di prima, con il suo identificativo di telefono
    await B.evaluate("Dist.esci()"); await B.wait_for_timeout(500)
    check(await B.evaluate('[R.mode!=="fs",ME.dev.startsWith("u:")]') == [True, False], 'B: uscito, identificativo del telefono ripristinato')
    # solo chi l'ha creata può eliminarla; gli altri vengono riportati fuori
    await B.evaluate("(()=>{ui.cfg=true;render()})()"); await B.click('[data-a=dist]'); await B.wait_for_timeout(500)
    check(await B.query_selector('[data-a=distdel]') is None, 'B non vede il cestino')
    await B.click(f'[data-a=distgo][data-v="{code}"]'); await B.wait_for_function("R.mode==='fs'", timeout=30000); await B.wait_for_timeout(800)
    await A.evaluate("(()=>{ui.cfg=true;render()})()") if await A.evaluate('!ui.dist') else None
    await A.evaluate("Dist.act('dist')"); await A.wait_for_timeout(800); await A.click(f'[data-a=distdel][data-v="{code}"]'); await A.wait_for_timeout(2500)
    check(not [k for k in sh.d if k.startswith('partite/' + code)], f'A: eliminata con membri e chat ({[k for k in sh.d if k.startswith("partite/")]})')
    check(await B.evaluate('R.mode') != 'fs', 'B: avvisato e riportato fuori dalla partita eliminata')
    for p in (A, B): check(not p.errs, f'nessun errore JS {p.errs[:1]}')
    await ctxA.close(); await ctxB.close()

async def sc_schermo_tutti_i_giochi(b, srv):
    # lo schermo comune non ha posti: ogni gioco deve disegnarsi senza errori e senza mostrare una mano
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url, 2500)
    ids = await pg.evaluate('GAMES.map(g=>g.id)')
    for gid in ids:
        r = await pg.evaluate("""async(gid)=>{const g=GAMES.find(x=>x.id===gid);let n=1;while(n<=12&&!g.ok(n))n++;
          const S=Array.from({length:n},(_,i)=>({dev:'altro'+i,k:'m',name:'G'+i}));ui.tv=true;
          await startGame(gid,S);await Q;await new Promise(r=>setTimeout(r,500));
          const app=document.getElementById('app');
          return{g:G&&G.g,len:app.innerHTML.length,mano:document.querySelectorAll('#hand .card:not(.back)').length,local:local().length,sc:ui.screen}}""", gid)
        check(r['g'] == gid and r['len'] > 200 and r['mano'] == 0 and r['local'] == 0, f'{gid}: disegnato senza mano ({r["len"]} byte)')
        await pg.evaluate("(()=>{G=null;ui.screen='room';R.offSeats=null})()")
    check(not pg.errs, f'nessun errore JS {pg.errs[:2]}'); await ctx.close()

def leggi_qr(png):
    import cv2, numpy as np
    img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_GRAYSCALE)
    img = cv2.copyMakeBorder(img, 30, 30, 30, 30, cv2.BORDER_CONSTANT, value=255)
    return cv2.QRCodeDetector().detectAndDecode(img)[0]

async def sc_schermo_comune(b, srv):
    sh = Shared()
    ctxA, A = await telefono(b, srv, sh, 'Ada', 1)
    await A.evaluate("(()=>{ui.cfg=true;render()})()"); await A.click('[data-a=dist]'); await A.click('[data-a=distnew]')
    await A.wait_for_function("R.mode==='fs'&&R.code&&R.members.length>0", timeout=30000)
    code = await A.evaluate('R.code')
    ctxB, B = await telefono(b, srv, sh, 'Bruno', 2, '?dist=' + code)
    await B.wait_for_function("R.mode==='fs'&&R.members.length>0", timeout=30000)
    # il telefono propone il link dello schermo comune, con un QR leggibile
    await A.evaluate("(()=>{ui.cfg=true;ui.dist=false;render()})()"); await A.click('[data-a=tvm]'); await A.wait_for_timeout(300)
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
    check('Uno' in await T.inner_text('#tvpanel'), 'TV: pannello con il nome del gioco')
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
asyncio.run(main())
