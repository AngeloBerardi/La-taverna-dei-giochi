# Passo 14: il mondo grande (?ven=mondo2) a tasselli, con acqua, ponti, vista lontana, mini-mappa e nebbia dell'ignoto.
import os, tempfile

async def _avvia(b, srv, url, mondo=None, nebbia="false", seme=1):
    ctx = await new_context(b, srv.port); pg = await page(ctx, url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' else None)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    opz = "{mondo:'%s',nebbia:%s}" % (mondo, nebbia) if mondo else 'undefined'
    await pg.evaluate("(()=>{const s=VEN.nuovo(%d,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val',opz:%s});Ven.entra(s)})()" % (seme, opz))
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(1500)
    return ctx, pg

_FPS = "new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r(n/3)};requestAnimationFrame(f)})"

async def sc_p14_mappa_grande_vista(b, srv):
    """Mondo vasto: tasselli <= 25 e <= 2 nuovi per fotogramma in marcia, fps, texture unica da lontano, contesto perso, nebbia e mini-mappa."""
    ctx, pg = await _avvia(b, srv, srv.url, None)
    fps0 = min(await pg.evaluate(_FPS), await pg.evaluate(_FPS))
    ok = await pg.evaluate("VenMappa.K.geo2===false&&!document.querySelector('.vn-mini')")
    check(ok, 'senza interruttore il mondo è quello di sempre: niente tasselli a richiesta né mini-mappa')
    await ctx.close()
    ctx, pg = await _avvia(b, srv, srv.url + '?ven=mondo2', 'vasto')
    st = await pg.evaluate("({g:VenMappa.K.geo2,G:VenMappa.K.M.G,lg:VenMappa.K.M.laghi.filter(l=>l.grande).length})")
    check(st['g'] and st['G'] == 240, f'mondo vasto 240x240 con tasselli a richiesta: {st}')
    # fiume con ponte e porto su un lago: si guardano da vicino, ognuno con il suo tasselo
    await pg.wait_for_timeout(2500); fps1 = max(await pg.evaluate(_FPS), await pg.evaluate(_FPS))
    check(fps1 >= 0.9 * fps0, f'fps nel mondo vasto {fps1:.1f} >= 0,9 x {fps0:.1f} del mondo di oggi')
    # 30 s di marcia a x4
    await pg.evaluate("""(()=>{const s=Ven.V.s,tu=VEN.TU(s);window.__max=0;window.__nuovi=0;window.__err=0;
      const L=s.l.filter(l=>l.tipo==='citta'||l.tipo==='villaggio').sort((a,b)=>VEN.dist(b,tu)-VEN.dist(a,tu));let r;for(const l of L){r=VEN.ordina(s,{t:'entra',lid:l.id});if(r&&!r.err)break}
      Ven.V.vel=4;Ven.V.pausa=false;VenMappa.K.alt=22;VenMappa.centra();
      const o=VenMappa.passo;window.__t0=performance.now();
      window.__iv=setInterval(()=>{const K=VenMappa.K;window.__max=Math.max(window.__max,Object.keys(K.tess).length);window.__nuovi=Math.max(window.__nuovi,K.nuovi||0)},16)})()""")
    await pg.wait_for_timeout(30000)
    r = await pg.evaluate("({max:window.__max,nuovi:window.__nuovi,n:Object.keys(VenMappa.K.tess).length})")
    check(r['max'] <= 25 and r['max'] >= 2, f'tasselli vivi al massimo {r["max"]} (<= 25)')
    check(r['nuovi'] <= 2, f'al massimo {r["nuovi"]} tasselli nuovi per fotogramma')
    check(not pg.errs and not pg.cons, f'30 s di marcia senza errori: {pg.errs[:3]} {pg.cons[:3]}')
    # vicino a un fiume con ponte
    p = await pg.evaluate("(()=>{const M=VenMappa.K.M,lon=q=>Math.min(...M.luoghi.map(l=>Math.hypot(l.x-q.x,l.y-q.y))),ps=M.P.filter(q=>q.t==='ponte').sort((a,b)=>lon(b)-lon(a)),p=ps.find(q=>lon(q)>=2.5)||ps[0]||M.P[0];Ven.V.s.t=Math.floor(Ven.V.s.t/1440)*1440+600;Ven.V.vel=1;VEN.ordina(Ven.V.s,{t:'ferma'});VenMappa.guarda(p.x,p.y);VenMappa.K.alt=9;return p})()")
    await pg.wait_for_timeout(2500)
    fz = await pg.evaluate("({x:VenMappa.K.fuoco.x,z:VenMappa.K.fuoco.z,s:VenMappa.K.segue})")
    check(abs(fz['x'] - p['x']) < 3 and abs(fz['z'] - p['y']) < 3, f'lo sguardo sta sul ponte {fz} {p}')
    check(await pg.evaluate("VenMappa.K.nTess>=1&&VenMappa.K.nTess<=25"), 'vicino al ponte i tasselli sono costruiti')
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    check(await pg.evaluate("!VenMappa.K.far.visible"), 'vicino al ponte si vedono i tasselli veri e non la texture unica')
    await pg.screenshot(path=os.path.join(d, 'p14-ponte.png'))
    # porto su un lago grande, se c'è
    lago = await pg.evaluate("""(()=>{const M=VenMappa.K.M,G=M.G;const lon=l=>Math.min(...M.luoghi.filter(o=>o!==l).map(o=>Math.hypot(o.x-l.x,o.y-l.y))),pr=M.luoghi.filter(l=>(l.tipo==='porto'||l.tipo==='citta')&&lon(l)>=4).sort((a,b)=>lon(b)-lon(a));for(const l of pr){const i=Math.floor(l.y)*G+Math.floor(l.x);for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){const j=(Math.floor(l.y)+oy)*G+Math.floor(l.x)+ox;if(M.LG[j]&&M.laghi[M.LG[j]]&&M.laghi[M.LG[j]].grande){VenMappa.guarda(l.x,l.y);VenMappa.K.alt=18;return[l.x,l.y]}}}return null})()""")
    await pg.wait_for_timeout(2500)
    check(lago is not None, 'esiste un porto o una città isolata (>= 4 celle dagli altri luoghi) su un lago grande')
    if lago:
        await pg.screenshot(path=os.path.join(d, 'p14-lago.png'))
    # pizzico al massimo: texture unica
    await pg.evaluate("VenMappa.pizzico(0.001)"); await pg.wait_for_timeout(1500)
    far = await pg.evaluate("({l:VenMappa.K.lontano,f:VenMappa.K.far.visible,v:Object.values(VenMappa.K.tess).filter(g=>g.visible).length,alt:VenMappa.K.alt})")
    check(far['l'] and far['f'] and far['v'] == 0, f'al massimo del pizzico si vede solo la texture unica: {far}')
    await pg.screenshot(path=os.path.join(d, 'p14-lontano.png'))
    # mini-mappa: tocco = vai lì
    box = await pg.evaluate("(()=>{const r=document.querySelector('.vn-mini').getBoundingClientRect();return[r.left,r.top,r.width,r.height]})()")
    check(box[2] >= 44 and box[3] >= 44, f'mini-mappa grande abbastanza per il dito: {box}')
    await pg.evaluate("VenMappa.K.alt=16"); await pg.mouse.click(box[0] + box[2] * .25, box[1] + box[3] * .25); await pg.wait_for_timeout(600)
    f = await pg.evaluate("({x:VenMappa.K.fuoco.x,z:VenMappa.K.fuoco.z,G:VenMappa.K.M.G})")
    check(abs(f['x'] - f['G'] * .25) < 40 and abs(f['z'] - f['G'] * .25) < 40, f'il tocco sulla mini-mappa porta lo sguardo lì: {f}')
    # contesto perso e ripreso
    await pg.evaluate("(()=>{const g=VenArte.cv.getContext('webgl2')||VenArte.cv.getContext('webgl');window.__cv0=VenArte.cv;g.getExtension('WEBGL_lose_context').loseContext()})()"); await pg.wait_for_timeout(3000)
    rip = await pg.evaluate("({nuovo:VenArte.cv!==window.__cv0,persa:VenArte.persa(),scena:!!VenMappa.K.scene,mini:!!document.querySelector('.vn-mini')})")
    check(rip['nuovo'] and not rip['persa'] and rip['scena'] and rip['mini'], f'contesto perso e ripreso: {rip}')
    check(not pg.errs and not pg.cons, f'nessun errore: {pg.errs[:3]} {pg.cons[:3]}')
    await ctx.close()
    # nebbia dell'ignoto: le celle viste si ricordano nel telefono, il velo copre il resto
    ctx, pg = await _avvia(b, srv, srv.url + '?ven=mondo2', 'vasto', 'true')
    await pg.evaluate("(()=>{const s=Ven.V.s,tu=VEN.TU(s);const L=s.l.filter(l=>l.tipo==='citta'||l.tipo==='villaggio').sort((a,b)=>VEN.dist(b,tu)-VEN.dist(a,tu));for(const l of L){const r=VEN.ordina(s,{t:'entra',lid:l.id});if(r&&!r.err)break}Ven.V.vel=4})()")
    await pg.wait_for_timeout(8000); await pg.evaluate("window.dispatchEvent(new Event('pagehide'))")
    nb = await pg.evaluate("(()=>{const K=VenMappa.K,v=K.visto;let n=0;for(let i=0;i<v.length;i++)n+=v[i];return{n,tot:v.length,k:Object.keys(localStorage).filter(k=>k.indexOf('ven-visto-')===0).length,nebbia:K.nebbia,velo:!!K.velo}})()")
    check(nb['nebbia'] and nb['velo'] and 0 < nb['n'] < nb['tot'] // 2 and nb['k'] == 1, f'nebbia: solo le celle percorse sono viste e si ricordano: {nb}')
    await pg.screenshot(path=os.path.join(d, 'p14-nebbia.png'))
    check(not pg.errs and not pg.cons, f'nebbia senza errori: {pg.errs[:3]} {pg.cons[:3]}')
    await ctx.close()
