# R1 — Spezzare il motore del mondo (nessun cambio di gioco)

**Scopo.** `motori/28k-ven-mondo.js` (110 KB, una sola chiusura) diventa sei file sotto i 30 KB. Il giocatore non vede nulla; chi esegue le prossime schede legge un quarto del codice.

**Leggi prima.** `motori/28k-ven-mondo.js` solo con `grep -n "^ function \|^ const "` (mappa delle funzioni), il `return{…}` in fondo, `tests/carica.js`, `src/manifest.json` (posizione di `28k`), `motori/CLAUDE.md`.

**Decisioni già prese.**
1. Schema a estensioni, come già fanno i motori «base + espansioni»: `28k` resta `const VEN=(()=>{…})()` con mappa, tempo, movimento, `ordina`, `passo`, `fai`, `scegli`, `salva/apri/migra`. Espone in più `VEN._` = oggetto con gli aiutanti interni che servono agli altri file (`L, TU, part, rnd, relaz, chiave, cella, mappa, dist, aggiungi, togliUomini, nuovaP, …`: solo quelli che servono davvero).
2. I file nuovi, in quest'ordine dopo `28k` nel manifest e nei test:
   - `28ka-ven-ia.js` — `pensa`, `oraNuova`, `giornoNuovo`, guerre/paci, `soccorre`, scontri tra IA (`giraScontro`, `chiudiScontro`).
   - `28kb-ven-economia.js` — prezzi, mercato, paga, viveri, rendite, botteghe, `rinnova`, incarichi.
   - `28kc-ven-scontro.js` — `schieramenti`, `campo`, `esito`, `auto`, assedio (`fasi`, `assedioStato`), tornei e arena.
   - `28kd-ven-corte.js` — diplomazia (`proposta`, alleanze), regno (V4), lealtà, feudi, vittoria.
   - `28ke-ven-gente.js` — gradimento, signori (`memSig`, confidenza), voci (`voce/parla/accoda`, `EFF_VOCI`), incarichi personali.
   Ogni file: `Object.assign(VEN,(()=>{const{L,TU,…}=VEN._;…;return{…}})());` e le funzioni che chiama dagli altri file le prende da `VEN.` (chiamata a runtime: l'ordine di caricamento conta solo per le definizioni).
3. Chiamate incrociate (es. `passo` → `oraNuova`): `28k` chiama `VEN.oraNuova(s)`; i nomi pubblici restano **identici** a oggi, nessuna funzione cambia firma.
4. `tests/carica.js` esporta `VEN_FILES` (l'elenco completo dei file della Ventura in ordine). Tutti i test e `tools/avventura/ventura.js` usano quello al posto del loro `F` (15 file, elenco: `grep -rln 28k-ven-mondo tests tools`).
5. `28k` resta il solo posto che dichiara `VEN`; la guardia `module.exports` va in fondo all'**ultimo** file (`28ke`), che esporta `VEN`.

**Prova d'identità (il cancello).** Prima di toccare il codice, su `main`: script `tools/avventura/impronta.js` (nuovo, 30 righe) che per i semi 3, 11, 29 fa giocare `bot_ven.js` 60 giorni e stampa lo sha1 di `VEN.salva(s)` più `VCAM.risolvi` di 5 schede fisse. Salva l'uscita in `docs/schede/R1-impronta.txt`. Dopo lo spezzamento l'uscita deve essere **identica byte per byte**.

**Passi.** 1) `impronta.js` + file di riferimento (commit). 2) Spostare un blocco per volta (un commit per file nuovo), rilanciando `node tools/avventura/impronta.js | diff - docs/schede/R1-impronta.txt` dopo ognuno. 3) `carica.js` e test. 4) manifest, `npm run struttura`, `npm run mappa`. 5) Aggiornare la riga della Ventura in `docs/moduli/ventura.md` (nuovi file, chi fa cosa).

**Prove.** Impronta identica; `npm test -- ven_` (tutti, anche i lenti) verdi; scenari browser `ventura`, `ventura_stanza`, `ventura_assedio`, `ventura_regno` verdi.

**Fuori scopo.** Rinominare funzioni, cambiare numeri, «sistemare» codice strano: se qualcosa sembra un errore si annota in fondo alla PR, non si corregge.

**Fatto quando.** Nessun file della Ventura nei motori supera 35 KB, impronta identica, test e scenari verdi.
