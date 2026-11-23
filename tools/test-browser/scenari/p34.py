# Passo 34: il consiglio di guerra è acceso per tutti. Partita guidata: incontro con un signore di rango >= 3 (rango e scelte del consiglio
# nella scheda dell'incontro, prima foto), poi «Combatti» su un campo con un'altura: dopo il «Via» i suoi tiratori salgono e dopo 20 s la tengono (seconda foto).
import os, tempfile

# un signore vero della partita, con l'esperienza che lo porta al rango 3 o più e un reparto di tiratori; l'incontro lo apre lui
_INCONTRO34 = """(()=>{const s=Ven.V.s,p=s.p.find(x=>x.k==='sig'&&s.sig[x.sig]&&!s.sig[x.sig].re),sg=s.sig[p.sig];
  sg.esp=Math.max(sg.esp|0,VDAT.RANGO.PASSO_ESP);const pre=p.tr[0].t.split('_')[0];
  p.tr=[{t:pre+'_f2',n:24,f:0,xp:0},{t:pre+'_t2',n:12,f:0,xp:0},{t:pre+'_c3',n:6,f:0,xp:0}];p.dentro=-1;s.dentro=-1;s.davanti=-1;
  s.incontro={tipo:'nemico',pid:[p.id],all:[],da:'loro'};Ven.V.pan='incontro';render();return{r:VEN.rango(s,p).r,nome:VEN.rango(s,p).nome}})()"""
# l'altura nella metà del nemico, davanti alla sua linea: i tiratori schierati di base (dietro i fanti) non ci sono sopra
_ALTURA34 = "VEN.aggancia('scheda',(s,sc)=>{if(s.incontro&&s.incontro.tipo==='nemico')sc.zone=[{k:'altura',x:30,y:28,rx:12,ry:8,h:1}];})"
_SU34 = """(()=>{const s=VenCampo.K.s,z=s.zone.find(z=>z.k==='altura');if(!z)return{su:-1};const T=s.u.filter(u=>u.l==='b'&&u.c==='t'&&!u.cap&&u.st==='vivo');
  const su=T.filter(u=>((u.x-z.x)/z.rx)**2+((u.y-z.y)/z.ry)**2<=1).length;return{su,n:T.length,fine:!!s.fine,t:s.t,rango:s.rango&&s.rango.b}})()"""
# il centro dell'altura proiettato sullo schermo: la foto la deve inquadrare
_VISTA34 = """(()=>{const K=VenCampo.K,z=K.s.zone.find(z=>z.k==='altura'),r=VenArte.cv.getBoundingClientRect(),p=VenArte.aSchermo(K.cam,z.x,0,z.y);
  return{x:p.x,y:p.y,w:r.width,h:r.height,dentro:p.x>0&&p.x<r.width&&p.y>0&&p.y<r.height}})()"""

async def sc_p34_incontro_e_altura(b, srv):
    """Senza ?ven= (consiglio acceso di serie): l'incontro con un signore di rango >= 3 mostra rango e scelte; in campo i suoi tiratori salgono sull'altura e la tengono 20 s."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' and 'AudioContext' not in m.text else None)
    check(await pg.evaluate("VDAT.ACCESO.consiglio===true"), 'consiglio acceso di serie')
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000)
    await pg.wait_for_function("VenMappa.K.scene&&document.getElementById('vn-ora')&&document.getElementById('vn-ora').textContent", timeout=30000)
    # 1. l'incontro: «chi ho davanti?» — rango con il suo nome e le scelte del consiglio
    rg = await pg.evaluate(_INCONTRO34)
    check(rg['r'] >= 3, f'il signore ha rango 3 o più: {rg}')
    await pg.wait_for_selector('.vn-inc .vn-stend', timeout=5000)
    txt = await pg.evaluate("[...document.querySelectorAll('.vn-inc .vn-rg')].map(e=>e.textContent.trim())")
    check(any(rg['nome'] in t for t in txt), f'la scheda dell\'incontro mostra il rango «{rg["nome"]}»: {txt}')
    strat = await pg.evaluate("[...document.querySelectorAll('.vn-inc [data-v^=\"scegli:strat:\"]')].map(e=>e.dataset.v)")
    check(len(strat) >= 5 and 'scegli:strat:alba' in strat and 'scegli:strat:imboscata' in strat, f'le scelte del consiglio ci sono: {strat}')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(d, 'p34-incontro.png'))
    # 2. «Combatti»: il campo dell'incontro, con un'altura nella metà del signore
    await pg.evaluate(_ALTURA34)
    await pg.locator('[data-v="scegli:attacca"]').click()
    await pg.wait_for_function("Ven.V.modo==='campo'&&VenCampo.K.s&&VenCampo.K.s.u", timeout=20000); await pg.wait_for_timeout(800)
    r0 = await pg.evaluate(_SU34)
    check(r0['rango'] == rg['r'], f'in campo il signore ha lo stesso rango: {r0}')
    check(r0['n'] >= 8 and r0['su'] < r0['n'] // 2, f'prima del «Via» i suoi tiratori non stanno sull\'altura: {r0}')
    await pg.click('.vn-via button, [data-v=vpronto]', timeout=5000); await pg.wait_for_timeout(20000)
    r1 = await pg.evaluate(_SU34)
    check(r1['t'] > 0 and not r1['fine'], f'dopo 20 s la battaglia è in corso: {r1}')
    check(r1['su'] > r0['su'] and r1['su'] * 10 >= r1['n'] * 8, f'dopo 20 s almeno 8 tiratori su 10 sono sull\'altura: prima {r0}, ora {r1}')
    v = await pg.evaluate(_VISTA34)
    check(v['dentro'], f'l\'altura è nell\'inquadratura: {v}')
    if os.environ.get('SCHERMATE_DIR'): await pg.screenshot(path=os.path.join(d, 'p34-altura.png'))
    check(not pg.errs and not pg.cons, f'nessun errore: {pg.errs[:3]} {pg.cons[:3]}')
    await ctx.close()
