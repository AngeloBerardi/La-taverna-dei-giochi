---
passo: 03
titolo: Completare le tracce del mondo vivo
fase: 1
area: progetto
dopo: []
agente: architetto
modello: opus
impegno: alto
controllo: leggero
file:
  - docs/passi/04-ganci.md
  - docs/passi/40-eserciti.md
  - docs/passi/41-feudi.md
  - docs/passi/42-testi-crocevia.md
  - docs/passi/43-affari.md
  - docs/passi/44-crocevia.md
  - docs/passi/45-feudi-vista.md
---

# Passo 03 — Completare le tracce del mondo vivo

**In breve.** Le quattro idee del mondo «alla Mount & Blade» (eserciti, feudi, affari, incontri del crocevia) oggi sono tracce: decisioni di gioco senza firme. Questo passo le trasforma in passi completi, così dalla fase 10 in poi si eseguono con Sonnet come gli altri.

## Scopo

Completare i passi 40–45 con firme, stato, numeri e prove, sullo stesso modello dei passi già pronti (per esempio `12-rango-comandanti.md`).

## Leggi prima

`docs/passi/LEGGIMI.md`, `docs/passi/04-ganci.md` (i ganci e i file vuoti su cui costruire), i passi 40–45 così come sono. Del codice, solo le firme che servono (`grep -n`): IA dei signori, economia, feudi e regno, scene delle voci in `28k-ven-mondo.js`. Il passo 01 forse non è ancora unito: i nomi dei file dopo lo spezzamento sono nel passo 01.

## Decisioni

1. Ogni traccia diventa un passo completo con le sezioni standard, al massimo 70 righe.
2. Si costruisce **solo** sui ganci del passo 04, ognuno nel file vuoto che gli è già assegnato:
   - passo 40 → `28kn-ven-eserciti.js`;
   - passo 41 → `28ko-ven-feudi.js`;
   - passo 43 → `28kp-ven-affari.js`;
   - passo 44 → `28kq-ven-crocevia.js`;
   - passo 45 → la vista di feudi e affari: `24hu-ven-mappa.js`, `24ht-ven-arte.js` (edifici sul modellino) e `24hwb-ven-luoghi.js` (tessera «Cantiere»). I passi 41, 43 e 44 restano solo motore: le botteghe del 43 si raccontano nel diario, gli incontri del 44 usano le scene delle voci, che la vista mostra già;
   - passo 42 → `VVOC.CROCEVIA` in `28ja-ven-voci.js`.
   Se serve un gancio che il passo 04 non prevede, aggiungilo all'elenco del passo 04: non è ancora stato eseguito, quindi si può.
3. Le decisioni di gioco già scritte nelle tracce sono dell'utente: non cambiarle. Precisa numeri, firme, stato salvato, interruttore (gli eserciti si accendono con `VDAT.ACCESO.eserciti`) e prove con i numeri attesi.
4. Il campo `file:` di ogni passo elenca esattamente i file che toccherà. Due passi della stessa fase non toccano mai lo stesso file: lo controlla `npm run passi`.

## Prove

`npm run passi` dice OK. Ogni passo completato ha «Prove» con numeri attesi e «Fatto quando».

## Fatto quando

I passi 40–45 non hanno più la nota «Traccia» e `npm run passi` dice OK.
