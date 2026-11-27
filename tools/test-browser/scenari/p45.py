# Passo 45: feudi e affari nella vista (?ven=mondo2 ?ven=eserciti): pezzi 3D sul modellino, tessere «Cantiere» e «Affari», esercito come un solo segnalino.
import os, tempfile

async def _avvia45(b, srv, url):
    ctx = await new_context(b, srv.port); pg = await page(ctx, url)
    await pg.set_viewport_size({'width': 390, 'height': 844})
    pg.cons = []; pg.on('console', lambda m: pg.cons.append(m.text) if m.type == 'error' and 'AudioContext' not in m.text else None)
    await pg.evaluate("localStorage.removeItem('ven-salv');localStorage.setItem('ven-q','media')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(3,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val',opz:{mondo:'vasto',nebbia:false}});Ven.entra(s)})()")
    await pg.wait_for_function("VenMappa.K.scene", timeout=30000); await pg.wait_for_timeout(1200)
    return ctx, pg

# un villaggio tuo con mulino 3, palizzata 1, campo 2 e un cantiere (cappella) aperto, e il tuo capitano dentro
_FEUDO = """(()=>{const s=Ven.V.s,l=s.l.find(x=>x.tipo==='villaggio'&&x.noto!==false);if(!l)return null;
 l.faz='tu';l.sig=-1;l.edif={mulino:3,palizzata:1,addestra:2};l.cant={id:'cappella',fino:VEN.giorno(s)+3};s.dentro=l.id;s.davanti=-1;const t=VEN.TU(s);t.x=l.x;t.y=l.y+1.2;t.oro=900;
 VenMappa.K.fuoco.x=l.x;VenMappa.K.fuoco.z=l.y;VenMappa.K.alt=11;VenMappa.K.segue=false;Ven.V.pan=null;Ven.V.pausa=true;render();return l.id})()"""

