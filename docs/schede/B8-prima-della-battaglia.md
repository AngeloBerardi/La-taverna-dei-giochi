# B8 — Prima della battaglia: la strategia

**Binario** C (mondo). **Dopo** B9 e B1 unite. **Spento finché** `VDAT.ACCESO.consiglio` è falso (X2). Le scelte compaiono nell'incontro senza toccare la vista, perché U3 mostra `anteprima.scelte` in modo generico.

**Scopo.** La battaglia si vince anche prima di combattere: sapere chi hai davanti, scegliere il campo, attaccare all'alba o aspettare, tendere un'imboscata, fortificarsi, oppure salvarsi lasciando una retroguardia.

**Leggi prima.** `motori/28kc-ven-scontro.js` (`campo`, `schieramenti`, `scegli` per gli incontri, `esito`), `motori/28kf-ven-anteprima.js`, `VEN.rango` (B9), `VCAM.settori` (B1), abilità `esplora` del capitano e dei compagni.

**Decisioni già prese.**
1. **Esplorazione**: `E = esplora` della compagnia; `N = rango` del nemico. L'anteprima mostra:
   - con E ≥ N + 1: numeri esatti per tipo, dottrina, ondate previste;
   - con E = N: numeri arrotondati a 10, dottrina;
   - con E < N: «circa N uomini» e nient'altro.
2. **Scelte strategiche** in `anteprima.scelte=[{k,tx,info,ok,perche}]`; quelle non possibili si vedono grigie con il perché:
   | Scelta | Quando | Effetto |
   |---|---|---|
   | `campo` | E ≥ N, oppure il nemico ti attacca e tu sei fermo | due terreni estratti dalla casella e da una vicina (`scena`); scegli tu |
   | `alba` | sempre, se non c'è assedio | rimandi all'alba (passano le ore): il nemico può andarsene (rango ≤ 1, 50%) o ricevere rinforzi vicini |
   | `notte` | è notte | attacchi subito: gittata dei tiratori −40% per tutti; con N ≤ 2 il nemico parte in disordine (`fatica0` 30, schierato al centro senza ondate) |
   | `imboscata` | sei in bosco o colline, il nemico viene verso di te, E ≥ N + 1 | settore `imb` per te; il nemico parte in colonna (in `cx`, formazione larga, fermo per 120 istanti) |
   | `fortifica` | ti attaccano e hai 1 ora | pali davanti al settore `cx` (zone nuove `pali` nel campo: cavalli −60% velocità, carica annullata); costa 1 ora e 10 viveri |
   | `retroguardia` | sempre | scegli un reparto che resta: si risolve in automatico una battaglia piccola tra loro e un terzo del nemico; tu scappi senza battaglia |
   | `marcia` | hai marciato a ×4 nelle ultime 6 ore | non è una scelta: dà `fatica0[a]` 25 come avviso |
3. Il nemico di rango ≥ 3 usa le stesse scelte quando attacca **lui** (imboscata nei boschi se tu esplori poco, notte se sei stanco). Lo si legge dall'avviso dell'incontro («Ti hanno colto di sorpresa»).
4. La scheda della battaglia riceve: `scena` scelta, `ora`, `imboscata`, `zone` con i pali, `fatica0`, `esplora`.

**Stato e contratti.** `s.incontro.strat={campo?,alba?,imb?,forte?,retro?}` (facoltativo). `VEN.scegli(s,{k:'strat',v,…})`. Errori in italiano per ogni scelta non possibile. Il tocco in `28l` (zona `pali`) è del **binario B**: 15 righe, solo se B non ha PR aperte su `28l`; altrimenti si apre una mini-scheda B8m nel binario B.

**Prove.**
- `tests/test_ven_mondo.js`:
  - l'esplorazione nasconde e mostra i numeri come in tabella;
  - `imboscata` non è possibile in pianura;
  - con `fortifica` la scheda ha i pali;
  - con `retroguardia` il reparto lasciato non torna se la sua battaglia è persa;
  - con `alba` il tempo avanza fino alle 6;
  - salvataggio a metà incontro con `strat` si riapre.
- `test_ven_tattica.js`: l'imboscata alza le vittorie a truppe pari di almeno 15 punti; i pali dimezzano i colpi di carica ricevuti.

**Fuori scopo.** Vista dedicata (bastano le scelte generiche di U3).

**Fatto quando.** Prove verdi e una sezione «Prima della battaglia» in `docs/rules/ventura.md`.
