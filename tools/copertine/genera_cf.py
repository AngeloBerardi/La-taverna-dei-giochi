#!/usr/bin/env python3
"""Copertine con Cloudflare Workers AI (FLUX.1 schnell, piano gratuito: 10.000 neuroni al giorno, ~170 immagini a 4 passi).
  CF_ACCOUNT_ID=… CF_API_TOKEN=… python3 tools/copertine/genera_cf.py CARTELLA tools/copertine/prompts_flux.json [id…]
Il modello restituisce 1024x1024: lo script ritaglia al centro in 3:4 (768x1024) e scrive CARTELLA/<id>.jpg. Token e id: mai nel repo."""
import sys, os, json, base64, io, time, urllib.request
from PIL import Image
ACC, TOK = os.environ['CF_ACCOUNT_ID'], os.environ['CF_API_TOKEN']
OUT, P, only = sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3:]
URL = f'https://api.cloudflare.com/client/v4/accounts/{ACC}/ai/run/@cf/black-forest-labs/flux-1-schnell'
os.makedirs(OUT, exist_ok=True)
for gid, prompt in P.items():
    if only and gid not in only: continue
    for t in range(3):
        try:
            req = urllib.request.Request(URL, json.dumps({'prompt': prompt, 'steps': 4}).encode(), {'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
            r = json.load(urllib.request.urlopen(req, timeout=120))
            im = Image.open(io.BytesIO(base64.b64decode(r['result']['image']))).convert('RGB'); w, h = im.size
            cw = int(h * 3 / 4); im = im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h)).resize((768, 1024), Image.LANCZOS)
            im.save(f'{OUT}/{gid}.jpg', quality=92); print(gid, 'ok'); break
        except Exception as e:
            print(gid, 'errore', str(e)[:90]); time.sleep(5)
