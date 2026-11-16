# X1 — Accendere le grandi battaglie (rilascio 2)

**Binario** G (accensioni). **Solo dopo** che sono unite B0, B1, B3, B1v, U4 e B0v (B5 consigliata). Modello: Sonnet.

**Scopo.** Girare l'interruttore e provare l'insieme come lo vedrà il giocatore.

**Passi.**
1. `VDAT.ACCESO.grandi=true` (`28j`).
2. `VEN.campo` passa `max/W/H` dalla taglia, `reparti:true`, `ondate:true`, `capoB`.
3. Nel menu: «Grandezza delle battaglie» (Piccola, Media, Grande) in `menuH`, con la proposta automatica alla prima partita (`ven-q`: bassa → piccola, media → media, alta → grande). È un tocco nel binario E: 15 righe.
4. In compagnia la taglia è quella dell'oste: controllare che `28m` la passi (tocco nel binario C, se manca).

**Prove d'insieme** (devono passare tutte):
- `npm test` intero, lenti compresi.
- Bot a 60 e 120 giorni: nessun seme in rovina; perdite medie per battaglia non oltre 1,5× quelle di prima (tabella nella PR).
- Scenari: `ventura`, `ventura_tattica`, `ventura_schiera`, `ventura_grandi`, `ventura_stanza` (due telefoni con taglia diversa: vale quella dell'oste), `ventura_tv`.
- Una partita guidata a mano dallo scenario: incontro con un signore da 150 → schieramento con una divisione e un'ondata di fianco → battaglia → esito. Tre screenshot a 390 px.
- Salvataggio vecchio (fixture in `tests/`) che si apre e combatte.

**Se qualcosa non va.** Si spegne di nuovo l'interruttore nella stessa PR e si apre una scheda `fix/…` nel binario del difetto. Non si corregge qui.

**Fatto quando.** Prove d'insieme verdi; nella PR un paragrafo «Cosa cambia per chi gioca» da usare come nota del rilascio.
