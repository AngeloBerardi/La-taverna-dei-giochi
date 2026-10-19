# App (`src/js/app/`)

Viste, rete, audio, effetti. Tutti i file condividono lo stesso ambito globale e sono concatenati nell'ordine di `src/manifest.json`: nessun `import`. Una funzione chiamata solo a runtime (viste, click) può stare sotto il suo uso; una `const` usata al caricamento deve stare sopra.
- Convenzione dei nomi: `NN-gioco.js` = vista di un gioco; `22x-…` = giochi aggiunti dopo (stessa struttura: `nomeH()`, `nomeClick()`, `NOMEFX`); `07a…07f` = nucleo diviso per compito (vedi `docs/ARCHITECTURE.md`).
- I giochi si registrano in tre punti: `GAMES.push` in `07-nucleo.js`, testi in `07d-regole.js`, e `VIEW`/`FX`/`gameClick` in `23-registri-briscola-scopa-burraco.js`. Suoni e musica: `Snd` in `03-audio.js`.
- Eventi: un solo listener `click` con `data-a`/`data-v`; il `switch(a)` sta in `07c-comandi.js`. Non aggiungere listener sparsi.
- `12c-lobby-3d.js` è **generato** (non si apre, non si modifica): modifica `tools/taverna3d/` e lancia `python3 tools/taverna3d/mk.py`.
- Righe lunghe: lo strumento Read le tronca a 2000 caratteri. Vai a capo dove il linguaggio lo permette (`npm run struttura` avvisa oltre 1500).
- Per trovare una funzione: `grep -n "nomeFunzione" src/js/app/*.js`, poi Read con offset/limit.
