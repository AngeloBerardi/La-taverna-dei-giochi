---
passo: 04
titolo: Ganci, interruttori e file vuoti
fase: 2
area: fondamenta
dopo: [01, 02, 03]
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
  - src/js/motori/28jb-ven-dati-campo.js
  - src/js/motori/28jc-ven-dati-mondo.js
  - src/js/motori/28kf-ven-anteprima.js
  - src/js/motori/28kg-ven-geografia.js
  - src/js/motori/28kh-ven-stagioni.js
  - src/js/motori/28ki-ven-regni.js
  - src/js/motori/28kj-ven-rango.js
  - src/js/motori/28kk-ven-strategia.js
  - src/js/motori/28kl-ven-sfida.js
  - src/js/motori/28km-ven-sorte.js
  - src/js/motori/28kn-ven-eserciti.js
  - src/js/motori/28ko-ven-feudi.js
  - src/js/motori/28kp-ven-affari.js
  - src/js/motori/28kq-ven-crocevia.js
  - src/js/motori/28kr-ven-accensioni.js
  - src/js/motori/28la-ven-consiglio.js
  - src/manifest.json
  - src/js/app/24hw-ventura.js
  - src/js/app/24hwa-ven-barre.js
  - src/js/app/24hwb-ven-luoghi.js
  - src/js/app/24hwc-ven-gente.js
  - src/js/app/24hwd-ven-scontro.js
  - src/js/app/24hwe-ven-tv.js
  - src/js/app/24hv-ven-campo.js
  - scripts/struttura.js
  - docs/moduli/ventura.md
  - docs/ARCHITECTURE.md
---

# Passo 04 — Ganci, interruttori e file vuoti

**In breve.** Prepara il terreno a tutti gli altri passi:
- **ganci** a cui le novità si attaccano senza toccare il nucleo;
- **interruttori** spenti;
- **file vuoti** già al loro posto nel manifest;
- **dati della difficoltà**.

Il gioco non cambia, e l'impronta lo prova. Da qui in poi due passi della stessa fase non toccano mai lo stesso file.

## Scopo

Dopo questo passo ogni novità del mondo vive in un file suo e si attacca con un gancio, la vista legge i regni da un punto solo, e tutto ciò che cambia il gioco nasce spento. Così i passi delle fasi seguenti lavorano in parallelo senza pestarsi i piedi.

## Leggi prima

`docs/passi/LEGGIMI.md`. Dopo il passo 01: il `return` di ogni `28k*`, `VEN.nuovo`, `giornoNuovo` e `oraNuova` (`28ka`), `VEN.campo` ed `esito` (`28kc`), `VEN.scegli` (incontri), `fazioni`, `nomeF` e `colFaz`. Nella vista: `grep -n "FAZ\|REGNI\|colFaz" src/js/app/24hv*.js src/js/app/24hw*.js` ed `entra` in `24hw`. (`24hu` ha una sola lettura: la converte il passo 05, che in questa fase possiede quel file.) Gli altri punti li trovi con `grep -n` quando servono.

## Decisioni

