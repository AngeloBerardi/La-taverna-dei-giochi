# Scenari per passo
Uno scenario per passo: `scenari/pNN.py`, funzioni `async def sc_pNN_…(b, srv)`. `run.py` li carica da solo, in ordine di nome, prima di costruire l'elenco.
Si lancia con `python3 tools/test-browser/run.py pNN`. I riferimenti (HTML, immagini) di un passo stanno in `rif/`. Nessun passo tocca più `run.py`.
