# Sorgenti della lobby 3D (`tools/taverna3d/`)

Qui si lavora; `src/js/app/12c-lobby-3d.js` e `src/css/90-lobby-3d.css` sono il risultato generato.
1. Modifica il pezzo giusto (elenco in `README.md`: `main2e.js` locanda, `main2f.js` boschetto, `eng.js` collegamento con l'app…).
2. `python3 tools/taverna3d/mk.py`
3. `npm run verifica`
4. Dopo ogni modifica visiva: una prova headless a 390 px (skill `verifica-render-3d`), un solo screenshot.
Mai aprire il file generato: costa ~45k token e non è la fonte. Senza WebGL o sotto ~12 fps l'app ripiega sul falò: non rompere quel ripiego.
