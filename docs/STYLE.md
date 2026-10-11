# Guida di stile e HUD

Aggiornata dal `game-hud-designer`. Decisioni già prese dall'utente:
- **Lobby**: notte al falò in pixel-art, giocatori in cerchio attorno al fuoco, codice stanza su targa di legno, giochi come scatole 3D su scaffale (carte rosso, tavolo giallo, coop blu, solitari viola). Font: Press Start 2P, Silkscreen, VT323.
- **Carte di Regicide**: figure dipinte originali a campiture piatte con grana di carta (`app/05-carte-figura-dipinte.js`), una per nemico. **Niente effetto olografico.**
- **Tema generale**: oro/rosso su fondo scuro (`:root` in `css/01-base.css`), temi `castello`, `notte`, `carta`.
- **Direzione futura**: tavolo di Regicide su PixiJS (carte ad alta definizione, aura e particelle sul nemico, impatto sui colpi); lobby in 3D isometrico con falò.

## Vincoli
- Telefono, 390 px di larghezza, bersagli tocco ≥ 44 px, pollice in basso (comandi e mano in basso).
- `prefers-reduced-motion` sempre rispettato; peso asset contenuto (SVG/WebP).
- Riferimenti per l'HUD (non da copiare): Hearthstone, Slay the Spire, Balatro, Diablo, Valheim.
