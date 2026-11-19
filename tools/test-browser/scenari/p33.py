# Passo 33: la sorte ti getta nel mondo. Con ?ven=mondo2 «Getta i dadi» non chiede il regno e l'apertura compare una volta sola nel diario.
import os, tempfile

async def sc_p33_apertura(b, srv):
    """Nuova campagna in un mondo nuovo: s.inizio c'è, il diario ha la scena d'apertura una volta sola e l'incarico (se c'è) è nel quaderno."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url + '?ven=mondo2')
    await pg.set_viewport_size({'width': 390, 'height': 844})
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(500)
    await pg.click('[data-a=ven][data-v=foglio]'); await pg.wait_for_selector('.av-fo', timeout=5000)
    check(await pg.locator('.vn-regno').count() == 0, 'il regno non si sceglie')
    await pg.click('[data-a=ven][data-v=nuova]'); await pg.wait_for_function("Ven.V.s&&Ven.V.s.inizio", timeout=30000)
    r = await pg.evaluate("(()=>{const s=Ven.V.s,I=s.inizio;return{geo:s.geo,n:s.log.filter(x=>x.tx===I.testo).length,testo:I.testo,k:I.aggancio.k,inc:I.aggancio.inc,"
                          "q:s.incarichi.length,luogo:s.l[I.lid].nome}})()")
    check(r['geo'] == 2, 'mondo nuovo')
    check(r['n'] == 1, f'l\'apertura compare una volta sola nel diario: {r["n"]}')
    check(r['luogo'] in r['testo'] and '{' not in r['testo'], f'il testo nomina il luogo: {r["testo"][:80]}')
    check((r['inc'] is None and r['k'] == 'torneo') or r['q'] == 1, f'lo spunto è un incarico vero: {r["k"]}')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(d, 'p33-apertura.png'))
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}')
    await ctx.close()
