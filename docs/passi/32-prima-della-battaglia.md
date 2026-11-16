---
passo: 32
titolo: Prima della battaglia: la strategia
fase: 8
area: mondo
dopo: [12, 11, 09]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kk-ven-strategia.js
---

# Passo 32 — Prima della battaglia: la strategia

**In breve.** La battaglia si vince anche prima: esplorare, scegliere il campo, l'alba o la notte, l'imboscata, i pali, la retroguardia.

**Acceso da.** `VDAT.ACCESO.consiglio` (rilascio 3, passo 34).

## Scopo

La battaglia si vince anche prima di combattere: sapere chi hai davanti, scegliere il campo, attaccare all'alba o aspettare, tendere un'imboscata, fortificarsi, oppure salvarsi lasciando una retroguardia.

## Leggi prima

`docs/passi/04-ganci.md` (ganci `anteprima`, `scelta`, `scheda`); `motori/28kc-ven-scontro.js` (`campo`, `schieramenti`, solo da leggere); `motori/28kf-ven-anteprima.js`; `VEN.rango` (passo 12), `VCAM.settori` (passo 11), abilità `esplora` del capitano e dei compagni.

## Decisioni

1. **Esplorazione**: `E = esplora` della compagnia; `N = rango` del nemico. L'anteprima mostra:
   - con E ≥ N + 1: numeri esatti per tipo, dottrina, ondate previste;
   - con E = N: numeri arrotondati a 10, dottrina;
   - con E < N: «circa N uomini» e nient'altro.
2. **Scelte strategiche** in `anteprima.scelte=[{k,tx,info,ok,perche}]`, con `k` = `strat:campo`, `strat:alba`…; quelle non possibili si vedono grigie con il perché:
   | Scelta | Quando | Effetto |
   |---|---|---|
   | `campo` | E ≥ N, oppure il nemico ti attacca e tu sei fermo | due terreni estratti dalla casella e da una vicina (`scena`); scegli tu |
   | `alba` | sempre, se non c'è assedio | rimandi all'alba (passano le ore): il nemico può andarsene (rango ≤ 1, 50%) o ricevere rinforzi vicini |
   | `notte` | è notte | attacchi subito: gittata dei tiratori −40% per tutti; con N ≤ 2 il nemico parte in disordine (`fatica0` 30, schierato al centro senza ondate) |
   | `imboscata` | sei in bosco o colline, il nemico viene verso di te, E ≥ N + 1 | settore `imb` per te; il nemico parte in colonna (in `cx`, formazione larga, fermo per 120 istanti) |
   | `fortifica` | ti attaccano e hai 1 ora | pali davanti al settore `cx` (zone nuove `pali` nel campo: cavalli −60% velocità, carica annullata); costa 1 ora e 10 viveri |
   | `retroguardia` | sempre | scegli un reparto che resta: si risolve in automatico una battaglia piccola tra loro e un terzo del nemico; tu scappi senza battaglia |
   | `marcia` | la compagnia ha marciato più di 14 delle ultime 24 ore (le conta un ascoltatore di `ora` in `tu.marcia`) | non è una scelta: dà `fatica0[a]` 25 e un avviso |
3. Il nemico di rango ≥ 3 usa le stesse scelte quando attacca **lui** (imboscata nei boschi se tu esplori poco, notte se sei stanco). Lo si legge dall'avviso dell'incontro («Ti hanno colto di sorpresa»).
4. La scheda della battaglia riceve: `scena` scelta, `ora`, `imboscata`, `zone` con i pali, `fatica0`, `esplora`.

## Stato e contratti

Tutto in `28kk-ven-strategia.js`, attaccato ai ganci:
- `anteprima` → `scelte` e `stima`;
- `scelta` → `k` che cominciano con `strat:`;
- `scheda` → `scena`, `ora`, `imboscata`, `zone` con i pali, `fatica0`, `mod` (notte: `git` ×0,6 per tutti), `esplora`, `morIni`.
`s.incontro.strat` è facoltativo. Le zone `pali` e `imb` e la `colonna` le gestisce già il motore (passo 11). Errori in italiano per ogni scelta non possibile.

## Prove

- `tests/test_ven_p32.js`:
  - l'esplorazione nasconde e mostra i numeri come in tabella;
  - `imboscata` non è possibile in pianura;
  - con `fortifica` la scheda ha i pali;
  - con `retroguardia` il reparto lasciato non torna se la sua battaglia è persa;
  - con `alba` il tempo avanza fino alle 6;
  - salvataggio a metà incontro con `strat` si riapre.
- `tests/test_ven_p32_lento.js`: l'imboscata alza le vittorie a truppe pari di almeno 15 punti; i pali dimezzano i colpi di carica ricevuti.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

Vista dedicata (bastano le scelte generiche del passo 09).

## Fatto quando

Prove verdi e le «Regole per il giocatore» scritte in questo file («Prima della battaglia»).
