# Passo 05: la mappa del mondo non esce dalla terra.
async def sc_p05_mappa_nei_limiti(b, srv):
    """Ventura: trascinando e pizzicando la telecamera resta entro i bordi, con un margine di mare."""
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(5,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()"); await pg.wait_for_timeout(800)
    # funzione pura, anche con valori estremi
    r = await pg.evaluate("""(()=>{const L=VenMappa.limita,G=64,o=[];
      o.push(L({x:-500,z:-500},13,G,.5));o.push(L({x:900,z:900},13,G,.5));
      o.push(L({x:5,z:5},60,G,2));o.push(L({x:5,z:5},8,G,.01));return o})()""")
    check(r[0]['x'] >= -8 and r[0]['z'] >= -8 and r[1]['x'] <= 72 and r[1]['z'] <= 72, f'limita: estremi dentro i limiti {r[:2]}')
    check(r[2]['x'] == 32 and r[2]['z'] == 32, f'limita: vista piu larga della mappa -> centrata {r[2]}')
    check(all(isinstance(v, (int, float)) and v == v for p in r for v in p.values()), 'limita: nessun NaN')
    # trascinamento ripetuto verso l'alto a sinistra
    for _ in range(20): await pg.evaluate("VenMappa.trascina(-400,-400)")
    await pg.wait_for_timeout(1200)
    d = await pg.evaluate("(()=>{const K=VenMappa.K,t=VenMappa.limita(K.fuoco,K.alt,K.M.G,VenMappa.aspetto());return{f:K.fuoco,t,al:K.alt}})()")
    check(abs(d['f']['x'] - d['t']['x']) < .3 and abs(d['f']['z'] - d['t']['z']) < .3, f'dopo 20 trascinamenti la vista sta nei limiti {d}')
    # pizzico al massimo: tutta la mappa visibile
    await pg.evaluate("VenMappa.pizzico(.01)"); await pg.wait_for_timeout(1200)
    d = await pg.evaluate("(()=>{const K=VenMappa.K,A=VenArte,G=K.M.G,asp=VenMappa.aspetto();return{alt:K.alt,max:VenMappa.altMax(G,asp),w:2*K.alt*asp,G}})()")
    check(abs(d['alt'] - d['max']) < .01 and d['w'] >= d['G'] - .01, f'zoom massimo: tutta la mappa e visibile {d}')
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}'); await ctx.close()
