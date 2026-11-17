# Passo 09: l'incontro faccia a faccia: due stendardi, un solo ottone, nessun riquadro vuoto.
async def sc_p09_incontro(b, srv):
    """Ventura: nell'incontro ci sono due .vn-stend e un solo bottone ottone."""
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000)
    await pg.wait_for_function("VenMappa.K.scene&&document.getElementById('vn-ora')&&document.getElementById('vn-ora').textContent", timeout=30000)
    await pg.evaluate("""(()=>{const s=Ven.V.s,p=s.p.find(x=>x.k==='pre');s.incontro={tipo:'nemico',pid:[p.id],all:[],da:'loro'};Ven.V.pan='incontro';render()})()""")
    await pg.wait_for_selector('.vn-inc .vn-stend', timeout=5000)
    check(await pg.locator('.vn-inc .vn-stend').count() == 2, 'due stendardi')
    check(await pg.locator('.vn-inc .b.gold').count() == 1, 'un solo ottone')
    check(await pg.locator('[data-v="scegli:attacca"]').count() == 1 and await pg.locator('[data-v="scegli:paga"]').count() == 1, 'i selettori di sempre')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(os.environ['SCHERMATE_DIR'], 'p09-incontro.png'))
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}')
    await ctx.close()
