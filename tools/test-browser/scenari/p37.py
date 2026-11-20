# Passo 37: il peso della mischia (caduti a terra, polvere, stendardi, frecce, scintille, tappeto sonoro) senza sforare il budget dei triangoli.
import os, tempfile

_SCHEDA37 = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40}),b:T(5,{fer_f2:70,fer_t2:30,fer_c3:50}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',reparti:true,max:110}})()"""

# triangoli di prima del passo, stesso seme e stessi passi fissi (qualità media); misurati sul ramo prima delle modifiche
TRIANGOLI_PRIMA = 99662

async def _avvia37(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' and 'AudioContext' not in m.text else None)
    await pg.evaluate("localStorage.removeItem('ven-salv');localStorage.setItem('ven-q','media')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(3,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(800)
    return ctx, pg

# battaglia a passi fissi (il test non dipende dal ritmo del browser): carica, fino a 10 s dopo i primi colpi; poi la misura sui triangoli
_MISCHIA37 = """(()=>{const K=VenCampo.K;Ven.V.modo='campo';VenCampo.apri(%s);K.pausa=false;VCAM.ordina(K.s,{g:'tutti',t:'carica'});K.ripr='regia';
  let t=0,t0=null;for(let i=0;i<5400;i++){VenCampo.passo(1/30);t+=1/30;if(t0===null&&K.hot.some(h=>h.t>=K.s.t-30))t0=t;if(t0!==null&&t-t0>=10)break}
  const I=VenArte.ren.info;I.autoReset=false;let mx=0;for(let i=0;i<20;i++){I.reset();VenCampo.passo(1/30);mx=Math.max(mx,I.render.triangles)}I.autoReset=true;
  return{t,t0,tri:mx,caduti:K.caduti,lod:K.lod,alt:K.alt,vivi:K.s.u.filter(u=>u.st==='vivo').length}})()"""

async def sc_p37_mischia(b, srv):
    """Dopo 10 s di mischia: caduti a terra, triangoli entro +15% (media), nessuna polvere né freccia piantata con qualità bassa, screenshot."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia37(b, srv)
    m = await pg.evaluate(_MISCHIA37 % _SCHEDA37)
    print('  p37 misura:', m)
    check(m['t0'] is not None, f'la mischia comincia: {m}')
    check((m['caduti'] or 0) > 0, f'dopo 10 s di mischia ci sono caduti a terra: {m["caduti"]}')
    if TRIANGOLI_PRIMA: check(m['tri'] <= 1.15 * TRIANGOLI_PRIMA, f'triangoli {m["tri"]} <= 1,15 x {TRIANGOLI_PRIMA}')
    await pg.screenshot(path=os.path.join(d, 'p37-mischia.png'))
    # stendardi: uno per gruppo vivo, porta la prima unità viva; i caduti non passano gli 80
    k = await pg.evaluate("(()=>{const K=VenCampo.K;return{n:K._st?K._st.length:-1,cad:K.caduti}})()")
    check(k['n'] >= 0, f'stendardi dei gruppi: {k}')
    check(k['cad'] <= 80, f'al più 80 caduti a terra: {k}')
    # dopo la rotta: si tira avanti finché la battaglia finisce, poi screenshot
    await pg.evaluate("(()=>{const K=VenCampo.K;for(let i=0;i<4000&&!K.s.fine;i++)VenCampo.passo(1/30);for(let i=0;i<30;i++)VenCampo.passo(1/30)})()")
    await pg.screenshot(path=os.path.join(d, 'p37-rotta.png'))
    # qualità bassa: niente polvere né frecce piantate
    await pg.evaluate("localStorage.setItem('ven-q','bassa')")
    bs = await pg.evaluate("(()=>{const K=VenCampo.K;VenCampo.scena();K.par.passo(5);VenCampo.eventi([{t:'colpo',da:K.s.u[0].id,a:K.s.u[1].id,dan:3,carica:true}]);const p=K.par.n();VenCampo.eventi([{t:'tiro',da:K.s.u[0].id,x0:5,y0:5,x1:9,y1:9,vt:4,colpito:false}]);for(let i=0;i<60;i++)VenCampo.passo(1/30);return{polvere:p,piantate:(K.piantate||[]).length}})()")
    check(bs['polvere'] == 0 and bs['piantate'] == 0, f'qualità bassa: niente polvere né frecce piantate: {bs}')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()
