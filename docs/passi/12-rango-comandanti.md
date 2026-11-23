---
passo: 12
titolo: Il rango dei comandanti nel mondo
fase: 4
area: mondo
dopo: [04]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte
file:
  - src/js/motori/28kj-ven-rango.js
---

# Passo 12 — Il rango dei comandanti nel mondo

**In breve.** Ogni comandante ha un rango da 0 a 5 che cresce vincendo e si legge prima dello scontro; più è alto, più vale la vittoria.

**Acceso da.** `VDAT.ACCESO.consiglio` (rilascio 3, passo 34): fino ad allora l'esperienza si accumula, ma rango, premi e cattura non entrano in gioco.

## Scopo

Ogni comandante ha un rango da 0 a 5 che cresce con le battaglie vinte e si legge prima dello scontro. Più è alto, più è duro da battere e più vale la vittoria.

## Leggi prima

`docs/passi/04-ganci.md` (ganci `battaglia`, `premio`, `scheda`, `anteprima`, `giorno`; `VEN.probCattura`, `VEN.molt` con `forza`); struttura di `s.sig` e della Volpe (`s.volpe`); `CAPIBANDA`, `RIVALE`; `VEN.anteprima` (passo 09).

## Decisioni

1. **Tutto in `28kj-ven-rango.js`**, con i numeri in `VDAT.RANGO` in testa al file:
   - base per tipo: predoni 0, capibanda 1, carovane e guarnigioni 1, mercenari 2, signore 2, maresciallo (passo 40) 3, re 4;
   - Volpe: 2 + capitolo della rivalità (al massimo 5);
   - rango = min(5, base + floor(esp/6)) + `VEN.opz(s).nem`, tenuto tra 0 e 5;
   - nomi: 0 sprovveduto, 1 accorto, 2 esperto, 3 astuto, 4 maestro di guerra, 5 leggendario.
2. `VEN.rango(s,parte)` → `{r,nome}`; `VEN.rangoCap(s)` → il rango del tuo capitano dall'abilità `comando` (0–1 → 1, 2–3 → 2, 4–5 → 3, oltre → 4).
3. **Esperienza**, sempre attiva (è solo stato in più): un ascoltatore di `battaglia` dà al signore vincitore +1 (+2 se ha battuto te); uno di `giorno` toglie 1 ogni 10 giorni di prigionia. `sg.esp` è facoltativo (assente vale 0).
4. **Solo con `ACCESO.consiglio`**:
   - `premio`: se vinci, xp, fama e bottino × (1 + 0,2·rango); se perdi contro un rango ≥ 4, la fama che perdi si dimezza;
   - `VEN.probCattura` sostituito: 0,8 con `riep.capoKo` (comandante abbattuto, passo 16), 0,3 senza;
   - `VEN.molt(s,'forza',{p})` × (1 + 0,05·rango) nelle battaglie tra IA;
   - `scheda`: `rango:{a:VEN.rangoCap(s),b:rango del nemico}`, `dott:{a:'tu',b:VEN.cult(s,faz)}`, `indole:{b:tratto del signore}`, `esplora:{a:esplorazione della compagnia (compagni compresi),b:rango del nemico}`, `memo` (memoria del signore, la riempie il passo 30);
   - `anteprima`: `loro.rango={r,nome}` e `loro.dott`.

## Stato e contratti

`sg.esp` (facoltativo). `VEN.rango`, `VEN.rangoCap`. Campi della scheda e premi solo dietro l'interruttore.

## Prove

- `tests/test_ven_p12.js`:
  - un signore che vince 6 battaglie sale di 1;
  - la Volpe al capitolo 3 è rango 5;
  - con l'interruttore acceso, la ricompensa contro rango 3 vale 1,6 volte quella contro rango 0, a parità di battaglia;
  - spento, la scheda e i premi sono identici a prima.
- Impronta identica.
- Bot a 120 giorni (`node tools/avventura/ventura.js`): nella PR la distribuzione dei ranghi dei signori (attesa: quasi tutti tra 2 e 4), nessun seme in rovina.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

- Ogni comandante ha un rango, da sprovveduto a leggendario, che si legge prima dello scontro.
- Un signore che vince si fa un nome e sale di rango; in prigionia lo perde poco a poco.
- Più il rango del nemico è alto, più è duro da battere e più valgono fama, esperienza e bottino della vittoria.
- Un comandante di rango alto, se lo abbatti, ha molte più probabilità di restare tuo prigioniero.
- Il rango del tuo capitano dipende dalla sua abilità di comando.

## Correzione (issue #195)

Con l'interruttore acceso il rango nel mondo non cambiava la scala in battaglia (quella sta nei passi 21 e 25) ma rompeva due prove fragili:
- `test_ven_diplomazia` contava le guerre del regno dominante in due soli mondi: il moltiplicatore di forza tra IA cambia le battaglie e quindi la storia del mondo (2 guerre invece di 5 sui semi 12 e 33, ma 24 contro 22 su dieci mondi). Ora conta su quattro mondi;
- `test_ven_p09` e `test_ven_stanza` pretendevano numeri esatti del nemico e gli eventi dell'ultimo passo: col consiglio acceso la vista del nemico è «a spanne» (passo 32) e gli eventi dipendono da quanti passi si fanno. Ora guardano solo ciò che non dipende dall'interruttore.

## Fuori scopo

Comportamento in battaglia (passi 21, 25 e 30), memoria delle tattiche (passo 30).

## Fatto quando

Prove verdi.
