# Passo 20: collaudo d'insieme dell'interfaccia (menu, mondo, foglio, città, mercato, incontro, battaglia, esito).
import os, tempfile

_CTRL = """(()=>{const v=e=>e.offsetParent!==null||getComputedStyle(e).position==='fixed';
 const bt=[...document.querySelectorAll('button,.b,[data-v],[data-a]')].filter(v).filter(e=>!e.matches('.vn-std'));/* .vn-std: stendardo decorativo della barra (span con classe «b» di colore, non un bottone) */
 return {ott:[...document.querySelectorAll('.gold')].filter(v).length,
  piccoli:bt.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.width<44||r.height<44)}).map(e=>(e.className+'|'+e.textContent.trim()).slice(0,30)).slice(0,6),
  tagliati:[...document.querySelectorAll('button,.b')].filter(v).filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent.trim().slice(0,30)).slice(0,6)}})()"""

_SCHEDA = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40}),b:T(5,{fer_f2:30,fer_t2:10,fer_c3:10}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',max:110}})()"""

# Difetti ancora aperti, fuori dai file del passo 47 (menu e foglio dipendono da 24hw-ventura.js e dalle barre): #170 e #175.
_ATTESI = (' menu: ott', ' menu: piccoli', ' foglio: ott', ' foglio: piccoli')

async def _ctrl(pg, tag, out):
    r = await pg.evaluate(_CTRL)
    for k, m in (('ott', r['ott'] <= 1), ('piccoli', not r['piccoli']), ('tagliati', not r['tagliati'])):
        if not m: out.append(f'{tag}: {k} {r[k]}')

async def sc_p20_collaudo_interfaccia(b, srv):
    """Percorso completo a 390x844 e 360x640; i difetti sono elencati (non fanno fallire), la console sì."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir()); dif = []
    for (w, h) in ((390, 844), (360, 640)):
        t = f'{w}x{h}'
        ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
        await pg.set_viewport_size({'width': w, 'height': h})
        pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' else None)
        shot = (w == 390)
        async def foto(n):
            if shot: await pg.screenshot(path=os.path.join(d, f'p20-{n}.png'))
        await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(500)
        await _ctrl(pg, t + ' menu', dif); await foto('1-menu')
        await pg.click('[data-a=ven][data-v=foglio]'); await pg.wait_for_selector('.av-fo', timeout=5000)
        await _ctrl(pg, t + ' foglio', dif)
        await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
        await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000)
        await pg.wait_for_function("VenMappa.K.scene&&document.getElementById('vn-ora')&&document.getElementById('vn-ora').textContent", timeout=30000)
        await pg.wait_for_timeout(800); await _ctrl(pg, t + ' mondo', dif); await foto('2-mondo')
        await pg.click('[data-a=ven][data-v="pan:compagnia"]'); await pg.wait_for_timeout(1500)
        await _ctrl(pg, t + ' compagnia', dif); await foto('3-compagnia')
        await pg.click('.vn-pan [data-v=chiudi]'); await pg.wait_for_timeout(300)
        await pg.evaluate("""(()=>{const s=Ven.V.s,l=s.l.find(l=>l.tipo==='citta'&&l.faz==='tu')||s.l.find(l=>l.tipo==='citta');s.incontro=null;s.davanti=-1;s.dentro=l.id;l.noto=true;Ven.V.pan='luogo';Ven.V.sub='home';render()})()""")
        await pg.wait_for_selector('.vn-pan .vn-sr', timeout=5000); await _ctrl(pg, t + ' citta', dif); await foto('4-citta')
        await pg.click('[data-v="sub:mercato"]'); await pg.wait_for_selector('.vn-bn', timeout=5000)
        await _ctrl(pg, t + ' mercato', dif); await foto('5-mercato')
        await pg.click('[data-v="fai:compra:grano"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-v="fai:vendi:grano"]'); await pg.wait_for_timeout(200)
        check(await pg.locator('.vn-bn').count() == 10, f'{t}: mercato ancora a dieci righe dopo compra e vendi')
        await pg.evaluate("""(()=>{const s=Ven.V.s,p=s.p.find(x=>x.k==='pre');s.dentro=null;s.incontro={tipo:'nemico',pid:[p.id],all:[],da:'loro'};Ven.V.pan='incontro';render()})()""")
        await pg.wait_for_selector('.vn-inc .vn-stend', timeout=5000); await _ctrl(pg, t + ' incontro', dif); await foto('6-incontro')
        await pg.evaluate("(()=>{Ven.V.modo='campo';VenCampo.apri(%s);render()})()" % _SCHEDA)
        await pg.wait_for_timeout(2500); await _ctrl(pg, t + ' battaglia', dif); await foto('7-battaglia')
        await pg.click('.vn-via button, [data-v=vpronto]', timeout=3000); await pg.wait_for_timeout(1500)
        check(await pg.evaluate('!VenCampo.K.pausa'), f'{t}: dopo Via la battaglia e ancora in pausa')
        await pg.evaluate('VenCampo.K.vel=4')
        await pg.wait_for_function("VenCampo.K.s&&VenCampo.K.s.fine", timeout=90000)
        await pg.wait_for_selector('.vn-vela h3', timeout=15000)
        await pg.wait_for_timeout(800); await _ctrl(pg, t + ' esito', dif); await foto('8-esito')
        check(not pg.errs and not pg.cons, f'{t}: nessun errore: {pg.errs[:3]} {pg.cons[:3]}')
        await ctx.close()
    print('DIFETTI:', *[x.encode('ascii', 'replace').decode() for x in dif], sep='\n  ')
    nuovi = [x for x in dif if not any(k in x for k in _ATTESI)]
    check(not nuovi, 'difetti nuovi, non nelle issue aperte: ' + '; '.join(nuovi[:6]))
