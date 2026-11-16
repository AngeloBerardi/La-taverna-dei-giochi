# B9 — Il rango dei comandanti nel mondo

**Binario** C (mondo). **Dopo** R1 (può andare in parallelo a B0–B2b: non tocca `28l`). **Spento finché** `VDAT.ACCESO.consiglio` è falso (X2): il rango si calcola e si salva, ma non entra nella scheda della battaglia.

**Scopo.** Ogni comandante ha un rango da 0 a 5 che cresce con le battaglie vinte e si legge prima dello scontro. Più è alto, più è duro da battere e più vale la vittoria.

**Leggi prima.** `motori/28k*` dopo R1: `campo` e `esito` (in `28kc`), struttura di `s.sig` (in `28k`/`28kd`), `CAPIBANDA`, `RIVALE`, la Volpe (`s.volpe`); `VEN.anteprima` (in `28kf`, creata da U3; se U3 non è unita, crearla qui con lo stesso contratto).

**Decisioni già prese.**
1. `VDAT.RANGO` (numeri qui):
   - base per tipo: predoni 0, capibanda 1, carovane e guarnigioni 1, mercenari 2, signore 2, maresciallo (da M1) 3, re 4;
   - Volpe: 2 + capitolo della rivalità (al massimo 5);
   - esperienza: `sg.esp`, +1 per battaglia vinta (+2 se contro di te); rango = min(5, base + floor(esp/6));
   - nomi da mostrare: 0 sprovveduto, 1 accorto, 2 esperto, 3 astuto, 4 maestro di guerra, 5 leggendario.
2. `VEN.rango(s,parte)` → `{r,nome}` (puro). Il signore prigioniero perde 1 di esperienza per ogni 10 giorni di prigionia.
3. **Ricompense**: quando vinci, xp, fama e bottino × (1 + 0,2·rango); quando perdi contro un rango ≥ 4, la fama scende di meno (−50%): non è una vergogna.
4. **Nella scheda** (solo con `ACCESO.consiglio`):
   - `rango:{a:r del tuo capitano, b:rango del nemico}`; il tuo dipende dall'abilità `comando` (come in B2a);
   - `dott:{a:'tu', b:dottrina del regno}`; `indole:{b:tratto del signore}`;
   - `esplora:{a:abilità esplora della compagnia, compagni compresi, b:rango del nemico}`;
   - `memo` dal signore (per B2c).
5. **Anteprima**: `VEN.anteprima(s)` aggiunge `loro.rango={r,nome}` e `loro.dott`. La vista dell'incontro (U3) li mostra già, perché legge i campi in modo generico.
6. Le battaglie IA contro IA del mondo usano il rango come piccolo vantaggio nel conto automatico di oggi: forza × (1 + 0,05·rango).

**Stato e contratti.** `sg.esp` (facoltativo, assente → 0). `VEN.rango`. Campi della scheda solo dietro l'interruttore.

**Prove.**
- `tests/test_ven_mondo.js`:
  - un signore che vince 6 battaglie sale di 1;
  - la Volpe al capitolo 3 è rango 5;
  - ricompensa contro rango 3 = 1,6× quella contro rango 0, a parità di battaglia;
  - senza interruttore la scheda è identica a prima.
- Bot a 120 giorni (`node tools/avventura/ventura.js`): distribuzione dei ranghi dei signori nella PR (attesa: quasi tutti tra 2 e 4), nessun seme in rovina.

**Fuori scopo.** Comportamento in battaglia (B2), memoria delle tattiche (B2c).

**Fatto quando.** Prove verdi e una sezione «Il rango» in `docs/rules/ventura.md`.
