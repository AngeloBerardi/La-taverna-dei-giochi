#!/usr/bin/env python3
"""Prepara le immagini generate per un kit giallo: ritaglio, misura e WebP nel peso giusto (docs/GIALLI-SCENA.md).

Uso: python3 tools/kit/prepara-immagini.py <cartella-sorgente> <id-kit>
La cartella sorgente ha la stessa forma della destinazione, con qualsiasi formato d'immagine:
  ritratti/tobia.png  luoghi/cantina.jpg  oggetti/fiala.png  copertina.png
Scrive in assets/kit/<id-kit>/ e avvisa se un nome non corrisponde a niente nel kit (src/kit/<id-kit>.json).
"""
import json, os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
# tipo: (larghezza, altezza, KB massimi, dove tenere il centro in verticale: 0 alto, 0.5 centro)
MISURE = {'ritratti': (800, 1000, 160, 0.3), 'luoghi': (1920, 1080, 400, 0.5), 'oggetti': (800, 800, 120, 0.5), 'copertina': (1920, 1080, 400, 0.5)}
FORMATI = ('.png', '.jpg', '.jpeg', '.webp')


def ritaglia(im, w, h, cy):
    """riempie w×h tagliando l'eccesso (in verticale attorno a cy, in orizzontale al centro)"""
    k = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x = (im.width - w) // 2
    y = min(max(0, round(im.height * cy - h * cy)), im.height - h)
    return im.crop((x, y, x + w, y + h))


def salva(im, dst, kb):
    for q in (82, 76, 70, 64, 58, 50, 42):
        im.save(dst, 'WEBP', quality=q, method=6)
        if os.path.getsize(dst) / 1024 <= kb:
            return q
    return q


def validi(kit):
    return {
        'ritratti': {p['id'] for p in kit['personaggi']} | {'vittima'},
        'luoghi': {l['id'] for l in kit.get('luoghi', [])},
        'oggetti': {x['id'] for a in kit['atti'] for x in a['indizi']},
    }


def main(src, kid):
    kit = json.load(open(os.path.join(ROOT, 'src', 'kit', kid + '.json'), encoding='utf8'))
    ok, dst_root, fatti = validi(kit), os.path.join(ROOT, 'assets', 'kit', kid), 0
    lavori = []
    for f in os.listdir(src):
        if os.path.splitext(f)[0] == 'copertina' and f.lower().endswith(FORMATI):
            lavori.append(('copertina', None, os.path.join(src, f)))
    for tipo in ('ritratti', 'luoghi', 'oggetti'):
        d = os.path.join(src, tipo)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            nome, ext = os.path.splitext(f)
            if ext.lower() not in FORMATI:
                continue
            if nome not in ok[tipo]:
                print(f'SALTATO {tipo}/{f}: nel kit non c\'è «{nome}» (validi: {", ".join(sorted(ok[tipo]))})')
                continue
            lavori.append((tipo, nome, os.path.join(d, f)))
    for tipo, nome, path in lavori:
        w, h, kb, cy = MISURE[tipo]
        im = ritaglia(Image.open(path).convert('RGB'), w, h, cy)
        dst = os.path.join(dst_root, 'copertina.webp') if tipo == 'copertina' else os.path.join(dst_root, tipo, nome + '.webp')
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        q = salva(im, dst, kb)
        print(f'ok  {os.path.relpath(dst, ROOT)}  {w}×{h}  {os.path.getsize(dst) // 1024} KB  (qualità {q})')
        fatti += 1
    print(f'{fatti} immagini pronte. Poi: npm run build (il build controlla i nomi).')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
