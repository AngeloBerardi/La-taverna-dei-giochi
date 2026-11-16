# R2 — Spezzare la vista della Ventura (nessun cambio visibile)

**Scopo.** `app/24hw-ventura.js` (69 KB) diventa quattro file. Le schede U1–U4 toccheranno solo il file del loro pannello.

**Leggi prima.** `app/24hw-ventura.js` con `grep -n "^ function \|^ const [a-zA-Z]*H="`, il `return` di `Ven`, `src/manifest.json`, `app/CLAUDE.md`.

**Decisioni già prese.**
1. `24hw-ventura.js` tiene: stato `V`, `entra/esci/ferma/dopo/riprova/ripara/giro/mondo/hudVivo/gesti/tocco`, `html`, `act`, `inBattaglia`, `fineBattaglia`, aiutanti comuni (`bt`, `riga`, `sezioneH`, `avviso`, `avvisiH`, `tu`, `mio`, `doti`, `oggH`).
2. File nuovi, subito dopo nel manifest, ognuno `const VenP…=(()=>{…})()` che legge gli aiutanti da `Ven._` (esposto dal primo file):
   - `24hwa-ven-barre.js` — `altoH`, `tastiH`, `bassoH`, `ctlH`, `tvH`, `campoTvH`, `menuH`, `cartaH`, `cartaMondoH`.
   - `24hwb-ven-luoghi.js` — `luogoH`, `contoH`, `torneoH`, `truppaH`, `diploH`, `fondaH`, `sovranoH`, `passaH`, `coronaH`, `vittoriaH`, `fasiH`.
   - `24hwc-ven-gente.js` — `compagniaH`, `capitanoH`, `diarioH`, `gradH`, `confH`, `incH`, `voceH`, `schieraH`.
   - `24hwd-ven-scontro.js` — `incontroH`, `esitoH`, `attesaH`, `campoH`.
3. `html()` chiama i pannelli tramite i nuovi oggetti (`VenBarre.altoH()` …). Nomi delle funzioni invariati, nessun testo cambiato, nessuna classe CSS cambiata.
4. Il CSS `39j-ventura.css` (16 KB) si divide allo stesso modo in `39j` (comune), `39ja-ven-barre.css`, `39jb-ven-pannelli.css`, `39jc-ven-campo.css`, mantenendo l'ordine delle regole (il cascade non deve cambiare).

**Prova d'identità.** Prima di cominciare, su `main`: scenario `ventura` lanciato con una piccola aggiunta (in `run.py`, funzione `sc_ventura_html`) che salva `document.querySelector('.vn').outerHTML` in sei momenti (mondo, menu, luogo, mercato, incontro, battaglia ferma) dopo aver fissato il seme e l'ora. Dopo lo spezzamento gli HTML sono identici (confronto di stringhe nello scenario stesso, con i sei riferimenti in `tools/test-browser/rif/`).

**Passi.** 1) Scenario di riferimento (commit). 2) Un file alla volta, scenario verde dopo ognuno. 3) CSS. 4) manifest, `npm run struttura`, `npm run mappa`, riga in `docs/moduli/ventura.md`.

**Prove.** `sc_ventura_html` identico; scenari `ventura`, `ventura_tattica`, `ventura_tv`, `ventura_voci`, `ventura_regno` verdi.

**Fuori scopo.** Qualunque ritocco grafico (sono le schede U).

**Fatto quando.** Nessun file della vista oltre 25 KB, HTML identici, scenari verdi.
