# Passo 31: la regia della battaglia: la camera inquadra le due schiere, stacca sui momenti decisivi, cede ai comandi del giocatore.
import os, tempfile

_SCHEDA = """(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));
  return {seme:7,a:T(0,{val_f2:50,val_t2:20,val_c3:40}),b:T(5,{fer_f2:70,fer_t2:30,fer_c3:50}),cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',reparti:true,max:110}})()"""

async def _avvia31(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' and 'AudioContext' not in m.text else None)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(3,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(800)
    return ctx, pg

# quanti uomini vivi di ciascun lato cadono dentro lo schermo (proiezione dei centri delle due schiere)
_CENTRI = """(()=>{const K=VenCampo.K,r=VenArte.cv.getBoundingClientRect(),o={};
  for(const l of['a','b']){let x=0,z=0,n=0;for(const u of K.s.u)if(u.l===l&&u.st==='vivo'){x+=u.x;z+=u.y;n++}
   const p=VenArte.aSchermo(K.cam,x/n,0,z/n);o[l]=n>0&&p.x>0&&p.x<r.width&&p.y>0&&p.y<r.height}
  return{...o,alt:K.alt,ripr:K.ripr}})()"""

async def sc_p31_regia(b, srv):
    """Battaglia a regia: due schiere in vista a 8 e 14 s, stacco su stendardo, tocco che passa a capitano e torna, niente rallentatore in compagnia."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia31(b, srv)
    await pg.evaluate("(()=>{Ven.V.modo='campo';VenCampo.apri(%s);VenCampo.K.pausa=false;VCAM.ordina(VenCampo.K.s,{g:'tutti',t:'carica'});render()})()" % _SCHEDA)
    await pg.wait_for_timeout(900)
    check(await pg.evaluate("VenCampo.K.ripr") == 'regia', 'la camera parte in regia')
    check(await pg.evaluate("!!document.querySelector('.vn-occ')"), 'il tasto occhio è nella barra alta')
    await pg.wait_for_timeout(7000)
    c8 = await pg.evaluate(_CENTRI)
    check(c8['a'] and c8['b'], f'dopo 8 s i centri delle due schiere sono nello schermo: {c8}')
    await pg.screenshot(path=os.path.join(d, 'p31-mischia.png'))
    await pg.wait_for_timeout(6000)
    c14 = await pg.evaluate(_CENTRI)
    check(c14['a'] and c14['b'], f'dopo 14 s i centri delle due schiere sono nello schermo: {c14}')
    # pura: inquadra(s) non cambia lo stato e sta tra i limiti
    q = await pg.evaluate("(()=>{const K=VenCampo.K,a=JSON.stringify(K.s),q=VenCampo.inquadra(K.s);return{pura:a===JSON.stringify(K.s),ok:q.alt>=K.ALT_MIN&&q.alt<=K.ALT_MAX&&isFinite(q.x)&&isFinite(q.z)}})()")
    check(q['pura'] and q['ok'], f'inquadra(s) è pura e dentro i limiti: {q}')
    # stacco su stendardo: ≥ 6 s dall'ultimo, la camera scende sotto 30 entro 0,5 s e torna sopra 30 entro 3 s
    await pg.evaluate("VenCampo.K.ultStacco=-99;VenCampo.K.stacco=null;VenCampo.K.pausa=true")
    prima = await pg.evaluate("VenCampo.K.alt")
    check(prima > 30.5, f'prima dello stacco la camera sta sopra 30 ({prima:.1f})')
    # tempo di vista a passi fissi: il test non dipende dal ritmo del browser
    ev = await pg.evaluate("""(()=>{const K=VenCampo.K;VenCampo.eventi([{t:'stendardo',l:'b'}]);let min=1e9,t=0,t30=null,ritorno=null;
      for(let i=0;i<240;i++){VenCampo.passo(1/60);t+=1/60;min=Math.min(min,K.alt);if(t30===null&&K.alt<30)t30=t;if(t30!==null&&t>1.7&&ritorno===null&&K.alt>30)ritorno=t}
      return{t30,ritorno,min}})()""")
    check(ev['t30'] is not None and ev['t30'] <= .5, f'sullo stendardo la camera scende sotto 30 entro 0,5 s: {ev}')
    check(ev['ritorno'] is not None and ev['ritorno'] <= 3.0, f'poi torna sopra 30 entro 3 s: {ev}')
    # un secondo stacco entro 6 s è ignorato
    ig = await pg.evaluate("(()=>{const K=VenCampo.K,u=K.ultStacco;K.stacco=null;VenCampo.eventi([{t:'cap-ko',seat:0}]);return K.ultStacco===u})()")
    check(ig, 'meno di 6 s tra due stacchi: il secondo non parte')
    # rallentatore: in solitario sì, in compagnia mai
    sol = await pg.evaluate("(()=>{const K=VenCampo.K;K.esterno=false;K.lento=0;VenCampo.eventi([{t:'stendardo',l:'b'}]);return K.lento})()")
    com = await pg.evaluate("(()=>{const K=VenCampo.K;K.esterno=true;K.lento=0;VenCampo.eventi([{t:'stendardo',l:'b'}]);const v=K.lento;K.esterno=false;return v})()")
    check(sol > 0 and com == 0, f'rallentatore solo in solitario ({sol} / {com})')
    # tocco sul campo: capitano per 4 s, poi di nuovo regia
    await pg.evaluate("(()=>{const K=VenCampo.K;K.pausa=false;K.stacco=null;K.ripr='regia';K.lod=0;const r=VenArte.cv.getBoundingClientRect();VenCampo.tocco(r.left+r.width/2,r.top+r.height/2)})()")
    check(await pg.evaluate("VenCampo.K.ripr") == 'capitano', 'il tocco passa alla camera capitano')
    await pg.wait_for_timeout(4800)
    check(await pg.evaluate("VenCampo.K.ripr") == 'regia', 'dopo 4 s torna la regia')
    # trascinare passa a libera; l'occhio fa girare: libera -> regia
    await pg.evaluate("VenCampo.trascina(5,5)")
    check(await pg.evaluate("VenCampo.K.ripr") == 'libera', 'trascinare passa a libera')
    await pg.evaluate("document.querySelector('.vn-occ').click()")
    check(await pg.evaluate("VenCampo.K.ripr") == 'regia', 'l\'occhio da libera torna a regia')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()
