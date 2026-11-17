# Passo 19: il tavolo dello schieramento (vista, con i reparti): settori, gettoni, carte, foglio ondate, Pronto.
import os, tempfile

_SCHEDA = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40}),b:T(5,{fer_f2:70,fer_t2:30,fer_c3:50}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',reparti:true,ondate:true,max:110}})()"""

async def _avvia(b, srv, url):
    ctx = await new_context(b, srv.port); pg = await page(ctx, url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' else None)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(3,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(800)
    return ctx, pg

async def _tocca_campo(pg, x, z):
    """Tocco vero sul canvas, nel punto del campo (x, z)."""
    p = await pg.evaluate("(()=>{const K=VenCampo.K,r=VenArte.cv.getBoundingClientRect(),c=VenArte.aSchermo(K.cam,%f,0,%f);return[r.left+c.x,r.top+c.y]})()" % (x, z))
    await pg.mouse.click(p[0], p[1])

_BOX = "[...document.querySelectorAll(%s)].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return Math.min(r.width,r.height)}).filter(v=>v>0)"

async def sc_p19_tavolo_schieramento(b, srv):
    """Con i reparti: tavolo a t===0; dividi e schiera; ondata di cavalieri dal fianco destro «al mio segnale»; Pronto; l'ondata entra dal bordo destro."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    # senza i reparti il tavolo non c'è: la battaglia è quella di sempre
    ctx, pg = await _avvia(b, srv, srv.url)
    await pg.evaluate("(()=>{const sc=%s;sc.reparti=false;sc.ondate=false;Ven.V.modo='campo';VenCampo.apri(sc);render()})()" % _SCHEDA)
    await pg.wait_for_timeout(800)
    check(await pg.evaluate("!document.querySelector('.vt-c')&&!document.querySelector('.vt-g')&&!!document.querySelector('.vn-via')"), 'senza i reparti niente tavolo: il «Via» di sempre')
    await ctx.close()
    ctx, pg = await _avvia(b, srv, srv.url + '?ven=grandi')
    await pg.evaluate("(()=>{Ven.V.modo='campo';VenCampo.apri(%s);render()})()" % _SCHEDA)
    await pg.wait_for_timeout(2500)
    st = await pg.evaluate("({t:VenCampo.tavolo(VenCampo.K.s),carte:document.querySelectorAll('.vt-c').length,g:document.querySelectorAll('.vt-g').length,poly:document.querySelectorAll('.vt-sv polygon').length,cnt:(document.querySelector('.vt-cnt')||{}).textContent,alt:VenCampo.K.alt})")
    check(st['t'] and st['carte'] == 3 and st['poly'] >= 4, f'tavolo acceso con tre carte e i settori disegnati: {st}')
    check(st['g'] >= 3 and st['cnt'] and 'In campo' in st['cnt'] and 'Ondate 0' in st['cnt'], f'gettoni sul campo e conto in alto: {st}')
    # il campo intero sta nello schermo
    fit = await pg.evaluate("(()=>{const K=VenCampo.K,s=K.s,r=VenArte.cv.getBoundingClientRect(),c=[[0,0],[s.W,0],[0,s.H],[s.W,s.H]].map(q=>VenArte.aSchermo(K.cam,q[0],0,q[1]));return{x0:Math.min(...c.map(p=>p.x)),x1:Math.max(...c.map(p=>p.x)),w:r.width,y0:Math.min(...c.map(p=>p.y)),y1:Math.max(...c.map(p=>p.y)),h:r.height}})()")
    check(fit['x0'] >= -2 and fit['x1'] <= fit['w'] + 2 and fit['y0'] >= 0 and fit['y1'] <= fit['h'], f'il campo intero è sullo schermo: {fit}')
    nemici = await pg.evaluate("VenCampo.K.s.primo")
    check(nemici == 'a' and await pg.evaluate("document.querySelectorAll('.vt-g.om').length>=3"), 'se ti schieri per primo i nemici sono ombre fino al «Pronto»')
    await pg.screenshot(path=os.path.join(d, 'p19-tavolo.png'))
    # dividi i fanti e metti la metà di sinistra nel settore sinistro
    await pg.click('[data-v="vdiv:0"]'); await pg.wait_for_timeout(300)
    n = await pg.evaluate("({r:VCAM.reparti(VenCampo.K.s,'a').map(x=>x.r+x.c+x.n).join(),carte:document.querySelectorAll('.vt-c').length})")
    check(n['carte'] == 4 and n['r'].startswith('0f25'), f'dividi: quattro reparti, i fanti 25+25: {n}')
    await pg.click('[data-v="vrep:0"]'); await pg.wait_for_timeout(200)
    W, H = await pg.evaluate("[VenCampo.K.s.W,VenCampo.K.s.H]")
    await _tocca_campo(pg, 8, H - 15); await pg.wait_for_timeout(400)
    x0 = await pg.evaluate("(()=>{const u=VenCampo.K.s.u.filter(u=>u.l==='a'&&!u.cap&&u.r===0);return u.reduce((a,b)=>a+b.x,0)/u.length})()")
    check(x0 < W / 3, f'il reparto toccato sta nel settore sinistro: x={x0:.1f}')
    # fuori settore: errore, il reparto resta dov'è
    await pg.click('[data-v="vrep:0"]'); await _tocca_campo(pg, 30, 20); await pg.wait_for_timeout(300)
    x1 = await pg.evaluate("(()=>{const u=VenCampo.K.s.u.filter(u=>u.l==='a'&&!u.cap&&u.r===0);return u.reduce((a,b)=>a+b.x,0)/u.length})()")
    check(abs(x1 - x0) < 0.5, 'fuori dai settori il reparto non si muove')
    # ondata di cavalieri dal fianco destro, al mio segnale
    await pg.click('[data-v="vond:apri"]'); await pg.wait_for_timeout(300)
    for _ in range(2):
        await pg.click('[data-v="vond:1:t:val_c3:+"]'); await pg.wait_for_timeout(120)
    await pg.click('[data-v="vond:1:ing:fdx"]'); await pg.wait_for_timeout(150)
    await pg.click('[data-v="vond:1:q:comando:0"]'); await pg.wait_for_timeout(150)
    o = await pg.evaluate("JSON.stringify(VenCampo.K.s.ond.a.map(w=>({ing:w.ing,k:w.quando.k,c:w.tr.filter(x=>x.t==='val_c3').reduce((a,x)=>a+x.n,0)})))")
    check('"ing":"fdx"' in o and '"c":10' in o and '"k":"comando"' in o, f'ondata preparata: {o}')
    check(await pg.evaluate("document.querySelector('.vt-fo .vt-ct').textContent.includes('Ondate 10')"), 'il conto del foglio dice Ondate 10')
    await pg.screenshot(path=os.path.join(d, 'p19-ondate.png'))
    # a 360x640 tutti i bersagli sono >= 44 px e un solo ottone è visibile
    await pg.set_viewport_size({'width': 360, 'height': 640}); await pg.wait_for_timeout(700)
    m = await pg.evaluate(_BOX % "'.vt-fo button'")
    check(m and min(m) >= 44, f'foglio ondate: bersagli >= 44 px ({min(m) if m else None})')
    await pg.click('.vt-x'); await pg.wait_for_timeout(300)
    m = await pg.evaluate(_BOX % "'.vt-bs button, .vt-bs .b'")
    piccoli = await pg.evaluate("[...document.querySelectorAll('.vt-bs button, .vt-bs .b')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return[e.className,e.textContent.trim(),Math.round(r.width),Math.round(r.height)]}).filter(v=>v[2]<44||v[3]<44)")
    check(m and min(m) >= 44, f'carte e comandi: bersagli >= 44 px ({piccoli})')
    check(await pg.evaluate("[...document.querySelectorAll('.gold')].filter(e=>e.offsetParent).length") == 1, 'un solo ottone visibile (Pronto)')
    check(await pg.evaluate("[...document.querySelectorAll('[data-v=cpausa]')].filter(e=>e.offsetParent).length") == 0, 'col tavolo niente bottone Pausa/Via')
    await pg.set_viewport_size({'width': 390, 'height': 844}); await pg.wait_for_timeout(500)
    # Pronto: i nemici si mostrano, dopo un secondo si parte
    await pg.click('[data-v="vpronto"]'); await pg.wait_for_timeout(2600)
    st = await pg.evaluate("({p:VenCampo.K.s.pronto.a,pausa:VenCampo.K.pausa,tav:VenCampo.tavolo(VenCampo.K.s),t:VenCampo.K.s.t})")
    check(st['p'] and not st['pausa'] and not st['tav'] and st['t'] > 0, f'dopo Pronto la battaglia parte: {st}')
    await pg.wait_for_timeout(8000)
    check(await pg.evaluate("!!document.querySelector('[data-v=\"vondata:1\"]')"), 'in battaglia compare il bottone «Ondata 1 · 10»')
    await pg.click('[data-v="vondata:1"]'); await pg.wait_for_timeout(700)
    r = await pg.evaluate("(()=>{const s=VenCampo.K.s;return{lim:s.W-12,n:s.u.filter(u=>u.l==='a'&&u.c==='c'&&!u.cap&&u.x>s.W-12).length,fatta:s.ond.a[0].fatta}})()")
    check(r['fatta'] and r['n'] >= 1, f'i cavalieri dell\'ondata compaiono vicino al bordo destro: {r}')
    check(not pg.errs and not pg.cons, f'nessun errore: {pg.errs[:3]} {pg.cons[:3]}')
    await ctx.close()
