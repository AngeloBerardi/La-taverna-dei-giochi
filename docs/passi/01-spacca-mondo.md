---
passo: 01
titolo: Spezzare il motore del mondo
fase: 1
area: fondamenta
dopo: []
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28k-ven-mondo.js
  - src/js/motori/28ka-ven-ia.js
  - src/js/motori/28kb-ven-economia.js
  - src/js/motori/28kc-ven-scontro.js
  - src/js/motori/28kd-ven-corte.js
  - src/js/motori/28ke-ven-gente.js
  - src/manifest.json
  - tests/carica.js
  - tests/tutti.js
  - tests/test_ven_assedio.js
  - tests/test_ven_audio.js
  - tests/test_ven_campo.js
  - tests/test_ven_diplomazia.js
  - tests/test_ven_diplomazia_bot.js
  - tests/test_ven_mondo.js
  - tests/test_ven_personaggi.js
  - tests/test_ven_personaggi_bot.js
  - tests/test_ven_regno.js
  - tests/test_ven_regno_bot.js
  - tests/test_ven_stanza.js
  - tests/test_ven_tattica.js
  - tests/test_ven_torneo_bot.js
  - tests/test_ven_voci.js
  - tests/test_ven_voci_bot.js
  - tests/bot_ven.js
  - tools/avventura/*.js
  - tests/fixture/ven/*
  - docs/passi/impronte/*
  - docs/ARCHITECTURE.md
---

# Passo 01 — Spezzare il motore del mondo

**In breve.** Il motore del mondo (110 KB, una sola chiusura) diventa sei file sotto i 30 KB. Il gioco non cambia di un bit, e l'impronta lo prova. Il passo prepara anche i salvataggi di prova e le convenzioni dei test che useranno tutti i passi.

## Scopo

`motori/28k-ven-mondo.js` (110 KB, una sola chiusura) diventa sei file sotto i 30 KB. Il giocatore non vede nulla; chi esegue i prossimi passi legge un quarto del codice.

## Leggi prima

`motori/28k-ven-mondo.js` solo con `grep -n "^ function \|^ const "` (mappa delle funzioni), il `return{…}` in fondo, `tests/carica.js`, `tests/tutti.js` (`LENTI`), `src/manifest.json` (posizione di `28k`), `motori/CLAUDE.md`.

## Decisioni

1. **Schema a estensioni**, come già fanno i motori «base + espansioni». `28k` resta `const VEN=(()=>{…})()` con mappa, tempo, movimento, `ordina`, `passo`, `fai`, `scegli`, `salva/apri/migra`. Espone in più `VEN._`, l'oggetto con gli aiutanti interni che servono agli altri file (`L, TU, part, rnd, relaz, chiave, cella, mappa, dist, aggiungi, togliUomini, nuovaP, …`: solo quelli che servono davvero).
2. **I file nuovi**, in quest'ordine dopo `28k` nel manifest:
   - `28ka-ven-ia.js`: `pensa`, `oraNuova`, `giornoNuovo`, guerre e paci, `soccorre`, scontri tra IA (`giraScontro`, `chiudiScontro`).
   - `28kb-ven-economia.js`: prezzi, mercato, paga, viveri, rendite, botteghe, `rinnova`, incarichi.
   - `28kc-ven-scontro.js`: `schieramenti`, `campo`, `esito`, `auto`, assedio (`fasi`, `assedioStato`), tornei e arena.
   - `28kd-ven-corte.js`: diplomazia (`proposta`, alleanze), regno (V4), lealtà, feudi, vittoria.
   - `28ke-ven-gente.js`: gradimento, signori (`memSig`, confidenza), voci (`voce/parla/accoda`, `EFF_VOCI`), incarichi personali.
   Ogni file: `Object.assign(VEN,(()=>{const{L,TU,…}=VEN._;…;return{…}})());`. Le funzioni che servono da un altro file si chiamano come `VEN.nome(...)`: è una chiamata a runtime, quindi l'ordine di caricamento conta solo per le definizioni.
3. **Nomi pubblici identici** a oggi: nessuna funzione cambia firma. Le chiamate incrociate (es. `passo` → `oraNuova`) diventano `VEN.oraNuova(s)`.
4. **La guardia `module.exports` resta in fondo a `28k`**: gli altri file aggiungono funzioni allo stesso oggetto, quindi chi fa `require` di `28k` vede tutto dopo il caricamento.
5. **Elenco dei file per i test, letto dal manifest.** `tests/carica.js` esporta `VEN_FILES`: i file di `src/js/motori/` che cominciano con `27a-avv-dadi` o con `28j`–`28n`, nell'ordine di `src/manifest.json`. Tutti i test e gli strumenti della Ventura (`grep -rln 28k-ven-mondo tests tools`) usano quello al posto del loro elenco `F`. Così un file nuovo entra nei test da solo, e nessuno tocca più `carica.js`.
6. **Test lenti per nome**: in `tests/tutti.js` aggiungi `'_lento'` a `LENTI`. I passi successivi chiamano `tests/test_ven_pNN_lento.js` i loro test lunghi, senza toccare `tutti.js`.
7. **Impronta** (`tools/avventura/impronta.js`):
   - per i semi 3, 11 e 29 fa giocare `bot_ven.js` 60 giorni e stampa lo sha1 di `VEN.salva(s)`, più l'esito di `VCAM.risolvi` su 5 schede di battaglia fisse;
   - mette a `false` ogni voce di `VDAT.ACCESO`, se esiste (arriverà col passo 04); `--acceso nome` ne accende una;
   - `--controlla` confronta con `docs/passi/impronte/base.txt` e con gli altri file della cartella (uno per interruttore acceso, li aggiungono i rilasci) ed esce con errore se qualcosa cambia.
8. **Salvataggi della prima edizione**: `tests/fixture/ven/` contiene 6 salvataggi, dei semi 3, 11 e 29 ai giorni 0 e 45, giocati da `bot_ven.js` su `main` **prima** dello spezzamento. Servono a tutti i rilasci per provare che le partite vecchie si aprono ancora.

## Ordine di lavoro

1. Su `main`: `impronta.js`, `base.txt`, i salvataggi di prova e `test_ven_p01.js` (un commit).
2. Spostare un blocco per volta, un commit per file nuovo, con `impronta.js --controlla` dopo ognuno.
3. `carica.js` (`VEN_FILES`), i test e gli strumenti che lo usano; `LENTI`.
4. Manifest, `npm run struttura`, `npm run mappa`.

## Prove

**Il cancello è l'impronta.** Prima di toccare il codice, su `main`, crea `impronta.js` e salva la sua uscita in `docs/passi/impronte/base.txt`. Dopo ogni spostamento, `node tools/avventura/impronta.js --controlla` deve dire OK.
- `tests/test_ven_p01.js`: apre i 6 salvataggi di `tests/fixture/ven/`, li fa avanzare 5 giorni col bot, li risalva e li riapre senza errori.
- `npm test -- ven_` verdi, lenti compresi.
- Scenari browser verdi: `ventura`, `ventura_stanza`, `ventura_assedio`, `ventura_regno`.

## Fuori scopo

Rinominare funzioni, cambiare numeri, «sistemare» codice strano: se qualcosa sembra un errore si annota in fondo alla PR, non si corregge.

## Fatto quando

Nessun file della Ventura nei motori supera 35 KB; impronta identica; test e scenari verdi; salvataggi della prima edizione nel repo.
