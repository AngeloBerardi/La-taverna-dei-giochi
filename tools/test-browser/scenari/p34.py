# Passo 34: il consiglio di guerra è acceso per tutti. Un signore di rango 4 su un campo con un'altura porta i tiratori in cima.
import os, tempfile

_SCHEDA34 = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:9,a:T(0,{val_f2:30,val_t2:10,val_c3:12}),b:T(5,{fer_f2:30,fer_t2:14,fer_c3:8}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',rango:{a:1,b:4},
  zone:[{k:'altura',x:30,y:24,rx:11,ry:8,h:1}],max:140}})()"""
_SU34 = "(()=>{const s=VenCampo.K.s;return s.u.filter(u=>u.l==='b'&&u.c==='t'&&!u.cap&&u.st==='vivo'&&s.zone.some(z=>z.k==='altura'&&((u.x-z.x)/z.rx)**2+((u.y-z.y)/z.ry)**2<=1)).length})()"

async def sc_p34_tiratori_sull_altura(b, srv):
    """Senza ?ven= (consiglio acceso di serie): rango 4 del nemico visibile, i suoi tiratori salgono sull'altura entro 20 s."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' else None)
    check(await pg.evaluate("VDAT.ACCESO.consiglio===true"), 'consiglio acceso di serie')
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(3,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(800)
    await pg.evaluate("(()=>{Ven.V.modo='campo';VenCampo.apri(%s);VenCampo.K.pausa=false;render()})()" % _SCHEDA34)
    await pg.wait_for_function("VenCampo.K.s&&VenCampo.K.s.u", timeout=20000)
    r = await pg.evaluate("({rango:VenCampo.K.s.rango&&VenCampo.K.s.rango.b,su:%s})" % _SU34)
    check(r['rango'] == 4, f'il nemico ha rango 4: {r["rango"]}')
    check(r['su'] > 0, f'il rango 4 schiera i tiratori sull\'altura: {r["su"]}')
    n0 = r['su']
    await pg.wait_for_timeout(20000)
    r = await pg.evaluate("({su:%s,fine:!!VenCampo.K.s.fine,t:VenCampo.K.s.t})" % _SU34)
    check(r['su'] >= n0 // 2 or r['fine'], f'dopo 20 s i tiratori nemici tengono l\'altura: {r}')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(d, 'p34-altura.png'))
    check(not pg.errs and not pg.cons, f'nessun errore: {pg.errs[:3]} {pg.cons[:3]}')
    await ctx.close()
