---
passo: 39
titolo: Le voci dei compagni sullo schermo
fase: 10
area: viste
dopo: [28, 10, 31]
agente: programmer
modello: sonnet
impegno: basso
controllo: visivo
file:
  - src/js/app/24hv-ven-campo.js
  - src/js/app/24hwe-ven-tv.js
  - src/css/39jc-ven-campo.css
---

# Passo 39 — Le voci dei compagni sullo schermo

**In breve.** Quando un compagno grida, la frase compare sopra di lui per un attimo e passa nella cronaca della TV.

## Scopo

Chiudere il lavoro sui compagni: il motore (passo 28) emette `grida`, i testi (passo 10) stanno in `VVOC.CAMPO`.

## Leggi prima

`eventi` in `24hv`; la cronaca in `24hwe`; `VVOC.CAMPO`.

## Decisioni

1. Fumetto di legno sopra il compagno per 2 s; se è fuori schermo, in basso a sinistra con il nome.
2. Frase scelta in modo ripetibile: `VVOC.CAMPO[chi][k][s.t%2]`.
3. Sulla TV la riga entra nella cronaca della battaglia.

## Prove

Scenario `scenari/p39.py` con `?ven=grandi`: in battaglia con Berta compare un `.vn-fumetto`. Screenshot a 390 px.

## Fatto quando

Lo scenario è verde e lo screenshot è guardato.
