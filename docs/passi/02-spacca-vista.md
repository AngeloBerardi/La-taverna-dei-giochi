---
passo: 02
titolo: Spezzare la vista
fase: 1
area: fondamenta
dopo: []
agente: programmer
modello: sonnet
impegno: medio
controllo: forte
file:
  - src/js/app/24hw-ventura.js
  - src/js/app/24hwa-ven-barre.js
  - src/js/app/24hwb-ven-luoghi.js
  - src/js/app/24hwc-ven-gente.js
  - src/js/app/24hwd-ven-scontro.js
  - src/js/app/24hwe-ven-tv.js
  - src/css/39j-ventura.css
  - src/css/39ja-ven-barre.css
  - src/css/39jb-ven-pannelli.css
  - src/css/39jc-ven-campo.css
  - src/manifest.json
  - tools/test-browser/run.py
  - tools/test-browser/rif/*
  - tools/test-browser/scenari/LEGGIMI.md
---

# Passo 02 — Spezzare la vista

**In breve.** La vista della Ventura (69 KB) diventa cinque file, e il suo CSS quattro. Gli scenari del browser imparano a stare in file separati, così da qui in poi nessun passo tocca più `run.py`.

## Scopo

`app/24hw-ventura.js` (69 KB) diventa cinque file, e il CSS quattro. I passi della vista toccheranno solo il file del loro pannello.

## Leggi prima

`app/24hw-ventura.js` con `grep -n "^ function \|^ const [a-zA-Z]*H="`, il `return` di `Ven`, `src/manifest.json`, `app/CLAUDE.md`.

## Decisioni

1. `24hw-ventura.js` tiene: stato `V`; `entra/esci/ferma/dopo/riprova/ripara/giro/mondo/hudVivo/gesti/tocco`; `html`, `act`, `inBattaglia`, `fineBattaglia`; gli aiutanti comuni (`bt`, `riga`, `sezioneH`, `avviso`, `avvisiH`, `tu`, `mio`, `doti`, `oggH`), esposti come `Ven._`.
2. **File nuovi**, subito dopo nel manifest, ognuno `const VenX=(()=>{…})()` che legge gli aiutanti da `Ven._`:
   - `24hwa-ven-barre.js`: `altoH`, `tastiH`, `bassoH`, `ctlH`, `menuH`, `cartaH`, `cartaMondoH`.
   - `24hwb-ven-luoghi.js`: `luogoH`, `contoH`, `torneoH`, `truppaH`, `diploH`, `fondaH`, `sovranoH`, `passaH`, `coronaH`, `vittoriaH`, `fasiH`.
   - `24hwc-ven-gente.js`: `compagniaH`, `capitanoH`, `diarioH`, `gradH`, `confH`, `incH`, `voceH`, `schieraH`.
   - `24hwd-ven-scontro.js`: `incontroH`, `esitoH`, `attesaH`, `campoH`.
   - `24hwe-ven-tv.js`: `tvH`, `campoTvH`. La TV ha un file suo perché la toccano passi diversi in fasi diverse.
3. `html()` chiama i pannelli tramite i nuovi oggetti (`VenBarre.altoH()` …). Nomi delle funzioni invariati; nessun testo e nessuna classe CSS cambiano.
4. Il CSS `39j-ventura.css` (16 KB) si divide allo stesso modo in `39j` (comune), `39ja-ven-barre.css`, `39jb-ven-pannelli.css` e `39jc-ven-campo.css`, mantenendo l'ordine delle regole (il cascade non deve cambiare).
5. **Scenari in file propri.** In `tools/test-browser/run.py`, subito prima della riga `SCENARI = …`, carica in ordine di nome ogni `tools/test-browser/scenari/*.py` con `exec(open(f).read(), globals())`. Crea la cartella con un `LEGGIMI.md` di tre righe: uno scenario per passo (`scenari/pNN.py`), funzioni `sc_pNN_…`, si lancia con `python3 tools/test-browser/run.py pNN`. Da qui in poi nessun passo tocca più `run.py`.
6. Il manifest lo tocca anche il passo 01, ma in righe lontane (motori contro viste): non ci sono conflitti. Non lanciare `npm run mappa`: lo fa il passo 04 per tutti.

## Ordine di lavoro

1. Lo scenario di riferimento (punto qui sotto) e il caricatore degli scenari (un commit).
2. Un file della vista alla volta, con lo scenario verde dopo ognuno.
3. Il CSS.
4. Manifest, `npm run struttura`.

## Prove

Prima di cominciare, su `main`: scenario `ventura` lanciato con una piccola aggiunta (in `run.py`, funzione `sc_ventura_html`) che salva `document.querySelector('.vn').outerHTML` in sei momenti (mondo, menu, luogo, mercato, incontro, battaglia ferma) dopo aver fissato il seme e l'ora. Dopo lo spezzamento gli HTML sono identici (confronto di stringhe nello scenario stesso, con i sei riferimenti in `tools/test-browser/rif/`).

`sc_ventura_html` identico; scenari `ventura`, `ventura_tattica`, `ventura_tv`, `ventura_voci`, `ventura_regno` verdi.

## Fuori scopo

Qualunque ritocco grafico (sono i passi della vista).

## Fatto quando

Nessun file della vista oltre 25 KB; HTML identici; scenari verdi; `tools/test-browser/scenari/` caricata da `run.py`.
