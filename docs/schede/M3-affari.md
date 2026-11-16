# M3 — Affari della compagnia: botteghe e carovane proprie (traccia)

> **Traccia**: da completare con l'`architetto` dopo R1 e M2.

**Scopo.** Qualcosa di tuo lavora mentre combatti: una bottega in città rende ogni settimana, una carovana tua porta merci tra due città. La guerra può rovinare entrambe.

**Decisioni di gioco.**
1. **Botteghe** (al più 3): in una città non nemica compri una bottega di un mestiere legato alle merci (`VDAT.PRODUCE`: tintoria, birrificio, armeria…). Rendita settimanale = margine tra materia prima e prodotto ai prezzi del luogo (`VEN.prezzo`), meno un affitto. Se la città passa a un regno in guerra con te, la bottega è confiscata.
2. **Carovane** (al più 2): parti da una città con un capocarovana (un compagno o un mercenario) e 10 uomini di scorta; vanno e vengono tra due città scelte comprando dove costa poco; i predoni possono assalirle (l'IA dei predoni le vede come oggi le carovane dei regni). Si vedono sulla mappa col tuo colore.
3. Resoconto settimanale nel diario, e una riga nella barra delle monete (U1) quando arriva la rendita.
4. Stato facoltativo: `s.botteghe=[{lid,k,da}]`, carovane come parti `k:'car'` con `faz:'tu'` e `mia:true`.

**Prove da fissare.** Una bottega ben scelta ripaga in 30–50 giorni; una carovana senza scorta su una strada infestata si perde in ≥ 50% dei semi; nessun guadagno infinito (il bot non diventa ricco senza combattere più di 2× il bot di oggi).

**Modello.** Architetto forte, poi Sonnet.
