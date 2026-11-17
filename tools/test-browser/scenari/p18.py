# Passo 18: il menu dell'Avventura con la Compagnia di ventura in primo piano e il foglio «Nuova campagna».
import os, tempfile

async def _pagina(b, srv, url):
    ctx = await new_context(b, srv.port); pg = await page(ctx, url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(500)
    return ctx, pg

async def sc_p18_menu_nuova_campagna(b, srv):
    """Senza salvataggi l'insegna è il primo elemento; Leggenda salva s.opz; Su misura apre le leve; con ?ven=mondo2 il regno non si chiede."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _pagina(b, srv, srv.url)
    primo = await pg.evaluate("(()=>{const bx=document.querySelector('.av');const e=[...bx.children].find(x=>x.tagName!=='H2');return e.className})()")
    check('av-ins' in primo, f'l\'insegna della Compagnia è il primo elemento sotto la testata: {primo}')
    h = await pg.evaluate("Math.round(document.querySelector('.av-ins').getBoundingClientRect().height)")
    check(h == 220, f'insegna alta 220 px: {h}')
    check(await pg.locator('.av-ins2').count() == 1 and await pg.locator('.av-tab button').count() == 3, 'insegna piccola e tre schede')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(d, 'p18-pagina.png'))
    await pg.click('[data-a=ven][data-v=foglio]'); await pg.wait_for_selector('.av-fo', timeout=5000)
    check(await pg.locator('.av-dc').count() == 4, 'quattro carte di difficoltà')
    r = await pg.evaluate("(()=>{const f=document.querySelector('.av-fo').getBoundingClientRect();return f.height/innerHeight})()")
    check(r <= 0.585, f'foglio al massimo 58%: {r:.2f}')
    check(await pg.locator('.av-leve').count() == 0, 'le leve restano chiuse finché non scegli «Su misura»')
    await pg.click('[data-v="diff:misura"]'); await pg.wait_for_selector('.av-leve', timeout=3000)
    check(await pg.locator('.av-leve .av-c').count() >= 20, 'Su misura apre le leve')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(d, 'p18-foglio.png'))
    await pg.click('[data-v="diff:leggenda"]')
    await pg.click('[data-a=ven][data-v="regno:sel"]')
    await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("Ven.V.s", timeout=30000)
    check(await pg.evaluate("Ven.V.s.opz&&Ven.V.s.opz.diff") == 'leggenda' and await pg.evaluate("Ven.V.s.opz.fer") == 'ferro', 'Leggenda: s.opz.diff è leggenda')
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}')
    await ctx.close()
    ctx, pg = await _pagina(b, srv, srv.url + '?ven=mondo2')
    await pg.click('[data-a=ven][data-v=foglio]'); await pg.wait_for_selector('.av-fo', timeout=5000)
    check(await pg.locator('.vn-regno').count() == 0, 'con mondo2 il regno non si sceglie')
    await pg.click('[data-a=ven][data-v=nuova]'); await pg.wait_for_function("Ven.V.s", timeout=30000)
    check(await pg.evaluate("Ven.V.s.geo") == 2, 'Getta i dadi entra nel mondo nuovo senza chiedere il regno')
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}')
    await ctx.close()

async def sc_p18_stanza_riepilogo(b, srv):
    """In stanza a 2 la difficoltà la sceglie l'oste; l'ospite vede il riepilogo."""
    sh = Shared()
    ctxA, A = await telefono_rt(b, srv, sh, 'Ada', 41)
    await A.wait_for_function("R.mode==='rt'&&R.members.length>0", timeout=30000)
    code = await A.evaluate("(async()=>{const c=await createRoom();await joinRoom(c);setRoomUrl(c);return c})()")
    ctxB, B = await telefono_rt(b, srv, sh, 'Bruno', 42, '?room=' + code + '&net=rt')
    await B.wait_for_function(f"R.mode==='rt'&&R.code==={code!r}&&R.members.length>=2", timeout=30000)
    await A.wait_for_function("R.members.length>=2", timeout=15000)
    await A.evaluate("(async()=>{Ven.act('diff:leggenda');VenStanza.X.seme0=7;Ven.V.regno='val';await startGame('ventura')})()")
    for pg in (A, B): await pg.wait_for_function("G&&G.g==='ventura'&&ui.ven&&Ven.V.s&&VenArte.A.pronta", timeout=40000)
    await B.wait_for_selector('.vn-riep', timeout=10000)
    tx = await B.inner_text('.vn-riep')
    check('Leggenda' in tx, f'l\'ospite vede il riepilogo della difficoltà: {tx[:60]}')
    check(await A.locator('.vn-riep').count() == 0, 'l\'oste non vede il riepilogo')