1. **Ganci** (in `28k`): `VEN.aggancia(nome,fn)` registra un ascoltatore; `VEN.ganci(nome,...arg)` li chiama nell'ordine di registrazione, cioè nell'ordine del manifest.
   | Gancio | Dove si chiama | Cosa può fare l'ascoltatore |
   |---|---|---|
   | `nuovo(s,opz)` | in fondo a `VEN.nuovo` | sistemare il mondo appena nato (regni, partenza, calendario) |
   | `ora(s)` | ogni ora di gioco, dopo il nucleo | eventi di strada |
   | `giorno(s)` | in fondo a `giornoNuovo` | stagioni, economia, unificazione, eserciti |
   | `scheda(s,sc)` | in fondo a `VEN.campo` | aggiungere campi alla scheda della battaglia; se restituisce un oggetto, quello sostituisce la scheda (duello) |
   | `esito(s,riep)` | all'inizio di `esito` | se restituisce un risultato, l'esito normale non si fa (duello) |
   | `premio(s,riep,out)` | in `esito`, prima di applicare `out` | cambiare premi e prigionieri |
   | `battaglia(s,riep,out)` | in fondo a `esito` | memoria, esperienza |
   | `anteprima(s,a)` | in fondo a `VEN.anteprima` | aggiungere rango, stima, scelte |
   | `scelta(s,o)` | in `VEN.scegli`, per una scelta che il nucleo non conosce | gestirla; restituisce `{s}`, `{err}` o `undefined` |
   | `azione(s,z)` | in `VEN.fai`, subito dopo il controllo «Prima rispondi» | se restituisce `{s}` o `{err}`, quello è il risultato (azioni nuove di feudi e affari) |
   | `fatto(s,z,r)` | in `VEN.fai`, dopo un'azione del nucleo riuscita (`r.s`) | ritocchi dopo l'azione (`aduna`, `recluta`, `razzia`); il risultato non cambia. Per avere un solo punto d'uscita, il corpo di oggi di `fai` diventa una funzione interna e `fai` la avvolge |
   | `effetto(s,e)` | in `applicaVoce`, per un `e.k` che il nucleo non conosce | applicare un effetto nuovo delle scene; il nome entra in `VEN.EFF_VOCI` con `push` |
   | `scontro(s,sc)` | in `oraNuova`, appena nasce uno scontro tra IA, dopo gli alleati | aggiungere id a `sc.a`/`sc.b` (e ricalcolare `fa`/`fb`) |
   | `incontro(s,inc)` | dove nasce `s.incontro` di tipo `nemico` (`contatti`) | aggiungere id a `inc.pid`/`inc.all` |
   | `luogo(s,l,ev)` | `ev:'razzia'` dove si mette `l.sacc` (IA e `fai`), `ev:'conquista'` in fondo a `conquista` | danni agli edifici, confische |
   | `vedi(s)` | in fondo a `oraNuova` | eventi di strada che dipendono dalla posizione di chi gioca |
   Gli ascoltatori sono puri e ripetibili come il resto. Ognuno controlla da sé il suo interruttore (o `s.geo`), così a interruttori spenti non cambia nulla.
