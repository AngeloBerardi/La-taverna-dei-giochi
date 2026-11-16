---
passo: 35
titolo: La sfida al capo
fase: 9
area: mondo
dopo: [16, 09, 29]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kl-ven-sfida.js
---

# Passo 35 — La sfida al capo

**In breve.** Prima di una battaglia contro un signore, un capobanda o la Volpe, il capitano ne sfida il capo a duello davanti alle schiere.

## Scopo

Prima di una battaglia contro un signore, un capobanda o la Volpe, il capitano può sfidarne il capo a duello davanti alle schiere. Vincere mette paura al nemico (o lo fa arrendere, se sono predoni); perdere costa sangue e morale. È nostro: riusa l'arena dei tornei.

## Leggi prima

`docs/passi/04-ganci.md` (ganci `anteprima`, `scelta`, `scheda`, `esito`); `motori/28kc-ven-scontro.js`, solo da leggere: `campoArena`, `esitoArena`, `statArena`, `feritoOggi`; `motori/28j-ven-dati.js`: `TRATTI`, `CAPIBANDA`, `RIVALE`, `SIG`; `motori/28m-ven-stanza.js` (come arriva `scegli` in compagnia, solo da leggere). La vista non si tocca: il bottone arriva da `anteprima.scelte` (passo 09). Dipende dal passo 16 (`VDAT.SIG_CAMPO`, `capoB`) e il passo 09.

## Decisioni

1. Possibile se il primo nemico è un signore, un capobanda o la Volpe, una volta per incontro, non in assedio.
2. **Accetta?** Conto in chiaro come la diplomazia, senza dadi: prode sì; crudele sì se il suo livello (o 5) ≥ quello del capitano; avido sì se metti in palio 100 monete (pagate solo se perdi); prudente no («Non rischio la testa per il tuo orgoglio»); capibanda e Volpe sì. Il rifiuto davanti ai suoi costa al nemico −10 di morale all'inizio della battaglia.
3. Il duello è una battaglia `tipo:'arena'` con un solo avversario: il capitano che sfida (statistiche di `statArena`) contro il capo (`VDAT.SIG_CAMPO`, capibanda e Volpe dai loro dati), stessa resa dei tornei.
4. **Esiti**: vinto → `s.incontro.sfida='vinta'`: fama +5, e alla battaglia morale nemico −20 e il capo parte ferito al 50%; contro **predoni** la banda si arrende: niente battaglia, metà bottino come una vittoria (`esito` con una battaglia vinta senza caduti) e il capobanda prigioniero. Perso → capitano al 50% fino a sera (`s.ferito`, come in lizza) e morale proprio −15; si torna all'incontro (puoi ancora ritirarti o pagare).
5. In compagnia sfida il capitano del telefono che tocca (`seat`); gli altri vedono il duello.

## Stato e contratti

Tutto in `28kl-ven-sfida.js`, attaccato ai ganci:
- `anteprima` → la scelta `sfida` (con `ok`, `perche` e il conto in `info`);
- `scelta` → `k:'sfida'` mette `s.incontro.sfida='duello'`;
- `scheda` → durante il duello **restituisce** la scheda dell'arena (capitano che sfida contro il capo); nella battaglia vera aggiunge `morIni` e il capo ferito;
- `esito` → durante il duello **gestisce** il risultato (vinta o persa, ferita, fama, resa dei predoni) e restituisce, così l'esito normale non si fa.

`s.incontro.sfida` ∈ `undefined|'duello'|'vinta'|'persa'|'rifiutata'`. `VEN.sfidaOk(s)` → `{ok,f:[{n,v}],tx}`.

Errori: `'Qui non c'è nessun capo da sfidare'`, `'Hai già sfidato'`, `'Non durante un assedio'`.

## Ordine di lavoro

1. `sfidaOk` e il suo test.
2. Duello e ritorno all'incontro.
3. Effetti nella battaglia e resa dei predoni.
4. Scelta nell'anteprima.

## Prove

Nuovo `tests/test_ven_p35.js`: prudente rifiuta; avido chiede la posta; capitano livello 8 ben armato contro un capobanda vince ≥ 60% su 30 semi, livello 1 ≤ 40%; dopo una vittoria contro predoni nessuna battaglia e `stat.vinte` +1; dopo una sconfitta `s.ferito` = oggi; morali iniziali −20/−15/−10 nei tre casi. `tests/test_ven_p35.js`: la sfida dal secondo telefono usa il suo capitano. Scenario `scenari/p35.py`: incontro forzato con un capobanda → sfida → duello → vittoria → resa. Screenshot del duello a 390 px.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

Duelli tra signori dell'IA.

## Fatto quando

Prove verdi; la sfida compare solo quando è possibile.
