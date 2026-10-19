#!/usr/bin/env python3
"""Genera le icone della PWA (pixel-art originale: falò sotto un cielo stellato) in src/pwa/.
Uso: python3 tools/pwa/mk-icone.py   (serve Pillow)"""
import random, os
from PIL import Image, ImageDraw
N = 64
img = Image.new('RGB', (N, N))
d = ImageDraw.Draw(img)
# cielo a fasce
sky = ['#0b1233', '#0e1740', '#121d4a', '#16245a']
for y in range(46):
    d.line([(0, y), (N, y)], fill=sky[min(3, y * 4 // 46)])
random.seed(7)
for _ in range(16):
    x, y = random.randrange(2, N - 2), random.randrange(2, 30)
    if abs(x - 32) + abs(y - 30) > 14: d.point((x, y), fill='#dfe6ff' if random.random() < .6 else '#8fa0e0')
# luna piccola
d.rectangle([48, 8, 51, 11], fill='#f4ecc8'); d.point((48, 8), fill='#16245a'); d.point((51, 11), fill='#16245a')
# terreno
d.rectangle([0, 46, N, N], fill='#1b2a1f'); d.line([(0, 46), (N, 46)], fill='#2f5233')
for x in range(0, N, 6): d.point((x + 2, 49 + (x // 6) % 3 * 3), fill='#243a28')
# alone di luce
for r, c in ((22, '#1a2a52'), (16, '#26335f')):
    d.ellipse([32 - r, 44 - r // 2, 32 + r, 44 + r // 2 + 4], fill=c) if False else None
# tronchi incrociati
d.polygon([(21, 52), (24, 49), (44, 55), (41, 58)], fill='#6b3f1d'); d.polygon([(43, 52), (40, 49), (20, 55), (23, 58)], fill='#8a5427')
d.line([(22, 52), (42, 57)], fill='#4e2c12'); d.line([(41, 52), (23, 57)], fill='#6b3f1d')
# fiamma a strati
def flame(top, bot, halfmax, color, cx=32):
    h = bot - top
    for y in range(top, bot + 1):
        t = (y - top) / h
        w = int(halfmax * (t ** .7) * (1.0 if t < .8 else 1 - (t - .8) * 1.6))
        if w >= 0: d.line([(cx - w, y), (cx + w, y)], fill=color)
flame(22, 52, 9, '#e8531a'); flame(28, 52, 7, '#ff8a1f'); flame(34, 52, 5, '#ffc02e'); flame(41, 52, 3, '#fff0a0')
# scintille
for x, y, c in ((26, 18, '#ffb020'), (38, 15, '#ff8a1f'), (35, 20, '#ffd060'), (29, 12, '#ff8a1f')): d.point((x, y), fill=c)
out = os.path.join(os.path.dirname(__file__), '../../src/pwa')
for nome, size in (('icon-192.png', 192), ('icon-512.png', 512), ('icon-maskable-512.png', 512), ('apple-touch-icon.png', 180)):
    img.resize((size, size), Image.NEAREST).save(os.path.join(out, nome), optimize=True)
print('icone scritte in src/pwa/')
