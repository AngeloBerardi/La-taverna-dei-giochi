# Copertine dei giochi

Le scatole della locanda 3D e la pagina «Giochi» usano `assets/copertine/<id>.webp` (480×640, 3:4). Un gioco senza file resta col disegno a codice (`boxTex0` in `tools/taverna3d/catalog.js`); il build legge la cartella e riempie `COPIMG` (`app/07-nucleo.js`).

## Rigenerare o aggiungere
1. `POLLINATIONS_API_KEY=sk_… python3 tools/copertine/genera.py CARTELLA tools/copertine/prompts.json [id…]` scrive `CARTELLA/<id>.jpg` (768×1024).
2. Controlla a vista (scritte inventate, firme, marchi), poi converti: `Image.open(f).resize((480,640)).save('assets/copertine/<id>.webp','WEBP',quality=78)`.
3. `python3 tools/taverna3d/mk.py` solo se cambi la lobby; poi `npm run verifica`.

## Metodo (provato)
- Modello `microsoft/mai-image-2.6-flash` (a pagamento in pollen, ~0,016 $ a immagine); `flux` è gratis ma molto più debole.
- Prompt: soggetto e scena per primi, stile concreto («hand-painted illustration for a board game box cover»), palette e luce, poi `wordless, no letters, no signs, no banners, no logos`. Mai marchi o nomi di personaggi: descrivere la scena in generale.
- Il titolo non si chiede al modello: lo disegna `paintBox` (targa in ottone) sopra l'immagine.
