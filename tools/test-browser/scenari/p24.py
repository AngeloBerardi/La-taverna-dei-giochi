# Passo 24: le stagioni sulla mappa (?ven=mondo2): icona nella barra, tinta del terreno, neve e laghi gelati.
import os, tempfile

async def _avvia(b, srv, url):
    ctx = await new_context(b, srv.port); pg = await page(ctx, url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' else None)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(1,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val',opz:{mondo:'vasto',nebbia:false}});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(1500)
    return ctx, pg

_SALTA = "(g=>{const s=Ven.V.s;s.t=(g-1)*1440+8*60;render()})(%d)"
_COL = "(()=>{const a=[];VenMappa.K.scene.traverse(o=>{if(o.userData&&o.userData.terreno&&o.userData.base)a.push(o)});if(!a.length)return null;const R=[],B=[];for(const m of a){const c=m.geometry.attributes.color.array,k=m.userData.base;for(let i=0;i<c.length;i+=3){if(k[i]>.05)R.push(c[i]/k[i]);if(k[i+2]>.05)B.push(c[i+2]/k[i+2])}}const md=x=>x.sort((p,q)=>p-q)[x.length>>1];return[md(R),0,md(B)]})()"  # rapporto mediano tinta/colore base: i tasselli diversi e la neve contano poco

async def sc_p24_stagioni_mappa(b, srv):
    """Giorno forzato in estate e in inverno: nome della stagione nella barra, tinta cambia, infobox col giorno dell'anno."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia(b, srv, srv.url)
    check(await pg.evaluate("!document.querySelector('.vn-stag')"), 'senza interruttore niente stagione nella barra')
    await ctx.close()
    ctx, pg = await _avvia(b, srv, srv.url + '?ven=mondo2')
    a = await pg.evaluate("Ven.V.s.anno")
    check(a is not None, f'mondo nuovo con anno: {a}')
    await pg.evaluate(_SALTA % (a + 1 + 28 + 3)); await pg.wait_for_timeout(1500)
    est = await pg.evaluate("(document.querySelector('.vn-stag')||{}).title")
    await pg.wait_for_function("VenMappa.K.stagK==='est'", timeout=15000); await pg.evaluate('VenMappa.K.stagSync()'); await pg.wait_for_timeout(300)
    ce = await pg.evaluate(_COL)
    await pg.screenshot(path=os.path.join(d, 'p24-estate.png'))
    await pg.evaluate(_SALTA % (a + 1 + 3 * 28 + 3)); await pg.wait_for_timeout(1500)
    inv = await pg.evaluate("(document.querySelector('.vn-stag')||{}).title")
    await pg.wait_for_function("VenMappa.K.stagK==='inv'", timeout=15000); await pg.evaluate('VenMappa.K.stagSync()'); await pg.wait_for_timeout(300)
    ci = await pg.evaluate(_COL)
    await pg.click('.vn-stag'); await pg.wait_for_timeout(300)
    info = await pg.evaluate("(document.querySelector('.vn-rqi')||{}).textContent")
    h = await pg.evaluate("document.querySelector('.vn-stag').getBoundingClientRect().height")
    await pg.screenshot(path=os.path.join(d, 'p24-inverno.png'))
    check(est and 'estate' in est and inv and 'inverno' in inv, f'nome della stagione nella barra: {est} / {inv}')
    check(ce and ci and abs(ce[0] - ci[0]) + abs(ce[2] - ci[2]) > 0.1, f'tinta del terreno diversa: {ce} / {ci}')
    check(info and 'anno' in info and 'primavera' in info, f'infobox: {info}')
    check(h >= 44, f'bersaglio stagione {h}px')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()
