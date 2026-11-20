# Passo 35: la sfida al capo. Contro un capobanda: bottone «Sfida» nell'incontro (con prezzo e conto), duello nell'arena, vittoria, resa della banda.
FORZA_CAPO35 = """(()=>{const s=Ven.V.s,p=s.p.find(x=>x.k==='pre'),c=VEN.capi(s)[0];c.liv=9;c.ab.prodezza=3;Object.assign(c.eq,{arma:'spadone',armatura:'maglia',scudo:null,elmo:'bacinetto'});
 p.dentro=-1;s.incontro={tipo:'nemico',pid:[p.id],all:[],da:'loro'};Ven.V.pan='incontro';render()})()"""

async def _avvia35(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url + '?ven=consiglio')
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000)
    await pg.wait_for_function("VenMappa.K.scene&&document.getElementById('vn-ora')&&document.getElementById('vn-ora').textContent", timeout=30000)
    await pg.evaluate(FORZA_CAPO35)
    await pg.wait_for_selector('.vn-inc .vn-stend', timeout=5000)
    return ctx, pg

async def sc_p35_duello(b, srv):
    """Ventura: incontro con un capobanda -> Sfida -> il duello si apre nell'arena (uno contro uno)."""
    ctx, pg = await _avvia35(b, srv)
    sf = pg.locator('[data-v="scegli:sfida"]')
    check(await sf.count() == 1, 'il bottone «Sfida» c\'è, uno solo')
    check(await pg.locator('.vn-inc .b.gold').count() == 1, 'un solo ottone anche con la sfida')
    await sf.click(); await pg.wait_for_timeout(200)
    check(await pg.evaluate("Ven.V.s.incontro.sfida") == 'duello', 'la sfida è lanciata')
    check(await pg.locator('[data-v="scegli:sfida"]').count() == 0, 'il bottone sparisce: una sola sfida per incontro')
    await pg.locator('[data-v="scegli:attacca"]').click()
    await pg.wait_for_function("Ven.V.modo==='campo'&&VenCampo.K.s&&VenCampo.K.s.tipo==='arena'", timeout=15000)
    check(await pg.evaluate("VenCampo.K.s.u.filter(u=>u.st==='vivo').length") == 2, 'in arena ci sono solo due combattenti')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(os.environ['SCHERMATE_DIR'], 'p35-duello.png'))
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}')
    await ctx.close()

async def sc_p35_resa(b, srv):
    """Ventura: sfida a un capobanda, duello risolto dal motore, vittoria -> la banda si arrende e il capobanda è prigioniero."""
    ctx, pg = await _avvia35(b, srv)
    v0 = await pg.evaluate("Ven.V.s.stat.vinte")
    await pg.locator('[data-v="scegli:sfida"]').click(); await pg.wait_for_timeout(200)
    await pg.locator('[data-v="scegli:auto"]').click()
    await pg.wait_for_selector('.vn-es', timeout=5000)
    st = await pg.evaluate("({inc:Ven.V.s.incontro,vinte:Ven.V.s.stat.vinte,sfida:Ven.V.s.ult.sfida,vince:Ven.V.s.ult.vince,prig:Ven.V.s.prig.map(e=>e.t)})")
    check(st['vince'] == 'a' and st['sfida'] == 'resa', f'duello vinto e banda in resa: {st}')
    check(st['inc'] is None and st['vinte'] == v0 + 1, 'nessuna battaglia, una vittoria in più')
    check(any(t.startswith('cb_') for t in st['prig']), 'il capobanda è prigioniero')
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}')
    await ctx.close()
