# X3 — Accendere gli eserciti (rilascio 4)

**Binario** G. **Solo dopo** M1 (completata dall'architetto ed eseguita) e X2.

**Passi.** `VDAT.ACCESO.eserciti=true`; con un esercito in battaglia, `VEN.campo` somma alleati e nemici dell'esercito (nelle ondate e nella riserva) e il maresciallo diventa `capoB`.

**Prove d'insieme.**
- `npm test` intero.
- Bot a 120 giorni: in guerra almeno un esercito per regno in 6 semi su 6; nessuna valanga di conquiste (vincolo di M1).
- Scenario: convocazione → adunata → battaglia con alleati, con almeno 300 uomini in tutto. Screenshot.
- Banco della battaglia più grande vista dal bot, nella PR.

**Fatto quando.** Prove verdi e nota del rilascio.
