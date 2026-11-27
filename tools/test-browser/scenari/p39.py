# Passo 39: le voci dei compagni: il fumetto sopra Berta in battaglia e la riga nella cronaca della TV.
import os, tempfile
async def _avvia39(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' and 'AudioContext' not in m.text else None)
    await pg.evaluate("localStorage.removeItem('ven-salv');localStorage.setItem('ven-q','media')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(3,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(800)
    return ctx, pg


_SCHEDA39 = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40}),b:T(5,{fer_f2:70,fer_t2:30,fer_c3:50}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',reparti:true,max:110}})()"""


_SCHEDA39 = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40,co_berta:1}),b:T(5,{fer_f2:70,fer_t2:30,fer_c3:50}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',reparti:true,max:110}})()"""

async def sc_p39_voci(b, srv):
    """Con ?ven=grandi, in battaglia con Berta: quando grida compare un .vn-fumetto; la riga entra nella cronaca della TV; screenshot a 390 px."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia39(b, srv)
    await pg.evaluate("VDAT.ACCESO.grandi=true")
    await pg.evaluate("(()=>{const K=VenCampo.K;Ven.V.modo='campo';VenCampo.apri(%s);K.pausa=false;VCAM.ordina(K.s,{g:'tutti',t:'carica'});K.ripr='regia'})()" % _SCHEDA39)
    await pg.wait_for_timeout(500)
    ok = await pg.evaluate("(()=>{const K=VenCampo.K;for(let i=0;i<6000&&!(K.fum&&K.fum.length);i++)VenCampo.passo(1/30);return !!(K.fum&&K.fum.length)})()")
    check(ok, 'Berta grida entro la battaglia')
    await pg.wait_for_timeout(300)
    n = await pg.evaluate("document.querySelectorAll('.vn-fumetto').length")
    check(n >= 1, f'compare un .vn-fumetto: {n}')
    txt = await pg.evaluate("(()=>{const K=VenCampo.K;return{fr:K.fum[0].tx,cron:K.cron.length,ok:VVOC.CAMPO.co_berta.carica.concat(VVOC.CAMPO.co_berta.rotta,VVOC.CAMPO.co_berta.cede,VVOC.CAMPO.co_berta.ferito,VVOC.CAMPO.co_berta.vince).includes(K.fum[0].tx)}})()")
    check(txt['ok'] and txt['cron'] >= 1, f'frase da VVOC.CAMPO e riga in cronaca: {txt}')
    await pg.screenshot(path=os.path.join(d, 'p39-fumetto.png'))
    await pg.evaluate("(()=>{const K=VenCampo.K;for(let i=0;i<90;i++)VenCampo.passo(1/30)})()")
    n2 = await pg.evaluate("document.querySelectorAll('.vn-fumetto').length")
    check(n2 == 0, f'dopo 2 s il fumetto sparisce: {n2}')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()
