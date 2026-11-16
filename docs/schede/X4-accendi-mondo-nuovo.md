# X4 — Accendere il mondo nuovo (rilascio «Nuova campagna»)

**Binario** G. **Solo dopo** W1, W2, W2v, W3a, W3b, W3c, W4 e W5 (W6 consigliata). Modello: Sonnet con revisione forte.

**Scopo.** Le partite **nuove** nascono nel mondo nuovo: geografia, molti regni che si accorpano, partenza a caso, stagioni ed economia, con la difficoltà scelta. Le partite vecchie continuano come sono.

**Passi.**
1. `VDAT.ACCESO.mondo2=true`.
2. `VEN.nuovo` con l'interruttore acceso: `s.geo=2`, `s.anno=0`, regni multipli, partenza a caso, `opz`.
3. Nella carta «Riprendi» dei mondi vecchi una nota piccola: «Mondo della prima edizione».

**Prove d'insieme.**
- `npm test` intero.
- Bot a 1 anno su 6 semi per ognuno dei tre preset: nessun seme in rovina con Recluta e Condottiero; regni vivi al giorno 120 tra 4 e 7.
- Fixture di un salvataggio vecchio: si apre, gioca 10 giorni, si salva; mappa e regni restano quelli vecchi.
- Scenario guidato: menu → Nuova campagna (Leggenda) → apertura → 5 giorni di marcia → inverno forzato → battaglia. Quattro screenshot a 390 px.
- Compagnia a due telefoni: stesso mondo, stessa partenza vicina.

**Se qualcosa non va.** Si spegne di nuovo l'interruttore e si apre una scheda `fix/…` nel binario giusto.

**Fatto quando.** Prove verdi e nota del rilascio.
