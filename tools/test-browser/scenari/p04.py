# Passo 04: gli interruttori di prova. Con `?ven=grandi,consiglio,mondo2,eserciti` si accendono in memoria (mai nel salvataggio)
# e il mondo, la mappa e il menu girano senza errori; senza il parametro restano tutti spenti.
async def sc_p04_ven_interruttori(b, srv):
    """Ventura: ?ven= accende gli interruttori nominati, solo in memoria; nessun errore in console."""
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url + '?ven=grandi,consiglio,eserciti,finto')
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' else None)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    ac = await pg.evaluate("JSON.stringify(VDAT.ACCESO)")
    check(ac == '{"grandi":true,"consiglio":true,"mondo2":false,"eserciti":true}', f'accesi solo i nomi dell\'elenco (e quelli sconosciuti ignorati): {ac}')
    check(await pg.locator('.vn-regno').count() == 5, 'il menu mostra i cinque regni')
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_function("VenMappa.K.scene&&document.getElementById('vn-ora')&&document.getElementById('vn-ora').textContent", timeout=30000)
    st = await pg.evaluate("({geo:Ven.V.s.geo===undefined,regni:JSON.stringify(VEN.regni(Ven.V.s)),salv:localStorage.getItem('ven-salv')||''})")
    check(st['geo'] and st['regni'] == '["val","sel","fer","mar","alt"]', f'con questi interruttori il mondo è quello di sempre: {st["regni"]}')
    check('ACCESO' not in st['salv'] and '"grandi"' not in st['salv'], 'gli interruttori non finiscono nel salvataggio')
    await pg.wait_for_timeout(1500)
    check(not pg.errs and not pg.cons, f'nessun errore di pagina né in console: {pg.errs[:3]} {pg.cons[:3]}')
    await ctx.close()
    # senza il parametro: tutti spenti
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    ac = await pg.evaluate("JSON.stringify(VDAT.ACCESO)")
    check(ac == '{"grandi":false,"consiglio":false,"mondo2":false,"eserciti":false}', f'senza ?ven= tutti spenti: {ac}')
    await ctx.close()
