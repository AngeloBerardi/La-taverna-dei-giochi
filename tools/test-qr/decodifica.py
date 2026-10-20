#!/usr/bin/env python3
"""Legge da stdin un JSON [{testo, size, mod:[[0/1]]}] e verifica che un lettore QR vero (OpenCV) ritrovi il testo.
Esce con 1 se qualcosa non torna, con 77 se OpenCV non c'è (il test chiamante lo salta)."""
import json, sys
try:
    import cv2, numpy as np
except Exception:
    sys.exit(77)
casi = json.load(sys.stdin); male = 0
det = cv2.QRCodeDetector()
for c in casi:
    n = c['size'] + 8; s = 8
    img = np.full((n * s, n * s), 255, np.uint8)
    for y, r in enumerate(c['mod']):
        for x, v in enumerate(r):
            if v: img[(y + 4) * s:(y + 5) * s, (x + 4) * s:(x + 5) * s] = 0
    testo, _, _ = det.detectAndDecode(img)
    if testo != c['testo']:
        male += 1; print('NON LETTO:', repr(c['testo'][:40]), 'len', len(c['testo'].encode()), 'v', c.get('versione'), '->', repr(testo[:40]))
print('letti', len(casi) - male, 'su', len(casi)); sys.exit(1 if male else 0)
