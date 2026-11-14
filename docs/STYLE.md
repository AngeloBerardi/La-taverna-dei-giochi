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

## HUD comune delle partite (novembre 2026)
Scheletro unico in `app/22ga-hud.js` (`HUD.html`) e `css/47-hud.css` (prefisso `h2-`). Oggi lo usano Briscola e L'isola dei predatori (`HUD2`); gli altri giochi passano qui uno alla volta.
- **Fasce fisse, senza scorrimento**: titolo e icone · una riga di fatti (testo, non chip) · posti · tavolo (prende lo spazio che resta) · una riga di stato · comandi · mano · barra dei fogli (Giocatori, Registro, Regole).
- **Tre livelli di pulsante**: un solo ottone per schermata (`.b.play`), legno per i secondari (`.b`), testo sottolineato per il resto (`.h2-txt`).
- **Niente cornici**: l'ottone segna solo chi è di turno e l'azione principale. Un solo sfondo caldo e fermo (niente gradiente che gira, niente lucciole).
- Il messaggio di turno sta sempre nella riga di stato, sopra i comandi; le spiegazioni lunghe vanno nell'infobox (`infoH`).
- Niente emoji: icone di `ic()`. Bersagli di tocco ≥ 44 px. Verificato a 390×844 e 360×640 (scenario `hud_comune`).
- La home della Taverna segue le stesse regole: «Gioca ora» è l'unico ottone; le altre azioni sono insegne di legno a freccia appese al palo del crocevia (`.hm-sg`), senza sottotitoli (la spiegazione sta nell'`aria-label`). Sopra, la scena del crocevia: 3D con luce calda di torcia quando la lobby è la Taverna 3D (`Crocevia`), disegnata altrimenti. Niente casette piatte né cieli viola.
