# Correzione: dalla schermata del castello nemico si assedia e, all'assalto, si sceglie (aspetta, ariete, combatti) con tocchi veri a 390 px.
import os, tempfile

async def _castello(b, srv, touch=False):
    ctx = await new_context(b, srv.port, touch=touch); pg = await page(ctx, srv.url)
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' else None)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("""(()=>{const s=Ven.V.s,tu=VEN.TU(s),l=s.l.find(l=>l.tipo==='castello'&&l.faz!=='tu'&&VEN.MURA[l.tipo]);s.rel[l.faz]=-60;
      for(const p of s.p)if(p.dentro===l.id)p.dentro=-1;l.g=[{t:l.faz+'_f2',n:10,f:0,xp:0},{t:l.faz+'_t2',n:8,f:0,xp:0}];
      tu.tr=[{t:'val_f2',n:30,f:0,xp:0},{t:'val_t2',n:10,f:0,xp:0}];tu.oro=400;tu.x=l.x+.4;tu.y=l.y;tu.ord=null;tu.via=[];s.dentro=-1;s.davanti=l.id;Ven.act('pan:luogo')})()""")
    return ctx, pg

# passano le ore (come fa il motore) fino a che si presenta l'assalto, poi si apre la schermata
_ORE = "(()=>{const s=Ven.V.s;let g=0;while(!s.incontro&&g++<400)VEN.passo(s,30);Ven.act('pan:incontro')})()"

_SCELTE = """(()=>{const p=document.querySelector('.vn-pan'),pc=p.querySelector('.vn-pc');
 return [...p.querySelectorAll('button[data-v^="scegli:"]')].map(b=>{const r=b.getBoundingClientRect();
  return {v:b.dataset.v,h:Math.round(r.height),fuori:r.bottom>innerHeight+1||r.top<0}}).concat([{v:'scorre',
   ok:p.getBoundingClientRect().bottom<=innerHeight+1&&getComputedStyle(pc).overflowY!=='visible'&&pc.getBoundingClientRect().bottom<=innerHeight+1}])})()"""

async def sc_fix_assedio_schermata(b, srv):
    """Cellulare 390 px, tocchi veri: dal castello nemico «Assedia»; all'assalto Aspetta, Costruisci, Combatti, Risolvi e Togli si raggiungono (la schermata scorre) e arrivano al motore; dopo Aspetta/Costruisci il tempo riprende a scorrere."""
    ctx, pg = await _castello(b, srv, touch=True)
    await pg.tap('[data-v="fai:assedia"]'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("Ven.V.pan==='attesa'&&!!Ven.V.s.assedio"), '«Assedia»: parte l\'assedio e si aspetta')
    await pg.evaluate(_ORE); await pg.wait_for_timeout(400)
    st = await pg.evaluate(_SCELTE); bt = [x for x in st if x['v'] != 'scorre']
    check(len(bt) == 5 and all(x['h'] >= 44 for x in bt), f'cinque scelte, tutte alte almeno 44 px: {bt}')
    check(all(not x['fuori'] for x in bt) or st[-1]['ok'], f'le scelte fuori dallo schermo si raggiungono scorrendo il pannello: {st}')
    ult = await pg.evaluate("(()=>{const pc=document.querySelector('.vn-pc'),b=document.querySelector('[data-v=\"scegli:togli\"]');pc.scrollTop=pc.scrollHeight;const r=b.getBoundingClientRect(),e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!e&&(e===b||b.contains(e))&&r.bottom<=innerHeight+1})()")
    check(ult, 'l\'ultima scelta, portata in vista scorrendo il pannello (non la pagina), non è coperta da altro')
    # costruisci l'ariete: il comando arriva al motore e il tempo riprende (schermata di attesa)
    await pg.tap('[data-v="scegli:ariete"]'); await pg.wait_for_timeout(300)
    st = await pg.evaluate("({pan:Ven.V.pan,ar:Ven.V.s.assedio.ariete,oro:VEN.TU(Ven.V.s).oro,inc:Ven.V.s.incontro})")
    check(st['pan'] == 'attesa' and st['ar'] and st['oro'] == 250 and st['inc'] is None, f'ariete costruito e si aspetta (non la schermata del luogo, ferma): {st}')
    t0 = await pg.evaluate("Ven.V.s.t"); await pg.wait_for_timeout(1500)
    check(await pg.evaluate("Ven.V.s.t") > t0, 'dopo «Costruisci» il tempo scorre da solo')
    # di nuovo all'assalto: «Aspetta» (breccia) porta alla stessa attesa
    await pg.evaluate(_ORE); await pg.wait_for_timeout(300)
    await pg.tap('[data-v="scegli:attendi"]'); await pg.wait_for_timeout(300)
    st = await pg.evaluate("({pan:Ven.V.pan,p:Ven.V.s.assedio.pronto,t:Ven.V.s.t})")
    check(st['pan'] == 'attesa' and st['p'] > st['t'] + 24 * 60, f'«Aspetta»: attesa fino alla breccia: {st}')
    t0 = await pg.evaluate("Ven.V.s.t"); await pg.wait_for_timeout(1500)
    check(await pg.evaluate("Ven.V.s.t") > t0, 'dopo «Aspetta» il tempo scorre da solo')
    # all'assalto: «Combatti» (in fondo alla schermata) apre la battaglia con le scale
    await pg.evaluate(_ORE); await pg.wait_for_timeout(300)
    await pg.tap('[data-v="scegli:attacca"]')
    await pg.wait_for_function("VenCampo.K.s&&VenCampo.K.s.tipo==='assedio'", timeout=20000)
    check(True, '«Combatti»: la battaglia d\'assedio si apre')
    await pg.screenshot(path=os.path.join(os.environ.get('SCHERMATE_DIR', tempfile.gettempdir()), 'assedio-schermata-390.png'))
    check(not pg.errs and not pg.cons, f'nessun errore: {pg.errs[:2]} {pg.cons[:2]}')
    await ctx.close()
