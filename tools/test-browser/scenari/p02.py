# Passo 02: la vista della Ventura spezzata in file. Sei momenti, HTML di `.vn` identico ai riferimenti in rif/ (seme e stato fissi).
# Riferimenti mancanti (o AGGIORNA_RIF=1): vengono scritti. Vanno generati su `main` prima dello spezzamento.
RIF_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'rif')

async def sc_p02_ventura_html(b, srv):
    """Ventura: HTML della vista identico in mondo, menu, luogo, mercato, incontro e battaglia ferma."""
    ctx = await new_context(b, srv.port); pg = await page(ctx, srv.url)
    await pg.evaluate("localStorage.removeItem('ven-salv')"); await pg.click('#plancia [data-v=avventura]'); await pg.wait_for_timeout(300)
    await pg.click('[data-a=ven][data-v="regno:sel"]'); await pg.click('[data-a=ven][data-v=nuova]')
    await pg.wait_for_function("VenArte.A.pronta||VenArte.A.fallita", timeout=30000); await pg.wait_for_timeout(600)
    await pg.evaluate("(()=>{const s=VEN.nuovo(5,{nome:'Tester',compagnia:'Compagnia di prova',regno:'val'});Ven.entra(s)})()"); await pg.wait_for_timeout(400)
    await pg.evaluate("Ven.ferma()")
    async def foto(nome, js):
        await pg.evaluate(js); await pg.wait_for_timeout(150)
        h = await pg.evaluate("(()=>{const el=document.createElement('div');el.innerHTML=Ven.html();return el.firstElementChild.outerHTML})()")
        f = os.path.join(RIF_DIR, f'ventura_{nome}.html')
        if os.environ.get('AGGIORNA_RIF') or not os.path.exists(f):
            os.makedirs(RIF_DIR, exist_ok=True); open(f, 'w', encoding='utf-8').write(h); check(True, f'{nome}: riferimento scritto')
        else: check(open(f, encoding='utf-8').read() == h, f'{nome}: HTML identico al riferimento')
    await foto('mondo', "(()=>{const s=Ven.V.s;s.dentro=-1;s.davanti=-1;s.incontro=null;Ven.V.pan=null;Ven.V.sub='home'})()")
    await foto('menu', "Ven.V.pan='menu'")
    await foto('luogo', "(()=>{const s=Ven.V.s,l=s.l.find(l=>l.tipo==='villaggio');s.dentro=l.id;Ven.V.pan='luogo';Ven.V.sub='home'})()")
    await foto('mercato', "Ven.V.sub='mercato'")
    await foto('incontro', "(()=>{const s=Ven.V.s,p=s.p.find(p=>p.k&&p.k!=='car');s.dentro=-1;s.incontro={tipo:'nemico',pid:[p.id],all:[],da:'tu'};Ven.V.pan='incontro'})()")
    await foto('battaglia', "Ven.act('scegli:attacca')")
    check(not pg.errs, f'nessun errore di pagina: {pg.errs[:3]}'); await ctx.close()
