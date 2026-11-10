# Serata: progetto dell'interfaccia (TV, telefono, console)

- **Un fuoco per volta.** La TV mostra una cosa sola (la prova, l'anello del tempo, i tavoli di famiglia); il telefono ha una sola azione principale nella pagina «Ora».
- **Il momento dà il colore** (`data-mom`): mattina azzurro «Ascolta», pomeriggio ambra «Muoviti», sera viola «In famiglia».
- **Chi può parlare** (Portavoce / Tutti / Famiglia): tre chip uguali su TV e telefono, accesa quella in vigore (`SER.regoleH`).
- **Il tempo sempre in alto a destra** (`SER.orologio`): alla rovescia se il momento ha un limite (`data-fino`), altrimenti da quanto dura (`data-da`), «Pausa» se fermo. L'anello del pomeriggio (`.sr-arco`) si aggiorna in `SER.tick`.
- **Telefono**: barra a 5 icone Ora · Prove · Bacheca · Persone · Io; lente per cercare; Taccuino dentro «Io».
- **Console**: una riga grande per volta, «Poi» in piccolo, Pausa e Avanti in basso; le richieste delle famiglie in un bottone con contatore.
- Test: `python3 tools/test-browser/run.py serata serata_cifrato` (dopo `npm run check`: lo scenario non ricostruisce `dist`).
