# Passo 22: HUD della battaglia: fascia bassa unica, carte dei reparti con morale, mini-mappa.
import os, tempfile

_SCHEDA = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40}),b:T(5,{fer_f2:70,fer_t2:30,fer_c3:50}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',reparti:true,max:110}})()"""

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

async def sc_p22_hud_battaglia(b, srv):
    """Fascia bassa unica (≤140 px), carte dei reparti con morale, mini-mappa con puntini ambra e rossi, tocco sulla mini-mappa."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia(b, srv, srv.url)
    await pg.evaluate("(()=>{Ven.V.modo='campo';VenCampo.apri(%s);VenCampo.K.pausa=false;render()})()" % _SCHEDA)
    await pg.wait_for_timeout(3500)
    st = await pg.evaluate("(()=>{const f=document.querySelector('.vn-cb').getBoundingClientRect();return{h:f.height,top:f.top,vh:innerHeight,carte:document.querySelectorAll('.vn-rc').length,ord:document.querySelectorAll('.vn-or .vn-bt').length,mo:document.querySelectorAll('.vn-rc .vn-mo').length}})()")
    check(st['h'] <= 140 and st['carte'] >= 3 and st['mo'] >= 3 and st['ord'] == 6, f'fascia bassa unica con carte e ordini: {st}')
    check((st['top']) / st['vh'] >= .7, f'il campo sopra la fascia occupa almeno il 70% dell altezza: {st}')
    px = await pg.evaluate("(()=>{const c=document.getElementById('vn-mm'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let a=0,r=0;for(let i=0;i<d.length;i+=4){if(d[i]>220&&d[i+1]>140&&d[i+1]<190&&d[i+2]<80)a++;if(d[i]>100&&d[i]<140&&d[i+1]<40&&d[i+2]<40)r++}return{a,r,w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height}})()")
    check(px['a'] > 0 and px['r'] > 0 and round(px['w']) == 72 and round(px['h']) == 120, f'mini-mappa 72x120 con un pixel ambra e uno rosso scuro: {px}')
    await pg.screenshot(path=os.path.join(d, 'p22-hud.png'))
    await pg.evaluate("VenCampo.K.segue=true")
    await pg.click('#vn-mm', position={'x': 10, 'y': 10}); await pg.wait_for_timeout(200)
    mv = await pg.evaluate("({s:VenCampo.K.segue,x:VenCampo.K.fuoco.x})")
    check(mv['s'] is False, f'toccare la mini-mappa sposta la telecamera: {mv}')
    await pg.click('.vn-rc[data-g=t]'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("VenCampo.K.gruppo==='t'&&!!document.querySelector('.vn-rc.on[data-g=t]')"), 'toccare una carta sceglie il gruppo')
    f0 = await pg.evaluate("VenCampo.K.s.ord.a.f.fm"); await pg.click('.vn-rc[data-g=f]'); await pg.wait_for_timeout(200)
    await pg.click('.vn-rc[data-g=f]'); await pg.wait_for_timeout(300)
    f1 = await pg.evaluate("VenCampo.K.s.ord.a.f.fm")
    check(f1 != f0, f'il secondo tocco sulla carta gira la formazione: {f0} -> {f1}')
    await pg.click('[data-v="cgr:tutti"]')
    check(await pg.evaluate("VenCampo.K.gruppo==='tutti'"), 'la carta Tutti sceglie tutti i gruppi')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()
