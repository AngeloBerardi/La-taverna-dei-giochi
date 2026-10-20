#!/usr/bin/env python3
"""Cattura le schermate delle funzioni online a 390x844 (stub Firebase). Uso: TEMA=tavolo|castello|notte|carta python3 tools/test-browser/schermate.py CARTELLA_USCITA [prefisso]"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import run
from run import *

async def main(out, pref):
    os.makedirs(out, exist_ok=True); srv = Server(DIST)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await new_context(b, srv.port, extra_init=f"localStorage.setItem('rg-theme',{os.environ.get('TEMA','carta')!r});"); pg = await page(ctx, srv.url)
        async def foto(n, full=False):
            await pg.wait_for_timeout(250); await pg.screenshot(path=f'{out}/{pref}{n}.png', full_page=full)
        async def apri(a):
            await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await pg.click(f'[data-a={a}]'); await pg.wait_for_timeout(500)
        await pg.evaluate("(()=>{ui.cfg=true;render()})()"); await foto('01-impostazioni')
        await apri('acc'); await foto('02-account'); await pg.click('[data-a=accx]')
        await apri('top'); await foto('03-classifica'); await pg.click('[data-a=accx]')
        await apri('oste'); await foto('04-locandiere'); await pg.click('[data-a=ostex]')
        await apri('dist'); await foto('05-distanza'); await pg.click('[data-a=distx]')
        await apri('eroi'); await foto('06-eroi-vuoto')
        await pg.click('[data-a=eroinuovo][data-v=e1]'); await foto('07-crea-1')
        await pg.fill('#eroe-nome', 'Brunilde'); await pg.click('[data-a=eroiavanti]'); await foto('08-crea-2')
        await pg.click('[data-a=eroiavanti]'); await foto('09-crea-3'); await pg.click('[data-a=eroiavanti]'); await foto('10-crea-4')
        await pg.click('[data-a=eroiavanti]'); await foto('11-crea-5'); await pg.click('[data-a=eroicrea]'); await pg.wait_for_timeout(800); await foto('12-scheda')
        await pg.click('[data-a=eroiindietro]'); await foto('13-eroi-elenco')
        await pg.click('[data-a=campstart]'); await pg.wait_for_timeout(300); await foto('14-campagna')
        await pg.evaluate("(()=>{Camp.s.incontro={kind:'bestie',cd:12,testo:'Un branco di bestie vi circonda.',ab:['atletica','intimidire','furtivita']};render()})()"); await foto('15-campagna-incontro')
        await pg.evaluate("(()=>{Camp.s.incontro=null;Camp.s.over={win:false,reason:'Tutti gli eroi sono caduti'};render()})()"); await foto('16-campagna-fine')
        await b.close()
    srv.stop()
asyncio.run(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ''))
