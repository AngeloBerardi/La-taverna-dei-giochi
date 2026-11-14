import sys, json, urllib.parse, urllib.request, time, os
from concurrent.futures import ThreadPoolExecutor
KEY = os.environ["POLLINATIONS_API_KEY"]  # chiave sk_ di enter.pollinations.ai: mai nel repo
OUT = sys.argv[1]
SUF = ", hand-painted illustration for a board game box cover, rich detail, centered focal point, cinematic lighting, vivid saturated colors, full-bleed artwork, wordless, no letters, no signs, no banners, no logos"
P = json.load(open(sys.argv[2]))
only = sys.argv[3:] 
def gen(item):
    gid, prompt, seed = item
    url = "https://gen.pollinations.ai/image/" + urllib.parse.quote(prompt + SUF) + "?model=microsoft/mai-image-2.6-flash&width=768&height=1024&nologo=true&seed=%d" % seed
    for t in range(3):
        try:
            req = urllib.request.Request(url, headers={"Authorization": "Bearer " + KEY})
            d = urllib.request.urlopen(req, timeout=170).read()
            if d[:2] == b"\xff\xd8":
                open(os.path.join(OUT, gid + ".jpg"), "wb").write(d); return gid, "ok", len(d)
            return gid, "non-img", d[:120]
        except Exception as e:
            err = str(e)[:100]; time.sleep(4)
    return gid, "err", err
items = [(k, v[0], v[1]) for k, v in P.items() if not only or k in only]
with ThreadPoolExecutor(4) as ex:
    for r in ex.map(gen, items): print(*r, flush=True)
