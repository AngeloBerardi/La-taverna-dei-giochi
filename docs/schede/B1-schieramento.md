# B1 — Reparti, settori e ondate (motore)

**Binario** B. **Dopo** B0. **Spento finché** la scheda non ha `reparti`/`ondate` (X1). La vista è B1v, nel binario D.

**Scopo.** Prima del «Via» si divide la compagnia in reparti, li si mette nei settori concessi dal terreno e dall'esplorazione, e si preparano fino a due ondate: con cosa, da dove entrano (anche di fianco) e quando. Il comandante con l'esplorazione peggiore si schiera per primo; l'altro vede e risponde.

**Leggi prima.** `motori/28l-ven-campo.js`: `nuovo` (riparto per gruppo, `posto`, `passoFm`), `ordina` (`s.ord[l][g]`), `formazione`, `istante` (rinforzi), `gruppi`, `forme`; `motori/28m-ven-stanza.js` (ordini di battaglia in compagnia, `grep -n "VCAM\." 28m`). Dipende da B0.

**Decisioni già prese.**
1. **Reparti**: `u.r` (0..7) oltre a `u.c`. `s.ord[l]` diventa un array per reparto `[{c,fm,t,x,y,…}]`. Senza `scheda.reparti`: tre reparti 0/1/2 = f/t/c, identici a oggi. `ordina({g})` resta valido e vale per tutti i reparti di quel tipo; `ordina({r})` per uno solo. Al massimo **6 reparti in campo** per lato, almeno 4 uomini per reparto, un solo tipo per reparto.
2. **Settori**: `VCAM.settori(s,l)` → `[{id,x0,x1,y0,y1,k}]` dal terreno e dalla scheda, mai salvati.
   - Base: `sx`, `cx`, `dx` (tre terzi della fascia propria, profonda 30 passi; 36 se `scheda.esplora[l]≥3`).
   - `avan`: fascia di 12 passi più avanti, solo se `esplora[l] > esplora[altro]`.
   - `alt`: altura nella propria metà.
   - `imb`: bosco nel terzo centrale, solo con `scheda.imboscata===l` (da B8).
   - Ingressi delle ondate: `fsx`, `fdx` (bordi laterali nel terzo centrale) e `retro` (il proprio bordo).
   - In assedio: il difensore ha `mura` e `cortile`; l'attaccante solo `cx` più l'ingresso `retro`.
3. **Schierare**: `VCAM.schiera(s,{l,r,x,y})` solo a `t===0` e dentro un settore valido; rimette il reparto in fila con `posto`. `VCAM.dividi(s,{l,r})` divide a metà (nuovo reparto accanto); `VCAM.unisci(s,{l,r,r2})` unisce due reparti dello stesso tipo. La formazione a `t===0` cambia senza attesa.
4. **Ondate**: `s.ond[l]=[{id,tr:[{t,n}],ing:'retro'|'fsx'|'fdx',quando:{k:'comando'|'linea'|'tempo',v},ord:'carica'|'tieni'|'segui',fatta:false}]`, al massimo 2. Le truppe di un'ondata **non** entrano con i rinforzi automatici. Scattano col comando del giocatore (`VCAM.ondata(s,{l,id})`), oppure quando gli uomini vivi in campo scendono sotto `v`% di quelli iniziali (`linea`), oppure all'istante `v` (`tempo`). Entrano come reparti nuovi dal loro ingresso, 2 passi dentro il bordo, a gruppi di `ONDATA` per istante finché c'è posto sotto il tetto. Evento `{t:'ondata',l,id,ing}`.
   - `VCAM.preparaOndata(s,{l,id,tr,ing,quando,ord})` solo a `t===0`.
   - Le truppe non assegnate né al campo né alle ondate restano **riserva generale** con i rinforzi automatici di oggi.
5. **Chi si schiera per primo**: `scheda.esplora={a,b}` (assente → 0). Il lato con l'esplorazione minore (a parità il lato `a`) è `s.primo`. Quando il lato `a` preme «Pronto» (`VCAM.pronto(s,'a')`) e il lato `b` è secondo, l'IA rifà il proprio schieramento guardando il tuo (con B2a: `consiglio.schiera`; prima di B2a resta quello di nascita). Se secondo sei tu, vedi subito lo schieramento nemico.
6. **IA alla nascita** (prima di B2a): il lato `b` mette i reparti come oggi e non prepara ondate.
7. **Compagnia**: chiunque schiera qualunque reparto; le mosse nuove (`schiera`, `dividi`, `unisci`, `prepara`, `ondata`, `pronto`) passano come gli altri ordini con `seat` (tocco del binario C in `28m`, al massimo 20 righe).

**Stato e contratti.** Scheda: `reparti` (true per usarli), `ondate` (true per permetterle), `esplora:{a,b}`, `imboscata`. Stato: `u.r`, `s.ord[l][]`, `s.ond`, `s.primo`, `s.pronto`. Funzioni: `settori`, `schiera`, `dividi`, `unisci`, `preparaOndata`, `ondata`, `pronto`, `reparti(s,l)` → `[{r,c,n,fm,mor}]` per la vista. Errori in italiano: `'La battaglia è già cominciata'`, `'Lì non puoi schierarti'`, `'Troppi reparti'`, `'Reparto troppo piccolo'`, `'Ondata già partita'`, `'Non ci sono più truppe da assegnare'`.

**Passi.** 1) Reparti con l'equivalenza a tre (impronta identica). 2) `settori`. 3) `schiera`, `dividi`, `unisci`. 4) Ondate e scatti. 5) `primo` e `pronto`. 6) Mosse in `28m`. 7) Una sezione «Reparti, settori e ondate» in `docs/rules/ventura.md`.

**Prove.**
- Impronta identica senza i campi nuovi.
- `test_ven_campo.js`:
  - dividere 20 fanti dà 10+10;
  - schierare fuori settore restituisce errore;
  - `avan` esiste solo con esplorazione superiore;
  - un'ondata `fsx` con `quando:{k:'linea',v:50}` entra dal bordo sinistro nel primo istante in cui la linea scende sotto il 50% e non prima;
  - un'ondata a comando non entra mai da sola;
  - le truppe delle ondate non compaiono nei rinforzi automatici;
  - 7 reparti restituisce errore;
  - stesso seme → stesso esito con schieramento e ondate.
- `test_ven_stanza.js`: `schiera` e `ondata` dal secondo telefono danno lo stesso stato su entrambi.

**Fuori scopo.** Pannello di schieramento (B1v), IA che schiera e usa le ondate (B2a, B2b).

**Fatto quando.** Prove verdi e impronta identica.
