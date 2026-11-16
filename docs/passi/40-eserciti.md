---
passo: 40
titolo: Eserciti dei regni e adunate
fase: 10
area: mondo
dopo: [27, 03]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kn-ven-eserciti.js
---

# Passo 40 — Eserciti dei regni e adunate

**In breve.** In guerra i signori si radunano dietro un maresciallo e marciano insieme; da vassallo vieni convocato.

> **Traccia**: la completa il passo 03 (architetto). Fino ad allora qui ci sono le decisioni di gioco, non le firme.

**Acceso da.** `VDAT.ACCESO.eserciti` (rilascio 5, passo 46).

## Scopo

In guerra i signori non vagano più da soli: un maresciallo del regno chiama l'adunata, i signori si radunano e marciano insieme su un obiettivo (assedio, soccorso, razzia). Da vassallo vieni convocato; puoi seguire l'esercito e combattere con lui; da sovrano lo chiami tu.

## Decisioni

1. Ogni regno in guerra ha al più un esercito. Il maresciallo è il signore con più fama/truppe (non il re, salvo regni piccoli). `s.eserciti=[{id,faz,capo,membri:[pid],obiettivo:{tipo,lid},stato:'aduna'|'marcia'|'assedia'|'sciolto',da}]` (facoltativo: assente = nessuno).
2. Sulla mappa un esercito è un solo segnalino grande (stendardo del maresciallo + numero) che si muove alla velocità del più lento; i membri lo seguono in coda (non si disegnano uno per uno).
3. Adunata: 2 giorni per radunarsi entro 6 caselle dal maresciallo; si scioglie dopo l'obiettivo, dopo 15 giorni o se le forze scendono sotto metà.
4. Da vassallo: lettera di convocazione (scena breve, riuso `VVOC`) con giorno e luogo; presentarsi = +fiducia del re e paga di campagna; ignorarla = −relazione col re, alla terza volta perdi il feudo.
5. In un esercito gli scontri usano già le ondate di `VCAM` (`MAX`, `ONDATA`): alleati e nemici si sommano nelle riserve; il maresciallo nemico è il `capoB`.
6. Da sovrano (V4): «Aduna l'esercito» (già esiste `aduna` in `faiRegno`) diventa questo.

## Prove

Da fissare nel passo 03. Bot a 120 giorni: in guerra almeno un esercito si forma per regno in 6 semi su 6; il mondo lasciato a sé non conquista più di oggi ×2 (freno alla valanga, come già in `test_ven_diplomazia.js`); costo di `passo` per un giorno ≤ +20%.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.
