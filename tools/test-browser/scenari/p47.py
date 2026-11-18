# Passo 47: il Pronto per posto in compagnia (vista): bottone «Pronto n/m», «Parti comunque» solo al posto 0, un solo ottone, bersagli da 44 px.
import os, tempfile

_SCHEDA = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40}),b:T(5,{fer_f2:70,fer_t2:30,fer_c3:50}),capi:[0,1,2].map(i=>({nome:'Capitano '+i,pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true})),faza:'tu',fazb:'fer',reparti:true,ondate:true,max:110}})()"""

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


_STUB = """(seat)=>{VenStanza.on=()=>!/cfgH/.test((new Error().stack||'').split(String.fromCharCode(10))[2]||'');VenStanza.sync=()=>{};VenStanza.giro=()=>{};VenStanza.seat=()=>seat;
  VenStanza.manda=a=>{const s=VenCampo.K.s;if(a.t==='b-pronto')return VCAM.pronto(s,'a',seat,a.o&&a.o.forza);return{}}}"""
_BT = "[...document.querySelectorAll('.vt-bb button,.vt-cs button')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return[e.textContent.trim(),Math.round(r.width),Math.round(r.height)]})"

async def sc_p47_pronto_per_posto(b, srv):
    """Tre capitani, il posto 1 preme Pronto: «Pronto 1/3» spento e un solo ottone; il posto 0 vede «Parti comunque»; a 360x640 i bersagli sono da 44 px."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia(b, srv, srv.url + '?ven=grandi')
    await pg.set_viewport_size({'width': 360, 'height': 640})
    await pg.evaluate("(()=>{(%s)(1);Ven.V.modo='campo';VenCampo.apri(%s);render()})()" % (_STUB, _SCHEDA))
    await pg.wait_for_timeout(2500)
    check(await pg.evaluate("VenCampo.tavolo(VenCampo.K.s)&&VenCampo.K.s.capi.length===3"), 'tavolo acceso con tre capitani')


    t0 = await pg.evaluate("document.querySelector('.vt-bb .gold').textContent.trim()")
    check(t0 == 'Pronto', f'prima di premere il bottone dice solo «Pronto»: {t0}')
    await pg.click('.vt-bb .gold'); await pg.wait_for_timeout(400)
    st = await pg.evaluate("({t:document.querySelector('.vt-bb .gold').textContent.trim(),dis:document.querySelector('.vt-bb .gold').disabled,ott:[...document.querySelectorAll('.gold')].filter(e=>e.offsetParent).length,pr:JSON.stringify(VCAM.pronti(VenCampo.K.s)),via:VenCampo.tavolo(VenCampo.K.s),forza:[...document.querySelectorAll('.vt-bb button')].some(e=>e.textContent.includes('Parti comunque'))})")
    check(st['t'] == 'Pronto 1/3' and st['dis'] and st['ott'] == 1, f'dopo il mio Pronto: «Pronto 1/3» spento, un solo ottone: {st}')
    check(st['via'] and not st['forza'], f'il tavolo resta aperto e il posto 1 non vede «Parti comunque»: {st}')
    await pg.screenshot(path=os.path.join(d, 'p47-pronto.png'))
    # il posto 0, dopo il suo Pronto, vede «Parti comunque»
    await pg.evaluate("(()=>{(%s)(0);const s=VenCampo.K.s;VCAM.pronto(s,'a',0);render()})()" % _STUB)
    await pg.wait_for_timeout(300)
    f = await pg.evaluate("[...document.querySelectorAll('.vt-bb button')].map(e=>e.textContent.trim())")
    check('Parti comunque' in f and 'Pronto 2/3' in f, f'il posto 0 vede «Parti comunque»: {f}')
    for nome, w, h in await pg.evaluate(_BT):
        check(w >= 44 and h >= 44, f'bersaglio da 44 px: {nome} {w}x{h}')
    await pg.click('.vt-bb >> text=Parti comunque'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("VenCampo.K.s.pronto.a===true"), '«Parti comunque»: tutti pronti')
    check(not pg.errs and not pg.cons, f'nessun errore: {pg.errs[:3]} {pg.cons[:3]}')
    await ctx.close()
