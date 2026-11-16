---
passo: 20
titolo: Rilascio 1: interfaccia
fase: 6
area: rilascio
dopo: [08, 09, 13, 18]
agente: programmer
modello: sonnet
impegno: basso
controllo: visivo
file:
  - docs/rilasci.md
---

# Passo 20 — Rilascio 1: interfaccia

**In breve.** Collaudo della nuova interfaccia così come la vede chi gioca. Non c'è niente da accendere (è già online): si fa una prova d'insieme e si scrive la nota di rilascio.

## Scopo

Verificare in un solo giro che HUD, città, mercato, incontro e menu (passi 08, 09, 13 e 18) stiano insieme bene sul telefono, e annotare i difetti senza correggerli qui.

## Leggi prima

I «Fatto quando» dei passi 08, 09, 13 e 18; `docs/STYLE.md`.

## Decisioni

1. Scenario `scenari/p20.py` che percorre menu Avventura → Nuova campagna (Condottiero) → mondo (HUD, foglio Compagnia) → città → mercato (compra e vendi) → incontro → battaglia → esito, a 390×844 e a 360×640, con 8 screenshot.
2. Controlli automatici a ogni schermata:
   - al massimo un ottone;
   - bersagli di almeno 44 px;
   - nessun testo tagliato (`scrollWidth ≤ clientWidth` sui pulsanti);
   - nessun errore in console.
3. Ogni difetto diventa una issue GitHub (`gh api repos/AngeloBerardi/La-taverna-dei-giochi/issues`) con titolo «Interfaccia: …». Qui non si corregge.
4. `docs/rilasci.md` (nuovo): sezione «Rilascio 1: interfaccia», con cosa cambia per chi gioca (5 righe) e l'elenco delle issue.

## Prove

Lo scenario è verde, tranne i difetti già aperti come issue.

## Fatto quando

Nota di rilascio scritta e screenshot guardati dal controllo visivo.
