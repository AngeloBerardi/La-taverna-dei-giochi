# T1 — Niente sfarfallio, un solo caricamento all'ingresso

**Scopo.** I menù non «lampeggiano» più quando arrivano dati o librerie; entrando in stanza si vede un solo caricamento breve, poi la Taverna.

**Leggi prima.** `app/07f-viste-gioco.js` (`render`, `afterRender`), `app/12d-lobby-3d-guscio.js` (`L3D.show`, `avvia`), `app/24ia-crocevia.js` (`dopo`, riga del `VENDOR.load`), `app/24ha-avventura.js` (`Avv.act`, ramo `avv`), `app/01a-vendor.js`.

**Causa (verificata nel codice).**
- `render()` riscrive sempre `#app.innerHTML`: ~490 chiamate. Ogni risposta asincrona (profilo, elenco eroi, salvataggi, libreria 3D, sonda fps, presenza) ridisegna tutto e fa ripartire le animazioni d'ingresso.
- Avventura: `Avv.act('avv')` fa `render()`, poi `await Eroi.carica()`, poi `Ses.leggiElenco()` e un altro `render()`: 2–3 ridisegni con salti di altezza.
- Ingresso: tre scaricamenti in fila, ognuno col suo `render()`: `three` (crocevia), `lobby3d` (`L3D.avvia`), poi la costruzione della scena. Da qui i «due caricamenti».

**Decisioni già prese.**
1. `render()` diventa accodato: più chiamate nello stesso fotogramma = un solo disegno (`requestAnimationFrame`); `render.ora()` (nuova) disegna subito per i pochi punti che misurano il DOM subito dopo.
2. Se l'HTML prodotto è identico all'ultimo scritto, non si tocca `#app` e si chiama solo `afterRender()`.
3. Le animazioni d'ingresso valgono solo al cambio di schermata: `render` calcola la chiave `ui.screen+Plancia.attivo()+(G?G.g:'')`; se è uguale alla precedente mette `data-fermo` su `#app`, e in `css/06-effetti.css` una sola regola `#app[data-fermo] *{animation-duration:0s!important;animation-delay:0s!important}` (escluse le carte `.card.deal`, che `afterRender` anima da sé).
4. Scorrimento conservato: prima di riscrivere si salva `scrollTop` degli elementi con `data-sc` e lo si rimette dopo (mettere `data-sc` su pagina Avventura, elenco giochi, bottega).
5. Un solo caricamento: nuovo `Soglia` (`app/12e-soglia.js`, nuovo) con velo a tutto schermo «Si apre la porta…» (legno e ottone, barra a tre tacche). `Soglia.entra()` aspetta insieme `VENDOR.load('three')`, `L3D.avvia()` e il primo fotogramma della scena (nuovo richiamo `L3D.pronta()` → Promise, da aggiungere in `tools/taverna3d/` e nel guscio); durante l'attesa `render` è sospeso (`Soglia.attesa`), alla fine un solo disegno e dissolvenza di 250 ms. Tetto 6 s: oltre, si entra col falò come oggi.
6. Avventura: `Avv.act('avv')` disegna subito lo scheletro con altezze fisse (righe segnaposto `.avv-vuoto`) e fa un solo `render()` dopo `Promise.all([Eroi.carica(),Ses.leggiElenco()])`.

**Passi.**
1. `07f-viste-gioco.js`: accodamento, confronto dell'HTML, `data-fermo`, `data-sc`. Sostituire con `render.ora()` solo dove un test fallisce.
2. `css/06-effetti.css`: regola `data-fermo`. `css/40-legno-ottone.css`: velo `.sg-velo`.
3. `12e-soglia.js` + manifest; chiamarlo da dove oggi si passa a `ui.screen='room'` in `07a-rete-stanza.js`.
4. `tools/taverna3d/` (`eng.js`): `pronta()`; rigenerare con `python3 tools/taverna3d/mk.py`; `12d`: inoltro.
5. `24ha-avventura.js`: scheletro e render unico.

**Prove.** Scenario browser nuovo `render_stabile`: (a) 20 `render()` di fila → 1 sola scrittura di `#app` (contatore `render.n`); (b) apri Avventura con Firebase simulato lento 300 ms → al massimo 2 scritture, altezza di `#app` che non cala mai; (c) ingresso in stanza → il velo compare una volta sola, nessun `Caricamento…` dopo. `npm run test:browser` verde su tutti gli scenari esistenti.

**Fuori scopo.** Riscrivere le viste a pezzi (DOM incrementale); toccare i motori.

**Fatto quando.** I tre punti delle prove passano; a 390 px passando fra le cinque voci della plancia non si vede nessun lampo; `npm run verifica` verde.
