# Passo 08: HUD del mondo, numeri con un nome, mappa sempre in vista.
import os, tempfile

async def _avvia(b, srv, w, h):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.set_viewport_size({'width': w, 'height': h})
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(5,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()"); await pg.wait_for_timeout(1000)
    return ctx, pg

async def sc_p08_hud_mondo(b, srv):
    """Ventura: cinque riquadri con etichetta, foglio al 58%, compagnia visibile, etichette nei bordi, un solo ottone, bersagli 44 px."""
    for (w, h) in ((390, 844), (360, 640)):
        ctx, pg = await _avvia(b, srv, w, h)
        tag = f'{w}x{h}'
        r = await pg.evaluate("""[...document.querySelectorAll('.vn-rq')].map(e=>{const s=e.querySelector('small'),r=s.getBoundingClientRect();return{t:s.textContent,v:r.width>0&&r.height>0}})""")
        check(len(r) == 5 and all(x['v'] and x['t'] for x in r), f'{tag}: cinque riquadri con etichetta visibile {r}')
        alto = await pg.evaluate("document.querySelector('.vn-alto').getBoundingClientRect().height")
        check(alto <= 110, f'{tag}: barra alta compatta ({alto:.0f}px)')
        # bersagli
        piccoli = await pg.evaluate("""[...document.querySelectorAll('.vn button, .vn [data-a]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<43.5||r.height<43.5)}).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))""")
        check(not piccoli, f'{tag}: bersagli >= 44 px {piccoli}')
        # infobox
        await pg.click('.vn-rq'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("!!document.querySelector('.vn-rqi')"), f'{tag}: il tocco su un riquadro apre il dettaglio')
        await pg.click('.vn-rq'); await pg.wait_for_timeout(100)
        # foglio
        await pg.click('[data-a=ven][data-v="pan:compagnia"]'); await pg.wait_for_timeout(1500)
        d = await pg.evaluate("""(()=>{const p=document.querySelector('.vn-pan').getBoundingClientRect(),H=innerHeight,K=VenMappa.K,A=VenArte,t=VEN.TU(Ven.V.s),
          q=A.aSchermo(K.cam,K.P[0]?K.P[0].x:t.x,1,K.P[0]?K.P[0].y:t.y);return{r:p.height/H,y:q.y,top:p.top,x:q.x,W:innerWidth}})()""")
        check(d['r'] <= .585, f'{tag}: foglio <= 58% ({d["r"]:.2f})')
        check(96 <= d['y'] <= d['top'] and 0 <= d['x'] <= d['W'], f'{tag}: la compagnia sta nella parte visibile {d}')
        if w == 390:
            await pg.screenshot(path=os.path.join(os.environ.get('SCHERMATE_DIR', tempfile.gettempdir()), 'ventura-hud.png'))
        # ottoni
        n = await pg.evaluate("[...document.querySelectorAll('.vn .b.gold, .vn .gold')].filter(e=>e.getBoundingClientRect().width>0).length")
        check(n <= 1, f'{tag}: ottoni visibili <= 1 ({n})')
        await pg.click('.vn-pan [data-v=chiudi]'); await pg.wait_for_timeout(300)
        # etichette: oltre il bordo non escono
        await pg.evaluate("VenMappa.K.segue=false;VenMappa.K.fuoco.x=2;VenMappa.K.fuoco.z=2;VenMappa.K.alt=16"); await pg.wait_for_timeout(1200)
        f = await pg.evaluate("[...document.querySelectorAll('.vn-etc > div')].filter(e=>{const r=e.getBoundingClientRect();return r.left<-0.5||r.right>innerWidth+0.5}).length")
        check(f == 0, f'{tag}: nessuna etichetta fuori dallo schermo ({f})')
        check(not pg.errs, f'{tag}: nessun errore di pagina: {pg.errs[:3]}'); await ctx.close()
