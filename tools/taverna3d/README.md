# Taverna 3D (lobby)

Sorgenti della lobby 3D (ingresso con il modulo di registrazione, locanda, boschetto). `python3 tools/taverna3d/mk.py` rigenera `src/js/app/12c-lobby-3d.js` e `src/css/90-lobby-3d.css`; poi `npm run check`.

- `pre.js` renderer e utilità · `core.js` texture e materiali · `fig.js` pupazzi · `fire.js` fuoco · `main1.js` arredi
- `main2.js` ingresso (pergamena) · `catalog.js` giochi veri e copertine · `main2e.js` locanda · `main2f.js` boschetto
- `music.js` jukebox · `page.js` scaffale e pagina del gioco · `eng.js` collegamento con l'app (stanza, ospiti, chat, emote, posizioni, proposta con voto ✓/✗, jukebox condiviso, ripiego sul falò)
- `markup.html` overlay · `head.html` + `extra.css` stile (viene messo sotto `#l3d`)

Dati in più nel documento del membro: `av3` (pupazzo 3D; `av` viene derivato per le altre lobby), `pos3` (area e posizione), `prop`/`pv` (proposta e voto), `juke` (brano). Le altre lobby li ignorano.
