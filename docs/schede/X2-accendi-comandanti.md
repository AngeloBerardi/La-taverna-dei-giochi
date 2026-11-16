# X2 — Accendere i comandanti (rilascio 3)

**Binario** G. **Solo dopo** X1 e le schede B2a, B2b, B9, B8. Modello: Sonnet, con revisione forte dei numeri.

**Passi.**
1. `VDAT.ACCESO.consiglio=true`.
2. `VEN.campo` passa `rango`, `dott`, `indole`, `esplora`, `memo` (già pronti in B9) e le scelte di B8.

**Prove d'insieme.**
- `npm test` intero.
- Torneo dei comandanti: `node tools/avventura/torneo-comandanti.js` (nuovo, 40 righe), che fa giocare tra loro i ranghi da 0 a 5 a truppe pari su 6 terreni. Tabella nella PR; la diagonale (rango contro sé) deve stare tra il 40 e il 60%.
- Bot del mondo a 120 giorni: nessun seme in rovina; il bot accorto vince ancora più della metà delle battaglie che sceglie di combattere.
- Scenario guidato contro un signore di rango ≥ 3 su un campo con un'altura: dopo 20 s i suoi tiratori sono saliti (screenshot).
- Salvataggio vecchio che si apre.

**Se qualcosa non va.** Si spegne di nuovo l'interruttore e si apre una scheda `fix/…` nel binario giusto.

**Fatto quando.** Prove verdi e nota del rilascio nella PR.
