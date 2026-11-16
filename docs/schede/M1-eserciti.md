# M1 — Eserciti dei regni e adunate (traccia)

> **Traccia**: le decisioni di gioco ci sono; firme e prove le fissa l'`architetto` (modello forte, sessione breve: «completa la scheda M1») leggendo `28ka-ven-ia.js` dopo R1.

**Scopo.** In guerra i signori non vagano più da soli: un maresciallo del regno chiama l'adunata, i signori si radunano e marciano insieme su un obiettivo (assedio, soccorso, razzia). Da vassallo vieni convocato; puoi seguire l'esercito e combattere con lui; da sovrano lo chiami tu.

**Decisioni di gioco.**
1. Ogni regno in guerra ha al più un esercito. Il maresciallo è il signore con più fama/truppe (non il re, salvo regni piccoli). `s.eserciti=[{id,faz,capo,membri:[pid],obiettivo:{tipo,lid},stato:'aduna'|'marcia'|'assedia'|'sciolto',da}]` (facoltativo: assente = nessuno).
2. Sulla mappa un esercito è un solo segnalino grande (stendardo del maresciallo + numero) che si muove alla velocità del più lento; i membri lo seguono in coda (non si disegnano uno per uno).
3. Adunata: 2 giorni per radunarsi entro 6 caselle dal maresciallo; si scioglie dopo l'obiettivo, dopo 15 giorni o se le forze scendono sotto metà.
4. Da vassallo: lettera di convocazione (scena breve, riuso `VVOC`) con giorno e luogo; presentarsi = +fiducia del re e paga di campagna; ignorarla = −relazione col re, alla terza volta perdi il feudo.
5. In un esercito gli scontri usano già le ondate di `VCAM` (`MAX`, `ONDATA`): alleati e nemici si sommano nelle riserve; il maresciallo nemico è il `capoB`.
6. Da sovrano (V4): «Aduna l'esercito» (già esiste `aduna` in `faiRegno`) diventa questo.

**Prove da fissare.** Bot a 120 giorni: in guerra almeno un esercito si forma per regno in 6 semi su 6; il mondo lasciato a sé non conquista più di oggi ×2 (freno alla valanga, `test_ven_diplomazia.js`); costo di `passo` per un giorno ≤ +20%.

**Modello.** Architetto forte per la scheda; esecuzione Sonnet; revisione forte (tocca l'IA del mondo).
