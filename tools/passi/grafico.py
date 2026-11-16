# Disegna docs/passi/piano.png dal piano (richiede python3 con matplotlib e Pillow).
#   python3 tools/passi/grafico.py
import json, matplotlib, subprocess, os, textwrap
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon, Circle
from PIL import Image

P = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools/passi/controlla.js'), '--json']))
CORTO = {'01':'Spezza il motore\ndel mondo','02':'Spezza la vista','03':'Completa le tracce\ndel mondo vivo','04':'Ganci, interruttori\ne file vuoti','05':'Mappa bloccata',
 '06':'Battaglie grandi\n(motore)','07':'Geografia: fiumi,\nlaghi, porti, passi','08':'HUD del mondo','09':"L'incontro:\nfaccia a faccia",'10':'Testi: voci\ndei compagni',
 '11':'Reparti, settori\ne ondate','12':'Rango dei\ncomandanti','13':'Luogo e mercato','14':'Mondo grande\nsulla mappa','15':'Testi: aperture\ndella sorte',
 '16':'Morale, fatica,\nfrecce, stendardo','17':'Stagioni\n(motore)','18':'Menu Avventura\ne difficoltà','19':'Tavolo dello\nschieramento',
 '20':'Rilascio 1\nInterfaccia','21':'Consiglio di guerra\nranghi 0–2','22':'HUD della\nbattaglia','23':'Molti regni\nalla nascita','24':'Stagioni\nsulla mappa',
 '25':'Manovre\nranghi 3–4','26':'Grandi schiere\nnella vista','27':'Unificazione\ndei regni','28':'Doti dei\ncompagni in campo',
 '29':'Rilascio 2\nGrandi battaglie','30':'Maestro di guerra\nrango 5','31':'Regia della\nbattaglia','32':'Strategia prima\ndella battaglia','33':'La sorte:\npartenza a caso',
 '34':'Rilascio 3\nComandanti','35':'Sfida al capo','36':'Economia\ndel mondo','37':'Peso della\nmischia',
 '38':'Rilascio 4\nNuova campagna','39':'Voci sullo\nschermo','40':'Eserciti\ne adunate','41':'Feudi vivi\n(motore)','42':'Testi: incontri\ndel crocevia',
 '43':'Affari: botteghe\ne carovane','44':'Incontri del\ncrocevia (motore)','45':'Feudi e affari\nnella vista','46':'Rilascio 5\nEserciti'}
BG='#1b1410'; CARTA='#2a1f18'; OT='#d9a441'; TX='#f1e6cf'; GR='#a39684'
AREA = {'fondamenta':('#d9a441','Fondamenta'), 'battaglia':('#d0603f','Battaglia'), 'mondo':('#57a866','Mondo e campagna'),
        'viste':('#4b93d1','Viste'), 'testi':('#a77ad1','Testi'), 'progetto':('#9aa0a6','Progetto'), 'rilascio':('#f0c75a','Rilascio')}
MOD = {'haiku':'Haiku','sonnet':'Sonnet','opus':'Opus','fable':'Fable'}
CTRL = {'leggero':('#8fb3a0','leggero'), 'forte':('#e07a5f','forte'), 'visivo':('#6fb1e8','visivo'), 'forte+visivo':('#c9a0e8','forte+visivo')}

fasi = sorted({p['fase'] for p in P})
W = 16.0; X0 = 1.0; COLS = 5; BW = 2.6; GAP = 0.16; BH = 1.55
XS = [1.75 + i*(BW+GAP) + BW/2 for i in range(COLS)]
H = 54
fig = plt.figure(figsize=(W, H), dpi=100); ax = fig.add_axes([0,0,1,1]); ax.set_xlim(0,W); ax.set_ylim(H,0); ax.axis('off'); fig.patch.set_facecolor(BG)

ax.text(0.5, 0.95, 'Il Condottiero', color=OT, fontsize=34, weight='bold')
ax.text(0.5, 1.6, '46 passi in sequenza, 12 fasi, da main ai cinque rilasci', color=TX, fontsize=17)
ax.text(0.5, 2.2, 'Una fase = un prompt in una chat nuova (Sonnet 5.5 · impegno basso):  /fase N   ·   i passi della fase corrono in parallelo e non toccano mai lo stesso file', color=GR, fontsize=12.5)

