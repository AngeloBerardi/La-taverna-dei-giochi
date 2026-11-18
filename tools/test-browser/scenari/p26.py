# Passo 26: grandi schiere nella vista: tre livelli di dettaglio, vista del comandante a blocchi, avvisi dal campo, gettoni affiancati.
import os, tempfile

# n uomini per lato (stessa miscela di truppe), taglia della battaglia a scelta
def _scheda(n, grande=True, extra=''):
    f, t, c = round(n * .5), round(n * .25), n - round(n * .5) - round(n * .25)
    tg = "max:%d,W:100,H:140" % (2 * n + 20) if grande else "max:%d" % (2 * n + 20)
    return ("(()=>{const T=(p,o)=>Object.keys(o).map(t=>({p,t,n:o[t]}));"
            "return {seme:7,a:T(0,{val_f2:%d,val_t2:%d,val_c3:%d}),b:T(5,{fer_f2:%d,fer_t2:%d,fer_c3:%d}),"
            "cap:{nome:'Capitano',pf:80,att:16,dif:12,dan:12,vel:15,cavallo:true},faza:'tu',fazb:'fer',reparti:true,%s%s}})()"
            % (f, t, c, f, t, c, tg, extra))

async def _avvia(b, srv):
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url + '?ven=grandi')
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' and 'AudioContext' not in m.text else None)
    await pg.evaluate("localStorage.removeItem('ven-salv');localStorage.setItem('ven-q','media')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(3,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(800)
    return ctx, pg

# la camera sul proprio capitano, come quando si gioca: è l'inquadratura con più uomini in vista
_CAPO = "(()=>{const K=VenCampo.K,c=VCAM.capU(K.s,0);K.fuoco.x=c.x;K.fuoco.z=c.y-9;K.segue=false})()"

async def _campo(pg, scheda, alt=38, pausa=False):
    await pg.evaluate("(()=>{Ven.V.modo='campo';VenCampo.apri(%s);VenCampo.K.fit=false;VenCampo.K.alt=%s;VenCampo.K.pausa=%s;render()})()" % (scheda, alt, 'true' if pausa else 'false'))
    await pg.wait_for_timeout(700)
    await pg.evaluate("(()=>{VenCampo.K.fit=false;VenCampo.K.alt=%s})()" % alt)   # al tavolo la camera si adatta da sola: qui la fisso

# una sola fotografia del lavoro di disegno: le chiamate che il motore grafico fa per un fotogramma (anello d'ombra, scena, post-elaborazione)
_CALLS = "(()=>{Ven.ferma();const r=VenArte.ren;r.info.autoReset=false;r.info.reset();VenCampo.passo(.016);const n=r.info.render.calls;r.info.reset();r.info.autoReset=true;return n})()"
_FPS = "new Promise(res=>{let n=0,t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2500)requestAnimationFrame(f);else res(n/((performance.now()-t0)/1000))};requestAnimationFrame(f)})"

async def sc_p26_livelli(b, srv):
    """150 contro 150 su un campo grande: fps vicini a quelli di una battaglia piccola, draw call costanti, vista del comandante a blocchi."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia(b, srv)
    # fps: battaglia piccola e battaglia grande, stessa qualità (media), stesso browser, stessa altezza di camera, camera sul capitano
    ps, gs, ls = [], [], []
    for _ in range(4):   # a battaglia ferma (conta il disegno, non la simulazione, che sta nel motore); misure alternate (la prima è di riscaldamento), mediana: il rendering software è rumoroso
        for sch, out in ((_scheda(20, False), ps), (_scheda(20), ls), (_scheda(150), gs)):
            await _campo(pg, sch, 38, True); await pg.evaluate(_CAPO); out.append(await pg.evaluate(_FPS))
    med = lambda v: sorted(v[1:])[len(v[1:]) // 2]
    f_p, f_g = med(ps), med(gs)
    st = await pg.evaluate("({lod:VenCampo.K.lod,n:VenCampo.K.s.u.length,W:VenCampo.K.s.W,H:VenCampo.K.s.H})")
    check(st['n'] >= 300 and st['W'] == 100 and st['H'] == 140, f'campo grande con 150 contro 150: {st}')
    vis = await pg.evaluate("(()=>{const P=VenCampo.K.fig.P;return{intere:P.corpo.count,omini:P.omino.count}})()")
    # traguardo del passo: 0,9 x. In rendering software (SwiftShader) ogni istanza ha un costo fisso: misure e opzioni nella PR #180
    check(f_g >= .9 * f_p, f'fps con 150 contro 150 ({f_g:.1f}; in vista {vis}; campo grande vuoto {med(ls):.1f}) almeno 0,9 x battaglia piccola ({f_p:.1f})')
    # draw call: stesse tra 40 e 300 uomini (vicino, camera sul capitano: col tetto superato una parte delle figure sono omini)
    await _campo(pg, _scheda(20), 30, True); await pg.evaluate(_CAPO); c40 = await pg.evaluate(_CALLS)
    await _campo(pg, _scheda(150), 30, True); await pg.evaluate(_CAPO); c220 = await pg.evaluate(_CALLS)
    lv = await pg.evaluate("[VenCampo.K.lod,VenCampo.K.fig.P.omino.count]")
    check(c40 == c220 and c40 > 0 and lv[0] == 0 and lv[1] > 1, f'draw call uguali tra 40 e 300 uomini (qualità media, tetto superato: {lv[1]} omini): {c40} / {c220}')
    # livello medio: figure senza armi, ma con corpo e testa; la camera a metà
    await pg.evaluate("VenCampo.K.alt=60;VenCampo.passo(.016);VenCampo.passo(.016)")
    md = await pg.evaluate("(()=>{const P=VenCampo.K.fig.P,n=k=>P[k].count===1&&P[k].instanceMatrix.array[0]===0?0:P[k].count;return{lod:VenCampo.K.lod,corpo:n('corpo'),spada:n('spada')+n('lancia')+n('arco')}})()")   # un pezzo vuoto ha un'istanza schiacciata
    check(md['lod'] == 1 and md['corpo'] > 100 and md['spada'] <= 1, f'livello medio: figure intere ma senza armi: {md}')
    # schermata della mischia vicina
    await _campo(pg, _scheda(150), 34); await pg.evaluate("VenCampo.K.fit=false"); await pg.wait_for_timeout(5000)
    await pg.screenshot(path=os.path.join(d, 'p26-mischia.png'))
    # vista del comandante: 6 blocchi o meno per lato, nessuna figura visibile, blocchi calcolati da una funzione pura
    await pg.evaluate("(()=>{VenCampo.vista(true);VenCampo.K.alt=150;VenCampo.K.fuoco.x=50;VenCampo.K.fuoco.z=70})()"); await pg.wait_for_timeout(900)
    vc = await pg.evaluate("(()=>{const K=VenCampo.K,P=K.fig.P,bl=VenCampo.blocchi(K.s),tot=Object.keys(P).reduce((a,k)=>a+P[k].count,0),pul=JSON.stringify(bl)===JSON.stringify(VenCampo.blocchi(K.s));"
                           "return{lod:K.lod,a:bl.filter(x=>x.l==='a').length,b:bl.filter(x=>x.l==='b').length,tot,pul,chiavi:Object.keys(bl[0]||{}).join(),gett:document.querySelectorAll('.vn-etc .vt-g').length,blk:K.blk.count}})()")
    check(vc['lod'] == 2 and 1 <= vc['a'] <= 6 and 1 <= vc['b'] <= 6 and vc['tot'] == 0 and vc['pul'], f'vista del comandante: pochi blocchi, nessuna figura: {vc}')
    check(vc['chiavi'].startswith('l,r,c,x,y,w,h,n,mor') and vc['gett'] == vc['a'] + vc['b'] and vc['blk'] == 2 * (vc['a'] + vc['b']), f'forma di blocchi(s) e gettoni dei blocchi: {vc}')
    await pg.screenshot(path=os.path.join(d, 'p26-comandante.png'))
    # toccare un blocco tuo sceglie il suo gruppo
    pos = await pg.evaluate("(()=>{const K=VenCampo.K,b=VenCampo.blocchi(K.s).find(x=>x.l==='a'&&x.c==='t'),p=VenArte.aSchermo(K.cam,b.x,0,b.y),r=VenArte.cv.getBoundingClientRect();return{x:r.left+p.x,y:r.top+p.y}})()")
    await pg.evaluate("VenCampo.K.gruppo='tutti'"); await pg.evaluate("(p)=>VenCampo.tocco(p.x,p.y)", pos); await pg.wait_for_timeout(200)
    check(await pg.evaluate("VenCampo.K.gruppo")=='t', 'toccare un blocco sceglie il reparto')
    # il pizzico arriva alla vista del comandante
    await pg.evaluate("VenCampo.K.alt=40;VenCampo.K.fit=false;for(let i=0;i<8;i++)VenCampo.pizzico(.7)")
    check(await pg.evaluate("VenCampo.K.alt") > 80, 'il pizzico allarga fino alla vista del comandante')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()

async def sc_p26_contesto(b, srv):
    """Contesto grafico perso e ripreso con 220 uomini: nessun errore, la battaglia riprende."""
    ctx, pg = await _avvia(b, srv)
    await _campo(pg, _scheda(110), 38); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const g=VenArte.cv.getContext('webgl2')||VenArte.cv.getContext('webgl');g.getExtension('WEBGL_lose_context').loseContext()})()"); await pg.wait_for_timeout(2600)
    t0 = await pg.evaluate("VenCampo.K.t"); await pg.wait_for_timeout(2500); t1 = await pg.evaluate("VenCampo.K.t")
    ok = await pg.evaluate("!!VenCampo.K.scene&&VenCampo.K.s.u.length>200&&!VenArte.persa()")
    check(ok and t1 > t0, f'dopo la perdita del contesto la scena torna e il tempo scorre: {t0:.1f} -> {t1:.1f}')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()

async def sc_p26_avvisi(b, srv):
    """Il campo parla: ognuno dei sei eventi diventa un avviso entro 300 ms, al più due insieme."""
    ctx, pg = await _avvia(b, srv)
    await _campo(pg, _scheda(40), 38, True)
    casi = [('stendardo', "{t:'stendardo',l:'b'}", 'stendardo nemico'), ('rotta-r', "{t:'rotta-r',l:'a',r:0}", 'Cede il reparto'),
            ('ondata', "{t:'ondata',l:'b',id:'o1',ing:'fdx'}", "fianco destro"), ('piano', "{t:'piano',l:'b',r:0,m:'tieni'}", 'serrano i ranghi'),
            ('carro', "{t:'carro',r:1}", 'corrono al carro'), ('raduno', "{t:'raduno',r:0}", 'Grido raduna')]
    for nome, ev, atteso in casi:
        t = await pg.evaluate("(()=>{Ven.V.avvisi=[];const t0=performance.now();VenCampo.eventi([%s]);const ms=performance.now()-t0;return{ms,tx:[...document.querySelectorAll('.vn-avv .vn-av')].map(e=>e.textContent).join('|')}})()" % ev)
        check(atteso in t['tx'] and t['ms'] < 300, f'{nome}: avviso entro 300 ms ({t})')
    n = await pg.evaluate("(()=>{Ven.V.avvisi=[];VenCampo.eventi([{t:'raduno',r:0},{t:'carro',r:1},{t:'stendardo',l:'b'},{t:'ondata',l:'a',ing:'fsx'}]);return Ven.V.avvisi.map(a=>a.tx)})()")
    check(len(n) == 2 and 'stendardo' in n[0] and 'ondata' in n[1], f'al più due avvisi, in ordine di precedenza: {n}')
    await pg.evaluate("Ven.V.avvisi=[];VenCampo.eventi([{t:'piano',l:'b',r:0,m:'tieni'}])")
    n2 = await pg.evaluate("Ven.V.avvisi.length")
    check(n2 == 0, 'la manovra di un reparto nemico si dice solo la prima volta')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()

async def sc_p26_tavolo(b, srv):
    """Il tavolo si legge: alture e boschi hanno il nome sul terreno; sei gettoni nello stesso settore stanno affiancati."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia(b, srv)
    z = "zone:[{k:'altura',x:30,y:30,rx:12,ry:9},{k:'bosco',x:70,y:60,rx:12,ry:10}]"
    await _campo(pg, _scheda(60, True, ',' + z), 60, True); await pg.wait_for_timeout(600)
    nomi = await pg.evaluate("[...document.querySelectorAll('.vn-etc .vt-sv text')].map(e=>e.textContent).join()")
    check('Altura' in nomi and 'Bosco' in nomi, f'alture e boschi hanno il nome scritto: {nomi!r}')
    # sei gettoni nello stesso punto: i rettangoli non si coprono
    await pg.evaluate("(()=>{const K=VenCampo.K,s=K.s;let r=0;for(const u of s.u){if(u.l==='a'&&!u.cap){u.r=3+(r++%6);u.c='f';u.x=50;u.y=100}}})()")
    await pg.wait_for_timeout(700)
    rr = await pg.evaluate("[...document.querySelectorAll('.vn-etc .vt-g:not(.ne)')].map(e=>{const r=e.getBoundingClientRect();return[r.left,r.top,r.right,r.bottom]})")
    dis = all(a[2] <= c[0] or c[2] <= a[0] or a[3] <= c[1] or c[3] <= a[1] for i, a in enumerate(rr) for c in rr[i + 1:])
    check(len(rr) >= 6 and dis, f'sei gettoni nello stesso settore, rettangoli disgiunti: {len(rr)}')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()