2. **Punti d'estensione**: funzioni di `VEN` che il nucleo chiama **sempre** come `VEN.nome`, così un file successivo le può sostituire. Chi le sostituisce chiama la versione precedente e la compone: `const prima=VEN.molt;VEN.molt=(s,k,c)=>prima(s,k,c)*mio(s,k,c)`.
   - `VEN.mappaDi(s)` → `mappa(s.seme)`. Tutte le chiamate `mappa(s.seme)` di `28k*` diventano `VEN.mappaDi(s)`.
   - `VEN.regni(s)`, `VEN.rg(s,f)` (`{id,nome,breve,col,col2,re,cult}`) e `VEN.cult(s,f)`, costruiti sopra `fazioni`, `nomeF`, `colFaz`, `D.FAZ` e `D.REGNI`; oggi `cult(s,f)===f`. Tutte le letture dirette di `D.FAZ[…]` e `D.REGNI` nei motori e nelle viste `24hv` e `24hw*` passano da qui.
   - `VEN.molt(s,k,ctx)` → 1, moltiplicato nei punti `viveri` (consumo giornaliero, `{p}`), `marcia` (velocità, `{p,i}` con `i` cella: **0 vuol dire non percorribile**), `prezzo` (`{lid,m,compra}`), `paga`, `rendita` (`{lid}`), `reclute` (`{lid}`), `guerra` (probabilità che l'IA dichiari guerra) e `forza` (`{p}`, forza nei conti automatici tra IA). x·1 = x, quindi l'impronta non cambia.
   - `VEN.probCattura(s,riep)` → 0,5, la probabilità di oggi di catturare il signore vinto.
   - `VEN.decidi(s,p,M)` → la meta di un gruppo dell'IA: è l'intero corpo di oggi di `pensa` (carovane, predoni, rivale, signori), che `oraNuova` chiama sempre come `VEN.decidi`. Se oggi la logica è sparsa, raccoglila in questa funzione senza cambiarla.
   - `VEN._` espone anche `leva`, `nuovaP`, `vicinoOk`, `vai`, `rimuovi`, `sconfitta`, `memSig`, `inCompagnia`, `gradDi` e `relaz`, che servono ai passi 40–44.
   - `VEN.vittoria(s)` resta il punto in cui si controllano le vittorie (chiamato come `VEN.vittoria`).
   - `VEN.opz(s)` → `s.opz` unito a `VDAT.OPZ0`. `VEN.opzione(s,{k,v})` è l'azione che cambia in partita un'opzione elencata in `VDAT.OPZ_PARTITA`.
   - `VEN.nuovo(seme,o)` accetta `o.opz` e lo salva in `s.opz`. Se `o.opz.geo===2`, oppure se `VDAT.ACCESO.mondo2` è acceso, mette `s.geo=2` **prima** di generare la mappa.
   - `VEN.anteprima(s)` in `28kf` restituisce `{}` passato dal gancio (la riempie il passo 09).
3. **Interruttori e dati del mondo** in `28jc-ven-dati-mondo.js`:
   - `VDAT.ACCESO={grandi:false,consiglio:false,mondo2:false,eserciti:false}`;
   - `VDAT.OPZ0={diff:'condottiero',eco:'giusta',cons:'normali',nem:0,unif:'normale',stag:'normali',fer:'normali',mondo:'ampio',taglia:'media',nebbia:false}`;
   - `VDAT.OPZ_PARTITA=['taglia']`;
   - `VDAT.DIFF`, la tabella qui sotto.

   **`VDAT.DIFF`** (numeri qui; i preset cambiano tutte le leve tranne `mondo` e `taglia`):
   | Leva | Valori | Effetto |
   |---|---|---|
   | `eco` | generosa / giusta / avara | prezzi ×0,85/1/1,2 · paghe ×0,85/1/1,15 · rendite ×1,2/1/0,85 |
   | `cons` | leggeri / normali / duri | viveri e foraggio ×0,8/1/1,25 |
   | `nem` | −1 / 0 / +1 | rango medio dei signori; predoni ×0,7/1/1,4 |
   | `unif` | lenta / normale / rapida | probabilità di accorpamento ×0,6/1/1,6 |
   | `stag` | miti / normali / rigide | scarto stagionale ×0,5/1/1,5 |
   | `fer` | indulgenti / normali / ferro | indulgenti: il capitano non muore mai; ferro: tre sconfitte gravi e la campagna finisce, un solo salvataggio |
   | `mondo` | ampio / vasto | lato della mappa nuova 192 / 240 |
   | `taglia` | piccola / media / grande | 40 / 70 / 110 uomini in campo per lato |
   Preset: **recluta** = generosa, leggeri, −1, lenta, miti, indulgenti; **condottiero** = `OPZ0`; **leggenda** = avara, duri, +1, rapida, rigide, ferro.
4. **File vuoti già al loro posto nel manifest**. Ognuno ha solo un commento in testa («passo NN: cosa conterrà») e, se serve, lo scheletro che lo collega. Così nessun altro passo tocca il manifest.
   - Dopo `28ja`: `28jb-ven-dati-campo.js`, `28jc-ven-dati-mondo.js`.
   - Dopo `28ke`: `28kf-ven-anteprima.js`, `28kg-ven-geografia.js`, `28kh-ven-stagioni.js`, `28ki-ven-regni.js`, `28kj-ven-rango.js`, `28kk-ven-strategia.js`, `28kl-ven-sfida.js`, `28km-ven-sorte.js`, `28kn-ven-eserciti.js`, `28ko-ven-feudi.js`, `28kp-ven-affari.js`, `28kq-ven-crocevia.js`, `28kr-ven-accensioni.js`.
   - Dopo `28l`: `28la-ven-consiglio.js` (`const VCONS={}`).
5. **Interruttori di prova**: in `entra` (`24hw`), `?ven=grandi,consiglio,mondo2,eserciti` accende in memoria solo i nomi di quell'elenco, per la sessione. Mai salvati.
6. **Motori ripetibili su ogni telefono.** In compagnia ogni telefono simula da sé, quindi un risultato diverso all'ultima cifra desincronizza la partita. In `scripts/struttura.js` aggiungi un controllo che fallisce se un file `src/js/motori/28[j-n]*-ven-*.js` usa una di queste funzioni: `Math.pow`, `Math.exp`, `Math.log*`, le trigonometriche, `Math.hypot`, `Math.cbrt`, `**`. Vanno bene `Math.sqrt`, `floor`, `round`, `min`, `max` e `abs`. Se il codice di oggi ne usa qualcuna, elencala nella PR e lasciala com'è.
7. **Documenti**: in `docs/moduli/ventura.md` una sezione «Fondamenta» (file e chi li riempie, ganci, punti d'estensione, interruttori), al massimo 25 righe; poi `npm run mappa`.

## Ordine di lavoro

1. Ganci e loro chiamate (commit, `impronta.js --controlla`).
2. Punti d'estensione, uno per commit, impronta dopo ognuno.
3. `28jc` e `opz`.
4. File vuoti e manifest.
5. Vista: regni da `VEN.rg`, `?ven=`.
6. `struttura.js`.
7. Documenti e `npm run mappa`.

## Prove

Impronta identica (`node tools/avventura/impronta.js --controlla`).

`tests/test_ven_p04.js`:
- (a) due ascoltatori di `giorno` sono chiamati nell'ordine di registrazione;
- (b) un ascoltatore di `scheda` che aggiunge un campo lo ritrova nella scheda di `VEN.campo`; uno che restituisce un oggetto la sostituisce;
- (c) se `esito` restituisce un risultato, l'esito normale è saltato;
- (d) `VEN.molt` sostituito per `viveri` con 2 raddoppia il consumo di un giorno; con `marcia` uguale a 0 la compagnia non si muove;
- (e) `VEN.regni(s)` di un mondo vecchio dà i cinque regni di oggi;
- (f) `VDAT.ACCESO` è tutto falso;
- (g) i salvataggi di `tests/fixture/ven/` si aprono e `VEN.opz(s)` dà i valori di base;
- (h) `VEN.opzione` cambia `taglia` e rifiuta le altre chiavi;
- (i) `scripts/struttura.js` fallisce su un file finto con `Math.pow` (scritto in una cartella temporanea e poi cancellato);
- (j) un ascoltatore di `azione` che risponde a `{a:'prova'}` dà `{s}`, senza ascoltatori `fai` dà «Azione sconosciuta»; un ascoltatore di `fatto` riceve `{a:'riposa'}` riuscita e non `{a:'nulla'}`; un effetto `{t:'ven',k:'prova'}` aggiunto a `VEN.EFF_VOCI` arriva all'ascoltatore di `effetto`;
- (k) `luogo` riceve `'razzia'` quando un signore dell'IA mette a sacco un villaggio e `'conquista'` da `VEN.conquista`.

Scenari `ventura`, `ventura_stanza` e `ventura_regno` verdi; con `?ven=grandi` nessun errore in console.

## Fuori scopo

Qualunque comportamento nuovo. Se un punto d'estensione richiede di cambiare una regola, fermati e scrivilo nella PR.

## Fatto quando

Impronta identica; `test_ven_p04` verde; `npm run passi` dice OK; nessun file dei motori e delle viste `24hv`/`24hw*` della Ventura legge `D.FAZ` o `D.REGNI` fuori da `regni/rg/cult`.