async def sc_p45_feudi_vista(b, srv):
    """Mondo nuovo: pezzi sul modellino, tessera Cantiere con prezzi, tessera Affari (con un finto VEN.affari se il passo 43 manca), un esercito = un segnalino. Screenshot a 390 px."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia45(b, srv, srv.url + '?ven=mondo2')
    lid = await pg.evaluate(_FEUDO)
    check(lid is not None, f'villaggio per la prova: {lid}')
    await pg.wait_for_timeout(1500)
    n = await pg.evaluate("(()=>{const lu=VenMappa.K.lu.find(x=>x.id===%d);return lu&&lu.edG?lu.edG.map(g=>g.userData.id+':'+g.userData.n):null})()" % lid)
    check(n and len(n) == 4 and 'cantiere:1' in n and 'mulino:3' in n, f'tre pezzi e un cantiere sul modellino: {n}')
    pala = await pg.evaluate("(()=>{const g=VenMappa.K.lu.find(x=>x.id===%d).edG.find(g=>g.userData.id==='mulino');const a=g.userData.pala.rotation.z;return a})()" % lid)
    await pg.wait_for_timeout(400)
    pala2 = await pg.evaluate("VenMappa.K.lu.find(x=>x.id===%d).edG.find(g=>g.userData.id==='mulino').userData.pala.rotation.z" % lid)
    check(pala != pala2, 'le pale girano')
    await pg.screenshot(path=os.path.join(d, 'p45-feudo.png'))
    # la chiave non cambia: nessuna ricostruzione al passare dei fotogrammi; cambia se cambia l.edif
    g0 = await pg.evaluate("VenMappa.K.lu.find(x=>x.id===%d).edG[0].uuid" % lid)
    await pg.wait_for_timeout(300)
    g1 = await pg.evaluate("VenMappa.K.lu.find(x=>x.id===%d).edG[0].uuid" % lid)
    check(g0 == g1, 'pezzi ricostruiti solo quando cambia la chiave')
    # tessera Cantiere
    await pg.evaluate("(()=>{Ven.V.pan='luogo';Ven.V.sub='home';render()})()")
    await pg.wait_for_timeout(300)
    check(await pg.evaluate("[...document.querySelectorAll('.vn-sv b')].some(b=>b.textContent==='Cantiere')"), 'tessera Cantiere nel luogo tuo')
    await pg.evaluate("Ven.act('sub:cantiere')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[...document.querySelectorAll('.vn-pc .vn-r')].map(r=>({h:r.getBoundingClientRect().height,t:r.textContent.trim().slice(0,70),b:[...r.querySelectorAll('button')].map(x=>({h:x.getBoundingClientRect().height,w:x.getBoundingClientRect().width,d:x.disabled}))}))")
    check(len(r) == 4, f'quattro edifici nel villaggio (mulino, palizzata, campo, cappella): {len(r)}')
    check(all(x['h'] >= 56 for x in r), 'righe da 56 px')
    check(all(bb['h'] >= 44 and bb['w'] >= 44 for x in r for bb in x['b']), 'bersagli da almeno 44 px')
    check(all(bb['d'] for x in r for bb in x['b']), 'con un cantiere aperto tutti i tasti sono spenti')
    await pg.screenshot(path=os.path.join(d, 'p45-cantiere.png'))
    # costruire: finito il cantiere si può ricominciare, il tasto di legno paga e apre il cantiere
    await pg.evaluate("(()=>{const l=Ven.V.s.l[Ven.V.s.dentro];delete l.cant;Ven.act('sub:cantiere')})()"); await pg.wait_for_timeout(200)
    oro0 = await pg.evaluate("VEN.TU(Ven.V.s).oro")
    await pg.click('[data-fa=costruisci][data-fi=palizzata]'); await pg.wait_for_timeout(300)
    st = await pg.evaluate("(()=>{const s=Ven.V.s,l=s.l[s.dentro];return{c:l.cant&&l.cant.id,oro:VEN.TU(s).oro}})()")
    check(st['c'] == 'palizzata' and st['oro'] == oro0 - 140, f'Costruisci paga e apre il cantiere: {st}')
    # tessera Affari: se il passo 43 non c'è, un finto VEN.affari
    await pg.evaluate("""(()=>{const s=Ven.V.s;if(!VEN.affari){window.__finto=1;VEN.affari=()=>({botteghe:[],carovane:[],sett:120});VEN.tipiBottega=()=>[{k:'tintoria',nome:'Tintoria',costo:1000,stima:60,err:''},{k:'birrificio',nome:'Birrificio',costo:350,stima:30,err:''}]}
     const c=s.l.find(x=>x.tipo==='citta'&&x.noto!==false);c.faz='tu';c.sig=-1;s.dentro=c.id;const t=VEN.TU(s);t.x=c.x;t.y=c.y+1.2;Ven.V.pan='luogo';Ven.V.sub='home';render()})()""")
    await pg.wait_for_timeout(300)
    check(await pg.evaluate("[...document.querySelectorAll('.vn-sv b')].some(b=>b.textContent==='Affari')"), 'tessera Affari in città')
    await pg.evaluate("Ven.act('sub:affari')"); await pg.wait_for_timeout(300)
    await pg.screenshot(path=os.path.join(d, 'p45-affari.png'))
    err = await pg.evaluate("[...document.querySelectorAll('.vn-pc button')].filter(x=>x.getBoundingClientRect().height<44).length")
    check(err == 0, f'tasti di Affari tutti da 44 px: {err} piccoli')
    # Affari nella riga delle monete
    await pg.evaluate("Ven.act('chiudi');Ven.act('rq:oro')"); await pg.wait_for_timeout(200)
    check('Affari: +120' in await pg.evaluate("(document.querySelector('.vn-rqi')||{}).textContent||''"), 'riga Affari nell\'infobox delle monete')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()

async def sc_p45_esercito_vista(b, srv):
    """Cinque signori in un esercito: un solo stendardo grande col numero di uomini; sciolto, scompare in un secondo."""
    d = os.environ.get('SCHERMATE_DIR', tempfile.gettempdir())
    ctx, pg = await _avvia45(b, srv, srv.url + '?ven=mondo2')
    await pg.evaluate("VDAT.ACCESO.eserciti=true")
    k = await pg.evaluate("""(()=>{const s=Ven.V.s,t=VEN.TU(s),sg=s.p.filter(p=>p.k==='sig').slice(0,5);if(sg.length<5)return sg.length;
     sg.forEach((p,i)=>{p.x=t.x+3+i*.5;p.y=t.y+2+(i%2)*.6;p.dentro=-1;p.es=1;delete p.via});
     s.eserciti=[{id:1,faz:sg[0].faz,capo:sg[0].id,membri:sg.map(p=>p.id),obiettivo:{tipo:'razzia',lid:0},stato:'marcia',da:VEN.giorno(s),f0:1}];
     const K=VenMappa.K;K.fuoco.x=t.x+4;K.fuoco.z=t.y+2.5;K.alt=9;K.segue=false;Ven.V.pausa=true;
     for(const p of sg)s.visibili=undefined;return VEN.eserciti(s).length})()""")
    check(k == 1, f'un esercito di 5 signori: {k}')
    await pg.wait_for_timeout(1200)
    r = await pg.evaluate("""(()=>{const s=Ven.V.s,e=VEN.eserciti(s)[0],vis=VEN.visibili(s).filter(p=>p.es===1).length;const el=[...document.querySelectorAll('.vn-et')].filter(x=>x.dataset.e==='p'+e.capo);
     return{n:e.n,vis,etichetta:el.length?el[0].textContent:null,ste:VenMappa.K.ste?1:0}})()""")
    check(r['etichetta'] is not None and str(r['n']) in r['etichetta'], f'etichetta col totale degli uomini: {r}')
    await pg.screenshot(path=os.path.join(d, 'p45-esercito.png'))
    n = await pg.evaluate("[...document.querySelectorAll('.vn-et')].filter(x=>/^p/.test(x.dataset.e)&&!x.classList.contains('tu')).length")
    check(n == 1, f'una sola etichetta per i cinque signori: {n}')
    await pg.evaluate("Ven.V.s.eserciti[0].stato='sciolto';Ven.V.s.p.forEach(p=>{delete p.es})"); await pg.wait_for_timeout(300)
    sinks = await pg.evaluate("Object.keys(VenMappa.K.esc||{}).length")
    check(sinks == 1, 'sciolto: lo stendardo scende')
    await pg.wait_for_timeout(1300)
    check(await pg.evaluate("Object.keys(VenMappa.K.esc||{}).length") == 0, 'dopo un secondo è sparito')
    check(not pg.cons, f'nessun errore in console: {pg.cons[:3]}')
    await ctx.close()