y = 3.3
# passo zero
ax.add_patch(FancyBboxPatch((X0+0.4, y-0.32), 7.6, 0.64, boxstyle='round,pad=0.02,rounding_size=0.08', fc='#3a2a12', ec=OT, lw=1.6))
ax.text(X0+0.6, y, 'Prima di tutto: unisci la PR #139 (porta passi, comandi e controlli in main)', color=OT, fontsize=13, weight='bold', va='center')
ytop = y
y += 1.05
ult = None
for f in fasi:
    ps = [p for p in P if p['fase'] == f]
    ril = [p for p in ps if p['area'] == 'rilascio']
    # biforcazione
    ax.add_patch(Circle((X0, y), 0.13, color=OT, zorder=4))
    ax.text(X0+0.3, y-0.08, f'Fase {f}', color=TX, fontsize=15, weight='bold', va='bottom')
    ax.text(X0+1.55, y-0.08, f'/fase {f}', color=OT, fontsize=13.5, family='monospace', va='bottom')
    dopo = sorted({d for p in ps for d in p['dopo']})
    by = y + 0.45
    for i, p in enumerate(ps):
        c = AREA[p['area']][0]; x = XS[i]
        ax.plot([X0, x], [y, y], color=c, lw=2, alpha=.9, zorder=1); ax.plot([x, x], [y, by], color=c, lw=2, zorder=1)
        ax.add_patch(FancyBboxPatch((x-BW/2, by), BW, BH, boxstyle='round,pad=0.02,rounding_size=0.07', fc=CARTA, ec=c, lw=3 if p['area']=='rilascio' else 2.2, zorder=2))
        ax.add_patch(FancyBboxPatch((x-BW/2, by), BW, 0.12, boxstyle='square,pad=0', fc=c, ec='none', zorder=3))
        ax.text(x-BW/2+0.14, by+0.42, p['passo'], color=c, fontsize=19, weight='bold', va='center', zorder=4)
        ax.text(x-BW/2+0.72, by+0.5, CORTO.get(p['passo'], '\n'.join(textwrap.wrap(p['titolo'], 20)[:2])), color=TX, fontsize=12, weight='bold', va='center', linespacing=1.05, zorder=4)
        ax.text(x-BW/2+0.14, by+BH-0.27, f"{MOD[p['modello']]} · {p['impegno']}", color=GR, fontsize=11, va='center', zorder=4)
        cc, cn = CTRL[p['controllo']]
        ax.text(x+BW/2-0.12, by+BH-0.27, cn, color=cc, fontsize=11, weight='bold', va='center', ha='right', zorder=4)
        ax.plot([x, x], [by+BH, by+BH+0.32], color=c, lw=2, ls=(0,(3,2)), zorder=1)
    ym = by + BH + 0.32
    for i, p in enumerate(ps):
        ax.plot([XS[i], X0], [ym, ym], color=AREA[p['area']][0], lw=2, ls=(0,(3,2)), alpha=.8, zorder=1)
    if ril:
        d = 0.3; ax.add_patch(Polygon([(X0,ym-d),(X0+d,ym),(X0,ym+d),(X0-d,ym)], fc=OT, ec='#fff3d0', lw=1.5, zorder=5))
        nome = CORTO.get(ril[0]['passo'], ril[0]['titolo']).replace('\n', ' ')
        ax.text(X0+0.45, ym+0.12, f'{nome}: online quando unito', color=OT, fontsize=13, weight='bold', va='top')
    else:
        ax.add_patch(Circle((X0, ym), 0.15, color=OT, ec='#fff3d0', zorder=5))
        ax.text(X0+0.45, ym+0.12, 'unisci le PR approvate, poi la fase dopo', color=GR, fontsize=11.5, va='top')
    ult = ym
    y = ym + 0.95
ax.plot([X0, X0], [ytop+0.35, ult], color=OT, lw=6, solid_capstyle='round', zorder=0)

# legenda
y = ult + 1.0
ax.text(0.5, y, 'Come si legge', color=OT, fontsize=18, weight='bold'); y += 0.6
x = 0.6
for k in ['fondamenta','battaglia','mondo','viste','testi','progetto','rilascio']:
    c, n = AREA[k]; ax.add_patch(FancyBboxPatch((x, y-0.16), 0.32, 0.32, boxstyle='round,pad=0.01,rounding_size=0.05', fc=c, ec='none')); ax.text(x+0.45, y, n, color=TX, fontsize=12.5, va='center'); x += 0.45 + len(n)*0.13 + 0.55
y += 0.7
righe = [('Sotto ogni passo', 'a sinistra il modello di chi esegue e l\'impegno; a destra il livello del controllo'),
         ('leggero', 'Haiku 5.5 · basso: file permessi, prove presenti, testi italiani senza marchi né emoji'),
         ('forte', 'Opus 5.5 · alto: rilancia test e impronta, motori puri, interruttori spenti = gioco identico, salvataggi vecchi, compagnia'),
         ('visivo', 'Opus 5.5 · basso: lancia lo scenario del passo e guarda al massimo 3 screenshot'),
         ('forte+visivo', 'Opus 5.5 · alto: i due insieme (geografia e rilasci)'),
         ('Se si inceppa', 'impegno alto → Opus 5.5 alto → Fable 5.2 solo come giudice, mai come esecutore'),
         ('Unione', 'appena il controllo scrive APPROVATO sulla PR; ordine libero dentro la fase; main va online a ogni unione, le novità restano spente fino al loro rilascio')]
for a, b in righe:
    col = CTRL[a][0] if a in CTRL else OT
    ax.text(0.6, y, a, color=col, fontsize=12.5, weight='bold', va='center'); ax.text(3.2, y, b, color=TX, fontsize=12, va='center'); y += 0.5
fig.savefig(os.path.join(ROOT, 'docs/passi/piano.png'), facecolor=BG)
im = Image.open(os.path.join(ROOT, 'docs/passi/piano.png')); px = int((y+0.4)/H*im.size[1]); im.crop((0,0,im.size[0],px)).save(os.path.join(ROOT, 'docs/passi/piano.png'))
print('scritto docs/passi/piano.png')
